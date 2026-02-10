'use client';

import { motion } from 'framer-motion';
import { Activity, Clock, Smile, Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { WellnessMetrics, DashboardData } from '@/types/features';

interface MetricsOverviewProps {
  readonly metrics: WellnessMetrics;
  readonly comparison: DashboardData['comparisonWithLastPeriod'];
}

interface MetricCardData {
  readonly label: string;
  readonly value: string;
  readonly change: number;
  readonly icon: React.ReactNode;
  readonly color: string;
}

/**
 * Render a trend arrow icon with colour coding.
 * Positive = green up-arrow, negative = red down-arrow, zero = grey dash.
 */
function TrendIndicator({ change }: { readonly change: number }) {
  if (change > 0) {
    return (
      <span className="flex items-center gap-1 text-emerald-400 text-sm">
        <TrendingUp className="w-4 h-4" />
        +{change}%
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-1 text-red-400 text-sm">
        <TrendingDown className="w-4 h-4" />
        {change}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-white/40 text-sm">
      <Minus className="w-4 h-4" />
      0%
    </span>
  );
}

/**
 * Grid of four key metric cards:
 * Total Sessions, Total Minutes, Mood Improvement, Current Streak.
 */
export default function MetricsOverview({ metrics, comparison }: MetricsOverviewProps) {
  const cards: MetricCardData[] = [
    {
      label: 'Total Sessions',
      value: String(metrics.totalSessions),
      change: comparison.sessionsChange,
      icon: <Activity className="w-5 h-5" />,
      color: '#7b68ee',
    },
    {
      label: 'Total Minutes',
      value: String(metrics.totalMinutes),
      change: comparison.minutesChange,
      icon: <Clock className="w-5 h-5" />,
      color: '#45b7d1',
    },
    {
      label: 'Mood Improvement',
      value: `${metrics.moodImprovement > 0 ? '+' : ''}${metrics.moodImprovement}%`,
      change: comparison.moodChange,
      icon: <Smile className="w-5 h-5" />,
      color: '#4ecdc4',
    },
    {
      label: 'Current Streak',
      value: `${metrics.streakDays}d`,
      change: 0,
      icon: <Flame className="w-5 h-5" />,
      color: '#f5c518',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          className="relative rounded-2xl backdrop-blur-xl border p-4 bg-white/5 border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
        >
          {/* Icon badge */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: `${card.color}20`, color: card.color }}
          >
            {card.icon}
          </div>

          {/* Value */}
          <p className="text-2xl font-semibold text-white mb-0.5">{card.value}</p>

          {/* Label + trend */}
          <div className="flex items-center justify-between">
            <p className="text-white/50 text-sm">{card.label}</p>
            <TrendIndicator change={card.change} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
