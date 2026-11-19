import type { ReactNode } from 'react'

/**
 * A neutral glyph tile for a row that has no track — a checkpoint problem, the question
 * bank. Same geometry as the 36px TrackGlyph so a mixed list keeps one leading edge.
 */
export function IconTile({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-surface-3 text-ink">
      {children}
    </span>
  )
}
