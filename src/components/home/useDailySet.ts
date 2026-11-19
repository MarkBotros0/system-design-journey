import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isFinished, todayCount } from '../../lib/bank'
import { clearFinishedSet, loadSet } from '../../lib/setStore'
import { useProgress } from '../../state/ProgressProvider'

/**
 * Today's questions against the daily goal, and the one call that starts or continues
 * them. Shared by the Today card on Home and the Questions tile on Review, so both always
 * open the same set and say the same thing about it.
 */
export function useDailySet() {
  const { progress } = useProgress()
  const navigate = useNavigate()
  // sessionStorage, read once: a set in progress from earlier in this visit.
  const [saved] = useState(loadSet)
  const today = todayCount(progress)
  const goal = progress.dailyGoal
  const met = today.answered >= goal
  const resumable = saved?.source === 'daily' && !isFinished(saved) ? saved : null

  return {
    answered: today.answered,
    goal,
    met,
    resumable: !!resumable,
    /** Questions left in the set already under way. */
    setLeft: resumable ? resumable.ids.length - resumable.at : 0,
    /** Questions still to answer before the goal is met. */
    toGo: Math.max(0, goal - today.answered),
    /** What the start control should say, short enough for a half-width pill. */
    verb: resumable ? 'Continue' : met ? 'A few more' : 'Start',
    start() {
      clearFinishedSet()
      navigate('/questions/session?set=daily')
    },
  }
}

/** Minutes for a number of questions, at roughly twelve seconds each — for "about N min". */
export function questionMinutes(questions: number): number {
  return Math.max(1, Math.round(questions * 0.2))
}
