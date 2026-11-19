import { trackStyle } from './trackStyle'

/**
 * A route as one striped bar: a segment per track in route order, as wide as its stop
 * count, filled in that track's colour as far as you have got. Decorative for screen
 * readers — the caller states the count in words beside it.
 */
export function RouteRibbon({ segments }: { segments: { trackId: string; total: number; done: number }[] }) {
  const shown = segments.filter((s) => s.total > 0)
  return (
    <div aria-hidden="true" className="flex h-2.5 w-full gap-[3px]">
      {shown.map((s, i) => (
        <span
          key={`${s.trackId}-${i}`}
          style={{ ...trackStyle(s.trackId), flexGrow: s.total }}
          className="relative min-w-1 basis-0 overflow-hidden rounded-full bg-track-soft"
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-track"
            style={{ width: `${Math.round((Math.min(s.done, s.total) / s.total) * 100)}%` }}
          />
        </span>
      ))}
    </div>
  )
}
