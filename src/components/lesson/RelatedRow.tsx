import { Link } from 'react-router-dom'
import { getTrack } from '../../content'
import type { Module } from '../../content/types'
import { plainText } from '../../lib/text'
import { TrackTile } from '../ui/TrackIcon'

/** Lessons that pair with this one, across tracks. Scrolls sideways inside itself. */
export function RelatedRow({ modules }: { modules: Module[] }) {
  if (!modules.length) return null
  return (
    <section aria-labelledby="related-h" className="mt-10">
      <h2 id="related-h" className="mb-3 text-[1.125rem] font-semibold">
        Goes well with
      </h2>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:-mx-8 lg:px-8 xl:mx-0 xl:grid xl:grid-cols-2 xl:overflow-visible xl:px-0 [&::-webkit-scrollbar]:hidden">
        {modules.map((m) => {
          const t = getTrack(m.trackId)
          return (
            <li key={m.id} className="w-60 shrink-0 snap-start xl:w-auto">
              <Link
                to={`/m/${m.id}`}
                className="flex h-full gap-3 rounded-2xl border border-hairline bg-surface p-3.5 transition-colors hover:border-line"
              >
                <TrackTile trackId={m.trackId} code={t?.code} size="sm" />
                <span className="min-w-0">
                  <span className="block text-[0.9375rem] leading-snug font-medium">{plainText(m.title)}</span>
                  <span className="mt-0.5 block text-[0.75rem] text-ink-3">
                    {t?.title} · {m.minutes} min
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
