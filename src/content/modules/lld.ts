import type { Module } from '../types'

/**
 * Track — Low-level design (L).
 * trackId: 'lld'. Authoring rules: docs/superpowers/plans/2026-11-18-content-brief.md
 *
 * One running domain (a parking lot, with a library for modelling) so each station builds
 * on classes the reader has already met instead of introducing a new toy every time.
 */
export const lldModules: Module[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'l-round',
    trackId: 'lld',
    title: 'How the low-level design round runs',
    station: 1,
    prereqs: ['dp-intro'],
    related: ['c-framework', 'i-room'],
    minutes: 12,
    summary: 'What the object-oriented design round tests, how to spend its 45 minutes, and how it is scored.',
    objectives: [
      'Say what the round tests and how it differs from system design',
      'Run its six phases in 45 minutes, and know what to code and what to sketch',
      'Recognise the six classic prompts and the follow-up hidden in each',
      'Know what separates a hire from a strong hire',
    ],
    keywords: [
      'LLD',
      'object-oriented design',
      'OOD',
      'machine coding',
      'class design interview',
      'design a parking lot',
      'low-level design interview',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'The low-level design round hands you a prompt like "design a parking lot" and watches you turn it into classes, methods and working code in 45 minutes. Recruiters call it the [[LLD]] round, object-oriented design, or machine coding. Whatever the name, it tests something system design does not: whether the code you would actually write is well shaped.',
      },
      {
        kind: 'prose',
        text: 'Most candidates fail it the same way. They hear "parking lot", start typing, and produce one `ParkingLot` class with a `switch` on vehicle type in every method. It works for the first requirement. Then the interviewer adds a second, and the design has nowhere to put it. The round is built to expose exactly that.',
      },
      {
        kind: 'figure',
        caption: 'The two design rounds side by side: what a box means, and what you are judged on.',
        figure: {
          kind: 'split',
          left: {
            title: 'System design',
            nodes: [
              { label: 'Services', sub: 'the boxes', to: 'network calls' },
              { label: 'Databases, queues', sub: 'where state lives' },
            ],
            cost: 'Judged on scale, storage and failure across machines.',
          },
          right: {
            title: 'Low-level design',
            tone: 'line',
            nodes: [
              { label: 'Classes', sub: 'the boxes', tone: 'line', to: 'method calls' },
              { label: 'Objects in memory', sub: 'where state lives', tone: 'line' },
            ],
            cost: 'Judged on responsibilities, extensibility and correctness inside one process.',
          },
          verdict: 'Same drawing habit, one level down. In system design a box is a fleet of machines; here a box is a class you will be asked to implement.',
        },
      },
      { kind: 'heading', text: 'What the round tests' },
      {
        kind: 'prose',
        text: 'Interviewers score four things, roughly in this order of weight:',
      },
      {
        kind: 'list',
        items: [
          '**Modelling.** Do the classes match the domain? Is a book separate from the physical copy you lend? Does each rule live on the object that holds the data it needs?',
          '**Code.** Do the one or two methods that matter actually work, with sensible names, types and error cases? Pseudo-code rarely passes; real TypeScript, Java or Python is expected.',
          '**Extensibility.** When the second requirement arrives, how much existing code changes? One new class is a strong signal. Edits to five `switch` statements is a weak one.',
          '**Correctness under pressure.** Edge cases (lot full, payment fails, the same request twice) and concurrency (two drivers, one spot).',
        ],
      },
      {
        kind: 'prose',
        text: 'Some companies run the round as a machine-coding exercise: 90 minutes or more, and the code has to compile and pass the interviewer\'s test cases. The phases below still apply. Each gets more time, and "sketch" becomes "stub".',
      },
      { kind: 'heading', text: 'The 45 minutes' },
      {
        kind: 'figure',
        caption: 'Six phases. Classes and key methods take half the time, because that is where the score is.',
        figure: {
          kind: 'stack',
          layers: [
            { label: '1 · Clarify requirements', sub: '5 min' },
            { label: '2 · Core objects', sub: '5 min' },
            { label: '3 · Classes and relationships', sub: '10 min', tone: 'line' },
            { label: '4 · Key methods', sub: '12 min', tone: 'line' },
            { label: '5 · Patterns and extensibility', sub: '8 min' },
            { label: '6 · Concurrency and edge cases', sub: '5 min' },
          ],
          note: 'Budgets, not rules. Past minute 22 with no code, cut the diagram short and write the core method.',
        },
      },
      {
        kind: 'list',
        ordered: true,
        items: [
          '**Clarify.** Three or four questions that change the design: which vehicle types, one floor or many, is payment in scope, in memory or persisted? Write the answers down. They are your contract for the rest of the hour.',
          '**Core objects.** Pull the nouns out of the requirements (vehicle, spot, floor, ticket, payment), then cut synonyms and anything that is really a field. Five to seven survive.',
          '**Classes and relationships.** Each class with its two or three key fields and methods, joined by labelled arrows: owns, uses, implements. You do not need strict [[UML]]. You need the interviewer to read it in ten seconds.',
          '**Key methods.** Real code for the one or two operations where the rules live: `park()` and `exit()`, `get()` and `put()`. Signatures for everything else.',
          '**Patterns and extensibility.** Name the seam where change will come (pricing, spot allocation, scheduling) and show how a new variant plugs in. A pattern is justified by a requirement, never listed for its own sake.',
          '**Concurrency and edge cases.** Two requests for the last spot. A full lot. A payment that fails after the spot is taken. Name the race and its fix, even if there is no time to code it.',
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: '"Let me confirm scope: three vehicle types, several floors, pay on exit, everything in memory. I will design it so a new vehicle type or pricing rule is one new class, and I will come back at the end to two drivers racing for the same spot." Thirty seconds, and the interviewer knows you have a plan for all 45 minutes.',
      },
      { kind: 'heading', text: 'What to code and what to sketch' },
      {
        kind: 'prose',
        text: 'You cannot write a whole parking system in 45 minutes, and the interviewer does not want you to. They want the parts where design decisions show up in code, written properly, and the rest named so they know you saw it.',
      },
      {
        kind: 'figure',
        caption: 'Code what carries the rules and the bugs. Sketch the seams. Skip the plumbing, out loud.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Does the method enforce a business rule or change shared state?',
            yes: {
              question: 'Did the interviewer name it, or is it where the race lives?',
              yes: { answer: 'Write it in full', sub: 'park(), exit(), get(), put()', tone: 'line' },
              no: { answer: 'Signature and one line', sub: 'say what it checks' },
            },
            no: {
              question: 'Will a likely follow-up plug in here?',
              yes: { answer: 'Interface only', sub: 'PricingStrategy, SpotFinder', tone: 'mastered' },
              no: { answer: 'Skip it, and say so', sub: 'getters, persistence, UI' },
            },
          },
        },
      },
      {
        kind: 'code',
        caption: 'Minute 25 of a parking lot: the seams as interfaces, the method the interviewer will probe written in full.',
        code: `interface PricingStrategy {
  fee(ticket: Ticket, exitAt: Date): Money
}
interface SpotFinder {
  find(floors: Floor[], v: Vehicle): Spot | undefined
}

class ParkingLot {
  private tickets = new Map<string, Ticket>() // by plate
  constructor(
    private floors: Floor[],
    private finder: SpotFinder,
    private pricing: PricingStrategy,
  ) {}

  park(v: Vehicle): Ticket {
    if (this.tickets.has(v.plate)) throw new AlreadyParkedError()
    const spot = this.finder.find(this.floors, v)
    if (!spot) throw new LotFullError()
    spot.occupy(v)
    const ticket = new Ticket(v.plate, spot.id, new Date())
    this.tickets.set(v.plate, ticket)
    return ticket
  }
}`,
      },
      {
        kind: 'prose',
        text: 'Notice what is in there. Two edge cases (already parked, lot full) handled with named errors rather than `null`. The spot-finding rule behind an interface, because "fill the lowest floor first" is exactly the kind of thing an interviewer changes. Pricing injected for `exit()`, which can stay a signature until there is time. And nothing else: no getters, no persistence, no printing.',
      },
      { kind: 'heading', text: 'The prompts you will meet' },
      {
        kind: 'table',
        head: ['Prompt', 'What it really tests', 'Code this', 'The follow-up'],
        rows: [
          ['Parking lot', 'Type versus instance; spot allocation', '`park()`, `exit()`', 'A new vehicle type; pricing by time'],
          ['Elevator', 'A state machine plus a scheduling policy', '`request()`, `step()`', 'Swap the scheduling algorithm'],
          ['Vending machine', 'The State pattern', '`insertCoin()`, `select()`', 'Sold out mid-purchase; refunds'],
          ['[[LRU]] cache', 'Hash map plus doubly linked list, O(1) both ways', '`get()`, `put()`', 'Thread safety; per-entry expiry'],
          ['Library', 'Book versus copy; borrowing rules', '`checkout()`, `return()`', 'Reservations; limits by member tier'],
          ['Rate limiter', 'Strategy over interchangeable algorithms', '`allow(key)`', 'Limits per client; many servers'],
        ],
      },
      {
        kind: 'prose',
        text: 'Read the right-hand column. Every prompt has a second act, and it is predictable. A design with an interface at that seam does not need rewriting when the follow-up arrives, and the interviewer notices that you saw it coming.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Java\'s LinkedHashMap',
        text: 'The Java standard library ships an [[LRU]] cache in a few lines: construct a `LinkedHashMap` with `accessOrder` set to true, and override `removeEldestEntry` to return true once the map is over capacity. Inside is exactly what the interviewer wants you to build, a hash map whose entries are threaded on a doubly linked list. Mention it at the end as the production answer. Do not offer it as the interview answer.',
      },
      { kind: 'heading', text: 'How it is scored' },
      {
        kind: 'ladder',
        rungs: [
          {
            grade: 'bad',
            title: 'One class, many switches',
            text: 'Starts typing at minute two. A single `ParkingLot` with a `switch` on vehicle type in every method. Meets the stated requirement and collapses at the first follow-up. No hire.',
          },
          {
            grade: 'good',
            title: 'Sensible classes, working core',
            text: 'Clarifies scope, draws five or six cohesive classes, and gets `park()` right. The follow-up needs edits in several places. A mid-level hire.',
          },
          {
            grade: 'great',
            title: 'The follow-up is one new class',
            text: 'All of that, plus a seam where change was likely. When the interviewer adds electric charging bays, the answer is a new class and one registration line. A senior hire.',
          },
          {
            grade: 'best',
            title: 'Raises the race before being asked',
            text: 'All of that, plus the concurrency and failure cases unprompted, each trade-off said out loud, and a pattern only where a requirement demands one. A strong senior hire.',
          },
        ],
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Polishing the class diagram until minute 30. A beautiful diagram with no working method scores below a plain one with `park()` implemented and walked through by hand, because the interviewer cannot tell whether you can build what you drew. The diagram is a means; the code is the evidence.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Why not one class with a switch on vehicle type? It is simpler.',
            a: 'It is simpler for exactly one requirement. Every new type then has to find every `switch`, and missing one is a bug. I would accept the switch if the set of types were closed, but a parking lot is the textbook case of a list that grows.',
          },
          {
            q: 'You have ten minutes left and have not touched concurrency. What do you do?',
            a: 'Stop extending and name it: two drivers can both see spot 12 free and both take it. The fix is to make the claim one atomic step, `tryClaim()` in memory or a conditional update in a database. A sentence for the race and one for the fix earns most of the credit; a half-finished rewrite earns none.',
          },
          {
            q: 'Which design patterns did you use, and why?',
            a: 'Each with the requirement that forced it: Strategy for pricing because rates vary by lot and time of day, a small factory because vehicle types arrive as strings from the gate. If I cannot name the requirement, the pattern should not be there.',
          },
          {
            q: 'How would this change if it ran on many servers?',
            a: 'The object model survives intact; what moves is where state and atomicity live. The ticket map becomes a table, and the in-memory claim becomes a conditional write or a unique constraint. That line is the boundary between this round and system design.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-l-round-1',
        moduleId: 'l-round',
        stem: 'Twenty-five minutes in, you have a tidy class diagram and no code. What should you do next?',
        options: [
          'Add getters and setters to every class so the diagram is complete',
          'Draw the remaining minor classes so nothing is missing before coding',
          'Write the core method, such as `park()`, in full, with signatures for the rest',
          'Move to concurrency, since it is the most senior topic',
        ],
        correct: 2,
        explain:
          'Key methods carry the largest share of the score, and they are the phase candidates run out of time for. A complete diagram with no working code leaves the interviewer unable to tell whether you can build your own design. Concurrency matters, but it is a property of code that has to exist first.',
      },
      {
        id: 'q-l-round-2',
        moduleId: 'l-round',
        stem: 'What most distinguishes the low-level design round from the system design round?',
        options: [
          'The unit of design is the class, and correctness inside one process matters more than scale',
          'It is easier, so it is only used for junior candidates',
          'It is mostly about choosing databases and caches',
          'It is judged mainly on knowing the names of design patterns',
        ],
        correct: 0,
        explain:
          'Both rounds draw boxes and arrows, but here a box is a class you will implement and an arrow is a method call or an ownership. Storage and scale are secondary. Pattern names score nothing on their own; the reason for reaching for one does.',
      },
      {
        id: 'q-l-round-3',
        moduleId: 'l-round',
        stem: 'Halfway through a parking lot, the interviewer adds "now support electric charging bays". Which response signals a senior hire?',
        options: [
          'Add an `isElectric` flag to `Spot` and an `if` in each method that cares',
          'Rewrite the allocation loop so it checks for charging bays first',
          'Explain that this needs a new database table',
          'Add a charging-bay type and a rule in the spot finder, with no edits to `park()`',
        ],
        correct: 3,
        explain:
          'The follow-up tests whether the design absorbs change. If the new requirement is a new class plugged into an existing seam, the core method is untouched. A boolean flag works today and becomes a thicket of `if`s by the third kind of spot.',
      },
    ],
    cards: [
      {
        id: 'c-l-round-1',
        moduleId: 'l-round',
        front: 'What are the six phases of a 45-minute low-level design round?',
        back: 'Clarify, core objects, classes and relationships, key methods, patterns and extensibility, concurrency and edge cases. Classes and methods take half the time.',
        tag: 'The round',
      },
      {
        id: 'c-l-round-2',
        moduleId: 'l-round',
        front: 'In the round, what do you code and what do you sketch?',
        back: 'Code in full the one or two methods that enforce the rules or hold the race. Interfaces for seams. Getters, persistence and UI: skip them, out loud.',
        tag: 'The round',
      },
      {
        id: 'c-l-round-3',
        moduleId: 'l-round',
        front: 'What is the interviewer testing when they add a requirement halfway through?',
        back: 'Whether the design absorbs change. The strong answer is one new class plugged into an existing seam, with no edits to working code.',
        tag: 'Scoring',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'l-modelling',
    trackId: 'lld',
    title: 'Objects, responsibilities and relationships',
    station: 2,
    prereqs: ['l-round'],
    related: ['c-modelling'],
    minutes: 14,
    summary: 'Nouns become classes, verbs land on the object with the data, and every arrow has a lifecycle.',
    objectives: [
      'Turn a requirements paragraph into five to seven classes',
      'Place each behaviour with information expert, creator and controller',
      'Tell association, aggregation and composition apart, and say why it matters',
      'Choose between an enum and a class, and between a value object and an entity',
    ],
    keywords: [
      'GRASP',
      'information expert',
      'composition vs aggregation',
      'value object',
      'entity',
      'domain model',
      'nouns and verbs',
      'enum or class',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'The first fifteen minutes of a low-level design round produce a class diagram, and every minute after that is spent living with it. Put a rule on the wrong object and each later method has to reach across the model to get at it. Miss a class and you end up with a counter that drifts away from reality.',
      },
      {
        kind: 'prose',
        text: 'This lesson works one prompt end to end, a library, because it hides the most common modelling mistake in the catalogue: treating a book and the copy on the shelf as the same thing.',
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'The prompt',
        text: 'Members borrow copies of books for 14 days. A member may hold at most five loans. Late returns are fined per day. When every copy of a book is out, a member can reserve it.',
      },
      {
        kind: 'figure',
        caption: 'From a paragraph to a model in five passes, each one cutting.',
        figure: {
          kind: 'flow',
          nodes: [
            { label: 'The prompt', sub: 'one paragraph', to: 'underline' },
            { label: 'Nouns', sub: 'candidates', to: 'cut' },
            { label: 'Classes', sub: '5 to 7 survive', tone: 'line', to: 'assign' },
            { label: 'Verbs', sub: 'methods on the expert', to: 'connect' },
            { label: 'Relations', sub: 'owns, holds, uses', tone: 'mastered' },
          ],
        },
      },
      { kind: 'heading', text: 'Nouns to classes, verbs to methods' },
      {
        kind: 'prose',
        text: 'Underline every noun: member, copy, book, loan, day, fine, reservation, library. These are candidates, not classes. Then cut:',
      },
      {
        kind: 'list',
        items: [
          '**Synonyms merge.** "Patron" and "member" are one class.',
          '**Primitives become fields.** "Day" is a `Date`. "14 days" is a number on a policy.',
          '**Measurements become value objects.** A fine is an amount of money, so it is a `Money`, not a `Fine` class with no behaviour of its own.',
          '**Types and instances split.** A book is a title with an author. A copy is a physical object with a barcode and a status. Five copies share one `Book`.',
        ],
      },
      {
        kind: 'prose',
        text: 'What survives: `Library`, `Member`, `Book`, `BookCopy`, `Loan` and `Reservation`. Then the verbs (borrow, return, fine, reserve) and the rule that decides most of the design: **a verb becomes a method on the class that holds the data it needs**, not on whichever class felt central.',
      },
      {
        kind: 'figure',
        caption: 'The library model: Library coordinates, Book owns its copies, and a Loan links one member to one copy.',
        figure: {
          kind: 'classes',
          classes: [
            {
              name: 'Library',
              fields: ['members', 'loans'],
              methods: ['checkout(member, copy): Loan', 'return(copy): Money'],
              tone: 'line',
            },
            { name: 'Member', fields: ['id', 'activeLoans: Loan[]'], methods: ['canBorrow(): boolean'] },
            { name: 'Book', fields: ['isbn', 'title', 'copies: BookCopy[]'], methods: ['reserve(member)'] },
            {
              name: 'BookCopy',
              fields: ['barcode', 'status: CopyStatus'],
              methods: ['isAvailable(): boolean', 'dailyFine(): Money'],
            },
            { name: 'Loan', fields: ['member', 'copy', 'dueAt: Date'], methods: ['fineAt(date): Money'] },
          ],
          relations: [
            { from: 'Library', to: 'Member', kind: 'has', label: 'registers' },
            { from: 'Library', to: 'Loan', kind: 'has', label: 'creates, records' },
            { from: 'Book', to: 'BookCopy', kind: 'has', label: 'owns (composition)' },
            { from: 'Member', to: 'Loan', kind: 'has', label: 'holds (aggregation)' },
            { from: 'Loan', to: 'BookCopy', kind: 'uses', label: 'refers to' },
          ],
          note: 'Reservation is left off to keep this readable. It links a member to a Book, not to a copy, because you reserve a title.',
        },
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Giving `Book` an `availableCopies` counter instead of modelling copies. It looks simpler until the interviewer asks which copy is damaged, who has it, or what happens when two returns race to increment the counter. A counter is a cache of a fact you did not model.',
      },
      { kind: 'heading', text: 'Assigning responsibility with GRASP' },
      {
        kind: 'prose',
        text: 'Craig Larman\'s [[GRASP]] principles are nine rules for deciding which class does what. Three of them settle almost every placement in an interview:',
      },
      {
        kind: 'list',
        items: [
          '**Information expert.** Give a responsibility to the class that has the information to fulfil it. `Loan` knows its due date and its copy, so `Loan` computes the fine. `Member` holds its loans, so `Member` answers `canBorrow()`.',
          '**Creator.** Class B creates A if B contains A, records A, or has the data to initialise it. `Library` records every loan, so `Library` creates `Loan`; a `Book` creates its own copies.',
          '**Controller.** One object, just behind the user interface, receives each system operation and coordinates it. `Library.checkout()` is that entry point. It asks the experts and decides nothing itself.',
        ],
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Behaviour far from its data',
          code: `class LoanService {
  fine(loan: Loan, today: Date): number {
    const days = daysBetween(loan.dueAt, today)
    if (days <= 0) return 0
    const rate = loan.copy.book.isReference
      ? 100
      : 20
    return days * rate
  }
}`,
        },
        after: {
          title: 'Information expert',
          code: `class Loan {
  constructor(
    readonly member: Member,
    readonly copy: BookCopy,
    readonly dueAt: Date,
  ) {}

  fineAt(today: Date): Money {
    const days = daysBetween(this.dueAt, today)
    if (days <= 0) return Money.of(0)
    return this.copy.dailyFine().times(days)
  }
}`,
        },
        note: 'The service reaches through `loan.copy.book` to read data three objects away, so a change to any of them breaks it. In the second version each object answers the one question it has the data for.',
      },
      {
        kind: 'code',
        caption: 'The controller coordinates and creates. Every decision is a question put to an expert.',
        code: `class Library {
  private members = new Map<string, Member>()
  private copies = new Map<string, BookCopy>()
  private loans = new Map<string, Loan>() // by copy

  checkout(memberId: string, copyId: string): Loan {
    const member = this.members.get(memberId)
    const copy = this.copies.get(copyId)
    if (!member || !copy) throw new NotFoundError()
    if (!member.canBorrow()) throw new LoanLimitError()
    if (!copy.isAvailable()) throw new UnavailableError()

    const loan = new Loan(member, copy, addDays(new Date(), 14))
    copy.markOnLoan()
    member.addLoan(loan)
    this.loans.set(copy.id, loan)
    return loan
  }
}`,
      },
      {
        kind: 'prose',
        text: 'Two more of the nine are worth naming. **Pure fabrication**: when no domain object is a good home for a job, invent one, such as a `LoanRepository` or a `FinePolicy`, rather than bloating an entity. **Protected variations**: put an interface where change is expected. That one is the whole of the next lesson.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'I put each rule on the object that owns the data: the loan computes its own fine, the member knows its own limit, and `Library` only coordinates. If `Library` ever starts computing a fine or counting loans itself, that rule is in the wrong place.',
      },
      { kind: 'heading', text: 'Association, aggregation, composition' },
      {
        kind: 'prose',
        text: 'Three kinds of "has", told apart by lifecycle and sharing. In TypeScript or Java all three compile to a field holding a reference, which is why candidates skip the distinction. They should not: it decides who may delete the part, whether a delete cascades, and who else can mutate it.',
      },
      {
        kind: 'table',
        head: ['Relationship', 'Means', 'In code', 'Library'],
        rows: [
          ['**Association**', 'Knows about; independent lifecycles', 'An id or reference, often passed per call', '`Loan` refers to a `BookCopy`'],
          ['**Aggregation**', 'Has, but the part outlives the whole and may be shared', 'Passed in from outside, kept in a field', '`Member` holds active loans; the history keeps them after'],
          ['**Composition**', 'Owns: created by the whole, belongs to it alone, dies with it', 'Created inside; others may refer to it, only the whole adds or removes it', '`Book` owns its copies'],
        ],
      },
      {
        kind: 'figure',
        caption: 'All three in one parking lot: the lot owns floors and spots, a spot only holds a car, and a ticket merely refers to a spot.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'ParkingLot', fields: ['floors: Floor[]'], methods: ['park(vehicle): Ticket'], tone: 'line' },
            { name: 'Floor', fields: ['level: number', 'spots: Spot[]'] },
            { name: 'Spot', fields: ['id', 'size: SpotSize', 'vehicle?: Vehicle'] },
            { name: 'Vehicle', stereotype: 'abstract', fields: ['plate: string'] },
            { name: 'Ticket', fields: ['spotId', 'entryAt: Date'] },
          ],
          relations: [
            { from: 'ParkingLot', to: 'Floor', kind: 'has', label: 'owns (composition)' },
            { from: 'Floor', to: 'Spot', kind: 'has', label: 'owns (composition)' },
            { from: 'Spot', to: 'Vehicle', kind: 'has', label: 'holds (aggregation)' },
            { from: 'Ticket', to: 'Spot', kind: 'uses', label: 'refers to (association)' },
          ],
        },
      },
      {
        kind: 'prose',
        text: 'The test to say out loud: **who creates it, who else owns it, and what happens on delete?** If the whole constructs the part, nothing else owns it, and deleting the whole deletes the part, it is composition. If the part is passed in from outside and lives on afterwards, it is aggregation; if one object merely refers to another, association. [[UML]] draws composition as a filled diamond and aggregation as a hollow one; on a whiteboard, an arrow labelled "owns" or "holds" is clearer than either.',
      },
      { kind: 'heading', text: 'Enums or classes' },
      {
        kind: 'prose',
        text: 'A copy is available, on loan, on hold or lost. Is that an enum, or four classes? Ask whether the variants differ in **data** or in **behaviour**, and who adds the next one.',
      },
      {
        kind: 'figure',
        caption: 'Enum, class or data: decided by what varies, and by who adds the next variant.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Do the variants behave differently, not just carry different values?',
            yes: {
              question: 'Do new variants keep arriving?',
              yes: { answer: 'A class per variant', sub: 'polymorphism, or the State pattern', tone: 'line' },
              no: { answer: 'Enum and one exhaustive switch', sub: 'the compiler checks each case' },
            },
            no: {
              question: 'Does the business add variants without a deploy?',
              yes: { answer: 'Data', sub: 'a tier row with its limits', tone: 'mastered' },
              no: { answer: 'Enum', sub: 'a string literal union' },
            },
          },
        },
      },
      {
        kind: 'prose',
        text: '`CopyStatus` is an enum, written in TypeScript as `\'available\' | \'onLoan\' | \'onHold\' | \'lost\'`: the statuses differ only in name, and the rules about them live on `BookCopy`. Membership tiers (basic, student, premium) differ only in numbers, a loan limit and a loan length, and the library invents new ones every year, so they are data loaded from configuration. The tell that an enum wants to become classes is the same `switch` on it turning up in a second place.',
      },
      { kind: 'heading', text: 'Value objects and entities' },
      {
        kind: 'prose',
        text: 'The last distinction is about identity. An **entity** has an identity that survives change: member 42 who changes their name is still member 42, so entities compare by id and have a lifecycle. A **value object** is defined entirely by its attributes: any £5 is the same as any other £5, so it compares by value, is immutable, and is replaced rather than edited.',
      },
      {
        kind: 'figure',
        caption: 'Entity against value object: an identity that survives change, or attributes that are the identity.',
        figure: {
          kind: 'split',
          left: {
            title: 'Entity',
            tone: 'line',
            nodes: [
              { label: 'Member 42', sub: 'name: Ana', to: 'renamed' },
              { label: 'Member 42', sub: 'name: Ana Lima', tone: 'line' },
            ],
            cost: 'The same object with new state. Compared by id. Has a lifecycle.',
          },
          right: {
            title: 'Value object',
            tone: 'mastered',
            nodes: [
              { label: '£5.00', sub: 'a Money', to: 'plus £2' },
              { label: '£7.00', sub: 'a new Money', tone: 'mastered' },
            ],
            cost: 'Never edited, only replaced. Compared by value. Safe to share.',
          },
        },
      },
      {
        kind: 'code',
        caption: 'A value object: private constructor, validated once, immutable, equal by value. Whole pence, because 0.1 + 0.2 is not 0.3 in floating point.',
        code: `class Money {
  private constructor(
    readonly pence: number,
    readonly currency: string,
  ) {}

  static of(pence: number, currency = 'GBP'): Money {
    if (!Number.isInteger(pence)) throw new Error('whole pence')
    return new Money(pence, currency)
  }

  plus(o: Money): Money {
    if (o.currency !== this.currency) throw new Error('currency')
    return new Money(this.pence + o.pence, this.currency)
  }

  times(n: number): Money {
    return Money.of(this.pence * n, this.currency)
  }

  equals(o: Money): boolean {
    return o.pence === this.pence && o.currency === this.currency
  }
}`,
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Stripe\'s amounts',
        text: 'Stripe\'s [[API]] represents every amount as an integer in the currency\'s smallest unit: `amount: 1099` with `currency: "gbp"` is £10.99. No floating-point amount ever crosses the wire, so no rounding error can either. That is a value-object decision made at the boundary: money is a count of pence plus a currency, never a bare number.',
      },
      {
        kind: 'prose',
        text: 'Why the interviewer cares: value objects remove a class of bugs (nobody can mutate a fine after it is computed), keep validation in one constructor, and, because they never change, can be shared between threads with no locking at all. That last property comes back in the concurrency lesson.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Why is Book separate from BookCopy? One class would be simpler.',
            a: 'They have different data and different lifecycles. The title carries metadata and the reservation queue; each copy carries a barcode, a status and at most one loan. Merge them and you need an `availableCopies` counter that can drift, with nowhere to record which copy is damaged.',
          },
          {
            q: 'Isn\'t Library just a god class with a nicer name?',
            a: 'Only if it starts deciding things. As a controller it receives `checkout`, asks `Member` and `BookCopy` whether the rules allow it, then creates and records the `Loan`. The moment it computes a fine or checks a limit itself, that logic moves to an expert or to a fabricated `LoanPolicy`.',
          },
          {
            q: 'Where does "at most five loans" live?',
            a: 'On `Member` while the number is fixed, because the member holds its loans. When limits start to vary by tier, the number moves to a `Tier` value loaded from configuration and `canBorrow()` reads it from there. The method stays put; only its data source changes.',
          },
          {
            q: 'Is Loan an entity or a value object?',
            a: 'An entity: this particular loan matters, not any loan with the same fields, and it has a lifecycle from open to returned. I would still keep its mutable surface tiny: member, copy and due date read-only, and a single `close(returnedAt)` that can only run once.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-l-modelling-1',
        moduleId: 'l-modelling',
        stem: 'By information expert, which class should compute the late fine on a loan?',
        options: [
          '`Library`, because it coordinates the checkout',
          '`Member`, because the member pays it',
          'A `FineService` that reads the loan\'s fields',
          '`Loan`, because it holds the due date and knows the copy',
        ],
        correct: 3,
        explain:
          'Information expert puts a responsibility on the class that has the data to fulfil it. `Loan` has the due date and knows its copy, which knows its own daily rate. A separate service that reads the loan\'s fields is behaviour far from its data, reaching through other objects to do its job.',
      },
      {
        id: 'q-l-modelling-2',
        moduleId: 'l-modelling',
        stem: 'A `ParkingLot` creates its floors and never shares them. A `Spot` holds a `Vehicle` that later drives away. What are these two relationships?',
        options: [
          'Both are composition',
          'Lot to floor is composition; spot to vehicle is aggregation',
          'Both are aggregation',
          'Lot to floor is aggregation; spot to vehicle is composition',
        ],
        correct: 1,
        explain:
          'Composition means the whole creates the part, the part belongs to it alone, and the part dies with it: the lot and its floors. The vehicle exists before it parks and after it leaves, so the spot only holds it. Getting this backwards means naming arrows rather than thinking about lifecycles.',
      },
      {
        id: 'q-l-modelling-3',
        moduleId: 'l-modelling',
        stem: 'Membership tiers differ only in loan limit and loan length, and the library invents a new tier every year. How should you model them?',
        options: [
          'A subclass of `Member` per tier',
          'An enum, with a `switch` wherever a limit is needed',
          'Data: a `Tier` value with its limits, loaded from configuration',
          'Boolean flags such as `isStudent` on `Member`',
        ],
        correct: 2,
        explain:
          'The tiers differ in numbers, not behaviour, and new ones arrive without engineering being asked. That makes them data. Subclasses earn their place when behaviour differs; an enum forces a deploy for every new tier and scatters switches through the code.',
      },
    ],
    cards: [
      {
        id: 'c-l-modelling-1',
        moduleId: 'l-modelling',
        front: 'Value object or entity: how do you tell?',
        back: 'Ask whether identity survives a change. Member 42 renamed is still member 42: entity. £5 is any £5: value object, immutable, compared by value.',
        tag: 'Modelling',
      },
      {
        id: 'c-l-modelling-2',
        moduleId: 'l-modelling',
        front: 'Which three GRASP principles place most behaviour?',
        back: 'Information expert: the class with the data. Creator: whoever contains or records it. Controller: one thin object receives the operation and delegates.',
        tag: 'GRASP',
      },
      {
        id: 'c-l-modelling-3',
        moduleId: 'l-modelling',
        front: 'Composition or aggregation: what is the test?',
        back: 'Who creates the part, and who else holds it? Created by the whole, belongs to it alone, dies with it: composition. Passed in and outlives the whole: aggregation.',
        tag: 'Relationships',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'l-extension',
    trackId: 'lld',
    title: 'Designing for change',
    station: 3,
    prereqs: ['l-modelling'],
    related: ['p-srp-ocp', 'dp-strategy-state'],
    minutes: 13,
    summary: 'Every design round has a second act. Put the seam where change will come, and nowhere else.',
    objectives: [
      'Replace a `switch` on type with polymorphism, and say when not to',
      'Separate what varies with a type from what varies independently of it',
      'Choose between a subclass, a strategy and plain configuration',
      'Make "add a new vehicle type" one new class and one line',
    ],
    keywords: [
      'open/closed principle',
      'polymorphism',
      'strategy pattern',
      'switch statement',
      'extensibility',
      'expression problem',
      'registry',
      'plugin',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Every low-level design interview has a second act. Ten minutes after your model settles, the interviewer says "now add buses" or "pricing is different at weekends". They are not testing whether you can add buses. They are counting how many existing lines your design forces you to change.',
      },
      {
        kind: 'prose',
        text: 'That count is the open/closed principle made measurable: code should be open to new behaviour and closed to edits. You will not put every seam in the right place, and you should not try. The skill is putting one where the next requirement is likely to land, and keeping everything else plain.',
      },
      {
        kind: 'figure',
        caption: 'Adding a vehicle type, before and after. Count the places the change touches.',
        figure: {
          kind: 'split',
          left: {
            title: 'Switch on type',
            tone: 'alert',
            nodes: [
              { label: 'Add Bus', to: 'then edit' },
              { label: 'fits() switch', tone: 'alert', to: '' },
              { label: 'label() switch', tone: 'alert', to: '' },
              { label: 'receipt() switch', tone: 'alert' },
            ],
            cost: 'Three edits to working code, and a fourth if the report has a switch too.',
          },
          right: {
            title: 'Polymorphism',
            tone: 'mastered',
            nodes: [
              { label: 'Add Bus', to: 'then' },
              { label: 'class Bus', sub: 'a new file', tone: 'mastered', to: '' },
              { label: 'One registry line', tone: 'mastered' },
            ],
            cost: 'One new file and one line. Nothing that already works is touched.',
          },
          verdict: 'The interviewer is grading the left-hand count. Get it down to one new class and one line.',
        },
      },
      { kind: 'heading', text: 'Polymorphism over switch-on-type' },
      {
        kind: 'prose',
        text: 'The smell is a `switch` (or an `if` chain) on a type code, repeated. Each copy is a place the next type has to find. Polymorphism moves each branch into the type it belongs to, so the type carries its own behaviour and callers stop asking what it is.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'A switch per behaviour',
          code: `type Kind = 'motorbike' | 'car' | 'van'

function fits(kind: Kind, spot: SpotSize) {
  switch (kind) {
    case 'motorbike': return true
    case 'car': return spot !== 'small'
    case 'van': return spot === 'large'
  }
}

function label(kind: Kind): string {
  switch (kind) {
    case 'motorbike': return 'Motorbike'
    case 'car': return 'Car'
    case 'van': return 'Van (large bays only)'
  }
}
// …and again in receipts, signage, reports`,
        },
        after: {
          title: 'Behaviour on the type',
          code: `abstract class Vehicle {
  constructor(readonly plate: string) {}
  abstract fits(spot: SpotSize): boolean
  abstract label(): string
}

class Car extends Vehicle {
  fits(s: SpotSize) { return s !== 'small' }
  label() { return 'Car' }
}

// A new type is a new file. Nothing else changes.
class Bus extends Vehicle {
  fits(s: SpotSize) { return s === 'coach' }
  label() { return 'Bus (coach bays only)' }
}`,
        },
        note: 'The switch is not wrong on day one. It becomes wrong at the second copy, because from then on every new type is a hunt through the codebase.',
      },
      { kind: 'heading', text: 'The honest counter-argument' },
      {
        kind: 'prose',
        text: 'Naming the case against polymorphism is a senior signal. Classes make adding a **type** cheap and adding an **operation** expensive: a new operation means a new method on every subclass. A discriminated union with exhaustive `switch`es is the mirror image. A new operation is one new function, and TypeScript\'s `never` check makes the compiler list every switch a new type must update. This trade-off has a name, the expression problem, and the answer depends on which list grows.',
      },
      {
        kind: 'compare',
        left: {
          title: 'A class per type',
          points: [
            'New type: one new class',
            'New operation: edit every class',
            'Right when types keep arriving: vehicles, payment methods, file formats',
          ],
        },
        right: {
          title: 'Union and exhaustive switch',
          points: [
            'New type: the compiler lists every switch to update',
            'New operation: one new function',
            'Right when the set is closed: order statuses, syntax-tree nodes, protocol messages',
          ],
        },
        verdict: 'Pick by which list grows. In a parking lot it is vehicle types, so classes. In a compiler it is passes over a fixed syntax tree, so unions.',
      },
      { kind: 'heading', text: 'Strategy: what varies independently of the type' },
      {
        kind: 'prose',
        text: 'Not every variation belongs on the type. Pricing depends on the vehicle, but also on the lot, the time of day, events and promotions. Put `hourlyRate()` on `Vehicle` and weekend pricing means editing every subclass. When something varies **independently** of your class hierarchy, pull it out behind an interface and inject it.',
      },
      {
        kind: 'figure',
        caption: 'Strategy for pricing: the lot holds an interface, and each pricing rule is a class it is handed.',
        figure: {
          kind: 'classes',
          classes: [
            {
              name: 'PricingStrategy',
              stereotype: 'interface',
              methods: ['fee(ticket, exitAt): Money'],
              tone: 'line',
            },
            { name: 'HourlyPricing', fields: ['perHour: Money'], methods: ['fee(ticket, exitAt): Money'] },
            {
              name: 'EventPricing',
              fields: ['flat: Money', 'window: TimeRange'],
              methods: ['fee(ticket, exitAt): Money'],
            },
            {
              name: 'ParkingLot',
              fields: ['pricing: PricingStrategy'],
              methods: ['park(vehicle): Ticket', 'exit(ticket): Money'],
            },
          ],
          relations: [
            { from: 'HourlyPricing', to: 'PricingStrategy', kind: 'implements' },
            { from: 'EventPricing', to: 'PricingStrategy', kind: 'implements' },
            { from: 'ParkingLot', to: 'PricingStrategy', kind: 'has', label: 'injected' },
          ],
        },
      },
      {
        kind: 'code',
        caption: 'Weekend pricing is now a new class passed to the constructor. ParkingLot does not change.',
        code: `interface PricingStrategy {
  fee(ticket: Ticket, exitAt: Date): Money
}

class HourlyPricing implements PricingStrategy {
  constructor(private perHour: Money) {}

  fee(t: Ticket, exitAt: Date): Money {
    const ms = exitAt.getTime() - t.entryAt.getTime()
    const hours = Math.max(1, Math.ceil(ms / 3_600_000))
    return this.perHour.times(hours)
  }
}

// The lot is told how to price. It never decides.
const lot = new ParkingLot(
  floors,
  new HourlyPricing(Money.of(250)),
)`,
      },
      {
        kind: 'prose',
        text: 'And when the variants differ only in **numbers**, a class per variant is ceremony. Cars at £2.50 an hour and vans at £4 is a table, not a hierarchy. Let configuration hold the numbers and let classes hold the kinds of rule.',
      },
      {
        kind: 'ladder',
        rungs: [
          {
            grade: 'bad',
            title: 'Hard-coded in `exit()`',
            text: '`if (weekend) … else if (van) …` inside the lot. Every pricing change is an edit to the class that also allocates spots.',
          },
          {
            grade: 'good',
            title: 'One switch, in one place',
            text: 'A single `fee()` function owns all pricing. Contained, but each new rule still edits it, and it cannot differ between lots.',
          },
          {
            grade: 'great',
            title: 'A strategy interface, injected',
            text: 'Each rule is a class and the lot is handed one. New rules are new classes, and a test can pass a fixed-price fake.',
          },
          {
            grade: 'best',
            title: 'Strategy for kinds of rule, configuration for numbers',
            text: 'A new rate is a configuration change with no deploy. A new kind of rule (event pricing, a free first hour) is a new class. Each axis changes in exactly one place.',
          },
        ],
      },
      { kind: 'heading', text: 'Extension points, and where to stop' },
      {
        kind: 'prose',
        text: 'Polymorphism still needs one place that knows the full list of types: whatever turns the string "bus" from the entry gate into a `Bus`. Make that place a registry, not another switch.',
      },
      {
        kind: 'code',
        caption: 'The one place that knows every type. A new type is a new class plus one entry here.',
        code: `type MakeVehicle = (plate: string) => Vehicle

const vehicleTypes = new Map<string, MakeVehicle>([
  ['motorbike', (p) => new Motorbike(p)],
  ['car', (p) => new Car(p)],
  ['van', (p) => new Van(p)],
  ['bus', (p) => new Bus(p)], // the one line a new type adds
])

function vehicleFrom(kind: string, plate: string): Vehicle {
  const make = vehicleTypes.get(kind)
  if (!make) throw new UnknownVehicleError(kind)
  return make(plate)
}`,
      },
      {
        kind: 'prose',
        text: 'That is the honest version of "adding a vehicle type touches one file": one new file for the class, and one line in the registry. Self-registering plugins can remove even that line, at the price of magic and import-order bugs. In an interview, the explicit map is easier to defend.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Linux filesystems',
        text: 'Linux supports dozens of filesystems without the `read()` system call knowing any of them. Each filesystem fills in a `file_operations` table of function pointers, its own `read`, `write` and `open`, and announces itself with `register_filesystem()`. Adding a filesystem is a new module; the code every program calls is never edited. That is polymorphism plus a registry, written in C, at the scale of an operating system.',
      },
      {
        kind: 'prose',
        text: 'Then stop. Every seam costs an interface, a level of indirection, and a reader\'s time. Put one where the prompt\'s follow-up is predictable (pricing, spot allocation, an elevator\'s scheduling algorithm) and leave the rest concrete. If the interviewer pushes somewhere you did not anticipate, extracting an interface then, out loud, is a perfectly senior answer.',
      },
      {
        kind: 'figure',
        caption: 'Where a variation goes, decided by what it varies with.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Does behaviour differ by type, and do new types keep arriving?',
            yes: { answer: 'A subclass per type', sub: 'Vehicle → Car, Van, Bus', tone: 'line' },
            no: {
              question: 'Does it vary independently: by lot, time or customer?',
              yes: { answer: 'A strategy, injected', sub: 'PricingStrategy', tone: 'mastered' },
              no: {
                question: 'Do the variants differ only in numbers?',
                yes: { answer: 'Configuration', sub: 'a rate table' },
                no: { answer: 'A plain if', sub: 'until a second case arrives' },
              },
            },
          },
        },
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'I expect pricing and spot allocation to change, so those get interfaces. Vehicle types get a class each, because that list grows. Everything else stays concrete until a requirement says otherwise.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Putting a seam everywhere: an interface for every class, a factory for every constructor, and a `VehicleFactoryProvider` by minute thirty. Abstraction you cannot tie to a likely requirement is cost without benefit, and interviewers mark it down as hard as rigidity. "I used Strategy because pricing varies by lot" is senior. "I used Strategy" is a keyword.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Your Vehicle subclasses have hourlyRate(). The lot now wants weekend pricing. What changes?',
            a: 'That is the sign pricing was on the wrong axis: it varies with time and lot, not only with vehicle. I would move it to a `PricingStrategy` injected into the lot, which can still read the vehicle from the ticket. The subclasses lose a method; nothing else changes shape.',
          },
          {
            q: 'Isn\'t a subclass per vehicle overkill for three types?',
            a: 'If they differ only in size and rate, yes: a `VehicleType` value with those fields, loaded from configuration, is simpler. Subclasses earn their place when behaviour differs, such as a bus that needs two adjacent coach bays. I would start with data and promote to classes when the first real behaviour difference appears.',
          },
          {
            q: 'Can a new type be added without touching even the registry?',
            a: 'Yes, by having each class register itself or by scanning a plugins directory. It removes the line but adds magic: registration depends on a file being imported, and a missing import fails at run time, not compile time. I would keep the explicit map unless third parties ship their own types.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-l-extension-1',
        moduleId: 'l-extension',
        stem: 'Adding a `Bus` type means editing `fits()`, `label()`, the receipt printer and the nightly report. What is the underlying design problem?',
        options: [
          'There are not enough unit tests to catch the missing cases',
          'Behaviour that varies by type is spread across switches instead of living on the type',
          'The vehicle classes have too many fields',
          'The vehicle registry should be a singleton',
        ],
        correct: 1,
        explain:
          'Four edits for one new type is the signature of a repeated switch on type. Moving each branch onto the type makes a new type one class. More tests would catch a missed case, but they would not reduce the number of places you have to edit.',
      },
      {
        id: 'q-l-extension-2',
        moduleId: 'l-extension',
        stem: 'Parking fees will vary by lot, by time of day and by promotion. Where should pricing live?',
        options: [
          'In a `PricingStrategy` interface injected into the lot',
          'In an abstract `fee()` on each `Vehicle` subclass',
          'In a `switch` inside `ParkingLot.exit()`',
          'In a static `Pricing` utility that every class calls',
        ],
        correct: 0,
        explain:
          'Pricing varies independently of vehicle type, so putting it on `Vehicle` means editing every subclass for each new rule. A strategy isolates it: each rule is a class, the lot is handed one, and a test can pass a fake. A static utility is a switch with a different name, and it cannot differ between lots.',
      },
      {
        id: 'q-l-extension-3',
        moduleId: 'l-extension',
        stem: 'In TypeScript, when is a discriminated union with exhaustive switches a better choice than a class per type?',
        options: [
          'When new types arrive often',
          'When each type needs its own private mutable state',
          'Never: classes are always more extensible',
          'When the set of types is closed and new operations over them keep arriving',
        ],
        correct: 3,
        explain:
          'This is the expression problem. Classes make new types cheap and new operations expensive; unions are the reverse, and the `never` check makes the compiler find every switch. Choose by which list grows. "Always classes" is the answer of someone who has only seen one side of it.',
      },
    ],
    cards: [
      {
        id: 'c-l-extension-1',
        moduleId: 'l-extension',
        front: 'Subclass, strategy or configuration: how do you choose?',
        back: 'Behaviour varies with the type: subclass. Varies independently of it: inject a strategy. Only numbers differ: configuration. A single case: a plain if.',
        tag: 'Extension',
      },
      {
        id: 'c-l-extension-2',
        moduleId: 'l-extension',
        front: 'What does the interviewer measure when they add a requirement?',
        back: 'How much working code the change touches. The target is one new class and one registration line, with no edits to existing logic.',
        tag: 'Extension',
      },
      {
        id: 'c-l-extension-3',
        moduleId: 'l-extension',
        front: 'When does a switch on type beat polymorphism?',
        back: 'When the set of types is closed and new operations keep arriving. An exhaustive switch over a union makes the compiler find every case.',
        tag: 'Expression problem',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'l-concurrency',
    trackId: 'lld',
    title: 'Concurrency in object design',
    station: 4,
    prereqs: ['l-extension'],
    related: ['a-contention', 'db-locking', 'dp-builder-singleton'],
    minutes: 15,
    summary: 'Two requests, one parking spot. Find the check-then-act, then make it atomic, locked or optimistic.',
    objectives: [
      'Spot check-then-act races, including the ones an `await` creates',
      'Write a small `Mutex` and choose what it locks',
      'Choose between atomic operations, locks, optimistic retries and immutability',
      'Rule out deadlock with a global lock order',
    ],
    keywords: [
      'race condition',
      'mutex',
      'thread safety',
      'deadlock',
      'optimistic locking',
      'atomic operation',
      'singleton',
      'async',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'The last phase of the round separates senior answers from the rest: "what happens if two drivers try to park in spot 12 at the same moment?" A design that is correct for one user and wrong for two is not correct. Interviewers working in Java, C# or Go expect threads and locks. In TypeScript the same race arrives through concurrent requests.',
      },
      {
        kind: 'prose',
        text: 'JavaScript runs your code on one thread, and no two synchronous lines ever interleave. That rules out data races, where two threads tear a value in half. It does **not** rule out logical races. Every `await` hands control back to the event loop, and another request can run before you resume. Run a second server instance and the two share no memory at all.',
      },
      {
        kind: 'figure',
        caption: 'Check-then-act across an await: both requests see spot 12 free before either one takes it.',
        figure: {
          kind: 'sequence',
          actors: ['Request A', 'Spot 12', 'Request B'],
          steps: [
            { from: 0, to: 1, label: 'isFree()?' },
            { from: 1, to: 0, label: 'yes', dashed: true },
            { from: 0, to: 0, label: 'await payment…' },
            { from: 2, to: 1, label: 'isFree()?' },
            { from: 1, to: 2, label: 'yes', dashed: true },
            { from: 2, to: 2, label: 'await payment…' },
            { from: 0, to: 1, label: 'occupy(car A)', tone: 'streak' },
            { from: 2, to: 1, label: 'occupy(car B)', tone: 'alert' },
            { from: 1, to: 1, label: 'two cars, one spot', tone: 'alert' },
          ],
          note: 'Neither request is wrong on its own. The bug lives in the gap between the check and the act.',
        },
      },
      { kind: 'heading', text: 'The race is check-then-act' },
      {
        kind: 'prose',
        text: 'Almost every concurrency bug in an object design has the same shape: read some state, decide, then act on a decision the state no longer supports. Check the spot is free, then occupy it. Check the balance, then debit it. Check the cache, then load and fill it. Brian Goetz\'s Java Concurrency in Practice calls these compound actions **check-then-act** and **read-modify-write**, and the cure is always to make the compound action one indivisible step.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Check, await, act',
          code: `async park(v: Vehicle, spotId: string) {
  const spot = this.spots.get(spotId)!
  if (!spot.isFree()) throw new SpotTakenError()

  await this.payments.preauthorise(v.owner)

  spot.occupy(v) // B may have taken it meanwhile
  return new Ticket(v.plate, spot.id)
}`,
        },
        after: {
          title: 'Claim first, then await',
          code: `async park(v: Vehicle, spotId: string) {
  const spot = this.spots.get(spotId)!
  // Check and set in one synchronous call.
  if (!spot.tryClaim(v)) throw new SpotTakenError()

  try {
    await this.payments.preauthorise(v.owner)
  } catch (err) {
    spot.release() // compensate, then rethrow
    throw err
  }
  return new Ticket(v.plate, spot.id)
}`,
        },
        note: 'Reordering is the cheapest fix there is: claim synchronously, do the slow work afterwards, and undo the claim if it fails. No lock needed, but it only holds within one process.',
      },
      { kind: 'heading', text: 'Locks, and a small Mutex' },
      {
        kind: 'prose',
        text: 'Sometimes the slow work has to sit inside the critical section: read a balance from a store, check it, write it back, with an `await` at both ends. Reordering cannot help there; you need mutual exclusion. Java has `synchronized` and `ReentrantLock`, Go has `sync.Mutex`. In TypeScript you can build one from a promise chain in a dozen lines.',
      },
      {
        kind: 'code',
        caption: 'Each caller queues behind the one before it: first come, first served, and released even when the work throws.',
        code: `class Mutex {
  private tail: Promise<void> = Promise.resolve()

  async run<T>(critical: () => Promise<T>): Promise<T> {
    const previous = this.tail
    let release!: () => void
    this.tail = new Promise<void>((r) => (release = r))

    await previous // wait for everyone queued before us
    try {
      return await critical()
    } finally {
      release() // even if critical() threw
    }
  }
}`,
      },
      {
        kind: 'code',
        caption: 'One lock per user, not one per wallet. What a lock covers is the ceiling on throughput.',
        code: `class Wallet {
  private locks = new Map<string, Mutex>()

  constructor(private store: BalanceStore) {}

  debit(userId: string, pence: number): Promise<void> {
    return this.lockFor(userId).run(async () => {
      const balance = await this.store.get(userId)
      if (balance < pence) throw new InsufficientFundsError()
      await this.store.set(userId, balance - pence)
    })
  }

  private lockFor(id: string): Mutex {
    let m = this.locks.get(id)
    if (!m) this.locks.set(id, (m = new Mutex()))
    return m
  }
}`,
      },
      {
        kind: 'prose',
        text: 'Two decisions matter more than the code. **Scope**: one lock around the whole wallet makes every user wait for every other; a lock per user only serialises the requests that genuinely conflict (evict idle ones, or the map grows forever). **Duration**: hold it for the read-modify-write and nothing else. Never hold a lock across a call to a payment provider, or anything else that can take seconds.',
      },
      { kind: 'heading', text: 'Atomic operations and immutability' },
      {
        kind: 'prose',
        text: 'A lock is the heavy tool. Two lighter ones remove the need for it.',
      },
      {
        kind: 'list',
        items: [
          '**Atomic operations.** One indivisible step that checks and acts together. Java\'s `AtomicInteger.compareAndSet()`, Redis `INCR` and `SET NX`, and a conditional `UPDATE … WHERE` in [[SQL]] all fold check-then-act into a single operation the platform guarantees. `tryClaim()` above is the in-process version.',
          '**Immutability.** An object that never changes can be shared by any number of threads with no locks. The value objects from the modelling lesson, `Money` and its kind, are already safe. For shared configuration such as the pricing table, build a new immutable copy and swap the reference in one assignment (in Java, through a `volatile` field or an `AtomicReference`), so readers see the old table or the new one, never half of each.',
        ],
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'ConcurrentHashMap.computeIfAbsent',
        text: 'Java\'s `ConcurrentHashMap` makes every single `get` and `put` thread-safe, yet `if (!map.containsKey(k)) map.put(k, load(k))` is still a race: two threads both see the key missing and both load it. That is why the map offers `computeIfAbsent(k, load)`, which performs the check and the insert as one atomic step and calls `load` at most once per key. A thread-safe collection does not make your compound actions thread-safe.',
      },
      { kind: 'heading', text: 'Singletons and lazy initialisation' },
      {
        kind: 'prose',
        text: 'A lazily initialised singleton is check-then-act in disguise: if there is no instance, create one. In Java the naive version builds two instances under contention, and double-checked locking only works if the field is `volatile`. Joshua Bloch\'s advice in Effective Java is simpler: a single-element `enum`, or a static holder class that the class loader initialises exactly once. Go has `sync.Once` for the same job.',
      },
      {
        kind: 'prose',
        text: 'In TypeScript a module-level `const` is evaluated once per process, so it is a singleton for free. The trap is lazy **async** initialisation:',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Two callers, two pools',
          code: `let pool: Pool | undefined

export async function getPool(): Promise<Pool> {
  if (!pool) {
    // Both callers get here before either assigns.
    pool = await createPool(config)
  }
  return pool
}`,
        },
        after: {
          title: 'Cache the promise, not the value',
          code: `let pool: Promise<Pool> | undefined

export function getPool(): Promise<Pool> {
  // Assigned synchronously, so a second caller
  // shares the same in-flight promise.
  pool ??= createPool(config)
  return pool
}`,
        },
        note: 'The first version opens two connection pools when two requests arrive during start-up. The second stores the promise before anything awaits, so every caller shares one. If creation can fail, clear `pool` on rejection so a later call can retry.',
      },
      { kind: 'heading', text: 'Optimistic or pessimistic' },
      {
        kind: 'prose',
        text: 'When the contested state lives in a database, the same choice appears at a larger scale, and it is the version that survives a second server.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Pessimistic: lock, then work',
          points: [
            'Take the lock before reading; everyone else waits',
            'Right when conflicts are frequent and a retry is expensive',
            'Costs throughput, and risks deadlock if locks are held across slow calls',
          ],
        },
        right: {
          title: 'Optimistic: work, then check',
          points: [
            'Write only if the state is still what you read; retry or report on conflict',
            'Right when conflicts are rare: most spots are never contested',
            'Costs retries, which turn into a storm under heavy contention',
          ],
        },
        verdict: 'Booking a specific spot or seat: optimistic, because two drivers rarely want the same bay at the same instant. A counter every request increments: neither, use an atomic increment.',
      },
      {
        kind: 'code',
        caption: 'A conditional write. The database checks and acts in one statement, for every server at once.',
        code: `async function claimSpot(
  db: Db,
  spotId: string,
  plate: string,
): Promise<boolean> {
  const res = await db.query(
    \`UPDATE spots SET plate = $1
      WHERE id = $2 AND plate IS NULL\`,
    [plate, spotId],
  )
  return res.rowCount === 1 // 0 rows: someone else won
}`,
      },
      {
        kind: 'prose',
        text: 'This is optimistic concurrency control, [[OCC]]: no lock is taken, the write states the condition it depends on, and a row count of zero means you lost and should offer the driver another spot. The general form compares a `version` column you read earlier. It is also the answer to "what if this runs on three servers?", because the atomicity now lives where the state lives.',
      },
      { kind: 'heading', text: 'Deadlock and lock ordering' },
      {
        kind: 'prose',
        text: 'Take two locks and you can deadlock. A transfer from account A to B locks A, then B. A simultaneous transfer from B to A locks B, then A. Each holds one lock and waits forever for the other.',
      },
      {
        kind: 'figure',
        caption: 'Two transfers take the same two locks in opposite orders, and each waits on the other forever.',
        figure: {
          kind: 'sequence',
          actors: ['Transfer A→B', 'Lock A', 'Lock B', 'Transfer B→A'],
          steps: [
            { from: 0, to: 1, label: 'acquire', tone: 'mastered' },
            { from: 3, to: 2, label: 'acquire', tone: 'mastered' },
            { from: 0, to: 2, label: 'acquire… waits', tone: 'alert' },
            { from: 3, to: 1, label: 'acquire… waits', tone: 'alert' },
            { from: 0, to: 0, label: 'blocked forever', tone: 'alert' },
            { from: 3, to: 3, label: 'blocked forever', tone: 'alert' },
          ],
          note: 'A cycle of waiters. Break the cycle and deadlock cannot happen.',
        },
      },
      {
        kind: 'prose',
        text: 'Deadlock needs four conditions at once: exclusive locks, holding one lock while waiting for another, no way to take a lock away, and a cycle of waiters. Remove any one and it cannot happen. The practical one to remove is the cycle: **acquire locks in one global order**, such as ascending id, and no cycle can form.',
      },
      {
        kind: 'code',
        caption: 'A global order removes the cycle. The guard matters too: this Mutex is not re-entrant, so locking one account twice would deadlock on itself.',
        code: `async function transfer(from: Account, to: Account, amt: Money) {
  if (from.id === to.id) throw new SameAccountError()
  // Lower id first, whichever way the money moves.
  const [first, second] =
    from.id < to.id ? [from, to] : [to, from]

  await first.lock.run(() =>
    second.lock.run(async () => {
      await from.debit(amt)
      await to.credit(amt)
    }),
  )
}`,
      },
      {
        kind: 'prose',
        text: 'Add a timeout as a backstop, as Java\'s `tryLock(timeout)` allows, and log loudly when it fires. A timeout that silently hides a lock-order bug only turns a hang into a mystery.',
      },
      {
        kind: 'figure',
        caption: 'Which tool for a race, cheapest first.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Can the check and the act be one step?',
            yes: { answer: 'Make it atomic', sub: 'tryClaim(), INCR, a conditional UPDATE', tone: 'mastered' },
            no: {
              question: 'Is the state shared across processes?',
              yes: { answer: 'Lock or condition where the state lives', sub: 'the database, or Redis with an expiry', tone: 'line' },
              no: {
                question: 'Are conflicts frequent?',
                yes: { answer: 'Pessimistic: a Mutex', sub: 'per key, held briefly' },
                no: { answer: 'Optimistic: check and retry', sub: 'a version or a condition' },
              },
            },
          },
        },
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'The race here is check-then-act. I will make the claim one atomic step, `tryClaim()` in memory or a conditional update in the database, then do the slow work like payment afterwards, releasing the claim if it fails.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: '"Node is single-threaded, so there are no races." There are no data races; there are plenty of logical ones. Every `await` is a point where another request runs, and the moment you deploy a second instance, in-memory locks protect nothing. Say which of the two your fix covers.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'This runs on three servers behind a load balancer. Does your Mutex still work?',
            a: 'No. It serialises callers within one process, and the other two servers have their own. The atomicity has to move to where the state lives: a conditional update or a unique constraint in the database, or a Redis `SET NX` with an expiry. The in-process lock can stay as an optimisation that cuts contention before it reaches the database.',
          },
          {
            q: 'What if the process crashes after claiming the spot but before payment completes?',
            a: 'The `catch` never runs, so the spot stays claimed forever. Give the claim an expiry: store `claimedUntil` and treat expired claims as free, or use a key with a [[TTL]]. A crash then costs one spot for a few minutes, not until somebody notices.',
          },
          {
            q: 'How would you make the LRU cache thread-safe?',
            a: 'One lock around both `get` and `put`. A read-write lock buys nothing, because a `get` in an [[LRU]] cache moves the entry to the front of the recency list, so every read is a write. Under heavy load, stripe the cache into N segments with a lock each, which is how Guava\'s cache and the original `ConcurrentHashMap` scaled.',
          },
          {
            q: 'Why not make everything immutable?',
            a: 'Because something has to change: a spot really does become occupied. Immutability is the default for values and configuration, so most of the model needs no locks, and the mutable state shrinks to a few entities you guard deliberately. Fewer places to get concurrency wrong is the real goal.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-l-concurrency-1',
        moduleId: 'l-concurrency',
        stem: 'Inside one Node.js process, when can two requests interleave partway through `park()`?',
        options: [
          'Never, because JavaScript is single-threaded',
          'Between any two lines of code',
          'At an `await`, or anywhere else the method yields',
          'Only when worker threads are enabled',
        ],
        correct: 2,
        explain:
          'Synchronous code runs to completion, so two plain lines never interleave. Each `await` returns control to the event loop, and another request can run before you resume. "Never" confuses the absence of data races with the absence of logical ones.',
      },
      {
        id: 'q-l-concurrency-2',
        moduleId: 'l-concurrency',
        stem: 'An [[LRU]] cache is read a hundred times for every write. Why does a read-write lock not help?',
        options: [
          'A `get` moves the entry to the front of the recency list, so every read is a write',
          'Read-write locks are always slower than a plain mutex',
          'Reads can never run concurrently on the same object',
          'Eviction only happens during reads',
        ],
        correct: 0,
        explain:
          'A read-write lock pays off when reads leave state untouched. In an LRU cache they do not: every hit reorders the list. The fixes are a single lock, or striping the cache into independently locked segments.',
      },
      {
        id: 'q-l-concurrency-3',
        moduleId: 'l-concurrency',
        stem: 'Transfer 1 locks account A, then B. Transfer 2 locks B, then A. Both hang. What is the standard fix?',
        options: [
          'Retry each transfer until it succeeds',
          'Acquire locks in one global order, such as ascending account id',
          'Run each transfer on its own thread',
          'Make the account objects immutable',
        ],
        correct: 1,
        explain:
          'Deadlock needs a cycle of waiters, and a global order makes a cycle impossible: both transfers lock A first. Retrying without changing the order can deadlock again, and more threads only add more waiters to the same cycle.',
      },
    ],
    cards: [
      {
        id: 'c-l-concurrency-1',
        moduleId: 'l-concurrency',
        front: 'How can single-threaded Node.js still have race conditions?',
        back: 'Every await yields to other requests, so check-then-act across an await interleaves. And two server instances share no memory at all.',
        tag: 'Races',
      },
      {
        id: 'c-l-concurrency-2',
        moduleId: 'l-concurrency',
        front: 'Optimistic or pessimistic locking: when is each right?',
        back: 'Pessimistic when conflicts are frequent and retries costly. Optimistic, a conditional write plus retry, when conflicts are rare. A hot counter wants an atomic increment.',
        tag: 'Locking',
      },
      {
        id: 'c-l-concurrency-3',
        moduleId: 'l-concurrency',
        front: 'How do you rule out deadlock between two locks?',
        back: 'Acquire them in one global order, such as ascending id, so no cycle of waiters can form. A timeout is only a backstop.',
        tag: 'Deadlock',
      },
    ],
  },
]
