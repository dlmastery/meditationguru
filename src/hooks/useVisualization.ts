/**
 * React hook for managing the guided visualization pipeline.
 *
 * Handles Gemini `generate_visualization` function calls, manages a
 * bounded frame queue, and auto-advances through queued frames on a timer.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  GeminiFunctionCall,
  VisualizationFrame,
  VisualizationState,
} from '@/types/features';
import {
  buildVisualizationFrame,
  createInitialVisualizationState,
  generateVisualizationImage,
  parseVisualizationCommand,
} from '@/lib/visualization-art';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of frames held in the queue to bound memory usage. */
const MAX_QUEUE_SIZE = 5;

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

interface UseVisualizationReturn {
  /** Current visualization pipeline state. */
  readonly state: VisualizationState;
  /** Whether an image is currently being generated. */
  readonly isGenerating: boolean;
  /** Process a Gemini `generate_visualization` function call. */
  readonly handleFunctionCall: (call: GeminiFunctionCall) => void;
  /** Change the active art style. */
  readonly setStyle: (style: VisualizationState['style']) => void;
  /** Toggle visualization on/off. */
  readonly toggle: () => void;
  /** Reset visualization to its initial state and clear the queue. */
  readonly reset: () => void;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

/**
 * Manages the visualization state machine:
 *
 * 1. Receives `generate_visualization` calls from the Gemini session.
 * 2. Kicks off async image generation.
 * 3. Queues completed frames (bounded to {@link MAX_QUEUE_SIZE}).
 * 4. Auto-advances `currentFrame` on a display-duration timer.
 */
export function useVisualization(): UseVisualizationReturn {
  const [state, setState] = useState<VisualizationState>(
    createInitialVisualizationState,
  );
  const [isGenerating, setIsGenerating] = useState(false);

  // Ref mirrors `state` so timer callbacks always see the latest value
  // without triggering effect re-runs.
  const stateRef = useRef(state);
  stateRef.current = state;

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -----------------------------------------------------------------------
  // Frame advancement
  // -----------------------------------------------------------------------

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  /**
   * Pop the next frame off the queue and set it as currentFrame.
   * Schedules itself recursively while frames remain.
   */
  const advanceFrame = useCallback(() => {
    clearAdvanceTimer();

    const current = stateRef.current;
    if (!current.isActive || current.frameQueue.length === 0) return;

    const [next, ...rest] = current.frameQueue;
    const nextState: VisualizationState = {
      ...current,
      currentFrame: next,
      frameQueue: rest,
    };
    setState(nextState);

    // Schedule the next advance after this frame's display duration.
    advanceTimerRef.current = setTimeout(() => {
      advanceFrame();
    }, next.displayDurationMs);
  }, [clearAdvanceTimer]);

  // Whenever the queue grows and there is no current frame, auto-advance.
  useEffect(() => {
    if (
      state.isActive &&
      state.currentFrame === null &&
      state.frameQueue.length > 0
    ) {
      advanceFrame();
    }
  }, [state.isActive, state.currentFrame, state.frameQueue.length, advanceFrame]);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      clearAdvanceTimer();
    };
  }, [clearAdvanceTimer]);

  // -----------------------------------------------------------------------
  // Enqueue a newly generated frame
  // -----------------------------------------------------------------------

  const enqueueFrame = useCallback(
    (frame: VisualizationFrame) => {
      setState((prev) => {
        const trimmedQueue =
          prev.frameQueue.length >= MAX_QUEUE_SIZE
            ? prev.frameQueue.slice(1)
            : prev.frameQueue;

        const updated: VisualizationState = {
          ...prev,
          frameQueue: [...trimmedQueue, frame],
        };

        // If nothing is currently displayed, promote immediately.
        if (prev.currentFrame === null) {
          return {
            ...updated,
            currentFrame: frame,
            frameQueue: trimmedQueue,
          };
        }

        return updated;
      });
    },
    [],
  );

  // Schedule auto-advance when a frame is newly promoted as currentFrame
  // and there are more frames waiting.
  useEffect(() => {
    if (
      state.isActive &&
      state.currentFrame !== null &&
      advanceTimerRef.current === null &&
      state.frameQueue.length > 0
    ) {
      advanceTimerRef.current = setTimeout(() => {
        advanceFrame();
      }, state.currentFrame.displayDurationMs);
    }
  }, [state.isActive, state.currentFrame, state.frameQueue.length, advanceFrame]);

  // -----------------------------------------------------------------------
  // Handle Gemini function calls
  // -----------------------------------------------------------------------

  const handleFunctionCall = useCallback(
    (call: GeminiFunctionCall) => {
      if (call.name !== 'generate_visualization') return;
      if (!stateRef.current.isActive) return;

      const { prompt, style, narrativeText } = parseVisualizationCommand(
        call.args,
      );

      setIsGenerating(true);

      generateVisualizationImage(prompt, style)
        .then((imageUrl) => {
          if (imageUrl) {
            const frame = buildVisualizationFrame(
              imageUrl,
              prompt,
              narrativeText,
              style,
            );
            enqueueFrame(frame);
          }
        })
        .catch((err) => {
          console.error('[useVisualization] Generation error:', err);
        })
        .finally(() => {
          setIsGenerating(false);
        });
    },
    [enqueueFrame],
  );

  // -----------------------------------------------------------------------
  // Style, toggle, reset
  // -----------------------------------------------------------------------

  const setStyle = useCallback((style: VisualizationState['style']) => {
    setState((prev) => ({ ...prev, style }));
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => {
      const nextActive = !prev.isActive;
      if (!nextActive) {
        clearAdvanceTimer();
        return {
          ...prev,
          isActive: false,
        };
      }
      return { ...prev, isActive: true };
    });
  }, [clearAdvanceTimer]);

  const reset = useCallback(() => {
    clearAdvanceTimer();
    setState(createInitialVisualizationState());
  }, [clearAdvanceTimer]);

  return {
    state,
    isGenerating,
    handleFunctionCall,
    setStyle,
    toggle,
    reset,
  };
}
