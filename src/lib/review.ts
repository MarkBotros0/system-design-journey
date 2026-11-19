import { modules } from '../content'
import type { CardItem } from '../content/types'
import { hasReadLesson } from './progress'
import { isDue, sortForDrill, type Grade } from './srs'
import type { ProgressState } from './progressState'

/**
 * The deck: cards from lessons you have actually read, optionally one track's. Drilling
 * an answer you have never seen teaches nothing and poisons the schedule.
 */
export function reviewDeck(p: ProgressState, trackId?: string): { cards: CardItem[]; due: CardItem[] } {
  const cards = modules
    .filter((m) => (!trackId || m.trackId === trackId) && hasReadLesson(p, m.id))
    .flatMap((m) => m.cards)
  const due = sortForDrill(
    cards.filter((c) => isDue(p.cards[c.id])),
    p.cards,
  )
  return { cards, due }
}

/**
 * The session queue after grading its head. A miss comes back at the end of this
 * session — seeing it again in a few minutes is the learning step — anything else is
 * done for today.
 */
export function advance<T>(queue: T[], grade: Grade): T[] {
  if (!queue.length) return queue
  const [head, ...rest] = queue
  return grade === 'again' ? [...rest, head] : rest
}

/** "20 min", "5 h", "3 d" — how long until a card is due again. */
export function nextDueLabel(dueAt: number, now: number): string {
  const ms = dueAt - now
  if (ms <= 0) return 'now'
  const hours = ms / 3_600_000
  if (hours < 1) return `${Math.max(1, Math.round(ms / 60_000))} min`
  if (hours < 24) return `${Math.round(hours)} h`
  return `${Math.round(hours / 24)} d`
}
