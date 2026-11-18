import { useEffect, useMemo } from 'react'
import type { Question } from '../../content/types'
import { seededOrder } from '../../lib/bank'
import { plainText } from '../../lib/text'
import { OptionButton, type Mark } from './OptionButton'

type Multi = Extract<Question, { kind: 'multi' }>

/**
 * Select all that apply. Picks toggle; the session's Check submits. Afterwards every
 * option says what it was: right and picked, right and missed, wrong and picked.
 */
export function MultiChoice({
  q,
  picked,
  onToggle,
  given,
}: {
  q: Multi
  picked: number[]
  onToggle: (i: number) => void
  /** The submitted picks, once checked. */
  given?: number[]
}) {
  const order = useMemo(() => seededOrder(q.id, q.options.length), [q.id, q.options.length])
  const answered = given !== undefined
  const chosen = new Set(given ?? picked)
  const right = new Set(q.correct)

  useEffect(() => {
    if (answered) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const pos = Number(e.key) - 1
      if (Number.isInteger(pos) && pos >= 0 && pos < order.length) {
        e.preventDefault()
        onToggle(order[pos])
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [answered, order, onToggle])

  return (
    <div role="group" aria-label="Select all that apply" className="flex flex-col gap-2.5">
      {order.map((i, pos) => {
        const on = chosen.has(i)
        const mark: Mark = !answered
          ? on
            ? 'selected'
            : 'idle'
          : right.has(i)
            ? on
              ? 'correct'
              : 'missed'
            : on
              ? 'wrong'
              : 'dim'
        return (
          <OptionButton key={i} n={pos + 1} mark={mark} disabled={answered} onClick={() => onToggle(i)} role="checkbox" checked={on}>
            {plainText(q.options[i])}
          </OptionButton>
        )
      })}
    </div>
  )
}
