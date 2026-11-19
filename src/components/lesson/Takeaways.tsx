import { ChevronDown, Layers } from 'lucide-react'
import type { CardItem } from '../../content/types'
import { plainText } from '../../lib/text'
import { Inline } from '../content/Inline'

/* Inset hairlines between rows, the grouped-list look. */
const rows =
  "[&>details+details]:relative [&>details+details]:before:pointer-events-none [&>details+details]:before:absolute [&>details+details]:before:inset-x-4 [&>details+details]:before:top-0 [&>details+details]:before:h-px [&>details+details]:before:bg-hairline [&>details+details]:before:content-['']"

/**
 * The lesson's cards, read as a summary: try to answer each before opening it. The same
 * cards join the review deck once the lesson is read.
 */
export function Takeaways({ cards }: { cards: CardItem[] }) {
  if (!cards.length) return null
  return (
    <section aria-labelledby="takeaways-h" className="mt-10">
      <div className="mb-3 px-1">
        <h2 id="takeaways-h" className="flex items-center gap-2 text-[1.25rem] font-bold">
          <Layers size={19} strokeWidth={2.1} aria-hidden="true" className="text-track" />
          Key takeaways
        </h2>
        <p className="mt-1 text-[0.9375rem] text-ink-2">Answer each in your head, then open it to check.</p>
      </div>
      <div className={`overflow-hidden rounded-[22px] bg-surface shadow-[var(--shadow-card)] ${rows}`}>
        {cards.map((c) => (
          <details key={c.id} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-start gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-surface-2/60 active:bg-surface-2 [&::-webkit-details-marker]:hidden">
              <span className="flex-1 text-base leading-snug font-semibold">{plainText(c.front)}</span>
              <ChevronDown
                size={19}
                strokeWidth={2.2}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <p className="px-4 pb-4 text-base leading-relaxed text-ink-2">
              <Inline text={c.back} />
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
