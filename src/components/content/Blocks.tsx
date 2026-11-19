import { Fragment, useMemo } from 'react'
import { ArrowRight, Check, Info, Lightbulb, MessageSquareQuote, Scale, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import type { Block } from '../../content/types'
import { headingSlugs } from '../../lib/slug'
import { Inline } from './Inline'
import { FigureView } from './Figure'
import { CodeView } from './CodeView'
import { Followups } from './Followups'

/* Structured blocks sit on filled surfaces — a card (`surface` + the card shadow) or a
   tint — never in an outlined box. Track colour (via the lesson's trackStyle) marks
   emphasis; the state colours keep their meaning and always come with their icon.

   Track-coloured *text* only ever sits on `paper` or `surface`: on a track tint or on
   `surface-2` several light-theme track colours fall under 4.5:1, so labels on those
   grounds are ink and only the icon carries the colour. */

const card = 'rounded-[20px] bg-surface shadow-[var(--shadow-card)]'

/* ------------------------------------------------------------------ */
/* Callouts                                                            */
/* ------------------------------------------------------------------ */

const calloutStyle: Record<
  Extract<Block, { kind: 'callout' }>['tone'],
  { wrap: string; icon: LucideIcon; iconCls: string; label: string; labelCls: string }
> = {
  say: { wrap: 'bg-track-soft', icon: MessageSquareQuote, iconCls: 'text-track', label: 'Say it', labelCls: 'text-ink' },
  trap: { wrap: 'bg-alert-soft', icon: TriangleAlert, iconCls: 'text-alert', label: 'Trap', labelCls: 'text-alert' },
  note: { wrap: 'bg-surface-2', icon: Info, iconCls: 'text-ink-2', label: 'Note', labelCls: 'text-ink-2' },
  example: { wrap: card, icon: Lightbulb, iconCls: 'text-track', label: 'Example', labelCls: 'text-track' },
}

function Callout({ tone, title, text }: Extract<Block, { kind: 'callout' }>) {
  const s = calloutStyle[tone]
  const Icon = s.icon
  return (
    <div className={`flex gap-3 rounded-[20px] px-4 py-3.5 ${s.wrap}`}>
      <Icon size={18} strokeWidth={2.2} aria-hidden="true" className={`mt-px shrink-0 ${s.iconCls}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-[0.875rem] leading-snug font-bold ${s.labelCls}`}>{s.label}</p>
        {title && <p className="mt-1 text-base leading-snug font-bold text-ink">{title}</p>}
        <p className="mt-1 text-base leading-relaxed text-ink">
          <Inline text={text} />
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Flow — boxes and arrows                                             */
/* ------------------------------------------------------------------ */

function Flow({ nodes, note }: Extract<Block, { kind: 'flow' }>) {
  return (
    <figure className={`${card} p-4`}>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {nodes.map((n, i) => (
          <Fragment key={i}>
            <span className="rounded-xl bg-track-soft px-3 py-2 text-[0.875rem] leading-tight font-semibold text-ink">
              <Inline text={n} />
            </span>
            {i < nodes.length - 1 && <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" className="shrink-0 text-track" />}
          </Fragment>
        ))}
      </div>
      {note && <figcaption className="mt-3 text-[0.875rem] leading-snug text-ink-2">{note}</figcaption>}
    </figure>
  )
}

/* ------------------------------------------------------------------ */
/* Compare — two options, side by side                                 */
/* ------------------------------------------------------------------ */

function Compare({ left, right, verdict }: Extract<Block, { kind: 'compare' }>) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {[left, right].map((col, i) => (
          <div key={i} className={`${card} p-4`}>
            <h4 className="mb-2.5 text-base leading-snug font-bold">
              <Inline text={col.title} />
            </h4>
            <ul className="flex flex-col gap-2">
              {col.points.map((p, j) => (
                <li key={j} className="flex gap-2.5 text-[0.9375rem] leading-snug text-ink-2">
                  <span aria-hidden="true" className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-track" />
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
        <p className="flex gap-2.5 rounded-[20px] bg-track-soft px-4 py-3 text-[0.9375rem] leading-snug text-ink">
          <Scale size={17} strokeWidth={2.1} aria-hidden="true" className="mt-px shrink-0 text-track" />
          <span>
            <Inline text={verdict} />
          </span>
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Ladder — bad → good → great                                         */
/* ------------------------------------------------------------------ */

const grades = {
  bad: { text: 'Bad', icon: X, cls: 'text-alert', strength: 1 },
  good: { text: 'Good', icon: null, cls: 'text-ink-2', strength: 2 },
  great: { text: 'Great', icon: null, cls: 'text-ink-2', strength: 3 },
  best: { text: 'Pick this', icon: Check, cls: 'text-correct', strength: 4 },
} as const

/** Four rising bars: how strong the rung is, at a glance. The grade label says it in words. */
function Strength({ n }: { n: number }) {
  return (
    <span aria-hidden="true" className="mt-0.5 flex h-4 shrink-0 items-end gap-[3px]">
      {[6, 9, 12, 16].map((h, i) => (
        <span key={i} className={`w-[3px] rounded-full ${i < n ? 'bg-track' : 'bg-surface-3'}`} style={{ height: h }} />
      ))}
    </span>
  )
}

function Ladder({ rungs }: Extract<Block, { kind: 'ladder' }>) {
  return (
    <ol className="flex flex-col gap-2">
      {rungs.map((r, i) => {
        const g = grades[r.grade]
        const Icon = g.icon
        return (
          <li key={i} className={`flex gap-3.5 rounded-[20px] p-4 ${r.grade === 'best' ? 'bg-correct-soft' : card}`}>
            <Strength n={g.strength} />
            <div className="min-w-0 flex-1">
              <p className={`flex items-center gap-1 text-[0.8125rem] leading-none font-bold ${g.cls}`}>
                {Icon && <Icon size={14} strokeWidth={2.6} aria-hidden="true" />}
                {g.text}
              </p>
              <h4 className="mt-1.5 text-base leading-snug font-bold">
                <Inline text={r.title} />
              </h4>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-2">
                <Inline text={r.text} />
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

function Table({ head, rows }: Extract<Block, { kind: 'table' }>) {
  return (
    // Wide tables scroll inside the card, never the page. The row rules stay: in a
    // table they are how the eye keeps its row.
    <div className={`${card} overflow-hidden`}>
      <div className="overflow-x-auto overflow-y-hidden">
        <table className="w-full min-w-[34rem] border-collapse text-left">
          <thead>
            <tr>
              {head.map((h, i) => (
                <th key={i} className="bg-surface-2 px-3.5 py-3 text-[0.8125rem] leading-snug font-bold whitespace-nowrap text-ink-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-hairline first:border-t-0">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-3.5 py-3 align-top text-[0.875rem] leading-snug ${j === 0 ? 'font-semibold text-ink' : 'text-ink-2'}`}
                  >
                    <Inline text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Renderer                                                            */
/* ------------------------------------------------------------------ */

function CodeCompare({ before, after, note }: Extract<Block, { kind: 'codeCompare' }>) {
  return (
    <figure>
      <div className="grid gap-3 md:grid-cols-2">
        <CodeView
          code={before.code}
          accent="alert"
          label={
            <>
              <X size={15} strokeWidth={2.6} aria-hidden="true" className="shrink-0 text-alert" />
              <Inline text={before.title} />
            </>
          }
        />
        <CodeView
          code={after.code}
          accent="correct"
          label={
            <>
              <Check size={15} strokeWidth={2.6} aria-hidden="true" className="shrink-0 text-correct" />
              <Inline text={after.title} />
            </>
          }
        />
      </div>
      {note && (
        <figcaption className="mt-2.5 px-1 text-[0.875rem] leading-snug text-ink-2">
          <Inline text={note} />
        </figcaption>
      )}
    </figure>
  )
}

/**
 * Renders a lesson or walkthrough. Headings carry stable slug ids (see lib/slug) — the
 * table of contents, search deep links and the reading-place memory all aim at them.
 */
export function Blocks({ blocks }: { blocks: Block[] }) {
  const slugs = useMemo(() => headingSlugs(blocks), [blocks])
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'heading':
            return (
              <h2 key={i} id={slugs.get(i)} className="mt-5 text-[1.375rem] leading-tight font-bold tracking-[-0.02em] first:mt-0">
                <Inline text={b.text} />
              </h2>
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
              <List key={i} className="prose-lesson flex list-none flex-col gap-2.5 pl-0">
                {b.items.map((item, j) => (
                  <li key={j} className={`flex gap-3 ${b.ordered ? 'items-baseline' : ''}`}>
                    {b.ordered ? (
                      <span aria-hidden="true" className="w-5 shrink-0 text-right font-display text-[1rem] font-bold text-track tabular">
                        {j + 1}
                      </span>
                    ) : (
                      <span aria-hidden="true" className="mt-[0.62em] h-1.5 w-1.5 shrink-0 rounded-full bg-track" />
                    )}
                    <span className="min-w-0">
                      <Inline text={item} />
                    </span>
                  </li>
                ))}
              </List>
            )
          }
          case 'figure':
            // One card holds the drawing and its caption; the figure's own frame goes flat inside it.
            return (
              <figure key={i} className="fig-card rounded-[22px] bg-surface shadow-[var(--shadow-card)]">
                <FigureView figure={b.figure} />
                <figcaption className="-mt-1 px-4 pb-4 text-[0.875rem] leading-snug text-ink-2">
                  <Inline text={b.caption} />
                </figcaption>
              </figure>
            )
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
                <CodeView code={b.code} />
                {b.caption && <figcaption className="mt-2.5 px-1 text-[0.875rem] leading-snug text-ink-2">{b.caption}</figcaption>}
              </figure>
            )
          case 'codeCompare':
            return <CodeCompare key={i} {...b} />
          case 'followups':
            return <Followups key={i} items={b.items} />
        }
      })}
    </div>
  )
}
