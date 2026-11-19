import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getGlossary } from '../../content/glossary'
import { useGlossary } from '../../state/GlossaryProvider'
import { Chip } from '../ui/Chip'
import { Sheet } from '../ui/Sheet'
import { FigureView } from './Figure'
import { Inline } from './Inline'

/**
 * The glossary sheet. Mounted once by App; every abbreviation in the app, and every
 * term result in search, opens this one.
 */
export function GlossarySheet() {
  const { openId, close, open } = useGlossary()
  const entry = getGlossary(openId ?? '')

  return (
    <Sheet open={!!openId && !!entry} onClose={close} labelledBy="glossary-title">
      {entry && (
        <div className="px-5 pt-1 pb-6 sm:pt-6">
          <div className="pr-12">
            <p className="text-[1.75rem] leading-none font-extrabold tracking-[-0.02em]">{entry.id}</p>
            <h2 id="glossary-title" className="mt-2 text-[1.0625rem] leading-snug font-semibold text-ink-2">
              {entry.full}
            </h2>
          </div>

          <p className="mt-3 text-base leading-relaxed text-ink">
            <Inline text={entry.gist} />
          </p>

          {/* Already on a surface, so the figure steps down to an inset rather than a card. */}
          <figure className="fig-inset mt-5">
            <FigureView figure={entry.figure} />
            <figcaption className="mt-2.5 px-1 text-[0.875rem] leading-snug text-ink-2">{entry.caption}</figcaption>
          </figure>

          {entry.seeAlso && entry.seeAlso.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[0.875rem] font-bold text-ink-2">See also</p>
              <div className="flex flex-wrap gap-2">
                {entry.seeAlso.map((id) => (
                  <Chip key={id} onClick={() => open(id)}>
                    {id}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <Link
            to={`/glossary#${encodeURIComponent(entry.id)}`}
            onClick={close}
            className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-surface-3 px-5 text-[0.9375rem] font-semibold text-ink transition-[background-color,transform] duration-150 hover:bg-hairline active:scale-[0.97] motion-reduce:active:scale-100"
          >
            All terms
            <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>
      )}
    </Sheet>
  )
}
