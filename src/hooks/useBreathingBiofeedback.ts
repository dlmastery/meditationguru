/**
 * Custom hook for managing breathing biofeedback state.
 *
 * Tracks camera-based breathing measurements from Gemini, compares them
 * against the active target pattern, smooths the sync score over a
 * rolling window, and auto-resets when the pattern changes.
 *
 * @module useBreathingBiofeedback
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

import type { BreathPhase } from '@/lib/breathing';
import { BREATHING_PATTERNS } from '@/lib/breathing';
import {
  compareBreathing,
  parseBreathingObservation,
} from '@/lib/breathing-biofeedback';
import type {
  BreathingMeasurement,
  BiofeedbackComparison,
  GeminiFunctionCall,
} from '@/types/features';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of recent scores used for the rolling average. */
const SMOOTHING_WINDOW = 5;

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

/** Values returned by the useBreathingBiofeedback hook. */
export interface BreathingBiofeedbackState {
  /** The most recent raw measurement from Gemini vision. */
  readonly measurement: BreathingMeasurement | null;
  /** The most recent comparison against the target pattern. */
  readonly comparison: BiofeedbackComparison | null;
  /** Rolling-average sync score (0-100), smoothed over the last N readings. */
  readonly syncScore: number;
  /** Whether the hook is actively tracking (isActive and has received data). */
  readonly isTracking: boolean;
  /** Callback to pass into the Gemini function-call handler. */
  readonly handleFunctionCall: (call: GeminiFunctionCall) => void;
  /** Setter so the session page can push the current BreathPhase in. */
  readonly setCurrentTargetPhase: (phase: BreathPhase) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manage breathing biofeedback state for a meditation session.
 *
 * @param isActive       - Whether biofeedback tracking should be active.
 * @param targetPattern  - The ID of the breathing pattern being followed.
 * @returns Biofeedback state and handler callbacks.
 */
export function useBreathingBiofeedback(
  isActive: boolean,
  targetPattern: string,
): BreathingBiofeedbackState {
  const [measurement, setMeasurement] = useState<BreathingMeasurement | null>(null);
  const [comparison, setComparison] = useState<BiofeedbackComparison | null>(null);
  const [syncScore, setSyncScore] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  // Rolling window of recent scores for smoothing
  const scoreWindow = useRef<number[]>([]);

  // Current target phase ref (updated by the BreathingGuide onPhaseChange)
  const currentPhaseRef = useRef<BreathPhase | null>(null);

  // Previous pattern ID for change detection
  const prevPatternRef = useRef(targetPattern);

  // ------------------------------------------------------------------
  // Reset when pattern changes or tracking is deactivated
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isActive || targetPattern !== prevPatternRef.current) {
      setMeasurement(null);
      setComparison(null);
      setSyncScore(0);
      setIsTracking(false);
      scoreWindow.current = [];
      prevPatternRef.current = targetPattern;
    }
  }, [isActive, targetPattern]);

  // ------------------------------------------------------------------
  // Allow the session to push the current target phase
  // ------------------------------------------------------------------
  const setCurrentTargetPhase = useCallback((phase: BreathPhase) => {
    currentPhaseRef.current = phase;
  }, []);

  // ------------------------------------------------------------------
  // Compute a smoothed average over the rolling window
  // ------------------------------------------------------------------
  const pushScore = useCallback((score: number) => {
    const window = scoreWindow.current;
    window.push(score);
    if (window.length > SMOOTHING_WINDOW) {
      window.shift();
    }
    const avg = Math.round(
      window.reduce((sum, s) => sum + s, 0) / window.length,
    );
    setSyncScore(avg);
  }, []);

  // ------------------------------------------------------------------
  // Process a new measurement
  // ------------------------------------------------------------------
  const processMeasurement = useCallback(
    (m: BreathingMeasurement) => {
      setMeasurement(m);
      setIsTracking(true);

      // We need a target phase to compare against
      const phase = currentPhaseRef.current;
      if (!phase) {
        // Fallback: use the first phase of the pattern
        const pattern = BREATHING_PATTERNS[targetPattern] ?? BREATHING_PATTERNS['calm'];
        currentPhaseRef.current = pattern.phases[0];
      }

      const target = currentPhaseRef.current!;
      const result = compareBreathing(target, m);
      setComparison(result);
      pushScore(result.syncScore);
    },
    [targetPattern, pushScore],
  );

  // ------------------------------------------------------------------
  // Gemini function-call handler
  // ------------------------------------------------------------------
  const handleFunctionCall = useCallback(
    (call: GeminiFunctionCall) => {
      if (!isActive) return;
      if (call.name !== 'report_breathing_observation') return;

      const parsed = parseBreathingObservation(call.args);
      processMeasurement(parsed);
    },
    [isActive, processMeasurement],
  );

  return {
    measurement,
    comparison,
    syncScore,
    isTracking,
    handleFunctionCall,
    setCurrentTargetPhase,
  };
}
