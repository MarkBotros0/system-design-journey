/**
 * The delivery framework — the 45-minute loop.
 *
 * One definition, used in three places: the "Delivery framework" lesson, the problem
 * runner's phase timer, and the rubric grouping. Changing a minute budget here changes
 * it everywhere, which is the point.
 */

import type { ProblemKind } from './types'

export interface Phase {
  id: string
  name: string
  minutes: number
  /** Shown in the runner while this phase is live — what to actually produce. */
  prompt: string
  /** Data flow is skipped for anything that isn't pipeline-shaped. */
  optional?: boolean
  /** The interviewer's follow-up questions surface during this phase. */
  followups?: boolean
}

export const PHASES: Phase[] = [
  {
    id: 'requirements',
    name: 'Requirements',
    minutes: 5,
    prompt:
      'Top three functional requirements ("users should be able to…"), then three to five non-functional ones, each quantified. Only do the maths if it picks between two designs.',
  },
  {
    id: 'entities',
    name: 'Core entities',
    minutes: 2,
    prompt:
      'Three to five nouns. A vocabulary, not a schema — you will discover more as you go, and that is expected.',
  },
  {
    id: 'api',
    name: 'API',
    minutes: 5,
    prompt:
      'One endpoint per functional requirement. REST unless you have a reason. The current user comes off the auth token, never the request body.',
  },
  {
    id: 'dataflow',
    name: 'Data flow',
    minutes: 5,
    optional: true,
    prompt:
      'Only for pipeline-shaped systems — a crawler, an aggregator, a metrics platform. Five numbered steps. Otherwise skip and bank the time.',
  },
  {
    id: 'highlevel',
    name: 'High-level design',
    minutes: 15,
    prompt:
      'Boxes and arrows that satisfy your API, endpoint by endpoint. Say each bottleneck out loud and note it — that note is your deep-dive agenda. Do not layer complexity in yet.',
  },
  {
    id: 'deepdives',
    name: 'Deep dives',
    minutes: 10,
    followups: true,
    prompt:
      'Two or three of your notes, worked properly: name the bottleneck, the obvious fix, the better fix, then pick one and say why. Leave silence for their questions.',
  },
]

/**
 * The low-level design round. Same 45 minutes, different shape: the work is classes and
 * methods rather than boxes and arrows, and the last stretch is the interviewer probing
 * extensibility and concurrency.
 */
export const LLD_PHASES: Phase[] = [
  {
    id: 'clarify',
    name: 'Clarify requirements',
    minutes: 5,
    prompt:
      'What must it do, for whom, and what is explicitly out of scope? Agree the three or four use cases you will actually model.',
  },
  {
    id: 'objects',
    name: 'Core objects',
    minutes: 5,
    prompt: 'The nouns. Which are entities with identity, which are value objects, which are just enums?',
  },
  {
    id: 'classes',
    name: 'Classes and relationships',
    minutes: 15,
    prompt:
      'Classes, interfaces, and who owns whom — composition, aggregation, inheritance only where substitution genuinely holds. Sketch it.',
  },
  {
    id: 'methods',
    name: 'Key methods',
    minutes: 8,
    prompt: 'Signatures for the main use cases, and the one or two method bodies where the real logic lives.',
  },
  {
    id: 'patterns',
    name: 'Patterns and extensibility',
    minutes: 7,
    prompt: 'Where will this change next? Name the pattern that absorbs that change and why it beats the obvious switch.',
  },
  {
    id: 'concurrency',
    name: 'Concurrency and edge cases',
    minutes: 5,
    followups: true,
    prompt: 'Two callers at once — what races? Then the edge cases: empty, full, invalid, failure halfway through.',
  },
]

export const PHASES_BY_KIND: Record<ProblemKind, Phase[]> = { hld: PHASES, lld: LLD_PHASES }

export function phasesFor(kind: ProblemKind): Phase[] {
  return PHASES_BY_KIND[kind]
}

export function budgetedMinutes(kind: ProblemKind): number {
  return phasesFor(kind).reduce((n, p) => n + p.minutes, 0)
}

/** 42 minutes of budget inside a 45-minute slot. The remainder is slack, on purpose. */
export const TOTAL_MINUTES = 45
export const BUDGETED_MINUTES = PHASES.reduce((n, p) => n + p.minutes, 0)

export function phaseById(id: string): Phase | undefined {
  return [...PHASES, ...LLD_PHASES].find((p) => p.id === id)
}
