import type { Problem } from '../types'

export const adClick: Problem = {
  id: 'ad-click',
  title: 'Design an ad click aggregator',
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
      kind: 'prose',
      text: 'Two very different things share this system, and separating them is the first real decision. The **redirect** is user-facing and must be a few milliseconds. The **aggregation** is advertiser-facing and can be seconds behind. Do not let the second slow the first.',
    },
    {
      kind: 'prose',
      text: 'Non-functional: 1M clicks/sec at peak. Dashboards fresh within about a minute. And because this drives billing, the numbers must eventually be **exact** — which is a stronger requirement than most streaming systems carry.',
    },
    {
      kind: 'flow',
      nodes: ['Click', 'Redirect service (302)', 'Kafka', 'Flink windowed aggregation', 'OLAP store', 'Dashboard'],
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
}
