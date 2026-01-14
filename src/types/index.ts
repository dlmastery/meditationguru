// User Types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: Date;
  lastSessionAt: Date;
  preferences: UserPreferences;
  onboarding: OnboardingStatus;
  subscription: SubscriptionStatus;
}

export interface UserPreferences {
  guruVoice: string;
  preferredDuration: number;
  reminderTimes: string[];
  primaryGoals: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface OnboardingStatus {
  completed: boolean;
  selectedOrbs: string[];
  completedAt?: Date;
}

export interface SubscriptionStatus {
  isDonor: boolean;
  donationTotal: number;
  lastDonation?: Date;
}

// Journey Types
export interface JourneyProgress {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  stars: Star[];
  meditationMinutes: number;
  yogaMinutes: number;
  posesLearned: string[];
}

export interface Star {
  id: string;
  type: 'session' | 'streak' | 'milestone';
  label: string;
  earnedAt: Date;
  position: { x: number; y: number; z: number };
  unlocked: boolean;
}

// Session Types
export interface Session {
  id: string;
  type: 'meditation' | 'yoga' | 'mixed';
  startedAt: Date;
  endedAt?: Date;
  duration: number;
  mood: {
    before: string;
    after?: string;
  };
  goals: string[];
  techniques: string[];
  guruNotes?: string;
  yogaPoses?: string[];
  saved: boolean;
  rating?: number;
}

// Routine Types
export interface Routine {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  type: 'meditation' | 'yoga' | 'mixed';
  estimatedDuration: number;
  goals: string[];
  prompt: string;
  timesUsed: number;
  lastUsedAt?: Date;
}

// Plan Types
export interface Plan {
  id: string;
  name: string;
  createdAt: Date;
  goal: string;
  totalDays: number;
  currentDay: number;
  schedule: PlanDay[];
  guruRecommendation: string;
}

export interface PlanDay {
  day: number;
  type: 'meditation' | 'yoga' | 'rest';
  focus: string;
  duration: number;
  completed: boolean;
  completedAt?: Date;
}

// Guru Types
export interface GuruMessage {
  id: string;
  role: 'user' | 'guru';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface GuruVoice {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  tone: 'calm' | 'energetic' | 'wise' | 'gentle';
}

// Goal Orbs for Onboarding
export interface GoalOrb {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  position: { x: number; y: number; z: number };
}

// App State
export interface AppState {
  isLoading: boolean;
  currentView: 'home' | 'session' | 'journey' | 'search' | 'routines' | 'settings' | 'onboarding';
  sessionActive: boolean;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
}

// Gemini Types
export interface GeminiConfig {
  model: string;
  systemInstruction: string;
  voiceConfig?: {
    voiceName: string;
  };
}

export interface LiveSessionConfig {
  videoEnabled: boolean;
  audioEnabled: boolean;
  sessionType: 'meditation' | 'yoga' | 'conversation';
}
