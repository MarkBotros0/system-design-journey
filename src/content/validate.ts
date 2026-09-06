import type { Block, Module, Problem } from './types'
import { glossaryIds } from './glossary'

/**
 * Content rules, checked at load time in development.
 *
 * The house rules this enforces:
 *
 *   1. Every module and every problem carries at least one figure. This subject is
 *      mechanisms and trade-offs; a wall of prose is a failure of effort, not a style.
 *   2. No abbreviation appears without somewhere to see what it means. If a module uses
 *      `TTL`, it must wrap it as `[[TTL]]` at least once in that module, and there must
 *      be a glossary entry with an illustration behind it.
 *
 * Rule 2 is per-module rather than per-occurrence on purpose: wrapping all nineteen
 * mentions of `GB` would shred the reading rhythm for no benefit. Once per module means
 * the reader can always find the expansion in the thing they are currently reading.
 */

export interface ContentIssue {
  where: string
  message: string
}

/** Mixed-case terms that still need an explanation. Plain regex cannot spot these. */
const MIXED_CASE_TERMS = [
  'NoSQL',
  'gRPC',
  'WebSocket',
  'TiB',
  'PostGIS',
  'SimHash',
  'HyperLogLog',
  'S3',
  'S2',
  'L4',
  'L7',
]

/**
 * Capitalised tokens that are not abbreviations needing expansion: product names, proper
 * nouns, query-language keywords that survived code stripping, and ordinary English.
 */
const ALLOWED = new Set([
  // Products and companies
  'AWS_PRODUCTS_BELOW',
  'Postgres', 'PostgreSQL', 'MySQL', 'MongoDB', 'DynamoDB', 'Cassandra', 'Redis',
  'Memcached', 'Kafka', 'Flink', 'Kinesis', 'Elasticsearch', 'Lucene', 'Temporal',
  'Stripe', 'Cloudflare', 'Akamai', 'CloudFront', 'Neo4j', 'Amazon', 'Google', 'Azure',
  'WhatsApp', 'YouTube', 'Uber', 'Bitly', 'Dropbox', 'Instagram', 'Twitter', 'Yelp',
  'Ticketmaster', 'Safari', 'Chrome', 'GraphQL', 'HTML', 'JSON', 'XML', 'CSS', 'Lua',
  'Bloom', 'Workbox', 'Vite', 'React', 'Throughput',
  // Query and code keywords that can appear outside backticks
  'SELECT', 'FROM', 'WHERE', 'SET', 'NX', 'EX', 'INCR', 'ZADD', 'HMGET', 'KEYS',
  'GET', 'POST', 'PUT', 'DELETE', 'LIKE', 'AND', 'OR', 'FOR', 'UPDATE', 'ORDER',
  'BY', 'NULL', 'JOIN', 'ACK', 'SYN',
  // Ordinary English and proper nouns that match the shape
  'A', 'I', 'OK', 'TV', 'US', 'UK', 'EU', 'ID', 'IDs', 'DMs', 'UI', 'UX', 'DB', 'LB',
  'PhD', 'Mr', 'St',
])

function blockTexts(block: Block): string[] {
  switch (block.kind) {
    case 'prose':
    case 'heading':
      return [block.text]
    case 'list':
      return block.items
    case 'callout':
      return [block.text, block.title ?? '']
    case 'table':
      return [...block.head, ...block.rows.flat()]
    case 'code':
      // Code is exempt — an identifier is not prose, and backticks already mark it.
      return [block.caption ?? '']
    case 'flow':
      return [block.note ?? '']
    case 'compare':
      return [block.left.title, block.right.title, ...block.left.points, ...block.right.points, block.verdict ?? '']
    case 'ladder':
      return block.rungs.flatMap((r) => [r.title, r.text])
    case 'figure':
      return [block.caption]
  }
}

/** Remove code spans, then pull out and record every wrapped abbreviation. */
function scan(texts: string[]): { plain: string; wrapped: Set<string> } {
  const wrapped = new Set<string>()
  const cleaned = texts.map((t) => {
    if (!t) return ''
    return (
      t
        // `code` is exempt from the abbreviation rule
        .replace(/`[^`]*`/g, ' ')
        // record and unwrap [[TTL]] / [[TTL|TTLs]]
        .replace(/\[\[([^\]]+)\]\]/g, (_m, inner: string) => {
          const [id, display] = String(inner).split('|')
          wrapped.add(id.trim())
          return ` ${display ?? id} `
        })
    )
  })
  return { plain: cleaned.join(' \n '), wrapped }
}

function findAbbreviations(plain: string): Set<string> {
  const found = new Set<string>()

  for (const m of plain.matchAll(/\b[A-Z]{2,}\b/g)) {
    found.add(m[0])
  }
  for (const term of MIXED_CASE_TERMS) {
    // Word-boundary match, tolerating a trailing plural.
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`)
    if (re.test(plain)) found.add(term)
  }

  // Plurals and possessives of pure acronyms collapse to the base form.
  const normalised = new Set<string>()
  for (const f of found) {
    const base = f.replace(/(S|s)$/, (s) => (s === 's' ? '' : s))
    normalised.add(base.length >= 2 ? base : f)
  }
  return normalised
}

function checkUnit(
  where: string,
  texts: string[],
  hasFigure: boolean,
  issues: ContentIssue[],
): void {
  if (!hasFigure) {
    issues.push({ where, message: 'has no figure — every module and problem needs at least one' })
  }

  const { plain, wrapped } = scan(texts)

  for (const id of wrapped) {
    if (!glossaryIds.includes(id)) {
      issues.push({ where, message: `[[${id}]] has no glossary entry` })
    }
  }

  for (const abbr of findAbbreviations(plain)) {
    if (ALLOWED.has(abbr)) continue
    if (wrapped.has(abbr)) continue
    if (!glossaryIds.includes(abbr)) {
      issues.push({
        where,
        message: `"${abbr}" is used but has no glossary entry — add one, or add it to ALLOWED if it needs no expansion`,
      })
    } else {
      issues.push({
        where,
        message: `"${abbr}" is never wrapped here — write [[${abbr}]] at its first mention in this unit`,
      })
    }
  }
}

export function validateContent(modules: Module[], problems: Problem[]): ContentIssue[] {
  const issues: ContentIssue[] = []

  for (const m of modules) {
    const texts = [
      m.title,
      m.summary,
      ...m.lesson.flatMap(blockTexts),
      ...m.quiz.flatMap((q) => [q.stem, ...q.options, q.explain]),
      ...m.cards.flatMap((c) => [c.front, c.back]),
    ]
    checkUnit(
      `module ${m.id}`,
      texts,
      m.lesson.some((b) => b.kind === 'figure'),
      issues,
    )
  }

  for (const p of problems) {
    const texts = [
      p.title,
      p.brief,
      ...p.modelAnswer.flatMap(blockTexts),
      ...p.rubric.map((r) => r.criterion),
    ]
    checkUnit(
      `problem ${p.id}`,
      texts,
      p.modelAnswer.some((b) => b.kind === 'figure'),
      issues,
    )
  }

  return issues
}
