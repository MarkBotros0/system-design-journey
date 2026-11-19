import { useEffect, type Ref } from 'react'
import { Check, X } from 'lucide-react'
import type { Question } from '../../content/types'
import type { Answer } from '../../lib/bank'

type TF = Extract<Question, { kind: 'truefalse' }>

/** Two big targets side by side — the quickest answer there is. Keys T and F. */
export function TrueFalse({
  q,
  given,
  onAnswer,
  groupRef,
}: {
  q: TF
  given?: Answer
  onAnswer: (a: boolean) => void
  groupRef?: Ref<HTMLDivElement>
}) {
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
    <div ref={groupRef} role="group" aria-label="True or false" className="grid grid-cols-2 gap-3">
      {[true, false].map((v) => {
        const right = answered && v === q.answer
        const wrong = answered && given === v && v !== q.answer
        const cls = right ? 'bg-correct-soft' : wrong ? 'bg-alert-soft' : answered ? 'bg-surface text-ink-3' : 'bg-surface hover:bg-surface-2'
        const label = v ? 'True' : 'False'
        return (
          <button
            key={label}
            type="button"
            disabled={answered}
            data-mark={right ? (given === v ? 'hit' : 'key') : wrong ? 'wrong' : answered ? 'dim' : 'idle'}
            onClick={() => onAnswer(v)}
            className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-[22px] px-3 text-[1.25rem] font-bold tracking-[-0.01em] transition-[background-color,transform] duration-150 enabled:active:scale-[0.97] disabled:cursor-default motion-reduce:enabled:active:scale-100 ${cls}`}
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            {right ? (
              <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-correct text-paper">
                <Check size={17} strokeWidth={3} />
              </span>
            ) : wrong ? (
              <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-alert text-paper">
                <X size={17} strokeWidth={3} />
              </span>
            ) : (
              <span
                aria-hidden="true"
                className={`flex h-7 min-w-7 items-center justify-center rounded-lg bg-surface-3 text-[0.875rem] font-bold text-ink-2 ${answered ? 'opacity-60' : ''}`}
              >
                {label[0]}
              </span>
            )}
            {label}
            {right && <span className="sr-only"> — the right answer{given === v ? ', and yours' : ''}</span>}
            {wrong && <span className="sr-only"> — your answer, wrong</span>}
          </button>
        )
      })}
    </div>
  )
}
