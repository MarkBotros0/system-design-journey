import type { Problem } from '../types'

export const dropbox: Problem = {
  id: 'dropbox',
  title: 'Design Dropbox',
  kind: 'hld',
  category: 'media',
  difficulty: 'easy',
  brief:
    'Users upload files, download them, and share them with other users. Files can be several gigabytes, and the same file often exists in many accounts.',
  patterns: ['blobs', 'multistep'],
  suggests: ['f-storage', 'a-blobs'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to upload / download / share' },
    { id: 'r2', bar: 'must', criterion: 'Split metadata into a database and bytes into blob storage' },
    { id: 'r3', bar: 'must', criterion: 'Kept file bytes off the application servers via presigned URLs' },
    { id: 'r4', bar: 'must', criterion: 'Named a CDN for downloads' },
    { id: 'r5', bar: 'senior', criterion: 'Chunked large uploads and explained resumability' },
    { id: 'r6', bar: 'senior', criterion: 'Used a storage event, not the client, as the completion signal' },
    { id: 'r7', bar: 'senior', criterion: 'Proposed content-addressed chunks for deduplication' },
    { id: 'r8', bar: 'senior', criterion: 'Used signed URLs so private files stay cacheable at the edge' },
    { id: 'r9', bar: 'staff', criterion: 'Addressed sync — how a second device learns a file changed' },
    { id: 'r10', bar: 'staff', criterion: 'Handled concurrent edits from two devices without silent data loss' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Upload a file, of any size up to a few [[GB]].',
        'Download a file.',
        'Share a file with another user.',
        'Out of scope: folder hierarchies, versioning UI, collaborative editing.',
      ],
    },
    {
      kind: 'prose',
      text: 'Durability is the requirement that matters most here — losing a user\'s file is unrecoverable in a way that a stale feed never is. Availability over consistency for reads; upload throughput bounded by the client\'s connection, not by us.',
    },
    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'prose',
      text: '`File`: the metadata (id, owner, name, size, status, and the ordered list of chunk hashes). `Chunk`: a content-addressed piece of bytes in blob storage. `Share`: a file, a grantee and a permission. `User` you can take as given.',
    },
    { kind: 'heading', text: '[[API]]' },
    {
      kind: 'code',
      code: `POST /files     { name, size, chunkHashes[] }
                -> { fileId, uploadUrls[] }   // missing chunks only
GET  /files/{id}            -> { metadata, downloadUrl }
POST /files/{id}/shares     { userId, permission } -> 200`,
      caption: 'One endpoint per requirement. Bytes never appear in the request or the response, only URLs.',
    },
    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'prose',
      text: 'Metadata in the database — id, owner, name, size, chunk list, permissions. **Bytes in blob storage.** [[S3]] at ~$0.023/GB/month against a database at ~$1.25 settles it on cost alone, before you even reach the throughput argument.',
    },
    {
      kind: 'figure',
      caption: 'Both paths, and the one rule they share: bytes never pass through your servers.',
      figure: {
        kind: 'split',
        left: {
          title: 'Upload',
          tone: 'line',
          nodes: [
            { label: 'Client', to: 'POST /files' },
            { label: 'API: presigned [[URL|URLs]]', sub: 'metadata row in pending', to: 'bytes direct' },
            { label: 'S3', sub: 'emits an event', to: 'on complete' },
            { label: 'Worker', sub: 'verifies, marks ready', tone: 'mastered' },
          ],
          cost: 'Your servers handle kilobytes of metadata.',
        },
        right: {
          title: 'Download',
          tone: 'neutral',
          nodes: [
            { label: 'Client', to: 'GET /files/{id}' },
            { label: 'API', sub: 'checks permission, signs a URL', to: 'redirect' },
            { label: '[[CDN]]', sub: 'nearest region', to: 'miss' },
            { label: 'S3', sub: 'origin' },
          ],
          cost: 'The CDN carries the gigabytes.',
        },
        verdict: 'Your servers move kilobytes while gigabytes flow around them.',
      },
    },
    {
      kind: 'prose',
      text: 'Downloads mirror it: a presigned URL again, but served through a CDN so a shared file is delivered from the requester\'s region rather than yours. Signed URLs keep private files cacheable at the edge — the signature expires, the cached object does not have to.',
    },
    {
      kind: 'prose',
      text: 'Three bottlenecks to note for the deep dives: a multi-gigabyte upload over a bad connection, the same bytes stored thousands of times, and a second device that needs to know something changed.',
    },
    { kind: 'heading', text: 'Deep dive 1 — uploading three gigabytes' },
    {
      kind: 'prose',
      text: 'A single PUT of 3 GB fails on any real mobile connection, and when it fails you have nothing. **Multipart upload** splits it into chunks — say 8 [[MB]] each — uploaded in parallel, each retried independently.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Stream the file through your application servers',
          text: 'Every gigabyte crosses your fleet twice, holds a connection for minutes, and caps throughput at what your servers can proxy.',
        },
        {
          grade: 'good',
          title: 'One presigned PUT straight to S3',
          text: 'Bytes leave your servers. But a single 3 GB request that dies at 95% starts again from zero, and progress is a guess.',
        },
        {
          grade: 'best',
          title: 'Multipart upload with a presigned URL per part',
          text: 'Parts upload in parallel and retry alone, the upload resumes after a dropped connection, and progress is real. S3 assembles the object when the client completes it.',
        },
      ],
    },
    {
      kind: 'list',
      ordered: true,
      items: [
        'Client asks the API to start an upload. The API authorises, creates a metadata row in `pending`, and returns presigned URLs for the parts.',
        'Client uploads parts directly to S3, retrying only the parts that fail.',
        'Client completes the multipart upload. S3 assembles the object and emits an event.',
        'A worker verifies the object and flips the metadata row to `ready`.',
      ],
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Marking the file ready when the client says it finished. The client can lie, crash, or vanish mid-transfer. The storage event is the only trustworthy completion signal.',
    },
    {
      kind: 'figure',
      caption: 'Chunking is what makes a three-gigabyte upload survive a tunnel.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: '3 GB file', to: 'split' },
          { label: '~375 parts', sub: '8 MB each, in parallel', tone: 'line', to: 'one fails' },
          { label: 'Retry that part', sub: 'not the whole file', tone: 'mastered' },
        ],
        note: 'It is also what makes real progress reporting possible, instead of a spinner.',
      },
    },
    { kind: 'heading', text: 'Deep dive 2 — deduplication' },
    {
      kind: 'prose',
      text: 'The same 200 MB file exists in thousands of accounts. Hash each chunk and address it by content: `chunks/{sha256}`. If the hash already exists, the upload is a metadata write and zero bytes move. That turns a re-upload of a shared file into an instant operation and cuts storage dramatically.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Hash the whole file',
        points: [
          'One hash per file, simple to store',
          'Catches exact re-uploads only',
          'Change one byte and the whole file uploads again',
        ],
      },
      right: {
        title: 'Hash each chunk',
        points: [
          'A file is a list of chunk hashes',
          'Unchanged chunks are never re-sent',
          'Needs reference counting before a chunk can be deleted',
        ],
      },
      verdict: 'Chunk-level. The bookkeeping is the price of cheap edits and cheap sync.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Chunk-level rather than file-level hashing is the better answer: change one byte in a 3 GB file and only the affected chunk is new. That is also what makes an incremental sync cheap.',
    },
    { kind: 'heading', text: 'Deep dive 3 — sync and conflicts' },
    {
      kind: 'prose',
      text: 'A second device needs to learn the file changed. Long-poll or [[SSE]] on a per-user change feed, with a monotonic cursor so a device that was offline asks "what changed since version N" and gets a list rather than a full re-scan.',
    },
    {
      kind: 'prose',
      text: 'Two devices editing offline is the real edge case. Last-write-wins silently destroys someone\'s work. The honest answer is to **detect** the conflict — each write is conditional on the version it was based on — and when it fails, keep both: the losing copy is saved as "filename (conflicted copy from device X)". Dropbox does exactly this, and it is the right call because a machine cannot merge arbitrary binary content.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Last write wins',
        points: ['No conflict handling to build', 'The slower device silently erases the other\'s work'],
      },
      right: {
        title: 'Conditional write, keep both on conflict',
        points: [
          'Each upload names the version it was based on',
          'A stale write becomes a "conflicted copy", never a loss',
        ],
      },
      verdict: 'Keep both. A duplicate file is an annoyance; a vanished one is the failure this product exists to prevent.',
    },
  ],
  followups: [
    {
      q: 'A client starts a multipart upload and never finishes. What cleans up?',
      a: 'Two things. An S3 lifecycle rule aborts incomplete multipart uploads after a day or so, which frees the orphaned parts. A sweep marks `pending` metadata rows older than that as failed, so they never show up as files.',
    },
    {
      q: 'One user deletes a file whose chunks other users share. What happens to the bytes?',
      a: 'Nothing yet. Each chunk carries a reference count, or a periodic mark-and-sweep finds chunks no file points at. Only an unreferenced chunk is deleted, and only after a grace period, because a concurrent upload may be about to claim it.',
    },
    {
      q: 'You revoke a share, but the file is cached at the edge. Can the old grantee still download it?',
      a: 'Only until their signed URL expires. The signature is the access control, not the cached object, so keep signatures short-lived — minutes, not days. Revocation then takes effect within that window with no purge.',
    },
    {
      q: 'Is cross-user deduplication safe?',
      a: 'Not entirely. If an upload completes instantly, the uploader has learned that someone else already stores that exact file, which is a side channel. The usual mitigations are to dedupe only within an account, or to make the client prove it holds the bytes before skipping the upload.',
    },
  ],
}
