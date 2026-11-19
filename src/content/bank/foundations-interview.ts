import type { Question } from '../types'

/** Authored bank questions — see docs/superpowers/plans/2026-11-18-question-brief.md */
export const questions: Question[] = [
  /* ---------------------------------------------------------------- */
  /* f-what                                                            */
  /* ---------------------------------------------------------------- */
  {
    id: 'f-what-tf1',
    kind: 'truefalse',
    moduleId: 'f-what',
    section: 'What gets scored',
    prompt: 'Communication is a tiebreaker in a design interview: it only counts once the design itself has been judged sound.',
    answer: false,
    explain:
      'Communication is one of the four scored competencies, judged in its own right rather than after the design. Talking through the whole slot loses points even with a good design, because it denies the interviewer the questions they need answered.',
  },
  {
    id: 'f-what-tf2',
    kind: 'truefalse',
    moduleId: 'f-what',
    section: 'Kinds of design interview',
    prompt: 'Product design and infrastructure design interviews share one framework, while object-oriented design is a different interview that needs its own preparation.',
    answer: true,
    explain:
      'Designing Uber and designing a rate limiter use the same phases and vocabulary. Low-level design is about classes and interfaces rather than boxes and arrows, so it is prepared for separately.',
  },
  {
    id: 'f-what-multi',
    kind: 'multi',
    moduleId: 'f-what',
    section: 'There is no answer key',
    prompt: 'Midway through your design, the interviewer changes a constraint. Which responses show what the round is actually testing?',
    options: [
      'Steer back to the architecture you prepared for this prompt',
      'Rework the parts the new constraint affects, out loud',
      'Say which earlier choice the change breaks, and why',
      'Hold the original design, since changing course looks indecisive',
      'Name the trade-off the new constraint now forces',
    ],
    correct: [1, 2, 4],
    explain:
      'The round tests whether you can navigate to a working system and defend the choices on the way. A memorised architecture has nothing underneath it when a constraint moves, and refusing to adapt reads as not having understood the change.',
  },
  {
    id: 'f-what-match',
    kind: 'match',
    moduleId: 'f-what',
    section: 'What gets scored',
    prompt: 'Match each way of losing points to the competency it costs you.',
    pairs: [
      { left: 'Lists every feature and finishes none', right: 'Problem navigation' },
      { left: 'Boxes that make sense alone but do not compose', right: 'Solution design' },
      { left: 'Names technologies with no reason attached', right: 'Technical excellence' },
      { left: 'Talks through the whole slot', right: 'Communication' },
    ],
    explain:
      'Only technical excellence is about what you know. The other three are about cutting the problem down, making the pieces fit together, and leaving the interviewer room to ask.',
  },

  /* ---------------------------------------------------------------- */
  /* f-network                                                         */
  /* ---------------------------------------------------------------- */
  {
    id: 'f-network-tf1',
    kind: 'truefalse',
    moduleId: 'f-network',
    section: 'Protocols, in order of how often you need them',
    prompt: 'Server-Sent Events need the same connection upgrade out of [[HTTP]] that a [[WebSocket]] does.',
    answer: false,
    explain:
      '[[SSE]] is an ordinary HTTP response that the server keeps open and writes events into. Only a WebSocket switches protocols with `101 Switching Protocols`; SSE stays plain HTTP throughout.',
  },
  {
    id: 'f-network-tf2',
    kind: 'truefalse',
    moduleId: 'f-network',
    section: 'Stateless servers',
    prompt: "A server that keeps each user's shopping cart in its own memory is stateful, even if every other request it handles reads from the database.",
    answer: true,
    explain:
      'One piece of state the user depends on is enough: only that box can serve their cart, so they must keep landing on it. Move the cart to a shared store such as Redis and any server can answer.',
  },
  {
    id: 'f-network-multi',
    kind: 'multi',
    moduleId: 'f-network',
    section: 'Load balancers, and what a "layer" is',
    prompt: "A Layer 7 load balancer ends the client's connection and opens its own to the server. Which abilities does that buy it over Layer 4?",
    options: [
      'Routing on path, header or cookie',
      'Less work per byte forwarded',
      'Pooling many clients over a few backend connections',
      'Routing each WebSocket frame to a different server',
    ],
    correct: [0, 2],
    explain:
      'Reading the request enables routing, and owning the backend connection enables reuse. It pays in parsing on every request, and after a [[WebSocket]] upgrade there are no requests left to route.',
  },
  {
    id: 'f-network-match',
    kind: 'match',
    moduleId: 'f-network',
    section: 'Latency is physics',
    prompt: 'Match each operation to its rough latency.',
    pairs: [
      { left: 'Memory read', right: 'Nanoseconds' },
      { left: 'Solid-state disk read', right: 'Microseconds' },
      { left: 'Redis cache hit', right: 'About 1 ms' },
      { left: 'Uncached database query', right: '20–50 ms' },
      { left: 'Cross-continent round trip', right: '80–300 ms' },
    ],
    explain:
      'When a design feels slow, find the rung it lands on and try to move up one. The last row is light in fibre, which only a shorter distance can reduce.',
  },

  /* ---------------------------------------------------------------- */
  /* f-api                                                             */
  /* ---------------------------------------------------------------- */
  {
    id: 'f-api-tf1',
    kind: 'truefalse',
    moduleId: 'f-api',
    section: 'The rule interviewers actually watch for',
    prompt: 'Putting the acting user in the path, as in `POST /users/{userId}/tweets`, avoids the flaw of taking it from the request body.',
    answer: false,
    explain:
      'The path is just as caller-controlled as the body, so anyone can still post as anyone. The acting user comes from the verified auth token; an id in the path is at most a target to check against it.',
  },
  {
    id: 'f-api-tf2',
    kind: 'truefalse',
    moduleId: 'f-api',
    section: 'Pagination',
    prompt: 'Offset pagination slows down the deeper a client pages, because the database still has to step past every skipped row.',
    answer: true,
    explain:
      '`OFFSET 100000` reads and discards a hundred thousand rows before returning twenty. A cursor seeks straight to the last item seen, so page five hundred costs the same as page one.',
  },
  {
    id: 'f-api-multi',
    kind: 'multi',
    moduleId: 'f-api',
    section: 'Which style',
    prompt: 'Which situations justify moving off [[REST]], the default style for an [[API]]?',
    options: [
      'A public browser app that needs the lowest possible latency',
      'Many different clients need different shapes of the same data',
      'An API that will grow past ten endpoints',
      "Internal service-to-service calls where each hop's cost matters",
    ],
    correct: [1, 3],
    explain:
      'GraphQL earns its place when over-fetching across varied clients is a real cost, and [[gRPC]] when internal hops add up. Browsers cannot call gRPC natively, and endpoint count is no reason to leave REST.',
  },
  {
    id: 'f-api-match',
    kind: 'match',
    moduleId: 'f-api',
    section: 'The rest of the checklist',
    prompt: 'Match each case to what you would specify for it in the [[API]].',
    pairs: [
      { left: 'A signed-in user of your own web app', right: 'Session cookie' },
      { left: 'One internal service calling another', right: 'API key' },
      { left: 'A feed with new posts arriving constantly', right: 'Cursor pagination' },
      { left: 'A static list that users jump around by page', right: 'Offset pagination' },
    ],
    explain:
      'A session cookie is the simple default for your own web app; API keys suit services. Cursors stay stable while rows are inserted, and offsets suit lists nobody is writing to, where jumping straight to page 47 is useful.',
  },

  /* ---------------------------------------------------------------- */
  /* f-db                                                              */
  /* ---------------------------------------------------------------- */
  {
    id: 'f-db-tf1',
    kind: 'truefalse',
    moduleId: 'f-db',
    section: 'Indexes',
    prompt: 'Indexes cost only disk space, so indexing every column that might ever be queried is a safe default.',
    answer: false,
    explain:
      'Every index has to be updated on each insert and update, so each one slows every write as well as taking storage. Index the queries you actually run.',
  },
  {
    id: 'f-db-tf2',
    kind: 'truefalse',
    moduleId: 'f-db',
    section: 'Indexes',
    prompt: 'A B-tree index on `created_at` can serve a date-range query, while a hash index on the same column can serve only exact matches.',
    answer: true,
    explain:
      'A B-tree keeps keys sorted, so it can seek to the start of a range and walk forward. A hash scatters neighbouring values across buckets, which rules out ranges and sorting.',
  },
  {
    id: 'f-db-multi',
    kind: 'multi',
    moduleId: 'f-db',
    section: 'Joins and the shape of your data',
    prompt: "You copy each author's display name into every one of their posts so a post renders without a join. Which consequences follow?",
    options: [
      'Rendering a post needs one lookup instead of a join',
      'Renaming an author means updating every post they wrote',
      'Writes to the posts table get faster',
      'Each post row takes less storage',
      'A missed update leaves some posts showing the old name',
    ],
    correct: [0, 1, 4],
    explain:
      'Denormalising buys a faster read with a costlier, riskier write: every copy must change together or they drift. Normalised, a rename touches one row and reads pay for the join instead.',
  },
  {
    id: 'f-db-match',
    kind: 'match',
    moduleId: 'f-db',
    section: 'Transactions and [[ACID]]',
    prompt: 'Match each [[ACID]] property to the failure it prevents.',
    pairs: [
      { left: 'Atomic', right: 'A debit is saved but its matching credit is not' },
      { left: 'Consistent', right: 'A row that breaks a constraint is saved anyway' },
      { left: 'Isolated', right: "A query sees another transaction's half-done work" },
      { left: 'Durable', right: 'A committed order is gone after a crash' },
    ],
    explain:
      'Atomic is all or nothing, consistent keeps constraints true, isolated stops concurrent transactions seeing each other half-done, and durable means a commit survives a crash. Isolation is the one contention problems lean on.',
  },

  /* ---------------------------------------------------------------- */
  /* f-storage                                                         */
  /* ---------------------------------------------------------------- */
  {
    id: 'f-storage-tf1',
    kind: 'truefalse',
    moduleId: 'f-storage',
    section: 'Blob storage and the rule that goes with it',
    prompt: 'With direct uploads through a presigned [[URL]], your service usually learns a file has arrived from a storage event, not by receiving its bytes.',
    answer: true,
    explain:
      'The client uploads straight to [[S3]], so the bytes never pass through your servers. An event from the bucket tells your service the object exists, and it records the metadata and the pointer.',
  },
  {
    id: 'f-storage-tf2',
    kind: 'truefalse',
    moduleId: 'f-storage',
    section: 'The argument to refuse',
    prompt: 'Only [[NoSQL]] databases can store unstructured data such as free-form JSON documents.',
    answer: false,
    explain:
      'Relational databases handle it too: Postgres has `jsonb`, which can be indexed. Choosing a store by "structured or not" is the set-piece debate to refuse; name the property you actually need instead.',
  },
  {
    id: 'f-storage-multi',
    kind: 'multi',
    moduleId: 'f-storage',
    section: 'The access-pattern rule for NoSQL',
    prompt: 'A DynamoDB posts table has partition key `userId` and sort key `createdAt`. Which queries can it serve without a scan or a new index?',
    options: [
      "One user's posts, newest first",
      'All posts from last week, across every user',
      'Every post with more than 100 likes',
      "One user's posts from last week",
      "A user's single most recent post",
    ],
    correct: [0, 3, 4],
    explain:
      'A query is efficient when it names the partition key; the sort key then orders or bounds it. Anything spanning all users scans the table unless you add a secondary index designed for that pattern.',
  },
  {
    id: 'f-storage-match',
    kind: 'match',
    moduleId: 'f-storage',
    section: 'The argument to refuse',
    prompt: 'Match each kind of data to the store that should hold it.',
    pairs: [
      { left: 'Profile photos and video files', right: 'Blob storage' },
      { left: 'Orders and payments that must commit together', right: 'Relational database' },
      { left: 'Fuzzy product search with filters', right: 'Search engine' },
      { left: 'Hot reads and sessions, rebuilt if lost', right: 'In-memory cache' },
      { left: 'Durable records read by one known key, at huge scale', right: 'Key-value NoSQL store' },
    ],
    explain:
      'Each store holds what it is good at. A cache is fast but disposable; a [[NoSQL]] key-value store is durable and fast for the access pattern it was keyed for, and slow for anything else.',
  },

  /* ---------------------------------------------------------------- */
  /* f-cache                                                           */
  /* ---------------------------------------------------------------- */
  {
    id: 'f-cache-tf1',
    kind: 'truefalse',
    moduleId: 'f-cache',
    section: 'The two failure modes',
    prompt: 'A cache stampede needs no outage: one popular key expiring on a perfectly healthy cache is enough to flood the database.',
    answer: true,
    explain:
      'Every concurrent reader misses at the same instant and goes to the database together. That is why the fixes are about expiry, such as a rebuild lock or early recomputation, rather than about cache availability.',
  },
  {
    id: 'f-cache-tf2',
    kind: 'truefalse',
    moduleId: 'f-cache',
    section: 'Write strategies',
    prompt: 'Write-back caching suits payment records, because each write is acknowledged as soon as the cache holds it.',
    answer: false,
    explain:
      'Acknowledging before the database has the write is exactly the risk: if the cache node dies first, the payment is gone. Write-back trades durability for speed, which suits data you can afford to lose.',
  },
  {
    id: 'f-cache-multi',
    kind: 'multi',
    moduleId: 'f-cache',
    section: 'Cache-aside, the default',
    prompt: 'In cache-aside, which steps does your application code perform itself?',
    options: [
      'Wait while the cache fetches the row from the database',
      'Check the cache before touching the database',
      'Query the database when the cache misses',
      'Receive updates the database pushes into the cache',
      'Write the result into the cache with a TTL',
    ],
    correct: [1, 2, 4],
    explain:
      'In cache-aside the cache is passive: the application checks it, loads from the database on a miss, and fills it with a [[TTL]]. A cache that loads rows by itself is read-through, a different pattern.',
  },
  {
    id: 'f-cache-match',
    kind: 'match',
    moduleId: 'f-cache',
    section: 'Say what you are storing',
    prompt: 'Match each job to the Redis data structure that fits it.',
    pairs: [
      { left: 'Seat holds ordered by when they expire', right: 'Sorted set' },
      { left: 'Approximate count of unique visitors', right: 'HyperLogLog' },
      { left: "A user's profile, read and updated field by field", right: 'Hash' },
      { left: 'Which of a million users were active today', right: 'Bitmap' },
    ],
    explain:
      'A sorted set orders members by score, a hash stores named fields, a bitmap spends one bit per user id, and [[HyperLogLog]] estimates distinct counts in about 12 [[KB]] however many items it sees.',
  },

  /* ---------------------------------------------------------------- */
  /* f-scale                                                           */
  /* ---------------------------------------------------------------- */
  {
    id: 'f-scale-tf1',
    kind: 'truefalse',
    moduleId: 'f-scale',
    section: 'Scale triggers worth memorising',
    prompt: 'At a few thousand requests a second, one well-provisioned application server is usually enough, so going distributed for throughput alone is an over-correction.',
    answer: true,
    explain:
      'A standard application server holds 100k+ concurrent connections on 8–64 cores and 64–512 [[GB]] of [[RAM]]. You may still want a second box for redundancy, but not for raw capacity.',
  },
  {
    id: 'f-scale-tf2',
    kind: 'truefalse',
    moduleId: 'f-scale',
    section: 'The order to reach for things',
    prompt: "Putting a [[CDN]] in front of a personalised home feed takes most of that feed's read load off your servers.",
    answer: false,
    explain:
      'An edge cache wins by serving one stored copy to many users. A feed that differs per user has nothing to share, so nearly every request passes through; a CDN suits static and unpersonalised content.',
  },
  {
    id: 'f-scale-multi',
    kind: 'multi',
    moduleId: 'f-scale',
    section: 'Reads and writes scale differently',
    prompt: 'You add three read replicas behind a single primary database. Which of these follow?',
    options: [
      'Read capacity grows with each copy added',
      'Write capacity grows with each copy added',
      'Every read sees the latest committed write',
      'Some reads return data a moment behind the primary',
    ],
    correct: [0, 3],
    explain:
      'Reads spread across the copies, but each replica applies changes milliseconds to seconds after the primary. Every write still lands on the primary, so write capacity does not move.',
  },
  {
    id: 'f-scale-match',
    kind: 'match',
    moduleId: 'f-scale',
    section: 'The order to reach for things',
    prompt: 'Match each symptom to the lever that fixes it first.',
    pairs: [
      { left: 'One query scans the whole table', right: 'Add an index' },
      { left: 'The same hot rows are read thousands of times a second', right: 'Cache them' },
      { left: 'Images load slowly for users far away', right: 'Serve them from a CDN' },
      { left: 'Reads still saturate the primary after caching', right: 'Add read replicas' },
      { left: 'Writes outgrow what one tuned primary can take', right: 'Shard' },
    ],
    explain:
      'Each lever answers one bottleneck, cheapest first. A [[CDN]] helps only static or unpersonalised content, and sharding is kept for writes one machine genuinely cannot take, because of the cross-shard pain it brings.',
  },

  /* ---------------------------------------------------------------- */
  /* i-room                                                            */
  /* ---------------------------------------------------------------- */
  {
    id: 'i-room-tf1',
    kind: 'truefalse',
    moduleId: 'i-room',
    section: 'The levels',
    prompt: '"We would use Elasticsearch" is enough depth for a senior rating; explaining how the index is fed and how far it lags is staff-level detail.',
    answer: false,
    explain:
      'Naming the tool is the mid-level answer. Senior depth is the mechanism and its cost: an inverted index fed by change data capture, a second behind, fine for search and wrong for booking.',
  },
  {
    id: 'i-room-tf2',
    kind: 'truefalse',
    moduleId: 'i-room',
    section: 'Three habits worth more than another topic',
    prompt: 'With two minutes left, walking back through your non-functional requirements and pointing at what meets each is worth more than starting another deep dive.',
    answer: true,
    explain:
      'Closing the loop shows the design answers what you agreed at the start, and it is cheap. A deep dive begun with two minutes left will not finish, so it earns little.',
  },
  {
    id: 'i-room-multi',
    kind: 'multi',
    moduleId: 'i-room',
    section: 'How strong candidates actually lose',
    prompt: 'Which habits cost strong candidates the round, whatever they know?',
    options: [
      'Bringing in Kafka and sharding before anything works',
      'Sharding at 10k writes a second, as if it were 2010',
      'Cutting nine requirements down to three',
      'Naming the alternative you rejected, in one clause',
      "Talking through the slot meant for the interviewer's questions",
    ],
    correct: [0, 1, 4],
    explain:
      'Complexity before a working system, stale numbers and filling the deep-dive slot all lose the room. Narrowing scope and naming the rejected option are habits that win it.',
  },
  {
    id: 'i-room-match',
    kind: 'match',
    moduleId: 'i-room',
    section: 'The levels',
    prompt: 'Match each level to how it handles trade-offs.',
    pairs: [
      { left: 'Mid · E4', right: 'Picks something reasonable' },
      { left: 'Senior · E5', right: 'States the alternative and why it lost' },
      { left: 'Staff+ · E6', right: 'Reframes the question so a better trade exists' },
    ],
    explain:
      'Every level makes a choice. Senior shows the road not taken and why; staff changes the framing so the choice itself gets better.',
  },

  /* ---------------------------------------------------------------- */
  /* i-recognition                                                     */
  /* ---------------------------------------------------------------- */
  {
    id: 'i-recognition-tf1',
    kind: 'truefalse',
    moduleId: 'i-recognition',
    section: 'When the prompt is genuinely unfamiliar',
    prompt: 'Faced with a genuinely unfamiliar prompt, asking who uses it and what they are trying to do usually names the patterns for you.',
    answer: true,
    explain:
      'Purpose reveals shape: who reads, who writes, what must be exclusive or instant. It is also exactly the question you would ask on the job, which is part of what is being judged.',
  },
  {
    id: 'i-recognition-tf2',
    kind: 'truefalse',
    moduleId: 'i-recognition',
    section: 'The ninety-second decomposition',
    prompt: "When part of a request takes minutes, such as transcoding a video, the simplest sound design holds the client's request open until the work finishes.",
    answer: false,
    explain:
      'Work that outlasts a request is the long-running pattern: accept it, queue it, return at once, and report progress separately. Holding the request open ties up connections and fails on the first timeout.',
  },
  {
    id: 'i-recognition-multi',
    kind: 'multi',
    moduleId: 'i-recognition',
    section: 'The ninety-second decomposition',
    prompt: '"Design a photo-sharing app where friends see new photos the moment they are posted." Which patterns does the ninety-second decomposition surface?',
    options: ['Contention', 'Large blobs', 'Real-time delivery', 'Proximity search', 'Scaling reads'],
    correct: [1, 2, 4],
    explain:
      'Photos are big enough for blob storage, "the moment they are posted" is real-time, and far more people view than post. Nothing is exclusive and nothing is geographic, so contention and proximity do not apply.',
  },
  {
    id: 'i-recognition-match',
    kind: 'match',
    moduleId: 'i-recognition',
    section: 'Worked decompositions',
    prompt: 'Match each prompt to the deep dive that matters most.',
    pairs: [
      { left: 'Ticketmaster', right: 'Reservations that expire without a held lock' },
      { left: 'Uber', right: 'Matching without assigning one driver twice' },
      { left: 'YouTube', right: 'The upload and transcode pipeline' },
      { left: 'Google Docs', right: 'Resolving concurrent edits to one document' },
      { left: 'Ad click aggregator', right: 'Idempotency and windowed aggregation' },
    ],
    explain:
      "Each deep dive is where the prompt's hardest pattern lives: contention for tickets and drivers, blobs and long-running work for video, real-time conflicts for documents, write scaling for clicks.",
  },

  /* ---------------------------------------------------------------- */
  /* i-star                                                            */
  /* ---------------------------------------------------------------- */
  {
    id: 'i-star-tf1',
    kind: 'truefalse',
    moduleId: 'i-star',
    section: 'The skeleton',
    prompt: 'In a [[STAR]] answer, the Situation deserves about as much time as the Action, so the interviewer has the full context before you say what you did.',
    answer: false,
    explain:
      'The Situation is two sentences of stakes; the Action is most of the answer, because that is where the signal is. If the interviewer needs your architecture to follow along, it is the wrong story or the wrong level of detail.',
  },
  {
    id: 'i-star-tf2',
    kind: 'truefalse',
    moduleId: 'i-star',
    section: 'Delivering it',
    prompt: 'If you are interrupted forty seconds into a story, the interviewer should already know what was at stake and what your role was.',
    answer: true,
    explain:
      'Lead with the headline: one sentence of stakes and role, then the detail. A story that spends its opening on background leaves nothing to score if it is cut short.',
  },
  {
    id: 'i-star-multi',
    kind: 'multi',
    moduleId: 'i-star',
    section: 'What senior scope sounds like',
    prompt: 'Which lines carry senior-scope signal rather than just describing work?',
    options: [
      '"Nobody had defined reliable, so I proposed three targets and got one agreed."',
      '"I coordinated closely with several other teams."',
      '"I did most of it myself to make sure it was right."',
      '"I wrote the migration guide, and the other nine teams moved without me."',
      '"I was given a ticket to add retries, and shipped it early."',
      '"Checkout errors fell from 1.2% to 0.3% over six weeks."',
    ],
    correct: [0, 3, 5],
    explain:
      'Ambiguity turned into a plan, other people multiplied and a measured result are senior signals. Vague coordination, doing it all yourself and a well-run ticket describe work without that scope.',
  },
  {
    id: 'i-star-match',
    kind: 'match',
    moduleId: 'i-star',
    section: 'The story bank',
    prompt: 'Match each question to the story theme it is really asking for.',
    pairs: [
      { left: '"Requirements kept changing"', right: 'Ambiguity' },
      { left: '"You pushed back on your manager"', right: 'Conflict' },
      { left: '"You drove adoption across teams"', right: 'Influence' },
      { left: '"A decision with incomplete data"', right: 'Trade-off under pressure' },
      { left: '"A mistake you made"', right: 'Failure' },
    ],
    explain:
      'Six to eight stories cover these themes because each can be told from more than one angle. Knowing which theme a question targets lets you pick the story where that theme is the point.',
  },

  /* ---------------------------------------------------------------- */
  /* i-influence                                                       */
  /* ---------------------------------------------------------------- */
  {
    id: 'i-influence-tf1',
    kind: 'truefalse',
    moduleId: 'i-influence',
    section: 'Disagree and commit',
    prompt: 'Disagree and commit means executing a decision even if you believe it is unsafe or unlawful, provided you argued against it first.',
    answer: false,
    explain:
      'It has a limit, and naming it is a senior signal. If a decision is unsafe, unlawful or harms users, you do not commit: you escalate openly and tell the person you disagree with that you are doing so.',
  },
  {
    id: 'i-influence-tf2',
    kind: 'truefalse',
    moduleId: 'i-influence',
    section: 'Managing stakeholders',
    prompt: 'The same project slip can make a stakeholder story or a failure story, depending on when you raised it and whether you brought options.',
    answer: true,
    explain:
      'Raised when you knew, with two or three costed options, it lets the stakeholder choose the trade. Raised on the deadline, it is a surprise they had no time to plan around.',
  },
  {
    id: 'i-influence-multi',
    kind: 'multi',
    moduleId: 'i-influence',
    section: 'Influence without a title',
    prompt: 'You need eight teams you have no authority over to adopt a shared payments client. Which moves fit leading without authority?',
    options: [
      'Ask your director to mandate it for all eight teams',
      'Measure the problem and write a one-page proposal',
      'Walk the most sceptical lead through it privately first',
      'Unveil it at the all-hands so every team hears it at once',
      'Keep the credit, so your next proposal carries more weight',
      'Offer a reversible pilot to one willing team',
    ],
    correct: [1, 2, 5],
    explain:
      'Without a title you have evidence, alignment and trust. A mandate skips all three, an objection raised in a big meeting hardens, and giving the credit away is what earns the next yes.',
  },
  {
    id: 'i-influence-match',
    kind: 'match',
    moduleId: 'i-influence',
    section: 'One conflict, four framings',
    prompt: "You and another team's lead disagreed over sharing his database. Match each framing of the story to the level it signals.",
    pairs: [
      { left: '"I took it to our director, who agreed with me"', right: 'Red flag' },
      { left: '"We met in the middle with separate schemas"', right: 'Mid-level' },
      { left: '"We agreed the criteria, then compared options"', right: 'Senior' },
      { left: '"I took on his real concern, the on-call load"', right: 'Staff' },
    ],
    explain:
      "A manager settling it is a red flag, and a quiet compromise has no reasoning in it. Agreed criteria settle it on the merits; staff goes further, stating the other side's concern fairly and paying for it.",
  },

  /* ---------------------------------------------------------------- */
  /* i-failure                                                         */
  /* ---------------------------------------------------------------- */
  {
    id: 'i-failure-tf1',
    kind: 'truefalse',
    moduleId: 'i-failure',
    section: 'Trade-offs under pressure',
    prompt: 'A trade-off story only works in an interview if the decision turned out to be right.',
    answer: false,
    explain:
      'The question tests whether you could decide and knew what you were trading. Naming the options, their costs, why you chose and how you limited the downside scores even when the outcome was bad.',
  },
  {
    id: 'i-failure-tf2',
    kind: 'truefalse',
    moduleId: 'i-failure',
    section: 'Blameless postmortems',
    prompt: 'A blameless postmortem still holds people accountable; what changes is that its output is a change to the system rather than a name.',
    answer: true,
    explain:
      'It assumes everyone acted reasonably on what they knew and asks why the mistake was easy to make. Accountability remains, and a senior engineer shows it by owning their part in the room first.',
  },
  {
    id: 'i-failure-multi',
    kind: 'multi',
    moduleId: 'i-failure',
    section: 'Owning it, without the hedges',
    prompt: 'Which lines own the mistake rather than deflect it?',
    options: [
      '"I skipped the load test to hit the date. That was my call."',
      '"Testing did not catch it."',
      '"There was a miscommunication with support."',
      '"I rolled it out to every region at once instead of one."',
      '"It caused forty minutes of failed checkouts."',
      '"In hindsight, the rollout was not ideal."',
    ],
    correct: [0, 3, 4],
    explain:
      'Ownership is mostly grammar: you as the subject, a concrete action, a concrete impact. The passive voice, a process as the subject and soft words like "not ideal" all move the mistake away from you.',
  },
  {
    id: 'i-failure-match',
    kind: 'match',
    moduleId: 'i-failure',
    section: 'A time you were wrong',
    prompt: 'In an answer to "a time you were wrong", match each line to the job it does.',
    pairs: [
      { left: '"I was sure it was the database; it had been twice before"', right: 'What you believed, and why it was reasonable' },
      { left: '"The trace showed most time went on serialising"', right: 'The evidence that changed your mind' },
      { left: '"I posted in the incident channel that I was wrong"', right: 'How quickly you updated, in public' },
      { left: '"Fixing the slow query was still worth doing"', right: 'Which part of your reasoning survived' },
    ],
    explain:
      'Being wrong is a belief you changed, not an outcome that went badly, so it is a different story from a failure. The signal is how you update: on what evidence, how fast, and what you kept.',
  },
]
