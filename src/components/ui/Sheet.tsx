import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * Bottom sheet on a phone (thumb reach), centred dialog from `sm` up. Dismissible by
 * backdrop, close button, Escape, and on a phone by dragging the handle down — a sheet
 * interrupts, so getting out of it must never require aim. Focus is trapped inside while
 * open and handed back on close.
 *
 * `detent` sets how tall it may grow: `medium` keeps the screen behind it in view (answer
 * feedback), `large` is for lists and long content. Content scrolls inside either.
 *
 * Rendered into <body>, not where it is used: a screen's own stacking context (its page-in
 * animation's fill makes one) would otherwise trap the sheet under the tab bar and the
 * Resume dock, and a tap on its docked buttons would land on a tab.
 */
export function Sheet({
  open,
  onClose,
  labelledBy,
  children,
  wide = false,
  detent = 'large',
}: {
  open: boolean
  onClose: () => void
  labelledBy: string
  children: ReactNode
  wide?: boolean
  detent?: 'medium' | 'large'
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState(0)
  // The portal leaves the screen's subtree, and with it the --track its trackStyle set; an
  // anchor left in place reads it so the sheet keeps the colour of where it was opened.
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [track, setTrack] = useState('')
  useLayoutEffect(() => {
    if (open && anchorRef.current) setTrack(getComputedStyle(anchorRef.current).getPropertyValue('--track').trim())
  }, [open])
  const dragStart = useRef<{ y: number; t: number } | null>(null)

  function onGrab(e: PointerEvent<HTMLDivElement>) {
    dragStart.current = { y: e.clientY, t: performance.now() }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onDrag(e: PointerEvent<HTMLDivElement>) {
    if (dragStart.current) setDrag(Math.max(0, e.clientY - dragStart.current.y))
  }
  function onRelease(e: PointerEvent<HTMLDivElement>) {
    const start = dragStart.current
    dragStart.current = null
    if (!start) return
    const dy = e.clientY - start.y
    const speed = dy / Math.max(1, performance.now() - start.t)
    setDrag(0)
    // A long drag, or a short flick, closes it; anything less springs back.
    if (dy > 96 || (dy > 24 && speed > 0.6)) onCloseRef.current()
  }
  // Callers pass a fresh onClose on every render; depending on it would re-run the effect
  // below — and pull focus back to the panel — on every choice made inside the sheet.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const returnTo = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      // From the panel itself (where focus starts), Shift+Tab must wrap too, not escape.
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
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
  }, [open])

  if (!open) return null

  return (
    <>
      <span ref={anchorRef} hidden />
      {createPortal(
        <div
          style={track ? ({ '--track': track } as CSSProperties) : undefined}
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
            className="animate-fade-in absolute inset-0 bg-black/50"
          />
          <div
            ref={panelRef}
            tabIndex={-1}
            className={`animate-sheet-in relative flex w-full flex-col overflow-y-auto overscroll-contain rounded-t-[28px] bg-surface pb-safe outline-none sm:rounded-[28px] ${
              detent === 'medium' ? 'max-h-[66dvh]' : 'max-h-[92dvh]'
            } ${wide ? 'sm:max-w-xl' : 'sm:max-w-md'} ${drag ? '' : 'transition-transform duration-200'}`}
            style={{ boxShadow: 'var(--shadow-sheet)', transform: drag ? `translateY(${drag}px)` : undefined }}
          >
            {/* Grab handle: drag it down to dismiss. Taps away and Escape work too. */}
            <div
              onPointerDown={onGrab}
              onPointerMove={onDrag}
              onPointerUp={onRelease}
              onPointerCancel={onRelease}
              className="sticky top-0 z-10 flex h-7 shrink-0 cursor-grab touch-none items-center justify-center bg-surface sm:hidden"
            >
              <span aria-hidden="true" className="h-[5px] w-10 rounded-full bg-ink-3/45" />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink-2 transition-colors duration-150 hover:bg-surface-3 hover:text-ink"
            >
              <X size={18} strokeWidth={2} />
            </button>
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
