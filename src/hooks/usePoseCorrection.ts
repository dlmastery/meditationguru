/**
 * Custom hook for managing live pose correction state.
 *
 * Tracks the current pose analysis, accumulated correction history,
 * computed alignment score, and analysis status. Exposes a callback
 * to be wired into the Gemini session's `onPoseCorrection` handler.
 *
 * @module usePoseCorrection
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type {
  PoseAnalysis,
  PoseCorrection,
  PoseCorrectionConfig,
} from '@/types/features';
import {
  DEFAULT_POSE_CONFIG,
  computeAlignmentScore,
  filterCorrectionsBySeverity,
  parsePoseAnalysis,
} from '@/lib/pose-correction';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Return type of the usePoseCorrection hook. */
export interface UsePoseCorrectionReturn {
  /** Current pose analysis from the most recent Gemini response. */
  readonly poseAnalysis: PoseAnalysis | null;
  /** Active corrections filtered by the configured severity threshold. */
  readonly corrections: readonly PoseCorrection[];
  /** Computed alignment score (0-100) for the current analysis. */
  readonly alignmentScore: number;
  /** Whether we are waiting for the first analysis frame. */
  readonly isAnalyzing: boolean;
  /** The latest single correction for toast-style feedback. */
  readonly latestCorrection: PoseCorrection | null;
  /** Full history of corrections accumulated during this session. */
  readonly correctionHistory: readonly PoseCorrection[];
  /**
   * Callback to handle incoming pose corrections from the Gemini session.
   * Wire this into `EnhancedGeminiLiveSession.callbacks.onPoseCorrection`.
   */
  readonly handlePoseCorrections: (corrections: PoseCorrection[]) => void;
  /**
   * Handle a full pose analysis result parsed from Gemini function call args.
   * Use this when you have the raw function call arguments.
   */
  readonly handlePoseAnalysis: (args: Record<string, unknown>) => void;
  /** Reset all state (e.g., when switching poses or ending a session). */
  readonly reset: () => void;
}

// ---------------------------------------------------------------------------
// Severity threshold mapping
// ---------------------------------------------------------------------------

/**
 * Map the numeric correctionThreshold in config to a Severity label.
 * The config uses: 0 = info, 1 = gentle, 2 = important, 3 = critical.
 */
function thresholdToSeverity(threshold: number): 'info' | 'gentle' | 'important' | 'critical' {
  switch (threshold) {
    case 0: return 'info';
    case 1: return 'gentle';
    case 2: return 'important';
    case 3: return 'critical';
    default: return 'gentle';
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manage live pose correction state for a yoga session.
 *
 * @param isActive - Whether pose correction analysis is currently active.
 * @param config - Optional configuration overriding defaults.
 * @returns An object containing the current state and handler callbacks.
 *
 * @example
 * ```tsx
 * const {
 *   poseAnalysis,
 *   corrections,
 *   alignmentScore,
 *   handlePoseCorrections,
 * } = usePoseCorrection(true);
 *
 * // Wire into the Gemini session:
 * const session = new EnhancedGeminiLiveSession({
 *   onPoseCorrection: handlePoseCorrections,
 *   // ...
 * });
 * ```
 */
export function usePoseCorrection(
  isActive: boolean,
  config?: PoseCorrectionConfig,
): UsePoseCorrectionReturn {
  const effectiveConfig = config ?? DEFAULT_POSE_CONFIG;
  const severityThreshold = thresholdToSeverity(effectiveConfig.correctionThreshold);

  const [poseAnalysis, setPoseAnalysis] = useState<PoseAnalysis | null>(null);
  const [correctionHistory, setCorrectionHistory] = useState<PoseCorrection[]>([]);
  const [latestCorrection, setLatestCorrection] = useState<PoseCorrection | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Track whether we have received at least one analysis
  const hasReceivedAnalysis = useRef(false);

  /**
   * Handle incoming corrections from the Gemini session callback.
   * Updates the current analysis state and appends to history.
   */
  const handlePoseCorrections = useCallback(
    (incoming: PoseCorrection[]) => {
      if (!isActive) return;

      if (!hasReceivedAnalysis.current) {
        hasReceivedAnalysis.current = true;
        setIsAnalyzing(false);
      }

      const filtered = filterCorrectionsBySeverity(incoming, severityThreshold);
      const score = computeAlignmentScore(filtered);

      const analysis: PoseAnalysis = {
        poseId: '',
        poseName: '',
        overallScore: score,
        corrections: filtered,
        isAligned: filtered.length === 0,
        analysisTimestamp: new Date().toISOString(),
      };

      setPoseAnalysis(analysis);
      setCorrectionHistory((prev) => [...prev, ...incoming]);

      if (filtered.length > 0) {
        setLatestCorrection(filtered[filtered.length - 1]);
      }
    },
    [isActive, severityThreshold],
  );

  /**
   * Handle raw function call args from Gemini's report_pose_analysis call.
   * Parses the args into a PoseAnalysis and updates state.
   */
  const handlePoseAnalysis = useCallback(
    (args: Record<string, unknown>) => {
      if (!isActive) return;

      if (!hasReceivedAnalysis.current) {
        hasReceivedAnalysis.current = true;
        setIsAnalyzing(false);
      }

      const parsed = parsePoseAnalysis(args);
      const filtered = filterCorrectionsBySeverity(
        parsed.corrections,
        severityThreshold,
      );
      const score = computeAlignmentScore(filtered);

      const analysis: PoseAnalysis = {
        ...parsed,
        corrections: filtered,
        overallScore: score,
        isAligned: filtered.length === 0,
      };

      setPoseAnalysis(analysis);
      setCorrectionHistory((prev) => [...prev, ...parsed.corrections]);

      if (filtered.length > 0) {
        setLatestCorrection(filtered[filtered.length - 1]);
      }
    },
    [isActive, severityThreshold],
  );

  /** Reset all state to initial values. */
  const reset = useCallback(() => {
    setPoseAnalysis(null);
    setCorrectionHistory([]);
    setLatestCorrection(null);
    setIsAnalyzing(false);
    hasReceivedAnalysis.current = false;
  }, []);

  // Derive filtered corrections and score from the current analysis
  const corrections = poseAnalysis
    ? filterCorrectionsBySeverity(poseAnalysis.corrections, severityThreshold)
    : [];
  const alignmentScore = poseAnalysis?.overallScore ?? 0;

  return {
    poseAnalysis,
    corrections,
    alignmentScore,
    isAnalyzing: isActive && !hasReceivedAnalysis.current,
    latestCorrection,
    correctionHistory,
    handlePoseCorrections,
    handlePoseAnalysis,
    reset,
  } as const;
}
