import { useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import { glossary } from '../content/glossary'
import type { GlossaryEntry } from '../content/glossary'
import { plainText } from '../lib/text'
import { useGlossary } from '../state/GlossaryProvider'
import { TopBar, PageTitle } from '../components/ui/TopBar'
import { Group } from '../components/ui/List'
import { Empty } from '../components/ui/Bits'
import { useScrolledPast } from '../components/ui/useScrolledPast'

/* A to Z, the way a reference is scanned. The curriculum's own order is by author file,
   which means nothing to someone looking a term up. */
const sorted = [...glossary].sort((a, b) => a.id.localeCompare(b.id, 'en', { sensitivity: 'base' }))

function letterOf(id: string): string {
  const c = id[0]?.toUpperCase() ?? '#'
  return /[A-Z]/.test(c) ? c : '#'
}

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

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase()
    const hits = q
      ? sorted.filter(
          (g) => g.id.toLowerCase().includes(q) || g.full.toLowerCase().includes(q) || g.gist.toLowerCase().includes(q),
        )
      : sorted
    const out: { letter: string; items: GlossaryEntry[] }[] = []
    for (const g of hits) {
      const letter = letterOf(g.id)
      const last = out[out.length - 1]
      if (last?.letter === letter) last.items.push(g)
      else out.push({ letter, items: [g] })
    }
    return out
  }, [query])

  return (
    <div>
      <TopBar title="Glossary" showTitle={scrolled} back={{ label: 'Back', to: '/learn?view=topics' }} />
      <PageTitle
        title="Glossary"
        titleRef={titleRef}
        sub={`${glossary.length} abbreviations, each with an illustration of what it actually does.`}
      />

      <div className="relative mb-2">
        <Search
          size={18}
          strokeWidth={2.2}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-2"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms"
          aria-label="Search terms"
          className="min-h-12 w-full rounded-[14px] bg-surface-3 pr-4 pl-10 text-base text-ink outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-ink/15 [&::-webkit-search-cancel-button]:hidden"
        />
      </div>

      {sections.length === 0 ? (
        <div className="mt-4">
          <Empty title="No matches" body={`Nothing matches “${query}”. Try the full name, or a word from what it does.`} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sections.map((s) => (
            <Group key={s.letter} title={s.letter} className="mt-3">
              {s.items.map((g) => {
                const targeted = g.id === target
                const sameName = g.full.toLowerCase() === g.id.toLowerCase()
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      id={g.id}
                      onClick={() => open(g.id)}
                      aria-current={targeted ? 'true' : undefined}
                      className={`flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-100 focus-visible:[outline-offset:-3px] active:bg-surface-2 ${
                        targeted ? 'bg-surface-2' : 'hover:bg-surface-2/60'
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-base leading-snug [overflow-wrap:anywhere]">
                          <span className="font-bold">{g.id}</span>
                          {!sameName && <span className="font-medium text-ink-2"> · {g.full}</span>}
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-[0.875rem] leading-snug text-ink-2">
                          {plainText(g.gist)}
                        </span>
                      </span>
                      <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" className="shrink-0 text-ink-3" />
                    </button>
                  </li>
                )
              })}
            </Group>
          ))}
        </div>
      )}
    </div>
  )
}
