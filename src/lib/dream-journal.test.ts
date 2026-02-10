import { describe, it, expect } from 'vitest';
import { formatDreamForDisplay } from './dream-journal';
import type { DreamEntry } from '@/types/features';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDreamEntry(overrides: Partial<DreamEntry> = {}): DreamEntry {
  return {
    id: 'dream-1',
    userId: 'user-1',
    rawTranscript: 'I was flying over a mountain lake surrounded by clouds.',
    themes: ['flight', 'water', 'freedom'],
    emotions: ['calm', 'happy'],
    symbols: [
      { symbol: 'flying', interpretation: 'desire for freedom', frequency: 3, firstSeen: '2026-01-10T00:00:00Z' },
      { symbol: 'lake', interpretation: 'unconscious mind', frequency: 1, firstSeen: '2026-01-15T00:00:00Z' },
    ],
    analysis: 'This dream suggests a desire for liberation and connection with the deeper self.',
    relatedSessionIds: ['sess-1'],
    createdAt: '2026-01-15T10:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// formatDreamForDisplay
// ---------------------------------------------------------------------------

describe('formatDreamForDisplay', () => {
  it('includes the formatted date', () => {
    const result = formatDreamForDisplay(makeDreamEntry());
    expect(result).toContain('2026');
    expect(result).toContain('January');
  });

  it('includes the transcript', () => {
    const result = formatDreamForDisplay(makeDreamEntry());
    expect(result).toContain('flying over a mountain lake');
  });

  it('includes themes', () => {
    const result = formatDreamForDisplay(makeDreamEntry());
    expect(result).toContain('flight');
    expect(result).toContain('water');
    expect(result).toContain('freedom');
  });

  it('includes emotions', () => {
    const result = formatDreamForDisplay(makeDreamEntry());
    expect(result).toContain('calm');
    expect(result).toContain('happy');
  });

  it('includes symbol names', () => {
    const result = formatDreamForDisplay(makeDreamEntry());
    expect(result).toContain('flying');
    expect(result).toContain('lake');
  });

  it('includes analysis', () => {
    const result = formatDreamForDisplay(makeDreamEntry());
    expect(result).toContain('liberation');
  });

  it('handles empty themes gracefully', () => {
    const result = formatDreamForDisplay(makeDreamEntry({ themes: [] }));
    expect(result).not.toContain('Themes:');
  });

  it('handles empty emotions gracefully', () => {
    const result = formatDreamForDisplay(makeDreamEntry({ emotions: [] }));
    expect(result).not.toContain('Emotions:');
  });

  it('handles empty symbols gracefully', () => {
    const result = formatDreamForDisplay(makeDreamEntry({ symbols: [] }));
    expect(result).not.toContain('Symbols:');
  });
});
