import { useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { getModule } from '../../content'
import { headingSlugs } from '../../lib/slug'
import { dayKey } from '../../lib/progress'
import { emptyProgress, type ProgressState } from '../../lib/storage'
import { useProgress } from '../../state/ProgressProvider'

/** Dev-only: replace progress with a realistic mid-journey learner, then go to `?to=`. */
function fixture(): ProgressState {
  const p = emptyProgress()
  const passed = ['f-what', 'f-network', 'f-api', 'f-db', 'f-storage', 'f-cache', 'f-scale', 'c-framework', 'c-requirements']
  const now = Date.now()
  for (const id of passed) {
    p.lessonsRead[id] = now - 86_400_000 * 3
    p.quiz[id] = { best: 1, attempts: 1, lastAt: now }
  }
  p.lessonsRead['c-modelling'] = now
  p.quiz['c-modelling'] = { best: 0.67, attempts: 1, lastAt: now }
  const cap = getModule('c-modelling')!
  const firstHeading = [...headingSlugs(cap.lesson).values()][1]
  p.lastPlace = { moduleId: 'c-modelling', sectionId: firstHeading, at: now }
  p.attempts = [
    { id: 'a1', problemId: 'bitly', startedAt: now - 3_600_000, finishedAt: now - 900_000, notes: {}, phaseSeconds: {}, scored: { r1: true, r2: true, r3: true } },
  ]
  for (let i = 0; i < 7; i++) if (i !== 2) p.activity[dayKey(now - i * 86_400_000)] = 3 + i
  p.streak = { current: 2, longest: 6, lastDay: dayKey(now) }
  p.onboarded = true
  return p
}

export function SeedFixture() {
  const { replaceAll, ready } = useProgress()
  const [params] = useSearchParams()
  const fresh = params.get('fresh') === '1'
  useEffect(() => {
    if (ready) replaceAll(fresh ? emptyProgress() : fixture())
  }, [ready, replaceAll, fresh])
  return ready ? <Navigate to={params.get('to') ?? '/'} replace /> : null
}
