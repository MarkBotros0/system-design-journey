import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the problemsA content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: 'EXIF',
    full: 'Exchangeable Image File Format',
    gist: 'The metadata a camera writes into a photo: device, exposure, timestamp, and often the exact place it was taken. Social photo services strip it on upload, because a location tag on a picture taken at home publishes a home address.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'Pixels', sub: 'the photo itself — kept', tone: 'mastered' },
        { label: 'Camera and exposure', sub: 'model, lens, shutter — dropped', tone: 'neutral' },
        { label: 'Timestamp', sub: 'when it was taken — dropped', tone: 'neutral' },
        { label: 'Location', sub: 'latitude and longitude — always stripped', tone: 'alert' },
      ],
      note: 'Processing workers re-encode the image and write none of the metadata back.',
    },
    caption: 'One photo file: the pixels everyone sees, and the metadata nobody should.',
    seeAlso: ['S3', 'CDN'],
  },
  {
    id: 'TAO',
    full: 'The Associations and Objects',
    gist: 'Facebook\'s graph store: a large caching layer of objects (users, posts) and typed association lists (follows, likes) in front of sharded MySQL. It shows a social graph at enormous scale can be served as one-hop lists, without a graph database.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'App servers', sub: 'who does Alice follow?', to: 'one hop' },
        { label: 'TAO cache', sub: 'objects · association lists', tone: 'line', to: 'on a miss' },
        { label: 'MySQL shards', sub: 'source of truth' },
      ],
      note: 'Every query is a list keyed by the node it hangs off. Nothing traverses the graph.',
    },
    caption: 'Graph reads served from a cache of adjacency lists, backed by a sharded relational store.',
    seeAlso: ['SQL', 'NoSQL'],
  },
]
