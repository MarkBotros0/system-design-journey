import { getModule, getTrack } from '../../content'
import type { Route, RouteStop, Track } from '../../content/types'

export interface StopGroup {
  key: string
  /** A track, or a run of practice problems that is not a checkpoint of one. */
  track?: Track
  title: string
  code?: string
  stops: RouteStop[]
}

/**
 * Consecutive lessons of one track form a group; a short run of problems right after a
 * track belongs to it as checkpoints; a long run of problems (a route that ends in "every
 * famous question") becomes its own Practice group.
 */
export function groupStops(route: Route): StopGroup[] {
  const groups: StopGroup[] = []
  let i = 0
  while (i < route.stops.length) {
    const s = route.stops[i]
    if ('module' in s) {
      const trackId = getModule(s.module)?.trackId ?? 'unknown'
      const last = groups[groups.length - 1]
      if (last?.track?.id === trackId && 'module' in last.stops[last.stops.length - 1]) {
        last.stops.push(s)
      } else {
        const track = getTrack(trackId)
        groups.push({ key: `${trackId}-${groups.length}`, track, title: track?.title ?? trackId, code: track?.code, stops: [s] })
      }
      i += 1
      continue
    }
    let j = i
    while (j < route.stops.length && 'problem' in route.stops[j]) j += 1
    const run = route.stops.slice(i, j)
    const last = groups[groups.length - 1]
    if (last && run.length <= 4) last.stops.push(...run)
    else groups.push({ key: `practice-${groups.length}`, title: 'Practice problems', code: '◇', stops: run })
    i = j
  }
  return groups
}
