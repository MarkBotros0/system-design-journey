import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BookA, ChevronRight, Compass, LocateFixed, Puzzle, Route as RouteIcon, Search } from 'lucide-react'
import { getRoute, modulesOfTrack, populatedTracks } from '../content'
import { useProgress } from '../state/ProgressProvider'
import { isPassed, nextOnRoute, routeProgress } from '../lib/progress'
import { stopKey } from '../lib/storage'
import { TopBar, PageTitle } from '../components/ui/TopBar'
import { Segmented } from '../components/ui/Segmented'
import { Chip } from '../components/ui/Chip'
import { ProgressRing } from '../components/ui/ProgressRing'
import { TrackTile } from '../components/ui/TrackIcon'
import { Skeleton } from '../components/ui/Bits'
import { useScrolledPast } from '../components/ui/useScrolledPast'
import { LineMap } from '../components/line/LineMap'
import { groupStops } from '../components/line/groupStops'
import { OnboardingSheet } from '../components/onboarding/OnboardingSheet'

type View = 'route' | 'topics'

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Scroll so the target clears the sticky bar and chip row (both carry scroll-margin). */
function scrollToId(id: string) {
  requestAnimationFrame(() =>
    document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' }),
  )
}

function RouteView() {
  const { progress } = useProgress()
  const route = getRoute(progress.routeId)
  const groups = useMemo(() => groupStops(route), [route])
  const next = nextOnRoute(progress, route)
  const nextKey = next ? stopKey(next) : undefined
  const nextGroup = groups.find((g) => g.stops.some((s) => stopKey(s) === nextKey))?.key
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(nextGroup ? [nextGroup] : groups[0] ? [groups[0].key] : []))
  const [sheet, setSheet] = useState(false)
  const { done, total } = routeProgress(progress, route)

  // A route change regroups the line; open wherever "next" now lives.
  const routeId = route.id
  const lastRoute = useRef(routeId)
  useEffect(() => {
    if (lastRoute.current === routeId) return
    lastRoute.current = routeId
    setExpanded(new Set(nextGroup ? [nextGroup] : []))
  }, [routeId, nextGroup])

  function jumpTo(groupKey: string, anchor?: string) {
    setExpanded((s) => new Set(s).add(groupKey))
    scrollToId(anchor ?? `group-${groupKey}`)
  }

  const allOpen = expanded.size === groups.length

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
        <ProgressRing value={total ? done / total : 0} size={40} label={`${route.title} progress`} showValue />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[1rem] font-semibold">{route.title}</p>
          <p className="line-clamp-2 text-[0.8125rem] leading-snug text-ink-2">{route.blurb}</p>
        </div>
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-hairline px-3 text-[0.875rem] font-medium hover:border-line"
        >
          <RouteIcon size={15} strokeWidth={2} aria-hidden="true" />
          Change
        </button>
      </div>

      <div className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-20 -mx-4 mt-3 border-b border-hairline/60 bg-paper/90 py-1 backdrop-blur-md lg:-mx-8">
        <div
          role="group"
          aria-label="Jump to a track"
          className="flex gap-2 overflow-x-auto overflow-y-hidden px-4 py-1 [scrollbar-width:none] lg:px-8 [&::-webkit-scrollbar]:hidden"
        >
          {nextGroup && nextKey && (
            <Chip onClick={() => jumpTo(nextGroup, `stop-${nextKey}`)} active>
              <LocateFixed size={14} strokeWidth={2.2} aria-hidden="true" /> Up next
            </Chip>
          )}
          {groups.map((g) => {
            const gDone = g.stops.every((s) => ('module' in s ? isPassed(progress, s.module) : false))
            return (
              <Chip key={g.key} onClick={() => jumpTo(g.key)}>
                {g.code && <span className="font-mono text-[0.6875rem] text-ink-3">{g.code}</span>}
                {g.title}
                {gDone && <span className="sr-only">(done)</span>}
              </Chip>
            )
          })}
        </div>
      </div>

      <div className="mt-4 mb-2 flex items-center justify-between">
        <p className="font-mono text-[0.75rem] text-ink-3 tabular">
          {done} of {total} stops · nothing is locked
        </p>
        <button
          type="button"
          onClick={() => setExpanded(allOpen ? new Set() : new Set(groups.map((g) => g.key)))}
          className="min-h-11 px-1 text-[0.8125rem] font-medium text-line hover:underline"
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <LineMap
        groups={groups}
        progress={progress}
        nextKey={nextKey}
        expanded={expanded}
        onToggle={(key) =>
          setExpanded((s) => {
            const n = new Set(s)
            if (n.has(key)) n.delete(key)
            else n.add(key)
            return n
          })
        }
      />

      {sheet && <OnboardingSheet open mode="edit" onClose={() => setSheet(false)} />}
    </>
  )
}

const REFERENCE = [
  { to: '/glossary', icon: BookA, title: 'Glossary', sub: 'Every abbreviation, each with a picture' },
  { to: '/patterns', icon: Puzzle, title: 'Patterns cheat sheet', sub: 'The tells, and the move each one calls for' },
  { to: '/m/c-framework', icon: Compass, title: 'Delivery framework', sub: 'The six phases of a 45-minute design round' },
]

function TopicsView() {
  const { progress } = useProgress()
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {populatedTracks.map((t) => {
          const mods = modulesOfTrack(t.id)
          const done = mods.filter((m) => isPassed(progress, m.id)).length
          const minutes = mods.reduce((n, m) => n + m.minutes, 0)
          return (
            <Link
              key={t.id}
              to={`/learn/${t.id}`}
              className="flex gap-3.5 rounded-2xl border border-hairline bg-surface p-4 transition-colors duration-150 hover:border-line active:bg-surface-2"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <TrackTile trackId={t.id} code={t.code} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-[1rem] leading-snug font-semibold">{t.title}</h2>
                  <ProgressRing value={mods.length ? done / mods.length : 0} size={28} label={`${t.title} progress`} />
                </div>
                <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-relaxed text-ink-2">{t.blurb}</p>
                <p className="mt-2 font-mono text-[0.6875rem] text-ink-3 tabular">
                  {mods.length} lessons · {minutes} min{done ? ` · ${done} done` : ''}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      <h2 className="mt-8 mb-3 font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase">Reference</h2>
      <ul className="overflow-hidden rounded-2xl border border-hairline bg-surface">
        {REFERENCE.map((r) => (
          <li key={r.to} className="border-b border-hairline last:border-b-0">
            <Link to={r.to} className="flex min-h-16 items-center gap-3.5 px-4 py-3 transition-colors hover:bg-surface-2/60">
              <r.icon size={19} strokeWidth={1.9} aria-hidden="true" className="shrink-0 text-line" />
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] font-medium">{r.title}</span>
                <span className="block text-[0.8125rem] text-ink-2">{r.sub}</span>
              </span>
              <ChevronRight size={18} strokeWidth={2} aria-hidden="true" className="shrink-0 text-ink-3" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export function LearnScreen() {
  const { ready } = useProgress()
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'topics' ? 'topics' : 'route'
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrolled = useScrolledPast(titleRef)

  return (
    <div>
      <TopBar
        title="Learn"
        showTitle={scrolled}
        right={
          <Link
            to="/search"
            aria-label="Search"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-2 hover:bg-surface-2 hover:text-ink lg:hidden"
          >
            <Search size={19} strokeWidth={2} />
          </Link>
        }
      />
      <PageTitle title="Learn" titleRef={titleRef} sub="Follow the line, or go straight to any topic." />

      <div className="mb-4 max-w-xs">
        <Segmented<View>
          label="View"
          value={view}
          onChange={(v) => setParams(v === 'route' ? {} : { view: v }, { replace: true })}
          options={[
            { value: 'route', label: 'Your route' },
            { value: 'topics', label: 'All topics' },
          ]}
        />
      </div>

      {!ready ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : view === 'route' ? (
        <RouteView />
      ) : (
        <TopicsView />
      )}
    </div>
  )
}
