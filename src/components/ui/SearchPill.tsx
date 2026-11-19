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
      className={`group flex w-full items-center gap-2.5 rounded-[14px] bg-surface-3 px-3.5 text-ink-3 transition-colors duration-150 hover:text-ink-2 ${
        compact ? 'min-h-11 text-[0.9375rem]' : 'min-h-12 text-base'
      }`}
    >
      <Search size={18} strokeWidth={2} aria-hidden="true" className="shrink-0 text-ink-2" />
      <span className="min-w-0 flex-1 truncate">{compact ? 'Search' : 'Search topics, terms, problems'}</span>
      <kbd className="hidden shrink-0 rounded-md bg-surface px-1.5 py-0.5 font-sans text-[0.75rem] font-semibold text-ink-3 [@media(pointer:fine)]:inline">
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </Link>
  )
}
