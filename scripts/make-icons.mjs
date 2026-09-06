/**
 * Rasterise public/favicon.svg into the PNG sizes the web app manifest and iOS need.
 *
 * Run after changing the mark: `npm run icons`. The outputs are committed, so a normal
 * install and build never needs sharp.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'public/favicon.svg')
const svg = await readFile(src)

const OUTPUTS = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

await mkdir(resolve(root, 'public'), { recursive: true })

for (const { file, size } of OUTPUTS) {
  await sharp(svg, { density: 512 }).resize(size, size).png().toFile(resolve(root, 'public', file))
  console.log(`wrote public/${file} (${size}px)`)
}

/* Maskable needs the mark inside the safe zone — Android crops to a circle, so the
   glyph is scaled to 60% and centred on the brand ground rather than bleeding to the edge. */
const inner = Math.round(512 * 0.6)
const glyph = await sharp(svg, { density: 512 }).resize(inner, inner).png().toBuffer()
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#0D1014' },
})
  .composite([{ input: glyph, gravity: 'center' }])
  .png()
  .toFile(resolve(root, 'public/icon-512-maskable.png'))
console.log('wrote public/icon-512-maskable.png (512px, maskable)')
