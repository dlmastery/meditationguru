'use client';

import { useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { TextBrowser, StudyDialog } from '@/components/study';
import { TRADITIONS, getVerse, getChapter } from '@/lib/sacred-texts';
import {
  generateStudyResponse,
  generateVerseExplanation,
} from '@/lib/study-service';
import type { TextVerse, StudyMessage } from '@/types/features';

const CosmicScene = dynamic(() => import('@/components/three/CosmicScene'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#0a0a12]" />,
});

// ---------------------------------------------------------------------------
// Inner content (needs to be wrapped in Suspense)
// ---------------------------------------------------------------------------

function StudyContent() {
  const router = useRouter();

  const [selectedVerse, setSelectedVerse] = useState<TextVerse | null>(null);
  const [selectedTradition, setSelectedTradition] = useState('');
  const [messages, setMessages] = useState<StudyMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Called when the user selects a verse from the TextBrowser.
   * Finds the verse in the corpus and generates an initial explanation.
   */
  const handleVerseSelect = useCallback(
    async (textId: string, chapterId: string, verseNum: number) => {
      // Find the verse — try direct lookup first, then scan all chapters
      let verse: TextVerse | null = null;
      let tradition = '';

      if (chapterId) {
        verse = getVerse(textId, chapterId, verseNum);
      }

      // If chapterId was empty (from search), scan all chapters in the text
      if (!verse) {
        for (const t of TRADITIONS) {
          for (const text of t.texts) {
            if (text.id === textId) {
              for (const ch of text.chapters) {
                const found = ch.verses.find((v) => v.number === verseNum);
                if (found) {
                  verse = found;
                  tradition = t.name;
                  break;
                }
              }
            }
            if (verse) break;
          }
          if (verse) break;
        }
      }

      // Derive tradition name if we got it via direct lookup
      if (verse && !tradition) {
        for (const t of TRADITIONS) {
          for (const text of t.texts) {
            if (text.id === textId) {
              tradition = t.name;
              break;
            }
          }
          if (tradition) break;
        }
      }

      if (!verse) return;

      setSelectedVerse(verse);
      setSelectedTradition(tradition);
      setMessages([]);
      setIsLoading(true);

      try {
        const explanation = await generateVerseExplanation(verse, tradition);
        const guruMessage: StudyMessage = {
          role: 'guru',
          content: explanation,
          timestamp: new Date().toISOString(),
        };
        setMessages([guruMessage]);
      } catch {
        const fallback: StudyMessage = {
          role: 'guru',
          content:
            'Let us sit with this verse together. What draws your attention as you read these words?',
          timestamp: new Date().toISOString(),
        };
        setMessages([fallback]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Called when the user sends a message in the study dialog.
   */
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!selectedVerse) return;

      const userMessage: StudyMessage = {
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await generateStudyResponse(
          selectedVerse,
          selectedTradition,
          text,
          [...messages, userMessage],
        );

        const guruMessage: StudyMessage = {
          role: 'guru',
          content: response,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, guruMessage]);
      } catch {
        const errorMessage: StudyMessage = {
          role: 'guru',
          content:
            'A momentary disturbance has passed through our connection. Please share your thought again.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedVerse, selectedTradition, messages],
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      <CosmicScene mode="default" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-4 p-4 border-b border-white/10">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>

          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h1 className="text-lg font-serif text-white">Sacred Text Study</h1>
          </div>

          {selectedVerse && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-auto text-white/40 text-sm"
            >
              {selectedTradition}
            </motion.span>
          )}
        </header>

        {/* Main Split Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Text Browser */}
          <div className="lg:w-[380px] lg:border-r border-white/10 p-4 overflow-y-auto lg:max-h-[calc(100vh-65px)] max-h-[40vh]">
            <TextBrowser
              traditions={TRADITIONS}
              onVerseSelect={handleVerseSelect}
            />
          </div>

          {/* Right: Study Dialog */}
          <div className="flex-1 min-h-0 lg:max-h-[calc(100vh-65px)] max-h-[60vh]">
            <StudyDialog
              verse={selectedVerse}
              tradition={selectedTradition}
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export with Suspense boundary
// ---------------------------------------------------------------------------

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#0a0a12]" />}>
      <StudyContent />
    </Suspense>
  );
}
