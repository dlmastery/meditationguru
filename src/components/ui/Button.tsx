'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'glow';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  glowColor?: string;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  glowColor = '#e94560',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: `
      bg-gradient-to-r from-pink-500 to-purple-600
      hover:from-pink-400 hover:to-purple-500
      text-white font-medium
      shadow-lg shadow-purple-500/25
    `,
    secondary: `
      bg-white/10 hover:bg-white/20
      text-white font-medium
      border border-white/20
    `,
    ghost: `
      bg-transparent hover:bg-white/5
      text-white/80 hover:text-white
    `,
    glow: `
      bg-transparent border-2
      text-white font-medium
      hover:bg-white/5
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-base rounded-xl',
    lg: 'px-6 py-3 text-lg rounded-xl',
    xl: 'px-8 py-4 text-xl rounded-2xl',
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      className={`
        relative inline-flex items-center justify-center gap-2
        transition-all duration-300 ease-out
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={variant === 'glow' ? {
        borderColor: glowColor,
        boxShadow: `0 0 20px ${glowColor}40, inset 0 0 20px ${glowColor}10`
      } : undefined}
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      disabled={isDisabled}
      {...props}
    >
      {/* Glow effect on hover */}
      {variant === 'glow' && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${glowColor}30 0%, transparent 70%)`
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </span>
    </motion.button>
  );
}
