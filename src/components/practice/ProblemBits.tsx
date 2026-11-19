import { Braces, SignalHigh, SignalLow, SignalMedium, Workflow } from 'lucide-react'
import type { Difficulty, ProblemKind } from '../../content/types'
import { Badge } from '../ui/Bits'
import { TrackGlyph } from '../ui/TrackIcon'

const GLYPH = {
  36: { box: 'h-9 w-9 rounded-[11px]', icon: 18 },
  44: { box: 'h-11 w-11 rounded-[14px]', icon: 21 },
} as const

/**
 * A problem's tile: the glyph of the track it leans on, or — when no track clearly leads —
 * a neutral tile in ink, so colour only ever says something true.
 */
export function ProblemGlyph({ trackId, kind, size = 44 }: { trackId?: string; kind: ProblemKind; size?: 36 | 44 }) {
  if (trackId) return <TrackGlyph trackId={trackId} size={size} />
  const Icon = kind === 'lld' ? Braces : Workflow
  const g = GLYPH[size]
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center bg-surface-3 text-ink-2 ${g.box}`}>
      <Icon size={g.icon} strokeWidth={2} />
    </span>
  )
}

const DIFF = {
  easy: { tone: 'correct', Icon: SignalLow, label: 'Easy' },
  medium: { tone: 'streak', Icon: SignalMedium, label: 'Medium' },
  hard: { tone: 'alert', Icon: SignalHigh, label: 'Hard' },
} as const

/** Difficulty as a tinted pill with signal bars, so the level reads without its colour. */
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const d = DIFF[difficulty]
  return (
    <Badge tone={d.tone}>
      <d.Icon size={14} strokeWidth={2.6} aria-hidden="true" className="-ml-0.5" />
      {d.label}
    </Badge>
  )
}
