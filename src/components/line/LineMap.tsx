import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Check, ChevronDown, Flag } from 'lucide-react'
import type { RouteStop } from '../../content/types'
import type { StopGroup } from './groupStops'
import type { ProgressState } from '../../lib/storage'
import { stopKey } from '../../lib/storage'
import { getModule, getProblem } from '../../content'
import { missingPrereqs, moduleProgress, moduleStatus, problemDone, stopDone, type ModuleStatus } from '../../lib/progress'
import { bestCoverage } from '../../lib/readiness'
import { plainText } from '../../lib/text'
import { Badge } from '../ui/Bits'
import { Group } from '../ui/List'
import { ProgressRing } from '../ui/ProgressRing'
import { TrackGlyph } from '../ui/TrackIcon'
import { trackStyle } from '../ui/trackStyle'

/**
 * The journey, drawn as a line. Each track is a row with its glyph; open it and its stops
 * hang off a rail that drops from that glyph, drawn in the track's colour as far as you
 * have travelled. Lessons are round stops, checkpoint problems square ones. Nothing is
 * locked: a stop whose prerequisites are not done says what it builds on, quietly, and
 * still opens.
 */

type StopState = ModuleStatus | 'problem' | 'problem-done'

const DIFFICULTY = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const

/** Jump targets land below the sticky top bar and the chip row under it. */
const JUMP_MARGIN: CSSProperties = { scrollMarginTop: 'calc(env(safe-area-inset-top) + 8.25rem)' }

/**
 * Where a stop stands — always a shape as well as a colour: an empty ring (not started),
 * a partial ring (in progress), a tick (passed), a seal (mastered). Problems are square.
 */
function StopGlyph({ state, value = 0 }: { state: StopState; value?: number }) {
  switch (state) {
    case 'mastered':
      // A solid seal; the stroke in the row's own colour cuts the tick out of it.
      return <BadgeCheck size={28} strokeWidth={1.8} aria-hidden="true" className="shrink-0 fill-mastered text-surface" />
    case 'passed':
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-correct-soft text-correct">
          <Check size={16} strokeWidth={3} aria-hidden="true" />
        </span>
      )
    case 'started': {
      const r = 9.5
      const c = 2 * Math.PI * r
      // Never drawn closed, so it cannot be mistaken for a finished stop.
      const v = Math.max(0.25, Math.min(0.85, value))
      return (
        <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="shrink-0 -rotate-90">
          <circle cx="14" cy="14" r={r} fill="none" strokeWidth="3" className="stroke-surface-3" />
          <circle
            cx="14"
            cy="14"
            r={r}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - v)}
            className="stroke-streak"
          />
        </svg>
      )
    }
    case 'problem-done':
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-correct-soft text-correct">
          <Check size={16} strokeWidth={3} aria-hidden="true" />
        </span>
      )
    case 'problem':
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-surface-3 text-ink-2">
          <Flag size={14} strokeWidth={2.4} aria-hidden="true" />
        </span>
      )
    default:
      return (
        <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="shrink-0">
          <circle cx="14" cy="14" r="7.5" fill="none" strokeWidth="2" className="stroke-ink-3" />
        </svg>
      )
  }
}

const rowCls =
  'flex min-h-14 w-full items-center px-4 py-2.5 text-left transition-colors duration-100 hover:bg-surface-2/60 active:bg-surface-2 focus-visible:-outline-offset-2'

/** A rail segment: travelled in the track's colour, still ahead in a quiet neutral. */
const rail = (travelled: boolean) => `absolute w-0.5 rounded-full ${travelled ? 'bg-track' : 'bg-surface-3'}`

function ModuleBody({ id, progress }: { id: string; progress: ProgressState }) {
  const m = getModule(id)!
  const status = moduleStatus(progress, m)
  const missing = status === 'available' ? missingPrereqs(progress, m) : []
  const word =
    status === 'mastered' ? (
      <span className="font-semibold text-mastered">Mastered</span>
    ) : status === 'passed' ? (
      <span className="font-semibold text-correct">Passed</span>
    ) : status === 'started' ? (
      <span className="font-semibold text-streak">In progress</span>
    ) : null
  return (
    <>
      <span className="block text-base leading-snug font-semibold">{plainText(m.title)}</span>
      <span className="mt-0.5 block text-[0.875rem] leading-snug text-ink-2 tabular">
        {word}
        {word && ' · '}
        {m.minutes} min
      </span>
      {missing.length > 0 && (
        <span className="mt-0.5 block truncate text-[0.875rem] leading-snug text-ink-3">
          Builds on <span className="font-medium text-ink-2">{plainText(missing[0].title)}</span>
        </span>
      )}
    </>
  )
}

function ProblemBody({ id, progress, label }: { id: string; progress: ProgressState; label: string }) {
  const p = getProblem(id)!
  const done = problemDone(progress, id)
  const best = done ? bestCoverage(progress, id, p) : undefined
  return (
    <>
      <span className="block text-base leading-snug font-semibold">{plainText(p.title)}</span>
      <span className="mt-0.5 block text-[0.875rem] leading-snug text-ink-2 tabular">
        {done ? <span className="font-semibold text-correct">Done</span> : label} · {DIFFICULTY[p.difficulty]} ·{' '}
        {best !== undefined ? `best ${Math.round(best * 100)}%` : '45 min'}
      </span>
    </>
  )
}

/**
 * A run of stops on a rail. Used by the route map (inside an open track) and the track page
 * (numbered). `leadIn` continues the rail up into whatever sits above the first stop.
 */
export function StationList({
  stops,
  progress,
  nextKey,
  numbered = false,
  leadIn = false,
  problemLabel = 'Checkpoint',
}: {
  stops: RouteStop[]
  progress: ProgressState
  nextKey?: string
  /** Number by position in this list (the track page). */
  numbered?: boolean
  leadIn?: boolean
  /** What a problem stop is here: a track's checkpoint, or one of a run of problems. */
  problemLabel?: string
}) {
  const done = stops.map((s) => stopDone(progress, s))
  // Glyph column centre and text start, in px from the row's left edge.
  const railX = numbered ? 'left-[57px]' : 'left-[33px]'
  const sepX = numbered ? 'left-[84px]' : 'left-16'
  return (
    <ol>
      {stops.map((s, i) => {
        const key = stopKey(s)
        const current = key === nextKey
        const isProblem = 'problem' in s
        if (isProblem ? !getProblem(s.problem) : !getModule(s.module)) return null
        const m = isProblem ? undefined : getModule(s.module)!
        const state: StopState = isProblem ? (done[i] ? 'problem-done' : 'problem') : moduleStatus(progress, m!)
        return (
          <li key={key} id={`stop-${key}`} className="relative" style={JUMP_MARGIN}>
            {i > 0 && <span aria-hidden="true" className={`absolute top-0 right-4 h-px bg-hairline ${sepX}`} />}
            {(i > 0 || leadIn) && <span aria-hidden="true" className={`${rail(done[i])} ${railX} top-0 h-[calc(50%-18px)]`} />}
            {i < stops.length - 1 && (
              <span aria-hidden="true" className={`${rail(done[i + 1])} ${railX} top-[calc(50%+18px)] bottom-0`} />
            )}
            <Link to={isProblem ? `/practice/${s.problem}` : `/m/${s.module}`} className={rowCls}>
              {numbered && (
                <span className="mr-2 w-5 shrink-0 text-right text-[0.9375rem] font-bold text-ink-3 tabular">{i + 1}</span>
              )}
              <span className={`flex shrink-0 justify-center ${numbered ? 'w-7' : 'w-9'}`}>
                <StopGlyph state={state} value={m ? moduleProgress(progress, m) : 0} />
              </span>
              <span className="ml-3 min-w-0 flex-1">
                {isProblem ? (
                  <ProblemBody id={s.problem} progress={progress} label={problemLabel} />
                ) : (
                  <ModuleBody id={s.module} progress={progress} />
                )}
              </span>
              {current && (
                <span className="ml-3 shrink-0">
                  <Badge tone="line">Up next</Badge>
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ol>
  )
}

/** The route as one inset list of tracks; each opens in place to show its stops. */
export function LineMap({
  groups,
  progress,
  nextKey,
  expanded,
  onToggle,
  title,
  action,
}: {
  groups: StopGroup[]
  progress: ProgressState
  nextKey?: string
  expanded: Set<string>
  onToggle: (key: string) => void
  title?: ReactNode
  action?: ReactNode
}) {
  return (
    <Group title={title} action={action}>
      {groups.map((g) => {
        const done = g.stops.filter((s) => stopDone(progress, s)).length
        const open = expanded.has(g.key)
        const hasNext = g.stops.some((s) => stopKey(s) === nextKey)
        const firstDone = g.stops.length > 0 && stopDone(progress, g.stops[0])
        return (
          <li key={g.key} id={`group-${g.key}`} style={{ ...trackStyle(g.track?.id), ...JUMP_MARGIN }}>
            <section aria-labelledby={`grp-${g.key}`}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`grp-body-${g.key}`}
                onClick={() => onToggle(g.key)}
                className="relative flex min-h-[4.25rem] w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-100 hover:bg-surface-2/60 active:bg-surface-2 focus-visible:-outline-offset-2"
              >
                {open && <span aria-hidden="true" className={`${rail(firstDone)} left-[33px] top-[calc(50%+22px)] bottom-0`} />}
                {g.track ? (
                  <TrackGlyph trackId={g.track.id} size={36} />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-surface-3 text-ink">
                    <Flag size={17} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span id={`grp-${g.key}`} className="block text-[1.0625rem] leading-snug font-bold">
                    {g.title}
                  </span>
                  <span className="mt-0.5 block text-[0.875rem] leading-snug text-ink-2 tabular">
                    {done} of {g.stops.length} {g.track ? 'passed' : 'done'}
                    {hasNext && !open && <span className="font-semibold text-ink"> · Up next is here</span>}
                  </span>
                </span>
                <ProgressRing value={g.stops.length ? done / g.stops.length : 0} size={28} label={`${g.title} progress`} tone="track" />
                <ChevronDown
                  size={20}
                  strokeWidth={2.2}
                  aria-hidden="true"
                  className={`shrink-0 text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
              </button>
              {open && (
                <div id={`grp-body-${g.key}`} className="pb-1">
                  {g.track && (
                    <p className="relative -mt-1 pr-4 pb-2 pl-16 text-[0.875rem] leading-snug text-ink-2">
                      <span aria-hidden="true" className={`${rail(firstDone)} left-[33px] top-0 bottom-0`} />
                      {g.track.blurb}
                    </p>
                  )}
                  <StationList
                    stops={g.stops}
                    progress={progress}
                    nextKey={nextKey}
                    leadIn
                    problemLabel={g.track ? 'Checkpoint' : 'Problem'}
                  />
                </div>
              )}
            </section>
          </li>
        )
      })}
    </Group>
  )
}
