import type { Problem } from '../types'

export const instagram: Problem = {
  id: 'instagram',
  title: 'Design Instagram',
  kind: 'hld',
  category: 'social',
  difficulty: 'medium',
  brief:
    'Users post photos, follow each other, and scroll a feed of posts from the people they follow. They can also post stories that disappear after a day.',
  patterns: ['blobs', 'scaling-reads', 'longrunning'],
  suggests: ['a-blobs', 'a-reads', 'c-caching', 'c-sharding'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to posting, following, the feed and stories, and named ranking, search and comments as out of scope' },
    { id: 'r2', bar: 'must', criterion: 'Uploaded media straight to blob storage with presigned URLs, never through the API servers' },
    { id: 'r3', bar: 'must', criterion: 'Served images from a CDN in several sizes rather than serving the original' },
    { id: 'r4', bar: 'must', criterion: 'Identified feed assembly as the read bottleneck and chose availability over consistency for it' },
    { id: 'r5', bar: 'senior', criterion: 'Started media processing from the storage event, asynchronously, with the post going live once its variants exist' },
    { id: 'r6', bar: 'senior', criterion: 'Used hybrid fan-out, pulling high-follower accounts at read time, and called the threshold a tunable knob' },
    { id: 'r7', bar: 'senior', criterion: 'Stored the follow graph once per direction, each keyed for the query that reads it' },
    { id: 'r8', bar: 'senior', criterion: 'Enforced story expiry on the read path, with the TTL only reclaiming space' },
    { id: 'r9', bar: 'staff', criterion: 'Fanned out only to recently active followers and rebuilt dormant feeds on demand' },
    { id: 'r10', bar: 'staff', criterion: 'Bucketed very large follower lists so one celebrity is not one giant partition' },
    { id: 'r11', bar: 'staff', criterion: 'Handled deletion and takedowns with immutable CDN objects in mind: explicit purge or short-lived signed URLs' },
    { id: 'r12', bar: 'staff', criterion: 'Asked whether expired stories are deleted or archived, and kept the author archive separate from viewer visibility' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Users should be able to post a photo, or a short video, with a caption.',
        'Users should be able to follow other users and scroll a feed of their recent posts, newest first.',
        'Users should be able to post a story that their followers can see for 24 hours, and then cannot.',
        'Out of scope: likes and comments, search, Explore and recommendations, direct messages, a ranked feed.',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional, with numbers. Assume **500M [[DAU]]**, each opening the feed about ten times a day: ~5 billion feed loads a day, **~60k a second** on average and two to three times that at peak. Assume 100M new posts a day, ~1,200 a second. That is roughly **50 reads for every write**, before counting the image fetches behind each feed load.',
    },
    {
      kind: 'list',
      items: [
        '**The feed loads in under 500 ms**, and the images on screen start rendering at once — from an edge near the user, not an origin across an ocean.',
        '**Availability over consistency.** A new post reaching followers\' feeds within a minute is fine. Nobody can tell.',
        '**An upload is never lost.** A photo the app said was posted must exist. [[S3]] is designed for eleven nines of durability; you inherit that by putting the bytes there.',
        '**Storage grows fast.** ~2 [[MB]] per original plus ~1 MB of resized copies, × 100M a day, is **~300 [[TB]] a day** — over a hundred petabytes a year. Media is the bulk; metadata is a rounding error.',
      ],
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Instagram is two systems that share an id. One moves large immutable bytes: upload, resize, serve from a [[CDN]]. The other is a read-heavy feed of small records. I will design them separately, because the techniques do not overlap.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'prose',
      text: '**User**; **Post** (id, authorId, caption, mediaIds, createdAt); **Media** (id, status, the keys of its stored variants); **Follow** (followerId, followeeId); **Story** (id, authorId, mediaId, createdAt, expiresAt); and **Feed**, the precomputed list of post ids per user. Media is its own entity on purpose: it exists, and can fail processing, before any post refers to it.',
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Instagram\'s engineering blog described its early post ids: 64 bits made of 41 bits of milliseconds since a custom epoch, 13 bits of logical shard, and 10 bits of per-shard sequence, generated inside Postgres. Ids sort by time, so a feed cursor is just an id, and every id says which shard holds its row.',
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'prose',
      text: 'One endpoint per requirement, plus the upload handshake. The [[API]] servers never see image bytes.',
    },
    {
      kind: 'code',
      code: `POST /media                 { contentType, sizeBytes }
                            -> { mediaId, uploadUrls[] }
POST /posts                 { mediaIds[], caption } -> { postId }
PUT  /users/{id}/follow     -> 200
GET  /feed?cursor=&limit=20 -> { posts[], nextCursor }
POST /stories               { mediaId } -> { storyId }
GET  /stories/tray          -> [{ authorId, storyIds[], seen }]`,
      caption: 'Posting is two calls: reserve a media id and get signed upload links, then publish. Feed cursors are post ids, which sort by time.',
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'Posting moves bytes to storage and an event to the feed; reading assembles ids and lets the CDN serve the images.',
      figure: {
        kind: 'split',
        left: {
          title: 'Posting',
          tone: 'line',
          nodes: [
            { label: 'App', to: 'presigned PUT' },
            { label: 'S3 originals', to: 'object created' },
            { label: 'Media workers', sub: 'resize · strip metadata', to: 'ready' },
            { label: 'Post service', sub: 'row + fan-out event', tone: 'line' },
          ],
          cost: 'Bytes go straight to storage. Your servers handle only metadata and events.',
        },
        right: {
          title: 'Reading',
          tone: 'mastered',
          nodes: [
            { label: 'App', to: 'GET /feed' },
            { label: 'Feed service', sub: 'precomputed ids', to: 'hydrate' },
            { label: 'Post cache', sub: 'captions, media keys', to: 'image links' },
            { label: 'CDN', sub: 'the bytes', tone: 'mastered' },
          ],
          cost: 'The feed response is a few [[KB]] of JSON. The megabytes come from the edge.',
        },
        verdict: 'Two paths that meet only at the post id. Scale each on its own terms.',
      },
    },
    {
      kind: 'list',
      ordered: true,
      items: [
        '**Upload.** The app calls `POST /media`; the media service creates a `Media` row in state `pending` and returns presigned [[URL|URLs]] scoped to one key. The app uploads straight to S3.',
        '**Process.** S3\'s object-created event lands on a queue. Workers make the resized variants, strip metadata, run safety checks and mark the media `ready`.',
        '**Publish.** `POST /posts` writes the post row to a store sharded by author — the shard bits in the post id say which — then emits `PostCreated` to Kafka. Fan-out workers write the post id into followers\' feeds.',
        '**Follow.** A write to the follow graph, stored once per direction (deep dive 2).',
        '**Read the feed.** The feed service reads the precomputed ids, merges in recent posts from the few celebrities the user follows, hydrates the posts from a cache, and returns CDN links. The app fetches the images from the edge.',
        '**Stories.** A separate, smaller store with an expiry on every row, read through a per-viewer tray (deep dive 3).',
      ],
    },
    {
      kind: 'prose',
      text: 'The bottlenecks, named: **bytes through your servers** on upload, **feed assembly** on read, **CDN egress** as the largest bill, and **the celebrity post**, which would mean hundreds of millions of feed writes if handled like anyone else\'s.',
    },

    { kind: 'heading', text: 'Deep dive 1 — getting photos in, and out again' },
    {
      kind: 'prose',
      text: 'Photos are a few megabytes and videos far more, uploaded over mobile networks that drop. This is the large-blobs pattern: keep the bytes away from your servers in both directions.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Upload through the API servers',
          text: 'A multipart form post to your app servers, which stream it on to storage. Every byte crosses your fleet, a 50 MB video holds a connection for the length of a slow mobile upload, and a deploy kills everything in flight.',
        },
        {
          grade: 'good',
          title: 'A presigned PUT straight to S3',
          text: 'The server signs a URL for one key, one content type and a size limit, valid for a few minutes. The bytes skip your fleet entirely. But one dropped connection restarts the upload from zero, and you learn it finished only if the client says so.',
        },
        {
          grade: 'great',
          title: 'Presigned multipart upload',
          text: 'Split into parts of 5–10 MB, each with its own signed URL, each retried on its own. A video uploaded on a train survives the tunnel. S3\'s minimum part size is 5 MB, so most photos go as a single part — the same flow with one URL.',
        },
        {
          grade: 'best',
          title: 'Multipart upload, with storage driving the pipeline',
          text: 'The object-created event from S3, not the client, is what says the upload finished. It starts an asynchronous pipeline, and the post goes live only once its variants exist. A client that dies mid-upload leaves a `pending` media row that expires on its own.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'The storage event starts processing, so the app never has to report that its upload finished.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'App', sub: 'parts in parallel', to: 'signed links' },
          { label: 'S3 originals', sub: 'never served', to: 'object created' },
          { label: 'Queue', to: 'pull' },
          { label: 'Media workers', sub: '4 widths · strip metadata · safety', tone: 'line', to: 'write' },
          { label: 'S3 variants', sub: 'immutable keys', tone: 'mastered' },
        ],
        note: 'Processing is asynchronous and retried per job. The app shows its local copy the moment the user taps share, so none of this is felt.',
      },
    },
    {
      kind: 'prose',
      text: 'Workers produce a handful of widths — a thumbnail around 150 px, then roughly 320, 640 and 1080 — in a modern format such as WebP. They strip [[EXIF]] metadata, because a phone photo\'s location fields can give away a home address. They run safety classifiers before anything is visible. Each job is idempotent on `(mediaId, width)`, so a retried job overwrites rather than duplicates.',
    },
    {
      kind: 'prose',
      text: 'Serving is where the money goes. Every variant gets a key that is never reused, like `/m/{mediaId}/640.webp`, so the CDN can cache it with a year-long `Cache-Control: immutable` and never invalidate it — an edited photo is a new key. The app asks for the width that matches its screen, and the feed response carries keys, not bytes.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Serving the original in the feed. A 12-megapixel original is several megabytes; a feed tile on a phone needs a 1080-pixel variant of a few hundred kilobytes. Shipping originals multiplies egress, your largest bill, for no difference anyone can see.',
    },

    { kind: 'heading', text: 'Deep dive 2 — the feed and the follow graph' },
    {
      kind: 'prose',
      text: 'This is the news-feed problem with photos attached, so work that one for the full fan-out argument. The short version here, then the parts specific to Instagram.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Fan-out on write (push)',
        points: [
          'Post once; workers prepend the id to every follower\'s feed',
          'A feed read is one lookup — fast and predictable',
          'A celebrity post means hundreds of millions of writes',
        ],
      },
      right: {
        title: 'Fan-out on read (pull)',
        points: [
          'Posting writes one row',
          'A feed read queries every account you follow and merges',
          'Latency grows with follow count: the slowest of hundreds of parallel queries sets it',
        ],
      },
      verdict: 'Hybrid. Push for ordinary accounts, pull for accounts above a follower threshold, merged at read time. The threshold is a tunable knob, not a constant.',
    },
    {
      kind: 'prose',
      text: '**Only fan out to people who will look.** A large share of any big follower list is dormant accounts. Keep precomputed feeds only for users active in, say, the last 30 days; the fan-out worker skips everyone else, and a returning user\'s feed is rebuilt by a one-off pull when they open the app. That cuts fan-out work and feed storage without changing what any active user sees.',
    },
    {
      kind: 'prose',
      text: 'Size the feed store out loud. Keep the latest 500 post ids per active user: 500 × 8 bytes = **4 KB**; × 500M users ≈ **2 TB** of raw ids, several times that with Redis overhead. That fits in a Redis cluster with replicas, which settles that the feed lives in memory. Hydration is then a batch get against a post cache that hits almost every time, because one post appears in thousands of feeds.',
    },
    {
      kind: 'prose',
      text: '**The follow graph is two tables, not a graph database.** Every query is one hop — "who do I follow", "who follows me" — and neither needs traversal. Store each edge twice in a wide-column store such as Cassandra or DynamoDB: `following` partitioned by `followerId`, and `followers` partitioned by `followeeId`. A follow writes both; each read is one partition. Assume a billion accounts averaging 200 follows: 200 billion edges at ~16 bytes is ~3 TB per direction before replication. Large, but ordinary for a sharded store.',
    },
    {
      kind: 'figure',
      caption: 'Each direction of the follow graph is partitioned by the account it is read for.',
      figure: {
        kind: 'split',
        left: {
          title: 'following · key followerId',
          tone: 'mastered',
          nodes: [
            { label: 'user 42', to: 'follows' },
            { label: '200 rows', sub: 'one small partition', tone: 'mastered' },
          ],
          cost: 'Bounded by how many accounts one person follows. Always small.',
        },
        right: {
          title: 'followers · key followeeId + bucket',
          tone: 'streak',
          nodes: [
            { label: 'a celebrity', to: 'followed by' },
            { label: '500M+ rows', sub: 'split into 100k-row buckets', tone: 'streak' },
          ],
          cost: 'Unbounded. Without buckets, one account is one gigantic partition on one node.',
        },
        verdict: 'The same edge, written twice, keyed for the query that reads it. Bucket only the side that can grow without limit.',
      },
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Facebook serves its social graph from [[TAO]], a caching layer of objects and association lists in front of sharded MySQL. It is the same answer at a larger scale: lists keyed by the node they hang off, read one hop at a time, with no traversal engine anywhere.',
    },

    { kind: 'heading', text: 'Deep dive 3 — stories that expire after 24 hours' },
    {
      kind: 'prose',
      text: 'Two requirements hide in "disappears after a day". Followers must stop seeing a story at 24 hours, on the dot — a promise to the user, and a privacy one. And Instagram keeps expired stories in the author\'s private archive, so "disappears" means "hidden from viewers", not "deleted". Ask; it changes what the expiry is allowed to destroy.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'A nightly job deletes expired stories',
          text: 'Stories linger for up to a day past their promise, the sweep is a huge scan, and if the job fails one night nothing expires at all.',
        },
        {
          grade: 'good',
          title: 'A native [[TTL]] on the row',
          text: 'Cassandra and DynamoDB both expire rows for you, but not the same way. DynamoDB\'s expiry is lazy housekeeping: it deletes expired items within a few days, and reads return them until then, so a story can outlive its 24 hours by days. Cassandra hides expired cells on time, but leaves tombstones that slow reads until compaction. Either way, a privacy promise now rests on one store\'s expiry rules.',
        },
        {
          grade: 'great',
          title: 'Filter on `expiresAt` at read time',
          text: 'Every read checks `expiresAt > now`, so a story vanishes on time whatever the cleanup is doing. The TTL becomes only a way to reclaim space, set a little after the 24 hours.',
        },
        {
          grade: 'best',
          title: 'Read-time filter, TTL for cleanup, archive kept apart',
          text: 'Visibility is enforced on read. The viewer-facing rows carry a TTL. The media object stays, owned by the author\'s archive, and story links are signed with a short expiry so a cached or shared link stops working too.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'One story, four lifetimes: what viewers see, the tray, the stored row, and the archive.',
      figure: {
        kind: 'timeline',
        ticks: ['0h · posted', '12h', '24h', '36h', '48h'],
        lanes: [
          {
            label: 'Visible to followers',
            bars: [{ from: 0, to: 0.5, label: 'read filter: expiresAt > now', tone: 'line' }],
            outcome: { label: 'hidden at 24h, exactly', tone: 'mastered' },
          },
          {
            label: 'Tray entry for each follower',
            bars: [{ from: 0, to: 0.5, label: 'trimmed by score on read', tone: 'line' }],
            outcome: { label: 'gone from the tray', tone: 'neutral' },
          },
          {
            label: 'Story row in the store',
            bars: [{ from: 0, to: 0.7, label: 'TTL, deleted lazily', tone: 'streak' }],
            outcome: { label: 'space reclaimed later', tone: 'neutral' },
          },
          {
            label: 'Author\'s archive',
            bars: [{ from: 0, to: 1, label: 'kept', tone: 'neutral' }],
            outcome: { label: 'until they delete it', tone: 'neutral' },
          },
        ],
        note: 'The 24-hour promise is kept by the read path. Deletion is housekeeping, and it is allowed to be late.',
      },
    },
    {
      kind: 'prose',
      text: '**The tray** — the row of circles at the top of the app — is the first thing every app open renders, so it is read far more often than stories are posted. Make it a small fan-out on write: when someone posts a story, workers update a per-viewer Redis sorted set of `authorId → latest story time` for each active follower. The tray read trims anything older than 24 hours by score and orders what is left. Celebrities are pulled at read time, exactly as in the feed. Seen state is a per-viewer set of story ids that itself expires after a day.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Expiry is a read-path rule, not a delete job. I filter on `expiresAt` on every read, so a story disappears on time whatever cleanup is doing, and the TTL just gives the space back.',
    },
  ],
  followups: [
    {
      q: 'A celebrity with hundreds of millions of followers posts a photo. Walk me through what happens.',
      a: 'Upload and processing are identical to anyone else\'s. The post row is written and one event emitted; the fan-out worker sees the account is above the threshold and skips it. Followers pick the post up at read time from a cached list of that account\'s recent posts, which is now a hot key, so it is replicated across cache nodes. The first wave of requests warms the images at the CDN.',
    },
    {
      q: 'How would you rank the feed instead of showing it newest first?',
      a: 'Keep everything above as candidate generation: the precomputed ids plus the pulled celebrity posts give a few hundred candidates. Add a ranking stage that scores them with a model on engagement features from a feature store, and cache the ranked page for the session so the feed does not reshuffle while the user scrolls. Recency becomes one feature rather than the sort key.',
    },
    {
      q: 'The app shows the new post the instant the user taps share. How, when processing takes seconds?',
      a: 'Optimistic UI. The app renders its local copy at once and uploads in the background with resumable multipart, carrying on across app restarts. The author\'s own feed gets the post inserted synchronously, so they read their own write, while followers receive it through fan-out seconds later. If processing fails, the app shows a retry on the post rather than losing it quietly.',
    },
    {
      q: 'A user deletes a photo, or it is taken down for legal reasons. How do you stop it being served?',
      a: 'Delete the post row first: hydration skips ids that no longer resolve, so feeds clean themselves without touching every follower\'s list. The image is the harder part, because immutable CDN objects can be cached for a year. Purge the keys at the CDN explicitly, then delete the variants and the original from storage.',
    },
    {
      q: 'What changes for video?',
      a: 'The upload path is the same multipart flow. Processing becomes transcoding into several renditions cut into short segments behind a streaming manifest, which is the YouTube problem; the feed autoplays a low rendition first and lets the player step up. Video also changes the cost picture: storage and egress per post rise by an order of magnitude or more.',
    },
  ],
}
