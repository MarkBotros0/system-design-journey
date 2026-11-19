import { useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Timer } from 'lucide-react'
import { getTrack, modulesOfTrack, populatedTracks, problems } from '../content'
import type { RouteStop } from '../content/types'
import { getCategory } from '../content/categories'
import { useProgress } from '../state/ProgressProvider'
import { isMastered, isPassed, problemDone } from '../lib/progress'
import { stopKey } from '../lib/storage'
import { plainText } from '../lib/text'
import { TopBar } from '../components/ui/TopBar'
import { Empty, Eyebrow } from '../components/ui/Bits'
import { ButtonLink } from '../components/ui/Button'
import { Cell, Group } from '../components/ui/List'
import { TrackGlyph } from '../components/ui/TrackIcon'
import { trackStyle } from '../components/ui/trackStyle'
import { useScrolledPast } from '../components/ui/useScrolledPast'
import { StationList } from '../components/line/LineMap'

const DIFFICULTY = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const
const card = { boxShadow: 'var(--shadow-card)' }

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
  const mastered = mods.filter((m) => isMastered(progress, m)).length
  const next = mods.find((m) => !isPassed(progress, m.id))
  const minutes = mods.reduce((n, m) => n + m.minutes, 0)
  const practice = problems.filter((p) => p.suggests.some((s) => ids.has(s)))
  const idx = populatedTracks.findIndex((t) => t.id === track.id)
  const prev = populatedTracks[idx - 1]
  const after = populatedTracks[idx + 1]
  const pct = Math.round((done / mods.length) * 100)

  return (
    // The whole page carries the track, so focus rings and the station rail take its colour.
    <div style={trackStyle(track.id)}>
      <TopBar title={track.title} showTitle={scrolled} back={{ label: 'Learn', to: '/learn?view=topics' }} />

      {/* Track colour sits on the glyph and the bar only: as text on its own tint it falls
          under 4.5:1 in the light theme, so the words stay ink. */}
      <header className="mt-2 rounded-[28px] bg-track-soft p-5">
        <TrackGlyph trackId={track.id} size={44} />
        <p className="mt-4 text-[0.875rem] font-bold text-ink-2 tabular">
          Track {idx + 1} of {populatedTracks.length} · {mods.length} lessons · {minutes} min
        </p>
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="mt-1 text-[1.875rem] leading-[1.1] font-extrabold tracking-[-0.025em] outline-none"
        >
          {track.title}
        </h1>
        <p className="mt-2 text-base leading-relaxed text-ink-2">{track.blurb}</p>

        <div className="mt-5">
          <div
            role="progressbar"
            aria-label={`${track.title} progress`}
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 w-full overflow-hidden rounded-full bg-track-soft"
          >
            <div className="h-full rounded-full bg-track" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[0.9375rem] font-semibold tabular">
            <span className="inline-flex items-center gap-1.5">
              <Check size={17} strokeWidth={3} aria-hidden="true" className="text-correct" />
              {done} of {mods.length} passed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck size={18} strokeWidth={2.2} aria-hidden="true" className="text-mastered" />
              {mastered} mastered
            </span>
          </p>
        </div>

        {next && (
          <div className="mt-5">
            <p className="text-[0.875rem] font-semibold text-ink-2">{done ? 'Up next' : 'Start with'}</p>
            <p className="mt-0.5 text-[1.0625rem] leading-snug font-bold">{plainText(next.title)}</p>
            <ButtonLink to={`/m/${next.id}`} size="lg" className="mt-3 sm:w-auto sm:min-w-60">
              {done ? 'Continue' : 'Start'}
              <span className="sr-only">: {plainText(next.title)}</span>
              <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
            </ButtonLink>
          </div>
        )}
      </header>

      {track.outcomes.length > 0 && (
        <section aria-labelledby="outcomes" className="mt-4 rounded-[22px] bg-surface p-5" style={card}>
          <h2 id="outcomes" className="tracking-normal">
            <Eyebrow>By the end you can</Eyebrow>
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {track.outcomes.map((o) => (
              <li key={o} className="flex gap-3 text-base leading-snug">
                <span aria-hidden="true" className="mt-[0.5em] h-2 w-2 shrink-0 rounded-full bg-track" />
                <span>{plainText(o)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="stations" className="mt-6">
        <h2 id="stations" className="mb-2 flex min-h-11 items-end px-1 text-[1.25rem] font-bold">
          Stations
        </h2>
        <div className="overflow-hidden rounded-[22px] bg-surface" style={card}>
          <StationList stops={stops} progress={progress} nextKey={next ? stopKey({ module: next.id }) : undefined} numbered />
        </div>
        <p className="mt-2 px-4 text-[0.875rem] text-ink-3">Any station opens. “Builds on” is a suggestion, not a lock.</p>
      </section>

      {practice.length > 0 && (
        <section aria-labelledby="practise" className="mt-8">
          <div className="mb-2 px-1">
            <h2 id="practise" className="flex min-h-11 items-end text-[1.25rem] font-bold">
              Practise it
            </h2>
            <p className="text-[0.9375rem] text-ink-2">Famous questions that lean on this track.</p>
          </div>
          <Group>
            {practice.map((p) => (
              <Cell
                key={p.id}
                to={`/practice/${p.id}`}
                leading={
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-surface-3 text-ink-2">
                    <Timer size={18} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                }
                title={plainText(p.title)}
                sub={`${DIFFICULTY[p.difficulty]} · ${getCategory(p.category)?.title ?? ''}`}
                trailing={
                  problemDone(progress, p.id) ? (
                    <span className="inline-flex items-center gap-1 text-[0.875rem] font-semibold text-correct">
                      <Check size={16} strokeWidth={3} aria-hidden="true" /> Done
                    </span>
                  ) : undefined
                }
              />
            ))}
          </Group>
        </section>
      )}

      <nav aria-label="Other tracks" className="mt-8 grid grid-cols-2 gap-3">
        {prev ? (
          <Link
            to={`/learn/${prev.id}`}
            className="flex min-h-[5.5rem] flex-col justify-between gap-2 rounded-[20px] bg-surface p-4 transition-colors duration-100 hover:bg-surface-2 active:bg-surface-2"
            style={card}
          >
            <span className="flex items-center gap-1 text-[0.875rem] font-semibold text-ink-2">
              <ArrowLeft size={15} strokeWidth={2.4} aria-hidden="true" /> Previous
            </span>
            <span className="flex items-center gap-2.5">
              <TrackGlyph trackId={prev.id} size={28} />
              <span className="min-w-0 text-[0.9375rem] leading-snug font-bold">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {after ? (
          <Link
            to={`/learn/${after.id}`}
            className="flex min-h-[5.5rem] flex-col items-end justify-between gap-2 rounded-[20px] bg-surface p-4 text-right transition-colors duration-100 hover:bg-surface-2 active:bg-surface-2"
            style={card}
          >
            <span className="flex items-center gap-1 text-[0.875rem] font-semibold text-ink-2">
              Next <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
            </span>
            <span className="flex items-center gap-2.5">
              <span className="min-w-0 text-[0.9375rem] leading-snug font-bold">{after.title}</span>
              <TrackGlyph trackId={after.id} size={28} />
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  )
}
