import { useEffect, useState, type RefObject } from 'react'

/** Below the sticky bar, with a little air: the line a heading must cross to be "current". */
const READ_LINE = 120

/**
 * Reading progress through the article (0–1) and the heading currently being read.
 *
 * One rAF-throttled scroll listener serves both. The active heading is the last one whose
 * top has crossed the read line — with ten or so headings, measuring them directly is
 * cheaper and more predictable than an IntersectionObserver per heading, which reports
 * crossings, not "the last one above me".
 */
export function useLessonScroll(articleRef: RefObject<HTMLElement | null>, headingIds: string[]) {
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState<string | undefined>(undefined)
  const key = headingIds.join('|')

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const el = articleRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const span = rect.height - vh
      setProgress(span <= 0 ? 1 : Math.max(0, Math.min(1, -rect.top / span)))

      let current: string | undefined
      for (const id of headingIds) {
        const h = document.getElementById(id)
        if (!h) continue
        if (h.getBoundingClientRect().top <= READ_LINE) current = id
        else break
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
    // headingIds is represented by key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleRef, key])

  return { progress, active }
}
