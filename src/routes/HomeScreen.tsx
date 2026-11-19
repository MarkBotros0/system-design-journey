import { Fragment, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Flag, Search } from 'lucide-react'
import { getModule, getRoute, getTrack, stopTitle } from '../content'
import type { RouteStop } from '../content/types'
import { useProgress } from '../state/ProgressProvider'
import { moduleProgress, moduleStatus, nextOnRoute, routeProgress, stopAfter, stopDone } from '../lib/progress'
import { readiness } from '../lib/readiness'
import { reviewDeck } from '../lib/review'
import { todayCount } from '../lib/bank'
import { plainText } from '../lib/text'
import { stopKey } from '../lib/storage'
import { PageTitle, TopBar } from '../components/ui/TopBar'
import { Skeleton } from '../components/ui/Bits'
import { ProgressRing } from '../components/ui/ProgressRing'
import { Cell, Group } from '../components/ui/List'
import { StatTile } from '../components/ui/StatTile'
import { RouteRibbon } from '../components/ui/RouteRibbon'
import { TrackGlyph } from '../components/ui/TrackIcon'
import { useScrolledPast } from '../components/ui/useScrolledPast'
import { groupStops } from '../components/line/groupStops'
import { OnboardingSheet } from '../components/onboarding/OnboardingSheet'
import { TodayCard } from '../components/home/TodayCard'
import { IconTile } from '../components/home/IconTile'

function greeting(now = new Date()): string {
  const h = now.getHours()
  return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const UP_NEXT = 3

/** A stop's glyph: its track's, or a flag for a checkpoint problem (problems have no track). */
function StopGlyph({ stop }: { stop: RouteStop }) {
  const m = 'module' in stop ? getModule(stop.module) : undefined
  return m ? (
    <TrackGlyph trackId={m.trackId} />
  ) : (
    <IconTile>
      <Flag size={17} strokeWidth={2.2} />
    </IconTile>
  )
}

/** A small ring in the in-progress colour, with the words beside it — never colour alone. */
function InProgress({ value }: { value: number }) {
  const r = 5.5
  const c = 2 * Math.PI * r
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-streak">
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="-rotate-90">
        <circle cx="7" cy="7" r={r} fill="none" strokeWidth="2.5" className="stroke-streak/25" />
        <circle
          cx="7"
          cy="7"
          r={r}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0.15, value))}
          className="stroke-streak"
        />
      </svg>
      In progress
    </span>
  )
}

/** Meta parts joined by middots; a line may only break between parts, never inside "8 min". */
function Meta({ parts }: { parts: ReactNode[] }) {
  return parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 && ' · '}
      <span className="whitespace-nowrap">{part}</span>
    </Fragment>
  ))
}

function StopCell({ stop, first, fresh }: { stop: RouteStop; first: boolean; fresh: boolean }) {
  const { progress } = useProgress()
  if ('problem' in stop) {
    return (
      <Cell
        to={`/practice/${stop.problem}`}
        leading={<StopGlyph stop={stop} />}
        title={plainText(stopTitle(stop))}
        sub={<Meta parts={['Checkpoint problem', '45 min']} />}
      />
    )
  }
  const m = getModule(stop.module)!
  const started = first && moduleStatus(progress, m) === 'started'
  const parts: ReactNode[] = started
    ? [<InProgress key="state" value={moduleProgress(progress, m)} />, `Lesson ${m.station}`, `${m.minutes} min`]
    : first && fresh
      ? [<span key="state" className="font-semibold text-ink">Start here</span>, `Lesson ${m.station}`, `${m.minutes} min`]
      : [getTrack(m.trackId)?.title ?? '', `Lesson ${m.station}`]
  return <Cell to={`/m/${m.id}`} leading={<StopGlyph stop={stop} />} title={plainText(m.title)} sub={<Meta parts={parts} />} />
}

/** The route: how far along, one stripe per track, and the next few stops. */
function UpNext({ onChangeRoute }: { onChangeRoute: () => void }) {
  const { progress } = useProgress()
  const route = getRoute(progress.routeId)
  const { done, total } = routeProgress(progress, route)
  const segments = useMemo(
    () =>
      groupStops(route).map((g) => ({
        trackId: g.track?.id ?? 'practice',
        total: g.stops.length,
        done: g.stops.filter((s) => stopDone(progress, s)).length,
      })),
    [route, progress],
  )

  // The next few stops still to do — a stop done out of order is not "next".
  const first = nextOnRoute(progress, route)
  const upcoming: RouteStop[] = []
  for (let s = first; s && upcoming.length < UP_NEXT; s = stopAfter(route, s)) {
    if (s === first || !stopDone(progress, s)) upcoming.push(s)
  }
  const fresh = Object.keys(progress.lessonsRead).length === 0 && Object.keys(progress.quiz).length === 0

  return (
    <Group title="Up next" className="mt-8">
      <li className="px-4 pt-3.5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pt-0.5">
            <p className="text-base leading-snug font-bold">{route.title}</p>
            <p className="text-[0.875rem] text-ink-2 tabular">
              {done} of {total} stops · {total ? Math.round((done / total) * 100) : 0}%
            </p>
          </div>
          <button
            type="button"
            onClick={onChangeRoute}
            className="-mt-1 -mr-2 inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-[0.9375rem] font-semibold text-ink underline decoration-ink-3 underline-offset-4 transition-colors duration-150 hover:bg-surface-2"
          >
            Change
            <span className="sr-only"> route</span>
          </button>
        </div>
        <div className="mt-3">
          <RouteRibbon segments={segments} />
        </div>
      </li>
      {upcoming.length ? (
        upcoming.map((s, i) => <StopCell key={stopKey(s)} stop={s} first={i === 0} fresh={fresh} />)
      ) : (
        <Cell
          to="/practice"
          leading={
            <IconTile>
              <Flag size={17} strokeWidth={2.2} />
            </IconTile>
          }
          title="Route complete"
          sub="Keep sharp on the famous problems"
        />
      )}
      <Cell to="/learn" title={`See all ${total} stops`} />
    </Group>
  )
}

/** Each interview round as a ring, and the single stop that would raise the weakest most. */
function Readiness() {
  const { progress } = useProgress()
  const rounds = readiness(progress)
  const weakest = [...rounds].sort((a, b) => a.score - b.score)[0]
  return (
    <Group
      title="Interview readiness"
      className="mt-8"
      action={
        <Link
          to="/you"
          className="inline-flex min-h-11 items-end pb-px pl-3 text-[0.9375rem] font-semibold text-ink-2 transition-colors duration-150 hover:text-ink"
        >
          Details
          <span className="sr-only"> of interview readiness</span>
        </Link>
      }
    >
      <li className="grid grid-cols-3 gap-2 px-3 pt-4 pb-3.5">
        {rounds.map((r) => (
          <div key={r.id} className="flex flex-col items-center gap-2 text-center">
            <ProgressRing value={r.score} size={56} label={`${r.title} readiness`} />
            <span aria-hidden="true" className="text-[0.875rem] leading-tight font-semibold text-ink-2">
              {r.title}
            </span>
          </div>
        ))}
      </li>
      {weakest?.next && (
        <Cell
          to={'module' in weakest.next ? `/m/${weakest.next.module}` : `/practice/${weakest.next.problem}`}
          leading={<StopGlyph stop={weakest.next} />}
          title={plainText(stopTitle(weakest.next))}
          sub={`Biggest gain · ${weakest.title}`}
        />
      )}
    </Group>
  )
}

function Stats() {
  const { progress } = useProgress()
  const route = getRoute(progress.routeId)
  const { done, total } = routeProgress(progress, route)
  const due = useMemo(() => reviewDeck(progress).due.length, [progress])
  const today = todayCount(progress)
  const small = 'text-[1rem] font-bold tracking-normal text-ink-3'
  return (
    <div className="mt-3 grid grid-cols-3 gap-2.5">
      <StatTile
        to="/questions"
        label="Questions"
        value={
          <>
            {today.answered}
            <span className={small}>/{progress.dailyGoal}</span>
          </>
        }
        sub="today"
      />
      <StatTile to="/review" label="Cards" value={due} sub="due" />
      <StatTile
        to="/learn"
        label="Route"
        value={
          <>
            {done}
            <span className={small}>/{total}</span>
          </>
        }
        sub="stops"
      />
    </div>
  )
}

export function HomeScreen() {
  const { progress, ready } = useProgress()
  const [routeSheet, setRouteSheet] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrolled = useScrolledPast(titleRef)
  const [now] = useState(() => new Date())
  const title = greeting(now)

  return (
    <div>
      <TopBar title={title} showTitle={scrolled} />
      <PageTitle
        title={title}
        titleRef={titleRef}
        eyebrow={now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        right={
          <Link
            to="/search"
            aria-label="Search"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink transition-transform duration-150 active:scale-95 motion-reduce:active:scale-100 lg:hidden"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <Search size={19} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        }
      />

      {!ready ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-[22rem]" />
          <Skeleton className="h-24" />
          <Skeleton className="mt-8 h-64" />
        </div>
      ) : (
        <>
          <TodayCard />
          <Stats />
          <UpNext onChangeRoute={() => setRouteSheet(true)} />
          <Readiness />
        </>
      )}

      {ready && !progress.onboarded && <OnboardingSheet open onClose={() => undefined} />}
      {routeSheet && <OnboardingSheet open mode="edit" onClose={() => setRouteSheet(false)} />}
    </div>
  )
}
