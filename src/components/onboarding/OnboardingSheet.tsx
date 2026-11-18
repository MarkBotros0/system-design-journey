import { useState } from 'react'
import { Check } from 'lucide-react'
import { getModule, getProblem, routes } from '../../content'
import type { Route } from '../../content/types'
import { useProgress } from '../../state/ProgressProvider'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'

const PROBLEM_MINUTES = 45

/** Honest size of a route: lesson reading time plus a 45-minute slot per problem. */
export function routeSize(route: Route): { lessons: number; problems: number; hours: number } {
  let minutes = 0
  let lessons = 0
  let problems = 0
  for (const s of route.stops) {
    if ('module' in s) {
      lessons += 1
      minutes += getModule(s.module)?.minutes ?? 0
    } else if (getProblem(s.problem)) {
      problems += 1
      minutes += PROBLEM_MINUTES
    }
  }
  return { lessons, problems, hours: Math.max(0.5, Math.round((minutes / 60) * 2) / 2) }
}

/**
 * First-run choice of route, also reopened from You. One question and one toggle — the
 * answer only moves a pointer, nothing is ever locked or marked done, so it is safe to
 * get "wrong" and change later.
 */
export function OnboardingSheet({ open, onClose, mode = 'first-run' }: { open: boolean; onClose: () => void; mode?: 'first-run' | 'edit' }) {
  const { progress, chooseRoute, dismissOnboarding } = useProgress()
  const [routeId, setRouteId] = useState(progress.routeId)
  const [skipBasics, setSkipBasics] = useState(() => {
    const s = progress.startStop
    return !!s && s.startsWith('m:') && getModule(s.slice(2))?.trackId !== 'foundations'
  })

  function done() {
    chooseRoute(routeId, { skipBasics })
    onClose()
  }

  function skip() {
    dismissOnboarding()
    onClose()
  }

  return (
    <Sheet open={open} onClose={mode === 'first-run' ? skip : onClose} labelledBy="onboarding-title" wide>
      <div className="px-5 pt-3 pb-5 sm:px-6 sm:pt-6 sm:pb-6">
        <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-line uppercase">
          {mode === 'first-run' ? 'Welcome to Throughput' : 'Route and starting point'}
        </p>
        <h2 id="onboarding-title" className="mt-2 pr-10 text-[1.375rem] leading-tight font-semibold">
          What are you preparing for?
        </h2>
        <p className="mt-1.5 text-[0.9375rem] text-ink-2">
          This sets what “next” means. Every topic stays open — you can search or jump anywhere.
        </p>

        <div role="radiogroup" aria-labelledby="onboarding-title" className="mt-4 flex flex-col gap-2">
          {routes.filter((r) => r.stops.length > 0).map((r) => {
            const size = routeSize(r)
            const on = r.id === routeId
            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setRouteId(r.id)}
                className={`flex min-h-16 items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors duration-150 ${
                  on ? 'border-line bg-line-soft' : 'border-hairline bg-surface hover:border-line'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    on ? 'border-line bg-line text-line-ink' : 'border-ink-3'
                  }`}
                >
                  {on && <Check size={12} strokeWidth={3.5} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] font-semibold">{r.title}</span>
                  <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ink-2">{r.blurb}</span>
                  <span className="mt-1 block font-mono text-[0.6875rem] text-ink-3 tabular">
                    {size.lessons} lessons{size.problems ? ` · ${size.problems} problems` : ''} · ~{size.hours} h
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-hairline bg-surface px-4 py-3">
          <input
            type="checkbox"
            checked={skipBasics}
            onChange={(e) => setSkipBasics(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-[var(--line)]"
          />
          <span className="text-[0.9375rem]">
            I already know the basics — start after Foundations
            <span className="block text-[0.8125rem] text-ink-3">Foundations stays open whenever you want it.</span>
          </span>
        </label>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <Button size="lg" onClick={done} className="sm:flex-1">
            {mode === 'first-run' ? 'Start' : 'Save'}
          </Button>
          <Button size="lg" variant="ghost" onClick={mode === 'first-run' ? skip : onClose} className="sm:flex-1">
            {mode === 'first-run' ? 'Skip for now' : 'Cancel'}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
