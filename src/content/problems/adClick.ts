import type { Problem } from '../types'

export const adClick: Problem = {
  id: 'ad-click',
  title: 'Design an ad click aggregator',
  kind: 'hld',
  category: 'data',
  difficulty: 'hard',
  brief:
    'Advertisers need near-real-time counts of clicks on their ads, sliced by campaign and by minute. Peak is a million clicks per second, and advertisers are billed from these numbers.',
  patterns: ['scaling-writes', 'longrunning'],
  suggests: ['a-writes', 'c-queues'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Separated the click redirect path from the aggregation path' },
    { id: 'r2', bar: 'must', criterion: 'Used a stream rather than writing each click to a database' },
    { id: 'r3', bar: 'must', criterion: 'Aggregated in windows rather than storing every raw click for queries' },
    { id: 'r4', bar: 'must', criterion: 'Kept the user-facing redirect fast and independent of aggregation' },
    { id: 'r5', bar: 'senior', criterion: 'Chose a partition key that avoids a hot partition' },
    { id: 'r6', bar: 'senior', criterion: 'Handled duplicate events with an idempotency key' },
    { id: 'r7', bar: 'senior', criterion: 'Distinguished event time from processing time and handled late arrivals' },
    { id: 'r8', bar: 'senior', criterion: 'Served queries from precomputed rollups, not raw events' },
    { id: 'r9', bar: 'staff', criterion: 'Reconciled the fast path against a batch recompute, since this drives billing' },
    { id: 'r10', bar: 'staff', criterion: 'Addressed fraud or bot filtering as a distinct concern' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'A user who clicks an ad is redirected to the advertiser\'s site.',
        'Advertisers query click counts per ad and per campaign, by minute, over any time range.',
        'Out of scope: ad serving and targeting, conversion tracking, the billing system itself.',
      ],
    },
    {
      kind: 'prose',
      text: 'Two very different things share this system, and separating them is the first real decision. The **redirect** is user-facing and must be a few milliseconds. The **aggregation** is advertiser-facing and can be seconds behind. Do not let the second slow the first.',
    },
    {
      kind: 'prose',
      text: 'Non-functional: 1M clicks/sec at peak. Dashboards fresh within about a minute. And because this drives billing, the numbers must eventually be **exact** — which is a stronger requirement than most streaming systems carry.',
    },
    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'prose',
      text: '`Ad` (its campaign and landing page), `Campaign`, `Click` (a unique `clickId`, the ad, the time it happened, device and source signals), and `Rollup`: a count for one ad and one minute, the thing every query actually reads.',
    },
    { kind: 'heading', text: '[[API]]' },
    {
      kind: 'code',
      code: `GET /click/{adId}?imp=<impressionId>
      -> 302 Location: <landing page>

GET /ads/{adId}/clicks?from=&to=&granularity=minute
      -> { buckets: [{ start, count }] }
GET /campaigns/{id}/clicks?from=&to=&granularity=
      -> same shape`,
      caption: 'The redirect is the user\'s endpoint; the queries are the advertiser\'s. They share no code path.',
    },
    { kind: 'heading', text: 'Data flow' },
    {
      kind: 'list',
      ordered: true,
      items: [
        'The redirect validates the click, emits an event carrying a `clickId`, and returns the 302.',
        'Kafka holds the event, partitioned so one hot ad cannot saturate a partition.',
        'Flink deduplicates on `clickId`, filters bot traffic, and counts per ad per minute by event time.',
        'Rollups land in an [[OLAP]] store; raw events land in blob storage as the permanent record.',
        'A nightly batch recomputes closed periods from the raw events and overwrites the rollups. Invoices read only those.',
      ],
    },
    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'From click to dashboard: the user leaves at the redirect, and everything after it is asynchronous.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Click', to: 'GET /click' },
          { label: 'Redirect service', sub: 'validate, emit, 302', tone: 'line', to: 'event' },
          { label: 'Kafka', sub: 'partitioned stream', to: 'consume' },
          { label: 'Flink', sub: 'windowed aggregation', to: 'rollups' },
          { label: 'OLAP store', sub: 'per ad, per minute', to: 'query' },
          { label: 'Dashboard' },
        ],
        note: 'Raw events also go to blob storage, which the nightly batch reads.',
      },
    },
    {
      kind: 'prose',
      text: 'Walk the endpoints. The redirect does nothing but emit an event, so its latency is independent of everything downstream. The query endpoints read precomputed rollups, never raw clicks. The bottlenecks to note: ingesting a million events a second without a hot partition, putting late clicks in the right minute, and getting numbers exact enough to bill from.',
    },
    { kind: 'heading', text: 'Deep dive 1 — ingesting a million per second' },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'A database insert per click. A million rows a second is far beyond a transactional database, and you have put a write on the path a user is waiting on. The redirect should do nothing but validate, emit an event, and return a 302.',
    },
    {
      kind: 'prose',
      text: 'Kafka absorbs the volume — around 1M messages/sec per broker, and you partition across several. The **partition key** is the decision that matters: partition by `adId` and a single viral ad saturates one partition. Partition by `adId + random bucket` and load spreads while all events for one ad still land in a known, bounded set of partitions that the aggregator can combine.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Partition by `adId`',
          text: 'Each ad\'s events are together, which keeps counting simple. One viral ad then saturates one partition and one consumer while the rest idle.',
        },
        {
          grade: 'good',
          title: 'Partition at random',
          text: 'Load is perfectly even. But every partition now holds every ad, so the aggregator must reshuffle the whole stream before it can count.',
        },
        {
          grade: 'best',
          title: 'Partition by `adId` plus a small bucket',
          text: 'Hot ads spread across N partitions, and each ad\'s events sit in a known handful of them. Count each sub-key, then sum N partial counts per ad per minute.',
        },
      ],
    },
    { kind: 'heading', text: 'Deep dive 2 — event time and late arrivals' },
    {
      kind: 'prose',
      text: 'A click happens at 12:00:59 and arrives at 12:01:03 — a phone was in a tunnel, or a retry fired. If you aggregate by **processing time** it lands in the wrong minute and the advertiser\'s per-minute chart is wrong.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Processing time',
        points: ['Simple — bucket by arrival', 'No waiting', 'Late events land in the wrong bucket'],
      },
      right: {
        title: 'Event time with a watermark',
        points: [
          'Bucket by when the click actually happened',
          'A watermark says "no more events before T expected"',
          'You wait a little, and must still decide what to do with stragglers',
        ],
      },
      verdict: 'Event time. Hold each window briefly past its close, then emit — and route anything later than the allowed lateness to a correction path rather than dropping it silently.',
    },
    { kind: 'heading', text: 'Deep dive 3 — exactness, because this is billing' },
    {
      kind: 'prose',
      text: 'Streaming gives you fast and approximately right. Billing needs exactly right. The standard answer is to run both and reconcile.',
    },
    {
      kind: 'figure',
      caption: 'Two paths over the same events: one fast and approximate, one slow and exact.',
      figure: {
        kind: 'split',
        left: {
          title: 'Fast path',
          tone: 'line',
          nodes: [
            { label: 'Stream', to: 'windows' },
            { label: 'Dashboard', sub: 'seconds behind', tone: 'line' },
          ],
          cost: 'Approximately right, immediately.',
        },
        right: {
          title: 'Slow path',
          tone: 'mastered',
          nodes: [
            { label: 'Raw events in storage', to: 'nightly batch' },
            { label: 'Invoices', sub: 'exact', tone: 'mastered' },
          ],
          cost: 'Exactly right, tomorrow.',
        },
        verdict: 'Dashboards read the fast path. Bills are generated from the batch numbers — never the streamed ones.',
      },
    },
    {
      kind: 'list',
      items: [
        '**Fast path** — Flink windows into an OLAP store, seconds behind, drives dashboards.',
        '**Slow path** — raw events also land in blob storage; a nightly batch recomputes the same aggregates from the complete record, catching late arrivals and reprocessing anything the stream got wrong.',
        '**Reconciliation** — the batch result overwrites the fast path for closed periods. Invoices are generated from the batch numbers, never the streamed ones.',
      ],
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Every event carries a client-generated `clickId`, and the aggregator deduplicates on it within the window. At-least-once delivery means duplicates are normal operation — without idempotency you over-bill advertisers, which is a considerably worse failure than a slow dashboard.',
    },
    {
      kind: 'prose',
      text: 'Fraud is a genuinely separate concern and worth naming rather than folding into aggregation: a filtering stage between ingestion and aggregation drops obvious bot traffic, and it needs its own signals and its own review path. Advertisers dispute counts, so the pipeline has to be able to explain a number, not just produce it.',
    },
  ],
  followups: [
    {
      q: 'Flink advertises exactly-once processing. Why not bill straight from the stream?',
      a: 'Exactly-once covers Flink\'s own state and its transactional sinks. It does not cover a client that retried and produced a second event, clicks later than the allowed lateness, or a bug you need to reprocess around. The batch over the raw record is the independent check that billing needs.',
    },
    {
      q: 'An advertiser disputes last Tuesday\'s count. How do you answer?',
      a: 'Raw events are immutable in blob storage, partitioned by hour, so you can recompute exactly that ad over exactly that period. Keep the fraud filter\'s decisions with reasons too, so you can show which clicks were excluded and why.',
    },
    {
      q: 'Someone queries a year of data at minute granularity. How does that stay fast?',
      a: 'Roll up at several granularities — minute, hour, day — and answer each query from the coarsest one that fits. Minute rollups can expire after a few weeks, because nobody needs a year at minute resolution. Column stores such as Druid, Pinot or ClickHouse are built for exactly this read.',
    },
    {
      q: 'Kafka is unavailable for ten minutes. What happens to clicks?',
      a: 'The redirect must still return its 302 — the user is not waiting on your analytics. Spool events to local disk on the redirect hosts and replay them when Kafka returns. Event-time windows then put the replayed clicks back in the right minutes.',
    },
  ],
}
