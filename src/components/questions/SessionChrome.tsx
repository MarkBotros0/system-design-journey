import { BookOpen, X } from 'lucide-react'
import type { QuestionKind } from '../../content/types'
import { IconButton } from '../ui/Button'
import { KIND } from './kinds'
import { SegmentedProgress } from '../ui/SegmentedProgress'
import { TrackChip } from '../ui/TrackIcon'

/**
 * The top of a question screen (bank session, lesson quiz, their summaries), which lives
 * outside the tab shell: one way out, top left, and — while answering — how far through
 * the set you are.
 *
 * The header scrolls away with the page (the answers need the height), so a strip of paper
 * covers the status bar instead: under `viewport-fit=cover` the page would otherwise scroll
 * up behind the clock. On a screen with no inset the strip has no height.
 */
export function SessionHeader({
  onClose,
  closeLabel,
  progress,
}: {
  onClose: () => void
  closeLabel: string
  progress?: {
    /** Index of the question on screen. */
    at: number
    total: number
    /** Right or wrong per position answered so far, the one on screen included once answered. */
    states: ('correct' | 'wrong' | undefined)[]
  }
}) {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[env(safe-area-inset-top)] bg-paper" />
      <header className="flex min-h-15 items-center gap-3 pt-2 pb-1">
        <IconButton label={closeLabel} onClick={onClose} className="-ml-1">
          <X size={20} strokeWidth={2.2} aria-hidden="true" />
        </IconButton>
        {progress && (
          <>
            <div className="min-w-0 flex-1">
              <SegmentedProgress
                total={progress.total}
                done={progress.at}
                states={progress.states}
                label={`Question ${progress.at + 1} of ${progress.total}`}
              />
            </div>
            <span aria-hidden="true" className="shrink-0 text-[0.9375rem] font-bold text-ink-2 tabular">
              {progress.at + 1} / {progress.total}
            </span>
          </>
        )}
      </header>
    </>
  )
}

/** What the question is about and how to answer it: the track as a chip, then the kind. */
export function QuestionMeta({ kind, trackId, topic }: { kind: QuestionKind; trackId?: string; topic: string }) {
  const { label, Icon } = KIND[kind]
  return (
    <div className="flex flex-wrap items-center gap-2">
      {trackId ? (
        <TrackChip trackId={trackId} label={topic} />
      ) : (
        <span className="inline-flex h-8 max-w-full min-w-0 items-center gap-1.5 rounded-full bg-surface-2 pr-3 pl-1 text-[0.875rem] font-semibold text-ink-2">
          <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-3">
            <BookOpen size={13} strokeWidth={2.2} />
          </span>
          <span className="truncate">{topic}</span>
        </span>
      )}
      <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-[0.875rem] font-semibold text-ink-2">
        <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
        {label}
      </span>
    </div>
  )
}
