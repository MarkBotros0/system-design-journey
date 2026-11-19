import type { Problem } from '../types'

export const foodDelivery: Problem = {
  id: 'food-delivery',
  title: 'Design DoorDash',
  kind: 'hld',
  category: 'location',
  difficulty: 'hard',
  brief:
    'Customers order food from nearby restaurants, a courier picks it up and brings it to them, and everyone can see where the order is.',
  patterns: ['multistep', 'proximity', 'realtime'],
  suggests: ['a-multistep', 'a-proximity', 'a-contention', 'a-realtime', 'd-transactions'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to ordering, dispatch and tracking, with finding restaurants and ratings out of scope' },
    { id: 'r2', bar: 'must', criterion: 'Modelled the order as an explicit state machine with legal transitions' },
    { id: 'r3', bar: 'must', criterion: 'Separated the high-volume location stream from durable order and payment data' },
    { id: 'r4', bar: 'must', criterion: 'Prevented double orders and double charges with an idempotency key' },
    { id: 'r5', bar: 'senior', criterion: 'Made every transition a conditional write, so stale or duplicate events cannot move an order backwards' },
    { id: 'r6', bar: 'senior', criterion: 'Timed courier assignment to the predicted ready time instead of assigning on placement' },
    { id: 'r7', bar: 'senior', criterion: 'Built the customer ETA from prep, pickup and travel estimates, and showed it as a range' },
    { id: 'r8', bar: 'senior', criterion: 'Authorised at checkout and captured at delivery, so a cancellation is a void' },
    { id: 'r9', bar: 'senior', criterion: 'Published state changes through an outbox so events and state cannot disagree' },
    { id: 'r10', bar: 'staff', criterion: 'Batched dispatch per region and solved it as an assignment problem, including stacked orders' },
    { id: 'r11', bar: 'staff', criterion: 'Rejected two-phase commit across the payment provider and used a saga with compensations' },
    { id: 'r12', bar: 'staff', criterion: 'Paid out from an append-only double-entry ledger, reconciled against the provider' },
  ],
  followups: [
    {
      q: 'The restaurant has not accepted after five minutes. What happens?',
      a: "The workflow's timer fires. Escalate first (a louder alert on the tablet, then an automated call), and if there is still nothing, cancel: void the authorisation, tell the customer, and release any courier already heading there. Nothing was captured, so there is no refund to wait for.",
    },
    {
      q: "The courier's phone loses signal mid-delivery. What does everyone see?",
      a: "The state does not change; only the position goes stale. The customer's map shows the last known position with its age, and the [[ETA]] widens. The app buffers locations and uploads them on reconnect. Past a threshold, support is alerted; reassigning automatically would be wrong once the food is already in the courier's car.",
    },
    {
      q: "How does the courier's dot move smoothly with an update only every five seconds?",
      a: 'The client animates. Each update carries position, heading and speed, and the app interpolates along the route between them, snapped to the road. Sending more often would multiply the 100,000 writes a second to make an animation slightly more honest.',
    },
    {
      q: 'Dinner rush: orders outnumber couriers in one area. What do you do?',
      a: 'Make the shortage visible before it turns into lateness. Dispatch publishes supply and demand per region; checkout then quotes longer [[ETA|ETAs]], incentive pay brings more couriers online, and if it is bad enough the delivery radius for that area shrinks. An honest 50 minutes beats a promised 30 that arrives cold.',
    },
    {
      q: 'The customer taps "Place order" twice. How do you avoid two orders and two charges?',
      a: 'The app creates an idempotency key when the checkout screen opens and sends it with every attempt. The order insert is unique on that key, so the second tap returns the first order, and the same key goes to the payment provider, so the authorisation happens once too.',
    },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Customers should be able to order from a restaurant that delivers to them, and pay for it.',
        'Restaurants should be able to accept and prepare orders, and the system should assign a courier to collect each one.',
        'Customers should be able to track the order: its status, the courier on a map, and an [[ETA]].',
        'Out of scope: finding restaurants (that is the Yelp problem), ratings, promotions, courier onboarding.',
      ],
    },
    {
      kind: 'prose',
      text: "Non-functional, and correctness comes first: **an order is never charged twice, never assigned to two couriers, and never stuck** between states. **Food waits for the courier, not the other way round**: dispatch so the courier arrives as the food is ready. Status changes reach the customer within a second or two; the courier's dot moves every few seconds. Assume **10M orders a day** with dinner peaks around **300 orders a second**, and **500k couriers online** at peak, each sending a location every 5 seconds: **100,000 location writes a second**.",
    },
    {
      kind: 'prose',
      text: 'Those two numbers belong to two different systems. Orders are a few hundred writes a second, each one money, and must be exactly right. Locations are a hundred thousand a second, each worthless five seconds later. Say that early and the storage decisions make themselves.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: "Three parties with three clocks: the kitchen, the courier's drive, and the customer's patience. Dispatch here is a timing problem first and a distance problem second, which is the real difference from Uber.",
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'list',
      items: [
        '`Order`: id, customer, restaurant, items, totals, state, version.',
        '`Delivery`: the order (or orders, when batched), courierId, state, pickup and drop-off estimates.',
        '`Courier`: id, status, vehicle, current delivery. The live position lives elsewhere.',
        '`Restaurant`: location, hours, and its history of preparation times.',
        '`Payment` and `LedgerEntry`: the authorisation, the capture, and who is owed what.',
      ],
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'prose',
      text: 'Three clients, so three slices of the [[API]]. Tracking is [[SSE]], because the customer only listens.',
    },
    {
      kind: 'code',
      code: `POST /orders  { restaurantId, items, address,
                paymentMethodId, idempotencyKey }
                                    -> { orderId, eta }

POST /restaurant/orders/{id}/accept   { prepMinutes }
POST /restaurant/orders/{id}/ready

POST /courier/location  { lat, lng, heading, speed, ts }  -> 204
POST /courier/offers/{offerId}/accept    -> { delivery }
POST /courier/deliveries/{id}/pickup  |  /dropoff

GET  /orders/{id}/track   (SSE)  -> state, position, eta`,
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'Orders and money go through one durable service; locations go through memory. Dispatch reads both.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Customer app', sub: 'order, pay, track', to: 'POST /orders' },
          { label: 'Order service', sub: 'state machines, Postgres', tone: 'line', to: 'outbox to Kafka' },
          { label: 'Dispatch', sub: 'estimates and matching, per region', tone: 'line', to: 'offer' },
          { label: 'Courier app', sub: 'location every 5 s', to: 'location' },
          { label: 'Location service', sub: 'Redis geo, latest position only', to: 'push' },
          { label: 'Customer map', sub: 'state, courier, estimate' },
        ],
        note: 'Payments sit beside the order service and are driven by its events: authorise at checkout, capture at delivery, pay out from a ledger.',
      },
    },
    {
      kind: 'list',
      items: [
        "**Placing an order** writes it in `placed` and authorises the card, both keyed by the client's idempotency key so a double tap is one order. The restaurant's tablet is notified.",
        '**Restaurant and courier updates** are state transitions in the order service. Each commits the new state and an outbox row in the same transaction; the outbox publishes to Kafka, and dispatch, payments and notifications consume from there.',
        '**Courier locations** never touch Postgres. At 100,000 a second they go to Redis geo sets sharded by region, overwriting the previous position, and onto a Kafka topic that feeds the travel-time models and trip history.',
        "**Tracking** subscribes the customer to a channel for their order. The location service publishes the courier's position there while a delivery is active, and the order service publishes state changes and fresh [[ETA|ETAs]].",
      ],
    },
    {
      kind: 'prose',
      text: "The deep dives are where this is won or lost: keeping the order's state honest, choosing which courier and when, and moving money between three parties without a transaction that spans them.",
    },

    { kind: 'heading', text: 'Deep dive 1 — the order state machines' },
    {
      kind: 'prose',
      text: 'The kitchen and the courier make progress in parallel. Forcing both into one `status` column creates questions it cannot answer: is the order `preparing` or `courier_assigned`? Model **two state machines**, joined at pickup.',
    },
    {
      kind: 'figure',
      caption: 'Two machines running in parallel, joined at pickup, with the money held rather than taken until the end.',
      figure: {
        kind: 'timeline',
        ticks: ['0 min', '10', '20', '30', '40'],
        lanes: [
          {
            label: 'Kitchen',
            bars: [
              { from: 0, to: 0.05, label: 'accept', tone: 'line' },
              { from: 0.05, to: 0.45, label: 'preparing, about 16 min', tone: 'line' },
              { from: 0.45, to: 0.5, label: 'ready', tone: 'mastered' },
            ],
          },
          {
            label: 'Courier',
            bars: [
              { from: 0.2, to: 0.47, label: 'assigned, driving to pickup', tone: 'streak' },
              { from: 0.5, to: 0.85, label: 'picked up, driving to customer', tone: 'line' },
            ],
            outcome: { label: 'delivered', tone: 'mastered' },
          },
          {
            label: 'Money',
            bars: [{ from: 0, to: 0.85, label: 'card authorised, nothing charged', tone: 'streak' }],
            outcome: { label: 'captured', tone: 'mastered' },
          },
        ],
        note: 'Dispatch starts the courier at minute 8, not minute 0, so they arrive as the food is ready instead of waiting at the counter.',
      },
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'A status column anyone can write',
          text: "`UPDATE orders SET status = 'picked_up'` from whichever service gets there. A retried \"accepted\" event that arrives late moves a collected order backwards, and nothing notices.",
        },
        {
          grade: 'good',
          title: 'Explicit transitions, each a conditional write',
          text: "A table of legal transitions (from, to, and who may cause it) enforced in the order service, with every update conditional: `SET state = 'ready', version = version + 1 WHERE state = 'preparing' AND version = :v`. A stale or duplicate event fails loudly instead of corrupting the order.",
        },
        {
          grade: 'great',
          title: 'Two machines, transitions plus an outbox',
          text: 'Order and delivery each get their own machine, joined by events. Every transition writes the new state and an outbox row in one transaction, so an event is published if and only if the state changed. Consumers are idempotent by event id, because Kafka will redeliver.',
        },
        {
          grade: 'best',
          title: 'A durable workflow over the machines',
          text: 'The cross-service flow (authorise, wait for the restaurant, dispatch, capture, pay out) runs as a Temporal workflow with a timer on every wait: no acceptance within five minutes cancels the order and voids the card hold. The engine persists each step, so after a crash the flow resumes where it was instead of restarting or forgetting.',
        },
      ],
    },

    { kind: 'heading', text: 'Deep dive 2 — dispatch: which courier, and when' },
    {
      kind: 'prose',
      text: 'Uber matches the nearest free driver now, because the rider is ready now. Here the food will not be ready for fifteen minutes, so "nearest now" is the wrong question. The right one: who can be at the restaurant when the food is ready, and get it to the customer soonest after?',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Nearest free courier, the moment the order is placed',
          text: 'The courier arrives in five minutes and waits ten at the counter, unpaid and unavailable. Meanwhile a courier finishing a drop-off next door in eight minutes would have been the better choice.',
        },
        {
          grade: 'good',
          title: 'Just-in-time assignment',
          text: "Predict the ready time, and assign once ready time minus a courier's travel time is close. Couriers stop idling at counters. But each order is still decided greedily: two orders that want the same courier are settled by whichever was processed first.",
        },
        {
          grade: 'great',
          title: 'Batch the decisions per region',
          text: 'Every 30 seconds or so, each region gathers its open orders and its free or soon-free couriers, scores every pair (arrival against ready time, lateness to the customer, courier idle time) and solves it as one assignment problem. The joint answer beats a sequence of greedy ones, and a region keeps each solve small enough to finish in time.',
        },
        {
          grade: 'best',
          title: 'Batched, with stacked orders and a guarded offer',
          text: 'The same solve may give one courier two orders from one restaurant, or along one route, when neither ends up late. The chosen courier gets an offer with a short hold (as in Uber, `SET NX EX` on the courier), and the assignment commits only as a conditional write on a courier who is still free, so nobody is ever on two incompatible deliveries.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'Two orders from one restaurant, two minutes apart. Greedy sends two couriers; batching sends one.',
      figure: {
        kind: 'split',
        left: {
          title: 'Greedy, nearest first',
          tone: 'alert',
          nodes: [
            { label: 'Order A placed', to: 'nearest' },
            { label: 'Courier X', sub: 'waits 10 min at the counter', tone: 'alert' },
          ],
          cost: 'Order B, two minutes later, gets courier Y from 4 km away.',
        },
        right: {
          title: 'Batched every 30 s',
          tone: 'mastered',
          nodes: [
            { label: 'Orders A and B, couriers X, Y, Z', to: 'score and solve' },
            { label: 'X takes both', sub: 'timed to the ready time', tone: 'mastered' },
          ],
          cost: 'Each decision waits up to 30 s: invisible against a 15-minute prep.',
        },
        verdict: 'Batch. Seconds of decision delay buy better matches for every order in the region.',
      },
    },
    {
      kind: 'prose',
      text: "The same estimates produce the customer's [[ETA]], which is a sum of predictions, each with its own error:",
    },
    {
      kind: 'figure',
      caption: 'An arrival estimate is several predictions added up, so it is shown as a range and refreshed at every state change.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Food ready or courier arrives, whichever is later', sub: 'prep model vs live position and road time', to: '+' },
          { label: 'Handoff', sub: 'parking, finding the order', to: '+' },
          { label: 'Drive to customer', sub: 'route, traffic, time of day', to: '=' },
          { label: '25–35 min', sub: 'a range, recomputed at every event', tone: 'line' },
        ],
      },
    },
    {
      kind: 'prose',
      text: 'Show a range, not a minute, and recompute it at every event (accepted, ready, picked up) and every few location updates. A promise that slips from 25 minutes to 40 costs more trust than quoting 30 to 40 in the first place.',
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'DoorDash has written about its dispatch engine, DeepRed. Machine-learned predictions of preparation and travel time feed an optimiser that assigns batches of orders to couriers, multi-order routes included, rather than assigning nearest-first.',
    },

    { kind: 'heading', text: 'Deep dive 3 — paying three parties consistently' },
    {
      kind: 'prose',
      text: 'One order moves money for three parties. The customer pays; the restaurant is owed the food less commission; the courier is owed delivery pay plus tip; the platform keeps the rest. Any step can fail, and the payment provider is not your database.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Charge in full at checkout, then call everyone',
          text: 'If creating the order fails after the charge, the customer has paid for nothing. Every cancellation becomes a refund that takes days to land. Paying restaurant and courier with separate calls at delivery leaves no record of what was owed when one call fails.',
        },
        {
          grade: 'good',
          title: 'Authorise at checkout, capture at delivery',
          text: 'An authorisation holds the funds without moving them, so a cancellation is a void, not a refund: nothing moved, so nothing has to come back. Capture the final amount at delivery, which may be less than the hold when an item was missing. Every provider call carries an idempotency key (Stripe accepts one on every POST), so a retried capture cannot charge twice.',
        },
        {
          grade: 'great',
          title: 'A saga with compensations',
          text: 'Each step is a local transaction with a defined undo: void the authorisation, refund the capture, reverse a payout. The workflow from deep dive 1 drives it and records how far it got, so after a crash it either continues or compensates. It never forgets.',
        },
        {
          grade: 'best',
          title: 'A saga, plus a ledger the payouts come from',
          text: "At capture, write double-entry ledger lines that sum to zero: the customer's $30 becomes $20 owed to the restaurant, $7 to the courier and $3 of platform revenue. Payouts are batched from the ledger, and a daily reconciliation job matches it against the provider's settlement reports. The ledger is append-only: a correction is a new entry, never an edit.",
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'The happy path of the saga. Every step has an undo, and money only moves at the end.',
      figure: {
        kind: 'sequence',
        actors: ['Order workflow', 'Payment provider', 'Restaurant', 'Ledger'],
        steps: [
          { from: 0, to: 1, label: 'authorise $30, key 81-auth' },
          { from: 1, to: 0, label: 'held', dashed: true },
          { from: 0, to: 2, label: 'new order' },
          { from: 2, to: 0, label: 'accepted', dashed: true },
          { from: 0, to: 0, label: 'prepared, picked up, delivered' },
          { from: 0, to: 1, label: 'capture $30, key 81-capture', tone: 'mastered' },
          { from: 1, to: 0, label: 'captured', dashed: true, tone: 'mastered' },
          { from: 0, to: 3, label: 'customer -30: restaurant +20, courier +7, platform +3', tone: 'mastered' },
        ],
        note: 'Had the restaurant declined, the compensation is one call: void the hold. No money ever moved, so there is nothing to refund.',
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Reaching for [[2PC]] across the order database, the payment provider and the payout system. Stripe will not take part in your commit protocol, and a coordinator that dies mid-commit leaves every participant holding locks. A saga accepts a short window of inconsistency in exchange for steps that each commit on their own, and the compensations are how that window closes.',
    },
  ],
}
