import type { Problem } from '../../types'
import { jobScheduler } from '../jobScheduler'
import { typeahead } from '../typeahead'
import { onlineJudge } from '../onlineJudge'
import { kvStore } from '../kvStore'
import { metrics } from '../metrics'

/**
 * Problem group d. One problem per file under problems/, listed here.
 * Authoring rules: docs/superpowers/plans/2026-11-18-content-brief.md
 */
export const problems: Problem[] = [jobScheduler, typeahead, onlineJudge, kvStore, metrics]
