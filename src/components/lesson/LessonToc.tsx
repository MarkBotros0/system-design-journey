import { Link } from 'react-router-dom'
import { ChevronDown, ListTree } from 'lucide-react'

export interface TocItem {
  id: string
  text: string
}

/**
 * "On this page". Inline as a collapsible under the header on phones and tablets; a
 * sticky rail beside the article at xl. Links replace history rather than push, so Back
 * still means "the screen before this lesson", not "the previous heading".
 */
export function LessonToc({ items, active, variant }: { items: TocItem[]; active?: string; variant: 'inline' | 'rail' }) {
  if (items.length < 2) return null

  const list = (
    <ol className={variant === 'rail' ? 'border-l border-hairline' : 'flex flex-col'}>
      {items.map((it, i) => {
        const on = it.id === active
        return (
          <li key={it.id}>
            <Link
              to={{ hash: it.id }}
              replace
              aria-current={on ? 'location' : undefined}
              className={
                variant === 'rail'
                  ? `-ml-px block border-l-2 py-1.5 pl-3 text-[0.8125rem] leading-snug transition-colors duration-150 ${
                      on ? 'border-line font-medium text-ink' : 'border-transparent text-ink-3 hover:text-ink'
                    }`
                  : `flex min-h-11 items-center gap-3 rounded-lg px-2 text-[0.9375rem] leading-snug transition-colors hover:bg-surface-2 ${
                      on ? 'font-medium text-line' : 'text-ink-2'
                    }`
              }
            >
              {variant === 'inline' && (
                <span className="w-5 shrink-0 font-mono text-[0.6875rem] text-ink-3 tabular">{String(i + 1).padStart(2, '0')}</span>
              )}
              {it.text}
            </Link>
          </li>
        )
      })}
    </ol>
  )

  if (variant === 'rail') {
    return (
      <nav aria-label="On this page">
        <p className="mb-2 font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase">On this page</p>
        {list}
      </nav>
    )
  }

  return (
    <details className="group rounded-2xl border border-hairline bg-surface">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 px-4 text-[0.9375rem] font-medium [&::-webkit-details-marker]:hidden">
        <ListTree size={17} strokeWidth={1.9} aria-hidden="true" className="text-line" />
        <span className="flex-1">On this page</span>
        <span className="font-mono text-[0.75rem] text-ink-3 tabular">{items.length} sections</span>
        <ChevronDown size={17} strokeWidth={2} aria-hidden="true" className="text-ink-3 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <nav aria-label="On this page" className="border-t border-hairline px-2 py-2">
        {list}
      </nav>
    </details>
  )
}
