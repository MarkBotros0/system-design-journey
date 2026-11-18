/**
 * Attempts at a design problem. An attempt is saved as a draft (no `finishedAt`) from the
 * moment the clock starts, so a back gesture, a phone call or iOS evicting the app never
 * costs the learner forty minutes of notes. Only finished attempts count anywhere.
 */

import type { ProblemAttempt, ProgressState } from './storage'

export function finishedAttempts(p: ProgressState, problemId?: string): ProblemAttempt[] {
  return p.attempts.filter((a) => !!a.finishedAt && (!problemId || a.problemId === problemId))
}

/** The newest unfinished attempt at this problem — the one "Resume" picks up. */
export function draftOf(p: ProgressState, problemId: string): ProblemAttempt | undefined {
  return p.attempts
    .filter((a) => !a.finishedAt && a.problemId === problemId)
    .sort((a, b) => b.startedAt - a.startedAt)[0]
}

export function resumePoint(draft: ProblemAttempt, phaseCount: number): NonNullable<ProblemAttempt['resume']> {
  const r = draft.resume
  const phaseIndex = Math.max(0, Math.min(r?.phaseIndex ?? 0, phaseCount - 1))
  return { stage: r?.stage === 'grading' ? 'grading' : 'running', phaseIndex }
}
