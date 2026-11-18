import type { Problem } from '../types'

export const topK: Problem = {
  id: 'top-k',
  title: 'Design a top-K trending service',
  kind: 'hld',
  category: 'data',
  difficulty: 'hard',
  brief:
    'Build the service behind a trending list: the K most-viewed YouTube videos over the last hour, the last day and the last month. Views arrive by the billion every day.',
  patterns: ['scaling-writes', 'scaling-reads'],
  suggests: ['c-queues', 'a-writes', 'c-sharding', 'c-caching'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Asked whether "last hour" means a sliding or a tumbling window before designing' },
    { id: 'r2', bar: 'must', criterion: 'Moved counting off the request path onto a stream partitioned by video id' },
    { id: 'r3', bar: 'must', criterion: 'Served the list from a precomputed snapshot rather than sorting at read time' },
    { id: 'r4', bar: 'must', criterion: 'Estimated views per second and the number of distinct videos counted per window' },
    { id: 'r5', bar: 'senior', criterion: 'Merged per-worker top-K lists and explained why the merge is exact when partitioned by video' },
    { id: 'r6', bar: 'senior', criterion: 'Built sliding windows from one-minute buckets, adding the newest and subtracting the expired' },
    { id: 'r7', bar: 'senior', criterion: 'Handled the viral video with pre-aggregation rather than random partitioning' },
    { id: 'r8', bar: 'senior', criterion: 'Used checkpointed stream state with Kafka offsets, and an idempotent snapshot write' },
    { id: 'r9', bar: 'senior', criterion: 'Explained a count-min sketch: fixed memory, one-sided error, and a heap to know which keys are heavy' },
    { id: 'r10', bar: 'staff', criterion: 'Chose exact or approximate counting from memory arithmetic, not taste' },
    { id: 'r11', bar: 'staff', criterion: 'Distinguished trending from most-viewed and proposed a velocity score' },
    { id: 'r12', bar: 'staff', criterion: 'Scaled freshness with the window: a monthly list need not be fresh to the minute' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Users should be able to fetch the top K videos by views for the last hour, the last day, the last month and all time, with K up to 1,000.',
        'Clients should be able to report a view, and every view should count toward those lists.',
        'Out of scope: per-country and per-category lists (raise them at the end), the view count on a video\'s own page, recommendations.',
      ],
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Before anything else: does "last hour" mean the sixty minutes ending now, or the last full clock hour? The first is a sliding window and the second a tumbling one, and they are different designs. I will assume sliding, refreshed every minute, because a trending list that can be two hours old is not trending.',
    },
    {
      kind: 'prose',
      text: 'Non-functional, with numbers. Assume **50 billion views a day**: ~600k a second on average and over a million at peak. Assume a catalogue of ~5 billion videos, most of which get almost no views. The distribution has a very long tail, and that matters later.',
    },
    {
      kind: 'list',
      items: [
        '**Fresh within a minute** for the hour list. Longer windows can be staler: nobody can tell whether a monthly list is a minute or an hour old.',
        '**Reads under 100 ms.** The list is the same for everyone, so it is a precomputed snapshot behind a cache.',
        '**Accuracy: ask.** For trending, the order matters and exact counts do not, so a small bounded error is acceptable. If the interviewer insists on exact, the design below still works; it costs memory, and deep dive 3 sizes it.',
        '**No view lost or double counted** when a worker crashes.',
      ],
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'prose',
      text: '**View** (viewId, videoId, timestamp) — an event this service consumes and never stores; **Bucket** (a granularity and a start time → per-video counts); **Window** (hour, day, month, all time — each a sum of buckets); and **TopList** (window → the K videos and their counts, stamped with an `asOf` time).',
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'prose',
      text: 'The [[API]] is two calls, and in a real company the first already exists: views flow through an analytics pipeline, and you consume its topic rather than build an endpoint.',
    },
    {
      kind: 'code',
      code: `POST /views  { viewId, videoId, ts }       -> 202
GET  /top?window=1h|1d|30d|all&k=100
       -> { asOf, videos: [{ videoId, views }] }`,
      caption: 'The read returns a snapshot with its timestamp. Nothing is counted when somebody asks.',
    },

    { kind: 'heading', text: 'Data flow' },
    {
      kind: 'list',
      ordered: true,
      items: [
        'The player emits a view event to Kafka, partitioned by `videoId`.',
        'Stream workers (Flink) count views per video in one-minute buckets, held in keyed state.',
        'Every minute, each worker computes its local top K for each window from its buckets.',
        'A merger combines the local lists into the global top K and writes a snapshot.',
        'The top service reads the latest snapshot and caches it.',
      ],
    },
    {
      kind: 'figure',
      caption: 'A view becomes a bucket increment, then a local list, then a global list, once a minute.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Players', sub: '~600k views/s', to: 'view events' },
          { label: 'Kafka', sub: 'partitioned by videoId', to: 'consume' },
          { label: 'Flink workers', sub: 'per-video minute buckets', tone: 'line', to: 'local top K' },
          { label: 'Merger', sub: 'global top K per window', to: 'every minute' },
          { label: 'Snapshot store', sub: 'Redis · one list per window', tone: 'mastered' },
        ],
        note: 'Counting and serving never touch. The read path only ever sees the latest snapshot.',
      },
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'Counting runs continuously on the stream; serving reads the latest precomputed list.',
      figure: {
        kind: 'split',
        left: {
          title: 'Counting — continuous',
          tone: 'line',
          nodes: [
            { label: 'Kafka', to: 'by videoId' },
            { label: 'Flink workers', sub: 'exact counts, checkpointed', tone: 'line', to: 'local top K' },
            { label: 'Merger', sub: 'once a minute' },
          ],
          cost: 'Throughput-bound. Scales by adding partitions and workers.',
        },
        right: {
          title: 'Serving — a snapshot',
          tone: 'mastered',
          nodes: [
            { label: 'Client', to: 'GET /top' },
            { label: 'Top service', sub: 'stateless', to: 'read' },
            { label: 'Redis', sub: 'K ≤ 1,000 per window', tone: 'mastered' },
          ],
          cost: 'Latency-bound, and trivial: four lists of at most a thousand rows.',
        },
        verdict: 'Precompute everything. The read path is a key lookup, and all the difficulty lives on the left.',
      },
    },
    {
      kind: 'prose',
      text: 'Walk it end to end. **Report a view**: the player sends the event and moves on; it is never on a path a viewer waits for. **Count**: Kafka is partitioned by `videoId`, so every view of one video lands on the same worker, which increments that video\'s current minute bucket. **Rank**: each minute, every worker produces its local top K per window and a merger combines them. **Serve**: `GET /top` reads one of four precomputed lists.',
    },
    {
      kind: 'prose',
      text: 'The bottlenecks: **ingest volume** at a million events a second, **the viral video** sending a hundred thousand views a second to one partition, **sliding windows**, where forgetting old views is the hard part, and **memory**, because a counter for every video viewed this month is a lot of counters.',
    },

    { kind: 'heading', text: 'Deep dive 1 — counting a million views a second, exactly' },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'A counter column and `ORDER BY`',
          text: '`UPDATE videos SET views = views + 1` per view, and a sort per request. A viral video\'s row becomes a lock queue, and every read sorts billions of rows.',
        },
        {
          grade: 'good',
          title: 'One Redis sorted set',
          text: '`ZINCRBY` per view and `ZREVRANGE` for the list. Fast, but one key on one node takes every view in the world, and it only answers "all time": a sorted set cannot forget old views.',
        },
        {
          grade: 'great',
          title: 'A stream partitioned by video, with per-worker top K',
          text: 'Kafka keyed by `videoId`; Flink workers keep per-video counts in keyed state, each emits its local top K, and a merger combines them. Load spreads across partitions, and the merge is exact.',
        },
        {
          grade: 'best',
          title: 'The same, with pre-aggregation and checkpoints',
          text: 'Ingest nodes sum views per video for a second and emit `(videoId, count)`, so a viral video costs one event per node per second instead of thousands. Flink checkpoints its state together with the Kafka offsets, so a crash replays from the checkpoint rather than losing or double counting.',
        },
      ],
    },
    {
      kind: 'prose',
      text: '**Why the merge is exact.** Each video is counted on exactly one worker, so its full count is local. If a video is in the global top K, every video beating it on its own worker also beats it globally — fewer than K of them — so it must be in that worker\'s local top K. The global list is always inside the union of the local lists.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Fixing the viral video by spreading its views randomly across partitions, then merging local top-K lists. A video with a modest share on every worker can now be first globally and still miss every local list. Split a key across workers and the merge stops being exact. Pre-aggregate before the stream instead.',
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Flink\'s exactly-once guarantee covers its own state, not your side effects. It checkpoints keyed state and Kafka offsets together and rewinds both after a crash, so counts are right — but a snapshot written to Redis during the replayed interval is written twice. Make that write idempotent: overwrite the whole list, keyed by window and minute.',
    },

    { kind: 'heading', text: 'Deep dive 2 — windows: tumbling, sliding, and the cheap way to slide' },
    {
      kind: 'prose',
      text: 'All time only ever goes up, so a running counter per video is enough. Every other window has to forget views as they age out, and that is where the design lives.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Tumbling windows',
        points: [
          'Fixed and non-overlapping: 13:00–14:00, then 14:00–15:00',
          'Each view lands in exactly one window — one counter update',
          'Published when the window closes, so the answer can be two hours old',
        ],
      },
      right: {
        title: 'Sliding windows',
        points: [
          'The sixty minutes ending now, recomputed every minute',
          'Fresh to the minute, which is what trending actually means',
          'Done naively, every view belongs to sixty overlapping windows: sixty updates',
        ],
      },
      verdict: 'Sliding, built out of tumbling buckets. Count in one-minute tumbling buckets; the last hour is the sum of the newest sixty. Each view still updates one counter.',
    },
    {
      kind: 'figure',
      caption: 'At 13:40, the newest closed tumbling hour is 12:00–13:00. The sliding hour is the sixty minutes that just happened.',
      figure: {
        kind: 'timeline',
        ticks: ['12:00', '12:30', '13:00', '13:30', '14:00'],
        lanes: [
          {
            label: 'Tumbling hours',
            bars: [
              { from: 0, to: 0.5, label: '12:00–13:00 · published', tone: 'neutral' },
              { from: 0.5, to: 1, label: '13:00–14:00 · still open', tone: 'streak' },
            ],
            outcome: { label: 'one answer per hour', tone: 'neutral' },
          },
          {
            label: 'Sliding hour, seen at 13:40',
            bars: [{ from: 0.333, to: 0.833, label: '12:40–13:40', tone: 'line' }],
            outcome: { label: 'moves every minute', tone: 'mastered' },
          },
        ],
        note: 'At 13:40 the tumbling answer is forty minutes stale, on a list whose whole point is now.',
      },
    },
    {
      kind: 'prose',
      text: '**The trick.** Keep a running hourly total per video. Each minute, add the bucket that just closed and subtract the one that fell out of the window. The work per minute is proportional to the videos viewed in those two minutes, not to the size of the window. Then recompute the worker\'s local top K with one pass over its running totals: a few million in-memory counters per worker takes well under a second.',
    },
    {
      kind: 'figure',
      caption: 'The last hour as buckets, drawn at five minutes and built at one: each step adds the newest bucket and subtracts the one that fell out.',
      figure: {
        kind: 'grid',
        cols: 7,
        cells: [
          { label: '13:00', tone: 'alert' },
          { label: '13:05' },
          { label: '13:10' },
          { label: '13:15' },
          { label: '13:20' },
          { label: '13:25' },
          { label: '13:30' },
          { label: '13:35' },
          { label: '13:40' },
          { label: '13:45' },
          { label: '13:50' },
          { label: '13:55' },
          { label: '14:00', tone: 'line' },
        ],
        legend: [
          { tone: 'alert', label: 'fell out: subtract' },
          { tone: 'neutral', label: 'still in the window' },
          { tone: 'line', label: 'just closed: add' },
        ],
      },
    },
    {
      kind: 'prose',
      text: '**Longer windows use coarser buckets.** The day is twenty-four hour buckets and the month thirty day buckets, rolled up from the minute buckets as they close. Keep minute buckets for an hour, hour buckets for a day, day buckets for a month. State stays bounded, and each window recomputes on the cadence its freshness needs — hourly is plenty for the month.',
    },
    {
      kind: 'callout',
      tone: 'note',
      text: 'In Flink, a one-hour sliding window with a one-minute slide assigns every event to sixty windows, so each view updates sixty aggregates. One-minute tumbling windows plus a running sum you maintain yourself do the same job with one update per view. Reach for it whenever the slide is small next to the window.',
    },

    { kind: 'heading', text: 'Deep dive 3 — exact or approximate: the count-min sketch' },
    {
      kind: 'prose',
      text: 'Size the exact design first, because the arithmetic decides this. Assume 200 million distinct videos are viewed in an hour. A hash-map entry — id, count, overhead — is roughly 50 bytes, so one hour of exact counts is ~10 [[GB]], spread across the workers. Add the buckets you keep and it is tens of gigabytes: affordable across a cluster. Exact is a legitimate answer for four global lists.',
    },
    {
      kind: 'prose',
      text: 'It stops being affordable when dimensions multiply: top K per country × per category × per window is thousands of lists, each with its own long tail of counters. That is where a **count-min sketch** earns its place.',
    },
    {
      kind: 'figure',
      caption: 'A count-min sketch: one video hashes to one counter in each row, and its estimate is the smallest of them.',
      figure: {
        kind: 'grid',
        cols: 8,
        cells: [
          { label: '5' }, { label: '0' }, { label: '41', tone: 'mastered' }, { label: '2' },
          { label: '9' }, { label: '0' }, { label: '13' }, { label: '4' },
          { label: '0' }, { label: '47', tone: 'line' }, { label: '3' }, { label: '8' },
          { label: '1' }, { label: '6' }, { label: '0' }, { label: '2' },
          { label: '7' }, { label: '2' }, { label: '0' }, { label: '1' },
          { label: '0' }, { label: '52', tone: 'line' }, { label: '3' }, { label: '9' },
        ],
        legend: [
          { tone: 'line', label: 'this video\'s counter in a row' },
          { tone: 'mastered', label: 'the minimum: the estimate' },
        ],
        note: 'Other videos collide into the same counters and only ever add to them, so every row overestimates. The minimum is the least wrong, and it is never below the truth.',
      },
    },
    {
      kind: 'prose',
      text: 'It is a small grid of counters: `d` rows, each with its own hash function, `w` counters wide. To count a view, hash the video id once per row and increment one counter in each. To estimate, take the minimum of those `d` counters. With `w = ⌈e/ε⌉` and `d = ⌈ln(1/δ)⌉`, the estimate is within ε × total views of the truth with probability 1 − δ.',
    },
    {
      kind: 'prose',
      text: 'Put numbers on it. An hour is ~2 billion views. For an error of at most ~2,000 views (ε = 10⁻⁶) at 99.9% confidence (δ = 0.001): `w` ≈ 2.7 million and `d` = 7, so ~19 million 4-byte counters — **~76 [[MB]]**, for every video at once, however many there are. Near the top of a trending list that error is a rounding difference.',
    },
    {
      kind: 'prose',
      text: 'Two catches. A sketch cannot list its keys, so it cannot tell you which videos are heavy: pair it with a min-heap of the current top-K candidates, checking each video\'s estimate as it is counted. And it only overestimates — rare videos that collide with popular ones look bigger than they are, which is harmless at the top of the list and useless at the bottom. One property makes it shine: sketches with the same dimensions and hash functions **merge by adding cell by cell**, and subtract the same way. Any partitioning works, so the viral-video problem disappears, and a sliding hour is a running sum of minute sketches.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Exact: keyed counters',
        points: [
          'Memory grows with distinct videos per window',
          'Partition by video id; pre-aggregate the viral ones',
          'Exact counts, and an exact merge of local top K',
          'Right for a handful of global lists',
        ],
      },
      right: {
        title: 'Approximate: sketch plus heap',
        points: [
          'Fixed memory, chosen from the error you accept',
          'Mergeable by addition, so any partitioning works',
          'Overestimates only; needs a heap to know which videos',
          'Right when lists multiply by country, category and window',
        ],
      },
      verdict: 'Exact for the four global lists, because the arithmetic says they fit. Sketches for the long tail of per-country and per-category lists, where exact memory multiplies by thousands. Choosing from the numbers is the senior move.',
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Redis\'s probabilistic data structures ship both pieces ready-made: a count-min sketch (`CMS.INCRBY`, `CMS.QUERY`) and a top-K structure (`TOPK.ADD`, `TOPK.LIST`) built on the HeavyKeeper algorithm. Apache DataSketches, which came out of Yahoo, offers a frequent-items sketch for the same job inside batch and stream pipelines.',
    },
  ],
  followups: [
    {
      q: '"Trending" should mean rising fast, not just big. How would you change this?',
      a: 'Rank by velocity against a baseline rather than by raw count: views in the last hour divided by what that video, or videos like it, normally get in an hour, smoothed so a jump from 2 views to 20 does not top the list. The counting pipeline stays the same; only the scoring stage changes. YouTube has described its trending list as weighing view velocity, a video\'s age and how it compares with other recent uploads, not view totals alone.',
    },
    {
      q: 'Product now wants top K per country and per category.',
      a: 'The lists multiply: 200 countries × 20 categories × 4 windows is 16,000 lists. Key the big lists\' counters by dimension and video so their merge stays exact, and move the long tail of small lists to count-min sketches with heaps. Precompute only lists that are actually requested, and cache them.',
    },
    {
      q: 'A worker crashes halfway through a minute. Do you lose views or double count them?',
      a: 'Neither, for state: Flink restores keyed state and Kafka offsets from the same checkpoint and replays from there. Two places still need care. Client retries need deduplicating on viewId within a short window, and the snapshot write must be idempotent, or a replay publishes it twice.',
    },
    {
      q: 'How do you stop bots pushing a video into trending?',
      a: 'Filter before counting, not after: drop repeat views per viewer and video within a window, ignore views under a minimum watch time, and rate-limit per client. Heavier detection runs offline and can pull a video retroactively. A trending list is a reputational surface, so a list a few minutes late beats one that can be gamed.',
    },
    {
      q: 'Why not run a batch job every hour instead?',
      a: 'For the month and all-time lists you could, and it would be simpler and exact: a scheduled query over the event warehouse. The hour list is why the stream exists, because an hourly batch makes it up to two hours stale. Many teams run both and let the batch result correct the streamed one for closed periods, as in the ad click aggregator.',
    },
  ],
}
