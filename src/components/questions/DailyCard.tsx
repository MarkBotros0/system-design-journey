import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearFinishedSet, isFinished, loadSet, todayCount } from '../../lib/bank'
import { useProgress } from '../../state/ProgressProvider'
import { Button, ButtonLink } from '../ui/Button'
import { ProgressRing } from '../ui/ProgressRing'

/**
 * Today's questions against the daily goal, and the one tap that starts or continues
 * them. On Home and on Review — the habit should never be more than a tap away.
 */
export function DailyCard() {
  const { progress } = useProgress()
  const navigate = useNavigate()
  // sessionStorage, read once: a set in progress from earlier in this visit.
  const [saved] = useState(loadSet)
  const today = todayCount(progress)
  const goal = progress.dailyGoal
  const met = today.answered >= goal
  const resumable = saved?.source === 'daily' && !isFinished(saved) ? saved : null
  const left = resumable ? resumable.ids.length - resumable.at : 0

  const start = () => {
    clearFinishedSet()
    navigate('/questions/session?set=daily')
  }

  return (
    <section aria-labelledby="daily-h" className="rounded-2xl border border-hairline bg-surface p-4">
      <div className="flex items-center gap-4">
        <ProgressRing
          value={Math.min(1, today.answered / goal)}
          size={56}
          tone={met ? 'correct' : 'line'}
          label={`${today.answered} of ${goal} questions today`}
        />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase">Daily questions</p>
          <h2 id="daily-h" className="mt-0.5 text-[1.0625rem] leading-snug font-semibold">
            {resumable ? `${left} left in today's set` : met ? 'Goal met for today' : `${goal - today.answered} to go today`}
          </h2>
          <p className="mt-0.5 text-[0.8125rem] leading-snug text-ink-2">
            {met && !resumable
              ? `${today.answered} answered. A few more keeps it fresh.`
              : 'About two minutes. True or false, pick one, select all, match.'}
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button onClick={start} className="flex-1">
          {resumable ? 'Continue' : met ? 'A few more' : 'Start'}
        </Button>
        <ButtonLink to="/questions" variant="secondary">
          Question bank
        </ButtonLink>
      </div>
    </section>
  )
}
