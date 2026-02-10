/**
 * Pose correction service for live yoga pose analysis.
 *
 * Provides utilities for building Gemini prompts, parsing analysis results,
 * formatting corrections for speech, and computing alignment scores.
 *
 * @module pose-correction
 */

import type {
  PoseAnalysis,
  PoseCorrection,
  PoseCorrectionConfig,
  Severity,
} from '@/types/features';
import { YOGA_POSES, type YogaPoseId } from './imagen';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default configuration for the pose correction video pipeline. */
export const DEFAULT_POSE_CONFIG: PoseCorrectionConfig = {
  frameRateHz: 1,
  enableSpokenFeedback: true,
  enableVisualOverlay: true,
  correctionThreshold: 1, // maps to 'gentle' (lowest threshold)
} as const;

/**
 * Severity levels ordered by increasing urgency.
 * Used for filtering and score computation.
 */
const SEVERITY_ORDER: Record<Severity, number> = {
  info: 0,
  gentle: 1,
  important: 2,
  critical: 3,
} as const;

/** Score penalty per correction, weighted by severity. */
const SEVERITY_PENALTY: Record<Severity, number> = {
  info: 2,
  gentle: 5,
  important: 15,
  critical: 25,
} as const;

// ---------------------------------------------------------------------------
// Prompt building
// ---------------------------------------------------------------------------

/**
 * Build the prompt sent to Gemini asking it to analyze the user's current
 * yoga pose via the video stream and call `report_pose_analysis`.
 *
 * @param poseId - Identifier of the target yoga pose (key in YOGA_POSES).
 * @param poseName - Human-readable name of the pose.
 * @returns The system-level prompt string for Gemini.
 */
export function buildPosePrompt(poseId: string, poseName: string): string {
  const pose = YOGA_POSES[poseId as YogaPoseId];
  const sanskrit = pose?.sanskrit ?? '';
  const difficulty = pose?.difficulty ?? 'beginner';

  return [
    `You are analyzing the user's yoga pose via their live video feed.`,
    ``,
    `Target pose: ${poseName}${sanskrit ? ` (${sanskrit})` : ''}`,
    `Difficulty: ${difficulty}`,
    ``,
    `Instructions:`,
    `1. Observe the user's body alignment in the current video frame.`,
    `2. Compare their form against the ideal alignment for ${poseName}.`,
    `3. Identify specific body parts that need adjustment (e.g., "left hip", "shoulders", "right knee").`,
    `4. For each correction, provide a clear, encouraging spoken instruction.`,
    `5. Assign a severity to each correction:`,
    `   - "gentle" for minor refinements`,
    `   - "important" for adjustments that affect the pose's benefit`,
    `   - "critical" for issues that risk injury`,
    `6. Compute an overall alignment score from 0 (far off) to 100 (perfect form).`,
    `7. Set isAligned to "true" only if no corrections with severity "important" or "critical" remain.`,
    ``,
    `Call the report_pose_analysis function with your findings.`,
    `Be encouraging and specific. Use body-part names the user can understand.`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

/**
 * Parse raw Gemini function call arguments into a typed `PoseAnalysis`.
 *
 * Gemini returns all values as strings in function call args, so this function
 * handles the necessary type coercions and provides safe defaults.
 *
 * @param functionCallArgs - Raw key/value pairs from Gemini's `report_pose_analysis` call.
 * @returns A fully typed `PoseAnalysis` object.
 */
export function parsePoseAnalysis(
  functionCallArgs: Record<string, unknown>,
): PoseAnalysis {
  const poseName = String(functionCallArgs.poseName ?? 'Unknown Pose');
  const overallScore = clampScore(parseFloat(String(functionCallArgs.overallScore ?? '0')));
  const isAligned = String(functionCallArgs.isAligned).toLowerCase() === 'true';

  let corrections: PoseCorrection[] = [];
  try {
    const raw = typeof functionCallArgs.corrections === 'string'
      ? JSON.parse(functionCallArgs.corrections)
      : functionCallArgs.corrections;

    if (Array.isArray(raw)) {
      corrections = raw.map((c: Record<string, unknown>, idx: number) => ({
        id: `correction-${Date.now()}-${idx}`,
        bodyPart: String(c.bodyPart ?? ''),
        instruction: String(c.instruction ?? ''),
        severity: validateSeverity(String(c.severity ?? 'gentle')),
        timestamp: new Date().toISOString(),
      }));
    }
  } catch {
    // Malformed corrections JSON; return empty array
  }

  return {
    poseId: String(functionCallArgs.poseId ?? ''),
    poseName,
    overallScore,
    corrections,
    isAligned,
    analysisTimestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Speech formatting
// ---------------------------------------------------------------------------

/**
 * Convert a single pose correction into a natural spoken instruction
 * suitable for the guru's voice output.
 *
 * @param correction - The correction to format.
 * @returns A natural-language sentence for the guru to speak.
 */
export function formatCorrectionForSpeech(correction: PoseCorrection): string {
  const prefix = severityPrefix(correction.severity);
  const bodyPart = correction.bodyPart.trim();
  const instruction = correction.instruction.trim();

  if (!bodyPart && !instruction) {
    return 'Let me take another look at your form.';
  }

  if (!instruction) {
    return `${prefix}pay attention to your ${bodyPart}.`;
  }

  if (!bodyPart) {
    return `${prefix}${instruction}`;
  }

  return `${prefix}for your ${bodyPart}, ${instruction}`;
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/**
 * Filter corrections to only include those at or above a given severity threshold.
 *
 * @param corrections - The full list of corrections.
 * @param threshold - Minimum severity level to include.
 * @returns A new array containing only corrections meeting the threshold.
 */
export function filterCorrectionsBySeverity(
  corrections: readonly PoseCorrection[],
  threshold: Severity,
): PoseCorrection[] {
  const minLevel = SEVERITY_ORDER[threshold];
  return corrections.filter((c) => SEVERITY_ORDER[c.severity] >= minLevel);
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Compute an alignment score (0-100) based on the count and severity of corrections.
 *
 * Starts at 100 and deducts points per correction weighted by severity.
 * An empty corrections array yields a perfect 100.
 *
 * @param corrections - The list of active corrections.
 * @returns A clamped integer score between 0 and 100.
 */
export function computeAlignmentScore(corrections: readonly PoseCorrection[]): number {
  if (corrections.length === 0) return 100;

  let penalty = 0;
  for (const correction of corrections) {
    penalty += SEVERITY_PENALTY[correction.severity];
  }

  return clampScore(100 - penalty);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Clamp a numeric value to the 0-100 range and round to an integer. */
function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.round(Math.max(0, Math.min(100, value)));
}

/** Validate that a string is a known Severity; default to 'gentle'. */
function validateSeverity(value: string): Severity {
  const valid: readonly string[] = ['info', 'gentle', 'important', 'critical'];
  return valid.includes(value) ? (value as Severity) : 'gentle';
}

/** Return a conversational prefix based on correction severity. */
function severityPrefix(severity: Severity): string {
  switch (severity) {
    case 'critical':
      return 'Important safety note: ';
    case 'important':
      return 'Try to ';
    case 'gentle':
      return 'Gently ';
    case 'info':
    default:
      return '';
  }
}
