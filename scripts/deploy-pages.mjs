// Builds the site for GitHub Pages and force-pushes it to the gh-pages branch.
// - model previews are hotlinked to the source CDN (the multi-GB local set is
//   NOT published); texture samples (~200MB, background-removed) ARE published.
// Usage: npm run deploy
import { execSync } from 'node:child_process'
import { cpSync, rmSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const DIST = join(ROOT, 'dist')
const REMOTE = 'https://github.com/QUITFIL3/rdr3-explorer.git'
const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts })

process.env.DEPLOY_PAGES = '1'
process.env.VITE_MODEL_IMG_BASE =
  'https://cdn.jsdelivr.net/gh/BryceCanyonCounty/rdr3-nativedb-data@master/objects/images/'

console.log('building (pages mode)...')
rmSync(DIST, { recursive: true, force: true })
run('npx vite build')

console.log('copying static data...')
cpSync(join(ROOT, 'public', 'data'), join(DIST, 'data'), { recursive: true })
cpSync(join(ROOT, 'public', 'images', 'samples'), join(DIST, 'images', 'samples'), { recursive: true })
cpSync(join(ROOT, 'public', 'images', 'rdr2map.jpg'), join(DIST, 'images', 'rdr2map.jpg'))
cpSync(join(ROOT, 'public', 'images', 'rdr2map_dark.jpg'), join(DIST, 'images', 'rdr2map_dark.jpg'))
cpSync(join(ROOT, 'public', 'robots.txt'), join(DIST, 'robots.txt'))
cpSync(join(ROOT, 'public', 'sitemap.xml'), join(DIST, 'sitemap.xml'))
writeFileSync(join(DIST, '.nojekyll'), '')

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
