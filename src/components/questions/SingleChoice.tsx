import { useEffect, useMemo } from 'react'
import type { Question } from '../../content/types'
import { seededOrder, type Answer } from '../../lib/bank'
import { plainText } from '../../lib/text'
import { OptionButton, type Mark } from './OptionButton'

type Single = Extract<Question, { kind: 'single' }>

/** One right answer; a tap answers. Keys 1–4 pick by on-screen position. */
export function SingleChoice({ q, given, onAnswer }: { q: Single; given?: Answer; onAnswer: (a: number) => void }) {
  const order = useMemo(() => seededOrder(q.id, q.options.length), [q.id, q.options.length])
  const answered = given !== undefined

  useEffect(() => {
    if (answered) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const pos = Number(e.key) - 1
      if (Number.isInteger(pos) && pos >= 0 && pos < order.length) {
        e.preventDefault()
        onAnswer(order[pos])
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [answered, order, onAnswer])

  return (
    <div role="group" aria-label="Answers" className="flex flex-col gap-2.5">
      {order.map((i, pos) => {
        const mark: Mark = !answered ? 'idle' : i === q.correct ? 'correct' : given === i ? 'wrong' : 'dim'
        return (
          <OptionButton key={i} n={pos + 1} mark={mark} disabled={answered} onClick={() => onAnswer(i)}>
            {plainText(q.options[i])}
          </OptionButton>
        )
      })}
    </div>
  )
}
