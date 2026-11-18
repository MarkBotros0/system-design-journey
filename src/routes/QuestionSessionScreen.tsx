import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { getQuestion, questionTopic } from '../content/bank'
import type { Question, QuestionKind } from '../content/types'
import {
  advanceSet,
  buildSet,
  isCorrect,
  isFinished,
  loadSet,
  saveSet,
  setLabel,
  setRequest,
  setSource,
  todayCount,
  type Answer,
  type QuestionSet,
  type SetRequest,
} from '../lib/bank'
import type { ProgressState } from '../lib/storage'
import { plainText } from '../lib/text'
import { useProgress } from '../state/ProgressProvider'
import { Inline } from '../components/content/Inline'
import { Button, ButtonLink } from '../components/ui/Button'
import { Meter } from '../components/ui/Bits'
import { SingleChoice } from '../components/questions/SingleChoice'
import { MultiChoice } from '../components/questions/MultiChoice'
import { TrueFalse } from '../components/questions/TrueFalse'
import { MatchPairs } from '../components/questions/MatchPairs'
import { Feedback } from '../components/questions/Feedback'

const KIND_HINT: Record<QuestionKind, string> = {
  single: 'Pick one',
  multi: 'Select all that apply',
  truefalse: 'True or false',
  match: 'Match the pairs',
}
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
  if (isFinished(set)) return <Summary set={set} req={req} onAnother={another} />

  const q = getQuestion(set.ids[set.at])
  if (!q) return <EmptySet req={req} onExit={exit} />
  const topic = questionTopic(q)

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-screen">
      <header className="mb-5">
        <div className="mb-2.5 flex items-center gap-3">
          <button
            type="button"
            onClick={exit}
            aria-label="Stop — this set is kept to finish later"
            className="-ml-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            <X size={19} strokeWidth={2} />
          </button>
          <span className="min-w-0 flex-1 truncate font-mono text-[0.6875rem] tracking-[0.12em] text-ink-3 uppercase">{setLabel(req)}</span>
          <span className="font-mono text-[0.75rem] text-ink-3 tabular">
            {set.at + 1} / {set.ids.length}
          </span>
        </div>
        <Meter value={set.at / set.ids.length} label="Set progress" />
      </header>

      <QuestionCard
        key={`${set.at}:${q.id}`}
        q={q}
        topicLine={topic.trackTitle ? `${topic.trackTitle} · ${topic.title}` : topic.title}
        pending={set.pending}
        onSubmit={submit}
        onNext={next}
        isLast={set.at === set.ids.length - 1}
      />
    </div>
  )
}

function QuestionCard({
  q,
  topicLine,
  pending,
  onSubmit,
  onNext,
  isLast,
}: {
  q: Question
  topicLine: string
  pending?: QuestionSet['pending']
  onSubmit: (a: Answer) => void
  onNext: () => void
  isLast: boolean
}) {
  const [picked, setPicked] = useState<number[]>([])
  const [pairs, setPairs] = useState<Record<number, number>>({})
  const answered = !!pending
  const canCheck = q.kind === 'multi' ? picked.length > 0 : q.kind === 'match' ? Object.keys(pairs).length === q.pairs.length : false
  const toggle = useCallback((i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i])), [])
  const check = () => onSubmit(q.kind === 'multi' ? picked : pairs)

  // Enter checks or moves on — unless focus is on a control, which Enter already activates.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && /^(BUTTON|A|SUMMARY|INPUT|TEXTAREA)$/.test(t.tagName)) return
      if (answered) {
        e.preventDefault()
        onNext()
      } else if (canCheck) {
        e.preventDefault()
        onSubmit(q.kind === 'multi' ? picked : pairs)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [answered, canCheck, onNext, onSubmit, picked, pairs, q.kind])

  const given = pending?.answer

  return (
    <>
      <p className="font-mono text-[0.6875rem] tracking-[0.1em] text-ink-3 uppercase">{topicLine}</p>
      <h1 className="mt-2 text-[1.25rem] leading-snug font-semibold">
        <Inline text={q.prompt} />
      </h1>
      <p className="mt-2 mb-4 text-[0.8125rem] font-medium text-line">{KIND_HINT[q.kind]}</p>

      {q.kind === 'single' && <SingleChoice q={q} given={given} onAnswer={onSubmit} />}
      {q.kind === 'truefalse' && <TrueFalse q={q} given={given} onAnswer={onSubmit} />}
      {q.kind === 'multi' && <MultiChoice q={q} picked={picked} onToggle={toggle} given={answered ? (given as number[]) : undefined} />}
      {q.kind === 'match' && (
        <MatchPairs q={q} pairs={pairs} onChange={setPairs} given={answered ? (given as Record<number, number>) : undefined} />
      )}

      {pending && <Feedback correct={pending.correct} explain={q.explain} topic={questionTopic(q)} />}

      {/* The one action sits in the thumb zone and never scrolls away. */}
      <div className="sticky bottom-0 -mx-4 mt-auto bg-paper/95 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {answered ? (
          <Button size="lg" onClick={onNext}>
            {isLast ? 'See how it went' : 'Next'}
          </Button>
        ) : q.kind === 'multi' || q.kind === 'match' ? (
          <Button size="lg" onClick={check} disabled={!canCheck}>
            Check
          </Button>
        ) : (
          <p className="py-3 text-center text-[0.8125rem] text-ink-3">Tap an answer</p>
        )}
      </div>
    </>
  )
}

function Summary({ set, req, onAnother }: { set: QuestionSet; req: SetRequest; onAnother: () => void }) {
  const { progress } = useProgress()
  // First answer per question: a requeued miss answered right later still counts as a miss.
  const first = new Map<string, boolean>()
  for (const r of set.results) if (!first.has(r.id)) first.set(r.id, r.correct)
  const right = [...first.values()].filter(Boolean).length
  const today = todayCount(progress)
  const goalMet = today.answered >= progress.dailyGoal

  return (
    <div className="mx-auto max-w-lg px-4 pt-screen pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <p className="font-mono text-[0.6875rem] tracking-[0.12em] text-ink-3 uppercase">{setLabel(req)}</p>
      <h1 className="mt-2 text-[2rem] leading-tight font-semibold">
        {right} of {first.size} right
      </h1>
      <p className="mt-1 text-[0.9375rem] text-ink-2">
        {right === first.size ? 'Every one, first time.' : 'Misses come back sooner; the ones you knew are spaced out.'}
      </p>
      <div className="mt-4">
        <Meter value={first.size ? right / first.size : 0} tone={right === first.size ? 'mastered' : 'line'} label="Answered right first time" />
      </div>
      <p className="mt-3 font-mono text-[0.75rem] text-ink-3 tabular">
        Today: {today.answered} answered · goal {progress.dailyGoal}
        {goalMet && <span className="text-mastered"> · met</span>}
      </p>

      <ul className="mt-6 flex flex-col divide-y divide-hairline rounded-2xl border border-hairline bg-surface" aria-label="Your answers">
        {[...first.entries()].map(([id, ok]) => {
          const q = getQuestion(id)
          if (!q) return null
          const topic = questionTopic(q)
          return (
            <li key={id} className="flex items-start gap-3 px-4 py-3">
              {ok ? (
                <Check size={16} strokeWidth={2.5} aria-label="Right" className="mt-0.5 shrink-0 text-mastered" />
              ) : (
                <X size={16} strokeWidth={2.5} aria-label="Missed" className="mt-0.5 shrink-0 text-alert" />
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[0.875rem] leading-snug">{plainText(q.prompt)}</p>
                <Link to={topic.href} className="-mx-1 inline-flex min-h-9 items-center rounded px-1 text-[0.8125rem] text-line hover:bg-line-soft">
                  {ok ? topic.title : `Read: ${topic.title}`}
                </Link>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 flex flex-col gap-2.5">
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
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 pt-screen pb-10">
      <h1 className="text-[1.5rem] font-semibold">Nothing to ask yet</h1>
      <p className="mt-2 text-[0.9375rem] text-ink-2">{why}</p>
      <div className="mt-6 flex flex-col gap-2.5">
        {req.scope !== 'all' && (
          <ButtonLink to={`/questions/session?${all}`} size="lg">
            Try all topics instead
          </ButtonLink>
        )}
        <Button size="lg" variant="secondary" onClick={onExit}>
          Back to the bank
        </Button>
      </div>
    </div>
  )
}
