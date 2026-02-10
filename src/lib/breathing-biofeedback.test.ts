import { describe, it, expect } from 'vitest';
import {
  computeSyncScore,
  generateCoachingSuggestion,
  compareBreathing,
  parseBreathingObservation,
  buildBreathingObservationPrompt,
} from './breathing-biofeedback';
import type { BreathPhase } from './breathing';

// ---------------------------------------------------------------------------
// computeSyncScore
// ---------------------------------------------------------------------------

describe('computeSyncScore', () => {
  it('returns 100 for perfect match (same phase, zero drift)', () => {
    expect(computeSyncScore('inhale', 'inhale', 0)).toBe(100);
  });

  it('returns 60 for phase match with maximum drift', () => {
    expect(computeSyncScore('exhale', 'exhale', 5000)).toBe(60);
  });

  it('returns 0 for phase mismatch with maximum drift', () => {
    expect(computeSyncScore('inhale', 'exhale', 5000)).toBe(0);
  });

  it('returns 40 for phase mismatch with zero drift', () => {
    expect(computeSyncScore('inhale', 'exhale', 0)).toBe(40);
  });

  it('treats hold and rest as compatible', () => {
    expect(computeSyncScore('hold', 'rest', 0)).toBe(100);
    expect(computeSyncScore('rest', 'hold', 0)).toBe(100);
  });

  it('handles negative drift via absolute value', () => {
    expect(computeSyncScore('inhale', 'inhale', -2500)).toBe(80);
  });

  it('clamps drift beyond MAX_DRIFT_MS (5000ms)', () => {
    const at5000 = computeSyncScore('inhale', 'inhale', 5000);
    const at10000 = computeSyncScore('inhale', 'inhale', 10000);
    expect(at5000).toBe(at10000);
  });

  it('produces integer scores', () => {
    const score = computeSyncScore('exhale', 'exhale', 1234);
    expect(Number.isInteger(score)).toBe(true);
  });

  it('score is clamped to [0, 100]', () => {
    expect(computeSyncScore('inhale', 'inhale', 0)).toBeLessThanOrEqual(100);
    expect(computeSyncScore('inhale', 'exhale', 99999)).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// generateCoachingSuggestion
// ---------------------------------------------------------------------------

describe('generateCoachingSuggestion', () => {
  it('returns encouraging text for high sync score', () => {
    const result = generateCoachingSuggestion({
      targetPhase: 'inhale',
      actualPhase: 'inhale',
      syncScore: 90,
      driftMs: 100,
      suggestion: '',
    });
    expect(result).toContain('sync');
  });

  it('suggests beginning inhale when phase mismatches on inhale target', () => {
    const result = generateCoachingSuggestion({
      targetPhase: 'inhale',
      actualPhase: 'exhale',
      syncScore: 30,
      driftMs: 0,
      suggestion: '',
    });
    expect(result.toLowerCase()).toContain('inhale');
  });

  it('suggests beginning exhale when phase mismatches on exhale target', () => {
    const result = generateCoachingSuggestion({
      targetPhase: 'exhale',
      actualPhase: 'inhale',
      syncScore: 30,
      driftMs: 0,
      suggestion: '',
    });
    expect(result.toLowerCase()).toContain('exhaling');
  });

  it('suggests holding for hold/rest phase mismatches', () => {
    const result = generateCoachingSuggestion({
      targetPhase: 'hold',
      actualPhase: 'inhale',
      syncScore: 30,
      driftMs: 0,
      suggestion: '',
    });
    expect(result.toLowerCase()).toContain('hold');
  });

  it('gives timing feedback when phase matches but drift is moderate', () => {
    const result = generateCoachingSuggestion({
      targetPhase: 'inhale',
      actualPhase: 'inhale',
      syncScore: 65,
      driftMs: 1500,
      suggestion: '',
    });
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// compareBreathing
// ---------------------------------------------------------------------------

describe('compareBreathing', () => {
  it('produces a complete BiofeedbackComparison', () => {
    const target: BreathPhase = { name: 'inhale', duration: 4, label: 'Breathe In' };
    const measurement = {
      phase: 'inhale' as const,
      amplitude: 0.7,
      cycleDurationMs: 4000,
      timestamp: '2026-01-15T10:00:00.000Z',
    };

    const result = compareBreathing(target, measurement);
    expect(result.targetPhase).toBe('inhale');
    expect(result.actualPhase).toBe('inhale');
    expect(result.syncScore).toBeGreaterThanOrEqual(0);
    expect(result.syncScore).toBeLessThanOrEqual(100);
    expect(result.suggestion.length).toBeGreaterThan(0);
  });

  it('computes drift from cycle duration difference', () => {
    const target: BreathPhase = { name: 'inhale', duration: 4, label: 'Breathe In' };
    const measurement = {
      phase: 'inhale' as const,
      amplitude: 0.5,
      cycleDurationMs: 6000,
      timestamp: '2026-01-15T10:00:00.000Z',
    };

    const result = compareBreathing(target, measurement);
    // drift = 6000 - 4000 = 2000ms
    expect(result.driftMs).toBe(2000);
  });

  it('handles zero cycleDurationMs gracefully', () => {
    const target: BreathPhase = { name: 'exhale', duration: 5, label: 'Breathe Out' };
    const measurement = {
      phase: 'exhale' as const,
      amplitude: 0.5,
      cycleDurationMs: 0,
      timestamp: '2026-01-15T10:00:00.000Z',
    };

    const result = compareBreathing(target, measurement);
    expect(result.driftMs).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// parseBreathingObservation
// ---------------------------------------------------------------------------

describe('parseBreathingObservation', () => {
  it('parses valid observation args', () => {
    const result = parseBreathingObservation({
      phase: 'inhale',
      amplitude: '0.7',
      cycleDurationMs: '4000',
    });

    expect(result.phase).toBe('inhale');
    expect(result.amplitude).toBeCloseTo(0.7);
    expect(result.cycleDurationMs).toBe(4000);
    expect(result.timestamp).toBeTruthy();
  });

  it('clamps amplitude to [0, 1]', () => {
    const over = parseBreathingObservation({ amplitude: '1.5' });
    expect(over.amplitude).toBe(1);

    const under = parseBreathingObservation({ amplitude: '-0.5' });
    expect(under.amplitude).toBe(0);
  });

  it('defaults unknown phase to "unknown"', () => {
    const result = parseBreathingObservation({ phase: 'invalid' });
    expect(result.phase).toBe('unknown');
  });

  it('defaults missing fields to safe values', () => {
    const result = parseBreathingObservation({});
    expect(result.phase).toBe('unknown');
    expect(result.amplitude).toBeCloseTo(0.5);
    expect(result.cycleDurationMs).toBe(0);
  });

  it('handles NaN amplitude with fallback', () => {
    const result = parseBreathingObservation({ amplitude: 'not-a-number' });
    expect(result.amplitude).toBeGreaterThanOrEqual(0);
    expect(result.amplitude).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// buildBreathingObservationPrompt
// ---------------------------------------------------------------------------

describe('buildBreathingObservationPrompt', () => {
  it('includes key instruction keywords', () => {
    const prompt = buildBreathingObservationPrompt();
    expect(prompt).toContain('report_breathing_observation');
    expect(prompt).toContain('phase');
    expect(prompt).toContain('amplitude');
    expect(prompt).toContain('cycleDurationMs');
  });

  it('returns a non-empty string', () => {
    expect(buildBreathingObservationPrompt().length).toBeGreaterThan(100);
  });
});
