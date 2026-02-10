'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BreathPhase,
  BREATHING_PATTERNS,
} from '@/lib/breathing';
import { MeditationAudioManager } from '@/lib/meditation-audio';

interface BreathingGuideProps {
  patternId?: string;
  isActive: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onPhaseChange?: (phase: BreathPhase) => void;
  showRounds?: boolean;
  enableAudio?: boolean;
}

const PHASE_COLORS: Record<string, string> = {
  inhale: '#4ecdc4',
  hold: '#7b68ee',
  exhale: '#e94560',
  rest: 'rgba(255,255,255,0.12)',
};

const SIZE_CLASSES = {
  sm: 'w-32 h-32',
  md: 'w-48 h-48',
  lg: 'w-64 h-64',
};

export default function BreathingGuide({
  patternId = 'calm',
  isActive,
  showLabel = true,
  size = 'md',
  onPhaseChange,
  showRounds = true,
  enableAudio = false,
}: BreathingGuideProps) {
  const pattern = BREATHING_PATTERNS[patternId] ?? BREATHING_PATTERNS['calm'];
  const phases = pattern.phases;

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [countdown, setCountdown] = useState(phases[0].duration);

  const audioRef = useRef<MeditationAudioManager | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPhase = phases[phaseIndex];
  const color = PHASE_COLORS[currentPhase.name];

  // Determine the scale for the breathing circle
  const getScale = useCallback(() => {
    switch (currentPhase.name) {
      case 'inhale':
        return 1.4;
      case 'hold':
        return phaseIndex > 0 && phases[phaseIndex - 1]?.name === 'inhale' ? 1.4 : 1.0;
      case 'exhale':
        return 1.0;
      case 'rest':
        return 1.0;
      default:
        return 1.0;
    }
  }, [currentPhase.name, phaseIndex, phases]);

  // Get transition duration based on current phase
  const getTransitionDuration = useCallback(() => {
    if (currentPhase.name === 'hold' || currentPhase.name === 'rest') {
      return 0.3;
    }
    return currentPhase.duration;
  }, [currentPhase]);

  // Initialize audio manager
  useEffect(() => {
    if (enableAudio && !audioRef.current) {
      audioRef.current = new MeditationAudioManager();
      audioRef.current.init();
    }
    return () => {
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, [enableAudio]);

  // Play audio cues
  const playAudioCue = useCallback(
    (phase: BreathPhase) => {
      if (!enableAudio || !audioRef.current) return;
      if (phase.name === 'inhale' || phase.name === 'exhale') {
        audioRef.current.playBreathCue(phase.name);
      }
      audioRef.current.playChime();
    },
    [enableAudio]
  );

  // Reset state when pattern changes or becomes inactive
  useEffect(() => {
    if (!isActive) {
      setPhaseIndex(0);
      setRound(1);
      setCountdown(phases[0].duration);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  }, [isActive, patternId, phases]);

  // Phase cycling logic
  useEffect(() => {
    if (!isActive) return;

    // Fire the phase change callback
    onPhaseChange?.(currentPhase);
    playAudioCue(currentPhase);
    setCountdown(currentPhase.duration);

    // Countdown interval (ticks every second)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    // Move to the next phase after the current phase duration
    timeoutRef.current = setTimeout(() => {
      setPhaseIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % phases.length;
        if (nextIndex === 0) {
          setRound((r) => r + 1);
        }
        return nextIndex;
      });
    }, currentPhase.duration * 1000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, phaseIndex, round]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pattern name */}
      <p className="text-sm text-white/60 tracking-wide uppercase">
        {pattern.name}
      </p>

      {/* Animated breathing circle */}
      <div className={`relative flex items-center justify-center ${SIZE_CLASSES[size]}`}>
        {/* Outer glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: isActive
              ? `0 0 40px ${color}40, 0 0 80px ${color}20`
              : '0 0 0px transparent',
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Main breathing circle */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${color}`,
            background: `radial-gradient(circle at center, ${color}15 0%, ${color}05 60%, transparent 100%)`,
          }}
          animate={{
            scale: isActive ? getScale() : 1.0,
            borderColor: color,
          }}
          transition={{
            scale: {
              duration: getTransitionDuration(),
              ease: 'easeInOut',
            },
            borderColor: {
              duration: 0.5,
            },
          }}
        />

        {/* Inner glow pulse */}
        <motion.div
          className="absolute inset-4 rounded-full"
          animate={{
            background: isActive
              ? `radial-gradient(circle at center, ${color}30 0%, transparent 70%)`
              : 'radial-gradient(circle at center, transparent 0%, transparent 100%)',
            opacity: isActive ? [0.5, 1, 0.5] : 0,
          }}
          transition={{
            opacity: {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        />

        {/* Center content */}
        {showLabel && (
          <div className="relative z-10 flex flex-col items-center gap-1">
            <motion.span
              className="text-white font-medium text-sm sm:text-base"
              key={currentPhase.label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentPhase.label}
            </motion.span>
            <span className="text-white/50 text-lg font-mono session-timer">
              {countdown}
            </span>
          </div>
        )}
      </div>

      {/* Round counter */}
      {showRounds && isActive && (
        <motion.p
          className="text-xs text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Round {round} of {pattern.recommendedRounds}
        </motion.p>
      )}
    </div>
  );
}
