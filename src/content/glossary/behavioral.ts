import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the behavioral content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: 'STAR',
    full: 'Situation, Task, Action, Result',
    gist: 'The four-beat shape for a behavioural answer. It guards against the two ways a story fails: drowning the listener in background, and never saying what you personally did.',
    figure: {
      kind: 'ratio',
      parts: [
        { label: 'Situation and task', value: 25, tone: 'neutral' },
        { label: 'Action', value: 55, tone: 'line' },
        { label: 'Result and reflection', value: 20, tone: 'mastered' },
      ],
      note: 'A budget, not a law. In a two-to-three-minute answer, most of the time belongs to what you did.',
    },
    caption: 'Roughly where the time in a well-told answer goes.',
  },
]
