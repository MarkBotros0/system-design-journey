import { describe, expect, it } from 'vitest'
import { emptyProgress } from './storage'
import { advance, nextDueLabel, reviewDeck } from './review'
import { modules } from '../content'

describe('advance', () => {
  it('drops the card on a pass', () => {
    expect(advance(['a', 'b', 'c'], 'good')).toEqual(['b', 'c'])
    expect(advance(['a'], 'easy')).toEqual([])
  })
  it('sends a missed card to the back of this session', () => {
    expect(advance(['a', 'b', 'c'], 'again')).toEqual(['b', 'c', 'a'])
    expect(advance(['a'], 'again')).toEqual(['a'])
  })
})

describe('reviewDeck', () => {
  it('is empty until a lesson is read', () => {
    const d = reviewDeck(emptyProgress())
    expect(d.cards).toEqual([])
    expect(d.due).toEqual([])
  })

  it('holds the cards of read lessons, all due when new, and filters by track', () => {
    const p = emptyProgress()
    const [a] = modules
    const b = modules.find((m) => m.trackId !== a.trackId)!
    p.lessonsRead[a.id] = Date.now()
    p.lessonsRead[b.id] = Date.now()
    const all = reviewDeck(p)
    expect(all.cards.length).toBe(a.cards.length + b.cards.length)
    expect(all.due.length).toBe(all.cards.length)
    const one = reviewDeck(p, a.trackId)
    expect(one.cards.map((c) => c.moduleId).every((id) => id === a.id)).toBe(true)
  })
})

describe('nextDueLabel', () => {
  const now = 1_000_000_000_000
  it('reads as minutes, hours or days', () => {
    expect(nextDueLabel(now - 5, now)).toBe('now')
    expect(nextDueLabel(now + 20 * 60_000, now)).toBe('20 min')
    expect(nextDueLabel(now + 5 * 3_600_000, now)).toBe('5 h')
    expect(nextDueLabel(now + 3 * 86_400_000, now)).toBe('3 d')
  })
})
