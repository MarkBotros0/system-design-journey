import { useEffect, useState, type RefObject } from 'react'

/**
 * True once the element has scrolled up behind the sticky top bar — the moment the
 * compact title in the bar should take over from the page's large heading.
 */
export function useScrolledPast(ref: RefObject<HTMLElement | null>, offset = 56): boolean {
  const [past, setPast] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setPast(!entry.isIntersecting && entry.boundingClientRect.top < offset), {
      rootMargin: `-${offset}px 0px 0px 0px`,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, offset])
  return past
}
