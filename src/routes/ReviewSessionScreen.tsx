import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { getTrack } from '../content'
import type { CardItem, Track } from '../content/types'
import { useProgress } from '../state/ProgressProvider'
import { advance, reviewDeck } from '../lib/review'
import type { Grade } from '../lib/srs'
import { Inline } from '../components/content/Inline'
import { Button, ButtonLink } from '../components/ui/Button'
import { Meter } from '../components/ui/Bits'

const GRADES: { grade: Grade; key: string; label: string; hint: string; cls: string }[] = [
  { grade: 'again', key: '1', label: 'Again', hint: 'no idea', cls: 'border-alert/40 text-alert hover:bg-alert-soft' },
  { grade: 'hard', key: '2', label: 'Hard', hint: 'slowly', cls: 'border-hairline text-ink-2 hover:bg-surface-2' },
  { grade: 'good', key: '3', label: 'Good', hint: 'got it', cls: 'border-hairline text-ink-2 hover:bg-surface-2' },
  { grade: 'easy', key: '4', label: 'Easy', hint: 'instant', cls: 'border-mastered/40 text-mastered hover:bg-mastered-soft' },
]

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
    <button
      type="button"
      onClick={() => navigate('/review')}
      aria-label="End review"
      className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-2 hover:bg-surface-2 hover:text-ink"
    >
      <X size={19} strokeWidth={2} />
    </button>
  )

  if (!card) {
    const nothing = session.total === 0
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-screen pb-10">
        <div>{close}</div>
        <div className="flex flex-1 flex-col justify-center">
          {nothing ? (
            <>
              <h1 className="text-[1.75rem] font-semibold">Nothing due</h1>
              <p className="mt-2 text-[0.9375rem] text-ink-2">Spacing is what makes this work. Come back when cards are due.</p>
            </>
          ) : (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mastered-soft text-mastered">
                <Check size={24} strokeWidth={2.6} aria-hidden="true" />
              </span>
              <h1 className="mt-4 text-[1.75rem] font-semibold">Session done</h1>
              <p className="mt-2 text-[0.9375rem] text-ink-2">
                {session.total} card{session.total === 1 ? '' : 's'}, {reviewed} review{reviewed === 1 ? '' : 's'}
                {again ? `, ${again} missed the first time round` : ', none missed'}.
                {session.practice ? ' The schedule was left alone.' : ''}
              </p>
            </>
          )}
          <ButtonLink to="/review" size="lg" className="mt-8">
            Done
          </ButtonLink>
        </div>
      </div>
    )
  }

  const left = session.queue.length
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-screen pb-6">
      <header className="mb-5">
        <div className="mb-3 flex items-center gap-3">
          {close}
          <span className="flex-1 truncate font-mono text-[0.6875rem] tracking-[0.12em] text-ink-3 uppercase">
            {session.practice ? 'Run-through · schedule unchanged' : track ? `Review · ${track.title}` : 'Review'}
          </span>
          <span className="font-mono text-[0.75rem] text-ink-3 tabular">{left} left</span>
        </div>
        <Meter value={session.total ? Math.min(1, reviewed / (reviewed + left)) : 0} label="Session progress" />
      </header>

      {/* Keyed by card: the next card mounts face-down rather than rotating back into view
          with its own answer already on the back face. */}
      <div key={card.id} className="[perspective:1200px]">
        <div
          className="grid transition-transform duration-[250ms] ease-out [transform-style:preserve-3d] motion-reduce:transition-none"
          style={{ transform: revealed ? 'rotateY(180deg)' : 'none' }}
        >
          <section
            aria-hidden={revealed}
            inert={revealed}
            className="rounded-2xl border border-hairline bg-surface p-5 [grid-area:1/1] [backface-visibility:hidden]"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <p className="mb-3 font-mono text-[0.6875rem] tracking-[0.12em] text-ink-3 uppercase">{card.tag}</p>
            <p className="text-[1.1875rem] leading-snug font-semibold">
              <Inline text={card.front} />
            </p>
          </section>
          <section
            aria-hidden={!revealed}
            inert={!revealed}
            className="rounded-2xl border border-line/40 bg-surface p-5 [grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)]"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <p className="mb-2 text-[0.875rem] leading-snug text-ink-3">
              <Inline text={card.front} />
            </p>
            <p className="border-t border-hairline pt-3 text-[1.0625rem] leading-relaxed text-ink">
              <Inline text={card.back} />
            </p>
          </section>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {revealed ? 'Answer shown. Grade it, one to four.' : ''}
      </p>

      <div className="mt-auto pt-6 pb-safe">
        {!revealed ? (
          <>
            <p className="mb-3 text-center text-[0.8125rem] text-ink-3">Answer out loud first. If you cannot say it in one breath, it is not ready.</p>
            <Button size="lg" onClick={() => setRevealed(true)} className="w-full">
              Reveal <kbd className="ml-1 hidden rounded border border-line-ink/40 px-1.5 font-mono text-[0.6875rem] sm:inline">space</kbd>
            </Button>
          </>
        ) : (
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="How well did you recall it?">
            {GRADES.map((g) => (
              <button
                key={g.grade}
                type="button"
                onClick={() => grade(g.grade)}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border bg-surface transition-colors duration-150 ${g.cls}`}
              >
                <span className="text-[0.875rem] font-medium">{g.label}</span>
                <span className="text-[0.625rem] opacity-70">
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
