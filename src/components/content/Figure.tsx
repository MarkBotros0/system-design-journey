import { Fragment } from 'react'
import type { Figure, FlowNode, SplitSide } from '../../content/figures'
import { Inline } from './Inline'
import { Frame } from './figureKit'
import { barTone, boxTone, neutralCell, textTone } from './figureTones'
import { SequenceFigure } from './FigureSequence'
import { ClassesFigure } from './FigureClasses'
import { DecisionFigure } from './FigureDecision'

/**
 * Renders a Figure.
 *
 * Deliberately CSS rather than SVG: labels stay real text, so they reflow, respect the
 * user's text size, and never shrink below legibility when the drawing scales down on a
 * 375px screen. Geometry that matters (timeline positions, log scales) is expressed as
 * percentage widths, which is exact enough and costs nothing in readability.
 *
 * Every shape is a filled tint rather than an outline; the only lines left are the ones
 * that carry meaning — arrows, axes, the branches of a tree.
 */

function Arrow({ label }: { label?: string }) {
  return (
    /* Rotating the arrow does not rotate its layout box, so on mobile it draws ~6px
       past each end. The gap and padding reserve that room, or the arrowhead lands
       on top of the label above it. */
    <div className="flex shrink-0 flex-col items-center justify-center gap-2 self-center py-2 sm:max-w-[7rem] sm:gap-1 sm:py-0">
      {label && <span className="text-center text-[0.8125rem] leading-tight font-medium text-ink-2">{label}</span>}
      <svg viewBox="0 0 24 8" aria-hidden="true" className="h-2 w-5 rotate-90 text-track sm:rotate-0" fill="none">
        <path d="M0 4h19" stroke="currentColor" strokeWidth="1.75" />
        <path d="M17 1l5 3-5 3z" fill="currentColor" />
      </svg>
    </div>
  )
}

function Box({ node }: { node: FlowNode }) {
  return (
    <div className={`flex min-w-0 flex-1 flex-col justify-center rounded-xl px-3 py-2.5 text-center ${boxTone[node.tone ?? 'neutral']}`}>
      <span className="text-[0.875rem] leading-snug font-semibold">
        <Inline text={node.label} />
      </span>
      {node.sub && <span className="mt-0.5 text-[0.8125rem] leading-snug text-ink-2">{node.sub}</span>}
    </div>
  )
}

function FlowRow({ nodes }: { nodes: FlowNode[] }) {
  return (
    <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-stretch sm:gap-2">
      {nodes.map((n, i) => (
        <Fragment key={i}>
          <Box node={n} />
          {i < nodes.length - 1 && <Arrow label={n.to} />}
        </Fragment>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function SplitColumn({ side }: { side: SplitSide }) {
  return (
    <div className="min-w-0 flex-1">
      <p className={`mb-2.5 text-[0.875rem] leading-snug font-bold ${textTone[side.tone ?? 'neutral']}`}>{side.title}</p>
      <FlowRow nodes={side.nodes} />
      {side.cost && (
        <p className="mt-2.5 text-[0.8125rem] leading-snug text-ink-2">
          <Inline text={side.cost} />
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Timeline({ figure }: { figure: Extract<Figure, { kind: 'timeline' }> }) {
  return (
    <Frame note={figure.note}>
      <div className="overflow-x-auto overflow-y-hidden">
        <div className="min-w-[19rem]">
          {/* The axis: the one rule in this figure, because it is the scale. */}
          <div className="mb-2.5 flex justify-between border-b border-surface-3 pb-1.5">
            {figure.ticks.map((t, i) => (
              <span key={i} className="text-[0.8125rem] font-medium text-ink-2 tabular">
                {t}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {figure.lanes.map((lane, i) => (
              <div key={i}>
                <p className="mb-1 text-[0.8125rem] leading-snug font-semibold text-ink-2">{lane.label}</p>
                <div className="flex items-center gap-2">
                  <div className="relative h-7 flex-1 rounded-lg bg-surface-3">
                    {lane.bars.map((bar, j) => (
                      <div
                        key={j}
                        className={`absolute top-0 bottom-0 flex items-center justify-center overflow-hidden rounded-lg ${barTone[bar.tone ?? 'line']}`}
                        style={{
                          left: `${bar.from * 100}%`,
                          width: `${Math.max(0.02, bar.to - bar.from) * 100}%`,
                        }}
                      >
                        {bar.label && (
                          <span className="truncate px-1.5 text-[0.8125rem] font-semibold text-paper">{bar.label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {lane.outcome && (
                    <span
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-[0.8125rem] leading-tight font-semibold ${boxTone[lane.outcome.tone ?? 'neutral']}`}
                    >
                      {lane.outcome.label}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ */

function Scale({ figure }: { figure: Extract<Figure, { kind: 'scale' }> }) {
  // Log scale — the whole point of these figures is that the steps are orders of
  // magnitude apart, which a linear bar would render as one full bar and several slivers.
  const values = figure.items.map((i) => Math.max(i.value, Number.MIN_VALUE))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const lo = Math.log10(min)
  const hi = Math.log10(max)
  const span = hi - lo || 1

  return (
    <Frame note={figure.note}>
      <div className="flex flex-col gap-2.5">
        {figure.items.map((item, i) => {
          const pct = ((Math.log10(Math.max(item.value, Number.MIN_VALUE)) - lo) / span) * 100
          return (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3">
              <div className="min-w-0">
                <p className="text-[0.8125rem] leading-snug text-ink-2">{item.label}</p>
                <div className="mt-1 h-2 w-full rounded-full bg-surface-3">
                  <div className={`h-full rounded-full ${barTone[item.tone ?? 'line']}`} style={{ width: `${Math.max(3, pct)}%` }} />
                </div>
              </div>
              <span className="text-[0.8125rem] leading-none font-bold whitespace-nowrap text-ink tabular">{item.display}</span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[0.8125rem] leading-snug text-ink-2">Logarithmic — each full step is roughly ten times the one above</p>
    </Frame>
  )
}

/* ------------------------------------------------------------------ */

export function FigureView({ figure }: { figure: Figure }) {
  switch (figure.kind) {
    case 'flow':
      return (
        <Frame note={figure.note}>
          <FlowRow nodes={figure.nodes} />
        </Frame>
      )

    case 'stack':
      return (
        <Frame note={figure.note}>
          <div className="flex flex-col gap-1.5">
            {figure.layers.map((l, i) => (
              <div
                key={i}
                className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-xl px-3.5 py-2.5 ${boxTone[l.tone ?? 'neutral']}`}
              >
                <span className="min-w-0 text-[0.875rem] leading-snug font-semibold">{l.label}</span>
                {/* Wraps under the label when it does not fit beside it — never pushes the page sideways. */}
                {l.sub && <span className="ml-auto min-w-0 text-right text-[0.8125rem] leading-snug text-ink-2">{l.sub}</span>}
              </div>
            ))}
          </div>
        </Frame>
      )

    case 'split':
      return (
        <Frame>
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
            <SplitColumn side={figure.left} />
            {/* The two options are alternatives; the rule between them says so. */}
            <div aria-hidden="true" className="h-px shrink-0 bg-surface-3 sm:h-auto sm:w-px" />
            <SplitColumn side={figure.right} />
          </div>
          {figure.verdict && (
            <p className="mt-4 rounded-xl bg-track-soft px-3.5 py-2.5 text-[0.875rem] leading-snug text-ink">
              <Inline text={figure.verdict} />
            </p>
          )}
        </Frame>
      )

    case 'ratio': {
      const total = figure.parts.reduce((n, p) => n + p.value, 0) || 1
      return (
        <Frame note={figure.note}>
          <div className="flex h-9 w-full gap-0.5 overflow-hidden rounded-xl">
            {figure.parts.map((p, i) => (
              <div
                key={i}
                className={`flex min-w-0 items-center justify-center ${barTone[p.tone ?? 'line']}`}
                style={{ width: `${(p.value / total) * 100}%` }}
                title={p.label}
              >
                <span className="truncate px-1 text-[0.8125rem] font-bold text-paper tabular">{Math.round((p.value / total) * 100)}%</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {figure.parts.map((p, i) => (
              <span key={i} className="flex items-center gap-2 text-[0.8125rem] leading-snug text-ink-2">
                <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${barTone[p.tone ?? 'line']}`} />
                {p.label}
              </span>
            ))}
          </div>
        </Frame>
      )
    }

    case 'grid':
      return (
        <Frame note={figure.note}>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${figure.cols}, minmax(0, 1fr))` }}>
            {figure.cells.map((c, i) => (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center overflow-hidden rounded-md px-0.5 text-center text-[0.8125rem] leading-none font-semibold tabular ${boxTone[c.tone ?? 'neutral']}`}
              >
                {c.label}
              </div>
            ))}
          </div>
          {figure.legend && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {figure.legend.map((l, i) => (
                <span key={i} className="flex items-center gap-2 text-[0.8125rem] leading-snug text-ink-2">
                  <span aria-hidden="true" className={`h-3 w-3 shrink-0 rounded-[4px] ${boxTone[l.tone]}`} />
                  {l.label}
                </span>
              ))}
            </div>
          )}
        </Frame>
      )

    case 'timeline':
      return <Timeline figure={figure} />

    case 'scale':
      return <Scale figure={figure} />

    case 'sequence':
      return <SequenceFigure figure={figure} />

    case 'classes':
      return <ClassesFigure figure={figure} />

    case 'decision':
      return <DecisionFigure figure={figure} />

    case 'cycle':
      return (
        <Frame note={figure.note}>
          <ol className="flex flex-col gap-1.5">
            {figure.steps.map((s, i) => (
              <li key={i} className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${neutralCell}`}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-track text-[0.8125rem] font-bold text-paper tabular">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 pt-0.5">
                  <span className="block text-[0.875rem] leading-snug font-semibold">{s.label}</span>
                  {s.sub && <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ink-2">{s.sub}</span>}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-2 flex items-center gap-1.5 pl-3 text-[0.8125rem] font-semibold text-ink-2">
            <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3.5 w-3.5 text-track" fill="none">
              <path d="M2 6a4 4 0 1 1 1.2 2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M1 9.2l2.2-.6.6 2.2z" fill="currentColor" />
            </svg>
            Repeats from step 1
          </p>
        </Frame>
      )
  }
}
