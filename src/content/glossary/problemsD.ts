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
    id: 'LSM',
    full: 'Log-Structured Merge tree',
    gist: 'A storage engine that turns every write into a sequential append: writes go to a sorted in-memory table, which is flushed to immutable sorted files that are merged in the background. Very fast writes; reads may check several files, and the merging costs disk bandwidth.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'Memtable', sub: 'in memory · newest', tone: 'line' },
        { label: 'Level 0 files', sub: 'fresh flushes' },
        { label: 'Levels 1 to n', sub: 'merged · oldest' },
      ],
      note: 'A read goes top down and stops at the first match. A Bloom filter per file lets it skip files that cannot hold the key.',
    },
    caption: 'Newest data on top, older merged data below. Nothing is ever updated in place.',
    seeAlso: ['WAL', 'SSD'],
  },
  {
    id: 'WAL',
    full: 'Write-Ahead Log',
    gist: 'An append-only file that every change is written to before it is applied anywhere else. After a crash the engine replays it, so an acknowledged write survives — and appending is the cheapest thing a disk can do.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Write arrives', to: 'append, fsync' },
        { label: 'Log on disk', sub: 'sequential, durable', tone: 'line', to: 'then' },
        { label: 'Apply in memory', sub: 'lost in a crash', tone: 'streak', to: 'on restart' },
        { label: 'Replay the log', sub: 'nothing acknowledged is lost', tone: 'mastered' },
      ],
    },
    caption: 'Durable first, applied second. A crash in between is undone by replaying the log.',
    seeAlso: ['LSM', 'ACID'],
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
    gist: "A computer virtualised by a hypervisor, with its own kernel: the processor's hardware support runs the guest's instructions directly, and only devices are emulated. A far harder boundary than a container, which shares the host's kernel — which is why untrusted code belongs in one. Firecracker's minimal VMs boot in about 125 ms, so one per run is affordable.",
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
        cost: 'An escape lands in a kernel that guards nothing.',
      },
      verdict: 'Same code, same limits. The difference is whose kernel it is talking to.',
    },
    caption: 'Where untrusted code meets a kernel, in a container and in a virtual machine.',
    seeAlso: ['CPU', 'AWS'],
  },
]
