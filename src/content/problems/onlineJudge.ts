import type { Problem } from '../types'

export const onlineJudge: Problem = {
  id: 'online-judge',
  title: 'Design LeetCode',
  kind: 'hld',
  category: 'infra',
  difficulty: 'medium',
  brief:
    'Users solve coding problems in the browser, submit code in a choice of languages, and get a verdict. Every week there is a contest where tens of thousands of people compete at once on a live leaderboard.',
  patterns: ['longrunning', 'realtime'],
  suggests: ['a-longrunning', 'c-queues', 'a-realtime', 'o-security'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Made submission asynchronous: store, enqueue, return, then poll or push the verdict' },
    { id: 'r2', bar: 'must', criterion: 'Ran every submission in an isolated sandbox with no network access' },
    { id: 'r3', bar: 'must', criterion: 'Enforced time and memory limits and mapped breaches to verdicts' },
    { id: 'r4', bar: 'must', criterion: 'Kept submissions and verdicts in a durable store, separate from the queue' },
    { id: 'r5', bar: 'senior', criterion: 'Named the container mechanisms — namespaces, cgroups, seccomp — and their limit, the shared kernel' },
    { id: 'r6', bar: 'senior', criterion: 'Chose gVisor or a microVM for a stronger boundary, on judge hosts that hold no secrets' },
    { id: 'r7', bar: 'senior', criterion: 'Built the leaderboard on a sorted set, with the tie-break encoded in the score' },
    { id: 'r8', bar: 'senior', criterion: 'Measured CPU time rather than wall-clock time, so verdicts are fair' },
    { id: 'r9', bar: 'staff', criterion: 'Pre-scaled for the published contest start instead of reacting to it' },
    { id: 'r10', bar: 'staff', criterion: 'Kept warm sandbox pools and cached test data to cut per-run overhead' },
    { id: 'r11', bar: 'staff', criterion: 'Treated the leaderboard as a derived view that can be rebuilt after a rejudge' },
    { id: 'r12', bar: 'staff', criterion: 'Prioritised contest traffic and capped in-flight submissions per user' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'prose',
      text: 'Under the product sits one unusual requirement: **you are running hostile code on purpose**. Most systems defend against their users at the edges; this one invites them to execute arbitrary programs on its machines. Say that first, because it is the requirement that shapes everything else.',
    },
    {
      kind: 'list',
      items: [
        'Users should be able to read a problem and submit a solution in one of several languages.',
        'Users should be able to get a verdict within seconds: accepted, wrong answer, time or memory limit exceeded, runtime or compile error.',
        'Users should be able to compete in a timed contest and watch a live leaderboard.',
        'Out of scope: the in-browser editor, discussion, problem authoring, and plagiarism detection (raise it at the end).',
      ],
    },
    { kind: 'prose', text: 'Non-functional, with numbers:' },
    {
      kind: 'list',
      items: [
        '**Isolation**: submitted code can never reach the network, another submission, the expected outputs or the host. Not negotiable.',
        '**Latency**: a verdict in under 5 seconds normally; under 30 seconds at a contest peak, with honest status shown while it waits.',
        '**Contest scale**: 50,000 contestants, four problems, a few submissions each — about 600,000 submissions in 90 minutes, peaking around 1,000 a second in the first minutes and again near the end.',
        '**Fairness**: the same code gets the same verdict every time. A noisy neighbour must never turn an accepted solution into a timeout.',
        '**Leaderboard**: ranks update within a few seconds, and everyone can read them at once.',
      ],
    },
    {
      kind: 'prose',
      text: 'Capacity: at 1,000 submissions a second, each needing about 2 seconds of [[CPU]] across its test cases, you need around 2,000 sandboxes running at once — about 250 eight-core machines. Outside contests you need a fraction of that, which is the first hint about autoscaling.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'I\'ll treat every submission as an attacker: a fresh sandbox per run, no network, a read-only filesystem, hard caps on CPU, memory and processes, on machines that hold no secrets. Then I\'ll make it fast.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'list',
      items: [
        '**Problem** — statement, time and memory limits, and hidden test cases kept in blob storage.',
        '**Submission** — user, problem, language, code, status, verdict, runtime and memory used.',
        '**Contest** — start and end times, problems and scoring rules.',
        '**Leaderboard entry** — one contestant\'s score and penalty time in one contest.',
      ],
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'prose',
      text: 'Submitting is asynchronous: the [[API]] accepts the code and returns at once.',
    },
    {
      kind: 'code',
      code: `GET  /problems/{id}               -> Problem  (no hidden tests)

POST /problems/{id}/submissions
     { language: "python3", code, contestId? }
                                  -> 202 { submissionId }

GET  /submissions/{id}            -> { status: "queued" | "running"
                                       | "done", verdict, runtimeMs,
                                       memoryKb }

GET  /contests/{id}/leaderboard?page=1
                                  -> [{ rank, user, score, penalty }]
GET  /contests/{id}/leaderboard/me -> { rank, score, penalty }`,
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'Submit, queue, judge in a sandbox, record — and the code never touches a machine that holds data.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Client', sub: 'submits, then polls', to: 'POST' },
          { label: 'Submission service', sub: 'store, enqueue, 202', to: 'enqueue' },
          { label: 'Queue', sub: 'per language, contest first', tone: 'line', to: 'pull' },
          { label: 'Judge workers', sub: 'a fresh sandbox per run', to: 'verdict' },
          { label: 'Results', sub: 'Postgres · Redis leaderboard', tone: 'mastered' },
        ],
        note: 'The submission service never runs code, and the judge workers hold no credentials beyond the queue and a narrow results endpoint.',
      },
    },
    {
      kind: 'prose',
      text: '**Reading a problem** is a cacheable read. Statements barely change, so they sit behind the [[CDN]].',
    },
    {
      kind: 'prose',
      text: '**Submitting** writes the code and a `queued` submission row, puts the submission id on that language\'s queue, and returns 202. A per-user limit — one submission in flight, a few a minute — stops a script flooding the queue.',
    },
    {
      kind: 'prose',
      text: '**Judging.** A worker pulls the id, fetches the code and the problem\'s test data — cached on the worker, since a problem\'s tests can run to many megabytes and every contestant needs the same ones — compiles, runs each test inside the sandbox, compares the output, and writes the verdict. It stops at the first failing test.',
    },
    {
      kind: 'prose',
      text: '**Getting the verdict.** The client polls `GET /submissions/{id}` every second or so, answered from Redis rather than Postgres. [[SSE]] is the upgrade if you want to stream progress test by test.',
    },
    {
      kind: 'prose',
      text: '**The leaderboard** updates when a contest submission is accepted. The bottlenecks to name: **sandbox start-up time**, the **contest-start spike**, and **leaderboard reads** from everyone refreshing at once.',
    },

    { kind: 'heading', text: 'Deep dive 1 — running untrusted code' },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Run it as a process on the worker',
          text: 'One submission runs `rm -rf /`, another forks until the machine dies, a third reads the expected outputs off disk and is accepted on everything. One user owns your judge.',
        },
        {
          grade: 'good',
          title: 'A locked-down container per run',
          text: 'Namespaces give the code its own view of processes and files; cgroups cap CPU, memory and process count. Add `--network none`, a read-only root filesystem, a non-root user, and a seccomp profile that blocks dangerous system calls. A real boundary — but every container shares the host\'s kernel, and one kernel bug is an escape.',
        },
        {
          grade: 'great',
          title: 'A user-space kernel, or a [[VM]] per run',
          text: 'gVisor intercepts system calls in user space, so the code never talks to the host kernel directly. Firecracker boots a minimal virtual machine with its own kernel in about 125 ms — it is what runs [[AWS]] Lambda. An exploit now lands in a kernel that guards nothing.',
        },
        {
          grade: 'best',
          title: 'Defence in depth, on machines with nothing to steal',
          text: 'Container limits inside a gVisor or Firecracker boundary, on judge hosts with no credentials, no route to the database and no network egress. Each sandbox is used once and thrown away, and a pool of pre-booted ones per language hides the start-up cost. Even a full escape finds an empty machine that is about to be recycled.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'Defence in depth for a single run. Each layer assumes the one above it has already failed.',
      figure: {
        kind: 'stack',
        layers: [
          { label: 'Submitted code', sub: 'assume hostile', tone: 'alert' },
          { label: 'Runtime as non-root', sub: 'no privileges' },
          { label: 'seccomp and cgroups', sub: 'syscalls, CPU, memory' },
          { label: 'gVisor or Firecracker', sub: 'a kernel of its own', tone: 'line' },
          { label: 'Judge host', sub: 'no secrets, no egress', tone: 'mastered' },
        ],
        note: 'An attacker has to break every layer in turn, and the prize at the bottom is a machine with nothing on it.',
      },
    },
    {
      kind: 'prose',
      text: 'Measure **CPU time, not wall-clock time**, from the cgroup\'s own accounting, so a busy neighbour cannot push a correct solution over its limit. Keep a wall-clock cap too, a few times the limit, to catch code that sleeps or deadlocks. And cap output size, or one infinite print loop fills the disk.',
    },

    { kind: 'heading', text: 'Deep dive 2 — the queue and the contest-start spike' },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Judge inside the request',
          text: 'The [[HTTP]] request is held for seconds while the API server runs untrusted code: slow for the user, and hostile code on the machines that reach your data. At contest start the API servers saturate, and even loading the problem page fails.',
        },
        {
          grade: 'good',
          title: 'A queue and a fixed pool of workers',
          text: 'The API returns 202 and workers pull at their own pace. The spike becomes a backlog instead of an outage — but a pool sized for a normal Tuesday means a ten-minute wait at the start of every contest.',
        },
        {
          grade: 'great',
          title: 'Autoscale on queue depth, with warm sandboxes',
          text: 'Scale on the backlog and the age of the oldest queued submission, not on CPU, which lags. Keep pre-booted sandboxes per language so a run never pays a cold start.',
        },
        {
          grade: 'best',
          title: 'Pre-scale for the contest, and prioritise it',
          text: 'A contest starts at a published time, so scale the fleet up ten minutes before and back down after. Contest submissions get their own higher-priority queue so practice traffic cannot slow them, each user gets one submission in flight, and every run stops at its first failed test.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'The same contest-start spike, met reactively and met on schedule.',
      figure: {
        kind: 'timeline',
        ticks: ['T − 10 min', 'T − 5', 'start', '+5', '+10'],
        lanes: [
          {
            label: 'Reactive autoscaling',
            bars: [
              { from: 0, to: 0.5, label: 'normal fleet', tone: 'neutral' },
              { from: 0.5, to: 0.8, label: 'backlog', tone: 'alert' },
            ],
            outcome: { label: 'minutes of waiting', tone: 'alert' },
          },
          {
            label: 'Pre-scaled at T − 10',
            bars: [
              { from: 0, to: 0.5, label: 'warm and idle', tone: 'line' },
              { from: 0.5, to: 0.8, label: 'absorbed', tone: 'mastered' },
            ],
            outcome: { label: 'seconds of waiting', tone: 'mastered' },
          },
        ],
        note: 'In the first lane, new machines are still booting while the queue grows. Ten minutes of idle machines is the whole price of the second.',
      },
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'The contest start time is on a calendar days in advance. Scaling reactively to a spike you can read off the calendar is choosing to make people wait.',
    },

    { kind: 'heading', text: 'Deep dive 3 — the live leaderboard' },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Sort the submissions table on every view',
          text: '`ORDER BY score DESC, penalty` across 50,000 contestants, for every one of them refreshing every few seconds, on the same database the judges write verdicts to.',
        },
        {
          grade: 'good',
          title: 'Recompute the board every 30 seconds and cache it',
          text: 'Cheap and stable. But it is stale, and "what is my rank?" for contestant 31,457 means scanning the cached list.',
        },
        {
          grade: 'great',
          title: 'A Redis sorted set per contest',
          text: '`ZADD` on every accepted submission; `ZREVRANGE` for the top page in O(log n + 50); `ZREVRANK` for any one contestant\'s rank in O(log n). Encode the tie-break in the score — more points first, then less penalty — as points × 1,000,000 minus penalty seconds.',
        },
        {
          grade: 'best',
          title: 'The sorted set as a view, Postgres as the record',
          text: 'Verdicts in Postgres are the source of truth; the sorted set is derived from them and can be rebuilt at any time — which you will need the first time a test case is fixed mid-contest and every submission is rejudged. Cache the top page for a second or two and serve it to everyone, so fifty thousand refreshes cost one read.',
        },
      ],
    },
    {
      kind: 'code',
      caption: 'Points dominate; within equal points, less penalty ranks higher.',
      code: `# on an accepted submission: recompute this contestant's score
ZADD contest:42 <points*1000000 - penaltySecs> user:9

ZREVRANGE contest:42 0 49 WITHSCORES     # the top 50
ZREVRANK  contest:42 user:9              # my rank, 0-based`,
    },
  ],
  followups: [
    {
      q: 'How would you catch cheating?',
      a: 'Mostly after the contest, not during it. Fingerprint every accepted submission per problem — normalise identifiers and whitespace, hash overlapping windows of tokens — and flag pairs that share far more fingerprints than chance allows, for a human to review. Watch for accounts that solve hard problems in implausibly short times. Blocking in real time risks punishing honest people for writing the obvious solution.',
    },
    {
      q: 'A test case turns out to be wrong in the middle of a contest.',
      a: 'Fix the test, then rejudge every submission to that problem at high priority; the sandboxes are stateless, so this is just more queue entries. Because the leaderboard is derived from verdicts in Postgres, you rebuild it from the new verdicts rather than patching scores by hand. Announce it — contestants notice ranks moving.',
    },
    {
      q: 'How do you make timing fair?',
      a: 'Measure CPU time from cgroup accounting rather than wall time, pin each run to dedicated cores, and keep judge hardware identical within a pool. Give slower languages a published time multiplier rather than pretending Python and C++ are equal. Before reporting a time-limit failure that missed by only a few percent, re-run it once on a quiet core.',
    },
    {
      q: 'Polling, or a push channel for the verdict?',
      a: 'Polling once a second is fine for a verdict that takes a few seconds: it is stateless, cacheable and survives reconnects. In a contest, though, 50,000 people polling is 50,000 requests a second for data that rarely changes — so answer from Redis, back off the interval, or switch contests to SSE, which pushes once when the verdict lands.',
    },
    {
      q: 'How do you add a new language?',
      a: 'A language is a sandbox image with its compiler and runtime, plus a spec: how to compile, how to run, its time multiplier and memory overhead. Workers are generic, so adding one means building an image, pre-pulling it onto the fleet and adding a queue — no change to the judge. Pre-pulling matters: a multi-gigabyte image downloading at contest start is an outage of its own.',
    },
  ],
}
