/**
 * Socratic dialog service for sacred text study (Feature 9).
 *
 * Uses Gemini Flash to generate Socratic responses, verse explanations,
 * and practical applications connecting ancient wisdom to meditation practice.
 */

import { flashModel } from '@/lib/gemini';
import type { TextVerse, StudyMessage } from '@/types/features';

/**
 * Generate a Socratic study response from the guru about a sacred verse.
 *
 * The prompt engineering produces a response that:
 * - Asks a reflective follow-up question
 * - Draws connections across traditions when relevant
 * - Offers practical applications for meditation or daily life
 */
export async function generateStudyResponse(
  verse: TextVerse,
  tradition: string,
  userQuestion: string,
  previousMessages: readonly StudyMessage[],
): Promise<string> {
  const conversationContext = previousMessages
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Student' : 'Guru'}: ${m.content}`)
    .join('\n');

  const prompt = `You are a wise, compassionate meditation guru engaging in Socratic dialog about sacred texts. You draw from deep knowledge of Yoga, Buddhism, Taoism, and Stoicism.

VERSE UNDER STUDY (${tradition} tradition):
Original: "${verse.original}"
${verse.transliteration ? `Transliteration: "${verse.transliteration}"` : ''}
Translation: "${verse.translation}"

${conversationContext ? `PREVIOUS CONVERSATION:\n${conversationContext}\n` : ''}
STUDENT'S QUESTION: "${userQuestion}"

GUIDELINES:
1. Respond thoughtfully to the student's question, drawing from the verse's meaning.
2. Use the Socratic method: ask a reflective follow-up question to deepen understanding.
3. When relevant, draw connections to teachings from other traditions.
4. Suggest a practical application — how this teaching can be experienced in meditation or daily life.
5. Keep the tone warm, wise, and encouraging. Use occasional Sanskrit/Pali/Chinese terms naturally.
6. Keep the response concise (3-5 paragraphs).

Respond as the guru directly (no prefixes or labels):`;

  try {
    const result = await flashModel.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating study response:', error);
    return 'I sense a momentary disturbance in our connection. Please share your question again, and let us continue our contemplation together.';
  }
}

/**
 * Generate an initial explanation of a sacred verse.
 * Used when a user first selects a verse for study.
 */
export async function generateVerseExplanation(
  verse: TextVerse,
  tradition: string,
): Promise<string> {
  const prompt = `You are a wise meditation guru. Provide a clear, insightful explanation of the following sacred verse from the ${tradition} tradition.

Original: "${verse.original}"
${verse.transliteration ? `Transliteration: "${verse.transliteration}"` : ''}
Translation: "${verse.translation}"

GUIDELINES:
1. Explain the verse's meaning in accessible language.
2. Provide historical or philosophical context.
3. Highlight key concepts or terms.
4. Draw a brief connection to meditation practice.
5. End with an open question to invite the student's reflection.
6. Keep the tone warm and wise. 2-4 paragraphs.

Respond as the guru directly (no prefixes or labels):`;

  try {
    const result = await flashModel.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating verse explanation:', error);
    return 'This is a profound verse worthy of deep contemplation. Take a moment to sit with its words before we explore its meaning together.';
  }
}

/**
 * Generate a practical application of a verse's teaching, personalized
 * to the user's meditation and yoga goals.
 */
export async function suggestPracticalApplication(
  verse: TextVerse,
  userGoals: readonly string[],
): Promise<string> {
  const goalsText = userGoals.length > 0
    ? userGoals.join(', ')
    : 'general well-being and mindfulness';

  const prompt = `You are a wise meditation guru. Connect this sacred verse to practical application in meditation and daily life.

Verse translation: "${verse.translation}"

The student's current practice goals are: ${goalsText}

GUIDELINES:
1. Suggest 2-3 specific ways to apply this teaching in meditation practice.
2. Offer 1-2 ways to carry this wisdom into daily life.
3. If relevant, suggest a breathing exercise or brief meditation technique inspired by the verse.
4. Personalize suggestions to the student's goals.
5. Keep it practical and actionable. 2-3 paragraphs.

Respond as the guru directly (no prefixes or labels):`;

  try {
    const result = await flashModel.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating practical application:', error);
    return 'Let this verse guide your next meditation. Sit quietly, breathe deeply, and let its meaning settle into your awareness.';
  }
}
