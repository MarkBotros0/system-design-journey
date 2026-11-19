import { useMemo, type CSSProperties } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { BookA, CircleUser, House, Layers, Puzzle, Route as RouteIcon, Timer } from 'lucide-react'
import type { ComponentType } from 'react'
import { modules } from '../../content'
import { hasReadLesson } from '../../lib/progress'
import { resumeTarget } from '../../lib/resume'
import { isDue } from '../../lib/srs'
import { useProgress } from '../../state/ProgressProvider'
import { SearchPill } from '../ui/SearchPill'
import { ResumeDock } from './ResumeDock'

type Icon = ComponentType<{ size?: number | string; strokeWidth?: number; className?: string; 'aria-hidden'?: boolean }>

interface Tab {
  to: string
  label: string
  icon: Icon
  /** Which paths light this tab up — a lesson belongs to Learn, a walkthrough to Practice. */
  match: (path: string) => boolean
}

/* Five destinations — the bottom-bar ceiling. Search is not a tab: it is reachable from
   every screen (top bar, the pills on Home and Learn, and "/" or ⌘K), which is more
   reachable than a tab would make it. */
const TABS: Tab[] = [
  { to: '/', label: 'Home', icon: House, match: (p) => p === '/' },
  {
    to: '/learn',
    label: 'Learn',
    icon: RouteIcon,
    match: (p) => p.startsWith('/learn') || p.startsWith('/m/') || p.startsWith('/glossary') || p.startsWith('/patterns'),
  },
  { to: '/practice', label: 'Practice', icon: Timer, match: (p) => p.startsWith('/practice') },
  { to: '/review', label: 'Review', icon: Layers, match: (p) => p.startsWith('/review') || p.startsWith('/questions') },
  { to: '/you', label: 'You', icon: CircleUser, match: (p) => p.startsWith('/you') },
]

function useDueCount(): number {
  const { progress } = useProgress()
  return useMemo(
    () =>
      modules
        .filter((m) => hasReadLesson(progress, m.id))
        .flatMap((m) => m.cards)
        .filter((c) => isDue(progress.cards[c.id])).length,
    [progress],
  )
}

const TAB_ROOTS = new Set(['/', '/learn', '/practice', '/review', '/you'])

/** Lessons and walkthroughs read edge to edge: their own docks replace the tab bar. */
const isImmersive = (path: string) => /^\/m\/[^/]+$/.test(path) || /^\/practice\/[^/]+\/walkthrough$/.test(path)

export function Shell() {
  const { pathname } = useLocation()
  const { progress } = useProgress()
  const due = useDueCount()
  const wide = pathname.startsWith('/m/') || pathname.startsWith('/learn')
  const immersive = isImmersive(pathname)
  const resume = useMemo(() => (TAB_ROOTS.has(pathname) ? resumeTarget(progress) : null), [pathname, progress])

  return (
    <div className="min-h-dvh lg:flex">
      {/* ≥1024px: the tab bar becomes a rail. Same destinations, same order. */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:gap-1 lg:overflow-y-auto lg:bg-surface-2/50 lg:p-4">
        <Link to="/" className="mb-4 flex items-center gap-2.5 rounded-xl px-3 pt-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-line text-line-ink">
            <RouteIcon size={17} strokeWidth={2.4} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-[1rem] leading-tight font-extrabold">Throughput</span>
            <span className="block text-[0.8125rem] text-ink-3">Senior interview prep</span>
          </span>
        </Link>
        <div className="mb-3">
          <SearchPill compact />
        </div>
        <nav aria-label="Primary" className="flex flex-col gap-1">
          {TABS.map((t) => {
            const active = t.match(pathname)
            return (
              <Link
                key={t.to}
                to={t.to}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-[0.9375rem] font-semibold transition-colors duration-150 ${
                  active ? 'bg-surface text-ink shadow-[var(--shadow-card)]' : 'text-ink-2 hover:bg-surface hover:text-ink'
                }`}
              >
                <t.icon size={19} strokeWidth={active ? 2.3 : 1.9} aria-hidden />
                <span className="flex-1">{t.label}</span>
                {t.to === '/review' && due > 0 && (
                  <span className="min-w-6 rounded-full bg-line px-1.5 py-0.5 text-center text-[0.75rem] font-bold text-line-ink tabular">
                    {due}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <p className="mt-6 mb-1 px-3 text-[0.8125rem] font-bold text-ink-3">Reference</p>
        <Link
          to="/glossary"
          className="flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-[0.9375rem] text-ink-2 transition-colors duration-150 hover:bg-surface hover:text-ink"
        >
          <BookA size={17} strokeWidth={1.9} aria-hidden="true" />
          Glossary
        </Link>
        <Link
          to="/patterns"
          className="flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-[0.9375rem] text-ink-2 transition-colors duration-150 hover:bg-surface hover:text-ink"
        >
          <Puzzle size={17} strokeWidth={1.9} aria-hidden="true" />
          Patterns cheat sheet
        </Link>
      </aside>

      <div className="min-w-0 flex-1">
        <main
          id="main"
          key={pathname}
          style={{ '--dock-h': resume ? '4.5rem' : '0px' } as CSSProperties}
          className={`animate-page-in mx-auto w-full px-4 lg:px-8 lg:pb-12 ${
            immersive ? 'pb-[calc(env(safe-area-inset-bottom)+7rem)]' : 'pb-tabbar'
          } ${wide ? 'max-w-2xl lg:max-w-3xl xl:max-w-5xl' : 'max-w-2xl lg:max-w-3xl'}`}
        >
          <Outlet />
        </main>
      </div>

      {resume && <ResumeDock target={resume} />}

      {!immersive && (
        <nav
          className="bar-glass fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-40 mx-auto max-w-lg rounded-[26px] p-1.5 shadow-[var(--shadow-float)] lg:hidden"
          aria-label="Primary"
        >
          <ul className="flex">
            {TABS.map((t) => {
              const active = t.match(pathname)
              return (
                <li key={t.to} className="flex-1">
                  <Link
                    to={t.to}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-[20px] transition-colors duration-150 ${
                      active ? 'bg-surface-3 text-ink' : 'text-ink-3 active:bg-surface-3/60'
                    }`}
                  >
                    <span className="relative">
                      <t.icon size={22} strokeWidth={active ? 2.3 : 1.9} aria-hidden />
                      {t.to === '/review' && due > 0 && (
                        <span
                          aria-hidden="true"
                          className="absolute -top-1.5 -right-2.5 min-w-[1.125rem] rounded-full bg-line px-1 text-center text-[0.625rem] leading-[1.125rem] font-bold text-line-ink tabular"
                        >
                          {due > 99 ? '99+' : due}
                        </span>
                      )}
                    </span>
                    <span className="text-[0.6875rem] font-semibold">
                      {t.label}
                      {t.to === '/review' && due > 0 && <span className="sr-only">, {due} cards due</span>}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </div>
  )
}
