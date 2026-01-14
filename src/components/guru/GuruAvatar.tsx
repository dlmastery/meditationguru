'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';

interface GuruAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speaking?: boolean;
  listening?: boolean;
  materializing?: boolean;
  className?: string;
}

export default function GuruAvatar({
  size = 'lg',
  speaking = false,
  listening = false,
  materializing = false,
  className = '',
}: GuruAvatarProps) {
  const { isGuruSpeaking } = useAppStore();
  const isSpeaking = speaking || isGuruSpeaking;
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const sizes = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64',
  };

  // Generate particles when speaking
  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        setParticles((prev) => {
          const newParticle = {
            id: Date.now(),
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
          };
          return [...prev.slice(-20), newParticle];
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      setParticles([]);
    }
  }, [isSpeaking]);

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      {/* Cosmic glow behind avatar */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(233, 69, 96, 0.3) 0%, rgba(123, 104, 238, 0.2) 50%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{
          scale: isSpeaking ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: isSpeaking ? [0.5, 0.8, 0.5] : [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: isSpeaking ? 0.5 : 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main avatar container */}
      <AnimatePresence mode="wait">
        {materializing ? (
          // Materializing animation - stardust forming into shape
          <motion.div
            key="materializing"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-gold-400 to-purple-500"
                initial={{
                  x: (Math.random() - 0.5) * 200,
                  y: (Math.random() - 0.5) * 200,
                  opacity: 0,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.05,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        ) : (
          // Normal avatar display
          <motion.div
            key="avatar"
            className="relative w-full h-full"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Avatar image placeholder - Traditional Yogi */}
            <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/20">
              {/* Gradient background for avatar */}
              <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 to-indigo-900/50" />

              {/* Avatar SVG representation */}
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Guru silhouette in lotus position */}
                <defs>
                  <radialGradient id="guruGlow" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#f5c518" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#7b68ee" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="robeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="100%" stopColor="#d4a574" />
                  </linearGradient>
                </defs>

                {/* Background glow */}
                <circle cx="100" cy="100" r="90" fill="url(#guruGlow)" />

                {/* Body/Robes */}
                <ellipse cx="100" cy="155" rx="55" ry="40" fill="url(#robeGradient)" opacity="0.9" />

                {/* Head */}
                <circle cx="100" cy="70" r="35" fill="#8B7355" />

                {/* Face features */}
                <ellipse cx="100" cy="75" rx="28" ry="30" fill="#C4A77D" />

                {/* Eyes - closed in meditation */}
                <motion.path
                  d="M 85 70 Q 90 73 95 70"
                  stroke="#4a3728"
                  strokeWidth="2"
                  fill="none"
                  animate={listening ? { d: "M 85 68 Q 90 75 95 68" } : {}}
                />
                <motion.path
                  d="M 105 70 Q 110 73 115 70"
                  stroke="#4a3728"
                  strokeWidth="2"
                  fill="none"
                  animate={listening ? { d: "M 105 68 Q 110 75 115 68" } : {}}
                />

                {/* Third eye dot */}
                <circle cx="100" cy="58" r="3" fill="#e94560" opacity="0.8" />

                {/* Nose */}
                <path d="M 100 72 L 98 82 L 102 82 Z" fill="#a88a68" />

                {/* Mouth - subtle smile */}
                <motion.path
                  d="M 92 90 Q 100 95 108 90"
                  stroke="#8B7355"
                  strokeWidth="2"
                  fill="none"
                  animate={isSpeaking ? {
                    d: ["M 92 90 Q 100 95 108 90", "M 92 88 Q 100 98 108 88", "M 92 90 Q 100 95 108 90"]
                  } : {}}
                  transition={{ duration: 0.3, repeat: isSpeaking ? Infinity : 0 }}
                />

                {/* Beard */}
                <ellipse cx="100" cy="105" rx="20" ry="15" fill="#e8e8e8" opacity="0.9" />

                {/* Hair/Topknot */}
                <ellipse cx="100" cy="45" rx="15" ry="12" fill="#4a4a4a" />

                {/* Hands in meditation pose */}
                <circle cx="70" cy="140" r="10" fill="#C4A77D" />
                <circle cx="130" cy="140" r="10" fill="#C4A77D" />
              </svg>

              {/* Cosmic overlay */}
              <div
                className="absolute inset-0 mix-blend-overlay opacity-30"
                style={{
                  background: 'radial-gradient(circle at 50% 30%, rgba(245, 197, 24, 0.3) 0%, transparent 60%)',
                }}
              />
            </div>

            {/* Speaking particles */}
            <AnimatePresence>
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute w-1.5 h-1.5 rounded-full bg-gold-400"
                  initial={{
                    x: '50%',
                    y: '50%',
                    opacity: 1,
                    scale: 0,
                  }}
                  animate={{
                    x: `calc(50% + ${particle.x}px)`,
                    y: `calc(50% + ${particle.y}px)`,
                    opacity: 0,
                    scale: 1,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  style={{
                    left: 0,
                    top: 0,
                  }}
                />
              ))}
            </AnimatePresence>

            {/* Listening indicator */}
            {listening && (
              <motion.div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-green-400"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.15,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outer ring - breathing animation */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-purple-500/20"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
