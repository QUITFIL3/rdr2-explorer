// Frontend metadata per data category: sidebar grouping, icon (name from icons.js),
// description (desc = English, descTh = Thai) and Lua snippet templates.
// Snippet functions receive the selected entry object (fields from the manifest; for
// group-kind categories: { group, name }).

export const GROUP_ORDER = ['Models', 'Animations', 'Audio', 'Graphics', 'Textures', 'Weapons', 'World']

// base URL for texture sample images (downloaded via scripts/download-images.mjs)
export const TEX_BASE = import.meta.env.BASE_URL + 'images/samples/'

const drawSpriteSnippet = (e) => `-- draw on screen (call every frame)
local dict, tex = "${String(e.dict).toLowerCase()}", "${e.name}"
if not HasStreamedTextureDictLoaded(dict) then
  RequestStreamedTextureDict(dict, false)
end
DrawSprite(dict, tex, 0.5, 0.5, 0.08, 0.08, 0.0, 255, 255, 255, 255, false)`

const blipSnippet = (e) => `-- create a map blip with this sprite
local blip = BlipAddForCoords(joaat("BLIP_STYLE_SHOP"), x, y, z)
SetBlipSprite(blip, joaat("${e.name}"), true)
SetBlipName(blip, "My blip")
-- remove: RemoveBlip(blip)`

export const CATEGORY_META = {
  peds: {
    titleTh: 'ตัวละคร (Peds)',
    group: 'Models', icon: 'user',
    desc: 'All ped models (humans + animals) with hash and number of outfit variations.',
    descTh: 'โมเดลตัวละครทั้งหมด (คน + สัตว์) พร้อม hash และจำนวนชุด (outfit) ที่มี',
    snippet: (e) => `local model = joaat("${e.name}")
RequestModel(model)
repeat Citizen.Wait(0) until HasModelLoaded(model)
local ped = CreatePed(model, x, y, z, heading, true, true, true, true)
Citizen.InvokeNative(0x283978A15512B2FE, ped, true) -- SET_RANDOM_OUTFIT_VARIATION
-- or pick one of the ${e.outfits ?? 'N'} outfits (0-based):
-- Citizen.InvokeNative(0x77FF8D35EEC6BBC4, ped, 0, 0)`,
  },
  vehicles: {
    titleTh: 'ยานพาหนะ',
    group: 'Models', icon: 'truck',
    desc: 'Wagons, carts, boats, trains and other vehicle models.',
    descTh: 'โมเดลยานพาหนะ เช่น รถม้า เกวียน เรือ รถไฟ และอื่น ๆ',
    snippet: (e) => `local model = joaat("${e.name}")
RequestModel(model)
repeat Citizen.Wait(0) until HasModelLoaded(model)
local veh = CreateVehicle(model, x, y, z, heading, true, true)`,
  },
  objects: {
    titleTh: 'วัตถุ / Props',
    group: 'Models', icon: 'box',
    desc: 'All object / prop models with their source rpf for easy filtering.',
    descTh: 'โมเดลวัตถุ / prop ทั้งหมด พร้อมชื่อไฟล์ rpf ต้นทางเพื่อให้กรองง่าย',
    snippet: (e) => `local model = joaat("${e.name}")
RequestModel(model)
repeat Citizen.Wait(0) until HasModelLoaded(model)
local obj = CreateObject(model, x, y, z, true, true, true)`,
  },
  clothes: {
    titleTh: 'เสื้อผ้า',
    group: 'Models', icon: 'shopping-bag',
    desc: 'Clothing item hashes by category, ped type and SP/MP availability.',
    descTh: 'hash ของเสื้อผ้าแยกตามหมวด ประเภทตัวละคร และการใช้ได้ใน SP/MP',
    snippet: (e) => `-- _APPLY_SHOP_ITEM_TO_PED (clothing/component hash)
Citizen.InvokeNative(0xD3A7B003ED343FD9, PlayerPedId(), ${e.hash}, true, true, true)
-- then refresh the ped:
Citizen.InvokeNative(0xCC8CA3E88256E58F, PlayerPedId(), false, true, true, true, false) -- _UPDATE_PED_VARIATION`,
  },
  pickups: {
    titleTh: 'ของเก็บได้ (Pickups)',
    group: 'Models', icon: 'tag',
    desc: 'Pickup type names (ammo, weapons, consumables).',
    descTh: 'ชื่อประเภทของ pickup (กระสุน อาวุธ ของกิน/ของใช้)',
  },

  anims: {
    titleTh: 'แอนิเมชัน',
    group: 'Animations', icon: 'film',
    desc: 'Every animation dictionary and the anims inside it (ingame + megadict lists merged).',
    descTh: 'animation dictionary ทั้งหมดพร้อมรายชื่อ anim ข้างใน (รวม ingame + megadict)',
    snippet: (e) => `local dict, anim = "${e.group}", "${e.name}"
RequestAnimDict(dict)
repeat Citizen.Wait(0) until HasAnimDictLoaded(dict)
TaskPlayAnim(PlayerPedId(), dict, anim, 8.0, -8.0, -1, 1, 0.0, false, false, false)
-- stop: ClearPedTasks(PlayerPedId())`,
  },
  scenarios: {
    titleTh: 'ซีนาริโอ',
    group: 'Animations', icon: 'activity',
    desc: 'Scenario types with their conditional animations (sit, lean, smoke...).',
    descTh: 'ประเภท scenario พร้อม conditional animation (นั่ง พิง สูบบุหรี่ ...)',
    snippet: (e) => `-- TASK_START_SCENARIO_IN_PLACE_HASH  (duration -1 = forever)
Citizen.InvokeNative(0x524B54361229154F, PlayerPedId(),
  joaat("${e.group}"), -1, true, joaat("${e.name}"), -1.0, 0)
-- cancel: ClearPedTasks(PlayerPedId())`,
  },
  emotes: {
    titleTh: 'ท่าทาง (Emotes)',
    group: 'Animations', icon: 'smile',
    desc: 'Kit emotes usable via PLAY_KIT_EMOTE (dances, greets, taunts...).',
    descTh: 'kit emote ที่ใช้ผ่าน PLAY_KIT_EMOTE (เต้น ทักทาย ยั่วโมโห ...)',
    snippet: (e) => `-- categories: 0=Reaction 1=Action 2=Taunts 3=Greets 4=TwirlGun 5=Dances
local emote_category = 1
Citizen.InvokeNative(0xB31A277C1AC7B7FF, PlayerPedId(),
  emote_category, 2, joaat("${e.name}"), 0, 0, 0, 0, 0) -- full body emote`,
  },

  soundsets: {
    titleTh: 'ชุดเสียง (Soundsets)',
    group: 'Audio', icon: 'volume',
    desc: 'World soundsets and the sound names they contain.',
    descTh: 'soundset ในโลกเกมพร้อมชื่อเสียงที่อยู่ข้างใน',
    snippet: (e) => `local soundset_ref = "${e.group}"
local sound_name = "${e.name}"
-- PLAY_SOUND_FROM_POSITION
Citizen.InvokeNative(0xCCE219C922737BFA, sound_name, x, y, z, soundset_ref, true, 0, true, 0)
-- release when done (otherwise new soundsets can fail to load):
-- Citizen.InvokeNative(0x531A78D6BF27014B, soundset_ref)`,
  },
  frontend_soundsets: {
    titleTh: 'ชุดเสียง UI',
    group: 'Audio', icon: 'bell',
    desc: 'UI / frontend soundsets, playable without coordinates.',
    descTh: 'soundset ของ UI / frontend เล่นได้โดยไม่ต้องใช้พิกัด',
    snippet: (e) => `-- _PLAY_SOUND_FRONTEND
Citizen.InvokeNative(0x67C540AA08E4A6F5, "${e.name}", "${e.group}", true, 0)`,
  },
  music_events: {
    titleTh: 'เพลงประกอบ',
    group: 'Audio', icon: 'music',
    desc: 'Music event names (mission scores, stingers).',
    descTh: 'ชื่อ music event (เพลงประกอบภารกิจ, stinger)',
  },
  audio_banks: {
    titleTh: 'คลังเสียง (Audio Banks)',
    group: 'Audio', icon: 'archive',
    desc: 'Audio bank names (speech / sfx containers).',
    descTh: 'ชื่อ audio bank (ตัวบรรจุเสียงพูด / sfx)',
  },

  ptfx: {
    titleTh: 'เอฟเฟกต์อนุภาค',
    group: 'Graphics', icon: 'zap',
    desc: 'Particle effects: looped and one-shot, with their asset dictionary.',
    descTh: 'เอฟเฟกต์อนุภาค ทั้งแบบวนซ้ำและเล่นครั้งเดียว พร้อม asset dictionary',
    snippet: (e) => `local asset, effect = "${e.asset}", "${e.name}"
RequestNamedPtfxAsset(asset)
repeat Citizen.Wait(0) until HasNamedPtfxAssetLoaded(asset)
UseParticleFxAsset(asset)
${e.type === 'looped'
  ? 'local fx = StartParticleFxLoopedAtCoord(effect, x, y, z, 0.0, 0.0, 0.0, 1.0, false, false, false, false)\n-- stop: StopParticleFxLooped(fx, false)'
  : 'StartParticleFxNonLoopedAtCoord(effect, x, y, z, 0.0, 0.0, 0.0, 1.0, false, false, false)'}`,
  },
  animpostfx: {
    titleTh: 'เอฟเฟกต์หน้าจอ',
    group: 'Graphics', icon: 'monitor',
    desc: 'Full-screen post effects (drunk, camera, transitions...).',
    descTh: 'เอฟเฟกต์เต็มหน้าจอ (เมา กล้อง ฉากเปลี่ยน ...)',
    snippet: (e) => `AnimpostfxPlay("${e.name}")
-- stop: AnimpostfxStop("${e.name}")`,
  },
  timecycles: {
    titleTh: 'โทนแสง (Timecycles)',
    group: 'Graphics', icon: 'clock',
    desc: 'Timecycle modifiers (ambient light / color grading presets).',
    descTh: 'timecycle modifier (พรีเซ็ตแสงและโทนสีของบรรยากาศ)',
    snippet: (e) => `SetTimecycleModifier("${e.name}")
-- clear: ClearTimecycleModifier()`,
  },
  markers: {
    titleTh: 'มาร์กเกอร์',
    group: 'Graphics', icon: 'map-pin',
    desc: 'Marker prop hashes drawable with DRAW_MARKER.',
    descTh: 'hash ของ marker ที่วาดได้ด้วย DRAW_MARKER',
    snippet: (e) => `-- DRAW_MARKER (call every frame)
local c = GetEntityCoords(PlayerPedId())
Citizen.InvokeNative(0x2A32FAA57B937173, ${e.hash}, c.x, c.y + 2.0, c.z + 1.0,
  0, 0, 0, 0, 0, 0, 1.0, 1.0, 1.0, 250, 250, 100, 250, 0, 0, 2, 0, 0, 0, 0)`,
  },
  explosion_vfx: {
    titleTh: 'เอฟเฟกต์ระเบิด',
    group: 'Graphics', icon: 'star',
    desc: 'VFX tags for ADD_EXPLOSION_WITH_USER_VFX.',
    descTh: 'VFX tag สำหรับ ADD_EXPLOSION_WITH_USER_VFX',
    snippet: (e) => `-- ADD_EXPLOSION_WITH_USER_VFX (explosionTag 12 = EXP_TAG_BULLET)
Citizen.InvokeNative(0x53BA259F3A67A99E, x, y, z, 12, ${e.hash}, 1.0, true, false, true)`,
  },

  weapons: {
    titleTh: 'อาวุธ',
    group: 'Weapons', icon: 'target',
    desc: 'Weapon hashes by group. "sp only" entries are commented out in the source list (story-mode variants).',
    descTh: 'hash ของอาวุธแยกตามกลุ่ม รายการ "sp only" คือของโหมดเนื้อเรื่องที่ถูกคอมเมนต์ไว้ในต้นฉบับ',
    snippet: (e) => `-- GIVE_WEAPON_TO_PED (params may vary per framework)
Citizen.InvokeNative(0x5E3BDDBCB83F3D84, PlayerPedId(), joaat("${e.name}"),
  100, true, false, 0, false, 0.5, 1.0, 0x2CD419DC, false, 0.0, false)`,
  },
  weapon_components: {
    titleTh: 'ชิ้นส่วนอาวุธ',
    group: 'Weapons', icon: 'tool',
    desc: 'Weapon components (barrels, grips, scopes, wraps) per weapon and slot.',
    descTh: 'ชิ้นส่วนอาวุธ (ลำกล้อง ด้าม กล้องเล็ง ผ้าพัน) แยกตามอาวุธและช่อง',
  },
  ammo: {
    titleTh: 'ชนิดกระสุน',
    group: 'Weapons', icon: 'database',
    desc: 'Ammo type hashes.',
    descTh: 'hash ของประเภทกระสุน',
  },

  tex_blips: {
    titleTh: 'Blips (แผนที่)',
    group: 'Textures', icon: 'navigation',
    desc: 'Map blip sprites (singleplayer set) — every icon with live preview.',
    descTh: 'สไปรต์ blip บนแผนที่ (ชุด singleplayer) — ทุกไอคอนมีภาพตัวอย่าง',
    snippet: blipSnippet,
  },
  tex_blips_mp: {
    titleTh: 'Blips (MP)',
    group: 'Textures', icon: 'compass',
    desc: 'Map blip sprites from the multiplayer set.',
    descTh: 'สไปรต์ blip บนแผนที่จากชุด multiplayer',
    snippet: blipSnippet,
  },
  tex_inventory_items: {
    titleTh: 'ไอคอนไอเทม',
    group: 'Textures', icon: 'briefcase',
    desc: 'Inventory item icons (weapons, ammo, consumables, valuables).',
    descTh: 'ไอคอนไอเทมในกระเป๋า (อาวุธ กระสุน ของกิน ของมีค่า)',
    snippet: drawSpriteSnippet,
  },
  tex_menu_items: {
    titleTh: 'ไอคอนเมนู',
    group: 'Textures', icon: 'list',
    desc: 'Menu item icons.',
    descTh: 'ไอคอนรายการในเมนู',
    snippet: drawSpriteSnippet,
  },
  tex_menu_textures: {
    titleTh: 'พื้นหลังเมนู',
    group: 'Textures', icon: 'layout',
    desc: 'Menu background / decoration textures.',
    descTh: 'เท็กซ์เจอร์พื้นหลัง / ตกแต่งเมนู',
    snippet: drawSpriteSnippet,
  },
  tex_multiwheel_emotes: {
    titleTh: 'วงล้อ Emote',
    group: 'Textures', icon: 'disc',
    desc: 'Emote wheel icons.',
    descTh: 'ไอคอนวงล้อ emote',
    snippet: drawSpriteSnippet,
  },
  tex_overhead: {
    titleTh: 'ไอคอนเหนือหัว',
    group: 'Textures', icon: 'message',
    desc: 'Overhead player icons (voice, waiting, etc.).',
    descTh: 'ไอคอนเหนือหัวผู้เล่น (เสียง กำลังรอ ฯลฯ)',
    snippet: drawSpriteSnippet,
  },
  tex_awards: {
    titleTh: 'รางวัล (MP)',
    group: 'Textures', icon: 'award',
    desc: 'Award / medal icons from multiplayer.',
    descTh: 'ไอคอนรางวัล / เหรียญจาก multiplayer',
    snippet: drawSpriteSnippet,
  },
  tex_collectors_bag: {
    titleTh: 'กระเป๋านักสะสม',
    group: 'Textures', icon: 'gift',
    desc: 'Collector items (tarot cards, coins, eggs, flowers...).',
    descTh: 'ไอเทมนักสะสม (ไพ่ทาโรต์ เหรียญ ไข่ ดอกไม้ ...)',
    snippet: drawSpriteSnippet,
  },
  tex_ui_hud: {
    titleTh: 'เท็กซ์เจอร์ HUD',
    group: 'Textures', icon: 'crosshair',
    desc: 'HUD textures: ammo types, radial menu, quick select and more.',
    descTh: 'เท็กซ์เจอร์ HUD: ชนิดกระสุน เมนูวงกลม quick select และอื่น ๆ',
    snippet: drawSpriteSnippet,
  },
  tex_ui_mp: {
    titleTh: 'เท็กซ์เจอร์ UI (MP)',
    group: 'Textures', icon: 'globe',
    desc: 'Multiplayer UI textures (biggest texture set).',
    descTh: 'เท็กซ์เจอร์ UI ของ multiplayer (ชุดใหญ่ที่สุด)',
    snippet: drawSpriteSnippet,
  },
  tex_startup: {
    titleTh: 'ภาพหน้าโหลด',
    group: 'Textures', icon: 'image',
    desc: 'Loading screen / startup artwork.',
    descTh: 'ภาพหน้าโหลด / อาร์ตเวิร์กตอนเปิดเกม',
    snippet: drawSpriteSnippet,
  },
  tex_swatches: {
    titleTh: 'จานสี UI',
    group: 'Textures', icon: 'droplet',
    desc: 'UI color swatches.',
    descTh: 'จานสี (swatch) ของ UI',
    snippet: drawSpriteSnippet,
  },
  tex_cards: {
    titleTh: 'ไพ่',
    group: 'Textures', icon: 'cards',
    desc: 'Playing card faces used in minigames (poker, blackjack).',
    descTh: 'หน้าไพ่ที่ใช้ในมินิเกม (โป๊กเกอร์ แบล็กแจ็ก)',
    snippet: drawSpriteSnippet,
  },
  tex_domino: {
    titleTh: 'โดมิโน',
    group: 'Textures', icon: 'domino',
    desc: 'Domino tile textures.',
    descTh: 'เท็กซ์เจอร์ตัวโดมิโน',
    snippet: drawSpriteSnippet,
  },

  weather: {
    titleTh: 'สภาพอากาศ',
    group: 'World', icon: 'cloud',
    desc: 'Weather type hashes.',
    descTh: 'hash ของสภาพอากาศ',
    snippet: (e) => `-- SET_WEATHER_TYPE (transition over 15s)
Citizen.InvokeNative(0x59174F1AFE095B5A, joaat("${e.name}"), true, true, true, 15.0, false)`,
  },
  doors: {
    titleTh: 'ประตู (Door Hashes)',
    group: 'World', icon: 'door',
    desc: 'Door hashes with model and world position.',
    descTh: 'hash ของประตู พร้อมโมเดลและพิกัดในโลก',
    snippet: (e) => `-- DOOR_SYSTEM_SET_DOOR_STATE (0 = unlocked, 1 = locked)
Citizen.InvokeNative(0x6BAB9442830C7F53, ${e.doorhash}, 1, false, false)
-- door "${e.model}" is at ${e.x}, ${e.y}, ${e.z}`,
  },
  interiors: {
    titleTh: 'อินทีเรีย (Interiors)',
    group: 'World', icon: 'grid',
    desc: 'Interior ids, type hashes and entry coordinates.',
    descTh: 'id ของ interior, type hash และพิกัดทางเข้า',
    snippet: (e) => `-- teleport to interior "${e.name}"
SetEntityCoords(PlayerPedId(), ${e.x}, ${e.y}, ${e.z}, false, false, false, false)`,
  },
  imaps: {
    titleTh: 'ชิ้นส่วนแผนที่ (IMAPs)',
    group: 'World', icon: 'map',
    desc: 'Map parts (imaps) with hash and coordinates.',
    descTh: 'ชิ้นส่วนแผนที่ (imap) พร้อม hash และพิกัด',
  },
}

export const REPO_URL = 'https://github.com/femga/rdr3_discoveries'
