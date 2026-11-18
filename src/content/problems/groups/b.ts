import type { Problem } from '../../types'
import { liveComments } from '../liveComments'
import { googleDocs } from '../googleDocs'
import { notifications } from '../notifications'
import { yelp } from '../yelp'
import { foodDelivery } from '../foodDelivery'

/**
 * Problem group b. One problem per file under problems/, listed here.
 * Authoring rules: docs/superpowers/plans/2026-11-18-content-brief.md
 */
export const problems: Problem[] = [liveComments, googleDocs, notifications, yelp, foodDelivery]
