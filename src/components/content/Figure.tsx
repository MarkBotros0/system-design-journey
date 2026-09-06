import { Fragment } from 'react'
import type { Figure, FigureTone, FlowNode, SplitSide } from '../../content/figures'
import { Inline } from './Inline'

/**
 * Renders a Figure.
 *
 * Deliberately CSS rather than SVG: labels stay real text, so they reflow, respect the
 * user's text size, and never shrink below legibility when the drawing scales down on a
 * 375px screen. Geometry that matters (timeline positions, log scales) is expressed as
 * percentage widths, which is exact enough and costs nothing in readability.
 */

/* Tone classes are written out in full — Tailwind scans source text, so a computed
   class name like `bg-${tone}-soft` would never make it into the stylesheet. */

const boxTone: Record<FigureTone, string> = {
  line: 'border-line bg-line-soft text-ink',
  mastered: 'border-mastered bg-mastered-soft text-ink',
  streak: 'border-streak bg-streak-soft text-ink',
  alert: 'border-alert bg-alert-soft text-ink',
  neutral: 'border-hairline bg-surface text-ink',
}

const barTone: Record<FigureTone, string> = {
  line: 'bg-line',
  mastered: 'bg-mastered',
  streak: 'bg-streak',
  alert: 'bg-alert',
  neutral: 'bg-ink-3',
}

const softTone: Record<FigureTone, string> = {
  line: 'bg-line-soft',
  mastered: 'bg-mastered-soft',
  streak: 'bg-streak-soft',
  alert: 'bg-alert-soft',
  neutral: 'bg-surface-2',
}

const textTone: Record<FigureTone, string> = {
  line: 'text-line',
  mastered: 'text-mastered',
  streak: 'text-streak',
  alert: 'text-alert',
  neutral: 'text-ink-3',
}

function Frame({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-2/50 p-3.5">
      {children}
      {note && (
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-3">
          <Inline text={note} />
        </p>
      )}
    </div>
  )
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 self-center py-0.5 sm:py-0">
      {label && (
        <span className="font-mono text-[0.625rem] leading-none tracking-wide text-ink-3">
          {label}
        </span>
      )}
      <svg
        viewBox="0 0 24 8"
        aria-hidden="true"
        className="h-2 w-5 rotate-90 text-line sm:rotate-0"
        fill="none"
      >
        <path d="M0 4h19" stroke="currentColor" strokeWidth="1.5" />
        <path d="M17 1l5 3-5 3z" fill="currentColor" />
      </svg>
    </div>
  )
}

function Box({ node }: { node: FlowNode }) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col justify-center rounded-lg border px-2.5 py-2 text-center ${boxTone[node.tone ?? 'neutral']}`}
    >
      <span className="text-[0.8125rem] leading-tight font-medium">{node.label}</span>
      {node.sub && (
        <span className="mt-0.5 font-mono text-[0.625rem] leading-tight text-ink-3">
          {node.sub}
        </span>
      )}
    </div>
  )
}

function FlowRow({ nodes }: { nodes: FlowNode[] }) {
  return (
    <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-stretch sm:gap-1.5">
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
      <p className={`mb-2 text-[0.8125rem] font-semibold ${textTone[side.tone ?? 'neutral']}`}>
        {side.title}
      </p>
      <FlowRow nodes={side.nodes} />
      {side.cost && (
        <p className="mt-2 text-[0.75rem] leading-relaxed text-ink-3">
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
      <div className="overflow-x-auto">
        <div className="min-w-[19rem]">
          {/* Tick row */}
          <div className="mb-1.5 flex justify-between border-b border-hairline pb-1">
            {figure.ticks.map((t, i) => (
              <span key={i} className="font-mono text-[0.625rem] text-ink-3">
                {t}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {figure.lanes.map((lane, i) => (
              <div key={i}>
                <p className="mb-1 text-[0.75rem] text-ink-2">{lane.label}</p>
                <div className="flex items-center gap-2">
                  <div className="relative h-6 flex-1 rounded bg-surface-2">
                    {lane.bars.map((bar, j) => (
                      <div
                        key={j}
                        className={`absolute top-0 bottom-0 flex items-center justify-center rounded ${softTone[bar.tone ?? 'line']} border ${
                          bar.tone === 'alert'
                            ? 'border-alert'
                            : bar.tone === 'mastered'
                              ? 'border-mastered'
                              : 'border-line'
                        }`}
                        style={{
                          left: `${bar.from * 100}%`,
                          width: `${Math.max(0.02, bar.to - bar.from) * 100}%`,
                        }}
                      >
                        {bar.label && (
                          <span className="truncate px-1.5 font-mono text-[0.625rem] text-ink">
                            {bar.label}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {lane.outcome && (
                    <span
                      className={`shrink-0 rounded border px-2 py-1 text-[0.6875rem] leading-tight ${boxTone[lane.outcome.tone ?? 'neutral']}`}
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
      <div className="flex flex-col gap-1.5">
        {figure.items.map((item, i) => {
          const pct = ((Math.log10(Math.max(item.value, Number.MIN_VALUE)) - lo) / span) * 100
          return (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2">
              <div className="min-w-0">
                <p className="truncate text-[0.75rem] text-ink-2">{item.label}</p>
                <div className="mt-0.5 h-2 w-full rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full ${barTone[item.tone ?? 'line']}`}
                    style={{ width: `${Math.max(3, pct)}%` }}
                  />
                </div>
              </div>
              <span className="font-mono text-[0.6875rem] whitespace-nowrap text-ink tabular">
                {item.display}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-2.5 font-mono text-[0.625rem] tracking-wide text-ink-3">
        Logarithmic — each full step is roughly ten times the one above
      </p>
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
          <div className="flex flex-col gap-1">
            {figure.layers.map((l, i) => (
              <div
                key={i}
                className={`flex items-baseline justify-between gap-3 rounded-lg border px-3 py-2 ${boxTone[l.tone ?? 'neutral']}`}
              >
                <span className="text-[0.8125rem] font-medium">{l.label}</span>
                {l.sub && (
                  <span className="shrink-0 font-mono text-[0.625rem] text-ink-3">{l.sub}</span>
                )}
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
            <div className="hidden w-px shrink-0 bg-hairline sm:block" />
            <SplitColumn side={figure.right} />
          </div>
          {figure.verdict && (
            <p className="mt-3 border-t border-hairline pt-2.5 text-[0.8125rem] leading-relaxed text-ink">
              <Inline text={figure.verdict} />
            </p>
          )}
        </Frame>
      )

    case 'ratio': {
      const total = figure.parts.reduce((n, p) => n + p.value, 0) || 1
      return (
        <Frame note={figure.note}>
          <div className="flex h-8 w-full overflow-hidden rounded-lg">
            {figure.parts.map((p, i) => (
              <div
                key={i}
                className={`flex items-center justify-center ${barTone[p.tone ?? 'line']}`}
                style={{ width: `${(p.value / total) * 100}%` }}
                title={p.label}
              >
                <span className="truncate px-1 font-mono text-[0.625rem] text-paper">
                  {Math.round((p.value / total) * 100)}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {figure.parts.map((p, i) => (
              <span key={i} className="flex items-center gap-1.5 text-[0.75rem] text-ink-2">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 shrink-0 rounded-full ${barTone[p.tone ?? 'line']}`}
                />
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
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${figure.cols}, minmax(0, 1fr))` }}
          >
            {figure.cells.map((c, i) => (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded border text-center font-mono text-[0.625rem] leading-none ${boxTone[c.tone ?? 'neutral']}`}
              >
                {c.label}
              </div>
            ))}
          </div>
          {figure.legend && (
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
              {figure.legend.map((l, i) => (
                <span key={i} className="flex items-center gap-1.5 text-[0.75rem] text-ink-2">
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 shrink-0 rounded-sm border ${boxTone[l.tone]}`}
                  />
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

    case 'cycle':
      return (
        <Frame note={figure.note}>
          <ol className="flex flex-col gap-1">
            {figure.steps.map((s, i) => (
              <li
                key={i}
                className="flex items-baseline gap-2.5 rounded-lg border border-hairline bg-surface px-3 py-2"
              >
                <span className="font-mono text-[0.625rem] text-line tabular">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-[0.8125rem] font-medium">{s.label}</span>
                  {s.sub && (
                    <span className="mt-0.5 block font-mono text-[0.625rem] text-ink-3">
                      {s.sub}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-1.5 flex items-center gap-1.5 pl-3 font-mono text-[0.625rem] text-line">
            <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3" fill="none">
              <path
                d="M2 6a4 4 0 1 1 1.2 2.8"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path d="M1 9.2l2.2-.6.6 2.2z" fill="currentColor" />
            </svg>
            repeats from step 01
          </p>
        </Frame>
      )
  }
}
