import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the designPatterns2 content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: 'DOM',
    full: 'Document Object Model',
    gist: 'The browser\'s tree of objects for a page. Every element and every run of text is a node, and an element holds child nodes, which makes it the textbook composite. `addEventListener` on those nodes is the textbook observer.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'document', sub: 'the root node', tone: 'line', to: 'contains' },
        { label: '<body>', sub: 'an element', to: 'contains' },
        { label: '<ul>', sub: 'an element', to: 'contains' },
        { label: '<li>', sub: 'holds a text node' },
      ],
      note: 'Every box answers the same calls (appendChild, textContent) whether it holds one node or ten thousand.',
    },
    caption: 'One path down the DOM: each box is a node, and any node can contain more nodes.',
  },
]
