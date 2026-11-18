import MiniSearch from 'minisearch'
import type { Block } from '../content/types'
import { modules, problems, getTrack } from '../content'
import { glossary } from '../content/glossary'
import { patterns } from '../content/patterns'
import { getCategory } from '../content/categories'
import { plainText } from './text'
import { headingSlugs } from './slug'

/**
 * Offline full-text search over the whole curriculum.
 *
 * Sections are first-class documents: a heading plus the text under it, linked to its
 * anchor. That is what makes "isolation levels" land on the right paragraph rather
 * than on the top of a twelve-minute lesson.
 *
 * The index is built on the first query, not at boot — most sessions never search, and
 * the curriculum is large enough that indexing it is not free on a phone.
 */

export type HitType = 'lesson' | 'section' | 'term' | 'problem' | 'pattern'

export interface Hit {
  id: string
  type: HitType
  title: string
  /** One line of context — a summary, a gist, or the start of the section. */
  context: string
  /** For sections: the lesson they belong to. */
  parent?: string
  href: string
  /** Matched words, lowercased, for highlighting. */
  terms: string[]
}

export interface SearchResult {
  groups: { type: HitType; hits: Hit[] }[]
  total: number
  /** Only when nothing matched: nearby spellings to offer. */
  suggestions: string[]
}

export const POPULAR_TOPICS = [
  'SOLID',
  'ACID',
  'Isolation levels',
  'CAP',
  'Caching',
  'Sharding',
  'Observer',
  'Rate limiting',
]

const GROUP_ORDER: HitType[] = ['lesson', 'section', 'term', 'problem', 'pattern']

interface Doc {
  key: string
  id: string
  type: HitType
  title: string
  keywords: string
  parent: string
  text: string
  context: string
  href: string
}

const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'in', 'and', 'or', 'is', 'for', 'on', 'with', 'it', 'at', 'by', 'as', 'be'])

function processTerm(term: string): string | null {
  const t = term.toLowerCase()
  return STOP.has(t) ? null : t
}

function clip(text: string, n = 110): string {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t
}

/** Readable text of one block, for indexing. Code is left out — identifiers are noise. */
function blockPlain(b: Block): string {
  switch (b.kind) {
    case 'prose':
    case 'heading':
      return b.text
    case 'list':
      return b.items.join(' ')
    case 'callout':
      return `${b.title ?? ''} ${b.text}`
    case 'table':
      return [...b.head, ...b.rows.flat()].join(' ')
    case 'flow':
      return b.nodes.join(' ')
    case 'compare':
      return [b.left.title, ...b.left.points, b.right.title, ...b.right.points, b.verdict ?? ''].join(' ')
    case 'ladder':
      return b.rungs.map((r) => `${r.title} ${r.text}`).join(' ')
    case 'codeCompare':
      return `${b.before.title} ${b.after.title} ${b.note ?? ''}`
    case 'followups':
      return b.items.map((f) => `${f.q} ${f.a}`).join(' ')
    case 'figure':
      return b.caption
    case 'code':
      return b.caption ?? ''
  }
}

function buildDocs(): Doc[] {
  const docs: Doc[] = []

  for (const m of modules) {
    const track = getTrack(m.trackId)
    docs.push({
      key: `lesson:${m.id}`,
      id: m.id,
      type: 'lesson',
      title: plainText(m.title),
      keywords: [...(m.keywords ?? []), track?.title ?? ''].join(' '),
      parent: '',
      text: plainText([m.summary, ...(m.objectives ?? [])].join(' ')),
      context: clip(plainText(m.summary)),
      href: `/m/${m.id}`,
    })

    const slugs = headingSlugs(m.lesson)
    let current: { slug: string; title: string; parts: string[] } | null = null
    const flush = () => {
      if (!current) return
      const text = plainText(current.parts.join(' ')).slice(0, 600)
      docs.push({
        key: `section:${m.id}#${current.slug}`,
        id: `${m.id}#${current.slug}`,
        type: 'section',
        title: current.title,
        keywords: '',
        parent: plainText(m.title),
        text,
        context: clip(text),
        href: `/m/${m.id}#${current.slug}`,
      })
    }
    m.lesson.forEach((b, i) => {
      if (b.kind === 'heading') {
        flush()
        current = { slug: slugs.get(i)!, title: plainText(b.text), parts: [] }
      } else if (current) {
        current.parts.push(blockPlain(b))
      }
    })
    flush()
  }

  for (const g of glossary) {
    docs.push({
      key: `term:${g.id}`,
      id: g.id,
      type: 'term',
      title: g.id,
      keywords: g.full,
      parent: '',
      text: plainText(g.gist),
      context: g.full,
      href: `/glossary#${encodeURIComponent(g.id)}`,
    })
  }

  for (const p of problems) {
    const patternNames = p.patterns.map((id) => patterns.find((x) => x.id === id)?.name ?? '')
    docs.push({
      key: `problem:${p.id}`,
      id: p.id,
      type: 'problem',
      title: plainText(p.title),
      keywords: [getCategory(p.category)?.title ?? '', p.kind === 'lld' ? 'low-level design' : 'system design', ...patternNames].join(' '),
      parent: '',
      text: plainText(p.brief),
      context: clip(plainText(p.brief)),
      href: `/practice/${p.id}`,
    })
  }

  for (const p of patterns) {
    docs.push({
      key: `pattern:${p.id}`,
      id: p.id,
      type: 'pattern',
      title: p.name,
      keywords: p.family === 'object' ? 'design pattern' : 'system pattern',
      parent: '',
      text: plainText(`${p.tell} ${p.move} ${p.showsUpIn.join(' ')}`),
      context: clip(plainText(p.tell)),
      href: `/patterns#${p.id}`,
    })
  }

  return docs
}

let index: MiniSearch<Doc> | null = null

function getIndex(): MiniSearch<Doc> {
  if (index) return index
  index = new MiniSearch<Doc>({
    idField: 'key',
    fields: ['title', 'keywords', 'parent', 'text'],
    storeFields: ['id', 'type', 'title', 'parent', 'context', 'href', 'text'],
    processTerm,
    searchOptions: {
      boost: { title: 4, keywords: 3, parent: 1.5, text: 1 },
      prefix: true,
      fuzzy: (term: string) => (term.length > 4 ? 0.2 : false),
      processTerm,
    },
  })
  index.addAll(buildDocs())
  return index
}

/**
 * The context line, re-centred on the first matched word when the match is not already
 * near the start — a section result should show *why* it matched.
 */
function snippet(fallback: string, text: string, terms: string[]): string {
  const flat = text.replace(/\s+/g, ' ')
  let at = -1
  for (const t of terms) {
    const m = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').exec(flat)
    if (m && (at === -1 || m.index < at)) at = m.index
  }
  if (at < 60) return fallback
  const start = flat.lastIndexOf(' ', at - 30) + 1
  return `…${clip(flat.slice(start), 108)}`
}

const EMPTY: SearchResult = { groups: [], total: 0, suggestions: [] }

export function search(query: string, limitPerGroup = 5): SearchResult {
  // Fewer than two letters or digits cannot mean anything; don't spend the index on it.
  if (query.replace(/[^\p{L}\p{N}]/gu, '').length < 2) return EMPTY

  const idx = getIndex()
  // Exact (prefix) matches first; typo tolerance only when they find nothing, so a
  // correctly spelled query is never diluted by near-misses ("isolation" ≠ "solution").
  let results = idx.search(query, { combineWith: 'AND', fuzzy: false })
  if (!results.length) results = idx.search(query, { combineWith: 'AND' })
  if (!results.length) results = idx.search(query, { combineWith: 'OR' })

  if (!results.length) {
    const suggestions = idx
      .autoSuggest(query, { fuzzy: 0.3, prefix: true, combineWith: 'OR' })
      .slice(0, 3)
      .map((s) => s.suggestion)
    return { ...EMPTY, suggestions }
  }

  const byType = new Map<HitType, Hit[]>()
  for (const r of results) {
    const type = r.type as HitType
    const list = byType.get(type) ?? []
    list.push({
      id: r.id as string,
      type,
      title: r.title as string,
      context: type === 'section' || type === 'lesson' ? snippet(r.context as string, r.text as string, r.terms) : (r.context as string),
      parent: (r.parent as string) || undefined,
      href: r.href as string,
      terms: r.terms,
    })
    byType.set(type, list)
  }

  const groups = GROUP_ORDER.filter((t) => byType.has(t)).map((type) => ({
    type,
    hits: byType.get(type)!.slice(0, limitPerGroup),
  }))
  return { groups, total: results.length, suggestions: [] }
}

/** Every hit of one type, for "Show all". */
export function searchAll(query: string, type: HitType): Hit[] {
  return search(query, Infinity).groups.find((g) => g.type === type)?.hits ?? []
}
