import { Fragment, useMemo } from 'react'
import { EMPHASIS } from '../../lib/text'
import { Abbr } from './Abbr'

/**
 * Inline markup. Four forms, nothing else:
 *
 *   **bold**     strong emphasis
 *   *word*       light emphasis — the stress you would put on it saying it aloud
 *   `code`       an identifier, command, or literal
 *   [[TTL]]      an abbreviation — renders a tappable term backed by a glossary entry
 *                with its own illustration
 *
 * The third exists to enforce a house rule: no abbreviation appears in this curriculum
 * without somewhere to see what it means. `validateContent` fails the build-time check
 * if a bare acronym slips into prose, so the rule cannot rot as content is added.
 */

const TOKEN = new RegExp(`(\\*\\*[^*]+\\*\\*|\`[^\`]+\`|\\[\\[[^\\]]+\\]\\]|${EMPHASIS.source})`, 'g')

/* Re-exported so existing imports keep working; the implementation is pure and lives
   in lib/ so search and other non-React code can use it. */
export { plainText } from '../../lib/text'

export function Inline({ text }: { text: string }) {
  // One capture group, so split() puts every matched token at an odd index. Parity, not
  // the token's first character, decides — a stray "* " in prose is never mistaken.
  const parts = useMemo(() => text.split(TOKEN), [text])

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>
        if (part.startsWith('**') && part.endsWith('**')) {
          // Recurse: an abbreviation is often the emphasised word, and `**[[TTL]] rules**`
          // must still produce a tappable term rather than printing the brackets.
          // Terminates because the bold pattern cannot match inside its own content.
          return (
            <strong key={i}>
              <Inline text={part.slice(2, -2)} />
            </strong>
          )
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-ink"
            >
              {part.slice(1, -1)}
            </code>
          )
        }
        if (part.startsWith('[[') && part.endsWith(']]')) {
          // [[TTL]] or [[TTL|TTLs]] — second form when the sentence needs a plural
          // or possessive without breaking the glossary lookup.
          const inner = part.slice(2, -2)
          const [id, display] = inner.split('|')
          return <Abbr key={i} id={id.trim()} display={display?.trim()} />
        }
        return (
          <em key={i}>
            <Inline text={part.slice(1, -1)} />
          </em>
        )
      })}
    </>
  )
}
