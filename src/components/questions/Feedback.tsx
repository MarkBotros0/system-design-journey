import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Check, X } from 'lucide-react'
import type { QuestionTopic } from '../../content/bank'
import { Inline } from '../content/Inline'

/**
 * Right or wrong, why, and where to read more. Focus moves here when it appears, so a
 * screen reader hears the verdict and Enter (handled by the session) moves on.
 */
export function Feedback({ correct, explain, topic }: { correct: boolean; explain: string; topic: QuestionTopic }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
    // An explicit 'smooth' would override the global reduced-motion reset, so ask first.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ref.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [])

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-label={correct ? 'Correct' : 'Not quite'}
      // Room for the sticky Next bar, so scrolling it into view never leaves "Learn more" underneath.
      className={`mt-5 scroll-mb-32 rounded-2xl border p-4 outline-none ${correct ? 'border-correct/50 bg-correct-soft/50' : 'border-alert/50 bg-alert-soft/50'}`}
    >
      <p className={`flex items-center gap-1.5 text-[0.9375rem] font-semibold ${correct ? 'text-correct' : 'text-alert'}`}>
        {correct ? <Check size={17} strokeWidth={2.5} aria-hidden="true" /> : <X size={17} strokeWidth={2.5} aria-hidden="true" />}
        {correct ? 'Right' : 'Not quite'}
      </p>
      <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink">
        <Inline text={explain} />
      </p>
      <Link
        to={topic.href}
        className="-mx-2 mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-[0.875rem] font-medium text-line hover:bg-line-soft"
      >
        <BookOpen size={16} strokeWidth={1.9} aria-hidden="true" />
        <span>
          Learn more<span className="text-ink-2"> · {topic.title}</span>
        </span>
      </Link>
    </section>
  )
}
