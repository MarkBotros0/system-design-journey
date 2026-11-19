import type { Problem } from '../types'

export const typeahead: Problem = {
  id: 'typeahead',
  title: 'Design search autocomplete',
  kind: 'hld',
  category: 'infra',
  difficulty: 'medium',
  brief:
    'As someone types into a search box, show the most likely completions of what they have typed so far — the way Google or Amazon do.',
  patterns: ['scaling-reads', 'scaling-writes'],
  suggests: ['c-caching', 'c-search', 'a-reads'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Set a latency target of about 100 ms and designed the read path to meet it' },
    { id: 'r2', bar: 'must', criterion: 'Precomputed suggestions offline instead of ranking them per request' },
    { id: 'r3', bar: 'must', criterion: 'Explained the trie, and why a database prefix query does not scale' },
    { id: 'r4', bar: 'must', criterion: 'Separated the serving path from the update pipeline' },
    { id: 'r5', bar: 'senior', criterion: 'Stored the top completions at each prefix and named what that costs to update' },
    { id: 'r6', bar: 'senior', criterion: 'Debounced on the client, and cached in the browser and at the edge' },
    { id: 'r7', bar: 'senior', criterion: 'Rebuilt from aggregated query logs with a decaying score, and swapped snapshots atomically' },
    { id: 'r8', bar: 'senior', criterion: 'Sharded by hashed prefix rather than by first letter' },
    { id: 'r9', bar: 'staff', criterion: 'Personalised by merging on the client, keeping the shared response cacheable' },
    { id: 'r10', bar: 'staff', criterion: 'Added a streaming trending layer for freshness inside the hour' },
    { id: 'r11', bar: 'staff', criterion: 'Filtered unsafe and private suggestions with a distinct-user threshold and a fast blocklist' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'prose',
      text: 'This problem is a latency budget wearing a data-structure costume. Put the number on the table early: a suggestion that arrives after the next keystroke is useless.',
    },
    {
      kind: 'list',
      items: [
        'Users should be able to see up to ten completions of the prefix they have typed, ranked by popularity, updating as they type.',
        'Users should be able to see what people are searching for now — a breaking story should appear within the hour.',
        'Users should be able to see their own recent searches first, when they match.',
        'Out of scope: the search results themselves, full spelling correction, and languages that need word segmentation.',
      ],
    },
    { kind: 'prose', text: 'Non-functional, with numbers:' },
    {
      kind: 'list',
      items: [
        '**Latency**: suggestions on screen within about 100 ms of a keystroke, which leaves the servers 10–20 ms.',
        '**Scale**: a billion searches a day. With debouncing, about five suggestion requests per search: around 60,000 [[QPS]] on average and 200,000 at peak.',
        '**Freshness**: shifts in popularity visible within an hour.',
        '**Availability over consistency**: two people seeing slightly different suggestions is fine; an empty dropdown is not.',
      ],
    },
    {
      kind: 'prose',
      text: 'Size the index. Keep the top hundred million distinct queries — the long tail of searches typed once is noise, and some of it is private. Their distinct prefixes number in the hundreds of millions, and ten suggestion references per prefix comes to tens of [[GB]]: too big to be casual about, small enough to hold in memory across a handful of shards. That decides the design. **Everything is precomputed, and served from memory.**',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'The request path does no computation. Ranking happens offline; serving a prefix is one in-memory lookup — and most lookups never reach my servers at all, because the browser and the [[CDN]] answer them first.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'list',
      items: [
        '**Query** — a normalised search string with a popularity score that decays over time.',
        '**Prefix entry** — a prefix and its precomputed top ten completions.',
        '**Index snapshot** — an immutable, versioned build of every prefix entry, shipped to serving nodes as a file.',
        '**Search history** — one user\'s recent queries, for the personal layer.',
      ],
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'code',
      code: `GET /suggest?q=new%20yo&limit=10&locale=en-GB
    -> { suggestions: ["new york times", "new york weather", …] }
    Cache-Control: public, max-age=60, s-maxage=300

GET /users/me/recent-searches        -> string[]   (once a session)

# write side: the search service logs every submitted search
event query_submitted { text, locale, ts, userId? }`,
    },
    {
      kind: 'prose',
      text: 'The suggestion endpoint in this [[API]] is deliberately **the same for everyone** who types the same prefix in the same locale. That is what makes it cacheable, and it is why personal history is a separate call.',
    },

    { kind: 'heading', text: 'Data flow' },
    { kind: 'prose', text: 'The update side is a batch pipeline, so it earns its own phase:' },
    {
      kind: 'list',
      ordered: true,
      items: [
        'Search frontends emit every submitted query onto Kafka.',
        'An hourly job normalises queries — case, whitespace, punctuation — and counts them per locale.',
        'Counts fold into a decaying score: the previous score times a decay factor, plus the new count. Old fame fades, so this week beats last year.',
        'Filters run: a blocklist, and a minimum number of distinct users per query.',
        'A build job constructs the trie, computes the top ten for every prefix, and writes an immutable snapshot to blob storage.',
        'Serving nodes download the snapshot, load it beside the current one, and swap atomically. Rolling back is pointing at the previous version.',
      ],
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'Suggestions are served from memory and caches; the index is rebuilt offline and shipped as a file.',
      figure: {
        kind: 'split',
        left: {
          title: 'Serving path — milliseconds',
          tone: 'line',
          nodes: [
            { label: 'Browser', sub: 'debounce, cache per prefix', to: 'miss' },
            { label: 'CDN edge', sub: 'shared answers, minutes of TTL', to: 'miss' },
            { label: 'Suggest service', sub: 'whole index in memory', tone: 'line' },
          ],
          cost: 'Every layer can answer, and most requests never reach the origin.',
        },
        right: {
          title: 'Update path — hourly',
          tone: 'neutral',
          nodes: [
            { label: 'Query log', sub: 'Kafka', to: 'count, decay, filter' },
            { label: 'Build job', sub: 'trie, then top ten per prefix', to: 'snapshot' },
            { label: 'Blob storage', sub: 'versioned files' },
          ],
          cost: 'An hour behind, and nobody notices.',
        },
        verdict: 'The two sides share nothing but a file. That is what keeps the read path fast and the write path simple.',
      },
    },
    {
      kind: 'prose',
      text: '**`GET /suggest`**. The browser waits for a pause in typing, checks its own cache, then asks. The CDN answers popular prefixes outright — and the most popular prefixes are the short ones, of which there are very few. A miss reaches a suggest node, which looks the prefix up in an in-memory map and returns.',
    },
    {
      kind: 'prose',
      text: '**Recent searches** are fetched once a session and merged on the client. **The write side** is the pipeline above; it never touches a serving node except to hand it a new file.',
    },
    {
      kind: 'prose',
      text: 'The bottlenecks: the **index** — answering a prefix in microseconds; **request volume** — every keystroke is a potential request; and **freshness** — an hourly rebuild cannot see a story that broke ten minutes ago.',
    },

    { kind: 'heading', text: 'Deep dive 1 — the index: a trie, or top-k per prefix' },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'A `LIKE` query on the queries table',
          text: "`WHERE text LIKE 'new yo%' ORDER BY score DESC LIMIT 10`. A B-tree can find the range, but it then has to read and sort every match — for the prefix \"a\" that is millions of rows, on every keystroke of every user.",
        },
        {
          grade: 'good',
          title: 'A trie, searched per request',
          text: 'Walk down one node per character to the prefix, then search its subtree for the ten highest scores. The walk is fast, but the subtree under a short prefix holds a large share of all queries — and short prefixes are exactly the hottest ones.',
        },
        {
          grade: 'great',
          title: 'A trie with the top ten stored at every node',
          text: 'At build time each node records the best ten completions in its subtree. A lookup becomes a walk of the prefix\'s length and a read. The cost moves to updates: a score change must be pushed into every ancestor\'s list, which is why you rebuild offline rather than update in place.',
        },
        {
          grade: 'best',
          title: 'A flat map from prefix to top ten, built from the trie',
          text: 'Serving only ever asks "what are the ten for this prefix?", so store exactly that: a hash map from prefix to list, produced by walking the trie once at build time. One lookup, trivially sharded by hashing the prefix, and it can live in process memory or in Redis. The trie is a build tool, not a serving structure.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'Precomputed top completions at each prefix. Every prefix carries its own answer.',
      figure: {
        kind: 'stack',
        layers: [
          { label: 'n', sub: 'netflix · news · nba …' },
          { label: 'ne', sub: 'netflix · news · new york …' },
          { label: 'new', sub: 'news · new york · newcastle …' },
          { label: 'new y', sub: 'new york · new york times …', tone: 'line' },
        ],
        note: 'A lookup is one read, however short the prefix — and the short ones are the hottest.',
      },
    },
    {
      kind: 'prose',
      text: 'Pick the precomputed map. Cap stored prefixes at around 20 characters — past that, filter the 20-character entry by the rest of the prefix, so that last level keeps a longer list — and store suggestion ids rather than repeating strings, so the map stays in the tens of GB.',
    },

    { kind: 'heading', text: 'Deep dive 2 — the latency budget and the caches' },
    {
      kind: 'prose',
      text: 'A hundred milliseconds sounds generous until you spend it. On a phone, the round trip to the nearest region can take most of it by itself. So the real goal is not a faster server — it is avoiding the round trip altogether.',
    },
    {
      kind: 'figure',
      caption: 'Where 100 ms goes. The lookup is a sliver; the network is most of it.',
      figure: {
        kind: 'ratio',
        parts: [
          { label: 'Network to the nearest edge', value: 40, tone: 'streak' },
          { label: 'Edge or origin lookup', value: 10, tone: 'line' },
          { label: 'Rendering', value: 10, tone: 'neutral' },
          { label: 'Headroom for a slow network', value: 40, tone: 'mastered' },
        ],
        note: 'A design budget rather than a measurement. Spend it on the network, and protect the headroom.',
      },
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'A request per keystroke, straight to origin',
          text: '"new york times" is fourteen requests, each paying the full round trip and each hitting your servers. Most are obsolete before they return.',
        },
        {
          grade: 'good',
          title: 'Debounce and cache in the browser',
          text: 'Send only when typing pauses for a few tens of milliseconds, and cancel requests that have been overtaken. Cache every response by prefix, so backspacing is free. While a request is in flight, filter the previous list by the new character to show something instantly.',
        },
        {
          grade: 'great',
          title: 'Cache at the edge',
          text: 'A shared prefix\'s answer is identical for everyone, so the CDN can serve it, with a [[TTL]] of a minute in the browser and five at the edge — `max-age=60, s-maxage=300`. Keep the browser\'s short: you can purge a CDN when a suggestion must disappear, but never a browser. Short prefixes are few and hot, so they live at the edge almost permanently, and the origin mostly sees the long tail.',
        },
        {
          grade: 'best',
          title: 'Shared answers at the edge, personal ones merged on the client',
          text: 'Personalising the response would make every response unique and kill the cache. So keep the shared response shared, fetch the user\'s recent searches once a session, and merge locally: matching history first, then the popular list, de-duplicated. Personal results, cache-friendly traffic.',
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Personalising on the server by adding the user id to the request. It looks like a small change, and it quietly takes the edge cache hit rate to zero — multiplying origin traffic by exactly the factor the cache was saving you.',
    },

    { kind: 'heading', text: 'Deep dive 3 — freshness without losing control' },
    {
      kind: 'compare',
      left: {
        title: 'Rebuild the index every hour',
        points: [
          'A consistent, versioned snapshot that can be rolled back',
          'Filtering happens before anything goes live',
          'Serving nodes stay simple: they only load files',
          'Up to an hour stale',
        ],
      },
      right: {
        title: 'Update scores as queries arrive',
        points: [
          'Fresh within seconds',
          'Each query rewrites the top ten at up to twenty ancestor prefixes — heavy write amplification on the serving store',
          'Hot prefixes become write hot spots',
          'A coordinated campaign can push an offensive suggestion live before anyone can stop it',
        ],
      },
      verdict: 'Rebuild hourly as the backbone, and add a small, separately filtered trending layer for the stories that cannot wait an hour.',
    },
    {
      kind: 'prose',
      text: 'The trending layer: a Flink job counts queries in five-minute windows and compares each with its usual rate. Queries spiking well above their baseline — and seen from enough distinct users — are published as a short list per prefix, which the suggest service blends into the top results. It is small, so it can be pushed every few minutes and held for review when needed.',
    },
    {
      kind: 'figure',
      caption: 'A breaking story, as seen by the hourly rebuild and by the trending layer.',
      figure: {
        kind: 'timeline',
        ticks: ['12:00', '12:20', '12:40', '13:00'],
        lanes: [
          {
            label: 'Hourly snapshot',
            bars: [{ from: 0, to: 1, label: 'serving the 12:00 build', tone: 'neutral' }],
            outcome: { label: 'appears at 13:00', tone: 'streak' },
          },
          {
            label: 'Trending layer',
            bars: [
              { from: 0.3, to: 0.4, tone: 'line' },
              { from: 0.4, to: 1, label: 'blended into suggestions', tone: 'mastered' },
            ],
            outcome: { label: 'live by about 12:30', tone: 'mastered' },
          },
        ],
        note: 'The story breaks at 12:18. The snapshot cannot know until the next build; the trending layer sees the spike by 12:24, and the edge cache adds a few minutes more.',
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Suggesting anything only one person typed. A query seen from a single user — a name and a street address, a medical question — becomes a suggestion shown to millions. Require a minimum number of distinct users before a query can ever be suggested, and keep a blocklist that can be pushed to serving nodes in seconds, without waiting for a rebuild — then purge the affected prefixes from the CDN.',
    },
  ],
  followups: [
    {
      q: 'How do you handle typos — "nwe york"?',
      a: 'Not with fuzzy matching on every keystroke; that multiplies the cost of each lookup. Mine the query logs for reformulations — people who typed one thing and immediately searched another — and precompute a map from common misspelt prefixes to their corrections. At serving time, fall back to that map, or to an edit-distance-one lookup, only when the exact prefix returns too few results.',
    },
    {
      q: 'The index outgrows one machine. How do you shard it?',
      a: 'Hash the full prefix. Every request is a single-key lookup, so hashing spreads the load evenly and each request touches exactly one shard. Sharding by first letter looks natural and is a trap: "s" carries far more traffic than "x". Replicate each shard several times, because read load is the thing you are actually scaling.',
    },
    {
      q: 'Someone games the suggestions to push an offensive phrase. What stops it?',
      a: 'Layers. The distinct-user threshold makes it expensive to fake popularity. The blocklist filters at build time and again at serving time, and the serving-side copy updates in seconds. The trending layer — the fast path an attacker would target — gets stricter thresholds and can hold new entries for human review before they go live.',
    },
    {
      q: 'What goes into the score besides how often a query is searched?',
      a: 'Recency, through the decay factor. Locale, by building a separate index per language and region. And how often the suggestion is chosen when it is shown, which corrects for queries that are popular but rarely what people meant. All of it is computed offline; the only ranking done per request is the small merge with personal history.',
    },
    {
      q: 'How do you know the suggestions are any good?',
      a: 'Measure what people do with them: how often a suggestion is selected, and how many keystrokes it saved. Ship ranking changes as experiments against those two numbers, and watch the rate at which people delete a chosen suggestion and retype — that is the signal that it was the wrong one.',
    },
  ],
}
