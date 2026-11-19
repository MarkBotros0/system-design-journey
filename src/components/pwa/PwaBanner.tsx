import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Download, RefreshCw, X } from 'lucide-react'
import { Button, IconButton } from '../ui/Button'

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
      // Floats just above the tab bar, in the same inset as it; a corner card on desktop.
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-50 mx-auto max-w-lg lg:right-6 lg:bottom-6 lg:left-auto lg:mx-0 lg:w-96"
    >
      <div className="flex items-start gap-3 rounded-[22px] bg-surface p-3.5 dark:bg-surface-2" style={{ boxShadow: 'var(--shadow-float)' }}>
        {needRefresh ? (
          <>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface-3 text-ink">
              <RefreshCw size={19} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-base leading-snug font-bold">New version ready</p>
              <p className="mt-0.5 text-[0.875rem] leading-snug text-ink-2">
                Reload when you are not mid-attempt — nothing is lost either way.
              </p>
              <Button
                onClick={() => {
                  setReloading(true)
                  void updateServiceWorker(true)
                }}
                disabled={reloading}
                className="mt-3"
              >
                {reloading ? 'Reloading…' : 'Reload'}
              </Button>
            </div>
            <IconButton label="Dismiss" onClick={() => setNeedRefresh(false)} className="-mt-0.5 -mr-0.5">
              <X size={18} strokeWidth={2.2} aria-hidden="true" />
            </IconButton>
          </>
        ) : (
          <>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface-3 text-ink">
              <Download size={19} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <p className="min-w-0 flex-1 pt-0.5 text-[0.9375rem] leading-snug text-ink-2">
              <span className="block text-base font-bold text-ink">Ready to work offline</span>
              Every station, quiz and problem is on your device now.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
