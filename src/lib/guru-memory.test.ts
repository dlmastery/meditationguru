import { describe, it, expect } from 'vitest';
import { buildSystemPromptWithMemory, formatMemoryForContext } from './guru-memory';
import type { GuruContext, SessionMemory } from '@/types/features';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(overrides: Partial<GuruContext> = {}): GuruContext {
  return {
    userId: 'user-1',
    totalSessions: 10,
    recentMemories: [],
    userGoals: ['reduce stress', 'improve sleep'],
    experienceLevel: 'intermediate',
    emotionalTrend: 'gradually calming',
    milestones: ['Completed 10 sessions', 'First 7-day streak'],
    personalizedGreeting: 'Welcome back, practitioner.',
    ...overrides,
  };
}

function makeMemory(overrides: Partial<SessionMemory> = {}): SessionMemory {
  return {
    id: 'mem-1',
    userId: 'user-1',
    sessionId: 'sess-1',
    sessionType: 'meditation',
    summary: 'Practiced mindfulness with breathing exercises.',
    keyMoments: ['Achieved deep calm'],
    emotionBefore: 'stressed',
    emotionAfter: 'calm',
    breathingPatternUsed: 'calm',
    techniquesUsed: ['mindfulness'],
    guruObservations: 'Good progress on breath control.',
    durationMinutes: 15,
    createdAt: '2026-01-15T10:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildSystemPromptWithMemory
// ---------------------------------------------------------------------------

describe('buildSystemPromptWithMemory', () => {
  it('includes practitioner profile', () => {
    const prompt = buildSystemPromptWithMemory(makeContext());
    expect(prompt).toContain('PRACTITIONER PROFILE');
    expect(prompt).toContain('Total sessions completed: 10');
    expect(prompt).toContain('intermediate');
  });

  it('includes user goals', () => {
    const prompt = buildSystemPromptWithMemory(makeContext());
    expect(prompt).toContain('reduce stress');
    expect(prompt).toContain('improve sleep');
  });

  it('includes milestones', () => {
    const prompt = buildSystemPromptWithMemory(makeContext());
    expect(prompt).toContain('MILESTONES ACHIEVED');
    expect(prompt).toContain('10 sessions');
    expect(prompt).toContain('7-day streak');
  });

  it('omits milestones section when none exist', () => {
    const prompt = buildSystemPromptWithMemory(makeContext({ milestones: [] }));
    expect(prompt).not.toContain('MILESTONES ACHIEVED');
  });

  it('includes personalized greeting', () => {
    const prompt = buildSystemPromptWithMemory(makeContext());
    expect(prompt).toContain('Welcome back, practitioner.');
  });

  it('includes emotional trend', () => {
    const prompt = buildSystemPromptWithMemory(makeContext());
    expect(prompt).toContain('gradually calming');
  });

  it('includes recent memories when present', () => {
    const ctx = makeContext({
      recentMemories: [makeMemory()],
    });
    const prompt = buildSystemPromptWithMemory(ctx);
    expect(prompt).toContain('RECENT SESSION MEMORIES');
    expect(prompt).toContain('mindfulness');
  });

  it('includes instructions for the guru', () => {
    const prompt = buildSystemPromptWithMemory(makeContext());
    expect(prompt).toContain('INSTRUCTIONS');
    expect(prompt).toContain('personalize');
  });

  it('handles "not yet specified" for empty goals', () => {
    const prompt = buildSystemPromptWithMemory(makeContext({ userGoals: [] }));
    expect(prompt).toContain('not yet specified');
  });
});

// ---------------------------------------------------------------------------
// formatMemoryForContext
// ---------------------------------------------------------------------------

describe('formatMemoryForContext', () => {
  it('returns placeholder for empty memories', () => {
    expect(formatMemoryForContext([])).toBe('No previous sessions recorded.');
  });

  it('formats memories with date, type, and summary', () => {
    const result = formatMemoryForContext([makeMemory()]);
    expect(result).toContain('meditation session');
    expect(result).toContain('15min');
    expect(result).toContain('mindfulness');
    expect(result).toContain('stressed -> calm');
  });

  it('truncates to stay under character limit', () => {
    const memories = Array(50)
      .fill(null)
      .map((_, i) =>
        makeMemory({
          id: `mem-${i}`,
          summary: 'A reasonably long summary text that takes up space in the context window. '.repeat(3),
          createdAt: `2026-01-${String(15 - (i % 15)).padStart(2, '0')}T10:00:00.000Z`,
        }),
      );
    const result = formatMemoryForContext(memories);
    expect(result.length).toBeLessThanOrEqual(4500); // slightly over 4000 due to line breaks
  });

  it('includes guru observations when present', () => {
    const result = formatMemoryForContext([makeMemory()]);
    expect(result).toContain('Good progress');
  });
});
