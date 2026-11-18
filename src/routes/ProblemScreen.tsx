import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, BookOpen, Check, MessageSquareQuote, SkipForward, X } from 'lucide-react'
import { getModule, getProblem, problems } from '../content'
import { phasesFor, TOTAL_MINUTES } from '../content/framework'
import { getCategory } from '../content/categories'
import type { Problem, RubricRow } from '../content/types'
import { useProgress } from '../state/ProgressProvider'
import type { ProblemAttempt } from '../lib/storage'
import { isPassed } from '../lib/progress'
import { attemptCoverage, bestCoverage, surpriseMe } from '../lib/readiness'
import { plainText } from '../lib/text'
import { Blocks } from '../components/content/Blocks'
import { Inline } from '../components/content/Inline'
import { Button, ButtonLink } from '../components/ui/Button'
import { Badge, Meter } from '../components/ui/Bits'

type Stage = 'brief' | 'running' | 'grading' | 'done'

const DIFF_TONE = { easy: 'mastered', medium: 'streak', hard: 'alert' } as const

function mmss(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const BAR_LABEL: Record<RubricRow['bar'], { title: string; note: string }> = {
  must: { title: 'The bar', note: 'Miss these and the design does not stand up.' },
  senior: { title: 'Senior', note: 'What you are expected to raise without being asked.' },
  staff: { title: 'Staff', note: 'Above the line you are aiming at. Bonus, not failure.' },
}

/** The focus-mode frame: no tab bar, one exit. */
function Frame({ children, onClose, closeLabel = 'Practice' }: { children: React.ReactNode; onClose?: () => void; closeLabel?: string }) {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-2xl px-4 pt-screen pb-10">
      <button
        type="button"
        onClick={onClose ?? (() => navigate('/practice'))}
        className="-ml-2 mb-5 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-[0.875rem] text-ink-2 hover:bg-surface-2 hover:text-ink"
      >
        <X size={17} strokeWidth={2} aria-hidden="true" />
        {closeLabel}
      </button>
      {children}
    </div>
  )
}

function BriefStage({ problem, onStart }: { problem: Problem; onStart: () => void }) {
  const { progress } = useProgress()
  const [confirmStudy, setConfirmStudy] = useState(false)
  const attempts = progress.attempts.filter((a) => a.problemId === problem.id).length
  const best = bestCoverage(progress, problem.id, problem)
  const phases = phasesFor(problem.kind)
  const suggested = problem.suggests.map((id) => getModule(id)).filter((m) => !!m)

  return (
    <Frame>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={DIFF_TONE[problem.difficulty]}>{problem.difficulty}</Badge>
        <Badge>{getCategory(problem.category)?.title}</Badge>
        <Badge>{problem.kind === 'lld' ? 'Low-level design' : 'System design'}</Badge>
      </div>
      <h1 className="mt-3 text-[1.875rem] leading-tight font-semibold">{plainText(problem.title)}</h1>
      {attempts > 0 && best !== undefined && (
        <p className="mt-1 font-mono text-[0.75rem] text-ink-3 tabular">
          {attempts} attempt{attempts === 1 ? '' : 's'} · best {Math.round(best * 100)}%
        </p>
      )}

      <div className="mt-5 rounded-2xl border border-hairline bg-surface p-4">
        <p className="mb-2 font-mono text-[0.6875rem] tracking-[0.12em] text-ink-3 uppercase">The prompt</p>
        <p className="text-[1.0625rem] leading-relaxed">
          <Inline text={problem.brief} />
        </p>
      </div>

      <ol className="mt-5 flex flex-wrap gap-1.5" aria-label="Phases">
        {phases.map((ph, i) => (
          <li key={ph.id} className="rounded-full bg-surface-2 px-2.5 py-1 font-mono text-[0.6875rem] text-ink-2">
            {i + 1}. {ph.name} · {ph.minutes}m
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-2">
        {TOTAL_MINUTES} minutes. Say it out loud as you type — speaking is the part you are training. The interviewer&rsquo;s follow-up
        questions arrive near the end.
      </p>

      {suggested.length > 0 && (
        <details className="group mt-5 rounded-2xl border border-hairline bg-surface">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-[0.9375rem] font-medium [&::-webkit-details-marker]:hidden">
            <BookOpen size={16} strokeWidth={1.9} aria-hidden="true" className="text-line" />
            <span className="flex-1">Worth knowing first</span>
            <span className="font-mono text-[0.75rem] text-ink-3 tabular">
              {suggested.filter((m) => isPassed(progress, m!.id)).length}/{suggested.length} done
            </span>
          </summary>
          <ul className="border-t border-hairline px-2 py-1.5">
            {suggested.map((m) => (
              <li key={m!.id}>
                <Link to={`/m/${m!.id}`} className="flex min-h-11 items-center gap-2.5 rounded-lg px-2 text-[0.875rem] hover:bg-surface-2">
                  {isPassed(progress, m!.id) ? (
                    <Check size={15} strokeWidth={2.5} aria-hidden="true" className="text-mastered" />
                  ) : (
                    <span aria-hidden="true" className="h-[15px] w-[15px] rounded-full border-2 border-ink-3" />
                  )}
                  {plainText(m!.title)}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-7 flex flex-col gap-2 sm:flex-row">
        <Button size="lg" onClick={onStart} className="sm:flex-1">
          Attempt on the clock
        </Button>
        {!confirmStudy && (
          <Button size="lg" variant="secondary" onClick={() => setConfirmStudy(true)} className="sm:flex-1">
            Study the walkthrough
          </Button>
        )}
      </div>
      {confirmStudy && (
        <div role="alert" className="mt-3 rounded-2xl border border-hairline bg-surface p-4">
          <p className="text-[0.9375rem] font-medium">Trying it first makes it stick. Study anyway?</p>
          <p className="mt-0.5 text-[0.8125rem] text-ink-2">A fifteen-minute attempt, however rough, makes the walkthrough land twice as well.</p>
          <div className="mt-3 flex gap-2">
            <ButtonLink to={`/practice/${problem.id}/walkthrough`} variant="secondary" className="flex-1">
              Study
            </ButtonLink>
            <Button onClick={onStart} className="flex-1">
              Attempt first
            </Button>
          </div>
        </div>
      )}
    </Frame>
  )
}

export function ProblemScreen() {
  const { problemId } = useParams()
  const problem = getProblem(problemId)
  const navigate = useNavigate()
  const { progress, saveAttempt } = useProgress()

  const [stage, setStage] = useState<Stage>('brief')
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [phaseSeconds, setPhaseSeconds] = useState<Record<string, number>>({})
  const [scored, setScored] = useState<Record<string, boolean>>({})
  const [startedAt, setStartedAt] = useState(0)
  const [phaseStartedAt, setPhaseStartedAt] = useState(0)
  const [now, setNow] = useState(0)
  const [fuIndex, setFuIndex] = useState(0)
  const [attemptId] = useState(() => `a-${Date.now()}`)
  const [another, setAnother] = useState<Problem | undefined>(undefined)

  // One clock for the whole run; the countdown is derived from it.
  useEffect(() => {
    if (stage !== 'running') return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [stage])

  // Leaving mid-attempt loses it: say so before the browser unloads.
  useEffect(() => {
    if (stage !== 'running') return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [stage])

  const phases = useMemo(() => (problem ? phasesFor(problem.kind) : []), [problem])
  const grouped = useMemo(() => {
    if (!problem) return []
    const bars: RubricRow['bar'][] = ['must', 'senior', 'staff']
    return bars.map((bar) => ({ bar, rows: problem.rubric.filter((r) => r.bar === bar) })).filter((g) => g.rows.length > 0)
  }, [problem])

  if (!problem) {
    return (
      <Frame>
        <h1 className="text-[1.5rem] font-semibold">No such problem</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-2">It may have been renamed. Every problem is listed under Practice.</p>
        <ButtonLink to="/practice" className="mt-5">
          All problems
        </ButtonLink>
      </Frame>
    )
  }

  const followups = problem.followups ?? []
  const phase = phases[phaseIndex]
  const elapsedInPhase = stage === 'running' ? Math.max(0, (now - phaseStartedAt) / 1000) : 0
  const remaining = phase ? phase.minutes * 60 - elapsedInPhase : 0
  const totalElapsed = stage === 'running' ? Math.max(0, (now - startedAt) / 1000) : 0

  function start() {
    const t = Date.now()
    setStartedAt(t)
    setPhaseStartedAt(t)
    setNow(t)
    setStage('running')
    window.scrollTo(0, 0)
  }

  function commitPhase() {
    const t = Date.now()
    setPhaseSeconds((prev) => ({ ...prev, [phase.id]: (prev[phase.id] ?? 0) + Math.round((t - phaseStartedAt) / 1000) }))
    setPhaseStartedAt(t)
  }

  function nextPhase() {
    commitPhase()
    window.scrollTo(0, 0)
    if (phaseIndex < phases.length - 1) setPhaseIndex((i) => i + 1)
    else setStage('grading')
  }

  function finishEarly() {
    commitPhase()
    window.scrollTo(0, 0)
    setStage('grading')
  }

  function saveAndFinish() {
    const attempt: ProblemAttempt = {
      id: attemptId,
      problemId: problem!.id,
      startedAt: startedAt || Date.now(),
      finishedAt: Date.now(),
      notes,
      phaseSeconds,
      scored,
    }
    saveAttempt(attempt)
    // Picked once, here — choosing at render would reshuffle on every repaint.
    setAnother(surpriseMe(progress, problem!.kind, Math.random, problems.filter((x) => x.id !== problem!.id)))
    window.scrollTo(0, 0)
    setStage('done')
  }

  function leave() {
    if (stage === 'running' && !window.confirm('Leave this attempt? Your notes will be lost.')) return
    navigate('/practice')
  }

  /* ---------------------------------------------------------------- */

  if (stage === 'brief') return <BriefStage problem={problem} onStart={start} />

  if (stage === 'running') {
    const over = remaining < 0
    const showFollowups = !!phase.followups && followups.length > 0
    const fu = followups[Math.min(fuIndex, followups.length - 1)]
    return (
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pt-screen pb-6">
        <header className="mb-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={leave}
              aria-label="Leave this attempt"
              className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-2 hover:bg-surface-2 hover:text-ink"
            >
              <X size={18} strokeWidth={2} />
            </button>
            <span className="flex-1 truncate font-mono text-[0.6875rem] tracking-[0.12em] text-ink-3 uppercase">
              {plainText(problem.title)} · {phaseIndex + 1}/{phases.length}
            </span>
            <span className="font-mono text-[0.75rem] text-ink-3 tabular">
              {mmss(totalElapsed)} / {TOTAL_MINUTES}:00
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <h1 className="text-[1.375rem] font-semibold">
              {phase.name}
              {phase.optional && <span className="ml-2 font-mono text-[0.6875rem] font-normal text-ink-3 uppercase">optional</span>}
            </h1>
            <span
              role="timer"
              aria-label={over ? `${mmss(-remaining)} over` : `${mmss(remaining)} left in this phase`}
              className={`font-mono text-[1.375rem] font-semibold tabular ${over ? 'text-alert' : 'text-line'}`}
            >
              {over ? `+${mmss(-remaining)}` : mmss(remaining)}
            </span>
          </div>

          <ol className="mt-3 flex gap-1" aria-hidden="true">
            {phases.map((p, i) => (
              <li
                key={p.id}
                className={`h-1.5 rounded-full ${i < phaseIndex ? 'bg-line' : i === phaseIndex ? (over ? 'bg-alert' : 'bg-line/50') : 'bg-surface-2'}`}
                style={{ flex: p.minutes }}
              />
            ))}
          </ol>
          <div className="mt-2">
            <Meter value={Math.min(1, elapsedInPhase / (phase.minutes * 60))} tone={over ? 'alert' : 'line'} label={`${phase.name} time used`} />
          </div>
        </header>

        <p className="mb-4 rounded-xl bg-surface-2 px-4 py-3 text-[0.875rem] leading-relaxed text-ink-2">{phase.prompt}</p>

        {showFollowups && fu && (
          <section aria-label="Interviewer follow-up" className="mb-4 rounded-2xl border border-line/50 bg-line-soft/40 p-4">
            <p className="flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-[0.12em] text-line uppercase">
              <MessageSquareQuote size={14} strokeWidth={2} aria-hidden="true" />
              Interviewer asks · {Math.min(fuIndex, followups.length - 1) + 1} of {followups.length}
            </p>
            <p className="mt-2 text-[1rem] leading-snug font-medium">{plainText(fu.q)}</p>
            <textarea
              value={notes[`fu:${fuIndex}`] ?? ''}
              onChange={(e) => setNotes((prev) => ({ ...prev, [`fu:${fuIndex}`]: e.target.value }))}
              placeholder="Your answer, in a sentence or two…"
              aria-label={`Your answer: ${plainText(fu.q)}`}
              className="mt-3 min-h-24 w-full resize-y rounded-xl border border-hairline bg-surface p-3 text-base leading-relaxed text-ink placeholder:text-ink-3 focus:border-line focus:outline-none"
            />
            {fuIndex < followups.length - 1 ? (
              <Button variant="secondary" onClick={() => setFuIndex((i) => i + 1)} className="mt-2">
                Next question <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
              </Button>
            ) : (
              <p className="mt-2 text-[0.8125rem] text-ink-3">That is the last one. Finish when you are ready.</p>
            )}
          </section>
        )}

        <textarea
          value={notes[phase.id] ?? ''}
          onChange={(e) => setNotes((prev) => ({ ...prev, [phase.id]: e.target.value }))}
          placeholder="Notes for this phase…"
          aria-label={`Notes for ${phase.name}`}
          className="min-h-40 flex-1 resize-none rounded-2xl border border-hairline bg-surface p-4 font-mono text-base leading-relaxed text-ink placeholder:text-ink-3 focus:border-line focus:outline-none sm:text-[0.875rem]"
        />

        <div className="mt-4 flex gap-2.5">
          <Button onClick={nextPhase} className="flex-1">
            {phaseIndex === phases.length - 1 ? 'Finish' : 'Next phase'}
          </Button>
          {phase.optional && phaseIndex < phases.length - 1 && (
            <Button variant="secondary" onClick={nextPhase} aria-label="Skip this phase">
              <SkipForward size={16} strokeWidth={2} />
              Skip
            </Button>
          )}
        </div>
        <button type="button" onClick={finishEarly} className="mt-3 min-h-11 text-[0.8125rem] text-ink-3 hover:text-ink">
          Stop and grade now
        </button>
      </div>
    )
  }

  if (stage === 'grading') {
    const hit = Object.values(scored).filter(Boolean).length
    const written = phases.filter((p) => notes[p.id]?.trim())
    return (
      <Frame onClose={() => navigate('/practice')}>
        <h1 className="text-[1.75rem] leading-tight font-semibold">The walkthrough</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-2">
          Read it against your notes, then tick what you genuinely covered. Honest ticks are the only kind worth having.
        </p>

        {written.length > 0 && (
          <details className="group mt-5 rounded-2xl border border-hairline bg-surface">
            <summary className="flex min-h-12 cursor-pointer list-none items-center px-4 text-[0.9375rem] font-medium [&::-webkit-details-marker]:hidden">
              Your notes
              <span className="ml-auto font-mono text-[0.75rem] text-ink-3">{written.length} phases</span>
            </summary>
            <div className="border-t border-hairline px-4 py-3">
              {written.map((p) => (
                <div key={p.id} className="mb-3 last:mb-0">
                  <p className="font-mono text-[0.6875rem] tracking-[0.12em] text-ink-3 uppercase">{p.name}</p>
                  <p className="mt-1 font-mono text-[0.8125rem] leading-relaxed whitespace-pre-wrap text-ink-2">{notes[p.id]}</p>
                </div>
              ))}
            </div>
          </details>
        )}

        <div className="mt-7">
          <Blocks blocks={problem.modelAnswer} />
        </div>

        {followups.length > 0 && (
          <section aria-labelledby="fu-review-h" className="mt-10">
            <h2 id="fu-review-h" className="text-[1.25rem] font-semibold">
              The follow-ups
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
              {followups.map((f, i) => (
                <li key={i} className="rounded-2xl border border-hairline bg-surface p-4">
                  <p className="text-[0.9375rem] leading-snug font-medium">{plainText(f.q)}</p>
                  {notes[`fu:${i}`]?.trim() && (
                    <>
                      <p className="mt-3 font-mono text-[0.625rem] tracking-[0.12em] text-ink-3 uppercase">You said</p>
                      <p className="mt-0.5 text-[0.875rem] leading-relaxed whitespace-pre-wrap text-ink-2">{notes[`fu:${i}`]}</p>
                    </>
                  )}
                  <p className="mt-3 font-mono text-[0.625rem] tracking-[0.12em] text-mastered uppercase">A strong answer</p>
                  <p className="mt-0.5 text-[0.9375rem] leading-relaxed text-ink-2">
                    <Inline text={f.a} />
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 border-t border-hairline pt-7">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h2 className="text-[1.25rem] font-semibold">Score yourself</h2>
            <span className="font-mono text-[0.875rem] text-line tabular">
              {hit}/{problem.rubric.length}
            </span>
          </div>

          {grouped.map((group) => (
            <div key={group.bar} className="mt-5">
              <p className="font-mono text-[0.6875rem] tracking-[0.12em] text-ink-3 uppercase">{BAR_LABEL[group.bar].title}</p>
              <p className="mt-0.5 mb-2.5 text-[0.8125rem] text-ink-3">{BAR_LABEL[group.bar].note}</p>
              <ul className="flex flex-col gap-1.5">
                {group.rows.map((row) => {
                  const on = !!scored[row.id]
                  return (
                    <li key={row.id}>
                      <label
                        className={`flex min-h-13 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-line ${
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
                        <span className="text-[0.9375rem] leading-relaxed">{plainText(row.criterion)}</span>
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
      </Frame>
    )
  }

  /* done */
  const coverage = attemptCoverage(problem, { id: attemptId, problemId: problem.id, startedAt, finishedAt: 0, notes, phaseSeconds, scored })
  const mustRows = problem.rubric.filter((r) => r.bar === 'must')
  const mustHit = mustRows.filter((r) => scored[r.id]).length
  const seniorRows = problem.rubric.filter((r) => r.bar === 'senior')
  const seniorHit = seniorRows.filter((r) => scored[r.id]).length

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 pt-screen pb-10">
      <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase">{plainText(problem.title)}</p>
      <h1 className="mt-2 text-[2.5rem] leading-none font-semibold tabular">{Math.round(coverage * 100)}%</h1>
      <p className="mt-1 text-[0.875rem] text-ink-3">weighted rubric coverage — the bar counts most</p>

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
        <ButtonLink to={`/practice/${problem.id}/walkthrough`} size="lg">
          Study the walkthrough step by step
        </ButtonLink>
        {another && (
          <ButtonLink to={`/practice/${another.id}`} variant="secondary" size="lg">
            Try another: {plainText(another.title)}
          </ButtonLink>
        )}
        <ButtonLink to="/practice" variant="ghost" size="lg">
          Back to practice
        </ButtonLink>
      </div>
    </div>
  )
}
