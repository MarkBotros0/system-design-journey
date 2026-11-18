import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Layers } from 'lucide-react'
import { getTrack, populatedTracks } from '../content'
import { useProgress } from '../state/ProgressProvider'
import { nextDueLabel, reviewDeck } from '../lib/review'
import { isLearned } from '../lib/srs'
import { TopBar, PageTitle } from '../components/ui/TopBar'
import { Empty, Meter, Skeleton } from '../components/ui/Bits'
import { ButtonLink } from '../components/ui/Button'
import { TrackTile } from '../components/ui/TrackIcon'
import { useScrolledPast } from '../components/ui/useScrolledPast'
import { DailyCard } from '../components/questions/DailyCard'

export function ReviewScreen() {
  const { progress, ready } = useProgress()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrolled = useScrolledPast(titleRef)
  const [now] = useState(Date.now)
  const deck = useMemo(() => reviewDeck(progress), [progress])
  const learned = deck.cards.filter((c) => isLearned(progress.cards[c.id])).length
  const soonest = deck.cards
    .map((c) => progress.cards[c.id]?.dueAt)
    .filter((d): d is number => typeof d === 'number' && d > now)
    .sort((a, b) => a - b)[0]

  const rows = populatedTracks
    .map((t) => {
      const d = reviewDeck(progress, t.id)
      return { track: t, cards: d.cards.length, due: d.due.length, learned: d.cards.filter((c) => isLearned(progress.cards[c.id])).length }
    })
    .filter((r) => r.cards > 0)

  return (
    <div>
      <TopBar title="Review" showTitle={scrolled} />
      <PageTitle
        title="Review"
        titleRef={titleRef}
        sub="Quick questions on every topic, and cards from what you have read. A few minutes a day is the whole trick."
      />

      {ready && (
        <div className="mb-8">
          <DailyCard />
        </div>
      )}

      {ready && <h2 className="mb-3 text-[1.125rem] font-semibold">Cards</h2>}
      {!ready ? (
        <Skeleton className="h-40" />
      ) : deck.cards.length === 0 ? (
        <Empty
          title="Nothing to review yet"
          body="Each lesson you read adds two or three cards here. Read one and come back."
          action={<ButtonLink to="/learn">Start learning</ButtonLink>}
        />
      ) : (
        <>
          <section
            aria-label="Due today"
            className={`rounded-2xl p-5 ${deck.due.length ? 'bg-line text-line-ink' : 'border border-hairline bg-surface'}`}
          >
            <p className={`font-mono text-[0.6875rem] tracking-[0.14em] uppercase ${deck.due.length ? 'opacity-80' : 'text-ink-3'}`}>
              Due today
            </p>
            <p className="mt-1 text-[2.25rem] leading-none font-semibold tabular">{deck.due.length}</p>
            <p className={`mt-1.5 text-[0.875rem] ${deck.due.length ? 'opacity-90' : 'text-ink-2'}`}>
              {deck.due.length
                ? `About ${Math.max(1, Math.ceil(deck.due.length * 0.4))} min. Answer out loud before you reveal.`
                : soonest
                  ? `All caught up. The next card comes back in ${nextDueLabel(soonest, now)}.`
                  : 'All caught up.'}
            </p>
            {deck.due.length > 0 && (
              <Link
                to="/review/session"
                className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-line-ink px-5 text-[0.9375rem] font-semibold text-line transition-opacity hover:opacity-90"
              >
                Start review <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
              </Link>
            )}
          </section>

          <div className="mt-5 rounded-2xl border border-hairline bg-surface p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[0.9375rem] font-medium">Learned</span>
              <span className="font-mono text-[0.8125rem] text-ink-2 tabular">
                {learned}/{deck.cards.length}
              </span>
            </div>
            <Meter value={deck.cards.length ? learned / deck.cards.length : 0} tone={learned === deck.cards.length ? 'mastered' : 'line'} label="Cards learned" />
            <p className="mt-2 text-[0.75rem] text-ink-3">A card is learned after three spaced recalls. Every card learned in a lesson masters it.</p>
          </div>

          <h2 className="mt-8 mb-3 text-[1.125rem] font-semibold">By track</h2>
          <ul className="overflow-hidden rounded-2xl border border-hairline bg-surface">
            {rows.map((r) => (
              <li key={r.track.id} className="flex min-h-16 items-center gap-3 border-b border-hairline px-4 py-3 last:border-b-0">
                <TrackTile trackId={r.track.id} code={getTrack(r.track.id)?.code} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem] font-medium">{r.track.title}</p>
                  <p className="font-mono text-[0.6875rem] text-ink-3 tabular">
                    {r.due ? `${r.due} due · ` : ''}
                    {r.learned}/{r.cards} learned
                  </p>
                </div>
                <Link
                  to={`/review/session?track=${r.track.id}`}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-hairline px-3 text-[0.8125rem] font-medium hover:border-line"
                >
                  <Layers size={14} strokeWidth={2} aria-hidden="true" />
                  {r.due ? 'Review' : 'Run through'}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.8125rem] text-ink-3">
            &ldquo;Run through&rdquo; goes over a track&rsquo;s cards when none are due, without moving their schedule.
          </p>
        </>
      )}
    </div>
  )
}
