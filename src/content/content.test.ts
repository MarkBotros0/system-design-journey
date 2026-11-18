import { describe, expect, it } from 'vitest'
import type { Module } from './types'
import { buildRelated, checkCurriculum } from './index'

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
