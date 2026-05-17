# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Madgrades DLE is a Next.js 16 web app with two daily games built on UW-Madison grade data:

- **Higher / Lower** (`/`) — Given two courses, pick which has the higher GPA or fail rate
- **Trivia** (`/trivia`) — 4-option multiple choice from "hardest course in a subject" and campus-wide superlative questions

Both games have a daily mode (date-seeded, streak tracked in localStorage) and an infinite mode (random, session score only). After answering the daily challenge, aggregate community stats (% correct, total responses) are shown — stored server-side in `web/data/stats.json`.

Course data is pre-generated from UW-Madison registrar PDFs via the madgrades-extractor project and lives in `web/src/data/courses.json` (3,816 courses, 187 subjects).

## Web App (`web/`)

### Commands

```bash
cd web
npm run dev      # development server (Next.js 16 + Turbopack)
npm run build    # production build
npm run lint     # ESLint
npx tsc --noEmit # type-check without building
```

### Architecture

Pages are server components that generate the daily question deterministically from the date seed, then pass all course data and the pre-computed daily question as props to client components.

```
app/
  page.tsx              # Higher/Lower landing page — server component
  trivia/page.tsx       # Trivia page — server component
  api/stats/route.ts    # GET/POST aggregate daily stats (reads/writes data/stats.json)
  layout.tsx            # Root layout with Nav
  globals.css           # Theme tokens (@theme), hover/tap CSS classes

components/
  HigherLowerGame.tsx   # Full H/L game — client component
  TriviaGame.tsx        # Full trivia game — client component
  CommunityBar.tsx      # Two-tone % bar shown after daily answer
  Nav.tsx               # Top nav with active-route highlighting

lib/
  types.ts              # Shared TypeScript interfaces (Course, HLPair, TriviaQuestion, …)
  seed.ts               # getDailyKey(), getDailySeed(), makeSeededRandom()
  questions.ts          # generateHLPair(), generateTriviaQuestion() — pure functions
  storage.ts            # localStorage read/write for streaks and daily completion state
  stats.ts              # Server-side fs read/write for data/stats.json (used by API route only)
  api.ts                # Client-side fetch helpers for /api/stats

src/data/
  courses.json          # Pre-generated course data — do not edit by hand
```

### Key Design Decisions

**Hydration**: All client component state initializes to the server-safe default (`'playing'`, `null`, `{ streak: 0, bestStreak: 0 }`). A single `useEffect` on mount reads localStorage and updates state — this prevents SSR/client HTML mismatches.

**Daily seeding**: `getDailySeed()` returns an integer from the current date (`YYYYMMDD`). H/L uses `seed + 1`, trivia uses `seed + 2` so they never pick the same random sequence.

**Community stats**: Stored in `web/data/stats.json` as `{ "hl:2026-05-17": { total, correct }, … }`. The API route writes atomically (tmp file → rename). Only recorded for daily mode — infinite questions aren't shared across users.

**CSS**: Tailwind v4 (`@import "tailwindcss"`, `@theme` block for custom tokens). Hover/tap effects are in `globals.css` as `.hl-card`, `.trivia-option`, `.action-btn` classes since inline styles can't express pseudo-selectors.

### Course Data Shape

```ts
interface Course {
  uuid: string
  name: string
  number: number
  subjectCode: string   // numeric registrar code
  subjectName: string   // e.g. "Computer Sciences"
  subjectAbbrev: string // e.g. "COMP SCI"
  avgGpa: number        // weighted avg across all terms/sections
  failRate: number      // F count / total graded students
  totalStudents: number
}
```
