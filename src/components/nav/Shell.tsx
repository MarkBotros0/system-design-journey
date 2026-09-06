import { NavLink, Outlet } from 'react-router-dom'
import { Layers, Route as RouteIcon, Timer, TrendingUp } from 'lucide-react'
import type { ComponentType } from 'react'

interface Tab {
  to: string
  label: string
  icon: ComponentType<{ size?: number | string; strokeWidth?: number; className?: string }>
  end?: boolean
}

/* Four destinations. The bottom-bar ceiling is five, and a fifth here would be a
   settings screen that belongs inside "You" anyway. */
const TABS: Tab[] = [
  { to: '/', label: 'Map', icon: RouteIcon, end: true },
  { to: '/practice', label: 'Practice', icon: Timer },
  { to: '/drill', label: 'Drill', icon: Layers },
  { to: '/you', label: 'You', icon: TrendingUp },
]

export function Shell() {
  return (
    <div className="min-h-dvh lg:flex">
      {/* ≥1024px: the tab bar becomes a rail. Same destinations, same order. */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:gap-1 lg:border-r lg:border-hairline lg:p-4">
        <div className="mb-6 px-3 pt-2">
          <span className="font-mono text-[0.6875rem] tracking-[0.2em] uppercase text-line">
            Throughput
          </span>
          <p className="mt-1 text-[0.8125rem] text-ink-3">System design, station by station</p>
        </div>
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] transition-colors duration-150 ${
                isActive ? 'bg-line-soft text-line font-medium' : 'text-ink-2 hover:bg-surface-2'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <t.icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
                {t.label}
              </>
            )}
          </NavLink>
        ))}
      </aside>

      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-2xl px-4 pt-5 pb-tabbar lg:max-w-3xl lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface/95 pb-safe backdrop-blur-md lg:hidden"
        aria-label="Primary"
      >
        <ul className="mx-auto flex max-w-lg">
          {TABS.map((t) => (
            <li key={t.to} className="flex-1">
              <NavLink
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `flex min-h-16 flex-col items-center justify-center gap-1 transition-colors duration-150 ${
                    isActive ? 'text-line' : 'text-ink-3'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <t.icon size={21} strokeWidth={isActive ? 2.3 : 1.8} />
                    <span
                      className={`text-[0.6875rem] ${isActive ? 'font-semibold' : 'font-normal'}`}
                    >
                      {t.label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
