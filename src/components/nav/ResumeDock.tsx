import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Timer } from 'lucide-react'
import type { ResumeTarget } from '../../lib/resume'
import { TrackGlyph } from '../ui/TrackIcon'
import { trackStyle } from '../ui/trackStyle'

/** True while the page is being scrolled down, past the first screenful. */
function useScrollingDown(): boolean {
  const [down, setDown] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - last) < 8) return
      setDown(y > last && y > 120)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return down
}

/**
 * The thing in progress, one thumb-tap away on every tab: a lesson left part-way or a
 * timed attempt still open. Sits just above the tab bar; while you scroll down it shrinks
 * to a small Resume pill so it never covers what you are reading.
 */
export function ResumeDock({ target }: { target: ResumeTarget }) {
  const collapsed = useScrollingDown()
  const draft = target.kind === 'draft'
  const sub = draft ? 'Timed attempt in progress' : target.section ? `Resume at ${target.section}` : `${target.minutes} min lesson`

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-40 flex justify-end lg:inset-x-auto lg:right-8 lg:bottom-8 lg:w-96">
      <Link
        to={target.href}
        style={draft ? undefined : trackStyle(target.trackId)}
        aria-label={`Resume: ${target.title}. ${sub}`}
        className={`bar-glass pointer-events-auto flex items-center gap-3 rounded-[22px] shadow-[var(--shadow-float)] transition-[width,padding] duration-200 ${
          collapsed ? 'min-h-12 w-auto py-1.5 pr-1.5 pl-4' : 'min-h-16 w-full py-2 pr-2 pl-2.5'
        }`}
      >
        {collapsed ? (
          <span className="text-[0.9375rem] font-bold">Resume</span>
        ) : (
          <>
            {draft ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-streak-soft text-streak">
                <Timer size={18} strokeWidth={2.2} aria-hidden="true" />
              </span>
            ) : (
              <TrackGlyph trackId={target.trackId} size={36} />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.9375rem] leading-tight font-bold">{target.title}</span>
              <span className="mt-0.5 block truncate text-[0.8125rem] text-ink-2">{sub}</span>
            </span>
          </>
        )}
        <span
          aria-hidden="true"
          className={`flex shrink-0 items-center justify-center rounded-full text-paper ${draft ? 'bg-streak' : 'bg-track'} ${
            collapsed ? 'h-9 w-9' : 'h-11 w-11'
          }`}
        >
          <Play size={collapsed ? 15 : 18} strokeWidth={2.4} className="translate-x-px fill-current" />
        </span>
      </Link>
    </div>
  )
}
