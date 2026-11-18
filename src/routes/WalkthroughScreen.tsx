import { useEffect, useMemo, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { getProblem } from '../content'
import { getCategory } from '../content/categories'
import type { RubricRow } from '../content/types'
import { walkthroughSteps } from '../lib/walkthrough'
import { plainText } from '../lib/text'
import { Blocks } from '../components/content/Blocks'
import { Followups } from '../components/content/Followups'
import { Inline } from '../components/content/Inline'
import { Badge, Empty } from '../components/ui/Bits'
import { Button, ButtonLink } from '../components/ui/Button'
import { TopBar } from '../components/ui/TopBar'

const DIFF_TONE = { easy: 'mastered', medium: 'streak', hard: 'alert' } as const
const BARS: { bar: RubricRow['bar']; title: string }[] = [
  { bar: 'must', title: 'The bar' },
  { bar: 'senior', title: 'Senior' },
  { bar: 'staff', title: 'Staff' },
]

/**
 * A model answer, one interview phase at a time. Inside the tab shell on purpose: this
 * is study, not a timed attempt, so wandering off to a lesson and back is fine — `?step=`
 * keeps the place.
 */
export function WalkthroughScreen() {
  const { problemId } = useParams()
  const problem = getProblem(problemId)
  const [params, setParams] = useSearchParams()
  const steps = useMemo(() => (problem ? walkthroughSteps(problem.modelAnswer) : []), [problem])
  const raw = Number(params.get('step') ?? 0)
  const step = Number.isInteger(raw) && raw >= 0 && raw < steps.length ? raw : 0
  const headingRef = useRef<HTMLHeadingElement>(null)
  const stepper = useRef<HTMLOListElement>(null)
  const first = useRef(true)

  // A step change is a page change: back to the top, focus the step's heading, and keep
  // the active chip in view.
  useEffect(() => {
    document.getElementById(`wstep-${step}`)?.scrollIntoView({ inline: 'center', block: 'nearest' })
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

  return (
    <div>
      <TopBar title={plainText(problem.title)} back={{ label: 'Problem', to: `/practice/${problem.id}`, mode: 'link' }} />

      <header className="mt-5">
        <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase">Walkthrough</p>
        <h1 tabIndex={-1} className="mt-1 text-[1.75rem] leading-tight font-semibold outline-none">
          {plainText(problem.title)}
        </h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone={DIFF_TONE[problem.difficulty]}>{problem.difficulty}</Badge>
          <Badge>{getCategory(problem.category)?.title}</Badge>
        </div>
        {step === 0 && (
          <p className="mt-4 rounded-2xl border border-hairline bg-surface p-4 text-[1rem] leading-relaxed">
            <Inline text={problem.brief} />
          </p>
        )}
      </header>

      <nav aria-label="Walkthrough steps" className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-20 -mx-4 mt-5 border-b border-hairline/60 bg-paper/95 py-2 backdrop-blur-md lg:-mx-8">
        <ol ref={stepper} className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:px-8 [&::-webkit-scrollbar]:hidden">
          {steps.map((s, i) => {
            const on = i === step
            const done = i < step
            return (
              <li key={i} id={`wstep-${i}`} className="shrink-0">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={on ? 'step' : undefined}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-[0.8125rem] whitespace-nowrap transition-colors ${
                    on ? 'border-line bg-line-soft font-medium text-line' : 'border-hairline bg-surface text-ink-2 hover:border-line hover:text-ink'
                  }`}
                >
                  <span className="font-mono text-[0.6875rem] text-ink-3 tabular">{done ? <Check size={12} strokeWidth={2.6} aria-hidden="true" className="text-line" /> : i + 1}</span>
                  <span className="max-w-[14rem] truncate">{s.title}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <article className="mt-6 max-w-[44rem]" aria-labelledby="wstep-title">
        <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase tabular">
          Step {step + 1} of {steps.length}
        </p>
        <h2 id="wstep-title" ref={headingRef} tabIndex={-1} className="mt-1 mb-5 text-[1.375rem] leading-snug font-semibold outline-none">
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
              <h2 id="rubric-h" className="text-[1.25rem] font-semibold">
                What the interviewer is scoring
              </h2>
              {BARS.map(({ bar, title }) => {
                const rows = problem.rubric.filter((r) => r.bar === bar)
                if (!rows.length) return null
                return (
                  <div key={bar} className="mt-4">
                    <p className="mb-1.5 font-mono text-[0.6875rem] tracking-[0.12em] text-ink-3 uppercase">{title}</p>
                    <ul className="flex flex-col gap-1.5">
                      {rows.map((r) => (
                        <li key={r.id} className="flex gap-2.5 text-[0.9375rem] leading-relaxed">
                          <Check size={15} strokeWidth={2.4} aria-hidden="true" className="mt-1 shrink-0 text-line" />
                          {plainText(r.criterion)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </section>
          </>
        )}

        <div className="mt-10 flex gap-3 border-t border-hairline pt-5">
          {step > 0 ? (
            <Button variant="secondary" onClick={() => go(step - 1)} className="min-w-0 flex-1 sm:flex-none">
              <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" /> Previous
            </Button>
          ) : (
            <span className="flex-1 sm:flex-none" />
          )}
          {last ? (
            <ButtonLink to={`/practice/${problem.id}`} className="flex-[2] sm:ml-auto sm:flex-none">
              Attempt it on the clock
            </ButtonLink>
          ) : (
            <Button onClick={() => go(step + 1)} className="min-w-0 flex-[2] sm:ml-auto sm:max-w-md sm:flex-none">
              <span className="truncate">Next: {steps[step + 1].title}</span>
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />
            </Button>
          )}
        </div>
      </article>
    </div>
  )
}
