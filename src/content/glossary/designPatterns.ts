import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the designPatterns content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: 'GoF',
    full: 'Gang of Four',
    gist: 'Gamma, Helm, Johnson and Vlissides, whose 1994 book Design Patterns named 23 recurring object-oriented designs. "A GoF pattern" means one from that catalogue, which is still the shared vocabulary of design interviews.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'Creational', sub: '5 patterns: how objects get made', tone: 'neutral' },
        { label: 'Structural', sub: '7 patterns: how objects fit together', tone: 'neutral' },
        { label: 'Behavioural', sub: '11 patterns: who does what, and who tells whom', tone: 'neutral' },
      ],
      note: 'Twenty-three in all. About fifteen of them come up in interviews.',
    },
    caption: 'The catalogue: twenty-three patterns in three families.',
    seeAlso: ['MVC'],
  },
  {
    id: 'MVC',
    full: 'Model–View–Controller',
    gist: 'Splits an interface into the data and its rules (model), what the user sees (view), and what turns input into changes (controller). It came from Smalltalk, and the GoF book opens with it as three patterns working together.',
    figure: {
      kind: 'cycle',
      steps: [
        { label: 'User acts', sub: 'a click or a keypress' },
        { label: 'Controller', sub: 'turns input into a change' },
        { label: 'Model', sub: 'updates its state, notifies' },
        { label: 'View', sub: 'redraws from the model' },
      ],
      note: 'The model never knows how it is drawn, so one model can have many views.',
    },
    caption: 'Input goes through the controller to the model; the model tells the view to redraw.',
    seeAlso: ['GoF'],
  },
  {
    id: 'JDBC',
    full: 'Java Database Connectivity',
    gist: "Java's standard interface for relational databases. You write code against its interfaces and a vendor's driver supplies the implementations, picked at runtime from the connection URL.",
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Your code', sub: 'written against Connection', to: 'getConnection(url)' },
        { label: 'DriverManager', sub: 'asks each driver: is this yours?', tone: 'line', to: 'first match' },
        { label: 'Postgres driver', sub: 'implements the interfaces', to: 'wire protocol' },
        { label: 'Postgres' },
      ],
    },
    caption: 'Your code names an interface and a URL; the driver behind it is chosen at runtime.',
    seeAlso: ['SQL'],
  },
  {
    id: 'SDK',
    full: 'Software Development Kit',
    gist: "A vendor's client library for its API: typed methods, retries and authentication done for you. Convenient, but its types and errors belong to the vendor, which is why you usually keep it behind an adapter.",
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Your code', to: 'paymentIntents.create()' },
        { label: 'Vendor SDK', sub: 'types, retries, auth', tone: 'line', to: 'HTTP calls' },
        { label: "Vendor's API", sub: 'their shapes, their errors' },
      ],
    },
    caption: "An SDK is a convenience layer over someone else's API, and it speaks their language.",
    seeAlso: ['API'],
  },
  {
    id: 'ORM',
    full: 'Object-Relational Mapper',
    gist: "A library that maps database rows to objects and back, such as Hibernate, Prisma or Django's. It removes boilerplate and hides the queries, which is exactly how the N+1 problem slips in unnoticed.",
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'order.customer', sub: 'looks like a field read', to: 'first access' },
        { label: 'ORM', sub: 'Hibernate, Prisma', tone: 'line', to: 'generates' },
        { label: 'SELECT … WHERE id = ?', sub: 'a real round trip', tone: 'streak' },
      ],
      note: 'Inside a loop over 100 orders, that is 100 queries.',
    },
    caption: 'An object access on one side, a database query on the other.',
    seeAlso: ['SQL'],
  },
  {
    id: 'DI',
    full: 'Dependency Injection',
    gist: 'Giving an object its collaborators, usually through its constructor, instead of letting it create them or fetch them from a global. Dependencies become visible in the signature and replaceable in a test.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'main.ts', sub: 'creates one Database', to: 'passes it in' },
        { label: 'BillingService(db)', sub: 'declares what it needs', tone: 'mastered', to: 'in a test' },
        { label: 'FakeDatabase', sub: 'swapped in, no globals' },
      ],
    },
    caption: 'The caller decides what an object depends on, so a test can decide differently.',
  },
]
