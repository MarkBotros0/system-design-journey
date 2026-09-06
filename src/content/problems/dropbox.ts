import type { Problem } from '../types'

export const dropbox: Problem = {
  id: 'dropbox',
  title: 'Design Dropbox',
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
    { kind: 'heading', text: 'The core split' },
    {
      kind: 'prose',
      text: 'Metadata in the database — id, owner, name, size, chunk list, permissions. **Bytes in blob storage.** [[S3]] at ~$0.023/GB/month against a database at ~$1.25 settles it on cost alone, before you even reach the throughput argument.',
    },
    {
      kind: 'flow',
      nodes: ['Client', '[[API]]: presigned [[URL]]', 'S3 direct', 'S3 event', 'Worker', 'Metadata DB'],
      note: 'Your servers move kilobytes while gigabytes flow around them.',
    },
    {
      kind: 'prose',
      text: 'Downloads mirror it: a presigned URL again, but served through a [[CDN]] so a shared file is delivered from the requester\'s region rather than yours. Signed URLs keep private files cacheable at the edge — the signature expires, the cached object does not have to.',
    },
    { kind: 'heading', text: 'Deep dive 1 — uploading three gigabytes' },
    {
      kind: 'prose',
      text: 'A single PUT of 3 GB fails on any real mobile connection, and when it fails you have nothing. **Multipart upload** splits it into chunks — say 8 [[MB]] each — uploaded in parallel, each retried independently.',
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
  ],
}
