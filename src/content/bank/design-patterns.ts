import type { Question } from '../types'

/** Authored bank questions — see docs/superpowers/plans/2026-11-18-question-brief.md */
export const questions: Question[] = [
  /* dp-intro ---------------------------------------------------------- */
  {
    id: 'dp-intro-tf1',
    kind: 'truefalse',
    moduleId: 'dp-intro',
    section: 'Patterns are vocabulary',
    prompt:
      'In Smalltalk [[MVC]], disabling a view by giving it a controller that ignores all input is the Strategy pattern at work.',
    answer: true,
    explain:
      'The view delegates input handling to a swappable controller object, so changing that object changes the behaviour without touching the view. Observer is the model–view link; Composite is views nested in views.',
  },
  {
    id: 'dp-intro-tf2',
    kind: 'truefalse',
    moduleId: 'dp-intro',
    section: 'Using patterns in the interview',
    prompt:
      'In a language with first-class functions, such as TypeScript, the problems that Strategy and Command were named for go away.',
    answer: false,
    explain:
      "The problem stays; the class ceremony goes. A Strategy becomes a function argument and a Command a closure, which was Norvig's point, while Adapter, Composite and State look much the same in any language.",
  },
  {
    id: 'dp-intro-multi',
    kind: 'multi',
    moduleId: 'dp-intro',
    section: 'When patterns hurt',
    prompt: 'Which of these are pattern-itis: abstraction paid for before the variation it isolates exists?',
    options: [
      'A factory whose `switch` has a single case',
      'An interface with one implementation and no test double',
      'A pattern chosen before anyone can say what it isolates',
      'A `DiscountRule` interface for rules the product team adds every sprint',
      '`AbstractSingletonProxyFactoryBean` in Spring, which serves thousands of unknown apps',
    ],
    correct: [0, 1, 2],
    explain:
      "Pattern-itis is indirection with no real variation behind it. Weekly-changing discount rules are real variation, and Spring's long class name earns its layers by serving applications it cannot know; your checkout has three known callers.",
  },
  {
    id: 'dp-intro-match',
    kind: 'match',
    moduleId: 'dp-intro',
    section: 'The catalogue and its three families',
    prompt: 'Match each smell in the code to where it should send you.',
    pairs: [
      { left: '`new ConcreteThing()` copied across call sites', right: 'A creational pattern' },
      { left: 'A vendor interface that does not match yours', right: 'A structural pattern' },
      { left: 'A `switch` on type that grows every sprint', right: 'A behavioural pattern' },
      { left: 'A second variant that might arrive one day', right: 'No pattern yet: plain code' },
    ],
    explain:
      'Creational patterns decide who builds which class, structural ones make objects fit together, and behavioural ones decide who does what. A variant that is only imaginable justifies nothing; the constructor is seam enough.',
  },

  /* dp-factory -------------------------------------------------------- */
  {
    id: 'dp-factory-tf1',
    kind: 'truefalse',
    moduleId: 'dp-factory',
    section: 'Choosing between them',
    prompt:
      'Once a factory returns `PaymentProvider`, an `if (provider instanceof StripeProvider)` check in checkout is harmless, because creation is still centralised.',
    answer: false,
    explain:
      "The factory's value is that callers depend on the interface alone. A type check downstream means the interface is missing a method, and every new provider must now be found and handled in checkout as well.",
  },
  {
    id: 'dp-factory-tf2',
    kind: 'truefalse',
    moduleId: 'dp-factory',
    section: 'Factory method: let the subclass decide',
    prompt:
      'In your own TypeScript code, passing a creator into the constructor, as in `new Notifier(() => new EmailChannel())`, usually beats a subclass per channel.',
    answer: true,
    explain:
      'It is the same hook by composition instead of inheritance, and subclasses stop multiplying when a second axis varies. Factory method earns its keep when the base class belongs to a framework and subclassing is the extension point you were given.',
  },
  {
    id: 'dp-factory-multi',
    kind: 'multi',
    moduleId: 'dp-factory',
    section: 'Simple factory: one place that knows',
    prompt: 'In which of these cases is the proposed factory more machinery than the problem needs?',
    options: [
      'A provider factory for a service with one provider and none planned',
      'A per-request factory for a region fixed for the whole deployment',
      'A subclass that overrides `create()` when no base-class algorithm calls it',
      "A factory keyed by the order's country, which arrives with each request",
      'An abstract factory so one screen cannot mix dark and light widgets',
    ],
    correct: [0, 1, 2],
    explain:
      'One class with no variation wants `new`; a choice fixed at startup belongs in the injection wiring; a `create()` nothing calls is a simple factory wearing inheritance. Per-request input and families that must match are what factories are for.',
  },
  {
    id: 'dp-factory-match',
    kind: 'match',
    moduleId: 'dp-factory',
    section: 'Abstract factory: families that must match',
    prompt: 'Match each requirement to the lightest creation design that fits it.',
    pairs: [
      { left: 'Buttons, dialogs and tooltips must share one theme', right: 'Abstract factory' },
      { left: 'A framework base class lets apps plug in their own type', right: 'Factory method' },
      { left: "Channel picked from each user's preference, per message", right: 'Simple factory' },
      { left: 'One storage backend, fixed for the life of a deployment', right: 'Dependency injection wiring' },
    ],
    explain:
      "Matching families need an abstract factory, a hook inside someone else's algorithm is factory method, and a runtime choice is a function and a map. A choice made once at startup needs no factory: the wiring picks it.",
  },

  /* dp-builder-singleton ---------------------------------------------- */
  {
    id: 'dp-builder-singleton-tf1',
    kind: 'truefalse',
    moduleId: 'dp-builder-singleton',
    section: 'Builder: construction in named steps',
    prompt: 'The fluent builder used for objects such as [[HTTP]] requests is the builder pattern from the [[GoF]] book.',
    answer: false,
    explain:
      "The GoF builder is one construction process producing different representations, such as a document reader driving plain-text or TeX converters. The fluent builder was popularised by Bloch's Effective Java. Same name, different problem.",
  },
  {
    id: 'dp-builder-singleton-tf2',
    kind: 'truefalse',
    moduleId: 'dp-builder-singleton',
    section: 'Why singleton is suspect',
    prompt:
      'In single-threaded Node.js, a lazy singleton that caches the client after `await connect()` can still open two connection pools.',
    answer: true,
    explain:
      'Every caller that arrives during the await also sees no client and connects again. Cache the promise instead, assigned before any await, so later callers share it.',
  },
  {
    id: 'dp-builder-singleton-multi',
    kind: 'multi',
    moduleId: 'dp-builder-singleton',
    section: 'Singleton: what it promises',
    prompt:
      'Singleton promises one instance and a global way to reach it. Which problems come from the global access, not from there being one instance?',
    options: [
      'Constructors hide what a class really depends on',
      'One test cannot use a fake while another uses the real thing',
      'Settings changed in one test are still there in the next',
      'The process keeps one connection pool instead of one per request',
      'Every class that needs the instance takes it as a constructor parameter',
    ],
    correct: [0, 1, 2],
    explain:
      'One pool per process is the legitimate promise, and a constructor parameter is the cost of injecting it instead. Hidden dependencies and leaking, unswappable test state all come from reaching the instance through a global.',
  },
  {
    id: 'dp-builder-singleton-match',
    kind: 'match',
    moduleId: 'dp-builder-singleton',
    section: 'One instance, without the pattern',
    prompt: 'Match each way of keeping one instance to its trade-off.',
    pairs: [
      { left: '`Database.get()` called from anywhere', right: 'Dependencies invisible; tests share state' },
      { left: 'Created once in `main.ts` and injected', right: 'One more constructor parameter' },
      { left: '`export const pool` at module scope', right: 'Global, but visible in the import' },
      { left: 'A Spring singleton-scoped bean', right: 'One per container; a test can start another' },
    ],
    explain:
      'Only the classic singleton hides the dependency. Injection makes "one" a wiring decision, a module is global but shows in its import and a test runner can replace it, and a container holds one instance per context.',
  },

  /* dp-adapter-facade-proxy ------------------------------------------- */
  {
    id: 'dp-adapter-facade-proxy-tf1',
    kind: 'truefalse',
    moduleId: 'dp-adapter-facade-proxy',
    section: 'Adapter: make a foreign interface fit yours',
    prompt:
      'A payment adapter interface should be the union of what every supported vendor can do, so that no caller ever loses a feature.',
    answer: false,
    explain:
      'Design the interface from what checkout needs. The union of Stripe and Adyen re-exports the vendors; expose a vendor-only capability as a separate, optional interface that callers check for.',
  },
  {
    id: 'dp-adapter-facade-proxy-tf2',
    kind: 'truefalse',
    moduleId: 'dp-adapter-facade-proxy',
    section: 'Facade: one door into a subsystem',
    prompt:
      'A facade does not lock its subsystem away: code that needs finer control can still call the classes underneath it.',
    answer: true,
    explain:
      "A facade makes the common path the easy one, as the [[AWS]] [[SDK]]'s `Upload` helper does for multipart uploads, while the low-level commands stay available. It should orchestrate, not decide, or it grows into a god service.",
  },
  {
    id: 'dp-adapter-facade-proxy-multi',
    kind: 'multi',
    moduleId: 'dp-adapter-facade-proxy',
    section: 'Telling them apart',
    prompt: 'Which of these are proxies?',
    options: [
      "Hibernate's stand-in returned by a lazy `order.getCustomer()`",
      'A gRPC client stub whose `users.get(id)` reads like a local call',
      "A wrapper that checks the caller's role before calling an admin service",
      '`OrderPlacement.place()` over inventory, payment and shipping',
      '`InputStreamReader` presenting a byte stream as characters',
      '`Arrays.asList(array)` presenting an array as a `List`',
    ],
    correct: [0, 1, 2],
    explain:
      'A proxy keeps the interface and controls when, where or whether the call happens: lazily, over [[gRPC]], or after a permission check. `OrderPlacement` simplifies several objects, a facade; the two Java classes change an interface, so they are adapters.',
  },
  {
    id: 'dp-adapter-facade-proxy-match',
    kind: 'match',
    moduleId: 'dp-adapter-facade-proxy',
    section: 'Proxy: same interface, controlled access',
    prompt: 'Match each proxy to what it controls about the real call.',
    pairs: [
      { left: "Hibernate's lazy `order.getCustomer()`", right: 'When the real object is created' },
      { left: 'A gRPC client stub', right: 'Where the call runs' },
      { left: 'A role check before an admin service', right: 'Whether this caller may make the call' },
      { left: 'A CDN in front of the origin', right: 'Whether the call is needed at all' },
    ],
    explain:
      'Virtual, remote, protection and caching proxies all keep the interface. A lazy entity defers creation, a [[gRPC]] stub moves the call to another process, a role check guards it, and a [[CDN]] answers from a copy.',
  },

  /* dp-decorator-composite -------------------------------------------- */
  {
    id: 'dp-decorator-composite-tf1',
    kind: 'truefalse',
    moduleId: 'dp-decorator-composite',
    section: 'Decorator: add behaviour by wrapping',
    prompt:
      'With `new RetryClient(new LoggingClient(new FetchClient()))`, a call that needs three attempts writes one log line.',
    answer: false,
    explain:
      'Retry sits outside logging, so each attempt passes through the logger: three lines. Put logging outside retry for one line per call. The order of wrapping is behaviour, which is why the stack is built in one place.',
  },
  {
    id: 'dp-decorator-composite-tf2',
    kind: 'truefalse',
    moduleId: 'dp-decorator-composite',
    section: 'When composite is the wrong tree',
    prompt: 'A naive recursive `size()` over a file system that has hard links can count the same file more than once.',
    answer: true,
    explain:
      'Composite assumes a tree. A hard link is a shared child, which makes the structure a [[DAG]], and plain recursion visits it once per parent. Say so, and track what you have already visited.',
  },
  {
    id: 'dp-decorator-composite-multi',
    kind: 'multi',
    moduleId: 'dp-decorator-composite',
    section: 'When not to decorate',
    prompt: 'When is a stack of decorators the wrong tool?',
    options: [
      'You need to change one method of a 30-method interface',
      'Callers check `instanceof` or use the objects as map keys',
      'Every client always gets the same logging and retries',
      'Different callers want different mixes of caching and retries',
      'A test needs the production stack wrapped around a fake transport',
    ],
    correct: [0, 1, 2],
    explain:
      'A wide interface means 29 methods of forwarding, a wrapper breaks identity checks, and one fixed combination can live in one class. Varying combinations, and reusing the stack over a fake, are exactly what decorators are for.',
  },
  {
    id: 'dp-decorator-composite-match',
    kind: 'match',
    moduleId: 'dp-decorator-composite',
    section: 'Decorator, proxy or adapter?',
    prompt: 'Match each real-world wrapper or structure to the pattern it is.',
    pairs: [
      { left: '`GZIPInputStream` holding another `InputStream`', right: 'Decorator' },
      { left: '`InputStreamReader` over a byte `InputStream`', right: 'Adapter' },
      { left: "Spring's `@Cacheable` wrapper, unseen by callers", right: 'Proxy' },
      { left: 'An element whose `textContent` spans every descendant', right: 'Composite' },
    ],
    explain:
      'Decompressing keeps the stream interface and adds behaviour; turning bytes into a character `Reader` changes the interface. A caching stand-in the caller never sees is usually called a proxy, and the [[DOM]] treats an element and its subtree alike.',
  },

  /* dp-strategy-state ------------------------------------------------- */
  {
    id: 'dp-strategy-state-tf1',
    kind: 'truefalse',
    moduleId: 'dp-strategy-state',
    section: 'State: let the object change its own behaviour',
    prompt:
      'In the State pattern, the code calling `order.ship()` moves the order from Paid to Shipped by swapping in a new state object.',
    answer: false,
    explain:
      'The current state chooses its successor: `Paid.ship()` calls back into the order with `moveTo(new Shipped())`, and the caller only sends the event. An implementation picked from outside is what makes something a strategy.',
  },
  {
    id: 'dp-strategy-state-tf2',
    kind: 'truefalse',
    moduleId: 'dp-strategy-state',
    section: 'Strategy: inject the part that varies',
    prompt: 'One immutable `PercentOff(20)` instance can safely serve every concurrent checkout in the process.',
    answer: true,
    explain:
      "A strategy may hold its own configuration, the 20, but not per-call state if it is shared. Kept immutable, one instance serves every request; per-call fields would let concurrent checkouts see each other's data.",
  },
  {
    id: 'dp-strategy-state-multi',
    kind: 'multi',
    moduleId: 'dp-strategy-state',
    section: 'When neither is worth it',
    prompt: 'Which are signs that neither strategy nor state classes are worth it yet?',
    options: [
      'Two cases that will stay two',
      'Statuses that differ only in which actions they allow',
      'A strategy interface that ends up taking the whole context',
      'A list of pricing variants that grows every sprint',
      'States that do different work on the same event, not just allow different ones',
    ],
    correct: [0, 1, 2],
    explain:
      'Two fixed cases want a ternary, statuses that only gate actions want an enum and a transition table, and a strategy needing everything means the seam is wrong. A growing list of rules, and behaviour that really differs per state, are what the patterns are for.',
  },
  {
    id: 'dp-strategy-state-match',
    kind: 'match',
    moduleId: 'dp-strategy-state',
    section: 'Same code, different question: who chooses?',
    prompt: 'Match each requirement to the design that fits it best.',
    pairs: [
      { left: 'Fastest, shortest or avoid-tolls routing', right: 'Strategy' },
      { left: 'A vending machine whose `select()` depends on credit', right: 'State' },
      { left: 'Cancel unpaid orders after 30 minutes, across restarts', right: 'A durable workflow engine' },
      { left: 'Two shipping options that will stay two', right: 'A ternary' },
    ],
    explain:
      'A rule chosen from outside is a strategy; behaviour that changes as events arrive is state. Timers that must survive a restart outgrow both and want a workflow engine such as Temporal, and two fixed cases need no pattern at all.',
  },

  /* dp-observer ------------------------------------------------------- */
  {
    id: 'dp-observer-tf1',
    kind: 'truefalse',
    moduleId: 'dp-observer',
    section: 'The pattern, in-process',
    prompt:
      'Push notification, where the subject sends the data with each event, suits a subject whose payload is expensive to build and that most listeners ignore.',
    answer: false,
    explain:
      'That is the case for pull: the subject says only that something changed, and each listener reads the slice it needs. Push is simpler, and the default when the payload is cheap and listeners want it.',
  },
  {
    id: 'dp-observer-tf2',
    kind: 'truefalse',
    moduleId: 'dp-observer',
    section: 'Choosing, and when not to',
    prompt:
      'If a failed stock reservation must fail the order, reserving stock belongs in the main flow rather than in an observer.',
    answer: true,
    explain:
      'Observer is for "and also"; required work is "and then". A safe emit catches and logs each listener\'s error, so the order code never sees it; a step whose failure must fail the order belongs in the main flow.',
  },
  {
    id: 'dp-observer-multi',
    kind: 'multi',
    moduleId: 'dp-observer',
    section: 'Three ways observer goes wrong',
    prompt: 'Which changes make a synchronous in-process `emit` safer?',
    options: [
      'Iterate over a copy of the listener set',
      "Catch and log each listener's error, then carry on",
      'Queue events emitted from inside a listener until dispatch ends',
      'Hold listeners through `WeakRef` so forgotten ones cannot leak',
      'Rely on subscription order so dependent listeners run in sequence',
    ],
    correct: [0, 1, 2],
    explain:
      'A copy survives an unsubscribe mid-loop, per-listener catches stop one failure silencing the rest, and queueing nested events prevents re-entrant recursion. `WeakRef` swaps a leak for listeners that vanish at collection; relying on order is hidden coupling.',
  },
  {
    id: 'dp-observer-match',
    kind: 'match',
    moduleId: 'dp-observer',
    section: 'Pub/sub: the same idea through a broker',
    prompt: 'Match each part of an in-process observer to its counterpart in Kafka.',
    pairs: [
      { left: "The subject's set of listeners", right: 'Consumer groups, each with its own offset' },
      { left: 'Listeners run in subscription order', right: 'Order holds only within a partition' },
      { left: 'A listener that subscribes after events were sent', right: 'A new group that reads the retained log' },
      { left: '`emit` calling each listener in turn', right: 'An append to a durable log' },
    ],
    explain:
      'Kafka turns the listener list inside out: the broker keeps an append-only log per partition, and each consumer group tracks its own offset in it. That is how a late subscriber can replay what is retained, which no in-process observer offers.',
  },

  /* dp-command-template-chain ----------------------------------------- */
  {
    id: 'dp-command-template-chain-tf1',
    kind: 'truefalse',
    moduleId: 'dp-command-template-chain',
    section: 'Template method: a fixed skeleton with hooks',
    prompt: "In template method, each subclass decides the order in which the base class's steps run.",
    answer: false,
    explain:
      'The base class owns the skeleton and calls down into the steps: "don\'t call us, we\'ll call you". Subclasses fill in steps and may override hooks, but the order belongs to the base class.',
  },
  {
    id: 'dp-command-template-chain-tf2',
    kind: 'truefalse',
    moduleId: 'dp-command-template-chain',
    section: 'Chain of responsibility: handlers in a line',
    prompt: 'A chain of responsibility with no terminal handler can drop a request without anyone noticing.',
    answer: true,
    explain:
      'If no link takes the request it falls off the end, and by default nothing reports it. End every chain with a handler that always answers, such as a rejection with a reason, and log which link handled each request.',
  },
  {
    id: 'dp-command-template-chain-multi',
    kind: 'multi',
    moduleId: 'dp-command-template-chain',
    section: 'Command: a request you can hold',
    prompt: 'An action is turned into a command object. Which of these does that make possible?',
    options: [
      'Queue it to run later on another machine',
      'Retry it, or park it in a dead-letter queue',
      'Write it to an audit log',
      'Undo a sent email by calling its `undo()`',
      'Undo a delete from the positions alone, without the removed text',
    ],
    correct: [0, 1, 2],
    explain:
      'Because the request is a value rather than a call in progress, it can be stored, sent, retried and logged. Undo reverses only what the command remembered, and an effect in the world, such as an email, needs a compensating command instead.',
  },
  {
    id: 'dp-command-template-chain-match',
    kind: 'match',
    moduleId: 'dp-command-template-chain',
    section: 'Middleware: chain or decorator?',
    prompt: 'Match each to the pattern it is built on.',
    pairs: [
      { left: 'A Sidekiq job stored in Redis as JSON', right: 'Command' },
      { left: 'JUnit 3 running `setUp` and `tearDown` around tests', right: 'Template method' },
      { left: 'An auth filter that may reject the request or pass it on', right: 'Chain of responsibility' },
      { left: 'Middleware that always forwards, timing both sides', right: 'Decorator' },
    ],
    explain:
      "A serialised job is a request held as a value, and JUnit's `runBare` owns the flow and calls your hooks. Middleware is told apart by behaviour: a handler that may stop the request is a chain link; one that always forwards and works on both sides of the call is a decorator.",
  },

  /* dp-anti ----------------------------------------------------------- */
  {
    id: 'dp-anti-tf1',
    kind: 'truefalse',
    moduleId: 'dp-anti',
    section: 'God object',
    prompt: 'The safest fix for a 4,000-line god object is a planned rewrite behind a short feature freeze.',
    answer: false,
    explain:
      'Rewrites stall and freezes block every team. Put tests around current behaviour, extract the most-changed cluster behind a narrow interface, and leave the old method delegating until the last caller has moved.',
  },
  {
    id: 'dp-anti-tf2',
    kind: 'truefalse',
    moduleId: 'dp-anti',
    section: 'The distributed monolith',
    prompt:
      'Five services in a synchronous chain, each 99.9% available, are together available about 99.5% of the time at best.',
    answer: true,
    explain:
      'Availabilities multiply: 0.999 to the fifth power is about 0.995, roughly 44 hours of downtime a year instead of under 9. Every synchronous hop multiplies in another failure rate.',
  },
  {
    id: 'dp-anti-multi',
    kind: 'multi',
    moduleId: 'dp-anti',
    section: 'The anemic domain model: a debate',
    prompt: 'Where is it worth moving the rules onto the object itself, rather than keeping a plain record and a service?',
    options: [
      'An account balance that must never go negative',
      'Stock levels that several flows decrement',
      'An order lifecycle in which only paid orders ship',
      'A reporting endpoint that maps rows to JSON',
      'An admin export that reads data in and writes it out',
    ],
    correct: [0, 1, 2],
    explain:
      'Rules belong on the object where breaking them costs money: balances, stock, lifecycles. For data-in, data-out code, plain records are honest, not lazy; the anti-pattern is having invariants and leaving them unguarded.',
  },
  {
    id: 'dp-anti-match',
    kind: 'match',
    moduleId: 'dp-anti',
    section: 'The cheat sheet',
    prompt: 'Match each symptom to the anti-pattern it points to.',
    pairs: [
      { left: 'Kafka between two services that need a reply', right: 'Golden hammer' },
      { left: 'A `legacyPricing` path behind a flag off for years', right: 'Lava flow' },
      { left: 'A plugin system with exactly one plugin', right: 'Speculative generality' },
      { left: "`order.status = 'shipped'` is legal from anywhere", right: 'Anemic domain model' },
      { left: 'A merge conflict in `OrderManager` most weeks', right: 'God object' },
    ],
    explain:
      'A tool picked without the property it provides is a golden hammer; dead code nobody dares delete is lava flow; abstraction for an imagined case is speculative generality; unguarded rules are an anemic model; one class every change touches is a god object.',
  },
]
