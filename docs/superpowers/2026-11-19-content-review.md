# Content review — 2026-11-19

Seven reviewers read every lesson, quiz item, card, bank question, problem, glossary term and pattern. No ids or headings changed, so saved progress and deep links are unaffected. This is the record of what was corrected and what was left for a decision.

## Distributed + production (1429cb9) — 16 factual fixes, 0 key changes
- d-time Lamport: total order "is all a replicated log needs" → order only known after the fact (logs need consensus)
- d-consensus Paxos: adopt "any accepted value" → the value from the highest ballot accepted
- d-consistency quorum W=2,R=2: "slower of two" → "second-fastest of three"
- d-consistency: cross-region "tens of ms" → "tens to hundreds of ms"
- d-time figure: "unsynced quartz ~17 s/day" → labelled worst case (Spanner's 200µs/s budget)
- d-time HLC "fits in 64 bits" → "can be packed into"
- d-transactions XA: not Java-specific (X/Open)
- d-delivery: at-least-once "everywhere" → "almost everywhere" (GitHub doesn't auto-redeliver)
- Stripe idempotency keys: any POST, kept "at least" 24 h
- d-resilience: Envoy retry budget is opt-in, 20% default
- o-observability: trace propagation into Kafka is not "never automatic" (OTel instruments some clients)
- o-observability: golden signals ≈ RED plus saturation
- o-slo + bank o-slo-tf1: availability multiplies only if failures are independent
- o-security: workload creds expire "within hours" (AWS ~6 h)
- o-deploy: Kubernetes rolls up to 25% of pods; card c-o-slo-3 names the 30-day budget
- 4 quiz options had [[…]] inside buttons → unwrapped (NTP, USE, CPU/API, KMS)
## Architecture + applied (62ff988) — 10 factual fixes, 2 key fixes
- a-realtime: WebSocket's real cost is the upgrade through proxies, per-connection state on drain, own reconnect logic (SSE/long-poll also hold connections)
- a-writes + bank a-writes-tf1: sampled "ad clicks" → page views (billable clicks are never sampled); rate recorded to scale totals back up
- a-proximity: geohash example was ~19 m apart and on London's edge → gcpvj0du/gcpvj0dv, ~20 m, plus true 7-char cell size
- a-proximity: S2 is a fixed hierarchy; only quadtrees split adaptively
- a-contention: TTL-expiry write fails only if someone else claimed the seat; seat map reads members, not a count
- a-multistep: a saga step triggers the next via an event OR a coordinator
- a-longrunning: LBs/proxies cut silent requests after ~1 min (not browsers)
- ar-edge: Istio ambient = per-node proxy for mTLS/identity + optional waypoint proxies
- Kafka keyless messages: sticky partitioning since 2.4, not round-robin; gRPC in browsers only via gRPC-Web
- KEY q-a-writes-1: had two defensible answers → distractors replaced; KEY bank a-realtime-multi: ambiguous "typing indicators" option replaced
- 10 quiz options with [[…]] unwrapped; 9 card fronts made into questions
- Unsure/left: a-multistep charges the card before reserving stock (usual advice: hardest-to-undo last)
## Principles + LLD (5a34346) — 14 factual fixes, 4 question fixes
- p-oop: "only one pillar is optional" (opinion) removed; java.time: date/time types immutable (not every type)
- p-coupling: stamp coupling ties you to the whole shape (not "breaks"); figure label "data coupling only" was wrong for taxFor(order)
- p-srp-ocp: Martin's example is the hours report of another department
- p-lsp-isp: exception/history rules are Liskov & Wing, not Meyer
- p-dip: "most" containers fail at startup (Dagger checks at build); Spring/Nest refuse to boot "by default"
- p-clean: Packwerk is general component boundaries, not an Active Record fix
- l-round: pseudo-code "often marked down" (varies); LinkedHashMap gives the building block for LRU
- l-concurrency: data race = concurrent access with ≥1 write; deadlock comes from taking >1 lock, not slow calls; OCC holds no lock *while deciding*; naive singleton *can* build two
- KEYS: q-p-coupling-1, q-p-oop-2, q-p-dip-3 stems sharpened (each had a second defensible option); q-p-simplicity-2 option had [[SMS]] in a button
- q-l-round-1 explanation contradicted the lesson (modelling first)
## Design patterns (479c8b3) — 19 factual fixes, 0 key changes (2 explanations fixed)
- 2 code panes didn't typecheck (Database.query missing; SheetImport.file undeclared) — all 46 panes checked with tsc --strict
- proxy: GoF's fourth kind is "smart reference", not caching → "four common kinds"
- observer: pub/sub decoupling in time needs a *durable* broker (Redis pub/sub drops); delivery "normally" at-least-once
- composite: GoF leaned to transparency; typed code usually picks safety
- state: the context may own transitions too
- builder: the textbook case is an HTTP *request*; pools reap idle connections themselves
- memento: a blur can't be inverted; golden hammer is from the 1998 AntiPatterns book (echoes Maslow)
- dp-observer-tf2 explanation: naive emit *does* propagate listener exceptions
- Left: dp-strategy-state-tf2's section points at the topic heading, content sits in follow-ups
## Problems, glossary, patterns (bb123fc) — 48 files
Glossary: invented "90%" for REST removed; TCP handshake caption (3rd ACK can carry data); WebSocket cost not "L4 only"; gRPC = "gRPC Remote Procedure Calls"; CAP choice is C vs A; HyperLogLog ~1% (Redis 0.81%), five orders of magnitude; TiB vs TB (drives are sold in TB); DAU arithmetic (~116 w/s); CPU gist contradicted its own figure; latency scale labels/caption wrong (not each step 1000×); SSD ~100× faster than HDD (not thousands); GDPR restricts transfers, not residency; S3 vs DynamoDB storage ~10× ($0.25/GB-mo, not $1.25); SRS figure now matches the app's SM-2 (1/6/15 d); LLM call ~100× a DB read; FCM/APNs are free; WAL vs MySQL binlog; RFC ≠ always a standard; HMAC is symmetric (a tag)
Problems:
- reddit: vote transaction could double-count (FOR UPDATE can't lock a missing row) and dual-wrote to Kafka → INSERT … ON CONFLICT + FOR UPDATE + outbox
- bitly: PK lookup is a few ms, not 20–50; 301 cached "may… indefinitely"
- ticketmaster: B-tree *does* prefix-match ("Swift", not "Taylor", is the miss); added POST …/hold
- dropbox: same DynamoDB price error; chunk-per-object consistency
- rate-limiter: Redis RTT ~1 ms; two rungs both claimed "the production answer"; "three headers" listed four
- web-crawler: Bloom filter rung contradicted itself; lease a domain not a URL
- ad-click: Kafka ~hundreds of thousands msg/s/broker; clickId derived from signed impression id
- uber/whatsapp/youtube/news-feed/instagram/top-k/typeahead/live-comments/google-docs/notifications/yelp/food-delivery/airbnb/auction/flash-sale/payments/metrics/kv-store/job-scheduler/online-judge + LLD elevator/LRU/library: arithmetic and consistency fixes (flash-sale admit rate couldn't sell out in 8 s; metrics row smaller than its own overhead; notifications blast ~8 min not 1; kv-store "DynamoDB" → Amazon's Dynamo)
KEYS/rubric: news-feed r9, google-docs r12, metrics r10 staff→senior; lld-parking-lot r3 must→senior; live-comments r2, lld-vending r2 widened; facade's "tell" read like template method
Flagged outside its files: foundations.ts DynamoDB "$1.25/GB, 50× S3" (line ~843, card ~910); foundations "uncached DB query 20–50 ms" high for a PK lookup
## Core + databases (7b29a0f) — ~28 factual fixes, 2 key fixes
- c-sharding: Redis Cluster uses 16,384 hash slots, not a ring; cross-shard txns "slow and fragile, or not offered" (Spanner/Cockroach do them)
- c-framework: deep dives ≈ a fifth of 45 min, not a tenth; c-requirements DAU arithmetic + peak 3–10×
- c-modelling: GSIs eventually consistent *in DynamoDB* (Spanner/Cockroach sync)
- c-caching: hot key is pinned to a node by sharding (not created by it); c-queues: a queue misses a latency budget because work waits behind a backlog
- c-search: Postgres FTS weaker at ranking/typos (not "slower")
- db-normalization + bank: BCNF cannot *always* preserve dependencies; db-acid: CockroachDB defaults to serializable; CAP's C = latest write
- db-locking: row locks last until commit; UPDATE re-check only at read committed (RR aborts); InnoDB unindexed UPDATE locks every row
- db-choosing: Spanner pays in commit latency, not local writes; db-nosql-modelling: adaptive capacity *can* split hot partitions, not a monotonic sort key
- KEYS: q-c-cap-3 had an arguably-true distractor → replaced; bank c-requirements-match "survives losing a DC" could pair with durability → "stays up"
- 6 quiz options with [[…]] unwrapped
- Unsure/left: heading "Why the database cannot do it" overstates (body means LIKE); validator misses unwrapped plurals like "CDNs"
## Foundations, interview, behavioural (97ecca6) — ~25 factual fixes, 7 key-wording fixes
- f-storage: DynamoDB $0.25/GB-mo (~10× S3), 400 KB item cap — was $1.25 and "fifty times"
- f-network: latency ladder isn't "each step 1000×"; "network call 1–10 ms" sat below a Redis hit → "service call"; NY–London ~80 ms RTT (floor ~56 ms); SSE needs non-buffering proxies; L7 pools *backend* connections
- f-cache: TTL jitter doesn't fix one hot key expiring; Redis default eviction is noeviction; cache-down = 20× reads at a 95% hit rate
- f-db: 10M-row B-tree lookup = 3–4 pages, not "20 rows"; GIN indexes arrays/jsonb; read committed does NOT stop a double booking
- f-scale: "64 TiB+" contradicted "a few TB comfortably"; ">5 ms uncached reads" trigger always fired
- f-what: rubrics are per-company, communication not "scored as heavily"; app covers LLD too
- f-api: offset pagination — inserts cause duplicates, deletes cause skips
- i-*: disagree-and-commit from Intel (Amazon adopted); one-way doors from Bezos's letters; "about ten" shapes, not eight
- KEYS (wording only): q-f-scale-1, q-f-cache-2, q-f-cache-3, q-f-network-1 ("long polling on a 200 ms interval" was incoherent), q-f-network-3, bank f-db-match
- card tag '[[API]]' rendered literal brackets → 'API'
- Unsure/left: heading "Why WebSockets push you down to Layer 4" overstates (callout qualifies); "20–50 ms uncached query" used app-wide, only qualified
