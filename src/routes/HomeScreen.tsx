import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Flag, Flame, Layers, Search, Shuffle, Timer } from 'lucide-react'
import {
  getModule,
  getProblem,
  getRoute,
  getTrack,
  modules,
  modulesOfTrack,
  populatedTracks,
  stopTitle,
} from '../content'
import type { RouteStop } from '../content/types'
import { getCategory } from '../content/categories'
import { useProgress } from '../state/ProgressProvider'
import {
  hasReadLesson,
  isPassed,
  liveStreak,
  moduleProgress,
  nextOnRoute,
  routeProgress,
  stopAfter,
  weekActivity,
} from '../lib/progress'
import { isDue } from '../lib/srs'
import { practiceNext, readiness, surpriseMe } from '../lib/readiness'
import { headingSlugs } from '../lib/slug'
import { plainText } from '../lib/text'
import { stopKey } from '../lib/storage'
import { TopBar } from '../components/ui/TopBar'
import { SearchPill } from '../components/ui/SearchPill'
import { Badge, Meter, Skeleton } from '../components/ui/Bits'
import { ProgressRing } from '../components/ui/ProgressRing'
import { TrackTile } from '../components/ui/TrackIcon'
import { useScrolledPast } from '../components/ui/useScrolledPast'
import { OnboardingSheet } from '../components/onboarding/OnboardingSheet'

function greeting(now = new Date()): string {
  const h = now.getHours()
  return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const DIFF_TONE = { easy: 'mastered', medium: 'streak', hard: 'alert' } as const
const DAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex min-h-8 items-center justify-between gap-3">
        <h2 className="text-[1.125rem] font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

const cardCls =
  'rounded-2xl border border-hairline bg-surface p-4 transition-colors duration-150 hover:border-line active:bg-surface-2'

/** The one filled card on the screen: where you left off, or where to begin. */
function ContinueCard() {
  const { progress } = useProgress()
  const route = getRoute(progress.routeId)

  const place = progress.lastPlace
  const placeModule = place ? getModule(place.moduleId) : undefined
  const resuming = placeModule && !isPassed(progress, placeModule.id) ? placeModule : undefined
  const next: RouteStop | undefined = resuming ? { module: resuming.id } : nextOnRoute(progress, route)
  const anyStarted = Object.keys(progress.lessonsRead).length > 0 || Object.keys(progress.quiz).length > 0

  if (!next) {
    return (
      <Link to="/practice" className="flex items-center gap-4 rounded-2xl bg-line px-5 py-5 text-line-ink transition-opacity hover:opacity-95">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase opacity-80">Route complete</p>
          <p className="mt-1 text-[1.125rem] font-semibold">Keep sharp on the famous problems</p>
        </div>
        <ArrowRight size={22} strokeWidth={2.2} aria-hidden="true" />
      </Link>
    )
  }

  if ('problem' in next) {
    const p = getProblem(next.problem)
    return (
      <Link
        to={`/practice/${next.problem}`}
        className="flex items-center gap-4 rounded-2xl bg-line px-5 py-5 text-line-ink transition-opacity hover:opacity-95"
      >
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-[0.14em] uppercase opacity-80">
            <Flag size={12} strokeWidth={2.5} aria-hidden="true" /> Checkpoint
          </p>
          <p className="mt-1 text-[1.1875rem] leading-snug font-semibold">{p ? plainText(p.title) : next.problem}</p>
          <p className="mt-1 text-[0.8125rem] opacity-85">45 minutes on the clock · then grade yourself</p>
        </div>
        <ArrowRight size={22} strokeWidth={2.2} aria-hidden="true" className="shrink-0" />
      </Link>
    )
  }

  const m = getModule(next.module)!
  const track = getTrack(m.trackId)
  const pct = moduleProgress(progress, m)
  let section: string | undefined
  if (resuming && place?.sectionId) {
    const slugs = headingSlugs(m.lesson)
    for (const [i, slug] of slugs) {
      if (slug === place.sectionId) {
        const b = m.lesson[i]
        if (b.kind === 'heading') section = plainText(b.text)
      }
    }
  }
  const href = `/m/${m.id}${resuming && place?.sectionId ? `#${place.sectionId}` : ''}`
  const eyebrow = resuming ? 'Continue reading' : anyStarted ? 'Up next' : 'Start here'

  return (
    <Link to={href} className="block rounded-2xl bg-line px-5 py-5 text-line-ink transition-opacity hover:opacity-95">
      <p className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase opacity-80">{eyebrow}</p>
      <p className="mt-2 text-[0.8125rem] opacity-85">
        {track?.title} · {String(m.station).padStart(2, '0')}
      </p>
      <p className="mt-0.5 text-[1.25rem] leading-snug font-semibold">{plainText(m.title)}</p>
      {section && <p className="mt-1 truncate text-[0.875rem] opacity-90">at “{section}”</p>}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-ink/25" aria-hidden="true">
          <div className="h-full rounded-full bg-line-ink" style={{ width: `${Math.round(pct * 100)}%` }} />
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-[0.875rem] font-semibold">
          {resuming ? 'Resume' : 'Start'} · {m.minutes} min
          <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

function RouteSnapshot({ onChangeRoute }: { onChangeRoute: () => void }) {
  const { progress } = useProgress()
  const route = getRoute(progress.routeId)
  const { done, total } = routeProgress(progress, route)
  const first = nextOnRoute(progress, route)
  const upcoming: RouteStop[] = []
  let cursor = first
  while (cursor && upcoming.length < 3) {
    upcoming.push(cursor)
    cursor = stopAfter(route, cursor)
  }

  return (
    <Section
      title="Your route"
      action={
        <button type="button" onClick={onChangeRoute} className="min-h-11 px-1 text-[0.875rem] font-medium text-line hover:underline">
          Change
        </button>
      }
    >
      <Link to="/learn" className={`block ${cardCls}`}>
        <div className="flex items-center gap-3">
          <ProgressRing value={total ? done / total : 0} size={40} label={`${route.title} progress`} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.9375rem] font-semibold">{route.title}</p>
            <p className="font-mono text-[0.75rem] text-ink-3 tabular">
              {done} / {total} stops
            </p>
          </div>
          <ArrowRight size={18} strokeWidth={2} aria-hidden="true" className="text-ink-3" />
        </div>
        {upcoming.length > 0 && (
          <ol className="relative mt-4 ml-[19px] border-l-2 border-dashed border-hairline pl-5">
            {upcoming.map((s, i) => (
              <li key={stopKey(s)} className="relative py-1.5">
                <span
                  aria-hidden="true"
                  className={`absolute top-[0.8rem] -left-[27px] h-3 w-3 border-2 bg-surface ${
                    'problem' in s ? 'rotate-45 rounded-[2px]' : 'rounded-full'
                  } ${i === 0 ? 'border-line' : 'border-ink-3'}`}
                />
                <p className={`text-[0.875rem] leading-snug ${i === 0 ? 'font-medium text-ink' : 'text-ink-2'}`}>
                  {plainText(stopTitle(s))}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Link>
    </Section>
  )
}

function Readiness() {
  const { progress } = useProgress()
  const rounds = readiness(progress)
  const weakest = [...rounds].sort((a, b) => a.score - b.score)[0]
  return (
    <Section
      title="Interview readiness"
      action={
        <Link to="/you" className="flex min-h-11 items-center px-1 text-[0.875rem] font-medium text-line hover:underline">
          Details
        </Link>
      }
    >
      <div className="rounded-2xl border border-hairline bg-surface p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
        <ul className="flex flex-col gap-3.5">
          {rounds.map((r) => (
            <li key={r.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-[0.9375rem] font-medium">{r.title}</span>
                <span className="font-mono text-[0.8125rem] text-ink-2 tabular">{Math.round(r.score * 100)}%</span>
              </div>
              <Meter value={r.score} tone={r.score >= 0.999 ? 'mastered' : 'line'} label={`${r.title} readiness`} />
            </li>
          ))}
        </ul>
        {weakest?.next && (
          <Link
            to={'module' in weakest.next ? `/m/${weakest.next.module}` : `/practice/${weakest.next.problem}`}
            className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-xl bg-surface-2 px-3.5 py-2.5 text-[0.875rem] transition-colors hover:bg-line-soft"
          >
            <span className="min-w-0">
              <span className="block text-[0.75rem] text-ink-3">Biggest gain · {weakest.title}</span>
              <span className="block truncate font-medium">{plainText(stopTitle(weakest.next))}</span>
            </span>
            <ArrowRight size={17} strokeWidth={2} aria-hidden="true" className="shrink-0 text-line" />
          </Link>
        )}
      </div>
    </Section>
  )
}

function ReviewAndPractice() {
  const { progress } = useProgress()
  const navigate = useNavigate()
  const readCards = useMemo(
    () => modules.filter((m) => hasReadLesson(progress, m.id)).flatMap((m) => m.cards),
    [progress],
  )
  const due = readCards.filter((c) => isDue(progress.cards[c.id])).length
  const pick = practiceNext(progress, 'hld')

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      <Link to={due ? '/review/session' : '/review'} className={`flex flex-col ${cardCls}`}>
        <p className="flex items-center gap-2 font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase">
          <Layers size={14} strokeWidth={2} aria-hidden="true" /> Review
        </p>
        {readCards.length === 0 ? (
          <>
            <p className="mt-2 text-[1.0625rem] font-semibold">No cards yet</p>
            <p className="mt-0.5 text-[0.875rem] text-ink-2">Each lesson you read adds two or three.</p>
          </>
        ) : due > 0 ? (
          <>
            <p className="mt-2 text-[1.0625rem] font-semibold">
              {due} card{due === 1 ? '' : 's'} due
            </p>
            <p className="mt-0.5 text-[0.875rem] text-ink-2">About {Math.max(1, Math.ceil(due * 0.4))} min. Spacing is what makes it stick.</p>
          </>
        ) : (
          <>
            <p className="mt-2 text-[1.0625rem] font-semibold">All caught up</p>
            <p className="mt-0.5 text-[0.875rem] text-ink-2">Nothing due. Come back tomorrow.</p>
          </>
        )}
      </Link>

      {pick && (
        <div className={`flex flex-col ${cardCls.replace('hover:border-line active:bg-surface-2', '')}`}>
          <p className="flex items-center gap-2 font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase">
            <Timer size={14} strokeWidth={2} aria-hidden="true" /> Practice next
          </p>
          <Link to={`/practice/${pick.id}`} className="mt-2 block rounded-lg hover:text-line">
            <p className="text-[1.0625rem] leading-snug font-semibold">{plainText(pick.title)}</p>
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={DIFF_TONE[pick.difficulty]}>{pick.difficulty}</Badge>
            <Badge>{getCategory(pick.category)?.title}</Badge>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              to={`/practice/${pick.id}`}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-line px-3 text-[0.875rem] font-medium text-line-ink hover:opacity-90"
            >
              Start
            </Link>
            <button
              type="button"
              onClick={() => navigate(`/practice/${surpriseMe(progress, 'hld').id}`)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-hairline bg-surface px-3 text-[0.875rem] font-medium hover:border-line"
            >
              <Shuffle size={15} strokeWidth={2} aria-hidden="true" /> Surprise me
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Week() {
  const { progress } = useProgress()
  const days = weekActivity(progress.activity)
  const streak = liveStreak(progress.streak)
  return (
    <Section title="This week">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-surface p-4">
        <ol className="flex max-w-sm flex-1 justify-between gap-1" aria-label="Study days this week">
          {days.map((d, i) => {
            const date = new Date(`${d.day}T12:00:00`)
            const today = i === days.length - 1
            return (
              <li key={d.day} className="flex flex-col items-center gap-1.5">
                <span className={`font-mono text-[0.625rem] ${today ? 'text-ink' : 'text-ink-3'}`}>{DAY[date.getDay()]}</span>
                <span
                  aria-label={`${date.toLocaleDateString(undefined, { weekday: 'long' })}: ${d.count ? `${d.count} actions` : 'no study'}`}
                  className={`h-3.5 w-3.5 rounded-full ${d.count ? 'bg-line' : 'bg-surface-2'} ${today ? 'ring-2 ring-line/40 ring-offset-2 ring-offset-surface' : ''}`}
                />
              </li>
            )
          })}
        </ol>
        <div className="shrink-0 border-l border-hairline pl-4 text-right">
          <p className={`flex items-center justify-end gap-1 text-[1.25rem] leading-none font-semibold tabular ${streak ? 'text-streak' : 'text-ink-3'}`}>
            {streak > 0 && <Flame size={16} strokeWidth={2.4} aria-hidden="true" />}
            {streak}
          </p>
          <p className="mt-1 text-[0.75rem] text-ink-3">day streak · best {progress.streak.longest}</p>
        </div>
      </div>
    </Section>
  )
}

function ExploreTracks() {
  const { progress } = useProgress()
  return (
    <Section
      title="Explore tracks"
      action={
        <Link to="/learn?view=topics" className="flex min-h-11 items-center px-1 text-[0.875rem] font-medium text-line hover:underline">
          All topics
        </Link>
      }
    >
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        {populatedTracks.map((t) => {
          const mods = modulesOfTrack(t.id)
          const done = mods.filter((m) => isPassed(progress, m.id)).length
          return (
            <Link
              key={t.id}
              to={`/learn/${t.id}`}
              className={`flex w-44 shrink-0 snap-start flex-col lg:w-auto ${cardCls}`}
            >
              <div className="flex items-start justify-between">
                <TrackTile trackId={t.id} code={t.code} />
                <ProgressRing value={mods.length ? done / mods.length : 0} size={28} label={`${t.title} progress`} />
              </div>
              <p className="mt-3 text-[0.9375rem] leading-snug font-semibold">{t.title}</p>
              <p className="mt-auto pt-1 font-mono text-[0.6875rem] text-ink-3 tabular">
                {done}/{mods.length} · {mods.reduce((n, m) => n + m.minutes, 0)} min
              </p>
            </Link>
          )
        })}
      </div>
    </Section>
  )
}

export function HomeScreen() {
  const { progress, ready } = useProgress()
  const [routeSheet, setRouteSheet] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrolled = useScrolledPast(titleRef)
  const streak = liveStreak(progress.streak)

  return (
    <div>
      <TopBar
        title="Throughput"
        showTitle={scrolled}
        right={
          <>
            {streak > 0 && (
              <Badge tone="streak">
                <Flame size={12} strokeWidth={2.5} aria-hidden="true" />
                {streak}d
              </Badge>
            )}
            <Link
              to="/search"
              aria-label="Search"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-2 hover:bg-surface-2 hover:text-ink lg:hidden"
            >
              <Search size={19} strokeWidth={2} />
            </Link>
          </>
        }
      />

      <div className="mt-4 mb-4">
        <p className="font-mono text-[0.6875rem] tracking-[0.2em] text-line uppercase lg:hidden">Throughput</p>
        <h1 ref={titleRef} tabIndex={-1} className="mt-1 text-[1.875rem] leading-tight font-semibold outline-none">
          {greeting()}
        </h1>
        <p className="mt-1 text-[0.9375rem] text-ink-2">Senior interview prep, one stop at a time.</p>
      </div>

      <div className="mb-5 lg:hidden">
        <SearchPill />
      </div>

      {!ready ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-36" />
          <Skeleton className="mt-6 h-40" />
          <Skeleton className="mt-6 h-44" />
        </div>
      ) : (
        <>
          <ContinueCard />
          <RouteSnapshot onChangeRoute={() => setRouteSheet(true)} />
          <Readiness />
          <ReviewAndPractice />
          <Week />
          <ExploreTracks />
        </>
      )}

      {ready && !progress.onboarded && <OnboardingSheet open onClose={() => undefined} />}
      {routeSheet && <OnboardingSheet open mode="edit" onClose={() => setRouteSheet(false)} />}
    </div>
  )
}
