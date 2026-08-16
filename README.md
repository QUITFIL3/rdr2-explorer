# RDR3 Discoveries — Developer Knowledge Base

ฐานข้อมูลสำหรับนักพัฒนา **RedM / RDR2** — ค้นหาข้อมูลเกมกว่า 411,000 รายการใน 39 หมวด
(peds, weapons, animations, audio, ptfx, world ฯลฯ) จาก
[femga/rdr3_discoveries](https://github.com/femga/rdr3_discoveries)
พร้อมโค้ดตัวอย่าง Lua พร้อมใช้, รูปตัวอย่างโมเดล/เท็กซ์เจอร์, แผนที่พิกัด และ Command Palette

สร้างด้วย **Vue 3 + Vite** — ทำงานแบบ local ทั้งหมด ไม่พึ่งเซิร์ฟเวอร์ภายนอก

## วิธีใช้งาน

```bash
npm install
npm run dev        # เปิด http://localhost:5173
npm run build      # ไฟล์ static ทั้งหมดอยู่ใน dist/
```

## ฟีเจอร์

- **Command Palette (Ctrl+K / Ctrl+P / `/`)** — ค้นหาทุกหมวดพร้อมกัน 411k รายการ + hash (0x…)
  จัดอันดับ exact > prefix > substring, นำทางด้วยคีย์บอร์ดเต็มรูปแบบ
- **สลับภาษา ไทย / English** ครบทุกจุด (ชื่อหมวด, คำอธิบาย, ตัวกรอง, toast) — จำค่าใน localStorage
- **Dark mode จริง** (ค่าเริ่มต้น) + light theme — แผนที่สลับภาพมืด/สว่างตามธีม
- **Explorer ต่อหมวด** — ค้นหา realtime, ตัวกรอง + filter chips, เรียงลำดับ, ความหนาแน่น 3 ระดับ,
  มุมมอง list / gallery / map, skeleton loading, empty & error state
- **URL แชร์ได้** — search / filter / รายการที่เลือก อยู่ใน URL (`#/c/anims?q=smoke&sel=...`)
  รองรับ back / forward โดยไม่รีเซ็ตตัวกรอง
- **Detail panel** — hash (hex/uint/int), รายละเอียดทุก field กด copy ได้, โค้ด Lua พร้อม copy,
  รูปตัวอย่าง, แผนที่ตำแหน่ง, รายการเกี่ยวข้อง, ปุ่มแชร์ลิงก์
- **Bookmarks + ดูล่าสุด** — เก็บใน localStorage, มีหน้ารวมบุ๊กมาร์กแยกตามหมวด
- **รูปตัวอย่าง**: เท็กซ์เจอร์ 6,172 รูป (พื้นหลังโปร่งใส), โมเดล ped/vehicle/object ~11,000 รูป,
  ไอคอนอาวุธ/กระสุน/pickups จับคู่จาก inventory icons
- **แผนที่โลก RDR2** — หมวดที่มีพิกัด (doors, interiors, imaps) มีแผนที่รวมทุกจุด
  ซูม/แพน/คลิกเลือกได้ + หมุดเดี่ยวใน detail panel
- เครื่องคำนวณ `joaat` / `GetHashKey` ในหน้าแรก

## การเตรียมข้อมูล (ทำครั้งเดียว / เมื่อต้องการอัปเดต)

1. clone repo ข้อมูล: `git clone --depth 1 https://github.com/femga/rdr3_discoveries <path>`
2. แปลงเป็น JSON: `node scripts/parse-data.mjs <path>` → เขียนลง `public/data/`
3. โหลดรูปเท็กซ์เจอร์: `npm run download-images` → `public/images/samples/` (รันซ้ำได้ ข้ามไฟล์ที่มี)
4. ลบพื้นหลังสีเทาในรูป: `npm run remove-backgrounds` (Windows เท่านั้น, flood-fill จากขอบ)
5. โหลดรูปโมเดล ped/vehicle/object: `npm run download-model-images`
   → `public/images/models/` + ดัชนี `public/data/model_images.json`

> โฟลเดอร์รูป (`public/images/samples/`, `public/images/models/`) ไม่ถูก commit ลง git
> เพราะขนาดหลาย GB — รันสคริปต์ข้อ 3–5 เพื่อสร้างใหม่ได้เสมอ

## โครงสร้าง

```text
src/
├── App.vue                    # AppShell: topbar + sidebar + main + palette
├── main.js
├── categories.js              # metadata ต่อหมวด: กลุ่ม, ไอคอน, คำอธิบาย EN/TH, Lua snippet
├── i18n.js                    # ระบบสองภาษา: t(), catTitle(), catDesc()
├── icons.js                   # ชุดไอคอน SVG inline
├── theme.js                   # ธีม dark (ค่าเริ่มต้น) / light
├── styles/
│   ├── tokens.css             # design tokens: สี, spacing, radius, motion, z-index
│   ├── base.css               # reset, typography, scrollbar, toast
│   └── components.css         # primitives: chip, badge, btn, row, skeleton, states
├── lib/
│   ├── joaat.js               # Jenkins one-at-a-time hash + copy toast
│   ├── router.js              # hash router + URL query state
│   ├── searchIndex.js         # ดัชนีค้นหากลาง (411k ชื่อ + hash) โหลดแบบ lazy
│   ├── storage.js             # bookmarks / recents / density (localStorage)
│   └── modelImages.js         # จับคู่ชื่อโมเดล → ไอคอน inventory
└── components/
    ├── common/                # Icon, CodeBlock
    ├── navigation/            # Topbar, Sidebar, CommandPalette
    └── discovery/             # HomeView, CategoryView, DiscoveryPanel,
                               # BookmarksView, CategoryMap, WorldMap
scripts/
├── parse-data.mjs             # แปลง Lua ของ repo ต้นทางเป็น JSON
├── download-images.mjs        # โหลดรูปเท็กซ์เจอร์ตัวอย่าง
├── remove-image-backgrounds.ps1  # ทำพื้นหลังรูปให้โปร่งใส (in-place)
└── download-model-images.mjs  # โหลดรูปโมเดลจาก BryceCanyonCounty/rdr3-nativedb-data
```

## แผนที่และพิกัด

ภาพแผนที่ (`public/images/rdr2map.jpg` + `rdr2map_dark.jpg`) ต่อจาก map tile ที่ zoom 4
สูตรแปลงพิกัดเกม → ตำแหน่งบนภาพ มาจาก
[jeanropke/RDR2CollectorsMap](https://github.com/jeanropke/RDR2CollectorsMap):
`lat = 0.01552y − 63.6`, `lng = 0.01552x + 111.29` (map space 176×144)

## เครดิตข้อมูล

- ข้อมูลเกมทั้งหมด: [femga/rdr3_discoveries](https://github.com/femga/rdr3_discoveries)
- รูปโมเดล ped/vehicle/object: [BryceCanyonCounty/rdr3-nativedb-data](https://github.com/BryceCanyonCounty/rdr3-nativedb-data) (RedLookup.com)
- ภาพเกมเป็นลิขสิทธิ์ของ Rockstar Games — ใช้เพื่อการศึกษา/อ้างอิงของชุมชนนักพัฒนา
