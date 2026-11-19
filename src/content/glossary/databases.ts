import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the databases content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: 'ER',
    full: 'Entity–Relationship',
    gist: 'A model of the things a system tracks and how they relate, with a cardinality on every relationship. It maps mechanically onto tables: entities become tables, one-to-many becomes a foreign key, many-to-many becomes a join table.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Customer', sub: 'entity', to: 'places · 1 to many' },
        { label: 'Order', sub: 'entity', tone: 'line', to: 'contains · many to many' },
        { label: 'Product', sub: 'entity' },
      ],
      note: 'The many-to-many line becomes a table of its own, order_items, holding both keys and the quantity.',
    },
    caption: 'Entities as boxes, relationships as labelled lines. The cardinality says where each foreign key goes.',
    seeAlso: ['SQL', '1NF'],
  },
  {
    id: '1NF',
    full: 'First Normal Form',
    gist: 'Every column holds a single value and every row has a key: no lists packed into a cell, no repeating groups of columns. It is what makes a value something you can filter, index and constrain.',
    figure: {
      kind: 'grid',
      cols: 3,
      cells: [
        { label: 'order' }, { label: 'product' }, { label: 'qty' },
        { label: '1001', tone: 'line' }, { label: 'kettle', tone: 'mastered' }, { label: '2' },
        { label: '1001', tone: 'line' }, { label: 'mug', tone: 'mastered' }, { label: '1' },
        { label: '1001', tone: 'line' }, { label: 'lamp', tone: 'mastered' }, { label: '1' },
      ],
      legend: [
        { tone: 'line', label: 'repeats — part of the key' },
        { tone: 'mastered', label: 'one value per cell' },
      ],
      note: 'Before: a single items cell held "kettle ×2, mug, lamp", which nothing could index or check.',
    },
    caption: 'A list in a cell, split into one row per value and keyed by order and product.',
    seeAlso: ['2NF', 'ER'],
  },
  {
    id: '2NF',
    full: 'Second Normal Form',
    gist: 'First normal form, plus no column that depends on only part of a composite key. A product name stored on an order line depends on the product alone, so it belongs in the products table.',
    figure: {
      kind: 'split',
      left: {
        title: 'Depends on the whole key',
        tone: 'mastered',
        nodes: [
          { label: 'order_id + product_id', to: 'determines' },
          { label: 'quantity', tone: 'mastered' },
        ],
        cost: 'Stays on the order line.',
      },
      right: {
        title: 'Depends on part of it',
        tone: 'alert',
        nodes: [
          { label: 'product_id', to: 'determines' },
          { label: 'product_name', sub: 'move to products', tone: 'alert' },
        ],
        cost: 'Stored on every line, so a rename must touch them all.',
      },
    },
    caption: 'A partial dependency: half the key is enough to determine the column, so the column is in the wrong table.',
    seeAlso: ['1NF', '3NF'],
  },
  {
    id: '3NF',
    full: 'Third Normal Form',
    gist: 'Second normal form, plus no column that depends on another non-key column. An order\'s customer email depends on the customer, not on the order, so it lives with the customer and is stored once.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'order_id', sub: 'the key', tone: 'line', to: 'determines' },
        { label: 'customer_id', to: 'determines' },
        { label: 'customer_email', sub: 'a fact about the customer', tone: 'alert' },
      ],
      note: 'The email reaches the order only through the customer: a transitive dependency.',
    },
    caption: 'Nothing but the key: a column that hangs off another non-key column moves to that column\'s own table.',
    seeAlso: ['2NF', 'BCNF'],
  },
  {
    id: 'BCNF',
    full: 'Boyce–Codd Normal Form',
    gist: 'Every column that determines another must be a candidate key. It tightens third normal form for the rare table with overlapping keys, and the price is that some rules can no longer be enforced by a single constraint.',
    figure: {
      kind: 'split',
      left: {
        title: '3NF, not BCNF',
        tone: 'alert',
        nodes: [
          { label: 'manager', sub: 'not a key', to: 'determines' },
          { label: 'product_line', sub: 'part of a key', tone: 'alert' },
        ],
        cost: 'Moving a manager to another line means updating every row they appear in.',
      },
      right: {
        title: 'BCNF',
        tone: 'mastered',
        nodes: [
          { label: 'managers', sub: 'manager, product_line', to: 'referenced by' },
          { label: 'assignments', sub: 'customer_id, manager', tone: 'mastered' },
        ],
        cost: 'Each fact stored once, but "one manager per customer per line" now spans two tables.',
      },
    },
    caption: 'A non-key column that determines part of a key, decomposed so every determinant is a key.',
    seeAlso: ['3NF', 'ER'],
  },
  {
    id: 'MVCC',
    full: 'Multi-Version Concurrency Control',
    gist: 'Writers add a new version of a row instead of overwriting it, and each transaction reads the versions that were committed when its snapshot was taken. Readers never wait for writers; the price is old versions that something must clean up.',
    figure: {
      kind: 'timeline',
      ticks: ['t0', 't1', 't2', 't3'],
      lanes: [
        {
          label: 'Row 42',
          bars: [
            { from: 0, to: 0.5, label: 'v1: 100', tone: 'neutral' },
            { from: 0.5, to: 1, label: 'v2: 40', tone: 'line' },
          ],
        },
        {
          label: 'Writer',
          bars: [{ from: 0.4, to: 0.5, label: 'v2', tone: 'line' }],
          outcome: { label: 'commits v2', tone: 'line' },
        },
        {
          label: 'Reader, snapshot at t1',
          bars: [{ from: 0.33, to: 0.95, label: 'sees v1', tone: 'mastered' }],
          outcome: { label: 'never blocked', tone: 'mastered' },
        },
      ],
    },
    caption: 'The writer adds v2 while a reader that started earlier keeps seeing v1. Nobody waits for anybody.',
    seeAlso: ['ACID', 'OCC'],
  },
  {
    id: 'WAL',
    full: 'Write-Ahead Log',
    gist: 'An append-only file where every change is recorded, and flushed on commit, before the data pages it describes are written. It is what makes a commit durable and crash recovery possible, and in Postgres, replicas and change data capture read the same log.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Transaction', to: '1 · append' },
        { label: 'Log', sub: 'fsync on commit', tone: 'line', to: '2 · reply' },
        { label: 'Commit ok', tone: 'mastered', to: '3 · later' },
        { label: 'Data pages', sub: 'written at checkpoint' },
      ],
      note: 'After a crash, recovery replays the log to bring the data pages up to date.',
    },
    caption: 'The log is written first and flushed on commit; data pages catch up later.',
    seeAlso: ['ACID', 'CDC'],
  },
  {
    id: 'LSM',
    full: 'Log-Structured Merge tree',
    gist: 'A storage engine that buffers writes in a sorted in-memory table, flushes it to disk as immutable sorted files, and merges those files in the background. Writes become sequential appends; reads may have to check several files.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Write', to: 'insert' },
        { label: 'Memtable', sub: 'sorted, in memory', tone: 'line', to: 'flush when full' },
        { label: 'SSTable', sub: 'sorted, immutable file', to: 'merge later' },
        { label: 'Compaction', sub: 'drops old versions', tone: 'mastered' },
      ],
      note: 'Used by RocksDB, Cassandra, HBase and Bigtable. Postgres and InnoDB use B-trees instead.',
    },
    caption: 'Nothing is updated in place: writes land in memory, flush as sorted files, and are merged in the background.',
    seeAlso: ['WAL', 'SSD'],
  },
]
