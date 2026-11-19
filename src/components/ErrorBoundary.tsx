import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Download, RotateCw, TriangleAlert, Trash2 } from 'lucide-react'
import { clearProgress, loadProgress } from '../lib/storage'
import { downloadProgress } from '../lib/download'
import { Button } from './ui/Button'

/**
 * The last line of defence: a render error anywhere shows this instead of a blank page.
 *
 * It sits outside the router and the progress provider (either may be what broke), so it
 * reads and clears storage directly and uses only plain buttons — nothing here may need a
 * context. Export comes first because it is the one action that can never make things
 * worse — the learner's record leaves the device before anything else is tried.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Throughput crashed while rendering', error, info.componentStack)
  }

  private async exportProgress() {
    downloadProgress(await loadProgress())
  }

  private async reset() {
    if (!window.confirm('Erase all progress on this device? Export it first if you want to keep it.')) return
    await clearProgress()
    window.location.assign(import.meta.env.BASE_URL)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-safe pb-safe">
        <div className="flex flex-1 flex-col justify-center py-10">
          <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-surface-3 text-ink">
            <TriangleAlert size={26} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-[2rem] leading-[1.1] font-extrabold tracking-[-0.025em]">Something went wrong</h1>
          <p className="mt-3 text-base leading-relaxed text-ink-2">
            This screen hit an error. Your progress is stored on this device and has not been touched. Reloading usually
            fixes it; if it keeps happening, export your progress first.
          </p>
          <div className="mt-5 rounded-[18px] bg-surface-2 px-4 py-3">
            <p className="text-[0.8125rem] font-bold text-ink-2">What broke</p>
            <code className="mt-1 block font-mono text-[0.8125rem] leading-relaxed break-words text-ink-2">
              {this.state.error.message}
            </code>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 pb-4">
          <Button size="lg" onClick={() => window.location.assign(import.meta.env.BASE_URL)}>
            <RotateCw size={18} strokeWidth={2.2} aria-hidden="true" />
            Reload Throughput
          </Button>
          <Button size="lg" variant="secondary" onClick={() => void this.exportProgress()}>
            <Download size={18} strokeWidth={2.2} aria-hidden="true" />
            Export my progress
          </Button>
          <Button size="lg" variant="danger" onClick={() => void this.reset()}>
            <Trash2 size={18} strokeWidth={2.2} aria-hidden="true" />
            Reset this device
          </Button>
        </div>
      </main>
    )
  }
}
