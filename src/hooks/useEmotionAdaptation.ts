/**
 * React hook for managing emotion-adaptive session state.
 *
 * Bridges the pure {@link emotion-engine} functions with React state,
 * providing debounced adaptation, emotion history tracking, and a
 * callback suitable for passing to {@link EnhancedGeminiLiveSession}.
 *
 * @module useEmotionAdaptation
 */

import { useCallback, useRef, useState } from 'react';
import type { EmotionSnapshot, SessionAdaptation } from '@/types/features';
import {
  computeAdaptation,
  shouldAdaptSession,
} from '@/lib/emotion-engine';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of emotion snapshots retained in history. */
const MAX_HISTORY_LENGTH = 20;

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

interface UseEmotionAdaptationReturn {
  /** The most recently accepted emotion snapshot, or null before first detection. */
  readonly currentEmotion: EmotionSnapshot | null;
  /** The active session adaptation computed from the current emotion. */
  readonly adaptation: SessionAdaptation | null;
  /** Rolling window of the last {@link MAX_HISTORY_LENGTH} emotion snapshots. */
  readonly emotionHistory: readonly EmotionSnapshot[];
  /** Whether an adaptation was applied on the most recent emotion event. */
  readonly isAdapting: boolean;
  /**
   * Callback to invoke when a new emotion is detected.
   * Stable reference -- safe to pass directly to Gemini session callbacks.
   */
  readonly handleEmotionDetected: (emotion: EmotionSnapshot) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manage emotion-adaptive session state.
 *
 * @param isActive - When `false`, incoming emotions are ignored. Toggle this
 *   off to pause adaptation without unmounting the session.
 * @returns State and a stable callback for wiring into the Gemini session.
 *
 * @example
 * ```tsx
 * const { currentEmotion, adaptation, handleEmotionDetected } =
 *   useEmotionAdaptation(isSessionActive);
 *
 * // Pass to Gemini session
 * const callbacks = { onEmotionDetected: handleEmotionDetected, ... };
 * ```
 */
export function useEmotionAdaptation(
  isActive: boolean,
): UseEmotionAdaptationReturn {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionSnapshot | null>(
    null,
  );
  const [adaptation, setAdaptation] = useState<SessionAdaptation | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionSnapshot[]>([]);
  const [isAdapting, setIsAdapting] = useState(false);

  // Ref to track the last emotion that triggered an adaptation.
  // Using a ref avoids stale closures in the callback.
  const lastAdaptedEmotionRef = useRef<EmotionSnapshot | null>(null);

  const handleEmotionDetected = useCallback(
    (emotion: EmotionSnapshot) => {
      if (!isActive) {
        return;
      }

      // Always record in history
      setEmotionHistory((prev) => {
        const next = [...prev, emotion];
        if (next.length > MAX_HISTORY_LENGTH) {
          return next.slice(next.length - MAX_HISTORY_LENGTH);
        }
        return next;
      });

      // Check debouncing against last adapted emotion
      const shouldAdapt = shouldAdaptSession(
        emotion,
        lastAdaptedEmotionRef.current,
      );

      if (shouldAdapt) {
        const newAdaptation = computeAdaptation(emotion);
        setCurrentEmotion(emotion);
        setAdaptation(newAdaptation);
        setIsAdapting(true);
        lastAdaptedEmotionRef.current = emotion;
      } else {
        // Update current emotion display but don't trigger adaptation
        setCurrentEmotion(emotion);
        setIsAdapting(false);
      }
    },
    [isActive],
  );

  return {
    currentEmotion,
    adaptation,
    emotionHistory,
    isAdapting,
    handleEmotionDetected,
  };
}
