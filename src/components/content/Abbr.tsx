import { getGlossary } from '../../content/glossary'
import { useGlossary } from '../../state/GlossaryProvider'

/**
 * An abbreviation in running text. Tapping it opens the glossary sheet with the
 * expansion, a one-line gist, and an illustration of the actual mechanism.
 *
 * Styled as a dotted underline rather than a link colour: it appears often enough that
 * link-blue everywhere would shred the reading rhythm, and it is not navigation.
 */
export function Abbr({ id, display }: { id: string; display?: string }) {
  const { open } = useGlossary()
  const entry = getGlossary(id)

  // An unknown id is a content bug the validator will already have logged. Render the
  // raw text rather than throwing — a broken lesson is worse than a missing tooltip.
  if (!entry) return <>{display ?? id}</>

  return (
    <button
      type="button"
      onClick={() => open(id)}
      title={entry.full}
      className="cursor-pointer border-b border-dotted border-line/70 font-medium text-ink underline-offset-2 transition-colors hover:border-line hover:text-line"
    >
      {display ?? id}
    </button>
  )
}
