import type { Problem } from '../types'

export const yelp: Problem = {
  id: 'yelp',
  title: 'Design Yelp',
  kind: 'hld',
  category: 'location',
  difficulty: 'medium',
  brief:
    'Users search for businesses near them, filtered by things like category and rating, and read and write reviews.',
  patterns: ['proximity', 'scaling-reads'],
  suggests: ['a-proximity', 'c-search', 'c-caching', 'a-reads'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to nearby search with filters, business pages, and one review per user per business' },
    { id: 'r2', bar: 'must', criterion: 'Sized the data and noticed the business set is small and nearly static' },
    { id: 'r3', bar: 'must', criterion: 'Explained why separate latitude and longitude indexes cannot serve a radius query' },
    { id: 'r4', bar: 'must', criterion: 'Chose a geospatial index and handled cell boundaries by querying neighbours' },
    { id: 'r5', bar: 'senior', criterion: 'Served geo, filters and text in one query with Elasticsearch or PostGIS, and said why' },
    { id: 'r6', bar: 'senior', criterion: 'Kept Postgres as the source of truth and synced the index by CDC' },
    { id: 'r7', bar: 'senior', criterion: 'Stored rating sum and count on the business, updated in the review transaction' },
    { id: 'r8', bar: 'senior', criterion: 'Enforced one review per user per business with a unique constraint' },
    { id: 'r9', bar: 'senior', criterion: 'Cached by geohash cell and category rather than exact coordinates' },
    { id: 'r10', bar: 'staff', criterion: 'Ranked by a Bayesian average so a few reviews cannot outrank many' },
    { id: 'r11', bar: 'staff', criterion: 'Scaled the index with replicas rather than shards, and said when that would change' },
    { id: 'r12', bar: 'staff', criterion: 'Handled zoomed-out map views by aggregating results into clusters' },
  ],
  followups: [
    {
      q: 'The user zooms the map out to the whole city. What do you return?',
      a: "Not fifty thousand pins. Aggregate by geohash cell (Elasticsearch's `geohash_grid` aggregation does exactly this) and return a count per cell, which the map draws as clusters. Individual businesses come back only once the viewport is small enough to show them, and pans are debounced so a drag is one query, not twenty.",
    },
    {
      q: 'How do you deal with fake reviews?',
      a: 'One review per user per business is the constraint you already have. Beyond it, score each review asynchronously on signals such as account age, review velocity and device, and keep suspicious ones out of the rating rather than deleting them. Yelp does this visibly: reviews its software does not recommend are shown separately and left out of the star rating.',
    },
    {
      q: 'A new restaurant opens. How soon can people find it?',
      a: 'Within seconds. The insert reaches Elasticsearch through [[CDC]], and Elasticsearch makes new documents searchable on its refresh interval, one second by default. The only other delay is a cached busy-area result, which expires within minutes.',
    },
    {
      q: 'A restaurant goes viral and gets a thousand reviews in an hour. Does its row melt?',
      a: 'No. A thousand an hour is one every few seconds, which a single Postgres row absorbs without noticing. If it were ever thousands a second, buffer the increments in Redis and fold them into the row every few seconds; the sum-and-count design makes that a plain addition.',
    },
    {
      q: 'When would you shard?',
      a: "The business index, probably never: add replicas for throughput. Reviews are the data that grows, and every read is \"reviews for this business\", so if they outgrow one Postgres primary, shard them by `businessId`. That keeps each business's reviews and its rating update on one shard.",
    },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Users should be able to search for businesses near a point, or inside the map they are looking at, filtered by category, price, rating, open now, and free text.',
        'Users should be able to view a business with its average rating and its reviews.',
        'Users should be able to leave one review, a star rating plus text, per business.',
        'Out of scope: photos (the blob pattern bolted on), business owner tools, reservations, ads.',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional: **search under 500 ms** at p99. **Read-heavy**: assume 100M daily users doing five searches each, about 6,000 searches a second on average and around 20,000 at the evening peak. **Writes are rare**: a million new reviews a day is about 12 a second. A rating a few seconds stale is fine; a user reviewing the same business twice is not.',
    },
    {
      kind: 'prose',
      text: "Size the data, because it changes the answer. Assume 10M businesses at about 1 [[KB]] each: **10 [[GB]]**, which fits in memory on one machine. A billion reviews at 1 KB is a terabyte, but no query ever needs more than one business's reviews at a time. The thing search runs over is small and almost never changes.",
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Ten million businesses is about ten gigabytes, and a restaurant never moves. So the search index is small and nearly static, and I would rather replicate it than shard it.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'list',
      items: [
        '`Business`: id, name, location (latitude, longitude), category, price, hours, `rating_sum`, `review_count`.',
        '`Review`: id, businessId, userId, rating from 1 to 5, text, createdAt. Unique on `(businessId, userId)`.',
        '`User`.',
      ],
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'prose',
      text: "Four [[API]] endpoints. Search takes either a point and radius or the map's bounding box, because the map is how most people search.",
    },
    {
      kind: 'code',
      code: `GET  /businesses/search
       ?lat=&lng=&radius=   or   ?bbox=w,s,e,n
       &category=&price=&minRating=&openNow=&q=&cursor=
                              -> { results: Summary[], next }

GET  /businesses/{id}         -> Business
GET  /businesses/{id}/reviews?cursor=
                              -> { reviews: Review[], next }
POST /businesses/{id}/reviews  { rating, text }  -> 201 Review`,
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'Search and reviews share data but nothing else: one path is hot and read-only, the other cold and transactional.',
      figure: {
        kind: 'split',
        left: {
          title: 'Read path, hot',
          tone: 'line',
          nodes: [
            { label: 'Client', sub: 'list and map', to: 'search' },
            { label: 'Search service', sub: 'geo + filters + text', tone: 'line', to: 'one query' },
            { label: 'Elasticsearch', sub: 'businesses, replicated', tone: 'line' },
          ],
          cost: 'About 20,000 queries a second at peak.',
        },
        right: {
          title: 'Write path, cold',
          tone: 'neutral',
          nodes: [
            { label: 'Client', sub: 'writes a review', to: 'POST' },
            { label: 'Review service', sub: 'one transaction', to: 'commit' },
            { label: 'Postgres', sub: 'source of truth', to: 'change stream' },
            { label: 'Elasticsearch', sub: 'rating updated in seconds' },
          ],
          cost: 'About 12 writes a second.',
        },
        verdict: 'Two paths three orders of magnitude apart in traffic. Design them separately, and let [[CDC]] connect them.',
      },
    },
    {
      kind: 'list',
      items: [
        '**Search** goes to the search service, which runs one query against Elasticsearch: a geo filter, the structured filters, the text match and a sort. It returns ids and summary fields, and nothing on this path touches Postgres.',
        '**A business page** reads the business by id through a cache in front of Postgres, and the first page of reviews from Postgres by `businessId`, newest first.',
        "**Writing a review** is one Postgres transaction that inserts the review and updates the business's rating totals. Debezium reads the Postgres log into Kafka, and a consumer carries the new rating into Elasticsearch within seconds.",
      ],
    },
    {
      kind: 'prose',
      text: 'The interesting parts are the deep dives: how "near" is indexed, how a rating stays correct without being recomputed, and how the busiest searches avoid the index entirely.',
    },

    { kind: 'heading', text: 'Deep dive 1 — finding businesses near a point' },
    {
      kind: 'prose',
      text: '"Coffee within 2 km, open now, four stars and up" is a two-dimensional range plus filters. Every rung below is a real system; the question is what each one costs.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Latitude and longitude columns with ordinary indexes',
          text: "`WHERE lat BETWEEN … AND lng BETWEEN …` can use one of the two indexes, so it fetches a band of latitude that circles the planet and filters the rest. A composite index on `(lat, lng)` narrows only the first column's range.",
        },
        {
          grade: 'good',
          title: 'A geohash column with a B-tree',
          text: 'Interleave latitude and longitude bits into a string, so a shared prefix means nearby and a prefix range is an ordinary index scan. Query the cell and its eight neighbours, then filter by true distance. Works in any database, but the precision is fixed: a 2 km search returns thousands of rows in central London and a handful in rural Wales.',
        },
        {
          grade: 'great',
          title: 'A quadtree or [[S2]] cells',
          text: 'Cells split where businesses are dense and stay coarse where they are sparse, so every leaf holds a similar number. Businesses barely move, so the tree is built in memory and rebuilt nightly. Excellent for pure proximity, but it is a custom service, and filters and text still need another system.',
        },
        {
          grade: 'best',
          title: 'One store that does geo, filters and text together',
          text: 'Elasticsearch: a `geo_point` field, a `geo_distance` or `geo_bounding_box` filter, structured filters and text relevance in a single request. Ten gigabytes fits in memory on every replica, so scaling is adding replicas. [[PostGIS]] is the equally good pick when text search is light and you would rather run one database.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'A geohash search: the cell holding the user and its eight neighbours, then a true-distance filter.',
      figure: {
        kind: 'grid',
        cols: 5,
        cells: [
          { tone: 'neutral' }, { tone: 'neutral' }, { tone: 'neutral' }, { tone: 'neutral' }, { tone: 'neutral' },
          { tone: 'neutral' }, { tone: 'streak' }, { tone: 'streak' }, { tone: 'streak' }, { tone: 'neutral' },
          { tone: 'neutral' }, { tone: 'streak' }, { tone: 'line', label: 'you' }, { tone: 'streak' }, { tone: 'neutral' },
          { tone: 'neutral' }, { tone: 'streak' }, { tone: 'streak' }, { tone: 'streak' }, { tone: 'neutral' },
          { tone: 'neutral' }, { tone: 'neutral' }, { tone: 'neutral' }, { tone: 'neutral' }, { tone: 'neutral' },
        ],
        legend: [
          { tone: 'line', label: 'the cell containing the search point' },
          { tone: 'streak', label: 'neighbours: a business metres away can sit across a boundary' },
          { tone: 'neutral', label: 'never read' },
        ],
        note: 'Nine prefix scans instead of a table scan. The cell size is fixed by the precision, which is what quadtrees and S2 improve on.',
      },
    },
    {
      kind: 'callout',
      tone: 'example',
      text: "Yelp's own engineering blog describes moving its core business search onto Elasticsearch. Worth knowing when an interviewer asks whether the textbook answer is what anyone actually runs.",
    },

    { kind: 'heading', text: 'Deep dive 2 — ratings that are correct and cheap' },
    {
      kind: 'prose',
      text: 'Search filters on rating and every result shows one, so the average is read hundreds of thousands of times a second and written about twelve.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: '`AVG(rating)` at read time',
          text: 'Hundreds of thousands of aggregations a second over a billion rows, and the search index cannot filter on a number that only exists at query time.',
        },
        {
          grade: 'good',
          title: 'A stored average, recomputed nightly',
          text: 'Reads become a column. But it is up to a day stale, and a new restaurant shows no rating until tomorrow, which is exactly when its owner is looking.',
        },
        {
          grade: 'great',
          title: "Update the totals in the review's own transaction",
          text: 'Insert the review and run `SET rating_sum = rating_sum + :r, review_count = review_count + 1` in one transaction. Store the **sum**, not the average: an edit is then exact (subtract the old rating, add the new) and nothing drifts. The unique constraint on `(businessId, userId)` makes a double submit fail cleanly. Contention is a non-issue at twelve writes a second across ten million rows.',
        },
        {
          grade: 'best',
          title: 'Exact totals, ranked by a Bayesian average',
          text: 'Keep the exact totals for display, but rank by `(C * m + rating_sum) / (C + review_count)`, where `m` is the average across all businesses and `C` a prior weight of, say, ten reviews. A single five-star review no longer outranks 4.6 stars across two thousand.',
        },
      ],
    },

    { kind: 'heading', text: 'Deep dive 3 — caching the busy areas' },
    {
      kind: 'prose',
      text: 'Searches cluster: city centres at lunchtime, a handful of categories, many people standing in roughly the same place. The trick is a cache key that lets those people share an answer.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Cache on the exact request',
          text: "Every user's coordinates differ in the sixth decimal place, so the hit rate is roughly zero and the cache is pure cost.",
        },
        {
          grade: 'good',
          title: 'Cache on a rounded location',
          text: 'Key on the geohash cell of about 1 km, the category and the normalised filters, with a [[TTL]] of a few minutes. People in the same block now share an entry. But filters multiply the keys, and "open now" changes every hour.',
        },
        {
          grade: 'great',
          title: 'Cache the candidates, apply the rest per request',
          text: 'Cache only candidate ids and summary fields per cell and category, then apply distance from the exact point, open now and the rating filter in the search service. One entry serves every filter combination, and nothing volatile is baked into it.',
        },
        {
          grade: 'best',
          title: 'Precompute the head, cache the middle, query the tail',
          text: 'Precompute results for the busiest cells and categories and serve the anonymous versions from the [[CDN]]; cache candidates for everything else in Redis; let the long tail hit Elasticsearch. The index handles the tail easily because the head never reaches it.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'Each layer answers what it can and passes the rest down. The busiest searches never reach the index.',
      figure: {
        kind: 'stack',
        layers: [
          { label: 'CDN', sub: 'precomputed busy areas, anonymous users', tone: 'mastered' },
          { label: 'Redis', sub: 'candidates by cell and category, minutes to live', tone: 'line' },
          { label: 'Elasticsearch', sub: 'the long tail, every filter', tone: 'neutral' },
          { label: 'Postgres', sub: 'never on the search path', tone: 'neutral' },
        ],
        note: 'Personalised results skip the edge layer but still share the Redis candidates.',
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Sharding the business index by region "for scale". Ten gigabytes is not a sharding problem; it is a replica count. Sharding by region also adds a second boundary problem: every search near a region edge now queries two shards and merges.',
    },
  ],
}
