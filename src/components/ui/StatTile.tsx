import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const TONE = {
  streak: 'text-streak',
  correct: 'text-correct',
  mastered: 'text-mastered',
  ink: 'text-ink',
} as const

/**
 * A number worth glancing at, as one tap target into the screen it summarises. Tiles sit
 * in a row of two or three; the value is the biggest thing in it.
 */
export function StatTile({
  to,
  value,
  label,
  sub,
  icon,
  tone = 'ink',
}: {
  to: string
  value: ReactNode
  label: string
  sub?: string
  icon?: ReactNode
  /** An earned colour only when the number is one (a streak, a met goal). */
  tone?: keyof typeof TONE
}) {
  return (
    <Link
      to={to}
      className="flex min-h-24 min-w-0 flex-col justify-between gap-2 rounded-[22px] bg-surface p-3.5 transition-transform duration-150 active:scale-[0.97] motion-reduce:active:scale-100"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <span className="flex items-center justify-between gap-2 text-ink-2">
        <span className="truncate text-[0.875rem] font-semibold">{label}</span>
        {icon}
      </span>
      <span>
        <span className={`block text-[1.75rem] leading-none font-extrabold tracking-[-0.03em] tabular ${TONE[tone]}`}>{value}</span>
        {sub && <span className="mt-1 block truncate text-[0.8125rem] text-ink-3">{sub}</span>}
      </span>
    </Link>
  )
}
