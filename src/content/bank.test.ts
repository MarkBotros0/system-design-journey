import { describe, expect, it } from 'vitest'
import { modules } from './index'
import { bank, getQuestion, questionTopic } from './bank'
import { generatedQuestions } from './bank/generated'
import { glossary } from './glossary'
import { validateQuestions } from './validate'
import type { Question } from './types'
import { headingSlugs } from '../lib/slug'

describe('bank', () => {
  it('has unique ids across sources', () => {
    const ids = bank.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes every lesson quiz item as a single question', () => {
    for (const m of modules) {
      for (const item of m.quiz) {
        const q = getQuestion(`quiz:${item.id}`)
        expect(q?.kind, item.id).toBe('single')
        expect(q?.moduleId).toBe(m.id)
      }
    }
  })

  it('generates deterministic glossary matches of 3–4 pairs, ids naming their members', () => {
    const a = generatedQuestions(glossary, [])
    const b = generatedQuestions(glossary, [])
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id))
    const gloss = a.filter((q) => q.id.startsWith('gloss:'))
    expect(gloss.length).toBeGreaterThan(20)
    for (const q of gloss) {
      if (q.kind !== 'match') throw new Error('not a match')
      expect(q.pairs.length).toBeGreaterThanOrEqual(3)
      expect(q.pairs.length).toBeLessThanOrEqual(4)
      expect(q.id).toBe(`gloss:${q.pairs.map((p) => p.left).join('+')}`)
    }
  })

  it('links a sectioned question to its lesson heading', () => {
    const m = modules.find((x) => headingSlugs(x.lesson).size > 0)!
    const [, slug] = [...headingSlugs(m.lesson)][0]
    const heading = m.lesson.find((b) => b.kind === 'heading')!
    const q: Question = {
      id: 't',
      kind: 'truefalse',
      moduleId: m.id,
      section: heading.kind === 'heading' ? heading.text : '',
      prompt: 'x',
      explain: 'y',
      answer: true,
    }
    expect(questionTopic(q).href).toBe(`/m/${m.id}#${slug}`)
    expect(questionTopic(q).trackId).toBe(m.trackId)
  })
})

describe('validateQuestions', () => {
  const m = modules[0]
  const base = { moduleId: m.id, prompt: 'A statement', explain: 'Because.' }
  const issues = (q: Question) => validateQuestions([q], modules)

  it('accepts well-formed questions of every kind', () => {
    expect(issues({ ...base, id: 'a', kind: 'truefalse', answer: false })).toEqual([])
    expect(issues({ ...base, id: 'b', kind: 'multi', options: ['a', 'b', 'c', 'd'], correct: [0, 2] })).toEqual([])
    expect(
      issues({ ...base, id: 'c', kind: 'match', pairs: [{ left: 'a', right: '1' }, { left: 'b', right: '2' }, { left: 'c', right: '3' }] }),
    ).toEqual([])
  })

  it('rejects a multi with fewer than two correct, or all correct', () => {
    expect(issues({ ...base, id: 'b', kind: 'multi', options: ['a', 'b', 'c', 'd'], correct: [1] }).length).toBeGreaterThan(0)
    expect(issues({ ...base, id: 'b', kind: 'multi', options: ['a', 'b', 'c', 'd'], correct: [0, 1, 2, 3] }).length).toBeGreaterThan(0)
  })

  it('rejects a match with a duplicate right side', () => {
    const q: Question = { ...base, id: 'c', kind: 'match', pairs: [{ left: 'a', right: '1' }, { left: 'b', right: '1' }, { left: 'c', right: '3' }] }
    expect(issues(q).length).toBeGreaterThan(0)
  })

  it('rejects markup in an option and an unknown section', () => {
    expect(issues({ ...base, id: 'd', kind: 'single', options: ['[[TTL]]', 'b', 'c', 'd'], correct: 0 }).length).toBeGreaterThan(0)
    expect(issues({ ...base, id: 'e', kind: 'truefalse', answer: true, section: 'No such heading anywhere' }).length).toBeGreaterThan(0)
  })

  it('rejects a true/false phrased as a question', () => {
    expect(issues({ ...base, id: 'f', kind: 'truefalse', answer: true, prompt: 'Is this right?' }).length).toBeGreaterThan(0)
  })
})
