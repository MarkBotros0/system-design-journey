/**
 * Inline markup stripped to plain text, for the places a rendered term would be wrong:
 * anything already inside a link or a label, where a nested <button> is invalid HTML
 * and would steal the click from the control wrapping it. Also what search indexes.
 */
export function plainText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, id: string, display?: string) => display ?? id)
}
