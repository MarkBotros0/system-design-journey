/** Saving the export as a file, the browser way. */

import { exportFilename, toJson } from './export'
import type { ProgressState } from './progressState'

export function downloadProgress(progress: ProgressState): void {
  const blob = new Blob([toJson(progress)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = exportFilename()
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick — Safari needs the URL to survive the click.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
