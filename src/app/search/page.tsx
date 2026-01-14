'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Search, ArrowLeft, Sparkles, Clock, Target, Zap } from 'lucide-react';
import { GlassCard, Input, Button, AILoadingSpinner } from '@/components/ui';
import { parseGoalIntent, GOAL_CATEGORIES } from '@/lib/gemini';

const CosmicScene = dynamic(() => import('@/components/three/CosmicScene'), {
  ssr: false,
});

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    goals: string[];
    suggestedType: 'meditation' | 'yoga' | 'mixed';
    suggestedDuration: number;
    techniques: string[];
  } | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const result = await parseGoalIntent(query);
      setSearchResult(result);
    } catch (error) {
      console.error('Search error:', error);
    }
    setIsSearching(false);
  };

  const handleStartSession = () => {
    if (searchResult) {
      router.push(`/session?type=${searchResult.suggestedType}`);
    }
  };

  const quickSearches = [
    { query: "I can't sleep", icon: '🌙' },
    { query: "Feeling anxious", icon: '😰' },
    { query: "Need more energy", icon: '⚡' },
    { query: "Back pain relief", icon: '🧘' },
    { query: "Before a big meeting", icon: '💼' },
    { query: "Wind down after work", icon: '🌅' },
  ];

  const searchMessages = [
    "Consulting your Guru...",
    "Reading your energy field...",
    "Analyzing your intentions...",
    "Searching the cosmic library...",
    "Finding the perfect practice...",
    "Aligning recommendations...",
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <CosmicScene mode="default" />

      {/* Mind-blowing AI Loading Spinner */}
      <AILoadingSpinner
        isLoading={isSearching}
        messages={searchMessages}
        fullScreen
      />

      <div className="relative z-10 min-h-screen p-4">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl font-serif text-white">Discover</h1>
        </header>

        {/* Search Input */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Input
              variant="search"
              placeholder="What do you need today?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              icon={<Search className="w-5 h-5" />}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            >
              <Sparkles className={`w-5 h-5 ${isSearching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Results */}
        <AnimatePresence mode="wait">
          {searchResult ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <GlassCard glow glowColor="#7b68ee">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-purple-500/20">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">Your Guru Suggests</h3>
                      <p className="text-white/60 text-sm">Based on your needs</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 text-center">
                      <Target className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                      <p className="text-sm text-white/60">Type</p>
                      <p className="text-white font-medium capitalize">{searchResult.suggestedType}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 text-center">
                      <Clock className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                      <p className="text-sm text-white/60">Duration</p>
                      <p className="text-white font-medium">{searchResult.suggestedDuration} min</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 text-center">
                      <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                      <p className="text-sm text-white/60">Focus</p>
                      <p className="text-white font-medium capitalize">{searchResult.goals[0]}</p>
                    </div>
                  </div>

                  {searchResult.techniques.length > 0 && (
                    <div>
                      <p className="text-white/60 text-sm mb-2">Techniques</p>
                      <div className="flex flex-wrap gap-2">
                        {searchResult.techniques.map((tech) => (
                          <span
                            key={tech}
                            className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm capitalize"
                          >
                            {tech.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="glow"
                    glowColor="#f5c518"
                    fullWidth
                    size="lg"
                    onClick={handleStartSession}
                  >
                    Start Session
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              {/* Quick Searches */}
              <div className="mb-8">
                <h3 className="text-white/60 text-sm mb-4">Quick searches</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {quickSearches.map((item) => (
                    <motion.button
                      key={item.query}
                      className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all"
                      onClick={() => {
                        setQuery(item.query);
                        setTimeout(handleSearch, 100);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-2xl mb-2 block">{item.icon}</span>
                      <span className="text-white/80 text-sm">{item.query}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Browse Categories */}
              <div>
                <h3 className="text-white/60 text-sm mb-4">Browse by goal</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {GOAL_CATEGORIES.map((goal) => (
                    <motion.button
                      key={goal.id}
                      className="p-4 rounded-xl text-center transition-all"
                      style={{ backgroundColor: `${goal.color}20` }}
                      onClick={() => {
                        setQuery(`I want to ${goal.label.toLowerCase()}`);
                        setTimeout(handleSearch, 100);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-3xl mb-2 block">{goal.icon}</span>
                      <span className="text-white/80 text-sm">{goal.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
