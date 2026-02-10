import { describe, it, expect } from 'vitest';
import {
  buildPosePrompt,
  parsePoseAnalysis,
  formatCorrectionForSpeech,
  filterCorrectionsBySeverity,
  computeAlignmentScore,
  DEFAULT_POSE_CONFIG,
} from './pose-correction';
import type { PoseCorrection, Severity } from '@/types/features';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCorrection(severity: Severity, bodyPart = 'left hip'): PoseCorrection {
  return {
    id: `c-${Date.now()}`,
    bodyPart,
    instruction: 'Lift slightly higher',
    severity,
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// buildPosePrompt
// ---------------------------------------------------------------------------

describe('buildPosePrompt', () => {
  it('includes the pose name in the prompt', () => {
    const prompt = buildPosePrompt('tree', 'Tree Pose');
    expect(prompt).toContain('Tree Pose');
  });

  it('includes key instruction elements', () => {
    const prompt = buildPosePrompt('warrior-1', 'Warrior I');
    expect(prompt).toContain('report_pose_analysis');
    expect(prompt).toContain('severity');
    expect(prompt).toContain('alignment score');
  });

  it('returns a non-empty string', () => {
    expect(buildPosePrompt('id', 'name').length).toBeGreaterThan(50);
  });
});

// ---------------------------------------------------------------------------
// parsePoseAnalysis
// ---------------------------------------------------------------------------

describe('parsePoseAnalysis', () => {
  it('parses valid function call arguments', () => {
    const result = parsePoseAnalysis({
      poseName: 'Tree Pose',
      overallScore: '85',
      isAligned: 'true',
      corrections: JSON.stringify([
        { bodyPart: 'left knee', instruction: 'Straighten', severity: 'gentle' },
      ]),
    });

    expect(result.poseName).toBe('Tree Pose');
    expect(result.overallScore).toBe(85);
    expect(result.isAligned).toBe(true);
    expect(result.corrections).toHaveLength(1);
    expect(result.corrections[0].bodyPart).toBe('left knee');
  });

  it('clamps overallScore to [0, 100]', () => {
    expect(parsePoseAnalysis({ overallScore: '150' }).overallScore).toBe(100);
    expect(parsePoseAnalysis({ overallScore: '-10' }).overallScore).toBe(0);
  });

  it('defaults isAligned to false for non-true strings', () => {
    expect(parsePoseAnalysis({ isAligned: 'false' }).isAligned).toBe(false);
    expect(parsePoseAnalysis({ isAligned: 'maybe' }).isAligned).toBe(false);
  });

  it('handles missing corrections gracefully', () => {
    const result = parsePoseAnalysis({});
    expect(result.corrections).toEqual([]);
  });

  it('handles malformed corrections JSON', () => {
    const result = parsePoseAnalysis({ corrections: 'not-json' });
    expect(result.corrections).toEqual([]);
  });

  it('validates severity to gentle for unknown values', () => {
    const result = parsePoseAnalysis({
      corrections: JSON.stringify([
        { bodyPart: 'hip', instruction: 'fix', severity: 'unknown_severity' },
      ]),
    });
    expect(result.corrections[0].severity).toBe('gentle');
  });

  it('handles corrections as array (not string)', () => {
    const result = parsePoseAnalysis({
      corrections: [
        { bodyPart: 'arm', instruction: 'raise', severity: 'important' },
      ],
    });
    expect(result.corrections).toHaveLength(1);
    expect(result.corrections[0].severity).toBe('important');
  });
});

// ---------------------------------------------------------------------------
// formatCorrectionForSpeech
// ---------------------------------------------------------------------------

describe('formatCorrectionForSpeech', () => {
  it('includes body part and instruction', () => {
    const result = formatCorrectionForSpeech(makeCorrection('gentle'));
    expect(result).toContain('left hip');
    expect(result).toContain('Lift slightly higher');
  });

  it('adds safety prefix for critical corrections', () => {
    const result = formatCorrectionForSpeech(makeCorrection('critical'));
    expect(result).toContain('Important safety note');
  });

  it('uses gentle prefix for gentle corrections', () => {
    const result = formatCorrectionForSpeech(makeCorrection('gentle'));
    expect(result.startsWith('Gently')).toBe(true);
  });

  it('uses "Try to" prefix for important corrections', () => {
    const result = formatCorrectionForSpeech(makeCorrection('important'));
    expect(result).toContain('Try to');
  });

  it('handles empty body part', () => {
    const correction: PoseCorrection = {
      id: '1',
      bodyPart: '',
      instruction: 'Straighten your back',
      severity: 'gentle',
      timestamp: new Date().toISOString(),
    };
    const result = formatCorrectionForSpeech(correction);
    expect(result).toContain('Straighten your back');
  });

  it('handles empty instruction', () => {
    const correction: PoseCorrection = {
      id: '1',
      bodyPart: 'shoulders',
      instruction: '',
      severity: 'gentle',
      timestamp: new Date().toISOString(),
    };
    const result = formatCorrectionForSpeech(correction);
    expect(result).toContain('shoulders');
  });

  it('handles both empty body part and instruction', () => {
    const correction: PoseCorrection = {
      id: '1',
      bodyPart: '',
      instruction: '',
      severity: 'gentle',
      timestamp: new Date().toISOString(),
    };
    const result = formatCorrectionForSpeech(correction);
    expect(result).toContain('take another look');
  });
});

// ---------------------------------------------------------------------------
// filterCorrectionsBySeverity
// ---------------------------------------------------------------------------

describe('filterCorrectionsBySeverity', () => {
  const corrections = [
    makeCorrection('info'),
    makeCorrection('gentle'),
    makeCorrection('important'),
    makeCorrection('critical'),
  ];

  it('returns all corrections when threshold is info', () => {
    expect(filterCorrectionsBySeverity(corrections, 'info')).toHaveLength(4);
  });

  it('filters out info when threshold is gentle', () => {
    expect(filterCorrectionsBySeverity(corrections, 'gentle')).toHaveLength(3);
  });

  it('returns only important and critical when threshold is important', () => {
    expect(filterCorrectionsBySeverity(corrections, 'important')).toHaveLength(2);
  });

  it('returns only critical when threshold is critical', () => {
    expect(filterCorrectionsBySeverity(corrections, 'critical')).toHaveLength(1);
  });

  it('returns empty array for empty input', () => {
    expect(filterCorrectionsBySeverity([], 'info')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// computeAlignmentScore
// ---------------------------------------------------------------------------

describe('computeAlignmentScore', () => {
  it('returns 100 for no corrections', () => {
    expect(computeAlignmentScore([])).toBe(100);
  });

  it('deducts 2 points for info severity', () => {
    expect(computeAlignmentScore([makeCorrection('info')])).toBe(98);
  });

  it('deducts 5 points for gentle severity', () => {
    expect(computeAlignmentScore([makeCorrection('gentle')])).toBe(95);
  });

  it('deducts 15 points for important severity', () => {
    expect(computeAlignmentScore([makeCorrection('important')])).toBe(85);
  });

  it('deducts 25 points for critical severity', () => {
    expect(computeAlignmentScore([makeCorrection('critical')])).toBe(75);
  });

  it('accumulates penalties across multiple corrections', () => {
    const corrections = [makeCorrection('gentle'), makeCorrection('important')];
    expect(computeAlignmentScore(corrections)).toBe(80);
  });

  it('clamps to 0, never goes negative', () => {
    const many = Array(10).fill(null).map(() => makeCorrection('critical'));
    expect(computeAlignmentScore(many)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_POSE_CONFIG
// ---------------------------------------------------------------------------

describe('DEFAULT_POSE_CONFIG', () => {
  it('has reasonable defaults', () => {
    expect(DEFAULT_POSE_CONFIG.frameRateHz).toBeGreaterThan(0);
    expect(DEFAULT_POSE_CONFIG.enableSpokenFeedback).toBe(true);
    expect(DEFAULT_POSE_CONFIG.enableVisualOverlay).toBe(true);
    expect(DEFAULT_POSE_CONFIG.correctionThreshold).toBeGreaterThan(0);
  });
});
