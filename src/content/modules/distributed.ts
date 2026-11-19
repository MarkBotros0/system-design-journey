import type { Module } from '../types'

/**
 * Track — Distributed systems (D).
 * trackId: 'distributed'. Authoring rules: docs/superpowers/plans/2026-11-18-content-brief.md
 *
 * Deepens the core survey (c-cap, c-queues) and the applied saga lesson (a-multistep).
 * Each station builds on the one before: failure → consistency → consensus → time →
 * transactions → delivery → resilience.
 */
export const distributedModules: Module[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'd-failure',
    trackId: 'distributed',
    title: 'Partial failure',
    station: 1,
    prereqs: ['c-cap'],
    related: ['c-cap', 'f-network'],
    minutes: 10,
    summary: 'Why a distributed system fails in pieces, why a timeout cannot tell you what happened, and how one split network becomes two leaders.',
    objectives: [
      'Name the fallacies of distributed computing that most often break a design',
      'Explain why a timeout is ambiguous, and design so that it does not matter',
      'Recognise gray failure, and why health checks miss it',
      'Prevent split brain with a majority, not a heartbeat',
    ],
    keywords: ['fallacies of distributed computing', 'partial failure', 'network partition', 'split brain', 'gray failure', 'timeout', 'failure detector', 'heartbeat'],
    lesson: [
      {
        kind: 'prose',
        text: 'On one machine, a function call either returns or the process dies. Across machines there is a third outcome, and it is the one this whole track is about: **you sent a request and heard nothing back**. Some of the system works, some of it does not, and from where you stand you cannot see which part is which.',
      },
      {
        kind: 'prose',
        text: 'Interviewers probe this because it is where a box-and-arrow diagram stops being honest. Every arrow you draw is a network call that can be slow, lost or delivered twice. A senior answer says what happens when an arrow fails, before anyone asks.',
      },
      {
        kind: 'figure',
        caption: 'The charge succeeded and the reply was lost. To the client this looks exactly like a request that never arrived.',
        figure: {
          kind: 'sequence',
          actors: ['Checkout', 'Payments'],
          steps: [
            { from: 0, to: 1, label: 'charge card for order 4471' },
            { from: 1, to: 1, label: 'charge committed', tone: 'mastered' },
            { from: 1, to: 0, label: 'ok — lost on the way back', dashed: true, tone: 'alert' },
            { from: 0, to: 0, label: 'timeout after 2 s', tone: 'streak' },
            { from: 0, to: 0, label: 'charged or not? no way to tell', tone: 'alert' },
          ],
          note: 'Retry and you may charge twice. Do not retry and you may never charge at all.',
        },
      },
      { kind: 'heading', text: 'The eight fallacies' },
      {
        kind: 'prose',
        text: 'In the 1990s L Peter Deutsch and colleagues at Sun Microsystems wrote down the assumptions engineers new to distributed systems make, all of which turn out to be false. The list is thirty years old and every item still shows up in interview designs.',
      },
      {
        kind: 'table',
        head: ['Fallacy', 'What it breaks in a design'],
        rows: [
          ['The network is reliable', 'Any call with no timeout and no retry policy'],
          ['Latency is zero', 'Chatty designs: 50 sequential calls at 2 ms each is 100 ms before any real work'],
          ['Bandwidth is infinite', 'Shipping whole objects when an id or a diff would do'],
          ['The network is secure', 'Trusting traffic because it is "internal"'],
          ['Topology does not change', 'Hard-coded addresses, and cached beliefs about who is primary'],
          ['There is one administrator', 'Assuming you control both ends of every upgrade'],
          ['Transport cost is zero', 'Cross-zone and cross-region traffic is billed per [[GB]]'],
          ['The network is homogeneous', 'Assuming every client speaks the same version of your protocol'],
        ],
      },
      {
        kind: 'prose',
        text: 'The first two do most of the damage. If you keep one line from the list: **every remote call can fail, and every remote call takes time**. Design as if both are always true.',
      },
      { kind: 'heading', text: 'Why a timeout is ambiguous' },
      {
        kind: 'prose',
        text: 'When a call times out, any of these may have happened, and the caller cannot tell which:',
      },
      {
        kind: 'list',
        ordered: true,
        items: [
          'The request was lost before it arrived.',
          'The server is down — or paused. A long garbage-collection pause looks exactly like a crash from outside.',
          'The server did the work, and the reply was lost.',
          'The server is still doing the work, and will finish after you give up.',
          'Nothing is broken; a queue somewhere is full and everything is slow.',
        ],
      },
      {
        kind: 'prose',
        text: 'Cases 3 and 4 are the dangerous ones: the work happened, or will. No timeout value resolves this, because the information is not available to the caller at all. This is the Two Generals problem: over a network that can lose messages, no protocol lets two sides be certain they agree. What you can do is make it not matter, by making retries safe — station 6.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'A timeout means "I do not know", not "it failed". So every call I retry is idempotent, and anything that must not happen twice carries an idempotency key the other side can recognise.',
      },
      {
        kind: 'prose',
        text: 'You still need timeouts: without one, a dead server holds your threads forever. Set them from data, a little above the dependency\'s p99 latency, not a round number. Too short and you retry healthy-but-slow calls into an overload; too long and a dead dependency eats your capacity while you wait. Station 7 goes deeper.',
      },
      { kind: 'heading', text: 'Gray failure' },
      {
        kind: 'prose',
        text: 'A clean crash is the easy case: the node stops answering, something notices, traffic moves. The failures behind long outages are **gray**: a node that is up, passes its health check, and is failing. A disk taking four seconds per write. A network card dropping a few percent of packets. A process whose worker pool is exhausted while its `/health` endpoint, served from a separate thread, cheerfully returns 200.',
      },
      {
        kind: 'prose',
        text: 'Microsoft\'s 2017 paper on gray failure names the cause **differential observability**: the failure detector and the clients see different things. The health check says healthy; users see timeouts. Because the node is never marked down, nothing fails over — and a slow node can do more damage than a dead one, since it keeps attracting traffic.',
      },
      {
        kind: 'figure',
        caption: 'Gray failure: the failure detector and the users disagree about whether the node is healthy.',
        figure: {
          kind: 'split',
          left: {
            title: 'What the health check sees',
            tone: 'mastered',
            nodes: [
              { label: 'GET /health', sub: 'its own thread', to: '200 in 3 ms' },
              { label: 'Healthy', sub: 'stays in the pool', tone: 'mastered' },
            ],
            cost: 'Nothing fails over, so traffic keeps arriving.',
          },
          right: {
            title: 'What users see',
            tone: 'alert',
            nodes: [
              { label: 'POST /orders', sub: 'worker pool exhausted', to: 'waits' },
              { label: 'Timeouts', sub: 'on every real request', tone: 'alert' },
            ],
            cost: 'The outage lasts as long as nobody believes it.',
          },
          verdict: 'Probe what users do, not whether the process is alive — and let callers report what they actually experience.',
        },
      },
      { kind: 'prose', text: 'Three things catch it:' },
      {
        kind: 'list',
        items: [
          '**Deep health checks** that exercise the real path — a query against the database, a write to the disk — with a short timeout of their own.',
          '**Outlier detection from the caller\'s side.** Envoy ejects a host from its pool after a run of consecutive 5xx responses, whatever the host\'s health check claims.',
          '**Watch latency, not just errors.** A node at ten times its peers\' p99 is failing even if it never returns an error.',
        ],
      },
      { kind: 'heading', text: 'Partitions and split brain' },
      {
        kind: 'prose',
        text: 'A **network partition** is the extreme case: two groups of nodes, each healthy, unable to reach each other. Each side sees the other as dead. If both are allowed to act on that belief — "the primary is gone, so I am the primary now" — you get **split brain**: two leaders accepting writes, and two histories someone has to reconcile by hand. This is the partition [[CAP]] is about, seen from the inside.',
      },
      {
        kind: 'figure',
        caption: 'Split brain: two sides that each believe they are the survivor.',
        figure: {
          kind: 'timeline',
          ticks: ['link drops', 'both sides act', 'link returns'],
          lanes: [
            {
              label: 'East — old primary',
              bars: [{ from: 0, to: 0.7, label: 'still primary, takes writes', tone: 'streak' }],
              outcome: { label: 'diverged', tone: 'alert' },
            },
            {
              label: 'West — promoted on a missed heartbeat',
              bars: [{ from: 0.15, to: 0.7, label: 'primary too, takes writes', tone: 'streak' }],
              outcome: { label: 'diverged', tone: 'alert' },
            },
            {
              label: 'With a majority rule',
              bars: [
                { from: 0, to: 0.7, label: 'minority side refuses writes', tone: 'line' },
                { from: 0.7, to: 1, label: 'one history', tone: 'mastered' },
              ],
              outcome: { label: 'clean', tone: 'mastered' },
            },
          ],
          note: 'Neither side was wrong to suspect the other had died. The mistake was letting both act on it.',
        },
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'GitHub, October 2018',
        text: 'Replacing failing optical equipment cut the link between GitHub\'s East Coast network hub and its primary East Coast datacentre for 43 seconds. In that window, Orchestrator — the tool managing their MySQL topology — promoted West Coast databases to primary. When the link returned, the East Coast held writes that had never reached the West, and the West had been taking new writes since. GitHub chose data integrity over availability and ran degraded for just over 24 hours while they reconciled.',
      },
      {
        kind: 'prose',
        text: 'The fix is not a better heartbeat. It is a rule that **only a majority can act**. With five nodes, a side needs three to elect a leader or accept a write, and at most one side of any partition can have three. The minority knows it is the minority, and stops. That rule is consensus, and it is station 3 — along with fencing, the answer when a majority is not available.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Drawing a primary and a standby with a heartbeat between them and calling it highly available. Two nodes cannot tell "the other one died" from "the link between us died". Either the standby never takes over, or one day both are primary. You need a third vote, or a fence.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'How does your service know a dependency is down?',
            a: 'It cannot know, only suspect. I would put a timeout on every call and run outlier detection on real traffic, so a host that keeps failing — or slows to several times its peers\' latency — is ejected even while its health check passes. The health check itself exercises the real dependency path with its own short timeout.',
          },
          {
            q: 'The payment call timed out. Do you retry?',
            a: 'Only because the call carries an idempotency key, so the provider recognises the retry and returns the original result. Without one, a retry risks a double charge and not retrying risks a lost one. If the provider has no keys, I query the payment\'s status by my own reference before deciding.',
          },
          {
            q: 'Why not fail over as soon as the primary misses a heartbeat?',
            a: 'Because a missed heartbeat is also what a short network blip or a long pause looks like. Fail over eagerly and you promote a new primary while the old one is alive — GitHub\'s 43-second partition is the case study. Failover needs a majority to agree and the old primary fenced, with a detection threshold well above normal jitter.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-d-failure-1',
        moduleId: 'd-failure',
        stem: 'Your call to the inventory service times out after 2 seconds. What do you actually know?',
        options: [
          'The inventory service is down and should be failed over',
          'The request was never processed, so it is safe to retry',
          'Only that you stopped waiting — the work may have happened, may still happen, or never arrived',
          'The network between the two services is partitioned',
        ],
        correct: 2,
        explain:
          'A timeout tells you nothing about the far side. The server may have done the work and lost the reply, or still be doing it. "Down" and "never processed" are guesses, and acting on the second one is how retries double-charge people.',
      },
      {
        id: 'q-d-failure-2',
        moduleId: 'd-failure',
        stem: 'A node\'s health check returns 200, but requests routed to it time out. What is this, and what catches it?',
        options: [
          'A network partition — wait for the link to heal',
          'Gray failure — detect it from real traffic, by ejecting hosts on caller-observed errors and latency',
          'Split brain — fence the node so it cannot write',
          'A cold cache — warm the node before routing traffic to it',
        ],
        correct: 1,
        explain:
          'The detector and the users disagree: differential observability. A shallow health check cannot see an exhausted pool or a slow disk. Judging the host by what its callers experience can, which is what outlier ejection does.',
      },
      {
        id: 'q-d-failure-3',
        moduleId: 'd-failure',
        stem: 'You run a primary and a standby in two datacentres with a heartbeat between them. The link drops. What is the core risk?',
        options: [
          'Neither node can tell a dead peer from a dead link, so both may end up acting as primary',
          'The standby\'s copy of the data is a few seconds stale',
          'Heartbeats across regions add too much network traffic',
          'The primary will crash when it loses the standby',
        ],
        correct: 0,
        explain:
          'With two nodes there is no majority, so neither can safely decide it is the survivor. A third voter or a fencing mechanism is what makes failover safe. Staleness is real but it is the smaller problem: split brain loses writes on both sides.',
      },
    ],
    cards: [
      {
        id: 'c-d-failure-1',
        moduleId: 'd-failure',
        front: 'What does a timeout tell you?',
        back: 'Only that you stopped waiting. The request may be lost, done with the reply lost, or still running. So retried calls must be idempotent.',
        tag: 'Failure',
      },
      {
        id: 'c-d-failure-2',
        moduleId: 'd-failure',
        front: 'What is gray failure?',
        back: 'A node that is up and passes health checks but fails users: slow disk, exhausted pool. The detector and the clients see different things.',
        tag: 'Failure',
      },
      {
        id: 'c-d-failure-3',
        moduleId: 'd-failure',
        front: 'How do you prevent split brain?',
        back: 'Only a majority may elect a leader or accept writes, and old leaders are fenced. Two nodes and a heartbeat cannot do it.',
        tag: 'Failure',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'd-consistency',
    trackId: 'distributed',
    title: 'Consistency models',
    station: 2,
    prereqs: ['d-failure'],
    related: ['c-cap'],
    minutes: 12,
    summary: 'From linearizable to eventual: what each model promises a reader, what it costs, and which products give you which.',
    objectives: [
      'Order the models from linearizable to eventual, and say what each one lets a reader see',
      'Use quorums (R + W > N), and say why they are not enough on their own',
      'Pick the weakest model each path can tolerate, and name a product that provides it',
    ],
    keywords: ['linearizability', 'strong consistency', 'sequential consistency', 'causal consistency', 'read your writes', 'monotonic reads', 'eventual consistency', 'quorum'],
    lesson: [
      {
        kind: 'prose',
        text: 'The core track said "eventual, unless it is money, inventory or bookings". Right instinct, wrong vocabulary for a senior round. "Strong" and "eventual" are the two ends of a ladder with useful rungs in between, and most real consistency bugs live on the middle rungs.',
      },
      {
        kind: 'prose',
        text: 'A consistency model is a promise about **what a reader can observe** when data has several copies. The interview move is to name the weakest model each path can tolerate, because every rung up costs latency, availability, or both. One boundary to keep clear: this is about single objects across replicas. What concurrent multi-row transactions see is **isolation**, a separate axis the databases track covers.',
      },
      {
        kind: 'figure',
        caption: 'Consistency models from strongest to weakest. Each is a promise about what a reader may see.',
        figure: {
          kind: 'stack',
          layers: [
            { label: 'Linearizable', sub: 'behaves like one copy, in real-time order' },
            { label: 'Sequential', sub: 'one order everyone agrees on, possibly behind real time' },
            { label: 'Causal', sub: 'causes before effects · the strongest that stays available', tone: 'line' },
            { label: 'Read-your-writes · monotonic reads', sub: 'promises to one session, not to everyone' },
            { label: 'Eventual', sub: 'replicas converge once writes stop' },
          ],
          note: 'Each step down is cheaper and survives more failures, and lets readers see more strangeness.',
        },
      },
      { kind: 'heading', text: 'Linearizable: one copy, real time' },
      {
        kind: 'prose',
        text: '**Linearizability** makes a replicated object behave as if there were a single copy, with every operation taking effect at one instant between its start and its finish. Once any reader has seen a write, every reader that starts later sees it too. Nothing goes backwards.',
      },
      {
        kind: 'prose',
        text: 'You need it wherever a decision is made against the latest value: taking a lock, electing a leader, enforcing a unique username, selling the last unit of stock. The price is coordination on every operation — a round trip to a leader or a majority — and during a partition the minority side has to refuse. That refusal is the C in [[CAP]].',
      },
      {
        kind: 'figure',
        caption: 'Not linearizable: Bob reads after Alice has finished, and sees an older value, because his replica is behind.',
        figure: {
          kind: 'sequence',
          actors: ['Alice', 'Replica 1', 'Replica 2', 'Bob'],
          steps: [
            { from: 0, to: 1, label: 'read score' },
            { from: 1, to: 0, label: 'final: 2–1', dashed: true, tone: 'mastered' },
            { from: 0, to: 3, label: '"it is over!"', dashed: true },
            { from: 3, to: 2, label: 'read score' },
            { from: 2, to: 3, label: 'still playing: 1–1', dashed: true, tone: 'alert' },
          ],
          note: 'Each replica is fine on its own. The violation is that a later read returned an earlier state.',
        },
      },
      { kind: 'heading', text: 'Sequential and causal' },
      {
        kind: 'prose',
        text: '**Sequential consistency** drops the real-time requirement. Everyone sees operations in the same order, and each client\'s own operations stay in the order it issued them, but that order may lag reality. ZooKeeper reads behave like this: a follower may serve you a slightly old state, but never states out of order. Call `sync` first when you need the latest.',
      },
      {
        kind: 'prose',
        text: '**Causal consistency** goes one rung lower: only operations that are causally related must appear in order. If I post a question and you reply, nobody may see your reply without my question. Two unrelated posts may show up in different orders for different readers. It is the strongest model a system can offer while both sides of a partition keep taking writes, which is why it is worth knowing by name.',
      },
      { kind: 'heading', text: 'Session guarantees: the bugs users actually see' },
      {
        kind: 'prose',
        text: 'Most user-visible consistency bugs are not about global order. They are about **one user watching their own session go backwards**. Two cheap guarantees fix most of them, and you can usually offer them without making the whole system strong.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Read-your-writes',
          points: [
            'After you write, your own reads see the write',
            'Breaks when: you save your profile, the next read hits a lagging replica, and the edit seems lost',
            'Fix: read your own data from the leader for a short window after writing, or carry the write\'s version and wait for a replica that has it',
          ],
        },
        right: {
          title: 'Monotonic reads',
          points: [
            'You never see older data after newer',
            'Breaks when: a refresh lands on a different replica, and a comment disappears, then comes back',
            'Fix: pin each user to one replica by hashing their id, or carry the last version they saw',
          ],
        },
        verdict: 'Both are per-session, so they cost far less than linearizability. Offer them on every user-facing path: most users never notice eventual consistency until it goes backwards for them.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'MongoDB\'s causally consistent sessions',
        text: 'Since version 3.6, MongoDB can give a session read-your-writes and monotonic reads from secondaries. Every reply carries a cluster time; the driver sends it with the next request, and a secondary waits until it has caught up to that time before answering. With majority read and write concerns you get the session guarantees without routing every read to the primary.',
      },
      { kind: 'heading', text: 'Quorums: R + W > N' },
      {
        kind: 'prose',
        text: 'Leaderless stores in the style of Amazon\'s Dynamo paper — Cassandra, Riak, ScyllaDB — copy each key to **N** replicas. A write waits for **W** acknowledgements; a read asks **R** replicas and keeps the newest value. If R + W > N, every read set overlaps every write set in at least one replica, so a read finds the latest acknowledged write.',
      },
      {
        kind: 'figure',
        caption: 'A quorum read overlaps the quorum write in at least one replica.',
        figure: {
          kind: 'grid',
          cols: 3,
          cells: [
            { label: 'A · written', tone: 'line' },
            { label: 'B · written', tone: 'line' },
            { label: 'C · old value', tone: 'neutral' },
            { label: 'A · not asked', tone: 'neutral' },
            { label: 'B · read: new', tone: 'mastered' },
            { label: 'C · read: old', tone: 'streak' },
          ],
          legend: [
            { tone: 'line', label: 'acknowledged the write (W = 2)' },
            { tone: 'mastered', label: 'read, up to date' },
            { tone: 'streak', label: 'read, stale' },
          ],
          note: 'N = 3, W = 2, R = 2. Top row is the write, bottom row the read. Any two of three overlap, so B guarantees the read sees the write.',
        },
      },
      {
        kind: 'table',
        head: ['N = 3', 'Gives you', 'Costs you'],
        rows: [
          ['W = 3, R = 1', 'Fast reads', 'One node down blocks every write'],
          ['W = 2, R = 2', 'Overlap, and survives one node down', 'Each operation waits for the second-fastest of three replicas'],
          ['W = 1, R = 1', 'Lowest latency, always available', 'No overlap: a read can miss a recent write'],
        ],
      },
      {
        kind: 'prose',
        text: 'Quorums are necessary, not sufficient. Three things still break the promise, and naming them is the senior signal:',
      },
      {
        kind: 'list',
        items: [
          '**Sloppy quorums.** When a key\'s home replicas are unreachable, some Dynamo-style stores accept the write on other nodes and hand it back later. Available, but the overlap is gone until the handoff.',
          '**Concurrent writes.** Two writes to one key, neither aware of the other: the store keeps one, usually by timestamp, and the other vanishes. Station 4 shows why that is worse than it sounds.',
          '**Reads racing a write.** A write that has reached one replica of three can be seen by one reader and missed by the next. Unless a read repairs stale replicas before returning, a quorum read is not linearizable.',
        ],
      },
      { kind: 'heading', text: 'Which products give you what' },
      {
        kind: 'table',
        head: ['Product', 'Default', 'What else you can ask for'],
        rows: [
          ['etcd', 'Linearizable reads and writes', 'Serializable reads: faster, possibly stale'],
          ['ZooKeeper', 'Linearizable writes; reads in order but possibly stale', '`sync` before a read to catch up'],
          ['Spanner', 'External consistency — strict serializability', 'Stale reads at a chosen timestamp, cheaper'],
          ['DynamoDB', 'Eventually consistent reads', 'Strongly consistent reads, at twice the read cost'],
          ['Cassandra', 'Tunable per query; drivers default to one replica', '`QUORUM` on reads and writes for R + W > N'],
          ['Azure Cosmos DB', 'Session', 'Strong, bounded staleness, consistent prefix, or eventual'],
          ['MongoDB', 'Reads from the primary', 'Causally consistent sessions; a `linearizable` read concern'],
          ['Amazon [[S3]]', 'Strong read-after-write, since December 2020', 'Nothing to choose — it was eventual before'],
          ['Postgres async replica', 'Eventual, with no read-your-writes', 'Read from the primary, or replicate synchronously'],
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'I\'ll take the weakest model each path tolerates. The username check and the stock decrement need linearizable; the profile page needs read-your-writes so people see their own edits; the feed is fine eventual.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Saying "strongly consistent" without saying of what. Strong consistency on one key is not a serializable transaction across keys, and a quorum is not linearizability. Interviewers push exactly here: "your quorum read and a concurrent write — what can two readers see?"',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'A user updates their profile and the page still shows the old name. What is happening, and how do you fix it?',
            a: 'The read went to a replica that has not applied the write yet — a read-your-writes violation. The cheap fix is to route that user\'s reads to the leader for a short window after they write, or return the write\'s version and make the read wait for a replica at least that new. Making the whole store linearizable fixes it too, at far greater cost.',
          },
          {
            q: 'With N = 3, W = 2 and R = 2, is your system linearizable?',
            a: 'Not on its own. A read concurrent with a write can return the new value while a later read returns the old one, unless reads repair stale replicas before returning. Sloppy quorums and last-write-wins on concurrent writes break it further. Quorums give overlap; linearizability needs more.',
          },
          {
            q: 'Why not make everything linearizable and be done with it?',
            a: 'Then every operation needs coordination: latency includes a round trip to the leader or a majority, and in a partition the minority side refuses requests. Across regions that is tens to hundreds of milliseconds per write. Pay it on the paths that decide against the latest value, not on the feed.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-d-consistency-1',
        moduleId: 'd-consistency',
        stem: 'Alice sees a final score and tells Bob. Bob refreshes and sees the match still in progress. Which guarantee did the system violate?',
        options: [
          'Eventual consistency',
          'Linearizability',
          'Read-your-writes',
          'Monotonic reads',
        ],
        correct: 1,
        explain:
          'Bob\'s read began after Alice\'s finished and returned older data, which breaks the real-time order linearizability promises. Eventual consistency allows exactly this. Read-your-writes and monotonic reads are promises within one session, and these are two different users.',
      },
      {
        id: 'q-d-consistency-2',
        moduleId: 'd-consistency',
        stem: 'A key has N = 5 replicas. Which setting guarantees a read overlaps the latest acknowledged write?',
        options: [
          'W = 2, R = 2',
          'W = 3, R = 2',
          'W = 3, R = 3',
          'W = 1, R = 4',
        ],
        correct: 2,
        explain:
          'You need R + W > N, so at least 6. Only 3 + 3 qualifies. With 3 + 2 or 1 + 4, the read can land entirely on replicas that missed the write. As a bonus, W = 3, R = 3 still works with two of the five down.',
      },
      {
        id: 'q-d-consistency-3',
        moduleId: 'd-consistency',
        stem: 'Users see a new comment, refresh, and it disappears — then reappears on the next refresh. What is the cheapest fix?',
        options: [
          'Make every read linearizable',
          'Raise the replication factor so more replicas have the comment',
          'Switch the whole cluster to synchronous replication',
          'Pin each user\'s reads to one replica, so their view never moves backwards',
        ],
        correct: 3,
        explain:
          'That is a monotonic-reads violation: consecutive refreshes hit replicas with different lag. Sticky routing per user fixes it with no coordination at all. Linearizable reads and synchronous replication fix it too, at a price the comment thread does not need.',
      },
    ],
    cards: [
      {
        id: 'c-d-consistency-1',
        moduleId: 'd-consistency',
        front: 'Linearizable, in one sentence?',
        back: 'It behaves like one copy: once any reader sees a write, every later reader does. Needed for locks, leader election, uniqueness and the last unit of stock.',
        tag: 'Consistency',
      },
      {
        id: 'c-d-consistency-2',
        moduleId: 'd-consistency',
        front: 'What does R + W > N guarantee, and what does it not?',
        back: 'A read overlaps the latest acknowledged write. Sloppy quorums, concurrent writes and reads racing a write still stop it being linearizable.',
        tag: 'Quorums',
      },
      {
        id: 'c-d-consistency-3',
        moduleId: 'd-consistency',
        front: 'Which two session guarantees fix most user-visible staleness?',
        back: 'Read-your-writes (you see your own edits) and monotonic reads (you never go backwards). Both are cheap: leader reads after a write, or sticky replicas.',
        tag: 'Consistency',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'd-consensus',
    trackId: 'distributed',
    title: 'Consensus and leader election',
    station: 3,
    prereqs: ['d-consistency'],
    related: ['c-cap', 'a-contention'],
    minutes: 12,
    summary: 'How Raft gets a cluster to agree on one leader and one log, where etcd and ZooKeeper fit, and why a lock needs a fencing token.',
    objectives: [
      'Walk through Raft: terms, elections, log replication and majority commit',
      'Size a cluster from the number of failures it must survive',
      'Say where consensus belongs in a design, and where it does not',
      'Make a lock safe against a paused holder with a fencing token',
    ],
    keywords: ['Raft', 'Paxos', 'leader election', 'majority', 'etcd', 'ZooKeeper', 'distributed lock', 'fencing token', 'lease'],
    lesson: [
      {
        kind: 'prose',
        text: 'Station 1 ended on a rule: only a majority may act. **Consensus** is the machinery that enforces it. It gets a group of nodes to agree on a value — who the leader is, whether a transaction committed, what the next entry in a log is — such that **once decided, it never changes**, while nodes crash and messages go missing.',
      },
      {
        kind: 'figure',
        caption: 'A partition splits five nodes three and two. Only the side with a majority may elect a leader or commit.',
        figure: {
          kind: 'grid',
          cols: 5,
          cells: [
            { label: 'A', tone: 'mastered' },
            { label: 'B', tone: 'mastered' },
            { label: 'C', tone: 'mastered' },
            { label: 'D', tone: 'alert' },
            { label: 'E', tone: 'alert' },
          ],
          legend: [
            { tone: 'mastered', label: 'majority side: elects, commits' },
            { tone: 'alert', label: 'minority side: refuses writes' },
          ],
          note: 'Any two majorities of one cluster share at least one node, and each node votes once per term, so two leaders can never win the same term.',
        },
      },
      {
        kind: 'prose',
        text: 'In an interview you rarely build it; you **use** it, through etcd or ZooKeeper, for the few decisions that must have exactly one answer. What gets probed is whether you know what it guarantees, what it costs, and why a lock taken from it is still not safe on its own.',
      },
      { kind: 'heading', text: 'What needs exactly one answer' },
      {
        kind: 'list',
        items: [
          '**Leader election** — one primary per shard, or you get split brain.',
          '**Locks and leases** — one worker owns a job, a partition, tonight\'s billing run.',
          '**Membership and configuration** — every node agrees which nodes are in the cluster and which shard lives where.',
          '**Atomic commit** — every participant agrees a transaction committed, or none does. Station 5.',
        ],
      },
      {
        kind: 'prose',
        text: 'All four reduce to one problem: agree on a value despite failures, with no single node whose death stops the system. A linearizable store, from station 2, is exactly what consensus builds.',
      },
      { kind: 'heading', text: 'Raft: terms and elections' },
      {
        kind: 'prose',
        text: 'Raft, published by Diego Ongaro and John Ousterhout in 2014, was designed to be understandable, and it is what etcd, Consul, CockroachDB and Kafka\'s KRaft mode run. Every node is a **follower**, a **candidate** or the **leader**. Time is divided into numbered **terms**, and each term has at most one leader.',
      },
      {
        kind: 'list',
        ordered: true,
        items: [
          'Followers expect regular heartbeats from the leader. If none arrives within a randomised election timeout — 150–300 ms in the paper — a follower becomes a candidate.',
          'The candidate increments the term, votes for itself, and asks every other node for a vote.',
          'Each node grants one vote per term, and only to a candidate whose log is at least as up to date as its own.',
          'A candidate with votes from a majority becomes leader and starts heartbeating. Any node that sees a higher term than its own steps down to follower.',
        ],
      },
      {
        kind: 'figure',
        caption: 'A Raft election: one candidate, one vote per node per term, leadership on a majority.',
        figure: {
          kind: 'sequence',
          actors: ['Node A', 'Node B', 'Node C'],
          steps: [
            { from: 0, to: 0, label: 'no heartbeat: term 5, votes for itself', tone: 'streak' },
            { from: 0, to: 1, label: 'RequestVote, term 5' },
            { from: 0, to: 2, label: 'RequestVote, term 5' },
            { from: 1, to: 0, label: 'vote granted', dashed: true },
            { from: 0, to: 0, label: '2 of 3 votes: leader for term 5', tone: 'mastered' },
            { from: 2, to: 0, label: 'vote granted (late, not needed)', dashed: true },
            { from: 0, to: 1, label: 'heartbeat, term 5' },
            { from: 0, to: 2, label: 'heartbeat, term 5' },
          ],
          note: 'The randomised timeout is what stops every follower standing at once and splitting the vote forever.',
        },
      },
      {
        kind: 'prose',
        text: 'Two details carry the safety. The **term number** fences out stale leaders: a deposed leader that wakes up and sends a term-4 message is rejected by every node on term 5, and steps down. And the **up-to-date-log rule** means a node missing committed entries can never win a vote, so a new leader always holds everything that was committed.',
      },
      { kind: 'heading', text: 'Log replication and majority commit' },
      {
        kind: 'prose',
        text: 'Every write goes to the leader, which appends it to its log and sends it to the followers. Once a **majority** have it on disk, the entry is **committed**: the leader applies it, answers the client, and tells the followers in its next message. A slow or dead minority blocks nothing.',
      },
      {
        kind: 'figure',
        caption: 'Raft log replication: an entry commits once a majority hold it, not once all do.',
        figure: {
          kind: 'sequence',
          actors: ['Client', 'Leader', 'Follower B', 'Follower C'],
          steps: [
            { from: 0, to: 1, label: 'set x = 5' },
            { from: 1, to: 1, label: 'append at index 8, term 5' },
            { from: 1, to: 2, label: 'AppendEntries 8' },
            { from: 1, to: 3, label: 'AppendEntries 8' },
            { from: 2, to: 1, label: 'on disk', dashed: true },
            { from: 1, to: 1, label: '2 of 3 hold it: committed', tone: 'mastered' },
            { from: 1, to: 0, label: 'ok', dashed: true, tone: 'mastered' },
            { from: 3, to: 3, label: 'slow disk: catches up later', tone: 'streak' },
          ],
          note: 'The leader counts itself. In a cluster of three, one follower\'s acknowledgement makes the majority.',
        },
      },
      {
        kind: 'table',
        head: ['Cluster size', 'Majority', 'Failures it survives'],
        rows: [
          ['1', '1', '0'],
          ['3', '2', '1'],
          ['4', '3', '1'],
          ['5', '3', '2'],
          ['7', '4', '3'],
        ],
      },
      {
        kind: 'prose',
        text: 'Even sizes buy nothing: four nodes survive one failure, like three, and need one more acknowledgement per write. Run **three** for most clusters and **five** when you must survive a failure during maintenance. Beyond that, every write waits on more disks and more round trips, which is why consensus groups stay small and systems shard into many of them.',
      },
      { kind: 'heading', text: 'Paxos, in one paragraph' },
      {
        kind: 'prose',
        text: 'Leslie Lamport\'s Paxos came first, and Google\'s Chubby lock service and Spanner are built on it. A proposer picks a ballot number and asks acceptors to **promise** to ignore lower ballots; with a majority of promises it asks them to **accept** a value, adopting the one from the highest ballot any of them has already accepted. A value accepted by a majority is chosen. Basic Paxos agrees on one value; real systems run **Multi-Paxos**, which keeps a stable leader to skip the first phase — and at that point it looks a great deal like Raft. Say "Raft or Multi-Paxos" in an interview and move on; nobody wants the proof.',
      },
      { kind: 'heading', text: 'etcd and ZooKeeper in practice' },
      {
        kind: 'prose',
        text: 'You get consensus as a service. **etcd** is Kubernetes\' default store; a cluster\'s entire state lives in it. **ZooKeeper** coordinated Kafka, HBase and Hadoop for a decade. Both offer the same primitives: a small linearizable key-value store, **leases** or ephemeral nodes that vanish when their owner stops heartbeating, and **watches** that notify you when a key changes. Leader election is a few lines on top: everyone tries to create the same key under a lease, and whoever succeeds leads.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Kafka removed ZooKeeper',
        text: 'Kafka used ZooKeeper for controller election and cluster metadata until KRaft replaced it with a Raft quorum inside Kafka itself; Kafka 4.0, released in 2025, dropped ZooKeeper entirely. The motive was scale. A newly elected controller had to load all metadata from ZooKeeper, which took longer the more partitions a cluster had. In KRaft the metadata is a replicated log that standby controllers already hold.',
      },
      {
        kind: 'prose',
        text: 'Keep it off the data path. etcd\'s default storage quota is 2 [[GB]], and every write is a majority round trip plus a disk sync. It holds the **metadata** of a system — who leads which shard, which config is live — not the data. Your orders table does not go in etcd.',
      },
      { kind: 'heading', text: 'Leases and fencing tokens' },
      {
        kind: 'prose',
        text: 'A distributed lock is really a **lease**: you hold it until it expires unless you renew it, so a crashed holder cannot block everyone forever. The trap is the holder that has not crashed but **paused** — a long garbage-collection pause, a virtual machine being migrated, a process swapped out. Its lease expires, another client takes the lock, and the first one wakes up still believing it holds it.',
      },
      {
        kind: 'figure',
        caption: 'A fencing token: storage remembers the highest token it has seen and rejects anything older.',
        figure: {
          kind: 'sequence',
          actors: ['Client 1', 'Lock service', 'Client 2', 'Storage'],
          steps: [
            { from: 0, to: 1, label: 'acquire' },
            { from: 1, to: 0, label: 'lease, token 33', dashed: true },
            { from: 0, to: 0, label: 'paused for 40 s', tone: 'streak' },
            { from: 1, to: 1, label: 'lease 33 expires' },
            { from: 2, to: 1, label: 'acquire' },
            { from: 1, to: 2, label: 'lease, token 34', dashed: true },
            { from: 2, to: 3, label: 'write with token 34', tone: 'mastered' },
            { from: 0, to: 3, label: 'write with token 33', tone: 'alert' },
            { from: 3, to: 0, label: 'rejected: 33 < 34', dashed: true, tone: 'alert' },
          ],
          note: 'Without the check at the storage, both writes land and the paused client silently overwrites the new holder\'s work.',
        },
      },
      {
        kind: 'prose',
        text: 'The fix is a **fencing token**: a number that rises every time the lock is granted, sent with every write, and checked by the storage, which rejects any token lower than one it has already accepted. ZooKeeper gives you one in the transaction id or version of the lock node; etcd in the key\'s revision. The point is that the **resource** does the check. Anything the client checks can go stale the instant after it checks. This is the heart of Martin Kleppmann\'s critique of Redis\'s Redlock: it hands out no token, so a paused client can still corrupt data.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Leader election and locks go through etcd or ZooKeeper, not something I build. Every lock carries a fencing token that the storage checks, because a lease alone cannot stop a paused holder from writing after it expired.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Using `SET key value NX EX 30` on a single Redis as "the distributed lock" for something that matters. One Redis is a single point of failure, a failover to a replica can lose the lock, and there is no fencing token. Fine for avoiding duplicate work; not fine where two holders would corrupt data.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'What happens if the Raft leader is partitioned away from the other two nodes?',
            a: 'It can no longer reach a majority, so nothing it accepts commits and its clients time out. The other two elect a new leader in a higher term within an election timeout. When the partition heals, the old leader sees the higher term, steps down, and its uncommitted entries are overwritten by the new leader\'s log.',
          },
          {
            q: 'Why five nodes rather than three?',
            a: 'Five survive two failures, so you can take one node down for maintenance and still survive an unplanned failure. The cost is three acknowledgements per write instead of two. Seven is rarely worth it: writes slow down and the extra safety is small.',
          },
          {
            q: 'Could you use your database for leader election instead of etcd?',
            a: 'Yes, if it is strongly consistent: a row holding the leader and an expiry, taken with a conditional update, with a version column as the fencing token. That is often simpler than running etcd. An eventually consistent store does not work, because two candidates can both read themselves as the winner.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-d-consensus-1',
        moduleId: 'd-consensus',
        stem: 'A five-node Raft cluster loses two nodes. What happens to writes?',
        options: [
          'They continue: three of five is still a majority',
          'They stop: Raft needs every node to acknowledge a write',
          'They continue, but are no longer linearizable',
          'They stop until an operator picks a new leader by hand',
        ],
        correct: 0,
        explain:
          'Commit needs a majority, not unanimity, so three of five can still elect a leader and commit. A third failure would stop writes. That is the point of sizing a cluster at 2f + 1, and no consistency is given up while a majority remains.',
      },
      {
        id: 'q-d-consensus-2',
        moduleId: 'd-consensus',
        stem: 'Why does Raft randomise each follower\'s election timeout?',
        options: [
          'To spread heartbeat traffic evenly across the network',
          'So followers rarely become candidates at the same moment and split the vote',
          'To make the next leader hard for an attacker to predict',
          'To compensate for clock skew between the nodes',
        ],
        correct: 1,
        explain:
          'If every follower timed out together, each would vote for itself and nobody would reach a majority, term after term. Randomising lets one node usually stand first and win. Skew is not the issue: each node measures its timeout locally, with a monotonic clock.',
      },
      {
        id: 'q-d-consensus-3',
        moduleId: 'd-consensus',
        stem: 'A worker holds a 30-second lease, pauses for 40 seconds, then wakes and writes. What stops it corrupting data?',
        options: [
          'A longer lease, so pauses fit inside it',
          'Checking the lock is still held just before writing',
          'Storage that rejects writes carrying a fencing token older than one it has seen',
          'Running the lock service on five nodes instead of three',
        ],
        correct: 2,
        explain:
          'Any check the client makes can go stale immediately — it could pause again between the check and the write. Only the resource can enforce order, by rejecting old tokens. A longer lease just moves the threshold, and more lock nodes do not help a paused client.',
      },
    ],
    cards: [
      {
        id: 'c-d-consensus-1',
        moduleId: 'd-consensus',
        front: 'When does a Raft log entry commit?',
        back: 'When a majority of nodes, leader included, have it on disk. The leader then applies it and replies; slow followers catch up later.',
        tag: 'Consensus',
      },
      {
        id: 'c-d-consensus-2',
        moduleId: 'd-consensus',
        front: 'How many failures does a cluster of N nodes survive?',
        back: 'Fewer than half: (N − 1) / 2, rounded down. Three survive one, five survive two. Even sizes add cost, not tolerance.',
        tag: 'Consensus',
      },
      {
        id: 'c-d-consensus-3',
        moduleId: 'd-consensus',
        front: 'What is a fencing token?',
        back: 'A number that rises with every lock grant and is sent with each write. Storage rejects tokens older than the newest it has seen.',
        tag: 'Locks',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'd-time',
    trackId: 'distributed',
    title: 'Time, clocks and ordering',
    station: 4,
    prereqs: ['d-consensus'],
    related: ['c-cap'],
    minutes: 12,
    summary: 'Why wall clocks cannot order events across machines, what Lamport, vector and hybrid clocks do instead, and how Spanner waits out the uncertainty.',
    objectives: [
      'Explain skew and drift, and why wall-clock timestamps cannot order events across machines',
      'Use a monotonic clock for durations and a logical clock for ordering',
      'Say what Lamport, vector and hybrid logical clocks each capture',
      'Explain how last write wins loses data, and what to use instead',
    ],
    keywords: ['clock skew', 'clock drift', 'NTP', 'monotonic clock', 'Lamport clock', 'vector clock', 'hybrid logical clock', 'TrueTime', 'last write wins', 'happened-before'],
    lesson: [
      {
        kind: 'prose',
        text: 'Every design that says "compare the timestamps" to decide which write is newer has a bug in it. Clocks on different machines disagree — by fractions of a millisecond on a good day, by seconds on a bad one — and nothing in the system can tell you by how much.',
      },
      {
        kind: 'prose',
        text: 'Time comes up in three places: conflict resolution ("two users edit the same record"), ordering events across services, and anything with an expiry. The senior answer separates two questions people run together — **how long did this take?** and **which happened first?** — and uses a different tool for each.',
      },
      { kind: 'heading', text: 'Skew, drift and [[NTP]]' },
      {
        kind: 'prose',
        text: 'A server\'s clock is a quartz crystal, and quartz runs fast or slow with temperature. Google\'s Spanner paper budgets for 200 microseconds of drift per second: left alone for a day, a clock at that rate is 17 seconds out. **Drift** is the rate of error; **skew** is the gap between two clocks at one moment.',
      },
      {
        kind: 'prose',
        text: 'NTP corrects drift by asking time servers and adjusting, but it is only as accurate as the network round trip allows. Inside a datacentre that is well under a millisecond; over the public internet, tens of milliseconds, and worse on congested or asymmetric routes. When the correction is large, NTP can **step** the clock — jump it, backwards included.',
      },
      {
        kind: 'figure',
        caption: 'How far apart clocks can be, on a log scale. None of these is small enough to order writes by.',
        figure: {
          kind: 'scale',
          items: [
            { label: 'NTP inside a datacentre', display: '< 1 ms', value: 0.5 },
            { label: 'Spanner TrueTime bound', display: '1–7 ms', value: 4, tone: 'line' },
            { label: 'NTP over the public internet', display: 'tens of ms', value: 30, tone: 'streak' },
            { label: 'Worst-case quartz, a day unsynced', display: '~17 s', value: 17000, tone: 'alert' },
          ],
          note: 'Even the best case is long enough for two writes on different machines to be stamped in the wrong order.',
        },
      },
      { kind: 'heading', text: 'Wall clocks and monotonic clocks' },
      {
        kind: 'compare',
        left: {
          title: 'Wall clock',
          points: [
            'Time of day: `Date.now()`, `System.currentTimeMillis()`',
            'Jumps forwards or backwards when NTP steps it, or at a leap second',
            'Roughly comparable across machines — to within the skew',
          ],
        },
        right: {
          title: 'Monotonic clock',
          points: [
            'Counts from an arbitrary start: `performance.now()`, `System.nanoTime()`',
            'Never goes backwards',
            'Meaningless on another machine, or after a reboot',
          ],
        },
        verdict: 'Durations, timeouts, leases and rate limits use the monotonic clock. Wall time is for showing a human, and for nothing that has to be correct.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Cloudflare\'s leap second',
        text: 'At midnight on 1 January 2017 a leap second was inserted. Cloudflare\'s [[DNS]] software measured a duration by subtracting two wall-clock readings, got a negative number, and passed it to a random-number function that panics on negative input. Some lookups failed until a fix was deployed. Go added monotonic readings to `time.Now()` later that year, and this incident is part of why.',
      },
      { kind: 'heading', text: 'Why last write wins loses data' },
      {
        kind: 'prose',
        text: 'Last write wins settles a conflict by keeping the value with the highest timestamp and discarding the rest. Cassandra does it per column; DynamoDB global tables do it across regions by default. It always converges — and it silently throws writes away.',
      },
      {
        kind: 'figure',
        caption: 'Last write wins under skew: the later write loses, and nobody is told.',
        figure: {
          kind: 'timeline',
          ticks: ['0 ms', '5 ms', '10 ms (real time)'],
          lanes: [
            {
              label: 'Node A — clock 8 ms fast',
              bars: [{ from: 0, to: 0.35, label: 'x = 1, stamped .008', tone: 'streak' }],
              outcome: { label: 'kept', tone: 'streak' },
            },
            {
              label: 'Node B — clock correct',
              bars: [{ from: 0.5, to: 0.85, label: 'x = 2, stamped .005', tone: 'line' }],
              outcome: { label: 'discarded', tone: 'alert' },
            },
          ],
          note: 'B wrote 5 ms later in real time, but A\'s clock is ahead, so A\'s older write carries the bigger timestamp.',
        },
      },
      {
        kind: 'prose',
        text: 'Two failures hide in that picture. Under skew, last write wins keeps the **wrong** write. And even with perfect clocks, two **concurrent** writes — neither saw the other — are both legitimate, and the policy deletes one of them. The second is the deeper problem: it is not a clock bug, it is the policy working as designed.',
      },
      {
        kind: 'ladder',
        rungs: [
          {
            grade: 'bad',
            title: 'Last write wins on wall clocks',
            text: 'Converges, and loses skewed and concurrent writes without a trace. Acceptable only where losing an edit is genuinely fine — a profile photo, a "last seen" time.',
          },
          {
            grade: 'good',
            title: 'One leader per key',
            text: 'All writes for a key go through one node, whose log gives them a real order. Costs a hop to the leader and a failover story, which station 3 already gave you.',
          },
          {
            grade: 'great',
            title: 'Detect concurrency, keep both',
            text: 'Version vectors spot writes that did not see each other, and the store keeps both as siblings for the application to merge. Correct, but every reader has to handle conflicts.',
          },
          {
            grade: 'best',
            title: 'Data that cannot conflict',
            text: 'Append-only events, increments, set unions — a [[CRDT]] — merge to the same result in any order. Pick this wherever the domain allows it.',
          },
        ],
      },
      { kind: 'heading', text: 'Logical clocks: Lamport and vector' },
      {
        kind: 'prose',
        text: 'If you cannot trust time, track **causality** instead. Event a **happened before** b if they are on one node in that order, or a sent a message that b received, or a chain of those links them. Any two events with no such chain are **concurrent**.',
      },
      {
        kind: 'prose',
        text: 'A **Lamport clock** is one counter per node. Increment it on every event, attach it to every message, and on receiving one set the counter to max(local, received) + 1. If a happened before b, then L(a) < L(b). Break ties by node id and every node agrees on one total order consistent with causality, though only after the fact: a smaller timestamp may still be in flight. What it cannot tell you is the converse: L(a) < L(b) does not mean a caused b.',
      },
      {
        kind: 'figure',
        caption: 'Lamport timestamps travel with messages, so a cause always carries a smaller number than its effect.',
        figure: {
          kind: 'sequence',
          actors: ['Node A', 'Node B', 'Node C'],
          steps: [
            { from: 0, to: 0, label: 'write x: L = 1' },
            { from: 0, to: 1, label: 'replicate x, L = 1' },
            { from: 1, to: 1, label: 'receive: max(0, 1) + 1 = 2' },
            { from: 2, to: 2, label: 'write y: L = 1', tone: 'streak' },
            { from: 1, to: 2, label: 'replicate x, L = 2' },
            { from: 2, to: 2, label: 'receive: max(1, 2) + 1 = 3' },
          ],
          note: 'C\'s write of y and A\'s write of x both have L = 1 and are concurrent. A Lamport clock orders them by node id anyway; only a vector clock would say neither came first.',
        },
      },
      {
        kind: 'prose',
        text: 'A **vector clock** keeps one counter **per node** and sends the whole vector. Compare two vectors entry by entry: if every entry of one is less than or equal to the other\'s, it happened before; if each is ahead somewhere, they are **concurrent** — exactly the information last write wins throws away. The cost is size, one entry per writer, which is why stores keep a version vector per replica rather than per client.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Amazon\'s shopping cart',
        text: 'The 2007 Dynamo paper used vector clocks to detect concurrent updates to a cart and handed every conflicting version back to the application, which merged them by union. An item a customer added was never lost. The known cost: an item they deleted could reappear, because a union cannot tell a deletion from an add the other version had not seen.',
      },
      { kind: 'heading', text: 'Hybrid logical clocks and TrueTime' },
      {
        kind: 'prose',
        text: 'Logical clocks order events but drift away from real time, so you cannot ask one for "the state as of 10:00". A **hybrid logical clock** ([[HLC]]) fixes that. Each timestamp is a physical time plus a small counter: take the maximum of the local wall clock and any timestamp received, and bump the counter when physical time has not moved past it. It preserves happened-before like a Lamport clock, stays within the clock skew of real time, and can be packed into 64 bits. CockroachDB, YugabyteDB and MongoDB\'s cluster time all use one.',
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'An HLC still leans on bounded skew for some guarantees. CockroachDB assumes clocks within 500 ms of each other by default, and a node that finds itself more than 80% of that away from at least half its peers shuts itself down rather than risk serving a stale read.',
      },
      {
        kind: 'prose',
        text: '**Spanner** takes the opposite route: make the uncertainty small and known. TrueTime, fed by satellite receivers and atomic clocks in every datacentre, returns an interval — `TT.now()` gives an earliest and a latest — guaranteed to contain the true time. The 2012 paper reports its width, ε, saw-toothing between about 1 and 7 ms.',
      },
      {
        kind: 'prose',
        text: 'To commit, Spanner takes a timestamp at the top of the interval and then **waits out the uncertainty** — commit wait — before making the write visible. Any transaction that starts afterwards is guaranteed a larger timestamp. That buys external consistency, the top of station 2\'s ladder, across continents, for a few milliseconds per write.',
      },
      {
        kind: 'figure',
        caption: 'Commit wait: Spanner holds a write back until its timestamp is certainly in the past on every clock.',
        figure: {
          kind: 'timeline',
          ticks: ['commit, s = latest', '+ ε', '+ 2ε: visible'],
          lanes: [
            {
              label: 'TrueTime interval at commit',
              bars: [{ from: 0, to: 0.5, label: 'earliest … latest = s', tone: 'line' }],
            },
            {
              label: 'Commit wait',
              bars: [{ from: 0, to: 1, label: 'wait until even the earliest bound is past s', tone: 'streak' }],
              outcome: { label: 'visible', tone: 'mastered' },
            },
            {
              label: 'Any later transaction',
              bars: [{ from: 0.85, to: 1, label: '> s', tone: 'mastered' }],
              outcome: { label: 'ordered after', tone: 'mastered' },
            },
          ],
          note: 'The wait is about two ε, a few milliseconds, and it is what lets plain timestamps order transactions worldwide.',
        },
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'I would not order writes by wall-clock timestamps from different machines. Durations use a monotonic clock; ordering comes from one leader per key or a hybrid logical clock; and where two writes are genuinely concurrent, I keep both or use a data type that merges.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Answering "two users edit at once" with "keep the one with the later timestamp". The interviewer will ask whose clock, and then what happened to the other user\'s edit. Last write wins is a decision to lose data — sometimes acceptable, but say it as a decision.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Two replicas accepted conflicting writes during a partition. How do you resolve them?',
            a: 'First detect it: version vectors show the writes were concurrent rather than one superseding the other. Then merge by meaning — a union for a cart, a sum for counters, a [[CRDT]] for shared text — or show both to the user. Last write wins only where losing one is acceptable, and I would say so.',
          },
          {
            q: 'Why not just run better clock synchronisation?',
            a: 'Better sync shrinks skew but never makes it zero or known, and one bad step or leap second breaks the assumption. Spanner gets away with timestamps because TrueTime bounds the error and the database waits it out. Without a bound, a timestamp is a hint, not an order.',
          },
          {
            q: 'What is a hybrid logical clock actually for?',
            a: 'Ordering events consistently with causality while staying close to real time. That gives a database snapshot reads "as of" a time and a cross-node order without special hardware. It still assumes bounded skew for some guarantees, which is why CockroachDB takes a node out when its clock drifts too far.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-d-time-1',
        moduleId: 'd-time',
        stem: 'A rate limiter measures the gap between requests with `Date.now()`. What can go wrong?',
        options: [
          'Nothing, as long as NTP is running on the host',
          'The gap can come out negative or huge when the wall clock is stepped, so use a monotonic clock',
          'It is too slow to call on every request',
          'It loses precision for gaps shorter than a second',
        ],
        correct: 1,
        explain:
          '[[NTP]] running is exactly what steps the wall clock. Durations need a clock that only moves forward — `performance.now()`, `System.nanoTime()` — which is meaningless across machines but correct on one.',
      },
      {
        id: 'q-d-time-2',
        moduleId: 'd-time',
        stem: 'Two versions of a key carry vector clocks [A:2, B:1] and [A:1, B:2]. How are they related?',
        options: [
          'The first happened before the second',
          'The second happened before the first',
          'They are concurrent — neither writer had seen the other',
          'They are two copies of the same write',
        ],
        correct: 2,
        explain:
          'Each is ahead in one entry, so neither dominates: that is concurrency. It is exactly the case last write wins would hide by keeping one and dropping the other.',
      },
      {
        id: 'q-d-time-3',
        moduleId: 'd-time',
        stem: 'What does Spanner\'s commit wait buy?',
        options: [
          'Commits that are faster than a consensus round',
          'Protection against losing a disk mid-commit',
          'Availability on both sides of a network partition',
          'Any transaction that starts later gets a larger timestamp, so timestamps order transactions globally',
        ],
        correct: 3,
        explain:
          'TrueTime bounds the clock uncertainty, and waiting it out puts the commit timestamp in the past on every clock before anyone can see the write. It costs latency, and it does nothing for partitions: Spanner is still a [[CP]] system.',
      },
    ],
    cards: [
      {
        id: 'c-d-time-1',
        moduleId: 'd-time',
        front: 'Which clock do you use for a timeout or a lease?',
        back: 'The monotonic clock. A wall clock can jump backwards when [[NTP]] steps it or a leap second lands.',
        tag: 'Time',
      },
      {
        id: 'c-d-time-2',
        moduleId: 'd-time',
        front: 'Why does last write wins lose data?',
        back: 'Under skew the later write can carry the smaller timestamp. And concurrent writes are both valid, yet one is silently dropped.',
        tag: 'Time',
      },
      {
        id: 'c-d-time-3',
        moduleId: 'd-time',
        front: 'Lamport clock or vector clock?',
        back: 'Lamport: one counter, a total order consistent with causality. Vector: a counter per node, and it can tell you two writes were concurrent.',
        tag: 'Ordering',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'd-transactions',
    trackId: 'distributed',
    title: 'Distributed transactions: 2PC, sagas and the outbox',
    station: 5,
    prereqs: ['d-time'],
    related: ['a-multistep', 'c-queues'],
    minutes: 12,
    summary: 'Why two-phase commit blocks, what a saga gives up for availability, and how the outbox stops a database and a broker disagreeing.',
    objectives: [
      'Walk through [[2PC]] and say exactly where it blocks',
      'Design a saga with compensations, and say what it gives up',
      'Spot the dual-write problem, and fix it with a transactional outbox or [[CDC]]',
    ],
    keywords: ['two-phase commit', '2PC', 'XA', 'saga', 'compensating transaction', 'orchestration', 'choreography', 'transactional outbox', 'dual write', 'change data capture'],
    lesson: [
      {
        kind: 'prose',
        text: 'Once data lives in two services, "do both or neither" stops being a keyword. An order and a payment in different databases cannot share one `BEGIN … COMMIT`. You have three tools, and the interview is about choosing: an atomic protocol that can block, a sequence of local transactions that can be undone, or a way to make one local transaction drive everything else.',
      },
      {
        kind: 'prose',
        text: 'The applied track introduced sagas as a pattern. This station is the mechanism: why [[2PC]] is avoided between services, what a saga really gives up, and the outbox — the piece most candidates miss.',
      },
      { kind: 'heading', text: 'Two-phase commit' },
      {
        kind: 'prose',
        text: 'A **coordinator** asks every participant to **prepare**: do the work, write it durably, hold the locks, and promise it can commit. Each votes yes or no. If all vote yes, the coordinator logs the decision and tells everyone to **commit**; if any votes no, everyone aborts. The yes vote is a promise: from then on, the participant may not abort on its own.',
      },
      {
        kind: 'figure',
        caption: 'Two-phase commit: nobody commits until everyone has voted yes.',
        figure: {
          kind: 'sequence',
          actors: ['Coordinator', 'Orders DB', 'Payments DB'],
          steps: [
            { from: 0, to: 1, label: 'prepare' },
            { from: 0, to: 2, label: 'prepare' },
            { from: 1, to: 0, label: 'yes', dashed: true },
            { from: 2, to: 0, label: 'yes', dashed: true },
            { from: 0, to: 0, label: 'decision logged' },
            { from: 0, to: 1, label: 'commit', tone: 'mastered' },
            { from: 0, to: 2, label: 'commit', tone: 'mastered' },
          ],
        },
      },
      { kind: 'heading', text: 'Where it blocks' },
      {
        kind: 'prose',
        text: 'The weakness is the gap between the vote and the decision. A participant that has voted yes is **in doubt**: it cannot commit, because another may have voted no, and it cannot abort, because the coordinator may have decided commit. If the coordinator crashes in that gap, every participant holds its locks until the coordinator comes back. The rows stay locked and queries pile up behind them.',
      },
      {
        kind: 'figure',
        caption: 'The blocking window: after voting yes, a participant can neither commit nor abort without the coordinator.',
        figure: {
          kind: 'sequence',
          actors: ['Coordinator', 'Orders DB', 'Payments DB'],
          steps: [
            { from: 0, to: 1, label: 'prepare' },
            { from: 0, to: 2, label: 'prepare' },
            { from: 1, to: 0, label: 'yes', dashed: true },
            { from: 2, to: 0, label: 'yes', dashed: true },
            { from: 0, to: 0, label: 'crashes before sending the decision', tone: 'alert' },
            { from: 1, to: 1, label: 'in doubt: rows stay locked', tone: 'streak' },
            { from: 2, to: 2, label: 'in doubt: rows stay locked', tone: 'streak' },
          ],
          note: 'Neither participant may decide alone. Both wait for the coordinator\'s log, however long its recovery takes.',
        },
      },
      {
        kind: 'prose',
        text: 'Between services that is a bad trade. Every participant\'s availability is tied to the coordinator\'s, locks are held across network round trips, and every participant must speak the protocol. [[XA]], the X/Open standard that lets one transaction span, say, a database and a message broker, is exactly this — and Kafka, DynamoDB and most cloud queues do not implement it.',
      },
      {
        kind: 'prose',
        text: 'Where 2PC works is **inside one system** whose coordinator is itself replicated. Spanner runs it across shards, but every participant and the coordinator is a Paxos group, so when a machine dies another replica holding the same log carries on, and nobody waits on a single node. CockroachDB does the same over Raft. That is the honest answer to "is two-phase commit dead?": between services, yes; inside a distributed database, it is how cross-shard transactions work.',
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'Postgres can be a participant through `PREPARE TRANSACTION`, and ships with it switched off (`max_prepared_transactions = 0`). An orphaned prepared transaction keeps its locks and holds back vacuum until someone finds it and resolves it by hand.',
      },
      { kind: 'heading', text: 'Sagas' },
      {
        kind: 'prose',
        text: 'A **saga** splits the transaction into local transactions, each committed on its own, each paired with a **compensating action** that semantically undoes it: refund the charge, release the reservation, cancel the shipment. If step 3 fails, run the compensations for steps 2 and 1. Nothing is locked between steps, so nothing blocks. The price is that other requests can see the half-finished state.',
      },
      {
        kind: 'figure',
        caption: 'An orchestrated saga: forward steps until one fails, then compensations in reverse.',
        figure: {
          kind: 'sequence',
          actors: ['Orchestrator', 'Payments', 'Inventory', 'Shipping'],
          steps: [
            { from: 0, to: 1, label: 'charge order 4471' },
            { from: 1, to: 0, label: 'charged', dashed: true, tone: 'mastered' },
            { from: 0, to: 2, label: 'reserve stock' },
            { from: 2, to: 0, label: 'out of stock', dashed: true, tone: 'alert' },
            { from: 0, to: 0, label: 'compensate completed steps', tone: 'streak' },
            { from: 0, to: 1, label: 'refund order 4471', tone: 'streak' },
            { from: 1, to: 0, label: 'refunded', dashed: true },
            { from: 0, to: 0, label: 'order cancelled' },
          ],
          note: 'Shipping is never called. The refund is retried until it succeeds, so it must be idempotent.',
        },
      },
      {
        kind: 'compare',
        left: {
          title: 'Orchestration',
          points: [
            'One coordinator sends commands and records each saga\'s state',
            'Easy to answer "where is order 4471?"',
            'Temporal, [[AWS]] Step Functions, or a state table you own',
            'The coordinator knows the whole flow, so coupling concentrates there',
          ],
        },
        right: {
          title: 'Choreography',
          points: [
            'Each service reacts to the previous service\'s event',
            'No central component, and adding a listener is easy',
            'The flow exists only as the sum of everyone\'s subscriptions',
            'Cycles and missing compensations hide until production',
          ],
        },
        verdict: 'Orchestrate anything with money in it or more than three steps. Choreography suits short, loosely related reactions: send the email, update the search index.',
      },
      { kind: 'heading', text: 'What a saga gives up' },
      {
        kind: 'prose',
        text: 'A saga is atomic in the end — every step completes or is compensated — but it has **no isolation**. Between steps, other requests see the charge without the reservation. Three countermeasures, and naming one unprompted is the senior signal:',
      },
      {
        kind: 'list',
        items: [
          '**Semantic locks.** Mark the order `PENDING` so other flows treat it as provisional — no shipping, no second refund — until the saga finishes.',
          '**Commutative updates.** Increment and decrement stock rather than setting it, so interleaved sagas and compensations add up in any order.',
          '**Irreversible steps last.** An email sent or a parcel shipped cannot be compensated, so it happens only after every step that can fail. The last step that can fail is the **pivot**: before it, compensate; after it, only retry forwards.',
        ],
      },
      { kind: 'heading', text: 'The dual write, and the outbox' },
      {
        kind: 'prose',
        text: 'The most common bug in event-driven designs is two lines of code: save the order, then publish `OrderPlaced` to Kafka. Crash between them and the order exists but nobody hears about it. Publish first and crash, and everyone hears about an order that does not exist. A retry loop does not fix it, because after a crash you do not know which half happened — station 1\'s timeout again.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Dual write: two systems, no atomicity',
          code: `async function placeOrder(o: Order) {
  await db.insert('orders', o)
  // crash here: the order exists,
  // and the event is never sent
  await kafka.send('orders', {
    type: 'OrderPlaced',
    orderId: o.id,
  })
}`,
        },
        after: {
          title: 'Outbox: one local transaction',
          code: `async function placeOrder(o: Order) {
  await db.tx(async (tx) => {
    await tx.insert('orders', o)
    await tx.insert('outbox', {
      id: crypto.randomUUID(),
      type: 'OrderPlaced',
      payload: { orderId: o.id },
    })
  })
  // a relay publishes outbox rows later
}`,
        },
        note: 'Both rows commit or neither does. Getting the event to Kafka becomes a separate job that can safely retry.',
      },
      {
        kind: 'prose',
        text: 'The **transactional outbox** writes the event into an `outbox` table in the **same local transaction** as the business change. A relay then reads the outbox and publishes it. There are two ways to build the relay:',
      },
      {
        kind: 'list',
        items: [
          '**Polling.** A worker selects unpublished rows, publishes them and marks them sent. Simple, at the cost of steady query load and a polling delay.',
          '**[[CDC]].** Tail the database\'s replication log and turn each outbox insert into a message. No polling, sub-second lag, and the log already holds commit order.',
        ],
      },
      {
        kind: 'figure',
        caption: 'The outbox: the database transaction is the only atomic step, and everything after it can retry.',
        figure: {
          kind: 'flow',
          nodes: [
            { label: 'Order service', sub: 'one local transaction', tone: 'line', to: 'order + outbox row' },
            { label: 'Postgres', sub: 'write-ahead log', to: 'tailed by' },
            { label: 'Debezium', sub: 'log-based CDC', to: 'publishes' },
            { label: 'Kafka', sub: 'at-least-once', tone: 'streak', to: 'delivers' },
            { label: 'Consumers', sub: 'dedupe by event id', tone: 'mastered' },
          ],
          note: 'The relay can publish a row twice if it crashes before recording its progress. That is why every consumer dedupes.',
        },
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Debezium\'s outbox event router',
        text: 'Debezium ships a component for exactly this. It reads inserts to the outbox table from Postgres\'s write-ahead log or MySQL\'s binlog, routes each row to a Kafka topic chosen by one of its columns, and keys the message by the aggregate id — so every event for one order lands on one partition, in order.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Between services I would not use two-phase commit: it blocks on the coordinator and ties everyone\'s availability together. I would run an orchestrated saga with idempotent compensations, and publish every event through a transactional outbox so the database change and the event cannot disagree.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Saying "we write to the database and publish to Kafka" without noticing it is two writes. The interviewer asks "what if the process dies in between?", and the only good answers are the outbox or making the log itself the source of truth. A retry around the publish does not survive the crash.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'The coordinator in your two-phase commit crashed after everyone voted yes. What happens?',
            a: 'The participants are in doubt and keep their locks until the coordinator recovers and reads its decision log, or an operator resolves them by hand. That is the blocking problem. Spanner avoids it by making the coordinator a replicated Paxos group, so another replica takes over the same log.',
          },
          {
            q: 'A compensation fails — the refund call keeps erroring. Now what?',
            a: 'Retry it with backoff and an idempotency key, because a compensation has to succeed eventually; there is no compensation for a compensation. If it keeps failing, park the saga in a failed state and alert a human, the way a dead-letter queue works. Design compensations to be actions that can always succeed in the end, like a refund, not ones that can be refused.',
          },
          {
            q: 'Why not skip the outbox and write only to Kafka?',
            a: 'That is the other fix: make the log the source of truth, and have every service — including the one that wrote the event — build its state by consuming it. It removes the dual write, but now a service\'s own reads lag its own writes. It suits event-sourced systems better than a typical order service with a user waiting on the result.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-d-transactions-1',
        moduleId: 'd-transactions',
        stem: 'In two-phase commit, when is a participant blocked?',
        options: [
          'Before it has received the prepare request',
          'After voting yes and before hearing the decision, if the coordinator is unreachable',
          'After it has voted no',
          'After the coordinator has sent commit',
        ],
        correct: 1,
        explain:
          'A yes vote gives up the right to abort alone, and the participant cannot commit without knowing the others voted yes. Only the coordinator\'s decision releases it. Before voting, or after voting no, it is free to abort.',
      },
      {
        id: 'q-d-transactions-2',
        moduleId: 'd-transactions',
        stem: 'An order service saves the order, then publishes OrderPlaced to Kafka. What is the bug, and the standard fix?',
        options: [
          'A crash between the two writes loses or invents an event; write the event to an outbox table in the same transaction',
          'Kafka may reorder the events; publish everything to a single partition',
          'The publish is slow; move it to a background thread so the request returns sooner',
          'Consumers may read before the order commits; make them read from the primary',
        ],
        correct: 0,
        explain:
          'Two systems, two writes, no shared transaction: the process can die between them. The outbox makes it one local transaction, and a relay publishes afterwards — at-least-once, so consumers dedupe. A background thread makes the gap wider, not smaller.',
      },
      {
        id: 'q-d-transactions-3',
        moduleId: 'd-transactions',
        stem: 'Mid-saga, another request sees the payment taken but the stock not yet reserved. Which property did the saga trade away?',
        options: [
          'Atomicity',
          'Durability',
          'Isolation',
          'Availability',
        ],
        correct: 2,
        explain:
          'A saga still ends atomically — every step completes or is compensated — and each local step is durable. What it lacks is isolation: intermediate states are visible. A semantic lock such as a `PENDING` status is the usual countermeasure.',
      },
    ],
    cards: [
      {
        id: 'c-d-transactions-1',
        moduleId: 'd-transactions',
        front: 'Why does [[2PC]] block?',
        back: 'A participant that voted yes can neither commit nor abort alone. If the coordinator dies before announcing, it holds its locks until the coordinator returns.',
        tag: 'Transactions',
      },
      {
        id: 'c-d-transactions-2',
        moduleId: 'd-transactions',
        front: 'What does a saga give up, and how do you cope?',
        back: 'Isolation: others see half-done states. Use semantic locks like a `PENDING` status, commutative updates, and irreversible steps last.',
        tag: 'Sagas',
      },
      {
        id: 'c-d-transactions-3',
        moduleId: 'd-transactions',
        front: 'What is the transactional outbox?',
        back: 'Write the event to an outbox table in the same local transaction as the change; a relay or [[CDC]] publishes it. No dual write.',
        tag: 'Outbox',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'd-delivery',
    trackId: 'distributed',
    title: 'Delivery guarantees and idempotency',
    station: 6,
    prereqs: ['d-transactions', 'c-queues'],
    related: ['c-queues', 'a-longrunning'],
    minutes: 10,
    summary: 'At-most-once, at-least-once, and the effectively-once you can actually build — plus what Kafka\'s exactly-once really covers.',
    objectives: [
      'Trace each delivery guarantee to one choice: acknowledge before or after the work',
      'Build effectively-once processing with idempotency keys and a dedupe table',
      'Say what Kafka\'s exactly-once semantics cover, and which side effects they do not',
    ],
    keywords: ['at-least-once', 'at-most-once', 'exactly-once', 'effectively-once', 'idempotency key', 'deduplication', 'Kafka transactions', 'idempotent producer'],
    lesson: [
      {
        kind: 'prose',
        text: 'The core track established that consumers must be idempotent. Senior interviews go a level down: **why** exactly-once delivery is impossible, what you build instead, and what a vendor means when it says "exactly-once". The answer that wins is precise about where each guarantee starts and stops.',
      },
      {
        kind: 'prose',
        text: 'Every guarantee comes from one decision: does the consumer **acknowledge before or after** it does the work? A crash between the two will happen eventually, and the order you chose decides what that crash costs.',
      },
      {
        kind: 'figure',
        caption: 'The same crash under three guarantees. The difference is what happens after the restart.',
        figure: {
          kind: 'timeline',
          ticks: ['receive', 'crash', 'restart'],
          lanes: [
            {
              label: 'At-most-once: acknowledge, then process',
              bars: [
                { from: 0, to: 0.25, label: 'ack', tone: 'line' },
                { from: 0.25, to: 0.5, label: 'working', tone: 'neutral' },
              ],
              outcome: { label: 'lost', tone: 'alert' },
            },
            {
              label: 'At-least-once: process, then acknowledge',
              bars: [
                { from: 0, to: 0.5, label: 'done, ack not sent', tone: 'mastered' },
                { from: 0.6, to: 1, label: 'redelivered, done again', tone: 'streak' },
              ],
              outcome: { label: 'twice', tone: 'streak' },
            },
            {
              label: 'Effectively-once: at-least-once plus dedupe',
              bars: [
                { from: 0, to: 0.5, label: 'done, ack not sent', tone: 'mastered' },
                { from: 0.6, to: 1, label: 'redelivered, skipped', tone: 'mastered' },
              ],
              outcome: { label: 'once', tone: 'mastered' },
            },
          ],
          note: 'The crash lands between the work and the acknowledgement. Only the last lane comes through it intact.',
        },
      },
      { kind: 'heading', text: 'The three guarantees' },
      {
        kind: 'table',
        head: ['Guarantee', 'How you get it', 'Use it for'],
        rows: [
          ['At-most-once', 'Acknowledge first, or never retry', 'Metrics samples, presence pings — losing one is cheaper than handling duplicates'],
          ['At-least-once', 'Retry until acknowledged, acknowledge after the work', 'The default almost everywhere: [[SQS]], Kafka, most webhook providers'],
          ['Effectively-once', 'At-least-once delivery plus idempotent processing', 'Anything with money, stock, or a count someone checks'],
        ],
      },
      {
        kind: 'prose',
        text: 'Exactly-once **delivery** is impossible for the reason station 1 gave: the sender cannot tell a lost message from a lost acknowledgement, so it must risk sending twice or risk not sending at all. What you can build is exactly-once **effect**: deliver at least once, and make every repeat do nothing. Call it effectively-once and the interviewer knows you know the difference.',
      },
      { kind: 'heading', text: 'Idempotency keys' },
      {
        kind: 'prose',
        text: 'An operation is **idempotent** if doing it twice leaves the same result as doing it once. Some are naturally: `PUT` a value, set a status, delete by id. Others — charge a card, append to a list, increment a counter — are not, and you make them idempotent by giving each logical operation a **unique key** that the server remembers.',
      },
      {
        kind: 'figure',
        caption: 'An idempotency key turns a retry into a lookup. The second request gets the first result back.',
        figure: {
          kind: 'sequence',
          actors: ['Client', 'Payments API', 'Card network'],
          steps: [
            { from: 0, to: 1, label: 'POST /charges, key k-81f2' },
            { from: 1, to: 1, label: 'k-81f2: in progress' },
            { from: 1, to: 2, label: 'authorise' },
            { from: 2, to: 1, label: 'approved', dashed: true },
            { from: 1, to: 1, label: 'k-81f2: saved 201 and body', tone: 'mastered' },
            { from: 1, to: 0, label: '201 — lost on the way back', dashed: true, tone: 'alert' },
            { from: 0, to: 1, label: 'retry: POST /charges, key k-81f2' },
            { from: 1, to: 0, label: 'same 201, same body, no new charge', dashed: true, tone: 'mastered' },
          ],
        },
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Stripe\'s idempotency keys',
        text: 'Any `POST` to Stripe\'s [[API]] can carry an `Idempotency-Key` header. Stripe saves the status code and body of the first request with that key — server errors included — and returns them for every retry. A retry whose parameters differ from the original is rejected, and keys may be pruned once they are 24 hours old.',
      },
      { kind: 'prose', text: 'Three rules make keys work, whoever implements them:' },
      {
        kind: 'list',
        items: [
          '**The client generates the key**, once per logical operation, before the first attempt: a [[UUID]], or something natural like the order id. A key minted per attempt dedupes nothing.',
          '**Store the key atomically with the effect.** If the key is saved in one transaction and the charge in another, a crash between them reopens the gap you were closing.',
          '**Handle the concurrent retry.** A second request arriving while the first is still running must wait or get a conflict, not start a second charge. A unique constraint on the key does this for you.',
        ],
      },
      { kind: 'heading', text: 'The dedupe table' },
      {
        kind: 'prose',
        text: 'For a queue consumer, the same idea is a table of processed message ids, written in the **same transaction** as the side effect. The unique constraint does the deduplication; the transaction makes it atomic.',
      },
      {
        kind: 'code',
        caption: 'The marker row and the effect commit together or not at all. A redelivered message hits the conflict and returns.',
        code: `async function handle(msg: PaymentEvent) {
  await db.tx(async (tx) => {
    const fresh = await tx.query(
      \`insert into processed (message_id)
       values ($1) on conflict do nothing\`,
      [msg.id],
    )
    if (fresh.rowCount === 0) return // seen it
    await tx.query(
      \`update balances set cents = cents + $1
       where account_id = $2\`,
      [msg.amountCents, msg.accountId],
    )
  })
  // acknowledge only after the commit
}`,
      },
      {
        kind: 'prose',
        text: 'Two costs to name. The table grows, so expire rows after the longest window in which a duplicate can still arrive — the broker\'s redelivery horizon plus your own retries — with a [[TTL]] or by dropping old partitions. And it only works when the side effect lives in the **same database** as the table. When the effect is an external call, pass a key through to that system instead, as you would to Stripe.',
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'Brokers dedupe a little. [[SQS]] [[FIFO]] queues drop a message whose deduplication id they have seen — but only within a five-minute window. Treat broker-side dedupe as fewer duplicates, never as none, and dedupe in the consumer anyway.',
      },
      { kind: 'heading', text: 'What Kafka\'s exactly-once covers' },
      {
        kind: 'prose',
        text: 'Kafka does offer exactly-once semantics, and they are real, but their scope is precise. Two mechanisms:',
      },
      {
        kind: 'list',
        items: [
          '**The idempotent producer.** Each producer gets an id and numbers its messages per partition, and the broker drops a retried duplicate. It is on by default since Kafka 3.0, and it removes duplicates caused by producer retries — nothing else.',
          '**Transactions.** A producer writes to several partitions **and commits the consumer\'s offsets** in one atomic transaction, and consumers reading with `isolation.level=read_committed` see all of it or none. That makes a read-process-write loop from Kafka to Kafka exactly-once; Kafka Streams turns it on with `processing.guarantee=exactly_once_v2`.',
        ],
      },
      {
        kind: 'figure',
        caption: 'Where Kafka\'s exactly-once ends: at the edge of Kafka.',
        figure: {
          kind: 'split',
          left: {
            title: 'Covered',
            tone: 'mastered',
            nodes: [
              { label: 'Topic A', to: 'consume' },
              { label: 'Streams app', sub: 'output and offsets in one transaction', tone: 'mastered', to: 'produce' },
              { label: 'Topic B', sub: 'read_committed' },
            ],
            cost: 'Kafka in, Kafka out: exactly-once end to end.',
          },
          right: {
            title: 'Not covered',
            tone: 'alert',
            nodes: [
              { label: 'Topic A', to: 'consume' },
              { label: 'Consumer', sub: 'calls out, then commits its offset', tone: 'streak', to: 'side effect' },
              { label: 'Postgres, Stripe, email', sub: 'can happen twice', tone: 'alert' },
            ],
            cost: 'A crash after the call and before the offset commit runs the call again.',
          },
          verdict: 'Every effect outside Kafka needs its own idempotency, whatever the topic settings say.',
        },
      },
      {
        kind: 'prose',
        text: 'The moment a consumer writes to Postgres, calls an external service or sends an email, Kafka cannot roll that back. You are back to at-least-once and need the techniques above — or you store the consumer\'s offset **in the same database transaction** as the effect, so a restart resumes from exactly what was applied.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Exactly-once delivery is not possible, so I will build effectively-once. Delivery is at-least-once, each message carries an idempotency key, and the consumer records that key in the same transaction as the effect. Kafka\'s exactly-once covers the Kafka-to-Kafka hop, not the charge.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Answering "how do you avoid double charging?" with "we turn on Kafka exactly-once". The charge is a call to a payment provider, outside Kafka\'s transaction. The interviewer wants the idempotency key passed to the provider, and the dedupe record sitting next to the effect.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Where does the idempotency key come from in a mobile checkout?',
            a: 'The client generates it when the user taps pay, before the first attempt, and reuses it on every retry of that tap. The server stores it under a unique constraint alongside the order. If the server minted it, a retry after a lost reply would arrive with a fresh key and charge again.',
          },
          {
            q: 'How long do you keep dedupe records?',
            a: 'At least as long as a duplicate can still arrive: the broker\'s redelivery window plus the client\'s retry horizon, with margin. Stripe keeps keys for at least 24 hours. Past that I expire them with a [[TTL]] or by dropping old partitions, so the table stays small.',
          },
          {
            q: 'Your consumer must call a third party that does not support idempotency keys. What do you do?',
            a: 'Record the intent first, with a status, in my own database, and send my own reference with the call. Before any retry, ask the third party whether an operation with that reference already happened. If they offer neither keys nor a lookup, I accept a small duplicate risk, reconcile against their reports, and say so.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-d-delivery-1',
        moduleId: 'd-delivery',
        stem: 'A consumer acknowledges each message, then processes it. It crashes halfway through one. Which guarantee is this?',
        options: [
          'At-least-once',
          'At-most-once',
          'Effectively-once',
          'Exactly-once',
        ],
        correct: 1,
        explain:
          'Acknowledging first means a crash loses the message: the broker will never redeliver it. Process-then-acknowledge is at-least-once; add idempotent processing and you get effectively-once.',
      },
      {
        id: 'q-d-delivery-2',
        moduleId: 'd-delivery',
        stem: 'A mobile client retries a payment after a timeout. Which design prevents a double charge?',
        options: [
          'A longer client timeout, so that retries become rare',
          'Allowing at most one retry per payment',
          'The server generating an idempotency key for each request it receives',
          'The client creating one key per payment and reusing it on every retry, stored with the charge',
        ],
        correct: 3,
        explain:
          'The key must identify the logical operation, so the client creates it before the first attempt. A server-minted key is fresh on every request and dedupes nothing. Fewer retries mean fewer duplicates, not none.',
      },
      {
        id: 'q-d-delivery-3',
        moduleId: 'd-delivery',
        stem: 'You enable Kafka transactions. Your consumer reads an event and calls a payment provider. Is the charge exactly-once?',
        options: [
          'No — the call is outside Kafka\'s transaction, so a crash before the offset commit repeats it',
          'Yes — transactions make the whole consumer exactly-once',
          'Yes, provided consumers read with `isolation.level=read_committed`',
          'Only if the topic has a single partition',
        ],
        correct: 0,
        explain:
          'Kafka transactions cover writes to Kafka and offset commits, nothing else. An external call happens outside them and is repeated after a crash, so pass an idempotency key to the provider. `read_committed` only controls which messages a consumer sees.',
      },
    ],
    cards: [
      {
        id: 'c-d-delivery-1',
        moduleId: 'd-delivery',
        front: 'Why is exactly-once delivery impossible?',
        back: 'The sender cannot tell a lost message from a lost acknowledgement, so it risks sending twice or not at all. Build exactly-once effect instead.',
        tag: 'Delivery',
      },
      {
        id: 'c-d-delivery-2',
        moduleId: 'd-delivery',
        front: 'Effectively-once, in one line?',
        back: 'At-least-once delivery plus idempotent processing: a unique key recorded in the same transaction as the effect.',
        tag: 'Idempotency',
      },
      {
        id: 'c-d-delivery-3',
        moduleId: 'd-delivery',
        front: 'What does Kafka\'s exactly-once cover?',
        back: 'Producer retries, and atomic writes plus offset commits inside Kafka. Database writes, external calls and emails need their own idempotency.',
        tag: 'Kafka',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'd-resilience',
    trackId: 'distributed',
    title: 'Timeouts, retries, circuit breakers, backpressure',
    station: 7,
    prereqs: ['d-delivery'],
    related: ['c-queues', 'f-cache'],
    minutes: 11,
    summary: 'The tools that stop one slow dependency taking down everything that calls it, and how retries turn a blip into an outage.',
    objectives: [
      'Set timeouts from latency data, and propagate a deadline down the call chain',
      'Retry with capped exponential backoff, full jitter and a retry budget',
      'Explain a circuit breaker\'s three states, and what bulkheads add',
      'Choose between load shedding and backpressure when demand exceeds capacity',
    ],
    keywords: ['timeout', 'deadline', 'retry', 'exponential backoff', 'jitter', 'retry storm', 'retry budget', 'circuit breaker', 'bulkhead', 'load shedding', 'backpressure'],
    lesson: [
      {
        kind: 'prose',
        text: 'Most large outages are not one thing breaking. They are one thing getting **slow**, and everything that calls it waiting, retrying and running out of threads, until the slowness has spread to every service on the path. The patterns in this station exist to stop that spread.',
      },
      {
        kind: 'figure',
        caption: 'A cascading failure: the slowness travels up the call chain, one exhausted pool at a time.',
        figure: {
          kind: 'flow',
          nodes: [
            { label: 'Database', sub: 'one slow disk', tone: 'streak', to: 'calls wait' },
            { label: 'Payments', sub: 'every thread waiting', tone: 'alert', to: 'calls wait' },
            { label: 'Checkout', sub: 'every thread waiting', tone: 'alert', to: 'retries pile on' },
            { label: 'Users', sub: 'timeouts everywhere', tone: 'alert' },
          ],
          note: 'Nothing here crashed. Each service is healthy except that every thread it has is waiting on the one below.',
        },
      },
      {
        kind: 'prose',
        text: 'Interviewers ask for them in the deep dive: "the payments provider is slow — what happens to checkout?" A strong answer names the timeout, the retry policy, what trips, and what gets dropped, in that order.',
      },
      { kind: 'heading', text: 'Timeouts and deadlines' },
      {
        kind: 'prose',
        text: 'Every remote call gets a timeout. Without one, a hung dependency holds a thread or connection forever, and under load a pool of 200 is gone in seconds. Set it from data: a little above the dependency\'s p99 latency, so you cut off the tail without failing normal requests.',
      },
      {
        kind: 'prose',
        text: 'Then propagate a **deadline**, not just a timeout. If the user\'s request has 800 ms in total and 600 are spent, the next call down gets 200 ms, not its usual 500. [[gRPC]] carries the deadline with each request for exactly this reason: it stops services working on answers that nobody is waiting for any more.',
      },
      { kind: 'heading', text: 'Retries, backoff and jitter' },
      {
        kind: 'prose',
        text: 'Retries cure transient failures — a dropped packet, a leader election, a node restarting — and amplify everything else. Three rules: retry only idempotent operations (station 6), retry only errors that might succeed next time (a timeout or a 503, not a 400), and wait longer each time.',
      },
      {
        kind: 'prose',
        text: '**Exponential backoff** doubles the wait on each attempt, up to a cap. On its own it is not enough: a thousand clients that failed together back off together and come back together, in synchronised waves. **Jitter** randomises each wait so the retries spread out. Marc Brooker\'s comparison on the [[AWS]] Architecture Blog found that **full jitter** — a random wait anywhere between zero and the backoff — did the least total work.',
      },
      {
        kind: 'code',
        caption: 'Capped exponential backoff with full jitter: the ceiling doubles, and the actual wait is anywhere beneath it.',
        code: `function backoffMs(attempt: number): number {
  const base = 100    // first retry waits up to 100 ms
  const cap = 10_000  // never wait more than 10 s
  const ceiling = Math.min(cap, base * 2 ** attempt)
  return Math.random() * ceiling  // full jitter
}`,
      },
      {
        kind: 'figure',
        caption: 'A thousand clients retrying after a shared failure, with and without jitter.',
        figure: {
          kind: 'timeline',
          ticks: ['failure', '1 s', '2 s', '3 s', '4 s'],
          lanes: [
            {
              label: 'Backoff, no jitter',
              bars: [
                { from: 0.23, to: 0.29, tone: 'alert' },
                { from: 0.73, to: 0.79, tone: 'alert' },
              ],
              outcome: { label: 'waves', tone: 'alert' },
            },
            {
              label: 'Backoff, full jitter',
              bars: [{ from: 0.02, to: 1, label: 'retries spread across the window', tone: 'mastered' }],
              outcome: { label: 'smooth', tone: 'mastered' },
            },
          ],
          note: 'The same number of retries. Without jitter they all land at once and knock the recovering service over again.',
        },
      },
      { kind: 'heading', text: 'Retry storms and budgets' },
      {
        kind: 'prose',
        text: 'Retries multiply down a call chain. If each of five layers makes up to three attempts, a failure at the bottom turns one user request into 3⁵ = 243 calls on the struggling service — at the moment it has least capacity to spare. That is a **retry storm**, and it is how a brief overload becomes a long outage.',
      },
      {
        kind: 'figure',
        caption: 'Retry amplification: attempts multiply at every layer that retries.',
        figure: {
          kind: 'scale',
          items: [
            { label: 'Layer 1', display: '3 calls', value: 3 },
            { label: 'Layer 2', display: '9 calls', value: 9 },
            { label: 'Layer 3', display: '27 calls', value: 27, tone: 'streak' },
            { label: 'Layer 4', display: '81 calls', value: 81, tone: 'streak' },
            { label: 'Layer 5', display: '243 calls', value: 243, tone: 'alert' },
          ],
          note: 'Three attempts per layer, five layers, one user request. The bottom service sees the product, not the sum.',
        },
      },
      {
        kind: 'list',
        items: [
          '**Retry at one layer.** Usually the one nearest the user, or the one that knows the operation is idempotent. Everything below fails fast.',
          '**Use a retry budget.** Cap retries as a fraction of normal traffic; Envoy\'s retry budget, once switched on, defaults to 20% of active requests. When the dependency is truly broken, the budget runs out and you stop adding load.',
          '**Honour backoff hints.** A 429 or 503 with a `Retry-After` header is the server telling you how long to wait.',
        ],
      },
      { kind: 'heading', text: 'Circuit breakers' },
      {
        kind: 'prose',
        text: 'A retry budget limits the extra load. A **circuit breaker** stops calling altogether once a dependency is clearly failing, so callers fail in microseconds instead of waiting out a timeout, and the dependency gets room to recover.',
      },
      {
        kind: 'figure',
        caption: 'A circuit breaker\'s three states. It returns to closed only when trial calls succeed.',
        figure: {
          kind: 'cycle',
          steps: [
            { label: 'Closed', sub: 'calls flow; failures counted over a rolling window' },
            { label: 'Open', sub: 'error rate crossed the threshold: fail fast, send nothing' },
            { label: 'Half-open', sub: 'after a cool-down, let a few trial calls through' },
          ],
          note: 'If a trial call fails in half-open, the breaker goes straight back to open and the cool-down starts again.',
        },
      },
      {
        kind: 'prose',
        text: 'The thresholds matter more than the mechanism. Netflix\'s Hystrix defaults are a sensible baseline: trip when at least 20 requests in a 10-second window see 50% errors, then try again after 5 seconds. And decide what the caller does while the breaker is open — a cached value, a default, a degraded page — or all you have done is turn slow failures into fast ones.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Netflix and the fallback',
        text: 'Hystrix came out of Netflix\'s [[API]] tier, where one page fans out to dozens of services. Each dependency got its own breaker, its own thread pool and a fallback: when a personalisation call failed, the page could fall back to a generic, non-personalised answer instead of an error. Hystrix is now in maintenance mode; Resilience4j and service proxies such as Envoy carry the same ideas.',
      },
      { kind: 'heading', text: 'Bulkheads' },
      {
        kind: 'prose',
        text: 'A ship\'s bulkheads stop one flooded compartment sinking the whole hull. In a service, a **bulkhead** gives each dependency its own bounded pool — threads, connections, or a concurrency limit — so a slow dependency can exhaust only its own share.',
      },
      {
        kind: 'figure',
        caption: 'Without bulkheads one slow dependency drains the shared pool; with them it drains only its own.',
        figure: {
          kind: 'split',
          left: {
            title: 'One shared pool',
            tone: 'alert',
            nodes: [
              { label: '200 threads', sub: 'shared by every outbound call', to: 'all stuck on' },
              { label: 'Slow reviews service', tone: 'alert' },
            ],
            cost: 'Checkout, search and login all queue behind reviews.',
          },
          right: {
            title: 'A pool per dependency',
            tone: 'mastered',
            nodes: [
              { label: 'Reviews: 20', sub: 'exhausted', tone: 'alert', to: 'walled off from' },
              { label: 'Checkout: 100 · search: 80', sub: 'unaffected', tone: 'mastered' },
            ],
            cost: 'Some capacity sits reserved and idle.',
          },
          verdict: 'Pay a little utilisation to cap how far any one dependency\'s failure can spread.',
        },
      },
      { kind: 'heading', text: 'Load shedding and backpressure' },
      {
        kind: 'prose',
        text: 'When demand exceeds capacity, something has to give. Either you choose **what**, or the system chooses for you by queueing until latency is unbounded. Two answers:',
      },
      {
        kind: 'compare',
        left: {
          title: 'Load shedding',
          points: [
            'Reject excess work early and cheaply: a fast 503 before parsing the body',
            'Shed by priority: checkout before analytics, user requests before prefetches',
            'Right for request-response traffic from many independent clients',
          ],
        },
        right: {
          title: 'Backpressure',
          points: [
            'Tell the producer to slow down: bounded queues, [[TCP]] windows, pull-based consumers',
            'Kafka consumers pull, so a slow one falls behind instead of being flooded',
            'Right when you control the producer and the work must not be dropped',
          ],
        },
        verdict: 'Shed at the edge, where you cannot slow the internet down. Apply backpressure inside, where every producer is yours and every message matters.',
      },
      {
        kind: 'prose',
        text: 'The common bug is the **unbounded queue**. It hides overload: latency climbs while every request waits behind requests whose callers have already timed out and left. Bound every queue and reject when it is full. Facebook\'s servers go further and switch to serving the newest requests first once a queue forms, because the oldest have usually been abandoned already.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Every call gets a timeout from its p99 and a share of the request\'s deadline. Retries happen at one layer, with jittered backoff and a budget. A breaker trips on error rate and falls back to something useful. Each dependency gets its own pool, and when we are over capacity we shed the lowest-priority work at the edge.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Adding retries everywhere "for resilience". Retries at every layer multiply, so the first time the database slows down, your own services hit it with many times the normal load. Say where the retry lives, and what stops it when the dependency is down.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'The payments provider has slowed to five seconds per call. What happens to your checkout?',
            a: 'The call times out at its budget, say two seconds, rather than holding threads. Retries are capped by the budget; once errors cross the threshold the breaker opens and checkout fails fast with "try again shortly", or accepts the order and authorises the card asynchronously. The payments pool is a bulkhead, so browsing and search carry on.',
          },
          {
            q: 'How do you choose the circuit breaker\'s thresholds?',
            a: 'From the dependency\'s normal error rate and traffic: a minimum request volume so a handful of errors at 3 a.m. does not trip it, an error rate well above normal, and a cool-down roughly as long as the dependency takes to recover. Then I test it with fault injection, because a breaker that has never tripped in testing is a guess.',
          },
          {
            q: 'Load shedding or backpressure for an ingest pipeline fed by mobile clients?',
            a: 'Shedding at the edge: I cannot slow phones down except by asking, so I return 429 with `Retry-After` and the clients back off. Behind the edge, the ingest service writes to Kafka and consumers pull at their own pace. That is backpressure, so a slow consumer falls behind instead of losing data.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-d-resilience-1',
        moduleId: 'd-resilience',
        stem: 'A thousand clients fail at the same instant and retry with exponential backoff but no jitter. What happens?',
        options: [
          'The retries spread out naturally as the backoff grows',
          'The backoff cap stops the retries overloading anything',
          'They retry in synchronised waves that can knock the recovering service over again',
          'The service sees fewer requests than it did before the failure',
        ],
        correct: 2,
        explain:
          'Identical clients compute identical waits, so they come back together. Jitter randomises each wait and spreads the load. The cap limits how long one client waits, not how many arrive at the same moment.',
      },
      {
        id: 'q-d-resilience-2',
        moduleId: 'd-resilience',
        stem: 'A circuit breaker is half-open and its trial call fails. What happens next?',
        options: [
          'It goes back to open and waits out another cool-down',
          'It closes and resumes normal traffic',
          'It stays half-open and lets all traffic through',
          'It disables itself until an operator resets it',
        ],
        correct: 0,
        explain:
          'Half-open exists to test recovery with a few requests. A failure means the dependency is still unhealthy, so the breaker reopens and tries again later. Closing on a failure would send full traffic to a service that is still down.',
      },
      {
        id: 'q-d-resilience-3',
        moduleId: 'd-resilience',
        stem: 'One 200-thread pool serves every outbound call. The reviews service turns slow and checkout starts timing out. What fixes the root cause?',
        options: [
          'Raise the pool to 400 threads',
          'Give each dependency its own bounded pool — a bulkhead',
          'Retry checkout\'s calls more aggressively',
          'Lengthen every timeout so slow calls can finish',
        ],
        correct: 1,
        explain:
          'Checkout fails because reviews calls hold every shared thread. A bulkhead confines reviews to its own pool. More threads only delays the exhaustion, and more retries or longer timeouts hold threads for longer still.',
      },
    ],
    cards: [
      {
        id: 'c-d-resilience-1',
        moduleId: 'd-resilience',
        front: 'Why add jitter to exponential backoff?',
        back: 'Clients that failed together back off together and return in waves. Randomising each wait spreads them out; full jitter does the least total work.',
        tag: 'Retries',
      },
      {
        id: 'c-d-resilience-2',
        moduleId: 'd-resilience',
        front: 'A circuit breaker\'s three states?',
        back: 'Closed: calls flow, failures counted. Open: fail fast. Half-open: a few trial calls; success closes it, failure reopens it.',
        tag: 'Resilience',
      },
      {
        id: 'c-d-resilience-3',
        moduleId: 'd-resilience',
        front: 'Load shedding or backpressure?',
        back: 'Shed at the edge, where you cannot slow clients down. Backpressure inside, where you own the producers and work must not be dropped.',
        tag: 'Resilience',
      },
    ],
  },
]
