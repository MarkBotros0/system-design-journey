import type { Module } from '../types'

/**
 * Track 2 — Core concepts.
 *
 * The framework, and the trade-offs every design turns on. Foundations teaches you what
 * the boxes are; this track teaches you how to choose between them under a clock.
 */

export const coreModules: Module[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'c-framework',
    trackId: 'core',
    title: 'The delivery framework',
    station: 1,
    prereqs: ['f-scale'],
    minutes: 9,
    summary: 'Six phases, fixed order, minute budgets. The structure that stops you drifting.',
    lesson: [
      {
        kind: 'prose',
        text: 'Forty-five minutes, six phases, always the same order. The order is the whole value: it keeps you linear, kills scope creep, and means you never stall wondering what comes next. Everything else in this app hangs off it.',
      },
      {
        kind: 'table',
        head: ['Phase', 'Budget', 'What you produce'],
        rows: [
          ['**Requirements**', '5 min', 'Top 3 functional, 3–5 quantified non-functional'],
          ['**Core entities**', '2 min', '3–5 nouns — a vocabulary, not a schema'],
          ['**API**', '5 min', 'One endpoint per functional requirement'],
          ['**Data flow**', '5 min', 'Optional. Pipeline-shaped systems only'],
          ['**High-level design**', '10–15 min', 'Boxes and arrows satisfying the API'],
          ['**Deep dives**', '10 min', '2–3 bottlenecks worked properly'],
        ],
      },
      {
        kind: 'prose',
        text: 'That is 42 minutes of budget inside a 45-minute slot. The remainder is slack, deliberately — you will overrun somewhere, and a plan with no slack is a plan that fails on contact.',
      },
      { kind: 'heading', text: 'Why this order and not another' },
      {
        kind: 'prose',
        text: 'Each phase constrains the next. Requirements decide what the API must expose. The API decides what the architecture must serve. The architecture surfaces the bottlenecks that become your deep dives. Skip a phase and the one after it loses its footing — which is why candidates who start drawing immediately end up with a design that satisfies nothing in particular.',
      },
      {
        kind: 'flow',
        nodes: ['Requirements', 'Entities', 'API', 'High-level', 'Deep dives'],
        note: 'Each arrow is a constraint, not just a sequence. That is what makes the order non-negotiable.',
      },
      { kind: 'heading', text: 'The margin-note habit' },
      {
        kind: 'callout',
        tone: 'say',
        text: 'During the high-level design, when you spot a bottleneck: say it out loud, write it in the margin, and keep going. Those notes become your deep-dive agenda — and writing them proves you saw the problem before the interviewer raised it.',
      },
      {
        kind: 'prose',
        text: 'This single habit does more for a senior score than any extra technology you could learn. It converts a thought you had anyway into visible signal, and it means you never reach minute 30 wondering what to talk about.',
      },
      { kind: 'heading', text: 'Closing the loop' },
      {
        kind: 'prose',
        text: 'In the last two minutes, walk back through the non-functional requirements you wrote in phase one and point at what satisfies each. It costs ninety seconds and converts work you already did into points the interviewer can actually record.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Treating the budgets as suggestions. Spending twelve minutes on requirements feels thorough and leaves you eight for deep dives — which is where senior is decided. If you are over on a phase, cut and move; an incomplete API you can still design against beats a perfect one you had no time to use.',
      },
    ],
    quiz: [
      {
        id: 'q-c-framework-1',
        moduleId: 'c-framework',
        stem: 'Why does the API come before the high-level design?',
        options: [
          'Because interviewers always ask for it first',
          'Because it constrains the architecture — you draw what serves each endpoint in turn',
          'Because it is the fastest phase and builds momentum',
          'It does not matter; the order is a convention',
        ],
        correct: 1,
        explain:
          'Each phase constrains the next. With an API written down, the high-level design assembles itself endpoint by endpoint instead of being invented as a whole.',
      },
      {
        id: 'q-c-framework-2',
        moduleId: 'c-framework',
        stem: 'You are at minute 20 and still refining requirements. What do you do?',
        options: [
          'Finish properly — requirements are the most important phase',
          'Cut immediately and move on, accepting an imperfect scope',
          'Ask the interviewer for extra time',
          'Skip the API and go straight to drawing',
        ],
        correct: 1,
        explain:
          'Deep dives are where senior is decided, and they come last. Overrunning early guarantees you never reach them. An imperfect scope you can design against beats a perfect one with no time left.',
      },
      {
        id: 'q-c-framework-3',
        moduleId: 'c-framework',
        stem: 'What should you do when you notice a bottleneck during the high-level design?',
        options: [
          'Solve it immediately, while it is fresh',
          'Ignore it — the interviewer will raise it if it matters',
          'Say it out loud, write it in the margin, and keep going',
          'Restructure the design to avoid it entirely',
        ],
        correct: 2,
        explain:
          'Solving it there derails the phase and burns your clock. Noting it proves you saw it, and gives you a deep-dive agenda you chose rather than one the interviewer had to hand you.',
      },
    ],
    cards: [
      {
        id: 'c-c-framework-1',
        moduleId: 'c-framework',
        front: 'The six phases and their minute budgets.',
        back: 'Requirements 5 · Core entities 2 · API 5 · Data flow 5 (optional) · High-level design 10–15 · Deep dives 10.',
        tag: 'Framework',
      },
      {
        id: 'c-c-framework-2',
        moduleId: 'c-framework',
        front: 'What is the margin-note habit and why does it score?',
        back: 'Name each bottleneck out loud during the high-level design and write it down. It becomes your deep-dive agenda, and it proves you spotted the problem before the interviewer did.',
        tag: 'Framework',
      },
      {
        id: 'c-c-framework-3',
        moduleId: 'c-framework',
        front: 'What do you do in the last two minutes?',
        back: 'Close the loop — walk back through your non-functional requirements and point at what satisfies each. Turns work already done into recordable signal.',
        tag: 'Framework',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'c-requirements',
    trackId: 'core',
    title: 'Requirements and estimation',
    station: 2,
    prereqs: ['c-framework'],
    minutes: 9,
    summary: 'Scoping to three, quantifying the rest, and the only arithmetic worth doing.',
    lesson: [
      {
        kind: 'prose',
        text: 'This is where the interview is decided, because everything after it inherits your scope. Get it wrong and you spend forty minutes building the wrong thing well.',
      },
      { kind: 'heading', text: 'Functional: exactly three' },
      {
        kind: 'prose',
        text: '"Users should be able to…" statements, prioritised, agreed out loud with the interviewer. Three. Not nine.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'A long list hurts more than it helps. You cannot design nine features in forty minutes, and attempting it produces a shallow pass over everything rather than a real design of anything. Naming what you are cutting is a positive signal, not an admission.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: '"I will scope to posting, following, and reading the feed. Likes, comments and DMs are out of scope unless you want me to cover one of them instead — does that match what you want to see?"',
      },
      { kind: 'heading', text: 'Non-functional: three to five, each quantified' },
      {
        kind: 'prose',
        text: 'Not "low latency" but "search under 500 ms". Not "scalable" but "100M DAU at 100:1 reads". A number turns an aspiration into a constraint you can design against and later point back at.',
      },
      {
        kind: 'prose',
        text: 'Run this checklist in your head and pick the ones that actually bite:',
      },
      {
        kind: 'list',
        items: [
          '**CAP** — consistency or availability when the network splits.',
          '**Environment constraints** — battery, memory, bandwidth on the client.',
          '**Scalability** — burstiness, seasonality, read/write ratio.',
          '**Latency** — what has a deadline, and what it is.',
          '**Durability** — how much data loss is survivable.',
          '**Security** — access control, data protection.',
          '**Fault tolerance** — redundancy, failover, recovery.',
          '**Compliance** — GDPR, data residency, retention.',
        ],
      },
      { kind: 'heading', text: 'Estimation: only when it decides something' },
      {
        kind: 'prose',
        text: 'The test is simple. **Does this number pick between two designs?** If yes, do it. If the conclusion is "so that is a lot of data", you just spent three of your forty-five minutes on nothing.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Worth doing',
          points: [
            '"Can one min-heap hold the top-K, or must it shard?"',
            '"Does a precomputed feed fit in memory at 2 billion users?"',
            '"How long must the short code be?"',
          ],
        },
        right: {
          title: 'Not worth doing',
          points: [
            'Total storage after five years, when nothing depends on it',
            'Bandwidth in gigabits, to conclude "we need a CDN"',
            'Any figure you will not refer to again',
          ],
        },
      },
      { kind: 'heading', text: 'The shortcuts' },
      {
        kind: 'list',
        items: [
          '**86,400 seconds/day ≈ 100k.** Daily volume ÷ 100k ≈ average QPS.',
          'Peak is **3–10×** average. Design for peak.',
          '1M DAU × 10 actions/day ≈ **116 writes/sec** average.',
          '1 KB × 1M/day ≈ 1 GB/day ≈ **365 GB/year**.',
          'Consumer read:write is around **100:1** — design the read path first.',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-c-requirements-1',
        moduleId: 'c-requirements',
        stem: 'Which non-functional requirement is written correctly?',
        options: [
          'The system should be highly scalable',
          'The system should be fast and reliable',
          'The system should render a feed in under 200 ms at 100M DAU',
          'The system should use best practices for performance',
        ],
        correct: 2,
        explain:
          'A number turns an aspiration into a constraint you can design against, and gives you something concrete to point back at when you close the loop.',
      },
      {
        id: 'q-c-requirements-2',
        moduleId: 'c-requirements',
        stem: 'When is capacity estimation worth the minutes?',
        options: [
          'Always — it demonstrates rigour',
          'Only when the number picks between two designs',
          'Only if the interviewer asks for it',
          'Never; it is a waste of interview time',
        ],
        correct: 1,
        explain:
          'Maths that concludes "that is a lot" costs you minutes and buys nothing. Maths that decides whether one heap suffices or you must shard is a design decision made visible.',
      },
      {
        id: 'q-c-requirements-3',
        moduleId: 'c-requirements',
        stem: 'A service handles 8.6 million requests a day. Roughly what is peak QPS?',
        options: [
          'About 100 — daily volume divided by 86,400',
          'About 100 average, so plan for roughly 300–1000 at peak',
          'About 8,600',
          'Not calculable without knowing the traffic pattern',
        ],
        correct: 1,
        explain:
          '8.6M ÷ 100k ≈ 86, call it 100 average. Peak runs 3–10× average, so you size for several hundred to a thousand. Averages size storage; peaks size servers.',
      },
    ],
    cards: [
      {
        id: 'c-c-requirements-1',
        moduleId: 'c-requirements',
        front: 'The eight non-functional categories.',
        back: 'CAP · environment constraints · scalability · latency · durability · security · fault tolerance · compliance. Pick the three to five that actually bite.',
        tag: 'Requirements',
      },
      {
        id: 'c-c-requirements-2',
        moduleId: 'c-requirements',
        front: 'Rough QPS from a daily volume, in your head.',
        back: '86,400 s/day ≈ 100k. Divide daily volume by 100k for average QPS, then multiply by 3–10 for peak.',
        tag: 'Numbers',
      },
      {
        id: 'c-c-requirements-3',
        moduleId: 'c-requirements',
        front: 'The test for whether to do a calculation.',
        back: 'Does the number pick between two designs? If the conclusion is "that is a lot", skip it.',
        tag: 'Requirements',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'c-modelling',
    trackId: 'core',
    title: 'Data modelling and indexing',
    station: 3,
    prereqs: ['c-requirements'],
    minutes: 8,
    summary: 'Access patterns first, secondary indexes, and how an external index stays in sync.',
    lesson: [
      {
        kind: 'prose',
        text: 'The model follows the queries, not the other way round. Write the access patterns down before the schema and most of the design decides itself.',
      },
      { kind: 'heading', text: 'Access patterns first' },
      {
        kind: 'prose',
        text: 'For each functional requirement, name the read: "given a user, the most recent posts of everyone they follow, newest first". That sentence tells you the key, the sort, and the index. Skip it and you get a schema that stores everything and answers nothing quickly.',
      },
      {
        kind: 'code',
        code: `Follow  PK: followerId   SK: followeeId      -- who do I follow?
        GSI: PK followeeId, SK followerId   -- who follows me?

Post    PK: creatorId    SK: createdAt       -- a user's posts, newest first`,
        caption: 'A reversed secondary index answers the same relationship from the other end.',
      },
      {
        kind: 'prose',
        text: 'That reversed index is the standard trick for a many-to-many relationship in a key-value store, and it is why a follow graph does not need a graph database — there is no deep traversal, only two lookups.',
      },
      { kind: 'heading', text: 'Secondary indexes' },
      {
        kind: 'prose',
        text: 'A **global** secondary index re-partitions the data under a different key, so it can answer a completely different question. A **local** one keeps the partition and changes the sort. Both cost storage and write throughput, and global indexes are eventually consistent — a write may not appear in the index for a moment.',
      },
      { kind: 'heading', text: 'Denormalising the hot path' },
      {
        kind: 'prose',
        text: 'Normalise by default. Then find the one read that is slow because it joins, and duplicate just enough to make it a single lookup. **State the update cost out loud** — every copy is now something that can drift, and saying so is the difference between a considered trade and an oversight.',
      },
      { kind: 'heading', text: 'External indexes and CDC' },
      {
        kind: 'prose',
        text: 'Some queries do not belong in your primary store at all: full text, geospatial, complex aggregation. Those go to a purpose-built index fed by **change data capture** — the primary database\'s write log is streamed into Elasticsearch or similar.',
      },
      {
        kind: 'flow',
        nodes: ['Postgres', 'CDC stream', 'Elasticsearch', 'Search API'],
        note: 'The index lags the primary by around a second. For search that is fine; for a booking decision it is not.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Naming the lag is the senior move: "search results can be a second stale, which is acceptable — but the booking path reads the primary, because a stale seat map would let two people buy the same seat."',
      },
    ],
    quiz: [
      {
        id: 'q-c-modelling-1',
        moduleId: 'c-modelling',
        stem: 'You need both "who does X follow" and "who follows X" from a key-value store. What do you do?',
        options: [
          'Use a graph database — this is a graph problem',
          'Store the Follow table twice, in two services',
          'One Follow table with a reversed global secondary index',
          'Scan the table and filter in the application',
        ],
        correct: 2,
        explain:
          'A reversed GSI answers the same relationship from the other end in O(1). There is no deep traversal here, so a graph database buys nothing and invites scaling questions you gain nothing from.',
      },
      {
        id: 'q-c-modelling-2',
        moduleId: 'c-modelling',
        stem: 'Your Elasticsearch index is fed from Postgres by CDC. Which use is inappropriate?',
        options: [
          'Searching event names with fuzzy matching',
          'Filtering a product catalogue by category',
          'Checking whether a specific seat is still available before taking payment',
          'Powering a typeahead suggestion box',
        ],
        correct: 2,
        explain:
          'CDC means the index lags by around a second. Fine for search; not fine for a decision where staleness means selling the same seat twice. That read goes to the primary.',
      },
      {
        id: 'q-c-modelling-3',
        moduleId: 'c-modelling',
        stem: 'What should you say when you denormalise a field?',
        options: [
          'Nothing — denormalisation is standard practice',
          'That it makes reads faster',
          'That it makes reads faster, and name the update cost you are accepting',
          'That you will normalise it again later',
        ],
        correct: 2,
        explain:
          'Every duplicate is something that can drift. Naming the write-side cost is what turns it into a considered trade-off rather than an oversight the interviewer has to find.',
      },
    ],
    cards: [
      {
        id: 'c-c-modelling-1',
        moduleId: 'c-modelling',
        front: 'How does an external search index stay current, and what does it cost?',
        back: 'Change data capture streams the primary\'s writes into it. It lags by roughly a second — fine for search, not for a decision where staleness is a correctness bug.',
        tag: 'Data modelling',
      },
      {
        id: 'c-c-modelling-2',
        moduleId: 'c-modelling',
        front: 'Global versus local secondary index.',
        back: 'Global re-partitions under a new key and answers a different question — eventually consistent. Local keeps the partition and changes the sort.',
        tag: 'Data modelling',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'c-caching',
    trackId: 'core',
    title: 'Caching, properly',
    station: 4,
    prereqs: ['c-modelling'],
    minutes: 8,
    summary: 'Invalidation, hot keys, and the layers a request passes through.',
    lesson: [
      {
        kind: 'prose',
        text: 'Foundations covered cache-aside and the two failure modes. This is the rest: where caches sit, how they go stale, and the one failure that sharding cannot fix.',
      },
      { kind: 'heading', text: 'The layers' },
      {
        kind: 'table',
        head: ['Layer', 'Holds', 'Invalidated by'],
        rows: [
          ['**CDN**', 'Static assets, unpersonalised API responses', 'TTL, purge on deploy'],
          ['**In-process**', 'Config, feature flags, tiny hot sets', 'Short TTL; per-instance, so it drifts'],
          ['**Distributed (Redis)**', 'Sessions, computed aggregates, hot rows', 'Explicit invalidation on write, or TTL'],
          ['**Database buffer pool**', 'Recently read pages', 'Managed for you'],
        ],
      },
      {
        kind: 'prose',
        text: 'Naming which layer you mean is worth a sentence. "Cache it" is ambiguous across four very different things with four different consistency stories.',
      },
      { kind: 'heading', text: 'Invalidation' },
      {
        kind: 'prose',
        text: 'Three honest options, and you pick per data type rather than globally:',
      },
      {
        kind: 'list',
        items: [
          '**Invalidate on write** — accurate, but every writer must know every cache key derived from that data.',
          '**Short TTL and accept staleness** — simple and robust; the question is only how stale is tolerable.',
          '**Both** — TTL as the backstop, explicit invalidation for the cases that matter.',
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Immutable data sidesteps the problem entirely. A short-link mapping, a published post, an uploaded image — none of them change, so they cache with an indefinite TTL and invalidation is a non-issue. Where you can make data immutable, do.',
      },
      { kind: 'heading', text: 'The hot key' },
      {
        kind: 'prose',
        text: 'Sharding assumes load spreads evenly across keys. Virality violates that assumption: one post, one product, one link takes millions of reads while every other shard idles. **Adding shards does not help** — the traffic is all going to one key.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Sharded cache',
          points: [
            'Each key lives on exactly one node',
            'Total capacity is the sum of all nodes',
            'A viral key hammers one node while the rest idle',
          ],
        },
        right: {
          title: 'Replicated cache',
          points: [
            'Every node can serve any key',
            'Total capacity is one node\'s worth',
            'Viral traffic spreads across all N nodes',
          ],
        },
        verdict: 'For hot-key-prone data, replicate. You trade total capacity for the ability to absorb a spike — and a few extra misses on a viral key are trivial next to the spike you avoided.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Answering "how do you handle a viral post" with "we shard the cache". Sharding is what created the problem. The interviewer is testing whether you understand *why* even distribution fails here.',
      },
    ],
    quiz: [
      {
        id: 'q-c-caching-1',
        moduleId: 'c-caching',
        stem: 'A post goes viral and one cache node saturates while the others sit idle. What fixes it?',
        options: [
          'Add more shards to spread the load',
          'Increase the TTL on that key',
          'Replicate — multiple instances each able to serve any key, load balanced across them',
          'Move the post to a dedicated database',
        ],
        correct: 2,
        explain:
          'All the traffic is for one key, so more shards changes nothing. Replication lets N nodes each serve that key, trading total cache capacity for spike absorption.',
      },
      {
        id: 'q-c-caching-2',
        moduleId: 'c-caching',
        stem: 'Which data makes cache invalidation a non-problem?',
        options: [
          'Data with a very short TTL',
          'Immutable data — a published post, a short-link mapping',
          'Data read by only one service',
          'Data stored in an in-process cache',
        ],
        correct: 1,
        explain:
          'If it never changes, there is nothing to invalidate — cache indefinitely. Making data immutable where you can is a design lever, not just a property you observe.',
      },
    ],
    cards: [
      {
        id: 'c-c-caching-1',
        moduleId: 'c-caching',
        front: 'What is the hot key problem, and why does sharding not fix it?',
        back: 'Sharding assumes even load; a viral key breaks that and saturates one node. All the traffic is for one key, so more shards changes nothing. Replicate instead — N nodes each able to serve it.',
        tag: 'Caching',
      },
      {
        id: 'c-c-caching-2',
        moduleId: 'c-caching',
        front: 'The three invalidation strategies.',
        back: 'Invalidate on write (accurate, couples writers to keys) · short TTL (simple, accepts staleness) · both, with TTL as the backstop. Pick per data type.',
        tag: 'Caching',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'c-sharding',
    trackId: 'core',
    title: 'Sharding and consistent hashing',
    station: 5,
    prereqs: ['c-caching'],
    minutes: 8,
    summary: 'The shard key is the design. Plus the ring, in one paragraph.',
    lesson: [
      {
        kind: 'prose',
        text: 'Sharding splits data across machines so no single one holds it all. Choosing the key is the entire decision — it fixes which queries are fast, which are slow, and where your hot spots will be.',
      },
      { kind: 'heading', text: 'Choosing the key' },
      {
        kind: 'table',
        head: ['Strategy', 'Distribution', 'Cost'],
        rows: [
          ['**Hash**', 'Even by construction', 'No range scans — every range query hits every shard'],
          ['**Range**', 'Uneven; hot spots likely', 'Range scans work naturally'],
          ['**Directory**', 'Whatever you want', 'A lookup hop on every request, and the directory is a dependency'],
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'State the key and the query it makes slow, in one breath: "I will shard on `userId` — everything for one user lands on one shard, at the cost of any query that spans users. Those go to the search index instead."',
      },
      { kind: 'heading', text: 'What sharding takes away' },
      {
        kind: 'list',
        items: [
          '**Cross-shard transactions** become nearly impossible. If two rows must change atomically, they had better share a shard.',
          '**Hot spots** — one celebrity, one popular product, one busy tenant can saturate a shard while others idle.',
          '**Resharding** means moving enormous volumes of data while serving traffic. Plan the key so you never have to.',
        ],
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Sharding by reflex. A well-tuned single instance handles ~50k TPS and a few terabytes. At 10k writes/sec and 100 GB you do not need it, and proposing it invites a justification you cannot give.',
      },
      { kind: 'heading', text: 'Consistent hashing, briefly' },
      {
        kind: 'prose',
        text: 'With plain `hash(key) % N`, adding one server to ten changes N and remaps roughly **90%** of your keys — a full data migration to add capacity. Place servers and keys on a ring instead and walk clockwise to find the owner, and adding a server moves only the keys in the affected arc: about **10%**.',
      },
      {
        kind: 'prose',
        text: 'Virtual nodes — each physical server placed at many ring positions — smooth out the distribution, which is otherwise lumpy with a small number of servers.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Say "we will distribute with consistent hashing" and move on. Explaining the ring unprompted burns clock you need elsewhere, and the interviewer will ask if they want it. It is behind Cassandra, DynamoDB, Redis Cluster, and most CDNs.',
      },
    ],
    quiz: [
      {
        id: 'q-c-sharding-1',
        moduleId: 'c-sharding',
        stem: 'You add one server to a 10-server cluster using plain modulo hashing. Roughly what fraction of keys move?',
        options: ['About 10%', 'About 50%', 'About 90%', 'None — modulo hashing is stable'],
        correct: 2,
        explain:
          'Changing N changes the result for almost every key. Consistent hashing moves only the arc the new server takes over — about 10% — which is the entire reason it exists.',
      },
      {
        id: 'q-c-sharding-2',
        moduleId: 'c-sharding',
        stem: 'You shard orders by hash of orderId. A report needs "all orders in March". What happens?',
        options: [
          'It is fast — hash sharding distributes evenly',
          'It hits every shard and gathers results, because hashing destroys range locality',
          'It fails; range queries are impossible when sharded',
          'It automatically uses a secondary index',
        ],
        correct: 1,
        explain:
          'Hash sharding buys even distribution by destroying ordering. Range queries become scatter-gather across every shard — which is exactly the cost you should name when you pick the key.',
      },
      {
        id: 'q-c-sharding-3',
        moduleId: 'c-sharding',
        stem: 'Which is the strongest reason to delay sharding?',
        options: [
          'It is difficult to implement',
          'A single tuned instance handles far more than most candidates assume, and sharding costs cross-shard transactions and resharding pain',
          'Modern databases do not support it well',
          'It only helps with reads, not writes',
        ],
        correct: 1,
        explain:
          'It is a real capability with a real price. You pay it when the numbers demand it, not as a default — and being able to say when that is, is the signal.',
      },
    ],
    cards: [
      {
        id: 'c-c-sharding-1',
        moduleId: 'c-sharding',
        front: 'Hash vs range vs directory sharding.',
        back: 'Hash: even, no range scans. Range: ranges work, hot spots likely. Directory: flexible, adds a lookup hop and a dependency.',
        tag: 'Sharding',
      },
      {
        id: 'c-c-sharding-2',
        moduleId: 'c-sharding',
        front: 'Why consistent hashing, in one line?',
        back: 'Modulo remaps ~90% of keys when you add a server to ten; a ring moves ~10%. Say the name, explain the ring only if asked.',
        tag: 'Sharding',
      },
      {
        id: 'c-c-sharding-3',
        moduleId: 'c-sharding',
        front: 'The three things sharding takes away.',
        back: 'Cross-shard transactions, even load (hot spots return), and easy capacity changes (resharding moves mountains of data).',
        tag: 'Sharding',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'c-cap',
    trackId: 'core',
    title: 'CAP, consistency, and PACELC',
    station: 6,
    prereqs: ['c-sharding'],
    minutes: 8,
    summary: 'The one they always probe. Pick availability, except when you must not.',
    lesson: [
      {
        kind: 'prose',
        text: 'Consistency, availability, partition tolerance — pick two. Except you do not really get a choice about partitions: networks fail, and a distributed system has to keep working when they do. So the real question is what you do **during** a partition.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Choose consistency',
          points: [
            'Refuse to serve rather than serve stale',
            'Every reader sees the latest write',
            'Some requests fail during a partition',
          ],
        },
        right: {
          title: 'Choose availability',
          points: [
            'Always answer, possibly with stale data',
            'Nodes converge once the partition heals',
            'Two readers can briefly disagree',
          ],
        },
        verdict: 'Availability is the right default. Users tolerate slightly stale data far better than a system that will not respond.',
      },
      { kind: 'heading', text: 'When you must pick consistency' },
      {
        kind: 'prose',
        text: 'Three situations, and they are narrower than people assume: **money**, **inventory**, and **booking a limited resource**. In each, serving stale data lets you sell something twice — which is a business problem, not a UX one.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'The safe answer: "Eventual consistency, unless the problem involves money, inventory, or booking limited resources." Then say which parts of *this* system are the exception.',
      },
      { kind: 'heading', text: 'It is per-path, not per-system' },
      {
        kind: 'prose',
        text: 'This is the part that separates a memorised answer from a designed one. Ticketmaster wants availability for browsing and search — a slightly stale event listing is nothing — and strong consistency for the booking write. One system, both answers, and saying so unprompted is a senior signal.',
      },
      {
        kind: 'table',
        head: ['Path', 'Choice', 'Why'],
        rows: [
          ['Search events', 'Availability', 'A second-stale listing costs nothing'],
          ['View seat map', 'Availability', 'Refreshes constantly anyway'],
          ['Reserve a seat', '**Consistency**', 'Stale here means selling one seat twice'],
          ['Feed', 'Availability', 'A minute of staleness is invisible'],
        ],
      },
      { kind: 'heading', text: 'PACELC' },
      {
        kind: 'prose',
        text: 'CAP only describes the partition case, which is rare. PACELC adds the common one: during a **P**artition choose **A** or **C**; **E**lse, choose **L**atency or **C**onsistency. Even on a healthy network, synchronous replication to a distant region costs latency — you are trading, all the time, not just during failures.',
      },
    ],
    quiz: [
      {
        id: 'q-c-cap-1',
        moduleId: 'c-cap',
        stem: 'Which requires strong consistency?',
        options: [
          'A social feed showing posts from people you follow',
          'Reserving the last seat at a concert',
          'A profile page view counter',
          'Search results for an event name',
        ],
        correct: 1,
        explain:
          'Money, inventory, and booking limited resources. Stale data there means selling the same seat twice — a business problem. The other three tolerate staleness invisibly.',
      },
      {
        id: 'q-c-cap-2',
        moduleId: 'c-cap',
        stem: 'What does PACELC add to CAP?',
        options: [
          'A third option beyond consistency and availability',
          'That partitions can be avoided with good networking',
          'That even with no partition you still trade latency against consistency',
          'A formal proof of the CAP theorem',
        ],
        correct: 2,
        explain:
          'During a Partition choose A or C; Else, choose Latency or Consistency. Synchronous replication costs latency on a perfectly healthy network — the trade never goes away.',
      },
      {
        id: 'q-c-cap-3',
        moduleId: 'c-cap',
        stem: 'An interviewer asks "is this system CP or AP?" What is the strongest answer?',
        options: [
          'AP — availability is almost always the right default',
          'CP — correctness matters more than uptime',
          'It depends on the path: AP for browsing and search, CP for the booking write',
          'CAP does not apply to systems with a single database',
        ],
        correct: 2,
        explain:
          'Treating it as one global choice is the memorised answer. Different paths in one system get different answers, and naming which is which unprompted is the senior signal.',
      },
    ],
    cards: [
      {
        id: 'c-c-cap-1',
        moduleId: 'c-cap',
        front: 'Default consistency model, and the three exceptions.',
        back: 'Eventual. Strong only for money, inventory, and booking limited resources — and only on that path, not system-wide.',
        tag: 'Consistency',
      },
      {
        id: 'c-c-cap-2',
        moduleId: 'c-cap',
        front: 'PACELC.',
        back: 'During a Partition choose Availability or Consistency; Else, choose Latency or Consistency. The trade exists even on a healthy network.',
        tag: 'Consistency',
      },
      {
        id: 'c-c-cap-3',
        moduleId: 'c-cap',
        front: 'Why is "is it CP or AP" a trick question?',
        back: 'It is per-path, not per-system. Ticketmaster is AP for search and CP for booking. Saying so unprompted is the senior signal.',
        tag: 'Consistency',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'c-queues',
    trackId: 'core',
    title: 'Queues and streams',
    station: 7,
    prereqs: ['c-cap'],
    minutes: 8,
    summary: 'What a queue buys you, why retention makes a stream different, and where not to put one.',
    lesson: [
      {
        kind: 'prose',
        text: 'A queue decouples the thing producing work from the thing doing it. That buys three specific properties, and it is worth naming which one you are after.',
      },
      {
        kind: 'list',
        items: [
          '**Buffering bursts** — a spike fills the queue instead of toppling the workers.',
          '**Distributing work** — many consumers pull from one queue, and you scale them independently.',
          '**Decoupling** — the producer returns as soon as the message is accepted, and does not care who handles it.',
        ],
      },
      {
        kind: 'callout',
        tone: 'trap',
        title: 'The one place a queue is wrong',
        text: 'Inside a synchronous path with a tight latency budget. If the user is waiting and you have 500 ms, adding a queue nearly guarantees you miss it. Queues make things *reliable*, not fast.',
      },
      { kind: 'heading', text: 'What you must name' },
      {
        kind: 'table',
        head: ['Concern', 'The answer'],
        rows: [
          ['A message fails', 'Retry with exponential backoff, capped attempts'],
          ['It keeps failing', '**Dead-letter queue** — park it, alert, do not block the queue'],
          ['Producers outpace consumers', '**Backpressure** — reject, shed, or slow the producer'],
          ['Order matters', 'Partition key — ordering is guaranteed within a partition, not globally'],
          ['A message arrives twice', '**Idempotency** — at-least-once delivery is the norm, so make the handler safe to repeat'],
        ],
      },
      {
        kind: 'prose',
        text: 'That last row is the one candidates skip. Most queues guarantee at-least-once, not exactly-once, so duplicate delivery is normal operation. Your consumer must be idempotent or you will double-charge someone.',
      },
      { kind: 'heading', text: 'Queue versus stream' },
      {
        kind: 'prose',
        text: 'The difference is **retention**. A queue message is consumed and gone. A stream keeps data for a configured window, so consumers read from any offset, re-read after a bug, and multiple independent consumer groups read the same data without competing.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Queue — SQS',
          points: [
            'Consumed and gone',
            'One logical consumer',
            'Simple: work needs doing, someone does it',
          ],
        },
        right: {
          title: 'Stream — Kafka',
          points: [
            'Retained for a window; re-readable',
            'Many independent consumer groups',
            'Replay to rebuild state or fix a bad deployment',
          ],
        },
        verdict: 'Queue for work distribution. Stream when several consumers need the same events, or when replay has value.',
      },
      {
        kind: 'prose',
        text: '**Windowing** groups stream events by time or count — tumbling windows for hourly aggregates, sliding for rolling metrics. **Event sourcing** takes it furthest: the stream of changes *is* the state, and current state is a replay.',
      },
    ],
    quiz: [
      {
        id: 'q-c-queues-1',
        moduleId: 'c-queues',
        stem: 'A checkout endpoint has a 400 ms budget. Where should a queue not go?',
        options: [
          'Between checkout and the email confirmation',
          'Between checkout and the analytics pipeline',
          'Between the user request and the payment authorisation they are waiting on',
          'Between checkout and inventory reconciliation',
        ],
        correct: 2,
        explain:
          'The user is blocked on the payment result, so it has to be synchronous. Everything else — email, analytics, reconciliation — is exactly what a queue is for.',
      },
      {
        id: 'q-c-queues-2',
        moduleId: 'c-queues',
        stem: 'What is the practical difference between a queue and a stream?',
        options: [
          'Streams are faster',
          'Retention — a stream keeps data so consumers can read from any offset and re-read',
          'Queues cannot be partitioned',
          'Streams guarantee exactly-once delivery',
        ],
        correct: 1,
        explain:
          'Retention is the whole difference. It enables replay, multiple independent consumer groups, and rebuilding state after a bad deploy.',
      },
      {
        id: 'q-c-queues-3',
        moduleId: 'c-queues',
        stem: 'Your payment worker consumes from a queue with at-least-once delivery. What must be true?',
        options: [
          'The queue must be configured for exactly-once',
          'The worker must be idempotent, so a repeated message does not charge twice',
          'The producer must deduplicate before sending',
          'Nothing — duplicates are extremely rare',
        ],
        correct: 1,
        explain:
          'At-least-once means duplicates are normal operation, not an edge case. An idempotency key on the handler is the standard answer, and forgetting it is how people get double-charged.',
      },
    ],
    cards: [
      {
        id: 'c-c-queues-1',
        moduleId: 'c-queues',
        front: 'When must you not add a queue?',
        back: 'Inside a synchronous path with a tight latency budget. Queues make things reliable, not fast — adding one to a 500 ms path nearly guarantees you break it.',
        tag: 'Queues',
      },
      {
        id: 'c-c-queues-2',
        moduleId: 'c-queues',
        front: 'Why must queue consumers be idempotent?',
        back: 'Delivery is at-least-once, so duplicates are normal operation, not an edge case. Without idempotency you double-charge, double-send, double-count.',
        tag: 'Queues',
      },
      {
        id: 'c-c-queues-3',
        moduleId: 'c-queues',
        front: 'Queue versus stream.',
        back: 'Retention. A queue message is consumed and gone; a stream keeps data so consumers read from any offset, re-read, and multiple groups read independently.',
        tag: 'Queues',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'c-search',
    trackId: 'core',
    title: 'Search and inverted indexes',
    station: 8,
    prereqs: ['c-queues'],
    minutes: 7,
    summary: 'Why LIKE is a table scan, what Elasticsearch actually does, and the lighter option.',
    lesson: [
      {
        kind: 'prose',
        text: 'Search is the most common reason to add a second datastore, and the reasoning is short enough to give in an interview in about thirty seconds.',
      },
      { kind: 'heading', text: 'Why the database cannot do it' },
      {
        kind: 'prose',
        text: '`WHERE name LIKE \'%swift%\'` cannot use an ordinary index — a leading wildcard leaves no sorted prefix to seek on, so it reads every row. It also cannot rank results, tolerate a typo, or match "running" against "run".',
      },
      { kind: 'heading', text: 'The inverted index' },
      {
        kind: 'prose',
        text: 'Instead of mapping documents to their words, map **words to the documents containing them**. Then a search is a lookup, not a scan.',
      },
      {
        kind: 'code',
        code: `{
  "taylor": [doc1, doc7, doc9],
  "swift":  [doc1, doc4],
  "tour":   [doc1, doc7]
}

query "taylor swift" -> intersect([1,7,9], [1,4]) -> doc1`,
      },
      {
        kind: 'prose',
        text: 'Three pieces make it work in practice. **Tokenisation** splits text into terms. **Stemming** reduces them to a root, so "running" and "runs" both index as "run". **Fuzzy matching** uses edit distance, so "Tayler" still finds "Taylor" — which matters more than it sounds, because a large share of real searches are misspelled.',
      },
      { kind: 'heading', text: 'Keeping it in sync' },
      {
        kind: 'flow',
        nodes: ['Postgres (source of truth)', 'CDC', 'Elasticsearch', 'Search API'],
        note: 'Roughly a second behind. Acceptable for search; never the source of truth.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Treating the search index as a database. It lags, it can be rebuilt from the primary, and it should never be the thing a booking or payment decision reads. If Elasticsearch is your only copy of the data, you have lost the data.',
      },
      { kind: 'heading', text: 'The lighter option' },
      {
        kind: 'prose',
        text: 'Postgres full-text search — `tsvector` with a **GIN** index — handles a surprising amount without a second system to operate. Slower and less capable than Elasticsearch, but there is no cluster, no CDC pipeline, and no sync bug. Naming it as the step before Elasticsearch shows you weigh operational cost, not just capability.',
      },
      {
        kind: 'ladder',
        rungs: [
          {
            grade: 'bad',
            title: '`LIKE \'%term%\'`',
            text: 'A table scan with extra steps. No ranking, no typo tolerance, no stemming.',
          },
          {
            grade: 'good',
            title: 'Postgres full-text with a GIN index',
            text: 'Real tokenisation and ranking, no new infrastructure. Right answer for a lot of products, and the honest first step.',
          },
          {
            grade: 'best',
            title: 'Elasticsearch, fed by CDC',
            text: 'Inverted index with fuzzy matching, faceting, and scale. Costs you a cluster to operate and a sync pipeline to get wrong — worth it once search is a core feature rather than a filter box.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-c-search-1',
        moduleId: 'c-search',
        stem: 'What is an inverted index?',
        options: [
          'An index sorted in descending order',
          'A mapping from words to the documents containing them',
          'A B-tree built on a text column',
          'A cache of previous search results',
        ],
        correct: 1,
        explain:
          'Inverting the natural document→words direction turns a search from a scan into a lookup, then an intersection of the resulting document lists.',
      },
      {
        id: 'q-c-search-2',
        moduleId: 'c-search',
        stem: 'A product has a search box over 50,000 rows and no dedicated search team. What is the honest first step?',
        options: [
          'Elasticsearch — it is the industry standard',
          'Postgres full-text search with a GIN index',
          'Load everything into memory and filter in the application',
          'A LIKE query with an index on the column',
        ],
        correct: 1,
        explain:
          'At that size Postgres full-text handles it with no cluster, no CDC pipeline, and no sync bugs. Naming the operational cost of Elasticsearch — rather than reaching for it reflexively — is the signal.',
      },
    ],
    cards: [
      {
        id: 'c-c-search-1',
        moduleId: 'c-search',
        front: 'What makes Elasticsearch fast, in one line?',
        back: 'An inverted index mapping words to the documents containing them, plus tokenisation, stemming, and edit-distance fuzzy matching.',
        tag: 'Search',
      },
      {
        id: 'c-c-search-2',
        moduleId: 'c-search',
        front: 'The search ladder.',
        back: 'LIKE (a table scan) → Postgres full-text with GIN (no new infrastructure) → Elasticsearch fed by CDC (a cluster to run and a pipeline to get wrong).',
        tag: 'Search',
      },
    ],
  },
]
