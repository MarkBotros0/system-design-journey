import { useEffect, useMemo, type Ref } from 'react'
import type { Question } from '../../content/types'
import { seededOrder, type Answer } from '../../lib/bank'
import { plainText } from '../../lib/text'
import { AnswerOption, type Mark } from './AnswerOption'

type Single = Extract<Question, { kind: 'single' }>

/** One right answer; a tap answers. Keys 1–4 pick by on-screen position. */
export function SingleChoice({
  q,
  given,
  onAnswer,
  groupRef,
}: {
  q: Single
  given?: Answer
  onAnswer: (a: number) => void
  groupRef?: Ref<HTMLDivElement>
}) {
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
    <div ref={groupRef} role="group" aria-label="Answers" className="flex flex-col gap-3.5">
      {order.map((i, pos) => {
        const mark: Mark = !answered ? 'idle' : i === q.correct ? (given === i ? 'hit' : 'key') : given === i ? 'wrong' : 'dim'
        return (
          <AnswerOption key={i} n={pos + 1} mark={mark} disabled={answered} onClick={() => onAnswer(i)}>
            {plainText(q.options[i])}
          </AnswerOption>
        )
      })}
    </div>
  )
}
