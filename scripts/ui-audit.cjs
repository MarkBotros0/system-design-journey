#!/usr/bin/env node
/* UI audit for the redesign: visits screens at phone width in both themes and fails on
 * sideways page scroll, a sideways row that also scrolls vertically, interactive targets
 * under 44px, page errors, and animations still running under reduced motion.
 *
 *   PLAYWRIGHT=<path to a playwright install> node scripts/ui-audit.cjs [--base URL] [--shots DIR] [path ...]
 *
 * Playwright is not a dependency of this repo; point PLAYWRIGHT at any install
 * (on the dev box: /home/mark/projects/nanny-app/node_modules/playwright). The dev server
 * must be running. Paths default to every main screen; each is opened through the DEV
 * seed fixture, so the learner is mid-journey. Exit code 1 when anything fails.
 */
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright')
const fs = require('fs')

const argv = process.argv.slice(2)
const opt = (name, dflt) => {
  const i = argv.indexOf(name)
  if (i === -1) return dflt
  const v = argv[i + 1]
  argv.splice(i, 2)
  return v
}
const BASE = opt('--base', 'http://localhost:5180')
const SHOTS = opt('--shots', '')
const PATHS = argv.length
  ? argv
  : [
      '/', '/learn', '/learn/core', '/m/db-isolation', '/m/db-isolation/quiz', '/practice', '/practice/ticketmaster',
      '/practice/ticketmaster/walkthrough', '/review', '/review/session', '/questions', '/questions/session?size=5',
      '/search?q=cache', '/glossary', '/patterns', '/you', '/__fixtures/blocks',
    ]

// Inline text links inside running prose and glossary terms in a sentence are exempt from
// the 44px rule (WCAG 2.5.8 inline exception); everything else that can be tapped is not.
const EXEMPT = '.prose-lesson a, .prose-lesson button, [data-inline-term], [data-target-exempt]'

;(async () => {
  const b = await chromium.launch()
  const failures = []
  for (const theme of ['dark', 'light']) {
    const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, colorScheme: theme, reducedMotion: 'reduce' })
    const p = await ctx.newPage()
    const errors = []
    p.on('pageerror', (e) => errors.push(e.message))
    for (const path of PATHS) {
      errors.length = 0
      await p.goto(`${BASE}/__fixtures/seed?to=${encodeURIComponent(path)}`, { waitUntil: 'networkidle' })
      await p.evaluate(() => document.fonts.ready)
      await p.waitForTimeout(500)
      const r = await p.evaluate((exempt) => {
        const out = { wide: document.documentElement.scrollWidth, small: [], wobbly: [], anims: 0 }
        for (const el of document.querySelectorAll('a[href], button, [role="button"], input, select, textarea, summary, [role="checkbox"], [role="radio"], [role="tab"]')) {
          if (el.closest(exempt) || el.closest('[aria-hidden="true"]') || el.closest('[inert]')) continue
          const rect = el.getBoundingClientRect()
          if (rect.width <= 1 || rect.height <= 1) continue // hidden until focused (skip link)
          const cs = getComputedStyle(el)
          if (cs.visibility === 'hidden') continue
          // A pseudo-element hit area (before:-inset-y-*) counts toward the target.
          const before = getComputedStyle(el, '::before')
          const extra = before.content !== 'none' && before.position === 'absolute' ? Math.max(0, -parseFloat(before.top || '0')) + Math.max(0, -parseFloat(before.bottom || '0')) : 0
          if (rect.height + extra < 43.5 || rect.width < 43.5) out.small.push(`${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}" ${Math.round(rect.width)}x${Math.round(rect.height + extra)}`)
        }
        for (const el of document.querySelectorAll('*')) {
          const cs = getComputedStyle(el)
          if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && cs.overflowY !== 'hidden' && el.scrollWidth > el.clientWidth && el.scrollHeight > el.clientHeight + 1) out.wobbly.push(el.getAttribute('aria-label') || el.className.toString().slice(0, 40))
        }
        out.anims = document.getAnimations().filter((a) => a.playState === 'running' && (a.effect?.getTiming().iterations === Infinity || (a.effect?.getTiming().duration ?? 0) > 50)).length
        return out
      }, EXEMPT)
      const tag = `[${theme}] ${path}`
      if (r.wide > 375) failures.push(`${tag}: page scrolls sideways (${r.wide}px)`)
      if (r.small.length) failures.push(`${tag}: targets under 44px: ${[...new Set(r.small)].slice(0, 6).join(' | ')}${r.small.length > 6 ? ` (+${r.small.length - 6})` : ''}`)
      if (r.wobbly.length) failures.push(`${tag}: sideways rows that also scroll vertically: ${r.wobbly.join(', ')}`)
      if (r.anims) failures.push(`${tag}: ${r.anims} animation(s) running under reduced motion`)
      if (errors.length) failures.push(`${tag}: page errors: ${errors.slice(0, 2).join(' | ')}`)
      if (SHOTS) {
        fs.mkdirSync(SHOTS, { recursive: true })
        await p.screenshot({ path: `${SHOTS}/${theme}${path.replace(/[/?=&]+/g, '_') || '_home'}.png` })
      }
    }
    await ctx.close()
  }
  await b.close()
  console.log(failures.length ? `FAIL (${failures.length})\n` + failures.join('\n') : `PASS  ${PATHS.length} screens x 2 themes`)
  process.exit(failures.length ? 1 : 0)
})().catch((e) => {
  console.error(e)
  process.exit(2)
})
