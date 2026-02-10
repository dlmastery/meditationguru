'use client';

/**
 * GroupParticipantGrid - Responsive grid of participant tiles for group sessions.
 *
 * Displays each participant as a card with their avatar, name, and any
 * individual feedback from the guru as floating badges.
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from 'lucide-react';
import type { GroupParticipant, ParticipantFeedback } from '@/types/features';

interface GroupParticipantGridProps {
  readonly participants: readonly GroupParticipant[];
  readonly feedback: readonly ParticipantFeedback[];
  readonly currentUserId: string;
}

/** Map severity to a Tailwind border/badge color. */
function severityColor(severity: ParticipantFeedback['severity']): string {
  switch (severity) {
    case 'info':
      return 'border-blue-400/60 bg-blue-500/20 text-blue-300';
    case 'gentle':
      return 'border-green-400/60 bg-green-500/20 text-green-300';
    case 'important':
      return 'border-yellow-400/60 bg-yellow-500/20 text-yellow-300';
    case 'critical':
      return 'border-red-400/60 bg-red-500/20 text-red-300';
    default:
      return 'border-white/20 bg-white/10 text-white/70';
  }
}

/**
 * Get the most recent feedback for a given participant.
 */
function latestFeedbackForParticipant(
  participantId: string,
  feedback: readonly ParticipantFeedback[],
): ParticipantFeedback | undefined {
  // feedback is appended chronologically; last match is most recent
  for (let i = feedback.length - 1; i >= 0; i--) {
    if (feedback[i].participantId === participantId) {
      return feedback[i];
    }
  }
  return undefined;
}

/**
 * Responsive grid of participant tiles for an active group session.
 */
export default function GroupParticipantGrid({
  participants,
  feedback,
  currentUserId,
}: GroupParticipantGridProps) {
  const gridCols = useMemo(() => {
    const count = participants.length;
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2 md:grid-cols-4';
    if (count <= 6) return 'grid-cols-3 md:grid-cols-3';
    return 'grid-cols-3 md:grid-cols-4';
  }, [participants.length]);

  return (
    <div className={`grid ${gridCols} gap-3 w-full max-w-2xl mx-auto px-4`}>
      <AnimatePresence>
        {participants.map((participant, index) => {
          const isCurrentUser = participant.userId === currentUserId;
          const latestFeedback = latestFeedbackForParticipant(
            participant.userId,
            feedback,
          );

          return (
            <motion.div
              key={participant.userId}
              className={`
                relative rounded-2xl p-4 flex flex-col items-center gap-2
                backdrop-blur-xl border transition-colors
                ${
                  isCurrentUser
                    ? 'bg-purple-500/10 border-purple-500/40'
                    : 'bg-white/5 border-white/10'
                }
              `}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Host badge */}
              {participant.role === 'host' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <Crown className="w-3.5 h-3.5 text-black" />
                </div>
              )}

              {/* Avatar */}
              {participant.photoURL ? (
                <img
                  src={participant.photoURL}
                  alt={participant.displayName}
                  className={`
                    w-14 h-14 rounded-full object-cover border-2
                    ${isCurrentUser ? 'border-purple-400/60' : 'border-white/20'}
                  `}
                />
              ) : (
                <div
                  className={`
                    w-14 h-14 rounded-full flex items-center justify-center
                    text-white font-semibold text-lg
                    ${
                      isCurrentUser
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                        : 'bg-gradient-to-br from-slate-600 to-slate-800'
                    }
                  `}
                >
                  {participant.displayName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Name */}
              <p className="text-white text-xs font-medium text-center truncate w-full">
                {isCurrentUser ? 'You' : participant.displayName}
              </p>

              {/* Feedback badge */}
              {latestFeedback && (
                <motion.div
                  className={`
                    absolute -bottom-2 left-2 right-2 px-2 py-1 rounded-lg
                    border text-[10px] leading-tight text-center truncate
                    ${severityColor(latestFeedback.severity)}
                  `}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={latestFeedback.timestamp}
                >
                  {latestFeedback.message}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
