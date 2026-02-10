'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronRight, BookOpen, Scroll } from 'lucide-react';
import type { TextTradition, TextVerse } from '@/types/features';
import { searchVerses } from '@/lib/sacred-texts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRADITION_STYLES: Record<string, { color: string; bgClass: string }> = {
  yoga: { color: '#f5c518', bgClass: 'from-amber-500/20 to-amber-600/10' },
  buddhism: { color: '#4ecdc4', bgClass: 'from-teal-500/20 to-teal-600/10' },
  taoism: { color: '#7b68ee', bgClass: 'from-purple-500/20 to-purple-600/10' },
  stoicism: { color: '#e94560', bgClass: 'from-rose-500/20 to-rose-600/10' },
};

const TRADITION_ICONS: Record<string, React.ReactNode> = {
  lotus: <span className="text-xl">&#x1F33A;</span>,      // hibiscus
  'dharma-wheel': <span className="text-xl">&#x2638;</span>, // dharma wheel
  'yin-yang': <span className="text-xl">&#x262F;</span>,   // yin yang
  pillar: <span className="text-xl">&#x1F3DB;</span>,      // classical building
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TextBrowserProps {
  readonly traditions: readonly TextTradition[];
  readonly onVerseSelect: (textId: string, chapterId: string, verseNum: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TextBrowser({ traditions, onVerseSelect }: TextBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTradition, setExpandedTradition] = useState<string | null>(null);
  const [expandedText, setExpandedText] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const searchResults = useMemo(() => {
    if (searchQuery.trim().length < 2) return null;
    return searchVerses(searchQuery.trim());
  }, [searchQuery]);

  const toggleTradition = useCallback((id: string) => {
    setExpandedTradition((prev) => (prev === id ? null : id));
    setExpandedText(null);
    setExpandedChapter(null);
  }, []);

  const toggleText = useCallback((id: string) => {
    setExpandedText((prev) => (prev === id ? null : id));
    setExpandedChapter(null);
  }, []);

  const toggleChapter = useCallback((id: string) => {
    setExpandedChapter((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search verses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm"
        />
      </div>

      {/* Search Results */}
      {searchResults !== null ? (
        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
          {searchResults.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">No verses found.</p>
          ) : (
            searchResults.map((result, idx) => {
              const style = TRADITION_STYLES[result.tradition];
              return (
                <motion.button
                  key={`${result.textId}-${result.verse.number}-${idx}`}
                  onClick={() => onVerseSelect(result.textId, '', result.verse.number)}
                  className="w-full text-left p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: style?.color ?? '#fff' }}
                  >
                    {result.tradition}
                  </span>
                  <p className="text-white/60 text-xs mt-1 italic line-clamp-1">
                    {result.verse.original}
                  </p>
                  <p className="text-white/80 text-sm mt-1 line-clamp-2">
                    {result.verse.translation}
                  </p>
                </motion.button>
              );
            })
          )}
        </div>
      ) : (
        /* Accordion Browser */
        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
          {traditions.map((tradition) => {
            const style = TRADITION_STYLES[tradition.id];
            const isExpanded = expandedTradition === tradition.id;

            return (
              <div key={tradition.id}>
                {/* Tradition Header */}
                <motion.button
                  onClick={() => toggleTradition(tradition.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-gradient-to-r ${style?.bgClass ?? ''} hover:border-white/20 transition-colors`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex-shrink-0">
                    {TRADITION_ICONS[tradition.icon] ?? <BookOpen className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-white font-medium text-sm">{tradition.name}</h3>
                    <p className="text-white/40 text-xs line-clamp-1">{tradition.description}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  )}
                </motion.button>

                {/* Texts */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 pt-1 space-y-1">
                        {tradition.texts.map((text) => {
                          const textExpanded = expandedText === text.id;

                          return (
                            <div key={text.id}>
                              <button
                                onClick={() => toggleText(text.id)}
                                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                              >
                                <Scroll className="w-4 h-4 text-white/40 flex-shrink-0" />
                                <span className="text-white/80 text-sm text-left flex-1">
                                  {text.title}
                                </span>
                                <span className="text-white/30 text-xs">{text.originalLanguage}</span>
                                {textExpanded ? (
                                  <ChevronDown className="w-3 h-3 text-white/30" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-white/30" />
                                )}
                              </button>

                              {/* Chapters */}
                              <AnimatePresence>
                                {textExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="pl-4 space-y-1">
                                      {text.chapters.map((chapter) => {
                                        const chapterExpanded = expandedChapter === chapter.id;

                                        return (
                                          <div key={chapter.id}>
                                            <button
                                              onClick={() => toggleChapter(chapter.id)}
                                              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                                            >
                                              <span className="text-white/50 text-xs w-6 text-right flex-shrink-0">
                                                {chapter.number}.
                                              </span>
                                              <span className="text-white/70 text-sm text-left flex-1">
                                                {chapter.title}
                                              </span>
                                              <span className="text-white/30 text-xs">
                                                {chapter.verses.length} verses
                                              </span>
                                              {chapterExpanded ? (
                                                <ChevronDown className="w-3 h-3 text-white/30" />
                                              ) : (
                                                <ChevronRight className="w-3 h-3 text-white/30" />
                                              )}
                                            </button>

                                            {/* Verses */}
                                            <AnimatePresence>
                                              {chapterExpanded && (
                                                <motion.div
                                                  initial={{ height: 0, opacity: 0 }}
                                                  animate={{ height: 'auto', opacity: 1 }}
                                                  exit={{ height: 0, opacity: 0 }}
                                                  transition={{ duration: 0.2 }}
                                                  className="overflow-hidden"
                                                >
                                                  <div className="pl-6 space-y-1 py-1">
                                                    {chapter.verses.map((verse) => (
                                                      <VerseItem
                                                        key={verse.number}
                                                        verse={verse}
                                                        color={style?.color ?? '#fff'}
                                                        onClick={() =>
                                                          onVerseSelect(text.id, chapter.id, verse.number)
                                                        }
                                                      />
                                                    ))}
                                                  </div>
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: VerseItem
// ---------------------------------------------------------------------------

interface VerseItemProps {
  readonly verse: TextVerse;
  readonly color: string;
  readonly onClick: () => void;
}

function VerseItem({ verse, color, onClick }: VerseItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full text-left p-2.5 rounded-lg border border-white/5 hover:border-white/15 bg-white/[0.02] hover:bg-white/5 transition-colors group"
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-2">
        <span
          className="text-xs font-mono mt-0.5 flex-shrink-0"
          style={{ color }}
        >
          {verse.number}
        </span>
        <div className="min-w-0">
          <p className="text-white/40 text-xs italic line-clamp-1 group-hover:text-white/50 transition-colors">
            {verse.original}
          </p>
          <p className="text-white/70 text-xs mt-0.5 line-clamp-2 group-hover:text-white/90 transition-colors">
            {verse.translation}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
