import { useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, ChevronRight, Timer, Workflow } from 'lucide-react'
import { getModule, getTrack, problems } from '../content'
import { patterns } from '../content/patterns'
import type { Pattern } from '../content/types'
import { plainText } from '../lib/text'
import { Inline } from '../components/content/Inline'
import { TopBar, PageTitle } from '../components/ui/TopBar'
import { Chip, ChipRow } from '../components/ui/Chip'
import { TrackGlyph } from '../components/ui/TrackIcon'
import { trackStyle } from '../components/ui/trackStyle'
import { useScrolledPast } from '../components/ui/useScrolledPast'

/** "WhatsApp" → the WhatsApp problem, when there is one. */
function problemFor(name: string) {
  const n = name.toLowerCase()
  return problems.find((p) => plainText(p.title).toLowerCase().includes(n))
}

function PatternCard({ p, targeted }: { p: Pattern; targeted: boolean }) {
  const mod = p.moduleId ? getModule(p.moduleId) : undefined
  const track = getTrack(mod?.trackId)
  return (
    <article
      id={p.id}
      style={{ ...trackStyle(track?.id), boxShadow: 'var(--shadow-card)' }}
      // The ring marks the card a search result or a link sent you to.
      className={`rounded-[24px] bg-surface p-5 transition-shadow duration-300 ${targeted ? 'ring-2 ring-line' : ''}`}
    >
      <header className="flex items-center gap-3">
        {track ? (
          <TrackGlyph trackId={track.id} size={44} />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-surface-3 text-ink-2">
            <Workflow size={21} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-[1.125rem] leading-snug font-bold">{p.name}</h3>
          {track && <p className="mt-0.5 text-[0.875rem] font-bold text-track">{track.title}</p>}
        </div>
      </header>

      <dl className="mt-4 flex flex-col gap-3">
        <div className="rounded-[18px] bg-surface-2 px-4 py-3">
          <dt className="text-[0.875rem] font-bold text-ink-2">The tell</dt>
          <dd className="mt-1 text-base leading-snug font-medium text-ink">
            <Inline text={p.tell} />
          </dd>
        </div>
        <div className="px-1">
          <dt className="text-[0.875rem] font-bold text-track">The move</dt>
          <dd className="mt-1 text-base leading-relaxed text-ink-2">
            <Inline text={p.move} />
          </dd>
        </div>
      </dl>

      {p.showsUpIn.length > 0 && (
        <div className="mt-4 px-1">
          <p className="text-[0.875rem] font-bold text-ink-2">Shows up in</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {p.showsUpIn.map((s) => {
              const prob = problemFor(s)
              return (
                <li key={s}>
                  {prob ? (
                    <Link
                      to={`/practice/${prob.id}`}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-surface-3 pr-4 pl-3 text-[0.9375rem] font-semibold text-ink transition-[background-color,transform] duration-150 hover:bg-hairline active:scale-[0.97] motion-reduce:active:scale-100"
                    >
                      <Timer size={16} strokeWidth={2.2} aria-hidden="true" className="text-ink-2" />
                      {s}
                    </Link>
                  ) : (
                    <span className="inline-flex min-h-11 items-center rounded-full bg-surface-2 px-4 text-[0.9375rem] text-ink-2">
                      {s}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {mod && (
        <Link
          to={`/m/${mod.id}`}
          className="mt-4 flex min-h-14 items-center gap-3 rounded-[18px] bg-surface-2 px-4 py-2.5 transition-colors duration-150 hover:bg-surface-3"
        >
          <BookOpen size={18} strokeWidth={2.2} aria-hidden="true" className="shrink-0 text-track" />
          <span className="min-w-0 flex-1">
            <span className="block text-[0.8125rem] font-semibold text-ink-3">Learn it</span>
            <span className="block text-[0.9375rem] leading-snug font-semibold">{plainText(mod.title)}</span>
          </span>
          <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" className="shrink-0 text-ink-3" />
        </Link>
      )}
    </article>
  )
}

const SECTIONS = [
  { id: 'system-patterns', family: 'system' as const, title: 'System patterns', sub: 'The shapes most design questions are made of. Spot the tell in the prompt, reach for the move.' },
  { id: 'object-patterns', family: 'object' as const, title: 'Object patterns', sub: 'The design patterns that come up in object-oriented and low-level design rounds.' },
]

export function PatternsScreen() {
  const { hash } = useLocation()
  const target = decodeURIComponent(hash.slice(1))
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrolled = useScrolledPast(titleRef)
  const sections = SECTIONS.map((s) => ({ ...s, items: patterns.filter((p) => p.family === s.family) })).filter((s) => s.items.length)

  return (
    <div>
      <TopBar title="Patterns" showTitle={scrolled} back={{ label: 'Back', to: '/learn?view=topics' }} />
      <PageTitle title="Patterns cheat sheet" titleRef={titleRef} sub="Recognise the question, recall the answer." />
      {sections.length > 1 && (
        <ChipRow label="Jump to section">
          {sections.map((s) => (
            <Chip key={s.id} to={`#${s.id}`}>
              {s.title} <span className="tabular text-ink-3">{s.items.length}</span>
            </Chip>
          ))}
        </ChipRow>
      )}
      {sections.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="mt-8">
          <h2 id={`${s.id}-h`} className="px-1 text-[1.375rem] font-extrabold tracking-[-0.02em]">
            {s.title}
          </h2>
          <p className="mt-1 mb-4 px-1 text-base text-ink-2">{s.sub}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {s.items.map((p) => (
              <PatternCard key={p.id} p={p} targeted={p.id === target} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
