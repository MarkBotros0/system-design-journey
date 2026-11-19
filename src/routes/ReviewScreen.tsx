import { useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleHelp, GraduationCap, Layers, Library } from 'lucide-react'
import { populatedTracks } from '../content'
import { useProgress } from '../state/ProgressProvider'
import { nextDueLabel, reviewDeck } from '../lib/review'
import { isLearned } from '../lib/srs'
import { TopBar, PageTitle } from '../components/ui/TopBar'
import { Badge, Skeleton } from '../components/ui/Bits'
import { Button, ButtonLink } from '../components/ui/Button'
import { Cell, Group } from '../components/ui/List'
import { TrackGlyph } from '../components/ui/TrackIcon'
import { useScrolledPast } from '../components/ui/useScrolledPast'
import { GoalPips } from '../components/home/TodayCard'
import { IconTile } from '../components/home/IconTile'
import { questionMinutes, useDailySet } from '../components/home/useDailySet'

/** One of the two habits, as a big tile: the number, what it means, and the one way in. */
function Tile({
  id,
  label,
  icon,
  value,
  unit,
  children,
  action,
}: {
  id: string
  label: string
  icon: ReactNode
  value: ReactNode
  unit: string
  children?: ReactNode
  action: ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex min-w-0 flex-col rounded-[24px] bg-surface p-4"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id={id} className="truncate text-base font-bold">
          {label}
        </h2>
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-ink-2">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[2.5rem] leading-none font-extrabold tracking-[-0.04em] tabular">{value}</p>
      <p className="mt-1 text-[0.9375rem] font-semibold text-ink-2">{unit}</p>
      {children && <div className="mt-2 text-[0.875rem] leading-snug text-ink-3">{children}</div>}
      <div className="mt-auto pt-4">{action}</div>
    </section>
  )
}

function CardsTile() {
  const { progress } = useProgress()
  const [now] = useState(Date.now)
  const deck = useMemo(() => reviewDeck(progress), [progress])
  const due = deck.due.length
  const soonest = deck.cards
    .map((c) => progress.cards[c.id]?.dueAt)
    .filter((d): d is number => typeof d === 'number' && d > now)
    .sort((a, b) => a - b)[0]

  if (deck.cards.length === 0) {
    return (
      <Tile
        id="cards-h"
        label="Cards"
        icon={<Layers size={16} strokeWidth={2.2} />}
        value="0"
        unit="cards yet"
        action={
          <ButtonLink to="/learn" variant="secondary" className="w-full px-2! whitespace-nowrap">
            Start learning
          </ButtonLink>
        }
      >
        Each lesson you read adds two or three.
      </Tile>
    )
  }
  return (
    <Tile
      id="cards-h"
      label="Cards"
      icon={<Layers size={16} strokeWidth={2.2} />}
      value={due}
      unit="due"
      action={
        due ? (
          <ButtonLink to="/review/session" className="w-full px-3!">
            Start<span className="sr-only"> card review</span>
          </ButtonLink>
        ) : (
          <ButtonLink to="#decks" variant="secondary" className="w-full px-3!">
            See decks
          </ButtonLink>
        )
      }
    >
      {due
        ? `About ${Math.max(1, Math.ceil(due * 0.4))} min.`
        : soonest
          ? `All caught up. Next one in ${nextDueLabel(soonest, now)}.`
          : 'All caught up.'}
    </Tile>
  )
}

function QuestionsTile() {
  const daily = useDailySet()
  return (
    <Tile
      id="questions-h"
      label="Questions"
      icon={<CircleHelp size={16} strokeWidth={2.2} />}
      value={
        <>
          <span aria-hidden="true">
            {daily.answered}
            <span className="text-[1.25rem] text-ink-3">/{daily.goal}</span>
          </span>
          <span className="sr-only">
            {daily.answered} of {daily.goal}
          </span>
        </>
      }
      unit="today"
      action={
        <Button onClick={daily.start} className="w-full px-3!">
          {daily.verb}
          <span className="sr-only"> daily questions</span>
        </Button>
      }
    >
      <GoalPips done={daily.answered} goal={daily.goal} thin className="mt-1 mb-2.5" />
      {daily.resumable
        ? `${daily.setLeft} left in today's set.`
        : daily.met
          ? 'Goal met. A few more keeps it fresh.'
          : `About ${questionMinutes(daily.toGo)} min.`}
    </Tile>
  )
}

export function ReviewScreen() {
  const { progress, ready } = useProgress()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrolled = useScrolledPast(titleRef)
  const deck = useMemo(() => reviewDeck(progress), [progress])
  const learned = deck.cards.filter((c) => isLearned(progress.cards[c.id])).length

  const rows = populatedTracks
    .map((t) => {
      const d = reviewDeck(progress, t.id)
      return { track: t, cards: d.cards.length, due: d.due.length, learned: d.cards.filter((c) => isLearned(progress.cards[c.id])).length }
    })
    .filter((r) => r.cards > 0)

  return (
    <div>
      <TopBar title="Review" showTitle={scrolled} />
      <PageTitle title="Review" titleRef={titleRef} sub="A few minutes a day is the whole trick." />

      {!ready ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <CardsTile />
            <QuestionsTile />
          </div>

          <Group className="mt-6">
            <Cell
              to="/questions"
              leading={
                <IconTile>
                  <Library size={17} strokeWidth={2.2} />
                </IconTile>
              }
              title="Question bank"
              sub="Every question, by track and kind"
            />
            {deck.cards.length > 0 && (
              <Cell
                leading={
                  <IconTile>
                    <GraduationCap size={18} strokeWidth={2.2} />
                  </IconTile>
                }
                title="Cards learned"
                sub="After three spaced recalls"
                trailing={
                  <span className="font-semibold text-ink tabular">
                    {learned}/{deck.cards.length}
                  </span>
                }
              />
            )}
          </Group>

          {rows.length > 0 && (
            <div id="decks">
              <Group
                title="Decks by track"
                className="mt-8"
                footer="A deck with nothing due runs through its cards without moving their schedule."
              >
                {rows.map((r) => (
                  <Cell
                    key={r.track.id}
                    to={`/review/session?track=${r.track.id}`}
                    leading={<TrackGlyph trackId={r.track.id} />}
                    title={r.track.title}
                    sub={r.due ? `${r.learned} of ${r.cards} learned` : `${r.learned} of ${r.cards} learned · none due`}
                    trailing={r.due ? <Badge tone="line">{r.due} due</Badge> : undefined}
                  />
                ))}
              </Group>
            </div>
          )}
        </>
      )}
    </div>
  )
}
