import { useEffect } from 'react'
import { Check, X } from 'lucide-react'
import type { Question } from '../../content/types'
import type { Answer } from '../../lib/bank'

type TF = Extract<Question, { kind: 'truefalse' }>

/** Two big targets side by side — the quickest answer there is. Keys T and F. */
export function TrueFalse({ q, given, onAnswer }: { q: TF; given?: Answer; onAnswer: (a: boolean) => void }) {
  const answered = given !== undefined

  useEffect(() => {
    if (answered) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 't' || k === 'f') {
        e.preventDefault()
        onAnswer(k === 't')
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [answered, onAnswer])

  return (
    <div role="group" aria-label="True or false" className="grid grid-cols-2 gap-2.5">
      {[true, false].map((v) => {
        const cls = !answered
          ? 'border-hairline bg-surface hover:border-line'
          : v === q.answer
            ? 'border-mastered bg-mastered-soft'
            : given === v
              ? 'border-alert bg-alert-soft'
              : 'border-hairline bg-surface opacity-55'
        const label = v ? 'True' : 'False'
        return (
          <button
            key={label}
            type="button"
            disabled={answered}
            onClick={() => onAnswer(v)}
            className={`flex min-h-16 items-center justify-center gap-2 rounded-2xl border text-[1.0625rem] font-semibold transition-colors duration-150 disabled:cursor-default ${cls}`}
          >
            {answered && v === q.answer && <Check size={18} strokeWidth={2.5} aria-hidden="true" className="text-mastered" />}
            {answered && given === v && v !== q.answer && <X size={18} strokeWidth={2.5} aria-hidden="true" className="text-alert" />}
            {label}
            {answered && v === q.answer && <span className="sr-only"> — correct</span>}
            <kbd aria-hidden="true" className="hidden font-mono text-[0.6875rem] font-normal text-ink-3 sm:inline">
              {label[0]}
            </kbd>
          </button>
        )
      })}
    </div>
  )
}
