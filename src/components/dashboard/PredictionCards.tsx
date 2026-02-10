'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Flame, Trophy, Lightbulb } from 'lucide-react';
import type { WellnessPrediction } from '@/types/features';

interface PredictionCardsProps {
  readonly predictions: readonly WellnessPrediction[];
}

/** Visual config per prediction type. */
const TYPE_CONFIG: Record<
  WellnessPrediction['type'],
  { color: string; bgColor: string; icon: React.ReactNode; label: string }
> = {
  motivation_dip: {
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.12)',
    icon: <AlertTriangle className="w-5 h-5" />,
    label: 'Motivation Alert',
  },
  streak_risk: {
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.12)',
    icon: <Flame className="w-5 h-5" />,
    label: 'Streak Risk',
  },
  goal_milestone: {
    color: '#f5c518',
    bgColor: 'rgba(245,197,24,0.12)',
    icon: <Trophy className="w-5 h-5" />,
    label: 'Milestone',
  },
  technique_suggestion: {
    color: '#14b8a6',
    bgColor: 'rgba(20,184,166,0.12)',
    icon: <Lightbulb className="w-5 h-5" />,
    label: 'Suggestion',
  },
};

/**
 * Render a list of AI-generated prediction cards.
 * Each card displays a type icon, title, description, confidence bar,
 * and a suggested action.
 */
export default function PredictionCards({ predictions }: PredictionCardsProps) {
  if (predictions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-white/80 text-sm font-medium">AI Predictions</h3>
      {predictions.map((prediction, i) => {
        const config = TYPE_CONFIG[prediction.type];
        return (
          <motion.div
            key={`${prediction.type}-${i}`}
            className="relative rounded-2xl backdrop-blur-xl border p-4 bg-white/5 border-white/10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            {/* Header row */}
            <div className="flex items-start gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: config.bgColor, color: config.color }}
              >
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: config.bgColor, color: config.color }}
                  >
                    {config.label}
                  </span>
                </div>
                <p className="text-white font-medium text-sm leading-snug">
                  {prediction.title}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-white/60 text-sm mb-3 leading-relaxed">
              {prediction.description}
            </p>

            {/* Confidence bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/40 text-xs">Confidence</span>
                <span className="text-white/50 text-xs">
                  {Math.round(prediction.confidence * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: config.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${prediction.confidence * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.1 + 0.2 }}
                />
              </div>
            </div>

            {/* Suggested action */}
            <div
              className="rounded-xl px-3 py-2 text-sm"
              style={{ backgroundColor: config.bgColor }}
            >
              <span className="text-white/50 text-xs block mb-0.5">
                Suggested action
              </span>
              <span style={{ color: config.color }} className="font-medium text-sm">
                {prediction.suggestedAction}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
