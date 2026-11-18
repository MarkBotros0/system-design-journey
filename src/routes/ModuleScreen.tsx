import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Check, Clock, Flag, Target } from 'lucide-react'
import { getModule, getProblem, getRoute, getTrack, modulesOfTrack, relatedOf, stopTitle } from '../content'
import type { Module, RouteStop } from '../content/types'
import { useProgress } from '../state/ProgressProvider'
import { hasReadLesson, isPassed, moduleStatus, quizPassed, QUIZ_PASS, stopAfter, stopBefore } from '../lib/progress'
import { headingSlugs } from '../lib/slug'
import { plainText } from '../lib/text'
import { Blocks } from '../components/content/Blocks'
import { Inline } from '../components/content/Inline'
import { Button, ButtonLink, IconButton } from '../components/ui/Button'
import { Badge, Empty } from '../components/ui/Bits'
import { TopBar } from '../components/ui/TopBar'
import { useScrolledPast } from '../components/ui/useScrolledPast'
import { LessonToc, type TocItem } from '../components/lesson/LessonToc'
import { Takeaways } from '../components/lesson/Takeaways'
import { RelatedRow } from '../components/lesson/RelatedRow'
import { useLessonScroll } from '../components/lesson/useLessonScroll'

const PLACE_EVERY_MS = 2000

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

function FinishRow({ m }: { m: Module }) {
  const { progress, markLessonRead } = useProgress()
  const navigate = useNavigate()
  const read = hasReadLesson(progress, m.id)
  const passed = quizPassed(progress, m.id)
  const best = progress.quiz[m.id]?.best

  return (
    <section aria-labelledby="finish-h" className="mt-10 rounded-2xl border border-hairline bg-surface p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
      <h2 id="finish-h" className="text-[1.125rem] font-semibold">
        {!read ? 'Check it stuck' : passed ? 'Passed' : 'Now the quiz'}
      </h2>
      {!read ? (
        <>
          <p className="mt-1 text-[0.9375rem] text-ink-2">
            Three questions, {Math.round(QUIZ_PASS * 100)}% to pass. The explanations are where the learning is.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
          <p className="mt-1 flex items-start gap-2 text-[0.9375rem] text-ink-2">
            <Check size={17} strokeWidth={2.5} aria-hidden="true" className="mt-0.5 shrink-0 text-mastered" />
            <span>
              Read.{' '}
              {passed
                ? `Quiz passed at ${Math.round((best ?? 0) * 100)}%.`
                : best !== undefined
                  ? `Best quiz score ${Math.round(best * 100)}% — ${Math.round(QUIZ_PASS * 100)}% passes.`
                  : 'The quiz is three questions.'}
            </span>
          </p>
          <ButtonLink to={`/m/${m.id}/quiz`} size="lg" variant={passed ? 'secondary' : 'primary'} className="mt-4">
            {best === undefined ? 'Take the quiz' : passed ? 'Retake the quiz' : 'Try again'}
          </ButtonLink>
        </>
      )}
      {m.cards.length > 0 && (
        <p className="mt-4 text-[0.8125rem] text-ink-3">
          {read
            ? `${m.cards.length} review card${m.cards.length === 1 ? '' : 's'} from this lesson ${m.cards.length === 1 ? 'is' : 'are'} in your deck.`
            : `${m.cards.length} review card${m.cards.length === 1 ? '' : 's'} from this lesson join your deck once it is read.`}
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

  return (
    <>
      {next && (
        <section aria-labelledby="next-h" className="mt-10">
          <h2 id="next-h" className="mb-3 font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase">
            Next on {on}
          </h2>
          <Link
            to={stopHref(next)}
            className="flex items-center gap-4 rounded-2xl bg-line px-5 py-4 text-line-ink transition-opacity hover:opacity-95"
          >
            <span className="min-w-0 flex-1">
              {problem && (
                <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-[0.12em] uppercase opacity-85">
                  <Flag size={12} strokeWidth={2.5} aria-hidden="true" /> Checkpoint · 45 min
                </span>
              )}
              <span className="block text-[1.0625rem] leading-snug font-semibold">{plainText(stopTitle(next))}</span>
              {nextModule && <span className="mt-0.5 line-clamp-1 block text-[0.8125rem] opacity-85">{plainText(nextModule.summary)}</span>}
            </span>
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden="true" className="shrink-0" />
          </Link>
        </section>
      )}
      {/* The way forward is the card above; this row only offers the way back. A second
          "Next" here would point at the same stop. */}
      {prev && (
        <nav aria-label="Previous" className={next ? 'mt-4' : 'mt-10'}>
          <Link
            to={stopHref(prev)}
            className="flex min-h-14 items-center gap-3 rounded-2xl border border-hairline px-4 py-3 hover:border-line"
          >
            <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" className="shrink-0 text-ink-3" />
            <span className="min-w-0 flex-1">
              <span className="block text-[0.75rem] text-ink-3">Previous</span>
              <span className="line-clamp-2 text-[0.875rem] leading-snug font-medium">{plainText(stopTitle(prev))}</span>
            </span>
          </Link>
        </nav>
      )}
    </>
  )
}

function Lesson({ m }: { m: Module }) {
  const { progress, toggleBookmark, setPlace } = useProgress()
  const track = getTrack(m.trackId)
  const status = moduleStatus(progress, m)
  const bookmarked = progress.bookmarks.includes(m.id)

  const articleRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrolled = useScrolledPast(titleRef)

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

  const prereqs = m.prereqs.map((id) => getModule(id)).filter((x): x is Module => !!x)
  const related = relatedOf(m.id)

  return (
    <div>
      <TopBar
        title={plainText(m.title)}
        showTitle={scrolled}
        back={{ label: track?.title ?? 'Learn', to: `/learn/${m.trackId}` }}
        progress={read}
        right={
          <IconButton
            label={bookmarked ? 'Remove bookmark' : 'Bookmark this lesson'}
            aria-pressed={bookmarked}
            onClick={() => toggleBookmark(m.id)}
            className={bookmarked ? 'text-line' : ''}
          >
            {bookmarked ? <BookmarkCheck size={19} strokeWidth={2} /> : <Bookmark size={19} strokeWidth={2} />}
          </IconButton>
        }
      />

      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_13rem] xl:gap-12">
        <article ref={articleRef} className="max-w-[44rem] min-w-0">
          <header className="mt-5 mb-6">
            <Link
              to={`/learn/${m.trackId}`}
              className="inline-flex min-h-8 items-center font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase hover:text-line"
            >
              {track?.title} · {String(m.station).padStart(2, '0')}
            </Link>
            <h1 ref={titleRef} tabIndex={-1} className="mt-1 text-[1.75rem] leading-tight font-semibold outline-none sm:text-[2rem]">
              {plainText(m.title)}
            </h1>
            <p className="mt-2 text-[1rem] leading-relaxed text-ink-2">{plainText(m.summary)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 font-mono text-[0.75rem] text-ink-3">
                <Clock size={13} strokeWidth={2} aria-hidden="true" />
                {m.minutes} min
              </span>
              {status === 'mastered' && <Badge tone="mastered">Mastered</Badge>}
              {status === 'passed' && <Badge tone="line">Passed</Badge>}
              {status === 'started' && <Badge tone="streak">In progress</Badge>}
            </div>

            {prereqs.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <span className="mr-0.5 text-[0.8125rem] text-ink-3">Builds on</span>
                {prereqs.map((p) => {
                  const done = isPassed(progress, p.id)
                  return (
                    <Link
                      key={p.id}
                      to={`/m/${p.id}`}
                      className="inline-flex min-h-9 items-center gap-1 rounded-full border border-hairline bg-surface px-3 text-[0.8125rem] text-ink-2 hover:border-line hover:text-ink"
                    >
                      {done && <Check size={13} strokeWidth={2.6} aria-hidden="true" className="text-mastered" />}
                      {plainText(p.title)}
                      {done && <span className="sr-only">(passed)</span>}
                    </Link>
                  )
                })}
              </div>
            )}

            {m.objectives && m.objectives.length > 0 && (
              <div className="mt-5 rounded-2xl border border-hairline bg-surface p-4">
                <p className="mb-2 flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase">
                  <Target size={13} strokeWidth={2} aria-hidden="true" /> You will be able to
                </p>
                <ul className="flex flex-col gap-1.5">
                  {m.objectives.map((o, i) => (
                    <li key={i} className="flex gap-2.5 text-[0.9375rem] leading-snug">
                      <Check size={15} strokeWidth={2.4} aria-hidden="true" className="mt-0.5 shrink-0 text-line" />
                      <span>
                        <Inline text={o} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </header>

          <div className="mb-7 xl:hidden">
            <LessonToc items={toc} active={active} variant="inline" />
          </div>

          <Blocks blocks={m.lesson} />

          <RelatedRow modules={related} />
          <Takeaways cards={m.cards} />
          <FinishRow m={m} />
          <NextOnRoute m={m} />
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pb-6">
            <LessonToc items={toc} active={active} variant="rail" />
          </div>
        </aside>
      </div>
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
