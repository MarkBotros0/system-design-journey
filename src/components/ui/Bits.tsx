import type { ReactNode } from 'react'

/* Small shared pieces. Kept together because each is a few lines and they are always
   imported as a set; anything that grows past ~30 lines moves to its own file. */

/** A small label above a title: sentence case, bold, in the track's colour where one is set. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="text-[0.875rem] font-bold text-track">{children}</span>
}

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-3xl bg-surface p-5 ${className}`} style={{ boxShadow: 'var(--shadow-card)' }}>
      {children}
    </div>
  )
}

type Tone = 'line' | 'correct' | 'mastered' | 'streak' | 'alert' | 'neutral'

const toneClasses: Record<Tone, string> = {
  line: 'bg-surface-3 text-ink',
  correct: 'bg-correct-soft text-correct',
  mastered: 'bg-mastered-soft text-mastered',
  streak: 'bg-streak-soft text-streak',
  alert: 'bg-alert-soft text-alert',
  neutral: 'bg-surface-2 text-ink-2',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.8125rem] font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}

export function Meter({
  value,
  tone = 'line',
  className = '',
  label,
}: {
  /** 0–1. */
  value: number
  tone?: Tone
  className?: string
  label?: string
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  const fill =
    tone === 'correct' ? 'bg-correct' : tone === 'mastered' ? 'bg-mastered' : tone === 'streak' ? 'bg-streak' : 'bg-line'
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-surface-3 ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full ${fill} transition-[width] duration-500`}
        style={{ width: `${pct}%`, transitionTimingFunction: 'var(--ease-out)' }}
      />
    </div>
  )
}

export function ScreenTitle({
  title,
  sub,
  right,
}: {
  title: string
  sub?: string
  right?: ReactNode
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[2rem] leading-[1.1] font-extrabold tracking-[-0.025em]">{title}</h1>
        {sub && <p className="mt-2 text-base text-ink-2">{sub}</p>}
      </div>
      {right}
    </header>
  )
}

export function Empty({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-3xl bg-surface-2 px-6 py-10 text-center">
      <p className="text-[1.0625rem] font-bold">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[34ch] text-[0.9375rem] text-ink-2">{body}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

/** A placeholder block while IndexedDB answers — never show zeros that are not real. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-2xl bg-surface-2 ${className}`} />
}
