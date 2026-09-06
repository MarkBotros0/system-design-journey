import { useMemo, useState } from 'react'
import { modules } from '../content'
import { hasReadLesson } from '../lib/progress'
import { isDue, isLearned, sortForDrill, type Grade } from '../lib/srs'
import { useProgress } from '../state/ProgressProvider'
import { Inline } from '../components/content/Inline'
import { ButtonLink } from '../components/ui/Button'
import { Badge, Empty, Meter, ScreenTitle } from '../components/ui/Bits'

const GRADES: { grade: Grade; label: string; hint: string; cls: string }[] = [
  { grade: 'again', label: 'Again', hint: 'no idea', cls: 'border-alert/40 text-alert hover:bg-alert-soft' },
  { grade: 'hard', label: 'Hard', hint: 'slowly', cls: 'border-hairline text-ink-2 hover:bg-surface-2' },
  { grade: 'good', label: 'Good', hint: 'got it', cls: 'border-hairline text-ink-2 hover:bg-surface-2' },
  { grade: 'easy', label: 'Easy', hint: 'instant', cls: 'border-mastered/40 text-mastered hover:bg-mastered-soft' },
]

function nextDueLabel(dueAt: number): string {
  const ms = dueAt - Date.now()
  if (ms <= 0) return 'now'
  const hours = ms / 3_600_000
  if (hours < 1) return `${Math.max(1, Math.round(ms / 60_000))} min`
  if (hours < 24) return `${Math.round(hours)} h`
  return `${Math.round(hours / 24)} d`
}

export function DrillScreen() {
  const { progress, gradeCard } = useProgress()
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)

  /* Only cards from stations you have actually read. Drilling an answer you have never
     seen teaches nothing and poisons the schedule. */
  const unlocked = useMemo(
    () => modules.filter((m) => hasReadLesson(progress, m.id)).flatMap((m) => m.cards),
    [progress],
  )

  const due = useMemo(
    () => sortForDrill(unlocked.filter((c) => isDue(progress.cards[c.id])), progress.cards),
    [unlocked, progress.cards],
  )

  const learned = unlocked.filter((c) => isLearned(progress.cards[c.id])).length
  const card = due[0]

  function grade(g: Grade) {
    if (!card) return
    gradeCard(card.id, g)
    setRevealed(false)
    setDone((n) => n + 1)
  }

  if (!unlocked.length) {
    return (
      <div>
        <ScreenTitle title="Drill" sub="Spaced repetition over everything you have read." />
        <Empty
          title="Nothing to drill yet"
          body="Cards join this deck as you read stations. Read the first one and come back."
          action={<ButtonLink to="/">Open the line</ButtonLink>}
        />
      </div>
    )
  }

  if (!card) {
    const soonest = unlocked
      .map((c) => progress.cards[c.id]?.dueAt)
      .filter((d): d is number => typeof d === 'number')
      .sort((a, b) => a - b)[0]

    return (
      <div>
        <ScreenTitle
          title="Drill"
          sub={`${learned} of ${unlocked.length} cards learned.`}
          right={done > 0 ? <Badge tone="mastered">{done} done</Badge> : undefined}
        />
        <Empty
          title="Caught up"
          body={
            soonest
              ? `Nothing is due. The next card comes back in ${nextDueLabel(soonest)} — spacing is what makes this work.`
              : 'Nothing is due right now.'
          }
          action={<ButtonLink to="/" variant="secondary">Back to the line</ButtonLink>}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <header className="mb-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-ink-3">
            {due.length} due
          </span>
          <span className="font-mono text-[0.6875rem] text-ink-3 tabular">
            {learned}/{unlocked.length} learned
          </span>
        </div>
        <Meter value={unlocked.length ? learned / unlocked.length : 0} label="Cards learned" />
      </header>

      <div className="rounded-2xl border border-hairline bg-surface p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
        <p className="mb-3 font-mono text-[0.6875rem] tracking-[0.12em] uppercase text-ink-3">
          {card.tag}
        </p>
        <p className="text-[1.125rem] leading-snug font-semibold">
          <Inline text={card.front} />
        </p>

        {revealed && (
          <p className="mt-4 border-t border-hairline pt-4 text-[0.9375rem] leading-relaxed text-ink-2">
            <Inline text={card.back} />
          </p>
        )}
      </div>

      <div className="mt-auto pt-6">
        {!revealed ? (
          <>
            <p className="mb-3 text-center text-[0.8125rem] text-ink-3">
              Answer out loud first. If you cannot say it in one breath, it is not ready.
            </p>
            <button
              onClick={() => setRevealed(true)}
              className="min-h-13 w-full rounded-xl bg-line px-5 text-base font-medium text-line-ink transition-opacity duration-150 hover:opacity-90"
            >
              Reveal
            </button>
          </>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {GRADES.map((g) => (
              <button
                key={g.grade}
                onClick={() => grade(g.grade)}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border bg-surface transition-colors duration-150 ${g.cls}`}
              >
                <span className="text-[0.875rem] font-medium">{g.label}</span>
                <span className="text-[0.625rem] opacity-70">{g.hint}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
