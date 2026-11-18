import type { Block } from '../content/types'
import { plainText } from './text'

export interface WalkthroughStep {
  title: string
  /** The step's content, without its heading — the step title stands in for it. */
  blocks: Block[]
}

/**
 * A model answer cut into the phases of the interview, one step per heading. Anything
 * before the first heading is framing and becomes an Overview step. Headings follow the
 * skeleton the validator enforces, so the steps line up with the runner's phases.
 */
export function walkthroughSteps(blocks: Block[]): WalkthroughStep[] {
  const steps: WalkthroughStep[] = []
  let current: WalkthroughStep | undefined
  for (const b of blocks) {
    if (b.kind === 'heading') {
      current = { title: plainText(b.text), blocks: [] }
      steps.push(current)
    } else {
      if (!current) {
        current = { title: 'Overview', blocks: [] }
        steps.push(current)
      }
      current.blocks.push(b)
    }
  }
  return steps.filter((s) => s.blocks.length > 0)
}
