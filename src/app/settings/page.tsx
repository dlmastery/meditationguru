'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, User, Volume2, Bell, Heart, LogOut, ChevronRight, LogIn } from 'lucide-react';
import { GlassCard, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/lib/store';
import VoiceSelector from '@/components/guru/VoiceSelector';
import { GURU_VOICES } from '@/lib/gemini';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const CosmicScene = dynamic(() => import('@/components/three/CosmicScene'), {
  ssr: false,
});

export default function SettingsPage() {
  const router = useRouter();
  const { user, signInWithGoogle, logout } = useAuth();
  const { guruVoice, setGuruVoice } = useAppStore();

  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleVoiceSelect = async (voiceId: string) => {
    const voice = GURU_VOICES.find((v) => v.id === voiceId);
    if (voice) {
      setGuruVoice(voice as any);

      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          'preferences.guruVoice': voiceId,
        });
      }
    }
    setShowVoiceSelector(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/onboarding');
  };

  const currentVoice = guruVoice || GURU_VOICES[2]; // Default to Aurora

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        {
          icon: <User className="w-5 h-5" />,
          label: 'Profile',
          value: user?.displayName || user?.email || 'Guest',
          action: user ? () => {} : signInWithGoogle,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: <Volume2 className="w-5 h-5" />,
          label: 'Guru Voice',
          value: currentVoice.name,
          action: () => setShowVoiceSelector(true),
        },
        {
          icon: <Bell className="w-5 h-5" />,
          label: 'Notifications',
          value: notifications ? 'On' : 'Off',
          action: () => setNotifications(!notifications),
          toggle: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <Heart className="w-5 h-5 text-pink-400" />,
          label: 'Support Your Guru',
          value: 'Donate',
          action: () => {},
        },
      ],
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <CosmicScene mode="default" />

      <div className="relative z-10 min-h-screen p-4">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl font-serif text-white">Settings</h1>
        </header>

        {/* User Card */}
        {user ? (
          <GlassCard className="mb-6">
            <div className="flex items-center gap-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-16 h-16 rounded-full border-2 border-purple-500/50"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <p className="text-white font-medium text-lg">{user.displayName || 'Seeker'}</p>
                <p className="text-white/60 text-sm">{user.email}</p>
              </div>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="mb-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <p className="text-white font-medium text-lg mb-2">Welcome, Seeker</p>
              <p className="text-white/60 text-sm mb-4">Sign in to save your progress</p>
              <Button
                variant="primary"
                icon={<LogIn className="w-5 h-5" />}
                onClick={signInWithGoogle}
                className="mx-auto"
              >
                Sign In with Google
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Settings Groups */}
        <div className="space-y-6">
          {settingsGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-white/60 text-sm mb-3 px-2">{group.title}</h3>
              <GlassCard className="divide-y divide-white/10">
                {group.items.map((item) => (
                  <motion.button
                    key={item.label}
                    className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                    onClick={item.action}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-white/60">{item.icon}</div>
                    <div className="flex-1 text-left">
                      <p className="text-white">{item.label}</p>
                    </div>
                    {item.toggle ? (
                      <div
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${
                          notifications ? 'bg-purple-500' : 'bg-white/20'
                        }`}
                      >
                        <motion.div
                          className="w-4 h-4 rounded-full bg-white"
                          animate={{ x: notifications ? 24 : 0 }}
                        />
                      </div>
                    ) : (
                      <>
                        <span className="text-white/60 text-sm">{item.value}</span>
                        <ChevronRight className="w-5 h-5 text-white/40" />
                      </>
                    )}
                  </motion.button>
                ))}
              </GlassCard>
            </div>
          ))}
        </div>

        {/* Logout */}
        {user && (
          <div className="mt-8">
            <Button
              variant="ghost"
              fullWidth
              icon={<LogOut className="w-5 h-5" />}
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              Sign Out
            </Button>
          </div>
        )}

        {/* Version */}
        <p className="text-center text-white/30 text-sm mt-8">
          MeditationGuru v1.0.0
        </p>
      </div>

      {/* Voice Selector Modal */}
      {showVoiceSelector && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <VoiceSelector
            selectedVoice={currentVoice.id}
            onSelect={handleVoiceSelect}
            onClose={() => setShowVoiceSelector(false)}
          />
        </motion.div>
      )}
    </div>
  );
}
