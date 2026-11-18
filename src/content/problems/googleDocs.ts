import type { Problem } from '../types'

export const googleDocs: Problem = {
  id: 'google-docs',
  title: 'Design Google Docs',
  kind: 'hld',
  category: 'realtime',
  difficulty: 'hard',
  brief:
    'Design a collaborative document editor. Several people type into the same document at once, and everyone sees the changes, and each other, as they happen.',
  patterns: ['realtime', 'contention'],
  suggests: ['a-realtime', 'a-contention', 'c-sharding', 'c-cap'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to concurrent editing, presence and version history, and named what is out of scope' },
    { id: 'r2', bar: 'must', criterion: 'Chose WebSocket and justified it by heavy traffic in both directions' },
    { id: 'r3', bar: 'must', criterion: 'Applied edits locally first and sent operations, not whole documents' },
    { id: 'r4', bar: 'must', criterion: 'Showed that naive concurrent edits diverge and named OT or CRDT as the fix' },
    { id: 'r5', bar: 'senior', criterion: 'Compared OT and CRDT on central ordering, metadata and offline, and picked one' },
    { id: 'r6', bar: 'senior', criterion: 'Routed every session for a document to one owning server by document id' },
    { id: 'r7', bar: 'senior', criterion: 'Stored an append-only operation log with periodic snapshots' },
    { id: 'r8', bar: 'senior', criterion: 'Made edits idempotent with a client operation id and acknowledged them with a revision' },
    { id: 'r9', bar: 'senior', criterion: 'Kept presence and cursors ephemeral, throttled, and out of the log' },
    { id: 'r10', bar: 'staff', criterion: 'Handled owner failover with a lease and a conditional append, so a stale owner cannot write' },
    { id: 'r11', bar: 'staff', criterion: 'Bounded offline editing: rebase on reconnect, and what happens past the bound' },
    { id: 'r12', bar: 'staff', criterion: 'Implemented restore as a new forward revision instead of rewriting history' },
  ],
  followups: [
    {
      q: 'Two hundred people open the all-hands doc. What changes?',
      a: 'Separate editors from viewers. Cap concurrent editors, say at 100, and make the rest read-only. Viewers need no transforms, only the stream of committed edits, so the owner publishes to a channel that a tier of viewer servers fans out, and presence is summarised as "and 140 others".',
    },
    {
      q: 'How does undo work when other people are editing too?',
      a: "Undo is local and selective. It inverts **your** last edit, transformed against everything that landed after it, and sends the result as a new edit. It never touches a collaborator's work; an undo that rolled the document back would delete other people's typing.",
    },
    {
      q: 'Why not keep the document in a Postgres row and update it on every edit?',
      a: 'A row rewrite per keystroke is write amplification on the hottest path, every editor contends on the same row, and the history that versions need is gone. The log is the truth and the snapshot is a cache of it. Postgres keeps the metadata and permissions it is good at.',
    },
    {
      q: "How do you search across everyone's documents?",
      a: "Asynchronously. Snapshot writes emit an event, an indexer pushes the text into Elasticsearch, and every query is filtered by the caller's permissions. A few seconds of lag is invisible in search and keeps indexing off the editing path entirely.",
    },
    {
      q: 'You add a document server and a tenth of documents change owner. What do editors notice?',
      a: "A pause of a second or so on those documents, if the hand-off is graceful: the old owner stops accepting edits, flushes, releases its lease and tells its sessions to reconnect, and the new owner loads the snapshot and tail. Clients never stop applying edits locally, so typing does not freeze; only everyone else's view of it is briefly late.",
    },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        "Users should be able to edit the same document at the same time and see each other's changes within a moment.",
        'Users should be able to see who else is in the document and where their cursors are.',
        'Users should be able to browse earlier versions of a document and restore one.',
        'Out of scope: rich formatting internals, comments, sharing and permissions, spreadsheets and slides.',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional: **every copy of a document converges** to the same content once edits stop, and an acknowledged edit is never lost. **Local edits apply instantly**; remote ones appear within about 200 ms. **Edits made offline** merge when the connection returns. Assume **2M people editing at peak**, each sending a batched operation every half second while typing: about **4M operations a second** across the fleet.',
    },
    {
      kind: 'prose',
      text: 'That number looks alarming and is not, which is worth saying out loud. It is spread over millions of independent documents, and a single document sees a few operations a second, a few hundred when it is crowded. **Nothing ever coordinates across documents.** That makes the document the unit of sharding, and one server per document enough.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'The total volume is large, but every document is small and independent. So I will give each document a single owner that orders its edits, and spend most of the time on how concurrent edits merge.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'list',
      items: [
        '`Document`: id, title, current revision, pointer to the latest snapshot.',
        '`Operation`: docId, revision, authorId, `clientOpId`, and the change itself, such as `insert(pos, text)` or `delete(pos, len)`. The append-only log of these **is** the document.',
        '`Snapshot`: docId, revision, full content. A cache of the log at one point.',
        '`Version`: a named or automatic checkpoint, which is just a revision number plus metadata.',
        '`Presence`: user, cursor, selection, colour. Ephemeral, and never written to the log.',
      ],
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'prose',
      text: 'One [[HTTP]] read to load, then a [[WebSocket]] session for the edit loop. This is a genuine WebSocket case: every keystroke goes up and every remote keystroke comes down. The [[API]] for versions is ordinary request and response.',
    },
    {
      kind: 'code',
      code: `GET  /docs/{docId}          -> { snapshot, revision }

WS   /docs/{docId}/session
  -> { type: 'op', baseRev, clientOpId, ops }
  <- { type: 'ack', clientOpId, rev }
  <- { type: 'op', rev, authorId, ops }
  -> { type: 'cursor', anchor, head }
  <- { type: 'presence', users }

GET  /docs/{docId}/versions               -> Version[]
POST /docs/{docId}/versions/{rev}/restore -> { revision }`,
    },
    {
      kind: 'prose',
      text: "`baseRev` is the revision the client's edit was made against: it tells the server exactly what the edit has not seen. `clientOpId` makes a resend after a reconnect harmless.",
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'Every session for a document lands on its one owner, which orders the edits and makes them durable.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Editor', sub: 'applies edits locally first', to: 'WebSocket' },
          { label: 'Router', sub: 'docId to owning server', to: 'sticky' },
          { label: 'Document server', sub: 'one owner per doc: orders, transforms, broadcasts', tone: 'line', to: 'append' },
          { label: 'Operation log', sub: 'per doc, keyed by revision', tone: 'line', to: 'every 1,000 ops' },
          { label: 'Snapshots', sub: 'full content, in blob storage' },
        ],
        note: 'Document metadata and permissions live in Postgres. The log sits in a write-friendly store such as Cassandra or Bigtable, keyed by (docId, revision).',
      },
    },
    {
      kind: 'list',
      items: [
        '**Load.** `GET /docs/{id}` returns the latest snapshot plus the log tail after it. The client builds the document locally and opens the session at that revision.',
        '**Edit.** The client applies the edit to its own copy immediately (a keystroke never waits for a round trip) and sends it with `baseRev`. The owner transforms it against anything that landed since `baseRev`, gives it the next revision, appends it to the log, acks the sender and broadcasts it to every other session on the document.',
        '**Versions.** Listing reads checkpoints. Restoring is itself a new edit, covered in deep dive 3.',
      ],
    },
    {
      kind: 'prose',
      text: 'Three places this goes wrong, and they are the deep dives: two people editing the same spot, the owner being one machine, and a log that grows forever while some clients are offline.',
    },

    { kind: 'heading', text: 'Deep dive 1 — merging concurrent edits' },
    {
      kind: 'prose',
      text: 'Alice and Bob both have "abc". Alice types X at the start; Bob deletes the c. Apply each edit unchanged on the other side and they diverge: Alice\'s copy receives "delete position 2" and removes the b instead. The fix is to adjust an edit for whatever landed before it.',
    },
    {
      kind: 'figure',
      caption: 'Operational transformation: the server orders concurrent edits and rewrites the later one, so both sides converge.',
      figure: {
        kind: 'sequence',
        actors: ['Alice', 'Server', 'Bob'],
        steps: [
          { from: 0, to: 0, label: 'insert X at 0: "Xabc"' },
          { from: 2, to: 2, label: 'delete at 2: "ab"' },
          { from: 0, to: 1, label: 'insert(0, X) on rev 7' },
          { from: 2, to: 1, label: 'delete(2) on rev 7' },
          { from: 1, to: 1, label: "Alice's is rev 8; Bob's becomes delete(3), rev 9", tone: 'line' },
          { from: 1, to: 2, label: 'insert(0, X), rev 8', dashed: true },
          { from: 1, to: 0, label: 'delete(3), rev 9', dashed: true },
          { from: 0, to: 0, label: '"Xab"', tone: 'mastered' },
          { from: 2, to: 2, label: '"Xab"', tone: 'mastered' },
        ],
        note: "Bob's delete was written against a document without the X, so the server shifts it one place right. Bob applies Alice's insert unchanged, because it lands before his delete.",
      },
    },
    {
      kind: 'compare',
      left: {
        title: '[[OT]]',
        points: [
          'A central server orders every edit and rewrites late ones against what landed first',
          'Lean: the stored state is just the text, plus a log',
          'Proven at scale: Google Docs is built on it',
          'Transform functions are subtle, every pair of operation types needs one, and a bug means silent divergence',
        ],
      },
      right: {
        title: '[[CRDT]]',
        points: [
          'Every character gets a unique id with a defined order, so concurrent edits merge the same way in any order',
          'Needs no central ordering, so it works peer to peer and offline by construction',
          'Per-character metadata and tombstones for deletions, carried until compacted',
          'Mature libraries do the hard part: Yjs, Automerge',
        ],
      },
      verdict: 'For this brief, **OT with one owner per document**. There is a server in the middle anyway, editing is mostly online, and the stored state stays small. If the interviewer makes offline-first or peer-to-peer the headline, switch to a CRDT: the rest of this design (one owner, a log, snapshots, presence) does not change.',
    },
    {
      kind: 'callout',
      tone: 'example',
      text: "Figma wrote up the middle road. Its multiplayer servers stay the central authority, but the data model borrows from [[CRDT|CRDTs]]: each property of each object is last-writer-wins. A design file is a tree of objects rather than a string of characters, so it never needed character-level transforms in the first place.",
    },

    { kind: 'heading', text: 'Deep dive 2 — one owner per document' },
    {
      kind: 'prose',
      text: 'Ordering needs exactly one place that decides "Alice\'s edit came first". The question is where that place lives, and what happens when it dies.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Stateless servers, ordering in the database',
          text: "Any server takes any edit, reads the latest revision, transforms, and inserts `rev + 1` behind a uniqueness check. Correct, but every keystroke is a database round trip contending on one document's head, and the loser of each race redoes its transform. Typing feels like submitting a form.",
        },
        {
          grade: 'good',
          title: 'Stateless servers, a pub/sub channel per document',
          text: 'Edits spread fast, but nobody owns the order. Two servers transform against different views of the document and the copies drift. Fixing it needs a lock per document, which is an owner by another name.',
        },
        {
          grade: 'great',
          title: 'Sticky routing by document id',
          text: 'Hash `docId` onto a consistent-hash ring of document servers; the router sends every session for a document to its owner. The owner holds the document and its recent log in memory, orders edits in microseconds, and broadcasts to the sessions it holds directly. Cost: when the ring changes, documents move.',
        },
        {
          grade: 'best',
          title: 'Sticky routing, with a lease and a fenced log',
          text: 'Ownership is a lease from a coordination service (ZooKeeper or etcd) that the owner keeps renewing. Every log append is conditional on `(docId, revision)` not existing yet, so an owner that lost its lease during a partition cannot write: its append fails and it lets go of the document. On a crash the lease expires, a new owner loads snapshot plus tail, and clients resend unacknowledged edits, which `clientOpId` deduplicates.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'An owner crashes. Clients keep typing locally, and nothing acknowledged is lost.',
      figure: {
        kind: 'timeline',
        ticks: ['0 s', '5 s', '10 s', '15 s'],
        lanes: [
          {
            label: 'Server A',
            bars: [{ from: 0, to: 0.35, label: 'owns doc 42', tone: 'line' }],
            outcome: { label: 'crashes', tone: 'alert' },
          },
          {
            label: 'Lease',
            bars: [
              { from: 0, to: 0.35, label: 'renewed', tone: 'mastered' },
              { from: 0.35, to: 0.6, label: 'expiring', tone: 'streak' },
            ],
          },
          {
            label: 'Server B',
            bars: [
              { from: 0.6, to: 0.75, label: 'loads snapshot + tail', tone: 'streak' },
              { from: 0.75, to: 1, label: 'owns doc 42', tone: 'line' },
            ],
          },
          {
            label: 'Clients',
            bars: [
              { from: 0.35, to: 0.75, label: 'typing locally, edits queued', tone: 'streak' },
              { from: 0.75, to: 1, label: 'resend unacked', tone: 'mastered' },
            ],
            outcome: { label: 'converged', tone: 'mastered' },
          },
        ],
        note: 'A short lease means a short pause. Too short, and a long garbage-collection pause on a healthy owner looks like a crash.',
      },
    },
    {
      kind: 'prose',
      text: "The owner is also where presence lives, and presence must never touch the log. Cursor moves are frequent, worthless a second later, and safe to lose. The owner keeps them in memory, throttles broadcasts to about ten a second per user, and drops anyone who misses heartbeats. A cursor is a position, so it is transformed like an edit: when Alice inserts text before Bob's cursor, his cursor moves with the text.",
    },

    { kind: 'heading', text: 'Deep dive 3 — versions, snapshots and offline edits' },
    {
      kind: 'prose',
      text: 'The log is the source of truth, which raises three questions: how a document with a million logged edits still opens quickly, what a version actually is, and how an edit made on a plane gets back in.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Save the whole document on every change',
          text: 'History for free, and a 50 [[KB]] write per keystroke. A busy document rewrites megabytes a minute to record a few characters.',
        },
        {
          grade: 'good',
          title: 'Append-only log, replayed from the start',
          text: 'Tiny writes and perfect history. But opening a document replays every edit it ever had, so old documents get slower to open, forever.',
        },
        {
          grade: 'great',
          title: 'Log plus periodic snapshots',
          text: 'Every 1,000 operations or so, the owner writes a snapshot to blob storage such as [[S3]]. Opening is the latest snapshot plus a short tail. A version is just a revision number pointing into this history, so listing versions is cheap.',
        },
        {
          grade: 'best',
          title: 'Snapshots, a compacted log, and restore as a forward edit',
          text: 'Keep every operation for a recent window (say 30 days) and collapse older ones into hourly or daily snapshots, pinning named versions forever. Restoring version 120 writes a **new** revision whose content equals revision 120, so collaborators receive one more edit and nothing in history is rewritten.',
        },
      ],
    },
    {
      kind: 'prose',
      text: 'Offline edits ride the same machinery, with one bound that matters:',
    },
    {
      kind: 'list',
      ordered: true,
      items: [
        'The client keeps unacknowledged edits in IndexedDB with the `baseRev` they were made on, and the user keeps typing.',
        'On reconnect it sends them in order. The owner transforms them against everything since `baseRev`, exactly as it would a slow edit.',
        'If `baseRev` has been compacted away, or the gap is thousands of operations, the client fetches what it missed and transforms its own edits locally before sending. The server never transforms against history it no longer holds.',
        'Past a hard limit (days offline, or the document rewritten meanwhile), save the offline work as a copy and say so, rather than silently splicing two drafts together.',
      ],
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Saying "[[CRDT|CRDTs]] make offline free". They make merges converge; they do not make them meaningful. Two people who rewrite the same paragraph on two planes converge to both rewrites spliced together. Version history and an honest "you were offline for two days" prompt belong in the answer whichever algorithm you pick.',
    },
  ],
}
