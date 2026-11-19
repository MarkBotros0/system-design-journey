import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Filter, Lightbulb, Search, Shuffle, Timer, X } from 'lucide-react'
import { getProblem, problems } from '../content'
import { categories } from '../content/categories'
import { phasesFor } from '../content/framework'
import { getPattern, patterns } from '../content/patterns'
import type { Difficulty, ProblemKind } from '../content/types'
import { useProgress } from '../state/ProgressProvider'
import { draftOf, finishedAttempts } from '../lib/attempts'
import { surpriseMe } from '../lib/readiness'
import { plainText } from '../lib/text'
import { TopBar, PageTitle } from '../components/ui/TopBar'
import { Segmented } from '../components/ui/Segmented'
import { Chip, ChipRow } from '../components/ui/Chip'
import { Empty } from '../components/ui/Bits'
import { Button } from '../components/ui/Button'
import { Cell, Group } from '../components/ui/List'
import { Sheet } from '../components/ui/Sheet'
import { useScrolledPast } from '../components/ui/useScrolledPast'
import { ProblemCard } from '../components/practice/ProblemCard'
import { draftMinutes, draftWhere } from '../components/practice/problemMeta'

const DIFFS: Difficulty[] = ['easy', 'medium', 'hard']
type Status = 'all' | 'new' | 'attempted'

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Clears the sticky top bar and the sticky category row when a shelf is jumped to. */
const SHELF_MARGIN = { scrollMarginTop: 'calc(env(safe-area-inset-top) + 7.5rem)' }

export function PracticeScreen() {
  const { progress } = useProgress()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const kind: ProblemKind = params.get('kind') === 'lld' ? 'lld' : 'hld'
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrolled = useScrolledPast(titleRef)
  const jumpRef = useRef<HTMLDivElement>(null)
  // The category row turns to glass only once it is pinned under the top bar.
  const jumpStuck = useScrolledPast(jumpRef, 57)

  const [diffs, setDiffs] = useState<Set<Difficulty>>(new Set())
  const [status, setStatus] = useState<Status>('all')
  const [pattern, setPattern] = useState<string | null>(null)
  const [patternSheet, setPatternSheet] = useState(false)

  const family = kind === 'hld' ? 'system' : 'object'
  const ofKind = useMemo(() => problems.filter((p) => p.kind === kind), [kind])
  const familyPatterns = patterns.filter((p) => p.family === family && ofKind.some((x) => x.patterns.includes(p.id)))
  const attempted = (id: string) => finishedAttempts(progress, id).length > 0

  // Unfinished timed attempts, newest first, whatever the round: the thing you were doing.
  const drafts = [...new Set(progress.attempts.filter((a) => !a.finishedAt).map((a) => a.problemId))]
    .map((id) => ({ problem: getProblem(id), draft: draftOf(progress, id) }))
    .filter((d) => d.problem && d.draft)
    .sort((a, b) => b.draft!.startedAt - a.draft!.startedAt)

  const shown = ofKind.filter(
    (p) =>
      (!diffs.size || diffs.has(p.difficulty)) &&
      (status === 'all' || (status === 'new' ? !attempted(p.id) : attempted(p.id))) &&
      (!pattern || p.patterns.includes(pattern)),
  )
  const sections = categories
    .filter((c) => c.kind === kind)
    .map((c) => ({ ...c, items: shown.filter((p) => p.category === c.id) }))
    .filter((c) => c.items.length)
  const filtering = diffs.size > 0 || status !== 'all' || !!pattern
  const doneCount = ofKind.filter((p) => attempted(p.id)).length

  // Which shelf is under the pinned category row, so the row can say where you are.
  const shelfIds = sections.map((s) => s.id).join(' ')
  const [inShelf, setInShelf] = useState<string | null>(null)
  useEffect(() => {
    const ids = shelfIds.split(' ').filter(Boolean)
    let frame = 0
    const measure = () => {
      frame = 0
      let current: string | null = null
      for (const id of ids) {
        const top = document.getElementById(`cat-${id}`)?.getBoundingClientRect().top
        if (top !== undefined && top <= 140) current = id
      }
      setInShelf(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [shelfIds])

  // Keep the current shelf's button in view inside its own row — never by scrolling the page.
  const jumpRowRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const row = jumpRowRef.current
    const btn = inShelf ? row?.querySelector<HTMLElement>(`[data-shelf="${inShelf}"]`) : null
    if (!row || !btn) return
    row.scrollTo({ left: btn.offsetLeft - (row.clientWidth - btn.offsetWidth) / 2, behavior: reduceMotion() ? 'auto' : 'smooth' })
  }, [inShelf])

  function clear() {
    setDiffs(new Set())
    setStatus('all')
    setPattern(null)
  }

  function switchKind(k: ProblemKind) {
    clear()
    setParams(k === 'hld' ? {} : { kind: k }, { replace: true })
  }

  return (
    <div>
      <TopBar
        title="Practice"
        showTitle={scrolled}
        right={
          <Link
            to="/search"
            aria-label="Search"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink transition-colors duration-150 hover:bg-surface-3 lg:hidden"
          >
            <Search size={18} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        }
      />
      <PageTitle
        title="Practice"
        titleRef={titleRef}
        sub="Famous interview questions, on a 45-minute clock, graded against what interviewers look for."
      />

      {drafts.length > 0 && (
        <Group title="Resume attempt" className="mb-7">
          {drafts.map(({ problem, draft }) => (
            <Cell
              key={problem!.id}
              to={`/practice/${problem!.id}`}
              leading={
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-streak-soft text-streak">
                  <Timer size={21} strokeWidth={2.2} aria-hidden="true" />
                </span>
              }
              title={plainText(problem!.title)}
              sub={
                <>
                  {draftWhere(draft!, phasesFor(problem!.kind))} <span className="whitespace-nowrap">· {draftMinutes(draft!)} min in</span>
                </>
              }
            />
          ))}
        </Group>
      )}

      <div className="sm:w-96">
        <Segmented<ProblemKind>
          label="Round"
          value={kind}
          onChange={switchKind}
          options={[
            { value: 'hld', label: 'System design' },
            { value: 'lld', label: 'OOP / low-level' },
          ]}
        />
      </div>

      {ofKind.length === 0 ? (
        <div className="mt-6">
          <Empty title="Nothing here yet" body="These problems are still being written. The system design round has plenty to start with." />
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[0.9375rem] text-ink-2 tabular">
              <span className="font-bold text-ink">{doneCount}</span> of {ofKind.length} attempted
            </p>
            <Button variant="secondary" onClick={() => navigate(`/practice/${surpriseMe(progress, kind).id}`)}>
              <Shuffle size={16} strokeWidth={2.2} aria-hidden="true" /> Surprise me
            </Button>
          </div>

          <div className="mt-4">
            <ChipRow label="Filters">
              {DIFFS.map((d) => (
                <Chip
                  key={d}
                  active={diffs.has(d)}
                  pressed={diffs.has(d)}
                  onClick={() =>
                    setDiffs((s) => {
                      const n = new Set(s)
                      if (n.has(d)) n.delete(d)
                      else n.add(d)
                      return n
                    })
                  }
                >
                  {d[0].toUpperCase() + d.slice(1)}
                </Chip>
              ))}
              {/* Divides the two kinds of filter: difficulty, then where you stand. */}
              <span aria-hidden="true" className="my-2.5 w-px shrink-0 bg-hairline" />
              <Chip active={status === 'new'} pressed={status === 'new'} onClick={() => setStatus(status === 'new' ? 'all' : 'new')}>
                New
              </Chip>
              <Chip
                active={status === 'attempted'}
                pressed={status === 'attempted'}
                onClick={() => setStatus(status === 'attempted' ? 'all' : 'attempted')}
              >
                Attempted
              </Chip>
              {familyPatterns.length > 0 && (
                <Chip active={!!pattern} onClick={() => setPatternSheet(true)}>
                  <Filter size={15} strokeWidth={2.2} aria-hidden="true" />
                  {pattern ? getPattern(pattern)?.name : 'Pattern'}
                </Chip>
              )}
              {filtering && (
                <Chip onClick={clear}>
                  <X size={15} strokeWidth={2.4} aria-hidden="true" /> Clear
                </Chip>
              )}
            </ChipRow>
          </div>

          <div ref={jumpRef} aria-hidden="true" />
          {sections.length > 1 && (
            <div
              className={`sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-20 -mx-4 mt-1 transition-[background-color,box-shadow] duration-200 lg:-mx-8 ${
                jumpStuck ? 'bar-glass shadow-[0_1px_0_var(--hairline)]' : 'bg-paper'
              }`}
            >
              <div
                ref={jumpRowRef}
                role="group"
                aria-label="Jump to category"
                className="relative flex gap-1 overflow-x-auto overflow-y-hidden px-3 py-1 [scrollbar-width:none] lg:px-7 [&::-webkit-scrollbar]:hidden"
              >
                {sections.map((s) => {
                  const here = jumpStuck && inShelf === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      data-shelf={s.id}
                      aria-current={here ? 'location' : undefined}
                      onClick={() =>
                        document.getElementById(`cat-${s.id}`)?.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' })
                      }
                      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors duration-150 ${
                        here ? 'bg-surface-3 text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                      }`}
                    >
                      {s.title}
                      <span className={`font-medium tabular ${here ? 'text-ink-2' : 'text-ink-3'}`}>{s.items.length}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <p className="sr-only" aria-live="polite">
            {shown.length} problems shown
          </p>

          {sections.length === 0 ? (
            <div className="mt-6">
              <Empty title="No problem matches every filter" body="Loosen one of them, or clear them all." action={<Button onClick={clear}>Clear filters</Button>} />
            </div>
          ) : (
            sections.map((s) => (
              <section key={s.id} id={`cat-${s.id}`} aria-labelledby={`cat-${s.id}-h`} className="mt-6" style={SHELF_MARGIN}>
                <h2 id={`cat-${s.id}-h`} className="mb-3 flex items-baseline gap-2 px-1 text-[1.25rem] font-bold">
                  {s.title}
                  <span className="text-[0.9375rem] font-semibold text-ink-3 tabular">{s.items.length}</span>
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {s.items.map((p) => (
                    <li key={p.id}>
                      <ProblemCard p={p} />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}

          <div className="mt-10 flex gap-3 rounded-[22px] bg-surface-2 p-4">
            <Lightbulb size={20} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-2" />
            <p className="text-[0.9375rem] leading-relaxed text-ink-2">
              <strong className="font-bold text-ink">Attempt it before you read the walkthrough.</strong> Reading a worked answer feels
              productive and teaches little; the struggle is the part that sticks.
            </p>
          </div>
        </>
      )}

      {patternSheet && (
        <Sheet open onClose={() => setPatternSheet(false)} labelledBy="pattern-sheet-h">
          <div className="px-5 pt-1 pb-5">
            <h2 id="pattern-sheet-h" className="pr-12 text-[1.5rem] leading-tight font-extrabold tracking-[-0.02em]">
              Filter by pattern
            </h2>
            <p className="mt-1.5 mb-4 text-[0.9375rem] text-ink-2">Practise one shape until you spot it instantly.</p>
            <ul className="flex flex-col gap-1.5">
              {familyPatterns.map((pt) => {
                const on = pt.id === pattern
                const n = ofKind.filter((x) => x.patterns.includes(pt.id)).length
                return (
                  <li key={pt.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setPattern(on ? null : pt.id)
                        setPatternSheet(false)
                      }}
                      className={`flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left transition-colors duration-150 ${
                        on ? 'bg-surface-3' : 'bg-surface-2 hover:bg-surface-3'
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-semibold">{pt.name}</span>
                        <span className="block truncate text-[0.875rem] text-ink-2">{plainText(pt.tell)}</span>
                      </span>
                      <span className="text-[0.9375rem] font-semibold text-ink-3 tabular">{n}</span>
                      {on && <Check size={18} strokeWidth={2.6} aria-hidden="true" className="shrink-0" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </Sheet>
      )}
    </div>
  )
}
