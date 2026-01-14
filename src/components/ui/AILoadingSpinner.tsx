'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AILoadingSpinnerProps {
  isLoading: boolean;
  messages?: string[];
  fullScreen?: boolean;
}

const defaultMessages = [
  "Connecting to your Guru...",
  "Reading your energy...",
  "Analyzing your intentions...",
  "Consulting the cosmos...",
  "Preparing personalized guidance...",
  "Channeling ancient wisdom...",
  "Aligning your chakras...",
];

export default function AILoadingSpinner({
  isLoading,
  messages = defaultMessages,
  fullScreen = false
}: AILoadingSpinnerProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading, messages.length]);

  const containerClass = fullScreen
    ? "fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center"
    : "flex flex-col items-center justify-center py-12";

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className={containerClass}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex flex-col items-center gap-8">
            {/* Cosmic Spinner */}
            <div className="relative w-32 h-32">
              {/* Outer rotating ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-transparent"
                style={{
                  borderTopColor: '#f5c518',
                  borderRightColor: '#e94560',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />

              {/* Middle pulsing ring */}
              <motion.div
                className="absolute inset-3 rounded-full border-2 border-purple-500/50"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Inner rotating ring (reverse) */}
              <motion.div
                className="absolute inset-6 rounded-full border-4 border-transparent"
                style={{
                  borderBottomColor: '#7b68ee',
                  borderLeftColor: '#45b7d1',
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />

              {/* Center glowing orb */}
              <motion.div
                className="absolute inset-10 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500"
                animate={{
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    '0 0 20px rgba(236, 72, 153, 0.5)',
                    '0 0 40px rgba(139, 92, 246, 0.8)',
                    '0 0 20px rgba(236, 72, 153, 0.5)',
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Sparkle particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-yellow-400"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    x: [0, Math.cos(i * 45 * Math.PI / 180) * 60],
                    y: [0, Math.sin(i * 45 * Math.PI / 180) * 60],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>

            {/* AI Brain Animation */}
            <motion.div
              className="flex gap-1"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-3 h-8 rounded-full bg-gradient-to-t from-purple-600 to-pink-400"
                  animate={{
                    scaleY: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>

            {/* Rotating messages */}
            <div className="h-8 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={messageIndex}
                  className="text-white/80 text-lg font-light text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {messages[messageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Glowing dots */}
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
