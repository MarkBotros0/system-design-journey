# Throughput → a senior-interview learning platform

Date: 2026-11-18 · Status: draft for approval (builder check done)

## Intent

Throughput today is a polished but narrow system-design trainer: 25 lessons on one locked
line, 10 timed problems, 66 illustrated glossary terms. The owner wants it to prepare **any
software engineer for a senior interview**: the concepts of design, not coding syntax. It
should feel like a **learning platform**. That means a logical journey through every topic,
topics you can find instantly, and lessons rich in examples and visuals.

**The edge is UI and UX.** Content breadth matters, but what should set this apart is how
easy it is to find something, pick up where you left off, understand a concept from a
picture, and always know what to do next. When a trade-off appears between "more content"
and "a better experience", the experience wins.

## Goals

1. **Navigation you never think about.** From any screen a topic is at most two taps or one
   search away. Back always does what you expect. You always know where you are.
2. **Search that finds concepts, not just titles.** Typing "isolation levels", "SRP",
   "observer" or "read replicas" lands you on the right lesson, *at the right section*.
3. **A logically ordered journey** through all topics, with a recommended next step always
   visible and shorter focused routes for people with less time.
4. **Senior-level breadth:** software design principles (SOLID and friends), design
   patterns, low-level design, databases in depth (incl. ACID and isolation), distributed
   systems, architecture and APIs, production readiness, and behavioral answers for
   seniors. This is on top of the existing system-design tracks.
5. **Lessons that teach by showing:** every lesson has diagrams, real-world examples,
   before/after code where it helps, the line to say in the interview, the trap to avoid,
   and the follow-up questions an interviewer will ask.

## Non-goals

- Coding and algorithms. The owner ruled this out: seniors are judged on design, not
  syntax.
- Accounts, sync, a backend, AI features. The app stays single-user, local, offline.
- Rewriting content into MDX or another format. Content stays typed TypeScript data.
- A new visual identity. See "Visual direction".

## Anti-goals (would be a failure even if it "works")

- Navigation that grows deeper or more confusing as content triples.
- Lessons that become walls of prose. The figure and abbreviation rules must hold for
  every new unit.
- Losing anyone's existing progress, or an older export that no longer imports.
- Losing offline support, or a phone that stutters because the bundle ballooned.
- Hard locks that stop someone from opening the topic they searched for.

## Constraints (from the repo; unchanged)

- Vite 8, React 19, TS 6, Tailwind 4 configured in `src/index.css`, react-router 7,
  `idb-keyval`, `lucide-react`, `vite-plugin-pwa`.
- Mobile-first: 375px floor, touch targets ≥44px, body ≥16px, `min-h-dvh`, safe-area
  utilities, no sideways page scroll, reduced motion respected.
- Design tokens only (`ink`, `paper`, `surface`, `hairline`, `line`, earned states
  `streak` / `mastered` / `alert` never decorative). New colours go in both themes.
- Content rules enforced by `content/validate.ts`: every module and problem has ≥1 figure;
  every abbreviation is wrapped `[[ABBR]]` once per unit and has an illustrated glossary
  entry (or sits in `ALLOWED`). New block and figure kinds **must** be added to
  `blockTexts()` / `figureTexts()`.
- Markup renders through `Inline` only in plain containers. Text inside `<Link>` or
  `<label>` goes through `plainText`.
- Timed and scored screens (quiz, problem runner, review session) render outside the tab
  shell with their own exit.
- Storage shape changes: bump `version`, add a `migrate()` branch, and keep `parseImport`
  accepting older exports.

## Approaches considered (for the journey model)

| | Approach | Trade-off | Verdict |
|---|---|---|---|
| A | **Open map + recommended route.** Every topic open; one curated order; prereqs become "builds on…" hints | Someone can skip ahead; softened by hints | **Picked.** The owner handed over the how; it is the only option that satisfies both "find any topic" and "a logical path" |
| B | Keep hard locks, add search | Smallest change | Search would land on locked topics, the exact frustration described |
| C | Free catalog, no route | Easy browsing | Loses the guided journey the owner asked for |

## Information architecture

Five bottom tabs (rail at ≥1024px), plus one search that works from everywhere.

```
┌ Home ─── Learn ─── Practice ─── Review ─── You ┐   + Search (top bar · "/" · Ctrl/⌘K)
```

| Tab | Route | Job |
|---|---|---|
| **Home** | `/` | "What do I do now?": continue, next on route, cards due, a suggested problem, this week's activity |
| **Learn** | `/learn` | The journey (route view) and the catalog (topics view). Track pages at `/learn/:trackId` |
| **Practice** | `/practice` | Design problems, split **System design** / **Low-level design**, with filters |
| **Review** | `/review` | Spaced-repetition flashcards (today's "Drill", renamed for clarity) |
| **You** | `/you` | Stats, per-track progress, bookmarks, attempts, route choice, theme, backup, reset |

Other screens:

- `/m/:moduleId` lesson (inside the shell), `/m/:moduleId#<section-slug>` deep link.
- `/m/:moduleId/quiz`, `/practice/:problemId`, `/review/session`: focus modes, outside
  the shell.
- `/search?q=`: full-screen search. It is a route so the phone's back gesture closes it and
  a query can be linked.
- `/glossary` and `/glossary/:id`: reachable from Learn → Reference and from search, no
  longer buried under You.
- `/patterns`: the 8 recognition patterns as a cheat sheet (Learn → Reference).

Old URLs keep working: `/drill` redirects to `/review`. The map at `/` moves to `/learn`, and
`/` becomes Home.

### Top bar

Every tab screen gets a slim sticky top bar (safe-area aware, blurred surface):

- Mobile: screen title (or the wordmark on Home) left; search button and streak badge right.
  On Home and Learn the search appears as a full-width **search pill** under the title,
  since it is the primary way in.
- ≥1024px: the rail carries the wordmark, a search field (shows the `⌘K` hint) and the
  five destinations; the top bar holds the page title only.
- Lesson pages: back control on the left (returns to wherever you came from via history,
  falling back to the lesson's track page), a title that appears once the H1 scrolls away,
  a bookmark toggle, and a thin reading-progress bar along the bottom edge.

## Screens

### Home `/`

Top to bottom on a phone:

1. Wordmark, search pill, streak badge (earned colour only when the streak is live).
2. **Continue** hero (the one `line`-filled card on the screen): last lesson, the section you
   were in, a progress meter, minutes left. It resumes at that section. Before anything is
   started it becomes **Start your route** with the first stop.
3. **Next on your route:** a mini line showing the next three stops, with the current
   route's name and `12 / 68` progress. Tap → Learn.
4. **Review:** "14 cards due · ~5 min" → `/review/session`. Hidden when nothing has been
   read; "All caught up, next in 3 h" when nothing is due.
5. **Practice next:** one problem whose patterns you have mostly covered and haven't
   attempted (or your weakest past attempt).
6. **This week:** seven day dots (activity per day) and the streak.
7. **Explore tracks:** horizontal scroller of track cards with progress rings.

**First run:** a skippable sheet with one question and one toggle.

- "What are you preparing for?" lists the routes (Full journey / Interview in 2 weeks /
  System design round / OOP & LLD round / Databases deep dive).
- "I already know the basics, skip Foundations" (off by default).

The toggle only moves the **start pointer** (`startStop`) to the first stop after the
Foundations track on the chosen route. Nothing is marked done or skipped. Counts like
`12 / 68` always count real completions. Foundations stays open and expanded-on-demand. The
choices are editable in You.

**How "next" is chosen:** a module you have started but not passed, if any (today's rule).
Otherwise the first unfinished stop at or after `startStop`. Otherwise the first unfinished
stop anywhere on the route.

**Existing users (v1 → v2 migration):** if the record has any progress, `onboarded = true`
(no sheet), `routeId = 'full'`, and `startStop` = the first module of the *old* line they
had not passed. Someone halfway through Core carries on in Core. They are not sent back to
the new Software design track, which appears on their map as unstarted.

### Learn `/learn`

- Header: title, search pill, **route switcher** (a button showing the current route that
  opens a sheet listing all routes with lesson count and estimated hours).
- Segmented control: **Route** | **Topics**.
- **Route view:** the transit line, kept as the signature component, now spanning all
  tracks. A horizontally scrolling row of **track chips** at the top jumps to a track.
  Each track is a collapsible section with a header (icon, code, title, `done/total`, ring).
  The track containing your next stop starts expanded; finished tracks collapse to one row.
  Stations show status (not started / in progress / passed / mastered) and nothing is ever
  locked. A station whose prerequisites aren't done shows a quiet "Builds on: X" line, not
  a lock. **Checkpoints:** practice problems sit on the route as milestone stations
  (diamond nodes) after the tracks they test.
- **Topics view:** a catalog grid of the 11 tracks (icon, title, blurb, count, minutes,
  ring), then a **Reference** section: Glossary, Patterns cheat sheet, Delivery framework.
- **Track page** `/learn/:trackId`: intro, "you'll be able to…" bullets, the station list,
  related practice problems, and "Comes after / leads to" links to neighbouring tracks.
- The lesson page also shows a **Related** row (both directions, see Cross-links) just
  above Key takeaways.

### Lesson `/m/:moduleId`

- Breadcrumb eyebrow: `Learn › Databases in depth › 04`.
- H1, summary, meta row (minutes, status badge), **Builds on** chips (prereqs as links,
  each marked done or not). An optional **You'll learn** list (from `objectives`).
- **On this page:** a collapsible contents list on phones and a sticky right-hand column at
  ≥1280px. It is generated from `heading` blocks, which get stable slug ids.
- Body: blocks as today, plus the new kinds below.
- **Key takeaways:** the module's flashcards, shown as tap-to-reveal rows at the end. It is
  a recap with no extra authoring.
- **Finish row:** "Mark as read" (the explicit action stays; it is what puts cards into
  review), then the quiz CTA, then a **Next on your route** card and previous/next links.
- Position memory: the last section heading scrolled past is stored, and Continue on Home
  returns there.

### Search `/search`

- Opens focused, with the keyboard up on phones.
- **Empty query:** recent searches (clearable), popular topic chips (SOLID, ACID, CAP,
  Caching, Sharding, Observer pattern…), and "Browse all topics" → Learn/Topics.
- **Results** update as you type (debounced ~80ms) and are grouped: **Lessons**,
  **Sections** (a heading within a lesson, deep-linked to its anchor), **Terms**
  (glossary), **Problems**, **Patterns**. Each row has a type icon, the title with the
  matched words emphasised, and a one-line context snippet. Up to ~5 per group with "Show
  all".
- Typos and prefixes work: "isolatoin" and "consis" both find their lessons.
- **No results:** "No match for 'x'", the closest terms ("Did you mean…"), and browse links.
  Never a blank screen.
- Keyboard: ↑/↓ move, Enter opens, Esc closes. ARIA combobox/listbox semantics.
- Engine: **MiniSearch** (small, maintained, prefix + fuzzy + field boosts) over an index
  built lazily on first open from the content: module title/summary/keywords, section
  heading + its text, glossary id/full/gist, problems, patterns. Boosts: title > keywords >
  heading > body. Markup is stripped with `plainText`.

### Practice `/practice`

- Segmented: **System design** | **Low-level design**. Filter chips: difficulty, pattern
  (horizontal scroll). Cards show difficulty, patterns, status (new / best score / last
  attempted).
- Problem runner keeps its phase timer and self-graded rubric, now with the framework
  chosen by problem kind:
  - `hld` (existing): Requirements 5 · Entities 2 · API 5 · Data flow 5 (optional) ·
    High-level 15 · Deep dives 10.
  - `lld` (new): Clarify requirements 5 · Core objects 5 · Classes and relationships 15 ·
    Key methods 8 · Patterns and extensibility 7 · Concurrency and edge cases 5.
- Rubric bars (must / senior / staff) unchanged.

### Review `/review` and `/review/session`

- `/review` is an overview: due now, learned / total, per-track breakdown with a "review
  this track only" option, next due time.
- The session (focus mode) is today's drill UI plus a card-flip reveal (instant under
  reduced motion), keyboard shortcuts (Space reveals, 1–4 grade), and a "session complete"
  summary.

### You `/you`

Stats tiles, a per-track progress list, **Bookmarks**, recent attempts, **Route and
starting point** (re-run the first-run choices), appearance, install, backup, reset. The install,
backup and reset sections keep today's behaviour.

## Lesson building blocks (new)

All render through existing tokens; all must be added to `validate.ts`.

| Kind | Type | What it is | Why |
|---|---|---|---|
| `sequence` | figure | Participants as columns, messages as rows with arrows (self-messages and notes allowed) | OAuth flows, 2PC, isolation anomalies (two transactions interleaving), observer notifications |
| `classes` | figure | UML-lite: class/interface boxes (name, stereotype, a few fields/methods) plus relations (inherits, implements, has/composes, uses) | SOLID, every design pattern, LLD |
| `decision` | figure | A small yes/no tree ending in recommendations | "Which database?", "Which pattern?", "Monolith or microservices?" |
| `codeCompare` | block | Two code panes labelled e.g. "Violates SRP" / "Follows SRP", stacked on phones, side by side when wide, plus a note | Principles and patterns are best shown as a before/after |
| `followups` | block | Accordion of "Interviewer asks… / A strong answer…" pairs | Rehearses the senior follow-ups. Progressive disclosure keeps lessons scannable |
| callout tone `example` | block | "In the real world": a named, concrete case | The owner asked for examples. Gives them a consistent, recognisable home |

Rendering stays CSS-first with real text (the existing figure rationale). SVG only where
geometry carries meaning, e.g. arrows spanning sequence columns. At 375px, `classes` stacks
boxes vertically with relations drawn as labelled connectors between them, and `sequence`
may scroll horizontally *inside its own frame* when there are more than three participants.

Code samples (`code` and `codeCompare`) use **TypeScript** as the one example language.
It is concise, typed, and readable to Java, C# and Go engineers. A tiny in-house highlighter
covers keywords, strings, comments and types: no heavy dependency, tokens from the existing
palette.

## Curriculum (journey order)

Existing tracks keep their content. Prereqs become soft. Overlaps are cross-linked, not
duplicated: new tracks go *deeper* than the existing survey lessons and link back to them.

The order runs small to large. First comes the design of code (P, DP, L). Then the system
design survey (C), then its deep dives (DB, D, AR, O), then the applied patterns and the
room. Deep tracks come **after** the survey they deepen, so their "builds on" links always
point backwards.

**Cross-links** use a new optional `related?: string[]` on `Module` (validated ids), and
the UI shows it **in both directions**. A lesson's "Related" row lists its own `related`
plus every lesson that lists it. A new deep lesson names its survey lesson once (e.g.
`db-isolation` → `c-cap`), and the old survey lesson gains a "Go deeper" link
automatically, with no edits to existing content. There is no inline link markup:
`Inline`, `plainText` and the `<Link>` nesting rule stay as they are.

| # | Track (code) | Lessons |
|---|---|---|
| 1 | Foundations (F) | existing 7 |
| 2 | **Software design principles (P)**, new | OOP's four pillars · coupling and cohesion · SOLID: single responsibility & open/closed · SOLID: Liskov & interface segregation · SOLID: dependency inversion & injection · DRY, KISS, YAGNI and composition over inheritance · clean / hexagonal architecture |
| 3 | **Design patterns (DP)**, new | what patterns are for (and when they hurt) · creational: factory method & abstract factory · creational: builder & singleton (and why singleton is suspect) · structural: adapter, facade, proxy · structural: decorator & composite · behavioral: strategy & state · behavioral: observer & pub/sub · behavioral: command, template method, chain of responsibility · anti-patterns |
| 4 | **Low-level design (L)**, new | how the LLD round runs · modelling objects, responsibilities and relationships · designing for extension · concurrency in object design (thread safety, locks, immutability) |
| 5 | Core system design (C) | existing 8 |
| 6 | **Databases in depth (DB)**, new | relational modelling & ER · normalization (1NF→BCNF) and deliberate denormalization · ACID · isolation levels and anomalies · storage engines: B-tree vs LSM · locking, optimistic vs pessimistic, MVCC · replication in practice · choosing SQL vs NoSQL · modelling NoSQL for access patterns |
| 7 | **Distributed systems (D)**, new | failure modes and partial failure · consistency models · consensus and leader election (Raft) · time, clocks and ordering · distributed transactions: 2PC, saga, outbox · delivery guarantees & idempotency · resilience: timeouts, retries, circuit breakers, bulkheads, backpressure |
| 8 | **Architecture & APIs (AR)**, new | monolith, modular monolith, microservices · event-driven architecture · CQRS and event sourcing · API design in depth (REST/GraphQL/gRPC, pagination, versioning, idempotency keys, errors) · API gateway, service discovery, service mesh |
| 9 | **Production readiness (O)**, new | observability: logs, metrics, traces · SLIs, SLOs, SLAs and error budgets · authentication & authorization (sessions, OAuth 2/OIDC, JWT, RBAC) · security essentials (TLS, secrets, OWASP-level threats) · deployment & release (blue/green, canary, feature flags, migrations) |
| 10 | Applied patterns (A) | existing 8 |
| 11 | The interview (I) | existing 2 + **behavioral for seniors:** STAR stories that show scope · leading without authority, conflict and disagreement · failure, ownership and trade-off stories |

≈ 44 new lessons → ≈ 69 total. Each new lesson meets this bar:

- 8–15 minutes reading. At least **two** figures (validator still enforces one), at least
  one `example` callout, a `say` and a `trap` callout, a `followups` block (2–4 pairs),
  `codeCompare` or `code` wherever code clarifies (all of P, DP, L).
- 3 quiz items (4 options, one correct, an `explain` that teaches). 2–3 one-breath cards.
- `keywords` for search synonyms. `objectives` (2–4 bullets).
- Every abbreviation gets an illustrated glossary entry: ACID, MVCC, OOP, SOLID, SRP, OCP,
  LSP, ISP, DIP, DI, DRY, KISS, YAGNI, ER, BCNF, LSM, WAL, 2PC, OIDC, RBAC, SLI, SLO, SLA,
  MTTR, CQRS, DDD, UML, STAR, … as they appear.

**New practice problems**

**Patterns get two families.** `Pattern` gains `family: 'system' | 'object'`. The existing
eight are `system`. New `object` entries cover the design patterns, using the same "tell →
move" shape (e.g. tell "behaviour varies by type and keeps growing" → move "Strategy:
inject the varying behaviour behind an interface"), and point at their DP lesson. HLD
problems reference `system` patterns and LLD problems reference `object` patterns.
Practice's filter chips show the family of the current tab. The `/patterns` cheat sheet
has two sections. "Practice next" weighs how many of a problem's `suggests` lessons are
read.

- LLD (`kind: 'lld'`): Parking lot (easy), Vending machine (easy), LRU cache (medium),
  Elevator system (medium), Library/booking system (medium), Rate limiter as classes
  (hard). The model answers use `classes`, `codeCompare` and `sequence`.
- HLD additions: Notification service (medium), Payment system (hard), Distributed
  key-value store (hard).

**Routes** (`content/routes.ts`): ordered lists of `{ module }` and `{ problem }` stops.

- **Full journey:** all tracks in the order above, with problems as checkpoints after the
  tracks they exercise.
- **Interview in 2 weeks:** the highest-yield ~25 lessons + 4 problems.
- **System design round:** F, C, DB (selected), D (selected), AR (selected), A, I + HLD
  problems.
- **OOP & LLD round:** P, DP, L, DB (modelling, normalization, ACID) + LLD problems.
- **Databases deep dive:** f-db, f-storage, c-modelling, c-sharding, c-cap, the DB track,
  D (transactions).

## Data model changes

- `Track`: add `code` (short label), `icon` (a lucide icon name from a fixed map),
  `outcomes: string[]`. `Level` widens to the new tracks.
- `Module`: add optional `keywords?: string[]`, `objectives?: string[]` and
  `related?: string[]` (see Cross-links). `prereqs` keeps
  its shape. Its meaning changes from "unlocks" to "builds on". `station` stays the
  in-track order.
- `Pattern`: add `family: 'system' | 'object'` and optional `moduleId` (the lesson that
  teaches it).
- `Problem`: add `kind: 'hld' | 'lld'` (default `hld`). `framework.ts` exports a phase list
  per kind.
- New `Route { id, title, blurb, items: ({ module: string } | { problem: string })[] }`.
  Validated: every id exists, no duplicates.
- `ProgressState` → **version 2**: adds `bookmarks: string[]`, `lastPlace: { moduleId,
  sectionId?, at } | null`, `routeId: string`, `startStop: string | null`,
  `onboarded: boolean`, `activity: Record<dayKey, number>`,
  `recentSearches: string[]` (max 8). `migrate()` fills defaults for v1, as described under First run. `parseImport`
  accepts v1 and v2. Existing progress is untouched.
- `progress.ts`: `isUnlocked` and `locked` status removed from the UI path. `nextModule` →
  `nextOnRoute(progress, route)`. New helpers: `routeProgress`, `trackProgress` (exists),
  `missingPrereqs(module)`.

## Visual direction

**Keep the identity:** Familjen Grotesk / Source Serif 4 / IBM Plex Mono, the cobalt `line`
accent, the transit-line metaphor, earned-state colours. The design-intelligence search
recommended "Minimalism & Swiss, documentation pattern with a prominent search bar and
category grid". That matches this identity, and it validated the structural moves (search
pill, topic catalog) rather than a reskin. Its suggested palette and fonts would discard a
coherent system for no gain, so they are not adopted.

Refinements:

- New shared components: `TopBar`, `SearchPill`, `Sheet` (generalised from
  `GlossarySheet`), `Segmented`, `Chip`, `ProgressRing`, `TrackIcon`, `Skeleton`, `Toast`.
- Track identity through **icon + mono code** (e.g. `DB`), never per-track colours. That
  keeps the one-accent rule.
- Icon sizes as tokens (16 / 20 / 24), one stroke weight per layer.
- Press feedback on every tappable card (subtle bg/border change within ~100ms, no layout
  shift). Skeletons instead of zeros while IndexedDB loads (`ready === false`).
- A subtle fade on route change, disabled under reduced motion.
- Measure: lesson body max ~68ch. At ≥1024px Learn uses two columns (line + track detail),
  and lessons get the contents column.

## Accessibility

Focus moves to the H1 on route change. Skip-to-content link. `aria-current` on nav. The
search combobox pattern. Sheets trap focus and restore it on close. Every icon-only button
is labelled. Colour is never the only status signal (status nodes also differ in shape and
icon). Both themes are checked for 4.5:1 text contrast. All new figures carry real text and
a caption.

## Performance and offline

All content stays precached and offline. The search index is built lazily on first open
(not at boot). The whole bundle is measured after content lands. If the main chunk exceeds
roughly 350 kB gzip, the builder moves the content (or the lesson bodies) into a separate
chunk, still precached by Workbox.

## Delivery plan (phases, each ends green: typecheck, build, validator clean)

1. **Platform:** storage v2 + migration, routes, soft prereqs, the new IA (Home, Learn,
   track page, Search, Review, top bar, rail), lesson reader upgrades, new block and figure
   kinds plus validator support, LLD framework in the runner. Proven on the existing
   content.
2. **Content:** new tracks authored in parallel batches (one subagent per track, given this
   doc, CLAUDE.md's content rules and an existing module as the style reference). The lead
   reviews each batch, runs the validator, and fixes what it reports.
3. **Problems, glossary and routes:** new problems, glossary entries, route curation.
4. **Polish and QA:** 375 / 768 / 1024 / 1440, light and dark, reduced motion, keyboard
   only, offline (`build` + `preview`), console clean. CLAUDE.md updated (registry table,
   soft-prereq semantics, new kinds, routes).

One commit (or a few) per phase on `main`, matching the repo's history. Nothing is pushed
unless the owner asks.

## Left to the builder

Exact component APIs and file split. The highlighter's token rules. MiniSearch field boosts
and fuzziness. The algorithm behind "practice next". The pixel layout of the `classes` and
`sequence` figures within the stated constraints. Exact lesson wording and which lessons
get two versus three figures. Whether old existing lessons get `followups` / `example`
callouts retrofitted (nice to have, after the new tracks).
