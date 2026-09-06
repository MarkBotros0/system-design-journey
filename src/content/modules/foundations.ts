import type { Module } from '../types'

/**
 * Track 1 — Foundations.
 *
 * Assumes you can write code and have used a database, and assumes nothing else.
 * The job of this track is vocabulary and mental models: by the end you should be able
 * to read any architecture diagram and know what every box is for.
 */

export const foundationsModules: Module[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'f-what',
    trackId: 'foundations',
    title: 'What system design actually is',
    station: 1,
    prereqs: [],
    minutes: 6,
    summary: 'The shape of the problem, what an interviewer is scoring, and why there is no single right answer.',
    lesson: [
      {
        kind: 'prose',
        text: 'System design is deciding how the pieces of a software system fit together so it can serve real traffic without falling over. Not which framework — which **components**, what talks to what, where data lives, and what you are willing to give up.',
      },
      {
        kind: 'prose',
        text: 'The last part is the part people miss. Every interesting decision is a trade. Faster reads cost you stale data. Simpler code costs you scale headroom. There is no design with no downside, so a design presented without its downside reads as one you have not finished thinking about.',
      },
      {
        kind: 'figure',
        caption: 'Four competencies, and only one of them is what you know.',
        figure: {
          kind: 'stack',
          layers: [
            { label: 'Problem navigation', sub: 'can you cut it down to something buildable', tone: 'line' },
            { label: 'Solution design', sub: 'do the pieces compose', tone: 'line' },
            { label: 'Technical excellence', sub: 'the only knowledge one', tone: 'mastered' },
            { label: 'Communication', sub: 'scored as heavily as the rest', tone: 'streak' },
          ],
          note: 'Candidates prepare almost entirely for the third and lose on the first and fourth.',
        },
      },
      { kind: 'heading', text: 'What gets scored' },
      {
        kind: 'prose',
        text: 'Interviewers assess four things, and only one of them is knowledge.',
      },
      {
        kind: 'table',
        head: ['Competency', 'What good looks like', 'How people lose it'],
        rows: [
          [
            '**Problem navigation**',
            'Cuts an open-ended problem down to something buildable, and prioritises',
            'Lists every feature, finishes none',
          ],
          [
            '**Solution design**',
            'Components that compose into one coherent system',
            'Spaghetti — boxes that individually make sense and together do not',
          ],
          [
            '**Technical excellence**',
            'Current tools, applied for a stated reason, with current numbers',
            'Naming technologies with no reason attached',
          ],
          [
            '**Communication**',
            'Explains clearly, takes a hint, leaves room',
            'Talks through the whole slot',
          ],
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'The one that surprises people',
        text: 'Communication is scored as heavily as design. An engineer who talks for forty-five minutes straight scores worse than one who says less and listens — because the interviewer has specific signals to collect and needs their questions answered to collect them.',
      },
      { kind: 'heading', text: 'Kinds of design interview' },
      {
        kind: 'list',
        items: [
          '**Product design** — the system behind a product people use. Twitter, Uber, Ticketmaster. The most common by far.',
          '**Infrastructure design** — a building block rather than a product. A rate limiter, a distributed cache, a job scheduler.',
          '**Object-oriented / low-level design** — class structure and interfaces rather than boxes and arrows. A different interview with different preparation.',
          '**[[ML]] system design** — needs modelling and feature engineering on top of everything here.',
        ],
      },
      {
        kind: 'prose',
        text: 'This app covers the first two. They share a framework, a vocabulary, and roughly ninety percent of their content.',
      },
      { kind: 'heading', text: 'There is no answer key' },
      {
        kind: 'prose',
        text: 'Two strong candidates will produce different designs for the same prompt and both pass. What is being tested is whether you can navigate to *a* working system and defend the choices you made getting there. Chasing a remembered "correct" architecture is how prepared candidates fail — the moment the interviewer changes a constraint, there is nothing underneath.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Design interviews are practical, not academic. Nobody is checking whether you can recite the [[CAP]] theorem. They are checking whether you would be useful in a room where a real decision has to be made.',
      },
    ],
    quiz: [
      {
        id: 'q-f-what-1',
        moduleId: 'f-what',
        stem: 'An interviewer asks you to design Twitter. Which opening move scores best?',
        options: [
          'List every feature Twitter has, then start designing the first one',
          'Propose three core features, check the priority with them, then design those',
          'Start drawing the architecture immediately to show you know the components',
          'Ask how many servers the system should have',
        ],
        correct: 1,
        explain:
          'A prioritised top three, agreed out loud, is the whole point of the requirements phase. A long list hurts more than it helps — you cannot design nine features in forty minutes, and drawing before scoping means designing the wrong thing quickly.',
      },
      {
        id: 'q-f-what-2',
        moduleId: 'f-what',
        stem: 'You finish your design with eight minutes left and keep talking to fill them. What happens to your score?',
        options: [
          'It improves — more content means more signal',
          'It stays flat; only the design is scored',
          'It drops, because communication and collaboration are scored and you denied the interviewer their questions',
          'It drops, because finishing early is itself a negative signal',
        ],
        correct: 2,
        explain:
          'Over-talking is the classic senior failure mode. The interviewer has signals they need and questions that unlock them; filling the silence costs you the points those questions would have won.',
      },
      {
        id: 'q-f-what-3',
        moduleId: 'f-what',
        stem: 'What does it mean that design interviews have "no single right answer"?',
        options: [
          'Any design passes as long as you sound confident',
          'The interviewer has an answer key and you are graded on how close you get',
          'Different valid designs exist; you are scored on navigating to one and defending its trade-offs',
          'The question is unfair and you should ask for a different one',
        ],
        correct: 2,
        explain:
          'Two strong candidates produce different designs and both pass. What is being tested is the navigation and the defence, not recall of one architecture.',
      },
    ],
    cards: [
      {
        id: 'c-f-what-1',
        moduleId: 'f-what',
        front: 'The four competencies a design interview scores.',
        back: 'Problem navigation · solution design · technical excellence · communication and collaboration. Only one of the four is knowledge.',
        tag: 'Interview',
      },
      {
        id: 'c-f-what-2',
        moduleId: 'f-what',
        front: 'Why is a design presented without trade-offs a weak answer?',
        back: 'Every interesting decision costs something. Naming no cost reads as not having finished the thought — or not knowing what the cost is.',
        tag: 'Interview',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'f-network',
    trackId: 'foundations',
    title: 'Client, server, and the network between them',
    station: 2,
    prereqs: ['f-what'],
    minutes: 8,
    summary: 'What actually happens between a tap and a response, which protocol to pick, and the latency floor physics imposes.',
    lesson: [
      {
        kind: 'prose',
        text: 'Every system in this course is, underneath, a client sending bytes to a server and getting bytes back. Most design decisions are about what sits between those two and how many times the round trip has to happen.',
      },
      {
        kind: 'flow',
        nodes: ['Client', '[[DNS]]', '[[CDN]]', 'Load balancer', 'App server', 'Database'],
        note: 'The default request path. Most designs add to this rather than replace it.',
      },
      { kind: 'heading', text: 'Protocols, in order of how often you need them' },
      {
        kind: 'table',
        head: ['Protocol', 'Direction', 'Reach for it when'],
        rows: [
          ['**[[HTTP]] over [[TCP]]**', 'Request → response', 'Roughly 90% of everything. Start here and justify anything else.'],
          ['**[[WebSocket]]**', 'Both ways, persistent', 'The client genuinely pushes too — chat, collaborative editing, multiplayer.'],
          ['**[[SSE]]**', 'Server → client', 'Live updates where the client only listens. Plain HTTP, far simpler than WebSocket.'],
          ['**[[gRPC]]**', 'Request → response', 'Service to service internally. Binary over HTTP/2, much faster. Browsers cannot use it natively.'],
        ],
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Reaching for WebSocket the moment you hear "real time". Most live features only need the server to push, which is exactly what SSE does over ordinary HTTP — no connection upgrade, no sticky-session problem, no [[L4]] load balancing requirement.',
      },
      { kind: 'heading', text: 'Load balancers' },
      {
        kind: 'prose',
        text: 'A load balancer spreads requests across identical servers. The only choice worth stating in an interview is which layer it works at.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Layer 4',
          points: [
            'Works at the TCP level',
            'Faster, but cannot see the request',
            'Required for **persistent connections** like WebSocket',
          ],
        },
        right: {
          title: 'Layer 7',
          points: [
            'Reads the actual HTTP request',
            'Can route by path, header, or cookie',
            'Fewer connections held open downstream',
          ],
        },
        verdict: '[[L7]] by default. L4 when you are balancing WebSockets.',
      },
      {
        kind: 'figure',
        caption: 'The latency ladder. Every step down is roughly a thousandfold.',
        figure: {
          kind: 'scale',
          items: [
            { label: 'Memory read', display: 'ns', value: 1, tone: 'mastered' },
            { label: 'Solid-state read', display: 'µs', value: 1e3, tone: 'mastered' },
            { label: 'Cache hit', display: '~1 ms', value: 1e6, tone: 'line' },
            { label: 'Same-datacentre network', display: '1–10 ms', value: 5e6, tone: 'line' },
            { label: 'Uncached database query', display: '20–50 ms', value: 3e7, tone: 'streak' },
            { label: 'New York to London', display: '~80 ms', value: 8e7, tone: 'alert' },
          ],
          note: 'When a design feels slow, find which rung it lands on and try to move up one.',
        },
      },
      { kind: 'heading', text: 'Latency is physics' },
      {
        kind: 'prose',
        text: 'A request from New York to London has a floor of about **80 ms**, and that is light moving through fibre. No amount of optimisation moves it. This single fact explains why the answer to "make it fast for users in Australia" is a CDN or a regional replica, never faster code.',
      },
      {
        kind: 'table',
        head: ['Hop', 'Order of magnitude'],
        rows: [
          ['Memory read', 'nanoseconds'],
          ['[[SSD]] read', 'microseconds'],
          ['Redis cache hit', '~1 ms'],
          ['Network call inside a datacentre', '1–10 ms'],
          ['Uncached database query', '20–50 ms'],
          ['Cross-continent round trip', '80–300 ms'],
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Each step down that table is roughly a thousand times slower than the one above. Whenever a design feels slow, find which row you are landing on and try to move up one.',
      },
      {
        kind: 'prose',
        text: 'Stateless servers matter here too. If any server can handle any request, you can add servers freely and lose one without losing sessions. The moment a server holds state a user depends on, you need sticky sessions or a shared store — and you have made scaling harder than it needed to be.',
      },
    ],
    quiz: [
      {
        id: 'q-f-network-1',
        moduleId: 'f-network',
        stem: 'A dashboard needs to show live metrics pushed from the server. The client never sends anything back except the initial request. What is the right protocol?',
        options: [
          '[[WebSocket]], because it is the real-time protocol',
          'Server-Sent Events — one-directional push over plain [[HTTP]]',
          'Long polling on a 200 ms interval',
          '[[gRPC]] streaming from the browser',
        ],
        correct: 1,
        explain:
          '[[SSE]] is exactly this shape: the client opens one HTTP request, the server pushes. WebSocket buys bidirectionality you are not using, at the cost of [[L4]] balancing and connection management. gRPC is not natively available in browsers.',
      },
      {
        id: 'q-f-network-2',
        moduleId: 'f-network',
        stem: 'Users in Sydney complain your London-hosted app feels slow. Your p99 server time is 12 ms. What is the fix?',
        options: [
          'Optimise the database queries further',
          'Add more application servers in London',
          'Serve from an edge location or a regional replica closer to Sydney',
          'Switch from [[REST]] to [[gRPC]]',
        ],
        correct: 2,
        explain:
          'At 12 ms of server time, the server is not the problem — the ocean is. Cross-continent round trips have a floor set by the speed of light in fibre. The only fix is to shorten the distance.',
      },
      {
        id: 'q-f-network-3',
        moduleId: 'f-network',
        stem: 'You are load balancing [[WebSocket]] connections. Which layer must the balancer operate at?',
        options: [
          'Layer 7, so it can route by path',
          'Layer 4, because the connection is persistent',
          'Either works identically',
          'Neither — WebSockets cannot be load balanced',
        ],
        correct: 1,
        explain:
          '[[L7]] balancers terminate and inspect [[HTTP]] requests, which does not fit a long-lived upgraded connection. [[L4]] balances at the [[TCP]] level and lets the connection stay open.',
      },
    ],
    cards: [
      {
        id: 'c-f-network-1',
        moduleId: 'f-network',
        front: '[[SSE]] versus [[WebSocket]] — when does each win?',
        back: 'SSE: server pushes, client only listens. Plain [[HTTP]], simpler, covers most "live" features. WebSocket: both sides send freely — chat, collaborative editing. Costs you [[L4]] balancing and connection state.',
        tag: 'Networking',
      },
      {
        id: 'c-f-network-2',
        moduleId: 'f-network',
        front: 'Minimum latency, New York to London.',
        back: 'About 80 ms — light through fibre. Not optimisable. It is why the answer is a [[CDN]] or regional replica, not faster code.',
        tag: 'Numbers',
      },
      {
        id: 'c-f-network-3',
        moduleId: 'f-network',
        front: 'Why do stateless application servers matter?',
        back: 'Any server can serve any request, so you add capacity by adding boxes and lose one without losing sessions. State on the server forces sticky sessions or a shared store.',
        tag: 'Scaling',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'f-api',
    trackId: 'foundations',
    title: 'Designing the API',
    station: 3,
    prereqs: ['f-network'],
    minutes: 7,
    summary: 'One endpoint per feature, the auth rule interviewers watch for, and why cursors beat offsets.',
    lesson: [
      {
        kind: 'prose',
        text: 'The API is the contract your architecture has to satisfy. Write it early and the high-level design almost assembles itself: take endpoint one, draw what serves it, then endpoint two.',
      },
      {
        kind: 'prose',
        text: 'Four or five endpoints in about two minutes. This is not a phase to perfect — it exists to constrain the next one.',
      },
      { kind: 'heading', text: 'Which style' },
      {
        kind: 'list',
        items: [
          '**[[REST]]** — the default, and right about 90% of the time. Resources as URLs, [[HTTP]] verbs for the operations.',
          '**GraphQL** — when genuinely diverse clients need different shapes of the same data, and over-fetching is a real cost.',
          '**[[gRPC]]** — internal service-to-service where the hop cost matters.',
        ],
      },
      {
        kind: 'code',
        code: `POST /v1/tweets
  { "text": string }              -> { tweetId }

GET  /v1/tweets/{tweetId}         -> Tweet

POST /v1/follows
  { "followeeId": string }        -> 200

GET  /v1/feed?cursor=&limit=      -> { items: Tweet[], nextCursor }`,
        caption: 'Twitter, scoped to three features. One endpoint per functional requirement.',
      },
      {
        kind: 'figure',
        caption: 'The same endpoint, written the way that fails and the way that does not.',
        figure: {
          kind: 'split',
          left: {
            title: 'Actor from the body',
            tone: 'alert',
            nodes: [
              { label: 'POST /tweets', sub: '{ userId, text }', to: 'trusted' },
              { label: 'Anyone posts as anyone', tone: 'alert' },
            ],
            cost: 'A free deduction. The caller chose who they are.',
          },
          right: {
            title: 'Actor from the token',
            tone: 'mastered',
            nodes: [
              { label: 'POST /tweets', sub: '{ text }', to: 'verified' },
              { label: 'Server derives the user', tone: 'mastered' },
            ],
            cost: 'The signature decides identity, not the payload.',
          },
        },
      },
      { kind: 'heading', text: 'The rule interviewers actually watch for' },
      {
        kind: 'callout',
        tone: 'trap',
        title: 'Free deduction',
        text: 'Never take the acting user from the request body or a path parameter. `POST /tweets { userId, text }` lets anyone post as anyone. The current user comes off the **auth token**, always.',
      },
      {
        kind: 'prose',
        text: 'This gets checked because it separates people who have shipped an authenticated API from people who have only drawn one. It costs a sentence to get right.',
      },
      { kind: 'heading', text: 'Pagination' },
      {
        kind: 'compare',
        left: {
          title: 'Offset — `?page=3&size=20`',
          points: [
            'Trivial to implement',
            'Breaks when rows are inserted mid-scroll — you see duplicates or skip items',
            'Gets slower deeper into the results',
          ],
        },
        right: {
          title: 'Cursor — `?cursor=<opaque>`',
          points: [
            'Stable while data is being written',
            'Stays fast at any depth',
            'Cannot jump to "page 47"',
          ],
        },
        verdict: 'Cursors for feeds and anything live. Offsets are fine for a settings table nobody is writing to.',
      },
      { kind: 'heading', text: 'The rest of the checklist' },
      {
        kind: 'list',
        items: [
          'Plural resource names — `/tweets`, not `/tweet`.',
          '[[JWT]] for user sessions; API keys for service-to-service.',
          'Rate limiting anywhere abuse is plausible.',
          'Real-time push is layered on **after** the core API, not instead of it — design `GET /feed` first, then say where the [[WebSocket]] attaches.',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-f-api-1',
        moduleId: 'f-api',
        stem: 'Which endpoint has the security flaw interviewers look for?',
        options: [
          'POST /v1/tweets  body: { text }',
          'POST /v1/tweets  body: { userId, text }',
          'GET /v1/feed?cursor=abc',
          'POST /v1/follows  body: { followeeId }',
        ],
        correct: 1,
        explain:
          'Taking `userId` from the body lets a caller post as anyone. The acting user must be derived from the auth token. Note that `followeeId` in a body is fine — that is the target, not the actor.',
      },
      {
        id: 'q-f-api-2',
        moduleId: 'f-api',
        stem: 'A social feed is being written to constantly while users scroll it. Which pagination do you specify?',
        options: [
          'Offset pagination — simpler and everyone understands it',
          'Cursor pagination — stable while rows are inserted',
          'No pagination; return the whole feed and let the client slice it',
          'Offset, but with a large page size to reduce requests',
        ],
        correct: 1,
        explain:
          'With offsets, a row inserted above your position shifts everything down — you see an item twice or miss one. Cursors anchor to a position in the data, so concurrent writes do not corrupt the scroll.',
      },
    ],
    cards: [
      {
        id: 'c-f-api-1',
        moduleId: 'f-api',
        front: 'Where does the current user come from in an [[API]] design?',
        back: 'The auth token. Never a body field or path parameter — that lets any caller act as anyone. Interviewers watch for this specifically.',
        tag: 'API',
      },
      {
        id: 'c-f-api-2',
        moduleId: 'f-api',
        front: '[[REST]], GraphQL, or [[gRPC]]?',
        back: 'REST for ~90%. GraphQL when diverse clients need different shapes of the same data. gRPC internally — binary over [[HTTP]]/2, fast, not browser-native.',
        tag: '[[API]]',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'f-db',
    trackId: 'foundations',
    title: 'Databases, enough to design with',
    station: 4,
    prereqs: ['f-api'],
    minutes: 9,
    summary: 'Indexes, transactions, and the one question that decides whether a query is fast or a table scan.',
    lesson: [
      {
        kind: 'prose',
        text: 'You do not need database internals to design systems. You need to know what makes a query fast, what a transaction guarantees, and where a single database stops being enough.',
      },
      {
        kind: 'figure',
        caption: 'Rows the database must read to answer the same question.',
        figure: {
          kind: 'scale',
          items: [
            { label: 'Indexed lookup on 10M rows', display: '~20 rows', value: 20, tone: 'mastered' },
            { label: 'Leading-wildcard LIKE on 10M rows', display: '10,000,000', value: 1e7, tone: 'alert' },
          ],
          note: 'An index is a sorted structure you can seek into. A leading wildcard leaves nothing to seek on.',
        },
      },
      { kind: 'heading', text: 'Indexes' },
      {
        kind: 'prose',
        text: 'An index is a sorted structure that lets the database find rows without reading all of them. Without one, a lookup reads the whole table — fine at a thousand rows, fatal at ten million.',
      },
      {
        kind: 'table',
        head: ['Index', 'Good for', 'Cannot do'],
        rows: [
          ['**B-tree**', 'Exact match *and* range scans. The default.', '—'],
          ['**Hash**', 'Exact match, slightly faster', 'Ranges, sorting'],
          ['**Inverted**', 'Full-text search — words to documents', 'Anything not text'],
          ['**Geospatial**', 'Proximity, bounding boxes', 'General queries'],
        ],
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'A leading wildcard defeats every ordinary index. `WHERE name LIKE \'%taylor%\'` has no sorted prefix to seek on, so it scans the table. If you propose it for search, you have proposed a table scan — that is what inverted indexes exist for.',
      },
      {
        kind: 'prose',
        text: 'Indexes are not free: each one costs storage and slows every write, because the index has to be updated too. Add them for the queries you actually run.',
      },
      { kind: 'heading', text: 'Transactions and [[ACID]]' },
      {
        kind: 'list',
        items: [
          '**Atomic** — all of it happens or none of it does.',
          '**Consistent** — the database moves between valid states; constraints hold.',
          '**Isolated** — concurrent transactions do not see each other half-finished.',
          '**Durable** — once committed, it survives a crash.',
        ],
      },
      {
        kind: 'prose',
        text: 'The one that carries weight in design discussions is **isolation**, because it is what stops two people buying the same seat. You will meet it properly in the contention module.',
      },
      { kind: 'heading', text: 'Joins and the shape of your data' },
      {
        kind: 'prose',
        text: 'A join combines rows from two tables on a shared key — the mechanism that lets you store each fact once. Normalising means exactly that: one row per fact, referenced by id.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Normalised',
          points: [
            'Each fact stored once',
            'Update a product name in one place',
            'Reads need joins, which cost time',
          ],
        },
        right: {
          title: 'Denormalised',
          points: [
            'Data duplicated where it is read',
            'Reads are a single lookup',
            'Every copy must be updated, or they drift',
          ],
        },
        verdict: 'Normalise first, then denormalise the specific hot path that needs it. That is the defensible default.',
      },
      { kind: 'heading', text: 'How far one database goes' },
      {
        kind: 'prose',
        text: 'Further than most candidates assume. A single well-tuned Postgres handles **up to ~50k transactions per second**, sub-5 ms cached reads, and **a few terabytes** comfortably. Do not propose sharding at ten thousand writes a second — you will be asked to justify it and you will not be able to.',
      },
    ],
    quiz: [
      {
        id: 'q-f-db-1',
        moduleId: 'f-db',
        stem: 'Your search feature runs `SELECT * FROM events WHERE name LIKE \'%swift%\'`. Adding a B-tree index on `name` will:',
        options: [
          'Make it fast — that is what indexes are for',
          'Make it fast only if the table is small',
          'Not help, because a leading wildcard has no sorted prefix to seek on',
          'Help writes but not reads',
        ],
        correct: 2,
        explain:
          'A B-tree is sorted by prefix. `%swift%` gives no prefix to start from, so the database scans every row regardless of the index. Full-text search needs an inverted index.',
      },
      {
        id: 'q-f-db-2',
        moduleId: 'f-db',
        stem: 'What is the honest default when someone asks whether to normalise or denormalise?',
        options: [
          'Always denormalise — joins are too slow at scale',
          'Always normalise — duplicated data always drifts',
          'Normalise first, then denormalise the specific hot read path',
          'It does not matter until you have millions of users',
        ],
        correct: 2,
        explain:
          'Normalised is correct by default and easy to change. Denormalising is a targeted optimisation you apply to a path you have identified as hot — and you accept the update cost knowingly.',
      },
      {
        id: 'q-f-db-3',
        moduleId: 'f-db',
        stem: 'You have 100 [[GB]] of data and 10,000 writes per second. Should you shard?',
        options: [
          'Yes — 10k writes/sec is well past a single instance',
          'No — a single tuned instance handles this comfortably; shard when the numbers demand it',
          'Yes, because 100 GB exceeds what one database can store',
          'Only if you are using Postgres rather than MySQL',
        ],
        correct: 1,
        explain:
          'A single instance handles up to ~50k [[TPS]] and a few terabytes. Sharding here buys nothing and costs you cross-shard queries, resharding pain, and complexity you would have to defend.',
      },
    ],
    cards: [
      {
        id: 'c-f-db-1',
        moduleId: 'f-db',
        front: 'Why can a B-tree index not serve `LIKE \'%term%\'`?',
        back: 'A leading wildcard leaves no sorted prefix to seek on, so it degrades to a full scan. Full-text needs an inverted index.',
        tag: 'Databases',
      },
      {
        id: 'c-f-db-2',
        moduleId: 'f-db',
        front: 'Roughly how much does one well-tuned relational instance give you?',
        back: 'Up to ~50k transactions/sec, sub-5 ms cached reads, a few [[TB]] of storage. Do not reach for sharding below that.',
        tag: 'Numbers',
      },
      {
        id: 'c-f-db-3',
        moduleId: 'f-db',
        front: 'What do indexes cost?',
        back: 'Storage, plus a slower write on every insert and update — the index has to be maintained too. Index the queries you actually run.',
        tag: 'Databases',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'f-storage',
    trackId: 'foundations',
    title: 'Where each kind of data lives',
    station: 5,
    prereqs: ['f-db'],
    minutes: 8,
    summary: 'Relational, NoSQL, blob, and the SQL-versus-NoSQL argument you should refuse to have.',
    lesson: [
      {
        kind: 'prose',
        text: 'Most systems use more than one store, each holding what it is good at. Knowing which is which is most of what "choosing a database" means in an interview.',
      },
      {
        kind: 'table',
        head: ['Store', 'Holds', 'Name'],
        rows: [
          ['**Relational**', 'Structured, related, transactional data. The default.', 'Postgres, MySQL'],
          ['**NoSQL**', 'Known access patterns, horizontal scale, flexible schema', 'DynamoDB, Cassandra, MongoDB'],
          ['**Blob**', 'Files — images, video, documents', '[[S3]], [[GCS]], Azure Blob'],
          ['**Search**', 'Full text, fuzzy matching, faceting', 'Elasticsearch'],
          ['**Cache**', 'Hot reads, sessions, computed aggregates', 'Redis, Memcached'],
        ],
      },
      { kind: 'heading', text: 'Blob storage and the rule that goes with it' },
      {
        kind: 'prose',
        text: 'Large files never live in a database. Cost alone settles it: S3 is around **$0.023 per [[GB]] per month** against DynamoDB at **$1.25** — a factor of fifty. The pattern is always the same: **bytes in the blob store, metadata and the pointer in the database**.',
      },
      {
        kind: 'callout',
        tone: 'say',
        title: 'Presigned URLs',
        text: 'File bytes should never pass through your application servers. The client asks your [[API]] for a presigned [[URL]] and uploads straight to S3; downloads work the same way through a [[CDN]]. Your servers handle kilobytes of metadata while gigabytes move around them.',
      },
      {
        kind: 'flow',
        nodes: ['Client', 'API: give me an upload URL', 'S3 (direct)', 'S3 event', 'Your service'],
        note: 'The upload path. The service learns the file arrived from a storage event, not by proxying it.',
      },
      { kind: 'heading', text: 'The access-pattern rule for NoSQL' },
      {
        kind: 'prose',
        text: 'In DynamoDB you choose a partition key and a sort key **from the queries you intend to run**. Partition by `userId` and "all posts by user X" is instant — while "all posts mentioning #hashtag" scans the entire table. There is no query planner to save you.',
      },
      {
        kind: 'prose',
        text: 'This is the real difference from relational, and it cuts both ways: you get predictable performance at any scale, and you get nothing for a query you did not design for.',
      },
      {
        kind: 'figure',
        caption: 'Storing the same gigabyte, priced two ways.',
        figure: {
          kind: 'ratio',
          parts: [
            { label: 'Blob storage — $0.023/GB/month', value: 23, tone: 'mastered' },
            { label: 'Key-value database — $1.25/GB/month', value: 1250, tone: 'alert' },
          ],
          note: 'Roughly a fiftyfold difference. Cost settles where the bytes go before throughput even enters the argument.',
        },
      },
      { kind: 'heading', text: 'The argument to refuse' },
      {
        kind: 'callout',
        tone: 'trap',
        title: 'A pothole, not a question',
        text: '"SQL versus NoSQL" as a set piece wastes minutes and usually ends in something wrong. Relational databases scale horizontally too. Both handle unstructured data. Never say "I need NoSQL because I need scale" — name the specific property you want: a known access pattern, a flexible schema, single-digit-millisecond reads at any size.',
      },
    ],
    quiz: [
      {
        id: 'q-f-storage-1',
        moduleId: 'f-storage',
        stem: 'Users upload 200 [[MB]] videos. Where do the bytes go and how do they get there?',
        options: [
          'Through your [[API]] server, which writes them to the database as a blob column',
          'Through your API server, which writes them to [[S3]]',
          'Direct from the client to S3 via a presigned [[URL]]; the database stores only metadata',
          'To a dedicated upload server that streams them into Postgres',
        ],
        correct: 2,
        explain:
          'Bytes in blob storage, metadata in the database, and the transfer goes direct via a presigned URL. Routing gigabytes through your application servers wastes bandwidth, memory, and request capacity for no benefit.',
      },
      {
        id: 'q-f-storage-2',
        moduleId: 'f-storage',
        stem: 'Your DynamoDB posts table is partitioned by userId. A product manager asks for "all posts containing #worldcup". What is true?',
        options: [
          'It works fine — DynamoDB indexes all fields automatically',
          'It requires a full table scan unless you add an index designed for that access pattern',
          'It is impossible in DynamoDB',
          'It works but only for the most recent 1000 posts',
        ],
        correct: 1,
        explain:
          '[[NoSQL]] performance comes from designing keys around known access patterns. A query that does not match them scans. The fix is a global secondary index — or a search index — built for that pattern.',
      },
      {
        id: 'q-f-storage-3',
        moduleId: 'f-storage',
        stem: 'An interviewer asks why you chose DynamoDB. Which answer is strongest?',
        options: [
          '"I need [[NoSQL]] because I need to handle scale."',
          '"[[SQL]] databases cannot handle this much traffic."',
          '"Our access patterns are fixed and key-based, and I want predictable single-digit-millisecond reads as the table grows."',
          '"It is what most large companies use."',
        ],
        correct: 2,
        explain:
          'Name the property you actually need. The vague scale answer is a known pothole — relational databases scale horizontally too, and the interviewer will ask you to defend a claim you cannot support.',
      },
    ],
    cards: [
      {
        id: 'c-f-storage-1',
        moduleId: 'f-storage',
        front: 'How do large files get in and out of a system?',
        back: 'Presigned URLs, direct between client and blob storage — never through your app servers. Metadata in the database, bytes in [[S3]], [[CDN]] with signed URLs on the way out.',
        tag: 'Storage',
      },
      {
        id: 'c-f-storage-2',
        moduleId: 'f-storage',
        front: 'Blob storage versus database, on cost.',
        back: '[[S3]] ≈ $0.023/[[GB]]/month against DynamoDB ≈ $1.25/GB/month — roughly fifty times. Cost alone decides where the bytes go.',
        tag: 'Numbers',
      },
      {
        id: 'c-f-storage-3',
        moduleId: 'f-storage',
        front: 'Why avoid the "[[SQL]] vs [[NoSQL]]" debate in an interview?',
        back: 'It is a pothole. Relational scales horizontally too and both handle unstructured data. Name the specific property you need instead of the category.',
        tag: 'Storage',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'f-cache',
    trackId: 'foundations',
    title: 'Caching, the first real lever',
    station: 6,
    prereqs: ['f-storage'],
    minutes: 8,
    summary: 'A 20–50× speedup, the pattern to default to, and the two failure modes that separate levels.',
    lesson: [
      {
        kind: 'prose',
        text: 'A Redis hit takes about **1 ms**. An uncached database query takes **20–50 ms**. That is a twenty-to-fifty times speedup on the read, and it takes that load off the database entirely — which is usually the more valuable half.',
      },
      { kind: 'heading', text: 'Cache-aside, the default' },
      {
        kind: 'list',
        ordered: true,
        items: [
          'Check the cache. If the value is there, return it.',
          'On a miss, query the database.',
          'Write the result into the cache with a [[TTL]].',
          'Return it.',
        ],
      },
      {
        kind: 'prose',
        text: 'Cache what is **read often and changes rarely**. A user profile, an event listing, a computed leaderboard. Not a value that changes on every write — you would spend more on invalidation than you save on reads.',
      },
      { kind: 'heading', text: 'Write strategies' },
      {
        kind: 'table',
        head: ['Strategy', 'How', 'Trade'],
        rows: [
          ['**Write-through**', 'Write cache and database together', 'Consistent; slower writes'],
          ['**Write-around**', 'Write the database, skip the cache', 'Less pollution; the next read is cold'],
          ['**Write-back**', 'Write cache now, database later', 'Fastest; you can lose data on a crash'],
        ],
      },
      {
        kind: 'figure',
        caption: 'A stampede: one key expires and every reader arrives at the database together.',
        figure: {
          kind: 'timeline',
          ticks: ['before expiry', 'expiry', 'after'],
          lanes: [
            {
              label: 'Cache',
              bars: [{ from: 0, to: 0.5, label: 'serving every read', tone: 'mastered' }],
              outcome: { label: 'key gone', tone: 'alert' },
            },
            {
              label: 'Database',
              bars: [
                { from: 0, to: 0.5, label: 'idle', tone: 'neutral' },
                { from: 0.5, to: 1, label: 'every request at once', tone: 'alert' },
              ],
              outcome: { label: 'saturated', tone: 'alert' },
            },
          ],
          note: 'Jittered expiry times spread the cliff; a lock lets one request rebuild while the rest wait on the old value.',
        },
      },
      { kind: 'heading', text: 'The two failure modes' },
      {
        kind: 'callout',
        tone: 'trap',
        title: 'Cache stampede',
        text: 'A popular key expires. Every concurrent request misses at the same instant and piles onto the database together — which is exactly when you could least afford it. Fix with a lock so one request repopulates, early recomputation before expiry, or jittered TTLs so keys do not expire in lockstep.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        title: 'The cache goes down',
        text: 'If Redis dies, 100% of traffic hits a database sized for 5%. Defend with a circuit breaker, a small in-process fallback cache, and graceful degradation — decide in advance what the system drops rather than falling over.',
      },
      {
        kind: 'prose',
        text: 'Being able to name both of these, unprompted, is a large part of what separates a senior answer from a competent one. Everyone can say "add a cache".',
      },
      { kind: 'heading', text: 'Say what you are storing' },
      {
        kind: 'callout',
        tone: 'say',
        text: '"A Redis sorted set keyed by event id, scored by reservation expiry" is a senior answer. "We will cache it" is not. Redis has real data structures — sorted sets, hashes, bitmaps, [[HyperLogLog]] — and naming the right one shows you have used it.',
      },
      {
        kind: 'prose',
        text: 'Eviction gets one word too: **[[LRU]]** by default, [[LFU]] when popularity is stable, [[FIFO]] almost never.',
      },
    ],
    quiz: [
      {
        id: 'q-f-cache-1',
        moduleId: 'f-cache',
        stem: 'A cached homepage feed expires at midnight. At 00:00:01 your database [[CPU]] spikes to 100%. What happened, and what fixes it?',
        options: [
          'Cache poisoning; validate writes',
          'A cache stampede — every request missed at once. Fix with a lock, early recompute, or jittered TTLs',
          'The cache ran out of memory; add capacity',
          'A thundering herd of reconnects; add a load balancer',
        ],
        correct: 1,
        explain:
          'One hot key expiring simultaneously for all readers sends every one of them to the database in the same instant. Jittering TTLs spreads the expiry; a lock lets one request repopulate while the rest wait on the old value.',
      },
      {
        id: 'q-f-cache-2',
        moduleId: 'f-cache',
        stem: 'Which data is the worst candidate for a cache?',
        options: [
          'A venue seat map that changes when the venue is reconfigured',
          "A user's follower count, updated on every new follow and read on every profile view",
          'The top 100 trending topics, recomputed every five minutes',
          'A product catalogue page updated weekly',
        ],
        correct: 1,
        explain:
          'Cache what is read often and changes rarely. A counter written as often as it is read means constant invalidation — you pay the cache cost without getting the benefit.',
      },
      {
        id: 'q-f-cache-3',
        moduleId: 'f-cache',
        stem: 'Redis becomes unavailable. What does a well-designed system do?',
        options: [
          'Fail every request until Redis returns — better than serving wrong data',
          'Send all traffic to the database and hope it holds',
          'Trip a circuit breaker, fall back to an in-process cache, and degrade gracefully on a pre-decided path',
          'Automatically promote a read replica to act as the cache',
        ],
        correct: 2,
        explain:
          'The database is sized for the miss rate, not for everything. You decide in advance what degrades — fewer results, staler data, some features off — rather than discovering it during the outage.',
      },
    ],
    cards: [
      {
        id: 'c-f-cache-1',
        moduleId: 'f-cache',
        front: 'Redis hit versus uncached database query.',
        back: '~1 ms against 20–50 ms — a 20–50× speedup on the read, plus the load it takes off the database.',
        tag: 'Numbers',
      },
      {
        id: 'c-f-cache-2',
        moduleId: 'f-cache',
        front: 'What is a cache stampede and how do you stop it?',
        back: 'A hot key expires and every concurrent request piles onto the database at once. Fix with a lock so one repopulates, early recomputation, or jittered TTLs.',
        tag: 'Caching',
      },
      {
        id: 'c-f-cache-3',
        moduleId: 'f-cache',
        front: 'Write-through, write-around, write-back.',
        back: 'Through: cache and store together — consistent, slower. Around: store only — less pollution, colder reads. Back: cache first, store async — fastest, can lose data.',
        tag: 'Caching',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'f-scale',
    trackId: 'foundations',
    title: 'Scaling 101',
    station: 7,
    prereqs: ['f-cache'],
    minutes: 8,
    summary: 'Vertical versus horizontal, read replicas, and the order to reach for things in.',
    lesson: [
      {
        kind: 'prose',
        text: 'There are only two ways to handle more load: get a bigger machine, or get more machines.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Vertical — a bigger box',
          points: [
            'No code changes at all',
            'Hardware runs out eventually',
            'Still one thing to lose',
          ],
        },
        right: {
          title: 'Horizontal — more boxes',
          points: [
            'Scales past any single machine',
            'Survives losing one',
            'Needs stateless servers and a load balancer',
          ],
        },
        verdict: 'Vertical first — it is genuinely cheaper until it is not. Horizontal is the answer whenever redundancy matters, which is most of the time.',
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'Modern hardware is bigger than people assume. A standard application server handles 100k+ concurrent connections with 8–64 cores and 64–512 [[GB]] of [[RAM]]. Reaching for a distributed anything at a few thousand requests per second is a common over-correction.',
      },
      { kind: 'heading', text: 'Reads and writes scale differently' },
      {
        kind: 'prose',
        text: 'Consumer products typically run around **100 reads per write**. That ratio decides where the work goes: design the read path first, and treat write scaling as a separate, later problem.',
      },
      {
        kind: 'prose',
        text: 'Read replicas are the cheapest large win. Writes go to the primary; reads spread across copies. The cost is **replication lag** — a replica is milliseconds to seconds behind, so a user who writes then immediately reads may not see their own change. The usual fix is to route read-after-write to the primary for that user.',
      },
      {
        kind: 'figure',
        caption: 'The order to reach for scaling levers — cheapest and least invasive first.',
        figure: {
          kind: 'stack',
          layers: [
            { label: '1 · Index the query', sub: 'free, and often the whole problem', tone: 'mastered' },
            { label: '2 · Cache what is hot', sub: '20–50× on the read path', tone: 'mastered' },
            { label: '3 · Read replicas', sub: 'costs you replication lag', tone: 'line' },
            { label: '4 · CDN at the edge', sub: 'static and unpersonalised only', tone: 'line' },
            { label: '5 · Denormalise the hot path', sub: 'now every copy can drift', tone: 'streak' },
            { label: '6 · Shard', sub: 'last — and only when the numbers demand it', tone: 'alert' },
          ],
          note: 'Most candidates who lose the room start at step six.',
        },
      },
      { kind: 'heading', text: 'The order to reach for things' },
      {
        kind: 'list',
        ordered: true,
        items: [
          '**Index** the query. Free, and often the whole problem.',
          '**Cache** what is hot. 20–50× on the read path.',
          '**Read replicas** to spread read load.',
          '**[[CDN]]** for anything static or geographically spread.',
          '**Denormalise** the specific hot path that is still slow.',
          '**Shard** — last, and only when the numbers demand it.',
        ],
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Starting at step six. Sharding on the first slide is the most common way a strong candidate produces a design they cannot defend — and it eats the clock you needed for the deep dives that actually score.',
      },
      { kind: 'heading', text: 'Scale triggers worth memorising' },
      {
        kind: 'table',
        head: ['Component', 'One gives you', 'Scale when'],
        rows: [
          ['Cache', '~1 ms, 100k+ ops/sec, up to ~1 [[TB]]', 'hit rate < 80%, memory > 80%'],
          ['Database', '~50k txn/sec, 64 [[TiB]]+', 'writes > 10k [[TPS]], uncached reads > 5 ms'],
          ['App server', '100k+ connections, 64–512 GB RAM', '[[CPU]] > 70%, latency past [[SLA]]'],
          ['Queue', '~1M msgs/sec per broker', 'nearing 800k msgs/sec, consumer lag growing'],
        ],
      },
    ],
    quiz: [
      {
        id: 'q-f-scale-1',
        moduleId: 'f-scale',
        stem: 'A user updates their profile, is redirected, and sees the old name. Most likely cause?',
        options: [
          'The cache was not invalidated',
          'Replication lag — the read went to a replica that had not caught up',
          'The write failed silently',
          'The load balancer sent them to the wrong server',
        ],
        correct: 1,
        explain:
          'Classic read-after-write across replicas. The write hit the primary; the read hit a replica milliseconds behind. The usual fix is to route that user\'s reads to the primary for a short window.',
      },
      {
        id: 'q-f-scale-2',
        moduleId: 'f-scale',
        stem: 'A read-heavy product is slow. Which order do you work through?',
        options: [
          'Shard the database, then add caching if still needed',
          'Rewrite in a faster language, then add servers',
          'Index, cache, read replicas, [[CDN]], denormalise, and only then shard',
          'Add application servers until the latency comes down',
        ],
        correct: 2,
        explain:
          'Cheapest and least invasive first. Adding app servers does nothing if the bottleneck is the database, and sharding first commits you to cross-shard pain you have not earned.',
      },
      {
        id: 'q-f-scale-3',
        moduleId: 'f-scale',
        stem: 'What is the typical read-to-write ratio for a consumer product, and why does it matter?',
        options: [
          '1:1 — design both paths equally',
          'About 100:1 reads to writes, so design the read path first',
          'About 100:1 writes to reads, so optimise ingestion',
          'It varies too much to be useful',
        ],
        correct: 1,
        explain:
          'Roughly 100:1. Reads dominate, so replicas, caches and CDNs earn their keep long before write sharding becomes relevant.',
      },
    ],
    cards: [
      {
        id: 'c-f-scale-1',
        moduleId: 'f-scale',
        front: 'The order to reach for scaling techniques.',
        back: 'Index → cache → read replicas → [[CDN]] → denormalise the hot path → shard. Sharding is last, and only when the numbers demand it.',
        tag: 'Scaling',
      },
      {
        id: 'c-f-scale-2',
        moduleId: 'f-scale',
        front: 'What does adding read replicas cost you?',
        back: 'Replication lag. A replica is milliseconds to seconds behind, so read-after-write can show stale data — route that user to the primary briefly.',
        tag: 'Scaling',
      },
      {
        id: 'c-f-scale-3',
        moduleId: 'f-scale',
        front: 'Vertical or horizontal scaling first?',
        back: 'Vertical — genuinely cheaper until it is not, and modern boxes are large. Horizontal whenever you need redundancy, which is most real systems.',
        tag: 'Scaling',
      },
    ],
  },
]
