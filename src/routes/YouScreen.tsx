import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  ChevronRight,
  Download,
  Flame,
  Route as RouteIcon,
  Share,
  Smartphone,
  Upload,
} from "lucide-react";
import { useInstallMode } from "../components/pwa/usePwa";
import { promptInstall } from "../lib/installPrompt";
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
} from "../content";
import { useProgress } from "../state/ProgressProvider";
import { isMastered, isPassed, liveStreak } from "../lib/progress";
import { isLearned } from "../lib/srs";
import { attemptCoverage, readiness } from "../lib/readiness";
import { downloadProgress, parseImport } from "../lib/export";
import { plainText } from "../lib/text";
import { DAILY_GOALS, type DailyGoal, type Theme } from "../lib/storage";
import { finishedAttempts } from "../lib/attempts";
import { Button } from "../components/ui/Button";
import { Badge, Meter, Panel } from "../components/ui/Bits";
import { TopBar, PageTitle } from "../components/ui/TopBar";
import { Segmented } from "../components/ui/Segmented";
import { ProgressRing } from "../components/ui/ProgressRing";
import { useScrolledPast } from "../components/ui/useScrolledPast";
import { OnboardingSheet } from "../components/onboarding/OnboardingSheet";

const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface px-4 py-3.5">
      <p className="font-mono text-[0.6875rem] tracking-[0.1em] uppercase text-ink-3">
        {label}
      </p>
      <p className="mt-1.5 text-[1.5rem] leading-none font-semibold tabular">
        {value}
      </p>
      {sub && <p className="mt-1 text-[0.75rem] text-ink-3">{sub}</p>}
    </div>
  );
}

export function YouScreen() {
  const { progress, theme, setTheme, replaceAll, resetAll, setDailyGoal } = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const installMode = useInstallMode();
  const [routeSheet, setRouteSheet] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const scrolled = useScrolledPast(titleRef);
  const rounds = readiness(progress);
  const route = getRoute(progress.routeId);
  const start = progress.startStop;
  const startTitle = start
    ? plainText(
        stopTitle(
          start.startsWith("m:")
            ? { module: start.slice(2) }
            : { problem: start.slice(2) },
        ),
      )
    : undefined;
  const bookmarks = progress.bookmarks
    .map((id) => getModule(id))
    .filter((m) => !!m);

  const passed = modules.filter((m) => isPassed(progress, m.id)).length;
  const mastered = modules.filter((m) => isMastered(progress, m)).length;
  const learned = allCards.filter((c) =>
    isLearned(progress.cards[c.id]),
  ).length;
  const attempts = finishedAttempts(progress);
  const streak = liveStreak(progress.streak);

  const quizRecords = Object.values(progress.quiz);
  const avgQuiz = quizRecords.length
    ? Math.round(
        (quizRecords.reduce((n, q) => n + q.best, 0) / quizRecords.length) *
          100,
      )
    : 0;

  async function onImportFile(file: File) {
    const text = await file.text();
    const result = parseImport(text);
    if (!result.ok) {
      setMessage({ kind: "error", text: result.error });
      return;
    }
    replaceAll(result.progress);
    setMessage({ kind: "ok", text: "Progress restored from that file." });
  }

  return (
    <div>
      <TopBar
        title="You"
        showTitle={scrolled}
        right={
          streak > 0 ? (
            <Badge tone="streak">
              <Flame size={12} strokeWidth={2.5} aria-hidden="true" />
              {streak}d
            </Badge>
          ) : undefined
        }
      />
      <PageTitle
        title="You"
        titleRef={titleRef}
        sub="Your readiness, your progress, your settings. Everything lives on this device only."
      />

      <section aria-labelledby="ready-h">
        <h2 id="ready-h" className="mb-3 text-[1.125rem] font-semibold">
          Interview readiness
        </h2>
        <ul className="flex flex-col gap-3">
          {rounds.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-hairline bg-surface p-4"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="text-[1rem] font-semibold">{r.title}</span>
                <span className="font-mono text-[0.9375rem] text-ink tabular">
                  {Math.round(r.score * 100)}%
                </span>
              </div>
              <Meter
                value={r.score}
                tone={r.score >= 0.999 ? "mastered" : "line"}
                label={`${r.title} readiness`}
              />
              <p className="mt-2 font-mono text-[0.6875rem] text-ink-3 tabular">
                Lessons {r.lessonsDone}/{r.lessonsTotal}
                {r.problemsCredit !== undefined &&
                  ` · problems ${r.problemsAttempted} tried, ${Math.round(r.problemsCredit * 100)}% credit`}
              </p>
              {r.next && (
                <Link
                  to={
                    "module" in r.next
                      ? `/m/${r.next.module}`
                      : `/practice/${r.next.problem}`
                  }
                  className="mt-3 flex min-h-11 items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2 text-[0.875rem] hover:bg-line-soft"
                >
                  <span className="min-w-0 truncate">
                    <span className="text-ink-3">Next: </span>
                    <span className="font-medium">
                      {plainText(stopTitle(r.next))}
                    </span>
                  </span>
                  <ArrowRight
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="shrink-0 text-line"
                  />
                </Link>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[0.75rem] text-ink-3">
          Half lessons passed on that round&rsquo;s route, half your best rubric
          coverage on its problems. The interview round is lessons only.
        </p>
      </section>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Stat
          label="Lessons"
          value={`${passed}/${modules.length}`}
          sub={`${mastered} mastered`}
        />
        <Stat
          label="Cards"
          value={`${learned}/${allCards.length}`}
          sub="learned"
        />
        <Stat
          label="Quiz average"
          value={quizRecords.length ? `${avgQuiz}%` : "—"}
          sub={`${quizRecords.length}/${modules.length} taken · ${totalQuizItems} questions total`}
        />
        <Stat
          label="Problems"
          value={String(attempts.length)}
          sub="attempts run"
        />
      </div>

      <section aria-labelledby="tracks-h" className="mt-8">
        <h2 id="tracks-h" className="mb-3 text-[1.125rem] font-semibold">
          Tracks
        </h2>
        <ul className="overflow-hidden rounded-2xl border border-hairline bg-surface">
          {populatedTracks.map((t) => {
            const mods = modulesOfTrack(t.id);
            const done = mods.filter((m) => isPassed(progress, m.id)).length;
            return (
              <li
                key={t.id}
                className="border-b border-hairline last:border-b-0"
              >
                <Link
                  to={`/learn/${t.id}`}
                  className="flex min-h-14 items-center gap-3 px-4 py-2.5 hover:bg-surface-2/60"
                >
                  <ProgressRing
                    value={mods.length ? done / mods.length : 0}
                    size={28}
                    label={`${t.title} progress`}
                    tone={done === mods.length ? "mastered" : "line"}
                  />
                  <span className="min-w-0 flex-1 truncate text-[0.9375rem]">
                    {t.title}
                  </span>
                  <span className="font-mono text-[0.75rem] text-ink-3 tabular">
                    {done}/{mods.length}
                  </span>
                  <ChevronRight
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="text-ink-3"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="bm-h" className="mt-8">
        <h2 id="bm-h" className="mb-3 text-[1.125rem] font-semibold">
          Bookmarks
        </h2>
        {bookmarks.length === 0 ? (
          <p className="flex items-center gap-2 rounded-2xl border border-dashed border-hairline px-4 py-4 text-[0.875rem] text-ink-2">
            <Bookmark
              size={16}
              strokeWidth={2}
              aria-hidden="true"
              className="shrink-0 text-ink-3"
            />
            Tap the bookmark on any lesson to keep it here.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-hairline bg-surface">
            {bookmarks.map((m) => (
              <li
                key={m!.id}
                className="border-b border-hairline last:border-b-0"
              >
                <Link
                  to={`/m/${m!.id}`}
                  className="flex min-h-14 items-center gap-3 px-4 py-2.5 hover:bg-surface-2/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9375rem] font-medium">
                      {plainText(m!.title)}
                    </span>
                    <span className="block text-[0.75rem] text-ink-3">
                      {getTrack(m!.trackId)?.title} · {m!.minutes} min
                    </span>
                  </span>
                  <ChevronRight
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="text-ink-3"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {attempts.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[1.125rem] font-semibold">
            Recent attempts
          </h2>
          <ul className="flex flex-col gap-2">
            {attempts.slice(0, 6).map((a) => {
              const problem = getProblem(a.problemId);
              const pct = problem
                ? Math.round(attemptCoverage(problem, a) * 100)
                : 0;
              const minutes = a.finishedAt
                ? Math.round((a.finishedAt - a.startedAt) / 60000)
                : 0;
              return (
                <li key={a.id}>
                  <Link
                    to={`/practice/${a.problemId}/walkthrough`}
                    className="flex min-h-14 items-center justify-between gap-4 rounded-xl border border-hairline bg-surface px-4 py-3 hover:border-line"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[0.9375rem] font-medium">
                        {problem ? plainText(problem.title) : a.problemId}
                      </p>
                      <p className="font-mono text-[0.6875rem] text-ink-3 tabular">
                        {new Date(a.startedAt).toLocaleDateString()} &middot;{" "}
                        {minutes} min
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[0.875rem] text-line tabular">
                      {pct}%
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {installMode !== "none" && (
        <section className="mt-8">
          <h2 className="mb-1 text-[1.125rem] font-semibold">Install</h2>
          <p className="mb-3 text-[0.875rem] leading-relaxed text-ink-2">
            Add Throughput to your home screen and it opens full screen and
            works with no connection — the whole curriculum is already on your
            device.
          </p>

          {installMode === "button" ? (
            <Button
              variant="secondary"
              onClick={async () => {
                const accepted = await promptInstall();
                if (accepted)
                  setMessage({
                    kind: "ok",
                    text: "Installed. Open it from your home screen.",
                  });
              }}
            >
              <Smartphone size={16} strokeWidth={2} />
              Add to home screen
            </Button>
          ) : (
            <Panel>
              <p className="flex items-center gap-2 text-[0.875rem] font-medium">
                <Share size={15} strokeWidth={2} className="text-line" />
                On iPhone, Safari does this by hand
              </p>
              <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-[0.875rem] text-ink-2">
                <li>Tap the Share button in Safari&rsquo;s toolbar.</li>
                <li>
                  Scroll down and choose &ldquo;Add to Home Screen&rdquo;.
                </li>
                <li>Open Throughput from the icon rather than the browser.</li>
              </ol>
            </Panel>
          )}
        </section>
      )}

      <section aria-labelledby="route-h" className="mt-8">
        <h2 id="route-h" className="mb-3 text-[1.125rem] font-semibold">
          Route and starting point
        </h2>
        <button
          type="button"
          onClick={() => setRouteSheet(true)}
          className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-hairline bg-surface px-4 py-3 text-left hover:border-line"
        >
          <RouteIcon
            size={18}
            strokeWidth={1.9}
            aria-hidden="true"
            className="shrink-0 text-line"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-medium">
              {route.title}
            </span>
            <span className="block truncate text-[0.8125rem] text-ink-3">
              {startTitle
                ? `Starting from ${startTitle}`
                : "From the beginning"}
            </span>
          </span>
          <span className="text-[0.875rem] font-medium text-line">Change</span>
        </button>
      </section>

      <section className="mt-8">
        <h2 className="mb-1 text-[1.125rem] font-semibold">Daily questions</h2>
        <p className="mb-3 text-[0.875rem] text-ink-2">
          How many quick questions a day you aim for. Ten takes about two minutes.
        </p>
        <div className="max-w-sm">
          <Segmented<string>
            label="Daily goal"
            value={String(progress.dailyGoal)}
            onChange={(v) => setDailyGoal(Number(v) as DailyGoal)}
            options={DAILY_GOALS.map((g) => ({ value: String(g), label: `${g} a day` }))}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[1.125rem] font-semibold">Appearance</h2>
        <div className="max-w-sm">
          <Segmented<Theme>
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={THEMES}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-1 text-[1.125rem] font-semibold">Backup</h2>
        <p className="mb-3 text-[0.875rem] leading-relaxed text-ink-2">
          Nothing syncs anywhere. Clearing site data or switching phones loses
          your progress unless you export it first.
        </p>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Button
            variant="secondary"
            onClick={() => {
              downloadProgress(progress);
              setMessage({ kind: "ok", text: "Export downloaded." });
            }}
            className="sm:flex-1"
          >
            <Download size={16} strokeWidth={2} />
            Export progress
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            className="sm:flex-1"
          >
            <Upload size={16} strokeWidth={2} />
            Import a file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onImportFile(file);
              e.target.value = "";
            }}
          />
        </div>

        {message && (
          <p
            role="status"
            className={`mt-3 rounded-xl px-3.5 py-2.5 text-[0.875rem] ${
              message.kind === "ok"
                ? "bg-mastered-soft text-mastered"
                : "bg-alert-soft text-alert"
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
              Stations, quiz scores, card schedules and attempts. This cannot be
              undone — export first if you might want it back.
            </p>
            <div className="mt-4 flex gap-2.5">
              <Button
                variant="danger"
                onClick={() => {
                  void resetAll();
                  setConfirmingReset(false);
                  setMessage({ kind: "ok", text: "Progress reset." });
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

      {routeSheet && (
        <OnboardingSheet
          open
          mode="edit"
          onClose={() => setRouteSheet(false)}
        />
      )}
    </div>
  );
}
