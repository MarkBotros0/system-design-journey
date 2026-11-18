import type { Problem } from '../types'

export const lldParkingLot: Problem = {
  id: 'lld-parking-lot',
  title: 'Design a parking lot',
  kind: 'lld',
  category: 'lld-systems',
  difficulty: 'easy',
  brief:
    'Design the software for a multi-level parking lot. Vehicles come in different sizes, drivers take a ticket on the way in and pay on the way out.',
  patterns: ['strategy', 'decorator'],
  suggests: ['l-round', 'l-modelling', 'dp-strategy-state', 'dp-decorator-composite', 'l-concurrency'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Pinned down vehicle sizes, spot sizes and the fit rule before drawing classes' },
    { id: 'r2', bar: 'must', criterion: 'Modelled lot, level, spot and ticket with a clear owner for each piece of state' },
    { id: 'r3', bar: 'must', criterion: 'Used enums for sizes instead of a subclass per vehicle type' },
    { id: 'r4', bar: 'must', criterion: 'Computed fees in integer money through an injected pricing strategy' },
    { id: 'r5', bar: 'senior', criterion: 'Found spots from per-size free lists instead of scanning every spot' },
    { id: 'r6', bar: 'senior', criterion: 'Named check-then-act at assignment and made claiming a spot one atomic step' },
    { id: 'r7', bar: 'senior', criterion: 'Added a daily cap without editing the existing pricing code' },
    { id: 'r8', bar: 'senior', criterion: 'Handled a lost ticket, a failed payment and a full lot explicitly' },
    { id: 'r9', bar: 'staff', criterion: 'Guarded against a double release putting one spot in the free list twice' },
    { id: 'r10', bar: 'staff', criterion: 'Showed how claiming becomes a conditional update once state lives in a database' },
    { id: 'r11', bar: 'staff', criterion: 'Treated the spot-search order as a policy that can become its own strategy' },
  ],
  followups: [
    {
      q: 'How would you add charging spots for electric cars?',
      a: 'A charging spot is a size plus a capability, so give `ParkingSpot` a `features` set rather than inventing a new size, and give electric vehicles a preference order that tries charging spots first. Charging is billed separately, which is one more strategy composed with the parking fee. What you must not do is add `ChargingCompactSpot` and `ChargingLargeSpot` classes: that is the combinatorial explosion composition exists to prevent.',
    },
    {
      q: 'A bus needs five large spots in a row. What changes?',
      a: 'Claiming stops being a pop from a free list and becomes a search for a contiguous run, so the level keeps its large spots in row order and claims the whole run under the same lock. Buses are rare, so a linear scan of one row is fine. Keep it off the common path: cars still pop from free lists.',
    },
    {
      q: 'Now it is 300 parking lots in one app, with reservations.',
      a: 'State moves to a database and the lock becomes a conditional write: claim a spot with an update that only succeeds if it is still free, and hold a reservation with an expiry, exactly as a ticketing system holds a seat. The classes survive the move, because `Level.claim` keeps its signature and gains a repository behind it. That is the payoff of putting assignment behind one method.',
    },
    {
      q: 'How do you test the daily cap without waiting a day?',
      a: 'Inject the clock. `ParkingLot` takes a `() => Date`, pricing receives the exit time as an argument, and the test issues a ticket 25 hours in the past. Nothing in the domain calls `new Date()` directly, so every time rule is a fast, deterministic test.',
    },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'prose',
      text: 'This is the warm-up of low-level design questions, which is exactly why it is graded on structure. Spend the first five minutes pinning the rules down, because every one of them turns into a class or a method.',
    },
    {
      kind: 'list',
      items: [
        'A vehicle arrives at an entrance and gets a ticket for a spot that fits it, or is turned away when nothing fits.',
        'Three vehicle sizes (motorcycle, car, van) and three spot sizes (small, compact, large). A vehicle may take a bigger spot than it needs, never a smaller one.',
        'At an exit the driver pays a fee computed from the ticket. Pricing rules change: hourly, a daily cap, a flat evening rate.',
        'The entrance shows how many spots of each size are free on each level.',
        'Out of scope: reservations, the payment processor itself, number-plate recognition.',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional: several entrances and exits run at once, so **assignment must never hand one spot to two vehicles**. In a lot of, say, 2,000 spots, finding one must not mean scanning them all on every arrival. Pricing must be testable without waiting an hour.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: '"Can a car park in a large spot?" Ask it before you draw anything. The answer is the fit rule, and the fit rule decides whether you need one free list or one per size.',
    },

    { kind: 'heading', text: 'Core objects' },
    {
      kind: 'list',
      items: [
        '`ParkingLot`: the entry point. A vehicle in, a ticket out; a ticket in, a fee out.',
        '`Level`: owns its spots and the free lists. Assignment happens here, so the lock lives here too.',
        '`ParkingSpot`: an id, a size, and the level it is on, so an exit knows where to release it.',
        '`Ticket`: plate, spot, entry time. Immutable once issued.',
        '`PricingStrategy`: turns a ticket and an exit time into money.',
        '`VehicleSize` and `SpotSize`: **enums, not classes**.',
      ],
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: '`Car extends Vehicle`, `Van extends Vehicle`, `Motorcycle extends Vehicle`, each with no behaviour of its own, is an enum wearing a class hierarchy. Interviewers see it constantly. Model variation as data until some behaviour actually differs.',
    },

    { kind: 'heading', text: 'Classes and relationships' },
    {
      kind: 'figure',
      caption: 'The lot coordinates, each level owns assignment, and pricing is injected behind an interface.',
      figure: {
        kind: 'classes',
        classes: [
          {
            name: 'PricingStrategy',
            stereotype: 'interface',
            methods: ['fee(t: Ticket, exitAt: Date): Money'],
            tone: 'line',
          },
          {
            name: 'ParkingLot',
            fields: ['levels: Level[]', 'pricing: PricingStrategy', 'active: Map<string, Ticket>'],
            methods: ['park(v: Vehicle): Ticket', 'exit(ticketId, payment): void'],
          },
          {
            name: 'Level',
            fields: ['free: Map<SpotSize, ParkingSpot[]>'],
            methods: ['claim(size): ParkingSpot | null', 'release(spot): void', 'freeCount(size): number'],
          },
          { name: 'ParkingSpot', fields: ['id: string', 'size: SpotSize', 'level: number'] },
          { name: 'Ticket', fields: ['id: string', 'plate: string', 'spot: ParkingSpot', 'enteredAt: Date'] },
        ],
        relations: [
          { from: 'ParkingLot', to: 'Level', kind: 'has', label: '1..*' },
          { from: 'Level', to: 'ParkingSpot', kind: 'has', label: 'free lists by size' },
          { from: 'ParkingLot', to: 'PricingStrategy', kind: 'has', label: 'injected' },
          { from: 'ParkingLot', to: 'Ticket', kind: 'uses', label: 'issues' },
          { from: 'Ticket', to: 'ParkingSpot', kind: 'has' },
        ],
        note: 'HourlyRate, EveningFlat and DailyCap implement PricingStrategy. Vehicle size is an enum, not a subclass.',
      },
    },
    {
      kind: 'prose',
      text: 'Why does the level own the free lists rather than the lot? Because it is the **unit of locking**. Two entrances claiming on different levels never contend, and each critical section is a single pop. The lot keeps active tickets by id, so an exit validates the ticket it is handed rather than trusting it.',
    },

    { kind: 'heading', text: 'Key methods' },
    {
      kind: 'code',
      caption: 'The fit rule is data. Order matters: smallest spot first.',
      code: `type Money = number // integer cents, never a float

enum SpotSize { Small, Compact, Large }
enum VehicleSize { Motorcycle, Car, Van }

const FITS: Record<VehicleSize, SpotSize[]> = {
  [VehicleSize.Motorcycle]: [
    SpotSize.Small, SpotSize.Compact, SpotSize.Large,
  ],
  [VehicleSize.Car]: [SpotSize.Compact, SpotSize.Large],
  [VehicleSize.Van]: [SpotSize.Large],
}

interface PricingStrategy {
  fee(ticket: Ticket, exitAt: Date): Money
}`,
    },
    {
      kind: 'code',
      caption: 'Claiming is check-and-take in one critical section.',
      code: `class ParkingLot {
  park(v: Vehicle): Ticket {
    for (const size of FITS[v.size]) {
      for (const level of this.levels) {
        const spot = level.claim(size)
        if (spot) return this.issue(v.plate, spot)
      }
    }
    throw new LotFullError(v.size)
  }
}

class Level {
  private free = new Map<SpotSize, ParkingSpot[]>()
  private lock = new Mutex()

  claim(size: SpotSize): ParkingSpot | null {
    return this.lock.run(() => this.free.get(size)?.pop() ?? null)
  }

  release(spot: ParkingSpot): void {
    this.lock.run(() => this.free.get(spot.size)!.push(spot))
  }
}`,
    },
    {
      kind: 'prose',
      text: '`Mutex.run` stands in for `synchronized` in Java or a `sync.Mutex` in Go. In single-threaded Node the same race comes back the moment an `await` sits between checking a spot and taking it, so the shape of the answer does not change with the language.',
    },

    { kind: 'heading', text: 'Patterns and extensibility' },
    {
      kind: 'prose',
      text: 'Pricing is where the requirements change mid-interview. The interviewer is waiting to say "now add a daily cap", and the right response is a new class, not a new branch.',
    },
    {
      kind: 'codeCompare',
      before: {
        title: 'A branch per rule',
        code: `fee(t: Ticket, exitAt: Date): Money {
  const hours = Math.ceil(hoursBetween(t.enteredAt, exitAt))
  if (isEvening(t.enteredAt)) return 800
  const rate = t.spot.size === SpotSize.Large ? 400 : 300
  return Math.min(hours * rate, 2400)
}
// next: weekends, a grace period, lost tickets,
// each one another branch in this method`,
      },
      after: {
        title: 'Strategies that compose',
        code: `class HourlyRate implements PricingStrategy {
  constructor(private perHour: Record<SpotSize, Money>) {}
  fee(t: Ticket, exitAt: Date): Money {
    const hours = Math.ceil(hoursBetween(t.enteredAt, exitAt))
    return hours * this.perHour[t.spot.size]
  }
}

class DailyCap implements PricingStrategy {
  constructor(private inner: PricingStrategy,
              private cap: Money) {}
  // Each full 24 hours costs at most the cap, and so does the rest.
  fee(t: Ticket, exitAt: Date): Money {
    const days = Math.floor(hoursBetween(t.enteredAt, exitAt) / 24)
    const tail = { ...t, enteredAt: addHours(t.enteredAt, days * 24) }
    const rest = Math.min(this.inner.fee(tail, exitAt), this.cap)
    const capped = days * this.cap + rest
    return Math.min(this.inner.fee(t, exitAt), capped)
  }
}`,
      },
      note: '`new DailyCap(new HourlyRate(rates), 2400)`. The cap is a decorator over any strategy, so "evening rate, capped" needs no new code.',
    },
    {
      kind: 'prose',
      text: 'The same move applies to choosing a spot. `park()` walks sizes before levels, which means the smallest fit anywhere beats the nearest level. That loop order is a **policy**. When the operator wants nearest-level-first, or wants large spots kept free for vans on weekdays, the loop becomes a `SpotSelector` strategy and `ParkingLot` stops knowing the rule.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: '`ParkingLot.getInstance()` is the other reflex. It buys nothing, since there is one lot because you constructed one, and it makes every test share state. Construct it once at the edge of the program and pass it in.',
    },

    { kind: 'heading', text: 'Concurrency and edge cases' },
    {
      kind: 'prose',
      text: 'Two entrances, one free compact spot. The bug is **check-then-act**: each gate asks whether the spot is free, both hear yes, both issue a ticket.',
    },
    {
      kind: 'figure',
      caption: 'Check-then-act across two gates: both see the spot free, both take it.',
      figure: {
        kind: 'sequence',
        actors: ['Gate A', 'Level 1', 'Gate B'],
        steps: [
          { from: 0, to: 1, label: 'is C-14 free?' },
          { from: 1, to: 0, label: 'yes', dashed: true },
          { from: 2, to: 1, label: 'is C-14 free?' },
          { from: 1, to: 2, label: 'yes', dashed: true },
          { from: 0, to: 1, label: 'take C-14' },
          { from: 2, to: 1, label: 'take C-14', tone: 'alert' },
          { from: 1, to: 1, label: 'two tickets, one spot', tone: 'alert' },
        ],
        note: 'The fix makes check and take one call: claim() pops under the level lock, so Gate B gets the next spot or null.',
      },
    },
    {
      kind: 'prose',
      text: 'A lock per level keeps the critical section to one pop, and a lock-free queue such as Java\'s `ConcurrentLinkedQueue.poll()` does the same without the lock. When the lot\'s state lives in Postgres instead, the idea becomes a conditional update: `UPDATE spots SET ticket_id = $1 WHERE id = $2 AND ticket_id IS NULL`. Zero rows affected means another gate won, and you try the next spot.',
    },
    {
      kind: 'list',
      items: [
        '**Double release.** An exit retried after a timeout pushes the spot onto the free list twice, and two later cars are sent to the same spot. Order the exit: take payment, delete the ticket from `active`, and only the caller whose delete succeeded releases the spot. The retry reuses the payment\'s idempotency key, so it cannot charge twice either.',
        '**Lost ticket.** Find the active ticket by plate and charge the daily maximum. That is a rule, so it is a pricing strategy, not an `if` inside `exit()`.',
        '**Payment fails at the barrier.** Release the spot only after payment succeeds. The car is still physically in it.',
        '**Full lot.** The sign reads the per-size free counts, but `park()` still throws `LotFullError`, because the count can change between the sign and the barrier.',
      ],
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Bay guidance in airport car parks, the green and red lights above each space, is this free list in hardware. A sensor flips one bay, the count on the sign at the ramp updates, and drivers are steered to a level with space before they reach a barrier.',
    },
  ],
}
