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
}

export interface ProgressState {
  version: 1
  /** moduleId -> when you finished reading it. */
  lessonsRead: Record<string, number>
  /** moduleId -> best quiz result. */
  quiz: Record<string, QuizRecord>
  /** cardId -> SRS state. */
  cards: Record<string, CardState>
  attempts: ProblemAttempt[]
  streak: { current: number; longest: number; lastDay: string | null }
  updatedAt: number
}

export function emptyProgress(): ProgressState {
  return {
    version: 1,
    lessonsRead: {},
    quiz: {},
    cards: {},
    attempts: [],
    streak: { current: 0, longest: 0, lastDay: null },
    updatedAt: Date.now(),
  }
}

/* ------------------------------------------------------------------ */
/* Progress record                                                     */
/* ------------------------------------------------------------------ */

export async function loadProgress(): Promise<ProgressState> {
  try {
    const raw = await idbGet<ProgressState>(PROGRESS_KEY)
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

/**
 * Version migrations live here. Bump `version` in ProgressState, add a branch, and
 * never mutate the shape in place — an old export must always import cleanly.
 */
function migrate(raw: ProgressState): ProgressState {
  const base = emptyProgress()
  return {
    ...base,
    ...raw,
    version: 1,
    lessonsRead: raw.lessonsRead ?? {},
    quiz: raw.quiz ?? {},
    cards: raw.cards ?? {},
    attempts: Array.isArray(raw.attempts) ? raw.attempts : [],
    streak: raw.streak ?? base.streak,
  }
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
