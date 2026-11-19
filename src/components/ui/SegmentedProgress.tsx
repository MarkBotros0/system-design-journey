/**
 * Progress through a set, one segment per item: answered items take their earned colour
 * (right / wrong) when `states` says so, otherwise ink; the current one is half-filled.
 * Colour is never the only signal — the label carries the count for screen readers.
 */
export function SegmentedProgress({
  total,
  done,
  states,
  label,
}: {
  total: number
  done: number
  states?: ('correct' | 'wrong' | undefined)[]
  label: string
}) {
  const n = Math.max(1, total)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={n}
      aria-valuenow={Math.min(done, n)}
      aria-valuetext={`${Math.min(done, n)} of ${n}`}
      className="flex w-full items-center gap-1"
    >
      {Array.from({ length: n }, (_, i) => {
        const s = states?.[i]
        const fill =
          s === 'correct' ? 'bg-correct' : s === 'wrong' ? 'bg-alert' : i < done ? 'bg-line' : i === done ? 'bg-line/40' : 'bg-surface-3'
        return <span key={i} aria-hidden="true" className={`h-1.5 min-w-0 flex-1 rounded-full transition-colors duration-200 ${fill}`} />
      })}
    </div>
  )
}
