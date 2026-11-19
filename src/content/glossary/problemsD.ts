import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the problemsD content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: 'LWW',
    full: 'Last Write Wins',
    gist: 'A conflict rule: when replicas hold different versions of a value, keep the one with the highest timestamp. Simple and merge-free, but a concurrent write is silently thrown away, and a fast clock can make an older write win.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Replica A', sub: 'cart = [book] · t=105', to: 'compare' },
        { label: 'Replica B', sub: 'cart = [pen] · t=103', tone: 'alert', to: 'higher t wins' },
        { label: 'cart = [book]', sub: 'the pen is gone, no error', tone: 'streak' },
      ],
    },
    caption: 'Two replicas disagree; the higher timestamp survives and the other write is discarded for good.',
    seeAlso: ['CRDT'],
  },
  {
    id: 'UTC',
    full: 'Coordinated Universal Time',
    gist: "The world's reference clock: no time zones and no daylight saving, so it never skips or repeats an hour. Store and compare times in it, and convert to local time only to show a person or to interpret a schedule written in local terms.",
    figure: {
      kind: 'timeline',
      ticks: ['00:00 UTC', '01:00 UTC', '02:00 UTC'],
      lanes: [
        {
          label: 'UTC',
          bars: [{ from: 0, to: 1, label: 'one hour after another', tone: 'mastered' }],
        },
        {
          label: 'London, the night the clocks go back',
          bars: [
            { from: 0, to: 0.5, label: '01:00–02:00 summer', tone: 'streak' },
            { from: 0.5, to: 1, label: '01:00–02:00 again', tone: 'streak' },
          ],
          outcome: { label: '01:30 happens twice', tone: 'alert' },
        },
      ],
      note: 'In spring the same clock skips an hour instead. A scheduler that works in local time runs some jobs twice and others never.',
    },
    caption: 'Local time repeats and skips hours; UTC does neither.',
  },
  {
    id: 'VM',
    full: 'Virtual Machine',
    gist: "A whole computer provided by a hypervisor, with its own kernel; hardware support lets the guest's code run directly on the processor. It is a far harder boundary than a container, which shares the host's kernel, so untrusted code belongs in one; Firecracker's minimal VMs boot in about 125 ms, cheap enough for one per run.",
    figure: {
      kind: 'split',
      left: {
        title: 'Container',
        tone: 'streak',
        nodes: [
          { label: 'Untrusted code', to: 'system calls' },
          { label: 'Host kernel', sub: 'shared by every container', tone: 'alert' },
        ],
        cost: 'One kernel bug, and the code is out.',
      },
      right: {
        title: 'Virtual machine',
        tone: 'mastered',
        nodes: [
          { label: 'Untrusted code', to: 'system calls' },
          { label: 'Guest kernel', sub: 'its own', tone: 'line', to: 'hypervisor' },
          { label: 'Host', tone: 'mastered' },
        ],
        cost: 'An escape lands in a guest kernel that guards nothing else.',
      },
      verdict: 'Same code, same limits. The difference is whose kernel it is talking to.',
    },
    caption: 'Where untrusted code meets a kernel, in a container and in a virtual machine.',
    seeAlso: ['CPU', 'AWS'],
  },
]
