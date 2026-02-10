/**
 * Sacred text corpus and lookup service for Feature 9: Sacred Text Study Mode.
 *
 * Provides curated verses from four contemplative traditions:
 * Yoga (Patanjali), Buddhism (Dhammapada), Taoism (Tao Te Ching),
 * and Stoicism (Marcus Aurelius, Meditations).
 */

import type { TextTradition, TextChapter, TextVerse } from '@/types/features';

// ---------------------------------------------------------------------------
// Yoga Sutras of Patanjali
// ---------------------------------------------------------------------------

const yogaSutrasChapter1: TextChapter = {
  id: 'ys-1',
  number: 1,
  title: 'Samadhi Pada',
  verses: [
    {
      number: 1,
      original: 'atha yoganushasanam',
      transliteration: 'atha yoga-anushasanam',
      translation: 'Now begins the exposition of yoga.',
    },
    {
      number: 2,
      original: 'yogash chitta-vritti-nirodhah',
      transliteration: 'yogash chitta-vritti-nirodhah',
      translation: 'Yoga is the cessation of the fluctuations of the mind.',
    },
    {
      number: 3,
      original: 'tada drashtuh svarupe avasthanam',
      transliteration: 'tada drashtuh svarupe avasthanam',
      translation: 'Then the seer abides in their own true nature.',
    },
    {
      number: 4,
      original: 'vritti-sarupyam itaratra',
      transliteration: 'vritti-sarupyam itaratra',
      translation: 'At other times, the seer identifies with the fluctuations of the mind.',
    },
    {
      number: 12,
      original: 'abhyasa-vairagyabhyam tan-nirodhah',
      transliteration: 'abhyasa-vairagyabhyam tan-nirodhah',
      translation: 'These mental fluctuations are stilled through practice and non-attachment.',
    },
    {
      number: 13,
      original: 'tatra sthitau yatno abhyasah',
      transliteration: 'tatra sthitau yatno abhyasah',
      translation: 'Practice is the sustained effort to rest in that stillness.',
    },
    {
      number: 14,
      original: 'sa tu dirgha-kala-nairantarya-satkarasevito dridha-bhumih',
      transliteration: 'sa tu dirgha-kala-nairantarya-satkara-asevito dridha-bhumih',
      translation: 'This practice becomes firmly grounded when attended to for a long time, without interruption, and with devotion.',
    },
    {
      number: 15,
      original: 'drista-anushravika-vishaya-vitrishnasya vashikara-sanjna vairagyam',
      transliteration: 'drista-anushravika-vishaya-vitrishnasya vashikara-sanjna vairagyam',
      translation: 'Non-attachment is the mastery of one who is free from craving for objects seen or described.',
    },
    {
      number: 33,
      original: 'maitri-karuna-muditopekshanam sukha-duhkha-punyapunya-vishayanam bhavanatash chitta-prasadanam',
      transliteration: 'maitri-karuna-mudita-upekshanam sukha-duhkha-punya-apunya-vishayanam bhavanatash chitta-prasadanam',
      translation: 'By cultivating friendliness toward the happy, compassion toward the suffering, joy toward the virtuous, and equanimity toward the non-virtuous, the mind becomes serene.',
    },
    {
      number: 34,
      original: 'prachchhardana-vidharanabhyam va pranasya',
      transliteration: 'prachchhardana-vidharanabhyam va pranasya',
      translation: 'Or by the regulation of the breath, the mind can be calmed.',
    },
    {
      number: 36,
      original: 'vishoka va jyotishmati',
      transliteration: 'vishoka va jyotishmati',
      translation: 'Or by contemplation of the supreme, sorrowless inner light.',
    },
    {
      number: 41,
      original: 'kshina-vritter abhijatasya iva maner grahitri-grahana-grahyeshu tat-stha-tad-anjanata samapattih',
      transliteration: 'kshina-vritter abhijatasya iva maner grahitri-grahana-grahyeshu tat-stha-tad-anjanata samapattih',
      translation: 'When the fluctuations of the mind are weakened, like a pure crystal it takes on the color of what is near it, whether the perceiver, the perceived, or the act of perception. This is samapatti.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Dhammapada (Buddhist)
// ---------------------------------------------------------------------------

const dhammapadaChapter1: TextChapter = {
  id: 'dp-1',
  number: 1,
  title: 'The Twin Verses (Yamakavagga)',
  verses: [
    {
      number: 1,
      original: 'Manopubbangama dhamma, manosettha manomaya. Manasa ce padutthena, bhasati va karoti va. Tato nam dukkham anveti, cakkam va vahato padam.',
      translation: 'Mind is the forerunner of all actions. All deeds are led by mind, created by mind. If one speaks or acts with a corrupt mind, suffering follows as the wheel follows the hoof of the ox.',
    },
    {
      number: 2,
      original: 'Manopubbangama dhamma, manosettha manomaya. Manasa ce pasannena, bhasati va karoti va. Tato nam sukham anveti, chaya va anapayini.',
      translation: 'Mind is the forerunner of all actions. All deeds are led by mind, created by mind. If one speaks or acts with a pure mind, happiness follows like a shadow that never departs.',
    },
    {
      number: 3,
      original: 'Akkocchi mam avadhi mam, ajini mam ahasi me. Ye ca tam upanayhanti, veram tesam na sammati.',
      translation: '"He abused me, he struck me, he defeated me, he robbed me." In those who harbor such thoughts, hatred will never cease.',
    },
    {
      number: 4,
      original: 'Akkocchi mam avadhi mam, ajini mam ahasi me. Ye ca tam nupanayhanti, veram tesupasammati.',
      translation: '"He abused me, he struck me, he defeated me, he robbed me." In those who do not harbor such thoughts, hatred will surely cease.',
    },
    {
      number: 5,
      original: 'Na hi verena verani, sammantidha kudacanam. Averena ca sammanti, esa dhammo sanantano.',
      translation: 'Hatred is never appeased by hatred in this world. By non-hatred alone is hatred appeased. This is an eternal law.',
    },
    {
      number: 6,
      original: 'Pare ca na vijananti, mayam ettha yamamase. Ye ca tattha vijananti, tato sammanti medhaga.',
      translation: 'Many do not realize that we all must perish. Those who do realize this settle their quarrels.',
    },
    {
      number: 7,
      original: 'Subhanuppassim viharantam, indriyesu asamvutam. Bhojanamhi camattannum, kusidam hinaviriyam. Tam ve pasahati maro, vato rukkham va dubbalam.',
      translation: 'One who dwells contemplating pleasure, with senses unrestrained, intemperate in eating, lazy, and lacking energy — Mara overcomes such a person as the wind overcomes a weak tree.',
    },
    {
      number: 8,
      original: 'Asubhanuppassim viharantam, indriyesu susamvutam. Bhojanamhi ca mattannum, saddham araddhaviriyam. Tam ve nappasahati maro, vato selam va pabbatam.',
      translation: 'One who dwells contemplating impurity, with senses well-restrained, moderate in eating, full of faith and energy — Mara cannot overcome such a person, as the wind cannot move a mountain of rock.',
    },
    {
      number: 11,
      original: 'Asare saramatino, sare casaradassino. Te saram nadhigacchanti, micchasankappagocara.',
      translation: 'Those who mistake the unessential for the essential and the essential for the unessential, dwelling in wrong thoughts, never arrive at the essential.',
    },
    {
      number: 17,
      original: 'Idha tappati pecca tappati, papakari ubhayattha tappati. Papam me katan ti tappati, bhiyyo tappati duggatim gato.',
      translation: 'The evil-doer suffers here and hereafter; they suffer in both worlds. They suffer thinking "I have done evil." They suffer even more when gone to a state of woe.',
    },
    {
      number: 18,
      original: 'Idha modati pecca modati, katapunno ubhayattha modati. Punnam me katan ti modati, bhiyyo modati suggatim gato.',
      translation: 'The doer of good rejoices here and hereafter; they rejoice in both worlds. They rejoice thinking "I have done good." They rejoice even more when gone to a state of bliss.',
    },
    {
      number: 19,
      original: 'Bahumpi ce samhita bhasamano, na takkaro hoti naro pamatto. Gopo va gavo ganayam paresam, na bhagava samannassa hoti.',
      translation: 'Though one may recite much of scripture, if one is negligent and does not act accordingly, one is like a cowherd counting the cattle of others — one has no share in the fruits of the holy life.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Tao Te Ching (Taoist)
// ---------------------------------------------------------------------------

const taoTeChingChapters: TextChapter[] = [
  {
    id: 'ttc-1',
    number: 1,
    title: 'The Tao',
    verses: [
      {
        number: 1,
        original: 'dao ke dao fei chang dao. ming ke ming fei chang ming.',
        transliteration: 'dao ke dao fei chang dao',
        translation: 'The Tao that can be told is not the eternal Tao. The name that can be named is not the eternal name.',
      },
      {
        number: 2,
        original: 'wu ming tian di zhi shi. you ming wan wu zhi mu.',
        translation: 'The nameless is the beginning of heaven and earth. The named is the mother of ten thousand things.',
      },
      {
        number: 3,
        original: 'gu chang wu yu yi guan qi miao. chang you yu yi guan qi jiao.',
        translation: 'Free from desire, you realize the mystery. Caught in desire, you see only the manifestations.',
      },
      {
        number: 4,
        original: 'ci liang zhe tong chu er yi ming. tong wei zhi xuan. xuan zhi you xuan. zhong miao zhi men.',
        translation: 'Yet mystery and manifestations arise from the same source. This source is called darkness. Darkness within darkness, the gateway to all understanding.',
      },
    ],
  },
  {
    id: 'ttc-2',
    number: 2,
    title: 'Duality',
    verses: [
      {
        number: 1,
        original: 'tian xia jie zhi mei zhi wei mei. si e yi.',
        translation: 'When people see some things as beautiful, other things become ugly. When people see some things as good, other things become bad.',
      },
      {
        number: 2,
        original: 'you wu xiang sheng. nan yi xiang cheng. chang duan xiang xing. gao xia xiang qing. yin sheng xiang he. qian hou xiang sui.',
        translation: 'Being and non-being create each other. Difficult and easy support each other. Long and short define each other. High and low depend on each other. Before and after follow each other.',
      },
      {
        number: 3,
        original: 'shi yi sheng ren chu wu wei zhi shi. xing bu yan zhi jiao.',
        translation: 'Therefore the sage acts without doing and teaches without saying.',
      },
    ],
  },
  {
    id: 'ttc-3',
    number: 3,
    title: 'Without Action',
    verses: [
      {
        number: 1,
        original: 'bu shang xian. shi min bu zheng.',
        translation: 'Not exalting the gifted prevents quarreling.',
      },
      {
        number: 2,
        original: 'bu gui nan de zhi huo. shi min bu wei dao.',
        translation: 'Not valuing rare treasures prevents stealing.',
      },
      {
        number: 3,
        original: 'bu jian ke yu. shi min xin bu luan.',
        translation: 'Not displaying desirable things prevents the disturbance of the heart.',
      },
      {
        number: 4,
        original: 'wei wu wei. ze wu bu zhi.',
        translation: 'Practice not-doing, and everything will fall into place.',
      },
    ],
  },
  {
    id: 'ttc-4',
    number: 4,
    title: 'The Infinite',
    verses: [
      {
        number: 1,
        original: 'dao chong er yong zhi huo bu ying.',
        translation: 'The Tao is like a well: used but never used up.',
      },
      {
        number: 2,
        original: 'yuan hu si wan wu zhi zong.',
        translation: 'It is like the eternal void: filled with infinite possibilities.',
      },
      {
        number: 3,
        original: 'cuo qi rui. jie qi fen. he qi guang. tong qi chen.',
        translation: 'It blunts the sharp, unties the knotted, shades the bright, and unites with the dust.',
      },
      {
        number: 4,
        original: 'zhan hu si huo cun. wu bu zhi shui zhi zi. xiang di zhi xian.',
        translation: 'Hidden deep but ever present, I do not know whose child it is. It appears to precede the origin of all things.',
      },
    ],
  },
  {
    id: 'ttc-5',
    number: 5,
    title: 'Nature',
    verses: [
      {
        number: 1,
        original: 'tian di bu ren. yi wan wu wei chu gou.',
        translation: 'Heaven and earth are impartial; they treat all of creation as straw dogs.',
      },
      {
        number: 2,
        original: 'sheng ren bu ren. yi bai xing wei chu gou.',
        translation: 'The sage is impartial; they treat all people as straw dogs.',
      },
      {
        number: 3,
        original: 'tian di zhi jian. qi you tuo yue hu. xu er bu qu. dong er yu chu.',
        translation: 'The space between heaven and earth is like a bellows: it is empty yet inexhaustible. The more it works, the more comes out.',
      },
      {
        number: 4,
        original: 'duo yan shu qiong. bu ru shou zhong.',
        translation: 'Holding on to many words leads to exhaustion. Better to hold fast to the center.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Meditations by Marcus Aurelius (Stoic)
// ---------------------------------------------------------------------------

const meditationsBook2: TextChapter = {
  id: 'ma-2',
  number: 2,
  title: 'Book II',
  verses: [
    {
      number: 1,
      original: 'Begin the morning by saying to thyself, I shall meet with the busybody, the ungrateful, arrogant, deceitful, envious, unsocial.',
      translation: 'Begin each day by telling yourself: today I shall meet people who are meddling, ungrateful, arrogant, dishonest, jealous, and antisocial. All these things happen to them because they do not know what is good and evil.',
    },
    {
      number: 4,
      original: 'Think of how long thou hast been putting off these things, and how often thou hast received an opportunity from the gods, and yet dost not use it.',
      translation: 'Remember how long you have been putting these things off, and how many times the gods have given you days of grace, and yet you do not use them.',
    },
    {
      number: 5,
      original: 'Every moment think steadily as a Roman and a man to do what thou hast in hand with perfect and simple dignity.',
      translation: 'At every moment, concentrate your full attention on what is at hand, performing it with perfect and simple dignity, with affection, freedom, and justice.',
    },
    {
      number: 6,
      original: 'If thou findest in human life anything better than justice, truth, temperance, fortitude, be assured that it must be a rare thing indeed.',
      translation: 'If you find in human life anything better than justice, truth, self-control, and courage — anything better than a mind at peace — turn to it with all your soul.',
    },
    {
      number: 11,
      original: 'Since it is possible that thou mayest depart from life this very moment, regulate every act and thought accordingly.',
      translation: 'Since it is possible that you may depart from life this very moment, govern every act and thought accordingly.',
    },
    {
      number: 14,
      original: 'Though thou shouldst be going to live three thousand years, and as many times ten thousand years, still remember that no man loses any other life than the one he now lives.',
      translation: 'Even if you were going to live three thousand years, remember: no one loses any other life than the one being lived right now, nor lives any other life than the one being lost.',
    },
    {
      number: 16,
      original: 'The soul of man does violence to itself when it turns away from any man or moves against him with intent to harm.',
      translation: 'The human soul degrades itself when it turns away from another person, or moves against them with the intention to harm.',
    },
    {
      number: 17,
      original: 'Of human life the time is a point, and the substance is in a flux, and the perception dull, and the composition of the whole body subject to putrefaction.',
      translation: 'Of human life, the time is a point, and the substance is in flux, and perception dim, and the composition of the body corruptible. What then can guide a person? One thing, and only one: philosophy.',
    },
    {
      number: 3,
      original: 'Do not waste the remainder of thy life in thoughts about others, unless with reference to some common good.',
      translation: 'Do not waste the remaining years of your life in thoughts about others, unless those thoughts serve the common good.',
    },
    {
      number: 8,
      original: 'Failure to observe what is in the mind of another has seldom made a man unhappy; but those who do not observe the movements of their own minds must be unhappy.',
      translation: 'Not understanding another person rarely causes unhappiness; but not understanding yourself will certainly make you miserable.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Tradition definitions
// ---------------------------------------------------------------------------

/** All available traditions with their sacred texts. */
export const TRADITIONS: readonly TextTradition[] = [
  {
    id: 'yoga',
    name: 'Yoga',
    description: 'Classical yoga philosophy from the Yoga Sutras of Patanjali, the foundational text of Raja Yoga.',
    icon: 'lotus',
    texts: [
      {
        id: 'yoga-sutras',
        title: 'Yoga Sutras of Patanjali',
        tradition: 'yoga',
        chapters: [yogaSutrasChapter1],
        originalLanguage: 'Sanskrit',
      },
    ],
  },
  {
    id: 'buddhism',
    name: 'Buddhism',
    description: 'Teachings from the Dhammapada, a collection of sayings attributed to the Buddha.',
    icon: 'dharma-wheel',
    texts: [
      {
        id: 'dhammapada',
        title: 'Dhammapada',
        tradition: 'buddhism',
        chapters: [dhammapadaChapter1],
        originalLanguage: 'Pali',
      },
    ],
  },
  {
    id: 'taoism',
    name: 'Taoism',
    description: 'Wisdom from the Tao Te Ching, the classic Chinese text attributed to Lao Tzu on the art of living.',
    icon: 'yin-yang',
    texts: [
      {
        id: 'tao-te-ching',
        title: 'Tao Te Ching',
        tradition: 'taoism',
        chapters: taoTeChingChapters,
        originalLanguage: 'Classical Chinese',
      },
    ],
  },
  {
    id: 'stoicism',
    name: 'Stoicism',
    description: 'Reflections from Meditations by Marcus Aurelius, the Roman emperor and Stoic philosopher.',
    icon: 'pillar',
    texts: [
      {
        id: 'meditations',
        title: 'Meditations',
        tradition: 'stoicism',
        chapters: [meditationsBook2],
        originalLanguage: 'Ancient Greek',
      },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/**
 * Look up a specific verse by text ID, chapter ID, and verse number.
 * Returns `null` if not found.
 */
export function getVerse(
  textId: string,
  chapterId: string,
  verseNumber: number,
): TextVerse | null {
  const chapter = getChapter(textId, chapterId);
  if (!chapter) return null;
  return chapter.verses.find((v) => v.number === verseNumber) ?? null;
}

/**
 * Look up a chapter by text ID and chapter ID.
 * Returns `null` if not found.
 */
export function getChapter(
  textId: string,
  chapterId: string,
): TextChapter | null {
  for (const tradition of TRADITIONS) {
    for (const text of tradition.texts) {
      if (text.id === textId) {
        return text.chapters.find((ch) => ch.id === chapterId) ?? null;
      }
    }
  }
  return null;
}

/**
 * Simple keyword search across all verses in every tradition.
 * Searches the translation and original text (case-insensitive).
 */
export function searchVerses(
  query: string,
): Array<{ tradition: string; textId: string; verse: TextVerse }> {
  const lower = query.toLowerCase();
  const results: Array<{ tradition: string; textId: string; verse: TextVerse }> = [];

  for (const tradition of TRADITIONS) {
    for (const text of tradition.texts) {
      for (const chapter of text.chapters) {
        for (const verse of chapter.verses) {
          const haystack = `${verse.translation} ${verse.original} ${verse.transliteration ?? ''}`.toLowerCase();
          if (haystack.includes(lower)) {
            results.push({ tradition: tradition.id, textId: text.id, verse });
          }
        }
      }
    }
  }

  return results;
}
