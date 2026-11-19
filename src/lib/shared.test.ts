import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, normalize, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

// The mobile app copies these files as they are (shared.json), so they must run outside a
// browser. A file that reaches for one breaks the app on the phone, not here.
const root = join(__dirname, '../..')
const spec = JSON.parse(readFileSync(join(root, 'shared.json'), 'utf8')) as { dirs: string[]; files: string[]; packages: string[] }

function walk(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const rel = join(dir, name)
    if (statSync(join(root, rel)).isDirectory()) return walk(rel)
    return rel.endsWith('.ts') && !rel.endsWith('.test.ts') ? [rel] : []
  })
}

const shared = [...spec.dirs.flatMap(walk), ...spec.files].map(normalize)
const inShared = new Set(shared)

/** The code of a file with its string and template literals blanked out: lessons talk about `localStorage`. */
function code(src: string): string {
  // One pass, left to right, so a `//` inside a string is not taken for a comment.
  return src.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g, (m) =>
    m.startsWith('/') ? '' : "''",
  )
}

/** Module specifiers of the file's import and export-from statements (no quote may come before `from`). */
function imports(src: string): string[] {
  return [...src.matchAll(/^(?:import|export)\s[^'"`]*?from\s+'([^']+)'|^import\s+'([^']+)'/gm)].map((m) => m[1] ?? m[2])
}

describe('shared code', () => {
  it('lists files that exist', () => {
    for (const f of spec.files) expect(() => statSync(join(root, f)), f).not.toThrow()
  })

  it.each(shared)('%s imports only shared files and allowed packages', (file) => {
    const src = readFileSync(join(root, file), 'utf8')
    for (const spec_ of imports(src)) {
      if (!spec_.startsWith('.')) {
        expect(spec.packages, `${file} imports ${spec_}`).toContain(spec_)
        continue
      }
      const target = normalize(join(dirname(file), spec_))
      const ok = [`${target}.ts`, join(target, 'index.ts')].some((t) => inShared.has(t))
      expect(ok, `${file} imports ${relative(root, join(root, target))}, which is not shared`).toBe(true)
    }
  })

  it.each(shared)('%s uses no browser or bundler API', (file) => {
    const src = code(readFileSync(join(root, file), 'utf8'))
    expect(src).not.toMatch(/\b(window|document|localStorage|sessionStorage|indexedDB|navigator)\b|import\.meta/)
  })
})
