/**
 * A ring that fills clockwise. Small sizes are glanceable markers; the largest carries
 * its percentage in the middle. `tone` follows the token rules: `mastered` only when
 * the thing is genuinely complete.
 */
export function ProgressRing({
  value,
  size = 40,
  label,
  tone = 'line',
  showValue = size >= 56,
}: {
  value: number
  size?: 28 | 40 | 56 | 72
  label: string
  tone?: 'line' | 'correct' | 'mastered'
  showValue?: boolean
}) {
  const v = Math.max(0, Math.min(1, value))
  const stroke = size <= 28 ? 3 : size <= 40 ? 3.5 : 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.round(v * 100)
  return (
    <span
      role="img"
      aria-label={`${label}: ${pct}%`}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className={`${tone === 'mastered' ? 'stroke-mastered' : tone === 'correct' ? 'stroke-correct' : 'stroke-line'} transition-[stroke-dashoffset] duration-500`}
          style={{ transitionTimingFunction: 'var(--ease-out)' }}
        />
      </svg>
      {showValue && (
        <span className="absolute font-mono text-[0.75rem] font-medium text-ink tabular" aria-hidden="true">
          {pct}%
        </span>
      )}
    </span>
  )
}
