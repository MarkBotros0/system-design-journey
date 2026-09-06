import type { Problem } from '../types'

export const newsFeed: Problem = {
  id: 'news-feed',
  title: 'Design a news feed',
  difficulty: 'medium',
  brief:
    'Users post, follow other users, and read a reverse-chronological feed of posts from everyone they follow. Two billion users, and some of them have fifty million followers.',
  patterns: ['scaling-reads', 'scaling-writes'],
  suggests: ['a-reads', 'a-writes', 'c-caching'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to post / follow / read feed with cursor pagination' },
    { id: 'r2', bar: 'must', criterion: 'Chose availability over consistency and quantified tolerable staleness' },
    { id: 'r3', bar: 'must', criterion: 'Modelled the follow graph with a reversed secondary index' },
    { id: 'r4', bar: 'must', criterion: 'Identified feed assembly as the bottleneck' },
    { id: 'r5', bar: 'senior', criterion: 'Compared fan-out on read against fan-out on write with the failure mode of each' },
    { id: 'r6', bar: 'senior', criterion: 'Proposed a precomputed feed table and sized it with real arithmetic' },
    { id: 'r7', bar: 'senior', criterion: 'Handled the celebrity case rather than hand-waving it' },
    { id: 'r8', bar: 'senior', criterion: 'Used a queue and worker pool for fan-out, not a synchronous blast' },
    { id: 'r9', bar: 'staff', criterion: 'Proposed the hybrid, and named the threshold as a tunable knob' },
    { id: 'r10', bar: 'staff', criterion: 'Identified the hot-key problem on viral posts and why sharding does not fix it' },
    { id: 'r11', bar: 'staff', criterion: 'Justified not using a graph database for the follow graph' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Create a post.',
        'Follow a user.',
        'Read a reverse-chronological feed, paginated.',
        'Out of scope: likes, comments, ranking, privacy controls.',
      ],
    },
    {
      kind: 'prose',
      text: 'Availability over consistency — **under a minute of staleness is invisible** in a feed. Under 500 ms to post and to read. Two billion users. Unlimited follows.',
    },
    { kind: 'heading', text: 'Entities and API' },
    {
      kind: 'code',
      code: `POST /posts        { content }          -> { postId }
PUT  /users/{id}/follow                -> 200
GET  /feed?limit=&cursor=<timestamp>   -> { items, nextCursor }`,
      caption: 'Cursor pagination, because the feed is being written to while you scroll it.',
    },
    {
      kind: 'prose',
      text: 'The Follow table is partitioned by `followerId` with `followeeId` as sort key, plus a **reversed global secondary index** so "who follows X" is equally cheap. That is the whole reason this does not need a graph database — there is no deep traversal, only two O(1) lookups.',
    },
    { kind: 'heading', text: 'The bottleneck' },
    {
      kind: 'prose',
      text: 'Naively, a feed read means: look up everyone I follow, query each of their post lists, merge, sort. Follow a thousand accounts and one feed request becomes a thousand queries. That is **fan-out on read**, and it blows the latency budget immediately.',
    },
    { kind: 'heading', text: 'Deep dive 1 — fan-out on read vs write' },
    {
      kind: 'compare',
      left: {
        title: 'Fan-out on read',
        points: [
          'N queries at read time, N = follow count',
          'Writes are trivial — one row',
          'Latency grows with how many people you follow',
        ],
      },
      right: {
        title: 'Fan-out on write',
        points: [
          'Work paid once, asynchronously, at post time',
          'Every read is a single lookup',
          'A celebrity post means millions of writes',
        ],
      },
      verdict: 'Neither wins outright, and saying so is the point. The answer is a hybrid.',
    },
    {
      kind: 'prose',
      text: 'Fan-out on write means a **PrecomputedFeed** table: userId → the most recent ~200 post ids. Size it out loud, because this is estimation that actually decides something: 200 ids × ~10 bytes = **2 KB per user**; × 2 billion users = **4 TB** total. That is a small, cheap table, and the arithmetic settles the design.',
    },
    { kind: 'heading', text: 'Deep dive 2 — the celebrity problem' },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Blast writes synchronously on post',
          text: 'The post request now waits on fifty million writes. It also spikes unpredictably, saturating whichever host received it while others idle.',
        },
        {
          grade: 'good',
          title: 'Queue plus a worker pool',
          text: 'Post enqueues one event; workers look up followers and prepend. At-least-once delivery is fine here — a duplicate post id in a feed is idempotent. Still uneven: one queue item may mean 50M writes and another 50.',
        },
        {
          grade: 'best',
          title: 'Hybrid — skip precomputation for high-follower accounts',
          text: 'Flag accounts above a follower threshold as non-precomputed. Workers skip them entirely. The feed service reads the precomputed feed and merges in a live query for the handful of flagged accounts the user follows. Most users pay nothing; celebrity followers pay one extra query. **The threshold is a tunable knob** — naming it as one is the senior move.',
        },
      ],
    },
    { kind: 'heading', text: 'Deep dive 3 — the hot key' },
    {
      kind: 'prose',
      text: 'A viral post is read millions of times in minutes. Put a Redis cache in front of the post table keyed by post id, and you have moved the problem rather than solved it: sharding assumes even load across keys, and one key now takes everything while every other shard idles.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Answering "add more cache shards". All the traffic is for one key — more shards changes nothing. The interviewer is testing whether you understand why even distribution fails here.',
    },
    {
      kind: 'prose',
      text: 'The fix is **redundant cache instances**, each able to serve any post, with the load balancer spreading reads across all of them. You trade total cache capacity for spike absorption, and a handful of extra misses on a viral post is trivial next to the spike you avoided. Posts are effectively immutable, so replication costs no coordination.',
    },
  ],
}
