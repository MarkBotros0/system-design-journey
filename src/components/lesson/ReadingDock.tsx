import { ArrowDown, ListOrdered } from 'lucide-react'

/**
 * The bar that replaces the tab bar while you read a lesson: the contents, where you are
 * ("Section 2 of 6" and its heading), and a step to the next section. The lesson's own
 * back control and the end-of-lesson block are the ways out, so nothing here navigates
 * away. Sits where the tab bar would, in the thumb zone.
 */
export function ReadingDock({
  sections,
  active,
  onContents,
  next,
}: {
  sections: { id: string; title: string }[]
  active?: string
  onContents: () => void
  next?: { label: string; onClick: () => void }
}) {
  const i = Math.max(0, sections.findIndex((s) => s.id === active))
  const here = sections[i]
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-40 mx-auto max-w-lg lg:bottom-6">
      <nav
        aria-label="Lesson"
        className="bar-glass pointer-events-auto flex min-h-16 items-center gap-2 rounded-[24px] py-2 pr-2 pl-2 shadow-[var(--shadow-float)]"
      >
        <button
          type="button"
          onClick={onContents}
          aria-label="Contents"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink transition-colors duration-150 hover:bg-surface-3"
        >
          <ListOrdered size={20} strokeWidth={2.1} aria-hidden="true" />
        </button>
        <button type="button" onClick={onContents} className="min-h-11 min-w-0 flex-1 text-left">
          {here ? (
            <>
              <span className="block text-[0.75rem] font-semibold text-ink-3 tabular">
                Section {i + 1} of {sections.length}
              </span>
              <span className="block truncate text-[0.9375rem] leading-tight font-bold">{here.title}</span>
            </>
          ) : (
            <span className="block text-[0.9375rem] font-bold">Contents</span>
          )}
        </button>
        {next && (
          <button
            type="button"
            onClick={next.onClick}
            aria-label={next.label}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-track text-paper transition-transform duration-150 active:scale-95 motion-reduce:active:scale-100"
          >
            <ArrowDown size={19} strokeWidth={2.4} aria-hidden="true" />
          </button>
        )}
      </nav>
    </div>
  )
}
