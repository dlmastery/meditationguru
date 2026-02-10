'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Loader2, Calendar, Tag } from 'lucide-react';
import { GlassCard, Button } from '@/components/ui';
import { analyzeDream, type DreamAnalysisResult } from '@/lib/dream-journal';
import { saveDreamEntry, getDreamEntries } from '@/lib/persistence';
import type { DreamEntry } from '@/types/features';

interface DreamJournalProps {
  /** The authenticated user's ID. */
  readonly userId: string;
}

/**
 * Dream journal component for recording and analyzing dreams.
 * Displays past entries with themes and analysis, and provides
 * an input area to describe and analyze new dreams.
 */
export default function DreamJournal({ userId }: DreamJournalProps) {
  const [entries, setEntries] = useState<DreamEntry[]>([]);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [latestAnalysis, setLatestAnalysis] = useState<DreamAnalysisResult | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await getDreamEntries(userId);
      setEntries(fetched);
    } catch (error) {
      console.error('Failed to load dream entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleAnalyze = async () => {
    if (!transcript.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setLatestAnalysis(null);

    try {
      const analysis = await analyzeDream(transcript.trim());
      setLatestAnalysis(analysis);

      const entryId = await saveDreamEntry({
        userId,
        rawTranscript: analysis.rawTranscript,
        themes: analysis.themes,
        emotions: analysis.emotions,
        symbols: analysis.symbols,
        analysis: analysis.analysis,
        relatedSessionIds: [],
        createdAt: new Date().toISOString(),
      });

      const newEntry: DreamEntry = {
        id: entryId,
        userId,
        ...analysis,
        relatedSessionIds: [],
        createdAt: new Date().toISOString(),
      };

      setEntries((prev) => [newEntry, ...prev]);
      setTranscript('');
    } catch (error) {
      console.error('Failed to analyze dream:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDate = (iso: string): string => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* New dream input */}
      <GlassCard glow glowColor="#7b68ee">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-serif text-white">Describe Your Dream</h3>
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Close your eyes and recall your dream... What did you see, feel, experience?"
            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white/90 placeholder-white/30 resize-none focus:outline-none focus:border-purple-500/50 transition-colors font-guru text-base"
          />

          <div className="flex justify-end">
            <Button
              variant="primary"
              icon={isAnalyzing ? undefined : <Sparkles className="w-4 h-4" />}
              loading={isAnalyzing}
              disabled={!transcript.trim()}
              onClick={handleAnalyze}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Dream'}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Latest analysis result */}
      <AnimatePresence>
        {latestAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <GlassCard glow glowColor="#e94560">
              <h3 className="text-lg font-serif text-white mb-4">Analysis</h3>

              {/* Themes */}
              {latestAnalysis.themes.length > 0 && (
                <div className="mb-4">
                  <p className="text-white/50 text-sm mb-2">Themes</p>
                  <div className="flex flex-wrap gap-2">
                    {latestAnalysis.themes.map((theme) => (
                      <span
                        key={theme}
                        className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Symbols */}
              {latestAnalysis.symbols.length > 0 && (
                <div className="mb-4">
                  <p className="text-white/50 text-sm mb-2">Symbols</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {latestAnalysis.symbols.map((symbol) => (
                      <div
                        key={symbol.symbol}
                        className="p-3 rounded-xl bg-white/5 border border-white/10"
                      >
                        <p className="text-white font-medium text-sm">{symbol.symbol}</p>
                        <p className="text-white/50 text-xs mt-1">{symbol.interpretation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI analysis text */}
              <div>
                <p className="text-white/50 text-sm mb-2">Interpretation</p>
                <p className="text-white/80 font-guru text-base italic leading-relaxed">
                  {latestAnalysis.analysis}
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past entries */}
      <div>
        <h3 className="text-lg font-serif text-white mb-4">Past Dreams</h3>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        )}

        {!isLoading && entries.length === 0 && (
          <GlassCard variant="dark">
            <p className="text-white/40 text-center py-4">
              No dreams recorded yet. Describe your first dream above.
            </p>
          </GlassCard>
        )}

        <div className="space-y-3">
          {entries.map((entry) => {
            const isExpanded = expandedEntryId === entry.id;
            return (
              <motion.div key={entry.id} layout>
                <GlassCard
                  variant="dark"
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedEntryId(isExpanded ? null : entry.id)
                  }
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(entry.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {entry.emotions.map((emotion) => (
                        <span
                          key={emotion}
                          className="px-2 py-0.5 rounded-full text-xs bg-pink-500/20 text-pink-300"
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Snippet */}
                  <p className="text-white/70 text-sm line-clamp-2 mb-2">
                    {entry.rawTranscript}
                  </p>

                  {/* Theme tags */}
                  {entry.themes.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Tag className="w-3 h-3 text-white/30" />
                      {entry.themes.map((theme) => (
                        <span
                          key={theme}
                          className="text-xs text-white/40"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                          {/* Full transcript */}
                          <div>
                            <p className="text-white/50 text-xs mb-1">Full Dream</p>
                            <p className="text-white/70 text-sm">{entry.rawTranscript}</p>
                          </div>

                          {/* Symbols */}
                          {entry.symbols.length > 0 && (
                            <div>
                              <p className="text-white/50 text-xs mb-1">Symbols</p>
                              <div className="space-y-1">
                                {entry.symbols.map((s) => (
                                  <div key={s.symbol} className="flex gap-2 text-sm">
                                    <span className="text-purple-300 font-medium">{s.symbol}:</span>
                                    <span className="text-white/50">{s.interpretation}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Analysis */}
                          <div>
                            <p className="text-white/50 text-xs mb-1">Analysis</p>
                            <p className="text-white/60 text-sm italic font-guru">
                              {entry.analysis}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
