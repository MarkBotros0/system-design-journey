import type { Problem } from '../types'

export const reddit: Problem = {
  id: 'reddit',
  title: 'Design Reddit',
  kind: 'hld',
  category: 'social',
  difficulty: 'medium',
  brief:
    'Users post into communities, vote posts and comments up or down, and browse each community sorted by hot, new or top. Comment threads nest as deep as people care to reply.',
  patterns: ['scaling-reads', 'scaling-writes'],
  suggests: ['a-reads', 'a-writes', 'c-caching', 'c-modelling'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to posts, comments, voting and listings, and named the home feed, search and moderation as out of scope' },
    { id: 'r2', bar: 'must', criterion: 'Stored each vote keyed by user and item, so a user votes once and can change it' },
    { id: 'r3', bar: 'must', criterion: 'Served listings from a precomputed order rather than sorting at read time' },
    { id: 'r4', bar: 'must', criterion: 'Fetched a post\'s comments in one read by post id, not one query per level' },
    { id: 'r5', bar: 'senior', criterion: 'Made the vote an idempotent PUT of state and derived the count from the delta' },
    { id: 'r6', bar: 'senior', criterion: 'Took score updates off the request path and batched them per item' },
    { id: 'r7', bar: 'senior', criterion: 'Explained why the hot score changes only on a vote, and used that to keep listings in sorted sets' },
    { id: 'r8', bar: 'senior', criterion: 'Showed the voter their own vote at once while the shared count stays eventually consistent' },
    { id: 'r9', bar: 'senior', criterion: 'Cached logged-out pages at the CDN and personalised only the vote arrows' },
    { id: 'r10', bar: 'staff', criterion: 'Cached each thread\'s tree shape as ids and parents, loading deep or wide branches lazily' },
    { id: 'r11', bar: 'staff', criterion: 'Raised vote manipulation: delayed counting, fuzzed totals, and archiving old posts' },
    { id: 'r12', bar: 'staff', criterion: 'Sorted comments by a confidence bound rather than by raw net score' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Users should be able to create posts in a community, and comment on posts and on other comments to any depth.',
        'Users should be able to upvote or downvote any post or comment once, and change or withdraw that vote.',
        'Users should be able to browse a community sorted by hot, new or top (today, this week, all time), and read a post\'s comments as a tree.',
        'Out of scope: the personalised home feed (a follow-up), search, moderation tools, chat, media hosting.',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional, with numbers. Assume **100M [[DAU]]** viewing ~30 pages each: ~3 billion page views a day, **~35k a second**, with spikes when a thread goes viral. Assume five votes per user a day: 500M votes, **~6k a second** on average and many times that on one hot thread. Page views outnumber votes about six to one, and every page reads dozens of records.',
    },
    {
      kind: 'list',
      items: [
        '**Listings in under 200 ms**, served from cache for nearly every request.',
        '**Counts are eventually consistent**, seconds behind. But a voter sees their own vote at once — an arrow that does not light up gets clicked again.',
        '**One vote per user per item**, enforced by the data model, not by hope.',
        '**Availability over consistency** on every read path.',
      ],
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'A vote is a state, not an event. I store what each user voted on each item, and derive the count from the change. That one decision gives me one vote per user, changing your mind, and safe retries, all for free.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'prose',
      text: '**User**; **Community** (a subreddit); **Post** (id, communityId, authorId, title, body or link, createdAt, score); **Comment** (id, postId, parentId, authorId, body, score); **Vote** (userId, targetId, direction −1, 0 or 1); and **Listing**, a precomputed ordered list of post ids per community and sort. Every comment carries its `postId` as well as its `parentId` — deep dive 3 depends on that.',
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'prose',
      text: 'The [[API]], one call per requirement:',
    },
    {
      kind: 'code',
      code: `POST /r/{community}/posts   { title, body | url } -> { postId }
POST /posts/{id}/comments   { parentId?, body }   -> { commentId }
PUT  /votes/{targetId}      { dir: 1 | 0 | -1 }   -> 200
GET  /r/{community}?sort=hot|new|top&t=week&after=
                            -> { posts[], after }
GET  /posts/{id}/comments?sort=best
                            -> { tree, more[] }`,
      caption: 'The vote is a PUT of the state, not an increment, so a retry or a double tap is harmless.',
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'The write path turns votes into batched score changes; the read path serves precomputed listings from cache.',
      figure: {
        kind: 'split',
        left: {
          title: 'Writes',
          tone: 'line',
          nodes: [
            { label: 'Vote service', sub: 'stores the vote', to: 'delta' },
            { label: 'Kafka', sub: 'partitioned by targetId', to: 'consume' },
            { label: 'Score aggregator', sub: 'sums per item per second', tone: 'line', to: 'new scores' },
            { label: 'Listing cache', sub: 'Redis sorted sets' },
          ],
          cost: 'A viral post costs one score write a second, however many people vote.',
        },
        right: {
          title: 'Reads',
          tone: 'mastered',
          nodes: [
            { label: 'Client', to: 'GET /r/…' },
            { label: '[[CDN]]', sub: 'logged-out pages', to: 'miss' },
            { label: 'Listing service', sub: 'ids from the sorted set', to: 'hydrate' },
            { label: 'Post cache', sub: 'titles, scores', tone: 'mastered' },
          ],
          cost: 'Most page views never reach a database.',
        },
        verdict: 'Votes are recorded synchronously and counted asynchronously. Listings are precomputed and read from memory.',
      },
    },
    {
      kind: 'list',
      ordered: true,
      items: [
        '**Post.** The post service writes to Postgres, sharded by post id with an index on `(communityId, createdAt)`, and adds the id to the community\'s `new` and `hot` sorted sets.',
        '**Comment.** Comments live in their own table, indexed by `postId`, so all of a post\'s comments are one range read.',
        '**Vote.** The vote service upserts the vote row, and in the same transaction an outbox row that is relayed to Kafka. The aggregator sums changes per item and writes scores in batches.',
        '**Browse.** The listing service reads a page of ids from the community\'s sorted set and hydrates them from the post cache. The client fetches the user\'s own votes for those ids in one batch call to light the arrows.',
        '**Read comments.** One read of the post\'s comments, assembled into a tree, sorted and cut to size (deep dive 3).',
      ],
    },
    {
      kind: 'prose',
      text: 'The bottlenecks: **the score row of a viral post**, **sorting a large community on every page view**, **threads with tens of thousands of comments**, and **front-page traffic spikes**, mostly logged-out readers seeing identical pages.',
    },

    { kind: 'heading', text: 'Deep dive 1 — votes and vote counts at scale' },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Increment a counter, store nothing else',
          text: '`UPDATE posts SET score = score + 1`. Nothing stops a second vote, nobody can take one back, and a viral post\'s row becomes a lock queue.',
        },
        {
          grade: 'good',
          title: 'Store the vote, update the score in the same transaction',
          text: 'A `votes` row keyed by `(userId, targetId)`; the transaction upserts it and adds `new − old` to the score. Correct and idempotent, but every vote still writes the hottest row in the database synchronously.',
        },
        {
          grade: 'great',
          title: 'Store the vote now, count it later',
          text: 'The vote row is written synchronously: it is the user\'s truth. The delta goes to Kafka, partitioned by `targetId`, and an aggregator sums deltas per item for a second before writing the score once. A post taking thousands of votes a second costs one write a second.',
        },
        {
          grade: 'best',
          title: 'Count later, and keep the voter\'s view honest',
          text: 'The client renders the user\'s own vote from the vote record and adjusts the displayed count locally, so the voter sees the change instantly while everyone else sees it a second or two later. Counting can also wait for anti-abuse scoring before a vote moves any ranking.',
        },
      ],
    },
    {
      kind: 'code',
      code: `-- one short transaction per vote
INSERT INTO votes VALUES ($1, $2, 0)
  ON CONFLICT DO NOTHING      -- so the lock below has a row
prev := SELECT dir FROM votes
          WHERE user_id = $1 AND target_id = $2 FOR UPDATE
UPDATE votes SET dir = $new WHERE user_id = $1 AND target_id = $2
INSERT INTO outbox VALUES ($2, $new - prev)  -- relayed to Kafka`,
      caption: 'The delta comes from the row the transaction locked, so two taps from two devices cannot both count. The first insert matters: FOR UPDATE cannot lock a row that does not exist yet. The outbox row commits with the vote, so no delta is lost.',
    },
    {
      kind: 'figure',
      caption: 'A vote is acknowledged once it is stored. Counting it happens afterwards, in batches.',
      figure: {
        kind: 'sequence',
        actors: ['Client', 'Vote service', 'Votes table', 'Kafka', 'Aggregator'],
        steps: [
          { from: 0, to: 1, label: 'PUT /votes/p1 dir=1' },
          { from: 1, to: 2, label: 'upsert, previous = none' },
          { from: 2, to: 1, label: 'committed', dashed: true },
          { from: 1, to: 0, label: '200 · arrow lit', dashed: true, tone: 'mastered' },
          { from: 1, to: 3, label: 'delta +1 for p1', dashed: true },
          { from: 3, to: 4, label: 'deltas for p1' },
          { from: 4, to: 4, label: 'sum for a second, write the score once', tone: 'line' },
        ],
        note: 'The voter is answered before the score moves. Everyone else sees the new count a second or two later.',
      },
    },
    {
      kind: 'prose',
      text: 'Size the votes store. 500M votes a day is ~180 billion rows a year at ~20 bytes: **~4 [[TB]] a year** before replication. The access pattern is pure key lookup — "what did this user vote on these 25 items" — with no joins, so a wide-column store partitioned by `userId` fits well (the transaction above becomes a conditional write), and lighting a page of arrows is one partition read. Posts and comments, which have real relationships, stay in Postgres.',
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Reddit fuzzes the vote totals it displays: the numbers shown are deliberately noisy, so a spammer cannot tell whether their bot votes were counted. The score that ranks is real; the number shown is not. For years Reddit also archived posts after six months by default, closing them to new votes, which keeps the set of scores that can still change bounded.',
    },

    { kind: 'heading', text: 'Deep dive 2 — hot, top, and caching ranked listings' },
    {
      kind: 'prose',
      text: 'Reddit\'s hot ranking was published with its open-source code, and it has one property that makes the whole listing design simple.',
    },
    {
      kind: 'code',
      code: `s       = ups - downs
order   = log10(max(abs(s), 1))
sign    = 1 if s > 0 else -1 if s < 0 else 0
seconds = created_at - 1134028003   # epoch seconds
hot     = sign * order + seconds / 45000`,
      caption: 'Reddit hot: the time term uses when the post was created, not the current time.',
    },
    {
      kind: 'prose',
      text: '**The time term is the creation time, not now.** A post\'s hot score therefore changes only when its votes change. Newer posts start with a bigger time term, so the listing ages by itself: every 45,000 seconds — 12.5 hours — of age costs a factor of ten in net votes.',
    },
    {
      kind: 'table',
      head: ['Post age', 'Net votes to tie a new post with 100'],
      rows: [
        ['New', '100'],
        ['12.5 hours', '1,000'],
        ['25 hours', '10,000'],
        ['37.5 hours', '100,000'],
      ],
    },
    {
      kind: 'figure',
      caption: 'Why the hot formula decides the architecture: re-sort everything on a timer, or touch one item per vote.',
      figure: {
        kind: 'split',
        left: {
          title: 'Score depends on now',
          tone: 'alert',
          nodes: [
            { label: 'Every live post', to: 'every few minutes' },
            { label: 'Recompute and re-sort', sub: 'whether or not anyone voted', tone: 'alert' },
          ],
          cost: 'Work grows with the number of live posts, and the stored order is always going stale.',
        },
        right: {
          title: 'Score depends on creation time',
          tone: 'mastered',
          nodes: [
            { label: 'A vote batch arrives', to: 'once' },
            { label: 'Update one member', sub: 'ZADD with the new score', tone: 'mastered' },
          ],
          cost: 'Work grows with votes, and the order never goes stale between them.',
        },
        verdict: 'A formula that divides by current age, like the widely cited Hacker News one, forces the left side. Reddit\'s forces nothing, so a sorted set per community is the whole answer.',
      },
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Sort at read time',
          text: '`ORDER BY hot DESC LIMIT 25` over a large community on every page view, with the formula computed in the query. Fine for a small forum; a scan per request for a big one.',
        },
        {
          grade: 'good',
          title: 'Store the hot score and index it',
          text: 'A `hot` column written by the aggregator and indexed on `(communityId, hot)`. Reads become index range scans, but every page view is still a database read.',
        },
        {
          grade: 'great',
          title: 'A sorted set per community and sort',
          text: 'Redis keys like `hot:{community}` and `top:{community}:week`, each trimmed to the top 1,000 ids. The aggregator updates members as scores change; a page is `ZREVRANGE` plus a batch hydrate from the post cache.',
        },
        {
          grade: 'best',
          title: 'Sorted sets, plus one shared page for everyone',
          text: 'The listing is the same for every reader; only the arrows differ. Cache rendered pages for logged-out readers at the CDN for 30–60 seconds, give logged-in users the same cached ids, and fetch their votes separately. Personalisation never forks the cache.',
        },
      ],
    },
    {
      kind: 'prose',
      text: '**Top** is a sorted set per community and window, scored by net votes and holding only posts created inside the window: a sweep removes members older than the window start, and reads double-check creation time. **New** is a sorted set scored by creation time, rebuildable from the `(communityId, createdAt)` index. Capping each listing at about a thousand ids is a product decision as much as an engineering one — Reddit\'s own listings have long stopped there, and nobody pages that deep.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Recomputing every post\'s hot score on a timer. With Reddit\'s formula it is wasted work, because a post\'s score changes only when it is voted on. Candidates who recite the formula and miss this property build a batch job the design does not need.',
    },

    { kind: 'heading', text: 'Deep dive 3 — nested comment trees' },
    {
      kind: 'prose',
      text: 'A popular thread has tens of thousands of comments nested dozens deep, sorted by score at every level, and it is read far more often than it is written. The storage model is the whole question.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Fetch children level by level',
          text: 'Load the top-level comments, then each one\'s replies, then theirs: a query per node, or at best per level. A deep thread is hundreds of round trips.',
        },
        {
          grade: 'good',
          title: 'Adjacency list with a recursive query',
          text: '`parentId` on each row, and `WITH RECURSIVE` in Postgres walks the tree in one statement. One round trip, but sorting siblings by score inside the recursion is awkward, and it reruns on every view.',
        },
        {
          grade: 'great',
          title: 'One range read by post, assembled in memory',
          text: 'Because every comment carries `postId`, one index range read returns the whole thread. Build the tree from parent pointers in memory, sort each set of siblings, cut at a depth and a count. Linear in the thread size, and simple.',
        },
        {
          grade: 'best',
          title: 'Cache the tree shape, load the edges lazily',
          text: 'Cache each post\'s tree as ids, parent pointers and scores, with no bodies, and update it as comments and score batches arrive. Render the top ~200 comments to a depth limit; "load more" and "continue this thread" fetch a subtree by `parentId` on demand. Bodies come from a comment cache in one batch.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'One read, one in-memory build, one cache entry per thread.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Range read by postId', sub: 'every comment, one query', to: 'rows' },
          { label: 'Build from parentId', sub: 'in memory', to: 'tree' },
          { label: 'Sort siblings', sub: 'best: confidence bound', tone: 'line', to: 'sorted' },
          { label: 'Cut', sub: '~200 comments, depth limit', to: 'cache' },
          { label: 'Tree cache', sub: 'ids · parents · scores', tone: 'mastered' },
        ],
        note: 'Bodies are hydrated separately in one batch. Cut-off branches become "load more" links that fetch a subtree by parent id.',
      },
    },
    {
      kind: 'prose',
      text: '**Best** sorting ranks comments by the lower bound of the Wilson score interval on their share of upvotes — a measure of confidence, not just margin. Ten up and none down outranks forty up and twenty down, because ten unanimous votes say more than a sixty-vote split. Reddit introduced this sort in 2009.',
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Reddit\'s old open-source code kept each post\'s comment tree as a separate structure of comment ids and parent links, with precomputed sort orders per post, so rendering a thread never had to walk the comment bodies. The tree shape is small and hot; the bodies are large and only needed for what is on screen.',
    },
  ],
  followups: [
    {
      q: 'How do you build the home page from someone\'s two hundred subscriptions?',
      a: 'Merge on read: take the head of each subscribed community\'s cached hot list, merge by hot score, and hydrate one page. Hot scores are comparable across communities because the formula is global, so this is a plain merge of sorted lists — though big communities then crowd out small ones, so cap each community\'s share of a page. Limit how many communities one request merges, and see the news-feed problem for when per-user precomputation wins instead.',
    },
    {
      q: 'A post goes viral and takes fifty thousand votes a minute. What breaks?',
      a: 'Vote rows spread across users, so the votes store is fine. The score is the hotspot, and the aggregator already turns it into one write a second. The post\'s cache entry becomes a hot read key, so replicate it or let the CDN-cached page absorb the reads; the listing\'s sorted set sees one update per batch.',
    },
    {
      q: 'How do you defend against vote manipulation?',
      a: 'Store every vote, but let it move rankings only after scoring for abuse: account age, voting rings, many accounts behind one network address or device. The aggregator can drop or down-weight votes, and fuzzing the displayed totals denies bots feedback. Rate-limit votes per account so a compromised one cannot do much damage quickly.',
    },
    {
      q: 'Why not keep votes in Postgres with everything else?',
      a: 'At around four terabytes a year of nothing but key lookups, a wide-column store partitioned by user is a better fit, and it grows by adding nodes. Sharded Postgres would also work for a long time, and saying so is fine: choose by access pattern, not fashion. Posts and comments keep their relational home.',
    },
    {
      q: 'How do the top-of-the-week lists stay correct as posts age out?',
      a: 'Each window\'s sorted set holds only posts created inside the window. A periodic sweep removes members whose creation time has passed the window start, using a second sorted set scored by creation time to find them cheaply, and reads double-check creation time so a late sweep never shows a stale post.',
    },
  ],
}
