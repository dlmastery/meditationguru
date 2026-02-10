/**
 * Emotion adaptation engine for MeditationGuru.
 *
 * Pure functions that map detected emotions to session adaptations.
 * No side effects -- all state management lives in the React hook layer.
 *
 * @module emotion-engine
 */

import type {
  EmotionAdaptationRule,
  EmotionLabel,
  EmotionSnapshot,
  SessionAdaptation,
} from '@/types/features';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Minimum absolute change in confidence required to trigger a re-adaptation
 * when the emotion label stays the same.
 */
const CONFIDENCE_CHANGE_THRESHOLD = 0.25;

/**
 * Minimum confidence score for an emotion snapshot to be considered
 * actionable. Below this, the engine treats it as noise.
 */
const MIN_ACTIONABLE_CONFIDENCE = 0.3;

// ---------------------------------------------------------------------------
// Adaptation rules
// ---------------------------------------------------------------------------

/**
 * Complete set of rules mapping each {@link EmotionLabel} to a
 * {@link SessionAdaptation}. Each rule includes a minimum confidence
 * gate so low-confidence detections are ignored.
 */
export const EMOTION_ADAPTATION_RULES: readonly EmotionAdaptationRule[] = [
  {
    emotion: 'calm',
    minConfidence: 0.3,
    adaptation: {
      paceMultiplier: 1.0,
      breathingPatternId: 'calm',
      guruToneInstruction:
        'Speak in a warm, steady tone. The user is calm -- maintain this peaceful state with gentle encouragement.',
      musicEnergyLevel: 0.3,
      suggestedTechnique: 'mindfulness meditation',
    },
  },
  {
    emotion: 'anxious',
    minConfidence: 0.3,
    adaptation: {
      paceMultiplier: 0.7,
      breathingPatternId: 'relaxing-478',
      guruToneInstruction:
        'Speak slowly and soothingly. The user is anxious -- use grounding language, count breaths, and reassure them.',
      musicEnergyLevel: 0.2,
      suggestedTechnique: 'grounding body scan',
    },
  },
  {
    emotion: 'stressed',
    minConfidence: 0.3,
    adaptation: {
      paceMultiplier: 0.75,
      breathingPatternId: 'deep-belly',
      guruToneInstruction:
        'Speak with calm authority. The user is stressed -- guide them to release tension with progressive relaxation cues.',
      musicEnergyLevel: 0.25,
      suggestedTechnique: 'progressive muscle relaxation',
    },
  },
  {
    emotion: 'sad',
    minConfidence: 0.3,
    adaptation: {
      paceMultiplier: 0.8,
      breathingPatternId: 'ratio-2-1',
      guruToneInstruction:
        'Speak gently and compassionately. The user is feeling sad -- acknowledge their feelings and offer loving-kindness phrases.',
      musicEnergyLevel: 0.2,
      suggestedTechnique: 'loving-kindness meditation',
    },
  },
  {
    emotion: 'happy',
    minConfidence: 0.3,
    adaptation: {
      paceMultiplier: 1.1,
      breathingPatternId: 'calm',
      guruToneInstruction:
        'Match their positive energy with warmth. The user is happy -- channel this joy into deeper presence and gratitude.',
      musicEnergyLevel: 0.5,
      suggestedTechnique: 'gratitude meditation',
    },
  },
  {
    emotion: 'frustrated',
    minConfidence: 0.3,
    adaptation: {
      paceMultiplier: 0.7,
      breathingPatternId: 'box-breathing',
      guruToneInstruction:
        'Speak with patience and understanding. The user is frustrated -- offer structured breathing and validation before guidance.',
      musicEnergyLevel: 0.3,
      suggestedTechnique: 'box breathing with visualization',
    },
  },
  {
    emotion: 'drowsy',
    minConfidence: 0.3,
    adaptation: {
      paceMultiplier: 1.2,
      breathingPatternId: 'energizing',
      guruToneInstruction:
        'Add gentle energy to your voice. The user is drowsy -- use shorter sentences, slight pauses, and invigorating cues.',
      musicEnergyLevel: 0.6,
      suggestedTechnique: 'energizing breath work',
    },
  },
  {
    emotion: 'energetic',
    minConfidence: 0.3,
    adaptation: {
      paceMultiplier: 1.0,
      breathingPatternId: 'ujjayi',
      guruToneInstruction:
        'Match their vitality. The user is energetic -- channel this into focused movement or deeper practice.',
      musicEnergyLevel: 0.55,
      suggestedTechnique: 'dynamic yoga flow',
    },
  },
  {
    emotion: 'neutral',
    minConfidence: 0.3,
    adaptation: {
      paceMultiplier: 1.0,
      breathingPatternId: 'calm',
      guruToneInstruction:
        'Use a balanced, inviting tone. The user is in a neutral state -- gently guide them toward deeper engagement.',
      musicEnergyLevel: 0.35,
      suggestedTechnique: 'mindfulness meditation',
    },
  },
] as const;

/** Lookup map for O(1) rule retrieval by emotion label. */
const RULES_BY_EMOTION: ReadonlyMap<EmotionLabel, EmotionAdaptationRule> =
  new Map(EMOTION_ADAPTATION_RULES.map((rule) => [rule.emotion, rule]));

/** Fallback adaptation when no rule matches. */
const DEFAULT_ADAPTATION: SessionAdaptation = {
  paceMultiplier: 1.0,
  breathingPatternId: 'calm',
  guruToneInstruction: 'Use a calm, balanced tone.',
  musicEnergyLevel: 0.35,
  suggestedTechnique: 'mindfulness meditation',
};

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Find the best matching adaptation for a detected emotion.
 *
 * Returns the rule's adaptation if the snapshot meets the rule's minimum
 * confidence threshold, otherwise falls back to the neutral/default adaptation.
 *
 * @param emotion - The most recent emotion snapshot from Gemini.
 * @returns The session adaptation parameters to apply.
 */
export function computeAdaptation(emotion: EmotionSnapshot): SessionAdaptation {
  const rule = RULES_BY_EMOTION.get(emotion.label);
  if (rule && emotion.confidence >= rule.minConfidence) {
    return rule.adaptation;
  }
  return DEFAULT_ADAPTATION;
}

/**
 * Build a human-readable summary of the user's emotional trajectory.
 *
 * Intended for injection into the guru's system prompt so it can reference
 * the user's emotional arc naturally in conversation.
 *
 * @param history - Ordered list of emotion snapshots (oldest first).
 * @returns A concise natural-language summary string.
 */
export function buildEmotionTrendSummary(
  history: readonly EmotionSnapshot[],
): string {
  if (history.length === 0) {
    return 'No emotional data has been detected yet.';
  }

  if (history.length === 1) {
    const only = history[0];
    return `The user's current emotional state is ${only.label} (confidence ${formatPercent(only.confidence)}).`;
  }

  // Extract unique labels in order to describe the arc
  const labels = history.map((s) => s.label);
  const uniqueArc = deduplicateConsecutive(labels);
  const latest = history[history.length - 1];
  const first = history[0];

  const parts: string[] = [];

  // Overall trajectory
  parts.push(
    `Over the last ${history.length} readings, the user's emotional journey has been: ${uniqueArc.join(' -> ')}.`,
  );

  // Direction
  if (first.label !== latest.label) {
    parts.push(
      `They started the session feeling ${first.label} and are now ${latest.label}.`,
    );
  } else {
    parts.push(
      `Their emotional state has remained consistently ${latest.label}.`,
    );
  }

  // Dominant emotion
  const dominant = findDominantEmotion(history);
  if (dominant !== latest.label) {
    parts.push(
      `The dominant emotion during this session has been ${dominant}.`,
    );
  }

  // Current confidence
  parts.push(
    `Current confidence: ${formatPercent(latest.confidence)}.`,
  );

  return parts.join(' ');
}

/**
 * Determine whether the session should adapt based on the difference
 * between the current and previous emotion snapshots.
 *
 * Prevents rapid flickering by requiring either a label change or a
 * significant confidence shift before triggering adaptation.
 *
 * @param current  - The newly detected emotion snapshot.
 * @param previous - The last snapshot that triggered an adaptation, or null.
 * @returns `true` if the engine should recompute and apply a new adaptation.
 */
export function shouldAdaptSession(
  current: EmotionSnapshot,
  previous: EmotionSnapshot | null,
): boolean {
  // Always adapt on the first detection
  if (previous === null) {
    return current.confidence >= MIN_ACTIONABLE_CONFIDENCE;
  }

  // Below actionable confidence -- skip
  if (current.confidence < MIN_ACTIONABLE_CONFIDENCE) {
    return false;
  }

  // Different primary emotion -- adapt
  if (current.label !== previous.label) {
    return true;
  }

  // Same label but significant confidence change -- adapt
  const confidenceDelta = Math.abs(current.confidence - previous.confidence);
  return confidenceDelta >= CONFIDENCE_CHANGE_THRESHOLD;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Remove consecutive duplicate values from an array.
 *
 * @example deduplicateConsecutive(['calm','calm','anxious','anxious','calm']) => ['calm','anxious','calm']
 */
function deduplicateConsecutive<T>(items: readonly T[]): T[] {
  const result: T[] = [];
  for (const item of items) {
    if (result.length === 0 || result[result.length - 1] !== item) {
      result.push(item);
    }
  }
  return result;
}

/**
 * Find the most frequently occurring emotion in a history array.
 */
function findDominantEmotion(
  history: readonly EmotionSnapshot[],
): EmotionLabel {
  const counts = new Map<EmotionLabel, number>();
  for (const snapshot of history) {
    counts.set(snapshot.label, (counts.get(snapshot.label) ?? 0) + 1);
  }

  let dominant: EmotionLabel = 'neutral';
  let maxCount = 0;
  for (const [label, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      dominant = label;
    }
  }
  return dominant;
}

/**
 * Format a 0-1 float as a percentage string (e.g. 0.85 => "85%").
 */
function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
