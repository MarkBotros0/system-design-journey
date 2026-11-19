import type { ReactNode } from 'react'
import { Inline } from './Inline'

/*
 * The frame every figure primitive sits in. Tone classes live in figureTones.ts.
 *
 * On its own it is a soft card: a filled surface with the card shadow, no outline. Two
 * containers change that without any props being threaded through the primitives:
 *
 *  - `.fig-card` — a lesson figure, whose own card also holds the caption. The frame
 *    goes transparent and keeps only its padding.
 *  - `.fig-inset` — the glossary sheet, which is already a surface. The frame steps down
 *    to `surface-2` and drops the shadow.
 */
export function Frame({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div className="rounded-[22px] bg-surface p-4 shadow-[var(--shadow-card)] in-[.fig-card]:bg-transparent in-[.fig-card]:shadow-none in-[.fig-inset]:bg-surface-2 in-[.fig-inset]:shadow-none">
      {children}
      {note && (
        <p className="mt-3 text-[0.8125rem] leading-snug text-ink-2">
          <Inline text={note} />
        </p>
      )}
    </div>
  )
}
