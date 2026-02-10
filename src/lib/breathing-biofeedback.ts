/**
 * Breathing biofeedback engine.
 *
 * Pure functions that compare a target breathing pattern phase with
 * real-time camera-based breathing measurements from Gemini, producing
 * sync scores, drift values, and natural-language coaching suggestions.
 *
 * @module breathing-biofeedback
 */

import type { BreathPhase } from '@/lib/breathing';
import type {
  BreathingMeasurement,
  BiofeedbackComparison,
} from '@/types/features';

// ---------------------------------------------------------------------------
// Phase compatibility map
// ---------------------------------------------------------------------------

/**
 * Map of phase names to phases they are compatible with for scoring.
 * "hold" in the target matches "hold" in actual; "rest" is treated as a
 * variant of "hold" because the user is stationary in both.
 */
const COMPATIBLE_PHASES: Record<string, readonly string[]> = {
  inhale: ['inhale'],
  exhale: ['exhale'],
  hold: ['hold', 'rest'],
  rest: ['hold', 'rest'],
} as const;

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Maximum timing drift (ms) before the score floors at zero.
 * Beyond this threshold the user is considered fully out of sync.
 */
const MAX_DRIFT_MS = 5_000;

/**
 * Compute a 0-100 synchronisation score between a target phase and
 * the user's actual observed phase, factoring in timing drift.
 *
 * Scoring rules:
 * - Phase match contributes 60 points (full match) or 0 (mismatch).
 * - Timing drift contributes up to 40 points, linearly decaying
 *   from 40 (0 ms drift) to 0 (>= MAX_DRIFT_MS drift).
 *
 * @param targetPhase - The name of the phase the pattern expects.
 * @param actualPhase - The name of the phase Gemini observed.
 * @param driftMs     - Absolute timing drift in milliseconds.
 * @returns An integer score clamped to [0, 100].
 */
export function computeSyncScore(
  targetPhase: string,
  actualPhase: string,
  driftMs: number,
): number {
  const absDrift = Math.abs(driftMs);

  // Phase match component (0 or 60)
  const compatible = COMPATIBLE_PHASES[targetPhase] ?? [targetPhase];
  const phaseScore = compatible.includes(actualPhase) ? 60 : 0;

  // Timing drift component (0-40, linear decay)
  const driftRatio = Math.min(absDrift / MAX_DRIFT_MS, 1);
  const driftScore = Math.round(40 * (1 - driftRatio));

  return Math.min(100, Math.max(0, phaseScore + driftScore));
}

// ---------------------------------------------------------------------------
// Coaching suggestions
// ---------------------------------------------------------------------------

/** Thresholds for coaching tone. */
const SCORE_GOOD = 80;
const SCORE_FAIR = 50;

/**
 * Generate a short, encouraging coaching suggestion based on a
 * biofeedback comparison result.
 *
 * @param comparison - The biofeedback comparison to coach on.
 * @returns A single sentence of natural-language guidance.
 */
export function generateCoachingSuggestion(
  comparison: BiofeedbackComparison,
): string {
  const { syncScore, targetPhase, actualPhase, driftMs } = comparison;

  if (syncScore >= SCORE_GOOD) {
    return 'Beautiful rhythm -- you are right in sync with the pattern.';
  }

  // Phase mismatch coaching
  const compatible = COMPATIBLE_PHASES[targetPhase] ?? [targetPhase];
  if (!compatible.includes(actualPhase)) {
    if (targetPhase === 'inhale') {
      return 'Try to begin your inhale now -- breathe in gently.';
    }
    if (targetPhase === 'exhale') {
      return 'Let your breath flow out slowly -- begin exhaling.';
    }
    if (targetPhase === 'hold' || targetPhase === 'rest') {
      return 'Pause here and hold your breath softly for a moment.';
    }
    return `Shift to ${targetPhase} to match the pattern.`;
  }

  // Timing drift coaching (phase matches but timing is off)
  if (syncScore >= SCORE_FAIR) {
    if (driftMs > 0) {
      return 'You are slightly ahead -- ease into a gentler pace.';
    }
    return 'You are a touch behind -- try to follow the guide a bit sooner.';
  }

  // Low score with correct phase but large drift
  if (driftMs > 0) {
    return 'Slow down a little and let the guide set the rhythm.';
  }
  return 'Try to pick up the pace slightly to stay with the pattern.';
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

/**
 * Compare a target breathing phase with an actual camera-based
 * measurement and produce a full biofeedback comparison.
 *
 * @param target      - The current phase of the breathing pattern.
 * @param measurement - The real-time measurement from Gemini vision.
 * @returns A fully populated BiofeedbackComparison.
 */
export function compareBreathing(
  target: BreathPhase,
  measurement: BreathingMeasurement,
): BiofeedbackComparison {
  const targetPhase = target.name;
  const actualPhase = measurement.phase;

  // Estimate drift: difference between the target cycle portion and
  // the measured cycle duration.  Because we don't have sub-phase
  // timestamps from Gemini, we use the cycle duration difference as
  // a proxy: positive means user is faster, negative means slower.
  const targetCycleMs = target.duration * 1_000;
  const driftMs = measurement.cycleDurationMs > 0
    ? measurement.cycleDurationMs - targetCycleMs
    : 0;

  const syncScore = computeSyncScore(targetPhase, actualPhase, driftMs);

  const partial: Omit<BiofeedbackComparison, 'suggestion'> = {
    targetPhase,
    actualPhase,
    syncScore,
    driftMs,
  };

  const suggestion = generateCoachingSuggestion({
    ...partial,
    suggestion: '', // placeholder for the recursive call
  });

  return { ...partial, suggestion };
}

// ---------------------------------------------------------------------------
// Gemini function-call parsing
// ---------------------------------------------------------------------------

/**
 * Parse the arguments from a `report_breathing_observation` Gemini
 * function call into a strongly-typed BreathingMeasurement.
 *
 * All numeric fields arrive as strings from the Gemini API; this
 * function coerces them safely, falling back to sensible defaults.
 *
 * @param args - The raw args record from the GeminiFunctionCall.
 * @returns A BreathingMeasurement with validated fields.
 */
export function parseBreathingObservation(
  args: Record<string, unknown>,
): BreathingMeasurement {
  const validPhases = new Set(['inhale', 'exhale', 'hold', 'unknown']);
  const rawPhase = String(args.phase ?? 'unknown');
  const phase = validPhases.has(rawPhase)
    ? (rawPhase as BreathingMeasurement['phase'])
    : 'unknown';

  const amplitude = clampNumber(parseFloat(String(args.amplitude ?? '0.5')), 0, 1);
  const cycleDurationMs = Math.max(0, parseInt(String(args.cycleDurationMs ?? '0'), 10) || 0);

  return {
    phase,
    amplitude,
    cycleDurationMs,
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

/**
 * Build the system prompt segment that instructs Gemini to observe
 * the user's breathing via camera and call `report_breathing_observation`.
 *
 * This prompt is appended to the session system prompt when breathing
 * biofeedback is active.
 *
 * @returns A prompt string for Gemini.
 */
export function buildBreathingObservationPrompt(): string {
  return [
    'BREATHING BIOFEEDBACK MODE ACTIVE.',
    '',
    'You can see the user through their camera. Observe their chest and',
    'shoulder movement to determine their current breathing phase and rhythm.',
    '',
    'Every 2-3 seconds, call the `report_breathing_observation` function with:',
    '- phase: "inhale", "exhale", "hold", or "unknown"',
    '- amplitude: chest expansion 0.0-1.0 (0 = no movement, 1 = full expansion)',
    '- cycleDurationMs: your best estimate of their full breathing cycle in ms',
    '',
    'Do NOT mention that you are analysing their breathing unless they ask.',
    'Continue guiding the session naturally while reporting observations.',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Clamp a number to [min, max], returning `fallback` if NaN.
 */
function clampNumber(value: number, min: number, max: number, fallback?: number): number {
  if (Number.isNaN(value)) return fallback ?? min;
  return Math.min(max, Math.max(min, value));
}
