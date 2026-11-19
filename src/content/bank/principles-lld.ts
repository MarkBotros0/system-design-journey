import type { Question } from '../types'

/** Authored bank questions — see docs/superpowers/plans/2026-11-18-question-brief.md */
export const questions: Question[] = [
  /* ---------------------------------------------------------------- */
  /* p-oop                                                             */
  /* ---------------------------------------------------------------- */
  {
    id: 'p-oop-tf1',
    kind: 'truefalse',
    moduleId: 'p-oop',
    section: 'Tell, don\'t ask',
    prompt: '**Tell, don\'t ask** means an object should never expose a query that returns its data.',
    answer: false,
    explain:
      'Queries are fine, for display or a snapshot. What the rule forbids is deciding outside an object what only it should decide, such as reading a balance to approve a withdrawal on the account\'s behalf.',
  },
  {
    id: 'p-oop-tf2',
    kind: 'truefalse',
    moduleId: 'p-oop',
    section: 'A preview: composition over inheritance',
    prompt:
      'For a notifier that sends by email or push, now or batched, a third channel costs two new subclasses with inheritance but one new class with composition.',
    answer: true,
    explain:
      'Inheritance multiplies the axes: channels times schedules, so a third channel adds one subclass per schedule. Composition adds them: the notifier holds a channel and a schedule, and a new channel is one class.',
  },
  {
    id: 'p-oop-multi',
    kind: 'multi',
    moduleId: 'p-oop',
    section: 'Inheritance is a promise, not a shortcut',
    prompt: 'Which of these should all hold before you choose inheritance over holding the other object in a field?',
    options: [
      'The subclass can stand in for the parent everywhere',
      'The base class was designed and documented for extension',
      'The hierarchy is shallow and you own both sides',
      'The subclass wants to reuse a few of the parent\'s methods',
      'The parent comes from a third-party library',
      'The two classes share most of their fields',
    ],
    correct: [0, 1, 2],
    explain:
      'Inheritance is a promise of substitutability, and the subclass inherits every public method forever. Reusing some code, sharing fields or extending a parent you do not control are reasons to compose instead.',
  },
  {
    id: 'p-oop-match',
    kind: 'match',
    moduleId: 'p-oop',
    section: 'Encapsulation protects invariants',
    prompt: 'Match each pillar of [[OOP]] to the smell that shows it is missing or misused.',
    pairs: [
      { left: 'Encapsulation', right: 'A public setter for every field' },
      { left: 'Abstraction', right: 'An interface returning the vendor\'s response type' },
      { left: 'Inheritance', right: 'Extending a class just to reuse its storage' },
      { left: 'Polymorphism', right: 'The same type switch in four functions' },
    ],
    explain:
      'A setter lets any caller break the invariant; a vendor type leaks what the interface meant to hide; borrowing storage inherits methods that break the subtype; a repeated switch is what polymorphism replaces.',
  },

  /* ---------------------------------------------------------------- */
  /* p-coupling                                                        */
  /* ---------------------------------------------------------------- */
  {
    id: 'p-coupling-tf1',
    kind: 'truefalse',
    moduleId: 'p-coupling',
    section: 'Why it matters: the cost of a change',
    prompt:
      'Two modules that agree the value `2` means "send a one-time code" are more tightly coupled than two that only agree on a method name.',
    answer: true,
    explain:
      'In connascence terms, agreeing on a name is the weakest kind. Agreeing on what a value means is stronger, and agreeing on execution order is stronger still; all of them get worse with distance.',
  },
  {
    id: 'p-coupling-tf2',
    kind: 'truefalse',
    moduleId: 'p-coupling',
    section: 'The same idea between services',
    prompt: 'Putting a message queue between two services removes the coupling between them.',
    answer: false,
    explain:
      'A queue removes temporal coupling: the sender no longer fails when the receiver is down. Both still depend on the message contract, so changing its shape still breaks the consumer.',
  },
  {
    id: 'p-coupling-multi',
    kind: 'multi',
    moduleId: 'p-coupling',
    section: 'Cohesion: what belongs together',
    prompt: 'Which of these groupings are weaker than functional cohesion?',
    options: [
      'A utils file of date, retry and slug helpers',
      'All the validators in one folder, though they check unrelated things',
      'Everything that runs at startup, in one module',
      'Top-level controllers, services and repositories folders',
      'A money module with parse, format, add and allocate',
      'An orders folder holding its handler, rules and storage',
    ],
    correct: [0, 1, 2, 3],
    explain:
      'The utils file is coincidental, the validators and the layer folders are logical, and startup code is temporal cohesion. The money module and a feature folder each change for one reason.',
  },
  {
    id: 'p-coupling-match',
    kind: 'match',
    moduleId: 'p-coupling',
    section: 'Five kinds of coupling, worst first',
    prompt: 'Match each kind of coupling to the code that shows it.',
    pairs: [
      { left: 'Content', right: 'Casting to read another class\'s private field' },
      { left: 'Common', right: 'A module-level cache several modules write to' },
      { left: 'Control', right: 'A boolean argument that picks the callee\'s branch' },
      { left: 'Stamp', right: 'Passing a whole `User` to read only its email' },
      { left: 'Data', right: 'Passing only the email address' },
    ],
    explain:
      'Worst first: content reaches into internals, common shares mutable state, control steers the callee\'s logic, stamp passes more structure than is used, and data passes only what the callee needs.',
  },

  /* ---------------------------------------------------------------- */
  /* p-srp-ocp                                                         */
  /* ---------------------------------------------------------------- */
  {
    id: 'p-srp-ocp-tf1',
    kind: 'truefalse',
    moduleId: 'p-srp-ocp',
    section: 'Single responsibility: one actor, one reason to change',
    prompt:
      'If one developer maintains a class\'s tax rules, its layout and its storage code, the class has one actor and so one responsibility.',
    answer: false,
    explain:
      'An actor is a source of change requests, not a person. Tax rules, presentation and storage change for different reasons at different rates, whoever happens to type the edits.',
  },
  {
    id: 'p-srp-ocp-tf2',
    kind: 'truefalse',
    moduleId: 'p-srp-ocp',
    section: 'Open/closed: add, don\'t edit',
    prompt:
      'With payment methods behind an interface, adding Apple Pay still edits one line outside its new class: the entry that registers it in the composition root.',
    answer: true,
    explain:
      'The switch shrinks to one lookup in one place, and that lookup only chooses. Charge, refund and receipt code dispatches through the interface and is never reopened.',
  },
  {
    id: 'p-srp-ocp-multi',
    kind: 'multi',
    moduleId: 'p-srp-ocp',
    section: 'Choosing the axis of change',
    prompt: 'Which of these justify putting a change point behind an interface now?',
    options: [
      'It has already varied at least twice',
      'Its next variant is dated on the roadmap',
      'It might plausibly vary one day',
      'Its class has grown past 300 lines',
      'Its code is the most complex in the module',
    ],
    correct: [0, 1],
    explain:
      'Open/closed is a bet on which axis will vary, and a wrong bet costs indirection every reader pays for. Size and complexity say nothing about where the next variant will land.',
  },
  {
    id: 'p-srp-ocp-match',
    kind: 'match',
    moduleId: 'p-srp-ocp',
    section: 'How the two work together',
    prompt: 'Match each idea to the question it answers about a design.',
    pairs: [
      { left: 'Single responsibility', right: 'Where should the seams go' },
      { left: 'Open/closed', right: 'Which seams deserve an interface' },
      { left: 'Common closure principle', right: 'Which classes belong in one package' },
      { left: 'Conway\'s law', right: 'Why code seams end up matching teams' },
    ],
    explain:
      'Split by actor to find the seams, then give an interface only to the seam where variation lives. Common closure is the same rule at package level, and actors usually map to teams.',
  },

  /* ---------------------------------------------------------------- */
  /* p-lsp-isp                                                         */
  /* ---------------------------------------------------------------- */
  {
    id: 'p-lsp-isp-tf1',
    kind: 'truefalse',
    moduleId: 'p-lsp-isp',
    section: 'A read-only collection, done right',
    prompt: 'A function handed a `ReadableList` can rely on that list staying the same while it runs.',
    answer: false,
    explain:
      'Read-only is not immutable. That reference cannot change the list, but whoever holds the `MutableList` still can. A caller that needs a list that never changes needs a different, immutable type.',
  },
  {
    id: 'p-lsp-isp-tf2',
    kind: 'truefalse',
    moduleId: 'p-lsp-isp',
    section: 'Interface segregation: role interfaces',
    prompt:
      'One class can implement three role interfaces and still have exactly one reason to change.',
    answer: true,
    explain:
      'Segregation splits by who calls the code; single responsibility splits by who asks for changes to it. A Postgres user store can serve a reader role and a writer role and still answer to one actor.',
  },
  {
    id: 'p-lsp-isp-multi',
    kind: 'multi',
    moduleId: 'p-lsp-isp',
    section: 'Contracts: what a subtype may change',
    prompt: 'Which of these may a subtype do without breaking Liskov substitution?',
    options: [
      'Accept inputs its parent rejects',
      'Promise more about what it returns',
      'Throw a subtype of the parent\'s error',
      'Throw an error type callers never expect',
      'Allow a state change its parent forbids',
      'Return a value its parent rules out',
    ],
    correct: [0, 1, 2],
    explain:
      'A subtype may weaken preconditions and strengthen postconditions. It may not surprise callers with new kinds of error, break the history rule, or promise less than the parent did.',
  },
  {
    id: 'p-lsp-isp-match',
    kind: 'match',
    moduleId: 'p-lsp-isp',
    section: 'The square and the rectangle',
    prompt: 'Match each substitution or segregation problem to its fix.',
    pairs: [
      { left: '`Square` overrides `setWidth` to set both sides', right: 'Drop the hierarchy, or make shapes immutable' },
      { left: '`FrozenList.add` throws "read-only"', right: 'Give readers a type with only reads' },
      { left: 'Twelve one-method interfaces, one client', right: 'Merge them: count clients, not methods' },
      { left: 'A subclass narrows a parameter and still compiles', right: 'Run one contract test suite on every implementation' },
    ],
    explain:
      'The override is the violation, not the fix. A method that throws means the interface is too wide. Segregation serves clients, not method counts, and the compiler never checks behaviour.',
  },

  /* ---------------------------------------------------------------- */
  /* p-dip                                                             */
  /* ---------------------------------------------------------------- */
  {
    id: 'p-dip-tf1',
    kind: 'truefalse',
    moduleId: 'p-dip',
    section: 'Inversion: the policy owns the interface',
    prompt:
      'After dependency inversion, control flow reverses too: the Postgres repository now calls into the order service.',
    answer: false,
    explain:
      'At runtime the service still calls the database. What inverts is the source dependency: the Postgres class imports an interface the orders module owns, instead of the service importing Postgres.',
  },
  {
    id: 'p-dip-tf2',
    kind: 'truefalse',
    moduleId: 'p-dip',
    section: 'Injection: hand the dependency in',
    prompt: 'Setter injection is a reasonable choice for an optional collaborator with a sensible default, such as a logger.',
    answer: true,
    explain:
      'That is its one legitimate use. For a required dependency, a setter lets the object exist half-built between construction and the call; constructor injection rules that out.',
  },
  {
    id: 'p-dip-multi',
    kind: 'multi',
    moduleId: 'p-dip',
    section: 'Testability with fakes',
    prompt: 'A service receives its dependencies through the constructor. Which of these are sound testing choices?',
    options: [
      'An in-memory repository, asserting the order now exists',
      'A mock verifying the card was charged exactly once',
      'Your own wrapper around Stripe, faked in unit tests',
      'Mocking Stripe\'s client library directly',
      'A mock for every collaborator, verifying each call',
      'An interface for `Money`, so tests can fake it',
    ],
    correct: [0, 1, 2],
    explain:
      'Fake what you query and assert on outcomes; mock only where the call is the behaviour. Do not mock what you do not own, and a suite of mocks pins the implementation. Value objects need no seam.',
  },
  {
    id: 'p-dip-match',
    kind: 'match',
    moduleId: 'p-dip',
    section: 'Containers: when they earn their keep',
    prompt: 'Match each term to what it actually describes.',
    pairs: [
      { left: 'Dependency inversion', right: 'Which way the imports point' },
      { left: 'Dependency injection', right: 'How an object receives its collaborators' },
      { left: 'Inversion of control', right: 'A framework calls your code' },
      { left: 'Container', right: 'A tool that automates injection and lifetimes' },
      { left: 'Composition root', right: 'The one place near the entry point that wires it all' },
    ],
    explain:
      'Dependency inversion, injection and inversion of control are often blurred. A container that injects concrete classes does plenty of injection and no dependency inversion; Express calling your handler is inversion of control.',
  },

  /* ---------------------------------------------------------------- */
  /* p-simplicity                                                      */
  /* ---------------------------------------------------------------- */
  {
    id: 'p-simplicity-tf1',
    kind: 'truefalse',
    moduleId: 'p-simplicity',
    section: 'YAGNI and the rule of three',
    prompt: 'By the rule of three, the second copy of similar code is the moment to extract a shared abstraction.',
    answer: false,
    explain:
      'The second time, you wince and duplicate. You refactor on the third, because three cases show what really varies, while two only show what happened to differ.',
  },
  {
    id: 'p-simplicity-tf2',
    kind: 'truefalse',
    moduleId: 'p-simplicity',
    section: 'Composition over inheritance',
    prompt:
      'A report composed of a formatter and a delivery gains exactly one class per new format, however many delivery methods exist.',
    answer: true,
    explain:
      'Composition adds formats to deliveries instead of multiplying them. With a subclass per combination, each new format would need one class per delivery method.',
  },
  {
    id: 'p-simplicity-multi',
    kind: 'multi',
    moduleId: 'p-simplicity',
    section: 'DRY is about knowledge, not code',
    prompt: 'Which of these are real [[DRY]] violations: one piece of knowledge living in several places?',
    options: [
      'A tax rate in code and again in a report query',
      'One validation rule coded on both client and server',
      'A free-shipping threshold in checkout and in an email',
      'Two loops of the same shape over unrelated data',
      'Pay and hours reports that compute hours alike today',
    ],
    correct: [0, 1, 2],
    explain:
      'Duplication is about decisions, not text. Look-alike code that would change for different reasons, at different people\'s request, is two pieces of knowledge, and merging it couples them.',
  },
  {
    id: 'p-simplicity-match',
    kind: 'match',
    moduleId: 'p-simplicity',
    section: 'KISS: simple is not the same as easy',
    prompt: 'Match each mistaken claim to the principle it gets wrong.',
    pairs: [
      { left: 'Never write similar code twice', right: 'DRY' },
      { left: 'Skip tests until a feature needs them', right: 'YAGNI' },
      { left: 'Use whatever the team already knows', right: 'KISS' },
      { left: 'Extend a class whenever you want its code', right: 'Composition over inheritance' },
    ],
    explain:
      '[[DRY]] is about knowledge, not look-alike code. [[YAGNI]] defers features, never tests; [[KISS]] means few intertwined parts, not familiar ones; and reuse should usually come from holding an object.',
  },

  /* ---------------------------------------------------------------- */
  /* p-clean                                                           */
  /* ---------------------------------------------------------------- */
  {
    id: 'p-clean-tf1',
    kind: 'truefalse',
    moduleId: 'p-clean',
    section: 'Crossing the boundary',
    prompt:
      'Because the core must never see a database connection, transaction boundaries belong inside each repository method, **not** in the use case.',
    answer: false,
    explain:
      'The use case is the unit of work, so it decides the boundary, through a port such as `UnitOfWork.run(fn)` that the database adapter implements. The core still never sees a connection.',
  },
  {
    id: 'p-clean-tf2',
    kind: 'truefalse',
    moduleId: 'p-clean',
    section: 'Onion, clean, hexagonal: one idea, three drawings',
    prompt:
      'Hexagonal, onion and clean architecture differ in emphasis but rest on one rule: source dependencies point toward the business rules.',
    answer: true,
    explain:
      'Hexagonal stresses symmetry, onion draws rings around the domain, and clean names the rule and separates use cases from entities. Pick one vocabulary in an interview and keep to it.',
  },
  {
    id: 'p-clean-multi',
    kind: 'multi',
    moduleId: 'p-clean',
    section: 'Hexagonal: ports and adapters',
    prompt: 'In ports and adapters, which of these *drive* the application, rather than being driven by it?',
    options: [
      'An HTTP controller',
      'A queue consumer',
      'A test harness calling the use case',
      'A Postgres repository',
      'A Stripe payments gateway',
      'An in-memory fake repository',
    ],
    correct: [0, 1, 2],
    explain:
      'Driving adapters call the ports the application offers, such as `PlaceOrder`: an [[HTTP]] controller, a consumer or a test. Driven adapters implement the ports it needs, whether real or fake.',
  },
  {
    id: 'p-clean-match',
    kind: 'match',
    moduleId: 'p-clean',
    section: 'Layers and the dependency rule',
    prompt: 'Match each part of an order service to its ring in clean architecture.',
    pairs: [
      { left: 'Tax and discount rules', right: 'Entities' },
      { left: 'Place an order, issue a refund', right: 'Use cases' },
      { left: 'A controller, or a repository class', right: 'Interface adapters' },
      { left: 'The web framework and the database driver', right: 'Frameworks and drivers' },
    ],
    explain:
      'Entities hold rules that would exist without software, and use cases hold application rules. Adapters translate between them and the outermost ring, and every import points inward.',
  },

  /* ---------------------------------------------------------------- */
  /* l-round                                                           */
  /* ---------------------------------------------------------------- */
  {
    id: 'l-round-tf1',
    kind: 'truefalse',
    moduleId: 'l-round',
    section: 'The 45 minutes',
    prompt: 'Naming a few design patterns you could use, before any requirement calls for them, earns credit for breadth.',
    answer: false,
    explain:
      'A pattern is justified by a requirement, never listed for its own sake. "Strategy, because pricing varies by lot" scores; "I used Strategy" is a keyword.',
  },
  {
    id: 'l-round-tf2',
    kind: 'truefalse',
    moduleId: 'l-round',
    section: 'What to code and what to sketch',
    prompt:
      'A part of the design that holds no rule or race, but where a likely follow-up will plug in, is best shown as an interface rather than written in full.',
    answer: true,
    explain:
      'Write in full the methods that carry the rules and the race. Give a likely seam an interface, such as a pricing strategy, and skip getters and persistence out loud.',
  },
  {
    id: 'l-round-multi',
    kind: 'multi',
    moduleId: 'l-round',
    section: 'What the round tests',
    prompt: 'Which of these does a low-level design interviewer actually score?',
    options: [
      'Whether a book is modelled apart from its copies',
      'Whether the core method works, with its error cases',
      'How little code changes when a requirement is added',
      'Whether the diagram follows strict UML notation',
      'Whether every class has getters and setters',
      'Whether persistence is fully implemented',
    ],
    correct: [0, 1, 2],
    explain:
      'Modelling, working code, extensibility and correctness under pressure carry the score. Strict [[UML]], boilerplate accessors and persistence are plumbing to skip, out loud.',
  },
  {
    id: 'l-round-match',
    kind: 'match',
    moduleId: 'l-round',
    section: 'The prompts you will meet',
    prompt: 'Match each classic prompt to the follow-up its interviewer usually adds.',
    pairs: [
      { left: 'Parking lot', right: 'A new vehicle type; pricing by time' },
      { left: 'Elevator', right: 'Swap the scheduling algorithm' },
      { left: 'Vending machine', right: 'Sold out mid-purchase; refunds' },
      { left: 'LRU cache', right: 'Thread safety; per-entry expiry' },
      { left: 'Rate limiter', right: 'Limits per client, across many servers' },
    ],
    explain:
      'Every prompt has a predictable second act. Put an interface at that seam, or for the [[LRU]] cache know where the lock goes, and the follow-up needs no rewrite.',
  },

  /* ---------------------------------------------------------------- */
  /* l-modelling                                                       */
  /* ---------------------------------------------------------------- */
  {
    id: 'l-modelling-tf1',
    kind: 'truefalse',
    moduleId: 'l-modelling',
    section: 'Nouns to classes, verbs to methods',
    prompt: 'A late fine appears as a noun in the library requirements, so it deserves its own `Fine` class.',
    answer: false,
    explain:
      'Nouns are candidates, not classes. Measurements become value objects: a fine is an amount of money, so it is a `Money` that `Loan` computes, not a class with no behaviour of its own.',
  },
  {
    id: 'l-modelling-tf2',
    kind: 'truefalse',
    moduleId: 'l-modelling',
    section: 'Enums or classes',
    prompt: 'The sign that an enum wants to become classes is the same `switch` on it turning up in a second place.',
    answer: true,
    explain:
      'Each copy of the switch is a place the next variant must find. Until then, an enum with one exhaustive switch is simpler, and the compiler checks every case.',
  },
  {
    id: 'l-modelling-multi',
    kind: 'multi',
    moduleId: 'l-modelling',
    section: 'Value objects and entities',
    prompt: 'Which of these are best modelled as value objects rather than entities?',
    options: [
      'A sum of money in a currency',
      'A loan period from one date to another',
      'A latitude and longitude pair',
      'One member\'s loan of one copy',
      'A library member who may change their name',
      'A physical copy with a barcode and a status',
    ],
    correct: [0, 1, 2],
    explain:
      'A value is defined by its attributes: immutable, compared by value, replaced rather than edited. A loan, a member and a copy each have an identity and a lifecycle that survive changes to their fields.',
  },
  {
    id: 'l-modelling-match',
    kind: 'match',
    moduleId: 'l-modelling',
    section: 'Assigning responsibility with GRASP',
    prompt: 'Match each [[GRASP]] principle to the placement it justifies in a library model.',
    pairs: [
      { left: 'Information expert', right: '`Member` answers `canBorrow()`' },
      { left: 'Creator', right: '`Library` constructs each `Loan` it records' },
      { left: 'Controller', right: '`Library.checkout()` receives the request' },
      { left: 'Pure fabrication', right: 'A `FinePolicy` invented to hold a rule' },
      { left: 'Protected variations', right: 'An interface where change is expected' },
    ],
    explain:
      'The member holds its loans, the library records every loan, and the controller coordinates without deciding. When no domain object fits a job, invent one; where change is expected, add an interface.',
  },

  /* ---------------------------------------------------------------- */
  /* l-extension                                                       */
  /* ---------------------------------------------------------------- */
  {
    id: 'l-extension-tf1',
    kind: 'truefalse',
    moduleId: 'l-extension',
    section: 'Polymorphism over switch-on-type',
    prompt: 'A `switch` on vehicle type is already a design flaw the first time you write it.',
    answer: false,
    explain:
      'The switch is not wrong on day one. It becomes wrong at the second copy, because from then on every new type is a hunt for every switch.',
  },
  {
    id: 'l-extension-tf2',
    kind: 'truefalse',
    moduleId: 'l-extension',
    section: 'Extension points, and where to stop',
    prompt:
      'If the interviewer pushes on a variation you did not anticipate, extracting an interface there and then, out loud, is a senior answer.',
    answer: true,
    explain:
      'Seams cost indirection, so you place them only where the follow-up is predictable. Refactoring to a new seam when a real requirement arrives is the same judgement, applied later.',
  },
  {
    id: 'l-extension-multi',
    kind: 'multi',
    moduleId: 'l-extension',
    section: 'Strategy: what varies independently of the type',
    prompt:
      'Parking prices use a strategy class per kind of rule and configuration for the numbers. Which of these changes need no new class?',
    options: [
      'Vans go from £3.50 to £4 an hour',
      'A new lot opens at £2 an hour',
      'The first hour becomes free',
      'A flat fee applies during concert evenings',
      'Fees are capped at a daily maximum',
    ],
    correct: [0, 1],
    explain:
      'A new rate is a configuration change with no deploy. A free first hour, event pricing or a daily cap is a new kind of rule, so it is a new strategy class.',
  },
  {
    id: 'l-extension-match',
    kind: 'match',
    moduleId: 'l-extension',
    section: 'Extension points, and where to stop',
    prompt: 'Match each variation in a parking lot to where it belongs.',
    pairs: [
      { left: 'A bus needs two adjacent coach bays', right: 'A subclass of `Vehicle`' },
      { left: 'Fees change at weekends and during events', right: 'An injected pricing strategy' },
      { left: 'Cars cost £2.50 an hour and vans £4', right: 'A rate table in configuration' },
      { left: 'One special case, with no second in sight', right: 'A plain `if`' },
      { left: 'Turning "bus" from the gate into a `Bus`', right: 'A map from name to constructor' },
    ],
    explain:
      'Behaviour that differs by type goes on the type; variation independent of it is injected; numbers are data. One case stays an `if`, and one registry is the only place that knows every type.',
  },

  /* ---------------------------------------------------------------- */
  /* l-concurrency                                                     */
  /* ---------------------------------------------------------------- */
  {
    id: 'l-concurrency-tf1',
    kind: 'truefalse',
    moduleId: 'l-concurrency',
    section: 'Atomic operations and immutability',
    prompt:
      'With Java\'s `ConcurrentHashMap`, checking `containsKey` and then calling `put` is safe, because every operation on the map is thread-safe.',
    answer: false,
    explain:
      'Each call is safe alone, but the pair is check-then-act: two threads can both see the key missing and both load it. `computeIfAbsent` does the check and the insert as one atomic step.',
  },
  {
    id: 'l-concurrency-tf2',
    kind: 'truefalse',
    moduleId: 'l-concurrency',
    section: 'Singletons and lazy initialisation',
    prompt:
      'In TypeScript, caching the promise from `createPool()`, rather than the awaited pool, stops two concurrent callers from creating two pools.',
    answer: true,
    explain:
      'The promise is stored synchronously, before anything awaits, so a second caller shares the one in flight. Caching the value leaves a gap at the `await` where both callers see nothing yet.',
  },
  {
    id: 'l-concurrency-multi',
    kind: 'multi',
    moduleId: 'l-concurrency',
    section: 'Locks, and a small Mutex',
    prompt: 'A wallet guards each balance\'s read-modify-write with an in-process mutex. Which of these are sound choices?',
    options: [
      'One lock per user, not one for the whole wallet',
      'Hold the lock only for the read-modify-write',
      'Evict idle per-user locks from the map',
      'Hold the lock across the payment provider call',
      'Rely on the same mutex across three server instances',
    ],
    correct: [0, 1, 2],
    explain:
      'Scope and duration matter more than the code: lock only what conflicts, briefly, and keep the lock map bounded. An in-process lock protects nothing on another server, and a slow call inside it stalls everyone.',
  },
  {
    id: 'l-concurrency-match',
    kind: 'match',
    moduleId: 'l-concurrency',
    section: 'Optimistic or pessimistic',
    prompt: 'Match each piece of contested state to the cheapest sound way to protect it.',
    pairs: [
      { left: 'A counter every request increments', right: 'An atomic increment' },
      { left: 'A bay claimed by servers sharing a database', right: 'A conditional UPDATE on the row' },
      { left: 'A bay claimed inside one Node process', right: 'A synchronous claim before any await' },
      { left: 'A pricing table never to be seen half-updated', right: 'Build a new copy and swap the reference' },
      { left: 'Hot state with frequent conflicts, costly retries', right: 'Pessimistic: lock, then work' },
    ],
    explain:
      'Fold check-then-act into one step where you can, and put it where the state lives. Immutable copies need no lock for readers; a lock up front pays only when conflicts are common.',
  },
]
