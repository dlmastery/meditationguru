import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Gemini 3.0 Flash Preview for text tasks (search, planning, etc.)
export const flashModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',  // Using latest available, update to 3.0-flash-preview when available
});

// System prompt for the AI Guru
export const GURU_SYSTEM_PROMPT = `You are a wise, compassionate AI meditation and yoga guru. You exist in a cosmic realm, guiding seekers on their journey to inner peace and physical wellness.

Your personality:
- Warm, patient, and deeply caring
- Wise but never condescending
- Speaks with gentle authority
- Uses occasional Sanskrit terms naturally (namaste, asana, pranayama)
- Adapts your energy - calm for meditation, more energetic for power yoga

Your capabilities:
- Guide personalized meditation sessions in real-time
- Teach and correct yoga poses by observing the user via video
- Remember the user's journey, goals, and preferences
- Adapt session length and intensity based on user's energy
- Provide goal-based recommendations

When guiding meditation:
- Use calming, rhythmic speech
- Include breathing cues naturally
- Paint vivid mental imagery
- Allow moments of silence

When teaching yoga:
- Give clear, concise pose instructions
- Provide real-time corrections based on what you observe
- Offer modifications for different skill levels
- Encourage without pushing too hard

Always remember: You are not just an app feature - you are their personal guide on a transformative journey.`;

// Voice options available for the guru
export const GURU_VOICES = [
  { id: 'Puck', name: 'Sage (Male)', description: 'Deep, wise, and calming', gender: 'male', tone: 'wise' },
  { id: 'Charon', name: 'Ocean (Male)', description: 'Gentle and flowing like water', gender: 'male', tone: 'gentle' },
  { id: 'Kore', name: 'Aurora (Female)', description: 'Warm and nurturing', gender: 'female', tone: 'calm' },
  { id: 'Fenrir', name: 'Mountain (Male)', description: 'Strong and grounding', gender: 'male', tone: 'energetic' },
  { id: 'Aoede', name: 'Lotus (Female)', description: 'Soft and meditative', gender: 'female', tone: 'calm' },
  { id: 'Leda', name: 'River (Female)', description: 'Peaceful and steady', gender: 'female', tone: 'gentle' },
] as const;

// Goal categories for search and recommendations
export const GOAL_CATEGORIES = [
  { id: 'stress', label: 'Reduce Stress', icon: '✨', color: '#e94560' },
  { id: 'sleep', label: 'Better Sleep', icon: '🌙', color: '#7b68ee' },
  { id: 'flexibility', label: 'Flexibility', icon: '🧘', color: '#4ecdc4' },
  { id: 'focus', label: 'Improve Focus', icon: '🎯', color: '#f5c518' },
  { id: 'strength', label: 'Build Strength', icon: '💪', color: '#ff6b6b' },
  { id: 'anxiety', label: 'Calm Anxiety', icon: '🌊', color: '#45b7d1' },
  { id: 'energy', label: 'Boost Energy', icon: '⚡', color: '#ffd93d' },
  { id: 'self-love', label: 'Self Love', icon: '❤️', color: '#ff8fab' },
];

// Meditation techniques
export const MEDITATION_TECHNIQUES = [
  'breath-awareness',
  'body-scan',
  'loving-kindness',
  'visualization',
  'mantra',
  'mindfulness',
  'yoga-nidra',
  'chakra',
  'transcendental',
  'walking',
];

// Yoga styles
export const YOGA_STYLES = [
  'hatha',
  'vinyasa',
  'yin',
  'restorative',
  'ashtanga',
  'kundalini',
  'power',
  'prenatal',
  'chair',
];

// Parse natural language goals using Gemini
export async function parseGoalIntent(userInput: string): Promise<{
  goals: string[];
  suggestedType: 'meditation' | 'yoga' | 'mixed';
  suggestedDuration: number;
  techniques: string[];
}> {
  const prompt = `Analyze this user request for a meditation/yoga app and extract structured information:

User said: "${userInput}"

Respond in JSON format only:
{
  "goals": ["array of goal IDs from: stress, sleep, flexibility, focus, strength, anxiety, energy, self-love"],
  "suggestedType": "meditation" or "yoga" or "mixed",
  "suggestedDuration": number in minutes (5-60),
  "techniques": ["suggested techniques based on goals"]
}`;

  try {
    const result = await flashModel.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error parsing goal intent:', error);
  }

  // Default fallback
  return {
    goals: ['stress'],
    suggestedType: 'meditation',
    suggestedDuration: 10,
    techniques: ['breath-awareness'],
  };
}

// Generate a personalized plan using Gemini
export async function generatePlan(
  goal: string,
  experienceLevel: string,
  availableDays: number
): Promise<{
  name: string;
  schedule: Array<{
    day: number;
    type: 'meditation' | 'yoga' | 'rest';
    focus: string;
    duration: number;
  }>;
  recommendation: string;
}> {
  const prompt = `Create a ${availableDays}-day wellness plan for someone who wants to: ${goal}

Experience level: ${experienceLevel}

Respond in JSON format only:
{
  "name": "catchy plan name",
  "schedule": [
    { "day": 1, "type": "meditation" or "yoga" or "rest", "focus": "what to focus on", "duration": minutes }
  ],
  "recommendation": "brief explanation why this plan works"
}`;

  try {
    const result = await flashModel.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error generating plan:', error);
  }

  // Default fallback
  return {
    name: 'Your Wellness Journey',
    schedule: [
      { day: 1, type: 'meditation', focus: 'Introduction to breathing', duration: 10 },
    ],
    recommendation: 'Start slow and build consistency.',
  };
}

// WebSocket connection for Gemini Live API
export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private onMessage: (message: string) => void;
  private onAudio: (audioData: ArrayBuffer) => void;
  private onError: (error: Error) => void;

  constructor(
    onMessage: (message: string) => void,
    onAudio: (audioData: ArrayBuffer) => void,
    onError: (error: Error) => void
  ) {
    this.onMessage = onMessage;
    this.onAudio = onAudio;
    this.onError = onError;
  }

  async connect(voiceId: string = 'Kore') {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      this.onError(new Error('Gemini API key not configured'));
      return;
    }

    // For Gemini Live API, we use a WebSocket connection
    // Note: This is a simplified implementation. In production, you'd use
    // the official Gemini Live API endpoint with proper authentication
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Send initial configuration
        this.sendConfig(voiceId);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        this.onError(new Error('WebSocket connection failed'));
      };

      this.ws.onclose = () => {
        console.log('Gemini Live session closed');
      };
    } catch (error) {
      this.onError(error as Error);
    }
  }

  private sendConfig(voiceId: string) {
    if (!this.ws) return;

    const config = {
      setup: {
        model: 'models/gemini-2.0-flash-live-001',
        generationConfig: {
          responseModalities: ['AUDIO', 'TEXT'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceId
              }
            }
          }
        },
        systemInstruction: {
          parts: [{ text: GURU_SYSTEM_PROMPT }]
        }
      }
    };

    this.ws.send(JSON.stringify(config));
  }

  private handleMessage(data: string | ArrayBuffer) {
    if (typeof data === 'string') {
      try {
        const message = JSON.parse(data);
        if (message.serverContent?.modelTurn?.parts) {
          for (const part of message.serverContent.modelTurn.parts) {
            if (part.text) {
              this.onMessage(part.text);
            }
            if (part.inlineData?.data) {
              // Decode base64 audio
              const audioData = Uint8Array.from(atob(part.inlineData.data), c => c.charCodeAt(0));
              this.onAudio(audioData.buffer);
            }
          }
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    }
  }

  async startAudioStream() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = this.floatTo16BitPCM(inputData);
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData)));

          this.ws.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [{
                mimeType: 'audio/pcm;rate=16000',
                data: base64Audio
              }]
            }
          }));
        }
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);
    } catch (error) {
      this.onError(error as Error);
    }
  }

  async startVideoStream() {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });

      // Create video element to capture frames
      const video = document.createElement('video');
      video.srcObject = videoStream;
      video.play();

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      // Send video frames at 1 FPS (Gemini Live API rate)
      setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN && ctx) {
          ctx.drawImage(video, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          const base64Image = imageData.split(',')[1];

          this.ws.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [{
                mimeType: 'image/jpeg',
                data: base64Image
              }]
            }
          }));
        }
      }, 1000);

      return videoStream;
    } catch (error) {
      this.onError(error as Error);
      return null;
    }
  }

  sendText(text: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        clientContent: {
          turns: [{
            role: 'user',
            parts: [{ text }]
          }],
          turnComplete: true
        }
      }));
    }
  }

  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  }

  disconnect() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}
