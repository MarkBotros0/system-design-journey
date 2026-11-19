import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

/**
 * The sticky bar at the top of every screen in the shell, native-style: it sits flush with
 * the page while the large title is in view, then turns to frosted glass with the compact
 * title centred once the large title has scrolled under it.
 *
 * Bleeds to the screen edge through the main column's gutter, carries the safe-area inset
 * itself, and holds an optional back control, the compact title and actions on the right.
 * An optional progress line along its bottom edge is a lesson's reading progress, in the
 * track's colour.
 */
export function TopBar({
  title,
  showTitle = true,
  back,
  right,
  progress,
}: {
  title?: string
  showTitle?: boolean
  /** `history` goes back if there is somewhere to go back to, else to `fallback`. */
  back?: { label: string; to: string; mode?: 'history' | 'link' }
  right?: ReactNode
  /** 0–1. */
  progress?: number
}) {
  const navigate = useNavigate()

  function goBack() {
    if (!back) return
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (back.mode !== 'link' && idx > 0) navigate(-1)
    else navigate(back.to)
  }

  const compact = !!title && showTitle

  return (
    <header
      className={`sticky top-0 z-30 -mx-4 px-4 pt-safe transition-[background-color,box-shadow] duration-200 lg:-mx-8 lg:px-8 ${
        compact ? 'bar-glass shadow-[0_1px_0_var(--hairline)]' : 'bg-paper'
      }`}
    >
      {/* The centre column exists only once the compact title shows; until then the back
          label gets the room, so "Learn" never truncates to "Lea…" at 375px. */}
      <div
        className={`grid min-h-14 items-center gap-1 ${
          compact ? 'grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)_0px_auto]'
        }`}
      >
        <div className="flex min-w-0 items-center">
          {back && (
            <button
              type="button"
              onClick={goBack}
              className="-ml-2 inline-flex min-h-11 min-w-11 max-w-full items-center gap-0.5 rounded-full pr-3 pl-1.5 text-[0.9375rem] font-semibold text-ink transition-colors duration-150 hover:bg-surface-2"
            >
              <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" className="shrink-0" />
              <span className={compact ? 'sr-only' : 'truncate'}>{back.label}</span>
            </button>
          )}
        </div>
        <p
          aria-hidden={!compact}
          className={`truncate text-center text-[1.0625rem] font-bold transition-opacity duration-200 ${compact ? 'opacity-100' : 'opacity-0'}`}
        >
          {title}
        </p>
        <div className="-mr-1 flex min-w-0 items-center justify-end gap-1.5">{right}</div>
      </div>
      {progress !== undefined && (
        <div aria-hidden="true" className="absolute inset-x-0 -bottom-px h-[3px]">
          <div
            className="h-full rounded-r-full bg-track transition-[width] duration-150"
            style={{ width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%` }}
          />
        </div>
      )}
    </header>
  )
}

/** The large page title under the top bar: optional line above (a date, a track), the title, a sub line. */
export function PageTitle({
  title,
  sub,
  eyebrow,
  right,
  titleRef,
}: {
  title: string
  sub?: ReactNode
  eyebrow?: ReactNode
  right?: ReactNode
  titleRef?: React.Ref<HTMLHeadingElement>
}) {
  return (
    <div className="mt-2 mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-[0.9375rem] font-semibold text-ink-2">{eyebrow}</div>}
        <h1 ref={titleRef} tabIndex={-1} className="text-[2rem] leading-[1.1] font-extrabold tracking-[-0.025em] outline-none">
          {title}
        </h1>
        {sub && <p className="mt-2 text-base text-ink-2">{sub}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  )
}
