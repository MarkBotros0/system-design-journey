import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ProgressProvider } from './state/ProgressProvider'
import { GlossaryProvider } from './state/GlossaryProvider'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root missing from index.html')

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <ProgressProvider>
        <GlossaryProvider>
          <App />
        </GlossaryProvider>
      </ProgressProvider>
    </BrowserRouter>
  </StrictMode>,
)
