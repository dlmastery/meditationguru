'use client';

import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Entering the cosmos...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-[#0a0a12] flex flex-col items-center justify-center z-50">
      {/* Animated cosmic rings */}
      <div className="relative w-32 h-32">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-purple-500/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.3, 0.8, 0.3],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 3,
              delay: i * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              borderColor: i === 0 ? '#e94560' : i === 1 ? '#7b68ee' : '#f5c518',
            }}
          />
        ))}

        {/* Center orb */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-8 h-8 -mt-4 -ml-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Loading text */}
      <motion.p
        className="mt-8 text-white/60 text-lg font-light tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {message}
      </motion.p>

      {/* Animated dots */}
      <div className="flex gap-1 mt-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-white/40"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1,
              delay: i * 0.2,
              repeat: Infinity,
            }}
          />
        ))}
      </div>
    </div>
  );
}
