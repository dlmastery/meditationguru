# MeditationGuru

Your AI-powered meditation and yoga companion with real-time voice guidance, stunning cosmic visuals, and personalized wellness journeys.

![MeditationGuru](https://img.shields.io/badge/version-1.0.0-purple) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Gemini](https://img.shields.io/badge/Gemini-AI-blue) ![Firebase](https://img.shields.io/badge/Firebase-Auth-orange)

## Features

- **AI-Powered Voice Guidance** - Real-time meditation and yoga instruction using Gemini 2.5 Flash Live
- **Intelligent Search** - Natural language search with intent parsing via Gemini 3.0 Flash Preview
- **Immersive 3D Visuals** - Cosmic backgrounds with Three.js (starfields, nebulas, particles)
- **Multiple Guru Voices** - Choose from 6 unique AI voices (Sage, Nova, Aurora, Bodhi, Luna, Zen)
- **Personalized Routines** - Morning Calm, Evening Wind Down, Stress Relief, Focus Flow
- **Progress Tracking** - Journey stats, streaks, and meditation history
- **Google Sign-In** - Secure authentication with Firebase

---

## Competitive Analysis

### Market Overview

The meditation and wellness app market is projected to reach $6.5 billion by 2027. MeditationGuru enters this space with a unique AI-first approach that differentiates it from established players.

### Competitor Comparison

| Feature | MeditationGuru | Calm | Headspace | Insight Timer | Down Dog |
|---------|---------------|------|-----------|---------------|----------|
| **Pricing** | Free | $16.99/mo | $12.99/mo | Free/$9.99/mo | $9.99/mo |
| **AI Voice Guidance** | Real-time Gemini | Pre-recorded | Pre-recorded | Pre-recorded | Synthesized |
| **Personalization** | AI-driven dynamic | Limited | Course-based | Teacher variety | Algorithm-based |
| **Yoga Content** | AI-generated | Limited | Basic | Community | Extensive |
| **3D Visuals** | Immersive cosmic | Static scenes | Animations | None | None |
| **Natural Language Search** | Gemini-powered | Basic | Basic | Tags only | Filters only |
| **Offline Mode** | Planned | Yes | Yes | Yes | Yes |
| **Live Sessions** | AI real-time | No | No | Yes | No |

### Detailed Competitor Analysis

#### Calm
- **Strengths**: Market leader, excellent sleep content, celebrity Sleep Stories, established brand
- **Weaknesses**: Expensive ($69.99/year), limited free tier, no real-time AI, static content library
- **Best For**: Sleep-focused users, celebrity content fans

#### Headspace
- **Strengths**: Beginner-friendly, structured courses, playful animations, science-backed
- **Weaknesses**: Limited personalization, no yoga, subscription required for most content
- **Best For**: Meditation beginners, structured learners

#### Insight Timer
- **Strengths**: 200,000+ free meditations, strong community, live events, renowned teachers
- **Weaknesses**: Overwhelming content volume, inconsistent quality, no AI personalization
- **Best For**: Budget-conscious users, community seekers

#### Down Dog
- **Strengths**: AI-generated yoga sequences, 60,000+ configurations, excellent form guidance
- **Weaknesses**: Limited meditation, no real-time voice, yoga-focused only
- **Best For**: Yoga practitioners, variety seekers

#### Aura
- **Strengths**: AI personalization, short 3-minute sessions, mood tracking
- **Weaknesses**: Limited depth, smaller content library, less established
- **Best For**: Busy professionals, quick sessions

### MeditationGuru's Competitive Advantages

| Advantage | Description |
|-----------|-------------|
| **Real-Time AI** | Gemini 2.5 Flash Live provides dynamic, responsive guidance - not pre-recorded content |
| **Unified Platform** | Meditation + Yoga + Breathwork in one app with consistent AI guidance |
| **Natural Conversations** | Ask anything in natural language - "I'm stressed about work" gets personalized response |
| **Immersive Experience** | Three.js cosmic visuals create a unique meditative atmosphere |
| **Cost-Effective** | Core features free, no subscription required for AI guidance |
| **Modern Tech Stack** | Built on Next.js 16, leveraging latest AI capabilities |

### Market Positioning

```
                    HIGH PERSONALIZATION
                           |
              Aura    MeditationGuru
                           |
    LOW COST ──────────────┼────────────── HIGH COST
                           |
         Insight Timer     |      Calm
                           |    Headspace
                    LOW PERSONALIZATION
```

### Target Users

1. **Tech-Savvy Wellness Seekers** - Users who want cutting-edge AI, not static content
2. **Variety Seekers** - Those wanting meditation AND yoga in one platform
3. **Budget-Conscious** - Users seeking quality without expensive subscriptions
4. **Visual Meditators** - Those who benefit from immersive visual experiences

---

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **AI**: Google Gemini 2.5 Flash Live (voice) + Gemini 3.0 Flash Preview (search)
- **3D Graphics**: Three.js / React Three Fiber
- **Authentication**: Firebase Auth with Google Sign-In
- **Database**: Cloud Firestore
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Styling**: Tailwind CSS with glassmorphism design

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project
- Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/meditationguru.git
cd meditationguru

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Firebase and Gemini API keys to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Gemini API
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home/landing page
│   ├── onboarding/        # User onboarding flow
│   ├── journey/           # Progress & stats
│   ├── search/            # AI-powered search
│   ├── session/           # Meditation/yoga sessions
│   ├── settings/          # User preferences
│   └── routines/          # Pre-built routines
├── components/
│   ├── three/             # 3D cosmic backgrounds
│   ├── guru/              # Voice selector, AI chat
│   └── ui/                # Reusable UI components
├── contexts/              # React contexts (Auth)
├── lib/                   # Utilities (Firebase, Gemini, Store)
└── styles/                # Global styles
```

---

## Roadmap

- [ ] Offline mode with cached sessions
- [ ] Apple Watch / Wear OS integration
- [ ] Social features & community
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] AR pose detection for yoga

---

## Sources & References

- [Best Meditation Apps: Features Comparison 2025](https://www.themindfulnessapp.com/articles/best-meditation-apps-features-comparison-2025)
- [Top 5 Meditation Apps in 2025](https://breethe.com/sleep-and-meditation-app-guide/compare-evaluate/top-5-meditation-apps-in-2025-honest-comparisons-real-user-insights)
- [Best AI Meditation Apps for Mindfulness in 2025](https://www.toolient.com/2025/10/best-ai-meditation-apps.html)
- [15 Best Yoga Apps in 2025](https://heywellness.com/yoga-apps)
- [The Best Yoga Apps of 2025](https://www.choosingtherapy.com/best-yoga-apps/)
- [Best Meditation Apps of 2025](https://www.choosingtherapy.com/meditation-apps/)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>MeditationGuru v1.0.0</strong><br>
  Built with Gemini AI + Next.js + Three.js
</p>
