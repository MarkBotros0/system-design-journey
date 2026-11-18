import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Filter, Search, Shuffle, X } from 'lucide-react'
import { problems } from '../content'
import { categories } from '../content/categories'
import { getPattern, patterns } from '../content/patterns'
import type { Difficulty, Problem, ProblemKind } from '../content/types'
import { useProgress } from '../state/ProgressProvider'
import { finishedAttempts } from '../lib/attempts'
import { bestCoverage, surpriseMe } from '../lib/readiness'
import { plainText } from '../lib/text'
import { TopBar, PageTitle } from '../components/ui/TopBar'
import { Segmented } from '../components/ui/Segmented'
import { Chip } from '../components/ui/Chip'
import { Badge, Empty } from '../components/ui/Bits'
import { Button } from '../components/ui/Button'
import { Sheet } from '../components/ui/Sheet'
import { useScrolledPast } from '../components/ui/useScrolledPast'

const DIFF_TONE: Record<Difficulty, 'mastered' | 'streak' | 'alert'> = { easy: 'mastered', medium: 'streak', hard: 'alert' }
const DIFFS: Difficulty[] = ['easy', 'medium', 'hard']
type Status = 'all' | 'new' | 'attempted'

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function ProblemCard({ p }: { p: Problem }) {
  const { progress } = useProgress()
  const attempts = finishedAttempts(progress, p.id).length
  const best = bestCoverage(progress, p.id, p)
  const names = p.patterns.map((id) => getPattern(id)?.name).filter(Boolean)
  return (
    <Link
      to={`/practice/${p.id}`}
      className="flex h-full flex-col rounded-2xl border border-hairline bg-surface p-4 transition-colors duration-150 hover:border-line active:bg-surface-2"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge tone={DIFF_TONE[p.difficulty]}>{p.difficulty}</Badge>
        {attempts > 0 && best !== undefined ? (
          <span className="flex items-center gap-1 font-mono text-[0.6875rem] text-ink-2 tabular">
            <Check size={12} strokeWidth={2.6} aria-hidden="true" className="text-mastered" />
            best {Math.round(best * 100)}%
          </span>
        ) : (
          <span className="font-mono text-[0.6875rem] text-ink-3">new</span>
        )}
      </div>
      <h3 className="mt-2.5 text-[1.0625rem] leading-snug font-semibold">{plainText(p.title)}</h3>
      <p className="mt-1 line-clamp-2 text-[0.875rem] leading-relaxed text-ink-2">{plainText(p.brief)}</p>
      {names.length > 0 && <p className="mt-auto pt-2.5 text-[0.75rem] text-ink-3">{names.join(' · ')}</p>}
    </Link>
  )
}

export function PracticeScreen() {
  const { progress } = useProgress()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const kind: ProblemKind = params.get('kind') === 'lld' ? 'lld' : 'hld'
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrolled = useScrolledPast(titleRef)

  const [diffs, setDiffs] = useState<Set<Difficulty>>(new Set())
  const [status, setStatus] = useState<Status>('all')
  const [pattern, setPattern] = useState<string | null>(null)
  const [patternSheet, setPatternSheet] = useState(false)

  const family = kind === 'hld' ? 'system' : 'object'
  const ofKind = useMemo(() => problems.filter((p) => p.kind === kind), [kind])
  const familyPatterns = patterns.filter((p) => p.family === family && ofKind.some((x) => x.patterns.includes(p.id)))
  const attempted = (id: string) => finishedAttempts(progress, id).length > 0

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
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-2 hover:bg-surface-2 hover:text-ink lg:hidden"
          >
            <Search size={19} strokeWidth={2} />
          </Link>
        }
      />
      <PageTitle
        title="Practice"
        titleRef={titleRef}
        sub="Famous interview questions, on a 45-minute clock, graded against what interviewers look for."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        {ofKind.length > 0 && (
          <Button variant="secondary" onClick={() => navigate(`/practice/${surpriseMe(progress, kind).id}`)}>
            <Shuffle size={16} strokeWidth={2} aria-hidden="true" /> Surprise me
          </Button>
        )}
      </div>

      {ofKind.length > 0 && (
        <p className="mt-3 font-mono text-[0.75rem] text-ink-3 tabular">
          {doneCount} of {ofKind.length} attempted
        </p>
      )}

      {ofKind.length === 0 ? (
        <div className="mt-6">
          <Empty title="Nothing here yet" body="These problems are still being written. The system design round has plenty to start with." />
        </div>
      ) : (
        <>
          <div className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-20 -mx-4 mt-3 border-b border-hairline/60 bg-paper/95 py-2 backdrop-blur-md lg:-mx-8">
            <div role="group" aria-label="Filters" className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:px-8 [&::-webkit-scrollbar]:hidden">
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
              <span aria-hidden="true" className="my-2 w-px shrink-0 bg-hairline" />
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
                  <Filter size={14} strokeWidth={2} aria-hidden="true" />
                  {pattern ? getPattern(pattern)?.name : 'Pattern'}
                </Chip>
              )}
              {filtering && (
                <Chip onClick={clear}>
                  <X size={14} strokeWidth={2.2} aria-hidden="true" /> Clear
                </Chip>
              )}
            </div>
            {sections.length > 1 && (
              <div role="group" aria-label="Jump to category" className="mt-1.5 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] lg:px-8 [&::-webkit-scrollbar]:hidden">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      document.getElementById(`cat-${s.id}`)?.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' })
                    }
                    className="min-h-11 shrink-0 rounded-lg px-2.5 text-[0.8125rem] whitespace-nowrap text-ink-2 hover:bg-surface-2 hover:text-ink"
                  >
                    {s.title} <span className="font-mono text-[0.6875rem] text-ink-3">{s.items.length}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="sr-only" aria-live="polite">
            {shown.length} problems shown
          </p>

          {sections.length === 0 ? (
            <div className="mt-6">
              <Empty title="No problem matches every filter" body="Loosen one of them, or clear them all." action={<Button onClick={clear}>Clear filters</Button>} />
            </div>
          ) : (
            sections.map((s) => (
              <section key={s.id} id={`cat-${s.id}`} aria-labelledby={`cat-${s.id}-h`} className="mt-6 scroll-mt-40">
                <h2 id={`cat-${s.id}-h`} className="mb-3 text-[1.125rem] font-semibold">
                  {s.title}
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

          <p className="mt-8 rounded-xl border-l-2 border-line bg-line-soft px-4 py-3 text-[0.875rem] leading-relaxed text-ink">
            Attempt it before you read the walkthrough. Reading a worked answer feels productive and teaches little; the struggle is
            the part that sticks.
          </p>
        </>
      )}

      {patternSheet && (
        <Sheet open onClose={() => setPatternSheet(false)} labelledBy="pattern-sheet-h">
          <div className="px-5 pt-3 pb-5">
            <h2 id="pattern-sheet-h" className="pr-10 text-[1.25rem] font-semibold">
              Filter by pattern
            </h2>
            <p className="mt-1 mb-4 text-[0.875rem] text-ink-2">Practise one shape until you spot it instantly.</p>
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
                      className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-colors ${
                        on ? 'border-line bg-line-soft' : 'border-hairline bg-surface hover:border-line'
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.9375rem] font-medium">{pt.name}</span>
                        <span className="block truncate text-[0.75rem] text-ink-3">{plainText(pt.tell)}</span>
                      </span>
                      <span className="font-mono text-[0.75rem] text-ink-3 tabular">{n}</span>
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
