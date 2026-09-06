import type { Problem } from '../types'

export const uber: Problem = {
  id: 'uber',
  title: 'Design Uber',
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
    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'flow',
      nodes: ['Driver app', 'Location service', 'Redis geo (in memory)', 'Matching service', 'Trip DB (Postgres)', 'Rider app'],
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
      kind: 'callout',
      tone: 'note',
      text: 'Worth naming: cell boundaries. Two drivers metres apart either side of a boundary get different hashes, so a real query checks neighbouring cells too and then filters by true distance.',
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
      kind: 'prose',
      text: 'The conditional write on the trip record is the correctness boundary underneath all of it: the assignment only commits if the driver is still unassigned. Even if every lock failed, you could not assign one driver twice.',
    },
    { kind: 'heading', text: 'Deep dive 3 — watching each other move' },
    {
      kind: 'prose',
      text: 'Once matched, both parties need the other\'s position a few times a second. That is real-time push — [[SSE]] is sufficient, since the rider sends nothing back on this channel.',
    },
    {
      kind: 'prose',
      text: 'Fan-out is unusually easy here, which is worth pointing out: a trip has exactly two participants, so there is no broadcast problem. The location service publishes to a per-trip channel and two subscribers receive it. Contrast that with the chat or feed problems where fan-out is the whole difficulty.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Durability differs per path, and saying so closes the loop cleanly. Losing a location update is invisible — another arrives in two seconds. Losing a trip record means an unpaid driver and an unbilled rider. One lives in memory; the other is an [[ACID]] transaction with a real audit trail.',
    },
  ],
}
