import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the principles content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: 'OOP',
    full: 'Object-Oriented Programming',
    gist: 'Organising code as objects that own their state and expose behaviour, so callers ask for what they want instead of reaching into data. The pay-off is polymorphism: a new kind of thing arrives as a new class, not a new branch.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'Encapsulation', sub: 'only the object changes its state', tone: 'line' },
        { label: 'Abstraction', sub: 'callers see what, not how', tone: 'line' },
        { label: 'Inheritance', sub: 'reuse a parent you can stand in for', tone: 'streak' },
        { label: 'Polymorphism', sub: 'one call, many behaviours', tone: 'mastered' },
      ],
      note: 'Inheritance is the pillar some languages drop: Go and Rust have no class inheritance.',
    },
    caption: 'The four pillars, by what each one buys you.',
    seeAlso: ['SOLID'],
  },
  {
    id: 'SOLID',
    full: 'Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion',
    gist: 'Five principles of object-oriented design, gathered by Robert Martin and named by Michael Feathers. Together they keep each change local: one reason to change per class, new behaviour by addition, and dependencies on abstractions.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'S: single responsibility', sub: 'one actor asks for its changes' },
        { label: 'O: open/closed', sub: 'extend by adding, not editing' },
        { label: 'L: Liskov substitution', sub: 'subtypes keep the parent\'s promises' },
        { label: 'I: interface segregation', sub: 'clients see only what they call' },
        { label: 'D: dependency inversion', sub: 'the policy owns the abstraction', tone: 'line' },
      ],
    },
    caption: 'The five letters, each as the one-line rule it stands for.',
    seeAlso: ['SRP', 'OCP', 'LSP', 'ISP', 'DIP'],
  },
  {
    id: 'SRP',
    full: 'Single Responsibility Principle',
    gist: 'A module should be responsible to one actor: one group of people who ask for its changes. It is not "do one thing"; it stops a tax change and a layout change from colliding in one class.',
    figure: {
      kind: 'split',
      left: {
        title: 'Three actors, one class',
        tone: 'alert',
        nodes: [
          { label: 'Finance, brand, platform', sub: 'three sources of change', to: 'all edit' },
          { label: 'Invoice', sub: 'total, toHtml, save', tone: 'alert' },
        ],
        cost: 'Their changes collide in one file and one deploy.',
      },
      right: {
        title: 'One actor each',
        tone: 'mastered',
        nodes: [
          { label: 'Invoice', sub: 'finance', tone: 'mastered', to: 'read by' },
          { label: 'InvoiceHtml, InvoiceRepository', sub: 'brand, platform' },
        ],
        cost: 'Each changes on its own schedule.',
      },
    },
    caption: 'Split by who asks for changes, not by size.',
    seeAlso: ['SOLID', 'OCP'],
  },
  {
    id: 'OCP',
    full: 'Open/Closed Principle',
    gist: 'Open for extension, closed for modification. On an axis that keeps changing, a new variant is a new class behind an existing interface, and tested code is not reopened.',
    figure: {
      kind: 'classes',
      classes: [
        { name: 'PaymentMethod', stereotype: 'interface', methods: ['charge(order): Receipt'], tone: 'line' },
        { name: 'CardPayment', methods: ['charge(order): Receipt'] },
        { name: 'PayPalPayment', methods: ['charge(order): Receipt'] },
        { name: 'KlarnaPayment', methods: ['charge(order): Receipt'], tone: 'mastered' },
        { name: 'Checkout', fields: ['methods: PaymentMethod[]'], methods: ['pay(order, kind)'] },
      ],
      relations: [
        { from: 'CardPayment', to: 'PaymentMethod', kind: 'implements' },
        { from: 'PayPalPayment', to: 'PaymentMethod', kind: 'implements' },
        { from: 'KlarnaPayment', to: 'PaymentMethod', kind: 'implements', label: 'added' },
        { from: 'Checkout', to: 'PaymentMethod', kind: 'has' },
      ],
    },
    caption: 'A new payment method is a new class. Checkout is not edited.',
    seeAlso: ['SOLID', 'SRP', 'LSP'],
  },
  {
    id: 'LSP',
    full: 'Liskov Substitution Principle',
    gist: 'Code written against a type must keep working when handed any subtype, which is what makes polymorphism safe. A subtype may accept more and promise more, never less.',
    figure: {
      kind: 'classes',
      classes: [
        { name: 'Rectangle', methods: ['setWidth(w): void', 'setHeight(h): void', 'area(): number'] },
        { name: 'Square', methods: ['setWidth(w): sets both', 'setHeight(h): sets both'], tone: 'alert' },
      ],
      relations: [{ from: 'Square', to: 'Rectangle', kind: 'inherits', label: 'breaks its promise' }],
      note: 'Width 5, then height 4: a Rectangle gives 20, a Square gives 16.',
    },
    caption: 'The classic violation: a mutable square cannot keep a rectangle\'s promise.',
    seeAlso: ['SOLID', 'ISP'],
  },
  {
    id: 'ISP',
    full: 'Interface Segregation Principle',
    gist: 'No client should depend on methods it does not use. Split fat interfaces into role interfaces, so each client, and each test fake, sees only what it calls.',
    figure: {
      kind: 'classes',
      classes: [
        { name: 'UserReader', stereotype: 'interface', methods: ['byId(id): User'], tone: 'line' },
        { name: 'UserWriter', stereotype: 'interface', methods: ['save(user): void'], tone: 'line' },
        { name: 'PostgresUsers', methods: ['byId(id): User', 'save(user): void'] },
        { name: 'ProfilePage', fields: ['users: UserReader'] },
      ],
      relations: [
        { from: 'PostgresUsers', to: 'UserReader', kind: 'implements' },
        { from: 'PostgresUsers', to: 'UserWriter', kind: 'implements' },
        { from: 'ProfilePage', to: 'UserReader', kind: 'has' },
      ],
    },
    caption: 'One class, two roles. The profile page depends only on reading.',
    seeAlso: ['SOLID', 'LSP'],
  },
  {
    id: 'DIP',
    full: 'Dependency Inversion Principle',
    gist: 'High-level policy and low-level detail both depend on an abstraction, and the policy owns it. The business rules stop importing the database; the database code implements the rules\' interface.',
    figure: {
      kind: 'classes',
      classes: [
        { name: 'OrderRepository', stereotype: 'interface', methods: ['save(order): void'], tone: 'line' },
        { name: 'OrderService', fields: ['orders: OrderRepository'], methods: ['place(cart): Order'] },
        { name: 'PostgresOrders', methods: ['save(order): void'] },
      ],
      relations: [
        { from: 'OrderService', to: 'OrderRepository', kind: 'has' },
        { from: 'PostgresOrders', to: 'OrderRepository', kind: 'implements' },
      ],
      note: 'The interface lives with the service, so the storage class points up at the rules.',
    },
    caption: 'The service and the storage class both depend on an interface the service owns.',
    seeAlso: ['DI', 'SOLID'],
  },
  {
    id: 'DI',
    full: 'Dependency Injection',
    gist: 'Handing an object its collaborators from outside, usually through the constructor, instead of letting it create them. It is how dependency inversion gets wired up, and what lets a test pass in a fake.',
    figure: {
      kind: 'split',
      left: {
        title: 'Creates its own',
        tone: 'alert',
        nodes: [
          { label: 'OrderService', to: 'calls new' },
          { label: 'PostgresClient', sub: 'hidden, and real in every test', tone: 'alert' },
        ],
        cost: 'A unit test needs a database.',
      },
      right: {
        title: 'Receives them',
        tone: 'mastered',
        nodes: [
          { label: 'Composition root', sub: 'main.ts, or a test', to: 'passes in' },
          { label: 'OrderService', sub: 'constructor(orders, clock)', tone: 'mastered' },
        ],
        cost: 'A test passes an in-memory repository and a fixed clock.',
      },
    },
    caption: 'The same service, creating its dependencies versus receiving them.',
    seeAlso: ['DIP'],
  },
  {
    id: 'DRY',
    full: 'Don\'t Repeat Yourself',
    gist: 'Every piece of knowledge should have one authoritative home. It is about decisions, not keystrokes: one rule written in two places is a violation, two similar functions that encode different rules are not.',
    figure: {
      kind: 'split',
      left: {
        title: 'One rule, three copies',
        tone: 'alert',
        nodes: [
          { label: 'Free shipping over 50', to: 'written in' },
          { label: 'Checkout, report, email', sub: 'three copies', tone: 'alert' },
        ],
        cost: 'The next change misses a copy.',
      },
      right: {
        title: 'One rule, one home',
        tone: 'mastered',
        nodes: [
          { label: 'shippingPolicy', sub: 'the only definition', tone: 'mastered', to: 'read by' },
          { label: 'Checkout, report, email' },
        ],
        cost: 'A change is one edit.',
      },
    },
    caption: 'Duplicated knowledge versus a single source of truth.',
    seeAlso: ['KISS', 'YAGNI'],
  },
  {
    id: 'KISS',
    full: 'Keep It Simple, Stupid',
    gist: 'Choose the design with the fewest moving parts that meets the requirement you actually have. Usually credited to Lockheed engineer Kelly Johnson, whose jets had to be repairable in the field with basic tools.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'A function', sub: 'one rule in one place', tone: 'mastered' },
        { label: 'A class', sub: 'state and the rules that guard it', tone: 'mastered' },
        { label: 'An interface and implementations', sub: 'behaviour that varies now', tone: 'line' },
        { label: 'A plugin framework', sub: 'outsiders add the variants', tone: 'streak' },
      ],
      note: 'Stop at the first rung that meets the requirement.',
    },
    caption: 'The rungs of indirection, cheapest first.',
    seeAlso: ['YAGNI', 'DRY'],
  },
  {
    id: 'YAGNI',
    full: 'You Aren\'t Gonna Need It',
    gist: 'Build a feature when it is needed, not when you foresee it: a speculative one costs time now and complexity forever, and the guess is often wrong. It never excuses skipping tests or error handling.',
    figure: {
      kind: 'decision',
      root: {
        question: 'Does a current requirement need it?',
        yes: { answer: 'Build it', tone: 'mastered' },
        no: {
          question: 'Expensive to add later, like a public contract or stored data?',
          yes: { answer: 'Leave a cheap seam', sub: 'not the feature', tone: 'line' },
          no: { answer: 'Don\'t build it', tone: 'neutral' },
        },
      },
    },
    caption: 'Build what is needed; leave seams only where retrofitting is expensive.',
    seeAlso: ['KISS', 'DRY'],
  },
]
