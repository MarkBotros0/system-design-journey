import type { Module } from '../types'

/**
 * Track — Databases in depth (DB), part 2: stations 6–9.
 * trackId: 'databases'. Authoring rules: docs/superpowers/plans/2026-11-18-content-brief.md
 */
export const databases2Modules: Module[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'db-locking',
    trackId: 'databases',
    title: 'Locking, optimistic concurrency and MVCC',
    station: 6,
    prereqs: ['db-engines'],
    related: ['f-db', 'a-contention'],
    minutes: 15,
    summary: 'Row locks, version columns, snapshots, deadlocks and advisory locks, and which one each write path needs.',
    objectives: [
      'Choose between one atomic `UPDATE`, `SELECT … FOR UPDATE` and a version column, given how contended the path is',
      'Explain how [[MVCC]] lets readers and writers pass each other, and what vacuum is cleaning up behind them',
      'Describe how a database detects a deadlock, and the two habits that prevent nearly all of them',
      'Know when an advisory lock beats a row lock or a Redis lock',
    ],
    keywords: [
      'pessimistic locking',
      'optimistic locking',
      'select for update',
      'version column',
      'compare-and-set',
      'MVCC',
      'deadlock',
      'advisory lock',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Every design with money, stock or seats reaches the same question: two requests change the same row at the same moment, so what happens? "We use transactions" is not an answer. A transaction says what is atomic. It does not say who waits, who retries, or whose write silently disappears.',
      },
      {
        kind: 'prose',
        text: 'There are three tools: make the rival wait, let both run and reject the loser, or keep several versions of each row so reads never collide with writes. A fourth beats all three whenever the change fits in one statement. Senior candidates pick per write path and say what each choice costs.',
      },
      {
        kind: 'figure',
        caption: 'The lost update: two read-modify-write cycles interleave and the first write vanishes.',
        figure: {
          kind: 'sequence',
          actors: ['Request A', 'accounts row 42', 'Request B'],
          steps: [
            { from: 0, to: 1, label: 'read balance: 100' },
            { from: 2, to: 1, label: 'read balance: 100' },
            { from: 0, to: 1, label: 'write 100 − 30 = 70' },
            { from: 2, to: 1, label: 'write 100 − 50 = 50', tone: 'alert' },
            { from: 1, to: 1, label: 'balance 50: the 30 withdrawal is gone', tone: 'alert' },
          ],
          note: 'No error anywhere. Both requests succeeded, and the bank is 30 short.',
        },
      },
      { kind: 'heading', text: 'Start with one atomic statement' },
      {
        kind: 'prose',
        text: 'Most read-modify-write cycles do not need the read. `UPDATE stock SET qty = qty - 1 WHERE sku = $1 AND qty > 0` checks and decrements in one statement. The database holds the row lock for the microseconds the statement runs, and the row count tells you who won: **1** means sold, **0** means sold out.',
      },
      {
        kind: 'prose',
        text: 'Reach for this first. There is no retry loop and no lock held across application code. It is correct under the default isolation level of both Postgres and MySQL, because an `UPDATE` always re-checks its `WHERE` against the latest committed row. It stops working only when the decision needs logic the database cannot express in a `WHERE` clause: a fraud check, a call to a payment provider, a human.',
      },
      { kind: 'heading', text: 'Pessimistic locks: make rivals wait' },
      {
        kind: 'prose',
        text: 'When you must read, decide, then write, `SELECT … FOR UPDATE` takes the row lock at read time. Any other transaction that tries to update, delete or lock that row queues until you commit or roll back. Plain reads do not queue; the section on versions explains why.',
      },
      {
        kind: 'list',
        items: [
          '`FOR UPDATE NOWAIT` fails at once instead of queueing. Use it when an error beats a wait, such as a user double-clicking "claim".',
          '`FOR UPDATE SKIP LOCKED` passes over rows someone else holds. It turns a table into a work queue: each worker claims the next free job without blocking the rest.',
          '`FOR SHARE` lets many transactions hold a row against writers. Foreign-key checks use a variant of it so a parent cannot be deleted while you insert its child.',
        ],
      },
      {
        kind: 'prose',
        text: '**Row locks are not equal across engines.** Postgres records a row lock in the row itself, so locking a million rows costs page writes but no lock memory, and it never escalates. [[SQL]] Server does escalate: once one statement holds about 5,000 locks on a table, it may swap them for a single table lock, and suddenly unrelated rows block. MySQL\'s InnoDB, at its default isolation level, locks every index record it **scans**, not only the rows it changes. An `UPDATE` filtered on an unindexed column scans the table, so it locks the table.',
      },
      {
        kind: 'prose',
        text: 'Application code rarely takes table locks on purpose. Schema changes take them for you. Most `ALTER TABLE` forms in Postgres need an `ACCESS EXCLUSIVE` lock, which is quick to hold but dangerous to **wait** for: the migration queues behind one long report, and every query that arrives afterwards queues behind the migration. A two-second report becomes a site-wide stall. Set `lock_timeout` on migrations so they give up and retry rather than hold the line.',
      },
      { kind: 'heading', text: 'Optimistic concurrency: reject the loser' },
      {
        kind: 'prose',
        text: 'Optimistic concurrency ([[OCC]]) takes no lock while you think. Read the row with its `version`, do the work, then make the write conditional on the version being unchanged. The first writer wins. Everyone else updates zero rows and must re-read and retry, or tell the user.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Pessimistic: lock at read',
          code: `await db.tx(async (t) => {
  const acct = await t.one(
    'SELECT balance FROM accounts WHERE id = $1 FOR UPDATE',
    [id],
  )
  if (acct.balance < amount) throw new Insufficient()
  await t.none(
    'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
    [amount, id],
  )
}) // the lock is held from the SELECT until here`,
        },
        after: {
          title: 'Optimistic: check at write',
          code: `for (let attempt = 0; attempt < 3; attempt++) {
  const acct = await db.one(
    'SELECT balance, version FROM accounts WHERE id = $1',
    [id],
  )
  if (acct.balance < amount) throw new Insufficient()
  const res = await db.result(
    \`UPDATE accounts SET balance = $1, version = version + 1
      WHERE id = $2 AND version = $3\`,
    [acct.balance - amount, id, acct.version],
  )
  if (res.rowCount === 1) return // we won
}
throw new Conflict() // lost three times in a row`,
        },
        note: 'The same rule enforced two ways. The left makes rivals wait; the right lets them run and makes the loser redo its work.',
      },
      {
        kind: 'prose',
        text: 'Why a version number and not the old value? `WHERE balance = 100` is safe only while the new balance depends on nothing but the old one. Your decision usually rests on more — the account was active, the daily limit was not reached — and those can change while the balance happens to read 100 again. A version that bumps on every write catches any change to the row, not just the column you remembered to check.',
      },
      {
        kind: 'prose',
        text: 'The idea runs far beyond relational tables. DynamoDB has `ConditionExpression`. [[HTTP]] has `If-Match` with an ETag, answered by `412 Precondition Failed`. Redis has `WATCH`, which aborts a transaction if a watched key moved.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Kubernetes resourceVersion',
        text: 'Every Kubernetes object carries a `resourceVersion`. A controller reads a Deployment, edits it and sends it back. If anything changed in between, the [[API]] server rejects the write with `409 Conflict`, and the controller re-reads and tries again. Thousands of controllers mutate one shared cluster state with no locks at all, because conflicts on any single object are rare.',
      },
      {
        kind: 'figure',
        caption: 'Pessimistic and optimistic concurrency, and what each costs as contention rises.',
        figure: {
          kind: 'split',
          left: {
            title: 'Pessimistic',
            tone: 'line',
            nodes: [
              { label: 'Lock at read', sub: '`FOR UPDATE`', to: 'rivals queue' },
              { label: 'Decide', to: 'write' },
              { label: 'Commit', sub: 'lock released', tone: 'line' },
            ],
            cost: 'Waiting grows with contention and with how long you hold the lock.',
          },
          right: {
            title: 'Optimistic',
            tone: 'mastered',
            nodes: [
              { label: 'Read with version', to: 'no lock' },
              { label: 'Decide', to: 'write' },
              { label: 'Write if unchanged', sub: '0 rows means retry', tone: 'mastered' },
            ],
            cost: 'Free when conflicts are rare. Wasted work and retry storms when they are not.',
          },
          verdict: 'Contention decides. Rare conflicts favour optimistic; a hot row favours a short pessimistic lock, or better, one atomic statement.',
        },
      },
      { kind: 'heading', text: '[[MVCC]]: versions instead of read locks' },
      {
        kind: 'prose',
        text: 'If every read took a lock, one long report would freeze every write it touched. Multi-version concurrency control avoids that by never overwriting in place. An `UPDATE` writes a **new version** of the row and marks the old one superseded. Each transaction reads from a **snapshot**, the set of versions committed when the snapshot was taken, and ignores anything newer.',
      },
      {
        kind: 'prose',
        text: 'In Postgres each row version carries two transaction ids: `xmin`, the transaction that created it, and `xmax`, the one that replaced or deleted it. You see a version if its creator committed before your snapshot and its replacer did not. That one rule gives the property everything relies on: **readers never block writers, and writers never block readers**. Writers still block writers on the same row. Versions remove read-write waiting, not write-write conflicts.',
      },
      {
        kind: 'figure',
        caption: 'One logical row, three physical versions. Each snapshot sees exactly one of them.',
        figure: {
          kind: 'stack',
          layers: [
            { label: 'v3 · balance 40', sub: 'xmin 812 · live: new snapshots read this', tone: 'mastered' },
            { label: 'v2 · balance 70', sub: 'xmin 790 · xmax 812: a report that began before 812 still reads this', tone: 'line' },
            { label: 'v1 · balance 100', sub: 'xmin 640 · xmax 790: no open snapshot can see it', tone: 'alert' },
          ],
          note: 'Vacuum can reclaim v1 now, and v2 once the last snapshot older than transaction 812 ends.',
        },
      },
      {
        kind: 'prose',
        text: 'The bill arrives later. Every update leaves a dead version, and something must reclaim it: `VACUUM` in Postgres, usually run by autovacuum; a purge thread trimming the undo log in InnoDB. Cleanup can only discard versions **no open snapshot might still need**, so one transaction left open for six hours pins every version created since it began. Tables bloat, indexes bloat, queries slow, and the cause is a forgotten `BEGIN` in someone\'s console.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Sentry, 2015',
        text: 'Postgres transaction ids are 32-bit, so vacuum must also **freeze** old rows before the counter wraps, at about two billion transactions. If it falls behind, Postgres stops accepting writes to protect your data. That is what happened to Sentry in 2015: a high write rate consumed transaction ids faster than vacuum could freeze, and the primary refused writes for hours while a manual vacuum ran. Their published lesson: watch transaction-id age the way you watch free disk.',
      },
      { kind: 'heading', text: 'Deadlocks and advisory locks' },
      {
        kind: 'prose',
        text: 'A deadlock is two transactions, each holding a lock the other needs. Waiting never resolves it. Databases do not prevent deadlocks; they **detect** them, by keeping a wait-for graph, an edge from each waiting transaction to the one it waits on, and looking for a cycle. Postgres checks once a transaction has waited `deadlock_timeout`, one second by default. InnoDB checks on every lock wait and rolls back whichever transaction has changed fewer rows.',
      },
      {
        kind: 'figure',
        caption: 'Two transfers lock the same two rows in opposite orders. The detector finds the cycle and kills one.',
        figure: {
          kind: 'sequence',
          actors: ['Transfer 42 → 17', 'Database', 'Transfer 17 → 42'],
          steps: [
            { from: 0, to: 1, label: 'lock row 42: granted' },
            { from: 2, to: 1, label: 'lock row 17: granted' },
            { from: 0, to: 1, label: 'lock row 17: waits', tone: 'streak' },
            { from: 2, to: 1, label: 'lock row 42: waits', tone: 'streak' },
            { from: 1, to: 1, label: 'cycle in the wait-for graph' },
            { from: 1, to: 2, label: 'aborted: deadlock detected', tone: 'alert', dashed: true },
            { from: 1, to: 0, label: 'row 17 granted', tone: 'mastered', dashed: true },
          ],
        },
      },
      {
        kind: 'list',
        items: [
          '**Lock in one global order.** A transfer between 42 and 17 locks 17 first, whichever way the money moves. A cycle needs two orders; one order makes it impossible.',
          '**Keep transactions short.** No network calls, no user input, nothing slow between the first lock and the commit. A shorter hold is a smaller window for a cycle.',
          '**Retry the victim.** The loser gets an error, so the caller must rerun the whole transaction. Postgres reports it as `40P01`, alongside `40001` for serialisation failures; treat both as "try again".',
        ],
      },
      {
        kind: 'prose',
        text: '**Advisory locks** lock a number you choose rather than a row. `pg_advisory_xact_lock(key)` blocks until nobody else holds that number and releases it at commit. The database enforces nothing about what the number means; it is a mutex your code agrees to honour. Use one when the thing you are protecting is not a row: one instance runs the nightly billing job, one migration runs at a time (Rails wraps its migrations in exactly this), one worker rebuilds a given customer\'s search index.',
      },
      {
        kind: 'prose',
        text: 'Their edge over a Redis lock is that they die with the connection. If the process crashes, the session ends and the lock is released, with no [[TTL]] to tune. Their limit is scope: they coordinate users of one database, not services that share nothing.',
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'Behind a connection pooler',
        text: 'Session-level advisory locks (`pg_advisory_lock`) belong to the server connection, not to your request. Behind PgBouncer in transaction-pooling mode your next statement may run on a different connection, so the unlock misses and the lock sits on a connection someone else now uses. Behind a pooler, use the transaction-scoped `_xact_` variants.',
      },
      { kind: 'heading', text: 'Which one, when' },
      {
        kind: 'figure',
        caption: 'Pick per write path, starting from the cheapest tool that is correct.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Can the whole change be one conditional `UPDATE`?',
            yes: { answer: 'Atomic `UPDATE … WHERE`', sub: 'no lock to manage, no retry loop', tone: 'mastered' },
            no: {
              question: 'Does the work span user think time or a network call?',
              yes: { answer: 'Optimistic: a version column', sub: 'never hold a lock while something slow happens', tone: 'line' },
              no: {
                question: 'Do many writers hit the same rows at once?',
                yes: { answer: 'Pessimistic: a short `FOR UPDATE`', sub: 'queueing beats a retry storm', tone: 'line' },
                no: { answer: 'Optimistic: a version column', sub: 'conflicts are rare, so retries are cheap', tone: 'line' },
              },
            },
          },
        },
      },
      {
        kind: 'table',
        head: ['Tool', 'Waits', 'Fails how', 'Use for'],
        rows: [
          ['**Atomic `UPDATE`**', 'Microseconds', '0 rows: the condition was false', 'Counters, stock, balances'],
          ['**`FOR UPDATE`**', 'Until commit', 'Lock timeout or deadlock', 'Hot rows, short read-decide-write'],
          ['**Version column**', 'Never', '0 rows: conflict, so retry', 'Rare conflicts, long think time'],
          ['**Advisory lock**', 'Until release', 'Blocks, or the try variant returns false', 'Singleton jobs, non-row critical sections'],
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: '"Stock is one atomic `UPDATE` with `qty > 0` in the `WHERE`. Profile edits carry a version column, because two people editing one profile is rare. The seat hold is the hot path, so it takes a short `FOR UPDATE` and never holds it across the payment call."',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Saying "we\'ll use optimistic locking" for a hot row. Optimistic concurrency does not remove waiting; it turns waiting into wasted work. Fifty writers on one flash-sale row means forty-nine failed writes and forty-nine retries, and the retries collide again. Under high contention a short pessimistic lock, or one atomic statement, is cheaper.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Why not run everything at `SERIALIZABLE` and skip all this?',
            a: 'In Postgres that is defensible: serializable isolation detects dangerous read-write patterns and aborts one transaction with `40001`. You still need a retry loop, aborts climb with contention, and every transaction pays for the tracking. Most teams run read committed and lock or version the few paths that need it, which keeps the cost where the risk is.',
          },
          {
            q: 'How would you build a job queue on Postgres?',
            a: 'A `jobs` table, and workers that claim the next job with `FOR UPDATE SKIP LOCKED LIMIT 1` in a short transaction, so they never block each other. Mark it running with a deadline, commit, do the work, mark it done; a running job past its deadline is reclaimed. Oban and Rails\' Solid Queue work this way. At very high rates the dead versions from constant updates make vacuum the bottleneck, and a dedicated broker earns its keep.',
          },
          {
            q: 'A long analytics query runs on the primary every night and the app is slow by morning. Why?',
            a: 'Its snapshot pins every row version created while it runs, so vacuum cannot reclaim them. Hot tables bloat and every index scan wades through dead versions. Move the report to a replica, with `hot_standby_feedback` off or the replica holds back the primary\'s vacuum anyway, or to an analytics store, and alert on the age of the oldest open transaction.',
          },
          {
            q: 'Optimistic or pessimistic for a wiki page many people edit?',
            a: 'Optimistic. An edit takes minutes of think time, so a lock would block everyone else for minutes and leak when someone closes the tab. Store a version with the page, send it back on save, and on conflict show the difference and let the person merge, which is what MediaWiki\'s edit-conflict screen does.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-db-locking-1',
        moduleId: 'db-locking',
        stem: 'A flash-sale endpoint decrements stock for one product. Which implementation is correct and cheapest under heavy contention?',
        options: [
          'Read the stock, check it in application code, then write the new value',
          'Read with a version column and retry on conflict',
          '`UPDATE stock SET qty = qty - 1 WHERE sku = $1 AND qty > 0`, then check the row count',
          'Run the read and the write inside a `SERIALIZABLE` transaction',
        ],
        correct: 2,
        explain:
          'One statement reads and writes atomically, holds the row lock for microseconds, and the row count says whether you won. Optimistic retries collide endlessly on a single hot row, and serializable still needs a retry loop. Reading then writing in application code is the lost update itself.',
      },
      {
        id: 'q-db-locking-2',
        moduleId: 'db-locking',
        stem: 'Under [[MVCC]], what does a long-running read-only transaction cost?',
        options: [
          'Nothing: readers never block writers, so it is free',
          'It blocks writers on every row it has read',
          'It holds a table lock until it finishes',
          'It stops vacuum reclaiming row versions created since it began, so tables and indexes bloat',
        ],
        correct: 3,
        explain:
          'Readers do not block writers, which is what makes the first option tempting. But cleanup can only discard versions that no open snapshot might need, so a six-hour transaction pins six hours of dead versions. Alert on the oldest open transaction.',
      },
      {
        id: 'q-db-locking-3',
        moduleId: 'db-locking',
        stem: 'Two transfers keep deadlocking: one moves money from account 42 to 17, the other from 17 to 42. What prevents it?',
        options: [
          'Raise `deadlock_timeout` so the detector waits longer before acting',
          'Always lock the lower account id first, whichever way the money moves',
          'Switch both to optimistic concurrency with version columns',
          'Run both transfers at a stricter isolation level',
        ],
        correct: 1,
        explain:
          'A cycle needs two transactions taking locks in opposite orders, so one global order makes it impossible. A longer timeout only delays detection. Version columns do not help: the conditional `UPDATE`s still take row locks held until commit, in the same opposite order, and a stricter level adds aborts rather than removing the cycle.',
      },
    ],
    cards: [
      {
        id: 'c-db-locking-1',
        moduleId: 'db-locking',
        front: 'When does optimistic concurrency beat a lock?',
        back: 'When conflicts are rare or the work spans think time. Under heavy contention it turns waiting into wasted retries, so lock briefly or use one atomic statement.',
        tag: 'Concurrency',
      },
      {
        id: 'c-db-locking-2',
        moduleId: 'db-locking',
        front: 'Why do readers not block writers under [[MVCC]]?',
        back: 'Writes create new row versions and each reader sees its own snapshot. The cost is dead versions, which vacuum can only reclaim once no snapshot needs them.',
        tag: 'MVCC',
      },
      {
        id: 'c-db-locking-3',
        moduleId: 'db-locking',
        front: 'How do databases handle deadlocks, and how do you avoid them?',
        back: 'They find a cycle in the wait-for graph and abort a victim. Lock in one global order, keep transactions short, and retry the victim.',
        tag: 'Locking',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'db-replication',
    trackId: 'databases',
    title: 'Replication in practice',
    station: 7,
    prereqs: ['db-locking'],
    related: ['f-scale', 'c-cap'],
    minutes: 14,
    summary: 'Single-leader, multi-leader and leaderless; what each acknowledgement mode loses; lag anomalies, failover, split brain and quorums.',
    objectives: [
      'Pick single-leader, multi-leader or leaderless replication for a workload, and name what each costs',
      'Say what asynchronous, synchronous and semi-synchronous replication lose on failover, as an [[RPO]]',
      'Fix read-your-writes and monotonic-reads anomalies without sending every read to the leader',
      'Explain why `W + R > N` makes quorums overlap, and where that guarantee leaks',
    ],
    keywords: [
      'leader follower',
      'primary replica',
      'read replica',
      'replication lag',
      'read your writes',
      'failover',
      'split brain',
      'quorum',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Foundations said read replicas cost you replication lag. That is the entry ticket. The senior conversation is about the edges: which writes vanish when the leader dies, what a user sees when two reads land on different replicas, and how you stop two nodes from both believing they are in charge.',
      },
      {
        kind: 'prose',
        text: 'Every replication design answers two questions. **Who accepts writes**: one node, several, or any? And **when is a write acknowledged**: before the copies have it, once one has it, or once a majority do? Those two answers fix your durability, your write latency and the shape of every failure.',
      },
      { kind: 'heading', text: 'Three topologies' },
      {
        kind: 'table',
        head: ['Topology', 'Who accepts writes', 'Write conflicts', 'Seen in'],
        rows: [
          ['**Single-leader**', 'One leader; followers replay its log', 'None: one order of writes', 'Postgres, MySQL, MongoDB'],
          ['**Multi-leader**', 'A leader per region, or per device', 'Yes: concurrent writes must be merged', 'DynamoDB global tables, CouchDB'],
          ['**Leaderless**', 'Any replica; a coordinator writes to several', 'Yes: resolved on read or in the background', 'Cassandra, ScyllaDB, Riak'],
        ],
      },
      {
        kind: 'prose',
        text: '**Single-leader** is the default because it has no write conflicts. One node orders every write and the followers replay that order. Postgres streams its [[WAL]], the same log it uses for crash recovery, to each follower, which applies it byte for byte. The cost is that every write, from anywhere in the world, travels to one machine.',
      },
      {
        kind: 'prose',
        text: '**Multi-leader** puts a leader in each region so writes are local, and replicates between leaders asynchronously. The price is conflicts: two regions edit the same row in the same second and both succeed. Something must merge them. Last write wins silently discards one. A [[CRDT]] merges by construction, for the data types that have one. Otherwise it is application code. Use it when local write latency on several continents is a hard requirement, and keep conflicts rare by giving each record a home region that takes its writes.',
      },
      {
        kind: 'prose',
        text: '**Leaderless** replication, from Amazon\'s 2007 Dynamo paper, sends each write to several replicas at once and counts the acknowledgements. There is no failover because there is no leader to lose, which is why Cassandra rides out a lost datacentre. The cost is weak ordering and conflict handling on every key. Note that DynamoDB the service is **not** Dynamo-style: each partition has a leader, elected with Paxos.',
      },
      { kind: 'heading', text: 'When is a write acknowledged?' },
      {
        kind: 'prose',
        text: 'This is the durability question, and the honest way to answer it is as a recovery point objective ([[RPO]]): how much acknowledged data a failure can take with it.',
      },
      {
        kind: 'list',
        items: [
          '**Asynchronous.** The leader commits, answers, then ships the change. Fastest, and the default in Postgres and MySQL. If the leader dies, whatever had not shipped is gone: the RPO is the replication lag, usually milliseconds, sometimes minutes under load.',
          '**Synchronous.** The leader waits until a follower has the change before answering. RPO is zero, and every commit pays a round trip: a millisecond or two inside a region, 70–80 ms from New York to London. If that follower stops answering, writes stop too.',
          '**Semi-synchronous.** Wait for **one** of several followers, or for a follower to receive the change without applying it. Postgres `ANY 1 (a, b)` and MySQL semi-sync work this way: no loss while one copy survives, and no stall on one slow replica.',
        ],
      },
      {
        kind: 'figure',
        caption: 'Asynchronous replication: the client was told OK, and the write died with the old leader.',
        figure: {
          kind: 'sequence',
          actors: ['Client', 'Leader', 'Follower'],
          steps: [
            { from: 0, to: 1, label: 'insert order 981' },
            { from: 1, to: 1, label: 'commit locally' },
            { from: 1, to: 0, label: 'OK', tone: 'mastered', dashed: true },
            { from: 1, to: 1, label: 'crashes before shipping it', tone: 'alert' },
            { from: 2, to: 2, label: 'promoted to leader' },
            { from: 0, to: 2, label: 'read order 981' },
            { from: 2, to: 0, label: 'not found', tone: 'alert', dashed: true },
          ],
        },
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'Semi-sync can quietly become async',
        text: 'MySQL semi-sync falls back to asynchronous if no replica acknowledges within a timeout, ten seconds by default, and carries on. The fallback keeps writes flowing, but it means the guarantee lapses during exactly the kind of incident you bought it for. Alert on the fallback, or set the timeout so high that the leader stalls instead.',
      },
      { kind: 'heading', text: 'Lag anomalies, and their fixes' },
      {
        kind: 'prose',
        text: 'With asynchronous followers, lag is normal: tens of milliseconds on a quiet day, seconds or minutes during a bulk load or while a long query on the follower holds replay back. Lag on its own is invisible. It becomes a bug when one user\'s reads land at different points in time.',
      },
      {
        kind: 'figure',
        caption: 'Read-your-writes, violated: the save succeeded, and the reload says it did not.',
        figure: {
          kind: 'timeline',
          ticks: ['0 ms', '100 ms', '200 ms', '300 ms'],
          lanes: [
            {
              label: 'Leader',
              bars: [{ from: 0, to: 0.1, label: 'name saved', tone: 'mastered' }],
            },
            {
              label: 'Follower',
              bars: [
                { from: 0, to: 0.7, label: 'lagging: old name', tone: 'streak' },
                { from: 0.7, to: 1, label: 'caught up', tone: 'mastered' },
              ],
            },
            {
              label: 'User reloads',
              bars: [{ from: 0.3, to: 0.42, label: 'read', tone: 'line' }],
              outcome: { label: 'sees the old name', tone: 'alert' },
            },
          ],
          note: 'Nothing is broken. The read simply landed inside the lag window.',
        },
      },
      {
        kind: 'table',
        head: ['Anomaly', 'What the user sees', 'Fix'],
        rows: [
          ['**Read-your-writes**', 'Saves a change, reloads, the change is gone', 'Read from the leader briefly after that user writes, or read from a follower that has replayed past their write'],
          ['**Monotonic reads**', 'A comment appears, then disappears on the next refresh', 'Pin each user to one follower, for example by hashing the user id'],
          ['**Consistent prefix**', 'An answer appears before the question it replies to', 'Write causally related records to the same partition, so they replicate in order'],
        ],
      },
      {
        kind: 'prose',
        text: 'The second read-your-writes fix is the precise one. After a write, the leader returns its log position; the client sends it with the next read, and the data layer picks a follower that has replayed at least that far, which Postgres reports as `pg_last_wal_replay_lsn()`, or falls back to the leader. Only the user who just wrote pays anything. Everyone else reads any follower.',
      },
      { kind: 'heading', text: 'Failover and split brain' },
      {
        kind: 'prose',
        text: 'Failover sounds like one step and is three, each with its own way to go wrong. **Detect** that the leader is dead, but a timeout cannot tell dead from slow: too short and you fail over under ordinary load, too long and writes stop for minutes, which counts against your recovery time objective ([[RTO]]). **Choose** a new leader, the most up-to-date follower, and accept that anything it lacks is lost. **Redirect** clients, and make sure the old leader, if it comes back, knows it has been demoted.',
      },
      {
        kind: 'prose',
        text: 'That last step is where **split brain** comes from: two nodes both accepting writes, each holding data the other lacks, with no automatic way to merge them. The defences stack:',
      },
      {
        kind: 'list',
        items: [
          '**Decide by majority.** Run failover through a consensus store, as Patroni does for Postgres with etcd, Consul or ZooKeeper, so a node cut off from the majority cannot promote itself.',
          '**Fence the old leader.** Every promotion increments an epoch, and storage and clients reject writes stamped with an older one. Or cut it off outright: revoke its network access, power it down.',
          '**Prefer refusing writes to forking the data.** A leader that cannot reach the majority should stop accepting writes, even if it is perfectly healthy.',
        ],
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'GitHub, October 2018',
        text: 'Replacing faulty network equipment cut GitHub\'s primary East Coast data centre off for 43 seconds. In that window their failover tooling promoted MySQL primaries on the West Coast, and both sides ended up holding writes the other did not have. GitHub chose data integrity over a quick recovery: just over 24 hours of degraded service while they restored, resynchronised and reconciled the stranded writes. Automatic cross-region failover on a 43-second blip was the cause, not the cure.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Calling replication your backup. A replica copies mistakes as faithfully as data: a `DELETE` with no `WHERE`, a bad migration, or ransomware reaches every follower within milliseconds. Backups are a separate line in the design: snapshots plus an archived [[WAL]], so you can restore to the minute before the mistake.',
      },
      { kind: 'heading', text: 'Quorums' },
      {
        kind: 'prose',
        text: 'Leaderless systems, and some leader-based ones underneath, replicate by vote. Keep `N` copies of each key. A write succeeds once `W` replicas acknowledge it; a read asks `R` replicas and keeps the newest answer. If `W + R > N`, every read set overlaps every write set in at least one replica, so a read always reaches someone holding the latest acknowledged write. The usual setting is `N = 3, W = 2, R = 2`: one replica can be down and reads and writes both still succeed.',
      },
      {
        kind: 'figure',
        caption: 'Five replicas, a write to three, a read from three: they must share at least one.',
        figure: {
          kind: 'grid',
          cols: 5,
          cells: [
            { label: 'A', tone: 'line' },
            { label: 'B', tone: 'line' },
            { label: 'C', tone: 'mastered' },
            { label: 'D', tone: 'streak' },
            { label: 'E', tone: 'streak' },
          ],
          legend: [
            { tone: 'line', label: 'acknowledged the write (W = 3)' },
            { tone: 'streak', label: 'answered the read (R = 3)' },
            { tone: 'mastered', label: 'both: the overlap that carries the latest value' },
          ],
          note: 'W + R = 6 > N = 5, so however the two sets are chosen, at least one replica is in both.',
        },
      },
      {
        kind: 'prose',
        text: 'Tuning `W` and `R` trades one latency for the other. `W = N, R = 1` makes reads fast and lets one dead replica block every write; `W = 1, R = N` is the reverse. Cassandra sets this per query with consistency levels such as `ONE`, `QUORUM` and `LOCAL_QUORUM`, so one table can serve a fast, loose read path and a careful one.',
      },
      {
        kind: 'prose',
        text: '**Overlap is not linearisability.** A quorum can still return stale or odd results: when a write reached fewer than `W` replicas and failed, but the partial copies stay and get read; when two writes race and the tie is broken by clock timestamps; or under a **sloppy quorum**, where writes go to stand-in nodes during an outage and the overlap quietly lapses. Read repair and background anti-entropy converge the replicas eventually. Quorums buy durability and availability with fresh reads most of the time. For a strict guarantee you need consensus.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Amazon Aurora\'s storage quorum',
        text: 'Aurora keeps six copies of every piece of data, two in each of three availability zones. A write needs four acknowledgements and the read quorum is three, so `4 + 3 > 6`. It can lose a whole zone and keep writing, or a zone plus one more copy and still read. The database engine on top is still single-leader; the quorum lives in the storage layer underneath it.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: '"Writes go to one leader with a synchronous follower in another availability zone, so failover loses nothing; the other followers are asynchronous read replicas. For five seconds after a user writes, their reads go to the leader, so they always see their own change. Failover is decided by a majority in etcd, so a partitioned leader cannot keep taking writes."',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Your read replicas fall minutes behind every night. Where do you look?',
            a: 'At what runs at night: a batch job writing faster than one replay process can apply, or a long query on the replica holding replay back. Postgres pauses replay rather than cancel a running query, for up to `max_standby_streaming_delay`. Fix the cause by chunking the batch or moving reports elsewhere, and route freshness-sensitive reads to the leader once lag passes a threshold.',
          },
          {
            q: 'How do you give read-your-writes in a multi-region app with asynchronous replication?',
            a: 'Send each user\'s writes, and their reads for a short window, to their home region\'s leader. Or carry the write\'s log position and have the local replica wait until it has replayed that far before answering. If the user switches region mid-session the token still works: the new region waits or forwards. What you do not do is make every read cross an ocean.',
          },
          {
            q: 'When would you choose leaderless over single-leader?',
            a: 'When write availability matters more than ordering: you must accept writes through node and datacentre failures with no failover pause, and the data is mostly appends or last-write-wins per key. Sensor ingestion, activity logs and message history fit. Account balances, and anything with an invariant across rows, do not.',
          },
          {
            q: 'Can a good health check prevent split brain?',
            a: 'No. A health check cannot tell a dead leader from a slow one or from a broken network path, so two observers can disagree. You need a majority decision, from a consensus store only one side of a partition can reach, plus fencing, so the old leader\'s late writes are rejected even if it never hears it was demoted.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-db-replication-1',
        moduleId: 'db-replication',
        stem: 'A payments database uses asynchronous replication. The leader crashes and a follower is promoted. What is at risk?',
        options: [
          'Nothing: replication means every committed write exists on the follower',
          'Writes the client was told had committed but the follower had not yet received',
          'Only writes still in flight that were never acknowledged',
          'Only reads, which are stale for a few seconds until the new leader catches up',
        ],
        correct: 1,
        explain:
          'Asynchronous means the leader acknowledges before it ships, so a client can hold an OK for a write that died with the leader. The [[RPO]] is the replication lag. Unacknowledged writes were never promised. For payments, use a synchronous or semi-synchronous follower so at least one copy has every acknowledged write.',
      },
      {
        id: 'q-db-replication-2',
        moduleId: 'db-replication',
        stem: 'A user posts a comment, refreshes and sees it, refreshes again and it is gone. Which anomaly is this, and what fixes it?',
        options: [
          'Read-your-writes; read from the leader after writing',
          'Split brain; add fencing tokens',
          'Lost update; add a version column',
          'Monotonic reads; pin each user to one replica',
        ],
        correct: 3,
        explain:
          'The user saw newer data, then older: the two reads hit replicas at different points in time. Pinning the user to one replica means time only moves forward for them. Read-your-writes is the tempting answer, but they did see their write once; the bug is going backwards.',
      },
      {
        id: 'q-db-replication-3',
        moduleId: 'db-replication',
        stem: 'A leaderless store keeps `N = 3` copies. Which setting guarantees every read overlaps the latest acknowledged write?',
        options: ['`W = 1, R = 1`', '`W = 1, R = 2`', '`W = 2, R = 2`', '`W = 2, R = 1`'],
        correct: 2,
        explain:
          'Overlap needs `W + R > N`. Two plus two is four, more than three, so any two readers share at least one replica with any two writers. `W = 2, R = 1` sums to exactly three, so a read can land on the one replica the write missed.',
      },
    ],
    cards: [
      {
        id: 'c-db-replication-1',
        moduleId: 'db-replication',
        front: 'What does each acknowledgement mode lose on failover?',
        back: 'Async: whatever had not shipped, the lag. Sync: nothing, but every commit waits and a dead follower stalls writes. Semi-sync: nothing while one follower of several keeps up.',
        tag: 'Replication',
      },
      {
        id: 'c-db-replication-2',
        moduleId: 'db-replication',
        front: 'The two fixes for read-your-writes.',
        back: 'Read from the leader for a few seconds after that user writes, or carry the write\'s log position and read only from a follower that has replayed past it.',
        tag: 'Replication',
      },
      {
        id: 'c-db-replication-3',
        moduleId: 'db-replication',
        front: 'What does `W + R > N` guarantee, and what does it not?',
        back: 'Every read set overlaps every write set, so a read reaches the latest acknowledged write. Not linearisability: partial writes, clock tie-breaks and sloppy quorums leak.',
        tag: 'Quorums',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'db-choosing',
    trackId: 'databases',
    title: 'Choosing SQL or NoSQL',
    station: 8,
    prereqs: ['db-replication'],
    related: ['f-storage', 'f-db', 'c-search'],
    minutes: 11,
    summary: 'Seven families with a sweet spot and a trap each, Postgres as the default, and the signals that move you off it.',
    objectives: [
      'Name the sweet spot and the trap of relational, document, key-value, wide-column, graph, time-series and search stores',
      'Defend Postgres as the default, and list what it already does before you add a second store',
      'Recognise the concrete signals that justify another database, and add it alongside the source of truth, fed by [[CDC]]',
    ],
    keywords: [
      'SQL vs NoSQL',
      'which database',
      'polyglot persistence',
      'document database',
      'wide column',
      'graph database',
      'time series database',
      'start with Postgres',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Foundations told you to refuse the "[[SQL]] versus [[NoSQL]]" debate and name the property you need instead. This lesson is the vocabulary for doing that: what each family of database is genuinely best at, where each one hurts, and the specific signals that justify leaving the default.',
      },
      {
        kind: 'prose',
        text: 'The interviewer is not checking whether you have heard of MongoDB. They are checking whether the choice follows from the access patterns and numbers you wrote down ten minutes earlier, and whether you can say what it costs.',
      },
      {
        kind: 'figure',
        caption: 'Start with Postgres. Leave only for a named requirement, and usually add a store rather than replace one.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Is there a concrete requirement Postgres cannot meet?',
            no: { answer: 'Postgres', sub: 'most systems end here', tone: 'mastered' },
            yes: {
              question: 'Is it scale: writes or data beyond one primary?',
              yes: {
                question: 'Do you still need transactions across rows?',
                yes: { answer: 'Distributed SQL or sharded Postgres', sub: 'Spanner, CockroachDB, Citus', tone: 'line' },
                no: { answer: 'Key-value or wide-column', sub: 'DynamoDB, Cassandra, modelled per query', tone: 'line' },
              },
              no: { answer: 'Add a specialist alongside', sub: 'search, graph, time-series or analytics, fed from Postgres', tone: 'line' },
            },
          },
        },
      },
      { kind: 'heading', text: 'Start with Postgres' },
      {
        kind: 'prose',
        text: 'Start with Postgres, or MySQL if that is what the team already runs well. Not because it is fashionable, but because it is the store whose mistakes are cheapest to fix. It gives you transactions, constraints, joins and a query planner, which means a query nobody anticipated is slow rather than impossible. Every other family on this page trades some of that away for one specific strength.',
      },
      {
        kind: 'prose',
        text: 'It also covers more ground than candidates credit before anything else is added:',
      },
      {
        kind: 'figure',
        caption: 'What one Postgres already covers, before a second store has to earn its keep.',
        figure: {
          kind: 'stack',
          layers: [
            { label: 'Documents', sub: '`jsonb` columns with [[GIN]] indexes' },
            { label: 'Full-text search', sub: '`tsvector` and GIN: fine for a product catalogue' },
            { label: 'Geospatial', sub: '[[PostGIS]]: radius and polygon queries' },
            { label: 'Time series', sub: 'native partitioning, or the TimescaleDB extension' },
            { label: 'Vector search', sub: 'pgvector for embeddings' },
            { label: 'Job queues', sub: '`FOR UPDATE SKIP LOCKED`' },
            { label: 'Relational core', sub: 'transactions, constraints, joins, ad hoc queries', tone: 'mastered' },
          ],
          note: 'Each is good enough until a number says otherwise. One database is one backup, one failover plan and one thing to be paged about.',
        },
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Notion, 2021',
        text: 'Notion ran on a single Postgres until vacuum began to stall and transaction-id wraparound became a live threat. Rather than move to a different family of database, they split it into 480 logical shards across 32 physical Postgres databases, partitioned by workspace id. Everything one workspace touches lives on one shard, so transactions and joins still work where the product needs them.',
      },
      { kind: 'heading', text: 'Seven families, each with a trap' },
      {
        kind: 'table',
        head: ['Family', 'Sweet spot', 'Trap', 'Examples'],
        rows: [
          ['**Relational**', 'Transactions, invariants across rows, queries you have not thought of yet', 'Write scaling past one primary; schema changes on billion-row tables', 'Postgres, MySQL'],
          ['**Document**', 'Self-contained aggregates read and written whole', 'Relationships between documents: the joins move into your code', 'MongoDB, Firestore'],
          ['**Key-value**', 'Lookup by a known key at any scale, with flat latency', 'Any question that is not "get this key"', 'DynamoDB, Redis'],
          ['**Wide-column**', 'Huge write volume, rows sorted within a partition, writes in many regions', 'Every query designed in advance; deletes and updates are costly', 'Cassandra, ScyllaDB, Bigtable'],
          ['**Graph**', 'Traversals of unknown depth: fraud rings, nested permissions', 'One-hop relationships an index answers; graphs shard badly', 'Neo4j, Amazon Neptune'],
          ['**Time-series**', 'Append-only measurements, rollups, retention, heavy compression', 'High-cardinality labels: a series per user id explodes memory', 'TimescaleDB, InfluxDB, Prometheus'],
          ['**Search**', 'Relevance-ranked full text, fuzzy matching, facets, log search', 'Used as the source of truth: near-real-time, not transactional', 'Elasticsearch, OpenSearch'],
        ],
      },
      {
        kind: 'prose',
        text: '**Document** stores win when the aggregate is the unit: load the whole order, change it, save it back, and nothing else points into its insides. They lose when the data is really a web of references, such as authors, books, reviews and reviewers, because every join you avoided in the schema reappears in application code. "Schemaless" means the schema lives in your code, unversioned. MongoDB allows documents up to 16 [[MB]] and has had multi-document transactions since 2018, so neither size nor atomicity is the real argument. The shape of the relationships is.',
      },
      {
        kind: 'prose',
        text: '**Key-value and wide-column** stores win on predictability. A single-key read in DynamoDB takes single-digit milliseconds whether the table holds a gigabyte or a petabyte. You pay at design time instead: every query must be known before the first row is written, which is the next lesson. Cassandra and ScyllaDB are built on [[LSM]] trees, so writes are cheap sequential appends; reads may consult several files, and deletes leave tombstones that slow reads until compaction clears them.',
      },
      {
        kind: 'prose',
        text: '**Graph** databases earn their place on traversals of unknown depth, such as "is this new account within four hops of a known fraudster?", where a relational database needs a recursive query whose cost grows with every hop. If the question is one or two hops, a join or a reversed index answers it, and the graph database is a second system bought for nothing.',
      },
      {
        kind: 'prose',
        text: '**Time-series** and **search** engines are nearly always additions, not replacements. They hold a derived copy of data whose truth lives somewhere else.',
      },
      { kind: 'heading', text: 'Signals that justify leaving' },
      {
        kind: 'prose',
        text: 'Each signal is a number or a query shape you can point to in your requirements. If you cannot point to one, stay.',
      },
      {
        kind: 'list',
        ordered: true,
        items: [
          '**Sustained writes past one primary.** Tens of thousands of writes a second, sustained, after batching and indexes are tuned; or data heading past a few [[TB]] with no natural archive. Shard Postgres, move to distributed SQL, or use a key-value store if you can give up transactions across rows.',
          '**Writes accepted in several regions at once.** Users on three continents need local write latency, or writes must survive the loss of a whole region with no failover pause. Single-leader Postgres cannot do that. Cassandra, DynamoDB global tables and Spanner can, each with its own consistency price.',
          '**A pure key lookup at extreme scale.** Sessions, carts, feature flags, idempotency keys: one key in, one item out, very many times a second. A key-value store does this with flat latency and little operational work.',
          '**A query shape the relational planner is bad at.** Typo-tolerant relevance ranking across many fields, traversals of unknown depth, dashboards scanning billions of rows. Add a search engine, a graph store or a column store, alongside rather than instead.',
        ],
      },
      {
        kind: 'prose',
        text: 'When the invariants are relational and the scale is not, **distributed SQL** is the escape hatch that keeps them. Google Spanner, CockroachDB and YugabyteDB shard and replicate for you, run consensus per shard, and give real transactions across shards. The price is latency: every commit waits for a majority of replicas, and a cross-region transaction pays for the ocean. It is overkill for a product that fits on one machine.',
      },
      {
        kind: 'prose',
        text: 'One split is so common it is almost a rule. Transactional work ([[OLTP]]) and analytics ([[OLAP]]) stop sharing a database past modest scale: a dashboard that scans a year of orders competes with checkout for the same disks and memory. Copy the data into a column store such as ClickHouse, BigQuery or Snowflake, and let each system be good at one thing.',
      },
      { kind: 'heading', text: 'Adding a store without losing the truth' },
      {
        kind: 'prose',
        text: 'The safe way to run several databases is to make exactly one of them the truth. The application writes to Postgres, and change data capture streams every committed change to the others. Never have a request write to Postgres **and** Elasticsearch itself: one day the second write fails after the first succeeded, and the two disagree with nothing to reconcile them.',
      },
      {
        kind: 'figure',
        caption: 'Polyglot persistence done safely: one source of truth, every other store derived from its change log.',
        figure: {
          kind: 'flow',
          nodes: [
            { label: 'Application', sub: 'writes once', to: 'transaction' },
            { label: 'Postgres', sub: 'the source of truth', tone: 'mastered', to: 'change stream' },
            { label: 'Kafka', sub: 'ordered, replayable', to: 'consumers' },
            { label: 'Elasticsearch, ClickHouse, Redis', sub: 'derived and rebuildable', tone: 'line' },
          ],
          note: 'Lose or corrupt a derived store and you replay the log to rebuild it. Only one store needs a real backup.',
        },
      },
      {
        kind: 'callout',
        tone: 'say',
        text: '"I\'ll start with Postgres: orders and payments need transactions, and nothing here is past one primary at 2,000 writes a second. Product search goes to Elasticsearch, fed by change data capture, because we need typo-tolerant ranking. If writes grow tenfold, the order tables shard cleanly by customer id."',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Choosing by category instead of by query. "Chat is unstructured, so MongoDB" or "we need scale, so Cassandra" tells the interviewer you matched a buzzword. Every store holds unstructured data and every store scales somehow. Name the access pattern and the number that rules Postgres out. If you cannot, Postgres is the answer.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Why not use MongoDB for everything? It scales and the schema is flexible.',
            a: 'Because most products have relationships and invariants: an order references a customer and products, and a payment must match an order. In a document store those joins move into application code and the invariants into hope. MongoDB is a good choice when the aggregate really is self-contained; flexibility and scale alone are not reasons, since Postgres has `jsonb` and shards too.',
          },
          {
            q: 'When does a graph database actually pay off?',
            a: 'When the query walks an unknown or large number of hops and that walk is the product: fraud rings, recommendation paths, permission graphs with nested groups. A follow graph needs one hop at a time, which is two indexed lookups in any store. If the depth is small and fixed, a join or a reversed index wins.',
          },
          {
            q: 'You added Elasticsearch. How does it stay in sync with Postgres?',
            a: 'Write only to Postgres, and stream changes out with [[CDC]]: Debezium reads the [[WAL]] into Kafka, and a consumer indexes each change. Index writes are keyed by document id, so a replay is harmless, and the whole index can be rebuilt from a snapshot plus the log. Dual writes from the application are what to avoid, because one of the two eventually fails alone.',
          },
          {
            q: 'The interviewer says the system must take a million writes a second. Now what?',
            a: 'Ask the shape first: a million writes of what, keyed by what, read how? Append-heavy events keyed by device or user and read by key and time fit a wide-column or key-value store, so Cassandra or DynamoDB. If it needs transactions across rows at that rate, it is distributed SQL, or sharded Postgres with every transaction kept inside one shard.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-db-choosing-1',
        moduleId: 'db-choosing',
        stem: 'Which requirement is the strongest reason to add a second database alongside Postgres?',
        options: [
          'The data is semi-structured JSON',
          'The schema is likely to change as the product evolves',
          'The team expects a lot of users eventually',
          'Users need typo-tolerant, relevance-ranked search across product titles and descriptions',
        ],
        correct: 3,
        explain:
          'Relevance ranking with fuzzy matching across fields is a query shape a search engine is built for, and Postgres full-text search handles only modestly. Semi-structured data fits `jsonb`, a schema change is a migration, and "a lot of users eventually" is not a number.',
      },
      {
        id: 'q-db-choosing-2',
        moduleId: 'db-choosing',
        stem: 'A team stores users, their posts, and the comments on those posts in a document database, one document per user. What goes wrong first?',
        options: [
          'Reads are slow, because documents cannot be indexed',
          'Showing a post with comments from many users means assembling many documents, and a renamed user leaves stale copies everywhere',
          'Comments longer than a few kilobytes cannot be stored',
          'Document databases cannot take writes at that rate',
        ],
        correct: 1,
        explain:
          'The data is a web of references, not a self-contained aggregate. Joins move into application code, duplicated author names drift, and the model fights every query that crosses users. Indexes and size limits are not the problem; the shape of the relationships is.',
      },
      {
        id: 'q-db-choosing-3',
        moduleId: 'db-choosing',
        stem: 'You need transactions across rows and more sustained write throughput than one primary can take. Which option fits?',
        options: [
          'A key-value store such as DynamoDB, with conditional writes',
          'More read replicas behind a load balancer',
          'Distributed SQL such as CockroachDB or Spanner, or Postgres sharded so each transaction stays on one shard',
          'A search engine in front of Postgres to absorb the load',
        ],
        correct: 2,
        explain:
          'Replicas add read capacity, not write capacity, and a search engine absorbs no writes. A key-value store scales writes but gives up general multi-row transactions; DynamoDB has transactions, but they are capped and cost double. Distributed SQL keeps the relational guarantees and pays for them in commit latency.',
      },
    ],
    cards: [
      {
        id: 'c-db-choosing-1',
        moduleId: 'db-choosing',
        front: 'The default database, and the signals to leave it.',
        back: 'Postgres. Leave for writes past one primary, writes in several regions, a pure key lookup at huge scale, or a query shape like relevance search or deep traversal.',
        tag: 'Choosing',
      },
      {
        id: 'c-db-choosing-2',
        moduleId: 'db-choosing',
        front: 'Sweet spot and trap of a document store?',
        back: 'Sweet spot: self-contained aggregates read and written whole. Trap: relationships between documents, where joins move into your code and duplicates drift.',
        tag: 'Choosing',
      },
      {
        id: 'c-db-choosing-3',
        moduleId: 'db-choosing',
        front: 'How do you run a second store without the two drifting apart?',
        back: 'Make one store the truth. Write only to it, stream its changes to the others, and keep every derived store rebuildable from the log.',
        tag: 'Polyglot',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'db-nosql-modelling',
    trackId: 'databases',
    title: 'Modelling NoSQL around access patterns',
    station: 9,
    prereqs: ['db-choosing'],
    related: ['c-modelling', 'c-sharding'],
    minutes: 12,
    summary: 'Keys from queries, single-table design, hot partitions and write sharding, Cassandra tables per query, and a worked example.',
    objectives: [
      'Derive partition and sort keys from a written list of access patterns',
      'Use single-table design, overloaded indexes and sparse indexes so each pattern is one request',
      'Spot a hot partition before it happens, and fix it with write sharding',
      'Model a Cassandra table per query, and treat duplication as part of the design',
    ],
    keywords: [
      'single-table design',
      'partition key',
      'sort key',
      'hot partition',
      'write sharding',
      'query-driven modelling',
      'denormalisation',
      'DynamoDB modelling',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Relational modelling starts from the data and trusts a planner to answer any query. Key-value and wide-column ([[NoSQL]]) modelling runs the other way: you start from the queries and arrange the data so each one is a single request to a single partition. There is no planner to rescue a query you did not design for.',
      },
      {
        kind: 'prose',
        text: 'That is why an interviewer who hears "DynamoDB" asks straight away "what are your keys?" The answer shows whether you know your queries, and the keys are the whole design.',
      },
      {
        kind: 'figure',
        caption: 'Queries first, keys second, indexes for the leftovers, then prove every pattern is one request.',
        figure: {
          kind: 'flow',
          nodes: [
            { label: 'Access patterns', sub: 'every read and write, with its rate', to: 'decide' },
            { label: 'Keys', sub: 'a partition key and a sort key per pattern', tone: 'line', to: 'then' },
            { label: 'Indexes', sub: 'one for each pattern the keys miss', to: 'check' },
            { label: 'One request each', sub: 'or back to the keys', tone: 'mastered' },
          ],
        },
      },
      { kind: 'heading', text: 'Keys from queries' },
      {
        kind: 'prose',
        text: 'Write the access patterns as a numbered list with rough rates before you name a single attribute. Each is a sentence with a **given** and a **return**: "given a customer, return their orders, newest first". The given becomes a partition key. The ordering becomes a sort key.',
      },
      {
        kind: 'prose',
        text: 'In DynamoDB the partition key ([[PK]]) is hashed to decide which partition stores an item, and the sort key ([[SK]]) orders items inside it. A `Query` names exactly one partition key value and may narrow the sort key with `=`, `<`, `>`, `BETWEEN` or `begins_with`. Everything sharing a partition key is an **item collection**, stored together and returned by one request, up to 1 [[MB]] per page. That is the only join you get, so design for it.',
      },
      {
        kind: 'prose',
        text: 'Give the key attributes generic names, `PK` and `SK` rather than `customerId`, so different entity types can share one table, with prefixes such as `CUST#` and `ORDER#` saying what each item is. That is **single-table design**.',
      },
      { kind: 'heading', text: 'A worked example: an order service' },
      {
        kind: 'prose',
        text: 'A shop needs five access patterns. The rates are at peak, during a sale.',
      },
      {
        kind: 'table',
        head: ['#', 'Access pattern', 'Peak rate'],
        rows: [
          ['1', 'Get a customer\'s profile', '2,000/s'],
          ['2', 'List a customer\'s orders, newest first', '1,000/s'],
          ['3', 'Get one order with all its line items', '5,000/s'],
          ['4', 'Place an order: header and items together', '3,000/s'],
          ['5', 'Warehouse: the oldest unshipped orders', '10/s, but every order passes through it'],
        ],
      },
      {
        kind: 'prose',
        text: 'Patterns 1, 3 and 4 fit the base table. Customers and orders get separate partitions, and an order\'s header and lines share one, so pattern 3 is a single `Query` on the order\'s key.',
      },
      {
        kind: 'code',
        code: `PK           SK          attributes
CUST#c42     PROFILE     name, email, tier
ORDER#o981   HEADER      customerId, status, total,
                         shipTo, placedAt,
                         GSI1PK = CUST#c42
                         GSI1SK = 2026-11-18T10:02
ORDER#o981   ITEM#01     sku, name, qty, unitPrice
ORDER#o981   ITEM#02     sku, name, qty, unitPrice`,
        caption: 'One table, three entity types. The prefixes say what each item is; the shared partition key is the join.',
      },
      {
        kind: 'figure',
        caption: 'An item collection: everything under one partition key, stored together and read in one request.',
        figure: {
          kind: 'stack',
          layers: [
            { label: 'PK = `ORDER#o981`', sub: 'one partition, one request', tone: 'line' },
            { label: '`HEADER`', sub: 'status, total, ship-to address as at purchase', tone: 'mastered' },
            { label: '`ITEM#01`', sub: 'product name and price as charged' },
            { label: '`ITEM#02`', sub: 'sorts after the header, so lines follow it in order' },
          ],
          note: 'One `Query` on the partition key returns the order and its lines together: the pre-joined read that single-table design exists for.',
        },
      },
      {
        kind: 'prose',
        text: 'Pattern 2 crosses partitions, since a customer\'s orders sit under many order keys, so it gets a global secondary index ([[GSI]]). The header carries `GSI1PK = CUST#c42` and `GSI1SK = placedAt`; querying the index for `CUST#c42`, descending, returns that customer\'s orders newest first. Name the index attributes generically too. **Overloading** one index with several entity types is how a single table answers a dozen patterns with three or four indexes.',
      },
      {
        kind: 'prose',
        text: 'Pattern 4 writes the header and its lines in one `TransactWriteItems` call, so an order never exists without them. Pattern 5 is where the design gets interesting.',
      },
      { kind: 'heading', text: 'Hot partitions and write sharding' },
      {
        kind: 'prose',
        text: 'The obvious answer to pattern 5 is an index keyed on status: `GSI2PK = PENDING`, sorted by `placedAt`. Then every new order writes to the same index partition. A DynamoDB partition sustains about 1,000 writes and 3,000 reads a second; past that, requests to that key are throttled, however much capacity the table has overall. Adaptive capacity smooths out an uneven table, but it cannot lift one partition past those limits.',
      },
      {
        kind: 'prose',
        text: 'It gets worse. A global index that cannot keep up throttles writes to the **base table**, so the warehouse queue would stop customers placing orders. At 3,000 orders a second, a single `PENDING` key is three times over its limit.',
      },
      {
        kind: 'prose',
        text: 'The fix is **write sharding**: spread the key over a fixed set of suffixes. Write `GSI2PK = PENDING#` plus `hash(orderId) % 10`, and 3,000 writes a second land on ten partitions at about 300 each. The warehouse queries all ten shards in parallel and merges by `placedAt`. That is ten small queries instead of one, and at 10 reads a second it costs nothing. Size the shard count from the peak write rate over the per-partition limit, with headroom.',
      },
      {
        kind: 'figure',
        caption: 'The same index key, unsharded and sharded ten ways.',
        figure: {
          kind: 'split',
          left: {
            title: 'One key',
            tone: 'alert',
            nodes: [
              { label: '3,000 orders/s', to: 'all to' },
              { label: '`PENDING`', sub: 'one partition, ~1,000 writes/s', tone: 'alert' },
            ],
            cost: 'Throttled, and a throttled index throttles the base table.',
          },
          right: {
            title: 'Ten shards',
            tone: 'mastered',
            nodes: [
              { label: '3,000 orders/s', to: 'hash % 10' },
              { label: '`PENDING#0` … `PENDING#9`', sub: '~300 writes/s each', tone: 'mastered' },
            ],
            cost: 'Reads fan out to ten queries and merge.',
          },
          verdict: 'Write sharding moves the cost to the rare side: writes spread out, and the occasional read pays for a fan-out.',
        },
      },
      {
        kind: 'prose',
        text: 'One more trick finishes pattern 5. When an order ships, **remove** its `GSI2PK` attribute. DynamoDB only indexes items that carry the index key, so shipped orders drop out of the index on their own. This is a **sparse index**: it holds the few thousand orders still waiting, not every order ever placed.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Choosing a low-cardinality partition key: a status, a country, today\'s date, a boolean. It looks tidy on the whiteboard and puts the whole write load on two or three partitions. Every partition key should have many distinct values with roughly even traffic, and when the requirement really is "everything pending", shard the key on purpose.',
      },
      { kind: 'heading', text: 'Cassandra: one table per query' },
      {
        kind: 'prose',
        text: 'Cassandra reaches the same place by a different road. There is no single-table convention. You create **one table per query**, each with the primary key that query needs, and write every change to each table that holds it. The primary key has two parts: the **partition key** picks the nodes, and **clustering columns** sort rows within the partition.',
      },
      {
        kind: 'code',
        code: `CREATE TABLE messages_by_channel (
  channel_id  bigint,
  bucket      int,       -- a 10-day window
  message_id  bigint,    -- time-sortable id
  author_id   bigint,
  content     text,
  PRIMARY KEY ((channel_id, bucket), message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);`,
        caption: 'Partition by channel and time window; cluster by message id, newest first.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Discord\'s message store',
        text: 'Discord left MongoDB once its data and indexes no longer fit in memory and latency turned unpredictable. The access pattern was narrow and known, a channel\'s messages newest first under constant writes, so it moved to Cassandra with exactly this shape. Partitioning by channel alone would let one busy channel grow a partition without bound, so the key is the channel **plus a 10-day bucket** derived from the message id. Recent history touches one or two partitions. The model survived their later move to ScyllaDB, which speaks the same query language, at trillions of messages.',
      },
      {
        kind: 'prose',
        text: 'If users also need "all messages by an author", that is a second table, `messages_by_author`, partitioned by author, written alongside the first. Cassandra\'s [[LSM]] storage turns writes into cheap sequential appends, so writing a message twice costs little; reading across partitions is what it cannot do. A logged batch makes sure both inserts eventually land, but not at the same instant, so for a moment one table may have the message and the other not.',
      },
      { kind: 'heading', text: 'Duplication is the design' },
      {
        kind: 'prose',
        text: 'In a relational schema, a copy of a customer\'s name on every order is a smell. Here it is often the point, for one of two different reasons, and it is worth saying which.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Duplicate a snapshot',
          points: [
            'The copy records a fact at a moment: the price charged, the address shipped to',
            'It must **not** change when the source changes',
            'No sync needed: the drift is correct',
          ],
        },
        right: {
          title: 'Duplicate for a read',
          points: [
            'The copy exists so one query needs one request',
            'It **must** change when the source changes',
            'Every update fans out, so copy only fields that rarely change',
          ],
        },
        verdict: 'Snapshots are free. Read copies are a bill paid on every write, so name the update path out loud when you make one.',
      },
      {
        kind: 'prose',
        text: 'Two limits keep duplication honest. A DynamoDB item caps at 400 [[KB]], so an unbounded list, such as every follower or every comment, becomes separate items in a collection, never an array inside one item. A Cassandra partition should stay under roughly 100 MB, so anything that grows forever needs a time bucket in its partition key, as Discord\'s does.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: '"Before I name a table I\'ll list the access patterns with their rates. An order and its lines share a partition, so viewing an order is one `Query`. Order history comes from an index on customer id. The warehouse queue is a sparse index sharded ten ways, because 3,000 orders a second would melt a single partition."',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'A new access pattern arrives after launch. What do you do?',
            a: 'If it can be keyed off attributes the items already carry, add a global index; DynamoDB backfills it online. If it needs a new attribute, write it on new items and backfill old ones with a scan job. In Cassandra, create the new table and backfill it with a batch job while writing to both. It is real work, which is exactly why the patterns come first.',
          },
          {
            q: 'Why single-table design rather than a table per entity?',
            a: 'DynamoDB has no joins, so the only way to fetch related items in one request is to give them the same partition key, which means one table. A table per entity costs a request per entity type. The price is a table that is hard to read without the access-pattern list, and analytics that need an export first, which is why some teams settle on one table per service instead.',
          },
          {
            q: 'How would you store the like count on a post that goes viral?',
            a: 'One counter item for a viral post is a hot key, capped near 1,000 writes a second. Shard it: increment `LIKES#post#0` to `LIKES#post#9` at random and sum the ten on read, or buffer increments in a stream and apply them in batches. Readers tolerate a count a second behind; nobody tolerates throttled likes.',
          },
          {
            q: 'Can you query across all customers, such as every order placed today?',
            a: 'Not on the base table: a `Query` needs one partition key, and a `Scan` reads everything. Add an index keyed on the day and sharded so today\'s partition is not hot, or send the question to an analytics copy of the data. Questions that cross every partition are usually analytics, and they belong in an analytics store.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-db-nosql-modelling-1',
        moduleId: 'db-nosql-modelling',
        stem: 'Which partition key for a DynamoDB orders index is most likely to be throttled at peak?',
        options: [
          'The order id',
          'The customer id',
          'A hash of the order id, with the placement time as sort key',
          'The order status, such as `PENDING` or `SHIPPED`',
        ],
        correct: 3,
        explain:
          'Status has a handful of values and every new order shares one, so the write load lands on one partition, capped around 1,000 writes a second. Order and customer ids have millions of distinct values. If you need "all pending", shard the key deliberately and make the index sparse.',
      },
      {
        id: 'q-db-nosql-modelling-2',
        moduleId: 'db-nosql-modelling',
        stem: 'Why does single-table design put an order\'s header and its line items under one partition key?',
        options: [
          'So one `Query` returns the order and all its lines, because the item collection is the only join DynamoDB offers',
          'To save storage by sharing attributes between items',
          'Because DynamoDB requires related entities to share a partition',
          'So the line items inherit the header\'s indexes',
        ],
        correct: 0,
        explain:
          'There are no joins. Items sharing a partition key are stored together and come back in one request, so modelling related items into one collection is how you get a pre-joined read. DynamoDB does not require it; you do it for the access pattern.',
      },
      {
        id: 'q-db-nosql-modelling-3',
        moduleId: 'db-nosql-modelling',
        stem: 'An order line stores the product name and price that were charged. Later the product is renamed and repriced. What should happen to the order line?',
        options: [
          'Update it, because duplicated data must be kept in sync',
          'Replace the copy with a reference to the product so it stays current',
          'Nothing: it is a snapshot of what was sold, and it must not change',
          'Delete it and rebuild it from the product table',
        ],
        correct: 2,
        explain:
          'Some duplication is a historical fact, not a cache: the receipt must show what the customer paid. Syncing it would corrupt the record. Copies made only to speed up a read are different; those must be updated, which is why you keep them to fields that rarely change.',
      },
    ],
    cards: [
      {
        id: 'c-db-nosql-modelling-1',
        moduleId: 'db-nosql-modelling',
        front: 'How do you fix a hot key you genuinely need, like "all pending orders"?',
        back: 'Write sharding: append `hash % N` to the key so writes spread over N partitions, then fan reads out to all N and merge.',
        tag: 'NoSQL modelling',
      },
      {
        id: 'c-db-nosql-modelling-2',
        moduleId: 'db-nosql-modelling',
        front: 'What is a sparse index?',
        back: 'An index keyed on an attribute only some items carry. Remove the attribute and the item leaves the index, so "unshipped orders" indexes only the unshipped.',
        tag: 'NoSQL modelling',
      },
      {
        id: 'c-db-nosql-modelling-3',
        moduleId: 'db-nosql-modelling',
        front: 'Cassandra modelling, in one line.',
        back: 'One table per query: the partition key picks the nodes, clustering columns sort within it, and every write goes to each table that needs it.',
        tag: 'Cassandra',
      },
    ],
  },
]
