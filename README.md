# Throughput

Senior interview preparation that works on a phone, offline.

Throughput gets a software engineer ready for the three rounds that decide a senior
offer — **system design**, **OOP / low-level design**, and **behavioral** — by teaching the
concepts, drilling them, and then running the famous questions against the clock.

- **Learn** — 74 lessons across 11 tracks, from the vocabulary through SOLID, design patterns,
  databases (ACID, isolation, replication), distributed systems, architecture and production
  readiness, to running the room. Every lesson has figures, real-world examples, interviewer
  follow-ups, a quiz and review cards. Pick a route (the full journey, two weeks before an
  interview, or one round) and the app always knows what is next. Nothing is locked.
- **Practice** — 34 problems: Ticketmaster, Uber, Instagram, WhatsApp, YouTube, a payment
  system, a key-value store… and the low-level classics (parking lot, LRU cache, elevator).
  Each runs on a 45-minute phase timer with the interviewer's follow-ups, is graded against a
  must / senior / staff rubric, and has a step-by-step walkthrough.
- **Review** — spaced repetition over 208 cards from what you have read.
- **Search** — lessons, sections inside lessons, 141 illustrated terms, problems and 22
  patterns, from one box (`/` or ⌘K).
- **Readiness** — a score per interview round and the single thing that would raise it most.

No accounts and no backend: progress lives in IndexedDB on the device, and can be exported
and imported as a file. Installable as a PWA.

## Run it

```bash
npm ci
npm run dev        # http://localhost:5180
npm test           # unit tests + the whole-curriculum check
npm run build      # typecheck and production build
npm run preview    # serve the build (service worker included)
```

Vite 8, React 19, TypeScript, Tailwind 4, react-router 7, MiniSearch, Workbox.

## Working on it

`CLAUDE.md` is the guide to the codebase: where content lives, what to register when you add
something, the validator's rules, design tokens and mobile constraints. Content is typed
TypeScript data in `src/content/`; `docs/superpowers/plans/2026-11-18-content-brief.md` is the
voice and structure brief every lesson and problem follows.
