import type { Problem } from '../types'

export const airbnb: Problem = {
  id: 'airbnb',
  title: 'Design Airbnb',
  kind: 'hld',
  category: 'commerce',
  difficulty: 'medium',
  brief:
    'Guests search for somewhere to stay in a city for specific dates, then book it. Hosts decide which nights their place is available.',
  patterns: ['contention', 'scaling-reads', 'proximity', 'multistep'],
  suggests: ['a-contention', 'c-search', 'c-modelling', 'a-multistep'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to search by place and dates, view a listing, and book, and named what is out of scope' },
    { id: 'r2', bar: 'must', criterion: 'Split consistency by path: search may be seconds stale, booking must be strongly consistent' },
    { id: 'r3', bar: 'must', criterion: 'Modelled Listing, Booking and the calendar, with a stay as a half-open date range' },
    { id: 'r4', bar: 'must', criterion: 'Identified overlapping bookings as the central correctness problem before being prompted' },
    { id: 'r5', bar: 'senior', criterion: 'Made overlap impossible in the database, with an exclusion constraint or a conditional per-night claim, not check-then-insert' },
    { id: 'r6', bar: 'senior', criterion: 'Held the dates with an expiry before authorising payment, and kept the payment call outside any database transaction' },
    { id: 'r7', bar: 'senior', criterion: 'Put availability into the search index and explained why post-filtering returns short, badly ranked pages' },
    { id: 'r8', bar: 'senior', criterion: 'Synced the index by CDC rather than dual writes, and kept the database as the final check' },
    { id: 'r9', bar: 'staff', criterion: 'Noticed that contention per listing is low, so the hard part is range overlap rather than a stampede' },
    { id: 'r10', bar: 'staff', criterion: 'Voided the authorisation when a hold expires mid-payment, so no guest pays for dates they do not hold' },
    { id: 'r11', bar: 'staff', criterion: 'Sized the hold by booking type: minutes for instant book, a day for a request to book' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Guests should be able to search for listings in a place for a range of dates, and see only the ones free for every night.',
        'Guests should be able to view a listing with its calendar and the total price for their dates.',
        'Guests should be able to book a listing for their dates — and no two bookings may ever overlap.',
        'Out of scope: reviews, messaging, host payouts, pricing suggestions. Hosts blocking nights stays in, because it writes to exactly what bookings write to.',
      ],
    },
    {
      kind: 'list',
      items: [
        '**No double booking.** Strong consistency on the booking path, whatever it costs in latency.',
        '**Search is available and fast:** p99 under 500 ms, and a few seconds stale is fine.',
        'Scale: assume 10 million listings, 100 million searches a day (about 1,200 a second, peaking near 5,000), and around a million bookings a day — about 12 a second.',
        'Roughly 100 searches for every booking. The read path is where the hardware goes; the write path is where the correctness goes.',
      ],
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Say the asymmetry out loud: contention here is **low**. One listing rarely has two guests checking out in the same second. But a stay is a range of nights, so the hard part is overlap, not a stampede. That sentence tells the interviewer you will not paste the Ticketmaster answer onto a different problem.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'list',
      items: [
        '`Listing` — the place: location, capacity, host, base nightly price.',
        '`Booking` — listing, guest, a stay of `[check_in, check_out)`, and a status: `held`, `requested`, `confirmed`, `released`, `cancelled`. A host\'s blocked nights are bookings with no guest, so one rule guards both.',
        '`NightlyPrice` — a host\'s override for one night. Only hosts write it, so nothing contends on it.',
        '`Payment` — the authorisation held on the guest\'s card while the booking settles.',
      ],
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'code',
      code: `GET  /search?bbox=&checkIn=&checkOut=&guests=&cursor=
       -> { results: ListingCard[], cursor }
GET  /listings/{id}?checkIn=&checkOut=
       -> Listing, unavailable ranges, total price
POST /bookings
       Idempotency-Key: <uuid>
       { listingId, checkIn, checkOut, guests, paymentMethodId }
       -> { bookingId, status: 'held' | 'confirmed' | 'requested' }
POST /listings/{id}/blocks                      (host only)
       { checkIn, checkOut }  -> { blockId }`,
    },
    {
      kind: 'prose',
      text: 'The guest and the host come off the auth token, never the body. Dates are plain calendar dates in the listing\'s own time zone, and `checkOut` is exclusive: a guest who leaves on the 15th frees the night of the 15th. The [[API]] takes an idempotency key on the booking because a guest on hotel wifi will press the button twice.',
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'Two paths with two consistency models, joined by change data capture.',
      figure: {
        kind: 'split',
        left: {
          title: 'Search path — available, seconds stale',
          tone: 'line',
          nodes: [
            { label: 'Guest', to: 'search' },
            { label: 'Search service', sub: 'place, dates, guests', to: 'query' },
            { label: 'Elasticsearch', sub: 'one doc per listing', tone: 'line' },
          ],
          cost: 'Scales out horizontally, and is allowed to be a few seconds behind.',
        },
        right: {
          title: 'Booking path — strongly consistent',
          tone: 'mastered',
          nodes: [
            { label: 'Guest', to: 'book' },
            { label: 'Booking service', sub: 'hold, authorise, confirm', to: 'claim dates' },
            { label: 'Postgres', sub: 'bookings and blocks', tone: 'mastered' },
          ],
          cost: 'The only place that decides whether a night is free.',
        },
        verdict: '[[CDC]] carries every booking and block from the right-hand side into the left-hand index within seconds. The index may lie briefly; the database never does.',
      },
    },
    {
      kind: 'list',
      items: [
        '**Search.** The search service turns the map viewport, or a geocoded city, into a bounding box and asks Elasticsearch for listings inside it that fit the guests and are free on the dates. No separate geospatial index is needed: a viewport is a bounding box, and Elasticsearch answers it natively. Bottleneck: availability changes with every booking — deep dive 3.',
        '**View a listing.** Details and photos barely change, so they come from a cache and a [[CDN]]. The unavailable ranges and the price for the requested dates are read from Postgres — a replica is fine — so the page is right even when the index is behind.',
        '**Book.** The booking service claims the dates, then holds the guest\'s payment, in that order. Two bottlenecks: two guests claiming overlapping dates (deep dive 1), and a payment call that is slow and can fail halfway (deep dive 2).',
        '**Block nights.** A host block goes through the same path as a booking, because a block and a booking competing for the same night are the same race.',
      ],
    },
    {
      kind: 'prose',
      text: 'Postgres is the source of truth: relational data with an invariant — no overlapping stays — that a database can enforce and application code cannot. One primary handles a dozen bookings a second without noticing, and read replicas take the listing pages. If you ever shard, shard by `listing_id`: every question the booking path asks is about one listing, which keeps the overlap rule local to one machine.',
    },

    { kind: 'heading', text: 'Deep dive 1 — calendar storage and double booking' },
    {
      kind: 'prose',
      text: 'Two guests want overlapping nights at the same flat. "Is anything overlapping?" and "insert my booking" are two statements, and under Postgres\'s default isolation level, read committed, both guests can pass the check before either writes. That is write skew, and locking the existing bookings cannot help, because the row they conflict on does not exist yet.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Check for overlap, then insert',
          text: 'Two statements with a gap between them. Both guests see free nights, both inserts succeed, and the host has two families arriving on the same evening.',
        },
        {
          grade: 'good',
          title: 'Lock the listing row, then check and insert',
          text: '`SELECT … FOR UPDATE` on the listing serialises its bookings for a few milliseconds. Correct, and per-listing contention is low enough that the queue stays short. The cost is discipline: every code path that writes a booking or a block must take the lock, and the one that forgets double-books.',
        },
        {
          grade: 'great',
          title: 'One row per night, claimed in one conditional update',
          text: 'Claim the nights with a single `UPDATE … WHERE booking_id IS NULL` over the date range, and roll back unless the row count equals the number of nights. Correctness lives in the rows. The cost: 365 rows per listing per year, 3.65 billion for ten million listings, created before anyone books.',
        },
        {
          grade: 'best',
          title: 'Stays as date ranges, guarded by an exclusion constraint',
          text: '`EXCLUDE USING gist (listing_id WITH =, stay WITH &&)` over active bookings — held, requested or confirmed. The database refuses any overlap, whichever code path wrote it, and a booking is one row instead of one per night.',
        },
      ],
    },
    {
      kind: 'prose',
      text: 'Pick the constraint. It turns "no double booking" from a rule every engineer has to remember into a property of the schema, and the second guest gets a clean constraint violation to turn into "those dates were just booked". It needs the `btree_gist` extension, and it is only enforceable because every row for one listing lives on one machine — which is the real reason to shard by listing.',
    },
    {
      kind: 'figure',
      caption: 'Half-open ranges: B overlaps A and is refused; C checks in on the day A checks out, and both stand.',
      figure: {
        kind: 'timeline',
        ticks: ['12 Jun', '14 Jun', '16 Jun', '18 Jun'],
        lanes: [
          {
            label: 'Guest A · 12–15 Jun',
            bars: [{ from: 0, to: 0.5, label: 'held', tone: 'line' }],
            outcome: { label: 'confirmed', tone: 'mastered' },
          },
          {
            label: 'Guest B · 14–17 Jun',
            bars: [{ from: 0.333, to: 0.833, label: 'overlaps A', tone: 'alert' }],
            outcome: { label: 'refused', tone: 'alert' },
          },
          {
            label: 'Guest C · 15–18 Jun',
            bars: [{ from: 0.5, to: 1, label: 'held', tone: 'line' }],
            outcome: { label: 'confirmed', tone: 'mastered' },
          },
        ],
        note: 'A stay is `[check-in, check-out)`. The night of the 15th belongs to C, so A leaving that morning and C arriving that afternoon is not a conflict.',
      },
    },
    {
      kind: 'prose',
      text: 'An abandoned checkout must stop blocking its dates. A constraint cannot mention the clock — its expression must give the same answer forever — so expiry is explicit: in the same transaction as a new claim, first mark this listing\'s overlapping holds whose `expires_at` has passed as `released`, then insert. Two guests racing for the same lapsed hold queue on its row lock, and the loser hits the constraint. No sweeper sits on the correctness path; a background job only tidies holds nobody has competed for.',
    },

    { kind: 'heading', text: 'Deep dive 2 — the booking flow and the payment hold' },
    {
      kind: 'prose',
      text: 'Booking spans two systems that cannot share a transaction: your database and the card network. Order the steps so every failure leaves something you can clean up.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Charge the card, then claim the dates',
          text: 'If the dates are gone, you refund. The guest sees a charge and a refund on their statement for a stay they never had, and the refund can take days to land.',
        },
        {
          grade: 'good',
          title: 'Claim and charge inside one database transaction',
          text: 'Never double-books, but the transaction stays open across a network call that takes a second or two and sometimes times out with no answer. Connections pile up, and a timeout leaves you holding a rollback for a charge that may have happened.',
        },
        {
          grade: 'great',
          title: 'Hold the dates with an expiry, then authorise',
          text: 'Insert the booking as `held` with `expires_at` fifteen minutes out and commit. Only then ask the processor to authorise — reserve the money on the card without taking it. Declined: release the hold and the nights free up at once. Approved: confirm, and capture.',
        },
        {
          grade: 'best',
          title: 'The same steps as a durable state machine',
          text: 'Each transition — `held → authorised → confirmed`, or `→ released` — is a conditional update committed before the next call, driven by a workflow engine such as Temporal, with the booking id as the idempotency key on every processor call. A crash anywhere resumes from the last committed state instead of leaving a mystery.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'Claim, authorise, confirm: each step is committed before the next call, so a crash anywhere leaves a state you can resume.',
      figure: {
        kind: 'sequence',
        actors: ['Guest', 'Booking service', 'Postgres', 'Processor'],
        steps: [
          { from: 0, to: 1, label: 'POST /bookings' },
          { from: 1, to: 2, label: 'insert hold, expires in 15 min' },
          { from: 2, to: 1, label: 'dates claimed', dashed: true },
          { from: 1, to: 3, label: 'authorise, capture later' },
          { from: 3, to: 1, label: 'authorised', dashed: true },
          { from: 1, to: 2, label: 'held → confirmed' },
          { from: 1, to: 0, label: 'booked', dashed: true, tone: 'mastered' },
        ],
        note: 'If the hold lapses before the authorisation lands, recovery voids the authorisation. The guest is never charged for dates they do not hold.',
      },
    },
    {
      kind: 'callout',
      tone: 'example',
      title: 'Instant Book and request to book',
      text: 'Airbnb runs both models. **Instant Book** confirms as soon as payment is authorised. A **request to book** gives the host 24 hours to accept, so the dates and the authorisation are held for a day, not fifteen minutes. The hold length is a property of the booking type, not a constant — and a day fits inside a card authorisation, which on most cards lapses after about a week.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Treating a processor timeout as a decline. A timeout means you do not know. The booking stays held, and recovery asks the processor what happened using the same idempotency key. Release the dates on a timeout and you can end up with a charged guest and no booking.',
    },

    { kind: 'heading', text: 'Deep dive 3 — searching by dates, and keeping the index in sync' },
    {
      kind: 'prose',
      text: '"Lisbon, 12 to 15 June, two guests" is a geo filter, an attribute filter, and an availability filter across three nights. Elasticsearch does the first two natively with a `geo_point` field. The third is the deep dive, because it is the one that changes every time someone books.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Ask Postgres at query time',
          text: 'Join the listings in the box against overlapping bookings on every search. An anti-join across millions of rows at 5,000 searches a second puts the read path on the database you kept for correctness.',
        },
        {
          grade: 'good',
          title: 'Search the index, then post-filter availability',
          text: 'Fetch the top 200 from Elasticsearch and ask the booking service which are free. Simple, until peak season: most are booked, pages come back with three results, and ranking was computed over places the guest cannot have.',
        },
        {
          grade: 'great',
          title: 'Index every free night',
          text: 'Each document carries its available dates, and the query requires all of them. Pagination is honest, but documents carry hundreds of dates, and requiring every night of the stay takes a `terms_set` query that grows with its length.',
        },
        {
          grade: 'best',
          title: 'Index the booked ranges, and exclude overlaps',
          text: 'Store each listing\'s held, booked and blocked stays as a `date_range` field, and filter out any listing with a range that intersects the request. A document holds a handful of ranges, the filter is one clause, and pages come back full.',
        },
      ],
    },
    {
      kind: 'prose',
      text: 'Now sync it. Do not have the booking service write to Postgres and then Elasticsearch: the second write fails sooner or later, and the two drift apart for good with nothing to notice. Use [[CDC]] instead. Debezium reads Postgres\'s write-ahead log and publishes each change to Kafka keyed by `listing_id`, so one listing\'s changes stay in order, and an indexer rewrites the document. Lag is a second or two.',
    },
    {
      kind: 'figure',
      caption: 'Change data capture: the index follows the database, in order per listing, and the booking path never touches it.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Postgres', sub: 'bookings, blocks', to: 'write-ahead log' },
          { label: 'Debezium', sub: 'reads the log', to: 'publish' },
          { label: 'Kafka', sub: 'keyed by listing_id', to: 'consume' },
          { label: 'Indexer', sub: 'rebuilds the doc', to: 'upsert' },
          { label: 'Elasticsearch', sub: 'booked ranges', tone: 'line' },
        ],
        note: 'If the indexer falls behind, search shows a few listings that were just booked. The listing page and the booking both read Postgres, so the worst case is a guest told "just booked" one click later.',
      },
    },
    {
      kind: 'callout',
      tone: 'say',
      text: '"The index is a hint; the database is the answer." Say it, then show where the answer gets checked: the listing page reads the calendar from Postgres, and the booking insert meets the constraint.',
    },
  ],
  followups: [
    {
      q: 'A host blocks some nights while a guest is halfway through checkout for them. Who wins?',
      a: 'Whoever commits first, because a block is a row in the same constrained table as bookings. If the guest\'s hold is already there, the block fails on the constraint and the host sees "these nights have a pending booking". If the block landed first, the guest\'s claim fails before any payment is attempted.',
    },
    {
      q: 'How do you handle time zones for check-in dates?',
      a: 'A night is a calendar date in the listing\'s own time zone, stored as a `date`, not a timestamp. "The night of 12 June" in Auckland is the same night whoever books it and wherever they are. Store a timestamp instead and listings far from your servers\' zone get their nights shifted by one.',
    },
    {
      q: 'How do you show a total price in search results without pricing every listing?',
      a: 'Index the base nightly price for filtering and sorting, and compute exact totals — per-night overrides, cleaning fee, weekly discounts — only for the twenty or so results on the page. The listing page recomputes it from Postgres, and the booking charges what the booking path computed, never what the search result said.',
    },
    {
      q: 'New Year\'s Eve: everyone searches the same city for the same nights. What breaks?',
      a: 'Search load spikes, so cache hot place-and-date queries for a few seconds and scale the search tier out. Most listings are booked, which is exactly when post-filtering would have produced empty pages — the indexed booked ranges keep them full. Contention per listing rises from one guest to a handful, which the constraint handles; the loser hears "just booked" before paying anything.',
    },
    {
      q: 'The authorisation succeeds, then your service crashes before confirming the booking. What happens?',
      a: 'The workflow resumes from the last committed state, `held`, and re-sends the authorisation with the same idempotency key, so the processor returns the authorisation it already made rather than a second one. If the hold lapsed in the meantime and someone else took the dates, recovery voids the authorisation. Nobody is charged for a booking that does not exist.',
    },
  ],
}
