import { ChevronDown, MessageSquareQuote } from 'lucide-react'
import type { Followup } from '../../content/types'
import { plainText } from '../../lib/text'
import { Inline } from './Inline'

/* Rows on one card, split by inset hairlines that start past the padding — the grouped
   list look. */
const rows =
  "[&>details+details]:relative [&>details+details]:before:pointer-events-none [&>details+details]:before:absolute [&>details+details]:before:inset-x-4 [&>details+details]:before:top-0 [&>details+details]:before:h-px [&>details+details]:before:bg-hairline [&>details+details]:before:content-['']"

/**
 * The questions an interviewer pushes with. Answers sit behind a tap on purpose: try to
 * answer out loud first, then check. The question is plain text because it lives inside
 * a <summary>, which is itself the control.
 */
export function Followups({ items, title = 'Interviewer follow-ups' }: { items: Followup[]; title?: string }) {
  return (
    <section aria-label={title} className={`overflow-hidden rounded-[22px] bg-surface shadow-[var(--shadow-card)] ${rows}`}>
      <p className="flex items-center gap-2.5 px-4 pt-4 pb-1.5 text-base font-bold">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-track-soft text-track">
          <MessageSquareQuote size={16} strokeWidth={2.2} aria-hidden="true" />
        </span>
        {title}
      </p>
      {items.map((f, i) => (
        <details key={i} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-start gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-surface-2/60 active:bg-surface-2 [&::-webkit-details-marker]:hidden">
            <span className="flex-1 text-base leading-snug font-semibold">{plainText(f.q)}</span>
            <ChevronDown
              size={19}
              strokeWidth={2.2}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <div className="px-4 pb-4">
            <p className="mb-1 text-[0.875rem] font-bold text-track">A strong answer</p>
            <p className="text-base leading-relaxed text-ink-2">
              <Inline text={f.a} />
            </p>
          </div>
        </details>
      ))}
    </section>
  )
}
