import { Check, CircleDashed, X } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * How an option looks. Before the answer is in, a pick is ink — never a state colour.
 * Afterwards each option says what it was, always with an icon, never by colour alone:
 *
 *  - `hit`    picked, and right            correct tint, check
 *  - `extra`  picked, and wrong (select all) alert tint, x, "Extra"
 *  - `missed` right, and not picked         dashed correct outline, "Missed"
 *  - `key`    a pick-one's right answer     correct tint, check
 *  - `wrong`  a pick-one's wrong pick       alert tint, x
 *  - `dim`    neither picked nor right
 */
export type Mark = 'idle' | 'selected' | 'hit' | 'extra' | 'missed' | 'key' | 'wrong' | 'dim'

// The border is transparent on every filled row: only the missed row's dashed outline
// carries meaning, and the same width everywhere keeps the text from shifting.
const ROW: Record<Mark, string> = {
  idle: 'border-transparent bg-surface hover:bg-surface-2',
  selected: 'border-transparent bg-surface-3',
  hit: 'border-transparent bg-correct-soft',
  key: 'border-transparent bg-correct-soft',
  extra: 'border-transparent bg-alert-soft',
  wrong: 'border-transparent bg-alert-soft',
  missed: 'border-dashed border-correct bg-surface',
  dim: 'border-transparent bg-surface text-ink-3',
}

const BOX: Record<Mark, string> = {
  idle: 'bg-surface-3',
  selected: 'bg-line text-line-ink',
  hit: 'bg-correct text-paper',
  key: 'bg-correct text-paper',
  extra: 'bg-alert text-paper',
  wrong: 'bg-alert text-paper',
  missed: 'border-[1.5px] border-dashed border-correct',
  dim: 'bg-surface-3 opacity-60',
}

const SR: Partial<Record<Mark, string>> = {
  hit: ' — right, and you picked it',
  extra: ' — wrong, and you picked it',
  missed: ' — right, and you missed it',
  key: ' — the right answer',
  wrong: ' — your answer, wrong',
}

/**
 * One answer: a filled row of at least 56px with a leading 24px box — square for select
 * all (a checkbox), round for pick one. `n` is the key that picks it, shown on screens wide
 * enough to have a keyboard.
 */
export function AnswerOption({
  n,
  mark,
  shape = 'round',
  onClick,
  disabled,
  children,
  role,
  checked,
}: {
  n?: number
  mark: Mark
  shape?: 'round' | 'square'
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  role?: 'checkbox'
  checked?: boolean
}) {
  const icon =
    mark === 'selected' || mark === 'hit' || mark === 'key' ? (
      <Check size={15} strokeWidth={3} />
    ) : mark === 'extra' || mark === 'wrong' ? (
      <X size={15} strokeWidth={3} />
    ) : null
  const badge =
    mark === 'extra' ? (
      <span className="text-alert">
        <X size={13} strokeWidth={3} />
        Extra
      </span>
    ) : mark === 'missed' ? (
      <span className="text-correct">
        <CircleDashed size={13} strokeWidth={2.6} />
        Missed
      </span>
    ) : null

  return (
    <button
      type="button"
      role={role}
      aria-checked={role ? checked : undefined}
      data-mark={mark}
      onClick={onClick}
      disabled={disabled}
      className={`relative flex min-h-14 w-full items-start gap-3.5 rounded-[18px] border-[1.5px] px-4 py-3.5 text-left text-base leading-[1.4] font-medium transition-[background-color,transform] duration-150 enabled:active:scale-[0.985] disabled:cursor-default motion-reduce:enabled:active:scale-100 ${ROW[mark]}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <span
        aria-hidden="true"
        className={`-mt-px flex h-6 w-6 shrink-0 items-center justify-center transition-colors duration-150 ${shape === 'round' ? 'rounded-full' : 'rounded-[7px]'} ${BOX[mark]}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        {children}
        {SR[mark] && <span className="sr-only">{SR[mark]}</span>}
      </span>
      {n !== undefined && (mark === 'idle' || mark === 'selected') && (
        <span
          aria-hidden="true"
          className="-mt-px hidden h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-surface-2 px-1 text-[0.8125rem] font-semibold text-ink-3 tabular sm:inline-flex"
        >
          {n}
        </span>
      )}
      {/* Sits on the row's top edge, the way a label sits on a form field's outline. */}
      {badge && (
        <span
          aria-hidden="true"
          className="absolute -top-2.5 right-4 rounded-full bg-paper px-2 text-[0.8125rem] leading-5 font-bold [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1"
        >
          {badge}
        </span>
      )}
    </button>
  )
}
