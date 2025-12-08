# FitGenie 🏋️‍♂️

AI-powered workout plan generator with Groq AI and Supabase authentication.

## Features

| Feature | Description |
|---------|-------------|
| AI Workout Plans | Generates personalized routines based on goals, experience, equipment, injuries |
| Interactive Body Map | 48 clickable hotspots (front/back) for injury tagging |
| User Authentication | Google OAuth via Supabase |
| Dashboard | Save, view, and manage workout plans |
| AI Chat | Fitness Q&A assistant |
| Export | Markdown, PDF, Excel formats |

## Tech Stack

**Frontend:** Next.js 16, React 19, Tailwind CSS 4, Radix UI  
**Backend:** Groq SDK (Llama 4), Supabase (PostgreSQL + Auth)  
**Export:** xlsx-js-style, react-markdown

## Quick Start

```bash
npm install
```

Create `.env.local`:
```env
GROQ_API_KEY=your_groq_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/          # AI endpoints (chat, generate-workout, save-workout)
│   ├── auth/         # OAuth callback
│   ├── chat/         # Chat page
│   ├── dashboard/    # Saved workouts
│   └── planner/      # Main planner with body map
├── components/       # UI components
└── lib/              # Groq client, Supabase clients, prompts, utils
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/planner` | Workout generator with body map |
| `/chat` | AI fitness assistant |
| `/dashboard` | Saved workout plans (requires login) |

## Team

**Ayoub** (Frontend), **Filip** (Backend), **Eric** (Prompts/Export)

---

Generative AI Course | Semester 5 | December 2025

