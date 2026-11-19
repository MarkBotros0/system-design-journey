import type { Problem } from '../types'

export const uber: Problem = {
  id: 'uber',
  title: 'Design Uber',
  kind: 'hld',
  category: 'location',
  difficulty: 'hard',
  brief:
    'Riders request a ride from where they are. Nearby drivers get offered it, one accepts, and both then watch each other move on a map.',
  patterns: ['proximity', 'contention', 'realtime'],
  suggests: ['a-proximity', 'a-contention', 'a-realtime'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to location updates / matching / trip tracking' },
    { id: 'r2', bar: 'must', criterion: 'Separated the driver-location write path from the matching read path' },
    { id: 'r3', bar: 'must', criterion: 'Chose a geospatial index and said why an ordinary index cannot serve it' },
    { id: 'r4', bar: 'must', criterion: 'Identified that a driver must not be matched to two rides' },
    { id: 'r5', bar: 'senior', criterion: 'Quantified the location write rate and sized it' },
    { id: 'r6', bar: 'senior', criterion: 'Kept live positions in memory rather than a disk-backed store' },
    { id: 'r7', bar: 'senior', criterion: 'Solved matching contention with a lock or conditional write, with a TTL' },
    { id: 'r8', bar: 'senior', criterion: 'Handled the offer timeout — a driver who never responds' },
    { id: 'r9', bar: 'staff', criterion: 'Made matching sequential-with-timeout rather than broadcast-to-all' },
    { id: 'r10', bar: 'staff', criterion: 'Addressed the trip record needing durability the location stream does not' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Drivers publish their location continuously.',
        'A rider requests a ride and is matched to one nearby driver.',
        'Both watch the other move for the duration of the trip.',
        'Out of scope: pricing, payments, ratings, pooling.',
      ],
    },
    {
      kind: 'prose',
      text: 'Do the arithmetic here, because it decides the storage: **1M active drivers × one update every 4 seconds = 250,000 writes/sec**, forever. That number rules out a disk-backed transactional store immediately and points at memory.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'The key insight to state early: driver locations and trip records are completely different data with completely different requirements. Locations are enormous-volume, ephemeral, and worthless once superseded. A trip is low-volume, permanent, and financially significant. Storing them the same way is the mistake.',
    },
    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'prose',
      text: '`Driver` (status, current position), `Rider`, `Trip` (rider, driver, pickup, drop-off, and a status that moves requested → matched → in progress → complete), and the `Location` update: tiny, constant, and thrown away as soon as the next one arrives.',
    },
    { kind: 'heading', text: '[[API]]' },
    {
      kind: 'code',
      code: `POST  /drivers/location   { lat, lng }        -> 200  // every ~4 s
POST  /trips              { pickup, dropoff } -> { tripId }
PATCH /trips/{id}         { action: 'accept' | 'decline' }
GET   /trips/{id}/live    -> event stream: position, status`,
      caption: 'One endpoint per requirement. The driver and rider come off the auth token, never the body.',
    },
    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'Two stores for two kinds of data: positions in memory, trips in a transactional database.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Driver app', to: 'position every 4 s' },
          { label: 'Location service', to: 'overwrite' },
          { label: 'Redis geo', sub: 'in memory, 250k writes/s', tone: 'line', to: 'nearby drivers' },
          { label: 'Matching service', sub: 'offers, locks', to: 'conditional write' },
          { label: 'Trip DB', sub: 'Postgres, durable', tone: 'mastered', to: 'live updates' },
          { label: 'Rider app' },
        ],
      },
    },
    {
      kind: 'prose',
      text: 'Walk the endpoints. Location updates are pure writes into memory. A trip request asks the matching service for nearby drivers and offers the ride. Accepting writes the trip row. The bottlenecks to note: a two-dimensional query at that write rate, two riders racing for one driver, and pushing positions to both parties during the trip.',
    },
    { kind: 'heading', text: 'Deep dive 1 — finding nearby drivers' },
    {
      kind: 'prose',
      text: '"Drivers within 2 km" is a two-dimensional range query, which ordinary B-tree indexes cannot serve — one index on latitude and another on longitude gives a bounding box and a lot of wasted rows.',
    },
    {
      kind: 'prose',
      text: 'Geospatial indexes reduce two dimensions to one so it can be range-scanned: geohashing interleaves latitude and longitude bits so a shared prefix means physical proximity. **Redis geo commands** are the fit here because the write rate dominates — positions live in memory, are overwritten constantly, and nothing is lost if a few updates vanish. [[PostGIS]] is more capable and entirely the wrong tool at 250k writes/sec.',
    },
    {
      kind: 'compare',
      left: {
        title: 'PostGIS',
        points: [
          'Rich, exact spatial queries',
          'Durable, transactional, on disk',
          'Every overwrite is a disk write, 250,000 times a second',
        ],
      },
      right: {
        title: 'Redis geo',
        points: [
          'A geohash in a sorted set, held in memory',
          'An overwrite is cheap, a radius query is fast',
          'Lost on a crash, and drivers repopulate it within seconds',
        ],
      },
      verdict: 'Redis geo. The data is worthless four seconds after it is written, so durability is a cost with no benefit.',
    },
    {
      kind: 'callout',
      tone: 'note',
      text: 'Worth naming: cell boundaries. Two drivers metres apart either side of a boundary get different hashes, so a real query checks neighbouring cells too and then filters by true distance.',
    },
    { kind: 'heading', text: 'Deep dive 2 — matching without double-assigning' },
    {
      kind: 'prose',
      text: 'This is the contention pattern, and it is the deep dive that decides the interview. Two riders request simultaneously in the same area and the nearest driver appears in both candidate lists.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Broadcast the ride to every nearby driver, first to accept wins',
          text: 'Every driver\'s phone lights up, most lose the race, and you have taught your drivers to ignore offers. It also puts the race in the client, which is the worst place for it.',
        },
        {
          grade: 'good',
          title: 'Pick the best driver, mark them busy in the database',
          text: 'Correct if the write is conditional on them still being available. But a driver who never responds stays marked busy until something notices.',
        },
        {
          grade: 'best',
          title: 'Sequential offers, each holding a lock with a TTL',
          text: 'Rank candidates, offer to the first, and hold `driver:{id}` with `SET NX EX 15`. They get 15 seconds. Accept → the lock becomes an assignment and the trip row is written conditionally. Decline or timeout → the lock expires on its own and you offer the next driver. The [[TTL]] is what makes an unresponsive driver a non-event rather than an incident.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'Sequential offers, each holding a short lock — so an unresponsive driver costs fifteen seconds, not an incident.',
      figure: {
        kind: 'timeline',
        ticks: ['0s', '15s', '30s'],
        lanes: [
          {
            label: 'Driver 1 — nearest',
            bars: [{ from: 0, to: 0.5, label: 'offered · locked', tone: 'line' }],
            outcome: { label: 'no response', tone: 'streak' },
          },
          {
            label: 'Driver 2',
            bars: [{ from: 0.5, to: 0.8, label: 'offered · locked', tone: 'line' }],
            outcome: { label: 'accepts', tone: 'mastered' },
          },
        ],
        note: 'Broadcasting to everyone instead would light up every phone nearby and teach drivers to ignore offers.',
      },
    },
    {
      kind: 'prose',
      text: 'The conditional write on the trip record is the correctness boundary underneath all of it: the assignment only commits if the driver is still unassigned. Even if every lock failed, you could not assign one driver twice.',
    },
    { kind: 'heading', text: 'Deep dive 3 — watching each other move' },
    {
      kind: 'prose',
      text: 'Once matched, each party needs the other\'s position every few seconds. That is real-time push — [[SSE]] is sufficient, since positions go up through their own endpoint and nothing flows back on this channel.',
    },
    {
      kind: 'compare',
      left: {
        title: '[[WebSocket]]',
        points: [
          'Both directions on one connection',
          'Needs its own load balancing and reconnection logic',
          'Nothing needs to flow back on this channel',
        ],
      },
      right: {
        title: 'SSE',
        points: [
          'Server to client over plain [[HTTP]]',
          'Reconnects and resumes on its own',
          'Positions already go up through their own endpoint',
        ],
      },
      verdict: 'SSE. The traffic only flows one way, so the simpler channel is the right one.',
    },
    {
      kind: 'prose',
      text: 'Fan-out is unusually easy here, which is worth pointing out: a trip has exactly two participants, so there is no broadcast problem. The location service publishes to a per-trip channel and two subscribers receive it. Contrast that with the chat or feed problems where fan-out is the whole difficulty.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Durability differs per path, and saying so closes the loop cleanly. Losing a location update is invisible — another arrives in four seconds. Losing a trip record means an unpaid driver and an unbilled rider. One lives in memory; the other is an [[ACID]] transaction with a real audit trail.',
    },
  ],
  followups: [
    {
      q: 'The driver\'s phone loses signal halfway through a trip. What happens?',
      a: 'The trip itself is server-side and durable, so nothing about it is lost. The app buffers its position trace locally and uploads it on reconnect, which keeps the route and the fare correct. The rider sees the car stop moving, and support is alerted only if the gap passes a threshold.',
    },
    {
      q: 'One Redis instance cannot hold every driver in the world. How do you split it?',
      a: 'By geography. Matching is always local, so shard by city or region and a query almost never crosses shards. Near a boundary, query the neighbouring shard as well. Uber built H3, a hexagonal grid, partly so cells have uniform neighbours for exactly this.',
    },
    {
      q: 'A concert ends and 20,000 people request rides at once. Does greedy nearest-driver still work?',
      a: 'It works, but it matches badly: the first rider takes the driver who would have suited the next rider better. Batch instead — collect requests for a second or two and solve the assignment for the whole batch. Riders barely notice the wait, and total pickup time drops.',
    },
    {
      q: 'The rider cancels while an offer is outstanding. What has to happen?',
      a: 'The trip moves to cancelled with a conditional write, so it cannot also become accepted. The matching service releases the driver lock only if it still owns it, and tells the driver the offer is withdrawn. If the driver accepts in the same instant, the conditional write decides who wins.',
    },
  ],
}
