import type { Module } from '../types'

/**
 * Track — Design patterns (DP), part 2: stations 5–9.
 * trackId: 'design-patterns'. Authoring rules: docs/superpowers/plans/2026-11-18-content-brief.md
 *
 * Every pattern here gets the same treatment: the problem it solves, a `classes` figure of
 * its structure, a TypeScript `codeCompare` (without → with), a named real-world case, and
 * when not to use it. The last station turns the same lens on anti-patterns.
 */
export const designPatterns2Modules: Module[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'dp-decorator-composite',
    trackId: 'design-patterns',
    title: 'Decorator and composite',
    station: 5,
    prereqs: ['dp-adapter-facade-proxy'],
    minutes: 15,
    summary: 'Wrap an object to add behaviour; let a whole tree answer like a single node.',
    objectives: [
      'Replace a subclass explosion with stacked decorators',
      'Recognise [[HTTP]] middleware, Java I/O streams and caching wrappers as decorators',
      'Tell a decorator from a proxy or an adapter by intent',
      'Model a part–whole tree so callers treat one item and many alike',
    ],
    keywords: [
      'decorator',
      'wrapper',
      'middleware',
      'subclass explosion',
      'composite',
      'part-whole hierarchy',
      'tree structure',
      'recursive structure',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Decorator and composite are two structural patterns built on one trick: **an object that implements the interface of the thing it holds**. A decorator holds one object and adds behaviour around it. A composite holds many and answers for all of them. Learn the trick once and both diagrams draw themselves.',
      },
      {
        kind: 'prose',
        text: 'In an interview they arrive as features, never as pattern names. "Add logging, caching and retries to this client, but not on every call" is a decorator. "Model a file system", "price an order that contains bundles" or "render a page made of components" is a composite. In both cases the interviewer is watching whether you reach for inheritance first, because in both cases inheritance is the wrong tool.',
      },
      {
        kind: 'figure',
        caption: 'Three optional features as subclasses and as decorators.',
        figure: {
          kind: 'split',
          left: {
            title: 'One subclass per combination',
            tone: 'alert',
            nodes: [
              { label: 'FetchClient', to: 'extended by' },
              { label: 'LoggingClient', to: 'extended by' },
              { label: 'RetryingLoggingClient', sub: 'and one for every other mix', tone: 'alert' },
            ],
            cost: 'Three features: up to eight classes, each welded to its parent.',
          },
          right: {
            title: 'One decorator per feature',
            tone: 'mastered',
            nodes: [
              { label: 'Retry', to: 'wraps' },
              { label: 'Logging', to: 'wraps' },
              { label: 'FetchClient', sub: 'unchanged', tone: 'mastered' },
            ],
            cost: 'Three features: three classes, combined at runtime in any order.',
          },
          verdict: 'Inheritance multiplies classes by combinations. Wrapping only adds them.',
        },
      },

      { kind: 'heading', text: 'Decorator: add behaviour by wrapping' },
      {
        kind: 'prose',
        text: 'Start with the problem. You have an `HttpClient` with one method, `send`. Some callers need every request logged. Some need retries on a timeout. The pricing service wants responses cached for a minute. Inheritance gives you one subclass per combination, chosen at compile time, and each is welded to its parent: `RetryingLoggingClient` cannot retry a test client or a different transport without being copied.',
      },
      {
        kind: 'prose',
        text: 'The move: a decorator **implements the same interface** as the object it wraps, holds a reference to it, and forwards each call, doing its own work before, after or instead of forwarding. Because the wrapper is itself an `HttpClient`, it can wrap another wrapper. Behaviour stacks at runtime and the core class never changes, which is the open/closed principle in its most literal form.',
      },
      {
        kind: 'figure',
        caption: 'Decorator: every wrapper is also an HttpClient, so wrappers stack on wrappers.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'HttpClient', stereotype: 'interface', methods: ['send(req): Promise<Res>'], tone: 'line' },
            { name: 'FetchClient', methods: ['send(req)'] },
            { name: 'RetryClient', fields: ['inner: HttpClient', 'attempts: number'], methods: ['send(req)'] },
            { name: 'LoggingClient', fields: ['inner: HttpClient', 'log: Logger'], methods: ['send(req)'] },
          ],
          relations: [
            { from: 'FetchClient', to: 'HttpClient', kind: 'implements' },
            { from: 'RetryClient', to: 'HttpClient', kind: 'implements' },
            { from: 'RetryClient', to: 'HttpClient', kind: 'has', label: 'wraps' },
            { from: 'LoggingClient', to: 'HttpClient', kind: 'implements' },
            { from: 'LoggingClient', to: 'HttpClient', kind: 'has', label: 'wraps' },
          ],
          note: 'The has-a arrow points at the interface, not at a concrete class. That is what lets any wrapper hold any other.',
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Without: a subclass per combination',
          code: `class FetchClient {
  send(req: Req): Promise<Res> {
    return fetch(req.url, req.init).then(toRes)
  }
}
class LoggingClient extends FetchClient {
  send(req: Req) {
    console.log(req.method, req.url)
    return super.send(req)
  }
}
class RetryingLoggingClient extends LoggingClient {
  async send(req: Req): Promise<Res> {
    try { return await super.send(req) }
    catch { return super.send(req) }
  }
}
// Retry without logging? Another class.
// The same stack over a fake client? Copy it.`,
        },
        after: {
          title: 'With: decorators stacked at runtime',
          code: `interface HttpClient {
  send(req: Req): Promise<Res>
}
class LoggingClient implements HttpClient {
  constructor(private inner: HttpClient) {}
  send(req: Req) {
    console.log(req.method, req.url)
    return this.inner.send(req)
  }
}
class RetryClient implements HttpClient {
  constructor(private inner: HttpClient, private n = 3) {}
  async send(req: Req): Promise<Res> {
    for (let i = 1; ; i++) {
      try { return await this.inner.send(req) }
      catch (e) { if (i >= this.n) throw e }
    }
  }
}
const client = new RetryClient(
  new LoggingClient(new FetchClient()))`,
        },
        note: 'Each concern is one class that knows nothing about the others. Any combination is one line, and a test can wrap a fake.',
      },
      {
        kind: 'prose',
        text: 'Two things in that last line are the design. First, **the order of wrapping is behaviour**. Retry outside logging logs every attempt; logging outside retry logs once per call. A cache belongs outermost, so a hit returns before any retry or network work. Second, the stack is built **in one place**, a factory or the composition root, so the order is decided once instead of being rediscovered by every caller.',
      },
      {
        kind: 'prose',
        text: 'In TypeScript you will often write a decorator as a higher-order function rather than a class: a function that takes a handler and returns a handler of the same type. Same pattern, less ceremony. Go\'s `net/http` middleware is exactly this shape, `func(next http.Handler) http.Handler`, and so is most server middleware that does work on both sides of the call.',
      },
      {
        kind: 'code',
        code: `type Handler = (req: Req) => Promise<Res>

const withTiming = (next: Handler): Handler =>
  async (req) => {
    const start = performance.now()
    try {
      return await next(req)
    } finally {
      metrics.observe('http_ms', performance.now() - start)
    }
  }

const handler = withAuth(withTiming(routes))`,
        caption: 'A decorator as a function. It takes a Handler and returns one, so decorators compose.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Java I/O streams',
        text: 'The Java standard library is the textbook case. `new BufferedReader(new InputStreamReader(new GZIPInputStream(new FileInputStream(path))))` is four layers over one file: read bytes, decompress, decode to characters, buffer into lines. `GZIPInputStream` is a decorator: an `InputStream` that holds an `InputStream`. `InputStreamReader` is the odd one out, because it turns a byte stream into a character `Reader`. It changes the interface, so strictly it is an adapter. Instead of a class for every mix of compression, buffering and encoding, the library ships a few small classes you stack.',
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'Not to be confused with TypeScript\'s `@decorator` syntax, which annotates a class or method when it is defined. The pattern is about composing objects at runtime. They share a name and a spirit, nothing more.',
      },

      { kind: 'heading', text: 'When not to decorate' },
      {
        kind: 'list',
        items: [
          '**The interface is wide.** Wrapping a 30-method interface to change one method means 29 methods of pure forwarding, and every method later added to the interface has to be added to every decorator. Narrow the interface first, or wrap only the narrow one the caller actually uses.',
          '**Identity matters.** A wrapped object is not `===` the original, and `instanceof FetchClient` is false for the wrapper. Code that checks concrete types, or uses objects as map keys, breaks quietly.',
          '**There is only one combination.** If every client always gets logging and retries, write both into the one class. Decorators earn their keep when the combinations vary.',
          '**Nobody owns the stack.** Six decorators assembled inline in five places will be assembled in five different orders. If you cannot point at the one place the stack is built, you have a bug waiting to happen.',
        ],
      },

      { kind: 'heading', text: 'Decorator, proxy or adapter?' },
      {
        kind: 'prose',
        text: 'Decorator has two close relatives from the previous station, and the code for all three can be identical: a class that implements an interface and holds an object. **The difference is intent.** A decorator adds behaviour the caller chose, and you stack them. A proxy controls access to one real object — creating it lazily, calling it over the network, checking permissions — and the caller usually does not know it is there. An adapter exists because two interfaces do not match.',
      },
      {
        kind: 'figure',
        caption: 'Three wrappers with the same shape. Tell them apart by what they are for, not by the code.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Does the wrapper change the interface?',
            yes: { answer: 'Adapter', sub: 'translates one interface into another' },
            no: {
              question: 'Does it stand in for the real object: create it lazily, reach it remotely, or guard it?',
              yes: { answer: 'Proxy', sub: 'lazy load, remote stub, permission check' },
              no: {
                question: 'Does it add behaviour the caller opts into, stackable in any order?',
                yes: { answer: 'Decorator', sub: 'logging, caching, retries', tone: 'line' },
                no: { answer: 'Plain delegation', sub: 'no pattern needed' },
              },
            },
          },
        },
      },
      {
        kind: 'prose',
        text: 'Caching is the honest borderline. A caching wrapper that callers stack alongside logging and retries is a decorator. A caching stand-in that infrastructure slips in where callers never see it is usually called a proxy; Spring\'s `@Cacheable` works by wrapping your bean in one. Say that the line is blurry and name which you mean. That is a stronger answer than either label on its own.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Calling every wrapper a decorator. If it changes the interface, it is an adapter. If it stands in for the real object — creating it lazily, reaching it over the network, guarding access — it is a proxy. The structure is the same, so naming the intent is the only way to show you understand the difference, and it is exactly the follow-up an interviewer asks.',
      },

      { kind: 'heading', text: 'Composite: treat one and many alike' },
      {
        kind: 'prose',
        text: 'Now the second shape. A folder contains files and folders. A page contains panels that contain buttons. An order contains items and bundles of items. Every operation on these trees — total size, render, price — has to deal with "is this one thing or a group of things?". Without a pattern, every caller answers that question itself, with the same double loop copied into each one.',
      },
      {
        kind: 'prose',
        text: 'Composite gives the leaf and the container **the same interface**. The container holds a list of children typed as that interface and implements each operation by asking its children and combining their answers. The caller calls `size()` on whatever it holds, and recursion does the rest, however deep the tree goes.',
      },
      {
        kind: 'figure',
        caption: 'Composite: a folder is a node that holds nodes, so a whole tree answers the same calls as one file.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'FsNode', stereotype: 'interface', methods: ['size(): number', 'name(): string'], tone: 'line' },
            { name: 'File', fields: ['bytes: number'], methods: ['size(): number'] },
            {
              name: 'Folder',
              fields: ['children: FsNode[]'],
              methods: ['size(): number', 'add(node: FsNode)'],
            },
          ],
          relations: [
            { from: 'File', to: 'FsNode', kind: 'implements' },
            { from: 'Folder', to: 'FsNode', kind: 'implements' },
            { from: 'Folder', to: 'FsNode', kind: 'has', label: 'children, any depth' },
          ],
          note: '`add` lives on Folder only. A file is never asked to hold anything.',
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Without: every caller walks the structure',
          code: `class File { constructor(public bytes: number) {} }
class Folder {
  files: File[] = []
  folders: Folder[] = []
}
function size(f: Folder): number {
  let total = 0
  for (const file of f.files) total += file.bytes
  for (const sub of f.folders) total += size(sub)
  return total
}
// count(), search() and render() each repeat
// this double loop. A new node type, a symlink,
// means a third list in every one of them.`,
        },
        after: {
          title: 'With: the tree answers for itself',
          code: `interface FsNode {
  size(): number
}
class File implements FsNode {
  constructor(private bytes: number) {}
  size() { return this.bytes }
}
class Folder implements FsNode {
  private children: FsNode[] = []
  add(n: FsNode) { this.children.push(n); return this }
  size(): number {
    return this.children
      .reduce((sum, c) => sum + c.size(), 0)
  }
}
const root = new Folder()
  .add(new File(120))
  .add(new Folder().add(new File(80)))
root.size() // 200, and the caller never asked which`,
        },
        note: 'A symlink becomes one new class that implements size(). No caller changes.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'The DOM and React',
        text: 'The browser\'s [[DOM]] is a composite. An element and a run of text are both `Node`s, an element holds child nodes, and `element.textContent` on a `<div>` returns the text of every descendant without you walking the tree. React is the same shape one level up: a component returns elements whose children are elements, so `<Page>` and `<Button>` render through the same call, and a whole screen is one node with a deep subtree. Unix made the same choice for files — a directory is a file whose contents list other files — which is why `du` and `find` walk any tree with one rule.',
      },

      { kind: 'heading', text: 'When composite is the wrong tree' },
      {
        kind: 'list',
        items: [
          '**Leaves and groups share almost nothing.** Forcing one interface creates methods that cannot be honoured, like `file.add(child)` that throws. That is the transparency-versus-safety trade-off, and safety wins: put `add` on the container only. The code that builds a tree knows the types; the code that walks it stays uniform.',
          '**Operations grow faster than node types.** With a class per node type, every new operation edits every class. In TypeScript a discriminated union plus one recursive function per operation inverts that cost. Pick by which axis changes more often.',
          '**It is not actually a tree.** A component reused in two places, or a hard link in a file system, is a shared child, and naive recursion counts it twice. Composite assumes a tree. If it is a [[DAG]], say so and track what you have visited.',
          '**Depth and cost.** Recomputing `size()` walks the whole subtree on every call. On a large tree, cache the total on each folder and invalidate up the parent chain when a child changes.',
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'I would model this as a composite: `File` and `Folder` share an `FsNode` interface, a folder answers by combining its children, and `add` lives only on the folder, so a file can never be asked to hold anything. Code that walks the tree never asks which kind of node it has.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'How is a decorator different from a proxy? The code looks the same.',
            a: 'Structurally they are identical: same interface, holds the real object, forwards calls. The difference is intent. A decorator adds behaviour the client chose and is stacked by the client. A proxy controls access to the subject — lazy creation, a remote call, a permission check — and the client usually does not know it is there.',
          },
          {
            q: 'Your stack has caching, retries and logging. In what order, and why?',
            a: 'Cache outermost, so a hit returns before any retry or network work. Retry next, wrapping only the call that can fail transiently. Logging innermost if you want a line per attempt, or outside retry for a line per call. Then build the stack in one factory so the order is decided once.',
          },
          {
            q: 'Where should add(child) live: on the shared interface or only on the container?',
            a: 'On the container. Putting it on the interface makes every node look uniform but forces leaves to throw, so a leaf is no longer safely substitutable. The code that builds a tree already knows the types; only the code that walks it needs the uniform interface.',
          },
          {
            q: 'Folder.size() is slow on a tree with a million files. What do you do?',
            a: 'Cache the total on each folder and invalidate upwards: a changed child tells its parent, which clears its cache and tells its own parent. That needs a parent pointer, so the tree is no longer a pure value. It is the usual cache trade-off: reads get cheap, and every write now has to know what it invalidates.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-dp-decorator-composite-1',
        moduleId: 'dp-decorator-composite',
        stem: 'Different callers need logging, retries and caching on an `HttpClient`, in different combinations. What is the best design?',
        options: [
          'A subclass of the client for each combination',
          'One client class with a boolean flag per feature',
          'A decorator per concern, each implementing `HttpClient` and wrapping another one',
          'An abstract base class with overridable hooks for logging, retry and caching',
        ],
        correct: 2,
        explain:
          'Decorators give one class per concern and combine at runtime in any order. Subclasses give a class per combination, fixed at compile time. Flags put every concern in one class that changes whenever any of them does. Hooks fix both the set of concerns and their order in the base class.',
      },
      {
        id: 'q-dp-decorator-composite-2',
        moduleId: 'dp-decorator-composite',
        stem: 'A wrapper implements the same interface as the object it holds, creates that object only on first use, and callers never know it is there. Which pattern is it?',
        options: ['Decorator', 'Adapter', 'Composite', 'Proxy'],
        correct: 3,
        explain:
          'Deciding when the real object is created is controlling access to it, which is a proxy\'s job. In code it looks exactly like a decorator; the difference is intent. An adapter would change the interface, and a composite holds many children rather than one subject.',
      },
      {
        id: 'q-dp-decorator-composite-3',
        moduleId: 'dp-decorator-composite',
        stem: 'In a file-system composite, both `File` and `Folder` implement `FsNode`. What goes wrong if you put `add(child)` on `FsNode`?',
        options: [
          '`File` has to throw or silently ignore it, so a file is no longer safely substitutable for a node',
          'Recursion over the tree stops working',
          'TypeScript interfaces cannot declare mutating methods',
          'Folders can no longer contain other folders',
        ],
        correct: 0,
        explain:
          'Uniformity costs safety: every leaf now carries a method it cannot honour. Keep `add` on the container. The code that builds a tree knows the types, and the code that walks it stays uniform through `size()` and friends.',
      },
    ],
    cards: [
      {
        id: 'c-dp-decorator-composite-1',
        moduleId: 'dp-decorator-composite',
        front: 'What problem does the decorator pattern solve?',
        back: 'Optional behaviours that combine. One wrapper per concern, each implementing the same interface and holding the next, stacked at runtime: three classes instead of eight subclasses.',
        tag: 'Decorator',
      },
      {
        id: 'c-dp-decorator-composite-2',
        moduleId: 'dp-decorator-composite',
        front: 'Decorator, proxy, adapter: how do you tell them apart?',
        back: 'By intent. An adapter changes the interface. A proxy controls access to the real object. A decorator adds behaviour the caller chose, and stacks.',
        tag: 'Decorator',
      },
      {
        id: 'c-dp-decorator-composite-3',
        moduleId: 'dp-decorator-composite',
        front: 'What does the composite pattern let a caller do?',
        back: 'Treat one item and a whole tree the same way. The container implements the shared interface by asking its children and combining the answers.',
        tag: 'Composite',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'dp-strategy-state',
    trackId: 'design-patterns',
    title: 'Strategy and state',
    station: 6,
    prereqs: ['dp-decorator-composite'],
    related: ['a-multistep'],
    minutes: 13,
    summary: 'The same shape in code. The difference is who chooses the next behaviour.',
    objectives: [
      'Replace a growing `switch` on type with an injected strategy',
      'Model a lifecycle as state objects that own their transitions',
      'Explain why the two look identical and differ in who picks the behaviour',
      'Know when an enum and a transition table beat both',
    ],
    keywords: [
      'strategy',
      'state',
      'state machine',
      'policy',
      'algorithm family',
      'order lifecycle',
      'transition table',
      'switch on type',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Strategy and state are the two patterns most likely to come up in a low-level design round, because almost every prompt contains either a rule that varies (pricing, routing, matching, scoring) or a thing with a lifecycle (an order, a vending machine, an elevator, a parking ticket). Spot which one you have in the first five minutes and half the class diagram draws itself.',
      },
      {
        kind: 'prose',
        text: 'They also produce a classic follow-up: "isn\'t that just strategy?" On paper the two are identical — an interface, several implementations, and a context that holds one and delegates to it. The difference is **who decides which implementation is active, and when**. Getting that sentence right is worth more than the diagram.',
      },
      {
        kind: 'figure',
        caption: 'Strategy is picked by the caller and stays put. State replaces itself as events arrive.',
        figure: {
          kind: 'split',
          left: {
            title: 'Strategy',
            tone: 'line',
            nodes: [
              { label: 'Caller', sub: 'config, contract, test', to: 'injects' },
              { label: 'PercentOff(20)', to: 'used by' },
              { label: 'Checkout', sub: 'never swaps it' },
            ],
            cost: 'Chosen from outside, usually once.',
          },
          right: {
            title: 'State',
            tone: 'line',
            nodes: [
              { label: 'Pending', to: 'pay()' },
              { label: 'Paid', to: 'ship()' },
              { label: 'Shipped', sub: 'chosen by the state before it' },
            ],
            cost: 'Changes from inside, on every event.',
          },
          verdict: 'Same boxes on paper. A strategy is chosen by the client; a state chooses its own successor.',
        },
      },

      { kind: 'heading', text: 'Strategy: inject the part that varies' },
      {
        kind: 'prose',
        text: 'Pricing at checkout: a regular price, a percentage sale, ten percent off orders of ten or more, a negotiated rate for a corporate customer. The first version is an `if`. By the fourth it is a `switch` in the middle of `Checkout` that every pricing change edits, that every checkout test has to exercise, and that two teams both think they own.',
      },
      {
        kind: 'prose',
        text: 'The move: put each rule behind **one interface**. The context, `Checkout`, holds a reference typed as that interface and calls it. Something outside — configuration, the customer\'s contract, an experiment — decides which implementation to inject. A new rule is a new class. `Checkout` does not change, and its tests do not grow.',
      },
      {
        kind: 'figure',
        caption: 'Strategy: the context holds the interface, each rule is a class, and the caller picks one.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'PricingStrategy', stereotype: 'interface', methods: ['price(cart): number'], tone: 'line' },
            { name: 'RegularPricing', methods: ['price(cart)'] },
            { name: 'PercentOff', fields: ['pct: number'], methods: ['price(cart)'] },
            { name: 'ContractPricing', fields: ['rate: number'], methods: ['price(cart)'] },
            { name: 'Checkout', fields: ['pricing: PricingStrategy'], methods: ['total(cart): number'] },
          ],
          relations: [
            { from: 'RegularPricing', to: 'PricingStrategy', kind: 'implements' },
            { from: 'PercentOff', to: 'PricingStrategy', kind: 'implements' },
            { from: 'ContractPricing', to: 'PricingStrategy', kind: 'implements' },
            { from: 'Checkout', to: 'PricingStrategy', kind: 'has', label: 'injected' },
          ],
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Without: a switch every rule edits',
          code: `type Plan = 'regular' | 'sale' | 'bulk' | 'contract'

class Checkout {
  total(cart: Cart, plan: Plan, c: Customer) {
    const sum = cart.subtotal()
    switch (plan) {
      case 'regular': return sum
      case 'sale': return sum * 0.8
      case 'bulk':
        return cart.count() >= 10 ? sum * 0.9 : sum
      case 'contract':
        return sum * (1 - c.contractRate)
    }
  }
}
// Rule five edits Checkout, its tests, and
// every caller that passes a Plan.`,
        },
        after: {
          title: 'With: one class per rule, injected',
          code: `interface PricingStrategy {
  price(cart: Cart): number
}
const regular: PricingStrategy = {
  price: (cart) => cart.subtotal(),
}
class PercentOff implements PricingStrategy {
  constructor(private pct: number) {}
  price(cart: Cart) {
    return cart.subtotal() * (1 - this.pct / 100)
  }
}
class Checkout {
  constructor(private pricing: PricingStrategy) {}
  total(cart: Cart) { return this.pricing.price(cart) }
}
// The caller decides, from config or contract:
new Checkout(new PercentOff(20)).total(cart)`,
        },
        note: 'In TypeScript a strategy is often just a function, as `regular` shows. Reach for a class when the rule has its own configuration or more than one method.',
      },
      {
        kind: 'prose',
        text: 'Routing is the same shape at a larger scale. A maps service offers fastest, shortest or avoid-tolls; a load balancer offers round-robin, least-connections or consistent hashing. Each algorithm is a strategy, because the rest of the system — request handling, health checks, the response — must not care which one runs.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Comparator, Passport and Nginx',
        text: 'Java\'s `list.sort(Comparator.comparing(Order::total))` passes the comparison into the sort as a strategy; the sorting algorithm never changes. Passport.js, the Node.js authentication library, calls its plug-ins strategies outright: `passport.use(new GoogleStrategy(…))` adds a login method behind one interface. Nginx exposes its load-balancing strategies as one directive in an `upstream` block, `least_conn` or `ip_hash`, with round-robin as the default.',
      },

      { kind: 'heading', text: 'State: let the object change its own behaviour' },
      {
        kind: 'prose',
        text: 'An order is pending, paid, shipped or cancelled, and what `cancel()` means depends on which. Pending: just cancel. Paid: cancel and refund. Shipped: refuse, and point at the returns flow. Without a pattern, every method opens with a `switch` on `status`, and the rules for any one status are scattered across every method in the class.',
      },
      {
        kind: 'prose',
        text: 'The move: make each state **a class that implements one interface**, with a method per event. The context, `Order`, holds its current state and forwards every event to it. The state handles the event and **chooses the next state itself**, by calling back into the context. Everything about "paid" now lives in one class.',
      },
      {
        kind: 'figure',
        caption: 'State: the order delegates to its current state, and each state decides what comes next.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'OrderState', stereotype: 'interface', methods: ['pay(o)', 'ship(o)', 'cancel(o)'], tone: 'line' },
            { name: 'Pending', methods: ['pay(o)', 'cancel(o)'] },
            { name: 'Paid', methods: ['ship(o)', 'cancel(o)'] },
            { name: 'Shipped', methods: ['cancel(o): refuses'] },
            { name: 'Order', fields: ['state: OrderState'], methods: ['moveTo(next)', 'pay()', 'ship()', 'cancel()'] },
          ],
          relations: [
            { from: 'Pending', to: 'OrderState', kind: 'implements' },
            { from: 'Paid', to: 'OrderState', kind: 'implements' },
            { from: 'Shipped', to: 'OrderState', kind: 'implements' },
            { from: 'Order', to: 'OrderState', kind: 'has', label: 'current' },
            { from: 'Paid', to: 'Order', kind: 'uses', label: 'moveTo(new Shipped())' },
          ],
          note: 'The arrow back from Paid to Order is the whole difference from strategy: the state drives the swap.',
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Without: every method switches on status',
          code: `type Status = 'pending' | 'paid' | 'shipped' | 'cancelled'

class Order {
  status: Status = 'pending'
  cancel() {
    switch (this.status) {
      case 'pending':
        this.status = 'cancelled'; break
      case 'paid':
        refund(this); this.status = 'cancelled'; break
      case 'shipped':
        throw new Error('shipped: start a return')
    }
  }
  ship() {
    if (this.status !== 'paid') throw new Error('unpaid')
    this.status = 'shipped'
  }
  // pay() and deliver() repeat the switch, and
  // every guard is a chance to forget a status.
}`,
        },
        after: {
          title: 'With: each state owns its transitions',
          code: `interface OrderState {
  pay(o: Order): void
  ship(o: Order): void
  cancel(o: Order): void
}
class Paid implements OrderState {
  pay() { throw new Error('already paid') }
  ship(o: Order) { o.moveTo(new Shipped()) }
  cancel(o: Order) {
    refund(o)
    o.moveTo(new Cancelled())
  }
}
class Order {
  private state: OrderState = new Pending()
  moveTo(next: OrderState) { this.state = next }
  pay() { this.state.pay(this) }
  ship() { this.state.ship(this) }
  cancel() { this.state.cancel(this) }
}`,
        },
        note: 'A returned state is one new class, plus edits to exactly the states that can lead to it — which are the transitions you are adding anyway.',
      },
      {
        kind: 'prose',
        text: 'Before any of that code, put the lifecycle on the whiteboard as a table: states down the side, events across the top, the outcome in each cell. Every awkward cell is a question for the interviewer — can a shipped order be cancelled? — and asking it is a senior signal. The vending machine, a favourite prompt, is the same exercise: idle, has-credit, dispensing and out-of-stock each answer `insertCoin()`, `select()` and `refund()` differently.',
      },
      {
        kind: 'table',
        head: ['State', 'pay', 'ship', 'cancel'],
        rows: [
          ['**Pending**', '→ Paid', 'refuse', '→ Cancelled'],
          ['**Paid**', 'refuse', '→ Shipped', 'refund, → Cancelled'],
          ['**Shipped**', 'refuse', 'refuse', 'refuse: start a return'],
          ['**Cancelled**', 'refuse', 'refuse', 'no-op'],
        ],
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Stripe PaymentIntents',
        text: 'Stripe\'s [[API]] models every payment as a state machine. A PaymentIntent moves through `requires_payment_method`, `requires_confirmation`, `requires_action` (for 3-D Secure), `processing` and, with manual capture, `requires_capture`, and ends in `succeeded` or `canceled`. Capture is only legal from `requires_capture`; try it from anywhere else and you get a `payment_intent_unexpected_state` error rather than a surprise. That is the guarantee the State pattern gives you in-process: an event that is wrong for the current state is refused in one obvious place.',
      },

      { kind: 'heading', text: 'Same code, different question: who chooses?' },
      {
        kind: 'prose',
        text: 'Put the two class diagrams side by side and they match box for box. What differs is who swaps the object, and why.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Strategy',
          points: [
            'The client picks the implementation, usually once',
            'Strategies do not know the others exist',
            'Swapping is configuration: per customer, per request, per test',
            'Answers "how should this be done?"',
          ],
        },
        right: {
          title: 'State',
          points: [
            'The current state picks the next one, on each event',
            'States know their successors; that is the transition graph',
            'Swapping is behaviour: it happens because something happened',
            'Answers "what is allowed now?"',
          ],
        },
        verdict: 'If the context replaces its own implementation in response to events, it is state. If someone outside sets it and walks away, it is strategy. They also combine: a Paid state can use a refund strategy chosen per payment provider.',
      },

      { kind: 'heading', text: 'When neither is worth it' },
      {
        kind: 'list',
        items: [
          '**Two cases that will stay two.** A ternary is clearer than an interface and two classes. The tell is a list of variants that keeps growing, not the mere existence of an `if`.',
          '**A strategy that needs everything.** If the interface ends up taking the whole context because each implementation reads different fields, the variation is not one algorithm. Find the real seam first.',
          '**States that only gate transitions.** If a state changes which events are legal but not what the methods do, an enum and a transition table are shorter, can be tested cell by cell, and persist as one column. Most order lifecycles are exactly this.',
          '**Persistence.** The database stores `status = \'paid\'`, not an object, so you rebuild the state object from that column on every load. The enum exists anyway; make sure the two cannot disagree.',
        ],
      },
      {
        kind: 'code',
        code: `type Status = 'pending' | 'paid' | 'shipped' | 'cancelled'
type Action = 'pay' | 'ship' | 'cancel'

const next: Record<Status, Partial<Record<Action, Status>>> = {
  pending: { pay: 'paid', cancel: 'cancelled' },
  paid: { ship: 'shipped', cancel: 'cancelled' },
  shipped: {},
  cancelled: {},
}

function apply(s: Status, a: Action): Status {
  const to = next[s][a]
  if (!to) throw new Error(\`cannot \${a} when \${s}\`)
  return to
}`,
        caption: 'The table is the state machine. It persists as one column, and every cell can be tested.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'This is state rather than strategy, because the order changes its own behaviour as events arrive and nobody outside picks it. I would start with an enum and a transition table, and promote a state to its own class only when its behaviour, not just the transitions it allows, differs from the others.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Drawing five state classes and an interface for a lifecycle that a lookup table describes completely. It reads as pattern-matching, not design. The stronger answer names the State pattern, says why you are not using it yet, and says what would change your mind.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'How do you persist an order whose behaviour lives in state objects?',
            a: 'Persist the name, not the object: a `status` column, mapped back to a state object on load by a small factory. Guard the transition in the database too — `UPDATE orders SET status = \'shipped\' WHERE id = $1 AND status = \'paid\'` — so two workers cannot both ship the same order. Zero rows updated means someone else got there first.',
          },
          {
            q: 'Who should create the strategy: Checkout or its caller?',
            a: 'The caller, or a factory the caller uses. If `Checkout` builds its own strategy from a flag, the `switch` has just moved into the constructor. Injecting it also lets checkout tests pass a fixed-price strategy and stop caring about pricing rules.',
          },
          {
            q: 'Can a strategy hold state?',
            a: 'Its own configuration, yes: the 20 in `PercentOff(20)`. Per-call state, no, if one instance is shared across requests, or two concurrent checkouts will see each other\'s data. Keep strategies immutable and a single instance can safely serve every request.',
          },
          {
            q: 'When does a lifecycle outgrow the State pattern?',
            a: 'When it has parallel states (shipped, and separately disputed), timers (cancel if unpaid after 30 minutes), or must survive a restart halfway through a transition. Then reach for a statechart library such as XState, or a durable workflow engine such as Temporal, which persists the state and the timers for you.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-dp-strategy-state-1',
        moduleId: 'dp-strategy-state',
        stem: 'An `Order` starts out pending. After `pay()` it rejects `pay()` and accepts `ship()`. Nothing outside the order swapped anything. Which pattern describes this?',
        options: [
          'Strategy, because each status is a different algorithm',
          'State, because the object changes its own behaviour in response to events',
          'Template method, because the steps of an order are fixed',
          'Observer, because the payment notifies the order',
        ],
        correct: 1,
        explain:
          'The behaviour changed from inside, triggered by an event, and the current state chose its successor: that is state. Strategy has the same classes but is chosen from outside and normally stays put.',
      },
      {
        id: 'q-dp-strategy-state-2',
        moduleId: 'dp-strategy-state',
        stem: 'A `switch` on pricing plan inside `Checkout` has six cases and is edited every sprint. What is the strongest refactor?',
        options: [
          'Move the switch into a `PricingService` so Checkout gets smaller',
          'Replace the plan string with an enum so the compiler checks every case',
          'Add a subclass of `Checkout` for each plan',
          'Put each rule behind a `PricingStrategy` interface and inject the one the customer needs',
        ],
        correct: 3,
        explain:
          'Strategy isolates each rule and stops pricing changes touching Checkout. Moving the switch only relocates it; an enum improves exhaustiveness but still edits one file per rule; subclassing Checkout welds pricing to everything else Checkout does.',
      },
      {
        id: 'q-dp-strategy-state-3',
        moduleId: 'dp-strategy-state',
        stem: 'An order lifecycle has five statuses. Each status only changes which actions are allowed; no method behaves differently otherwise. What do you build?',
        options: [
          'Five state classes behind an `OrderState` interface',
          'A strategy per status, chosen by the caller',
          'An enum and a transition table, checked in one function',
          'A separate service per status, called over the network',
        ],
        correct: 2,
        explain:
          'When states only gate transitions, a table is shorter, can be tested exhaustively, and persists as one column. Promote states to classes when their behaviour, not just which transitions are legal, starts to differ.',
      },
    ],
    cards: [
      {
        id: 'c-dp-strategy-state-1',
        moduleId: 'dp-strategy-state',
        front: 'Strategy or state: what is the one-line difference?',
        back: 'Who picks the object. A strategy is chosen from outside and stays; a state replaces itself from inside as events arrive.',
        tag: 'Strategy',
      },
      {
        id: 'c-dp-strategy-state-2',
        moduleId: 'dp-strategy-state',
        front: 'What is the tell for the strategy pattern?',
        back: 'A rule that varies by customer, region or config, and a list of variants that keeps growing. Put the rule behind one interface and inject it.',
        tag: 'Strategy',
      },
      {
        id: 'c-dp-strategy-state-3',
        moduleId: 'dp-strategy-state',
        front: 'When does an enum and transition table beat the State pattern?',
        back: 'When states only decide which transitions are legal. The table persists as one column and every cell can be tested.',
        tag: 'State',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'dp-observer',
    trackId: 'design-patterns',
    title: 'Observer and pub/sub',
    station: 7,
    prereqs: ['dp-strategy-state'],
    related: ['c-queues', 'a-realtime'],
    minutes: 15,
    summary: 'Tell many listeners something happened without knowing who they are, in-process or through a broker.',
    objectives: [
      'Implement observer with a typed subscribe that returns its own unsubscribe',
      'Name the classic failures: leaks, hidden ordering and slow synchronous listeners',
      'Tell in-process observer from broker-based pub/sub, and say what the broker costs',
      'Walk from a class diagram to Kafka and event-driven systems in two steps',
    ],
    keywords: [
      'observer',
      'pub/sub',
      'publish subscribe',
      'event emitter',
      'listener',
      'event bus',
      'memory leak',
      'Kafka',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Observer is the pattern that grows into architecture. In a low-level design round it is how a parking lot tells the display board a space has freed up. In a system design round the same idea, moved behind a broker, is how an order service tells billing, email and analytics that an order was placed. Interviewers like it because one question can travel from a class diagram to Kafka in two follow-ups.',
      },
      {
        kind: 'prose',
        text: 'Most candidates can draw the classes. What separates answers is knowing how it fails: the leak from a forgotten unsubscribe, the ordering nobody promised, the one slow listener that makes every request slow. And knowing what changes, for better and worse, when the listeners move to another machine.',
      },
      {
        kind: 'figure',
        caption: 'Observer: listeners register once, and the subject calls each of them in turn when something happens.',
        figure: {
          kind: 'sequence',
          actors: ['Order', 'Email', 'Inventory'],
          steps: [
            { from: 1, to: 0, label: 'subscribe(fn)' },
            { from: 2, to: 0, label: 'subscribe(fn)' },
            { from: 0, to: 0, label: 'order placed' },
            { from: 0, to: 1, label: 'fn(order)', tone: 'line' },
            { from: 1, to: 0, label: 'returns', dashed: true },
            { from: 0, to: 2, label: 'fn(order)', tone: 'line' },
            { from: 2, to: 0, label: 'returns', dashed: true },
          ],
          note: 'One after another, on the caller\'s thread. The caller of place() waits until the last listener returns.',
        },
      },

      { kind: 'heading', text: 'The pattern, in-process' },
      {
        kind: 'prose',
        text: 'The problem: one object changes and several others need to react, but the first should not know who they are. Without the pattern, `place()` calls the mailer, the stock service and analytics directly. Every new reaction is an edit to the order code, its constructor and its tests, and the order service ends up depending on half the system.',
      },
      {
        kind: 'prose',
        text: 'The move: the subject keeps **a list of listeners** and calls each one when something happens. Listeners register themselves. The subject depends only on the listener type, so new reactions are added from outside without touching it.',
      },
      {
        kind: 'figure',
        caption: 'Observer: the topic knows only a list of listeners, and the order service knows only the topic.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'Listener<T>', stereotype: 'interface', methods: ['(event: T): void'], tone: 'line' },
            {
              name: 'Topic<T>',
              fields: ['listeners: Set<Listener<T>>'],
              methods: ['subscribe(fn): () => void', 'emit(event: T)'],
            },
            { name: 'OrderService', fields: ['placed: Topic<Order>'], methods: ['place(cart): Order'] },
            { name: 'ReceiptMailer', methods: ['onPlaced(order)'] },
            { name: 'StockReserver', methods: ['onPlaced(order)'] },
          ],
          relations: [
            { from: 'Topic<T>', to: 'Listener<T>', kind: 'has', label: 'many' },
            { from: 'OrderService', to: 'Topic<T>', kind: 'uses', label: 'emit' },
            { from: 'ReceiptMailer', to: 'Topic<T>', kind: 'uses', label: 'subscribe' },
            { from: 'StockReserver', to: 'Topic<T>', kind: 'uses', label: 'subscribe' },
          ],
          note: 'Arrows point at the topic, never at the order service. Nothing the order service depends on knows about receipts.',
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Without: the order knows every reaction',
          code: `class OrderService {
  constructor(
    private email: ReceiptMailer,
    private stock: StockReserver,
    private analytics: Analytics,
  ) {}
  place(cart: Cart) {
    const order = Order.from(cart)
    this.email.sendReceipt(order)
    this.stock.reserve(order.items)
    this.analytics.track('order', order.id)
    // Loyalty points next sprint: edit this
    // class, its constructor and its tests.
    return order
  }
}`,
        },
        after: {
          title: 'With: the order announces, listeners subscribe',
          code: `type Listener<T> = (event: T) => void

class Topic<T> {
  private listeners = new Set<Listener<T>>()
  subscribe(fn: Listener<T>) {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }
  emit(event: T) {
    for (const fn of this.listeners) fn(event)
  }
}

const placed = new Topic<Order>()
placed.subscribe((o) => email.sendReceipt(o))
placed.subscribe((o) => stock.reserve(o.items))
// OrderService now does one thing: placed.emit(order)`,
        },
        note: 'subscribe returns its own undo. Whoever subscribed holds the only handle that can unsubscribe, so cleanup is never a lookup.',
      },
      {
        kind: 'prose',
        text: 'Two flavours. **Push** sends the data with the notification, `emit(order)`. **Pull** sends only "something changed" and lets each listener read what it needs from the subject. Push is simpler and the default. Pull suits a large subject where each listener wants a different slice, or where the payload is expensive to build and most listeners ignore it.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Node.js EventEmitter and the browser',
        text: 'Node.js `EventEmitter` is observer, and it ships with a leak detector: add an eleventh listener for one event and Node prints `MaxListenersExceededWarning: Possible EventEmitter memory leak detected`, because that is almost always a subscribe inside a loop or a request handler with no matching unsubscribe. The browser\'s [[DOM]] `addEventListener` is the same pattern, and React\'s `useEffect` lets you return a cleanup function precisely so a component unsubscribes when it unmounts.',
      },

      { kind: 'heading', text: 'Three ways observer goes wrong' },
      {
        kind: 'list',
        items: [
          '**Leaks from forgotten unsubscribes.** The subject holds a strong reference to every listener, and a listener closure holds whatever it captured: a component, a request, a screen\'s worth of data. Forget to unsubscribe and none of it can be garbage collected. This is the lapsed listener problem, the most common leak in long-running UI and server code.',
          '**Ordering you never promised.** Listeners run in subscription order, which is an accident of start-up code. The moment one depends on another having run — stock reserved before the receipt says "in stock" — you have hidden coupling that reordering two imports will break. If order matters, it is a pipeline, not an observer. Make it explicit.',
          '**Slow synchronous listeners.** `emit` calls each listener on the caller\'s thread and waits. One listener making a 300 ms [[HTTP]] call makes every order 300 ms slower, and one that throws stops the loop, so the listeners after it never hear about the order at all.',
          '**Re-entrancy, the bonus fourth.** A listener that emits on the same topic, or unsubscribes while the loop is running, can recurse forever or skip a neighbour. Iterate over a copy, and queue nested events until the current dispatch finishes.',
        ],
      },
      {
        kind: 'figure',
        caption: 'Synchronous observers run back to back on the caller\'s thread, so the slowest listener sets everyone\'s latency.',
        figure: {
          kind: 'timeline',
          ticks: ['0 ms', '100 ms', '200 ms', '300 ms', '400 ms'],
          lanes: [
            { label: 'Email listener', bars: [{ from: 0, to: 0.75, label: 'provider call, 300 ms', tone: 'alert' }] },
            { label: 'Stock listener', bars: [{ from: 0.75, to: 0.8, tone: 'neutral' }] },
            { label: 'Analytics listener', bars: [{ from: 0.8, to: 0.85, tone: 'neutral' }] },
            {
              label: 'place()',
              bars: [{ from: 0, to: 0.85, label: 'caller waits', tone: 'streak' }],
              outcome: { label: '340 ms', tone: 'alert' },
            },
          ],
          note: 'Have the email listener enqueue a job instead, and place() returns in about 40 ms. Same listeners, same order.',
        },
      },
      {
        kind: 'prose',
        text: 'The fixes are cheap, and an interviewer expects you to name them. Return an unsubscribe handle and call it on teardown. Catch per listener so one failure cannot silence the rest. Do slow work by enqueueing it, so the listener returns in microseconds. Weak references (`WeakRef` in JavaScript) are sometimes offered as the cure for leaks, but they trade a leak for listeners that vanish whenever the collector runs. Prefer explicit ownership.',
      },
      {
        kind: 'code',
        code: `emit(event: T) {
  // Copy first: a listener may unsubscribe mid-loop.
  for (const fn of [...this.listeners]) {
    try {
      fn(event)
    } catch (err) {
      // One broken listener must not silence the rest.
      log.error('listener failed', err)
    }
  }
}`,
        caption: 'A safer emit: iterate over a copy, and isolate each listener\'s failure.',
      },

      { kind: 'heading', text: 'Pub/sub: the same idea through a broker' },
      {
        kind: 'prose',
        text: 'Observer decouples the subject from its listeners in every way but one: they share a process. The subject holds the list, calls each listener directly, and if the process dies halfway through the loop, half the listeners never hear. **Pub/sub** puts a broker in the middle. Publishers send to a topic, subscribers read from it, neither knows the other exists, and neither needs to be running at the same moment.',
      },
      {
        kind: 'figure',
        caption: 'The same intent, two deployments: a list of callbacks in one process, or a durable topic between many.',
        figure: {
          kind: 'split',
          left: {
            title: 'Observer, in-process',
            tone: 'neutral',
            nodes: [
              { label: 'Subject', to: 'direct call' },
              { label: 'Listeners', sub: 'same process, same thread' },
            ],
            cost: 'Microseconds, but synchronous, and lost on a crash.',
          },
          right: {
            title: 'Pub/sub, through a broker',
            tone: 'line',
            nodes: [
              { label: 'Publisher', to: 'append' },
              { label: 'Topic', sub: 'Kafka: a durable log', tone: 'line', to: 'poll' },
              { label: 'Consumer groups', sub: 'each at its own offset' },
            ],
            cost: 'Durable and independent, but asynchronous, at-least-once, and a cluster to run.',
          },
          verdict: 'The broker buys durability, independent scaling and independent deploys. It charges latency, duplicates and operations.',
        },
      },
      {
        kind: 'table',
        head: ['', 'Observer', 'Pub/sub'],
        rows: [
          ['**Subscriber list kept by**', 'The subject', 'The broker'],
          ['**Delivery**', 'A synchronous call', 'An asynchronous message'],
          ['**Subscriber offline**', 'Misses the event', 'Reads it on return, if retained'],
          ['**Subscriber throws**', 'Can break the publisher', 'Isolated; retried or dead-lettered'],
          ['**Ordering**', 'Subscription order', 'Per partition at best'],
          ['**Latency**', 'Microseconds', 'Milliseconds'],
        ],
      },
      {
        kind: 'prose',
        text: 'Kafka is observer with the subscriber list turned inside out. The broker does not keep callbacks and push to them; it keeps an append-only log per partition, and each consumer group remembers its own offset in that log. A new subscriber is a new consumer group, and it can start from the beginning of the retained log, which no in-process observer can offer. Ordering holds within a partition, so you key events by the entity whose order matters, usually its id.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Why Kafka exists',
        text: 'LinkedIn built Kafka around 2010 and open-sourced it in 2011 to move activity events — page views, searches, profile updates — from the services that produced them to the many systems that consumed them: search indexing, recommendations, monitoring, the data warehouse. That is observer\'s "one producer, many unknown listeners" shape, made durable and spread across machines. Event-driven architecture is the same idea applied between teams: the order service publishes `OrderPlaced`, and billing, email and analytics each subscribe without the order service knowing they exist.',
      },
      {
        kind: 'prose',
        text: 'The broker trades observer\'s failures for distributed ones. Delivery is at least once, so consumers must be idempotent. There is no global order, only per partition. And the publisher can no longer know when everyone has reacted, so anything that must finish before you reply to the user cannot be a subscriber. Name those costs when you make the move.',
      },

      { kind: 'heading', text: 'Choosing, and when not to' },
      {
        kind: 'figure',
        caption: 'Choose by where the listeners live and whether an event is allowed to be lost.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Do the listeners live in the publisher\'s process?',
            yes: {
              question: 'Is every listener fast and safe to run inline?',
              yes: { answer: 'Observer', sub: 'synchronous, in-process', tone: 'line' },
              no: { answer: 'Observer that enqueues', sub: 'emit fast, do the work on a worker' },
            },
            no: {
              question: 'Must an event survive a listener being down?',
              yes: { answer: 'Durable broker', sub: 'Kafka, or an [[SQS]] queue per subscriber', tone: 'mastered' },
              no: { answer: 'Fire-and-forget pub/sub', sub: 'Redis pub/sub: offline listeners miss it' },
            },
          },
        },
      },
      {
        kind: 'list',
        items: [
          '**One listener that will stay one.** A direct call is clearer, and it shows up when you search for usages. Observer hides the call graph; that is its cost in every codebase.',
          '**The reaction is required.** If a failed stock reservation must fail the order, reserving stock is a step, not a listener. Observer is for "and also"; required work is "and then", and belongs in the main flow where its failure is handled.',
          '**Chains of events.** A emits, B reacts and emits, C reacts and emits. Past two hops nobody can say what placing an order actually does. For multi-step flows, prefer an explicit orchestrator.',
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'In-process I would use observer with an unsubscribe handle and an emit that isolates failures. Across services I would publish an `OrderPlaced` event to Kafka keyed by order id, so each consumer reads at its own pace and events for one order stay in order. The cost is that consumers become eventually consistent and must handle duplicates.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Saying "we will use pub/sub" and stopping. The next three questions are always the same: what happens when a consumer is down, what happens when a message arrives twice, and can events for one order arrive out of order? Have the answers ready: retention, idempotent consumers, a partition key.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'How would you find an observer memory leak in production?',
            a: 'Take heap snapshots over time: the subject\'s listener count climbs, and the retained objects hang off its listener set. Node warns at the eleventh listener per event by default. The fix is structural: subscribe returns an unsubscribe handle, and whatever owns the listener\'s lifetime — a component, a request scope — calls it on teardown.',
          },
          {
            q: 'One listener throws. What should happen to the others?',
            a: 'They should still run. Wrap each call, log and count the failure, and carry on, because one broken analytics hook must not stop receipts. If the publisher needs to know about the failure, it was never a listener; make it an explicit step.',
          },
          {
            q: 'When would you move from in-process events to Kafka?',
            a: 'When the reactions belong to other services or teams, when they must survive the publisher crashing, or when they are slow enough to need their own scaling. Not before: a broker turns a function call into a cluster, at-least-once duplicates and eventual consistency.',
          },
          {
            q: 'How do you save the order and publish the event atomically?',
            a: 'You cannot commit to Postgres and Kafka in one transaction, so use the outbox: write the event to an `outbox` table in the same transaction as the order, and a relay publishes those rows to Kafka. Consumers still deduplicate, because the relay can publish a row twice.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-dp-observer-1',
        moduleId: 'dp-observer',
        stem: 'A dashboard widget subscribes to a price feed when it mounts. After an hour of users navigating between screens, memory keeps climbing. What is the most likely cause?',
        options: [
          'The price feed is sending too many events',
          'Unmounted widgets are never unsubscribed, so the feed\'s listener set keeps them alive',
          'Closures cannot be garbage collected',
          'Listeners should be stored in an array rather than a Set',
        ],
        correct: 1,
        explain:
          'The lapsed listener problem: the subject holds a strong reference to each listener, and each listener holds its widget. Return an unsubscribe handle and call it on unmount. Closures are collected as soon as nothing references them; here something still does.',
      },
      {
        id: 'q-dp-observer-2',
        moduleId: 'dp-observer',
        stem: 'Placing an order takes 400 ms, and 350 ms of that is one listener sending the receipt email. What is the best fix?',
        options: [
          'Have the listener enqueue an email job and return immediately',
          'Reorder the listeners so the email one runs last',
          'Raise the timeout on the order request',
          'Replace the observer with direct calls',
        ],
        correct: 0,
        explain:
          'Synchronous listeners add their latency to the caller. Enqueueing moves the slow work off the request path and keeps emit fast. Reordering only changes which listeners wait, not how long the caller waits, and direct calls are just as synchronous.',
      },
      {
        id: 'q-dp-observer-3',
        moduleId: 'dp-observer',
        stem: 'What does pub/sub through a broker give you that an in-process observer cannot?',
        options: [
          'A guaranteed global order across all events',
          'Exactly-once delivery by default',
          'Lower latency for each notification',
          'Subscribers that can be offline, scale on their own, and replay events they missed',
        ],
        correct: 3,
        explain:
          'A broker decouples publisher and subscriber in time and in deployment. It costs latency, orders events only per partition, and delivers at least once, so consumers must be idempotent.',
      },
    ],
    cards: [
      {
        id: 'c-dp-observer-1',
        moduleId: 'dp-observer',
        front: 'What is the lapsed listener problem?',
        back: 'The subject holds strong references to its listeners, so a forgotten unsubscribe keeps the listener, and everything it captured, alive. Make subscribe return an unsubscribe handle.',
        tag: 'Observer',
      },
      {
        id: 'c-dp-observer-2',
        moduleId: 'dp-observer',
        front: 'Observer or pub/sub: what is the difference?',
        back: 'Observer: the subject calls its listeners directly, in-process and synchronously. Pub/sub: a broker sits between, so neither side knows the other or must be running.',
        tag: 'Observer',
      },
      {
        id: 'c-dp-observer-3',
        moduleId: 'dp-observer',
        front: 'How does Kafka keep the events for one order in order?',
        back: 'Order holds only within a partition. Key every event by order id, so all of one order\'s events land in the same partition.',
        tag: 'Pub/sub',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'dp-command-template-chain',
    trackId: 'design-patterns',
    title: 'Command, template method and chain of responsibility',
    station: 8,
    prereqs: ['dp-observer'],
    related: ['a-longrunning'],
    minutes: 15,
    summary: 'Requests as values, algorithms with hooks, and handlers in a line.',
    objectives: [
      'Turn an action into a command that can be queued, logged and undone',
      'Use template method for a fixed flow with variable steps, and know when composition wins',
      'Build a chain of handlers that can pass a request on or stop it',
      'Say when middleware is a chain and when it is a decorator',
    ],
    keywords: [
      'command',
      'undo redo',
      'job queue',
      'template method',
      'hook',
      'chain of responsibility',
      'middleware',
      'approval chain',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Three behavioural patterns, each answering a different question. **Command**: what if a request were a value you could store, send and reverse? **Template method**: what if an algorithm\'s skeleton is fixed but some of its steps vary? **Chain of responsibility**: what if several handlers might deal with a request, and the sender should not know which one will?',
      },
      {
        kind: 'prose',
        text: 'They arrive in interviews as features. "Add undo" is command; so is "run this later on a worker". "Support three import sources through the same validation flow" is template method. "Expenses over $10,000 need a director" or "add authentication and rate limiting to every endpoint" is a chain.',
      },

      { kind: 'heading', text: 'Command: a request you can hold' },
      {
        kind: 'prose',
        text: 'A text editor\'s toolbar calls `doc.insert()` and `doc.remove()` directly. Now add undo. Each action needs to remember what it changed and how to reverse it, and the history needs a list of things that happened, but a method call leaves nothing behind to put in a list. Once it has returned, it is gone.',
      },
      {
        kind: 'prose',
        text: 'The move: wrap each action in **an object with `execute()` and `undo()`**. The object captures everything it needs to do and to reverse the action: the position, the inserted text, the text it deleted. An invoker runs commands and pushes them onto a history stack. Undo pops one and calls `undo()`; redo keeps a second stack. And because a command is a value, you can also queue it, serialise it, retry it or log it.',
      },
      {
        kind: 'figure',
        caption: 'Command: each action is an object that can do and undo itself, and the history just stacks them.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'Command', stereotype: 'interface', methods: ['execute(): void', 'undo(): void'], tone: 'line' },
            { name: 'Insert', fields: ['at: number', 'text: string'], methods: ['execute()', 'undo()'] },
            { name: 'Delete', fields: ['from: number', 'to: number', 'removed: string'], methods: ['execute()', 'undo()'] },
            { name: 'History', fields: ['done: Command[]', 'undone: Command[]'], methods: ['run(c)', 'undo()', 'redo()'] },
            { name: 'Doc', methods: ['insert(at, text)', 'remove(from, to)'] },
          ],
          relations: [
            { from: 'Insert', to: 'Command', kind: 'implements' },
            { from: 'Delete', to: 'Command', kind: 'implements' },
            { from: 'History', to: 'Command', kind: 'has', label: 'two stacks' },
            { from: 'Insert', to: 'Doc', kind: 'uses', label: 'receiver' },
            { from: 'Delete', to: 'Doc', kind: 'uses', label: 'receiver' },
          ],
          note: 'Delete stores the text it removed. A command can only undo what it remembered.',
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Without: actions as method calls',
          code: `class Toolbar {
  constructor(private doc: Doc) {}
  onType(at: number, text: string) {
    this.doc.insert(at, text)
  }
  onDelete(from: number, to: number) {
    this.doc.remove(from, to)
  }
  onUndo() {
    // Undo what? Nothing recorded what happened,
    // what was deleted, or in which order.
  }
}`,
        },
        after: {
          title: 'With: actions as objects on two stacks',
          code: `interface Command { execute(): void; undo(): void }
class Insert implements Command {
  constructor(private doc: Doc,
              private at: number,
              private text: string) {}
  execute() { this.doc.insert(this.at, this.text) }
  undo() {
    this.doc.remove(this.at, this.at + this.text.length)
  }
}
class History {
  private done: Command[] = []
  private undone: Command[] = []
  run(c: Command) {
    c.execute(); this.done.push(c); this.undone = []
  }
  undo() {
    const c = this.done.pop()
    if (c) { c.undo(); this.undone.push(c) }
  }
  redo() {
    const c = this.undone.pop()
    if (c) { c.execute(); this.done.push(c) }
  }
}`,
        },
        note: 'Running a new command clears the redo stack. That one assignment is the whole definition of redo in most editors.',
      },
      {
        kind: 'prose',
        text: 'The same move powers job queues. A job is a command written down as data, such as `{ type: \'resize-image\', imageId: 42, width: 800 }`, pushed onto a queue and executed by a worker on another machine, possibly minutes later. Retries, dead-letter queues, scheduling and audit logs all follow from one fact: the request is a value, not a call in progress.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Sidekiq and Celery',
        text: 'Background-job libraries are command queues. In Sidekiq, `ResizeImageJob.perform_async(42)` writes the job\'s class name and arguments to Redis as JSON, and a worker process later rebuilds the command and calls `perform`. Celery does the same for Python tasks. Both tell you to pass small, simple arguments — an id, not an object — because a command that will be written down and run somewhere else must carry only what survives serialisation.',
      },
      {
        kind: 'list',
        items: [
          '**Not for effects in the world.** You cannot un-send an email or un-charge a card. The undo is a new command, a refund, with its own failure modes. Model the compensation explicitly instead of pretending to reverse.',
          '**Not for its own sake.** If nothing queues, logs, retries or undoes it, a command object is a function call with extra steps.',
          '**Not when inverses are expensive.** If reversing an action is costly to compute, such as a filter over a large image, keep a snapshot from before it. That is the memento pattern, and real editors mix the two.',
        ],
      },

      { kind: 'heading', text: 'Template method: a fixed skeleton with hooks' },
      {
        kind: 'prose',
        text: 'Data importers: one from Shopify, one from an uploaded spreadsheet, one from a partner\'s feed. Each fetches, parses, validates, saves in batches and reports. The order of steps and the error handling are identical; only fetching and parsing differ. Copy the flow three times and the next fix to validation lands in two of them.',
      },
      {
        kind: 'prose',
        text: 'The move: put the skeleton in **one base-class method** that calls abstract or overridable steps. Subclasses fill in the steps; they do not get to change the order. This is the Hollywood principle, "don\'t call us, we\'ll call you": the base class owns the flow and calls down into the subclass. A step with a sensible default that subclasses may override is called a hook.',
      },
      {
        kind: 'figure',
        caption: 'Template method: the base class owns run(), and subclasses supply the steps it calls.',
        figure: {
          kind: 'classes',
          classes: [
            {
              name: 'Importer<Raw>',
              stereotype: 'abstract',
              methods: ['run(): Report', 'fetch(): Raw', 'parse(raw): Row[]', 'valid(row): boolean'],
              tone: 'line',
            },
            { name: 'ShopifyImport', methods: ['fetch()', 'parse(raw)'] },
            { name: 'SheetImport', fields: ['file: string'], methods: ['fetch()', 'parse(raw)'] },
            { name: 'PartnerFeedImport', methods: ['fetch()', 'parse(raw)', 'valid(row)'] },
          ],
          relations: [
            { from: 'ShopifyImport', to: 'Importer<Raw>', kind: 'inherits' },
            { from: 'SheetImport', to: 'Importer<Raw>', kind: 'inherits' },
            { from: 'PartnerFeedImport', to: 'Importer<Raw>', kind: 'inherits' },
          ],
          note: 'Only PartnerFeedImport overrides the valid() hook. The others take the default.',
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Without: the same flow, copied',
          code: `class ShopifyImport {
  async run() {
    const raw = await shopify.orders()
    const rows = raw.map(toRow)
    const ok = rows.filter(isValid)
    await db.insertBatched(ok)
    return { saved: ok.length }
  }
}
class SheetImport {
  async run() {
    const raw = await readSheet(this.file)
    const rows = parseCsv(raw)
    const ok = rows.filter(isValid)
    await db.insert(ok)   // batching forgotten here
    return { saved: ok.length }
  }
}`,
        },
        after: {
          title: 'With: one skeleton, steps filled in',
          code: `abstract class Importer<Raw> {
  // The skeleton. Subclasses never override this.
  async run() {
    const raw = await this.fetch()
    const rows = this.parse(raw).filter((r) => this.valid(r))
    await db.insertBatched(rows)
    return { saved: rows.length }
  }
  protected abstract fetch(): Promise<Raw>
  protected abstract parse(raw: Raw): Row[]
  // A hook: a sensible default, overridable.
  protected valid(r: Row) { return isValid(r) }
}
class SheetImport extends Importer<string> {
  constructor(private file: string) { super() }
  protected fetch() { return readSheet(this.file) }
  protected parse(raw: string) { return parseCsv(raw) }
}`,
        },
        note: 'TypeScript has no `final`, so nothing stops a subclass overriding run(). Say so; in Java you would mark it final.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'JUnit, AbstractList and React classes',
        text: 'JUnit 3\'s `TestCase` was template method in its purest form: you overrode `setUp` and `tearDown`, and `runBare` called them around each test. Java\'s `AbstractList` asks you for just `get` and `size`, and builds iteration, `indexOf`, `contains` and `equals` on top of them. React class components worked the same way: `componentDidMount`, `render` and `componentWillUnmount` are hooks that a lifecycle you do not control calls at the right moment.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Template method (inheritance)',
          points: [
            'Skeleton in the base class, steps in subclasses',
            'Each combination of steps is another subclass',
            'Steps can reach protected state: convenient, and coupling',
            'Reorder two steps in the base and every subclass may break',
          ],
        },
        right: {
          title: 'Steps passed in (composition)',
          points: [
            'Skeleton in a class that receives its steps',
            'Any fetcher pairs with any parser at construction',
            'Steps see only what they are passed',
            'Each step is testable on its own',
          ],
        },
        verdict: 'Template method suits frameworks, where the hooks are few and stable. In application code, when more than one step varies, pass the steps in: `new Importer(fetcher, parser)` is the same skeleton without a subclass per combination.',
      },

      { kind: 'heading', text: 'Chain of responsibility: handlers in a line' },
      {
        kind: 'prose',
        text: 'Expense approvals: up to $1,000 a manager signs off, up to $10,000 a director, and anything larger goes to finance. Without a pattern, the submitting code holds the whole rule in an `if` ladder, and the org chart is baked into it. Every reorganisation is a code change in the wrong place.',
      },
      {
        kind: 'prose',
        text: 'The move: give every handler **the same interface and a reference to the next one**. A handler either deals with the request or passes it along. The sender talks to the head of the chain and never learns who answered. The chain is assembled in one place, from configuration if you like, so reordering it is a data change rather than an edit to the logic.',
      },
      {
        kind: 'figure',
        caption: 'Chain of responsibility: each link either decides or hands the request to the next link.',
        figure: {
          kind: 'classes',
          classes: [
            { name: 'Handler', stereotype: 'interface', methods: ['handle(e): Decision'], tone: 'line' },
            {
              name: 'Link',
              stereotype: 'abstract',
              fields: ['next?: Handler'],
              methods: ['handle(e)', 'canHandle(e)', 'decide(e)'],
            },
            { name: 'ManagerApproval', methods: ['canHandle(e): up to $1,000'] },
            { name: 'DirectorApproval', methods: ['canHandle(e): up to $10,000'] },
            { name: 'FinanceApproval', methods: ['canHandle(e): always'] },
          ],
          relations: [
            { from: 'Link', to: 'Handler', kind: 'implements' },
            { from: 'Link', to: 'Handler', kind: 'has', label: 'next' },
            { from: 'ManagerApproval', to: 'Link', kind: 'inherits' },
            { from: 'DirectorApproval', to: 'Link', kind: 'inherits' },
            { from: 'FinanceApproval', to: 'Link', kind: 'inherits' },
          ],
          note: 'FinanceApproval always handles, so nothing falls off the end of the chain.',
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Without: the org chart in an if ladder',
          code: `function approverFor(e: Expense): Approver {
  if (e.amount <= 1_000) return e.team.manager
  if (e.amount <= 10_000) return e.team.director
  if (e.category === 'travel' && e.amount <= 25_000)
    return travelDesk
  return finance
}
// "Contractors always go to legal" is another
// branch here, and its position in the ladder
// silently decides what it overrides.`,
        },
        after: {
          title: 'With: links that decide or pass on',
          code: `interface Handler {
  handle(e: Expense): Decision
}
abstract class Link implements Handler {
  constructor(private next?: Handler) {}
  handle(e: Expense): Decision {
    return this.canHandle(e)
      ? this.decide(e)
      : this.next?.handle(e) ?? { status: 'rejected' }
  }
  protected abstract canHandle(e: Expense): boolean
  protected abstract decide(e: Expense): Decision
}
class ManagerApproval extends Link {
  protected canHandle(e: Expense) { return e.amount <= 1_000 }
  protected decide(e: Expense) { return approve(e.team.manager) }
}
const chain = new ManagerApproval(
  new DirectorApproval(new FinanceApproval()))`,
        },
        note: 'Link is itself a template method: handle() is the skeleton, canHandle() and decide() the steps. Patterns compose, and that is normal.',
      },
      {
        kind: 'list',
        items: [
          '**One handler always answers and the rule is a lookup.** A map from category to approver is clearer than a chain you have to walk in your head.',
          '**Nobody handles it.** A chain without a terminal handler silently drops requests. Always end with one that answers: a rejection with a reason, or a route to a human.',
          '**Long chains.** Each request walks the links in order, and after ten of them nobody knows which one answered. Log the handler that took each request, and past a few dozen rules use a rules table instead.',
        ],
      },

      { kind: 'heading', text: 'Middleware: chain or decorator?' },
      {
        kind: 'prose',
        text: 'Middleware pipelines are the chain everyone has used. In Express each middleware receives `(req, res, next)`: call `next()` to pass the request along, or send a response and stop. An authentication middleware that finds no session answers `401`, and the route handler never runs.',
      },
      {
        kind: 'figure',
        caption: 'A chain stops where a link decides: the rate limiter answers 429 and the handler never runs.',
        figure: {
          kind: 'sequence',
          actors: ['Client', 'Auth', 'Rate limit', 'Handler'],
          steps: [
            { from: 0, to: 1, label: 'GET /orders' },
            { from: 1, to: 1, label: 'session valid' },
            { from: 1, to: 2, label: 'next()' },
            { from: 2, to: 2, label: 'over the limit' },
            { from: 2, to: 0, label: '429 Too Many Requests', tone: 'alert', dashed: true },
          ],
          note: 'The handler column stays empty. Putting cheap rejections first means rejected requests cost the least.',
        },
      },
      {
        kind: 'prose',
        text: 'But middleware is also the decorator from three stations back. Koa\'s `async (ctx, next) => { const t = Date.now(); await next(); log(Date.now() - t) }` wraps the rest of the pipeline and does work on both sides of it, which is a decorator. **The test is whether a link can stop the request.** If it can, it is acting as a chain link. If every link always forwards and adds behaviour around the call, it is a decorator stack. Most frameworks give you both in one signature.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Servlet filters and OkHttp interceptors',
        text: 'A Java servlet filter receives a `FilterChain` and calls `chain.doFilter(request, response)` to pass the request on, or writes a response and returns to stop it. OkHttp, the [[HTTP]] client widely used on Android, runs every call through a list of interceptors that each call `chain.proceed(request)`; that is how logging, authentication headers and response caching plug in without anyone editing the client.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Middleware is a chain when a link can stop the request, as authentication does, and a decorator when every link wraps the rest and forwards, as timing does. I would build auth and rate limiting as short-circuiting links, put them first so rejected requests cost the least, and end the chain with a handler that always answers.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Promising undo by "reversing the operation" for everything. A delete is only reversible if the command saved what it deleted, and a sent email is not reversible at all. Say what each command stores in order to undo itself, and name the actions that need a compensating command instead.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'The undo history grows without limit. What do you do?',
            a: 'Cap the stack and merge small commands, so consecutive keystrokes become one typing command and one undo removes a word, not a letter. Where inverting is expensive, keep periodic snapshots and replay commands from the nearest one, which is how event-sourced systems rebuild state.',
          },
          {
            q: 'How does undo work in a collaborative editor?',
            a: 'Your undo must reverse only your own edits, adjusted for everyone else\'s that landed since. A plain command stack cannot do that, so collaborative editors build undo on [[OT|operational transformation]] or [[CRDT|CRDTs]]. Name it, then scope it out unless the interviewer wants to go there.',
          },
          {
            q: 'Template method or strategy for the importers?',
            a: 'Strategy, if the variations are independent — any fetcher with any parser — because composition avoids a subclass per combination and each step tests on its own. Template method is fine when there is one axis of variation and the hooks are stable, as in a framework.',
          },
          {
            q: 'What happens when no handler in the chain takes the request?',
            a: 'By default, nothing, and that silence is the bug. Every chain needs a terminal handler that answers: reject with a reason, or route to a human. Then log which link handled each request, so "who approved this?" always has an answer.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-dp-command-template-chain-1',
        moduleId: 'dp-command-template-chain',
        stem: 'You need undo and redo in a drawing app. What is the core structure?',
        options: [
          'An observer that records every canvas change event',
          'A template method with an `undo()` hook that each drawing tool overrides',
          'A command per action with `execute` and `undo`, kept on an undo stack and a redo stack',
          'A chain of handlers that each try to reverse the last action',
        ],
        correct: 2,
        explain:
          'Undo needs a record of what happened and how to reverse it, which is exactly what a command object holds; two stacks give redo. An event log records what happened but not how to reverse it, and a tool-level hook has no history to undo from.',
      },
      {
        id: 'q-dp-command-template-chain-2',
        moduleId: 'dp-command-template-chain',
        stem: 'An Express middleware checks the session and, when it is missing, responds `401` without calling `next()`. Which pattern is that behaviour?',
        options: [
          'Decorator, because it wraps the route handler',
          'Chain of responsibility, because a link handled the request and stopped it',
          'Template method, because Express owns the flow',
          'Command, because the request is an object',
        ],
        correct: 1,
        explain:
          'Stopping the request is the defining move of a chain link. A pure decorator always forwards and adds behaviour around the call. Middleware can do both, which is why it gets called either.',
      },
      {
        id: 'q-dp-command-template-chain-3',
        moduleId: 'dp-command-template-chain',
        stem: 'Several importers share a fetch → parse → validate → save flow, and any source may arrive in any format. Which design fits best?',
        options: [
          'Template method, with a subclass for each source-and-format pair',
          'Copy the flow into each importer and keep the copies in sync in review',
          'A chain in which each importer tries the next',
          'One importer class that is given a fetcher and a parser',
        ],
        correct: 3,
        explain:
          'Two independent variation points make template method grow a subclass per combination. Passing the steps in keeps one skeleton and lets any fetcher pair with any parser.',
      },
    ],
    cards: [
      {
        id: 'c-dp-command-template-chain-1',
        moduleId: 'dp-command-template-chain',
        front: 'What does the command pattern buy you?',
        back: 'A request becomes a value. You can queue it, log it, retry it, run it on another machine, or undo it, none of which a method call allows.',
        tag: 'Command',
      },
      {
        id: 'c-dp-command-template-chain-2',
        moduleId: 'dp-command-template-chain',
        front: 'What is template method, in one breath?',
        back: 'A base-class method fixes the order of steps and calls overridable hooks for the parts that vary. The framework calls you.',
        tag: 'Template method',
      },
      {
        id: 'c-dp-command-template-chain-3',
        moduleId: 'dp-command-template-chain',
        front: 'When is middleware a chain, and when is it a decorator?',
        back: 'A chain when a link can stop the request, as auth does. A decorator when every link forwards and adds work around the call, as timing does.',
        tag: 'Chain',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'dp-anti',
    trackId: 'design-patterns',
    title: 'Anti-patterns',
    station: 9,
    prereqs: ['dp-command-template-chain'],
    minutes: 15,
    summary: 'Seven ways designs go wrong, each as a symptom, a cost and a proportionate fix.',
    objectives: [
      'Diagnose a god object, a golden hammer and singleton abuse from their symptoms',
      'Argue against speculative generality without arguing against design',
      'Present both sides of the anemic domain model debate',
      'Spot a distributed monolith and say what fixes it',
    ],
    keywords: [
      'anti-pattern',
      'god object',
      'golden hammer',
      'singleton',
      'speculative generality',
      'anemic domain model',
      'lava flow',
      'distributed monolith',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Interviewers ask about anti-patterns to find out whether you have maintained code, not just written it. Anyone can recite a pattern. Recognising the shape of a codebase going wrong, and choosing a fix in proportion to the damage, is what a senior engineer is paid for.',
      },
      {
        kind: 'prose',
        text: 'Each one below follows the same order: the **symptom** you notice, the **cost** it is quietly charging, and the **fix**. Almost all of them started as a reasonable decision under a deadline. Say that too; blaming the previous team is a trap of its own.',
      },

      { kind: 'heading', text: 'God object' },
      {
        kind: 'figure',
        caption: 'How a god object grows: every turn of the loop is locally rational.',
        figure: {
          kind: 'cycle',
          steps: [
            { label: 'A deadline', sub: 'a feature needs order data' },
            { label: 'Add it to OrderManager', sub: 'the data is already there' },
            { label: 'One more reason to change', sub: 'and one more dependency' },
            { label: 'Harder to split', sub: 'more callers, more risk' },
          ],
          note: 'Each turn makes the next addition cheaper here and the eventual split more expensive.',
        },
      },
      {
        kind: 'list',
        items: [
          '**Symptom.** One class that every feature touches: `OrderManager`, `UserService`, `Utils`. Thousands of lines, dozens of constructor dependencies, and a merge conflict in it most weeks. Its name ends in Manager, Service or Helper because no narrower name would be true.',
          '**Cost.** Every change risks every feature, because everything shares its fields and private helpers. It cannot be tested without building half the system, and two teams cannot work in it at once.',
          '**Fix.** Do not rewrite it. Find the seams — clusters of methods that use the same fields and change for the same reason — and extract one cluster at a time behind a narrow interface, leaving the old method delegating until the last caller has moved. Start with the cluster that changes most often; that is where the god object costs you most.',
        ],
      },
      {
        kind: 'figure',
        caption: 'A god object: every feature depends on one class, so every change risks all of them.',
        figure: {
          kind: 'classes',
          classes: [
            {
              name: 'OrderManager',
              fields: ['db, mailer, stripe, cache', 'taxTables, pdf, flags', '…37 more'],
              methods: ['place(cart)', 'refund(order)', 'sendReceipt(order)', '…180 more'],
              tone: 'alert',
            },
            { name: 'CheckoutController', methods: ['post(req)'] },
            { name: 'AdminPanel', methods: ['refund(id)'] },
            { name: 'NightlyExport', methods: ['run()'] },
          ],
          relations: [
            { from: 'CheckoutController', to: 'OrderManager', kind: 'uses' },
            { from: 'AdminPanel', to: 'OrderManager', kind: 'uses' },
            { from: 'NightlyExport', to: 'OrderManager', kind: 'uses' },
          ],
          note: 'Each arrow is a team that must coordinate with every other team to change anything here.',
        },
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'One class, six reasons to change',
          code: `class OrderManager {
  place(cart: Cart) { /* validate, price, save */ }
  applyCoupon(code: string) { /* … */ }
  charge(o: Order) { /* Stripe calls */ }
  refund(o: Order) { /* Stripe calls */ }
  sendReceipt(o: Order) { /* templates, SMTP */ }
  exportForAccounting(day: Date) { /* … */ }
  recalcTax(o: Order) { /* tax tables */ }
  // 3,000 lines, 40 constructor dependencies,
  // and every team edits it.
}`,
        },
        after: {
          title: 'Split by reason to change',
          code: `class Checkout {
  constructor(
    private pricing: Pricing,
    private payments: Payments,
    private orders: OrderRepo,
    private placed: Topic<Order>,
  ) {}
  async place(cart: Cart) {
    const order = Order.from(cart, this.pricing)
    await this.payments.charge(order)
    await this.orders.save(order)
    this.placed.emit(order) // receipts subscribe
    return order
  }
}
// Pricing, Payments, Receipts, AccountingExport:
// each small, owned by one team, tested alone.`,
        },
        note: 'Receipts left by becoming an observer. Most god-object refactors are three or four of this track\'s patterns applied one seam at a time.',
      },

      { kind: 'heading', text: 'Golden hammer and singleton abuse' },
      {
        kind: 'list',
        items: [
          '**Symptom.** Every problem gets the same tool. Kafka between two services that need a request and a response. A microservice for a feature one developer owns. GraphQL in front of an internal [[CRUD]] admin. A strategy pattern around a two-line `if`.',
          '**Cost.** You pay the tool\'s costs without collecting its benefits. Kafka with no fan-out and no replay is an asynchronous, at-least-once, operated way to make a function call.',
          '**Fix.** State the requirement before naming the tool. If you cannot say which property of the tool the problem needs — durability, fan-out, independent scaling, a typed schema — you are holding a hammer.',
        ],
      },
      {
        kind: 'prose',
        text: 'The name comes from Abraham Maslow\'s 1966 line: "it is tempting, if the only tool you have is a hammer, to treat everything as if it were a nail." In design rounds it looks like Kafka, Redis and microservices in the first five minutes, because the candidate thinks they are expected. A senior answer starts boring and earns each component.',
      },
      {
        kind: 'prose',
        text: 'Singleton abuse is the same reflex applied to access. Station 3 covered why the pattern is suspect; this is what it looks like after two years of growth.',
      },
      {
        kind: 'list',
        items: [
          '**Symptom.** Global access to shared mutable state: `Config.getInstance()`, `Db.instance`, a registry everything reads and writes. Tests pass alone and fail together, depending on the order they run in.',
          '**Cost.** Constructors lie about what a class needs, because the real dependency is fetched from a global. Tests cannot substitute a fake. In a server, a singleton that holds per-request data leaks one user\'s data into another user\'s request.',
          '**Fix.** Keep the single instance; lose the global access. Create it once at start-up, in the composition root, and pass it in through constructors. "Only one" is a lifetime decision for whoever wires the application, not something the class should enforce on itself.',
        ],
      },

      { kind: 'heading', text: 'Speculative generality and lava flow' },
      {
        kind: 'prose',
        text: 'Two opposite failures of time. Speculative generality is code written for a future that never arrives. Lava flow is code left over from a past that nobody remembers.',
      },
      {
        kind: 'list',
        items: [
          '**Symptom.** An interface with one implementation and no test double. A plugin system with one plugin. Parameters nobody passes, hooks nobody overrides, and a `PaymentProviderFactory` at a company that has only ever used Stripe.',
          '**Cost.** Every reader pays for the indirection on every read. Worse, the abstraction is usually wrong when the second case finally arrives, because it was designed without it, so you end up bending the real requirement to fit the old guess.',
          '**Fix.** Inline the abstraction that has one user. Wait for the second, ideally the third, real case before extracting: the rule of three. The exception is a boundary you already know you must swap or fake, such as a clock, or a payment gateway in tests.',
        ],
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Built for a future',
          code: `interface NotifierFactory {
  create(kind: NotifierKind): Notifier
}
interface Notifier { send(m: Message): Promise<void> }
type NotifierKind = 'email' // "sms and push later"

class DefaultNotifierFactory implements NotifierFactory {
  create(kind: NotifierKind): Notifier {
    return new EmailNotifier(new SmtpTransport())
  }
}
class EmailNotifier implements Notifier { /* … */ }
// Two interfaces and a factory to send one email.`,
        },
        after: {
          title: 'Built for now',
          code: `class Mailer {
  constructor(private smtp: SmtpTransport) {}
  send(to: string, m: Message) {
    return this.smtp.deliver(to, m)
  }
}
// When push notifications are real, you will
// know what they share with email, and the
// interface you extract then will fit both.`,
        },
        note: 'The constructor still takes its transport, so a test can pass a fake. Simple is not the same as untestable.',
      },
      {
        kind: 'list',
        items: [
          '**Symptom.** Code nobody understands and nobody deletes: a `legacyPricing` path behind a flag that has been off for years, a table with no readers, a module whose only comment is "do not remove".',
          '**Cost.** It hardens around the living code. New features route around it, every search returns it, every migration carries it, and nobody can say with confidence what the system does. The fear of deleting it is the cost.',
          '**Fix.** Make deletion safe, then delete. Put a counter on the code path or a log on the table read, wait through a full business cycle — month-end, year-end — and remove whatever never fired. Version control is the archive; the codebase is not.',
        ],
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Knight Capital, 2012',
        text: 'On 1 August 2012 Knight Capital lost about $460 million in 45 minutes. New trading code reused a configuration flag that had once switched on Power Peg, order-handling code the firm had stopped using in 2003 but never removed. The deployment missed one of eight servers, and on that server the reused flag woke the old code up, sending millions of orders into the market. Dead code that can still be deployed is not dead.',
      },

      { kind: 'heading', text: 'The anemic domain model: a debate' },
      {
        kind: 'prose',
        text: '**Symptom.** Entities are bags of fields, and all behaviour lives in `…Service` classes that pull data out, decide, and push it back. `order.status = \'shipped\'` is legal from anywhere, so the rule "only paid orders ship" lives in whichever service remembered to check it.',
      },
      {
        kind: 'prose',
        text: 'Martin Fowler named this an anti-pattern in 2003: procedural code wearing objects, with the invariants kept away from the data they protect. Many teams disagree, for good reasons, and an interviewer who raises it usually wants to hear both sides and then your call.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Rich domain model',
          points: [
            '`order.ship()` checks the order is paid; no caller can skip it',
            'Invariants live next to the data they protect',
            'Costs: more design up front, and it can fight an [[ORM]] that wants public fields',
          ],
        },
        right: {
          title: 'Anemic model plus services',
          points: [
            'Plain records; logic in services or pure functions',
            'Easy to serialise, map to tables and send over the wire',
            'Costs: any caller can put a record into an invalid state',
          ],
        },
        verdict: 'Where there are real invariants — money, stock, lifecycles — put them on the object. Where the service is mostly data in and data out, plain records are honest, not lazy. The anti-pattern is having rules and leaving them unguarded.',
      },
      {
        kind: 'codeCompare',
        before: {
          title: 'Anyone can ship anything',
          code: `class Order {
  status: Status = 'pending'
  paidAt?: Date
}
class ShippingService {
  ship(o: Order) {
    // The rule lives here, and only here.
    if (o.status !== 'paid') throw new Error('unpaid')
    o.status = 'shipped'
  }
}
// Meanwhile AdminTool sets o.status directly.`,
        },
        after: {
          title: 'The order guards its own rule',
          code: `class Order {
  private status: Status = 'pending'
  ship() {
    if (this.status !== 'paid') {
      throw new Error('cannot ship an unpaid order')
    }
    this.status = 'shipped'
  }
  get current() { return this.status }
}
// Services still coordinate. They are just no
// longer the only guard on the order's state.`,
        },
      },

      { kind: 'heading', text: 'The distributed monolith' },
      {
        kind: 'list',
        items: [
          '**Symptom.** Services that must be deployed together. One feature needs coordinated releases of three services; a shared database or a shared "common" library pins them to each other; one slow service makes the rest time out, because every request is a synchronous chain through five of them.',
          '**Cost.** Every cost of distribution — network failures, latency, partial outages, tracing across services — plus every cost of the monolith: coupling, lock-step releases, one team blocking the next. It is worse than either.',
          '**Fix.** Draw boundaries around data ownership: each service owns its tables, and nobody else reads them. Replace synchronous chains with events where the caller does not need the answer now. And if two services always change together, merge them. A modular monolith is a legitimate destination, not a retreat.',
        ],
      },
      {
        kind: 'prose',
        text: 'The arithmetic is worth having ready. Five services in a synchronous chain, each available 99.9% of the time, give at best `0.999 ** 5 ≈ 0.995`: about 44 hours of downtime a year instead of under 9. Every synchronous hop you add multiplies in another failure rate.',
      },
      {
        kind: 'figure',
        caption: 'The test is not how many services you have. It is whether each can change, deploy and fail on its own.',
        figure: {
          kind: 'split',
          left: {
            title: 'Distributed monolith',
            tone: 'alert',
            nodes: [
              { label: 'Orders', to: 'sync call' },
              { label: 'Pricing', to: 'sync call' },
              { label: 'Inventory', to: 'all read' },
              { label: 'One shared database', tone: 'alert' },
            ],
            cost: 'One slow hop is everyone\'s outage; one schema change is everyone\'s deploy.',
          },
          right: {
            title: 'Independent services',
            tone: 'mastered',
            nodes: [
              { label: 'Orders', sub: 'owns its tables', to: 'OrderPlaced' },
              { label: 'Event topic', tone: 'line', to: 'consumed by' },
              { label: 'Inventory', sub: 'owns its tables', tone: 'mastered' },
            ],
            cost: 'Eventual consistency between them, but each deploys and fails alone.',
          },
          verdict: 'Split by who owns the data, and let the services that do not need an answer now hear about changes instead of asking.',
        },
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Segment goes back to one service',
        text: 'In 2018 Segment wrote about folding more than 140 per-destination microservices back into a single service. Each had its own queue and its own copy of the shared libraries, and the copies drifted apart because updating a library meant redeploying every service that used it. They were paying for 140 services and getting none of the independence; one service turned out easier to change and to run.',
      },

      { kind: 'heading', text: 'The cheat sheet' },
      {
        kind: 'table',
        head: ['Anti-pattern', 'Symptom', 'First fix'],
        rows: [
          ['**God object**', 'Every change touches one class', 'Extract the most-changed cluster'],
          ['**Golden hammer**', 'The same tool for every problem', 'State the requirement before the tool'],
          ['**Singleton abuse**', 'Tests pass alone, fail together', 'One instance, injected'],
          ['**Speculative generality**', 'Interfaces with one implementation', 'Inline; wait for the third case'],
          ['**Lava flow**', 'Code nobody dares delete', 'Instrument, wait a cycle, delete'],
          ['**Anemic domain model**', 'Rules live in whichever service remembered', 'Move invariants onto the object'],
          ['**Distributed monolith**', 'Services deploy in lock-step', 'Split by data ownership, or merge'],
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'I would call that a distributed monolith: the services cannot deploy or fail independently, so we pay for distribution without getting independence. Either the boundaries move to follow data ownership, or the services merge back into a modular monolith. Both are fine; staying in between is not.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Treating an anti-pattern as a moral failing. "That is a god object, rewrite it" is not an answer. Say what it costs, what you would extract first and why, and how you would do it without a feature freeze. Proportion is the senior signal.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'You inherit a 4,000-line god class. Where do you start?',
            a: 'With tests around its current behaviour, then the cluster of methods that changes most often; the commit history tells you which. Extract it behind an interface, move callers over one at a time, and leave the old method delegating until the last caller has moved. No big rewrite, no freeze.',
          },
          {
            q: 'Isn\'t an interface with one implementation good for testing?',
            a: 'Sometimes. If the implementation does I/O or is slow, the test double is the second implementation and the interface has earned its place. If the class is pure logic, test it directly; an interface added only to mock it is speculative generality with a test as the excuse.',
          },
          {
            q: 'Is the anemic domain model always wrong?',
            a: 'No. It is wrong when the domain has invariants that nothing guards. For data-in, data-out services, plain records with functions are simpler and serialise cleanly. I put rules on the object where breaking them costs money, such as balances, stock and lifecycles, and leave the rest as data.',
          },
          {
            q: 'How do you tell a distributed monolith from microservices that just talk a lot?',
            a: 'Ask whether each service can be deployed alone and survive another being down. Chatty services that degrade gracefully and release independently are fine. If a release needs a coordinated train, or one outage cascades through every call, it is a distributed monolith however the repositories are split.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-dp-anti-1',
        moduleId: 'dp-anti',
        stem: 'Tests for `InvoiceService` pass when run alone and fail when the whole suite runs. The class calls `Db.instance` inside its methods. What is the root problem?',
        options: [
          'The test runner is running tests in parallel',
          'Shared mutable state reached through a global singleton, so tests share it and cannot substitute a fake',
          'The database is too slow for the full suite',
          'The class needs more mocks',
        ],
        correct: 1,
        explain:
          'The singleton is shared across tests and hidden from the constructor, so one test\'s data leaks into the next and no fake can be passed in. Keep one instance, but inject it. Parallelism and speed are symptoms, not the cause.',
      },
      {
        id: 'q-dp-anti-2',
        moduleId: 'dp-anti',
        stem: 'The codebase has `PaymentProviderFactory`, a `PaymentProvider` interface and one implementation, `StripeProvider`. The company has used only Stripe for six years, and tests run against Stripe\'s test mode. What is the strongest position?',
        options: [
          'Collapse it to a Stripe client behind one module boundary, and extract an interface when a second provider is real',
          'Keep it: depending on interfaces is always good practice',
          'Add a second provider so the abstraction is justified',
          'Replace it with a singleton so there is only ever one provider',
        ],
        correct: 0,
        explain:
          'One implementation and no test double is speculative generality: every reader pays for indirection the business never used. A module boundary keeps the Stripe calls in one place, which is what makes a later extraction cheap. Adding a provider to justify an abstraction is the tail wagging the dog.',
      },
      {
        id: 'q-dp-anti-3',
        moduleId: 'dp-anti',
        stem: 'Four services have to be released together for almost every feature, and one slow service makes all four time out. What is this, and what fix should you consider first?',
        options: [
          'Microservices working as designed; add more replicas',
          'A god object; split the largest service',
          'A distributed monolith; redraw boundaries around data ownership, or merge the services back',
          'A golden hammer; replace the message broker',
        ],
        correct: 2,
        explain:
          'Lock-step releases and cascading timeouts mean the services are not independent: all the cost of distribution and none of the benefit. More replicas do not remove the coupling; owning data separately, or merging, does.',
      },
    ],
    cards: [
      {
        id: 'c-dp-anti-1',
        moduleId: 'dp-anti',
        front: 'What is a distributed monolith?',
        back: 'Services that must deploy together and fail together. You pay every cost of distribution and keep every cost of the monolith.',
        tag: 'Anti-patterns',
      },
      {
        id: 'c-dp-anti-2',
        moduleId: 'dp-anti',
        front: 'What is speculative generality, and what is the fix?',
        back: 'Abstractions built for a case that never arrives. Inline them, and extract an interface once the second or third real case exists.',
        tag: 'Anti-patterns',
      },
      {
        id: 'c-dp-anti-3',
        moduleId: 'dp-anti',
        front: 'What is the best argument for the anemic domain model?',
        back: 'For data-in, data-out services, plain records plus functions are simpler to test and serialise. It is only wrong where invariants go unguarded.',
        tag: 'Anti-patterns',
      },
    ],
  },
]
