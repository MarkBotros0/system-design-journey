import type { GlossaryEntry } from '../glossary'
import type { Pattern, Question } from '../types'
import { plainText } from '../../lib/text'

/**
 * Sizes for splitting n items into groups of three or four, never a pair or a single.
 * Returns the group sizes; items beyond their sum (at most one) sit out.
 */
export function groupSizes(n: number): number[] {
  if (n < 3) return []
  const r = n % 4
  const fours = (k: number) => Array(k).fill(4) as number[]
  if (r === 0) return fours(n / 4)
  if (r === 3) return [...fours((n - 3) / 4), 3]
  if (r === 2) return n >= 6 ? [...fours((n - 6) / 4), 3, 3] : []
  return n >= 9 ? [...fours((n - 9) / 4), 3, 3, 3] : fours(1)
}

function chunk<T>(items: T[]): T[][] {
  const out: T[][] = []
  let i = 0
  for (const size of groupSizes(items.length)) {
    out.push(items.slice(i, i + size))
    i += size
  }
  return out
}

const firstSentence = (s: string) => {
  const t = plainText(s).trim()
  const m = /^(.+?[.!?])(\s|$)/.exec(t)
  return m ? m[1] : t
}

/**
 * Matching questions built from the glossary and the patterns. A question's id names its
 * members, so adding a term retires only the groups it lands in — a saved schedule never
 * silently starts meaning a different question. Glossary terms are grouped by first
 * letter for the same reason, which also makes for usefully confusable sets (SLI, SLO…).
 */
export function generatedQuestions(glossary: GlossaryEntry[], patterns: Pattern[]): Question[] {
  const out: Question[] = []

  const byLetter = new Map<string, GlossaryEntry[]>()
  for (const g of [...glossary].sort((a, b) => a.id.localeCompare(b.id))) {
    const k = /[A-Za-z]/.test(g.id[0]) ? g.id[0].toUpperCase() : '#'
    byLetter.set(k, [...(byLetter.get(k) ?? []), g])
  }
  const leftover: GlossaryEntry[] = []
  const groups: GlossaryEntry[][] = []
  for (const items of byLetter.values()) {
    const parts = chunk(items)
    groups.push(...parts)
    leftover.push(...items.slice(parts.reduce((n, p) => n + p.length, 0)))
  }
  groups.push(...chunk(leftover))

  for (const g of groups) {
    out.push({
      id: `gloss:${g.map((x) => x.id).join('+')}`,
      kind: 'match',
      topic: { title: 'Glossary', href: `/glossary#${g[0].id}` },
      prompt: 'Match each abbreviation to what it stands for.',
      explain: g.map((x) => `**${x.id}** — ${firstSentence(x.gist)}`).join(' '),
      pairs: g.map((x) => ({ left: x.id, right: plainText(x.full) })),
    })
  }

  for (const family of ['system', 'object'] as const) {
    const items = patterns.filter((p) => p.family === family).sort((a, b) => a.id.localeCompare(b.id))
    for (const g of chunk(items)) {
      out.push({
        id: `pat:${g.map((x) => x.id).join('+')}`,
        kind: 'match',
        topic: { title: 'Patterns cheat sheet', href: `/patterns#${g[0].id}` },
        prompt: family === 'system' ? 'Match each tell in the prompt to the pattern it calls for.' : 'Match each situation to the design pattern it calls for.',
        explain: g.map((x) => `**${x.name}** — ${firstSentence(x.move)}`).join(' '),
        pairs: g.map((x) => ({ left: plainText(x.tell), right: x.name })),
      })
    }
  }
  return out
}
