/**
 * Breathing biofeedback overlay component.
 *
 * Displays a circular sync-score gauge, drift indicator, coaching
 * suggestion, and an "In Sync!" badge. Designed to sit directly
 * below the BreathingGuide component with glass-morphism styling.
 *
 * @module BreathingBiofeedback
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';

import type {
  BiofeedbackComparison,
  BreathingMeasurement,
} from '@/types/features';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BreathingBiofeedbackProps {
  /** Current comparison result (null before first measurement). */
  readonly comparison: BiofeedbackComparison | null;
  /** Latest raw measurement (null before first measurement). */
  readonly measurement: BreathingMeasurement | null;
  /** Whether biofeedback tracking is active. */
  readonly isActive: boolean;
  /** Display name of the target pattern (e.g. "Box Breathing"). */
  readonly targetPatternName: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GAUGE_SIZE = 80;
const GAUGE_STROKE = 6;
const GAUGE_RADIUS = (GAUGE_SIZE - GAUGE_STROKE) / 2;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

/** Score thresholds for colour coding. */
const THRESHOLD_GREEN = 60;
const THRESHOLD_AMBER = 30;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return a colour string based on the sync score.
 *
 * @param score - Sync score 0-100.
 * @returns A CSS colour string.
 */
function scoreColor(score: number): string {
  if (score >= THRESHOLD_GREEN) return '#4ade80'; // green-400
  if (score >= THRESHOLD_AMBER) return '#fbbf24'; // amber-400
  return '#f87171'; // red-400
}

/**
 * Format drift milliseconds for display.
 *
 * @param driftMs - Drift in milliseconds (positive = ahead, negative = behind).
 * @returns A formatted string like "+320 ms" or "-120 ms".
 */
function formatDrift(driftMs: number): string {
  const sign = driftMs >= 0 ? '+' : '';
  return `${sign}${Math.round(driftMs)} ms`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BreathingBiofeedback({
  comparison,
  measurement,
  isActive,
  targetPatternName,
}: BreathingBiofeedbackProps) {
  if (!isActive) return null;

  const score = comparison?.syncScore ?? 0;
  const color = scoreColor(score);
  const dashOffset =
    GAUGE_CIRCUMFERENCE - (GAUGE_CIRCUMFERENCE * score) / 100;

  const hasData = comparison !== null && measurement !== null;

  return (
    <motion.div
      className="glass rounded-2xl px-4 py-3 flex items-center gap-4 max-w-sm mx-auto"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.4 }}
    >
      {/* ---- Circular gauge ---- */}
      <div className="relative flex-shrink-0" style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}>
        <svg
          width={GAUGE_SIZE}
          height={GAUGE_SIZE}
          viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={GAUGE_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={GAUGE_STROKE}
          />
          {/* Score arc */}
          <motion.circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={GAUGE_RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={GAUGE_STROKE}
            strokeLinecap="round"
            strokeDasharray={GAUGE_CIRCUMFERENCE}
            animate={{ strokeDashoffset: hasData ? dashOffset : GAUGE_CIRCUMFERENCE }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-mono font-semibold" style={{ color }}>
            {hasData ? score : '--'}
          </span>
        </div>
      </div>

      {/* ---- Text content ---- */}
      <div className="flex-1 min-w-0">
        {/* Pattern label + badge row */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-white/50 truncate">
            {targetPatternName}
          </span>

          {/* "In Sync!" badge */}
          <AnimatePresence>
            {hasData && score > 80 && (
              <motion.span
                key="sync-badge"
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 whitespace-nowrap"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25 }}
              >
                In Sync!
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Coaching suggestion */}
        <AnimatePresence mode="wait">
          {hasData && comparison.suggestion && (
            <motion.p
              key={comparison.suggestion}
              className="text-xs text-white/70 leading-snug line-clamp-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {comparison.suggestion}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Drift indicator */}
        {hasData && (
          <p className="text-[10px] text-white/40 mt-1 font-mono">
            drift: {formatDrift(comparison.driftMs)}
          </p>
        )}

        {/* Waiting state */}
        {!hasData && (
          <p className="text-xs text-white/40 italic">
            Observing your breathing...
          </p>
        )}
      </div>
    </motion.div>
  );
}
