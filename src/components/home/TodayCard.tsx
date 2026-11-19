import { useMemo, useState } from 'react'
import { ArrowRight, Check, Flame, Layers } from 'lucide-react'
import { useProgress } from '../../state/ProgressProvider'
import { dayKey, liveStreak } from '../../lib/progress'
import { reviewDeck } from '../../lib/review'
import { Button, ButtonLink } from '../ui/Button'
import { questionMinutes, useDailySet } from './useDailySet'

/** Flame plus the count, in the streak colour — the one place that colour is earned on Home. */
export function StreakPill({ days }: { days: number }) {
  return (
    <span className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full bg-streak-soft px-3 text-[0.875rem] font-bold text-streak tabular">
      <Flame size={15} strokeWidth={2.4} aria-hidden="true" />
      {days}-day streak
    </span>
  )
}

/**
 * One pip per question of the daily goal. The next one breathes, unless motion is reduced.
 * Decorative: the caller states the count in words.
 */
export function GoalPips({
  done,
  goal,
  thin = false,
  className = '',
}: {
  done: number
  goal: number
  /** For a narrow tile, where full-height pips would shrink into dots. */
  thin?: boolean
  className?: string
}) {
  return (
    <div aria-hidden="true" className={`flex ${goal > 10 ? 'gap-0.5' : 'gap-1'} ${className}`}>
      {Array.from({ length: goal }, (_, i) => (
        <span
          key={i}
          className={`${thin ? 'h-1.5' : 'h-2.5'} min-w-0 flex-1 rounded-full ${
            i < done ? 'bg-line' : i === done ? 'animate-pulse bg-line/45 motion-reduce:animate-none' : 'bg-surface-3'
          }`}
        />
      ))}
    </div>
  )
}

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/**
 * This calendar week, Monday first: a flame on every day with study in it. Days still to
 * come are drawn faint, so an empty Friday on a Wednesday never reads as a missed one.
 */
function WeekStrip({ activity, now }: { activity: Record<string, number>; now: number }) {
  const d = new Date(now)
  const todayAt = (d.getDay() + 6) % 7
  const days = LETTERS.map((letter, i) => {
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate() - todayAt + i, 12)
    const key = dayKey(date.getTime())
    return {
      key,
      letter,
      name: date.toLocaleDateString('en-GB', { weekday: 'long' }),
      studied: (activity[key] ?? 0) > 0,
      today: i === todayAt,
      future: i > todayAt,
    }
  })

  return (
    <ol aria-label="Study days this week" className="grid grid-cols-7 rounded-[20px] bg-surface-2 px-1 py-3">
      {days.map((day) => (
        <li key={day.key} className="flex flex-col items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              day.studied
                ? 'bg-streak text-paper'
                : day.today
                  ? 'ring-2 ring-ink-3 ring-inset'
                  : day.future
                    ? 'bg-surface-3/50'
                    : 'bg-surface-3'
            }`}
          >
            {day.studied && <Flame size={16} strokeWidth={2.4} />}
          </span>
          <span aria-hidden="true" className={`text-[0.8125rem] ${day.today ? 'font-bold text-ink' : 'font-semibold text-ink-3'}`}>
            {day.today ? 'Today' : day.letter}
          </span>
          <span className="sr-only">
            {day.today ? `Today, ${day.name}` : day.name}: {day.studied ? 'studied' : day.future ? 'still to come' : 'no study'}
          </span>
        </li>
      ))}
    </ol>
  )
}

/**
 * The day at a glance, first thing on Home: the streak, today's questions against the
 * goal, the week so far, and the two habits one tap away — the daily set and the cards
 * that are due.
 */
export function TodayCard() {
  const { progress } = useProgress()
  const daily = useDailySet()
  const [now] = useState(Date.now)
  const due = useMemo(() => reviewDeck(progress).due.length, [progress])
  const streak = liveStreak(progress.streak)

  const status = daily.resumable
    ? { title: 'Daily questions', sub: `${daily.setLeft} left in today's set` }
    : daily.met
      ? { title: 'Goal met', sub: 'A few more keeps it fresh' }
      : { title: 'Daily questions', sub: `${daily.toGo} to go · about ${questionMinutes(daily.toGo)} min` }

  return (
    <section aria-labelledby="today-h" className="rounded-[28px] bg-surface p-4 pt-5" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="flex min-h-8 items-center justify-between gap-3 pl-1">
        <h2 id="today-h" className="text-[1.375rem] font-extrabold">
          Today
        </h2>
        {streak > 0 && <StreakPill days={streak} />}
      </div>

      <div className="mt-3 flex items-end gap-3.5 pl-1">
        <p className="shrink-0 leading-[0.85] font-extrabold tracking-[-0.04em] tabular">
          <span aria-hidden="true">
            <span className="text-[3.25rem]">{daily.answered}</span>
            <span className="text-[1.5rem] text-ink-3">/{daily.goal}</span>
          </span>
          <span className="sr-only">
            {daily.answered} of {daily.goal} questions answered today
          </span>
        </p>
        <div className="min-w-0 pb-0.5">
          <p className="flex items-center gap-1 text-base leading-snug font-bold">
            {daily.met && !daily.resumable && <Check size={17} strokeWidth={2.6} aria-hidden="true" className="shrink-0 text-correct" />}
            {status.title}
          </p>
          <p className="text-[0.875rem] leading-snug text-ink-2">{status.sub}</p>
        </div>
      </div>

      <GoalPips done={daily.answered} goal={daily.goal} className="mt-4" />

      <div className="mt-4">
        <WeekStrip activity={progress.activity} now={now} />
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={daily.start} className="min-w-0 flex-1 px-4! whitespace-nowrap sm:flex-none sm:px-6!">
          {daily.verb === 'Start' ? 'Start questions' : daily.verb}
          {/* At 375px a three-digit card count needs the room; the arrow gives way first. */}
          {due < 100 && <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" className="shrink-0" />}
        </Button>
        <ButtonLink to={due ? '/review/session' : '/review'} variant="secondary" className="shrink-0 px-4! whitespace-nowrap tabular">
          <Layers size={17} strokeWidth={2.2} aria-hidden="true" />
          {due} card{due === 1 ? '' : 's'}
          <span className="sr-only"> due</span>
        </ButtonLink>
      </div>
    </section>
  )
}
