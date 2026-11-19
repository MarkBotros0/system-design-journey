import type { FigureTone } from '../../content/figures'

/* Tone classes are written out in full — Tailwind scans source text, so a computed
   class name like `bg-${tone}-soft` would never make it into the stylesheet. */

export const boxTone: Record<FigureTone, string> = {
  line: 'border-line bg-line-soft text-ink',
  mastered: 'border-correct bg-correct-soft text-ink',
  streak: 'border-streak bg-streak-soft text-ink',
  alert: 'border-alert bg-alert-soft text-ink',
  neutral: 'border-hairline bg-surface text-ink',
}

export const barTone: Record<FigureTone, string> = {
  line: 'bg-line',
  mastered: 'bg-correct',
  streak: 'bg-streak',
  alert: 'bg-alert',
  neutral: 'bg-ink-3',
}

export const softTone: Record<FigureTone, string> = {
  line: 'bg-line-soft',
  mastered: 'bg-correct-soft',
  streak: 'bg-streak-soft',
  alert: 'bg-alert-soft',
  neutral: 'bg-surface-2',
}

export const textTone: Record<FigureTone, string> = {
  line: 'text-line',
  mastered: 'text-correct',
  streak: 'text-streak',
  alert: 'text-alert',
  neutral: 'text-ink-3',
}

/** Line and arrowhead colour for connectors. */
export const strokeTone: Record<FigureTone, string> = {
  line: 'border-line text-line',
  mastered: 'border-correct text-correct',
  streak: 'border-streak text-streak',
  alert: 'border-alert text-alert',
  neutral: 'border-ink-3 text-ink-3',
}
