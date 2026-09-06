import { Fragment, useMemo } from 'react'
import { Abbr } from './Abbr'

/**
 * Inline markup. Three forms, nothing else:
 *
 *   **bold**     emphasis
 *   `code`       an identifier, command, or literal
 *   [[TTL]]      an abbreviation — renders a tappable term backed by a glossary entry
 *                with its own illustration
 *
 * The third exists to enforce a house rule: no abbreviation appears in this curriculum
 * without somewhere to see what it means. `validateContent` fails the build-time check
 * if a bare acronym slips into prose, so the rule cannot rot as content is added.
 */

const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[\[[^\]]+\]\])/g

/**
 * Markup stripped to plain text, for the places a rendered term would be wrong:
 * anything already inside a link or a label, where a nested <button> is invalid HTML
 * and would steal the click from the control wrapping it.
 */
export function plainText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, id: string, display?: string) => display ?? id)
}

export function Inline({ text }: { text: string }) {
  const parts = useMemo(() => text.split(TOKEN).filter(Boolean), [text])

  return (
    <>
      {parts.map((part, i) => {
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
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}
