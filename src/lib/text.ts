/**
 * Inline markup stripped to plain text, for the places a rendered term would be wrong:
 * anything already inside a link or a label, where a nested <button> is invalid HTML
 * and would steal the click from the control wrapping it. Also what search indexes.
 */
/**
 * `*emphasis*`: the asterisks must hug a word on both sides and stand apart from other
 * word characters, so `2 * 3`, `a*b` and `SELECT *` are left as written.
 */
export const EMPHASIS = /(?<![*\w])\*(?=[^\s*])[^*\n]*?[^\s*]\*(?![*\w])/

export function plainText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(new RegExp(EMPHASIS.source, 'g'), (m) => m.slice(1, -1))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, id: string, display?: string) => display ?? id)
}
