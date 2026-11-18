import { ChevronDown, MessageSquareQuote } from 'lucide-react'
import type { Followup } from '../../content/types'
import { plainText } from '../../lib/text'
import { Inline } from './Inline'

/**
 * The questions an interviewer pushes with. Answers sit behind a tap on purpose: try to
 * answer out loud first, then check. The question is plain text because it lives inside
 * a <summary>, which is itself the control.
 */
export function Followups({ items, title = 'Interviewer follow-ups' }: { items: Followup[]; title?: string }) {
  return (
    <section aria-label={title} className="overflow-hidden rounded-2xl border border-hairline bg-surface">
      <p className="flex items-center gap-2 border-b border-hairline px-4 py-3 font-mono text-[0.6875rem] tracking-[0.12em] text-line uppercase">
        <MessageSquareQuote size={15} strokeWidth={2} aria-hidden="true" />
        {title}
      </p>
      {items.map((f, i) => (
        <details key={i} className="group border-b border-hairline last:border-b-0">
          <summary className="flex min-h-12 cursor-pointer list-none items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-surface-2/60 [&::-webkit-details-marker]:hidden">
            <span className="flex-1 text-[0.9375rem] leading-snug font-medium">{plainText(f.q)}</span>
            <ChevronDown
              size={18}
              strokeWidth={2}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <div className="px-4 pb-4">
            <p className="mb-1 font-mono text-[0.625rem] tracking-[0.12em] text-mastered uppercase">A strong answer</p>
            <p className="text-[0.9375rem] leading-relaxed text-ink-2">
              <Inline text={f.a} />
            </p>
          </div>
        </details>
      ))}
    </section>
  )
}
