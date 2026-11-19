import type { Question } from '../types'

/** Authored bank questions — see docs/superpowers/plans/2026-11-18-question-brief.md */
export const questions: Question[] = [
  /* ---------------------------------------------------------------- */
  /* c-framework                                                       */
  /* ---------------------------------------------------------------- */
  {
    id: 'c-framework-tf1',
    kind: 'truefalse',
    moduleId: 'c-framework',
    section: 'Closing the loop',
    prompt:
      'Quantified non-functional requirements pay off twice: once in shaping the design, and again at the end when you point at what satisfies each.',
    answer: true,
    explain:
      'Closing the loop takes about ninety seconds and turns work already done into points the interviewer can record, which only works if each requirement had a number to point back at.',
  },
  {
    id: 'c-framework-tf2',
    kind: 'truefalse',
    moduleId: 'c-framework',
    section: 'The margin-note habit',
    prompt:
      'Margin notes are for the bottlenecks the interviewer points out, so you have a list to come back to in the deep dives.',
    answer: false,
    explain:
      'The notes are for problems *you* spot during the high-level design. Naming them before the interviewer does is the signal, and the list becomes a deep-dive agenda you chose.',
  },
  {
    id: 'c-framework-multi',
    kind: 'multi',
    moduleId: 'c-framework',
    section: 'Why this order and not another',
    prompt:
      'A candidate skips requirements and starts drawing boxes in minute one. What does the framework predict?',
    options: [
      'More time is left for deep dives, which raises the score',
      'The design satisfies no requirement in particular',
      'There is no API to assemble the boxes against',
      'The design stays flexible, since nothing constrains it',
      'No agreed scale exists to judge a bottleneck by',
    ],
    correct: [1, 2, 4],
    explain:
      'Each phase constrains the next: requirements decide the [[API]], the API decides the boxes, the boxes surface the bottlenecks. Skip the start and nothing downstream has footing, so minutes saved early are not minutes gained.',
  },
  {
    id: 'c-framework-match',
    kind: 'match',
    moduleId: 'c-framework',
    section: 'Why this order and not another',
    prompt: 'Match each interview phase to what it should produce.',
    pairs: [
      { left: 'Requirements', right: 'Top 3 functional, 3–5 quantified non-functional' },
      { left: 'Core entities', right: '3–5 nouns: a vocabulary, not a schema' },
      { left: 'API', right: 'One endpoint per functional requirement' },
      { left: 'High-level design', right: 'Boxes and arrows that serve each endpoint' },
      { left: 'Deep dives', right: 'Two or three bottlenecks, worked properly' },
    ],
    explain:
      'Each output feeds the next phase: requirements decide the [[API]] endpoints, the endpoints decide the boxes, and the boxes surface the bottlenecks you dig into.',
  },

  /* ---------------------------------------------------------------- */
  /* c-requirements                                                    */
  /* ---------------------------------------------------------------- */
  {
    id: 'c-requirements-tf1',
    kind: 'truefalse',
    moduleId: 'c-requirements',
    section: 'Functional: exactly three',
    prompt:
      'Listing every feature you can think of up front is the safer opening, because it shows the interviewer you have considered the whole product.',
    answer: false,
    explain:
      'You cannot design nine features in forty minutes, so a long list buys a shallow pass over everything. Scope to three and name what you are cutting: that is a positive signal, not an admission.',
  },
  {
    id: 'c-requirements-tf2',
    kind: 'truefalse',
    moduleId: 'c-requirements',
    section: 'The shortcuts',
    prompt: 'Storing 1 [[KB]] for each of 1M writes a day adds up to roughly 365 [[GB]] a year.',
    answer: true,
    explain:
      '1 KB × 1M is 1 GB a day, and 365 days makes 365 GB. Say each step aloud, so a slip of a factor of a thousand gets caught before it decides anything.',
  },
  {
    id: 'c-requirements-multi',
    kind: 'multi',
    moduleId: 'c-requirements',
    section: 'Estimation: only when it decides something',
    prompt: 'Which of these calculations are worth interview minutes?',
    options: [
      'Storage after five years, never referred to again',
      'Whether the top-K fits in one min-heap',
      'Bandwidth in gigabits, to conclude you need a CDN',
      'Peak writes per second, to see if one database copes',
      'How many characters a short code needs',
    ],
    correct: [1, 3, 4],
    explain:
      'The test is whether the number picks between designs: one heap or sharded, one database or several, a short code or a long one. A total you never use again, or one that only proves you need a [[CDN]], decides nothing.',
  },
  {
    id: 'c-requirements-match',
    kind: 'match',
    moduleId: 'c-requirements',
    section: 'Non-functional: three to five, each quantified',
    prompt: 'Match each non-functional category to the requirement it would produce.',
    pairs: [
      { left: 'Durability', right: 'No acknowledged upload is ever lost' },
      { left: 'Fault tolerance', right: 'Stays up after losing a whole data centre' },
      { left: 'Scalability', right: 'Ten times normal traffic on launch day' },
      { left: 'Environment constraints', right: 'Works on old phones with patchy signal' },
      { left: 'Compliance', right: "EU users' data never leaves the EU" },
    ],
    explain:
      'Durability is about data you must not lose; fault tolerance is about staying up when parts fail. Keeping the two apart is what lets you pick the right mechanism for each.',
  },

  /* ---------------------------------------------------------------- */
  /* c-modelling                                                       */
  /* ---------------------------------------------------------------- */
  {
    id: 'c-modelling-tf1',
    kind: 'truefalse',
    moduleId: 'c-modelling',
    section: 'Access patterns first',
    prompt:
      'A good data model starts from the entities and their fields; the access patterns can be worked out once the schema exists.',
    answer: false,
    explain:
      'The model follows the queries. Writing each read as a sentence, such as "a user\'s posts, newest first", gives you the key, the sort and the index before you draw a table.',
  },
  {
    id: 'c-modelling-tf2',
    kind: 'truefalse',
    moduleId: 'c-modelling',
    section: 'External indexes and [[CDC]]',
    prompt:
      'With [[CDC]], the application writes only to the primary database, and the search index is fed from that database\'s write log.',
    answer: true,
    explain:
      'Streaming the write log avoids dual writes from the application, which drift apart whenever one of the two fails. The price is that the index trails the primary by about a second.',
  },
  {
    id: 'c-modelling-multi',
    kind: 'multi',
    moduleId: 'c-modelling',
    section: 'Denormalising the hot path',
    prompt:
      'To avoid a join, you copy each author\'s display name onto every post they write. Which costs have you taken on?',
    options: [
      'A rename must rewrite every post by that author',
      'Every feed read now needs a join to the users table',
      'Some posts can show the old name for a while',
      'The display name becomes strongly consistent everywhere',
    ],
    correct: [0, 2],
    explain:
      'Every copy is something that can drift: a rename fans out into many writes, and until they all land some posts show the old name. That is the update cost to say out loud when you denormalise.',
  },
  {
    id: 'c-modelling-match',
    kind: 'match',
    moduleId: 'c-modelling',
    section: 'Secondary indexes',
    prompt: 'Match each read to the structure that should answer it.',
    pairs: [
      { left: "Alice's posts, newest first", right: 'Base table: creatorId, sorted by createdAt' },
      { left: "Alice's posts, most liked first", right: 'Local index: same partition, new sort' },
      { left: 'Who follows alice', right: 'Global index keyed by followeeId' },
      { left: "Posts that mention 'marathon'", right: 'Search index fed by CDC' },
    ],
    explain:
      'A local index keeps the partition and changes the sort; a global one re-partitions under a new key to answer a different question. Full text belongs in an external index fed by [[CDC]].',
  },

  /* ---------------------------------------------------------------- */
  /* c-caching                                                         */
  /* ---------------------------------------------------------------- */
  {
    id: 'c-caching-tf1',
    kind: 'truefalse',
    moduleId: 'c-caching',
    section: 'The layers',
    prompt: 'An in-process cache stays in step across all app instances as long as they share the same [[TTL]].',
    answer: false,
    explain:
      'Each instance loads its copy at a different moment, so identical TTLs still expire at different times and instances disagree. Keep it to config, flags and tiny hot sets, where brief drift is harmless.',
  },
  {
    id: 'c-caching-tf2',
    kind: 'truefalse',
    moduleId: 'c-caching',
    section: 'Invalidation',
    prompt:
      'Even on keys you invalidate on every write, a [[TTL]] is worth setting, because one missed invalidation would otherwise serve stale data indefinitely.',
    answer: true,
    explain:
      'Invalidate-on-write is accurate but fragile: any writer that forgets a derived key leaves it stale. A TTL as the backstop bounds how long that mistake can last.',
  },
  {
    id: 'c-caching-multi',
    kind: 'multi',
    moduleId: 'c-caching',
    section: 'The hot key',
    prompt:
      'You switch a cache that suffers from viral keys from sharded to replicated. Which consequences follow?',
    options: [
      'Any node can serve the viral key',
      'A spike on one key spreads across every node',
      'Each added node now raises total capacity',
      "Total capacity falls to about one node's worth",
      'A write to a key now touches only one node',
    ],
    correct: [0, 1, 3],
    explain:
      "Replication trades capacity for spike absorption: every node holds every key, so the cluster stores one node's worth while all nodes share the reads. Each write or invalidation must now reach every copy.",
  },
  {
    id: 'c-caching-match',
    kind: 'match',
    moduleId: 'c-caching',
    section: 'The layers',
    prompt: 'Match each item to the cache layer that should hold it.',
    pairs: [
      { left: 'Product images', right: 'CDN edge' },
      { left: 'Feature-flag values', right: 'In-process memory' },
      { left: 'Logged-in user sessions', right: 'Distributed cache such as Redis' },
      { left: 'Recently read table pages', right: 'Database buffer pool' },
    ],
    explain:
      'Each layer has its own consistency story: a [[CDN]] expires by [[TTL]] or purge, in-process copies drift per instance, Redis is invalidated by your writes, and the buffer pool manages itself.',
  },

  /* ---------------------------------------------------------------- */
  /* c-sharding                                                        */
  /* ---------------------------------------------------------------- */
  {
    id: 'c-sharding-tf1',
    kind: 'truefalse',
    moduleId: 'c-sharding',
    section: 'What sharding takes away',
    prompt: 'Sharding on a hash of the key rules out hot spots, because the hash spreads load evenly across shards.',
    answer: false,
    explain:
      'A hash spreads *keys* evenly, not *load*. One celebrity, product or busy tenant is a single key, so all of its traffic still lands on one shard.',
  },
  {
    id: 'c-sharding-tf2',
    kind: 'truefalse',
    moduleId: 'c-sharding',
    section: 'Consistent hashing, briefly',
    prompt:
      'With only a few servers on a hash ring, giving each server many virtual nodes is what evens out how many keys each one owns.',
    answer: true,
    explain:
      'A handful of points leaves arcs of very different lengths, so some servers own far more keys. Many positions per server average the arcs out, and spread a departing server\'s keys across many others.',
  },
  {
    id: 'c-sharding-multi',
    kind: 'multi',
    moduleId: 'c-sharding',
    section: 'Choosing the key',
    prompt: 'You shard a multi-tenant database on `tenantId`. Which consequences follow?',
    options: [
      "One tenant's queries stay on one shard",
      "Adding shards spreads a big tenant's load",
      'A report across all tenants hits every shard',
      'A very large tenant can saturate its shard',
      'A transaction spanning two tenants stays on one shard',
    ],
    correct: [0, 2, 3],
    explain:
      'The key decides what is fast and where the hot spots are. Per-tenant work stays local, cross-tenant work fans out, and a tenant bigger than a shard stays one key however many shards you add.',
  },
  {
    id: 'c-sharding-match',
    kind: 'match',
    moduleId: 'c-sharding',
    section: 'Choosing the key',
    prompt: 'Match each shard key or scheme to what goes wrong with it.',
    pairs: [
      { left: 'Hash of userId', right: 'Range queries fan out to every shard' },
      { left: 'Range on createdAt', right: 'All new writes land on the last shard' },
      { left: 'Directory lookup service', right: 'An extra hop, and a dependency to keep up' },
      { left: 'Low-cardinality key, such as country', right: 'A few huge shards that cannot be split' },
    ],
    explain:
      'Every key has a slow query or a hot spot, and naming it is the design. Hashing kills locality, a time range funnels new writes to one shard, a directory adds a hop, and few distinct values cap how far you can split.',
  },

  /* ---------------------------------------------------------------- */
  /* c-cap                                                             */
  /* ---------------------------------------------------------------- */
  {
    id: 'c-cap-tf1',
    kind: 'truefalse',
    moduleId: 'c-cap',
    section: 'When you must pick consistency',
    prompt: 'A social feed should be strongly consistent, relaxed only where latency forces you to.',
    answer: false,
    explain:
      'A feed tolerates seconds of staleness, so its default is availability with eventual consistency. Strong consistency is for paths where a stale read does damage: money, inventory, booking a limited resource.',
  },
  {
    id: 'c-cap-tf2',
    kind: 'truefalse',
    moduleId: 'c-cap',
    section: '[[PACELC]]',
    prompt:
      'A database that waits for a replica in another region to confirm each write pays for that consistency in latency, even on a healthy network.',
    answer: true,
    explain:
      'That is the *else* in [[PACELC]]: with no partition, you still choose between latency and consistency. [[CAP]] alone says nothing about this everyday case.',
  },
  {
    id: 'c-cap-multi',
    kind: 'multi',
    moduleId: 'c-cap',
    section: 'It is per-path, not per-system',
    prompt: 'In a food-delivery app, which paths can safely run on data a few seconds stale?',
    options: [
      "Debiting the customer's wallet",
      'Showing restaurant menus and photos',
      "Showing the courier's dot on the map",
      'Claiming the last of a limited daily dish',
      'Showing star ratings for a restaurant',
      'Showing the estimated delivery time',
    ],
    correct: [1, 2, 4, 5],
    explain:
      "Money and limited inventory are the exceptions: a stale balance or stock count lets you spend or sell something twice. Menus, ratings, estimates and a courier's position tolerate seconds of staleness invisibly.",
  },
  {
    id: 'c-cap-match',
    kind: 'match',
    moduleId: 'c-cap',
    section: '[[PACELC]]',
    prompt: 'Match each behaviour to the choice it makes under [[PACELC]].',
    pairs: [
      { left: 'Minority side refuses writes during a split', right: 'Consistency, during a partition' },
      { left: 'Both sides keep answering during a split', right: 'Availability, during a partition' },
      { left: 'Healthy network; waits for remote replicas', right: 'Consistency, at the cost of latency' },
      { left: 'Healthy network; replies before replicating', right: 'Latency, at the cost of consistency' },
    ],
    explain:
      '[[CAP]] covers only the partition case: refuse, or answer possibly stale. [[PACELC]] adds the *else*: on a healthy network, waiting for replicas buys consistency with latency, and replying first buys speed with staleness.',
  },

  /* ---------------------------------------------------------------- */
  /* c-queues                                                          */
  /* ---------------------------------------------------------------- */
  {
    id: 'c-queues-tf1',
    kind: 'truefalse',
    moduleId: 'c-queues',
    section: 'What you must name',
    prompt:
      'Spreading a topic across partitions preserves the order of all its messages, as long as each partition has a single consumer.',
    answer: false,
    explain:
      'Ordering holds only within a partition, never across them. Give messages that must stay in sequence, such as one order\'s events, the same partition key so they share a partition.',
  },
  {
    id: 'c-queues-tf2',
    kind: 'truefalse',
    moduleId: 'c-queues',
    section: 'Queue versus stream',
    prompt:
      'Two consumer groups reading the same Kafka topic each receive every message, rather than splitting the messages between them.',
    answer: true,
    explain:
      'Each group tracks its own offsets over retained data, so billing and analytics read the same events independently. Consumers *within* one group do split the partitions between them.',
  },
  {
    id: 'c-queues-multi',
    kind: 'multi',
    moduleId: 'c-queues',
    section: 'Queue versus stream',
    prompt: 'Which needs point to a stream such as Kafka rather than a queue such as [[SQS]]?',
    options: [
      'Letting several services each see every event',
      'Handing each resize job to one worker',
      'Absorbing a burst of emails before sending',
      "Replaying last week's events after a bug fix",
      'Rebuilding a read model from past events',
      'Retrying a failed job with backoff',
    ],
    correct: [0, 3, 4],
    explain:
      'Retention is the difference. Several independent readers or replay need a stream; work that simply needs doing once, by someone, is what a queue is for.',
  },
  {
    id: 'c-queues-match',
    kind: 'match',
    moduleId: 'c-queues',
    section: 'What you must name',
    prompt: 'Match each queue problem to the standard answer.',
    pairs: [
      { left: 'A message fails once', right: 'Retry with exponential backoff' },
      { left: 'It fails on every attempt', right: 'Park it in a dead-letter queue and alert' },
      { left: 'Producers outpace consumers', right: 'Backpressure: reject, shed or slow' },
      { left: 'The same message arrives twice', right: 'An idempotent handler' },
    ],
    explain:
      'Retries handle transient faults, a dead-letter queue stops one poison message blocking the rest, backpressure protects consumers, and idempotency makes at-least-once delivery safe.',
  },

  /* ---------------------------------------------------------------- */
  /* c-search                                                          */
  /* ---------------------------------------------------------------- */
  {
    id: 'c-search-tf1',
    kind: 'truefalse',
    moduleId: 'c-search',
    section: 'Why the database cannot do it',
    prompt:
      "An ordinary B-tree index on `name` lets `WHERE name LIKE '%swift%'` find matches without reading every row.",
    answer: false,
    explain:
      'A B-tree seeks on a sorted prefix, and a leading wildcard leaves none, so every row is still read. It cannot rank, stem or forgive a typo either.',
  },
  {
    id: 'c-search-tf2',
    kind: 'truefalse',
    moduleId: 'c-search',
    section: 'The lighter option',
    prompt:
      'Postgres full-text search with a [[GIN]] index can be the right final answer, not just a stopgap, when search is a filter box rather than a core feature.',
    answer: true,
    explain:
      'It gives real tokenisation and ranking with no cluster, no [[CDC]] pipeline and no sync bug. Elasticsearch earns its operating cost once search becomes a core feature.',
  },
  {
    id: 'c-search-multi',
    kind: 'multi',
    moduleId: 'c-search',
    section: 'Keeping it in sync',
    prompt: 'Your Elasticsearch cluster, fed from Postgres by [[CDC]], is lost overnight. Which are true?',
    options: [
      'Bookings and payments stop as well',
      'No data is lost',
      'The index can be rebuilt from Postgres',
      'Only an Elasticsearch backup can recover the data',
      'Search is degraded until the rebuild finishes',
    ],
    correct: [1, 2, 4],
    explain:
      'The search index is a derived copy and Postgres is the source of truth, so losing the cluster costs search, not data. Anything deciding a booking or payment was reading the primary anyway.',
  },
  {
    id: 'c-search-match',
    kind: 'match',
    moduleId: 'c-search',
    section: 'The inverted index',
    prompt: 'Match each part of a search engine to what it does.',
    pairs: [
      { left: 'Tokenisation', right: 'Splits text into terms' },
      { left: 'Stemming', right: "Indexes 'running' as 'run'" },
      { left: 'Fuzzy matching', right: "Finds 'Taylor' from 'Tayler'" },
      { left: 'Posting list', right: 'The documents that contain one term' },
    ],
    explain:
      'Tokenisation and stemming decide which terms get indexed, a posting list is what each term points to, and fuzzy matching uses edit distance so a misspelt query still finds its term.',
  },
]
