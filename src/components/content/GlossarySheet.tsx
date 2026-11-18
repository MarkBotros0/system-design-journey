import { Link } from 'react-router-dom'
import { getGlossary } from '../../content/glossary'
import { useGlossary } from '../../state/GlossaryProvider'
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
        <>
          <div className="px-5 pt-3 pr-14 sm:pt-6">
            <p className="font-mono text-[1.375rem] leading-none font-semibold text-line">{entry.id}</p>
            <h2 id="glossary-title" className="mt-1.5 text-[1.0625rem] font-semibold">
              {entry.full}
            </h2>
          </div>

          <p className="px-5 pt-2.5 text-[0.9375rem] leading-relaxed text-ink-2">
            <Inline text={entry.gist} />
          </p>

          <div className="px-5 pt-4">
            <FigureView figure={entry.figure} />
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-3">{entry.caption}</p>
          </div>

          {entry.seeAlso && entry.seeAlso.length > 0 && (
            <div className="px-5 pt-4">
              <p className="mb-1.5 font-mono text-[0.625rem] tracking-[0.12em] uppercase text-ink-3">See also</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.seeAlso.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => open(id)}
                    className="min-h-11 rounded-lg border border-hairline bg-surface-2 px-3 font-mono text-[0.75rem] text-ink-2 hover:border-line hover:text-line"
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-5 pt-4 pb-5 sm:pb-6">
            <Link
              to={`/glossary#${encodeURIComponent(entry.id)}`}
              onClick={close}
              className="inline-flex min-h-11 items-center text-[0.875rem] text-line hover:underline"
            >
              All terms
            </Link>
          </div>
        </>
      )}
    </Sheet>
  )
}
