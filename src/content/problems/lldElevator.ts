import type { Problem } from '../types'

export const lldElevator: Problem = {
  id: 'lld-elevator',
  title: 'Design an elevator system',
  kind: 'lld',
  category: 'lld-systems',
  difficulty: 'medium',
  brief:
    'Design the control software for a bank of elevators in an office building. People press call buttons on each floor and floor buttons inside the cars.',
  patterns: ['strategy', 'state', 'observer'],
  suggests: ['dp-strategy-state', 'dp-observer', 'l-extension', 'l-concurrency'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Separated hall calls (a request to the building) from car calls (a request to one car)' },
    { id: 'r2', bar: 'must', criterion: 'Modelled system, dispatcher, car and requests with a clear owner for each' },
    { id: 'r3', bar: 'must', criterion: 'Kept each car\'s stops as sets ordered by floor, not a queue in arrival order' },
    { id: 'r4', bar: 'must', criterion: 'Served stops with a sweep that turns only when nothing lies ahead, and explained why it bounds the wait' },
    { id: 'r5', bar: 'senior', criterion: 'Made dispatch a strategy and costed a call by direction, not just distance' },
    { id: 'r6', bar: 'senior', criterion: 'Modelled car states explicitly: idle, moving, doors open, out of service' },
    { id: 'r7', bar: 'senior', criterion: 'Used listeners for lanterns and displays so the car knows nothing about them' },
    { id: 'r8', bar: 'senior', criterion: 'Respected hall-call direction: no stopping for a down call on the way up' },
    { id: 'r9', bar: 'staff', criterion: 'Kept unserved hall calls owned by the system and re-dispatched them when a car left service' },
    { id: 'r10', bar: 'staff', criterion: 'Serialised every event through one control loop and justified it by the event rate' },
    { id: 'r11', bar: 'staff', criterion: 'Showed peak zoning or destination dispatch as a new strategy that leaves the cars untouched' },
  ],
  followups: [
    {
      q: 'It is 8:45 and everyone is going up from the lobby. What changes?',
      a: 'Up-peak is what dispatch strategies exist for. Send idle cars back to the lobby instead of leaving them where they stopped, and zone the building so some cars serve the low floors and some the high ones, which cuts the stops per round trip. All of it is a strategy chosen by time of day; the cars do not change.',
    },
    {
      q: 'How do you test the dispatcher?',
      a: 'Inject the clock and drive the system with a `step()` method instead of real time, so a simulated day of traffic runs in milliseconds. Feed it a recorded or generated call pattern and assert on outcomes (average wait, worst wait, no call older than one round trip) rather than on which car was chosen, because a better algorithm will choose differently.',
    },
    {
      q: 'One car breaks down with six stops queued.',
      a: 'Its car calls go with it: the riders inside are stuck, which is an alarm and a rescue, not a scheduling problem. Its hall calls were never its property. The system still holds them and sends each one back through the dispatcher, which is exactly why hall calls live at the system level until a car opens its doors at that floor.',
    },
    {
      q: 'Would you give each car its own thread?',
      a: 'No. A whole building produces a few events a second, so one control loop draining one queue is fast enough by orders of magnitude and removes every race between the dispatcher and the cars. The hardware boundary is asynchronous, but it only enqueues events; it never touches car state directly.',
    },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'prose',
      text: 'Clarify the building before the software: how many cars, how many floors, which buttons. Most of the design then follows from one distinction. A **hall call** (someone on floor 7 wants to go up) is a request to the building. A **car call** (someone inside car B pressed 12) is a request to one car.',
    },
    {
      kind: 'list',
      items: [
        'Up and down call buttons on every floor; floor buttons, door-open and alarm inside each car.',
        'A dispatcher assigns each hall call to exactly one car.',
        'Each car serves its stops in an order that never strands a floor and never reverses while riders are still heading the other way.',
        'A car can be taken out of service. Fire service recalls every car to the lobby.',
        'Out of scope: motor control, door safety hardware, acceleration curves.',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional: say 4 cars and 20 floors. Average wait matters, and **worst-case wait matters more**: a floor that is never served is a bug, not a tuning problem. The dispatch algorithm will change, so it must be swappable, and testable with a simulated clock.',
    },
    {
      kind: 'callout',
      tone: 'say',
      text: '"Hall calls go to the dispatcher, car calls go straight to the car. That split decides where each list of stops lives."',
    },

    { kind: 'heading', text: 'Core objects' },
    {
      kind: 'list',
      items: [
        '`ElevatorSystem`: the entry point. Receives hall calls, owns the cars and the dispatcher, and holds every hall call until it is served.',
        '`DispatchStrategy`: picks a car for a hall call. Swappable.',
        '`ElevatorCar`: current floor, direction, its stops, its state.',
        '`CarState`: idle, moving, doors open, out of service. Each accepts different events.',
        '`HallCall` and car calls: plain values, a floor plus a direction for hall calls.',
        '`CarListener`: hall lanterns and floor displays subscribe to arrivals.',
      ],
    },

    { kind: 'heading', text: 'Classes and relationships' },
    {
      kind: 'figure',
      caption: 'Hall calls go through a swappable dispatcher; each car owns its stops and its state, and announces arrivals to listeners.',
      figure: {
        kind: 'classes',
        classes: [
          {
            name: 'DispatchStrategy',
            stereotype: 'interface',
            methods: ['assign(call, cars): ElevatorCar'],
            tone: 'line',
          },
          {
            name: 'ElevatorSystem',
            fields: ['cars: ElevatorCar[]', 'dispatcher: DispatchStrategy', 'open: Map<string, OpenCall>'],
            methods: ['hallCall(call): void', 'carCall(carId, floor): void'],
          },
          {
            name: 'ElevatorCar',
            fields: ['floor: number', 'dir: up | down | idle', 'stops: Map<number, Set<Why>>', 'state: CarState'],
            methods: ['addStop(floor, why): void', 'nextStop(): number | null'],
          },
          {
            name: 'CarState',
            stereotype: 'interface',
            methods: ['tick(car): void', 'openDoors(car): void'],
          },
          {
            name: 'CarListener',
            stereotype: 'interface',
            methods: ['arrived(car, floor, nextDir): void'],
          },
        ],
        relations: [
          { from: 'ElevatorSystem', to: 'ElevatorCar', kind: 'has', label: '1..*' },
          { from: 'ElevatorSystem', to: 'DispatchStrategy', kind: 'has', label: 'injected' },
          { from: 'ElevatorCar', to: 'CarState', kind: 'has', label: 'current' },
          { from: 'ElevatorCar', to: 'CarListener', kind: 'uses', label: 'notifies' },
        ],
        note: 'NearestSuitableCar, ZonedDispatch and ByTimeOfDay implement DispatchStrategy. Idle, Moving, DoorsOpen and OutOfService implement CarState.',
      },
    },
    {
      kind: 'callout',
      tone: 'trap',
      text: 'One global [[FIFO]] queue of requests that whichever car is free pops from. It serves riders in the order they pressed, which is the one order guaranteed to make cars zigzag. Stops are **sets** per car: pressing 12 five times is one stop, and the sweep, not the press order, decides when it is served.',
    },

    { kind: 'heading', text: 'Key methods' },
    {
      kind: 'prose',
      text: 'The heart of the car is `nextStop()`. Serving stops in arrival order sends the car back and forth; serving the nearest stop first can starve the top floor while the middle stays busy. A sweep fixes both.',
    },
    {
      kind: 'figure',
      caption: 'The same three requests from floor 3: in arrival order, and as a sweep that reverses once.',
      figure: {
        kind: 'split',
        left: {
          title: 'In arrival order',
          nodes: [{ label: '3', sub: 'start' }, { label: '9' }, { label: '2' }, { label: '8' }],
          cost: '19 floors, two reversals',
          tone: 'alert',
        },
        right: {
          title: 'Sweep, then turn',
          nodes: [{ label: '3', sub: 'start, going up' }, { label: '8' }, { label: '9', sub: 'last stop up' }, { label: '2' }],
          cost: '13 floors, one reversal',
          tone: 'mastered',
        },
        verdict: 'A sweep serves everything on the way and turns only when nothing lies ahead, so every stop waits at most one round trip.',
      },
    },
    {
      kind: 'code',
      caption: 'Stops per floor, tagged with why. The direction decides which of them count on the way.',
      code: `type Why = 'car' | Dir // a car call, or a hall call up or down

// ElevatorCar: what waits on each floor. 20 floors: just scan.
private stops = new Map<number, Set<Why>>()

addStop(floor: number, why: Why = 'car'): void {
  const waiting = this.stops.get(floor) ?? new Set<Why>()
  this.stops.set(floor, waiting.add(why))
}

// LOOK with direction: stop on the way for car calls and calls
// going our way, else run to the furthest call ahead and turn.
nextStop(): number | null {
  for (const dir of this.directionsToTry()) { // ours first
    const ahead = this.floorsWithStops(dir)   // nearest first
    const stop = ahead.find((f) => this.waits(f, 'car', dir))
      ?? ahead.at(-1)
    if (stop !== undefined) {
      this.dir = dir
      return stop
    }
  }
  this.dir = 'idle'
  return null
}`,
    },
    {
      kind: 'prose',
      text: '`SCAN` runs to the last floor before turning; `LOOK` turns at the last requested stop. Real controllers behave like `LOOK`, because carrying nobody to the top floor is wasted time. The dispatcher\'s job is different: given a hall call, which car gets there soonest? Distance alone is wrong, because a car two floors away heading the other way is further than a car six floors away heading towards you.',
    },
    {
      kind: 'code',
      caption: 'Cost a call by the floors a car must travel before it can pick it up.',
      code: `class NearestSuitableCar implements DispatchStrategy {
  assign(call: HallCall, cars: ElevatorCar[]): ElevatorCar {
    return minBy(cars, (car) => this.cost(car, call))
  }

  private cost(car: ElevatorCar, call: HallCall): number {
    const dist = Math.abs(car.floor - call.floor)
    if (car.dir === 'idle') return dist
    const ahead = car.dir === 'up'
      ? call.floor >= car.floor
      : call.floor <= car.floor
    if (ahead && call.dir === car.dir) return dist
    // Otherwise finish this sweep and come back. An estimate:
    // a call behind the car, going our way, needs two turns.
    const turn = car.furthestStopAhead() ?? car.floor
    return Math.abs(car.floor - turn) + Math.abs(turn - call.floor)
  }
}`,
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Disk scheduling borrowed both the idea and the name. `SCAN` is still taught as "the elevator algorithm", and the Linux block layer called its I/O schedulers elevators: the boot parameter used to be `elevator=deadline`. Sweeping a disk head across tracks is the same problem as sweeping a car across floors.',
    },

    { kind: 'heading', text: 'Patterns and extensibility' },
    {
      kind: 'prose',
      text: 'Three patterns, each earning its place. **Strategy** for dispatch, because the building manager will want a different policy at 8:45 than at 14:00. **State** for each car, because a door-open button means something different while moving. **Observer** for arrivals, because lanterns, displays, the chime and the monitoring system all care, and the car should know about none of them.',
    },
    {
      kind: 'codeCompare',
      before: {
        title: 'Modes as branches',
        code: `hallCall(call: HallCall): void {
  if (this.fireService) return
  let car: ElevatorCar
  if (isMorningPeak(new Date())) {
    car = this.cars[call.floor <= 10 ? 0 : 2]
  } else {
    car = nearest(this.cars, call.floor)
  }
  car.addStop(call.floor)
}
// every new mode is another branch,
// and every branch reads the real clock`,
      },
      after: {
        title: 'Policies as strategies',
        code: `class ByTimeOfDay implements DispatchStrategy {
  constructor(private peak: DispatchStrategy,
              private normal: DispatchStrategy,
              private now: () => Date) {}

  assign(call: HallCall, cars: ElevatorCar[]): ElevatorCar {
    const s = isMorningPeak(this.now()) ? this.peak : this.normal
    return s.assign(call, cars)
  }
}

const system = new ElevatorSystem(cars, new ByTimeOfDay(
  new ZonedDispatch({ low: [1, 10], high: [11, 20] }),
  new NearestSuitableCar(),
  () => new Date(),
))`,
      },
      note: 'Fire service is not a dispatch strategy, because it overrides every car at once. It is a state of the whole system, and in that state hall calls are ignored.',
    },
    {
      kind: 'table',
      head: ['Car state', 'Handles', 'Ignores'],
      rows: [
        ['Idle', 'a new stop: start moving, or open if it is this floor', 'nothing'],
        ['Moving', 'new stops; arrival at the next stop opens the doors', 'door-open button'],
        ['DoorsOpen', 'door-open extends the dwell; the timer closes and moves on', 'nothing'],
        ['OutOfService', 'operator commands only', 'every call and button'],
      ],
    },
    {
      kind: 'callout',
      tone: 'example',
      text: 'Destination dispatch, where riders key their floor into a lobby panel and are told which car to take, was introduced by Schindler with Miconic 10 in the early 1990s. In this design it is a `HallCall` that carries a destination, plus one new strategy that groups riders going to the same floors. The cars do not change.',
    },

    { kind: 'heading', text: 'Concurrency and edge cases' },
    {
      kind: 'prose',
      text: 'The dispatcher decides on a snapshot of the cars, and the cars keep changing. If decisions and car events can interleave, a call can be assigned to a car that no longer exists for dispatch purposes:',
    },
    {
      kind: 'figure',
      caption: 'The dispatcher reads car B as idle, the operator takes B out of service, and the floor-9 call is silently lost.',
      figure: {
        kind: 'sequence',
        actors: ['Dispatcher', 'Car B', 'Operator'],
        steps: [
          { from: 0, to: 0, label: 'hall call: 9 up' },
          { from: 0, to: 1, label: 'read: idle at 6' },
          { from: 2, to: 1, label: 'take out of service' },
          { from: 1, to: 1, label: 'stops cleared' },
          { from: 0, to: 1, label: 'addStop(9)', tone: 'alert' },
          { from: 1, to: 1, label: 'out of service: dropped', tone: 'alert' },
        ],
        note: 'The rider on 9 waits for a car that will never come, and no other car was ever asked.',
      },
    },
    {
      kind: 'prose',
      text: 'Two changes close it. First, **one control loop**: buttons, sensors and operator commands all enqueue events, and a single thread applies them, so "read the cars, pick one, add the stop" can never interleave with anything. At a few events per second, serialising costs nothing. Second, **hall calls belong to the system until served**: the system keeps every open call and the car it went to, and a car leaving service hands its calls back for re-dispatch.',
    },
    {
      kind: 'code',
      caption: 'Open hall calls are the system\'s, not the car\'s.',
      code: `class ElevatorSystem {
  private open =
    new Map<string, { call: HallCall; car: ElevatorCar }>()

  hallCall(call: HallCall): void {
    const cars = this.cars.filter((c) => c.acceptsCalls())
    const car = this.dispatcher.assign(call, cars)
    this.open.set(key(call), { call, car })
    car.addStop(call.floor, call.dir)
  }

  arrived(car: ElevatorCar, floor: number, dir: Dir): void {
    this.open.delete(key({ floor, dir })) // served
  }

  takeOutOfService(car: ElevatorCar): void {
    car.setState(new OutOfService()) // acceptsCalls() is false
    for (const { call, car: owner } of [...this.open.values()]) {
      if (owner === car) this.hallCall(call) // re-dispatch
    }
  }
}`,
    },
    {
      kind: 'list',
      items: [
        '**Direction of a hall call.** A down call on floor 7 while a car sweeps up past it: do not stop, the rider wants the other way. That is why stops are tagged with why: `nextStop()` passes floor 7 on the way up and serves it on the way down, while a car call for 7 would stop either way.',
        '**Starvation.** A sweep bounds every wait to one round trip, which is why it beats nearest-stop-first. Say this out loud; it is the reason for the algorithm.',
        '**A stop for the floor the car is passing.** If it cannot brake in time, the stop belongs to the return sweep, not to "already here".',
        '**Overload and held doors.** Car states, not dispatcher concerns. A full car skips hall calls until someone gets out, and those calls are re-dispatched.',
        '**Fire service.** Every car returns to the lobby, opens and stays; open calls are cleared and hall buttons ignored until the mode is reset.',
      ],
    },
  ],
}
