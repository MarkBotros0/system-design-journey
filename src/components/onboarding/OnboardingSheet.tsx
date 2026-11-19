import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronLeft } from 'lucide-react'
import { getModule, getProblem, routes, stopTitle } from '../../content'
import type { Route, RouteStop } from '../../content/types'
import { useProgress } from '../../state/ProgressProvider'
import { routeChangeOpts } from '../../lib/progress'
import { plainText } from '../../lib/text'
import { Sheet } from '../ui/Sheet'
import { Button, IconButton } from '../ui/Button'
import { TrackGlyph } from '../ui/TrackIcon'

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

/** The tracks a route passes through, in the order it first reaches them. */
function tracksOf(route: Route): string[] {
  const seen = new Set<string>()
  for (const s of route.stops) {
    const trackId = 'module' in s ? getModule(s.module)?.trackId : undefined
    if (trackId) seen.add(trackId)
  }
  return [...seen]
}

/* As many glyphs as fit one row at phone width, then a count of the rest. */
const STRIP_MAX = 8

/** A route's identity at a glance: the glyph of every track on it. */
function TrackStrip({ route }: { route: Route }) {
  const ids = tracksOf(route)
  const shown = ids.length > STRIP_MAX ? ids.slice(0, STRIP_MAX - 1) : ids
  const rest = ids.length - shown.length
  return (
    <span aria-hidden="true" className="flex gap-1">
      {shown.map((id) => (
        <TrackGlyph key={id} trackId={id} size={28} />
      ))}
      {rest > 0 && (
        <span className="flex h-7 min-w-7 items-center justify-center rounded-[9px] bg-surface px-1.5 text-[0.8125rem] font-bold text-ink-2 tabular">
          +{rest}
        </span>
      )}
    </span>
  )
}

const isBasics = (s: RouteStop) => 'module' in s && getModule(s.module)?.trackId === 'foundations'
const trackOfStop = (s: RouteStop | undefined) => (s && 'module' in s ? getModule(s.module)?.trackId : undefined)

/**
 * First-run choice of route, also reopened from You and Learn. Two short steps — which
 * route, then where on it to start — and only a pointer moves: nothing is ever locked or
 * marked done, so it is safe to get "wrong" and change later.
 */
export function OnboardingSheet({ open, onClose, mode = 'first-run' }: { open: boolean; onClose: () => void; mode?: 'first-run' | 'edit' }) {
  const { progress, chooseRoute, dismissOnboarding } = useProgress()
  const [routeId, setRouteId] = useState(progress.routeId)
  const [initial] = useState(() => {
    const s = progress.startStop
    return { routeId: progress.routeId, skipBasics: !!s && s.startsWith('m:') && getModule(s.slice(2))?.trackId !== 'foundations' }
  })
  const [skipBasics, setSkipBasics] = useState(initial.skipBasics)
  const [step, setStep] = useState<'route' | 'start'>('route')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const shownStep = useRef(step)

  const shown = routes.filter((r) => r.stops.length > 0)
  const route = shown.find((r) => r.id === routeId) ?? shown[0]
  // Starting after the basics only means something on a route that has some.
  const hasBasics = route.stops.some(isBasics)
  const afterBasics = route.stops.find((s) => !isBasics(s))
  const firstRun = mode === 'first-run'
  const finish = firstRun ? 'Start' : 'Save'

  // A new step is a new page of the sheet: start reading it from its heading.
  useEffect(() => {
    if (shownStep.current === step) return
    shownStep.current = step
    headingRef.current?.focus()
  }, [step])

  function done() {
    chooseRoute(routeId, routeChangeOpts(initial, { routeId, skipBasics }))
    onClose()
  }

  function skip() {
    dismissOnboarding()
    onClose()
  }

  return (
    <Sheet open={open} onClose={firstRun ? skip : onClose} labelledBy="onboarding-title" wide detent="large">
      <div className="flex flex-col">
        <div className="px-5 pt-1 pb-5 sm:px-6 sm:pt-6">
          {step === 'route' ? (
            <>
              <p className="pr-12 text-[0.9375rem] font-semibold text-ink-2">
                {firstRun ? 'Welcome to Senior Loop' : 'Route and starting point'}
              </p>
              <h2
                id="onboarding-title"
                ref={headingRef}
                tabIndex={-1}
                className="mt-1 pr-12 text-[2rem] leading-[1.1] font-extrabold tracking-[-0.025em] outline-none"
              >
                Pick your route
              </h2>
              <p className="mt-2 text-base text-ink-2">
                This sets what “next” means. Every topic stays open — you can search or jump anywhere.
              </p>

              <div role="radiogroup" aria-labelledby="onboarding-title" className="mt-5 flex flex-col gap-2.5">
                {shown.map((r) => {
                  const size = routeSize(r)
                  const on = r.id === routeId
                  return (
                    <Choice key={r.id} on={on} onSelect={() => setRouteId(r.id)}>
                      <span className="block text-[1.0625rem] leading-snug font-bold">{r.title}</span>
                      <span className="mt-1 block text-[0.9375rem] leading-snug text-ink-2">{r.blurb}</span>
                      <span className="mt-3 block">
                        <TrackStrip route={r} />
                      </span>
                      <span className="mt-2.5 block text-[0.875rem] font-semibold text-ink-2 tabular">
                        {size.lessons} lessons{size.problems ? ` · ${size.problems} problems` : ''} · about {size.hours} h
                      </span>
                    </Choice>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div className="-ml-1 flex items-center gap-1 pr-12">
                <IconButton label="Back to routes" onClick={() => setStep('route')}>
                  <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
                </IconButton>
                <p className="min-w-0 truncate text-[0.9375rem] font-semibold text-ink-2">{route.title}</p>
              </div>
              <h2
                id="onboarding-title"
                ref={headingRef}
                tabIndex={-1}
                className="mt-3 pr-12 text-[2rem] leading-[1.1] font-extrabold tracking-[-0.025em] outline-none"
              >
                Where to start
              </h2>
              <p className="mt-2 text-base text-ink-2">Foundations stays open whenever you want it.</p>

              <div role="radiogroup" aria-labelledby="onboarding-title" className="mt-5 flex flex-col gap-2.5">
                <Choice on={!skipBasics} onSelect={() => setSkipBasics(false)} leading={<TrackGlyph trackId="foundations" size={44} />}>
                  <span className="block text-[1.0625rem] leading-snug font-bold">From the beginning</span>
                  <span className="mt-0.5 block text-[0.9375rem] leading-snug text-ink-2">
                    Start at {plainText(stopTitle(route.stops[0]))}
                  </span>
                </Choice>
                <Choice
                  on={skipBasics}
                  onSelect={() => setSkipBasics(true)}
                  leading={<TrackGlyph trackId={trackOfStop(afterBasics) ?? 'core'} size={44} />}
                >
                  <span className="block text-[1.0625rem] leading-snug font-bold">I already know the basics</span>
                  <span className="mt-0.5 block text-[0.9375rem] leading-snug text-ink-2">
                    Start after Foundations{afterBasics ? `, at ${plainText(stopTitle(afterBasics))}` : ''}
                  </span>
                </Choice>
              </div>
            </>
          )}
        </div>

        {/* Docked in the thumb zone; the list scrolls behind it. */}
        <div className="sticky bottom-0 mt-auto flex gap-2.5 bg-surface px-5 pt-3 pb-4 sm:px-6 sm:pb-6">
          {step === 'route' ? (
            <>
              <Button size="lg" variant="secondary" onClick={firstRun ? skip : onClose} className="w-auto! shrink-0">
                {firstRun ? 'Skip for now' : 'Cancel'}
              </Button>
              <Button size="lg" onClick={hasBasics ? () => setStep('start') : done} className="flex-1">
                {hasBasics ? 'Next' : finish}
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={done}>
              {finish}
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  )
}

/** One big selectable row. Selection shows three ways: the fill, the ring and the tick. */
function Choice({ on, onSelect, leading, children }: { on: boolean; onSelect: () => void; leading?: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-[22px] p-4 text-left transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.99] motion-reduce:active:scale-100 ${
        on ? 'bg-surface-3 ring-2 ring-line' : 'bg-surface-2 hover:bg-surface-3/70'
      }`}
    >
      {leading}
      <span className="min-w-0 flex-1">{children}</span>
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          on ? 'bg-line text-line-ink' : 'border-2 border-ink-3/70'
        }`}
      >
        {on && <Check size={14} strokeWidth={3.2} />}
      </span>
    </button>
  )
}
