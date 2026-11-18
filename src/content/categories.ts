import type { ProblemCategoryId, ProblemKind } from './types'

/**
 * Where a problem sits in the Practice catalog. System design problems are grouped by the
 * kind of product, because that is how candidates remember them ("the booking ones");
 * low-level design problems have their own two shelves.
 */
export interface ProblemCategory {
  id: ProblemCategoryId
  title: string
  kind: ProblemKind
}

export const categories: ProblemCategory[] = [
  { id: 'social', title: 'Social & feeds', kind: 'hld' },
  { id: 'realtime', title: 'Messaging & real-time', kind: 'hld' },
  { id: 'media', title: 'Media & files', kind: 'hld' },
  { id: 'location', title: 'Location', kind: 'hld' },
  { id: 'commerce', title: 'Commerce & booking', kind: 'hld' },
  { id: 'infra', title: 'Infrastructure', kind: 'hld' },
  { id: 'data', title: 'Data & analytics', kind: 'hld' },
  { id: 'lld-systems', title: 'Real-world systems', kind: 'lld' },
  { id: 'lld-components', title: 'Reusable components', kind: 'lld' },
]

const byId = new Map(categories.map((c) => [c.id, c]))
export function getCategory(id: ProblemCategoryId): ProblemCategory | undefined {
  return byId.get(id)
}
