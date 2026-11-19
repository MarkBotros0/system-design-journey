/**
 * The question set being answered, kept in sessionStorage: it survives "Learn more" and
 * Back, and dies with the tab. One set at a time.
 */

import { isFinished, parseSet, type QuestionSet } from './bank'

const SET_KEY = 'tp:qset'

export function loadSet(): QuestionSet | null {
  try {
    return parseSet(sessionStorage.getItem(SET_KEY))
  } catch {
    return null
  }
}

export function saveSet(s: QuestionSet | null): void {
  try {
    if (s) sessionStorage.setItem(SET_KEY, JSON.stringify(s))
    else sessionStorage.removeItem(SET_KEY)
  } catch {
    /* storage blocked — the set just will not survive a reload */
  }
}

/** Entry points call this before opening a set: a finished set is not resumed, it is replaced. */
export function clearFinishedSet(): void {
  const s = loadSet()
  if (s && isFinished(s)) saveSet(null)
}
