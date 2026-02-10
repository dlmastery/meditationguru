'use client';

/**
 * Group session page - Create or join a multi-participant session.
 *
 * Two modes:
 * - Create: enter a title, pick session type, create a lobby
 * - Join: enter an invite code to join an existing lobby
 *
 * Once the host starts the session, transitions to an active session
 * view with the guru, breathing guide, and participant grid.
 */

import { useState, useCallback, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Users,
  Plus,
  LogIn,
  ArrowLeft,
  Pause,
  Play,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/lib/store';
import { GlassCard, Button, Input, AILoadingSpinner } from '@/components/ui';
import GuruAvatar from '@/components/guru/GuruAvatar';
import GroupLobby from '@/components/session/GroupLobby';
import GroupParticipantGrid from '@/components/session/GroupParticipantGrid';
import { GeminiLiveSession, GURU_VOICES } from '@/lib/gemini';
import {
  createNewGroupSession,
  joinGroupSession,
  buildGroupSystemPrompt,
} from '@/lib/group-session';
import type { GroupSession, ParticipantFeedback } from '@/types/features';

const CosmicScene = dynamic(() => import('@/components/three/CosmicScene'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#0a0a12]" />,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PageMode = 'select' | 'create' | 'join' | 'lobby' | 'active';
type SessionType = 'meditation' | 'yoga' | 'mixed';

const SESSION_TYPE_OPTIONS: readonly { value: SessionType; label: string }[] = [
  { value: 'meditation', label: 'Meditation' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'mixed', label: 'Mixed' },
] as const;

// ---------------------------------------------------------------------------
// Main content component
// ---------------------------------------------------------------------------

function GroupContent() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    isGuruSpeaking,
    setIsGuruSpeaking,
    guruVoice,
    addGuruMessage,
  } = useAppStore();

  // Page state
  const [mode, setMode] = useState<PageMode>('select');
  const [error, setError] = useState('');

  // Create form
  const [title, setTitle] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('meditation');

  // Join form
  const [inviteCode, setInviteCode] = useState('');

  // Session state
  const [groupSession, setGroupSession] = useState<GroupSession | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);

  // Active session state
  const [liveSession, setLiveSession] = useState<GeminiLiveSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [guruMessage, setGuruMessage] = useState('');
  const [participantFeedback, setParticipantFeedback] = useState<ParticipantFeedback[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);

  // Timer for active session
  useEffect(() => {
    if (mode !== 'active' || !isPlaying) return;
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      liveSession?.disconnect();
    };
  }, [liveSession]);

  const userId = user?.uid ?? '';
  const displayName = user?.displayName ?? 'Guest';

  // ---------------------------------------------------------------------------
  // Create session
  // ---------------------------------------------------------------------------

  const handleCreate = useCallback(async () => {
    if (!title.trim()) {
      setError('Please enter a session title.');
      return;
    }
    if (!userId) {
      setError('Please sign in to create a session.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const session = await createNewGroupSession(
        userId,
        displayName,
        title.trim(),
        sessionType,
      );
      setGroupSession(session);
      setIsHost(true);
      setMode('lobby');
    } catch (err) {
      setError('Failed to create session. Please try again.');
      console.error('Create session error:', err);
    } finally {
      setLoading(false);
    }
  }, [title, sessionType, userId, displayName]);

  // ---------------------------------------------------------------------------
  // Join session
  // ---------------------------------------------------------------------------

  const handleJoin = useCallback(async () => {
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('Invite code must be 6 characters.');
      return;
    }
    if (!userId) {
      setError('Please sign in to join a session.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const session = await joinGroupSession(code, userId, displayName);
      if (!session) {
        setError('Invalid invite code, session is full, or session has ended.');
        return;
      }
      setGroupSession(session);
      setIsHost(session.hostId === userId);
      setMode('lobby');
    } catch (err) {
      setError('Failed to join session. Please try again.');
      console.error('Join session error:', err);
    } finally {
      setLoading(false);
    }
  }, [inviteCode, userId, displayName]);

  // ---------------------------------------------------------------------------
  // Start session (host only)
  // ---------------------------------------------------------------------------

  const handleStartSession = useCallback(async () => {
    if (!groupSession) return;

    setIsInitializing(true);
    setMode('active');

    const session = new GeminiLiveSession(
      (message) => {
        setGuruMessage(message);
        setIsGuruSpeaking(true);
        addGuruMessage({
          id: Date.now().toString(),
          role: 'guru',
          content: message,
          timestamp: new Date(),
        });
      },
      (_audioData) => {
        // Audio playback handled by the GeminiLiveSession internally
      },
      (err) => {
        console.error('Group session error:', err);
        setIsInitializing(false);
      },
    );

    const voiceId = guruVoice?.id || GURU_VOICES[2].id;
    await session.connect(voiceId);
    setLiveSession(session);

    // Build group-aware prompt and send it
    const groupPrompt = buildGroupSystemPrompt(groupSession);
    const startPrompt =
      groupSession.sessionType === 'yoga'
        ? `${groupPrompt}\n\nGuide this group through a yoga session. Welcome everyone by name and begin with gentle warm-up poses.`
        : `${groupPrompt}\n\nGuide this group through a meditation session. Welcome everyone by name and begin with breathing exercises.`;

    session.sendText(startPrompt);
    await session.startAudioStream();

    setIsInitializing(false);
  }, [groupSession, guruVoice, setIsGuruSpeaking, addGuruMessage]);

  // ---------------------------------------------------------------------------
  // End session
  // ---------------------------------------------------------------------------

  const handleEndSession = useCallback(() => {
    liveSession?.sendText("Let's close our group session. Thank everyone for participating.");
    liveSession?.disconnect();
    setLiveSession(null);
    setIsPlaying(false);
    router.push('/');
  }, [liveSession, router]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ---------------------------------------------------------------------------
  // Render: Mode selection
  // ---------------------------------------------------------------------------

  if (mode === 'select') {
    return (
      <div className="relative min-h-screen">
        <CosmicScene mode="default" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <motion.div
            className="w-full max-w-md space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-8">
              <button
                onClick={() => router.push('/')}
                className="absolute top-6 left-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
              <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h1 className="text-3xl font-serif text-white mb-2">Group Sessions</h1>
              <p className="text-white/50">Meditate or practice yoga together</p>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={<Plus className="w-5 h-5" />}
              onClick={() => { setMode('create'); setError(''); }}
            >
              Create Session
            </Button>

            <Button
              variant="secondary"
              size="lg"
              fullWidth
              icon={<LogIn className="w-5 h-5" />}
              onClick={() => { setMode('join'); setError(''); }}
            >
              Join Session
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Create form
  // ---------------------------------------------------------------------------

  if (mode === 'create') {
    return (
      <div className="relative min-h-screen">
        <CosmicScene mode="default" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <motion.div
            className="w-full max-w-md space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center">
              <button
                onClick={() => setMode('select')}
                className="absolute top-6 left-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
              <h1 className="text-2xl font-serif text-white mb-2">Create Group Session</h1>
              <p className="text-white/50 text-sm">Set up a session for your group</p>
            </div>

            <GlassCard>
              <div className="space-y-5">
                <Input
                  label="Session Title"
                  placeholder="e.g. Morning Meditation Circle"
                  value={title}
                  onChange={(e) => setTitle(e.currentTarget.value)}
                />

                <div>
                  <label className="block text-white/70 text-sm mb-2 font-medium">
                    Session Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SESSION_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSessionType(option.value)}
                        className={`
                          px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                          ${
                            sessionType === option.value
                              ? 'bg-purple-500/30 border border-purple-500/50 text-white'
                              : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <motion.p
                    className="text-red-400 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onClick={handleCreate}
                >
                  Create Session
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Join form
  // ---------------------------------------------------------------------------

  if (mode === 'join') {
    return (
      <div className="relative min-h-screen">
        <CosmicScene mode="default" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <motion.div
            className="w-full max-w-md space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center">
              <button
                onClick={() => setMode('select')}
                className="absolute top-6 left-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
              <h1 className="text-2xl font-serif text-white mb-2">Join Group Session</h1>
              <p className="text-white/50 text-sm">Enter the 6-character invite code</p>
            </div>

            <GlassCard>
              <div className="space-y-5">
                <Input
                  label="Invite Code"
                  placeholder="e.g. ABC123"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.currentTarget.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.3em] font-mono"
                />

                {error && (
                  <motion.p
                    className="text-red-400 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onClick={handleJoin}
                >
                  Join Session
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Lobby
  // ---------------------------------------------------------------------------

  if (mode === 'lobby' && groupSession) {
    return (
      <div className="relative min-h-screen">
        <CosmicScene mode="default" />
        <div className="relative z-10">
          <button
            onClick={() => {
              setMode('select');
              setGroupSession(null);
            }}
            className="absolute top-6 left-6 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <GroupLobby
            session={groupSession}
            isHost={isHost}
            onStart={handleStartSession}
          />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Active session
  // ---------------------------------------------------------------------------

  if (mode === 'active' && groupSession) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <AILoadingSpinner
          isLoading={isInitializing}
          messages={[
            'Preparing group session...',
            'Connecting participants...',
            'Summoning the guru...',
            'Harmonizing energies...',
            'Your session is starting...',
          ]}
          fullScreen
        />

        <CosmicScene
          mode="session"
          sessionMood={groupSession.sessionType === 'yoga' ? 'energetic' : 'calm'}
          breathingIntensity={groupSession.sessionType === 'meditation' ? 1 : 0}
          flowParticlesToGuru={isGuruSpeaking}
        />

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between p-4">
            <button
              onClick={handleEndSession}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white/80" />
            </button>

            <div className="text-center">
              <p className="text-white/60 text-sm">{groupSession.title}</p>
              <p className="text-2xl font-mono text-white session-timer">
                {formatTime(elapsedTime)}
              </p>
            </div>

            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10">
              <Users className="w-4 h-4 text-white/60" />
              <span className="text-white/80 text-sm">
                {groupSession.participants.length}
              </span>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
            {/* Guru */}
            <motion.div className="mb-6">
              <GuruAvatar
                size="lg"
                speaking={isGuruSpeaking}
                listening={!isGuruSpeaking && isPlaying}
              />
            </motion.div>

            {/* Guru message */}
            <AnimatePresence mode="wait">
              {guruMessage && (
                <motion.div
                  key={guruMessage.slice(0, 50)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-lg text-center mb-6"
                >
                  <GlassCard>
                    <p className="text-lg font-guru text-white/90 italic">
                      &ldquo;{guruMessage}&rdquo;
                    </p>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Participant grid */}
            <div className="mb-6 w-full">
              <GroupParticipantGrid
                participants={groupSession.participants}
                feedback={participantFeedback}
                currentUserId={userId}
              />
            </div>
          </main>

          {/* Bottom controls */}
          <motion.div className="fixed bottom-0 left-0 right-0 p-4 pb-6">
            <div className="max-w-md mx-auto">
              <GlassCard className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
                  )}
                </button>

                <button
                  onClick={handleEndSession}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium"
                >
                  End Session
                </button>
              </GlassCard>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

// ---------------------------------------------------------------------------
// Page export with Suspense boundary
// ---------------------------------------------------------------------------

export default function GroupPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#0a0a12]" />}>
      <GroupContent />
    </Suspense>
  );
}
