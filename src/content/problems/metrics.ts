import type { Problem } from '../types'

export const metrics: Problem = {
  id: 'metrics',
  title: 'Design a metrics monitoring and alerting system',
  kind: 'hld',
  category: 'data',
  difficulty: 'hard',
  brief:
    'Every service in the company emits metrics — request counts, latencies, queue depths. Engineers want dashboards over them, and to be paged when something breaks. Design the system, like Datadog or Prometheus.',
  patterns: ['scaling-writes', 'scaling-reads'],
  suggests: ['a-writes', 'c-queues', 'f-storage', 'o-observability'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Modelled a series as a metric name plus tags, holding points of timestamp and value' },
    { id: 'r2', bar: 'must', criterion: 'Buffered ingestion with batching agents and a durable log such as Kafka' },
    { id: 'r3', bar: 'must', criterion: 'Rejected a row per point in a relational database, and explained why' },
    { id: 'r4', bar: 'must', criterion: 'Kept raw data briefly and served long ranges from rollups' },
    { id: 'r5', bar: 'senior', criterion: 'Compressed points into per-series chunks and quantified the bytes per point' },
    { id: 'r6', bar: 'senior', criterion: 'Indexed tags with posting lists so a filter does not scan every series' },
    { id: 'r7', bar: 'senior', criterion: 'Identified cardinality as the scaling limit and enforced series limits at ingestion' },
    { id: 'r8', bar: 'senior', criterion: 'Stored rollups as min, max, sum and count, with histograms for percentiles' },
    { id: 'r9', bar: 'staff', criterion: 'Evaluated alerts off the stream, independent of the dashboard query path' },
    { id: 'r10', bar: 'staff', criterion: 'Modelled alert state with a for-duration, deduplication and routing' },
    { id: 'r11', bar: 'staff', criterion: "Alerted on absent data, and built a dead man's switch for the pipeline itself" },
    { id: 'r12', bar: 'staff', criterion: 'Tiered old blocks to object storage, making retention a policy rather than a capacity limit' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'prose',
      text: 'Two systems share this question: a write-heavy store for numbers over time, and an alerting system that must be the most reliable thing in the building. Keep both in view from the start, because the second changes how you build the first.',
    },
    {
      kind: 'list',
      items: [
        'Services should be able to emit metrics — counters, gauges and histograms — each a name, a set of tags, a value and a timestamp.',
        'Engineers should be able to query and graph a metric over time, filtered and grouped by tags: p99 checkout latency by region over the last seven days.',
        'Engineers should be able to define an alert on a query and a condition, and be notified when it fires and when it resolves.',
        'Out of scope: logs and traces, the dashboard front end, and anomaly detection by [[ML]].',
      ],
    },
    { kind: 'prose', text: 'Non-functional, with numbers:' },
    {
      kind: 'list',
      items: [
        '**Ingestion**: 100 million active series reporting every 10 seconds — 10 million points a second, sustained.',
        '**Alert latency**: an alert fires within a minute of its condition becoming true.',
        '**Query latency**: a dashboard over the last hour renders in under a second; over a month, in a few seconds.',
        '**Retention**: 10-second resolution for 15 days, 1-minute for 90 days, 1-hour for two years.',
        '**Availability**: ingestion and alerting stay up when the rest of the company is down, because that is when they are needed.',
      ],
    },
    {
      kind: 'prose',
      text: 'Storage: a raw point is a timestamp and a float, 16 bytes. Ten million a second is 160 [[MB]]/s, about 14 [[TB]] a day uncompressed. Compressed the way Facebook\'s Gorilla does it — about 1.4 bytes a point — that falls to around 1.2 TB a day, so 15 days of raw data is under 20 TB before replication. Compression is not an optimisation here. It is what makes the design affordable.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'I\'ll put a durable buffer between ingestion and storage, and give alerting its own path off that buffer. If the storage tier is slow or down, alerts still fire — the monitoring system must not share a failure with the things it monitors.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'list',
      items: [
        '**Series** — a metric name plus one exact set of tags: `http.requests{service=checkout, region=eu-west-1, status=500}`. The unit of storage, of indexing, and of cost.',
        '**Point** — a timestamp and a value in one series.',
        '**Rollup** — a series downsampled to a coarser interval, keeping min, max, sum and count.',
        '**Alert rule** — a query, a condition, a duration ("for 5 minutes") and where to send it.',
        '**Alert state** — for each rule and each group it evaluates: OK, pending, firing or resolved, with history.',
      ],
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'prose',
      text: 'One endpoint per requirement in the [[API]]. Agents batch, so the write endpoint takes many points per call:',
    },
    {
      kind: 'code',
      code: `POST /v1/series                    (an agent's batch, every 10 s)
  [{ metric: "http.requests", type: "count",
     tags: { service: "checkout", region: "eu-west-1",
             status: "500" },
     points: [[1795000000, 42]] }, …]            -> 202

GET  /v1/query?q=sum:http.requests{status:500} by {region}
          &from=-1h&to=now&step=60s
       -> { series: [{ tags, points: [[ts, value], …] }] }

POST /v1/alerts  { query, condition: "> 50", for: "5m",
                   notify: ["pager:checkout-oncall"] }
       -> 201 { alertId }`,
    },

    { kind: 'heading', text: 'Data flow' },
    {
      kind: 'list',
      ordered: true,
      items: [
        'An agent on each host collects from local services, pre-aggregates — a thousand increments of one counter become one number — and flushes a batch every 10 seconds.',
        'Ingestion gateways authenticate, validate, enforce per-tenant limits, and append to Kafka, partitioned by series id so each series stays in order.',
        'Storage writers consume the log, append points to in-memory chunks per series, and periodically flush compressed blocks.',
        'Alert evaluators consume the same log, independently.',
        'A compactor rolls closed blocks up into 1-minute and 1-hour resolutions, and moves old blocks to object storage.',
        'The query service reads whichever resolution suits the requested range.',
      ],
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'The ingest pipeline: batched at the edge, buffered in a log, stored per series.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Agents', sub: 'batch and pre-aggregate', to: 'every 10 s' },
          { label: 'Ingest gateway', sub: 'auth, validation, limits', to: 'append' },
          { label: 'Kafka', sub: 'buffer, keyed by series', tone: 'line', to: 'consume' },
          { label: 'Time-series store', sub: 'memory → disk → object storage', to: 'read' },
          { label: 'Query service', sub: 'dashboards', tone: 'mastered' },
        ],
        note: 'Alert evaluators and the compactor are separate consumers of the same log, so a slow dashboard can never delay a page.',
      },
    },
    {
      kind: 'prose',
      text: '**Writes.** Agents pre-aggregate, so ten thousand requests on a host become one counter value per series per interval — the cheapest scaling you will ever do. Gateways are stateless and scale out. Kafka absorbs bursts and downstream outages: if the store stalls for ten minutes, points queue up rather than vanish.',
    },
    {
      kind: 'prose',
      text: '**Queries** go to a query service that parses the expression, finds the matching series in the tag index, fetches their chunks at the right resolution and aggregates. **Alerts** come off the stream, in deep dive 4.',
    },
    {
      kind: 'prose',
      text: 'The bottlenecks: **bytes per point** at 10 million points a second; the number of **distinct series**, which matters more than the number of points; **long-range queries** over raw data; and alert evaluation that must not depend on any of the above.',
    },

    { kind: 'heading', text: 'Deep dive 1 — storing time series' },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'A row per point in Postgres',
          text: 'Ten million inserts a second, and each row pays roughly 50 bytes of tuple header, pointer and index overhead to store 16 bytes of data. A month is tens of trillions of rows. It falls over on day one.',
        },
        {
          grade: 'good',
          title: 'A wide-column store, one partition per series per day',
          text: 'Cassandra or HBase with a column per timestamp — how OpenTSDB and KairosDB worked. Writes scale out, but every point still carries per-cell overhead, nothing exploits the shape of time-series data, and a query over ten thousand series reads ten thousand partitions.',
        },
        {
          grade: 'great',
          title: 'Compressed chunks per series',
          text: 'Hold each series\' recent points in memory, a couple of hours at a time, as Prometheus does. Encode timestamps as delta-of-delta — regular 10-second intervals make most of them zero, one bit each — and `XOR` each value with the previous one, which is mostly zeros for a slowly changing metric. Facebook\'s Gorilla paper reported about 1.37 bytes per point against 16 raw. A [[WAL]] protects the in-memory head.',
        },
        {
          grade: 'best',
          title: 'Compressed chunks, a tag index, and object storage behind',
          text: 'Add an inverted index from each tag value to the series that carry it, so `status=500 AND region=eu-west-1` is an intersection of two posting lists, not a scan. Flush closed two-hour blocks to local [[SSD]], then to object storage such as [[S3]] — the design behind Thanos, Cortex and Grafana Mimir. Storage becomes cheap enough that retention is a policy decision rather than a capacity crisis.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'Bytes per data point, three ways. The scale is logarithmic; the bill is not.',
      figure: {
        kind: 'scale',
        items: [
          { label: 'A row in Postgres', display: '≈ 50 B', value: 50, tone: 'alert' },
          { label: 'Raw timestamp and float', display: '16 B', value: 16, tone: 'streak' },
          { label: 'Gorilla-style compression', display: '≈ 1.4 B', value: 1.4, tone: 'mastered' },
        ],
        note: 'At 10 million points a second, every byte per point is about 860 gigabytes a day.',
      },
    },
    {
      kind: 'prose',
      text: 'Pick compressed chunks with a tag index, tiered to object storage. Or say you would run Mimir, VictoriaMetrics or M3 rather than build one — and then explain what they do inside, because that is the actual question.',
    },

    { kind: 'heading', text: 'Deep dive 2 — the cardinality problem' },
    {
      kind: 'prose',
      text: 'Cost in this system scales with **active series**, not with points. The in-memory head, the tag index and the work of every query all grow with the number of distinct tag combinations — and every new tag multiplies them.',
    },
    {
      kind: 'figure',
      caption: 'Every tag multiplies the series count. One unbounded tag turns a thousand series into a billion.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'http.requests', sub: '1 metric', to: '× 20 services' },
          { label: '20 series', to: '× 5 regions' },
          { label: '100 series', to: '× 10 status codes' },
          { label: '1,000 series', sub: 'fine', tone: 'mastered', to: '× user_id' },
          { label: '1 billion series', sub: 'a million users: the index falls over', tone: 'alert' },
        ],
      },
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Accept whatever tags arrive',
          text: 'One deploy that adds `request_id` as a tag creates millions of series in minutes. The index exhausts memory, ingestion slows for every tenant, and the outage begins in the system you would use to diagnose it.',
        },
        {
          grade: 'good',
          title: 'A policy: no unbounded tags',
          text: 'Write it down and check it in code review. Necessary — and still broken at 3am by someone who has never read it.',
        },
        {
          grade: 'great',
          title: 'Enforce series limits at ingestion',
          text: 'Count active series per tenant and per metric at the gateways — exactly, or with [[HyperLogLog]] when the numbers are huge. Past the limit, drop new series while existing ones keep flowing, and tell the owner which tag exploded. Prometheus has per-scrape sample limits for the same reason, and Datadog bills custom metrics per series, which pushes customers the same way.',
        },
        {
          grade: 'best',
          title: 'Limits, plus aggregation before storage',
          text: 'Let teams declare which tags to keep for each metric, and aggregate the rest away at the agent or gateway: keep `service` and `status`, drop `pod`. For questions that genuinely need a per-user answer, send events to a store built for high cardinality, such as ClickHouse or Druid. Metrics answer "how many"; events answer "which one".',
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Treating cardinality as a storage-cost footnote. It is how every metrics system fails at scale, and it is the deep dive the interviewer is waiting for. Raise it yourself, with the multiplication.',
    },

    { kind: 'heading', text: 'Deep dive 3 — downsampling and retention' },
    {
      kind: 'prose',
      text: 'A year-long graph at 10-second resolution is three million points per series — far more than there are pixels on the screen. Long ranges should read pre-aggregated data, and raw data should not be kept for years.',
    },
    {
      kind: 'compare',
      left: {
        title: 'Downsample when queried',
        points: [
          'No extra storage and no extra jobs',
          'Any interval, any aggregation, on demand',
          'A year-long query reads billions of raw points',
          'Impossible once raw data has aged out',
        ],
      },
      right: {
        title: 'Downsample when written',
        points: [
          'A compactor rolls closed blocks into 1-minute and 1-hour resolutions',
          'A year at 1-hour resolution is under nine thousand points per series',
          'Rollups must store aggregates that still combine: min, max, sum, count',
          'Extra storage, and a job to keep running',
        ],
      },
      verdict: 'Downsample on write, as the Thanos compactor does. The query layer picks the resolution from the requested range and step, so a user never has to.',
    },
    {
      kind: 'figure',
      caption: 'Retention tiers: resolution falls as data ages, and so does its cost.',
      figure: {
        kind: 'stack',
        layers: [
          { label: 'Raw, 10-second points', sub: '15 days · local SSD', tone: 'line' },
          { label: '1-minute rollups', sub: '90 days' },
          { label: '1-hour rollups', sub: '2 years · object storage' },
        ],
        note: 'Each tier keeps min, max, sum and count per interval, so any coarser view can still be computed from it.',
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Averaging percentiles. The p99 of a thousand hosts is not the average of their p99s, and a rollup that kept only averages cannot tell you the worst minute. Store histograms — fixed buckets, as Prometheus does, or mergeable sketches such as DDSketch or t-digest — and compute the quantile after merging.',
    },

    { kind: 'heading', text: 'Deep dive 4 — the alert evaluation pipeline' },
    {
      kind: 'prose',
      text: 'A hundred thousand alert rules, each evaluated every 30 seconds, is over three thousand evaluations a second. Where they run decides whether alerts are late exactly when they matter.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'Run every rule as a query against the main store, on a timer',
          text: 'Three thousand queries a second competing with dashboards. During an incident everyone opens dashboards at once, the store slows, and the alerts that should have paged you arrive late — or not at all, if the store is what failed.',
        },
        {
          grade: 'good',
          title: 'A dedicated evaluator fleet, with rules sharded across it',
          text: 'Hash each rule to one evaluator and give the fleet its own read path — replicas, or a cache of recent data. Isolated from dashboard load, but still only as fresh and as available as the store.',
        },
        {
          grade: 'great',
          title: 'Evaluate on the stream',
          text: 'Evaluators consume the ingest log through a routing step that re-keys points by the rules that need them — the log is partitioned by series, so without it a rule grouping by region would have to read every partition, all 10 million points a second. Each evaluator keeps a short window of just its series in memory. A threshold check runs as points arrive, seconds after the fact, and keeps working when the storage tier is down. Rules too complex for a window, such as week-over-week comparisons, fall back to querying.',
        },
        {
          grade: 'best',
          title: 'Stream evaluation, state per alert, and a separate notifier',
          text: 'Each rule tracks a state for every group it watches. A notifier — Prometheus Alertmanager is the model — groups related alerts, deduplicates, honours silences and routes to the right on-call. Run evaluators in pairs and let the notifier deduplicate their output, so one failure never means a missed page.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'The life of one alert: a short wait before paging, and a clear end.',
      figure: {
        kind: 'cycle',
        steps: [
          { label: 'OK', sub: 'condition false' },
          { label: 'Pending', sub: 'condition true, but for less than 5 minutes' },
          { label: 'Firing', sub: 'notify once; repeat only on a schedule' },
          { label: 'Resolved', sub: 'false again — send the all-clear' },
        ],
        note: 'The for-duration stops one noisy sample from paging anyone. Requiring a few clean evaluations before resolving stops flapping.',
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Alerting only on values. When a service dies it stops sending metrics, and an error-rate rule over missing data sees nothing: no data is not zero errors. Every critical service needs an explicit absence alert — "no points from checkout for two minutes".',
    },
  ],
  followups: [
    {
      q: 'Who monitors the monitoring system?',
      a: 'A separate, deliberately small stack in another failure domain, watching the main one\'s health. And a dead man\'s switch: an alert that is always firing, sent to an outside service that pages someone when the heartbeat stops. If the whole alerting path dies, the silence itself becomes the alert.',
    },
    {
      q: 'A team wants p99 latency per customer, for two million customers.',
      a: 'That is two million series per metric, multiplied by every other tag — a cardinality problem, not a feature request. Offer the top few hundred customers as a tag with everyone else bucketed as "other", or send per-request events to a columnar store such as ClickHouse, where high cardinality is the point. Exemplars — a trace id attached to a sample — let them jump from an aggregate spike to individual requests.',
    },
    {
      q: 'How do you compute p99 latency across 500 hosts?',
      a: 'Not by averaging each host\'s p99, because percentiles do not average. Each host emits a histogram, either fixed buckets or a mergeable sketch; the query merges them and computes the quantile from the merged distribution. Accuracy depends on the bucket layout, so put buckets around the thresholds you alert on.',
    },
    {
      q: 'Push or pull?',
      a: 'Prometheus pulls: service discovery says what should exist, so a dead target shows up as a failed scrape, and you can curl an endpoint to debug it. Push suits short-lived jobs, serverless functions and hosts behind firewalls. At this scale I would push from local agents into the gateways and keep an explicit heartbeat per target — which recovers the one thing pull gave you for free.',
    },
    {
      q: 'A region loses its link to the central cluster.',
      a: 'Agents buffer to local disk for some minutes and replay with the original timestamps, so the graphs heal afterwards. Alerting for that region must not depend on the central cluster at all: run ingestion and evaluation per region, and federate upwards only for the global view.',
    },
  ],
}
