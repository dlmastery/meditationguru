/**
 * Full-screen visualization canvas that displays AI-generated meditation
 * imagery with smooth crossfade transitions and a Ken Burns effect.
 *
 * Renders as a background layer behind the session UI.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualizationState } from '@/types/features';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VisualizationCanvasProps {
  /** Current visualization pipeline state. */
  readonly state: VisualizationState;
  /** Whether the visualization feature is enabled. */
  readonly isActive: boolean;
}

// ---------------------------------------------------------------------------
// Ken Burns animation presets
// ---------------------------------------------------------------------------

/**
 * Random origin + zoom direction for the Ken Burns (slow pan/zoom) effect
 * so each frame feels slightly different.
 */
function getRandomKenBurns(): {
  initial: { scale: number; x: string; y: string };
  animate: { scale: number; x: string; y: string };
} {
  const directions = [
    {
      initial: { scale: 1.0, x: '0%', y: '0%' },
      animate: { scale: 1.12, x: '-2%', y: '-1%' },
    },
    {
      initial: { scale: 1.12, x: '-2%', y: '-1%' },
      animate: { scale: 1.0, x: '1%', y: '1%' },
    },
    {
      initial: { scale: 1.0, x: '1%', y: '1%' },
      animate: { scale: 1.1, x: '-1%', y: '0%' },
    },
    {
      initial: { scale: 1.08, x: '0%', y: '-2%' },
      animate: { scale: 1.0, x: '0%', y: '0%' },
    },
  ] as const;

  return directions[Math.floor(Math.random() * directions.length)];
}

// ---------------------------------------------------------------------------
// Transition variants by type
// ---------------------------------------------------------------------------

function getTransitionDuration(type: string): number {
  switch (type) {
    case 'slide':
      return 1.2;
    case 'dissolve':
      return 2.0;
    case 'fade':
    default:
      return 1.5;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VisualizationCanvas({
  state,
  isActive,
}: VisualizationCanvasProps) {
  const kenBurnsRef = useRef(getRandomKenBurns());
  const [shimmer, setShimmer] = useState(false);

  // Pick a new Ken Burns direction every time the frame changes.
  const frameId = state.currentFrame?.id ?? null;
  useEffect(() => {
    kenBurnsRef.current = getRandomKenBurns();
  }, [frameId]);

  // Show a loading shimmer when there is no current frame but the
  // feature is active (waiting for first generation).
  useEffect(() => {
    if (isActive && state.currentFrame === null) {
      setShimmer(true);
    } else {
      setShimmer(false);
    }
  }, [isActive, state.currentFrame]);

  if (!isActive) return null;

  const frame = state.currentFrame;
  const transitionDuration = frame
    ? getTransitionDuration(frame.transitionType)
    : 1.5;

  const kb = kenBurnsRef.current;

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Cosmic gradient fallback (always present behind the image) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a12] via-[#1a0a2e] to-[#0a0a12]" />

      {/* Loading shimmer overlay */}
      <AnimatePresence>
        {shimmer && (
          <motion.div
            key="shimmer"
            className="absolute inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current visualization frame with crossfade + Ken Burns */}
      <AnimatePresence mode="wait">
        {frame && (
          <motion.div
            key={frame.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: transitionDuration, ease: 'easeInOut' }}
          >
            {/* Ken Burns layer */}
            <motion.div
              className="absolute inset-0"
              initial={{
                scale: kb.initial.scale,
                x: kb.initial.x,
                y: kb.initial.y,
              }}
              animate={{
                scale: kb.animate.scale,
                x: kb.animate.x,
                y: kb.animate.y,
              }}
              transition={{
                duration: (frame.displayDurationMs / 1000) + transitionDuration,
                ease: 'linear',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={frame.imageUrl}
                alt={frame.prompt}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Dark vignette overlay for readability of session UI */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Narrative text overlay (bottom center) */}
      <AnimatePresence>
        {frame?.narrativeText && (
          <motion.div
            key={`narrative-${frame.id}`}
            className="absolute bottom-24 left-0 right-0 z-20 flex justify-center px-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
          >
            <p className="max-w-2xl text-center text-white/70 text-sm sm:text-base font-[family-name:var(--font-cormorant)] italic leading-relaxed">
              {frame.narrativeText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
