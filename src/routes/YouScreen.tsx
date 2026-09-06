import { useRef, useState } from 'react'
import { Download, Flame, Upload } from 'lucide-react'
import { allCards, getProblem, modules, totalQuizItems } from '../content'
import { useProgress } from '../state/ProgressProvider'
import { isMastered, isPassed, liveStreak } from '../lib/progress'
import { isLearned } from '../lib/srs'
import { downloadProgress, parseImport } from '../lib/export'
import type { Theme } from '../lib/storage'
import { Button } from '../components/ui/Button'
import { Badge, Panel, ScreenTitle } from '../components/ui/Bits'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface px-4 py-3.5">
      <p className="font-mono text-[0.6875rem] tracking-[0.1em] uppercase text-ink-3">{label}</p>
      <p className="mt-1.5 text-[1.5rem] leading-none font-semibold tabular">{value}</p>
      {sub && <p className="mt-1 text-[0.75rem] text-ink-3">{sub}</p>}
    </div>
  )
}

export function YouScreen() {
  const { progress, theme, setTheme, replaceAll, resetAll } = useProgress()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)

  const passed = modules.filter((m) => isPassed(progress, m.id)).length
  const mastered = modules.filter((m) => isMastered(progress, m)).length
  const learned = allCards.filter((c) => isLearned(progress.cards[c.id])).length
  const attempts = progress.attempts.filter((a) => a.finishedAt)
  const streak = liveStreak(progress.streak)

  const quizRecords = Object.values(progress.quiz)
  const avgQuiz = quizRecords.length
    ? Math.round((quizRecords.reduce((n, q) => n + q.best, 0) / quizRecords.length) * 100)
    : 0

  async function onImportFile(file: File) {
    const text = await file.text()
    const result = parseImport(text)
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.error })
      return
    }
    replaceAll(result.progress)
    setMessage({ kind: 'ok', text: 'Progress restored from that file.' })
  }

  return (
    <div>
      <ScreenTitle
        title="You"
        sub="Everything here lives on this device only."
        right={
          streak > 0 ? (
            <Badge tone="streak">
              <Flame size={12} strokeWidth={2.5} />
              {streak}d
            </Badge>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Stations" value={`${passed}/${modules.length}`} sub={`${mastered} mastered`} />
        <Stat label="Cards" value={`${learned}/${allCards.length}`} sub="learned" />
        <Stat
          label="Quiz average"
          value={quizRecords.length ? `${avgQuiz}%` : '—'}
          sub={`${quizRecords.length}/${modules.length} taken · ${totalQuizItems} questions total`}
        />
        <Stat label="Problems" value={String(attempts.length)} sub="attempts run" />
      </div>

      {attempts.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[1.125rem] font-semibold">Recent attempts</h2>
          <ul className="flex flex-col gap-2">
            {attempts.slice(0, 6).map((a) => {
              const problem = getProblem(a.problemId)
              const hit = Object.values(a.scored).filter(Boolean).length
              const total = problem?.rubric.length ?? 0
              const minutes = a.finishedAt
                ? Math.round((a.finishedAt - a.startedAt) / 60000)
                : 0
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-surface px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[0.9375rem] font-medium">
                      {problem?.title ?? a.problemId}
                    </p>
                    <p className="font-mono text-[0.6875rem] text-ink-3 tabular">
                      {new Date(a.startedAt).toLocaleDateString()} &middot; {minutes} min
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[0.875rem] text-line tabular">
                    {hit}/{total}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-[1.125rem] font-semibold">Appearance</h2>
        <div className="flex gap-2" role="group" aria-label="Theme">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              aria-pressed={theme === t.value}
              className={`min-h-11 flex-1 rounded-xl border text-[0.9375rem] transition-colors duration-150 ${
                theme === t.value
                  ? 'border-line bg-line-soft text-line font-medium'
                  : 'border-hairline bg-surface text-ink-2 hover:border-line'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-1 text-[1.125rem] font-semibold">Backup</h2>
        <p className="mb-3 text-[0.875rem] leading-relaxed text-ink-2">
          Nothing syncs anywhere. Clearing site data or switching phones loses your progress
          unless you export it first.
        </p>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Button
            variant="secondary"
            onClick={() => {
              downloadProgress(progress)
              setMessage({ kind: 'ok', text: 'Export downloaded.' })
            }}
            className="sm:flex-1"
          >
            <Download size={16} strokeWidth={2} />
            Export progress
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()} className="sm:flex-1">
            <Upload size={16} strokeWidth={2} />
            Import a file
          </Button>
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
        </div>

        {message && (
          <p
            role="status"
            className={`mt-3 rounded-xl px-3.5 py-2.5 text-[0.875rem] ${
              message.kind === 'ok'
                ? 'bg-mastered-soft text-mastered'
                : 'bg-alert-soft text-alert'
            }`}
          >
            {message.text}
          </p>
        )}
      </section>

      <section className="mt-8 border-t border-hairline pt-6">
        {!confirmingReset ? (
          <button
            onClick={() => setConfirmingReset(true)}
            className="min-h-11 text-[0.875rem] text-ink-3 hover:text-alert"
          >
            Reset all progress
          </button>
        ) : (
          <Panel className="border-alert/40">
            <p className="text-[0.9375rem] font-semibold">Reset everything?</p>
            <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-2">
              Stations, quiz scores, card schedules and attempts. This cannot be undone — export
              first if you might want it back.
            </p>
            <div className="mt-4 flex gap-2.5">
              <Button
                variant="danger"
                onClick={() => {
                  void resetAll()
                  setConfirmingReset(false)
                  setMessage({ kind: 'ok', text: 'Progress reset.' })
                }}
              >
                Reset everything
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingReset(false)}>
                Keep it
              </Button>
            </div>
          </Panel>
        )}
      </section>
    </div>
  )
}
