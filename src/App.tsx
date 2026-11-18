import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { Shell } from './components/nav/Shell'
import { LearnScreen } from './routes/LearnScreen'
import { TrackScreen } from './routes/TrackScreen'
import { PatternsScreen } from './routes/PatternsScreen'
import { ModuleScreen } from './routes/ModuleScreen'
import { QuizScreen } from './routes/QuizScreen'
import { ReviewScreen } from './routes/ReviewScreen'
import { ReviewSessionScreen } from './routes/ReviewSessionScreen'
import { PracticeScreen } from './routes/PracticeScreen'
import { ProblemScreen } from './routes/ProblemScreen'
import { WalkthroughScreen } from './routes/WalkthroughScreen'
import { YouScreen } from './routes/YouScreen'
import { GlossaryScreen } from './routes/GlossaryScreen'
import { SearchScreen } from './routes/SearchScreen'
import { ButtonLink } from './components/ui/Button'
import { PwaBanner } from './components/pwa/PwaBanner'
import { GlossarySheet } from './components/content/GlossarySheet'
import { BlocksFixture } from './routes/__fixtures/BlocksFixture'
import { SeedFixture } from './routes/__fixtures/SeedFixture'
import { HomeScreen } from './routes/HomeScreen'

/**
 * Where the viewport goes after a navigation.
 *
 *  - A hash (`/m/c-cap#pacelc`, a search result) scrolls to that heading. Lessons render
 *    synchronously, but fonts and figures can shift layout, so it re-aims once shortly
 *    after.
 *  - A new screen starts at the top and moves focus to its h1, so a screen reader hears
 *    where it landed. Back/forward keeps the browser's own restoration.
 */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  const navType = useNavigationType()
  const first = useRef(true)

  useEffect(() => {
    const initial = first.current
    first.current = false

    if (hash) {
      const id = decodeURIComponent(hash.slice(1))
      const aim = () => document.getElementById(id)?.scrollIntoView({ block: 'start' })
      requestAnimationFrame(aim)
      const t = setTimeout(aim, 300)
      return () => clearTimeout(t)
    }
    if (navType === 'POP') return
    window.scrollTo(0, 0)
    if (!initial) {
      const h1 = document.querySelector<HTMLElement>('main h1, h1')
      if (h1) {
        if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1')
        h1.focus({ preventScroll: true })
      }
    }
  }, [pathname, hash, navType])

  return null
}

/** "/" or Ctrl/⌘K opens search from anywhere — unless you are typing. */
function GlobalKeys() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
      const isK = e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)
      if (isK || (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey)) {
        if (typing && !isK) return
        e.preventDefault()
        if (pathname !== '/search') navigate('/search')
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navigate, pathname])
  return null
}

function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 text-center">
      <h1 className="text-[1.75rem] font-semibold">Nothing here</h1>
      <p className="mt-2 text-[0.9375rem] text-ink-2">That link does not point anywhere in the curriculum.</p>
      <div className="mt-6 flex justify-center gap-2">
        <ButtonLink to="/">Home</ButtonLink>
        <ButtonLink to="/search" variant="secondary">
          Search
        </ButtonLink>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-[calc(env(safe-area-inset-top)+0.5rem)] focus:left-2 focus:z-[70] focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3 focus:text-ink focus:shadow-lg"
      >
        Skip to content
      </a>
      <ScrollManager />
      <GlobalKeys />
      <Routes>
        {/* Tabbed shell — the places you browse. */}
        <Route element={<Shell />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/learn" element={<LearnScreen />} />
          <Route path="/learn/:trackId" element={<TrackScreen />} />
          <Route path="/patterns" element={<PatternsScreen />} />
          <Route path="/m/:moduleId" element={<ModuleScreen />} />
          <Route path="/practice" element={<PracticeScreen />} />
          <Route path="/practice/:problemId/walkthrough" element={<WalkthroughScreen />} />
          <Route path="/review" element={<ReviewScreen />} />
          <Route path="/you" element={<YouScreen />} />
          <Route path="/glossary" element={<GlossaryScreen />} />
          <Route path="/search" element={<SearchScreen />} />
          {import.meta.env.DEV && <Route path="/__fixtures/blocks" element={<BlocksFixture />} />}
          {import.meta.env.DEV && <Route path="/__fixtures/seed" element={<SeedFixture />} />}
        </Route>

        {/* Focus modes — timed or scored, so the tab bar comes off and each has its own exit. */}
        <Route path="/m/:moduleId/quiz" element={<QuizScreen />} />
        <Route path="/practice/:problemId" element={<ProblemScreen />} />
        <Route path="/review/session" element={<ReviewSessionScreen />} />

        <Route path="/drill" element={<Navigate to="/review" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <PwaBanner />
      {/* Mounted once — every abbreviation in the app opens this same sheet. */}
      <GlossarySheet />
    </>
  )
}
