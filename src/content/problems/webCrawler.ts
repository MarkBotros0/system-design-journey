import type { Problem } from '../types'

export const webCrawler: Problem = {
  id: 'web-crawler',
  title: 'Design a web crawler',
  difficulty: 'hard',
  brief:
    'Crawl a large portion of the web, extract the text, and store it for later indexing. Target a billion pages.',
  patterns: ['longrunning', 'scaling-writes'],
  suggests: ['a-longrunning', 'c-queues', 'a-blobs'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Described the loop: frontier → fetch → parse → extract links → store → repeat' },
    { id: 'r2', bar: 'must', criterion: 'Used a queue as the URL frontier with a worker pool' },
    { id: 'r3', bar: 'must', criterion: 'Deduplicated URLs so the crawl terminates' },
    { id: 'r4', bar: 'must', criterion: 'Stored raw pages in blob storage, metadata in a database' },
    { id: 'r5', bar: 'senior', criterion: 'Respected robots.txt and applied per-domain politeness' },
    { id: 'r6', bar: 'senior', criterion: 'Partitioned the frontier by domain so politeness is enforceable' },
    { id: 'r7', bar: 'senior', criterion: 'Chose a memory-efficient structure for seen-URL checks at a billion scale' },
    { id: 'r8', bar: 'senior', criterion: 'Handled traps — infinite calendars, redirect loops, session-id URLs' },
    { id: 'r9', bar: 'staff', criterion: 'Handled content-level duplication, not just URL duplication' },
    { id: 'r10', bar: 'staff', criterion: 'Made the crawl resumable — a worker dying loses at most one page' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements and the data flow' },
    {
      kind: 'prose',
      text: 'This is a pipeline, so the optional data-flow phase earns its place. Five steps:',
    },
    {
      kind: 'list',
      ordered: true,
      items: [
        'Take a [[URL]] from the frontier.',
        'Check politeness and robots.txt; fetch the page.',
        'Parse the HTML, extract text and links.',
        'Store the raw page and the extracted text.',
        'Enqueue newly discovered URLs that have not been seen.',
      ],
    },
    {
      kind: 'prose',
      text: 'A billion pages at, say, 100 [[KB]] each is **100 [[TB]]** of raw HTML — blob storage, not a database. Non-functional: politeness is a hard requirement, not a nicety; the crawl must be resumable; and throughput matters more than latency on any single page.',
    },
    {
      kind: 'flow',
      nodes: ['Frontier (per-domain queues)', 'Fetcher pool', 'Parser', '[[S3]] raw + text', 'Seen-URL filter', 'back to frontier'],
    },
    {
      kind: 'figure',
      caption: 'The crawl loop. The frontier is both the work queue and the resume point.',
      figure: {
        kind: 'cycle',
        steps: [
          { label: 'Lease a domain from the frontier', sub: 'not a URL — a domain, so politeness is enforceable' },
          { label: 'Check robots.txt and the fetch clock', sub: 'cached with an expiry' },
          { label: 'Fetch the page', sub: 'aggressive timeouts' },
          { label: 'Parse — extract text and links', sub: 'store raw bytes in blob storage' },
          { label: 'Filter links already seen', sub: 'Bloom filter, then the authoritative store' },
          { label: 'Enqueue what is new', sub: 'normalised first, or the same page enters many times' },
        ],
        note: 'A worker dying loses one page: its lease expires and another worker takes the domain.',
      },
    },
    { kind: 'heading', text: 'Deep dive 1 — politeness' },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'A single global queue. Pull a thousand URLs and they may all be one domain — you have built a denial-of-service attack and will be blocked within minutes. Politeness is not optional and it constrains the architecture.',
    },
    {
      kind: 'prose',
      text: '**Partition the frontier by domain.** Each domain gets a queue with a next-allowed-fetch timestamp, and a worker leases a domain rather than a URL. That enforces a per-domain rate limit structurally instead of hoping a check catches it. Cache each site\'s robots.txt with a [[TTL]] — refetching it per URL would be its own kind of rude.',
    },
    { kind: 'heading', text: 'Deep dive 2 — have I seen this URL?' },
    {
      kind: 'prose',
      text: 'A billion URLs at ~60 bytes is around 60 [[GB]] of keys — too much to hold naively in memory on one box, and a database round trip per candidate link is far too slow given a page yields a hundred links.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'A set in application memory',
          text: 'Fits until it does not, and dies with the process.',
        },
        {
          grade: 'good',
          title: 'Redis set of URL hashes',
          text: 'Shared and durable-ish. Still tens of GB of memory and a network round trip per link.',
        },
        {
          grade: 'best',
          title: 'Bloom filter in front, authoritative store behind',
          text: 'A Bloom filter answers "definitely new" or "possibly seen" in constant time and about **1.2 GB for a billion URLs at 1% false positives**. Only the "possibly seen" cases — a small fraction — hit the real store. False positives mean occasionally skipping a page, which for a web crawl is entirely acceptable; false negatives cannot happen, which is what matters.',
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Normalise before hashing, or the filter is worthless: lowercase the host, strip fragments, drop session ids and tracking parameters, sort query keys. Otherwise the same page enters the frontier a hundred times under a hundred URLs.',
    },
    { kind: 'heading', text: 'Deep dive 3 — traps and duplicate content' },
    {
      kind: 'list',
      items: [
        '**Infinite spaces.** A calendar with a "next month" link generates URLs forever. Cap depth per domain and cap total pages per domain.',
        '**Redirect loops.** Cap the redirect chain and record the final URL as the identity.',
        '**Duplicate content.** The same article appears at many URLs. URL dedup does not catch it — hash the *normalised text* and skip content you have already stored. **[[SimHash]]** goes further and catches near-duplicates, which is most of the real problem.',
        '**Slow servers.** Aggressive timeouts and a per-domain failure budget, or one broken site holds workers hostage.',
      ],
    },
    {
      kind: 'prose',
      text: 'Resumability falls out of the design: the frontier is the state. A worker leases a URL with a visibility timeout, and if it dies the lease expires and another picks it up. Nothing is lost but one page of work — and because storage is keyed by normalised URL, a repeat is idempotent.',
    },
  ],
}
