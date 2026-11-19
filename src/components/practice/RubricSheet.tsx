import { Check } from 'lucide-react'
import type { RubricRow } from '../../content/types'
import { plainText } from '../../lib/text'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'

const BAR_LABEL: Record<RubricRow['bar'], { title: string; note: string }> = {
  must: { title: 'The bar', note: 'Miss these and the design does not stand up.' },
  senior: { title: 'Senior', note: 'What you are expected to raise without being asked.' },
  staff: { title: 'Staff', note: 'Above the line you are aiming at. Bonus, not failure.' },
}

const BARS: RubricRow['bar'][] = ['must', 'senior', 'staff']

/**
 * Self-grading, in a large sheet over the walkthrough: the rubric grouped by bar, each
 * criterion a full-width checkbox row that turns green with a tick when claimed. Closing
 * the sheet keeps the ticks; only Save ends the attempt.
 */
export function RubricSheet({
  open,
  onClose,
  rubric,
  scored,
  onToggle,
  onSave,
}: {
  open: boolean
  onClose: () => void
  rubric: RubricRow[]
  scored: Record<string, boolean>
  onToggle: (id: string) => void
  onSave: () => void
}) {
  const hit = rubric.filter((r) => scored[r.id]).length
  const groups = BARS.map((bar) => ({ bar, rows: rubric.filter((r) => r.bar === bar) })).filter((g) => g.rows.length > 0)

  return (
    <Sheet open={open} onClose={onClose} labelledBy="rubric-h" detent="large" wide>
      <div className="px-5 pt-1">
        <h2 id="rubric-h" className="pr-12 text-[1.5rem] leading-tight font-extrabold tracking-[-0.02em]">
          Score yourself
        </h2>
        <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">
          Tick what you genuinely covered. Honest ticks are the only kind worth having.{' '}
          <span className="font-semibold text-ink tabular">
            {hit} of {rubric.length} ticked.
          </span>
        </p>

        {groups.map((g) => {
          const n = g.rows.filter((r) => scored[r.id]).length
          return (
            <section key={g.bar} aria-labelledby={`bar-${g.bar}`} className="mt-6">
              <div className="flex items-baseline justify-between gap-3 px-1">
                <h3 id={`bar-${g.bar}`} className="text-[1.0625rem] font-bold">
                  {BAR_LABEL[g.bar].title}
                </h3>
                <span className="text-[0.9375rem] font-semibold text-ink-2 tabular">
                  {n} of {g.rows.length}
                </span>
              </div>
              <p className="mt-0.5 mb-2.5 px-1 text-[0.875rem] text-ink-2">{BAR_LABEL[g.bar].note}</p>
              <ul className="flex flex-col gap-1.5">
                {g.rows.map((row) => {
                  const on = !!scored[row.id]
                  return (
                    <li key={row.id}>
                      <label
                        className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl px-4 py-3.5 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-track ${
                          on ? 'bg-correct-soft' : 'bg-surface-2 hover:bg-surface-3'
                        }`}
                      >
                        <input type="checkbox" checked={on} onChange={() => onToggle(row.id)} className="sr-only" />
                        {/* The empty box keeps an outline: it is the affordance that says "tick me". */}
                        <span
                          aria-hidden="true"
                          className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] ${
                            on ? 'bg-correct text-paper' : 'border-2 border-ink-3'
                          }`}
                        >
                          {on && <Check size={15} strokeWidth={3} />}
                        </span>
                        <span className="text-base leading-snug">{plainText(row.criterion)}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      <div className="sticky bottom-0 z-10 mt-4 bg-[linear-gradient(to_top,var(--surface)_calc(100%-1.25rem),transparent)] px-5 pt-5 pb-4">
        <Button size="lg" onClick={onSave}>
          Save this attempt
        </Button>
      </div>
    </Sheet>
  )
}
