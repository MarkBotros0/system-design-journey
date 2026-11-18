import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookA, BookOpen, ChevronRight, Hash, History, Puzzle, Search, Timer, X } from 'lucide-react'
import { getModule, getTrack } from '../content'
import { POPULAR_TOPICS, search, searchAll, type Hit, type HitType } from '../lib/search'
import { useProgress } from '../state/ProgressProvider'
import { useGlossary } from '../state/GlossaryProvider'
import { Chip } from '../components/ui/Chip'

const GROUP: Record<HitType, { title: string; icon: typeof BookOpen }> = {
  lesson: { title: 'Lessons', icon: BookOpen },
  section: { title: 'In lessons', icon: Hash },
  term: { title: 'Terms', icon: BookA },
  problem: { title: 'Practice problems', icon: Timer },
  pattern: { title: 'Patterns', icon: Puzzle },
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Wraps the matched words in <mark>. Matches at word starts only, so "cap" lights "CAP", not "escape". */
function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  const parts = useMemo(() => {
    const words = terms.filter((t) => t.length > 1).map(escape)
    if (!words.length) return [text]
    return text.split(new RegExp(`(\\b(?:${words.join('|')})\\w*)`, 'gi'))
  }, [text, terms])
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm bg-line-soft px-0.5 text-ink">
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  )
}

function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mt-6 mb-2 flex min-h-8 items-center justify-between gap-3">
      <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase">{children}</p>
      {right}
    </div>
  )
}

export function SearchScreen() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { progress, pushRecentSearch, clearRecentSearches } = useProgress()
  const { open: openTerm } = useGlossary()

  const [text, setText] = useState(() => params.get('q') ?? '')
  const [query, setQuery] = useState(text)
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState<Set<HitType>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced: typing stays instant, the index is consulted once the fingers pause.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(text)
      setActive(0)
      setExpanded(new Set())
      setParams(text.trim() ? { q: text } : {}, { replace: true })
    }, 80)
    return () => clearTimeout(t)
  }, [text, setParams])

  const result = useMemo(() => search(query), [query])
  const groups = useMemo(
    () =>
      result.groups.map((g) => ({
        type: g.type,
        hits: expanded.has(g.type) ? searchAll(query, g.type) : g.hits,
        more: expanded.has(g.type) ? 0 : searchAll(query, g.type).length - g.hits.length,
      })),
    [result, expanded, query],
  )
  const flat = useMemo(() => groups.flatMap((g) => g.hits), [groups])

  function back() {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate('/')
  }

  function openHit(hit: Hit) {
    pushRecentSearch(query)
    if (hit.type === 'term') openTerm(hit.id)
    else navigate(hit.href)
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(flat.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      const hit = flat[active] ?? flat[0]
      if (hit) {
        e.preventDefault()
        openHit(hit)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (text) setText('')
      else back()
    }
  }

  useEffect(() => {
    document.getElementById(`hit-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const trimmed = query.trim()
  const hasQuery = trimmed.replace(/[^\p{L}\p{N}]/gu, '').length >= 2
  let n = -1

  return (
    <div>
      <header className="sticky top-0 z-30 -mx-4 border-b border-hairline/70 bg-paper/90 px-4 pt-safe backdrop-blur-md lg:-mx-8 lg:px-8">
        <div className="flex min-h-16 items-center gap-1.5">
          <button
            type="button"
            onClick={back}
            aria-label="Close search"
            className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-2 hover:bg-surface-2 hover:text-ink lg:hidden"
          >
            <ArrowLeft size={19} strokeWidth={2} />
          </button>
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search size={18} strokeWidth={2} aria-hidden="true" className="pointer-events-none absolute left-3.5 text-ink-3" />
            <input
              ref={inputRef}
              autoFocus
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
              placeholder="Search topics, terms, problems"
              role="combobox"
              aria-expanded={flat.length > 0}
              aria-controls="search-results"
              aria-activedescendant={flat.length ? `hit-${active}` : undefined}
              aria-autocomplete="list"
              aria-label="Search the curriculum"
              className="min-h-12 w-full rounded-xl border border-hairline bg-surface pr-11 pl-10 text-base text-ink outline-none placeholder:text-ink-3 focus:border-line [&::-webkit-search-cancel-button]:hidden"
            />
            {text && (
              <button
                type="button"
                onClick={() => {
                  setText('')
                  inputRef.current?.focus()
                }}
                aria-label="Clear search"
                className="absolute right-0.5 flex h-11 w-11 items-center justify-center rounded-xl text-ink-3 hover:text-ink"
              >
                <X size={17} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </header>

      <p className="sr-only" aria-live="polite">
        {hasQuery ? (result.total ? `${result.total} results` : 'No results') : ''}
      </p>

      {!hasQuery && (
        <div>
          {progress.recentSearches.length > 0 && (
            <>
              <SectionLabel
                right={
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="min-h-11 px-1 text-[0.8125rem] text-ink-3 hover:text-ink"
                  >
                    Clear
                  </button>
                }
              >
                Recent
              </SectionLabel>
              <ul className="overflow-hidden rounded-2xl border border-hairline bg-surface">
                {progress.recentSearches.map((r) => (
                  <li key={r} className="border-b border-hairline last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setText(r)}
                      className="flex min-h-12 w-full items-center gap-3 px-4 text-left text-[0.9375rem] text-ink-2 hover:bg-surface-2 hover:text-ink"
                    >
                      <History size={16} strokeWidth={1.9} aria-hidden="true" className="text-ink-3" />
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <SectionLabel>Popular topics</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TOPICS.map((t) => (
              <Chip key={t} onClick={() => setText(t)}>
                {t}
              </Chip>
            ))}
          </div>
          <Link
            to="/learn?view=topics"
            className="mt-6 flex min-h-12 items-center justify-between rounded-2xl border border-hairline bg-surface px-4 text-[0.9375rem] font-medium transition-colors hover:border-line"
          >
            Browse all topics
            <ChevronRight size={18} strokeWidth={2} aria-hidden="true" className="text-ink-3" />
          </Link>
          <p className="mt-4 text-[0.8125rem] text-ink-3">
            Searches lesson text too: try “fan-out”, “write skew” or “idempotency key”.
          </p>
        </div>
      )}

      {hasQuery && result.total === 0 && (
        <div className="mt-8">
          <p className="text-[1.0625rem] font-semibold">No match for “{trimmed}”</p>
          <p className="mt-1 text-[0.9375rem] text-ink-2">
            {result.suggestions.length ? 'Did you mean one of these?' : 'Try a broader word, or one of the popular topics.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(result.suggestions.length ? result.suggestions : POPULAR_TOPICS).map((t) => (
              <Chip key={t} onClick={() => setText(t)}>
                {t}
              </Chip>
            ))}
          </div>
          <Link
            to="/learn?view=topics"
            className="mt-6 inline-flex min-h-11 items-center gap-1 text-[0.9375rem] font-medium text-line hover:underline"
          >
            Browse all topics <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      )}

      {hasQuery && result.total > 0 && (
        <div id="search-results" role="listbox" aria-label="Results">
          {groups.map((g) => {
            const meta = GROUP[g.type]
            return (
              <div key={g.type} role="group" aria-label={meta.title}>
                <SectionLabel>{meta.title}</SectionLabel>
                <div className="overflow-hidden rounded-2xl border border-hairline bg-surface" style={{ boxShadow: 'var(--shadow-card)' }}>
                  {g.hits.map((hit) => {
                    n += 1
                    const i = n
                    const on = i === active
                    const lessonTrack =
                      hit.type === 'lesson' ? getTrack(getModule(hit.id)?.trackId)?.title : undefined
                    return (
                      <div
                        key={hit.id}
                        id={`hit-${i}`}
                        role="option"
                        aria-selected={on}
                        onClick={() => openHit(hit)}
                        onMouseMove={() => setActive(i)}
                        className={`flex min-h-14 cursor-pointer items-start gap-3 border-b border-hairline px-4 py-3 last:border-b-0 ${
                          on ? 'bg-line-soft/60' : 'hover:bg-surface-2/60'
                        }`}
                      >
                        <meta.icon size={17} strokeWidth={1.9} aria-hidden="true" className="mt-0.5 shrink-0 text-line" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.9375rem] leading-snug font-medium">
                            <Highlighted text={hit.title} terms={hit.terms} />
                          </p>
                          {hit.parent && (
                            <p className="mt-0.5 truncate text-[0.75rem] text-ink-3">in {hit.parent}</p>
                          )}
                          <p className="mt-0.5 line-clamp-2 text-[0.8125rem] leading-relaxed text-ink-2">
                            <Highlighted text={hit.context} terms={hit.terms} />
                          </p>
                        </div>
                        {lessonTrack && (
                          <span className="hidden shrink-0 pt-0.5 text-[0.75rem] text-ink-3 sm:block">{lessonTrack}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
                {g.more > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((s) => new Set(s).add(g.type))}
                    className="mt-1 min-h-11 px-1 text-[0.875rem] font-medium text-line hover:underline"
                  >
                    Show {g.more} more
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
