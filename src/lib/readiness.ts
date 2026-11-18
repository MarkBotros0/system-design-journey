/**
 * Interview readiness — how prepared you are for each round, and what to do next.
 *
 * A design round needs both halves: the lessons on that round's route, and problems
 * actually worked under the clock. Each is half the score. Problem credit is the sum of
 * your best rubric coverage per problem, against a target (eight well-done system design
 * problems is "ready"; four for low-level design). Behavioral is lessons only.
 */

import type { Problem, ProblemKind, RouteStop } from '../content/types'
import { getProblem, getRoute, problems as allProblems } from '../content'
import { ROUNDS } from '../content/routes'
import type { ProblemAttempt, ProgressState } from './storage'
import { isPassed } from './progress'

const WEIGHT = { must: 3, senior: 2, staff: 1 } as const

/** 0–1. Must-bar rows weigh most: missing those is what fails the round. */
export function attemptCoverage(problem: Problem, attempt: ProblemAttempt): number {
  let total = 0
  let hit = 0
  for (const r of problem.rubric) {
    total += WEIGHT[r.bar]
    if (attempt.scored[r.id]) hit += WEIGHT[r.bar]
  }
  return total ? hit / total : 0
}

export function bestCoverage(p: ProgressState, problemId: string, problem = getProblem(problemId)): number | undefined {
  if (!problem) return undefined
  const done = p.attempts.filter((a) => a.problemId === problemId && a.finishedAt)
  if (!done.length) return undefined
  return Math.max(...done.map((a) => attemptCoverage(problem, a)))
}

export interface RoundReadiness {
  id: 'system-design' | 'lld' | 'behavioral'
  title: string
  /** 0–1. */
  score: number
  lessonsDone: number
  lessonsTotal: number
  /** 0–1, design rounds only. */
  problemsCredit?: number
  problemsAttempted?: number
  next?: RouteStop
}

export function readiness(p: ProgressState): RoundReadiness[] {
  return ROUNDS.map((round) => {
    const route = getRoute(round.routeId)
    const lessonIds = route.stops.flatMap((s) => ('module' in s ? [s.module] : []))
    const lessonsDone = lessonIds.filter((id) => isPassed(p, id)).length
    const lessonsTotal = lessonIds.length
    const lessonShare = lessonsTotal ? lessonsDone / lessonsTotal : 0
    const nextLesson = lessonIds.find((id) => !isPassed(p, id))

    if (!round.problemKind) {
      return {
        id: round.id,
        title: round.title,
        score: lessonShare,
        lessonsDone,
        lessonsTotal,
        next: nextLesson ? { module: nextLesson } : undefined,
      }
    }

    const kind = round.problemKind
    const ofKind = allProblems.filter((x) => x.kind === kind)
    const coverages = ofKind.map((x) => bestCoverage(p, x.id, x)).filter((c): c is number => c !== undefined)
    const problemsCredit = Math.min(1, coverages.reduce((n, c) => n + c, 0) / round.target)
    const practice = practiceNext(p, kind)

    return {
      id: round.id,
      title: round.title,
      score: 0.5 * lessonShare + 0.5 * problemsCredit,
      lessonsDone,
      lessonsTotal,
      problemsCredit,
      problemsAttempted: coverages.length,
      next: nextLesson ? { module: nextLesson } : practice ? { problem: practice.id } : undefined,
    }
  })
}

function preparedShare(p: ProgressState, problem: Problem): number {
  if (!problem.suggests.length) return 0
  return problem.suggests.filter((id) => !!p.lessonsRead[id]).length / problem.suggests.length
}

const attempted = (p: ProgressState, id: string) => p.attempts.some((a) => a.problemId === id && a.finishedAt)

/**
 * The problem most worth doing next: an unattempted one you are best prepared for (most
 * of its suggested lessons read), ties to catalog order; once everything has been tried,
 * the one you did worst on.
 */
export function practiceNext(p: ProgressState, kind: ProblemKind = 'hld', pool = allProblems): Problem | undefined {
  const ofKind = pool.filter((x) => x.kind === kind)
  const fresh = ofKind.filter((x) => !attempted(p, x.id))
  if (fresh.length) {
    let best = fresh[0]
    for (const x of fresh) if (preparedShare(p, x) > preparedShare(p, best)) best = x
    return best
  }
  let weakest: Problem | undefined
  let low = Infinity
  for (const x of ofKind) {
    const c = bestCoverage(p, x.id, x) ?? 0
    if (c < low) {
      low = c
      weakest = x
    }
  }
  return weakest
}

/**
 * A random problem, the way a real interview hands you one: unattempted and at least
 * half-prepared for if possible, else any unattempted, else anything of that kind.
 */
export function surpriseMe(
  p: ProgressState,
  kind: ProblemKind,
  rand: () => number = Math.random,
  pool = allProblems,
): Problem {
  const ofKind = pool.filter((x) => x.kind === kind)
  const fresh = ofKind.filter((x) => !attempted(p, x.id))
  const prepared = fresh.filter((x) => preparedShare(p, x) >= 0.5)
  const from = prepared.length ? prepared : fresh.length ? fresh : ofKind
  return from[Math.min(from.length - 1, Math.floor(rand() * from.length))]
}
