import { useMemo } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { BookA, CircleUser, House, Layers, Puzzle, Route as RouteIcon, Timer } from 'lucide-react'
import type { ComponentType } from 'react'
import { modules } from '../../content'
import { hasReadLesson } from '../../lib/progress'
import { isDue } from '../../lib/srs'
import { useProgress } from '../../state/ProgressProvider'
import { SearchPill } from '../ui/SearchPill'

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

export function Shell() {
  const { pathname } = useLocation()
  const due = useDueCount()
  const wide = pathname.startsWith('/m/') || pathname.startsWith('/learn')

  return (
    <div className="min-h-dvh lg:flex">
      {/* ≥1024px: the tab bar becomes a rail. Same destinations, same order. */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:gap-1 lg:overflow-y-auto lg:border-r lg:border-hairline lg:p-4">
        <Link to="/" className="mb-4 block rounded-lg px-3 pt-2">
          <span className="font-mono text-[0.6875rem] tracking-[0.2em] uppercase text-line">Throughput</span>
          <span className="mt-1 block text-[0.8125rem] text-ink-3">Senior interview prep</span>
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
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] transition-colors duration-150 ${
                  active ? 'bg-line-soft font-medium text-line' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <t.icon size={19} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                <span className="flex-1">{t.label}</span>
                {t.to === '/review' && due > 0 && (
                  <span className="rounded-full bg-line-soft px-2 py-0.5 font-mono text-[0.6875rem] text-line tabular">
                    {due}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <p className="mt-6 mb-1 px-3 font-mono text-[0.625rem] tracking-[0.14em] uppercase text-ink-3">Reference</p>
        <Link
          to="/glossary"
          className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.875rem] text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
        >
          <BookA size={17} strokeWidth={1.8} aria-hidden="true" />
          Glossary
        </Link>
        <Link
          to="/patterns"
          className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.875rem] text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
        >
          <Puzzle size={17} strokeWidth={1.8} aria-hidden="true" />
          Patterns cheat sheet
        </Link>
      </aside>

      <div className="min-w-0 flex-1">
        <main
          id="main"
          key={pathname}
          className={`animate-page-in mx-auto w-full px-4 pb-tabbar lg:px-8 lg:pb-12 ${
            wide ? 'max-w-2xl lg:max-w-3xl xl:max-w-5xl' : 'max-w-2xl lg:max-w-3xl'
          }`}
        >
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface/95 pb-safe backdrop-blur-md lg:hidden"
        aria-label="Primary"
      >
        <ul className="mx-auto flex max-w-lg">
          {TABS.map((t) => {
            const active = t.match(pathname)
            return (
              <li key={t.to} className="flex-1">
                <Link
                  to={t.to}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex min-h-16 flex-col items-center justify-center gap-1 transition-colors duration-150 active:bg-surface-2 ${
                    active ? 'text-line' : 'text-ink-3'
                  }`}
                >
                  <span className="relative">
                    <t.icon size={21} strokeWidth={active ? 2.3 : 1.8} aria-hidden />
                    {t.to === '/review' && due > 0 && (
                      <span
                        aria-hidden="true"
                        className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-line ring-2 ring-surface"
                      />
                    )}
                  </span>
                  <span className={`text-[0.6875rem] ${active ? 'font-semibold' : 'font-normal'}`}>
                    {t.label}
                    {t.to === '/review' && due > 0 && <span className="sr-only">, {due} cards due</span>}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
