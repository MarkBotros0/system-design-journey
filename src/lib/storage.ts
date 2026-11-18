/**
 * Persistence. Everything is local: IndexedDB for the progress record, localStorage for
 * the handful of settings that must be readable synchronously before first paint.
 *
 * Both accessors are wrapped — a browser in private mode, or with site data blocked,
 * throws on access rather than returning null. The app must still run, just without
 * memory, so every read has a defined empty result and every write can fail silently.
 */

import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { CardState } from './srs'
import type { RouteStop } from '../content/types'
import { LEGACY_LINE } from '../content/legacy'

export const PROGRESS_KEY = 'tp:progress'
export const THEME_KEY = 'tp:theme'

export type Theme = 'light' | 'dark' | 'system'

export interface QuizRecord {
  /** Best score as a 0–1 fraction. */
  best: number
  attempts: number
  lastAt: number
}

export interface ProblemAttempt {
  id: string
  problemId: string
  startedAt: number
  finishedAt?: number
  /** phaseId -> what you wrote during that phase. */
  notes: Record<string, string>
  /** phaseId -> seconds actually spent, so you can see where the clock went. */
  phaseSeconds: Record<string, number>
  /** rubric row id -> did you hit it. */
  scored: Record<string, boolean>
  /** Drafts only: where the runner was, so Resume lands there. */
  resume?: { stage: 'running' | 'grading'; phaseIndex: number }
}

export interface ProgressState {
  version: 3
  /** moduleId -> when you finished reading it. */
  lessonsRead: Record<string, number>
  /** moduleId -> best quiz result. */
  quiz: Record<string, QuizRecord>
  /** cardId -> SRS state. */
  cards: Record<string, CardState>
  attempts: ProblemAttempt[]
  streak: { current: number; longest: number; lastDay: string | null }
  updatedAt: number

  /* ---- v2 ---- */
  /** Module ids, newest first. */
  bookmarks: string[]
  /** Where you were reading — Continue on Home reopens it at the section. */
  lastPlace: { moduleId: string; sectionId?: string; at: number } | null
  routeId: string
  /** A stop key (`stopKey`) the route starts from. Moves the pointer only; marks nothing done. */
  startStop: string | null
  onboarded: boolean
  /** dayKey → study actions that day. Pruned to the last 120 days. */
  activity: Record<string, number>
  /** Newest first, at most 8. */
  recentSearches: string[]

  /* ---- v3 ---- */
  /** Question-bank id -> spacing state. A hit is graded `good`, a miss `again`. */
  questions: Record<string, CardState>
  /** dayKey -> questions answered and answered right that day. Pruned like `activity`. */
  questionDays: Record<string, { answered: number; correct: number }>
  /** Questions a day the learner aims for. */
  dailyGoal: DailyGoal
}

export const DAILY_GOALS = [5, 10, 20] as const
export type DailyGoal = (typeof DAILY_GOALS)[number]

export const MAX_RECENT_SEARCHES = 8

export function emptyProgress(): ProgressState {
  return {
    version: 3,
    lessonsRead: {},
    quiz: {},
    cards: {},
    attempts: [],
    streak: { current: 0, longest: 0, lastDay: null },
    updatedAt: Date.now(),
    bookmarks: [],
    lastPlace: null,
    routeId: 'full',
    startStop: null,
    onboarded: false,
    activity: {},
    recentSearches: [],
    questions: {},
    questionDays: {},
    dailyGoal: 10,
  }
}

/** The one string form of a route stop — stored in `startStop`, used as a React key. */
export function stopKey(stop: RouteStop): string {
  return 'module' in stop ? `m:${stop.module}` : `p:${stop.problem}`
}

/* ------------------------------------------------------------------ */
/* Progress record                                                     */
/* ------------------------------------------------------------------ */

export async function loadProgress(): Promise<ProgressState> {
  try {
    const raw = await idbGet<unknown>(PROGRESS_KEY)
    if (raw && typeof raw === 'object') return migrate(raw)
  } catch {
    /* IndexedDB unavailable — fall through to a fresh record. */
  }
  return emptyProgress()
}

let writeTimer: ReturnType<typeof setTimeout> | undefined

/** Debounced: quiz answers and card grades arrive in bursts. */
export function saveProgress(state: ProgressState): void {
  clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    void idbSet(PROGRESS_KEY, { ...state, updatedAt: Date.now() }).catch(() => {})
  }, 250)
}

export async function clearProgress(): Promise<void> {
  try {
    await idbDel(PROGRESS_KEY)
  } catch {
    /* nothing to clear */
  }
}

/* ------------------------------------------------------------------ */
/* Migration                                                           */
/* ------------------------------------------------------------------ */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

/**
 * Any stored or imported record → a current ProgressState. Never throws, never loses a
 * field it understands. Bump `version` and add to this when the shape changes — an
 * export written by any older build must always import cleanly.
 *
 * v2 → v3: the question bank fields get defaults; nothing else changes.
 *
 * v1 → v2: the v2 fields get defaults. A v1 learner with any progress has, by
 * definition, already started, so they skip onboarding and their start pointer goes to
 * the first station of the old line they had not passed. New tracks inserted earlier
 * in the journey therefore never send them backwards.
 */
export function migrate(raw: unknown): ProgressState {
  const base = emptyProgress()
  if (!isRecord(raw)) return base

  // Every nested record is checked field by field: an import is untrusted, and one bad
  // value surfacing later inside a render would blank the whole app.
  const lessonsRead = typed(raw.lessonsRead, (v): v is number => typeof v === 'number')
  const quiz = typed(raw.quiz, (v): v is QuizRecord => isRecord(v) && ['best', 'attempts', 'lastAt'].every((k) => typeof v[k] === 'number'))
  const cards = cardStates(raw.cards)
  const attempts = Array.isArray(raw.attempts) ? raw.attempts.flatMap(attempt) : []
  const streak =
    isRecord(raw.streak) &&
    typeof raw.streak.current === 'number' &&
    typeof raw.streak.longest === 'number' &&
    (raw.streak.lastDay === null || typeof raw.streak.lastDay === 'string')
      ? (raw.streak as ProgressState['streak'])
      : base.streak
  const updatedAt = typeof raw.updatedAt === 'number' ? raw.updatedAt : base.updatedAt

  const shared = { lessonsRead, quiz, cards, attempts, streak, updatedAt }

  if (raw.version !== 2 && raw.version !== 3) {
    const started =
      Object.keys(lessonsRead).length > 0 || Object.keys(quiz).length > 0 || attempts.length > 0
    // Inline rather than imported from progress.ts — that module imports this one.
    const passed = (id: string) => !!lessonsRead[id] && (quiz[id]?.best ?? 0) >= 0.8
    const resumeAt = LEGACY_LINE.find((id) => !passed(id))
    return {
      ...base,
      ...shared,
      onboarded: started,
      startStop: started && resumeAt ? `m:${resumeAt}` : null,
    }
  }

  const lastPlace =
    isRecord(raw.lastPlace) && typeof raw.lastPlace.moduleId === 'string'
      ? (raw.lastPlace as ProgressState['lastPlace'])
      : null
  const activity: Record<string, number> = {}
  if (isRecord(raw.activity)) {
    for (const [day, n] of Object.entries(raw.activity)) if (typeof n === 'number') activity[day] = n
  }

  return {
    ...base,
    ...shared,
    bookmarks: strings(raw.bookmarks),
    lastPlace,
    routeId: typeof raw.routeId === 'string' ? raw.routeId : base.routeId,
    startStop: typeof raw.startStop === 'string' ? raw.startStop : null,
    onboarded: raw.onboarded === true,
    activity,
    recentSearches: strings(raw.recentSearches).slice(0, MAX_RECENT_SEARCHES),
    // v2 records have none of these; the readers below default them.
    questions: cardStates(raw.questions),
    questionDays: questionDays(raw.questionDays),
    dailyGoal: DAILY_GOALS.find((g) => g === raw.dailyGoal) ?? base.dailyGoal,
  }
}

/** The entries of a record whose values pass `ok`. */
function typed<T>(v: unknown, ok: (x: unknown) => x is T): Record<string, T> {
  const out: Record<string, T> = {}
  if (isRecord(v)) for (const [k, x] of Object.entries(v)) if (ok(x)) out[k] = x
  return out
}

/** An attempt with its identity intact is kept and its maps repaired; anything less is dropped. */
function attempt(v: unknown): ProblemAttempt[] {
  if (!isRecord(v) || typeof v.id !== 'string' || typeof v.problemId !== 'string' || typeof v.startedAt !== 'number') return []
  const a: ProblemAttempt = {
    id: v.id,
    problemId: v.problemId,
    startedAt: v.startedAt,
    notes: typed(v.notes, (x): x is string => typeof x === 'string'),
    phaseSeconds: typed(v.phaseSeconds, (x): x is number => typeof x === 'number'),
    scored: typed(v.scored, (x): x is boolean => typeof x === 'boolean'),
  }
  if (typeof v.finishedAt === 'number') a.finishedAt = v.finishedAt
  const r = v.resume
  if (isRecord(r) && (r.stage === 'running' || r.stage === 'grading') && typeof r.phaseIndex === 'number') {
    a.resume = { stage: r.stage, phaseIndex: r.phaseIndex }
  }
  return [a]
}

/** Keeps only entries that are recognisably a schedule, so a bad import cannot poison a later read. */
function cardStates(v: unknown): Record<string, CardState> {
  const out: Record<string, CardState> = {}
  if (!isRecord(v)) return out
  for (const [id, s] of Object.entries(v)) {
    if (isRecord(s) && ['reps', 'ease', 'intervalDays', 'dueAt', 'lapses'].every((k) => typeof s[k] === 'number')) {
      out[id] = s as unknown as CardState
    }
  }
  return out
}

function questionDays(v: unknown): ProgressState['questionDays'] {
  const out: ProgressState['questionDays'] = {}
  if (!isRecord(v)) return out
  for (const [day, c] of Object.entries(v)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && isRecord(c) && typeof c.answered === 'number' && typeof c.correct === 'number') {
      out[day] = { answered: c.answered, correct: c.correct }
    }
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export function loadTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY)
    if (t === 'light' || t === 'dark' || t === 'system') return t
  } catch {
    /* storage blocked */
  }
  return 'system'
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* storage blocked — the choice just won't survive a reload */
  }
}

/** Resolve `system` against the OS and stamp the root element. */
export function applyTheme(theme: Theme): void {
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme
  document.documentElement.setAttribute('data-theme', resolved)
}
