import type { Problem } from '../types'

export const lldRateLimiter: Problem = {
  id: 'lld-rate-limiter',
  title: 'Design a rate limiter library',
  kind: 'lld',
  category: 'lld-components',
  difficulty: 'hard',
  brief:
    'Design a rate limiting library that other teams will embed in their services. It should support more than one algorithm, and some teams want their limits shared across a fleet.',
  patterns: ['strategy', 'adapter', 'decorator'],
  suggests: ['dp-strategy-state', 'p-dip', 'l-concurrency', 'l-extension', 'dp-adapter-facade-proxy'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Defined the caller\'s contract: a decision with remaining and retry-after, not an exception' },
    { id: 'r2', bar: 'must', criterion: 'Made the algorithm a strategy, with token bucket and sliding window as implementations' },
    { id: 'r3', bar: 'must', criterion: 'Kept state per key and explained the token bucket arithmetic, including lazy refill' },
    { id: 'r4', bar: 'must', criterion: 'Injected a clock so tests advance time instead of sleeping' },
    { id: 'r5', bar: 'senior', criterion: 'Put state behind a store interface so in-memory and Redis are interchangeable' },
    { id: 'r6', bar: 'senior', criterion: 'Explained why read-modify-write races even in single-threaded Node' },
    { id: 'r7', bar: 'senior', criterion: 'Made the write a compare-and-set on a version, with bounded retries' },
    { id: 'r8', bar: 'senior', criterion: 'Bounded memory by expiring keys idle long enough to have fully refilled' },
    { id: 'r9', bar: 'senior', criterion: 'Clamped elapsed time against clocks that step backwards' },
    { id: 'r10', bar: 'staff', criterion: 'Weighed generic compare-and-set against a Lua script per algorithm: round trips versus writing each algorithm twice' },
    { id: 'r11', bar: 'staff', criterion: 'Made fail-open or fail-closed configurable, degrading to a local limit divided by fleet size' },
    { id: 'r12', bar: 'staff', criterion: 'Used the store\'s clock for shared limits so skew between hosts cannot refill buckets early' },
  ],
  followups: [
    {
      q: 'Redis adds a round trip to every request. Can you avoid it?',
      a: 'Lease tokens. Each host takes a batch, say 10, from the shared bucket in one call and spends them locally, going back only when the lease runs out. Up to one lease per host can be spent beyond the limit at a boundary, so lease size is a dial between round trips and overshoot. For limits in the thousands per second that trade is almost always right.',
    },
    {
      q: 'A customer gets 1,000 requests a minute and at most 50 in any one second. One limiter or two?',
      a: 'Two limits behind one `Limiter`: a composite that allows only if every child allows. The catch is consumption. If the per-second check denies, the per-minute bucket must not have spent a token, so decide on all of them before consuming from any. Shared, that means one Lua script touching both keys, hash-tagged so they land on the same cluster slot; most hand-rolled versions quietly overcharge here.',
    },
    {
      q: 'How do you test "100 per minute"?',
      a: 'With a fake clock. Make 100 calls at t = 0 and assert all are allowed, assert the 101st is denied with a retry-after, advance the clock by one refill interval and assert exactly one more is allowed. There are no sleeps, so it runs in microseconds and never flakes on a loaded build machine.',
    },
    {
      q: 'Next quarter someone wants a leaky bucket. What changes?',
      a: 'One new class implementing `LimitAlgorithm`, plus its Lua script if it needs the fast path. The limiter, the stores, the clock and every caller are untouched, which is the test of whether the strategy seam is real. If they mean the queueing variant, which delays rather than denies, `retryAfterMs` already carries the delay and the caller chooses to wait.',
    },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'prose',
      text: 'This is the rate limiter asked as a design question rather than a distributed-systems one. The interviewer wants the classes another team would import, so ask who calls it and what they get back before choosing an algorithm.',
    },
    {
      kind: 'list',
      items: [
        '`tryAcquire(key, cost)` returns allowed or denied, how much is left, and when to retry. The caller turns a denial into an [[HTTP]] 429 with a `Retry-After` header.',
        'Limits are per key: an [[API]] key, a user, an [[IP]] address. Millions of distinct keys, most of them idle at any moment.',
        'At least two algorithms, token bucket and sliding window, chosen per limit.',
        'In-process by default. Optionally, state is shared through Redis so a limit holds across a fleet.',
        'Deterministic tests: no `sleep()` anywhere in the test suite.',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional: the check runs on every request. In-process it is a hash lookup and a little arithmetic, **hundreds of nanoseconds**, and it never holds a lock across I/O. Memory is bounded by active keys, not by every key ever seen. Concurrent calls for the same key must not both spend the last token.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: '"The algorithm is a strategy, the state sits behind a store interface, and time comes from an injected clock. Those three seams are the design. Everything else is arithmetic."',
    },

    { kind: 'heading', text: 'Core objects' },
    {
      kind: 'list',
      items: [
        '`Limiter`: the one-method interface callers see. `RateLimiter` and every wrapper implement it.',
        '`LimitAlgorithm<S>`: the strategy. A pure function from stored state, the time and the cost to a decision and the next state.',
        '`StateStore`: where per-key state lives. An in-memory map with expiry, or Redis.',
        '`Clock`: milliseconds. Monotonic in-process, one every host agrees on when state is shared, and a fake in tests.',
        '`Decision`: allowed, remaining, retry-after. A value.',
      ],
    },
    {
      kind: 'figure',
      caption: 'The two strategies: a bucket that refills at a steady rate, and a window that weighs the previous minute by how much of it still overlaps.',
      figure: {
        kind: 'split',
        left: {
          title: 'Token bucket',
          nodes: [
            { label: 'capacity 100', sub: 'the burst allowance' },
            { label: 'refill 10 per second', sub: 'the steady rate' },
            { label: 'each request takes 1', sub: 'deny when empty' },
          ],
          cost: 'Two numbers per key. A full burst is allowed after any idle spell.',
          tone: 'line',
        },
        right: {
          title: 'Sliding window counter',
          nodes: [
            { label: 'previous minute: 80' },
            { label: 'this minute: 30', sub: '15 s in, so 75% overlap' },
            { label: '80 × 0.75 + 30 = 90', sub: 'against a limit of 100' },
          ],
          cost: 'Three numbers per key. Smooth, and very slightly approximate.',
          tone: 'line',
        },
        verdict: 'Token bucket when bursts are acceptable, which is most APIs. Sliding window when the contract says "N per minute" and customers will count.',
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Making a denial an exception. A denied request is the limiter working, not failing. Throwing makes the hot path pay for stack traces and forces every caller into try/catch. Return a `Decision`.',
    },

    { kind: 'heading', text: 'Classes and relationships' },
    {
      kind: 'figure',
      caption: 'The limiter composes a strategy, a store and a clock. Neither the algorithms nor the limiter know which store they run on.',
      figure: {
        kind: 'classes',
        classes: [
          {
            name: 'LimitAlgorithm',
            stereotype: 'interface',
            fields: ['idleTtlMs: number'],
            methods: ['initial(now): S', 'decide(s, now, cost): Outcome<S>'],
            tone: 'line',
          },
          { name: 'TokenBucket', fields: ['capacity: number', 'perSec: number'], methods: ['decide(b, now, cost)'] },
          { name: 'SlidingWindow', fields: ['limit: number', 'windowMs: number'], methods: ['decide(w, now, cost)'] },
          {
            name: 'StateStore',
            stereotype: 'interface',
            methods: ['get(key): Versioned<S>', 'compareAndSet(key, version, next, ttl)'],
          },
          {
            name: 'RateLimiter',
            fields: ['algo: LimitAlgorithm<S>', 'store: StateStore', 'clock: Clock'],
            methods: ['tryAcquire(key, cost): Decision'],
          },
        ],
        relations: [
          { from: 'TokenBucket', to: 'LimitAlgorithm', kind: 'implements' },
          { from: 'SlidingWindow', to: 'LimitAlgorithm', kind: 'implements' },
          { from: 'RateLimiter', to: 'LimitAlgorithm', kind: 'has', label: 'strategy' },
          { from: 'RateLimiter', to: 'StateStore', kind: 'has', label: 'injected' },
        ],
        note: 'InMemoryStore and RedisStore implement StateStore. Clock is a one-method interface; tests pass a FakeClock.',
      },
    },
    {
      kind: 'prose',
      text: 'The algorithms are **pure**: state in, decision and state out, no I/O and no clock of their own. That is what lets one implementation run against a `Map` in a unit test and against Redis in production, and it is why the core package has no Redis dependency at all. The Redis store lives in its own package and adapts a client to `StateStore`.',
    },

    { kind: 'heading', text: 'Key methods' },
    {
      kind: 'code',
      caption: 'The contracts. The store\'s write is conditional on a version.',
      code: `interface Clock { now(): number } // milliseconds

type Decision = {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

interface LimitAlgorithm<S> {
  initial(now: number): S
  decide(s: S, now: number, cost: number): { d: Decision; next: S }
  idleTtlMs: number // idle this long, a key is back to initial
}

type Versioned<S> = { state: S; version: number }

interface StateStore {
  get<S>(key: string): Promise<Versioned<S> | undefined>
  // Writes only if the version still equals expected (0: absent).
  compareAndSet<S>(key: string, expected: number, next: S,
                   ttlMs: number): Promise<boolean>
}`,
    },
    {
      kind: 'code',
      caption: 'Token bucket: no timer, just arithmetic on each call.',
      code: `type Bucket = { tokens: number; at: number }

class TokenBucket implements LimitAlgorithm<Bucket> {
  constructor(private capacity: number, private perSec: number) {}

  get idleTtlMs() { return (this.capacity / this.perSec) * 1000 }

  initial(now: number): Bucket {
    return { tokens: this.capacity, at: now }
  }

  decide(b: Bucket, now: number, cost: number) {
    // Refill lazily. Clamp: clocks can step backwards.
    const secs = Math.max(0, now - b.at) / 1000
    const tokens = Math.min(this.capacity,
                            b.tokens + secs * this.perSec)
    if (tokens < cost) {
      const waitMs = ((cost - tokens) / this.perSec) * 1000
      return { d: deny(Math.ceil(waitMs)), next: b }
    }
    // Never move 'at' backwards, or the next call refills twice.
    const next = { tokens: tokens - cost, at: Math.max(b.at, now) }
    return { d: allow(Math.floor(next.tokens)), next }
  }
}`,
    },
    {
      kind: 'code',
      caption: 'The limiter: read, decide, write if nobody else wrote first.',
      code: `class RateLimiter<S> implements Limiter {
  constructor(private algo: LimitAlgorithm<S>,
              private store: StateStore,
              private clock: Clock = monotonicClock,
              private maxAttempts = 5) {}

  async tryAcquire(key: string, cost = 1): Promise<Decision> {
    for (let i = 0; i < this.maxAttempts; i++) {
      const cur = await this.store.get<S>(key)
      const now = this.clock.now()
      const state = cur?.state ?? this.algo.initial(now)
      const { d, next } = this.algo.decide(state, now, cost)
      if (!d.allowed) return d // a denial changes nothing
      const won = await this.store.compareAndSet(
        key, cur?.version ?? 0, next, this.algo.idleTtlMs)
      if (won) return d
    }
    return deny(50) // lost every race: busy, maybe not over
  }
}`,
    },
    {
      kind: 'prose',
      text: 'Two details carry weight. A denial writes nothing, so a key under attack costs one read per request and no writes. And `idleTtlMs` is free memory management: a bucket idle for capacity ÷ rate seconds is full again, which is indistinguishable from a key that does not exist, so the store can forget it after exactly that long.',
    },

    { kind: 'heading', text: 'Patterns and extensibility' },
    {
      kind: 'prose',
      text: '**Strategy** for algorithms: the second one is the proof the seam is real, and it touches nothing outside its own class.',
    },
    {
      kind: 'code',
      caption: 'A second strategy, same contract. timeToFit solves for when the decaying count leaves room, which can be after this window ends.',
      code: `type Window = { start: number; prev: number; curr: number }

class SlidingWindow implements LimitAlgorithm<Window> {
  constructor(private limit: number, private windowMs: number) {}
  get idleTtlMs() { return 2 * this.windowMs }

  initial(now: number): Window {
    return { start: now - (now % this.windowMs), prev: 0, curr: 0 }
  }

  decide(w: Window, now: number, cost: number) {
    const cur = roll(w, now, this.windowMs) // shift if one passed
    const weight = 1 - (now - cur.start) / this.windowMs
    const used = cur.prev * weight + cur.curr
    if (used + cost > this.limit) {
      return { d: deny(this.timeToFit(cur, now, cost)), next: w }
    }
    const next = { ...cur, curr: cur.curr + cost }
    return { d: allow(Math.floor(this.limit - used - cost)), next }
  }
}`,
    },
    {
      kind: 'prose',
      text: '**Adapter** for stores: `RedisStore` adapts a Redis client to `StateStore`, `InMemoryStore` adapts a `Map` with expiry, and a Postgres store would be a third. **Decorator** for everything operational: timeouts, metrics and fallback wrap a `Limiter` and implement `Limiter`, so the core never learns about them. Bucket4j, the Java library, ships the same bucket over in-process memory, Redis, Hazelcast and JCache behind one interface, which is this design.',
    },
    {
      kind: 'codeCompare',
      before: {
        title: 'Every concern inside tryAcquire',
        code: `async tryAcquire(key: string): Promise<Decision> {
  const t0 = Date.now()
  try {
    const raw = await redis.get('rl:' + key)
    // ...token bucket arithmetic inline...
    await redis.set('rl:' + key, JSON.stringify(bucket))
    metrics.timing('rl.ok', Date.now() - t0)
    return decision
  } catch (e) {
    metrics.increment('rl.redis_error')
    return { allowed: true, remaining: 0, retryAfterMs: 0 }
  }
}`,
      },
      after: {
        title: 'Seams, composed at the edge',
        code: `const shared = new RateLimiter(
  new TokenBucket(100, 10),       // strategy
  new RedisStore(redisClient),    // adapter
  epochClock,                     // hosts must agree on time
)
const local = new RateLimiter(
  new TokenBucket(100 / FLEET, 10 / FLEET),
  new InMemoryStore({ maxKeys: 100_000 }),
)
// decorator: same interface, degrades instead of failing
const limiter: Limiter = new WithFallback(shared, local, {
  timeoutMs: 5,
  onFallback: () => metrics.increment('rl.fallback'),
})`,
      },
      note: 'The left version silently fails open and races on every request. The right one makes the fallback a decision you can read, test and change.',
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Cloudflare\'s rate limiting uses the sliding window counter: weight the previous window by its remaining overlap and add the current one. They reported that across the traffic they analysed, only 0.003% of requests were wrongly allowed or limited by the approximation.',
    },

    { kind: 'heading', text: 'Concurrency and edge cases' },
    {
      kind: 'prose',
      text: 'Node has one thread, and this still races. Two requests for the same key both `await store.get()`, both see one token, both decide yes, both write zero. In Java or Go the same happens without the await. That is why the write is a compare-and-swap ([[CAS]]) on a version: whoever writes second finds the version moved, rereads and decides again.',
    },
    {
      kind: 'figure',
      caption: 'Two requests race for the last token. The version check lets exactly one win; the loser rereads and is denied.',
      figure: {
        kind: 'sequence',
        actors: ['Request 1', 'Store', 'Request 2'],
        steps: [
          { from: 0, to: 1, label: 'get: 1 token, v7' },
          { from: 2, to: 1, label: 'get: 1 token, v7' },
          { from: 0, to: 0, label: 'decide: allow' },
          { from: 2, to: 2, label: 'decide: allow' },
          { from: 0, to: 1, label: 'write if v7: ok, now v8', tone: 'mastered' },
          { from: 2, to: 1, label: 'write if v7: rejected', tone: 'streak' },
          { from: 2, to: 1, label: 'retry. get: 0 tokens, v8' },
          { from: 2, to: 2, label: 'decide: deny, retry in 100 ms' },
        ],
        note: 'Without the version, both writes succeed and two requests spend one token.',
      },
    },
    {
      kind: 'prose',
      text: 'Against Redis the generic loop costs two round trips, and a hot key can lose several races in a row. The faster path is a Lua script per algorithm, which Redis runs atomically in one round trip. The cost is writing each algorithm twice, once in TypeScript for the local store and once in Lua. Ship the generic path first and add scripts for the one or two algorithms that need them.',
    },
    {
      kind: 'list',
      items: [
        '**Whose clock?** In-process, a monotonic clock (`performance.now()`), because wall clocks step backwards when corrected. A monotonic clock counts from each process\'s start, so it means nothing to another host: a shared store needs epoch time, which is why the shared limiter above is handed `epochClock` explicitly. Epoch clocks differ slightly between hosts, and one running 300 ms fast refills buckets early, so inside a Lua script use Redis `TIME` and let one clock rule each key.',
        '**Cost larger than capacity.** It can never succeed, yet the bucket would compute a finite wait for it. Check it in `tryAcquire` before touching the store and throw a usage error, not a denial the caller will retry forever.',
        '**Hot keys.** Bound the retries and deny when they run out, but treat it as a signal, not a verdict: losing five races in a row means the key is busy, not that it is over its limit. A key that hot belongs on the Lua path or a lease, not more retries.',
        '**The store is down.** Fail open for a public read [[API]], fail closed for login attempts. It is a product decision, so it is configuration, and the safe middle is a local limit of limit ÷ fleet size.',
        '**Memory.** The in-memory store expires keys after `idleTtlMs` and caps total keys, evicting least recently used, so a scan across millions of forged keys cannot exhaust the heap.',
      ],
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Guava\'s `RateLimiter` is a token bucket that refills lazily: it stores the permits and the next free moment, and does arithmetic on each call instead of running a timer. Its time source is an internal `SleepingStopwatch`, which Guava\'s own tests replace with a fake. The pluggable clock, in one of the most used Java libraries there is.',
    },
  ],
}
