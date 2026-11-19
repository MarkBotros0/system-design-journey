import { useEffect, useMemo, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, SignalHigh, SignalLow, SignalMedium, Timer } from 'lucide-react'
import { getProblem } from '../content'
import { getCategory } from '../content/categories'
import type { RubricRow } from '../content/types'
import { walkthroughSteps } from '../lib/walkthrough'
import { plainText } from '../lib/text'
import { Blocks } from '../components/content/Blocks'
import { Followups } from '../components/content/Followups'
import { Inline } from '../components/content/Inline'
import { Badge, Empty, Eyebrow } from '../components/ui/Bits'
import { Button, ButtonLink } from '../components/ui/Button'
import { TopBar } from '../components/ui/TopBar'
import { useScrolledPast } from '../components/ui/useScrolledPast'

/* Difficulty is a fact about the problem, not an earned state, so it stays neutral and
   says itself with a signal glyph rather than borrowing green / orange / red. */
const DIFFICULTY = {
  easy: { label: 'Easy', icon: SignalLow },
  medium: { label: 'Medium', icon: SignalMedium },
  hard: { label: 'Hard', icon: SignalHigh },
} as const

const BARS: { bar: RubricRow['bar']; title: string }[] = [
  { bar: 'must', title: 'The bar' },
  { bar: 'senior', title: 'Senior' },
  { bar: 'staff', title: 'Staff' },
]

/**
 * A model answer, one interview phase at a time. Inside the tab shell on purpose: this
 * is study, not a timed attempt, so wandering off to a lesson and back is fine — `?step=`
 * keeps the place. The tab bar steps aside for a dock with Back / Next in the thumb zone;
 * the step row at the top is for jumping.
 */
export function WalkthroughScreen() {
  const { problemId } = useParams()
  const problem = getProblem(problemId)
  const [params, setParams] = useSearchParams()
  const steps = useMemo(() => (problem ? walkthroughSteps(problem.modelAnswer) : []), [problem])
  const raw = Number(params.get('step') ?? 0)
  const step = Number.isInteger(raw) && raw >= 0 && raw < steps.length ? raw : 0
  const titleRef = useRef<HTMLHeadingElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const stepper = useRef<HTMLOListElement>(null)
  const first = useRef(true)
  const scrolled = useScrolledPast(titleRef)

  // A step change is a page change: back to the top, focus the step's heading, and keep
  // the active step in view inside its row (scrolling the row, never the page).
  useEffect(() => {
    const row = stepper.current
    const chip = document.getElementById(`wstep-${step}`)
    if (row && chip) row.scrollLeft = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2
    if (first.current) {
      first.current = false
      return
    }
    window.scrollTo(0, 0)
    headingRef.current?.focus({ preventScroll: true })
  }, [step])

  if (!problem) {
    return (
      <div>
        <TopBar back={{ label: 'Practice', to: '/practice' }} />
        <div className="mt-6">
          <Empty title="No such problem" body="It may have been renamed." action={<ButtonLink to="/practice">All problems</ButtonLink>} />
        </div>
      </div>
    )
  }

  const go = (n: number) => setParams(n ? { step: String(n) } : {})
  const current = steps[step]
  const last = step === steps.length - 1
  const diff = DIFFICULTY[problem.difficulty]
  const DiffIcon = diff.icon

  return (
    <div className="lg:pb-16">
      <TopBar title={plainText(problem.title)} showTitle={scrolled} back={{ label: 'Back', to: `/practice/${problem.id}`, mode: 'link' }} />

      <header className="mt-2">
        <Eyebrow>Walkthrough</Eyebrow>
        <h1 ref={titleRef} tabIndex={-1} className="mt-1 text-[1.875rem] leading-[1.12] font-extrabold tracking-[-0.025em] outline-none sm:text-[2.125rem]">
          {plainText(problem.title)}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>
            <DiffIcon size={14} strokeWidth={2.4} aria-hidden="true" /> {diff.label}
          </Badge>
          <Badge>{getCategory(problem.category)?.title}</Badge>
          <Badge>
            <span className="tabular">{steps.length}</span> steps
          </Badge>
        </div>
        {step === 0 && (
          <div className="mt-5 rounded-3xl bg-surface p-5 shadow-[var(--shadow-card)]">
            <p className="text-[0.875rem] font-bold text-ink-2">The prompt</p>
            <p className="mt-1.5 text-[1.0625rem] leading-relaxed text-ink">
              <Inline text={problem.brief} />
            </p>
          </div>
        )}
      </header>

      <nav aria-label="Walkthrough steps" className="mt-6">
        <ol
          ref={stepper}
          className="relative -mx-4 flex gap-2 overflow-x-auto overflow-y-hidden px-4 py-1 [scrollbar-width:none] lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
        >
          {steps.map((s, i) => {
            const on = i === step
            const done = i < step
            return (
              <li key={i} id={`wstep-${i}`} className="shrink-0">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={on ? 'step' : undefined}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full py-1 pr-4 pl-1.5 text-[0.9375rem] font-semibold whitespace-nowrap transition-[background-color,color,transform] duration-150 active:scale-[0.97] motion-reduce:active:scale-100 ${
                    on ? 'bg-line text-line-ink' : 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.8125rem] font-bold tabular ${
                      on ? 'bg-line-ink text-line' : 'bg-surface-3 text-ink-2'
                    }`}
                  >
                    {done ? (
                      <>
                        <Check size={15} strokeWidth={2.8} aria-hidden="true" />
                        <span className="sr-only">{i + 1}, seen:</span>
                      </>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="max-w-[14rem] truncate">{s.title}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <article className="mt-7 max-w-[44rem]" aria-labelledby="wstep-title">
        <p className="text-[0.875rem] font-bold text-ink-2 tabular">
          Step {step + 1} of {steps.length}
        </p>
        <h2 id="wstep-title" ref={headingRef} tabIndex={-1} className="mt-1 mb-5 text-[1.5rem] leading-tight font-bold tracking-[-0.02em] outline-none">
          {current.title}
        </h2>
        <Blocks blocks={current.blocks} />

        {last && (
          <>
            {problem.followups && problem.followups.length > 0 && (
              <div className="mt-10">
                <Followups items={problem.followups} />
              </div>
            )}
            <section aria-labelledby="rubric-h" className="mt-10">
              <h2 id="rubric-h" className="px-1 text-[1.375rem] leading-tight font-bold tracking-[-0.02em]">
                What the interviewer is scoring
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                {BARS.map(({ bar, title }) => {
                  const rows = problem.rubric.filter((r) => r.bar === bar)
                  if (!rows.length) return null
                  return (
                    <div key={bar} className="rounded-[22px] bg-surface px-4 pt-4 pb-3 shadow-[var(--shadow-card)]">
                      <h3 className="flex items-baseline justify-between gap-3 text-base font-bold">
                        {title}
                        <span className="text-[0.875rem] font-semibold text-ink-2 tabular">{rows.length}</span>
                      </h3>
                      <ul className="mt-2 flex flex-col gap-2">
                        {rows.map((r) => (
                          <li key={r.id} className="flex gap-3 text-[0.9375rem] leading-snug text-ink-2">
                            <span aria-hidden="true" className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-ink-3" />
                            {plainText(r.criterion)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </article>

      {/* Back / Next where the tab bar would be. At lg the shell's rail takes the left 16rem. */}
      <div className="pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-40 mx-auto max-w-lg lg:bottom-6 lg:left-[16.75rem]">
        <nav aria-label="Step" className="bar-glass pointer-events-auto flex items-center gap-2 rounded-[26px] p-2 shadow-[var(--shadow-float)]">
          {/* Round, so the forward pill keeps the width for its label. */}
          {step > 0 && (
            <button
              type="button"
              onClick={() => go(step - 1)}
              aria-label={`Back: ${steps[step - 1].title}`}
              title={`Back: ${steps[step - 1].title}`}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-3 text-ink transition-[background-color,transform] duration-150 hover:bg-hairline active:scale-95 motion-reduce:active:scale-100"
            >
              <ArrowLeft size={20} strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}
          {last ? (
            <ButtonLink to={`/practice/${problem.id}`} className="min-h-12 min-w-0 flex-1">
              <Timer size={17} strokeWidth={2.2} aria-hidden="true" className="shrink-0" />
              <span className="truncate">Attempt it on the clock</span>
            </ButtonLink>
          ) : (
            <Button onClick={() => go(step + 1)} className="min-h-12 min-w-0 flex-1">
              <span className="truncate">Next: {steps[step + 1].title}</span>
              <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" className="shrink-0" />
            </Button>
          )}
        </nav>
      </div>
    </div>
  )
}
