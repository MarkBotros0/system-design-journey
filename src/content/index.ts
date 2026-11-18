import type { CardItem, Module, Problem, Route, RouteStop, Track } from './types'
import { tracks as trackDefs } from './tracks'
import { foundationsModules } from './modules/foundations'
import { principlesModules } from './modules/principles'
import { designPatternsModules } from './modules/designPatterns'
import { designPatterns2Modules } from './modules/designPatterns2'
import { lldModules } from './modules/lld'
import { coreModules } from './modules/core'
import { databasesModules } from './modules/databases'
import { databases2Modules } from './modules/databases2'
import { distributedModules } from './modules/distributed'
import { architectureModules } from './modules/architecture'
import { productionModules } from './modules/production'
import { appliedModules } from './modules/applied'
import { interviewModules } from './modules/interview'
import { behavioralModules } from './modules/behavioral'
import { problems as problemList } from './problems'
import { validateContent, validateProblemShape } from './validate'
import { buildRoutes } from './routes'
import { glossary } from './glossary'
import { patterns } from './patterns'

const trackOrder = new Map(trackDefs.map((t, i) => [t.id, i]))

/** Every module, in curriculum order. Track order first, then station within a track. */
export const modules: Module[] = [
  ...foundationsModules,
  ...principlesModules,
  ...designPatternsModules,
  ...designPatterns2Modules,
  ...lldModules,
  ...coreModules,
  ...databasesModules,
  ...databases2Modules,
  ...distributedModules,
  ...architectureModules,
  ...productionModules,
  ...appliedModules,
  ...interviewModules,
  ...behavioralModules,
].sort(
  (a, b) =>
    (trackOrder.get(a.trackId) ?? 99) - (trackOrder.get(b.trackId) ?? 99) || a.station - b.station,
)

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

const trackById = new Map(tracks.map((t) => [t.id, t]))
export function getTrack(id: string | undefined): Track | undefined {
  return id ? trackById.get(id) : undefined
}

/** Every route, built against the content that exists. See routes.ts. */
export const routes: Route[] = buildRoutes({
  modules,
  problems,
  trackOrder: trackDefs.map((t) => t.id),
})

const routeById = new Map(routes.map((r) => [r.id, r]))
/** Unknown ids fall back to the full journey — a stale stored route id must never strand anyone. */
export function getRoute(id: string | undefined): Route {
  return (id && routeById.get(id)) || routes[0]
}

/** A stop's referent must exist, and no stop may repeat on a route. */
export function routeIssues(route: Route): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const s of route.stops) {
    const key = 'module' in s ? `m:${s.module}` : `p:${s.problem}`
    if (seen.has(key)) out.push(`route ${route.id}: ${key} appears twice`)
    seen.add(key)
    const ok = 'module' in s ? byId.has(s.module) : problemById.has(s.problem)
    if (!ok) out.push(`route ${route.id}: ${key} does not exist`)
  }
  return out
}

export function stopTitle(stop: RouteStop): string {
  return 'module' in stop ? (byId.get(stop.module)?.title ?? stop.module) : (problemById.get(stop.problem)?.title ?? stop.problem)
}

export function modulesOfTrack(trackId: string): Module[] {
  return modules.filter((m) => m.trackId === trackId).sort((a, b) => a.station - b.station)
}

export const allCards: CardItem[] = modules.flatMap((m) => m.cards)

export const totalQuizItems = modules.reduce((n, m) => n + m.quiz.length, 0)

/* ------------------------------------------------------------------ */
/* Related lessons                                                     */
/* ------------------------------------------------------------------ */

/**
 * `related` is authored one way — a deep lesson names the survey lesson it deepens — and
 * shown both ways, so the survey gains a "go deeper" link with no edit to old content.
 */
export function buildRelated(list: Module[]): Map<string, string[]> {
  const map = new Map<string, Set<string>>()
  const add = (a: string, b: string) => {
    if (a === b) return
    if (!map.has(a)) map.set(a, new Set())
    map.get(a)!.add(b)
  }
  for (const m of list) {
    for (const r of m.related ?? []) {
      add(m.id, r)
      add(r, m.id)
    }
  }
  return new Map([...map].map(([k, v]) => [k, [...v]]))
}

const relatedMap = buildRelated(modules)
export function relatedOf(moduleId: string): Module[] {
  return (relatedMap.get(moduleId) ?? []).map((id) => byId.get(id)).filter((m): m is Module => !!m)
}

/* ------------------------------------------------------------------ */
/* Curriculum checks                                                   */
/* ------------------------------------------------------------------ */

/**
 * The ten problems written before the walkthrough skeleton existed. They are held to it
 * once they have been re-headed; every new problem is held to it from the start.
 */
const LENIENT_PROBLEMS = new Set<string>([])

/**
 * Everything the type system cannot catch: a typo in a prereq id, a quiz whose `correct`
 * index points at nothing, an unexplained abbreviation, a walkthrough that skips a phase.
 * Dev boot logs the result; `content.test.ts` asserts it is empty.
 */
export function checkCurriculum(): string[] {
  const out: string[] = []
  const ids = new Set<string>()
  const itemIds = new Set<string>()

  for (const m of modules) {
    if (ids.has(m.id)) out.push(`duplicate module id: ${m.id}`)
    ids.add(m.id)

    if (!trackDefs.some((t) => t.id === m.trackId)) out.push(`${m.id}: unknown trackId "${m.trackId}"`)

    for (const q of m.quiz) {
      if (itemIds.has(q.id)) out.push(`duplicate quiz id: ${q.id}`)
      itemIds.add(q.id)
      if (q.moduleId !== m.id) out.push(`${q.id}: moduleId does not match its module`)
      if (q.options.length !== 4) out.push(`${q.id}: needs exactly four options`)
      if (q.correct < 0 || q.correct >= q.options.length) {
        out.push(`${q.id}: correct index ${q.correct} is out of range`)
      }
    }

    for (const c of m.cards) {
      if (itemIds.has(c.id)) out.push(`duplicate card id: ${c.id}`)
      itemIds.add(c.id)
      if (c.moduleId !== m.id) out.push(`${c.id}: moduleId does not match its module`)
    }
  }

  // Stations: unique within a track.
  for (const t of tracks) {
    const stations = modulesOfTrack(t.id).map((m) => m.station)
    if (new Set(stations).size !== stations.length) out.push(`track ${t.id}: duplicate station numbers`)
  }

  // Second pass: references must exist.
  for (const m of modules) {
    for (const p of m.prereqs) {
      if (!ids.has(p)) out.push(`${m.id}: prereq "${p}" does not exist`)
      if (p === m.id) out.push(`${m.id}: is its own prereq`)
    }
    for (const r of m.related ?? []) {
      if (!ids.has(r)) out.push(`${m.id}: related "${r}" does not exist`)
      if (r === m.id) out.push(`${m.id}: is related to itself`)
    }
  }

  const problemIds = new Set<string>()
  const patternIds = new Set(patterns.map((p) => p.id))
  for (const p of problems) {
    if (problemIds.has(p.id)) out.push(`duplicate problem id: ${p.id}`)
    problemIds.add(p.id)
    for (const s of p.suggests) {
      if (!ids.has(s)) out.push(`problem ${p.id}: suggests unknown module "${s}"`)
    }
    for (const pat of p.patterns) {
      if (!patternIds.has(pat)) out.push(`problem ${p.id}: unknown pattern "${pat}"`)
    }
    const rubricIds = new Set<string>()
    for (const r of p.rubric) {
      if (rubricIds.has(r.id)) out.push(`problem ${p.id}: duplicate rubric id ${r.id}`)
      rubricIds.add(r.id)
    }
    if (!LENIENT_PROBLEMS.has(p.id)) {
      for (const issue of validateProblemShape(p)) out.push(`problem ${p.id}: ${issue}`)
    }
  }

  const seenPatterns = new Set<string>()
  for (const pat of patterns) {
    if (seenPatterns.has(pat.id)) out.push(`duplicate pattern id: ${pat.id}`)
    seenPatterns.add(pat.id)
    if (pat.moduleId && !ids.has(pat.moduleId)) out.push(`pattern ${pat.id}: unknown module "${pat.moduleId}"`)
  }

  const seenTerms = new Set<string>()
  for (const g of glossary) {
    if (seenTerms.has(g.id)) out.push(`duplicate glossary id: ${g.id}`)
    seenTerms.add(g.id)
  }

  for (const r of routes) out.push(...routeIssues(r))

  // Figures on every unit, no unexplained abbreviations, well-formed figures.
  for (const issue of validateContent(modules, problems)) out.push(`${issue.where}: ${issue.message}`)

  return out
}

if (import.meta.env.DEV) {
  const issues = checkCurriculum()
  if (issues.length) {
    console.error(
      `[curriculum] ${issues.length} problem(s) found:\n` + issues.map((p) => `  • ${p}`).join('\n'),
    )
  }
}
