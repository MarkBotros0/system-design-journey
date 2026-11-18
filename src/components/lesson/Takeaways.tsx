import { ChevronDown, Layers } from 'lucide-react'
import type { CardItem } from '../../content/types'
import { plainText } from '../../lib/text'
import { Inline } from '../content/Inline'

/**
 * The lesson's cards, read as a summary: try to answer each before opening it. The same
 * cards join the review deck once the lesson is read.
 */
export function Takeaways({ cards }: { cards: CardItem[] }) {
  if (!cards.length) return null
  return (
    <section aria-labelledby="takeaways-h" className="mt-10">
      <h2 id="takeaways-h" className="flex items-center gap-2 text-[1.125rem] font-semibold">
        <Layers size={18} strokeWidth={1.9} aria-hidden="true" className="text-line" />
        Key takeaways
      </h2>
      <p className="mt-0.5 mb-3 text-[0.875rem] text-ink-2">Answer each in your head, then open it to check.</p>
      <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
        {cards.map((c) => (
          <details key={c.id} className="group border-b border-hairline last:border-b-0">
            <summary className="flex min-h-12 cursor-pointer list-none items-start gap-3 px-4 py-3 hover:bg-surface-2/60 [&::-webkit-details-marker]:hidden">
              <span className="flex-1 text-[0.9375rem] leading-snug font-medium">{plainText(c.front)}</span>
              <ChevronDown
                size={18}
                strokeWidth={2}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <p className="px-4 pb-4 text-[0.9375rem] leading-relaxed text-ink-2">
              <Inline text={c.back} />
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
