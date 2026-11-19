import type { Problem } from '../types'

export const lldLru: Problem = {
  id: 'lld-lru',
  title: 'Design an LRU cache',
  kind: 'lld',
  category: 'lld-components',
  difficulty: 'medium',
  brief:
    'Implement a cache that holds a fixed number of entries and evicts the least recently used one when it is full. Reads and writes must both be constant time.',
  patterns: ['decorator', 'strategy'],
  suggests: ['l-modelling', 'l-concurrency', 'dp-decorator-composite', 'c-caching'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Chose a hash map plus a doubly linked list and said why neither works alone' },
    { id: 'r2', bar: 'must', criterion: 'Implemented get and put in O(1), promoting the entry on both' },
    { id: 'r3', bar: 'must', criterion: 'Stored the key in each node so eviction can delete the map entry' },
    { id: 'r4', bar: 'must', criterion: 'Updated an existing key without evicting anything' },
    { id: 'r5', bar: 'senior', criterion: 'Used sentinel head and tail nodes to remove the edge-case branches' },
    { id: 'r6', bar: 'senior', criterion: 'Made it generic and put it behind a small cache interface' },
    { id: 'r7', bar: 'senior', criterion: 'Explained why a read-write lock is wrong for an LRU cache' },
    { id: 'r8', bar: 'senior', criterion: 'Added expiry lazily with an injected clock, without touching the core' },
    { id: 'r9', bar: 'staff', criterion: 'Proposed sharding or buffered recency to cut lock contention, and named what it costs' },
    { id: 'r10', bar: 'staff', criterion: 'Ran eviction callbacks outside the lock' },
    { id: 'r11', bar: 'staff', criterion: 'Raised sizing by weight instead of by entry count' },
  ],
  followups: [
    {
      q: 'Make the eviction policy pluggable: LRU today, LFU tomorrow.',
      a: 'Split storage from policy. The cache keeps a `Map<K, V>` and tells an `EvictionPolicy<K>` about every access, insert and removal, then asks it for a victim when full; the linked list you just wrote becomes `LruPolicy`. An O(1) [[LFU]] policy keeps a map from access count to a linked list of keys, plus the current minimum count, so eviction stays constant time.',
    },
    {
      q: 'Ten million gets a second across 32 cores. What breaks first?',
      a: 'The single lock, because every get takes it: every get reorders. Shard into independent caches by key hash, so contention divides by the shard count and recency becomes per shard. Past that, do what Caffeine does: a concurrent map for lookups and recency recorded in lossy buffers that are replayed in batches, because an approximate order is fine for a cache and a contended lock is not.',
    },
    {
      q: 'Two callers miss on the same key at once and both load it from the database.',
      a: 'That is a stampede, and the fix sits in a loading layer above this cache: keep a map of in-flight loads from key to promise, so the second caller awaits the first one\'s load instead of starting its own. Delete the entry when the load settles, on failure as well, or one error poisons the key. Go\'s `singleflight` package is exactly this.',
    },
    {
      q: 'Values range from 100 bytes to 10 MB. Is an entry count still the right capacity?',
      a: 'No: a thousand entries could be 100 [[KB]] or 10 [[GB]]. Take a weigher function and a byte budget, and evict from the tail until the total fits, which can mean several evictions for one put. Reject a single value larger than a fraction of the whole budget, or one 10 [[MB]] put empties the cache.',
    },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'prose',
      text: 'This is half data-structures question, half design question, and the interviewer grades both. Get the structure right in the first ten minutes, then spend the rest on what makes it a component another team could use: generics, a small interface, thread safety, expiry.',
    },
    {
      kind: 'list',
      items: [
        '`get(key)` returns the value or nothing, and marks the entry most recently used.',
        '`put(key, value)` inserts or updates, marks the entry most recently used, and evicts the least recently used entry if the cache is over capacity.',
        'Capacity is fixed at construction and counted in entries.',
        'Generic over key and value types.',
        'Later in the interview: safe to share between threads, and an optional time to live per entry.',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional: **both operations O(1)**: expected constant time for the hash lookup, constant time for the list work, never O(log n) and never a scan. No allocation on a hit. Predictable behaviour when many threads hit it at once.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: '"A hash map gives me O(1) lookup but no order. A linked list gives me O(1) reordering but no lookup. I need both, so the map points into the list."',
    },

    { kind: 'heading', text: 'Core objects' },
    {
      kind: 'list',
      items: [
        '`Cache<K, V>`: the interface callers depend on. Three methods and a size.',
        '`LRUCache<K, V>`: the [[LRU]] implementation. Owns the index and the list.',
        '`Node<K, V>`: key, value, prev, next. It stores the **key** as well, because eviction starts from a node and must delete its map entry.',
        'Two **sentinel** nodes, head and tail, that never hold data. Head\'s neighbour is the newest entry and tail\'s the oldest.',
      ],
    },
    {
      kind: 'figure',
      caption: 'Recency order lives in a doubly linked list; the map jumps straight into it.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'head', sub: 'sentinel', tone: 'neutral' },
          { label: 'C', sub: 'just read', tone: 'mastered' },
          { label: 'A' },
          { label: 'B', sub: 'evicted next', tone: 'alert' },
          { label: 'tail', sub: 'sentinel', tone: 'neutral' },
        ],
        note: 'The map holds a pointer to every node. A hit unlinks its node and relinks it after head: six pointer writes, whatever the size.',
      },
    },

    { kind: 'heading', text: 'Classes and relationships' },
    {
      kind: 'figure',
      caption: 'One small interface. The core is single-threaded, and thread safety is a wrapper around it.',
      figure: {
        kind: 'classes',
        classes: [
          {
            name: 'Cache<K, V>',
            stereotype: 'interface',
            fields: ['readonly size: number'],
            methods: ['get(key: K): V | undefined', 'put(key: K, value: V): void', 'delete(key: K): boolean'],
            tone: 'line',
          },
          {
            name: 'LRUCache<K, V>',
            fields: ['capacity: number', 'index: Map<K, Node<K, V>>', 'head, tail: Node<K, V>'],
            methods: ['get(key)', 'put(key, value)', 'delete(key)'],
          },
          { name: 'Node<K, V>', fields: ['key: K', 'value: V', 'prev, next: Node<K, V>'] },
          {
            name: 'SynchronizedCache<K, V>',
            fields: ['inner: Cache<K, V>', 'lock: Mutex'],
            methods: ['get(key)', 'put(key, value)'],
          },
        ],
        relations: [
          { from: 'LRUCache<K, V>', to: 'Cache<K, V>', kind: 'implements' },
          { from: 'SynchronizedCache<K, V>', to: 'Cache<K, V>', kind: 'implements' },
          { from: 'LRUCache<K, V>', to: 'Node<K, V>', kind: 'has', label: 'index and list' },
          { from: 'SynchronizedCache<K, V>', to: 'Cache<K, V>', kind: 'has', label: 'wraps' },
        ],
        note: 'Sentinels mean there is never a null check when linking at either end.',
      },
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Java\'s `LinkedHashMap` is exactly this structure: a hash table whose entries are also threaded on a doubly linked list. Construct it with `accessOrder = true`, override `removeEldestEntry` to return `size() > capacity`, and the standard library hands you an LRU cache.',
    },

    { kind: 'heading', text: 'Key methods' },
    {
      kind: 'code',
      caption: 'The skeleton: an index, two sentinels, a capacity.',
      code: `class Node<K, V> {
  prev!: Node<K, V>
  next!: Node<K, V>
  constructor(public key: K, public value: V) {}
}

class LRUCache<K, V> implements Cache<K, V> {
  private index = new Map<K, Node<K, V>>()
  // head.next is the newest entry, tail.prev the oldest.
  private head = new Node<K, V>(null!, null!)
  private tail = new Node<K, V>(null!, null!)

  constructor(private capacity: number) {
    if (capacity < 1) throw new RangeError('capacity < 1')
    this.head.next = this.tail
    this.tail.prev = this.head
  }

  get size(): number { return this.index.size }
}`,
    },
    {
      kind: 'code',
      caption: 'Both operations promote. Only an insert can evict.',
      code: `get(key: K): V | undefined {
  const node = this.index.get(key)
  if (!node) return undefined
  this.unlink(node)
  this.pushFront(node) // a read is a write
  return node.value
}

put(key: K, value: V): void {
  const hit = this.index.get(key)
  if (hit) {
    hit.value = value
    this.unlink(hit)
    this.pushFront(hit)
    return // an update never evicts
  }
  if (this.index.size >= this.capacity) {
    const oldest = this.tail.prev
    this.unlink(oldest)
    this.index.delete(oldest.key) // why nodes keep their key
  }
  const node = new Node(key, value)
  this.index.set(key, node)
  this.pushFront(node)
}`,
    },
    {
      kind: 'code',
      caption: 'Delete, and the pointer work. Sentinels make both helpers branch-free.',
      code: `delete(key: K): boolean {
  const node = this.index.get(key)
  if (!node) return false
  this.unlink(node)
  return this.index.delete(key)
}

private unlink(n: Node<K, V>): void {
  n.prev.next = n.next
  n.next.prev = n.prev
}

private pushFront(n: Node<K, V>): void {
  n.prev = this.head
  n.next = this.head.next
  this.head.next.prev = n
  this.head.next = n
}`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Forgetting the key in the node. Eviction starts at `tail.prev` and has to delete the map entry, and without the key it cannot find it. Candidates discover this with five minutes left, and the fix touches every constructor call.',
    },
    {
      kind: 'callout',
      tone: 'note',
      text: 'In JavaScript a `Map` iterates in insertion order, so delete-and-reinsert plus `map.keys().next()` is a working LRU in ten lines. Say so, then build the list anyway: the interviewer is asking whether you know why it works, and a Java `HashMap` gives you no order at all.',
    },

    { kind: 'heading', text: 'Patterns and extensibility' },
    {
      kind: 'prose',
      text: 'The extension everyone asks for is expiry: entries with a time to live ([[TTL]]). The tempting move is to put an `expiresAt` on the node and a clock call in `get`. The better one leaves the core alone and wraps it, because expiry is a separate reason to change.',
    },
    {
      kind: 'codeCompare',
      before: {
        title: 'Locking and expiry baked into the core',
        code: `class LRUCache<K, V> {
  private lock = new Mutex()
  get(key: K): V | undefined {
    return this.lock.run(() => {
      const n = this.index.get(key)
      if (!n) return undefined
      if (Date.now() >= n.expiresAt) {
        this.remove(n)
        return undefined
      }
      this.moveToFront(n)
      return n.value
    })
  }
  // put() and delete() repeat the lock and the clock
}`,
      },
      after: {
        title: 'A decorator with an injected clock',
        code: `type Stamped<V> = { value: V; until: number }

class ExpiringCache<K, V> implements Cache<K, V> {
  constructor(private inner: Cache<K, Stamped<V>>,
              private ttlMs: number,
              private now: () => number = Date.now) {}

  get(key: K): V | undefined {
    const e = this.inner.get(key)
    if (!e) return undefined
    if (this.now() >= e.until) {
      this.inner.delete(key) // lazy expiry
      return undefined
    }
    return e.value
  }

  put(key: K, value: V): void {
    const until = this.now() + this.ttlMs
    this.inner.put(key, { value, until })
  }
  // delete() and size simply forward to inner
}`,
      },
      note: '`new SynchronizedCache(new ExpiringCache(new LRUCache(n), ttl))`. The order is a decision: one lock around both layers, so expiry and eviction cannot interleave.',
    },
    {
      kind: 'prose',
      text: 'Lazy expiry means an expired entry occupies a slot until someone reads it or it drifts to the tail, which in an LRU cache it does on its own, because nobody is reading it. Redis makes the same trade: keys expire when touched, plus a background pass that samples keys with a time to live and deletes the expired ones. Add a sweep only if memory, not correctness, demands it.',
    },

    { kind: 'heading', text: 'Concurrency and edge cases' },
    {
      kind: 'prose',
      text: 'The trap: "reads do not modify anything, so use a read-write lock." In an LRU cache **every `get` moves a node, so a read is a write**. The Java documentation says it outright: in an access-ordered `LinkedHashMap`, merely querying with `get` is a structural modification. Two unlocked gets on neighbouring nodes are enough to break the list. In Node a synchronous `get` runs to completion, so this is a threaded-runtime bug: read `Mutex` as Java\'s `synchronized`.',
    },
    {
      kind: 'figure',
      caption: 'Two unlocked gets on neighbouring nodes. Each rewires from a stale view, and the forward links end in a loop.',
      figure: {
        kind: 'sequence',
        actors: ['Thread A', 'List', 'Thread B'],
        steps: [
          { from: 0, to: 1, label: 'unlink x: head.next = y' },
          { from: 2, to: 1, label: 'unlink y: reads y.prev = x' },
          { from: 0, to: 1, label: 'y.prev = head' },
          { from: 2, to: 1, label: 'x.next = z (stale view)', tone: 'alert' },
          { from: 0, to: 1, label: 'push x to front' },
          { from: 2, to: 1, label: 'push y to front' },
          { from: 1, to: 1, label: 'forward links: y → x → y', tone: 'alert' },
        ],
        note: 'Nothing throws. The damage surfaces later: a walk that never ends, or an eviction that cuts live entries loose.',
      },
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'A read-write lock',
          text: 'Looks like an optimisation and is a bug: two "readers" both reorder the list at once, which is the figure above.',
        },
        {
          grade: 'good',
          title: 'One mutex around the core',
          text: 'Correct and simple. Every operation serialises, which is fine until many cores hammer it, and then the lock is the bottleneck.',
        },
        {
          grade: 'great',
          title: 'Shards: N independent caches by key hash',
          text: 'Sixteen shards, sixteen locks, contention divided by about sixteen. Recency becomes per shard, so eviction is approximately global LRU, a difference callers rarely notice in hit rate.',
        },
        {
          grade: 'best',
          title: 'Concurrent map plus buffered recency',
          text: 'What Caffeine does: lookups go to a concurrent hash map and never wait on the order, reads are logged to striped buffers and replayed into the list under a try-lock in batches, and a full buffer simply drops the event. Use the library in production; in the interview, code the mutex and describe this.',
        },
      ],
    },
    {
      kind: 'code',
      caption: 'The wrapper is the whole of thread safety, like Collections.synchronizedMap.',
      code: `class SynchronizedCache<K, V> implements Cache<K, V> {
  private lock = new Mutex()
  constructor(private inner: Cache<K, V>) {}
  get(key: K) { return this.lock.run(() => this.inner.get(key)) }
  put(key: K, v: V) { this.lock.run(() => this.inner.put(key, v)) }
  delete(key: K) {
    return this.lock.run(() => this.inner.delete(key))
  }
  get size() { return this.lock.run(() => this.inner.size) }
}`,
    },
    {
      kind: 'list',
      items: [
        '**Capacity below one.** Reject it at construction. A capacity of one must still evict on the second distinct key.',
        '**Updating an existing key.** It promotes and never evicts; checking capacity before checking for a hit is the classic bug.',
        '**Storing `undefined`.** A hit becomes indistinguishable from a miss. Forbid it, or return a result type that says which.',
        '**Eviction callbacks.** Collect the evicted entries inside the lock and call listeners after releasing it, or one slow listener closing a file stalls every caller.',
      ],
    },
  ],
}
