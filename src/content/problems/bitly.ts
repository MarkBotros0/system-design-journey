import type { Problem } from '../types'

export const bitly: Problem = {
  id: 'bitly',
  title: 'Design Bitly',
  kind: 'hld',
  category: 'infra',
  difficulty: 'easy',
  brief:
    'Users paste a long [[URL]] and get a short one back. Visiting the short URL redirects them to the original. That is all you get — scope it yourself.',
  patterns: ['scaling-reads'],
  suggests: ['f-api', 'f-db', 'f-cache', 'f-scale'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to shorten + redirect, and said what was out of scope' },
    { id: 'r2', bar: 'must', criterion: 'Quantified the read-heavy ratio and named availability over consistency' },
    { id: 'r3', bar: 'must', criterion: 'Two endpoints, with the redirect returning a 302' },
    { id: 'r4', bar: 'must', criterion: 'Named how short codes are generated and why collisions are handled that way' },
    { id: 'r5', bar: 'senior', criterion: 'Did the maths on code length against expected volume' },
    { id: 'r6', bar: 'senior', criterion: 'Put a cache on the redirect path and justified it with the read ratio' },
    { id: 'r7', bar: 'senior', criterion: 'Considered the hot-link problem — one viral link concentrating traffic' },
    { id: 'r8', bar: 'senior', criterion: 'Handled custom aliases and expiry without breaking the base design' },
    { id: 'r9', bar: 'staff', criterion: 'Addressed analytics ingestion without slowing the redirect' },
    { id: 'r10', bar: 'staff', criterion: 'Named the counter/ID coordination problem across multiple writers' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Shorten a long URL into a short code.',
        'Redirect a short code to the original URL.',
        'Out of scope, said out loud: user accounts, analytics dashboards, link editing.',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional: **extremely read-heavy** (roughly 100:1, and for a popular link far more), redirect latency under ~100 ms, high availability over strong consistency — a link resolving a second after creation is fine, a link that fails to resolve is not.',
    },
    {
      kind: 'prose',
      text: 'Code length is the only number that changes a decision here. Base62 over 7 characters gives 62⁷ ≈ **3.5 trillion** codes. At a million new links a day that is thousands of years of headroom, so 7 characters it is. This is a good example of estimation that earns its place — it picks a design parameter rather than concluding "that is a lot".',
    },
    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'prose',
      text: '`Link`: the short code, the long URL, an optional custom alias and an optional expiry. `Click` only if analytics comes up. That is the whole vocabulary, and keeping it that small is part of the answer.',
    },
    { kind: 'heading', text: '[[API]]' },
    {
      kind: 'code',
      code: `POST /v1/links
  { "url": string, "alias"?: string, "expiresAt"?: string }
  -> { "shortUrl": string }

GET  /{code}   -> 302 Location: <original url>`,
    },
    {
      kind: 'prose',
      text: 'One endpoint per requirement. The redirect is a **302**, not a 301: a browser caches a 301 permanently, so every later click skips you — no analytics, no expiry, and no way to take a bad link down.',
    },
    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'The redirect path, edge to source of truth. The write path is the same minus the edge.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Client', to: 'GET /{code}' },
          { label: '[[CDN]]', sub: 'edge cache, global users', to: 'miss' },
          { label: 'Load balancer', to: 'any host' },
          { label: 'Link service', sub: 'stateless', tone: 'line', to: 'lookup' },
          { label: 'Redis', sub: 'code → long URL', to: 'miss' },
          { label: 'Postgres', sub: 'source of truth' },
        ],
        note: 'The redirect path. The write path is the same minus the CDN.',
      },
    },
    {
      kind: 'prose',
      text: 'One table: `code` (primary key), `long_url`, `created_at`, `expires_at`. The redirect is a single primary-key lookup, which is the cheapest query a database can serve — and then you put a cache in front of it anyway, because at 100:1 the cache is doing almost all the work.',
    },
    {
      kind: 'prose',
      text: 'Walk it endpoint by endpoint. `POST /v1/links` needs a unique code from somewhere, which makes code generation the coordination point. `GET /{code}` is the hot path, so the read path and one viral link are the second bottleneck. Analytics, if asked for, must not land on that path. Those three notes are the deep-dive agenda.',
    },
    { kind: 'heading', text: 'Deep dive 1 — generating the code' },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Hash the URL, take the first 7 characters',
          text: 'Collisions are certain at volume, and you have no clean way to resolve them. Two different URLs silently mapping to one code is data loss.',
        },
        {
          grade: 'good',
          title: 'Random 7 characters, retry on collision',
          text: 'Works. Needs a uniqueness constraint and a retry loop, and the retry rate climbs as the table fills — but with 3.5 trillion codes that is a long way off.',
        },
        {
          grade: 'best',
          title: 'Monotonic counter, base62-encoded',
          text: 'No collisions by construction, and codes stay short. The counter is the coordination point: hand out **ranges** to each writer (say a block of 10,000) from a single source, so writers only coordinate once per block rather than once per link. Sequential codes are guessable, so pair this with a permission check if links can be private.',
        },
      ],
    },
    { kind: 'heading', text: 'Deep dive 2 — the read path' },
    {
      kind: 'figure',
      caption: 'Why the redirect is almost entirely a caching problem.',
      figure: {
        kind: 'ratio',
        parts: [
          { label: 'Redirects', value: 100, tone: 'line' },
          { label: 'Links created', value: 1, tone: 'streak' },
        ],
        note: 'The mapping never changes once written, so it caches with an indefinite expiry and invalidation is almost a non-problem.',
      },
    },
    {
      kind: 'prose',
      text: 'Cache-aside on `code -> long_url` with a long [[TTL]], since a mapping essentially never changes. A cache hit is ~1 ms against 20–50 ms for the database. With links being immutable, invalidation is almost a non-problem — the exception is deletion and expiry, which you handle by writing a tombstone rather than waiting for a TTL.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'A single viral link is the hot-key case: one cache shard takes all the traffic while the rest idle. Redundant cache instances, each able to serve any code, spread it — and because the data is immutable there is no coordination cost to replicating it.',
    },
    {
      kind: 'prose',
      text: 'For a truly global audience the redirect can be served at the edge — the mapping is small and immutable, which makes it unusually CDN-friendly.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Redis behind the service',
        points: [
          'One place to invalidate on delete or expiry',
          'Every redirect still crosses to your region',
          'Easy to replicate for a hot link',
        ],
      },
      right: {
        title: 'Redirect served at the edge',
        points: [
          'Tens of milliseconds anywhere, not a trip to your region',
          'Deletion must purge every edge location',
          'Edge hits never reach your logs, so analytics needs edge logs',
        ],
      },
      verdict: 'Redis first, because it is simple and already meets 100 ms. Push redirects to the edge when the audience is global and the latency target tightens.',
    },
    { kind: 'heading', text: 'Deep dive 3 — analytics without slowing the redirect' },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Writing a click row synchronously inside the redirect. You have just added a database write to the hottest path in the system for data nobody reads in real time.',
    },
    {
      kind: 'prose',
      text: 'Fire the click event onto a queue or stream and return the 302 immediately. Aggregate downstream. This is the long-running-task pattern applied to something that looks too small to need it.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Write a click row in the redirect',
        points: [
          'Counts are exact the instant they happen',
          'Redirect latency now depends on database health',
          'A viral link becomes a write hot spot',
        ],
      },
      right: {
        title: 'Emit an event, aggregate downstream',
        points: [
          'The 302 returns in milliseconds regardless',
          'The queue absorbs spikes the database could not',
          'Counts lag by seconds',
        ],
      },
      verdict: 'Emit. Nobody reads click counts in real time, and the redirect is the product.',
    },
  ],
  followups: [
    {
      q: 'Two users shorten the same long URL. Do they get the same code?',
      a: 'No, by default. Deduplicating needs an index on the long URL, and the two links can have different owners, expiries and analytics. If storage ever matters, dedupe per user, never globally.',
    },
    {
      q: 'How do custom aliases fit alongside the counter?',
      a: 'They share one keyspace, so both go through the same primary-key insert, and an alias that is taken fails with a conflict. A counter value that collides with an alias is simply skipped. Reserving a different length for aliases removes even that.',
    },
    {
      q: 'The service that hands out counter ranges goes down. What breaks?',
      a: 'Almost nothing at first. Each writer is holding a block, so it keeps minting codes until the block runs out, and redirects never touch the counter at all. Make the allocator a single row in Postgres, updated in one transaction, and a short outage is invisible.',
    },
    {
      q: 'A link expires, or is taken down for abuse. How do you stop it resolving everywhere?',
      a: 'Check `expires_at` on read, and write a tombstone on deletion so the cache serves "gone" rather than the old target. Cap each cache entry\'s [[TTL]] at the link\'s remaining life. If redirects are served at the edge, a deletion also triggers a purge.',
    },
  ],
}
