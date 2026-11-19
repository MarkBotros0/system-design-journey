import { useCallback, useRef, useState, useEffect, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Inbox, X } from 'lucide-react'
import { getQuestion, questionTopic, type QuestionTopic } from '../content/bank'
import type { Question } from '../content/types'
import {
  advanceSet,
  buildSet,
  isCorrect,
  isFinished,
  setLabel,
  setRequest,
  setSource,
  todayCount,
  type Answer,
  type QuestionSet,
  type SetRequest,
} from '../lib/bank'
import { loadSet, saveSet } from '../lib/setStore'
import type { ProgressState } from '../lib/storage'
import { plainText } from '../lib/text'
import { useProgress } from '../state/ProgressProvider'
import { Inline } from '../components/content/Inline'
import { Button, ButtonLink } from '../components/ui/Button'
import { Badge } from '../components/ui/Bits'
import { Cell, Group } from '../components/ui/List'
import { SegmentedProgress } from '../components/ui/SegmentedProgress'
import { trackStyle } from '../components/ui/trackStyle'
import { SingleChoice } from '../components/questions/SingleChoice'
import { MultiChoice } from '../components/questions/MultiChoice'
import { TrueFalse } from '../components/questions/TrueFalse'
import { MatchPairs } from '../components/questions/MatchPairs'
import { Feedback, type Verdict } from '../components/questions/Feedback'
import { QuestionMeta, SessionHeader } from '../components/questions/SessionChrome'
import { useEnterKey, useStartAtTop } from '../components/questions/useStartAtTop'

function newSet(source: string, req: SetRequest, p: ProgressState): QuestionSet | null {
  const ids = buildSet(p, { size: req.size, scope: req.scope, trackIds: req.trackIds, kinds: req.kinds, now: Date.now(), rand: Math.random })
  return ids.length ? { source, ids, at: 0, results: [], startedAt: Date.now() } : null
}

/** Focus mode, outside the tab shell: one question at a time, one exit. */
export function QuestionSessionScreen() {
  const { ready } = useProgress()
  const [params] = useSearchParams()
  const source = setSource(params)
  if (!ready) return <div className="min-h-dvh" aria-busy="true" />
  return <Session key={source} source={source} params={params} />
}

function Session({ source, params }: { source: string; params: URLSearchParams }) {
  const { progress, answerQuestion } = useProgress()
  const navigate = useNavigate()
  const req = setRequest(params, progress)
  // Built once: the saved set when it is this one (back from "Learn more"), else a new one.
  const [set, setSet] = useState<QuestionSet | null>(() => {
    const saved = loadSet()
    return saved && saved.source === source ? saved : newSet(source, req, progress)
  })

  useEffect(() => {
    saveSet(set)
  }, [set])

  const exit = () => navigate('/questions')

  const another = () => setSet(newSet(source, req, progress))

  // Recorded here, not inside a state updater: React may run updaters twice, and an answer
  // must be scheduled and counted exactly once.
  function submit(answer: Answer) {
    if (!set || set.pending) return
    const q = getQuestion(set.ids[set.at])
    if (!q) return
    const correct = isCorrect(q, answer)
    answerQuestion(q.id, correct)
    setSet({ ...set, pending: { answer, correct } })
  }

  const next = useCallback(() => setSet((s) => (s?.pending ? advanceSet(s, s.pending.correct) : s)), [])

  if (!set) return <EmptySet req={req} onExit={exit} />
  if (isFinished(set)) return <Summary set={set} req={req} onAnother={another} onExit={exit} />

  const q = getQuestion(set.ids[set.at])
  if (!q) return <EmptySet req={req} onExit={exit} />
  const topic = questionTopic(q)

  // One segment per position; results line up with positions, and the question on screen
  // takes its colour as soon as it is answered.
  const states = set.ids.map((_, i) =>
    i < set.results.length
      ? set.results[i].correct
        ? ('correct' as const)
        : ('wrong' as const)
      : i === set.at && set.pending
        ? set.pending.correct
          ? ('correct' as const)
          : ('wrong' as const)
        : undefined,
  )
  // A first miss goes round once more at the end of the set (advanceSet); otherwise the
  // schedule says when it is back.
  const again = !!set.pending && !set.pending.correct && !set.results.some((r) => r.id === q.id && !r.correct)

  return (
    // The track's colour reaches focus rings and the topic chip, never an answer.
    <div style={trackStyle(topic.trackId)} className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-safe">
      <SessionHeader onClose={exit} closeLabel="Stop — this set is kept to finish later" progress={{ at: set.at, total: set.ids.length, states }} />

      <QuestionCard
        key={`${set.at}:${q.id}`}
        q={q}
        topic={topic}
        pending={set.pending}
        onSubmit={submit}
        onNext={next}
        isLast={set.at === set.ids.length - 1 && !again}
        comesBack={set.pending ? (again ? 'again at the end of this set' : backIn(progress, q.id)) : undefined}
      />
    </div>
  )
}

/** When the schedule brings a question back, in words. */
function backIn(p: ProgressState, id: string): string | undefined {
  const s = p.questions[id]
  if (!s) return undefined
  if (s.lastGrade === 'again') return 'back later today'
  return s.intervalDays <= 1 ? 'back tomorrow' : `back in ${s.intervalDays} days`
}

/** The verdict, and the tally parts that say how a select-all or a match went. */
function verdictOf(q: Question, answer: Answer, correct: boolean): { verdict: Verdict; tally: ReactNode[] } {
  if (q.kind === 'multi' && Array.isArray(answer)) {
    const right = new Set(q.correct)
    const found = answer.filter((i) => right.has(i)).length
    const missed = q.correct.length - found
    const extra = answer.length - found
    if (correct) return { verdict: 'correct', tally: [<span key="f" className="text-correct">All {found} found</span>] }
    const parts = [
      <span key="f" className="text-correct">
        {found} found
      </span>,
      missed > 0 && (
        <span key="m" className="text-correct">
          {missed} missed
        </span>
      ),
      extra > 0 && (
        <span key="e" className="text-alert">
          {extra} extra
        </span>
      ),
    ].filter(Boolean)
    return { verdict: found > 0 ? 'close' : 'wrong', tally: parts }
  }
  if (q.kind === 'match' && typeof answer === 'object' && !Array.isArray(answer)) {
    const right = q.pairs.filter((_, i) => answer[i] === i).length
    const tally = (
      <span key="p" className={right > 0 ? 'text-correct' : undefined}>
        {right} of {q.pairs.length} pairs right
      </span>
    )
    return { verdict: correct ? 'correct' : right > 0 ? 'close' : 'wrong', tally: [tally] }
  }
  return { verdict: correct ? 'correct' : 'wrong', tally: [] }
}

/** Joins tally parts with a middle dot, keeping each part's colour. */
function dotted(parts: ReactNode[]): ReactNode {
  return parts.flatMap((p, i) => (i ? [' · ', p] : [p]))
}

function QuestionCard({
  q,
  topic,
  pending,
  onSubmit,
  onNext,
  isLast,
  comesBack,
}: {
  q: Question
  topic: QuestionTopic
  pending?: QuestionSet['pending']
  onSubmit: (a: Answer) => void
  onNext: () => void
  isLast: boolean
  comesBack?: string
}) {
  const [picked, setPicked] = useState<number[]>([])
  const [pairs, setPairs] = useState<Record<number, number>>({})
  const answered = !!pending
  const heading = useRef<HTMLHeadingElement>(null)
  const answers = useRef<HTMLDivElement>(null)
  useStartAtTop(heading, answered)
  const canCheck = q.kind === 'multi' ? picked.length > 0 : q.kind === 'match' ? Object.keys(pairs).length === q.pairs.length : false
  const toggle = useCallback((i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i])), [])
  const check = () => onSubmit(q.kind === 'multi' ? picked : pairs)
  useEnterKey(answered, onNext, canCheck ? check : null)

  const given = pending?.answer
  const result = pending ? verdictOf(q, pending.answer, pending.correct) : null
  const tally = result ? [...result.tally, ...(comesBack ? [<span key="b">{comesBack}</span>] : [])] : []
  const section = q.section ? plainText(q.section) : undefined

  return (
    <>
      <div className="mt-3">
        <QuestionMeta kind={q.kind} trackId={topic.trackId} topic={topic.trackTitle ?? topic.title} />
      </div>
      {/* A glossary term in the prompt is a target inside a sentence: WCAG 2.5.8's inline exception. */}
      <h1 ref={heading} tabIndex={-1} data-target-exempt className="mt-4 text-[1.3125rem] leading-[1.3] font-bold tracking-[-0.015em] outline-none">
        <Inline text={q.prompt} />
      </h1>

      <div className="mt-5">
        {q.kind === 'single' && <SingleChoice q={q} given={given} onAnswer={onSubmit} groupRef={answers} />}
        {q.kind === 'truefalse' && <TrueFalse q={q} given={given} onAnswer={onSubmit} groupRef={answers} />}
        {q.kind === 'multi' && (
          <MultiChoice q={q} picked={picked} onToggle={toggle} given={answered ? (given as number[]) : undefined} groupRef={answers} />
        )}
        {q.kind === 'match' && (
          <MatchPairs q={q} pairs={pairs} onChange={setPairs} given={answered ? (given as Record<number, number>) : undefined} groupRef={answers} />
        )}
      </div>

      <div aria-hidden="true" className="h-6 shrink-0" />
      {pending && result ? (
        <Feedback
          verdict={result.verdict}
          tally={tally.length ? dotted(tally) : undefined}
          explain={q.explain}
          learnMore={{ href: topic.href, title: topic.title, sub: section ?? topic.trackTitle, trackId: topic.trackId }}
          onContinue={onNext}
          continueLabel={isLast ? 'See how it went' : 'Continue'}
          reveal={answers}
        />
      ) : q.kind === 'multi' || q.kind === 'match' ? (
        // The one action sits in the thumb zone and never scrolls away.
        <div className="sticky bottom-0 z-10 -mx-4 mt-auto bg-linear-to-t from-paper from-70% to-transparent px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <Button size="lg" onClick={check} disabled={!canCheck}>
            Check
          </Button>
        </div>
      ) : (
        <div aria-hidden="true" className="h-[calc(env(safe-area-inset-bottom)+1rem)] shrink-0" />
      )}
    </>
  )
}

function Summary({ set, req, onAnother, onExit }: { set: QuestionSet; req: SetRequest; onAnother: () => void; onExit: () => void }) {
  const { progress } = useProgress()
  // First answer per question: a requeued miss answered right later still counts as a miss.
  const first = new Map<string, boolean>()
  for (const r of set.results) if (!first.has(r.id)) first.set(r.id, r.correct)
  const right = [...first.values()].filter(Boolean).length
  const today = todayCount(progress)
  const goal = progress.dailyGoal
  const goalMet = today.answered >= goal
  const heading = useRef<HTMLHeadingElement>(null)
  useStartAtTop(heading)

  return (
    <div className="mx-auto max-w-lg px-4 pt-safe pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <SessionHeader onClose={onExit} closeLabel="Done — back to the question bank" />

      <p className="mt-4 text-[0.9375rem] font-semibold text-ink-2">{setLabel(req)}</p>
      <h1 ref={heading} tabIndex={-1} className="mt-1 text-[2.25rem] leading-[1.1] font-extrabold tracking-[-0.03em] outline-none tabular">
        {right} of {first.size} right
      </h1>
      <p className="mt-2 text-base text-ink-2">
        {right === first.size ? 'Every one, first time.' : 'Misses come back sooner; the ones you knew are spaced out.'}
      </p>
      <div className="mt-5">
        <SegmentedProgress
          total={first.size}
          done={first.size}
          states={[...first.values()].map((ok) => (ok ? 'correct' : 'wrong'))}
          label={`${right} of ${first.size} right first time`}
        />
      </div>

      <div className="mt-6 flex min-h-18 items-center justify-between gap-3 rounded-[22px] bg-surface px-4 py-3" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div>
          <p className="text-[0.875rem] font-semibold text-ink-2">Today</p>
          <p className="text-[1.5rem] leading-tight font-extrabold tracking-[-0.02em] tabular">
            {today.answered}
            <span className="text-[1rem] font-bold text-ink-3"> / {goal} answered</span>
          </p>
        </div>
        {goalMet ? (
          <Badge tone="correct">
            <Check size={14} strokeWidth={3} aria-hidden="true" />
            Goal met
          </Badge>
        ) : (
          <span className="text-[0.875rem] font-semibold text-ink-2 tabular">{goal - today.answered} to go</span>
        )}
      </div>

      <Group title="Your answers" className="mt-8">
        {[...first.entries()].map(([id, ok]) => {
          const q = getQuestion(id)
          if (!q) return null
          const topic = questionTopic(q)
          return (
            <Cell
              key={id}
              to={topic.href}
              leading={
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${ok ? 'bg-correct-soft text-correct' : 'bg-alert-soft text-alert'}`}
                >
                  {ok ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : <X size={15} strokeWidth={3} aria-hidden="true" />}
                  <span className="sr-only">{ok ? 'Right: ' : 'Missed: '}</span>
                </span>
              }
              title={<span className="line-clamp-2 text-[0.9375rem] font-semibold">{plainText(q.prompt)}</span>}
              sub={ok ? topic.title : `Read: ${topic.title}`}
            />
          )
        })}
      </Group>

      <div className="mt-8 flex flex-col gap-2.5">
        <Button size="lg" onClick={onAnother}>
          Another set
        </Button>
        <ButtonLink to="/questions" variant="secondary" size="lg">
          Done
        </ButtonLink>
      </div>
    </div>
  )
}

function EmptySet({ req, onExit }: { req: SetRequest; onExit: () => void }) {
  const why =
    req.scope === 'weak'
      ? 'No misses to drill here. That is the good kind of empty.'
      : req.scope === 'studied'
        ? 'Questions appear here once you have read a lesson they belong to.'
        : 'Nothing matches these filters.'
  const all = new URLSearchParams({ scope: 'all', size: String(req.size), ...(req.trackIds.length ? { tracks: req.trackIds.join(',') } : {}) })
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-safe pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <SessionHeader onClose={onExit} closeLabel="Back to the question bank" />
      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-surface-2 text-ink-2">
          <Inbox size={28} strokeWidth={2} />
        </span>
        <h1 className="mt-5 text-[1.625rem] font-extrabold tracking-[-0.025em]">Nothing to ask yet</h1>
        <p className="mt-2 max-w-[32ch] text-base text-balance text-ink-2">{why}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        {req.scope !== 'all' && (
          <ButtonLink to={`/questions/session?${all}`} size="lg">
            Try all topics instead
          </ButtonLink>
        )}
        <Button size="lg" variant={req.scope !== 'all' ? 'secondary' : 'primary'} onClick={onExit}>
          Back to the bank
        </Button>
      </div>
    </div>
  )
}
