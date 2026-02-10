'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  X, Pause, Play, SkipForward, Heart, Video, VideoOff,
  ChevronLeft, ChevronRight, Camera,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { GlassCard, Button, AILoadingSpinner } from '@/components/ui';
import GuruAvatar from '@/components/guru/GuruAvatar';
import { YogaPoseIllustration } from '@/components/yoga';
import PoseCorrection from '@/components/yoga/PoseCorrection';
import PoseFeedback from '@/components/yoga/PoseFeedback';
import { BreathingGuide, EmotionIndicator } from '@/components/meditation';
import BreathingBiofeedback from '@/components/meditation/BreathingBiofeedback';
import SoundscapeControls from '@/components/meditation/SoundscapeControls';
import VisualizationCanvas from '@/components/meditation/VisualizationCanvas';
import VisualizationControls from '@/components/meditation/VisualizationControls';
import { EnhancedGeminiLiveSession } from '@/lib/gemini-enhanced';
import type { EnhancedSessionCallbacks, EnhancedSessionConfig } from '@/lib/gemini-enhanced';
import { GURU_VOICES } from '@/lib/gemini';
import { YOGA_POSES, YOGA_FLOWS } from '@/lib/imagen';
import { getPatternForGoal } from '@/lib/breathing';
import { playBell, playTripleBell } from '@/lib/meditation-audio';
import { useEmotionAdaptation } from '@/hooks/useEmotionAdaptation';
import { usePoseCorrection } from '@/hooks/usePoseCorrection';
import { useBreathingBiofeedback } from '@/hooks/useBreathingBiofeedback';
import { useSoundscape } from '@/hooks/useSoundscape';
import { useVisualization } from '@/hooks/useVisualization';
import type { GeminiFunctionCall } from '@/types/features';

const CosmicScene = dynamic(() => import('@/components/three/CosmicScene'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#0a0a12]" />,
});

function SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionType = searchParams.get('type') || 'meditation';
  const goalParam = searchParams.get('goal') || '';

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

  const [liveSession, setLiveSession] = useState<EnhancedGeminiLiveSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [guruMessage, setGuruMessage] = useState('');
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [selectedMood, setSelectedMood] = useState('');
  const [biofeedbackActive, setBiofeedbackActive] = useState(false);

  // Breathing pattern - derived from goal or default
  const breathingPatternId = goalParam ? getPatternForGoal(goalParam).id : 'calm';

  // Feature hooks
  const { currentEmotion, adaptation, handleEmotionDetected } = useEmotionAdaptation(isPlaying);
  const { poseAnalysis, corrections: poseCorrections, handlePoseCorrections } = usePoseCorrection(isPlaying);
  const { measurement: breathMeasurement, comparison: breathComparison } = useBreathingBiofeedback(isPlaying, breathingPatternId);
  const { activeSoundscape, isPlaying: isSoundscapePlaying, loadPreset, handleFunctionCall: handleSoundscapeCall, setMasterGain, dispose: disposeSoundscape } = useSoundscape();
  const { state: vizState, handleFunctionCall: handleVizCall, setStyle: setVizStyle, toggle: toggleViz } = useVisualization();

  // Yoga pose tracking
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [currentFlow] = useState(YOGA_FLOWS['sun-salutation']);
  const currentPose = sessionType === 'yoga' ? currentFlow.poses[currentPoseIndex] : null;

  const sessionMessages = sessionType === 'meditation'
    ? [
        "Preparing your meditation space...",
        "Tuning into tranquility...",
        "Calibrating breathing guide...",
        "Detecting your emotional state...",
        "Your Guru is entering...",
      ]
    : [
        "Preparing your yoga mat...",
        "Generating pose illustrations...",
        "Activating pose correction AI...",
        "Loading pose guidance...",
        "Your Guru is ready...",
      ];

  // Navigate poses
  const handlePrevPose = () => {
    if (currentPoseIndex > 0) {
      setCurrentPoseIndex(prev => prev - 1);
      const prevPose = currentFlow.poses[currentPoseIndex - 1];
      liveSession?.sendText(`Guide me through ${YOGA_POSES[prevPose]?.name || prevPose}`);
    }
  };

  const handleNextPose = () => {
    if (currentPoseIndex < currentFlow.poses.length - 1) {
      setCurrentPoseIndex(prev => prev + 1);
      const nextPose = currentFlow.poses[currentPoseIndex + 1];
      liveSession?.sendText(`Now let's move to ${YOGA_POSES[nextPose]?.name || nextPose}`);
    }
  };

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

  // Play a bell when session starts
  useEffect(() => {
    if (!isInitializing && sessionType === 'meditation') {
      playBell();
    }
  }, [isInitializing, sessionType]);

  // Route function calls from Gemini to the right handler
  const handleFunctionCall = useCallback((call: GeminiFunctionCall) => {
    switch (call.name) {
      case 'control_soundscape':
        handleSoundscapeCall(call);
        break;
      case 'generate_visualization':
        handleVizCall(call);
        break;
      default:
        break;
    }
  }, [handleSoundscapeCall, handleVizCall]);

  // Initialize enhanced Gemini session
  const initializeSession = useCallback(async () => {
    setIsInitializing(true);

    const callbacks: EnhancedSessionCallbacks = {
      onMessage: (message) => {
        setGuruMessage(message);
        setIsGuruSpeaking(true);
        addGuruMessage({
          id: Date.now().toString(),
          role: 'guru',
          content: message,
          timestamp: new Date(),
        });
      },
      onAudio: (audioData) => {
        playAudio(audioData);
      },
      onError: (error) => {
        console.error('Session error:', error);
        setIsInitializing(false);
      },
      onEmotionDetected: handleEmotionDetected,
      onFunctionCall: handleFunctionCall,
      onPoseCorrection: handlePoseCorrections,
    };

    const sessionConfig: EnhancedSessionConfig = {
      voiceId: guruVoice?.id || GURU_VOICES[2].id,
      enableFunctionCalling: true,
      enableAffectiveDialog: true,
    };

    const session = new EnhancedGeminiLiveSession(callbacks, sessionConfig);
    await session.connect();
    setLiveSession(session);

    const startPrompt = sessionType === 'meditation'
      ? "Guide me through a calming meditation session. Start with breathing exercises and lead me into a peaceful state. Use the soundscape and visualization tools to enhance the experience."
      : "Guide me through a yoga session. Start with gentle warm-up poses and provide clear instructions. Watch my form through the camera and provide corrections.";

    session.sendText(startPrompt);
    await session.startAudioStream();
    setIsInitializing(false);
  }, [sessionType, guruVoice, setIsGuruSpeaking, addGuruMessage, handleEmotionDetected, handleFunctionCall, handlePoseCorrections]);

  useEffect(() => {
    initializeSession();
    return () => {
      liveSession?.disconnect();
      disposeSoundscape();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      liveSession?.stopVideoStream();
    } else {
      const stream = await liveSession?.startVideoStream();
      if (stream) {
        setVideoStream(stream);
        setCameraEnabled(true);
        liveSession?.sendText("I've enabled my camera. Please watch my form and provide corrections as needed.");
      }
    }
  };

  const toggleBiofeedback = () => {
    const next = !biofeedbackActive;
    setBiofeedbackActive(next);
    if (next && !cameraEnabled) {
      toggleCamera();
    }
  };

  const handleEndSession = () => {
    setIsPlaying(false);
    setShowEndScreen(true);
    playTripleBell();
    liveSession?.sendText("Let's conclude our session with a peaceful ending.");
  };

  const handleSaveSession = async () => {
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
      <AILoadingSpinner
        isLoading={isInitializing}
        messages={sessionMessages}
        fullScreen
      />

      {/* Visualization Art Layer (behind everything) */}
      {sessionType === 'meditation' && vizState.isActive && (
        <VisualizationCanvas state={vizState} isActive={isPlaying} />
      )}

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
            aria-label="Close session"
          >
            <X className="w-6 h-6 text-white/80" />
          </button>

          <div className="text-center">
            <p className="text-white/60 text-sm capitalize">{sessionType} Session</p>
            <p className="text-2xl font-mono text-white session-timer">{formatTime(elapsedTime)}</p>
          </div>

          <div className="flex gap-2">
            {/* Emotion indicator */}
            <EmotionIndicator
              emotion={currentEmotion}
              isActive={isPlaying && !isInitializing}
              size="sm"
            />

            {/* Camera toggle */}
            <button
              onClick={toggleCamera}
              className={`p-2 rounded-full transition-colors ${
                cameraEnabled ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'
              }`}
              aria-label={cameraEnabled ? 'Disable camera' : 'Enable camera'}
            >
              {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* Biofeedback toggle (meditation only) */}
            {sessionType === 'meditation' && (
              <button
                onClick={toggleBiofeedback}
                className={`p-2 rounded-full transition-colors ${
                  biofeedbackActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-white/60'
                }`}
                aria-label={biofeedbackActive ? 'Disable breathing biofeedback' : 'Enable breathing biofeedback'}
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
          {/* Guru */}
          <motion.div className="mb-6">
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

          {/* Breathing Guide + Biofeedback (Meditation only) */}
          {sessionType === 'meditation' && (
            <div className="mb-6 flex flex-col items-center gap-4">
              <BreathingGuide
                patternId={adaptation?.breathingPatternId ?? breathingPatternId}
                isActive={isPlaying}
                size="lg"
                enableAudio
                showRounds
                showLabel
              />
              {biofeedbackActive && (
                <BreathingBiofeedback
                  comparison={breathComparison}
                  measurement={breathMeasurement}
                  isActive={isPlaying && biofeedbackActive}
                  targetPatternName={adaptation?.breathingPatternId ?? breathingPatternId}
                />
              )}
            </div>
          )}

          {/* Soundscape Controls (Meditation only) */}
          {sessionType === 'meditation' && (
            <div className="mb-4 w-full max-w-md">
              <SoundscapeControls
                activeSoundscape={activeSoundscape}
                isActive={isPlaying}
                onPresetSelect={loadPreset}
                onMasterGainChange={setMasterGain}
              />
            </div>
          )}

          {/* Visualization Controls (Meditation only) */}
          {sessionType === 'meditation' && (
            <VisualizationControls
              isActive={vizState.isActive}
              currentStyle={vizState.style}
              onStyleChange={setVizStyle}
              onToggle={toggleViz}
            />
          )}

          {/* Yoga Pose + Correction (Yoga only) */}
          {sessionType === 'yoga' && currentPose && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6"
            >
              <YogaPoseIllustration
                poseId={currentPose}
                style="line-drawing"
                size="lg"
              />

              {/* Pose Correction overlay */}
              <PoseCorrection
                poseAnalysis={poseAnalysis}
                isActive={isPlaying && cameraEnabled}
              />

              {/* Pose Navigation */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={handlePrevPose}
                  disabled={currentPoseIndex === 0}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous pose"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <div className="text-center">
                  <p className="text-white/60 text-sm">
                    Pose {currentPoseIndex + 1} of {currentFlow.poses.length}
                  </p>
                  <p className="text-white font-medium">{currentFlow.name}</p>
                </div>
                <button
                  onClick={handleNextPose}
                  disabled={currentPoseIndex === currentFlow.poses.length - 1}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next pose"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </div>
            </motion.div>
          )}
        </main>

        {/* Pose Feedback Toast (Yoga only) */}
        {sessionType === 'yoga' && poseCorrections.length > 0 && (
          <PoseFeedback corrections={poseCorrections} showLatest />
        )}

        {/* Bottom Controls */}
        <motion.div className="fixed bottom-0 left-0 right-0 p-4 pb-6">
          <div className="max-w-md mx-auto">
            <GlassCard className="flex items-center justify-center gap-6">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label={isPlaying ? 'Pause session' : 'Resume session'}
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
                aria-label="Try something different"
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
                      {moodOptions.map((m) => (
                        <button
                          key={m.label}
                          onClick={() => setSelectedMood(m.label)}
                          className={`p-3 rounded-xl transition-all ${
                            selectedMood === m.label
                              ? 'bg-purple-500/30 border border-purple-500/50 scale-110'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-2xl">{m.emoji}</span>
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

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#0a0a12]" />}>
      <SessionContent />
    </Suspense>
  );
}
