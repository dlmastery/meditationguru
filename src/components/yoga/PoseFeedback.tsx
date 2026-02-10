/**
 * Floating toast-style feedback component for yoga pose corrections.
 *
 * Displays the most recent correction as a slide-in notification that
 * auto-dismisses after 5 seconds. Styled by severity level.
 *
 * @module PoseFeedback
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PoseCorrection, Severity } from '@/types/features';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Auto-dismiss delay in milliseconds. */
const DISMISS_DELAY_MS = 5_000;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PoseFeedbackProps {
  /** List of corrections; the last item is shown as a toast. */
  readonly corrections: readonly PoseCorrection[];
  /** When true, only show the latest correction. Defaults to `true`. */
  readonly showLatest?: boolean;
}

// ---------------------------------------------------------------------------
// Severity styling
// ---------------------------------------------------------------------------

interface FeedbackStyle {
  readonly icon: ReactNode;
  readonly borderColor: string;
  readonly bgColor: string;
  readonly accentColor: string;
  readonly textColor: string;
}

function getSeverityStyle(severity: Severity): FeedbackStyle {
  switch (severity) {
    case 'critical':
      return {
        icon: <AlertCircle className="w-5 h-5" aria-hidden="true" />,
        borderColor: 'border-red-500/30',
        bgColor: 'bg-red-500/10',
        accentColor: 'text-red-400',
        textColor: 'text-red-200',
      };
    case 'important':
      return {
        icon: <AlertTriangle className="w-5 h-5" aria-hidden="true" />,
        borderColor: 'border-amber-500/30',
        bgColor: 'bg-amber-500/10',
        accentColor: 'text-amber-400',
        textColor: 'text-amber-200',
      };
    case 'gentle':
      return {
        icon: <Info className="w-5 h-5" aria-hidden="true" />,
        borderColor: 'border-sky-500/30',
        bgColor: 'bg-sky-500/10',
        accentColor: 'text-sky-400',
        textColor: 'text-sky-200',
      };
    case 'info':
    default:
      return {
        icon: <Info className="w-5 h-5" aria-hidden="true" />,
        borderColor: 'border-blue-500/30',
        bgColor: 'bg-blue-500/10',
        accentColor: 'text-blue-400',
        textColor: 'text-blue-200',
      };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Floating toast notification for the latest pose correction.
 *
 * Slides in from the right side and auto-dismisses after 5 seconds.
 * Severity determines the visual styling:
 * - `gentle` / `info` - blue tones
 * - `important` - amber tones
 * - `critical` - red tones
 *
 * @example
 * ```tsx
 * <PoseFeedback corrections={corrections} showLatest />
 * ```
 */
export default function PoseFeedback({
  corrections,
  showLatest = true,
}: PoseFeedbackProps) {
  const [visible, setVisible] = useState(false);
  const [activeCorrection, setActiveCorrection] = useState<PoseCorrection | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCorrectionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!showLatest || corrections.length === 0) {
      setVisible(false);
      return;
    }

    const latest = corrections[corrections.length - 1];

    // Only show toast for new corrections
    if (latest.id === lastCorrectionIdRef.current) {
      return;
    }

    lastCorrectionIdRef.current = latest.id;
    setActiveCorrection(latest);
    setVisible(true);

    // Clear any existing timer
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    // Auto-dismiss
    dismissTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, DISMISS_DELAY_MS);

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [corrections, showLatest]);

  if (!activeCorrection) {
    return null;
  }

  const style = getSeverityStyle(activeCorrection.severity);

  return (
    <div
      className="fixed top-24 right-6 z-50 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            key={activeCorrection.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            className={`
              pointer-events-auto max-w-xs
              backdrop-blur-xl rounded-xl border p-4
              ${style.borderColor} ${style.bgColor}
              shadow-lg
            `}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div className={`shrink-0 mt-0.5 ${style.accentColor}`}>
                {style.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-semibold uppercase tracking-wider ${style.accentColor}`}>
                  {activeCorrection.bodyPart}
                </p>
                <p className={`text-sm mt-1 leading-relaxed ${style.textColor}`}>
                  {activeCorrection.instruction}
                </p>
              </div>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              className={`mt-3 h-0.5 rounded-full ${style.accentColor}`}
              initial={{ width: '100%', opacity: 0.4 }}
              animate={{ width: '0%', opacity: 0.1 }}
              transition={{ duration: DISMISS_DELAY_MS / 1000, ease: 'linear' }}
              style={{ backgroundColor: 'currentColor' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
