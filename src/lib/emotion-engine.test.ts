import { describe, it, expect } from 'vitest';
import {
  computeAdaptation,
  shouldAdaptSession,
  buildEmotionTrendSummary,
  EMOTION_ADAPTATION_RULES,
} from './emotion-engine';
import type { EmotionSnapshot, EmotionLabel } from '@/types/features';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function snap(
  label: EmotionLabel,
  confidence: number,
  detectedAt = '2026-01-15T10:00:00.000Z',
): EmotionSnapshot {
  return { label, confidence, detectedAt };
}

// ---------------------------------------------------------------------------
// computeAdaptation
// ---------------------------------------------------------------------------

describe('computeAdaptation', () => {
  it('returns the correct adaptation for each known emotion at full confidence', () => {
    const allLabels: EmotionLabel[] = [
      'calm', 'anxious', 'stressed', 'sad', 'happy',
      'frustrated', 'drowsy', 'energetic', 'neutral',
    ];

    for (const label of allLabels) {
      const result = computeAdaptation(snap(label, 0.9));
      expect(result.breathingPatternId).toBeTruthy();
      expect(result.paceMultiplier).toBeGreaterThan(0);
      expect(result.musicEnergyLevel).toBeGreaterThanOrEqual(0);
      expect(result.musicEnergyLevel).toBeLessThanOrEqual(1);
      expect(result.guruToneInstruction.length).toBeGreaterThan(0);
    }
  });

  it('maps anxious to relaxing-478 pattern', () => {
    const result = computeAdaptation(snap('anxious', 0.8));
    expect(result.breathingPatternId).toBe('relaxing-478');
    expect(result.paceMultiplier).toBe(0.7);
  });

  it('maps drowsy to energizing pattern with higher pace', () => {
    const result = computeAdaptation(snap('drowsy', 0.75));
    expect(result.breathingPatternId).toBe('energizing');
    expect(result.paceMultiplier).toBe(1.2);
  });

  it('returns default adaptation for below-threshold confidence', () => {
    const result = computeAdaptation(snap('anxious', 0.1));
    // Below the rule's minConfidence (0.3), falls back to default
    expect(result.breathingPatternId).toBe('calm');
    expect(result.paceMultiplier).toBe(1.0);
  });

  it('every rule covers a unique emotion label', () => {
    const labels = EMOTION_ADAPTATION_RULES.map((r) => r.emotion);
    const unique = new Set(labels);
    expect(unique.size).toBe(labels.length);
  });

  it('all rules have minConfidence > 0', () => {
    for (const rule of EMOTION_ADAPTATION_RULES) {
      expect(rule.minConfidence).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// shouldAdaptSession
// ---------------------------------------------------------------------------

describe('shouldAdaptSession', () => {
  it('returns true on first detection with sufficient confidence', () => {
    expect(shouldAdaptSession(snap('calm', 0.8), null)).toBe(true);
  });

  it('returns false on first detection with low confidence', () => {
    expect(shouldAdaptSession(snap('calm', 0.1), null)).toBe(false);
  });

  it('returns true when emotion label changes', () => {
    const prev = snap('calm', 0.8);
    const curr = snap('anxious', 0.8);
    expect(shouldAdaptSession(curr, prev)).toBe(true);
  });

  it('returns false when same label with small confidence change', () => {
    const prev = snap('calm', 0.8);
    const curr = snap('calm', 0.85);
    expect(shouldAdaptSession(curr, prev)).toBe(false);
  });

  it('returns true when same label with large confidence change (>= 0.25)', () => {
    const prev = snap('calm', 0.5);
    const curr = snap('calm', 0.8);
    expect(shouldAdaptSession(curr, prev)).toBe(true);
  });

  it('returns false when current confidence is below actionable threshold', () => {
    const prev = snap('calm', 0.8);
    const curr = snap('anxious', 0.2);
    expect(shouldAdaptSession(curr, prev)).toBe(false);
  });

  it('boundary: confidence change of exactly 0.25 triggers adaptation', () => {
    const prev = snap('calm', 0.5);
    const curr = snap('calm', 0.75);
    expect(shouldAdaptSession(curr, prev)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildEmotionTrendSummary
// ---------------------------------------------------------------------------

describe('buildEmotionTrendSummary', () => {
  it('returns placeholder for empty history', () => {
    expect(buildEmotionTrendSummary([])).toBe(
      'No emotional data has been detected yet.',
    );
  });

  it('returns single-emotion summary for one entry', () => {
    const summary = buildEmotionTrendSummary([snap('calm', 0.9)]);
    expect(summary).toContain('calm');
    expect(summary).toContain('90%');
  });

  it('describes emotional arc for multiple entries', () => {
    const history = [
      snap('stressed', 0.8, '2026-01-15T10:00:00.000Z'),
      snap('stressed', 0.7, '2026-01-15T10:05:00.000Z'),
      snap('calm', 0.85, '2026-01-15T10:10:00.000Z'),
    ];
    const summary = buildEmotionTrendSummary(history);
    expect(summary).toContain('stressed -> calm');
    expect(summary).toContain('3 readings');
  });

  it('reports consistent emotional state', () => {
    const history = [
      snap('calm', 0.8, '2026-01-15T10:00:00.000Z'),
      snap('calm', 0.85, '2026-01-15T10:05:00.000Z'),
      snap('calm', 0.9, '2026-01-15T10:10:00.000Z'),
    ];
    const summary = buildEmotionTrendSummary(history);
    expect(summary).toContain('consistently calm');
  });

  it('reports dominant emotion when different from latest', () => {
    const history = [
      snap('anxious', 0.8, '2026-01-15T10:00:00.000Z'),
      snap('anxious', 0.7, '2026-01-15T10:05:00.000Z'),
      snap('anxious', 0.75, '2026-01-15T10:10:00.000Z'),
      snap('calm', 0.85, '2026-01-15T10:15:00.000Z'),
    ];
    const summary = buildEmotionTrendSummary(history);
    expect(summary).toContain('dominant emotion');
    expect(summary).toContain('anxious');
  });
});
