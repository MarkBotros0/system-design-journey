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
import { problems as groupA } from './groups/a'
import { problems as groupB } from './groups/b'
import { problems as groupC } from './groups/c'
import { problems as groupD } from './groups/d'
import { problems as groupLld } from './groups/lld'

/**
 * The Practice screen groups these by category and sorts easy → hard inside each, so
 * order here only breaks ties.
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
  ...groupA,
  ...groupB,
  ...groupC,
  ...groupD,
  ...groupLld,
]
