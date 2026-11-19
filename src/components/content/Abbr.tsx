import { getGlossary } from '../../content/glossary'
import { useGlossary } from '../../state/GlossaryProvider'

/**
 * An abbreviation in running text. Tapping it opens the glossary sheet with the
 * expansion, a one-line gist, and an illustration of the actual mechanism.
 *
 * Styled as a dotted underline in the track's colour rather than a link colour: it
 * appears often enough that link styling everywhere would shred the reading rhythm, and
 * it is not navigation. Being a word in a sentence, it is exempt from the 44px target
 * floor (`data-inline-term`, which the UI audit honours).
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
      data-abbr={id}
      data-inline-term=""
      onClick={() => open(id)}
      title={entry.full}
      className="cursor-pointer border-b-[1.5px] border-dotted border-track/70 font-medium text-ink transition-colors duration-150 hover:border-track hover:text-track"
    >
      {display ?? id}
    </button>
  )
}
