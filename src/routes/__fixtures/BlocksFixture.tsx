import type { Block } from '../../content/types'
import { Blocks } from '../../components/content/Blocks'
import { TopBar, PageTitle } from '../../components/ui/TopBar'

/** Dev-only: one of every block and figure kind, for eyeballing at 375px. */
const BLOCKS: Block[] = [
  { kind: 'heading', text: 'Sequence' },
  {
    kind: 'figure',
    caption: 'Two-phase commit: nobody commits until everyone has voted yes.',
    figure: {
      kind: 'sequence',
      actors: ['Coordinator', 'Orders DB', 'Payments DB'],
      steps: [
        { from: 0, to: 1, label: 'prepare' },
        { from: 0, to: 2, label: 'prepare' },
        { from: 1, to: 0, label: 'yes', dashed: true },
        { from: 2, to: 0, label: 'yes', dashed: true },
        { from: 0, to: 0, label: 'decision logged' },
        { from: 0, to: 1, label: 'commit', tone: 'mastered' },
        { from: 0, to: 2, label: 'commit', tone: 'mastered' },
      ],
    },
  },
  {
    kind: 'figure',
    caption: 'Five actors scroll inside the frame.',
    figure: {
      kind: 'sequence',
      actors: ['Browser', 'App', 'Auth server', 'Resource API', 'Database'],
      steps: [
        { from: 0, to: 2, label: 'authorize + PKCE challenge' },
        { from: 2, to: 0, label: 'code', dashed: true },
        { from: 0, to: 1, label: 'code' },
        { from: 1, to: 2, label: 'code + verifier' },
        { from: 3, to: 4, label: 'query', tone: 'streak' },
      ],
    },
  },
  { kind: 'heading', text: 'Classes' },
  {
    kind: 'figure',
    caption: 'Strategy: the context holds an interface; each algorithm is a class.',
    figure: {
      kind: 'classes',
      classes: [
        { name: 'PricingStrategy', stereotype: 'interface', methods: ['price(cart): Money'], tone: 'line' },
        { name: 'RegularPricing', methods: ['price(cart): Money'] },
        { name: 'SalePricing', fields: ['discount: number'], methods: ['price(cart): Money'] },
        { name: 'Checkout', fields: ['strategy: PricingStrategy'], methods: ['total(): Money'] },
      ],
      relations: [
        { from: 'RegularPricing', to: 'PricingStrategy', kind: 'implements' },
        { from: 'SalePricing', to: 'PricingStrategy', kind: 'implements' },
        { from: 'Checkout', to: 'PricingStrategy', kind: 'has', label: 'injected' },
        { from: 'Checkout', to: 'RegularPricing', kind: 'uses' },
      ],
    },
  },
  { kind: 'heading', text: 'Decision' },
  {
    kind: 'figure',
    caption: 'Pick the store from the access pattern, not from fashion.',
    figure: {
      kind: 'decision',
      root: {
        question: 'Do you need multi-row transactions?',
        yes: { answer: 'Relational (Postgres)', tone: 'line' },
        no: {
          question: 'Is the access pattern a key lookup at huge scale?',
          yes: { answer: 'Key-value / wide-column', sub: 'DynamoDB, Cassandra' },
          no: {
            question: 'Is it search over text?',
            yes: { answer: 'Search engine', sub: 'Elasticsearch' },
            no: { answer: 'Relational anyway', sub: 'the boring default', tone: 'mastered' },
          },
        },
      },
    },
  },
  { kind: 'heading', text: 'Code' },
  {
    kind: 'codeCompare',
    before: {
      title: 'Violates SRP',
      code: `class Invoice {\n  total(): Money { /* pricing */ }\n  saveToDb(db: Db): void { /* persistence */ }\n  toPdf(): Buffer { /* rendering */ }\n}`,
    },
    after: {
      title: 'One reason to change',
      code: `class Invoice {\n  total(): Money { /* pricing */ }\n}\nclass InvoiceRepo {\n  save(i: Invoice): void { /* … */ }\n}`,
    },
    note: 'Persistence changes no longer touch pricing logic.',
  },
  {
    kind: 'code',
    code: `// a very long line that must scroll inside the block rather than pushing the whole page sideways on a phone\nconst n = 42`,
    caption: 'Long lines scroll in place.',
  },
  { kind: 'callout', tone: 'example', text: 'Stripe stores every **idempotency key** for 24 hours.' },
  { kind: 'callout', tone: 'say', text: 'Say this.' },
  { kind: 'callout', tone: 'trap', text: 'The trap.' },
  {
    kind: 'followups',
    items: [
      { q: 'What if two requests read the same row and both update it?', a: 'That is a **lost update**. Use a version column.' },
      { q: 'Why not serializable everywhere?', a: 'Throughput. Abort rates climb with contention.' },
    ],
  },
]

export function BlocksFixture() {
  return (
    <div>
      <TopBar title="Fixture" back={{ label: 'Home', to: '/' }} />
      <PageTitle title="Every block kind" />
      <Blocks blocks={BLOCKS} />
    </div>
  )
}
