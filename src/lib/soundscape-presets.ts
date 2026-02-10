/**
 * Preset soundscape definitions built from Web Audio oscillator layers.
 *
 * Each preset approximates a real-world ambient environment using additive
 * synthesis: multiple oscillators with specific waveforms, frequencies,
 * filters, and LFO modulation combine to produce textures like rain,
 * ocean waves, singing bowls, etc.
 *
 * @module soundscape-presets
 */

import type { Soundscape } from '@/types/features';

/**
 * Six curated ambient presets.
 *
 * Layers are designed to be musically complementary and CPU-efficient.
 * All gain values assume a master gain of ~0.6.
 */
export const SOUNDSCAPE_PRESETS: Record<string, Soundscape> = {
  // -----------------------------------------------------------------------
  // Rain on a temple roof with distant thunder
  // -----------------------------------------------------------------------
  'rain-temple': {
    id: 'rain-temple',
    name: 'Rain Temple',
    description: 'Gentle rain on a temple roof with distant rolling thunder',
    masterGain: 0.6,
    reverbLevel: 0.7,
    createdAt: '2026-01-01T00:00:00.000Z',
    layers: [
      {
        id: 'rain-noise',
        name: 'Rain',
        oscillatorType: 'sawtooth',
        frequency: 8000,
        gain: 0.08,
        panPosition: 0,
        filterType: 'bandpass',
        filterFrequency: 6000,
        lfoRate: 0.3,
        lfoDepth: 0.02,
      },
      {
        id: 'rain-texture',
        name: 'Rain texture',
        oscillatorType: 'sawtooth',
        frequency: 9500,
        gain: 0.05,
        panPosition: -0.4,
        filterType: 'highpass',
        filterFrequency: 7000,
        lfoRate: 0.5,
        lfoDepth: 0.015,
      },
      {
        id: 'thunder-rumble',
        name: 'Distant thunder',
        oscillatorType: 'sawtooth',
        frequency: 45,
        gain: 0.12,
        panPosition: 0.3,
        filterType: 'lowpass',
        filterFrequency: 120,
        lfoRate: 0.08,
        lfoDepth: 0.1,
      },
      {
        id: 'temple-tone',
        name: 'Temple resonance',
        oscillatorType: 'sine',
        frequency: 174,
        gain: 0.04,
        panPosition: 0,
        lfoRate: 0.1,
        lfoDepth: 0.02,
      },
    ],
  },

  // -----------------------------------------------------------------------
  // Gentle ocean waves with crickets
  // -----------------------------------------------------------------------
  'ocean-night': {
    id: 'ocean-night',
    name: 'Ocean Night',
    description: 'Gentle waves lapping the shore under a starry sky with crickets',
    masterGain: 0.6,
    reverbLevel: 0.6,
    createdAt: '2026-01-01T00:00:00.000Z',
    layers: [
      {
        id: 'ocean-wash',
        name: 'Wave wash',
        oscillatorType: 'sawtooth',
        frequency: 220,
        gain: 0.07,
        panPosition: 0,
        filterType: 'lowpass',
        filterFrequency: 400,
        lfoRate: 0.12,
        lfoDepth: 0.06,
      },
      {
        id: 'ocean-foam',
        name: 'Foam',
        oscillatorType: 'sawtooth',
        frequency: 4000,
        gain: 0.03,
        panPosition: 0.2,
        filterType: 'bandpass',
        filterFrequency: 3000,
        lfoRate: 0.15,
        lfoDepth: 0.025,
      },
      {
        id: 'cricket-high',
        name: 'Crickets',
        oscillatorType: 'square',
        frequency: 4200,
        gain: 0.015,
        panPosition: -0.6,
        filterType: 'bandpass',
        filterFrequency: 4200,
        lfoRate: 7,
        lfoDepth: 0.01,
      },
      {
        id: 'ocean-sub',
        name: 'Deep ocean',
        oscillatorType: 'sine',
        frequency: 55,
        gain: 0.1,
        panPosition: 0,
        lfoRate: 0.06,
        lfoDepth: 0.05,
      },
    ],
  },

  // -----------------------------------------------------------------------
  // Babbling brook with birdsong
  // -----------------------------------------------------------------------
  'forest-stream': {
    id: 'forest-stream',
    name: 'Forest Stream',
    description: 'A babbling brook winding through a sunlit forest with birdsong',
    masterGain: 0.6,
    reverbLevel: 0.5,
    createdAt: '2026-01-01T00:00:00.000Z',
    layers: [
      {
        id: 'stream-flow',
        name: 'Stream',
        oscillatorType: 'sawtooth',
        frequency: 3000,
        gain: 0.06,
        panPosition: -0.2,
        filterType: 'bandpass',
        filterFrequency: 2500,
        lfoRate: 0.4,
        lfoDepth: 0.03,
      },
      {
        id: 'stream-trickle',
        name: 'Trickle',
        oscillatorType: 'triangle',
        frequency: 5000,
        gain: 0.03,
        panPosition: 0.3,
        filterType: 'highpass',
        filterFrequency: 4000,
        lfoRate: 1.2,
        lfoDepth: 0.02,
      },
      {
        id: 'bird-high',
        name: 'Birdsong',
        oscillatorType: 'sine',
        frequency: 2600,
        gain: 0.02,
        panPosition: -0.7,
        lfoRate: 5,
        lfoDepth: 0.015,
      },
      {
        id: 'bird-low',
        name: 'Bird warble',
        oscillatorType: 'sine',
        frequency: 1800,
        gain: 0.018,
        panPosition: 0.5,
        lfoRate: 3.5,
        lfoDepth: 0.012,
      },
      {
        id: 'forest-rustle',
        name: 'Leaves',
        oscillatorType: 'sawtooth',
        frequency: 7000,
        gain: 0.02,
        panPosition: 0,
        filterType: 'highpass',
        filterFrequency: 6000,
        lfoRate: 0.2,
        lfoDepth: 0.015,
      },
    ],
  },

  // -----------------------------------------------------------------------
  // Tibetan singing bowl resonance
  // -----------------------------------------------------------------------
  'tibetan-singing-bowl': {
    id: 'tibetan-singing-bowl',
    name: 'Tibetan Singing Bowl',
    description: 'Resonant bowl tones with shimmering harmonics',
    masterGain: 0.6,
    reverbLevel: 0.85,
    createdAt: '2026-01-01T00:00:00.000Z',
    layers: [
      {
        id: 'bowl-fundamental',
        name: 'Bowl fundamental',
        oscillatorType: 'sine',
        frequency: 256,
        gain: 0.15,
        panPosition: 0,
        lfoRate: 0.05,
        lfoDepth: 0.03,
      },
      {
        id: 'bowl-harmonic-2',
        name: 'Second harmonic',
        oscillatorType: 'sine',
        frequency: 512,
        gain: 0.08,
        panPosition: -0.3,
        lfoRate: 0.07,
        lfoDepth: 0.02,
      },
      {
        id: 'bowl-harmonic-3',
        name: 'Third harmonic',
        oscillatorType: 'sine',
        frequency: 768,
        gain: 0.05,
        panPosition: 0.3,
        lfoRate: 0.09,
        lfoDepth: 0.015,
      },
      {
        id: 'bowl-shimmer',
        name: 'Shimmer',
        oscillatorType: 'sine',
        frequency: 1024,
        gain: 0.03,
        panPosition: 0,
        lfoRate: 2,
        lfoDepth: 0.01,
      },
      {
        id: 'bowl-sub',
        name: 'Sub tone',
        oscillatorType: 'sine',
        frequency: 128,
        gain: 0.06,
        panPosition: 0,
        lfoRate: 0.03,
        lfoDepth: 0.02,
      },
    ],
  },

  // -----------------------------------------------------------------------
  // Deep space drones and pulses
  // -----------------------------------------------------------------------
  'cosmic-ambient': {
    id: 'cosmic-ambient',
    name: 'Cosmic Ambient',
    description: 'Deep space drones, spectral pulses, and interstellar resonance',
    masterGain: 0.6,
    reverbLevel: 0.9,
    createdAt: '2026-01-01T00:00:00.000Z',
    layers: [
      {
        id: 'cosmic-drone',
        name: 'Space drone',
        oscillatorType: 'sawtooth',
        frequency: 55,
        gain: 0.1,
        panPosition: 0,
        filterType: 'lowpass',
        filterFrequency: 200,
        lfoRate: 0.04,
        lfoDepth: 0.04,
      },
      {
        id: 'cosmic-pad',
        name: 'Spectral pad',
        oscillatorType: 'triangle',
        frequency: 110,
        gain: 0.07,
        panPosition: -0.4,
        filterType: 'lowpass',
        filterFrequency: 300,
        lfoRate: 0.06,
        lfoDepth: 0.03,
      },
      {
        id: 'cosmic-pulse',
        name: 'Pulse',
        oscillatorType: 'sine',
        frequency: 82,
        gain: 0.05,
        panPosition: 0.5,
        lfoRate: 0.25,
        lfoDepth: 0.04,
      },
      {
        id: 'cosmic-high',
        name: 'Star shimmer',
        oscillatorType: 'sine',
        frequency: 880,
        gain: 0.02,
        panPosition: 0.2,
        lfoRate: 1.5,
        lfoDepth: 0.015,
      },
      {
        id: 'cosmic-sub',
        name: 'Deep space',
        oscillatorType: 'sine',
        frequency: 30,
        gain: 0.08,
        panPosition: 0,
        lfoRate: 0.02,
        lfoDepth: 0.03,
      },
    ],
  },

  // -----------------------------------------------------------------------
  // Wind chimes with gentle breeze
  // -----------------------------------------------------------------------
  'morning-garden': {
    id: 'morning-garden',
    name: 'Morning Garden',
    description: 'Delicate wind chimes dancing in a gentle morning breeze',
    masterGain: 0.6,
    reverbLevel: 0.65,
    createdAt: '2026-01-01T00:00:00.000Z',
    layers: [
      {
        id: 'chime-1',
        name: 'Chime C5',
        oscillatorType: 'sine',
        frequency: 523,
        gain: 0.04,
        panPosition: -0.5,
        lfoRate: 3,
        lfoDepth: 0.03,
      },
      {
        id: 'chime-2',
        name: 'Chime E5',
        oscillatorType: 'sine',
        frequency: 659,
        gain: 0.035,
        panPosition: 0.3,
        lfoRate: 2.5,
        lfoDepth: 0.025,
      },
      {
        id: 'chime-3',
        name: 'Chime G5',
        oscillatorType: 'sine',
        frequency: 784,
        gain: 0.03,
        panPosition: -0.2,
        lfoRate: 4,
        lfoDepth: 0.02,
      },
      {
        id: 'breeze',
        name: 'Breeze',
        oscillatorType: 'sawtooth',
        frequency: 5000,
        gain: 0.03,
        panPosition: 0,
        filterType: 'bandpass',
        filterFrequency: 3000,
        lfoRate: 0.15,
        lfoDepth: 0.02,
      },
      {
        id: 'garden-hum',
        name: 'Garden ambience',
        oscillatorType: 'triangle',
        frequency: 200,
        gain: 0.025,
        panPosition: 0,
        filterType: 'lowpass',
        filterFrequency: 350,
        lfoRate: 0.08,
        lfoDepth: 0.015,
      },
    ],
  },
};

/** All preset IDs for iteration. */
export const PRESET_IDS = Object.keys(SOUNDSCAPE_PRESETS) as ReadonlyArray<string>;
