import type { Question } from '../types'

/** Authored bank questions — see docs/superpowers/plans/2026-11-18-question-brief.md */
export const questions: Question[] = [
  /* ---------------------------------------------------------------- */
  /* db-er                                                             */
  /* ---------------------------------------------------------------- */
  {
    id: 'db-er-tf1',
    kind: 'truefalse',
    moduleId: 'db-er',
    section: 'Natural keys and surrogate keys',
    prompt:
      'A random [[UUID]] v4 primary key inserts as cheaply as a `bigint` identity, because a B-tree index does not care what order keys arrive in.',
    answer: false,
    explain:
      'Random keys land on random leaf pages, so inserts cause page splits and cache misses, while an identity appends at the right-hand edge. If ids must be minted outside the database, use a time-ordered UUIDv7.',
  },
  {
    id: 'db-er-tf2',
    kind: 'truefalse',
    moduleId: 'db-er',
    section: "Constraints are the schema's job",
    prompt:
      'In Postgres, a foreign key from `order_items.product_id` to `products` needs an index you create yourself, or deleting a product scans `order_items`.',
    answer: true,
    explain:
      "Postgres indexes the referenced primary key, not the referencing column. MySQL's InnoDB does create that index automatically, which is why people assume Postgres does too.",
  },
  {
    id: 'db-er-multi',
    kind: 'multi',
    moduleId: 'db-er',
    section: 'Cardinality decides where the key goes',
    prompt: 'Which of these relationships need a join table of their own?',
    options: [
      'Orders and products, with a quantity on each line',
      'Students and courses, with a grade for each enrolment',
      'Customers and their orders',
      'A user and their one profile',
      'Books and authors, where a book can have several authors',
      'A category and its parent category',
    ],
    correct: [0, 1, 4],
    explain:
      'Many-to-many needs a join table, which also holds facts about the pairing, such as a quantity or a grade. One-to-many puts the key on the many side, one-to-one is a unique foreign key or one table, and a parent is a `parent_id` column.',
  },
  {
    id: 'db-er-match',
    kind: 'match',
    moduleId: 'db-er',
    section: 'A worked schema: a small shop',
    prompt: 'Match each rule in the shop schema to the constraint that enforces it.',
    pairs: [
      { left: 'Two sign-ups with one email cannot both succeed', right: '`UNIQUE`' },
      { left: "A line item's quantity is above zero", right: '`CHECK`' },
      { left: 'An order cannot be saved without a status', right: '`NOT NULL`' },
      { left: 'Deleting an order removes its line items', right: '`ON DELETE CASCADE`' },
      { left: 'A customer who has orders cannot be deleted', right: '`ON DELETE RESTRICT`' },
    ],
    explain:
      'Each is enforced inside the database at the write, for every client. A `CHECK` on status alone lets a null through, so a required value is `NOT NULL`. `ON DELETE` is a business call: lines die with their order, a customer with history stays.',
  },

  /* ---------------------------------------------------------------- */
  /* db-normalization                                                  */
  /* ---------------------------------------------------------------- */
  {
    id: 'db-normalization-tf1',
    kind: 'truefalse',
    moduleId: 'db-normalization',
    section: 'The rare case BCNF catches',
    prompt: 'Taking a table from [[3NF]] to [[BCNF]] can cost you a rule that a single constraint used to enforce.',
    answer: true,
    explain:
      'Splitting the account-manager table spreads "one manager per customer per line" across two tables, where no single constraint can check it. 3NF can always keep every dependency enforceable; BCNF cannot.',
  },
  {
    id: 'db-normalization-tf2',
    kind: 'truefalse',
    moduleId: 'db-normalization',
    section: 'Materialised views',
    prompt: 'Postgres keeps a materialised view up to date incrementally as rows change in the tables it reads.',
    answer: false,
    explain:
      '`REFRESH MATERIALIZED VIEW` recomputes the whole query; `CONCURRENTLY` only keeps the view readable meanwhile. For incremental upkeep, maintain a summary table yourself, in the write transaction or from a change stream.',
  },
  {
    id: 'db-normalization-multi',
    kind: 'multi',
    moduleId: 'db-normalization',
    section: 'Deliberate denormalisation',
    prompt: 'Which of these are denormalisations: copies that must change when their source changes?',
    options: [
      'A review count kept on `products`',
      'The unit price paid, stored on each order line',
      "An author's display name copied onto every post",
      'The address an order was shipped to, stored on the order',
      'A materialised view of revenue per day',
      'The time an order was placed, stored on the order',
    ],
    correct: [0, 2, 4],
    explain:
      'The test is whether the copy must follow its source. A count, a copied name and a view must, so something has to keep each one right. The price paid and the address shipped to are historical facts that must not change.',
  },
  {
    id: 'db-normalization-match',
    kind: 'match',
    moduleId: 'db-normalization',
    section: 'Normal forms on one running example',
    prompt: 'Match each table flaw to the lowest normal form it breaks: [[1NF]], [[2NF]], [[3NF]] or [[BCNF]].',
    pairs: [
      { left: 'An `items` cell holding "kettle ×2, mug ×1"', right: '1NF' },
      { left: '`course_title` in a table keyed by `(student_id, course_id)`', right: '2NF' },
      { left: '`customer_email` on `orders`, beside `customer_id`', right: '3NF' },
      { left: '`manager` determines `product_line`, part of the key', right: 'BCNF' },
    ],
    explain:
      'A packed cell breaks 1NF. A column fixed by half a composite key breaks 2NF. A column fixed by another non-key column breaks 3NF. A non-key determinant of part of a key is the case only BCNF catches.',
  },

  /* ---------------------------------------------------------------- */
  /* db-acid                                                           */
  /* ---------------------------------------------------------------- */
  {
    id: 'db-acid-tf1',
    kind: 'truefalse',
    moduleId: 'db-acid',
    section: 'Atomicity: all or nothing, through the log',
    prompt: "The A in [[ACID]] means other transactions never see a transaction's writes half-done.",
    answer: false,
    explain:
      'That is isolation, the I. Atomicity is about failure: if any part of a transaction fails, everything it wrote is undone, so you never write compensating code for a half-finished transaction.',
  },
  {
    id: 'db-acid-tf2',
    kind: 'truefalse',
    moduleId: 'db-acid',
    section: 'Isolation: a preview',
    prompt:
      'At read committed, two concurrent transfers that each run `SET balance_cents = balance_cents - 10000` on the same account cannot lose a debit.',
    answer: true,
    explain:
      'The statement reads and writes the row under its lock, and the second re-reads the committed value once the first commits. Read the balance into the application and write back a computed number, and one debit can vanish.',
  },
  {
    id: 'db-acid-multi',
    kind: 'multi',
    moduleId: 'db-acid',
    section: 'What ACID does not promise',
    prompt: "A transfer runs as one Postgres transaction. Which of these are still your design's job rather than [[ACID]]'s?",
    options: [
      'Charging a card with a payment provider in step with the commit',
      'Knowing whether the commit landed when the connection dropped',
      'Undoing the debit when the credit fails',
      'Recovering from a bug that committed the wrong amounts',
      'Rejecting an overdraft under a declared `CHECK` constraint',
      'Keeping a confirmed transfer through a power cut',
    ],
    correct: [0, 1, 3],
    explain:
      'ACID stops at the database boundary. A card charge needs an outbox, a lost reply needs an idempotency key, and a bad commit needs backups. Undoing a partial write, declared checks and surviving a crash are the A, the C and the D.',
  },
  {
    id: 'db-acid-match',
    kind: 'match',
    moduleId: 'db-acid',
    section: 'Durability: what committed actually means',
    prompt: 'Match each setup to the confirmed commits it can lose if the server crashes or the primary is lost.',
    pairs: [
      { left: 'One Postgres, `synchronous_commit = on`', right: 'Nothing, unless the disk itself is lost' },
      { left: 'One Postgres, `synchronous_commit = off`', right: 'The last fraction of a second of commits' },
      { left: 'Asynchronous replica, then failover', right: 'Whatever the replica had not yet received' },
      { left: 'A synchronous standby', right: 'Nothing, even if the primary is destroyed' },
    ],
    explain:
      'A local log flush survives a crash but not a dead disk. Turning it off risks about 0.6 s of commits but never integrity. An asynchronous replica lacks whatever had not shipped; only a synchronous standby covers losing the primary.',
  },

  /* ---------------------------------------------------------------- */
  /* db-isolation                                                      */
  /* ---------------------------------------------------------------- */
  {
    id: 'db-isolation-tf1',
    kind: 'truefalse',
    moduleId: 'db-isolation',
    section: 'Five anomalies',
    prompt:
      "At Postgres's default level, a report that sums balances with two `SELECT`s in one transaction sees the data at a single point in time.",
    answer: false,
    explain:
      'Read committed takes a fresh snapshot per statement, so the two queries can straddle a transfer and miss or double-count it: read skew. Run the report at repeatable read for one snapshot; in Postgres that never blocks writers.',
  },
  {
    id: 'db-isolation-tf2',
    kind: 'truefalse',
    moduleId: 'db-isolation',
    section: 'Fixing it: constraint, lock, or serializable',
    prompt:
      "Postgres's serializable level never makes an `UPDATE` wait for a plain read: it aborts a transaction instead when the reads and writes might not fit any serial order.",
    answer: true,
    explain:
      "Postgres runs Serializable Snapshot Isolation: it tracks who read what another wrote and fails one transaction with `40001`, so the cost is retries, not blocking. MySQL's serializable differs: plain reads inside a transaction take shared locks.",
  },
  {
    id: 'db-isolation-multi',
    kind: 'multi',
    moduleId: 'db-isolation',
    section: 'Write skew, the one snapshots miss',
    prompt: 'Which of these are write skew, the anomaly that snapshot isolation lets through?',
    options: [
      'Two withdrawals each check a joint balance, then debit different accounts',
      'Two sign-ups each find a username free and insert it, with no unique index',
      'Two requests each read a like count of 10 and write 11',
      'Two bookings each find a room free, then insert overlapping slots',
      'A range query run twice returns a row inserted in between',
      "A transaction reads another's uncommitted write",
    ],
    correct: [0, 1, 3],
    explain:
      'Write skew is two transactions reading the same rows and writing different ones, so no row is written twice. The like count is a lost update on one row, the repeated range query is a phantom, and the last is a dirty read.',
  },
  {
    id: 'db-isolation-match',
    kind: 'match',
    moduleId: 'db-isolation',
    section: 'The levels, anomaly by anomaly',
    prompt:
      "Match each anomaly to the weakest level that prevents it, counting MySQL's and Postgres's repeatable read as separate levels.",
    pairs: [
      { left: 'Acting on a write that later rolls back', right: 'Read committed' },
      { left: 'Reading one row twice and getting two values', right: 'MySQL repeatable read' },
      { left: 'Two read-modify-writes, one silently erased', right: 'Postgres repeatable read' },
      { left: 'Two doctors check, then both go off call', right: 'Serializable' },
    ],
    explain:
      "Read committed stops dirty reads. Both repeatable reads keep a row stable, but only Postgres's aborts the second of two updates to one row; MySQL's writes over it. Write skew needs serializable.",
  },

  /* ---------------------------------------------------------------- */
  /* db-engines                                                        */
  /* ---------------------------------------------------------------- */
  {
    id: 'db-engines-tf1',
    kind: 'truefalse',
    moduleId: 'db-engines',
    section: 'Amplification: the three costs',
    prompt:
      'In an [[LSM]] store, a queue table whose rows are deleted as soon as they are read stays as fast to read as an empty table.',
    answer: false,
    explain:
      'Each delete writes a tombstone that hides older entries until compaction removes it, so reading the head of the queue scans past thousands of them. That is why a queue modelled as a Cassandra table is a known anti-pattern.',
  },
  {
    id: 'db-engines-tf2',
    kind: 'truefalse',
    moduleId: 'db-engines',
    section: 'B-trees: pages, updated in place',
    prompt: 'Walking a B-tree index to one key in a table of billions of rows usually costs about one disk read.',
    answer: true,
    explain:
      'With a few hundred keys per page, four levels cover billions of rows, and the upper levels stay cached, so usually only the leaf page comes from disk. Fetching the row itself can cost one more, unless the index covers the query.',
  },
  {
    id: 'db-engines-multi',
    kind: 'multi',
    moduleId: 'db-engines',
    section: 'LSM trees: append, then merge',
    prompt: 'Compaction in a RocksDB store falls behind a heavy write load. Which of these follow?',
    options: [
      'Level 0 files pile up, so point reads check more files',
      'Overwritten and deleted data stays on disk, so space grows',
      'Writes are slowed, then stalled, until compaction catches up',
      'Recent writes are lost, because the memtable cannot be flushed',
      'Reads return old values for keys that were overwritten',
    ],
    correct: [0, 1, 2],
    explain:
      'Deferred merging shows up as read and space amplification, then as write stalls. Nothing is lost, since every write reaches the commit log first, and reads stay correct because they check the newest data first.',
  },
  {
    id: 'db-engines-match',
    kind: 'match',
    moduleId: 'db-engines',
    section: 'Amplification: the three costs',
    prompt: 'Match each workload to the storage choice that suits it best.',
    pairs: [
      { left: 'Read-heavy data on tight disk', right: 'Leveled compaction' },
      { left: 'Write-heavy data that is rarely read', right: 'Size-tiered compaction' },
      { left: 'Time series that expire by age', right: 'Time-window compaction' },
      { left: 'Relational data with ad hoc queries', right: 'A B-tree engine' },
    ],
    explain:
      'Leveled keeps space and read cost low by rewriting more. Size-tiered rewrites less but needs disk headroom. Time-window drops expired files whole. A B-tree, as in Postgres or InnoDB, serves reads and unplanned queries best.',
  },

  /* ---------------------------------------------------------------- */
  /* db-locking                                                        */
  /* ---------------------------------------------------------------- */
  {
    id: 'db-locking-tf1',
    kind: 'truefalse',
    moduleId: 'db-locking',
    section: 'Deadlocks and advisory locks',
    prompt:
      'A session-level Postgres advisory lock, taken with `pg_advisory_lock`, works safely behind PgBouncer in transaction-pooling mode.',
    answer: false,
    explain:
      'The lock belongs to the server connection, and your next statement may run on a different one, so the unlock misses and the lock sits on a connection someone else now uses. Behind a pooler, use `pg_advisory_xact_lock`.',
  },
  {
    id: 'db-locking-tf2',
    kind: 'truefalse',
    moduleId: 'db-locking',
    section: 'Pessimistic locks: make rivals wait',
    prompt:
      "In MySQL's InnoDB at its default isolation level, an `UPDATE` filtered on an unindexed column can lock every row in the table, not just the rows it changes.",
    answer: true,
    explain:
      'At repeatable read, InnoDB locks every index record it scans. With no index on the filter it scans the whole table, so it effectively locks the table. Index the column, or one small update blocks everyone.',
  },
  {
    id: 'db-locking-multi',
    kind: 'multi',
    moduleId: 'db-locking',
    section: '[[MVCC]]: versions instead of read locks',
    prompt: "In Postgres's [[MVCC]], which of these hold?",
    options: [
      'A plain `SELECT` never waits for an `UPDATE`',
      'A second `UPDATE` to the same row waits for the first to commit or roll back',
      'An `UPDATE` overwrites the old row version in place',
      'Every `UPDATE` leaves a dead row version for vacuum to reclaim',
      'Transaction ids are 64-bit, so rows never need freezing',
      "A reader can see another transaction's uncommitted version",
    ],
    correct: [0, 1, 3],
    explain:
      'Versions remove waiting between readers and writers, not between two writers of one row. An update writes a new version and leaves the old one dead. Transaction ids are 32-bit, so vacuum must also freeze old rows before they wrap.',
  },
  {
    id: 'db-locking-match',
    kind: 'match',
    moduleId: 'db-locking',
    section: 'Which one, when',
    prompt: 'Match each write path to the concurrency tool that fits it best.',
    pairs: [
      { left: 'Decrement stock only if any remains', right: 'An atomic `UPDATE … WHERE`' },
      { left: 'A wiki page someone edits for ten minutes', right: 'A version column' },
      { left: 'Many writers on one row; the decision needs app code', right: '`FOR UPDATE`, held briefly' },
      { left: 'Only one instance may run the nightly billing job', right: 'An advisory lock' },
      { left: 'Workers each claiming the next free job', right: '`FOR UPDATE SKIP LOCKED`' },
    ],
    explain:
      'Start from the cheapest correct tool: one statement when the rule fits a `WHERE`, a version when the work spans think time, a short lock for a contended row, an advisory lock when the thing guarded is not a row, and `SKIP LOCKED` so workers never block.',
  },

  /* ---------------------------------------------------------------- */
  /* db-replication                                                    */
  /* ---------------------------------------------------------------- */
  {
    id: 'db-replication-tf1',
    kind: 'truefalse',
    moduleId: 'db-replication',
    section: 'Lag anomalies, and their fixes',
    prompt: 'To give users read-your-writes with asynchronous followers, every read has to go to the leader.',
    answer: false,
    explain:
      "Only the user who just wrote needs care: send their reads to the leader for a few seconds, or carry the write's log position and read from a follower that has replayed past it. Everyone else reads any follower.",
  },
  {
    id: 'db-replication-tf2',
    kind: 'truefalse',
    moduleId: 'db-replication',
    section: 'When is a write acknowledged?',
    prompt:
      'If no replica acknowledges within the timeout, MySQL semi-synchronous replication falls back to asynchronous and the leader keeps accepting writes.',
    answer: true,
    explain:
      'The default timeout is ten seconds. Writes keep flowing, but the no-loss guarantee lapses during exactly the incident you bought it for, so alert on the fallback, or raise the timeout so the leader stalls instead.',
  },
  {
    id: 'db-replication-multi',
    kind: 'multi',
    moduleId: 'db-replication',
    section: 'Failover and split brain',
    prompt: 'Which of these defend against split brain after a failover?',
    options: [
      'Deciding the failover by majority in a consensus store such as etcd',
      'Fencing: rejecting writes stamped with an older epoch',
      'A leader that cannot reach the majority stops taking writes',
      'A faster health check with a shorter timeout',
      'More asynchronous replicas in other regions',
      'Merging the two sides afterwards with last write wins',
    ],
    correct: [0, 1, 2],
    explain:
      'Split brain is two nodes both accepting writes. A majority decision lets only one side promote, and fencing rejects the old leader\'s late writes. A health check cannot tell dead from slow, and last write wins silently discards one side.',
  },
  {
    id: 'db-replication-match',
    kind: 'match',
    moduleId: 'db-replication',
    section: 'Quorums',
    prompt: 'A leaderless store keeps `N = 3` copies of each key. Match each setting to how it behaves.',
    pairs: [
      { left: '`W = 3, R = 1`', right: 'Fast reads; one dead replica blocks writes' },
      { left: '`W = 1, R = 3`', right: 'Fast writes; one dead replica blocks reads' },
      { left: '`W = 2, R = 2`', right: 'Reads overlap writes, with one replica down' },
      { left: '`W = 1, R = 1`', right: 'Survives two dead replicas; reads may be stale' },
    ],
    explain:
      'Needing every replica on one side makes that side fail with a single dead node. `W + R > N` guarantees overlap: two and two keeps it while tolerating one failure, and one and one gives it up for availability.',
  },

  /* ---------------------------------------------------------------- */
  /* db-choosing                                                       */
  /* ---------------------------------------------------------------- */
  {
    id: 'db-choosing-tf1',
    kind: 'truefalse',
    moduleId: 'db-choosing',
    section: 'Adding a store without losing the truth',
    prompt:
      'A request handler that writes to Postgres and then to Elasticsearch keeps the two in step, as long as each write is retried on failure.',
    answer: false,
    explain:
      'A crash between the writes, or a retry that never succeeds, leaves them disagreeing with nothing to reconcile them. Write only to Postgres and stream committed changes out with [[CDC]], so the index can always be rebuilt from the log.',
  },
  {
    id: 'db-choosing-tf2',
    kind: 'truefalse',
    moduleId: 'db-choosing',
    section: 'Seven families, each with a trap',
    prompt: 'When the questions are only one or two hops deep, a graph database is a second system bought for nothing.',
    answer: true,
    explain:
      'A join or a reversed index answers one or two hops in any store. A graph database earns its place on traversals of unknown depth, such as whether a new account sits within four hops of a known fraudster.',
  },
  {
    id: 'db-choosing-multi',
    kind: 'multi',
    moduleId: 'db-choosing',
    section: 'Signals that justify leaving',
    prompt: 'Which of these justify adding a second store beside Postgres, or moving off it?',
    options: [
      'Sustained writes past one primary, after batching and indexes are tuned',
      'Users on three continents need low-latency local writes',
      'Fraud checks that walk an unknown number of hops between accounts',
      'Chat messages are unstructured text',
      'Records are JSON documents queried by fields inside them',
      'Shops must be found within a radius of the user',
    ],
    correct: [0, 1, 2],
    explain:
      'Each right answer is a number or a query shape Postgres handles badly. Unstructured text fits any store, `jsonb` with [[GIN]] indexes serves field queries, and [[PostGIS]] does radius search.',
  },
  {
    id: 'db-choosing-match',
    kind: 'match',
    moduleId: 'db-choosing',
    section: 'Seven families, each with a trap',
    prompt: 'Match each family of database to its trap.',
    pairs: [
      { left: 'Document', right: 'Joins move into application code' },
      { left: 'Key-value', right: 'Any question other than get-by-key' },
      { left: 'Wide-column', right: 'Deletes leave tombstones that slow reads' },
      { left: 'Time-series', right: 'High-cardinality labels explode memory' },
      { left: 'Search', right: 'Not transactional, so not the source of truth' },
    ],
    explain:
      'Each family gives up the relational planner for one strength, and its trap is what it cannot serve: relationships for documents, anything but the key for key-value, deletes for [[LSM]]-based wide-column stores, label cardinality for time series.',
  },

  /* ---------------------------------------------------------------- */
  /* db-nosql-modelling                                                */
  /* ---------------------------------------------------------------- */
  {
    id: 'db-nosql-modelling-tf1',
    kind: 'truefalse',
    moduleId: 'db-nosql-modelling',
    section: 'Hot partitions and write sharding',
    prompt:
      'In DynamoDB, a global secondary index that cannot keep up with writes slows queries on that index, but never writes to the base table.',
    answer: false,
    explain:
      'A throttled [[GSI]] pushes back on the base table, so a hot `PENDING` index key would stop customers placing orders. That is why the warehouse key is write-sharded across ten partitions.',
  },
  {
    id: 'db-nosql-modelling-tf2',
    kind: 'truefalse',
    moduleId: 'db-nosql-modelling',
    section: 'Cassandra: one table per query',
    prompt:
      'Partitioning a Cassandra messages table by channel alone lets one busy channel grow a partition without bound, so the key needs a time bucket too.',
    answer: true,
    explain:
      'A Cassandra partition should stay under roughly 100 [[MB]]. Discord keys by channel plus a 10-day bucket, so recent history touches one or two partitions and no partition grows forever.',
  },
  {
    id: 'db-nosql-modelling-multi',
    kind: 'multi',
    moduleId: 'db-nosql-modelling',
    section: 'Keys from queries',
    prompt:
      'A DynamoDB table keys each order as `PK = ORDER#<id>`, with `SK` of `HEADER` or `ITEM#<n>`. Which can one `Query` on the base table answer?',
    options: [
      "An order's header together with all its lines",
      "An order's lines only, using `begins_with` on the sort key",
      'One named line of one order',
      "A customer's orders, newest first",
      'Every order placed today',
      'Every order that contains a given product',
    ],
    correct: [0, 1, 2],
    explain:
      'A `Query` names exactly one partition key value and may narrow the sort key. Anything spanning many orders crosses partitions, so it needs an index keyed for it, or an analytics copy of the data.',
  },
  {
    id: 'db-nosql-modelling-match',
    kind: 'match',
    moduleId: 'db-nosql-modelling',
    section: 'Hot partitions and write sharding',
    prompt: 'Match each modelling problem to the technique that solves it.',
    pairs: [
      { left: '3,000 writes a second on one `PENDING` key', right: 'Write sharding with `hash % 10`' },
      { left: 'Shipped orders clutter the warehouse index', right: 'A sparse index' },
      { left: "A customer's orders sit under many partitions", right: 'A global secondary index' },
      { left: 'Cassandra users need messages by author too', right: 'A second table, written alongside' },
    ],
    explain:
      'Spread a hot key over suffixes, drop items from an index by removing its key attribute, add an index for a pattern that crosses partitions, and in Cassandra give each query its own table.',
  },
]
