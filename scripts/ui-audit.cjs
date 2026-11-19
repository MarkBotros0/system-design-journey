#!/usr/bin/env node
/* UI audit for the redesign: visits screens at phone width in both themes and fails on
 * sideways page scroll, a sideways row that also scrolls vertically, interactive targets
 * under 44px, page errors, animations still running under reduced motion, a control in an
 * open sheet that something else paints over (so a tap lands elsewhere), and a page's last
 * control hidden behind the fixed bottom bars. Tab screens are also checked at 1024×768.
 *
 * A path written `fresh:/` opens as a brand-new learner (the first-run onboarding sheet).
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
      '/search?q=cache', '/glossary', '/patterns', '/you', '/__fixtures/blocks', 'fresh:/',
    ]
const WIDE = argv.length ? [] : ['/', '/learn', '/practice', '/review', '/you']
const seedUrl = (path) =>
  path.startsWith('fresh:')
    ? `${BASE}/__fixtures/seed?to=${encodeURIComponent(path.slice(6))}&fresh=1`
    : `${BASE}/__fixtures/seed?to=${encodeURIComponent(path)}`

// Runs in the page. Two ways a visible control can still be untappable: inside an open sheet,
// something painted above it takes the tap; at the end of a page, a fixed bottom bar sits on it.
async function covered(page) {
  return page.evaluate(async () => {
    const out = { sheet: [], bottom: null }
    const hits = (el) => {
      const r = el.getBoundingClientRect()
      const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return !at || el === at || el.contains(at)
    }
    const name = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)
    const dialog = document.querySelector('[role="dialog"]')
    if (dialog) {
      // tabindex=-1 skips the backdrop: a full-screen "Close" the panel covers on purpose.
      for (const el of dialog.querySelectorAll('a[href], button:not([tabindex="-1"]), input, [role="radio"], [role="checkbox"]')) {
        const r0 = el.getBoundingClientRect()
        if (r0.width <= 1 || r0.height <= 1) continue
        el.scrollIntoView({ block: 'nearest' })
        await new Promise((res) => requestAnimationFrame(res))
        if (!hits(el)) {
          const r = el.getBoundingClientRect()
          const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
          out.sheet.push(`"${name(el)}" under ${at ? at.tagName.toLowerCase() + (at.getAttribute('aria-label') ? `[${at.getAttribute('aria-label')}]` : '') : '?'}`)
        }
      }
      return out
    }
    window.scrollTo(0, document.documentElement.scrollHeight)
    await new Promise((res) => setTimeout(res, 350))
    const main = document.querySelector('main')
    if (!main) return out
    const ctrls = [...main.querySelectorAll('a[href], button')].filter((e) => {
      const r = e.getBoundingClientRect()
      return r.width > 1 && r.height > 1 && getComputedStyle(e).visibility !== 'hidden'
    })
    const last = ctrls[ctrls.length - 1]
    if (!last) return out
    const lr = last.getBoundingClientRect()
    // Fixed chrome outside main; a pass-through wrapper (pointer-events: none) counts by the
    // parts of it that do take taps, like the Resume dock's capsule.
    const chrome = []
    for (const el of document.querySelectorAll('body *')) {
      if (main.contains(el) || el.contains(main)) continue
      const cs = getComputedStyle(el)
      if (cs.position !== 'fixed' || cs.visibility === 'hidden') continue
      if (cs.pointerEvents !== 'none') chrome.push(el)
      else chrome.push(...[...el.querySelectorAll('*')].filter((c) => getComputedStyle(c).pointerEvents !== 'none' && getComputedStyle(c.parentElement).pointerEvents === 'none'))
    }
    for (const el of chrome) {
      const r = el.getBoundingClientRect()
      if (r.width <= 1 || r.height <= 1 || r.top < innerHeight / 2) continue
      if (r.left < lr.right && r.right > lr.left && r.top < lr.bottom && r.bottom > lr.top) {
        out.bottom = `"${name(last)}" under ${el.tagName.toLowerCase()}${el.getAttribute('aria-label') ? `[${el.getAttribute('aria-label').slice(0, 30)}]` : ''}`
        break
      }
    }
    return out
  })
}

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
      await p.goto(seedUrl(path), { waitUntil: 'networkidle' })
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
      const c = await covered(p)
      if (c.sheet.length) failures.push(`${tag}: sheet controls painted over: ${c.sheet.slice(0, 4).join(' | ')}`)
      if (c.bottom) failures.push(`${tag}: last control under a bottom bar: ${c.bottom}`)
      if (SHOTS) {
        fs.mkdirSync(SHOTS, { recursive: true })
        await p.screenshot({ path: `${SHOTS}/${theme}${path.replace(/[/?=&]+/g, '_') || '_home'}.png` })
      }
    }
    await ctx.close()
  }
  // Sheets once more with motion on: an animation's fill can make a stacking context that
  // reduced motion never shows, and most learners have motion on.
  const moving = await b.newContext({ viewport: { width: 375, height: 667 }, reducedMotion: 'no-preference' })
  const mp = await moving.newPage()
  for (const path of PATHS.filter((x) => x.startsWith('fresh:'))) {
    await mp.goto(seedUrl(path), { waitUntil: 'networkidle' })
    await mp.waitForTimeout(800)
    const c = await covered(mp)
    if (c.sheet.length) failures.push(`[motion] ${path}: sheet controls painted over: ${c.sheet.slice(0, 4).join(' | ')}`)
  }
  await moving.close()
  // The rail layout: the dock moves to the bottom-right corner, over the content column.
  const wide = await b.newContext({ viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' })
  const wp = await wide.newPage()
  for (const path of WIDE) {
    await wp.goto(seedUrl(path), { waitUntil: 'networkidle' })
    await wp.waitForTimeout(400)
    const c = await covered(wp)
    if (c.bottom) failures.push(`[1024] ${path}: last control under a bottom bar: ${c.bottom}`)
  }
  await wide.close()
  await b.close()
  console.log(failures.length ? `FAIL (${failures.length})\n` + failures.join('\n') : `PASS  ${PATHS.length} screens x 2 themes${WIDE.length ? ` + ${WIDE.length} at 1024` : ''}`)
  process.exit(failures.length ? 1 : 0)
})().catch((e) => {
  console.error(e)
  process.exit(2)
})
