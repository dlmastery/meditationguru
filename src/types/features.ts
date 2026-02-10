/**
 * Feature type definitions for MeditationGuru.
 *
 * Covers all 12 features: emotion-adaptive sessions, pose correction,
 * breathing biofeedback, dream journal, soundscapes, visualization art,
 * guru memory, group sessions, sacred text study, and wellness dashboard.
 */

// ---------------------------------------------------------------------------
// Shared / cross-feature
// ---------------------------------------------------------------------------

/** ISO-8601 string persisted in Firestore; converted to Date at read time. */
export type ISODateString = string;

/** Unique Firestore document identifier. */
export type DocId = string;

/** User-facing severity for guru messages or corrections. */
export type Severity = 'info' | 'gentle' | 'important' | 'critical';

// ---------------------------------------------------------------------------
// Feature 1 – Emotion-Adaptive Sessions
// ---------------------------------------------------------------------------

/** Canonical emotion labels detectable by Gemini 2.5 affective dialog. */
export type EmotionLabel =
  | 'calm'
  | 'anxious'
  | 'stressed'
  | 'sad'
  | 'happy'
  | 'frustrated'
  | 'drowsy'
  | 'energetic'
  | 'neutral';

/** Snapshot of the user's detected emotional state at a moment in time. */
export interface EmotionSnapshot {
  readonly label: EmotionLabel;
  /** 0-1 confidence score from Gemini affective analysis. */
  readonly confidence: number;
  /** Secondary emotion if blended (e.g. "anxious" + "sad"). */
  readonly secondary?: EmotionLabel;
  readonly detectedAt: ISODateString;
}

/** Parameters the session engine adjusts in response to emotion changes. */
export interface SessionAdaptation {
  readonly paceMultiplier: number;       // 0.5 = half speed, 2.0 = double
  readonly breathingPatternId: string;   // override current pattern
  readonly guruToneInstruction: string;  // injected into Gemini system prompt
  readonly musicEnergyLevel: number;     // 0-1
  readonly suggestedTechnique: string;
}

/** Maps detected emotions to session adaptations. */
export interface EmotionAdaptationRule {
  readonly emotion: EmotionLabel;
  readonly minConfidence: number;
  readonly adaptation: SessionAdaptation;
}

// ---------------------------------------------------------------------------
// Feature 2 – Live Pose Correction
// ---------------------------------------------------------------------------

/** A single correction the guru gives for a yoga pose. */
export interface PoseCorrection {
  readonly id: string;
  readonly bodyPart: string;           // e.g. "left hip", "shoulders"
  readonly instruction: string;        // spoken instruction text
  readonly severity: Severity;
  readonly timestamp: ISODateString;
}

/** Aggregate analysis of the user's current pose. */
export interface PoseAnalysis {
  readonly poseId: string;
  readonly poseName: string;
  readonly overallScore: number;       // 0-100
  readonly corrections: readonly PoseCorrection[];
  readonly isAligned: boolean;
  readonly analysisTimestamp: ISODateString;
}

/** Configuration for the pose correction video pipeline. */
export interface PoseCorrectionConfig {
  readonly frameRateHz: number;        // how often to send frames (1-2)
  readonly enableSpokenFeedback: boolean;
  readonly enableVisualOverlay: boolean;
  readonly correctionThreshold: number; // minimum severity to surface
}

// ---------------------------------------------------------------------------
// Feature 3 – Breathing Biofeedback
// ---------------------------------------------------------------------------

/** Real-time measurement of the user's actual breathing from camera. */
export interface BreathingMeasurement {
  readonly phase: 'inhale' | 'exhale' | 'hold' | 'unknown';
  readonly amplitude: number;          // 0-1, relative chest expansion
  readonly cycleDurationMs: number;    // estimated full cycle length
  readonly timestamp: ISODateString;
}

/** Comparison between target pattern and actual breathing. */
export interface BiofeedbackComparison {
  readonly targetPhase: string;
  readonly actualPhase: string;
  readonly syncScore: number;          // 0-100, how well they match
  readonly driftMs: number;            // how far off timing is
  readonly suggestion: string;         // guru coaching text
}

// ---------------------------------------------------------------------------
// Feature 4 – AI Dream Journal
// ---------------------------------------------------------------------------

/** A single dream journal entry. */
export interface DreamEntry {
  readonly id: DocId;
  readonly userId: DocId;
  readonly rawTranscript: string;
  readonly themes: readonly string[];
  readonly emotions: readonly EmotionLabel[];
  readonly symbols: readonly DreamSymbol[];
  readonly analysis: string;
  readonly relatedSessionIds: readonly DocId[];
  readonly createdAt: ISODateString;
}

/** A recurring symbol or motif found across dreams. */
export interface DreamSymbol {
  readonly symbol: string;
  readonly interpretation: string;
  readonly frequency: number;          // how many times seen across entries
  readonly firstSeen: ISODateString;
}

/** Pattern analysis across multiple dream entries. */
export interface DreamPatternAnalysis {
  readonly userId: DocId;
  readonly totalEntries: number;
  readonly recurringThemes: readonly string[];
  readonly emotionalArc: readonly EmotionSnapshot[];
  readonly insights: readonly string[];
  readonly correlationWithPractice: string;
  readonly generatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Feature 5 – Generative Ambient Soundscapes
// ---------------------------------------------------------------------------

/** A single audio layer in a soundscape (e.g. "rain", "thunder"). */
export interface SoundLayer {
  readonly id: string;
  readonly name: string;
  readonly oscillatorType: OscillatorType;
  readonly frequency: number;
  readonly gain: number;               // 0-1
  readonly panPosition: number;        // -1 (left) to 1 (right)
  readonly lfoRate?: number;           // optional modulation
  readonly lfoDepth?: number;
  readonly filterType?: BiquadFilterType;
  readonly filterFrequency?: number;
}

/** Complete soundscape definition. */
export interface Soundscape {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly layers: readonly SoundLayer[];
  readonly masterGain: number;
  readonly reverbLevel: number;        // 0-1
  readonly createdAt: ISODateString;
}

/** Parameters the guru sends via function calling to control the soundscape. */
export interface SoundscapeCommand {
  readonly action: 'add_layer' | 'remove_layer' | 'adjust_layer' | 'set_master' | 'crossfade';
  readonly layerId?: string;
  readonly params: Record<string, number | string>;
}

// ---------------------------------------------------------------------------
// Feature 6 – Real-Time Visualization Art
// ---------------------------------------------------------------------------

/** A single frame in the visualization sequence. */
export interface VisualizationFrame {
  readonly id: string;
  readonly imageUrl: string;
  readonly prompt: string;
  readonly narrativeText: string;
  readonly displayDurationMs: number;
  readonly transitionType: 'fade' | 'dissolve' | 'slide';
  readonly generatedAt: ISODateString;
}

/** State of the visualization pipeline. */
export interface VisualizationState {
  readonly isActive: boolean;
  readonly currentFrame: VisualizationFrame | null;
  readonly frameQueue: readonly VisualizationFrame[];
  readonly theme: string;
  readonly style: 'watercolor' | 'oil-painting' | 'ethereal' | 'cosmic' | 'nature';
}

// ---------------------------------------------------------------------------
// Feature 7 – Guru Memory & Mentorship
// ---------------------------------------------------------------------------

/** A summarized memory of a past session, stored in Firestore. */
export interface SessionMemory {
  readonly id: DocId;
  readonly userId: DocId;
  readonly sessionId: DocId;
  readonly sessionType: 'meditation' | 'yoga' | 'mixed';
  readonly summary: string;
  readonly keyMoments: readonly string[];
  readonly emotionBefore: EmotionLabel;
  readonly emotionAfter: EmotionLabel;
  readonly breathingPatternUsed: string;
  readonly techniquesUsed: readonly string[];
  readonly guruObservations: string;
  readonly durationMinutes: number;
  readonly createdAt: ISODateString;
}

/** The assembled context the guru receives at session start. */
export interface GuruContext {
  readonly userId: DocId;
  readonly totalSessions: number;
  readonly recentMemories: readonly SessionMemory[];
  readonly userGoals: readonly string[];
  readonly experienceLevel: string;
  readonly emotionalTrend: string;
  readonly milestones: readonly string[];
  readonly personalizedGreeting: string;
}

// ---------------------------------------------------------------------------
// Feature 8 – Group Sessions
// ---------------------------------------------------------------------------

/** A participant in a group session. */
export interface GroupParticipant {
  readonly userId: DocId;
  readonly displayName: string;
  readonly photoURL?: string;
  readonly role: 'host' | 'participant';
  readonly cameraEnabled: boolean;
  readonly joinedAt: ISODateString;
}

/** A group session instance. */
export interface GroupSession {
  readonly id: DocId;
  readonly hostId: DocId;
  readonly title: string;
  readonly sessionType: 'meditation' | 'yoga' | 'mixed';
  readonly participants: readonly GroupParticipant[];
  readonly maxParticipants: number;
  readonly isActive: boolean;
  readonly inviteCode: string;
  readonly createdAt: ISODateString;
  readonly startedAt?: ISODateString;
}

/** Individual feedback from the guru to a specific participant. */
export interface ParticipantFeedback {
  readonly participantId: DocId;
  readonly message: string;
  readonly severity: Severity;
  readonly timestamp: ISODateString;
}

// ---------------------------------------------------------------------------
// Feature 9 – Sacred Text Study
// ---------------------------------------------------------------------------

/** A sacred text tradition available for study. */
export interface TextTradition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly texts: readonly SacredText[];
}

/** A specific sacred text or chapter. */
export interface SacredText {
  readonly id: string;
  readonly title: string;
  readonly tradition: string;
  readonly chapters: readonly TextChapter[];
  readonly originalLanguage: string;
}

/** A chapter or section within a sacred text. */
export interface TextChapter {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly verses: readonly TextVerse[];
}

/** A single verse with translation and commentary. */
export interface TextVerse {
  readonly number: number;
  readonly original: string;
  readonly transliteration?: string;
  readonly translation: string;
}

/** A study session entry persisted in Firestore. */
export interface StudySession {
  readonly id: DocId;
  readonly userId: DocId;
  readonly textId: string;
  readonly chapterId: string;
  readonly verseRange: { from: number; to: number };
  readonly discussion: readonly StudyMessage[];
  readonly insights: readonly string[];
  readonly createdAt: ISODateString;
}

/** A single message in a Socratic study dialog. */
export interface StudyMessage {
  readonly role: 'user' | 'guru';
  readonly content: string;
  readonly timestamp: ISODateString;
}

// ---------------------------------------------------------------------------
// Feature 10 – Predictive Wellness Dashboard
// ---------------------------------------------------------------------------

/** Time-series data point for dashboard charts. */
export interface TimeSeriesPoint {
  readonly date: ISODateString;
  readonly value: number;
}

/** Aggregate wellness metrics for a user. */
export interface WellnessMetrics {
  readonly userId: DocId;
  readonly periodStart: ISODateString;
  readonly periodEnd: ISODateString;
  readonly totalSessions: number;
  readonly totalMinutes: number;
  readonly averageMoodBefore: number;  // 1-5 scale
  readonly averageMoodAfter: number;
  readonly moodImprovement: number;    // percentage
  readonly streakDays: number;
  readonly breathingAccuracy: number;  // 0-100 from biofeedback
  readonly topTechniques: readonly string[];
  readonly sessionFrequency: readonly TimeSeriesPoint[];
  readonly moodTrend: readonly TimeSeriesPoint[];
}

/** An AI-generated prediction or recommendation. */
export interface WellnessPrediction {
  readonly type: 'motivation_dip' | 'streak_risk' | 'goal_milestone' | 'technique_suggestion';
  readonly title: string;
  readonly description: string;
  readonly confidence: number;         // 0-1
  readonly suggestedAction: string;
  readonly predictedDate?: ISODateString;
}

/** Complete dashboard data assembled for rendering. */
export interface DashboardData {
  readonly metrics: WellnessMetrics;
  readonly predictions: readonly WellnessPrediction[];
  readonly insights: readonly string[];
  readonly comparisonWithLastPeriod: {
    readonly sessionsChange: number;   // percentage
    readonly minutesChange: number;
    readonly moodChange: number;
  };
}

// ---------------------------------------------------------------------------
// Gemini Function Calling – Tool Declarations
// ---------------------------------------------------------------------------

/** Gemini function call tool definition. */
export interface GeminiFunctionDeclaration {
  readonly name: string;
  readonly description: string;
  readonly parameters: {
    readonly type: 'object';
    readonly properties: Record<string, {
      readonly type: string;
      readonly description: string;
      readonly enum?: readonly string[];
    }>;
    readonly required: readonly string[];
  };
}

/** A function call response from Gemini. */
export interface GeminiFunctionCall {
  readonly name: string;
  readonly args: Record<string, unknown>;
}

/** Response we send back to Gemini after executing a function. */
export interface GeminiFunctionResponse {
  readonly name: string;
  readonly response: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Store Slices (used by Zustand store extensions)
// ---------------------------------------------------------------------------

export interface EmotionSlice {
  currentEmotion: EmotionSnapshot | null;
  emotionHistory: EmotionSnapshot[];
  setCurrentEmotion: (emotion: EmotionSnapshot) => void;
  addEmotionSnapshot: (snapshot: EmotionSnapshot) => void;
}

export interface PoseCorrectionSlice {
  currentPoseAnalysis: PoseAnalysis | null;
  correctionHistory: PoseCorrection[];
  setPoseAnalysis: (analysis: PoseAnalysis) => void;
}

export interface BreathingBiofeedbackSlice {
  currentMeasurement: BreathingMeasurement | null;
  biofeedbackComparison: BiofeedbackComparison | null;
  setBreathingMeasurement: (m: BreathingMeasurement) => void;
  setBiofeedbackComparison: (c: BiofeedbackComparison) => void;
}

export interface DreamJournalSlice {
  dreamEntries: DreamEntry[];
  currentAnalysis: DreamPatternAnalysis | null;
  setDreamEntries: (entries: DreamEntry[]) => void;
  addDreamEntry: (entry: DreamEntry) => void;
  setDreamAnalysis: (analysis: DreamPatternAnalysis) => void;
}

export interface SoundscapeSlice {
  activeSoundscape: Soundscape | null;
  isGenerating: boolean;
  setActiveSoundscape: (s: Soundscape | null) => void;
  setIsGenerating: (g: boolean) => void;
}

export interface VisualizationSlice {
  visualizationState: VisualizationState;
  setVisualizationState: (s: VisualizationState) => void;
}

export interface GuruMemorySlice {
  guruContext: GuruContext | null;
  sessionMemories: SessionMemory[];
  setGuruContext: (ctx: GuruContext) => void;
  setSessionMemories: (m: SessionMemory[]) => void;
}

export interface GroupSessionSlice {
  activeGroupSession: GroupSession | null;
  participantFeedback: ParticipantFeedback[];
  setActiveGroupSession: (s: GroupSession | null) => void;
  addParticipantFeedback: (f: ParticipantFeedback) => void;
}

export interface StudySlice {
  currentStudySession: StudySession | null;
  availableTraditions: TextTradition[];
  setCurrentStudySession: (s: StudySession | null) => void;
  setAvailableTraditions: (t: TextTradition[]) => void;
}

export interface DashboardSlice {
  dashboardData: DashboardData | null;
  isLoadingDashboard: boolean;
  setDashboardData: (d: DashboardData) => void;
  setIsLoadingDashboard: (l: boolean) => void;
}
