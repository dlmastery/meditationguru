# MeditationGuru

AI-powered meditation & yoga app with a real-time conversational AI guru powered by Google Gemini.

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router) with React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 + Framer Motion for animations
- **3D**: Three.js / React Three Fiber (cosmic background, particles, nebula)
- **State**: Zustand (global store at `src/lib/store.ts`)
- **Auth**: Firebase Auth (Google Sign-In)
- **Database**: Firebase Firestore
- **AI - Voice/Video**: Gemini 2.0 Flash Live via WebSocket (`src/lib/gemini.ts`)
- **AI - Text tasks**: Gemini 2.0 Flash for search, plan generation (`src/lib/gemini.ts`)
- **AI - Image gen**: Gemini 2.5 Flash Image for yoga pose illustrations (`src/lib/imagen.ts`)
- **Icons**: Lucide React

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (Inter, Playfair Display, Cormorant Garamond fonts)
│   ├── providers.tsx       # AuthProvider wrapper
│   ├── globals.css         # Cosmic theme, glassmorphism, animations
│   ├── page.tsx            # Home - guru conversation, mic/camera controls
│   ├── onboarding/         # Multi-step onboarding (goals, experience, guru intro)
│   ├── session/            # Active meditation/yoga session with timer, breathing guide
│   ├── search/             # Goal-based search
│   ├── journey/            # Progress constellation map
│   ├── routines/           # Saved routines
│   └── settings/           # User preferences
├── components/
│   ├── three/              # CosmicScene, Nebula, Starfield, Particles, GoalOrbs
│   ├── guru/               # GuruAvatar, VoiceSelector
│   ├── yoga/               # YogaPoseIllustration, YogaFlowCard
│   └── ui/                 # Button, GlassCard, Input, LoadingScreen, AILoadingSpinner
├── contexts/
│   └── AuthContext.tsx      # Firebase auth context
├── lib/
│   ├── firebase.ts         # Firebase app, auth, Firestore, storage init
│   ├── gemini.ts           # Gemini AI: system prompt, voices, live session (WebSocket)
│   ├── imagen.ts           # Yoga pose illustration generation, pose data, flows
│   └── store.ts            # Zustand store (user, guru, session, media, journey state)
└── types/
    └── index.ts            # All TypeScript interfaces
```

## Environment Variables

Defined in `.env.example`:
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID
- `NEXT_PUBLIC_GEMINI_API_KEY` - Google Gemini API key

## Key Architecture Decisions

- **No traditional ML models** - Gemini handles all pose analysis via live video prompts
- **WebSocket persistent connection** for low-latency voice/video with Gemini Live API
- **Dynamic imports** for Three.js components (`ssr: false`) to avoid SSR issues
- **All AI features are online-only** - requires internet for Gemini connection
- **Donation-based model** - core app is free

## Design System

- **Theme**: Dark cosmic (background `#0a0a12`, purple/pink nebula aesthetic)
- **Colors**: Primary `#e94560`, Secondary `#7b68ee`, Accent `#f5c518`
- **Fonts**: Headings=Playfair Display, Body=Inter, Guru speech=Cormorant Garamond
- **Components**: Glassmorphism cards, glow effects, floating particles
- **CSS classes**: `.glass`, `.gradient-text`, `.glow-primary`, `.animate-float`, `.animate-breathe`

## Guru Voice Options

6 preset voices (Gemini voice IDs): Puck (Sage), Charon (Ocean), Kore (Aurora), Fenrir (Mountain), Aoede (Lotus), Leda (River)

## Yoga Poses & Flows

30+ yoga poses defined in `src/lib/imagen.ts` with Sanskrit names and difficulty levels. 6 pre-built flows: Sun Salutation, Morning Energizer, Stress Relief, Hip Opening, Power Yoga, Evening Wind Down.

## Design Document

Full product design doc at `docs/plans/2026-01-13-meditation-guru-design.md`.
