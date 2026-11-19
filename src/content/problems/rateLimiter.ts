import type { Problem } from '../types'

export const rateLimiter: Problem = {
  id: 'rate-limiter',
  title: 'Design a rate limiter',
  kind: 'hld',
  category: 'infra',
  difficulty: 'medium',
  brief:
    'Limit how many requests a client can make in a window — say 100 per minute. It sits in front of an [[API]] served by hundreds of hosts.',
  patterns: ['contention', 'scaling-reads'],
  suggests: ['c-caching', 'a-contention'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Clarified what is limited (user, IP, API key) and the window' },
    { id: 'r2', bar: 'must', criterion: 'Named where it sits — gateway or middleware, before real work happens' },
    { id: 'r3', bar: 'must', criterion: 'Returns 429 with Retry-After and the usual limit headers' },
    { id: 'r4', bar: 'must', criterion: 'Chose an algorithm and explained its behaviour' },
    { id: 'r5', bar: 'senior', criterion: 'Identified the fixed-window boundary burst problem' },
    { id: 'r6', bar: 'senior', criterion: 'Explained why counters must be shared across hosts, not per-host' },
    { id: 'r7', bar: 'senior', criterion: 'Made the increment-and-check atomic (Lua script or INCR with expiry)' },
    { id: 'r8', bar: 'senior', criterion: 'Compared sliding window and token bucket honestly' },
    { id: 'r9', bar: 'staff', criterion: 'Decided fail-open vs fail-closed when the counter store is unavailable' },
    { id: 'r10', bar: 'staff', criterion: 'Addressed the latency cost of a network round trip per request' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Limit each client to N requests per window, configured per rule.',
        'Reject requests over the limit, and tell the client when it may retry.',
        'Enforce one limit across every host, not one per host.',
      ],
    },
    {
      kind: 'prose',
      text: 'Ask what the key is before anything else — per user, per [[IP]], per API key, or per endpoint — because it changes the cardinality and therefore the storage. Assume per API key, 100 requests per minute, hundreds of API hosts.',
    },
    {
      kind: 'prose',
      text: 'Non-functional: the check must add **single-digit milliseconds**, because it runs on every request. It must be accurate enough that a customer paying for 100/min is not throttled at 60. And it must fail in a defined direction.',
    },
    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'prose',
      text: '`Rule`: what is keyed (API key, user, IP, endpoint), the limit, the window and any burst allowance. `Client key`: the identity a request is counted against. `Counter`: the per-key state — a count, or tokens plus a last-refill time.',
    },
    { kind: 'heading', text: '[[API]]' },
    {
      kind: 'code',
      code: `// internal: the gateway calls this on every request
isAllowed(clientKey, rule) -> { allowed, remaining, resetAt }

// what an over-limit client receives
HTTP/1.1 429 Too Many Requests
Retry-After: 12
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1767225600`,
      caption: 'The real interface is internal. The client-facing contract is the status code and its headers.',
    },
    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'The limiter sits at the edge, and every host shares one set of counters.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Client', to: 'request' },
          { label: 'API gateway + limiter', sub: 'hundreds of hosts', tone: 'line', to: 'check and spend' },
          { label: 'Redis counters', sub: 'shared, one round trip', to: 'allowed' },
          { label: 'Service', sub: 'or a 429 before it' },
        ],
        note: 'At the edge, before authentication does real work and before any business logic runs.',
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Counting per host. With 200 hosts and a 100/min limit, a client behind round-robin gets roughly 200 × 100. The counter has to be shared, which is exactly why this problem is interesting.',
    },
    {
      kind: 'prose',
      text: 'Walk one request: the gateway derives the key, makes one atomic call to Redis, and either forwards the request or returns the 429. The bottlenecks to note are which algorithm counts fairly, making check-and-spend atomic across hosts, and what happens when Redis is slow or gone.',
    },
    { kind: 'heading', text: 'Deep dive 1 — the algorithm' },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Fixed window',
          text: '`INCR key:{client}:{minute}` with a [[TTL]]. Simple and cheap — but 100 requests at 11:59:59 and 100 more at 12:00:00 is 200 in one second. The boundary burst is the flaw the interviewer is looking for.',
        },
        {
          grade: 'good',
          title: 'Sliding window log',
          text: 'A sorted set of request timestamps; drop entries older than the window and count what remains. Exactly accurate, but stores every request — memory scales with traffic, not with clients.',
        },
        {
          grade: 'great',
          title: 'Sliding window counter',
          text: 'Weight the previous window by how far into the current one you are. Two integers per client, and it smooths the boundary burst almost entirely. Cloudflare runs this one.',
        },
        {
          grade: 'best',
          title: 'Token bucket',
          text: 'Tokens refill at a fixed rate up to a cap; each request takes one. Two numbers per client — token count and last refill time — and it **permits deliberate bursts** while bounding the sustained rate, which is usually what an API actually wants. It is also what many gateways implement.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'The fixed-window flaw: a client legitimately sends double the limit in one second.',
      figure: {
        kind: 'timeline',
        ticks: ['11:59:00', '12:00:00', '12:01:00'],
        lanes: [
          {
            label: 'Window A — 100 allowed',
            bars: [{ from: 0.42, to: 0.5, label: '100 at 11:59:59', tone: 'streak' }],
            outcome: { label: 'within limit', tone: 'mastered' },
          },
          {
            label: 'Window B — 100 allowed',
            bars: [{ from: 0.5, to: 0.58, label: '100 at 12:00:00', tone: 'streak' }],
            outcome: { label: 'within limit', tone: 'mastered' },
          },
        ],
        note: 'Both windows are individually correct. The client still got 200 requests through in one second.',
      },
    },
    { kind: 'heading', text: 'Deep dive 2 — atomicity' },
    {
      kind: 'prose',
      text: 'Read-then-write is a race: two hosts both read 99, both allow, and the client gets 101. The check and the increment must be one atomic operation. `INCR` with an expiry covers the fixed window; a **Lua script** covers token bucket, because Redis executes it atomically and it needs to read, compute a refill, and write in one step.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Read, decide, write from the gateway',
        points: [
          'Two round trips per request',
          'Two hosts read 99 and both allow',
          'Over-admits exactly when traffic is heaviest',
        ],
      },
      right: {
        title: 'One atomic operation in Redis',
        points: [
          '`INCR` for a fixed window, a Lua script for token bucket',
          'One round trip, no interleaving',
          'Logic now lives in a script you must version',
        ],
      },
      verdict: 'Atomic in Redis. A limiter that over-admits under load is not a limiter.',
    },
    {
      kind: 'code',
      code: `-- token bucket, atomic in one round trip
local tokens, last = redis.call('HMGET', KEYS[1], 'n', 't')
-- refill by elapsed time, cap at burst, spend one if available
-- returns allowed + remaining, then sets a TTL on the key`,
    },
    { kind: 'heading', text: 'Deep dive 3 — what happens when Redis is down' },
    {
      kind: 'prose',
      text: 'This is the question that separates levels, and it has no universally right answer — which is the point.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Fail open',
        points: [
          'Allow requests when the counter is unreachable',
          'An outage does not take your API down with it',
          'You are unprotected exactly when things are already going wrong',
        ],
      },
      right: {
        title: 'Fail closed',
        points: [
          'Reject when the counter is unreachable',
          'Abuse protection holds',
          'A Redis blip becomes a full API outage',
        ],
      },
      verdict: 'Fail open for general API limiting; fail closed when the limit protects something expensive or dangerous — a payment endpoint, an [[SMS]] sender, an [[LLM]] call. Say which one this is and why.',
    },
    {
      kind: 'prose',
      text: 'On latency: a Redis round trip inside the datacentre is around a millisecond, on every request. If that is too much, hold a small per-host token allowance drawn from the shared pool in batches — each host claims 10 tokens at a time, so you make one network call per ten requests and accept slightly fuzzier enforcement at the edges.',
    },
  ],
  followups: [
    {
      q: 'You run in three regions. Is the limit global?',
      a: 'Rarely worth it. A single global counter puts a cross-region round trip of tens to hundreds of milliseconds on every request. Give each region its own counters and a share of the quota, or sync counts between regions asynchronously, and accept a little over-admission.',
    },
    {
      q: 'One client hammers you with 50,000 requests a second. Does its key become a hot spot in Redis?',
      a: 'Yes — one key, one shard. Once a key is over its limit, cache "denied until T" on each gateway host for the rest of the window. Rejected traffic then never reaches Redis, and the abusive client costs you almost nothing.',
    },
    {
      q: 'Some endpoints are far more expensive than others. How do you limit fairly?',
      a: 'Give requests a cost. A token bucket spends 1 token for a cheap read and 20 for a report export, and rules can key on the endpoint group as well as the client. That bounds the work done, which is what you actually care about.',
    },
    {
      q: 'Sales wants to raise a customer\'s limit right now, without a deploy.',
      a: 'Rules live in a config store, not in code. Gateways cache them with a short [[TTL]], or subscribe to changes, so an update applies within seconds. The counters do not change shape, only the limit they are compared against.',
    },
  ],
}
