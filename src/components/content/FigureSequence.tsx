import type { Figure } from '../../content/figures'
import { plainText } from '../../lib/text'
import { Frame } from './figureKit'
import { neutralCell, strokeTone } from './figureTones'
import { Inline } from './Inline'

/**
 * Sequence diagram. Actors are equal columns, so a column's centre is at (i + ½) / n —
 * arrows are positioned in percentages and stay exact at any width. Four or more actors
 * get a minimum width and scroll inside the frame, never the page.
 *
 * Rows size to their label, so a message that wraps to two lines pushes its arrow down
 * instead of drawing over it.
 *
 * The drawing is hidden from assistive tech and paired with a plain ordered list of the
 * same messages, because "an arrow from column 1 to column 3" is meaningless read aloud.
 */
export function SequenceFigure({ figure }: { figure: Extract<Figure, { kind: 'sequence' }> }) {
  const n = figure.actors.length
  const centre = (i: number) => ((i + 0.5) / n) * 100
  const wide = n > 3

  return (
    <Frame note={figure.note}>
      <ol className="sr-only">
        {figure.steps.map((s, k) => (
          <li key={k}>
            {s.from === s.to
              ? `${plainText(figure.actors[s.from])}: ${plainText(s.label)}`
              : `${plainText(figure.actors[s.from])} to ${plainText(figure.actors[s.to])}: ${plainText(s.label)}`}
          </li>
        ))}
      </ol>
      <div aria-hidden="true" className={wide ? '-mx-4 overflow-x-auto overflow-y-hidden px-4 pb-1' : ''}>
        <div className={wide ? 'min-w-[30rem]' : ''}>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {figure.actors.map((a, i) => (
              <div key={i} className="px-1">
                <div className="rounded-xl bg-track-soft px-1.5 py-2 text-center text-[0.8125rem] leading-tight font-bold text-ink">
                  <Inline text={a} />
                </div>
              </div>
            ))}
          </div>

          <div className="relative pt-1 pb-2">
            {figure.actors.map((_, i) => (
              <span
                key={i}
                className="absolute top-0 bottom-0 w-px border-l border-dashed border-ink-3/45"
                style={{ left: `${centre(i)}%` }}
              />
            ))}
            <ol className="relative">
              {figure.steps.map((s, k) => {
                const tone = strokeTone[s.tone ?? 'line']
                if (s.from === s.to) {
                  const c = centre(s.from)
                  // Centred on its lifeline, and never wider than the room either side of it.
                  const room = Math.min(46, 2 * Math.min(c, 100 - c))
                  return (
                    <li key={k} className="py-1.5">
                      <span
                        className={`inline-block -translate-x-1/2 rounded-lg px-2 py-1 text-center text-[0.8125rem] leading-tight text-ink-2 ${neutralCell}`}
                        style={{ marginLeft: `${c}%`, maxWidth: `${room}%` }}
                      >
                        <Inline text={s.label} />
                      </span>
                    </li>
                  )
                }
                const left = Math.min(centre(s.from), centre(s.to))
                const width = Math.abs(centre(s.to) - centre(s.from))
                const rightward = s.to > s.from
                return (
                  <li key={k} className="pt-1.5 pb-2">
                    <span
                      className="block px-1 text-center text-[0.8125rem] leading-tight font-medium text-ink"
                      style={{ marginLeft: `${left}%`, width: `${width}%` }}
                    >
                      <Inline text={s.label} />
                    </span>
                    <span
                      className={`relative mt-1.5 block border-t-[1.5px] ${s.dashed ? 'border-dashed' : 'border-solid'} ${tone}`}
                      style={{ marginLeft: `${left}%`, width: `${width}%` }}
                    >
                      <svg
                        viewBox="0 0 8 8"
                        className={`absolute -top-[4.75px] h-2 w-2 ${rightward ? '-right-px' : '-left-px rotate-180'}`}
                      >
                        <path d="M0 0l8 4-8 4z" fill="currentColor" />
                      </svg>
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>
    </Frame>
  )
}
