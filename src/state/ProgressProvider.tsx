import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  applyTheme,
  emptyProgress,
  loadProgress,
  loadTheme,
  saveProgress,
  saveTheme,
  clearProgress,
  stopKey,
  MAX_RECENT_SEARCHES,
  type DailyGoal,
  type ProblemAttempt,
  type ProgressState,
  type Theme,
} from '../lib/storage'
import { bumpActivity, touchStreak } from '../lib/progress'
import { getModule, getRoute } from '../content'
import { newCard, review, type Grade } from '../lib/srs'
import { recordDay, scheduleAnswer } from '../lib/bank'

interface ProgressContextValue {
  progress: ProgressState
  /** False until IndexedDB has answered. Screens render skeletons rather than zeros. */
  ready: boolean
  markLessonRead: (moduleId: string) => void
  recordQuiz: (moduleId: string, score: number) => void
  gradeCard: (cardId: string, grade: Grade) => void
  /** Schedules a bank question and counts it toward today. Counts as study for the streak. */
  answerQuestion: (questionId: string, correct: boolean) => void
  setDailyGoal: (goal: DailyGoal) => void
  saveAttempt: (attempt: ProblemAttempt) => void
  replaceAll: (next: ProgressState) => void
  resetAll: () => Promise<void>
  toggleBookmark: (moduleId: string) => void
  /** Where you are reading. Not a study action — it moves no streak. Callers throttle it. */
  setPlace: (moduleId: string, sectionId?: string) => void
  /**
   * Pick a route. `skipBasics` moves the start pointer past Foundations (true) or back to
   * the beginning (false); omitted, the pointer is kept when the route is unchanged.
   */
  chooseRoute: (routeId: string, opts?: { skipBasics?: boolean }) => void
  dismissOnboarding: () => void
  pushRecentSearch: (q: string) => void
  clearRecentSearches: () => void
  theme: Theme
  setTheme: (t: Theme) => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(emptyProgress)
  const [ready, setReady] = useState(false)
  const [theme, setThemeState] = useState<Theme>(() => loadTheme())
  const hydrated = useRef(false)

  useEffect(() => {
    let alive = true
    void loadProgress().then((p) => {
      if (!alive) return
      setProgress(p)
      hydrated.current = true
      setReady(true)
    })
    return () => {
      alive = false
    }
  }, [])

  // Never persist the empty placeholder over a real record before hydration lands.
  useEffect(() => {
    if (hydrated.current) saveProgress(progress)
  }, [progress])

  // Follow the OS while the user is on "system".
  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    saveTheme(t)
    applyTheme(t)
  }, [])

  /** Every study action touches the streak — one place, so it can't drift. */
  const study = useCallback((fn: (p: ProgressState) => ProgressState) => {
    setProgress((prev) => {
      const next = fn(prev)
      if (next === prev) return prev
      return { ...next, streak: touchStreak(next.streak), activity: bumpActivity(next.activity) }
    })
  }, [])

  const markLessonRead = useCallback(
    (moduleId: string) => {
      study((p) =>
        p.lessonsRead[moduleId]
          ? p
          : { ...p, lessonsRead: { ...p.lessonsRead, [moduleId]: Date.now() } },
      )
    },
    [study],
  )

  const recordQuiz = useCallback(
    (moduleId: string, score: number) => {
      study((p) => {
        const prev = p.quiz[moduleId]
        return {
          ...p,
          quiz: {
            ...p.quiz,
            [moduleId]: {
              best: Math.max(prev?.best ?? 0, score),
              attempts: (prev?.attempts ?? 0) + 1,
              lastAt: Date.now(),
            },
          },
        }
      })
    },
    [study],
  )

  const gradeCard = useCallback(
    (cardId: string, grade: Grade) => {
      study((p) => ({
        ...p,
        cards: { ...p.cards, [cardId]: review(p.cards[cardId] ?? newCard(), grade) },
      }))
    },
    [study],
  )

  const answerQuestion = useCallback(
    (questionId: string, correct: boolean) => {
      study((p) => ({
        ...p,
        questions: { ...p.questions, [questionId]: scheduleAnswer(p.questions[questionId], correct) },
        questionDays: recordDay(p.questionDays, correct),
      }))
    },
    [study],
  )

  const setDailyGoal = useCallback((dailyGoal: DailyGoal) => {
    setProgress((p) => ({ ...p, dailyGoal }))
  }, [])

  const saveAttempt = useCallback(
    (attempt: ProblemAttempt) => {
      study((p) => {
        const rest = p.attempts.filter((a) => a.id !== attempt.id)
        return { ...p, attempts: [attempt, ...rest].slice(0, 100) }
      })
    },
    [study],
  )

  const toggleBookmark = useCallback((moduleId: string) => {
    setProgress((p) => ({
      ...p,
      bookmarks: p.bookmarks.includes(moduleId)
        ? p.bookmarks.filter((id) => id !== moduleId)
        : [moduleId, ...p.bookmarks],
    }))
  }, [])

  const setPlace = useCallback((moduleId: string, sectionId?: string) => {
    setProgress((p) =>
      p.lastPlace?.moduleId === moduleId && p.lastPlace.sectionId === sectionId
        ? p
        : { ...p, lastPlace: { moduleId, sectionId, at: Date.now() } },
    )
  }, [])

  const chooseRoute = useCallback((routeId: string, opts?: { skipBasics?: boolean }) => {
    setProgress((p) => {
      const route = getRoute(routeId)
      let startStop = p.routeId === route.id ? p.startStop : null
      if (opts?.skipBasics !== undefined) {
        const first = opts.skipBasics
          ? route.stops.find((s) => !('module' in s) || getModule(s.module)?.trackId !== 'foundations')
          : undefined
        startStop = first ? stopKey(first) : null
      }
      return { ...p, routeId: route.id, startStop, onboarded: true }
    })
  }, [])

  const dismissOnboarding = useCallback(() => {
    setProgress((p) => (p.onboarded ? p : { ...p, onboarded: true }))
  }, [])

  const pushRecentSearch = useCallback((q: string) => {
    const query = q.trim()
    if (query.length < 2) return
    setProgress((p) => {
      if (p.recentSearches[0]?.toLowerCase() === query.toLowerCase()) return p
      const rest = p.recentSearches.filter((s) => s.toLowerCase() !== query.toLowerCase())
      return { ...p, recentSearches: [query, ...rest].slice(0, MAX_RECENT_SEARCHES) }
    })
  }, [])

  const clearRecentSearches = useCallback(() => {
    setProgress((p) => ({ ...p, recentSearches: [] }))
  }, [])

  const replaceAll = useCallback((next: ProgressState) => {
    hydrated.current = true
    setProgress(next)
  }, [])

  const resetAll = useCallback(async () => {
    await clearProgress()
    hydrated.current = true
    setProgress(emptyProgress())
  }, [])

  const value = useMemo(
    () => ({
      progress,
      ready,
      markLessonRead,
      recordQuiz,
      gradeCard,
      answerQuestion,
      setDailyGoal,
      saveAttempt,
      replaceAll,
      resetAll,
      toggleBookmark,
      setPlace,
      chooseRoute,
      dismissOnboarding,
      pushRecentSearch,
      clearRecentSearches,
      theme,
      setTheme,
    }),
    [
      toggleBookmark,
      setPlace,
      chooseRoute,
      dismissOnboarding,
      pushRecentSearch,
      clearRecentSearches,
      progress,
      ready,
      markLessonRead,
      recordQuiz,
      gradeCard,
      answerQuestion,
      setDailyGoal,
      saveAttempt,
      replaceAll,
      resetAll,
      theme,
      setTheme,
    ],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>')
  return ctx
}
