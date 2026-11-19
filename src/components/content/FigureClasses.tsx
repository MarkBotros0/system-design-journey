import type { ClassRelation, Figure } from '../../content/figures'
import { Frame } from './figureKit'
import { boxTone } from './figureTones'
import { Inline } from './Inline'

/**
 * UML-lite. Boxes in a grid (one column on a phone), relationships listed underneath with
 * the standard glyphs — a drawn web of crossing lines does not survive 375px, a list of
 * "A ◆— B" does.
 *
 * A box's compartments (name, fields, methods) are separate tinted blocks with a sliver of
 * the frame between them, so the UML divisions survive without drawing outlines.
 */

const KIND_LABEL: Record<ClassRelation['kind'], string> = {
  inherits: 'extends',
  implements: 'implements',
  has: 'has',
  uses: 'uses',
}

function Glyph({ kind }: { kind: ClassRelation['kind'] }) {
  const dashed = kind === 'implements' || kind === 'uses'
  return (
    <svg viewBox="0 0 34 12" className="h-3 w-[2.125rem] shrink-0 text-track" aria-hidden="true" fill="none">
      {kind === 'has' && <path d="M1 6l5-4 5 4-5 4z" fill="currentColor" />}
      <path
        d={kind === 'has' ? 'M11 6h21' : 'M1 6h24'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray={dashed ? '3 2.5' : undefined}
      />
      {(kind === 'inherits' || kind === 'implements') && (
        <path d="M25 1.5l8 4.5-8 4.5z" stroke="currentColor" strokeWidth="1.3" className="fill-surface in-[.fig-inset]:fill-surface-2" />
      )}
      {kind === 'uses' && <path d="M27 2l6 4-6 4" stroke="currentColor" strokeWidth="1.5" />}
    </svg>
  )
}

export function ClassesFigure({ figure }: { figure: Extract<Figure, { kind: 'classes' }> }) {
  return (
    <Frame note={figure.note}>
      <div className={`grid gap-2.5 ${figure.classes.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        {figure.classes.map((c) => {
          const tone = boxTone[c.tone ?? 'neutral']
          return (
            <div key={c.name} className="flex flex-col gap-0.5 overflow-hidden rounded-xl">
              <div className={`px-3 py-2.5 text-center ${tone}`}>
                {c.stereotype && <p className="text-[0.8125rem] leading-tight text-ink-2">«{c.stereotype}»</p>}
                <p className={`text-[0.875rem] leading-tight font-bold ${c.stereotype ? 'italic' : ''}`}>{c.name}</p>
              </div>
              {c.fields && c.fields.length > 0 && (
                <ul className={`px-3 py-2 font-mono text-[0.8125rem] leading-relaxed text-ink-2 ${tone}`}>
                  {c.fields.map((f, i) => (
                    <li key={i} className="break-words">
                      <Inline text={f} />
                    </li>
                  ))}
                </ul>
              )}
              {c.methods && c.methods.length > 0 && (
                <ul className={`px-3 py-2 font-mono text-[0.8125rem] leading-relaxed ${tone}`}>
                  {c.methods.map((m, i) => (
                    <li key={i} className="break-words">
                      <Inline text={m} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
      {figure.relations.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {figure.relations.map((r, i) => (
            <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.8125rem] leading-snug">
              <span className="font-mono font-semibold text-ink">{r.from}</span>
              <Glyph kind={r.kind} />
              <span className="text-ink-2">{KIND_LABEL[r.kind]}</span>
              <span className="font-mono font-semibold text-ink">{r.to}</span>
              {r.label && (
                <span className="text-ink-2">
                  · <Inline text={r.label} />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Frame>
  )
}
