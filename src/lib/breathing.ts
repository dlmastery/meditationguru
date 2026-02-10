export interface BreathPhase {
  name: 'inhale' | 'hold' | 'exhale' | 'rest';
  duration: number; // seconds
  label: string; // display text
}

export interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  phases: BreathPhase[];
  cycleDuration: number; // total seconds per cycle
  recommendedRounds: number;
  benefits: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: string; // emoji
}

export const BREATHING_PATTERNS: Record<string, BreathingPattern> = {
  'relaxing-478': {
    id: 'relaxing-478',
    name: '4-7-8 Relaxing Breath',
    description:
      'A natural tranquilizer for the nervous system. Inhale for 4 seconds, hold for 7, and exhale slowly for 8.',
    phases: [
      { name: 'inhale', duration: 4, label: 'Breathe In' },
      { name: 'hold', duration: 7, label: 'Hold' },
      { name: 'exhale', duration: 8, label: 'Breathe Out' },
    ],
    cycleDuration: 19,
    recommendedRounds: 4,
    benefits: ['Reduces anxiety', 'Promotes sleep', 'Calms the nervous system'],
    difficulty: 'beginner',
    icon: '\u{1F319}',
  },
  'box-breathing': {
    id: 'box-breathing',
    name: 'Box Breathing',
    description:
      'Equal-ratio breathing used by Navy SEALs. Four equal phases create a sense of calm control and focus.',
    phases: [
      { name: 'inhale', duration: 4, label: 'Breathe In' },
      { name: 'hold', duration: 4, label: 'Hold' },
      { name: 'exhale', duration: 4, label: 'Breathe Out' },
      { name: 'hold', duration: 4, label: 'Hold' },
    ],
    cycleDuration: 16,
    recommendedRounds: 4,
    benefits: ['Improves focus', 'Reduces stress', 'Enhances performance'],
    difficulty: 'beginner',
    icon: '\u{1F7E6}',
  },
  'deep-belly': {
    id: 'deep-belly',
    name: 'Deep Belly Breathing',
    description:
      'Diaphragmatic breathing with gentle pauses. Engages the belly to promote deep, nourishing breaths.',
    phases: [
      { name: 'inhale', duration: 6, label: 'Breathe In Deeply' },
      { name: 'rest', duration: 2, label: 'Rest' },
      { name: 'exhale', duration: 6, label: 'Release Slowly' },
      { name: 'rest', duration: 2, label: 'Rest' },
    ],
    cycleDuration: 16,
    recommendedRounds: 6,
    benefits: ['Relieves stress', 'Lowers blood pressure', 'Strengthens diaphragm'],
    difficulty: 'beginner',
    icon: '\u{1F30A}',
  },
  'energizing': {
    id: 'energizing',
    name: 'Energizing Breath',
    description:
      'Quick, rhythmic breathing to increase alertness and energy. Great as a morning wake-up or afternoon pick-me-up.',
    phases: [
      { name: 'inhale', duration: 2, label: 'Quick Inhale' },
      { name: 'hold', duration: 2, label: 'Hold' },
      { name: 'exhale', duration: 2, label: 'Quick Exhale' },
      { name: 'rest', duration: 1, label: 'Rest' },
    ],
    cycleDuration: 7,
    recommendedRounds: 10,
    benefits: ['Boosts energy', 'Increases alertness', 'Stimulates circulation'],
    difficulty: 'beginner',
    icon: '\u{26A1}',
  },
  'calm': {
    id: 'calm',
    name: 'Calm Breath',
    description:
      'The simplest breathing pattern. Equal inhale and exhale with no holds, perfect for beginners or quick calm-downs.',
    phases: [
      { name: 'inhale', duration: 5, label: 'Breathe In' },
      { name: 'exhale', duration: 5, label: 'Breathe Out' },
    ],
    cycleDuration: 10,
    recommendedRounds: 6,
    benefits: ['Easy to learn', 'Promotes calm', 'Reduces heart rate'],
    difficulty: 'beginner',
    icon: '\u{1F54A}\u{FE0F}',
  },
  'ratio-2-1': {
    id: 'ratio-2-1',
    name: '2:1 Ratio Breathing',
    description:
      'Exhale twice as long as you inhale. The extended exhale activates the parasympathetic nervous system for deep relaxation.',
    phases: [
      { name: 'inhale', duration: 4, label: 'Breathe In' },
      { name: 'rest', duration: 1, label: 'Pause' },
      { name: 'exhale', duration: 8, label: 'Long Exhale' },
      { name: 'rest', duration: 1, label: 'Pause' },
    ],
    cycleDuration: 14,
    recommendedRounds: 6,
    benefits: ['Deep relaxation', 'Activates rest response', 'Calms the mind'],
    difficulty: 'intermediate',
    icon: '\u{1F33F}',
  },
  'alternate-nostril': {
    id: 'alternate-nostril',
    name: 'Alternate Nostril Rhythm',
    description:
      'A rhythmic pattern inspired by Nadi Shodhana pranayama. Balances the left and right hemispheres of the brain.',
    phases: [
      { name: 'inhale', duration: 4, label: 'Inhale Left' },
      { name: 'hold', duration: 4, label: 'Hold' },
      { name: 'exhale', duration: 8, label: 'Exhale Right' },
      { name: 'hold', duration: 4, label: 'Hold' },
    ],
    cycleDuration: 20,
    recommendedRounds: 5,
    benefits: ['Balances energy', 'Clears the mind', 'Harmonizes nervous system'],
    difficulty: 'intermediate',
    icon: '\u{2696}\u{FE0F}',
  },
  'wim-hof': {
    id: 'wim-hof',
    name: 'Wim Hof Style',
    description:
      'Rapid, powerful breathing to flood the body with oxygen. Based on the Wim Hof Method for energy and resilience.',
    phases: [
      { name: 'inhale', duration: 2, label: 'Power Inhale' },
      { name: 'exhale', duration: 1, label: 'Let Go' },
    ],
    cycleDuration: 3,
    recommendedRounds: 30,
    benefits: ['Increases energy', 'Builds resilience', 'Boosts immune response'],
    difficulty: 'advanced',
    icon: '\u{1F525}',
  },
  'ujjayi': {
    id: 'ujjayi',
    name: 'Ujjayi (Ocean Breath)',
    description:
      'A gentle constriction at the back of the throat creates an ocean-like sound. Classic yoga breathing for focus and warmth.',
    phases: [
      { name: 'inhale', duration: 5, label: 'Inhale (Ocean Sound)' },
      { name: 'exhale', duration: 7, label: 'Exhale (Ocean Sound)' },
    ],
    cycleDuration: 12,
    recommendedRounds: 8,
    benefits: ['Builds internal heat', 'Enhances focus', 'Deepens yoga practice'],
    difficulty: 'intermediate',
    icon: '\u{1F30A}',
  },
  'progressive-relaxation': {
    id: 'progressive-relaxation',
    name: 'Progressive Relaxation',
    description:
      'A slow, grounding pattern ideal for body scan meditation. The extended rest phase allows tension to melt away.',
    phases: [
      { name: 'inhale', duration: 4, label: 'Breathe In' },
      { name: 'hold', duration: 2, label: 'Hold Gently' },
      { name: 'exhale', duration: 6, label: 'Release' },
      { name: 'rest', duration: 3, label: 'Let Go' },
    ],
    cycleDuration: 15,
    recommendedRounds: 6,
    benefits: ['Releases tension', 'Pairs with body scan', 'Promotes deep relaxation'],
    difficulty: 'beginner',
    icon: '\u{1F9D8}',
  },
};

const goalPatternMap: Record<string, string> = {
  stress: 'deep-belly',
  sleep: 'relaxing-478',
  focus: 'box-breathing',
  energy: 'energizing',
  anxiety: 'relaxing-478',
  calm: 'calm',
  relaxation: 'ratio-2-1',
  balance: 'alternate-nostril',
  yoga: 'ujjayi',
};

export function getPatternForGoal(goal: string): BreathingPattern {
  const key = goal.toLowerCase().trim();
  const patternId = goalPatternMap[key];
  if (patternId && BREATHING_PATTERNS[patternId]) {
    return BREATHING_PATTERNS[patternId];
  }
  // Default to calm breath for unknown goals
  return BREATHING_PATTERNS['calm'];
}
