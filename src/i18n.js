// Tiny i18n: reactive locale (persisted) + t() lookup with {param} interpolation.
// Category descriptions/titles live in categories.js (desc/descTh, titleTh);
// use catDesc(meta) and catTitle(manifestEntry).
import { ref } from 'vue'
import { CATEGORY_META } from './categories.js'

const stored = localStorage.getItem('locale')
export const locale = ref(stored === 'th' ? 'th' : 'en')
document.documentElement.lang = locale.value

export function setLocale(l) {
  locale.value = l
  localStorage.setItem('locale', l)
  document.documentElement.lang = l
}

export function toggleLocale() {
  setLocale(locale.value === 'en' ? 'th' : 'en')
}

const messages = {
  en: {
    tagline: 'developer explorer',
    home: 'Home',
    switchLang: 'เปลี่ยนเป็นภาษาไทย',
    switchLight: 'switch to light mode',
    switchDark: 'switch to dark mode',
    dataFrom: 'data:',
    'group.Models': 'Models',
    'group.Animations': 'Animations',
    'group.Audio': 'Audio',
    'group.Graphics': 'Graphics',
    'group.Textures': 'Textures',
    'group.Weapons': 'Weapons',
    'group.World': 'World',
    'group.Other': 'Other',
    hero1: 'Searchable reference for',
    hero2: 'game data — peds, weapons, animations, audio, particle effects and more. Click any entry to get a ready-to-paste Lua snippet. Data from',
    entries: 'entries',
    categories: 'categories',
    groups: 'groups',
    hashCalc: 'joaat / GetHashKey calculator',
    hashPlaceholder: 'type a name, e.g. "a_c_bear_01"',
    copy: 'copy',
    copyName: 'copy name',
    searchPlaceholder: 'Search {n} entries…',
    allFacet: 'all {f}s',
    results: '{n} results',
    loading: 'Loading {n} entries…',
    showMore: 'Show more ({n} remaining)',
    showMoreGroups: 'Show more ({n} groups remaining)',
    memberCount: '{n} {label}s',
    details: 'details',
    location: 'location',
    viewList: 'list',
    viewMap: 'map',
    mapHint: 'drag to pan · scroll to zoom · click a point for details',
    resetZoom: 'reset zoom',
    luaExample: 'lua example',
    copyCode: 'copy code',
    viewSource: 'view source data on GitHub ↗',
    close: 'close',
    copied: 'Copied: ',
    failedManifest: 'Failed to load data manifest: ',
    failedData: 'Failed to load data: ',
    'facet.group': 'group',
    'facet.status': 'status',
    'facet.category': 'category',
    'facet.ped type': 'ped type',
    'facet.mode': 'mode',
    'facet.weapon': 'weapon',
    'facet.slot': 'slot',
    'facet.type': 'type',
    'facet.dict': 'dict',
    /* redesign */
    globalSearch: 'Search models, hashes, animations…',
    searchBig: 'Search {n} discoveries…',
    indexing: 'Indexing data… {p}%',
    typeToSearch: 'Type at least 2 characters to search everything',
    noResultsFor: 'No discoveries found for "{q}"',
    tryTitle: 'Try:',
    tryFilters: 'removing filters',
    tryPartial: 'searching a partial name',
    tryHash: 'searching by hash (0x…)',
    retry: 'Retry',
    discover: 'Discover',
    overview: 'Overview',
    bookmarks: 'Bookmarks',
    noBookmarks: 'No bookmarks yet — press the star on any entry.',
    recentlyViewed: 'Recently viewed',
    densityComfortable: 'comfortable',
    densityCompact: 'compact',
    densityDense: 'dense',
    clearAll: 'Clear all',
    sortToggle: 'toggle sort order',
    share: 'copy link',
    related: 'related',
    navigate: 'navigate',
    open: 'open',
    closeKey: 'close',
    commands: 'Commands',
    cmdToggleTheme: 'Toggle theme',
    cmdToggleLang: 'เปลี่ยนเป็นภาษาไทย',
    cmdBookmarks: 'Open bookmarks',
    cmdHome: 'Go to overview',
    heroTagline: 'Explore the hidden systems, assets and APIs\nbehind Red Dead Redemption 2 / RedM.',
    quickAccess: 'Quick access',
    statEntries: 'discoveries',
    statCategories: 'categories',
    statImages: 'preview images',
    viewGallery: 'gallery',
    imagePreview: 'preview',
    creditImages: 'model previews: RedLookup / BryceCanyonCounty',
  },
  th: {
    tagline: 'คลังข้อมูลสำหรับนักพัฒนา',
    home: 'หน้าแรก',
    switchLang: 'Switch to English',
    switchLight: 'เปลี่ยนเป็นโหมดสว่าง',
    switchDark: 'เปลี่ยนเป็นโหมดมืด',
    dataFrom: 'ข้อมูล:',
    'group.Models': 'โมเดล',
    'group.Animations': 'แอนิเมชัน',
    'group.Audio': 'เสียง',
    'group.Graphics': 'กราฟิก',
    'group.Textures': 'เท็กซ์เจอร์',
    'group.Weapons': 'อาวุธ',
    'group.World': 'โลก',
    'group.Other': 'อื่น ๆ',
    hero1: 'คลังข้อมูลแบบค้นหาได้สำหรับเกม',
    hero2: '— โมเดลตัวละคร อาวุธ แอนิเมชัน เสียง เอฟเฟกต์อนุภาค และอื่น ๆ คลิกที่รายการใดก็ได้เพื่อรับโค้ด Lua พร้อมใช้งาน ข้อมูลจาก',
    entries: 'รายการ',
    categories: 'หมวดหมู่',
    groups: 'กลุ่ม',
    hashCalc: 'เครื่องคำนวณ joaat / GetHashKey',
    hashPlaceholder: 'พิมพ์ชื่อ เช่น "a_c_bear_01"',
    copy: 'คัดลอก',
    copyName: 'คัดลอกชื่อ',
    searchPlaceholder: 'ค้นหา {n} รายการ…',
    allFacet: '{f} ทั้งหมด',
    results: '{n} ผลลัพธ์',
    loading: 'กำลังโหลด {n} รายการ…',
    showMore: 'แสดงเพิ่ม (เหลืออีก {n})',
    showMoreGroups: 'แสดงเพิ่ม (เหลืออีก {n} กลุ่ม)',
    memberCount: '{n} รายการ',
    details: 'รายละเอียด',
    location: 'ตำแหน่งบนแผนที่',
    viewList: 'รายการ',
    viewMap: 'แผนที่',
    mapHint: 'ลากเพื่อเลื่อน · สกรอลล์เพื่อซูม · คลิกจุดเพื่อดูรายละเอียด',
    resetZoom: 'รีเซ็ตซูม',
    luaExample: 'ตัวอย่างโค้ด lua',
    copyCode: 'คัดลอกโค้ด',
    viewSource: 'ดูข้อมูลต้นฉบับบน GitHub ↗',
    close: 'ปิด',
    copied: 'คัดลอกแล้ว: ',
    failedManifest: 'โหลดรายการข้อมูลไม่สำเร็จ: ',
    failedData: 'โหลดข้อมูลไม่สำเร็จ: ',
    'facet.group': 'กลุ่ม',
    'facet.status': 'สถานะ',
    'facet.category': 'หมวด',
    'facet.ped type': 'ประเภท ped',
    'facet.mode': 'โหมด',
    'facet.weapon': 'อาวุธ',
    'facet.slot': 'ช่อง',
    'facet.type': 'ประเภท',
    'facet.dict': 'dict',
    /* redesign */
    globalSearch: 'ค้นหาโมเดล, hash, แอนิเมชัน…',
    searchBig: 'ค้นหา {n} รายการ…',
    indexing: 'กำลังทำดัชนีข้อมูล… {p}%',
    typeToSearch: 'พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหาทั้งหมด',
    noResultsFor: 'ไม่พบข้อมูลสำหรับ "{q}"',
    tryTitle: 'ลอง:',
    tryFilters: 'เอาตัวกรองออก',
    tryPartial: 'ค้นหาด้วยชื่อบางส่วน',
    tryHash: 'ค้นหาด้วย hash (0x…)',
    retry: 'ลองใหม่',
    discover: 'เริ่มต้น',
    overview: 'ภาพรวม',
    bookmarks: 'บุ๊กมาร์ก',
    noBookmarks: 'ยังไม่มีบุ๊กมาร์ก — กดรูปดาวที่รายการใดก็ได้',
    recentlyViewed: 'ดูล่าสุด',
    densityComfortable: 'สบายตา',
    densityCompact: 'มาตรฐาน',
    densityDense: 'แน่น',
    clearAll: 'ล้างทั้งหมด',
    sortToggle: 'สลับการเรียงลำดับ',
    share: 'คัดลอกลิงก์',
    related: 'ที่เกี่ยวข้อง',
    navigate: 'เลื่อน',
    open: 'เปิด',
    closeKey: 'ปิด',
    commands: 'คำสั่ง',
    cmdToggleTheme: 'สลับธีม',
    cmdToggleLang: 'Switch to English',
    cmdBookmarks: 'เปิดบุ๊กมาร์ก',
    cmdHome: 'ไปหน้าภาพรวม',
    heroTagline: 'สำรวจระบบ ทรัพยากร และ API ที่ซ่อนอยู่\nเบื้องหลัง Red Dead Redemption 2 / RedM',
    quickAccess: 'เข้าถึงด่วน',
    statEntries: 'รายการข้อมูล',
    statCategories: 'หมวดหมู่',
    statImages: 'รูปตัวอย่าง',
    viewGallery: 'แกลเลอรี',
    imagePreview: 'ภาพตัวอย่าง',
    creditImages: 'ภาพโมเดล: RedLookup / BryceCanyonCounty',
  },
}

export function t(key, params) {
  const dict = messages[locale.value] || messages.en
  let s = dict[key] ?? messages.en[key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.replaceAll('{' + k + '}', v)
  }
  return s
}

// Localized category description: meta from CATEGORY_META.
export function catDesc(meta) {
  if (!meta) return ''
  return (locale.value === 'th' && meta.descTh) || meta.desc || ''
}

// Localized category title: cat is a manifest entry ({ id, title }).
export function catTitle(cat) {
  if (!cat) return ''
  const meta = CATEGORY_META[cat.id]
  return (locale.value === 'th' && meta && meta.titleTh) || cat.title
}
