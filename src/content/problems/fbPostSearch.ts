import type { Problem } from '../types'

export const fbPostSearch: Problem = {
  id: 'fb-post-search',
  title: 'Design Facebook post search',
  kind: 'hld',
  category: 'social',
  difficulty: 'hard',
  brief:
    'Users search Facebook posts by keyword and see the matches sorted by recency or by like count. There are trillions of posts, and the interviewer wants you to design the index itself, not name a search product.',
  patterns: ['scaling-reads', 'scaling-writes'],
  suggests: ['c-search', 'c-sharding', 'c-queues', 'c-caching'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to keyword search with two sorts, and named fuzzy matching and personalisation as out of scope' },
    { id: 'r2', bar: 'must', criterion: 'Built an inverted index from term to post ids instead of scanning the posts table' },
    { id: 'r3', bar: 'must', criterion: 'Kept indexing off the post write path, behind a stream' },
    { id: 'r4', bar: 'must', criterion: 'Estimated post, like and search rates and the storage they imply' },
    { id: 'r5', bar: 'senior', criterion: 'Compared sharding by term against sharding by document and picked one with reasons' },
    { id: 'r6', bar: 'senior', criterion: 'Kept a separate ordering per sort: post id for recency, like count for likes' },
    { id: 'r7', bar: 'senior', criterion: 'Fed the indexers with CDC rather than a dual write, and made them idempotent' },
    { id: 'r8', bar: 'senior', criterion: 'Avoided an index write per like with thresholds, then re-ranked the head with exact counts' },
    { id: 'r9', bar: 'senior', criterion: 'Cached normalised queries with a TTL that fits inside the freshness budget' },
    { id: 'r10', bar: 'staff', criterion: 'Tiered the index by time so recency queries stop early and old posts move to cheaper storage' },
    { id: 'r11', bar: 'staff', criterion: 'Coalesced identical cache misses so a breaking-news query cannot stampede the shards' },
    { id: 'r12', bar: 'staff', criterion: 'Raised privacy filtering and explained why filtering after retrieval returns empty pages' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Users should be able to search all posts by one or more keywords.',
        'Users should be able to sort the results by recency or by like count.',
        'Users should be able to create and like posts, and see both reflected in search quickly.',
        'Out of scope: typo tolerance and fuzzy matching, personalised ranking, privacy filtering (assume every post is public, and raise it at the end), images and video.',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional, with numbers. Assume **1B [[DAU]]** posting once a day: **~12k posts a second**. Likes run about ten times that, **~120k a second**. Searches, say one per user per day: ~12k a second on average, with sharp peaks around news events.',
    },
    {
      kind: 'list',
      items: [
        '**Search under 500 ms** at the median, under a second at p99.',
        '**Fresh within a minute.** A new post is searchable in under a minute; like counts may lag by a few minutes.',
        '**Total recall.** Every post is findable, including a five-year-old post with no likes. You cannot drop the long tail to save space.',
        '**Storage.** 1B posts a day for ten years is ~3.6 trillion posts. At ~1 [[KB]] each the raw text is several petabytes, and the index is the same order of magnitude.',
      ],
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Say the core out loud early: an inverted index is a map from each word to the list of posts that contain it. Everything hard here is sharding that map, keeping it fresh under a hundred thousand likes a second, and never reading a billion-entry list for a common word.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'prose',
      text: '**Post** (id, authorId, text, createdAt); **Like** (userId, postId); **LikeCount** (postId → count); and the index itself: **Term** → **posting list**, the ordered list of post ids containing that term. Post ids are time-ordered, Snowflake-style, so sorting by id is sorting by time. That turns the recency sort into a property of the data rather than a computation.',
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'prose',
      text: 'Search is the only read. The two writes are part of the [[API]] because the index must reflect them, even though other teams own them in practice.',
    },
    {
      kind: 'code',
      code: `GET  /search?q=taylor+swift&sort=recent|likes&cursor=
       -> { posts: Post[], nextCursor }
POST /posts              { text } -> { postId }
POST /posts/{id}/likes            -> 200`,
      caption: 'The cursor carries the last post id (recency) or the last like count and post id (likes), so pages stay stable while new posts arrive.',
    },

    { kind: 'heading', text: 'Data flow' },
    {
      kind: 'prose',
      text: 'This one is pipeline-shaped: posts and likes stream in, the index consumes them, and searches read the index. Draw the pipeline before the boxes.',
    },
    {
      kind: 'figure',
      caption: 'Writes become events, and events become postings. Search only ever reads the end of this pipeline.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Posts and likes DBs', sub: 'source of truth', to: 'change log' },
          { label: '[[CDC]]', sub: 'log reader, e.g. Debezium', to: 'events' },
          { label: 'Kafka', sub: 'posts · like deltas', to: 'consume' },
          { label: 'Indexers', sub: 'tokenise · update postings', tone: 'line', to: 'write' },
          { label: 'Index shards', sub: 'term → post ids', tone: 'mastered' },
        ],
        note: 'Nothing on the posting path waits for the index. If indexers fall behind, search gets staler; posting never slows down.',
      },
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'Ingest feeds the index asynchronously; queries scatter to the index shards and hydrate from a post cache.',
      figure: {
        kind: 'split',
        left: {
          title: 'Ingest',
          tone: 'line',
          nodes: [
            { label: 'Post service', to: 'commit' },
            { label: 'Posts DB', to: 'CDC → Kafka' },
            { label: 'Indexers', sub: 'one consumer group', tone: 'line' },
          ],
          cost: 'Seconds behind the database, by design.',
        },
        right: {
          title: 'Query',
          tone: 'mastered',
          nodes: [
            { label: 'Client', to: 'GET /search' },
            { label: 'Search service', sub: 'normalise · cache check', to: 'scatter' },
            { label: 'Index shards', sub: 'local top N each', to: 'merge' },
            { label: 'Post cache', sub: 'hydrate one page', tone: 'mastered' },
          ],
          cost: 'One cache check, one scatter-gather, one batch hydrate.',
        },
        verdict: 'The index is the only thing the two sides share, which is what lets search fail without taking posting down.',
      },
    },
    {
      kind: 'list',
      ordered: true,
      items: [
        '**Create a post.** The post service commits to the posts database, sharded by post id. That is the end of the user-facing write. CDC picks the row up from the database log and publishes it to Kafka.',
        '**Like a post.** The like service records the like and the like-count store takes the increment. A like delta goes to Kafka too, at ten times the volume of posts, which makes it the harder stream.',
        '**Index.** Indexers tokenise the text — lower-case, split on word boundaries, drop punctuation — and add the post id to the posting lists of each distinct term.',
        '**Search.** The search service normalises the query and checks a result cache. On a miss it asks the index shards, each returns its best local matches, and it merges them, takes a page and hydrates the posts from a cache.',
      ],
    },
    {
      kind: 'prose',
      text: 'The bottlenecks: **posting lists for common terms** that run to billions of entries, **like volume** if every like touches the index, **index size** across ten years, and **hot queries** when the whole world searches the same word in the same minute.',
    },

    { kind: 'heading', text: 'Deep dive 1 — the index, and how to shard it' },
    {
      kind: 'prose',
      text: 'Keep two posting lists per term, one per sort. The recency list is ordered by post id, newest first; the likes list is ordered by like count. A one-word recency query is then the first page of one list. A two-word query intersects two lists sorted the same way, walking both from the newest end and stopping once it has a page of matches — for common pairs it never reaches the tail.',
    },
    {
      kind: 'code',
      code: `"swift"   recent: [p981, p977, p912, p870, …]  newest first
          likes:  [(p512, 90.1k), (p977, 4.1k), …]
"taylor"  recent: [p981, p940, p912, …]`,
      caption: 'Two orderings per term. A recency query takes the head of one list and stops.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Proposing `LIKE \'%swift%\'` on the posts table. A leading wildcard cannot use a B-tree index, so every search scans trillions of rows. This question exists to see you reach for an inverted index instead.',
    },
    {
      kind: 'prose',
      text: 'The real decision is how to split an index this size across machines.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Shard by term',
        points: [
          'Each term\'s lists live on one shard, so a one-word query touches one machine',
          'A post with 50 distinct words writes to ~50 shards',
          'Multi-word queries ship posting lists across the network to intersect them',
          'A breaking-news word melts its one shard, on reads and on writes',
        ],
      },
      right: {
        title: 'Shard by document',
        points: [
          'Each shard holds a complete index for its own subset of posts',
          'A post is written to exactly one shard',
          'Every query goes to every shard, and each returns its local top results',
          'Load spreads evenly; the cost is fan-out, and the slowest shard sets the latency',
        ],
      },
      verdict: 'Shard by document. Writes and hot terms spread evenly, and intersection stays local to each shard. Pay for the scatter-gather with replicas, and by cutting slow shards off at a deadline.',
    },
    {
      kind: 'prose',
      text: '**Then tier the shards by time.** Recency, the common sort, wants only the newest matches. Partition posts by time slice first and by hash within a slice. A recency query searches the newest slice and stops as soon as it has a page, so it rarely touches anything old. Older slices are read-mostly: merge them into larger, compressed shards and move them out of memory onto [[SSD]], then onto object storage.',
    },
    {
      kind: 'figure',
      caption: 'The index tiered by age: small and hot at the top, huge and cold at the bottom.',
      figure: {
        kind: 'stack',
        layers: [
          { label: 'Last 7 days', sub: 'in memory · constantly written · searched first', tone: 'line' },
          { label: 'Last 12 months', sub: 'on SSD · read-mostly, merged into larger shards', tone: 'neutral' },
          { label: 'Older', sub: 'compressed on object storage · deep pages and the likes sort', tone: 'neutral' },
        ],
        note: 'A recency query stops at the first tier that fills a page. Most never leave the top one.',
      },
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Twitter\'s Earlybird, its real-time search engine, made the same calls: the index is partitioned by tweet rather than by term, each partition is replicated, and a front-end service fans every query out and merges the results. Posting lists are walked newest first, so recency queries terminate early.',
    },

    { kind: 'heading', text: 'Deep dive 2 — ingest: fresh in a minute, and a hundred thousand likes a second' },
    {
      kind: 'prose',
      text: 'New posts first. They must be searchable within a minute, and no committed post may ever be missed.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Index inside the post request',
          text: 'Posting now waits on dozens of index shards, and an index outage is a posting outage. You have coupled the most important write in the product to a secondary read path.',
        },
        {
          grade: 'good',
          title: 'Write the database, then publish to Kafka',
          text: 'Asynchronous, but a dual write: a crash between the commit and the publish loses the post from search for good, and nothing notices.',
        },
        {
          grade: 'great',
          title: '[[CDC]] from the database log',
          text: 'A log reader such as Debezium tails the posts database\'s replication log into Kafka. Every committed post is published, in commit order per key, with no change to the post service.',
        },
        {
          grade: 'best',
          title: 'CDC, idempotent indexers, and replay',
          text: 'Indexers apply each event keyed by post id, so a redelivered event rewrites the same postings rather than duplicating them. Because Kafka retains the stream, a corrupted shard is rebuilt by replay, or from a snapshot plus the stream since.',
        },
      ],
    },
    {
      kind: 'prose',
      text: 'Likes are the harder stream. At ~120k a second, if every like re-sorted the post in the likes list of every term it contains — ~50 terms — that is **six million index writes a second**, nearly all of them moving a post from 1,040 likes to 1,041, which changes nothing anyone sees.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Update the index on every like',
        points: [
          'Index order always exact',
          '~6M posting updates a second',
          'Popular posts rewritten constantly on every shard they touch',
        ],
      },
      right: {
        title: 'Update when the count crosses a threshold',
        points: [
          'The index stores an approximate count: the last power of two crossed',
          'A post with a million likes is re-indexed ~20 times in its life',
          'The exact count lives in the like-count store, read at query time',
        ],
      },
      verdict: 'Thresholds. The index only needs to know roughly how liked a post is to find the candidates; exact counts fix the final order.',
    },
    {
      kind: 'figure',
      caption: 'How often one post is re-indexed on its way to a million likes.',
      figure: {
        kind: 'scale',
        items: [
          { label: 'Re-index on every like', display: '1,000,000 writes', value: 1e6, tone: 'alert' },
          { label: 'Re-index every 1,000 likes', display: '1,000 writes', value: 1e3, tone: 'streak' },
          { label: 'Re-index at each power of two', display: '20 writes', value: 20, tone: 'mastered' },
        ],
        note: 'Powers of two keep the ordering roughly right at every size, from 3 likes to 3 million, for a write count that grows with the logarithm of the likes.',
      },
    },
    {
      kind: 'prose',
      text: 'The likes query becomes **two-stage**: take a few hundred candidates from the likes lists using the approximate counts, fetch their exact counts from the like-count store in one batch, re-sort, and return the top page. Retrieve cheaply, then rank a small set precisely — the shape of every large ranking system, and worth naming as such. The like-count store itself takes batched deltas from the stream, one write per post per second rather than one per like.',
    },

    { kind: 'heading', text: 'Deep dive 3 — hot terms, ranking and caching' },
    {
      kind: 'prose',
      text: 'When something happens in the world, millions of people post a word in the same minute and millions more search for it. Both directions hit the same term.',
    },
    {
      kind: 'prose',
      text: '**Hot terms on write** are mostly absorbed by sharding by document: a burst of posts containing one word is spread across every shard in the newest tier, because posts are hashed, not terms. Had you sharded by term, you would now be splitting that one term\'s list across sub-shards by hand. **Hot terms on read** are a caching problem.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'No result cache',
          text: 'Every search scatters to every shard. A news spike multiplies the most expensive operation in the system by the size of the spike.',
        },
        {
          grade: 'good',
          title: 'Cache result pages keyed by the raw query',
          text: 'Redis, a short [[TTL]]. But "Taylor Swift", "taylor swift" and "taylor  swift" are three keys for one answer, so the hit rate is lower than it should be.',
        },
        {
          grade: 'great',
          title: 'Normalise, then cache inside the freshness budget',
          text: 'Lower-case, collapse whitespace, strip punctuation, then key on `(terms, sort, page)`. Results are not personalised in this scope, so popular pages can be cached at the [[CDN]] as well.',
        },
        {
          grade: 'best',
          title: 'Normalised cache plus request coalescing',
          text: 'When a popular entry expires, a thousand concurrent misses arrive together. Let one of them run the scatter-gather while the rest wait for its result. The cache is now your overload protection as well as your latency win.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'A new post becomes visible after the pipeline, and after any cached page that predates it expires.',
      figure: {
        kind: 'timeline',
        ticks: ['0 s · committed', '15 s', '30 s', '45 s', '60 s'],
        lanes: [
          {
            label: 'Ingest lag',
            bars: [{ from: 0, to: 0.25, label: 'CDC, Kafka, indexer', tone: 'line' }],
            outcome: { label: 'searchable', tone: 'mastered' },
          },
          {
            label: 'Worst-case cached page',
            bars: [{ from: 0.25, to: 0.75, label: 'cached just before indexing · 30 s TTL', tone: 'streak' }],
            outcome: { label: 'refreshed', tone: 'neutral' },
          },
          {
            label: 'Freshness budget',
            bars: [{ from: 0, to: 1, label: 'one minute', tone: 'neutral' }],
            outcome: { label: 'met at 45 s', tone: 'mastered' },
          },
        ],
        note: 'The longest a user can wait is ingest lag plus cache TTL. Pick the TTL so the sum stays inside the requirement.',
      },
    },
    {
      kind: 'prose',
      text: '**Ranking** stays deliberately simple, because the requirement is two sorts. Recency is the posting order. Likes is the two-stage query above, and it is the one sort that must look across every time tier, which makes it the most expensive query here — it is also the rarer one, and the result cache absorbs repeats. If the interviewer asks for relevance, add a text-relevance score such as BM25 as one more feature in the second stage; retrieval does not change.',
    },
  ],
  followups: [
    {
      q: 'Most posts are friends-only, not public. What changes?',
      a: 'Filtering after retrieval fails: for most viewers nearly every match is invisible, so a page comes back empty after scanning thousands of candidates. Restrict retrieval to what the viewer can see instead — for friends-only posts, look the term up within each friend\'s posts, which an index keyed by author and term makes a few hundred cheap lookups, and merge that with the public index. Keep a visibility check after retrieval as a safety net, not as the filter.',
    },
    {
      q: 'How do you handle a phrase query like "new york"?',
      a: 'Intersection alone returns posts containing both words anywhere. For phrases, store each word\'s positions in the postings and check adjacency after intersecting, or keep a bigram index for frequent pairs so "new york" is a single term. Both stay local to each shard under document sharding.',
    },
    {
      q: 'An index shard dies mid-query. What does the user see?',
      a: 'Each shard is replicated, so the search service retries another replica within its deadline. If a shard still has not answered, return the results you have and mark them partial — for search, a slightly incomplete page beats an error. The lost replica is rebuilt from a snapshot plus a Kafka replay.',
    },
    {
      q: 'Posts get edited and deleted. How does the index keep up?',
      a: 'The change stream carries the before and after image of each row. An edit removes postings for the terms that left and adds them for the terms that arrived; a delete removes them all. Until the indexer catches up, hydration drops any post that no longer exists or has changed visibility, so stale postings never reach a user.',
    },
    {
      q: 'How would you add typo tolerance?',
      a: 'Correct the query, not the index. The term dictionary is tiny next to the posting lists, so keep it in memory with an edit-distance structure — a trigram index over terms, or a Levenshtein automaton as Lucene uses — map "tayler" to "taylor", then run the normal lookup.',
    },
  ],
}
