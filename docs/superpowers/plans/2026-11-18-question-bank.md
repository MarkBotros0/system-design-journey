# Question Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** A daily, one-handed revision mode over a bank of single-choice, multi-select,
true/false and matching questions, each linked to the lesson section that teaches it.

**Architecture:** A `Question` union in `content/types.ts`; the bank is assembled in
`content/bank/index.ts` from authored files, the lessons' quiz items, and generated matches.
Selection, checking and scheduling are pure functions in `lib/bank.ts` (scheduling reuses
`lib/srs.ts`). Progress v3 stores per-question state. Two screens, `/questions` and
`/questions/session`, plus entry points on Review, Home and You.

**Tech stack:** Vite 8, React 19, TypeScript, Tailwind 4, react-router 7, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-18-question-bank-design.md`

## Global constraints

- Follow CLAUDE.md: tokens only (no raw colours), ≥44px targets, 375px floor with no
  sideways page scroll, `min-h-dvh`, reduced motion respected, `lib/` has no React.
- `mastered` and `alert` mean correct and wrong answers only. Selection uses `line`.
- Options and match items render with `plainText`; prompt and explain with `Inline`.
- Storage changes bump `version` and add a `migrate()` branch. Old exports must still import.
- Long-running commands go in tmux, with logs at `~/logs/sdj-<task>.log`.

## Review focus

1. **A v2 learner opens the build.** Expect nothing lost and `questions` empty.
2. **Generated ids survive a rebuild.** If a glossary term is added, existing generated
   questions keep their ids or retire. They never silently swap meaning under a saved
   schedule.
3. **Following Learn more mid-set, then Back.** Expect the set to resume at the same
   question with the same answers recorded.
4. **A match question with a long right-hand item at 375px.** It must not scroll sideways,
   and pairing must still be possible with the keyboard alone.
5. **The bank filtered to a track with nothing studied, scope "studied".** Expect a useful
   empty state, not a blank screen or a crash.

---

### Task 1: Question model, bank assembly, validation, author brief

**Files:**
- Modify `content/types.ts` (Question union) and `content/validate.ts` (`validateQuestions`).
- Create `content/bank/index.ts` and `content/bank/generated.ts`.
- Create stubs `content/bank/{foundations-interview,principles-lld,design-patterns,core,databases,distributed-production,architecture-applied}.ts`.
- Create the authors' brief `docs/superpowers/plans/2026-11-18-question-brief.md`.
- Modify `content/index.ts`: `checkCurriculum` runs `validateQuestions`.
- Test: `content/bank.test.ts`.

**Produces:**
- `Question`, `QuestionKind`.
- `bank: Question[]` and `getQuestion(id)`.
- `questionTopic(q): { title: string; trackId?: string; href: string }`, where `href` is
  `/m/<id>#<slug>`, `/glossary#ID` or `/patterns#id`.

- [ ] Tests:
  - `bank: ids unique across sources`
  - `bank: every lesson quiz item appears as a single question`
  - `bank: generated glossary matches are deterministic and 4 pairs each`
  - `bank: questionTopic links a sectioned question to /m/<id>#<slug>`
  - `validate: rejects multi with <2 correct, match with duplicate right side, markup in an option, unknown section`
- [ ] Implement; `npm test` green; commit `feat: question model and bank assembly`.

### Task 2: Authors (parallel, worktrees)

7 authors, about 4 questions per lesson (2 true/false, 1 multi, 1 match), each with a
`section`. They work from the brief, one bank file each, and run `npx vitest run src/content`
before reporting. Lead integrates each branch as it reports (Task 6).

### Task 3: lib/bank.ts and storage v3

**Files:** modify `lib/storage.ts`, `lib/export.ts` and `state/ProgressProvider.tsx`; create
`lib/bank.ts`. Test: `lib/bank.test.ts` and `lib/storage.test.ts`.

**Produces:**
- `type Answer = number | number[] | boolean | Record<number, number>`
- `isCorrect(q, a): boolean`
- `scheduleAnswer(state | undefined, correct, now): CardState`
- `buildSet(p, opts: { size; scope: 'all' | 'studied' | 'weak'; trackIds?; kinds?; now; rand }): string[]`
- `bankStats(p): { answered; accuracy; byTrack: { trackId; answered; accuracy; due }[] }`
- `todayCount(p, now)`
- Provider: `answerQuestion(id, correct)` and `setDailyGoal(n)`.

- [ ] Tests:
  - `isCorrect: each kind, including multi order-insensitivity and an incomplete match`
  - `buildSet: due first, tracks alternate, studied first under all, weak scope only misses, respects kinds and size, empty when nothing matches`
  - `migrate: v2 → v3 keeps everything and adds questions`
  - `parseImport: v2 export imports`
- [ ] Implement; green; commit `feat: question scheduling and progress v3`.

### Task 4: Session screen

**Files:** create `routes/QuestionSessionScreen.tsx` and
`components/questions/{SingleChoice,MultiChoice,TrueFalse,MatchPairs,Feedback}.tsx`; modify
`App.tsx` (focus route).

Session from `?set=daily` or `?scope=&tracks=&kinds=&size=`, snapshotted in
`sessionStorage` under `tp:qset`. Behaviour:
- Single and true/false submit on tap; multi and match use Check.
- Feedback shows correct/wrong per option or pair, the explanation, the topic chip and
  Learn more. Next.
- A miss requeues once.
- The summary lists each result with its topic, then "Another set" and Done.
- Keys: 1–6, T, F, Enter.

- [ ] Steps: implement; screenshot each kind at 375 in light and dark, plus the summary;
  sweep for sideways scroll; commit `feat: question session`.

### Task 5: Bank screen and entry points

**Files:** create `routes/QuestionBankScreen.tsx`; modify `ReviewScreen.tsx`,
`HomeScreen.tsx`, `YouScreen.tsx`, `App.tsx` and `nav/Shell.tsx` (the Review tab matches
`/questions`).

- [ ] Steps: implement; screenshot `/questions`, `/review` and Home, fresh and seeded; commit
  `feat: question bank screen and daily questions`.

### Task 6: Integrate content, QA, docs

- [ ] Merge each author; dedupe; `npm test` green.
- [ ] Sweep every session kind at 375.
- [ ] Update CLAUDE.md: the registry row for bank questions, the rendering rules, storage v3.
- [ ] Commit per step.
