# MeditationGuru - AI-Native Meditation & Yoga App

**Design Document**
**Date:** 2026-01-13
**Status:** Approved

---

## 1. Product Vision

**MeditationGuru** is the world's first AI-native meditation and yoga app featuring a unified AI guru powered by Gemini 2.5 Flash Live for real-time voice and video interaction.

### Core Concept
One unified AI guru - a photorealistic traditional yogi figure - exists within a breathtaking cosmic environment. This guru sees you, hears you, speaks to you in real-time. No pre-recorded content. No traditional ML pipelines. Pure conversational AI.

### What Makes It Revolutionary
- **Live Video Analysis**: Guru watches yoga poses via camera and speaks corrections naturally
- **Real-Time Meditation Generation**: Every session created for YOU in the moment
- **True Conversation**: Talk to your guru like a human teacher
- **Zero Friction**: One cosmic onboarding journey, then you're with your guru

### The Relationship
This isn't an app with features. It's a relationship with a wise guide who:
- Remembers everything about your journey
- Adapts to your energy and available time
- Genuinely cares about your progress
- Meets you wherever you are

---

## 2. Technical Architecture

### Frontend Stack
- **Next.js 14+** (App Router)
- **React 18** (UI Components)
- **Tailwind CSS** (Styling)
- **Three.js / React Three Fiber** (Cosmic 3D Environment)
- **Framer Motion** (UI Animations)
- **TypeScript** (Type Safety)

### Backend & Services

**Firebase Suite:**
- Authentication (Google Sign-In)
- Firestore (User data, routines, journey progress)
- Cloud Storage (Cached assets)
- AI Logic (Gemini integration)

**Gemini APIs:**
- Gemini 2.5 Flash Live (Real-time voice + video guru)
- Gemini 3.0 Flash Preview (Search, plan generation, text tasks)
- Native Audio (30 HD voices for guru)

### Real-Time Communication Flow
```
User Device                    Google Cloud
┌─────────────┐               ┌─────────────────┐
│ Camera      │───video───────▶│                 │
│ Microphone  │───audio───────▶│ Gemini 2.5      │
│             │                │ Flash Live      │
│ Speakers    │◀──voice────────│                 │
│ Screen      │◀──responses────│                 │
└─────────────┘               └─────────────────┘
      │                              │
      └────── WebSocket ─────────────┘
```

### Key Technical Decisions
- **No traditional ML models** - Gemini handles all pose analysis via prompts
- **WebSocket connection** - Persistent for low-latency live interaction
- **Firebase AI Logic** - Simplified Gemini integration with built-in auth

---

## 3. User Flows

### Flow 1: First-Time Onboarding (Visual Journey)
1. App opens → Cosmic environment loads
2. User floats through space
3. Glowing orbs drift past with labels (Reduce Stress, Sleep Better, Flexibility, Focus, Strength, Self Love)
4. User taps orb(s) that resonate
5. Brief experience question: "Have you meditated before?"
6. Guru materializes from stardust
7. "Welcome, seeker. I sense you wish to [goal]. Let's begin."
8. Prompt: Sign in with Google (to save journey)

### Flow 2: Returning User - Quick Start
1. App opens → Cosmos + Guru already present
2. Guru: "Welcome back. How are you feeling?"
3. User speaks or taps mood
4. Guru suggests session based on context
5. Session begins

### Flow 3: Yoga with Live Correction
1. User: "I want to practice yoga"
2. Guru: "Wonderful. What shall we focus on?"
3. User: "My back is stiff"
4. Guru: "Let's do 15 minutes of back-releasing poses. Enable your camera so I can guide you."
5. User grants camera permission
6. PiP mode: Guru demonstrates, user video in corner
7. Guru watches user, speaks corrections in real-time

### Flow 4: Goal-Based Search
1. User opens search / speaks to guru
2. "I have a job interview tomorrow and I'm nervous"
3. Gemini 3.0 Flash Preview analyzes intent
4. Guru: "Let me prepare you. I recommend a confidence meditation followed by power poses."
5. Presents personalized plan
6. User taps to begin or adjusts

---

## 4. UI/Visual Design

### Cosmic Environment (Three.js)

**Background Layers:**
- Deep space (dark blue/purple gradient, subtle stars)
- Nebula clouds (slowly morphing, pink/blue/purple)
- Floating particles (drift with parallax on mouse/scroll)
- Aurora wisps (animate slowly, respond to breathing exercises)
- Distant galaxies (subtle depth, very slow rotation)

**Interactive Elements:**
- Orbs glow brighter on hover
- Particles flow toward guru when speaking
- Background shifts color with session mood
- Stars pulse gently with guided breathing

### Guru Avatar

**Appearance:**
- Traditional Indian yogi aesthetic
- Serene, wise expression
- Flowing white/cream robes with subtle golden accents
- Semi-transparent cosmic glow around edges
- Seated in lotus position (meditation) or standing (yoga demos)
- Eyes that convey warmth and wisdom

**Animation States:**
- Idle: Gentle breathing, occasional blink
- Speaking: Subtle lip sync, hand gestures
- Listening: Slight head tilt, attentive expression
- Demonstrating: Full body yoga pose animations
- Transitioning: Materializes/dissolves into stardust

### UI Components (Tailwind)

**Color Palette:**
- Primary: Deep cosmic purple (#1a1a2e)
- Secondary: Nebula pink (#e94560)
- Accent: Stardust gold (#f5c518)
- Text: Soft white (#f0f0f0)
- Subtle: Muted blue (#16213e)

**Typography:**
- Headings: Elegant serif (Playfair Display)
- Body: Clean sans-serif (Inter)
- Guru speech: Slightly stylized (Cormorant Garamond)

**Components:**
- Glassmorphism cards (frosted, semi-transparent)
- Soft glowing buttons
- Floating action buttons with particle trails
- Progress constellation (interactive star map)
- Minimal, breathing-room-focused layouts

### Key Screens
1. **Cosmic Onboarding** - Full 3D journey through space
2. **Home / Guru Screen** - Guru centered, minimal UI, voice-first
3. **Session Active** - Guru + cosmic bg, timer subtle, PiP for yoga
4. **Journey Map** - Interactive constellation of your progress
5. **Search / Explore** - Natural language bar + floating category orbs
6. **Settings** - Clean list, voice selector, account management
7. **Saved Routines** - Personal library as galaxy clusters

---

## 5. Data Models (Firestore)

### User Profile
```typescript
users/{userId}
├── email: string
├── displayName: string
├── photoURL: string
├── createdAt: timestamp
├── lastSessionAt: timestamp
├── preferences: {
│   ├── guruVoice: string
│   ├── preferredDuration: number
│   ├── reminderTimes: string[]
│   ├── primaryGoals: string[]
│   └── experienceLevel: string
│   }
├── onboarding: {
│   ├── completed: boolean
│   ├── selectedOrbs: string[]
│   └── completedAt: timestamp
│   }
└── subscription: {
    ├── isDonor: boolean
    ├── donationTotal: number
    └── lastDonation: timestamp
    }
```

### Journey Progress
```typescript
users/{userId}/journey/{journeyId}
├── totalSessions: number
├── totalMinutes: number
├── currentStreak: number
├── longestStreak: number
├── stars: [
│   {
│     id: string
│     type: "session" | "streak" | "milestone"
│     label: string
│     earnedAt: timestamp
│     position: { x, y, z }
│     unlocked: boolean
│   }
│ ]
├── meditationMinutes: number
├── yogaMinutes: number
└── posesLearned: string[]
```

### Session History
```typescript
users/{userId}/sessions/{sessionId}
├── type: "meditation" | "yoga" | "mixed"
├── startedAt: timestamp
├── endedAt: timestamp
├── duration: number
├── mood: { before: string, after: string }
├── goals: string[]
├── techniques: string[]
├── guruNotes: string
├── yogaPoses: string[]
├── saved: boolean
└── rating: number
```

### Saved Routines
```typescript
users/{userId}/routines/{routineId}
├── name: string
├── description: string
├── createdAt: timestamp
├── type: "meditation" | "yoga" | "mixed"
├── estimatedDuration: number
├── goals: string[]
├── prompt: string
├── timesUsed: number
└── lastUsedAt: timestamp
```

### AI-Generated Plans
```typescript
users/{userId}/plans/{planId}
├── name: string
├── createdAt: timestamp
├── goal: string
├── totalDays: number
├── currentDay: number
├── schedule: [
│   {
│     day: number
│     type: "meditation" | "yoga" | "rest"
│     focus: string
│     duration: number
│     completed: boolean
│     completedAt: timestamp
│   }
│ ]
└── guruRecommendation: string
```

---

## 6. Features Summary

### Meditation
- **Core Essentials**: Breath-focused, body scan, mindfulness, loving-kindness
- **Comprehensive Library**: Guided visualization, mantra, transcendental, chakra, sound bath, yoga nidra, walking meditation
- **Goal-Driven Default**: "I'm anxious" → guru picks the right technique

### Yoga
- **Full Style Library**: Hatha, Vinyasa, Yin, Restorative, Ashtanga, Kundalini, Power Yoga, Prenatal, Chair Yoga
- **Pose-Based Approach**: "Let's work on hip openers"
- **Real-Time Corrections**: Live video analysis via Gemini

### Personalization
- **AI-Generated Plans**: Custom multi-day/week journeys
- **Saved Sessions**: Personal library of favorites
- **Adaptive Journey**: Guru remembers everything, evolves practice
- **Structured Programs**: Pre-designed paths with AI personalization

### Search & Discovery
- **Natural Language**: "I can't sleep" → perfect solution
- **Browse Categories**: Traditional explore & filter
- **Conversational**: Just ask the guru
- **Hybrid Search**: Smart search bar + categories + AI suggestions

### Duration
- **AI-Adaptive**: Tell guru your time, or let it suggest based on your energy

### Progress
- **Journey Map**: Visual constellation showing your path
- **Stars**: Light up as you progress through milestones

### Notifications
- **Gentle Nudges**: Soft reminders at user-set times
- **Smart Timing**: AI learns patterns, suggests optimal moments
- **Guru Check-ins**: Personal messages from your guru

### Business Model
- **Free + Donations**: Core app free, optional contributions

### Technical
- **Online Only**: Live AI requires internet connection
- **Voice Selection**: Choose from Gemini's 30 HD voices
- **Solo Experience**: No social features, pure 1:1 with guru

---

## 7. Implementation Phases

### Phase 1: Foundation
1. Project Setup (Next.js, Tailwind, Firebase, TypeScript)
2. Authentication (Google Sign-In)
3. Basic Cosmic UI (Three.js starfield, nebula)

### Phase 2: Core Guru Experience
4. Gemini Integration (Live API, Flash Preview, Audio)
5. Guru Avatar (Visual, animations, voice selection)
6. Conversation System (VAD, transcription, streaming)

### Phase 3: Features
7. Meditation Experience (Session flow, mood tracking)
8. Yoga Experience (Camera, PiP, pose feedback)
9. Search & Discovery (Natural language, categories)

### Phase 4: Personalization
10. Journey System (Constellation map, progress)
11. Routines & Plans (Save, generate, track)
12. Smart Features (Reminders, suggestions)

### Phase 5: Polish
13. Visual Refinement (Shaders, particles, transitions)
14. Onboarding Journey (3D cosmic flight, orbs)
15. Final Touches (Settings, donations, performance)

---

## 8. File Structure

```
meditationguru/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (main)/
│   │   ├── page.tsx              # Home / Guru screen
│   │   ├── session/
│   │   ├── journey/
│   │   ├── search/
│   │   ├── routines/
│   │   └── settings/
│   ├── onboarding/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── three/                    # 3D cosmic components
│   │   ├── CosmicScene.tsx
│   │   ├── Starfield.tsx
│   │   ├── Nebula.tsx
│   │   ├── Particles.tsx
│   │   └── GoalOrbs.tsx
│   ├── guru/
│   │   ├── GuruAvatar.tsx
│   │   ├── GuruSpeaking.tsx
│   │   └── VoiceSelector.tsx
│   ├── session/
│   │   ├── MeditationSession.tsx
│   │   ├── YogaSession.tsx
│   │   └── SessionControls.tsx
│   ├── journey/
│   │   └── ConstellationMap.tsx
│   └── ui/                       # Reusable UI components
├── lib/
│   ├── firebase.ts
│   ├── gemini.ts
│   ├── hooks/
│   └── utils/
├── contexts/
│   ├── AuthContext.tsx
│   ├── GuruContext.tsx
│   └── SessionContext.tsx
└── types/
    └── index.ts
```

---

## 9. Research Sources

### Meditation App Market
- [Best Meditation Apps Comparison 2025](https://www.themindfulnessapp.com/articles/best-meditation-apps-features-comparison-2025)
- [Top Meditation Apps 2026](https://www.engadget.com/apps/best-meditation-app-140047993.html)
- [Headspace vs Calm vs Insight Timer](https://routinebase.com/best-meditation-apps/)

### AI-Powered Wellness
- [Best AI Meditation Apps 2025](https://www.toolient.com/2025/10/best-ai-meditation-apps.html)
- [RelaxFrens AI Meditation](https://www.relaxfrens.com/ai-meditation-app)
- [AI Tools for Mindfulness](https://www.aiapps.com/blog/ai-tools-for-mindfulness/)

### Yoga AI Technology
- [AI Yoga App Development 2025](https://www.inexture.com/ai-powered-yoga-app-pricing-and-features/)
- [Yoga and AI 2025](https://asivanayoga.com/blogs/yoga-blog/yoga-and-artificial-intelligence)
- [QuickPose AI Yoga](https://quickpose.ai/our_services/yoga/)

### Gemini API
- [Gemini Live API Overview](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api)
- [Get Started with Live API](https://ai.google.dev/gemini-api/docs/live)
- [Firebase AI Logic Live API](https://firebase.google.com/docs/ai-logic/live-api)

---

**Document Status:** Ready for Implementation
