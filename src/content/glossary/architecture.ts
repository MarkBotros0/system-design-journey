import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the architecture content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: 'CQRS',
    full: 'Command Query Responsibility Segregation',
    gist: 'Separate models for changing data and for reading it. The write model enforces the rules; read models are projections shaped for each query. It pays off when reads and writes want very different shapes, and it costs you reads that lag behind writes.',
    figure: {
      kind: 'split',
      left: {
        title: 'One model',
        nodes: [
          { label: 'Commands and queries', to: 'same schema' },
          { label: 'One model', sub: 'a compromise for both', tone: 'streak' },
        ],
        cost: 'Simple and immediately consistent. Right for most services.',
      },
      right: {
        title: 'CQRS',
        nodes: [
          { label: 'Commands', to: 'validate' },
          { label: 'Write model', sub: 'enforces the rules', tone: 'line', to: 'project' },
          { label: 'Read models', sub: 'one per query shape', tone: 'mastered' },
        ],
        cost: 'Each side shaped for its job. Reads are eventually consistent.',
      },
    },
    caption: 'One model for everything, against a write model that feeds read models.',
    seeAlso: ['CRUD', 'CDC'],
  },
  {
    id: 'DDD',
    full: 'Domain-Driven Design',
    gist: 'Modelling software around the business domain, in the words the business uses. Its most useful idea for architecture is the bounded context: a region inside which every term has one meaning, and the natural seam for a module or a service.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'Sales context', sub: 'customer = a lead', tone: 'line' },
        { label: 'Billing context', sub: 'customer = who pays', tone: 'line' },
        { label: 'Support context', sub: 'customer = open tickets', tone: 'line' },
      ],
      note: 'One word, three models. Each context owns its own and translates at the boundary, instead of sharing one bloated Customer class.',
    },
    caption: 'Bounded contexts: the same word means something different in each part of the business.',
    seeAlso: ['CQRS'],
  },
  {
    id: 'BFF',
    full: 'Backend For Frontend',
    gist: 'A thin server per client experience, such as the iOS app or the web app, that calls the underlying services and shapes one response per screen. The team that owns the client owns its BFF, so it can change its payload without waiting on anyone.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'iOS app', to: 'one request' },
        { label: 'iOS BFF', sub: 'owned by the iOS team', tone: 'line', to: 'fans out' },
        { label: 'Orders, profile, offers', sub: 'general services' },
      ],
      note: 'The phone makes one round trip. The BFF makes the many calls on a fast internal network.',
    },
    caption: 'The client makes one call; its BFF gathers and shapes the rest.',
    seeAlso: ['API'],
  },
  {
    id: 'RPC',
    full: 'Remote Procedure Call',
    gist: 'Calling a function in another process as if it were local. A stub serialises the arguments, sends them over the network and waits for the result. It looks like a function call and is not one: it can be slow, time out, or fail halfway.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'getUser(42)', sub: 'looks local', to: 'serialise' },
        { label: 'Client stub', to: 'network' },
        { label: 'Server stub', to: 'deserialise' },
        { label: 'Real function', sub: 'another process', tone: 'line' },
      ],
      note: 'Every arrow can be slow or fail. That is the difference from a function call, and the reason splitting a monolith is not free.',
    },
    caption: 'A local-looking call, carried over the network by a stub on each side.',
    seeAlso: ['gRPC', 'REST'],
  },
  {
    id: 'CRUD',
    full: 'Create, Read, Update, Delete',
    gist: 'The four basic operations on stored records, and shorthand for a service that is mostly forms over a table. Most services are CRUD, which is a good reason not to give them CQRS or event sourcing.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'Create', sub: 'POST /orders', tone: 'line' },
        { label: 'Read', sub: 'GET /orders/42' },
        { label: 'Update', sub: 'PUT /orders/42' },
        { label: 'Delete', sub: 'DELETE /orders/42' },
      ],
      note: 'Four operations, one model, one table. The boring default, and usually the right one.',
    },
    caption: 'The four operations, and the HTTP methods that usually carry them.',
    seeAlso: ['REST', 'CQRS'],
  },
  {
    id: 'RFC',
    full: 'Request for Comments',
    gist: 'The numbered documents that define internet standards. Citing one, such as "problem details, RFC 9457", tells an interviewer you are following a standard rather than inventing a format.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'RFC 9110', sub: 'HTTP methods, status codes' },
        { label: 'RFC 9457', sub: 'problem details: error bodies', tone: 'line' },
        { label: 'RFC 6585', sub: 'adds 429 Too Many Requests' },
        { label: 'RFC 8594', sub: 'the Sunset header' },
      ],
      note: 'The handful an API design conversation actually cites.',
    },
    caption: 'Standards you can name instead of inventing your own conventions.',
    seeAlso: ['HTTP', 'API'],
  },
]
