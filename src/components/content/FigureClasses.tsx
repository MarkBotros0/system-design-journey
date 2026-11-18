import type { ClassRelation, Figure } from '../../content/figures'
import { Frame } from './figureKit'
import { boxTone } from './figureTones'
import { Inline } from './Inline'

/**
 * UML-lite. Boxes in a grid (one column on a phone), relationships listed underneath with
 * the standard glyphs — a drawn web of crossing lines does not survive 375px, a list of
 * "A ◆— B" does.
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
    <svg viewBox="0 0 34 12" className="h-3 w-[2.125rem] shrink-0 text-line" aria-hidden="true" fill="none">
      {kind === 'has' && <path d="M1 6l5-4 5 4-5 4z" fill="currentColor" />}
      <path
        d={kind === 'has' ? 'M11 6h21' : 'M1 6h24'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray={dashed ? '3 2.5' : undefined}
      />
      {(kind === 'inherits' || kind === 'implements') && (
        <path d="M25 1.5l8 4.5-8 4.5z" stroke="currentColor" strokeWidth="1.3" className="fill-surface-2" />
      )}
      {kind === 'uses' && <path d="M27 2l6 4-6 4" stroke="currentColor" strokeWidth="1.5" />}
    </svg>
  )
}

export function ClassesFigure({ figure }: { figure: Extract<Figure, { kind: 'classes' }> }) {
  return (
    <Frame note={figure.note}>
      <div className={`grid gap-2.5 ${figure.classes.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        {figure.classes.map((c) => (
          <div key={c.name} className={`overflow-hidden rounded-lg border ${boxTone[c.tone ?? 'neutral']}`}>
            <div className="px-3 py-2 text-center">
              {c.stereotype && (
                <p className="font-mono text-[0.625rem] leading-tight text-ink-3">«{c.stereotype}»</p>
              )}
              <p className={`text-[0.875rem] leading-tight font-semibold ${c.stereotype ? 'italic' : ''}`}>{c.name}</p>
            </div>
            {c.fields && c.fields.length > 0 && (
              <ul className="border-t border-hairline px-3 py-1.5 font-mono text-[0.6875rem] leading-relaxed text-ink-2">
                {c.fields.map((f, i) => (
                  <li key={i} className="break-words">
                    <Inline text={f} />
                  </li>
                ))}
              </ul>
            )}
            {c.methods && c.methods.length > 0 && (
              <ul className="border-t border-hairline px-3 py-1.5 font-mono text-[0.6875rem] leading-relaxed text-ink">
                {c.methods.map((m, i) => (
                  <li key={i} className="break-words">
                    <Inline text={m} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      {figure.relations.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-hairline pt-3">
          {figure.relations.map((r, i) => (
            <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.75rem]">
              <span className="font-mono font-semibold text-ink">{r.from}</span>
              <Glyph kind={r.kind} />
              <span className="text-ink-3">{KIND_LABEL[r.kind]}</span>
              <span className="font-mono font-semibold text-ink">{r.to}</span>
              {r.label && (
                <span className="text-ink-3">
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
