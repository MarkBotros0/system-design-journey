import { Link } from 'react-router-dom'
import { Check, ChevronDown, Flag } from 'lucide-react'
import type { RouteStop } from '../../content/types'
import type { StopGroup } from './groupStops'
import type { ProgressState } from '../../lib/storage'
import { stopKey } from '../../lib/storage'
import { getModule, getProblem } from '../../content'
import { missingPrereqs, moduleProgress, moduleStatus, problemDone, stopDone, type ModuleStatus } from '../../lib/progress'
import { bestCoverage } from '../../lib/readiness'
import { plainText } from '../../lib/text'
import { Badge, Meter } from '../ui/Bits'
import { ProgressRing } from '../ui/ProgressRing'
import { TrackTile } from '../ui/TrackIcon'

/**
 * The journey, drawn as a line. Stations are lessons; diamonds are checkpoint problems.
 * The rail fills in behind each finished stop, so where you are is legible before you
 * read a word. Nothing is locked — a station whose prerequisites are not done says what
 * it builds on, quietly, and still opens.
 */

const RAIL_LEFT = 'left-[17px]' // centre of the 36px node column, minus half the 2px rail
const DIFF_TONE = { easy: 'mastered', medium: 'streak', hard: 'alert' } as const

function Node({ status, problem, current }: { status: ModuleStatus | 'done' | 'todo'; problem?: boolean; current?: boolean }) {
  const ring = current ? 'ring-4 ring-line/25' : ''
  if (problem) {
    const done = status === 'done'
    return (
      <span
        className={`flex h-[18px] w-[18px] rotate-45 items-center justify-center rounded-[3px] border-2 ${
          done ? 'border-mastered bg-mastered text-paper' : current ? 'border-line bg-paper' : 'border-ink-3 bg-paper'
        } ${ring}`}
      >
        {done && <Check size={10} strokeWidth={3.5} className="-rotate-45" />}
      </span>
    )
  }
  if (status === 'mastered') {
    return (
      <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full bg-mastered text-paper ${ring}`}>
        <Check size={11} strokeWidth={3.5} />
      </span>
    )
  }
  if (status === 'passed') {
    return (
      <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full bg-line text-line-ink ${ring}`}>
        <Check size={11} strokeWidth={3.5} />
      </span>
    )
  }
  if (status === 'started') {
    return (
      <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-line bg-paper ${ring}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-line" />
      </span>
    )
  }
  return <span className={`h-[18px] w-[18px] rounded-full border-2 ${current ? 'border-line' : 'border-ink-3'} bg-paper ${ring}`} />
}

const STATUS_LABEL: Record<ModuleStatus, { text: string; cls: string }> = {
  mastered: { text: 'Mastered', cls: 'text-mastered' },
  passed: { text: 'Passed', cls: 'text-line' },
  started: { text: 'In progress', cls: 'text-streak' },
  available: { text: '', cls: 'text-ink-3' },
}

function ModuleStation({ id, progress, current, number }: { id: string; progress: ProgressState; current: boolean; number?: number }) {
  const m = getModule(id)
  if (!m) return null
  const status = moduleStatus(progress, m)
  const pct = moduleProgress(progress, m)
  const missing = status === 'available' ? missingPrereqs(progress, m) : []
  const label = STATUS_LABEL[status]
  return (
    <Link
      to={`/m/${m.id}`}
      className={`block rounded-2xl border bg-surface px-4 py-3.5 transition-colors duration-150 hover:border-line active:bg-surface-2 ${
        current ? 'border-line' : 'border-hairline'
      }`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[0.6875rem] text-ink-3 tabular">{String(number ?? m.station).padStart(2, '0')}</span>
        <h3 className="text-[1rem] leading-snug font-semibold">{plainText(m.title)}</h3>
      </div>
      <p className="mt-1 line-clamp-2 text-[0.875rem] leading-relaxed text-ink-2">{plainText(m.summary)}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        {current && <span className="font-mono text-[0.6875rem] font-semibold tracking-wide text-line">Up next</span>}
        {label.text ? (
          <span className={`font-mono text-[0.6875rem] tracking-wide ${label.cls}`}>{label.text}</span>
        ) : null}
        <span className="font-mono text-[0.6875rem] text-ink-3">{m.minutes} min</span>
        {status === 'started' && <Meter value={pct} className="max-w-24" label={`${plainText(m.title)} progress`} />}
      </div>
      {missing.length > 0 && (
        <p className="mt-1.5 truncate text-[0.75rem] text-ink-3">Builds on: {plainText(missing[0].title)}</p>
      )}
    </Link>
  )
}

function ProblemStation({ id, progress, current }: { id: string; progress: ProgressState; current: boolean }) {
  const p = getProblem(id)
  if (!p) return null
  const done = problemDone(progress, id)
  const best = bestCoverage(progress, id, p)
  return (
    <Link
      to={`/practice/${p.id}`}
      className={`block rounded-2xl border border-dashed bg-surface/60 px-4 py-3.5 transition-colors duration-150 hover:border-line active:bg-surface-2 ${
        current ? 'border-line' : 'border-hairline'
      }`}
    >
      <p className="flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-[0.12em] text-ink-3 uppercase">
        <Flag size={12} strokeWidth={2.2} aria-hidden="true" /> Checkpoint
      </p>
      <h3 className="mt-1 text-[1rem] leading-snug font-semibold">{plainText(p.title)}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge tone={DIFF_TONE[p.difficulty]}>{p.difficulty}</Badge>
        {current && <span className="font-mono text-[0.6875rem] font-semibold text-line">Up next</span>}
        {done && best !== undefined && (
          <span className="font-mono text-[0.6875rem] text-ink-2 tabular">best {Math.round(best * 100)}%</span>
        )}
        {!done && <span className="font-mono text-[0.6875rem] text-ink-3">45 min on the clock</span>}
      </div>
    </Link>
  )
}

/** A vertical run of stations with the rail behind them. Used by the map and track pages. */
export function StationList({
  stops,
  progress,
  nextKey,
  numbered = false,
}: {
  stops: RouteStop[]
  progress: ProgressState
  nextKey?: string
  /** Number by position in this list rather than by station within the track. */
  numbered?: boolean
}) {
  return (
    <ol>
      {stops.map((s, i) => {
        const key = stopKey(s)
        const done = stopDone(progress, s)
        const current = key === nextKey
        const isProblem = 'problem' in s
        const status: ModuleStatus | 'done' | 'todo' = isProblem
          ? done
            ? 'done'
            : 'todo'
          : moduleStatus(progress, getModule(s.module)!)
        return (
          <li key={key} id={`stop-${key}`} className="relative grid grid-cols-[36px_minmax(0,1fr)] gap-x-2">
            {i < stops.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute ${RAIL_LEFT} top-6 bottom-0 w-0.5 rounded-full ${done ? 'bg-line' : 'bg-hairline'}`}
              />
            )}
            <div className="relative z-10 flex justify-center pt-4">
              <Node status={status} problem={isProblem} current={current} />
            </div>
            <div className="pb-3">
              {isProblem ? (
                <ProblemStation id={s.problem} progress={progress} current={current} />
              ) : (
                <ModuleStation id={s.module} progress={progress} current={current} number={numbered ? i + 1 : undefined} />
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function LineMap({
  groups,
  progress,
  nextKey,
  expanded,
  onToggle,
}: {
  groups: StopGroup[]
  progress: ProgressState
  nextKey?: string
  expanded: Set<string>
  onToggle: (key: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => {
        const done = g.stops.filter((s) => stopDone(progress, s)).length
        const open = expanded.has(g.key)
        const hasNext = g.stops.some((s) => stopKey(s) === nextKey)
        return (
          <section key={g.key} id={`group-${g.key}`} aria-labelledby={`grp-${g.key}`} className="scroll-mt-32">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`grp-body-${g.key}`}
              onClick={() => onToggle(g.key)}
              className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors duration-150 hover:border-line ${
                open ? 'border-hairline bg-surface' : 'border-hairline bg-surface/70'
              }`}
            >
              {g.track ? (
                <TrackTile trackId={g.track.id} code={g.code} size="sm" />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-line-soft text-line">
                  <Flag size={16} strokeWidth={2} aria-hidden="true" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span id={`grp-${g.key}`} className="block truncate text-[1rem] font-semibold">
                  {g.title}
                </span>
                <span className="block font-mono text-[0.6875rem] text-ink-3 tabular">
                  {done}/{g.stops.length} done{hasNext && !open ? ' · up next is here' : ''}
                </span>
              </span>
              <ProgressRing
                value={g.stops.length ? done / g.stops.length : 0}
                size={28}
                label={`${g.title} progress`}
                tone={done === g.stops.length && done > 0 ? 'mastered' : 'line'}
              />
              <ChevronDown
                size={18}
                strokeWidth={2}
                aria-hidden="true"
                className={`shrink-0 text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>
            {open && (
              <div id={`grp-body-${g.key}`} className="pt-3">
                {g.track && <p className="mb-3 px-1 text-[0.875rem] leading-relaxed text-ink-2">{g.track.blurb}</p>}
                <StationList stops={g.stops} progress={progress} nextKey={nextKey} />
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
