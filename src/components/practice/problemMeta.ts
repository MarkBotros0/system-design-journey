import { getModule } from '../../content'
import type { Phase } from '../../content/framework'
import type { Problem } from '../../content/types'
import type { ProblemAttempt } from '../../lib/storage'
import { resumePoint } from '../../lib/attempts'

/**
 * The track a problem leans on, when one clearly leads: the track most of its suggested
 * lessons come from. A tie means no single track is evident, and the problem gets a
 * neutral glyph rather than a colour it does not really own.
 */
export function problemTrack(problem: Problem): string | undefined {
  const counts = new Map<string, number>()
  for (const id of problem.suggests) {
    const m = getModule(id)
    if (m) counts.set(m.trackId, (counts.get(m.trackId) ?? 0) + 1)
  }
  let best: string | undefined
  let top = 0
  let tied = false
  for (const [track, n] of counts) {
    if (n > top) {
      best = track
      top = n
      tied = false
    } else if (n === top) tied = true
  }
  return tied ? undefined : best
}

/** Where an unfinished attempt stopped, as one line: "Phase 2 of 6: Core entities". */
export function draftWhere(draft: ProblemAttempt, phases: Phase[]): string {
  const at = resumePoint(draft, phases.length)
  return at.stage === 'grading' ? 'Ready to grade' : `Phase ${at.phaseIndex + 1} of ${phases.length}: ${phases[at.phaseIndex].name}`
}

/** Minutes already on the clock for an unfinished attempt. */
export function draftMinutes(draft: ProblemAttempt): number {
  return Math.round(Object.values(draft.phaseSeconds).reduce((n, x) => n + x, 0) / 60)
}

export function mmss(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
