/** WCAG relative luminance of a `#rrggbb` colour. */
function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16)
  const channel = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

/** The WCAG contrast ratio between two `#rrggbb` colours, 1–21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * The hex custom properties declared in the first `selector { … }` block of a stylesheet,
 * keyed without the leading `--`. Values that are not a plain `#rrggbb` (var(), color-mix)
 * are skipped: they are derived, and checked through what they derive from.
 */
export function cssTokens(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) return {}
  const body = css.slice(start, css.indexOf('}', start))
  const out: Record<string, string> = {}
  for (const m of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[m[1]] = m[2].toLowerCase()
  return out
}
