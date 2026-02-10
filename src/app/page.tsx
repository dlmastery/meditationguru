'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Mic, MicOff, Video, VideoOff, Search, Map, Settings, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/lib/store';
import { Button, GlassCard, LoadingScreen, AILoadingSpinner } from '@/components/ui';
import GuruAvatar from '@/components/guru/GuruAvatar';
import { GeminiLiveSession, GURU_VOICES } from '@/lib/gemini';

// Dynamic import for Three.js
const CosmicScene = dynamic(() => import('@/components/three/CosmicScene'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#0a0a12]" />,
});

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    onboardingComplete,
    isLoading,
    setIsLoading,
    microphoneEnabled,
    setMicrophoneEnabled,
    cameraEnabled,
    setCameraEnabled,
    isGuruSpeaking,
    setIsGuruSpeaking,
    guruMessages,
    addGuruMessage,
    guruVoice,
    videoStream,
    setVideoStream,
  } = useAppStore();

  const [liveSession, setLiveSession] = useState<GeminiLiveSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [guruResponse, setGuruResponse] = useState('');
  const [sessionMood, setSessionMood] = useState<'calm' | 'energetic' | 'neutral'>('neutral');

  // Check auth and onboarding status
  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
      if (!onboardingComplete) {
        router.push('/onboarding');
      }
    }
  }, [authLoading, onboardingComplete, router, setIsLoading]);

  // Initialize Gemini Live Session
  const initializeLiveSession = useCallback(async () => {
    if (liveSession) return;

    setIsConnecting(true);

    const session = new GeminiLiveSession(
      // On message received
      (message) => {
        setGuruResponse(message);
        setIsGuruSpeaking(true);
        addGuruMessage({
          id: Date.now().toString(),
          role: 'guru',
          content: message,
          timestamp: new Date(),
        });
      },
      // On audio received
      (audioData) => {
        // Play audio through Web Audio API
        playAudio(audioData);
      },
      // On error
      (error) => {
        console.error('Live session error:', error);
        setIsConnecting(false);
      }
    );

    const voiceId = guruVoice?.id || GURU_VOICES[2].id; // Default to Aurora (female)
    await session.connect(voiceId);
    setLiveSession(session);
    setIsConnecting(false);
  }, [liveSession, guruVoice, setIsGuruSpeaking, addGuruMessage]);

  // Play audio from Gemini
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

  // Toggle microphone
  const toggleMicrophone = async () => {
    if (!liveSession) {
      await initializeLiveSession();
    }

    if (microphoneEnabled) {
      setMicrophoneEnabled(false);
    } else {
      setMicrophoneEnabled(true);
      liveSession?.startAudioStream();
    }
  };

  // Toggle camera for yoga
  const toggleCamera = async () => {
    if (cameraEnabled) {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
      setCameraEnabled(false);
    } else {
      if (!liveSession) {
        await initializeLiveSession();
      }
      const stream = await liveSession?.startVideoStream();
      if (stream) {
        setVideoStream(stream);
        setCameraEnabled(true);
      }
    }
  };

  // Send text message to guru
  const sendMessage = async (text: string) => {
    addGuruMessage({
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    });

    if (liveSession) {
      liveSession.sendText(text);
    } else {
      await initializeLiveSession();
      // Note: The session will be available after initialization completes
      // The guru will respond once connected
    }

    setCurrentTranscript('');
  };

  // Quick action buttons
  const quickActions = [
    { label: 'Meditate', icon: '🧘', action: () => sendMessage("I want to meditate") },
    { label: 'Yoga', icon: '🌟', action: () => sendMessage("Let's do some yoga") },
    { label: 'Relax', icon: '🌊', action: () => sendMessage("Help me relax") },
    { label: 'Focus', icon: '🎯', action: () => sendMessage("I need to focus") },
  ];

  if (authLoading || isLoading) {
    return <LoadingScreen message="Preparing your sanctuary..." />;
  }

  const connectingMessages = [
    "Awakening your Guru...",
    "Establishing cosmic connection...",
    "Tuning into your frequency...",
    "Preparing voice synthesis...",
    "Opening the sacred channel...",
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* AI Connecting Spinner */}
      <AILoadingSpinner
        isLoading={isConnecting}
        messages={connectingMessages}
        fullScreen
      />

      {/* Cosmic Background */}
      <CosmicScene
        mode="default"
        sessionMood={sessionMood}
        flowParticlesToGuru={isGuruSpeaking}
        guruPosition={[0, 0, 0]}
      />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-6 h-6 text-[#f5c518]" />
            <span className="text-xl font-serif gradient-text">MeditationGuru</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <button
              onClick={() => router.push('/search')}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-white/60" />
            </button>
            <button
              onClick={() => router.push('/journey')}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Journey"
            >
              <Map className="w-5 h-5 text-white/60" />
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-white/60" />
            </button>
          </motion.div>
        </header>

        {/* Guru Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
          {/* Guru Avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <GuruAvatar
              size="xl"
              speaking={isGuruSpeaking}
              listening={microphoneEnabled && !isGuruSpeaking}
            />
          </motion.div>

          {/* Guru Response */}
          <AnimatePresence mode="wait">
            {guruResponse && (
              <motion.div
                key={guruResponse}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-lg text-center mb-8"
              >
                <GlassCard glow glowColor="#7b68ee">
                  <p className="text-lg font-guru text-white/90 italic">
                    "{guruResponse}"
                  </p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Welcome message if no conversation yet */}
          {!guruResponse && guruMessages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg text-center mb-8"
            >
              <h2 className="text-2xl md:text-3xl font-serif mb-4 text-white/90">
                Welcome back, seeker
              </h2>
              <p className="text-white/60">
                Tap the microphone to speak with your guru, or choose a quick action below
              </p>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center gap-2"
                onClick={action.action}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <span>{action.icon}</span>
                <span className="text-white/80">{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        </main>

        {/* Bottom Control Bar */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 pb-6"
        >
          <div className="max-w-md mx-auto">
            <GlassCard className="flex items-center justify-center gap-4">
              {/* Camera Toggle */}
              <motion.button
                className={`
                  p-4 rounded-full transition-all
                  ${cameraEnabled
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }
                `}
                onClick={toggleCamera}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={cameraEnabled ? 'Disable camera' : 'Enable camera'}
              >
                {cameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </motion.button>

              {/* Microphone Toggle - Main button */}
              <motion.button
                className={`
                  p-6 rounded-full transition-all relative
                  ${microphoneEnabled
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  }
                  ${isConnecting ? 'animate-pulse' : ''}
                `}
                onClick={toggleMicrophone}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={isConnecting}
                aria-label={microphoneEnabled ? 'Stop listening' : 'Start listening'}
              >
                {microphoneEnabled ? (
                  <Mic className="w-8 h-8" />
                ) : (
                  <MicOff className="w-8 h-8" />
                )}

                {/* Listening indicator rings */}
                {microphoneEnabled && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-white/30"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-white/20"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    />
                  </>
                )}
              </motion.button>

              {/* Placeholder for symmetry */}
              <div className="w-14" />
            </GlassCard>
          </div>
        </motion.div>

        {/* Video PiP when camera is enabled */}
        <AnimatePresence>
          {cameraEnabled && videoStream && (
            <motion.div
              className="pip-container"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
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
        </AnimatePresence>
      </div>
    </div>
  );
}
