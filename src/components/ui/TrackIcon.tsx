import {
  Activity,
  Blocks,
  Boxes,
  Building2,
  Compass,
  Database,
  MessagesSquare,
  Network,
  Puzzle,
  Share2,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

/**
 * Track identity is an icon plus a mono code, never a colour — the palette has one
 * accent, and per-track hues would compete with the states that are earned.
 */
const ICONS: Record<string, LucideIcon> = {
  foundations: Blocks,
  principles: Compass,
  'design-patterns': Puzzle,
  lld: Boxes,
  core: Network,
  databases: Database,
  distributed: Share2,
  architecture: Building2,
  production: Activity,
  applied: Workflow,
  interview: MessagesSquare,
}

export function TrackIcon({ trackId, size = 18 }: { trackId: string; size?: number }) {
  const Icon = ICONS[trackId] ?? Blocks
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" />
}

/** The icon on a soft tile, with the track code underneath it for scanning. */
export function TrackTile({ trackId, code, size = 'md' }: { trackId: string; code?: string; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'sm' ? 'h-8 w-8 rounded-lg' : size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10 rounded-xl'
  return (
    <span className={`relative flex shrink-0 items-center justify-center bg-line-soft text-line ${box}`}>
      <TrackIcon trackId={trackId} size={size === 'sm' ? 16 : size === 'lg' ? 22 : 19} />
      {code && (
        <span className="absolute -right-1.5 -bottom-1.5 rounded-md border border-hairline bg-surface px-1 font-mono text-[0.5625rem] leading-[1.15rem] font-semibold text-ink-2">
          {code}
        </span>
      )}
    </span>
  )
}
