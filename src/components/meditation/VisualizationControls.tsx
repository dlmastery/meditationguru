/**
 * Compact visualization controls overlay for the session screen.
 *
 * Provides a style selector (icon buttons) and a toggle to enable/disable
 * the visualization feature during a meditation session.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Droplets,
  Brush,
  Sparkles,
  Stars,
  TreePine,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { VisualizationState } from '@/types/features';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VisualizationControlsProps {
  /** Whether the visualization feature is active. */
  readonly isActive: boolean;
  /** Currently selected art style. */
  readonly currentStyle: VisualizationState['style'];
  /** Callback when the user selects a different style. */
  readonly onStyleChange: (style: VisualizationState['style']) => void;
  /** Callback to toggle visualization on/off. */
  readonly onToggle: () => void;
}

// ---------------------------------------------------------------------------
// Style button definitions
// ---------------------------------------------------------------------------

interface StyleOption {
  readonly key: VisualizationState['style'];
  readonly label: string;
  readonly icon: typeof Palette;
}

const STYLE_OPTIONS: readonly StyleOption[] = [
  { key: 'watercolor', label: 'Watercolor', icon: Droplets },
  { key: 'oil-painting', label: 'Oil Painting', icon: Brush },
  { key: 'ethereal', label: 'Ethereal', icon: Sparkles },
  { key: 'cosmic', label: 'Cosmic', icon: Stars },
  { key: 'nature', label: 'Nature', icon: TreePine },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VisualizationControls({
  isActive,
  currentStyle,
  onStyleChange,
  onToggle,
}: VisualizationControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Toggle button */}
      <button
        type="button"
        onClick={onToggle}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
          transition-all duration-200
          ${
            isActive
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
              : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/60'
          }
        `}
        aria-label={isActive ? 'Disable visualization' : 'Enable visualization'}
      >
        {isActive ? (
          <Eye className="w-3.5 h-3.5" />
        ) : (
          <EyeOff className="w-3.5 h-3.5" />
        )}
        <span>Visuals</span>
      </button>

      {/* Style selector (only visible when active) */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="flex items-center gap-1"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {STYLE_OPTIONS.map(({ key, label, icon: Icon }) => {
              const selected = currentStyle === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onStyleChange(key)}
                  className={`
                    p-1.5 rounded-lg transition-all duration-150
                    ${
                      selected
                        ? 'bg-white/15 text-white shadow-sm shadow-purple-500/20'
                        : 'bg-transparent text-white/30 hover:text-white/60 hover:bg-white/5'
                    }
                  `}
                  aria-label={`Style: ${label}`}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
