# Throughput — Claude Code context

## What this is

A mobile-first web app that trains system design from beginner to senior interview level.
Four tracks of modules ("stations") on a line, each with a lesson, a quiz, and flashcards;
plus full design problems run against a 45-minute phase timer with a self-graded rubric.

Single user, no backend, no accounts. Everything is local and works offline.

## Stack

Vite 8 · React 19 · TypeScript 6 · Tailwind 4 (`@tailwindcss/vite`) · react-router 7 ·
`idb-keyval` · `lucide-react` · `vite-plugin-pwa`.

No CSS framework config file — Tailwind 4 is configured entirely in `src/index.css` via
`@theme inline`.

```bash
npm run dev        # port 5180, strict
npm run typecheck  # tsc --noEmit
npm run build      # tsc -b && vite build
npm run icons      # regenerate PNG app icons from public/favicon.svg (needs sharp)
```

## Layout

```
src/
├── content/          THE CURRICULUM — typed data, the thing that grows
│   ├── types.ts      Block / Module / QuizItem / CardItem / Problem
│   ├── framework.ts  the 6 phases and their minute budgets (single source)
│   ├── tracks.ts     four track definitions
│   ├── patterns.ts   the 8 recognition patterns
│   ├── modules/      one file per track
│   ├── problems/     one file per design problem
│   └── index.ts      aggregation, lookups, and DEV-only validation
├── components/
│   ├── content/      Blocks.tsx — renders a Block[]; Inline for **bold** / `code`
│   ├── line/         LineMap.tsx — the signature route-map component
│   ├── nav/          Shell.tsx — bottom tabs (mobile) / rail (≥1024px)
│   └── ui/           Button, Bits (Badge, Meter, Panel, Empty, ScreenTitle)
├── lib/              srs.ts · progress.ts · storage.ts · export.ts   (all pure or IO-only)
├── state/            ProgressProvider.tsx — the single React state owner
└── routes/           one screen per file
```

## Indexes and registries — what to update when you add something

Nothing is auto-discovered. Every new piece of content has to be registered somewhere, and
forgetting is the most common way a change silently does nothing. This table is the answer to
"I added a file, why is it not showing up".

| Adding | Write it in | Then register it in |
|---|---|---|
| A module | `content/modules/<track>.ts` (in that track's exported array) | nothing else — the array *is* the registry |
| A whole track | `content/tracks.ts` | `content/index.ts` — import its module array into `modules` |
| A design problem | `content/problems/<id>.ts` | **`content/problems/index.ts`** — add to the `problems` array, in easy→hard order |
| An abbreviation | `content/glossary.ts` | nothing — `glossaryIds` is derived. But `validate.ts` will fail until it exists |
| A term that needs no expansion | — | `ALLOWED` in `content/validate.ts` |
| A figure primitive | `content/figures.ts` (the `Figure` union) | `components/content/Figure.tsx` (`FigureView` switch) **and** `figureTexts()` in `validate.ts` |
| A lesson block kind | `content/types.ts` (the `Block` union) | `components/content/Blocks.tsx` **and** `blockTexts()` in `validate.ts` |
| A route/screen | `routes/<Name>Screen.tsx` | `App.tsx` — and `components/nav/Shell.tsx` if it deserves a tab |
| A pattern | `content/patterns.ts` | referenced by id from a problem's `patterns` array |

**The two easiest to forget** are the last column of the figure and block rows: a new kind that
renders but is not added to `validate.ts` becomes a hole the abbreviation rule cannot see into.

`content/index.ts` is the single aggregation point — `modules`, `tracks`, `populatedTracks`,
`problems`, `allCards`, `getModule()`, `getProblem()`, `modulesOfTrack()`. Import from there,
never from the individual track files, or the dev validation never runs.

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
  prereqs: ['c-framework'],       // must be real module ids — drives the unlock graph
  minutes: 8,                     // honest reading estimate
  summary: '…',                   // one line, shown on the map
  lesson: [ /* Block[] */ ],
  quiz: [ /* 2–3 QuizItem */ ],
  cards: [ /* 2–3 CardItem */ ],
}
```

**Block kinds** — `prose` · `heading` · `list` · `callout` · `table` · `code` · `flow` ·
`compare` · `ladder`. Use the structured ones; they exist because this subject is mostly
trade-offs and sequences, and a `compare` or a `ladder` reads far better on a phone than a
paragraph describing the same thing.

- `callout` tones: `say` (the line to use in an interview), `trap` (how people lose points),
  `note`.
- `ladder` grades: `bad` → `good` → `great` → `best`. `best` is highlighted as the one to pick.
- `flow` is boxes and arrows — the vernacular of the subject. Keep node labels to a few words.

**Inline markup inside any `text` field is `**bold**`, `` `code` ``, and `[[ABBR]]`.** Nothing
else is parsed. Anything more structured wants a different block kind. `[[TTL|TTLs]]` gives a
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

Eight primitives in `src/content/figures.ts`, rendered by `components/content/Figure.tsx`:
`flow` · `stack` · `split` · `ratio` · `grid` · `timeline` · `scale` · `cycle`.

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

**Problems** go in `src/content/problems/<id>.ts` and are registered in `problems/index.ts`.
The `rubric` is split into `must` / `senior` / `staff` bars — that split is what the scoring
screen reports against, so put a criterion at the bar it actually belongs to.

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

**Two bars, deliberately different** (`lib/progress.ts`):

- `passed` = lesson read + quiz ≥ 80%. **This is what unlocks the next station.**
- `mastered` = passed + every card learned (3 spaced reps).

Unlocking uses the lighter bar on purpose: cards need real days to mature, and gating the next
station behind a week of drilling would stall the journey for no benefit.

## Pushing

Remote: `https://github.com/MarkBotros0/system-design-journey.git`, branch `main`.

**Switch the GitHub account first.** This machine has several accounts in `gh`, and the default
active one is *not* the owner of this repo. Pushing as the wrong account fails with a 403, or
worse, succeeds against something you did not intend.

```bash
gh auth switch --hostname github.com --user MarkBotros0
```

Confirm with `gh api user --jq .login` — it must print `MarkBotros0` — then push. Git uses the
`gh` credential helper here, so the switch is all the authentication needed.

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
- Timed or scored screens (quiz, problem runner) render **outside** the tab shell so there is
  one exit and no temptation to wander mid-attempt. Each has its own explicit close control.
- Comments explain *why*, not *what*. The what is in the code.
