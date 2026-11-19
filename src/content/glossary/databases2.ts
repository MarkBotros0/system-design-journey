import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the databases2 content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: 'OLTP',
    full: 'Online Transaction Processing',
    gist: 'The workload of a running product: many small reads and writes, each touching a few rows by key, inside transactions. Row-oriented databases like Postgres are built for it. Scanning a year of data for a report is the opposite workload and belongs in an analytics store.',
    figure: {
      kind: 'split',
      left: {
        title: 'Transactional',
        tone: 'line',
        nodes: [
          { label: 'Many small queries', sub: 'one order, one user', to: 'each touches' },
          { label: 'A few whole rows', tone: 'line' },
        ],
        cost: 'Row store: Postgres, MySQL.',
      },
      right: {
        title: 'Analytical',
        tone: 'neutral',
        nodes: [
          { label: 'Few large queries', sub: 'revenue by month', to: 'each scans' },
          { label: 'Millions of rows, a few columns', tone: 'neutral' },
        ],
        cost: 'Column store: ClickHouse, BigQuery.',
      },
      verdict: 'Same data, opposite access patterns. That is why they end up in different databases.',
    },
    caption: 'Transactional work against analytical work.',
    seeAlso: ['OLAP', 'ACID'],
  },
  {
    id: 'RPO',
    full: 'Recovery Point Objective',
    gist: 'How much recently committed data you can afford to lose in a failure, measured in time. Asynchronous replication gives an RPO equal to the replication lag; synchronous replication gives zero, paid for on every commit.',
    figure: {
      kind: 'timeline',
      ticks: ['last safe copy', 'failure', 'service back'],
      lanes: [
        {
          label: 'Data',
          bars: [{ from: 0, to: 0.5, label: 'lost: the RPO', tone: 'alert' }],
        },
        {
          label: 'Service',
          bars: [{ from: 0.5, to: 1, label: 'down: the RTO', tone: 'streak' }],
        },
      ],
      note: 'Looking back from the failure is the RPO. Looking forward to recovery is the RTO.',
    },
    caption: 'The two numbers that describe a failure: data lost, and time down.',
    seeAlso: ['RTO', 'SLA'],
  },
  {
    id: 'RTO',
    full: 'Recovery Time Objective',
    gist: 'How long the service may be down after a failure. Automatic failover to a replica typically takes a minute or two; restoring from a backup can take hours. The RTO you promise decides which one you have to build.',
    figure: {
      kind: 'scale',
      items: [
        { label: 'Automatic failover to a replica', display: 'a minute or two', value: 60, tone: 'mastered' },
        { label: 'Manual failover, someone paged', display: 'tens of minutes', value: 1800, tone: 'streak' },
        { label: 'Restore from backup', display: 'hours', value: 14400, tone: 'alert' },
      ],
      note: 'Each step down is roughly an order of magnitude slower.',
    },
    caption: 'Recovery strategies sit orders of magnitude apart, so the promised RTO picks the strategy.',
    seeAlso: ['RPO', 'SLA'],
  },
]
