/**
 * Enhanced Gemini service layer.
 *
 * Extends the core GeminiLiveSession with:
 * - Affective dialog detection (Feature 1)
 * - Function calling / tool use (Features 5, 6)
 * - Structured response parsing with emotion metadata
 * - Video frame analysis helpers (Features 2, 3)
 * - Context injection for guru memory (Feature 7)
 */

import type {
  EmotionLabel,
  EmotionSnapshot,
  GeminiFunctionCall,
  GeminiFunctionDeclaration,
  GeminiFunctionResponse,
  PoseCorrection,
  SoundscapeCommand,
} from '@/types/features';
import { GURU_SYSTEM_PROMPT, GURU_VOICES } from './gemini';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WS_BASE_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

const LIVE_MODEL = 'models/gemini-2.5-flash-live-001';

const VIDEO_FRAME_INTERVAL_MS = 1_000; // 1 FPS for Gemini Live
const AUDIO_SAMPLE_RATE = 16_000;
const AUDIO_BUFFER_SIZE = 4_096;

// ---------------------------------------------------------------------------
// Emotion utilities
// ---------------------------------------------------------------------------

const EMOTION_KEYWORDS: Record<EmotionLabel, readonly string[]> = {
  calm: ['calm', 'peaceful', 'relaxed', 'serene', 'at ease'],
  anxious: ['anxious', 'worried', 'nervous', 'tense', 'uneasy'],
  stressed: ['stressed', 'overwhelmed', 'pressured', 'strained'],
  sad: ['sad', 'down', 'melancholy', 'blue', 'heavy'],
  happy: ['happy', 'joyful', 'content', 'uplifted', 'cheerful'],
  frustrated: ['frustrated', 'irritated', 'annoyed', 'stuck'],
  drowsy: ['sleepy', 'drowsy', 'tired', 'fatigued', 'sluggish'],
  energetic: ['energetic', 'alert', 'vibrant', 'enthusiastic'],
  neutral: ['neutral', 'okay', 'fine', 'normal'],
};

/**
 * Parse an emotion label from a Gemini affective dialog response text.
 * Returns the best-matching emotion and a heuristic confidence.
 */
export function parseEmotionFromText(text: string): EmotionSnapshot {
  const lower = text.toLowerCase();
  let bestLabel: EmotionLabel = 'neutral';
  let bestScore = 0;

  for (const [label, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestLabel = label as EmotionLabel;
    }
  }

  return {
    label: bestLabel,
    confidence: Math.min(bestScore / 3, 1),
    detectedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Function calling tool declarations
// ---------------------------------------------------------------------------

/** Tool declarations registered with Gemini for function calling. */
export const FUNCTION_DECLARATIONS: readonly GeminiFunctionDeclaration[] = [
  {
    name: 'control_soundscape',
    description:
      'Add, remove, or adjust a sound layer in the ambient soundscape. ' +
      'Use this when the user describes a soundscape or when adapting the audio environment.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'The operation to perform on the soundscape.',
          enum: ['add_layer', 'remove_layer', 'adjust_layer', 'set_master', 'crossfade'],
        },
        layerId: {
          type: 'string',
          description: 'Identifier for the sound layer to operate on.',
        },
        layerName: {
          type: 'string',
          description: 'Human-readable name of the sound (e.g., "rain", "thunder").',
        },
        frequency: {
          type: 'string',
          description: 'Base frequency in Hz for the oscillator.',
        },
        gain: {
          type: 'string',
          description: 'Volume level 0.0-1.0.',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'generate_visualization',
    description:
      'Generate a visualization image to accompany a guided meditation. ' +
      'Provide the visual prompt matching the narration.',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Image generation prompt describing the visualization scene.',
        },
        style: {
          type: 'string',
          description: 'Art style for the generated image.',
          enum: ['watercolor', 'oil-painting', 'ethereal', 'cosmic', 'nature'],
        },
        narrativeText: {
          type: 'string',
          description: 'The spoken narration text accompanying this visual.',
        },
      },
      required: ['prompt', 'style'],
    },
  },
  {
    name: 'report_pose_analysis',
    description:
      'Report yoga pose analysis based on what you see in the video. ' +
      'Include corrections and an overall alignment score.',
    parameters: {
      type: 'object',
      properties: {
        poseName: {
          type: 'string',
          description: 'Name of the yoga pose being analyzed.',
        },
        overallScore: {
          type: 'string',
          description: 'Alignment score 0-100.',
        },
        corrections: {
          type: 'string',
          description:
            'JSON array of corrections: [{"bodyPart":"...", "instruction":"...", "severity":"gentle|important|critical"}]',
        },
        isAligned: {
          type: 'string',
          description: '"true" if the pose is well-aligned, "false" otherwise.',
        },
      },
      required: ['poseName', 'overallScore', 'corrections', 'isAligned'],
    },
  },
  {
    name: 'report_breathing_observation',
    description:
      'Report what you observe about the user\'s breathing from the video. ' +
      'Detect their breathing phase and rhythm.',
    parameters: {
      type: 'object',
      properties: {
        phase: {
          type: 'string',
          description: 'Current breathing phase observed.',
          enum: ['inhale', 'exhale', 'hold', 'unknown'],
        },
        amplitude: {
          type: 'string',
          description: 'Relative chest expansion 0.0-1.0.',
        },
        cycleDurationMs: {
          type: 'string',
          description: 'Estimated full breathing cycle duration in milliseconds.',
        },
        suggestion: {
          type: 'string',
          description: 'Coaching suggestion for the user about their breathing.',
        },
      },
      required: ['phase'],
    },
  },
  {
    name: 'report_emotion_observation',
    description:
      'Report the emotional state you detect from the user\'s voice tone and words. ' +
      'This informs session adaptation.',
    parameters: {
      type: 'object',
      properties: {
        emotion: {
          type: 'string',
          description: 'Primary detected emotion.',
          enum: [
            'calm', 'anxious', 'stressed', 'sad', 'happy',
            'frustrated', 'drowsy', 'energetic', 'neutral',
          ],
        },
        confidence: {
          type: 'string',
          description: 'Detection confidence 0.0-1.0.',
        },
        secondaryEmotion: {
          type: 'string',
          description: 'Optional secondary emotion if mixed.',
        },
      },
      required: ['emotion', 'confidence'],
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Enhanced WebSocket message types
// ---------------------------------------------------------------------------

interface ServerContentMessage {
  serverContent?: {
    modelTurn?: {
      parts?: Array<{
        text?: string;
        inlineData?: { mimeType: string; data: string };
        functionCall?: { name: string; args: Record<string, unknown> };
      }>;
    };
    turnComplete?: boolean;
  };
  toolCall?: {
    functionCalls: Array<{ name: string; args: Record<string, unknown> }>;
  };
}

// ---------------------------------------------------------------------------
// Callback interfaces
// ---------------------------------------------------------------------------

export interface EnhancedSessionCallbacks {
  onMessage: (message: string) => void;
  onAudio: (audioData: ArrayBuffer) => void;
  onError: (error: Error) => void;
  onEmotionDetected?: (emotion: EmotionSnapshot) => void;
  onFunctionCall?: (call: GeminiFunctionCall) => void;
  onPoseCorrection?: (corrections: PoseCorrection[]) => void;
}

export interface EnhancedSessionConfig {
  voiceId?: string;
  enableFunctionCalling?: boolean;
  enableAffectiveDialog?: boolean;
  additionalSystemPrompt?: string;
  guruMemoryContext?: string;
}

// ---------------------------------------------------------------------------
// EnhancedGeminiLiveSession
// ---------------------------------------------------------------------------

/**
 * Extended Gemini Live API session with affective dialog, function calling,
 * and structured response parsing.
 *
 * Usage:
 * ```ts
 * const session = new EnhancedGeminiLiveSession(callbacks, config);
 * await session.connect();
 * session.sendText("Guide me through a calming meditation");
 * ```
 */
export class EnhancedGeminiLiveSession {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private videoStream: MediaStream | null = null;
  private videoIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly callbacks: EnhancedSessionCallbacks;
  private readonly config: Required<EnhancedSessionConfig>;

  constructor(
    callbacks: EnhancedSessionCallbacks,
    config: EnhancedSessionConfig = {},
  ) {
    this.callbacks = callbacks;
    this.config = {
      voiceId: config.voiceId ?? 'Kore',
      enableFunctionCalling: config.enableFunctionCalling ?? true,
      enableAffectiveDialog: config.enableAffectiveDialog ?? true,
      additionalSystemPrompt: config.additionalSystemPrompt ?? '',
      guruMemoryContext: config.guruMemoryContext ?? '',
    };
  }

  // -------------------------------------------------------------------------
  // Connection lifecycle
  // -------------------------------------------------------------------------

  async connect(): Promise<void> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      this.callbacks.onError(new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set'));
      return;
    }

    const wsUrl = `${WS_BASE_URL}?key=${apiKey}`;

    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.sendSetup();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = () => {
          const err = new Error('WebSocket connection to Gemini Live API failed');
          this.callbacks.onError(err);
          reject(err);
        };

        this.ws.onclose = () => {
          this.cleanup();
        };
      } catch (error) {
        this.callbacks.onError(error as Error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // -------------------------------------------------------------------------
  // Setup configuration
  // -------------------------------------------------------------------------

  private sendSetup(): void {
    if (!this.ws) return;

    const systemParts: Array<{ text: string }> = [
      { text: GURU_SYSTEM_PROMPT },
    ];

    if (this.config.enableAffectiveDialog) {
      systemParts.push({
        text:
          'IMPORTANT: You have affective dialog capabilities. Pay close attention to the ' +
          "user's vocal tone, pace, and emotional cues. When you detect a shift in their " +
          'emotional state, call the report_emotion_observation function. Adapt your tone ' +
          "and pacing to match or soothe their emotional state. If they sound anxious, slow " +
          'down. If drowsy, add gentle energy.',
      });
    }

    if (this.config.guruMemoryContext) {
      systemParts.push({
        text:
          'CONTEXT FROM PREVIOUS SESSIONS:\n' +
          this.config.guruMemoryContext +
          '\nUse this context to personalize your guidance. Reference past sessions naturally.',
      });
    }

    if (this.config.additionalSystemPrompt) {
      systemParts.push({ text: this.config.additionalSystemPrompt });
    }

    const setup: Record<string, unknown> = {
      setup: {
        model: LIVE_MODEL,
        generationConfig: {
          responseModalities: ['AUDIO', 'TEXT'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.config.voiceId,
              },
            },
          },
        },
        systemInstruction: {
          parts: systemParts,
        },
        ...(this.config.enableFunctionCalling
          ? {
              tools: [
                {
                  functionDeclarations: FUNCTION_DECLARATIONS,
                },
              ],
            }
          : {}),
      },
    };

    this.ws!.send(JSON.stringify(setup));
  }

  // -------------------------------------------------------------------------
  // Message handling
  // -------------------------------------------------------------------------

  private handleMessage(data: string | ArrayBuffer): void {
    if (typeof data !== 'string') return;

    let message: ServerContentMessage;
    try {
      message = JSON.parse(data) as ServerContentMessage;
    } catch {
      return;
    }

    // Handle tool calls
    if (message.toolCall?.functionCalls) {
      for (const call of message.toolCall.functionCalls) {
        this.handleFunctionCall(call);
      }
      return;
    }

    // Handle model turn content
    const parts = message.serverContent?.modelTurn?.parts;
    if (!parts) return;

    for (const part of parts) {
      // Function call in model turn
      if (part.functionCall) {
        this.handleFunctionCall(part.functionCall);
        continue;
      }

      // Text response
      if (part.text) {
        this.callbacks.onMessage(part.text);

        // If affective dialog enabled, attempt emotion parsing from text
        if (this.config.enableAffectiveDialog && this.callbacks.onEmotionDetected) {
          const emotion = parseEmotionFromText(part.text);
          if (emotion.confidence > 0.3) {
            this.callbacks.onEmotionDetected(emotion);
          }
        }
      }

      // Audio response
      if (part.inlineData?.data) {
        try {
          const binaryStr = atob(part.inlineData.data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          this.callbacks.onAudio(bytes.buffer);
        } catch {
          // Silently ignore malformed audio data
        }
      }
    }
  }

  private handleFunctionCall(call: { name: string; args: Record<string, unknown> }): void {
    const functionCall: GeminiFunctionCall = {
      name: call.name,
      args: call.args,
    };

    this.callbacks.onFunctionCall?.(functionCall);

    // Handle specific function calls internally
    switch (call.name) {
      case 'report_emotion_observation': {
        const emotion: EmotionSnapshot = {
          label: (call.args.emotion as EmotionLabel) ?? 'neutral',
          confidence: parseFloat(call.args.confidence as string) || 0.5,
          secondary: call.args.secondaryEmotion as EmotionLabel | undefined,
          detectedAt: new Date().toISOString(),
        };
        this.callbacks.onEmotionDetected?.(emotion);
        // Acknowledge the function call back to Gemini
        this.sendFunctionResponse(call.name, { acknowledged: true });
        break;
      }
      case 'report_pose_analysis': {
        let corrections: PoseCorrection[] = [];
        try {
          const raw = JSON.parse(call.args.corrections as string);
          corrections = (raw as Array<Record<string, string>>).map((c, i) => ({
            id: `correction-${Date.now()}-${i}`,
            bodyPart: c.bodyPart ?? '',
            instruction: c.instruction ?? '',
            severity: (c.severity as PoseCorrection['severity']) ?? 'gentle',
            timestamp: new Date().toISOString(),
          }));
        } catch {
          // corrections parse failed, leave empty
        }
        this.callbacks.onPoseCorrection?.(corrections);
        this.sendFunctionResponse(call.name, { acknowledged: true });
        break;
      }
      default:
        // For other function calls (soundscape, visualization),
        // the callback handler deals with them.
        this.sendFunctionResponse(call.name, { acknowledged: true });
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Sending messages
  // -------------------------------------------------------------------------

  sendText(text: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    this.ws.send(
      JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text }] }],
          turnComplete: true,
        },
      }),
    );
  }

  sendFunctionResponse(name: string, response: Record<string, unknown>): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    this.ws.send(
      JSON.stringify({
        toolResponse: {
          functionResponses: [{ name, response }],
        },
      }),
    );
  }

  // -------------------------------------------------------------------------
  // Audio streaming
  // -------------------------------------------------------------------------

  async startAudioStream(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: AUDIO_SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.audioContext = new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const processor = this.audioContext.createScriptProcessor(AUDIO_BUFFER_SIZE, 1, 1);

      processor.onaudioprocess = (e) => {
        if (this.ws?.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = floatTo16BitPCM(inputData);
        const base64Audio = arrayBufferToBase64(pcmData);

        this.ws.send(
          JSON.stringify({
            realtimeInput: {
              mediaChunks: [
                { mimeType: `audio/pcm;rate=${AUDIO_SAMPLE_RATE}`, data: base64Audio },
              ],
            },
          }),
        );
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);
    } catch (error) {
      this.callbacks.onError(error as Error);
    }
  }

  // -------------------------------------------------------------------------
  // Video streaming
  // -------------------------------------------------------------------------

  async startVideoStream(): Promise<MediaStream | null> {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });

      const video = document.createElement('video');
      video.srcObject = this.videoStream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      this.videoIntervalId = setInterval(() => {
        if (this.ws?.readyState !== WebSocket.OPEN || !ctx) return;

        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.7);
        const base64Image = imageData.split(',')[1];

        this.ws.send(
          JSON.stringify({
            realtimeInput: {
              mediaChunks: [{ mimeType: 'image/jpeg', data: base64Image }],
            },
          }),
        );
      }, VIDEO_FRAME_INTERVAL_MS);

      return this.videoStream;
    } catch (error) {
      this.callbacks.onError(error as Error);
      return null;
    }
  }

  stopVideoStream(): void {
    if (this.videoIntervalId) {
      clearInterval(this.videoIntervalId);
      this.videoIntervalId = null;
    }
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((t) => t.stop());
      this.videoStream = null;
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private cleanup(): void {
    this.stopVideoStream();
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Pure utility functions
// ---------------------------------------------------------------------------

function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
