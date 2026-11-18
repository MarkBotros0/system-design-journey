import { describe, expect, it } from 'vitest'
import type { Problem } from '../content/types'
import { getProblem, problems } from '../content'
import { emptyProgress, type ProblemAttempt } from './storage'
import { attemptCoverage, practiceNext, readiness, surpriseMe } from './readiness'

const attempt = (problemId: string, scored: Record<string, boolean>, finished = true): ProblemAttempt => ({
  id: `a-${problemId}-${Math.random()}`,
  problemId,
  startedAt: 1,
  finishedAt: finished ? 2 : undefined,
  notes: {},
  phaseSeconds: {},
  scored,
})

const fake = (id: string, suggests: string[] = []): Problem => ({
  id,
  title: id,
  kind: 'hld',
  category: 'infra',
  difficulty: 'easy',
  brief: '',
  patterns: [],
  suggests,
  modelAnswer: [],
  rubric: [
    { id: 'r1', criterion: 'a', bar: 'must' },
    { id: 'r2', criterion: 'b', bar: 'senior' },
    { id: 'r3', criterion: 'c', bar: 'staff' },
  ],
})

describe('attemptCoverage', () => {
  it('weights must 3, senior 2, staff 1', () => {
    expect(attemptCoverage(fake('x'), attempt('x', { r1: true }))).toBe(0.5)
    expect(attemptCoverage(fake('x'), attempt('x', { r2: true, r3: true }))).toBe(0.5)
    expect(attemptCoverage(fake('x'), attempt('x', { r1: true, r2: true, r3: true }))).toBe(1)
  })
})

describe('readiness', () => {
  it('starts at zero for every round, each with a next step', () => {
    const r = readiness(emptyProgress())
    expect(r.map((x) => x.id)).toEqual(['system-design', 'lld', 'behavioral'])
    for (const round of r) {
      expect(round.score).toBe(0)
      expect(round.lessonsTotal, round.id).toBeGreaterThan(0)
      expect(round.next, round.id).toBeDefined()
    }
    expect(r.find((x) => x.id === 'system-design')!.lessonsTotal).toBeGreaterThan(0)
    expect(r.find((x) => x.id === 'behavioral')!.lessonsTotal).toBeGreaterThan(0)
  })

  it('credits a strong attempt toward the system design round', () => {
    const bitly = getProblem('bitly')!
    const all = Object.fromEntries(bitly.rubric.map((r) => [r.id, true]))
    const p = { ...emptyProgress(), attempts: [attempt('bitly', all)] }
    const sd = readiness(p).find((x) => x.id === 'system-design')!
    expect(sd.problemsCredit).toBeGreaterThan(0)
    expect(sd.score).toBeGreaterThan(0)
  })
})

describe('practiceNext', () => {
  it('prefers a problem whose suggested lessons you have read', () => {
    const uber = getProblem('uber')!
    const p = { ...emptyProgress(), lessonsRead: Object.fromEntries(uber.suggests.map((id) => [id, 1])) }
    const pick = practiceNext(p, 'hld')!
    const share = pick.suggests.filter((id) => p.lessonsRead[id]).length / pick.suggests.length
    expect(share).toBe(1)
  })

  it('once everything is attempted, returns the weakest attempt', () => {
    const pool = [fake('strong'), fake('weak')]
    const p = {
      ...emptyProgress(),
      attempts: [attempt('strong', { r1: true, r2: true, r3: true }), attempt('weak', { r3: true })],
    }
    expect(practiceNext(p, 'hld', pool)?.id).toBe('weak')
  })
})

describe('surpriseMe', () => {
  it('is deterministic given a random source, and falls back to any unattempted', () => {
    const first = problems.filter((x) => x.kind === 'hld')[0]
    expect(surpriseMe(emptyProgress(), 'hld', () => 0).id).toBe(first.id)
  })

  it('prefers problems you are prepared for', () => {
    const pool = [fake('unprepared', ['c-cap']), fake('prepared', ['f-what'])]
    const p = { ...emptyProgress(), lessonsRead: { 'f-what': 1 } }
    expect(surpriseMe(p, 'hld', () => 0, pool).id).toBe('prepared')
  })
})
