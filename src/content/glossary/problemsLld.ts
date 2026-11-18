import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the problemsLld content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: 'CAS',
    full: 'Compare-And-Swap',
    gist: 'An atomic write that only happens if the value is still the one you read, and reports whether it did. Lock-free counters, Java\'s `AtomicLong` and every optimistic retry loop are built on it.',
    figure: {
      kind: 'sequence',
      actors: ['Thread A', 'Counter', 'Thread B'],
      steps: [
        { from: 0, to: 1, label: 'read 7' },
        { from: 2, to: 1, label: 'read 7' },
        { from: 0, to: 1, label: 'swap 7 → 8: ok', tone: 'mastered' },
        { from: 2, to: 1, label: 'swap 7 → 8: fails', tone: 'alert' },
        { from: 2, to: 1, label: 'read 8, swap 8 → 9: ok', tone: 'mastered' },
      ],
    },
    caption: 'Both threads read 7. Only one swap from 7 can succeed; the loser rereads and retries.',
    seeAlso: ['OCC'],
  },
  {
    id: 'ISBN',
    full: 'International Standard Book Number',
    gist: 'The 13-digit number given to each edition and format of a book, so the hardback and the paperback get different ones. It names a published product, never a physical copy, which is why a library also puts a barcode on every item.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'ISBN', sub: 'one per edition and format', tone: 'line', to: 'identifies' },
        { label: 'Book', sub: 'title, authors, edition', to: 'has many' },
        { label: 'Copies', sub: 'a barcode each' },
      ],
    },
    caption: 'An ISBN names an edition in one format. The library\'s barcode names the copy on the shelf.',
  },
]
