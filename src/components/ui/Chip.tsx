import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

// A full 44px pill: no stretched hit area, so a row of chips never overflows vertically.
const base =
  'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-[0.9375rem] font-medium whitespace-nowrap ' +
  'transition-[background-color,color,transform] duration-150 active:scale-[0.97] motion-reduce:active:scale-100'

const tone = (active?: boolean) =>
  active
    ? 'bg-line text-line-ink'
    : 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink'

/** A filter, a jump target, or a quick link. `active` is the selected state. */
export function Chip({
  active,
  onClick,
  to,
  children,
  pressed,
}: {
  active?: boolean
  onClick?: () => void
  to?: string
  children: ReactNode
  /** Set for toggle chips so assistive tech announces the state. */
  pressed?: boolean
}) {
  if (to) {
    return (
      <Link to={to} className={`${base} ${tone(active)}`}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-pressed={pressed} className={`${base} ${tone(active)}`}>
      {children}
    </button>
  )
}

/**
 * A row of chips that scrolls sideways inside itself, never the page. `overflow-y-hidden`
 * matters: a sideways-scrolling row that overflows vertically by a pixel also scrolls up
 * and down, and on iOS its chips can then be dragged inside it.
 */
export function ChipRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-4 flex gap-2 overflow-x-auto overflow-y-hidden px-4 py-1 [scrollbar-width:none] lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </div>
  )
}
