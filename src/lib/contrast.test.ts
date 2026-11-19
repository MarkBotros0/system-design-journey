import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrast, cssTokens } from './contrast'

// Every text colour the design uses, against every surface it sits on, in both themes.
// The tokens are the design's promise of WCAG AA; this keeps a future tweak honest.
const css = readFileSync('src/index.css', 'utf8')
const TRACKS = [
  'foundations',
  'principles',
  'design-patterns',
  'lld',
  'core',
  'databases',
  'distributed',
  'architecture',
  'production',
  'applied',
  'interview',
]

for (const sel of [':root', "[data-theme='dark']"] as const) {
  const t = cssTokens(css, sel)
  describe(`contrast ${sel}`, () => {
    it.each(['ink', 'ink-2', 'ink-3'])('%s on paper, surface, surface-2, surface-3 ≥ 4.5', (k) => {
      for (const bg of ['paper', 'surface', 'surface-2', 'surface-3']) {
        expect(contrast(t[k], t[bg]), `${k} on ${bg}`).toBeGreaterThanOrEqual(4.5)
      }
    })
    it('primary pill text ≥ 4.5', () => expect(contrast(t['line-ink'], t.line)).toBeGreaterThanOrEqual(4.5))
    it.each(['correct', 'alert', 'streak', 'mastered'])('state %s as text on surface and its soft tint ≥ 4.5', (k) => {
      expect(contrast(t[k], t.surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(t[k], t[`${k}-soft`])).toBeGreaterThanOrEqual(4.5)
    })
    it.each(TRACKS)('track %s as text on surface and paper ≥ 4.5', (id) => {
      expect(contrast(t[`t-${id}`], t.surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(t[`t-${id}`], t.paper)).toBeGreaterThanOrEqual(4.5)
    })
  })
}

describe('contrast()', () => {
  it('is the WCAG ratio', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 1)
    expect(contrast('#ffffff', '#777777')).toBeCloseTo(4.48, 1)
  })
})

describe('cssTokens()', () => {
  it('reads hex custom properties from the named block only', () => {
    const t = cssTokens(":root { --a: #112233; --b: var(--a); }\n[data-theme='dark'] { --a: #ffffff; }", ':root')
    expect(t).toEqual({ a: '#112233' })
  })
})

describe('track tint', () => {
  // A custom property is resolved where it is declared: a --track-soft on :root mixes the
  // root's --track (unset, so ink) and every subtree inherits that grey. The mix has to be
  // written into the utility itself so it reads --track on the element that uses it.
  it('is mixed where it is used, not once on :root', () => {
    const theme = css.slice(css.indexOf('@theme inline'))
    const decl = theme.match(/--color-track-soft:\s*([^;]+);/)?.[1] ?? ''
    expect(decl).toMatch(/^color-mix\(in oklab, var\(--track\b/)
    expect(css).not.toMatch(/:root\s*\{[^}]*--track-soft:\s*color-mix/)
  })
})
