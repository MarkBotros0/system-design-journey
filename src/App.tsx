import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Shell } from './components/nav/Shell'
import { MapScreen } from './routes/MapScreen'
import { ModuleScreen } from './routes/ModuleScreen'
import { QuizScreen } from './routes/QuizScreen'
import { DrillScreen } from './routes/DrillScreen'
import { PracticeScreen } from './routes/PracticeScreen'
import { ProblemScreen } from './routes/ProblemScreen'
import { YouScreen } from './routes/YouScreen'
import { ButtonLink } from './components/ui/Button'

/** A new screen starts at the top; the browser's restore only makes sense going back. */
function ScrollToTop() {
  const { pathname } = useLocation()
  const navType = (window.performance?.getEntriesByType?.('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined)?.type
  useEffect(() => {
    if (navType !== 'back_forward') window.scrollTo(0, 0)
  }, [pathname, navType])
  return null
}

function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 text-center">
      <h1 className="text-[1.75rem] font-semibold">No station here</h1>
      <p className="mt-2 text-[0.9375rem] text-ink-2">
        That link does not point anywhere in the curriculum.
      </p>
      <div className="mt-6 flex justify-center">
        <ButtonLink to="/">Back to the line</ButtonLink>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Tabbed shell — the places you browse. */}
        <Route element={<Shell />}>
          <Route path="/" element={<MapScreen />} />
          <Route path="/m/:moduleId" element={<ModuleScreen />} />
          <Route path="/practice" element={<PracticeScreen />} />
          <Route path="/drill" element={<DrillScreen />} />
          <Route path="/you" element={<YouScreen />} />
        </Route>

        {/* Focus modes — timed or scored, so the tab bar comes off and each has its own exit. */}
        <Route path="/m/:moduleId/quiz" element={<QuizScreen />} />
        <Route path="/practice/:problemId" element={<ProblemScreen />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
