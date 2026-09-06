import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { glossary } from '../content/glossary'
import { useGlossary } from '../state/GlossaryProvider'
import { ScreenTitle } from '../components/ui/Bits'

/**
 * Every abbreviation in the curriculum, in one place. Tapping opens the same sheet the
 * inline terms do, so there is one explanation of each term and one place it lives.
 */
export function GlossaryScreen() {
  const { open } = useGlossary()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return glossary
    return glossary.filter(
      (g) =>
        g.id.toLowerCase().includes(q) ||
        g.full.toLowerCase().includes(q) ||
        g.gist.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div>
      <Link
        to="/you"
        className="-ml-1 mb-5 inline-flex min-h-11 items-center gap-1.5 pr-2 text-[0.875rem] text-ink-2 hover:text-ink"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        You
      </Link>

      <ScreenTitle
        title="Terms"
        sub={`${glossary.length} abbreviations, each with an illustration of what it actually does.`}
      />

      <div className="relative mb-5">
        <Search
          size={16}
          strokeWidth={2}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms"
          aria-label="Search terms"
          className="min-h-12 w-full rounded-xl border border-hairline bg-surface pr-4 pl-10 text-[0.9375rem] text-ink placeholder:text-ink-3 focus:border-line focus:outline-none"
        />
      </div>

      {results.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-hairline px-5 py-8 text-center text-[0.9375rem] text-ink-2">
          Nothing matches &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {results.map((g) => (
            <li key={g.id}>
              <button
                onClick={() => open(g.id)}
                className="flex w-full items-baseline gap-3 rounded-xl border border-hairline bg-surface px-4 py-3 text-left transition-colors duration-150 hover:border-line"
              >
                <span className="w-16 shrink-0 font-mono text-[0.8125rem] font-semibold text-line">
                  {g.id}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] leading-snug font-medium">{g.full}</span>
                  <span className="mt-0.5 line-clamp-2 block text-[0.8125rem] leading-relaxed text-ink-2">
                    {g.gist}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
