import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Download, RefreshCw, X } from 'lucide-react'

/**
 * Service-worker lifecycle UI.
 *
 * The plugin is configured `registerType: 'prompt'` rather than 'autoUpdate' on purpose:
 * an automatic reload can land in the middle of a timed design problem and destroy an
 * attempt. The user decides when to take the new version.
 */
export function PwaBanner() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const [reloading, setReloading] = useState(false)

  // "Ready to work offline" is information, not a decision — say it once and go.
  useEffect(() => {
    if (!offlineReady) return
    const id = setTimeout(() => setOfflineReady(false), 5000)
    return () => clearTimeout(id)
  }, [offlineReady, setOfflineReady])

  if (!offlineReady && !needRefresh) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-16 z-50 px-4 pb-3 lg:right-6 lg:bottom-6 lg:left-auto lg:max-w-sm lg:px-0"
    >
      <div
        className="flex items-start gap-3 rounded-2xl border border-hairline bg-surface px-4 py-3.5"
        style={{ boxShadow: 'var(--shadow-sheet)' }}
      >
        {needRefresh ? (
          <>
            <RefreshCw size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-line" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.9375rem] font-semibold">New version ready</p>
              <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-2">
                Reload when you are not mid-attempt — nothing is lost either way.
              </p>
              <button
                onClick={() => {
                  setReloading(true)
                  void updateServiceWorker(true)
                }}
                disabled={reloading}
                className="mt-2.5 min-h-9 rounded-lg bg-line px-3.5 text-[0.875rem] font-medium text-line-ink disabled:opacity-60"
              >
                {reloading ? 'Reloading…' : 'Reload'}
              </button>
            </div>
            <button
              onClick={() => setNeedRefresh(false)}
              aria-label="Dismiss"
              className="-mt-1 -mr-1.5 flex min-h-11 min-w-11 items-center justify-center text-ink-3 hover:text-ink"
            >
              <X size={17} strokeWidth={2} />
            </button>
          </>
        ) : (
          <>
            <Download size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-mastered" />
            <p className="flex-1 text-[0.875rem] leading-relaxed">
              <span className="font-semibold">Ready to work offline.</span> Every station,
              quiz and problem is on your device now.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
