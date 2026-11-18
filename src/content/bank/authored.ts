import type { Question } from '../types'
import { questions as foundationsInterview } from './foundations-interview'
import { questions as principlesLld } from './principles-lld'
import { questions as designPatterns } from './design-patterns'
import { questions as core } from './core'
import { questions as databases } from './databases'
import { questions as distributedProduction } from './distributed-production'
import { questions as architectureApplied } from './architecture-applied'

/**
 * Every hand-written bank question. Kept apart from bank/index.ts so content/index.ts can
 * validate them without importing the assembled bank (which imports content/index.ts).
 */
export const authoredQuestions: Question[] = [
  ...foundationsInterview,
  ...principlesLld,
  ...designPatterns,
  ...core,
  ...databases,
  ...distributedProduction,
  ...architectureApplied,
]
