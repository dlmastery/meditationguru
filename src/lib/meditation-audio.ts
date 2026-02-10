export class MeditationAudioManager {
  private audioCtx: AudioContext | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private tickIntervalId: ReturnType<typeof setInterval> | null = null;
  private isPlaying: boolean = false;

  /** Initialize AudioContext. Call on a user gesture (click/tap) to comply with browser autoplay policy. */
  init(): void {
    if (this.audioCtx) return;
    this.audioCtx = new AudioContext();
  }

  private ensureContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /** Play a singing-bowl style bell tone. */
  playBell(frequency = 432, duration = 3): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    // Primary tone
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);

    // Detuned overtone for richness
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = frequency * 2.01; // slight detune from octave

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.1, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + duration);
  }

  /** Play a soft tick/click sound. */
  playTick(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Play a gentle chime for phase transitions. */
  playChime(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 880;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1);
  }

  /** Play an audible cue for breathing phases: rising tone for inhale, falling for exhale. */
  playBreathCue(phase: 'inhale' | 'exhale'): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const duration = 0.5;

    const osc = ctx.createOscillator();
    osc.type = 'sine';

    if (phase === 'inhale') {
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(400, now + duration);
    } else {
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(200, now + duration);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.05, now + duration * 0.8);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  /** Play three bells in sequence to signal session end. */
  playTripleBell(): void {
    this.playBell();
    setTimeout(() => this.playBell(), 1500);
    setTimeout(() => this.playBell(), 3000);
  }

  /** Start playing a bell at a regular interval. */
  startIntervalBells(intervalMinutes: number): void {
    this.stopIntervalBells();
    const ms = intervalMinutes * 60 * 1000;
    this.isPlaying = true;
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.playBell();
      }
    }, ms);
  }

  /** Stop interval bells. */
  stopIntervalBells(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPlaying = false;
  }

  /** Start a steady tick at the given BPM (default 60). */
  startTicking(bpm = 60): void {
    this.stopTicking();
    const ms = (60 / bpm) * 1000;
    this.tickIntervalId = setInterval(() => {
      this.playTick();
    }, ms);
  }

  /** Stop ticking. */
  stopTicking(): void {
    if (this.tickIntervalId !== null) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
  }

  /** Clean up all resources. */
  dispose(): void {
    this.stopIntervalBells();
    this.stopTicking();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

// Standalone helper functions for one-off usage without managing a class instance

let sharedManager: MeditationAudioManager | null = null;

function getSharedManager(): MeditationAudioManager {
  if (!sharedManager) {
    sharedManager = new MeditationAudioManager();
    sharedManager.init();
  }
  return sharedManager;
}

export function playBell(frequency?: number, duration?: number): void {
  getSharedManager().playBell(frequency, duration);
}

export function playTick(): void {
  getSharedManager().playTick();
}

export function playChime(): void {
  getSharedManager().playChime();
}

export function playBreathCue(phase: 'inhale' | 'exhale'): void {
  getSharedManager().playBreathCue(phase);
}

export function playTripleBell(): void {
  getSharedManager().playTripleBell();
}

export default MeditationAudioManager;
