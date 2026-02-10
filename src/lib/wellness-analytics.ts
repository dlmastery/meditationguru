/**
 * Wellness analytics engine for the Predictive Wellness Dashboard.
 *
 * All computation functions are pure — they take data in and return
 * results out with no side-effects. The only stateful dependency
 * (Firestore) is accessed through `persistence.ts`.
 */

import type {
  SessionMemory,
  WellnessMetrics,
  TimeSeriesPoint,
  EmotionLabel,
  DashboardData,
} from '@/types/features';

// ---------------------------------------------------------------------------
// Emotion → numeric mood mapping (1 = worst, 5 = best)
// ---------------------------------------------------------------------------

const MOOD_SCALE: Record<EmotionLabel, number> = {
  stressed: 1,
  anxious: 1.5,
  frustrated: 1.5,
  sad: 2,
  drowsy: 2.5,
  neutral: 3,
  calm: 4,
  energetic: 4,
  happy: 5,
};

/**
 * Map an EmotionLabel to a 1-5 numeric mood score.
 * Defaults to 3 (neutral) for unknown labels.
 */
function emotionToScore(emotion: EmotionLabel): number {
  return MOOD_SCALE[emotion] ?? 3;
}

// ---------------------------------------------------------------------------
// Date helpers (pure, no side-effects)
// ---------------------------------------------------------------------------

/**
 * Return the ISO date portion (YYYY-MM-DD) of an ISO-8601 string.
 */
function toDateKey(isoString: string): string {
  return isoString.slice(0, 10);
}

/**
 * Return all unique calendar dates between `start` and `end` (inclusive).
 */
function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ---------------------------------------------------------------------------
// Core metric computations
// ---------------------------------------------------------------------------

/**
 * Aggregate an array of session memories into a `WellnessMetrics` snapshot
 * for the given period.
 */
export function computeWellnessMetrics(
  memories: readonly SessionMemory[],
  periodStart: string,
  periodEnd: string,
): WellnessMetrics {
  const inRange = memories.filter((m) => {
    const d = toDateKey(m.createdAt);
    return d >= toDateKey(periodStart) && d <= toDateKey(periodEnd);
  });

  const totalSessions = inRange.length;
  const totalMinutes = inRange.reduce((sum, m) => sum + m.durationMinutes, 0);

  const moodsBefore = inRange.map((m) => emotionToScore(m.emotionBefore));
  const moodsAfter = inRange.map((m) => emotionToScore(m.emotionAfter));

  const averageMoodBefore =
    moodsBefore.length > 0
      ? moodsBefore.reduce((a, b) => a + b, 0) / moodsBefore.length
      : 3;
  const averageMoodAfter =
    moodsAfter.length > 0
      ? moodsAfter.reduce((a, b) => a + b, 0) / moodsAfter.length
      : 3;

  const moodImprovement =
    averageMoodBefore > 0
      ? ((averageMoodAfter - averageMoodBefore) / averageMoodBefore) * 100
      : 0;

  // Aggregate techniques used across all sessions
  const techniqueFreq = new Map<string, number>();
  for (const m of inRange) {
    for (const t of m.techniquesUsed) {
      techniqueFreq.set(t, (techniqueFreq.get(t) ?? 0) + 1);
    }
  }
  const topTechniques = [...techniqueFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  return {
    userId: inRange[0]?.userId ?? '',
    periodStart,
    periodEnd,
    totalSessions,
    totalMinutes,
    averageMoodBefore: Math.round(averageMoodBefore * 10) / 10,
    averageMoodAfter: Math.round(averageMoodAfter * 10) / 10,
    moodImprovement: Math.round(moodImprovement * 10) / 10,
    streakDays: computeStreakDays(inRange),
    breathingAccuracy: 0, // populated by biofeedback subsystem
    topTechniques,
    sessionFrequency: computeSessionFrequency(inRange),
    moodTrend: computeMoodTrend(inRange),
  };
}

/**
 * Compute daily session counts as a time-series.
 */
export function computeSessionFrequency(
  memories: readonly SessionMemory[],
): TimeSeriesPoint[] {
  const countByDay = new Map<string, number>();
  for (const m of memories) {
    const day = toDateKey(m.createdAt);
    countByDay.set(day, (countByDay.get(day) ?? 0) + 1);
  }

  // Fill in gaps between earliest and latest session dates
  const sortedDays = [...countByDay.keys()].sort();
  if (sortedDays.length === 0) return [];

  const allDays = dateRange(sortedDays[0], sortedDays[sortedDays.length - 1]);
  return allDays.map((day) => ({
    date: day,
    value: countByDay.get(day) ?? 0,
  }));
}

/**
 * Compute average after-session mood per day as a time-series.
 */
export function computeMoodTrend(
  memories: readonly SessionMemory[],
): TimeSeriesPoint[] {
  const moodsByDay = new Map<string, number[]>();
  for (const m of memories) {
    const day = toDateKey(m.createdAt);
    const existing = moodsByDay.get(day) ?? [];
    existing.push(emotionToScore(m.emotionAfter));
    moodsByDay.set(day, existing);
  }

  const sortedDays = [...moodsByDay.keys()].sort();
  if (sortedDays.length === 0) return [];

  const allDays = dateRange(sortedDays[0], sortedDays[sortedDays.length - 1]);
  return allDays.map((day) => {
    const scores = moodsByDay.get(day);
    const avg = scores
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
    return { date: day, value: Math.round(avg * 10) / 10 };
  });
}

/**
 * Calculate the current consecutive-day streak from the most recent
 * session backwards.
 */
export function computeStreakDays(
  memories: readonly SessionMemory[],
): number {
  if (memories.length === 0) return 0;

  const uniqueDays = new Set(memories.map((m) => toDateKey(m.createdAt)));
  const sortedDays = [...uniqueDays].sort().reverse();

  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffMs = prev.getTime() - curr.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Compare two periods and produce percentage-change stats.
 */
export function compareWithPreviousPeriod(
  current: WellnessMetrics,
  previous: WellnessMetrics | null,
): DashboardData['comparisonWithLastPeriod'] {
  if (!previous) {
    return { sessionsChange: 0, minutesChange: 0, moodChange: 0 };
  }

  const pctChange = (curr: number, prev: number): number => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  };

  return {
    sessionsChange: pctChange(current.totalSessions, previous.totalSessions),
    minutesChange: pctChange(current.totalMinutes, previous.totalMinutes),
    moodChange: pctChange(current.averageMoodAfter, previous.averageMoodAfter),
  };
}
