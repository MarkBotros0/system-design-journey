import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the databases2 content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: 'MVCC',
    full: 'Multi-Version Concurrency Control',
    gist: 'The database keeps several versions of a row instead of overwriting it, and each transaction reads from a snapshot. It is why readers and writers do not block each other in Postgres, MySQL and Oracle, and why something has to vacuum the old versions away.',
    figure: {
      kind: 'timeline',
      ticks: ['snapshot taken', 'writer commits', 'reader done'],
      lanes: [
        {
          label: 'Writer',
          bars: [{ from: 0.15, to: 0.5, label: 'writes version 2', tone: 'line' }],
          outcome: { label: 'committed', tone: 'mastered' },
        },
        {
          label: 'Reader',
          bars: [{ from: 0, to: 1, label: 'reads version 1 throughout', tone: 'neutral' }],
          outcome: { label: 'never waited', tone: 'mastered' },
        },
      ],
      note: 'Version 1 stays on disk until no snapshot can see it. Then vacuum reclaims it.',
    },
    caption: 'The writer adds a version; the reader keeps its snapshot. Neither waits for the other.',
    seeAlso: ['OCC', 'WAL', 'ACID'],
  },
  {
    id: 'WAL',
    full: 'Write-Ahead Log',
    gist: 'An append-only log that every change is written to before the data files are touched. After a crash the database replays it to recover; replicas replay the same log to stay in sync, and change data capture reads it to stream changes out.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Commit', sub: 'one transaction', to: 'append, then fsync' },
        { label: 'Write-ahead log', sub: 'sequential and durable', tone: 'line', to: 'replayed into' },
        { label: 'Data files, replicas, change streams', sub: 'all derived from the log', tone: 'mastered' },
      ],
      note: 'The commit is durable the moment its log record is on disk. The data pages can catch up later.',
    },
    caption: 'Write the log first, sequentially. Everything else can be rebuilt from it.',
    seeAlso: ['CDC', 'MVCC', 'LSM'],
  },
  {
    id: 'LSM',
    full: 'Log-Structured Merge tree',
    gist: 'A storage engine that buffers writes in memory, flushes them to disk as sorted immutable files, and merges those files in the background. Writes become cheap sequential appends, which is why Cassandra, ScyllaDB and RocksDB absorb huge write rates. Reads may check several files, and deletes leave tombstones until compaction removes them.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Write', sub: 'plus a commit log for crashes', to: 'insert' },
        { label: 'Memtable', sub: 'sorted, in memory', tone: 'line', to: 'flush when full' },
        { label: 'Sorted files on disk', sub: 'immutable, newest first', to: 'compaction' },
        { label: 'Fewer, larger files', sub: 'old versions and tombstones dropped', tone: 'mastered' },
      ],
    },
    caption: 'Writes only ever append. Background merging pays the tidying cost later.',
    seeAlso: ['WAL', 'SSD'],
  },
  {
    id: 'OLTP',
    full: 'Online Transaction Processing',
    gist: 'The workload of a running product: many small reads and writes, each touching a few rows by key, inside transactions. Row-oriented databases like Postgres are built for it. Scanning a year of data for a report is the opposite workload and belongs in an analytics store.',
    figure: {
      kind: 'split',
      left: {
        title: 'Transactional',
        tone: 'line',
        nodes: [
          { label: 'Many small queries', sub: 'one order, one user', to: 'each touches' },
          { label: 'A few whole rows', tone: 'line' },
        ],
        cost: 'Row store: Postgres, MySQL.',
      },
      right: {
        title: 'Analytical',
        tone: 'mastered',
        nodes: [
          { label: 'Few large queries', sub: 'revenue by month', to: 'each scans' },
          { label: 'Millions of rows, a few columns', tone: 'mastered' },
        ],
        cost: 'Column store: ClickHouse, BigQuery.',
      },
      verdict: 'Same data, opposite access patterns. That is why they end up in different databases.',
    },
    caption: 'Transactional work against analytical work.',
    seeAlso: ['OLAP', 'ACID'],
  },
  {
    id: 'RPO',
    full: 'Recovery Point Objective',
    gist: 'How much recently committed data you can afford to lose in a failure, measured in time. Asynchronous replication gives an RPO equal to the replication lag; synchronous replication gives zero, paid for on every commit.',
    figure: {
      kind: 'timeline',
      ticks: ['last safe copy', 'failure', 'service back'],
      lanes: [
        {
          label: 'Data',
          bars: [{ from: 0, to: 0.5, label: 'lost: the RPO', tone: 'alert' }],
        },
        {
          label: 'Service',
          bars: [{ from: 0.5, to: 1, label: 'down: the RTO', tone: 'streak' }],
        },
      ],
      note: 'Looking back from the failure is the RPO. Looking forward to recovery is the RTO.',
    },
    caption: 'The two numbers that describe a failure: data lost, and time down.',
    seeAlso: ['RTO', 'SLA'],
  },
  {
    id: 'RTO',
    full: 'Recovery Time Objective',
    gist: 'How long the service may be down after a failure. Automatic failover to a replica gets you back in about a minute; restoring from a backup takes hours. The RTO you promise decides which one you have to build.',
    figure: {
      kind: 'scale',
      items: [
        { label: 'Automatic failover to a replica', display: 'about a minute', value: 60, tone: 'mastered' },
        { label: 'Manual failover, someone paged', display: 'tens of minutes', value: 1800, tone: 'streak' },
        { label: 'Restore from backup', display: 'hours', value: 14400, tone: 'alert' },
      ],
      note: 'Each step down is roughly an order of magnitude slower.',
    },
    caption: 'Recovery strategies sit orders of magnitude apart, so the promised RTO picks the strategy.',
    seeAlso: ['RPO', 'SLA'],
  },
]
