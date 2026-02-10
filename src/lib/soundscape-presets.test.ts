import { describe, it, expect } from 'vitest';
import { SOUNDSCAPE_PRESETS, PRESET_IDS } from './soundscape-presets';

describe('SOUNDSCAPE_PRESETS', () => {
  it('contains exactly 6 presets', () => {
    expect(Object.keys(SOUNDSCAPE_PRESETS)).toHaveLength(6);
  });

  it('PRESET_IDS matches preset keys', () => {
    expect(PRESET_IDS).toEqual(Object.keys(SOUNDSCAPE_PRESETS));
  });

  it('every preset ID matches its key', () => {
    for (const [key, preset] of Object.entries(SOUNDSCAPE_PRESETS)) {
      expect(preset.id).toBe(key);
    }
  });

  it('every preset has a non-empty name and description', () => {
    for (const preset of Object.values(SOUNDSCAPE_PRESETS)) {
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
    }
  });

  it('every preset has at least 3 layers', () => {
    for (const preset of Object.values(SOUNDSCAPE_PRESETS)) {
      expect(preset.layers.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('masterGain is in [0, 1] for all presets', () => {
    for (const preset of Object.values(SOUNDSCAPE_PRESETS)) {
      expect(preset.masterGain).toBeGreaterThanOrEqual(0);
      expect(preset.masterGain).toBeLessThanOrEqual(1);
    }
  });

  it('reverbLevel is in [0, 1] for all presets', () => {
    for (const preset of Object.values(SOUNDSCAPE_PRESETS)) {
      expect(preset.reverbLevel).toBeGreaterThanOrEqual(0);
      expect(preset.reverbLevel).toBeLessThanOrEqual(1);
    }
  });

  it('every layer has valid oscillator type', () => {
    const validTypes = ['sine', 'square', 'sawtooth', 'triangle'];
    for (const preset of Object.values(SOUNDSCAPE_PRESETS)) {
      for (const layer of preset.layers) {
        expect(validTypes).toContain(layer.oscillatorType);
      }
    }
  });

  it('every layer has positive frequency', () => {
    for (const preset of Object.values(SOUNDSCAPE_PRESETS)) {
      for (const layer of preset.layers) {
        expect(layer.frequency).toBeGreaterThan(0);
      }
    }
  });

  it('every layer gain is in [0, 1]', () => {
    for (const preset of Object.values(SOUNDSCAPE_PRESETS)) {
      for (const layer of preset.layers) {
        expect(layer.gain).toBeGreaterThanOrEqual(0);
        expect(layer.gain).toBeLessThanOrEqual(1);
      }
    }
  });

  it('every layer panPosition is in [-1, 1]', () => {
    for (const preset of Object.values(SOUNDSCAPE_PRESETS)) {
      for (const layer of preset.layers) {
        expect(layer.panPosition).toBeGreaterThanOrEqual(-1);
        expect(layer.panPosition).toBeLessThanOrEqual(1);
      }
    }
  });

  it('every layer has a unique ID within its preset', () => {
    for (const preset of Object.values(SOUNDSCAPE_PRESETS)) {
      const ids = preset.layers.map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('includes expected preset names', () => {
    const keys = Object.keys(SOUNDSCAPE_PRESETS);
    expect(keys).toContain('rain-temple');
    expect(keys).toContain('ocean-night');
    expect(keys).toContain('forest-stream');
    expect(keys).toContain('tibetan-singing-bowl');
    expect(keys).toContain('cosmic-ambient');
    expect(keys).toContain('morning-garden');
  });
});
