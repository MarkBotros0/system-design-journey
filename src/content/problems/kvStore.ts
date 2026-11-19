import type { Problem } from '../types'

export const kvStore: Problem = {
  id: 'kv-store',
  title: 'Design a distributed key-value store',
  kind: 'hld',
  category: 'infra',
  difficulty: 'hard',
  brief:
    'Build a key-value store: clients call get and put. The data is far too big for one machine, machines fail every day, and the teams using it want it to stay writable through all of that.',
  patterns: ['scaling-writes', 'scaling-reads'],
  suggests: ['c-sharding', 'c-cap', 'a-writes', 'db-engines', 'd-consistency'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Kept the interface to single-key get, put and delete, and named range scans and transactions as out of scope' },
    { id: 'r2', bar: 'must', criterion: 'Partitioned with consistent hashing rather than hash mod N, and said why' },
    { id: 'r3', bar: 'must', criterion: 'Replicated every key to N nodes and explained what R and W control' },
    { id: 'r4', bar: 'must', criterion: 'Chose availability over consistency explicitly, because the requirement is "always writable"' },
    { id: 'r5', bar: 'senior', criterion: 'Used virtual nodes and said what they fix: uneven load and slow rebuilds' },
    { id: 'r6', bar: 'senior', criterion: 'Stated what R + W > N guarantees and what it does not' },
    { id: 'r7', bar: 'senior', criterion: 'Stayed writable when home replicas are unreachable, with a sloppy quorum and hinted handoff' },
    { id: 'r8', bar: 'senior', criterion: 'Compared last-write-wins with vector clocks, including clock skew silently dropping writes' },
    { id: 'r9', bar: 'senior', criterion: 'Chose an LSM engine and explained the memtable, SSTables, Bloom filters and compaction' },
    { id: 'r10', bar: 'staff', criterion: 'Separated transient failure detection (gossip, accrual detector) from permanent membership change' },
    { id: 'r11', bar: 'staff', criterion: 'Named all three repair paths — hinted handoff, read repair, Merkle-tree anti-entropy — and the tombstone grace period' },
    { id: 'r12', bar: 'staff', criterion: 'Contrasted leaderless quorums with a consensus group per key range, and said when you would need the second' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'prose',
      text: 'You are being asked to build Amazon\'s Dynamo, or Cassandra, from the inside, so the first job is to keep the interface small. **Single-key operations only.** Every feature you let in here — range scans, secondary indexes, transactions — is a separate system design, and the interviewer wants to see you refuse them politely.',
    },
    {
      kind: 'list',
      items: [
        'Clients should be able to `put(key, value)` and `delete(key)`. Keys of a few hundred bytes; values up to about 1 [[MB]], most under 10 [[KB]].',
        'Clients should be able to `get(key)` and read back what they wrote.',
        'Clients should be able to choose, per request, between a fast answer that may be stale and a slower one that reflects the latest acknowledged write.',
        'Out of scope: range scans, secondary indexes, multi-key transactions. Cross-region replication is a follow-up.',
      ],
    },
    { kind: 'prose', text: 'Non-functional, with numbers:' },
    {
      kind: 'list',
      items: [
        '**Scale**: 100 [[TB]] of data and a million operations a second at peak.',
        '**Latency**: p99 under 10 ms for reads and writes inside one region.',
        '**Availability**: always writable. A write succeeds while any one replica — or a whole rack — is down.',
        '**Durability**: an acknowledged write is on disk on at least two machines.',
        '**Consistency**: eventual by default, tunable per request up to reading the latest acknowledged write.',
      ],
    },
    {
      kind: 'prose',
      text: 'Back of the envelope: three replicas make 300 TB on disk. Keep each node about half full, because compaction needs room to rewrite files, so at 8 TB of [[SSD]] per node that is roughly 75 nodes — call it 100 with headroom. A million operations a second, each touching three replicas, is about **30,000 replica operations per node per second**. Comfortable for an SSD-backed engine. Nothing here needs exotic hardware; it needs the right distribution.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'I\'ll build this as a leaderless, Dynamo-style store — in [[CAP]] terms an [[AP]] system that can be pushed towards consistency per request. If you need linearisable writes on a key, that is a different design, a consensus group per key range, and I\'ll contrast the two at the end.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'list',
      items: [
        '**Item** — a key, an opaque value, and its version metadata: a vector clock or a timestamp. A delete is an item too, called a **tombstone**.',
        '**Node** — one physical machine, owning many positions (tokens) on the hash ring.',
        '**Token range** — a slice of the hash space. The unit of ownership, replication and rebalancing.',
        '**Replica set** — the N distinct nodes that hold one range, in order. The Dynamo paper calls it the preference list.',
        '**Hint** — a write held by a stand-in node on behalf of a replica that was down.',
      ],
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'prose',
      text: 'In production the [[API]] is a binary protocol behind a client library; it is written as [[HTTP]] here so it reads easily. Note the `context`: a read returns the version it saw, and the next write passes it back. That is how the store knows which version a write supersedes, and which it is merely concurrent with.',
    },
    {
      kind: 'code',
      code: `PUT    /kv/{key}?w=2      body: <bytes>
       X-Context: <from the last get>   -> 200 { context }

GET    /kv/{key}?r=2
       -> 200 { values: [<bytes>, …], context }
          // more than one value = concurrent siblings

DELETE /kv/{key}?w=2
       X-Context: <from the last get>   -> 200
          // writes a tombstone; nothing is erased yet`,
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'A leaderless store: any node coordinates a request, and three replicas hold each key.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Client library', sub: 'knows the ring, hashes the key', to: 'request' },
          { label: 'Coordinator', sub: 'any node — there is no leader', tone: 'line', to: 'N = 3, in parallel' },
          { label: 'Replicas', sub: 'next 3 distinct nodes on the ring', to: 'on each node' },
          { label: 'Storage engine', sub: 'commit log · memtable · SSTables', tone: 'mastered' },
        ],
        note: 'Every node runs the same code, learns the ring by gossip, and can coordinate any request. There is no master to lose.',
      },
    },
    {
      kind: 'prose',
      text: '**`put`**. The coordinator hashes the key onto the ring, walks clockwise to the first three distinct nodes, and sends the write to all three at once. It answers the client as soon as **W** of them acknowledge — not all three — so one slow disk does not set your latency.',
    },
    {
      kind: 'prose',
      text: '**`get`**. The coordinator asks the replicas, waits for **R** answers, and compares versions. If one version supersedes the others, it returns that one; if they are concurrent, it returns all of them as siblings. Any replica that answered with an old version is repaired on the spot.',
    },
    {
      kind: 'prose',
      text: '**`delete`** is a `put` of a tombstone. It cannot simply erase the key: a replica that missed the delete would later hand the old value back as if it were current.',
    },
    {
      kind: 'prose',
      text: 'The bottlenecks to name before the interviewer does: **rebalancing** when nodes join or leave, staying writable when **replicas die**, **conflicting writes** with no leader to order them, and the **disk** under a write-heavy load. Each one is a deep dive.',
    },

    { kind: 'heading', text: 'Deep dive 1 — partitioning with consistent hashing' },
    {
      kind: 'prose',
      text: 'The job: map a key to a node so that adding or losing a node moves as little data as possible, while the cluster keeps serving.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: '`hash(key) mod N`',
          text: 'Even and simple, and catastrophic on resize. Going from 10 nodes to 11 changes the answer for about ten keys in every eleven — over 90% of the data moves at once.',
        },
        {
          grade: 'good',
          title: 'A hash ring, one token per node',
          text: 'Nodes and keys hash onto the same circle; a key belongs to the first node clockwise. Adding a node moves only the keys in its new arc, about 1/N of the data. But arcs are random sizes, so load is uneven, and a joining node streams everything from a single neighbour.',
        },
        {
          grade: 'great',
          title: 'Virtual nodes',
          text: 'Each physical node owns many small tokens scattered round the ring — Cassandra defaults to 16 per node today, and used 256 before version 4.0. Load evens out, a joining node pulls small slices from many peers in parallel, and a bigger machine simply gets more tokens.',
        },
        {
          grade: 'best',
          title: 'Virtual nodes with zone-aware replica placement',
          text: 'When walking clockwise for replicas, skip tokens that belong to a physical node — or an availability zone — already chosen. Otherwise two of a key\'s three replicas can land on one machine, and a single failure takes out a quorum.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'What happens when a fifth node joins, with and without virtual nodes.',
      figure: {
        kind: 'split',
        left: {
          title: 'One token per node',
          tone: 'streak',
          nodes: [
            { label: 'Node E joins', to: 'takes half an arc' },
            { label: 'One neighbour streams it all', sub: 'one disk, one network link', tone: 'streak' },
          ],
          cost: 'Rebuilds are slow, and the arcs stay uneven.',
        },
        right: {
          title: 'Many virtual nodes',
          tone: 'mastered',
          nodes: [
            { label: 'Node E joins', to: 'takes many small slices' },
            { label: 'Every node streams a little', sub: 'in parallel', tone: 'mastered' },
          ],
          cost: 'Load is even, and joining or rebuilding is spread across the cluster.',
        },
        verdict: 'Same ring, same hash. Splitting each machine into many tokens is what makes it operable.',
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Saying consistent hashing solves hot keys. It spreads *keys*; it does nothing for one key that takes a hundred thousand reads a second. That key lives on three machines whatever the ring looks like — the fix is a cache in front of it, or deliberately replicating that one key more widely.',
    },

    { kind: 'heading', text: 'Deep dive 2 — replication, quorums and staying writable' },
    {
      kind: 'prose',
      text: 'Every key lives on **N** replicas. A write waits for **W** acknowledgements, a read for **R** answers. With **R + W > N**, every read set overlaps every write set in at least one replica, so a read always reaches a copy of the latest acknowledged write. N = 3, R = 2, W = 2 is the common choice: it survives one replica down on both paths, and latency is set by the second-fastest replica rather than the slowest.',
    },
    {
      kind: 'table',
      head: ['N, R, W', 'You get', 'You pay'],
      rows: [
        ['3, 1, 1', 'The fastest reads and writes', 'Stale reads; an acknowledged write sits on one disk until it spreads'],
        ['3, 2, 2', 'Reads overlap the latest write; one replica can be down', 'The second-fastest replica, on every request'],
        ['3, 1, 3', 'Fast, current reads', 'One dead replica blocks every write'],
        ['3, 3, 1', 'Fast writes', 'Every read waits for the slowest replica, and one dead replica blocks every read'],
      ],
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Write one replica, copy the rest in the background',
          text: 'W = 1 with asynchronous fan-out. Fast until the node that took the write dies before copying it: the client was told "saved", and the data is gone.',
        },
        {
          grade: 'good',
          title: 'Write every replica synchronously',
          text: 'W = N. Durable and consistent, but availability is now the product of three machines: one slow or dead replica blocks every write to its ranges.',
        },
        {
          grade: 'great',
          title: 'Strict quorums',
          text: 'R = W = 2 of 3. One replica can be down or slow on either path. But if two of a key\'s three home replicas are unreachable, writes to that key fail — which breaks "always writable".',
        },
        {
          grade: 'best',
          title: 'Sloppy quorum with hinted handoff',
          text: 'When a home replica is unreachable, write to the next healthy node on the ring instead, tagged with a hint naming the real owner. The write counts towards W, and the stand-in replays it when the owner returns. Writable through almost anything, at the price of weakening the overlap guarantee until the hint is delivered.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'Replica C is down, so node D takes its copy with a hint, and hands it back when C returns.',
      figure: {
        kind: 'sequence',
        actors: ['Coordinator', 'Replica A', 'Replica B', 'Replica C', 'Node D'],
        steps: [
          { from: 3, to: 3, label: 'down — known by gossip', tone: 'alert' },
          { from: 0, to: 1, label: 'put v2' },
          { from: 0, to: 2, label: 'put v2' },
          { from: 0, to: 4, label: 'put v2, hint: for C', tone: 'streak' },
          { from: 1, to: 0, label: 'ack', dashed: true },
          { from: 4, to: 0, label: 'ack', dashed: true },
          { from: 0, to: 0, label: 'W = 2 met — client told ok', tone: 'mastered' },
          { from: 3, to: 3, label: 'back up' },
          { from: 4, to: 3, label: 'replay v2', tone: 'mastered' },
          { from: 4, to: 4, label: 'drop the hint' },
        ],
        note: 'Three copies exist the whole time, and the write never waited for the dead machine.',
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Claiming R + W > N makes the store strongly consistent. It does not. A sloppy quorum writes to nodes a later read may never ask; a write that reached one replica and then failed is visible to some reads and not others; and two concurrent writers both succeed. Quorums make fresh reads very likely. They do not make the store linearisable.',
    },
    {
      kind: 'prose',
      text: 'The pick: **N = 3, R = W = 2 by default, sloppy so it stays writable**, with R and W overridable per request — R = 1 for a cache-like table, W = 3 for something you cannot afford to lose. A caller who asked for the latest write gets a strict mode that counts only home replicas, as Riak\'s `pr` and `pw` options do, because a sloppy quorum cannot promise that read. The trade-off belongs to the caller, so make it the caller\'s, explicitly.',
    },

    { kind: 'heading', text: 'Deep dive 3 — conflicting writes' },
    {
      kind: 'prose',
      text: 'Without a leader, two clients can write the same key at the same moment through different coordinators, and both succeed. Some replica ends up holding both versions. Something has to decide which survives — or whether both do.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Last write wins ([[LWW]])',
        points: [
          'Every write carries a timestamp; on conflict, the highest wins',
          'One value per key and nothing for the client to merge — Cassandra does this per column',
          'Concurrent writes are silently discarded',
          'Clocks drift, so a write that happened later can lose to one stamped by a fast clock',
        ],
      },
      right: {
        title: 'Vector clocks',
        points: [
          'Every version carries a counter per coordinating node, like `{A:2, B:1}`',
          'If one clock is at least as far ahead on every counter, and the two differ, the older version is safely discarded',
          'If neither is, both are kept as siblings and returned on the next read for the client to merge — the Dynamo paper\'s shopping cart',
          'Clients must handle siblings, and clocks must be pruned as they grow',
        ],
      },
      verdict: 'Choose per table, not per system. LWW for values replaced whole, where losing a racing write is harmless — sessions, profiles, cache entries. Vector clocks, or a [[CRDT]] that merges itself, where concurrent updates must both survive — carts, counters, sets.',
    },
    {
      kind: 'code',
      caption: 'Comparing two versions of the same key.',
      code: `v1 = {A:2}            v2 = {A:1, B:1}

A: 2 > 1   but   B: 0 < 1      -> neither dominates
-> keep both; the next get returns [v1, v2] with
   context {A:2, B:1}; the client merges and puts`,
    },
    {
      kind: 'figure',
      caption: 'With last-write-wins, a fast clock lets the earlier write beat the later one.',
      figure: {
        kind: 'timeline',
        ticks: ['0 ms', '50 ms', '100 ms'],
        lanes: [
          {
            label: 'Write 1, via a node whose clock is 80 ms fast',
            bars: [{ from: 0, to: 1, label: 'stamped 80 ms', tone: 'streak' }],
            outcome: { label: 'kept', tone: 'streak' },
          },
          {
            label: 'Write 2, 50 ms later, via an accurate clock',
            bars: [{ from: 0.5, to: 1, label: 'stamped 50 ms', tone: 'alert' }],
            outcome: { label: 'silently lost', tone: 'alert' },
          },
        ],
        note: 'Each bar starts at the real moment of its write. Last-write-wins compares the stamps, not reality, and raises no error.',
      },
    },

    { kind: 'heading', text: 'Deep dive 4 — failure detection and repair' },
    {
      kind: 'prose',
      text: 'There are two kinds of failure, and treating them alike is expensive. A node **down for a minute** — a restart, a long pause, a flaky switch — should be routed around and caught up afterwards. A node **gone for good** should have its ranges re-replicated. Rebalancing on every blip causes a storm of data movement, so permanent membership changes are explicit operator actions, and detection only decides where requests are routed.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Every node heartbeats every other node',
          text: 'At 100 nodes that is about 10,000 messages per interval, and one dropped heartbeat marks a healthy node dead. It neither scales nor stays calm.',
        },
        {
          grade: 'good',
          title: 'A central membership service',
          text: 'One place — often ZooKeeper — holds who is alive. It works, but it is a dependency that can cut you off from your own cluster, in a design whose whole point is that no node is special.',
        },
        {
          grade: 'great',
          title: 'Gossip',
          text: 'Every second, each node swaps its membership table — a heartbeat counter per node — with a random peer. News reaches every node in O(log n) rounds, with constant load per node and no central point.',
        },
        {
          grade: 'best',
          title: 'Gossip plus an accrual failure detector',
          text: 'Instead of a fixed timeout, each node learns how heartbeats from each peer normally arrive and computes a suspicion level, φ. Past a threshold it stops routing to that peer. It adapts to a slow network instead of flapping, and it is what Cassandra runs.',
        },
      ],
    },
    {
      kind: 'prose',
      text: 'Detection only stops you sending to a dead node. Bringing replicas back into step takes three repair mechanisms working at three speeds. Name all of them:',
    },
    {
      kind: 'table',
      head: ['Mechanism', 'When it runs', 'What it fixes'],
      rows: [
        ['Hinted handoff', 'Seconds to hours, when the owner returns', 'Writes the node missed while it was down'],
        ['Read repair', 'On the read path', 'Stale replicas of keys that are actually read'],
        ['Anti-entropy', 'In the background, on a schedule', 'Everything else: replicas compare Merkle trees of hashes per range and stream only the ranges that differ'],
      ],
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Amazon\'s 2007 Dynamo paper assembled this whole toolkit — consistent hashing with virtual nodes, sloppy quorums, hinted handoff, vector clocks, Merkle-tree anti-entropy and gossip membership. Riak and Voldemort followed it closely; Cassandra borrowed its ring, gossip and repair. Citing it tells the interviewer you know where the ideas come from.',
    },

    { kind: 'heading', text: 'Deep dive 5 — the storage engine on each node' },
    {
      kind: 'prose',
      text: 'Each replica still has to put bytes on a disk, under a write-heavy load, at a p99 in single-digit milliseconds. The engine decides whether that disk is doing sequential appends or random writes.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Update values in place in one big file',
          text: 'Every write is a random seek, a crash mid-write corrupts the value, and a value that grows has to move.',
        },
        {
          grade: 'good',
          title: 'A B-tree',
          text: 'What InnoDB\'s tables and Postgres\'s indexes use. Reads are a predictable few page lookups, but every small write rewrites at least one whole page at a random place on disk. Excellent for read-heavy work; it fights you when writes dominate.',
        },
        {
          grade: 'great',
          title: 'A log-structured merge tree ([[LSM]])',
          text: 'Append the write to a commit log — a [[WAL]] — insert it into a sorted in-memory memtable, and acknowledge. When the memtable fills, flush it as an immutable sorted file, an SSTable. Writes are always sequential. Reads check the memtable, then the files newest first, with a Bloom filter per file to skip the ones that cannot hold the key.',
        },
        {
          grade: 'best',
          title: 'An LSM tree with compaction chosen per workload',
          text: 'Compaction merges files and drops overwritten values and expired tombstones. Size-tiered compaction keeps write cost low but can briefly need twice the space; leveled compaction keeps reads to about one file per level at the price of rewriting data more often. RocksDB defaults to leveled; Cassandra lets you choose per table.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'The write path of an LSM engine. Nothing is ever overwritten in place.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'put', to: 'append + fsync' },
          { label: 'Commit log', sub: 'sequential, survives a crash', to: 'insert' },
          { label: 'Memtable', sub: 'sorted, in memory', tone: 'line', to: 'flush when full' },
          { label: 'SSTables', sub: 'immutable sorted files', to: 'merge' },
          { label: 'Compaction', sub: 'drops old versions', tone: 'mastered' },
        ],
        note: 'The client is acknowledged once the memtable has the write. Everything after that happens in the background.',
      },
    },
    {
      kind: 'prose',
      text: 'The pick is the LSM tree, because the requirement is "always writable" under heavy writes, and an LSM write is a sequential append that never reads the old value first. Cassandra, ScyllaDB, HBase and RocksDB are all built on one. Pay for it knowingly: compaction competes with live traffic for the disk, so throttle it, and leave it the free space it needs.',
    },
  ],
  followups: [
    {
      q: 'One key suddenly takes 100,000 reads a second. What do you do?',
      a: 'Consistent hashing cannot help — that key lives on three replicas whatever the ring looks like. Read it with R = 1 so all three share the load, put a short-lived cache in the client library or a proxy in front, and if it is still too hot, replicate that one key to more nodes than N. Find hot keys by sampling at the coordinators, because by the time one replica\'s graphs show it you are already in trouble.',
    },
    {
      q: 'A user deletes a key, and a week later it comes back. What happened?',
      a: 'A tombstone was purged before every replica had seen it. One replica missed the delete; the others compacted their tombstone away after its grace period; then anti-entropy found the old value on the straggler, saw nothing contradicting it, and copied it back. The rule: tombstones must outlive your repair interval — Cassandra\'s `gc_grace_seconds` defaults to ten days for exactly this reason — and repair must actually run inside that window.',
    },
    {
      q: 'A team needs compare-and-set on a key. Can this design do it?',
      a: 'Not safely: two coordinators can both see the old value and both succeed, and quorums cannot order them. Either bolt consensus onto that operation, as Cassandra\'s lightweight transactions do with Paxos at the cost of several round trips, or use a different architecture — a Raft group per key range whose leader serialises writes, as TiKV and CockroachDB do. That buys linearisable writes and costs you an election, and a few seconds of unavailability for that range, whenever a leader dies.',
    },
    {
      q: 'How do you add ten nodes to a busy cluster without hurting latency?',
      a: 'Add them one at a time, with token allocation that spreads their ranges evenly. A joining node accepts writes for its new ranges immediately, so nothing is missed while it streams, but serves reads only once streaming finishes. Throttle streaming and compaction so they cannot starve live traffic, then clean up the old owners to reclaim the space.',
    },
    {
      q: 'Now make it multi-region.',
      a: 'Run a full replica set in each region and keep quorums local — Cassandra\'s `LOCAL_QUORUM` — so a request never waits on an ocean. Replicate between regions asynchronously, which makes cross-region conflicts normal and your conflict rule matter more: DynamoDB global tables, by default, resolve them with last-writer-wins. Say plainly that a write in one region can be invisible in another for a second or more.',
    },
  ],
}
