/**
 * The curriculum content model.
 *
 * Content is typed TypeScript data, not MDX — it means the compiler catches a broken
 * prereq id or a quiz whose `correct` index is out of range, and the whole curriculum
 * is statically analysable for the map and the unlock graph.
 *
 * Inline markup allowed inside any `text` field: **bold**, `code` and [[ABBR]]. Nothing
 * else — see components/content/Inline.tsx.
 */

import type { Figure as FigureSpec } from './figures'

export type { FigureSpec }

export interface Track {
  id: string
  /** Short mono label — the track's identity on the map, since tracks share one accent. */
  code: string
  title: string
  /** One line, shown under the track heading on the map. */
  blurb: string
  /** What you can do after the track. Three lines, shown on the track page. */
  outcomes: string[]
  moduleIds: string[]
}

/** "Interviewer asks… / a strong answer…". Used in lessons and in every problem. */
export interface Followup {
  q: string
  a: string
}

/* ------------------------------------------------------------------ */
/* Lesson blocks                                                       */
/* ------------------------------------------------------------------ */

export type Block =
  | { kind: 'prose'; text: string }
  | { kind: 'heading'; text: string }
  /**
   * A diagram. See `figures.ts` for the eight primitives. Every lesson carries at least
   * one — this subject is mechanisms and trade-offs, and both are far clearer drawn.
   * The caption states what the figure shows, in one line.
   */
  | { kind: 'figure'; figure: FigureSpec; caption: string }
  | { kind: 'list'; items: string[]; ordered?: boolean }
  /**
   * `say` = the line to use in an interview. `trap` = the way people lose points.
   * `example` = a named, concrete real-world case.
   */
  | { kind: 'callout'; tone: 'say' | 'trap' | 'note' | 'example'; title?: string; text: string }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'code'; code: string; caption?: string }
  /** Boxes and arrows, rendered as a responsive flow. The vernacular of the subject. */
  | { kind: 'flow'; nodes: string[]; note?: string }
  /** Two options side by side — used wherever the answer is a tradeoff. */
  | {
      kind: 'compare'
      left: { title: string; points: string[] }
      right: { title: string; points: string[] }
      verdict?: string
    }
  /** The bad → good → great ladder. `best` marks the one to actually pick. */
  | {
      kind: 'ladder'
      rungs: { grade: 'bad' | 'good' | 'great' | 'best'; title: string; text: string }[]
    }
  /** Before/after code — how a principle or pattern changes real code. Code is exempt from markup. */
  | {
      kind: 'codeCompare'
      before: { title: string; code: string }
      after: { title: string; code: string }
      note?: string
    }
  /** The questions an interviewer pushes with, each with a strong answer behind a tap. */
  | { kind: 'followups'; items: Followup[] }

/* ------------------------------------------------------------------ */
/* Practice items                                                      */
/* ------------------------------------------------------------------ */

export interface QuizItem {
  id: string
  moduleId: string
  stem: string
  /** Exactly four. Order is stable; the runner shuffles at render time. */
  options: string[]
  /** Index into `options` as authored. */
  correct: number
  explain: string
}

export interface CardItem {
  id: string
  moduleId: string
  front: string
  back: string
  tag: string
}

/* ------------------------------------------------------------------ */
/* Modules                                                             */
/* ------------------------------------------------------------------ */

export interface Module {
  id: string
  trackId: string
  title: string
  /** Position on the line. Unique within a track, ascending. */
  station: number
  /**
   * Module ids this one builds on. Advisory — nothing is ever locked; the lesson shows
   * "Builds on" links and the map a quiet hint when these are not passed yet.
   */
  prereqs: string[]
  /** Synonyms a learner might type into search. */
  keywords?: string[]
  /** "You'll learn" — two to four lines. */
  objectives?: string[]
  /** Lessons this one deepens or sits beside. Shown in both directions. */
  related?: string[]
  summary: string
  /** Honest reading estimate in minutes. */
  minutes: number
  lesson: Block[]
  quiz: QuizItem[]
  cards: CardItem[]
}

/* ------------------------------------------------------------------ */
/* Design problems                                                     */
/* ------------------------------------------------------------------ */

export type Difficulty = 'easy' | 'medium' | 'hard'

/** `hld` = system design (boxes and arrows). `lld` = object-oriented / low-level design. */
export type ProblemKind = 'hld' | 'lld'

export type ProblemCategoryId =
  | 'social'
  | 'realtime'
  | 'media'
  | 'location'
  | 'commerce'
  | 'infra'
  | 'data'
  | 'lld-systems'
  | 'lld-components'

export interface RubricRow {
  id: string
  criterion: string
  /** What tier this criterion belongs to — the E4/E5/E6 split, made explicit. */
  bar: 'must' | 'senior' | 'staff'
}

export interface Problem {
  id: string
  title: string
  kind: ProblemKind
  category: ProblemCategoryId
  difficulty: Difficulty
  /** What the interviewer says. Deliberately under-specified, like the real thing. */
  brief: string
  /** Pattern ids this problem exercises — used to suggest what to study next. */
  patterns: string[]
  /** Modules worth finishing first. Advisory, never blocking. */
  suggests: string[]
  /**
   * The walkthrough. Its headings follow the interview skeleton for the problem's kind
   * (see `validateProblemShape`) so it can be stepped through phase by phase.
   */
  modelAnswer: Block[]
  rubric: RubricRow[]
  /** What the interviewer pushes with in the last phase. Three to five. */
  followups?: Followup[]
}

/* ------------------------------------------------------------------ */
/* Patterns (the recognition layer)                                    */
/* ------------------------------------------------------------------ */

export interface Pattern {
  id: string
  /** `system` = the recognition patterns of system design; `object` = design patterns. */
  family: 'system' | 'object'
  /** The lesson that teaches it. */
  moduleId?: string
  name: string
  /** The phrase in the prompt that should make you reach for this. */
  tell: string
  move: string
  showsUpIn: string[]
}

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */

export type RouteStop = { module: string } | { problem: string }

/** An ordered path through the curriculum, with problems as checkpoints. */
export interface Route {
  id: string
  title: string
  blurb: string
  stops: RouteStop[]
}

/* ------------------------------------------------------------------ */
/* Question bank                                                       */
/* ------------------------------------------------------------------ */

export type QuestionKind = 'single' | 'multi' | 'truefalse' | 'match'

interface QuestionBase {
  /** Stable forever: per-question schedules are keyed by it. */
  id: string
  /** The lesson it tests. Authored questions always have one. */
  moduleId?: string
  /** The exact text of a heading in that lesson — "Learn more" deep-links to it. */
  section?: string
  /** For questions with no lesson (generated from the glossary or patterns). */
  topic?: { title: string; href: string }
  /** Inline markup allowed. For true/false, a statement, not a question. */
  prompt: string
  /** Why — one or two sentences. Inline markup allowed. */
  explain: string
}

export type Question =
  /** Four options; `correct` indexes them as authored (shuffled at render). */
  | (QuestionBase & { kind: 'single'; options: string[]; correct: number })
  /** Select all that apply: 4–6 options, at least two correct, never all. */
  | (QuestionBase & { kind: 'multi'; options: string[]; correct: number[] })
  | (QuestionBase & { kind: 'truefalse'; answer: boolean })
  /** 3–5 pairs, unique on both sides. The right column is shuffled at render. */
  | (QuestionBase & { kind: 'match'; pairs: { left: string; right: string }[] })

