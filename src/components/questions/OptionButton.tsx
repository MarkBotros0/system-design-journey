import { Check, X } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * How an option looks. `mastered` and `alert` appear only once the answer is in: they mean
 * right and wrong, nothing else. Before that, a pick is shown with the one accent, `line`.
 */
export type Mark = 'idle' | 'selected' | 'correct' | 'wrong' | 'missed' | 'dim'

const MARK: Record<Mark, string> = {
  idle: 'border-hairline bg-surface hover:border-line',
  selected: 'border-line bg-line-soft',
  correct: 'border-mastered bg-mastered-soft',
  wrong: 'border-alert bg-alert-soft',
  missed: 'border-dashed border-mastered bg-surface',
  dim: 'border-hairline bg-surface opacity-55',
}

const SR: Partial<Record<Mark, string>> = {
  correct: ' — correct',
  wrong: ' — wrong',
  missed: ' — this one was also right',
}

/** A tappable answer: a full-width row, at least 52px, with its key number on wide screens. */
export function OptionButton({
  n,
  mark,
  onClick,
  disabled,
  children,
  role,
  checked,
}: {
  /** Shown as a keyboard hint (1–6) on screens wide enough to have a keyboard. */
  n?: number
  mark: Mark
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  role?: 'checkbox'
  checked?: boolean
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role ? checked : undefined}
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-13 w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[0.9375rem] leading-relaxed transition-colors duration-150 disabled:cursor-default ${MARK[mark]}`}
    >
      {role === 'checkbox' && (
        <span
          aria-hidden="true"
          className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${checked ? 'border-line bg-line text-line-ink' : 'border-ink-3'}`}
        >
          {checked && <Check size={11} strokeWidth={3.5} />}
        </span>
      )}
      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        {children}
        {SR[mark] && <span className="sr-only">{SR[mark]}</span>}
      </span>
      {mark === 'correct' || mark === 'missed' ? (
        <Check size={17} strokeWidth={2.5} aria-hidden="true" className="mt-0.5 shrink-0 text-mastered" />
      ) : mark === 'wrong' ? (
        <X size={17} strokeWidth={2.5} aria-hidden="true" className="mt-0.5 shrink-0 text-alert" />
      ) : n !== undefined ? (
        <kbd aria-hidden="true" className="mt-0.5 hidden shrink-0 font-mono text-[0.6875rem] text-ink-3 sm:inline">
          {n}
        </kbd>
      ) : null}
    </button>
  )
}
