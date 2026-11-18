/**
 * The question bank's logic: checking an answer, scheduling the question, and choosing
 * what a set asks next. Pure functions plus the small sessionStorage wrapper that lets a
 * set survive a "Learn more" detour.
 */

import { tracks } from '../content'
import { bank, getQuestion, questionTopic } from '../content/bank'
import type { Question, QuestionKind } from '../content/types'
import { dayKey } from './progress'
import { newCard, review, type CardState } from './srs'
import type { ProgressState } from './storage'

/** single → option index · multi → option indexes · truefalse → boolean · match → left index → right index (as authored). */
export type Answer = number | number[] | boolean | Record<number, number>

export function isCorrect(q: Question, a: Answer): boolean {
  switch (q.kind) {
    case 'single':
      return a === q.correct
    case 'multi': {
      if (!Array.isArray(a)) return false
      const want = new Set(q.correct)
      const got = new Set(a)
      return got.size === want.size && [...got].every((i) => want.has(i))
    }
    case 'truefalse':
      return a === q.answer
    case 'match':
      if (typeof a !== 'object' || a === null || Array.isArray(a)) return false
      return q.pairs.every((_, i) => a[i] === i)
  }
}

export function scheduleAnswer(state: CardState | undefined, correct: boolean, now = Date.now()): CardState {
  return review(state ?? newCard(now), correct ? 'good' : 'again', now)
}

/** Missed last time, or missed before and not yet answered right twice running. */
export function isWeak(s: CardState | undefined): boolean {
  return !!s && (s.lastGrade === 'again' || (s.lapses > 0 && s.reps < 2))
}

export type BankScope = 'all' | 'studied' | 'weak'

export interface SetOptions {
  size: number
  scope: BankScope
  trackIds?: string[]
  kinds?: QuestionKind[]
  now: number
  rand: () => number
  /** Defaults to the whole bank; tests pass their own. */
  pool?: Question[]
}

/** Generated questions (glossary, patterns) belong to no track. */
const REFERENCE = '_reference'
const trackOf = (q: Question) => questionTopic(q).trackId ?? REFERENCE

function shuffle<T>(items: T[], rand: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** One from each track in turn, so a set is never ten questions on one lesson. */
function interleave(qs: Question[], rand: () => number): Question[] {
  const groups = new Map<string, Question[]>()
  for (const q of shuffle(qs, rand)) {
    const t = trackOf(q)
    groups.set(t, [...(groups.get(t) ?? []), q])
  }
  const lanes = [...groups.values()]
  const out: Question[] = []
  for (let i = 0; out.length < qs.length; i++) for (const lane of lanes) if (lane[i]) out.push(lane[i])
  return out
}

/**
 * The ids for one set, in the order to ask them:
 *  1. due questions, most overdue first;
 *  2. under "weak", misses not yet due;
 *  3. new questions, tracks interleaved, lessons already read first;
 *  4. only if still short, answered questions that are not due yet, soonest first —
 *     so "practise this track" works even once every question in it has been seen.
 */
export function buildSet(p: ProgressState, opts: SetOptions): string[] {
  const { size, scope, trackIds, kinds, now, rand } = opts
  let pool = opts.pool ?? bank
  if (kinds?.length) pool = pool.filter((q) => kinds.includes(q.kind))
  if (trackIds?.length) pool = pool.filter((q) => trackIds.includes(trackOf(q)))
  const studied = (q: Question) => !!q.moduleId && !!p.lessonsRead[q.moduleId]
  if (scope === 'studied') pool = pool.filter(studied)
  if (scope === 'weak') pool = pool.filter((q) => isWeak(p.questions[q.id]))

  const state = (q: Question) => p.questions[q.id]
  const due = pool.filter((q) => state(q) && state(q).dueAt <= now).sort((a, b) => state(a).dueAt - state(b).dueAt)
  const later = pool.filter((q) => state(q) && state(q).dueAt > now).sort((a, b) => state(a).dueAt - state(b).dueAt)
  const fresh = pool.filter((q) => !state(q))
  const freshOrdered =
    scope === 'all'
      ? [...interleave(fresh.filter(studied), rand), ...interleave(fresh.filter((q) => !studied(q)), rand)]
      : interleave(fresh, rand)

  const ordered = scope === 'weak' ? [...due, ...later] : [...due, ...freshOrdered, ...later]
  return ordered.slice(0, size).map((q) => q.id)
}

/* ------------------------------------------------------------------ */
/* Daily counts and stats                                              */
/* ------------------------------------------------------------------ */

const KEEP_DAYS = 120
const DAY = 86_400_000

export function recordDay(days: ProgressState['questionDays'], correct: boolean, now = Date.now()): ProgressState['questionDays'] {
  const cutoff = dayKey(now - KEEP_DAYS * DAY)
  const today = dayKey(now)
  const next: ProgressState['questionDays'] = {}
  for (const [d, c] of Object.entries(days)) if (d >= cutoff) next[d] = c
  const t = next[today] ?? { answered: 0, correct: 0 }
  next[today] = { answered: t.answered + 1, correct: t.correct + (correct ? 1 : 0) }
  return next
}

export function todayCount(p: ProgressState, now = Date.now()): { answered: number; correct: number } {
  return p.questionDays[dayKey(now)] ?? { answered: 0, correct: 0 }
}

export interface TrackStat {
  trackId: string
  total: number
  answered: number
  /** Answered right the latest time. */
  correct: number
  /** correct / answered; null until something is answered. */
  accuracy: number | null
  due: number
}

/**
 * Accuracy is over each question's latest answer — "how many of these would you get right
 * today" — not a lifetime average that never forgets an early miss.
 */
export function bankStats(p: ProgressState, now = Date.now(), pool: Question[] = bank) {
  const byId = new Map<string, TrackStat>()
  for (const t of tracks) byId.set(t.id, { trackId: t.id, total: 0, answered: 0, correct: 0, accuracy: null, due: 0 })
  let answered = 0
  let correct = 0
  for (const q of pool) {
    const t = byId.get(trackOf(q))
    const s = p.questions[q.id]
    if (t) t.total++
    if (!s) continue
    const hit = s.lastGrade === 'good'
    answered++
    if (hit) correct++
    if (t) {
      t.answered++
      if (hit) t.correct++
      if (s.dueAt <= now) t.due++
    }
  }
  const byTrack = [...byId.values()]
    .filter((t) => t.total > 0)
    .map((t) => ({ ...t, accuracy: t.answered ? t.correct / t.answered : null }))
  return { answered, accuracy: answered ? correct / answered : null, total: pool.length, byTrack }
}

/* ------------------------------------------------------------------ */
/* The set in progress                                                 */
/* ------------------------------------------------------------------ */

const SET_KEY = 'tp:qset'

export interface SetResult {
  id: string
  correct: boolean
}

/** A set being answered: survives "Learn more" and Back, dies with the tab. */
export interface QuestionSet {
  /** What to show as the set's name and to offer "Another set" with. */
  source: string
  ids: string[]
  /** Index into `ids` of the question on screen. */
  at: number
  results: SetResult[]
  /** Answer given to `ids[at]`, while its feedback is showing. */
  pending?: { answer: Answer; correct: boolean }
  startedAt: number
}

export function loadSet(): QuestionSet | null {
  try {
    const raw = sessionStorage.getItem(SET_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as QuestionSet
    if (!Array.isArray(s.ids) || typeof s.at !== 'number' || !Array.isArray(s.results)) return null
    // A set from an older build may name questions that no longer exist.
    const ids = s.ids.filter((id) => getQuestion(id))
    if (ids.length !== s.ids.length) return null
    return s
  } catch {
    return null
  }
}

export function saveSet(s: QuestionSet | null): void {
  try {
    if (s) sessionStorage.setItem(SET_KEY, JSON.stringify(s))
    else sessionStorage.removeItem(SET_KEY)
  } catch {
    /* storage blocked — the set just will not survive a reload */
  }
}

/**
 * After answering: a miss goes round once more at the end of the set (not twice — a
 * question you keep missing belongs in the lesson, not on a loop).
 */
export function advanceSet(s: QuestionSet, correct: boolean): QuestionSet {
  const id = s.ids[s.at]
  const results = [...s.results, { id, correct }]
  const missedBefore = s.results.some((r) => r.id === id && !r.correct)
  const ids = !correct && !missedBefore ? [...s.ids, id] : s.ids
  return { ...s, ids, results, at: s.at + 1, pending: undefined }
}

export function isFinished(s: QuestionSet): boolean {
  return s.at >= s.ids.length
}
