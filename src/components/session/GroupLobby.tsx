'use client';

/**
 * GroupLobby - Pre-session lobby for group meditation/yoga sessions.
 *
 * Displays the invite code, lists joined participants, and lets the
 * host start the session once at least 2 participants have joined.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Users, Crown, Loader2 } from 'lucide-react';
import type { GroupSession } from '@/types/features';
import { GlassCard, Button } from '@/components/ui';

interface GroupLobbyProps {
  readonly session: GroupSession;
  readonly isHost: boolean;
  readonly onStart: () => void;
}

/**
 * Pre-session lobby showing invite code, participant list, and start controls.
 */
export default function GroupLobby({ session, isHost, onStart }: GroupLobbyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(session.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = session.inviteCode;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [session.inviteCode]);

  const canStart = session.participants.length >= 2;
  const sessionTypeLabel =
    session.sessionType === 'mixed'
      ? 'Mixed Session'
      : session.sessionType === 'yoga'
        ? 'Yoga Session'
        : 'Meditation Session';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <motion.div
        className="w-full max-w-md space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Session title */}
        <div className="text-center">
          <h1 className="text-3xl font-serif text-white mb-2">{session.title}</h1>
          <p className="text-white/50 text-sm">{sessionTypeLabel}</p>
        </div>

        {/* Invite code card */}
        <GlassCard glow glowColor="#7b68ee" className="text-center">
          <p className="text-white/60 text-sm mb-3">Share this code to invite others</p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl font-mono tracking-[0.3em] text-white font-bold select-all">
              {session.inviteCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Copy invite code"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="w-5 h-5 text-green-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy className="w-5 h-5 text-white/70" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </GlassCard>

        {/* Participant list */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-white/60" />
            <h2 className="text-white/80 font-medium">
              Participants ({session.participants.length}/{session.maxParticipants})
            </h2>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {session.participants.map((participant, index) => (
                <motion.div
                  key={participant.userId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Avatar */}
                  <div className="relative">
                    {participant.photoURL ? (
                      <img
                        src={participant.photoURL}
                        alt={participant.displayName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-sm">
                        {participant.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {participant.role === 'host' && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                        <Crown className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </div>

                  {/* Name and role */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {participant.displayName}
                    </p>
                    <p className="text-white/40 text-xs capitalize">{participant.role}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Waiting indicator */}
          {session.participants.length < 2 && (
            <motion.div
              className="flex items-center justify-center gap-2 mt-4 py-3 text-white/40 text-sm"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Waiting for participants to join...</span>
            </motion.div>
          )}
        </GlassCard>

        {/* Start button (host only) */}
        {isHost && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canStart}
            onClick={onStart}
          >
            {canStart
              ? `Start Session (${session.participants.length} participants)`
              : 'Waiting for at least 2 participants...'}
          </Button>
        )}

        {/* Participant waiting message */}
        {!isHost && (
          <GlassCard variant="dark" className="text-center">
            <p className="text-white/60 text-sm">
              Waiting for the host to start the session...
            </p>
          </GlassCard>
        )}
      </motion.div>
    </div>
  );
}
