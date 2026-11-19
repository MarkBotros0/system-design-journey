import { getModule, getProblem } from '../content'
import { isPassed } from './progress'
import { headingSlugs } from './slug'
import type { ProgressState } from './storage'
import { plainText } from './text'

export type ResumeTarget =
  | { kind: 'draft'; problemId: string; title: string; href: string }
  | { kind: 'lesson'; moduleId: string; trackId: string; title: string; section?: string; minutes: number; href: string }

/**
 * The one thing worth resuming, for the dock above the tab bar: an unfinished timed attempt
 * or a lesson left part-way, whichever was touched last. Null when there is nothing in
 * progress — starting something new is Home's job, not the dock's.
 */
export function resumeTarget(p: ProgressState): ResumeTarget | null {
  const draft = p.attempts
    .filter((a) => !a.finishedAt && getProblem(a.problemId))
    .sort((a, b) => b.startedAt - a.startedAt)[0]

  const place = p.lastPlace
  const m = place ? getModule(place.moduleId) : undefined
  const lesson = m && !isPassed(p, m.id) ? m : undefined

  if (draft && (!lesson || draft.startedAt > (place?.at ?? 0))) {
    const problem = getProblem(draft.problemId)!
    return { kind: 'draft', problemId: draft.problemId, title: plainText(problem.title), href: `/practice/${draft.problemId}` }
  }
  if (!lesson || !place) return null

  let section: string | undefined
  if (place.sectionId) {
    for (const [i, slug] of headingSlugs(lesson.lesson)) {
      const b = lesson.lesson[i]
      if (slug === place.sectionId && b.kind === 'heading') section = plainText(b.text)
    }
  }
  return {
    kind: 'lesson',
    moduleId: lesson.id,
    trackId: lesson.trackId,
    title: plainText(lesson.title),
    section,
    minutes: lesson.minutes,
    href: section ? `/m/${lesson.id}#${place.sectionId}` : `/m/${lesson.id}`,
  }
}
