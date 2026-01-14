'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { X, Pause, Play, SkipForward, Heart, Video, VideoOff } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { GlassCard, Button, AILoadingSpinner } from '@/components/ui';
import GuruAvatar from '@/components/guru/GuruAvatar';
import { GeminiLiveSession, GURU_VOICES } from '@/lib/gemini';

const CosmicScene = dynamic(() => import('@/components/three/CosmicScene'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#0a0a12]" />,
});

function SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionType = searchParams.get('type') || 'meditation';

  const {
    isGuruSpeaking,
    setIsGuruSpeaking,
    cameraEnabled,
    setCameraEnabled,
    videoStream,
    setVideoStream,
    guruVoice,
    addGuruMessage,
  } = useAppStore();

  const [liveSession, setLiveSession] = useState<GeminiLiveSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [guruMessage, setGuruMessage] = useState('');
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [mood, setMood] = useState<'before' | 'after'>('before');
  const [selectedMood, setSelectedMood] = useState('');

  const sessionMessages = sessionType === 'meditation'
    ? [
        "Preparing your meditation space...",
        "Tuning into tranquility...",
        "Calibrating breathing guide...",
        "Summoning peaceful energy...",
        "Your Guru is entering...",
      ]
    : [
        "Preparing your yoga mat...",
        "Warming up the practice space...",
        "Loading pose guidance...",
        "Activating movement sensors...",
        "Your Guru is ready...",
      ];

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Breathing animation cycle for meditation
  useEffect(() => {
    if (sessionType !== 'meditation' || !isPlaying) return;

    const breathCycle = () => {
      setBreathPhase('inhale');
      setTimeout(() => setBreathPhase('hold'), 4000);
      setTimeout(() => setBreathPhase('exhale'), 6000);
      setTimeout(() => setBreathPhase('rest'), 10000);
    };

    breathCycle();
    const interval = setInterval(breathCycle, 12000);
    return () => clearInterval(interval);
  }, [sessionType, isPlaying]);

  // Initialize Gemini session
  const initializeSession = useCallback(async () => {
    setIsInitializing(true);

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
      (audioData) => {
        playAudio(audioData);
      },
      (error) => {
        console.error('Session error:', error);
        setIsInitializing(false);
      }
    );

    const voiceId = guruVoice?.id || GURU_VOICES[2].id;
    await session.connect(voiceId);
    setLiveSession(session);

    // Start the session with appropriate prompt
    const startPrompt = sessionType === 'meditation'
      ? "Guide me through a calming meditation session. Start with breathing exercises and lead me into a peaceful state."
      : "Guide me through a yoga session. Start with gentle warm-up poses and provide clear instructions.";

    session.sendText(startPrompt);

    // Start audio stream for real-time interaction
    await session.startAudioStream();

    setIsInitializing(false);
  }, [sessionType, guruVoice, setIsGuruSpeaking, addGuruMessage]);

  useEffect(() => {
    initializeSession();
    return () => {
      liveSession?.disconnect();
    };
  }, []);

  const playAudio = async (audioData: ArrayBuffer) => {
    try {
      const audioContext = new AudioContext({ sampleRate: 24000 });
      const audioBuffer = await audioContext.decodeAudioData(audioData);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => setIsGuruSpeaking(false);
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsGuruSpeaking(false);
    }
  };

  const toggleCamera = async () => {
    if (cameraEnabled) {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
      setCameraEnabled(false);
    } else {
      const stream = await liveSession?.startVideoStream();
      if (stream) {
        setVideoStream(stream);
        setCameraEnabled(true);
        liveSession?.sendText("I've enabled my camera. Please watch my form and provide corrections as needed.");
      }
    }
  };

  const handleEndSession = () => {
    setIsPlaying(false);
    setShowEndScreen(true);
    liveSession?.sendText("Let's conclude our session with a peaceful ending.");
  };

  const handleSaveSession = async () => {
    // Save session to Firestore would go here
    router.push('/');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const moodOptions = [
    { emoji: '😰', label: 'Anxious' },
    { emoji: '😔', label: 'Down' },
    { emoji: '😐', label: 'Neutral' },
    { emoji: '😊', label: 'Good' },
    { emoji: '🌟', label: 'Great' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Mind-blowing AI Loading Spinner */}
      <AILoadingSpinner
        isLoading={isInitializing}
        messages={sessionMessages}
        fullScreen
      />

      <CosmicScene
        mode="session"
        sessionMood={sessionType === 'meditation' ? 'calm' : 'energetic'}
        breathingIntensity={sessionType === 'meditation' ? 1 : 0}
        flowParticlesToGuru={isGuruSpeaking}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white/80" />
          </button>

          <div className="text-center">
            <p className="text-white/60 text-sm capitalize">{sessionType} Session</p>
            <p className="text-2xl font-mono text-white session-timer">{formatTime(elapsedTime)}</p>
          </div>

          {sessionType === 'yoga' && (
            <button
              onClick={toggleCamera}
              className={`p-2 rounded-full transition-colors ${
                cameraEnabled ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'
              }`}
            >
              {cameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
          )}
          {sessionType !== 'yoga' && <div className="w-10" />}
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
          {/* Guru */}
          <motion.div className="mb-8">
            <GuruAvatar
              size="xl"
              speaking={isGuruSpeaking}
              listening={!isGuruSpeaking && isPlaying}
            />
          </motion.div>

          {/* Guru Message */}
          <AnimatePresence mode="wait">
            {guruMessage && (
              <motion.div
                key={guruMessage.slice(0, 50)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-lg text-center mb-8"
              >
                <GlassCard>
                  <p className="text-lg font-guru text-white/90 italic">
                    "{guruMessage}"
                  </p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Breathing Guide (Meditation only) */}
          {sessionType === 'meditation' && isPlaying && (
            <motion.div
              className="mb-8"
              animate={{
                scale: breathPhase === 'inhale' ? 1.2 : breathPhase === 'exhale' ? 0.8 : 1,
              }}
              transition={{ duration: breathPhase === 'inhale' ? 4 : breathPhase === 'exhale' ? 4 : 2 }}
            >
              <div className="w-32 h-32 rounded-full border-2 border-purple-500/50 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white/80 text-lg capitalize">{breathPhase}</p>
                </div>
              </div>
            </motion.div>
          )}
        </main>

        {/* Bottom Controls */}
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

              <button
                onClick={() => liveSession?.sendText("Let's try something different")}
                className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <SkipForward className="w-6 h-6 text-white" />
              </button>
            </GlassCard>
          </div>
        </motion.div>

        {/* Video PiP */}
        {cameraEnabled && videoStream && (
          <motion.div
            className="pip-container"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <video
              autoPlay
              playsInline
              muted
              ref={(el) => {
                if (el && videoStream) {
                  el.srcObject = videoStream;
                }
              }}
            />
          </motion.div>
        )}

        {/* End Screen Modal */}
        <AnimatePresence>
          {showEndScreen && (
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GlassCard className="max-w-md w-full" glow glowColor="#f5c518">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="mb-6"
                  >
                    <span className="text-6xl">✨</span>
                  </motion.div>

                  <h2 className="text-2xl font-serif mb-2 text-white">Session Complete</h2>
                  <p className="text-white/60 mb-6">{formatTime(elapsedTime)} of mindful practice</p>

                  <div className="mb-6">
                    <p className="text-white/80 mb-3">How do you feel now?</p>
                    <div className="flex justify-center gap-2">
                      {moodOptions.map((mood) => (
                        <button
                          key={mood.label}
                          onClick={() => setSelectedMood(mood.label)}
                          className={`p-3 rounded-xl transition-all ${
                            selectedMood === mood.label
                              ? 'bg-purple-500/30 border border-purple-500/50 scale-110'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-2xl">{mood.emoji}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      fullWidth
                      icon={<Heart className="w-4 h-4" />}
                      onClick={handleSaveSession}
                    >
                      Save to Favorites
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => router.push('/')}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function SessionPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#0a0a12]" />}>
      <SessionContent />
    </Suspense>
  );
}
