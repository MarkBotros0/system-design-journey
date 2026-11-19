import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BookA, ChevronLeft, ChevronRight, History, LayoutGrid, Search, Timer, Workflow, X } from 'lucide-react'
import { getModule, getTrack } from '../content'
import { patterns } from '../content/patterns'
import { POPULAR_TOPICS, search, searchAll, type Hit, type HitType } from '../lib/search'
import { useProgress } from '../state/ProgressProvider'
import { useGlossary } from '../state/GlossaryProvider'
import { Chip } from '../components/ui/Chip'
import { IconButton } from '../components/ui/Button'
import { Cell, Group } from '../components/ui/List'
import { TrackGlyph } from '../components/ui/TrackIcon'

const GROUP_TITLE: Record<HitType, string> = {
  lesson: 'Lessons',
  section: 'Sections',
  term: 'Terms',
  problem: 'Problems',
  pattern: 'Patterns',
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
          <mark key={i} className="rounded-[4px] bg-surface-3 px-0.5 font-bold text-ink">
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  )
}

/** A neutral tile for results that belong to no single track. */
function IconTile({ icon: Icon }: { icon: typeof BookA }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-surface-3 text-ink-2">
      <Icon size={18} strokeWidth={2} aria-hidden="true" />
    </span>
  )
}

/** The track a hit belongs to, when it belongs to one: a lesson, a section of one, a pattern a lesson teaches. */
function trackOf(hit: Hit): string | undefined {
  if (hit.type === 'lesson') return getModule(hit.id)?.trackId
  if (hit.type === 'section') return getModule(hit.id.split('#')[0])?.trackId
  if (hit.type === 'pattern') {
    const mod = patterns.find((p) => p.id === hit.id)?.moduleId
    return mod ? getModule(mod)?.trackId : undefined
  }
  return undefined
}

function Leading({ hit }: { hit: Hit }) {
  const trackId = trackOf(hit)
  if (trackId) return <TrackGlyph trackId={trackId} size={36} />
  return <IconTile icon={hit.type === 'term' ? BookA : hit.type === 'problem' ? Timer : Workflow} />
}

function Heading({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mt-7 mb-2 flex min-h-11 items-end justify-between gap-3 px-1">
      <h2 className="text-[1.25rem] font-bold">{children}</h2>
      {right}
    </div>
  )
}

/* The row separators of a Group, for the result cards — which are not lists, because the
   results are one listbox the field drives with the arrow keys. */
const SEPARATED =
  "[&>div+div]:relative [&>div+div]:before:pointer-events-none [&>div+div]:before:absolute [&>div+div]:before:top-0 [&>div+div]:before:right-4 [&>div+div]:before:left-[4.25rem] [&>div+div]:before:h-px [&>div+div]:before:bg-hairline [&>div+div]:before:content-['']"

export function SearchScreen() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { progress, pushRecentSearch, clearRecentSearches } = useProgress()
  const { open: openTerm } = useGlossary()

  const [text, setText] = useState(() => params.get('q') ?? '')
  const [query, setQuery] = useState(text)
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState<Set<HitType>>(new Set())
  const [scrolled, setScrolled] = useState(false)
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

  // The bar turns to glass once results slide under it, as the shell's top bars do.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
  // Where each group starts in `flat`, so a row knows its option index without counting during render.
  const starts = useMemo(() => groups.map((_, gi) => groups.slice(0, gi).reduce((a, g) => a + g.hits.length, 0)), [groups])

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

  return (
    <div>
      <header
        className={`sticky top-0 z-30 -mx-4 px-4 pt-safe transition-[background-color,box-shadow] duration-200 lg:-mx-8 lg:px-8 ${
          scrolled ? 'bar-glass shadow-[0_1px_0_var(--hairline)]' : 'bg-paper'
        }`}
      >
        <div className="flex min-h-[4.5rem] items-center gap-2 py-2.5">
          <IconButton label="Close search" onClick={back} className="-ml-1 lg:hidden">
            <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
          </IconButton>
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search size={20} strokeWidth={2.2} aria-hidden="true" className="pointer-events-none absolute left-4 text-ink-2" />
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
              placeholder="Lessons, terms, problems"
              role="combobox"
              aria-expanded={flat.length > 0}
              aria-controls="search-results"
              aria-activedescendant={flat.length ? `hit-${active}` : undefined}
              aria-autocomplete="list"
              aria-label="Search the curriculum"
              className={`min-h-[3.25rem] w-full rounded-[18px] bg-surface-3 pl-12 text-[1.0625rem] font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-3 focus:ring-2 focus:ring-ink/15 [&::-webkit-search-cancel-button]:hidden ${
                text ? 'pr-12' : 'pr-4'
              }`}
            />
            {text && (
              <button
                type="button"
                onClick={() => {
                  setText('')
                  inputRef.current?.focus()
                }}
                aria-label="Clear search"
                className="absolute right-1 flex h-11 w-11 items-center justify-center rounded-full text-ink-2 hover:text-ink"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-3 text-surface-3">
                  <X size={13} strokeWidth={3} aria-hidden="true" />
                </span>
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
            <Group
              className="mt-4"
              title="Recent"
              action={
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="-mr-2 -mb-2 min-h-11 rounded-full px-3 text-[0.9375rem] font-semibold text-ink-2 hover:bg-surface-2 hover:text-ink"
                >
                  Clear
                </button>
              }
            >
              {progress.recentSearches.map((r) => (
                <Cell
                  key={r}
                  onClick={() => setText(r)}
                  leading={<History size={18} strokeWidth={2} aria-hidden="true" className="text-ink-3" />}
                  title={r}
                />
              ))}
            </Group>
          )}

          <Heading>Popular topics</Heading>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TOPICS.map((t) => (
              <Chip key={t} onClick={() => setText(t)}>
                {t}
              </Chip>
            ))}
          </div>
          <p className="mt-3 px-1 text-[0.875rem] text-ink-3">
            Searches lesson text too: try “fan-out”, “write skew” or “idempotency key”.
          </p>

          <Group className="mt-7" title="Browse">
            <Cell to="/learn?view=topics" leading={<IconTile icon={LayoutGrid} />} title="All topics" />
            <Cell to="/glossary" leading={<IconTile icon={BookA} />} title="Glossary" />
            <Cell to="/patterns" leading={<IconTile icon={Workflow} />} title="Patterns cheat sheet" />
          </Group>
        </div>
      )}

      {hasQuery && result.total === 0 && (
        <div className="mt-6 rounded-3xl bg-surface px-5 py-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <p className="text-[1.125rem] font-bold [overflow-wrap:anywhere]">No match for “{trimmed}”</p>
          <p className="mt-1 text-base text-ink-2">
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
            className="mt-4 -ml-1 inline-flex min-h-11 items-center gap-1 rounded-full px-1 text-[0.9375rem] font-semibold text-ink hover:underline"
          >
            Browse all topics <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>
      )}

      {hasQuery && result.total > 0 && (
        <div id="search-results" role="listbox" aria-label="Results">
          {groups.map((g, gi) => {
            const title = GROUP_TITLE[g.type]
            return (
              <div key={g.type} role="group" aria-label={title}>
                <div aria-hidden="true" className="mt-6 mb-2 flex min-h-8 items-end px-1 text-[1.25rem] font-bold">
                  {title}
                </div>
                <div className={`overflow-hidden rounded-[22px] bg-surface ${SEPARATED}`} style={{ boxShadow: 'var(--shadow-card)' }}>
                  {g.hits.map((hit, hi) => {
                    const i = starts[gi] + hi
                    const on = i === active
                    const sub =
                      hit.type === 'lesson'
                        ? getTrack(getModule(hit.id)?.trackId)?.title
                        : hit.parent
                          ? `in ${hit.parent}`
                          : undefined
                    return (
                      <div
                        key={hit.id}
                        id={`hit-${i}`}
                        role="option"
                        aria-selected={on}
                        onClick={() => openHit(hit)}
                        onMouseMove={() => setActive(i)}
                        className={`flex min-h-16 cursor-pointer items-start gap-3 px-4 py-3 transition-colors duration-100 active:bg-surface-2 ${
                          on ? 'bg-surface-2' : ''
                        }`}
                      >
                        <span className="pt-0.5">
                          <Leading hit={hit} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-base leading-snug font-semibold [overflow-wrap:anywhere]">
                            <Highlighted text={hit.title} terms={hit.terms} />
                          </p>
                          {sub && <p className="mt-0.5 truncate text-[0.8125rem] font-semibold text-ink-3">{sub}</p>}
                          <p className="mt-0.5 line-clamp-2 text-[0.875rem] leading-snug text-ink-2">
                            <Highlighted text={hit.context} terms={hit.terms} />
                          </p>
                        </div>
                        <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" className="mt-2 shrink-0 text-ink-3" />
                      </div>
                    )
                  })}
                </div>
                {g.more > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((s) => new Set(s).add(g.type))}
                    className="mt-1 min-h-11 rounded-full px-2 text-[0.9375rem] font-semibold text-ink hover:bg-surface-2"
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
