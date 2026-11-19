import type { Problem } from '../types'

export const payments: Problem = {
  id: 'payments',
  title: 'Design a payment system like Stripe',
  kind: 'hld',
  category: 'commerce',
  difficulty: 'hard',
  brief:
    'Merchants call your API to charge their customers\' cards and to refund them. They need to know what happened to every payment, and nobody can ever be charged twice.',
  patterns: ['multistep', 'longrunning'],
  suggests: ['a-multistep', 'a-longrunning', 'c-queues', 'c-cap', 'd-delivery', 'd-transactions'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to charge, refund, status and notifications, and named fraud and disputes as out of scope' },
    { id: 'r2', bar: 'must', criterion: 'Put correctness ahead of latency and throughput, and said the scale is modest' },
    { id: 'r3', bar: 'must', criterion: 'Required an idempotency key on every request that moves money' },
    { id: 'r4', bar: 'must', criterion: 'Stored amounts as integers in minor units, always with a currency' },
    { id: 'r5', bar: 'senior', criterion: 'Stored idempotency keys durably, with the response, in the same transaction as the payment' },
    { id: 'r6', bar: 'senior', criterion: 'Modelled the payment as a state machine whose transitions are conditional updates' },
    { id: 'r7', bar: 'senior', criterion: 'Treated a processor timeout as unknown rather than failed, and resolved it by query or webhook' },
    { id: 'r8', bar: 'senior', criterion: 'Proposed a double-entry, append-only ledger in which every transaction sums to zero' },
    { id: 'r9', bar: 'senior', criterion: 'Delivered merchant webhooks at least once, signed, with event ids for deduplication' },
    { id: 'r10', bar: 'staff', criterion: 'Carried idempotency end to end, with a deterministic key on every call to the processor' },
    { id: 'r11', bar: 'staff', criterion: 'Reconciled daily against the processor\'s settlement report and classified the breaks' },
    { id: 'r12', bar: 'staff', criterion: 'Framed exactly-once as at-least-once delivery plus idempotent effects, through an outbox' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Merchants should be able to charge a customer\'s card and get a definite outcome.',
        'Merchants should be able to refund a payment, in full or in part.',
        'Merchants should be able to see every payment\'s status and be notified when it changes — and every movement of money should be recorded for balances and payouts.',
        'Out of scope: fraud scoring, disputes, payout scheduling, currency conversion, onboarding. Name fraud especially; in real life it sits right on this path.',
      ],
    },
    {
      kind: 'list',
      items: [
        '**Correct before fast.** No double charge, no lost payment, no money created or destroyed. Every movement recorded, and every record balanced.',
        '**Durable.** Once you have said "succeeded", that survives any single failure.',
        '**Available:** aim for 99.99% on the charge path. An outage is lost sales for every merchant at once.',
        'Scale: assume 10 million payments a day — about 115 a second, peaking near 1,000 [[TPS]] on a sale day. Modest.',
        '**Latency belongs to the card network:** an authorisation takes on the order of a second end to end. Your own overhead should be tens of milliseconds.',
      ],
    },
    {
      kind: 'prose',
      text: 'Whether you are Stripe calling acquiring banks or a shop calling Stripe, the shape is the same: you call a party you do not control, which is slow, and which sometimes times out without saying whether it took the money. Call it the processor — the [[PSP]].',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Say early that the scale is modest and correctness is the whole problem. A thousand transactions a second fits on one well-run Postgres primary. The interview is about what happens when a call times out, a retry arrives twice, or a webhook shows up before the response does.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'list',
      items: [
        '`Payment` — merchant, amount, currency, status. The state machine.',
        '`Attempt` — one call to the processor for a payment, with its own idempotency key and the processor\'s reference. A payment can have several.',
        '`IdempotencyRecord` — merchant, key, a fingerprint of the request, and the stored response.',
        '`LedgerEntry` — account, amount, debit or credit, and the transaction it belongs to. Append-only.',
        '`Refund` and `Event` — a refund is money moving the other way under its own key; an event is a state change owed to the merchant.',
      ],
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'code',
      code: `POST /payments
       Idempotency-Key: <key>
       { amount: 1999, currency: 'eur',
         paymentMethod: 'pm_…', capture: 'automatic' }
       -> Payment { id, status }
POST /payments/{id}/refunds
       Idempotency-Key: <key>
       { amount: 500 }                  -> Refund { id, status }
GET  /payments/{id}                     -> Payment
POST /processor/webhooks                -> 200 once stored
       (inbound: signed by the processor)`,
    },
    {
      kind: 'prose',
      text: 'The merchant comes from the [[API]] key. `amount` is an integer in the currency\'s minor unit — 1999 is €19.99 — because floating point cannot represent most decimal amounts exactly. Every call that moves money requires an idempotency key, and the payment method is a token: card numbers never reach this [[API]].',
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'The charge path: the key is claimed and the state committed before the processor is ever called.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Merchant', to: 'POST + key' },
          { label: 'Payments API', sub: 'claims the idempotency key', to: 'create' },
          { label: 'Payment service', sub: 'state machine · Postgres', tone: 'line', to: 'authorise' },
          { label: 'Processor adapter', sub: 'one per provider', to: 'card network' },
          { label: 'Issuing bank', sub: 'approves or declines' },
        ],
        note: 'Off the request path: an outbox feeds the ledger and merchant webhooks, inbound processor webhooks move payments between states, and a daily job reconciles everything against the processor\'s settlement report.',
      },
    },
    {
      kind: 'list',
      items: [
        '**Charge.** The [[API]] claims the idempotency key and creates the payment in one transaction, then the payment service calls the processor through an adapter. Bottleneck: a retry or a timeout becoming a second charge — deep dive 1.',
        '**Outcome.** The response, a webhook or a status query moves the payment through its states. Bottleneck: the processor\'s answer is slow, late, duplicated or missing — deep dive 2.',
        '**Refund.** A new attempt in the other direction, under its own key, allowed only once the payment is captured, and only up to the amount not yet refunded — a conditional update on the payment row.',
        '**Record and notify.** Each state change writes ledger entries and a merchant event. Bottleneck: proving the money is where you think it is — deep dive 3.',
      ],
    },
    {
      kind: 'prose',
      text: 'Card numbers stay out of all of this. A small vault service tokenises them at the edge, so only the vault is in [[PCI]] scope and every other service handles a token. Postgres holds payments, attempts, keys and the ledger: relational, transactional, and well within one primary at this rate, with synchronous replication so a committed payment survives losing a machine.',
    },

    { kind: 'heading', text: 'Deep dive 1 — idempotency: never charge twice' },
    {
      kind: 'prose',
      text: 'The merchant\'s request times out. Did you charge the card? The merchant cannot know, so it retries — and every design here is judged on what that retry does.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'No key: trust callers not to retry',
          text: 'They will. Mobile networks drop responses, load balancers time out, and every retry is a second charge.',
        },
        {
          grade: 'good',
          title: 'Deduplicate in a cache',
          text: '`SET key NX EX 86400` in Redis catches most retries. But an eviction or a failover forgets keys, and the cache stores no response — the retry learns "duplicate", not what happened.',
        },
        {
          grade: 'great',
          title: 'A durable key, stored with its response',
          text: 'A table keyed by `(merchant_id, key)` holding a fingerprint of the request and the final response, inserted in the same transaction as the payment. A retry gets the original response. The same key with different parameters is an error. A retry while the original is still running gets 409.',
        },
        {
          grade: 'best',
          title: 'Durable keys, carried to the processor',
          text: 'Your own call to the processor carries a deterministic key derived from the attempt id, so your retry of a timed-out processor call is as safe as the merchant\'s retry of you. Idempotency that stops at your front door just moves the double charge one hop down.',
        },
      ],
    },
    {
      kind: 'codeCompare',
      before: {
        title: 'Charges twice on retry',
        code: `async function createPayment(req: ChargeRequest) {
  const charge = await psp.charge({
    amount: req.amount,
    currency: req.currency,
    token: req.cardToken,
  })
  return db.payments.insert({
    merchantId: req.merchantId,
    pspRef: charge.id,
    status: 'captured',
  })
}`,
      },
      after: {
        title: 'Key first, and carried downstream',
        code: `async function createPayment(req: ChargeRequest, key: string) {
  const seen = await db.idem.find(req.merchantId, key)
  if (seen && seen.fingerprint !== fingerprint(req))
    throw new Unprocessable('key reused with other params')
  if (seen?.response) return seen.response
  if (seen) throw new Conflict('original still in flight')

  // Unique (merchantId, key): a concurrent twin fails here.
  const pay = await db.tx(async (tx) => {
    await tx.idem.insert(req.merchantId, key, fingerprint(req))
    return tx.payments.insert({ ...req, status: 'created' })
  })
  const result = await psp.authorize({
    amount: pay.amount,
    token: req.cardToken,
    idempotencyKey: \`\${pay.id}:attempt:1\`,
  })
  return recordOutcome(pay, result, key)
}`,
      },
      note: 'The unique index is what makes two simultaneous retries safe; the lookup is only the fast path. And the processor sees the same key on every retry of attempt 1.',
    },
    {
      kind: 'figure',
      caption: 'A timeout is not a failure. The payment is reported as processing, recovery retries with the same key, and the processor returns the charge it already made.',
      figure: {
        kind: 'sequence',
        actors: ['Merchant', 'Payments', 'Processor'],
        steps: [
          { from: 0, to: 1, label: 'POST /payments · key k1' },
          { from: 1, to: 2, label: 'authorise · key pay_7:1' },
          { from: 2, to: 1, label: 'timeout: did it charge?', dashed: true, tone: 'alert' },
          { from: 1, to: 0, label: 'status: processing', dashed: true },
          { from: 1, to: 1, label: 'recovery retries attempt 1' },
          { from: 1, to: 2, label: 'authorise · key pay_7:1' },
          { from: 2, to: 1, label: 'already approved: same result', dashed: true, tone: 'mastered' },
          { from: 1, to: 0, label: 'webhook: payment succeeded', dashed: true, tone: 'mastered' },
        ],
        note: 'If the handler dies before storing any response, its key record is left open; the recovery job that resolves stuck payments fills in the response too, so retries stop getting 409.',
      },
    },

    { kind: 'heading', text: 'Deep dive 2 — the state machine, the processor and webhooks' },
    {
      kind: 'prose',
      text: 'A payment is not a row with a boolean. It is a state machine, and the state that matters most is the one most designs forget: **we called the processor and do not know what happened.**',
    },
    {
      kind: 'figure',
      caption: 'The happy path. Every arrow is a conditional update, so a late webhook and a retry can never both apply the same step.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'created', sub: 'key claimed', to: 'commit, then call' },
          { label: 'authorising', sub: 'outcome may be unknown', tone: 'streak', to: 'approved' },
          { label: 'authorised', sub: 'funds reserved', tone: 'line', to: 'capture' },
          { label: 'captured', sub: 'money will move', tone: 'mastered' },
        ],
        note: 'Side exits: **declined** and **failed** from authorising, **voided** from authorised, **refunded** from captured. A timeout never moves a payment to failed — it stays in authorising until the processor says what happened.',
      },
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Call the processor; treat a timeout as a decline',
          text: 'The card was charged, the merchant was told it failed, the customer tries again with a new key, and now they are charged twice — by a system that had idempotency keys.',
        },
        {
          grade: 'good',
          title: 'Treat a timeout as unknown, and retry with the same key',
          text: 'Correct while the process stays alive. If it crashes mid-call, nothing records that a call was ever made.',
        },
        {
          grade: 'great',
          title: 'Commit the intent before the call',
          text: 'Write `authorising` and the attempt id first, then call. Anything left in `authorising` for more than a minute is picked up by a recovery worker, which asks the processor about that attempt and finishes the transition.',
        },
        {
          grade: 'best',
          title: 'Intent first, plus verified webhooks as a second source',
          text: 'The processor\'s webhooks report outcomes you may never have seen a response for. Verify the signature, store the event id so duplicates are dropped, and apply it as the same conditional transition — one that would move backwards is ignored. Response, webhook and recovery query all race to make one transition, and exactly one wins.',
        },
      ],
    },
    {
      kind: 'prose',
      text: 'Acknowledge an inbound webhook as soon as it is stored, and process it asynchronously. Processors retry anything you do not acknowledge in time, so a slow handler becomes a storm of duplicates. Your own webhooks to merchants follow the same rules in reverse: delivered at least once, signed with an [[HMAC]] over a timestamp and the body, carrying an event id to deduplicate on, retried with exponential backoff, and never promised in order. Each event carries the payment\'s current state, so a merchant receiving two out of order can tell which is newer.',
    },
    {
      kind: 'callout',
      tone: 'example',
      title: 'Stripe',
      text: 'Stripe\'s public design is the reference to name. An idempotency key is saved with the first response — success or failure — and kept for at least 24 hours; reusing a key with different parameters is an error. Webhooks are signed over a timestamp so they cannot be replayed, and retried for up to three days.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Reaching for a distributed transaction across your database and the processor. The processor will never take part in a two-phase commit with you. What works is local transactions plus idempotent retries — which is exactly what these deep dives are building.',
    },

    { kind: 'heading', text: 'Deep dive 3 — the ledger, reconciliation and exactly-once effects' },
    {
      kind: 'prose',
      text: 'The payments table says what you believe happened. The ledger says where the money is. They are different questions, and a balance column answers neither.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'A balance column on the merchant',
          text: 'Updated in place. A bug or a race silently creates or destroys money, and when a merchant asks why their balance is what it is, you have no answer.',
        },
        {
          grade: 'good',
          title: 'A log of transactions',
          text: 'History exists, but each row records one side. A fee or a refund can be written without its counterpart, and nothing notices money that came from nowhere.',
        },
        {
          grade: 'great',
          title: 'Double-entry, append-only',
          text: 'Every transaction posts two or more entries that sum to zero, checked on write. Balances are sums of entries. Nothing is updated or deleted; a mistake is corrected by a reversing entry, so the history is the audit trail.',
        },
        {
          grade: 'best',
          title: 'Double-entry, posted exactly once, reconciled daily',
          text: 'Entries are posted in the same transaction as the state change that causes them, or from an outbox under a unique key per transition. Either way, a capture never ends up without its entries, or with them twice. Then a daily job proves it against the processor.',
        },
      ],
    },
    {
      kind: 'prose',
      text: 'A €100 capture with a €3 fee is three entries. Debits equal credits, so the transaction sums to zero:',
    },
    {
      kind: 'table',
      head: ['Account', 'Debit', 'Credit'],
      rows: [
        ['Processor receivable', '100.00', ''],
        ['Merchant balance', '', '97.00'],
        ['Fee revenue', '', '3.00'],
      ],
    },
    {
      kind: 'prose',
      text: 'A refund is new entries in the opposite direction, never an edit. A dispute weeks later is more entries. The original capture stays exactly as it was written.',
    },
    {
      kind: 'prose',
      text: 'When the ledger is fed by events rather than written inline, be honest about delivery: there is no exactly-once delivery, only at-least-once delivery plus idempotent effects. The state change writes its event to an outbox table in the same transaction. A relay publishes it to Kafka, at least once. The ledger consumer posts under a unique `(payment_id, transition)` key, so a second delivery inserts nothing.',
    },
    {
      kind: 'figure',
      caption: 'Reconciliation, every day: three records of the same money, compared until every difference is explained.',
      figure: {
        kind: 'cycle',
        steps: [
          { label: 'Settlement report arrives', sub: 'what the processor actually moved' },
          { label: 'Match each line to an attempt', sub: 'by the processor reference' },
          { label: 'Compare amount, currency, status', sub: 'against payments and the ledger' },
          { label: 'Resolve the known breaks', sub: 'missed webhook: query and finish it' },
          { label: 'Queue the rest for a person', sub: 'fixed with adjusting entries, never edits' },
        ],
        note: 'Most breaks are timing — captured on the 31st, settled on the 1st. The ones that are not timing are bugs, and this is where you find them.',
      },
    },
    {
      kind: 'callout',
      tone: 'say',
      text: '"There is no exactly-once delivery, only exactly-once effects." Then name the three tools that get you there: idempotency keys at the edge, conditional state transitions in the middle, unique constraints on every effect.',
    },
  ],
  followups: [
    {
      q: 'Your processor is down. What do you do?',
      a: 'Route new payments to a second processor behind a circuit breaker. But never retry an attempt whose outcome is unknown on a different processor: the first one may have charged, and the second will charge again. Unknown attempts stay with their original processor and are resolved there when it recovers.',
    },
    {
      q: 'A merchant\'s webhook endpoint is down for six hours.',
      a: 'Events queue per merchant and retry with exponential backoff for days, so one dead endpoint never slows anyone else\'s. Tell merchants to treat webhooks as hints: each carries an id and the object\'s state, and `GET /payments/{id}` is the truth. An events-list endpoint lets them catch up on anything they missed.',
    },
    {
      q: 'How does a chargeback fit into this?',
      a: 'It arrives from the processor weeks later as a webhook. It is a new state on the payment and new ledger entries — debit the merchant\'s balance, credit what you now owe the processor — never an edit to the original capture. The merchant\'s balance can go negative, so the ledger must allow it and payouts must respect it.',
    },
    {
      q: 'Why integers, and what about currencies?',
      a: 'Floating point cannot represent 0.1 exactly, and the rounding drifts across millions of payments. Store integers in each currency\'s minor unit, with the currency on every amount, and look up the exponent per currency: the yen has no minor unit and some dinars have three decimal places. A ledger account holds one currency; converting is its own pair of entries at a recorded rate.',
    },
    {
      q: 'How do you scale the ledger past one database?',
      a: 'First say you will not need to for a long time: a few thousand entries a second fits one Postgres primary. Then shard by merchant, since most transactions touch one merchant\'s accounts. The hot spot is the platform\'s own fee account, which every transaction touches — split it into many sub-accounts and sum them when you report. Purpose-built ledgers such as TigerBeetle exist for when even that runs out.',
    },
  ],
}
