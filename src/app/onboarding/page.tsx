'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/lib/store';
import { Button, GlassCard } from '@/components/ui';
import GuruAvatar from '@/components/guru/GuruAvatar';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GOAL_CATEGORIES } from '@/lib/gemini';

// Dynamic import for Three.js to avoid SSR issues
const CosmicScene = dynamic(() => import('@/components/three/CosmicScene'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#0a0a12]" />,
});

type OnboardingStep = 'welcome' | 'goals' | 'experience' | 'guru-appears' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const { selectedGoals, setSelectedGoals, setOnboardingComplete } = useAppStore();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [guruMaterializing, setGuruMaterializing] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoals(
      selectedGoals.includes(goalId)
        ? selectedGoals.filter((g) => g !== goalId)
        : [...selectedGoals, goalId]
    );
  };

  const handleContinueFromGoals = () => {
    if (selectedGoals.length > 0) {
      setStep('experience');
    }
  };

  const handleExperienceSelect = (level: string) => {
    setExperienceLevel(level);
    setStep('guru-appears');
    setGuruMaterializing(true);

    // Guru materializes over 3 seconds
    setTimeout(() => {
      setGuruMaterializing(false);
    }, 3000);
  };

  const handleComplete = async () => {
    if (user) {
      // Save onboarding data to Firestore
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          'onboarding.completed': true,
          'onboarding.selectedOrbs': selectedGoals,
          'onboarding.completedAt': serverTimestamp(),
          'preferences.primaryGoals': selectedGoals,
          'preferences.experienceLevel': experienceLevel,
        });
      } catch (error) {
        console.error('Error saving onboarding data:', error);
      }
    }
    setOnboardingComplete(true);
    router.push('/');
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      setStep('complete');
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Cosmic Background - orbs disabled in favor of card-based UI */}
      <CosmicScene
        mode="onboarding"
        showOrbs={false}
      />

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center max-w-lg"
            >
              <motion.h1
                className="text-5xl md:text-6xl font-serif mb-6 gradient-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                MeditationGuru
              </motion.h1>

              <motion.p
                className="text-xl text-white/70 mb-8 font-light"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Your personal AI guide to inner peace and wellness
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  variant="glow"
                  size="xl"
                  glowColor="#f5c518"
                  onClick={() => setStep('goals')}
                >
                  Begin Your Journey
                </Button>
              </motion.div>

              <motion.p
                className="mt-6 text-white/40 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Powered by Gemini AI
              </motion.p>
            </motion.div>
          )}

          {/* Step 2: Goals Selection */}
          {step === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.h2
                className="text-3xl md:text-4xl font-serif mb-4 text-white"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                What calls to you?
              </motion.h2>

              <motion.p
                className="text-white/60 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Tap the intentions that resonate with you
              </motion.p>

              {/* Goal selection cards - reliable click targets */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto mb-8">
                {GOAL_CATEGORIES.map((goal, index) => (
                  <motion.button
                    key={goal.id}
                    className={`
                      p-4 rounded-xl text-center transition-all backdrop-blur-sm
                      ${selectedGoals.includes(goal.id)
                        ? 'bg-white/25 border-2 shadow-lg'
                        : 'bg-white/10 border border-white/20 hover:bg-white/15'
                      }
                    `}
                    style={{
                      borderColor: selectedGoals.includes(goal.id) ? goal.color : undefined,
                      boxShadow: selectedGoals.includes(goal.id) ? `0 0 20px ${goal.color}40` : undefined,
                    }}
                    onClick={() => handleGoalSelect(goal.id)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="text-3xl mb-2 block">{goal.icon}</span>
                    <span className="text-sm font-medium text-white/90">{goal.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Selected goals display */}
              {selectedGoals.length > 0 && (
                <motion.div
                  className="flex flex-wrap justify-center gap-2 mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {selectedGoals.map((goalId) => {
                    const goal = GOAL_CATEGORIES.find((g) => g.id === goalId);
                    return goal ? (
                      <span
                        key={goalId}
                        className="px-3 py-1 rounded-full text-sm bg-white/10 text-white/80"
                      >
                        {goal.icon} {goal.label}
                      </span>
                    ) : null;
                  })}
                </motion.div>
              )}

              <Button
                variant="glow"
                size="lg"
                glowColor="#7b68ee"
                onClick={handleContinueFromGoals}
                disabled={selectedGoals.length === 0}
              >
                Continue
              </Button>
            </motion.div>
          )}

          {/* Step 3: Experience Level */}
          {step === 'experience' && (
            <motion.div
              key="experience"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md w-full"
            >
              <GlassCard glow glowColor="#7b68ee">
                <h2 className="text-2xl font-serif mb-6 text-center">
                  Your meditation experience?
                </h2>

                <div className="space-y-3">
                  {[
                    { id: 'beginner', label: 'New to meditation', desc: "I'm just starting out" },
                    { id: 'intermediate', label: 'Some experience', desc: "I've practiced occasionally" },
                    { id: 'advanced', label: 'Regular practitioner', desc: 'Meditation is part of my routine' },
                  ].map((option) => (
                    <motion.button
                      key={option.id}
                      className="w-full p-4 rounded-xl text-left bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                      onClick={() => handleExperienceSelect(option.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="font-medium text-white">{option.label}</span>
                      <span className="block text-sm text-white/50 mt-1">{option.desc}</span>
                    </motion.button>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 4: Guru Appears */}
          {step === 'guru-appears' && (
            <motion.div
              key="guru-appears"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="mb-8">
                <GuruAvatar
                  size="xl"
                  materializing={guruMaterializing}
                  className="mx-auto"
                />
              </div>

              <AnimatePresence>
                {!guruMaterializing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <GlassCard className="max-w-md mx-auto mb-6" glow glowColor="#f5c518">
                      <p className="text-xl font-guru text-white/90 italic">
                        "Welcome, seeker. I sense great potential within you. Together, we shall explore the depths of inner peace and the heights of physical wellness."
                      </p>
                    </GlassCard>

                    <p className="text-white/60 mb-6">
                      Sign in to save your journey and preferences
                    </p>

                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleSignIn}
                      loading={isSigningIn}
                      icon={
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                      }
                    >
                      Continue with Google
                    </Button>

                    <button
                      className="mt-4 text-white/40 hover:text-white/60 text-sm transition-colors"
                      onClick={handleComplete}
                    >
                      Skip for now
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mb-6">
                <GuruAvatar size="lg" className="mx-auto" />
              </div>

              <h2 className="text-3xl font-serif mb-4 gradient-text-gold">
                Your journey begins
              </h2>

              <p className="text-white/70 mb-8 max-w-md mx-auto">
                I am here whenever you need me. Let us walk this path together.
              </p>

              <Button
                variant="glow"
                size="xl"
                glowColor="#f5c518"
                onClick={handleComplete}
              >
                Meet Your Guru
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
