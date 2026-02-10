/**
 * Overlay panel displaying live yoga pose analysis results.
 *
 * Shows a circular alignment score indicator (color-coded by performance),
 * a list of active corrections with severity icons and body-part labels,
 * and an animated success state when the user achieves correct alignment.
 *
 * @module PoseCorrection
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type {
  PoseAnalysis,
  PoseCorrection as PoseCorrectionType,
  PoseCorrectionConfig,
  Severity,
} from '@/types/features';
import { DEFAULT_POSE_CONFIG } from '@/lib/pose-correction';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PoseCorrectionProps {
  /** Current pose analysis from the Gemini pipeline. `null` when no data yet. */
  readonly poseAnalysis: PoseAnalysis | null;
  /** Whether the pose correction system is actively analyzing. */
  readonly isActive: boolean;
  /** Optional configuration; defaults to `DEFAULT_POSE_CONFIG`. */
  readonly config?: PoseCorrectionConfig;
}

// ---------------------------------------------------------------------------
// Severity styling
// ---------------------------------------------------------------------------

interface SeverityStyle {
  readonly icon: ReactNode;
  readonly color: string;
  readonly bgColor: string;
  readonly borderColor: string;
  readonly label: string;
}

const SEVERITY_STYLES: Record<Severity, SeverityStyle> = {
  info: {
    icon: <Info className="w-4 h-4" aria-hidden="true" />,
    color: 'text-blue-300',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    label: 'Info',
  },
  gentle: {
    icon: <Info className="w-4 h-4" aria-hidden="true" />,
    color: 'text-sky-300',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/20',
    label: 'Gentle',
  },
  important: {
    icon: <AlertTriangle className="w-4 h-4" aria-hidden="true" />,
    color: 'text-amber-300',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    label: 'Important',
  },
  critical: {
    icon: <AlertCircle className="w-4 h-4" aria-hidden="true" />,
    color: 'text-red-300',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    label: 'Critical',
  },
} as const;

// ---------------------------------------------------------------------------
// Score color helpers
// ---------------------------------------------------------------------------

/**
 * Return a Tailwind text color class based on the alignment score.
 * Red < 40, Yellow < 70, Green >= 70.
 */
function scoreTextColor(score: number): string {
  if (score < 40) return 'text-red-400';
  if (score < 70) return 'text-amber-400';
  return 'text-emerald-400';
}

/**
 * Return an SVG stroke color for the circular progress ring.
 */
function scoreStrokeColor(score: number): string {
  if (score < 40) return '#f87171'; // red-400
  if (score < 70) return '#fbbf24'; // amber-400
  return '#34d399'; // emerald-400
}

/**
 * Return a glow shadow color for the score ring.
 */
function scoreGlowColor(score: number): string {
  if (score < 40) return 'rgba(248, 113, 113, 0.3)';
  if (score < 70) return 'rgba(251, 191, 36, 0.3)';
  return 'rgba(52, 211, 153, 0.3)';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Circular progress indicator showing 0-100 alignment score. */
function ScoreRing({ score }: { readonly score: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Alignment score: ${score} out of 100`}
    >
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Background ring */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
        />
        {/* Score ring */}
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={scoreStrokeColor(score)}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 6px ${scoreGlowColor(score)})`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className={`text-2xl font-bold tabular-nums ${scoreTextColor(score)}`}
          key={score}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-white/50 uppercase tracking-wider">
          Score
        </span>
      </div>
    </div>
  );
}

/** A single correction item in the corrections list. */
function CorrectionItem({
  correction,
}: {
  readonly correction: PoseCorrectionType;
}) {
  const style = SEVERITY_STYLES[correction.severity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.25 }}
      className={`flex items-start gap-3 p-3 rounded-xl border ${style.bgColor} ${style.borderColor}`}
      role="listitem"
    >
      <div className={`mt-0.5 shrink-0 ${style.color}`}>
        {style.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
            {correction.bodyPart}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${style.bgColor} ${style.color}`}
          >
            {style.label}
          </span>
        </div>
        <p className="text-sm text-white/80 mt-1 leading-relaxed">
          {correction.instruction}
        </p>
      </div>
    </motion.div>
  );
}

/** Success state shown when the user's pose is well-aligned. */
function AlignedState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center gap-3 py-4"
    >
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'loop',
        }}
      >
        <Sparkles className="w-10 h-10 text-emerald-400" aria-hidden="true" />
      </motion.div>
      <div className="text-center">
        <p className="text-emerald-300 font-semibold text-lg">Great form!</p>
        <p className="text-white/50 text-sm mt-1">
          Your alignment looks wonderful. Hold this pose.
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Overlay panel for live yoga pose correction feedback.
 *
 * Renders a glassmorphism card with:
 * - A circular alignment score indicator (0-100, color-coded)
 * - A list of active corrections with severity styling
 * - Animated success state when pose is aligned
 *
 * @example
 * ```tsx
 * <PoseCorrectionOverlay
 *   poseAnalysis={analysis}
 *   isActive={isSessionActive}
 * />
 * ```
 */
export default function PoseCorrectionOverlay({
  poseAnalysis,
  isActive,
  config,
}: PoseCorrectionProps) {
  const effectiveConfig = config ?? DEFAULT_POSE_CONFIG;

  if (!isActive || !effectiveConfig.enableVisualOverlay) {
    return null;
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-4 w-72 max-h-[480px] overflow-y-auto no-scrollbar"
      role="complementary"
      aria-label="Pose correction feedback"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5 text-purple-400" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
          Pose Analysis
        </h2>
        {isActive && !poseAnalysis && (
          <motion.div
            className="ml-auto w-2 h-2 rounded-full bg-purple-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            aria-label="Analyzing"
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        {!poseAnalysis ? (
          /* Waiting for first analysis */
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-12 h-12 rounded-full border-2 border-purple-400/30 border-t-purple-400" />
            </motion.div>
            <p className="text-white/50 text-sm text-center">
              Analyzing your pose...
            </p>
          </motion.div>
        ) : poseAnalysis.isAligned ? (
          /* Perfect alignment */
          <motion.div key="aligned">
            <div className="flex justify-center mb-4">
              <ScoreRing score={poseAnalysis.overallScore} />
            </div>
            <AlignedState />
          </motion.div>
        ) : (
          /* Corrections needed */
          <motion.div
            key="corrections"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Score */}
            <div className="flex justify-center mb-4">
              <ScoreRing score={poseAnalysis.overallScore} />
            </div>

            {/* Pose name */}
            {poseAnalysis.poseName && (
              <p className="text-center text-white/60 text-xs mb-3">
                {poseAnalysis.poseName}
              </p>
            )}

            {/* Corrections list */}
            <div
              className="space-y-2"
              role="list"
              aria-label="Pose corrections"
            >
              <AnimatePresence mode="popLayout">
                {poseAnalysis.corrections.map((correction) => (
                  <CorrectionItem
                    key={correction.id}
                    correction={correction}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
