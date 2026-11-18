/**
 * The question bank's logic: checking an answer, scheduling the question, and choosing
 * what a set asks next. Pure functions plus the small sessionStorage wrapper that lets a
 * set survive a "Learn more" detour.
 */

import { getModule, getTrack, tracks } from '../content'
import { bank, getQuestion } from '../content/bank'
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
// Direct lookup — questionTopic() also resolves the section slug, which filtering never needs.
const trackOf = (q: Question) => (q.moduleId ? getModule(q.moduleId)?.trackId : undefined) ?? REFERENCE

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

  // New questions from one lesson are capped per set, so a learner who has read a single
  // lesson does not get seven questions on it in a row; the overflow waits for next time
  // (or fills the set when nothing else matches).
  const cap = Math.max(2, Math.ceil(size / 4))
  const perLesson = new Map<string, number>()
  const spread: Question[] = []
  const overflow: Question[] = []
  for (const q of freshOrdered) {
    const key = q.moduleId ?? q.id
    const n = perLesson.get(key) ?? 0
    perLesson.set(key, n + 1)
    ;(n < cap ? spread : overflow).push(q)
  }

  const ordered = scope === 'weak' ? [...due, ...later] : [...due, ...spread, ...later, ...overflow]
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

/**
 * A shuffled order of 0…n-1 that depends only on `seed` (the question id): options never
 * reshuffle under the learner, even after "Learn more" and back, yet the correct answer is
 * not always in the authored position.
 */
export function seededOrder(seed: string, n: number): number[] {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
  return shuffle(
    Array.from({ length: n }, (_, i) => i),
    rand,
  )
}

/**
 * The on-screen order of a match question's partners: stable per question, and never the
 * same order as the items — otherwise the answer is simply "straight across".
 */
export function partnerOrder(id: string, n: number): number[] {
  const order = seededOrder(`${id}:right`, n)
  return n > 1 && order.every((j, i) => j === i) ? [...order.slice(1), order[0]] : order
}

/** Where a set came from, as a stable string: the same filters always name the same set. */
export function setSource(params: URLSearchParams): string {
  if (params.get('set') === 'daily') return 'daily'
  const keep = ['scope', 'tracks', 'kinds', 'size']
  return new URLSearchParams([...params].filter(([k]) => keep.includes(k)).sort(([a], [b]) => a.localeCompare(b))).toString()
}

/** Entry points call this before opening a set: a finished set is not resumed, it is replaced. */
export function clearFinishedSet(): void {
  const s = loadSet()
  if (s && isFinished(s)) saveSet(null)
}

/* ------------------------------------------------------------------ */
/* Session requests                                                    */
/* ------------------------------------------------------------------ */

const KINDS: QuestionKind[] = ['single', 'multi', 'truefalse', 'match']
const SCOPES: BankScope[] = ['all', 'studied', 'weak']
const SIZES = [5, 10, 20]

export interface SetRequest {
  daily: boolean
  scope: BankScope
  size: number
  trackIds: string[]
  kinds: QuestionKind[]
}

/** What a session URL asks for: `?set=daily`, or `?scope=&tracks=&kinds=&size=` from the bank screen. Unknown values are dropped. */
export function setRequest(params: URLSearchParams, p: ProgressState): SetRequest {
  if (params.get('set') === 'daily') {
    const left = p.dailyGoal - todayCount(p).answered
    return { daily: true, scope: 'all', size: left > 0 ? left : p.dailyGoal, trackIds: [], kinds: [] }
  }
  const scope = SCOPES.find((s) => s === params.get('scope')) ?? 'all'
  const size = SIZES.find((n) => n === Number(params.get('size'))) ?? 10
  const trackIds = (params.get('tracks') ?? '').split(',').filter((t) => getTrack(t))
  const kinds = (params.get('kinds') ?? '').split(',').filter((k): k is QuestionKind => KINDS.includes(k as QuestionKind))
  return { daily: false, scope, size, trackIds, kinds }
}

export function setLabel(req: SetRequest): string {
  if (req.daily) return 'Daily questions'
  const parts: string[] = []
  if (req.trackIds.length === 1) parts.push(getTrack(req.trackIds[0])?.title ?? '')
  else if (req.trackIds.length > 1) parts.push(`${req.trackIds.length} tracks`)
  if (req.scope === 'weak') parts.push('weak spots')
  if (req.scope === 'studied') parts.push('studied')
  return parts.length ? `Questions · ${parts.join(' · ')}` : 'Questions'
}
