import type { Pattern } from './types'

/**
 * The recognition layer. Almost every question is two or three of these wearing a
 * product's clothes — learn the tells and most of a design becomes recall.
 */
export const patterns: Pattern[] = [
  {
    id: 'realtime',
    name: 'Real-time updates',
    tell: '"live", "as it happens", "without refreshing"',
    move: 'Polling < SSE < WebSocket, in that order of cost. Behind it, pub/sub to decouple, or stateful servers on a consistent-hash ring when there is real per-connection work.',
    showsUpIn: ['WhatsApp', 'Live Comments', 'Google Docs'],
  },
  {
    id: 'longrunning',
    name: 'Long-running tasks',
    tell: '"encode", "process", "generate" — anything past a few seconds',
    move: 'Validate and acknowledge immediately, push a job to a queue, workers consume it. Status endpoint, retries with backoff, dead-letter queue for the failures.',
    showsUpIn: ['YouTube', 'Report generation'],
  },
  {
    id: 'contention',
    name: 'Contention',
    tell: '"book", "reserve", "bid", "limited", "first come"',
    move: 'Optimistic concurrency on the write plus a reservation that expires — status and expiry checked in one short transaction, or a Redis lock with a TTL. Never a long-held database lock.',
    showsUpIn: ['Ticketmaster', 'Online Auction', 'Flash Sale'],
  },
  {
    id: 'scaling-reads',
    name: 'Scaling reads',
    tell: 'a feed, a profile page, 100:1 read/write',
    move: 'Index → denormalise the hot path → read replicas → cache → CDN. Then own the two costs you just created: replication lag and cache invalidation.',
    showsUpIn: ['Instagram', 'News Feed'],
  },
  {
    id: 'scaling-writes',
    name: 'Scaling writes',
    tell: 'events, clicks, metrics, millions per second',
    move: 'Shard on a key that spreads evenly, partition vertically by data type, batch to amortise per-write overhead, and put a queue in front so bursts shed rather than topple.',
    showsUpIn: ['Ad Click Aggregator', 'Metrics Monitoring'],
  },
  {
    id: 'blobs',
    name: 'Large blobs',
    tell: 'video, images, file sync',
    move: 'Presigned URL straight to blob storage, storage event notifies your service, CDN with signed URLs on the way out. Resumable multipart uploads with progress.',
    showsUpIn: ['Dropbox', 'YouTube'],
  },
  {
    id: 'multistep',
    name: 'Multi-step processes',
    tell: '"order", "onboarding", "payment", external dependencies',
    move: 'Each step emits an event that triggers the next, with state persisted between them. Idempotency keys throughout. Name Temporal or Step Functions and say what they buy you.',
    showsUpIn: ['Payment System', 'Order fulfilment'],
  },
  {
    id: 'proximity',
    name: 'Proximity',
    tell: '"near me", "within 5 km", a map',
    move: 'Geospatial index — PostGIS, Redis geo types, or Elasticsearch geo queries. Only genuinely needed past a few hundred thousand entities; below that, say so and skip it.',
    showsUpIn: ['Uber', 'Yelp', 'Local Delivery'],
  },
]

const byId = new Map(patterns.map((p) => [p.id, p]))
export function getPattern(id: string): Pattern | undefined {
  return byId.get(id)
}
