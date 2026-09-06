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
  type ProblemAttempt,
  type ProgressState,
  type Theme,
} from '../lib/storage'
import { touchStreak } from '../lib/progress'
import { newCard, review, type Grade } from '../lib/srs'

interface ProgressContextValue {
  progress: ProgressState
  /** False until IndexedDB has answered. Screens render skeletons rather than zeros. */
  ready: boolean
  markLessonRead: (moduleId: string) => void
  recordQuiz: (moduleId: string, score: number) => void
  gradeCard: (cardId: string, grade: Grade) => void
  saveAttempt: (attempt: ProblemAttempt) => void
  replaceAll: (next: ProgressState) => void
  resetAll: () => Promise<void>
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
      return { ...next, streak: touchStreak(next.streak) }
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

  const saveAttempt = useCallback(
    (attempt: ProblemAttempt) => {
      study((p) => {
        const rest = p.attempts.filter((a) => a.id !== attempt.id)
        return { ...p, attempts: [attempt, ...rest].slice(0, 100) }
      })
    },
    [study],
  )

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
      saveAttempt,
      replaceAll,
      resetAll,
      theme,
      setTheme,
    }),
    [
      progress,
      ready,
      markLessonRead,
      recordQuiz,
      gradeCard,
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
