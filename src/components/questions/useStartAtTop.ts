import { useEffect, useState, type RefObject } from 'react'

/**
 * A new question (or a summary) starts at the top with focus on its heading: the last
 * answer's feedback may have scrolled the page, and a screen reader should hear the
 * question change. Not when coming back to a question already answered — its feedback
 * takes focus instead.
 */
export function useStartAtTop(ref: RefObject<HTMLHeadingElement | null>, skip = false) {
  const [skipped] = useState(skip)
  useEffect(() => {
    if (skipped) return
    window.scrollTo(0, 0)
    ref.current?.focus({ preventScroll: true })
  }, [ref, skipped])
}

/**
 * Enter checks or moves on — unless focus is on a control, which Enter already activates.
 * `onCheck` is null while there is nothing to check yet.
 */
export function useEnterKey(answered: boolean, onNext: () => void, onCheck: (() => void) | null) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && /^(BUTTON|A|SUMMARY|INPUT|TEXTAREA)$/.test(t.tagName)) return
      if (answered) {
        e.preventDefault()
        onNext()
      } else if (onCheck) {
        e.preventDefault()
        onCheck()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [answered, onNext, onCheck])
}
