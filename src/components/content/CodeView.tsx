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
 * Highlighted code that scrolls sideways inside itself. Focusable so a keyboard user can
 * scroll a long line too.
 */
export function CodeView({
  code,
  label,
  accent,
}: {
  code: string
  label?: ReactNode
  /** A verdict on the code, for before/after pairs. */
  accent?: 'alert' | 'mastered'
}) {
  const tokens = useMemo(() => highlight(code), [code])
  const top = accent === 'alert' ? 'border-t-2 border-t-alert' : accent === 'mastered' ? 'border-t-2 border-t-mastered' : ''
  return (
    <div className={`min-w-0 overflow-hidden rounded-xl border border-hairline bg-surface-2 ${top}`}>
      {label && (
        <div className="flex items-center gap-1.5 border-b border-hairline px-3.5 py-2 font-mono text-[0.6875rem] tracking-[0.1em] text-ink-2 uppercase">
          {label}
        </div>
      )}
      <pre
        tabIndex={0}
        aria-label={typeof label === 'string' ? label : 'Code'}
        className="overflow-x-auto p-3.5 font-mono text-[0.8125rem] leading-relaxed text-ink"
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
