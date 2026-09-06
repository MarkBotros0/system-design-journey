import type { Problem } from '../types'

export const rateLimiter: Problem = {
  id: 'rate-limiter',
  title: 'Design a rate limiter',
  difficulty: 'medium',
  brief:
    'Limit how many requests a client can make in a window — say 100 per minute. It sits in front of an [[API]] served by hundreds of hosts.',
  patterns: ['contention', 'scaling-reads'],
  suggests: ['c-caching', 'a-contention'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Clarified what is limited (user, IP, API key) and the window' },
    { id: 'r2', bar: 'must', criterion: 'Named where it sits — gateway or middleware, before real work happens' },
    { id: 'r3', bar: 'must', criterion: 'Returns 429 with Retry-After and the standard limit headers' },
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
      kind: 'prose',
      text: 'Ask what the key is before anything else — per user, per [[IP]], per API key, or per endpoint — because it changes the cardinality and therefore the storage. Assume per API key, 100 requests per minute, hundreds of API hosts.',
    },
    {
      kind: 'prose',
      text: 'Non-functional: the check must add **single-digit milliseconds**, because it runs on every request. It must be accurate enough that a customer paying for 100/min is not throttled at 60. And it must fail in a defined direction.',
    },
    { kind: 'heading', text: 'Where it lives' },
    {
      kind: 'flow',
      nodes: ['Client', 'API gateway + limiter', 'Redis counters', 'Service'],
      note: 'At the edge, before authentication does real work and before any business logic runs.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Counting per host. With 200 hosts and a 100/min limit, a client behind round-robin gets roughly 200 × 100. The counter has to be shared, which is exactly why this problem is interesting.',
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
          text: 'Weight the previous window by how far into the current one you are. Two integers per client, and it smooths the boundary burst almost entirely. The usual production answer.',
        },
        {
          grade: 'best',
          title: 'Token bucket',
          text: 'Tokens refill at a fixed rate up to a cap; each request takes one. Two numbers per client — token count and last refill time — and it **permits deliberate bursts** while bounding the sustained rate, which is usually what an API actually wants. It is also what most gateways implement.',
        },
      ],
    },
    { kind: 'heading', text: 'Deep dive 2 — atomicity' },
    {
      kind: 'prose',
      text: 'Read-then-write is a race: two hosts both read 99, both allow, and the client gets 101. The check and the increment must be one atomic operation. `INCR` with an expiry covers the fixed window; a **Lua script** covers token bucket, because Redis executes it atomically and it needs to read, compute a refill, and write in one step.',
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
      text: 'On latency: a Redis round trip inside the datacentre is 1–10 ms on every request. If that is too much, hold a small per-host token allowance drawn from the shared pool in batches — each host claims 10 tokens at a time, so you make one network call per ten requests and accept slightly fuzzier enforcement at the edges.',
    },
  ],
}
