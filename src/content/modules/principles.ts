import type { Module } from '../types'

/**
 * Track — Software design principles (P).
 * trackId: 'principles'. Authoring rules: docs/superpowers/plans/2026-11-18-content-brief.md
 *
 * The design of code, before the design of systems. Every idea here comes back at service
 * scale later in the journey: coupling becomes service boundaries, dependency inversion
 * becomes ports and adapters. Each lesson shows the idea in TypeScript, because the
 * low-level design round is judged on the code you would write, not the definitions.
 */
export const principlesModules: Module[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'p-oop',
    trackId: 'principles',
    title: "OOP's four pillars, used properly",
    station: 1,
    prereqs: ['f-what'],
    minutes: 12,
    summary: 'Encapsulation, abstraction, inheritance and polymorphism: what each buys you, and how each is misused.',
    objectives: [
      'Say what each pillar buys you, and the misuse an interviewer is listening for',
      'Replace a type switch with polymorphism, and know when the switch is the better design',
      'Apply **tell, don\'t ask** and spot a chain of getters reaching through three objects',
    ],
    keywords: [
      'object-oriented',
      'encapsulation',
      'abstraction',
      'inheritance',
      'polymorphism',
      'tell dont ask',
      'law of demeter',
      'expression problem',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Every candidate can define the four pillars of [[OOP]], and nobody is scored on the definitions. In a low-level design round the interviewer reads your classes for whether you **use** them. Is state private, and changed only through methods that keep it valid? Does a new kind of thing arrive as a new class, or as one more branch in a `switch`?',
      },
      {
        kind: 'prose',
        text: 'The senior signal is knowing how each pillar goes wrong. Getters and setters on every field are not encapsulation. Inheriting to borrow a few methods is not modelling. This lesson takes each pillar in turn: what it buys you, and the misuse to avoid.',
      },
      {
        kind: 'figure',
        caption: 'The four pillars, by what each buys you. Only one of them is optional.',
        figure: {
          kind: 'stack',
          layers: [
            { label: 'Encapsulation', sub: 'invariants hold, because only the object changes its state', tone: 'line' },
            { label: 'Abstraction', sub: 'callers depend on what, not how', tone: 'line' },
            { label: 'Inheritance', sub: 'reuse of a parent the subclass can truly stand in for', tone: 'streak' },
            { label: 'Polymorphism', sub: 'new behaviour arrives as a new class, not a new branch', tone: 'mastered' },
          ],
          note: 'Go and Rust have no class inheritance and still do the other three. Inheritance is the pillar you can most often do without.',
        },
      },

      { kind: 'heading', text: 'Encapsulation protects invariants' },
      {
        kind: 'prose',
        text: 'An invariant is a rule that must always hold: a balance never drops below the overdraft limit, an order\'s total equals the sum of its lines, a date range starts before it ends. Encapsulation means the only code that can break the rule is inside the class, so the only code you have to read to trust the rule is inside the class.',
      },
      {
        kind: 'prose',
        text: 'The common misuse is mechanical: make every field private, generate a getter and a setter for each, and call it done. A public setter is a public field with extra steps. Any caller can still put the object into an invalid state, and the rule now lives wherever someone remembered to check it.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Setters: the rule lives in every caller',
          code: `class Account {
  private balance = 0
  getBalance() { return this.balance }
  setBalance(v: number) { this.balance = v }
}

// in a controller
if (acct.getBalance() >= amount) {
  acct.setBalance(acct.getBalance() - amount)
}

// in a nightly batch job: no check at all
acct.setBalance(acct.getBalance() - fee)`,
        },
        after: {
          title: 'Methods that keep the rule',
          code: `class Account {
  private balance = 0
  constructor(private readonly overdraft: number) {}

  withdraw(amount: number): void {
    if (amount <= 0) throw new RangeError('amount')
    if (this.balance - amount < -this.overdraft) {
      throw new InsufficientFunds(amount)
    }
    this.balance -= amount
  }

  get available(): number {
    return this.balance + this.overdraft
  }
}`,
        },
        note: 'The overdraft rule exists in one place. The batch job cannot skip it, because there is no longer any way to set the balance directly.',
      },
      {
        kind: 'prose',
        text: 'Immutability is the strongest form of encapsulation. An object that cannot change cannot be put into a bad state after construction, so validating once in the constructor is enough.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Java\'s Date',
        text: 'Java\'s original `java.util.Date` is mutable. Any class that returned its `Date` field from a getter handed callers a way to change its state, and the item on defensive copying in Effective Java is built around exactly this case. Java 8\'s `java.time` fixed it by making every type immutable: `LocalDate.plusDays` returns a new date instead of changing the old one.',
      },

      { kind: 'heading', text: 'Abstraction hides the decision that might change' },
      {
        kind: 'prose',
        text: 'In 1972 David Parnas argued that a system should be split into modules by the design decisions each one hides, not by the steps of the program. That is still the best test of an abstraction: what does the caller no longer need to know? A `PaymentGateway` with `charge(customer, amount)` hides which provider you use, how retries work and what goes over the wire. Change any of those and no caller changes.',
      },
      {
        kind: 'prose',
        text: 'Abstractions fail in two opposite ways:',
      },
      {
        kind: 'list',
        items: [
          '**Leaky.** The interface says `charge`, but it throws the provider\'s own exception types or returns the provider\'s response object. Callers start depending on the detail you meant to hide, and the interface is decoration.',
          '**Speculative.** An interface with one implementation, no second in sight and no test that needs a fake. It costs a file and an extra jump for every reader, and hides nothing anyone wanted hidden.',
        ],
      },
      {
        kind: 'prose',
        text: 'A good abstraction speaks the caller\'s language. `charge(customer, amount)` does. `createPaymentIntent(payload)` is the provider\'s language wearing an interface.',
      },

      { kind: 'heading', text: 'Inheritance is a promise, not a shortcut' },
      {
        kind: 'prose',
        text: 'Inheritance gives you two things at once: a subtype that can be used wherever the parent is expected, and the parent\'s code for free. Only take the second when you genuinely want the first. A subclass inherits every public method of its parent, forever, including the ones that make no sense for it.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Java\'s Stack',
        text: 'In Java, `java.util.Stack` extends `Vector` to reuse its storage. So every stack also offers `get(int)`, `insertElementAt` and `remove(int)`, and any caller can reach into the middle of what should be last-in, first-out. Its own documentation now points you to `ArrayDeque` instead. `Properties` extends `Hashtable` with the same flaw: it accepts non-string keys that its own `store` method then fails on.',
      },
      {
        kind: 'prose',
        text: 'The test is substitution, which the Liskov lesson makes precise: if code written against the parent would be surprised by the subclass, it is not a subtype. Use inheritance for shallow hierarchies you own, where the base class was designed to be extended. Otherwise hold the other object in a field and delegate to it.',
      },

      { kind: 'heading', text: 'Polymorphism replaces the type switch' },
      {
        kind: 'prose',
        text: 'Polymorphism lets one call do different things depending on the object that receives it. Its value shows up when a new variant arrives. With a `switch` on a type field, every function that switches must be found and edited. With polymorphism, the new variant is a new class, and code that calls the interface does not change.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'A switch in every function that cares',
          code: `type Ride = {
  tier: 'economy' | 'premium' | 'pool'
  km: number
  minutes: number
}

function fare(r: Ride): number {
  switch (r.tier) {
    case 'economy': return 2 + r.km * 1.1
    case 'premium': return 5 + r.km * 2 + r.minutes * 0.4
    case 'pool': return (2 + r.km * 1.1) * 0.7
  }
}

// ...and the same switch in eta(), receipt(), payout()`,
        },
        after: {
          title: 'One class per tier',
          code: `interface Tier {
  readonly label: string
  fare(km: number, minutes: number): number
}

class Economy implements Tier {
  readonly label = 'Economy'
  fare(km: number) { return 2 + km * 1.1 }
}

class Pool implements Tier {
  readonly label = 'Pool'
  constructor(private readonly base: Tier) {}
  fare(km: number, min: number) {
    return this.base.fare(km, min) * 0.7
  }
}

// a new tier is a new class; this line never changes
const price = ride.tier.fare(ride.km, ride.minutes)`,
        },
        note: '`Pool` reuses `Economy` by holding it, not by extending it: a first taste of composition.',
      },
      {
        kind: 'figure',
        caption: 'The ride makes one call; each tier answers it in its own way.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'Tier', stereotype: 'interface', fields: ['label: string'], methods: ['fare(km, minutes): number'], tone: 'line' },
            { name: 'Economy', methods: ['fare(km, minutes): number'] },
            { name: 'Premium', fields: ['perMinute: number'], methods: ['fare(km, minutes): number'] },
            { name: 'Pool', fields: ['base: Tier'], methods: ['fare(km, minutes): number'] },
            { name: 'Ride', fields: ['tier: Tier', 'km: number', 'minutes: number'], methods: ['price(): number'] },
          ],
          relations: [
            { from: 'Economy', to: 'Tier', kind: 'implements' },
            { from: 'Premium', to: 'Tier', kind: 'implements' },
            { from: 'Pool', to: 'Tier', kind: 'implements' },
            { from: 'Pool', to: 'Tier', kind: 'has', label: 'wraps a base tier' },
            { from: 'Ride', to: 'Tier', kind: 'has' },
          ],
        },
      },
      {
        kind: 'prose',
        text: 'Saying when polymorphism is the wrong answer is a senior move. It makes adding a **type** cheap and adding an **operation** expensive, because a new operation is a new method on every class. A `switch` is the reverse. The trade has a name: the expression problem.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Interface and classes',
          points: [
            'New variant: one new class, nothing else edited',
            'New operation: a method on every class',
            'Best when variants keep arriving: payment methods, file formats, fare tiers',
          ],
        },
        right: {
          title: 'Closed union and exhaustive switch',
          points: [
            'New variant: every switch must change, and the compiler lists them',
            'New operation: one new function',
            'Best when variants are fixed and operations grow: a parser\'s node types, a protocol\'s messages',
          ],
        },
        verdict: 'Pick by which axis is changing. In TypeScript, a discriminated union with a `never` check in the default branch makes the switch safe: a missing case is a compile error.',
      },

      { kind: 'heading', text: 'Tell, don\'t ask' },
      {
        kind: 'prose',
        text: '**Tell, don\'t ask** is encapsulation applied to calls. Asking pulls data out of an object, makes a decision and pushes the result back in. Telling sends the object a request and lets it decide. The `Account` above is the telling version: the caller says `withdraw(amount)` instead of reading the balance and deciding on the account\'s behalf.',
      },
      {
        kind: 'prose',
        text: 'Its sibling is the Law of Demeter: talk to your direct collaborators, not to theirs. `order.getCustomer().getAddress().getCity()` couples the caller to the structure of three classes. If the caller needs a shipping zone, it should ask `order.shippingZone()` and let `Order` do the navigating.',
      },
      {
        kind: 'prose',
        text: 'Taken too far, the idea turns objects into dumping grounds: an `Order` that renders its own invoice, sends its own emails and saves itself. Queries that return data are fine. What you avoid is deciding, outside an object, something only that object should decide.',
      },

      { kind: 'heading', text: 'A preview: composition over inheritance' },
      {
        kind: 'prose',
        text: 'When behaviour varies along two axes, inheritance multiplies. A notifier that sends by email or push, immediately or in batches, needs four subclasses, and a third channel makes six. Composition adds instead: a `Notifier` holds a channel and a schedule, and a new channel is one class. The simplicity lesson returns to this, with the reason it matters most: the fragile base class.',
      },
      {
        kind: 'figure',
        caption: 'Two axes of variation: inheritance multiplies the classes, composition adds them.',
        figure: {
          kind: 'split',
          left: {
            title: 'A subclass per combination',
            tone: 'alert',
            nodes: [
              { label: 'Notifier', to: 'extended by' },
              { label: 'EmailNow, EmailBatched', sub: 'PushNow, PushBatched', tone: 'alert' },
            ],
            cost: 'Channels times schedules. A third channel adds two more classes.',
          },
          right: {
            title: 'Compose the parts',
            tone: 'mastered',
            nodes: [
              { label: 'Notifier', sub: 'holds a channel and a schedule', to: 'composed of' },
              { label: 'Email, Push', sub: 'Now, Batched', tone: 'mastered' },
            ],
            cost: 'Channels plus schedules. A third channel adds one class.',
          },
          verdict: 'Inheritance fixes the combination when you write the code. Composition picks it when you build the object.',
        },
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'State is private and changes only through methods that enforce the rules. New behaviour arrives as a new class behind an interface, not another branch in a switch. I use inheritance only when the subclass can stand in for the parent everywhere; otherwise I compose.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Reciting four definitions and stopping. Or generating a getter and a setter for every field and calling it encapsulation. The interviewer will ask where the invariant is enforced, and the honest answer is "everywhere, hopefully".',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Isn\'t a switch on type sometimes better than polymorphism?',
            a: 'Yes, when the set of variants is closed and the operations keep growing, as with a parser\'s node types or a protocol\'s message types. A discriminated union with an exhaustive switch makes each new operation one function, and the compiler flags a missing case. When the variants are what keeps growing, polymorphism wins.',
          },
          {
            q: 'If getters weaken encapsulation, how does the screen show an account\'s balance?',
            a: 'Queries are fine; setters and outside decisions are the problem. Expose read-only properties or a snapshot object for display, and keep every state change behind a method that checks the rules. Separating commands from queries keeps both honest.',
          },
          {
            q: 'When is inheritance the right tool?',
            a: 'When the subclass is a true subtype, the hierarchy is shallow, you own both sides, and the base class was designed for it. Java\'s `AbstractList` is the model: implement `get` and `size`, inherit the rest, with the base\'s self-calls documented. Across library boundaries, prefer composition.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-p-oop-1',
        moduleId: 'p-oop',
        stem: 'An `Account` has a public `balance` field, and three services subtract from it directly. Which change actually improves encapsulation?',
        options: [
          'Make `balance` private and add `getBalance()` and `setBalance()`',
          'Move `balance` into a separate `AccountData` object that the services share',
          'Turn `Account` into an interface so each service can implement it',
          'Make `balance` private and add `withdraw()` and `deposit()` that reject an overdraft',
        ],
        correct: 3,
        explain: 'Encapsulation is about who can break the invariant. With a setter, any service can still write any value, so the overdraft rule lives in every caller. Methods that enforce the rule leave exactly one place where the balance can change.',
      },
      {
        id: 'q-p-oop-2',
        moduleId: 'p-oop',
        stem: 'Java\'s `Stack` extends `Vector`. What is the design problem?',
        options: [
          '`Vector` is synchronised, so every stack operation pays for a lock',
          'Inheritance is always wrong in Java; it should have been an interface',
          'A stack inherits methods like `insertElementAt`, so callers can break last-in, first-out order',
          '`Stack` cannot be generic, because `Vector` is not',
        ],
        correct: 2,
        explain: 'A subclass inherits every public method of its parent, including ones that break what a stack promises. The locking cost is real, but it is a performance issue, not the modelling flaw. Holding a list in a field and exposing only `push` and `pop` would have kept the abstraction.',
      },
      {
        id: 'q-p-oop-3',
        moduleId: 'p-oop',
        stem: 'A tax engine handles a fixed set of transaction types set by regulation, but keeps gaining operations: audit export, risk score, refund rules. Which structure makes each new operation cheapest?',
        options: [
          'A class per transaction type, with a method per operation',
          'A discriminated union of transaction types, with an exhaustive switch per operation',
          'A base class with a template method that each type overrides',
          'A singleton registry of handlers keyed by type name',
        ],
        correct: 1,
        explain: 'With classes, every new operation is a new method on every class. When the types are fixed and the operations grow, the switch is the cheap axis: one new function per operation, and the compiler flags a missing case. Choosing by the axis of change is the senior answer to the expression problem.',
      },
    ],
    cards: [
      {
        id: 'c-p-oop-1',
        moduleId: 'p-oop',
        front: 'What does encapsulation actually protect?',
        back: 'Invariants. State is private and changes only through methods that keep it valid. A getter and setter for every field protects nothing.',
        tag: 'OOP',
      },
      {
        id: 'c-p-oop-2',
        moduleId: 'p-oop',
        front: 'When is inheritance justified?',
        back: 'When the subclass can stand in for the parent everywhere, the hierarchy is shallow, and the base was designed for extension. Reusing code is not enough.',
        tag: 'OOP',
      },
      {
        id: 'c-p-oop-3',
        moduleId: 'p-oop',
        front: 'Polymorphism or a switch on type?',
        back: 'Polymorphism when new types keep arriving. An exhaustive switch over a closed union when the types are fixed and new operations keep arriving.',
        tag: 'OOP',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'p-coupling',
    trackId: 'principles',
    title: 'Coupling and cohesion',
    station: 2,
    prereqs: ['p-oop'],
    related: ['c-queues'],
    minutes: 12,
    summary: 'How much modules know about each other, how well each one hangs together, and why both decide the cost of a change.',
    objectives: [
      'Name the five kinds of coupling and fix each one in code',
      'Tell functional cohesion from coincidental, in a class, a folder and a service',
      'Argue a boundary from what changes together',
    ],
    keywords: [
      'coupling',
      'cohesion',
      'control coupling',
      'stamp coupling',
      'connascence',
      'shared database',
      'package by feature',
      'distributed monolith',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Every argument about where code belongs comes down to one question: what has to change together? **Coupling** is how much one module depends on the details of another. **Cohesion** is how much the things inside one module belong together. They are the words a senior engineer uses to justify a boundary, and an interviewer expects you to say which kind you mean.',
      },
      {
        kind: 'prose',
        text: 'The same two ideas decide service boundaries. A shared database is coupling; a service that does everything for one entity has poor cohesion. Get them right in a class and you can argue them for a whole system.',
      },
      {
        kind: 'figure',
        caption: 'Five kinds of coupling, from the most damaging to the least.',
        figure: {
          kind: 'stack',
          layers: [
            { label: 'Content', sub: 'reaches into another module\'s internals', tone: 'alert' },
            { label: 'Common', sub: 'shares mutable global state', tone: 'alert' },
            { label: 'Control', sub: 'passes a flag that steers the callee\'s logic', tone: 'streak' },
            { label: 'Stamp', sub: 'passes a whole structure to use one field', tone: 'streak' },
            { label: 'Data', sub: 'passes only the values the callee needs', tone: 'mastered' },
          ],
          note: 'Each step down, the caller knows less about how the callee works, so less breaks when it changes.',
        },
      },

      { kind: 'heading', text: 'Five kinds of coupling, worst first' },
      {
        kind: 'prose',
        text: 'The scale comes from the structured design work of the 1970s and has aged well. Learn it as a set of smells you can point at in code review:',
      },
      {
        kind: 'table',
        head: ['Kind', 'What it looks like', 'The fix'],
        rows: [
          ['**Content**', 'Casting to read a private field, monkey-patching a library, one service querying another\'s tables', 'Go through the public interface, or add one'],
          ['**Common**', 'A global config object or module-level cache that several modules write to', 'Give the state one owner and pass it in'],
          ['**Control**', '`save(user, true, false)`: a boolean or mode argument that picks a branch inside the callee', 'Split into named functions, or pass the behaviour in'],
          ['**Stamp**', '`sendWelcome(user: User)` that only reads `user.email`', 'Ask for the fields it reads, or a narrow type'],
          ['**Data**', '`sendWelcome(email)`', 'Nothing: this is the target'],
        ],
      },
      {
        kind: 'prose',
        text: 'Control coupling is the one candidates most often write live. A flag argument means the caller knows how the callee is built inside, and every call site reads like `notify(user, 2)`. Stamp coupling is subtler: the callee now breaks when `User` changes shape, and every test has to build a full `User` to exercise one field.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Control and stamp coupling',
          code: `function notify(user: User, mode: number) {
  if (mode === 1) {
    mailer.send(user.email, welcome(user.name))
  } else if (mode === 2) {
    texts.send(user.phone, otpMessage())
  } else {
    mailer.send(user.email, resetLink(user.id))
  }
}

notify(user, 2) // what is 2?`,
        },
        after: {
          title: 'Named functions, narrow inputs',
          code: `type Recipient = Pick<User, 'email' | 'name'>

function sendWelcome(to: Recipient) {
  mailer.send(to.email, welcome(to.name))
}

function sendOtp(phone: string, code: string) {
  texts.send(phone, otpMessage(code))
}

function sendReset(email: string, token: ResetToken) {
  mailer.send(email, resetLink(token))
}

sendOtp(user.phone, code) // says what it means`,
        },
        note: 'Each call site now says what it means, and each function names exactly the fields it reads. TypeScript\'s structural typing makes the narrow type free: any object with an `email` and a `name` will do.',
      },
      {
        kind: 'prose',
        text: 'Stamp versus data is a judgement, not a rule. A tax calculation that reads most of an `Order` should take the `Order`; nine loose parameters would be worse. The test is whether the callee depends on parts of the structure it does not use.',
      },

      { kind: 'heading', text: 'Cohesion: what belongs together' },
      {
        kind: 'prose',
        text: 'Cohesion is about the inside of a module. **Functional cohesion** means every part serves one purpose, so the module changes for one reason. **Coincidental cohesion** means the parts share a file and nothing else. `utils.ts`, a `helpers/` folder and anything named `Manager` are the usual addresses.',
      },
      {
        kind: 'figure',
        caption: 'A utilities file changes for every reason; a module with one purpose changes for one.',
        figure: {
          kind: 'split',
          left: {
            title: 'Coincidental: utils.ts',
            tone: 'alert',
            nodes: [
              { label: 'formatDate, retry', sub: 'slugify, parseMoney', to: 'changed by' },
              { label: 'Four unrelated features', sub: 'every ticket touches it', tone: 'alert' },
            ],
            cost: 'Everything imports it, so everything is coupled to everything.',
          },
          right: {
            title: 'Functional: money/',
            tone: 'mastered',
            nodes: [
              { label: 'parse, format', sub: 'add, allocate', to: 'changed by' },
              { label: 'Money rules only', sub: 'one reason to change', tone: 'mastered' },
            ],
            cost: 'Importers depend on one idea, and its tests cover one idea.',
          },
          verdict: 'Group by purpose, not by the kind of code.',
        },
      },
      {
        kind: 'prose',
        text: 'Between the extremes sit groupings that look tidy but are weak: **logical** cohesion (all the validators together, though they validate unrelated things) and **temporal** cohesion (everything that runs at startup). Folders follow the same rule. Packaging by layer, with `controllers/`, `services/` and `repositories/`, is logical cohesion: one new feature edits all three folders. Packaging by feature, with `orders/` and `billing/`, puts the things that change together side by side.',
      },

      { kind: 'heading', text: 'Why it matters: the cost of a change' },
      {
        kind: 'prose',
        text: 'Both ideas measure one thing from two sides: how far a change spreads. Low coupling stops a change at the module boundary. High cohesion makes the change land in one module instead of being smeared across five. A useful interview habit is to name a likely change and trace it out loud: "if the tax rule changes, which classes do I edit?" The answer should be one.',
      },
      {
        kind: 'figure',
        caption: 'Tracing a tax change: both callers depend on one narrow method, so the edit stops at one class.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'TaxPolicy', stereotype: 'interface', methods: ['taxFor(order): Money'], tone: 'line' },
            { name: 'Checkout', methods: ['total(order): Money'] },
            { name: 'Invoicing', methods: ['issue(order): Invoice'] },
            { name: 'CountryTaxPolicy', fields: ['rates: RateTable'], methods: ['taxFor(order): Money'], tone: 'mastered' },
          ],
          relations: [
            { from: 'Checkout', to: 'TaxPolicy', kind: 'uses', label: 'data coupling only' },
            { from: 'Invoicing', to: 'TaxPolicy', kind: 'uses' },
            { from: 'CountryTaxPolicy', to: 'TaxPolicy', kind: 'implements' },
          ],
          note: 'A new rate or rule edits `CountryTaxPolicy` alone. Neither caller knows how tax is worked out, only that an order goes in and money comes out.',
        },
      },
      {
        kind: 'prose',
        text: 'For finer distinctions there is **connascence**, Meilir Page-Jones\'s term: two pieces of code are connascent if changing one forces a change in the other. Agreeing on a name is the weakest kind. Agreeing on what a value means (`2` means "send a one-time code") or on argument order is stronger. Agreeing on execution order (call `init` first) is stronger still. Every kind gets worse with distance: tolerable inside one function, painful across services.',
      },

      { kind: 'heading', text: 'The same idea between services' },
      {
        kind: 'prose',
        text: 'Every kind of coupling has a service-level version, and the distributed one is worse, because you cannot refactor across a network in one commit:',
      },
      {
        kind: 'list',
        items: [
          '**Content and common coupling:** two services reading and writing the same tables. Neither can change the schema without the other, and neither owns the invariants.',
          '**Control coupling:** an endpoint with a `mode` parameter that behaves differently for each caller. Every caller now depends on the callee\'s internals.',
          '**Temporal coupling:** a synchronous chain where A calls B, which calls C. If C is down, A fails. A queue between them removes the dependency on timing, not the dependency on the contract.',
          '**Deployment coupling:** services that must ship together. That is a distributed monolith: every cost of microservices and none of the independence.',
        ],
      },
      {
        kind: 'prose',
        text: 'Cohesion has a service version too. A service per entity (`UserService`, `OrderService`, `ProductService`) looks neat, but placing one order calls all three, so they change and fail together. A service per business capability, such as checkout, catalogue or fulfilment, keeps a feature\'s change inside one team\'s code.',
      },
      {
        kind: 'figure',
        caption: 'Common coupling at service level: a shared database, versus each service owning its data.',
        figure: {
          kind: 'split',
          left: {
            title: 'Shared database',
            tone: 'alert',
            nodes: [
              { label: 'Orders and Billing', sub: 'both write', to: 'the same tables' },
              { label: 'orders schema', sub: 'owned by no one', tone: 'alert' },
            ],
            cost: 'Renaming a column is a coordinated release of two services.',
          },
          right: {
            title: 'Each service owns its data',
            tone: 'mastered',
            nodes: [
              { label: 'Billing', to: 'calls or subscribes' },
              { label: 'Orders', sub: 'sole owner of its tables', tone: 'mastered' },
            ],
            cost: 'One more hop, but the schema can change behind a stable contract.',
          },
          verdict: 'Coupling to a published contract is cheap. Coupling to someone else\'s storage is not.',
        },
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Amazon\'s service mandate',
        text: 'As Steve Yegge later recounted, Jeff Bezos told Amazon\'s teams in the early 2000s that they must expose their data and functionality only through service interfaces: no direct reads of another team\'s data store, no shared memory, no back doors. It was a ban on content and common coupling between teams, enforced from the top, and Yegge credits it with turning Amazon into a platform company.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'I want things that change together to live together, and everything else to talk through a narrow interface that carries only the data it needs. Here, a tax change edits exactly one class. Between services the same rule means each service owns its tables, and everyone else goes through its [[API]].',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Calling a design "loosely coupled" without saying what is coupled to what. Or splitting one cohesive module into three services and calling the network calls decoupling: every dependency is still there, now with latency and partial failure on top.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Isn\'t some coupling unavoidable?',
            a: 'Yes. Modules with no coupling do not talk to each other. The goal is to couple to stable things, such as interfaces, plain data and published contracts, and to point dependencies at whatever changes least. Business rules should not depend on a web framework that ships a major version every year.',
          },
          {
            q: 'How would you spot low cohesion in code review?',
            a: 'Names like `Manager`, `Helper` or `Utils`. Methods that touch none of the class\'s fields. A file that shows up in unrelated tickets in the history. A test that needs fakes for five collaborators to exercise one method.',
          },
          {
            q: 'When is a shared database acceptable?',
            a: 'Inside one service or one team\'s boundary, where one group owns the schema. In a modular monolith it works if each module owns its tables and the others go through that module\'s code. Across teams, publish a view or an endpoint as the contract, so the tables behind it can change.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-p-coupling-1',
        moduleId: 'p-coupling',
        stem: '`chargeCard(order, true)`, where `true` tells the function to skip the fraud check. Which kind of coupling is this?',
        options: [
          'Data coupling: it only passes values',
          'Stamp coupling: it passes the whole order',
          'Control coupling: the flag steers the callee\'s internal logic',
          'Content coupling: it reaches into the payment module',
        ],
        correct: 2,
        explain: 'The boolean decides which branch runs inside the callee, so the caller has to know how the callee is built. Passing the whole order may also be stamp coupling, but the flag is the sharper smell. Fix it with two named functions, or by passing the fraud policy in.',
      },
      {
        id: 'q-p-coupling-2',
        moduleId: 'p-coupling',
        stem: '`sendReceipt(customer: Customer)` only ever reads `customer.email`. What is the problem, and the fix?',
        options: [
          'Content coupling; make the `Customer` fields private',
          'Stamp coupling; accept the email, or a narrow type with only the fields it reads',
          'Common coupling; read the customer from a global store instead',
          'No problem; passing whole objects is always better than passing primitives',
        ],
        correct: 1,
        explain: 'The function depends on the whole shape of `Customer`, so unrelated changes can break it, and every test must build a full customer. Passing a whole object is right when the callee uses most of it; here it uses one field.',
      },
      {
        id: 'q-p-coupling-3',
        moduleId: 'p-coupling',
        stem: 'The orders and billing services both read and write the same `orders` table. What is the main risk?',
        options: [
          'Too many connections to one database',
          'Extra network latency between the two services',
          'None, as long as both use the same data access library',
          'A schema change for one silently breaks the other, and neither owns the invariants',
        ],
        correct: 3,
        explain: 'This is common coupling across a team boundary. Connection counts and latency are operational details you can tune. The design problem is that the schema has become an unversioned contract between two services that ship separately.',
      },
    ],
    cards: [
      {
        id: 'c-p-coupling-1',
        moduleId: 'p-coupling',
        front: 'The five kinds of coupling, worst first?',
        back: 'Content (reaches into internals), common (shared globals), control (flags that steer the callee), stamp (a whole structure for one field), data (only what it needs).',
        tag: 'Coupling',
      },
      {
        id: 'c-p-coupling-2',
        moduleId: 'p-coupling',
        front: 'Functional versus coincidental cohesion?',
        back: 'Functional: every part serves one purpose and changes for one reason. Coincidental: the parts share a file and nothing else, like `utils.ts`.',
        tag: 'Cohesion',
      },
      {
        id: 'c-p-coupling-3',
        moduleId: 'p-coupling',
        front: 'Why is a database shared between services a coupling problem?',
        back: 'Any schema change can break a service you do not own, and nobody owns the invariants. Each service owns its tables; others use its contract.',
        tag: 'Coupling',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'p-srp-ocp',
    trackId: 'principles',
    title: 'SOLID: single responsibility and open/closed',
    station: 3,
    prereqs: ['p-coupling'],
    minutes: 10,
    summary: 'One actor per module, and new behaviour by addition rather than by edit.',
    objectives: [
      'State [[SRP]] as **one actor, one reason to change**, and split a class along it',
      'Add a payment method without editing checkout, using an interface and a registry',
      'Decide which axis of change deserves an extension point',
    ],
    keywords: [
      'single responsibility',
      'open closed',
      'solid',
      'reason to change',
      'actor',
      'strategy',
      'extension point',
      'plugin',
    ],
    lesson: [
      {
        kind: 'prose',
        text: '[[SOLID]] is the vocabulary interviewers reach for when they push on your classes. "Who asks for changes to this class?" is a single responsibility question. "What happens when we add a payment method?" is an open/closed question. Robert Martin gathered the five principles around 2000, and Michael Feathers later arranged them into the acronym.',
      },
      {
        kind: 'prose',
        text: 'The first two are the most misquoted. The [[SRP]] is not "a class should do one thing", and the [[OCP]] does not mean "never edit code". The precise versions are far more useful, and stating them precisely is a senior signal on its own.',
      },
      {
        kind: 'figure',
        caption: 'One class, three actors: every one of their changes lands in the same file.',
        figure: {
          kind: 'stack',
          layers: [
            { label: 'Invoice.total()', sub: 'finance: tax, discounts, rounding', tone: 'alert' },
            { label: 'Invoice.toHtml()', sub: 'brand team: layout, logo, wording', tone: 'alert' },
            { label: 'Invoice.save()', sub: 'platform team: schema and database', tone: 'alert' },
          ],
          note: 'Size is not the problem. Three groups of people asking for changes to one class is.',
        },
      },

      { kind: 'heading', text: 'Single responsibility: one actor, one reason to change' },
      {
        kind: 'prose',
        text: 'Martin\'s own restatement is the one to quote: a module should be responsible to one, and only one, **actor**. An actor is a group that asks for changes: finance, the brand team, the platform team. A responsibility is a reason to change, and a reason to change is someone who might ask for one.',
      },
      {
        kind: 'prose',
        text: 'Seen that way, the invoice above has three responsibilities, even though every method is about invoices. A tax change and a logo change land in the same file and ship in the same deploy. A merge conflict between finance\'s change and the brand team\'s is a design smell, not bad luck.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Three actors, one class',
          code: `class Invoice {
  constructor(readonly lines: Line[], readonly buyer: Customer) {}

  total(): Money {
    const net = Money.sum(this.lines.map((l) => l.amount))
    return net.plus(taxFor(this.buyer.country, net))
  }

  toHtml(): string {
    return '<h1>Invoice</h1><p>' + this.total().format() + '</p>'
  }

  async save(db: Pool): Promise<void> {
    await db.query('INSERT INTO invoices ...', [this.buyer.id])
  }
}`,
        },
        after: {
          title: 'One class per actor',
          code: `// finance owns this: the rules
class Invoice {
  constructor(readonly lines: Line[], readonly buyer: Customer) {}
  total(): Money {
    const net = Money.sum(this.lines.map((l) => l.amount))
    return net.plus(taxFor(this.buyer.country, net))
  }
}

// the brand team owns this: presentation
class InvoiceHtml {
  render(inv: Invoice): string { /* template */ }
}

// the platform team owns this: storage
class InvoiceRepository {
  constructor(private readonly db: Pool) {}
  async save(inv: Invoice): Promise<void> { /* query */ }
}`,
        },
        note: 'A new logo now changes `InvoiceHtml` and nothing else. Tax rules and the schema change on their own schedules, and each class has tests that need nothing the others need.',
      },

      { kind: 'heading', text: 'The shared-helper trap' },
      {
        kind: 'prose',
        text: 'The most expensive violation is not a big class. It is two actors sharing code that only looks like one thing. Martin\'s own example is an employee class whose pay calculation and hours report both call one private helper for regular hours. Finance changes the helper for a pay rule; the operations report silently changes with it, and nobody notices until the numbers disagree.',
      },
      {
        kind: 'prose',
        text: 'The fix is not more care. It is separating code by actor, so each one can own its version of a calculation that happened to start out the same. This is also the honest answer when someone cites [[DRY]] at you: two calculations that change for different people are two pieces of knowledge, even when today they are the same line.',
      },

      { kind: 'heading', text: 'Open/closed: add, don\'t edit' },
      {
        kind: 'prose',
        text: 'Bertrand Meyer coined open/closed in 1988: a module should be open for extension but closed for modification. His mechanism was inheritance. The modern reading, Martin\'s, uses an interface: the code that varies most often sits behind one, and a new variant is a new class. Existing, tested code is not reopened.',
      },
      {
        kind: 'prose',
        text: 'Payment methods are the textbook case, because they keep arriving. Here is checkout with the method as a type field, and then as a strategy:',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Every new method edits checkout',
          code: `class Checkout {
  async pay(order: Order, method: MethodInput) {
    switch (method.kind) {
      case 'card':
        return this.cards.charge(method.token, order.total)
      case 'paypal':
        return this.paypal.capture(method.paypalOrderId)
      case 'klarna':
        return this.klarna.authorise(order, method.session)
    }
  }
}

// refund(), receipt() and riskScore() switch on kind too,
// so Apple Pay means reopening four tested methods`,
        },
        after: {
          title: 'A new method is a new class',
          code: `interface PaymentMethod {
  readonly kind: string
  charge(order: Order): Promise<Receipt>
  refund(receipt: Receipt): Promise<void>
}

class Checkout {
  constructor(private methods: Map<string, PaymentMethod>) {}

  pay(order: Order, kind: string): Promise<Receipt> {
    const method = this.methods.get(kind)
    if (!method) throw new UnknownPaymentMethod(kind)
    return method.charge(order)
  }
}

// composition root: Apple Pay adds one entry here
const all = [new CardPayment(stripe), new PayPalPayment(pp),
  new KlarnaPayment(klarna), new ApplePayPayment(stripe)]
const checkout = new Checkout(
  new Map(all.map((m) => [m.kind, m] as const)),
)`,
        },
        note: 'The `switch` has not vanished; it has shrunk to one lookup in one place. Charge, refund and receipt code dispatches through the interface and never learns which methods exist.',
      },
      {
        kind: 'figure',
        caption: 'Open/closed with a strategy: checkout holds the interface, and each payment method is a class.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'PaymentMethod', stereotype: 'interface', fields: ['kind: string'], methods: ['charge(order): Receipt', 'refund(receipt): void'], tone: 'line' },
            { name: 'CardPayment', fields: ['gateway: Stripe'], methods: ['charge(order): Receipt', 'refund(receipt): void'] },
            { name: 'PayPalPayment', methods: ['charge(order): Receipt', 'refund(receipt): void'] },
            { name: 'ApplePayPayment', methods: ['charge(order): Receipt', 'refund(receipt): void'], tone: 'mastered' },
            { name: 'Checkout', fields: ['methods: Map<kind, PaymentMethod>'], methods: ['pay(order, kind): Receipt'] },
          ],
          relations: [
            { from: 'CardPayment', to: 'PaymentMethod', kind: 'implements' },
            { from: 'PayPalPayment', to: 'PaymentMethod', kind: 'implements' },
            { from: 'ApplePayPayment', to: 'PaymentMethod', kind: 'implements', label: 'new' },
            { from: 'Checkout', to: 'PaymentMethod', kind: 'has', label: 'injected' },
          ],
          note: 'The new method arrives without touching the other four boxes.',
        },
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Linux\'s virtual file system',
        text: 'The Linux kernel reads and writes every filesystem through a table of function pointers, `struct file_operations`. ext4, btrfs and tmpfs each fill in that table, and the code behind the `read` system call does not change when a new filesystem is added. It is open/closed in C, with no classes in sight: the interface is a struct of pointers.',
      },

      { kind: 'heading', text: 'Choosing the axis of change' },
      {
        kind: 'prose',
        text: 'No module is closed against every change. Making checkout open to new payment methods does nothing for a change to how orders are taxed. Open/closed is a bet on **which axis will vary**, and a wrong bet costs a layer of indirection that every future reader pays for.',
      },
      {
        kind: 'prose',
        text: 'So put extension points where variation has already happened, or is on the roadmap with a date. The first payment method is a class. The second can be a `switch` with two cases. By the third you know what actually varies, and the interface you extract will fit.',
      },
      {
        kind: 'figure',
        caption: 'When a change point deserves an interface.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Has this axis already varied at least twice?',
            yes: {
              question: 'Will new variants come from outside the team, such as partners or plugins?',
              yes: { answer: 'Interface plus a registry', sub: 'variants register themselves', tone: 'line' },
              no: { answer: 'Interface, one class per variant', sub: 'wired in the composition root', tone: 'mastered' },
            },
            no: {
              question: 'Is the next variant dated on the roadmap?',
              yes: { answer: 'Extract the interface now', sub: 'you already know the second case', tone: 'mastered' },
              no: { answer: 'Keep the switch', sub: 'refactor on the third case', tone: 'neutral' },
            },
          },
        },
      },

      { kind: 'heading', text: 'How the two work together' },
      {
        kind: 'prose',
        text: 'Single responsibility decides where the seams are. Open/closed decides which seams get an interface. Split the invoice by actor first, and you may find that one piece, say tax by country, is where the variation lives. That piece earns a strategy; the others stay plain classes.',
      },
      {
        kind: 'prose',
        text: 'The idea scales up. At package level Martin calls it the common closure principle: gather together the classes that change for the same reasons and at the same times. At organisation level, actors usually map to teams, which is why responsibility boundaries in code tend to end up matching team boundaries, as Conway\'s law predicts.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Single responsibility is not "does one thing"; it is "one group of people asks for its changes". Finance owns totals and the brand team owns rendering, so those are separate classes. For payments, the axis that keeps changing is the method, so each method is a class behind one interface, and adding one never touches checkout.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Reading "one reason to change" as "one method per class", and producing a dozen tiny classes that always change together. That is low cohesion with extra files. The mirror-image trap is an extension point on every axis, built before any of them has varied.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Doesn\'t open/closed just move the switch somewhere else?',
            a: 'Yes, to one place: the composition root, or a factory that maps a key to a class. That lookup only chooses; it holds no behaviour. Adding a method is a new class plus one registration line, while charge, refund and receipt code dispatches through the interface and is never reopened.',
          },
          {
            q: 'What is an actor in a small team where one person does everything?',
            a: 'An actor is a source of change requests, not a person. Tax rules, presentation and storage change for different reasons and at different rates, even if one developer handles all three. Ask whose request would make you edit this code.',
          },
          {
            q: 'A new payment method needs a redirect step the interface has no room for. Has open/closed failed?',
            a: 'No, the interface was missing a case. Change the result so every method can express it, for example `charge` returning either a receipt or a redirect to follow. That is one deliberate change to the contract, and after it the axis is closed again. The principle holds per axis, not forever.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-p-srp-ocp-1',
        moduleId: 'p-srp-ocp',
        stem: 'An `Invoice` class computes totals, renders HTML for email and saves itself to Postgres. Which reason to split it is the single responsibility reason?',
        options: [
          'It is over 300 lines long',
          'It has more than one public method',
          'Finance, the brand team and the platform team all ask for changes to it, so their changes collide',
          'It cannot be unit tested without a database',
        ],
        correct: 2,
        explain: 'Single responsibility is about actors: who asks for changes. Line and method counts are proxies that often mislead. The testing pain is a real consequence of the mixed responsibilities, but it is a symptom, not the definition.',
      },
      {
        id: 'q-p-srp-ocp-2',
        moduleId: 'p-srp-ocp',
        stem: 'Payment methods are a `switch` in checkout, refunds and receipts. Product wants Klarna next month and two more next quarter. The best move?',
        options: [
          'Add `case \'klarna\'` to each switch, carefully',
          'A `PaymentMethod` interface with one class per method, chosen once from a registry',
          'A `Payment` base class whose methods check `this instanceof Klarna`',
          'A configuration file listing the enabled methods',
        ],
        correct: 1,
        explain: 'The axis has varied and will again, so it earns an interface. Each method becomes a class, and existing code dispatches through the interface. A config file only toggles methods that already exist in code; it says nothing about how to charge with a new one.',
      },
      {
        id: 'q-p-srp-ocp-3',
        moduleId: 'p-srp-ocp',
        stem: '`total()`, used by finance, and `salesSummary()`, used by sales, both call a private `net()` helper. Finance changes `net()` to exclude shipping, and the sales report silently changes. Which principle explains the bug?',
        options: [
          'Single responsibility: two actors shared code, so one actor\'s change hit the other',
          'Open/closed: `net()` should have been extensible',
          'Liskov substitution: `net()` changed its postcondition',
          'Don\'t repeat yourself: the helper was not shared widely enough',
        ],
        correct: 0,
        explain: 'The helper served two actors, so a change requested by one broke the other. The tempting answer, [[DRY]], points the wrong way: merging the two calculations was the mistake, because they were only coincidentally the same.',
      },
    ],
    cards: [
      {
        id: 'c-p-srp-ocp-1',
        moduleId: 'p-srp-ocp',
        front: 'Single responsibility, the precise version?',
        back: 'A module should be responsible to one actor: one group that asks for its changes. Not "does one thing".',
        tag: 'SOLID',
      },
      {
        id: 'c-p-srp-ocp-2',
        moduleId: 'p-srp-ocp',
        front: 'What does open/closed mean in practice?',
        back: 'On an axis that keeps changing, new behaviour arrives as a new class behind an existing interface. Tested code is not reopened.',
        tag: 'SOLID',
      },
      {
        id: 'c-p-srp-ocp-3',
        moduleId: 'p-srp-ocp',
        front: 'When does a change point deserve an interface?',
        back: 'When that axis has already varied, usually by the third case, or the next variant is dated on the roadmap. Before that, a switch is cheaper.',
        tag: 'SOLID',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'p-lsp-isp',
    trackId: 'principles',
    title: 'SOLID: Liskov substitution and interface segregation',
    station: 4,
    prereqs: ['p-srp-ocp'],
    minutes: 11,
    summary: 'Subtypes that keep their parent\'s promises, and interfaces sized to the client that calls them.',
    objectives: [
      'Explain the square and rectangle problem, and the two real fixes',
      'Check a subtype against the precondition, postcondition and invariant rules',
      'Split a fat interface into role interfaces, and know when to stop',
    ],
    keywords: [
      'liskov',
      'substitution',
      'square rectangle',
      'design by contract',
      'preconditions',
      'interface segregation',
      'role interface',
      'read-only collection',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Open/closed only works if every class behind the interface behaves the way callers expect. The [[LSP]] is that guarantee. Interviewers test it with "is a square a rectangle?", and with "what if this implementation can\'t support that method?" If your answer involves throwing "not supported", you have found a violation.',
      },
      {
        kind: 'prose',
        text: 'The [[ISP]] is usually the fix. When an implementation cannot honour part of an interface, the interface is probably serving several clients at once. Split it by client and the impossible method disappears. These are the L and the I of [[SOLID]].',
      },
      {
        kind: 'figure',
        caption: 'The square inherits two setters whose promise it cannot keep.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'Rectangle', fields: ['width: number', 'height: number'], methods: ['setWidth(w): void', 'setHeight(h): void', 'area(): number'] },
            { name: 'Square', methods: ['setWidth(w): sets both', 'setHeight(h): sets both'], tone: 'alert' },
            { name: 'Layout', methods: ['stretch(r: Rectangle): number'] },
          ],
          relations: [
            { from: 'Square', to: 'Rectangle', kind: 'inherits' },
            { from: 'Layout', to: 'Rectangle', kind: 'uses', label: 'expects independent sides' },
          ],
          note: '`setWidth(5)` then `setHeight(4)` gives 20 on a Rectangle and 16 on a Square.',
        },
      },

      { kind: 'heading', text: 'Liskov: substitutable, not just type-compatible' },
      {
        kind: 'prose',
        text: 'Barbara Liskov stated the idea in 1987, and with Jeannette Wing made it precise in 1994: if a property can be proved about objects of a type, it must hold for objects of every subtype. In working terms, code written against the parent must keep working, without knowing, when it is handed a subclass.',
      },
      {
        kind: 'prose',
        text: 'The compiler checks signatures. Liskov is about **behaviour**: what a method accepts, what it guarantees, what it throws and what it leaves unchanged. A subclass can compile cleanly and still break every caller.',
      },

      { kind: 'heading', text: 'The square and the rectangle' },
      {
        kind: 'prose',
        text: 'Geometry says a square is a rectangle. Behaviour says otherwise, because a mutable `Rectangle` promises that its width and height change independently. A `Square` that overrides `setWidth` to set both sides breaks that promise, and code that stretches rectangles gets the wrong answer.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Compiles, and breaks callers',
          code: `class Rectangle {
  constructor(protected w: number, protected h: number) {}
  setWidth(w: number) { this.w = w }
  setHeight(h: number) { this.h = h }
  area() { return this.w * this.h }
}

class Square extends Rectangle {
  constructor(side: number) { super(side, side) }
  setWidth(w: number) { this.w = w; this.h = w }
  setHeight(h: number) { this.w = h; this.h = h }
}

function stretch(r: Rectangle) {
  r.setWidth(5)
  r.setHeight(4)
  return r.area() // 20, unless r is a Square: 16
}`,
        },
        after: {
          title: 'No setters, no broken promise',
          code: `interface Shape {
  area(): number
}

class Rectangle implements Shape {
  constructor(readonly w: number, readonly h: number) {}
  area() { return this.w * this.h }
  withWidth(w: number) { return new Rectangle(w, this.h) }
}

class Square implements Shape {
  constructor(readonly side: number) {}
  area() { return this.side * this.side }
  withSide(s: number) { return new Square(s) }
}`,
        },
        note: 'There are two real fixes. Drop the hierarchy, as here, or make the shapes immutable: with no setters, an immutable square really is a valid rectangle, because the promise it could not keep no longer exists.',
      },

      { kind: 'heading', text: 'Contracts: what a subtype may change' },
      {
        kind: 'prose',
        text: 'Bertrand Meyer\'s design by contract gives the rules in a form you can check in code review:',
      },
      {
        kind: 'table',
        head: ['Rule', 'A subtype may', 'A subtype may not'],
        rows: [
          ['**Preconditions**', 'Accept more: weaken them', 'Demand more: refuse inputs the parent accepts'],
          ['**Postconditions**', 'Promise more: strengthen them', 'Promise less: return what the parent rules out'],
          ['**Invariants**', 'Add its own', 'Break the parent\'s'],
          ['**Exceptions**', 'Throw subtypes of the parent\'s errors', 'Throw new kinds callers do not expect'],
          ['**History**', 'Restrict how its state can change', 'Allow changes the parent forbids, such as mutating an immutable type'],
        ],
      },
      {
        kind: 'prose',
        text: 'A refund makes it concrete. `PaymentMethod.refund(amount)` accepts any amount up to the original charge. A gift-card subclass that rejects refunds below 5 has **strengthened a precondition**. Code that refunds 3 through the interface now fails, and that code was written correctly.',
      },
      {
        kind: 'prose',
        text: 'TypeScript will not catch this, and in one case it helps you break the rule: method parameters are checked bivariantly, so a subclass can narrow a parameter\'s type and still compile. The real enforcement is a shared contract test suite that runs against every implementation.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Java\'s unmodifiable list',
        text: '`Collections.unmodifiableList` returns a `List` whose `add` throws `UnsupportedOperationException`. The `List` interface documents `add` as optional, so this is technically within contract, but every method that receives a `List` now has to wonder whether it may write to it. Kotlin split the type in two, a read-only `List` and a `MutableList`, and TypeScript has `ReadonlyArray<T>` for the same reason.',
      },

      { kind: 'heading', text: 'A read-only collection, done right' },
      {
        kind: 'prose',
        text: 'The Java design is a substitution problem caused by a fat interface. The fix is to give readers a type with only reads on it, and have the mutable type extend it. A mutable list can stand in for a readable one, because adding methods breaks no promise a reader relies on.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'One interface, methods that throw',
          code: `interface List<T> {
  get(i: number): T
  size(): number
  add(item: T): void
  remove(i: number): void
}

class FrozenList<T> implements List<T> {
  constructor(private readonly items: readonly T[]) {}
  get(i: number) { return this.items[i] }
  size() { return this.items.length }
  add(): void { throw new Error('read-only') }
  remove(): void { throw new Error('read-only') }
}`,
        },
        after: {
          title: 'Reading and writing are separate roles',
          code: `interface ReadableList<T> {
  get(i: number): T
  size(): number
}

interface MutableList<T> extends ReadableList<T> {
  add(item: T): void
  remove(i: number): void
}

class FrozenList<T> implements ReadableList<T> {
  constructor(private readonly items: readonly T[]) {}
  get(i: number) { return this.items[i] }
  size() { return this.items.length }
}

function total(prices: ReadableList<number>) { /* ... */ }`,
        },
        note: 'A function that only reads asks for `ReadableList`, and either kind of list can be passed. Nothing throws, because nothing promises what it cannot do.',
      },
      {
        kind: 'prose',
        text: 'One more distinction to say aloud: **read-only is not immutable**. A `ReadableList` reference cannot change the list, but whoever holds the `MutableList` still can, under your feet. If a caller needs a list that never changes, that is a different type, and a mutable list is not a subtype of it: it breaks the history rule in the table.',
      },

      { kind: 'heading', text: 'Interface segregation: role interfaces' },
      {
        kind: 'prose',
        text: 'Martin\'s statement is that no client should be forced to depend on methods it does not use. He arrived at it consulting for Xerox, where one large job class served every printer task, so even a small change meant an hour-long redeploy. The fix was an interface per role, such as a staple job and a print job, in front of the same class.',
      },
      {
        kind: 'prose',
        text: 'Today a fat interface usually shows up as a repository or a client with a dozen methods, handed to code that calls one. The cost is concrete: every test fake must implement all twelve, and the consumer is coupled to eleven methods it never calls.',
      },
      {
        kind: 'figure',
        caption: 'One class, two role interfaces: each client sees only the methods it calls.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'UserReader', stereotype: 'interface', methods: ['byId(id): User', 'byEmail(email): User'], tone: 'line' },
            { name: 'UserWriter', stereotype: 'interface', methods: ['save(user): void', 'delete(id): void'], tone: 'line' },
            { name: 'PostgresUsers', fields: ['pool: Pool'], methods: ['byId, byEmail', 'save, delete'] },
            { name: 'ProfilePage', fields: ['users: UserReader'] },
            { name: 'AdminTool', fields: ['users: UserWriter'] },
          ],
          relations: [
            { from: 'PostgresUsers', to: 'UserReader', kind: 'implements' },
            { from: 'PostgresUsers', to: 'UserWriter', kind: 'implements' },
            { from: 'ProfilePage', to: 'UserReader', kind: 'has' },
            { from: 'AdminTool', to: 'UserWriter', kind: 'has' },
          ],
        },
      },
      {
        kind: 'prose',
        text: 'TypeScript makes segregation nearly free. Interfaces are structural, so the consumer can declare exactly what it needs, even as `Pick<UserStore, \'byId\'>`, and the existing class satisfies it without an `implements` clause. Go\'s guidance is the same idea: define interfaces where they are used, not where they are implemented.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Go\'s io.Reader',
        text: 'Go\'s `io.Reader` has one method, `Read`. Files, network connections, [[HTTP]] response bodies and gzip streams all satisfy it, so a function that takes a reader works on every one of them. Bigger roles are composed from small ones: `io.ReadWriter` is a `Reader` plus a `Writer`. Interface segregation is the standard library\'s house style.',
      },
      {
        kind: 'prose',
        text: 'Segregation can go too far. One method per interface for a repository that only one service uses is ceremony: twelve interfaces, twelve names, and no client that wanted the split. Count clients, not methods, and split when two clients need different subsets.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'A subtype has to keep its parent\'s promises: it can accept more and promise more, never accept less or promise less. If an implementation would have to throw "not supported", the interface is too wide, so I\'d split it into role interfaces and let each client depend only on what it calls.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Answering the square question with "override `setWidth` to set both sides". That override is the violation, not the fix. The answer the interviewer wants is that the hierarchy is wrong for mutable shapes: drop it, or make the shapes immutable.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'My subclass compiles. Why is that not enough?',
            a: 'The compiler checks signatures, and TypeScript even lets a method narrow its parameter type. The contract is behaviour: what is accepted, returned, thrown and left unchanged. Write one contract test suite and run it against every implementation; that is where substitution is actually checked.',
          },
          {
            q: 'Isn\'t interface segregation just single responsibility for interfaces?',
            a: 'Close, but the axis differs. Single responsibility splits by who asks for changes to the implementation; segregation splits by who calls it. One class can implement three role interfaces and still have exactly one reason to change.',
          },
          {
            q: 'How many methods should an interface have?',
            a: 'As many as one client uses together. Go\'s standard library favours one or two; a repository behind a single use case may need four. Split when two clients need different subsets, not to hit a number.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-p-lsp-isp-1',
        moduleId: 'p-lsp-isp',
        stem: '`Square extends Rectangle` and overrides `setWidth` to set the height too. Which check fails?',
        options: [
          '`new Square(2).area()` returns 4',
          '`square instanceof Rectangle` is true',
          'TypeScript accepts the override at compile time',
          'Setting width 5 and then height 4 through a `Rectangle` reference gives an area of 20',
        ],
        correct: 3,
        explain: 'Code written against `Rectangle` expects the two sides to change independently, so it expects 20 and gets 16. Every other check passes, which is the danger: the violation compiles and looks correct in isolation.',
      },
      {
        id: 'q-p-lsp-isp-2',
        moduleId: 'p-lsp-isp',
        stem: '`PaymentMethod.refund(amount)` accepts any amount up to the original charge. A gift-card subclass rejects refunds below 5. Which rule does it break?',
        options: [
          'It strengthens a precondition: it refuses inputs the parent accepts',
          'It weakens a postcondition: it promises less on return',
          'It breaks the history rule by allowing a forbidden state change',
          'None; a minimum refund is a business decision',
        ],
        correct: 0,
        explain: 'Callers written against `PaymentMethod` may refund 3 and expect success. A subtype may accept more than its parent, never less. If gift cards really need a minimum, the parent\'s contract has to say refunds can be declined, and every caller has to handle it.',
      },
      {
        id: 'q-p-lsp-isp-3',
        moduleId: 'p-lsp-isp',
        stem: 'A nightly export needs only `findAll()`, but its constructor takes a `UserStore` with nine methods. What does a narrow `UserLister` interface buy most directly?',
        options: [
          'Faster queries, because fewer methods are loaded',
          'The export can run without a database',
          'Its test fake implements one method, and changes to the other eight cannot touch the export',
          'It makes `UserStore` safe to use as a singleton',
        ],
        correct: 2,
        explain: 'Segregation cuts the dependency: the export is coupled to one method, its fake is a few lines, and the other eight can change freely. Performance and lifetime are unaffected; the same object is passed in either way.',
      },
    ],
    cards: [
      {
        id: 'c-p-lsp-isp-1',
        moduleId: 'p-lsp-isp',
        front: 'Liskov substitution in one line?',
        back: 'Code written against the parent must keep working with any subtype: accept at least as much, promise at least as much, throw nothing new.',
        tag: 'SOLID',
      },
      {
        id: 'c-p-lsp-isp-2',
        moduleId: 'p-lsp-isp',
        front: 'Why does a mutable Square break Rectangle?',
        back: 'Rectangle promises its width and height change independently, and a square cannot keep that promise. Drop the hierarchy, or make the shapes immutable.',
        tag: 'SOLID',
      },
      {
        id: 'c-p-lsp-isp-3',
        moduleId: 'p-lsp-isp',
        front: 'What is a role interface?',
        back: 'An interface sized to what one client calls, like Go\'s `io.Reader`. A class may satisfy many; each client depends only on its own.',
        tag: 'SOLID',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'p-dip',
    trackId: 'principles',
    title: 'SOLID: dependency inversion and injection',
    station: 5,
    prereqs: ['p-lsp-isp'],
    minutes: 10,
    summary: 'Business rules own the interfaces; details implement them and are handed in from outside.',
    objectives: [
      'State both halves of [[DIP]] and say which module owns the interface',
      'Wire a service with constructor injection and a composition root, then test it with fakes',
      'Choose between wiring by hand and a container',
    ],
    keywords: [
      'dependency inversion',
      'dependency injection',
      'ioc container',
      'composition root',
      'constructor injection',
      'service locator',
      'fakes and mocks',
      'testability',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Dependency inversion decides what you can test without a database, swap without a rewrite, and change without touching business rules. It comes up the moment you say "the service takes a repository interface", and the next two questions are "why?" and "who creates it?".',
      },
      {
        kind: 'prose',
        text: 'Three ideas get blurred, and separating them cleanly is the senior part. **Inversion** is about which way a source dependency points. **Injection** is how an object receives its collaborators. A **container** is a tool that automates injection. The [[DIP]] is the D of [[SOLID]], and [[DI]] is the technique most often used to apply it.',
      },
      {
        kind: 'figure',
        caption: 'Inversion: the policy owns the interface, and the detail depends on it.',
        figure: {
          kind: 'split',
          left: {
            title: 'Policy depends on detail',
            tone: 'alert',
            nodes: [
              { label: 'OrderService', sub: 'business rules', to: 'imports' },
              { label: 'PostgresOrders', sub: 'storage detail', to: 'imports' },
              { label: 'pg driver', tone: 'alert' },
            ],
            cost: 'Testing a pricing rule needs a database. Changing storage edits the service.',
          },
          right: {
            title: 'Both depend on the abstraction',
            tone: 'mastered',
            nodes: [
              { label: 'PostgresOrders', sub: 'storage detail', to: 'implements' },
              { label: 'OrderRepository', sub: 'interface owned by orders', tone: 'line', to: 'used by' },
              { label: 'OrderService', sub: 'business rules', tone: 'mastered' },
            ],
            cost: 'One more type, and the rules no longer know Postgres exists.',
          },
          verdict: 'Control still flows from the service to the database. The source dependency now points the other way.',
        },
      },

      { kind: 'heading', text: 'Inversion: the policy owns the interface' },
      {
        kind: 'prose',
        text: 'Martin\'s statement has two halves. High-level modules should not depend on low-level modules; both should depend on abstractions. And abstractions should not depend on details; details should depend on abstractions.',
      },
      {
        kind: 'prose',
        text: 'The second half is the one people skip, and it is about **ownership**. The interface is written in the order service\'s terms, `save(order)` and `byId(id)`, and it lives in the orders module. If it lives beside the Postgres code, or speaks in rows and queries, the orders module still has to import the storage package to get it, and nothing has been inverted.',
      },
      {
        kind: 'figure',
        caption: 'The service, the real store and the test fake all depend on an interface the domain owns.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'OrderRepository', stereotype: 'interface', methods: ['save(order): void', 'byId(id): Order'], tone: 'line' },
            { name: 'OrderService', fields: ['orders: OrderRepository', 'clock: Clock'], methods: ['place(cart): Order'] },
            { name: 'PostgresOrders', fields: ['pool: Pool'], methods: ['save(order): void', 'byId(id): Order'] },
            { name: 'InMemoryOrders', fields: ['rows: Map<OrderId, Order>'], methods: ['save(order): void', 'byId(id): Order'], tone: 'mastered' },
          ],
          relations: [
            { from: 'OrderService', to: 'OrderRepository', kind: 'has', label: 'via the constructor' },
            { from: 'PostgresOrders', to: 'OrderRepository', kind: 'implements', label: 'in production' },
            { from: 'InMemoryOrders', to: 'OrderRepository', kind: 'implements', label: 'in tests' },
          ],
        },
      },

      { kind: 'heading', text: 'Injection: hand the dependency in' },
      {
        kind: 'prose',
        text: 'Inversion says what to depend on. Injection says how the object gets it: from outside, instead of creating it. The options, from worst to best:',
      },
      {
        kind: 'ladder',
        rungs: [
          {
            grade: 'bad',
            title: '`new` inside the class',
            text: 'The service builds its own database client and mailer. The dependencies are hidden, every test touches real infrastructure, and configuration is read from deep inside business code.',
          },
          {
            grade: 'good',
            title: 'A service locator',
            text: '`Container.get(\'orders\')` inside methods. Swappable, but the dependencies are invisible in the signature, and a missing one fails at runtime, mid-request.',
          },
          {
            grade: 'great',
            title: 'Constructor injection',
            text: 'Dependencies are constructor parameters typed as interfaces. They are visible, required and fixed for the object\'s life, so it can never exist half-built.',
          },
          {
            grade: 'best',
            title: 'Constructor injection plus a composition root',
            text: 'Every `new` for infrastructure lives in one place near `main`. The rest of the code receives what it needs and never constructs a collaborator.',
          },
        ],
      },
      {
        kind: 'prose',
        text: 'Setter injection has one legitimate use: an optional collaborator with a sensible default, such as a logger. For anything required, it lets the object exist in an invalid state between construction and the setter call.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Creates its own collaborators',
          code: `class OrderService {
  private db = new Pool({ connectionString: process.env.DB_URL })
  private mailer = new SesMailer('eu-west-1')

  async place(cart: Cart): Promise<Order> {
    const order = Order.from(cart, new Date())
    await this.db.query('INSERT INTO orders ...', [order.id])
    await this.mailer.send(cart.email, confirmation(order))
    return order
  }
}`,
        },
        after: {
          title: 'Receives them, as interfaces it owns',
          code: `interface OrderRepository { save(o: Order): Promise<void> }
interface Mailer { send(to: Email, m: Message): Promise<void> }
interface Clock { now(): Date }

class OrderService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly mailer: Mailer,
    private readonly clock: Clock,
  ) {}

  async place(cart: Cart): Promise<Order> {
    const order = Order.from(cart, this.clock.now())
    await this.orders.save(order)
    await this.mailer.send(cart.email, confirmation(order))
    return order
  }
}`,
        },
        note: 'Nothing in the service names a vendor, a driver or an environment variable. Time is a dependency too: `new Date()` inside a rule is as hard to test as a database call.',
      },

      { kind: 'heading', text: 'The composition root' },
      {
        kind: 'prose',
        text: 'The term is Mark Seemann\'s: the single place, as close to the entry point as possible, where the object graph is built. Production and tests each have one, and they differ only in which classes they pass in.',
      },
      {
        kind: 'code',
        code: `// main.ts: production wiring
const pool = new Pool({ connectionString: config.dbUrl })
const service = new OrderService(
  new PostgresOrders(pool),
  new SesMailer(config.region),
  systemClock,
)

// order-service.test.ts: same class, different parts
const mailer = new RecordingMailer()
const after5pm = fixedClock('2026-03-02T17:05:00Z')
const service = new OrderService(
  new InMemoryOrders(), mailer, after5pm,
)

const order = await service.place(cartWith(2))
expect(order.shipsOn).toEqual(day('2026-03-03'))
expect(mailer.sent).toHaveLength(1)`,
        caption: 'Two composition roots for one class. The test runs in milliseconds and pins the time.',
      },

      { kind: 'heading', text: 'Containers: when they earn their keep' },
      {
        kind: 'prose',
        text: 'An inversion-of-control container, such as Spring, NestJS, Angular\'s injector or InversifyJS, builds the graph for you. Classes declare constructor parameters; the container reads them, resolves each one, and manages lifetimes: one instance for the whole app, one per request, or a fresh one each time. Martin Fowler named the dependency injection pattern in 2004, while describing exactly these tools.',
      },
      {
        kind: 'prose',
        text: 'The names are muddled, so be precise. **Inversion of control** is the broad idea that a framework calls your code rather than the reverse: Express calls your handler, JUnit calls your test. Injection is one form of it. Dependency inversion is a different idea again, about which way the imports point. A container that injects concrete classes does plenty of injection and no inversion at all.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Composition root, wired by hand',
          points: [
            'Wiring is plain code: readable, debuggable, checked by the compiler',
            'No framework types in your domain classes',
            'Grows tedious past a few hundred components',
            'Lifetimes such as per-request scope are written by hand',
          ],
        },
        right: {
          title: 'Container',
          points: [
            'Wiring is automatic, and lifetimes are declared',
            'A missing or ambiguous binding fails at startup, not at compile time',
            'Decorators or annotations tend to leak into domain code',
            'The graph is hard to see without tooling',
          ],
        },
        verdict: 'Wire small and medium services by hand. Use a container when the framework already brings one, as NestJS and Spring do, and keep its decorators at the edges.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Spring and NestJS',
        text: 'Both frameworks are built on constructor injection. A Spring bean or a NestJS provider declares what it needs in its constructor. At startup the container resolves the whole graph and refuses to boot if anything is missing. That failure at boot is the container\'s substitute for the compile-time check that wiring by hand gives you.',
      },

      { kind: 'heading', text: 'Testability with fakes' },
      {
        kind: 'prose',
        text: 'Injection is what makes fakes possible. A **fake** is a working, lightweight implementation: an in-memory repository, a clock you set, a mailer that records what it was asked to send. A **mock** is an object programmed to expect particular calls. Both have a place:',
      },
      {
        kind: 'list',
        items: [
          '**Fakes for things you query.** Tests assert on outcomes, such as the order exists or the ship date is Tuesday, and survive any refactoring of how the service talks to its repository.',
          '**Mocks for outbound commands where the call is the behaviour.** "Charged exactly once" is a fact about the call, so verify the call.',
          '**Don\'t mock what you don\'t own.** Wrap Stripe\'s client in your own `PaymentGateway`, fake that in unit tests, and cover the wrapper with a few integration tests against Stripe\'s test mode.',
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'The order service owns an `OrderRepository` interface written in its own terms, and the Postgres class implements it. Dependencies come in through the constructor and are wired once at startup, so in tests I pass an in-memory repository and a fixed clock, and the rules run without a database.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Answering a question about inversion with injection. Passing a concrete `PostgresOrders` into the constructor is injection without inversion: the service still imports the storage package. The other trap is an interface for every class "for testability", including domain types like `Money` that never needed a seam.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Should every class have an interface?',
            a: 'No. Invert at boundaries where the detail is slow, volatile or out of your control: storage, network calls, third-party services, time and randomness. Value objects and domain rules are used directly. An interface that mirrors one class method for method adds a jump for every reader and a seam nobody uses.',
          },
          {
            q: 'Where should the interface live?',
            a: 'With the consumer, the high-level module. If `OrderRepository` sits in the Postgres package, the domain imports infrastructure to reach it and the inversion is undone. Go makes this idiomatic: interfaces are declared where they are used, and implementations satisfy them implicitly.',
          },
          {
            q: 'Mocks or fakes?',
            a: 'Fakes by default: tests assert on results and survive refactoring. Mocks where the outbound call is itself the behaviour, such as capturing a payment exactly once. A suite where every collaborator is a mock pins the implementation, and every refactor breaks tests that found no bug.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-p-dip-1',
        moduleId: 'p-dip',
        stem: 'Which setup actually inverts the dependency between `OrderService` and Postgres?',
        options: [
          '`OrderService` takes a `PostgresOrders` instance in its constructor',
          '`OrderService` calls `Container.get(\'orders\')` when it needs storage',
          '`OrderService` takes an `OrderRepository` defined in the orders module, which `PostgresOrders` implements',
          '`OrderService` takes an `OrderRepository` defined in the Postgres package, next to its implementation',
        ],
        correct: 2,
        explain: 'Inversion needs an abstraction and the right owner. The first option injects a concrete class. The last has an interface, but the domain still imports the storage package to get it, so the source dependency still points at the detail.',
      },
      {
        id: 'q-p-dip-2',
        moduleId: 'p-dip',
        stem: 'A rule says orders placed after 17:00 ship the next day. Its test passes in the morning and fails in the evening. The best fix?',
        options: [
          'Patch the global `Date` with a test library',
          'Inject a `Clock`, and pass a fixed one in the test',
          'Skip the test after 17:00',
          'Move the ship-date calculation into a database function',
        ],
        correct: 1,
        explain: 'Time is a dependency like any other. Injecting a clock makes the rule deterministic and lets you test both sides of 17:00 on purpose. Patching globals works, but it hides the dependency and can leak between tests.',
      },
      {
        id: 'q-p-dip-3',
        moduleId: 'p-dip',
        stem: 'What is the main cost of a dependency injection container compared with wiring by hand in a composition root?',
        options: [
          'A broken or ambiguous binding surfaces at startup instead of at compile time, and the wiring is harder to see',
          'Every request is slower, because dependencies are resolved by reflection each time',
          'It rules out constructor injection',
          'It prevents using fakes in tests',
        ],
        correct: 0,
        explain: 'Containers typically resolve singletons once at startup, so request latency is rarely the issue. The real trade is visibility and checking: hand wiring is plain code the compiler verifies, while a container reports mistakes when the app boots.',
      },
    ],
    cards: [
      {
        id: 'c-p-dip-1',
        moduleId: 'p-dip',
        front: 'Dependency inversion versus dependency injection?',
        back: 'Inversion: the policy owns an interface that details implement. Injection: passing collaborators in, usually through the constructor. You can inject without inverting.',
        tag: 'SOLID',
      },
      {
        id: 'c-p-dip-2',
        moduleId: 'p-dip',
        front: 'What is a composition root?',
        back: 'The one place near the entry point where concrete classes are created and wired. Everything else receives its dependencies and never constructs infrastructure.',
        tag: 'Injection',
      },
      {
        id: 'c-p-dip-3',
        moduleId: 'p-dip',
        front: 'Fake or mock?',
        back: 'A fake for things you query, like repositories and clocks. A mock only where the outbound call is the behaviour, like charging exactly once.',
        tag: 'Testing',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'p-simplicity',
    trackId: 'principles',
    title: 'DRY, KISS, YAGNI, and composition over inheritance',
    station: 6,
    prereqs: ['p-dip'],
    minutes: 12,
    summary: 'When not to abstract: duplicated knowledge versus look-alike code, speculative features, and hierarchies that break.',
    objectives: [
      'Tell duplicated knowledge from code that only looks the same',
      'Argue against speculative features with [[YAGNI]] and the rule of three, and name where it does not apply',
      'Replace an inheritance hierarchy with composition, and explain the fragile base class',
    ],
    keywords: [
      'dont repeat yourself',
      'keep it simple',
      'you arent gonna need it',
      'rule of three',
      'wrong abstraction',
      'composition over inheritance',
      'fragile base class',
      'overengineering',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'The last four lessons gave you ways to add indirection: interfaces, strategies, injected collaborators. This one is about when not to. Senior interviewers watch for overengineering as closely as for tangled code, and an interface with one implementation and no second in sight, or a plugin framework for two cases, costs points.',
      },
      {
        kind: 'prose',
        text: 'Four ideas let you argue for less, and each is widely misquoted: [[DRY]], [[KISS]], [[YAGNI]], and composition over inheritance. The misquotes are where the interview questions come from.',
      },
      {
        kind: 'figure',
        caption: 'Duplication is about knowledge: similar code can hold two decisions, and scattered code can hold one.',
        figure: {
          kind: 'split',
          left: {
            title: 'One decision, three copies',
            tone: 'alert',
            nodes: [
              { label: 'Free-shipping threshold', sub: 'one business rule', to: 'written in' },
              { label: 'Checkout, a report query, an email', sub: 'three places to change', tone: 'alert' },
            ],
            cost: 'The real violation. The next change will miss a copy.',
          },
          right: {
            title: 'Two decisions, one look',
            tone: 'mastered',
            nodes: [
              { label: 'username ≤ 30, tag ≤ 30', sub: 'identical code today', to: 'owned by' },
              { label: 'Accounts team, catalogue team', sub: 'two separate rules', tone: 'mastered' },
            ],
            cost: 'Not a violation. Merging them couples two teams\' rules.',
          },
          verdict: 'Ask whether the copies would change together, for the same reason. If they would, it is one piece of knowledge.',
        },
      },

      { kind: 'heading', text: 'DRY is about knowledge, not code' },
      {
        kind: 'prose',
        text: 'Hunt and Thomas defined it in The Pragmatic Programmer (1999): every piece of knowledge must have a single, unambiguous, authoritative representation within a system. The key word is knowledge. Their 20th-anniversary edition says so outright, because a generation of developers read it as "never write similar code twice".',
      },
      {
        kind: 'prose',
        text: 'Real duplication is one decision living in several places: a tax rate in code and in a report query, a status list in an enum and in a database check constraint, a validation rule written separately on the client and the server. Accidental duplication is two decisions that happen to look alike today. Merge those and you have coupled two things that will diverge.',
      },
      {
        kind: 'prose',
        text: 'Sandi Metz put the cost plainly: duplication is far cheaper than the wrong abstraction. The wrong abstraction arrives in a recognisable way. Two functions are merged, a flag is added for the first difference, then another, until every caller passes options it does not understand.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Merged, then flagged',
          code: `function validateName(
  s: string,
  kind: 'username' | 'display',
  opts: { allowSpaces?: boolean; trim?: boolean } = {},
): string | null {
  const v = opts.trim ? s.trim() : s
  if (v.length > 30) return 'too long'
  if (kind === 'username' && !/^[a-z0-9_]+$/.test(v)) {
    return 'letters, digits and _ only'
  }
  if (!opts.allowSpaces && v.includes(' ')) return 'no spaces'
  if (kind === 'display' && v === '') return 'required'
  return null
}`,
        },
        after: {
          title: 'Two rules, one home each',
          code: `// limits.ts: the one place these decisions live
export const USERNAME_MAX = 30 // also sizes the DB column
export const DISPLAY_NAME_MAX = 30

export function validateUsername(s: string): string | null {
  if (s.length > USERNAME_MAX) return 'too long'
  if (!/^[a-z0-9_]+$/.test(s)) return 'letters, digits and _ only'
  return null
}

export function validateDisplayName(s: string): string | null {
  const v = s.trim()
  if (v === '') return 'required'
  if (v.length > DISPLAY_NAME_MAX) return 'too long'
  return null
}`,
        },
        note: 'The two limits are equal today and named separately, because they are separate decisions. The username limit is the knowledge that must not be copied, so the schema reads it from here as well.',
      },

      { kind: 'heading', text: 'KISS: simple is not the same as easy' },
      {
        kind: 'prose',
        text: 'The phrase is usually credited to Kelly Johnson of Lockheed\'s Skunk Works, whose engineers were told a jet had to be repairable in the field by an average mechanic with basic tools. In code it means: choose the design with the fewest moving parts that meets the requirement you actually have.',
      },
      {
        kind: 'prose',
        text: 'Rich Hickey\'s distinction sharpens it. **Simple** means not intertwined: few concepts braided together. **Easy** means familiar, or near at hand. A framework you know is easy, and may not be simple. A global mutable cache is easy to add and the opposite of simple, because every reader now depends on every writer.',
      },
      {
        kind: 'figure',
        caption: 'The rungs of indirection. Stop at the first one that meets the requirement.',
        figure: {
          kind: 'stack',
          layers: [
            { label: 'A function', sub: 'one rule in one place', tone: 'mastered' },
            { label: 'A class', sub: 'state, and the rules that guard it', tone: 'mastered' },
            { label: 'An interface and implementations', sub: 'when the behaviour varies now', tone: 'line' },
            { label: 'A plugin system or framework', sub: 'when outsiders add the variants', tone: 'streak' },
          ],
          note: 'Each rung costs every future reader more than the one above it. Move down only when a requirement you have needs it.',
        },
      },

      { kind: 'heading', text: 'YAGNI and the rule of three' },
      {
        kind: 'prose',
        text: '"You aren\'t gonna need it" comes from Extreme Programming, where Ron Jeffries put it as: always implement things when you actually need them, never when you just foresee that you need them. Martin Fowler later named the costs of building a presumptive feature: the cost of building it, the cost of delaying what you should have built instead, the cost of carrying its complexity, and the cost of repairing it when the guess was wrong.',
      },
      {
        kind: 'prose',
        text: 'It is not permission to skip quality. It applies to **features**, not to the tests, error handling and clear structure that make adding the feature later cheap. And it is weakest where a later change is expensive: a public [[API]] shape, a data model with years of rows behind it, security. There, leave a seam now, even if nothing is built behind it.',
      },
      {
        kind: 'figure',
        caption: 'Build what is needed, and leave seams only where retrofitting would be expensive.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Does a current requirement need it?',
            yes: { answer: 'Build it', tone: 'mastered' },
            no: {
              question: 'Would adding it later be expensive: a public contract, stored data, security?',
              yes: { answer: 'Leave a cheap seam now', sub: 'a version field, a hook; not the feature', tone: 'line' },
              no: { answer: 'Don\'t build it', sub: 'add it when someone asks', tone: 'neutral' },
            },
          },
        },
      },
      {
        kind: 'prose',
        text: 'The rule of three, which Fowler credits to Don Roberts, says when the waiting ends. The first time, just write it. The second time, wince at the duplication and write it anyway. The third time, refactor. Three cases show you what really varies; two only show you what happened to differ.',
      },

      { kind: 'heading', text: 'Composition over inheritance' },
      {
        kind: 'prose',
        text: 'The Gang of Four\'s second principle, in Design Patterns (1994), is to favour object composition over class inheritance. Inheritance is white-box reuse fixed when you write the code: the subclass sees, and depends on, the parent\'s internals. Composition is black-box reuse chosen when you build the object: the outer object knows only the inner one\'s interface.',
      },
      {
        kind: 'prose',
        text: 'The everyday symptom is a hierarchy that multiplies. A report that can be formatted as a spreadsheet or a document, and delivered by email or to a storage bucket, needs a subclass per combination. Composition gives the report two parts and lets you choose each one.',
      },
      {
        kind: 'figure',
        caption: 'A report composed of two parts: formats plus deliveries, instead of formats times deliveries.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'Formatter', stereotype: 'interface', methods: ['format(rows): File'], tone: 'line' },
            { name: 'Delivery', stereotype: 'interface', methods: ['send(file): void'], tone: 'line' },
            { name: 'Report', fields: ['query: Query', 'formatter: Formatter', 'delivery: Delivery'], methods: ['run(): void'] },
            { name: 'CsvFormat', methods: ['format(rows): File'] },
            { name: 'EmailDelivery', fields: ['to: Email'], methods: ['send(file): void'] },
          ],
          relations: [
            { from: 'Report', to: 'Formatter', kind: 'has' },
            { from: 'Report', to: 'Delivery', kind: 'has' },
            { from: 'CsvFormat', to: 'Formatter', kind: 'implements' },
            { from: 'EmailDelivery', to: 'Delivery', kind: 'implements' },
          ],
          note: 'A new format is one class. With inheritance it would be one class per delivery method.',
        },
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'React',
        text: 'React\'s documentation used to state that Facebook used React in thousands of components and had not found a single case where it would recommend component inheritance hierarchies. Reuse in React goes through composition instead: props, children and hooks.',
      },

      { kind: 'heading', text: 'The fragile base class' },
      {
        kind: 'prose',
        text: 'The deepest reason to prefer composition is that a subclass depends on how its parent is implemented, not only on what it promises. Change the parent\'s internals without touching its interface, and subclasses nobody edited start to fail. Effective Java\'s example is a collection that counts its insertions:',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'The subclass depends on self-calls',
          code: `class Bag<T> {
  protected items: T[] = []
  add(x: T) { this.items.push(x) }
  addAll(xs: T[]) { for (const x of xs) this.add(x) }
}

class CountingBag<T> extends Bag<T> {
  added = 0
  add(x: T) { this.added++; super.add(x) }
  addAll(xs: T[]) {
    this.added += xs.length
    super.addAll(xs) // calls this.add: every item counted twice
  }
}`,
        },
        after: {
          title: 'Wrap it instead',
          code: `class CountingBag<T> {
  added = 0
  constructor(private readonly inner: Bag<T>) {}

  add(x: T) {
    this.added++
    this.inner.add(x)
  }

  addAll(xs: T[]) {
    this.added += xs.length
    this.inner.addAll(xs) // inner's self-calls stay inside it
  }
}`,
        },
        note: 'The wrapper sees only the bag\'s public methods, so it is correct whether or not `addAll` calls `add`, in this version or the next.',
      },
      {
        kind: 'prose',
        text: 'If you do design a class for inheritance, Effective Java\'s rule is the one to quote: design and document for inheritance, or else prohibit it. Document which methods call which, keep the overridable surface small, and seal the rest. TypeScript has no `final` keyword for classes, so the usual signal is to export an interface and a factory and keep the class itself private.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'I\'d leave these two duplicated for now: they look alike but encode different rules, and I\'d rather extract on the third case than guess the abstraction today. Where behaviour varies, I compose. The report holds a formatter and a delivery, instead of a subclass for every combination.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Merging two look-alike functions in the name of not repeating yourself, then adding a flag for each way they differ. Those flags are control coupling, and the shared function is now harder to change than the duplication ever was. Using YAGNI as a reason to skip tests or error handling is the other way to lose the point.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Doesn\'t YAGNI justify skipping tests or error handling?',
            a: 'No. It applies to features nobody has asked for. Tests, error handling and clean structure are what make adding a feature later cheap, which is the whole bet YAGNI makes. Skip them and deferring becomes expensive.',
          },
          {
            q: 'How do you tell real duplication from accidental?',
            a: 'Ask whether the copies would change together, for the same reason, at the request of the same people. If a rule change has to be made in both, they are one piece of knowledge: extract it. If they would drift apart, leave them apart.',
          },
          {
            q: 'When is inheritance still the right choice?',
            a: 'For shallow hierarchies inside a module you own, where each subclass is a true subtype and the base class was designed for it, with its self-calls documented. The template method pattern is the classic case. Across package or team boundaries, compose.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-p-simplicity-1',
        moduleId: 'p-simplicity',
        stem: 'Two functions both check that a string is at most 30 characters: one for usernames, one for product tags. A teammate wants a shared `maxLength30()`. Your response?',
        options: [
          'Merge them: identical code is exactly what DRY forbids',
          'Merge them, and add a flag for the difference when one appears',
          'Move both into a shared `utils.ts`',
          'Keep them separate: they are two rules that match today and will change for different reasons',
        ],
        correct: 3,
        explain: 'Duplication is about knowledge. The username limit and the tag limit are separate decisions owned by different people, so merging them couples the two. The flag option is exactly how the wrong abstraction starts.',
      },
      {
        id: 'q-p-simplicity-2',
        moduleId: 'p-simplicity',
        stem: 'You are building a notification service that sends email only. Which of these does YAGNI tell you to skip?',
        options: [
          'Tests for the email sender',
          'A plugin framework for channels, because push and [[SMS]] might come later',
          'Handling the email provider\'s rate-limit errors',
          'A version in the public request format',
        ],
        correct: 1,
        explain: 'The plugin framework is a presumptive feature: it costs build time now and carrying cost forever, and the guess may be wrong. Tests and error handling are what make adding a channel cheap later. A version field is a cheap seam on a contract that is expensive to change once clients exist.',
      },
      {
        id: 'q-p-simplicity-3',
        moduleId: 'p-simplicity',
        stem: 'A subclass overrides `add` and `addAll` to count insertions, and after `addAll` the count is double the real number. Why?',
        options: [
          'The parent\'s constructor ran twice',
          'The counter field is not private',
          'The parent\'s `addAll` calls `add`, so each item is counted in both overrides',
          '`super` calls in TypeScript are asynchronous',
        ],
        correct: 2,
        explain: 'The subclass depended on an implementation detail of its parent: its self-calls. That is the fragile base class problem, and it can break again whenever the parent changes how `addAll` works. Wrapping the collection instead of extending it removes the dependency.',
      },
    ],
    cards: [
      {
        id: 'c-p-simplicity-1',
        moduleId: 'p-simplicity',
        front: 'What does DRY actually forbid?',
        back: 'Two authoritative copies of one piece of knowledge, such as a business rule in code and again in a query. Similar code encoding different decisions is fine.',
        tag: 'Simplicity',
      },
      {
        id: 'c-p-simplicity-2',
        moduleId: 'p-simplicity',
        front: 'What is the rule of three?',
        back: 'Write it once. Duplicate it the second time, and note it. Extract the abstraction on the third, when you can see what really varies.',
        tag: 'Simplicity',
      },
      {
        id: 'c-p-simplicity-3',
        moduleId: 'p-simplicity',
        front: 'What is the fragile base class problem?',
        back: 'A subclass depends on its parent\'s implementation, not just its interface, so an internal change to the parent breaks subclasses nobody edited.',
        tag: 'Inheritance',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'p-clean',
    trackId: 'principles',
    title: 'Clean and hexagonal architecture',
    station: 7,
    prereqs: ['p-simplicity', 'p-dip'],
    minutes: 11,
    summary: 'Business rules at the centre, input and output at the edges, and every dependency pointing inward.',
    objectives: [
      'State the dependency rule and show which way the imports point',
      'Lay out a service as ports and adapters, and say what crosses the boundary',
      'Say when the structure is overkill, and what to build instead',
    ],
    keywords: [
      'clean architecture',
      'hexagonal',
      'ports and adapters',
      'onion architecture',
      'dependency rule',
      'layered architecture',
      'use case',
      'boundaries',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Senior backend interviews ask how you would structure a service\'s code, usually as a follow-up. Where does the business logic live? How would you test this without a database? What changes if we move from Stripe to Adyen? Clean, hexagonal and onion architecture are three answers to those questions, and they are the same answer.',
      },
      {
        kind: 'prose',
        text: 'That answer is the dependency rule: the business rules at the centre import nothing from the web framework, the database or any vendor. Know the rule, the price you pay for it, and when a plain layered service is the better call.',
      },
      {
        kind: 'figure',
        caption: 'The rings of clean architecture, from the outside in. Source dependencies only point inward.',
        figure: {
          kind: 'stack',
          layers: [
            { label: 'Frameworks and drivers', sub: 'web framework, database, queues, vendor clients', tone: 'neutral' },
            { label: 'Interface adapters', sub: 'controllers, repositories, gateways, presenters', tone: 'neutral' },
            { label: 'Use cases', sub: 'application rules: place an order, issue a refund', tone: 'line' },
            { label: 'Entities', sub: 'business rules that would exist without software', tone: 'line' },
          ],
          note: 'Nothing in an inner ring names anything in an outer one: no imports, no types, no annotations.',
        },
      },

      { kind: 'heading', text: 'Layers and the dependency rule' },
      {
        kind: 'prose',
        text: 'The classic layered service stacks presentation on business logic on data access, and each layer calls the one below. The flaw is the last arrow. Business logic imports the data layer, so the rules depend on the database library, every test of a pricing rule needs a database, and a storage change ripples upward into the rules.',
      },
      {
        kind: 'prose',
        text: 'Clean architecture, Robert Martin\'s 2012 synthesis, applies the [[DIP]] to that last arrow. The use case declares the interfaces it needs, the storage code implements them, and the dependency rule follows: source code dependencies point only inward. Control still flows out to the database and back. The imports do not.',
      },

      { kind: 'heading', text: 'Hexagonal: ports and adapters' },
      {
        kind: 'prose',
        text: 'Alistair Cockburn described hexagonal architecture in 2005, with a different emphasis: an application should be equally drivable by a user, a test suite or another program, and equally able to run against real or fake infrastructure. The hexagon means nothing beyond "many sides, no top or bottom".',
      },
      {
        kind: 'list',
        items: [
          '**Ports** are interfaces the application defines in its own language. **Driving** ports are what it offers, such as `PlaceOrder` and `RefundOrder`. **Driven** ports are what it needs, such as `Orders`, `Payments` and `Clock`.',
          '**Adapters** connect one technology to one port. An [[HTTP]] controller, a queue consumer and a test harness drive the application. A Postgres repository, a Stripe gateway and an in-memory fake are driven by it.',
          '**Swapping an adapter never touches the centre.** That is the whole claim, and it is the one to test in your own design: point at each vendor and ask what changes if it goes.',
        ],
      },
      {
        kind: 'figure',
        caption: 'Ports and adapters: the use case owns two ports, and each adapter implements one of them for one technology.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'Orders', stereotype: 'interface', methods: ['save(order): void'], tone: 'line' },
            { name: 'Payments', stereotype: 'interface', methods: ['charge(customer, money): ChargeId'], tone: 'line' },
            { name: 'PlaceOrder', fields: ['orders: Orders', 'payments: Payments'], methods: ['run(command): Order'], tone: 'mastered' },
            { name: 'PostgresOrders', fields: ['pool: Pool'], methods: ['save(order): void'] },
            { name: 'StripePayments', fields: ['client: Stripe'], methods: ['charge(customer, money): ChargeId'] },
          ],
          relations: [
            { from: 'PlaceOrder', to: 'Orders', kind: 'has' },
            { from: 'PlaceOrder', to: 'Payments', kind: 'has' },
            { from: 'PostgresOrders', to: 'Orders', kind: 'implements' },
            { from: 'StripePayments', to: 'Payments', kind: 'implements' },
          ],
          note: 'Moving to Adyen is one new class beside `StripePayments`. The use case and its tests do not change.',
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Everything in the handler',
          code: `app.post('/orders', async (req, res) => {
  const { customerId, productIds } = req.body
  const { rows } = await db.query(
    'SELECT price FROM products WHERE id = ANY($1)',
    [productIds],
  )
  const total = rows.reduce((s, r) => s + r.price, 0)
  if (total > 10_000) return res.status(422).end()
  const intent = await stripe.paymentIntents.create({
    amount: total, currency: 'eur', customer: customerId,
  })
  await db.query(
    'INSERT INTO orders (customer_id, payment_id) VALUES ($1, $2)',
    [customerId, intent.id],
  )
  res.status(201).json({ paymentId: intent.id })
})`,
        },
        after: {
          title: 'A use case, its ports, and a thin adapter',
          code: `// core: imports nothing from express, pg or stripe
class PlaceOrder {
  constructor(
    private readonly catalogue: Catalogue,
    private readonly payments: Payments,
    private readonly orders: Orders,
  ) {}

  async run(cmd: PlaceOrderCommand): Promise<Order> {
    const total = Money.sum(await this.catalogue.prices(cmd.items))
    if (total.exceeds(Order.LIMIT)) throw new OrderTooLarge(total)
    const charge = await this.payments.charge(cmd.customer, total)
    const order = Order.place(cmd.customer, total, charge)
    await this.orders.save(order)
    return order
  }
}

// adapter: request in, command to the core, response out
app.post('/orders', async (req, res) => {
  const order = await placeOrder.run(toCommand(req.body))
  res.status(201).json(toResponse(order))
})`,
        },
        note: 'The rules now run in a unit test with three in-memory adapters. Turning `OrderTooLarge` into a 422 is the adapter\'s job, because status codes are an [[HTTP]] detail.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Netflix\'s studio engineering',
        text: 'Netflix\'s studio engineering team wrote in 2020 about building a new application hexagonally, because its data would come from several systems that were themselves changing. When one core entity moved from a monolith\'s [[API]] to a new service, they swapped the data-source adapter and left the business rules untouched.',
      },

      { kind: 'heading', text: 'Onion, clean, hexagonal: one idea, three drawings' },
      {
        kind: 'table',
        head: ['Name', 'Origin', 'What it emphasises'],
        rows: [
          ['**Hexagonal**', 'Alistair Cockburn, 2005', 'Symmetry: drive the app from anywhere, run it against real or fake infrastructure'],
          ['**Onion**', 'Jeffrey Palermo, 2008', 'Concentric rings, with the domain model at the centre and infrastructure outermost'],
          ['**Clean**', 'Robert Martin, 2012', 'Names the dependency rule, and separates use cases from entities'],
        ],
      },
      {
        kind: 'prose',
        text: 'In an interview, pick one vocabulary and use it consistently. "Ports and adapters" is the most concrete, because it names the two things you actually write.',
      },

      { kind: 'heading', text: 'Crossing the boundary' },
      {
        kind: 'prose',
        text: 'The dependency rule is easy to state and easy to erode at the boundary, where three things tend to leak inward:',
      },
      {
        kind: 'list',
        items: [
          '**Data shapes.** Request objects and persistence models stop at the adapter. The core takes commands and returns domain objects, and the adapter maps between them. If a TypeORM entity or an Express `req` reaches a use case, the rule is broken.',
          '**Errors.** The core throws domain errors such as `OrderTooLarge`. The [[HTTP]] adapter maps them to status codes; a queue adapter maps the same error to "park the message and alert".',
          '**Transactions.** The use case is the unit of work, so it decides the boundary, through a port such as `UnitOfWork.run(fn)` that the database adapter implements. The core never sees a connection.',
        ],
      },
      {
        kind: 'prose',
        text: 'Erosion is mechanical, so stop it mechanically. Put the core in its own package with no dependency on the framework, and enforce import rules with a tool such as dependency-cruiser, or ArchUnit in Java.',
      },

      { kind: 'heading', text: 'When it is overkill' },
      {
        kind: 'prose',
        text: 'Every port is an interface, every adapter is a mapping, and an order may now exist in three shapes: the request, the domain object and the row. For a service with real rules, that buys fast tests and replaceable vendors. For a service that validates a form and writes a row, it buys nothing.',
      },
      {
        kind: 'figure',
        caption: 'How much architecture a service deserves.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Are there business rules beyond validation and storage?',
            yes: {
              question: 'More than one entry point, or years of life ahead?',
              yes: { answer: 'Full ports and adapters', sub: 'every input and output behind a port', tone: 'mastered' },
              no: { answer: 'Layered, with ports at the risky edges', sub: 'payments, email, third parties', tone: 'line' },
            },
            no: { answer: 'Framework defaults', sub: 'Rails, Django or NestJS as they come', tone: 'neutral' },
          },
        },
      },
      {
        kind: 'prose',
        text: 'The middle answer is the one most real services want, and the one interviewers like to hear: keep a simple layered structure, and put ports only where a vendor, a slow dependency or a likely replacement sits. You get most of the testability for a fraction of the ceremony.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Rails and Django',
        text: 'Both frameworks are deliberately not hexagonal. Their models follow the Active Record pattern: the object is the table row, with its persistence methods built in. That coupling is exactly why they are so fast for forms-over-data products, and it is why Shopify built Packwerk to enforce boundaries between components inside its large Rails monolith.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'I\'d keep the business rules in the middle, with no imports from the web framework, the database or Stripe. The use case declares the ports it needs, and adapters at the edge implement them. Tests run against in-memory adapters, and changing payment provider touches one class. For a thin forms-over-data service I wouldn\'t; I\'d put a port only in front of the third parties.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Drawing four concentric rings and stopping. The interviewer wants the rule at work: which way the imports point, where the interfaces live, and what crosses the boundary. The opposite trap is full ceremony, three mappings and a dozen ports, for a service with no rules to protect.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Where do transactions go?',
            a: 'The use case is the unit of work, so it owns the boundary, through a port the database adapter implements, such as `unitOfWork.run(fn)`. The core never imports the driver. The simpler option is for the adapter to wrap each use case call in a transaction, which works until one request needs two use cases to commit together.',
          },
          {
            q: 'Isn\'t mapping between three shapes of an order wasteful?',
            a: 'It is when the shapes match, so start with fewer and split when one needs to change on its own. The split pays when the public contract must stay stable while the schema is denormalised, or when the domain object has invariants a row cannot express.',
          },
          {
            q: 'How do you stop the rule eroding over time?',
            a: 'Make it mechanical. A core package that does not depend on the framework cannot import it by accident, and import rules checked on every build catch the rest. Code review is the last line of defence, not the first.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-p-clean-1',
        moduleId: 'p-clean',
        stem: 'Under the dependency rule, where is the `Payments` port defined?',
        options: [
          'In the application core, in the use case\'s terms, implemented by the Stripe adapter',
          'In the Stripe adapter package, next to its implementation',
          'In a shared `interfaces` package that every layer imports',
          'Nowhere: the use case calls the Stripe client, which the framework injects',
        ],
        correct: 0,
        explain: 'The core owns its ports, so the adapter imports the core and never the reverse. Defining the port beside the Stripe code makes the core import the adapter package. Injecting the Stripe client directly is injection without inversion.',
      },
      {
        id: 'q-p-clean-2',
        moduleId: 'p-clean',
        stem: 'A use case throws `OrderTooLarge`. Where should it become an [[HTTP]] 422?',
        options: [
          'In the `Order` entity, which knows its own limits',
          'In the use case, which returns a status code',
          'In the repository, before the order is saved',
          'In the HTTP adapter, which maps domain errors to responses',
        ],
        correct: 3,
        explain: 'Status codes are an HTTP detail, so they live in the HTTP adapter. The same error reaching a queue consumer might mean "park and alert" instead. A use case that returns 422 can no longer be driven by anything but HTTP.',
      },
      {
        id: 'q-p-clean-3',
        moduleId: 'p-clean',
        stem: 'Which service gains the least from full ports and adapters?',
        options: [
          'A payments service with refund rules and three providers',
          'An order service called both over HTTP and from a queue consumer',
          'An internal admin tool that edits rows in three tables, with field validation only',
          'A pricing engine with complex rules and a slow external rates feed',
        ],
        correct: 2,
        explain: 'With no rules beyond validation and one entry point, there is nothing at the centre to protect, and every mapping is pure cost. Each of the others has rules worth testing alone, several entry points, or a vendor worth isolating.',
      },
    ],
    cards: [
      {
        id: 'c-p-clean-1',
        moduleId: 'p-clean',
        front: 'What is the dependency rule?',
        back: 'Source dependencies point only inward. The core imports nothing from frameworks, databases or vendors; adapters at the edge depend on the core.',
        tag: 'Architecture',
      },
      {
        id: 'c-p-clean-2',
        moduleId: 'p-clean',
        front: 'Port versus adapter?',
        back: 'A port is an interface the core defines in its own terms, such as `Payments`. An adapter implements or drives it for one technology, such as Stripe or HTTP.',
        tag: 'Architecture',
      },
      {
        id: 'c-p-clean-3',
        moduleId: 'p-clean',
        front: 'When is hexagonal architecture overkill?',
        back: 'When there are no rules beyond validation and storage, one entry point and a short life. Use the framework defaults, with ports only in front of third parties.',
        tag: 'Architecture',
      },
    ],
  },
]
