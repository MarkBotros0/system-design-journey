import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { bank } from '../content/bank'
import { getTrack } from '../content'
import type { QuestionKind } from '../content/types'
import {
  bankStats,
  buildSet,
  isFinished,
  loadSet,
  saveSet,
  setLabel,
  setRequest,
  type BankScope,
} from '../lib/bank'
import { useProgress } from '../state/ProgressProvider'
import { TopBar, PageTitle } from '../components/ui/TopBar'
import { Segmented } from '../components/ui/Segmented'
import { Chip, ChipRow } from '../components/ui/Chip'
import { Skeleton } from '../components/ui/Bits'
import { Button } from '../components/ui/Button'
import { Cell, Group } from '../components/ui/List'
import { SegmentedProgress } from '../components/ui/SegmentedProgress'
import { TrackGlyph, TrackIcon } from '../components/ui/TrackIcon'
import { trackStyle } from '../components/ui/trackStyle'
import { useScrolledPast } from '../components/ui/useScrolledPast'
import { KIND } from '../components/questions/kinds'

const SCOPES: { value: BankScope; label: string }[] = [
  { value: 'all', label: 'All topics' },
  { value: 'studied', label: 'Studied' },
  { value: 'weak', label: 'Weak spots' },
]
const KINDS: QuestionKind[] = ['truefalse', 'single', 'multi', 'match']
const SIZES = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '20', label: '20' },
]

const pct = (x: number | null) => (x === null ? '–' : `${Math.round(x * 100)}%`)

function sessionUrl(scope: BankScope, trackIds: string[], kinds: QuestionKind[], size: string) {
  const q = new URLSearchParams({ scope, size })
  if (trackIds.length) q.set('tracks', trackIds.join(','))
  if (kinds.length) q.set('kinds', kinds.join(','))
  return `/questions/session?${q}`
}

/** A label over one of the builder's controls. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <p className="mb-2 px-1 text-[0.875rem] font-bold text-ink-2">{label}</p>
      {children}
    </div>
  )
}

/** The whole bank: build a set by scope, track, type and size, and see where you stand per track. */
export function QuestionBankScreen() {
  const { progress, ready } = useProgress()
  const navigate = useNavigate()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrolled = useScrolledPast(titleRef)
  const [now] = useState(Date.now)
  const [saved] = useState(loadSet)
  const [scope, setScope] = useState<BankScope>('all')
  const [trackIds, setTrackIds] = useState<string[]>([])
  const [kinds, setKinds] = useState<QuestionKind[]>([])
  const [size, setSize] = useState('10')

  const stats = useMemo(() => bankStats(progress, now), [progress, now])
  const available = useMemo(
    () => buildSet(progress, { size: Infinity, scope, trackIds, kinds, now, rand: () => 0 }).length,
    [progress, scope, trackIds, kinds, now],
  )
  const resumable = saved && !isFinished(saved) ? saved : null
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  /** An explicit new set replaces any set in progress — one at a time keeps "Continue" unambiguous. */
  const go = (url: string) => {
    saveSet(null)
    navigate(url)
  }

  const n = Math.min(Number(size), available)
  const emptyWhy =
    scope === 'weak'
      ? 'No misses here yet. Questions you get wrong collect in Weak spots.'
      : scope === 'studied'
        ? 'Nothing read in these tracks yet. Questions join "Studied" as you read their lessons.'
        : 'No questions match these filters.'

  return (
    <div>
      <TopBar title="Question bank" back={{ label: 'Review', to: '/review', mode: 'history' }} showTitle={scrolled} />
      <PageTitle
        title="Question bank"
        titleRef={titleRef}
        sub={`${bank.length} quick questions across every lesson. Answer a few a day; what you miss comes back sooner.`}
      />

      {!ready ? (
        <Skeleton className="h-72" />
      ) : (
        <div className="flex flex-col gap-8">
          {resumable && <ResumeCard set={resumable} label={setLabel(setRequest(new URLSearchParams(resumable.source === 'daily' ? 'set=daily' : resumable.source), progress))} />}

          <section aria-labelledby="build-h">
            <h2 id="build-h" className="mb-3 flex min-h-11 items-end px-1 text-[1.25rem] font-bold">
              Build a set
            </h2>
            {/* On the page, not in a card: the chip rows bleed to the screen edge, and the
                three-way switch needs the full width to keep "Weak spots" on one line. */}
            <div>
              <Field label="From">
                <Segmented<BankScope> label="Which questions" value={scope} onChange={setScope} options={SCOPES} />
              </Field>

              <Field label="Tracks">
                <ChipRow label="Tracks">
                  <Chip active={trackIds.length === 0} pressed={trackIds.length === 0} onClick={() => setTrackIds([])}>
                    Any
                  </Chip>
                  {stats.byTrack.map((t) => {
                    const on = trackIds.includes(t.trackId)
                    return (
                      <Chip key={t.trackId} active={on} pressed={on} onClick={() => setTrackIds((l) => toggle(l, t.trackId))}>
                        {/* Identity colour on the glyph only, and only while the chip is not inverted. */}
                        <span style={trackStyle(t.trackId)} className={`-ml-1 flex ${on ? '' : 'text-track'}`}>
                          <TrackIcon trackId={t.trackId} size={16} />
                        </span>
                        {getTrack(t.trackId)?.title}
                      </Chip>
                    )
                  })}
                </ChipRow>
              </Field>

              <Field label="Question types">
                <ChipRow label="Question types">
                  <Chip active={kinds.length === 0} pressed={kinds.length === 0} onClick={() => setKinds([])}>
                    Any
                  </Chip>
                  {KINDS.map((k) => {
                    const { short, Icon } = KIND[k]
                    const on = kinds.includes(k)
                    return (
                      <Chip key={k} active={on} pressed={on} onClick={() => setKinds((l) => toggle(l, k))}>
                        <Icon size={16} strokeWidth={2.2} aria-hidden="true" className="-ml-1" />
                        {short}
                      </Chip>
                    )
                  })}
                </ChipRow>
              </Field>

              <Field label="How many">
                <Segmented label="Questions in the set" value={size} onChange={setSize} options={SIZES} />
              </Field>

              <div className="mt-6">
                <Button size="lg" disabled={available === 0} onClick={() => go(sessionUrl(scope, trackIds, kinds, size))}>
                  {available === 0 ? 'Nothing to ask' : `Start ${n} question${n === 1 ? '' : 's'}`}
                  {available > 0 && <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />}
                </Button>
                <p className="mt-2.5 text-center text-[0.875rem] text-ink-2" aria-live="polite">
                  {available === 0 ? emptyWhy : `${available} question${available === 1 ? '' : 's'} match. Due ones come first.`}
                </p>
              </div>
            </div>
          </section>

          <Group
            title="Where you stand"
            footer={
              stats.answered
                ? `${stats.answered} of ${stats.total} answered · ${pct(stats.accuracy)} right on the latest try. Tap a track to practise it.`
                : 'Nothing answered yet. Accuracy per track shows up here. Tap a track to practise it.'
            }
          >
            {stats.byTrack.map((t) => {
              const track = getTrack(t.trackId)
              return (
                <Cell
                  key={t.trackId}
                  onClick={() => go(sessionUrl('all', [t.trackId], [], '10'))}
                  leading={<TrackGlyph trackId={t.trackId} size={36} />}
                  title={
                    <>
                      <span className="sr-only">Practise </span>
                      {track?.title}
                    </>
                  }
                  sub={
                    <span className="tabular">
                      {t.answered ? `${t.answered} of ${t.total} answered` : `${t.total} questions`}
                      {t.due > 0 && ` · ${t.due} due`}
                    </span>
                  }
                  trailing={
                    t.accuracy !== null ? (
                      <span className="text-right leading-tight">
                        <span className="block text-[1.0625rem] font-extrabold text-ink tabular">{pct(t.accuracy)}</span>
                        <span className="block text-[0.8125rem] text-ink-3">right</span>
                      </span>
                    ) : undefined
                  }
                  chevron
                />
              )
            })}
          </Group>
        </div>
      )}
    </div>
  )
}

/** The set in progress, one at a time: how far it got, and the way back in. */
function ResumeCard({ set, label }: { set: NonNullable<ReturnType<typeof loadSet>>; label: string }) {
  const navigate = useNavigate()
  const left = set.ids.length - set.at
  return (
    <section aria-label="Set in progress" className="rounded-[22px] bg-surface p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.875rem] font-bold text-ink-2">Set in progress</p>
          <p className="mt-0.5 truncate text-[1.0625rem] font-bold">{label}</p>
          <p className="text-[0.875rem] text-ink-2 tabular">
            {left} of {set.ids.length} left
          </p>
        </div>
        <Button onClick={() => navigate(`/questions/session?${set.source === 'daily' ? 'set=daily' : set.source}`)}>
          Continue
          <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
        </Button>
      </div>
      <div className="mt-3.5">
        <SegmentedProgress
          total={set.ids.length}
          done={set.at}
          states={set.results.map((r) => (r.correct ? 'correct' : 'wrong'))}
          label={`${set.at} of ${set.ids.length} answered`}
        />
      </div>
    </section>
  )
}
