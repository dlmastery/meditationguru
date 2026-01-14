'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Volume2, Check } from 'lucide-react';
import { GURU_VOICES } from '@/lib/gemini';
import { GlassCard } from '@/components/ui';

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelect: (voiceId: string) => void;
  onClose?: () => void;
}

export default function VoiceSelector({
  selectedVoice,
  onSelect,
  onClose,
}: VoiceSelectorProps) {
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  const handlePreview = (voiceId: string) => {
    setPreviewingVoice(voiceId);
    // In a real app, this would play a sample audio
    setTimeout(() => setPreviewingVoice(null), 2000);
  };

  return (
    <GlassCard className="max-w-md w-full mx-auto" glow glowColor="#7b68ee">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-serif text-white">Choose Your Guru's Voice</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              &times;
            </button>
          )}
        </div>

        <p className="text-white/60 text-sm">
          Select a voice that resonates with you. Each voice brings a unique energy to your practice.
        </p>

        <div className="space-y-2">
          {GURU_VOICES.map((voice) => (
            <motion.button
              key={voice.id}
              className={`
                w-full p-4 rounded-xl text-left
                flex items-center justify-between gap-4
                transition-all duration-300
                ${selectedVoice === voice.id
                  ? 'bg-purple-500/30 border border-purple-500/50'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }
              `}
              onClick={() => onSelect(voice.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{voice.name}</span>
                  {selectedVoice === voice.id && (
                    <Check className="w-4 h-4 text-green-400" />
                  )}
                </div>
                <p className="text-white/50 text-sm mt-1">{voice.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full
                    ${voice.gender === 'male' ? 'bg-blue-500/20 text-blue-300' :
                      voice.gender === 'female' ? 'bg-pink-500/20 text-pink-300' :
                      'bg-purple-500/20 text-purple-300'}
                  `}>
                    {voice.gender}
                  </span>
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full
                    ${voice.tone === 'calm' ? 'bg-cyan-500/20 text-cyan-300' :
                      voice.tone === 'energetic' ? 'bg-orange-500/20 text-orange-300' :
                      voice.tone === 'wise' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-green-500/20 text-green-300'}
                  `}>
                    {voice.tone}
                  </span>
                </div>
              </div>

              <motion.button
                className={`
                  p-2 rounded-full
                  ${previewingVoice === voice.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                  }
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(voice.id);
                }}
                whileTap={{ scale: 0.9 }}
              >
                <Volume2 className={`w-5 h-5 ${previewingVoice === voice.id ? 'animate-pulse' : ''}`} />
              </motion.button>
            </motion.button>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
