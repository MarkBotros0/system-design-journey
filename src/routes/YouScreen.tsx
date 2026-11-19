import { useRef, useState, type ReactNode } from 'react'
import {
  BadgeCheck,
  BookOpen,
  Bookmark,
  CircleCheckBig,
  Download,
  Flame,
  Layers,
  Route as RouteIcon,
  Share,
  Smartphone,
  SquarePlus,
  Timer,
  Trash2,
  Upload,
} from 'lucide-react'
import { useInstallMode } from '../components/pwa/usePwa'
import { promptInstall } from '../lib/installPrompt'
import {
  allCards,
  getModule,
  getProblem,
  getRoute,
  getTrack,
  modules,
  modulesOfTrack,
  populatedTracks,
  stopTitle,
  totalQuizItems,
} from '../content'
import { useProgress } from '../state/ProgressProvider'
import { isMastered, isPassed, liveStreak } from '../lib/progress'
import { isLearned } from '../lib/srs'
import { attemptCoverage, readiness } from '../lib/readiness'
import { downloadProgress } from '../lib/download'
import { parseImport } from '../lib/export'
import { plainText } from '../lib/text'
import { DAILY_GOALS, type DailyGoal, type Theme } from '../lib/storage'
import { finishedAttempts } from '../lib/attempts'
import { Button } from '../components/ui/Button'
import { TopBar, PageTitle } from '../components/ui/TopBar'
import { Segmented } from '../components/ui/Segmented'
import { ProgressRing } from '../components/ui/ProgressRing'
import { Cell, Group } from '../components/ui/List'
import { TrackGlyph } from '../components/ui/TrackIcon'
import { trackStyle } from '../components/ui/trackStyle'
import { useScrolledPast } from '../components/ui/useScrolledPast'
import { OnboardingSheet } from '../components/onboarding/OnboardingSheet'
import { ReadinessCard } from '../components/you/ReadinessCard'
import { StatusNote, type StatusMessage } from '../components/you/StatusNote'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

/** A settings-row icon on a neutral tile; `tone` only for the destructive row. */
function Tile({ icon: Icon, danger }: { icon: typeof BookOpen; danger?: boolean }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ${
        danger ? 'bg-alert-soft text-alert' : 'bg-surface-3 text-ink-2'
      }`}
    >
      <Icon size={18} strokeWidth={2} aria-hidden="true" />
    </span>
  )
}

function Value({ children }: { children: ReactNode }) {
  return <span className="text-[1.0625rem] font-bold text-ink tabular">{children}</span>
}

export function YouScreen() {
  const { progress, theme, setTheme, replaceAll, resetAll, setDailyGoal } = useProgress()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<StatusMessage | null>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const installMode = useInstallMode()
  const [routeSheet, setRouteSheet] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrolled = useScrolledPast(titleRef)
  const rounds = readiness(progress)
  const route = getRoute(progress.routeId)
  const start = progress.startStop
  const startTitle = start
    ? plainText(stopTitle(start.startsWith('m:') ? { module: start.slice(2) } : { problem: start.slice(2) }))
    : undefined
  const bookmarks = progress.bookmarks.map((id) => getModule(id)).filter((m) => !!m)

  const passed = modules.filter((m) => isPassed(progress, m.id)).length
  const mastered = modules.filter((m) => isMastered(progress, m)).length
  const learned = allCards.filter((c) => isLearned(progress.cards[c.id])).length
  const attempts = finishedAttempts(progress)
  const streak = liveStreak(progress.streak)

  const quizRecords = Object.values(progress.quiz)
  const avgQuiz = quizRecords.length
    ? Math.round((quizRecords.reduce((n, q) => n + q.best, 0) / quizRecords.length) * 100)
    : 0

  async function onImportFile(file: File) {
    const text = await file.text()
    const result = parseImport(text)
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.error, at: 'data' })
      return
    }
    replaceAll(result.progress)
    setMessage({ kind: 'ok', text: 'Progress restored from that file.', at: 'data' })
  }

  return (
    <div>
      <TopBar
        title="You"
        showTitle={scrolled}
        right={
          streak > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-streak-soft px-3 py-1.5 text-[0.9375rem] font-bold whitespace-nowrap text-streak tabular">
              <Flame size={16} strokeWidth={2.4} aria-hidden="true" />
              {streak} {streak === 1 ? 'day' : 'days'}
              <span className="sr-only"> streak</span>
            </span>
          ) : undefined
        }
      />
      <PageTitle
        title="You"
        titleRef={titleRef}
        sub="Your readiness, your progress, your settings. Everything lives on this device only."
      />

      <div className="flex flex-col gap-8">
        <ReadinessCard rounds={rounds} />

        <Group title="Progress">
          <Cell
            leading={<Tile icon={BookOpen} />}
            title="Lessons passed"
            sub={
              mastered > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <BadgeCheck size={15} strokeWidth={2.4} aria-hidden="true" className="text-mastered" />
                  {mastered} mastered
                </span>
              ) : (
                'None mastered yet'
              )
            }
            trailing={
              <Value>
                {passed}/{modules.length}
              </Value>
            }
          />
          <Cell
            leading={<Tile icon={Layers} />}
            title="Cards learned"
            sub="Three spaced repetitions each"
            trailing={
              <Value>
                {learned}/{allCards.length}
              </Value>
            }
          />
          <Cell
            leading={<Tile icon={CircleCheckBig} />}
            title="Quiz average"
            sub={`${quizRecords.length}/${modules.length} taken · ${totalQuizItems} questions total`}
            trailing={<Value>{quizRecords.length ? `${avgQuiz}%` : '—'}</Value>}
          />
          <Cell leading={<Tile icon={Timer} />} title="Problems" sub="Attempts run" trailing={<Value>{attempts.length}</Value>} />
        </Group>

        <Group title="Tracks">
          {populatedTracks.map((t) => {
            const mods = modulesOfTrack(t.id)
            const done = mods.filter((m) => isPassed(progress, m.id)).length
            return (
              <Cell
                key={t.id}
                to={`/learn/${t.id}`}
                leading={<TrackGlyph trackId={t.id} size={36} />}
                title={t.title}
                sub={`${done} of ${mods.length} passed`}
                trailing={
                  <span style={trackStyle(t.id)} className="flex">
                    <ProgressRing value={mods.length ? done / mods.length : 0} size={28} label={`${t.title} progress`} tone="track" />
                  </span>
                }
              />
            )
          })}
        </Group>

        <Group title="Bookmarks">
          {bookmarks.length === 0 ? (
            <Cell leading={<Tile icon={Bookmark} />} title="No bookmarks yet" sub="Tap the bookmark on any lesson to keep it here." />
          ) : (
            bookmarks.map((m) => (
              <Cell
                key={m!.id}
                to={`/m/${m!.id}`}
                leading={<TrackGlyph trackId={m!.trackId} size={36} />}
                title={plainText(m!.title)}
                sub={`${getTrack(m!.trackId)?.title} · ${m!.minutes} min`}
              />
            ))
          )}
        </Group>

        {attempts.length > 0 && (
          <Group title="Recent attempts">
            {attempts.slice(0, 6).map((a) => {
              const problem = getProblem(a.problemId)
              const pct = problem ? Math.round(attemptCoverage(problem, a) * 100) : 0
              const minutes = a.finishedAt ? Math.round((a.finishedAt - a.startedAt) / 60000) : 0
              return (
                <Cell
                  key={a.id}
                  to={`/practice/${a.problemId}/walkthrough`}
                  leading={<Tile icon={Timer} />}
                  title={problem ? plainText(problem.title) : a.problemId}
                  sub={`${new Date(a.startedAt).toLocaleDateString()} · ${minutes} min`}
                  trailing={<Value>{pct}%</Value>}
                />
              )
            })}
          </Group>
        )}

        <Group title="Study">
          <Cell
            onClick={() => setRouteSheet(true)}
            leading={<Tile icon={RouteIcon} />}
            title={route.title}
            sub={startTitle ? `Starting from ${startTitle}` : 'From the beginning'}
            trailing={<span className="font-semibold text-ink">Change</span>}
          />
          <li className="px-4 pt-3 pb-4">
            <p className="text-base font-semibold">Daily questions</p>
            <p className="mt-0.5 mb-3 text-[0.875rem] text-ink-2">
              How many quick questions a day you aim for. Ten takes about two minutes.
            </p>
            <Segmented<string>
              label="Daily goal"
              value={String(progress.dailyGoal)}
              onChange={(v) => setDailyGoal(Number(v) as DailyGoal)}
              options={DAILY_GOALS.map((g) => ({ value: String(g), label: `${g} a day` }))}
            />
          </li>
        </Group>

        <Group title="Appearance">
          <li className="p-3">
            <Segmented<Theme> label="Theme" value={theme} onChange={setTheme} options={THEMES} />
          </li>
        </Group>

        {installMode !== 'none' && (
          <section>
            <Group
              title="Install app"
              footer="On your home screen it opens full screen and works with no connection — the whole curriculum is already on your device."
            >
              {installMode === 'button' ? (
                <Cell
                  onClick={async () => {
                    const accepted = await promptInstall()
                    if (accepted) setMessage({ kind: 'ok', text: 'Installed. Open it from your home screen.', at: 'install' })
                  }}
                  leading={<Tile icon={Smartphone} />}
                  title="Add to home screen"
                  chevron
                />
              ) : (
                <li className="px-4 py-4">
                  <p className="flex items-center gap-2.5 text-base font-semibold">
                    <Tile icon={Smartphone} />
                    On iPhone, Safari does this by hand
                  </p>
                  <ol className="mt-3 flex flex-col gap-2.5 text-[0.9375rem] text-ink-2">
                    <Step n={1}>
                      Tap <Share size={16} strokeWidth={2.2} aria-hidden="true" className="mx-0.5 inline -translate-y-px text-ink" /> Share in
                      Safari&rsquo;s toolbar.
                    </Step>
                    <Step n={2}>
                      Scroll down and choose{' '}
                      <span className="font-semibold text-ink">
                        <SquarePlus size={16} strokeWidth={2.2} aria-hidden="true" className="mr-0.5 inline -translate-y-px" />
                        Add to Home Screen
                      </span>
                      .
                    </Step>
                    <Step n={3}>Open Throughput from the icon rather than the browser.</Step>
                  </ol>
                </li>
              )}
            </Group>
            <StatusNote message={message} at="install" />
          </section>
        )}

        <section>
          <Group
            title="Backup"
            footer="Nothing syncs anywhere. Clearing site data or switching phones loses your progress unless you export it first."
          >
            <Cell
              onClick={() => {
                downloadProgress(progress)
                setMessage({ kind: 'ok', text: 'Export downloaded.', at: 'data' })
              }}
              leading={<Tile icon={Download} />}
              title="Export progress"
              sub="A file you can keep or move to another device"
            />
            <Cell onClick={() => fileRef.current?.click()} leading={<Tile icon={Upload} />} title="Import a file" sub="Replaces what is on this device" />
          </Group>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onImportFile(file)
              e.target.value = ''
            }}
          />
          <StatusNote message={message} at="data" />
        </section>

        <section>
          {!confirmingReset ? (
            <Group>
              <Cell
                onClick={() => setConfirmingReset(true)}
                leading={<Tile icon={Trash2} danger />}
                title={<span className="text-alert">Reset all progress</span>}
              />
            </Group>
          ) : (
            <div className="rounded-[22px] bg-surface p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
              <p className="flex items-center gap-2.5 text-[1.0625rem] font-bold">
                <Tile icon={Trash2} danger />
                Reset everything?
              </p>
              <p className="mt-2 text-base leading-relaxed text-ink-2">
                Stations, quiz scores, card schedules and attempts. This cannot be undone — export first if you might want
                it back.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button
                  variant="danger"
                  onClick={() => {
                    void resetAll()
                    setConfirmingReset(false)
                    setMessage({ kind: 'ok', text: 'Progress reset.', at: 'reset' })
                  }}
                >
                  Reset everything
                </Button>
                <Button variant="secondary" autoFocus onClick={() => setConfirmingReset(false)}>
                  Keep it
                </Button>
              </div>
            </div>
          )}
          <StatusNote message={message} at="reset" />
        </section>
      </div>

      {routeSheet && <OnboardingSheet open mode="edit" onClose={() => setRouteSheet(false)} />}
    </div>
  )
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[0.8125rem] font-bold text-ink tabular">
        {n}
      </span>
      <span className="min-w-0 pt-0.5">{children}</span>
    </li>
  )
}
