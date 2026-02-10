import { describe, it, expect, vi } from 'vitest';
import { parseSoundscapeCommand, handleSoundscapeCommand } from './soundscape-handler';
import type { GeminiFunctionCall } from '@/types/features';

// ---------------------------------------------------------------------------
// parseSoundscapeCommand
// ---------------------------------------------------------------------------

describe('parseSoundscapeCommand', () => {
  it('parses add_layer action with full params', () => {
    const cmd = parseSoundscapeCommand({
      action: 'add_layer',
      layerId: 'rain-1',
      layerName: 'Rain',
      oscillatorType: 'sawtooth',
      frequency: 8000,
      gain: 0.08,
      panPosition: -0.5,
      lfoRate: 0.3,
      lfoDepth: 0.02,
      filterType: 'bandpass',
      filterFrequency: 6000,
    });

    expect(cmd.action).toBe('add_layer');
    expect(cmd.layerId).toBe('rain-1');
    expect(cmd.params.layerName).toBe('Rain');
    expect(cmd.params.frequency).toBe(8000);
    expect(cmd.params.gain).toBeCloseTo(0.08);
  });

  it('defaults unknown action to adjust_layer', () => {
    const cmd = parseSoundscapeCommand({ action: 'invalid_action' });
    expect(cmd.action).toBe('adjust_layer');
  });

  it('handles missing action', () => {
    const cmd = parseSoundscapeCommand({});
    expect(cmd.action).toBe('adjust_layer');
  });

  it('parses remove_layer action', () => {
    const cmd = parseSoundscapeCommand({ action: 'remove_layer', layerId: 'rain-1' });
    expect(cmd.action).toBe('remove_layer');
    expect(cmd.layerId).toBe('rain-1');
  });

  it('parses set_master action', () => {
    const cmd = parseSoundscapeCommand({ action: 'set_master', gain: 0.5 });
    expect(cmd.action).toBe('set_master');
    expect(cmd.params.gain).toBe(0.5);
  });

  it('parses crossfade action with durationMs', () => {
    const cmd = parseSoundscapeCommand({
      action: 'crossfade',
      layerId: 'old-layer',
      durationMs: 3000,
      frequency: 440,
    });
    expect(cmd.action).toBe('crossfade');
    expect(cmd.params.durationMs).toBe(3000);
  });

  it('ignores NaN numeric params', () => {
    const cmd = parseSoundscapeCommand({
      action: 'add_layer',
      frequency: 'not-a-number',
      gain: 'oops',
    });
    expect(cmd.params.frequency).toBeUndefined();
    expect(cmd.params.gain).toBeUndefined();
  });

  it('handles string params correctly', () => {
    const cmd = parseSoundscapeCommand({
      action: 'add_layer',
      layerName: 'Thunder',
      oscillatorType: 'sine',
      filterType: 'lowpass',
    });
    expect(cmd.params.layerName).toBe('Thunder');
    expect(cmd.params.oscillatorType).toBe('sine');
    expect(cmd.params.filterType).toBe('lowpass');
  });
});

// ---------------------------------------------------------------------------
// handleSoundscapeCommand
// ---------------------------------------------------------------------------

describe('handleSoundscapeCommand', () => {
  function mockEngine() {
    return {
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      adjustLayer: vi.fn(),
      setMasterGain: vi.fn(),
      crossfade: vi.fn(),
    };
  }

  it('ignores non-control_soundscape function calls', () => {
    const engine = mockEngine();
    const call: GeminiFunctionCall = {
      name: 'report_pose_analysis',
      args: { action: 'add_layer' },
    };
    handleSoundscapeCommand(engine as any, call);
    expect(engine.addLayer).not.toHaveBeenCalled();
  });

  it('dispatches add_layer to engine.addLayer', () => {
    const engine = mockEngine();
    const call: GeminiFunctionCall = {
      name: 'control_soundscape',
      args: {
        action: 'add_layer',
        layerId: 'rain-1',
        layerName: 'Rain',
        oscillatorType: 'sawtooth',
        frequency: 8000,
        gain: 0.08,
      },
    };
    handleSoundscapeCommand(engine as any, call);
    expect(engine.addLayer).toHaveBeenCalledOnce();
    expect(engine.addLayer.mock.calls[0][0].id).toBe('rain-1');
  });

  it('dispatches remove_layer to engine.removeLayer', () => {
    const engine = mockEngine();
    const call: GeminiFunctionCall = {
      name: 'control_soundscape',
      args: { action: 'remove_layer', layerId: 'rain-1' },
    };
    handleSoundscapeCommand(engine as any, call);
    expect(engine.removeLayer).toHaveBeenCalledWith('rain-1');
  });

  it('dispatches adjust_layer to engine.adjustLayer', () => {
    const engine = mockEngine();
    const call: GeminiFunctionCall = {
      name: 'control_soundscape',
      args: { action: 'adjust_layer', layerId: 'rain-1', gain: 0.5 },
    };
    handleSoundscapeCommand(engine as any, call);
    expect(engine.adjustLayer).toHaveBeenCalledOnce();
  });

  it('dispatches set_master to engine.setMasterGain', () => {
    const engine = mockEngine();
    const call: GeminiFunctionCall = {
      name: 'control_soundscape',
      args: { action: 'set_master', gain: 0.4 },
    };
    handleSoundscapeCommand(engine as any, call);
    expect(engine.setMasterGain).toHaveBeenCalledWith(0.4);
  });

  it('dispatches crossfade to engine.crossfade', () => {
    const engine = mockEngine();
    const call: GeminiFunctionCall = {
      name: 'control_soundscape',
      args: {
        action: 'crossfade',
        layerId: 'old-layer',
        durationMs: 2000,
        frequency: 440,
        oscillatorType: 'sine',
      },
    };
    handleSoundscapeCommand(engine as any, call);
    expect(engine.crossfade).toHaveBeenCalledOnce();
  });

  it('does not call removeLayer without layerId', () => {
    const engine = mockEngine();
    const call: GeminiFunctionCall = {
      name: 'control_soundscape',
      args: { action: 'remove_layer' },
    };
    handleSoundscapeCommand(engine as any, call);
    expect(engine.removeLayer).not.toHaveBeenCalled();
  });
});
