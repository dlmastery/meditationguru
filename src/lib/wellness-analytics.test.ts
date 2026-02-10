import { describe, it, expect } from 'vitest';
import {
  computeWellnessMetrics,
  computeSessionFrequency,
  computeMoodTrend,
  computeStreakDays,
  compareWithPreviousPeriod,
} from './wellness-analytics';
import type { SessionMemory, WellnessMetrics } from '@/types/features';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMemory(
  overrides: Partial<SessionMemory> = {},
): SessionMemory {
  return {
    id: 'mem-1',
    userId: 'user-1',
    sessionId: 'sess-1',
    sessionType: 'meditation',
    summary: 'Test session',
    keyMoments: [],
    emotionBefore: 'stressed',
    emotionAfter: 'calm',
    breathingPatternUsed: 'calm',
    techniquesUsed: ['mindfulness'],
    guruObservations: '',
    durationMinutes: 15,
    createdAt: '2026-01-15T10:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// computeStreakDays
// ---------------------------------------------------------------------------

describe('computeStreakDays', () => {
  it('returns 0 for empty memories', () => {
    expect(computeStreakDays([])).toBe(0);
  });

  it('returns 1 for a single session', () => {
    expect(computeStreakDays([makeMemory()])).toBe(1);
  });

  it('returns consecutive day count', () => {
    const memories = [
      makeMemory({ createdAt: '2026-01-13T10:00:00.000Z' }),
      makeMemory({ createdAt: '2026-01-14T10:00:00.000Z' }),
      makeMemory({ createdAt: '2026-01-15T10:00:00.000Z' }),
    ];
    expect(computeStreakDays(memories)).toBe(3);
  });

  it('breaks streak on gap days', () => {
    const memories = [
      makeMemory({ createdAt: '2026-01-10T10:00:00.000Z' }),
      makeMemory({ createdAt: '2026-01-14T10:00:00.000Z' }),
      makeMemory({ createdAt: '2026-01-15T10:00:00.000Z' }),
    ];
    expect(computeStreakDays(memories)).toBe(2);
  });

  it('counts multiple sessions on same day as 1 streak day', () => {
    const memories = [
      makeMemory({ createdAt: '2026-01-15T10:00:00.000Z' }),
      makeMemory({ createdAt: '2026-01-15T14:00:00.000Z' }),
    ];
    expect(computeStreakDays(memories)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// computeSessionFrequency
// ---------------------------------------------------------------------------

describe('computeSessionFrequency', () => {
  it('returns empty array for no memories', () => {
    expect(computeSessionFrequency([])).toEqual([]);
  });

  it('returns correct counts per day', () => {
    const memories = [
      makeMemory({ createdAt: '2026-01-14T10:00:00.000Z' }),
      makeMemory({ createdAt: '2026-01-14T14:00:00.000Z' }),
      makeMemory({ createdAt: '2026-01-15T10:00:00.000Z' }),
    ];
    const freq = computeSessionFrequency(memories);
    expect(freq).toHaveLength(2);
    expect(freq[0]).toEqual({ date: '2026-01-14', value: 2 });
    expect(freq[1]).toEqual({ date: '2026-01-15', value: 1 });
  });

  it('fills gaps with 0', () => {
    const memories = [
      makeMemory({ createdAt: '2026-01-13T10:00:00.000Z' }),
      makeMemory({ createdAt: '2026-01-15T10:00:00.000Z' }),
    ];
    const freq = computeSessionFrequency(memories);
    expect(freq).toHaveLength(3);
    expect(freq[1]).toEqual({ date: '2026-01-14', value: 0 });
  });
});

// ---------------------------------------------------------------------------
// computeMoodTrend
// ---------------------------------------------------------------------------

describe('computeMoodTrend', () => {
  it('returns empty array for no memories', () => {
    expect(computeMoodTrend([])).toEqual([]);
  });

  it('computes average mood per day', () => {
    const memories = [
      makeMemory({ createdAt: '2026-01-15T10:00:00.000Z', emotionAfter: 'happy' }),
      makeMemory({ createdAt: '2026-01-15T14:00:00.000Z', emotionAfter: 'calm' }),
    ];
    const trend = computeMoodTrend(memories);
    // happy = 5, calm = 4, average = 4.5
    expect(trend).toHaveLength(1);
    expect(trend[0].value).toBe(4.5);
  });

  it('fills gap days with 0', () => {
    const memories = [
      makeMemory({ createdAt: '2026-01-13T10:00:00.000Z', emotionAfter: 'calm' }),
      makeMemory({ createdAt: '2026-01-15T10:00:00.000Z', emotionAfter: 'happy' }),
    ];
    const trend = computeMoodTrend(memories);
    expect(trend).toHaveLength(3);
    expect(trend[1].value).toBe(0); // gap day
  });
});

// ---------------------------------------------------------------------------
// computeWellnessMetrics
// ---------------------------------------------------------------------------

describe('computeWellnessMetrics', () => {
  it('computes basic metrics for a set of sessions', () => {
    const memories = [
      makeMemory({
        createdAt: '2026-01-15T10:00:00.000Z',
        durationMinutes: 15,
        emotionBefore: 'stressed',
        emotionAfter: 'calm',
        techniquesUsed: ['mindfulness', 'breathing'],
      }),
      makeMemory({
        createdAt: '2026-01-15T14:00:00.000Z',
        durationMinutes: 20,
        emotionBefore: 'anxious',
        emotionAfter: 'happy',
        techniquesUsed: ['breathing'],
      }),
    ];

    const metrics = computeWellnessMetrics(memories, '2026-01-15', '2026-01-15');
    expect(metrics.totalSessions).toBe(2);
    expect(metrics.totalMinutes).toBe(35);
    expect(metrics.topTechniques).toContain('breathing');
    expect(metrics.moodImprovement).toBeGreaterThan(0);
  });

  it('filters sessions to the requested period', () => {
    const memories = [
      makeMemory({ createdAt: '2026-01-14T10:00:00.000Z' }),
      makeMemory({ createdAt: '2026-01-15T10:00:00.000Z' }),
      makeMemory({ createdAt: '2026-01-16T10:00:00.000Z' }),
    ];

    const metrics = computeWellnessMetrics(memories, '2026-01-15', '2026-01-15');
    expect(metrics.totalSessions).toBe(1);
  });

  it('returns zero metrics for empty period', () => {
    const metrics = computeWellnessMetrics([], '2026-01-15', '2026-01-15');
    expect(metrics.totalSessions).toBe(0);
    expect(metrics.totalMinutes).toBe(0);
  });

  it('limits topTechniques to 5', () => {
    const techniques = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const memories = techniques.map((t) =>
      makeMemory({ techniquesUsed: [t], createdAt: '2026-01-15T10:00:00.000Z' }),
    );
    const metrics = computeWellnessMetrics(memories, '2026-01-15', '2026-01-15');
    expect(metrics.topTechniques.length).toBeLessThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// compareWithPreviousPeriod
// ---------------------------------------------------------------------------

describe('compareWithPreviousPeriod', () => {
  const current: WellnessMetrics = {
    userId: 'u1',
    periodStart: '2026-01-15',
    periodEnd: '2026-01-21',
    totalSessions: 10,
    totalMinutes: 150,
    averageMoodBefore: 2,
    averageMoodAfter: 4,
    moodImprovement: 100,
    streakDays: 7,
    breathingAccuracy: 80,
    topTechniques: ['mindfulness'],
    sessionFrequency: [],
    moodTrend: [],
  };

  it('returns zeroes when no previous period', () => {
    const result = compareWithPreviousPeriod(current, null);
    expect(result.sessionsChange).toBe(0);
    expect(result.minutesChange).toBe(0);
    expect(result.moodChange).toBe(0);
  });

  it('computes correct percentage changes', () => {
    const previous: WellnessMetrics = {
      ...current,
      totalSessions: 5,
      totalMinutes: 100,
      averageMoodAfter: 3,
    };
    const result = compareWithPreviousPeriod(current, previous);
    expect(result.sessionsChange).toBe(100); // 5 -> 10 = 100% increase
    expect(result.minutesChange).toBe(50);   // 100 -> 150 = 50% increase
    expect(result.moodChange).toBeCloseTo(33.3, 0); // 3 -> 4 = ~33%
  });

  it('handles zero previous values gracefully', () => {
    const previous: WellnessMetrics = {
      ...current,
      totalSessions: 0,
      totalMinutes: 0,
      averageMoodAfter: 0,
    };
    const result = compareWithPreviousPeriod(current, previous);
    expect(result.sessionsChange).toBe(100);
    expect(result.minutesChange).toBe(100);
  });
});
