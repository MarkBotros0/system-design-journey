/**
 * A deliberately small TypeScript highlighter for lesson code.
 *
 * Five token kinds are enough to make code scannable on a phone; a full grammar
 * (Prism, Shiki) would cost more bytes than every lesson's code put together. The one
 * hard guarantee: concatenating the tokens gives back the input exactly.
 */

export type TokenKind = 'kw' | 'str' | 'com' | 'type' | 'num' | 'plain'
export interface Token {
  text: string
  kind: TokenKind
}

const KEYWORDS = new Set(
  (
    'abstract as async await break case catch class const constructor continue default delete do else enum ' +
    'export extends false finally for from function get if implements import in instanceof interface let new ' +
    'null of private protected public readonly return set static super switch this throw true try type typeof ' +
    'undefined var void while yield keyof never unknown any number string boolean'
  ).split(' '),
)

// Order matters: comments and strings first so their contents are never re-tokenised.
const RULES: [TokenKind, RegExp][] = [
  ['com', /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y],
  ['str', /"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?|`(?:[^`\\]|\\.)*`?/y],
  ['num', /\b(?:0x[\da-fA-F]+|\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?)\b/y],
  ['plain', /[A-Za-z_$][\w$]*/y],
]

export function highlight(code: string): Token[] {
  const out: Token[] = []
  const push = (text: string, kind: TokenKind) => {
    const last = out[out.length - 1]
    if (last && last.kind === kind && kind === 'plain') last.text += text
    else out.push({ text, kind })
  }

  let i = 0
  while (i < code.length) {
    let matched = false
    for (const [kind, re] of RULES) {
      re.lastIndex = i
      const m = re.exec(code)
      if (!m || !m[0]) continue
      const word = m[0]
      if (kind === 'plain') {
        if (KEYWORDS.has(word)) push(word, 'kw')
        // Capitalised identifiers are types and classes by convention.
        else if (/^[A-Z]/.test(word)) push(word, 'type')
        else push(word, 'plain')
      } else {
        push(word, kind)
      }
      i += word.length
      matched = true
      break
    }
    if (!matched) {
      push(code[i], 'plain')
      i += 1
    }
  }
  return out
}
