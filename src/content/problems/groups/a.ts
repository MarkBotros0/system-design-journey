import type { Problem } from '../../types'
import { instagram } from '../instagram'
import { reddit } from '../reddit'
import { fbPostSearch } from '../fbPostSearch'
import { topK } from '../topK'

/**
 * Problem group a. One problem per file under problems/, listed here.
 * Authoring rules: docs/superpowers/plans/2026-11-18-content-brief.md
 */
export const problems: Problem[] = [instagram, reddit, fbPostSearch, topK]
