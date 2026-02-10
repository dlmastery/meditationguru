'use client';

/**
 * EmotionIndicator -- animated pill/badge showing the user's detected emotion.
 *
 * Renders a color-coded pill with an icon, emotion label, and a confidence
 * progress bar. Uses framer-motion for smooth transitions between emotion
 * states and fade in/out based on {@link isActive}.
 *
 * @module EmotionIndicator
 */

import { AnimatePresence, motion } from 'framer-motion';
import type { EmotionLabel, EmotionSnapshot } from '@/types/features';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EmotionIndicatorProps {
  /** Current detected emotion snapshot, or null if none detected yet. */
  readonly emotion: EmotionSnapshot | null;
  /** Whether the emotion detection system is active. Controls visibility. */
  readonly isActive: boolean;
  /** Visual size variant. Defaults to 'md'. */
  readonly size?: 'sm' | 'md';
}

// ---------------------------------------------------------------------------
// Emotion visual config
// ---------------------------------------------------------------------------

interface EmotionVisual {
  readonly icon: string;
  readonly bgColor: string;
  readonly borderColor: string;
  readonly glowColor: string;
  readonly ariaLabel: string;
}

const EMOTION_VISUALS: Readonly<Record<EmotionLabel, EmotionVisual>> = {
  calm: {
    icon: '\u{1F54A}\u{FE0F}',
    bgColor: 'rgba(20, 184, 166, 0.15)',
    borderColor: 'rgba(20, 184, 166, 0.4)',
    glowColor: 'rgba(20, 184, 166, 0.25)',
    ariaLabel: 'Calm',
  },
  anxious: {
    icon: '\u{1F32A}\u{FE0F}',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    ariaLabel: 'Anxious',
  },
  stressed: {
    icon: '\u{1F525}',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    glowColor: 'rgba(239, 68, 68, 0.25)',
    ariaLabel: 'Stressed',
  },
  sad: {
    icon: '\u{1F4A7}',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    glowColor: 'rgba(59, 130, 246, 0.25)',
    ariaLabel: 'Sad',
  },
  happy: {
    icon: '\u{2728}',
    bgColor: 'rgba(245, 197, 24, 0.15)',
    borderColor: 'rgba(245, 197, 24, 0.4)',
    glowColor: 'rgba(245, 197, 24, 0.25)',
    ariaLabel: 'Happy',
  },
  frustrated: {
    icon: '\u{1F4A2}',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    glowColor: 'rgba(249, 115, 22, 0.25)',
    ariaLabel: 'Frustrated',
  },
  drowsy: {
    icon: '\u{1F319}',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    ariaLabel: 'Drowsy',
  },
  energetic: {
    icon: '\u{26A1}',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    ariaLabel: 'Energetic',
  },
  neutral: {
    icon: '\u{1F9D8}',
    bgColor: 'rgba(148, 163, 184, 0.15)',
    borderColor: 'rgba(148, 163, 184, 0.4)',
    glowColor: 'rgba(148, 163, 184, 0.25)',
    ariaLabel: 'Neutral',
  },
};

// ---------------------------------------------------------------------------
// Size config
// ---------------------------------------------------------------------------

interface SizeConfig {
  readonly pill: string;
  readonly icon: string;
  readonly label: string;
  readonly bar: string;
}

const SIZE_MAP: Readonly<Record<'sm' | 'md', SizeConfig>> = {
  sm: {
    pill: 'px-2.5 py-1 gap-1.5',
    icon: 'text-sm',
    label: 'text-xs',
    bar: 'h-0.5',
  },
  md: {
    pill: 'px-3 py-1.5 gap-2',
    icon: 'text-base',
    label: 'text-sm',
    bar: 'h-1',
  },
};

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0, scale: 0.8, y: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -8,
    transition: { duration: 0.2 },
  },
} as const;

const labelVariants = {
  hidden: { opacity: 0, x: -4 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { delay: 0.05, duration: 0.2 },
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Animated pill showing the user's detected emotional state.
 *
 * @example
 * ```tsx
 * <EmotionIndicator
 *   emotion={{ label: 'calm', confidence: 0.85, detectedAt: '...' }}
 *   isActive={true}
 *   size="md"
 * />
 * ```
 */
export default function EmotionIndicator({
  emotion,
  isActive,
  size = 'md',
}: EmotionIndicatorProps) {
  const sizeConfig = SIZE_MAP[size];
  const shouldShow = isActive && emotion !== null;

  return (
    <AnimatePresence mode="wait">
      {shouldShow && emotion !== null ? (
        <EmotionPill
          key={emotion.label}
          emotion={emotion}
          sizeConfig={sizeConfig}
        />
      ) : null}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Internal sub-component
// ---------------------------------------------------------------------------

interface EmotionPillProps {
  readonly emotion: EmotionSnapshot;
  readonly sizeConfig: SizeConfig;
}

function EmotionPill({ emotion, sizeConfig }: EmotionPillProps) {
  const visual = EMOTION_VISUALS[emotion.label];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      role="status"
      aria-label={`Detected emotion: ${visual.ariaLabel}, confidence ${Math.round(emotion.confidence * 100)}%`}
      aria-live="polite"
      className={`inline-flex items-center rounded-full ${sizeConfig.pill}`}
      style={{
        background: visual.bgColor,
        border: `1px solid ${visual.borderColor}`,
        boxShadow: `0 0 12px ${visual.glowColor}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Icon */}
      <span className={sizeConfig.icon} aria-hidden="true">
        {visual.icon}
      </span>

      {/* Label */}
      <motion.span
        variants={labelVariants}
        initial="hidden"
        animate="visible"
        className={`${sizeConfig.label} font-medium capitalize text-white/90`}
      >
        {emotion.label}
      </motion.span>

      {/* Confidence bar */}
      <div
        className={`${sizeConfig.bar} w-10 overflow-hidden rounded-full bg-white/10`}
        aria-hidden="true"
      >
        <motion.div
          className={`${sizeConfig.bar} rounded-full`}
          style={{ background: visual.borderColor }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(emotion.confidence * 100)}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
