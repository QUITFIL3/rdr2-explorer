// Parses lua data files from femga/rdr3_discoveries into JSON for the web app.
// Usage: node scripts/parse-data.mjs <path-to-rdr3_discoveries-repo>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const REPO = process.argv[2]
if (!REPO) {
  console.error('Usage: node scripts/parse-data.mjs <path-to-rdr3_discoveries-repo>')
  process.exit(1)
}
const OUT = join(ROOT, 'public', 'data')
mkdirSync(OUT, { recursive: true })

const read = (p) => readFileSync(join(REPO, p), 'utf8').replace(/\r\n/g, '\n')
const round2 = (n) => Math.round(parseFloat(n) * 100) / 100
const hex = (s) => '0x' + s.replace(/^0x/i, '').toUpperCase().padStart(8, '0')

const manifest = []

function addRows(id, title, src, fields, rows, extra = {}) {
  writeFileSync(join(OUT, id + '.json'), JSON.stringify({ kind: 'rows', fields, rows }))
  manifest.push({ id, title, src, kind: 'rows', fields, count: rows.length, ...extra })
  console.log(`${id}: ${rows.length} rows`)
}

function addGroups(id, title, src, groups, extra = {}) {
  const groupCount = Object.keys(groups).length
  const count = Object.values(groups).reduce((a, b) => a + b.length, 0)
  writeFileSync(join(OUT, id + '.json'), JSON.stringify({ kind: 'groups', groups }))
  manifest.push({ id, title, src, kind: 'groups', count, groupCount, ...extra })
  console.log(`${id}: ${groupCount} groups / ${count} entries`)
}

// ["key"] = { "member", ... } -> { key: [members] }
function parseDict(text) {
  const groups = {}
  let cur = null
  for (const raw of text.split('\n')) {
    const t = raw.trim()
    if (t.startsWith('--')) continue
    let m = t.match(/^\["(.+?)"\]\s*=\s*\{/)
    if (m) { cur = m[1]; groups[cur] ||= []; continue }
    if (cur) {
      m = t.match(/^"(.+?)"\s*,?$/)
      if (m) { groups[cur].push(m[1]); continue }
      if (t.startsWith('}')) cur = null
    }
  }
  return groups
}

// ---------------------------------------------------------------- peds
{
  const rows = [...read('peds/peds_list.lua').matchAll(/\{0x([0-9A-Fa-f]+),"([^"]+)",(\d+),?\}/g)]
    .map((m) => [m[2], hex(m[1]), +m[3]])
  addRows('peds', 'Peds', 'peds/peds_list.lua', ['name', 'hash', 'outfits'], rows)
}

// ---------------------------------------------------------------- weapons
{
  const rows = []
  for (const line of read('weapons/weapons.lua').split('\n')) {
    const m = line.match(/^\s*(--)?\s*\{`([^`]+)`,`([^`]+)`,?\}\s*,?\s*--\s*\{(0x[0-9A-Fa-f]+),/)
    if (m) rows.push([m[2], hex(m[4]), m[3].replace(/^group_/, ''), m[1] ? 'sp only' : 'enabled'])
  }
  addRows('weapons', 'Weapons', 'weapons/weapons.lua', ['name', 'hash', 'group', 'status'], rows, { facets: ['group', 'status'] })
}

// ---------------------------------------------------------------- weapon components
{
  const rows = []
  let weapon = null, slot = null
  for (const raw of read('weapons/weapon_components.lua').split('\n')) {
    const t = raw.trim()
    if (t.startsWith('--')) continue
    let m = t.match(/^\["(.+?)"\]\s*=\s*\{/)
    if (m) { if (weapon === null) weapon = m[1]; else slot = m[1]; continue }
    m = t.match(/^"(.+?)"\s*,?$/)
    if (m && weapon) { rows.push([m[1], weapon, slot || 'MISC']); continue }
    if (t.startsWith('}')) { if (slot !== null) slot = null; else weapon = null }
  }
  addRows('weapon_components', 'Weapon Components', 'weapons/weapon_components.lua', ['name', 'weapon', 'slot'], rows, { facets: ['weapon', 'slot'] })
}

// ---------------------------------------------------------------- ammo
{
  const rows = []
  for (const line of read('weapons/ammo_types.lua').split('\n')) {
    const m = line.match(/^\s*"([^"]+)",\s*--\s*(0x[0-9A-Fa-f]+)/)
    if (m) rows.push([m[1], hex(m[2])])
  }
  addRows('ammo', 'Ammo Types', 'weapons/ammo_types.lua', ['name', 'hash'], rows)
}

// ---------------------------------------------------------------- pickups
{
  const rows = []
  for (const line of read('objects/pickup_list.lua').split('\n')) {
    const t = line.trim()
    if (t.startsWith('--')) continue
    const m = t.match(/^"([^"]+)"\s*,?$/)
    if (m) rows.push([m[1]])
  }
  addRows('pickups', 'Pickups', 'objects/pickup_list.lua', ['name'], rows)
}

// ---------------------------------------------------------------- vehicles
{
  const rows = [...read('vehicles/vehicles_list.lua').matchAll(/\[0x([0-9A-Fa-f]+)\]\s*=\s*"([^"]+)"/g)]
    .map((m) => [m[2], hex(m[1])])
  addRows('vehicles', 'Vehicles', 'vehicles/vehicles_list.lua', ['name', 'hash'], rows)
}

// ---------------------------------------------------------------- objects
{
  const rows = []
  for (const line of read('objects/object_list.lua').split('\n')) {
    const m = line.match(/\[(-?\d+)\]\s*=\s*"([^"]+)"\s*,\s*--\s*hex_hash:\s*(0x[0-9A-Fa-f]+)\s*--\s*(.+)$/)
    if (m) rows.push([m[2], hex(m[3]), m[4].trim()])
  }
  addRows('objects', 'Objects / Props', 'objects/object_list.lua', ['name', 'hash', 'source'], rows)
}

// ---------------------------------------------------------------- clothes
{
  const rows = []
  for (const line of read('clothes/cloth_hash_names.lua').split('\n')) {
    const t = line.trim()
    if (!t.startsWith('{') || t.startsWith('--')) continue
    const name = t.match(/hashname="([^"]*)"/)
    const cat = t.match(/category_hashname="([^"]*)"/)
    const ped = t.match(/ped_type="([^"]*)"/)
    const mp = t.match(/is_multiplayer=(true|false)/)
    const h = t.match(/[,{]hash=0x([0-9A-Fa-f]+)/)
    if (cat && h) {
      rows.push([name && name[1] ? name[1] : '(unnamed)', hex(h[1]), cat[1], ped ? ped[1] : '', mp && mp[1] === 'true' ? 'mp' : 'sp'])
    }
  }
  addRows('clothes', 'Clothes', 'clothes/cloth_hash_names.lua', ['name', 'hash', 'category', 'ped_type', 'mode'], rows, { facets: ['category', 'ped_type', 'mode'] })
}

// ---------------------------------------------------------------- animations (ingame + megadict merged)
{
  const a = parseDict(read('animations/ingameanims/ingameanims_list.lua'))
  const b = parseDict(read('animations/megadictanims/megadictanims.lua'))
  for (const [dict, names] of Object.entries(b)) {
    if (!a[dict]) { a[dict] = names; continue }
    const set = new Set(a[dict])
    for (const n of names) if (!set.has(n)) a[dict].push(n)
  }
  addGroups('anims', 'Animations', 'animations/ingameanims/ingameanims_list.lua', a, { groupLabel: 'anim dict', itemLabel: 'anim name' })
}

// ---------------------------------------------------------------- scenarios
{
  const g = parseDict(read('animations/scenarios/scenario_types_with_conditional_anims.lua'))
  addGroups('scenarios', 'Scenarios', 'animations/scenarios/scenario_types_with_conditional_anims.lua', g, { groupLabel: 'scenario type', itemLabel: 'conditional anim' })
}

// ---------------------------------------------------------------- emotes
{
  const rows = []
  for (const line of read('animations/kit_emotes_list/kit_emotes_list.lua').split('\n')) {
    const m = line.match(/^\s*"(KIT_EMOTE_[^"]+)",\s*--\s*(0x[0-9A-Fa-f]+)/)
    if (m) {
      const g = m[1].match(/^KIT_EMOTE_([A-Z]+)_/)
      rows.push([m[1], hex(m[2]), g ? g[1].toLowerCase() : 'other'])
    }
  }
  addRows('emotes', 'Emotes', 'animations/kit_emotes_list/kit_emotes_list.lua', ['name', 'hash', 'group'], rows, { facets: ['group'] })
}

// ---------------------------------------------------------------- soundsets
{
  addGroups('soundsets', 'Soundsets', 'audio/soundsets/soundsets.lua', parseDict(read('audio/soundsets/soundsets.lua')), { groupLabel: 'soundset', itemLabel: 'sound name' })
  addGroups('frontend_soundsets', 'Frontend Soundsets', 'audio/frontend_soundsets/frontend_soundsets.lua', parseDict(read('audio/frontend_soundsets/frontend_soundsets.lua')), { groupLabel: 'soundset', itemLabel: 'sound name' })
}

// ---------------------------------------------------------------- music events
{
  const rows = []
  for (const line of read('audio/music_events/music_events.lua').split('\n')) {
    const t = line.trim()
    if (t.startsWith('--')) continue
    const m = t.match(/^"([^"]+)"\s*,?$/)
    if (m) rows.push([m[1]])
  }
  addRows('music_events', 'Music Events', 'audio/music_events/music_events.lua', ['name'], rows)
}

// ---------------------------------------------------------------- audio banks (names only, contents are mostly unresolved hashes)
{
  const rows = [...read('audio/audio_banks/audio_banks.lua').matchAll(/^\s*\["(.+?)"\]\s*=\s*\{/gm)].map((m) => [m[1]])
  addRows('audio_banks', 'Audio Banks', 'audio/audio_banks/audio_banks.lua', ['name'], rows)
}

// ---------------------------------------------------------------- animpostfx
{
  const rows = []
  for (const line of read('graphics/animpostfx/animpostfx.lua').split('\n')) {
    const t = line.trim()
    if (t.startsWith('--')) continue
    const m = t.match(/^"([^"]+)"\s*,?$/)
    if (m) rows.push([m[1]])
  }
  addRows('animpostfx', 'AnimPostFX (screen effects)', 'graphics/animpostfx/animpostfx.lua', ['name'], rows)
}

// ---------------------------------------------------------------- ptfx (looped + non-looped)
{
  const rows = []
  for (const [file, type] of [
    ['graphics/ptfx/ptfx_assets_looped.lua', 'looped'],
    ['graphics/ptfx/ptfx_assets_non_looped.lua', 'oneshot'],
  ]) {
    const g = parseDict(read(file))
    for (const [asset, names] of Object.entries(g)) for (const n of names) rows.push([n, asset, type])
  }
  addRows('ptfx', 'Particle Effects', 'graphics/ptfx', ['name', 'asset', 'type'], rows, { facets: ['type'] })
}

// ---------------------------------------------------------------- timecycles
{
  const rows = []
  for (const line of read('graphics/timecycles/timecycles.lua').split('\n')) {
    const t = line.trim()
    if (t.startsWith('--')) continue
    const m = t.match(/^"([^"]+)"\s*,?$/)
    if (m) rows.push([m[1]])
  }
  addRows('timecycles', 'Timecycle Modifiers', 'graphics/timecycles/timecycles.lua', ['name'], rows)
}

// ---------------------------------------------------------------- markers
{
  const rows = []
  for (const line of read('graphics/markers/marker_types.lua').split('\n')) {
    const m = line.match(/^\s*(0x[0-9A-Fa-f]+),\s*--modelName\s+(\S+)/)
    if (m) rows.push([m[2], hex(m[1])])
  }
  addRows('markers', 'Marker Types', 'graphics/markers/marker_types.lua', ['name', 'hash'], rows)
}

// ---------------------------------------------------------------- explosion vfx tags
{
  const rows = []
  for (const line of read('graphics/explosions/explosion_vfxTags.lua').split('\n')) {
    const t = line.trim()
    if (t.startsWith('--')) continue
    const m = t.match(/^(0x[0-9A-Fa-f]+),\s*(?:--\s*(.+))?$/)
    if (m) rows.push([m[2] ? m[2].trim() : '(unknown effect)', hex(m[1])])
  }
  addRows('explosion_vfx', 'Explosion VFX Tags', 'graphics/explosions/explosion_vfxTags.lua', ['name', 'hash'], rows)
}

// ---------------------------------------------------------------- weather
{
  const rows = []
  for (const line of read('weather/weather_types.lua').split('\n')) {
    const m = line.match(/^\s*"([^"]+)",\s*--\s*(0x[0-9A-Fa-f]+)/)
    if (m) rows.push([m[1], hex(m[2])])
  }
  addRows('weather', 'Weather Types', 'weather/weather_types.lua', ['name', 'hash'], rows)
}

// ---------------------------------------------------------------- doors
{
  const rows = [...read('doorHashes/doorhashes.lua').matchAll(/\[(-?\d+)\]\s*=\s*\{(-?\d+),(-?\d+),"([^"]+)",(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)\}/g)]
    .map((m) => [m[4], m[1], round2(m[5]), round2(m[6]), round2(m[7])])
  addRows('doors', 'Door Hashes', 'doorHashes/doorhashes.lua', ['model', 'doorhash', 'x', 'y', 'z'], rows)
}

// ---------------------------------------------------------------- interiors
{
  const rows = [...read('interiors/interiors_coords_and_hashes.lua').matchAll(/\[(\d+)\]\s*=\s*\{x=(-?[\d.]+),y=(-?[\d.]+),z=(-?[\d.]+),typeHashId=(-?\d+),typeHashName="([^"]*)",rpf="([^"]*)"\}/g)]
    .map((m) => [m[6], +m[1], round2(m[2]), round2(m[3]), round2(m[4]), m[7]])
  addRows('interiors', 'Interiors', 'interiors/interiors_coords_and_hashes.lua', ['name', 'interior_id', 'x', 'y', 'z', 'rpf'], rows)
}

// ---------------------------------------------------------------- imaps
{
  const rows = [...read('imaps/imaps_with_coords_and_heading.lua').matchAll(/\[0x([0-9A-Fa-f]+)\]\s*=\s*\{hashname="([^"]*)",dec_hash=(-?\d+),x=(-?[\d.]+),y=(-?[\d.]+),z=(-?[\d.]+),h=(-?[\d.]+)\}/g)]
    .map((m) => [m[2] || '(unnamed)', hex(m[1]), round2(m[4]), round2(m[5]), round2(m[6])])
  addRows('imaps', 'IMAPs (map parts)', 'imaps/imaps_with_coords_and_heading.lua', ['name', 'hash', 'x', 'y', 'z'], rows)
}

// ---------------------------------------------------------------- texture galleries
// READMEs contain markdown tables: name | hash | ![name](https://femga.com:8080/images/samples/<path>) | ...
// We store the path relative to the samples base; the frontend prepends it back.
{
  function parseTextureReadme(files) {
    const rows = []
    for (const f of files) {
      let dict = ''
      for (const line of read(f).split('\n')) {
        let m = line.match(/<h2>([\w\-. ]+?)\s*\((0x[0-9A-Fa-f]+|-?\d+)\)/)
        if (m) { dict = m[1].trim(); continue }
        m = line.match(/^([\w\-.@]+)\s*\|\s*(-?\d+|0x[0-9A-Fa-f]+)\s*\|\s*!\[[^\]]*\]\(https:\/\/femga\.com:8080\/images\/samples\/([^)]+)\)/)
        if (m) rows.push([m[1], m[2], dict, m[3]])
      }
    }
    return rows
  }

  const T = 'useful_info_from_rpfs/textures/'
  const TEX = [
    ['tex_blips', 'Blips', [T + 'blips/README.md']],
    ['tex_blips_mp', 'Blips (MP)', [T + 'blips_mp/README.md']],
    ['tex_inventory_items', 'Inventory Items', [T + 'inventory_items/README.md']],
    ['tex_menu_items', 'Menu Items', [T + 'menu_items/README.md']],
    ['tex_menu_textures', 'Menu Textures', [T + 'menu_textures/README.md']],
    ['tex_multiwheel_emotes', 'Emote Wheel', [T + 'multiwheel_emotes/readme.md']],
    ['tex_overhead', 'Overhead Icons', [T + 'overhead/readme.md']],
    ['tex_awards', 'Awards (MP)', [T + 'pm_awards_mp/README.md']],
    ['tex_collectors_bag', 'Collectors Bag', [T + 'pm_collectors_bag_mp/README.MD']],
    ['tex_ui_hud', 'HUD Textures', [T + 'ui_hud____part_1/README.md', T + 'ui_hud____part_2/README.MD']],
    ['tex_ui_mp', 'MP UI Textures', [T + 'ui_textures_mp____part1/README.md', T + 'ui_textures_mp____part2/README.md']],
    ['tex_startup', 'Startup Art', [T + 'ui_startup_textures/readme.md']],
    ['tex_swatches', 'UI Swatches', [T + 'ui_swatches/README.md']],
    ['tex_cards', 'Playing Cards', [T + 'ui_minigames/cards/README.md']],
    ['tex_domino', 'Dominoes', [T + 'ui_minigames/domino/README.md']],
  ]
  for (const [id, title, files] of TEX) {
    const rows = parseTextureReadme(files)
    const dicts = new Set(rows.map((r) => r[2]))
    const extra = { image: true }
    if (dicts.size > 1) extra.facets = ['dict']
    addRows(id, title, files[0].replace(/\/[^/]+$/, ''), ['name', 'hash', 'dict', 'url'], rows, extra)
  }
}

// ---------------------------------------------------------------- manifest
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`\nmanifest: ${manifest.length} categories, total ${manifest.reduce((a, c) => a + c.count, 0)} entries`)
