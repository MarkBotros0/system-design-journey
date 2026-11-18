import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * The slim sticky bar at the top of every screen in the shell.
 *
 * Bleeds to the screen edge through the main column's gutter, carries the safe-area
 * inset itself, and holds: an optional back control, a compact title (shown once the
 * page's large heading has scrolled away), and actions on the right. An optional thin
 * progress line runs along its bottom edge — the lesson's reading progress.
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

  return (
    <header className="sticky top-0 z-30 -mx-4 border-b border-hairline/70 bg-paper/95 px-4 pt-safe backdrop-blur-md lg:-mx-8 lg:px-8">
      <div className="flex min-h-14 items-center gap-1">
        {back && (
          <button
            type="button"
            onClick={goBack}
            className="-ml-2 inline-flex min-h-11 min-w-11 shrink-0 items-center gap-1.5 rounded-xl pr-2 pl-2 text-[0.875rem] text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
            <span className={title && showTitle ? 'sr-only' : ''}>{back.label}</span>
          </button>
        )}
        <p
          aria-hidden={!showTitle}
          className={`min-w-0 flex-1 truncate text-[0.9375rem] font-semibold transition-opacity duration-200 ${
            title && showTitle ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {title}
        </p>
        {right && <div className="-mr-2 flex shrink-0 items-center gap-0.5">{right}</div>}
      </div>
      {progress !== undefined && (
        <div aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5">
          <div
            className="h-full bg-line transition-[width] duration-150"
            style={{ width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%` }}
          />
        </div>
      )}
    </header>
  )
}

/** The large page heading that sits under the top bar. */
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
    <div className="mt-4 mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
        <h1 ref={titleRef} tabIndex={-1} className="text-[1.75rem] leading-tight font-semibold outline-none">
          {title}
        </h1>
        {sub && <p className="mt-1.5 text-[0.9375rem] text-ink-2">{sub}</p>}
      </div>
      {right}
    </div>
  )
}
