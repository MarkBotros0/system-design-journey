import type { Module } from '../types'

/**
 * Track — Databases in depth (DB), part 1: stations 1–5.
 * trackId: 'databases'. Authoring rules: docs/superpowers/plans/2026-11-18-content-brief.md
 */
export const databasesModules: Module[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'db-er',
    trackId: 'databases',
    title: 'Relational modelling and ER diagrams',
    station: 1,
    prereqs: ['c-modelling'],
    related: ['c-modelling', 'f-db'],
    minutes: 11,
    summary: 'Entities, relationships and keys: turning a domain into tables whose constraints do the defending.',
    objectives: [
      'Turn entities and relationships into tables, with every foreign key on the right side',
      'Choose between natural and surrogate keys, and name what each costs',
      'Use constraints to enforce the rules that application checks cannot',
    ],
    keywords: [
      'ER diagram',
      'entity relationship',
      'schema design',
      'foreign key',
      'join table',
      'surrogate key',
      'natural key',
      'cardinality',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Every design round reaches the moment you name the core entities, and in a low-level design round the schema is most of the answer. The interviewer is watching three things: whether each foreign key sits on the right side, whether a many-to-many becomes a table, and whether the database itself guarantees the rules that matter.',
      },
      {
        kind: 'prose',
        text: 'The data modelling lesson started from access patterns and keys in a key-value store. This is the relational half. An [[ER]] model, entity–relationship, is the drawing you make before the tables, and it is not ceremony: it maps mechanically onto a schema, so getting the drawing right gets the tables right.',
      },
      {
        kind: 'figure',
        caption: 'Where the key goes: on the many side for one-to-many, in a table of its own for many-to-many.',
        figure: {
          kind: 'split',
          left: {
            title: 'One-to-many',
            tone: 'line',
            nodes: [
              { label: 'customers', sub: 'id', to: 'referenced by' },
              { label: 'orders', sub: 'customer_id', tone: 'line' },
            ],
            cost: 'The many side carries the key. The one side never holds a list.',
          },
          right: {
            title: 'Many-to-many',
            tone: 'mastered',
            nodes: [
              { label: 'orders', to: 'one row per pair' },
              { label: 'order_items', sub: 'order_id, product_id, quantity', tone: 'mastered', to: 'references' },
              { label: 'products' },
            ],
            cost: 'The join table holds both keys and every fact about the pairing.',
          },
          verdict: 'Mark the cardinality on every line of the drawing and the tables follow from it.',
        },
      },
      { kind: 'heading', text: 'Entities, attributes and relationships' },
      {
        kind: 'prose',
        text: 'An **entity** is something the business tracks with its own identity and lifecycle: a customer, a product, an order. An **attribute** is a fact about exactly one entity: a customer\'s email, a product\'s price. A **relationship** connects entities and has a cardinality, which says how many of one side can relate to how many of the other.',
      },
      {
        kind: 'prose',
        text: 'The test for entity versus attribute is whether it has facts of its own. A shipping address typed at checkout is an attribute of the order. An address book the customer edits and reuses is an entity, with its own table and its own key. Ask which one the interviewer means, because it changes the schema.',
      },
      {
        kind: 'prose',
        text: 'Watch for facts that belong to neither side. The quantity of a product on an order is not a fact about the product, nor about the order: it is a fact about the pairing. That is the tell for a join table, sometimes called an associative entity.',
      },
      { kind: 'heading', text: 'Cardinality decides where the key goes' },
      {
        kind: 'table',
        head: ['Shape', 'Example', 'In tables'],
        rows: [
          ['**One-to-one**', 'user and profile', 'A foreign key with a unique constraint on either side, or simply one table'],
          ['**One-to-many**', 'customer and orders', '`customer_id` on `orders`, the many side'],
          ['**Many-to-many**', 'orders and products', 'A join table with both foreign keys, plus the facts about the pair'],
          ['**Self-referencing**', 'category and parent category', 'A `parent_id` column pointing back at the same table'],
        ],
      },
      {
        kind: 'prose',
        text: 'Split a one-to-one only for a reason you can name: a different lifecycle, wide columns that are rarely read, or sensitive data that needs tighter grants. Otherwise it is one table. And say the **optionality** out loud. Can an order exist without a customer, for a guest checkout? That one question decides whether `customer_id` is `NOT NULL`.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        title: 'A list in a column',
        text: 'Storing `product_ids` as an array or a comma-separated string on the order. It looks simpler, but the quantity and the price paid have nowhere to live, no foreign key can check the ids, and deleting a product leaves dangling references that nobody notices. A list in a cell is almost always a missing join table.',
      },
      { kind: 'heading', text: 'Natural keys and surrogate keys' },
      {
        kind: 'compare',
        left: {
          title: 'Natural key',
          points: [
            'A real-world identifier: an email, a country code, a tax number',
            'Meaningful, and already unique in the domain',
            'Changes when the world changes: people change emails',
            'Copied into every referencing table, so one change cascades everywhere',
          ],
        },
        right: {
          title: 'Surrogate key',
          points: [
            'A generated `bigint` or [[UUID]] with no meaning at all',
            'Never changes, so references never need rewriting',
            'Narrow, so joins and indexes stay small',
            'Says nothing about real-world uniqueness on its own',
          ],
        },
        verdict: 'Use both: a surrogate primary key for stability, and a unique constraint on the natural key so two rows for the same customer stay impossible.',
      },
      {
        kind: 'prose',
        text: 'Between surrogates, a `bigint` identity is the default: 8 bytes, and each new key lands at the right-hand edge of the index. Reach for a UUID when ids must be minted without asking the database, on a client or across shards, or when they are public and must not be guessable. Prefer a time-ordered UUIDv7 to a random v4. Random keys scatter inserts across the whole index, which costs page splits and cache misses on every write.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Stripe',
        text: 'Stripe\'s object ids are surrogates with a type prefix: `cus_…` for a customer, `ch_…` for a charge, `pi_…` for a payment intent. The id carries no business meaning, so it never has to change, yet anyone reading a log line knows at once what kind of object it names.',
      },
      { kind: 'heading', text: 'Constraints are the schema\'s job' },
      {
        kind: 'prose',
        text: 'An application check is a read followed by a write, and two requests can both pass the read. A constraint is enforced inside the database at the moment of the write, for every client and every code path, including the migration script someone runs at 2 a.m.',
      },
      {
        kind: 'list',
        items: [
          '`NOT NULL`: a value is required. Make it the default and opt out deliberately.',
          '`UNIQUE`: no two rows share the value. It is also concurrency control: of two simultaneous sign-ups with one email, the second insert fails.',
          '`CHECK`: a rule on the row itself, such as `quantity > 0`, `price_cents >= 0`, or a status from a fixed set.',
          '`REFERENCES`: the parent row must exist. Its `ON DELETE` rule is a business decision: `RESTRICT` for a customer who has orders, `CASCADE` for an order\'s line items.',
        ],
      },
      {
        kind: 'prose',
        text: 'Foreign keys cost something. Every child insert looks up its parent, and every parent delete must find its children. Postgres does **not** index the referencing column for you, so deleting a product scans `order_items` unless you add that index yourself. MySQL\'s InnoDB creates one automatically.',
      },
      { kind: 'heading', text: 'A worked schema: a small shop' },
      {
        kind: 'figure',
        caption: 'A shop drawn as tables: each box is a table, each arrow a foreign key, labelled with its cardinality.',
        figure: {
          kind: 'classes',
          classes: [
            {
              name: 'customers',
              fields: ['id: bigint, primary key', 'email: text, unique', 'name: text'],
              tone: 'line',
            },
            {
              name: 'orders',
              fields: ['id: bigint, primary key', 'customer_id → customers', 'status: text, checked', 'placed_at: timestamptz'],
            },
            {
              name: 'order_items',
              fields: ['order_id → orders', 'product_id → products', 'quantity: int, above 0', 'unit_price_cents: int'],
              tone: 'mastered',
            },
            {
              name: 'products',
              fields: ['id: bigint, primary key', 'sku: text, unique', 'name: text', 'price_cents: int'],
            },
          ],
          relations: [
            { from: 'orders', to: 'customers', kind: 'uses', label: 'many to one' },
            { from: 'orders', to: 'order_items', kind: 'has', label: 'one to many, cascade' },
            { from: 'order_items', to: 'products', kind: 'uses', label: 'many to one' },
          ],
          note: 'order_items is keyed by (order_id, product_id): one line per product per order.',
        },
      },
      {
        kind: 'code',
        caption: 'The same schema in Postgres. Every rule in the drawing is a constraint here, not a hope.',
        code: `CREATE TABLE customers (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      text NOT NULL UNIQUE,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku         text NOT NULL UNIQUE,
  name        text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0)
);

CREATE TABLE orders (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id bigint NOT NULL
              REFERENCES customers (id) ON DELETE RESTRICT,
  status      text NOT NULL CHECK (status IN
                ('pending', 'paid', 'shipped', 'cancelled')),
  placed_at   timestamptz NOT NULL DEFAULT now()
);
-- a customer's orders, newest first
CREATE INDEX ON orders (customer_id, placed_at DESC);

CREATE TABLE order_items (
  order_id         bigint NOT NULL
                   REFERENCES orders (id) ON DELETE CASCADE,
  product_id       bigint NOT NULL REFERENCES products (id),
  quantity         integer NOT NULL CHECK (quantity > 0),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  PRIMARY KEY (order_id, product_id)
);
-- Postgres will not create this one for you
CREATE INDEX ON order_items (product_id);`,
      },
      {
        kind: 'prose',
        text: 'Two details in there are deliberate. Money is an integer number of cents, never a float. And `unit_price_cents` on the line is **not** a copy of the product\'s price: it is the price this customer agreed to pay, a historical fact. If the line joined to `products` instead, next month\'s price change would rewrite last month\'s invoices.',
      },
      {
        kind: 'prose',
        text: 'The join table needs no surrogate key of its own. `(order_id, product_id)` is its natural key, and it doubles as the index for "the lines of this order". Add a line number to the key only if the same product can appear twice on one order, say in two sizes.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'I\'ll draw the entities first and mark the cardinality on every line. Each foreign key goes on the many side, every many-to-many becomes a join table, and each table gets a surrogate key plus a unique constraint on its natural key, so the database, not the application, is what makes duplicates impossible.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Would you use UUIDs or integers for primary keys?',
            a: 'A `bigint` identity by default: half the size, and inserts append at the end of the index. UUIDs when ids are minted outside the database, on clients, offline devices or many shards, or when they appear in public links and must not be guessable. Then UUIDv7, which is time-ordered, so inserts stay close to sequential instead of scattering across the index.',
          },
          {
            q: 'Do you keep foreign keys once you shard?',
            a: 'Only within a shard. The database cannot check a reference that lives on another machine, so cross-shard references become application rules plus a periodic job that finds orphans. Some large MySQL users drop foreign keys altogether because they get in the way of online schema changes. Until you shard, keep them: they are correctness you get for free.',
          },
          {
            q: 'How would you model a category tree?',
            a: 'A `parent_id` column referencing the same table is the simplest model, and Postgres walks it with a recursive query (`WITH RECURSIVE`). If "everything under Electronics" is a hot read, add a materialised path such as `/1/7/42/` with a prefix index, or a closure table holding every ancestor and descendant pair. Each makes subtree reads cheap and moving a subtree expensive.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-db-er-1',
        moduleId: 'db-er',
        stem: 'Orders and products are many-to-many, and each line has a quantity. Where does the quantity live?',
        options: [
          'In an array column on `orders`, next to the product ids',
          'On `products`, as the quantity last ordered',
          'On a join table, `order_items`, keyed by order and product',
          'In a JSON document stored on each order',
        ],
        correct: 2,
        explain:
          'Quantity is a fact about the pairing, not about either side, which is the tell for a join table. An array or a JSON blob has no foreign key to check the product ids and no natural home for the price paid.',
      },
      {
        id: 'q-db-er-2',
        moduleId: 'db-er',
        stem: 'The sign-up handler runs `SELECT … WHERE email = ?` and inserts only if nothing came back. Two sign-ups with the same email arrive at the same instant. What actually prevents a duplicate account?',
        options: [
          'The `SELECT` check, because it runs before the insert',
          'Running both statements in one transaction at the default isolation level',
          'An ordinary index on `email`, so the check is fast',
          'A `UNIQUE` constraint on `email`',
        ],
        correct: 3,
        explain:
          'Both checks can run before either insert, and a transaction at the default level does nothing to stop that. An ordinary index makes the check fast, not exclusive. A unique constraint is enforced at the write itself, so the second insert fails whatever the timing.',
      },
      {
        id: 'q-db-er-3',
        moduleId: 'db-er',
        stem: 'A `users` table has an email column that users can change. What should the primary key be?',
        options: [
          'The email, because it is already unique',
          'A surrogate `bigint`, with a unique constraint on email',
          'A surrogate `bigint`, with no constraint on email',
          'A composite key of email and name',
        ],
        correct: 1,
        explain:
          'A key that changes must be rewritten in every table that references it. A surrogate never changes, and the unique constraint keeps "one account per email" true. Dropping the constraint is the tempting mistake: a surrogate alone happily stores duplicates.',
      },
    ],
    cards: [
      {
        id: 'c-db-er-1',
        moduleId: 'db-er',
        front: 'Where does the foreign key go in a one-to-many relationship?',
        back: 'On the many side: each order carries `customer_id`. The one side never holds a list of ids.',
        tag: 'Modelling',
      },
      {
        id: 'c-db-er-2',
        moduleId: 'db-er',
        front: 'Natural or surrogate primary key?',
        back: 'A surrogate key for stability and narrow joins, plus a unique constraint on the natural key so real-world duplicates stay impossible.',
        tag: 'Modelling',
      },
      {
        id: 'c-db-er-3',
        moduleId: 'db-er',
        front: 'What belongs on a many-to-many join table?',
        back: 'Both foreign keys, as its composite key, plus every fact about the pairing itself: quantity, the price paid, when it was added.',
        tag: 'Modelling',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'db-normalization',
    trackId: 'databases',
    title: 'Normalisation and deliberate denormalisation',
    station: 2,
    prereqs: ['db-er'],
    related: ['f-db', 'c-modelling'],
    minutes: 11,
    summary: 'What each normal form removes, walked on one table, and when to put a duplicate back on purpose.',
    objectives: [
      'Name the update, insert and delete anomalies, and spot them in a table',
      'Take one table from [[1NF]] to [[BCNF]], saying what each step removes',
      'Denormalise a hot read path on purpose, and choose between a copied column, a counter and a materialised view',
    ],
    keywords: [
      'normal forms',
      'normalization',
      'denormalization',
      'third normal form',
      'BCNF',
      'functional dependency',
      'materialized view',
      'update anomaly',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Interviewers rarely ask you to recite the normal forms. They hand you a table with something wrong in it, or they push on a slow read: "this join runs on every page view, now what?" Both questions test the same thing: whether you know what each normal form removes, and when putting a duplicate back is the right call.',
      },
      {
        kind: 'prose',
        text: 'Normalisation is not a ritual. Each normal form removes one specific way a duplicated fact can drift out of step with itself. Learn the anomaly and the rule follows.',
      },
      { kind: 'heading', text: 'The three anomalies' },
      {
        kind: 'prose',
        text: 'Take the shop\'s first attempt: one wide table, a row per order line, with the customer\'s email and the product\'s name copied onto every row. It reads easily. It fails in three ways.',
      },
      {
        kind: 'figure',
        caption: 'An update anomaly: one customer and one email, stored three times, and one copy missed.',
        figure: {
          kind: 'grid',
          cols: 4,
          cells: [
            { label: 'order' }, { label: 'customer' }, { label: 'email' }, { label: 'product' },
            { label: '1001' }, { label: 'Ana' }, { label: 'ana@new', tone: 'mastered' }, { label: 'Kettle' },
            { label: '1002' }, { label: 'Ana' }, { label: 'ana@new', tone: 'mastered' }, { label: 'Mug' },
            { label: '1003' }, { label: 'Ana' }, { label: 'ana@old', tone: 'alert' }, { label: 'Lamp' },
          ],
          legend: [
            { tone: 'mastered', label: 'updated' },
            { tone: 'alert', label: 'missed: now two emails for one customer' },
          ],
        },
      },
      {
        kind: 'list',
        items: [
          '**Update anomaly**: a fact stored in many rows must be changed in all of them. Miss one and the database disagrees with itself.',
          '**Insert anomaly**: you cannot record one fact without another. A new product has no row until somebody orders it.',
          '**Delete anomaly**: removing one fact destroys another. Delete the only order for the lamp and the lamp\'s name is gone with it.',
        ],
      },
      { kind: 'heading', text: 'Normal forms on one running example' },
      {
        kind: 'prose',
        text: 'Bill Kent\'s summary from 1983 is still the best one: every non-key column must depend on **the key, the whole key, and nothing but the key**. That is the first three normal forms in one sentence. Walk the shop\'s table through them.',
      },
      {
        kind: 'figure',
        caption: 'The same data, decomposed one rule at a time. Each step removes one way for a fact to drift.',
        figure: {
          kind: 'flow',
          nodes: [
            { label: 'One wide table', sub: 'items packed in a cell', tone: 'alert', to: 'one value per cell' },
            { label: '1NF: order_lines', sub: 'a row per line', to: 'the whole key' },
            { label: '2NF: + orders, products', sub: 'no partial dependency', to: 'nothing but the key' },
            { label: '3NF: + customers', sub: 'no transitive dependency', tone: 'mastered' },
          ],
        },
      },
      {
        kind: 'list',
        ordered: true,
        items: [
          '**[[1NF]]: one value per cell, and a key.** The first table packed "kettle ×2, mug ×1" into an `items` column. Split it so each line is its own row, keyed by `(order_id, product_id)`. Quantity is now a column you can filter, sum and constrain.',
          '**[[2NF]]: every column depends on the whole key.** In `order_lines`, `placed_at` depends only on `order_id`, and `product_name` only on `product_id`. Those are partial dependencies, so move them to `orders` and `products`, leaving `order_lines(order_id, product_id, quantity)`.',
          '**[[3NF]]: nothing but the key.** In `orders`, `customer_email` depends on `customer_id`, which depends on the order: a transitive dependency. The email is a fact about the customer, so it moves to `customers`. The anomaly in the grid above is now impossible, because there is exactly one row to change.',
        ],
      },
      {
        kind: 'prose',
        text: 'Every step asks the same question: **what determines this column?** That relationship, where knowing A gives you exactly one B, is a functional dependency, and every normal form is a rule about which dependencies a table is allowed to contain.',
      },
      { kind: 'heading', text: 'The rare case BCNF catches' },
      {
        kind: 'prose',
        text: '3NF still lets a non-key column determine part of a key. [[BCNF]], Boyce–Codd normal form, does not: every column that determines another must itself be a candidate key. The two differ only when a table has overlapping candidate keys. That is rare, but interviewers who know it like to ask.',
      },
      {
        kind: 'prose',
        text: 'The shop\'s sales team adds `account_managers(customer_id, product_line, manager)`. Each customer has one manager per product line, and each manager covers exactly one line. So `(customer_id, product_line)` determines `manager`, and `manager` determines `product_line`. The table is in 3NF, because `product_line` is part of a key. It is not in BCNF, because `manager` is not a key.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Stay at 3NF',
          points: [
            'One table; a unique constraint on `(customer_id, product_line)` enforces one manager per line',
            'Moving a manager to another line means updating every row they appear in',
            'A new manager\'s line cannot be recorded until they have a customer',
          ],
        },
        right: {
          title: 'Decompose to BCNF',
          points: [
            '`managers(manager, product_line)` and `assignments(customer_id, manager)`',
            'Each manager\'s line is stored exactly once',
            'No single constraint can enforce "one manager per customer per line" any more: the rule spans two tables',
          ],
        },
        verdict: 'BCNF removes the last anomalies but can lose a rule you used to enforce for free. 3NF can always keep every dependency enforceable; BCNF cannot. If that rule matters, stay at 3NF and say why.',
      },
      { kind: 'heading', text: 'Deliberate denormalisation' },
      {
        kind: 'prose',
        text: 'Normalised is the right write model. It is not always the right read model. When one read runs on every page view and pays for a join or an aggregate each time, you store the answer, and you take on the job of keeping it right.',
      },
      {
        kind: 'prose',
        text: 'The test for whether something is a denormalisation: **must the copy change when the source does?** The price on an order line need not, so it is a separate fact. A stored review count must, so it is a copy, and something has to keep it in step.',
      },
      {
        kind: 'table',
        head: ['Technique', 'Freshness', 'Write cost', 'Pick it when'],
        rows: [
          ['**Join at read time**', 'Exact', 'None', 'The default: the join is indexed and fast enough'],
          ['**Copied column**', 'Exact, if updated in the same transaction', 'A fan-out write on every change to the source', 'The source rarely changes and the read is very hot: an author\'s name on a post'],
          ['**Counter column**', 'Exact', 'One extra row write per event, and contention on hot rows', 'A count shown on every page: answers, likes, reviews'],
          ['**Materialised view**', 'Stale until refreshed', 'A recompute on every refresh', 'An expensive aggregate where minutes of staleness are fine: dashboards, leaderboards'],
          ['**Separate read model**', 'Seconds behind', 'A pipeline to run and monitor', 'A different query shape entirely: search, feeds, analytics'],
        ],
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Stack Overflow',
        text: 'Stack Overflow\'s public data dump shows the trade made in production: its `Posts` table carries `Score`, `AnswerCount` and `CommentCount` directly, instead of counting votes, answers and comments every time a question is listed. The numbers appear on every list page, so they are stored once per write rather than counted once per view.',
      },
      { kind: 'heading', text: 'Materialised views' },
      {
        kind: 'prose',
        text: 'A materialised view is a query whose result the database stores as a table. In Postgres, `REFRESH MATERIALIZED VIEW` recomputes the whole thing. Adding `CONCURRENTLY` keeps the view readable during the refresh, at the price of a unique index on the view and a diff against its old contents. Postgres does not maintain the view incrementally, so if a full refresh is too slow, keep a summary table yourself, updated in the same transaction as the source or from a change stream.',
      },
      {
        kind: 'figure',
        caption: 'A view refreshed every five minutes is a sawtooth of staleness. A counter updated in the write transaction never is.',
        figure: {
          kind: 'timeline',
          ticks: ['00:00', '00:05', '00:10', '00:15'],
          lanes: [
            {
              label: 'Orders table',
              bars: [{ from: 0, to: 1, label: 'new orders keep arriving', tone: 'line' }],
            },
            {
              label: 'Materialised view, refreshed every 5 minutes',
              bars: [
                { from: 0, to: 0.33, label: 'as of 00:00', tone: 'neutral' },
                { from: 0.33, to: 0.66, label: 'as of 00:05', tone: 'neutral' },
                { from: 0.66, to: 1, label: 'as of 00:10', tone: 'neutral' },
              ],
              outcome: { label: 'up to 5 min stale', tone: 'streak' },
            },
            {
              label: 'Counter column, same transaction',
              bars: [{ from: 0, to: 1, label: 'moves with every write', tone: 'mastered' }],
              outcome: { label: 'always exact', tone: 'mastered' },
            },
          ],
        },
      },
      {
        kind: 'prose',
        text: 'So the choice is about staleness and grain. A counter or a copied column is exact but adds work to every write. A materialised view adds nothing to the write path and is as stale as its refresh interval. A separate read model can answer queries the primary cannot, and is always somewhat behind.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'I\'ll keep the write model in third normal form. The product page shows the review count and the average rating on every view, so I\'ll keep a review count and a rating sum on `products`, updated in the same transaction as each review insert, and divide on read. That is one extra row write per review, and the numbers can never drift.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Reciting definitions instead of anomalies. "No transitive dependencies" scores nothing; "otherwise changing a customer\'s email means rewriting every order row, and missing one leaves two emails" scores the point. The same goes for denormalising: name the read it speeds up and who keeps the copy right, or it sounds like an accident.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'When would you stop at 3NF rather than go to BCNF?',
            a: 'When decomposing would split a dependency across two tables so no single constraint can enforce it, as in the account-manager case. 3NF can always preserve every dependency; BCNF cannot. It is rare, so in practice you reach BCNF for free and only argue when a table has overlapping keys.',
          },
          {
            q: 'Your revenue materialised view takes four minutes to refresh. What now?',
            a: 'Stop recomputing history. Keep a `daily_revenue` summary table and upsert into it as each order commits, in the same transaction or from a change stream if the write path must stay lean. Only today\'s row ever changes, so the refresh becomes a single-row update.',
          },
          {
            q: 'Does a document or key-value store mean you skip normalisation?',
            a: 'No. You still find the functional dependencies, because that is how you know what each duplicate is a copy of. Then you duplicate deliberately along the access patterns and own the fan-out when the source changes. Denormalising without knowing the dependencies is how copies drift silently.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-db-normalization-1',
        moduleId: 'db-normalization',
        stem: '`order_lines(order_id, product_id, quantity, product_name)` has the key `(order_id, product_id)`. Which normal form does it break, and why?',
        options: [
          'First, because `product_name` is not atomic',
          'Second, because `product_name` depends on only part of the key',
          'Third, because `product_name` depends on `quantity`',
          'None, because every column depends on the key',
        ],
        correct: 1,
        explain:
          '`product_name` is determined by `product_id` alone, half of a composite key. That partial dependency is what [[2NF]] forbids: rename a product and you must update every line that ever sold it. Move the name to `products`.',
      },
      {
        id: 'q-db-normalization-2',
        moduleId: 'db-normalization',
        stem: 'Products only exist as columns on order rows, so you cannot add a new product to the catalogue until somebody orders it. Which anomaly is that?',
        options: ['A delete anomaly', 'An update anomaly', 'A lost update', 'An insert anomaly'],
        correct: 3,
        explain:
          'An insert anomaly is being unable to record one fact without another, unrelated one. Its mirror is the delete anomaly, where removing the last order erases the product. A lost update is a concurrency problem, not a modelling one.',
      },
      {
        id: 'q-db-normalization-3',
        moduleId: 'db-normalization',
        stem: 'A dashboard shows revenue per day. The query aggregates 200 million order rows and takes 40 seconds, and numbers up to ten minutes old are fine. What do you do?',
        options: [
          'A materialised view or summary table, refreshed on a schedule',
          'Add an index on `placed_at`',
          'Store a running revenue total on each customer row',
          'Run the same query on a read replica instead',
        ],
        correct: 0,
        explain:
          'The aggregate is expensive and staleness is allowed: exactly the materialised view\'s case. An index does not make summing 200 million rows cheap, a per-customer total is the wrong grain, and a replica still spends 40 seconds per view.',
      },
    ],
    cards: [
      {
        id: 'c-db-normalization-1',
        moduleId: 'db-normalization',
        front: 'What are the normal forms, in one sentence?',
        back: 'Every non-key column depends on the key, the whole key, and nothing but the key. BCNF adds: every determinant is a key.',
        tag: 'Normalisation',
      },
      {
        id: 'c-db-normalization-2',
        moduleId: 'db-normalization',
        front: 'Which three anomalies does normalisation remove?',
        back: 'Update: one fact in many rows drifts. Insert: you cannot record a fact without an unrelated one. Delete: removing one fact loses another.',
        tag: 'Normalisation',
      },
      {
        id: 'c-db-normalization-3',
        moduleId: 'db-normalization',
        front: 'What must you say when you denormalise?',
        back: 'Which read it speeds up, what updates the copy, and how stale it is allowed to get.',
        tag: 'Normalisation',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'db-acid',
    trackId: 'databases',
    title: 'ACID, properly',
    station: 3,
    prereqs: ['db-normalization'],
    related: ['f-db'],
    minutes: 12,
    summary: 'The mechanism behind each letter, a bank transfer under a crash, and what the guarantees leave to you.',
    objectives: [
      'Explain the mechanism behind each letter: the log, declared constraints, isolation and fsync',
      'Say exactly what survives a crash, and at which point in a commit',
      'Name what [[ACID]] does not promise, and the design move that covers each gap',
    ],
    keywords: [
      'ACID',
      'atomicity',
      'durability',
      'write-ahead log',
      'fsync',
      'transaction',
      'group commit',
      'idempotency key',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'The foundations lesson gave each letter of [[ACID]] a line. Interviewers go further. "What does the C actually guarantee?" "The machine loses power the instant after commit returns: has the money moved?" "Two transfers run at once: is that safe?" Each letter is a different mechanism, and knowing the mechanism is what lets you say exactly what breaks when it is missing.',
      },
      {
        kind: 'prose',
        text: 'One example carries the whole lesson: move 100 from account A to account B. It is two writes that must happen together, must never overdraw, and must survive a crash once confirmed.',
      },
      {
        kind: 'figure',
        caption: 'A transfer: two updates, one commit. The reply waits until the commit record is on disk.',
        figure: {
          kind: 'sequence',
          actors: ['App', 'Postgres', 'Log on disk'],
          steps: [
            { from: 0, to: 1, label: 'begin' },
            { from: 0, to: 1, label: 'debit A by 100' },
            { from: 1, to: 1, label: 'check: balance stays at or above 0' },
            { from: 0, to: 1, label: 'credit B by 100' },
            { from: 0, to: 1, label: 'commit' },
            { from: 1, to: 2, label: 'flush log up to the commit record' },
            { from: 2, to: 2, label: 'fsync: on stable storage' },
            { from: 2, to: 1, label: 'flushed', dashed: true },
            { from: 1, to: 0, label: 'commit ok', dashed: true, tone: 'mastered' },
          ],
        },
      },
      {
        kind: 'code',
        caption: 'The transfer as one transaction. The idempotency key comes first, so a retry fails before it touches a balance.',
        code: `BEGIN;
INSERT INTO transfers (idempotency_key, from_id, to_id, cents)
VALUES ('7f3a…', 'A', 'B', 10000);  -- UNIQUE: a retry fails here
UPDATE accounts SET balance_cents = balance_cents - 10000
 WHERE id = 'A';               -- CHECK (balance_cents >= 0)
UPDATE accounts SET balance_cents = balance_cents + 10000
 WHERE id = 'B';
COMMIT;`,
      },
      { kind: 'heading', text: 'Atomicity: all or nothing, through the log' },
      {
        kind: 'prose',
        text: 'Atomicity means a transaction that fails part-way leaves no trace. If the credit to B fails, whether from a constraint, a crash or a deadlock, the debit from A is undone. Inside one database you never write compensating code for a half-finished transaction.',
      },
      {
        kind: 'prose',
        text: 'The mechanism is the [[WAL]], the write-ahead log. Before a change reaches a data page on disk, a record describing it is appended to the log. After a crash, recovery replays the log: changes from transactions that committed are redone, and changes from transactions with no commit record are discarded. InnoDB keeps a separate undo log to roll changes back. Postgres needs none, because an aborted transaction\'s new row versions are simply never visible to anyone.',
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'Not the atomic you know',
        text: 'In concurrent programming, "atomic" means other threads cannot see an operation half-done. In a database that is isolation, the I. The A is about failure, not concurrency: "abortable" would have been the better name.',
      },
      { kind: 'heading', text: 'Consistency: the letter that is mostly yours' },
      {
        kind: 'prose',
        text: 'Consistency means every transaction takes the database from one valid state to another. But the database only knows the rules you declared: `NOT NULL`, `UNIQUE`, `CHECK`, foreign keys, exclusion constraints. "Debits equal credits" and "a balance equals the sum of its ledger entries" are invariants your transactions must preserve. Nothing checks them for you.',
      },
      {
        kind: 'prose',
        text: 'So the C is a property of your application, using the A, the I and the D as tools. The senior move is to push every invariant you can into a declared constraint. `CHECK (balance_cents >= 0)` turns "no overdrafts" from a rule every code path must remember into one the database enforces on every write.',
      },
      {
        kind: 'table',
        head: ['Where you hear it', 'What consistency means there'],
        rows: [
          ['**ACID**', 'Declared constraints hold after every transaction'],
          ['**[[CAP]]**', 'Linearisability: every read sees the latest write, as if there were one copy'],
          ['**Eventual consistency**', 'Replicas converge once writes stop; until then, reads may be stale'],
        ],
      },
      { kind: 'heading', text: 'Isolation: a preview' },
      {
        kind: 'prose',
        text: 'Isolation is what stops two transfers out of A, running at the same moment, from interfering. The textbook promise is serializable: the result is as if transactions ran one at a time. Almost no database gives you that by default. Postgres and Oracle default to read committed and MySQL to repeatable read, and each of those permits specific anomalies.',
      },
      {
        kind: 'prose',
        text: 'The transfer above is safe at read committed for one reason: `balance_cents = balance_cents - 10000` reads and writes the row under its lock in a single statement. Read the balance into the application, subtract there and write the result back, and two concurrent transfers can both read 150, both pass the check, and both write 50. One debit vanishes. The next lesson is that anomaly and its siblings.',
      },
      { kind: 'heading', text: 'Durability: what committed actually means' },
      {
        kind: 'prose',
        text: 'Commit returns only once the commit record is on stable storage. Postgres forces the log to disk with an fsync, and with `synchronous_commit = on`, the default, the reply waits for it. The data pages themselves are written later, at a checkpoint, because the log is enough to rebuild them. That is why commit latency is the cost of a log flush, not of a page write.',
      },
      {
        kind: 'prose',
        text: 'A flush takes from well under a millisecond on a datacentre [[SSD]] to several milliseconds on network block storage, yet one database can commit tens of thousands of transactions a second. **Group commit** is how: transactions that commit at the same moment share one flush.',
      },
      {
        kind: 'table',
        head: ['Setting', 'Commit waits for', 'A crash can lose'],
        rows: [
          ['Postgres `synchronous_commit = on`', 'The local log flush', 'Nothing that was confirmed'],
          ['Postgres `synchronous_commit = off`', 'Nothing; the flush follows within about 0.6 s', 'The last fraction of a second of commits, never integrity'],
          ['MySQL `innodb_flush_log_at_trx_commit = 1`', 'A log flush on every commit (the default)', 'Nothing that was confirmed'],
          ['MySQL `innodb_flush_log_at_trx_commit = 2`', 'A write to the kernel; flushed once a second', 'About a second of commits if the machine dies'],
          ['A synchronous standby', 'A second machine to confirm as well', 'Nothing, even if the primary\'s disk is lost'],
        ],
      },
      {
        kind: 'prose',
        text: 'One disk is not durability against losing the machine. Asynchronous replication, the common default, confirms before the replica has the change, so a failover can drop the last few transactions. If a confirmed payment must survive the primary vanishing, the commit has to wait for a second machine, and you pay a network round trip on every commit.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'fsyncgate, 2018',
        text: 'Postgres developers found that on Linux, when `fsync` failed, the kernel could discard the unwritten pages and clear the error, so a retried `fsync` "succeeded" while the data was already gone. Postgres now treats a failed `fsync` as fatal, crashes, and recovers from the log instead. Durability is a chain from your commit down to the storage, and every link in it, kernel, drive cache and controller, can lie.',
      },
      { kind: 'heading', text: 'What ACID does not promise' },
      {
        kind: 'compare',
        left: {
          title: 'ACID gives you',
          points: [
            'All or nothing for writes inside one database',
            'The constraints you declared, on every commit',
            'Isolation at the level you chose, which is usually not serializable',
            'Survival of a crash, once commit has returned',
          ],
        },
        right: {
          title: 'ACID leaves to you',
          points: [
            'Atomicity with anything outside the database: a Kafka publish, an email, a card charge',
            'Business rules you never declared',
            'Knowing whether the commit landed when the connection drops',
            'Recovery from a bug that commits the wrong data: that is backups and point-in-time restore',
          ],
        },
        verdict: 'Everything on the right is your design\'s job. Naming it is most of the senior answer.',
      },
      {
        kind: 'figure',
        caption: 'Where the crash lands decides the outcome. Only the middle case needs your design rather than the database.',
        figure: {
          kind: 'timeline',
          ticks: ['begin', 'debit', 'credit', 'log flushed', 'reply sent'],
          lanes: [
            {
              label: 'Crash before commit',
              bars: [{ from: 0, to: 0.45, label: 'in flight', tone: 'line' }],
              outcome: { label: 'nothing moved', tone: 'mastered' },
            },
            {
              label: 'Crash after the flush, before the reply',
              bars: [{ from: 0, to: 0.85, label: 'committed', tone: 'line' }],
              outcome: { label: 'moved, client unsure', tone: 'streak' },
            },
            {
              label: 'Crash after the reply',
              bars: [{ from: 0, to: 1, label: 'committed and confirmed', tone: 'mastered' }],
              outcome: { label: 'durable', tone: 'mastered' },
            },
          ],
        },
      },
      {
        kind: 'prose',
        text: 'The connection-drop case is the one candidates miss. The commit may have landed and only the reply been lost, so a blind retry moves the money twice. The fix is already in the code above: the request carries an idempotency key, stored under a unique constraint in the same transaction. Stripe\'s [[API]] takes one in an `Idempotency-Key` header for exactly this reason. A retry hits the constraint and aborts, and the server returns the original result instead.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'The transfer is one transaction: record the idempotency key, debit, credit, commit. Atomicity means a crash leaves both writes or neither, a check constraint makes an overdraft impossible, and durability means a confirmed transfer survives a crash. What ACID does not cover is the client losing the reply, so the idempotency key is what makes the retry safe.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Reading the C as "the database keeps my data consistent". It enforces only what you declared. Mixing it up with the C in CAP, which is about replicas agreeing, tells the interviewer you learned the letters and not the mechanisms.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'The transfer also has to publish a TransferCompleted event to Kafka. Is that atomic?',
            a: 'No: ACID stops at the database. Write the event to an outbox table in the same transaction as the transfer, and have a relay publish from the outbox. The publish is then at-least-once, so consumers dedupe on the event id. The distributed systems track covers the outbox in depth.',
          },
          {
            q: 'How can a database fsync on every commit and still do 20,000 commits a second?',
            a: 'Group commit. Transactions that commit at the same moment share one log flush, so its cost is spread across all of them. Each commit waits slightly longer and throughput rises enormously. Postgres exposes `commit_delay` to widen that window on purpose.',
          },
          {
            q: 'Is `synchronous_commit = off` ever acceptable?',
            a: 'For data whose last half-second is replaceable: analytics events, view counts, session touches. A crash loses recent commits but never corrupts the database or breaks a constraint. Postgres lets you set it per transaction, so the payment path stays synchronous while the click log does not.',
          },
          {
            q: 'Would you store balances or ledger entries?',
            a: 'Entries. Each transfer appends a debit and a credit that sum to zero, which is double-entry bookkeeping. "Money is conserved" becomes one query, history is never overwritten, and a balance is a sum you can still keep on the account row, updated in the same transaction.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-db-acid-1',
        moduleId: 'db-acid',
        stem: 'Postgres replied "commit ok" to a transfer, then the server lost power. After the restart the transfer is there. What made that true?',
        options: [
          'The changed data pages were written to disk at commit',
          'The commit record was flushed to the write-ahead log before the reply',
          'A checkpoint happened to run just before the crash',
          'The buffer pool survived because memory is battery-backed',
        ],
        correct: 1,
        explain:
          'Commit waits for the log flush, not for the data pages. Those are written later, and recovery replays the log to rebuild them. Writing every changed page at commit would make commits far slower, which is the whole point of a [[WAL]].',
      },
      {
        id: 'q-db-acid-2',
        moduleId: 'db-acid',
        stem: 'What does the C in [[ACID]] guarantee?',
        options: [
          'Every read sees the most recent write, on every replica',
          'Every business rule in your domain holds',
          'Replicas converge once writes stop',
          'The constraints you declared hold after every commit',
        ],
        correct: 3,
        explain:
          'The database enforces only what you declared: `NOT NULL`, `UNIQUE`, `CHECK`, foreign keys. Rules you never declared are your transactions\' job. The first option is linearisability, the C in [[CAP]]; the third is eventual consistency.',
      },
      {
        id: 'q-db-acid-3',
        moduleId: 'db-acid',
        stem: 'A handler debits an account in Postgres, commits, then publishes TransferCompleted to Kafka. The process crashes between the commit and the publish. What happens?',
        options: [
          'The debit rolls back, because the handler did not finish',
          'Kafka redelivers the event when the handler restarts',
          'The debit stays committed and the event is lost',
          'The transaction stays open until the publish succeeds',
        ],
        correct: 2,
        explain:
          'ACID stops at the database boundary. The commit is durable, and Kafka never heard about it. Writing the event to an outbox table in the same transaction is what makes the two agree.',
      },
    ],
    cards: [
      {
        id: 'c-db-acid-1',
        moduleId: 'db-acid',
        front: 'What makes a commit durable?',
        back: 'The commit record is flushed to the write-ahead log before the reply. Data pages are written later; recovery replays the log.',
        tag: 'ACID',
      },
      {
        id: 'c-db-acid-2',
        moduleId: 'db-acid',
        front: 'What does the C in ACID actually promise?',
        back: 'That your declared constraints hold after every transaction. Undeclared business rules are your code\'s job, and it is not the C in CAP.',
        tag: 'ACID',
      },
      {
        id: 'c-db-acid-3',
        moduleId: 'db-acid',
        front: 'What does ACID not cover?',
        back: 'Anything outside the database, such as a Kafka publish, an email or a second database, and a client that lost the reply after commit.',
        tag: 'ACID',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'db-isolation',
    trackId: 'databases',
    title: 'Isolation levels and their anomalies',
    station: 4,
    prereqs: ['db-acid'],
    related: ['c-cap', 'a-contention', 'f-db'],
    minutes: 11,
    summary: 'Five anomalies, the level that stops each, and the targeted fixes that beat raising the level.',
    objectives: [
      'Name the anomaly each isolation level allows',
      'Know the defaults: read committed in Postgres, repeatable read in MySQL',
      'Recognise write skew, and fix it with a constraint, a lock or serializable',
    ],
    keywords: [
      'read committed',
      'repeatable read',
      'snapshot isolation',
      'serializable',
      'write skew',
      'lost update',
      'phantom read',
      'dirty read',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'Most concurrency bugs that reach production are an anomaly the default isolation level permits, behaving exactly as documented. Interviewers know this. "Two requests book the last room at once: what happens?" is a question about isolation, and the strong answer names the anomaly, the level that prevents it, and the cheaper targeted fix.',
      },
      {
        kind: 'prose',
        text: 'Isolation levels are defined by what they forbid. Learn the five anomalies first; each level is just a list of which ones it lets through.',
      },
      { kind: 'heading', text: 'Five anomalies' },
      {
        kind: 'list',
        items: [
          '**Dirty read**: you read another transaction\'s uncommitted write. It rolls back, and you acted on data that never existed.',
          '**Non-repeatable read**: you read a row twice in one transaction and get two different committed values. Its multi-row cousin, read skew, is a report that reads account A before a transfer and account B after it, and finds 100 missing.',
          '**Phantom**: you run the same range query twice, and a row appears that another transaction inserted in between.',
          '**Lost update**: two read-modify-write cycles on the same row overlap, and the second write silently erases the first.',
          '**Write skew**: two transactions read the same rows, each decides based on what it read, and each writes a different row. No row was written twice, yet together they break a rule that neither broke alone.',
        ],
      },
      {
        kind: 'figure',
        caption: 'A lost update: both transactions read 10, both write 11. Two likes, one increment.',
        figure: {
          kind: 'sequence',
          actors: ['Tx A', 'likes row', 'Tx B'],
          steps: [
            { from: 0, to: 1, label: 'read: 10' },
            { from: 2, to: 1, label: 'read: 10' },
            { from: 0, to: 1, label: 'write 11, commit', tone: 'mastered' },
            { from: 2, to: 1, label: 'write 11, commit', tone: 'alert' },
            { from: 1, to: 1, label: 'final value 11, should be 12', tone: 'alert' },
          ],
        },
      },
      { kind: 'heading', text: 'The levels, anomaly by anomaly' },
      {
        kind: 'table',
        head: ['Level', 'Dirty read', 'Non-repeatable', 'Phantom', 'Lost update', 'Write skew'],
        rows: [
          ['**Read uncommitted**', 'allowed', 'allowed', 'allowed', 'allowed', 'allowed'],
          ['**Read committed**', 'prevented', 'allowed', 'allowed', 'allowed', 'allowed'],
          ['**Repeatable read**, MySQL', 'prevented', 'prevented', 'mostly prevented', 'allowed', 'allowed'],
          ['**Snapshot**, Postgres repeatable read', 'prevented', 'prevented', 'prevented', 'prevented', 'allowed'],
          ['**Serializable**', 'prevented', 'prevented', 'prevented', 'prevented', 'prevented'],
        ],
      },
      {
        kind: 'list',
        items: [
          'Postgres accepts read uncommitted but runs it as read committed, so it never shows a dirty read.',
          'Read committed in Postgres takes a fresh snapshot per statement. One query never sees half a transaction, but two queries in the same transaction can disagree.',
          'MySQL\'s repeatable read gives plain reads a snapshot, and locking reads take gap locks that block inserts into the range. It does not detect a lost update: an `UPDATE` writes over whatever is current.',
          'Snapshot isolation gives each transaction a frozen view, built with [[MVCC]]. Postgres aborts the second of two transactions that update the same row. What it cannot see is a conflict between writes to different rows, and that is exactly write skew.',
          'Oracle calls its snapshot isolation `SERIALIZABLE`. The name is not the guarantee; the anomaly list is.',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'Defaults',
        text: 'Postgres defaults to **read committed**. MySQL\'s InnoDB defaults to **repeatable read**. Oracle defaults to read committed, CockroachDB to serializable. If you have not chosen a level, you are running the default, with every anomaly it allows.',
      },
      { kind: 'heading', text: 'Write skew, the one snapshots miss' },
      {
        kind: 'prose',
        text: 'The hospital rule: at least one doctor must be on call. Alice and Bob are both on call and both feel unwell. Each transaction checks that two doctors are on call, then takes its own doctor off. Neither writes the other\'s row, so snapshot isolation sees no conflict. Both commit. Nobody is on call.',
      },
      {
        kind: 'figure',
        caption: 'Write skew: each transaction reads the same rows and writes a different one. Snapshot isolation commits both.',
        figure: {
          kind: 'sequence',
          actors: ['Tx A, Alice', 'doctors table', 'Tx B, Bob'],
          steps: [
            { from: 0, to: 1, label: 'count on call: 2' },
            { from: 2, to: 1, label: 'count on call: 2' },
            { from: 0, to: 1, label: 'set Alice off call' },
            { from: 2, to: 1, label: 'set Bob off call' },
            { from: 0, to: 1, label: 'commit', tone: 'mastered' },
            { from: 2, to: 1, label: 'commit: different row, no conflict', tone: 'alert' },
            { from: 1, to: 1, label: 'on call: 0, rule broken', tone: 'alert' },
          ],
        },
      },
      {
        kind: 'prose',
        text: 'The same shape is everywhere: two bookings for one meeting room, two accounts claiming one username, two withdrawals that each check the combined balance of a joint account. When the conflicting row does not exist yet, the second booking or the claimed name, it is a phantom causing write skew, and that decides which fix works.',
      },
      { kind: 'heading', text: 'Fixing it: constraint, lock, or serializable' },
      {
        kind: 'figure',
        caption: 'Pick the narrowest fix that covers the rule, not the strongest level for the whole database.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Can the rule be a constraint: unique, check or exclusion?',
            yes: { answer: 'Declare the constraint', sub: 'cheapest, and it covers every code path', tone: 'mastered' },
            no: {
              question: 'Do the rows the decision reads already exist?',
              yes: { answer: 'Lock them: SELECT … FOR UPDATE', sub: 'the second waits, then re-reads', tone: 'line' },
              no: { answer: 'Serializable, with retries', sub: 'or create a row to lock', tone: 'streak' },
            },
          },
        },
      },
      {
        kind: 'prose',
        text: '**A constraint** comes first whenever the rule fits one, because it holds for every client. A double-booked room is an overlap, and Postgres has a constraint for exactly that: with the `btree_gist` extension, `EXCLUDE USING gist (room_id WITH =, during WITH &&)` rejects any two bookings for one room whose time ranges intersect. A claimed username is a `UNIQUE` index.',
      },
      {
        kind: 'prose',
        text: '**A lock on what you read** works when those rows exist. Both transactions run `SELECT … FOR UPDATE` on the on-call doctors. The second blocks until the first commits, then re-reads and finds only one doctor left. It cannot lock a row that is not there yet, which is why it fails for the booking case.',
      },
      {
        kind: 'code',
        caption: 'Lock the rows the decision depends on. The second transaction re-reads after the first commits.',
        code: `BEGIN;
SELECT id FROM doctors
 WHERE shift_id = 1234 AND on_call
   FOR UPDATE;        -- the second caller waits here
-- in the app: continue only if two or more rows came back
UPDATE doctors SET on_call = false
 WHERE shift_id = 1234 AND id = 'alice';
COMMIT;`,
      },
      {
        kind: 'prose',
        text: '**Serializable** fixes every case, phantoms included, without you having to find the conflict. Postgres implements it as Serializable Snapshot Isolation: transactions run on snapshots as before, the database tracks which transaction read what another wrote, and when those reads and writes form a pattern that might not match any serial order, it aborts one with a serialization failure, error `40001`. Reads still never block. The price is that any transaction may fail and must be retried, so every side effect inside it has to be safe to repeat.',
      },
      {
        kind: 'code',
        caption: 'Serializable needs a retry loop around the whole transaction, not just the failed statement.',
        code: `async function serializable<T>(work: (tx: Tx) => Promise<T>) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await db.tx({ isolation: 'serializable' }, work)
    } catch (err) {
      const retryable = (err as PgError).code === '40001'
      if (!retryable || attempt === 5) throw err
      await sleep(10 * 2 ** attempt) // back off, then rerun
    }
  }
}`,
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'ACIDRain',
        text: 'In 2017, Stanford researchers examined twelve popular self-hosted e-commerce applications and found 22 attacks built on concurrency anomalies: firing simultaneous requests to spend a gift card twice, or to buy stock that was no longer there. Some came from running at a weak isolation level, others from work that should have been one transaction being split across several. Both are the same mistake: a check and a write that another request can slip between.',
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Postgres defaults to read committed, so this read-then-write can lose an update. I\'ll make it one atomic `UPDATE … SET stock = stock - 1 WHERE stock > 0`. The "at least one on call" rule is write skew, which even snapshot isolation allows, so that one transaction locks the rows it reads with `FOR UPDATE`, or runs at serializable with a retry.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Answering "use serializable" with no cost attached, or naming "repeatable read" as if it meant the same thing everywhere. MySQL\'s repeatable read loses the update; Postgres\'s aborts one of the two transactions. Name the anomaly, then the fix: the level\'s name is not the guarantee.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'Why not run everything at serializable?',
            a: 'Under contention, transactions abort and must be retried, so every code path needs a retry loop and side effects that are safe to repeat, and throughput falls on hot rows. Postgres\'s implementation is cheap when conflicts are rare, so a sound policy is serializable for the transactions that guard an invariant, as long as every transaction touching that invariant runs at serializable too.',
          },
          {
            q: 'A like counter loses increments under load. Fix it without changing the isolation level.',
            a: 'Make it one atomic statement, `UPDATE posts SET likes = likes + 1`, which re-reads the row under its lock at any level. If one post takes thousands of likes a second, that row lock becomes the bottleneck: spread the count across several rows and sum them, or buffer increments in Redis and flush them in batches.',
          },
          {
            q: 'Can a report at read committed show a wrong total?',
            a: 'Yes. Each statement gets its own snapshot, so a report that sums accounts in two queries can straddle a transfer and miss or double-count it: read skew. Run reports at repeatable read for one snapshot across the whole transaction. In Postgres that never blocks writers.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-db-isolation-1',
        moduleId: 'db-isolation',
        stem: 'Postgres, at its default level. Two requests each read `stock` as 5, compute 4 in the application, and run `UPDATE … SET stock = 4`. What happens?',
        options: [
          'Stock ends at 3, because each update is applied in turn',
          'Stock ends at 4: a lost update, and nothing reports it',
          'One request fails with a serialization error',
          'The two requests deadlock and one is killed',
        ],
        correct: 1,
        explain:
          'Read committed does not detect a lost update: the second write simply overwrites the first. At repeatable read Postgres would abort the second transaction instead. The cheapest fix needs no read at all: `SET stock = stock - 1` re-reads the row under its lock.',
      },
      {
        id: 'q-db-isolation-2',
        moduleId: 'db-isolation',
        stem: 'Under snapshot isolation, Alice and Bob each check that two doctors are on call, then each takes themself off. Both commit. Which anomaly is this, and what stops it?',
        options: [
          'A lost update, which snapshot isolation should have caught',
          'A dirty read, fixed by moving to read committed',
          'Write skew, fixed by locking the rows read with `FOR UPDATE`, or by serializable',
          'A phantom, fixed by adding an index on `on_call`',
        ],
        correct: 2,
        explain:
          'They wrote different rows, so there was no write–write conflict for snapshot isolation to catch. The conflict is between what each read and what the other wrote: write skew. Locking the rows read makes the two transactions collide; serializable detects the pattern for you.',
      },
      {
        id: 'q-db-isolation-3',
        moduleId: 'db-isolation',
        stem: 'A booking service checks for overlapping bookings, then inserts one, at Postgres repeatable read. Two requests for the same room and slot run at once. Which fix actually prevents the double booking?',
        options: [
          '`SELECT … FOR UPDATE` on the overlapping bookings before inserting',
          'Nothing more: repeatable read already gives each request a stable snapshot',
          'A plain index on `room_id`, so the check is fast',
          'An exclusion constraint on the room and the time range',
        ],
        correct: 3,
        explain:
          'There are no overlapping rows yet, so `FOR UPDATE` locks nothing and both inserts go ahead. The stable snapshot is the problem, not the cure: each request sees no booking. An exclusion constraint rejects the second insert whatever the interleaving.',
      },
    ],
    cards: [
      {
        id: 'c-db-isolation-1',
        moduleId: 'db-isolation',
        front: 'What are the default isolation levels in Postgres and MySQL?',
        back: 'Postgres: read committed. MySQL InnoDB: repeatable read. Neither is serializable unless you ask for it.',
        tag: 'Isolation',
      },
      {
        id: 'c-db-isolation-2',
        moduleId: 'db-isolation',
        front: 'What is write skew?',
        back: 'Two transactions read the same rows, each writes a different row, and together they break a rule neither broke alone. Snapshot isolation allows it.',
        tag: 'Isolation',
      },
      {
        id: 'c-db-isolation-3',
        moduleId: 'db-isolation',
        front: 'Why can `FOR UPDATE` not stop a double booking?',
        back: 'The conflicting row does not exist yet, so there is nothing to lock. Use a unique or exclusion constraint, a row to lock, or serializable.',
        tag: 'Isolation',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'db-engines',
    trackId: 'databases',
    title: 'Storage engines: B-trees vs LSM trees',
    station: 5,
    prereqs: ['db-isolation'],
    related: ['f-db', 'f-storage'],
    minutes: 13,
    summary: 'Pages updated in place versus sorted files merged later, and the three amplifications that decide between them.',
    objectives: [
      'Explain how a B-tree and an [[LSM]] tree each handle a write and a read',
      'Compare engines by write, read and space amplification instead of by "fast"',
      'Pick an engine for a workload, and say what it costs you',
    ],
    keywords: [
      'B-tree',
      'LSM tree',
      'log-structured merge',
      'SSTable',
      'compaction',
      'Bloom filter',
      'write amplification',
      'RocksDB',
    ],
    lesson: [
      {
        kind: 'prose',
        text: '"Design a key-value store." "Ingest a million metrics a second." "Why Cassandra here and not Postgres?" Each of these turns on the storage engine underneath, and most candidates answer with brand names. The senior answer names the data structure and what it costs.',
      },
      {
        kind: 'prose',
        text: 'There are two families. **B-trees** keep data in fixed-size pages and update them in place, which makes them read-optimised. **Log-structured merge trees**, [[LSM]] trees, never update in place. They buffer writes in memory, flush them as sorted files and merge those files later, which makes them write-optimised. Everything else is a consequence of that one difference.',
      },
      {
        kind: 'figure',
        caption: 'One write, two engines. The B-tree finds the page and rewrites it; the LSM tree appends now and merges later.',
        figure: {
          kind: 'split',
          left: {
            title: 'B-tree',
            tone: 'line',
            nodes: [
              { label: 'Write key 42', to: 'walk root to leaf' },
              { label: 'Leaf page', sub: '8 or 16 KB', tone: 'line', to: 'change in place' },
              { label: 'Page written back', sub: 'after the log' },
            ],
            cost: 'A random page write per change. A read follows one path.',
          },
          right: {
            title: 'LSM tree',
            tone: 'mastered',
            nodes: [
              { label: 'Write key 42', to: 'append' },
              { label: 'Memtable', sub: 'sorted, in memory', tone: 'mastered', to: 'flush when full' },
              { label: 'Sorted file', sub: 'merged later' },
            ],
            cost: 'Sequential writes only. A read may check several files.',
          },
          verdict: 'B-trees pay at write time so reads are cheap. LSM trees defer the work to background merges, and reads pay part of it.',
        },
      },
      { kind: 'heading', text: 'B-trees: pages, updated in place' },
      {
        kind: 'prose',
        text: 'A B-tree stores keys in sorted pages, 8 [[KB]] in Postgres and 16 KB in InnoDB, arranged as a tree. Inner pages hold keys and pointers to children; leaves hold the entries. With a few hundred keys per page, four levels cover billions of rows, and the upper levels stay in memory, so a point lookup usually costs one disk read and a range scan walks neighbouring leaves in order.',
      },
      {
        kind: 'prose',
        text: 'A write walks down to the right leaf and changes it there. When a leaf is full it splits in two and its parent gains a pointer. Every change is appended to the [[WAL]] first, so a crash mid-split cannot corrupt the tree. Because a crash can also tear a page half-written, Postgres logs a full image of each page on its first change after a checkpoint, and InnoDB uses a doublewrite buffer for the same reason.',
      },
      {
        kind: 'prose',
        text: 'Two engines, two layouts. InnoDB stores the table itself as a B-tree ordered by primary key, a clustered index, which is why random primary keys hurt it: every insert lands on a random leaf. Postgres keeps rows in an unordered heap with B-tree indexes beside it, and an update writes a new row version rather than overwriting the old one, which vacuum reclaims later.',
      },
      { kind: 'heading', text: 'LSM trees: append, then merge' },
      {
        kind: 'list',
        ordered: true,
        items: [
          'Append the write to a commit log, for durability. It is the same idea as the write-ahead log.',
          'Insert it into the **memtable**, a sorted structure in memory; RocksDB uses a skip list.',
          'When the memtable fills, at 64 [[MB]] by default in RocksDB, freeze it and flush it to disk as an **SSTable**, a sorted string table: a sorted, immutable file.',
          'In the background, **compaction** merges SSTables, keeping the newest version of each key and dropping overwritten values and deletion markers.',
        ],
      },
      {
        kind: 'prose',
        text: 'Nothing is updated in place. An update is a newer entry for the same key, and a delete is a **tombstone**, a marker that hides older entries until compaction removes them. The design comes from the 1996 paper by O\'Neil and colleagues; the words memtable and SSTable come from Google\'s Bigtable paper in 2006.',
      },
      {
        kind: 'prose',
        text: 'Compaction arranges the files in levels. In RocksDB\'s classic leveled configuration, level 1 holds 256 MB and each level below is ten times the one above, so level 3 alone holds 25 [[GB]]. Most of the data lives at the bottom, and most compaction work is moving it there.',
      },
      {
        kind: 'figure',
        caption: 'Leveled compaction in RocksDB: each level is about ten times the one above, so most data sits at the bottom.',
        figure: {
          kind: 'stack',
          layers: [
            { label: 'Memtable', sub: '64 MB, in memory', tone: 'line' },
            { label: 'Level 0', sub: 'flushed files, may overlap', tone: 'streak' },
            { label: 'Level 1', sub: '256 MB', tone: 'neutral' },
            { label: 'Level 2', sub: '2.5 GB', tone: 'neutral' },
            { label: 'Level 3', sub: '25 GB, most of the data', tone: 'neutral' },
          ],
          note: 'Compaction merges files into the level below, rewriting each byte every time it moves down.',
        },
      },
      {
        kind: 'prose',
        text: 'Reads pay for the deferral. A lookup checks the memtable, then each level from newest to oldest, stopping at the first hit. To avoid opening every file, each SSTable carries a **Bloom filter**: a compact bit array that answers "definitely not here" or "maybe here". At about ten bits per key it is wrong roughly 1% of the time, so a point read usually touches a single data block. Range scans get no help from it: they must merge entries from every level.',
      },
      {
        kind: 'figure',
        caption: 'A point read in an LSM tree. Bloom filters rule files out without touching the disk.',
        figure: {
          kind: 'flow',
          nodes: [
            { label: 'get(42)', to: 'check' },
            { label: 'Memtable', sub: 'not there', to: 'next' },
            { label: 'Level 0 filters', sub: 'definitely not', to: 'skip' },
            { label: 'Level 1 filter', sub: 'maybe', tone: 'line', to: 'one block read' },
            { label: 'Found', tone: 'mastered' },
          ],
        },
      },
      { kind: 'heading', text: 'Amplification: the three costs' },
      {
        kind: 'prose',
        text: 'Compare engines on three ratios, not on "fast". No engine minimises all three: lowering one pushes up another.',
      },
      {
        kind: 'table',
        head: ['Cost', 'Measures', 'B-tree', 'LSM tree'],
        rows: [
          ['**Write amplification**', 'Bytes written to disk per byte you wrote', 'A whole page per small change, plus the log record', 'Each byte rewritten every time compaction moves it down a level'],
          ['**Read amplification**', 'Disk reads per query', 'About one, because the upper levels are cached', 'One per level at worst; Bloom filters bring point reads close to one'],
          ['**Space amplification**', 'Bytes on disk per byte of live data', 'Half-empty pages after splits, and dead row versions until vacuum', 'Old versions and tombstones until compaction; about 1.1× with leveled compaction'],
        ],
      },
      {
        kind: 'prose',
        text: 'The headline trade: disks and flash both handle large sequential writes better than small random ones, by far on spinning disks and with less wear on flash. Turning random page writes into sequential appends is where an LSM tree\'s write throughput comes from. It pays in read amplification, in space until compaction catches up, and in compaction itself: background disk bandwidth that competes with your queries.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Leveled compaction',
          points: [
            'RocksDB\'s default',
            'Each level is one sorted run, about ten times the last',
            'Low space and read amplification',
            'Higher write amplification: data is rewritten at every level',
          ],
        },
        right: {
          title: 'Size-tiered compaction',
          points: [
            'Cassandra\'s long-standing default',
            'Merges files of similar size once enough have accumulated',
            'Lower write amplification',
            'Higher space amplification: a big merge can briefly need double the disk',
          ],
        },
        verdict: 'Leveled for read-heavy or space-tight data, size-tiered for write-heavy data that is read less. For time series that expire, Cassandra\'s time-window compaction drops whole files as they age out.',
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'Facebook\'s MyRocks',
        text: 'Facebook moved its main MySQL user database from InnoDB to MyRocks, which is MySQL running on RocksDB, an LSM engine. The motive was not query speed but space and write amplification: at that size, a B-tree\'s half-empty pages and page-sized writes meant more flash to buy and drives that wore out sooner.',
      },
      {
        kind: 'callout',
        tone: 'note',
        title: 'Tombstones are a read cost',
        text: 'A queue modelled as a Cassandra table, where you insert, read and delete, is a known anti-pattern. Every delete leaves a tombstone, and reading the head of the queue scans past thousands of them until compaction runs. By default Cassandra aborts a query that reads 100,000 tombstones.',
      },
      { kind: 'heading', text: 'Who uses which' },
      {
        kind: 'table',
        head: ['Engine', 'Structure', 'Where you meet it'],
        rows: [
          ['**Postgres**', 'Heap plus B-tree indexes', 'General relational workloads'],
          ['**MySQL InnoDB**', 'Clustered B-tree on the primary key', 'MySQL\'s default engine'],
          ['**SQLite**', 'B-tree', 'Phones, browsers, embedded devices'],
          ['**MongoDB WiredTiger**', 'B-tree', 'MongoDB\'s default engine'],
          ['**RocksDB**', '[[LSM|LSM tree]], leveled', 'MyRocks, TiKV, Kafka Streams state stores'],
          ['**Pebble**', 'LSM tree, RocksDB-compatible', 'CockroachDB'],
          ['**Cassandra, ScyllaDB**', 'LSM tree', 'Write-heavy wide-column data'],
          ['**HBase, Bigtable**', 'LSM tree', 'Huge sorted tables over a distributed file system'],
        ],
      },
      {
        kind: 'figure',
        caption: 'Start from the write rate and the shape of the reads, not from the brand.',
        figure: {
          kind: 'decision',
          root: {
            question: 'Do writes dominate, such as ingest, events or time series, at rates random page writes struggle with?',
            yes: {
              question: 'Are reads by key or by a recent range, not ad hoc queries?',
              yes: { answer: 'An LSM store', sub: 'Cassandra, or a RocksDB-based engine', tone: 'mastered' },
              no: { answer: 'LSM for ingest, plus a query store', sub: 'feed an analytical store from it' },
            },
            no: { answer: 'A B-tree', sub: 'Postgres or InnoDB, the default', tone: 'line' },
          },
        },
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'This is write-heavy, half a million events a second that are never updated and are read by device and recent window, so I want an LSM-based store such as Cassandra: every write is a sequential append. The cost is read and space amplification plus compaction load, so I\'ll partition by device and day so a read hits one partition, and use time-window compaction so expired days drop as whole files.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Saying "LSM trees are faster" or "B-trees are slow to write" and stopping there. Each engine moves cost rather than removing it. If you pick an LSM store, say what you pay, which is read amplification, compaction bandwidth and tombstones, and how the design keeps each one small.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'What happens when compaction falls behind?',
            a: 'Files pile up in level 0, so every read checks more of them and latency climbs, and obsolete data stays on disk, so space grows. RocksDB then slows writes and eventually stops them until compaction catches up. Capacity-plan for compaction, meaning disk bandwidth and free-space headroom, not just for the ingest rate.',
          },
          {
            q: 'Why do random keys hurt InnoDB more than an LSM store?',
            a: 'InnoDB clusters the table on its primary key, so a random key inserts into a random leaf: page splits, half-empty pages and a cold cache. An LSM store sorts in the memtable and writes files sequentially whatever the key order, so insert order barely matters to it.',
          },
          {
            q: 'Can an LSM store do range scans well?',
            a: 'Yes, because every file is sorted, but a scan has to merge the range from the memtable and from every level, and Bloom filters cannot help. Leveled compaction keeps the number of sorted runs small, which is why it is the better choice when range reads matter.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-db-engines-1',
        moduleId: 'db-engines',
        stem: 'A sensor fleet writes 400,000 small readings a second. Readings are never updated and are read by sensor and recent time window. Which engine family fits, and what do you pay?',
        options: [
          'A B-tree, because its reads are faster',
          'An LSM tree: sequential writes, paid for in read and space amplification and compaction',
          'An LSM tree, because it has no write amplification',
          'An in-memory hash index, because it is the fastest structure',
        ],
        correct: 1,
        explain:
          'The workload is append-heavy, which is what an LSM tree is built for. It is not free: compaction rewrites each byte several times, and a read may check several files. A hash index cannot serve the time-range read at all.',
      },
      {
        id: 'q-db-engines-2',
        moduleId: 'db-engines',
        stem: 'What does an SSTable\'s Bloom filter tell a point read?',
        options: [
          'The block offset where the key is stored',
          'That the key is definitely in the file',
          'The newest version of the key across all levels',
          'That the key is definitely not in the file, or might be',
        ],
        correct: 3,
        explain:
          'A Bloom filter has false positives but never false negatives. "Not here" lets the read skip the file without touching disk; "maybe" costs a block read that is occasionally wasted. The block offset comes from the file\'s separate index.',
      },
      {
        id: 'q-db-engines-3',
        moduleId: 'db-engines',
        stem: 'Which of these is write amplification in a B-tree?',
        options: [
          'A 100-byte update rewrites an 8 KB page and also appends a log record',
          'A lookup walks three levels of pages',
          'Pages sit half-empty after splits',
          'Hot pages are cached in the buffer pool',
        ],
        correct: 0,
        explain:
          'Write amplification is bytes written to disk per byte you changed. The walk down the tree is read amplification, half-empty pages are space amplification, and the buffer pool is what keeps read amplification low.',
      },
    ],
    cards: [
      {
        id: 'c-db-engines-1',
        moduleId: 'db-engines',
        front: 'B-tree versus LSM tree, in one line?',
        back: 'B-trees rewrite fixed pages in place and favour reads. LSM trees append sorted files and merge them later, favouring writes.',
        tag: 'Storage engines',
      },
      {
        id: 'c-db-engines-2',
        moduleId: 'db-engines',
        front: 'What are the three amplifications?',
        back: 'Write: disk bytes per byte written. Read: disk reads per query. Space: disk bytes per live byte. No engine minimises all three.',
        tag: 'Storage engines',
      },
      {
        id: 'c-db-engines-3',
        moduleId: 'db-engines',
        front: 'Which databases are built on LSM trees?',
        back: 'RocksDB, LevelDB, Cassandra, ScyllaDB, HBase and CockroachDB\'s Pebble. Postgres, InnoDB, SQLite and WiredTiger are B-trees.',
        tag: 'Storage engines',
      },
    ],
  },
]
