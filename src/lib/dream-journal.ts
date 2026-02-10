/**
 * Dream analysis service powered by Gemini Flash.
 *
 * Provides AI-driven dream interpretation including theme extraction,
 * symbol identification, emotional analysis, and cross-entry pattern detection.
 */

import { flashModel } from './gemini';
import type {
  DreamEntry,
  DreamPatternAnalysis,
  DreamSymbol,
  EmotionLabel,
  EmotionSnapshot,
} from '@/types/features';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_EMOTIONS: readonly EmotionLabel[] = [
  'calm', 'anxious', 'stressed', 'sad', 'happy',
  'frustrated', 'drowsy', 'energetic', 'neutral',
] as const;

const MAX_PATTERN_ENTRIES = 100;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result of analyzing a single dream transcript (before persistence). */
export type DreamAnalysisResult = Omit<
  DreamEntry,
  'id' | 'userId' | 'createdAt' | 'relatedSessionIds'
>;

interface RawDreamAnalysis {
  themes: string[];
  emotions: string[];
  symbols: Array<{ symbol: string; interpretation: string }>;
  analysis: string;
}

interface RawPatternAnalysis {
  recurringThemes: string[];
  emotionalArc: Array<{ label: string; confidence: number; detectedAt: string }>;
  insights: string[];
  correlationWithPractice: string;
}

// ---------------------------------------------------------------------------
// Single dream analysis
// ---------------------------------------------------------------------------

/**
 * Analyze a dream transcript using Gemini Flash to extract themes,
 * emotions, symbols, and a narrative analysis.
 *
 * @param transcript - The raw dream description from the user.
 * @returns Structured dream analysis ready for persistence.
 */
export async function analyzeDream(transcript: string): Promise<DreamAnalysisResult> {
  const prompt = `You are a dream analysis expert trained in Jungian symbolism and mindfulness psychology.

Analyze the following dream and respond in JSON format ONLY (no markdown fences):
{
  "themes": ["array of 2-5 thematic keywords, e.g. 'transformation', 'pursuit', 'water'"],
  "emotions": ["array of 1-3 emotions from: calm, anxious, stressed, sad, happy, frustrated, drowsy, energetic, neutral"],
  "symbols": [
    { "symbol": "name of a recurring symbol", "interpretation": "brief Jungian/mindfulness interpretation" }
  ],
  "analysis": "A 2-4 sentence narrative analysis connecting themes, symbols, and emotions. Reference meditation practice if relevant."
}

Dream transcript:
"${transcript}"`;

  try {
    const result = await flashModel.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed: RawDreamAnalysis = JSON.parse(jsonMatch[0]);

      const validEmotions = parsed.emotions
        .map((e) => e.toLowerCase().trim() as EmotionLabel)
        .filter((e): e is EmotionLabel =>
          VALID_EMOTIONS.includes(e),
        );

      const symbols: DreamSymbol[] = (parsed.symbols ?? []).map((s) => ({
        symbol: s.symbol,
        interpretation: s.interpretation,
        frequency: 1,
        firstSeen: new Date().toISOString(),
      }));

      return {
        rawTranscript: transcript,
        themes: parsed.themes ?? [],
        emotions: validEmotions.length > 0 ? validEmotions : ['neutral'],
        symbols,
        analysis: parsed.analysis ?? '',
      };
    }
  } catch (error) {
    console.error('Dream analysis failed:', error);
  }

  return {
    rawTranscript: transcript,
    themes: [],
    emotions: ['neutral'],
    symbols: [],
    analysis: 'Unable to analyze this dream at the moment. Please try again.',
  };
}

// ---------------------------------------------------------------------------
// Pattern analysis across multiple entries
// ---------------------------------------------------------------------------

/**
 * Analyze patterns across multiple dream journal entries using Gemini Flash.
 * Detects recurring themes, emotional arcs, and correlations with practice.
 *
 * @param entries - Array of dream entries to analyze (up to 100).
 * @returns Pattern analysis including themes, emotional arc, and insights.
 */
export async function analyzePatterns(
  entries: DreamEntry[],
): Promise<DreamPatternAnalysis> {
  const truncated = entries.slice(0, MAX_PATTERN_ENTRIES);

  const entrySummaries = truncated.map((e, i) => ({
    index: i + 1,
    date: e.createdAt,
    themes: e.themes,
    emotions: e.emotions,
    symbols: e.symbols.map((s) => s.symbol),
    snippet: e.rawTranscript.slice(0, 150),
  }));

  const prompt = `You are a dream pattern analyst specializing in meditation and mindfulness practice.

Analyze these ${truncated.length} dream journal entries and respond in JSON format ONLY (no markdown fences):
{
  "recurringThemes": ["themes that appear in 2+ entries"],
  "emotionalArc": [
    { "label": "emotion label", "confidence": 0.8, "detectedAt": "ISO date string" }
  ],
  "insights": ["3-5 actionable insights connecting dream patterns to meditation/wellness practice"],
  "correlationWithPractice": "A 2-3 sentence analysis of how dream patterns relate to meditation practice progression"
}

Dream entries:
${JSON.stringify(entrySummaries, null, 2)}`;

  const userId = truncated[0]?.userId ?? '';

  try {
    const result = await flashModel.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed: RawPatternAnalysis = JSON.parse(jsonMatch[0]);

      const emotionalArc: EmotionSnapshot[] = (parsed.emotionalArc ?? []).map((e) => ({
        label: (VALID_EMOTIONS.includes(e.label as EmotionLabel)
          ? e.label
          : 'neutral') as EmotionLabel,
        confidence: Math.max(0, Math.min(1, e.confidence ?? 0.5)),
        detectedAt: e.detectedAt ?? new Date().toISOString(),
      }));

      return {
        userId,
        totalEntries: truncated.length,
        recurringThemes: parsed.recurringThemes ?? [],
        emotionalArc,
        insights: parsed.insights ?? [],
        correlationWithPractice: parsed.correlationWithPractice ?? '',
        generatedAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error('Dream pattern analysis failed:', error);
  }

  return {
    userId,
    totalEntries: truncated.length,
    recurringThemes: [],
    emotionalArc: [],
    insights: ['Not enough data to generate insights yet. Keep journaling!'],
    correlationWithPractice: '',
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Display formatting
// ---------------------------------------------------------------------------

/**
 * Format a dream entry for display in the UI.
 *
 * @param entry - The dream entry to format.
 * @returns A human-readable string representation.
 */
export function formatDreamForDisplay(entry: DreamEntry): string {
  const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const themes = entry.themes.length > 0
    ? `Themes: ${entry.themes.join(', ')}`
    : '';

  const emotions = entry.emotions.length > 0
    ? `Emotions: ${entry.emotions.join(', ')}`
    : '';

  const symbols = entry.symbols.length > 0
    ? `Symbols: ${entry.symbols.map((s) => s.symbol).join(', ')}`
    : '';

  const sections = [date, '', entry.rawTranscript, '', themes, emotions, symbols, '', entry.analysis]
    .filter(Boolean);

  return sections.join('\n');
}
