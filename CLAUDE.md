# Throughput — Claude Code context

## What this is

A mobile-first learning platform that prepares a software engineer for **senior interviews**:
the system design round, the OOP / low-level design round, and the behavioral round.

- **Learn** — eleven tracks of lessons ("stations"), each with a lesson, a quiz and review
  cards, laid out on a *route* (a path through them). Nothing is locked; the route only
  decides what "next" means.
- **Practice** — famous interview questions (Ticketmaster, Uber, Instagram, a parking lot…)
  run against a 45-minute phase timer, with interviewer follow-ups and a self-graded rubric,
  plus a step-by-step walkthrough of each model answer.
- **Review** — spaced repetition over the cards of every lesson read, and the **question
  bank**: quick single-choice, select-all, true/false and matching questions on every lesson,
  a few a day ("Daily questions"), each linking to the section that teaches it.
- **Search** — one box over lessons, sections inside lessons, glossary terms, problems and
  patterns (`/` or ⌘K from anywhere).

Single user, no backend, no accounts. Everything is local and works offline.

The product design is `docs/superpowers/specs/2026-11-18-learning-platform-design.md`; the
voice and structure rules for content are `docs/superpowers/plans/2026-11-18-content-brief.md`.

## Stack

Vite 8 · React 19 · TypeScript 6 · Tailwind 4 (`@tailwindcss/vite`) · react-router 7 ·
`idb-keyval` · `lucide-react` · `minisearch` · `vite-plugin-pwa` · Vitest.

No CSS framework config file — Tailwind 4 is configured entirely in `src/index.css` via
`@theme inline`.

```bash
npm run dev        # port 5180, strict
npm run typecheck  # tsc --noEmit
npm test           # vitest run — includes the whole-curriculum check (content.test.ts)
npm run build      # tsc -b && vite build
npm run icons      # regenerate PNG app icons from public/favicon.svg (needs sharp)
```

## Layout

```
src/
├── content/              THE CURRICULUM — typed data, the thing that grows
│   ├── types.ts          Block / Module / QuizItem / CardItem / Problem / Route / Pattern
│   ├── figures.ts        the Figure union (11 primitives)
│   ├── framework.ts      interview phases + minute budgets, per round (hld / lld)
│   ├── tracks.ts         the 11 tracks, in journey order
│   ├── routes.ts         route specs (full, two-weeks, system-design, lld, databases,
│   │                     behavioral), checkpoints, and the readiness ROUNDS
│   ├── categories.ts     Practice shelves (social, realtime, … lld-components)
│   ├── patterns.ts       system patterns + patterns-object.ts (design patterns)
│   ├── glossary.ts       base terms + glossary/<author>.ts files, each with a figure
│   ├── modules/          one file per track (two tracks split across two files)
│   ├── problems/         one file per problem; problems/groups/*.ts register them
│   ├── bank/             the question bank: authored files, authored.ts (registry),
│   │                     generated.ts (glossary/pattern matches), index.ts (assembly)
│   ├── validate.ts       the abbreviation + figure + skeleton rules
│   └── index.ts          aggregation, lookups, routes, checkCurriculum()
├── components/
│   ├── content/          Blocks, Inline, Figure (+ FigureSequence/Classes/Decision),
│   │                     CodeView (highlighting), Followups, GlossarySheet
│   ├── lesson/           LessonToc, Takeaways, RelatedRow, useLessonScroll
│   ├── line/             LineMap (StationList) + groupStops — the route map
│   ├── onboarding/       OnboardingSheet — pick a route (also "Change route")
│   ├── questions/        the four answer kinds, Feedback, DailyCard
│   ├── nav/              Shell.tsx — five bottom tabs (mobile) / rail (≥1024px)
│   └── ui/               TopBar/PageTitle, Sheet, Segmented, Chip, ProgressRing,
│                         TrackIcon, SearchPill, Button, Bits
├── lib/                  pure functions + IO wrappers, no React:
│                         storage · progress · readiness · review · srs · search ·
│                         walkthrough · slug · text · highlight · export ·
│                         bank (answer checks, set building, the set in progress) ·
│                         attempts (finished vs draft problem attempts)
├── state/                ProgressProvider.tsx — the single React state owner
└── routes/               one screen per file; __fixtures/ are DEV-only
```

## Indexes and registries — what to update when you add something

Nothing is auto-discovered. Every new piece of content has to be registered somewhere, and
forgetting is the most common way a change silently does nothing. This table is the answer to
"I added a file, why is it not showing up".

| Adding | Write it in | Then register it in |
|---|---|---|
| A module | `content/modules/<track>.ts` (in that track's exported array) | nothing else — the array *is* the registry. Then consider adding it to a route in `routes.ts` |
| A whole track | `content/tracks.ts` | `content/index.ts` — import its module array into `modules`; `components/ui/TrackIcon.tsx` for its icon |
| A design problem | `content/problems/<camelCase>.ts` (`kind`, `category`, ≥3 `followups`) | **a `content/problems/groups/*.ts` array**, easy→hard. A checkpoint? also `CHECKPOINTS` in `routes.ts` |
| A Practice shelf | `content/categories.ts` | the `ProblemCategoryId` union in `types.ts` |
| A bank question | the lesson's author file in `content/bank/` (id `<moduleId>-<tf1\|tf2\|multi\|match>`, a `section` naming a real heading) | nothing — `bank/authored.ts` imports every author file. A **new** author file: add it to `authored.ts` |
| A route | `ROUTE_SPECS` in `content/routes.ts` | nothing — `index.ts` builds it. A test fails if it names a missing lesson or problem |
| An abbreviation | `content/glossary/<file>.ts` (or the base list in `glossary.ts`) | nothing — `glossaryIds` is derived. Duplicate ids fail `checkCurriculum` |
| A term that needs no expansion | — | `ALLOWED` in `content/validate.ts` |
| A figure primitive | `content/figures.ts` (the `Figure` union) | `components/content/Figure.tsx` (`FigureView` switch) **and** `figureTexts()` in `validate.ts` |
| A lesson block kind | `content/types.ts` (the `Block` union) | `components/content/Blocks.tsx` **and** `blockTexts()` in `validate.ts` |
| A route/screen | `routes/<Name>Screen.tsx` | `App.tsx` — and `components/nav/Shell.tsx` if it deserves a tab |
| A system pattern / design pattern | `content/patterns.ts` / `content/patterns-object.ts` | referenced by id from a problem's `patterns`; `moduleId` links its lesson |

**The two easiest to forget** are the last column of the figure and block rows: a new kind that
renders but is not added to `validate.ts` becomes a hole the abbreviation rule cannot see into.

`content/index.ts` is the single aggregation point — `modules`, `tracks`, `populatedTracks`,
`problems`, `routes`, `allCards`, `getModule()`, `getProblem()`, `getRoute()`, `getTrack()`,
`modulesOfTrack()`, `relatedOf()`, `stopTitle()`. Import from there, never from the individual
track files, or the dev validation never runs.

`checkCurriculum()` is the whole-curriculum check (ids, quiz shape, stations, prereqs,
related, problem skeletons, glossary duplicates, routes, abbreviations). It logs in
development and **fails `npm test`** — run the tests after any content change.

## Authoring content — the thing you will do most

Content is **typed TypeScript data, not MDX**. The compiler catches a broken prereq id or an
out-of-range `correct` index, and `src/content/index.ts` runs a dev-only validation pass that
logs duplicate ids, mismatched `moduleId`s, and unknown prereqs to the console. Check the
console after adding content.

**A module** goes in `src/content/modules/<track>.ts`:

```ts
{
  id: 'c-cap',                    // unique across all tracks; <track-letter>-<slug>
  trackId: 'core',
  title: 'CAP and consistency',
  station: 6,                     // unique within the track, ascending
  prereqs: ['c-framework'],       // real module ids — shown as "Builds on", never a lock
  related: ['a-contention'],      // optional; back-links are derived, so link one way only
  minutes: 8,                     // honest reading estimate
  summary: '…',                   // one line, shown on the map
  objectives: ['…'],              // "You will be able to" — 2–4 lines
  keywords: ['…'],                // search-only synonyms: 'Kafka', 'double booking'
  lesson: [ /* Block[] */ ],
  quiz: [ /* 2–3 QuizItem */ ],
  cards: [ /* 2–3 CardItem */ ],
}
```

**Block kinds** — `prose` · `heading` · `list` · `callout` · `table` · `code` · `codeCompare` ·
`flow` · `compare` · `ladder` · `figure` · `followups`. Use the structured ones; they exist because this subject is mostly
trade-offs and sequences, and a `compare` or a `ladder` reads far better on a phone than a
paragraph describing the same thing.

- `callout` tones: `say` (the line to use in an interview), `trap` (how people lose points),
  `note`, `example` (a real system doing it — or one marked as hypothetical).
- `code` is TypeScript, highlighted by `lib/highlight.ts`. `codeCompare` is a before/after
  pair (✗ / ✓) for principles and patterns — panes of 6–25 lines, ≤70 characters wide.
- `followups` are the interviewer's pushes, answers behind a tap. Problems carry them in
  their own `followups` field instead.
- Headings get stable slug ids (`lib/slug.ts`) — the TOC, search deep links and "resume
  where you left off" aim at them, so renaming a heading moves its anchor.
- `ladder` grades: `bad` → `good` → `great` → `best`. `best` is highlighted as the one to pick.
- `flow` is boxes and arrows — the vernacular of the subject. Keep node labels to a few words.

**Inline markup inside any `text` field is `**bold**`, `*emphasis*`, `` `code` ``, and
`[[ABBR]]`.** Nothing else is parsed. `*emphasis*` only applies when the asterisks hug a word
on both sides, so `2 * 3` and `SELECT *` stay literal. Anything more structured wants a different block kind. `[[TTL|TTLs]]` gives a
different display form when the sentence needs a plural.

### Two rules the validator enforces

`src/content/validate.ts` runs on every load in development and logs to the console. It is not
advisory — it is how these two rules survive future content being added.

1. **Every module and every problem carries at least one `figure`.** This subject is mechanisms
   and trade-offs; both are far clearer drawn than described.
2. **No abbreviation appears without somewhere to see what it means.** If a unit uses `TTL`, it
   must wrap it as `[[TTL]]` at least once *in that unit*, and `glossary.ts` must have an entry
   with its own illustration. Per-unit rather than per-occurrence on purpose — wrapping all
   nineteen mentions of `GB` would shred the reading rhythm.

New acronym? Add a glossary entry with a figure. Genuinely needs no expansion (a product name,
a SQL keyword)? Add it to `ALLOWED` in `validate.ts`. Those are the only two options.

`scripts/wrap-abbreviations.mjs` is the one-off codemod that did the first pass. It masks
everything between backticks so identifiers are never wrapped. Safe to re-run.

### Figures

Eleven primitives in `src/content/figures.ts`, rendered by `components/content/Figure.tsx`:
`flow` · `stack` · `split` · `ratio` · `grid` · `timeline` · `scale` · `cycle` · `sequence`
(who calls whom, in order) · `classes` (UML-lite boxes + relations) · `decision` (a yes/no
tree, at most three levels).

They are **CSS, not SVG**, deliberately: labels stay real text, so they reflow and never shrink
below legibility when a drawing scales down on a 375px screen. Geometry that carries meaning
(timeline positions, log scales) is expressed as percentage widths.

Pick the primitive that matches the claim — `split` when the answer is a choice, `timeline` when
expiry or ordering is the point, `ratio` when a proportion is, `scale` when the steps are orders
of magnitude apart. Every figure needs a `caption` stating what it shows.

The same primitives illustrate the glossary, so the reader learns one visual vocabulary rather
than forty one-off drawings.

### Where markup renders, and where it must not

`Inline` renders markup. `plainText` strips it. The rule is about nesting, not style:

- **`Inline`** — prose, headings, list items, callouts, table cells, `compare` and `ladder`
  titles, figure labels, a problem's `brief` on its own screen. All plain containers.
- **`plainText`, or unwrapped in the content** — module `title` and `summary`, rubric
  `criterion`, and any brief shown inside a card link. These sit inside `<Link>` or `<label>`,
  where an abbreviation's `<button>` would be invalid HTML and would steal the click.

If you wrap an abbreviation somewhere new and it renders as a literal `[[ABBR]]`, that field is
not going through `Inline` — fix the render site or unwrap the field, depending on which of the
two lists above it belongs to.

**Quiz items:** exactly one correct answer, four options, and an `explain` that says *why* —
the explanation is where the learning happens, not the score. Options are shuffled at render,
so `correct` is an index into the array as authored.

**Cards:** the `back` must be sayable in one breath. If it needs three sentences it is a
lesson, not a card.

**Bank questions** follow `docs/superpowers/plans/2026-11-18-question-brief.md`. The bank
(`content/bank/index.ts`) is three sources: authored questions, every lesson's quiz items
(as `single`, id `quiz:<item id>`), and matching sets generated from the glossary and the
patterns (ids `gloss:A+B+C`, `pat:x+y+z` — they name their members, so adding a term retires
only the groups it lands in and never changes what a saved schedule points at). The ids of
authored questions are permanent for the same reason. `validateQuestions` (run by
`checkCurriculum`) checks each kind's shape, that `section` is a real heading, that no
`[[…]]` sits in an option or match item, and the abbreviation rule with **each question as
its own unit** — it is read alone, without the lesson around it. Options and match items
render as buttons, so they go through `plainText`; prompt and explain go through `Inline`.
Options are shuffled at render (a stable order per question id), so `correct` indexes the
array as authored.

**Problems** go in `src/content/problems/<camelCase>.ts` and are registered in a
`problems/groups/*.ts` array. The `rubric` is split into `must` / `senior` / `staff` bars —
that split is what the scoring screen reports against (weighted 3/2/1 in readiness), so put a
criterion at the bar it actually belongs to.

The `modelAnswer` **must** follow its round's skeleton, in order — `validateProblemShape`
enforces it, and the walkthrough screen steps through it one heading at a time:

- `hld`: Requirements → Core entities → API → (optional Data flow) → High-level design →
  Deep dive…
- `lld`: Requirements → Core objects → Classes → Key methods → Patterns → Concurrency

## Design tokens — the rules

Defined once in `src/index.css` as CSS custom properties, exposed to Tailwind via
`@theme inline`. Use the utility (`bg-surface`, `text-ink-2`, `border-hairline`), never a
raw hex or a Tailwind palette colour like `slate-800`.

| Token | Role |
|---|---|
| `ink` / `ink-2` / `ink-3` | text, secondary, tertiary |
| `paper` / `surface` / `surface-2` | ground, cards, insets |
| `hairline` | borders |
| `line` | **the one accent** — cobalt. Route line, active nav, primary action |
| `streak` | in-progress / streak **only** |
| `mastered` | mastered / correct **only** |
| `alert` | wrong answer, destructive **only** |

`streak`, `mastered` and `alert` are *earned* states. Using them decoratively destroys the
thing that makes progress readable at a glance. If something just needs emphasis, it gets
`line` or weight, not green.

**Type:** Familjen Grotesk (display and UI) · Source Serif 4 (`.prose-lesson`, lesson body
only) · IBM Plex Mono (numbers, timers, code, eyebrow labels).

**Theme:** `data-theme` is stamped on `<html>` by an inline script in `index.html` before first
paint. `system` is resolved to light/dark there, so the CSS only ever has two states. Add new
colours to **both** `:root` and `[data-theme='dark']`.

## Mobile-first constraints

Non-negotiable, because this is used on a phone:

- 375px is the floor. Test there first, then 768 / 1024 / 1440.
- Every interactive element is **≥44px** tall (`min-h-11` on buttons, `min-h-13` for large).
- Fixed edge elements use `pt-safe` / `pb-safe`; scroll containers use `pb-tabbar` so content
  never hides behind the bottom bar.
- Body text ≥16px — below that iOS auto-zooms on focus.
- `min-h-dvh`, never `100vh`.
- Wide content (tables, code) scrolls inside its own container; the page body never scrolls
  sideways.
- `prefers-reduced-motion` is respected globally in `index.css`.

## PWA

Installable and fully offline via `vite-plugin-pwa` (Workbox), configured in
`vite.config.ts`.

`egx-api-fe` hand-writes `public/sw.js` and a static `public/manifest.json`. That works
there because Next serves stable asset paths. It does **not** transfer to Vite: the build
emits content-hashed filenames (`index-BP5Ib4KI.js`), so a hand-written precache list
would go stale on every build. Workbox generates the precache manifest from the actual
build output instead — same outcome, correct for this bundler.

- `registerType: 'prompt'`, **not** `'autoUpdate'` — an automatic reload can land mid
  design-problem and destroy a timed attempt. `components/pwa/PwaBanner.tsx` asks first.
- `injectRegister: null` — registration happens through `useRegisterSW` in that component,
  so the lifecycle UI and the registration are the same thing.
- The three Google Fonts are **runtime**-cached (`CacheFirst` for `fonts.gstatic.com`,
  `StaleWhileRevalidate` for the stylesheet). Without those rules an offline launch falls
  back to system fonts and the page reflows.
- `lib/installPrompt.ts` captures `beforeinstallprompt` **at module load** — Chromium fires
  it once, early, and the event is unusable unless you called `preventDefault` on it. iOS
  never fires it, so `useInstallMode()` returns `'ios-manual'` there and the You screen
  shows the Share → Add to Home Screen steps instead of a button.
- `npm run icons` regenerates the PNG icon set from `public/favicon.svg`. Outputs are
  committed so a normal install and build never needs sharp.

Verify a PWA change with `npm run build && npm run preview`, then Chrome DevTools →
Application → Service Workers, and the Network panel set to Offline.

## Storage

`ProgressState` in `src/lib/storage.ts`, one record in IndexedDB under `tp:progress`; theme in
`localStorage` under `tp:theme` because it must be readable synchronously before paint. Both
accessors are wrapped in try/catch — private mode throws rather than returning null, and the
app must still run without memory.

**Changing the shape:** bump `version`, add a branch to `migrate()`, and never mutate an
existing field's meaning. An export written by an older build must still import cleanly —
`parseImport` in `lib/export.ts` is the other half of that contract.

**Version 2** adds `bookmarks`, `lastPlace` (lesson + section, for "continue reading"),
`routeId`, `startStop`, `onboarded`, `activity` (study actions per day, pruned after 120 days)
and `recentSearches`. `migrate()` upgrades v1 losslessly; a v1 learner with progress is
treated as onboarded and starts at their first unpassed station.

**Version 3** adds the question bank: `questions` (id → the same SM-2 state as cards; a hit
is graded `good`, a miss `again`), `questionDays` (answered and right per day, pruned like
`activity`) and `dailyGoal` (5, 10 or 20). A problem attempt is saved as a **draft** (no
`finishedAt`, plus `resume`) from the moment the clock starts; only finished attempts count
anywhere — screens use `finishedAttempts()` / `draftOf()` in `lib/attempts.ts` rather than
filtering `progress.attempts` themselves. `migrate()` checks every nested record field by field: an
import is untrusted, and a bad value surfacing inside a render would blank the app.

The question set being answered lives in `sessionStorage` (`tp:qset`), not in progress: it
survives "Learn more" and Back, and dies with the tab. One set at a time.

**Nothing is locked.** Prerequisites render as "Builds on" — a suggestion, with a tick when
done. The learner's route decides what "next" means (`nextOnRoute` in `lib/progress.ts`),
and readiness (`lib/readiness.ts`) scores each interview round: half lessons passed on that
round's route, half best rubric coverage on its problems.

**Two bars, deliberately different** (`lib/progress.ts`):

- `passed` = lesson read + quiz ≥ 80%. This is what counts as done on a route and in
  readiness.
- `mastered` = passed + every card learned (3 spaced reps).

"Done" uses the lighter bar on purpose: cards need real days to mature, and holding a route's
progress behind a week of drilling would stall the journey for no benefit.

## Deploying

GitHub Pages, from `.github/workflows/pages.yml`: every push to `main` runs the tests,
builds with `BASE_PATH=/system-design-journey/`, copies `index.html` to `404.html`, and
publishes to https://markbotros0.github.io/system-design-journey/. A red test means no
deploy.

- `base` in `vite.config.ts` comes from `BASE_PATH` (default `/`), and everything follows
  it: the router's `basename` (`import.meta.env.BASE_URL`), the manifest's `start_url` and
  `scope`, and the service worker's scope. Never hard-code a root path — use a router
  `Link`/`navigate`, or `import.meta.env.BASE_URL` outside the router. Manifest icons are
  relative for the same reason.
- `404.html` is how deep links survive: Pages has no SPA rewrite, so any unknown path
  serves the app and the router takes it from there. After the first visit the service
  worker answers navigations itself.
- To check a Pages build locally:
  `BASE_PATH=/system-design-journey/ npm run build && BASE_PATH=/system-design-journey/ npx vite preview --port 5182`,
  then open http://localhost:5182/system-design-journey/.

The old Vercel deployment (`system-design-journey-ten.vercel.app`) answers 402 and is no
longer used.

## Pushing

Remote: `https://github.com/MarkBotros0/system-design-journey.git`, branch `main`.

**Always switch to `MarkBotros0` before pushing. Every push, no exceptions.** This machine has
several accounts in `gh`, and the default active one is *not* the owner of this repo. Pushing as
the wrong account fails with a 403, or worse, succeeds against something you did not intend.

```bash
gh auth switch --hostname github.com --user MarkBotros0
```

Confirm with `gh api user --jq .login` — it must print `MarkBotros0` — then push. Git uses the
`gh` credential helper here, so the switch is all the authentication needed.

Do not skip the switch because you already ran it. The active account is machine-wide, not
per-session or per-repo: anything else on this machine can move it between one push and the
next. It costs a second, so run the switch and the confirmation every time.

```bash
git push -u origin main
```

**Expect intermittent connection failures.** GitHub resolves to several addresses and at least
one of them is unreachable from this network; git picks one per attempt, so a push fails with
`Failed to connect to github.com port 443` maybe three times out of four and then succeeds. It
is not an auth problem and not a repo problem — just retry:

```bash
for i in 1 2 3 4 5; do git push -u origin main && break; sleep 3; done
```

`curl` and `gh` are unaffected, so `gh api` calls work even while `git push` is failing — do not
use that as evidence the push should have worked.

## Conventions

- Screens live one-per-file in `routes/` and own their own state; `ProgressProvider` is the
  only shared state.
- `lib/` is pure functions plus IO wrappers — no React imports.
- Timed or scored screens (quiz, problem runner, review session, question session) render **outside** the tab
  shell so there is one exit and no temptation to wander mid-attempt. Each has its own
  explicit close control. Walkthroughs are study, not attempts, so they live inside the shell.
- Every shell screen owns a sticky `TopBar` (it carries the safe-area inset) and a `PageTitle`
  h1; `App.tsx` moves focus to the h1 (or the `#hash` target) on navigation.
- `/__fixtures/blocks` (every block and figure kind) and `/__fixtures/seed?to=<path>` (a
  mid-journey learner; `&fresh=1` for a new one) are DEV-only routes for checking screens.
  `/__fixtures/crash` throws while rendering, to check `ErrorBoundary` (in `main.tsx`), which
  replaces a blank page with reload / export / reset.
- Comments explain *why*, not *what*. The what is in the code.
