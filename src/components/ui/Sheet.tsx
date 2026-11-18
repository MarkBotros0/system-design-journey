import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * Bottom sheet on a phone (thumb reach), centred dialog from `sm` up. Dismissible by
 * backdrop, close button and Escape — a sheet interrupts, so getting out of it must
 * never require aim. Focus is trapped inside while open and handed back on close.
 */
export function Sheet({
  open,
  onClose,
  labelledBy,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  labelledBy: string
  children: ReactNode
  wide?: boolean
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const returnTo = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    // Stop the page behind the sheet scrolling under the user's finger.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Focus the panel, not the close button: screen readers start at the top of the
    // dialog, and a keyboard user's first Tab still reaches every control.
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
      returnTo?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative flex outline-none max-h-[88dvh] w-full flex-col overflow-y-auto overscroll-contain rounded-t-3xl border border-hairline bg-surface pb-safe sm:rounded-3xl ${
          wide ? 'sm:max-w-xl' : 'sm:max-w-md'
        }`}
        style={{ boxShadow: 'var(--shadow-sheet)' }}
      >
        {/* Grab handle — signals "tap away to dismiss" on a phone. */}
        <div className="sticky top-0 z-10 flex items-center justify-center bg-surface pt-2.5 pb-1 sm:hidden">
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-hairline" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2 right-2 z-20 flex h-11 w-11 items-center justify-center rounded-full text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink sm:top-3 sm:right-3"
        >
          <X size={18} strokeWidth={2} />
        </button>
        {children}
      </div>
    </div>
  )
}
