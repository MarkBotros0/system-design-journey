import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlarmClock,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  ListChecks,
  MessageSquareQuote,
  NotebookPen,
  Play,
  RotateCcw,
  SkipForward,
  Timer,
} from 'lucide-react'
import { getModule, getProblem, getTrack, problems } from '../content'
import { phasesFor, TOTAL_MINUTES } from '../content/framework'
import { getCategory } from '../content/categories'
import type { Problem } from '../content/types'
import { useProgress } from '../state/ProgressProvider'
import type { ProblemAttempt } from '../lib/storage'
import { isPassed } from '../lib/progress'
import { draftOf, finishedAttempts, resumePoint } from '../lib/attempts'
import { attemptCoverage, bestCoverage, surpriseMe } from '../lib/readiness'
import { plainText } from '../lib/text'
import { Blocks } from '../components/content/Blocks'
import { Inline } from '../components/content/Inline'
import { Button, ButtonLink } from '../components/ui/Button'
import { Badge, Eyebrow, Meter, Panel } from '../components/ui/Bits'
import { Cell, Group } from '../components/ui/List'
import { TrackGlyph } from '../components/ui/TrackIcon'
import { trackStyle } from '../components/ui/trackStyle'
import { useScrolledPast } from '../components/ui/useScrolledPast'
import { CloseButton, CompactTitle, Dock, FocusHeader } from '../components/practice/FocusFrame'
import { PhaseBar, PhasePlan } from '../components/practice/Phases'
import { DifficultyBadge, ProblemGlyph } from '../components/practice/ProblemBits'
import { RubricSheet } from '../components/practice/RubricSheet'
import { draftMinutes, draftWhere, mmss, problemTrack } from '../components/practice/problemMeta'
import { useScrolled } from '../components/practice/useScrolled'

type Stage = 'brief' | 'running' | 'grading' | 'done'

const titleCls = 'text-[2rem] leading-[1.1] font-extrabold tracking-[-0.025em] outline-none'

/**
 * The focus-mode frame: no tab bar, one exit top left, an optional action docked at the
 * bottom. The compact title appears in the bar once the large one has scrolled away.
 */
function Frame({
  children,
  title,
  titleRef,
  trackId,
  dock,
  onClose,
  closeLabel = 'Back to Practice',
}: {
  children: ReactNode
  title?: string
  titleRef?: React.RefObject<HTMLHeadingElement | null>
  trackId?: string
  dock?: ReactNode
  onClose?: () => void
  closeLabel?: string
}) {
  const navigate = useNavigate()
  const fallback = useRef<HTMLHeadingElement>(null)
  const past = useScrolledPast(titleRef ?? fallback)
  return (
    <div style={trackStyle(trackId)} className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4">
      <FocusHeader
        glass={past}
        close={<CloseButton onClick={onClose ?? (() => navigate('/practice'))} label={closeLabel} />}
        center={title ? <CompactTitle title={title} show={past} /> : undefined}
      />
      <div className="pt-2 pb-8">{children}</div>
      {dock && <Dock>{dock}</Dock>}
    </div>
  )
}

function BriefStage({
  problem,
  onStart,
  draft,
  onResume,
}: {
  problem: Problem
  onStart: () => void
  draft?: ProblemAttempt
  onResume: () => void
}) {
  const { progress } = useProgress()
  const [confirmStudy, setConfirmStudy] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const confirmRef = useRef<HTMLDivElement>(null)
  const attempts = finishedAttempts(progress, problem.id).length
  const best = bestCoverage(progress, problem.id, problem)
  const phases = phasesFor(problem.kind)
  const suggested = problem.suggests.map((id) => getModule(id)).filter((m) => !!m)
  const passed = suggested.filter((m) => isPassed(progress, m!.id)).length
  const track = problemTrack(problem)
  const title = plainText(problem.title)

  // The button that asked has gone; the question takes focus, on its first answer.
  useEffect(() => {
    if (confirmStudy) confirmRef.current?.querySelector<HTMLElement>('a, button')?.focus()
  }, [confirmStudy])

  const dock = confirmStudy ? (
    <div ref={confirmRef} role="alert" className="rounded-[22px] bg-surface p-4" style={{ boxShadow: 'var(--shadow-float)' }}>
      <p className="text-base font-bold">Trying it first makes it stick. Study anyway?</p>
      <p className="mt-0.5 text-[0.875rem] text-ink-2">A fifteen-minute attempt, however rough, makes the walkthrough land twice as well.</p>
      <div className="mt-3 flex gap-2">
        <ButtonLink to={`/practice/${problem.id}/walkthrough`} variant="secondary" className="flex-1">
          Study
        </ButtonLink>
        {/* With a draft open, "attempt first" means carry on with it, never wipe it. */}
        <Button onClick={draft ? onResume : onStart} className="flex-1">
          {draft ? 'Resume first' : 'Attempt first'}
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex flex-col gap-2 sm:flex-row-reverse">
      {draft ? (
        <Button size="lg" onClick={onResume} className="sm:flex-1">
          <Play size={17} strokeWidth={2.4} aria-hidden="true" className="fill-current" />
          Resume attempt
        </Button>
      ) : (
        <Button size="lg" onClick={onStart} className="sm:flex-1">
          Attempt on the clock
        </Button>
      )}
      <Button variant="secondary" onClick={() => setConfirmStudy(true)} className="w-full sm:min-h-14 sm:flex-1">
        Study the walkthrough
      </Button>
    </div>
  )

  return (
    <Frame title={title} titleRef={titleRef} trackId={track} dock={dock}>
      <div className="flex items-center gap-3">
        <ProblemGlyph trackId={track} kind={problem.kind} size={36} />
        <Eyebrow>
          {getCategory(problem.category)?.title} · {problem.kind === 'lld' ? 'Low-level design' : 'System design'}
        </Eyebrow>
      </div>
      <h1 ref={titleRef} tabIndex={-1} className={`mt-3 ${titleCls}`}>
        {title}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <DifficultyBadge difficulty={problem.difficulty} />
        <span className="inline-flex items-center gap-1.5 text-[0.9375rem] text-ink-2 tabular">
          <Clock size={16} strokeWidth={2.2} aria-hidden="true" />
          {TOTAL_MINUTES} min
        </span>
        {attempts > 0 && best !== undefined && (
          <span className="text-[0.9375rem] text-ink-2 tabular">
            {attempts} attempt{attempts === 1 ? '' : 's'} · best {Math.round(best * 100)}%
          </span>
        )}
      </div>

      {draft && <DraftCard draft={draft} phases={phases} onStartOver={onStart} />}

      <Panel className="mt-6">
        <h2 className="flex items-center gap-2 text-[0.875rem] font-bold text-ink-2">
          <MessageSquareQuote size={16} strokeWidth={2.2} aria-hidden="true" />
          The prompt
        </h2>
        <p className="mt-2 text-[1.125rem] leading-relaxed">
          <Inline text={problem.brief} />
        </p>
      </Panel>

      <section aria-labelledby="plan-h" className="mt-8">
        <h2 id="plan-h" className="px-1 text-[1.25rem] font-bold">
          The plan
        </h2>
        <p className="mt-1 mb-3 px-1 text-[0.9375rem] leading-relaxed text-ink-2">
          {TOTAL_MINUTES} minutes. Say it out loud as you type — speaking is the part you are training.
        </p>
        <PhasePlan phases={phases} />
      </section>

      {suggested.length > 0 && (
        <Group
          className="mt-8"
          title="Worth knowing first"
          action={
            <span className="pb-0.5 text-[0.9375rem] font-semibold text-ink-2 tabular">
              {passed} of {suggested.length} passed
            </span>
          }
        >
          {suggested.map((m) => {
            const done = isPassed(progress, m!.id)
            return (
              <Cell
                key={m!.id}
                to={`/m/${m!.id}`}
                leading={<TrackGlyph trackId={m!.trackId} size={36} />}
                title={plainText(m!.title)}
                sub={`${getTrack(m!.trackId)?.title ?? ''} · ${m!.minutes} min`}
                trailing={
                  done ? (
                    <span className="inline-flex items-center gap-1 text-[0.875rem] font-semibold text-correct">
                      <Check size={16} strokeWidth={2.8} aria-hidden="true" />
                      Passed
                    </span>
                  ) : undefined
                }
              />
            )
          })}
        </Group>
      )}
    </Frame>
  )
}

/** An attempt left part-way: where it stopped, and the choice to start again. Resume is docked. */
function DraftCard({ draft, phases, onStartOver }: { draft: ProblemAttempt; phases: ReturnType<typeof phasesFor>; onStartOver: () => void }) {
  return (
    <section aria-label="Unfinished attempt" className="mt-6 rounded-[22px] bg-surface p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-streak-soft text-streak">
          <Timer size={21} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base leading-snug font-bold">You left an attempt part-way through.</p>
          <p className="mt-0.5 text-[0.875rem] text-ink-2 tabular">
            {draftWhere(draft, phases)} <span className="whitespace-nowrap">· {draftMinutes(draft)} min in</span>{' '}
            <span className="whitespace-nowrap">· notes saved</span>
          </p>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="secondary" onClick={onStartOver}>
          <RotateCcw size={16} strokeWidth={2.2} aria-hidden="true" />
          Start over
        </Button>
      </div>
    </section>
  )
}

/**
 * Keyed by problem, so "Try another" — a link from one problem to the next — starts a
 * fresh run instead of carrying the last one's stage, notes and ticks across.
 */
export function ProblemScreen() {
  const { problemId } = useParams()
  return <ProblemRun key={problemId} problemId={problemId} />
}

function ProblemRun({ problemId }: { problemId?: string }) {
  const problem = getProblem(problemId)
  const navigate = useNavigate()
  const { progress, saveAttempt, keepDraft, discardAttempt } = useProgress()
  const scrolled = useScrolled()

  const [stage, setStage] = useState<Stage>('brief')
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [phaseSeconds, setPhaseSeconds] = useState<Record<string, number>>({})
  const [scored, setScored] = useState<Record<string, boolean>>({})
  const [startedAt, setStartedAt] = useState(0)
  const [phaseStartedAt, setPhaseStartedAt] = useState(0)
  const [now, setNow] = useState(0)
  const [fuIndex, setFuIndex] = useState(0)
  /** Which follow-up row is open; null means the newest one asked. */
  const [openFu, setOpenFu] = useState<number | null>(null)
  const [rubricOpen, setRubricOpen] = useState(false)
  const [attemptId, setAttemptId] = useState(() => `a-${Date.now()}`)
  /** When this attempt first began — survives a resume, unlike the clock's `startedAt`. */
  const [openedAt, setOpenedAt] = useState(0)
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

  // A new stage or phase is a new page in all but URL: its heading takes focus, so a
  // screen reader hears where it landed. Compared with the last values, not "first run",
  // so a remount in development does not steal focus on load.
  const shownAt = useRef({ stage, phaseIndex })
  useEffect(() => {
    if (shownAt.current.stage === stage && shownAt.current.phaseIndex === phaseIndex) return
    shownAt.current = { stage, phaseIndex }
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
  }, [stage, phaseIndex])

  const phases = useMemo(() => (problem ? phasesFor(problem.kind) : []), [problem])
  // The draft as of the latest render, for the save timers below. Assigned in an effect so
  // render stays pure; read only from timers and cleanup.
  const draftRef = useRef<() => ProblemAttempt | null>(() => null)
  useEffect(() => {
    draftRef.current = () => {
      if (!problem || (stage !== 'running' && stage !== 'grading')) return null
      const ph = phases[phaseIndex]
      const live = stage === 'running' && ph ? Math.round((Date.now() - phaseStartedAt) / 1000) : 0
      return {
        id: attemptId,
        problemId: problem.id,
        startedAt: openedAt,
        notes,
        phaseSeconds: live > 0 ? { ...phaseSeconds, [ph.id]: (phaseSeconds[ph.id] ?? 0) + live } : phaseSeconds,
        scored,
        resume: { stage, phaseIndex },
      }
    }
  })

  // Kept as a draft from the first second: shortly after each change, when the tab is
  // hidden (a phone call, iOS suspending the app), and on leaving the screen by any route.
  useEffect(() => {
    if (stage !== 'running' && stage !== 'grading') return
    const t = setTimeout(() => {
      const d = draftRef.current()
      if (d) keepDraft(d)
    }, 800)
    return () => clearTimeout(t)
  }, [stage, phaseIndex, notes, scored, keepDraft])

  useEffect(() => {
    const flush = () => {
      const d = draftRef.current()
      if (d) keepDraft(d)
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      flush()
    }
  }, [keepDraft])

  if (!problem) {
    return (
      <Frame>
        <h1 tabIndex={-1} className={titleCls}>
          No such problem
        </h1>
        <p className="mt-2 text-base text-ink-2">It may have been renamed. Every problem is listed under Practice.</p>
        <ButtonLink to="/practice" className="mt-5">
          All problems
        </ButtonLink>
      </Frame>
    )
  }

  const followups = problem.followups ?? []
  const phase = phases[phaseIndex]
  const draft = draftOf(progress, problem.id)
  const track = problemTrack(problem)
  // A resumed phase carries the seconds it had already used.
  const elapsedInPhase = stage === 'running' ? (phaseSeconds[phase.id] ?? 0) + Math.max(0, (now - phaseStartedAt) / 1000) : 0
  const remaining = phase ? phase.minutes * 60 - elapsedInPhase : 0
  const totalElapsed = stage === 'running' ? Math.max(0, (now - startedAt) / 1000) : 0

  function start() {
    if (draft) discardAttempt(draft.id)
    const t = Date.now()
    setOpenedAt(t)
    setStartedAt(t)
    setPhaseStartedAt(t)
    setNow(t)
    setStage('running')
    window.scrollTo(0, 0)
  }

  function resume() {
    if (!draft) return
    const at = resumePoint(draft, phases.length)
    const t = Date.now()
    const spent = Object.values(draft.phaseSeconds).reduce((n, x) => n + x, 0)
    setAttemptId(draft.id)
    setOpenedAt(draft.startedAt)
    setNotes(draft.notes)
    setPhaseSeconds(draft.phaseSeconds)
    setScored(draft.scored)
    setPhaseIndex(at.phaseIndex)
    // The overall clock resumes from the time already spent, not from the time away.
    setStartedAt(t - spent * 1000)
    setPhaseStartedAt(t)
    setNow(t)
    setStage(at.stage)
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
      startedAt: openedAt || startedAt || Date.now(),
      finishedAt: Date.now(),
      notes,
      phaseSeconds,
      scored,
    }
    saveAttempt(attempt)
    // Picked once, here — choosing at render would reshuffle on every repaint.
    setAnother(surpriseMe(progress, problem!.kind, Math.random, problems.filter((x) => x.id !== problem!.id)))
    setRubricOpen(false)
    window.scrollTo(0, 0)
    setStage('done')
  }

  /** Nothing to confirm: the attempt is kept as a draft and offered back on the brief. */
  function leave() {
    navigate('/practice')
  }

  /* ---------------------------------------------------------------- */

  if (stage === 'brief') return <BriefStage problem={problem} onStart={start} draft={draft} onResume={resume} />

  if (stage === 'running') {
    const over = remaining < 0
    const showFollowups = !!phase.followups && followups.length > 0
    // Questions arrive one at a time; any already answered (a resumed draft) stay asked.
    const answered = followups.reduce((n, _, i) => (notes[`fu:${i}`]?.trim() ? i : n), -1)
    const asked = Math.min(Math.max(fuIndex, answered), followups.length - 1)
    const openRow = openFu ?? asked
    const last = phaseIndex === phases.length - 1
    return (
      <div style={trackStyle(track)} className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4">
        <FocusHeader
          glass={scrolled}
          close={<CloseButton onClick={leave} label="Leave — the attempt is kept to resume" />}
          center={
            <span
              role="timer"
              aria-label={over ? `${mmss(-remaining)} over` : `${mmss(remaining)} left in this phase`}
              style={{ boxShadow: 'var(--shadow-card)' }}
              className={`inline-flex min-h-12 items-center gap-2 rounded-full px-5 font-mono text-[1.75rem] leading-none font-medium tracking-[-0.02em] tabular transition-colors duration-200 ${
                over ? 'bg-alert-soft text-alert' : 'bg-surface text-ink'
              }`}
            >
              {over && <AlarmClock size={20} strokeWidth={2.3} aria-hidden="true" />}
              {over ? `+${mmss(-remaining)}` : mmss(remaining)}
            </span>
          }
          right={
            <span className="text-[0.9375rem] font-semibold text-ink-2 tabular">
              {phaseIndex + 1}/{phases.length}
            </span>
          }
        >
          <div className="pt-1 pb-3">
            <PhaseBar phases={phases} index={phaseIndex} used={elapsedInPhase / (phase.minutes * 60)} over={over} />
          </div>
        </FocusHeader>

        <div className="flex flex-1 flex-col pt-4">
          <p className="flex items-baseline justify-between gap-3 text-[0.875rem] text-ink-2">
            <span className="truncate font-semibold">{plainText(problem.title)}</span>
            <span className="shrink-0 tabular">
              <span className="font-mono">{mmss(totalElapsed)}</span> of {TOTAL_MINUTES} min
            </span>
          </p>
          <h1 tabIndex={-1} className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[1.75rem] leading-tight font-extrabold tracking-[-0.025em] outline-none">
            {phase.name}
            {phase.optional && <Badge>Optional</Badge>}
          </h1>
          <p className="mt-2 text-base leading-relaxed text-ink-2">{phase.prompt}</p>

          {showFollowups && (
            <section aria-label="Interviewer follow-ups" className="mt-5">
              <h2 className="mb-2 flex items-center gap-2 px-1 text-[0.9375rem] font-bold">
                <MessageSquareQuote size={17} strokeWidth={2.2} aria-hidden="true" />
                <span className="flex-1">The interviewer asks</span>
                <span className="font-semibold text-ink-2 tabular">
                  {asked + 1} of {followups.length}
                </span>
              </h2>
              <ul
                className="overflow-hidden rounded-[22px] bg-surface [&>li+li]:relative [&>li+li]:before:pointer-events-none [&>li+li]:before:absolute [&>li+li]:before:inset-x-4 [&>li+li]:before:top-0 [&>li+li]:before:h-px [&>li+li]:before:bg-hairline [&>li+li]:before:content-['']"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                {followups.slice(0, asked + 1).map((f, i) => {
                  const open = openRow === i
                  const q = plainText(f.q)
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={`fu-${i}`}
                        onClick={() => setOpenFu(open ? -1 : i)}
                        className="flex min-h-14 w-full items-start gap-3 px-4 py-3.5 text-left transition-colors duration-100 hover:bg-surface-2/60"
                      >
                        <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[0.8125rem] font-bold tabular">
                          {i + 1}
                        </span>
                        <span className="flex-1 text-base leading-snug font-semibold">{q}</span>
                        <ChevronDown
                          size={19}
                          strokeWidth={2.2}
                          aria-hidden="true"
                          className={`mt-0.5 shrink-0 text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <div id={`fu-${i}`} hidden={!open} className="px-4 pb-4">
                        <textarea
                          value={notes[`fu:${i}`] ?? ''}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [`fu:${i}`]: e.target.value }))}
                          placeholder="Your answer, in a sentence or two…"
                          aria-label={`Your answer: ${q}`}
                          className="min-h-24 w-full resize-y rounded-2xl bg-surface-2 p-3.5 text-base leading-relaxed text-ink placeholder:text-ink-3"
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
              {asked < followups.length - 1 ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFuIndex(asked + 1)
                    setOpenFu(null)
                  }}
                  className="mt-2.5"
                >
                  Next question <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
                </Button>
              ) : (
                <p className="mt-2.5 px-1 text-[0.875rem] text-ink-2">That is the last one. Finish when you are ready.</p>
              )}
            </section>
          )}

          <textarea
            value={notes[phase.id] ?? ''}
            onChange={(e) => setNotes((prev) => ({ ...prev, [phase.id]: e.target.value }))}
            placeholder={`Notes for ${phase.name.toLowerCase()}…`}
            aria-label={`Notes for ${phase.name}`}
            className="mt-5 min-h-44 flex-1 resize-none rounded-[22px] bg-surface p-4 text-base leading-relaxed text-ink placeholder:text-ink-3"
            style={{ boxShadow: 'var(--shadow-card)' }}
          />
        </div>

        <Dock>
          <div className="flex gap-2">
            {phase.optional && !last && (
              <Button variant="secondary" onClick={nextPhase} aria-label="Skip this phase">
                <SkipForward size={17} strokeWidth={2.2} aria-hidden="true" />
                Skip
              </Button>
            )}
            <Button size="lg" onClick={nextPhase} className="flex-1">
              {last ? 'Finish' : 'Next phase'}
              <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
            </Button>
          </div>
          <button
            type="button"
            onClick={finishEarly}
            className="mt-1 min-h-11 w-full rounded-full text-[0.9375rem] font-semibold text-ink-2 transition-colors duration-150 hover:text-ink"
          >
            Stop and grade now
          </button>
        </Dock>
      </div>
    )
  }

  if (stage === 'grading') {
    return <GradingStage problem={problem} phases={phases} notes={notes} scored={scored} track={track} rubricOpen={rubricOpen} setRubricOpen={setRubricOpen} onToggle={(id) => setScored((prev) => ({ ...prev, [id]: !prev[id] }))} onSave={saveAndFinish} onLeave={() => navigate('/practice')} />
  }

  /* done */
  const coverage = attemptCoverage(problem, { id: attemptId, problemId: problem.id, startedAt, finishedAt: 0, notes, phaseSeconds, scored })
  const mustRows = problem.rubric.filter((r) => r.bar === 'must')
  const mustHit = mustRows.filter((r) => scored[r.id]).length
  const seniorRows = problem.rubric.filter((r) => r.bar === 'senior')
  const seniorHit = seniorRows.filter((r) => scored[r.id]).length
  const bars = [
    { label: 'The bar', hit: mustHit, of: mustRows.length },
    { label: 'Senior', hit: seniorHit, of: seniorRows.length },
  ]

  return (
    <div style={trackStyle(track)} className="mx-auto flex min-h-dvh max-w-lg flex-col px-4">
      <FocusHeader glass={scrolled} close={<CloseButton onClick={() => navigate('/practice')} label="Back to Practice" />} />
      <div className="flex flex-1 flex-col justify-center pt-2 pb-10">
        <div className="flex items-center gap-3">
          <ProblemGlyph trackId={track} kind={problem.kind} size={36} />
          <Eyebrow>{plainText(problem.title)}</Eyebrow>
        </div>
        <h1 tabIndex={-1} className="mt-4 text-[4rem] leading-none font-extrabold tracking-[-0.04em] tabular outline-none">
          {Math.round(coverage * 100)}%
        </h1>
        <p className="mt-2 text-base text-pretty text-ink-2">Weighted rubric coverage — the bar counts most.</p>

        <Panel className="mt-6">
          <dl className="flex flex-col gap-5">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <dt className="text-base font-semibold">{b.label}</dt>
                  <dd className="inline-flex items-center gap-1.5 text-base font-bold tabular">
                    {b.of > 0 && b.hit === b.of && <Check size={17} strokeWidth={2.8} aria-label="All met" className="text-correct" />}
                    {b.hit}/{b.of}
                  </dd>
                </div>
                <Meter value={b.of ? b.hit / b.of : 0} label={`${b.label} criteria met`} />
              </div>
            ))}
          </dl>
        </Panel>

        <p className="mt-6 text-base leading-relaxed text-ink-2">
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
    </div>
  )
}

/**
 * The model answer to read against your notes, then the rubric in a sheet. Ticks live in
 * the run's state (and its draft), so closing the sheet to re-read loses nothing.
 */
function GradingStage({
  problem,
  phases,
  notes,
  scored,
  track,
  rubricOpen,
  setRubricOpen,
  onToggle,
  onSave,
  onLeave,
}: {
  problem: Problem
  phases: ReturnType<typeof phasesFor>
  notes: Record<string, string>
  scored: Record<string, boolean>
  track?: string
  rubricOpen: boolean
  setRubricOpen: (open: boolean) => void
  onToggle: (id: string) => void
  onSave: () => void
  onLeave: () => void
}) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const followups = problem.followups ?? []
  const hit = problem.rubric.filter((r) => scored[r.id]).length
  const written = phases.filter((p) => notes[p.id]?.trim())

  return (
    <>
      <Frame
        title="The walkthrough"
        titleRef={titleRef}
        trackId={track}
        onClose={onLeave}
        dock={
          <Button size="lg" onClick={() => setRubricOpen(true)}>
            <ListChecks size={19} strokeWidth={2.2} aria-hidden="true" />
            Score yourself
            <span className="font-semibold opacity-70 tabular">
              {hit}/{problem.rubric.length}
            </span>
          </Button>
        }
      >
        <div className="flex items-center gap-3">
          <ProblemGlyph trackId={track} kind={problem.kind} size={36} />
          <Eyebrow>{plainText(problem.title)}</Eyebrow>
        </div>
        <h1 ref={titleRef} tabIndex={-1} className={`mt-3 ${titleCls}`}>
          The walkthrough
        </h1>
        <p className="mt-2 text-base leading-relaxed text-ink-2">
          Read it against your notes, then score yourself. Honest ticks are the only kind worth having.
        </p>

        {written.length > 0 && (
          <details className="group mt-6 rounded-[22px] bg-surface" style={{ boxShadow: 'var(--shadow-card)' }}>
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-[22px] px-4 [&::-webkit-details-marker]:hidden">
              <NotebookPen size={19} strokeWidth={2.1} aria-hidden="true" className="shrink-0 text-ink-2" />
              <span className="flex-1 text-base font-semibold">Your notes</span>
              <span className="text-[0.9375rem] text-ink-2 tabular">
                {written.length} phase{written.length === 1 ? '' : 's'}
              </span>
              <ChevronDown size={19} strokeWidth={2.2} aria-hidden="true" className="shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-4 px-4 pt-1 pb-4">
              {written.map((p) => (
                <div key={p.id}>
                  <h2 className="text-[0.875rem] font-bold text-ink-2">{p.name}</h2>
                  <p className="mt-1 text-base leading-relaxed whitespace-pre-wrap">{notes[p.id]}</p>
                </div>
              ))}
            </div>
          </details>
        )}

        <div className="mt-8">
          <Blocks blocks={problem.modelAnswer} />
        </div>

        {followups.length > 0 && (
          <section aria-labelledby="fu-review-h" className="mt-10">
            <h2 id="fu-review-h" className="px-1 text-[1.25rem] font-bold">
              The follow-ups
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
              {followups.map((f, i) => (
                <li key={i} className="rounded-[22px] bg-surface p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <p className="text-base leading-snug font-semibold">{plainText(f.q)}</p>
                  {notes[`fu:${i}`]?.trim() && (
                    <div className="mt-3 rounded-2xl bg-surface-2 px-3.5 py-3">
                      <p className="text-[0.875rem] font-bold text-ink-2">You said</p>
                      <p className="mt-0.5 text-base leading-relaxed whitespace-pre-wrap">{notes[`fu:${i}`]}</p>
                    </div>
                  )}
                  <p className="mt-3 text-[0.875rem] font-bold text-ink-2">A strong answer</p>
                  <p className="mt-0.5 text-base leading-relaxed text-ink-2">
                    <Inline text={f.a} />
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Frame>

      {/* The sheet sits outside the frame; it still takes the problem's track for its focus rings. */}
      <div className="contents" style={trackStyle(track)}>
        <RubricSheet open={rubricOpen} onClose={() => setRubricOpen(false)} rubric={problem.rubric} scored={scored} onToggle={onToggle} onSave={onSave} />
      </div>
    </>
  )
}
