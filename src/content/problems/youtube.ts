import type { Problem } from '../types'

export const youtube: Problem = {
  id: 'youtube',
  title: 'Design YouTube',
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
    { kind: 'heading', text: 'Upload and transcode' },
    {
      kind: 'flow',
      nodes: ['Client', 'Presigned URL', 'S3 raw', 'S3 event', 'Transcode queue', 'Worker pool', 'S3 renditions', 'CDN'],
    },
    {
      kind: 'prose',
      text: 'Multipart upload direct to storage, for the same reasons as any large blob: gigabytes must not pass through your servers, and a failed chunk should retry alone. The storage completion event — not the client — starts the pipeline.',
    },
    { kind: 'heading', text: 'Deep dive 1 — adaptive bitrate' },
    {
      kind: 'prose',
      text: 'One file cannot serve both fibre and a phone on the underground. Transcode each upload into several **renditions** (240p through 4K), then cut each into **segments** of a few seconds. A manifest — HLS or DASH — lists what exists.',
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
          text: 'Chunk the source, transcode segments in parallel across the fleet, then assemble the manifest. A two-hour video finishes in minutes, a failed segment retries alone, and progress is real. This is a DAG of tasks — worth naming a workflow engine to coordinate it.',
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
  ],
}
