import { Link } from 'react-router-dom'

export interface TocItem {
  id: string
  text: string
}

/**
 * The lesson's contents. On phones and tablets it lives in a bottom sheet opened from the
 * reading dock (`sheet`); at xl it is also a sticky rail beside the article (`rail`).
 * Links replace history rather than push, so Back still means "the screen before this
 * lesson", not "the previous heading". `onPick` lets the sheet close itself on a choice.
 */
export function LessonToc({
  items,
  active,
  variant,
  onPick,
}: {
  items: TocItem[]
  active?: string
  variant: 'sheet' | 'rail'
  onPick?: (id: string) => void
}) {
  if (variant === 'rail') {
    if (items.length < 2) return null
    return (
      <nav aria-label="On this page">
        <p className="mb-2 px-3 text-[0.875rem] font-bold text-ink-2">On this page</p>
        <ol className="flex flex-col gap-0.5">
          {items.map((it) => {
            const on = it.id === active
            return (
              <li key={it.id}>
                <Link
                  to={{ hash: it.id }}
                  replace
                  aria-current={on ? 'location' : undefined}
                  className={`flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 text-[0.875rem] leading-snug transition-colors duration-150 ${
                    on ? 'bg-surface font-semibold text-ink shadow-[var(--shadow-card)]' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${on ? 'bg-track' : 'bg-surface-3'}`} />
                  {it.text}
                </Link>
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }

  return (
    <nav aria-label="On this page">
      <ol className="flex flex-col gap-1">
        {items.map((it, i) => {
          const on = it.id === active
          return (
            <li key={it.id}>
              <Link
                to={{ hash: it.id }}
                replace
                onClick={() => onPick?.(it.id)}
                aria-current={on ? 'location' : undefined}
                className={`flex min-h-13 items-center gap-3.5 rounded-2xl px-2.5 py-2 transition-colors duration-150 ${
                  on ? 'bg-track-soft' : 'hover:bg-surface-2 active:bg-surface-2'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.875rem] font-bold tabular ${
                    on ? 'bg-track text-paper' : 'bg-surface-2 text-ink-2'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 text-base leading-snug font-semibold text-ink">{it.text}</span>
                {on && <span className="shrink-0 text-[0.8125rem] font-semibold text-ink-2">Reading</span>}
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
