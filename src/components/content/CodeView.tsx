import { useMemo, type ReactNode } from 'react'
import { highlight, type TokenKind } from '../../lib/highlight'

const tokenClass: Record<Exclude<TokenKind, 'plain'>, string> = {
  kw: 'text-code-kw',
  str: 'text-code-str',
  com: 'text-code-com italic',
  type: 'text-code-type',
  num: 'text-code-num',
}

/**
 * Highlighted code on a filled inset that scrolls sideways inside itself. Focusable so a
 * keyboard user can scroll a long line too. A before/after pair gets a tinted header —
 * the ✗ / ✓ icon in it is what carries the verdict, the tint only groups it.
 */
export function CodeView({
  code,
  label,
  accent,
}: {
  code: string
  label?: ReactNode
  /** A verdict on the code, for before/after pairs. */
  accent?: 'alert' | 'correct'
}) {
  const tokens = useMemo(() => highlight(code), [code])
  const head = accent === 'alert' ? 'bg-alert-soft' : accent === 'correct' ? 'bg-correct-soft' : 'bg-surface-3'
  return (
    <div className="min-w-0 overflow-hidden rounded-[18px] bg-surface-2">
      {label && (
        <div className={`flex items-center gap-2 px-4 py-2.5 text-[0.875rem] leading-snug font-bold text-ink ${head}`}>{label}</div>
      )}
      <pre
        tabIndex={0}
        aria-label={typeof label === 'string' ? label : 'Code'}
        className="overflow-x-auto overflow-y-hidden p-4 font-mono text-[0.8125rem] leading-relaxed text-ink focus-visible:outline-offset-[-2px]"
      >
        <code>
          {tokens.map((t, i) =>
            t.kind === 'plain' ? (
              t.text
            ) : (
              <span key={i} className={tokenClass[t.kind]}>
                {t.text}
              </span>
            ),
          )}
        </code>
      </pre>
    </div>
  )
}
