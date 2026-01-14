'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Plus, Play, Trash2, Clock, Target } from 'lucide-react';
import { GlassCard, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { Routine } from '@/types';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const CosmicScene = dynamic(() => import('@/components/three/CosmicScene'), {
  ssr: false,
});

export default function RoutinesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutines = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const routinesRef = collection(db, 'users', user.uid, 'routines');
        const q = query(routinesRef, orderBy('lastUsedAt', 'desc'));
        const snapshot = await getDocs(q);

        const fetchedRoutines: Routine[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Routine[];

        setRoutines(fetchedRoutines);
      } catch (error) {
        console.error('Error fetching routines:', error);
      }
      setLoading(false);
    };

    fetchRoutines();
  }, [user]);

  const handleDeleteRoutine = async (routineId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'routines', routineId));
      setRoutines((prev) => prev.filter((r) => r.id !== routineId));
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

  const handleStartRoutine = (routine: Routine) => {
    router.push(`/session?type=${routine.type}&routine=${routine.id}`);
  };

  // Sample routines for demo
  const sampleRoutines: Routine[] = [
    {
      id: '1',
      name: 'Morning Energy',
      description: 'Start your day with energizing yoga',
      createdAt: new Date(),
      type: 'yoga',
      estimatedDuration: 20,
      goals: ['energy', 'focus'],
      prompt: 'Guide me through an energizing morning yoga routine',
      timesUsed: 5,
      lastUsedAt: new Date(),
    },
    {
      id: '2',
      name: 'Sleep Preparation',
      description: 'Calm your mind before bed',
      createdAt: new Date(),
      type: 'meditation',
      estimatedDuration: 15,
      goals: ['sleep', 'stress'],
      prompt: 'Help me relax and prepare for sleep',
      timesUsed: 12,
      lastUsedAt: new Date(),
    },
    {
      id: '3',
      name: 'Quick Stress Relief',
      description: 'Fast anxiety relief session',
      createdAt: new Date(),
      type: 'meditation',
      estimatedDuration: 5,
      goals: ['anxiety', 'stress'],
      prompt: 'I need quick stress relief',
      timesUsed: 8,
    },
  ];

  const displayRoutines = routines.length > 0 ? routines : sampleRoutines;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <CosmicScene mode="default" />

      <div className="relative z-10 min-h-screen p-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-serif text-white">Your Routines</h1>
              <p className="text-white/60 text-sm">Saved sessions & favorites</p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => router.push('/search')}
          >
            New
          </Button>
        </header>

        {/* Routines List */}
        <div className="space-y-4">
          <AnimatePresence>
            {displayRoutines.map((routine, index) => (
              <motion.div
                key={routine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard>
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        routine.type === 'meditation'
                          ? 'bg-purple-500/20'
                          : routine.type === 'yoga'
                          ? 'bg-pink-500/20'
                          : 'bg-cyan-500/20'
                      }`}
                    >
                      <span className="text-2xl">
                        {routine.type === 'meditation' ? '🧘' : routine.type === 'yoga' ? '🌟' : '✨'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-lg truncate">{routine.name}</h3>
                      <p className="text-white/60 text-sm truncate">{routine.description}</p>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-white/50 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{routine.estimatedDuration} min</span>
                        </div>
                        <div className="flex items-center gap-1 text-white/50 text-sm">
                          <Target className="w-4 h-4" />
                          <span className="capitalize">{routine.goals[0]}</span>
                        </div>
                        <span className="text-white/30 text-sm">
                          Used {routine.timesUsed}x
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        className="p-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                        onClick={() => handleStartRoutine(routine)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Play className="w-5 h-5" />
                      </motion.button>

                      <motion.button
                        className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                        onClick={() => handleDeleteRoutine(routine.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {displayRoutines.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <span className="text-6xl mb-4 block">✨</span>
            <h3 className="text-xl font-serif text-white mb-2">No routines yet</h3>
            <p className="text-white/60 mb-6">Save your favorite sessions to quickly access them</p>
            <Button
              variant="glow"
              glowColor="#7b68ee"
              onClick={() => router.push('/search')}
            >
              Discover Sessions
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
