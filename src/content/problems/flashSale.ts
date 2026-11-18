import type { Problem } from '../types'

export const flashSale: Problem = {
  id: 'flash-sale',
  title: 'Design a flash sale',
  kind: 'hld',
  category: 'commerce',
  difficulty: 'hard',
  brief:
    'A retailer sells 10,000 units of one product at a steep discount, starting at noon. Around a million people will be waiting when it opens. Do not sell more than you have.',
  patterns: ['contention', 'scaling-reads', 'scaling-writes'],
  suggests: ['a-contention', 'a-reads', 'c-caching', 'c-queues', 'db-locking'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to queue, reserve, pay and release, with fixed stock and a fixed start time' },
    { id: 'r2', bar: 'must', criterion: 'Stated never oversell as the hard requirement, and that briefly underselling is acceptable' },
    { id: 'r3', bar: 'must', criterion: 'Identified the spike as the main threat, and that almost everyone must be turned away' },
    { id: 'r4', bar: 'must', criterion: 'Made taking a unit atomic rather than read, check, then write' },
    { id: 'r5', bar: 'senior', criterion: 'Kept the hot path off the database, with an atomic Redis decrement shedding load in front of it' },
    { id: 'r6', bar: 'senior', criterion: 'Put reservations on a short expiry and returned lapsed units without a long-held lock or a sweeper on the critical path' },
    { id: 'r7', bar: 'senior', criterion: 'Designed a waiting room that admits at the rate checkout can serve, with tickets the backend verifies without a lookup' },
    { id: 'r8', bar: 'senior', criterion: 'Layered bot defences: one ticket per verified account, edge rate limits, challenges, purchase limits per card and address' },
    { id: 'r9', bar: 'staff', criterion: 'Made oversell impossible by construction, with Postgres as truth and Redis only shedding load' },
    { id: 'r10', bar: 'staff', criterion: 'Explained how Redis fails here, lost writes on failover and counter drift, and why the design survives both' },
    { id: 'r11', bar: 'staff', criterion: 'Told queued users the truth fast by stopping admission once every unit is sold or held' },
    { id: 'r12', bar: 'staff', criterion: 'Isolated the sale from the rest of the store so a stampede cannot take checkout down for everyone' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Users should be able to see the deal and a countdown, and join a queue when the sale opens.',
        'Users who are admitted should be able to reserve one unit and pay for it within ten minutes.',
        'Users should always see an honest status — queued, reserved, sold out — and units that are not paid for should go back on sale.',
        'Out of scope: the catalogue, shipping, recommendations — and the rest of the store, which must keep working while this runs.',
      ],
    },
    {
      kind: 'list',
      items: [
        '**Never oversell.** Reservations never exceed stock, not even by one. Underselling for a minute while a lapsed reservation comes back is acceptable.',
        '**Survive the cliff.** Assume a million people arrive in the minute before noon and refresh hard: several hundred thousand requests a second, from almost nothing, for a few minutes.',
        '**Fair:** roughly first come, first served, and not won by bots.',
        '**Honest and quick:** everyone learns where they stand within seconds, and "sold out" arrives the moment it is true.',
      ],
    },
    {
      kind: 'figure',
      caption: 'A hundred people for every unit. The system\'s main job is telling 99% of them no — quickly, honestly, and without falling over.',
      figure: {
        kind: 'ratio',
        parts: [
          { label: 'get a unit · 10,000', value: 10000, tone: 'mastered' },
          { label: 'leave without one · 990,000', value: 990000, tone: 'neutral' },
        ],
        note: 'Design the rejection path first. It carries 99% of the traffic.',
      },
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Contrast it with Ticketmaster out loud: these units are **interchangeable**. Nobody cares which one they get, so a buyer can take *any* free unit — and that is what lets thousands of claims run side by side instead of queueing on one seat or one counter.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'list',
      items: [
        '`Sale` — product, price, stock, start time, the per-customer limit.',
        '`Unit` — one row per unit of stock, created with the sale: `available`, `held` (with holder and expiry), or `sold`. A held unit *is* the reservation.',
        '`QueueTicket` — a signed place in the waiting room.',
        '`Order` — created when a held unit is paid for.',
      ],
    },
    {
      kind: 'prose',
      text: 'The surprising choice is `Unit`: ten thousand rows for ten thousand units, instead of one `stock` integer. It looks wasteful, and it is the whole trick — deep dive 1.',
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'code',
      code: `GET  /sales/{id}               -> Sale { price, startsAt, soldOut }
POST /sales/{id}/queue         -> { ticket, number }
GET  /sales/{id}/queue/state   -> { admittedUpTo, soldOut }
POST /sales/{id}/reservations
       Idempotency-Key: <uuid>
       { ticket }              -> { unitId, expiresAt } | 409 sold out
POST /orders
       { unitId, paymentMethodId } -> { orderId }`,
    },
    {
      kind: 'prose',
      text: 'The queue state endpoint returns the same answer to everyone — one integer and a flag — so the [[CDN]] can cache it for a second. Each client compares its own ticket number against it, and the origin never hears from a million pollers. Every other call in this [[API]] comes with a ticket or a held unit attached, so only people with a real chance reach the backend.',
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'A funnel. Each layer exists to shrink the traffic that reaches the one below it.',
      figure: {
        kind: 'stack',
        layers: [
          { label: 'CDN: deal page, countdown, queue state', sub: '~1M users', tone: 'neutral' },
          { label: 'Edge: bot filter and rate limits', sub: 'drops the junk', tone: 'neutral' },
          { label: 'Waiting room', sub: 'admits ~500/s', tone: 'line' },
          { label: 'Reservation: Redis gate, then a unit row', sub: '10,000 units', tone: 'line' },
          { label: 'Checkout and payment', sub: 'holders only', tone: 'mastered' },
        ],
        note: 'The database only ever sees people who already have a realistic chance of a unit. Everything above it is cached, cheap or stateless.',
      },
    },
    {
      kind: 'list',
      items: [
        '**The deal page** is static and comes from the [[CDN]] — price, description, countdown. "Sold out" is a flag in the queue state, so the page never asks the origin.',
        '**Join the queue.** At noon each user gets a signed ticket with a sequence number from a Redis counter. Bottleneck: the queue is now the front door for a million people — deep dive 2.',
        '**Reserve.** An admitted ticket passes a Redis counter that sheds requests once stock is gone, then claims a unit row in Postgres with a ten-minute expiry. Bottleneck: overselling under contention — deep dive 1.',
        '**Pay.** Checkout turns a held unit into an order. Bottleneck: units held by people who never pay — deep dive 3.',
      ],
    },
    {
      kind: 'prose',
      text: 'Run the sale on its own deployment: its own reservation service, Redis and database. A stampede at noon then cannot exhaust connections that ordinary checkout needs, and the one thing you cannot autoscale in time — the database — only ever sees traffic the layers above have already metered. Pre-scale everything else before noon; autoscaling reacts in minutes, and this spike arrives in a second.',
    },

    { kind: 'heading', text: 'Deep dive 1 — inventory contention: never oversell' },
    {
      kind: 'prose',
      text: 'Ten thousand units, and in the first seconds tens of thousands of admitted requests each trying to take one. Judge every option on two questions: can it oversell, and what melts first?',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Read the stock, check it, write it back',
          text: 'Two requests read 1, both write 0, both get a unit. Oversold by one — and under real concurrency, by hundreds.',
        },
        {
          grade: 'good',
          title: 'One conditional decrement on a stock row',
          text: '`UPDATE sales SET stock = stock - 1 WHERE id = :id AND stock > 0` cannot oversell. But every request in the sale now queues for one row lock, a single row tops out at a few thousand updates a second, and the queue holds connections the rest of the store needs.',
        },
        {
          grade: 'great',
          title: 'An atomic decrement in Redis',
          text: 'A Lua script checks the customer\'s limit and runs `DECR`, handing the unit back if the result drops below zero. Redis runs it single-threaded, so it is atomic, at around a hundred thousand operations a second. But Redis is now the source of truth, and it replicates asynchronously: a failover can lose acknowledged decrements, and you sell the same units twice.',
        },
        {
          grade: 'best',
          title: 'Redis as the gate, one row per unit as the truth',
          text: 'Redis turns away the 99% who cannot have a unit. The few who pass claim a row: any `available` unit, skipping rows another transaction has locked. There are exactly 10,000 rows, so overselling is impossible by construction, not by vigilance.',
        },
      ],
    },
    {
      kind: 'code',
      caption: 'Claim any free unit, never waiting behind another buyer. No row back means sold out, for now.',
      code: `UPDATE units
   SET status = 'held', holder = :user,
       expires_at = now() + interval '10 minutes'
 WHERE id = (
   SELECT id FROM units
    WHERE sale_id = :sale
      AND (status = 'available'
           OR (status = 'held' AND expires_at < now()))
    LIMIT 1
    FOR UPDATE SKIP LOCKED)
RETURNING id;`,
    },
    {
      kind: 'prose',
      text: '`SKIP LOCKED` is what makes ten thousand rows faster than one: a claim never waits for another buyer, it just takes the next free unit. A partial unique index on `(sale_id, holder)` over held and sold units enforces one per customer; a buyer whose own hold lapsed has it released at the start of their next claim, in the same transaction. And the gate does not have to be right. If Redis loses decrements, a few extra requests reach Postgres and find no free row. If it loses increments, it says sold out a little early and you undersell until the reconciler catches up — deep dive 3. Either way, nobody gets a unit that does not exist.',
    },
    {
      kind: 'figure',
      caption: 'Ten thousand rows, one per unit. Each claim takes any free row and skips locked ones, so buyers never queue behind each other.',
      figure: {
        kind: 'grid',
        cols: 10,
        cells: [
          { tone: 'mastered' }, { tone: 'mastered' }, { tone: 'streak' }, { tone: 'mastered' }, { tone: 'line' },
          { tone: 'mastered' }, { tone: 'streak' }, { tone: 'line' }, { tone: 'neutral' }, { tone: 'streak' },
          { tone: 'streak' }, { tone: 'mastered' }, { tone: 'line' }, { tone: 'streak' }, { tone: 'neutral' },
          { tone: 'line' }, { tone: 'neutral' }, { tone: 'streak' }, { tone: 'neutral' }, { tone: 'neutral' },
        ],
        legend: [
          { tone: 'mastered', label: 'sold' },
          { tone: 'streak', label: 'held, ten minutes to pay' },
          { tone: 'line', label: 'being claimed, skipped by others' },
          { tone: 'neutral', label: 'available, or a lapsed hold' },
        ],
        note: 'A lapsed hold is claimable the instant it expires. No sweeper has to run first.',
      },
    },

    { kind: 'heading', text: 'Deep dive 2 — the waiting room, bots and rate limits' },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Autoscale and let everyone in',
          text: 'Autoscaling reacts in minutes; this spike arrives in a second and the stock is gone in a few minutes. The store falls over at noon, and the units go to whoever retried fastest — usually a bot.',
        },
        {
          grade: 'good',
          title: 'Rate limit at the edge and return 429',
          text: 'Protects the backend, but a rejected person refreshes, so load rises, and who gets through is decided by the luck of the retry. Unfair, and noisy.',
        },
        {
          grade: 'great',
          title: 'A virtual waiting room',
          text: 'Everyone gets a ticket with a sequence number, signed so it cannot be forged. One shared counter, admitted-up-to, advances at the rate checkout can serve, and a client is in once its number is at or below it. The state is one integer for everyone, so the edge serves it.',
        },
        {
          grade: 'best',
          title: 'A waiting room that knows the stock',
          text: 'Admit only as many people as there are claimable units, plus a margin for drop-outs. Once every unit is sold or held, flip sold-out in the queue state and tell everyone still waiting at once — and keep their places as a waitlist, served as holds lapse.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'Admission is one shared number. The edge serves it to everyone; only the ticket is personal.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Join the queue', sub: 'INCR gives #48,213', to: 'signed ticket' },
          { label: 'Poll queue state', sub: 'edge-cached for 1 s', to: '#48,213 ≤ admitted' },
          { label: 'Admitted', sub: 'admittedUpTo = 50,000', tone: 'line', to: 'ticket + request' },
          { label: 'Reservation service', sub: 'checks signature, one use', tone: 'mastered' },
        ],
        note: 'The ticket is signed with an [[HMAC]], so the reservation service can check it without a database lookup. Marking it used in Redis means each ticket buys exactly one attempt.',
      },
    },
    {
      kind: 'prose',
      text: 'Shuffle everyone who arrived before noon into a random order at the open, then go first come, first served. Strict arrival order among the early crowd rewards the lowest latency and the most aggressive refresh script — infrastructure, not intent.',
    },
    {
      kind: 'table',
      head: ['Defence', 'What it stops', 'What it costs'],
      rows: [
        ['One ticket per verified account, created before the sale was announced', 'one bot holding thousands of places', 'genuine new customers miss out'],
        ['Per-account and per-[[IP]] rate limits at the edge', 'refresh scripts, request floods', 'offices and households share an address'],
        ['A [[CAPTCHA]] at queue join, invisible unless the request looks automated', 'unsophisticated scripts', 'friction, and paid solving services for the rest'],
        ['Limits per card, shipping address and device at checkout', 'one person with fifty accounts', 'checks run before shipping, so some orders are cancelled after the fact'],
      ],
    },
    {
      kind: 'callout',
      tone: 'note',
      text: 'You will not stop every bot. The goal is to make a bot no better than a person: one ticket each, a random place among the early arrivals, the same limit per payment card. A bot that has to look like a thousand distinct, verified customers to win usually stops being worth running.',
    },

    { kind: 'heading', text: 'Deep dive 3 — recovering reservations' },
    {
      kind: 'prose',
      text: 'Some admitted buyers never pay: a declined card, a distraction, a dead tab. Every unpaid hold is a unit someone in the queue would have bought, so getting it back quickly is revenue, not housekeeping.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Holds that never expire',
          text: 'An abandoned cart keeps its unit forever. You sell out at 9,200 units and the rest sit in carts nobody will open again.',
        },
        {
          grade: 'good',
          title: 'Expiry, reset by a sweeper',
          text: 'A job returns lapsed holds every minute. It works, but units come back in lumps, and a dead sweeper silently freezes stock.',
        },
        {
          grade: 'great',
          title: 'Implicit expiry in the claim',
          text: 'A lapsed hold is simply claimable, as in the query above. Nothing has to run for a unit to come back.',
        },
        {
          grade: 'best',
          title: 'Implicit expiry, a reconciled gate, and a waitlist',
          text: 'The Redis gate does not know a hold lapsed. So every few seconds a reconciler sets it to the true count of claimable rows, and the waiting room admits that many more from the waitlist. Units flow back to the queue in seconds, in order.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'The life of one unit. It loops until someone pays — every lapse goes to the next person in line.',
      figure: {
        kind: 'cycle',
        steps: [
          { label: 'Available', sub: 'one of the 10,000 rows' },
          { label: 'Held by an admitted buyer', sub: 'ten minutes to pay' },
          { label: 'Not paid in time', sub: 'claimable the moment it lapses' },
          { label: 'Reconciler counts it', sub: 'Redis gate set to the true number' },
          { label: 'Next ticket admitted', sub: 'from the waitlist, in order' },
        ],
        note: 'A paid unit leaves the loop as sold. A popular unit can go round several times before the sale is truly over.',
      },
    },
    {
      kind: 'list',
      items: [
        '**Payment in flight at the deadline.** When the buyer presses pay, extend the hold by a few minutes with an update that succeeds only if they still hold it, so the authorisation never races the expiry. If a payment still lands on a unit that lapsed and was claimed by someone else, the order write fails its condition and the payment is voided automatically.',
        '**A crash between Redis and Postgres.** The gate let someone through and the claim never ran. The counter is now one low — an undersell, never an oversell — and the next reconcile fixes it.',
        '**The customer limit.** A buyer whose hold lapsed can rejoin the waitlist. Their next claim releases their own lapsed row first, so the one-per-customer index lets them back in.',
      ],
    },
    {
      kind: 'callout',
      tone: 'example',
      title: 'Amazon Lightning Deals',
      text: 'Lightning Deals run this loop in public. A claimed deal waits in your cart for a limited time, and once every unit is claimed, new arrivals can join a waitlist that is served as claims lapse. The claim is the hold, the cart timer is the expiry, and the waitlist is the queue.',
    },
  ],
  followups: [
    {
      q: 'Why not keep the whole sale in Redis and skip the database?',
      a: 'Because Redis replicates asynchronously, and a failover can lose writes it already acknowledged. With the units only in Redis you are one failover away from selling stock you do not have — and an oversell is customers with paid orders you must cancel. With the rows as truth, losing Redis costs throughput, never correctness.',
    },
    {
      q: 'How do you stop one person buying fifty units with fifty accounts?',
      a: 'Limit per payment card, shipping address and device as well as per account, and require accounts that existed before the sale was announced. Run the checks before shipping, so duplicate orders can be cancelled after the fact. You cannot stop it entirely; you can make it cost more than the discount is worth.',
    },
    {
      q: 'The stock is gone in eight seconds. What do the 900,000 people still queued see?',
      a: 'Sold out, within a second — the waiting room stops admitting once every unit is sold or held, and the flag goes out with the edge-cached queue state. They keep their place on a waitlist, and as holds lapse the reconciler admits the next tickets in order. Nobody waits twenty minutes to be told no.',
    },
    {
      q: 'How do you know it will work at noon, before noon?',
      a: 'Load test the whole funnel with recorded production-shaped traffic at several times the expected peak, then pre-scale to it, because autoscaling cannot catch a cliff. Create the sale, its units and its Redis keys well ahead of time. And keep a kill switch that pauses admission: a frozen queue is an apology, while a melted store is an outage.',
    },
    {
      q: 'Fifty flash sales at once, one of them enormous. What changes?',
      a: 'Almost nothing, because everything is keyed by sale: its own counter, its own unit rows, its own queue, spread across a Redis cluster by key. The enormous one is still one hot counter, which a single Redis shard handles at around a hundred thousand operations a second. If it ever needs more, split the stock across several counters and send each request to a random one.',
    },
  ],
}
