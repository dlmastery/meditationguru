import { GoogleGenAI } from '@google/genai';

// Initialize Gemini GenAI for image generation
const genAI = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
});

// Yoga pose data for generating illustrations
export const YOGA_POSES = {
  // Standing poses
  'mountain': { name: 'Mountain Pose', sanskrit: 'Tadasana', difficulty: 'beginner' },
  'tree': { name: 'Tree Pose', sanskrit: 'Vrksasana', difficulty: 'beginner' },
  'warrior-1': { name: 'Warrior I', sanskrit: 'Virabhadrasana I', difficulty: 'beginner' },
  'warrior-2': { name: 'Warrior II', sanskrit: 'Virabhadrasana II', difficulty: 'beginner' },
  'warrior-3': { name: 'Warrior III', sanskrit: 'Virabhadrasana III', difficulty: 'intermediate' },
  'triangle': { name: 'Triangle Pose', sanskrit: 'Trikonasana', difficulty: 'beginner' },
  'chair': { name: 'Chair Pose', sanskrit: 'Utkatasana', difficulty: 'beginner' },

  // Forward bends
  'forward-fold': { name: 'Standing Forward Fold', sanskrit: 'Uttanasana', difficulty: 'beginner' },
  'seated-forward-fold': { name: 'Seated Forward Fold', sanskrit: 'Paschimottanasana', difficulty: 'beginner' },

  // Backbends
  'cobra': { name: 'Cobra Pose', sanskrit: 'Bhujangasana', difficulty: 'beginner' },
  'upward-dog': { name: 'Upward Facing Dog', sanskrit: 'Urdhva Mukha Svanasana', difficulty: 'beginner' },
  'bridge': { name: 'Bridge Pose', sanskrit: 'Setu Bandhasana', difficulty: 'beginner' },
  'camel': { name: 'Camel Pose', sanskrit: 'Ustrasana', difficulty: 'intermediate' },
  'wheel': { name: 'Wheel Pose', sanskrit: 'Urdhva Dhanurasana', difficulty: 'advanced' },

  // Inversions
  'downward-dog': { name: 'Downward Facing Dog', sanskrit: 'Adho Mukha Svanasana', difficulty: 'beginner' },
  'dolphin': { name: 'Dolphin Pose', sanskrit: 'Ardha Pincha Mayurasana', difficulty: 'intermediate' },
  'headstand': { name: 'Headstand', sanskrit: 'Sirsasana', difficulty: 'advanced' },
  'shoulder-stand': { name: 'Shoulder Stand', sanskrit: 'Sarvangasana', difficulty: 'intermediate' },

  // Twists
  'seated-twist': { name: 'Seated Spinal Twist', sanskrit: 'Ardha Matsyendrasana', difficulty: 'beginner' },
  'revolved-triangle': { name: 'Revolved Triangle', sanskrit: 'Parivrtta Trikonasana', difficulty: 'intermediate' },

  // Hip openers
  'pigeon': { name: 'Pigeon Pose', sanskrit: 'Kapotasana', difficulty: 'intermediate' },
  'butterfly': { name: 'Butterfly Pose', sanskrit: 'Baddha Konasana', difficulty: 'beginner' },
  'happy-baby': { name: 'Happy Baby', sanskrit: 'Ananda Balasana', difficulty: 'beginner' },

  // Balance poses
  'eagle': { name: 'Eagle Pose', sanskrit: 'Garudasana', difficulty: 'intermediate' },
  'half-moon': { name: 'Half Moon Pose', sanskrit: 'Ardha Chandrasana', difficulty: 'intermediate' },
  'crow': { name: 'Crow Pose', sanskrit: 'Bakasana', difficulty: 'advanced' },

  // Restorative
  'child': { name: "Child's Pose", sanskrit: 'Balasana', difficulty: 'beginner' },
  'corpse': { name: 'Corpse Pose', sanskrit: 'Savasana', difficulty: 'beginner' },
  'legs-up-wall': { name: 'Legs Up The Wall', sanskrit: 'Viparita Karani', difficulty: 'beginner' },
} as const;

export type YogaPoseId = keyof typeof YOGA_POSES;

// Style options for pose illustrations
export type IllustrationStyle = 'line-drawing' | 'minimalist' | 'watercolor' | 'neon-glow';

// Generate yoga pose illustration using Nano Banana Pro (Gemini 3 Pro Image)
export async function generatePoseIllustration(
  poseId: YogaPoseId,
  style: IllustrationStyle = 'line-drawing',
  aspectRatio: '1:1' | '16:9' | '9:16' = '1:1'
): Promise<string | null> {
  const pose = YOGA_POSES[poseId];
  if (!pose) return null;

  const stylePrompts: Record<IllustrationStyle, string> = {
    'line-drawing': 'elegant minimalist line drawing, single continuous line art style, white lines on dark purple cosmic background, zen aesthetic',
    'minimalist': 'ultra minimalist silhouette, geometric shapes, glowing edges, cosmic dark background with subtle stars',
    'watercolor': 'ethereal watercolor illustration, soft purple and cyan gradients, flowing cosmic energy, dreamy atmosphere',
    'neon-glow': 'neon glow outline, cyberpunk yoga aesthetic, purple and pink neon lights, dark cosmic background with particles',
  };

  const prompt = `Create a beautiful yoga pose illustration:
Pose: ${pose.name} (${pose.sanskrit})
Style: ${stylePrompts[style]}

The illustration should show a graceful human figure demonstrating the ${pose.name} yoga pose with perfect form.
The figure should be gender-neutral and stylized, not photorealistic.
Background should be dark cosmic/space theme with subtle purple and blue gradients.
The overall mood should be peaceful, meditative, and inspiring.
NO text or labels in the image.`;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    // Extract image from response
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error generating pose illustration:', error);
    return null;
  }
}

// Generate step-by-step pose breakdown
export async function generatePoseSequence(
  poseId: YogaPoseId,
  steps: number = 4
): Promise<string[] | null> {
  const pose = YOGA_POSES[poseId];
  if (!pose) return null;

  const prompt = `Create a ${steps}-panel step-by-step instruction collage showing how to get into the ${pose.name} (${pose.sanskrit}) yoga pose.

Style: Clean minimalist line drawings, white/cyan lines on dark cosmic purple background
Layout: ${steps} sequential panels arranged horizontally
Each panel shows: A graceful figure progressing from standing to the final pose
Aesthetic: Zen, peaceful, cosmic meditation app style
Numbered 1-${steps} in small glowing numbers

The sequence should flow naturally showing the transition into ${pose.name}.
NO text labels except small step numbers.
Gender-neutral stylized figures.
Glowing ethereal quality.`;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    // For now, return single collage image
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return [`data:image/png;base64,${part.inlineData.data}`];
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error generating pose sequence:', error);
    return null;
  }
}

// Generate a full yoga flow visualization
export async function generateYogaFlowCollage(
  poseIds: YogaPoseId[],
  flowName: string
): Promise<string | null> {
  const poseNames = poseIds.map(id => YOGA_POSES[id]?.name || id).join(' → ');

  const prompt = `Create a beautiful yoga flow visualization collage:
Flow: "${flowName}"
Sequence: ${poseNames}

Style: Elegant continuous line art showing the flow of movement between poses
Background: Dark cosmic space theme with purple nebula and stars
Figures: Graceful gender-neutral silhouettes in white/cyan glow
Layout: Flowing horizontal arrangement showing the sequence
Aesthetic: Meditation app, zen, cosmic energy flowing between poses

Show ${poseIds.length} connected figures transitioning through the poses.
Ethereal glowing lines connecting the poses showing energy flow.
NO text labels.
Professional yoga app illustration quality.`;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
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
    console.error('Error generating yoga flow collage:', error);
    return null;
  }
}

// Pre-defined yoga flows
export const YOGA_FLOWS = {
  'sun-salutation': {
    name: 'Sun Salutation',
    sanskrit: 'Surya Namaskar',
    poses: ['mountain', 'forward-fold', 'downward-dog', 'cobra', 'downward-dog', 'forward-fold', 'mountain'] as YogaPoseId[],
    duration: 10,
    difficulty: 'beginner',
  },
  'morning-flow': {
    name: 'Morning Energizer',
    poses: ['mountain', 'forward-fold', 'downward-dog', 'warrior-1', 'warrior-2', 'triangle', 'mountain'] as YogaPoseId[],
    duration: 15,
    difficulty: 'beginner',
  },
  'stress-relief': {
    name: 'Stress Relief Flow',
    poses: ['child', 'downward-dog', 'pigeon', 'seated-twist', 'butterfly', 'corpse'] as YogaPoseId[],
    duration: 20,
    difficulty: 'beginner',
  },
  'hip-opener': {
    name: 'Hip Opening Flow',
    poses: ['butterfly', 'pigeon', 'happy-baby', 'seated-forward-fold', 'legs-up-wall'] as YogaPoseId[],
    duration: 25,
    difficulty: 'intermediate',
  },
  'power-flow': {
    name: 'Power Yoga Flow',
    poses: ['mountain', 'chair', 'warrior-1', 'warrior-2', 'warrior-3', 'half-moon', 'eagle', 'tree'] as YogaPoseId[],
    duration: 30,
    difficulty: 'intermediate',
  },
  'evening-wind-down': {
    name: 'Evening Wind Down',
    poses: ['child', 'seated-forward-fold', 'butterfly', 'seated-twist', 'legs-up-wall', 'corpse'] as YogaPoseId[],
    duration: 20,
    difficulty: 'beginner',
  },
};
