import type { Figure } from './figures'

/**
 * Every abbreviation used anywhere in the curriculum, expanded, explained in one line,
 * and illustrated.
 *
 * House rule, enforced by `validateContent`: an abbreviation may not appear in a module
 * or problem unless it is wrapped in `[[…]]` at least once in that same module, and has
 * an entry here. A reader must never meet a set of capital letters with no way to find
 * out what they stand for without leaving the page.
 */

export interface GlossaryEntry {
  id: string
  full: string
  /** One or two sentences. What it is and why it matters — not a dictionary definition. */
  gist: string
  figure: Figure
  /** States what the figure shows. */
  caption: string
  seeAlso?: string[]
}

export const glossary: GlossaryEntry[] = [
  /* ---------------- protocols and the network ---------------- */
  {
    id: 'API',
    full: 'Application Programming Interface',
    gist: 'The set of operations one program offers another. In design terms it is the contract your architecture has to satisfy — which is why you write it before you draw any boxes.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Client', sub: 'app or browser', to: 'POST /tweets' },
        { label: 'API', sub: 'the contract', tone: 'line', to: 'writes' },
        { label: 'Service', sub: 'does the work' },
      ],
    },
    caption: 'The API is the agreed surface between two programs. Neither side knows how the other works inside.',
    seeAlso: ['REST', 'HTTP'],
  },
  {
    id: 'REST',
    full: 'Representational State Transfer',
    gist: 'The default way to shape a web API: things become addressable resources, and the HTTP verb says what you are doing to them. Right about ninety percent of the time.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'GET /tweets/42', sub: 'read one', tone: 'neutral' },
        { label: 'POST /tweets', sub: 'create', tone: 'line' },
        { label: 'PUT /tweets/42', sub: 'replace', tone: 'neutral' },
        { label: 'DELETE /tweets/42', sub: 'remove', tone: 'neutral' },
      ],
      note: 'One noun, four verbs. The URL names the thing; the method names the action.',
    },
    caption: 'Resources as addresses, HTTP methods as the operations on them.',
    seeAlso: ['HTTP', 'API'],
  },
  {
    id: 'HTTP',
    full: 'HyperText Transfer Protocol',
    gist: 'The request-and-response protocol the web runs on. The client asks, the server answers, and the exchange is over — which is exactly why pushing data to a client needs something extra.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Client', to: 'request' },
        { label: 'Server', tone: 'line', to: 'response' },
        { label: 'Client', sub: 'connection closes' },
      ],
      note: 'One round trip. The server cannot speak first — that limitation is what SSE and WebSocket exist to solve.',
    },
    caption: 'A single request-response exchange, initiated by the client every time.',
    seeAlso: ['SSE', 'TCP'],
  },
  {
    id: 'TCP',
    full: 'Transmission Control Protocol',
    gist: 'The transport underneath HTTP. It guarantees your bytes arrive, in order, retransmitting what gets lost — at the cost of a handshake before anything useful moves.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'SYN', sub: 'can we talk?', to: '' },
        { label: 'SYN-ACK', sub: 'yes, can you?', tone: 'line', to: '' },
        { label: 'ACK', sub: 'yes — now data', to: '' },
        { label: 'Data', sub: 'ordered, retried', tone: 'mastered' },
      ],
    },
    caption: 'Three messages before a single byte of payload. It is why connection reuse matters.',
    seeAlso: ['HTTP', 'IP'],
  },
  {
    id: 'IP',
    full: 'Internet Protocol',
    gist: 'The addressing scheme that gets a packet to the right machine. A rate limiter keyed "per IP" is counting requests per source address.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'example.com', sub: 'a name', to: 'DNS' },
        { label: '93.184.216.34', sub: 'an address', tone: 'line', to: 'route' },
        { label: 'That machine' },
      ],
    },
    caption: 'Names are for humans; addresses are what packets are actually delivered to.',
    seeAlso: ['DNS', 'TCP'],
  },
  {
    id: 'DNS',
    full: 'Domain Name System',
    gist: 'The lookup that turns a hostname into an address. It is the first hop of every request, and it is cached at several layers so you rarely pay for it.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Browser', sub: 'wants example.com', to: 'lookup' },
        { label: 'Resolver', sub: 'cached?', tone: 'line', to: 'address' },
        { label: 'Connect', sub: 'to 93.184.216.34', tone: 'mastered' },
      ],
    },
    caption: 'A name resolves to an address before any connection can be made.',
    seeAlso: ['IP', 'CDN'],
  },
  {
    id: 'CDN',
    full: 'Content Delivery Network',
    gist: 'Copies of your content held in datacentres around the world, so a user in Sydney is served from Sydney. The only real fix for distance, because distance is physics.',
    figure: {
      kind: 'split',
      left: {
        title: 'Without',
        tone: 'alert',
        nodes: [
          { label: 'Sydney user', to: '~250 ms' },
          { label: 'London origin', tone: 'alert' },
        ],
        cost: 'Every request crosses the planet.',
      },
      right: {
        title: 'With a CDN',
        tone: 'mastered',
        nodes: [
          { label: 'Sydney user', to: '~10 ms' },
          { label: 'Sydney edge', tone: 'mastered', to: 'on miss' },
          { label: 'London origin' },
        ],
        cost: 'Only a cache miss pays the long trip.',
      },
      verdict: 'A CDN does not make the network faster. It makes the distance shorter.',
    },
    caption: 'The same request, served from the far side of the world versus the same city.',
    seeAlso: ['DNS', 'TTL'],
  },
  {
    id: 'SSE',
    full: 'Server-Sent Events',
    gist: 'The client opens one ordinary HTTP request and the server keeps pushing messages down it. Simpler than a WebSocket, and enough for most things labelled "live".',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Client', sub: 'one request', to: 'opens' },
        { label: 'Server', sub: 'pushes, repeatedly', tone: 'line', to: 'event · event · event' },
        { label: 'Client', sub: 'listens only' },
      ],
      note: 'One direction. The client still posts through ordinary requests when it needs to send something.',
    },
    caption: 'A single long-lived response the server keeps writing to.',
    seeAlso: ['HTTP', 'WebSocket'],
  },
  {
    id: 'WebSocket',
    full: 'WebSocket',
    gist: 'A connection that stays open and lets both sides send whenever they like. Worth its costs — Layer 4 load balancing, connection state, your own reconnection logic — only when the client genuinely pushes too.',
    figure: {
      kind: 'split',
      left: {
        title: 'SSE',
        nodes: [{ label: 'Server', to: 'pushes' }, { label: 'Client' }],
        cost: 'Server speaks. Simpler.',
      },
      right: {
        title: 'WebSocket',
        tone: 'line',
        nodes: [{ label: 'Server', to: 'both ways' }, { label: 'Client', tone: 'line' }],
        cost: 'Both speak. Costs L4 balancing and connection state.',
      },
      verdict: 'Chat and collaborative editing need both directions. A live dashboard does not.',
    },
    caption: 'One direction versus two — the only question that decides between them.',
    seeAlso: ['SSE', 'L4'],
  },
  {
    id: 'gRPC',
    full: 'Google Remote Procedure Call',
    gist: 'A binary protocol over HTTP/2 for service-to-service calls. Much faster than JSON over HTTP, and not usable from a browser without a proxy.',
    figure: {
      kind: 'split',
      left: {
        title: 'Browser → your API',
        nodes: [{ label: 'Browser', to: 'JSON' }, { label: 'API', tone: 'line' }],
        cost: 'REST. Readable, universal.',
      },
      right: {
        title: 'Service → service',
        tone: 'mastered',
        nodes: [{ label: 'Service A', to: 'binary' }, { label: 'Service B', tone: 'mastered' }],
        cost: 'gRPC. Faster, not browser-native.',
      },
    },
    caption: 'gRPC belongs behind your edge, not in front of it.',
    seeAlso: ['REST', 'HTTP'],
  },
  {
    id: 'L4',
    full: 'Layer 4 load balancing',
    gist: 'Balancing at the TCP level: the balancer forwards a connection without ever reading what is inside it. Least work per byte, and the natural fit for long-lived connections like WebSockets, where there is no request left to route anyway.',
    figure: {
      kind: 'split',
      left: {
        title: 'Layer 4',
        nodes: [{ label: 'Connection', to: 'forward' }, { label: 'Any server', tone: 'line' }],
        cost: 'Cannot see the request. The natural home for persistent connections.',
      },
      right: {
        title: 'Layer 7',
        nodes: [{ label: 'HTTP request', to: '/api → B' }, { label: 'Chosen server', tone: 'mastered' }],
        cost: 'Reads path, headers, cookies. Routes on content.',
      },
    },
    caption: 'Whether the balancer can read the request is the whole difference.',
    seeAlso: ['WebSocket', 'TCP', 'OSI'],
  },
  {
    id: 'OSI',
    full: 'Open Systems Interconnection model',
    gist: 'The seven-layer picture of networking, from electrical signals at the bottom to application meaning at the top. You need two of its rungs: layer 4 is TCP, layer 7 is HTTP. Calling a load balancer "L4" or "L7" is saying how far up that stack it reads before it chooses a server.',
    figure: {
      kind: 'stack',
      layers: [
        { label: '7 — Application', sub: 'HTTP: GET /api/users', tone: 'mastered' },
        { label: '4 — Transport', sub: 'TCP: port 443', tone: 'line' },
        { label: '3 — Network', sub: 'IP: 10.0.0.4', tone: 'neutral' },
        { label: '1–2 — Link and physical', sub: 'frames, cable', tone: 'neutral' },
      ],
      note: 'Layers 5 and 6 exist on paper and almost never come up in a design discussion. The two that settle arguments are 4 and 7.',
    },
    caption: 'The rungs you actually reference, and what each one can read.',
    seeAlso: ['L4', 'L7', 'TCP'],
  },
  {
    id: 'JWT',
    full: 'JSON Web Token',
    gist: 'A signed token the client sends on every request. The server verifies the signature and trusts what is inside — which is why the acting user comes from the token and never from the request body.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'Header', sub: 'which algorithm', tone: 'neutral' },
        { label: 'Payload', sub: 'userId, expiry', tone: 'line' },
        { label: 'Signature', sub: 'proves nobody edited it', tone: 'mastered' },
      ],
      note: 'Tamper with the payload and the signature stops matching.',
    },
    caption: 'Three parts. The signature is what makes the payload trustworthy.',
    seeAlso: ['API'],
  },

  /* ---------------- data and consistency ---------------- */
  {
    id: 'SQL',
    full: 'Structured Query Language',
    gist: 'The query language of relational databases, and by extension the shorthand for relational databases themselves — structured tables, joins, and transactions.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'users', sub: 'id, name', to: 'join on id' },
        { label: 'orders', sub: 'userId, total', tone: 'line', to: 'result' },
        { label: 'One row', sub: 'name + total', tone: 'mastered' },
      ],
      note: 'A join assembles data that is stored once, in the place it belongs.',
    },
    caption: 'Relational storage keeps each fact in one table and combines on read.',
    seeAlso: ['NoSQL', 'ACID'],
  },
  {
    id: 'NoSQL',
    full: 'Not Only SQL',
    gist: 'Databases that trade joins and flexible querying for predictable performance at scale. You design the keys around the queries you intend to run — and get nothing for a query you did not plan.',
    figure: {
      kind: 'split',
      left: {
        title: 'Relational',
        nodes: [{ label: 'Any query', to: 'planner' }, { label: 'Result', tone: 'line' }],
        cost: 'Flexible. The planner works it out.',
      },
      right: {
        title: 'Key-value',
        nodes: [{ label: 'Planned query', to: 'direct' }, { label: 'Result', tone: 'mastered' }],
        cost: 'Fast at any size — for the access patterns you designed.',
      },
      verdict: 'Never say "NoSQL because scale". Name the property you actually need.',
    },
    caption: 'The trade is query flexibility for predictable performance.',
    seeAlso: ['SQL', 'PK'],
  },
  {
    id: 'ACID',
    full: 'Atomicity, Consistency, Isolation, Durability',
    gist: 'The four guarantees a transaction gives you. Isolation is the one that carries weight in system design — it is what stops two people buying the same seat.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'Atomic', sub: 'all of it, or none', tone: 'neutral' },
        { label: 'Consistent', sub: 'constraints always hold', tone: 'neutral' },
        { label: 'Isolated', sub: 'concurrent writes do not see each other half-done', tone: 'line' },
        { label: 'Durable', sub: 'survives a crash once committed', tone: 'neutral' },
      ],
    },
    caption: 'Four guarantees. Isolation is the one contention problems depend on.',
    seeAlso: ['OCC', 'SQL'],
  },
  {
    id: 'CAP',
    full: 'Consistency, Availability, Partition tolerance',
    gist: 'When the network splits, you can keep answering with possibly-stale data, or refuse to answer rather than be wrong. You cannot do both. Partitions are not optional, so the real choice is only ever the first two.',
    figure: {
      kind: 'split',
      left: {
        title: 'Choose consistency',
        tone: 'line',
        nodes: [{ label: 'Read', to: 'unsure?' }, { label: 'Refuse', tone: 'alert' }],
        cost: 'Never wrong. Sometimes unavailable.',
      },
      right: {
        title: 'Choose availability',
        tone: 'mastered',
        nodes: [{ label: 'Read', to: 'answer' }, { label: 'Maybe stale', tone: 'streak' }],
        cost: 'Always answers. Briefly out of date.',
      },
      verdict: 'Availability by default. Consistency for money, inventory, and booking limited resources.',
    },
    caption: 'The choice only exists during a network partition — but partitions are guaranteed.',
    seeAlso: ['PACELC', 'AP'],
  },
  {
    id: 'PACELC',
    full: 'Partition: Availability or Consistency; Else: Latency or Consistency',
    gist: 'The extension of CAP that covers the normal case. Even with a healthy network, keeping replicas in step costs latency — so the trade never actually goes away.',
    figure: {
      kind: 'split',
      left: {
        title: 'During a Partition',
        nodes: [{ label: 'Network split', to: 'pick' }, { label: 'A or C', tone: 'alert' }],
        cost: 'The CAP case. Rare.',
      },
      right: {
        title: 'Else',
        nodes: [{ label: 'Healthy network', to: 'pick' }, { label: 'L or C', tone: 'line' }],
        cost: 'The everyday case. Constant.',
      },
      verdict: 'Synchronous replication to a distant region costs milliseconds on every write, partition or not.',
    },
    caption: 'CAP describes the rare case; PACELC adds the one you live in.',
    seeAlso: ['CAP'],
  },
  {
    id: 'AP',
    full: 'Available and Partition-tolerant',
    gist: 'Shorthand for a system that keeps answering during a network split, accepting that two readers might briefly disagree. The right default for feeds, search and browsing.',
    figure: {
      kind: 'timeline',
      ticks: ['split begins', 'during', 'healed'],
      lanes: [
        {
          label: 'Replica A',
          bars: [{ from: 0, to: 0.66, label: 'serves v1', tone: 'mastered' }, { from: 0.66, to: 1, label: 'v2', tone: 'mastered' }],
        },
        {
          label: 'Replica B',
          bars: [{ from: 0, to: 0.66, label: 'serves v2', tone: 'streak' }, { from: 0.66, to: 1, label: 'v2', tone: 'mastered' }],
          outcome: { label: 'converged', tone: 'mastered' },
        },
      ],
      note: 'Both kept answering. They disagreed for a while, then converged.',
    },
    caption: 'Availability means nobody is refused — not that everybody agrees immediately.',
    seeAlso: ['CP', 'CAP'],
  },
  {
    id: 'CP',
    full: 'Consistent and Partition-tolerant',
    gist: 'Shorthand for a system that would rather fail a request than serve data it is not sure about. What you want on the path that takes someone\'s money or their last seat.',
    figure: {
      kind: 'timeline',
      ticks: ['split begins', 'during', 'healed'],
      lanes: [
        {
          label: 'Majority side',
          bars: [{ from: 0, to: 0.66, label: 'serves', tone: 'mastered' }, { from: 0.66, to: 1, label: 'serves', tone: 'mastered' }],
        },
        {
          label: 'Minority side',
          bars: [{ from: 0, to: 0.66, label: 'refuses', tone: 'alert' }, { from: 0.66, to: 1, label: 'serves', tone: 'mastered' }],
          outcome: { label: 'never wrong', tone: 'line' },
        },
      ],
      note: 'The cut-off side stops rather than risk selling the same seat twice.',
    },
    caption: 'Refusing to answer is the feature, not the bug.',
    seeAlso: ['AP', 'CAP'],
  },
  {
    id: 'OCC',
    full: 'Optimistic Concurrency Control',
    gist: 'Do not lock. Read a row, remember its version, and make the write conditional on that version still being current. If someone got there first, your write fails and you retry — which is the correctness boundary underneath every reservation scheme.',
    figure: {
      kind: 'timeline',
      ticks: ['read', 'both write', 'result'],
      lanes: [
        {
          label: 'Writer A',
          bars: [{ from: 0, to: 0.5, label: 'read v7', tone: 'line' }, { from: 0.5, to: 0.8, label: 'write if v7', tone: 'mastered' }],
          outcome: { label: 'committed', tone: 'mastered' },
        },
        {
          label: 'Writer B',
          bars: [{ from: 0, to: 0.5, label: 'read v7', tone: 'line' }, { from: 0.5, to: 0.8, label: 'write if v7', tone: 'alert' }],
          outcome: { label: 'rejected — retry', tone: 'alert' },
        },
      ],
    },
    caption: 'Both read the same version; only the first write to arrive still matches it.',
    seeAlso: ['ACID', 'TTL'],
  },
  {
    id: 'TTL',
    full: 'Time To Live',
    gist: 'An expiry stamped on a value when it is written. When the clock runs out the value vanishes on its own — no cron job, nothing to forget, and a crashed process cannot wedge a resource forever.',
    figure: {
      kind: 'timeline',
      ticks: ['0:00', '5:00', '10:00'],
      lanes: [
        {
          label: 'User buys at 5:00',
          bars: [{ from: 0, to: 0.5, label: 'held', tone: 'line' }],
          outcome: { label: 'booked', tone: 'mastered' },
        },
        {
          label: 'User abandons',
          bars: [{ from: 0, to: 1, label: 'held until expiry', tone: 'line' }],
          outcome: { label: 'released', tone: 'neutral' },
        },
      ],
      note: 'Nothing had to notice the second user leaving. The expiry did the work.',
    },
    caption: 'A hold that cleans itself up, whatever the client does.',
    seeAlso: ['OCC', 'LRU'],
  },
  {
    id: 'CDC',
    full: 'Change Data Capture',
    gist: 'Streaming a database\'s write log into something else — usually a search index. It means the index is always about a second behind, which is fine for search and never fine for a booking decision.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Postgres', sub: 'source of truth', to: 'write log' },
        { label: 'CDC stream', sub: 'inserts, updates, deletes', tone: 'line', to: '~1s lag' },
        { label: 'Search index', sub: 'always slightly behind', tone: 'streak' },
      ],
    },
    caption: 'The lag is the defining property. Design around it rather than forgetting it.',
    seeAlso: ['GIN', 'GSI'],
  },
  {
    id: 'PK',
    full: 'Partition Key',
    gist: 'The field that decides which machine a row lives on. Choosing it fixes which queries are instant and which become a full scan — it is the single most consequential decision in a key-value data model.',
    figure: {
      kind: 'grid',
      cols: 4,
      cells: [
        { label: 'u1', tone: 'line' },
        { label: 'u2', tone: 'neutral' },
        { label: 'u3', tone: 'neutral' },
        { label: 'u4', tone: 'neutral' },
        { label: 'u1', tone: 'line' },
        { label: 'u2', tone: 'neutral' },
        { label: 'u3', tone: 'neutral' },
        { label: 'u4', tone: 'neutral' },
      ],
      legend: [
        { tone: 'line', label: 'all of user 1 on one shard — instant' },
        { tone: 'neutral', label: 'a query across users touches every shard' },
      ],
    },
    caption: 'Partitioning by user makes per-user reads free and cross-user reads expensive.',
    seeAlso: ['SK', 'GSI', 'NoSQL'],
  },
  {
    id: 'SK',
    full: 'Sort Key',
    gist: 'The second half of a composite key: it orders rows within a partition, which is what makes "the most recent twenty" a cheap read instead of a scan and sort.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'creator: alice', sub: 'partition key', tone: 'line' },
        { label: '  2026-09-06T18:00', sub: 'newest — read these first', tone: 'mastered' },
        { label: '  2026-09-06T09:12', sub: 'sort key orders within the partition' },
        { label: '  2026-09-05T22:40', sub: 'oldest' },
      ],
    },
    caption: 'Rows arrive already in order, so "latest N" is a prefix read.',
    seeAlso: ['PK', 'GSI'],
  },
  {
    id: 'GSI',
    full: 'Global Secondary Index',
    gist: 'A second copy of a table organised under a different key, so it can answer a completely different question. It is how one Follow table answers both "who do I follow" and "who follows me".',
    figure: {
      kind: 'split',
      left: {
        title: 'Base table',
        nodes: [{ label: 'PK: follower', to: 'gives' }, { label: 'who I follow', tone: 'line' }],
        cost: 'One direction only.',
      },
      right: {
        title: 'Reversed GSI',
        nodes: [{ label: 'PK: followee', to: 'gives' }, { label: 'who follows me', tone: 'mastered' }],
        cost: 'Costs storage and write throughput; eventually consistent.',
      },
      verdict: 'Two cheap lookups instead of a graph database — there is no deep traversal here.',
    },
    caption: 'The same relationship, indexed from both ends.',
    seeAlso: ['LSI', 'PK', 'CDC'],
  },
  {
    id: 'LSI',
    full: 'Local Secondary Index',
    gist: 'An index that keeps the same partition key and changes only the sort order — a different way to slice data you have already narrowed down.',
    figure: {
      kind: 'split',
      left: {
        title: 'Base',
        nodes: [{ label: 'user + date', tone: 'line' }],
        cost: "One user's posts, newest first.",
      },
      right: {
        title: 'LSI',
        nodes: [{ label: 'user + likes', tone: 'mastered' }],
        cost: "Same user's posts, most liked first.",
      },
    },
    caption: 'Same partition, different ordering.',
    seeAlso: ['GSI', 'SK'],
  },
  {
    id: 'GIN',
    full: 'Generalised Inverted Index',
    gist: "Postgres's index type for full-text search. It maps each word to the rows containing it, which is what makes text search a lookup instead of a scan — and it means you often do not need a separate search cluster at all.",
    figure: {
      kind: 'flow',
      nodes: [
        { label: '"taylor"', sub: 'a word', to: 'index' },
        { label: '[doc1, doc7, doc9]', sub: 'rows containing it', tone: 'line', to: 'intersect' },
        { label: 'doc1', sub: 'matches every word', tone: 'mastered' },
      ],
      note: 'Inverted: words point at documents, not the other way round.',
    },
    caption: 'A word-to-documents map turns search into a lookup and an intersection.',
    seeAlso: ['CDC'],
  },
  {
    id: 'PostGIS',
    full: 'PostGIS',
    gist: 'The geospatial extension for Postgres. It adds real distance and containment operators plus indexes that make "within 5 km" a range scan instead of a scan of every row.',
    figure: {
      kind: 'grid',
      cols: 5,
      cells: [
        {}, {}, {}, {}, {},
        {}, { tone: 'line' }, { tone: 'line' }, { tone: 'line' }, {},
        {}, { tone: 'line' }, { label: 'you', tone: 'mastered' }, { tone: 'line' }, {},
        {}, { tone: 'line' }, { tone: 'line' }, { tone: 'line' }, {},
        {}, {}, {}, {}, {},
      ],
      legend: [
        { tone: 'mastered', label: 'your position' },
        { tone: 'line', label: 'cells the query actually reads' },
      ],
    },
    caption: 'A geospatial index reads only the cells near you, not the whole table.',
    seeAlso: ['S2'],
  },
  {
    id: 'S2',
    full: 'S2 cells',
    gist: "Google's scheme for dividing the globe into cells that subdivide adaptively, so a dense city gets finer cells than an empty ocean. Same idea as geohashing, better behaved at the poles.",
    figure: {
      kind: 'grid',
      cols: 4,
      cells: [
        { tone: 'neutral' }, { tone: 'neutral' }, { tone: 'line', label: '·' }, { tone: 'line', label: '·' },
        { tone: 'neutral' }, { tone: 'neutral' }, { tone: 'line', label: '·' }, { tone: 'line', label: '·' },
        { tone: 'neutral' }, { tone: 'neutral' }, { tone: 'neutral' }, { tone: 'neutral' },
        { tone: 'neutral' }, { tone: 'neutral' }, { tone: 'neutral' }, { tone: 'neutral' },
      ],
      legend: [
        { tone: 'line', label: 'dense area — subdivided further' },
        { tone: 'neutral', label: 'sparse area — one coarse cell' },
      ],
    },
    caption: 'Cells get smaller where there is more to find.',
    seeAlso: ['PostGIS'],
  },
  {
    id: 'OLAP',
    full: 'Online Analytical Processing',
    gist: 'A store built for aggregating across enormous numbers of rows — sums and counts over billions of events — rather than reading or writing one record at a time.',
    figure: {
      kind: 'split',
      left: {
        title: 'Transactional',
        nodes: [{ label: 'One order', to: 'read/write' }, { label: 'Fast', tone: 'mastered' }],
        cost: 'Row at a time. Milliseconds.',
      },
      right: {
        title: 'OLAP',
        nodes: [{ label: 'Sum 4bn clicks', to: 'scan columns' }, { label: 'Fast', tone: 'mastered' }],
        cost: 'Column at a time. Built for aggregation.',
      },
    },
    caption: 'Different question shapes want different physical layouts.',
    seeAlso: ['DAG'],
  },
  {
    id: 'UUID',
    full: 'Universally Unique Identifier',
    gist: 'A 128-bit identifier random enough that two machines can generate one each and safely assume they will never collide. It is what lets a client name a thing before the server has ever heard of it.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Client', sub: 'generates the id', to: 'send with id' },
        { label: 'Server', sub: 'retry? same id', tone: 'line', to: 'store once' },
        { label: 'One record', sub: 'no duplicate', tone: 'mastered' },
      ],
      note: 'Client-generated ids are what make a retry safe.',
    },
    caption: 'Naming the thing before sending it is what makes at-least-once delivery survivable.',
    seeAlso: ['DLQ'],
  },

  /* ---------------- caching, queues, workflow ---------------- */
  {
    id: 'LRU',
    full: 'Least Recently Used',
    gist: 'The default eviction policy: when the cache is full, throw out whatever has gone untouched longest. It works because recently used things tend to be used again.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'Just read', sub: 'safest', tone: 'mastered' },
        { label: 'Read a minute ago', tone: 'neutral' },
        { label: 'Read an hour ago', tone: 'neutral' },
        { label: 'Untouched longest', sub: 'evicted first', tone: 'alert' },
      ],
    },
    caption: 'Recency as a proxy for what will be needed next.',
    seeAlso: ['LFU', 'FIFO', 'TTL'],
  },
  {
    id: 'LFU',
    full: 'Least Frequently Used',
    gist: 'Evict whatever has been read fewest times. Better than LRU when popularity is stable, worse when it shifts — an old favourite can outlive a new hit.',
    figure: {
      kind: 'ratio',
      parts: [
        { label: 'read 900 times — kept', value: 900, tone: 'mastered' },
        { label: 'read 80 times', value: 80, tone: 'line' },
        { label: 'read twice — evicted', value: 20, tone: 'alert' },
      ],
    },
    caption: 'Count as a proxy for value — which is why a stale favourite can crowd out a rising one.',
    seeAlso: ['LRU', 'FIFO'],
  },
  {
    id: 'FIFO',
    full: 'First In, First Out',
    gist: 'Evict, or process, in arrival order. Fine for a queue, rarely the right eviction policy for a cache — the oldest entry may be the most popular.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'in: A B C', to: 'queue' },
        { label: 'A leaves first', tone: 'line', to: 'then B' },
        { label: 'order preserved', tone: 'mastered' },
      ],
    },
    caption: 'Arrival order out. No notion of what is actually useful.',
    seeAlso: ['LRU', 'SQS'],
  },
  {
    id: 'DLQ',
    full: 'Dead Letter Queue',
    gist: 'Where a message goes after it has failed too many times. It parks the poison message and alerts someone, instead of letting it retry forever and block everything behind it.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Queue', to: 'deliver' },
        { label: 'Worker', sub: 'fails', tone: 'streak', to: 'retry ×3' },
        { label: 'Still failing', tone: 'alert', to: 'park it' },
        { label: 'DLQ', sub: 'alert a human', tone: 'alert' },
      ],
    },
    caption: 'A bounded number of retries, then quarantine — so one bad message cannot stall the queue.',
    seeAlso: ['SQS', 'UUID'],
  },
  {
    id: 'SQS',
    full: 'Simple Queue Service',
    gist: "Amazon's managed queue. Producers push, workers pull, and a message that is not acknowledged in time becomes visible again for someone else to pick up — which is what makes a crashed worker a non-event.",
    figure: {
      kind: 'timeline',
      ticks: ['taken', 'timeout', 'redelivered'],
      lanes: [
        {
          label: 'Worker A takes the job',
          bars: [{ from: 0, to: 0.55, label: 'invisible to others', tone: 'line' }],
          outcome: { label: 'crashes', tone: 'alert' },
        },
        {
          label: 'Worker B',
          bars: [{ from: 0.55, to: 1, label: 'picks it up', tone: 'mastered' }],
          outcome: { label: 'completes', tone: 'mastered' },
        },
      ],
      note: 'Redelivery is normal operation, which is exactly why handlers must be idempotent.',
    },
    caption: 'The visibility timeout turns a dead worker into a short delay.',
    seeAlso: ['DLQ', 'UUID'],
  },
  {
    id: 'DAG',
    full: 'Directed Acyclic Graph',
    gist: 'A set of steps with dependencies and no loops. It is the shape of any pipeline where some work can run in parallel and some has to wait — video transcoding, build systems, data workflows.',
    figure: {
      kind: 'split',
      left: {
        title: 'Fan out',
        nodes: [{ label: 'Source video', to: 'split' }, { label: '1080p · 720p · 360p', tone: 'line' }],
        cost: 'Independent — run them at once.',
      },
      right: {
        title: 'Join',
        nodes: [{ label: 'All renditions', to: 'wait for all' }, { label: 'Manifest', tone: 'mastered' }],
        cost: 'Dependent — cannot start early.',
      },
    },
    caption: 'Parallel where the work is independent, sequential where it is not.',
    seeAlso: ['OLAP'],
  },
  {
    id: 'OT',
    full: 'Operational Transformation',
    gist: 'The older way two people edit the same document at once: every edit is rewritten against the edits that landed before it, so both sides converge. Powerful, and notoriously hard to get right.',
    figure: {
      kind: 'split',
      left: {
        title: 'OT',
        nodes: [{ label: 'Edit', to: 'transform against others' }, { label: 'Converged', tone: 'line' }],
        cost: 'Needs a central server to order edits.',
      },
      right: {
        title: 'CRDT',
        nodes: [{ label: 'Edit', to: 'merge by construction' }, { label: 'Converged', tone: 'mastered' }],
        cost: 'Works peer to peer. More metadata per character.',
      },
    },
    caption: 'Two routes to the same guarantee: everyone ends up with the same document.',
    seeAlso: ['CRDT'],
  },
  {
    id: 'CRDT',
    full: 'Conflict-free Replicated Data Type',
    gist: 'A data structure designed so that concurrent edits merge to the same result no matter what order they arrive in. No central coordinator needed — the merge is built into the type.',
    figure: {
      kind: 'timeline',
      ticks: ['offline edits', 'reconnect', 'merged'],
      lanes: [
        {
          label: 'Device A',
          bars: [{ from: 0, to: 0.5, label: 'adds "cat"', tone: 'line' }, { from: 0.5, to: 1, label: 'cat + dog', tone: 'mastered' }],
        },
        {
          label: 'Device B',
          bars: [{ from: 0, to: 0.5, label: 'adds "dog"', tone: 'streak' }, { from: 0.5, to: 1, label: 'cat + dog', tone: 'mastered' }],
          outcome: { label: 'identical', tone: 'mastered' },
        },
      ],
    },
    caption: 'Both edited alone, both ended up with the same document, no server arbitrated.',
    seeAlso: ['OT'],
  },
  {
    id: 'HLS',
    full: 'HTTP Live Streaming',
    gist: 'Video cut into a few seconds per file at several qualities, plus a manifest listing them. The player picks the next chunk\'s quality itself, which is why quality shifts mid-video instead of buffering.',
    figure: {
      kind: 'stack',
      layers: [
        { label: '1080p', sub: 'segment-01 · 02 · 03', tone: 'mastered' },
        { label: '720p', sub: 'segment-01 · 02 · 03', tone: 'line' },
        { label: '360p', sub: 'segment-01 · 02 · 03', tone: 'streak' },
      ],
      note: 'The player measures its own throughput and steps between rows, segment by segment.',
    },
    caption: 'Same video, several ladders of quality, switchable every few seconds.',
    seeAlso: ['DASH', 'CDN'],
  },
  {
    id: 'DASH',
    full: 'Dynamic Adaptive Streaming over HTTP',
    gist: 'The open standard that does the same job as HLS — segmented video at several bitrates with a manifest. Different format, identical idea.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Manifest', sub: 'what exists', to: 'player reads' },
        { label: 'Player', sub: 'measures bandwidth', tone: 'line', to: 'requests' },
        { label: 'Next segment', sub: 'at a chosen quality', tone: 'mastered' },
      ],
    },
    caption: 'The client, not the server, decides what quality to fetch next.',
    seeAlso: ['HLS'],
  },
  {
    id: 'HyperLogLog',
    full: 'HyperLogLog',
    gist: 'A structure that counts unique items in a huge stream using a fixed, tiny amount of memory — around 12 kilobytes for billions of items — by accepting roughly two percent error.',
    figure: {
      kind: 'ratio',
      parts: [
        { label: 'exact set: ~4 GB', value: 4000, tone: 'alert' },
        { label: 'HyperLogLog: ~12 KB', value: 12, tone: 'mastered' },
      ],
      note: 'For "how many unique visitors", 2% error is invisible and the memory saving is not.',
    },
    caption: 'Trading a couple of percent of accuracy for four orders of magnitude of memory.',
    seeAlso: ['SimHash'],
  },
  {
    id: 'SimHash',
    full: 'Similarity Hash',
    gist: 'A hash where *similar* inputs produce similar outputs — the opposite of a normal hash. It is how a crawler spots that two pages are near-duplicates rather than only exact copies.',
    figure: {
      kind: 'split',
      left: {
        title: 'Normal hash',
        nodes: [{ label: 'One word differs', to: 'hash' }, { label: 'Totally different', tone: 'alert' }],
        cost: 'Catches exact copies only.',
      },
      right: {
        title: 'SimHash',
        nodes: [{ label: 'One word differs', to: 'hash' }, { label: 'Almost identical', tone: 'mastered' }],
        cost: 'Distance between hashes measures similarity.',
      },
    },
    caption: 'Near-duplicate detection needs a hash that preserves similarity.',
    seeAlso: ['HyperLogLog'],
  },

  /* ---------------- operations and measurement ---------------- */
  {
    id: 'QPS',
    full: 'Queries Per Second',
    gist: 'How many requests arrive each second. The number that decides how many machines you need — and the one worth estimating, because it changes the design.',
    figure: {
      kind: 'scale',
      items: [
        { label: 'Average, 8.6M requests/day', display: '100/s', value: 100, tone: 'line' },
        { label: 'Peak, 3–10× average', display: '~1k/s', value: 1000, tone: 'streak' },
        { label: 'One app server handles', display: '~10k/s', value: 10000, tone: 'mastered' },
      ],
      note: 'Divide daily volume by 100,000 for average, then multiply by 3–10 for peak.',
    },
    caption: 'Averages size storage; peaks size servers.',
    seeAlso: ['TPS', 'DAU'],
  },
  {
    id: 'TPS',
    full: 'Transactions Per Second',
    gist: 'The write-side equivalent of QPS. One well-tuned relational instance handles up to about fifty thousand — which is far more than most candidates assume, and why sharding is rarely the first answer.',
    figure: {
      kind: 'scale',
      items: [
        { label: 'You think you need to shard', display: '10k/s', value: 10000, tone: 'streak' },
        { label: 'One tuned instance handles', display: '50k/s', value: 50000, tone: 'mastered' },
        { label: 'One Kafka broker', display: '1M/s', value: 1000000, tone: 'line' },
      ],
    },
    caption: 'The gap between where people reach for sharding and where it is actually needed.',
    seeAlso: ['QPS'],
  },
  {
    id: 'DAU',
    full: 'Daily Active Users',
    gist: 'How many distinct people use the product in a day. The starting number for almost every capacity estimate — multiply by actions per user to get writes per second.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: '1M DAU', to: '× 10 actions' },
        { label: '10M actions/day', tone: 'line', to: '÷ 100k' },
        { label: '~116 writes/s', sub: 'average', tone: 'mastered' },
      ],
    },
    caption: 'The standard chain from a user count to a load figure.',
    seeAlso: ['QPS', 'GB'],
  },
  {
    id: 'GB',
    full: 'Gigabyte — and the rest of the ladder',
    gist: 'Each step is roughly a thousand times the last. Worth internalising, because the difference between "a few gigabytes" and "a few terabytes" is the difference between one database and a sharding discussion.',
    figure: {
      kind: 'scale',
      items: [
        { label: 'KB — one page of text', display: '10³', value: 1e3 },
        { label: 'MB — one photograph', display: '10⁶', value: 1e6 },
        { label: 'GB — a feed table for 500k users', display: '10⁹', value: 1e9, tone: 'line' },
        { label: 'TB — comfortable for one Postgres', display: '10¹²', value: 1e12, tone: 'mastered' },
        { label: 'PB — now you are sharding', display: '10¹⁵', value: 1e15, tone: 'streak' },
      ],
    },
    caption: 'A thousandfold per step. TiB is the same idea in powers of 1024.',
    seeAlso: ['TiB', 'DAU'],
  },
  {
    id: 'TiB',
    full: 'Tebibyte',
    gist: 'A terabyte counted in powers of two — 1024⁴ bytes — rather than powers of ten. About ten percent larger than a TB, and the unit storage vendors quote capacity in.',
    figure: {
      kind: 'ratio',
      parts: [
        { label: 'TB — 10¹² bytes', value: 1000, tone: 'line' },
        { label: 'the extra ~10% in a TiB', value: 100, tone: 'mastered' },
      ],
    },
    caption: 'Same order of magnitude; the distinction only matters when you are near a limit.',
    seeAlso: ['GB'],
  },
  {
    id: 'CPU',
    full: 'Central Processing Unit',
    gist: 'The processor. As a scaling signal it is a lagging one — by the time it is at seventy percent you are already behind, which is why queue depth is the better autoscaling trigger.',
    figure: {
      kind: 'ratio',
      parts: [
        { label: 'headroom', value: 30, tone: 'mastered' },
        { label: 'in use — scale at 70%', value: 70, tone: 'streak' },
      ],
      note: 'Scale before saturation, not at it. There is no capacity left to absorb a spike at 95%.',
    },
    caption: 'Seventy percent is the trigger because scaling takes time you will not have later.',
    seeAlso: ['RAM', 'SLA'],
  },
  {
    id: 'RAM',
    full: 'Random Access Memory',
    gist: 'Working memory — nanoseconds to read, and gone when the process dies. It is why a cache is fast and why anything that must survive a restart has to be written somewhere else.',
    figure: {
      kind: 'scale',
      items: [
        { label: 'RAM', display: 'ns', value: 1, tone: 'mastered' },
        { label: 'SSD', display: 'µs', value: 1000, tone: 'line' },
        { label: 'Network, same datacentre', display: 'ms', value: 1e6, tone: 'streak' },
        { label: 'Cross-continent', display: '100 ms', value: 1e8, tone: 'alert' },
      ],
    },
    caption: 'Each step is roughly a thousand times slower than the one above it.',
    seeAlso: ['SSD', 'CPU'],
  },
  {
    id: 'SSD',
    full: 'Solid State Drive',
    gist: 'Persistent storage with no moving parts — microseconds to read, thousands of times slower than memory, thousands of times faster than the spinning disks the older rules of thumb assumed.',
    figure: {
      kind: 'ratio',
      parts: [
        { label: 'SSD read: ~100 µs', value: 100, tone: 'mastered' },
        { label: 'spinning disk seek: ~10,000 µs', value: 900, tone: 'alert' },
      ],
      note: 'Rules of thumb written for spinning disks are why people still over-estimate how much a database struggles.',
    },
    caption: 'The hardware moved. A lot of received wisdom did not.',
    seeAlso: ['RAM', 'TPS'],
  },
  {
    id: 'SLA',
    full: 'Service Level Agreement',
    gist: 'The promise you make about availability or latency, and what happens when you break it. "Three nines" sounds abstract until you convert it into minutes.',
    figure: {
      kind: 'scale',
      items: [
        { label: '99% — two nines', display: '3.6 days/yr', value: 5256, tone: 'alert' },
        { label: '99.9% — three nines', display: '8.8 hours/yr', value: 526, tone: 'streak' },
        { label: '99.99% — four nines', display: '53 min/yr', value: 53, tone: 'line' },
        { label: '99.999% — five nines', display: '5 min/yr', value: 5, tone: 'mastered' },
      ],
      note: 'Downtime allowed per year. Every extra nine costs roughly ten times as much to reach.',
    },
    caption: 'Availability targets expressed as the outage budget they actually permit.',
    seeAlso: ['CPU'],
  },
  {
    id: 'GDPR',
    full: 'General Data Protection Regulation',
    gist: "The European privacy law. In design terms it shows up as three concrete constraints: where data may physically live, how long you may keep it, and being able to genuinely delete a person on request.",
    figure: {
      kind: 'stack',
      layers: [
        { label: 'Residency', sub: 'EU data stays in the EU', tone: 'line' },
        { label: 'Retention', sub: 'delete it when the reason expires', tone: 'line' },
        { label: 'Erasure', sub: 'including from every replica, backup and index', tone: 'alert' },
      ],
      note: 'Erasure is the one that bites: a denormalised copy is still a copy.',
    },
    caption: 'Three design constraints, not a legal abstraction.',
    seeAlso: ['CDC'],
  },
  {
    id: 'ML',
    full: 'Machine Learning',
    gist: 'Systems that learn behaviour from data rather than following rules you wrote. In interviews it is a separate discipline — ML system design has its own format and its own preparation.',
    figure: {
      kind: 'split',
      left: {
        title: 'Rules',
        nodes: [{ label: 'You write the logic', to: 'output' }, { label: 'Predictable', tone: 'mastered' }],
        cost: 'You can read exactly why it did that.',
      },
      right: {
        title: 'Learned',
        nodes: [{ label: 'Data shapes the model', to: 'output' }, { label: 'Statistical', tone: 'line' }],
        cost: 'Needs training data, evaluation, and a retraining loop.',
      },
    },
    caption: 'Where the behaviour comes from is the whole difference.',
  },
  {
    id: 'SMS',
    full: 'Short Message Service',
    gist: 'Text messages. Worth naming in design because each one costs real money — which makes any endpoint that triggers one a place where a rate limiter should fail closed, not open.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Request', to: 'rate limit' },
        { label: 'Limiter down?', tone: 'streak', to: 'reject' },
        { label: 'Fail closed', sub: 'an outage is cheaper than the bill', tone: 'mastered' },
      ],
    },
    caption: 'When the action costs money, unavailable beats unlimited.',
    seeAlso: ['SLA'],
  },
  {
    id: 'S3',
    full: 'Simple Storage Service',
    gist: "Amazon's object store. Effectively unlimited, extremely durable, and about fifty times cheaper per gigabyte than a database — which is why file bytes always live here and never in a table.",
    figure: {
      kind: 'ratio',
      parts: [
        { label: 'S3: $0.023 per GB/month', value: 23, tone: 'mastered' },
        { label: 'DynamoDB: $1.25 per GB/month', value: 1250, tone: 'alert' },
      ],
      note: 'Cost alone settles where the bytes go, before you even reach the throughput argument.',
    },
    caption: 'Roughly a fiftyfold difference for storing the same bytes.',
    seeAlso: ['GCS', 'CDN'],
  },
  {
    id: 'GCS',
    full: 'Google Cloud Storage',
    gist: "Google's object store — the same role as S3, with a compatible enough interface that the design does not change if you swap one for the other.",
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Your design', sub: 'blob storage', to: 'implemented by' },
        { label: 'S3 · GCS · Azure Blob', tone: 'line' },
      ],
      note: 'Name one, and say the pattern is provider-agnostic.',
    },
    caption: 'The role matters to the design; the vendor does not.',
    seeAlso: ['S3'],
  },
  {
    id: 'AWS',
    full: 'Amazon Web Services',
    gist: "Amazon's cloud platform, and the source of most of the product names used as shorthand in design interviews — S3 for blobs, SQS for queues, DynamoDB for key-value.",
    figure: {
      kind: 'stack',
      layers: [
        { label: 'S3', sub: 'blob storage', tone: 'line' },
        { label: 'SQS', sub: 'queue', tone: 'line' },
        { label: 'DynamoDB', sub: 'key-value store', tone: 'line' },
        { label: 'CloudFront', sub: 'CDN', tone: 'line' },
      ],
      note: 'Naming a concrete product is fine. Naming it without saying what role it plays is not.',
    },
    caption: 'Products stand in for roles — say the role too.',
    seeAlso: ['S3', 'SQS'],
  },
  {
    id: 'SRS',
    full: 'Spaced Repetition System',
    gist: 'Scheduling reviews at growing intervals, timed to just before you would have forgotten. It is how the drill deck in this app decides what to show you and when.',
    figure: {
      kind: 'timeline',
      ticks: ['day 0', 'day 6', 'day 30'],
      lanes: [
        {
          label: 'Answered correctly each time',
          bars: [
            { from: 0, to: 0.06, label: '1d', tone: 'line' },
            { from: 0.08, to: 0.24, label: '6d', tone: 'line' },
            { from: 0.26, to: 1, label: '~25d', tone: 'mastered' },
          ],
          outcome: { label: 'learned', tone: 'mastered' },
        },
        {
          label: 'Forgotten once',
          bars: [{ from: 0, to: 0.06, label: 'reset', tone: 'alert' }, { from: 0.08, to: 0.14, label: '1d', tone: 'line' }],
        },
      ],
      note: 'Each success stretches the gap. One lapse sends it back to the start.',
    },
    caption: 'Growing intervals, reset by forgetting — the whole mechanism.',
    seeAlso: ['TTL'],
  },
  {
    id: 'LLM',
    full: 'Large Language Model',
    gist: 'A model that generates text. Worth naming in design because a single call costs real money and takes seconds — which puts it firmly in the long-running-task pattern, and makes any endpoint that triggers one a place a rate limiter should fail closed.',
    figure: {
      kind: 'scale',
      items: [
        { label: 'Cache hit', display: '~1 ms', value: 1, tone: 'mastered' },
        { label: 'Database query', display: '~30 ms', value: 30, tone: 'line' },
        { label: 'LLM call', display: '~2,000 ms', value: 2000, tone: 'alert' },
      ],
      note: 'Three orders of magnitude slower than a database read. It never belongs inside a synchronous request the user is waiting on.',
    },
    caption: 'Where a model call sits against the rest of your latency budget.',
    seeAlso: ['SMS', 'DLQ'],
  },
  {
    id: 'URL',
    full: 'Uniform Resource Locator',
    gist: 'The address of a thing on the web. In design terms it is worth noticing that a URL is data you control — its shape decides what can be cached, what can be guessed, and what a crawler will treat as a distinct page.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'https://', sub: 'scheme', tone: 'neutral' },
        { label: 'api.example.com', sub: 'host — decides which machine', tone: 'line' },
        { label: '/v1/tweets/42', sub: 'path — names the resource', tone: 'mastered' },
        { label: '?cursor=abc', sub: 'query — parameters, and cache-busters', tone: 'streak' },
      ],
      note: 'A crawler normalises the last part away, or the same page enters the queue a hundred times.',
    },
    caption: 'Four parts, each doing a different job for routing and caching.',
    seeAlso: ['DNS', 'CDN'],
  },
  {
    id: 'L7',
    full: 'Layer 7 load balancing',
    gist: 'Balancing at the HTTP level: the balancer reads the request and can route on path, header or cookie. More capable than Layer 4, and the default unless you are carrying persistent connections.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'GET /api/users', sub: 'balancer reads it', to: 'route by path' },
        { label: 'Users service', tone: 'mastered' },
      ],
      note: 'Layer 4 could not do this — it never sees the path.',
    },
    caption: 'Routing decisions made from the content of the request.',
    seeAlso: ['L4', 'OSI'],
  },
  {
    id: 'KB',
    full: 'Kilobyte',
    gist: 'A thousand bytes — about a page of plain text. The unit that makes per-user overheads feel small: two kilobytes of feed per user is four terabytes across two billion users, and that is a cheap table.',
    figure: {
      kind: 'scale',
      items: [
        { label: 'KB — a page of text', display: '10³', value: 1e3, tone: 'line' },
        { label: 'MB — a photograph', display: '10⁶', value: 1e6 },
        { label: 'GB — a feed table for 500k users', display: '10⁹', value: 1e9 },
        { label: 'TB — comfortable for one Postgres', display: '10¹²', value: 1e12, tone: 'mastered' },
      ],
    },
    caption: 'Where a kilobyte sits on the ladder — and why per-user costs add up slowly.',
    seeAlso: ['MB', 'GB', 'TB'],
  },
  {
    id: 'MB',
    full: 'Megabyte',
    gist: 'A million bytes — a photograph, or a few seconds of video. The unit that chunked uploads are measured in: eight-megabyte parts are large enough to be efficient and small enough to retry cheaply.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: '3 GB file', to: 'split' },
        { label: '~375 × 8 MB parts', sub: 'uploaded in parallel', tone: 'line', to: 'one fails' },
        { label: 'Retry that part only', sub: 'not the whole file', tone: 'mastered' },
      ],
    },
    caption: 'Why chunk size matters: it is the unit of retry.',
    seeAlso: ['KB', 'GB', 'S3'],
  },
  {
    id: 'TB',
    full: 'Terabyte',
    gist: 'A trillion bytes. The threshold that matters most in design interviews: a single well-tuned relational instance handles a few terabytes comfortably, so this is roughly where a sharding conversation becomes honest rather than premature.',
    figure: {
      kind: 'scale',
      items: [
        { label: 'GB — one instance, trivially', display: '10⁹', value: 1e9 },
        { label: 'A few TB — one instance, comfortably', display: '10¹²', value: 4e12, tone: 'mastered' },
        { label: 'Tens of TB — now consider sharding', display: '10¹³', value: 5e13, tone: 'streak' },
        { label: 'PB — definitely sharded', display: '10¹⁵', value: 1e15, tone: 'alert' },
      ],
    },
    caption: 'The point on the ladder where sharding stops being premature.',
    seeAlso: ['GB', 'TiB', 'TPS'],
  },
]

const byId = new Map(glossary.map((g) => [g.id.toLowerCase(), g]))

export function getGlossary(id: string): GlossaryEntry | undefined {
  return byId.get(id.trim().toLowerCase())
}

export const glossaryIds: string[] = glossary.map((g) => g.id)
