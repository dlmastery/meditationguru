'use client';

import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, BookOpen } from 'lucide-react';
import type { TextVerse, StudyMessage } from '@/types/features';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StudyDialogProps {
  readonly verse: TextVerse | null;
  readonly tradition: string;
  readonly messages: readonly StudyMessage[];
  readonly isLoading: boolean;
  readonly onSendMessage: (text: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StudyDialog({
  verse,
  tradition,
  messages,
  isLoading,
  onSendMessage,
}: StudyDialogProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isLoading) return;
      onSendMessage(trimmed);
      setInput('');
    },
    [input, isLoading, onSendMessage],
  );

  // Empty state — no verse selected
  if (!verse) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <BookOpen className="w-12 h-12 text-white/20 mb-4" />
        <h3 className="text-white/60 font-serif text-lg mb-2">Select a verse to begin</h3>
        <p className="text-white/30 text-sm max-w-xs">
          Browse the sacred texts on the left and choose a verse to explore with your guru.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Verse Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/10">
        <p className="text-xs uppercase tracking-wider text-white/40 mb-2">{tradition}</p>
        <p className="text-white/50 text-sm italic font-guru leading-relaxed">
          {verse.original}
        </p>
        {verse.transliteration && (
          <p className="text-white/30 text-xs mt-1">{verse.transliteration}</p>
        )}
        <p className="text-white/90 text-sm mt-2 leading-relaxed">{verse.translation}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-4 py-3"
          >
            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            <span className="text-white/40 text-sm font-guru">The guru is contemplating...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the guru about this verse..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm disabled:opacity-50"
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white disabled:opacity-30 disabled:cursor-not-allowed"
            whileHover={input.trim() && !isLoading ? { scale: 1.05 } : undefined}
            whileTap={input.trim() && !isLoading ? { scale: 0.95 } : undefined}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: MessageBubble
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  readonly message: StudyMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isGuru = message.role === 'guru';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isGuru ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isGuru
            ? 'bg-white/5 border border-white/10 rounded-bl-sm'
            : 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-purple-500/20 rounded-br-sm'
        }`}
      >
        <p
          className={`text-sm leading-relaxed whitespace-pre-wrap ${
            isGuru ? 'text-white/85 font-guru' : 'text-white/90'
          }`}
        >
          {message.content}
        </p>
      </div>
    </motion.div>
  );
}
