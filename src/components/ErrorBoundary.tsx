import { Component, type ErrorInfo, type ReactNode } from 'react'
import { clearProgress, loadProgress } from '../lib/storage'
import { downloadProgress } from '../lib/export'

/**
 * The last line of defence: a render error anywhere shows this instead of a blank page.
 *
 * It sits outside the progress provider (which may be what broke), so it reads and clears
 * storage directly. Export comes first because it is the one action that can never make
 * things worse — the learner's record leaves the device before anything else is tried.
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
    window.location.assign('/')
  }

  render() {
    if (!this.state.error) return this.props.children
    const button =
      'inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-[0.9375rem] font-medium transition-colors duration-150'
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 pt-safe pb-safe">
        <h1 className="text-[1.75rem] font-semibold">Something went wrong</h1>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
          This screen hit an error. Your progress is stored on this device and has not been touched. Reloading usually
          fixes it; if it keeps happening, export your progress first.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" onClick={() => window.location.assign('/')} className={`${button} bg-line text-line-ink hover:opacity-90`}>
            Reload Throughput
          </button>
          <button
            type="button"
            onClick={() => void this.exportProgress()}
            className={`${button} border border-hairline bg-surface text-ink hover:bg-surface-2`}
          >
            Export my progress
          </button>
          <button type="button" onClick={() => void this.reset()} className={`${button} text-alert hover:bg-alert-soft`}>
            Reset this device
          </button>
        </div>
        <p className="mt-6 font-mono text-[0.75rem] break-words text-ink-3">{this.state.error.message}</p>
      </main>
    )
  }
}
