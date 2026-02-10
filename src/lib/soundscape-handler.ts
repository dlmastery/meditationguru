/**
 * Routes Gemini `control_soundscape` function calls to the SoundscapeEngine.
 *
 * @module soundscape-handler
 */

import type { GeminiFunctionCall, SoundLayer, SoundscapeCommand } from '@/types/features';
import type { SoundscapeEngine } from './soundscape-engine';

// ---------------------------------------------------------------------------
// Command parsing
// ---------------------------------------------------------------------------

const VALID_ACTIONS: ReadonlySet<SoundscapeCommand['action']> = new Set([
  'add_layer',
  'remove_layer',
  'adjust_layer',
  'set_master',
  'crossfade',
]);

/**
 * Parse and validate raw Gemini function call arguments into a typed
 * `SoundscapeCommand`. Invalid or missing fields fall back to safe defaults.
 */
export function parseSoundscapeCommand(
  args: Record<string, unknown>,
): SoundscapeCommand {
  const rawAction = String(args.action ?? '');
  const action: SoundscapeCommand['action'] = VALID_ACTIONS.has(rawAction as SoundscapeCommand['action'])
    ? (rawAction as SoundscapeCommand['action'])
    : 'adjust_layer';

  const params: Record<string, number | string> = {};

  for (const key of ['layerName', 'oscillatorType', 'filterType'] as const) {
    if (args[key] != null) {
      params[key] = String(args[key]);
    }
  }

  for (const key of ['frequency', 'gain', 'panPosition', 'lfoRate', 'lfoDepth', 'filterFrequency', 'durationMs'] as const) {
    if (args[key] != null) {
      const n = Number(args[key]);
      if (!Number.isNaN(n)) {
        params[key] = n;
      }
    }
  }

  return {
    action,
    layerId: args.layerId != null ? String(args.layerId) : undefined,
    params,
  };
}

// ---------------------------------------------------------------------------
// Command routing
// ---------------------------------------------------------------------------

/**
 * Handle a Gemini `control_soundscape` function call by dispatching the
 * parsed command to the appropriate engine method.
 */
export function handleSoundscapeCommand(
  engine: SoundscapeEngine,
  call: GeminiFunctionCall,
): void {
  if (call.name !== 'control_soundscape') return;

  const cmd = parseSoundscapeCommand(call.args);

  switch (cmd.action) {
    case 'add_layer': {
      const layer = buildLayerFromParams(cmd);
      engine.addLayer(layer);
      break;
    }
    case 'remove_layer': {
      if (cmd.layerId) {
        engine.removeLayer(cmd.layerId);
      }
      break;
    }
    case 'adjust_layer': {
      if (cmd.layerId) {
        const partial = buildPartialLayerFromParams(cmd.params);
        engine.adjustLayer(cmd.layerId, partial);
      }
      break;
    }
    case 'set_master': {
      const gain = typeof cmd.params.gain === 'number' ? cmd.params.gain : 0.6;
      engine.setMasterGain(gain);
      break;
    }
    case 'crossfade': {
      if (cmd.layerId) {
        const toLayer = buildLayerFromParams(cmd);
        const durationMs = typeof cmd.params.durationMs === 'number' ? cmd.params.durationMs : 2000;
        engine.crossfade(cmd.layerId, toLayer, durationMs);
      }
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildLayerFromParams(cmd: SoundscapeCommand): SoundLayer {
  const p = cmd.params;
  return {
    id: cmd.layerId ?? `layer-${Date.now()}`,
    name: typeof p.layerName === 'string' ? p.layerName : 'Unnamed',
    oscillatorType: toOscillatorType(p.oscillatorType),
    frequency: typeof p.frequency === 'number' ? p.frequency : 220,
    gain: typeof p.gain === 'number' ? p.gain : 0.1,
    panPosition: typeof p.panPosition === 'number' ? p.panPosition : 0,
    ...(typeof p.lfoRate === 'number' ? { lfoRate: p.lfoRate } : {}),
    ...(typeof p.lfoDepth === 'number' ? { lfoDepth: p.lfoDepth } : {}),
    ...(isValidFilterType(p.filterType) ? { filterType: p.filterType } : {}),
    ...(typeof p.filterFrequency === 'number' ? { filterFrequency: p.filterFrequency } : {}),
  };
}

function buildPartialLayerFromParams(
  p: Record<string, number | string>,
): Partial<SoundLayer> {
  const partial: Partial<Record<keyof SoundLayer, number | string | OscillatorType | BiquadFilterType>> = {};

  if (typeof p.frequency === 'number') partial.frequency = p.frequency;
  if (typeof p.gain === 'number') partial.gain = p.gain;
  if (typeof p.panPosition === 'number') partial.panPosition = p.panPosition;
  if (typeof p.lfoRate === 'number') partial.lfoRate = p.lfoRate;
  if (typeof p.lfoDepth === 'number') partial.lfoDepth = p.lfoDepth;
  if (typeof p.filterFrequency === 'number') partial.filterFrequency = p.filterFrequency;

  return partial as Partial<SoundLayer>;
}

const OSCILLATOR_TYPES: ReadonlySet<string> = new Set(['sine', 'square', 'sawtooth', 'triangle']);

function toOscillatorType(value: unknown): OscillatorType {
  const s = String(value ?? '');
  return OSCILLATOR_TYPES.has(s) ? (s as OscillatorType) : 'sine';
}

const FILTER_TYPES: ReadonlySet<string> = new Set([
  'lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass',
]);

function isValidFilterType(value: unknown): value is BiquadFilterType {
  return typeof value === 'string' && FILTER_TYPES.has(value);
}
