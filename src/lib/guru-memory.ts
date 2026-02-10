/**
 * Guru memory service for cross-session personalization.
 *
 * Summarizes completed sessions into compact memory records and assembles
 * contextual system prompts so the AI guru can reference past interactions,
 * track milestones, and adapt its mentorship style.
 */

import { flashModel } from './gemini';
import type {
  EmotionLabel,
  GuruContext,
  SessionMemory,
} from '@/types/features';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_EMOTIONS: readonly EmotionLabel[] = [
  'calm', 'anxious', 'stressed', 'sad', 'happy',
  'frustrated', 'drowsy', 'energetic', 'neutral',
] as const;

/** Maximum tokens budget for the memory context block in the system prompt. */
const MAX_MEMORY_CONTEXT_CHARS = 4_000; // ~2000 tokens

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result of summarizing a session (before Firestore assigns an id). */
export type SessionSummaryResult = Omit<SessionMemory, 'id'>;

interface RawSessionSummary {
  summary: string;
  keyMoments: string[];
  guruObservations: string;
  breathingPatternUsed: string;
  durationMinutes: number;
}

// ---------------------------------------------------------------------------
// Session summarization
// ---------------------------------------------------------------------------

/**
 * Summarize a completed session into a compact memory record using Gemini Flash.
 *
 * @param messages - The conversation transcript between user and guru.
 * @param sessionType - "meditation", "yoga", or "mixed".
 * @param emotionBefore - User's emotional state before the session.
 * @param emotionAfter - User's emotional state after the session.
 * @param techniques - Techniques practiced during the session.
 * @returns A session memory record ready for persistence.
 */
export async function summarizeSession(
  messages: ReadonlyArray<{ role: string; content: string }>,
  sessionType: string,
  emotionBefore: string,
  emotionAfter: string,
  techniques: string[],
): Promise<SessionSummaryResult> {
  const transcript = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const prompt = `You are a meditation guru reviewing a completed ${sessionType} session.

Summarize this session concisely for your memory. Respond in JSON format ONLY (no markdown fences):
{
  "summary": "1-2 sentence session summary focusing on what was practiced and achieved",
  "keyMoments": ["2-4 notable moments from the session"],
  "guruObservations": "1-2 sentence observation about the practitioner's progress or areas for growth",
  "breathingPatternUsed": "primary breathing pattern used, or 'none'",
  "durationMinutes": estimated_duration_in_minutes
}

Session type: ${sessionType}
Emotion before: ${emotionBefore}
Emotion after: ${emotionAfter}
Techniques: ${techniques.join(', ')}

Transcript:
${transcript.slice(0, 3000)}`;

  const validatedEmotionBefore = VALID_EMOTIONS.includes(emotionBefore as EmotionLabel)
    ? (emotionBefore as EmotionLabel)
    : 'neutral';
  const validatedEmotionAfter = VALID_EMOTIONS.includes(emotionAfter as EmotionLabel)
    ? (emotionAfter as EmotionLabel)
    : 'neutral';
  const validatedSessionType = (['meditation', 'yoga', 'mixed'] as const).includes(
    sessionType as 'meditation' | 'yoga' | 'mixed',
  )
    ? (sessionType as 'meditation' | 'yoga' | 'mixed')
    : 'meditation';

  try {
    const result = await flashModel.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed: RawSessionSummary = JSON.parse(jsonMatch[0]);

      return {
        userId: '',
        sessionId: '',
        sessionType: validatedSessionType,
        summary: parsed.summary ?? '',
        keyMoments: parsed.keyMoments ?? [],
        emotionBefore: validatedEmotionBefore,
        emotionAfter: validatedEmotionAfter,
        breathingPatternUsed: parsed.breathingPatternUsed ?? 'none',
        techniquesUsed: techniques,
        guruObservations: parsed.guruObservations ?? '',
        durationMinutes: parsed.durationMinutes ?? 0,
        createdAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error('Session summarization failed:', error);
  }

  return {
    userId: '',
    sessionId: '',
    sessionType: validatedSessionType,
    summary: `Completed a ${sessionType} session.`,
    keyMoments: [],
    emotionBefore: validatedEmotionBefore,
    emotionAfter: validatedEmotionAfter,
    breathingPatternUsed: 'none',
    techniquesUsed: techniques,
    guruObservations: '',
    durationMinutes: 0,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// System prompt assembly
// ---------------------------------------------------------------------------

/**
 * Build the full system prompt with guru memory context injected.
 * This is passed as `guruMemoryContext` to EnhancedSessionConfig.
 *
 * @param context - The assembled guru context from persistence.
 * @returns A string block to inject into the Gemini system prompt.
 */
export function buildSystemPromptWithMemory(context: GuruContext): string {
  const parts: string[] = [];

  parts.push(`PRACTITIONER PROFILE:`);
  parts.push(`- Total sessions completed: ${context.totalSessions}`);
  parts.push(`- Experience level: ${context.experienceLevel}`);
  parts.push(`- Goals: ${context.userGoals.join(', ') || 'not yet specified'}`);
  parts.push(`- Emotional trend: ${context.emotionalTrend}`);

  if (context.milestones.length > 0) {
    parts.push(`\nMILESTONES ACHIEVED:`);
    for (const milestone of context.milestones) {
      parts.push(`- ${milestone}`);
    }
  }

  parts.push(`\nGREETING: ${context.personalizedGreeting}`);

  if (context.recentMemories.length > 0) {
    parts.push(`\nRECENT SESSION MEMORIES:`);
    parts.push(formatMemoryForContext(context.recentMemories as SessionMemory[]));
  }

  parts.push(
    `\nINSTRUCTIONS: Use this context to personalize your guidance. ` +
    `Reference past sessions naturally without explicitly listing them. ` +
    `Acknowledge milestones. Adapt your tone to the practitioner's emotional trend. ` +
    `Build on techniques they have already practiced.`,
  );

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Memory formatting
// ---------------------------------------------------------------------------

/**
 * Convert recent session memories into a concise text block for the system prompt.
 * Stays under approximately 2000 tokens by truncating older entries.
 *
 * @param memories - Recent session memories, ordered newest first.
 * @returns A compact text representation of the session history.
 */
export function formatMemoryForContext(memories: SessionMemory[]): string {
  const lines: string[] = [];
  let charCount = 0;

  for (const memory of memories) {
    const date = new Date(memory.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const line =
      `[${date}] ${memory.sessionType} session (${memory.durationMinutes}min): ` +
      `${memory.summary} ` +
      `Mood: ${memory.emotionBefore} -> ${memory.emotionAfter}. ` +
      (memory.guruObservations ? `Note: ${memory.guruObservations}` : '');

    if (charCount + line.length > MAX_MEMORY_CONTEXT_CHARS) {
      break;
    }

    lines.push(line);
    charCount += line.length;
  }

  if (lines.length === 0) {
    return 'No previous sessions recorded.';
  }

  return lines.join('\n');
}
