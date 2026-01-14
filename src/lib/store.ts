import { create } from 'zustand';
import { User, Session, JourneyProgress, GuruMessage, GuruVoice } from '@/types';

interface AppStore {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;

  // App state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Onboarding
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;
  selectedGoals: string[];
  setSelectedGoals: (goals: string[]) => void;

  // Guru state
  guruVoice: GuruVoice | null;
  setGuruVoice: (voice: GuruVoice) => void;
  isGuruSpeaking: boolean;
  setIsGuruSpeaking: (speaking: boolean) => void;
  guruMessages: GuruMessage[];
  addGuruMessage: (message: GuruMessage) => void;
  clearGuruMessages: () => void;

  // Session state
  currentSession: Session | null;
  setCurrentSession: (session: Session | null) => void;
  sessionActive: boolean;
  setSessionActive: (active: boolean) => void;

  // Media state
  cameraEnabled: boolean;
  setCameraEnabled: (enabled: boolean) => void;
  microphoneEnabled: boolean;
  setMicrophoneEnabled: (enabled: boolean) => void;
  videoStream: MediaStream | null;
  setVideoStream: (stream: MediaStream | null) => void;

  // Journey state
  journey: JourneyProgress | null;
  setJourney: (journey: JourneyProgress | null) => void;

  // UI state
  currentView: string;
  setCurrentView: (view: string) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),

  // App state
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),

  // Onboarding
  onboardingComplete: false,
  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
  selectedGoals: [],
  setSelectedGoals: (selectedGoals) => set({ selectedGoals }),

  // Guru state
  guruVoice: null,
  setGuruVoice: (guruVoice) => set({ guruVoice }),
  isGuruSpeaking: false,
  setIsGuruSpeaking: (isGuruSpeaking) => set({ isGuruSpeaking }),
  guruMessages: [],
  addGuruMessage: (message) =>
    set((state) => ({ guruMessages: [...state.guruMessages, message] })),
  clearGuruMessages: () => set({ guruMessages: [] }),

  // Session state
  currentSession: null,
  setCurrentSession: (currentSession) => set({ currentSession }),
  sessionActive: false,
  setSessionActive: (sessionActive) => set({ sessionActive }),

  // Media state
  cameraEnabled: false,
  setCameraEnabled: (cameraEnabled) => set({ cameraEnabled }),
  microphoneEnabled: false,
  setMicrophoneEnabled: (microphoneEnabled) => set({ microphoneEnabled }),
  videoStream: null,
  setVideoStream: (videoStream) => set({ videoStream }),

  // Journey state
  journey: null,
  setJourney: (journey) => set({ journey }),

  // UI state
  currentView: 'home',
  setCurrentView: (currentView) => set({ currentView }),
  showSettings: false,
  setShowSettings: (showSettings) => set({ showSettings }),
}));
