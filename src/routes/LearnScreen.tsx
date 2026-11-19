import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BookA, Check, ChevronDown, Compass, Flag, LocateFixed, Puzzle, Route as RouteIcon, Search } from 'lucide-react'
import { getRoute, modulesOfTrack, populatedTracks } from '../content'
import { useProgress } from '../state/ProgressProvider'
import { isPassed, nextOnRoute, routeProgress, stopDone } from '../lib/progress'
import { stopKey } from '../lib/storage'
import { TopBar, PageTitle } from '../components/ui/TopBar'
import { Segmented } from '../components/ui/Segmented'
import { Chip, ChipRow } from '../components/ui/Chip'
import { ProgressRing } from '../components/ui/ProgressRing'
import { TrackGlyph, TrackIcon } from '../components/ui/TrackIcon'
import { trackStyle } from '../components/ui/trackStyle'
import { Panel, Skeleton } from '../components/ui/Bits'
import { Cell, Group } from '../components/ui/List'
import { RouteRibbon } from '../components/ui/RouteRibbon'
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

/** A square tile for rows that are not a track: same size and radius as a TrackGlyph. */
function IconTile({ children }: { children: ReactNode }) {
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-surface-3 text-ink">{children}</span>
}

function RouteView({ onChangeRoute }: { onChangeRoute: () => void }) {
  const { progress } = useProgress()
  const route = getRoute(progress.routeId)
  const groups = useMemo(() => groupStops(route), [route])
  const next = nextOnRoute(progress, route)
  const nextKey = next ? stopKey(next) : undefined
  const nextGroup = groups.find((g) => g.stops.some((s) => stopKey(s) === nextKey))?.key
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(nextGroup ? [nextGroup] : groups[0] ? [groups[0].key] : []))
  const { done, total } = routeProgress(progress, route)
  const chipsTop = useRef<HTMLDivElement>(null)
  const stuck = useScrolledPast(chipsTop)

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
  const segments = groups.map((g) => ({
    trackId: g.track?.id ?? 'practice',
    total: g.stops.length,
    done: g.stops.filter((s) => stopDone(progress, s)).length,
  }))

  return (
    <>
      <Panel>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[2.25rem] leading-none font-extrabold tracking-[-0.03em] tabular">{done}</span>
          <span className="text-base font-semibold text-ink-2 tabular">
            of {total} stops passed · {total ? Math.round((done / total) * 100) : 0}%
          </span>
        </p>
        <div className="mt-4">
          <RouteRibbon segments={segments} />
        </div>
        <p className="mt-4 text-[0.9375rem] leading-snug text-ink-2">
          {route.blurb} <span className="font-semibold text-ink">Nothing is locked.</span>
        </p>
      </Panel>

      {/* The chip row sits on the page until it reaches the top bar, then turns to glass with it. */}
      <div ref={chipsTop} aria-hidden="true" className="mt-4 h-px" />
      <div
        className={`sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-20 -mx-4 px-4 py-1.5 transition-[background-color,box-shadow] duration-200 lg:-mx-8 lg:px-8 ${
          stuck ? 'bar-glass shadow-[0_1px_0_var(--hairline)]' : 'bg-paper'
        }`}
      >
        <ChipRow label="Jump to a track">
          {nextGroup && nextKey && (
            <Chip onClick={() => jumpTo(nextGroup, `stop-${nextKey}`)} active>
              <LocateFixed size={16} strokeWidth={2.2} aria-hidden="true" /> Up next
            </Chip>
          )}
          {groups.map((g) => {
            const gDone = g.stops.every((s) => ('module' in s ? isPassed(progress, s.module) : false))
            return (
              <Chip key={g.key} onClick={() => jumpTo(g.key)}>
                <span style={trackStyle(g.track?.id)} className="flex text-track">
                  {g.track ? <TrackIcon trackId={g.track.id} size={16} /> : <Flag size={16} strokeWidth={2} aria-hidden="true" />}
                </span>
                {g.title}
                {gDone && (
                  <>
                    <Check size={15} strokeWidth={3} aria-hidden="true" className="text-correct" />
                    <span className="sr-only">(done)</span>
                  </>
                )}
              </Chip>
            )
          })}
        </ChipRow>
      </div>

      <div className="mt-3">
        <LineMap
          title="Stops by track"
          action={
            <button
              type="button"
              onClick={() => setExpanded(allOpen ? new Set() : new Set(groups.map((g) => g.key)))}
              className="-mr-2 -mb-2 inline-flex min-h-11 items-center rounded-full px-3 text-[0.9375rem] font-semibold text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {allOpen ? 'Collapse all' : 'Expand all'}
            </button>
          }
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
      </div>

      <Group className="mt-6">
        <Cell
          onClick={onChangeRoute}
          chevron
          leading={
            <IconTile>
              <RouteIcon size={18} strokeWidth={2.2} aria-hidden="true" />
            </IconTile>
          }
          title="Change route"
          sub={`On ${route.title} · ${route.stops.length} stops`}
        />
      </Group>
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
    <div className="flex flex-col gap-6">
      <Group title="Tracks">
        {populatedTracks.map((t) => {
          const mods = modulesOfTrack(t.id)
          const done = mods.filter((m) => isPassed(progress, m.id)).length
          const minutes = mods.reduce((n, m) => n + m.minutes, 0)
          return (
            <Cell
              key={t.id}
              to={`/learn/${t.id}`}
              leading={<TrackGlyph trackId={t.id} size={36} />}
              title={t.title}
              sub={
                <span className="tabular">
                  {done} of {mods.length} passed · {minutes} min
                </span>
              }
              trailing={
                <span style={trackStyle(t.id)} className="flex">
                  <ProgressRing value={mods.length ? done / mods.length : 0} size={28} label={`${t.title} progress`} tone="track" />
                </span>
              }
            />
          )
        })}
      </Group>

      <Group title="Reference">
        {REFERENCE.map((r) => (
          <Cell
            key={r.to}
            to={r.to}
            leading={
              <IconTile>
                <r.icon size={18} strokeWidth={2.2} aria-hidden="true" />
              </IconTile>
            }
            title={r.title}
            sub={r.sub}
          />
        ))}
      </Group>
    </div>
  )
}

export function LearnScreen() {
  const { ready, progress } = useProgress()
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'topics' ? 'topics' : 'route'
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrolled = useScrolledPast(titleRef)
  const [sheet, setSheet] = useState(false)
  const route = getRoute(progress.routeId)

  return (
    <div>
      <TopBar
        title="Learn"
        showTitle={scrolled}
        right={
          <Link
            to="/search"
            aria-label="Search"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink transition-colors duration-150 hover:bg-surface-3 lg:hidden"
          >
            <Search size={19} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        }
      />
      <PageTitle
        title="Learn"
        titleRef={titleRef}
        sub={
          ready ? (
            <button
              type="button"
              onClick={() => setSheet(true)}
              aria-haspopup="dialog"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-2 py-2 pr-3 pl-3.5 text-left text-[0.9375rem] font-semibold text-ink transition-[background-color,transform] duration-150 hover:bg-surface-3 active:scale-[0.97] motion-reduce:active:scale-100"
            >
              <RouteIcon size={17} strokeWidth={2.2} aria-hidden="true" className="shrink-0 text-ink-2" />
              <span>{route.title}</span>
              <span className="sr-only">, change route</span>
              <ChevronDown size={17} strokeWidth={2.4} aria-hidden="true" className="shrink-0 text-ink-3" />
            </button>
          ) : (
            <span className="block min-h-11" />
          )
        }
      />

      <div className="mb-5 sm:max-w-sm">
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
          <Skeleton className="h-32" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : view === 'route' ? (
        <RouteView onChangeRoute={() => setSheet(true)} />
      ) : (
        <TopicsView />
      )}

      {sheet && <OnboardingSheet open mode="edit" onClose={() => setSheet(false)} />}
    </div>
  )
}
