import { describe, expect, it } from 'vitest'
import { draftOf, finishedAttempts, resumePoint } from './attempts'
import { emptyProgress, type ProblemAttempt } from './storage'

const attempt = (over: Partial<ProblemAttempt>): ProblemAttempt => ({
  id: 'a',
  problemId: 'bitly',
  startedAt: 100,
  notes: {},
  phaseSeconds: {},
  scored: {},
  ...over,
})

describe('attempts', () => {
  const p = {
    ...emptyProgress(),
    attempts: [
      attempt({ id: 'done', finishedAt: 500 }),
      attempt({ id: 'old-draft', startedAt: 200 }),
      attempt({ id: 'new-draft', startedAt: 300, resume: { stage: 'running', phaseIndex: 2 } }),
      attempt({ id: 'other', problemId: 'uber', finishedAt: 900 }),
    ],
  }

  it('finished attempts exclude drafts, optionally for one problem', () => {
    expect(finishedAttempts(p).map((a) => a.id)).toEqual(['done', 'other'])
    expect(finishedAttempts(p, 'bitly').map((a) => a.id)).toEqual(['done'])
  })

  it('the draft is the newest unfinished attempt for that problem', () => {
    expect(draftOf(p, 'bitly')?.id).toBe('new-draft')
    expect(draftOf(p, 'uber')).toBeUndefined()
  })

  it('resumes where the draft stopped, clamped to the phases that exist', () => {
    expect(resumePoint(attempt({ resume: { stage: 'running', phaseIndex: 2 } }), 6)).toEqual({ stage: 'running', phaseIndex: 2 })
    expect(resumePoint(attempt({ resume: { stage: 'running', phaseIndex: 9 } }), 6)).toEqual({ stage: 'running', phaseIndex: 5 })
    expect(resumePoint(attempt({ resume: { stage: 'grading', phaseIndex: 5 } }), 6)).toEqual({ stage: 'grading', phaseIndex: 5 })
    expect(resumePoint(attempt({}), 6)).toEqual({ stage: 'running', phaseIndex: 0 })
  })
})
