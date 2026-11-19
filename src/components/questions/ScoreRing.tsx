import { Check } from 'lucide-react'

/**
 * A quiz score as a big ring, with a tick across it at the pass mark so "how close" reads
 * without arithmetic. A pass fills in the correct colour and carries a check; anything less
 * is ink — an unpassed quiz is not an error.
 */
export function ScoreRing({ value, pass, label }: { value: number; pass: number; label: string }) {
  const size = 176
  const stroke = 14
  const v = Math.max(0, Math.min(1, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const mid = size / 2
  const passed = v >= pass
  const pct = Math.round(v * 100)
  const passPct = Math.round(pass * 100)
  // Clockwise from twelve o'clock, like the arc.
  const angle = pass * 2 * Math.PI - Math.PI / 2
  const tick = (d: number) => ({ x: mid + d * Math.cos(angle), y: mid + d * Math.sin(angle) })
  const inner = tick(r - stroke / 2 - 5)
  const outer = tick(r + stroke / 2 + 5)

  return (
    <div
      role="img"
      aria-label={`${label}: ${pct}%. ${passPct}% passes.`}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size + 12, height: size + 12 }}
    >
      <svg width={size + 12} height={size + 12} viewBox={`-6 -6 ${size + 12} ${size + 12}`} aria-hidden="true">
        <circle cx={mid} cy={mid} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-3" />
        {v > 0 && (
          <circle
            cx={mid}
            cy={mid}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - v)}
            transform={`rotate(-90 ${mid} ${mid})`}
            className={`${passed ? 'stroke-correct' : 'stroke-line'} transition-[stroke-dashoffset] duration-700`}
            style={{ transitionTimingFunction: 'var(--ease-out)' }}
          />
        )}
        <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} strokeWidth={3.5} strokeLinecap="round" className="stroke-ink" />
      </svg>
      <span aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="flex items-baseline gap-0.5 text-[2.75rem] leading-none font-extrabold tracking-[-0.03em] tabular">
          {pct}
          <span className="text-[1.5rem] text-ink-2">%</span>
        </span>
        <span className={`mt-2 inline-flex items-center gap-1 text-[0.875rem] font-semibold ${passed ? 'text-correct' : 'text-ink-3'}`}>
          {passed && <Check size={15} strokeWidth={3} />}
          {passed ? 'Passed' : `Pass mark ${passPct}%`}
        </span>
      </span>
    </div>
  )
}
