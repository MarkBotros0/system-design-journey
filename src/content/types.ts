/**
 * The curriculum content model.
 *
 * Content is typed TypeScript data, not MDX — it means the compiler catches a broken
 * prereq id or a quiz whose `correct` index is out of range, and the whole curriculum
 * is statically analysable for the map and the unlock graph.
 *
 * Inline markup allowed inside any `text` field: **bold** and `code`. Nothing else —
 * see `renderInline` in components/content/Inline.tsx.
 */

export type Level = 'foundations' | 'core' | 'applied' | 'interview'

export interface Track {
  id: string
  title: string
  level: Level
  /** One line, shown under the track heading on the map. */
  blurb: string
  moduleIds: string[]
}

/* ------------------------------------------------------------------ */
/* Lesson blocks                                                       */
/* ------------------------------------------------------------------ */

export type Block =
  | { kind: 'prose'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'list'; items: string[]; ordered?: boolean }
  /** `say` = the line to use in an interview. `trap` = the way people lose points. */
  | { kind: 'callout'; tone: 'say' | 'trap' | 'note'; title?: string; text: string }
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
  /** Module ids that must be mastered first. Drives the unlock graph. */
  prereqs: string[]
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

export interface RubricRow {
  id: string
  criterion: string
  /** What tier this criterion belongs to — the E4/E5/E6 split, made explicit. */
  bar: 'must' | 'senior' | 'staff'
}

export interface Problem {
  id: string
  title: string
  difficulty: Difficulty
  /** What the interviewer says. Deliberately under-specified, like the real thing. */
  brief: string
  /** Pattern ids this problem exercises — used to suggest what to study next. */
  patterns: string[]
  /** Modules worth finishing first. Advisory, never blocking. */
  suggests: string[]
  /** Revealed only after the attempt is submitted. */
  modelAnswer: Block[]
  rubric: RubricRow[]
}

/* ------------------------------------------------------------------ */
/* Patterns (the recognition layer)                                    */
/* ------------------------------------------------------------------ */

export interface Pattern {
  id: string
  name: string
  /** The phrase in the prompt that should make you reach for this. */
  tell: string
  move: string
  showsUpIn: string[]
}
