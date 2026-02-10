import { describe, it, expect } from 'vitest';
import { BREATHING_PATTERNS, getPatternForGoal } from './breathing';
import type { BreathingPattern } from './breathing';

// ---------------------------------------------------------------------------
// BREATHING_PATTERNS data integrity
// ---------------------------------------------------------------------------

describe('BREATHING_PATTERNS', () => {
  it('contains at least 8 patterns', () => {
    expect(Object.keys(BREATHING_PATTERNS).length).toBeGreaterThanOrEqual(8);
  });

  it('every pattern id matches its key', () => {
    for (const [key, pattern] of Object.entries(BREATHING_PATTERNS)) {
      expect(pattern.id).toBe(key);
    }
  });

  it('every pattern has at least 2 phases', () => {
    for (const pattern of Object.values(BREATHING_PATTERNS)) {
      expect(pattern.phases.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every phase has a positive duration', () => {
    for (const pattern of Object.values(BREATHING_PATTERNS)) {
      for (const phase of pattern.phases) {
        expect(phase.duration).toBeGreaterThan(0);
      }
    }
  });

  it('cycleDuration matches the sum of phase durations', () => {
    for (const pattern of Object.values(BREATHING_PATTERNS)) {
      const sum = pattern.phases.reduce((acc, p) => acc + p.duration, 0);
      expect(pattern.cycleDuration).toBe(sum);
    }
  });

  it('every pattern has a non-empty name and description', () => {
    for (const pattern of Object.values(BREATHING_PATTERNS)) {
      expect(pattern.name.length).toBeGreaterThan(0);
      expect(pattern.description.length).toBeGreaterThan(0);
    }
  });

  it('every pattern has at least one benefit', () => {
    for (const pattern of Object.values(BREATHING_PATTERNS)) {
      expect(pattern.benefits.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('difficulty is one of the valid levels', () => {
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    for (const pattern of Object.values(BREATHING_PATTERNS)) {
      expect(validDifficulties).toContain(pattern.difficulty);
    }
  });

  it('phase names are valid', () => {
    const validNames = ['inhale', 'hold', 'exhale', 'rest'];
    for (const pattern of Object.values(BREATHING_PATTERNS)) {
      for (const phase of pattern.phases) {
        expect(validNames).toContain(phase.name);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getPatternForGoal
// ---------------------------------------------------------------------------

describe('getPatternForGoal', () => {
  it('maps "stress" to deep-belly', () => {
    expect(getPatternForGoal('stress').id).toBe('deep-belly');
  });

  it('maps "sleep" to relaxing-478', () => {
    expect(getPatternForGoal('sleep').id).toBe('relaxing-478');
  });

  it('maps "focus" to box-breathing', () => {
    expect(getPatternForGoal('focus').id).toBe('box-breathing');
  });

  it('maps "energy" to energizing', () => {
    expect(getPatternForGoal('energy').id).toBe('energizing');
  });

  it('maps "anxiety" to relaxing-478', () => {
    expect(getPatternForGoal('anxiety').id).toBe('relaxing-478');
  });

  it('maps "yoga" to ujjayi', () => {
    expect(getPatternForGoal('yoga').id).toBe('ujjayi');
  });

  it('defaults to "calm" for unknown goals', () => {
    expect(getPatternForGoal('unknown-goal').id).toBe('calm');
    expect(getPatternForGoal('').id).toBe('calm');
  });

  it('is case-insensitive', () => {
    expect(getPatternForGoal('STRESS').id).toBe('deep-belly');
    expect(getPatternForGoal('Sleep').id).toBe('relaxing-478');
  });

  it('trims whitespace', () => {
    expect(getPatternForGoal('  stress  ').id).toBe('deep-belly');
  });

  it('returned pattern is a valid BreathingPattern', () => {
    const pattern = getPatternForGoal('focus');
    expect(pattern.id).toBeTruthy();
    expect(pattern.phases.length).toBeGreaterThan(0);
    expect(pattern.cycleDuration).toBeGreaterThan(0);
  });
});
