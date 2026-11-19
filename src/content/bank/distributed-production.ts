import type { Question } from '../types'

/** Authored bank questions — see docs/superpowers/plans/2026-11-18-question-brief.md */
export const questions: Question[] = [
  /* ---------------------------------------------------------------- */
  /* d-failure                                                         */
  /* ---------------------------------------------------------------- */
  {
    id: 'd-failure-tf1',
    kind: 'truefalse',
    moduleId: 'd-failure',
    section: 'Why a timeout is ambiguous',
    prompt: 'The shorter the timeout, the safer the system, because a hung dependency is detected sooner.',
    answer: false,
    explain:
      "Too short and you retry healthy-but-slow calls into an overload. Set each timeout from data, a little above the dependency's p99 latency, so you cut off the tail without failing normal requests.",
  },
  {
    id: 'd-failure-tf2',
    kind: 'truefalse',
    moduleId: 'd-failure',
    section: 'Partitions and split brain',
    prompt: 'With five voting nodes and a majority rule, at most one side of any network partition can elect a leader.',
    answer: true,
    explain:
      'A side needs three of five to act, and two separate groups cannot both hold three. The minority knows it is the minority and stops taking writes, so there is no split brain.',
  },
  {
    id: 'd-failure-multi',
    kind: 'multi',
    moduleId: 'd-failure',
    section: 'Gray failure',
    prompt: 'A node passes its health check while users routed to it time out. Which of these would catch it?',
    options: [
      'A health check that runs a real database query with its own short timeout',
      'Pinging the `/health` endpoint more often',
      'Ejecting the host after a run of 5xx responses seen by its callers',
      'Restarting the process whenever `/health` stops returning 200',
      "Flagging a node whose p99 latency is ten times its peers'",
    ],
    correct: [0, 2, 4],
    explain:
      'Gray failure is the detector and the users seeing different things. Only checks that exercise the real path, or judge the host by what callers experience, can see it; probing `/health` harder just gets the same 200.',
  },
  {
    id: 'd-failure-match',
    kind: 'match',
    moduleId: 'd-failure',
    section: 'The eight fallacies',
    prompt: 'Match each fallacy of distributed computing to the design mistake it leads to.',
    pairs: [
      { left: 'Latency is zero', right: 'Fifty sequential calls to render one page' },
      { left: 'Topology does not change', right: 'A cached belief about which node is primary' },
      { left: 'The network is secure', right: 'Trusting traffic because it is internal' },
      { left: 'Bandwidth is infinite', right: 'Shipping whole objects when an id would do' },
      { left: 'Transport cost is zero', right: 'Ignoring the bill for cross-region traffic' },
    ],
    explain:
      'Each fallacy is an assumption that holds on one machine and fails across many. The first two do most of the damage: every remote call can fail, and every remote call takes time.',
  },

  /* ---------------------------------------------------------------- */
  /* d-consistency                                                     */
  /* ---------------------------------------------------------------- */
  {
    id: 'd-consistency-tf1',
    kind: 'truefalse',
    moduleId: 'd-consistency',
    section: 'Quorums: R + W > N',
    prompt: 'With N = 3, W = 2 and R = 2, a Dynamo-style store gives linearizable reads.',
    answer: false,
    explain:
      'R + W > N only guarantees overlap. A read racing a write can return the new value while a later read returns the old one, unless reads repair stale replicas first; sloppy quorums and last write wins break it further.',
  },
  {
    id: 'd-consistency-tf2',
    kind: 'truefalse',
    moduleId: 'd-consistency',
    section: 'Sequential and causal',
    prompt: 'Under causal consistency, two unrelated posts can appear in different orders to different readers.',
    answer: true,
    explain:
      'Causal consistency orders only operations that are causally related: nobody sees a reply before its question. Independent posts may arrive in any order, which is what lets it stay available during a partition.',
  },
  {
    id: 'd-consistency-multi',
    kind: 'multi',
    moduleId: 'd-consistency',
    section: 'Linearizable: one copy, real time',
    prompt: 'Which of these paths need linearizable reads or writes?',
    options: [
      'Rendering the home feed',
      'Selling the last unit of stock',
      'Showing a user their own profile edit',
      "Taking a lock on tonight's billing run",
      'Electing the primary for a shard',
      "Showing a post's like count",
    ],
    correct: [1, 3, 4],
    explain:
      'Linearizability is for decisions made against the latest value, and it costs coordination on every operation. A profile edit needs only read-your-writes, and a feed or a like count is fine eventual.',
  },
  {
    id: 'd-consistency-match',
    kind: 'match',
    moduleId: 'd-consistency',
    section: 'Session guarantees: the bugs users actually see',
    prompt: 'Match each bug to the guarantee that would have prevented it.',
    pairs: [
      { left: 'You save your profile, reload, and see the old name', right: 'Read-your-writes' },
      { left: 'A refresh shows fewer replies than the one before', right: 'Monotonic reads' },
      { left: 'A reply appears before the question it answers', right: 'Causal consistency' },
      { left: 'Two sign-ups both get the same username', right: 'Linearizability' },
    ],
    explain:
      'The first two are per-session promises, cheap to offer with leader reads or sticky replicas. Causal keeps effects after their causes. A unique username is a decision against the latest value, so it needs linearizability.',
  },

  /* ---------------------------------------------------------------- */
  /* d-consensus                                                       */
  /* ---------------------------------------------------------------- */
  {
    id: 'd-consensus-tf1',
    kind: 'truefalse',
    moduleId: 'd-consensus',
    section: 'Log replication and majority commit',
    prompt: 'Adding a fourth node to a three-node Raft cluster lets it survive one more failure.',
    answer: false,
    explain:
      'Four nodes need three for a majority, so they survive one failure, just like three, and every write waits for one more acknowledgement. Go from three to five to survive two.',
  },
  {
    id: 'd-consensus-tf2',
    kind: 'truefalse',
    moduleId: 'd-consensus',
    section: 'Raft: terms and elections',
    prompt: 'A newly elected Raft leader always holds every entry that was already committed.',
    answer: true,
    explain:
      'A committed entry sits on a majority, any winning majority includes one of those nodes, and nodes vote only for a candidate whose log is at least as up to date as their own.',
  },
  {
    id: 'd-consensus-multi',
    kind: 'multi',
    moduleId: 'd-consensus',
    section: 'etcd and ZooKeeper in practice',
    prompt: 'Which of these belong in etcd or ZooKeeper?',
    options: [
      'The orders table',
      'Which node leads each shard',
      'Which configuration version is live',
      'A high-volume stream of click events',
      'Which nodes are members of the cluster',
    ],
    correct: [1, 2, 4],
    explain:
      "Consensus stores hold the metadata that must have exactly one answer. Every write is a majority round trip plus a disk sync, and etcd's default quota is 2 [[GB]], so business data stays out.",
  },
  {
    id: 'd-consensus-match',
    kind: 'match',
    moduleId: 'd-consensus',
    section: 'Leases and fencing tokens',
    prompt: 'Match each coordination primitive to what it does.',
    pairs: [
      { left: 'Lease', right: 'A lock that lapses unless it is renewed' },
      { left: 'Fencing token', right: 'A rising number the storage checks on each write' },
      { left: 'Raft term', right: 'Lets every node reject a deposed leader' },
      { left: 'Watch', right: 'Notifies you when a key changes' },
    ],
    explain:
      'A lease stops a crashed holder blocking everyone forever; a fencing token stops a paused one writing after its lease expired, because the resource does the check. The Raft term does the same fencing job inside the cluster.',
  },

  /* ---------------------------------------------------------------- */
  /* d-time                                                            */
  /* ---------------------------------------------------------------- */
  {
    id: 'd-time-tf1',
    kind: 'truefalse',
    moduleId: 'd-time',
    section: 'Logical clocks: Lamport and vector',
    prompt: 'If event a has a smaller Lamport timestamp than event b, then a happened before b.',
    answer: false,
    explain:
      'Only the converse holds: if a happened before b, then L(a) < L(b). Concurrent events get ordered numbers too, so telling them apart needs a vector clock.',
  },
  {
    id: 'd-time-tf2',
    kind: 'truefalse',
    moduleId: 'd-time',
    section: 'Why last write wins loses data',
    prompt: 'With perfectly synchronised clocks, last write wins would stop losing data.',
    answer: false,
    explain:
      'Skew is only one failure. Two concurrent writes, neither aware of the other, are both legitimate, and last write wins discards one of them by design.',
  },
  {
    id: 'd-time-multi',
    kind: 'multi',
    moduleId: 'd-time',
    section: 'Wall clocks and monotonic clocks',
    prompt: 'Which of these should be measured with a monotonic clock rather than the wall clock?',
    options: [
      'A request timeout',
      'The timestamp printed on a receipt',
      'The time left on a lease',
      'The delay before the next retry',
      'The order of writes made on two machines',
    ],
    correct: [0, 2, 3],
    explain:
      'A monotonic clock never goes backwards, so it is right for durations on one machine. It means nothing on another machine, so it cannot order writes across them, and a receipt needs the time of day.',
  },
  {
    id: 'd-time-match',
    kind: 'match',
    moduleId: 'd-time',
    section: 'Hybrid logical clocks and TrueTime',
    prompt: 'Match each clock to what it gives you.',
    pairs: [
      { left: 'Wall clock', right: 'Time of day, comparable to within the skew' },
      { left: 'Monotonic clock', right: 'Durations on one machine' },
      { left: 'Lamport clock', right: 'A total order consistent with causality' },
      { left: 'Vector clock', right: 'Detection of concurrent writes' },
      { left: 'Hybrid logical clock', right: 'Causal order that stays close to real time' },
    ],
    explain:
      'A Lamport clock orders events but cannot spot concurrency; a vector clock can, at the cost of a counter per node. An [[HLC]] adds a physical part, so you can ask for the state as of a time.',
  },

  /* ---------------------------------------------------------------- */
  /* d-transactions                                                    */
  /* ---------------------------------------------------------------- */
  {
    id: 'd-transactions-tf1',
    kind: 'truefalse',
    moduleId: 'd-transactions',
    section: 'Where it blocks',
    prompt: "Spanner avoids two-phase commit's blocking problem by making each coordinator a replicated Paxos group.",
    answer: true,
    explain:
      'When a coordinator machine dies, another replica holding the same log carries on, so participants in doubt never wait on a single node. Between services, [[2PC]] still blocks.',
  },
  {
    id: 'd-transactions-tf2',
    kind: 'truefalse',
    moduleId: 'd-transactions',
    section: 'The dual write, and the outbox',
    prompt: 'Because the outbox row commits with the business change, consumers receive each event exactly once.',
    answer: false,
    explain:
      'The outbox removes the dual write, but the relay can publish a row twice if it crashes before recording its progress. Delivery is at-least-once, so consumers dedupe by event id.',
  },
  {
    id: 'd-transactions-multi',
    kind: 'multi',
    moduleId: 'd-transactions',
    section: 'What a saga gives up',
    prompt: 'A saga has no isolation between its steps. Which of these limit the damage?',
    options: [
      'Hold row locks from the first step until the last',
      'Mark the order `PENDING` until the saga finishes',
      'Switch from orchestration to choreography',
      'Increment and decrement stock rather than setting it',
      'Send the confirmation email only after every step that can fail',
    ],
    correct: [1, 3, 4],
    explain:
      "Semantic locks, commutative updates and irreversible steps last are the three countermeasures. Locks held across steps bring back two-phase commit's blocking, and choreography changes who drives the flow, not what others see.",
  },
  {
    id: 'd-transactions-match',
    kind: 'match',
    moduleId: 'd-transactions',
    section: 'Sagas',
    prompt: 'Match each term to its role in a distributed transaction.',
    pairs: [
      { left: 'In doubt', right: 'Voted yes, and waiting for the coordinator' },
      { left: 'Compensating action', right: 'Semantically undoes a committed step' },
      { left: 'Pivot', right: 'The last step that can fail' },
      { left: 'Semantic lock', right: 'A `PENDING` status other flows respect' },
      { left: 'Outbox relay', right: 'Publishes events after the local commit' },
    ],
    explain:
      'A participant in doubt can neither commit nor abort alone. In a saga, steps before the pivot are compensated if something fails and steps after it only retry forwards.',
  },

  /* ---------------------------------------------------------------- */
  /* d-delivery                                                        */
  /* ---------------------------------------------------------------- */
  {
    id: 'd-delivery-tf1',
    kind: 'truefalse',
    moduleId: 'd-delivery',
    section: 'The dedupe table',
    prompt: 'A dedupe table makes an email send effectively-once, provided the consumer records the message id before sending.',
    answer: false,
    explain:
      'The marker and the effect must commit together, and an email cannot join a database transaction. A crash between them skips or repeats the send, so pass a key through to the external system instead.',
  },
  {
    id: 'd-delivery-tf2',
    kind: 'truefalse',
    moduleId: 'd-delivery',
    section: 'The three guarantees',
    prompt: 'For presence pings, at-most-once delivery can be the right choice.',
    answer: true,
    explain:
      'A lost ping is replaced by the next one seconds later, so losing one costs less than the machinery to handle duplicates. Money, stock and counts someone checks need effectively-once instead.',
  },
  {
    id: 'd-delivery-multi',
    kind: 'multi',
    moduleId: 'd-delivery',
    section: 'Idempotency keys',
    prompt: 'Which of these must hold for an idempotency key to prevent a double charge?',
    options: [
      'The client creates the key once, before the first attempt',
      'Each retry carries a fresh key so attempts can be told apart',
      'The key is stored in the same transaction as the charge',
      'Keys are kept forever and never pruned',
      'A concurrent retry with the same key waits or gets a conflict',
    ],
    correct: [0, 2, 4],
    explain:
      'The key names the logical operation, so it is fixed before the first try, saved atomically with the effect, and guarded by a unique constraint. Keys need only outlive the retry window: Stripe may prune them once they are 24 hours old.',
  },
  {
    id: 'd-delivery-match',
    kind: 'match',
    moduleId: 'd-delivery',
    section: "What Kafka's exactly-once covers",
    prompt: 'Match each mechanism to what it actually guarantees.',
    pairs: [
      { left: 'Idempotent producer', right: 'No duplicates from producer retries' },
      { left: 'Kafka transactions', right: 'Output and offsets commit together' },
      { left: '`read_committed`', right: 'Consumers never see aborted writes' },
      { left: 'SQS FIFO deduplication id', right: 'Repeats dropped within five minutes' },
      { left: 'Consumer dedupe table', right: 'Effect applied once per message id' },
    ],
    explain:
      'Each covers a narrow slice: Kafka transactions make a Kafka-to-Kafka hop exactly-once, and [[SQS]] [[FIFO]] dedupes only within its window. Effects outside the broker still need the consumer to dedupe.',
  },

  /* ---------------------------------------------------------------- */
  /* d-resilience                                                      */
  /* ---------------------------------------------------------------- */
  {
    id: 'd-resilience-tf1',
    kind: 'truefalse',
    moduleId: 'd-resilience',
    section: 'Retry storms and budgets',
    prompt: 'If each of four layers makes up to three attempts, one failing request can become 81 calls on the service at the bottom.',
    answer: true,
    explain:
      'Attempts multiply rather than add: 3 × 3 × 3 × 3 = 81, landing on the service with least capacity to spare. Retry at one layer with a budget, and let the layers below fail fast.',
  },
  {
    id: 'd-resilience-tf2',
    kind: 'truefalse',
    moduleId: 'd-resilience',
    section: 'Load shedding and backpressure',
    prompt: 'An unbounded queue is a safe way to absorb overload, because no request is ever rejected.',
    answer: false,
    explain:
      'It hides overload: latency climbs without limit while requests wait behind ones whose callers have already given up. Bound every queue and reject when it is full.',
  },
  {
    id: 'd-resilience-multi',
    kind: 'multi',
    moduleId: 'd-resilience',
    section: 'Retries, backoff and jitter',
    prompt: 'The operation is idempotent. Which of these outcomes are worth retrying?',
    options: [
      'A 400 Bad Request',
      'A timeout',
      'A 503 Service Unavailable',
      'A 403 Forbidden',
      'A 429 with `Retry-After`, once that wait has passed',
    ],
    correct: [1, 2, 4],
    explain:
      'Retry only what might succeed next time: a timeout, an overloaded or restarting server, or a rate limit once its wait is over. A malformed or forbidden request fails the same way on every attempt.',
  },
  {
    id: 'd-resilience-match',
    kind: 'match',
    moduleId: 'd-resilience',
    section: 'Circuit breakers',
    prompt: 'Match each resilience pattern to the problem it solves.',
    pairs: [
      { left: 'Deadline propagation', right: 'Work continuing after the caller gave up' },
      { left: 'Jitter', right: 'Retries arriving in synchronised waves' },
      { left: 'Retry budget', right: 'Retries piling load onto a broken service' },
      { left: 'Circuit breaker', right: 'Callers waiting out timeouts on a dead dependency' },
      { left: 'Bulkhead', right: 'One slow dependency draining a shared pool' },
    ],
    explain:
      "Each stops slowness spreading a different way. Jitter spreads retries over time, a budget caps their volume, a breaker stops calls altogether, and a bulkhead confines a dependency's failure to its own pool.",
  },

  /* ---------------------------------------------------------------- */
  /* o-observability                                                   */
  /* ---------------------------------------------------------------- */
  {
    id: 'o-observability-tf1',
    kind: 'truefalse',
    moduleId: 'o-observability',
    section: 'What each signal answers',
    prompt: 'A request counter costs more to store at a million requests a second than at ten.',
    answer: false,
    explain:
      'A counter is one number per interval at any traffic level. Metric cost grows with the number of series, meaning label combinations, while logs and traces grow with traffic.',
  },
  {
    id: 'o-observability-tf2',
    kind: 'truefalse',
    moduleId: 'o-observability',
    section: 'Metrics: RED, USE and cardinality',
    prompt: "If a page fans out to a hundred backend calls, most page loads include at least one call slower than the backend's p99.",
    answer: true,
    explain:
      'Each call has a 1% chance of being that slow, so 1 − 0.99¹⁰⁰ ≈ 63% of pages hit at least one. That is why you report percentiles, not the mean.',
  },
  {
    id: 'o-observability-multi',
    kind: 'multi',
    moduleId: 'o-observability',
    section: 'Structured logging',
    prompt: 'Which of these are good structured-logging practice in production?',
    options: [
      'Include the trace id on every line',
      'Log the bearer token so a failed request can be replayed',
      'Use stable field names, one event per line',
      'Write each error as a readable sentence rather than a code',
      'Keep every error and slow request, and sample the successes',
      'Leave debug level on so nothing is missed',
    ],
    correct: [0, 2, 4],
    explain:
      'Stable fields make logs queryable, and the trace id joins a line to its request. Tokens in logs turn the log store into the breach, prose errors defeat filtering, and debug volume buries the signal.',
  },
  {
    id: 'o-observability-match',
    kind: 'match',
    moduleId: 'o-observability',
    section: 'Distributed tracing',
    prompt: 'Match each tracing term to what it is.',
    pairs: [
      { left: 'Trace', right: 'The whole request, across every service' },
      { left: 'Span', right: 'One timed unit of work, with a parent' },
      { left: '`traceparent`', right: 'Header carrying the trace and parent span ids' },
      { left: 'Head-based sampling', right: 'Decides at the first service' },
      { left: 'Tail-based sampling', right: 'Decides once the trace has completed' },
    ],
    explain:
      'Spans join into one trace only if every hop propagates `traceparent`. Head sampling is cheap but blind to outcome; tail sampling buffers spans so it can keep every error and slow trace.',
  },

  /* ---------------------------------------------------------------- */
  /* o-slo                                                             */
  /* ---------------------------------------------------------------- */
  {
    id: 'o-slo-tf1',
    kind: 'truefalse',
    moduleId: 'o-slo',
    section: 'The nines',
    prompt: 'A service that synchronously needs three dependencies, each at 99.9% and failing independently, can itself reach 99.9%.',
    answer: false,
    explain:
      "Availability multiplies along a chain: 0.999³ ≈ 99.7%, before counting the service's own failures. A higher target needs redundancy or fewer synchronous dependencies.",
  },
  {
    id: 'o-slo-tf2',
    kind: 'truefalse',
    moduleId: 'o-slo',
    section: 'Alerting on burn rate',
    prompt: 'At a burn rate of 14.4, a 30-day error budget is gone in about two days.',
    answer: true,
    explain:
      'A burn rate of 1 spends the budget in exactly 30 days, so 14.4 spends it in 30 ÷ 14.4 ≈ 2.1 days, or 2% every hour. That is why it pages at once.',
  },
  {
    id: 'o-slo-multi',
    kind: 'multi',
    moduleId: 'o-slo',
    section: 'SLI, SLO, SLA',
    prompt: 'Which of these make a good [[SLI]]?',
    options: [
      'Average CPU across the fleet',
      'Share of checkout requests served in under 300 ms, at the load balancer',
      'Failed requests, as counted by the server itself',
      'Share of pipeline records less than five minutes old',
      'Share of stored objects that can be read back intact',
      'Pod restarts per hour',
    ],
    correct: [1, 3, 4],
    explain:
      'An SLI is a ratio of good events to valid events, measured near the user. [[CPU]] and restarts are causes users may never feel, and a server that is down counts no failures at all.',
  },
  {
    id: 'o-slo-match',
    kind: 'match',
    moduleId: 'o-slo',
    section: 'Error budgets',
    prompt: 'Match each [[SLO]] to its 30-day error budget, as full outage.',
    pairs: [
      { left: '99%', right: '7.2 hours' },
      { left: '99.9%', right: '43 minutes' },
      { left: '99.95%', right: '22 minutes' },
      { left: '99.99%', right: '4.3 minutes' },
      { left: '99.999%', right: '26 seconds' },
    ],
    explain:
      'Thirty days is 43,200 minutes, and each extra nine leaves a tenth of the room: 0.1% is 43 minutes. At five nines nobody can even acknowledge a page before the budget is gone.',
  },

  /* ---------------------------------------------------------------- */
  /* o-auth                                                            */
  /* ---------------------------------------------------------------- */
  {
    id: 'o-auth-tf1',
    kind: 'truefalse',
    moduleId: 'o-auth',
    section: 'OIDC: identity on top',
    prompt: 'A client should send its [[OIDC]] ID token to the [[API]] as the credential for each call.',
    answer: false,
    explain:
      'The ID token tells the client who signed in. The access token, carrying scopes, is what authorises calls to an API; mixing the two up is the classic OIDC bug.',
  },
  {
    id: 'o-auth-tf2',
    kind: 'truefalse',
    moduleId: 'o-auth',
    section: 'Sessions or tokens',
    prompt: 'For a first-party web app, server sessions are usually a better default than self-contained tokens.',
    answer: true,
    explain:
      'A session lookup costs well under a millisecond, and revoking one is deleting a key. Tokens earn their place when many services, or other organisations, must verify a user without calling home.',
  },
  {
    id: 'o-auth-multi',
    kind: 'multi',
    moduleId: 'o-auth',
    section: 'What JWTs really cost',
    prompt: 'Which of these are real costs of self-contained [[JWT]] access tokens?',
    options: [
      'A stolen token keeps working until it expires',
      'Every service must call the auth server to verify it',
      'Roles inside it are stale until the next refresh',
      'Anyone holding it can read its payload',
      'It cannot be verified by another organisation',
    ],
    correct: [0, 2, 3],
    explain:
      'A JWT is verified locally with a public key, by anyone who has it. That is its appeal and the source of its costs: no recall before expiry, a snapshot of roles, and a payload that is encoded, not encrypted.',
  },
  {
    id: 'o-auth-match',
    kind: 'match',
    moduleId: 'o-auth',
    section: 'OAuth 2.0 and PKCE',
    prompt: 'Match each piece of the OAuth authorization code flow with [[PKCE]] to its job.',
    pairs: [
      { left: 'Authorization code', right: 'One-time, and passes through the browser' },
      { left: 'Code verifier', right: 'Never leaves the app that started the flow' },
      { left: 'Access token', right: 'Sent to the API, carrying scopes' },
      { left: 'ID token', right: 'Tells the client who signed in' },
      { left: 'Refresh token', right: 'Checked against a store to get new access tokens' },
    ],
    explain:
      'The code can leak in transit, so redeeming it needs the verifier, which never travels through the browser. The access token goes to the [[API]]; the ID token, which [[OIDC]] adds, stays with the client.',
  },

  /* ---------------------------------------------------------------- */
  /* o-security                                                        */
  /* ---------------------------------------------------------------- */
  {
    id: 'o-security-tf1',
    kind: 'truefalse',
    moduleId: 'o-security',
    section: 'TLS: what it guarantees',
    prompt: 'Once [[TLS]] terminates at the load balancer, plain [[HTTP]] to internal services is safe, because the network is private.',
    answer: false,
    explain:
      "Assume an attacker is already inside. Re-encrypt to the services, or let the mesh run [[mTLS]], which also proves each service's identity so a compromised pod cannot impersonate another.",
  },
  {
    id: 'o-security-tf2',
    kind: 'truefalse',
    moduleId: 'o-security',
    section: 'Encryption at rest and in transit',
    prompt: 'With envelope encryption, rotating the master key does not mean re-encrypting the stored data.',
    answer: true,
    explain:
      'Each item is encrypted with its own data key, and only those small data keys are wrapped by the master key in the [[KMS]]. Rotation re-wraps the data keys, not terabytes of data.',
  },
  {
    id: 'o-security-multi',
    kind: 'multi',
    moduleId: 'o-security',
    section: 'Four attacks, four fixes',
    prompt: 'Which of these defend against [[CSRF]]?',
    options: [
      'Escaping output for its context',
      '`SameSite=Lax` session cookies',
      'An anti-forgery token on state-changing requests',
      'A `Content-Security-Policy` header',
      'Checking the `Origin` header on state-changing requests',
      '`HttpOnly` session cookies',
    ],
    correct: [1, 2, 4],
    explain:
      'A forged request needs the browser to attach the cookie, not to read it, so `HttpOnly` does not help. Escaping and a content security policy stop [[XSS]], a different attack.',
  },
  {
    id: 'o-security-match',
    kind: 'match',
    moduleId: 'o-security',
    section: 'Four attacks, four fixes',
    prompt: 'Match each attack to what it lets the attacker do.',
    pairs: [
      { left: 'Injection', right: 'Make input run as part of a query' },
      { left: 'XSS', right: "Run script on your page in a user's browser" },
      { left: 'CSRF', right: "Make a user's browser send a request with their cookies" },
      { left: 'SSRF', right: 'Make your server fetch an address of their choosing' },
    ],
    explain:
      "All four treat untrusted data as an instruction. Injection reaches the database, [[XSS]] borrows your page, [[CSRF]] borrows the user's browser and cookies, and [[SSRF]] borrows your server's place on the network.",
  },

  /* ---------------------------------------------------------------- */
  /* o-deploy                                                          */
  /* ---------------------------------------------------------------- */
  {
    id: 'o-deploy-tf1',
    kind: 'truefalse',
    moduleId: 'o-deploy',
    section: 'Rolling and blue/green',
    prompt: 'Blue/green makes rollback instant even after the new version has written data in a new format.',
    answer: false,
    explain:
      'The router switch is instant; the database is not. If green wrote rows blue cannot read, flipping back serves errors, so rollback is only as fast as the least reversible change.',
  },
  {
    id: 'o-deploy-tf2',
    kind: 'truefalse',
    moduleId: 'o-deploy',
    section: 'Migrations: expand and contract',
    prompt: 'In expand and contract, code that writes to both columns ships before the backfill runs.',
    answer: true,
    explain:
      'Writing both first means every row written during and after the backfill already has the new value. Backfill first and the rows written before the dual-write deploy lands are missed.',
  },
  {
    id: 'o-deploy-multi',
    kind: 'multi',
    moduleId: 'o-deploy',
    section: 'Deploy is not release',
    prompt: 'Which of these are sound practice for feature flags?',
    options: [
      'Give every flag an owner and an expiry date',
      'Reuse a retired flag for a new feature',
      'Evaluate flags from an in-process cache of the rules',
      'Put schema changes behind a flag so they can be switched off',
      'Call the flag service on every check for the freshest value',
      'Fall back to the known-good path if the flag service is down',
    ],
    correct: [0, 2, 5],
    explain:
      'Flags are debt, evaluated locally so the flag service is not on every request path. Knight Capital lost more than $440 million when a reused flag woke dead code, and no flag can undo a schema change.',
  },
  {
    id: 'o-deploy-match',
    kind: 'match',
    moduleId: 'o-deploy',
    section: 'Canary releases',
    prompt: 'Match each release technique to what it gives you.',
    pairs: [
      { left: 'Rolling deploy', right: 'No spare fleet, but two versions serve at once' },
      { left: 'Blue/green', right: 'One-switch rollback, at double capacity' },
      { left: 'Canary', right: 'A small slice judged against a baseline' },
      { left: 'Dark launch', right: 'Real traffic, with the results thrown away' },
      { left: 'Feature flag', right: 'Release and rollback without a deploy' },
    ],
    explain:
      'Rolling and blue/green both reach every user without comparing versions; only a canary limits how far a bad build gets while you judge it. A dark launch tests real load before anyone sees the result.',
  },
]
