'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Lightbulb, Brain, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui';
import type { DreamPatternAnalysis, EmotionLabel } from '@/types/features';

interface DreamPatternsProps {
  /** The pattern analysis data, or null if not yet loaded. */
  readonly analysis: DreamPatternAnalysis | null;
  /** Whether the analysis is currently being generated. */
  readonly isLoading: boolean;
}

/** Map emotion labels to display colors for the timeline. */
const EMOTION_COLORS: Record<EmotionLabel, string> = {
  calm: '#4ecdc4',
  anxious: '#ff6b6b',
  stressed: '#ff8c42',
  sad: '#7b68ee',
  happy: '#f5c518',
  frustrated: '#e94560',
  drowsy: '#8b9dc3',
  energetic: '#ffd93d',
  neutral: '#a0a0a0',
};

/**
 * Displays pattern analysis across multiple dream journal entries.
 * Shows recurring themes, emotional arc timeline, AI insights,
 * and correlation with meditation practice.
 */
export default function DreamPatterns({ analysis, isLoading }: DreamPatternsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-white/50 text-sm">Analyzing dream patterns...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <GlassCard variant="dark">
        <div className="text-center py-8">
          <Brain className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">
            Record at least 2 dreams to see pattern analysis.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recurring themes */}
      <GlassCard glow glowColor="#7b68ee">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-serif text-white">Recurring Themes</h3>
          <span className="ml-auto text-white/30 text-sm">
            {analysis.totalEntries} dreams analyzed
          </span>
        </div>

        {analysis.recurringThemes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {analysis.recurringThemes.map((theme, index) => (
              <motion.span
                key={theme}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-4 py-2 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 text-sm font-medium"
              >
                {theme}
              </motion.span>
            ))}
          </div>
        ) : (
          <p className="text-white/40 text-sm">No recurring themes detected yet.</p>
        )}
      </GlassCard>

      {/* Emotional arc timeline */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-serif text-white">Emotional Arc</h3>
        </div>

        {analysis.emotionalArc.length > 0 ? (
          <div className="space-y-3">
            {/* Horizontal timeline */}
            <div className="relative">
              <div className="flex items-center gap-1 overflow-x-auto pb-2 no-scrollbar">
                {analysis.emotionalArc.map((snapshot, index) => {
                  const color = EMOTION_COLORS[snapshot.label] ?? '#a0a0a0';
                  const date = new Date(snapshot.detectedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <motion.div
                      key={`${snapshot.detectedAt}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="flex flex-col items-center min-w-[60px]"
                    >
                      {/* Dot */}
                      <div
                        className="w-4 h-4 rounded-full border-2"
                        style={{
                          backgroundColor: `${color}40`,
                          borderColor: color,
                          boxShadow: `0 0 8px ${color}50`,
                        }}
                      />
                      {/* Connecting line */}
                      {index < analysis.emotionalArc.length - 1 && (
                        <div className="w-full h-0.5 bg-white/10 mt-[-8px] mb-[8px]" />
                      )}
                      {/* Label */}
                      <span
                        className="text-xs mt-1 font-medium"
                        style={{ color }}
                      >
                        {snapshot.label}
                      </span>
                      <span className="text-xs text-white/30">{date}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5">
              {Array.from(
                new Set(analysis.emotionalArc.map((s) => s.label)),
              ).map((label) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: EMOTION_COLORS[label] ?? '#a0a0a0' }}
                  />
                  <span className="text-xs text-white/40 capitalize">{label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-white/40 text-sm">Not enough data for an emotional arc.</p>
        )}
      </GlassCard>

      {/* Insights */}
      <GlassCard glow glowColor="#f5c518">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-serif text-white">Insights</h3>
        </div>

        {analysis.insights.length > 0 ? (
          <div className="space-y-3">
            {analysis.insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <p className="text-white/80 text-sm leading-relaxed">{insight}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-white/40 text-sm">Insights will appear as you journal more.</p>
        )}
      </GlassCard>

      {/* Correlation with practice */}
      {analysis.correlationWithPractice && (
        <GlassCard variant="dark">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-medium text-white/60">
              Dreams & Practice Correlation
            </h3>
          </div>
          <p className="text-white/70 text-sm font-guru italic leading-relaxed">
            {analysis.correlationWithPractice}
          </p>
        </GlassCard>
      )}
    </div>
  );
}
