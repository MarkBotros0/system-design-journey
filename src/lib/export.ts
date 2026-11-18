/**
 * Progress export / import.
 *
 * The only route off this device. Everything is local, so without this a cleared browser
 * or a new phone means starting over.
 */

import { migrate, type ProgressState } from './storage'

const FORMAT = 'throughput.progress'

interface Envelope {
  format: typeof FORMAT
  /** Envelope version tracks the progress record's. Older envelopes import via `migrate`. */
  version: 1 | 2
  exportedAt: string
  progress: ProgressState
}

export function exportFilename(now = new Date()): string {
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
  return `throughput-progress-${d}.json`
}

export function toJson(progress: ProgressState): string {
  const envelope: Envelope = {
    format: FORMAT,
    version: 2,
    exportedAt: new Date().toISOString(),
    progress,
  }
  return JSON.stringify(envelope, null, 2)
}

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

export type ParseResult =
  | { ok: true; progress: ProgressState }
  | { ok: false; error: string }

export function parseImport(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: "That file isn't valid JSON. Pick the file you exported from Throughput." }
  }

  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'That file is empty or malformed.' }
  }

  const env = raw as Partial<Envelope>
  if (env.format !== FORMAT) {
    return {
      ok: false,
      error: "That's not a Throughput export. Look for a file named throughput-progress-<date>.json.",
    }
  }

  const p = env.progress
  if (!p || typeof p !== 'object') {
    return { ok: false, error: 'The export is missing its progress record.' }
  }

  return { ok: true, progress: { ...migrate(p), updatedAt: Date.now() } }
}
