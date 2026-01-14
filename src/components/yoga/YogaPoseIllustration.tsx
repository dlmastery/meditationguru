'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui';
import {
  generatePoseIllustration,
  generatePoseSequence,
  YOGA_POSES,
  type YogaPoseId,
  type IllustrationStyle,
} from '@/lib/imagen';

interface YogaPoseIllustrationProps {
  poseId: YogaPoseId;
  showSteps?: boolean;
  style?: IllustrationStyle;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onLoad?: () => void;
}

export default function YogaPoseIllustration({
  poseId,
  showSteps = false,
  style = 'line-drawing',
  size = 'lg',
  onLoad,
}: YogaPoseIllustrationProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [stepImages, setStepImages] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pose = YOGA_POSES[poseId];

  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
    xl: 'w-80 h-80',
  };

  useEffect(() => {
    async function loadIllustration() {
      setIsLoading(true);
      setError(null);

      try {
        if (showSteps) {
          const steps = await generatePoseSequence(poseId, 4);
          if (steps) {
            setStepImages(steps);
            setImageUrl(steps[0]);
          } else {
            setError('Failed to generate pose sequence');
          }
        } else {
          const url = await generatePoseIllustration(poseId, style);
          if (url) {
            setImageUrl(url);
          } else {
            setError('Failed to generate illustration');
          }
        }
      } catch (err) {
        setError('Error generating illustration');
        console.error(err);
      } finally {
        setIsLoading(false);
        onLoad?.();
      }
    }

    loadIllustration();
  }, [poseId, showSteps, style, onLoad]);

  const handleRegenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = await generatePoseIllustration(poseId, style);
      if (url) {
        setImageUrl(url);
      }
    } catch (err) {
      setError('Error regenerating');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
    setImageUrl(stepImages[Math.max(0, currentStep - 1)]);
  };

  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(stepImages.length - 1, prev + 1));
    setImageUrl(stepImages[Math.min(stepImages.length - 1, currentStep + 1)]);
  };

  return (
    <div className="flex flex-col items-center">
      <GlassCard className="overflow-hidden relative" glow glowColor="#7b68ee">
        <div className={`${sizeClasses[size]} relative`}>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/50 to-indigo-900/50"
              >
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                <p className="text-white/60 text-sm">Generating pose...</p>
                <p className="text-white/40 text-xs mt-1">Powered by Nano Banana</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-900/30 to-purple-900/30"
              >
                <p className="text-white/60 text-sm mb-2">{error}</p>
                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/80 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </motion.div>
            ) : imageUrl ? (
              <motion.img
                key={imageUrl}
                src={imageUrl}
                alt={pose?.name || 'Yoga pose'}
                className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              />
            ) : null}
          </AnimatePresence>

          {/* Regenerate button overlay */}
          {!isLoading && !error && imageUrl && (
            <button
              onClick={handleRegenerate}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
              title="Generate new illustration"
            >
              <RefreshCw className="w-4 h-4 text-white/80" />
            </button>
          )}
        </div>

        {/* Step navigation for sequences */}
        {showSteps && stepImages.length > 1 && (
          <div className="flex items-center justify-between px-4 py-2 bg-black/30">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              className="p-1 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex gap-1">
              {stepImages.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentStep ? 'bg-purple-400' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={handleNextStep}
              disabled={currentStep === stepImages.length - 1}
              className="p-1 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
      </GlassCard>

      {/* Pose info */}
      {pose && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-center"
        >
          <h3 className="text-white font-medium">{pose.name}</h3>
          <p className="text-purple-300/80 text-sm italic">{pose.sanskrit}</p>
          <span
            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
              pose.difficulty === 'beginner'
                ? 'bg-green-500/20 text-green-300'
                : pose.difficulty === 'intermediate'
                ? 'bg-yellow-500/20 text-yellow-300'
                : 'bg-red-500/20 text-red-300'
            }`}
          >
            {pose.difficulty}
          </span>
        </motion.div>
      )}
    </div>
  );
}
