import { ArrowDown, ListOrdered } from 'lucide-react'

/**
 * The bar that replaces the tab bar while you read a lesson: the contents, where you are
 * ("Section 2 of 6" and its heading), and a step to the next section. The lesson's own
 * back control and the end-of-lesson block are the ways out, so nothing here navigates
 * away. Sits where the tab bar would, in the thumb zone.
 *
 * At lg the shell's rail takes the left 16rem, so the dock centres over the content
 * instead of the window; at xl the lesson has its contents rail and the dock steps aside.
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
  const i = sections.findIndex((s) => s.id === active)
  const here = i >= 0 ? sections[i] : undefined
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-40 mx-auto max-w-lg lg:bottom-6 lg:left-[16.75rem] xl:hidden">
      <nav
        aria-label="Lesson"
        className="bar-glass pointer-events-auto flex min-h-16 items-center gap-2 rounded-[26px] p-2 shadow-[var(--shadow-float)]"
      >
        {sections.length > 0 && (
          <button
            type="button"
            onClick={onContents}
            aria-haspopup="dialog"
            className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-[20px] pr-2 text-left transition-colors duration-150 hover:bg-surface-3/50 active:bg-surface-3/70"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-3 text-ink">
              <ListOrdered size={20} strokeWidth={2.1} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="sr-only">Contents. </span>
              {here ? (
                <>
                  <span className="block text-[0.8125rem] leading-tight font-semibold text-ink-2 tabular">
                    Section {i + 1} of {sections.length}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.9375rem] leading-tight font-bold">{here.title}</span>
                </>
              ) : (
                <>
                  <span aria-hidden="true" className="block text-[0.9375rem] leading-tight font-bold">
                    Contents
                  </span>
                  <span className="mt-0.5 block text-[0.8125rem] leading-tight font-semibold text-ink-2 tabular">
                    {sections.length} sections
                  </span>
                </>
              )}
            </span>
          </button>
        )}
        {next && (
          <button
            type="button"
            onClick={next.onClick}
            aria-label={next.label}
            title={next.label}
            className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-track text-paper transition-transform duration-150 active:scale-95 motion-reduce:active:scale-100"
          >
            <ArrowDown size={20} strokeWidth={2.4} aria-hidden="true" />
          </button>
        )}
      </nav>
    </div>
  )
}
