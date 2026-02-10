'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface InsightsListProps {
  readonly insights: readonly string[];
}

/**
 * Display a list of AI-generated insight strings inside a glass card.
 */
export default function InsightsList({ insights }: InsightsListProps) {
  if (insights.length === 0) return null;

  return (
    <motion.div
      className="relative rounded-2xl backdrop-blur-xl border p-5 bg-white/5 border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-white/80 text-sm font-medium mb-4">Insights</h3>

      <ul className="space-y-3">
        {insights.map((insight, i) => (
          <motion.li
            key={i}
            className="flex items-start gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
          >
            <div className="w-6 h-6 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="text-white/70 text-sm leading-relaxed">{insight}</p>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
