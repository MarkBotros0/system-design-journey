/**
 * Mastery, unlocking, and streaks — pure functions over a ProgressState.
 *
 * Two bars, deliberately different:
 *
 *   passed    lesson read + quiz ≥ 80%.  Unlocks whatever depends on this module.
 *   mastered  passed + every card in the module learned (3 spaced reps).
 *
 * Unlocking uses the lighter bar on purpose. Cards need real days to mature, and gating
 * the next station behind a week of drilling would stall the journey for no benefit —
 * you should be able to move forward while yesterday's cards are still settling.
 */

import type { Module, Track } from '../content/types'
import { isLearned } from './srs'
import type { ProgressState } from './storage'

export const QUIZ_PASS = 0.8

export type ModuleStatus = 'locked' | 'available' | 'started' | 'passed' | 'mastered'

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

export function isUnlocked(p: ProgressState, m: Module): boolean {
  return m.prereqs.every((id) => isPassed(p, id))
}

export function moduleStatus(p: ProgressState, m: Module): ModuleStatus {
  if (!isUnlocked(p, m)) return 'locked'
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

/** The next thing to actually do. Drives the map's "continue" affordance. */
export function nextModule(p: ProgressState, modules: Module[]): Module | undefined {
  const started = modules.find(
    (m) => moduleStatus(p, m) === 'started' || (isUnlocked(p, m) && hasReadLesson(p, m.id) && !quizPassed(p, m.id)),
  )
  if (started) return started
  return modules.find((m) => moduleStatus(p, m) === 'available')
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
