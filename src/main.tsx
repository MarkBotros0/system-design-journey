import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ProgressProvider } from './state/ProgressProvider'
import { GlossaryProvider } from './state/GlossaryProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root missing from index.html')

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      {/* GitHub Pages serves the app under /<repo>/; BASE_URL carries that prefix (or '/'). */}
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <ProgressProvider>
          <GlossaryProvider>
            <App />
          </GlossaryProvider>
        </ProgressProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
