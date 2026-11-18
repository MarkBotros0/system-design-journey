import { useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import { glossary } from '../content/glossary'
import { useGlossary } from '../state/GlossaryProvider'
import { TopBar, PageTitle } from '../components/ui/TopBar'
import { useScrolledPast } from '../components/ui/useScrolledPast'

/**
 * Every abbreviation in the curriculum, in one place. Tapping opens the same sheet the
 * inline terms do, so there is one explanation of each term and one place it lives.
 */
export function GlossaryScreen() {
  const { open } = useGlossary()
  const [query, setQuery] = useState('')
  const { hash } = useLocation()
  const target = decodeURIComponent(hash.slice(1))
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrolled = useScrolledPast(titleRef)

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
      <TopBar title="Glossary" showTitle={scrolled} back={{ label: 'Back', to: '/learn?view=topics' }} />
      <PageTitle
        title="Glossary"
        titleRef={titleRef}
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
            <li key={g.id} id={g.id}>
              <button
                type="button"
                onClick={() => open(g.id)}
                className={`flex min-h-14 w-full items-baseline gap-3 rounded-xl border bg-surface px-4 py-3 text-left transition-colors duration-150 hover:border-line ${
                  g.id === target ? 'border-line bg-line-soft/40' : 'border-hairline'
                }`}
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
