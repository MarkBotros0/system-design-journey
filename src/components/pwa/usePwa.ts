import { useSyncExternalStore } from 'react'
import { canPrompt, isIos, isStandalone, subscribe } from '../../lib/installPrompt'

/**
 * Whether an install affordance should be shown, and how.
 *
 * Three outcomes, because the platforms genuinely differ:
 *   'button'       Chromium fired beforeinstallprompt — show a real install button
 *   'ios-manual'   iOS Safari never fires it — show the Share → Add to Home Screen steps
 *   'none'         already installed, or the browser cannot install this
 */
export type InstallMode = 'button' | 'ios-manual' | 'none'

export function useInstallMode(): InstallMode {
  const promptable = useSyncExternalStore(
    subscribe,
    () => canPrompt(),
    () => false,
  )

  if (isStandalone()) return 'none'
  if (promptable) return 'button'
  if (isIos()) return 'ios-manual'
  return 'none'
}
