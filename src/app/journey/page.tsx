'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Star, Clock, Flame, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/lib/store';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const CosmicScene = dynamic(() => import('@/components/three/CosmicScene'), {
  ssr: false,
});

interface StarData {
  id: string;
  label: string;
  type: 'session' | 'streak' | 'milestone';
  position: { x: number; y: number };
  unlocked: boolean;
  earnedAt?: Date;
}

export default function JourneyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { journey, setJourney } = useAppStore();

  const [stars, setStars] = useState<StarData[]>([]);
  const [selectedStar, setSelectedStar] = useState<StarData | null>(null);

  // Generate constellation stars
  useEffect(() => {
    const generateStars = (): StarData[] => {
      const milestones = [
        { id: 'first', label: 'First Session', type: 'session' as const },
        { id: 'week1', label: '7 Day Streak', type: 'streak' as const },
        { id: 'sessions10', label: '10 Sessions', type: 'milestone' as const },
        { id: 'hour1', label: '1 Hour Total', type: 'milestone' as const },
        { id: 'yoga-start', label: 'First Yoga', type: 'session' as const },
        { id: 'week2', label: '14 Day Streak', type: 'streak' as const },
        { id: 'sessions25', label: '25 Sessions', type: 'milestone' as const },
        { id: 'hours5', label: '5 Hours Total', type: 'milestone' as const },
        { id: 'month1', label: '30 Day Streak', type: 'streak' as const },
        { id: 'sessions50', label: '50 Sessions', type: 'milestone' as const },
        { id: 'hours10', label: '10 Hours Total', type: 'milestone' as const },
        { id: 'enlightened', label: 'Enlightened', type: 'milestone' as const },
      ];

      // Arrange in a constellation pattern
      const positions = [
        { x: 20, y: 80 },
        { x: 35, y: 65 },
        { x: 25, y: 45 },
        { x: 45, y: 55 },
        { x: 55, y: 40 },
        { x: 40, y: 25 },
        { x: 60, y: 60 },
        { x: 70, y: 45 },
        { x: 55, y: 20 },
        { x: 75, y: 30 },
        { x: 80, y: 55 },
        { x: 85, y: 15 },
      ];

      return milestones.map((m, i) => ({
        ...m,
        position: positions[i],
        unlocked: journey && journey.totalSessions ? journey.totalSessions > i : i === 0,
        earnedAt: journey && journey.totalSessions && journey.totalSessions > i ? new Date() : undefined,
      }));
    };

    setStars(generateStars());
  }, [journey]);

  // Fetch user journey data
  useEffect(() => {
    if (user) {
      // In production, fetch from Firestore
      // For now, use mock data
      setJourney({
        totalSessions: 3,
        totalMinutes: 45,
        currentStreak: 2,
        longestStreak: 2,
        stars: [],
        meditationMinutes: 30,
        yogaMinutes: 15,
        posesLearned: ['mountain', 'downward-dog'],
      });
    }
  }, [user, setJourney]);

  const stats = [
    {
      icon: <Star className="w-5 h-5" />,
      label: 'Sessions',
      value: journey?.totalSessions || 0,
      color: 'text-yellow-400',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Minutes',
      value: journey?.totalMinutes || 0,
      color: 'text-cyan-400',
    },
    {
      icon: <Flame className="w-5 h-5" />,
      label: 'Streak',
      value: `${journey?.currentStreak || 0} days`,
      color: 'text-orange-400',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'Best Streak',
      value: `${journey?.longestStreak || 0} days`,
      color: 'text-green-400',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <CosmicScene mode="journey" />

      <div className="relative z-10 min-h-screen p-4">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-serif text-white">Your Journey</h1>
            <p className="text-white/60 text-sm">Your path through the cosmos</p>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {stats.map((stat) => (
            <GlassCard key={stat.label} className="p-3 text-center">
              <div className={`${stat.color} mb-1 flex justify-center`}>
                {stat.icon}
              </div>
              <p className="text-white font-medium">{stat.value}</p>
              <p className="text-white/40 text-xs">{stat.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Constellation Map */}
        <GlassCard className="relative aspect-[4/3] overflow-hidden">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Constellation lines */}
            {stars.map((star, i) => {
              if (i === 0) return null;
              const prevStar = stars[i - 1];
              const isConnected = star.unlocked && prevStar.unlocked;
              return (
                <motion.line
                  key={`line-${star.id}`}
                  x1={`${prevStar.position.x}%`}
                  y1={`${prevStar.position.y}%`}
                  x2={`${star.position.x}%`}
                  y2={`${star.position.y}%`}
                  className={isConnected ? 'stroke-yellow-400/50' : 'stroke-white/10'}
                  strokeWidth="0.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: isConnected ? 1 : 0.3 }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                />
              );
            })}

            {/* Stars */}
            {stars.map((star, i) => (
              <motion.g
                key={star.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <motion.circle
                  cx={`${star.position.x}%`}
                  cy={`${star.position.y}%`}
                  r={star.unlocked ? 3 : 2}
                  className={star.unlocked ? 'fill-yellow-400' : 'fill-white/30'}
                  style={{
                    filter: star.unlocked ? 'drop-shadow(0 0 8px #f5c518)' : 'none',
                  }}
                  whileHover={{ scale: 1.5 }}
                  onClick={() => setSelectedStar(star)}
                  cursor="pointer"
                />
                {star.unlocked && (
                  <motion.circle
                    cx={`${star.position.x}%`}
                    cy={`${star.position.y}%`}
                    r="5"
                    fill="none"
                    stroke="#f5c518"
                    strokeWidth="0.3"
                    opacity="0.3"
                    animate={{
                      r: [5, 8, 5],
                      opacity: [0.3, 0.1, 0.3],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.g>
            ))}
          </svg>

          {/* Selected Star Info */}
          {selectedStar && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 right-4"
            >
              <GlassCard variant="dark" className="p-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${selectedStar.unlocked ? 'bg-yellow-500/20' : 'bg-white/10'}`}>
                    <Star className={`w-5 h-5 ${selectedStar.unlocked ? 'text-yellow-400' : 'text-white/40'}`} />
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedStar.label}</p>
                    <p className="text-white/60 text-sm capitalize">{selectedStar.type}</p>
                  </div>
                  {selectedStar.unlocked ? (
                    <span className="ml-auto text-green-400 text-sm">Unlocked ✓</span>
                  ) : (
                    <span className="ml-auto text-white/40 text-sm">Locked</span>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </GlassCard>

        {/* Progress Summary */}
        <div className="mt-6 space-y-4">
          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Meditation</p>
                <p className="text-white text-lg">{journey?.meditationMinutes || 0} minutes</p>
              </div>
              <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((journey?.meditationMinutes || 0) / 60 * 100, 100)}%` }}
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Yoga</p>
                <p className="text-white text-lg">{journey?.yogaMinutes || 0} minutes</p>
              </div>
              <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-pink-400 to-orange-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((journey?.yogaMinutes || 0) / 60 * 100, 100)}%` }}
                />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
