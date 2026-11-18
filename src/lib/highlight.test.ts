import { describe, expect, it } from 'vitest'
import { highlight } from './highlight'

const join = (code: string) => highlight(code).map((t) => t.text).join('')

describe('highlight', () => {
  it('round-trips the input exactly', () => {
    for (const code of [
      'const x = "a" // c',
      "class Invoice implements Billable {\n  total(): Money { return this.lines.reduce((n, l) => n + l, 0) }\n}",
      '/* block\n comment */ let n = 0x1f + 3.5e2',
      'const s = `templ ${x} ate`',
      'unterminated "string',
      '',
    ]) {
      expect(join(code)).toBe(code)
    }
  })

  it('tags keywords, strings, comments, numbers and types', () => {
    const t = highlight('const x: Money = "a" // c\nreturn 42')
    expect(t).toContainEqual({ text: 'const', kind: 'kw' })
    expect(t).toContainEqual({ text: 'return', kind: 'kw' })
    expect(t).toContainEqual({ text: '"a"', kind: 'str' })
    expect(t).toContainEqual({ text: '// c', kind: 'com' })
    expect(t).toContainEqual({ text: '42', kind: 'num' })
    expect(t).toContainEqual({ text: 'Money', kind: 'type' })
  })

  it('does not tag a keyword inside an identifier', () => {
    expect(highlight('constant').some((t) => t.kind === 'kw')).toBe(false)
  })
})
