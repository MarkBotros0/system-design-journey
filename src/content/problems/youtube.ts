import type { Problem } from '../types'

export const youtube: Problem = {
  id: 'youtube',
  title: 'Design YouTube',
  kind: 'hld',
  category: 'media',
  difficulty: 'medium',
  brief:
    'Creators upload videos; viewers watch them. Videos are large, viewers are everywhere, and connections vary from fibre to a phone on the underground.',
  patterns: ['blobs', 'longrunning', 'scaling-reads'],
  suggests: ['a-blobs', 'a-longrunning', 'a-reads'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to upload / transcode / watch' },
    { id: 'r2', bar: 'must', criterion: 'Metadata in a database, video bytes in blob storage' },
    { id: 'r3', bar: 'must', criterion: 'Upload goes direct to storage, not through app servers' },
    { id: 'r4', bar: 'must', criterion: 'Transcoding happens asynchronously behind a queue' },
    { id: 'r5', bar: 'senior', criterion: 'Explained adaptive bitrate — multiple renditions plus a manifest' },
    { id: 'r6', bar: 'senior', criterion: 'Segmented video rather than serving whole files' },
    { id: 'r7', bar: 'senior', criterion: 'Put a CDN in front and explained what it caches' },
    { id: 'r8', bar: 'senior', criterion: 'Parallelised transcoding across segments, not one job per video' },
    { id: 'r9', bar: 'staff', criterion: 'Addressed the cost of transcoding everything vs. on-demand renditions' },
    { id: 'r10', bar: 'staff', criterion: 'Handled view counting without a write per view on the hot path' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Upload a video.',
        'Watch a video, at a quality that suits the connection.',
        'Out of scope: recommendations, comments, subscriptions, live streaming.',
      ],
    },
    {
      kind: 'prose',
      text: 'Overwhelmingly read-heavy. Playback must start in **under two seconds** and never stall. Upload availability matters less than playback availability — a creator will retry, a viewer will leave.',
    },
    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'prose',
      text: '`Video`: the metadata (owner, title, status, duration). `Rendition`: one encoding of a video at one resolution and bitrate. `Segment`: a few seconds of one rendition, the unit the player fetches. `Manifest`: the index of renditions and segments a player reads first.',
    },
    { kind: 'heading', text: '[[API]]' },
    {
      kind: 'code',
      code: `POST /videos        { title, size }
                    -> { videoId, uploadUrls[] }  // presigned parts
GET  /videos/{id}   -> { metadata, manifestUrl }

// playback never touches your API again:
GET  <cdn>/{id}/manifest.m3u8,  then its segments`,
      caption: 'Two endpoints. Everything after the manifest URL is plain files from the edge.',
    },
    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'Upload, transcode and playback as one line: bytes go straight to storage and come back from the edge.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Creator', to: 'presigned [[URL]]' },
          { label: '[[S3]] raw', sub: 'multipart upload', to: 'storage event' },
          { label: 'Transcode queue', to: 'jobs' },
          { label: 'Worker pool', sub: 'renditions × segments', tone: 'line', to: 'writes' },
          { label: 'S3 renditions', sub: 'plus the manifest', to: 'origin' },
          { label: '[[CDN]]', sub: 'caches segments', tone: 'mastered', to: 'segments' },
          { label: 'Viewer' },
        ],
        note: 'Video metadata sits in an ordinary database behind a cache; it is a single primary-key read per play.',
      },
    },
    {
      kind: 'prose',
      text: 'Multipart upload direct to storage, for the same reasons as any large blob: gigabytes must not pass through your servers, and a failed chunk should retry alone. The storage completion event — not the client — starts the pipeline.',
    },
    {
      kind: 'prose',
      text: 'Three bottlenecks to note for the deep dives: one file cannot suit every connection, a long video takes hours to transcode in one job, and the playback path is the hottest in the system.',
    },
    { kind: 'heading', text: 'Deep dive 1 — adaptive bitrate' },
    {
      kind: 'prose',
      text: 'One file cannot serve both fibre and a phone on the underground. Transcode each upload into several **renditions** (240p through 4K), then cut each into **segments** of a few seconds. A manifest — [[HLS]] or [[DASH]] — lists what exists.',
    },
    {
      kind: 'compare',
      left: {
        title: 'One file per video',
        points: [
          'Simple to store and serve',
          'Too big for a phone, too poor for fibre',
          'A bad patch of signal stalls playback',
        ],
      },
      right: {
        title: 'Renditions × segments, plus a manifest',
        points: [
          'The player picks the quality per segment',
          'Small immutable files, ideal for a CDN',
          'Several encodes to produce and store',
        ],
      },
      verdict: 'Segments. The cost is storage and compute; the alternative is viewers who leave.',
    },
    {
      kind: 'code',
      code: `manifest.m3u8
  1080p/segment-0001.ts   1080p/segment-0002.ts   …
   720p/segment-0001.ts    720p/segment-0002.ts   …
   360p/segment-0001.ts    360p/segment-0002.ts   …`,
      caption: 'The player measures throughput and picks the next segment\'s quality itself.',
    },
    {
      kind: 'prose',
      text: 'That is why quality shifts mid-video rather than buffering: the decision is made per segment, by the client, and the server just serves files. It also means the CDN is caching small immutable objects, which is the ideal thing for a CDN to cache.',
    },
    {
      kind: 'figure',
      caption: 'The player steps between rows every few seconds, without stopping playback.',
      figure: {
        kind: 'stack',
        layers: [
          { label: '1080p', sub: 'segment 01 · 02 · 03 · 04', tone: 'mastered' },
          { label: '720p', sub: 'segment 01 · 02 · 03 · 04', tone: 'line' },
          { label: '360p', sub: 'segment 01 · 02 · 03 · 04', tone: 'streak' },
        ],
        note: 'The client measures its own throughput and picks the next segment. The server just serves small immutable files — which is the ideal thing for a CDN to cache.',
      },
    },
    { kind: 'heading', text: 'Deep dive 2 — transcoding at scale' },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'One job transcodes the whole video',
          text: 'A two-hour upload occupies one worker for hours. A crash at 90% restarts everything, and a burst of uploads queues behind long jobs.',
        },
        {
          grade: 'good',
          title: 'One job per rendition',
          text: 'Five renditions run in parallel. Better, but the longest rendition still bounds the total, and a failure still restarts a whole rendition.',
        },
        {
          grade: 'best',
          title: 'Split into segments, fan out, then stitch',
          text: 'Chunk the source, transcode segments in parallel across the fleet, then assemble the manifest. A two-hour video finishes in minutes, a failed segment retries alone, and progress is real. This is a [[DAG]] of tasks — worth naming a workflow engine to coordinate it.',
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Transcoding every upload to every rendition is enormously expensive, and most videos are watched almost never. Generate a couple of renditions eagerly and the rest on first request, cached thereafter. Naming that cost trade unprompted is a staff-level observation.',
    },
    { kind: 'heading', text: 'Deep dive 3 — playback and view counts' },
    {
      kind: 'prose',
      text: 'Segments are immutable and public, so the CDN does nearly all the work — origin traffic is a rounding error once a video is popular. The metadata read is a single primary-key lookup behind a cache.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Incrementing a view counter synchronously on playback. That is a database write on the hottest path in the system, on a row that is already a hot key for a viral video — you have built a bottleneck out of a number nobody needs to be exact.',
    },
    {
      kind: 'prose',
      text: 'Fire view events onto a stream and aggregate in windows. The count is seconds behind and nobody notices. That is the scaling-writes pattern applied to something that looks too trivial to need it.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Increment a row per view',
        points: [
          'Exact the instant it happens',
          'A write on every play, on one hot row',
          'Playback now depends on the database',
        ],
      },
      right: {
        title: 'Stream view events, aggregate in windows',
        points: [
          'Playback never waits on a write',
          'Spikes queue instead of melting a row',
          'The count trails by seconds',
        ],
      },
      verdict: 'Stream. A view count seconds behind is invisible; a stalled video is not.',
    },
  ],
  followups: [
    {
      q: 'A video goes viral in a region where no edge has it cached yet. What happens to your origin?',
      a: 'Thousands of simultaneous misses for the same segments — a stampede. Request coalescing at the edge collapses them into one origin fetch per segment, and an origin shield tier between edge and storage absorbs the rest. For a known launch, pre-warm the first segments.',
    },
    {
      q: 'Some videos are private or paid. How do you protect segments sitting on a public CDN?',
      a: 'Sign them. The manifest and segment URLs carry a short-lived signature, or the player holds a signed cookie, so the CDN serves only valid requests and still caches the object. For premium content, encrypt the segments and hand out decryption keys through a licence server.',
    },
    {
      q: 'Product wants live streaming. What changes?',
      a: 'The upload-then-transcode pipeline becomes continuous. The broadcaster streams to an ingest server that transcodes in real time, segments of a few seconds are published as they are produced, and the manifest is a sliding window the player re-fetches. Latency becomes a requirement measured in seconds.',
    },
    {
      q: 'Creators are paid by views. Is the streamed count good enough for that?',
      a: 'No. Keep it for the public counter, and compute payouts from a batch over the raw view events. That pass deduplicates repeat views per viewer and filters bot traffic, which is the same fast-path, exact-path split as an ad click aggregator.',
    },
  ],
}
