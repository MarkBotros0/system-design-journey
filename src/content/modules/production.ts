import type { Module } from '../types'

/**
 * Track — Production readiness (O).
 * trackId: 'production'. Authoring rules: docs/superpowers/plans/2026-11-18-content-brief.md
 */
export const productionModules: Module[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'o-observability',
    trackId: 'production',
    title: 'Logs, metrics and traces',
    station: 1,
    prereqs: ['ar-edge'],
    related: ['a-writes'],
    minutes: 13,
    summary: 'What each signal answers, why one label can blow up a metrics bill, and how a trace follows a request across services.',
    objectives: [
      'Say which of logs, metrics and traces answers a given question, and why',
      'Put [[RED]] metrics on every service and [[USE]] metrics on every resource',
      'Explain cardinality, and keep it bounded',
      'Describe how trace context propagates, and choose head or tail sampling',
    ],
    keywords: [
      'monitoring',
      'telemetry',
      'OpenTelemetry',
      'structured logging',
      'cardinality',
      'distributed tracing',
      'span',
      'sampling',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Every design you draw in an interview ends the same way: it is running, and something is slow. The interviewer\'s "how would you know?" is not a box-ticking question. It tests whether you have operated a system, or only drawn one.',
      },
      {
        kind: 'prose',
        text: 'Observability is three signals, each cheap at one question and expensive at the others. Name the question first and the right signal follows. Reach for the wrong one and you are either blind, or paying to store terabytes nobody reads.',
      },
      {
        kind: 'figure',
        caption: 'One incident, three signals, in the order you reach for them.',
        figure: {
          kind: 'flow',
          nodes: [
            { label: 'Metric', sub: 'checkout p99: 250 ms → 1 s', tone: 'alert', to: 'which requests?' },
            { label: 'Trace', sub: 'payments span: 780 ms', tone: 'line', to: 'what happened?' },
            { label: 'Log line', sub: 'card-api timeout, attempt 1 of 2' },
          ],
          note: 'Metrics tell you **that** something is wrong. Traces tell you **where**. Logs tell you **why**.',
        },
      },
      { kind: 'heading', text: 'What each signal answers' },
      {
        kind: 'table',
        head: ['Signal', 'Answers', 'Cost grows with', 'Kept for'],
        rows: [
          ['**Metrics**', 'Is something wrong, and how much?', 'The number of series, not traffic', 'Months, downsampled'],
          ['**Traces**', 'Where in the request path did the time or the error go?', 'Traffic, so you sample', 'Days'],
          ['**Logs**', 'What exactly happened in this one event?', 'Traffic, line for line', 'Days to weeks; longer for audit'],
        ],
      },
      {
        kind: 'prose',
        text: 'The cost column is the one that shapes a design. A counter costs the same at ten requests a second as at a million: it is one number per interval. A log line per request does not. At 10,000 requests a second and 1 [[KB]] a line you write 10 [[MB]] a second, roughly 860 [[GB]] a day, before replication. That is why you alert on metrics and keep logs for the investigation.',
      },
      { kind: 'heading', text: 'Structured logging' },
      {
        kind: 'prose',
        text: 'A log line written as a sentence is for a human tailing a terminal. A log line written as fields is for a query engine, and in production the query engine is the only reader that scales. Emit one event per line with stable field names, and always include the trace id, so the line can be joined to the request it belongs to.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'A sentence: grep and hope',
          code: [
            'logger.warn(',
            '  `Payment failed for user ${userId} ` +',
            '  `after ${ms}ms: ${err.message}`,',
            ')',
            '',
            '// "Payment failed for user 812',
            '//  after 2803ms: socket hang up"',
          ].join('\n'),
        },
        after: {
          title: 'Fields: filter and join',
          code: [
            'logger.warn({',
            "  event: 'payment.failed',",
            '  traceId: req.traceId,',
            '  userId,',
            '  durationMs: ms,',
            "  provider: 'card-api',",
            "  error: err.code, // 'TIMEOUT', not prose",
            '})',
          ].join('\n'),
        },
        note: '"Every card-api payment failure over 2 seconds in the last hour" is now a filter, not a regular expression, and each hit links straight to its trace.',
      },
      {
        kind: 'list',
        items: [
          '**Levels carry meaning.** `error` means a request failed and someone should eventually look. `debug` is off in production, or sampled.',
          '**Never log secrets or personal data.** Tokens, passwords and card numbers in logs turn the log store into the breach. Redact in the logger, not by asking people to remember.',
          '**Sample the noise, keep the signal.** Keep every error and every slow request, and a small fraction of the successful ones. Volume drops by an order of magnitude and nothing you would search for is lost.',
        ],
      },
      { kind: 'heading', text: 'Metrics: RED, USE and cardinality' },
      {
        kind: 'prose',
        text: 'You do not need to invent what to measure. Two checklists cover almost everything, and naming them tells the interviewer you have done this before.',
      },
      {
        kind: 'compare',
        left: {
          title: '[[RED]], for every service',
          points: [
            '**Rate**: requests per second',
            '**Errors**: failed requests, as a rate or a fraction',
            '**Duration**: latency as a distribution (p50, p95, p99), never only the mean',
            'Describes what users experience',
          ],
        },
        right: {
          title: '[[USE]], for every resource',
          points: [
            '**Utilisation**: how busy it is, say [[CPU]] at 70%',
            '**Saturation**: how much work is queued behind it: run queue, pool waiters',
            '**Errors**: the resource failing: dropped packets, failed disk writes',
            'Describes why the service is slow',
          ],
        },
        verdict: 'RED on the request path tells you users are hurting. USE on machines and pools tells you which resource ran out. Google\'s four golden signals (latency, traffic, errors, saturation) are much the same idea: RED plus saturation.',
      },
      {
        kind: 'prose',
        text: 'Report latency as percentiles. A mean of 80 ms can hide a p99 of three seconds, and the tail matters more than it looks: if a page fans out to a hundred backend calls, 63% of page loads include at least one call slower than the p99.',
      },
      {
        kind: 'prose',
        text: '**Cardinality** is the cost nobody mentions until the bill arrives. Every unique combination of label values is a separate time series, held in memory and on disk by the metrics store whether or not anyone ever queries it. Labels multiply.',
      },
      {
        kind: 'figure',
        caption: 'Each label multiplies the series count. One unbounded label turns hundreds into billions.',
        figure: {
          kind: 'scale',
          items: [
            { label: 'route (20) × status code (5)', display: '100 series', value: 100, tone: 'mastered' },
            { label: '× region (6)', display: '600', value: 600, tone: 'mastered' },
            { label: '× pod (200)', display: '120,000', value: 120000, tone: 'streak' },
            { label: '× user id (1 million)', display: '120 billion', value: 1.2e11, tone: 'alert' },
          ],
          note: 'The worst case, multiplied out. Real traffic fills fewer combinations, but a user id label still adds series for every active user. Put the user id on the span or the log line, never on the metric.',
        },
      },
      {
        kind: 'prose',
        text: 'The rule: a label takes its values from a small, fixed set, such as route templates, status classes and regions. Anything unbounded (a user id, a request id, a raw [[URL]], an email address) belongs on traces and logs, which are priced per event and do not care. A latency histogram then multiplies everything again by its bucket count, typically ten to twenty.',
      },
      { kind: 'heading', text: 'Distributed tracing' },
      {
        kind: 'prose',
        text: 'In a monolith, a stack trace tells you where the time went. Across services there is no such thing, so you build one. A **trace** is the whole request. A **span** is one unit of work inside it, with a start, a duration, a parent and some attributes. Lay the spans on a time axis and the slow part is the long bar.',
      },
      {
        kind: 'figure',
        caption: 'A trace waterfall: each bar is a span, nested under the span that called it. The long bar is where to look.',
        figure: {
          kind: 'timeline',
          ticks: ['0', '200', '400', '600', '800', '1,000 ms'],
          lanes: [
            { label: 'gateway: GET /checkout', bars: [{ from: 0, to: 1, label: '1,000 ms', tone: 'line' }] },
            { label: 'auth: verify token', bars: [{ from: 0.01, to: 0.04, tone: 'neutral' }] },
            { label: 'cart: load items', bars: [{ from: 0.05, to: 0.17, label: '120 ms', tone: 'neutral' }] },
            { label: 'payments: charge', bars: [{ from: 0.19, to: 0.97, label: '780 ms', tone: 'streak' }] },
            {
              label: 'payments → card-api, two attempts',
              bars: [
                { from: 0.21, to: 0.51, label: 'timeout', tone: 'alert' },
                { from: 0.53, to: 0.94, label: '410 ms', tone: 'streak' },
              ],
            },
          ],
          note: 'The answer is not "payments is slow". It is "the first card-api call timed out at 300 ms, and the retry took the rest".',
        },
      },
      {
        kind: 'prose',
        text: 'Spans only join up if every service passes the trace id along. That is **context propagation**: the caller adds a header, and the callee reads it and makes its own spans children of the caller\'s. The standard header is Trace Context\'s `traceparent`, carrying a trace id, the parent span id and a sampled flag.',
      },
      {
        kind: 'code',
        code: [
          'traceparent: 00-<trace-id>-<parent-span-id>-<flags>',
          '',
          '00                                version',
          '4bf92f3577b34da6a3ce929d0e0e4736  trace id: same on every hop',
          "00f067aa0ba902b7                  parent: the caller's span",
          '01                                flags: this trace is sampled',
        ].join('\n'),
        caption: 'Every service keeps the trace id and replaces the parent with its own span id.',
      },
      {
        kind: 'prose',
        text: '**OpenTelemetry** is the vendor-neutral way to do all of this: one [[API]] and set of libraries for traces, metrics and logs, automatic instrumentation for common [[HTTP]] and database clients, and a collector that exports to Jaeger, Grafana Tempo, Datadog or Honeycomb. Instrument against it and you can change backends without touching application code.',
      },
      { kind: 'heading', text: 'Sampling' },
      {
        kind: 'prose',
        text: 'Tracing every request at scale costs about as much as logging every request, so you sample. The real question is when you decide.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Head-based',
          points: [
            'Decide at the first service: keep 1 in 100',
            'The decision rides along in the sampled flag, so every hop agrees',
            'Cheap and stateless',
            'Blind to outcome: it drops 99 of every 100 errors too',
          ],
        },
        right: {
          title: 'Tail-based',
          points: [
            'Buffer every span in a collector until the trace completes',
            'Then keep every error, every slow trace, and 1% of the rest',
            'Keeps exactly the traces you will want',
            'Costs a stateful collector tier holding seconds of all traffic',
          ],
        },
        verdict: 'Start with head sampling at 1–10%. Move to tail sampling the first time you are paged for errors you cannot find a single trace of. At scale, that happens.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Google Dapper',
        text: 'Google\'s Dapper paper (2010) described tracing across its production fleet while sampling 1 request in 1,024, and found that was still enough data for high-volume services. Twitter\'s Zipkin and Uber\'s Jaeger were built on its ideas, and OpenTelemetry, formed in 2019 by merging OpenTracing and Google\'s OpenCensus, is now the standard way to emit traces.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'RED metrics on every service, with alerts on the user-facing ones. Every request traced with OpenTelemetry, sampled at the tail so errors and slow requests are always kept. Structured logs that carry the trace id. An alert takes me to a trace, and the trace takes me to the log line.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Putting a user id, request id or full [[URL]] on a metric label "so we can drill down". It works in staging and takes the metrics store down in production, because every new value is a new series held in memory. High-cardinality detail goes on spans and logs, which are priced per event.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'A request goes through Kafka before the next service handles it. How does the trace survive?',
            a: 'Only if the context travels inside the message. The producer writes the `traceparent` into the message headers (OpenTelemetry\'s Kafka instrumentation does this for some clients; check yours), and the consumer extracts it and starts its span as a child, or as a linked span, since one consumer batch can hold messages from many traces. Without that step the trace silently ends at the producer.',
          },
          {
            q: 'Your metrics bill tripled last month. Where do you look?',
            a: 'Cardinality. List the metrics with the most active series and look for a label that took on unbounded values: a user id, a raw path with ids in it instead of the route template, a pod name in a cluster that autoscales. Drop or bucket that label, and move the detail to traces.',
          },
          {
            q: 'Why p99 and not average latency?',
            a: 'The mean hides the tail, and the tail is what users feel: with a hundred backend calls per page, most page loads hit at least one p99-slow call. Percentiles also cannot be averaged across hosts, so you aggregate the histograms first and compute the percentile from the result.',
          },
          {
            q: 'Do you need all three signals on day one?',
            a: 'No. Day one is RED metrics with alerts, and structured logs with a request id; that covers detection and most debugging. Tracing earns its place once a request crosses more than two or three services, because that is when "which service was slow?" stops being obvious.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-o-observability-1',
        moduleId: 'o-observability',
        stem: 'To see latency per customer, a teammate adds `customer_id` as a label on the request-duration histogram. What is the problem?',
        options: [
          'Histograms cannot carry labels',
          'Every customer becomes its own set of series, multiplied by the bucket count, and the metrics store runs out of memory',
          'Percentiles become inaccurate when split by customer',
          'Nothing, as long as there are fewer than a million customers',
        ],
        correct: 1,
        explain:
          'Each unique label value creates new series, and a histogram multiplies that by its bucket count. An unbounded label is the classic way to take down a metrics store. Per-customer latency belongs on spans or logs, which are priced per event, not per series.',
      },
      {
        id: 'q-o-observability-2',
        moduleId: 'o-observability',
        stem: 'Users report checkout is slow, and metrics confirm p99 checkout latency has tripled. Which signal tells you which downstream call is responsible?',
        options: [
          'Structured logs from the checkout service',
          'A USE dashboard for the checkout hosts',
          'A distributed trace of a slow checkout request',
          'The error-rate metric',
        ],
        correct: 2,
        explain:
          'A trace puts every span of the request on one time axis, so the slow downstream call is the long bar. Logs from one service only see that service, and [[USE]] metrics describe resources, not which dependency was slow.',
      },
      {
        id: 'q-o-observability-3',
        moduleId: 'o-observability',
        stem: 'Why does tail-based sampling keep rare errors that head-based sampling drops?',
        options: [
          'It decides after the trace completes, so it can see whether the trace errored or was slow',
          'It samples at a higher rate overall',
          'Each service makes its own independent sampling decision',
          'It writes traces to disk instead of memory',
        ],
        correct: 0,
        explain:
          'Head sampling decides at the first hop, before anyone knows how the request will end, so a 1% rate drops 99% of errors along with everything else. Tail sampling buffers spans until the trace is complete and keeps by outcome. The cost is a stateful collector tier.',
      },
    ],
    cards: [
      {
        id: 'c-o-observability-1',
        moduleId: 'o-observability',
        front: 'Which question does each of logs, metrics and traces answer?',
        back: 'Metrics: is something wrong, and how much? Traces: where in the request did the time go? Logs: what exactly happened in this one event?',
        tag: 'Observability',
      },
      {
        id: 'c-o-observability-2',
        moduleId: 'o-observability',
        front: 'What are [[RED]] and [[USE]]?',
        back: 'RED, per service: rate, errors, duration. USE, per resource: utilisation, saturation, errors. RED says users are hurting; USE says which resource ran out.',
        tag: 'Metrics',
      },
      {
        id: 'c-o-observability-3',
        moduleId: 'o-observability',
        front: 'What is metric cardinality, and how do you keep it bounded?',
        back: 'The number of unique label combinations, each its own series. Labels take values from small fixed sets; user ids and raw paths go on traces and logs.',
        tag: 'Metrics',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'o-slo',
    trackId: 'production',
    title: 'SLIs, SLOs, SLAs and error budgets',
    station: 2,
    prereqs: ['o-observability'],
    related: ['c-requirements'],
    minutes: 15,
    summary: 'Measure what users feel, set a target below perfect, and spend the gap on shipping.',
    objectives: [
      'Tell an [[SLI]], an [[SLO]] and an [[SLA]] apart, and set each one',
      'Turn a target into an error budget in minutes, and use it to decide what ships',
      'Alert on burn rate, so pages mean real trouble and nothing else wakes anyone',
    ],
    keywords: [
      'service level',
      'error budget',
      'nines',
      'availability',
      'uptime',
      'burn rate',
      'alerting',
      'on-call',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Every design round has "highly available" somewhere in its non-functional requirements. The senior follow-up is "how available, measured how?", and a number with no definition behind it is decoration. This lesson turns availability into something you can measure, alert on, and trade against shipping speed.',
      },
      {
        kind: 'prose',
        text: 'Three terms do the work, and they are routinely confused: the [[SLI]], the [[SLO]] and the [[SLA]]. Each has a different owner and a different job.',
      },
      {
        kind: 'figure',
        caption: 'What you measure, what you aim for, and what you promise. The promise is always looser than the aim.',
        figure: {
          kind: 'stack',
          layers: [
            { label: 'SLI: the measurement', sub: 'good requests ÷ valid requests', tone: 'neutral' },
            { label: 'SLO: the internal target', sub: '99.9% over 30 days', tone: 'line' },
            { label: 'SLA: the contract', sub: '99.5% a month, or credits', tone: 'streak' },
          ],
          note: 'The contract sits below the target on purpose: you want to know you are in trouble long before it costs money.',
        },
      },
      { kind: 'heading', text: 'SLI, SLO, SLA' },
      {
        kind: 'table',
        head: ['Term', 'What it is', 'Owned by', 'Example'],
        rows: [
          ['**[[SLI]]**', 'A measured ratio of good events to valid events', 'Engineering', 'Share of checkout requests that returned a non-5xx response in under 300 ms'],
          ['**[[SLO]]**', 'A target for an SLI over a window', 'Engineering and product, together', '99.9% of checkout requests good, over a rolling 30 days'],
          ['**[[SLA]]**', 'A contract, with consequences for missing it', 'Legal and sales', '99.5% a month, or 10% of the bill is credited back'],
        ],
      },
      {
        kind: 'prose',
        text: 'Measure the SLI as close to the user as you can: at the load balancer, or in the client, not from the server\'s own view of itself. A server that is down records no failed requests at all. And make it a ratio of good events to valid events, so it means the same thing at 3 a.m. as at peak.',
      },
      {
        kind: 'prose',
        text: 'Pick a few SLIs per user journey, not one per service. Availability and latency cover most request-driven systems. Freshness ("no data older than five minutes") covers pipelines, and durability covers storage.',
      },
      { kind: 'heading', text: 'The nines' },
      {
        kind: 'figure',
        caption: 'Availability targets as the downtime they allow per year. Three nines suits most product services; five is for the few systems everything else depends on.',
        figure: {
          kind: 'scale',
          items: [
            { label: '99%: two nines', display: '3.65 days', value: 5260, tone: 'neutral' },
            { label: '99.9%: three nines', display: '8.8 hours', value: 526, tone: 'line' },
            { label: '99.95%', display: '4.4 hours', value: 263, tone: 'line' },
            { label: '99.99%: four nines', display: '53 minutes', value: 52.6, tone: 'streak' },
            { label: '99.999%: five nines', display: '5.3 minutes', value: 5.26, tone: 'alert' },
          ],
          note: 'Downtime allowed per year. Each extra nine leaves a tenth of the room for failure.',
        },
      },
      {
        kind: 'table',
        head: ['Target', 'Per 30 days', 'Fits'],
        rows: [
          ['99%', '7.2 hours', 'An internal batch tool'],
          ['99.9%', '43 minutes', 'A typical product service'],
          ['99.95%', '22 minutes', 'A paid [[API]] that customers build on'],
          ['99.99%', '4.3 minutes', 'Payments, login, the things everything calls'],
          ['99.999%', '26 seconds', 'Only systems that heal themselves: no human can even acknowledge a page that fast'],
        ],
      },
      {
        kind: 'prose',
        text: 'Two consequences are worth saying out loud. First, availability multiplies along a chain: a service that needs three dependencies at 99.9% each to answer, failing independently, cannot beat about 99.7% itself, so a high target forces redundancy or fewer synchronous dependencies. Second, as Google\'s Site Reliability Engineering book puts it, a user on a 99%-reliable phone cannot tell 99.99% from 99.999%. Past a point, extra nines are invisible to users and very visible on the bill.',
      },
      { kind: 'heading', text: 'Error budgets' },
      {
        kind: 'prose',
        text: 'An SLO of 99.9% is also a permission: 0.1% of requests may fail. Over 30 days that is the **error budget**, about 43 minutes of full outage, or the equivalent spread across partial failures. The budget is what makes the SLO useful, because it turns an argument about reliability into arithmetic.',
      },
      {
        kind: 'figure',
        caption: "A 99.9% SLO's 30-day error budget, partly spent. What is left is room to take risks.",
        figure: {
          kind: 'ratio',
          parts: [
            { label: 'Bad deploy, day 4: 18 min', value: 18, tone: 'alert' },
            { label: 'Database failover, day 19: 7 min', value: 7, tone: 'streak' },
            { label: 'Left: 18 min', value: 18.2, tone: 'mastered' },
          ],
          note: 'Budget left: keep shipping. Budget gone: freeze risky launches and spend the time on reliability until the window rolls forward.',
        },
      },
      {
        kind: 'list',
        items: [
          '**Budget remaining:** ship features, run experiments, do the risky migration.',
          '**Budget exhausted:** freeze non-critical launches. The next sprint goes to whatever burned it.',
          '**Budget never touched:** the SLO is too loose, or the team is shipping too cautiously. Unspent budget is speed you paid for and did not use.',
        ],
      },
      {
        kind: 'prose',
        text: 'The policy matters more than the number. Engineering and product agree in advance what happens when the budget runs out, so nobody argues about reliability in the middle of an incident; the policy already decided. Faster recovery earns budget back too: halving [[MTTR]] halves what every incident costs, and that is often cheaper than preventing the incident.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Amazon S3',
        text: 'Amazon [[S3]] Standard is designed for 99.99% availability, but its public SLA promises 99.9% a month and pays service credits below that. The design target leaves ten times less room for failure than the contract, so a bad month is a problem inside Amazon long before customers are owed anything. Copy that gap.',
      },
      { kind: 'heading', text: 'Alerting on burn rate' },
      {
        kind: 'prose',
        text: 'Alerting on the SLO itself ("page when 30-day availability drops below 99.9%") fires after the budget is already gone. Alerting on every error spike pages people for blips the budget absorbs without noticing. The fix is to alert on **burn rate**: how fast you are spending the budget compared with a steady pace. A burn rate of 1 spends exactly the budget over 30 days. A burn rate of 14.4 spends 2% of it in one hour, and the whole month\'s budget in about two days.',
      },
      {
        kind: 'table',
        head: ['Burn rate', 'Long window', 'Budget spent', 'Action'],
        rows: [
          ['14.4×', '1 hour', '2%', 'Page now'],
          ['6×', '6 hours', '5%', 'Page'],
          ['1×', '3 days', '10%', 'Ticket, for working hours'],
        ],
      },
      {
        kind: 'prose',
        text: 'Each alert also checks a short window, a twelfth of the long one (five minutes for the one-hour alert), and fires only when both are over the threshold. The long window proves the problem is significant; the short one proves it is still happening, so the alert clears minutes after the fix rather than an hour later. These thresholds come from Google\'s Site Reliability Workbook and are a sound default.',
      },
      {
        kind: 'figure',
        caption: 'Page on symptoms users feel, burning budget fast. Everything else waits for working hours or a dashboard.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Is a user-facing SLO burning error budget?',
            yes: {
              question: 'Fast enough to exhaust it within days?',
              yes: { answer: 'Page the on-call engineer', sub: 'burn rate 6× or more', tone: 'alert' },
              no: { answer: 'Open a ticket', sub: 'a slow burn: fix it this week', tone: 'streak' },
            },
            no: { answer: 'A dashboard, not an alert', sub: 'CPU, queue depth, one host down', tone: 'neutral' },
          },
        },
      },
      { kind: 'heading', text: 'Symptoms, not causes' },
      {
        kind: 'prose',
        text: 'High [[CPU]], a full disk on one replica, a restarted pod: these are causes, and most never hurt a user, because the system was built to absorb them. Page on **symptoms**: the user-facing SLIs are failing or slow. Causes go on the dashboards you open after the page, to explain it.',
      },
      {
        kind: 'prose',
        text: 'The test for any alert is whether the person woken at 3 a.m. can do something useful about it, right now. If the honest answer is "keep an eye on it", it is a ticket. Alert fatigue is not a morale problem; it is a reliability problem, because the real page gets ignored along with the fifty false ones. The exception is a cause that predicts a certain outage with lead time, like a disk that will be full in four hours or a certificate that expires on Friday. Alert on the prediction, not the current value.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'I\'d define the SLI at the load balancer as the share of requests that succeed in under 300 ms, set a 99.9% SLO over 30 days, which is a 43-minute error budget, and page on multi-window burn rate rather than raw error counts or CPU. If we sell an SLA, it sits lower, at 99.5%.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Promising five nines because it sounds serious. 99.999% is 26 seconds a month: no human can even acknowledge a page in that time, so it demands fully automatic failover across regions, and every synchronous dependency has to be better still. Name a target you can defend from what users need, and say what it costs.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Your service depends on a database with a 99.95% SLA. Can you offer 99.99%?',
            a: 'Not while every request needs that database synchronously: you cannot be more available than a hard dependency. You would have to take it off the critical path (serve reads from a cache or replica when it is down, queue writes) or accept a lower target. Doing that dependency arithmetic out loud is the senior signal.',
          },
          {
            q: 'The team burned the whole error budget in the first week. What happens next?',
            a: 'Whatever the policy agreed in advance says: usually a freeze on risky launches, with engineering time moved to the causes until the rolling window recovers. Agreeing it beforehand means product does not have to be persuaded mid-freeze. If the budget is blown every month, the SLO is above what the system can deliver, and one of them has to change.',
          },
          {
            q: 'Why not just alert when the error rate goes over 1%?',
            a: 'A fixed threshold is wrong at both ends. It pages for a two-minute blip the budget absorbs easily, and stays silent through a steady 0.5% error rate that quietly burns the month\'s budget in a week. Burn rate ties the alert to what actually matters: whether you are going to miss the SLO.',
          },
          {
            q: 'How do you set the first SLO for a service with no history?',
            a: 'Measure the SLI for a few weeks first, then set the SLO at or a little below what you already achieve, provided users are content with that. Tighten it if the budget is never touched. An aspirational target the system has never met just produces a permanent freeze.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-o-slo-1',
        moduleId: 'o-slo',
        stem: 'A service has a 99.9% availability [[SLO]] over 30 days. Roughly how much full outage does its error budget allow?',
        options: ['4.3 minutes', '43 minutes', '7.2 hours', '8.8 hours'],
        correct: 1,
        explain:
          '0.1% of 43,200 minutes is 43.2 minutes. 8.8 hours is the same target over a year, and 4.3 minutes is four nines over 30 days. These conversions are expected without a calculator.',
      },
      {
        id: 'q-o-slo-2',
        moduleId: 'o-slo',
        stem: 'Which of these should page the on-call engineer at 3 a.m.?',
        options: [
          'CPU on one of twelve API hosts at 95% for ten minutes',
          'A database replica restarted and caught up',
          'Disk usage on the logging cluster reached 70%',
          'The checkout SLO is burning error budget at 14× its sustainable rate',
        ],
        correct: 3,
        explain:
          'Page on symptoms that threaten the budget. A hot [[CPU]] on one [[API]] host, a recovered replica and a disk at 70% are causes the system absorbs; they belong on dashboards or in tickets. A 14× burn rate exhausts the month\'s budget in about two days.',
      },
      {
        id: 'q-o-slo-3',
        moduleId: 'o-slo',
        stem: 'Why is the [[SLA]] usually set lower than the internal SLO?',
        options: [
          'So the team is warned, and can react, before the contract is breached and credits are owed',
          'Because SLAs are measured monthly and SLOs yearly',
          'Because customers cannot measure availability accurately',
          'Because the SLA only covers planned maintenance',
        ],
        correct: 0,
        explain:
          'The SLO is the early warning. Promise customers exactly what you aim for and every miss costs money. The gap between the two, like S3\'s 99.99% design target against its 99.9% SLA, is your buffer.',
      },
    ],
    cards: [
      {
        id: 'c-o-slo-1',
        moduleId: 'o-slo',
        front: 'What is the difference between an [[SLI]], an [[SLO]] and an [[SLA]]?',
        back: 'SLI: what you measure, a ratio of good events. SLO: your internal target for it. SLA: the contract with customers, set looser, with penalties.',
        tag: 'SLOs',
      },
      {
        id: 'c-o-slo-2',
        moduleId: 'o-slo',
        front: 'What is an error budget, and what is it for?',
        back: 'One minus the SLO: the failure you are allowed. While budget remains you ship; when it is gone you freeze risky changes and fix reliability.',
        tag: 'SLOs',
      },
      {
        id: 'c-o-slo-3',
        moduleId: 'o-slo',
        front: 'What is burn-rate alerting?',
        back: 'Page when the error budget burns far faster than a steady pace, over a long and a short window. 14.4× for an hour spends 2% of a 30-day budget.',
        tag: 'Alerting',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'o-auth',
    trackId: 'production',
    title: 'Authentication and authorisation',
    station: 3,
    prereqs: ['o-slo'],
    related: ['f-api'],
    minutes: 12,
    summary: 'Who you are versus what you may do, sessions versus tokens, and the OAuth flow you should be able to draw.',
    objectives: [
      'Separate authentication from authorisation, and place each check in the architecture',
      'Choose between server sessions and [[JWT|JWTs]], knowing what each costs',
      'Draw the OAuth 2.0 authorization code flow with [[PKCE]], and say what [[OIDC]] adds',
      'Pick [[RBAC]] or [[ABAC]], and authenticate service-to-service calls with [[mTLS]]',
    ],
    keywords: [
      'authentication',
      'authorization',
      'OAuth',
      'OpenID Connect',
      'session',
      'access token',
      'refresh token',
      'permissions',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Foundations gave you the rule interviewers watch for: the acting user comes from the token, never from the request body. This lesson is everything behind that token: how it is issued, what it costs to check, how it is revoked, and how a service decides what its holder may do.',
      },
      {
        kind: 'prose',
        text: 'Two questions, always in this order. **Authentication** asks who you are. **Authorisation** asks what you may do. They fail differently, so keep them apart, starting with the status code: `401 Unauthorized` means "I do not know who you are", despite its name, and `403 Forbidden` means "I know exactly who you are, and no".',
      },
      { kind: 'heading', text: 'Sessions or tokens' },
      {
        kind: 'figure',
        caption: 'Where the truth about the user lives: in a store you look up, or inside the token itself.',
        figure: {
          kind: 'split',
          left: {
            title: 'Server session',
            tone: 'mastered',
            nodes: [
              { label: 'Browser', sub: 'cookie: a random session id', to: 'every request' },
              { label: 'Session store', sub: 'Redis: id → user, roles', tone: 'line', to: 'user' },
              { label: 'Service' },
            ],
            cost: 'A store lookup per request, well under a millisecond. Revoking is deleting a key.',
          },
          right: {
            title: 'Self-contained token',
            tone: 'streak',
            nodes: [
              { label: 'Client', sub: 'a signed JWT, up to 1 KB', to: 'every request' },
              { label: 'Service', sub: 'verifies the signature locally', tone: 'line' },
            ],
            cost: 'No lookup and no shared store. A stolen or stale token stays valid until it expires.',
          },
          verdict: 'Sessions are simpler and revocable; tokens save a lookup. For a first-party web app, sessions are the better default. Tokens earn their place when many services, or other organisations, must verify the user without calling home.',
        },
      },
      { kind: 'heading', text: 'What JWTs really cost' },
      {
        kind: 'prose',
        text: 'A [[JWT]] is attractive because any service holding the public key can verify it with no network call. That one property is also the source of every one of its problems.',
      },
      {
        kind: 'list',
        items: [
          '**Revocation.** The token is valid until `exp`, whatever happens. A fired employee, a changed password, a stolen laptop: the token keeps working. The fix is short-lived access tokens (5–15 minutes) plus a refresh token that **is** checked against a store, so revocation takes effect at the next refresh.',
          '**Staleness.** Roles inside the token are a snapshot. Promote or demote someone and their token disagrees until it is refreshed.',
          '**Size.** A signed token with a handful of claims is typically a few hundred bytes to 1 [[KB]], against a 32-character session id, and it rides on every request. Stuff it with groups and permissions and it can outgrow the 8 KB header limit many servers enforce.',
          '**Readable by anyone.** The payload is base64-encoded, not encrypted. Put nothing in it you would not print on screen.',
          '**Verification bugs.** Pin the algorithm you expect and reject everything else. Libraries that honoured `alg: none`, or let an attacker swap an asymmetric algorithm for a symmetric one, have shipped real vulnerabilities.',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'Where the browser keeps it',
        text: 'In `localStorage`, any injected script can read the token and send it anywhere. In an `HttpOnly`, `Secure`, `SameSite` cookie, script cannot read it at all. That is why a cookie remains the safer home in a browser, even when what the cookie holds is a JWT.',
      },
      { kind: 'heading', text: 'OAuth 2.0 and PKCE' },
      {
        kind: 'prose',
        text: 'OAuth 2.0 is **delegated authorisation**: a user lets an application act on their behalf at some [[API]] without giving it their password. "Let this app read my Google Calendar" is OAuth. It was never designed to tell the app who the user is; that comes next.',
      },
      {
        kind: 'prose',
        text: 'The flow to know is the **authorization code flow with [[PKCE]]** (Proof Key for Code Exchange). Current OAuth security guidance requires PKCE for mobile and browser apps, recommends it for every client, and advises against the old implicit flow, which handed tokens back in the browser\'s address bar.',
      },
      {
        kind: 'figure',
        caption: 'Authorization code with PKCE: at the exchange, the app proves it is the same app that started the flow.',
        figure: {
          kind: 'sequence',
          actors: ['Browser', 'App', 'Auth server', 'API'],
          steps: [
            { from: 1, to: 1, label: 'make a random verifier; hash it into a challenge' },
            { from: 1, to: 0, label: 'redirect to /authorize, with the challenge', dashed: true },
            { from: 0, to: 2, label: 'user signs in and consents' },
            { from: 2, to: 0, label: 'redirect back with a one-time code', dashed: true },
            { from: 0, to: 1, label: 'code arrives at the redirect address' },
            { from: 1, to: 2, label: 'code + verifier, sent directly' },
            { from: 2, to: 2, label: 'does hash(verifier) match the challenge?', tone: 'line' },
            { from: 2, to: 1, label: 'access token, refresh token, ID token', dashed: true, tone: 'mastered' },
            { from: 1, to: 3, label: 'Authorization: Bearer access token' },
            { from: 3, to: 1, label: 'data', dashed: true },
          ],
          note: 'The code travels through the browser, where it can leak. The verifier never does, so a stolen code is useless on its own.',
        },
      },
      {
        kind: 'prose',
        text: 'Why the verifier matters: the code passes through the browser and the redirect, where it can leak into logs, history, or a malicious app on a phone that registered the same redirect scheme. Without PKCE, whoever holds the code can redeem it. With PKCE, redeeming it needs the verifier, which never left the app that started the flow.',
      },
      { kind: 'heading', text: 'OIDC: identity on top' },
      {
        kind: 'prose',
        text: '[[OIDC]] (OpenID Connect) is a thin layer on OAuth 2.0 that answers the question OAuth never did: who is this user? Ask for the `openid` scope and the authorization server also returns an **ID token**, a JWT about the user signed by the provider, with `sub` (a stable user id), `iss` (who issued it), `aud` (which app it is for), `exp` and a `nonce`. "Sign in with Google" and "Sign in with Apple" are OIDC.',
      },
      {
        kind: 'compare',
        left: {
          title: 'ID token',
          points: [
            'For the **client**: tells the app who signed in',
            'Always a JWT; the app checks `iss`, `aud`, `exp` and `nonce`',
            'Never send it to an API as a credential',
          ],
        },
        right: {
          title: 'Access token',
          points: [
            'For the **API**: says what the app may do, and for whom',
            'Opaque or a JWT; the client should not read it',
            'Carries scopes such as `calendar.read`',
          ],
        },
        verdict: 'Mixing the two up is the classic OIDC bug. The ID token proves a sign-in happened; the access token authorises calls.',
      },
      { kind: 'heading', text: 'Roles, attributes, relationships' },
      {
        kind: 'prose',
        text: '[[RBAC]] (role-based access control) maps users to roles and roles to permissions: editors may edit, viewers may view. It is easy to reason about and to audit, and it is the right default. Its failure mode is **role explosion**: "editor for the EU region, drafts only" becomes a role of its own, and soon there are more roles than people.',
      },
      {
        kind: 'prose',
        text: '[[ABAC]] (attribute-based access control) evaluates a policy over attributes of the user, the resource, the action and the context: "a manager may approve an expense under $5,000 in their own department". It expresses what roles cannot, at the cost of policies that are harder to test and audit. Engines such as Open Policy Agent and [[AWS]]\'s Cedar keep those policies out of application code.',
      },
      {
        kind: 'figure',
        caption: 'Start with roles. Reach for attributes or relationships only when the rules demand them.',
        figure: {
          kind: 'decision',
          root: {
            question: "Does access depend on the user's relationship to this object?",
            yes: { answer: 'Relationship-based', sub: 'owner, shared with, member of: Zanzibar-style', tone: 'line' },
            no: {
              question: 'Do the rules turn on attributes like amount, region or time?',
              yes: { answer: 'ABAC', sub: 'a policy engine, tested like code', tone: 'streak' },
              no: { answer: 'RBAC', sub: 'a few roles, easy to audit', tone: 'mastered' },
            },
          },
        },
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Google Zanzibar',
        text: 'Google\'s Zanzibar paper (2019) describes one permission system shared by Drive, YouTube, Calendar, Photos and Maps. It stores permissions as relationships ("user 7 is an editor of doc 42", "group X can view folder Y"), over two trillion of them, and answers millions of checks a second with a 95th-percentile latency under 10 ms. SpiceDB and OpenFGA are open-source systems modelled on it.',
      },
      {
        kind: 'prose',
        text: 'Whichever model you pick, enforce it in two places. The gateway does the coarse check: is the token valid and unexpired, and does it carry the right scope? The service does the fine one: does **this** user own **this** invoice? Skip the second and anyone can read `/invoices/42` by changing the number, which is why broken access control was number one in the 2021 [[OWASP]] Top 10.',
      },
      { kind: 'heading', text: 'Service to service' },
      {
        kind: 'prose',
        text: 'Inside your system, services call each other with no user present. "The call came from inside our private network" is not authentication: one compromised pod could then call anything. Every service needs an identity of its own.',
      },
      {
        kind: 'ladder',
        rungs: [
          {
            grade: 'bad',
            title: 'Trust the network',
            text: 'Anything that can reach the service is allowed in. A foothold anywhere is a foothold everywhere.',
          },
          {
            grade: 'good',
            title: 'A static key per service',
            text: 'Better, but keys get copied into config, never rotated, and leak. A leaked key works from anywhere until someone notices.',
          },
          {
            grade: 'great',
            title: '[[mTLS]] with short-lived certificates',
            text: 'Both sides present certificates, so each service proves who it is on every connection, and the traffic is encrypted. A mesh such as Istio or Linkerd issues and rotates the certificates, by default every 24 hours, so nobody handles them by hand.',
          },
          {
            grade: 'best',
            title: 'Workload identity, authorised per caller',
            text: 'The platform gives each workload an identity ([[SPIFFE]] ids in a mesh, [[IAM]] roles for Kubernetes service accounts on AWS), carried in those certificates. Each service then authorises by caller: only `orders` may call `payments.charge`. There is no static secret left to leak.',
          },
        ],
      },
      {
        kind: 'prose',
        text: 'When one service calls another on a user\'s behalf, pass the user along too, as a signed internal token or by exchanging the user\'s token for a narrower one. Then `payments` can answer both questions: is the caller `orders`, and may this user pay with this card?',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Users sign in with OIDC through an identity provider, and the browser holds a short-lived session in an HttpOnly cookie. The gateway validates tokens and scopes; each service checks object-level permissions itself, with roles until the rules need more. Services authenticate to each other with mTLS identities from the mesh, never shared keys.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Saying "we use JWTs" as if that settles authentication. The next question is "an account is compromised: how do you log them out everywhere, now?", and a long-lived JWT has no answer. Say it up front: short-lived access tokens, revocable refresh tokens, and where revocation is checked.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'How do you log a user out of every device immediately?',
            a: 'With server sessions, delete their sessions from the store and it is done. With tokens, revoke the refresh tokens so no new access tokens are issued, and accept that existing ones live out their few minutes. If minutes is too long, keep a small denylist of revoked token ids that every service checks, which buys back the lookup tokens were meant to avoid.',
          },
          {
            q: 'Why can\'t the mobile app just use a client secret?',
            a: 'Anything shipped inside an app binary or a browser bundle can be extracted, so it is not a secret. Those are public clients, and PKCE replaces the missing secret with a per-sign-in verifier that exists only in the app\'s memory for one flow.',
          },
          {
            q: 'Where should authorisation logic live: the gateway or the services?',
            a: 'Both, at different grain. The gateway rejects what is obviously wrong (no token, expired, wrong scope) so services never see it. Only the service knows who owns invoice 42, so object-level checks live there, ideally through one shared library or policy engine rather than ad-hoc checks in every handler.',
          },
          {
            q: 'A business customer wants its employees to sign in with their company accounts. What changes?',
            a: 'You trust many identity providers instead of one: one per customer, usually over OIDC or the older XML-based protocol enterprise identity teams still favour. Map each provider\'s users to that customer\'s tenant, and keep authorisation in your own system. The provider says who someone is; your roles say what they may do.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-o-auth-1',
        moduleId: 'o-auth',
        stem: 'A signed-in user requests an invoice that belongs to another customer. What should the [[API]] return?',
        options: [
          '`401 Unauthorized`',
          '`403 Forbidden`, or `404` to avoid confirming the invoice exists',
          '`400 Bad Request`',
          '`200` with an empty body',
        ],
        correct: 1,
        explain:
          'Despite its name, 401 means the server does not know who you are. Here identity is known and permission is refused, so 403, or 404 when you would rather not reveal that the invoice exists at all.',
      },
      {
        id: 'q-o-auth-2',
        moduleId: 'o-auth',
        stem: 'What does [[PKCE]] protect against in the authorization code flow?',
        options: [
          'An attacker reading the access token from an API response',
          'Cross-site scripting on the sign-in page',
          "Brute-forcing the user's password",
          'An intercepted authorization code being redeemed by someone other than the app that started the flow',
        ],
        correct: 3,
        explain:
          'The code travels through the browser and redirects, where it can leak. Redeeming it requires the verifier, which never left the original app, so a stolen code is worthless. PKCE does nothing for passwords or script injection.',
      },
      {
        id: 'q-o-auth-3',
        moduleId: 'o-auth',
        stem: 'Your system issues 24-hour [[JWT]] access tokens. Security asks that a compromised account loses access within 10 minutes. What is the standard fix?',
        options: [
          'Issue 10-minute access tokens, with refresh tokens that are checked against a store and can be revoked',
          'Encrypt the token payload',
          'Sign tokens with a longer key',
          'Move the token from a cookie to `localStorage`',
        ],
        correct: 0,
        explain:
          'A JWT cannot be recalled before it expires, so its lifetime is your revocation delay. Short access tokens bound that delay; revocable refresh tokens stop new ones being issued. Encryption and key length change nothing about lifetime, and `localStorage` only makes theft easier.',
      },
    ],
    cards: [
      {
        id: 'c-o-auth-1',
        moduleId: 'o-auth',
        front: 'Authentication versus authorisation: what is each, and which status code goes with it?',
        back: 'Authentication: who are you? 401 when unknown. Authorisation: what may you do? 403 when refused. Identity first, then permission, on every request.',
        tag: 'Auth',
      },
      {
        id: 'c-o-auth-2',
        moduleId: 'o-auth',
        front: 'What does [[OIDC]] add to OAuth 2.0?',
        back: 'Identity. OAuth delegates access; OIDC adds a signed ID token telling the client who signed in. The access token is still what goes to the API.',
        tag: 'Auth',
      },
      {
        id: 'c-o-auth-3',
        moduleId: 'o-auth',
        front: 'Why are [[JWT|JWTs]] hard to revoke, and what is the fix?',
        back: 'They are verified locally, so they stay valid until they expire. Keep access tokens to minutes, and revoke the refresh tokens, which are checked against a store.',
        tag: 'Tokens',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'o-security',
    trackId: 'production',
    title: 'Security essentials',
    station: 4,
    prereqs: ['o-auth'],
    related: ['a-blobs'],
    minutes: 15,
    summary: 'Encryption that holds, secrets that stay secret, and the four attacks every web system must answer.',
    objectives: [
      'Explain what [[TLS]] guarantees, where it terminates, and why internal traffic needs it too',
      'Keep secrets out of code, and give every component the least privilege it needs',
      'Name the fix for injection, [[XSS]], [[CSRF]] and [[SSRF]] in a sentence each',
      'Run a five-minute threat model over any design',
    ],
    keywords: [
      'HTTPS',
      'encryption',
      'secrets management',
      'least privilege',
      'SQL injection',
      'web vulnerabilities',
      'threat modelling',
      'certificates',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Security rarely gets its own interview, and that is the trap: it is scored inside every design. Interviewers notice whether you encrypt by default, whether a fetched [[URL]] can reach your internal network, and whether the reporting job really needs write access. You do not need to be a security engineer. You need a reflex for the handful of mistakes behind most breaches.',
      },
      { kind: 'heading', text: 'TLS: what it guarantees' },
      {
        kind: 'prose',
        text: '[[TLS]] gives a connection three properties: **confidentiality** (nobody on the path can read it), **integrity** (nobody can alter it undetected) and **authentication** of the server (the certificate proves you reached the real `api.example.com`, not an impostor). It does not make the server trustworthy. It makes the pipe trustworthy.',
      },
      {
        kind: 'figure',
        caption: "A TLS 1.3 handshake: keys are agreed in the first exchange, so the request rides with the client's second message.",
        figure: {
          kind: 'sequence',
          actors: ['Client', 'Server'],
          steps: [
            { from: 0, to: 1, label: 'ClientHello + key share' },
            { from: 1, to: 0, label: 'ServerHello + key share, certificate, Finished', dashed: true },
            { from: 0, to: 0, label: 'check the certificate chain and the hostname', tone: 'line' },
            { from: 0, to: 1, label: 'Finished + the first request, encrypted', tone: 'mastered' },
          ],
          note: 'One round trip before data flows in TLS 1.3, down from two in 1.2. Resumed connections can send data in the very first message, at the risk of that data being replayed.',
        },
      },
      {
        kind: 'prose',
        text: 'Where TLS ends is a design choice. Most systems terminate the public connection at the load balancer or the [[CDN]] edge, which needs to see requests to route them. The old habit was plain [[HTTP]] from there inward, on the theory that the internal network is safe. It is not: assume an attacker is already inside. Re-encrypt to the services, or let the mesh run [[mTLS]] between them, which you already wanted for service identity.',
      },
      {
        kind: 'prose',
        text: 'Certificates also expire on schedule, and expiry is a common self-inflicted outage: Microsoft Teams went down for hours in February 2020 because an authentication certificate had lapsed. Automate issuance and renewal, as Let\'s Encrypt made normal, and alert weeks before anything expires.',
      },
      { kind: 'heading', text: 'Secrets and least privilege' },
      {
        kind: 'prose',
        text: 'A secret is anything that grants access: database passwords, [[API]] keys, signing keys, cloud credentials. The rules are short. Never in source control, private repositories included. Never baked into images. Loaded at runtime from a secrets manager (HashiCorp Vault, AWS Secrets Manager, Google Secret Manager), which logs every read and can rotate a value without a deploy. Best of all is the secret that does not exist: a workload identity the platform trades for credentials that expire within hours.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Uber, 2016',
        text: 'Attackers found cloud credentials in a private GitHub repository used by Uber engineers, and used them to download data on 57 million riders and drivers from an [[S3]] bucket. The repository was private. The secret was still a secret in the wrong place.',
      },
      {
        kind: 'prose',
        text: '**Least privilege** is the other half. Every component gets exactly the access its job needs, and nothing it might want one day. The reporting job gets a read-only database user. The upload service may write to one bucket prefix, not to every bucket. A presigned URL grants one object for five minutes. Ask of every credential: what is its **blast radius**? If it leaked tonight, what could the holder do?',
      },
      {
        kind: 'figure',
        caption: 'Least privilege as blast radius: the narrower the credential, the smaller the breach.',
        figure: {
          kind: 'stack',
          layers: [
            { label: 'Admin on the whole cloud account', sub: 'everything', tone: 'alert' },
            { label: 'Read and write on every bucket', sub: 'all customer data', tone: 'alert' },
            { label: 'Write to uploads/ in one bucket', sub: "one service's data", tone: 'streak' },
            { label: 'Presigned URL: one object, 5 minutes', sub: 'one file, briefly', tone: 'mastered' },
          ],
          note: 'The same leak, four outcomes. How you scope a credential decides how bad your worst day is.',
        },
      },
      { kind: 'heading', text: 'Four attacks, four fixes' },
      {
        kind: 'prose',
        text: 'Most web vulnerabilities share one root: **data from an untrusted source is treated as code or as an instruction**. Injection runs it as a query, XSS runs it as script, CSRF borrows the user\'s browser to send it, and SSRF borrows your server. The [[OWASP]] Top 10 is the industry\'s ranked list of these risks. Know the four below cold.',
      },
      {
        kind: 'table',
        head: ['Attack', 'What happens', 'The fix'],
        rows: [
          ['**Injection**', 'Input is concatenated into a [[SQL]] query or shell command, and runs as part of it', 'Parameterised queries; never build a command out of strings'],
          ['**[[XSS]]**', 'Input is rendered into a page as markup, and runs as script in other users\' browsers', 'Escape output for its context (React does by default), a `Content-Security-Policy` header, `HttpOnly` cookies'],
          ['**[[CSRF]]**', 'Another site makes the user\'s browser send a request, with their cookies attached', '`SameSite` cookies, plus an anti-forgery token or an `Origin` check on anything that changes state'],
          ['**[[SSRF]]**', 'Your server fetches an address the attacker chose, and reaches internal systems', 'Allowlist destinations, block private and metadata ranges after resolving, fetch from an isolated network'],
        ],
      },
      {
        kind: 'prose',
        text: 'Injection is the one to show in code, because the fix is mechanical and people still get it wrong:',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Concatenated: the input becomes query',
          code: [
            'async function findUser(email: string) {',
            '  const sql =',
            "    `SELECT * FROM users WHERE email = '${email}'`",
            '  return db.query(sql)',
            '}',
            '',
            `// email = "' OR '1'='1"`,
            '// → every row in the users table',
          ].join('\n'),
        },
        after: {
          title: 'Parameterised: the input stays data',
          code: [
            'async function findUser(email: string) {',
            '  return db.query(',
            "    'SELECT * FROM users WHERE email = $1',",
            '    [email],',
            '  )',
            '}',
            '',
            '// the driver sends the value separately;',
            "// it can never change the query's shape",
          ].join('\n'),
        },
        note: 'Query builders parameterise for you, until someone reaches for the raw-query escape hatch. In a code review, that escape hatch is where to look.',
      },
      {
        kind: 'prose',
        text: 'XSS and CSRF are both browser problems with different fixes, and candidates mix them up. XSS means the attacker\'s script runs **on your page**, so it can do anything the user can: escaping output is the fix, and `HttpOnly` cookies limit the damage, because script cannot read them. CSRF means the attacker\'s page sends a request **to your site** and the browser helpfully attaches the user\'s cookie: `SameSite=Lax` cookies, Chrome\'s default since 2020, stop most of it. Tokens sent in an `Authorization` header are immune to CSRF, because browsers never attach them automatically, and exposed to XSS instead if script can read them.',
      },
      {
        kind: 'prose',
        text: 'SSRF hides inside friendly features: webhooks, "import from a link", link previews, image proxies. Anywhere your server fetches an address a user typed. The attacker types `http://169.254.169.254/`, the cloud metadata endpoint, and your server hands back its own credentials.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Capital One, 2019',
        text: 'An attacker used SSRF through a misconfigured web firewall to make one of Capital One\'s servers query the AWS metadata service, which returned that server\'s [[IAM]] role credentials. The role could list and read far more S3 buckets than its job needed, and records on about 100 million people were copied out. Either fix alone would have contained it: block metadata access from anything that fetches user-supplied addresses ([[AWS]] since added a session-token version, `IMDSv2`, for exactly this), or scope the role to what the server actually needed.',
      },
      { kind: 'heading', text: 'Encryption at rest and in transit' },
      {
        kind: 'prose',
        text: '**In transit** means TLS on every hop, internal ones included. **At rest** comes in layers, and each stops a different thief:',
      },
      {
        kind: 'list',
        items: [
          '**Disk or volume encryption** stops someone who walks off with a drive or a backup. It does nothing against a compromised application, which reads straight through it. Turn it on everywhere; on every major cloud it costs next to nothing.',
          '**Field-level encryption** protects the few columns that would be a disaster to leak (card numbers, government ids, health data) even from someone with database access. The cost: you can no longer index or search those fields normally.',
          '**Passwords are never encrypted.** They are hashed with a deliberately slow, salted function (bcrypt, scrypt, Argon2), so a stolen table cannot be reversed in bulk.',
        ],
      },
      {
        kind: 'prose',
        text: 'Keys are the hard part, and **envelope encryption** is the standard answer. Each record or file is encrypted with its own data key. That data key is itself encrypted by a master key that lives inside a [[KMS]] and never leaves it, and the encrypted data key is stored next to the data. Rotating the master key re-wraps small data keys instead of re-encrypting terabytes, and deleting one data key makes its data unreadable for good, which is also a clean way to honour a [[GDPR]] erasure request.',
      },
      {
        kind: 'figure',
        caption: 'Envelope encryption: the master key never touches the data, and the data key never sits in the clear.',
        figure: {
          kind: 'flow',
          nodes: [
            { label: 'Customer file', sub: 'plaintext', to: 'encrypted with' },
            { label: 'Data key', sub: 'unique to this file', tone: 'line', to: 'wrapped by' },
            { label: 'Master key', sub: 'inside the KMS, never exported', tone: 'mastered' },
          ],
          note: 'Stored side by side: the encrypted file and its encrypted data key. Reading the file means asking the [[KMS]] to unwrap the key, and that request is permission-checked and logged.',
        },
      },
      { kind: 'heading', text: 'A five-minute threat model' },
      {
        kind: 'prose',
        text: 'Threat modelling sounds like a week of workshops. The useful version takes five minutes at the whiteboard, and doing it unprompted at the end of a design is a strong senior signal. Adam Shostack\'s four questions are the whole method:',
      },
      {
        kind: 'figure',
        caption: 'Four questions, asked of the design on the board, and asked again whenever it changes.',
        figure: {
          kind: 'cycle',
          steps: [
            { label: 'What are we working on?', sub: 'the diagram you just drew, with trust boundaries marked' },
            { label: 'What can go wrong?', sub: 'at each boundary: who controls the input?' },
            { label: 'What are we going to do about it?', sub: 'a fix, a mitigation, or a risk you accept' },
            { label: 'Did we do a good enough job?', sub: 'check, then revisit when the design changes' },
          ],
          note: 'A trust boundary is where data passes from one owner to another: browser to edge, edge to service, service to a third party, user input to a fetcher.',
        },
      },
      {
        kind: 'prose',
        text: 'For "what can go wrong?", [[STRIDE]] is a checklist to run at each boundary: spoofing, tampering, repudiation (denying an action, which audit logs answer), information disclosure, denial of service, and elevation of privilege. You will not cover all six for every arrow. Naming two concrete threats on the riskiest boundary, each with its fix, is enough to stand out.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'TLS on every hop, internal included, with mTLS from the mesh. Secrets come from a secrets manager or workload identity, never config files, and every credential is scoped to its job. The worker that fetches user-supplied links runs on a network with no route to internal services or the metadata endpoint. Sensitive fields get envelope encryption, with keys in KMS.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Saying "it\'s all encrypted" and stopping. Encrypted where, against whom? Disk encryption does nothing against an attacker holding the application\'s credentials, and TLS does nothing once the request is inside a compromised service. Name the threat first, then the control that stops it.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Why encrypt internal traffic if it never leaves your network?',
            a: 'Because "never leaves your network" assumes nobody hostile is on it, and serious breaches involve someone already inside. Done as mTLS, it also authenticates both ends, so a compromised pod cannot impersonate another service. With a mesh it costs a little latency and no application code.',
          },
          {
            q: 'A user can register a webhook URL. What do you check before calling it?',
            a: 'Resolve the hostname once, refuse private, loopback and link-local addresses (the metadata endpoint included), and connect to the address you checked so the name cannot re-resolve somewhere internal; repeat on every redirect. Better still, send webhooks from a separate worker whose network has no route to anything internal, so a bypass of the check reaches nothing.',
          },
          {
            q: 'How do you rotate a database password without downtime?',
            a: 'Allow two valid credentials at once. Create the new one, roll it out through the secrets manager so services pick it up on their next fetch, confirm nothing still uses the old one, then revoke it. Better: have the secrets manager issue short-lived database credentials per service, so rotation is continuous and nobody holds a long-lived password at all.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-o-security-1',
        moduleId: 'o-security',
        stem: 'A link-preview feature fetches any [[URL]] a user posts. Which control matters most?',
        options: [
          'Check that the address starts with https',
          'Rate-limit previews per user',
          'Block private and metadata address ranges after resolving the name, and run the fetcher on a network with no route inside',
          'Sanitise the fetched page before displaying it',
        ],
        correct: 2,
        explain:
          'This is [[SSRF]]: the danger is your server reaching internal addresses such as the cloud metadata endpoint. A scheme check does not stop `https://` pointing at an internal name, and sanitising the output addresses [[XSS]], a different problem.',
      },
      {
        id: 'q-o-security-2',
        moduleId: 'o-security',
        stem: 'Which fix actually stops [[SQL]] injection?',
        options: [
          'Escaping single quotes in user input',
          'Parameterised queries, so values travel separately from the query text',
          'Encrypting the database at rest',
          'A firewall rule that blocks requests containing the word SELECT',
        ],
        correct: 1,
        explain:
          'With parameters, input can never change the shape of the query. Hand-escaping misses edge cases and encodings, a firewall rule is a filter attackers route around, and encryption at rest is unrelated.',
      },
      {
        id: 'q-o-security-3',
        moduleId: 'o-security',
        stem: 'An attacker copies a database backup out of a storage bucket. Which control keeps the data unreadable?',
        options: [
          'TLS between the application and the database',
          'Least-privilege database users',
          'A `Content-Security-Policy` header',
          'Encryption at rest, with keys held in a KMS the attacker cannot reach',
        ],
        correct: 3,
        explain:
          'The backup is data at rest, outside the application, so only encryption with keys kept elsewhere, in a [[KMS]], helps. TLS protects data in transit, and database users and page headers do nothing for a copied file.',
      },
    ],
    cards: [
      {
        id: 'c-o-security-1',
        moduleId: 'o-security',
        front: 'What do [[XSS]] and [[CSRF]] each exploit, and what fixes each?',
        back: 'XSS: attacker script runs on your page; escape output, use HttpOnly cookies. CSRF: another site sends requests with the user\'s cookies; SameSite cookies, anti-forgery tokens.',
        tag: 'Web security',
      },
      {
        id: 'c-o-security-2',
        moduleId: 'o-security',
        front: 'What is envelope encryption?',
        back: 'Encrypt data with a per-item data key; encrypt that key with a master key that never leaves the [[KMS]]. Rotation re-wraps small keys, not terabytes.',
        tag: 'Encryption',
      },
      {
        id: 'c-o-security-3',
        moduleId: 'o-security',
        front: 'What is least privilege, and how do you test a credential against it?',
        back: 'Each credential grants only what its job needs. Ask its blast radius: if it leaked tonight, what could the holder do?',
        tag: 'Security',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'o-deploy',
    trackId: 'production',
    title: 'Deploying and releasing safely',
    station: 5,
    prereqs: ['o-security'],
    related: ['f-network'],
    minutes: 12,
    summary: 'Rolling, blue/green and canary, flags that separate deploy from release, and migrations that never lock you in.',
    objectives: [
      'Choose between rolling, blue/green and canary deploys, and say what each costs',
      'Separate deploying code from releasing a feature, with flags and dark launches',
      'Change a database schema with expand and contract, so every step can be undone',
      'Decide the rollback before the deploy, not during the incident',
    ],
    keywords: [
      'deployment',
      'release',
      'canary',
      'blue-green',
      'rolling update',
      'feature flag',
      'schema migration',
      'rollback',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Most outages are self-inflicted. Google\'s Site Reliability Engineering book puts roughly 70% of outages down to changes in a live system. So "how do you ship this safely?" is not a closing pleasantry in a design round. It is where the interviewer finds out whether you have been on call.',
      },
      {
        kind: 'prose',
        text: 'Two ideas carry the whole lesson. Limit how many users a bad change can reach before you notice it. And make every step undoable, which is easy for code and hard for data.',
      },
      { kind: 'heading', text: 'Rolling and blue/green' },
      {
        kind: 'figure',
        caption: 'Rolling replaces servers in batches; blue/green builds a second fleet and switches traffic across in one go.',
        figure: {
          kind: 'split',
          left: {
            title: 'Rolling',
            tone: 'line',
            nodes: [
              { label: 'v1 v1 v1 v1', sub: 'before', to: 'replace a batch' },
              { label: 'v2 v2 v1 v1', sub: 'both versions serving', tone: 'streak', to: 'repeat' },
              { label: 'v2 v2 v2 v2', sub: 'after', tone: 'mastered' },
            ],
            cost: 'No spare fleet needed. Rollback is another rollout, and two versions serve side by side throughout.',
          },
          right: {
            title: 'Blue/green',
            tone: 'line',
            nodes: [
              { label: 'Blue: v1', sub: 'serving everyone', to: 'deploy, test' },
              { label: 'Green: v2', sub: 'idle, warmed up', tone: 'line', to: 'flip the router' },
              { label: 'Green serves', sub: 'blue kept for rollback', tone: 'mastered' },
            ],
            cost: 'Rollback is one switch. Costs double capacity during the cut-over, and the switch moves everyone at once.',
          },
          verdict: 'Both share one database, so both need a schema that works for old and new code at once. Neither limits how many users meet a bad build. That is what canaries are for.',
        },
      },
      {
        kind: 'prose',
        text: 'A **rolling** deploy is Kubernetes\'s default: replace up to a quarter of the pods, wait until they report healthy, repeat. It needs no spare fleet, but for its whole duration two versions serve traffic, so they must be compatible with each other and with the data. **Blue/green** runs the new version on an idle copy of the fleet and flips the load balancer. Rolling back is flipping back, the fastest rollback there is, provided the new version has not written data the old one cannot read.',
      },
      {
        kind: 'prose',
        text: 'Both assume stateless servers, from Foundations. If a user\'s session lives in one server\'s memory, replacing that server signs them out, and every deploy becomes a visible event.',
      },
      { kind: 'heading', text: 'Canary releases' },
      {
        kind: 'prose',
        text: 'A **canary** sends a small slice of real traffic to the new version, compares it with the old version on the same metrics, and widens the slice only while it holds up. The comparison is the point: a 1% canary that nobody watches is just a slower rollout. Automate it with the same [[RED]] metrics as your alerts, canary against baseline, and roll back automatically when error rate or latency diverges.',
      },
      {
        kind: 'figure',
        caption: 'A canary widens in stages, each held long enough to compare against the baseline. A bad build is stopped at the first one.',
        figure: {
          kind: 'timeline',
          ticks: ['0', '15 min', '30 min', '45 min', '60 min'],
          lanes: [
            {
              label: 'Healthy build: widen while it holds',
              bars: [
                { from: 0, to: 0.25, label: '1%', tone: 'line' },
                { from: 0.25, to: 0.5, label: '10%', tone: 'line' },
                { from: 0.5, to: 0.75, label: '50%', tone: 'line' },
                { from: 0.75, to: 1, label: '100%', tone: 'mastered' },
              ],
              outcome: { label: 'released', tone: 'mastered' },
            },
            {
              label: 'Bad build: errors diverge at 1%',
              bars: [{ from: 0, to: 0.12, label: '1%', tone: 'alert' }],
              outcome: { label: 'auto-rollback', tone: 'alert' },
            },
            {
              label: 'Baseline: the old version, compared throughout',
              bars: [{ from: 0, to: 1, label: 'v1', tone: 'neutral' }],
            },
          ],
          note: 'The bad build reached 1% of users for a few minutes. A fleet-wide deploy would have reached all of them at once.',
        },
      },
      {
        kind: 'prose',
        text: 'Each stage has to bake long enough to show the failure you fear: minutes for a crash loop, hours for a memory leak, a full day for anything that only appears at peak or in a nightly job. Roll out by region or cell as well as by percentage, so a bad change is confined to a slice of the infrastructure, not just a slice of the users.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'CrowdStrike, July 2024',
        text: 'A faulty content update for CrowdStrike\'s Falcon sensor went to every connected Windows machine running it, all at once, and crashed them. It was pulled 78 minutes later, but Microsoft estimated 8.5 million devices had already gone down, enough to ground flights and take hospital systems offline. Content updates skipped the staged rollout that sensor code went through. CrowdStrike\'s remediation was to give content updates canary deployment too. Configuration is a change, and deserves the same canary as code.',
      },
      { kind: 'heading', text: 'Deploy is not release' },
      {
        kind: 'prose',
        text: 'A **feature flag** separates two things people conflate. Deploying puts code on servers; releasing exposes behaviour to users. With the new checkout behind a flag, the code ships dark on Tuesday, turns on for staff on Wednesday, for 5% of users on Thursday, and for everyone the week after. Turning it off is a config change that takes seconds, with no deploy at all.',
      },
      {
        kind: 'prose',
        text: 'A **dark launch** goes a step further: the new path runs on real traffic, but its result is thrown away. Mirror production reads to the new search cluster and compare its answers and latency with the old one before any user sees it. Facebook launched Chat this way in 2008, with pages quietly connecting to the new backend before the feature appeared. It is load testing with real traffic instead of guesses.',
      },
      {
        kind: 'list',
        items: [
          '**Flags are debt.** Each one doubles the paths through that code. Give every flag an owner and an expiry date, and delete it once the rollout is done.',
          '**Evaluate locally.** The flag service pushes rules to an in-process cache. A network call per check adds latency and makes the flag service a dependency of every request.',
          '**Fail to a safe default.** If the flag service is unreachable, the code falls back to the known-good path rather than throwing.',
        ],
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Knight Capital, 2012',
        text: 'Knight deployed new trading code to seven of its eight servers. The eighth still ran old code containing Power Peg, a routine unused since 2003, and the new release reused the flag that used to switch Power Peg on. In 45 minutes that server sent millions of unintended orders, Knight lost more than $440 million, and the firm needed a rescue within days. Two lessons: verify that a deploy reached every server, and never reuse a flag.',
      },
      { kind: 'heading', text: 'Migrations: expand and contract' },
      {
        kind: 'prose',
        text: 'Code rolls back in minutes. Data does not. A deploy that renames a column breaks every old server still running mid-rollout, and the blue fleet you meant to flip back to. The rule that makes schema changes safe: **at every step, the schema works with both the current and the previous version of the code.** You get there by splitting one breaking change into several compatible ones.',
      },
      {
        kind: 'figure',
        caption: 'Changing a column without downtime: six compatible steps instead of one breaking one.',
        figure: {
          kind: 'stack',
          layers: [
            { label: '1. Expand: add the new column, nullable', sub: 'old code ignores it', tone: 'line' },
            { label: '2. Write both, read the old', sub: 'a deploy', tone: 'line' },
            { label: '3. Backfill old rows in batches', sub: 'a background job', tone: 'line' },
            { label: '4. Read the new, still write both', sub: 'a deploy; watch it', tone: 'streak' },
            { label: '5. Stop writing the old column', sub: 'a deploy', tone: 'streak' },
            { label: '6. Contract: drop the old column', sub: 'the only one-way step', tone: 'alert' },
          ],
          note: 'Each step ships on its own and each can be reversed, except the last. Leave at least a release cycle before contracting.',
        },
      },
      {
        kind: 'prose',
        text: 'Two more hazards hide in a migration. **Locks**: on a large table, some schema changes rewrite or lock the whole table, and a migration that blocks writes for ten minutes is an outage. Use your database\'s online path (Postgres\'s `CREATE INDEX CONCURRENTLY`, or gh-ost and pt-online-schema-change for MySQL) and backfill in small batches. **Order**: migrations run before the code that needs them, as their own pipeline step, never as a side effect of the application starting up on forty servers at once.',
      },
      { kind: 'heading', text: 'Rollback, decided in advance' },
      {
        kind: 'prose',
        text: 'Write the rollback plan before the deploy, because nobody thinks clearly during an incident. For each change, know which lever undoes it and how long that lever takes.',
      },
      {
        kind: 'figure',
        caption: 'Pick the rollback before you ship. The fastest lever is the one that needs no deploy.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Is the change behind a flag?',
            yes: { answer: 'Turn the flag off', sub: 'seconds, no deploy', tone: 'mastered' },
            no: {
              question: 'Has it written data the old version cannot read?',
              yes: { answer: 'Roll forward with a fix', sub: 'old code would choke on the new data', tone: 'streak' },
              no: { answer: 'Redeploy the previous version', sub: 'or flip blue/green back', tone: 'line' },
            },
          },
        },
      },
      {
        kind: 'prose',
        text: 'Rolling forward is legitimate when the fix is small and understood. As the default plan, "we\'ll fix forward" means every incident lasts a debugging session plus a full pipeline run. Fast rollback is the cheapest way to cut [[MTTR]], and every minute of MTTR saved is error budget you keep.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Every change goes out as a canary, region by region, with automated comparison against the baseline and automatic rollback. Risky features ship dark behind a flag and are released separately. Schema changes are expand and contract, so every step works with the previous code, and the one irreversible step happens weeks later.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Proposing blue/green and calling rollback "instant". The switch is instant; the database is not. If green has already written rows in a new format, or a migration dropped a column, flipping back to blue serves errors. Rollback is only as fast as your least reversible change, which is why the interviewer will steer you to the schema.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'You need to split a `name` column into `first_name` and `last_name` on a 500-million-row table. Walk me through it.',
            a: 'Expand: add both columns, nullable. Deploy code that writes all three and still reads `name`. Backfill in batches of a few thousand rows, throttled while you watch replication lag. Deploy code that reads the new columns, then code that stops writing `name`, and drop `name` a release cycle later. Every step is reversible until the drop.',
          },
          {
            q: 'How long should each canary stage last?',
            a: 'Long enough to see the failures you fear, and long enough for the comparison to mean something at that traffic level: 1% of a quiet service may need an hour to produce enough requests to judge. Crash loops show in minutes; leaks and daily jobs need a day, which is why the final stage often bakes overnight.',
          },
          {
            q: 'What should never sit behind a feature flag?',
            a: 'Schema changes, which a flag cannot undo, and security fixes, which should not be switchable off. Also anything where the two paths cannot safely run side by side, such as two versions writing incompatible formats to the same table.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-o-deploy-1',
        moduleId: 'o-deploy',
        stem: 'Why must a schema change work with both the old and the new version of the code?',
        options: [
          'Because migrations always run after the code is deployed',
          'Because databases cache the old schema for a while',
          'Because during a rolling deploy, a canary or a rollback, both versions read and write the same tables',
          'It need not, if you deploy blue/green',
        ],
        correct: 2,
        explain:
          'Old and new code coexist through every rolling deploy and canary, and a rollback puts old code back onto data the new code wrote. Blue/green does not help: both fleets share the database. Expand and contract keeps every step compatible.',
      },
      {
        id: 'q-o-deploy-2',
        moduleId: 'o-deploy',
        stem: 'A 1% canary shows the same error rate as the baseline, but p99 latency 40% higher. What should the automation do?',
        options: [
          'Halt and roll the canary back: a latency regression is a regression',
          'Continue, since the error rate is unchanged',
          'Widen to 50% to gather data faster',
          'Restart the canary pods and continue',
        ],
        correct: 0,
        explain:
          'Users feel latency as much as errors, and the canary exists to catch exactly this before it reaches everyone. Widening a canary that is failing its comparison defeats the point, and a restart hides the cause.',
      },
      {
        id: 'q-o-deploy-3',
        moduleId: 'o-deploy',
        stem: 'What is the main benefit of releasing a feature behind a flag rather than with a deploy?',
        options: [
          'Flagged code runs faster',
          'It removes the need for tests',
          'The flag can roll back schema changes too',
          'Turning the feature off takes seconds with no deploy, and exposure can widen gradually',
        ],
        correct: 3,
        explain:
          'A flag separates deploying code from releasing behaviour, so exposure can grow from staff to 1% to everyone and the off switch is a config change. It cannot undo a schema change, and its cost is extra code paths, so every flag needs an owner and an expiry date.',
      },
    ],
    cards: [
      {
        id: 'c-o-deploy-1',
        moduleId: 'o-deploy',
        front: 'Rolling, blue/green and canary: what does each buy you?',
        back: 'Rolling: no spare fleet, two versions coexist. Blue/green: one-switch rollback, double capacity. Canary: a bad build reaches 1% of users, judged against a baseline.',
        tag: 'Deploys',
      },
      {
        id: 'c-o-deploy-2',
        moduleId: 'o-deploy',
        front: 'What is expand and contract?',
        back: 'Splitting a breaking schema change into compatible steps: add the new, write both, backfill, switch reads, stop the old writes, and drop the old last.',
        tag: 'Migrations',
      },
      {
        id: 'c-o-deploy-3',
        moduleId: 'o-deploy',
        front: 'What is the difference between deploying and releasing?',
        back: 'Deploying puts code on servers; releasing exposes behaviour to users. Feature flags separate the two, so release and rollback become config changes.',
        tag: 'Releases',
      },
    ],
  },
]
