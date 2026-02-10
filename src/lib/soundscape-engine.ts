/**
 * Web Audio API soundscape engine for generative ambient audio.
 *
 * Each sound layer is rendered as:
 *   OscillatorNode -> BiquadFilterNode (optional) -> GainNode -> StereoPannerNode -> masterGain -> destination
 *
 * Layers that specify `lfoRate` / `lfoDepth` get an additional LFO oscillator
 * routed into the layer gain, producing amplitude modulation.
 *
 * @module soundscape-engine
 */

import type { SoundLayer } from '@/types/features';

// ---------------------------------------------------------------------------
// Internal node graph per layer
// ---------------------------------------------------------------------------

interface LayerNodes {
  oscillator: OscillatorNode;
  filter: BiquadFilterNode | null;
  gain: GainNode;
  panner: StereoPannerNode;
  lfo: OscillatorNode | null;
  lfoGain: GainNode | null;
  layer: SoundLayer;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FADE_TIME_S = 0.05;
const DEFAULT_CROSSFADE_MS = 2_000;

// ---------------------------------------------------------------------------
// SoundscapeEngine
// ---------------------------------------------------------------------------

/**
 * Manages a set of Web Audio layers that together form an ambient soundscape.
 *
 * Lifecycle:
 * 1. `init()` – create the AudioContext (must be called after a user gesture).
 * 2. `addLayer()` / `removeLayer()` / `adjustLayer()` – manipulate layers.
 * 3. `dispose()` – tear down everything and release hardware.
 */
export class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private layers = new Map<string, LayerNodes>();

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /** Initialize the AudioContext and master gain. Call once after a user gesture. */
  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.6;
    this.masterGain.connect(this.ctx.destination);
  }

  /** Tear down all layers, close the AudioContext, and release resources. */
  dispose(): void {
    for (const id of this.layers.keys()) {
      this.destroyLayer(id);
    }
    this.layers.clear();

    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }

  // -----------------------------------------------------------------------
  // Layer management
  // -----------------------------------------------------------------------

  /** Add a new sound layer to the engine. If a layer with the same id exists, it is replaced. */
  addLayer(layer: SoundLayer): void {
    if (!this.ctx || !this.masterGain) return;

    // Remove previous layer with same id if present
    if (this.layers.has(layer.id)) {
      this.destroyLayer(layer.id);
    }

    const now = this.ctx.currentTime;

    // Oscillator
    const oscillator = this.ctx.createOscillator();
    oscillator.type = layer.oscillatorType;
    oscillator.frequency.setValueAtTime(layer.frequency, now);

    // Optional filter
    let filter: BiquadFilterNode | null = null;
    if (layer.filterType) {
      filter = this.ctx.createBiquadFilter();
      filter.type = layer.filterType;
      filter.frequency.setValueAtTime(layer.filterFrequency ?? 1000, now);
    }

    // Gain (fade in from 0)
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(layer.gain, now + FADE_TIME_S);

    // Stereo panner
    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(clampPan(layer.panPosition), now);

    // Wire: oscillator -> [filter] -> gain -> panner -> masterGain
    if (filter) {
      oscillator.connect(filter);
      filter.connect(gain);
    } else {
      oscillator.connect(gain);
    }
    gain.connect(panner);
    panner.connect(this.masterGain);

    // Optional LFO for amplitude modulation
    let lfo: OscillatorNode | null = null;
    let lfoGain: GainNode | null = null;
    if (layer.lfoRate != null && layer.lfoDepth != null) {
      lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(layer.lfoRate, now);

      lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(layer.lfoDepth, now);

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start(now);
    }

    oscillator.start(now);

    this.layers.set(layer.id, {
      oscillator,
      filter,
      gain,
      panner,
      lfo,
      lfoGain,
      layer,
    });
  }

  /** Gracefully fade out and remove a layer. */
  removeLayer(layerId: string): void {
    const nodes = this.layers.get(layerId);
    if (!nodes || !this.ctx) return;

    const now = this.ctx.currentTime;
    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, now);
    nodes.gain.gain.linearRampToValueAtTime(0, now + FADE_TIME_S);

    // Schedule cleanup after fade
    setTimeout(() => {
      this.destroyLayer(layerId);
      this.layers.delete(layerId);
    }, FADE_TIME_S * 1_000 + 50);
  }

  /**
   * Adjust parameters on an existing layer.
   * Only the provided fields are changed; others remain as-is.
   */
  adjustLayer(layerId: string, params: Partial<SoundLayer>): void {
    const nodes = this.layers.get(layerId);
    if (!nodes || !this.ctx) return;

    const now = this.ctx.currentTime;

    if (params.frequency != null) {
      nodes.oscillator.frequency.linearRampToValueAtTime(params.frequency, now + FADE_TIME_S);
    }
    if (params.gain != null) {
      nodes.gain.gain.linearRampToValueAtTime(params.gain, now + FADE_TIME_S);
    }
    if (params.panPosition != null) {
      nodes.panner.pan.linearRampToValueAtTime(clampPan(params.panPosition), now + FADE_TIME_S);
    }
    if (params.filterFrequency != null && nodes.filter) {
      nodes.filter.frequency.linearRampToValueAtTime(params.filterFrequency, now + FADE_TIME_S);
    }
    if (params.lfoRate != null && nodes.lfo) {
      nodes.lfo.frequency.linearRampToValueAtTime(params.lfoRate, now + FADE_TIME_S);
    }
    if (params.lfoDepth != null && nodes.lfoGain) {
      nodes.lfoGain.gain.linearRampToValueAtTime(params.lfoDepth, now + FADE_TIME_S);
    }

    // Update stored layer snapshot
    nodes.layer = { ...nodes.layer, ...params } as SoundLayer;
  }

  /** Set the master output volume (0 - 1). */
  setMasterGain(gain: number): void {
    if (!this.masterGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.linearRampToValueAtTime(
      Math.max(0, Math.min(1, gain)),
      now + FADE_TIME_S,
    );
  }

  /**
   * Smoothly crossfade from one layer to a new layer.
   *
   * @param fromLayerId - The layer to fade out.
   * @param toLayer     - The new layer to fade in.
   * @param durationMs  - Crossfade duration in milliseconds.
   */
  crossfade(fromLayerId: string, toLayer: SoundLayer, durationMs: number = DEFAULT_CROSSFADE_MS): void {
    const fromNodes = this.layers.get(fromLayerId);
    if (!fromNodes || !this.ctx || !this.masterGain) return;

    const durationS = durationMs / 1_000;
    const now = this.ctx.currentTime;

    // Fade out old layer
    fromNodes.gain.gain.cancelScheduledValues(now);
    fromNodes.gain.gain.setValueAtTime(fromNodes.gain.gain.value, now);
    fromNodes.gain.gain.linearRampToValueAtTime(0, now + durationS);

    // Add the new layer at zero gain, then ramp up
    const savedGain = toLayer.gain;
    this.addLayer({ ...toLayer, gain: 0 });
    const toNodes = this.layers.get(toLayer.id);
    if (toNodes) {
      toNodes.gain.gain.linearRampToValueAtTime(savedGain, now + durationS);
      toNodes.layer = { ...toNodes.layer, gain: savedGain };
    }

    // Remove old layer after crossfade completes
    setTimeout(() => {
      this.destroyLayer(fromLayerId);
      this.layers.delete(fromLayerId);
    }, durationMs + 50);
  }

  /** Return a snapshot of all currently active layers. */
  getActiveLayers(): SoundLayer[] {
    return Array.from(this.layers.values()).map((n) => n.layer);
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private destroyLayer(layerId: string): void {
    const nodes = this.layers.get(layerId);
    if (!nodes) return;

    try { nodes.oscillator.stop(); } catch { /* already stopped */ }
    try { nodes.oscillator.disconnect(); } catch { /* noop */ }

    if (nodes.filter) {
      try { nodes.filter.disconnect(); } catch { /* noop */ }
    }

    try { nodes.gain.disconnect(); } catch { /* noop */ }
    try { nodes.panner.disconnect(); } catch { /* noop */ }

    if (nodes.lfo) {
      try { nodes.lfo.stop(); } catch { /* already stopped */ }
      try { nodes.lfo.disconnect(); } catch { /* noop */ }
    }
    if (nodes.lfoGain) {
      try { nodes.lfoGain.disconnect(); } catch { /* noop */ }
    }
  }
}

// ---------------------------------------------------------------------------
// Pure utilities
// ---------------------------------------------------------------------------

/** Clamp a pan value to the [-1, 1] range. */
function clampPan(value: number): number {
  return Math.max(-1, Math.min(1, value));
}
