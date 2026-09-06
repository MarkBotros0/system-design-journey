import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Clock } from 'lucide-react'
import { getModule } from '../content'
import { useProgress } from '../state/ProgressProvider'
import { hasReadLesson, moduleStatus, quizPassed, QUIZ_PASS } from '../lib/progress'
import { Blocks } from '../components/content/Blocks'
import { Button, ButtonLink } from '../components/ui/Button'
import { Badge } from '../components/ui/Bits'

export function ModuleScreen() {
  const { moduleId } = useParams()
  const module = getModule(moduleId)
  const { progress, markLessonRead } = useProgress()

  if (!module) return <Navigate to="/" replace />

  const read = hasReadLesson(progress, module.id)
  const passed = quizPassed(progress, module.id)
  const status = moduleStatus(progress, module)
  const best = progress.quiz[module.id]?.best

  return (
    <article>
      <Link
        to="/"
        className="-ml-1 mb-5 inline-flex min-h-11 items-center gap-1.5 pr-2 text-[0.875rem] text-ink-2 hover:text-ink"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        The line
      </Link>

      <header className="mb-7">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-ink-3">
            Station {String(module.station).padStart(2, '0')}
          </span>
          {status === 'mastered' && <Badge tone="mastered">Mastered</Badge>}
          {status === 'passed' && <Badge tone="line">Passed</Badge>}
        </div>
        <h1 className="text-[1.75rem] leading-tight font-semibold">{module.title}</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-2">{module.summary}</p>
        <p className="mt-3 flex items-center gap-1.5 font-mono text-[0.75rem] text-ink-3">
          <Clock size={13} strokeWidth={2} />
          {module.minutes} min
        </p>
      </header>

      <Blocks blocks={module.lesson} />

      <div className="mt-10 border-t border-hairline pt-6">
        {!read ? (
          <>
            <p className="mb-3 text-[0.9375rem] text-ink-2">
              Finished reading? Mark it, then check it stuck.
            </p>
            <Button size="lg" onClick={() => markLessonRead(module.id)}>
              Mark as read
            </Button>
          </>
        ) : (
          <>
            <p className="mb-3 flex items-center gap-2 text-[0.9375rem] text-ink-2">
              <Check size={16} strokeWidth={2.5} className="text-mastered" />
              Read.{' '}
              {passed
                ? `Quiz passed at ${Math.round((best ?? 0) * 100)}%.`
                : best !== undefined
                  ? `Best quiz score ${Math.round(best * 100)}% — ${Math.round(QUIZ_PASS * 100)}% passes.`
                  : 'Now the quiz.'}
            </p>
            <ButtonLink to={`/m/${module.id}/quiz`} size="lg">
              {best === undefined ? 'Take the quiz' : passed ? 'Retake the quiz' : 'Try again'}
            </ButtonLink>
          </>
        )}

        {module.cards.length > 0 && (
          <p className="mt-4 text-[0.8125rem] text-ink-3">
            {module.cards.length} card{module.cards.length === 1 ? '' : 's'} from this station join
            your drill deck once you have read it.
          </p>
        )}
      </div>
    </article>
  )
}
