import { useMemo, useState } from 'react'
import { ArrowRight, Check, X } from 'lucide-react'
import type { Question } from '../../content/types'
import { partnerOrder } from '../../lib/bank'
import { plainText } from '../../lib/text'

type Match = Extract<Question, { kind: 'match' }>
type Side = 'left' | 'right'

/**
 * Tap one item, then its partner — either side first. Tapping a paired item unpairs it.
 * No dragging: it is unreliable on a moving train and invisible to a screen reader, and
 * every item here is an ordinary button, so a keyboard pairs with Tab and Enter.
 *
 * `pairs` maps a left index to a right index, both as authored; the right column is shown
 * in a stable shuffled order. Once checked, the columns become a list of the right pairs.
 */
export function MatchPairs({
  q,
  pairs,
  onChange,
  given,
}: {
  q: Match
  pairs: Record<number, number>
  onChange: (next: Record<number, number>) => void
  given?: Record<number, number>
}) {
  const rightOrder = useMemo(() => partnerOrder(q.id, q.pairs.length), [q.id, q.pairs.length])
  const [selected, setSelected] = useState<{ side: Side; i: number } | null>(null)

  if (given) return <MatchResult q={q} given={given} />

  const leftOf = (j: number) => {
    const hit = Object.entries(pairs).find(([, r]) => r === j)
    return hit ? Number(hit[0]) : undefined
  }
  const pairNo = (left: number) => left + 1

  function link(left: number, right: number) {
    const next: Record<number, number> = {}
    for (const [l, r] of Object.entries(pairs)) if (r !== right && Number(l) !== left) next[Number(l)] = r
    next[left] = right
    onChange(next)
    setSelected(null)
  }

  function unlink(left: number) {
    const next = { ...pairs }
    delete next[left]
    onChange(next)
  }

  function tap(side: Side, i: number) {
    if (selected?.side === side && selected.i === i) return setSelected(null)
    if (selected && selected.side !== side) {
      return side === 'left' ? link(i, selected.i) : link(selected.i, i)
    }
    const paired = side === 'left' ? (pairs[i] !== undefined ? i : undefined) : leftOf(i)
    if (paired !== undefined) unlink(paired)
    setSelected({ side, i })
  }

  const item = (side: Side, i: number, text: string, pairedLeft: number | undefined, partner: string | undefined) => {
    const isSel = selected?.side === side && selected.i === i
    const cls = isSel
      ? 'border-line bg-surface ring-2 ring-line/40'
      : pairedLeft !== undefined
        ? 'border-line bg-line-soft'
        : 'border-hairline bg-surface hover:border-line'
    return (
      <button
        key={`${side}${i}`}
        type="button"
        aria-pressed={isSel}
        aria-label={`${plainText(text)}${partner ? `, paired with ${plainText(partner)}` : ''}`}
        onClick={() => tap(side, i)}
        className={`flex min-h-13 w-full items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-[0.875rem] leading-snug transition-colors duration-150 ${cls}`}
      >
        {pairedLeft !== undefined && (
          <span
            aria-hidden="true"
            className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-line font-mono text-[0.6875rem] font-semibold text-line-ink"
          >
            {pairNo(pairedLeft)}
          </span>
        )}
        <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{plainText(text)}</span>
      </button>
    )
  }

  const done = Object.keys(pairs).length
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <div role="group" aria-label="Items" className="flex flex-col gap-2">
          {q.pairs.map((p, i) => item('left', i, p.left, pairs[i] !== undefined ? i : undefined, pairs[i] !== undefined ? q.pairs[pairs[i]].right : undefined))}
        </div>
        <div role="group" aria-label="Partners" className="flex flex-col gap-2">
          {rightOrder.map((j) => {
            const l = leftOf(j)
            return item('right', j, q.pairs[j].right, l, l !== undefined ? q.pairs[l].left : undefined)
          })}
        </div>
      </div>
      <p className="mt-3 font-mono text-[0.75rem] text-ink-3 tabular" aria-live="polite">
        {done} of {q.pairs.length} paired
        {selected ? ` · now tap its partner` : ''}
      </p>
    </div>
  )
}

function MatchResult({ q, given }: { q: Match; given: Record<number, number> }) {
  return (
    <ul className="flex flex-col gap-2" aria-label="The pairs">
      {q.pairs.map((p, i) => {
        const ok = given[i] === i
        const yours = given[i] !== undefined && !ok ? q.pairs[given[i]].right : undefined
        return (
          <li
            key={i}
            className={`rounded-xl border px-3.5 py-2.5 text-[0.875rem] leading-snug ${ok ? 'border-mastered bg-mastered-soft' : 'border-alert bg-alert-soft'}`}
          >
            <div className="flex items-start gap-2">
              {ok ? (
                <Check size={16} strokeWidth={2.5} aria-hidden="true" className="mt-0.5 shrink-0 text-mastered" />
              ) : (
                <X size={16} strokeWidth={2.5} aria-hidden="true" className="mt-0.5 shrink-0 text-alert" />
              )}
              <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                <span className="font-medium">{plainText(p.left)}</span>
                <ArrowRight size={13} strokeWidth={2} aria-label="matches" className="mx-1.5 inline align-[-2px] text-ink-3" />
                {plainText(p.right)}
                <span className="sr-only">{ok ? ' — you had this right' : ''}</span>
              </span>
            </div>
            {!ok && (
              <p className="mt-1 pl-6 text-[0.8125rem] text-ink-2">
                {yours ? `You paired it with: ${plainText(yours)}` : 'You left it unpaired.'}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
