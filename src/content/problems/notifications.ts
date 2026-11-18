import type { Problem } from '../types'

export const notifications: Problem = {
  id: 'notifications',
  title: 'Design a notification service',
  kind: 'hld',
  category: 'realtime',
  difficulty: 'medium',
  brief:
    'Build the service the rest of the company calls to notify users by push, email or text message. Today every team sends its own.',
  patterns: ['longrunning', 'scaling-writes'],
  suggests: ['a-longrunning', 'c-queues', 'a-writes', 'a-multistep'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to one send API, user preferences and three channels, with the campaign builder out of scope' },
    { id: 'r2', bar: 'must', criterion: "Accepted asynchronously with a 202 and a queue, never sending inside the caller's request" },
    { id: 'r3', bar: 'must', criterion: 'Separated queues by channel so one provider outage does not block the others' },
    { id: 'r4', bar: 'must', criterion: 'Applied preferences and quiet hours before rendering and sending' },
    { id: 'r5', bar: 'senior', criterion: 'Deduplicated at the API with an idempotency key and at the worker with a send log' },
    { id: 'r6', bar: 'senior', criterion: 'Retried with backoff and jitter, split retryable from permanent errors, and dead-lettered the rest' },
    { id: 'r7', bar: 'senior', criterion: 'Gave critical notifications their own queues and workers so a bulk blast cannot delay them' },
    { id: 'r8', bar: 'senior', criterion: 'Rate-limited per provider and capped frequency per user' },
    { id: 'r9', bar: 'senior', criterion: 'Deleted device tokens when the push provider reports them unregistered' },
    { id: 'r10', bar: 'staff', criterion: 'Explained why exactly-once is impossible across a provider boundary, and where the duplicate window remains' },
    { id: 'r11', bar: 'staff', criterion: 'Expired time-sensitive notifications instead of retrying them indefinitely' },
    { id: 'r12', bar: 'staff', criterion: 'Added provider failover behind a circuit breaker for email and text' },
  ],
  followups: [
    {
      q: 'The user has the app open on their laptop. Should their phone buzz?',
      a: 'Usually not. Check presence first: if they were active on another device in the last minute or so, hold the push briefly and cancel it if they read the message there. That needs a delayed send and a cancel by notification id, both of which the send log already gives you.',
    },
    {
      q: 'How do you send to 50M users without melting anything?',
      a: "Expand the segment in batches with a cursor, enqueue onto the bulk queues, and drain at a fixed target rate that leaves headroom for critical traffic. Spread the sends by each user's local time so nobody gets a promotion at 3 am, and let per-user caps drop the excess. The blast takes an hour instead of a minute, which nobody minds.",
    },
    {
      q: 'How do you know a notification was actually delivered?',
      a: 'Each channel tells you something different. [[APNs]] accepting means Apple has it, not that it was seen; email providers report delivered, bounced and complained by webhook; text providers send delivery receipts. Store each as an attempt status, process the webhooks idempotently, and treat opens as best-effort analytics, never as a delivery guarantee.',
    },
    {
      q: 'A user unsubscribes from an email. How fast must that take effect?',
      a: "Immediately for anything not yet sent. The router reads preferences at decision time, and the worker re-checks just before sending bulk mail that was queued hours earlier. Unsubscribes arriving by the provider's webhook write the preference directly. Bulk mail also needs a one-click unsubscribe header, which Gmail and Yahoo now require of bulk senders.",
    },
    {
      q: 'How do templates change without a deploy?',
      a: "They are versioned rows edited in an admin tool, with a preview and a test send. The [[API]] checks that the caller's data has every variable the template needs before accepting, and each notification records the version it used, so a bad edit is rolled back by pointing at the previous version.",
    },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Internal services should be able to notify a user, or a segment of users, with one [[API]] call that names a template and the data to fill it.',
        'Users should be able to choose which kinds of notification they get, on which channels, and set quiet hours.',
        'The service should deliver by push, email and [[SMS]], and report the status of each notification.',
        'Out of scope: the campaign tool that decides who gets marketing, an in-app inbox (it is one more channel), A/B testing of copy.',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional: **no duplicates**. A user must never get the same notification twice on a channel, which with retries means at-least-once delivery plus deduplication. **Critical notifications are fast**: a sign-in code arrives within 10 seconds, even while a 50M-user marketing blast is going out. **Accepting never depends on sending**: the [[API]] keeps taking requests while a provider is down. Assume **1B notifications a day**, about 12,000 a second on average, with blasts pushing peaks past 100,000 a second.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Sending is the easy part; the providers do it. The design is in the decisions before the send (should this user get this, now, on this channel?) and in the failure handling after it, where a retry must never become a duplicate.',
    },

    { kind: 'heading', text: 'Core entities' },
    {
      kind: 'list',
      items: [
        '`Notification`: id, caller, idempotency key, userId, templateId, data, category, priority, status.',
        '`Template`: id, version, a variant per channel (push title and body, email subject and HTML, a short text), strings per locale.',
        '`Preference`: userId, category, channel, enabled, quiet hours, time zone.',
        '`Device`: userId, platform, push token, last seen.',
        '`Attempt`: notificationId, channel, provider, attempt number, result.',
      ],
    },

    { kind: 'heading', text: 'API' },
    {
      kind: 'prose',
      text: 'Asynchronous on purpose: a caller gets a 202 and an id, never the result of a send.',
    },
    {
      kind: 'code',
      code: `POST /notifications
  { idempotencyKey, userId | segmentId, templateId, data,
    category, priority: 'critical' | 'normal' | 'bulk',
    channels?, sendAfter? }          -> 202 { notificationId }

GET  /notifications/{id}             -> { status per channel }

PUT  /users/{userId}/preferences
  { category, channel, enabled, quietHours }    -> 200

POST /users/{userId}/devices  { platform, token }  -> 201`,
    },

    { kind: 'heading', text: 'Data flow' },
    {
      kind: 'prose',
      text: 'This one is a pipeline, so follow a single notification through it.',
    },
    {
      kind: 'list',
      ordered: true,
      items: [
        "**Accept.** Validate, check the caller's quota, insert with a unique constraint on `(caller, idempotencyKey)`, return 202. A retried call hits the constraint and gets the same id back.",
        '**Expand.** A segment becomes users in batches of a few thousand, read with a cursor, so a 50M-user blast never sits in memory.',
        "**Decide.** For each user: is this category enabled, on which channels, is it quiet hours where they are, have they hit today's cap? Every notification reads preferences, so they sit behind a cache.",
        "**Render.** Fill the channel's template variant in the user's locale, falling back to a default language, and record the template version used.",
        '**Enqueue.** One message per user per channel, onto the queue for that channel and priority.',
        '**Send.** Channel workers call the provider within its rate limit, record the attempt, and retry or give up.',
        '**Report.** Provider callbacks (delivered, bounced, unregistered) update the attempt and feed back into preferences, such as unsubscribes.',
      ],
    },

    { kind: 'heading', text: 'High-level design' },
    {
      kind: 'figure',
      caption: 'Accepting is decoupled from sending: the front only writes and enqueues, and each channel drains at its own pace.',
      figure: {
        kind: 'flow',
        nodes: [
          { label: 'Calling services', sub: 'auth, orders, marketing', to: 'POST, 202' },
          { label: 'Notification API', sub: 'dedupe, persist', tone: 'line', to: 'event' },
          { label: 'Router', sub: 'expand, preferences, render', to: 'enqueue' },
          { label: 'Channel queues', sub: 'push, email, text, by priority', tone: 'line', to: 'consume' },
          { label: 'Channel workers', sub: 'rate-limited, retrying', to: 'send' },
          { label: '[[APNs]], [[FCM]], SendGrid, Twilio', sub: 'the providers' },
        ],
        note: 'Notifications and attempts live in a store partitioned by notificationId, preferences in Postgres behind a cache, and the queues in Kafka or [[SQS]].',
      },
    },
    {
      kind: 'list',
      items: [
        '**`POST /notifications`** writes and returns. Nothing in the request path talks to a provider, so a provider outage never becomes an outage for every caller.',
        '**Preferences** are a hot read and a cold write: every notification reads them, and a user changes them a few times a year. A cache keyed by userId, invalidated on write, is enough.',
        '**Templates** are versioned data, not code. Product teams edit copy in an admin tool without a deploy, and every notification records the version it was rendered with, so "what exactly did we send her?" has an answer.',
        '**A queue per channel** isolates failures. When the email provider degrades, the email queue grows while push and text keep flowing.',
        '**Device tokens** are kept per install. A push to an uninstalled app comes back from [[APNs]] as a 410 and from [[FCM]] as `UNREGISTERED`; delete the token there and then, or you pay for dead sends forever.',
      ],
    },
    {
      kind: 'prose',
      text: 'Two bottlenecks remain, and they are the deep dives: retries that must not duplicate, and a blast that must not delay a sign-in code.',
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Slack published the flowchart behind its "should we send this notification?" decision, and it runs to dozens of branches: channel mutes, do-not-disturb, thread subscriptions, whether you are active on another device. That is the router in this design. Budget for it being the most complicated part, not the sending.',
    },

    { kind: 'heading', text: 'Deep dive 1 — retries without duplicates' },
    {
      kind: 'prose',
      text: 'Every hop retries, so every hop can duplicate. The goal is that each retry lands on something that already knows whether the work was done.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: "Send inside the caller's request",
          text: 'The caller times out on a slow provider and retries, and the user gets two emails. A provider outage becomes an outage of every service that sends notifications.',
        },
        {
          grade: 'good',
          title: 'A queue and workers that retry',
          text: 'Callers are decoupled and failed sends are retried. But a queue delivers at least once: a worker that crashes after the provider accepted, and before it acknowledged the message, sends it again on redelivery.',
        },
        {
          grade: 'great',
          title: 'Deduplicate at both ends',
          text: "The [[API]] dedupes on the caller's idempotency key. The worker claims `(notificationId, channel)` in a send log before calling the provider and marks it sent afterwards, so a redelivered message finds the mark and skips. Retries back off exponentially with jitter, and errors are split: timeouts and 5xx responses retry, an invalid token or address never does. After a handful of attempts the message goes to a [[DLQ]].",
        },
        {
          grade: 'best',
          title: 'Deduplicate, expire, and fail over',
          text: 'All of that, plus an expiry per priority: a sign-in code ten minutes late is worse than none, so it is dropped rather than retried. And a second provider for email and text behind a circuit breaker, so a degraded provider sheds traffic to the other instead of filling the retry queue.',
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'The queue guarantees at-least-once delivery. The send log and a collapse id make the second delivery harmless.',
      figure: {
        kind: 'sequence',
        actors: ['Queue', 'Worker', 'Send log', 'Provider'],
        steps: [
          { from: 0, to: 1, label: 'notification 81, push' },
          { from: 1, to: 2, label: 'claim 81:push' },
          { from: 2, to: 1, label: 'claimed', dashed: true },
          { from: 1, to: 3, label: 'send, collapse id 81' },
          { from: 3, to: 1, label: 'accepted', dashed: true, tone: 'mastered' },
          { from: 1, to: 1, label: 'crashes before marking it sent', tone: 'alert' },
          { from: 0, to: 1, label: 'redelivered after the visibility timeout', tone: 'streak' },
          { from: 1, to: 2, label: 'claim 81:push' },
          { from: 2, to: 1, label: 'claimed 40 s ago, never marked sent', dashed: true, tone: 'streak' },
          { from: 1, to: 3, label: 'resend, same collapse id 81' },
          { from: 3, to: 1, label: 'replaces the first, does not stack', dashed: true, tone: 'mastered' },
        ],
        note: 'A stale claim is the one real ambiguity. Push has a lever for it: a collapse id on Apple devices, a notification tag on Android, so a duplicate replaces the original instead of stacking. Email and text have none, so resend and accept a rare duplicate over a lost message.',
      },
    },
    {
      kind: 'prose',
      text: 'This is why "exactly once" is the wrong promise. Between the provider accepting a message and you recording that it did, there is always a window. You can shrink it and you can make its consequences harmless; you cannot close it.',
    },

    { kind: 'heading', text: 'Deep dive 2 — priorities and rate limits' },
    {
      kind: 'prose',
      text: 'Marketing queues 50M pushes at 6 pm. At 6:01 someone tries to sign in. Their code must not wait behind the blast.',
    },
    {
      kind: 'ladder',
      rungs: [
        {
          grade: 'bad',
          title: 'One queue for everything',
          text: "First in, first out: the sign-in code waits behind 50M marketing messages and arrives in an hour. One channel's outage also stalls every other channel.",
        },
        {
          grade: 'good',
          title: 'A queue per channel',
          text: 'An email outage no longer blocks push. But a push blast still sits in front of a critical push.',
        },
        {
          grade: 'great',
          title: 'A queue per channel and priority, each with its own workers',
          text: 'Critical, normal and bulk get separate queues and separate worker pools, so bulk can be throttled, paused or left backlogged without critical noticing. The cost is capacity reserved for critical that sits idle most of the time, which is the point.',
        },
        {
          grade: 'best',
          title: 'Priorities, plus limits at three levels',
          text: "Per provider: a token bucket in Redis, shared by every worker, keeps the fleet under each provider's throughput limit, so you throttle yourself before they throttle you. Per user: frequency caps (say three non-critical pushes a day), with the excess folded into a digest. Per caller: a quota, so one team's bug cannot spam every user. Critical bypasses user caps, never provider limits.",
        },
      ],
    },
    {
      kind: 'figure',
      caption: 'Nine queues, not one. Critical never shares a queue or a worker with bulk.',
      figure: {
        kind: 'grid',
        cols: 3,
        cells: [
          { label: 'push · critical', tone: 'line' },
          { label: 'push · normal', tone: 'neutral' },
          { label: 'push · bulk', tone: 'streak' },
          { label: 'email · critical', tone: 'line' },
          { label: 'email · normal', tone: 'neutral' },
          { label: 'email · bulk', tone: 'streak' },
          { label: 'text · critical', tone: 'line' },
          { label: 'text · normal', tone: 'neutral' },
          { label: 'text · bulk', tone: 'streak' },
        ],
        legend: [
          { tone: 'line', label: 'reserved workers, short expiry, never throttled by bulk' },
          { tone: 'neutral', label: 'normal' },
          { tone: 'streak', label: 'throttled, held in quiet hours, first to shed' },
        ],
        note: 'Rows isolate provider failures. Columns isolate urgency.',
      },
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'LinkedIn built a service for exactly this layer, Air Traffic Controller. Every team that wants to notify a member goes through it, and it decides whether, when and on which channel, so ten teams each sending one reasonable notification do not add up to ten pings.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: "Treating rate limits as protection for your own servers only. The limits that bite here are the providers' (exceed them and they reject or delay you) and the user's patience. A user who gets six pushes in an hour turns notifications off, and you have lost the channel for the messages that matter.",
    },
  ],
}
