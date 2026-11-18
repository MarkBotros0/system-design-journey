import { describe, expect, it } from 'vitest'
import type { Block } from '../content/types'
import { headingSlugs, slugify } from './slug'
import { search } from './search'

describe('slug', () => {
  it('is stable and unique within a lesson', () => {
    const blocks: Block[] = [
      { kind: 'heading', text: 'Trade-offs' },
      { kind: 'prose', text: 'x' },
      { kind: 'heading', text: 'Trade-offs' },
    ]
    const slugs = headingSlugs(blocks)
    expect(slugs.get(0)).toBe('trade-offs')
    expect(slugs.get(2)).toBe('trade-offs-2')
    expect(slugs.has(1)).toBe(false)
  })

  it('strips markup before slugging', () => {
    expect(slugify('**[[CAP]]** in practice')).toBe('cap-in-practice')
    expect(slugify('`SELECT … FOR UPDATE` held through checkout')).toBe('select-for-update-held-through-checkout')
  })
})

describe('search', () => {
  it('finds a lesson by title', () => {
    const r = search('caching')
    const lessons = r.groups.find((g) => g.type === 'lesson')
    expect(lessons?.hits.map((h) => h.id)).toEqual(expect.arrayContaining(['c-caching']))
  })

  it('finds a section with a deep link', () => {
    const r = search('fan-out')
    const sections = r.groups.find((g) => g.type === 'section')
    expect(sections?.hits.some((h) => /^\/m\/[\w-]+#[\w-]+$/.test(h.href))).toBe(true)
  })

  it('tolerates a typo', () => {
    expect(search('consistancy').total).toBeGreaterThan(0)
  })

  it('finds glossary terms', () => {
    const terms = search('TTL').groups.find((g) => g.type === 'term')
    expect(terms?.hits.map((h) => h.id)).toContain('TTL')
  })

  it('finds problems and patterns', () => {
    expect(search('ticketmaster').groups.find((g) => g.type === 'problem')?.hits[0]?.id).toBe('ticketmaster')
    expect(search('contention').groups.some((g) => g.type === 'pattern')).toBe(true)
  })

  it('keeps group order lesson, section, term, problem, pattern', () => {
    const order = ['lesson', 'section', 'term', 'problem', 'pattern']
    const types = search('cache').groups.map((g) => g.type)
    expect([...types].sort((a, b) => order.indexOf(a) - order.indexOf(b))).toEqual(types)
  })

  it('caps hits per group', () => {
    for (const g of search('the', 3).groups) expect(g.hits.length).toBeLessThanOrEqual(3)
  })

  it('survives awkward queries', () => {
    for (const q of ['2PC', 'C++', 'O(1)', 'x', '???', '   ', '[[', '\\', '*']) {
      expect(() => search(q)).not.toThrow()
    }
    expect(search('x').total).toBe(0)
    expect(search('???').total).toBe(0)
    expect(search('   ').total).toBe(0)
  })

  it('returns no results without throwing for nonsense', () => {
    const r = search('zzqvx qqzzv')
    expect(r.total).toBe(0)
    expect(Array.isArray(r.suggestions)).toBe(true)
  })

  it('every hit has a title, an href and matched terms', () => {
    for (const g of search('database').groups) {
      for (const h of g.hits) {
        expect(h.title.length).toBeGreaterThan(0)
        expect(h.href.startsWith('/')).toBe(true)
        expect(Array.isArray(h.terms)).toBe(true)
      }
    }
  })
})
