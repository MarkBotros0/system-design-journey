import type { Module } from '../types'

/**
 * Track — Architecture & APIs (AR).
 * trackId: 'architecture'. Authoring rules: docs/superpowers/plans/2026-11-18-content-brief.md
 */
export const architectureModules: Module[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'ar-monolith',
    trackId: 'architecture',
    title: 'Monolith, modular monolith, microservices',
    station: 1,
    prereqs: ['d-resilience'],
    related: ['f-scale'],
    minutes: 13,
    summary: 'Split by team and deployment, not by noun. When to break a monolith, how, and the distributed monolith to avoid.',
    objectives: [
      'Argue monolith, modular monolith or microservices from team structure, not fashion',
      'Use Conway\'s law to draw service boundaries',
      'Plan a strangler-fig migration, and recognise a distributed monolith',
    ],
    keywords: [
      'microservices',
      'modular monolith',
      'Conway\'s law',
      'strangler fig',
      'distributed monolith',
      'service boundaries',
      'bounded context',
      'decomposition',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Somewhere in most senior rounds the interviewer asks whether this should be microservices. It is a judgement question, not a knowledge one. "Microservices, for scalability" tells them you have never paid the bill. "How many teams will work on this?" tells them you have.',
      },
      {
        kind: 'prose',
        text: 'Traffic is not what decides it. A monolith scales horizontally like anything else: run twenty copies behind a load balancer. What the three shapes really trade is **who can change and ship what without coordinating**, against the operational machinery you have to run to allow it.',
      },
      {
        kind: 'figure',
        caption: 'Three shapes on one axis, from one deployable to many.',
        figure: {
          kind: 'flow',
          nodes: [
            { label: 'Monolith', sub: 'one deployable, any code calls any code', to: 'enforce boundaries' },
            { label: 'Modular monolith', sub: 'one deployable, modules own their data', tone: 'mastered', to: 'split the deploy' },
            { label: 'Microservices', sub: 'many deployables, a network between', tone: 'line' },
          ],
          note: 'Each step to the right buys independence and charges for it. Most systems should stop in the middle.',
        },
      },
      { kind: 'heading', text: 'Three shapes, one axis' },
      {
        kind: 'table',
        head: ['', 'Monolith', 'Modular monolith', 'Microservices'],
        rows: [
          ['**Deploys**', 'One unit', 'One unit', 'One per service, independently'],
          ['**A call between parts**', 'Function call', 'Function call through a public interface', 'Network call: slower, and it can fail'],
          ['**Data**', 'One schema; any code reads any table', 'One database; each module owns its tables', 'Each service owns its store; nothing shared'],
          ['**Transactions**', 'Local [[ACID]], free', 'Local ACID, free', 'Sagas, outboxes, eventual consistency'],
          ['**Fits**', 'One or two teams', 'Several teams, one release train', 'Many teams on independent schedules'],
          ['**Fails by**', 'Eroding into a ball of mud', 'Shared deploys and a shared blast radius', 'Operational load and distributed failure'],
        ],
      },
      {
        kind: 'prose',
        text: 'A plain monolith is the cheapest thing to build, test, deploy and debug: one repository, one build, one stack trace that shows the whole request. Its failure mode is not scale. It is that nothing stops the order code reading the users table directly, so after three years every change touches everything and nobody can say what a module owns.',
      },
      {
        kind: 'prose',
        text: 'The **modular monolith** keeps one deployable but draws the boundaries a microservice split would have drawn, and enforces them in the build. Each module exposes a public interface, owns its tables, and fails the build if it reaches into another module\'s internals. You get most of what teams actually want from microservices (clear ownership, code you can reason about locally) for almost none of the operational cost. And if you later need to extract a service, the seam is already cut.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Shopify',
        text: 'Shopify\'s core is one of the largest Ruby on Rails codebases in production. Rather than split it into services, they reorganised it into components with explicit boundaries and built **Packwerk**, a static checker that fails the build when one component reaches into another\'s private code. It was a deliberate choice of the modular monolith over microservices, made at a scale most candidates will never work at.',
      },
      { kind: 'heading', text: 'Conway\'s law decides more than you do' },
      {
        kind: 'prose',
        text: 'Melvin Conway, 1968: organisations design systems that mirror their own communication structure. The old joke puts it best: give a compiler to four teams and you get a four-pass compiler. It is less a law than a force. A service shared by three teams grows three tangled regions and a merge queue. A boundary that cuts across one team gets quietly worked around by that team.',
      },
      {
        kind: 'prose',
        text: 'Turn it around and it becomes a design tool, the **inverse Conway manoeuvre**: decide the architecture you want, then shape the teams so its boundaries fall between them. Service boundaries and team boundaries should be the same lines.',
      },
      {
        kind: 'list',
        items: [
          '**One service, one owning team.** A service owned by two teams has no owner.',
          '**Size services to teams, not to lines of code.** Small enough that one team can understand, change and run it. Amazon\'s two-pizza team is the usual yardstick.',
          '**Cut along business capabilities**: billing, catalogue, fulfilment. [[DDD]] calls these **bounded contexts**, the regions inside which a word like "customer" has one meaning. Never cut along technical layers, such as a "database service" that every feature has to change.',
        ],
      },
      { kind: 'heading', text: 'What microservices buy, and what they cost' },
      {
        kind: 'compare',
        left: {
          title: 'What you get',
          points: [
            'Independent deployment: each team ships on its own schedule',
            'Independent scaling and hardware: 200 copies of search, 3 of billing',
            'Fault isolation, if you design for it: recommendations failing degrades a page instead of killing it',
            'A free choice of language per service, which you should mostly decline',
          ],
        },
        right: {
          title: 'What you pay',
          points: [
            'Every call crosses a network: latency, timeouts, retries, partial failure',
            'No cross-service transactions: sagas, outboxes, eventual consistency',
            'A pipeline, dashboards, alerts and an on-call rota per service',
            'Debugging one request means tracing it through a dozen processes',
          ],
        },
        verdict: 'Independent deployment for many teams is the benefit worth the bill. With one team you pay all of it for a benefit you cannot use.',
      },
      {
        kind: 'prose',
        text: 'Independent scaling is the benefit candidates lead with, and the weakest. A monolith that needs more search capacity runs more copies of itself; the idle billing code in each copy costs some memory and little else. Independent deployment is the real prize, and it only matters once enough teams exist that coordinating releases has become the bottleneck.',
      },
      {
        kind: 'figure',
        caption: 'What one call costs, before and after it crosses a service boundary.',
        figure: {
          kind: 'scale',
          items: [
            { label: 'Function call, same process', display: 'a few ns', value: 3, tone: 'mastered' },
            { label: 'Round trip, same data centre', display: '~0.5 ms', value: 500_000, tone: 'streak' },
            { label: 'Round trip, across continents', display: '~150 ms', value: 150_000_000, tone: 'alert' },
          ],
          note: 'Crossing a service boundary costs five orders of magnitude in latency, before you count the new ways the call can fail.',
        },
      },
      {
        kind: 'prose',
        text: 'That is why a careless split makes a system slower, not faster: a page that made forty function calls now makes forty [[RPC|RPCs]], and any of them can time out. The bill is real enough that teams walk it back. In 2023 Amazon Prime Video\'s video-quality monitoring team moved one system from distributed serverless components into a single process and reported cutting its infrastructure cost by over 90%.',
      },
      { kind: 'heading', text: 'When to split, and how' },
      {
        kind: 'figure',
        caption: 'Let team structure and a concrete pressure decide, not fashion.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Do several teams need to ship on independent schedules?',
            yes: {
              question: 'Are the module boundaries already clean?',
              yes: { answer: 'Extract services one at a time', sub: 'strangler fig, from the edge inward', tone: 'mastered' },
              no: { answer: 'Modularise first', sub: 'splitting a tangle gives a distributed tangle', tone: 'streak' },
            },
            no: {
              question: 'Does one part need very different scaling or isolation?',
              yes: { answer: 'Extract only that part', sub: 'transcoding, payments, a public search tier', tone: 'line' },
              no: { answer: 'Stay a modular monolith', sub: 'the boring default, and usually right', tone: 'mastered' },
            },
          },
        },
      },
      {
        kind: 'prose',
        text: 'Split when you can name the pressure. These are the ones that justify it:',
      },
      {
        kind: 'list',
        items: [
          '**Release contention.** Teams queue behind each other\'s changes and the shared deploy is the bottleneck, after you have already made the pipeline fast.',
          '**Divergent resource profiles.** Video transcoding wants big machines and minutes of [[CPU]] per job; the web tier wants many small, fast requests.',
          '**Isolating a risky or regulated part.** Card handling, where the compliance scope should be as small as possible.',
          '**A different availability bar.** Checkout must stay up when the recommendations engine falls over.',
        ],
      },
      {
        kind: 'prose',
        text: '"The code is messy" is not on the list. Splitting a tangled codebase gives you the same tangle with a network in the middle.',
      },
      {
        kind: 'prose',
        text: 'And never split by rewrite-and-switch. Martin Fowler named the alternative after the **strangler fig**, which grows around a host tree until the tree is no longer needed. Put a routing layer in front of the monolith, move one capability behind it at a time, and keep the whole system working throughout.',
      },
      {
        kind: 'figure',
        caption: 'The strangler fig: replace a monolith one capability at a time, never in one cut-over.',
        figure: {
          kind: 'cycle',
          steps: [
            { label: 'Route all traffic through a facade', sub: 'the gateway or a reverse proxy' },
            { label: 'Pick one capability at the edge', sub: 'few inbound dependencies: notifications, search' },
            { label: 'Build it as a service with its own data', sub: 'the new service becomes the only writer' },
            { label: 'Shift traffic gradually', sub: 'shadow, then 1%, 10%, 100%, with a way back' },
            { label: 'Delete the old code path', sub: 'the step that gets skipped' },
          ],
          note: 'Then pick the next capability. The monolith shrinks until what is left is small enough to keep, or gone.',
        },
      },
      {
        kind: 'prose',
        text: 'Two steps get skipped, and both leave you worse off than before. **Moving the data**: a new service that still reads the monolith\'s tables is not extracted, it is a remote module coupled through a schema. **Deleting the old path**: a strangler that never removes anything leaves two implementations of the same capability, both in production.',
      },
      { kind: 'heading', text: 'The distributed monolith' },
      {
        kind: 'prose',
        text: 'The worst outcome is not a monolith. It is a system with every cost of microservices and none of the benefit: services that must deploy together, share database tables, and call each other synchronously in long chains. One slow service stalls every request, and one schema change needs five teams in a room.',
      },
      {
        kind: 'list',
        items: [
          'Services that read and write the same tables, so a migration is a coordinated release.',
          '"Deploy these together" in a runbook. If they cannot ship independently, they are one service.',
          'Synchronous chains several services deep for one user request. Availabilities multiply: five services at 99.9% each give about 99.5%, five times the downtime of any one of them.',
          'A shared library of domain models that every service has to upgrade in lockstep.',
          'Chatty boundaries: one page needs dozens of calls between two services, because the boundary cut a single concept in half.',
        ],
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Segment',
        text: 'Segment ran one service per integration destination, more than a hundred of them, all depending on shared libraries that drifted to different versions in different services. A small team could not keep them current, so it merged them back into a single service, and in 2018 wrote up why. Fine-grained services without the teams to own them are a distributed monolith waiting to happen.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Proposing microservices for a greenfield product with one team "so it can scale". The interviewer hears that you will spend the first year building pipelines instead of product, and that you think a monolith cannot run more than one copy. Say what you would start with, and name the pressure that would make you split.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: '"I would start with a modular monolith: one deployable, with orders, billing and catalogue as modules that own their tables and talk through interfaces. I would extract a service when a specific pressure appears, such as teams blocking each other\'s releases or one part needing very different scaling, and do it strangler-fig style behind the gateway."',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'You have 40 engineers on one monolith and deploys keep colliding. What do you do first?',
            a: 'Find out whether the pain is the pipeline or the coupling. Often it is the pipeline: slow tests and a serial release train, fixed with faster builds, feature flags and small frequent deploys. If teams genuinely tread on each other\'s code, enforce module boundaries next, then extract the module with the most release contention behind the existing entry point.',
          },
          {
            q: 'How do you split the database when you extract a service?',
            a: 'The new service gets its own store and becomes the only writer of that data. The monolith stops writing those tables and calls the service instead; queries that joined across the boundary become an [[API]] call, or a local read-only copy fed by events. Never leave both sides writing the same table: that is shared-database coupling with a network in the middle.',
          },
          {
            q: 'How small should a microservice be?',
            a: 'Small enough for one team to own end to end, large enough that one business operation rarely has to cross into another service. Lines of code is the wrong measure. If two services always change together, merge them; if one team cannot hold a service in its head, it is too big.',
          },
          {
            q: 'Is a monolith a single point of failure?',
            a: 'No more than any service: you run many stateless copies behind a load balancer. What it lacks is fault isolation between its parts, because they share a process: a memory leak in reporting can take checkout down with it. Bulkheads inside the process, or extracting the risky part, address that specifically.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-ar-monolith-1',
        moduleId: 'ar-monolith',
        stem: 'A five-person startup is building a new product. The lead proposes twelve microservices "so it can scale". What is the strongest objection?',
        options: [
          'Microservices cannot scale horizontally',
          'One team gets almost none of the benefit, independent deployment, while paying the full operational cost; a monolith scales by running more copies',
          'Twelve is too many; four would be about right',
          'Microservices require Kubernetes, which is expensive',
        ],
        correct: 1,
        explain:
          'The payoff of microservices is independent deployment for many teams. With one team there is nothing to make independent, and a monolith scales horizontally behind a load balancer. Choosing fewer services still pays the bill without the benefit.',
      },
      {
        id: 'q-ar-monolith-2',
        moduleId: 'ar-monolith',
        stem: 'Which is the clearest sign of a distributed monolith?',
        options: [
          'Services written in several different languages',
          'More than twenty services in production',
          'Services that communicate through a message broker',
          'Several services share database tables and have to be deployed together',
        ],
        correct: 3,
        explain:
          'Shared tables and lockstep deploys mean the services are one system split across a network: all of the latency and failure modes, none of the independence. Service count and language mix say nothing about coupling.',
      },
      {
        id: 'q-ar-monolith-3',
        moduleId: 'ar-monolith',
        stem: 'You are extracting notifications from a monolith with the strangler fig pattern. Which step is most often skipped, and costs the most later?',
        options: [
          'Putting a routing facade in front of the monolith',
          'Writing the new service in a newer language',
          'Moving the data and deleting the old code path, so the new service is the only owner',
          'Load testing the new service before launch',
        ],
        correct: 2,
        explain:
          'A service that still reads the monolith\'s tables, with the old code left running beside it, is two systems coupled through a database. The extraction is finished when the new service owns its data and the old path is gone.',
      },
    ],
    cards: [
      {
        id: 'c-ar-monolith-1',
        moduleId: 'ar-monolith',
        front: 'What does Conway\'s law say, and how do you use it?',
        back: 'Systems mirror the communication structure of the organisation that builds them. Use it backwards: shape teams so their boundaries fall where you want the services.',
        tag: 'Architecture',
      },
      {
        id: 'c-ar-monolith-2',
        moduleId: 'ar-monolith',
        front: 'What is the real benefit of microservices?',
        back: 'Independent deployment for many teams. Scaling is the weak argument: a monolith scales by running more copies. One team pays the full cost for none of the benefit.',
        tag: 'Microservices',
      },
      {
        id: 'c-ar-monolith-3',
        moduleId: 'ar-monolith',
        front: 'What is a distributed monolith?',
        back: 'Services that share tables, deploy in lockstep and call each other in long synchronous chains. Every cost of microservices, none of the independence.',
        tag: 'Microservices',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'ar-events',
    trackId: 'architecture',
    title: 'Event-driven architecture',
    station: 2,
    prereqs: ['ar-monolith'],
    related: ['c-queues', 'a-multistep'],
    minutes: 13,
    summary: 'Events versus commands, what goes in the payload, ordering by key, evolving schemas, and the debugging bill.',
    objectives: [
      'Tell an event from a command, and choose thin or fat events',
      'Pick a partition key that preserves the ordering you need',
      'Evolve an event schema without breaking consumers, and make every consumer idempotent',
      'Name the debugging cost of choreography, and how to pay it down',
    ],
    keywords: [
      'event-driven',
      'pub/sub',
      'event notification',
      'event-carried state transfer',
      'partition key',
      'schema registry',
      'idempotent consumer',
      'choreography',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Events are how services stay decoupled after a split: the order service announces that an order was placed and does not care who is listening. Interviewers like the topic because it is easy to draw and hard to run. The arrows are free. The ordering, the duplicates, the schema changes and the 3 a.m. "where did this order go?" are not.',
      },
      {
        kind: 'prose',
        text: 'The survey lesson on queues and streams covered the brokers themselves. This one is the design on top: what you publish, what goes in it, how it is keyed, how it changes over time, and how consumers survive all of that.',
      },
      { kind: 'heading', text: 'Events and commands are different things' },
      {
        kind: 'figure',
        caption: 'A command has one addressee. An event has an audience.',
        figure: {
          kind: 'split',
          left: {
            title: 'Command',
            nodes: [
              { label: 'Orders', to: 'ChargeCard' },
              { label: 'Payments', sub: 'the one handler; may refuse', tone: 'line' },
            ],
            cost: 'One addressee. The sender knows it exists, and usually waits for the answer.',
          },
          right: {
            title: 'Event',
            nodes: [
              { label: 'Orders', to: 'OrderPlaced' },
              { label: 'Broker', to: 'fans out' },
              { label: 'Email, fraud, analytics', sub: 'any number, added later', tone: 'line' },
            ],
            cost: 'An audience the publisher never meets. Adding a subscriber changes no publisher code.',
          },
        },
      },
      {
        kind: 'compare',
        left: {
          title: 'A command: `ChargeCard`',
          points: [
            'Imperative: asks a specific service to do something',
            'Exactly one handler, which can refuse it',
            'The sender depends on the receiver existing',
            'Named as an instruction: `ReserveStock`, `SendInvoice`',
          ],
        },
        right: {
          title: 'An event: `OrderPlaced`',
          points: [
            'A fact: something already happened',
            'Zero to many subscribers; nobody can reject the past',
            'The publisher does not know who listens',
            'Named in the past tense: `PaymentCaptured`, `UserDeleted`',
          ],
        },
        verdict: 'Publish events for facts other teams may care about. Send a command when you need a particular thing done and care whether it worked. Watch for commands dressed as events: `SendWelcomeEmailRequested` couples you to one consumer while pretending not to.',
      },
      { kind: 'heading', text: 'What goes in the event' },
      {
        kind: 'prose',
        text: 'Martin Fowler separates two styles of event, and the choice sets how tightly consumers are bound to the publisher.',
      },
      {
        kind: 'table',
        head: ['', 'Event notification', 'Event-carried state transfer'],
        rows: [
          ['**Payload**', '`{ orderId }` and little else', 'The state that changed: items, totals, address'],
          ['**Consumer needs more**', 'Calls back the publisher\'s [[API]]', 'Already has it, and keeps a local copy'],
          ['**Coupling**', 'Runtime: the publisher must be up', 'Schema: the payload is a contract'],
          ['**Load on publisher**', 'One callback per consumer per event', 'None'],
          ['**Freshness**', 'The latest, read at call time', 'As fresh as the last event received'],
          ['**Pick it when**', 'Few consumers, or data too sensitive to copy', 'Many consumers, or they must keep working while the publisher is down'],
        ],
      },
      {
        kind: 'prose',
        text: 'The callback is the hidden cost of thin events. Ten consumers each fetching the order on every `OrderPlaced` turns one write into ten reads against the order service at the same instant, and ties every consumer\'s availability to it. Fat events remove both problems, at the price of a payload that other teams now depend on.',
      },
      {
        kind: 'prose',
        text: 'My default between teams is event-carried state transfer, with the entity\'s **version number** in every event. Consumers never need the publisher to be up, and the version lets them discard an update older than the one they already hold.',
      },
      { kind: 'heading', text: 'Ordering lives in the partition key' },
      {
        kind: 'prose',
        text: 'Brokers that scale do not give you global order. Kafka orders messages **within a partition**, and a topic has many partitions so that consumers can work in parallel. The producer picks a partition by hashing the message key. So "is ordering guaranteed?" really means "what did you key it by?".',
      },
      {
        kind: 'figure',
        caption: 'A topic keyed by order id: each order\'s events share a partition and stay in sequence.',
        figure: {
          kind: 'grid',
          cols: 3,
          cells: [
            { label: 'A1', tone: 'line' },
            { label: 'A2', tone: 'line' },
            { label: 'A3', tone: 'line' },
            { label: 'B1' },
            { label: 'C1' },
            { label: 'B2' },
            { label: 'D1' },
            { label: 'D2' },
            { label: 'D3' },
          ],
          legend: [
            { tone: 'line', label: 'order A: one partition, always in sequence' },
            { tone: 'neutral', label: 'other orders: in parallel' },
          ],
          note: 'Each row is one partition, read left to right. A2 can never be read before A1. A1 and B1 have no order between them, and need none.',
        },
      },
      {
        kind: 'list',
        items: [
          '**Key by the entity whose events must stay in order**, usually the aggregate id: `orderId`, `accountId`. Everything for one order arrives in order; different orders need no order between them.',
          '**A hot key is a hot partition.** Key by `merchantId` and your largest merchant\'s partition lags while the others idle.',
          '**Adding partitions moves keys.** Kafka maps a key to a partition by hash modulo the partition count, so growing a topic sends a key\'s new events to a different partition while older ones may still be unread on the old one. Provision partitions generously up front.',
          '**Retries can reorder.** A producer that retries a failed send can land message 2 ahead of message 1. Kafka\'s idempotent producer prevents this, and has been on by default since Kafka 3.0.',
          '**Consumers must not fan out within a key.** Handing a partition\'s messages to a thread pool throws its order away. Parallelise across keys, never within one.',
        ],
      },
      {
        kind: 'prose',
        text: 'When the order you need spans entities (debit one account, credit another), no key gives it to you. Carry a per-entity version in each event, and have consumers ignore anything older than what they hold.',
      },
      { kind: 'heading', text: 'Schemas change; consumers must not break' },
      {
        kind: 'prose',
        text: 'An event is a public [[API]] with a nastier property: old messages stay in the log. A consumer replaying last month reads last month\'s shapes. So events need a schema (Avro, Protobuf or JSON Schema), a registry that keeps every version, and a compatibility rule checked whenever a producer publishes a new one.',
      },
      {
        kind: 'table',
        head: ['Change', 'Safe?', 'Why'],
        rows: [
          ['Add an optional field with a default', '**Yes**', 'Old consumers ignore it; new consumers use the default on old messages'],
          ['Remove an optional field', 'Usually', 'Only once no consumer reads it, which you check rather than assume'],
          ['Rename a field', '**No**', 'It is a removal plus an addition, and every consumer breaks at once'],
          ['Change a type or a meaning', '**No**', '`amount` switching from pounds to pence silently corrupts every consumer'],
          ['Add an enum value', 'Careful', 'Consumers with a strict switch throw on the value they have never seen'],
          ['A genuinely new shape', 'New event', 'Publish `OrderPlacedV2` beside v1, migrate consumers, then retire v1'],
        ],
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Confluent Schema Registry',
        text: 'Used with Kafka, it stores every version of a topic\'s schema and refuses a new version that breaks the configured rule. The default, `BACKWARD`, means consumers on the new schema can still read data written with the previous one. It turns "we broke the consumers" from a production incident into a failed deploy.',
      },
      {
        kind: 'prose',
        text: 'Consumers do their half, the **tolerant reader**: read only the fields you need, ignore fields you do not recognise, and give every switch on an enum a default branch.',
      },
      { kind: 'heading', text: 'Every consumer is idempotent' },
      {
        kind: 'prose',
        text: 'Delivery is at-least-once in practice. A consumer applies a message, crashes before committing its offset, and receives it again on restart. A consumer-group rebalance redelivers a batch. A producer retries a send that had actually succeeded. Duplicates are normal operation, so every handler must give the same result when it runs twice.',
      },
      {
        kind: 'figure',
        caption: 'The redelivery is harmless because the event id and the effect commit together.',
        figure: {
          kind: 'sequence',
          actors: ['Broker', 'Consumer', 'Database'],
          steps: [
            { from: 0, to: 1, label: 'event e91: OrderPaid' },
            { from: 1, to: 2, label: 'one transaction: record e91, mark paid' },
            { from: 1, to: 1, label: 'crashes before committing the offset', tone: 'alert' },
            { from: 0, to: 1, label: 'e91 again, after the restart', tone: 'streak' },
            { from: 1, to: 2, label: 'record e91' },
            { from: 2, to: 1, label: 'already recorded: skip', dashed: true, tone: 'mastered' },
            { from: 1, to: 0, label: 'commit offset', dashed: true },
          ],
        },
      },
      {
        kind: 'list',
        items: [
          '**Record processed event ids in the same transaction as the effect.** A unique constraint turns the duplicate into a no-op. This is the workhorse.',
          '**Make the effect naturally idempotent.** "Set order 42 to paid" is safe to repeat; "add £10 to the balance" is not.',
          '**Compare versions.** Apply an update only if its version is newer than the stored one. This handles out-of-order delivery as well as duplicates.',
        ],
      },
      {
        kind: 'prose',
        text: 'Publishing has the mirror-image problem. Writing to your database and then to the broker is a **dual write**: crash between the two and the event is lost, or published for a change that rolled back. The fix is the transactional outbox (write the event to an outbox table in the same transaction, then relay it), often relayed by a [[CDC]] tool such as Debezium. The distributed systems track covers it in full.',
      },
      { kind: 'heading', text: 'Choreography and its bill' },
      {
        kind: 'prose',
        text: 'When services react to each other\'s events with no coordinator, the flow is **choreographed**. Adding a reaction means adding a subscriber and changing nothing else, which is the appeal. The bill comes when something goes wrong: the business process is written down nowhere. It emerges from six services\' subscriptions, and the only complete picture of it is production.',
      },
      {
        kind: 'list',
        items: [
          '**"Where is order 4471?"** has no single answer. Someone reconstructs it from six services\' logs.',
          '**Hidden coupling.** A team changes what `PaymentCaptured` means, and a service they have never heard of breaks.',
          '**Accidental cycles.** A reacts to B, B to C, and C emits something A reacts to. Nobody designed the loop; it appears as an outage.',
          '**No owner for the timeout.** If shipping never reacts, nothing notices, because nothing was waiting.',
        ],
      },
      {
        kind: 'ladder',
        rungs: [
          {
            grade: 'bad',
            title: 'Per-service logs',
            text: 'Grep six systems and line up timestamps by hand, during the incident.',
          },
          {
            grade: 'good',
            title: 'Correlation ids',
            text: 'Every event carries the id of the request that started the flow and of the event that caused it. One search returns the whole story.',
          },
          {
            grade: 'great',
            title: 'Tracing through the broker',
            text: 'Propagate trace context in message headers, so one trace shows every hop, including time spent waiting in the queue. OpenTelemetry\'s Kafka instrumentation does this.',
          },
          {
            grade: 'best',
            title: 'Orchestrate the flows that matter',
            text: 'Give any process with money or a deadline in it an owner: an orchestrator or workflow engine with explicit state and timeouts. Keep choreography for side effects that fan out, such as email and analytics.',
          },
        ],
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Putting a broker between every pair of services and calling it decoupled. If checkout cannot finish without the payment result, an event does not decouple them; it hides a synchronous dependency behind a queue and adds latency to it. Use events for facts others react to, and a direct call or a command when you need the answer.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: '"Order events are keyed by `orderId`, so each order\'s events stay in sequence while different orders process in parallel. Events carry the changed state and a version, consumers are idempotent on the event id, and every event carries a correlation id so we can follow one order across services."',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'A consumer was down for six hours. What happens when it comes back?',
            a: 'With a log-based broker like Kafka it resumes from its last committed offset and works through the backlog, as long as retention is longer than the outage. Watch consumer lag, scale consumers up to the partition count to catch up, and make sure catching up does not flatten whatever the consumer writes to. Messages that fail along the way go to a [[DLQ]] rather than blocking the rest.',
          },
          {
            q: 'How do you handle a poison message that crashes the consumer every time?',
            a: 'Retry a bounded number of times with backoff, then park it on a dead-letter topic, alert a human and carry on. If that key\'s order matters, decide explicitly: skipping the message breaks the sequence for that key, so some systems park every later message for the same key until the bad one is resolved.',
          },
          {
            q: 'Thin or fat events for a user-profile change?',
            a: 'Fat, with the changed fields and a version, if many services keep a copy of the profile: they stay correct while the profile service is down and do not stampede it on every change. Thin if the payload is sensitive, because a fat event copies personal data into every consumer\'s store and makes erasure requests much harder.',
          },
          {
            q: 'Can Kafka give you exactly-once?',
            a: 'Within Kafka, yes: idempotent producers plus transactions make a read-process-write loop between topics exactly-once. The moment the effect leaves Kafka, such as a database write or an email, you are back to at-least-once delivery plus an idempotent consumer. Drawing that line unprompted tells the interviewer you have used it.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-ar-events-1',
        moduleId: 'ar-events',
        stem: 'Ten services each need the shipping address whenever an order is placed. The order service publishes `OrderPlaced { orderId }`. What problem does this create?',
        options: [
          'The events will arrive out of order',
          'Each consumer calls back the order service for every event, multiplying its load and tying every consumer\'s availability to it',
          'The broker cannot deliver one event to ten consumers',
          'Consumers cannot be idempotent when events are thin',
        ],
        correct: 1,
        explain:
          'Thin events push the fetch onto every consumer: one order becomes ten simultaneous reads, and the consumers fail whenever the order service does. Carrying the address in the event removes both problems, at the cost of a payload that is now a contract.',
      },
      {
        id: 'q-ar-events-2',
        moduleId: 'ar-events',
        stem: 'Order events go to a 12-partition Kafka topic keyed by `customerId`. Which statement is true?',
        options: [
          'Every event is delivered in one global order',
          'Events for one order are in order, but events for one customer are not',
          'Events for one customer stay in order relative to each other; there is no order across customers',
          'Ordering is random, because partitions are assigned round-robin',
        ],
        correct: 2,
        explain:
          'The key picks the partition and a partition is ordered, so everything for one customer is in order, which includes each of their orders. Nothing is ordered across partitions. Only messages with no key are spread across partitions regardless of content.',
      },
      {
        id: 'q-ar-events-3',
        moduleId: 'ar-events',
        stem: 'Which change to a published event schema is safe without coordinating with consumers?',
        options: [
          'Renaming `total` to `amount`',
          'Changing `amount` from pounds to pence',
          'Making an optional field required',
          'Adding a new optional field with a default value',
        ],
        correct: 3,
        explain:
          'Old consumers ignore the new field and new consumers use the default on old messages. A rename is a removal plus an addition, a unit change silently corrupts every consumer, and a newly required field fails on every message already in the log.',
      },
    ],
    cards: [
      {
        id: 'c-ar-events-1',
        moduleId: 'ar-events',
        front: 'Event or command?',
        back: 'A command asks one service to do something, and can be refused. An event states a fact that already happened, for any number of listeners.',
        tag: 'Events',
      },
      {
        id: 'c-ar-events-2',
        moduleId: 'ar-events',
        front: 'How do you get ordering from Kafka?',
        back: 'Order holds only within a partition, so key by the entity whose events must stay in sequence, usually the aggregate id. Nothing is ordered across keys.',
        tag: 'Events',
      },
      {
        id: 'c-ar-events-3',
        moduleId: 'ar-events',
        front: 'Event notification or event-carried state transfer?',
        back: 'Notification: a thin id, consumers call back, runtime coupling. State transfer: the data travels in the event, consumers keep a copy, schema coupling.',
        tag: 'Events',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'ar-cqrs',
    trackId: 'architecture',
    title: 'CQRS and event sourcing',
    station: 3,
    prereqs: ['ar-events'],
    related: ['c-queues', 'a-reads'],
    minutes: 12,
    summary: 'Separate the model you write from the models you read, and when to store the events instead of the state.',
    objectives: [
      'Explain [[CQRS]] and build read models as projections of the write side',
      'Describe event sourcing: the event store, replay, snapshots and versioned events',
      'Say when each pays off and when it hurts, and that they are separate choices',
    ],
    keywords: [
      'command query responsibility segregation',
      'event sourcing',
      'projection',
      'read model',
      'materialised view',
      'event store',
      'snapshot',
      'upcasting',
    ],
    lesson: [
      {
        kind: 'prose',
        text: '[[CQRS]] and event sourcing are the two most over-applied ideas in this track, and interviewers know it. The signal is not knowing the definitions. It is knowing that they are two separate decisions, what each one costs, and the narrow set of problems where the cost is worth paying.',
      },
      { kind: 'heading', text: 'CQRS: one model to write, others to read' },
      {
        kind: 'prose',
        text: 'Command query responsibility segregation takes Bertrand Meyer\'s rule that a method should either change state or return data, never both, and applies it to whole models. The **write model** handles commands: it validates, enforces invariants ("never sell more seats than the venue holds") and stores the result in whatever shape keeps those rules simple. The **read models** serve queries: denormalised, pre-joined, one per screen or search if need be, and kept up to date from the write side\'s changes.',
      },
      {
        kind: 'figure',
        caption: 'Commands go to one model, queries to others, and projections connect them.',
        figure: {
          kind: 'flow',
          nodes: [
            { label: 'PlaceOrder', sub: 'a command', to: 'validate' },
            { label: 'Write model', sub: 'invariants, normalised', tone: 'line', to: 'emits changes' },
            { label: 'Projections', sub: 'one consumer per view', to: 'upsert' },
            { label: 'Read models', sub: 'search index, cache, wide table', tone: 'mastered' },
          ],
          note: 'Queries never touch the write model. The arrow from write to read is asynchronous, so the read side lags.',
        },
      },
      {
        kind: 'prose',
        text: 'Why bother? In many systems the two sides want opposite things. An order\'s write side wants one normalised row per fact and a transaction around them. Its read side wants "this customer\'s orders, with product names and tracking, newest first", a search box across all orders, and a revenue dashboard by region. One schema serving all four is a compromise for every one of them.',
      },
      {
        kind: 'prose',
        text: 'The counterweight: a plain [[CRUD]] service with one model is simpler, immediately consistent, and correct for the large majority of services. CQRS is a tool for the few places where read and write shapes have genuinely diverged.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'LinkedIn\'s Databus',
        text: 'LinkedIn built Databus to stream committed changes out of its primary databases into the systems that serve reads: the search index, the social graph, caches. Each is a read model shaped for its own queries, fed from one source of truth. In effect that is CQRS at company scale with no event sourcing anywhere: the write side stores ordinary state, and the projections read its change log.',
      },
      { kind: 'heading', text: 'Projections, and the lag they create' },
      {
        kind: 'prose',
        text: 'A **projection** is a consumer that folds a stream of changes into a read model. It is the event consumer from the previous lesson with a single job, and it inherits every rule: idempotent on event id or version, keyed so one entity\'s changes apply in order, and resumable from its last position.',
      },
      {
        kind: 'prose',
        text: 'The property that makes projections powerful is that a read model is **disposable**. If it has a bug, or you need a new view, you build a fresh projection and run it over the history. That only works if the history is still there, which is the bridge to event sourcing.',
      },
      {
        kind: 'prose',
        text: 'The cost is lag. The user places an order, the app moves to "My orders", and the order is missing because the projection is 300 ms behind. Users retry, and now there are two orders. This is the most common way CQRS turns up in a bug tracker.',
      },
      {
        kind: 'ladder',
        rungs: [
          {
            grade: 'bad',
            title: 'Ignore the lag',
            text: 'Users see their own action vanish, try again, and create duplicates.',
          },
          {
            grade: 'good',
            title: 'Read recent writes from the write model',
            text: 'Simple, but it routes query load back to the side you separated. Keep it to the few screens that need it.',
          },
          {
            grade: 'great',
            title: 'Return the result from the command',
            text: 'The command responds with the new order and the client renders it directly, marked as processing. Right for the screen that issued it.',
          },
          {
            grade: 'best',
            title: 'Version tokens',
            text: 'The command returns the new version; the next query passes it, and the read side waits briefly for the projection to reach it, falling back to the write model if it does not. Exact read-your-writes without coupling every write to every view.',
          },
        ],
      },
      { kind: 'heading', text: 'Event sourcing: store what happened' },
      {
        kind: 'prose',
        text: 'Most systems store current state and overwrite it. **Event sourcing** stores the sequence of events instead (`Opened`, `Deposited 50`, `Withdrew 20`) and derives current state by replaying them. The events are the source of truth. Any table showing a balance is a projection you could drop and rebuild.',
      },
      {
        kind: 'code',
        code: `type AccountEvent =
  | { type: 'Opened'; owner: string }
  | { type: 'Deposited'; amount: number }
  | { type: 'Withdrew'; amount: number }

// Current state is a fold over the stream.
function balance(events: AccountEvent[]): number {
  return events.reduce((b, e) => {
    if (e.type === 'Deposited') return b + e.amount
    if (e.type === 'Withdrew') return b - e.amount
    return b
  }, 0)
}

// Append only if nobody has written since version 7.
await store.append('account-42', [withdrew], {
  expectedVersion: 7,
})`,
        caption: 'State is a fold over the events. Each append names the version it read, which is optimistic concurrency for free.',
      },
      {
        kind: 'prose',
        text: 'The **event store** is an append-only log split into streams, one per aggregate (`account-42`). Two operations matter: read a stream from a position, and append to a stream only if its current version is the one you expect. That conditional append is the concurrency control: two commands that both read version 7 cannot both write version 8. EventStoreDB (since renamed KurrentDB) is built for this, Marten implements it on Postgres, and a table with a unique `(stream_id, version)` constraint gets you most of the way.',
      },
      {
        kind: 'prose',
        text: 'An account with ten years of history is slow to fold on every command. Store a **snapshot** of the folded state every few hundred events, then load the latest snapshot plus the events after it.',
      },
      {
        kind: 'figure',
        caption: 'Loading one aggregate with and without a snapshot.',
        figure: {
          kind: 'timeline',
          ticks: ['event 0', 'event 500', 'event 1,000'],
          lanes: [
            {
              label: 'Replay from the start',
              bars: [{ from: 0, to: 1, label: 'fold all 1,000 events', tone: 'streak' }],
              outcome: { label: 'slow load', tone: 'streak' },
            },
            {
              label: 'From the latest snapshot',
              bars: [
                { from: 0, to: 0.9, label: 'covered by the snapshot at 900', tone: 'neutral' },
                { from: 0.9, to: 1, label: '100', tone: 'mastered' },
              ],
              outcome: { label: 'fast load', tone: 'mastered' },
            },
          ],
          note: 'A snapshot is a cached fold, not the truth. Delete every snapshot and the state can still be rebuilt from the events.',
        },
      },
      { kind: 'heading', text: 'Versioning events you can never change' },
      {
        kind: 'prose',
        text: 'Events are immutable and kept forever, so this year\'s code will be reading events written five years ago. Three tools, in order of preference:',
      },
      {
        kind: 'list',
        ordered: true,
        items: [
          '**Add only, with defaults.** New optional fields, as with any event schema. This covers most changes.',
          '**Upcast on read.** A small function converts a v1 event to the v2 shape as it loads, so domain code only ever sees the latest version. The stored event is untouched.',
          '**Introduce a new event type** when the meaning changes. Add `AddressCorrected` rather than quietly reinterpreting `AddressChanged`.',
        ],
      },
      {
        kind: 'prose',
        text: 'Never edit history in place. If an event was wrong, append a correcting event, the way an accountant posts a reversing entry instead of rubbing out the ledger.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Double-entry ledgers',
        text: 'Accounting has been event-sourced for more than five centuries. A ledger never erases a line: a mistake is corrected by posting a reversing entry, and an account\'s balance is the sum of its entries. When an auditor asks why a balance is what it is, the answer is the list of entries. A complete, immutable history that someone outside the team will demand is the requirement that most justifies event sourcing in software.',
      },
      { kind: 'heading', text: 'Two decisions, not one' },
      {
        kind: 'prose',
        text: 'You can run CQRS without event sourcing: keep a normal state-based write model and feed read models from [[CDC]] or an outbox, as Databus does. You can, in principle, event-source without CQRS, but in practice you always end up building projections, because "find every overdrawn account" across millions of raw streams is miserable. Treat them as two choices and justify each one.',
      },
      {
        kind: 'figure',
        caption: 'Two independent choices. Most services need neither.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Do reads need shapes the write model cannot serve?',
            yes: {
              question: 'Is the full history itself a requirement?',
              yes: { answer: 'CQRS on event sourcing', sub: 'the events feed every read model', tone: 'line' },
              no: { answer: 'CQRS on a state store', sub: 'projections fed by CDC or an outbox', tone: 'mastered' },
            },
            no: {
              question: 'Is the full history itself a requirement?',
              yes: { answer: 'Event-source that one part', sub: 'usually a ledger, with a few projections', tone: 'line' },
              no: { answer: 'Plain CRUD', sub: 'one model, one database: the default', tone: 'mastered' },
            },
          },
        },
      },
      {
        kind: 'compare',
        left: {
          title: 'Pays off when',
          points: [
            'History is the product: ledgers, audit trails, "what did this look like on 3 March?"',
            'Read and write shapes diverge: one write model, a search index, a dashboard',
            'The domain is rich in rules, and the business already talks in events',
            'You will want new views over old data that you cannot predict today',
          ],
        },
        right: {
          title: 'Hurts when',
          points: [
            'The service is mostly CRUD forms: several times the code for the same screens',
            'Users must read their own writes everywhere, and lag becomes a stream of bugs',
            'The team has never run projections, replays and upcasters in production',
            'You must delete data: an immutable history and an erasure request pull opposite ways',
          ],
        },
        verdict: 'Apply them to the one part of the system that needs them, such as the ledger or the order history. Never to a whole system by default.',
      },
      {
        kind: 'prose',
        text: 'Have the deletion answer ready. Under [[GDPR]] a user can demand erasure, and you cannot edit an immutable log. The standard technique is **crypto-shredding**: encrypt each person\'s personal data inside the events with a key held per person, and delete the key. The events stay; the personal data in them becomes unreadable.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Answering "how do you scale the reads?" with "CQRS and event sourcing". Read replicas, caches and a search index handle most read scaling with a fraction of the machinery. Reach for CQRS when the read and write **shapes** diverge, and for event sourcing only when the history itself is a requirement, and name the requirement in the prompt that pulls you there.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: '"Orders stay a plain state-based service with an outbox, and the order-history and search views are projections fed from it. Only the ledger is event-sourced, because there the audit history is a requirement, not a nice-to-have."',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'A projection has a bug and has written wrong data for a week. What now?',
            a: 'Fix the projection code, build a new read model beside the old one, and replay the history into it from the start. When it has caught up to the live position, switch reads over and drop the old one. This only works if the events or change log are retained long enough, which is why retention is a design decision rather than a default.',
          },
          {
            q: 'Two commands try to withdraw from the same account at once. How does an event-sourced system prevent an overdraft?',
            a: 'Both load the stream at version 7 and decide the withdrawal is allowed. Both try to append with expected version 7; the store accepts the first and rejects the second with a concurrency error. The second command reloads at version 8, re-checks the balance and fails cleanly. The conditional append protects the invariant, not a lock.',
          },
          {
            q: 'How do you query across aggregates, such as "all overdrawn accounts"?',
            a: 'Not against the event store. Build a projection that maintains exactly that view and updates it as balances change. The event store answers "give me this stream"; every other question is a read model.',
          },
          {
            q: 'How long do replays take as the store grows?',
            a: 'Linear in the number of events, so a full rebuild of a busy projection can take hours. Partition the replay by stream so it runs in parallel, checkpoint projections at known positions, and measure rebuild time the way you would measure a backup restore: before you need it.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-ar-cqrs-1',
        moduleId: 'ar-cqrs',
        stem: 'Which statement about CQRS and event sourcing is correct?',
        options: [
          'CQRS requires event sourcing',
          'Event sourcing removes the need for read models',
          'They are independent: CQRS can be fed from a state-based write model through CDC or an outbox',
          'Both require a separate database for every read model',
        ],
        correct: 2,
        explain:
          'CQRS separates read and write models; how the read side is fed is a separate choice. Event sourcing in practice needs projections, because querying across raw streams is impractical. Neither prescribes how many databases you run.',
      },
      {
        id: 'q-ar-cqrs-2',
        moduleId: 'ar-cqrs',
        stem: 'A user places an order and the "My orders" page, served from a projection, does not show it. What is the best fix?',
        options: [
          'Update the projection synchronously inside the order transaction',
          'Have the command return the new version, and have the next read wait briefly for the projection to reach it',
          'Put a cache in front of the read model',
          'Ask users to refresh the page',
        ],
        correct: 1,
        explain:
          'The projection lags by design. A version token gives exact read-your-writes to the user who wrote, without coupling every write to every read model. Updating projections synchronously throws away the independence that justified CQRS, and a cache adds a second source of staleness.',
      },
      {
        id: 'q-ar-cqrs-3',
        moduleId: 'ar-cqrs',
        stem: 'An event-sourced aggregate has 200,000 events and takes seconds to load. What is the standard fix?',
        options: [
          'Delete events once they are older than a year',
          'Merge the events into one large event',
          'Load only the last 100 events',
          'Store periodic snapshots, and load the latest snapshot plus the events after it',
        ],
        correct: 3,
        explain:
          'A snapshot is a cached fold: load it, then apply the few events since. The events remain the truth, so snapshots can be thrown away and rebuilt. Deleting or merging events destroys the history that justified event sourcing, and loading only recent events gives the wrong state.',
      },
    ],
    cards: [
      {
        id: 'c-ar-cqrs-1',
        moduleId: 'ar-cqrs',
        front: 'What is [[CQRS]]?',
        back: 'Separate models for writing and reading. The write model enforces invariants; read models are denormalised projections, updated asynchronously, so reads lag writes.',
        tag: 'CQRS',
      },
      {
        id: 'c-ar-cqrs-2',
        moduleId: 'ar-cqrs',
        front: 'What is event sourcing?',
        back: 'Store the events, not the state. State is a fold over the stream; appends check the expected version; snapshots speed loading; history is never edited.',
        tag: 'Event sourcing',
      },
      {
        id: 'c-ar-cqrs-3',
        moduleId: 'ar-cqrs',
        front: 'When does event sourcing pay off?',
        back: 'When history is a requirement: ledgers, audit trails, temporal queries. For ordinary CRUD it multiplies code and operational load for no gain.',
        tag: 'Event sourcing',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'ar-api',
    trackId: 'architecture',
    title: 'API design in depth',
    station: 4,
    prereqs: ['ar-cqrs'],
    related: ['f-api'],
    minutes: 15,
    summary: 'REST, GraphQL or gRPC; resources, cursors, versions, idempotency keys, errors, and the rules for changing a live API.',
    objectives: [
      'Choose [[REST]], GraphQL or [[gRPC]] for a given client, and say what each costs',
      'Design resources, cursor pagination and idempotent creates that survive retries',
      'Version an API, return useful errors and rate-limit headers, and change it without breaking clients',
    ],
    keywords: [
      'GraphQL',
      'cursor pagination',
      'keyset',
      'idempotency key',
      'versioning',
      'problem details',
      'rate limit headers',
      'backward compatibility',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'The foundations lesson covered the API you sketch in the room: one endpoint per feature, the caller\'s identity from the token rather than the body, cursors over offsets. This is the version a senior interviewer pushes on. What happens when a client retries a payment? Why is page 5,000 slow? How do you rename a field that two hundred integrations read?',
      },
      {
        kind: 'prose',
        text: 'An [[API]] outlives the code behind it. You can rewrite a service in a quarter; a public field, once a customer\'s integration reads it, is close to permanent. That asymmetry is why API design gets its own lesson.',
      },
      { kind: 'heading', text: 'REST, GraphQL or gRPC' },
      {
        kind: 'table',
        head: ['', 'REST', 'GraphQL', 'gRPC'],
        rows: [
          ['**Shape**', 'Resources, with [[HTTP]] methods as the operations', 'One endpoint; the client asks for exactly the fields it wants', 'Typed methods generated from a Protobuf schema'],
          ['**Wire**', 'JSON over HTTP', 'JSON over HTTP, usually one POST endpoint', 'Binary Protobuf over HTTP/2'],
          ['**Caching**', 'HTTP caches and [[CDN|CDNs]] work as they are', 'Hard: one URL, varied bodies', 'None at the HTTP layer'],
          ['**Browsers**', 'Native', 'Native', 'Only through gRPC-Web, usually via a proxy'],
          ['**Streaming**', 'Added on: [[SSE]], [[WebSocket|WebSockets]]', 'Subscriptions, added on', 'Built in, in both directions'],
          ['**Main cost**', 'Over- and under-fetching for varied clients', 'Query cost limits, N+1 resolvers, caching', 'Opaque on the wire; needs tooling to debug'],
          ['**Pick it for**', 'Public APIs and most product APIs', 'Many clients needing different slices of one graph', 'Internal service-to-service calls at volume'],
        ],
      },
      {
        kind: 'prose',
        text: 'Pick by the client, not by taste. **[[REST]]** for a public API: every language has an HTTP client, every proxy understands it, and caching is free. **GraphQL** earns its complexity when many clients (web, iOS, Android, partners) need different slices of one connected graph, which is why Facebook built it for its mobile apps. **[[gRPC]]** belongs behind the edge, where both ends are your services and the schema, the speed and the streaming pay off. It is an [[RPC]] framework: you call a method, not a resource.',
      },
      { kind: 'heading', text: 'Resources, not procedures' },
      {
        kind: 'prose',
        text: 'Resources are nouns; the HTTP method is the verb. The design questions are which nouns, how deeply to nest them, and what to do with actions that are not create, read, update or delete.',
      },
      {
        kind: 'code',
        code: `GET    /v1/orders?status=open&limit=20
POST   /v1/orders                      -> 201, Location
GET    /v1/orders/{orderId}
PATCH  /v1/orders/{orderId}            { "note": "gift" }
GET    /v1/orders/{orderId}/items
POST   /v1/orders/{orderId}/cancellation  -> 202
GET    /v1/orders/{orderId}/cancellation
POST   /v1/refunds  { "orderId": "o_81", "amount": 1200 }`,
        caption: 'Plural nouns, one level of nesting, and actions modelled as resources you create.',
      },
      {
        kind: 'list',
        items: [
          '**Nest one level at most.** `/orders/{id}/items` reads well. `/customers/{c}/orders/{o}/items/{i}` makes the client know every ancestor; once a resource has its own id, give it a top-level address.',
          '**Turn actions into resources.** Cancelling is `POST /orders/{id}/cancellation`, not `POST /cancelOrder`. The cancellation then has a state you can fetch, which matters when it completes asynchronously.',
          '**Return the status codes clients branch on**: `201` with a `Location` header for a create, `202` for accepted but not finished, `409` for a state conflict, `422` for invalid input, `429` for rate limiting.',
          '**Money is an integer in minor units, with a currency**: `1200` and `"GBP"`, never `12.00` as a float.',
        ],
      },
      { kind: 'heading', text: 'Pagination: offset and cursor' },
      {
        kind: 'prose',
        text: 'Two ways to ask for the next page, and they behave very differently once the table is large or being written to.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Offset',
          code: `GET /v1/orders?limit=20&offset=40

SELECT * FROM orders
WHERE customer_id = $1
ORDER BY created_at DESC
LIMIT 20 OFFSET 40;`,
        },
        after: {
          title: 'Cursor (keyset)',
          code: `GET /v1/orders?limit=20&cursor=eyJ0IjoiMjAy...

-- the cursor decodes to the last row seen
SELECT * FROM orders
WHERE customer_id = $1
  AND (created_at, id) < ($2, $3)
ORDER BY created_at DESC, id DESC
LIMIT 21;  -- one extra: is there a next page?`,
        },
        note: 'The cursor is an opaque, encoded position: the last row\'s sort key plus its id as a tie-breaker. One index on (customer_id, created_at, id) serves every page at the same cost.',
      },
      {
        kind: 'figure',
        caption: 'The same scroll, with three new orders arriving between page 1 and page 2.',
        figure: {
          kind: 'split',
          left: {
            title: 'Offset',
            tone: 'alert',
            nodes: [
              { label: 'Read page 1', sub: 'rows 1–20', to: 'meanwhile' },
              { label: '3 new orders', sub: 'land at the top', to: 'then' },
              { label: 'Read page 2', sub: 'rows 21–40: old 18–20 again', tone: 'alert' },
            ],
            cost: 'Inserts shift every later page, so users see repeats. Deletes make them skip rows.',
          },
          right: {
            title: 'Cursor',
            tone: 'mastered',
            nodes: [
              { label: 'Read page 1', sub: 'ends at order 8812', to: 'meanwhile' },
              { label: '3 new orders', sub: 'land before the cursor', to: 'then' },
              { label: 'Read page 2', sub: 'starts after 8812, no repeats', tone: 'mastered' },
            ],
            cost: 'The cursor names a position in the data, not a count of rows.',
          },
          verdict: 'Cursors for anything users scroll and anything large. Offsets only for small data where jumping to page N matters.',
        },
      },
      {
        kind: 'figure',
        caption: 'Rows the database reads to serve one page of 20.',
        figure: {
          kind: 'scale',
          items: [
            { label: 'Cursor, any page', display: '20 rows', value: 20, tone: 'mastered' },
            { label: 'Offset, page 1', display: '20 rows', value: 20 },
            { label: 'Offset, page 50', display: '1,000 rows', value: 1_000, tone: 'streak' },
            { label: 'Offset, page 5,000', display: '100,000 rows', value: 100_000, tone: 'alert' },
          ],
          note: 'An offset reads and throws away every row before the page. A keyset cursor seeks straight to its position in the index.',
        },
      },
      {
        kind: 'prose',
        text: 'Cursors cost you "jump to page 47" and "page 3 of 120". For feeds, lists and exports nobody needs either. Make the cursor **opaque** (an encoded position, ideally signed) so clients cannot construct one and you are free to change what is inside it.',
      },
      { kind: 'heading', text: 'Idempotency keys: making POST safe to retry' },
      {
        kind: 'prose',
        text: '`GET`, `PUT` and `DELETE` are idempotent by definition: doing them twice leaves the same state as doing them once. `POST` is not, and clients retry. The request reaches the server, the charge succeeds, the response is lost on a flaky mobile connection, and the client tries again. Without protection, the customer pays twice.',
      },
      {
        kind: 'prose',
        text: 'The fix is an **idempotency key**. The client generates a unique key (a [[UUID]]) per logical operation and sends it in a header. The server records the key with the outcome, and any retry carrying the same key gets the stored response instead of a second execution. Stripe\'s `Idempotency-Key` header is the reference design.',
      },
      {
        kind: 'figure',
        caption: 'The retry is answered from the key store, so the payment runs once.',
        figure: {
          kind: 'sequence',
          actors: ['Client', 'API', 'Key store', 'Payments'],
          steps: [
            { from: 0, to: 1, label: 'POST /charges, key k1' },
            { from: 1, to: 2, label: 'claim k1: in progress' },
            { from: 1, to: 3, label: 'charge £12' },
            { from: 1, to: 2, label: 'save k1 with the 201' },
            { from: 1, to: 0, label: '201, lost in transit', dashed: true, tone: 'alert' },
            { from: 0, to: 1, label: 'retry with key k1', tone: 'streak' },
            { from: 1, to: 2, label: 'look up k1' },
            { from: 2, to: 1, label: 'stored 201', dashed: true },
            { from: 1, to: 0, label: 'same 201, no second charge', dashed: true, tone: 'mastered' },
          ],
        },
      },
      {
        kind: 'list',
        items: [
          '**Claim the key before doing the work**, and record the result with it, so a crash cannot leave a charge with no record of its key.',
          '**Concurrent retries.** A second request with the same key arrives while the first is still running. Return `409 Conflict` and let the client retry later; never execute both.',
          '**Same key, different body** is a client bug. Store a hash of the request and reject a mismatch rather than replaying an unrelated response.',
          '**Expire keys** after a window longer than any client retries. Stripe keeps them for at least 24 hours.',
          '**Scope keys to the caller**, so one customer\'s key can never collide with another\'s.',
        ],
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Saying "the client should not retry", or "we reject an identical charge within a minute". The first is impossible on real networks. The second blocks a customer who genuinely buys the same thing twice, and still double-charges a retry that arrives after the window. Only the client knows whether a request is a retry, so the client mints the key and the server honours it.',
      },
      { kind: 'heading', text: 'Errors and rate limits' },
      {
        kind: 'prose',
        text: 'An error response is part of the contract, because clients branch on it. Give it a stable, machine-readable shape. **Problem details**, [[RFC]] 9457, is the standard one: a `type` (a [[URL]] naming the error class, the thing clients branch on), a human `title`, the `status`, a `detail` for this occurrence, and room for your own fields.',
      },
      {
        kind: 'code',
        code: `HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "type": "https://api.acme.com/errors/insufficient-funds",
  "title": "Insufficient funds",
  "status": 422,
  "detail": "Balance is 300; this charge needs 1200.",
  "instance": "/v1/charges/req_8f2a",
  "balance": 300
}`,
        caption: 'A problem details error: a stable type to branch on, text for humans, and extension fields for specifics.',
      },
      {
        kind: 'prose',
        text: 'A rate-limited client needs three facts: its limit, what is left, and when to come back. `429 Too Many Requests` with `Retry-After` is standard HTTP. For the rest, GitHub\'s `x-ratelimit-limit`, `x-ratelimit-remaining` and `x-ratelimit-reset` are the widely copied convention, and a standards draft defines `RateLimit` headers along the same lines. Send the remaining count on every response, not just on the 429, so well-behaved clients slow down before they hit the wall.',
      },
      {
        kind: 'code',
        code: `HTTP/1.1 429 Too Many Requests
Retry-After: 30
x-ratelimit-limit: 5000
x-ratelimit-remaining: 0
x-ratelimit-reset: 1763467230`,
        caption: 'Tell the client when to come back, so its retry is not a guess.',
      },
      { kind: 'heading', text: 'Versioning, and changing a live API' },
      {
        kind: 'table',
        head: ['Strategy', 'Looks like', 'Trade-off'],
        rows: [
          ['**[[URL]] path**', '`/v1/orders`', 'Visible, easy to route and log. Versions the whole API at once, so v2 tends to become a big-bang rewrite.'],
          ['**Header**', '`Accept: application/vnd.acme.v2+json`', 'Clean URLs and finer grain. Invisible in links and logs, and easy to forget.'],
          ['**Date-pinned**', '`Stripe-Version: 2024-06-20`', 'Each account is pinned to a version and the server translates. The most work for you, the least for clients.'],
          ['**Evolve only**', 'No versions; additive changes forever', 'Common for internal and GraphQL APIs. Needs discipline and a deprecation process.'],
        ],
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Stripe',
        text: 'Stripe pins each account to the API version that was current when it first made a request. Breaking changes ship as a new dated version, and internally each change is a small module that transforms responses back into the older shape. An integration written years ago keeps working untouched, and a client can try newer behaviour per request with the `Stripe-Version` header.',
      },
      {
        kind: 'prose',
        text: 'My default for a public API: a major version in the path (`/v1`), because it is visible and routable, plus a firm commitment never to need `/v2` by following the compatibility rules below. A new major version means running two APIs until the last client moves, which for a public API can take years.',
      },
      {
        kind: 'prose',
        text: 'The rule underneath everything: **a change is safe if every existing client keeps working without changing a line**. Hyrum\'s law makes that harder than it sounds: with enough users, every observable behaviour of your API, including ones you never promised, such as field order or the wording of an error, is depended on by somebody.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Backward compatible',
          points: [
            'Add an endpoint',
            'Add an optional request field, defaulting to the old behaviour',
            'Add a field to a response',
            'Relax a validation rule, accepting more than before',
            'Add an enum value, if clients were told to expect unknown ones',
          ],
        },
        right: {
          title: 'Breaking',
          points: [
            'Remove or rename a field or an endpoint',
            'Change a type: `id` from number to string',
            'Make an optional field required, or tighten validation',
            'Change a default, a status code, or what a field means',
            'Change ordering, pagination or auth behaviour that clients rely on',
          ],
        },
        verdict: 'Expand, then contract. Add the new field beside the old one, migrate clients, announce the old one with `Deprecation` and `Sunset` headers and a date, and remove it only when nobody is left or the date has passed.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: '"`POST /charges` takes an `Idempotency-Key` header, and the server keeps the key with its response for 24 hours, so a retry returns the original result instead of charging twice. Lists use opaque cursors on `(created_at, id)`, errors are problem details, and changes are additive only, so `/v1` never needs a `/v2`."',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Why not dedupe on a hash of the request body instead of a client key?',
            a: 'Because two identical requests can be two genuine intents: a customer can buy the same £12 item twice. Only the client knows whether a request is a retry of one operation or a new one, so the client mints the key. The body hash still earns its place, for detecting a key reused with a different body.',
          },
          {
            q: 'How do you paginate when the sort column is not unique, like `created_at`?',
            a: 'Add a unique tie-breaker, usually the primary key, to both the sort and the cursor: order by `created_at` then `id`, and encode both in the cursor. Without it, rows sharing a timestamp at a page boundary are skipped or repeated. Back it with a composite index on the same columns, in the same order.',
          },
          {
            q: 'A screen needs data from five services. Do you change their APIs?',
            a: 'Not the five services. Put an aggregation layer for that client in front of them, a backend-for-frontend or a GraphQL layer, that fans out and shapes one response. The services\' APIs stay about their own resources, and the client gets one round trip.',
          },
          {
            q: 'How would you rename a field in a public API?',
            a: 'Expand and contract. Return both names, mark the old one deprecated with a sunset date, and contact the clients still sending it in requests. You cannot see which clients read a response field, so remove the old name only in a new version or once the sunset date has passed, never quietly in place.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-ar-api-1',
        moduleId: 'ar-api',
        stem: 'A mobile client\'s `POST /charges` times out and it retries. How do you guarantee the customer is charged once?',
        options: [
          'Reject any charge for the same amount from the same customer within 60 seconds',
          'Document that clients must not retry POST requests',
          'The client sends an idempotency key; the server stores it with the result and returns the stored response for a repeat',
          'Wrap the charge in a database transaction',
        ],
        correct: 2,
        explain:
          'Only the client knows whether a request is a retry, so it mints the key, and the server makes the retry return the first result. A time-window dedupe blocks genuine repeat purchases, forbidding retries is impossible on real networks, and a transaction makes one attempt atomic without stopping a second attempt.',
      },
      {
        id: 'q-ar-api-2',
        moduleId: 'ar-api',
        stem: 'Page 5,000 of an offset-paginated list takes seconds to load. Why, and what is the fix?',
        options: [
          'The database reads and discards every earlier row; switch to a keyset cursor that seeks to the last row seen',
          'The page size is too small; raise it to 500',
          'An index is missing; add one on the primary key',
          'Cache every page in Redis',
        ],
        correct: 0,
        explain:
          'An offset of 100,000 makes the database walk 100,000 rows only to throw them away. A keyset cursor on `(created_at, id)` uses the index to jump straight to the position, so every page costs the same. Bigger pages and caches only move the cliff.',
      },
      {
        id: 'q-ar-api-3',
        moduleId: 'ar-api',
        stem: 'Which change to a public REST API is backward compatible?',
        options: [
          'Changing `id` from a number to a string',
          'Adding a new field to a response',
          'Making the optional `currency` field required',
          'Returning `400` instead of `422` for validation errors',
        ],
        correct: 1,
        explain:
          'Clients that ignore unknown fields keep working when a response gains one. A type change, a newly required field and a different status code each break clients that worked yesterday, however small the change looks.',
      },
    ],
    cards: [
      {
        id: 'c-ar-api-1',
        moduleId: 'ar-api',
        front: 'How does an idempotency key work?',
        back: 'The client sends a unique key per operation; the server stores the key with its response and replays it on a retry. Same key, different body: reject.',
        tag: 'API design',
      },
      {
        id: 'c-ar-api-2',
        moduleId: 'ar-api',
        front: 'Offset or cursor pagination?',
        back: 'Cursor: stable under inserts and the same cost at any depth, via a keyset on sort key plus id. Offset only for small data where jumping to page N matters.',
        tag: 'API design',
      },
      {
        id: 'c-ar-api-3',
        moduleId: 'ar-api',
        front: 'Which API changes are safe?',
        back: 'Additive ones: new endpoints, optional request fields, new response fields. Removing, renaming, retyping or requiring anything breaks clients. Expand, then contract.',
        tag: 'API design',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'ar-edge',
    trackId: 'architecture',
    title: 'Gateways, service discovery and the mesh',
    station: 5,
    prereqs: ['ar-api'],
    related: ['f-network'],
    minutes: 13,
    summary: 'What the gateway, the BFF, service discovery and the mesh each do, and which layer owns which concern.',
    objectives: [
      'Say what an API gateway should do, and what it must not',
      'Explain when a [[BFF]] earns its place, and who owns it',
      'Compare client-side and server-side service discovery',
      'Describe what a service mesh gives and costs, and put each cross-cutting concern in one layer',
    ],
    keywords: [
      'API gateway',
      'backend for frontend',
      'service discovery',
      'service mesh',
      'sidecar',
      'Envoy',
      'Istio',
      'mutual TLS',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Once there is more than one service, the same questions land on every one of them. Who is calling? Are they allowed? How fast may they call? Where is the thing I am calling, and is the connection to it encrypted? What happens when it is slow? You can answer them in each service, in a shared library, at the edge, or in the network itself. The senior answer puts each concern in **exactly one place**, and can say why that place.',
      },
      {
        kind: 'figure',
        caption: 'The layers between a client and a service, and what each one is for.',
        figure: {
          kind: 'stack',
          layers: [
            { label: 'Clients', sub: 'web, iOS, Android, partners' },
            { label: 'CDN', sub: 'static assets, cached reads' },
            { label: 'API gateway', sub: 'TLS, auth, rate limits, routing', tone: 'line' },
            { label: 'BFFs', sub: 'one per client experience' },
            { label: 'Services with sidecars', sub: 'mTLS, retries, metrics', tone: 'line' },
            { label: 'Registry', sub: 'which instances are healthy' },
          ],
          note: 'North–south traffic, from clients inward, crosses the gateway. East–west traffic, service to service, crosses the mesh.',
        },
      },
      { kind: 'heading', text: 'The API gateway' },
      {
        kind: 'prose',
        text: 'The gateway is the single front door for traffic from outside, sitting behind the [[CDN]]. Kong, [[AWS]] [[API]] Gateway, Apigee, or plain Envoy or Nginx with plugins all play the part. Its job is the work that is identical for every request and has nothing to do with your business.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Belongs in the gateway',
          points: [
            '[[TLS]] termination and certificate management',
            'Authentication: verify the [[JWT]] or API key, and reject before any service sees the request',
            'Per-client rate limits and quotas',
            'Routing by host and path to the owning service, and weighted splits for canaries',
            'Request size limits and the edge access log',
          ],
        },
        right: {
          title: 'Does not',
          points: [
            'Authorisation on data: whether user 42 may read order 7 is the order service\'s call',
            'Business rules, pricing, validation of domain fields',
            'Assembling one screen from several services: that is a BFF\'s job',
            'Transformation logic that grows every sprint',
          ],
        },
        verdict: 'Keep it thin and generic. A gateway that knows your domain becomes a shared monolith that every team must change and nobody owns.',
      },
      {
        kind: 'prose',
        text: 'The split between authentication and authorisation is the part that gets probed. The gateway can verify **who** the caller is, because that check is the same for every route. It cannot decide whether this caller may touch this record without knowing the record, and copying that knowledge to the edge means two places to keep in step. Pass the verified identity downstream and let the service that owns the data decide.',
      },
      { kind: 'heading', text: 'Backend for frontend' },
      {
        kind: 'prose',
        text: 'A phone on a mobile network wants one round trip that returns exactly what its screen shows. A web app on fibre can afford more calls and wants different fields. A partner integration wants stable, documented resources. One general API serving all three becomes the lowest common denominator, or sprouts `?include=` flags until nobody can say what a response contains.',
      },
      {
        kind: 'prose',
        text: 'A **[[BFF]]**, backend for frontend, is a thin server per client experience that fans out to the services and shapes the response for that client. The pattern came out of SoundCloud and was popularised by Sam Newman. One rule makes it work: **the team that owns the client owns its BFF**, so the iOS team can change the home-screen payload without waiting on anyone.',
      },
      {
        kind: 'figure',
        caption: 'One API for every client, against one backend per client experience.',
        figure: {
          kind: 'split',
          left: {
            title: 'One general API',
            tone: 'streak',
            nodes: [
              { label: 'iOS, Android, web', to: 'the same calls' },
              { label: 'General API', sub: 'every field, for everyone', tone: 'streak', to: 'fans out' },
              { label: 'Services' },
            ],
            cost: 'Phones over-fetch on slow networks, and every client change is negotiated with one team.',
          },
          right: {
            title: 'A BFF per client',
            tone: 'mastered',
            nodes: [
              { label: 'iOS app', to: 'one call' },
              { label: 'iOS BFF', sub: 'owned by the iOS team', tone: 'mastered', to: 'fans out in parallel' },
              { label: 'Services' },
            ],
            cost: 'More deployables, and logic can drift between them.',
          },
          verdict: 'Use BFFs when client experiences genuinely differ and different teams own them. One web app does not need one.',
        },
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Netflix',
        text: 'Netflix\'s streaming API let each device team write its own endpoint adapters, as Groovy scripts deployed onto the shared API servers, so a TV, a phone and a games console each got responses shaped for their screens without a central team in the loop. It is the BFF idea, with the adapters hosted on one platform rather than run as separate services.',
      },
      {
        kind: 'prose',
        text: 'Two ways BFFs go wrong. Logic that belongs in a service gets copied into each BFF and drifts, until the iOS and Android apps show different delivery estimates. And a single "shared BFF" for every client quietly becomes the general API again. If two BFFs compute the same thing, push it down into a service.',
      },
      { kind: 'heading', text: 'Service discovery: who reads the registry' },
      {
        kind: 'prose',
        text: 'Instances come and go with autoscaling, deploys and crashes, so something must know which addresses are alive right now. A **registry** (Consul, etcd, ZooKeeper, Eureka, or the Kubernetes control plane) holds the list, kept current by registration and health checks. The design question is who reads it.',
      },
      {
        kind: 'figure',
        caption: 'Who reads the registry: the caller itself, or a load balancer in front of the service.',
        figure: {
          kind: 'split',
          left: {
            title: 'Client-side',
            nodes: [
              { label: 'Caller', sub: 'with a discovery library', to: 'asks for orders' },
              { label: 'Registry', sub: '3 healthy instances', tone: 'line', to: 'caller picks one' },
              { label: 'orders-2', sub: 'called directly', tone: 'mastered' },
            ],
            cost: 'One network hop and smart balancing. Every language needs the library.',
          },
          right: {
            title: 'Server-side',
            nodes: [
              { label: 'Caller', sub: 'knows one stable name', to: 'orders.internal' },
              { label: 'Load balancer', sub: 'reads the registry', tone: 'line', to: 'forwards' },
              { label: 'orders-2', tone: 'mastered' },
            ],
            cost: 'Callers stay simple. One extra hop, and the balancer has to scale with the traffic.',
          },
        },
      },
      {
        kind: 'prose',
        text: 'Netflix\'s Eureka with the Ribbon client library is the classic client-side design. A Kubernetes Service is the everyday server-side one: callers resolve a stable name through cluster [[DNS]], and rules on each node forward the connection to a healthy pod. Plain DNS discovery is simple but has a catch. Clients and resolvers cache answers for the record\'s [[TTL]], and often longer, so traffic keeps flowing to an instance after it has gone. Keep the TTL short, and re-resolve on connection failures.',
      },
      { kind: 'heading', text: 'The service mesh' },
      {
        kind: 'prose',
        text: 'A **service mesh** moves the network concerns out of every service into a proxy that runs beside each instance: the **sidecar**, usually Envoy, which Lyft built for exactly this. All traffic in and out of the service passes through it. A **control plane** (Istio\'s istiod, or Linkerd\'s) pushes configuration to every sidecar: routes, certificates, retry and timeout policy. The application makes a plain call to `http://orders` and the mesh handles the rest. Because the caller\'s sidecar does the balancing, you also get client-side discovery without a library in every language.',
      },
      {
        kind: 'figure',
        caption: 'One call through the mesh: each service talks only to its own sidecar.',
        figure: {
          kind: 'flow',
          nodes: [
            { label: 'Checkout', sub: 'plain call to orders', to: 'localhost' },
            { label: 'Sidecar', sub: 'picks instance, timeout, retry', tone: 'line', to: 'mutual TLS' },
            { label: 'Sidecar', sub: 'checks caller identity', tone: 'line', to: 'localhost' },
            { label: 'Orders', sub: 'sees only localhost' },
          ],
          note: 'Two extra proxy hops on every call buy [[mTLS]], retries and per-hop metrics with no application code.',
        },
      },
      {
        kind: 'list',
        items: [
          '**Mutual TLS everywhere.** Every connection is encrypted, and each side proves its identity with a certificate the mesh issues and rotates. "Only checkout may call payments" becomes a rule enforced on identity, not on [[IP]] addresses.',
          '**Traffic policy, set centrally.** Timeouts, retries, circuit breaking, and weighted routing for canary releases.',
          '**Uniform telemetry.** Request rate, error rate and latency for every pair of services, plus trace spans, without instrumenting each one.',
        ],
      },
      {
        kind: 'prose',
        text: 'The cost is real. Every hop now passes through two proxies, which adds latency, plus a proxy\'s memory and [[CPU]] in every pod. The control plane becomes a dependency you must upgrade, monitor and understand when it misbehaves, and a bad configuration push can break every service at once. Istio\'s ambient mode exists to cut the per-pod cost: a shared proxy on each node handles encryption and identity, and the heavier request-level features run in optional shared proxies rather than beside every pod.',
      },
      {
        kind: 'prose',
        text: 'Adopt a mesh when keeping encryption, retries and telemetry consistent across libraries has become the harder problem: hundreds of services in several languages. Ten services in one language do better with a good shared client library.',
      },
      {
        kind: 'figure',
        caption: 'How one failing call multiplies when every layer retries three times.',
        figure: {
          kind: 'scale',
          items: [
            { label: 'No retries', display: '1 attempt', value: 1, tone: 'mastered' },
            { label: 'One layer retries', display: '4 attempts', value: 4 },
            { label: 'Two layers', display: '16 attempts', value: 16, tone: 'streak' },
            { label: 'Three layers', display: '64 attempts', value: 64, tone: 'alert' },
          ],
          note: 'Three retries is four attempts per layer, and nested layers multiply: 4 × 4 × 4. All of it lands on the dependency that is already struggling.',
        },
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Retries configured in the gateway, the mesh and the client library all at once. Each is reasonable alone; stacked, they turn a slow dependency into a retry storm that keeps it down. Retry in **one** layer (usually the mesh, or the caller nearest the failure), with a retry budget, backoff with jitter, and only for idempotent requests.',
      },
      { kind: 'heading', text: 'Where each concern lives' },
      {
        kind: 'table',
        head: ['Concern', 'Lives in', 'Not in'],
        rows: [
          ['TLS from the internet', 'Gateway, or the CDN in front of it', 'Every service'],
          ['Who is calling', 'Gateway for users; mesh certificates for services', 'Each service parsing tokens its own way'],
          ['May they do this', 'The service that owns the data', 'The gateway'],
          ['Per-client rate limits', 'Gateway', 'Each service separately'],
          ['Shaping a response for a screen', 'BFF', 'The gateway or the core services'],
          ['Service-to-service encryption', 'Mesh', 'Certificates hand-rolled per service'],
          ['Retries, timeouts, circuit breaking', 'One layer: the mesh, or one client library', 'Every layer at once'],
          ['Per-hop metrics and traces', 'Mesh', 'Only where someone remembered'],
          ['Business rules', 'The owning service', 'Anywhere at the edge'],
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: '"The gateway terminates TLS, validates the token and applies per-client rate limits, then routes. Each mobile app has a BFF its own team owns. Inside, services reach each other through the mesh, which gives us mutual TLS, one retry policy and per-hop metrics. Authorisation stays in the service that owns the data."',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Is the gateway a single point of failure?',
            a: 'Only if you run one. It is stateless, so you run several instances across zones behind a layer-4 load balancer, and keep its job small so a bad config push has little to break. The state it does have, rate-limit counters, usually lives in Redis, and whether the gateway fails open or closed when Redis is down should be an explicit decision.',
          },
          {
            q: 'Your gateway validates JWTs. Should services trust the user-id header it adds?',
            a: 'Only if nothing but the gateway can reach them with that header set: enforce it with mesh identity or network policy, or anyone inside can impersonate any user. Many teams forward the signed token itself so each service can verify it cheaply with the public key. Either way, authorisation still happens in the service.',
          },
          {
            q: 'When would you not use a service mesh?',
            a: 'With a handful of services in one language, a shared client library gives you timeouts, retries and metrics with far less to operate. A mesh adds a control plane, a proxy per pod and a new class of outage. It pays off when the number of services and languages makes consistent libraries impractical, or when mutual TLS everywhere is a hard requirement.',
          },
          {
            q: 'How does a new instance start receiving traffic, and how does a dying one stop?',
            a: 'It registers, or the orchestrator registers it, and receives traffic only once its readiness check passes. On shutdown it fails readiness first, the registry and proxies drop it, and it drains in-flight requests before exiting. Skip the drain and every deploy produces a burst of errors.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-ar-edge-1',
        moduleId: 'ar-edge',
        stem: 'Where should the check "may user 42 read order 7?" live?',
        options: [
          'In the API gateway, so services stay simple',
          'In the BFF for each client',
          'In the service mesh\'s access policy',
          'In the order service, which owns the data',
        ],
        correct: 3,
        explain:
          'Authorisation depends on the data: who owns order 7, and what the user may do with it. Only the owning service knows that. The gateway can authenticate the caller and the mesh can restrict which services call which, but neither can decide on a record it never sees.',
      },
      {
        id: 'q-ar-edge-2',
        moduleId: 'ar-edge',
        stem: 'A platform has 300 services in five languages and needs encrypted, authenticated service-to-service calls with consistent retry policy. What fits best?',
        options: [
          'A service mesh, with sidecars and a control plane',
          'A shared client library in each language',
          'Route all internal calls through the API gateway',
          'A written standard that each team implements',
        ],
        correct: 0,
        explain:
          'At that scale, keeping five libraries consistent is the hard problem, and a mesh moves encryption, identity, retries and telemetry out of application code entirely. Sending internal traffic through the edge gateway makes it a bottleneck and a single point of failure, and written standards drift.',
      },
      {
        id: 'q-ar-edge-3',
        moduleId: 'ar-edge',
        stem: 'The gateway, the mesh and the client library each retry failed calls three times. A dependency slows down. What happens?',
        options: [
          'More requests succeed, because each has more chances',
          'Each failing request becomes up to 64 attempts on the struggling dependency, which keeps it down',
          'The mesh deduplicates the retries automatically',
          'Nothing changes, because retries happen on errors, not on slowness',
        ],
        correct: 1,
        explain:
          'Each layer makes up to four attempts and the layers nest: 4 × 4 × 4 = 64. A slow dependency hit with sixty-four times the load does not recover. Timeouts turn slowness into errors, so slowness does trigger retries. Retry in one layer, with a budget and jittered backoff.',
      },
    ],
    cards: [
      {
        id: 'c-ar-edge-1',
        moduleId: 'ar-edge',
        front: 'What belongs in an API gateway?',
        back: 'Generic edge work: TLS termination, authentication, per-client rate limits, routing. Not authorisation on data, business rules, or assembling screens.',
        tag: 'Gateway',
      },
      {
        id: 'c-ar-edge-2',
        moduleId: 'ar-edge',
        front: 'Client-side or server-side service discovery?',
        back: 'Client-side: the caller reads the registry and balances; one hop, a library per language. Server-side: a load balancer does it; simple callers, one extra hop.',
        tag: 'Discovery',
      },
      {
        id: 'c-ar-edge-3',
        moduleId: 'ar-edge',
        front: 'What does a service mesh give you, and what does it cost?',
        back: 'Sidecars give mutual TLS, retries, timeouts and per-hop telemetry without code changes. The cost: a proxy per pod, added latency, and a control plane to run.',
        tag: 'Mesh',
      },
    ],
  },
]
