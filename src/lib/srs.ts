/**
 * Spaced repetition — SM-2, trimmed to what a single-user study app needs.
 *
 * Four grades rather than SM-2's six: on a phone, at speed, "did I know it or not" plus
 * a hard/easy nudge is all you can honestly self-report. Anything below `good` restarts
 * the interval, which is the part of SM-2 that actually does the work.
 */

export type Grade = 'again' | 'hard' | 'good' | 'easy'

export interface CardState {
  /** Successful reviews in a row. Reset to 0 by `again`. */
  reps: number
  /** SM-2 ease factor. Floor of 1.3 — below that a card churns forever. */
  ease: number
  intervalDays: number
  /** Epoch ms. Due when `dueAt <= now`. */
  dueAt: number
  /** How many times this card has been forgotten after being learned. */
  lapses: number
  lastGrade?: Grade
  lastAt?: number
}

const DAY = 86_400_000
const MIN_EASE = 1.3

export function newCard(now = Date.now()): CardState {
  return { reps: 0, ease: 2.5, intervalDays: 0, dueAt: now, lapses: 0 }
}

const EASE_DELTA: Record<Grade, number> = {
  again: -0.2,
  hard: -0.15,
  good: 0,
  easy: 0.15,
}

export function review(state: CardState, grade: Grade, now = Date.now()): CardState {
  const ease = Math.max(MIN_EASE, state.ease + EASE_DELTA[grade])

  if (grade === 'again') {
    return {
      ...state,
      reps: 0,
      ease,
      intervalDays: 0,
      // Come back inside the same session — 10 minutes, not tomorrow.
      dueAt: now + 10 * 60_000,
      lapses: state.lapses + 1,
      lastGrade: grade,
      lastAt: now,
    }
  }

  const reps = state.reps + 1
  let intervalDays: number
  if (reps === 1) intervalDays = grade === 'easy' ? 3 : 1
  else if (reps === 2) intervalDays = grade === 'hard' ? 3 : 6
  else intervalDays = Math.round(state.intervalDays * (grade === 'hard' ? 1.2 : ease))

  intervalDays = Math.max(1, Math.min(intervalDays, 365))

  return {
    ...state,
    reps,
    ease,
    intervalDays,
    dueAt: now + intervalDays * DAY,
    lastGrade: grade,
    lastAt: now,
  }
}

export function isDue(state: CardState | undefined, now = Date.now()): boolean {
  return !state || state.dueAt <= now
}

/**
 * A card counts as "learned" for module mastery once it has survived to a real
 * interval — three successful reps, i.e. roughly a week of retention.
 */
export function isLearned(state: CardState | undefined): boolean {
  return !!state && state.reps >= 3
}

/** Due cards first (most overdue leading), then never-seen, then the rest. */
export function sortForDrill<T extends { id: string }>(
  items: T[],
  states: Record<string, CardState | undefined>,
  now = Date.now(),
): T[] {
  return [...items].sort((a, b) => {
    const sa = states[a.id]
    const sb = states[b.id]
    const da = sa ? sa.dueAt : -Infinity
    const db = sb ? sb.dueAt : -Infinity
    const overdueA = da <= now
    const overdueB = db <= now
    if (overdueA !== overdueB) return overdueA ? -1 : 1
    return da - db
  })
}
