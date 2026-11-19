import { describe, expect, it } from 'vitest'
import { resumeTarget } from './resume'
import { emptyProgress, type ProblemAttempt, type ProgressState } from './storage'

const withState = (over: Partial<ProgressState>): ProgressState => ({ ...emptyProgress(), ...over })
const draft = (problemId: string, startedAt: number, finishedAt?: number): ProblemAttempt => ({
  id: `${problemId}-${startedAt}`,
  problemId,
  startedAt,
  finishedAt,
  notes: {},
  phaseSeconds: {},
  scored: {},
})

describe('resumeTarget', () => {
  it('is null for a new learner', () => {
    expect(resumeTarget(emptyProgress())).toBeNull()
  })

  it('returns the lesson left part-way, aimed at its section', () => {
    const t = resumeTarget(withState({ lastPlace: { moduleId: 'db-isolation', sectionId: 'five-anomalies', at: 10 } }))
    expect(t).toMatchObject({
      kind: 'lesson',
      moduleId: 'db-isolation',
      trackId: 'databases',
      section: 'Five anomalies',
      href: '/m/db-isolation#five-anomalies',
    })
  })

  it('drops a section id that no longer names a heading', () => {
    const t = resumeTarget(withState({ lastPlace: { moduleId: 'db-isolation', sectionId: 'gone', at: 10 } }))
    expect(t).toMatchObject({ kind: 'lesson', href: '/m/db-isolation' })
    expect(t && 'section' in t ? t.section : undefined).toBeUndefined()
  })

  it('offers nothing for a lesson already passed', () => {
    const p = withState({
      lastPlace: { moduleId: 'db-isolation', at: 10 },
      lessonsRead: { 'db-isolation': 5 },
      quiz: { 'db-isolation': { best: 1, last: 1, attempts: 1 } },
    } as Partial<ProgressState>)
    expect(resumeTarget(p)).toBeNull()
  })

  it('returns an unfinished timed attempt', () => {
    expect(resumeTarget(withState({ attempts: [draft('ticketmaster', 20)] }))).toMatchObject({
      kind: 'draft',
      problemId: 'ticketmaster',
      href: '/practice/ticketmaster',
    })
  })

  it('ignores finished attempts and unknown problems', () => {
    expect(resumeTarget(withState({ attempts: [draft('ticketmaster', 20, 30), draft('no-such-problem', 40)] }))).toBeNull()
  })

  it('prefers whichever was touched last', () => {
    const lesson = { moduleId: 'db-isolation', at: 50 }
    expect(resumeTarget(withState({ lastPlace: lesson, attempts: [draft('ticketmaster', 20)] }))?.kind).toBe('lesson')
    expect(resumeTarget(withState({ lastPlace: lesson, attempts: [draft('ticketmaster', 90)] }))?.kind).toBe('draft')
  })
})
