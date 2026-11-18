import { describe, expect, it } from 'vitest'
import type { Module } from './types'
import { buildRelated, checkCurriculum, getModule, getProblem, modules, problems, tracks } from './index'
import { ROUTE_SPECS } from './routes'
import { readiness } from '../lib/readiness'
import { emptyProgress } from '../lib/storage'

describe('curriculum', () => {
  it('has no issues', () => {
    const issues = checkCurriculum()
    expect(issues, issues.join('\n')).toEqual([])
  })
})

describe('related lessons', () => {
  const m = (id: string, related?: string[]): Module => ({
    id,
    trackId: 'core',
    title: id,
    station: 1,
    prereqs: [],
    minutes: 1,
    summary: '',
    lesson: [],
    quiz: [],
    cards: [],
    related,
  })

  it('is two-way and excludes self', () => {
    const map = buildRelated([m('deep', ['survey', 'deep']), m('survey'), m('other')])
    expect(map.get('survey')).toEqual(['deep'])
    expect(map.get('deep')).toEqual(['survey'])
    expect(map.get('other') ?? []).toEqual([])
  })

  it('dedupes when both sides list each other', () => {
    const map = buildRelated([m('a', ['b']), m('b', ['a'])])
    expect(map.get('a')).toEqual(['b'])
    expect(map.get('b')).toEqual(['a'])
  })
})

describe('routes', () => {
  it('name only lessons and problems that exist — nothing is silently dropped', () => {
    const ctx = { modules, problems, trackOrder: tracks.map((t) => t.id) }
    const missing = ROUTE_SPECS.flatMap((s) =>
      s
        .build(ctx)
        .filter((st) => ('module' in st ? !getModule(st.module) : !getProblem(st.problem)))
        .map((st) => `${s.id}: ${'module' in st ? st.module : st.problem}`),
    )
    expect(missing).toEqual([])
  })

  it('give every round something to do next from a standing start', () => {
    for (const r of readiness(emptyProgress())) expect(r.next, r.id).toBeDefined()
  })
})
