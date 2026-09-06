/**
 * Figures — the visual vocabulary of the curriculum.
 *
 * Eight primitives, driven by data rather than hand-authored per lesson. Two reasons:
 *
 *  1. Consistency. Forty bespoke drawings read as forty drawings. One vocabulary applied
 *     forty times reads as a system, and the reader learns to parse it once.
 *  2. Mobile. A hand-authored SVG at a fixed viewBox scales its text down with the
 *     drawing — a 12px label on a 700-wide canvas renders at ~6px on a 375px phone.
 *     These render as real HTML text where the shape allows, so it stays legible and
 *     reflows. Only `timeline` and `scale` are SVG, because their geometry carries meaning.
 *
 * Every figure carries a `caption` at the Block level stating what it shows.
 */

/** Semantic tones. Same rules as the design tokens: earned states are never decorative. */
export type FigureTone = 'line' | 'mastered' | 'streak' | 'alert' | 'neutral'

export interface FlowNode {
  label: string
  /** Small caption under the label — the thing it holds, or its cost. */
  sub?: string
  tone?: FigureTone
  /** Label on the arrow leaving this node. Ignored on the last node. */
  to?: string
}

export interface SplitSide {
  title: string
  nodes: FlowNode[]
  /** One line under this side — what it costs you. */
  cost?: string
  tone?: FigureTone
}

export interface TimelineBar {
  /** 0–1 across the total span. */
  from: number
  to: number
  label?: string
  tone?: FigureTone
}

export interface TimelineLane {
  label: string
  bars: TimelineBar[]
  /** What this lane ends in. */
  outcome?: { label: string; tone?: FigureTone }
}

export type Figure =
  /** Boxes and labelled arrows. The default for "what talks to what". */
  | { kind: 'flow'; nodes: FlowNode[]; note?: string }
  /** Layers, top to bottom. Caches, protocol stacks, storage tiers. */
  | { kind: 'stack'; layers: { label: string; sub?: string; tone?: FigureTone }[]; note?: string }
  /** Two architectures side by side. Use when the answer is a choice. */
  | { kind: 'split'; left: SplitSide; right: SplitSide; verdict?: string }
  /** A proportional bar. Use when a ratio is the point (90:10, 100:1). */
  | { kind: 'ratio'; parts: { label: string; value: number; tone?: FigureTone }[]; note?: string }
  /** Cells. Partitions, shards, geohash tiles, seat maps. */
  | {
      kind: 'grid'
      cols: number
      cells: { label?: string; tone?: FigureTone }[]
      legend?: { tone: FigureTone; label: string }[]
      note?: string
    }
  /** A horizontal time axis with lanes. Expiry, windows, retries. */
  | {
      kind: 'timeline'
      /** Tick labels, evenly spaced across the span. */
      ticks: string[]
      lanes: TimelineLane[]
      note?: string
    }
  /** A logarithmic ladder. Latency, cost, capacity — where orders of magnitude matter. */
  | {
      kind: 'scale'
      items: { label: string; display: string; /** relative magnitude, any unit */ value: number; tone?: FigureTone }[]
      note?: string
    }
  /** A loop. Crawlers, retry cycles, the delivery framework itself. */
  | { kind: 'cycle'; steps: { label: string; sub?: string }[]; note?: string }
