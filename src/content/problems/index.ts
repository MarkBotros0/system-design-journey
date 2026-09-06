import type { Problem } from '../types'
import { bitly } from './bitly'
import { dropbox } from './dropbox'
import { rateLimiter } from './rateLimiter'
import { ticketmaster } from './ticketmaster'
import { newsFeed } from './newsFeed'
import { whatsapp } from './whatsapp'
import { youtube } from './youtube'
import { webCrawler } from './webCrawler'
import { adClick } from './adClick'
import { uber } from './uber'

/**
 * Ordered easy → hard; the practice list keeps this order.
 *
 * Between them these ten cover all eight patterns, most more than once, so working the
 * list top to bottom means meeting each shape in more than one costume.
 */
export const problems: Problem[] = [
  bitly,
  dropbox,
  rateLimiter,
  ticketmaster,
  newsFeed,
  whatsapp,
  youtube,
  webCrawler,
  adClick,
  uber,
]
