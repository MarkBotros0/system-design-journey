import { describe, expect, it } from 'vitest'
import { migrate, stopKey } from './storage'
import { parseImport } from './export'

/** A v1 record exactly as the previous build wrote it. */
function v1(over: Record<string, unknown> = {}) {
  return {
    version: 1,
    lessonsRead: {},
    quiz: {},
    cards: {},
    attempts: [],
    streak: { current: 0, longest: 0, lastDay: null },
    updatedAt: 1,
    ...over,
  }
}

const read = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, 1000]))
const quiz = (ids: string[], best: number) =>
  Object.fromEntries(ids.map((id) => [id, { best, attempts: 1, lastAt: 1000 }]))

const FOUNDATIONS = ['f-what', 'f-network', 'f-api', 'f-db', 'f-storage', 'f-cache', 'f-scale']

describe('migrate', () => {
  it('empty v1 → onboarding pending, route full', () => {
    const p = migrate(v1())
    expect(p.version).toBe(2)
    expect(p.onboarded).toBe(false)
    expect(p.routeId).toBe('full')
    expect(p.startStop).toBeNull()
    expect(p.bookmarks).toEqual([])
    expect(p.activity).toEqual({})
    expect(p.recentSearches).toEqual([])
    expect(p.lastPlace).toBeNull()
  })

  it('mid-core learner keeps everything and resumes in Core', () => {
    const passedIds = [...FOUNDATIONS, 'c-framework', 'c-requirements']
    const lessonsRead = read([...passedIds, 'c-modelling'])
    const quizzes = { ...quiz(passedIds, 0.9), ...quiz(['c-modelling'], 0.5) }
    const p = migrate(v1({ lessonsRead, quiz: quizzes }))
    expect(p.onboarded).toBe(true)
    expect(p.startStop).toBe('m:c-modelling')
    expect(p.lessonsRead).toEqual(lessonsRead)
    expect(p.quiz).toEqual(quizzes)
  })

  it('a learner who passed the whole old line has no start pointer', () => {
    const all = [
      ...FOUNDATIONS,
      'c-framework', 'c-requirements', 'c-modelling', 'c-caching', 'c-sharding', 'c-cap', 'c-queues', 'c-search',
      'a-realtime', 'a-longrunning', 'a-contention', 'a-reads', 'a-writes', 'a-blobs', 'a-multistep', 'a-proximity',
      'i-room', 'i-recognition',
    ]
    const p = migrate(v1({ lessonsRead: read(all), quiz: quiz(all, 1) }))
    expect(p.onboarded).toBe(true)
    expect(p.startStop).toBeNull()
  })

  it('v2 round-trips unchanged', () => {
    const v2 = {
      ...migrate(v1()),
      bookmarks: ['c-cap'],
      lastPlace: { moduleId: 'c-cap', sectionId: 'pacelc', at: 5 },
      routeId: 'lld',
      startStop: 'm:p-oop',
      onboarded: true,
      activity: { '2026-11-18': 3 },
      recentSearches: ['acid'],
    }
    expect(migrate(structuredClone(v2))).toEqual(v2)
  })

  it('garbage fields are defaulted', () => {
    const p = migrate(
      v1({
        version: 2,
        bookmarks: 'x',
        activity: null,
        recentSearches: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
        lastPlace: 7,
        routeId: 42,
      }),
    )
    expect(p.bookmarks).toEqual([])
    expect(p.activity).toEqual({})
    expect(p.recentSearches).toHaveLength(8)
    expect(p.lastPlace).toBeNull()
    expect(p.routeId).toBe('full')
  })

  it('non-object input gives a fresh record', () => {
    expect(migrate(null).version).toBe(2)
    expect(migrate('nope').onboarded).toBe(false)
  })
})

describe('stopKey', () => {
  it('prefixes modules and problems differently', () => {
    expect(stopKey({ module: 'c-cap' })).toBe('m:c-cap')
    expect(stopKey({ problem: 'uber' })).toBe('p:uber')
  })
})

describe('parseImport', () => {
  it('imports a v1 export as v2 with progress intact', () => {
    const text = JSON.stringify({
      format: 'throughput.progress',
      version: 1,
      exportedAt: '2026-10-01T00:00:00.000Z',
      progress: v1({ quiz: quiz(['f-what'], 0.9), lessonsRead: read(['f-what']) }),
    })
    const r = parseImport(text)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.progress.version).toBe(2)
    expect(r.progress.quiz['f-what'].best).toBe(0.9)
    expect(r.progress.onboarded).toBe(true)
  })

  it('rejects JSON that is not a Throughput export', () => {
    const r = parseImport(JSON.stringify({ hello: 'world' }))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/not a Throughput export/)
  })
})
