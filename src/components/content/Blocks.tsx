import { Fragment, useMemo } from 'react'
import type { Block } from '../../content/types'

/* ------------------------------------------------------------------ */
/* Inline markup                                                       */
/* ------------------------------------------------------------------ */

/**
 * Two inline forms only: **bold** and `code`. Deliberately tiny — a full markdown
 * parser would invite content that the block types already handle better, and every
 * extra form is one more thing that can render wrong on a 375px screen.
 */
export function Inline({ text }: { text: string }) {
  const parts = useMemo(() => text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean), [text])
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-ink"
            >
              {part.slice(1, -1)}
            </code>
          )
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Callouts                                                            */
/* ------------------------------------------------------------------ */

const calloutStyle = {
  say: { wrap: 'border-line bg-line-soft', label: 'text-line', fallback: 'Say this' },
  trap: { wrap: 'border-alert bg-alert-soft', label: 'text-alert', fallback: 'Trap' },
  note: { wrap: 'border-hairline bg-surface-2', label: 'text-ink-3', fallback: 'Note' },
} as const

function Callout({ tone, title, text }: Extract<Block, { kind: 'callout' }>) {
  const s = calloutStyle[tone]
  return (
    <div className={`rounded-r-xl border-l-2 py-3 pr-4 pl-4 ${s.wrap}`}>
      <p className={`mb-1 font-mono text-[0.6875rem] tracking-[0.12em] uppercase ${s.label}`}>
        {title ?? s.fallback}
      </p>
      <p className="text-[0.9375rem] leading-relaxed text-ink">
        <Inline text={text} />
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Flow — boxes and arrows                                             */
/* ------------------------------------------------------------------ */

function Flow({ nodes, note }: Extract<Block, { kind: 'flow' }>) {
  return (
    <figure className="rounded-2xl border border-hairline bg-surface-2/60 p-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2.5">
        {nodes.map((n, i) => (
          <Fragment key={i}>
            <span className="rounded-lg border border-line/35 bg-surface px-2.5 py-1.5 font-mono text-[0.75rem] text-ink">
              {n}
            </span>
            {i < nodes.length - 1 && (
              <span aria-hidden="true" className="text-line">
                &rarr;
              </span>
            )}
          </Fragment>
        ))}
      </div>
      {note && <figcaption className="mt-3 text-[0.8125rem] text-ink-3">{note}</figcaption>}
    </figure>
  )
}

/* ------------------------------------------------------------------ */
/* Compare — two options, side by side                                 */
/* ------------------------------------------------------------------ */

function Compare({ left, right, verdict }: Extract<Block, { kind: 'compare' }>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline">
      <div className="grid sm:grid-cols-2">
        {[left, right].map((col, i) => (
          <div
            key={i}
            className={`bg-surface p-4 ${
              i === 0 ? 'border-b border-hairline sm:border-r sm:border-b-0' : ''
            }`}
          >
            <h4 className="mb-2 text-[0.9375rem] font-semibold">{col.title}</h4>
            <ul className="space-y-1.5">
              {col.points.map((p, j) => (
                <li key={j} className="flex gap-2 text-[0.875rem] text-ink-2">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                  <span>
                    <Inline text={p} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {verdict && (
        <p className="border-t border-hairline bg-line-soft px-4 py-3 text-[0.875rem] text-ink">
          <Inline text={verdict} />
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Ladder — bad → good → great                                         */
/* ------------------------------------------------------------------ */

const gradeLabel = {
  bad: { text: 'Bad', cls: 'text-alert' },
  good: { text: 'Good', cls: 'text-ink-3' },
  great: { text: 'Great', cls: 'text-ink-2' },
  best: { text: 'Pick this', cls: 'text-mastered font-semibold' },
} as const

function Ladder({ rungs }: Extract<Block, { kind: 'ladder' }>) {
  return (
    <ol className="overflow-hidden rounded-2xl border border-hairline">
      {rungs.map((r, i) => (
        <li
          key={i}
          className={`border-b border-hairline p-4 last:border-b-0 ${
            r.grade === 'best' ? 'bg-mastered-soft' : 'bg-surface'
          }`}
        >
          <p
            className={`mb-1 font-mono text-[0.6875rem] tracking-[0.12em] uppercase ${gradeLabel[r.grade].cls}`}
          >
            {gradeLabel[r.grade].text}
          </p>
          <h4 className="text-[0.9375rem] font-semibold">{r.title}</h4>
          <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-2">
            <Inline text={r.text} />
          </p>
        </li>
      ))}
    </ol>
  )
}

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

function Table({ head, rows }: Extract<Block, { kind: 'table' }>) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[34rem] border-collapse overflow-hidden rounded-xl text-left">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                className="border-b border-hairline bg-surface-2 px-3 py-2.5 font-mono text-[0.6875rem] tracking-[0.1em] whitespace-nowrap text-ink-3 uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="border-b border-hairline bg-surface px-3 py-2.5 align-top text-[0.875rem] text-ink-2"
                >
                  <Inline text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Renderer                                                            */
/* ------------------------------------------------------------------ */

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'heading':
            return (
              <h3 key={i} className="mt-3 text-[1.1875rem] font-semibold first:mt-0">
                {b.text}
              </h3>
            )
          case 'prose':
            return (
              <p key={i} className="prose-lesson">
                <Inline text={b.text} />
              </p>
            )
          case 'list': {
            const List = b.ordered ? 'ol' : 'ul'
            return (
              <List key={i} className="prose-lesson flex list-none flex-col gap-2 pl-0">
                {b.items.map((item, j) => (
                  <li key={j} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-line"
                    />
                    <span>
                      <Inline text={item} />
                    </span>
                  </li>
                ))}
              </List>
            )
          }
          case 'callout':
            return <Callout key={i} {...b} />
          case 'table':
            return <Table key={i} {...b} />
          case 'flow':
            return <Flow key={i} {...b} />
          case 'compare':
            return <Compare key={i} {...b} />
          case 'ladder':
            return <Ladder key={i} {...b} />
          case 'code':
            return (
              <figure key={i}>
                <pre className="overflow-x-auto rounded-xl border border-hairline bg-surface-2 p-3.5 font-mono text-[0.8125rem] leading-relaxed text-ink">
                  <code>{b.code}</code>
                </pre>
                {b.caption && (
                  <figcaption className="mt-2 text-[0.8125rem] text-ink-3">{b.caption}</figcaption>
                )}
              </figure>
            )
        }
      })}
    </div>
  )
}
