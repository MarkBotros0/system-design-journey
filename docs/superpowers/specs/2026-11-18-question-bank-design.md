# Question bank — design

Approved in conversation on 2026-11-18. Builds on the learning platform
(`2026-11-18-learning-platform-design.md`).

## Intent

A revision mode for spare minutes — a commute, a break at work — used daily. Questions may be
hard, but answering must be quick and one-handed: single choice, select-all-that-apply, true or
false, and matching. Every question names its topic and links to the lesson section that
teaches it, so a miss turns into a two-minute read.

## Goals

- A daily habit: a "Daily 10" one tap from Home, finishable in about three minutes.
- Spacing: a miss comes back soon, a hit is spaced further out.
- Every question carries a topic (track · lesson) and a "Learn more" deep link.
- A bank you can aim: by track, by question type, everything / what I've studied / my weak
  spots, in sets of 5, 10 or 20.
- Stop at any moment without losing anything; resume a set after following "Learn more".

## Non-goals

- Free-text or typed answers (not answerable on a train).
- Drag and drop (awkward in motion and for screen readers) — matching is tap-to-pair.
- Timed questions. The 45-minute runner already trains the clock.
- Questions about practice problems (later, if wanted).

## Anti-goals

- A bank that is empty on day one because nothing has been read: the default scope is all
  topics; "what I've studied" is a filter.
- Partial-credit arithmetic the learner has to decode: a question is right or wrong; matching
  and multi-select show which parts were wrong.

## Approaches considered

1. **Reuse and generate only** — the 212 lesson quiz items plus matching questions generated
   from the glossary and the patterns. Fast, but no true/false or multi-select.
2. **Write new questions** *(chosen by the user)* — the above, plus about four authored
   questions per lesson (2 true/false, 1 multi-select, 1 match), each linked to a lesson
   section, written by parallel authors under a brief and validated like lessons.
3. Generate now, author later — same code as 2, content split over two passes.

## Decisions

**Model.** `Question` is a union over `kind: 'single' | 'multi' | 'truefalse' | 'match'`, with
`id`, `moduleId`, optional `section` (the exact text of a lesson heading, for the deep link),
`prompt` and `explain`. `single`: four options and `correct`. `multi`: 4–6 options and
`correct: number[]` (at least two, not all). `truefalse`: the prompt is a statement and
`answer: boolean`. `match`: 3–5 `pairs` of `{ left, right }`, unique on both sides.

**Sources.** The bank is assembled in `content/bank/index.ts` from three parts: authored files
`content/bank/<author>.ts`; each lesson's existing quiz items, as `single` questions with
id `quiz:<item id>`; and generated matches, with glossary abbreviation → meaning in sets of
four and pattern tell → name, per family. Generated ids are deterministic so their schedules
survive rebuilds. A generated question's topic is the glossary or patterns page, not a lesson.

**Rendering rules.** Prompt and explain go through `Inline`. Options and match items are
buttons, so they render with `plainText`, and the validator rejects `[[…]]` in them. Each
question is its own unit for the abbreviation rule: a bare abbreviation needs a wrapped
mention in that question's prompt or explain.

**Answering.** Single and true/false submit on tap. Multi and match need an explicit Check.
Feedback marks the correct answer and any wrong picks, then shows the explanation, the topic
chip and the Learn more link; a big Next sits in the thumb zone. Keys: 1–6 pick, T and F
answer, Enter checks or moves on.

**Scheduling.** Per-question state reuses `lib/srs.ts`: a hit is graded `good`, a miss
`again`. Within a set, a miss comes round once more at the end. A set draws due questions
first, then misses not yet due when scoped to weak spots, then new questions. New questions
alternate tracks, so a set is never ten questions on one lesson. Studied topics come first
in the all-topics scope.

**Storage.** `ProgressState` version 3 adds `questions` (id → state), `questionDays` (day →
answered and correct counts, pruned like `activity`) and `dailyGoal` (5, 10 or 20, default
10). `migrate()` upgrades v1 and v2 losslessly. Answering counts as study for the streak.
The in-progress set lives in `sessionStorage` (wrapped in try/catch) so Learn more and back
resumes it.

**Places.**
- Review tab: a Daily questions hero (today's progress against the goal, then Start or
  Continue) above the cards, and a link into the bank.
- `/questions`: scope, track and type filters, set size, Start; accuracy per track with
  "practise this"; a Resume card when a set is in progress.
- `/questions/session`: focus mode outside the shell, with one exit.
- Home: a Daily questions card under Continue.
- You: the daily goal setting.

## Left to the builder

Exact copy, the per-type layouts within the design tokens, the generated-question set sizes,
and how the summary lists results.
