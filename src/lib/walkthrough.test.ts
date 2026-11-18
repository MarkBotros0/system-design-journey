import { describe, expect, it } from 'vitest'
import type { Block } from '../content/types'
import { problems } from '../content'
import { walkthroughSteps } from './walkthrough'

describe('walkthroughSteps', () => {
  it('splits at headings, with lead-in content as an Overview step', () => {
    const blocks: Block[] = [
      { kind: 'prose', text: 'intro' },
      { kind: 'heading', text: '**Requirements**' },
      { kind: 'prose', text: 'a' },
      { kind: 'heading', text: 'Core entities' },
      { kind: 'prose', text: 'b' },
      { kind: 'prose', text: 'c' },
    ]
    const steps = walkthroughSteps(blocks)
    expect(steps.map((s) => s.title)).toEqual(['Overview', 'Requirements', 'Core entities'])
    expect(steps[2].blocks).toHaveLength(2)
    expect(steps[1].blocks[0]).toEqual({ kind: 'prose', text: 'a' })
  })

  it('has no Overview when the answer opens with a heading', () => {
    const steps = walkthroughSteps([
      { kind: 'heading', text: 'Requirements' },
      { kind: 'prose', text: 'a' },
    ])
    expect(steps.map((s) => s.title)).toEqual(['Requirements'])
  })

  it('gives every real problem at least five steps, none empty', () => {
    for (const p of problems) {
      const steps = walkthroughSteps(p.modelAnswer)
      expect(steps.length, p.id).toBeGreaterThanOrEqual(5)
      for (const s of steps) expect(s.blocks.length, `${p.id} › ${s.title}`).toBeGreaterThan(0)
    }
  })
})
