import { Link } from 'react-router-dom'
import { Check, Lock } from 'lucide-react'
import type { Module, Track } from '../../content/types'
import type { ProgressState } from '../../lib/storage'
import { getModule } from '../../content'
import { moduleProgress, moduleStatus, type ModuleStatus } from '../../lib/progress'
import { Meter } from '../ui/Bits'

/**
 * The journey, drawn as a line. Stations are modules; the rail behind them fills in as
 * you pass each one, so where you are is legible before you read a single word.
 *
 * The numbering is real information — these are prerequisites in order, not decoration.
 */

const RAIL_LEFT = 'left-[17px]' // centre of the 36px node column, minus half the 2px rail

function Node({ status }: { status: ModuleStatus }) {
  if (status === 'mastered') {
    return (
      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-mastered text-paper">
        <Check size={11} strokeWidth={3.5} />
      </span>
    )
  }
  if (status === 'passed') {
    return <span className="h-[18px] w-[18px] rounded-full border-[3px] border-line bg-paper" />
  }
  if (status === 'started') {
    return (
      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-line bg-paper">
        <span className="h-1.5 w-1.5 rounded-full bg-line" />
      </span>
    )
  }
  if (status === 'available') {
    return <span className="h-[18px] w-[18px] rounded-full border-2 border-ink-3 bg-paper" />
  }
  return (
    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-hairline bg-paper text-ink-3">
      <Lock size={9} strokeWidth={2.5} />
    </span>
  )
}

function statusLabel(status: ModuleStatus, module: Module, progress: ProgressState) {
  switch (status) {
    case 'mastered':
      return { text: 'Mastered', cls: 'text-mastered' }
    case 'passed':
      return { text: 'Passed', cls: 'text-line' }
    case 'started':
      return { text: 'In progress', cls: 'text-streak' }
    case 'available':
      return { text: `${module.minutes} min read`, cls: 'text-ink-3' }
    default: {
      const blocker = module.prereqs.find((id) => {
        const m = getModule(id)
        return m && moduleStatus(progress, m) !== 'passed' && moduleStatus(progress, m) !== 'mastered'
      })
      const name = getModule(blocker)?.title
      return { text: name ? `Finish “${name}” first` : 'Locked', cls: 'text-ink-3' }
    }
  }
}

function Station({
  module,
  progress,
  isLast,
  railDone,
}: {
  module: Module
  progress: ProgressState
  isLast: boolean
  /** Whether the segment leaving this station is complete. */
  railDone: boolean
}) {
  const status = moduleStatus(progress, module)
  const locked = status === 'locked'
  const label = statusLabel(status, module, progress)
  const pct = moduleProgress(progress, module)

  const card = (
    <>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[0.6875rem] text-ink-3 tabular">
          {String(module.station).padStart(2, '0')}
        </span>
        <h3 className={`text-[1.0625rem] leading-snug font-semibold ${locked ? 'text-ink-3' : ''}`}>
          {module.title}
        </h3>
      </div>
      <p className={`mt-1 text-[0.875rem] leading-relaxed ${locked ? 'text-ink-3' : 'text-ink-2'}`}>
        {module.summary}
      </p>
      <div className="mt-2.5 flex items-center gap-3">
        <span className={`font-mono text-[0.6875rem] tracking-wide ${label.cls}`}>{label.text}</span>
        {!locked && pct > 0 && pct < 1 && (
          <Meter value={pct} className="max-w-24" label={`${module.title} progress`} />
        )}
      </div>
    </>
  )

  return (
    <li className="relative grid grid-cols-[36px_minmax(0,1fr)] gap-x-2">
      {!isLast && (
        <span
          aria-hidden="true"
          className={`absolute ${RAIL_LEFT} top-6 bottom-0 w-0.5 rounded-full ${
            railDone ? 'bg-line' : 'bg-hairline'
          }`}
        />
      )}
      <div className="relative z-10 flex justify-center pt-2.5">
        <Node status={status} />
      </div>

      <div className="pb-5">
        {locked ? (
          <div className="rounded-2xl border border-dashed border-hairline px-4 py-3.5 opacity-70">
            {card}
          </div>
        ) : (
          <Link
            to={`/m/${module.id}`}
            className="block rounded-2xl border border-hairline bg-surface px-4 py-3.5 transition-colors duration-150 hover:border-line"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            {card}
          </Link>
        )}
      </div>
    </li>
  )
}

export function LineMap({
  tracks,
  modulesByTrack,
  progress,
}: {
  tracks: Track[]
  modulesByTrack: (trackId: string) => Module[]
  progress: ProgressState
}) {
  return (
    <div className="flex flex-col gap-8">
      {tracks.map((track) => {
        const mods = modulesByTrack(track.id)
        const done = mods.filter((m) => {
          const s = moduleStatus(progress, m)
          return s === 'passed' || s === 'mastered'
        }).length

        return (
          <section key={track.id} aria-labelledby={`track-${track.id}`}>
            <div className="mb-4 grid grid-cols-[36px_minmax(0,1fr)] gap-x-2">
              <div className="flex justify-center pt-1.5">
                {/* Interchange marker — where one track hands over to the next. */}
                <span className="h-3 w-3 rotate-45 rounded-[2px] border-2 border-line bg-paper" />
              </div>
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h2 id={`track-${track.id}`} className="text-[1.25rem] font-semibold">
                    {track.title}
                  </h2>
                  <span className="font-mono text-[0.6875rem] text-ink-3 tabular">
                    {done}/{mods.length}
                  </span>
                </div>
                <p className="mt-1 max-w-[52ch] text-[0.875rem] leading-relaxed text-ink-2">
                  {track.blurb}
                </p>
              </div>
            </div>

            <ol>
              {mods.map((m, i) => {
                const s = moduleStatus(progress, m)
                return (
                  <Station
                    key={m.id}
                    module={m}
                    progress={progress}
                    isLast={i === mods.length - 1}
                    railDone={s === 'passed' || s === 'mastered'}
                  />
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
