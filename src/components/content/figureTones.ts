import type { FigureTone } from '../../content/figures'

/* Tone classes are written out in full — Tailwind scans source text, so a computed
   class name like `bg-${tone}-soft` would never make it into the stylesheet.

   Figures are filled, never outlined: a tone is a tint behind real-text labels. `line`
   is the emphasis tone and takes the lesson's track colour (ink where there is no
   track); the other tones keep their earned-state meaning (`mastered` reads as the
   good outcome, so it borrows `correct`). Neutral cells step one surface down from the
   frame they sit in — `surface-2` on a card (`surface-3` in dark, where the first step is
   too slight to draw a shape), `surface` inside an inset frame. */

export const neutralCell = 'bg-surface-2 dark:bg-surface-3 in-[.fig-inset]:bg-surface'

export const boxTone: Record<FigureTone, string> = {
  line: 'bg-track-soft text-ink',
  mastered: 'bg-correct-soft text-ink',
  streak: 'bg-streak-soft text-ink',
  alert: 'bg-alert-soft text-ink',
  neutral: `${neutralCell} text-ink`,
}

/** Solid fills: bars, ratio segments, legend dots. Text on them is `text-paper`. */
export const barTone: Record<FigureTone, string> = {
  line: 'bg-track',
  mastered: 'bg-correct',
  streak: 'bg-streak',
  alert: 'bg-alert',
  neutral: 'bg-ink-3',
}

export const softTone: Record<FigureTone, string> = {
  line: 'bg-track-soft',
  mastered: 'bg-correct-soft',
  streak: 'bg-streak-soft',
  alert: 'bg-alert-soft',
  neutral: neutralCell,
}

/** Text in a tone, on the frame itself. A track colour drops to ink on an inset frame,
    where surface-2 would take it under 4.5:1 in the light theme. */
export const textTone: Record<FigureTone, string> = {
  line: 'text-track in-[.fig-inset]:text-ink',
  mastered: 'text-correct',
  streak: 'text-streak',
  alert: 'text-alert',
  neutral: 'text-ink',
}

/** Line and arrowhead colour for connectors. */
export const strokeTone: Record<FigureTone, string> = {
  line: 'border-track text-track',
  mastered: 'border-correct text-correct',
  streak: 'border-streak text-streak',
  alert: 'border-alert text-alert',
  neutral: 'border-ink-3 text-ink-3',
}
