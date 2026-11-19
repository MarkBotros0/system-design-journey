# Redesign: Momentum × Native-grade

**Date:** 2026-11-19 · **Status:** approved by the owner ("Go for 2 and 3")

## Intent

The owner finds the current UI old-fashioned and wants the whole app "super modern and user
friendly, with new components — change anything to make the user experience its best". They
study on an iPhone, mostly in dark mode, in short bursts, and use the app to revise every day.
They saw four directions as mockups and chose **a mix of 2 (Momentum) and 3 (Native-grade)**:
Momentum's look and motivation, Native-grade's structure.

What made the old UI feel dated, and must not survive: every element an outlined box;
uppercase monospace captions everywhere; lots of small grey text; one flat blue for everything;
all eleven tracks looking identical.

Reference material (scratchpad of the design session, copied into
`docs/superpowers/specs/2026-11-19-redesign/`): the Momentum and Native-grade mockups (HTML + PNG).

## Goals

- Looks and feels like a modern phone app rather than a web page.
- Today's goal and streak are the first thing on Home; coming back daily feels rewarding.
- The next action is obvious on every screen and within thumb reach.
- Every track is recognisable at a glance by its colour and glyph.
- Long lessons stay calm and comfortable to read.

## Non-goals

- No change to content, the progress model, scheduling, storage, routes or what any screen
  *does*. This is a visual and interaction rewrite.
- No new npm dependencies.

## Anti-goals

- Gamified noise: no confetti, mascots, XP or guilt copy ("don't break your streak!").
- Half-done native gestures (no swipe-back).
- Track colour on an answer state, or state colour used as decoration.

## Approaches considered

Four directions were mocked up: Quiet focus (calm, one soft accent), Momentum (track colours,
goal and streak as hero), Native-grade (iOS structure), Technical editorial (bold type, bento).
The owner first asked about Quiet focus × Native-grade, compared it with Momentum ×
Native-grade, and chose the latter.

## The mix

| Area | From | Decision |
|---|---|---|
| Surfaces | 2 | Filled soft surfaces, no outlines. Dark paper `#0A0C11`, surface `#141720`, `#1B1F2A`, `#272C39`; light paper `#F4F5F8`, white surface, `#E6E9F0`. |
| Ink | 2 | Dark `#F3F4F8` / `#BAC0CE` / `#8F96A9`; light `#12141B` / `#464C5F` / `#646A80`. |
| Actions | 2 | No brand blue. Primary actions are solid ink pills (white on dark, near-black on light); secondary on surface-3. Colour comes from tracks. Focus rings and links use the current track's colour, or ink when there is no track. |
| Earned states | 2 | Correct `#3DDC8E`/`#0B8A52` + check; wrong `#FF6672`/`#CF2E3C` + x; streak / in-progress `#FF9F45`/`#BF5A00` + flame or partial ring; mastered `#FFCF5C`/`#946A00` + seal; missed = dashed outline + "Missed". Never colour alone. |
| Track identity | 2 | 11 hues with lucide glyphs, from the Momentum spec (Foundations blue/brick, Principles violet/compass, Patterns purple/shapes, LLD pink/box, Core cyan/network, Databases teal/database, Distributed periwinkle/globe, Architecture lime/plug, Production rose/shield-check, Applied green/puzzle, Interview ink/message-square). Tints via `color-mix` (17% dark, 12% light). |
| Type | 2 | Plus Jakarta Sans 400–800 for UI (tabular numerals for stats); Newsreader for lesson body at 19px; JetBrains Mono for code and timers only. No uppercase monospace eyebrows — eyebrows are 14px bold sentence case in the track colour. |
| Screen structure | 3 | Large titles that collapse into a compact bar on scroll; inset grouped lists of cells; settings-style You. |
| Sheets | 3 | Bottom sheets with medium/large detents for answer feedback, lesson contents, glossary terms, route picker, filters, rubric scoring. Drag down to dismiss. |
| Tab bar | 2 + 3 | Floating, inset, blurred pill; five tabs (Home, Learn, Practice, Review with due badge, You); left rail at ≥1024px. |
| Home | 2 + 3 | Large title with date; Today card (streak pill, big 0/10, ten goal pips, 7-day flame strip, Start questions + N cards); route ribbon (one coloured segment per track); up-next list. |
| Resume | 3 | A Resume dock above the tab bar on shell tabs: continue reading, or a draft problem with its timer; collapses to a chip on scroll-down. Replaces Momentum's Continue card, so there is one way to resume. |
| Lessons | 2 + 3 | Compact nav bar, reading-progress line, track chip, serif body without a card, figures in soft cards, callouts as tinted panels, a reading dock (Contents · Section n of N · Next) in place of the tab bar. |
| Answers | 2 + 3 | Filled option rows with a leading box; hit = green + check, extra = red + x + "Extra", missed = dashed green + "Missed"; feedback in a sheet with verdict, tally ("2 found · 1 missed · 1 extra"), explanation, Learn more (named after the topic) + Continue. Segmented progress on top. |
| Review | 2 + 3 | Two big tiles (Cards due, Questions today); card session as a large flip card with a docked grade row. |
| Gestures | — | Sheets drag to dismiss. No swipe-back. |

## Constraints (unchanged from CLAUDE.md)

375px floor, no sideways page scroll · targets ≥ 44px · body ≥ 16px · WCAG AA in both themes ·
reduced motion respected · offline (fonts runtime-cached from Google Fonts) · safe-area insets ·
lesson figures stay CSS with real text · SVG icons only · `color-mix`/`backdrop-filter` get a
plain fallback.

## How it gets built

1. Tokens, fonts and track identities (`src/index.css`, `index.html`, `content/tracks.ts`).
2. Primitives, shown together on a DEV fixture page: PillButton, Cell / GroupedList, LargeTitle +
   NavBar, Sheet with detents, TabBar pill + rail, ResumeDock, ReadingDock, TrackGlyph,
   TrackChip, StatTile, SegmentedProgress, RouteRibbon, AnswerOption, FeedbackSheet, Chip,
   Segmented, Callout, ProgressRing.
3. Screens rebuilt on the primitives: Home, Learn, Track, Lesson, Quiz, Practice, Problem runner,
   Walkthrough, Review, Card session, Question session, Question bank, Search, Glossary,
   Patterns, You, onboarding sheet, PWA banner, error screen.
4. CLAUDE.md design rules rewritten to match.

Verified by the unit suite plus browser checks at 375px in both themes on every screen (no
sideways scroll, targets ≥ 44px, contrast of text/background pairs).

## Left to the builder

Exact spacing, light-theme track values that pass 4.5:1 as 14px text, motion timings within the
reduced-motion rule, icon choice where the spec gives none.

## Calls I made (for the owner to check)

- Momentum's Continue card is replaced by Native-grade's Resume dock (one way to resume).
- Mastered is gold with a seal and the streak orange with a flame; both always carry their icon.
- Correct, wrong and missed always carry an icon, because two track hues sit near state hues.
- The first tab stays **Home**.
- No swipe-back gesture; sheets drag to dismiss.
- Design session skipped the separate builder review of this document, at the owner's request
  for speed.
