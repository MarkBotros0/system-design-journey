/**
 * Persistence. Everything is local: IndexedDB for the progress record, localStorage for
 * the handful of settings that must be readable synchronously before first paint.
 *
 * Both accessors are wrapped — a browser in private mode, or with site data blocked,
 * throws on access rather than returning null. The app must still run, just without
 * memory, so every read has a defined empty result and every write can fail silently.
 */

import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import { emptyProgress, migrate, PROGRESS_KEY, THEME_KEY, type ProgressState, type Theme } from './progressState'

export * from './progressState'

/* ------------------------------------------------------------------ */
/* Progress record                                                     */
/* ------------------------------------------------------------------ */

export async function loadProgress(): Promise<ProgressState> {
  try {
    const raw = await idbGet<unknown>(PROGRESS_KEY)
    if (raw && typeof raw === 'object') return migrate(raw)
  } catch {
    /* IndexedDB unavailable — fall through to a fresh record. */
  }
  return emptyProgress()
}

let writeTimer: ReturnType<typeof setTimeout> | undefined

/** Debounced: quiz answers and card grades arrive in bursts. */
export function saveProgress(state: ProgressState): void {
  clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    void idbSet(PROGRESS_KEY, { ...state, updatedAt: Date.now() }).catch(() => {})
  }, 250)
}

export async function clearProgress(): Promise<void> {
  try {
    await idbDel(PROGRESS_KEY)
  } catch {
    /* nothing to clear */
  }
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export function loadTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY)
    if (t === 'light' || t === 'dark' || t === 'system') return t
  } catch {
    /* storage blocked */
  }
  return 'system'
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* storage blocked — the choice just won't survive a reload */
  }
}

/** Resolve `system` against the OS and stamp the root element. */
export function applyTheme(theme: Theme): void {
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme
  document.documentElement.setAttribute('data-theme', resolved)
}
