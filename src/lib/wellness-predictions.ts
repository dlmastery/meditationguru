/**
 * AI prediction engine for the Wellness Dashboard.
 *
 * Uses Gemini Flash to analyse aggregated metrics and session memories,
 * then produces actionable predictions and insights.
 */

import { flashModel } from '@/lib/gemini';
import {
  computeWellnessMetrics,
  computeSessionFrequency,
  computeMoodTrend,
  computeStreakDays,
  compareWithPreviousPeriod,
} from '@/lib/wellness-analytics';
import { getSessionMemories } from '@/lib/persistence';
import type {
  WellnessMetrics,
  WellnessPrediction,
  SessionMemory,
  DashboardData,
  DocId,
} from '@/types/features';

// ---------------------------------------------------------------------------
// Gemini prompt helpers
// ---------------------------------------------------------------------------

/**
 * Build a compact summary string of metrics for the Gemini prompt so we
 * stay well within token limits.
 */
function metricsToPromptContext(metrics: WellnessMetrics): string {
  return [
    `Sessions: ${metrics.totalSessions}`,
    `Minutes: ${metrics.totalMinutes}`,
    `Avg mood before: ${metrics.averageMoodBefore}/5`,
    `Avg mood after: ${metrics.averageMoodAfter}/5`,
    `Mood improvement: ${metrics.moodImprovement}%`,
    `Current streak: ${metrics.streakDays} days`,
    `Top techniques: ${metrics.topTechniques.join(', ') || 'none'}`,
  ].join('; ');
}

/**
 * Build a brief session history string for the Gemini prompt.
 */
function memoriesToPromptContext(
  memories: readonly SessionMemory[],
  maxEntries = 10,
): string {
  return memories
    .slice(0, maxEntries)
    .map(
      (m) =>
        `${m.createdAt.slice(0, 10)}: ${m.sessionType}, ${m.durationMinutes}min, ` +
        `mood ${m.emotionBefore}->${m.emotionAfter}, techniques: ${m.techniquesUsed.join(',')}`,
    )
    .join('\n');
}

// ---------------------------------------------------------------------------
// Prediction generation
// ---------------------------------------------------------------------------

/**
 * Use Gemini Flash to analyze wellness patterns and generate predictions.
 *
 * Returns 2-4 predictions covering motivation dips, streak risks,
 * goal milestones, and technique suggestions.
 */
export async function generatePredictions(
  metrics: WellnessMetrics,
  memories: readonly SessionMemory[],
): Promise<WellnessPrediction[]> {
  const prompt = `You are a wellness analytics AI. Analyze the following meditation/yoga practice data and generate 2-4 predictions.

Metrics summary:
${metricsToPromptContext(metrics)}

Recent sessions:
${memoriesToPromptContext(memories)}

For each prediction, determine one of these types:
- "motivation_dip": user may lose motivation soon based on declining frequency/mood
- "streak_risk": user's streak might break (e.g. weekend pattern, gaps forming)
- "goal_milestone": user is approaching a notable achievement
- "technique_suggestion": recommend a technique the user hasn't tried or should try more

Respond in JSON format only. Do not include markdown fences.
[
  {
    "type": "motivation_dip" | "streak_risk" | "goal_milestone" | "technique_suggestion",
    "title": "short title",
    "description": "1-2 sentence explanation",
    "confidence": 0.0-1.0,
    "suggestedAction": "specific actionable suggestion"
  }
]`;

  try {
    const result = await flashModel.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed: WellnessPrediction[] = JSON.parse(jsonMatch[0]);
      return parsed.map((p) => ({
        type: p.type,
        title: p.title,
        description: p.description,
        confidence: Math.max(0, Math.min(1, p.confidence)),
        suggestedAction: p.suggestedAction,
        predictedDate: p.predictedDate,
      }));
    }
  } catch (error) {
    console.error('Error generating predictions:', error);
  }

  return [
    {
      type: 'technique_suggestion',
      title: 'Try Something New',
      description:
        'Exploring different meditation techniques can deepen your practice and prevent stagnation.',
      confidence: 0.7,
      suggestedAction: 'Start a guided loving-kindness meditation this week.',
    },
  ];
}

// ---------------------------------------------------------------------------
// Insight generation
// ---------------------------------------------------------------------------

/**
 * Use Gemini Flash to generate 3-5 personalized insight strings
 * from the current wellness metrics.
 */
export async function generateInsights(
  metrics: WellnessMetrics,
): Promise<string[]> {
  const prompt = `You are a mindful wellness advisor. Based on the following practice metrics, generate 3-5 short, encouraging insight strings (1 sentence each). Be specific and data-driven.

${metricsToPromptContext(metrics)}

Respond in JSON format only. Do not include markdown fences.
["insight 1", "insight 2", "insight 3"]`;

  try {
    const result = await flashModel.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed: string[] = JSON.parse(jsonMatch[0]);
      return parsed.slice(0, 5);
    }
  } catch (error) {
    console.error('Error generating insights:', error);
  }

  return [
    `You have completed ${metrics.totalSessions} sessions totaling ${metrics.totalMinutes} minutes.`,
    `Your mood tends to improve by ${metrics.moodImprovement}% after each session.`,
    'Consistency is key -- keep building your streak!',
  ];
}

// ---------------------------------------------------------------------------
// Dashboard data orchestrator
// ---------------------------------------------------------------------------

/**
 * Orchestrate the complete dashboard data assembly for a user.
 *
 * 1. Fetches session memories from Firestore.
 * 2. Computes metrics for the current period.
 * 3. Computes metrics for the previous period of the same length.
 * 4. Generates AI predictions and insights in parallel.
 * 5. Returns the assembled `DashboardData`.
 */
export async function buildDashboardData(
  userId: DocId,
  memories: readonly SessionMemory[],
): Promise<DashboardData> {
  const now = new Date();
  const periodEnd = now.toISOString();

  // Default to 30-day window; the page component can override via params
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const periodStart = thirtyDaysAgo.toISOString();

  // Previous period (30 days before that)
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const prevPeriodStart = sixtyDaysAgo.toISOString();

  const currentMetrics = computeWellnessMetrics(
    memories,
    periodStart,
    periodEnd,
  );
  const previousMetrics = computeWellnessMetrics(
    memories,
    prevPeriodStart,
    periodStart,
  );

  const comparison = compareWithPreviousPeriod(
    currentMetrics,
    previousMetrics.totalSessions > 0 ? previousMetrics : null,
  );

  // Run AI tasks in parallel
  const [predictions, insights] = await Promise.all([
    generatePredictions(currentMetrics, memories),
    generateInsights(currentMetrics),
  ]);

  return {
    metrics: { ...currentMetrics, userId },
    predictions,
    insights,
    comparisonWithLastPeriod: comparison,
  };
}
