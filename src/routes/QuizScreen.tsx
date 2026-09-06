import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { getModule } from '../content'
import { useProgress } from '../state/ProgressProvider'
import { QUIZ_PASS } from '../lib/progress'
import { Inline } from '../components/content/Inline'
import { Button, ButtonLink } from '../components/ui/Button'
import { Meter } from '../components/ui/Bits'

/** Deterministic per mount, so options do not reshuffle under the user mid-question. */
function shuffled<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function QuizScreen() {
  const { moduleId } = useParams()
  const module = getModule(moduleId)
  const { recordQuiz } = useProgress()
  const navigate = useNavigate()

  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)

  const questions = useMemo(() => (module ? module.quiz : []), [module])
  const options = useMemo(() => {
    const q = questions[index]
    if (!q) return []
    return shuffled(q.options.map((text, i) => ({ text, isCorrect: i === q.correct })))
  }, [questions, index])

  if (!module) return <Navigate to="/" replace />
  if (!questions.length) return <Navigate to={`/m/${module.id}`} replace />

  const question = questions[index]
  const answered = picked !== null
  const isLast = index === questions.length - 1

  function choose(i: number) {
    if (answered) return
    setPicked(i)
    if (options[i].isCorrect) setCorrectCount((n) => n + 1)
  }

  function advance() {
    if (isLast) {
      const score = correctCount / questions.length
      recordQuiz(module!.id, score)
      setFinished(true)
    } else {
      setIndex((i) => i + 1)
      setPicked(null)
    }
  }

  if (finished) {
    const score = correctCount / questions.length
    const passed = score >= QUIZ_PASS
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 pt-screen pb-10">
        <p className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-ink-3">
          {module.title}
        </p>
        <h1 className="mt-2 text-[2rem] leading-tight font-semibold">
          {correctCount} of {questions.length}
        </h1>
        <p className={`mt-2 text-[0.9375rem] ${passed ? 'text-mastered' : 'text-ink-2'}`}>
          {passed
            ? 'Passed. The next station is open.'
            : `${Math.round(QUIZ_PASS * 100)}% passes — worth another read before you retry.`}
        </p>
        <div className="mt-4">
          <Meter value={score} tone={passed ? 'mastered' : 'line'} label="Quiz score" />
        </div>

        <div className="mt-8 flex flex-col gap-2.5">
          <ButtonLink to="/" size="lg">
            Back to the line
          </ButtonLink>
          <ButtonLink to={`/m/${module.id}`} variant="secondary" size="lg">
            Reread the station
          </ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-screen pb-8">
      <header className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="font-mono text-[0.6875rem] text-ink-3 tabular">
            {index + 1} / {questions.length}
          </span>
          <button
            onClick={() => navigate(`/m/${module.id}`)}
            className="-mr-2 flex min-h-11 min-w-11 items-center justify-center text-ink-3 hover:text-ink"
            aria-label="Leave the quiz"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>
        <Meter value={index / questions.length} label="Quiz progress" />
      </header>

      <h1 className="mb-6 text-[1.25rem] leading-snug font-semibold">
        <Inline text={question.stem} />
      </h1>

      <div className="flex flex-col gap-2.5" role="group" aria-label="Answers">
        {options.map((opt, i) => {
          const chosen = picked === i
          let cls = 'border-hairline bg-surface hover:border-line'
          if (answered) {
            if (opt.isCorrect) cls = 'border-mastered bg-mastered-soft'
            else if (chosen) cls = 'border-alert bg-alert-soft'
            else cls = 'border-hairline bg-surface opacity-55'
          }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={answered}
              className={`flex min-h-13 items-start gap-3 rounded-xl border px-4 py-3 text-left text-[0.9375rem] leading-relaxed transition-colors duration-150 disabled:cursor-default ${cls}`}
            >
              <span className="flex-1">
                <Inline text={opt.text} />
              </span>
              {answered && opt.isCorrect && (
                <Check size={17} strokeWidth={2.5} className="mt-0.5 shrink-0 text-mastered" />
              )}
              {answered && chosen && !opt.isCorrect && (
                <X size={17} strokeWidth={2.5} className="mt-0.5 shrink-0 text-alert" />
              )}
            </button>
          )
        })}
      </div>

      {answered && (
        <div className="mt-5 rounded-xl border-l-2 border-line bg-line-soft py-3 pr-4 pl-4">
          <p className="text-[0.875rem] leading-relaxed text-ink">
            <Inline text={question.explain} />
          </p>
        </div>
      )}

      <div className="mt-auto pt-6">
        <Button size="lg" disabled={!answered} onClick={advance}>
          {isLast ? 'See your score' : 'Next question'}
        </Button>
      </div>
    </div>
  )
}
