/**
 * Visualization art pipeline service for Feature 6.
 *
 * Generates meditation visualization images via Gemini's image generation
 * capabilities, parses function call arguments from the enhanced Gemini
 * session, and constructs VisualizationFrame objects for the UI layer.
 */

import { GoogleGenAI } from '@google/genai';
import type { VisualizationFrame, VisualizationState } from '@/types/features';

// ---------------------------------------------------------------------------
// GenAI client (singleton, matches imagen.ts pattern)
// ---------------------------------------------------------------------------

const genAI = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
});

// ---------------------------------------------------------------------------
// Visualization styles
// ---------------------------------------------------------------------------

interface VisualizationStyleDef {
  readonly name: string;
  readonly promptSuffix: string;
}

/**
 * Style definitions with prompt-engineering suffixes appended to every
 * image generation request to steer the aesthetic.
 */
export const VISUALIZATION_STYLES: Record<
  VisualizationState['style'],
  VisualizationStyleDef
> = {
  watercolor: {
    name: 'Watercolor',
    promptSuffix:
      'rendered as a luminous watercolor painting with soft washes, bleeding edges, ' +
      'and translucent layered pigments on textured paper. Dreamy, ethereal palette.',
  },
  'oil-painting': {
    name: 'Oil Painting',
    promptSuffix:
      'rendered as a rich oil painting with visible impasto brushstrokes, deep chiaroscuro ' +
      'lighting, and saturated jewel-tone colors reminiscent of old masters.',
  },
  ethereal: {
    name: 'Ethereal',
    promptSuffix:
      'rendered in an ethereal, otherworldly digital art style with soft glowing light, ' +
      'iridescent particles, translucent forms, and pastel-to-white gradients. Heavenly atmosphere.',
  },
  cosmic: {
    name: 'Cosmic',
    promptSuffix:
      'rendered as cosmic space art with deep indigo and violet nebulae, swirling galaxies, ' +
      'twinkling stars, and aurora-like energy ribbons. Vast, awe-inspiring scale.',
  },
  nature: {
    name: 'Nature',
    promptSuffix:
      'rendered as a photorealistic nature scene with lush vegetation, golden-hour lighting, ' +
      'mist, and serene natural beauty. Warm, grounding palette with greens and earth tones.',
  },
} as const;

// ---------------------------------------------------------------------------
// Default display duration (ms) for generated frames
// ---------------------------------------------------------------------------

const DEFAULT_DISPLAY_DURATION_MS = 12_000;

// ---------------------------------------------------------------------------
// Image generation
// ---------------------------------------------------------------------------

/**
 * Generate a visualization image by calling Gemini's image generation model.
 *
 * Returns a `data:image/png;base64,...` data URL on success, or `null` if
 * generation fails.
 *
 * @param prompt - Scene description for the image.
 * @param style  - One of the VISUALIZATION_STYLES keys.
 */
export async function generateVisualizationImage(
  prompt: string,
  style: string,
): Promise<string | null> {
  const styleDef =
    VISUALIZATION_STYLES[style as VisualizationState['style']] ??
    VISUALIZATION_STYLES.ethereal;

  const fullPrompt =
    `Meditation visualization: ${prompt}\n\n` +
    `Art direction: ${styleDef.promptSuffix}\n\n` +
    'Requirements: No text, no labels, no watermarks. ' +
    'Peaceful, meditative mood suitable for a guided meditation session. ' +
    'High detail, professional quality, 16:9 landscape composition.';

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: fullPrompt,
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('[visualization-art] Image generation failed:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Gemini function-call parsing
// ---------------------------------------------------------------------------

interface ParsedVisualizationCommand {
  readonly prompt: string;
  readonly style: string;
  readonly narrativeText: string;
}

/**
 * Parse the `args` payload from a Gemini `generate_visualization` function
 * call into strongly-typed fields with safe fallbacks.
 */
export function parseVisualizationCommand(
  args: Record<string, unknown>,
): ParsedVisualizationCommand {
  const prompt =
    typeof args.prompt === 'string' && args.prompt.length > 0
      ? args.prompt
      : 'A serene, peaceful meditation scene';

  const rawStyle = typeof args.style === 'string' ? args.style : 'ethereal';
  const style =
    rawStyle in VISUALIZATION_STYLES ? rawStyle : 'ethereal';

  const narrativeText =
    typeof args.narrativeText === 'string' ? args.narrativeText : '';

  return { prompt, style, narrativeText };
}

// ---------------------------------------------------------------------------
// Frame construction
// ---------------------------------------------------------------------------

let frameCounter = 0;

/**
 * Construct a `VisualizationFrame` from raw generation results.
 *
 * @param imageUrl  - Data URL or blob URL of the generated image.
 * @param prompt    - The prompt that produced the image.
 * @param narrative - Spoken narration text accompanying this visual.
 * @param style     - Art style key used for generation.
 */
export function buildVisualizationFrame(
  imageUrl: string,
  prompt: string,
  narrative: string,
  style: string,
): VisualizationFrame {
  frameCounter += 1;

  return {
    id: `viz-${Date.now()}-${frameCounter}`,
    imageUrl,
    prompt,
    narrativeText: narrative,
    displayDurationMs: DEFAULT_DISPLAY_DURATION_MS,
    transitionType: 'dissolve',
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

/**
 * Create the default VisualizationState for store initialization.
 */
export function createInitialVisualizationState(): VisualizationState {
  return {
    isActive: false,
    currentFrame: null,
    frameQueue: [],
    theme: '',
    style: 'ethereal',
  };
}
