import { describe, it, expect } from 'vitest';
import { TRADITIONS, getVerse, getChapter, searchVerses } from './sacred-texts';

// ---------------------------------------------------------------------------
// TRADITIONS data integrity
// ---------------------------------------------------------------------------

describe('TRADITIONS', () => {
  it('contains exactly 4 traditions', () => {
    expect(TRADITIONS).toHaveLength(4);
  });

  it('has unique IDs', () => {
    const ids = TRADITIONS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each tradition has at least one text', () => {
    for (const tradition of TRADITIONS) {
      expect(tradition.texts.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('each text has at least one chapter', () => {
    for (const tradition of TRADITIONS) {
      for (const text of tradition.texts) {
        expect(text.chapters.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('each chapter has at least one verse', () => {
    for (const tradition of TRADITIONS) {
      for (const text of tradition.texts) {
        for (const chapter of text.chapters) {
          expect(chapter.verses.length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it('every verse has a non-empty translation', () => {
    for (const tradition of TRADITIONS) {
      for (const text of tradition.texts) {
        for (const chapter of text.chapters) {
          for (const verse of chapter.verses) {
            expect(verse.translation.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('covers yoga, buddhism, taoism, and stoicism', () => {
    const ids = TRADITIONS.map((t) => t.id);
    expect(ids).toContain('yoga');
    expect(ids).toContain('buddhism');
    expect(ids).toContain('taoism');
    expect(ids).toContain('stoicism');
  });
});

// ---------------------------------------------------------------------------
// getVerse
// ---------------------------------------------------------------------------

describe('getVerse', () => {
  it('finds Yoga Sutras verse 1:2', () => {
    const verse = getVerse('yoga-sutras', 'ys-1', 2);
    expect(verse).not.toBeNull();
    expect(verse!.translation).toContain('cessation');
  });

  it('finds Dhammapada verse 1:5', () => {
    const verse = getVerse('dhammapada', 'dp-1', 5);
    expect(verse).not.toBeNull();
    expect(verse!.translation).toContain('hatred');
  });

  it('finds Tao Te Ching verse', () => {
    const verse = getVerse('tao-te-ching', 'ttc-1', 1);
    expect(verse).not.toBeNull();
    expect(verse!.translation).toContain('Tao');
  });

  it('finds Meditations verse', () => {
    const verse = getVerse('meditations', 'ma-2', 5);
    expect(verse).not.toBeNull();
    expect(verse!.translation).toContain('moment');
  });

  it('returns null for non-existent text', () => {
    expect(getVerse('nonexistent', 'ch-1', 1)).toBeNull();
  });

  it('returns null for non-existent chapter', () => {
    expect(getVerse('yoga-sutras', 'nonexistent', 1)).toBeNull();
  });

  it('returns null for non-existent verse number', () => {
    expect(getVerse('yoga-sutras', 'ys-1', 9999)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getChapter
// ---------------------------------------------------------------------------

describe('getChapter', () => {
  it('finds Yoga Sutras chapter 1', () => {
    const chapter = getChapter('yoga-sutras', 'ys-1');
    expect(chapter).not.toBeNull();
    expect(chapter!.title).toBe('Samadhi Pada');
  });

  it('returns null for non-existent chapter', () => {
    expect(getChapter('yoga-sutras', 'nonexistent')).toBeNull();
  });

  it('returns null for non-existent text', () => {
    expect(getChapter('nonexistent', 'ys-1')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// searchVerses
// ---------------------------------------------------------------------------

describe('searchVerses', () => {
  it('finds verses containing "yoga"', () => {
    const results = searchVerses('yoga');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.tradition === 'yoga')).toBe(true);
  });

  it('finds verses containing "mind"', () => {
    const results = searchVerses('mind');
    expect(results.length).toBeGreaterThan(0);
  });

  it('is case-insensitive', () => {
    const lower = searchVerses('tao');
    const upper = searchVerses('TAO');
    expect(lower.length).toBe(upper.length);
  });

  it('returns empty for no matches', () => {
    expect(searchVerses('xyznonexistent123')).toEqual([]);
  });

  it('searches across all traditions', () => {
    // "mind" appears in both Yoga and Buddhism texts
    const results = searchVerses('mind');
    const traditions = new Set(results.map((r) => r.tradition));
    expect(traditions.size).toBeGreaterThan(1);
  });

  it('includes the verse object in results', () => {
    const results = searchVerses('Tao');
    if (results.length > 0) {
      expect(results[0].verse).toHaveProperty('translation');
      expect(results[0].verse).toHaveProperty('number');
    }
  });
});
