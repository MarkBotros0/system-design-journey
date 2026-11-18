import type { Block } from '../content/types'
import { plainText } from './text'

/**
 * Heading anchors. One function, used by the lesson renderer (the `id`), the table of
 * contents, the reading-place memory and the search index — if any of them computed
 * slugs differently, a deep link from search would land on nothing.
 */
export function slugify(text: string): string {
  const s = plainText(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'section'
}

/** Block index → slug, for every heading, de-duplicated within the lesson. */
export function headingSlugs(blocks: Block[]): Map<number, string> {
  const out = new Map<number, string>()
  const seen = new Map<string, number>()
  blocks.forEach((b, i) => {
    if (b.kind !== 'heading') return
    const base = slugify(b.text)
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    out.set(i, n === 1 ? base : `${base}-${n}`)
  })
  return out
}
