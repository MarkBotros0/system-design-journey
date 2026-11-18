import type { Problem } from '../../types'
import { airbnb } from '../airbnb'
import { auction } from '../auction'
import { flashSale } from '../flashSale'
import { payments } from '../payments'

/**
 * Problem group c. One problem per file under problems/, listed here.
 * Authoring rules: docs/superpowers/plans/2026-11-18-content-brief.md
 */
export const problems: Problem[] = [airbnb, auction, flashSale, payments]
