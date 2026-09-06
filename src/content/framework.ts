/**
 * The delivery framework — the 45-minute loop.
 *
 * One definition, used in three places: the "Delivery framework" lesson, the problem
 * runner's phase timer, and the rubric grouping. Changing a minute budget here changes
 * it everywhere, which is the point.
 */

export interface Phase {
  id: string
  name: string
  minutes: number
  /** Shown in the runner while this phase is live — what to actually produce. */
  prompt: string
  /** Data flow is skipped for anything that isn't pipeline-shaped. */
  optional?: boolean
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
    prompt:
      'Two or three of your notes, worked properly: name the bottleneck, the obvious fix, the better fix, then pick one and say why. Leave silence for their questions.',
  },
]

/** 42 minutes of budget inside a 45-minute slot. The remainder is slack, on purpose. */
export const TOTAL_MINUTES = 45
export const BUDGETED_MINUTES = PHASES.reduce((n, p) => n + p.minutes, 0)

export function phaseById(id: string): Phase | undefined {
  return PHASES.find((p) => p.id === id)
}
