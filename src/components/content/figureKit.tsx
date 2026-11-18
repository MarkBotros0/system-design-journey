import type { ReactNode } from 'react'
import { Inline } from './Inline'

/* The frame every figure primitive sits in. Tone classes live in figureTones.ts. */

export function Frame({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-2/50 p-3.5">
      {children}
      {note && (
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-3">
          <Inline text={note} />
        </p>
      )}
    </div>
  )
}


