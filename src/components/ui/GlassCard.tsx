'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: string;
  variant?: 'default' | 'dark' | 'light';
}

export default function GlassCard({
  children,
  className = '',
  glow = false,
  glowColor = '#e94560',
  variant = 'default',
  ...props
}: GlassCardProps) {
  const variants = {
    default: 'bg-white/5 border-white/10',
    dark: 'bg-black/20 border-white/5',
    light: 'bg-white/10 border-white/20',
  };

  return (
    <motion.div
      className={`
        relative rounded-2xl backdrop-blur-xl border p-6
        ${variants[variant]}
        ${glow ? 'shadow-lg' : ''}
        ${className}
      `}
      style={glow ? {
        boxShadow: `0 0 40px ${glowColor}20, 0 0 80px ${glowColor}10`
      } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      {/* Inner glow effect */}
      {glow && (
        <div
          className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${glowColor}30 0%, transparent 70%)`
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
