import type { Problem } from '../types'

export const lldLibrary: Problem = {
  id: 'lld-library',
  title: 'Design a library management system',
  kind: 'lld',
  category: 'lld-systems',
  difficulty: 'medium',
  brief:
    'Design the system a public library uses to lend books. Members search the catalogue, borrow, return and reserve books, and pay fines when they are late.',
  patterns: ['observer', 'strategy'],
  suggests: ['l-modelling', 'dp-observer', 'dp-strategy-state', 'p-srp-ocp', 'l-concurrency'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Separated the catalogue record (book) from the physical copy' },
    { id: 'r2', bar: 'must', criterion: 'Attached loans to copies and holds to titles, and said why' },
    { id: 'r3', bar: 'must', criterion: 'Enforced the borrowing limit and the fine threshold at checkout' },
    { id: 'r4', bar: 'must', criterion: 'Sent a returned copy to the first hold in the queue before the open shelf' },
    { id: 'r5', bar: 'senior', criterion: 'Made fines a strategy per member type, in integer money with a cap' },
    { id: 'r6', bar: 'senior', criterion: 'Published domain events and let notifiers subscribe instead of calling email and SMS directly' },
    { id: 'r7', bar: 'senior', criterion: 'Expired uncollected holds with an idempotent scheduled job' },
    { id: 'r8', bar: 'senior', criterion: 'Kept loans as history instead of deleting them on return' },
    { id: 'r9', bar: 'staff', criterion: 'Found the return-versus-hold race and locked the title the rule lives on' },
    { id: 'r10', bar: 'staff', criterion: 'Published notifications only after the return was committed' },
    { id: 'r11', bar: 'staff', criterion: 'Kept search behind its own interface as a separate read model' },
  ],
  followups: [
    {
      q: 'A member wants a hold on one specific copy: a signed first edition.',
      a: 'Then a hold targets either a book or a copy. Give `Hold` a target that is one or the other, and have check-in look for holds on this exact copy before holds on its book. Koha supports both kinds, and the queue logic is the only code that changes.',
    },
    {
      q: 'Add e-books with a licence for three simultaneous loans.',
      a: 'A licence seat is a copy with no barcode: three `BookCopy` rows in a digital format, so loans, holds and the queue work unchanged. What differs is return: an e-book loan simply expires at its due date, so it can never be late, which is a fine policy that always returns zero plus a job that closes loans on time. Publishers often license e-books for a fixed number of loans, which is a counter on the copy.',
    },
    {
      q: 'How do reminders work: "your book is due in two days"?',
      a: 'A daily job finds loans due in two days and publishes a `due-soon` event for each; the notifiers do the rest. Record which reminders were sent, so a rerun after a crash does not message everyone twice. The lending service never knows reminders exist.',
    },
    {
      q: 'Fifty branches, one catalogue. What changes?',
      a: 'Copies gain a home branch and a current location, and a hold gains a pickup branch, so a return at one branch can send the copy to another before it reaches a hold shelf. That adds an `in-transit` status to the copy\'s lifecycle. The book-versus-copy split is what makes this a small change rather than a rewrite.',
    },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'prose',
      text: 'Library systems look like forms over a database and are graded on modelling. The first thing to get right is the one most candidates miss: **a book is not a thing on a shelf.**',
    },
    {
      kind: 'list',
      items: [
        'Search the catalogue by title, author or subject.',
        'Members borrow copies, up to 5 at a time, for 21 days, and may renew once if nobody is waiting.',
        'When every copy is out, members place a hold on the title. The first in line is notified when a copy comes back and has 3 days to collect it.',
        'Late returns cost 25 cents a day, capped at $10. A member owing more than $5 cannot borrow.',
        'Out of scope: buying stock, inter-library loans, the payment provider.',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional: correctness before speed. **Two members must never be lent the same copy, and the hold queue must be fair.** Notifications are asynchronous and must never hold up a checkout desk. Fine rules differ by member type and will change.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: '"I will separate the title from the physical copy. `Book` is the catalogue entry, `BookCopy` is the thing with a barcode. Loans attach to one and holds to the other, and that is most of the design."',
    },

    { kind: 'heading', text: 'Core objects' },
    {
      kind: 'list',
      items: [
        '`Book`: the catalogue record. [[ISBN]], title, authors, subjects, and the queue of holds. One per edition and format.',
        '`BookCopy`: one physical item. A barcode, a status, a shelf location. Many per book.',
        '`Member`: a card number, a type (adult, child, staff), active loans and money owed.',
        '`Loan`: a member, a copy, a due date, a return date. A record that outlives the return.',
        '`Hold`: a member waiting for a **book**, not a copy, because any copy will do.',
        '`FinePolicy`: turns a late loan into money, per member type.',
      ],
    },
    {
      kind: 'figure',
      caption: 'A copy\'s lifecycle: every return checks the hold queue before the copy goes back on the shelf.',
      figure: {
        kind: 'cycle',
        steps: [
          { label: 'Available', sub: 'on the open shelf' },
          { label: 'On loan', sub: 'due in 21 days' },
          { label: 'Returned', sub: 'is anyone waiting?' },
          { label: 'On the hold shelf', sub: '3 days to collect' },
        ],
        note: 'A hold not collected in time passes to the next member, or the copy goes back to available. Lost copies leave the loop but are never deleted.',
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Putting `status` and `dueDate` on `Book`. It works until the library buys a second copy, and then every field on the title is wrong for one of them.',
    },

    { kind: 'heading', text: 'Classes and relationships' },
    {
      kind: 'figure',
      caption: 'Holds hang off the title and loans off the copy. The lending service is the one place that changes both.',
      figure: {
        kind: 'classes',
        classes: [
          { name: 'Book', fields: ['isbn: string', 'title: string', 'holds: Hold[]'], tone: 'line' },
          { name: 'BookCopy', fields: ['barcode: string', 'book: Book', 'status: CopyStatus', 'heldFor?: Member'] },
          {
            name: 'Member',
            fields: ['card: string', 'type: MemberType', 'loans: Loan[]', 'owes: Money'],
            methods: ['canBorrow(): boolean'],
          },
          { name: 'Loan', fields: ['copy: BookCopy', 'member: Member', 'due: Date', 'returnedAt?: Date'] },
          {
            name: 'LendingService',
            fields: ['fines: Record<MemberType, FinePolicy>', 'events: EventBus'],
            methods: ['checkOut(member, barcode): Loan', 'checkIn(barcode): void', 'renew(loanId): Loan', 'placeHold(member, isbn): Hold'],
          },
        ],
        relations: [
          { from: 'Book', to: 'BookCopy', kind: 'has', label: '1..*' },
          { from: 'Loan', to: 'BookCopy', kind: 'has' },
          { from: 'Member', to: 'Loan', kind: 'has', label: 'active' },
          { from: 'LendingService', to: 'Loan', kind: 'uses', label: 'opens, closes' },
        ],
        note: 'FinePolicy and EventBus are interfaces injected into the service. Hold is a small record: member, placed at, and what it is waiting for.',
      },
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Real library systems are built this way. Koha, the open-source system run by libraries around the world, keeps bibliographic records and item records in separate tables, and supports holds on a title or on one specific item.',
    },

    { kind: 'heading', text: 'Key methods' },
    {
      kind: 'code',
      caption: 'The service\'s surface, and the two seams that change.',
      code: `type Money = number // integer cents
type CopyStatus =
  'available' | 'on-loan' | 'on-hold-shelf' | 'lost'

interface FinePolicy {
  fine(loan: Loan, returnedOn: Date): Money
}

interface Catalogue {
  search(q: string, limit: number): Book[]
}

interface LendingService {
  checkOut(member: Member, barcode: string): Loan
  checkIn(barcode: string): void
  renew(loanId: string): Loan
  placeHold(member: Member, isbn: string): Hold
}`,
    },
    {
      kind: 'code',
      caption: 'Check-in closes the loan, prices it, and serves the queue first, under the title\'s lock.',
      code: `checkIn(barcode: string): void {
  const copy = this.copies.get(barcode)
  const loan = this.loans.activeFor(barcode)
  if (!copy || !loan) throw new NotOnLoanError(barcode)

  this.locks.forTitle(copy.book.isbn).run(() => {
    const today = this.clock()
    loan.returnedAt = today // closed, never deleted
    const owed = this.fines[loan.member.type].fine(loan, today)
    if (owed > 0) loan.member.charge(owed, loan)

    const next = copy.book.holds.shift() // first in line
    if (next) {
      copy.status = 'on-hold-shelf'
      copy.heldFor = next.member
      this.events.publish({ type: 'hold-ready',
        to: next.member, copy, until: addDays(today, 3) })
    } else {
      copy.status = 'available'
    }
  })
}`,
    },
    {
      kind: 'prose',
      text: 'Search is its own read model behind `Catalogue`. A public library\'s catalogue runs to hundreds of thousands of titles, which a Postgres full-text index handles comfortably. Move to Elasticsearch when fuzzy matching and relevance tuning outgrow it, and nothing else in the design notices.',
    },

    { kind: 'heading', text: 'Patterns and extensibility' },
    {
      kind: 'prose',
      text: 'Two seams carry the change. **Observer** for notifications: a hold becoming ready, a loan nearly due, a loan overdue. Members want email, [[SMS]] or a push notification, and the list of channels grows, so the lending service publishes an event and channels subscribe. **Strategy** for fines, because children pay nothing, staff are exempt, and the rules will change at the next budget meeting.',
    },
    {
      kind: 'codeCompare',
      before: {
        title: 'The service calls every channel',
        code: `checkIn(barcode: string): void {
  // ...close the loan, take the next hold...
  if (next) {
    const m = next.member
    this.email.send(m.email, 'Your book is ready', body)
    if (m.phone) this.sms.send(m.phone, shortBody)
    if (m.pushToken) this.push.send(m.pushToken, body)
  }
}
// a new channel edits checkIn(), and a slow
// mail server holds up the checkout desk`,
      },
      after: {
        title: 'Publish an event; channels subscribe',
        code: `type LibraryEvent =
  | { type: 'hold-ready'; to: Member; copy: BookCopy; until: Date }
  | { type: 'due-soon'; loan: Loan }
  | { type: 'overdue'; loan: Loan }

interface Subscriber { on(e: LibraryEvent): void }

class EmailNotifier implements Subscriber {
  constructor(private queue: MailQueue) {}
  on(e: LibraryEvent): void {
    if (e.type === 'hold-ready') this.queue.add(holdEmail(e))
  }
}

events.subscribe(new EmailNotifier(mailQueue))
events.subscribe(new SmsNotifier(smsQueue))`,
      },
      note: 'Publish after the return is committed, not before, or a rolled-back return still tells someone their book is waiting. An outbox table written in the same transaction is the robust version.',
    },
    {
      kind: 'code',
      caption: 'Fines as a strategy chosen by member type.',
      code: `class PerDayCapped implements FinePolicy {
  constructor(private perDay: Money, private cap: Money) {}
  fine(loan: Loan, returnedOn: Date): Money {
    const late = daysBetween(loan.due, returnedOn)
    if (late <= 0) return 0
    return Math.min(late * this.perDay, this.cap)
  }
}

const noFines: FinePolicy = { fine: () => 0 }

const finesByType: Record<MemberType, FinePolicy> = {
  adult: new PerDayCapped(25, 1_000),
  child: noFines,
  staff: noFines,
}`,
    },
    {
      kind: 'prose',
      text: 'Copy status is a small state machine too, but with four states and no behaviour of their own, a transition table checked in one place beats a class per state. Reach for the state pattern when states carry behaviour, not merely names.',
    },

    { kind: 'heading', text: 'Concurrency and edge cases' },
    {
      kind: 'prose',
      text: 'The rule "no copy sits on the open shelf while someone is waiting for the title" spans two operations: a return deciding where its copy goes, and a hold deciding whether it needs to queue. Each checks the other\'s half, then acts, and interleaved they reach a state neither order allows:',
    },
    {
      kind: 'figure',
      caption: 'A return and a hold interleave: the copy goes to the open shelf while Ben is queued for it.',
      figure: {
        kind: 'sequence',
        actors: ['Return desk', 'Lending service', 'Ben'],
        steps: [
          { from: 0, to: 1, label: 'check in copy 0042' },
          { from: 1, to: 1, label: 'holds on the title? none' },
          { from: 2, to: 1, label: 'place a hold' },
          { from: 1, to: 1, label: 'any copy available? no' },
          { from: 1, to: 1, label: 'Ben queued', tone: 'alert' },
          { from: 1, to: 1, label: 'copy 0042 to the open shelf', tone: 'alert' },
          { from: 1, to: 2, label: 'you are first in line', dashed: true },
        ],
        note: 'Return first, Ben finds a copy on the shelf. Hold first, the return goes to his hold shelf. Interleaved, he waits for a copy someone else can walk off with.',
      },
    },
    {
      kind: 'prose',
      text: 'Lock where the invariant lives. `checkIn`, `placeHold` and `renew` all take the same per-title lock, so each sees the others\' results, and two renewals cannot both pass the once-only check. In Postgres that is `SELECT … FOR UPDATE` on the book row at the start of each of those transactions, or a version column on the book that every one of them checks and bumps. Checkout is a conditional update on the copy\'s status, so a copy wrongly reshelved can still never be lent twice.',
    },
    {
      kind: 'code',
      caption: 'Same lock as checkIn, because the rule spans both.',
      code: `placeHold(member: Member, isbn: string): Hold {
  const book = this.books.get(isbn)
  return this.locks.forTitle(isbn).run(() => {
    const free = book.copies.find((c) => c.status === 'available')
    if (free) throw new CopyOnShelfError(free.barcode)
    const hold = { member, book, placedAt: this.clock() }
    book.holds.push(hold)
    return hold
  })
}`,
    },
    {
      kind: 'list',
      items: [
        '**Uncollected holds.** After 3 days the copy passes to the next hold, or back to available. That needs a daily job, written to be idempotent so a rerun changes nothing.',
        '**A member with a hold borrows another copy at the desk.** Cancel their hold in the same operation, or the next returned copy sits on the hold shelf for someone who already has the book.',
        '**Lost copies.** Charge the replacement cost instead of the daily fine, and take the copy out of circulation without deleting it: loans still reference it.',
        '**Fines are computed, not accrued.** Derive what is owed from the loan and the clock whenever it is needed, and record a charge once, when the loan closes. A nightly job adding to a balance is one double run away from charging twice.',
        '**Leaving members.** Members with loans cannot be deleted, only deactivated, and loan history is kept only as long as the retention policy allows ([[GDPR]] in Europe).',
      ],
    },
  ],
}
