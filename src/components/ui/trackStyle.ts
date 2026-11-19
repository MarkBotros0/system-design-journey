import type { CSSProperties } from 'react'

const TRACK_IDS = new Set([
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
])

/**
 * Sets `--track` for a subtree, so `text-track`, `bg-track` and `bg-track-soft` inside it
 * take that track's colour (`--t-<id>` in index.css). Unknown ids fall back to ink.
 */
export function trackStyle(trackId: string | undefined): CSSProperties {
  return trackId && TRACK_IDS.has(trackId) ? ({ '--track': `var(--t-${trackId})` } as CSSProperties) : {}
}
