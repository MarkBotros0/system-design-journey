import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the distributed content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: '2PC',
    full: 'Two-Phase Commit',
    gist: 'A protocol that makes several databases commit one transaction together or not at all: every participant votes in a prepare phase, then the coordinator announces the decision. Correct, but a participant that has voted yes is stuck holding its locks if the coordinator dies before announcing.',
    figure: {
      kind: 'sequence',
      actors: ['Coordinator', 'Database A', 'Database B'],
      steps: [
        { from: 0, to: 1, label: 'prepare' },
        { from: 0, to: 2, label: 'prepare' },
        { from: 1, to: 0, label: 'yes', dashed: true },
        { from: 2, to: 0, label: 'yes', dashed: true },
        { from: 0, to: 0, label: 'decision logged' },
        { from: 0, to: 1, label: 'commit', tone: 'mastered' },
        { from: 0, to: 2, label: 'commit', tone: 'mastered' },
      ],
    },
    caption: 'Phase one collects votes, phase two announces the decision. The gap between them is where it blocks.',
    seeAlso: ['XA', 'ACID'],
  },
  {
    id: 'XA',
    full: 'eXtended Architecture (the X/Open distributed transaction standard)',
    gist: 'The standard interface that lets one transaction manager run two-phase commit across different systems, such as a database and a message broker in one Java transaction. It inherits two-phase commit\'s blocking, and Kafka, DynamoDB and most cloud services do not implement it, which is why you rarely see it between services.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Transaction manager', sub: 'the coordinator', tone: 'line', to: 'prepare, commit' },
        { label: 'Database', sub: 'speaks XA', tone: 'mastered', to: 'and' },
        { label: 'Message broker', sub: 'must speak XA too', tone: 'streak' },
      ],
      note: 'Every resource in the transaction has to implement the interface. One that does not cannot take part.',
    },
    caption: 'XA is two-phase commit behind a standard interface, so one coordinator can drive different kinds of resource.',
    seeAlso: ['2PC'],
  },
  {
    id: 'NTP',
    full: 'Network Time Protocol',
    gist: 'How servers keep their clocks near the right time: they ask time servers and correct for the network delay. Near is the word. It is accurate to well under a millisecond inside a datacentre and to tens of milliseconds over the internet, and a large correction can step a clock backwards.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Reference clocks', sub: 'atomic, satellite', to: 'feed' },
        { label: 'Time servers', sub: 'one hop down', to: 'polled by' },
        { label: 'Your server', sub: 'corrects its drift', tone: 'line' },
      ],
      note: 'Every network hop adds delay the protocol can estimate but never remove, so the error is bounded, not zero.',
    },
    caption: 'Time flows down from reference clocks, and each hop adds a little uncertainty.',
    seeAlso: ['HLC'],
  },
  {
    id: 'HLC',
    full: 'Hybrid Logical Clock',
    gist: 'A timestamp made of a physical time plus a small counter. Like a logical clock it orders an effect after its cause even when clocks disagree, and it stays close to real time, so a database can order writes across nodes and still answer "as of 10:00". CockroachDB and MongoDB use one.',
    figure: {
      kind: 'sequence',
      actors: ['Node A', 'Node B'],
      steps: [
        { from: 0, to: 0, label: 'write, stamped (10:00.005, 0)' },
        { from: 0, to: 1, label: 'message carries (10:00.005, 0)' },
        { from: 1, to: 1, label: 'own clock reads 10:00.003: behind', tone: 'streak' },
        { from: 1, to: 1, label: 'stamps (10:00.005, 1)', tone: 'mastered' },
      ],
    },
    caption: 'B\'s clock is behind A\'s, so B keeps A\'s physical time and bumps the counter. The effect still sorts after its cause.',
    seeAlso: ['NTP'],
  },
]
