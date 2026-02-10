'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, BookOpen, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import DreamJournal from '@/components/journal/DreamJournal';
import DreamPatterns from '@/components/journal/DreamPatterns';
import { getDreamEntries, getDreamAnalysis, saveDreamAnalysis } from '@/lib/persistence';
import { analyzePatterns } from '@/lib/dream-journal';
import { Button } from '@/components/ui';
import type { DreamPatternAnalysis } from '@/types/features';

const CosmicScene = dynamic(() => import('@/components/three/CosmicScene'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#0a0a12]" />,
});

type Tab = 'journal' | 'patterns';

function JournalContent() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.uid ?? '';

  const [activeTab, setActiveTab] = useState<Tab>('journal');
  const [patternAnalysis, setPatternAnalysis] = useState<DreamPatternAnalysis | null>(null);
  const [isPatternsLoading, setIsPatternsLoading] = useState(false);

  const loadPatterns = useCallback(async () => {
    if (!userId) return;

    setIsPatternsLoading(true);
    try {
      const cached = await getDreamAnalysis(userId);
      if (cached) {
        setPatternAnalysis(cached);
        setIsPatternsLoading(false);
        return;
      }

      const entries = await getDreamEntries(userId);
      if (entries.length >= 2) {
        const analysis = await analyzePatterns(entries);
        const fullAnalysis: DreamPatternAnalysis = {
          ...analysis,
          userId,
        };
        setPatternAnalysis(fullAnalysis);
        await saveDreamAnalysis(fullAnalysis);
      }
    } catch (error) {
      console.error('Failed to load pattern analysis:', error);
    } finally {
      setIsPatternsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'patterns') {
      loadPatterns();
    }
  }, [activeTab, loadPatterns]);

  const handleRefreshPatterns = async () => {
    if (!userId) return;

    setIsPatternsLoading(true);
    try {
      const entries = await getDreamEntries(userId);
      if (entries.length >= 2) {
        const analysis = await analyzePatterns(entries);
        const fullAnalysis: DreamPatternAnalysis = {
          ...analysis,
          userId,
        };
        setPatternAnalysis(fullAnalysis);
        await saveDreamAnalysis(fullAnalysis);
      }
    } catch (error) {
      console.error('Failed to refresh pattern analysis:', error);
    } finally {
      setIsPatternsLoading(false);
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'journal', label: 'Journal', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'patterns', label: 'Patterns', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <CosmicScene mode="journey" />

      <div className="relative z-10 min-h-screen p-4 max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-serif text-white">Dream Journal</h1>
            <p className="text-white/60 text-sm">
              Explore the landscape of your subconscious
            </p>
          </div>
        </header>

        {/* Tab selector */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}

          {activeTab === 'patterns' && (
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshPatterns}
                disabled={isPatternsLoading}
              >
                Refresh
              </Button>
            </div>
          )}
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'journal' && userId && (
            <DreamJournal userId={userId} />
          )}
          {activeTab === 'patterns' && (
            <DreamPatterns
              analysis={patternAnalysis}
              isLoading={isPatternsLoading}
            />
          )}
          {!userId && (
            <div className="text-center py-16">
              <p className="text-white/40">
                Sign in to start your dream journal.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#0a0a12]" />}>
      <JournalContent />
    </Suspense>
  );
}
