import type { Problem } from '../types'

export const auction: Problem = {
  id: 'auction',
  title: 'Design an online auction like eBay',
  kind: 'hld',
  category: 'commerce',
  difficulty: 'hard',
  brief:
    'Sellers list an item with a starting price and an end time. Buyers bid until it closes, and the highest bid wins. Anyone watching sees the price change live.',
  patterns: ['contention', 'realtime'],
  suggests: ['a-contention', 'a-realtime', 'c-queues', 'c-cap', 'db-locking'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to list, bid, watch live and close, and parked proxy bidding and payment as out of scope' },
    { id: 'r2', bar: 'must', criterion: 'Required bids to be strongly consistent and durable: an accepted bid is never lost and the price never falls' },
    { id: 'r3', bar: 'must', criterion: 'Kept the current price and end time on the auction row, with bids as an append-only log' },
    { id: 'r4', bar: 'must', criterion: 'Identified the lost update between two concurrent bids before being prompted' },
    { id: 'r5', bar: 'senior', criterion: 'Made the bid one conditional write whose condition is the bidding rule, so a failed write means outbid, not retry' },
    { id: 'r6', bar: 'senior', criterion: 'Noticed the platform-wide bid rate is small and the real load is one hot auction in its final minute' },
    { id: 'r7', bar: 'senior', criterion: 'Pushed price updates over SSE with pub/sub fan-out per server, not per viewer' },
    { id: 'r8', bar: 'senior', criterion: 'Made the close a conditional transition on the same row as the bids, so bids and close serialise' },
    { id: 'r9', bar: 'staff', criterion: 'Kept correctness independent of the close job by checking the end time inside every bid' },
    { id: 'r10', bar: 'staff', criterion: 'Took a position on sniping, hard close with proxy bidding or a soft close, and defended it' },
    { id: 'r11', bar: 'staff', criterion: 'Named the trigger for moving from a conditional write to one writer per auction' },
    { id: 'r12', bar: 'staff', criterion: 'Separated live price state, where loss is harmless, from outbid and won events, which need durable delivery' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Sellers should be able to list an item with a starting price and an end time.',
        'Buyers should be able to place a bid, accepted only if it beats the current highest bid.',
        'Everyone viewing an auction should see the current price as it changes, and the highest bid at the close should win.',
        'Out of scope: search and browse, automatic (proxy) bidding, reserve prices, paying for the item. Name them and park them — proxy bidding comes back as a follow-up.',
      ],
    },
    {
      kind: 'list',
      items: [
        '**Bids are strongly consistent and durable.** An accepted bid is never lost, and the price never goes down.',
        '**One winner, decided fairly.** Bid order and the close are judged by one clock, the server\'s, never the client\'s.',
        '**Live:** a new high bid reaches viewers within a second.',
        'Scale: assume 10 million live auctions and 100 million bids a week. That averages under 200 bids a second across the entire platform.',
        'But a hot auction can take hundreds of bids a second in its last minute, with 100,000 people watching.',
      ],
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'The platform-wide write rate is trivial — under 200 a second. Say so, then say where the load really is: one row, one auction, its last sixty seconds. This is a **skew** problem, not a volume problem, and sharding does nothing for a single hot row.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'list',
      items: [
        '`Auction` — item, seller, starting price, `ends_at`, status, and the state of play on the same row: `current_price`, `high_bidder_id`, `min_next_bid`.',
        '`Bid` — auction, bidder, amount, the server\'s receive time, outcome. Append-only: the audit trail, and the second-highest bidder if the winner never pays.',
        '`Item` — what is for sale: title, photos, condition.',
        '`User` — a buyer, a seller, or both.',
      ],
    },
    {
      kind: 'prose',
      text: 'Keeping the current price on the auction row is a deliberate denormalisation. It is what every bid is checked against, so it has to be one row read and one conditional write, not a `MAX()` over the bid log.',
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'code',
      code: `POST /auctions
       { item, startingPrice, endsAt }      -> { auctionId }
POST /auctions/{id}/bids
       Idempotency-Key: <uuid>
       { amount }    -> { outcome: 'leading' | 'outbid' | 'closed',
                          currentPrice, endsAt }
GET  /auctions/{id}                         -> Auction
GET  /auctions/{id}/events
       -> text/event-stream of { currentPrice, endsAt, status }`,
    },
    {
      kind: 'prose',
      text: 'The bidder comes off the auth token. Amounts are integers in the smallest currency unit, never floats. The bid takes an idempotency key because the last ten seconds of an auction are exactly when a phone on a train retries. Every endpoint is plain [[API]] work except the bid and the stream, which is where the design lives.',
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'Bids are judged on one row; accepted bids reach every viewer through a few dozen servers, not a hundred thousand sends.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Bidder', to: 'POST bid' },
          { label: 'Bid service', sub: 'stateless', to: 'conditional write' },
          { label: 'Auction row', sub: 'Postgres · price, end time', tone: 'line', to: 'publish after commit' },
          { label: 'Pub/sub', sub: 'Redis channel per auction', to: 'push' },
          { label: 'Event servers', sub: 'hold the streams', to: 'stream' },
          { label: 'Watchers', sub: '100,000 on a hot item' },
        ],
        note: 'A close worker settles each auction at its end time through the same row. Item pages and search are a separate, heavily cached read path.',
      },
    },
    {
      kind: 'list',
      items: [
        '**List.** Insert the auction row; the close worker finds it by its end time later. Rare and boring.',
        '**Bid.** The bid service writes the bid conditionally against the auction row and appends it to the bid log in the same transaction. Bottleneck: hundreds of concurrent bids on one row — deep dive 1.',
        '**Watch.** The page loads the auction once, then subscribes to its event stream. Bottleneck: one accepted bid becoming 100,000 pushes — deep dive 2.',
        '**Close.** At `ends_at` the auction must stop taking bids and name exactly one winner, even with bids in flight. Bottleneck: fairness at the buzzer — deep dive 3.',
      ],
    },
    {
      kind: 'prose',
      text: 'Postgres fits the auction store. The core operation is a single-row conditional update that must be durable and strongly consistent, and the write rate away from the hot rows is tiny. Replicate synchronously to one standby, so an acknowledged bid survives a failover — this is the one place you pay that latency on purpose. Shard by auction id if you outgrow one primary; it spreads the ten million quiet auctions and does nothing for the loud one.',
    },

    { kind: 'heading', text: 'Deep dive 1 — bid contention' },
    {
      kind: 'prose',
      text: 'Two bids arrive together on an auction at $100: one for $110, one for $120. Both read $100, both decide they are winning, and whichever writes last sets the price. If that is the $110 bid, the price has gone down and the $120 bidder has been robbed by a race.',
    },
    {
      kind: 'figure',
      caption: 'A lost update: both bids read $100, and the later write wins even though it is the lower bid.',
      figure: {
        kind: 'timeline',
        ticks: ['read', 'write', 'result'],
        lanes: [
          {
            label: 'Bid of $120',
            bars: [
              { from: 0, to: 0.4, label: 'reads $100', tone: 'line' },
              { from: 0.4, to: 0.6, label: 'writes $120', tone: 'line' },
            ],
            outcome: { label: 'overwritten', tone: 'alert' },
          },
          {
            label: 'Bid of $110',
            bars: [
              { from: 0, to: 0.4, label: 'reads $100', tone: 'line' },
              { from: 0.65, to: 0.9, label: 'writes $110', tone: 'alert' },
            ],
            outcome: { label: 'price is $110', tone: 'alert' },
          },
        ],
        note: 'Nothing failed. Every statement succeeded, and the auction is wrong.',
      },
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Read the price, compare in code, write',
          text: 'The race above. It passes every test you run with one bidder and loses money at the first contested close.',
        },
        {
          grade: 'good',
          title: 'Lock the row with `SELECT … FOR UPDATE`',
          text: 'Correct, and held for milliseconds, not minutes. But each bid holds the lock across several round trips, so one row tops out at a few hundred bids a second, and queued bids sit on connections the rest of the site needs.',
        },
        {
          grade: 'best',
          title: 'One conditional update, where the condition is the bidding rule',
          text: 'A single statement that succeeds only if the auction is open, the end time has not passed, and this bid meets the minimum next bid. The lock is held from this one statement to the commit, never across a read and a decision in application code. And a failed update is not a conflict to retry: it is the answer. You were outbid, or the auction is over.',
        },
      ],
    },
    {
      kind: 'code',
      caption: 'The rule is the condition. One row back means you lead; none means outbid or closed.',
      code: `UPDATE auctions
   SET current_price  = :amount,
       high_bidder_id = :bidder,
       min_next_bid   = :amount + increment(:amount)
 WHERE id = :auction
   AND status = 'open'
   AND ends_at > now()
   AND min_next_bid <= :amount;
-- same transaction: INSERT INTO bids (...) with the outcome`,
    },
    {
      kind: 'prose',
      text: 'This is [[OCC]] with the business rule standing in for a version number. A plain version check would make a $150 bid retry because a $120 bid landed first; this condition accepts it, because $150 still beats $120. Retries all but disappear, and the bidder gets a synchronous answer.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Conditional write on the auction row',
        points: [
          'Synchronous: the bidder learns leading or outbid in the same request.',
          'No new infrastructure — one statement against the row you already have.',
          'Tops out at one commit at a time on that row — hundreds to about a thousand a second with a synchronous standby — enough for a hot auction\'s last minute.',
          'Every rule has to fit in a WHERE clause.',
        ],
      },
      right: {
        title: 'One writer per auction',
        points: [
          'Bids go onto a Kafka partition keyed by auction, and one consumer applies them in order, in memory.',
          'A total order of every bid, and the rules can be arbitrary code.',
          'Asynchronous: the bidder waits for a verdict over a second channel.',
          'You now own partition ownership, failover, and rebuilding state on a new owner.',
        ],
      },
      verdict: 'The conditional write. Move to one writer per auction only when the rules stop fitting in a WHERE clause — proxy bidding is the usual reason — or one item needs thousands of bids a second. Naming that trigger is the staff-level part of the answer.',
    },

    { kind: 'heading', text: 'Deep dive 2 — the live price for 100,000 viewers' },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Every viewer polls the auction every second',
          text: '100,000 viewers is 100,000 requests a second against one row, nearly all of them returning what they returned last time.',
        },
        {
          grade: 'good',
          title: 'Poll a cached copy',
          text: 'Cache the auction for one second at the [[CDN]], and the origin sees about one request a second per edge location. Cheap and robust, with up to a second of staleness — fine for most of the auction, painful in the last minute.',
        },
        {
          grade: 'great',
          title: '[[SSE]] streams, fanned out through pub/sub',
          text: 'Each viewer holds one stream to an event server. When a bid commits, the bid service publishes to the Redis channel `auction:{id}`, and every event server subscribed to it pushes to its own viewers. Fan-out is per server, not per viewer.',
        },
        {
          grade: 'best',
          title: 'Streams, plus conflation',
          text: 'In the last minute the price can change hundreds of times a second, and nobody can read that. Each event server sends the latest state at most every 200 ms and drops the ones in between. The message is the whole current state, not a change, so a dropped one loses nothing.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'Fan-out by server: one publish reaches fifty event servers, and each pushes to its own two thousand viewers.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Bid commits', to: 'publish once' },
          { label: 'Redis channel', sub: 'auction:42', to: '50 subscribers' },
          { label: 'Event servers', sub: '2,000 streams each', to: 'push, conflated' },
          { label: '100,000 viewers', tone: 'line' },
        ],
        note: 'A viewer that reconnects fetches the auction once and resumes. Missing a message costs nothing, because the next one carries the whole state.',
      },
    },
    {
      kind: 'prose',
      text: 'Why [[SSE]] rather than a [[WebSocket]]: viewers only receive. Bids stay ordinary POST requests, on the path with the idempotency key and the conditional write. SSE is plain [[HTTP]], reconnects on its own, and passes through proxies that sometimes break WebSockets.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Putting "you have been outbid" on the same channel as the live price. The price is state: losing a message is harmless. "Outbid" and "you won" are events someone acts on, so they go through an outbox written in the bid\'s own transaction and a durable queue, delivered at least once and deduplicated by bid id.',
    },

    { kind: 'heading', text: 'Deep dive 3 — the close: sniping, fairness and one winner' },
    {
      kind: 'prose',
      text: 'Sniping is bidding in the final second so nobody can answer. Whether that is a problem is a product decision, and the interviewer wants to watch you make one.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Hard close',
        points: [
          'The auction ends at the advertised second, always.',
          'Predictable for buyers, and for the close worker.',
          'Sniping works, so bidders who are not watching lose to bidders who are — unless automatic bidding is bidding for them.',
          'At the buzzer, network latency decides the close calls.',
        ],
      },
      right: {
        title: 'Soft close',
        points: [
          'A bid in the final two minutes moves the end to two minutes after that bid.',
          'The auction ends when bidding stops, so everyone can answer and the seller gets the higher price.',
          'The end time moves, so it is pushed to viewers along with the price.',
          'An auction can run on; cap the extensions if the product needs a hard stop.',
        ],
      },
      verdict: 'Soft close, unless proxy bidding is in scope. It removes the latency race that a hard close can only shrink, and the extension is one more `SET` clause in the same conditional update, so it costs nothing in correctness.',
    },
    {
      kind: 'figure',
      caption: 'The same last-second bid under each rule: a hard close ends on it, a soft close gives the rival time to answer.',
      figure: {
        kind: 'timeline',
        ticks: ['−2 min', '−1 min', 'scheduled end', '+1 min', '+2 min'],
        lanes: [
          {
            label: 'Hard close',
            bars: [
              { from: 0, to: 0.48, label: 'open', tone: 'line' },
              { from: 0.48, to: 0.5, tone: 'alert' },
            ],
            outcome: { label: 'sniper wins', tone: 'alert' },
          },
          {
            label: 'Soft close',
            bars: [
              { from: 0, to: 0.48, label: 'open', tone: 'line' },
              { from: 0.48, to: 1, label: 'extended by the late bid', tone: 'streak' },
            ],
            outcome: { label: 'rival can answer', tone: 'mastered' },
          },
        ],
        note: 'A bid with one second to go moves a soft close to two minutes after it. Each later bid does the same, until two quiet minutes pass.',
      },
    },
    {
      kind: 'prose',
      text: 'Then make the winner unambiguous. Three rules do it.',
    },
    {
      kind: 'list',
      items: [
        '**One clock.** A bid is accepted only if `ends_at > now()` holds inside the conditional update, using the database\'s clock. App servers\' clocks drift apart by milliseconds or worse; the primary\'s `now()` is one clock for the whole auction.',
        '**The close is a transition on the same row.** `UPDATE auctions SET status = \'closed\' WHERE id = :id AND status = \'open\' AND ends_at <= now()`. Bids and the close take the same row lock, so every bid either committed before the close or is refused by it. The winner is whoever `high_bidder_id` names at that moment — read, never recomputed.',
        '**The close job is off the correctness path.** Bids check the end time themselves, so a close worker running three seconds late cannot let a late bid in. It only announces a result already decided, and because the transition is conditional, running it twice is harmless.',
      ],
    },
    {
      kind: 'prose',
      text: 'The worker itself is simple: an index on `(status, ends_at)`, polled every second by workers that take due auctions with `FOR UPDATE SKIP LOCKED` so they never fight over one. A soft-close extension just moves `ends_at`, and the poller picks the auction up again when the new time comes. The close transaction writes an `AuctionClosed` event to the outbox in the same commit, for payment and notifications to consume.',
    },
    {
      kind: 'callout',
      tone: 'example',
      title: 'eBay',
      text: 'eBay runs hard closes and permits sniping: its automatic bidding bids on your behalf up to a maximum you set, so a bidder who entered a true maximum cannot be sniped by anything lower. And if the winner does not pay, the seller can send a **Second Chance Offer** to a losing bidder — which is why the whole bid log is kept, not just the current price.',
    },
  ],
  followups: [
    {
      q: 'How would you add automatic (proxy) bidding?',
      a: 'Each bidder stores a private maximum, and the visible price becomes one increment above the second-highest maximum, capped at the highest. A new maximum is a computation over the top two, so either keep both on the auction row and update them conditionally, or move to one writer per auction where the rule is plain code. Ties go to the earlier maximum, and no maximum is ever shown.',
    },
    {
      q: 'A bid request times out on the client. Did it count?',
      a: 'The client retries with the same idempotency key, and the server returns the stored outcome. Without the key, the retry is judged afresh — and since that bid is now the current price, it fails the minimum-next-bid check, so the bidder is told they were outbid on an auction they are leading.',
    },
    {
      q: 'The auction database fails over ten seconds before a big close. What happens?',
      a: 'Synchronous replication means no acknowledged bid is lost. Bids fail for the seconds the failover takes, and clients retry with their keys. Then apply a policy rather than pretend: extend every auction whose end fell inside the outage by the length of the outage, so nobody loses because your primary did.',
    },
    {
      q: 'How do you shard this?',
      a: 'By auction id. Every bid and the close for one auction touch one row, so nothing crosses shards. Sharding spreads the ten million quiet auctions; it does nothing for one hot auction, which is still one row. For that the answer is the single-statement write, or one writer per auction.',
    },
    {
      q: 'The winner never pays. Now what?',
      a: 'The close emits `AuctionClosed` through the outbox, and payment is its own multi-step process with its own deadline. If the deadline passes, the seller can offer the item to the next-highest bidder at their bid — the bid log answers who that is. Both steps are keyed by auction id, so a redelivered event cannot charge twice or offer twice.',
    },
  ],
}
