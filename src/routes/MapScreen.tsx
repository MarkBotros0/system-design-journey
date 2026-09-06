import { Link } from 'react-router-dom'
import { ArrowRight, Flame } from 'lucide-react'
import { modules, modulesOfTrack, populatedTracks } from '../content'
import { liveStreak, moduleStatus, nextModule } from '../lib/progress'
import { useProgress } from '../state/ProgressProvider'
import { LineMap } from '../components/line/LineMap'
import { Badge, Meter } from '../components/ui/Bits'

export function MapScreen() {
  const { progress, ready } = useProgress()

  const streak = liveStreak(progress.streak)
  const next = nextModule(progress, modules)
  const done = modules.filter((m) => {
    const s = moduleStatus(progress, m)
    return s === 'passed' || s === 'mastered'
  }).length

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.6875rem] tracking-[0.2em] uppercase text-line lg:hidden">
              Throughput
            </p>
            <h1 className="mt-1 text-[1.875rem] leading-tight font-semibold lg:mt-0">
              {done === 0 ? 'Start the line' : 'Your line'}
            </h1>
          </div>
          {streak > 0 && (
            <Badge tone="streak">
              <Flame size={12} strokeWidth={2.5} />
              {streak}d
            </Badge>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Meter value={modules.length ? done / modules.length : 0} label="Overall progress" />
          <span className="shrink-0 font-mono text-[0.6875rem] text-ink-3 tabular">
            {done}/{modules.length}
          </span>
        </div>
      </header>

      {ready && next && (
        <Link
          to={`/m/${next.id}`}
          className="mb-8 flex items-center gap-4 rounded-2xl bg-line px-4 py-4 text-line-ink transition-opacity duration-150 hover:opacity-90"
        >
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase opacity-75">
              {done === 0 ? 'Station 01' : 'Pick up here'}
            </p>
            <p className="mt-1 truncate text-[1.0625rem] font-semibold">{next.title}</p>
            <p className="mt-0.5 text-[0.8125rem] opacity-80">{next.minutes} min read</p>
          </div>
          <ArrowRight size={20} strokeWidth={2.2} className="shrink-0" />
        </Link>
      )}

      <LineMap tracks={populatedTracks} modulesByTrack={modulesOfTrack} progress={progress} />
    </div>
  )
}
