import { useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Timer } from 'lucide-react'
import { getTrack, modulesOfTrack, populatedTracks, problems } from '../content'
import type { RouteStop } from '../content/types'
import { getCategory } from '../content/categories'
import { useProgress } from '../state/ProgressProvider'
import { isPassed, problemDone } from '../lib/progress'
import { stopKey } from '../lib/storage'
import { plainText } from '../lib/text'
import { TopBar } from '../components/ui/TopBar'
import { Badge, Empty, Meter } from '../components/ui/Bits'
import { ButtonLink } from '../components/ui/Button'
import { TrackTile } from '../components/ui/TrackIcon'
import { useScrolledPast } from '../components/ui/useScrolledPast'
import { StationList } from '../components/line/LineMap'

const DIFF_TONE = { easy: 'correct', medium: 'streak', hard: 'alert' } as const

/** One track on its own: what it gives you, its stations, and where to practise it. */
export function TrackScreen() {
  const { trackId = '' } = useParams()
  const { progress } = useProgress()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrolled = useScrolledPast(titleRef)
  const track = getTrack(trackId)
  const mods = track ? modulesOfTrack(track.id) : []

  if (!track || mods.length === 0) {
    return (
      <div>
        <TopBar back={{ label: 'Learn', to: '/learn?view=topics' }} />
        <div className="mt-6">
          <Empty
            title="No such track"
            body="It may have been renamed. Every track is listed under All topics."
            action={<ButtonLink to="/learn?view=topics">All topics</ButtonLink>}
          />
        </div>
      </div>
    )
  }

  const ids = new Set(mods.map((m) => m.id))
  const stops: RouteStop[] = mods.map((m) => ({ module: m.id }))
  const done = mods.filter((m) => isPassed(progress, m.id)).length
  const next = mods.find((m) => !isPassed(progress, m.id))
  const minutes = mods.reduce((n, m) => n + m.minutes, 0)
  const practice = problems.filter((p) => p.suggests.some((s) => ids.has(s)))
  const idx = populatedTracks.findIndex((t) => t.id === track.id)
  const prev = populatedTracks[idx - 1]
  const after = populatedTracks[idx + 1]

  return (
    <div>
      <TopBar title={track.title} showTitle={scrolled} back={{ label: 'Learn', to: '/learn?view=topics' }} />

      <header className="mt-5 mb-6">
        <div className="flex items-center gap-3">
          <TrackTile trackId={track.id} code={track.code} size="lg" />
          <p className="font-mono text-[0.75rem] text-ink-3 tabular">
            Track {track.code} · {mods.length} lessons · {minutes} min
          </p>
        </div>
        <h1 ref={titleRef} tabIndex={-1} className="mt-4 text-[1.75rem] leading-tight font-semibold outline-none">
          {track.title}
        </h1>
        <p className="mt-2 text-[1rem] leading-relaxed text-ink-2">{track.blurb}</p>

        {track.outcomes.length > 0 && (
          <div className="mt-5 rounded-2xl border border-hairline bg-surface p-4">
            <p className="mb-2 font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase">By the end you can</p>
            <ul className="flex flex-col gap-2">
              {track.outcomes.map((o) => (
                <li key={o} className="flex gap-2.5 text-[0.9375rem] leading-snug">
                  <Check size={16} strokeWidth={2.4} aria-hidden="true" className="mt-0.5 shrink-0 text-line" />
                  <span>{plainText(o)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <Meter value={mods.length ? done / mods.length : 0} label={`${track.title} progress`} className="flex-1" />
          <span className="shrink-0 font-mono text-[0.75rem] text-ink-2 tabular">
            {done}/{mods.length}
          </span>
        </div>
        {next && (
          <ButtonLink to={`/m/${next.id}`} size="lg" className="mt-4 w-full sm:w-auto">
            {done ? 'Continue' : 'Start'}: {plainText(next.title)}
            <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
          </ButtonLink>
        )}
      </header>

      <h2 className="mb-3 text-[1.125rem] font-semibold">Stations</h2>
      <StationList stops={stops} progress={progress} nextKey={next ? stopKey({ module: next.id }) : undefined} />

      {practice.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[1.125rem] font-semibold">Practise it</h2>
          <p className="mt-0.5 mb-3 text-[0.875rem] text-ink-2">Famous questions that lean on this track.</p>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {practice.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/practice/${p.id}`}
                  className="flex min-h-16 items-center gap-3 rounded-2xl border border-hairline bg-surface px-4 py-3 transition-colors hover:border-line"
                >
                  <Timer size={18} strokeWidth={1.9} aria-hidden="true" className="shrink-0 text-line" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9375rem] leading-snug font-medium">{plainText(p.title)}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge tone={DIFF_TONE[p.difficulty]}>{p.difficulty}</Badge>
                      <Badge>{getCategory(p.category)?.title}</Badge>
                      {problemDone(progress, p.id) && <Badge tone="correct">done</Badge>}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Other tracks" className="mt-10 grid grid-cols-2 gap-3 border-t border-hairline pt-5">
        {prev ? (
          <Link to={`/learn/${prev.id}`} className="flex min-h-16 flex-col justify-center rounded-2xl border border-hairline px-4 py-3 hover:border-line">
            <span className="flex items-center gap-1 text-[0.75rem] text-ink-3">
              <ArrowLeft size={13} strokeWidth={2} aria-hidden="true" /> Previous track
            </span>
            <span className="mt-0.5 text-[0.9375rem] leading-snug font-medium">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {after ? (
          <Link
            to={`/learn/${after.id}`}
            className="flex min-h-16 flex-col items-end justify-center rounded-2xl border border-hairline px-4 py-3 text-right hover:border-line"
          >
            <span className="flex items-center gap-1 text-[0.75rem] text-ink-3">
              Next track <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="mt-0.5 text-[0.9375rem] leading-snug font-medium">{after.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  )
}
