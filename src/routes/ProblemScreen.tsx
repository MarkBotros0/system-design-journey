import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Check, SkipForward, X } from 'lucide-react'
import { getProblem } from '../content'
import { PHASES, TOTAL_MINUTES } from '../content/framework'
import { useProgress } from '../state/ProgressProvider'
import type { ProblemAttempt } from '../lib/storage'
import type { RubricRow } from '../content/types'
import { Blocks } from '../components/content/Blocks'
import { Inline } from '../components/content/Inline'
import { Button, ButtonLink } from '../components/ui/Button'
import { Badge, Meter } from '../components/ui/Bits'

type Stage = 'brief' | 'running' | 'grading' | 'done'

function mmss(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const BAR_LABEL: Record<RubricRow['bar'], { title: string; note: string }> = {
  must: { title: 'The bar', note: 'Miss these and the design does not stand up.' },
  senior: { title: 'Senior', note: 'What you are expected to raise without being asked.' },
  staff: { title: 'Staff', note: 'Above the line you are aiming at. Bonus, not failure.' },
}

export function ProblemScreen() {
  const { problemId } = useParams()
  const problem = getProblem(problemId)
  const { saveAttempt } = useProgress()

  const [stage, setStage] = useState<Stage>('brief')
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [phaseSeconds, setPhaseSeconds] = useState<Record<string, number>>({})
  const [scored, setScored] = useState<Record<string, boolean>>({})
  const [tick, setTick] = useState(0)

  const attemptId = useRef(`a-${Date.now()}`)
  const startedAt = useRef(0)
  const phaseStartedAt = useRef(0)

  // One interval for the whole run; `tick` just forces the countdown to repaint.
  useEffect(() => {
    if (stage !== 'running') return
    const id = setInterval(() => setTick((n) => n + 1), 500)
    return () => clearInterval(id)
  }, [stage])

  const phase = PHASES[phaseIndex]
  const elapsedInPhase = stage === 'running' ? (Date.now() - phaseStartedAt.current) / 1000 : 0
  const remaining = phase ? phase.minutes * 60 - elapsedInPhase : 0
  const totalElapsed = stage === 'running' ? (Date.now() - startedAt.current) / 1000 : 0
  void tick

  if (!problem) return <Navigate to="/practice" replace />

  function start() {
    const now = Date.now()
    startedAt.current = now
    phaseStartedAt.current = now
    setStage('running')
  }

  function commitPhase() {
    const spent = (Date.now() - phaseStartedAt.current) / 1000
    setPhaseSeconds((prev) => ({ ...prev, [phase.id]: Math.round(spent) }))
    phaseStartedAt.current = Date.now()
  }

  function nextPhase() {
    commitPhase()
    if (phaseIndex < PHASES.length - 1) setPhaseIndex((i) => i + 1)
    else setStage('grading')
  }

  function finishEarly() {
    commitPhase()
    setStage('grading')
  }

  function saveAndFinish() {
    const attempt: ProblemAttempt = {
      id: attemptId.current,
      problemId: problem!.id,
      startedAt: startedAt.current || Date.now(),
      finishedAt: Date.now(),
      notes,
      phaseSeconds,
      scored,
    }
    saveAttempt(attempt)
    setStage('done')
  }

  const grouped = useMemo(() => {
    const bars: RubricRow['bar'][] = ['must', 'senior', 'staff']
    return bars
      .map((bar) => ({ bar, rows: problem!.rubric.filter((r) => r.bar === bar) }))
      .filter((g) => g.rows.length > 0)
  }, [problem])

  /* ---------------------------------------------------------------- */

  if (stage === 'brief') {
    return (
      <div className="mx-auto max-w-lg px-4 pt-screen pb-10">
        <Link
          to="/practice"
          className="-ml-1 mb-6 inline-flex min-h-11 items-center gap-1.5 pr-2 text-[0.875rem] text-ink-2 hover:text-ink"
        >
          <X size={16} strokeWidth={2} />
          Practice
        </Link>

        <Badge tone={problem.difficulty === 'easy' ? 'mastered' : problem.difficulty === 'medium' ? 'streak' : 'alert'}>
          {problem.difficulty}
        </Badge>
        <h1 className="mt-3 text-[1.875rem] leading-tight font-semibold">{problem.title}</h1>

        <div className="mt-5 rounded-2xl border border-hairline bg-surface p-4">
          <p className="mb-2 font-mono text-[0.6875rem] tracking-[0.12em] uppercase text-ink-3">
            The prompt
          </p>
          <p className="text-[1.0625rem] leading-relaxed">
            <Inline text={problem.brief} />
          </p>
        </div>

        <div className="mt-5 rounded-xl border-l-2 border-line bg-line-soft px-4 py-3">
          <p className="text-[0.875rem] leading-relaxed text-ink">
            {TOTAL_MINUTES} minutes, six phases, notes as you go. Say it out loud as you type —
            the speaking is the part you are training. The model answer stays hidden until you
            finish.
          </p>
        </div>

        <div className="mt-7">
          <Button size="lg" onClick={start}>
            Start the clock
          </Button>
        </div>
      </div>
    )
  }

  if (stage === 'running') {
    const over = remaining < 0
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-screen pb-6">
        <header className="mb-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-ink-3">
              Phase {phaseIndex + 1} of {PHASES.length}
            </span>
            <span className="font-mono text-[0.75rem] text-ink-3 tabular">
              {mmss(totalElapsed)} / {TOTAL_MINUTES}:00
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <h1 className="text-[1.375rem] font-semibold">
              {phase.name}
              {phase.optional && (
                <span className="ml-2 font-mono text-[0.6875rem] font-normal text-ink-3 uppercase">
                  optional
                </span>
              )}
            </h1>
            <span
              className={`font-mono text-[1.375rem] font-semibold tabular ${over ? 'text-alert' : 'text-line'}`}
            >
              {over ? `+${mmss(-remaining)}` : mmss(remaining)}
            </span>
          </div>

          <div className="mt-3">
            <Meter
              value={Math.min(1, elapsedInPhase / (phase.minutes * 60))}
              tone={over ? 'alert' : 'line'}
              label={`${phase.name} time used`}
            />
          </div>
        </header>

        <p className="mb-4 rounded-xl bg-surface-2 px-4 py-3 text-[0.875rem] leading-relaxed text-ink-2">
          {phase.prompt}
        </p>

        <textarea
          value={notes[phase.id] ?? ''}
          onChange={(e) => setNotes((prev) => ({ ...prev, [phase.id]: e.target.value }))}
          placeholder="Notes for this phase…"
          aria-label={`Notes for ${phase.name}`}
          className="min-h-40 flex-1 resize-none rounded-2xl border border-hairline bg-surface p-4 font-mono text-[0.875rem] leading-relaxed text-ink placeholder:text-ink-3 focus:border-line focus:outline-none"
        />

        <div className="mt-4 flex gap-2.5">
          <Button onClick={nextPhase} className="flex-1">
            {phaseIndex === PHASES.length - 1 ? 'Finish' : 'Next phase'}
          </Button>
          {phase.optional && phaseIndex < PHASES.length - 1 && (
            <Button variant="secondary" onClick={nextPhase} aria-label="Skip this phase">
              <SkipForward size={16} strokeWidth={2} />
              Skip
            </Button>
          )}
        </div>
        <button
          onClick={finishEarly}
          className="mt-3 min-h-11 text-[0.8125rem] text-ink-3 hover:text-ink"
        >
          Stop and grade now
        </button>
      </div>
    )
  }

  if (stage === 'grading') {
    const hit = Object.values(scored).filter(Boolean).length
    return (
      <div className="mx-auto max-w-lg px-4 pt-screen pb-10">
        <h1 className="text-[1.75rem] leading-tight font-semibold">The answer</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-2">
          Read it against your notes, then tick what you genuinely covered. Honest ticks are the
          only kind worth having.
        </p>

        <div className="mt-7">
          <Blocks blocks={problem.modelAnswer} />
        </div>

        <section className="mt-10 border-t border-hairline pt-7">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h2 className="text-[1.25rem] font-semibold">Score yourself</h2>
            <span className="font-mono text-[0.875rem] text-line tabular">
              {hit}/{problem.rubric.length}
            </span>
          </div>

          {grouped.map((group) => (
            <div key={group.bar} className="mt-5">
              <p className="font-mono text-[0.6875rem] tracking-[0.12em] uppercase text-ink-3">
                {BAR_LABEL[group.bar].title}
              </p>
              <p className="mt-0.5 mb-2.5 text-[0.8125rem] text-ink-3">
                {BAR_LABEL[group.bar].note}
              </p>
              <ul className="flex flex-col gap-1.5">
                {group.rows.map((row) => {
                  const on = !!scored[row.id]
                  return (
                    <li key={row.id}>
                      <label
                        className={`flex min-h-13 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors duration-150 ${
                          on ? 'border-mastered bg-mastered-soft' : 'border-hairline bg-surface'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => setScored((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                            on ? 'border-mastered bg-mastered text-paper' : 'border-hairline'
                          }`}
                        >
                          {on && <Check size={13} strokeWidth={3} />}
                        </span>
                        <span className="text-[0.9375rem] leading-relaxed">{row.criterion}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          <div className="mt-8">
            <Button size="lg" onClick={saveAndFinish}>
              Save this attempt
            </Button>
          </div>
        </section>
      </div>
    )
  }

  /* done */
  const hit = Object.values(scored).filter(Boolean).length
  const mustRows = problem.rubric.filter((r) => r.bar === 'must')
  const mustHit = mustRows.filter((r) => scored[r.id]).length
  const seniorRows = problem.rubric.filter((r) => r.bar === 'senior')
  const seniorHit = seniorRows.filter((r) => scored[r.id]).length

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 pt-screen pb-10">
      <p className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-ink-3">
        {problem.title}
      </p>
      <h1 className="mt-2 text-[2rem] leading-tight font-semibold">
        {hit} of {problem.rubric.length}
      </h1>

      <dl className="mt-6 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[0.9375rem] text-ink-2">The bar</dt>
          <dd className="font-mono text-[0.9375rem] tabular">
            {mustHit}/{mustRows.length}
          </dd>
        </div>
        <Meter value={mustRows.length ? mustHit / mustRows.length : 0} tone="mastered" label="Bar criteria met" />
        <div className="mt-2 flex items-center justify-between gap-4">
          <dt className="text-[0.9375rem] text-ink-2">Senior</dt>
          <dd className="font-mono text-[0.9375rem] tabular">
            {seniorHit}/{seniorRows.length}
          </dd>
        </div>
        <Meter value={seniorRows.length ? seniorHit / seniorRows.length : 0} label="Senior criteria met" />
      </dl>

      <p className="mt-6 text-[0.9375rem] leading-relaxed text-ink-2">
        {mustHit < mustRows.length
          ? 'Work the bar criteria you missed before adding depth — a design with a hole in it does not get rescued by a good deep dive.'
          : seniorHit < seniorRows.length / 2
            ? 'The design stands up. The gap is depth: pick two of the senior criteria you missed and run this again in a few days.'
            : 'Strong. Run it again cold in a week and see whether it holds without the answer fresh in mind.'}
      </p>

      <div className="mt-8 flex flex-col gap-2.5">
        <ButtonLink to="/practice" size="lg">
          Back to practice
        </ButtonLink>
        <ButtonLink to="/you" variant="secondary" size="lg">
          See your attempts
        </ButtonLink>
      </div>
    </div>
  )
}
