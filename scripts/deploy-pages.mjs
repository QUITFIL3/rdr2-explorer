// Builds the site for GitHub Pages and force-pushes it to the gh-pages branch.
// - model previews are hotlinked to the source CDN (the multi-GB local set is
//   NOT published); texture samples (~200MB, background-removed) ARE published.
// Usage: npm run deploy
import { execSync } from 'node:child_process'
import { cpSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const DIST = join(ROOT, 'dist')
// DEPLOY_REMOTE lets CI push with a token URL; local runs use the plain remote
const REMOTE = process.env.DEPLOY_REMOTE || 'https://github.com/QUITFIL3/rdr3-explorer.git'
const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts })

process.env.DEPLOY_PAGES = '1'
process.env.VITE_MODEL_IMG_BASE =
  'https://cdn.jsdelivr.net/gh/BryceCanyonCounty/rdr3-nativedb-data@master/objects/images/'
process.env.VITE_MODEL_THUMB_PROXY = 'https://wsrv.nl/?url='

console.log('building (pages mode)...')
rmSync(DIST, { recursive: true, force: true })
run('npx vite build')

console.log('copying static data...')
cpSync(join(ROOT, 'public', 'data'), join(DIST, 'data'), { recursive: true })
cpSync(join(ROOT, 'public', 'images', 'rdr2map.jpg'), join(DIST, 'images', 'rdr2map.jpg'))
cpSync(join(ROOT, 'public', 'images', 'rdr2map_dark.jpg'), join(DIST, 'images', 'rdr2map_dark.jpg'))
cpSync(join(ROOT, 'public', 'brand'), join(DIST, 'brand'), { recursive: true })
cpSync(join(ROOT, 'public', 'robots.txt'), join(DIST, 'robots.txt'))
cpSync(join(ROOT, 'public', 'sitemap.xml'), join(DIST, 'sitemap.xml'))
cpSync(join(ROOT, 'public', 'llms.txt'), join(DIST, 'llms.txt'))
cpSync(join(ROOT, 'public', 'manifest.webmanifest'), join(DIST, 'manifest.webmanifest'))
cpSync(join(ROOT, 'public', 'sw.js'), join(DIST, 'sw.js'))
writeFileSync(join(DIST, '.nojekyll'), '')

// texture samples (~200MB) are git-ignored and only exist on a dev machine.
// CI keeps the ones already published instead of wiping them off the site.
const localSamples = join(ROOT, 'public', 'images', 'samples')
if (existsSync(localSamples)) {
  cpSync(localSamples, join(DIST, 'images', 'samples'), { recursive: true })
} else {
  console.log('local samples missing — reusing the published set from gh-pages...')
  const tmp = join(ROOT, '.pages-prev')
  rmSync(tmp, { recursive: true, force: true })
  run(`git clone --depth 1 --branch gh-pages ${REMOTE} "${tmp}"`)
  const prevSamples = join(tmp, 'images', 'samples')
  if (existsSync(prevSamples)) {
    cpSync(prevSamples, join(DIST, 'images', 'samples'), { recursive: true })
  }
  rmSync(tmp, { recursive: true, force: true })
}

console.log('pushing to gh-pages...')
const g = (cmd) => run(`git ${cmd}`, { cwd: DIST })
g('init -b gh-pages')
g('config user.name "QUITFIL3"')
g('config user.email "redmreborn@gmail.com"')
g('add -A')
g('commit -q -m "deploy to GitHub Pages" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"')
g(`push -f ${REMOTE} gh-pages`)
rmSync(join(DIST, '.git'), { recursive: true, force: true })
console.log('deployed: https://quitfil3.github.io/rdr3-explorer/')
