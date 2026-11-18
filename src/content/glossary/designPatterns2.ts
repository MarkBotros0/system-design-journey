import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the designPatterns2 content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: 'DOM',
    full: 'Document Object Model',
    gist: 'The browser\'s tree of objects for a page. Every element and every run of text is a node, and an element holds child nodes, which makes it the textbook composite. `addEventListener` on those nodes is the textbook observer.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'document', sub: 'the root node', tone: 'line', to: 'contains' },
        { label: '<body>', sub: 'an element', to: 'contains' },
        { label: '<ul>', sub: 'an element', to: 'contains' },
        { label: '<li>', sub: 'holds a text node' },
      ],
      note: 'Every box answers the same calls (appendChild, textContent) whether it holds one node or ten thousand.',
    },
    caption: 'One path down the DOM: each box is a node, and any node can contain more nodes.',
  },
  {
    id: 'CRUD',
    full: 'Create, Read, Update, Delete',
    gist: 'The four basic operations on stored records. A "CRUD app" is one whose logic is mostly moving data between a form and a table, which is where heavy domain modelling turns into ceremony.',
    figure: {
      kind: 'grid',
      cols: 4,
      cells: [
        { label: 'Create', tone: 'line' },
        { label: 'Read', tone: 'line' },
        { label: 'Update', tone: 'line' },
        { label: 'Delete', tone: 'line' },
        { label: 'POST' },
        { label: 'GET' },
        { label: 'PUT / PATCH' },
        { label: 'DELETE' },
        { label: 'INSERT' },
        { label: 'SELECT' },
        { label: 'UPDATE' },
        { label: 'DELETE' },
      ],
      legend: [{ tone: 'line', label: 'the operation' }],
      note: 'Row two is the HTTP method a REST API uses; row three is the SQL statement underneath.',
    },
    caption: 'The same four verbs at three layers: the operation, its HTTP method, its SQL statement.',
    seeAlso: ['REST', 'SQL'],
  },
  {
    id: 'ORM',
    full: 'Object-Relational Mapper',
    gist: 'A library that maps database rows to objects and back, so code works with an `Order` instead of writing SQL. Convenient until its lazy loading leaks: the classic cost is the N+1 query, one query for a list and one more for each item in it.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'order.items', sub: 'your code', tone: 'line', to: 'generates' },
        { label: 'SELECT … FROM items', sub: 'SQL', to: 'returns rows' },
        { label: 'Postgres', sub: 'tables' },
      ],
      note: 'Hibernate, ActiveRecord, SQLAlchemy and Prisma all work this way.',
    },
    caption: 'An ORM turns a property access into a query, and the rows that come back into objects.',
    seeAlso: ['SQL'],
  },
]
