import { describe, expect, it } from 'vitest'
import type { Route } from '../content/types'
import { checkCurriculum, getModule, getRoute, routeIssues, routes } from '../content'
import { phasesFor, PHASES } from '../content/framework'
import { emptyProgress, type ProgressState } from './storage'
import {
  bumpActivity,
  missingPrereqs,
  moduleStatus,
  nextOnRoute,
  routeProgress,
  weekActivity,
} from './progress'

function withPassed(p: ProgressState, ids: string[]): ProgressState {
  const lessonsRead = { ...p.lessonsRead }
  const quiz = { ...p.quiz }
  for (const id of ids) {
    lessonsRead[id] = 1
    quiz[id] = { best: 1, attempts: 1, lastAt: 1 }
  }
  return { ...p, lessonsRead, quiz }
}

const ROUTE: Route = {
  id: 't',
  title: 't',
  blurb: '',
  stops: [{ module: 'f-what' }, { module: 'f-network' }, { module: 'c-framework' }, { module: 'c-requirements' }],
}

describe('module status', () => {
  it('is never locked — every topic is open', () => {
    expect(moduleStatus(emptyProgress(), getModule('c-cap')!)).toBe('available')
  })
})

describe('nextOnRoute', () => {
  it('prefers a lesson you started and have not passed', () => {
    const p = {
      ...emptyProgress(),
      lessonsRead: { 'c-requirements': 1 },
      quiz: { 'c-requirements': { best: 0.5, attempts: 1, lastAt: 1 } },
    }
    expect(nextOnRoute(p, ROUTE)).toEqual({ module: 'c-requirements' })
  })

  it('starts from the start pointer', () => {
    const p = { ...emptyProgress(), startStop: 'm:c-framework' }
    expect(nextOnRoute(p, ROUTE)).toEqual({ module: 'c-framework' })
  })

  it('wraps to an earlier unfinished stop once everything after the pointer is done', () => {
    const p = { ...withPassed(emptyProgress(), ['c-framework', 'c-requirements']), startStop: 'm:c-framework' }
    expect(nextOnRoute(p, ROUTE)).toEqual({ module: 'f-what' })
  })

  it('treats a start pointer that is not on the route as the beginning', () => {
    const p = { ...emptyProgress(), startStop: 'm:nowhere' }
    expect(nextOnRoute(p, ROUTE)).toEqual({ module: 'f-what' })
  })

  it('returns nothing when the route is finished', () => {
    const p = withPassed(emptyProgress(), ['f-what', 'f-network', 'c-framework', 'c-requirements'])
    expect(nextOnRoute(p, ROUTE)).toBeUndefined()
  })
})

describe('routeProgress', () => {
  it('counts real completions only, problems included', () => {
    const route: Route = { ...ROUTE, stops: [{ module: 'f-what' }, { module: 'f-network' }, { problem: 'bitly' }] }
    const p = {
      ...withPassed(emptyProgress(), ['f-what']),
      startStop: 'm:f-network',
      attempts: [{ id: 'a', problemId: 'bitly', startedAt: 1, finishedAt: 2, notes: {}, phaseSeconds: {}, scored: {} }],
    }
    expect(routeProgress(p, route)).toEqual({ done: 2, total: 3 })
  })

  it('does not count an unfinished attempt', () => {
    const route: Route = { ...ROUTE, stops: [{ problem: 'bitly' }] }
    const p = {
      ...emptyProgress(),
      attempts: [{ id: 'a', problemId: 'bitly', startedAt: 1, notes: {}, phaseSeconds: {}, scored: {} }],
    }
    expect(routeProgress(p, route).done).toBe(0)
  })
})

describe('missingPrereqs', () => {
  it('lists prerequisites not yet passed', () => {
    const m = getModule('c-requirements')!
    expect(missingPrereqs(emptyProgress(), m).map((x) => x.id)).toEqual(['c-framework'])
    expect(missingPrereqs(withPassed(emptyProgress(), ['c-framework']), m)).toEqual([])
  })
})

describe('activity', () => {
  const noon = (y: number, mo: number, d: number) => new Date(y, mo - 1, d, 12).getTime()

  it('bumps today and prunes days older than 120', () => {
    const a = bumpActivity({ '2026-01-01': 4, '2026-11-17': 1 }, noon(2026, 11, 18))
    expect(a['2026-11-18']).toBe(1)
    expect(a['2026-11-17']).toBe(1)
    expect(a['2026-01-01']).toBeUndefined()
    expect(bumpActivity(a, noon(2026, 11, 18))['2026-11-18']).toBe(2)
  })

  it('returns the last seven days, oldest first', () => {
    const w = weekActivity({ '2026-11-18': 3, '2026-11-12': 1, '2026-11-11': 9 }, noon(2026, 11, 18))
    expect(w).toHaveLength(7)
    expect(w[0]).toEqual({ day: '2026-11-12', count: 1 })
    expect(w[6]).toEqual({ day: '2026-11-18', count: 3 })
    expect(w[3].count).toBe(0)
  })
})

describe('routes', () => {
  it('every stop exists and none repeats, on every route', () => {
    expect(routes.flatMap(routeIssues)).toEqual([])
    expect(checkCurriculum().filter((i) => i.startsWith('route'))).toEqual([])
  })

  it('reports a route with an unknown or repeated stop', () => {
    const bad: Route = { ...ROUTE, stops: [{ module: 'nope' }, { module: 'f-what' }, { module: 'f-what' }] }
    expect(routeIssues(bad).length).toBe(2)
  })

  it('has the six routes, and falls back to the full journey', () => {
    expect(routes.map((r) => r.id)).toEqual(['full', 'two-weeks', 'system-design', 'lld', 'databases', 'behavioral'])
    expect(getRoute('nope').id).toBe('full')
  })

  it('the full route walks tracks in journey order', () => {
    const ids = getRoute('full').stops.flatMap((s) => ('module' in s ? [s.module] : []))
    expect(ids[0]).toBe('f-what')
    expect(ids.indexOf('c-framework')).toBeGreaterThan(ids.indexOf('f-scale'))
    expect(ids.indexOf('a-realtime')).toBeGreaterThan(ids.indexOf('c-search'))
  })
})

describe('framework', () => {
  it('lld phases fill 45 minutes and end with follow-ups', () => {
    const lld = phasesFor('lld')
    expect(lld.reduce((n, p) => n + p.minutes, 0)).toBe(45)
    expect(lld[lld.length - 1].followups).toBe(true)
  })

  it('hld phases are the existing six, with follow-ups in the deep dives', () => {
    expect(phasesFor('hld')).toBe(PHASES)
    expect(PHASES.find((p) => p.id === 'deepdives')?.followups).toBe(true)
  })
})
