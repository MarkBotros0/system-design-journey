import { useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getModule, problems } from '../content'
import { patterns } from '../content/patterns'
import type { Pattern } from '../content/types'
import { plainText } from '../lib/text'
import { Inline } from '../components/content/Inline'
import { TopBar, PageTitle } from '../components/ui/TopBar'
import { Chip, ChipRow } from '../components/ui/Chip'
import { useScrolledPast } from '../components/ui/useScrolledPast'

/** "WhatsApp" → the WhatsApp problem, when there is one. */
function problemFor(name: string) {
  const n = name.toLowerCase()
  return problems.find((p) => plainText(p.title).toLowerCase().includes(n))
}

function PatternCard({ p, targeted }: { p: Pattern; targeted: boolean }) {
  const mod = p.moduleId ? getModule(p.moduleId) : undefined
  return (
    <article
      id={p.id}
      className={`rounded-2xl border bg-surface p-4 transition-colors duration-300 ${targeted ? 'border-line' : 'border-hairline'}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <h3 className="text-[1.0625rem] font-semibold">{p.name}</h3>
      <dl className="mt-2.5 flex flex-col gap-2.5">
        <div>
          <dt className="font-mono text-[0.625rem] tracking-[0.14em] text-ink-3 uppercase">The tell</dt>
          <dd className="mt-0.5 text-[0.9375rem] leading-snug text-ink italic">
            <Inline text={p.tell} />
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[0.625rem] tracking-[0.14em] text-line uppercase">The move</dt>
          <dd className="mt-0.5 text-[0.9375rem] leading-relaxed text-ink-2">
            <Inline text={p.move} />
          </dd>
        </div>
      </dl>
      {p.showsUpIn.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[0.75rem] text-ink-3">Shows up in</span>
          {p.showsUpIn.map((s) => {
            const prob = problemFor(s)
            return prob ? (
              <Link
                key={s}
                to={`/practice/${prob.id}`}
                className="inline-flex min-h-8 items-center rounded-full bg-line-soft px-2.5 text-[0.75rem] font-medium text-line hover:underline"
              >
                {s}
              </Link>
            ) : (
              <span key={s} className="inline-flex min-h-8 items-center rounded-full bg-surface-2 px-2.5 text-[0.75rem] text-ink-2">
                {s}
              </span>
            )
          })}
        </div>
      )}
      {mod && (
        <Link
          to={`/m/${mod.id}`}
          className="mt-3 inline-flex min-h-11 items-center gap-1 text-[0.875rem] font-medium text-line hover:underline"
        >
          Learn it: {plainText(mod.title)} <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
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
        <div className="mb-2">
          <ChipRow label="Jump to section">
            {sections.map((s) => (
              <Chip key={s.id} to={`#${s.id}`}>
                {s.title} · {s.items.length}
              </Chip>
            ))}
          </ChipRow>
        </div>
      )}
      {sections.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="mt-6">
          <h2 id={`${s.id}-h`} className="text-[1.25rem] font-semibold">
            {s.title}
          </h2>
          <p className="mt-0.5 mb-4 text-[0.875rem] text-ink-2">{s.sub}</p>
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
