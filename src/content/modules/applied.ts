import type { Module } from '../types'

/**
 * Track 3 — Applied patterns.
 *
 * Eight shapes. Almost every question is two or three of them wearing a product's
 * clothes, so each module is a recipe: the tell, the ladder, and the failure everyone
 * forgets.
 */

export const appliedModules: Module[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'a-realtime',
    trackId: 'applied',
    title: 'Pushing real-time updates',
    station: 1,
    prereqs: ['c-search'],
    minutes: 8,
    summary: 'Tell: "live", "as it happens". Pick the cheapest transport that works, then solve fan-out.',
    lesson: [
      {
        kind: 'prose',
        text: 'Something changes on the server and a user needs to see it without asking. Two decisions: the transport, and how an update finds the servers holding the right connections.',
      },
      { kind: 'heading', text: 'The transport ladder' },
      {
        kind: 'ladder',
        rungs: [
          {
            grade: 'bad',
            title: 'Polling every second',
            text: 'Simple, and mostly empty responses. At 100k users that is 100k requests per second to learn that nothing changed.',
          },
          {
            grade: 'good',
            title: 'Long polling',
            text: 'The server holds the request until there is something to say. Far fewer wasted round trips, but you hold a connection per client anyway — at which point SSE does the same job more cleanly.',
          },
          {
            grade: 'great',
            title: 'Server-Sent Events',
            text: 'One HTTP request, server pushes indefinitely, automatic reconnect built into the browser. Covers most "live" features. Client-to-server still goes over ordinary requests, which is usually all you need.',
          },
          {
            grade: 'best',
            title: 'WebSocket — when the client genuinely pushes',
            text: 'Chat, collaborative editing, multiplayer. Costs you L4 load balancing, connection state to manage, and reconnection logic you write yourself. Worth it only when both directions are hot.',
          },
        ],
      },
      { kind: 'heading', text: 'The harder half: fan-out' },
      {
        kind: 'prose',
        text: 'Connections are spread across many servers. When an event fires, the server that produced it usually is not the one holding the interested connections. Two answers:',
      },
      {
        kind: 'compare',
        left: {
          title: 'Pub/sub',
          points: [
            'Publish to a topic; every server subscribes',
            'Servers stay stateless and interchangeable',
            'Every server sees every message for its topics',
          ],
        },
        right: {
          title: 'Consistent-hash ring',
          points: [
            'A given room or user always maps to one server',
            'That server holds real per-connection state',
            'Rebalancing on deploy or failure is the hard part',
          ],
        },
        verdict: 'Pub/sub by default. The ring when there is genuine per-connection work — presence, operational transforms, game state.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Forgetting what happens when the connection drops. Mobile clients lose connectivity constantly. The client needs a last-seen cursor so it can ask "what did I miss" on reconnect — otherwise a user in a lift silently loses messages, and no amount of WebSocket sophistication saves you.',
      },
    ],
    quiz: [
      {
        id: 'q-a-realtime-1',
        moduleId: 'a-realtime',
        stem: 'A live comments feed pushes new comments to viewers. Viewers post through a normal POST. What transport?',
        options: [
          'WebSocket — it is a real-time feature',
          'SSE — the push is one-directional and posting is an ordinary request',
          'Polling every 2 seconds',
          'gRPC streaming',
        ],
        correct: 1,
        explain:
          'The push is one-directional; posts go over regular HTTP. SSE covers it with automatic reconnect and no L4 balancing requirement. WebSocket buys bidirectionality you are not using.',
      },
      {
        id: 'q-a-realtime-2',
        moduleId: 'a-realtime',
        stem: 'A user on a train loses connectivity for 40 seconds. What must your design include?',
        options: [
          'A longer WebSocket timeout',
          'A last-seen cursor so the client can fetch what it missed on reconnect',
          'Automatic retry of the failed connection',
          'A message queue in front of the connection',
        ],
        correct: 1,
        explain:
          'Reconnecting is not enough — the messages sent during the gap are gone. The client needs to say where it got to, and the server needs to be able to answer from durable storage.',
      },
    ],
    cards: [
      {
        id: 'c-a-realtime-1',
        moduleId: 'a-realtime',
        front: 'The real-time transport ladder.',
        back: 'Polling → long polling → SSE (server push, plain HTTP, auto-reconnect) → WebSocket (only when the client pushes too, and it costs L4 balancing plus connection state).',
        tag: 'Real-time',
      },
      {
        id: 'c-a-realtime-2',
        moduleId: 'a-realtime',
        front: 'The thing everyone forgets about real-time.',
        back: 'Reconnection. Mobile clients drop constantly — without a last-seen cursor to fetch the gap, users silently lose messages.',
        tag: 'Real-time',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'a-longrunning',
    trackId: 'applied',
    title: 'Managing long-running tasks',
    station: 2,
    prereqs: ['a-realtime'],
    minutes: 7,
    summary: 'Tell: "encode", "process", "generate". Acknowledge fast, work asynchronously, expose status.',
    lesson: [
      {
        kind: 'prose',
        text: 'Anything past a few seconds cannot happen inside the request. Video encoding, report generation, bulk imports, model inference. The shape is always the same.',
      },
      {
        kind: 'flow',
        nodes: ['Client', 'API: validate + 202 Accepted', 'Queue', 'Worker pool', 'Result store'],
        note: 'The API returns a job id immediately. Everything real happens behind the queue.',
      },
      {
        kind: 'list',
        ordered: true,
        items: [
          '**Validate synchronously.** Reject bad input now, while you can still return a useful error.',
          '**Enqueue and acknowledge.** Return `202` with a job id in milliseconds.',
          '**Workers pull.** Scale them independently of your API tier.',
          '**Write status as you go.** `queued` → `running` → `done` / `failed`, with progress if the job is long.',
          '**Tell the client.** Polling on `GET /jobs/{id}` is fine and simple; SSE or a webhook if it needs to feel live.',
        ],
      },
      { kind: 'heading', text: 'What makes it production-shaped' },
      {
        kind: 'table',
        head: ['Concern', 'Answer'],
        rows: [
          ['Worker dies mid-job', 'Visibility timeout returns the message; another worker picks it up'],
          ['Job runs twice', '**Idempotency** — key the output by job id so a repeat overwrites rather than duplicates'],
          ['Job fails repeatedly', 'Capped retries with backoff, then a **dead-letter queue** and an alert'],
          ['One job is enormous', 'Split into chunks so progress is visible and a failure retries a chunk, not the whole thing'],
          ['Queue backs up', 'Autoscale workers on queue depth, not CPU'],
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Autoscaling on queue depth rather than CPU is a small detail that reads as having operated one of these. CPU is a lagging signal; queue depth tells you about work that has already arrived and is waiting.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Returning 200 with a fake result, or holding the HTTP connection open for two minutes. Load balancers and browsers will time it out, and the user gets an error for a job that actually succeeded.',
      },
    ],
    quiz: [
      {
        id: 'q-a-longrunning-1',
        moduleId: 'a-longrunning',
        stem: 'What should a video upload endpoint return?',
        options: [
          '200 with the encoded video URL, once encoding finishes',
          '202 with a job id, immediately after validating and enqueueing',
          '204 with no body',
          '200 with a placeholder URL that will work later',
        ],
        correct: 1,
        explain:
          'Encoding takes minutes; holding the connection guarantees a timeout somewhere in the chain. Acknowledge with a job id the client can poll or subscribe to.',
      },
      {
        id: 'q-a-longrunning-2',
        moduleId: 'a-longrunning',
        stem: 'What signal should worker autoscaling use?',
        options: [
          'Worker CPU utilisation',
          'Queue depth — work that has already arrived and is waiting',
          'Requests per second on the API tier',
          'Time of day',
        ],
        correct: 1,
        explain:
          'CPU lags: it only rises once workers are already saturated. Queue depth measures the backlog directly, which is what you actually want to clear.',
      },
      {
        id: 'q-a-longrunning-3',
        moduleId: 'a-longrunning',
        stem: 'A worker crashes halfway through a job. What happens in a well-designed system?',
        options: [
          'The job is lost and the user must resubmit',
          'The visibility timeout expires, another worker picks it up, and idempotency keeps the output correct',
          'The queue detects the crash and marks the job failed',
          'The API retries the original request',
        ],
        correct: 1,
        explain:
          'An unacknowledged message becomes visible again and is redelivered. That makes redelivery normal, which is exactly why the handler has to be idempotent.',
      },
    ],
    cards: [
      {
        id: 'c-a-longrunning-1',
        moduleId: 'a-longrunning',
        front: 'The long-running task shape.',
        back: 'Validate synchronously → enqueue → return 202 with a job id → workers pull → write status → client polls or subscribes. Retries with backoff, DLQ for the failures.',
        tag: 'Async',
      },
      {
        id: 'c-a-longrunning-2',
        moduleId: 'a-longrunning',
        front: 'What should worker autoscaling key off?',
        back: 'Queue depth, not CPU. CPU is a lagging signal; depth measures the backlog you actually need to clear.',
        tag: 'Async',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'a-contention',
    trackId: 'applied',
    title: 'Dealing with contention',
    station: 3,
    prereqs: ['a-longrunning'],
    minutes: 9,
    summary: 'Tell: "book", "reserve", "bid", "limited". The highest-value deep dive in the catalogue.',
    lesson: [
      {
        kind: 'prose',
        text: 'Two people want the last seat. This is the pattern most likely to decide a senior interview, because it is where "it works" and "it is correct" come apart.',
      },
      { kind: 'heading', text: 'Why the obvious answer fails' },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Holding `SELECT … FOR UPDATE` for the duration of a checkout. A reservation lasts five to ten minutes; a database lock held that long means contention, deadlocks, exhausted connections, and no clean recovery if the process dies still holding it.',
      },
      {
        kind: 'prose',
        text: 'The insight: a **reservation is not a transaction**. It is a business-level hold with a deadline, and it needs to survive a crashed client without a human unblocking it.',
      },
      { kind: 'heading', text: 'The ladder' },
      {
        kind: 'ladder',
        rungs: [
          {
            grade: 'bad',
            title: 'Long-held database lock',
            text: 'Correct in theory, unworkable in practice at any real concurrency.',
          },
          {
            grade: 'good',
            title: 'Status column plus expiry, swept by cron',
            text: '`status` and `expires_at` on the row; a cron resets expired holds. Works, but there is lag between expiry and the sweep, and if the cron dies inventory silently freezes.',
          },
          {
            grade: 'great',
            title: 'Implicit status — one short transaction',
            text: 'Treat available as *available OR (reserved AND expired)*, and claim it in a single short transaction. No cron, no lag, correctness enforced by the database. Costs slightly slower reads and a less readable table.',
          },
          {
            grade: 'best',
            title: 'Distributed lock with a TTL',
            text: '`SET seat:123 user:9 NX EX 600` — atomic, fast under heavy concurrency, and expiry is automatic because the TTL is doing the work. The row only ever holds *available* or *booked*.',
          },
        ],
      },
      { kind: 'heading', text: 'The three follow-ups' },
      {
        kind: 'prose',
        text: 'Picking the lock is the easy half. What separates levels is answering these before being asked.',
      },
      {
        kind: 'list',
        items: [
          '**The read path.** The seat map must show held seats as unavailable, and the holds live in Redis, not the database. A sorted set scored by expiry answers it — count only members whose score is in the future, and trim stale ones lazily with `ZREMRANGEBYSCORE`.',
          '**Redis dies.** You degrade rather than break: database-level optimistic concurrency still prevents double-booking. A user may lose a race *after* paying, which you resolve with an automatic refund. Better than every seat appearing unavailable.',
          '**The TTL expires mid-payment.** The write fails on the optimistic check, so you refund automatically — and you extend the lock when payment begins so it rarely happens.',
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Optimistic concurrency is the safety net underneath whatever else you build: the final write is conditional on the row still being in the state you read. Even if every lock fails, you cannot sell the same seat twice.',
      },
    ],
    quiz: [
      {
        id: 'q-a-contention-1',
        moduleId: 'a-contention',
        stem: 'Why not hold a database row lock for a 10-minute checkout?',
        options: [
          'Databases cannot hold locks that long',
          'Contention, deadlocks, exhausted connections, and no clean recovery if the process dies holding it',
          'It would be too slow to acquire',
          'Row locks do not prevent concurrent writes',
        ],
        correct: 1,
        explain:
          'A transaction is the wrong tool for a business-level hold with a deadline. The reservation must survive a crashed client without a human intervening.',
      },
      {
        id: 'q-a-contention-2',
        moduleId: 'a-contention',
        stem: 'Reservations live in Redis. Redis goes down. What happens to correctness?',
        options: [
          'Double-booking becomes possible until Redis returns',
          'All seats appear unavailable and booking stops',
          'Correctness holds — optimistic concurrency on the database write still prevents double-booking; the experience degrades',
          'The system fails over to a database lock automatically',
        ],
        correct: 2,
        explain:
          'The lock is an optimisation for user experience. The conditional write is the correctness boundary. Users may lose a race after paying, which you handle with an automatic refund.',
      },
      {
        id: 'q-a-contention-3',
        moduleId: 'a-contention',
        stem: 'With reservations in Redis, how does the seat map show held seats?',
        options: [
          'Query the database status column',
          'A Redis sorted set scored by expiry — count members whose score is in the future',
          'Recalculate from the booking service on every request',
          'It cannot; held seats appear available',
        ],
        correct: 1,
        explain:
          'Moving holds out of the database creates a read-path problem you have to solve. A sorted set scored by expiry answers it in one call and self-cleans lazily.',
      },
    ],
    cards: [
      {
        id: 'c-a-contention-1',
        moduleId: 'a-contention',
        front: 'The distributed lock, precisely.',
        back: '`SET key value NX EX 600` — atomic set-if-absent with a TTL, so a crashed holder cannot wedge the resource. The TTL is the whole point.',
        tag: 'Contention',
      },
      {
        id: 'c-a-contention-2',
        moduleId: 'a-contention',
        front: 'What is the correctness boundary in a reservation system?',
        back: 'Optimistic concurrency on the final write — conditional on the row still being in the state you read. The lock is a UX optimisation on top.',
        tag: 'Contention',
      },
      {
        id: 'c-a-contention-3',
        moduleId: 'a-contention',
        front: 'The three follow-ups after choosing a Redis lock.',
        back: 'The read path (seat map from a sorted set scored by expiry) · Redis dying (degrade, OCC still holds) · TTL expiring mid-payment (auto-refund, extend on payment start).',
        tag: 'Contention',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'a-reads',
    trackId: 'applied',
    title: 'Scaling reads',
    station: 4,
    prereqs: ['a-contention'],
    minutes: 7,
    summary: 'Tell: a feed, a profile, 100:1. Cheap levers first, then own the costs you created.',
    lesson: [
      {
        kind: 'prose',
        text: 'Reads are the first bottleneck in almost every consumer product, and the levers are ordered by cost. Work down the list; stop when the numbers say you can.',
      },
      {
        kind: 'list',
        ordered: true,
        items: [
          '**Index the query.** Free, and often the whole problem.',
          '**Denormalise the hot path.** One lookup instead of a join.',
          '**Read replicas.** Spread read load; writes stay on the primary.',
          '**Cache.** 20–50× on the hits.',
          '**CDN.** Anything static or unpersonalised, served from the edge.',
        ],
      },
      { kind: 'heading', text: 'The two costs you just created' },
      {
        kind: 'prose',
        text: 'Every one of those levers trades correctness-in-time for speed. Naming both costs unprompted is the difference between reciting the list and understanding it.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Replication lag',
          points: [
            'A replica is ms to seconds behind',
            'Read-after-write shows stale data to the person who just wrote',
            'Fix: route that user to the primary for a short window',
          ],
        },
        right: {
          title: 'Cache invalidation',
          points: [
            'The cache does not know the database changed',
            'Stale reads until TTL or explicit purge',
            'Fix: invalidate on write, short TTL, or make the data immutable',
          ],
        },
      },
      { kind: 'heading', text: 'Precomputation' },
      {
        kind: 'prose',
        text: 'When a read is expensive because it *assembles* something — a feed, a leaderboard, a dashboard — the answer is often to compute it on write instead. You move work from the frequent path to the rare one, which at 100:1 is a very good trade. The cost lands on the write side: one post now means many writes.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Say the ratio out loud before you choose. At 100:1 precomputation is obviously right. At 2:1 it is obviously wrong. The number decides, and showing that you know which number decides is the point.',
      },
    ],
    quiz: [
      {
        id: 'q-a-reads-1',
        moduleId: 'a-reads',
        stem: 'Which two costs must you name after adding replicas and a cache?',
        options: [
          'Storage cost and network cost',
          'Replication lag and cache invalidation',
          'Write amplification and index bloat',
          'Connection limits and memory pressure',
        ],
        correct: 1,
        explain:
          'Both trade correctness-in-time for speed. Naming them unprompted is what separates reciting the list from understanding what you just bought.',
      },
      {
        id: 'q-a-reads-2',
        moduleId: 'a-reads',
        stem: 'When is precomputing a feed on write the wrong choice?',
        options: [
          'When reads outnumber writes 100:1',
          'When the read/write ratio is close to 1:1, or writers have enormous fan-out',
          'When the feed is displayed on mobile',
          'It is never wrong; precomputation always wins',
        ],
        correct: 1,
        explain:
          'Precomputation moves work from reads to writes. That is a great trade at 100:1 and a bad one near 1:1 — and it breaks down entirely when one write fans out to millions of feeds.',
      },
    ],
    cards: [
      {
        id: 'c-a-reads-1',
        moduleId: 'a-reads',
        front: 'The read-scaling ladder, in order.',
        back: 'Index → denormalise the hot path → read replicas → cache → CDN. Then own the two costs: replication lag and cache invalidation.',
        tag: 'Scaling',
      },
      {
        id: 'c-a-reads-2',
        moduleId: 'a-reads',
        front: 'When does precomputing on write win?',
        back: 'When reads massively outnumber writes. It moves work from the frequent path to the rare one — a great trade at 100:1, a bad one near 1:1.',
        tag: 'Scaling',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'a-writes',
    trackId: 'applied',
    title: 'Scaling writes',
    station: 5,
    prereqs: ['a-reads'],
    minutes: 7,
    summary: 'Tell: events, clicks, metrics, millions per second. Batch, partition, and shed.',
    lesson: [
      {
        kind: 'prose',
        text: 'Writes cannot be cached away. When volume genuinely exceeds what one primary handles, there are four levers and they compose.',
      },
      {
        kind: 'table',
        head: ['Lever', 'What it does', 'Cost'],
        rows: [
          ['**Batch**', 'One write of 1000 rows instead of 1000 writes', 'Latency until the batch flushes; a crash loses the buffer'],
          ['**Partition**', 'Spread across shards on a well-chosen key', 'Cross-partition queries and transactions'],
          ['**Queue in front**', 'Absorb bursts, smooth the write rate', 'Eventual consistency, and a backlog to monitor'],
          ['**Aggregate early**', 'Write the rollup, not every event', 'Raw detail is gone unless you keep it elsewhere'],
        ],
      },
      {
        kind: 'prose',
        text: 'Batching is the one people underuse. Per-write overhead — a round trip, a transaction, an index update — dominates at high volume, so amortising it across a thousand rows often buys more than sharding does, at a fraction of the complexity.',
      },
      { kind: 'heading', text: 'Picking a partition key that does not betray you' },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Partitioning by timestamp for a write-heavy stream. Every write goes to *now*, so every write goes to one partition — you have built a hot spot on purpose. Something high-cardinality and uncorrelated with time is what you want.',
      },
      { kind: 'heading', text: 'Shedding' },
      {
        kind: 'prose',
        text: 'At some point the honest answer is to accept less. Sampling analytics events, dropping low-value telemetry, or rejecting with a `429` and a `Retry-After` all keep the system standing. Saying which data you are willing to lose, in advance, is a design decision — discovering it during an incident is not.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: '"Ad click events are sampled at 1-in-10 above 500k events/sec, and the sample rate is recorded with the data so downstream aggregates stay correct." That is a designed answer. "We scale horizontally" is not.',
      },
    ],
    quiz: [
      {
        id: 'q-a-writes-1',
        moduleId: 'a-writes',
        stem: 'You partition a high-volume event stream by timestamp. What have you built?',
        options: [
          'An efficient time-range query system',
          'A hot spot — every write goes to the current time partition',
          'A naturally balanced distribution',
          'A system that cannot be queried by time',
        ],
        correct: 1,
        explain:
          'All writes target *now*, so one partition takes everything while the rest hold history. Partition keys for write-heavy data need high cardinality and no correlation with time.',
      },
      {
        id: 'q-a-writes-2',
        moduleId: 'a-writes',
        stem: 'Which lever most often gives the biggest win for the least complexity at high write volume?',
        options: [
          'Sharding across more primaries',
          'Batching, to amortise per-write overhead',
          'Adding read replicas',
          'Switching database engines',
        ],
        correct: 1,
        explain:
          'Per-write overhead dominates at volume. Amortising a round trip, transaction and index update across a thousand rows often beats sharding, without the cross-shard cost.',
      },
    ],
    cards: [
      {
        id: 'c-a-writes-1',
        moduleId: 'a-writes',
        front: 'The four write-scaling levers.',
        back: 'Batch (amortise per-write overhead) · partition (spread on a good key) · queue in front (absorb bursts) · aggregate early (write rollups, not events).',
        tag: 'Scaling',
      },
      {
        id: 'c-a-writes-2',
        moduleId: 'a-writes',
        front: 'Why is timestamp a bad partition key for write-heavy data?',
        back: 'Every write targets *now*, so one partition takes all the load. You want high cardinality, uncorrelated with time.',
        tag: 'Scaling',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'a-blobs',
    trackId: 'applied',
    title: 'Handling large blobs',
    station: 6,
    prereqs: ['a-writes'],
    minutes: 6,
    summary: 'Tell: video, images, file sync. Bytes never touch your servers.',
    lesson: [
      {
        kind: 'prose',
        text: 'The whole pattern is one rule: **gigabytes must not pass through your application servers**. Everything else follows.',
      },
      {
        kind: 'flow',
        nodes: ['Client', 'API: presigned URL', 'S3 direct upload', 'S3 event', 'Worker', 'Metadata DB'],
        note: 'Your servers handle kilobytes of metadata while gigabytes move around them.',
      },
      { kind: 'heading', text: 'Upload' },
      {
        kind: 'list',
        ordered: true,
        items: [
          'Client asks your API for an upload URL. You authorise, record intent, return a **presigned URL** scoped to one key with a short expiry.',
          'Client uploads straight to blob storage. Large files use **multipart** — chunks upload in parallel, and a failed chunk retries alone rather than restarting the file.',
          'Storage emits an event on completion. A worker validates, transcodes, and marks the metadata row ready.',
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Resumability matters more on mobile than anywhere else. Multipart with per-chunk retry means a 2 GB upload survives a tunnel, and the client can show real progress instead of a spinner.',
      },
      { kind: 'heading', text: 'Download' },
      {
        kind: 'prose',
        text: 'CDN in front, with **signed URLs** when content is private — a short-lived signature keeps the edge cacheable while still enforcing access. Public content just caches.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Marking the file ready when the API returns the presigned URL. The upload has not happened yet — it may never happen. The storage event is the only trustworthy completion signal.',
      },
    ],
    quiz: [
      {
        id: 'q-a-blobs-1',
        moduleId: 'a-blobs',
        stem: 'When is an uploaded file safe to mark as ready?',
        options: [
          'When the API issues the presigned URL',
          'When the client reports the upload finished',
          'When the storage service emits a completion event',
          'After a fixed delay following the URL request',
        ],
        correct: 2,
        explain:
          'The presigned URL is only permission to upload. A client can vanish mid-transfer or lie. The storage event is the only signal that the bytes actually landed.',
      },
      {
        id: 'q-a-blobs-2',
        moduleId: 'a-blobs',
        stem: 'Why does multipart upload matter especially on mobile?',
        options: [
          'It compresses the file',
          'A failed chunk retries alone instead of restarting the whole file, and progress is real',
          'It encrypts each part separately',
          'It reduces storage cost',
        ],
        correct: 1,
        explain:
          'Mobile connections drop. Restarting a 2 GB upload from zero on a dropped connection is the difference between a feature that works and one people give up on.',
      },
    ],
    cards: [
      {
        id: 'c-a-blobs-1',
        moduleId: 'a-blobs',
        front: 'The large-blob rule and its consequences.',
        back: 'Bytes never pass through your app servers. Presigned URL direct to storage, multipart for size and resumability, storage event as the completion signal, CDN with signed URLs on the way out.',
        tag: 'Blobs',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'a-multistep',
    trackId: 'applied',
    title: 'Multi-step processes',
    station: 7,
    prereqs: ['a-blobs'],
    minutes: 7,
    summary: 'Tell: "order", "payment", "onboarding". Steps that must survive failure halfway through.',
    lesson: [
      {
        kind: 'prose',
        text: 'Charge the card, reserve the stock, notify the warehouse, email the customer. Four steps, four things that can fail, and no distributed transaction to wrap them in.',
      },
      { kind: 'heading', text: 'The saga' },
      {
        kind: 'prose',
        text: 'Each step commits locally and emits an event that triggers the next. If a step fails, you run **compensating actions** to undo the completed ones — you cannot roll back a captured payment, but you can refund it.',
      },
      {
        kind: 'flow',
        nodes: ['Order created', 'Payment captured', 'Stock reserved', 'Warehouse notified', 'Confirmed'],
        note: 'Failure at any step triggers compensation backwards: release stock, then refund.',
      },
      {
        kind: 'prose',
        text: 'Two shapes. **Choreography** — each service listens for the previous event. Less coupling, but no single place shows you where an order actually is. **Orchestration** — a coordinator drives the sequence. Easier to reason about and to debug, at the cost of a component that knows the whole flow.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Orchestration for anything with money in it. When a customer calls asking where their order is, "let me check the orchestrator" beats reconstructing the state from six services\' logs.',
      },
      { kind: 'heading', text: 'What makes it survive' },
      {
        kind: 'list',
        items: [
          '**Persist state between steps.** In-memory workflow state dies with the process.',
          '**Idempotency keys everywhere.** Every step will be retried; a retried charge must not charge twice.',
          '**Make compensations idempotent too.** They get retried as well, and a double refund is its own incident.',
          '**Timeouts per step**, with an explicit decision about what happens on expiry.',
        ],
      },
      {
        kind: 'prose',
        text: 'Naming **Temporal** or **AWS Step Functions** is worth a sentence: they give you durable execution, retries, and visibility, so you are not rebuilding a workflow engine inside your order service. Say what they buy you, not just the name.',
      },
    ],
    quiz: [
      {
        id: 'q-a-multistep-1',
        moduleId: 'a-multistep',
        stem: 'Payment succeeds but stock reservation fails. What does a saga do?',
        options: [
          'Roll back the distributed transaction',
          'Run a compensating action — refund the payment',
          'Retry stock reservation forever until it succeeds',
          'Leave the order pending for manual resolution',
        ],
        correct: 1,
        explain:
          'There is no distributed transaction to roll back — the payment is captured. Sagas undo forward with compensating actions, and the compensation must itself be idempotent.',
      },
      {
        id: 'q-a-multistep-2',
        moduleId: 'a-multistep',
        stem: 'Why prefer orchestration over choreography for a payment flow?',
        options: [
          'It is faster',
          'It couples services more tightly, which is desirable',
          'One place holds and shows the state of every in-flight order, which matters for debugging and support',
          'Choreography cannot handle compensation',
        ],
        correct: 2,
        explain:
          'Choreography scatters the flow across services, so nothing can answer "where is order 4471". With money involved, that visibility is worth the coordinator.',
      },
    ],
    cards: [
      {
        id: 'c-a-multistep-1',
        moduleId: 'a-multistep',
        front: 'What is a saga?',
        back: 'Each step commits locally and emits an event triggering the next; failure runs compensating actions to undo completed steps. You cannot roll back a captured payment, but you can refund it.',
        tag: 'Workflows',
      },
      {
        id: 'c-a-multistep-2',
        moduleId: 'a-multistep',
        front: 'Choreography or orchestration?',
        back: 'Choreography: services react to events, less coupling, no single view of state. Orchestration: a coordinator drives it, easier to debug. Orchestration for anything with money in it.',
        tag: 'Workflows',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'a-proximity',
    trackId: 'applied',
    title: 'Proximity search',
    station: 8,
    prereqs: ['a-multistep'],
    minutes: 6,
    summary: 'Tell: "near me", "within 5 km", a map. Often simpler than candidates make it.',
    lesson: [
      {
        kind: 'prose',
        text: '"Find drivers within 2 km" is a range query in two dimensions, which ordinary indexes cannot serve — a B-tree on latitude and another on longitude gives you a bounding box at best, and a lot of wasted rows.',
      },
      { kind: 'heading', text: 'How the index works' },
      {
        kind: 'prose',
        text: 'Every approach reduces two dimensions to one so it can be indexed and range-scanned. **Geohashing** interleaves latitude and longitude bits into a string, so a shared prefix means physical proximity. **Quadtrees** and **S2 cells** subdivide space adaptively, which handles dense cities better than a uniform grid.',
      },
      {
        kind: 'code',
        code: `geohash("u10hfr2c")   -- London
geohash("u10hfr2f")   -- ~150 m away, shares 7 chars

-- "nearby" becomes a prefix scan, which any B-tree can do`,
      },
      {
        kind: 'prose',
        text: 'The edge case worth knowing: two points either side of a cell boundary can be metres apart with completely different hashes. Real implementations query the neighbouring cells too, then filter by true distance.',
      },
      { kind: 'heading', text: 'Do you need it?' },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Reaching for a geospatial system at small scale. Below a few hundred thousand entities, a bounding-box query on indexed lat/long columns is genuinely fine. Saying "this does not need a geospatial index yet, and here is the number where it would" is a stronger answer than naming the fanciest option.',
      },
      {
        kind: 'table',
        head: ['Option', 'When'],
        rows: [
          ['Bounding box on indexed columns', 'Up to ~100k entities, low query rate'],
          ['**PostGIS**', 'You already run Postgres and want real geospatial operators'],
          ['**Redis geo commands**', 'Positions change constantly — live driver locations'],
          ['**Elasticsearch geo queries**', 'Proximity combined with text and filters — "pizza near me, open now, 4+ stars"'],
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Moving entities and static entities are different problems. A restaurant is written once and read constantly — index it anywhere. A driver moves every few seconds, so the write rate dominates and Redis, holding positions in memory, is the natural fit.',
      },
    ],
    quiz: [
      {
        id: 'q-a-proximity-1',
        moduleId: 'a-proximity',
        stem: 'What does geohashing actually do?',
        options: [
          'Compresses coordinates to save storage',
          'Interleaves lat/long bits into one string so a shared prefix means physical proximity — making "nearby" a prefix scan',
          'Encrypts location data',
          'Rounds coordinates to a fixed grid for privacy',
        ],
        correct: 1,
        explain:
          'It reduces two dimensions to one so an ordinary index can range-scan it. The known cost is boundary cases, which you handle by querying neighbouring cells and filtering by true distance.',
      },
      {
        id: 'q-a-proximity-2',
        moduleId: 'a-proximity',
        stem: 'You are tracking 50,000 live driver positions updating every 4 seconds. Which store fits best?',
        options: [
          'PostGIS — the most capable geospatial engine',
          'Redis geo commands — in-memory, and the write rate dominates',
          'Elasticsearch geo queries',
          'A bounding-box query on indexed columns',
        ],
        correct: 1,
        explain:
          'Moving entities are a write-rate problem, not a query-richness problem. 12,500 position writes per second belongs in memory; a disk-backed geospatial index is solving the wrong half.',
      },
    ],
    cards: [
      {
        id: 'c-a-proximity-1',
        moduleId: 'a-proximity',
        front: 'How does a geospatial index make "nearby" fast?',
        back: 'It reduces two dimensions to one — geohash prefixes, quadtrees, S2 cells — so proximity becomes a range scan. Boundary cases need neighbouring cells plus a true-distance filter.',
        tag: 'Proximity',
      },
      {
        id: 'c-a-proximity-2',
        moduleId: 'a-proximity',
        front: 'Moving versus static entities in proximity search.',
        back: 'Static (restaurants): read-heavy, index anywhere. Moving (drivers): the write rate dominates, so hold positions in memory — Redis geo.',
        tag: 'Proximity',
      },
    ],
  },
]
