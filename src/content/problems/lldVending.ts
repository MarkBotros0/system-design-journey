import type { Problem } from '../types'

export const lldVending: Problem = {
  id: 'lld-vending',
  title: 'Design a vending machine',
  kind: 'lld',
  category: 'lld-systems',
  difficulty: 'easy',
  brief:
    'Design the software inside a vending machine. It takes coins and contactless cards, sells snacks from numbered slots and gives change.',
  patterns: ['state', 'strategy'],
  suggests: ['dp-strategy-state', 'l-modelling', 'l-extension', 'l-concurrency'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Recognised a state machine and drew the states and transitions before writing code' },
    { id: 'r2', bar: 'must', criterion: 'Modelled each state explicitly (a class each, or a justified table), with every event routed through the current one' },
    { id: 'r3', bar: 'must', criterion: 'Stored money as integer cents, never floats' },
    { id: 'r4', bar: 'must', criterion: 'Handled cancel and sold out with a complete refund path' },
    { id: 'r5', bar: 'senior', criterion: 'Refused a sale before taking the money when change could not be made' },
    { id: 'r6', bar: 'senior', criterion: 'Explained why greedy change-making fails with limited coins and planned change properly' },
    { id: 'r7', bar: 'senior', criterion: 'Held the money and captured it only after the drop sensor confirmed the vend' },
    { id: 'r8', bar: 'senior', criterion: 'Put coins and cards behind one payment interface with hold, capture and release' },
    { id: 'r9', bar: 'staff', criterion: 'Serialised hardware events through one queue so the state machine needs no locks' },
    { id: 'r10', bar: 'staff', criterion: 'Voided a card approval that arrived after the customer cancelled' },
    { id: 'r11', bar: 'staff', criterion: 'Persisted the open sale so a power cut mid-vend is resolved on restart' },
  ],
  followups: [
    {
      q: 'The power fails while the spiral is turning. What happens to the customer\'s money?',
      a: 'Before starting the motor, write the open sale (slot, payment hold, amount) to non-volatile storage. On boot, an open sale means the outcome is unknown, so check the drop sensor\'s last reading or, failing that, refund: void the card hold or pay back the coins. Erring towards the customer is the right default for a machine with nobody standing next to it to complain to.',
    },
    {
      q: 'Add a promotion: buy two, get the third half price.',
      a: 'A sale becomes a basket, so `AwaitingPayment` holds a list of slots and the price comes from a `PricingRule` strategy applied to the basket. The states do not change, because they only ever ask "is the credit at least the price?". A pricing change that touches no state class is the evidence the design was right.',
    },
    {
      q: 'Why not an enum and a transition table instead of state classes?',
      a: 'For five states with little behaviour, a table keyed by state and event is genuinely simpler and easy to check for completeness. State classes win once states carry data (the escrow, the card authorisation) and behaviour (entry actions, timeouts), which this machine does. Either is defensible if you say why; a pile of boolean flags is not.',
    },
    {
      q: 'A fleet of 10,000 machines needs remote price changes and sales reports.',
      a: 'Give each machine an outbound event log, every sale, refund and fault as an immutable record, shipped whenever the network is up, because vending machines are often offline. Price changes arrive as versioned commands that are applied only in `Idle`, so a price never changes in the middle of a sale. The state machine stays the single source of truth on the device.',
    },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'prose',
      text: 'The tell in this question is that **the same input means different things at different times**. A coin is credit while you are paying and is rejected mid-vend; cancel refunds everything before the vend and does nothing once the motor turns. That is a state machine, and the interview is about whether you draw it before you write the first `if`.',
    },
    {
      kind: 'list',
      items: [
        'The customer selects a slot, pays with coins or a contactless card, and gets the item and any change.',
        'Cancel at any point before the vend returns everything the customer put in.',
        'Each slot holds one product at one price, with a count. An operator restocks slots and empties the cash box.',
        'The machine refuses a sale it cannot complete: sold out, or no way to make change.',
        'Out of scope: remote telemetry, dynamic pricing, the card network itself.',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional: **money is never lost**. Every coin either buys something or comes back. Hardware events (a coin dropping, a key press, a card approval, the drop sensor) arrive independently and must not corrupt the state. The logic must be testable without a coin mechanism attached.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: '"I will draw the states and transitions first, because every requirement here is really a question about which state the machine is in."',
    },

    { kind: 'heading', text: 'Core objects' },
    {
      kind: 'figure',
      caption: 'A card sale loops through four states and a coin sale skips Authorising; cancel and failure both lead back to Idle.',
      figure: {
        kind: 'cycle',
        steps: [
          { label: 'Idle', sub: 'waiting for a selection' },
          { label: 'Awaiting payment', sub: 'slot chosen, credit below price' },
          { label: 'Authorising', sub: 'card only: waiting for the bank' },
          { label: 'Dispensing', sub: 'motor running, money still held' },
        ],
        note: 'Cancel from Awaiting payment or Authorising refunds and returns to Idle. Out of service is a fifth state outside the loop.',
      },
    },
    {
      kind: 'list',
      items: [
        '`VendingMachine`: the context. Holds the current state and forwards every hardware event to it.',
        '`State`: one subclass per state. Each overrides only the events that mean something in that state.',
        '`Inventory` and `Slot`: product, price and count per slot.',
        '`CoinStore`: the coin tubes, counted per denomination. It accepts, banks, pays out and plans change.',
        '`Payment`: a hold on the customer\'s money. Coins and cards are two implementations of it.',
      ],
    },

    { kind: 'heading', text: 'Classes and relationships' },
    {
      kind: 'figure',
      caption: 'State pattern: the machine delegates every event to its current state object.',
      figure: {
        kind: 'classes',
        classes: [
          {
            name: 'State',
            stereotype: 'abstract',
            methods: ['select(slotId): void', 'insert(coin): void', 'cancel(): void', 'dispensed(ok): void'],
            tone: 'line',
          },
          { name: 'Idle', methods: ['select(slotId): void'] },
          {
            name: 'AwaitingPayment',
            fields: ['slot: Slot', 'escrow: Money[]'],
            methods: ['insert(coin): void', 'cancel(): void'],
          },
          {
            name: 'Dispensing',
            fields: ['slot: Slot', 'payment: Payment'],
            methods: ['enter(): void', 'dispensed(ok): void'],
          },
          {
            name: 'VendingMachine',
            fields: ['state: State', 'inventory: Inventory', 'coins: CoinStore'],
            methods: ['setState(s: State): void'],
          },
        ],
        relations: [
          { from: 'Idle', to: 'State', kind: 'inherits' },
          { from: 'AwaitingPayment', to: 'State', kind: 'inherits' },
          { from: 'Dispensing', to: 'State', kind: 'inherits' },
          { from: 'VendingMachine', to: 'State', kind: 'has', label: 'current' },
        ],
        note: 'Authorising and OutOfService are two more subclasses. The base class also defines enter() and approved(auth), and every default is harmless.',
      },
    },
    {
      kind: 'prose',
      text: 'The base class is where the safety lives. Every event has a default that does nothing harmful: a coin inserted in the wrong state is rejected back to the customer, a key press shows a message. A state overrides only what it handles, so **an event nobody planned for is safe by construction**.',
    },

    { kind: 'heading', text: 'Key methods' },
    {
      kind: 'code',
      caption: 'Safe defaults in the base class, and a payment that is a hold until the item drops.',
      code: `type Money = number // integer cents, never a float

interface Payment {
  capture(): void // the item dropped: keep the money
  release(): void // it did not: give all of it back
}

abstract class State {
  constructor(protected m: VendingMachine) {}
  enter(): void {}
  // Defaults: this event means nothing in this state.
  select(slotId: string): void { this.m.show('Please wait') }
  insert(coin: Money): void { this.m.coins.reject(coin) }
  cancel(): void {}
  approved(auth: CardAuth): void { auth.void() }
  dispensed(ok: boolean): void {}
}`,
    },
    {
      kind: 'code',
      caption: 'Plan the change before committing to the sale.',
      code: `class AwaitingPayment extends State {
  private escrow: Money[] = []
  constructor(m: VendingMachine, private slot: Slot) { super(m) }

  insert(coin: Money): void {
    this.escrow.push(coin)
    const credit = sum(this.escrow)
    if (credit < this.slot.price) return this.m.showCredit(credit)
    const owed = credit - this.slot.price
    const change = this.m.coins.plan(owed, this.escrow)
    if (!change) {
      this.escrow.pop() // hand back the coin that overpaid
      this.m.coins.reject(coin)
      return this.m.show('Exact change or card')
    }
    const pay = new CoinPayment(this.m.coins, this.escrow, change)
    this.m.setState(new Dispensing(this.m, this.slot, pay))
  }

  cancel(): void {
    this.m.coins.giveBack(this.escrow)
    this.m.setState(new Idle(this.m))
  }
}`,
    },
    {
      kind: 'code',
      caption: 'The money moves only after the drop sensor reports.',
      code: `class Dispensing extends State {
  constructor(m: VendingMachine, private slot: Slot,
              private payment: Payment) { super(m) }

  enter(): void { this.m.motor.vend(this.slot) }

  // From the drop sensor, not the motor: did anything fall?
  dispensed(ok: boolean): void {
    if (ok) {
      this.payment.capture()
      this.m.inventory.take(this.slot)
    } else {
      this.payment.release()
      this.m.show('Refunded')
    }
    this.m.setState(new Idle(this.m))
  }
}`,
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Many modern machines have an infrared beam across the delivery chute. A spiral that turns without anything breaking the beam is a failed vend, and the machine refunds rather than keeping your money for a snack left hanging on the spiral. That sensor is the `dispensed(ok)` event.',
    },

    { kind: 'heading', text: 'Patterns and extensibility' },
    {
      kind: 'codeCompare',
      before: {
        title: 'Flags checked in every method',
        code: `insert(coin: Money): void {
  if (this.outOfService) return this.reject(coin)
  if (this.dispensing) return this.reject(coin)
  if (!this.selected) return this.reject(coin)
  this.credit += coin
  if (this.credit >= this.selected.price) {
    this.dispensing = true
    this.motor.vend(this.selected)
  }
}
// ...and the same flags again in select(),
// cancel(), tapCard() and dispensed()`,
      },
      after: {
        title: 'One class per state',
        code: `class Idle extends State {
  select(slotId: string): void {
    const slot = this.m.inventory.get(slotId)
    if (!slot || slot.count === 0) {
      return this.m.show('Sold out')
    }
    this.m.setState(new AwaitingPayment(this.m, slot))
  }
}
// Dispensing never overrides insert(), so a coin
// dropped mid-vend hits the default: rejected.`,
      },
      note: 'Adding out-of-service mode is one new class. In the flag version it is one more boolean to check in every method, and the method you forget is the bug.',
    },
    {
      kind: 'prose',
      text: 'Payment is the second axis of change. Coins and cards differ in **how the money is held**, not in what the machine does with it: both are a hold that becomes a charge only after the item drops. Coins sit in escrow; a card has an authorisation that is captured or voided. One interface, two strategies, and `Dispensing` never asks which.',
    },
    {
      kind: 'code',
      caption: 'Two ways to hold money, one contract.',
      code: `class CoinPayment implements Payment {
  constructor(private coins: CoinStore,
              private escrow: Money[],
              private change: Money[]) {}
  capture(): void {
    this.coins.bank(this.escrow)
    this.coins.payOut(this.change)
  }
  release(): void { this.coins.giveBack(this.escrow) }
}

class CardPayment implements Payment {
  constructor(private auth: CardAuth) {}
  capture(): void { this.auth.capture() }
  release(): void { this.auth.void() }
}`,
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'Money as a float. In floating point, `0.1 + 0.2` is not `0.3`, and a vending machine adds coins all day. Integer cents everywhere, including in the display code.',
    },

    { kind: 'heading', text: 'Concurrency and edge cases' },
    {
      kind: 'prose',
      text: 'One customer at a time, but not one event at a time. The coin mechanism, the keypad, the card reader and the drop sensor each report on their own schedule, often from their own interrupt or thread. **Put every event on one queue and let a single loop feed it to the state machine.** Transitions are then serial by construction and the states need no locks. Events arrive at human speed, so the queue never backs up.',
    },
    {
      kind: 'prose',
      text: 'Serialising the events removes data races, not ordering surprises. The card is the one that bites:',
    },
    {
      kind: 'figure',
      caption: 'Cancel lands while the card is authorising. The late approval reaches Idle, whose default is to void it.',
      figure: {
        kind: 'sequence',
        actors: ['Customer', 'Machine', 'Card reader'],
        steps: [
          { from: 0, to: 1, label: 'select B4, tap card' },
          { from: 1, to: 2, label: 'authorise 150' },
          { from: 0, to: 1, label: 'cancel' },
          { from: 1, to: 1, label: 'Authorising → Idle' },
          { from: 2, to: 1, label: 'approved (late)', dashed: true, tone: 'streak' },
          { from: 1, to: 1, label: 'Idle.approved(): void it', tone: 'mastered' },
          { from: 1, to: 2, label: 'void the authorisation', tone: 'mastered' },
        ],
        note: 'Without the default, a naive Idle either ignores the approval, leaving a hold on the customer\'s card for days, or acts on it and vends a snack nobody is waiting for.',
      },
    },
    {
      kind: 'list',
      items: [
        '**Change-making with limited coins.** Greedy is wrong here. To give 30 cents from one 25 and three 10s, greedy takes the 25 and then needs a 5 it does not have; three 10s was the answer. With five or six denominations and tubes of a few dozen coins, a small search over the counts is microseconds. `plan()` runs it, and returns nothing if no combination exists.',
        '**Check before the coin, too.** If the tubes cannot make change for the most common overpayment, show "exact change only" in `Idle`, before anyone inserts money.',
        '**The operator opens the door mid-sale.** Service mode is a state you can enter only from `Idle`, so a restock or a price change can never land under a customer who is halfway through paying.',
        '**Stuck item.** `dispensed(false)` releases the payment. After a couple of failures in one slot, mark it out of order so the next customer is not refunded too.',
        '**Card timeout.** No answer within a few seconds counts as a decline; if the approval arrives later, the base-class default voids it, exactly as with cancel. Tag every authorisation with its sale id, so a stale approval that lands while the *next* customer is authorising is voided too, not mistaken for theirs.',
      ],
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Real machines light "exact change only" when the coin tubes run low. It is the change-making problem surfaced as a state the customer can see, checked before they put money in rather than after.',
    },
  ],
}
