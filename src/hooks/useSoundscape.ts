'use client';

/**
 * React hook managing the lifecycle of a {@link SoundscapeEngine}.
 *
 * Provides a simple API surface for components to load presets, route Gemini
 * function calls, and control playback without touching Web Audio directly.
 *
 * @module useSoundscape
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { GeminiFunctionCall, Soundscape } from '@/types/features';
import { SoundscapeEngine } from '@/lib/soundscape-engine';
import { SOUNDSCAPE_PRESETS } from '@/lib/soundscape-presets';
import { handleSoundscapeCommand } from '@/lib/soundscape-handler';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

interface UseSoundscapeReturn {
  /** The underlying engine instance (null before init). */
  engine: SoundscapeEngine | null;
  /** The currently loaded soundscape definition. */
  activeSoundscape: Soundscape | null;
  /** Whether the engine is initialized and has active layers. */
  isPlaying: boolean;
  /** Load a preset by its id and start playback. Pass null to stop. */
  loadPreset: (presetId: string | null) => void;
  /** Route a Gemini function call to the engine. */
  handleFunctionCall: (call: GeminiFunctionCall) => void;
  /** Set the master volume (0 - 1). */
  setMasterGain: (gain: number) => void;
  /** Stop playback and tear down the engine. */
  dispose: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages a SoundscapeEngine's full lifecycle inside a React component tree.
 *
 * The engine is lazily initialized on the first call to `loadPreset` so that
 * an AudioContext is only created after a user gesture (browser requirement).
 */
export function useSoundscape(): UseSoundscapeReturn {
  const engineRef = useRef<SoundscapeEngine | null>(null);
  const [activeSoundscape, setActiveSoundscape] = useState<Soundscape | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Ensure engine exists, lazily creating it on first use.
  const getEngine = useCallback((): SoundscapeEngine => {
    if (!engineRef.current) {
      const engine = new SoundscapeEngine();
      engine.init();
      engineRef.current = engine;
    }
    return engineRef.current;
  }, []);

  // -----------------------------------------------------------------------
  // loadPreset
  // -----------------------------------------------------------------------

  const loadPreset = useCallback(
    (presetId: string | null) => {
      if (presetId === null) {
        // Stop current playback
        if (engineRef.current) {
          engineRef.current.dispose();
          engineRef.current = null;
        }
        setActiveSoundscape(null);
        setIsPlaying(false);
        return;
      }

      const preset = SOUNDSCAPE_PRESETS[presetId];
      if (!preset) return;

      // If we already have a playing engine, tear it down first to start fresh
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }

      const engine = getEngine();
      engine.setMasterGain(preset.masterGain);

      for (const layer of preset.layers) {
        engine.addLayer(layer);
      }

      setActiveSoundscape(preset);
      setIsPlaying(true);
    },
    [getEngine],
  );

  // -----------------------------------------------------------------------
  // handleFunctionCall
  // -----------------------------------------------------------------------

  const handleFunctionCall = useCallback(
    (call: GeminiFunctionCall) => {
      if (call.name !== 'control_soundscape') return;
      const engine = getEngine();
      handleSoundscapeCommand(engine, call);

      // Update active layers snapshot
      const layers = engine.getActiveLayers();
      setIsPlaying(layers.length > 0);

      if (activeSoundscape) {
        setActiveSoundscape({
          ...activeSoundscape,
          layers,
        });
      }
    },
    [getEngine, activeSoundscape],
  );

  // -----------------------------------------------------------------------
  // setMasterGain
  // -----------------------------------------------------------------------

  const setMasterGain = useCallback(
    (gain: number) => {
      engineRef.current?.setMasterGain(gain);
    },
    [],
  );

  // -----------------------------------------------------------------------
  // dispose
  // -----------------------------------------------------------------------

  const dispose = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
    setActiveSoundscape(null);
    setIsPlaying(false);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return {
    engine: engineRef.current,
    activeSoundscape,
    isPlaying,
    loadPreset,
    handleFunctionCall,
    setMasterGain,
    dispose,
  };
}
