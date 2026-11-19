import type { Problem } from '../types'

export const ticketmaster: Problem = {
  id: 'ticketmaster',
  title: 'Design Ticketmaster',
  kind: 'hld',
  category: 'commerce',
  difficulty: 'medium',
  brief:
    'Users browse events, search for them, and book tickets to a specific seat. Popular events sell out in seconds.',
  patterns: ['contention', 'scaling-reads'],
  suggests: ['a-contention', 'c-search', 'c-cap'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to view / search / book, and named what is out of scope' },
    { id: 'r2', bar: 'must', criterion: 'Split consistency by path — availability for browsing, strong for booking' },
    { id: 'r3', bar: 'must', criterion: 'Modelled Event, Venue, Ticket, Booking with a per-seat Ticket row' },
    { id: 'r4', bar: 'must', criterion: 'Identified double-booking as the central problem before being prompted' },
    { id: 'r5', bar: 'senior', criterion: 'Rejected a long-held database lock and said why' },
    { id: 'r6', bar: 'senior', criterion: 'Proposed a reservation that expires — TTL lock or implicit status' },
    { id: 'r7', bar: 'senior', criterion: 'Solved the read path: how the seat map shows held seats' },
    { id: 'r8', bar: 'senior', criterion: 'Moved search to an inverted index and named CDC as the sync mechanism' },
    { id: 'r9', bar: 'staff', criterion: 'Answered what happens when Redis dies — degrade, optimistic concurrency still holds' },
    { id: 'r10', bar: 'staff', criterion: 'Handled the TTL expiring mid-payment, including the refund path' },
    { id: 'r11', bar: 'staff', criterion: 'Proposed a virtual waiting queue for extreme-demand on-sales' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'View an event, including its seat map.',
        'Search events by name, date, performer.',
        'Book one or more specific seats.',
        'Out of scope: dynamic pricing, admin event creation, viewing past bookings.',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional, and this is the interesting part: **availability for browsing and search, strong consistency for booking**. Search under 500 ms. Roughly 100:1 reads. Up to 10 million concurrent users on a single popular on-sale.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Splitting consistency by path, out loud, in the requirements phase sets up the entire rest of the interview. It tells the interviewer you know where the hard part is before you have drawn anything.',
    },
    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'prose',
      text: '`Event`, `Venue` (with a seat map), `Performer`, `Ticket` (**one row per physical seat**, generated when the event is created), `Booking` (groups tickets from one transaction).',
    },
    { kind: 'heading', text: '[[API]]' },
    {
      kind: 'code',
      code: `GET  /events/{id}                 -> Event, Venue, Performer, Ticket[]
GET  /events/search?q=&from=&to=  -> Event[]
POST /bookings/{eventId}/hold
       { ticketIds: string[] }  -> { expiresAt }
POST /bookings/{eventId}
       { ticketIds: string[], payment: … }  -> { bookingId }`,
      caption: 'Booking is two calls: hold the seats, then pay. The hold is what expires.',
    },
    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'Stateless services over one transactional source of truth, with a lock store and a search index beside it.',
      figure: {
        kind: 'stack',
        layers: [
          { label: 'Client', sub: 'web and mobile' },
          { label: 'API gateway', sub: 'auth, routing, rate limits' },
          { label: 'Event · Search · Booking services', sub: 'stateless, scaled horizontally', tone: 'line' },
          { label: 'Redis · Elasticsearch', sub: 'seat holds with an expiry · the search index' },
          { label: 'Postgres', sub: 'events, tickets, bookings — the source of truth', tone: 'mastered' },
        ],
        note: 'Stripe handles payment, called from the booking service.',
      },
    },
    {
      kind: 'prose',
      text: 'Postgres is the source of truth for events, tickets and bookings — it is transactional data with real relationships and it needs [[ACID]] on the booking path. Stripe handles payment.',
    },
    {
      kind: 'prose',
      text: 'Walk it endpoint by endpoint. `GET /events/{id}` is a read of data that barely changes. Search is a query a B-tree cannot serve well. `POST /bookings` is where two people race for one seat. Note three bottlenecks — double booking, search latency, and the on-sale spike — and they become the deep dives.',
    },
    { kind: 'heading', text: 'Deep dive 1 — preventing double booking' },
    {
      kind: 'prose',
      text: 'The core insight: a reservation is **not a transaction**. It is a business-level hold lasting five to ten minutes, and it must survive a user who closes the tab.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: '`SELECT … FOR UPDATE` held through checkout',
          text: 'Ten minutes of held row locks. Contention, deadlocks, exhausted connections, and unrecoverable state if the app dies holding one.',
        },
        {
          grade: 'good',
          title: 'Status column and expiry, swept by cron',
          text: '`status` plus `expires_at`; a cron resets expired holds. Lag between expiry and sweep, and a dead cron silently freezes inventory.',
        },
        {
          grade: 'great',
          title: 'Implicit status in one short transaction',
          text: 'Treat available as *available OR (reserved AND expired)* and claim it atomically. No cron, no lag, correctness from the database. Slightly slower reads, less readable table.',
        },
        {
          grade: 'best',
          title: 'Redis lock with a TTL',
          text: '`SET ticket:123 user:9 NX EX 600`. Atomic, fast under the concurrency an on-sale produces, and expiry is automatic. The tickets table then only ever holds *available* or *booked*.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'A seat held by an expiry, and the three ways the hold can end.',
      figure: {
        kind: 'timeline',
        ticks: ['0:00 — held', '5:00', '10:00 — expiry'],
        lanes: [
          {
            label: 'Buys at 5:00',
            bars: [{ from: 0, to: 0.5, label: 'held', tone: 'line' }],
            outcome: { label: 'booked', tone: 'mastered' },
          },
          {
            label: 'Abandons the cart',
            bars: [{ from: 0, to: 1, label: 'held until it expires', tone: 'line' }],
            outcome: { label: 'back on sale', tone: 'neutral' },
          },
          {
            label: 'Pays at 10:01',
            bars: [{ from: 0, to: 1, label: 'held', tone: 'line' }],
            outcome: { label: 'rejected · auto-refund', tone: 'alert' },
          },
        ],
        note: 'The tickets table only ever holds available or booked. The hold itself lives in Redis, with the expiry doing the cleanup.',
      },
    },
    {
      kind: 'prose',
      text: 'Choosing the lock is the easy half. The follow-ups — the seat map\'s read path, Redis dying, and the [[TTL]] expiring mid-payment — are what separate levels, and you should raise all three unprompted.',
    },
    { kind: 'heading', text: 'Deep dive 2 — search under 500 ms' },
    {
      kind: 'prose',
      text: 'A B-tree only matches from the start of a string — "Swift" will not find "Taylor Swift". Elasticsearch with an inverted index matches any word, plus fuzzy matching so "Tayler" still finds her, which matters because people misspell names constantly. Sync from Postgres by **[[CDC]]**; the second of lag is fine for search and never touches the booking path.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Postgres full-text search',
        points: [
          'A [[GIN]] index, no new system to run',
          'Results are transactionally fresh',
          'Weak fuzzy matching and relevance',
          'Search load lands on the booking database',
        ],
      },
      right: {
        title: 'Elasticsearch, fed by CDC',
        points: [
          'Fuzzy matching, relevance and facets built in',
          'Search traffic never touches Postgres',
          'About a second of lag, and one more system',
        ],
      },
      verdict: 'Elasticsearch. During an on-sale the booking database must spend every cycle on bookings, and a second of search staleness costs nobody anything.',
    },
    { kind: 'heading', text: 'Deep dive 3 — ten million people, one on-sale' },
    {
      kind: 'prose',
      text: 'Cache the event, venue and performer aggressively — they barely change. Scale the stateless event service horizontally. Then the real answer: a **virtual waiting queue** in front of booking.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Autoscale and hope',
          text: 'Capacity arrives minutes after the spike, and the seat map is gone in seconds either way.',
        },
        {
          grade: 'good',
          title: 'Cache the static data, scale the stateless tier',
          text: 'Event pages survive. But ten million people still race for twenty thousand seats, and the booking path takes the whole stampede.',
        },
        {
          grade: 'best',
          title: 'A virtual waiting queue in front of booking',
          text: 'Admit users in batches the booking service can serve. Demand is metered into capacity, and everyone waiting gets an honest position.',
        },
      ],
    },
    {
      kind: 'flow',
      nodes: ['Join queue (Redis sorted set by arrival)', '[[SSE]] holds position', 'Admit in batches', 'admitted:{eventId} set', 'Booking service checks membership'],
    },
    {
      kind: 'prose',
      text: 'Without it, the seat map empties faster than anyone can click and every user has a terrible time while your booking service melts. With it, demand is metered into capacity the system can actually serve, and users get an honest position and wait estimate instead of a race they cannot win.',
    },
  ],
  followups: [
    {
      q: 'Holds live in Redis. How does the seat map show which seats are taken?',
      a: 'It cannot read them from Postgres. Keep a sorted set per event scored by expiry: `ZADD event:{id}:held <expiresAt> ticketId`. The seat map marks a seat held only while its score is in the future, and stale entries are trimmed lazily with `ZREMRANGEBYSCORE`.',
    },
    {
      q: 'Redis goes down mid on-sale. What happens?',
      a: 'Correctness holds — optimistic concurrency on the booking write still prevents double-booking. A user may lose a race after paying, which you resolve with an automatic refund. That is far better than every seat appearing unavailable.',
    },
    {
      q: 'The hold\'s TTL expires while the user is still paying. Now what?',
      a: 'Once the hold lapses, someone else may take the seat; the conditional booking write then fails and you refund automatically. Extend the hold when payment begins, so it rarely gets that far.',
    },
    {
      q: 'What stops one account holding fifty seats and never buying?',
      a: 'Cap seats per booking and per account per event, enforced when the hold is taken, not at checkout. The expiry bounds the damage of whatever slips through. Bots are the waiting queue\'s job: admission is where you challenge and rate-limit.',
    },
  ],
}
