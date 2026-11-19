import { ArrowLeftRight, CircleDot, ListChecks, Scale, type LucideIcon } from 'lucide-react'
import type { QuestionKind } from '../../content/types'

/** How each kind of question is named and drawn, in the session's chip and the bank's filter. */
export const KIND: Record<QuestionKind, { label: string; short: string; Icon: LucideIcon }> = {
  single: { label: 'Pick one', short: 'Pick one', Icon: CircleDot },
  multi: { label: 'Select all that apply', short: 'Select all', Icon: ListChecks },
  truefalse: { label: 'True or false', short: 'True or false', Icon: Scale },
  match: { label: 'Match the pairs', short: 'Match', Icon: ArrowLeftRight },
}
