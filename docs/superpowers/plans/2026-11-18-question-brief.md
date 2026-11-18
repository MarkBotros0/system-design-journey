# Question bank — author brief

You are writing quick revision questions for Throughput's question bank. A learner answers
them one-handed on a commute or between meetings, often days after reading the lesson. A
question may be hard; **answering** it must be quick: a tap, a few taps, or pairing items.

Read first: `CLAUDE.md` (the repo guide), `src/content/types.ts` (the `Question` union, at the
end), and `validateQuestions` in `src/content/validate.ts`. Read every lesson you cover in
full before writing its questions.

## Your file

You own exactly one file, `src/content/bank/<your-key>.ts`, which already exists as a stub
exporting `export const questions: Question[] = []`. Fill that array and touch nothing else.
The exception: if you genuinely need a new glossary term, add it to the matching file in
`src/content/glossary/`, with a figure, and say so in your report.

| Key | Lessons |
|---|---|
| `foundations-interview` | f-what, f-network, f-api, f-db, f-storage, f-cache, f-scale · i-room, i-recognition, i-star, i-influence, i-failure |
| `principles-lld` | p-oop, p-coupling, p-srp-ocp, p-lsp-isp, p-dip, p-simplicity, p-clean · l-round, l-modelling, l-extension, l-concurrency |
| `design-patterns` | dp-intro, dp-factory, dp-builder-singleton, dp-adapter-facade-proxy, dp-decorator-composite, dp-strategy-state, dp-observer, dp-command-template-chain, dp-anti |
| `core` | c-framework, c-requirements, c-modelling, c-caching, c-sharding, c-cap, c-queues, c-search |
| `databases` | db-er, db-normalization, db-acid, db-isolation, db-engines, db-locking, db-replication, db-choosing, db-nosql-modelling |
| `distributed-production` | d-failure, d-consistency, d-consensus, d-time, d-transactions, d-delivery, d-resilience · o-observability, o-slo, o-auth, o-security, o-deploy |
| `architecture-applied` | ar-monolith, ar-events, ar-cqrs, ar-api, ar-edge · a-realtime, a-longrunning, a-contention, a-reads, a-writes, a-blobs, a-multistep, a-proximity |

## How many, and which kinds

Per lesson, **4 questions**: 2 `truefalse`, 1 `multi`, 1 `match`. Spread them across
different sections of the lesson. Lessons already have three `single` questions in their
`quiz`, and those are in the bank too, so **do not repeat what the quiz asks** and do not
write `single` questions.

## Shape

```ts
{
  id: 'c-cap-tf1',            // <moduleId>-<tf1|tf2|multi|match> — stable forever
  kind: 'truefalse',
  moduleId: 'c-cap',
  section: 'It is per-path, not per-system', // EXACT text of a heading in that lesson
  prompt: 'A booking system can be strongly consistent for the seat write and eventually consistent for search.',
  answer: true,
  explain: 'Consistency is chosen per path. Stale search costs nothing; a stale seat sells it twice.',
}
```

- `section` is required. Copy a heading's text exactly as it appears in the lesson,
  including any `**`, `` ` `` or `[[…]]` markup. The validator checks it exists, and the
  app deep-links "Learn more" to it.
- `multi`: 4–6 `options`, `correct` lists at least two indexes but never all of them.
  The UI says "Select all that apply".
- `match`: 3–5 `pairs` of `{ left, right }`, unique on both sides. The `prompt` says what
  is being matched: "Match each isolation level to the anomaly it still allows."

## Writing rules

1. **Test understanding, not recall of a sentence.** Ask what happens, which to pick, what
   breaks, why. Prefer the trade-offs and failure modes a senior interviewer probes.
2. **True/false:** a single, unambiguous claim, never a question (no `?`). About half must be
   **false**. A good false statement is a common misconception stated confidently, not a
   claim made false by one sneaky word. No double negatives. If "not" carries the meaning,
   bold it: `**not**`.
3. **Multi:** every option plausible. Wrong options are real misconceptions, not filler. No
   "all of the above". Options read in parallel form.
4. **Match:** items that are genuinely confusable, so the matching takes thought. Keep each
   item short.
5. **Lengths, for a phone:**
   - `prompt` ≤ 220 characters.
   - Each option ≤ 90.
   - Each match item ≤ 60.
   - `explain` 1–2 sentences, ≤ 300 characters, saying *why*. For a false statement,
     say what is actually true.
6. **Markup:**
   - `prompt` and `explain` may use `**bold**`, `*emphasis*`, `` `code` `` and `[[ABBR]]`.
   - Options and match items may use **no `[[…]]`**, because they render as buttons. Plain
     words and backticks only.
7. **Abbreviations:** each question stands alone. If an abbreviation appears anywhere in a
   question (options and match items included), wrap it as `[[ABBR]]` at least once in that
   question's `prompt` or `explain`. Its glossary entry must exist (`src/content/glossary*`).
   Product names and ordinary words are exempt via `ALLOWED` in `validate.ts`; do not edit
   `ALLOWED`. Spell things out or list the word in your report instead.
8. British spelling, plain technical English, no exclamation marks, no emoji.
9. Accuracy over cleverness. If a claim depends on the system, say which ("in Postgres's
   default isolation level…").

## Before you report

Run, from your worktree:

```bash
npx tsc --noEmit -p tsconfig.app.json
npx vitest run src/content/
```

Both must be clean. Then commit on your branch with message `content: <key> bank questions`.

Report:
- branch, commit and worktree path
- the count per kind
- any glossary ids you added
- anything unresolved

Do not merge or push.
