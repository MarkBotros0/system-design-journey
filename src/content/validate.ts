import type { Block, FigureSpec, Module, Problem, Question } from './types'
import { glossaryIds } from './glossary'
import { isDecisionNode, type DecisionLeaf, type DecisionNode } from './figures'
import { getCategory } from './categories'
import { plainText } from '../lib/text'
import { headingSlugs } from '../lib/slug'

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
      return [...block.nodes, block.note ?? '']
    case 'compare':
      return [block.left.title, block.right.title, ...block.left.points, ...block.right.points, block.verdict ?? '']
    case 'ladder':
      return block.rungs.flatMap((r) => [r.title, r.text])
    case 'figure':
      return [block.caption, ...figureTexts(block.figure)]
    case 'codeCompare':
      // The code itself is exempt, as with `code`; the titles and note are prose.
      return [block.before.title, block.after.title, block.note ?? '']
    case 'followups':
      return block.items.flatMap((f) => [f.q, f.a])
  }
}

function decisionTexts(n: DecisionNode | DecisionLeaf): string[] {
  if (!isDecisionNode(n)) return [n.answer, n.sub ?? '']
  return [n.question, ...decisionTexts(n.yes), ...decisionTexts(n.no)]
}

function decisionDepth(n: DecisionNode | DecisionLeaf): number {
  return isDecisionNode(n) ? 1 + Math.max(decisionDepth(n.yes), decisionDepth(n.no)) : 0
}

/** Labels inside a figure are prose too — an unexplained acronym in a box still counts. */
function figureTexts(f: FigureSpec): string[] {
  switch (f.kind) {
    case 'flow':
      return [...f.nodes.flatMap((n) => [n.label, n.sub ?? '', n.to ?? '']), f.note ?? '']
    case 'stack':
      return [...f.layers.flatMap((l) => [l.label, l.sub ?? '']), f.note ?? '']
    case 'split':
      return [
        f.left.title,
        f.right.title,
        f.left.cost ?? '',
        f.right.cost ?? '',
        ...[...f.left.nodes, ...f.right.nodes].flatMap((n) => [n.label, n.sub ?? '', n.to ?? '']),
        f.verdict ?? '',
      ]
    case 'ratio':
      return [...f.parts.map((p) => p.label), f.note ?? '']
    case 'grid':
      return [
        ...f.cells.map((c) => c.label ?? ''),
        ...(f.legend ?? []).map((l) => l.label),
        f.note ?? '',
      ]
    case 'timeline':
      return [
        ...f.ticks,
        ...f.lanes.flatMap((l) => [
          l.label,
          l.outcome?.label ?? '',
          ...l.bars.map((b) => b.label ?? ''),
        ]),
        f.note ?? '',
      ]
    case 'scale':
      return [...f.items.flatMap((i) => [i.label, i.display]), f.note ?? '']
    case 'cycle':
      return [...f.steps.flatMap((s) => [s.label, s.sub ?? '']), f.note ?? '']
    case 'sequence':
      return [...f.actors, ...f.steps.map((s) => s.label), f.note ?? '']
    case 'classes':
      return [
        ...f.classes.flatMap((c) => [c.name, ...(c.fields ?? []), ...(c.methods ?? [])]),
        ...f.relations.map((r) => r.label ?? ''),
        f.note ?? '',
      ]
    case 'decision':
      return [...decisionTexts(f.root), f.note ?? '']
  }
}

/** Structural checks on figures that types cannot express. */
function figureShapeIssues(blocks: Block[]): string[] {
  const out: string[] = []
  for (const b of blocks) {
    if (b.kind !== 'figure') continue
    const f = b.figure
    if (f.kind === 'decision' && decisionDepth(f.root) > 3) {
      out.push('a decision figure is deeper than 3 questions — split it or simplify')
    }
    if (f.kind === 'sequence') {
      for (const s of f.steps) {
        if (s.from < 0 || s.to < 0 || s.from >= f.actors.length || s.to >= f.actors.length) {
          out.push(`sequence step "${s.label}" points at an actor that does not exist`)
        }
      }
    }
    if (f.kind === 'classes') {
      const names = new Set(f.classes.map((c) => c.name))
      for (const r of f.relations) {
        if (!names.has(r.from) || !names.has(r.to)) {
          out.push(`class relation ${r.from} → ${r.to} names a class that is not drawn`)
        }
      }
    }
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Problem shape                                                       */
/* ------------------------------------------------------------------ */

/**
 * The walkthrough is stepped through phase by phase, so its headings must follow the
 * interview skeleton for its kind, in order. Each entry is a heading prefix; matching is
 * case-insensitive on the plain text. Extra headings in between are fine.
 */
const SKELETON: Record<Problem['kind'], string[]> = {
  hld: ['Requirements', 'Core entities', 'API', 'High-level design', 'Deep dive'],
  lld: ['Requirements', 'Core objects', 'Classes', 'Key methods', 'Patterns', 'Concurrency'],
}

export function validateProblemShape(p: Problem): string[] {
  const out: string[] = []

  const category = getCategory(p.category)
  if (!category) out.push(`unknown category "${p.category}"`)
  else if (category.kind !== p.kind) {
    out.push(`category "${p.category}" is for ${category.kind} problems, but this is ${p.kind}`)
  }

  const headings = p.modelAnswer
    .filter((b): b is Extract<Block, { kind: 'heading' }> => b.kind === 'heading')
    .map((b) => plainText(b.text).toLowerCase())
  let cursor = 0
  for (const want of SKELETON[p.kind]) {
    const at = headings.findIndex((h, i) => i >= cursor && h.startsWith(want.toLowerCase()))
    if (at === -1) {
      out.push(`walkthrough is missing a "${want}…" heading (in skeleton order)`)
    } else {
      cursor = at + 1
    }
  }

  const n = p.followups?.length ?? 0
  if (n < 3) out.push(`has ${n} follow-up questions — needs 3 to 5`)

  return out
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

/**
 * Glossary abbreviations a unit shows but never wraps where wrapping renders. `renderable`
 * goes through Inline (a [[X]] there is a tappable term); `buttons` render as plain text, so
 * a [[X]] in them does not count — a term mentioned only there has no explanation in reach.
 */
export function unwrappedTerms(renderable: string[], buttons: string[]): string[] {
  const { wrapped } = scan(renderable)
  const { plain } = scan([...renderable, ...buttons])
  return [...findAbbreviations(plain)].filter((a) => !ALLOWED.has(a) && !wrapped.has(a) && glossaryIds.includes(a))
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
      [...texts, ...(m.objectives ?? [])],
      m.lesson.some((b) => b.kind === 'figure'),
      issues,
    )
    for (const message of figureShapeIssues(m.lesson)) issues.push({ where: `module ${m.id}`, message })
  }

  for (const p of problems) {
    const texts = [
      p.title,
      p.brief,
      ...p.modelAnswer.flatMap(blockTexts),
      ...p.rubric.map((r) => r.criterion),
      ...(p.followups ?? []).flatMap((f) => [f.q, f.a]),
    ]
    checkUnit(
      `problem ${p.id}`,
      texts,
      p.modelAnswer.some((b) => b.kind === 'figure'),
      issues,
    )
    for (const message of figureShapeIssues(p.modelAnswer)) issues.push({ where: `problem ${p.id}`, message })
  }

  return issues
}

/* ------------------------------------------------------------------ */
/* Question bank                                                       */
/* ------------------------------------------------------------------ */

const RESERVED_PREFIX = /^(quiz|gloss|pat):/

/**
 * Hand-written bank questions. Structure per kind, a real lesson and heading to link to,
 * no markup inside anything rendered as a button (options and match items), and each
 * question is its own unit for the abbreviation rule — it is read alone, on a train,
 * without the lesson around it.
 */
export function validateQuestions(questions: Question[], modules: Module[]): string[] {
  const out: string[] = []
  const byModule = new Map(modules.map((m) => [m.id, m]))
  const seen = new Set<string>()

  for (const q of questions) {
    const at = `question ${q.id}`
    if (seen.has(q.id)) out.push(`${at}: duplicate id`)
    seen.add(q.id)
    if (RESERVED_PREFIX.test(q.id)) out.push(`${at}: ids starting quiz:, gloss: or pat: are reserved for derived questions`)
    if (!q.prompt.trim()) out.push(`${at}: empty prompt`)
    if (!q.explain.trim()) out.push(`${at}: empty explain`)

    const m = q.moduleId ? byModule.get(q.moduleId) : undefined
    if (!q.moduleId) out.push(`${at}: no moduleId`)
    else if (!m) out.push(`${at}: unknown module ${q.moduleId}`)
    if (m && q.section) {
      const want = plainText(q.section).trim()
      const found = [...headingSlugs(m.lesson).keys()].some((i) => {
        const b = m.lesson[i]
        return b.kind === 'heading' && plainText(b.text).trim() === want
      })
      if (!found) out.push(`${at}: section "${q.section}" is not a heading in ${m.id}`)
    }

    const buttons: string[] = []
    switch (q.kind) {
      case 'single':
        if (q.options.length !== 4) out.push(`${at}: single needs exactly 4 options`)
        if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.length) out.push(`${at}: correct out of range`)
        buttons.push(...q.options)
        break
      case 'multi': {
        if (q.options.length < 4 || q.options.length > 6) out.push(`${at}: multi needs 4–6 options`)
        const set = new Set(q.correct)
        if (set.size !== q.correct.length) out.push(`${at}: duplicate correct index`)
        if (q.correct.some((i) => !Number.isInteger(i) || i < 0 || i >= q.options.length)) out.push(`${at}: correct out of range`)
        if (set.size < 2) out.push(`${at}: multi needs at least two correct options (use single otherwise)`)
        if (set.size >= q.options.length) out.push(`${at}: multi cannot have every option correct`)
        buttons.push(...q.options)
        break
      }
      case 'truefalse':
        if (q.prompt.trim().endsWith('?')) out.push(`${at}: true/false prompt must be a statement, not a question`)
        break
      case 'match': {
        if (q.pairs.length < 3 || q.pairs.length > 5) out.push(`${at}: match needs 3–5 pairs`)
        const lefts = q.pairs.map((x) => plainText(x.left).trim())
        const rights = q.pairs.map((x) => plainText(x.right).trim())
        if (new Set(lefts).size !== lefts.length) out.push(`${at}: duplicate left item`)
        if (new Set(rights).size !== rights.length) out.push(`${at}: duplicate right item`)
        if ([...lefts, ...rights].some((t) => !t)) out.push(`${at}: empty match item`)
        buttons.push(...q.pairs.flatMap((x) => [x.left, x.right]))
        break
      }
    }
    if (buttons.some((t) => t.includes('[['))) out.push(`${at}: no [[…]] in options or match items — they render as buttons; wrap the term in the prompt or explain`)

    const issues: ContentIssue[] = []
    checkUnit(at, [q.prompt, q.explain, ...buttons], true, issues)
    for (const i of issues) out.push(`${i.where}: ${i.message}`)
  }
  return out
}

