import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { getGlossary } from '../../content/glossary'
import { useGlossary } from '../../state/GlossaryProvider'
import { FigureView } from './Figure'
import { Inline } from './Inline'

/**
 * The glossary sheet. Mounted once by App; every abbreviation in the app opens this one.
 *
 * Bottom sheet on a phone (thumb reach), centred dialog from `sm` up. Dismissible by
 * backdrop, close button, and Escape — the sheet interrupts reading, so getting out of
 * it must never require aim.
 */
export function GlossarySheet() {
  const { openId, close, open } = useGlossary()
  const entry = getGlossary(openId ?? '')
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!openId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    // Stop the page behind the sheet scrolling under the user's finger.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [openId, close])

  if (!openId || !entry) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="glossary-title"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
      />

      <div
        className="relative flex max-h-[86dvh] w-full flex-col overflow-y-auto rounded-t-3xl border border-hairline bg-surface pb-safe sm:max-w-md sm:rounded-3xl"
        style={{ boxShadow: 'var(--shadow-sheet)' }}
      >
        {/* Grab handle — signals "drag or tap away to dismiss" on a phone. */}
        <div className="sticky top-0 z-10 flex justify-center bg-surface pt-2.5 pb-1 sm:hidden">
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-hairline" />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pt-3 sm:pt-5">
          <div className="min-w-0">
            <p className="font-mono text-[1.375rem] leading-none font-semibold text-line">
              {entry.id}
            </p>
            <h2 id="glossary-title" className="mt-1.5 text-[1.0625rem] font-semibold">
              {entry.full}
            </h2>
          </div>
          <button
            ref={closeRef}
            onClick={close}
            aria-label="Close"
            className="-mt-1 -mr-2 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-ink-3 hover:text-ink"
          >
            <X size={19} strokeWidth={2} />
          </button>
        </div>

        <p className="px-5 pt-2.5 text-[0.9375rem] leading-relaxed text-ink-2">
          <Inline text={entry.gist} />
        </p>

        <div className="px-5 pt-4">
          <FigureView figure={entry.figure} />
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-3">{entry.caption}</p>
        </div>

        {entry.seeAlso && entry.seeAlso.length > 0 && (
          <div className="px-5 pt-4">
            <p className="mb-1.5 font-mono text-[0.625rem] tracking-[0.12em] uppercase text-ink-3">
              See also
            </p>
            <div className="flex flex-wrap gap-1.5">
              {entry.seeAlso.map((id) => (
                <button
                  key={id}
                  onClick={() => open(id)}
                  className="min-h-9 rounded-lg border border-hairline bg-surface-2 px-2.5 font-mono text-[0.75rem] text-ink-2 hover:border-line hover:text-line"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="h-5 sm:h-6" />
      </div>
    </div>
  )
}
