import { useMemo, useState, type Ref } from 'react'
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
 * in a stable shuffled order. A pair shows the same number badge on both sides. Once
 * checked, the columns become a list of the right pairs.
 */
export function MatchPairs({
  q,
  pairs,
  onChange,
  given,
  groupRef,
}: {
  q: Match
  pairs: Record<number, number>
  onChange: (next: Record<number, number>) => void
  given?: Record<number, number>
  groupRef?: Ref<HTMLDivElement>
}) {
  const rightOrder = useMemo(() => partnerOrder(q.id, q.pairs.length), [q.id, q.pairs.length])
  const [selected, setSelected] = useState<{ side: Side; i: number } | null>(null)

  if (given) return <MatchResult q={q} given={given} groupRef={groupRef} />

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
    // Waiting for a partner = inverted ink, the strongest neutral there is; paired = a step
    // deeper than an open item, with its pair number.
    const cls = isSel ? 'bg-line text-line-ink' : pairedLeft !== undefined ? 'bg-surface-3' : 'bg-surface hover:bg-surface-2'
    return (
      <button
        key={`${side}${i}`}
        type="button"
        aria-pressed={isSel}
        aria-label={`${plainText(text)}${partner ? `, paired with ${plainText(partner)}` : ''}`}
        onClick={() => tap(side, i)}
        className={`relative flex min-h-14 w-full items-start rounded-[18px] px-3.5 py-3 text-left text-base leading-[1.35] font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.97] motion-reduce:active:scale-100 ${cls}`}
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <span className="min-w-0 flex-1 hyphens-auto [overflow-wrap:break-word]">{plainText(text)}</span>
        {/* On the corner, not in the line: pairing never reflows the text under your finger. */}
        {pairedLeft !== undefined && (
          <span
            aria-hidden="true"
            className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-line text-[0.8125rem] font-bold text-line-ink ring-[3px] ring-paper tabular"
          >
            {pairNo(pairedLeft)}
          </span>
        )}
      </button>
    )
  }

  const done = Object.keys(pairs).length
  return (
    <div ref={groupRef}>
      <div className="grid grid-cols-2 gap-2.5">
        <div role="group" aria-label="Items" className="flex flex-col gap-2.5">
          {q.pairs.map((p, i) => item('left', i, p.left, pairs[i] !== undefined ? i : undefined, pairs[i] !== undefined ? q.pairs[pairs[i]].right : undefined))}
        </div>
        <div role="group" aria-label="Partners" className="flex flex-col gap-2.5">
          {rightOrder.map((j) => {
            const l = leftOf(j)
            return item('right', j, q.pairs[j].right, l, l !== undefined ? q.pairs[l].left : undefined)
          })}
        </div>
      </div>
      <p className="mt-3.5 text-[0.875rem] font-medium text-ink-2 tabular" aria-live="polite">
        {done} of {q.pairs.length} paired
        {selected ? ` · now tap its partner` : ''}
      </p>
    </div>
  )
}

function MatchResult({ q, given, groupRef }: { q: Match; given: Record<number, number>; groupRef?: Ref<HTMLDivElement> }) {
  return (
    <div ref={groupRef}>
      <ul className="flex flex-col gap-2.5" aria-label="The pairs">
        {q.pairs.map((p, i) => {
          const ok = given[i] === i
          const yours = given[i] !== undefined && !ok ? q.pairs[given[i]].right : undefined
          return (
            <li
              key={i}
              data-mark={ok ? 'hit' : 'wrong'}
              className={`flex items-start gap-3.5 rounded-[18px] px-4 py-3.5 text-base leading-[1.4] ${ok ? 'bg-correct-soft' : 'bg-alert-soft'}`}
            >
              <span
                aria-hidden="true"
                className={`-mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-paper ${ok ? 'bg-correct' : 'bg-alert'}`}
              >
                {ok ? <Check size={15} strokeWidth={3} /> : <X size={15} strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                <span className="font-semibold">{plainText(p.left)}</span>
                <ArrowRight size={15} strokeWidth={2.2} aria-label="matches" className="mx-1.5 inline align-[-2px] text-ink-2" />
                {plainText(p.right)}
                <span className="sr-only">{ok ? ' — you had this right' : ''}</span>
                {!ok && (
                  <span className="mt-1 block text-[0.875rem] text-ink-2">
                    {yours ? `You paired it with: ${plainText(yours)}` : 'You left it unpaired.'}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
