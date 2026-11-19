import { Link } from 'react-router-dom'
import { Clock, Timer } from 'lucide-react'
import { TOTAL_MINUTES } from '../../content/framework'
import { getPattern } from '../../content/patterns'
import type { Problem } from '../../content/types'
import { useProgress } from '../../state/ProgressProvider'
import { draftOf, finishedAttempts } from '../../lib/attempts'
import { bestCoverage } from '../../lib/readiness'
import { plainText } from '../../lib/text'
import { ProgressRing } from '../ui/ProgressRing'
import { trackStyle } from '../ui/trackStyle'
import { DifficultyBadge, ProblemGlyph } from './ProblemBits'
import { problemTrack } from './problemMeta'

/**
 * One problem on the Practice shelves: a filled card, the whole of it one tap target.
 * Everything inside is plain text — it sits in a link.
 */
export function ProblemCard({ p }: { p: Problem }) {
  const { progress } = useProgress()
  const attempts = finishedAttempts(progress, p.id).length
  const best = bestCoverage(progress, p.id, p)
  const draft = draftOf(progress, p.id)
  const names = p.patterns.map((id) => getPattern(id)?.name).filter(Boolean)
  const track = problemTrack(p)

  return (
    <Link
      to={`/practice/${p.id}`}
      style={{ ...trackStyle(track), boxShadow: 'var(--shadow-card)' }}
      className="flex h-full flex-col rounded-[22px] bg-surface p-4 transition-[background-color,transform] duration-150 hover:bg-surface-2/60 active:scale-[0.985] motion-reduce:active:scale-100"
    >
      <div className="flex items-start gap-3">
        <ProblemGlyph trackId={track} kind={p.kind} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[1.0625rem] leading-snug font-bold [overflow-wrap:anywhere]">{plainText(p.title)}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <DifficultyBadge difficulty={p.difficulty} />
            <span className="inline-flex items-center gap-1 text-[0.875rem] text-ink-2 tabular">
              <Clock size={14} strokeWidth={2.2} aria-hidden="true" />
              {TOTAL_MINUTES} min
            </span>
          </div>
        </div>
        {attempts > 0 && best !== undefined && (
          <span className="flex shrink-0 items-center gap-1.5">
            <ProgressRing value={best} size={28} label="Best coverage" />
            <span aria-hidden="true" className="text-[0.875rem] font-bold tabular">
              {Math.round(best * 100)}%
            </span>
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-[0.9375rem] leading-relaxed text-ink-2">{plainText(p.brief)}</p>

      {draft && (
        <p className="mt-2.5 flex items-center gap-1.5 text-[0.875rem] font-semibold text-streak">
          <Timer size={15} strokeWidth={2.3} aria-hidden="true" />
          Attempt in progress
        </p>
      )}
      {names.length > 0 && <p className="mt-auto pt-2.5 text-[0.875rem] leading-snug text-ink-3">{names.join(' · ')}</p>}
    </Link>
  )
}
