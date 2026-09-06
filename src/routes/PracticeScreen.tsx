import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { problems } from '../content'
import { getPattern } from '../content/patterns'
import { BUDGETED_MINUTES, TOTAL_MINUTES } from '../content/framework'
import { useProgress } from '../state/ProgressProvider'
import { Badge, ScreenTitle } from '../components/ui/Bits'
import { plainText } from '../components/content/Inline'
import type { Difficulty } from '../content/types'

const difficultyTone: Record<Difficulty, 'mastered' | 'streak' | 'alert'> = {
  easy: 'mastered',
  medium: 'streak',
  hard: 'alert',
}

export function PracticeScreen() {
  const { progress } = useProgress()

  return (
    <div>
      <ScreenTitle
        title="Practice"
        sub={`Full design problems on the clock. ${BUDGETED_MINUTES} minutes of budget inside a ${TOTAL_MINUTES}-minute slot.`}
      />

      <p className="mb-6 rounded-xl border-l-2 border-line bg-line-soft px-4 py-3 text-[0.875rem] leading-relaxed text-ink">
        Attempt it before you read the answer. Passively reading a worked solution feels
        productive and teaches almost nothing — the struggle is the part that sticks.
      </p>

      <ul className="flex flex-col gap-3">
        {problems.map((p) => {
          const attempts = progress.attempts.filter((a) => a.problemId === p.id && a.finishedAt)
          const best = attempts.reduce((max, a) => {
            const hit = Object.values(a.scored).filter(Boolean).length
            return Math.max(max, hit)
          }, 0)

          return (
            <li key={p.id}>
              <Link
                to={`/practice/${p.id}`}
                className="flex items-center gap-4 rounded-2xl border border-hairline bg-surface px-4 py-4 transition-colors duration-150 hover:border-line"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge tone={difficultyTone[p.difficulty]}>{p.difficulty}</Badge>
                    {p.patterns.map((id) => {
                      const pattern = getPattern(id)
                      return pattern ? (
                        <Badge key={id}>{pattern.name}</Badge>
                      ) : null
                    })}
                  </div>
                  <h3 className="text-[1.0625rem] font-semibold">{p.title}</h3>
                  {/* Inside a Link — strip markup rather than render a nested button. */}
                  <p className="mt-1 line-clamp-2 text-[0.875rem] leading-relaxed text-ink-2">
                    {plainText(p.brief)}
                  </p>
                  {attempts.length > 0 && (
                    <p className="mt-2 font-mono text-[0.6875rem] text-ink-3 tabular">
                      {attempts.length} attempt{attempts.length === 1 ? '' : 's'} &middot; best{' '}
                      {best}/{p.rubric.length}
                    </p>
                  )}
                </div>
                <ArrowRight size={18} strokeWidth={2} className="shrink-0 text-ink-3" />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
