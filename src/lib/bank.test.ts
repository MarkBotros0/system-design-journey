import { describe, expect, it } from 'vitest'
import type { Question } from '../content/types'
import { advanceSet, buildSet, bankStats, isCorrect, isFinished, recordDay, scheduleAnswer, todayCount, isWeak } from './bank'
import { emptyProgress, type ProgressState } from './storage'
import { dayKey } from './progress'

const NOW = Date.UTC(2026, 10, 18, 12)
const DAY = 86_400_000

const tf = (id: string, moduleId: string): Question => ({ id, kind: 'truefalse', moduleId, prompt: 'A claim.', explain: 'Why.', answer: true })

const single: Question = { id: 's', kind: 'single', moduleId: 'c-cap', prompt: 'p', explain: 'e', options: ['a', 'b', 'c', 'd'], correct: 2 }
const multi: Question = { id: 'm', kind: 'multi', moduleId: 'c-cap', prompt: 'p', explain: 'e', options: ['a', 'b', 'c', 'd'], correct: [0, 3] }
const match: Question = {
  id: 'x',
  kind: 'match',
  moduleId: 'c-cap',
  prompt: 'p',
  explain: 'e',
  pairs: [
    { left: 'a', right: '1' },
    { left: 'b', right: '2' },
    { left: 'c', right: '3' },
  ],
}

describe('isCorrect', () => {
  it('single: only the authored index', () => {
    expect(isCorrect(single, 2)).toBe(true)
    expect(isCorrect(single, 1)).toBe(false)
  })
  it('multi: exactly the correct set, in any order', () => {
    expect(isCorrect(multi, [3, 0])).toBe(true)
    expect(isCorrect(multi, [0])).toBe(false)
    expect(isCorrect(multi, [0, 1, 3])).toBe(false)
  })
  it('truefalse: the boolean', () => {
    expect(isCorrect(tf('t', 'c-cap'), true)).toBe(true)
    expect(isCorrect(tf('t', 'c-cap'), false)).toBe(false)
  })
  it('match: every left paired with its own right; incomplete is wrong', () => {
    expect(isCorrect(match, { 0: 0, 1: 1, 2: 2 })).toBe(true)
    expect(isCorrect(match, { 0: 1, 1: 0, 2: 2 })).toBe(false)
    expect(isCorrect(match, { 0: 0, 1: 1 })).toBe(false)
  })
  it('a wrong-shaped answer is wrong, not a throw', () => {
    expect(isCorrect(multi, 1)).toBe(false)
    expect(isCorrect(match, true)).toBe(false)
  })
})

describe('scheduleAnswer', () => {
  it('a hit spaces it out, a miss brings it back soon and counts as a lapse', () => {
    const hit = scheduleAnswer(undefined, true, NOW)
    expect(hit.dueAt).toBe(NOW + DAY)
    const miss = scheduleAnswer(hit, false, NOW)
    expect(miss.dueAt - NOW).toBeLessThan(DAY)
    expect(miss.lastGrade).toBe('again')
    expect(isWeak(miss)).toBe(true)
    expect(isWeak(hit)).toBe(false)
  })
})

/** Two questions in each of five tracks. */
const POOL: Question[] = [
  tf('core-1', 'c-cap'), tf('core-2', 'c-caching'),
  tf('db-1', 'db-acid'), tf('db-2', 'db-isolation'),
  tf('f-1', 'f-cache'), tf('f-2', 'f-db'),
  tf('p-1', 'p-oop'), tf('p-2', 'p-dip'),
  tf('d-1', 'd-consensus'), tf('d-2', 'd-time'),
  { ...multi, id: 'core-m' },
]
const TRACK: Record<string, string> = { c: 'core', db: 'databases', f: 'foundations', p: 'principles', d: 'distributed' }
const trackOf = (id: string) => TRACK[id.split('-')[0]] ?? 'core'
const rand = () => 0.42

function withState(over: Partial<ProgressState>): ProgressState {
  return { ...emptyProgress(), ...over }
}

describe('buildSet', () => {
  it('alternates tracks for new questions', () => {
    const ids = buildSet(emptyProgress(), { size: 5, scope: 'all', now: NOW, rand, pool: POOL })
    expect(ids).toHaveLength(5)
    expect(new Set(ids.map(trackOf)).size).toBe(5)
  })

  it('puts due questions first, most overdue first', () => {
    const p = withState({
      questions: {
        'db-2': { ...scheduleAnswer(undefined, true, NOW - 5 * DAY) },
        'p-1': { ...scheduleAnswer(undefined, true, NOW - 3 * DAY) },
        'f-1': { ...scheduleAnswer(undefined, true, NOW) },
      },
    })
    const ids = buildSet(p, { size: 4, scope: 'all', now: NOW, rand, pool: POOL })
    expect(ids.slice(0, 2)).toEqual(['db-2', 'p-1'])
    expect(ids).not.toContain('f-1')
  })

  it('puts studied lessons first under all topics', () => {
    const p = withState({ lessonsRead: { 'd-time': 1 } })
    const ids = buildSet(p, { size: 3, scope: 'all', now: NOW, rand, pool: POOL })
    expect(ids[0]).toBe('d-2')
  })

  it('studied scope keeps only questions on lessons read', () => {
    const p = withState({ lessonsRead: { 'c-cap': 1, 'db-acid': 1 } })
    const ids = buildSet(p, { size: 10, scope: 'studied', now: NOW, rand, pool: POOL })
    expect(ids.sort()).toEqual(['core-1', 'core-m', 'db-1'])
  })

  it('weak scope keeps only misses, due or not', () => {
    const missed = scheduleAnswer(undefined, false, NOW)
    const p = withState({ questions: { 'db-1': missed, 'f-2': scheduleAnswer(undefined, true, NOW - 9 * DAY) } })
    expect(buildSet(p, { size: 10, scope: 'weak', now: NOW, rand, pool: POOL })).toEqual(['db-1'])
  })

  it('respects kinds and track filters, and size', () => {
    expect(buildSet(emptyProgress(), { size: 10, scope: 'all', kinds: ['multi'], now: NOW, rand, pool: POOL })).toEqual(['core-m'])
    const db = buildSet(emptyProgress(), { size: 10, scope: 'all', trackIds: ['databases'], now: NOW, rand, pool: POOL })
    expect(db.sort()).toEqual(['db-1', 'db-2'])
    expect(buildSet(emptyProgress(), { size: 3, scope: 'all', now: NOW, rand, pool: POOL })).toHaveLength(3)
  })

  it('tops up with answered questions not yet due when nothing else is left', () => {
    const p = withState({ questions: { 'db-1': scheduleAnswer(undefined, true, NOW), 'db-2': scheduleAnswer(undefined, true, NOW) } })
    expect(buildSet(p, { size: 5, scope: 'all', trackIds: ['databases'], now: NOW, rand, pool: POOL })).toHaveLength(2)
  })

  it('is empty when nothing matches', () => {
    expect(buildSet(emptyProgress(), { size: 10, scope: 'studied', now: NOW, rand, pool: POOL })).toEqual([])
    expect(buildSet(emptyProgress(), { size: 10, scope: 'weak', now: NOW, rand, pool: POOL })).toEqual([])
  })
})

describe('daily counts and stats', () => {
  it('recordDay counts today and prunes old days', () => {
    const old = dayKey(NOW - 200 * DAY)
    const days = recordDay(recordDay({ [old]: { answered: 3, correct: 1 } }, true, NOW), false, NOW)
    expect(days[old]).toBeUndefined()
    expect(todayCount({ ...emptyProgress(), questionDays: days }, NOW)).toEqual({ answered: 2, correct: 1 })
  })

  it('bankStats reports accuracy on the latest answer, per track', () => {
    const p = withState({
      questions: {
        'db-1': scheduleAnswer(undefined, true, NOW),
        'db-2': scheduleAnswer(undefined, false, NOW),
        'f-1': scheduleAnswer(undefined, true, NOW),
      },
    })
    const s = bankStats(p, NOW, POOL)
    expect(s.answered).toBe(3)
    expect(s.accuracy).toBeCloseTo(2 / 3)
    const db = s.byTrack.find((t) => t.trackId === 'databases')!
    expect(db).toMatchObject({ total: 2, answered: 2, correct: 1 })
    expect(s.byTrack.find((t) => t.trackId === 'principles')).toMatchObject({ answered: 0, accuracy: null })
  })
})

describe('advanceSet', () => {
  const start = { source: 'daily', ids: ['a', 'b'], at: 0, results: [], startedAt: 0 }
  it('a miss goes round once more at the end, never twice', () => {
    let s = advanceSet(start, false)
    expect(s.ids).toEqual(['a', 'b', 'a'])
    s = advanceSet(s, true)
    s = advanceSet(s, false)
    expect(s.ids).toEqual(['a', 'b', 'a'])
    expect(isFinished(s)).toBe(true)
    expect(s.results.map((r) => r.correct)).toEqual([false, true, false])
  })
  it('a hit moves on without requeueing', () => {
    const s = advanceSet(start, true)
    expect(s).toMatchObject({ ids: ['a', 'b'], at: 1 })
    expect(isFinished(s)).toBe(false)
  })
})
