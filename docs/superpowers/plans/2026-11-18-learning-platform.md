# Senior-interview learning platform: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Throughput into an interview-first learning platform. That means a
five-tab IA, global search, an open map with routes, richer lessons, about 49 new lessons
and about 24 new problems, without losing anyone's progress or offline support.

**Architecture:** Content stays typed TS data, aggregated in `src/content/index.ts` and
checked by one exported `checkCurriculum()` that both dev boot and a Vitest test call. Pure
logic (storage migration, route progress, readiness, search) lives in `src/lib/` with unit
tests. Screens are verified by typecheck, build, and a Playwright screenshot pass at
375/1024px in both themes. Content is authored in parallel by subagents into
pre-registered stub files, so nobody edits a shared file.

**Tech stack:** Vite 8, React 19, TS 6, Tailwind 4, react-router 7, idb-keyval,
lucide-react, vite-plugin-pwa. **Added:** `minisearch` (dep), `vitest` (dev dep).

**Spec:** `docs/superpowers/specs/2026-11-18-learning-platform-design.md`. Read it first.
**Content authors also read:** `docs/superpowers/plans/2026-11-18-content-brief.md`
(written in Task 3).

## Global constraints

- Mobile-first: 375px floor, interactive elements ≥44px (`min-h-11`), body text ≥16px,
  `min-h-dvh`, `pt-safe`/`pb-safe`/`pt-screen`/`pb-tabbar`, no sideways page scroll, wide
  content scrolls in its own container.
- Colours only through tokens (`ink*`, `paper`, `surface*`, `hairline`, `line*`;
  `streak`/`mastered`/`alert` are earned states only). New tokens go in both `:root` and
  `[data-theme='dark']`.
- `Inline` renders markup in plain containers only. Inside `<Link>`/`<label>`/`<button>`,
  use `plainText`.
- Focus modes (quiz, problem runner, review session) render outside `Shell` and have their
  own exit.
- Validator rules: every module and problem has ≥1 `figure` block. Every abbreviation is
  wrapped `[[X]]` once per unit and exists in the glossary (or `ALLOWED`). Every new block
  or figure kind is added to `blockTexts()`/`figureTexts()`.
- Storage: `version` bumps to 2. Older records and exports (v1) must load unchanged in
  meaning.
- Example code language is TypeScript.
- Commit to `main` after each task with the session's attribution lines. Never push.
- Long-running commands (dev server, preview) run in tmux: `sdj-dev`, logs in
  `~/logs/sdj-*.log`.

## Review focus

1. **A v1 learner halfway through Core** opens the new build. Expect no onboarding sheet,
   every pass/quiz/card intact, and Continue pointing into Core rather than the new
   Principles track. Pinned by Task 2 `migrate: mid-core learner`.
2. **Cold-loading a deep link** `/m/db-isolation#isolation-levels` or tapping a Section
   search result. Expect it to land on that heading, visible below the sticky top bar.
   Pinned by Task 4 `slug: stable and unique` + Task 10 manual check (`scroll-margin-top`).
3. **Awkward queries:** "2PC", "C++", "O(1)", one character, only punctuation. Expect no
   throw, sensible groups or suggestions, never a blank screen. Pinned by Task 4
   `search: awkward queries`.
4. **375px with a 5-participant sequence diagram or 100-column code.** The page must not
   scroll sideways. Pinned by the screenshot script's `scrollWidth` assertion (Task 7).
5. **An LLD attempt left running, or follow-up notes typed during the last phase.** Expect
   notes saved with the attempt and coverage computed with must > senior > staff weights.
   Pinned by Task 5 `framework: lld phases` and `readiness: attemptCoverage weights`.

---

## File structure (decisions)

```
src/content/
  types.ts            + Followup, Route, RouteStop, ProblemKind, ProblemCategoryId; Module.keywords/objectives/related;
                        Track.code/outcomes (drop `level`); Problem.kind/category/followups; Pattern.family/moduleId;
                        Block: callout tone 'example', 'codeCompare', 'followups'
  figures.ts          + 'sequence' | 'classes' | 'decision'
  tracks.ts           11 tracks, journey order
  categories.ts       NEW problem categories (hld + lld sets)
  routes.ts           NEW routes + readiness rounds + full-route builder
  legacy.ts           NEW LEGACY_LINE: the 25 module ids of the old line, frozen
  framework.ts        PHASES_BY_KIND + phasesFor(kind); PHASES kept as the hld list
  patterns.ts         system patterns get family; object patterns imported from patterns-object.ts
  patterns-object.ts  NEW design-pattern recognition entries (authored in content wave)
  glossary.ts         existing entries + spreads arrays from glossary/*.ts
  glossary/<key>.ts   NEW one file per content author (stubs first)
  modules/<track>.ts  NEW principles, designPatterns, lld, databases, distributed, architecture, production;
                      interview.ts gains behavioral modules
  problems/<id>.ts    NEW one per problem; problems/index.ts registers all, easy→hard within category
  index.ts            aggregation + relatedOf() + getTrack() + checkCurriculum()
  validate.ts         new kinds; problem skeleton + followups checks
  content.test.ts     NEW the curriculum has zero issues
src/lib/
  text.ts             NEW plainText (moved from Inline, re-exported there)
  slug.ts             NEW heading slugs shared by renderer, TOC, search
  storage.ts          ProgressState v2 + migrate()
  export.ts           parseImport → migrate()
  progress.ts         statuses without 'locked'; route helpers; activity
  readiness.ts        NEW readiness per round + attemptCoverage + practiceNext + surpriseMe
  search.ts           NEW MiniSearch index + grouped query
  highlight.ts        NEW tiny TS tokenizer
  *.test.ts           unit tests (Vitest, node env)
src/state/ProgressProvider.tsx   new actions
src/components/
  ui/  TopBar, SearchPill, Sheet, Segmented, Chip, ProgressRing, TrackIcon (+ Skeleton in Bits)
  content/ Blocks (+heading ids, codeCompare, followups, example), CodeView, Followups,
           FigureSequence, FigureClasses, FigureDecision (FigureView delegates)
  lesson/  LessonToc, ReadingProgress, Takeaways, RelatedRow
  line/LineMap.tsx  route-driven, collapsible, checkpoints, no locks
  onboarding/OnboardingSheet.tsx
src/routes/  HomeScreen, LearnScreen (replaces MapScreen), TrackScreen, ModuleScreen, SearchScreen,
             PracticeScreen, ProblemScreen, WalkthroughScreen, ReviewScreen, ReviewSessionScreen (from DrillScreen),
             YouScreen, GlossaryScreen, PatternsScreen
```

Route table (App.tsx). Shell routes: `/`, `/learn`, `/learn/:trackId`, `/m/:moduleId`,
`/search`, `/practice`, `/practice/:problemId/walkthrough`, `/review`, `/you`,
`/glossary`, `/patterns`. Focus routes: `/m/:moduleId/quiz`, `/practice/:problemId`,
`/review/session`. Redirect `/drill` → `/review`.

Id conventions (fixed now so routes, `related` and `suggests` can be written before
content exists). Track ids: `foundations, principles, design-patterns, lld, core,
databases, distributed, architecture, production, applied, interview`. Module and problem
ids are listed in the content brief (Task 3).

---

## Phase 1: Model, logic, and the content pipeline

### Task 1: Test harness, content model, validator for new kinds, curriculum check

**Files:**
- Modify: `package.json` (add `minisearch`, dev `vitest`; script `"test": "vitest run"`),
  `vite.config.ts` (add `test: { environment: 'node' }`).
- Modify: `src/content/types.ts`, `src/content/figures.ts`, `src/content/validate.ts`,
  `src/content/index.ts`, `src/content/tracks.ts`, all 10 `src/content/problems/*.ts`
  (add `kind: 'hld'`, `category`).
- Create: `src/content/categories.ts`, `src/content/legacy.ts`, `src/lib/text.ts`,
  `src/content/content.test.ts`, `src/content/validate.test.ts`.
- Modify: `src/components/content/Inline.tsx` (import and re-export `plainText` from
  `lib/text`).

**Interfaces (produces):**
```ts
// types.ts
export interface Followup { q: string; a: string }
export type ProblemKind = 'hld' | 'lld'
export type ProblemCategoryId = 'social'|'realtime'|'media'|'location'|'commerce'|'infra'|'data'|'lld-systems'|'lld-components'
export interface Track { id: string; code: string; title: string; blurb: string; outcomes: string[]; moduleIds: string[] }
// Module adds: keywords?: string[]; objectives?: string[]; related?: string[]
// Problem adds: kind: ProblemKind; category: ProblemCategoryId; followups?: Followup[]
// Pattern adds: family: 'system' | 'object'; moduleId?: string
// Block adds: callout tone 'example';
//   { kind: 'codeCompare'; before: { title: string; code: string }; after: { title: string; code: string }; note?: string }
//   { kind: 'followups'; items: Followup[] }
export type RouteStop = { module: string } | { problem: string }
export interface Route { id: string; title: string; blurb: string; stops: RouteStop[] }
// figures.ts adds:
//   { kind: 'sequence'; actors: string[]; steps: { from: number; to: number; label: string; tone?: FigureTone; dashed?: boolean }[]; note?: string }
//   { kind: 'classes'; classes: { name: string; stereotype?: 'interface' | 'abstract'; fields?: string[]; methods?: string[]; tone?: FigureTone }[];
//     relations: { from: string; to: string; kind: 'inherits' | 'implements' | 'has' | 'uses'; label?: string }[]; note?: string }
//   { kind: 'decision'; root: DecisionNode; note?: string }
//   type DecisionNode = { question: string; yes: DecisionNode | DecisionLeaf; no: DecisionNode | DecisionLeaf }
//   type DecisionLeaf = { answer: string; sub?: string; tone?: FigureTone }
// categories.ts
export interface ProblemCategory { id: ProblemCategoryId; title: string; kind: ProblemKind }
export const categories: ProblemCategory[]   // social 'Social & feeds', realtime 'Messaging & real-time', media 'Media & files',
                                              // location 'Location', commerce 'Commerce & booking', infra 'Infrastructure',
                                              // data 'Data & analytics', lld-systems 'Real-world systems', lld-components 'Reusable components'
// legacy.ts
export const LEGACY_LINE: readonly string[]  // the 25 current module ids in current line order
// lib/text.ts
export function plainText(text: string): string
// index.ts
export function checkCurriculum(): string[]   // all issues; dev boot logs them, the test asserts []
export function getTrack(id: string): Track | undefined
export function relatedOf(moduleId: string): Module[]   // own `related` ∪ modules listing it; deduped; excludes self
```

Existing problems get these categories: bitly `infra`, dropbox `media`, rate-limiter
`infra`, ticketmaster `commerce`, news-feed `social`, whatsapp `realtime`, youtube
`media`, web-crawler `infra`, ad-click `data`, uber `location`.

`tracks.ts`: 11 tracks in journey order, each with `code` (F, P, DP, L, C, DB, D, AR, O, A,
I) and 3 `outcomes`. The existing four keep their blurbs. Empty tracks are hidden by
`populatedTracks` as today.

`checkCurriculum()` absorbs today's DEV block and adds these checks:
- `related` ids exist and are not self.
- Pattern `moduleId` exists.
- Problem `category.kind === problem.kind`.
- Duplicate glossary ids.
- Routes: every stop exists, no duplicate stops (wired in Task 5).
- Problem skeleton (Task 3 turns it on as a hard requirement):
  - HLD walkthrough headings, in order, start with `Requirements`, `Core entities`,
    `API`, `High-level design`, then at least one `Deep dive`.
  - LLD headings start with `Requirements`, `Core objects`, `Classes`, `Key methods`,
    `Patterns`, `Concurrency`.
  - At least 3 `followups`.
  - Each check is gated by `STRICT_PROBLEMS` (a set of problem ids) until Task 19 removes
    the gate.

- [ ] **Step 1: Install and wire Vitest.** `npm i minisearch && npm i -D vitest`. Add the
  script and the `test` block.
- [ ] **Step 2: Write failing tests.**
  - `validate.test.ts`:
    - `blockTexts covers codeCompare titles and note but not code`.
    - `blockTexts covers followups q and a`.
    - `figureTexts covers sequence actors/labels, classes names/fields/methods/relation labels, decision questions/answers/subs`.
      Assert by running `validateContent` on a synthetic module whose only unexplained
      acronym (`QQX`) sits in each of those places. Expect an issue mentioning `"QQX"`
      every time, and no issue when it sits only inside `codeCompare.before.code`.
  - `content.test.ts`:
    - `curriculum has no issues`: `expect(checkCurriculum(), checkCurriculum().join('\n')).toEqual([])`.
    - `relatedOf is two-way`: with a fixture module listing `c-cap`, `relatedOf('c-cap')`
      contains it. Use the real data once Phase 2 lands, and a synthetic check via an
      exported pure `buildRelated(modules)` now.
- [ ] **Step 3: Run `npm test`.** Expect FAIL (kinds missing).
- [ ] **Step 4: Implement** the types, figure kinds, validator texts, categories, legacy,
  `text.ts`, the index functions and the problem fields. Export `blockTexts`/`figureTexts`
  only if tests need them. Otherwise test through `validateContent`.
- [ ] **Step 5: Verify.** Run `npm test && npm run typecheck`. Expect PASS. Run the dev
  server: the console shows no `[curriculum]` error.
- [ ] **Step 6: Commit.** `feat: content model for the learning platform`

### Task 2: Storage v2, migration, import

**Files:** Modify `src/lib/storage.ts`, `src/lib/export.ts`. Create `src/lib/storage.test.ts`.

**Interfaces (produces):**
```ts
export interface ProgressState {               // version 2
  version: 2
  lessonsRead; quiz; cards; attempts; streak; updatedAt        // unchanged v1 fields
  bookmarks: string[]                          // module ids, newest first
  lastPlace: { moduleId: string; sectionId?: string; at: number } | null
  routeId: string                              // default 'full'
  startStop: string | null                     // stop key 'm:<id>' | 'p:<id>'
  onboarded: boolean
  activity: Record<string, number>             // dayKey -> study actions, last 120 days
  recentSearches: string[]                     // newest first, max 8, case-insensitive dedupe
}
export function migrate(raw: unknown, isPassed?: (p: ProgressState, id: string) => boolean): ProgressState
export function stopKey(stop: RouteStop): string   // 'm:'+module | 'p:'+problem
```
`migrate` handles v1 (or a missing version) and v2. For v1 with any progress (non-empty
`lessonsRead`, `quiz` or `attempts`): `onboarded: true`, and `startStop = 'm:' +` the first
id in `LEGACY_LINE` that is not passed (lesson read + quiz best ≥ 0.8; compute inline so
there is no circular import with progress.ts), or `null` if all are passed. With no
progress: `onboarded: false`, `startStop: null`. `parseImport` keeps its envelope checks and
then returns `migrate(env.progress)` with a fresh `updatedAt`. `toJson` writes envelope
`version: 2`.

- [ ] **Step 1: Failing tests** in `storage.test.ts`:
  - `migrate: empty v1 → onboarding pending, route full`: `onboarded === false`,
    `routeId === 'full'`, `bookmarks` is `[]`, `activity` is `{}`.
  - `migrate: mid-core learner`: v1 with every Foundations id plus `c-framework`,
    `c-requirements` read and quiz best 0.9, and `c-modelling` read with quiz best 0.5.
    Expect `onboarded === true` and `startStop === 'm:c-modelling'`. `lessonsRead` and
    `quiz` are deep-equal to the input.
  - `migrate: v2 round-trips unchanged` (deep-equal except nothing).
  - `migrate: garbage fields are defaulted`: `bookmarks: 'x'` → `[]`, `activity: null` →
    `{}`, `recentSearches` longer than 8 → trimmed to 8.
  - `parseImport: v1 export imports`: a v1 envelope string → `ok`, `version === 2`, and
    `quiz` is preserved.
  - `parseImport: rejects non-Throughput JSON` (existing message).
- [ ] **Step 2:** Run `npx vitest run src/lib/storage.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement** in `storage.ts`/`export.ts` (`emptyProgress()` returns v2
  defaults).
- [ ] **Step 4:** Run `npm test && npm run typecheck`. Expect PASS. Typecheck errors in
  screens that read `version: 1` are fixed here.
- [ ] **Step 5: Commit.** `feat: progress v2 with lossless migration from v1`

### Task 3: Content scaffolding, content brief, dispatch the content wave

**Files:**
- Create stub arrays (exported, empty, already imported by index files):
  - `src/content/modules/{principles,designPatterns,designPatterns2,lld,databases,databases2,distributed,architecture,production}.ts`
  - `src/content/modules/behavioral.ts`. Its modules carry `trackId: 'interview'` and
    stations 3–5. Merged into the interview track by index.ts.
  - `src/content/glossary/{principles,designPatterns,designPatterns2,lld,databases,databases2,distributed,architecture,production,behavioral,problemsA,problemsB,problemsC,problemsD,problemsLld,existing}.ts`
  - `src/content/patterns-object.ts`
  - `src/content/problems/groups/{a,b,c,d,lld}.ts`. Each exports `Problem[]`. Authors put
    each problem in its own file under `problems/` and list it in their group file.
    `problems/index.ts` spreads the groups.
- Create: `docs/superpowers/plans/2026-11-18-content-brief.md`.

**Content brief contents (decisions the authors cannot make alone):**
- The quality bar from the spec's "Curriculum" section, verbatim.
- Module skeleton order: opening prose → figure → body → `example` callout → `say` →
  `trap` → `followups`.
- Fields: `objectives` (2–4), `keywords` (3–8 synonyms a learner might type), `related`
  (survey lessons this deepens).
- The id table below.
- Glossary rules:
  - Don't re-add any id already in `glossary.ts` (read it first).
  - Put new entries in your own `glossary/<key>.ts`. If you need an abbreviation another
    author owns (table below), wrap it and still add it to your file. The lead resolves
    duplicates.
- Commands:
  - `npm test -- src/content/content.test.ts`. Read only the issues naming your
    modules/problems.
  - `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -E '<your files>'`.
- Boundaries:
  - Edit only your files.
  - Never commit.
  - Never touch `index.ts`, `glossary.ts` or another author's files.
- Report back: the files written, abbreviations added, and open issues.

**Ids** (stations ascending in the order listed):

| Track / group | Owner key | Ids |
|---|---|---|
| principles | principles | p-oop, p-coupling, p-srp-ocp, p-lsp-isp, p-dip, p-simplicity, p-clean |
| design-patterns (1) | designPatterns | dp-intro, dp-factory, dp-builder-singleton, dp-adapter-facade-proxy |
| design-patterns (2) | designPatterns2 (writes `modules/designPatterns2.ts`; the lead merges) | dp-decorator-composite, dp-strategy-state, dp-observer, dp-command-template-chain, dp-anti; also `patterns-object.ts` (8–10 object patterns with `moduleId`) |
| lld | lld | l-round, l-modelling, l-extension, l-concurrency |
| databases (1) | databases | db-er, db-normalization, db-acid, db-isolation, db-engines |
| databases (2) | databases2 (`modules/databases2.ts` stub) | db-locking, db-replication, db-choosing, db-nosql-modelling |
| distributed | distributed | d-failure, d-consistency, d-consensus, d-time, d-transactions, d-delivery, d-resilience |
| architecture | architecture | ar-monolith, ar-events, ar-cqrs, ar-api, ar-edge |
| production | production | o-observability, o-slo, o-auth, o-security, o-deploy |
| interview (behavioral) | behavioral | i-star, i-influence, i-failure |
| problems A (social) | problemsA | instagram, fb-post-search, top-k, reddit |
| problems B (real-time, location) | problemsB | live-comments, google-docs, notifications, yelp, food-delivery |
| problems C (commerce) | problemsC | airbnb, auction, flash-sale, payments |
| problems D (infra, data) | problemsD | kv-store, job-scheduler, typeahead, metrics, online-judge |
| problems LLD | problemsLld | lld-parking-lot, lld-vending, lld-lru, lld-elevator, lld-library, lld-rate-limiter |
| existing problems | existing | add `followups` (3–5) and re-head the 10 existing walkthroughs to the skeleton (same content, headings renamed/split; "The bottleneck" folds into High-level design) |

Abbreviation owners (others wrap but defer): principles: OOP, SOLID, SRP, OCP, LSP, ISP,
DIP, DI, DRY, KISS, YAGNI. designPatterns: GoF, MVC. lld: UML. databases: ACID, ER, BCNF,
1NF, 2NF, 3NF, MVCC, WAL, LSM. distributed: 2PC, NTP, CRDT, HLC. architecture: CQRS, DDD,
REST-adjacent ones not yet in glossary, BFF. production: OIDC, RBAC, ABAC, SLI, SLO, MTTR,
TLS, mTLS, XSS, CSRF, OWASP. behavioral: STAR.

Problem `suggests` must name real module ids from the table or existing ones. LLD
problems use `kind: 'lld'`, categories `lld-systems` (parking lot, vending, elevator,
library) or `lld-components` (lru, rate limiter), and patterns from `patterns-object.ts`
by id. Authors of problems A–D/LLD may reference object-pattern ids that the DP(2) author
defines: `strategy, state, observer, factory, builder, singleton, adapter, decorator,
composite, command, template-method, chain-of-responsibility, facade, proxy`. Those exact
ids are fixed here.

- [ ] **Step 1:** Create the stubs and register them. Run `npm test`. Expect PASS (empty
  arrays are valid).
- [ ] **Step 2:** Write the brief.
- [ ] **Step 3: Commit.** `chore: scaffolding and brief for the content wave`
- [ ] **Step 4:** Dispatch 16 background subagents, one per owner key. Each gets: the
  spec path, the brief path, CLAUDE.md, a reference module (`c-caching` in `core.ts`), a
  reference problem (`ticketmaster.ts`), and its row.
- [ ] **Step 5:** Continue with Task 4 while they run. Each report is handled in Task 19.

### Task 4: Slugs, search engine

**Files:** Create `src/lib/slug.ts`, `src/lib/search.ts`, `src/lib/search.test.ts`.

**Interfaces (produces):**
```ts
// slug.ts
export function slugify(text: string): string            // plainText → lowercase → non-alnum runs to '-' → trim '-'
export function headingSlugs(blocks: Block[]): Map<number, string>  // block index → unique slug ('x', 'x-2', …)
// search.ts
export type HitType = 'lesson' | 'section' | 'term' | 'problem' | 'pattern'
export interface Hit { id: string; type: HitType; title: string; context: string; href: string; terms: string[] }
export interface SearchResult { groups: { type: HitType; hits: Hit[] }[]; total: number; suggestions: string[] }
export function search(query: string, limitPerGroup?: number): SearchResult   // lazy-builds the index on first call
export const POPULAR_TOPICS: string[]   // ['SOLID','ACID','CAP','Caching','Sharding','Observer','Isolation levels','Rate limiting']
```
Index fields: `title` (boost 4), `keywords` (3), `parent` (1.5, the lesson title for
sections), `text` (1).
- Options: `prefix: true`, `fuzzy: (t) => t.length > 4 ? 0.2 : false`,
  `combineWith: 'AND'`. If that gives 0 hits, retry with `'OR'`.
- Hrefs:
  - lesson `/m/:id`
  - section `/m/:id#slug`
  - term `/glossary#<ID>` (Search opens the sheet instead; see Task 10)
  - problem `/practice/:id`
  - pattern `/patterns#<id>`
- Group order: lesson, section, term, problem, pattern.
- Queries under 2 non-space chars return empty groups and no suggestions.
- `suggestions` come from `autoSuggest(query, { fuzzy: 0.3 })`, top 3, only when
  `total === 0`.
- Tokenizer: keep `2pc`, `c++`→`c`, `o(1)`→`o 1`. It must never throw on regex-special
  input.

- [ ] **Step 1: Failing tests:**
  - `slug: stable and unique`: blocks with two `heading` "Trade-offs" →
    `trade-offs`, `trade-offs-2`. `slugify('**[[CAP]]** in practice') === 'cap-in-practice'`.
  - `search: finds a lesson by title`: `search('caching').groups[0]` is a lesson group
    containing `f-cache` or `c-caching`.
  - `search: finds a section with a deep link`: `search('fan-out')`. Some section hit's
    `href` matches `/^\/m\/[\w-]+#/`.
  - `search: tolerates a typo`: `search('consistant').total > 0`.
  - `search: terms`: `search('TTL')` has a `term` hit with id `TTL`.
  - `search: awkward queries`: for each of `'2PC', 'C++', 'O(1)', 'x', '???', '   '`, no
    throw. `'x'` and `'???'` give `total === 0`.
  - `search: no results suggests`: `search('cachng zzqv').suggestions.length` ≥ 0 and the
    function returns `total === 0` without throwing. If MiniSearch suggests nothing, the
    UI falls back to `POPULAR_TOPICS`, which is the UI's job.
- [ ] **Step 2:** Run `npx vitest run src/lib/search.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement.** Section text = plainText of the blocks between this heading
  and the next (prose, list, callout, table cells, compare/ladder text), capped at 600
  chars. `context` = first ~110 chars of the summary, gist or section text.
- [ ] **Step 4:** Run `npm test`. Expect PASS.
- [ ] **Step 5: Commit.** `feat: offline full-text search over the curriculum`

### Task 5: Routes, progress helpers, framework by kind, readiness

**Files:**
- Create `src/content/routes.ts`, `src/lib/readiness.ts`, `src/lib/progress.test.ts`,
  `src/lib/readiness.test.ts`.
- Modify `src/lib/progress.ts`, `src/content/framework.ts`, `src/content/index.ts`
  (route checks).

**Interfaces (produces):**
```ts
// routes.ts
export const CHECKPOINTS: Record<string, string[]>   // trackId → problem ids placed after that track on the full route
export function buildFullRoute(): Route            // every populated track's modules in station order, then its checkpoints
export const routes: Route[]                       // full, two-weeks, system-design, lld, databases, behavioral
export function getRoute(id: string): Route        // falls back to full
export const ROUNDS: { id: 'system-design' | 'lld' | 'behavioral'; title: string; routeId: string; problemKind?: ProblemKind; target: number }[]
// system-design target 8 problems, lld target 4, behavioral lessons only
// progress.ts
export type ModuleStatus = 'available' | 'started' | 'passed' | 'mastered'   // 'locked' and isUnlocked removed
export function stopDone(p: ProgressState, stop: RouteStop): boolean   // module: passed; problem: any finished attempt
export function routeProgress(p: ProgressState, route: Route): { done: number; total: number }
export function nextOnRoute(p: ProgressState, route: Route): RouteStop | undefined
export function missingPrereqs(p: ProgressState, m: Module): Module[]
export function bumpActivity(activity: Record<string, number>, now?: number): Record<string, number>
export function weekActivity(activity: Record<string, number>, now?: number): { day: string; count: number }[]  // 7, oldest first
// framework.ts
export const PHASES_BY_KIND: Record<ProblemKind, Phase[]>   // Phase adds followups?: boolean
export function phasesFor(kind: ProblemKind): Phase[]
// readiness.ts
export function attemptCoverage(problem: Problem, attempt: ProblemAttempt): number  // weights must 3, senior 2, staff 1
export function bestCoverage(p: ProgressState, problemId: string): number | undefined
export interface RoundReadiness { id; title; score: number; lessonsDone: number; lessonsTotal: number; problemsCredit?: number; next?: RouteStop }
export function readiness(p: ProgressState): RoundReadiness[]
export function practiceNext(p: ProgressState, kind?: ProblemKind): Problem | undefined
export function surpriseMe(p: ProgressState, kind: ProblemKind, rand?: () => number): Problem
```
- Readiness `score`: `0.5 × lessonsDone/lessonsTotal + 0.5 × min(1, Σ bestCoverage over
  that kind's attempted problems / target)`. Behavioral is lessons only. `next`: the first
  unfinished module stop of that round's route, else `practiceNext(kind)`.
- `practiceNext`: among unattempted problems of `kind`, the highest share of `suggests`
  lessons read. Ties keep catalog order. If all are attempted, the lowest best coverage.
- `surpriseMe`: random among unattempted with ≥50% `suggests` read, else any unattempted,
  else any.

LLD phases: Clarify requirements 5 · Core objects 5 · Classes and relationships 15 · Key
methods 8 · Patterns and extensibility 7 · Concurrency and edge cases 5 (`followups:
true`). The HLD `deepdives` phase gets `followups: true`.

Initial `routes`, revised in Task 21 once content lands:
- `two-weeks`: f-what, f-network, f-api, f-db, f-cache, f-scale, c-framework,
  c-requirements, c-modelling, c-caching, c-sharding, c-cap, c-queues, a-realtime,
  a-contention, a-reads, a-writes, i-room, i-recognition + bitly, ticketmaster, news-feed,
  uber.
- `system-design`: F, C, A, I + all hld problems in catalog order.
- `lld`, `databases`, `behavioral`: whatever ids from the brief exist at build time, in
  brief order (filter by `getModule`), so they are valid now and fill in automatically.

`CHECKPOINTS` (full route):
- core → bitly, ticketmaster, news-feed
- databases → airbnb
- distributed → payments, kv-store
- architecture → notifications
- applied → whatsapp, uber, youtube, instagram
- lld → lld-parking-lot, lld-lru
- Missing ids are filtered out.

- [ ] **Step 1: Failing tests** in `progress.test.ts`:
  - `status never locked`: a fresh state gives `'available'` for `c-cap`.
  - `nextOnRoute: started wins`: `c-cap` read with quiz 0.5 → `{ module: 'c-cap' }`, even
    with an unread f-what.
  - `nextOnRoute: from startStop`: `startStop 'm:c-framework'`, nothing done →
    `{ module: 'c-framework' }`.
  - `nextOnRoute: wraps to earlier unfinished`: everything at or after the startStop done,
    `f-what` not → `{ module: 'f-what' }`.
  - `routeProgress counts real completions only`.
  - `missingPrereqs lists unpassed prereqs`.
  - `weekActivity returns 7 days oldest first with counts`.
  - `routes: every stop exists and no duplicates`: `checkCurriculum()` route section is
    empty for each route.
  - `framework: lld phases`: `phasesFor('lld')` minute sum `=== 45`, and the last phase
    has `followups`.
- [ ] **Step 2: Failing tests** in `readiness.test.ts`:
  - `attemptCoverage weights`: rubric with one each of must/senior/staff and only must hit
    → `0.5`.
  - `readiness: zero state`: three rounds, all scores 0, and each `next` defined.
  - `practiceNext prefers covered suggests`.
  - `surpriseMe deterministic with rand`: `() => 0` picks the first eligible.
- [ ] **Step 3:** Run `npm test`. Expect FAIL.
- [ ] **Step 4: Implement.** Remove `isUnlocked`/`nextModule`. Fix callers so typecheck
  passes; LineMap is temporarily simplified, then rewritten in Task 12.
- [ ] **Step 5:** Run `npm test && npm run typecheck`. Expect PASS.
- [ ] **Step 6: Commit.** `feat: routes, soft prerequisites, readiness`

### Task 6: ProgressProvider actions

**Files:** Modify `src/state/ProgressProvider.tsx`.

**Interfaces (produces):** context gains:
- `toggleBookmark(moduleId): void`
- `setPlace(moduleId, sectionId?): void`. Not a study action: no streak or activity.
  Throttled by callers.
- `chooseRoute(routeId, opts?: { skipBasics?: boolean }): void`. Sets `routeId`, plus
  `startStop` = the first stop of the route whose module's `trackId !== 'foundations'`
  when `skipBasics`, else `null`. Sets `onboarded = true`.
- `dismissOnboarding(): void`. Sets `onboarded = true`.
- `pushRecentSearch(q): void` and `clearRecentSearches(): void`.
- `study()` also applies `bumpActivity`.

- [ ] **Step 1:** Implement. Run `npm run typecheck`. Expect PASS.
- [ ] **Step 2: Commit** together with Task 7 (no standalone deliverable).

### Task 7: UI kit and screenshot harness

**Files:**
- Create `src/components/ui/{TopBar,SearchPill,Sheet,Segmented,Chip,ProgressRing,TrackIcon}.tsx`.
- Add `Skeleton` to `Bits.tsx`.
- Refactor `GlossarySheet.tsx` onto `Sheet`.
- Add code tokens to `index.css` (both themes): `--code-kw`, `--code-str`, `--code-com`,
  `--code-type`, `--code-num`, exposed as `text-code-*`.
- Create the screenshot script in the scratchpad (not the repo).

**Interfaces (produces):**
- `TopBar({ title?, back?: { to: string; label: string } | 'history', right?, children?, progress?: number })`:
  sticky, `pt-safe`, blurred `bg-paper/85`, and an optional 2px progress bar.
- `SearchPill({ autoFocusHint?: boolean })`: a Link to `/search`, ≥44px, shows "Search
  topics, terms, problems". On a fine pointer it also shows a `⌘K` kbd.
- `Sheet({ open, onClose, labelledBy, children })`: a bottom sheet on phones and a
  centred dialog from `sm`. Esc, backdrop and close button dismiss it. It locks body
  scroll, traps focus, and returns focus on close.
- `Segmented<T>({ value, options: { value: T; label: string }[], onChange, label })`:
  role radiogroup, ≥44px.
- `Chip({ active?, onClick?, to?, children })`.
- `ProgressRing({ value, size?: 28 | 40 | 56, label })`.
- `TrackIcon({ trackId, size? })`, a lucide map: foundations Blocks, principles Compass,
  design-patterns Puzzle, lld Boxes, core Network, databases Database, distributed Share2,
  architecture Building2, production Activity, applied Workflow, interview MessagesSquare.
- `Skeleton({ className })`.
- Every tappable card gets press feedback: `active:bg-surface-2` or a border change,
  with no layout shift.
- No Toast: bookmark state shows in place, and import/export keep their inline status
  line.

The screenshot script (`shoot.cjs`) takes routes × widths [375, 1024] × themes [light,
dark]. It sets `tp:theme` in localStorage before load. For each, it records a
`document.documentElement.scrollWidth > innerWidth` violation and console errors, then
prints them.

- [ ] **Step 1:** Implement the components and tokens. Run `npm run typecheck && npm run build`.
  Expect PASS.
- [ ] **Step 2:** Glossary sheet regression: open an abbreviation on `/m/f-network` via
  the script (click the first `[data-abbr]` button) and screenshot. The sheet renders and
  Esc closes it.
- [ ] **Step 3: Commit.** `feat: provider actions and UI kit`

## Phase 2: Screens

Each screen task ends with these checks:
- `npm run typecheck && npm run build`.
- The screenshot script on the task's routes at 375 and 1024 in both themes. Review the
  images.
- Zero `scrollWidth` violations and zero console errors.
- Commit.

### Task 8: Shell, routing, global keys, accessibility plumbing

**Files:** Modify `src/App.tsx`, `src/components/nav/Shell.tsx`. Delete
`src/routes/MapScreen.tsx` once LearnScreen exists (Task 12). Until then `/learn` renders
MapScreen.

- Tabs: Home `/` (Home icon), Learn `/learn` (Route icon), Practice `/practice` (Timer),
  Review `/review` (Layers, with a due-count dot when `due > 0`), You `/you` (CircleUser).
- `NavLink` `end` only for `/`. Learn is active for `/learn*` and `/m/*`. Practice is
  active for `/practice*`.
- Rail (≥1024): wordmark, a `SearchPill` (rail variant), then the tabs, then Reference
  links (Glossary, Patterns).
- Global keys: `/` and Ctrl/⌘K navigate to `/search` unless focus is in an
  input/textarea/contenteditable.
- Skip link "Skip to content" → `#main`.
- On pathname change: if there is a hash, scroll to the element (after paint, retry once
  after 50ms for lazy content). Otherwise scroll to the top unless the navigation is
  back/forward, and focus the first `h1` (`tabIndex=-1`) without scrolling.
- Route change gets a 150ms opacity fade on `main` (none under reduced motion).
- `/drill` → `<Navigate to="/review" replace>`. NotFound copy: "Nothing here", with
  buttons to Home and Search.
- `main` keeps its widths. Lesson routes widen to `lg:max-w-5xl` to leave room for the
  TOC column.

- [ ] Steps: implement, then run the screen-task checks above (routes `/`, `/learn`,
  `/practice`, `/review`, `/you`).

### Task 9: Lesson blocks and figures

**Files:** Modify `Blocks.tsx` and `Figure.tsx`. Create `CodeView.tsx`, `Followups.tsx`,
`FigureSequence.tsx`, `FigureClasses.tsx`, `FigureDecision.tsx`, `src/lib/highlight.ts`
and `src/lib/highlight.test.ts`.

**Interfaces:**
- `highlight(code: string): { text: string; kind: 'kw' | 'str' | 'com' | 'type' | 'num' | 'plain' }[]`.
  The concatenation of `text` must equal the input.
- `Blocks({ blocks, idPrefix? })`: headings get `id={slug}` and `scroll-mt-20`.
- `CodeView({ code, label? })`.
- `Followups({ items })`: native `<details>`/`<summary>`, each ≥44px. The summary is
  "Interviewer asks", the q, and a chevron. The body is "A strong answer" and the a.

Rendering decisions:
- `example` callout: `border-line` with a `surface` background, label "In the real
  world", Lightbulb icon (aria-hidden).
- `codeCompare`: two `CodeView`s, stacked below `md` and two columns at `md`. Titles in
  mono uppercase eyebrows. The before pane gets a 2px `alert` top border and the after
  pane a `mastered` one. These are earned verdicts, so the tokens are allowed.
- `sequence`: actor header row, N equal columns. Each step is a row with an arrow drawn
  between column centres `(i + 0.5) / N`, its label above the line, and a dashed line for
  `dashed`. `from === to` renders a note pill in that column. When N > 3 the inner grid
  gets `min-w-[30rem]` and scrolls inside the frame.
- `classes`: boxes in a responsive grid (1 col, 2 at `sm`, 3 at `lg`) with a header
  (stereotype `«interface»`), fields and methods in mono. Below the boxes, a relations
  list with the glyphs `▷` inherits, `⇢▷` implements, `◆` has, `⇢` uses, then the label.
- `decision`: nested indented branches (Yes/No chips), with leaves as tone boxes. Max
  depth 3 is enforced in `checkCurriculum`.

- [ ] **Step 1: Failing test** `highlight round-trips and tags keywords`:
  `highlight('const x = "a" // c')` joins back to the input. It contains
  `{ text: 'const', kind: 'kw' }`, a `str` and a `com`.
- [ ] **Step 2:** Implement everything. Add a dev-only fixture route
  `/__fixtures/blocks`, rendered only when `import.meta.env.DEV`. It shows one of every
  block and figure kind.
- [ ] **Step 3:** Run the screen-task checks on `/__fixtures/blocks`.

### Task 10: Search screen

**Files:** Create `src/routes/SearchScreen.tsx`.

- The input autofocuses. `q` syncs to `?q=` with `replace`. Input is debounced 80ms.
- Esc or the back button: `navigate(-1)` if there is history, else `/`.
- Combobox ARIA: input `role="combobox"`, `aria-controls`, `aria-activedescendant`.
  Results `role="listbox"` and rows `role="option"`. ↑/↓ moves, Enter opens.
- A term hit opens the glossary sheet (`useGlossary().open(id)`) instead of navigating.
- On open: `pushRecentSearch(q)` when `q.trim().length ≥ 2`.
- Empty state: Recent (with Clear), Popular chips (`POPULAR_TOPICS`), "Browse all topics"
  → `/learn?view=topics`.
- No results: "No match for “q”", the suggestions (as chips), the popular chips, and
  browse.
- Rows: type icon, title with matched `terms` wrapped in `<mark>` (styled
  `bg-line-soft text-ink`), context line, and the parent lesson for sections. Each group
  shows 5 hits with "Show all N", which expands in place.

- [ ] Steps: implement, then run the screen-task checks. Script cases: `/search`,
  `/search?q=isolation`, `/search?q=zzqv`. Manual check: Enter on a section result lands
  on its heading below the top bar.

### Task 11: Home and onboarding

**Files:** Create `src/routes/HomeScreen.tsx`, `src/components/onboarding/OnboardingSheet.tsx`.

The sections and their order are in the spec ("Home"). Data:
- Continue = `lastPlace` (with section anchor) when that module isn't passed, else
  `nextOnRoute`.
- Readiness uses `readiness()`.
- Practice next uses `practiceNext(p, 'hld')`, with Surprise me → `surpriseMe`.
- Review = due count over read modules' cards, and the minutes estimate is
  `ceil(due × 0.4)`.
- While `!ready`, render `Skeleton`s in place of every data card.
- The onboarding sheet shows when `ready && !onboarded`. It contains route radio cards
  (title, blurb, `n lessons · ~h hours`, where hours = Σ minutes / 60 rounded to the
  nearest half), the "skip Foundations" toggle, Start (`chooseRoute`) and Skip
  (`dismissOnboarding`).

- [ ] Steps: implement, then run the screen-task checks. Script cases: fresh state, and
  seeded state through a dev-only `/__fixtures/seed` route that calls `replaceAll` with a
  fixture and redirects to `/` (progress lives in IndexedDB, so it can't be seeded from
  the script).

### Task 12: Learn, Track, Patterns, Glossary anchors

**Files:**
- Create `src/routes/LearnScreen.tsx`, `TrackScreen.tsx`, `PatternsScreen.tsx`.
- Rewrite `src/components/line/LineMap.tsx`.
- Modify `GlossaryScreen.tsx`: entry anchors `id={entry.id}`, scroll on hash, and a back
  link to Learn.
- Delete `MapScreen.tsx`.

LineMap props: `({ route: Route, progress, expanded: Set<string>, onToggle(trackId) })`.
- Stops are grouped by the track of their module. Problem stops render as diamond
  checkpoint stations inside the preceding track group.
- Node shapes differ by status: hollow, dot, ring, check, and diamond for problems.
- Each station card: number, title, summary (`plainText`), status label, meter. When
  `missingPrereqs` is non-empty, it shows "Builds on: <first title>" in `ink-3`.
- The track header row is a `<button aria-expanded>` with TrackIcon, code, title,
  `done/total` and a ProgressRing.

LearnScreen:
- `?view=route|topics` (default route).
- Route switcher button → `Sheet` with route cards. `chooseRoute` keeps the current
  `startStop` unless the route changed.
- Sticky track chips row: scrolls horizontally, and tapping a chip expands that track and
  scrolls to it.
- Initially expanded: the track containing `nextOnRoute`.
- Topics view: track cards grid (1 col / 2 at `sm`), then Reference (Glossary, Patterns,
  Delivery framework → `/m/c-framework`).
- TrackScreen: header (icon, code, title, blurb, outcomes), the station list (same Station
  component), related problems (problems whose `suggests` intersect the track's modules),
  and prev/next track links.
- PatternsScreen: two sections, "System patterns" and "Object patterns", with cards
  `id={pattern.id}`. Each card shows the tell, the move, shows-up-in, and a link to its
  module.

- [ ] Steps: implement, then run the screen-task checks on `/learn`, `/learn?view=topics`,
  `/learn/core`, `/patterns`, `/glossary#TTL`.

### Task 13: Lesson screen

**Files:** Modify `src/routes/ModuleScreen.tsx`. Create
`src/components/lesson/{LessonToc,ReadingProgress,Takeaways,RelatedRow}.tsx`.

- `TopBar` with back `'history'`: fallback to `/learn/<trackId>`, the title shown once the
  h1 leaves the viewport (IntersectionObserver), a bookmark toggle (`aria-pressed`), and
  the reading progress (scroll fraction of the article).
- Header: eyebrow `Track title · 04`, H1, summary, minutes, status badge, Builds-on chips
  (Link per prereq, check icon when passed), objectives list.
- LessonToc: from `headingSlugs`. A `<details>` "On this page" under the header below
  `xl`, and a sticky right column at `xl`. The active heading is tracked by
  IntersectionObserver and also drives `setPlace` (throttled to 1 per 2s).
- After the blocks: RelatedRow, then Takeaways (cards as `<details>`), then the finish row
  (existing read/quiz logic), then "Next on your route" (the stop after this one in the
  current route; a problem stop links to its brief), then prev/next within the route.

- [ ] Steps: implement, then run the screen-task checks on `/m/f-network`, `/m/c-cap`,
  `/m/c-cap#…` (first heading slug).

### Task 14: Practice, problem runner, walkthrough

**Files:** Modify `PracticeScreen.tsx` and `ProblemScreen.tsx`. Create
`WalkthroughScreen.tsx`.

- Practice:
  - Segmented hld/lld, persisted in `?kind=`.
  - Category chips row jumps to category sections.
  - Filter chips: Easy/Medium/Hard (multi), status New/Attempted, and pattern (a sheet
    listing that family's patterns).
  - A Surprise me button.
  - Card: difficulty badge, title, brief (`plainText`, 2 lines), pattern names, status.
- Runner:
  - `phasesFor(problem.kind)`.
  - The brief stage has "Attempt on the clock" (primary) and "Study the walkthrough"
    (secondary). The secondary opens an inline confirm: "Trying it first makes it stick.
    Study anyway?" with Study / Attempt first.
  - In a `followups` phase, show `problem.followups` one at a time ("Interviewer asks",
    q, a textarea saved into `notes['fu:' + i]`, Next question).
  - Grading shows the strong answers under each follow-up.
  - The done stage shows `attemptCoverage` as a percentage and links to the walkthrough.
- Walkthrough (inside the shell):
  - Steps are `modelAnswer` split at `heading` blocks. Content before the first heading
    becomes step "Overview".
  - A stepper (horizontally scrolling chips with the phase name) and prev/next buttons.
    `?step=n` keeps the place.
  - The final step appends the `followups` block and the rubric.

- [ ] Steps: implement, then run the screen-task checks on `/practice`,
  `/practice?kind=lld`, `/practice/ticketmaster`, `/practice/ticketmaster/walkthrough`.

### Task 15: Review and You

**Files:** Create `ReviewScreen.tsx` and `ReviewSessionScreen.tsx` (moved from
`DrillScreen.tsx`, which is deleted). Modify `YouScreen.tsx`.

- Review overview: the due count and Start (→ `/review/session`), learned/total,
  per-track rows (due/learned, plus "Review this track" → `/review/session?track=<id>`),
  and the next due time. Empty states are kept from today's Drill.
- Session (focus mode):
  - Close control.
  - Card flip: a `rotateY` transition at 250ms, a plain swap under reduced motion.
  - Keys: Space reveals, 1–4 grade.
  - A summary at the end (reviewed n, again count) with Done → `/review`.
- You: readiness breakdown (each round: meter, lessons x/y, problems credit, next action
  link), stats tiles (kept), per-track progress list (ring + `done/total`, link to the
  track), Bookmarks (list, or an empty hint), recent attempts (kept), "Route and starting
  point" (opens the OnboardingSheet in edit mode), then appearance, install, backup and
  reset (kept). The glossary link moves to Learn.

- [ ] Steps: implement, then run the screen-task checks on `/review`, `/review/session`,
  `/you`.

## Phase 3: Content integration

### Task 16–18: Integrate each content report as it arrives

For each finished author (lessons first, then problems):
- [ ] Run `npm test -- src/content/content.test.ts`. Fix any remaining issues in that
  author's files.
- [ ] Merge the `designPatterns2` / `databases2` stubs into their track arrays once both
  halves exist. Stations must be contiguous.
- [ ] Resolve duplicate glossary ids: keep the better entry, delete the other.
- [ ] Read two random lessons per batch fully on screen at 375. Check the figures render,
  the code fits, and the follow-ups open.
- [ ] Commit per batch: `content: <track> track` / `content: <group> problems`.

### Task 19: Problem strictness on, existing problems aligned

- [ ] After the `existing` author reports, remove the `STRICT_PROBLEMS` gate so that every
  problem must meet the skeleton and have ≥3 follow-ups. Run `npm test`. Expect PASS.
- [ ] Commit: `content: every problem follows the interview skeleton`.

### Task 20: Cross-links and keywords on existing lessons

- [ ] Add `keywords` (3–6) to the 25 existing modules. Survey lessons need no `related`,
  because the back-links come from the new lessons. Run `npm test`. Commit.

### Task 21: Curate routes and checkpoints

- [ ] Replace the provisional lists in `routes.ts` with the final ones per the spec:
  - `two-weeks`: about 25 lessons spanning F/C/DB/D/A/I + bitly, ticketmaster, uber,
    instagram.
  - `system-design`: F, C, DB (db-acid, db-isolation, db-replication, db-choosing), D
    (d-consistency, d-transactions, d-delivery, d-resilience), AR (ar-events, ar-api),
    A, I + all hld problems in catalog order.
  - `lld`: P, DP, L, db-er, db-normalization, db-acid + lld problems.
  - `databases`: f-db, f-storage, c-modelling, c-sharding, c-cap, the DB track,
    d-transactions + airbnb, kv-store.
  - `behavioral`: f-what, i-room, i-star, i-influence, i-failure.
- [ ] Run `npm test`. Expect PASS. Commit.

## Phase 4: Polish and QA

### Task 22: Full QA pass

- [ ] Run the screenshot script over every route at 375/768/1024/1440 in light and dark.
  Expect zero scrollWidth violations and zero console errors. Review every image.
- [ ] Keyboard-only walk: skip link → search (⌘K) → result → lesson → TOC → quiz →
  review session keys. Focus is always visible and never trapped except in sheets.
- [ ] Reduced motion (`page.emulateMedia({ reducedMotion: 'reduce' })`): no flip
  animation and no fade.
- [ ] `npm run build`, then preview in tmux `sdj-preview`. The script, with the context
  offline after the first load: `/`, `/m/db-acid` and `/search?q=acid` all render.
- [ ] Bundle: report the gzip size of the main chunk. If it is over 350 kB, move
  `content/modules/*` behind a `manualChunks` split (still precached). Rebuild and
  re-verify offline.
- [ ] Fix what's found. Commit: `fix: QA pass`.

### Task 23: Docs

- [ ] CLAUDE.md:
  - The registry table gains routes, categories, the glossary/ split, patterns-object, and
    the new block and figure kinds.
  - Rewrite the "two bars" section: passing no longer unlocks, prereqs are "builds on".
  - Storage v2 notes.
  - The test command.
  - The content brief pointer.
- [ ] Replace the Vite-template README with a short product README.
- [ ] Commit: `docs: platform architecture and authoring guide`.
