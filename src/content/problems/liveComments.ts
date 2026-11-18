import type { Problem } from '../types'

export const liveComments: Problem = {
  id: 'live-comments',
  title: 'Design Facebook Live comments',
  kind: 'hld',
  category: 'realtime',
  difficulty: 'medium',
  brief:
    'Viewers of a live video can post comments, and everyone watching sees new comments appear as they are posted. Some broadcasts have millions of viewers.',
  patterns: ['realtime', 'scaling-reads'],
  suggests: ['a-realtime', 'c-queues', 'c-sharding', 'a-reads'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to post, watch live and load history, with the video stream itself out of scope' },
    { id: 'r2', bar: 'must', criterion: 'Chose SSE over WebSocket and justified it by the one-way hot direction' },
    { id: 'r3', bar: 'must', criterion: 'Stored comments partitioned by video with a time-ordered id as the history cursor' },
    { id: 'r4', bar: 'must', criterion: 'Used pub/sub so a comment reaches viewers connected to other servers' },
    { id: 'r5', bar: 'senior', criterion: 'Did the fan-out arithmetic for a hot video before designing for it' },
    { id: 'r6', bar: 'senior', criterion: 'Partitioned pub/sub by video so servers receive only the videos their viewers watch' },
    { id: 'r7', bar: 'senior', criterion: 'Grouped viewers of the same video onto the same servers' },
    { id: 'r8', bar: 'senior', criterion: 'Batched pushes into frames instead of one push per comment' },
    { id: 'r9', bar: 'senior', criterion: 'Resumed dropped streams from the last event id with a capped replay' },
    { id: 'r10', bar: 'staff', criterion: 'Capped what each viewer receives and ranked comments to fill the budget' },
    { id: 'r11', bar: 'staff', criterion: 'Proposed a fan-out tree through relays to edge servers for videos that outgrow a server' },
    { id: 'r12', bar: 'staff', criterion: 'Planned for mass reconnects with jittered retry and a cache of recent comments' },
  ],
  followups: [
    {
      q: "A viewer's connection drops for thirty seconds. What do they see when it comes back?",
      a: 'The browser reconnects on its own and sends `Last-Event-ID`, the last comment id it received. The server replays from the store after that id, capped at the most recent fifty or so: on a hot video thirty seconds is thirty thousand comments and nobody wants them. Anything older is a scroll-back away.',
    },
    {
      q: 'A realtime server dies and 20,000 viewers reconnect at once. What stops a thundering herd?',
      a: "Jitter. The [[SSE]] `retry:` field lets the server set each client's reconnect delay, so spread them over a few seconds. The ring sends them to the surviving servers, and the replay is served from a per-video Redis list of the last hundred comments rather than from Cassandra, so the store only sees the misses.",
    },
    {
      q: "How do you make sure a viewer sees their own comment, and their friends', on a hot video?",
      a: "The client shows their own comment optimistically the moment they post and reconciles it by `clientCommentId` when it comes back. Friends' comments are boosted at the edge server, which knows whose connection is whose. Sampling only ever thins out strangers.",
    },
    {
      q: 'Where does moderation go without adding latency?',
      a: 'Cheap synchronous checks on the write path: length, a per-user rate limit, a blocklist. A classifier runs asynchronously and, when it flags a comment, publishes a delete event on the same channel so clients remove it within seconds. Blocking every post on a model call would put its latency on every comment.',
    },
    {
      q: 'Does ordering matter?',
      a: 'Loosely. Ids are time-ordered, so history is the same for everyone. The live stream shows comments in roughly arrival order and the client sorts within each batch. Two viewers seeing two comments a fraction of a second apart in different orders is invisible; paying for a total order would not be.',
    },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Users should be able to post a comment on a live video.',
        'Users should be able to see new comments on the video they are watching as they are posted.',
        'Users should be able to scroll back through comments posted before they joined.',
        'Out of scope: the video stream itself, reactions, replies, and moderation beyond a hook on the write path.',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional: **a comment reaches other viewers within two seconds**. Availability over consistency: two viewers seeing comments in a slightly different order, or one arriving a second late, is fine; the stream stalling is not. Assume **100M concurrent viewers across 1M live videos**: a long tail of streams with a handful of viewers, and a head where one video has **a million viewers and a thousand comments a second**.',
    },
    {
      kind: 'prose',
      text: 'Do the hot-video arithmetic now, because it decides the design. A thousand comments a second to a million viewers is **a billion deliveries a second** for one video. No phone can render that and no person can read it; a fast reader manages a few comments a second. So for a hot video the requirement is not "deliver everything". It is "deliver what a person can read, and choose it well".',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Comments are written once and read a million times. The write path is tens of thousands of inserts a second across every video, and it is easy. The fan-out is the whole problem, and that is where I want to spend the time.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'list',
      items: [
        '`LiveVideo`: id, broadcaster, status.',
        '`Comment`: id, videoId, authorId, text, createdAt. The id is **time-ordered** (Snowflake-style), so it doubles as the pagination cursor.',
        '`User`.',
        'The **viewer connection**: which server holds which viewer\'s stream, for which video. Ephemeral, never stored durably.',
      ],
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'prose',
      text: 'Three [[API]] endpoints over [[HTTP]]. The live feed is [[SSE]]: one long-lived response the server keeps writing to.',
    },
    {
      kind: 'code',
      code: `POST /videos/{videoId}/comments
     { text, clientCommentId }    -> 201 { commentId, createdAt }

GET  /videos/{videoId}/comments?before={commentId}&limit=50
                                  -> { comments: Comment[], next }

GET  /videos/{videoId}/comments/stream    (text/event-stream)
     Last-Event-ID: {commentId}   -> id: {lastCommentId}
                                     data: Comment[]`,
    },
    {
      kind: 'prose',
      text: '`clientCommentId` makes a retried post idempotent. `Last-Event-ID` is part of the [[SSE]] standard: the browser sends it automatically when it reconnects, so resuming after a dropped connection costs no client code at all.',
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: "Write once to the store, publish once to the video's channel, push from whichever servers hold its viewers.",
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Viewer posts', sub: 'POST /comments', to: 'HTTP' },
          { label: 'Comment service', sub: 'validate, rate-limit, write', tone: 'line', to: 'publish' },
          { label: 'Pub/sub', sub: 'one channel per video', tone: 'line', to: 'subscribed servers' },
          { label: 'Realtime servers', sub: 'hold the SSE connections', to: 'push' },
          { label: 'Viewers', sub: 'a handful to a million' },
        ],
        note: 'Comments land in Cassandra, partitioned by videoId and ordered by commentId, before they are published. History reads come straight from it.',
      },
    },
    {
      kind: 'list',
      items: [
        "**Posting.** The comment service checks length, a per-user rate limit and a blocklist, assigns a time-ordered id, writes to Cassandra and publishes to the video's channel. Partitioning by `videoId` keeps a video's comments together and in order. If 1% of viewers post once a minute, that is about 17,000 writes a second across the fleet: routine for Cassandra.",
        '**History.** `?before=` is a range read on that one partition, newest first. The time-ordered id is the cursor, so pages never shift as new comments arrive.',
        "**Streaming.** The viewer opens an [[SSE]] connection to a realtime server. That server subscribes to the video's channel if it has not already, and pushes each comment down every matching connection. An idle connection is cheap: a tuned server holds tens of thousands to a few hundred thousand. Call it 100,000, so 100M viewers is about a thousand servers.",
      ],
    },
    {
      kind: 'compare',
      left: {
        title: '[[SSE]]',
        points: [
          'The server pushes down one long-lived response',
          'Reconnect and resume (`Last-Event-ID`) are built into the browser',
          'Plain [[HTTP]]: passes through proxies and ordinary [[L7]] load balancers',
          'Posting is a normal POST, which is all it needs',
        ],
      },
      right: {
        title: '[[WebSocket]]',
        points: [
          'Both directions on one connection',
          'Reconnection, resume and heartbeats are yours to write',
          'Needs load balancers that handle upgraded, long-lived connections',
          'Buys a client-to-server channel this feature barely uses',
        ],
      },
      verdict: "SSE. A viewer receives hundreds of comments for every one they send, so the hot direction is one-way. Over HTTP/2 the stream shares the page's connection instead of taking one of the six a browser allows per host over HTTP/1.1.",
    },
    {
      kind: 'prose',
      text: 'Two bottlenecks, and they are the deep dives. A comment is published once, but the viewers of its video are spread across many servers: how does it reach exactly those servers and no others? And the hot video, where even perfect routing leaves a billion deliveries a second.',
    },

    { kind: 'heading', text: 'Deep dive 1 — getting a comment to the right servers' },
    {
      kind: 'prose',
      text: 'A thousand realtime servers, a million videos, and each server holding viewers of many of them. The question is what each server has to receive.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'One firehose that every server reads',
          text: 'Every server receives all 17,000 comments a second and drops the ones for videos it is not serving. Across a thousand servers that is 17M messages a second, almost all of them thrown away.',
        },
        {
          grade: 'good',
          title: 'A pub/sub channel per video',
          text: 'Each server subscribes only to videos its viewers are watching, so the long tail becomes cheap. But with viewers placed at random, a video with 50,000 viewers has a few on nearly every server, so every popular channel is still subscribed by the whole fleet. And classic Redis Cluster pub/sub forwards every publish to every node, so the broker tier has a firehose of its own.',
        },
        {
          grade: 'great',
          title: 'Partition the channels by video',
          text: 'Hash `videoId` across broker shards: Redis 7 sharded pub/sub (`SSUBSCRIBE`), or a dispatcher that keeps a table of which servers asked for which video. Each publish now touches one shard, so the broker tier scales out. The realtime servers still subscribe to everything popular, because their viewers are scattered.',
        },
        {
          grade: 'best',
          title: 'Partitioned channels, and viewers grouped by video',
          text: 'Route each stream connection by `videoId`: an [[L7]] load balancer or a small dispatcher hashes the video onto the ring of realtime servers, so all viewers of a video land on the same few. One message into a server becomes thousands of pushes out of it, and each server subscribes only to the videos hashed to it. The cost is uneven load, because a hot video overfills its servers. That is the next deep dive.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'Grouping viewers by video turns cross-server traffic from per-viewer into per-server.',
      figure: {
        kind: 'split',
        left: {
          title: 'Viewers placed at random',
          tone: 'alert',
          nodes: [
            { label: 'Comment on video 42', to: 'publish' },
            { label: 'Nearly all 1,000 servers', sub: 'each holds a few of its viewers', tone: 'alert' },
          ],
          cost: 'Every popular video is subscribed on every server.',
        },
        right: {
          title: 'Viewers grouped by video',
          tone: 'mastered',
          nodes: [
            { label: 'Comment on video 42', to: 'publish' },
            { label: '3 servers', sub: 'each holds thousands of its viewers', tone: 'mastered' },
          ],
          cost: 'Load is uneven: a hot video needs room to spill.',
        },
        verdict: 'Group by video, and treat the hot ones as a special case.',
      },
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'LinkedIn described this shape in its "Streaming a Million Likes/Second" talk on live video. Viewers hold [[SSE]] connections to frontend servers, each frontend registers which live videos it has viewers for, and a dispatcher forwards each like or comment only to the frontends that registered. It is a channel per video with the subscription table made explicit.',
    },

    { kind: 'heading', text: 'Deep dive 2 — the hot video' },
    {
      kind: 'prose',
      text: 'One video, a million viewers, a thousand comments a second. Routing is solved; the volume is not. Grouping by video also breaks for exactly this video, because it cannot fit on one server. Keep a small table of hot videos: once a video passes what one server should hold (say 20,000 viewers, since busy connections cost far more than idle ones), the dispatcher gives it a set of servers and spreads new connections across them, growing the set as viewers arrive. Everything else stays on the ring.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Push every comment to every viewer as it arrives',
          text: 'A billion pushes a second. The phones that keep up render an unreadable blur; the ones that cannot fall behind, buffer, and stall the app.',
        },
        {
          grade: 'good',
          title: 'Batch per tick',
          text: 'Each realtime server buffers for 250 ms and sends one frame with whatever arrived. Frames drop from a thousand a second per viewer to four, which saves system calls and mobile radio wake-ups. The bytes, and the blur, are unchanged.',
        },
        {
          grade: 'great',
          title: 'Cap what each viewer receives, and choose it',
          text: "Set a budget, say ten comments a second per viewer, and fill it by rank: the broadcaster's comments, then the viewer's friends, then the best of the rest plus a random sample so the stream still feels alive. Load becomes viewers × budget instead of viewers × comment rate. Everything is still stored, so scrolling back shows all of it.",
        },
        {
          grade: 'best',
          title: 'Choose once at the source, personalise at the edge, fan out through a tree',
          text: "A per-video aggregator ranks each tick's comments once and emits one batch. Regional relays receive it and forward it to the edge servers holding that video's viewers, about fifty in total at 20,000 viewers each. The edge server knows its viewers, so it adds the few comments personal to each (friends, their own) just before pushing. Ranking runs once instead of a million times, and every tier sends a handful of copies, not a million.",
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'The hot video before and after each lever. Every step is an order of magnitude or more.',
      figure: {
        kind: 'scale',
        items: [
          { label: 'Every comment to every viewer', display: '1B pushes/s', value: 1e9, tone: 'alert' },
          { label: 'Capped at ten per viewer per second', display: '10M comments/s', value: 1e7, tone: 'streak' },
          { label: 'Batched into frames every 250 ms', display: '4M frames/s', value: 4e6, tone: 'line' },
          { label: 'Batches crossing the network to edge servers', display: '200/s', value: 200, tone: 'mastered' },
        ],
        note: 'Sampling bounds what each viewer receives. Grouping and the fan-out tree bound what crosses the network between tiers.',
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Treating the hot video as a bigger average video and solving it with more servers. A thousand comments a second is not a throughput problem; it is a product decision about what a person can read. The fan-out maths only works once that decision is made, so make it out loud.',
    },
  ],
}
