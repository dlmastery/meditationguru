'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Play, Clock, Flame } from 'lucide-react';
import { GlassCard, Button } from '@/components/ui';
import {
  generateYogaFlowCollage,
  YOGA_FLOWS,
  YOGA_POSES,
  type YogaPoseId,
} from '@/lib/imagen';

interface YogaFlowCardProps {
  flowId: keyof typeof YOGA_FLOWS;
  onStart?: () => void;
}

export default function YogaFlowCard({ flowId, onStart }: YogaFlowCardProps) {
  const [collageUrl, setCollageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const flow = YOGA_FLOWS[flowId];

  useEffect(() => {
    async function loadCollage() {
      setIsLoading(true);
      const url = await generateYogaFlowCollage(flow.poses, flow.name);
      setCollageUrl(url);
      setIsLoading(false);
    }
    loadCollage();
  }, [flowId, flow.poses, flow.name]);

  const difficultyColors: Record<string, string> = {
    beginner: 'text-green-400',
    intermediate: 'text-yellow-400',
    advanced: 'text-red-400',
  };

  return (
    <GlassCard className="overflow-hidden" glow glowColor="#f5c518">
      {/* Flow collage */}
      <div className="relative aspect-video bg-gradient-to-br from-purple-900/50 to-indigo-900/50">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-2" />
            <p className="text-white/60 text-sm">Generating flow...</p>
          </div>
        ) : collageUrl ? (
          <motion.img
            src={collageUrl}
            alt={flow.name}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-2">
              {flow.poses.slice(0, 5).map((poseId, i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl"
                >
                  {i + 1}
                </div>
              ))}
              {flow.poses.length > 5 && (
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-sm">
                  +{flow.poses.length - 5}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Flow info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-white font-medium text-lg">{flow.name}</h3>
            {'sanskrit' in flow && flow.sanskrit && (
              <p className="text-purple-300/80 text-sm italic">{flow.sanskrit}</p>
            )}
          </div>
          <span className={`text-sm capitalize ${difficultyColors[flow.difficulty]}`}>
            {flow.difficulty}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-white/60 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{flow.duration} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4" />
            <span>{flow.poses.length} poses</span>
          </div>
        </div>

        {/* Pose preview */}
        <div className="flex flex-wrap gap-1 mb-4">
          {flow.poses.map((poseId, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full bg-white/5 text-white/60 text-xs"
            >
              {YOGA_POSES[poseId]?.name || poseId}
            </span>
          ))}
        </div>

        {/* Start button */}
        <Button
          variant="primary"
          fullWidth
          icon={<Play className="w-4 h-4" />}
          onClick={onStart}
        >
          Start Flow
        </Button>
      </div>
    </GlassCard>
  );
}
