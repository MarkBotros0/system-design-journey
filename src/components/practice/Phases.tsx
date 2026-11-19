import { MessageSquareQuote } from 'lucide-react'
import type { Phase } from '../../content/framework'

/**
 * The 45 minutes as one segmented bar, each phase as wide as its budget: done phases in
 * ink, the live one filling with the time it has used (alert once it overruns), the rest
 * empty. The label carries the position for assistive tech; the timer carries the time.
 */
export function PhaseBar({ phases, index, used, over }: { phases: Phase[]; index: number; used: number; over: boolean }) {
  const current = phases[index]
  return (
    <div
      role="progressbar"
      aria-label="Phases"
      aria-valuemin={1}
      aria-valuemax={phases.length}
      aria-valuenow={index + 1}
      aria-valuetext={`Phase ${index + 1} of ${phases.length}: ${current?.name ?? ''}`}
      className="flex w-full items-center gap-1"
    >
      {phases.map((p, i) => {
        const fill = i < index ? 1 : i === index ? (over ? 1 : Math.max(0.04, Math.min(1, used))) : 0
        return (
          <span key={p.id} aria-hidden="true" className="h-1.5 min-w-1.5 overflow-hidden rounded-full bg-surface-3" style={{ flex: p.minutes }}>
            <span
              className={`block h-full rounded-full transition-[width] duration-500 ${i === index && over ? 'bg-alert' : 'bg-line'}`}
              style={{ width: `${fill * 100}%` }}
            />
          </span>
        )
      })}
    </div>
  )
}

/**
 * The plan for the round, before the clock starts: each phase with its share of the 45
 * minutes drawn as a bar, so the shape of the interview — a long middle, a short start —
 * is visible at a glance.
 */
export function PhasePlan({ phases }: { phases: Phase[] }) {
  const longest = Math.max(...phases.map((p) => p.minutes))
  return (
    <ol
      aria-label="Phases"
      className="overflow-hidden rounded-[22px] bg-surface [&>li+li]:relative [&>li+li]:before:pointer-events-none [&>li+li]:before:absolute [&>li+li]:before:inset-x-4 [&>li+li]:before:top-0 [&>li+li]:before:h-px [&>li+li]:before:bg-hairline [&>li+li]:before:content-['']"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {phases.map((p, i) => (
        <li key={p.id} className="flex min-h-13 items-center gap-3 px-4 py-2.5">
          <span className="w-5 shrink-0 text-[0.9375rem] font-bold text-ink-3 tabular">{i + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-base leading-snug font-semibold">{p.name}</span>
            {(p.optional || p.followups) && (
              <span className="mt-0.5 flex items-center gap-1.5 text-[0.875rem] text-ink-2">
                {p.followups && <MessageSquareQuote size={14} strokeWidth={2} aria-hidden="true" />}
                {p.optional ? 'Optional' : 'Follow-ups arrive'}
              </span>
            )}
          </span>
          <span aria-hidden="true" className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-surface-3 sm:w-28">
            <span className="block h-full rounded-full bg-ink-3" style={{ width: `${(p.minutes / longest) * 100}%` }} />
          </span>
          <span className="w-12 shrink-0 text-right text-[0.9375rem] font-semibold tabular">{p.minutes} min</span>
        </li>
      ))}
    </ol>
  )
}
