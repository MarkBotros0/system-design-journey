import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

/**
 * An inset grouped list: rows on one rounded surface, separated by inset hairlines, the way
 * a native settings list reads. The optional title sits above the group, the footer below
 * it in small grey type.
 */
export function Group({
  title,
  action,
  footer,
  children,
  className = '',
  id,
}: {
  /** For an in-page anchor ("See decks" → #decks). */
  id?: string
  title?: ReactNode
  /** Right of the title — a "See all" or "Change". */
  action?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={className}>
      {(title || action) && (
        <div className="mb-2 flex min-h-11 items-end justify-between gap-3 px-1">
          {title && <h2 className="text-[1.25rem] font-bold">{title}</h2>}
          {action}
        </div>
      )}
      <ul
        className="overflow-hidden rounded-[22px] bg-surface [&>li+li]:relative [&>li+li]:before:pointer-events-none [&>li+li]:before:absolute [&>li+li]:before:inset-x-4 [&>li+li]:before:top-0 [&>li+li]:before:h-px [&>li+li]:before:bg-hairline [&>li+li]:before:content-['']"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        {children}
      </ul>
      {footer && <p className="mt-2 px-4 text-[0.875rem] text-ink-3">{footer}</p>}
    </section>
  )
}

const rowCls =
  'flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 active:bg-surface-2 hover:bg-surface-2/60 focus-visible:-outline-offset-2'
// The focus ring is drawn inside the row: the Group clips anything outside its rounded edge.

/**
 * One row of a Group. A link (`to`), a button (`onClick`), or plain. `title` and `sub` must
 * be plain text when the row is a link or button: an abbreviation's button inside it would
 * be invalid and would steal the tap.
 */
export function Cell({
  to,
  onClick,
  leading,
  title,
  sub,
  trailing,
  chevron = !!to,
  current,
}: {
  to?: string
  onClick?: () => void
  leading?: ReactNode
  title: ReactNode
  sub?: ReactNode
  trailing?: ReactNode
  chevron?: boolean
  /** Marks the row for assistive tech when it is where you are now. */
  current?: boolean
}) {
  const body = (
    <>
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-base leading-snug font-semibold [overflow-wrap:anywhere]">{title}</span>
        {sub && <span className="mt-0.5 block text-[0.875rem] leading-snug text-ink-2">{sub}</span>}
      </span>
      {trailing && <span className="flex shrink-0 items-center gap-2 text-[0.9375rem] text-ink-2">{trailing}</span>}
      {chevron && <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" className="shrink-0 text-ink-3" />}
    </>
  )
  return (
    <li>
      {to ? (
        <Link to={to} className={rowCls} aria-current={current ? 'page' : undefined}>
          {body}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={rowCls}>
          {body}
        </button>
      ) : (
        <div className={rowCls.replace(/ active:\S+| hover:\S+/g, '')}>{body}</div>
      )}
    </li>
  )
}
