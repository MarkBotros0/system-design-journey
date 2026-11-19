import type { ReactNode } from 'react'
import { X } from 'lucide-react'

/** The one exit of a focus screen: a round close button, top left. */
export function CloseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink transition-[background-color,transform] duration-150 hover:bg-surface-3 active:scale-95 motion-reduce:active:scale-100"
    >
      <X size={19} strokeWidth={2.2} aria-hidden="true" />
    </button>
  )
}

/**
 * The bar across the top of a screen outside the tab shell: close on the left, a compact
 * title (or the timer) in the middle, an optional slot on the right. Flush with the page
 * at rest, frosted glass once content slides under it.
 */
export function FocusHeader({
  close,
  center,
  right,
  glass,
  children,
}: {
  close: ReactNode
  center?: ReactNode
  right?: ReactNode
  glass: boolean
  /** Anything that rides along under the bar, such as the phase progress. */
  children?: ReactNode
}) {
  return (
    <header
      className={`sticky top-0 z-30 -mx-4 px-4 pt-safe transition-[background-color,box-shadow] duration-200 ${
        glass ? 'bar-glass shadow-[0_1px_0_var(--hairline)]' : 'bg-paper'
      }`}
    >
      <div className="grid min-h-14 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
        {close}
        <div className="flex min-w-0 justify-center">{center}</div>
        <div className="flex min-w-0 items-center justify-end">{right}</div>
      </div>
      {children}
    </header>
  )
}

/** The compact title that fades into a FocusHeader once the large title has scrolled away. */
export function CompactTitle({ title, show }: { title: string; show: boolean }) {
  return (
    <p
      aria-hidden={!show}
      className={`truncate text-center text-[1.0625rem] font-bold transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}
    >
      {title}
    </p>
  )
}

/**
 * The screen's main action, docked in the thumb zone. Sticky rather than fixed: when the
 * content is short it simply sits at the bottom of the screen, when it is long it stays in
 * reach while the page scrolls under a fade.
 */
export function Dock({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-auto bg-[linear-gradient(to_top,var(--paper)_calc(100%-1.25rem),transparent)] px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      {children}
    </div>
  )
}
