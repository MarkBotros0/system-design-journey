import type { Problem } from '../../types'
import { lldParkingLot } from '../lldParkingLot'
import { lldVending } from '../lldVending'
import { lldLru } from '../lldLru'
import { lldElevator } from '../lldElevator'
import { lldLibrary } from '../lldLibrary'
import { lldRateLimiter } from '../lldRateLimiter'

/**
 * Problem group lld. One problem per file under problems/, listed here.
 * Authoring rules: docs/superpowers/plans/2026-11-18-content-brief.md
 *
 * Easy to hard. The two easy ones teach the round's shape (a fit rule, a state machine);
 * the hard one is a reusable component with every seam a senior interviewer probes.
 */
export const problems: Problem[] = [
  lldParkingLot,
  lldVending,
  lldLru,
  lldElevator,
  lldLibrary,
  lldRateLimiter,
]
