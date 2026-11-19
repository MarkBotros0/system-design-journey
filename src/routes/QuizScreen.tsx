import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getModule, getTrack } from '../content'
import type { Module, QuizItem } from '../content/types'
import { useProgress } from '../state/ProgressProvider'
import { QUIZ_PASS } from '../lib/progress'
import { plainText } from '../lib/text'
import { Inline } from '../components/content/Inline'
import { ButtonLink } from '../components/ui/Button'
import { TrackChip } from '../components/ui/TrackIcon'
import { trackStyle } from '../components/ui/trackStyle'
import { AnswerOption, type Mark } from '../components/questions/AnswerOption'
import { Feedback } from '../components/questions/Feedback'
import { QuestionMeta, SessionHeader } from '../components/questions/SessionChrome'
import { ScoreRing } from '../components/questions/ScoreRing'
import { useEnterKey, useStartAtTop } from '../components/questions/useStartAtTop'

/** Deterministic per mount, so options do not reshuffle under the user mid-question. */
function shuffled<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** A lesson's own quiz: the same frame as a question set, scored against the pass bar. */
export function QuizScreen() {
  const { moduleId } = useParams()
  const module = getModule(moduleId)
  const { recordQuiz } = useProgress()
  const navigate = useNavigate()

  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  /** Right or wrong per question answered, in order. */
  const [results, setResults] = useState<boolean[]>([])
  const [finished, setFinished] = useState(false)

  const questions = useMemo(() => (module ? module.quiz : []), [module])
  const options = useMemo(() => {
    const q = questions[index]
    if (!q) return []
    return shuffled(q.options.map((text, i) => ({ text, isCorrect: i === q.correct })))
  }, [questions, index])

  if (!module) return <Navigate to="/" replace />
  if (!questions.length) return <Navigate to={`/m/${module.id}`} replace />

  const correctCount = results.filter(Boolean).length
  const isLast = index === questions.length - 1

  function choose(i: number) {
    if (picked !== null) return
    setPicked(i)
    setResults((r) => [...r, options[i].isCorrect])
  }

  function advance() {
    if (isLast) {
      recordQuiz(module!.id, correctCount / questions.length)
      setFinished(true)
    } else {
      setIndex((i) => i + 1)
      setPicked(null)
    }
  }

  if (finished) return <QuizResult module={module} correct={correctCount} total={questions.length} />

  return (
    <div style={trackStyle(module.trackId)} className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-safe">
      <SessionHeader
        onClose={() => navigate(`/m/${module.id}`)}
        closeLabel="Leave the quiz"
        progress={{ at: index, total: questions.length, states: results.map((ok) => (ok ? 'correct' : 'wrong')) }}
      />
      <QuizQuestion
        key={index}
        item={questions[index]}
        trackId={module.trackId}
        options={options}
        picked={picked}
        onPick={choose}
        onNext={advance}
        isLast={isLast}
      />
    </div>
  )
}

function QuizQuestion({
  item,
  trackId,
  options,
  picked,
  onPick,
  onNext,
  isLast,
}: {
  item: QuizItem
  trackId: string
  options: { text: string; isCorrect: boolean }[]
  picked: number | null
  onPick: (i: number) => void
  onNext: () => void
  isLast: boolean
}) {
  const answered = picked !== null
  const heading = useRef<HTMLHeadingElement>(null)
  const answers = useRef<HTMLDivElement>(null)
  useStartAtTop(heading)
  useEnterKey(answered, onNext, null)

  // Keys 1–4 pick by on-screen position, as in a question set.
  useEffect(() => {
    if (answered) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const pos = Number(e.key) - 1
      if (Number.isInteger(pos) && pos >= 0 && pos < options.length) {
        e.preventDefault()
        onPick(pos)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [answered, options.length, onPick])

  return (
    <>
      <div className="mt-3">
        <QuestionMeta kind="single" trackId={trackId} topic={getTrack(trackId)?.title ?? 'Lesson quiz'} />
      </div>
      <h1 ref={heading} tabIndex={-1} data-target-exempt className="mt-4 text-[1.3125rem] leading-[1.3] font-bold tracking-[-0.015em] outline-none">
        <Inline text={item.stem} />
      </h1>

      <div ref={answers} role="group" aria-label="Answers" className="mt-5 flex flex-col gap-3.5">
        {options.map((opt, i) => {
          const mark: Mark = !answered ? 'idle' : opt.isCorrect ? (picked === i ? 'hit' : 'key') : picked === i ? 'wrong' : 'dim'
          return (
            <AnswerOption key={i} n={i + 1} mark={mark} disabled={answered} onClick={() => onPick(i)}>
              {plainText(opt.text)}
            </AnswerOption>
          )
        })}
      </div>

      <div aria-hidden="true" className="h-6 shrink-0" />
      {answered ? (
        <Feedback
          verdict={options[picked].isCorrect ? 'correct' : 'wrong'}
          explain={item.explain}
          onContinue={onNext}
          continueLabel={isLast ? 'See your score' : 'Continue'}
          reveal={answers}
        />
      ) : (
        <div aria-hidden="true" className="h-[calc(env(safe-area-inset-bottom)+1rem)] shrink-0" />
      )}
    </>
  )
}

function QuizResult({ module, correct, total }: { module: Module; correct: number; total: number }) {
  const navigate = useNavigate()
  const score = correct / total
  const passed = score >= QUIZ_PASS
  const heading = useRef<HTMLHeadingElement>(null)
  useStartAtTop(heading)
  const lesson = `/m/${module.id}`

  return (
    <div style={trackStyle(module.trackId)} className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-safe pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <SessionHeader onClose={() => navigate(lesson)} closeLabel="Back to the lesson" />

      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <TrackChip trackId={module.trackId} label={plainText(module.title)} />
        <h1 ref={heading} tabIndex={-1} className="mt-4 text-[2rem] leading-[1.1] font-extrabold tracking-[-0.03em] outline-none tabular">
          {correct} of {total} right
        </h1>
        <div className="mt-7">
          <ScoreRing value={score} pass={QUIZ_PASS} label="Quiz score" />
        </div>
        <p className="mt-7 max-w-[32ch] text-base text-balance text-ink-2">
          {passed
            ? 'Passed. This lesson now counts as done on your route.'
            : `${Math.round(QUIZ_PASS * 100)}% passes — worth another read before you retry.`}
        </p>
      </div>

      {/* The next step leads: on a pass, onwards; short of it, back to the lesson. */}
      <div className="flex flex-col gap-2.5">
        <ButtonLink to={passed ? '/' : lesson} size="lg">
          {passed ? 'Back to Home' : 'Reread the lesson'}
        </ButtonLink>
        <ButtonLink to={passed ? lesson : '/'} variant="secondary" size="lg">
          {passed ? 'Reread the lesson' : 'Back to Home'}
        </ButtonLink>
      </div>
    </div>
  )
}
