import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const base =
  'relative inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[0.875rem] whitespace-nowrap transition-colors duration-150 ' +
  // The visual chip is 40px; the hit area extends to 48px so it still clears the 44px floor.
  "before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']"

const tone = (active?: boolean) =>
  active
    ? 'border-line bg-line-soft text-line font-medium'
    : 'border-hairline bg-surface text-ink-2 hover:border-line hover:text-ink active:bg-surface-2'

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
 * A row of chips that scrolls sideways inside itself, never the page. `py-1` is room for
 * each chip's hit area (4px past it); without it the row overflows vertically, and a
 * sideways-scrolling row then scrolls up and down too — on iOS the chips can be dragged.
 * `overflow-y-hidden` keeps that true for anything else put in the row.
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
