import { Link } from 'react-router-dom'
import { ChevronRight, Timer } from 'lucide-react'
import { getModule, stopTitle } from '../../content'
import type { RoundReadiness } from '../../lib/readiness'
import { plainText } from '../../lib/text'
import { ProgressRing } from '../ui/ProgressRing'
import { TrackGlyph } from '../ui/TrackIcon'

/**
 * Readiness for each interview round as three rings side by side, then the next stop on
 * each round's route — the score and the way to raise it on one card.
 */
export function ReadinessCard({ rounds }: { rounds: RoundReadiness[] }) {
  const next = rounds.filter((r) => r.next)
  return (
    <section aria-labelledby="ready-h">
      <h2 id="ready-h" className="mb-2 flex min-h-11 items-end px-1 text-[1.25rem] font-bold">
        Interview readiness
      </h2>
      <div className="overflow-hidden rounded-[22px] bg-surface" style={{ boxShadow: 'var(--shadow-card)' }}>
        <ul className="grid grid-cols-3 gap-1 px-2 pt-5 pb-4">
          {rounds.map((r) => (
            <li key={r.id} className="flex min-w-0 flex-col items-center text-center">
              <ProgressRing value={r.score} size={72} label={`${r.title} readiness`} />
              <span className="mt-2.5 text-[0.9375rem] leading-tight font-bold">{r.title}</span>
              <span className="mt-1 text-[0.8125rem] leading-snug text-ink-2 tabular">
                {r.lessonsDone} of {r.lessonsTotal} lessons
              </span>
              {r.problemsCredit !== undefined && (
                <span className="text-[0.8125rem] leading-snug text-ink-2 tabular">
                  {r.problemsAttempted} {r.problemsAttempted === 1 ? 'problem' : 'problems'} tried
                </span>
              )}
            </li>
          ))}
        </ul>
        {next.length > 0 && (
          <ul className="[&>li]:relative [&>li]:before:pointer-events-none [&>li]:before:absolute [&>li]:before:inset-x-4 [&>li]:before:top-0 [&>li]:before:h-px [&>li]:before:bg-hairline [&>li]:before:content-['']">
            {next.map((r) => {
              const stop = r.next!
              const mod = 'module' in stop ? getModule(stop.module) : undefined
              return (
                <li key={r.id}>
                  <Link
                    to={'module' in stop ? `/m/${stop.module}` : `/practice/${stop.problem}`}
                    className="flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors duration-100 hover:bg-surface-2/60 active:bg-surface-2"
                  >
                    {mod ? (
                      <TrackGlyph trackId={mod.trackId} size={36} />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-surface-3 text-ink-2">
                        <Timer size={18} strokeWidth={2} aria-hidden="true" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.8125rem] font-semibold text-ink-3">Next for {r.title}</span>
                      <span className="block text-base leading-snug font-semibold [overflow-wrap:anywhere]">
                        {plainText(stopTitle(stop))}
                      </span>
                    </span>
                    <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" className="shrink-0 text-ink-3" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <p className="mt-2 px-4 text-[0.875rem] text-ink-3">
        Half lessons passed on that round&rsquo;s route, half your best rubric coverage on its problems. The interview round
        is lessons only.
      </p>
    </section>
  )
}
