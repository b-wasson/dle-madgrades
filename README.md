# Madgrades DLE

Two daily games built on UW-Madison grade data from [Madgrades](https://madgrades.com).

- **Higher / Lower** (`/`) — Given two courses, pick which has the higher GPA or fail rate
- **Trivia** (`/trivia`) — 4-option multiple choice: hardest/easiest course in a subject, or campus-wide superlatives

Both games have a **daily mode** (date-seeded, streak tracked in localStorage) and an **infinite mode** (random, session score only). After a daily answer, aggregate community stats (% correct, total responses) are shown.

## Getting started

```bash
cd web
npm install
npm run dev   # http://localhost:3000
```

> **WSL note:** if you get a `lightningcss.linux-x64-gnu.node` error, run:
> `npm install lightningcss-linux-x64-gnu`

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS v4
- TypeScript

## File structure

```
web/
├── data/
│   └── stats.json              # Community answer stats (game:date → {total, correct})
│
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout — Nav, page wrapper, attribution footer
│   │   ├── page.tsx            # Higher/Lower page (server component)
│   │   ├── globals.css         # Tailwind v4 import, theme tokens, hover/tap CSS classes
│   │   ├── trivia/
│   │   │   └── page.tsx        # Trivia page (server component)
│   │   └── api/stats/
│   │       └── route.ts        # GET/POST daily stats with in-process IP deduplication
│   │
│   ├── components/
│   │   ├── HigherLowerGame.tsx # Full H/L game UI — client component
│   │   ├── TriviaGame.tsx      # Full trivia game UI — client component
│   │   ├── CommunityBar.tsx    # Two-tone % bar shown after daily answer
│   │   └── Nav.tsx             # Top nav with active-route highlighting
│   │
│   ├── lib/
│   │   ├── types.ts            # Shared TypeScript interfaces
│   │   ├── seed.ts             # getDailySeed(), makeSeededRandom()
│   │   ├── questions.ts        # generateHLPair(), generateTriviaQuestion() — pure, seeded
│   │   ├── storage.ts          # localStorage helpers for streaks and daily state
│   │   ├── stats.ts            # Server-side fs read/write for data/stats.json
│   │   └── api.ts              # Client-side fetch helpers for /api/stats
│   │
│   └── data/
│       └── courses.json        # 3,816 courses, 187 subjects — do not edit by hand
│
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Architecture notes

**Server → client data flow:** The page server components generate the daily question deterministically from the date seed, then pass all course data and the pre-computed question as props to the client game components.

**Daily seeding:** `getDailySeed()` returns an integer from the current date (`YYYYMMDD`). H/L uses `seed + 1` and trivia uses `seed + 2` so they never share a random sequence.

**Hydration:** All client state initializes to a server-safe default (`'playing'`, `null`, `{ streak: 0, bestStreak: 0 }`). A single `useEffect` on mount reads localStorage and updates state, preventing SSR/client HTML mismatches.

**Trivia question types:** two modes selected randomly — *subject mode* asks which course in a given subject had the highest/lowest GPA or fail rate; *superlative mode* asks the same across courses from four different subjects.

**Community stats:** stored in `data/stats.json` as `{ "hl:2026-05-17": { total, correct }, … }`. The API writes atomically (tmp file → rename). Only recorded for daily mode.

## Course data shape

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

Course data is pre-generated from UW-Madison registrar PDFs via the [madgrades-extractor](https://github.com/madgrades/madgrades-extractor) project.
