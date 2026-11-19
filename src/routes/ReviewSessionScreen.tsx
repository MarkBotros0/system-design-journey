import { useEffect, useState, type MouseEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Layers, RotateCw, X } from 'lucide-react'
import { getModule, getTrack } from '../content'
import type { CardItem, Track } from '../content/types'
import { useProgress } from '../state/ProgressProvider'
import { advance, reviewDeck } from '../lib/review'
import type { Grade } from '../lib/srs'
import { Inline } from '../components/content/Inline'
import { Button, ButtonLink, IconButton } from '../components/ui/Button'
import { Badge } from '../components/ui/Bits'
import { SegmentedProgress } from '../components/ui/SegmentedProgress'
import { TrackChip, TrackGlyph } from '../components/ui/TrackIcon'
import { trackStyle } from '../components/ui/trackStyle'

/* The two ends of the scale carry their state's tint and icon; the middle two are neutral,
   because "hard" and "good" are both a recall, just at different cost. */
const GRADES: { grade: Grade; key: string; label: string; hint: string; cls: string; icon?: typeof Check }[] = [
  { grade: 'again', key: '1', label: 'Again', hint: 'no idea', cls: 'bg-alert-soft text-alert', icon: X },
  { grade: 'hard', key: '2', label: 'Hard', hint: 'slowly', cls: 'bg-surface-3 text-ink' },
  { grade: 'good', key: '3', label: 'Good', hint: 'got it', cls: 'bg-surface-3 text-ink' },
  { grade: 'easy', key: '4', label: 'Easy', hint: 'instant', cls: 'bg-correct-soft text-correct', icon: Check },
]

/* Past this many, one segment per card gets thinner than a hairline on a phone; the bar
   then counts in equal chunks and the "n of m" beside it carries the exact number. */
const MAX_SEGMENTS = 12

/**
 * A review session, in focus mode. The queue is fixed when the session opens: grading
 * changes schedules, not what this session shows, except that a miss comes round again.
 * With nothing due in a track it becomes a run-through that leaves the schedule alone.
 */
export function ReviewSessionScreen() {
  const { ready } = useProgress()
  const [params] = useSearchParams()
  const track = getTrack(params.get('track') ?? undefined)
  // Mounted once storage has loaded, so the session's snapshot sees real progress.
  return ready ? <Session track={track} /> : <div className="min-h-dvh" />
}

function Session({ track }: { track: Track | undefined }) {
  const { progress, gradeCard } = useProgress()
  const navigate = useNavigate()

  // The deck is snapshotted once, here; it is never re-derived mid-session.
  const [session, setSession] = useState<{ queue: CardItem[]; total: number; practice: boolean }>(() => {
    const deck = reviewDeck(progress, track?.id)
    const practice = deck.due.length === 0 && !!track
    const queue = practice ? deck.cards : deck.due
    return { queue, total: queue.length, practice }
  })
  const [revealed, setRevealed] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [again, setAgain] = useState(0)

  const card = session.queue[0]

  function grade(g: Grade) {
    if (!card) return
    if (!session.practice) gradeCard(card.id, g)
    setReviewed((n) => n + 1)
    if (g === 'again') setAgain((n) => n + 1)
    setRevealed(false)
    setSession({ ...session, queue: advance(session.queue, g) })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (!card) return
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setRevealed(true)
        return
      }
      const g = revealed ? GRADES.find((x) => x.key === e.key) : undefined
      if (g) {
        e.preventDefault()
        grade(g.grade)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const close = (
    <IconButton label="End review" onClick={() => navigate('/review')}>
      <X size={20} strokeWidth={2.2} aria-hidden="true" />
    </IconButton>
  )

  if (!card) {
    const nothing = session.total === 0
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-screen">
        <div>{close}</div>
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          {nothing ? (
            <>
              <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-surface-3 text-ink-2">
                <Layers size={28} strokeWidth={2} aria-hidden="true" />
              </span>
              <h1 className="mt-5 text-[1.75rem] leading-tight font-extrabold tracking-[-0.025em] outline-none">Nothing due</h1>
              <p className="mt-2 max-w-[32ch] text-base text-ink-2">Spacing is what makes this work. Come back when cards are due.</p>
            </>
          ) : (
            <>
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-correct-soft text-correct">
                <Check size={30} strokeWidth={2.6} aria-hidden="true" />
              </span>
              <h1 className="mt-5 text-[1.75rem] leading-tight font-extrabold tracking-[-0.025em] outline-none">Session done</h1>
              <dl className="mt-6 grid w-full grid-cols-3 gap-2.5">
                <Tally value={session.total} label={session.total === 1 ? 'card' : 'cards'} />
                <Tally value={reviewed} label={reviewed === 1 ? 'review' : 'reviews'} />
                <Tally value={again} label="missed" />
              </dl>
              <p className="mt-5 max-w-[34ch] text-base text-ink-2">
                {again
                  ? `${again} missed the first time round, and came back until you had ${again === 1 ? 'it' : 'them'}.`
                  : 'None missed.'}
                {session.practice ? ' The schedule was left alone.' : ''}
              </p>
            </>
          )}
        </div>
        <div className="sticky bottom-0 bg-paper pt-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
          <ButtonLink to="/review" size="lg">
            Done
          </ButtonLink>
        </div>
      </div>
    )
  }

  const left = session.queue.length
  const total = reviewed + left
  const segments = Math.min(total, MAX_SEGMENTS)
  const segDone = total ? Math.floor((reviewed / total) * segments) : 0
  const mod = getModule(card.moduleId)
  const cardTrack = mod?.trackId

  /* Tapping the card turns it over — except a tap on a term inside it, which opens the
     glossary instead. */
  function onCardTap(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('button, a')) return
    setRevealed(true)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-screen">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {close}
          {/* The exact count is the text beside it; the bar is the glance. */}
          <div aria-hidden="true" className="min-w-0 flex-1">
            <SegmentedProgress total={segments} done={segDone} label="Session progress" />
          </div>
          <span className="shrink-0 text-[0.9375rem] font-bold text-ink-2 tabular">
            {reviewed + 1}
            <span className="font-semibold text-ink-3"> / {total}</span>
            <span className="sr-only">, {left} left</span>
          </span>
        </div>
        {(track || session.practice) && (
          <div className="flex flex-wrap items-center gap-2">
            {track && <TrackChip trackId={track.id} label={track.title} />}
            {session.practice && <Badge>Run-through · schedule unchanged</Badge>}
          </div>
        )}
      </header>

      {/* Keyed by card: the next card mounts face-down rather than rotating back into view
          with its own answer already on the back face. With reduced motion there is no
          turn at all — the faces simply swap. */}
      <div key={card.id} className="flex flex-1 flex-col py-5 [perspective:1400px] sm:my-auto sm:flex-none">
        <div
          className={`grid flex-1 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:[transform-style:preserve-3d] ${
            revealed ? 'motion-safe:[transform:rotateY(180deg)]' : ''
          }`}
        >
          <section
            aria-hidden={revealed}
            inert={revealed}
            data-card-face="front"
            onClick={onCardTap}
            style={{ ...trackStyle(cardTrack), boxShadow: 'var(--shadow-card)' }}
            className={`flex min-h-[18rem] sm:min-h-[26rem] cursor-pointer flex-col rounded-[28px] bg-surface p-6 select-none [grid-area:1/1] motion-safe:[backface-visibility:hidden] ${
              revealed ? 'motion-reduce:invisible' : ''
            }`}
          >
            <FaceTop trackId={cardTrack} tag={card.tag} />
            <p className="my-auto py-6 text-[1.5rem] leading-[1.25] font-bold tracking-[-0.02em]">
              <Inline text={card.front} />
            </p>
            <p className="flex items-center justify-center gap-2 text-[0.875rem] font-semibold text-ink-3">
              <RotateCw size={15} strokeWidth={2.2} aria-hidden="true" />
              Tap the card to turn it over
            </p>
          </section>
          <section
            aria-hidden={!revealed}
            inert={!revealed}
            style={{ ...trackStyle(cardTrack), boxShadow: 'var(--shadow-card)' }}
            className={`flex min-h-[18rem] sm:min-h-[26rem] flex-col rounded-[28px] bg-surface p-6 [grid-area:1/1] motion-safe:[backface-visibility:hidden] motion-safe:[transform:rotateY(180deg)] ${
              revealed ? '' : 'motion-reduce:invisible'
            }`}
          >
            <FaceTop trackId={cardTrack} tag={card.tag} />
            <p className="mt-5 text-base leading-snug text-ink-2">
              <Inline text={card.front} />
            </p>
            <p className="mt-4 rounded-[20px] bg-surface-2 px-4 py-4 text-[1.1875rem] leading-[1.45] font-semibold text-ink">
              <Inline text={card.back} />
            </p>
          </section>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {revealed ? 'Answer shown. Grade it, one to four.' : ''}
      </p>

      {/* The dock: always in the thumb zone, even when a long answer scrolls. */}
      <div className="sticky bottom-0 -mx-4 bg-paper px-4 pt-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
        {!revealed ? (
          <>
            <p className="mb-3 text-center text-[0.875rem] text-ink-2">
              Answer out loud first. If you cannot say it in one breath, it is not ready.
            </p>
            <Button size="lg" onClick={() => setRevealed(true)}>
              Show answer
              <kbd className="hidden rounded-md bg-line-ink/15 px-1.5 py-0.5 font-sans text-[0.8125rem] font-semibold sm:inline">Space</kbd>
            </Button>
          </>
        ) : (
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="How well did you recall it?">
            {GRADES.map((g) => (
              <button
                key={g.grade}
                type="button"
                onClick={() => grade(g.grade)}
                className={`flex min-h-[4.25rem] flex-col items-center justify-center gap-0.5 rounded-[20px] px-1 transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.96] motion-reduce:active:scale-100 ${g.cls}`}
              >
                <span className="flex items-center gap-1 text-base font-bold">
                  {g.icon && <g.icon size={16} strokeWidth={2.8} aria-hidden="true" />}
                  {g.label}
                </span>
                <span className="text-[0.8125rem] font-medium opacity-85">
                  <span className="hidden sm:inline">{g.key} · </span>
                  {g.hint}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FaceTop({ trackId, tag }: { trackId: string | undefined; tag: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {trackId && <TrackGlyph trackId={trackId} size={28} />}
      <span className="min-w-0 truncate text-[0.875rem] font-bold text-track">{tag}</span>
    </div>
  )
}

function Tally({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col-reverse rounded-[20px] bg-surface px-2 py-3.5" style={{ boxShadow: 'var(--shadow-card)' }}>
      <dt className="mt-1.5 text-[0.8125rem] font-semibold text-ink-2">{label}</dt>
      <dd className="text-[1.625rem] leading-none font-extrabold tracking-[-0.03em] tabular">{value}</dd>
    </div>
  )
}
