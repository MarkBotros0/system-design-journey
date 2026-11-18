import { useMemo, useRef, useState } from 'react'
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
import { Meter, Skeleton } from '../components/ui/Bits'
import { Button } from '../components/ui/Button'
import { TrackTile } from '../components/ui/TrackIcon'
import { useScrolledPast } from '../components/ui/useScrolledPast'

const SCOPES: { value: BankScope; label: string }[] = [
  { value: 'all', label: 'All topics' },
  { value: 'studied', label: 'Studied' },
  { value: 'weak', label: 'Weak spots' },
]
const KINDS: { value: QuestionKind; label: string }[] = [
  { value: 'truefalse', label: 'True or false' },
  { value: 'single', label: 'Pick one' },
  { value: 'multi', label: 'Select all' },
  { value: 'match', label: 'Match' },
]
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
        <>
          {resumable && (
            <section aria-label="Set in progress" className="mb-6 flex items-center gap-3 rounded-2xl border border-line/40 bg-line-soft/40 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase">In progress</p>
                <p className="mt-0.5 truncate text-[0.9375rem] font-semibold">
                  {setLabel(setRequest(new URLSearchParams(resumable.source === 'daily' ? 'set=daily' : resumable.source), progress))}
                </p>
                <p className="font-mono text-[0.75rem] text-ink-2 tabular">
                  {resumable.ids.length - resumable.at} of {resumable.ids.length} left
                </p>
              </div>
              <Button
                onClick={() => navigate(`/questions/session?${resumable.source === 'daily' ? 'set=daily' : resumable.source}`)}
              >
                Continue
              </Button>
            </section>
          )}

          <section aria-labelledby="build-h" className="rounded-2xl border border-hairline bg-surface p-4">
            <h2 id="build-h" className="text-[1.125rem] font-semibold">
              Build a set
            </h2>

            <p className="mt-4 mb-2 text-[0.8125rem] font-medium text-ink-2">From</p>
            <Segmented<BankScope> label="Which questions" value={scope} onChange={setScope} options={SCOPES} />

            <p className="mt-5 mb-1 text-[0.8125rem] font-medium text-ink-2">Tracks</p>
            <ChipRow label="Tracks">
              <Chip active={trackIds.length === 0} pressed={trackIds.length === 0} onClick={() => setTrackIds([])}>
                Any
              </Chip>
              {stats.byTrack.map((t) => (
                <Chip key={t.trackId} active={trackIds.includes(t.trackId)} pressed={trackIds.includes(t.trackId)} onClick={() => setTrackIds((l) => toggle(l, t.trackId))}>
                  {getTrack(t.trackId)?.title}
                </Chip>
              ))}
            </ChipRow>

            <p className="mt-4 mb-1 text-[0.8125rem] font-medium text-ink-2">Question types</p>
            <ChipRow label="Question types">
              <Chip active={kinds.length === 0} pressed={kinds.length === 0} onClick={() => setKinds([])}>
                Any
              </Chip>
              {KINDS.map((k) => (
                <Chip key={k.value} active={kinds.includes(k.value)} pressed={kinds.includes(k.value)} onClick={() => setKinds((l) => toggle(l, k.value))}>
                  {k.label}
                </Chip>
              ))}
            </ChipRow>

            <p className="mt-4 mb-2 text-[0.8125rem] font-medium text-ink-2">How many</p>
            <div className="max-w-xs">
              <Segmented label="Questions in the set" value={size} onChange={setSize} options={SIZES} />
            </div>

            <div className="mt-5">
              <Button size="lg" disabled={available === 0} onClick={() => go(sessionUrl(scope, trackIds, kinds, size))}>
                {available === 0 ? 'Nothing to ask' : `Start ${n} question${n === 1 ? '' : 's'}`}
                {available > 0 && <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />}
              </Button>
              <p className="mt-2 text-[0.8125rem] text-ink-3" aria-live="polite">
                {available === 0 ? emptyWhy : `${available} question${available === 1 ? '' : 's'} match. Due ones come first.`}
              </p>
            </div>
          </section>

          <section aria-labelledby="standing-h" className="mt-8">
            <h2 id="standing-h" className="text-[1.125rem] font-semibold">
              Where you stand
            </h2>
            <p className="mt-1 mb-3 text-[0.8125rem] text-ink-2">
              {stats.answered
                ? `${stats.answered} of ${stats.total} answered · ${pct(stats.accuracy)} right on the latest try`
                : 'Nothing answered yet. Accuracy per track shows up here.'}
            </p>
            <ul className="overflow-hidden rounded-2xl border border-hairline bg-surface">
              {stats.byTrack.map((t) => {
                const track = getTrack(t.trackId)
                return (
                  <li key={t.trackId} className="flex min-h-16 items-center gap-3 border-b border-hairline px-4 py-3 last:border-b-0">
                    <TrackTile trackId={t.trackId} code={track?.code} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.9375rem] font-medium">{track?.title}</p>
                      <p className="font-mono text-[0.6875rem] text-ink-3 tabular">
                        {t.answered
                          ? `${t.answered}/${t.total} answered · ${pct(t.accuracy)} right${t.due ? ` · ${t.due} due` : ''}`
                          : `${t.total} questions`}
                      </p>
                      {t.answered > 0 && (
                        <div className="mt-1.5">
                          <Meter value={t.accuracy ?? 0} label={`${track?.title} accuracy`} />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => go(sessionUrl('all', [t.trackId], [], '10'))}
                      className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-hairline px-3 text-[0.8125rem] font-medium hover:border-line"
                      aria-label={`Practise ${track?.title}`}
                    >
                      {t.answered ? 'Practise' : 'Start'}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
