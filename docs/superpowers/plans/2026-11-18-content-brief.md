# Content brief: authoring lessons and problems for Throughput

You are writing curriculum for **Throughput**, an offline app that prepares software
engineers for **senior** interviews: system design, object-oriented and low-level design,
and behavioral rounds. Read these before writing:

1. `CLAUDE.md`: the "Authoring content" section is binding.
2. `docs/superpowers/specs/2026-11-18-learning-platform-design.md`: the "Curriculum" and
   "Lesson building blocks" sections.
3. `src/content/types.ts` and `src/content/figures.ts`: the exact data shapes.
4. A reference lesson: `c-caching` in `src/content/modules/core.ts`. A reference problem:
   `src/content/problems/ticketmaster.ts`. Match their voice.

## Voice

- Direct, specific, opinionated. Second person. Short sentences. British spelling
  (prioritise, recognise, behaviour), matching the existing content.
- Every claim is something you could defend to a senior interviewer. Give numbers where
  they exist (latencies, sizes, rates).
- Name real systems in examples: Postgres, Kafka, Stripe, Netflix, Uber, Linux, the Java
  standard library. Never invent statistics.
- No filler ("In today's world…"), no hedging, no emoji.
- Teach the trade-off. Every option you show has a cost, and you say which one you'd pick
  and why.

## The quality bar for a lesson

Each lesson is one `Module` object:

```ts
{
  id: 'db-isolation',            // from the id table — exact
  trackId: 'databases',          // see your stub file's header comment
  title: 'Isolation levels and their anomalies',   // plain text, no markup
  station: 4,                    // order within the track — see the id table
  prereqs: ['db-acid'],          // the previous station in your track, plus at most one earlier lesson it truly needs
  related: ['c-cap'],            // existing survey lessons this deepens (ids below). Optional.
  minutes: 12,                   // honest: ~200 words per minute of prose, +1 per figure/table
  summary: 'One line, plain text, shown on the map.',
  objectives: ['Name the anomaly each isolation level allows', '…'],   // 2–4, may use markup
  keywords: ['read committed', 'serializable', 'phantom read', 'dirty read'],  // 3–8 search synonyms
  lesson: [ /* Block[] */ ],
  quiz: [ /* exactly 3 QuizItem */ ],
  cards: [ /* 2–3 CardItem */ ],
}
```

**Lesson body: 8–15 minutes. Follow this rhythm** (adapt, don't pad):

1. Open with 1–2 `prose` blocks saying why this matters *in an interview*.
2. A `figure` early. Pick the primitive that matches the claim.
3. The body: `heading`s (3–6 of them; they become the lesson's table of contents and its
   deep links from search), with `prose`, `list`, `table`, `compare`, `ladder`, `code`
   and `codeCompare` as the content needs. **At least two `figure` blocks in total.**
4. At least one `callout` with `tone: 'example'`: a named real-world case ("Stripe's
   idempotency keys…", "Java's `InputStream` decorators…").
5. One `callout` `tone: 'say'`: the sentence to say in the interview.
6. One `callout` `tone: 'trap'`: how candidates lose points here.
7. End with a `followups` block of 2–4 `{ q, a }` pairs. These are the questions an
   interviewer pushes with, each with a strong answer of 2–4 sentences.

Principles, design patterns and low-level design lessons **must** show code. Use
`codeCompare` for "violates → follows" or "without pattern → with pattern", and a
`classes` figure for every pattern's structure. **All code is TypeScript.** Keep it
short: 6–25 lines per pane, and lines ≤ 70 characters so it fits a phone.

**Quiz: exactly 3 items, each with exactly 4 options, one correct.**
- Distractors must be plausible, the kind of mistake a mid-level engineer makes.
- Vary the `correct` index (don't make it always 1).
- `explain` says *why* the right answer is right and the tempting one is wrong.
- Ids: `q-<moduleId>-1..3`. Set `moduleId` on each item.

**Cards: 2–3.**
- The `front` is a question.
- The `back` must be sayable in one breath (≤ ~30 words).
- `tag` is a short topic label (e.g. 'SOLID', 'Isolation').
- Ids: `c-<moduleId>-1..3`. Set `moduleId`.

## Blocks and figures, with examples

Existing kinds: `prose`, `heading`, `list`, `callout` (`say`/`trap`/`note`/`example`),
`table`, `code`, `flow`, `compare`, `ladder`, `figure`. Figures: `flow`, `stack`, `split`,
`ratio`, `grid`, `timeline`, `scale`, `cycle`, and three new ones:

```ts
// Sequence: who sends what to whom, in order. from/to index into actors; from === to is a note.
{ kind: 'figure', caption: 'Two-phase commit: nobody commits until everyone has voted yes.', figure: {
  kind: 'sequence', actors: ['Coordinator', 'Orders DB', 'Payments DB'],
  steps: [
    { from: 0, to: 1, label: 'prepare' }, { from: 0, to: 2, label: 'prepare' },
    { from: 1, to: 0, label: 'yes', dashed: true }, { from: 2, to: 0, label: 'yes', dashed: true },
    { from: 0, to: 0, label: 'decision logged' },
    { from: 0, to: 1, label: 'commit', tone: 'mastered' }, { from: 0, to: 2, label: 'commit', tone: 'mastered' },
  ] } }

// Classes: UML-lite. Interfaces and parents first. ≤ 5 boxes, ≤ 4 fields/methods each.
{ kind: 'figure', caption: 'Strategy: the context holds an interface; each algorithm is a class.', figure: {
  kind: 'classes',
  classes: [
    { name: 'PricingStrategy', stereotype: 'interface', methods: ['price(cart): Money'], tone: 'line' },
    { name: 'RegularPricing', methods: ['price(cart): Money'] },
    { name: 'SalePricing', fields: ['discount: number'], methods: ['price(cart): Money'] },
    { name: 'Checkout', fields: ['strategy: PricingStrategy'], methods: ['total(): Money'] },
  ],
  relations: [
    { from: 'RegularPricing', to: 'PricingStrategy', kind: 'implements' },
    { from: 'SalePricing', to: 'PricingStrategy', kind: 'implements' },
    { from: 'Checkout', to: 'PricingStrategy', kind: 'has', label: 'injected' },
  ] } }

// Decision: yes/no tree, depth ≤ 3.
{ kind: 'figure', caption: 'Pick the store from the access pattern, not from fashion.', figure: {
  kind: 'decision', root: {
    question: 'Do you need multi-row transactions?',
    yes: { answer: 'Relational (Postgres)', tone: 'line' },
    no: { question: 'Is the access pattern a key lookup at huge scale?',
          yes: { answer: 'Key-value / wide-column', sub: 'DynamoDB, Cassandra' },
          no: { answer: 'Relational anyway', sub: 'the boring default' } } } } }

// Code compare: code is exempt from markup and from the abbreviation rule.
{ kind: 'codeCompare',
  before: { title: 'Violates SRP', code: `class Invoice {\n  total() { /* … */ }\n  saveToDb() { /* … */ }\n}` },
  after:  { title: 'One reason to change', code: `class Invoice { total() { /* … */ } }\nclass InvoiceRepo { save(i: Invoice) { /* … */ } }` },
  note: 'Persistence changes no longer touch pricing logic.' }

// Follow-ups
{ kind: 'followups', items: [
  { q: 'What if two requests read the same row and both update it?', a: 'That is a lost update. …' },
] }
```

Tones (`line`, `mastered`, `streak`, `alert`, `neutral`) carry meaning. `mastered` = the
good/chosen option, `alert` = the failure or the bad option, `streak` = a warning or
in-between state, `line` = the focus. Every figure has a one-line `caption` saying what it
shows.

## Markup and the abbreviation rule (the validator enforces it)

- Inline markup in text fields: `**bold**`, `` `code` ``, `[[ABBR]]` (or
  `[[ABBR|display]]` for plurals). Nothing else.
- **Every abbreviation** (2+ capitals, e.g. `SOLID`, `ACID`, `2PC` counts only if it
  matches the capitals rule) used anywhere in your unit must be wrapped as `[[ABBR]]` at
  least once in that same unit (module or problem), and must exist in the glossary. Text
  inside backticks is exempt.
- Do **not** put `[[…]]` in `title` or `summary`. Wrap the abbreviation in the lesson body
  instead.
- If the glossary lacks an abbreviation, add an entry to **your own**
  `src/content/glossary/<key>.ts`. Same shape as `glossary.ts`:
  `{ id, full, gist (1–2 sentences: what and why it matters), figure, caption, seeAlso? }`.
  The figure is mandatory and should actually illustrate the idea.
- Product names, SQL keywords and ordinary words that look like acronyms belong in
  `ALLOWED` in `validate.ts`. **You may not edit that file.** List such words in your
  report instead, and the lead adds them.
- Existing glossary ids (don't re-add): API, REST, HTTP, TCP, IP, DNS, CDN, SSE,
  WebSocket, gRPC, L4, OSI, JWT, SQL, NoSQL, ACID, CAP, PACELC, AP, CP, OCC, TTL, CDC,
  PK, SK, GSI, LSI, GIN, PostGIS, S2, OLAP, UUID, LRU, LFU, FIFO, DLQ, SQS, DAG, OT, CRDT,
  HLS, DASH, HyperLogLog, SimHash, QPS, TPS, DAU, GB, TiB, CPU, RAM, SSD, SLA, GDPR, ML,
  SMS, S3, GCS, AWS, SRS, LLM, URL, L7, KB, MB, TB.
- Abbreviation owners. If your unit uses one of these and you are not the owner, wrap it
  **and** add an entry in your own glossary file anyway. The lead keeps one and deletes
  the duplicates.
  - principles: OOP, SOLID, SRP, OCP, LSP, ISP, DIP, DI, DRY, KISS, YAGNI.
  - designPatterns: GoF, MVC.
  - lld: UML.
  - databases: ER, BCNF, 1NF, 2NF, 3NF, MVCC, WAL, LSM.
  - distributed: 2PC, NTP, HLC.
  - architecture: CQRS, DDD, BFF, RPC.
  - production: OIDC, RBAC, ABAC, SLI, SLO, MTTR, TLS, mTLS, XSS, CSRF, OWASP.
  - behavioral: STAR.

## Existing lessons you can reference (prereqs, related, suggests)

- Foundations: `f-what` What system design actually is · `f-network` Client, server, and
  the network · `f-api` Designing the API · `f-db` Databases, enough to design with ·
  `f-storage` Where each kind of data lives · `f-cache` Caching, the first real lever ·
  `f-scale` Scaling 101.
- Core: `c-framework` The delivery framework · `c-requirements` Requirements and
  estimation · `c-modelling` Data modelling and indexing · `c-caching` Caching, properly ·
  `c-sharding` Sharding and consistent hashing · `c-cap` CAP, consistency, and PACELC ·
  `c-queues` Queues and streams · `c-search` Search and inverted indexes.
- Applied: `a-realtime` · `a-longrunning` · `a-contention` · `a-reads` · `a-writes` ·
  `a-blobs` · `a-multistep` · `a-proximity`.
- Interview: `i-room` Running the room · `i-recognition` Reading a question you have
  never seen.

Journey order of tracks: foundations → principles → design-patterns → lld → core →
databases → distributed → architecture → production → applied → interview. A `prereq`
must point to an **earlier** lesson in this order. `related` may point anywhere.

## Id table (exact ids, titles are suggestions, stations as listed)

| Owner key | File | trackId | Stations → ids |
|---|---|---|---|
| principles | `modules/principles.ts` | principles | 1 p-oop (OOP's four pillars, used properly) · 2 p-coupling (Coupling and cohesion) · 3 p-srp-ocp (SOLID I: single responsibility and open/closed) · 4 p-lsp-isp (SOLID II: Liskov substitution and interface segregation) · 5 p-dip (SOLID III: dependency inversion and injection) · 6 p-simplicity (DRY, KISS, YAGNI, and composition over inheritance) · 7 p-clean (Clean and hexagonal architecture) |
| designPatterns | `modules/designPatterns.ts` | design-patterns | 1 dp-intro (What patterns are for, and when they hurt) · 2 dp-factory (Factory method and abstract factory) · 3 dp-builder-singleton (Builder, and why singleton is suspect) · 4 dp-adapter-facade-proxy (Adapter, facade and proxy) |
| designPatterns2 | `modules/designPatterns2.ts` + `patterns-object.ts` | design-patterns | 5 dp-decorator-composite · 6 dp-strategy-state · 7 dp-observer (Observer and pub/sub) · 8 dp-command-template-chain (Command, template method, chain of responsibility) · 9 dp-anti (Anti-patterns) |
| lld | `modules/lld.ts` | lld | 1 l-round (How the low-level design round runs) · 2 l-modelling (Objects, responsibilities and relationships) · 3 l-extension (Designing for change) · 4 l-concurrency (Concurrency in object design) |
| databases | `modules/databases.ts` | databases | 1 db-er (Relational modelling and ER diagrams) · 2 db-normalization (Normalisation and deliberate denormalisation) · 3 db-acid (ACID, properly) · 4 db-isolation (Isolation levels and their anomalies) · 5 db-engines (Storage engines: B-trees vs LSM trees) |
| databases2 | `modules/databases2.ts` | databases | 6 db-locking (Locking, optimistic concurrency and MVCC) · 7 db-replication (Replication in practice) · 8 db-choosing (Choosing SQL or NoSQL) · 9 db-nosql-modelling (Modelling NoSQL around access patterns) |
| distributed | `modules/distributed.ts` | distributed | 1 d-failure (Partial failure) · 2 d-consistency (Consistency models) · 3 d-consensus (Consensus and leader election) · 4 d-time (Time, clocks and ordering) · 5 d-transactions (Distributed transactions: 2PC, sagas and the outbox) · 6 d-delivery (Delivery guarantees and idempotency) · 7 d-resilience (Timeouts, retries, circuit breakers, backpressure) |
| architecture | `modules/architecture.ts` | architecture | 1 ar-monolith (Monolith, modular monolith, microservices) · 2 ar-events (Event-driven architecture) · 3 ar-cqrs (CQRS and event sourcing) · 4 ar-api (API design in depth) · 5 ar-edge (Gateways, service discovery and the mesh) |
| production | `modules/production.ts` | production | 1 o-observability (Logs, metrics, traces) · 2 o-slo (SLIs, SLOs, SLAs and error budgets) · 3 o-auth (Authentication and authorization) · 4 o-security (Security essentials) · 5 o-deploy (Deploying and releasing safely) |
| behavioral | `modules/behavioral.ts` | interview | 3 i-star (Stories that show scope) · 4 i-influence (Leading without authority, conflict and disagreement) · 5 i-failure (Failure, ownership and trade-off stories) |

Behavioral lessons replace code with **example answers**. Use `compare` (weak answer vs
strong answer), a `ladder` (mid-level → senior → staff framing), the STAR structure as a
`flow` or `stack` figure, and `followups` with the probing questions interviewers ask.
Figures are still required (two each).

`patterns-object.ts` (designPatterns2 author): 10–14 `Pattern` entries with
`family: 'object'`, a `moduleId` pointing at the dp-* lesson that teaches it, a `tell` (the
phrase in a requirement that should make you reach for it, e.g. "behaviour varies by type
and the list keeps growing"), a `move` (one or two sentences: what you build), and
`showsUpIn` (2–3 real uses, e.g. 'Java Comparator', 'React context'). Use exactly these
ids: strategy, state, observer, factory, builder, singleton, adapter, decorator,
composite, command, template-method, chain-of-responsibility, facade, proxy.

## Problems

Problems are `Problem` objects, one per file under `src/content/problems/<id>.ts`
(export `const <camelCaseId>: Problem`), listed in your group file
`src/content/problems/groups/<group>.ts`.

| Owner key | Group file | Problems (id, category, difficulty) |
|---|---|---|
| problemsA | `groups/a.ts` | instagram social medium · fb-post-search social hard · top-k data hard · reddit social medium |
| problemsB | `groups/b.ts` | live-comments realtime medium · google-docs realtime hard · notifications realtime medium · yelp location medium · food-delivery location hard |
| problemsC | `groups/c.ts` | airbnb commerce medium · auction commerce hard · flash-sale commerce hard · payments commerce hard |
| problemsD | `groups/d.ts` | kv-store infra hard · job-scheduler infra medium · typeahead infra medium · metrics data hard · online-judge infra medium |
| problemsLld | `groups/lld.ts` | lld-parking-lot lld-systems easy · lld-vending lld-systems easy · lld-lru lld-components medium · lld-elevator lld-systems medium · lld-library lld-systems medium · lld-rate-limiter lld-components hard |
| existing | (edits the 10 existing problem files) | see below |

**Every system design (`kind: 'hld'`) walkthrough (`modelAnswer`)** has these
`heading`s, in this order. The validator checks the prefixes. Other headings may sit in
between.

1. `Requirements`: functional (top 3, "Users should be able to…") and non-functional
   (3–5, quantified).
2. `Core entities`: 3–6 nouns.
3. `API`: one endpoint per functional requirement (a `code` block).
4. `Data flow`: only for pipeline-shaped systems. Omit otherwise.
5. `High-level design`: a `figure` of the whole architecture (`flow`, `stack` or
   `split`), walked endpoint by endpoint, naming the bottlenecks.
6. `Deep dive 1 — <topic>`, `Deep dive 2 — <topic>` (and 3 for hard problems). Each one
   is a `ladder` (bad → good → great → best) or a `compare`, ending in a pick and why. At
   least one more `figure` across the deep dives.

Then:
- `followups` (3–5 `{ q, a }`) as a field on the Problem, **not** a block.
- `rubric` with 8–12 rows split across `must` / `senior` / `staff`, ids `r1…`.
- `patterns` (system pattern ids: realtime, longrunning, contention, scaling-reads,
  scaling-writes, blobs, multistep, proximity).
- `suggests` (2–5 lesson ids, any from the tables above).
- `brief`: what the interviewer says, deliberately under-specified, 1–3 sentences.

**Every low-level design (`kind: 'lld'`) walkthrough** has these headings, in order:

1. `Requirements`
2. `Core objects`
3. `Classes and relationships` (a `classes` figure)
4. `Key methods` (`code`: TypeScript signatures and the 1–2 most interesting method
   bodies)
5. `Patterns and extensibility` (which object patterns and why, with a `codeCompare` or
   `code`)
6. `Concurrency and edge cases` (a `sequence` figure where a race matters)

LLD `patterns` use object-pattern ids from the list above. Same `followups`, `rubric` and
`suggests` rules apply, and `suggests` should name the principles/patterns/lld lessons.

**existing** author edits the 10 existing problems: bitly, dropbox, rate-limiter,
ticketmaster, news-feed, whatsapp, youtube, web-crawler, ad-click, uber.
- Re-head each walkthrough to the hld skeleton above. Rename and split the headings, and
  move content so it sits under the right one ("Entities and API" becomes "Core entities"
  and "API"; "The bottleneck" folds into "High-level design"; "The three follow-ups"
  becomes part of `followups`).
- Keep the existing prose. Add only what is missing (a short `API` code block, a
  high-level figure if absent).
- Add `followups` (3–5).
- Don't change ids, rubric ids or difficulty.
- The validator won't enforce the skeleton on these until the lead removes their
  `LENIENT_PROBLEMS` entry in `src/content/index.ts`. **You may edit only that one
  constant in index.ts**, removing each id as you finish it.

## Working rules

- Your working directory is a **git worktree** of the repo. First run
  `test -e node_modules || ln -s /home/mark/projects/system-design-journey/node_modules node_modules`.
- Edit **only** your files: your modules or problem files, your group file, your
  glossary file (and `patterns-object.ts` for designPatterns2, or the 10 problem files
  plus the LENIENT constant for existing).
- Never edit `glossary.ts`, `validate.ts`, `types.ts`, other authors' files, or anything
  outside `src/content/`.
- Check your work until both are clean:
  - `npx vitest run src/content/` must pass. `checkCurriculum()` lists every issue. Fix
    all that name your units.
  - `npx tsc --noEmit -p tsconfig.app.json` must print nothing.
- Commit your files on your worktree branch when done:
  `git add -A && git commit -m "content: <what>"`.
- **Report back** (≤ 200 words):
  - the branch name and the worktree path
  - the files you wrote
  - glossary ids you added
  - words that need `ALLOWED`
  - anything you could not resolve
