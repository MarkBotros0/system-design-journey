import {
  BrickWall,
  Box,
  Compass,
  Database,
  Globe,
  MessageSquare,
  Network,
  Plug,
  Puzzle,
  Shapes,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { trackStyle } from './trackStyle'

/**
 * Track identity is a glyph plus a colour of its own (`--t-<id>` in index.css). The colour
 * is identity only: it never marks an answer as right or wrong, and the states keep their
 * icons so the two can never be confused.
 */
const ICONS: Record<string, LucideIcon> = {
  foundations: BrickWall,
  principles: Compass,
  'design-patterns': Shapes,
  lld: Box,
  core: Network,
  databases: Database,
  distributed: Globe,
  architecture: Plug,
  production: ShieldCheck,
  applied: Puzzle,
  interview: MessageSquare,
}

export function TrackIcon({ trackId, size = 18 }: { trackId: string; size?: number }) {
  const Icon = ICONS[trackId] ?? BrickWall
  return <Icon size={size} strokeWidth={2} aria-hidden="true" />
}

const GLYPH = {
  28: { box: 'h-7 w-7 rounded-[9px]', icon: 15 },
  36: { box: 'h-9 w-9 rounded-[11px]', icon: 18 },
  44: { box: 'h-11 w-11 rounded-[14px]', icon: 21 },
} as const

/** The track's glyph in its colour, on a soft tint of that colour. */
export function TrackGlyph({ trackId, size = 36 }: { trackId: string; size?: 28 | 36 | 44 }) {
  const g = GLYPH[size]
  return (
    <span style={trackStyle(trackId)} className={`flex shrink-0 items-center justify-center bg-track-soft text-track ${g.box}`}>
      <TrackIcon trackId={trackId} size={g.icon} />
    </span>
  )
}

/** A pill naming a track: solid round glyph plus the name, both in the track's colour. */
export function TrackChip({ trackId, label }: { trackId: string; label: string }) {
  return (
    <span
      style={trackStyle(trackId)}
      className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full bg-track-soft py-1 pr-3 pl-1 text-[0.875rem] font-semibold text-track"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-track text-paper">
        <TrackIcon trackId={trackId} size={13} />
      </span>
      <span className="truncate">{label}</span>
    </span>
  )
}

/** Older call sites: the glyph tile at small / medium / large. `code` is no longer shown. */
export function TrackTile({ trackId, size = 'md' }: { trackId: string; code?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <TrackGlyph trackId={trackId} size={size === 'sm' ? 28 : size === 'lg' ? 44 : 36} />
}
