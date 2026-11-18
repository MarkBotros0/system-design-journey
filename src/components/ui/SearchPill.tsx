import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

/**
 * The way in to search, on the screens where finding something is the main job. A link,
 * not an input: tapping it opens the full search screen with the keyboard already up,
 * so the back gesture closes search rather than blurring a field.
 */
export function SearchPill({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/search"
      className={`group flex w-full items-center gap-3 rounded-xl border border-hairline bg-surface px-3.5 text-ink-3 transition-colors duration-150 hover:border-line active:bg-surface-2 ${
        compact ? 'min-h-11 text-[0.875rem]' : 'min-h-12 text-[0.9375rem]'
      }`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <Search size={18} strokeWidth={2} aria-hidden="true" className="shrink-0 text-ink-2" />
      <span className="min-w-0 flex-1 truncate">{compact ? 'Search' : 'Search topics, terms, problems'}</span>
      <kbd className="hidden shrink-0 rounded-md border border-hairline bg-surface-2 px-1.5 py-0.5 font-mono text-[0.6875rem] text-ink-3 [@media(pointer:fine)]:inline">
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </Link>
  )
}
