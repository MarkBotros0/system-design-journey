import type { Problem } from '../types'

export const jobScheduler: Problem = {
  id: 'job-scheduler',
  title: 'Design a distributed job scheduler',
  kind: 'hld',
  category: 'infra',
  difficulty: 'medium',
  brief:
    'Teams across the company need to run jobs on a schedule — every night at 2am, every five minutes, or once, three days from now. Design the service that runs them.',
  patterns: ['longrunning', 'contention'],
  suggests: ['c-queues', 'a-longrunning', 'a-contention', 'd-delivery'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Separated the job definition from its runs, with one run record per firing' },
    { id: 'r2', bar: 'must', criterion: "Kept schedules in a durable store, not in a scheduler's memory" },
    { id: 'r3', bar: 'must', criterion: 'Put a queue between deciding a run is due and executing it' },
    { id: 'r4', bar: 'must', criterion: 'Promised at-least-once, not exactly-once, and required idempotent handlers' },
    { id: 'r5', bar: 'senior', criterion: 'Found due runs with a time-bucketed index instead of scanning every job' },
    { id: 'r6', bar: 'senior', criterion: 'Claimed runs with a lease or visibility timeout, extended by heartbeats' },
    { id: 'r7', bar: 'senior', criterion: 'Retried with capped exponential backoff and jitter, then a dead-letter queue' },
    { id: 'r8', bar: 'senior', criterion: 'Separated priorities so urgent runs stay fast and low-priority runs still progress' },
    { id: 'r9', bar: 'staff', criterion: 'Fenced stale lease holders so a paused worker cannot overwrite the real result' },
    { id: 'r10', bar: 'staff', criterion: 'Spread the top-of-the-hour spike with sharded buckets and hashed schedule offsets' },
    { id: 'r11', bar: 'staff', criterion: 'Defined misfire, overlap and time-zone policies for recurring jobs' },
    { id: 'r12', bar: 'staff', criterion: 'Chose schedule lag as the health signal, with a canary job to prove it' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'prose',
      text: 'Ask what a "job" is before anything else, because the answer decides whether you are building a scheduler or a compute platform. Assume the platform already exists: a job is a handler name plus a payload, and a fleet of workers knows how to run handlers. Your system decides **when** a job runs, and makes sure it **does**.',
    },
    {
      kind: 'list',
      items: [
        'Users should be able to schedule a job — once at a given time, or on a recurring cron expression — with a payload, a priority and a retry policy.',
        'Users should be able to see every run of a job — queued, running, succeeded, failed — with its attempts.',
        'Users should be able to pause, resume or cancel a job, and re-run a failed run.',
        'Out of scope: dependencies between jobs (that is a workflow engine such as Airflow), and the compute platform the handlers run on.',
      ],
    },
    { kind: 'prose', text: 'Non-functional, with numbers:' },
    {
      kind: 'list',
      items: [
        '**Scale**: 10 million recurring jobs, plus about a billion one-off runs a day — delayed emails, reminders, retries. The one-offs alone are around 12,000 runs a second on average.',
        '**Spikes**: at the top of every hour, everything written as `0 * * * *` fires at once. If a tenth of the recurring jobs are written that way, a million runs fall due in the same second — spread over a few seconds of allowed lag, still a couple of hundred thousand a second, more than fifteen times the average.',
        '**Timeliness**: a run starts within a few seconds of its scheduled time at p99. Seconds, not milliseconds.',
        '**Reliability**: a scheduled run is never silently skipped, and survives the loss of any machine. Running twice is tolerable; never running is not.',
        '**Duration**: runs last anywhere from milliseconds to an hour.',
      ],
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'No distributed scheduler can promise exactly-once execution, so I won\'t pretend to. I\'ll guarantee at-least-once and hand every run a stable id the handler can use as an idempotency key. At-least-once plus idempotency is what "exactly once" means in practice.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'list',
      items: [
        '**Job** — the definition: handler, payload, schedule (a cron expression and time zone, or a single run time), priority, retry policy, owner.',
        '**Run** — one firing of a job at one scheduled time, with a status and an attempt count. Its id is derived from `jobId + scheduledTime`, so creating it twice is harmless.',
        '**Lease** — a worker\'s time-limited claim on a run, with a version number that goes up on every claim.',
        '**Worker** — a process that claims runs, executes the handler, heartbeats and reports back.',
      ],
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'prose',
      text: 'A public [[API]] for teams, and a narrow internal one for workers:',
    },
    {
      kind: 'code',
      code: `POST   /jobs  { handler, payload, priority,
                schedule: { cron: "0 2 * * *", tz: "Europe/London" }
                        | { runAt: "2026-11-21T09:00:00Z" },
                retry: { max: 5, backoff: "exponential" } }
                                        -> 201 { jobId }
GET    /jobs/{jobId}/runs?status=failed -> Run[]
PATCH  /jobs/{jobId}  { state: "paused" | "active" }
DELETE /jobs/{jobId}
POST   /runs/{runId}/retry              -> 202

# internal, for workers
POST   /runs/claim  { queue, max }      -> Run[] with leases
POST   /runs/{runId}/heartbeat { leaseVersion }
POST   /runs/{runId}/complete  { leaseVersion, ok | error }`,
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'Schedules become rows, rows become queue messages when they fall due, and workers lease them.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Job API', sub: 'writes the job and its next run', to: 'insert' },
          { label: 'Run store', sub: 'partitioned by time bucket', tone: 'line', to: 'due now' },
          { label: 'Dispatchers', sub: 'each owns some bucket shards', to: 'enqueue' },
          { label: 'Ready queues', sub: 'one per priority', to: 'claim, lease' },
          { label: 'Workers', sub: 'run, heartbeat, complete', tone: 'mastered' },
        ],
        note: 'A recurring job is never a loop in memory. Each firing creates the next run as a row, so the schedule survives any crash.',
      },
    },
    {
      kind: 'prose',
      text: '**Scheduling a job.** The API validates the cron expression, computes the first fire time in the job\'s own time zone, converts it to [[UTC]], and writes the job and its first run in one transaction. A one-off job is simply a run with no successor.',
    },
    {
      kind: 'prose',
      text: '**Firing.** Dispatchers read the runs that are due, push them onto a ready queue and mark them queued. For a recurring job, marking run *n* queued and inserting run *n + 1* — the next occurrence of its cron expression — happen in one transaction, so a dispatcher that crashes between the two cannot silently end the schedule; and because run ids are derived from job and time, redoing it after a crash is harmless. Pausing flips the job\'s state, and dispatchers check it at fire time, so the run already waiting is skipped and no successor is created.',
    },
    {
      kind: 'prose',
      text: '**Running.** Workers claim runs from the queue under a lease, heartbeat while they work, and report the result. A failure schedules a retry as a new attempt in the run store, at a future time. Workers never sleep on a retry.',
    },
    {
      kind: 'prose',
      text: '**Reading status** is a query on runs by job id, served from a secondary index or a separate history table, so it never competes with the dispatch scan.',
    },
    {
      kind: 'prose',
      text: 'The bottlenecks: **finding due runs** among a billion without scanning them, the **top-of-the-hour spike**, **two workers running the same run**, and **a flood of low-priority work** starving everything else.',
    },

    { kind: 'heading', text: 'Deep dive 1 — finding due runs: the time-bucketed queue' },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Poll the jobs table every second',
          text: '`WHERE next_run_at <= now()` on a table of a billion rows, from several schedulers at once. The index is hammered by both the scan and the updates, and two schedulers that read the same rows dispatch them twice.',
        },
        {
          grade: 'good',
          title: 'A sorted set in Redis, scored by run time',
          text: '`ZRANGEBYSCORE` returns what is due, and a Lua script removes it atomically. Fast, and exactly how Sidekiq stores scheduled jobs. But the whole schedule has to fit in memory, one key is one hot spot, and durability is whatever Redis persistence gives you.',
        },
        {
          grade: 'great',
          title: 'Time-bucketed partitions in a durable store',
          text: 'Key each run by its minute and a shard: partition key `2026-11-21T09:00#3`, sort key `runAt#runId`. A dispatcher reads only the current minute of the shards it owns, with one range query each. The top-of-the-hour spike is spread over every shard. Expiry should be cheap too: in Cassandra a [[TTL]] with time-window compaction drops old buckets as whole files; in DynamoDB, which deletes expired items one by one, use a table per day and drop it.',
        },
        {
          grade: 'best',
          title: 'Buckets on disk, the next minute in memory',
          text: 'A minute ahead, each dispatcher loads its next bucket into an in-memory timing wheel — the structure Kafka uses for its own delayed operations — and fires each run on the second. The store stays the durable record; memory is only the precise clock. If a dispatcher dies, another takes over its shards and reloads anything not yet marked queued.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'Runs bucketed by minute and shard: the spike is divided, and the next minute is already in memory.',
      figure: {
        kind: 'grid',
        cols: 4,
        cells: [
          { label: '09:59 · s0', tone: 'mastered' },
          { label: '09:59 · s1', tone: 'mastered' },
          { label: '09:59 · s2', tone: 'mastered' },
          { label: '09:59 · s3', tone: 'mastered' },
          { label: '10:00 · s0', tone: 'streak' },
          { label: '10:00 · s1', tone: 'streak' },
          { label: '10:00 · s2', tone: 'streak' },
          { label: '10:00 · s3', tone: 'streak' },
          { label: '10:01 · s0', tone: 'line' },
          { label: '10:01 · s1', tone: 'line' },
          { label: '10:01 · s2', tone: 'line' },
          { label: '10:01 · s3', tone: 'line' },
        ],
        legend: [
          { tone: 'mastered', label: 'dispatched' },
          { tone: 'streak', label: 'firing now — the 10:00 spike, split four ways' },
          { tone: 'line', label: 'preloaded into memory' },
        ],
        note: 'Each column is a shard owned by one dispatcher. No single partition carries the whole top of the hour.',
      },
    },
    {
      kind: 'prose',
      text: 'Pick the bucketed store with a one-minute preload. It is durable, it scales by adding shards, and it fires on time without polling a database every second. Assign shards to dispatchers with a lease of their own, held in etcd or ZooKeeper, so each shard has one owner at a time.',
    },

    { kind: 'heading', text: 'Deep dive 2 — claiming a run: leases and at-least-once' },
    {
      kind: 'prose',
      text: 'A worker takes a run and might crash, hang, or just be slow. The system has to tell those apart — or, since it often cannot, survive not knowing.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Mark it running and hope',
          text: 'The worker dies and the run says "running" forever. Nobody notices until the report that should have gone out on Monday is asked about on Thursday.',
        },
        {
          grade: 'good',
          title: 'Hold a database row lock while it runs',
          text: '`SELECT … FOR UPDATE SKIP LOCKED` claims cleanly, and the lock is released if the connection dies. But holding a transaction open for an hour-long job ties up a connection per running job, and a few thousand concurrent runs exhaust the database.',
        },
        {
          grade: 'great',
          title: 'A lease with a visibility timeout',
          text: 'Claiming sets `leased_until = now + 30s` in one conditional write, and the worker heartbeats every 10 seconds to extend it. If the worker dies, the lease lapses and the run becomes claimable again — the same model as an [[SQS]] visibility timeout. This is at-least-once: a slow worker and its replacement can both run the job.',
        },
        {
          grade: 'best',
          title: 'A lease with a fencing token, and idempotent handlers',
          text: 'Each claim increments a lease version, and every heartbeat and completion must carry it. A worker that stalled past its lease and wakes up is refused, so it cannot overwrite the real result. The run id goes to the handler as an idempotency key for its own side effects — the way Stripe\'s idempotency keys make a retried charge safe.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'A lease that lapses, a second worker that takes over, and a fencing token that stops the first.',
      figure: {
        kind: 'timeline',
        ticks: ['0 s', '30 s', '60 s', '90 s'],
        lanes: [
          {
            label: 'Worker A, lease version 1',
            bars: [
              { from: 0, to: 0.333, label: 'running', tone: 'line' },
              { from: 0.333, to: 0.778, label: 'stalled', tone: 'streak' },
            ],
            outcome: { label: 'late result refused', tone: 'alert' },
          },
          {
            label: 'Worker B, lease version 2',
            bars: [{ from: 0.667, to: 1, label: 'running', tone: 'mastered' }],
            outcome: { label: 'completes', tone: 'mastered' },
          },
        ],
        note: 'A\'s last heartbeat, at 30 s, bought it a lease until 60 s. B claims at 60 s with version 2, so when A wakes at 70 s its version-1 result is rejected.',
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Assuming a worker that missed its heartbeat is dead. It may be paused, partitioned or just slow, and it will wake up and carry on. Unless its writes are fenced and the handler is idempotent, you get two charges, two emails, two of whatever the job does.',
    },

    { kind: 'heading', text: 'Deep dive 3 — retries, priorities and fairness' },
    {
      kind: 'prose',
      text: 'Retries: exponential backoff with jitter, capped — 10 s, 20 s, 40 s and so on up to 10 minutes, each randomised by ±20% so a thousand failures do not retry in lockstep. After the maximum attempts the run goes to a [[DLQ]] and the owner is told. Each retry is a new attempt written back into the run store at its future time, so it survives restarts and no worker sits holding it. Separate retryable failures (timeouts, 503s) from permanent ones (a malformed payload), and never retry the second kind.',
    },
    {
      kind: 'compare',
      left: {
        title: 'One queue, sorted by priority',
        points: [
          'Simple: workers always take the most urgent run',
          'Low priority starves whenever high priority is busy',
          'A flood of urgent runs from one team delays everyone else\'s urgent runs too',
        ],
      },
      right: {
        title: 'A queue per priority, polled by weight',
        points: [
          'Workers poll high, normal and low in a fixed ratio — say 70 : 25 : 5',
          'Low priority is slow under load, but never stops',
          'Per-team concurrency caps inside each queue stop one team\'s backfill from owning the fleet',
        ],
      },
      verdict: 'A queue per priority with weighted polling, plus per-team caps. Priority decides urgency; fairness between teams needs its own mechanism.',
    },
    {
      kind: 'figure',
      caption: 'Weighted polling: low priority gets a small share of the fleet, never none.',
      figure: {
        kind: 'ratio',
        parts: [
          { label: 'High priority', value: 70, tone: 'line' },
          { label: 'Normal', value: 25, tone: 'neutral' },
          { label: 'Low', value: 5, tone: 'neutral' },
        ],
        note: 'This is the split when all three queues have work. An empty queue\'s share goes to the others.',
      },
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Jenkins lets a cron field be written as `H`: `H * * * *` means "once an hour, at a minute derived from this job\'s name". Thousands of hourly jobs spread themselves across the hour instead of all firing at :00. Offer the same: any job that does not truly need :00 gets a stable, hashed offset, and most of the top-of-the-hour spike disappears.',
    },
  ],
  followups: [
    {
      q: 'The dispatchers were down for ten minutes. What happens to the runs they missed?',
      a: 'Nothing is lost — they are rows, still sitting in their buckets. On recovery a dispatcher resumes from its last checkpointed bucket, not from now. Then each job\'s misfire policy decides: run every missed occurrence, run once to catch up, or skip anything older than a deadline, which is what Kubernetes CronJob calls `startingDeadlineSeconds`.',
    },
    {
      q: "Last night's 2am run is still going when tonight's 2am arrives.",
      a: 'Every recurring job needs an overlap policy: allow both, skip the new run, or cancel the old one. Kubernetes CronJob\'s `concurrencyPolicy` is exactly that — Allow, Forbid, Replace. Default to skipping, because two copies of a batch job writing the same tables is a classic way to corrupt a report, and tell the owner, because a nightly job running for a day is a problem in itself.',
    },
    {
      q: 'A job is scheduled for 1:30am, London time. What happens on the nights the clocks change?',
      a: 'In March London jumps from 1:00 to 2:00, so 1:30 never happens; in October 1:00 to 2:00 happens twice. So compute every fire time in the job\'s own time zone and store it in UTC, and write the policy down: Vixie cron, for example, runs skipped jobs as soon as the clock jumps and refuses to run repeated ones twice. Test both nights — and for infrastructure jobs, suggest scheduling in UTC and avoiding the question entirely.',
    },
    {
      q: 'One team enqueues 50 million runs for a backfill.',
      a: 'Accept it, but do not let it take the fleet. It goes to the low-priority queue under a per-team concurrency cap, so other teams keep their normal latency and the backfill simply takes longer. Rate-limit job creation at the API too, so a runaway script cannot write a billion rows before anyone notices.',
    },
    {
      q: 'How do you know the scheduler itself is healthy?',
      a: 'Measure schedule lag — actual start minus scheduled time — at p99 per priority, and alert on it; it is the number users feel. Add a canary job that runs every minute and records how late it was, so a silently stuck dispatcher shows up within a minute. Queue depth and the age of the oldest unclaimed run are the leading indicators; machine metrics are not.',
    },
  ],
}
