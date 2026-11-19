import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Check, X } from 'lucide-react'
import { Inline } from '../content/Inline'
import { Button } from '../ui/Button'
import { TrackGlyph } from '../ui/TrackIcon'

export type Verdict = 'correct' | 'close' | 'wrong'

/** Marks (AnswerOption's, and the match result's) that show something went wrong. */
const MISTAKE = new Set(['wrong', 'extra', 'missed', 'key'])

const VERDICT: Record<Verdict, { title: string; tone: string }> = {
  correct: { title: 'Correct', tone: 'bg-correct-soft text-correct' },
  close: { title: 'Close, not quite', tone: 'bg-alert-soft text-alert' },
  wrong: { title: 'Not quite', tone: 'bg-alert-soft text-alert' },
}

/**
 * The verdict, why, where to read more, and Continue — docked at the bottom of the screen
 * like a sheet, so the answered options stay in view above it.
 *
 * Deliberately not a modal Sheet: a modal would lock the page, so options hidden behind it
 * could not be scrolled into view, and dismissing it would leave an answered question with
 * no way on. As a sticky panel at the end of the page it overlaps nothing for good: scroll
 * to the end and every option sits above it.
 *
 * Focus moves here when it appears, so a screen reader hears the verdict and the
 * explanation, and Enter (handled by the screen) moves on.
 */
export function Feedback({
  verdict,
  tally,
  explain,
  learnMore,
  onContinue,
  continueLabel,
  reveal,
}: {
  verdict: Verdict
  /** A line under the verdict: what was found, missed, extra; when it comes back. */
  tally?: ReactNode
  explain: string
  /** The lesson section (or reference page) the question tests. */
  learnMore?: { href: string; title: string; sub?: string; trackId?: string }
  onContinue: () => void
  continueLabel: string
  /** The answers: scrolled up above the panel when it opens, as far as they fit. */
  reveal?: RefObject<HTMLElement | null>
}) {
  const ref = useRef<HTMLElement>(null)
  const id = useId()
  const v = VERDICT[verdict]

  useEffect(() => {
    const panel = ref.current
    if (!panel) return
    panel.focus({ preventScroll: true })
    // A frame later the panel has its height. Lift the rows that tell the story — a mistake
    // and its correction, or else the hits — clear of it, but never the first of them past
    // the top of the screen.
    const raf = requestAnimationFrame(() => {
      const answers = reveal?.current
      if (!answers) return
      const marked = [...answers.querySelectorAll<HTMLElement>('[data-mark]')]
      const mistakes = marked.filter((el) => MISTAKE.has(el.dataset.mark ?? ''))
      const rows = mistakes.length ? mistakes : marked.filter((el) => el.dataset.mark !== 'dim')
      if (!rows.length) rows.push(answers)
      const first = rows[0].getBoundingClientRect()
      const last = rows[rows.length - 1].getBoundingClientRect()
      const top = Math.min(panel.getBoundingClientRect().top, window.innerHeight - panel.offsetHeight)
      const by = Math.min(last.bottom + 16 - top, first.top - 12)
      if (by <= 0) return
      // An explicit 'smooth' would override the global reduced-motion reset, so ask first.
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollBy({ top: by, behavior: reduce ? 'auto' : 'smooth' })
    })
    return () => cancelAnimationFrame(raf)
  }, [reveal])

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby={`${id}-v`}
      aria-describedby={tally ? `${id}-t ${id}-d` : `${id}-d`}
      // Capped like a medium detent, so the answers keep most of a small screen; a long
      // explanation scrolls inside, under a fade that says there is more.
      className="animate-sheet-in sticky bottom-0 z-10 -mx-4 mt-auto flex max-h-[min(62dvh,38rem)] flex-col rounded-t-[28px] bg-surface outline-none"
      style={{ boxShadow: 'var(--shadow-sheet)' }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${v.tone}`}>
            {verdict === 'correct' ? <Check size={20} strokeWidth={2.8} /> : <X size={20} strokeWidth={2.8} />}
          </span>
          <div className="min-w-0">
            <h2 id={`${id}-v`} className="text-[1.25rem] leading-tight font-extrabold">
              {v.title}
            </h2>
            {tally && (
              <p id={`${id}-t`} className="mt-0.5 text-[0.875rem] leading-snug font-semibold text-ink-3">
                {tally}
              </p>
            )}
          </div>
        </div>
        {learnMore && (
          <p className="mt-3 flex items-center gap-2.5">
            {learnMore.trackId ? (
              <TrackGlyph trackId={learnMore.trackId} size={28} />
            ) : (
              <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-surface-3 text-ink-2">
                <BookOpen size={15} strokeWidth={2.2} />
              </span>
            )}
            <span className="line-clamp-2 min-w-0 text-[0.875rem] leading-snug text-ink-2">
              <span className="font-bold text-ink">{learnMore.title}</span>
              {learnMore.sub && ` · ${learnMore.sub}`}
            </span>
          </p>
        )}
        {/* Glossary terms here sit inside a sentence: WCAG 2.5.8's inline exception. */}
        <p id={`${id}-d`} data-target-exempt className="mt-3 text-base leading-normal text-ink-2">
          <Inline text={explain} />
        </p>
        {/* Bottom padding when scrolled to the end; a fade over the text while there is more. */}
        <div aria-hidden="true" className="pointer-events-none sticky bottom-0 h-5 shrink-0 bg-linear-to-t from-surface to-transparent" />
      </div>
      {/* Both actions in the thumb zone, even when the explanation scrolls. */}
      <div className={`shrink-0 gap-2.5 px-5 pt-1 pb-[calc(env(safe-area-inset-bottom)+0.875rem)] ${learnMore ? 'grid grid-cols-2' : 'flex'}`}>
        {learnMore && (
          <Link
            to={learnMore.href}
            // Named after the topic for a screen reader; the line above names it on screen.
            aria-label={`Learn more: ${learnMore.title}${learnMore.sub ? `, ${learnMore.sub}` : ''}`}
            className="inline-flex min-h-14 min-w-0 items-center justify-center gap-2 rounded-full bg-surface-3 px-4 text-base font-semibold text-ink transition-[background-color,transform] duration-150 select-none hover:bg-hairline active:scale-[0.97] motion-reduce:active:scale-100"
          >
            <BookOpen size={18} strokeWidth={2.2} aria-hidden="true" className="shrink-0" />
            <span className="truncate">Learn more</span>
          </Link>
        )}
        <Button size="lg" onClick={onContinue}>
          {continueLabel}
          <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
        </Button>
      </div>
    </section>
  )
}
