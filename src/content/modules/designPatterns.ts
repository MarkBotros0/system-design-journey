import type { Module } from '../types'

/**
 * Track — Design patterns (DP), part 1: stations 1–4.
 * trackId: 'design-patterns'. Authoring rules: docs/superpowers/plans/2026-11-18-content-brief.md
 */
export const designPatternsModules: Module[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'dp-intro',
    trackId: 'design-patterns',
    title: 'What patterns are for, and when they hurt',
    station: 1,
    prereqs: ['p-oop', 'p-dip'],
    related: ['i-recognition'],
    minutes: 11,
    summary: 'The GoF catalogue as shared vocabulary, and the judgement to leave a pattern out.',
    objectives: [
      'Name the three [[GoF]] families and the question each one answers',
      'Use a pattern name to compress a design decision, not to replace one',
      'Spot pattern-itis: abstraction paid for before the variation exists',
      'Bring a pattern into an interview problem-first',
    ],
    keywords: [
      'gang of four',
      'design patterns',
      'creational',
      'structural',
      'behavioural',
      'pattern-itis',
      'over-engineering',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'A low-level design round is forty-five minutes of turning a vague prompt into classes. Patterns are how you do that quickly, and how you explain it in one sentence. "Pricing rules sit behind a Strategy" tells the interviewer the shape of six classes without drawing any of them.',
      },
      {
        kind: 'prose',
        text: 'They also cost points when used the wrong way round. Plenty of candidates open with "I\'ll use the factory pattern" before saying what varies. The senior move is the reverse: state the problem, name the pattern that handles it, then say what it costs.',
      },
      { kind: 'heading', text: 'The catalogue and its three families' },
      {
        kind: 'prose',
        text: 'In 1994 Erich Gamma, Richard Helm, Ralph Johnson and John Vlissides, the Gang of Four ([[GoF]]), published Design Patterns: Elements of Reusable Object-Oriented Software. They did not invent its 23 patterns. They named solutions that kept recurring in real systems, and sorted them by the question each one answers.',
      },
      {
        kind: 'figure',
        caption: 'Twenty-three patterns, three questions: who makes the object, how objects fit together, and who does what.',
        figure: {
          kind: 'stack',
          layers: [
            {
              label: 'Creational: how objects get made',
              sub: 'Factory method · Abstract factory · Builder · Singleton · Prototype',
              tone: 'neutral',
            },
            {
              label: 'Structural: how objects fit together',
              sub: 'Adapter · Facade · Proxy · Decorator · Composite · Bridge · Flyweight',
              tone: 'neutral',
            },
            {
              label: 'Behavioural: who does what, and who tells whom',
              sub: 'Strategy · State · Observer · Command · Template method · Chain of responsibility · Iterator · Visitor · Mediator · Memento · Interpreter',
              tone: 'neutral',
            },
          ],
          note: '5 + 7 + 11. This track teaches the fifteen that interviews reach for; the rest are worth recognising by name.',
        },
      },
      {
        kind: 'table',
        head: ['Family', 'The question', 'The smell that sends you there'],
        rows: [
          [
            '**Creational**',
            'Who decides which class gets built?',
            '`new ConcreteThing()` repeated across call sites, or a constructor with nine arguments',
          ],
          [
            '**Structural**',
            'How do objects fit together?',
            "An interface that doesn't match yours, or a subsystem too fiddly to call correctly",
          ],
          [
            '**Behavioural**',
            'Who does what, and who tells whom?',
            'A `switch` on type that grows every sprint, or objects polling each other for changes',
          ],
        ],
      },
      { kind: 'heading', text: 'Patterns are vocabulary' },
      {
        kind: 'prose',
        text: 'The book gives every pattern four essential elements: a **name**, the **problem** it addresses, the **solution**\'s shape, and its **consequences**. The name is what pays off in conversation. "Put an adapter around the vendor\'s client" carries a structure, a reason and a known cost in seven words, and both of you can check the design against it.',
      },
      {
        kind: 'prose',
        text: 'The consequences are what candidates forget. Every pattern buys flexibility with indirection: more types, more files, one more hop for whoever reads the code next. Naming that cost is what separates "I know the catalogue" from "I know when to use it".',
      },
      {
        kind: 'prose',
        text: 'Patterns also compose. The book\'s first example is not a single pattern but Smalltalk\'s Model–View–Controller ([[MVC]]), which it reads as three patterns cooperating.',
      },
      {
        kind: 'figure',
        caption: 'Smalltalk MVC as the GoF book reads it: Observer between model and views, Composite for nested views, Strategy for the controller.',
        figure: {
          kind: 'classes',
          classes: [
            {
              name: 'Model',
              fields: ['views: View[]'],
              methods: ['attach(v: View)', 'setState(s)'],
              tone: 'line',
            },
            { name: 'View', stereotype: 'abstract', methods: ['update()', 'draw()'] },
            { name: 'CompositeView', fields: ['children: View[]'], methods: ['draw()'] },
            { name: 'Controller', stereotype: 'interface', methods: ['handle(input)'] },
          ],
          relations: [
            { from: 'View', to: 'Model', kind: 'uses', label: 'observes it: Observer' },
            { from: 'CompositeView', to: 'View', kind: 'inherits' },
            { from: 'CompositeView', to: 'View', kind: 'has', label: 'children: Composite' },
            { from: 'View', to: 'Controller', kind: 'has', label: 'delegates input: Strategy' },
            { from: 'Controller', to: 'Model', kind: 'uses', label: 'updates' },
          ],
        },
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Smalltalk MVC',
        text: 'Views register with the model and redraw when it changes: Observer. A view can contain other views and be treated as one: Composite. A view hands its input handling to a controller object, so you can disable a view just by giving it a controller that ignores input: Strategy. Descendants of the split, with the controller moved in between model and view, still run through Rails and Apple\'s UIKit.',
      },
      { kind: 'heading', text: 'When patterns hurt' },
      {
        kind: 'prose',
        text: '**Pattern-itis** is adding a pattern for variation that does not exist yet. One payment provider becomes an interface, a factory and a registry, for a list with one entry. Every reader now walks four types to find the line that charges a card.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Pattern-first: one provider, four types',
          code: `interface PaymentProvider {
  charge(order: Order): Promise<Receipt>
}
interface PaymentProviderFactory {
  create(): PaymentProvider
}
class StripeProviderFactory implements PaymentProviderFactory {
  create() { return new StripeProvider(stripeClient) }
}
class ProviderRegistry {
  private static factory: PaymentProviderFactory =
    new StripeProviderFactory()
  static provider() { return this.factory.create() }
}

// at the call site
await ProviderRegistry.provider().charge(order)`,
        },
        after: {
          title: 'Problem-first: one provider, one class',
          code: `class Payments {
  constructor(private stripe: Stripe) {}

  async charge(order: Order): Promise<Receipt> {
    const intent = await this.stripe.paymentIntents.create({
      amount: order.total.minor,
      currency: order.total.currency.toLowerCase(),
      payment_method: order.paymentMethodId,
      confirm: true,
    })
    return toReceipt(intent)
  }
}

// at the call site
await payments.charge(order)`,
        },
        note: 'The second version has one seam, the constructor, and that is all a test needs. It already keeps Stripe out of the callers. When a second provider is real, extracting an interface from `Payments` is a mechanical refactor.',
      },
      {
        kind: 'list',
        items: [
          '**A factory that builds one thing.** A `switch` with one case is a constructor with extra steps.',
          '**An interface with one implementation and no test double.** The indirection protects nothing.',
          '**Names stacked from pattern words.** `AbstractSingletonProxyFactoryBean` is a real Spring class, and it earns that name by serving thousands of unknown applications. Your checkout serves three known callers.',
          "**A pattern chosen before the requirements.** If you can't name the variation it isolates, you can't defend it.",
        ],
      },
      {
        kind: 'prose',
        text: 'The language matters too. In 1996 Peter Norvig showed that 16 of the 23 patterns become simpler or invisible in dynamic languages such as Lisp and Dylan. TypeScript has one of the features that does much of that work, first-class functions: a Strategy is often a function argument and a Command a closure. The problem the pattern names is still there. The class ceremony is not.',
      },
      {
        kind: 'figure',
        caption: 'Reach for a pattern when the variation is real, not when it is imaginable.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Is there a second variant today, or one committed to?',
            no: {
              answer: 'Write the plain code',
              sub: 'keep the constructor as the seam for tests',
              tone: 'mastered',
            },
            yes: {
              question: 'Will variants keep arriving, or change apart from their callers?',
              yes: { answer: 'Name the pattern that isolates it', sub: 'and say what it costs', tone: 'line' },
              no: { answer: 'One conditional, in one place', sub: 'two cases rarely need a hierarchy' },
            },
          },
        },
      },
      { kind: 'heading', text: 'Using patterns in the interview' },
      {
        kind: 'prose',
        text: 'The order is problem, pattern, cost. Say what varies or which constraint you are protecting. Name the pattern as the shape that handles it. Then say what it costs. The interviewer is scoring the reasoning; the name only compresses it.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Pattern-first',
          points: [
            '"I\'ll use a factory and a strategy here."',
            'Classes drawn before the requirements are agreed',
            'Cannot say what would break without the pattern',
          ],
        },
        right: {
          title: 'Problem-first',
          points: [
            '"The provider varies by country, so creation lives in one factory."',
            'The pattern arrives after the variation is on the board',
            'States the cost: one more indirection, one place to change',
          ],
        },
        verdict: 'Same pattern, opposite signal. The second candidate would have made the same call without knowing its name.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: "Discount rules change every sprint and checkout shouldn't have to, so each rule goes behind a `DiscountRule` interface. That's Strategy. The cost is a class per rule, which is fine at this rate of change.",
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Pattern bingo. Naming five patterns in the first ten minutes reads as memorisation and invites "why not just a function?", which you then have to answer five times. Bring a pattern in only when a requirement on the board asks for it.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Are design patterns obsolete in a language with first-class functions?',
            a: "The problems aren't; some of the ceremony is. In TypeScript a Strategy is often a function parameter and a Command a closure, which was Norvig's point. Patterns about object structure, such as Adapter, Composite or State, look much the same in any language. I'd still use the name, because it says what the function is for.",
          },
          {
            q: 'What is the difference between a design pattern and an architectural pattern?',
            a: 'Scale, and what is being arranged. Design patterns arrange a handful of classes inside one process; architectural patterns arrange layers, services and data flow, such as microservices or event sourcing. [[MVC]] sits on the line between them. The reasoning is the same at both scales: name the variation, isolate it, state the cost.',
          },
          {
            q: 'A teammate wants an interface and a factory "so we can swap it later". How do you respond?',
            a: 'Ask what "later" is. If a second implementation is planned, or a test needs a fake the constructor cannot already take, the seam earns its place. If not, keep a concrete class with its dependencies passed in. Extracting an interface later is mechanical; the indirection costs every reader now.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-dp-intro-1',
        moduleId: 'dp-intro',
        stem: 'In an interview, discount rules vary by customer tier and the product team adds one every sprint. What is the strongest way to bring a pattern in?',
        options: [
          'Open with "I\'ll use the Strategy pattern" and draw its classes before anything else',
          'Avoid pattern names entirely, because interviewers mark jargon down',
          'Say that rules change independently of checkout, then name Strategy as the shape that isolates them, and its cost',
          'Use an abstract factory so that new rules can be created without touching checkout',
        ],
        correct: 2,
        explain: 'Problem, pattern, cost. The name compresses reasoning you have already shown. Opening with the pattern reads as memorised, and avoiding names throws away the shared vocabulary. Abstract factory solves a different problem: building matching families of objects.',
      },
      {
        id: 'q-dp-intro-2',
        moduleId: 'dp-intro',
        stem: 'Your service has one payment provider and nothing on the roadmap to add another. A colleague proposes a `PaymentProvider` interface, a factory and a registry. What is the best response?',
        options: [
          'Agree: interfaces are always cheaper to add early than late',
          'Keep one concrete class with its client passed into the constructor, and extract an interface when a second provider is real',
          'Keep the factory but drop the interface',
          'Make the provider a singleton so there is only ever one',
        ],
        correct: 1,
        explain: 'The constructor is already a seam for tests, and extracting an interface later is mechanical. The factory and registry add types to protect a list with one entry. A singleton adds global state and solves nothing that was asked.',
      },
      {
        id: 'q-dp-intro-3',
        moduleId: 'dp-intro',
        stem: "In the GoF book's reading of Smalltalk MVC, which pattern describes the relationship between a model and its views?",
        options: ['Strategy', 'Composite', 'Facade', 'Observer'],
        correct: 3,
        explain: 'Views register with the model and are notified when it changes: Observer. Strategy is the view–controller relationship, where swapping the controller changes input handling. Composite is views nested inside views. Facade is not part of it.',
      },
    ],
    cards: [
      {
        id: 'c-dp-intro-1',
        moduleId: 'dp-intro',
        front: 'What are the three GoF families, and the question each answers?',
        back: 'Creational: who makes the object. Structural: how objects fit together. Behavioural: who does what, and who tells whom.',
        tag: 'Families',
      },
      {
        id: 'c-dp-intro-2',
        moduleId: 'dp-intro',
        front: 'How do you bring a pattern into an interview answer?',
        back: 'Problem, pattern, cost. Name what varies, name the pattern that isolates it, then say what the indirection costs.',
        tag: 'Interview',
      },
      {
        id: 'c-dp-intro-3',
        moduleId: 'dp-intro',
        front: 'What is pattern-itis?',
        back: 'Adding a pattern for variation that does not exist yet: indirection every reader pays for now, for flexibility nobody may need.',
        tag: 'Judgement',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'dp-factory',
    trackId: 'design-patterns',
    title: 'Factory method and abstract factory',
    station: 2,
    prereqs: ['dp-intro'],
    minutes: 14,
    summary: 'Keep the decision about which class to build in one place, and know the three things called a factory.',
    objectives: [
      'Tell a simple factory, the factory method pattern and an abstract factory apart',
      'Move a `switch` on type out of the call sites into one creation point',
      'Pick the lightest factory that fits, and name what each one costs',
    ],
    keywords: [
      'factory pattern',
      'factory method',
      'abstract factory',
      'simple factory',
      'static factory method',
      'registry',
      'DriverManager',
      'creational',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Almost every low-level design prompt has a line where the type of object depends on input: the vehicle in a parking lot, the channel for a notification, the payment provider for a country. Interviewers watch what you do with that line. If `new StripeProvider()` ends up in checkout, refunds and payouts, adding a country means editing all three, and missing one is a bug.',
      },
      {
        kind: 'prose',
        text: 'Three different things get called a factory, and seniors are expected to tell them apart. Only two of them are in the [[GoF]] book.',
      },
      { kind: 'heading', text: 'Simple factory: one place that knows' },
      {
        kind: 'prose',
        text: 'A simple factory is a function that takes the deciding input and returns an interface. It is an idiom rather than a [[GoF]] pattern, and it is the one you will use most. The decision exists once, and everything downstream depends on `PaymentProvider` without learning which class it got.',
      },
      {
        kind: 'figure',
        caption: 'Simple factory: callers depend on the interface, and only the factory names concrete classes.',
        figure: {
          kind: 'classes',
          classes: [
            {
              name: 'PaymentProvider',
              stereotype: 'interface',
              methods: ['charge(amount): ChargeId', 'refund(id): void'],
              tone: 'line',
            },
            { name: 'StripeProvider', methods: ['charge(amount)', 'refund(id)'] },
            { name: 'RazorpayProvider', methods: ['charge(amount)', 'refund(id)'] },
            { name: 'ProviderFactory', methods: ['providerFor(country): PaymentProvider'] },
            { name: 'Checkout', methods: ['pay(order)'] },
          ],
          relations: [
            { from: 'StripeProvider', to: 'PaymentProvider', kind: 'implements' },
            { from: 'RazorpayProvider', to: 'PaymentProvider', kind: 'implements' },
            { from: 'ProviderFactory', to: 'PaymentProvider', kind: 'uses', label: 'creates' },
            { from: 'Checkout', to: 'ProviderFactory', kind: 'uses', label: 'asks by country' },
            { from: 'Checkout', to: 'PaymentProvider', kind: 'uses', label: 'charges through' },
          ],
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Creation scattered through the callers',
          code: `async function checkout(order: Order) {
  let provider
  if (order.country === 'IN') {
    provider = new RazorpayProvider(keys.razorpay)
  } else if (order.country === 'BR') {
    provider = new MercadoPagoProvider(keys.mp)
  } else {
    provider = new StripeProvider(keys.stripe)
  }
  return provider.charge(order.total)
}

async function refund(order: Order) {
  // the same if/else again, and in payouts,
  // and in the admin tool. Miss one: a bug.
}`,
        },
        after: {
          title: 'One factory; callers see an interface',
          code: `interface PaymentProvider {
  charge(amount: Money): Promise<ChargeId>
  refund(id: ChargeId): Promise<void>
}

const providers: Record<string, () => PaymentProvider> = {
  IN: () => new RazorpayProvider(keys.razorpay),
  BR: () => new MercadoPagoProvider(keys.mp),
}

export function providerFor(country: string): PaymentProvider {
  const make = providers[country]
  return make ? make() : new StripeProvider(keys.stripe)
}

// every caller
await providerFor(order.country).charge(order.total)`,
        },
        note: 'A map instead of a `switch` makes a new country one line, and the factory becomes the only file that imports vendor classes.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'DriverManager',
        text: '`DriverManager.getConnection("jdbc:postgresql://db/shop")` never names a driver class. It offers the [[URL]] to each registered driver, found automatically through `ServiceLoader` since [[JDBC]] 4.0, and the first one that recognises the prefix returns a `Connection`. Moving from MySQL to Postgres changes a config string and a dependency, not the code that connects.',
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'When not to use it',
        text: 'One concrete class and no variation in sight: call `new`. And if the choice is fixed at startup, such as one region per deployment, let the dependency injection wiring pick it once instead of asking a factory on every request.',
      },
      { kind: 'heading', text: 'Factory method: let the subclass decide' },
      {
        kind: 'prose',
        text: 'The [[GoF]] factory method is narrower. A base class runs an algorithm that needs an object, and declares an overridable method to create it. Subclasses override that one method; the algorithm stays in the base class. It is how frameworks let you plug your own types into code you did not write.',
      },
      {
        kind: 'figure',
        caption: 'Factory method: the base class owns the algorithm; each subclass owns one creation hook.',
        figure: {
          kind: 'classes',
          classes: [
            {
              name: 'Notifier',
              stereotype: 'abstract',
              methods: ['notify(user, text)', 'createChannel(): Channel'],
              tone: 'line',
            },
            { name: 'Channel', stereotype: 'interface', methods: ['send(user, body)'] },
            { name: 'EmailNotifier', methods: ['createChannel(): Channel'] },
            { name: 'PushNotifier', methods: ['createChannel(): Channel'] },
            { name: 'EmailChannel', methods: ['send(user, body)'] },
          ],
          relations: [
            { from: 'EmailNotifier', to: 'Notifier', kind: 'inherits' },
            { from: 'PushNotifier', to: 'Notifier', kind: 'inherits' },
            { from: 'Notifier', to: 'Channel', kind: 'uses', label: 'sends through' },
            { from: 'EmailNotifier', to: 'EmailChannel', kind: 'uses', label: 'creates' },
            { from: 'EmailChannel', to: 'Channel', kind: 'implements' },
          ],
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'The base class switches on a flag',
          code: `class Notifier {
  constructor(private kind: 'email' | 'sms' | 'push') {}

  notify(user: User, text: string) {
    if (this.inQuietHours(user)) return
    let channel: Channel
    if (this.kind === 'email') channel = new EmailChannel()
    else if (this.kind === 'sms') channel = new SmsChannel()
    else channel = new PushChannel()
    channel.send(user, render(text, user))
  }

  private inQuietHours(user: User) { /* … */ return false }
}`,
        },
        after: {
          title: 'Subclasses override one creation hook',
          code: `abstract class Notifier {
  notify(user: User, text: string) {
    if (this.inQuietHours(user)) return
    this.createChannel().send(user, render(text, user))
  }

  // the factory method
  protected abstract createChannel(): Channel

  private inQuietHours(user: User) { /* … */ return false }
}

class EmailNotifier extends Notifier {
  protected createChannel() { return new EmailChannel() }
}
class PushNotifier extends Notifier {
  protected createChannel() { return new PushChannel() }
}`,
        },
        note: 'Quiet hours and rendering live in one place. A new channel is a new subclass, and `Notifier` is never edited.',
      },
      {
        kind: 'prose',
        text: 'In TypeScript you can often skip the subclass and pass the creator in: `new Notifier(() => new EmailChannel())`. That is composition instead of inheritance, and usually the better choice in your own code. Factory method earns its keep when the base class belongs to a framework and subclassing is the extension point you were given.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Collection.iterator()',
        text: "Java's for-each loop calls `iterator()` on whatever collection it is given. `ArrayList` returns an iterator that walks an index, `LinkedList` one that follows nodes, `HashSet` one that walks hash buckets. The loop is the shared algorithm; `iterator()` is the factory method each collection overrides.",
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'Not the same as a static factory method',
        text: '`List.of(1, 2)` and `Integer.valueOf(42)` are static factory methods: named constructors that can cache (`valueOf` reuses instances from -128 to 127) or return a hidden subtype. Useful, but not the [[GoF]] pattern. When an interviewer says "factory method", say which one you mean.',
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'When not to use it',
        text: 'Skip it when there is no shared algorithm around the creation. A subclass that only overrides `create()`, with nothing in the base class calling it, is a simple factory wearing inheritance. And when a second axis varies, say channel and locale, subclasses multiply; pass factories in instead.',
      },
      { kind: 'heading', text: 'Abstract factory: families that must match' },
      {
        kind: 'prose',
        text: 'Sometimes objects only make sense together. A dark-theme button on a light-theme dialog is a bug, and so is a Postgres connection handing you a MySQL statement. An abstract factory is one object with a creation method per product, and each concrete factory builds a whole matching family. Choose the factory once and the mismatch becomes impossible to write.',
      },
      {
        kind: 'figure',
        caption: 'Abstract factory: the client holds one factory, and every product it gets back belongs to the same family.',
        figure: {
          kind: 'classes',
          classes: [
            {
              name: 'ThemeFactory',
              stereotype: 'interface',
              methods: ['button(label): Button', 'dialog(text): Dialog'],
              tone: 'line',
            },
            { name: 'DarkTheme', methods: ['button(label)', 'dialog(text)'] },
            { name: 'LightTheme', methods: ['button(label)', 'dialog(text)'] },
            { name: 'Button', stereotype: 'interface', methods: ['render()'] },
            { name: 'SettingsScreen', fields: ['ui: ThemeFactory'], methods: ['render()'] },
          ],
          relations: [
            { from: 'DarkTheme', to: 'ThemeFactory', kind: 'implements' },
            { from: 'LightTheme', to: 'ThemeFactory', kind: 'implements' },
            { from: 'ThemeFactory', to: 'Button', kind: 'uses', label: 'creates' },
            { from: 'SettingsScreen', to: 'ThemeFactory', kind: 'has', label: 'injected' },
          ],
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Every widget checks the theme',
          code: `function settingsScreen(theme: 'light' | 'dark') {
  const save = theme === 'dark'
    ? new DarkButton('Save')
    : new LightButton('Save')
  const confirm = theme === 'dark'
    ? new DarkDialog('Discard changes?')
    : new LightDialog('Discard changes?')
  // one forgotten check and the screen mixes themes
  const help = new LightTooltip('Shortcuts')
  return [save, confirm, help]
}`,
        },
        after: {
          title: 'One factory, one family',
          code: `interface ThemeFactory {
  button(label: string): Button
  dialog(text: string): Dialog
  tooltip(text: string): Tooltip
}

const dark: ThemeFactory = {
  button: (l) => new DarkButton(l),
  dialog: (t) => new DarkDialog(t),
  tooltip: (t) => new DarkTooltip(t),
}

function settingsScreen(ui: ThemeFactory) {
  return [
    ui.button('Save'),
    ui.dialog('Discard changes?'),
    ui.tooltip('Shortcuts'),
  ]
}`,
        },
        note: 'The screen cannot mix themes, because it never names one. A high-contrast theme is one new object, and no screen changes.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Connection and look-and-feel',
        text: "A [[JDBC]] `Connection` is an abstract factory: `createStatement()`, `prepareStatement()` and `getMetaData()` all return the same driver's implementations, so a Postgres connection only ever hands you Postgres statements. Java Swing does the same for themes. Each component asks `UIManager` for its look-and-feel delegate, so switching from Metal to Nimbus restyles every button, menu and scrollbar together.",
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'When not to use it',
        text: 'Its weakness is the other axis. A new family is one new class, but a new product type, say a slider, means a new method on the interface and in every factory. The [[GoF]] book names this cost itself. Use it when families grow and the list of products is stable; for a single product, a simple factory is enough.',
      },
      { kind: 'heading', text: 'Choosing between them' },
      {
        kind: 'figure',
        caption: 'Start from the lightest factory, and move up only when the problem demands it.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Must several created objects match each other?',
            yes: { answer: 'Abstract factory', sub: 'one object per family', tone: 'line' },
            no: {
              question: "Is creation a hook inside a base class's algorithm?",
              yes: { answer: 'Factory method', sub: 'or pass a creator function in' },
              no: { answer: 'Simple factory', sub: 'a function and a map: the default', tone: 'mastered' },
            },
          },
        },
      },
      {
        kind: 'table',
        head: ['', 'Simple factory', 'Factory method', 'Abstract factory'],
        rows: [
          ['**Shape**', 'A function or a map', 'An overridable method', 'An object with a method per product'],
          ['**Varies by**', 'Runtime input', 'Subclass', 'Family'],
          ['**Cheap to add**', 'A new case', 'A new subclass', 'A new family'],
          ['**Expensive to add**', 'Little', 'A second axis: subclasses multiply', 'A new product type'],
          ['**In the [[GoF]] book?**', 'No', 'Yes', 'Yes'],
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: "The provider depends on the order's country, which we only know per request, so I'd put that choice in one factory keyed by country. Everything downstream takes a `PaymentProvider` and never learns which one it got. If each region later needed a matching provider and fraud checker, I'd promote it to an abstract factory.",
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Building the factory and then switching on type anyway. If checkout still says `if (provider instanceof StripeProvider)`, the factory hid nothing. Its value is that callers depend on the interface alone; a type check downstream means the interface is missing a method.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'How would you add a country without editing the factory at all?',
            a: "Turn the map into a registry that providers add themselves to, or drive it from config that names a provider per country. Self-registration is fully open for extension, but you lose the one file that lists every provider, and registering through import side effects breaks quietly when a bundler drops an unused import. For a handful of countries I'd keep the explicit map.",
          },
          {
            q: 'When would you use a factory rather than dependency injection?',
            a: 'When the choice depends on data you only have at runtime, such as the country on this order. When it is fixed at startup, such as one region per deployment, the injection wiring picks it once and the code never asks. A container is really a configurable factory that runs at boot.',
          },
          {
            q: 'What breaks first as an abstract factory grows?',
            a: 'Adding product types. Each one lands on the interface and on every concrete factory, so ten themes means ten edits for one new widget. If products change more often than families, it is the wrong shape: split it into per-product factories, or give families a base that supplies defaults.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-dp-factory-1',
        moduleId: 'dp-factory',
        stem: "The payment provider depends on the order's country, which is known only when the request arrives. Where should the choice live?",
        options: [
          'In the dependency injection wiring, at startup',
          'In a `Checkout` subclass per country that overrides `createProvider()`',
          'In an abstract factory with a single creation method',
          'In one simple factory keyed by country, called per request',
        ],
        correct: 3,
        explain: 'The input exists only at request time, so startup wiring cannot decide it. A subclass per country multiplies checkouts to vary one object, and an abstract factory with one product is a simple factory with extra types. A function and a map is the lightest thing that works.',
      },
      {
        id: 'q-dp-factory-2',
        moduleId: 'dp-factory',
        stem: 'Which one of these is the GoF factory method pattern?',
        options: [
          '`Integer.valueOf(42)`, which returns a cached instance',
          'Each Java collection overriding `iterator()`, which the shared for-each loop calls',
          'A `providerFor(country)` function that looks up a map',
          '`DriverManager.getConnection(url)` choosing a registered driver',
        ],
        correct: 1,
        explain: 'Factory method is an overridable creation method that a shared algorithm calls, and each collection supplies its own iterator to the same loop. `valueOf` is a static factory method, `providerFor` is a simple factory, and `DriverManager` is a registry-backed simple factory.',
      },
      {
        id: 'q-dp-factory-3',
        moduleId: 'dp-factory',
        stem: 'Your `ThemeFactory` interface has eight implementations. Design asks for a new `Slider` widget. What does that cost?',
        options: [
          'One new class, a `SliderFactory`',
          'Nothing, because clients create sliders directly',
          'A new method on the interface, and an implementation in all eight factories',
          'One new theme class',
        ],
        correct: 2,
        explain: 'New families are cheap in an abstract factory; new product types are not, because every concrete factory must learn to build the new product. That is the cost the GoF book names, and the reason to choose this pattern only when the product list is stable.',
      },
    ],
    cards: [
      {
        id: 'c-dp-factory-1',
        moduleId: 'dp-factory',
        front: 'Simple factory, factory method, abstract factory: one line each?',
        back: 'Simple: one function picks the class. Factory method: a subclass overrides a creation hook. Abstract factory: one object builds a matching family.',
        tag: 'Factory',
      },
      {
        id: 'c-dp-factory-2',
        moduleId: 'dp-factory',
        front: 'When is an abstract factory the right call?',
        back: "When objects must come as a consistent family, like a theme's widgets or one driver's connection and statements, and the list of product types is stable.",
        tag: 'Factory',
      },
      {
        id: 'c-dp-factory-3',
        moduleId: 'dp-factory',
        front: 'A static factory method versus the GoF factory method?',
        back: 'Static: a named constructor like `List.of` that can cache or return a subtype. GoF: an overridable method a base class calls so subclasses choose what gets built.',
        tag: 'Factory',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'dp-builder-singleton',
    trackId: 'design-patterns',
    title: 'Builder, and why singleton is suspect',
    station: 3,
    prereqs: ['dp-factory', 'p-dip'],
    minutes: 14,
    summary: 'Build complex immutable objects in named steps, and keep one instance without global state.',
    objectives: [
      'Use a builder for objects with many optional parts and rules that span fields',
      'Say when an options object beats a builder in TypeScript',
      "Name singleton's costs: hidden dependencies, leaking tests, initialisation races",
      'Keep a single instance with [[DI]] scoping or module scope instead',
    ],
    keywords: [
      'builder pattern',
      'fluent interface',
      'telescoping constructor',
      'singleton pattern',
      'double-checked locking',
      'global state',
      'dependency injection',
      'composition root',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'These are the two creational patterns interviewers use to probe judgement rather than recall. Builder is the right answer more often than candidates expect in Java, and less often in TypeScript. Singleton is the pattern everyone can draw, and the one seniors are expected to argue against.',
      },
      {
        kind: 'prose',
        text: 'Both are about controlling construction. A builder controls how one object is assembled; a singleton controls how many get made. The senior answer keeps the control and drops the parts that hurt.',
      },
      { kind: 'heading', text: 'Builder: construction in named steps' },
      {
        kind: 'prose',
        text: 'The problem is a constructor with too many parameters. Seven positional arguments, half of them optional, and a boolean nobody can read at the call site. Add rules that span fields, such as "a retried POST needs an idempotency key", and the constructor either checks everything or trusts every caller.',
      },
      {
        kind: 'prose',
        text: 'A builder collects the parts through named methods, checks the rules once in `build()`, and returns an immutable object. An [[HTTP]] request is the textbook case. Immutability is the point: a built request can be retried, logged and shared between workers without anyone changing it underneath you.',
      },
      {
        kind: 'figure',
        caption: 'Builder: the client talks to a mutable builder, and gets back an immutable product.',
        figure: {
          kind: 'classes',
          classes: [
            {
              name: 'RequestBuilder',
              fields: ['method', 'body?', 'retryCount'],
              methods: ['post(body): this', 'retries(n): this', 'build(): HttpRequest'],
              tone: 'line',
            },
            {
              name: 'HttpRequest',
              fields: ['readonly url', 'readonly method', 'readonly retryCount'],
              methods: ['static to(url): RequestBuilder'],
            },
            { name: 'RefundClient', methods: ['refund(chargeId)'] },
          ],
          relations: [
            { from: 'RefundClient', to: 'RequestBuilder', kind: 'uses', label: 'chains steps' },
            { from: 'RequestBuilder', to: 'HttpRequest', kind: 'uses', label: 'validates, then builds' },
          ],
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Positional arguments',
          code: `const req = new HttpRequest(
  'https://api.stripe.com/v1/refunds',
  'POST',
  body,
  key,
  5_000,
  3,
  true, // follow redirects? keep-alive? nobody knows
)`,
        },
        after: {
          title: 'Named steps, validated once',
          code: `const req = HttpRequest.to('https://api.stripe.com/v1/refunds')
  .post(body)
  .idempotencyKey(key)
  .timeout(5_000)
  .retries(3)
  .followRedirects()
  .build() // checks the rules, returns a frozen object`,
        },
        note: 'The same information, but every value has a name, and an invalid combination fails at `build()` instead of at the server.',
      },
      {
        kind: 'code',
        caption: 'A trimmed builder: mutable while you assemble, frozen once built. The idempotency rule spans three fields, so it lives in `build()`.',
        code: `class RequestBuilder {
  private method: 'GET' | 'POST' = 'GET'
  private body?: string
  private idemKey?: string
  private retryCount = 0

  constructor(private readonly url: string) {}

  post(body: string): this {
    this.method = 'POST'
    this.body = body
    return this
  }
  idempotencyKey(k: string): this { this.idemKey = k; return this }
  retries(n: number): this { this.retryCount = n; return this }

  build(): HttpRequest {
    const { url, method, body, idemKey, retryCount } = this
    if (method === 'POST' && retryCount > 0 && !idemKey) {
      throw new Error('retrying a POST needs an idempotency key')
    }
    return Object.freeze({ url, method, body, idemKey, retryCount })
  }
}`,
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'HttpRequest and OkHttp',
        text: "Java 11's `HttpRequest.newBuilder()` takes `.uri()`, `.header()`, `.timeout()` and `.POST(...)`, and `build()` returns an immutable request you can send as many times as you like. OkHttp goes a step further: `request.newBuilder()` starts a builder from an existing request, so \"the same call with one more header\" never mutates the original.",
      },
      {
        kind: 'prose',
        text: 'One aside for the interview: the [[GoF]] builder was about one construction process producing different representations, such as one document reader driving converters that emit plain text, TeX or an editable widget. The fluent builder everyone uses today was popularised by Joshua Bloch\'s Effective Java. Same name, different problem. Interviewers almost always mean the second.',
      },
      { kind: 'heading', text: 'When a builder is overkill' },
      {
        kind: 'prose',
        text: 'TypeScript already has named, optional parameters: the options object. `fetch(url, { method, headers, body, signal })` is the platform choosing exactly that over a builder. With a `Readonly` type and defaults, it covers most of what Java needs builders for.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Options object',
          points: [
            'Named and optional parameters for free',
            'One expression, easy to spread and override',
            'Rules across fields need a separate validate step',
            'The right default in TypeScript',
          ],
        },
        right: {
          title: 'Builder',
          points: [
            'Validates once, at `build()`',
            'Can enforce required steps in the types',
            'Can be passed around half-built and finished elsewhere',
            'Earns its place in query builders, test-data builders, complex config',
          ],
        },
        verdict: 'Default to an options object in TypeScript. Reach for a builder when assembly is staged across code, or when the chain itself is the product, as in the Knex and Kysely query builders.',
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'When not to use it',
        text: 'Three or four fields with no rules between them: use a constructor or an options object. A builder for a small value object doubles the code and adds a mutable twin of every immutable type.',
      },
      { kind: 'heading', text: 'Singleton: what it promises' },
      {
        kind: 'prose',
        text: 'Singleton makes two promises: **exactly one instance**, and **a global way to reach it**. The first is often legitimate. You do want one connection pool per process, one metrics registry, one loaded configuration. Every problem below comes from the second promise.',
      },
      {
        kind: 'figure',
        caption: 'Singleton: the class guards its only instance, and anything can reach it. That reach is the trouble.',
        figure: {
          kind: 'classes',
          classes: [
            {
              name: 'Database',
              fields: ['static instance?: Database', 'pool: Pool'],
              methods: ['static get(): Database', 'private constructor()', 'query(sql, params)'],
              tone: 'streak',
            },
            { name: 'BillingService', methods: ['charge(order)'] },
            { name: 'ReportJob', methods: ['run()'] },
          ],
          relations: [
            { from: 'BillingService', to: 'Database', kind: 'uses', label: 'Database.get(), unseen in its constructor' },
            { from: 'ReportJob', to: 'Database', kind: 'uses', label: 'Database.get()' },
          ],
        },
      },
      { kind: 'heading', text: 'Why singleton is suspect' },
      {
        kind: 'list',
        items: [
          '**Hidden dependencies.** `new BillingService()` looks like it needs nothing. It actually needs a database, the configuration, and whatever those reach. The constructor lies, and so does every diagram drawn from it.',
          '**Tests that leak.** State set by one test is still there in the next. You cannot give one test a fake while another uses the real thing, and running tests in parallel turns the leak into flakiness.',
          '**Initialisation races.** Lazy creation from several threads, or across an `await`, can build two instances or publish a half-built one.',
          "**One per process, until it isn't.** A config per tenant, a second database for reads, a client per region: \"exactly one\" was a guess, and the global access point is now everywhere.",
        ],
      },
      {
        kind: 'prose',
        text: 'The classic race is double-checked locking in Java: check for null, lock, check again, create. Without `volatile` on the field it is broken. The compiler or processor may publish the reference before the constructor\'s writes are visible, so a second thread sees a non-null instance with default-valued fields. `volatile` fixes it from Java 5 onwards; the idiomatic answers are an `enum` singleton or a holder class, which lean on the runtime\'s guarantee that a class is initialised exactly once.',
      },
      {
        kind: 'prose',
        text: 'Node has one thread, but the same race appears across an `await`.',
      },
      {
        kind: 'figure',
        caption: 'Lazy async initialisation: both requests see no client across the await, and the process opens two pools.',
        figure: {
          kind: 'sequence',
          actors: ['Request A', 'Request B', 'Database'],
          steps: [
            { from: 0, to: 0, label: 'client is null' },
            { from: 0, to: 2, label: 'connect()' },
            { from: 1, to: 1, label: 'client still null', tone: 'streak' },
            { from: 1, to: 2, label: 'connect() again', tone: 'alert' },
            { from: 2, to: 0, label: 'pool 1', dashed: true },
            { from: 2, to: 1, label: 'pool 2 overwrites pool 1', dashed: true, tone: 'alert' },
          ],
          note: 'Pool 1 is never closed, so its connections linger until an idle timeout reaps them.',
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Caches the result: racy',
          code: `let client: Pool | null = null

export async function getClient(): Promise<Pool> {
  if (!client) {
    // every caller arriving during this await
    // also sees null and connects again
    client = await connect(env.DATABASE_URL)
  }
  return client
}`,
        },
        after: {
          title: 'Caches the promise: one pool',
          code: `let pending: Promise<Pool> | null = null

export function getClient(): Promise<Pool> {
  // assigned synchronously, before any await,
  // so every later caller shares one promise
  pending ??= connect(env.DATABASE_URL)
  return pending
}`,
        },
        note: 'Memoise the promise, not the value. If the first attempt fails, clear `pending` in a `catch` so the next caller retries instead of inheriting the rejection.',
      },
      { kind: 'heading', text: 'One instance, without the pattern' },
      {
        kind: 'prose',
        text: 'Keep the first promise and drop the second. Create the one instance at the **composition root**, the place where the app is wired together at startup, and pass it to whatever needs it. This is [[DI]] without a framework.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Singleton: reached from anywhere',
          code: `class Database {
  private static instance?: Database
  private constructor(private pool: Pool) {}

  static get(): Database {
    return (this.instance ??= new Database(createPool()))
  }
  query(sql: string, args: unknown[]) { /* … */ }
}

class BillingService {
  async charge(order: Order) {
    // a dependency you cannot see from outside
    await Database.get().query('INSERT …', [order.id])
  }
}`,
        },
        after: {
          title: 'One instance, created once and injected',
          code: `class BillingService {
  constructor(private readonly db: Database) {}

  async charge(order: Order) {
    await this.db.query('INSERT …', [order.id])
  }
}

// main.ts: the composition root
const db = new Database(createPool(env.DATABASE_URL))
const billing = new BillingService(db)
const reports = new ReportJob(db)

// in a test
const sut = new BillingService(new FakeDatabase())`,
        },
        note: 'Still exactly one `Database`. The difference is that "one" is now a decision made in `main.ts`, visible in every constructor and replaceable in a test.',
      },
      {
        kind: 'figure',
        caption: 'The same single instance, reached two ways.',
        figure: {
          kind: 'split',
          left: {
            title: 'Singleton',
            tone: 'alert',
            nodes: [
              { label: 'Any class, anywhere', to: 'Database.get()' },
              { label: 'Database', sub: 'owns its own lifetime', tone: 'alert' },
            ],
            cost: 'Dependencies invisible; tests share state.',
          },
          right: {
            title: 'Composition root',
            tone: 'mastered',
            nodes: [
              { label: 'main.ts', sub: 'creates one Database', to: 'passes it in' },
              { label: 'BillingService, ReportJob', sub: 'take it as a constructor argument', tone: 'mastered' },
            ],
            cost: 'One more constructor parameter.',
          },
          verdict: 'Same instance count. Only one of them can be replaced in a test.',
        },
      },
      {
        kind: 'list',
        items: [
          '**Container scope.** Spring beans and NestJS providers are singleton-scoped by default: one instance per container, created by the container and injected. Ask for request scope when you need one per request.',
          '**Module scope.** A TypeScript module is evaluated once, so `export const pool = createPool()` is a de facto singleton. It is still global, but the dependency shows in the import and test runners can replace a module. Fine for a logger; risky for anything a test needs to swap per case.',
          '**A real singleton** is acceptable when the thing genuinely is one per process, such as Java\'s `Runtime.getRuntime()`. Even then, inject it where tests care.',
        ],
      },
      {
        kind: 'callout',
        tone: 'example',
        title: "Spring's singleton scope",
        text: 'Spring beans are singletons by default, yet Spring code is easy to test. The difference is who holds the instance: the application context creates one and hands it to constructors, and nothing fetches it through a static `getInstance()`. Start a second context in a test and you get a second, independent set.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: "I'd keep one connection pool per process, but I wouldn't make it a singleton. It's created once in `main` and injected, so every class declares that it needs a database and tests can pass a fake.",
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Defending singleton with "we only need one". Nobody disputes the one. The interviewer is waiting for you to separate "one instance" from "global access", and to name the hidden dependency and the test pain that the second one causes.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Make a lazy singleton thread-safe in Java.',
            a: "Simplest is an `enum` with one value, or a private static holder class whose field initialises when the holder is first touched; the class loader guarantees that runs once. Double-checked locking also works from Java 5, but only with the field marked `volatile`. I'd first ask whether it needs to be lazy at all.",
          },
          {
            q: "Your builder's `build()` can fail. Throw, or return a result?",
            a: 'If the inputs come from code, a failure is a programming bug: throw, at the line that built it. If they come from users or config, return a result with every validation error at once, so the caller can report them together. Either way, never hand back a half-valid object.',
          },
          {
            q: 'How do you make a builder enforce required fields at compile time?',
            a: "A step builder: each method returns a type exposing only the next legal step, so `build()` does not exist until the [[URL]] and method are set. It is a strong guarantee and a lot of types. I'd keep it for public library APIs, where misuse is expensive and the types are written once.",
          },
          {
            q: 'When is a global singleton actually acceptable?',
            a: 'When it holds no mutable state the rest of the program can observe, and nothing will ever need a second one, like a stateless logging facade. Even then I inject anything tests need to control. A clock is the classic case: "now" is global state in disguise.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-dp-builder-singleton-1',
        moduleId: 'dp-builder-singleton',
        stem: 'What does a builder give you that a TypeScript options object does not?',
        options: [
          'Named, optional parameters',
          'An immutable result',
          'Assembly staged across steps, with rules spanning several fields checked once at `build()`',
          'Faster object creation',
        ],
        correct: 2,
        explain: 'An options object already gives you names, optionality and, with `Readonly`, immutability. A builder adds a place for assembly to happen in steps, possibly across code, and one point where cross-field rules are enforced. If you need neither, the options object wins.',
      },
      {
        id: 'q-dp-builder-singleton-2',
        moduleId: 'dp-builder-singleton',
        stem: 'Why is classic double-checked locking broken in Java when the instance field is not `volatile`?',
        options: [
          'Two threads can both enter the synchronized block and create two instances',
          "Another thread can see a non-null reference before the constructor's writes are visible to it",
          'Synchronized blocks are not reentrant',
          'The garbage collector can reclaim the instance between the two checks',
        ],
        correct: 1,
        explain: "The second null check, inside the lock, already prevents a second creation. The bug is publication: without `volatile`, the reference can become visible before the object's fields are, so a thread skips the lock and uses a half-built object.",
      },
      {
        id: 'q-dp-builder-singleton-3',
        moduleId: 'dp-builder-singleton',
        stem: 'Tests pass one at a time but fail when run together. The code under test calls `Config.getInstance()`, and some tests change settings. What is the fix?',
        options: [
          'Run the tests serially',
          'Add a `reset()` method to the singleton and call it in every teardown',
          'Make `getInstance()` synchronized',
          'Pass a `Config` into the classes that need it, and build a fresh one per test',
        ],
        correct: 3,
        explain: 'The singleton carries state from one test into the next. Serial runs and `reset()` hide the leak rather than remove it, and synchronisation is unrelated. Injecting the config removes the global access point, so each test builds exactly the config it needs.',
      },
    ],
    cards: [
      {
        id: 'c-dp-builder-singleton-1',
        moduleId: 'dp-builder-singleton',
        front: 'When does a builder earn its place?',
        back: 'Many optional parts, rules that span fields checked once at `build()`, and an immutable result. For three plain fields, an options object is enough.',
        tag: 'Builder',
      },
      {
        id: 'c-dp-builder-singleton-2',
        moduleId: 'dp-builder-singleton',
        front: 'What is actually wrong with singleton?',
        back: 'The global access, not the single instance. It hides dependencies, leaks state between tests, and lazy creation can race.',
        tag: 'Singleton',
      },
      {
        id: 'c-dp-builder-singleton-3',
        moduleId: 'dp-builder-singleton',
        front: 'How do you keep one instance without a singleton?',
        back: 'Create it once at the composition root and inject it, or let the [[DI]] container scope it. Same instance, but visible and replaceable.',
        tag: 'Singleton',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'dp-adapter-facade-proxy',
    trackId: 'design-patterns',
    title: 'Adapter, facade and proxy',
    station: 4,
    prereqs: ['dp-builder-singleton'],
    minutes: 15,
    summary: 'Three wrappers, three intents: make it fit, make it simple, control access.',
    objectives: [
      'Wrap a third-party [[SDK]] in an adapter so vendor types never reach your domain',
      'Put one simple entry point over a subsystem without growing a god object',
      'Name four common kinds of proxy, and the cost each one hides',
      'Tell the three apart by intent and by the interface they expose',
    ],
    keywords: [
      'adapter pattern',
      'wrapper',
      'facade pattern',
      'proxy pattern',
      'lazy loading',
      'remote proxy',
      'caching proxy',
      'anti-corruption layer',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'All three wrap something else, and their class diagrams look nearly identical. That is why interviewers ask you to tell them apart: the answer is intent, not structure. An **adapter** changes an interface into the one you want. A **facade** puts a simpler interface over many objects. A **proxy** keeps the interface exactly and controls access to what is behind it.',
      },
      {
        kind: 'prose',
        text: 'They are also the patterns you will use most in a design round. Any prompt with a payment vendor, a storage service or a slow dependency has a seam where one of them belongs.',
      },
      { kind: 'heading', text: 'Adapter: make a foreign interface fit yours' },
      {
        kind: 'prose',
        text: "A vendor [[SDK]] speaks the vendor's language: its parameter names, its units, its error classes, its status strings. Call it straight from checkout and that language spreads through your domain. Switching vendors, or just testing without the network, then means touching every call site.",
      },
      {
        kind: 'prose',
        text: 'An adapter implements an interface you designed around your own needs, and translates to the vendor inside. The rest of the code depends on your interface, and only the adapter imports the vendor.',
      },
      {
        kind: 'figure',
        caption: 'Adapter: the client depends on your interface, and the adapter is the only class that knows the vendor.',
        figure: {
          kind: 'classes',
          classes: [
            {
              name: 'PaymentGateway',
              stereotype: 'interface',
              methods: ['charge(amount, card): Charge'],
              tone: 'line',
            },
            { name: 'StripeGateway', fields: ['stripe: Stripe'], methods: ['charge(amount, card): Charge'] },
            { name: 'Stripe', methods: ['paymentIntents.create(params)'], tone: 'neutral' },
            { name: 'Checkout', fields: ['gateway: PaymentGateway'], methods: ['pay(order, card)'] },
          ],
          relations: [
            { from: 'StripeGateway', to: 'PaymentGateway', kind: 'implements' },
            { from: 'StripeGateway', to: 'Stripe', kind: 'has', label: 'wraps and translates' },
            { from: 'Checkout', to: 'PaymentGateway', kind: 'has', label: 'injected' },
          ],
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Vendor details in the domain',
          code: `class Checkout {
  constructor(private stripe: Stripe) {}

  async pay(order: Order, card: string) {
    try {
      const pi = await this.stripe.paymentIntents.create({
        amount: order.total.minor,
        currency: order.total.currency.toLowerCase(),
        payment_method: card,
        confirm: true,
      })
      if (pi.status === 'succeeded') order.markPaid(pi.id)
    } catch (e) {
      if (e instanceof Stripe.errors.StripeCardError) {
        order.markDeclined(e.decline_code)
      } else throw e
    }
  }
}`,
        },
        after: {
          title: 'An adapter behind your own interface',
          code: `interface PaymentGateway {
  charge(amount: Money, card: string): Promise<Charge>
}
type Charge =
  | { ok: true; id: string }
  | { ok: false; reason: 'declined' | 'needs_action' }

class StripeGateway implements PaymentGateway {
  constructor(private stripe: Stripe) {}

  async charge(amount: Money, card: string): Promise<Charge> {
    try {
      const pi = await this.stripe.paymentIntents.create({
        amount: amount.minor, payment_method: card, confirm: true,
        currency: amount.currency.toLowerCase(),
      })
      return pi.status === 'succeeded'
        ? { ok: true, id: pi.id }
        : { ok: false, reason: 'needs_action' }
    } catch (e) {
      if (!(e instanceof Stripe.errors.StripeCardError)) throw e
      return { ok: false, reason: 'declined' }
    }
  }
}`,
        },
        note: "Checkout now takes a `PaymentGateway`. Units, casing, status strings and the vendor's error classes live in one class, and a test passes a ten-line fake.",
      },
      {
        kind: 'prose',
        text: 'Design the interface from your side. Build it as the union of what Stripe and Adyen can do and you have re-exported a vendor. Build it from what checkout needs and every vendor becomes an implementation detail. At the scale of whole systems the same idea is called an anti-corruption layer.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'InputStreamReader and Arrays.asList',
        text: "Java's standard library is full of adapters. `InputStreamReader` takes a byte-oriented `InputStream` and presents it as a character `Reader`, decoding with a charset on the way. `Arrays.asList(array)` presents an array as a `List` without copying it, which is why `set` writes through to the array but `add` throws: an array cannot grow.",
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'When not to use it',
        text: "If you own both sides, change one of them instead of adapting. And don't adapt one-to-one for its own sake: a wrapper that renames `paymentIntents.create` to `createPaymentIntent` and passes the vendor's types straight through has all the cost and none of the protection.",
      },
      { kind: 'heading', text: 'Facade: one door into a subsystem' },
      {
        kind: 'prose',
        text: 'Some jobs need several objects called in the right order, with the right cleanup. Placing an order touches inventory, payment, shipping and email, and if the payment fails the stock must go back. When every caller orchestrates that itself, the web handler, the mobile [[API]] and the admin tool each get it slightly wrong.',
      },
      {
        kind: 'prose',
        text: "A facade is one class with a small, task-shaped interface that does the orchestration. It doesn't lock the subsystem away: code that needs fine control can still go underneath. It makes the common path the easy one.",
      },
      {
        kind: 'figure',
        caption: 'Facade: callers see one task-shaped method, and the subsystem classes stay available underneath.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'OrderPlacement', methods: ['place(cart, card): PlaceResult'], tone: 'line' },
            { name: 'Inventory', methods: ['reserve(items)', 'release(hold)'] },
            { name: 'PaymentGateway', stereotype: 'interface', methods: ['charge(amount, card)'] },
            { name: 'Shipping', methods: ['schedule(order)'] },
            { name: 'OrderHandler', methods: ['post(req, res)'] },
          ],
          relations: [
            { from: 'OrderHandler', to: 'OrderPlacement', kind: 'uses', label: 'one call' },
            { from: 'OrderPlacement', to: 'Inventory', kind: 'uses' },
            { from: 'OrderPlacement', to: 'PaymentGateway', kind: 'uses' },
            { from: 'OrderPlacement', to: 'Shipping', kind: 'uses' },
          ],
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Every caller orchestrates',
          code: `// the web handler, and again in the admin tool
app.post('/orders', async (req, res) => {
  const cart = await carts.get(req.body.cartId)
  const hold = await inventory.reserve(cart.items)
  const charge = await payments.charge(cart.total, req.body.card)
  if (!charge.ok) {
    await inventory.release(hold) // forget this: lost stock
    return res.status(402).end()
  }
  const order = await orders.create(cart, charge.id)
  await shipping.schedule(order)
  await email.sendReceipt(order)
  res.status(201).json({ id: order.id })
})`,
        },
        after: {
          title: 'One task-shaped entry point',
          code: `class OrderPlacement {
  constructor(
    private inventory: Inventory, private payments: PaymentGateway,
    private orders: Orders, private shipping: Shipping,
    private email: Email,
  ) {}

  async place(cart: Cart, card: string): Promise<PlaceResult> {
    const hold = await this.inventory.reserve(cart.items)
    const charge = await this.payments.charge(cart.total, card)
    if (!charge.ok) {
      await this.inventory.release(hold)
      return { ok: false, reason: charge.reason }
    }
    const order = await this.orders.create(cart, charge.id)
    await this.shipping.schedule(order)
    await this.email.sendReceipt(order)
    return { ok: true, orderId: order.id }
  }
}

// every caller
const result = await placement.place(cart, req.body.card)`,
        },
        note: 'The compensation for a failed payment is written once. Each handler shrinks to parsing the request and mapping the result to a status code.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Multipart uploads',
        text: "Uploading a large file to [[S3]] properly means starting a multipart upload, sending the parts in parallel (each at least 5 [[MB]] except the last), collecting each part's ETag, completing the upload, and aborting it on failure so orphaned parts stop costing money. The [[AWS]] [[SDK]] for JavaScript wraps all of it in one facade, `new Upload({ client, params }).done()` from `@aws-sdk/lib-storage`. The low-level commands are still there when you need them.",
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'When not to use it',
        text: 'A facade over a single class is just a rename. And watch for the facade that starts making decisions: once `place()` grows pricing rules and fraud thresholds, it is a god service. Keep it to orchestration, and give each use case its own small facade rather than one `OrderManager` with forty methods.',
      },
      { kind: 'heading', text: 'Proxy: same interface, controlled access' },
      {
        kind: 'prose',
        text: 'A proxy implements exactly the interface of the object it stands in for, so the client cannot tell the two apart. What it adds is control over when, where or whether the real call happens. The [[GoF]] book lists virtual, remote and protection proxies plus a "smart reference" (reference counting, locking); in practice the fourth kind you will build is a cache.',
      },
      {
        kind: 'table',
        head: ['Kind', 'Controls', 'Real example'],
        rows: [
          [
            '**Virtual**',
            'When the real object is created: on first use',
            "Hibernate's lazy associations: `order.getCustomer()` returns a stand-in that queries on first access",
          ],
          [
            '**Remote**',
            'Where the call runs: in another process',
            'A [[gRPC]] client stub: `users.get(id)` reads like a local call and is a network round trip',
          ],
          [
            '**Protection**',
            'Whether this caller may make the call',
            'A wrapper that checks the caller\'s role before delegating to an admin service',
          ],
          [
            '**Caching**',
            'Whether the call is needed at all',
            'A memoising repository in process, or a [[CDN]] at the network edge',
          ],
        ],
      },
      {
        kind: 'figure',
        caption: 'Proxy: the proxy and the real object share one interface, and the proxy holds the real one.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'UserRepo', stereotype: 'interface', methods: ['find(id): User'], tone: 'line' },
            { name: 'PostgresUserRepo', methods: ['find(id): User'] },
            {
              name: 'CachingUserRepo',
              fields: ['inner: UserRepo', 'cache: Cache'],
              methods: ['find(id): User'],
            },
            { name: 'ProfileService', fields: ['repo: UserRepo'], methods: ['profile(id)'] },
          ],
          relations: [
            { from: 'PostgresUserRepo', to: 'UserRepo', kind: 'implements' },
            { from: 'CachingUserRepo', to: 'UserRepo', kind: 'implements' },
            { from: 'CachingUserRepo', to: 'UserRepo', kind: 'has', label: 'delegates on a miss' },
            { from: 'ProfileService', to: 'UserRepo', kind: 'has', label: 'cannot tell which' },
          ],
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Caching tangled into the service',
          code: `class ProfileService {
  constructor(private repo: UserRepo, private cache: Cache) {}

  async profile(id: string) {
    let user = await this.cache.get<User>('user:' + id)
    if (!user) {
      user = await this.repo.find(id)
      await this.cache.set('user:' + id, user, { ttlSec: 60 })
    }
    return toProfile(user)
  }
  // ...and the same five lines in every other read
}`,
        },
        after: {
          title: 'A caching proxy with the same interface',
          code: `interface UserRepo {
  find(id: string): Promise<User>
}

class CachingUserRepo implements UserRepo {
  constructor(private inner: UserRepo, private cache: Cache) {}

  async find(id: string): Promise<User> {
    const hit = await this.cache.get<User>('user:' + id)
    if (hit) return hit
    const user = await this.inner.find(id)
    await this.cache.set('user:' + id, user, { ttlSec: 60 })
    return user
  }
}

// wiring decides; ProfileService never changes
new ProfileService(new CachingUserRepo(pgRepo, redis))`,
        },
        note: 'The service is back to one job. Caching becomes a wiring decision: wrap the repository in production, pass the plain one to a test that needs fresh reads.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: "Spring's @Transactional",
        text: 'Spring implements `@Transactional` with a proxy: the bean injected into you is a stand-in that opens a transaction, calls the real method, then commits or rolls back. That explains a classic production bug. A method that calls another `@Transactional` method on `this` goes straight to the real object, skips the proxy, and runs without the transaction it declares.',
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'When not to use it',
        text: 'A proxy hides cost behind a familiar interface, and that is its danger. A remote proxy that looks local invites a loop of network calls. A lazy [[ORM]] association invites the N+1 problem: one query for the orders, then one per order for its customer. When the cost matters to the caller, make it visible in the interface with batch methods and explicit `async`.',
      },
      { kind: 'heading', text: 'Telling them apart' },
      {
        kind: 'table',
        head: ['', 'Adapter', 'Facade', 'Proxy'],
        rows: [
          ['**Intent**', 'Make it fit', 'Make it simple', 'Control access'],
          ['**What the client sees**', 'Your interface, never the vendor\'s', 'One small, task-shaped interface', 'The real interface, unchanged'],
          ['**Wraps**', 'One object', 'Several objects', 'One object'],
          ['**Typical case**', 'A vendor [[SDK]] behind `PaymentGateway`', '`OrderPlacement.place()`', 'Lazy entity, [[gRPC]] stub, cache'],
        ],
      },
      {
        kind: 'figure',
        caption: 'Which wrapper: start from what the client should see.',
        figure: {
          kind: 'decision',
          root: {
            question: "Should the client see exactly the wrapped object's interface?",
            yes: { answer: 'Proxy', sub: 'lazy, remote, protection or caching', tone: 'line' },
            no: {
              question: 'Are you wrapping one object whose interface does not fit?',
              yes: { answer: 'Adapter', sub: 'translate to your interface', tone: 'line' },
              no: { answer: 'Facade', sub: 'one simple entry over many objects', tone: 'line' },
            },
          },
          note: 'Same interface, but adding behaviour rather than controlling access, is a decorator: the next station.',
        },
      },
      {
        kind: 'callout',
        tone: 'say',
        text: "I'd put the Stripe client behind a `PaymentGateway` adapter, so checkout speaks our language and tests use a fake. Order placement gets a facade, because release-on-failure must not be duplicated across clients. And I'd add a caching proxy on the user repository only if reads show up as the bottleneck.",
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: "Calling all three \"a wrapper\". The structure is nearly the same, so the intent is the answer. Call the caching repository an adapter and the interviewer hears that you don't know whether the interface changed, which is the one question that separates them.",
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'What is the difference between a proxy and a decorator?',
            a: 'Structurally almost none: both implement the interface and hold the real object. A proxy controls access to its subject and often owns its lifecycle, creating it lazily or standing in for a remote one. A decorator adds behaviour, and clients stack decorators in whatever order they like. The next station covers decorator properly.',
          },
          {
            q: 'Your gateway must support Stripe and Adyen, but only Stripe has a feature you need. What now?',
            a: 'Keep the core interface to what checkout needs from every vendor, and expose the extra capability as a separate, optional interface that only the Stripe adapter implements. Callers check for the capability, never the vendor. Widening the core interface to the union of vendors turns it back into a vendor [[SDK]].',
          },
          {
            q: 'A remote proxy makes remote calls easy. Why is that dangerous?',
            a: 'Because it makes them look free. A network call can be slow, fail halfway, or succeed without you hearing back, and a local-looking interface invites loops that ignore all three. Good remote interfaces are coarse-grained and asynchronous, and they make timeouts and retries explicit.',
          },
          {
            q: 'Your facade has grown to forty methods. What went wrong?',
            a: 'It became the place every feature goes, so it couples unrelated callers and makes decisions it should only orchestrate. Split it by use case into small application services, push business rules down into the domain objects, and let each caller depend only on the slice it uses.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-dp-adapter-facade-proxy-1',
        moduleId: 'dp-adapter-facade-proxy',
        stem: "You wrap a vendor client so checkout calls `gateway.charge(money, card)` instead of the vendor's own method, translating units and errors inside. Which pattern is this?",
        options: ['Facade', 'Adapter', 'Proxy', 'Decorator'],
        correct: 1,
        explain: "It wraps one object and changes its interface to one you designed: an adapter. Facade is tempting because the result is simpler, but a facade sits over several objects. A proxy or a decorator would keep the vendor's interface unchanged.",
      },
      {
        id: 'q-dp-adapter-facade-proxy-2',
        moduleId: 'dp-adapter-facade-proxy',
        stem: 'Listing 100 orders runs 101 queries: one for the orders, then one per order for its customer. Which pattern is involved, and what is the fix?',
        options: [
          'A remote proxy; add retries with backoff to the customer lookup',
          'A facade; split it into one method per query',
          'A virtual proxy on the lazy association; load the customers in the same query, or in one batched query',
          "An adapter; map the ORM's entities to domain objects first",
        ],
        correct: 2,
        explain: 'Each lazy `customer` is a virtual proxy that queries on first access, so a loop over orders fires one query per row: the N+1 problem. The fix is to load what you know you need up front, with a join fetch or a single `IN` query. Retries and remapping leave the query count unchanged.',
      },
      {
        id: 'q-dp-adapter-facade-proxy-3',
        moduleId: 'dp-adapter-facade-proxy',
        stem: 'In a Spring bean, `placeOrder()` calls `this.audit()`, which is annotated `@Transactional`. `audit()` runs without a transaction. Why?',
        options: [
          'The call goes through `this`, the real object, so it skips the transactional proxy',
          '`@Transactional` only works on classes, not on methods',
          'Spring creates a new bean instance for every call',
          'Transactions cannot be nested, so the inner annotation is ignored',
        ],
        correct: 0,
        explain: 'Spring applies `@Transactional` through a proxy around the bean. Calls from other beans go through the proxy; a call on `this` is a plain method call on the real object, so no transaction starts. Move `audit()` to another bean, or call it through the injected proxy.',
      },
    ],
    cards: [
      {
        id: 'c-dp-adapter-facade-proxy-1',
        moduleId: 'dp-adapter-facade-proxy',
        front: 'Adapter, facade, proxy: one line each?',
        back: "Adapter changes one object's interface to fit yours. Facade gives a subsystem one simple entry point. Proxy keeps the interface and controls access.",
        tag: 'Structural',
      },
      {
        id: 'c-dp-adapter-facade-proxy-2',
        moduleId: 'dp-adapter-facade-proxy',
        front: 'What are four common kinds of proxy?',
        back: 'Virtual: create on first use. Remote: stand in for another process. Protection: check permission. Caching: skip repeated calls. Same interface every time.',
        tag: 'Proxy',
      },
      {
        id: 'c-dp-adapter-facade-proxy-3',
        moduleId: 'dp-adapter-facade-proxy',
        front: 'Why wrap a third-party SDK in an adapter?',
        back: 'Vendor types stay out of your domain, tests use a fake, and changing vendors touches one class.',
        tag: 'Adapter',
      },
    ],
  },
]
