/**
 * Mastery, routes, activity and streaks — pure functions over a ProgressState.
 *
 * Two bars:
 *
 *   passed    lesson read + quiz ≥ 80%. Counts toward a route and toward readiness.
 *   mastered  passed + every card in the module learned (3 spaced reps).
 *
 * Nothing is locked. Prerequisites are "builds on" hints, and a route only decides what
 * "next" means — someone who searched for a topic can always open it.
 */

import type { Module, Route, RouteStop, Track } from '../content/types'
import { getModule } from '../content'
import { isLearned } from './srs'
import { stopKey, type ProgressState } from './progressState'

export const QUIZ_PASS = 0.8

export type ModuleStatus = 'available' | 'started' | 'passed' | 'mastered'

export function hasReadLesson(p: ProgressState, moduleId: string): boolean {
  return !!p.lessonsRead[moduleId]
}

export function quizPassed(p: ProgressState, moduleId: string): boolean {
  return (p.quiz[moduleId]?.best ?? 0) >= QUIZ_PASS
}

export function isPassed(p: ProgressState, moduleId: string): boolean {
  return hasReadLesson(p, moduleId) && quizPassed(p, moduleId)
}

export function isMastered(p: ProgressState, m: Module): boolean {
  if (!isPassed(p, m.id)) return false
  return m.cards.every((c) => isLearned(p.cards[c.id]))
}

/** Prerequisites not yet passed — shown as a hint, never enforced. */
export function missingPrereqs(p: ProgressState, m: Module): Module[] {
  return m.prereqs
    .filter((id) => !isPassed(p, id))
    .map((id) => getModule(id))
    .filter((x): x is Module => !!x)
}

export function moduleStatus(p: ProgressState, m: Module): ModuleStatus {
  if (isMastered(p, m)) return 'mastered'
  if (isPassed(p, m.id)) return 'passed'
  if (hasReadLesson(p, m.id) || p.quiz[m.id]) return 'started'
  return 'available'
}

/** 0–1, weighted so reading is a third of a module and the quiz two thirds. */
export function moduleProgress(p: ProgressState, m: Module): number {
  const read = hasReadLesson(p, m.id) ? 1 : 0
  const quiz = Math.min(1, (p.quiz[m.id]?.best ?? 0) / QUIZ_PASS)
  return read * 0.34 + quiz * 0.66
}

export function trackProgress(p: ProgressState, track: Track, modules: Module[]): number {
  const inTrack = modules.filter((m) => m.trackId === track.id)
  if (!inTrack.length) return 0
  const total = inTrack.reduce((n, m) => n + moduleProgress(p, m), 0)
  return total / inTrack.length
}

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */

export function problemDone(p: ProgressState, problemId: string): boolean {
  return p.attempts.some((a) => a.problemId === problemId && !!a.finishedAt)
}

export function stopDone(p: ProgressState, stop: RouteStop): boolean {
  return 'module' in stop ? isPassed(p, stop.module) : problemDone(p, stop.problem)
}

export function routeProgress(p: ProgressState, route: Route): { done: number; total: number } {
  return { done: route.stops.filter((s) => stopDone(p, s)).length, total: route.stops.length }
}

/**
 * The next thing to actually do on a route:
 *   1. a lesson you started and have not passed — finish what you began;
 *   2. otherwise the first unfinished stop at or after your start pointer;
 *   3. otherwise the first unfinished stop anywhere — the ones you skipped.
 */
export function nextOnRoute(p: ProgressState, route: Route): RouteStop | undefined {
  const started = route.stops.find((s) => 'module' in s && !isPassed(p, s.module) && isStarted(p, s.module))
  if (started) return started

  const from = Math.max(0, route.stops.findIndex((s) => stopKey(s) === p.startStop))
  return route.stops.slice(from).find((s) => !stopDone(p, s)) ?? route.stops.find((s) => !stopDone(p, s))
}

function isStarted(p: ProgressState, moduleId: string): boolean {
  return hasReadLesson(p, moduleId) || !!p.quiz[moduleId]
}

/** The stop after `stop` on a route, if it is on it. */
export function stopAfter(route: Route, stop: RouteStop): RouteStop | undefined {
  const i = route.stops.findIndex((s) => stopKey(s) === stopKey(stop))
  return i === -1 ? undefined : route.stops[i + 1]
}

export function stopBefore(route: Route, stop: RouteStop): RouteStop | undefined {
  const i = route.stops.findIndex((s) => stopKey(s) === stopKey(stop))
  return i <= 0 ? undefined : route.stops[i - 1]
}

/* ------------------------------------------------------------------ */
/* Activity                                                            */
/* ------------------------------------------------------------------ */

const KEEP_DAYS = 120

/** One more study action today; days older than KEEP_DAYS are dropped. */
export function bumpActivity(activity: Record<string, number>, now = Date.now()): Record<string, number> {
  const today = dayKey(now)
  const next: Record<string, number> = {}
  for (const [day, n] of Object.entries(activity)) {
    if (daysBetween(day, today) <= KEEP_DAYS) next[day] = n
  }
  next[today] = (next[today] ?? 0) + 1
  return next
}

/** The last seven local days, oldest first. */
export function weekActivity(activity: Record<string, number>, now = Date.now()): { day: string; count: number }[] {
  const d = new Date(now)
  return Array.from({ length: 7 }, (_, i) => {
    const day = dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - (6 - i), 12).getTime())
    return { day, count: activity[day] ?? 0 }
  })
}

/* ------------------------------------------------------------------ */
/* Streaks                                                             */
/* ------------------------------------------------------------------ */

/** Local calendar day, not UTC — a streak should follow the user's midnight. */
export function dayKey(ts = Date.now()): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const da = Date.UTC(ay, am - 1, ad)
  const db = Date.UTC(by, bm - 1, bd)
  return Math.round((db - da) / 86_400_000)
}

/** Call on any real study action. Idempotent within a day. */
export function touchStreak(streak: ProgressState['streak'], now = Date.now()): ProgressState['streak'] {
  const today = dayKey(now)
  if (streak.lastDay === today) return streak

  const gap = streak.lastDay ? daysBetween(streak.lastDay, today) : Infinity
  const current = gap === 1 ? streak.current + 1 : 1
  return {
    current,
    longest: Math.max(streak.longest, current),
    lastDay: today,
  }
}

/** A streak shown as "3 days" is a lie if the last study day was a week ago. */
export function liveStreak(streak: ProgressState['streak'], now = Date.now()): number {
  if (!streak.lastDay) return 0
  const gap = daysBetween(streak.lastDay, dayKey(now))
  return gap <= 1 ? streak.current : 0
}

/**
 * What the route sheet should tell `chooseRoute`. Only a real change moves the start
 * pointer: re-saving the sheet as it opened must not reset a pointer the learner never
 * touched — notably a migrated v1 learner's, which nothing else can restore.
 */
export function routeChangeOpts(
  initial: { routeId: string; skipBasics: boolean },
  chosen: { routeId: string; skipBasics: boolean },
): { skipBasics?: boolean } {
  return chosen.routeId !== initial.routeId || chosen.skipBasics !== initial.skipBasics ? { skipBasics: chosen.skipBasics } : {}
}
