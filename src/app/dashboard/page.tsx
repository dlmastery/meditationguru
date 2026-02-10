'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Calendar } from 'lucide-react';
import { AILoadingSpinner } from '@/components/ui';
import { MetricsOverview, MoodChart, PredictionCards, InsightsList } from '@/components/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionMemories } from '@/lib/persistence';
import { buildDashboardData } from '@/lib/wellness-predictions';
import type { DashboardData, SessionMemory } from '@/types/features';

const CosmicScene = dynamic(() => import('@/components/three/CosmicScene'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#0a0a12]" />,
});

type DateRange = 'week' | 'month' | 'all';

const RANGE_LABELS: Record<DateRange, string> = {
  week: 'This Week',
  month: 'This Month',
  all: 'All Time',
};

/**
 * Filter memories to only include those within the selected date range.
 */
function filterByRange(
  memories: readonly SessionMemory[],
  range: DateRange,
): SessionMemory[] {
  if (range === 'all') return [...memories];
  const now = new Date();
  const cutoff = new Date(now);
  if (range === 'week') cutoff.setDate(cutoff.getDate() - 7);
  else cutoff.setDate(cutoff.getDate() - 30);
  const cutoffIso = cutoff.toISOString();
  return memories.filter((m) => m.createdAt >= cutoffIso);
}

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();

  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [allMemories, setAllMemories] = useState<SessionMemory[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadingMessages = [
    'Analyzing your practice patterns...',
    'Computing wellness metrics...',
    'Consulting the stars for predictions...',
    'Generating personalized insights...',
    'Building your dashboard...',
  ];

  // Fetch all memories once on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchMemories() {
      try {
        const memories = await getSessionMemories(user!.uid, 200);
        if (!cancelled) setAllMemories(memories);
      } catch (error) {
        console.error('Failed to load session memories:', error);
      }
    }
    fetchMemories();
    return () => { cancelled = true; };
  }, [user]);

  // Build dashboard data whenever memories or date range changes
  const buildData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const filtered = filterByRange(allMemories, dateRange);
      const data = await buildDashboardData(user.uid, filtered);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to build dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, allMemories, dateRange]);

  useEffect(() => {
    buildData();
  }, [buildData]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AILoadingSpinner
        isLoading={isLoading}
        messages={loadingMessages}
        fullScreen
      />

      <CosmicScene mode="journey" />

      <div className="relative z-10 min-h-screen p-4 pb-24">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-serif text-white">Wellness Dashboard</h1>
            <p className="text-white/60 text-sm">Your practice analytics & predictions</p>
          </div>
        </header>

        {/* Date range selector */}
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-4 h-4 text-white/40" />
          <div className="flex rounded-xl bg-white/5 border border-white/10 p-1">
            {(Object.keys(RANGE_LABELS) as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                  dateRange === range
                    ? 'bg-purple-500/30 text-white font-medium'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {RANGE_LABELS[range]}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard content */}
        {dashboardData && !isLoading && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Metrics overview grid */}
            <MetricsOverview
              metrics={dashboardData.metrics}
              comparison={dashboardData.comparisonWithLastPeriod}
            />

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MoodChart
                data={dashboardData.metrics.moodTrend}
                title="Mood Trend"
              />
              <MoodChart
                data={dashboardData.metrics.sessionFrequency}
                title="Session Frequency"
              />
            </div>

            {/* Predictions */}
            <PredictionCards predictions={dashboardData.predictions} />

            {/* Insights */}
            <InsightsList insights={dashboardData.insights} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#0a0a12]" />}>
      <DashboardContent />
    </Suspense>
  );
}
