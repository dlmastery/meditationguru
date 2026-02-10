'use client';

/**
 * Soundscape control panel for selecting presets, adjusting volume,
 * and visualizing active audio layers.
 *
 * @module SoundscapeControls
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Music, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';

import type { Soundscape, SoundLayer } from '@/types/features';
import { SOUNDSCAPE_PRESETS, PRESET_IDS } from '@/lib/soundscape-presets';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SoundscapeControlsProps {
  /** The currently loaded soundscape (null when idle). */
  activeSoundscape: Soundscape | null;
  /** Whether the engine is actively playing. */
  isActive: boolean;
  /** Called when the user picks a preset. */
  onPresetSelect: (presetId: string) => void;
  /** Called when the user changes the master volume. */
  onMasterGainChange: (gain: number) => void;
}

// ---------------------------------------------------------------------------
// Preset metadata for chips
// ---------------------------------------------------------------------------

const PRESET_ICONS: Record<string, string> = {
  'rain-temple': '🌧',
  'ocean-night': '🌊',
  'forest-stream': '🌿',
  'tibetan-singing-bowl': '🔔',
  'cosmic-ambient': '✨',
  'morning-garden': '🌸',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SoundscapeControls({
  activeSoundscape,
  isActive,
  onPresetSelect,
  onMasterGainChange,
}: SoundscapeControlsProps) {
  const [masterGain, setMasterGain] = useState(0.6);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');

  const handleGainChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setMasterGain(value);
      onMasterGainChange(value);
    },
    [onMasterGainChange],
  );

  const activeLayers: readonly SoundLayer[] = activeSoundscape?.layers ?? [];

  return (
    <motion.div
      className="glass rounded-2xl p-4 space-y-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium text-white/80">Soundscape</span>
        </div>
        {isActive && activeSoundscape && (
          <span className="text-xs text-white/50">{activeSoundscape.name}</span>
        )}
      </div>

      {/* Preset picker - horizontal scrollable chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {PRESET_IDS.map((id) => {
          const preset = SOUNDSCAPE_PRESETS[id];
          const isSelected = activeSoundscape?.id === id;
          return (
            <button
              key={id}
              onClick={() => onPresetSelect(id)}
              className={`
                flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                text-xs font-medium transition-all duration-200
                ${isSelected
                  ? 'bg-secondary/30 border border-secondary/50 text-white'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80'
                }
              `}
              aria-pressed={isSelected}
            >
              <span>{PRESET_ICONS[id] ?? ''}</span>
              <span>{preset.name}</span>
            </button>
          );
        })}

        {/* Custom option */}
        <button
          onClick={() => setShowCustom((prev) => !prev)}
          className={`
            flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full
            text-xs font-medium transition-all duration-200
            ${showCustom
              ? 'bg-accent/20 border border-accent/40 text-accent'
              : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80'
            }
          `}
        >
          <Sparkles className="w-3 h-3" />
          <span>Custom</span>
        </button>
      </div>

      {/* Custom soundscape input */}
      <AnimatePresence>
        {showCustom && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Describe your soundscape..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5
                           text-xs text-white placeholder-white/30
                           focus:outline-none focus:border-secondary/50"
              />
            </div>
            <p className="text-[10px] text-white/30 mt-1">
              Ask the guru to create this soundscape during your session.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Master volume slider */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            const next = masterGain > 0 ? 0 : 0.6;
            setMasterGain(next);
            onMasterGainChange(next);
          }}
          className="text-white/50 hover:text-white/80 transition-colors"
          aria-label={masterGain > 0 ? 'Mute' : 'Unmute'}
        >
          {masterGain > 0 ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={masterGain}
          onChange={handleGainChange}
          className="flex-1 h-1 appearance-none bg-white/10 rounded-full
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-secondary
                     [&::-webkit-slider-thumb]:cursor-pointer"
          aria-label="Master volume"
        />
        <span className="text-[10px] text-white/40 w-7 text-right tabular-nums">
          {Math.round(masterGain * 100)}%
        </span>
      </div>

      {/* Active layer visualizer */}
      <AnimatePresence>
        {isActive && activeLayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-1.5 items-end h-8"
          >
            {activeLayers.map((layer) => (
              <LayerBar key={layer.id} layer={layer} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Layer visualization bar
// ---------------------------------------------------------------------------

function LayerBar({ layer }: { layer: SoundLayer }) {
  const height = Math.max(8, layer.gain * 100);
  const animationDuration = layer.lfoRate ? 1 / layer.lfoRate : 2;

  return (
    <motion.div
      className="flex flex-col items-center gap-0.5 flex-1 min-w-0"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      exit={{ scaleY: 0 }}
      transition={{ duration: 0.3 }}
      title={layer.name}
    >
      <motion.div
        className="w-full rounded-sm bg-secondary/60"
        style={{ height: `${height}%`, originY: 1 }}
        animate={{
          scaleY: [1, 0.7, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: Math.max(0.5, animationDuration),
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <span className="text-[8px] text-white/30 truncate w-full text-center">
        {layer.name}
      </span>
    </motion.div>
  );
}
