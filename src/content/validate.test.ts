import { describe, expect, it } from 'vitest'
import type { Block, Module, Problem } from './types'
import { validateContent, validateProblemShape } from './validate'

/* A unit whose only unexplained acronym is QQX, placed wherever the test puts it. The
   validator must see into every new block and figure kind, or the abbreviation rule has
   a hole in it. */
const FIG: Block = { kind: 'figure', caption: 'c', figure: { kind: 'cycle', steps: [{ label: 'a' }] } }

function unit(lesson: Block[]): Module {
  return {
    id: 't',
    trackId: 'core',
    title: 'T',
    station: 1,
    prereqs: [],
    minutes: 1,
    summary: 's',
    lesson: [FIG, ...lesson],
    quiz: [],
    cards: [],
  }
}

const flagsQQX = (lesson: Block[]) =>
  validateContent([unit(lesson)], []).some((i) => i.message.includes('"QQX"'))

describe('validator sees into new block kinds', () => {
  it('blockTexts covers codeCompare titles and note but not code', () => {
    const cc = (over: Partial<Extract<Block, { kind: 'codeCompare' }>>): Block => ({
      kind: 'codeCompare',
      before: { title: 'a', code: 'x' },
      after: { title: 'b', code: 'y' },
      ...over,
    })
    expect(flagsQQX([cc({ before: { title: 'QQX', code: 'x' } })])).toBe(true)
    expect(flagsQQX([cc({ after: { title: 'QQX', code: 'y' } })])).toBe(true)
    expect(flagsQQX([cc({ note: 'QQX' })])).toBe(true)
    expect(flagsQQX([cc({ before: { title: 'a', code: 'const QQX = 1' } })])).toBe(false)
  })

  it('blockTexts covers followups q and a', () => {
    expect(flagsQQX([{ kind: 'followups', items: [{ q: 'QQX?', a: 'no' }] }])).toBe(true)
    expect(flagsQQX([{ kind: 'followups', items: [{ q: 'why?', a: 'QQX' }] }])).toBe(true)
  })

  it('callout tone example is scanned like any callout', () => {
    expect(flagsQQX([{ kind: 'callout', tone: 'example', text: 'QQX in prod' }])).toBe(true)
  })
})

describe('validator sees into new figure kinds', () => {
  const fig = (figure: Extract<Block, { kind: 'figure' }>['figure']): Block[] => [
    { kind: 'figure', caption: 'c', figure },
  ]

  it('sequence actors, labels and note', () => {
    expect(flagsQQX(fig({ kind: 'sequence', actors: ['QQX', 'b'], steps: [] }))).toBe(true)
    expect(
      flagsQQX(fig({ kind: 'sequence', actors: ['a', 'b'], steps: [{ from: 0, to: 1, label: 'QQX' }] })),
    ).toBe(true)
    expect(flagsQQX(fig({ kind: 'sequence', actors: ['a'], steps: [], note: 'QQX' }))).toBe(true)
  })

  it('classes names, fields, methods and relation labels', () => {
    const c = (over: object) => ({ name: 'A', ...over })
    expect(flagsQQX(fig({ kind: 'classes', classes: [c({ name: 'QQX' })], relations: [] }))).toBe(true)
    expect(flagsQQX(fig({ kind: 'classes', classes: [c({ fields: ['QQX'] })], relations: [] }))).toBe(true)
    expect(flagsQQX(fig({ kind: 'classes', classes: [c({ methods: ['QQX()'] })], relations: [] }))).toBe(
      true,
    )
    expect(
      flagsQQX(
        fig({
          kind: 'classes',
          classes: [c({}), c({ name: 'B' })],
          relations: [{ from: 'A', to: 'B', kind: 'uses', label: 'QQX' }],
        }),
      ),
    ).toBe(true)
  })

  it('decision questions, answers and subs', () => {
    const leaf = (answer: string, sub?: string) => ({ answer, sub })
    expect(flagsQQX(fig({ kind: 'decision', root: { question: 'QQX?', yes: leaf('a'), no: leaf('b') } }))).toBe(
      true,
    )
    expect(flagsQQX(fig({ kind: 'decision', root: { question: 'q', yes: leaf('QQX'), no: leaf('b') } }))).toBe(
      true,
    )
    expect(
      flagsQQX(fig({ kind: 'decision', root: { question: 'q', yes: leaf('a'), no: leaf('b', 'QQX') } })),
    ).toBe(true)
  })
})

/* ------------------------------------------------------------------ */

function problem(over: Partial<Problem>): Problem {
  return {
    id: 'p',
    title: 'P',
    kind: 'hld',
    category: 'infra',
    difficulty: 'easy',
    brief: 'b',
    patterns: [],
    suggests: [],
    rubric: [],
    followups: [
      { q: '1', a: '1' },
      { q: '2', a: '2' },
      { q: '3', a: '3' },
    ],
    modelAnswer: [],
    ...over,
  }
}

const h = (text: string): Block => ({ kind: 'heading', text })
const HLD = ['Requirements', 'Core entities', 'API', 'High-level design', 'Deep dive 1 — x'].map(h)
const LLD = [
  'Requirements',
  'Core objects',
  'Classes and relationships',
  'Key methods',
  'Patterns and extensibility',
  'Concurrency and edge cases',
].map(h)

describe('problem shape', () => {
  it('hld skeleton: complete skeleton passes', () => {
    expect(validateProblemShape(problem({ modelAnswer: HLD }))).toEqual([])
  })

  it('hld skeleton: missing API heading is reported', () => {
    const issues = validateProblemShape(problem({ modelAnswer: HLD.filter((b) => b !== HLD[2]) }))
    expect(issues.join('\n')).toMatch(/API/)
  })

  it('hld skeleton: headings out of order are reported', () => {
    const issues = validateProblemShape(problem({ modelAnswer: [HLD[1], HLD[0], ...HLD.slice(2)] }))
    expect(issues.length).toBeGreaterThan(0)
  })

  it('lld skeleton: complete skeleton passes', () => {
    expect(validateProblemShape(problem({ kind: 'lld', category: 'lld-systems', modelAnswer: LLD }))).toEqual(
      [],
    )
  })

  it('followups: fewer than 3 reported', () => {
    const issues = validateProblemShape(problem({ modelAnswer: HLD, followups: [{ q: 'a', a: 'b' }] }))
    expect(issues.join('\n')).toMatch(/follow-up/)
  })

  it('category kind must match problem kind', () => {
    const issues = validateProblemShape(problem({ modelAnswer: HLD, category: 'lld-systems' }))
    expect(issues.join('\n')).toMatch(/category/)
  })

  it('decision deeper than 3 is reported', () => {
    const leaf = { answer: 'x' }
    const d4 = {
      question: '1',
      yes: { question: '2', yes: { question: '3', yes: { question: '4', yes: leaf, no: leaf }, no: leaf }, no: leaf },
      no: leaf,
    }
    const issues = validateContent(
      [unit([{ kind: 'figure', caption: 'c', figure: { kind: 'decision', root: d4 } }])],
      [],
    )
    expect(issues.map((i) => i.message).join('\n')).toMatch(/deeper than 3/)
  })
})
