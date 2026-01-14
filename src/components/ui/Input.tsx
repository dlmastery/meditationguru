'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';

// Omit conflicting HTML animation events that clash with Framer Motion's types
type MotionInputProps = Omit<
  HTMLMotionProps<'input'>,
  'ref'
>;

interface InputProps extends MotionInputProps {
  label?: string;
  error?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'search';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, iconPosition = 'left', variant = 'default', className = '', ...props }, ref) => {
    const variants = {
      default: `
        bg-white/5 border-white/10 focus:border-purple-500/50
        placeholder:text-white/30
      `,
      search: `
        bg-white/10 border-white/20 focus:border-gold-500/50
        placeholder:text-white/40 text-lg
      `,
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-white/70 text-sm mb-2 font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              {icon}
            </div>
          )}
          <motion.input
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-xl border
              bg-opacity-50 backdrop-blur-sm
              text-white outline-none
              transition-all duration-300
              focus:ring-2 focus:ring-purple-500/20
              ${variants[variant]}
              ${icon && iconPosition === 'left' ? 'pl-12' : ''}
              ${icon && iconPosition === 'right' ? 'pr-12' : ''}
              ${error ? 'border-red-500/50' : ''}
              ${className}
            `}
            whileFocus={{ scale: 1.01 }}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <motion.p
            className="text-red-400 text-sm mt-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
