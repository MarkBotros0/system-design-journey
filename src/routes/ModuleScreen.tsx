import { useEffect, useMemo, useRef, useState, type Ref } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BadgeCheck, Bookmark, BookmarkCheck, Check, Flag, Layers, ListChecks, Target } from 'lucide-react'
import { getModule, getProblem, getRoute, getTrack, modulesOfTrack, relatedOf, stopTitle } from '../content'
import type { Module, RouteStop } from '../content/types'
import { useProgress } from '../state/ProgressProvider'
import { hasReadLesson, isPassed, moduleStatus, quizPassed, QUIZ_PASS, stopAfter, stopBefore, type ModuleStatus } from '../lib/progress'
import { headingSlugs } from '../lib/slug'
import { plainText } from '../lib/text'
import { Blocks } from '../components/content/Blocks'
import { Inline } from '../components/content/Inline'
import { Button, ButtonLink, IconButton } from '../components/ui/Button'
import { Badge, Empty, Eyebrow } from '../components/ui/Bits'
import { Sheet } from '../components/ui/Sheet'
import { TopBar } from '../components/ui/TopBar'
import { TrackChip, TrackGlyph, TrackIcon } from '../components/ui/TrackIcon'
import { trackStyle } from '../components/ui/trackStyle'
import { useScrolledPast } from '../components/ui/useScrolledPast'
import { LessonToc, type TocItem } from '../components/lesson/LessonToc'
import { ReadingDock } from '../components/lesson/ReadingDock'
import { Takeaways } from '../components/lesson/Takeaways'
import { RelatedRow } from '../components/lesson/RelatedRow'
import { useLessonScroll } from '../components/lesson/useLessonScroll'

const PLACE_EVERY_MS = 2000
/** The end-of-lesson block: the reading dock's last "next" lands here. */
const FINISH_ID = 'finish'

const stopHref = (s: RouteStop) => ('module' in s ? `/m/${s.module}` : `/practice/${s.problem}`)

/**
 * Neighbours on the learner's route when the lesson is on it; otherwise neighbours within
 * the lesson's own track, so a lesson reached from search still has somewhere to go.
 */
function neighbours(m: Module, routeId: string) {
  const route = getRoute(routeId)
  const here: RouteStop = { module: m.id }
  if (route.stops.some((s) => 'module' in s && s.module === m.id)) {
    return { prev: stopBefore(route, here), next: stopAfter(route, here), on: route.title }
  }
  const track = modulesOfTrack(m.trackId)
  const i = track.findIndex((t) => t.id === m.id)
  const prev = track[i - 1]
  const next = track[i + 1]
  return {
    prev: prev ? ({ module: prev.id } as RouteStop) : undefined,
    next: next ? ({ module: next.id } as RouteStop) : undefined,
    on: getTrack(m.trackId)?.title ?? '',
  }
}

/** Scrolls a heading (or the finish block) to the top, gliding unless motion is reduced. */
function jumpTo(id: string, smooth = true) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: smooth && !reduce ? 'smooth' : 'auto', block: 'start' })
}

/** A small partial ring: "in progress", in the streak colour. States never go without a shape. */
function PartialRing() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true" fill="none" className="shrink-0">
      <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M7 1.75a5.25 5.25 0 0 1 5.25 5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function StatusBadge({ status }: { status: ModuleStatus }) {
  if (status === 'mastered')
    return (
      <Badge tone="mastered">
        <BadgeCheck size={14} strokeWidth={2.4} aria-hidden="true" /> Mastered
      </Badge>
    )
  if (status === 'passed')
    return (
      <Badge tone="correct">
        <Check size={14} strokeWidth={2.8} aria-hidden="true" /> Passed
      </Badge>
    )
  if (status === 'started')
    return (
      <Badge tone="streak">
        <PartialRing /> In progress
      </Badge>
    )
  return null
}

function FinishRow({ m, anchorRef }: { m: Module; anchorRef: Ref<HTMLElement> }) {
  const { progress, markLessonRead } = useProgress()
  const navigate = useNavigate()
  const read = hasReadLesson(progress, m.id)
  const passed = quizPassed(progress, m.id)
  const best = progress.quiz[m.id]?.best

  return (
    <section
      ref={anchorRef}
      id={FINISH_ID}
      aria-labelledby="finish-h"
      className="mt-10 rounded-3xl bg-surface p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center gap-3.5">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            passed ? 'bg-correct-soft text-correct' : 'bg-track-soft text-track'
          }`}
        >
          {passed ? <Check size={21} strokeWidth={2.6} aria-hidden="true" /> : <ListChecks size={20} strokeWidth={2.2} aria-hidden="true" />}
        </span>
        <div className="min-w-0">
          <h2 id="finish-h" className="text-[1.25rem] leading-tight font-bold">
            {!read ? 'Check it stuck' : passed ? 'Passed' : 'Now the quiz'}
          </h2>
          <p className="mt-0.5 text-[0.875rem] font-semibold text-ink-2 tabular">
            {m.quiz.length} questions · {Math.round(QUIZ_PASS * 100)}% to pass
          </p>
        </div>
      </div>

      {!read ? (
        <>
          <p className="mt-4 text-base leading-relaxed text-ink-2">The explanations are where the learning is.</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              onClick={() => {
                markLessonRead(m.id)
                navigate(`/m/${m.id}/quiz`)
              }}
            >
              Mark read and take the quiz
            </Button>
            <Button size="lg" variant="ghost" onClick={() => markLessonRead(m.id)}>
              Just mark as read
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-4 flex items-start gap-2 text-base leading-relaxed text-ink-2">
            <Check size={18} strokeWidth={2.6} aria-hidden="true" className="mt-[3px] shrink-0 text-correct" />
            <span>
              Read.{' '}
              {passed
                ? `Quiz passed at ${Math.round((best ?? 0) * 100)}%.`
                : best !== undefined
                  ? `Best quiz score ${Math.round(best * 100)}% — ${Math.round(QUIZ_PASS * 100)}% passes.`
                  : 'The quiz is next.'}
            </span>
          </p>
          <ButtonLink to={`/m/${m.id}/quiz`} size="lg" variant={passed ? 'secondary' : 'primary'} className="mt-5">
            {best === undefined ? 'Take the quiz' : passed ? 'Retake the quiz' : 'Try again'}
          </ButtonLink>
        </>
      )}
      {m.cards.length > 0 && (
        <p className="mt-4 flex items-start gap-2 text-[0.875rem] leading-snug text-ink-2">
          <Layers size={16} strokeWidth={2} aria-hidden="true" className="mt-px shrink-0 text-ink-3" />
          <span>
            {read
              ? `${m.cards.length} review card${m.cards.length === 1 ? '' : 's'} from this lesson ${m.cards.length === 1 ? 'is' : 'are'} in your deck.`
              : `${m.cards.length} review card${m.cards.length === 1 ? '' : 's'} from this lesson join your deck once it is read.`}
          </span>
        </p>
      )}
    </section>
  )
}

function NextOnRoute({ m }: { m: Module }) {
  const { progress } = useProgress()
  const { prev, next, on } = neighbours(m, progress.routeId)
  const problem = next && 'problem' in next ? getProblem(next.problem) : undefined
  const nextModule = next && 'module' in next ? getModule(next.module) : undefined
  const nextTrack = nextModule ? getTrack(nextModule.trackId) : undefined

  return (
    <>
      {next && (
        <section aria-labelledby="next-h" className="mt-10">
          <h2 id="next-h" className="mb-2.5 px-1">
            <Eyebrow>Next on {on}</Eyebrow>
          </h2>
          {/* Wears the next stop's track, not this lesson's: it is a door into that track. */}
          <Link
            to={stopHref(next)}
            style={trackStyle(nextModule?.trackId)}
            className="flex items-center gap-3 rounded-3xl bg-surface p-4 shadow-[var(--shadow-card)] transition-transform duration-150 active:scale-[0.985] motion-reduce:active:scale-100"
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                {nextModule ? (
                  <TrackGlyph trackId={nextModule.trackId} size={28} />
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-surface-3 text-ink">
                    <Flag size={15} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                )}
                <span className="min-w-0 truncate text-[0.875rem] leading-snug font-bold text-track">
                  {problem ? 'Checkpoint · 45 min' : nextTrack ? `${nextTrack.title} · ${nextModule?.minutes} min` : ''}
                </span>
              </span>
              <span className="mt-2 block text-[1.0625rem] leading-snug font-bold">{plainText(stopTitle(next))}</span>
              {nextModule && <span className="mt-0.5 line-clamp-2 text-[0.875rem] leading-snug text-ink-2">{plainText(nextModule.summary)}</span>}
            </span>
            <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-track text-paper">
              <ArrowRight size={20} strokeWidth={2.4} />
            </span>
          </Link>
        </section>
      )}
      {/* The way forward is the card above; this row only offers the way back. A second
          "Next" here would point at the same stop. */}
      {prev && (
        <nav aria-label="Previous" className={next ? 'mt-3' : 'mt-10'}>
          <Link
            to={stopHref(prev)}
            className="flex min-h-14 items-center gap-3 rounded-[22px] bg-surface-2 px-4 py-3 transition-colors duration-150 hover:bg-surface-3"
          >
            <ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" className="shrink-0 text-ink-2" />
            <span className="min-w-0 flex-1">
              <span className="block text-[0.8125rem] font-semibold text-ink-2">Previous</span>
              <span className="line-clamp-2 text-[0.9375rem] leading-snug font-semibold">{plainText(stopTitle(prev))}</span>
            </span>
          </Link>
        </nav>
      )}
    </>
  )
}

function Lesson({ m }: { m: Module }) {
  const { progress, toggleBookmark, setPlace } = useProgress()
  const location = useLocation()
  const track = getTrack(m.trackId)
  const status = moduleStatus(progress, m)
  const bookmarked = progress.bookmarks.includes(m.id)
  const siblings = modulesOfTrack(m.trackId)
  const position = siblings.findIndex((s) => s.id === m.id) + 1

  const articleRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const finishRef = useRef<HTMLElement>(null)
  const scrolled = useScrolledPast(titleRef)
  const [tocOpen, setTocOpen] = useState(false)

  const toc: TocItem[] = useMemo(() => {
    const slugs = headingSlugs(m.lesson)
    return [...slugs].map(([i, id]) => {
      const b = m.lesson[i]
      return { id, text: b.kind === 'heading' ? plainText(b.text) : id }
    })
  }, [m])
  const ids = useMemo(() => toc.map((t) => t.id), [toc])
  const { progress: read, active } = useLessonScroll(articleRef, ids)

  // Remember where the learner is — at most every two seconds, so scrolling does not
  // turn into a stream of IndexedDB writes. Opening the lesson counts as a place too.
  const last = useRef(0)
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const save = () => {
      last.current = Date.now()
      setPlace(m.id, active)
    }
    const wait = PLACE_EVERY_MS - (Date.now() - last.current)
    if (pending.current) clearTimeout(pending.current)
    if (wait <= 0) save()
    else pending.current = setTimeout(save, wait)
    return () => {
      if (pending.current) clearTimeout(pending.current)
    }
  }, [m.id, active, setPlace])

  // Once the end-of-lesson block is on screen there is no next section to step to.
  const [atEnd, setAtEnd] = useState(false)
  useEffect(() => {
    const el = finishRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setAtEnd(e.isIntersecting || e.boundingClientRect.top < 0))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // The dock's next step. A smooth scroll takes a moment to move the active heading, so
  // a second tap meanwhile aims past the section already being scrolled to.
  const at = active ? ids.indexOf(active) : -1
  const aimed = useRef(-1)
  useEffect(() => {
    aimed.current = -1
  }, [at])
  const upcoming = at + 1
  const next = atEnd
    ? undefined
    : {
        label: upcoming < toc.length ? `Next section: ${toc[upcoming].text}` : 'Jump to the quiz',
        onClick: () => {
          const target = Math.min(toc.length, Math.max(at, aimed.current) + 1)
          aimed.current = target
          jumpTo(target < toc.length ? toc[target].id : FINISH_ID)
        },
      }

  // A contents link changes the hash, and App scrolls to it and moves focus there. Picking
  // the section the hash already names changes nothing, so that one is scrolled here.
  const pick = (id: string) => {
    setTocOpen(false)
    if (decodeURIComponent(location.hash.slice(1)) === id) requestAnimationFrame(() => jumpTo(id, false))
  }

  const prereqs = m.prereqs.map((id) => getModule(id)).filter((x): x is Module => !!x)
  const related = relatedOf(m.id)

  return (
    // The whole lesson wears its track: the reading line, chips, figure tints, focus rings.
    <div style={trackStyle(m.trackId)} className="lg:pb-16 xl:pb-0">
      <TopBar
        title={plainText(m.title)}
        showTitle={scrolled}
        back={{ label: 'Back', to: `/learn/${m.trackId}` }}
        progress={read}
        right={
          <IconButton
            label={bookmarked ? 'Remove bookmark' : 'Bookmark this lesson'}
            aria-pressed={bookmarked}
            onClick={() => toggleBookmark(m.id)}
          >
            {bookmarked ? (
              <BookmarkCheck size={19} strokeWidth={2.2} className="text-track" aria-hidden="true" />
            ) : (
              <Bookmark size={19} strokeWidth={2} aria-hidden="true" />
            )}
          </IconButton>
        }
      />

      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_14rem] xl:gap-12">
        <article ref={articleRef} className="max-w-[44rem] min-w-0">
          <header className="mt-2 mb-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link to={`/learn/${m.trackId}`} className="inline-flex min-h-11 max-w-full items-center rounded-full">
                <TrackChip trackId={m.trackId} label={track?.title ?? ''} />
              </Link>
              <StatusBadge status={status} />
            </div>
            <p className="mt-2 text-[0.875rem] font-semibold text-ink-2 tabular">
              Lesson {position} of {siblings.length} · {m.minutes} min
            </p>
            <h1 ref={titleRef} tabIndex={-1} className="mt-1.5 text-[1.875rem] leading-[1.12] font-extrabold tracking-[-0.025em] outline-none sm:text-[2.125rem]">
              {plainText(m.title)}
            </h1>
            <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink-2">{plainText(m.summary)}</p>

            {prereqs.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[0.875rem] font-bold text-ink-2">Builds on</span>
                {prereqs.map((p) => {
                  const done = isPassed(progress, p.id)
                  return (
                    <Link
                      key={p.id}
                      to={`/m/${p.id}`}
                      style={trackStyle(p.trackId)}
                      className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full bg-track-soft py-1.5 pr-3.5 pl-1.5 text-[0.875rem] leading-tight font-semibold text-ink transition-transform duration-150 active:scale-[0.97] motion-reduce:active:scale-100"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-track text-paper">
                        <TrackIcon trackId={p.trackId} size={14} />
                      </span>
                      <span className="min-w-0">{plainText(p.title)}</span>
                      {done && (
                        <>
                          <Check size={15} strokeWidth={2.8} aria-hidden="true" className="shrink-0 text-correct" />
                          <span className="sr-only">(passed)</span>
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}

            {m.objectives && m.objectives.length > 0 && (
              <div className="mt-6 rounded-3xl bg-track-soft p-5">
                <p className="flex items-center gap-2 text-[0.875rem] font-bold text-ink">
                  <Target size={17} strokeWidth={2.2} aria-hidden="true" className="text-track" /> You will be able to
                </p>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {m.objectives.map((o, i) => (
                    <li key={i} className="flex gap-3 text-base leading-snug text-ink">
                      <span aria-hidden="true" className="mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full bg-track" />
                      <span>
                        <Inline text={o} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </header>

          <Blocks blocks={m.lesson} />

          <RelatedRow modules={related} />
          <Takeaways cards={m.cards} />
          <FinishRow m={m} anchorRef={finishRef} />
          <NextOnRoute m={m} />
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pb-6">
            <LessonToc items={toc} active={active} variant="rail" />
          </div>
        </aside>
      </div>

      <ReadingDock
        sections={toc.map((t) => ({ id: t.id, title: t.text }))}
        active={active}
        onContents={() => setTocOpen(true)}
        next={next}
      />

      <Sheet open={tocOpen} onClose={() => setTocOpen(false)} labelledBy="toc-title">
        <div className="px-4 pt-1 pb-6 sm:pt-6">
          <div className="px-1 pr-14">
            <h2 id="toc-title" className="text-[1.375rem] leading-tight font-bold">
              Contents
            </h2>
            <p className="mt-1 text-[0.875rem] leading-snug text-ink-2 tabular">
              {toc.length} sections · {m.minutes} min
            </p>
          </div>
          <div className="mt-4">
            <LessonToc items={toc} active={active} variant="sheet" onPick={pick} />
          </div>
        </div>
      </Sheet>
    </div>
  )
}

export function ModuleScreen() {
  const { moduleId } = useParams()
  const m = getModule(moduleId)
  if (!m) {
    return (
      <div>
        <TopBar back={{ label: 'Learn', to: '/learn' }} />
        <div className="mt-6">
          <Empty
            title="No such lesson"
            body="It may have been renamed. Search finds every lesson by its title or contents."
            action={<ButtonLink to="/search">Search</ButtonLink>}
          />
        </div>
      </div>
    )
  }
  // Keyed so a lesson-to-lesson link starts fresh: progress, active heading, place timer.
  return <Lesson key={m.id} m={m} />
}
