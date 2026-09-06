import type { CardItem, Module, Problem, Track } from './types'
import { tracks as trackDefs } from './tracks'
import { foundationsModules } from './modules/foundations'
import { coreModules } from './modules/core'
import { appliedModules } from './modules/applied'
import { interviewModules } from './modules/interview'
import { problems as problemList } from './problems'
import { validateContent } from './validate'

/** Every module, in curriculum order. Track order first, then station within a track. */
export const modules: Module[] = [
  ...foundationsModules,
  ...coreModules,
  ...appliedModules,
  ...interviewModules,
]

export const tracks: Track[] = trackDefs.map((t) => ({
  ...t,
  moduleIds: modules.filter((m) => m.trackId === t.id).sort((a, b) => a.station - b.station).map((m) => m.id),
}))

/** Tracks that actually have content. Guards the map against a half-authored curriculum. */
export const populatedTracks: Track[] = tracks.filter((t) => t.moduleIds.length > 0)

export const problems: Problem[] = problemList

const byId = new Map(modules.map((m) => [m.id, m]))
export function getModule(id: string | undefined): Module | undefined {
  return id ? byId.get(id) : undefined
}

const problemById = new Map(problems.map((p) => [p.id, p]))
export function getProblem(id: string | undefined): Problem | undefined {
  return id ? problemById.get(id) : undefined
}

export function modulesOfTrack(trackId: string): Module[] {
  return modules.filter((m) => m.trackId === trackId).sort((a, b) => a.station - b.station)
}

export const allCards: CardItem[] = modules.flatMap((m) => m.cards)

export const totalQuizItems = modules.reduce((n, m) => n + m.quiz.length, 0)

/* ------------------------------------------------------------------ */
/* Dev-time curriculum validation                                      */
/* ------------------------------------------------------------------ */

/**
 * The content is hand-authored data, so the failure mode is a typo in a prereq id or a
 * quiz whose `correct` index points at nothing. Types cannot catch either. This runs
 * once in dev and is stripped from the production bundle.
 */
if (import.meta.env.DEV) {
  const problems_: string[] = []
  const ids = new Set<string>()
  const itemIds = new Set<string>()

  for (const m of modules) {
    if (ids.has(m.id)) problems_.push(`duplicate module id: ${m.id}`)
    ids.add(m.id)

    if (!trackDefs.some((t) => t.id === m.trackId)) {
      problems_.push(`${m.id}: unknown trackId "${m.trackId}"`)
    }

    for (const q of m.quiz) {
      if (itemIds.has(q.id)) problems_.push(`duplicate quiz id: ${q.id}`)
      itemIds.add(q.id)
      if (q.moduleId !== m.id) problems_.push(`${q.id}: moduleId does not match its module`)
      if (q.options.length < 2) problems_.push(`${q.id}: needs at least two options`)
      if (q.correct < 0 || q.correct >= q.options.length) {
        problems_.push(`${q.id}: correct index ${q.correct} is out of range`)
      }
    }

    for (const c of m.cards) {
      if (itemIds.has(c.id)) problems_.push(`duplicate card id: ${c.id}`)
      itemIds.add(c.id)
      if (c.moduleId !== m.id) problems_.push(`${c.id}: moduleId does not match its module`)
    }
  }

  // Second pass: prereqs can point forward or backward, but must exist.
  for (const m of modules) {
    for (const p of m.prereqs) {
      if (!ids.has(p)) problems_.push(`${m.id}: prereq "${p}" does not exist`)
      if (p === m.id) problems_.push(`${m.id}: is its own prereq`)
    }
  }

  for (const p of problems) {
    for (const s of p.suggests) {
      if (!ids.has(s)) problems_.push(`problem ${p.id}: suggests unknown module "${s}"`)
    }
    const rubricIds = new Set<string>()
    for (const r of p.rubric) {
      if (rubricIds.has(r.id)) problems_.push(`problem ${p.id}: duplicate rubric id ${r.id}`)
      rubricIds.add(r.id)
    }
  }

  // Figures on every unit, and no unexplained abbreviations.
  for (const issue of validateContent(modules, problems)) {
    problems_.push(`${issue.where}: ${issue.message}`)
  }

  if (problems_.length) {
    console.error(
      `[curriculum] ${problems_.length} problem(s) found:\n` + problems_.map((p) => `  • ${p}`).join('\n'),
    )
  }
}
