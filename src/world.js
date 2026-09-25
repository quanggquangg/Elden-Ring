'use strict';
// Gravebound — Dữ liệu thế giới và hình ảnh dựng sẵn
// ───────────────────────── thế giới ─────────────────────────
// Thế giới chính: x từ WX0 tới MAPW, y từ WY0 tới H.
// Phía đông x > 5000 là các khu biệt lập (Cõi Aurum, Sảnh Hearthhold, hầm ngục), chỉ tới được bằng dịch chuyển.
const WX0 = -2800, WY0 = -1800, MAPW = 4400, H = 3600, W = 11600;
// độ khó chung: quái máu trâu hơn và đánh đau hơn
const DIFF = { hp: 1.25, dmg: 1.3 };
const ARENA = { x: 1000, y: 420, w: 800, h: 680 };
const ARENA2 = { x: 1050, y: -1560, w: 700, h: 420 }; // Sân Ngai Sunthrone trong Kinh Thành
const TREE_POS = { x: 1400, y: -1720 };
const SWAMP = { x: 2060, y: 1230, w: 720, h: 790 };
const LAIR = { x: 2420, y: 1620 };
const POOLS = [[2150, 1300, 70, 40], [2300, 1420, 90, 45], [2600, 1300, 80, 50], [2680, 1500, 60, 90], [2150, 1500, 60, 80], [2250, 1850, 100, 50], [2550, 1900, 90, 55], [2700, 1800, 50, 70], [2440, 1400, 70, 35], [2600, 1690, 60, 40]];
function inPool(x, y) {
  for (const [px, py, rx, ry] of POOLS) { const dx = (x - px) / rx, dy = (y - py) / ry; if (dx * dx + dy * dy < 1) return true; }
  return false;
}
// Hồ Crystalmere: nước nông làm chậm bước, các đảo nhỏ nằm giữa hồ
const LAKE = [[-1400, 1450, 850, 600], [-2250, 2250, 380, 260], [-500, 900, 280, 170], [-800, 2250, 260, 160]];
const ISLES = [[-1750, 1250, 190, 130], [-950, 1700, 170, 120], [-1450, 1800, 130, 90]];
const inEll = (x, y, [px, py, rx, ry], m = 0) => { const dx = (x - px) / (rx + m), dy = (y - py) / (ry + m); return dx * dx + dy * dy < 1; };
function inWater(x, y, m = 0) {
  if (x > 0 || y < 380 || y > 2600) return false;
  if (!LAKE.some(l => inEll(x, y, l, m))) return false;
  return !ISLES.some(l => inEll(x, y, l, -m));
}
function clampLair(x, y, m = 540) { const dx = x - LAIR.x, dy = y - LAIR.y, l = Math.hypot(dx, dy); return l > m ? [LAIR.x + dx / l * m, LAIR.y + dy / l * m] : [x, y]; }
const ROAD = [[1400, 3200], [1380, 2850], [1500, 2450], [1340, 2050], [1430, 1650], [1400, 1128]];
const ROADS = [ROAD,
  [[1500, 2450], [1900, 2420], [2400, 2560], [2900, 2850], [3600, 2880]],
  [[2900, 2850], [2920, 2300], [2900, 1800], [3300, 1720], [3600, 1560], [3600, 1320]],
  // miền Tây
  [[420, 1905], [0, 1910], [-500, 1980], [-1100, 2150], [-1600, 2200], [-2100, 1900], [-2450, 1300], [-2300, 900], [-1900, 600], [-1550, 440]],
  [[0, 1910], [-250, 1500], [-150, 1150], [-300, 600], [-900, 500], [-1550, 440]],
  [[0, 3050], [-700, 3080], [-1500, 3150], [-1900, 2950], [-1700, 2600], [-1600, 2200]],
  // phía Bắc
  [[1400, 380], [1400, -100], [1350, -500], [1400, -900], [1400, -1140]],
  [[1350, -100], [2000, -250], [2700, -250], [3300, -700], [3600, -1100], [3900, -1450]],
  [[1350, -500], [600, -300], [250, -100]],
];
const FORT = { x: 3200, y: 500, w: 800, h: 800 };
const ACAD = { x: -2300, y: -900, w: 1500, h: 1300 };
const CAPITAL = { x: 300, y: -1800, w: 2200, h: 900 };
const COLO = { x: 3600, y: 3230, rect: { x: 3200, y: 2950, w: 800, h: 560 } };
const FOREST = { x: 2850, y: 1900, w: 1500, h: 900 };
const BARRIER = { x: 3650, y: 2350, r: 150 };
const BRAZIERS = [{ id: 'e', x: 3780, y: 1440 }, { id: 'n', x: 3600, y: 1370 }, { id: 'w', x: 3420, y: 1440 }];
const BRAZIER_ORDER = ['e', 'n', 'w'];
const STATUES = [{ id: 's1', x: 2980, y: 1980 }, { id: 's2', x: 4250, y: 1990 }, { id: 's3', x: 2990, y: 2720 }, { id: 's4', x: 4240, y: 2720 }];
const FLAG = { x: 3600, y: 3230 };

// ───────────────────────── khu biệt lập ─────────────────────────
const RC = { x: 5500, y: 500, r: 420 }; // đấu trường trận cuối trong Cõi Aurum
const HUB = { x: 6100, y: 0, w: 1000, h: 900 };
// Hầm ngục phụ: mỗi hầm có cửa vào ngoài thế giới, ân điển ở lối vào và một boss ở phòng cuối
const DUNGEONS = [
  { id: 'd1', name: 'Hầm Mộ Tidewrack', ex: -1600, ey: 3380, boss: 'graveknight', mul: 1.2, theme: 'crypt', reward: { tal: 'vital', pouch: 1, items: { somber1: 1 } } },
  { id: 'd2', name: 'Mỏ Shardvein', ex: -2450, ey: 1650, boss: 'minerg', mul: 1.45, theme: 'crystal', reward: { weapon: 'staff3', items: { stone2: 2, somber1: 1 } } },
  { id: 'd3', name: 'Hang Emberdeep', ex: 4250, ey: 760, boss: 'golem', mul: 1.4, theme: 'fire', reward: { tal: 'shieldtal', items: { somber2: 1, stone2: 2 } } },
  { id: 'd4', name: 'Hầm Mộ Kingsrest', ex: 3900, ey: -1500, boss: 'royalchamp', mul: 1.8, theme: 'royal', reward: { weapon: 'royalsword', mem: 1, tal: 'gold' } },
];
DUNGEONS.forEach((d, i) => { d.area = { x: 7200 + i * 1100, y: 0, w: 1000, h: 1600 }; d.grace = 30 + i; d.bossRoom = { x: d.area.x + 28, y: 28, w: 944, h: 544 }; });
const AREAS = [
  { id: 'realm', x: 5000, y: 0, w: 1000, h: 1000, name: 'Cõi Aurum' },
  Object.assign({ id: 'hub', name: 'Sảnh Hearthhold' }, HUB),
  ...DUNGEONS.map(d => Object.assign({ id: d.id, name: d.name, dg: d }, d.area)),
];
function areaAt(x, y) {
  if (x < 4800) return null;
  for (const a of AREAS) if (x >= a.x - 60 && x <= a.x + a.w + 60 && y >= a.y - 60 && y <= a.y + a.h + 60) return a;
  return null;
}
const dungeonAt = (x, y) => { const a = areaAt(x, y); return a && a.dg ? a.dg : null; };

// Bia Bản Đồ đặt gần lối vào mỗi vùng, trên đường chính (như Elden Ring, tháp trong Zelda BotW).
// Bia chỉ mở bản đồ dạng phác thảo: thấy địa hình và tên vùng; nơi đã tự đi qua mới hiện đầy đủ.
// Bí mật (rương, tượng, lò lửa, tường ảo, bên trong pháo đài) không bao giờ hiện lên bản đồ.
const MAP_FRAGS = [
  { id: 'm1', x: 1180, y: 2650, name: 'Đồng Cỏ Phía Nam', rects: [{ x: 0, y: 2230, w: 2050, h: 1370 }] },
  { id: 'm2', x: 1620, y: 1380, name: 'Miền Bắc', rects: [{ x: 0, y: 420, w: 2100, h: 1180 }] },
  { id: 'm3', x: 2150, y: 2080, name: 'Đầm Lầy Ashmire', rects: [{ x: 2000, y: 1000, w: 800, h: 1100 }] },
  { id: 'm4', x: 3020, y: 1700, name: 'Cao Nguyên Cinderreach', rects: [{ x: 2800, y: 420, w: 1600, h: 1480 }] },
  { id: 'm5', x: 3060, y: 2250, name: 'Rừng Wraithwood', rects: [{ x: 2850, y: 1900, w: 1500, h: 900 }] },
  { id: 'm6', x: 3320, y: 2815, name: 'Vùng Nam Phía Đông', rects: [{ x: 2800, y: 2800, w: 1600, h: 800 }] },
  { id: 'm7', x: -200, y: 1990, name: 'Hồ Crystalmere', rects: [{ x: -2800, y: 400, w: 2800, h: 2200 }] },
  { id: 'm8', x: -220, y: 3120, name: 'Bờ Biển Saltreach', rects: [{ x: -2800, y: 2600, w: 2800, h: 1000 }] },
  { id: 'm9', x: -1700, y: 340, name: 'Học Viện Starhollow', rects: [ACAD] },
  { id: 'm10', x: 1480, y: 250, name: 'Cao Nguyên Aurelia', rects: [{ x: 0, y: -900, w: 4400, h: 1300 }, { x: 2500, y: -1800, w: 1900, h: 900 }] },
  { id: 'm11', x: 1250, y: -990, name: 'Kinh Thành Aurumhold', rects: [CAPITAL] },
];
// sương mù bản đồ: mỗi ô 100×100 đơn vị, mở ra khi người chơi đi qua
const EXP_CELL = 100, EXP_COLS = Math.ceil((MAPW - WX0) / EXP_CELL), EXP_ROWS = Math.ceil((H - WY0) / EXP_CELL);
const EXP = new Uint8Array(EXP_COLS * EXP_ROWS);
function explore(x, y, r) {
  if (x > MAPW + 100) return;
  const c0 = Math.max(0, Math.floor((x - r - WX0) / EXP_CELL)), c1 = Math.min(EXP_COLS - 1, Math.floor((x + r - WX0) / EXP_CELL));
  const r0 = Math.max(0, Math.floor((y - r - WY0) / EXP_CELL)), r1 = Math.min(EXP_ROWS - 1, Math.floor((y + r - WY0) / EXP_CELL));
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
    if (dist(x, y, WX0 + (cx + 0.5) * EXP_CELL, WY0 + (cy + 0.5) * EXP_CELL) < r) EXP[cy * EXP_COLS + cx] = 1;
  }
}
function expEncode() { let out = ''; for (let i = 0; i < EXP.length; i += 4) out += ((EXP[i] | 0) | (EXP[i + 1] | 0) << 1 | (EXP[i + 2] | 0) << 2 | (EXP[i + 3] | 0) << 3).toString(16); return out; }
function expDecode(str) {
  EXP.fill(0);
  if (!str) return;
  for (let k = 0; k < str.length; k++) { const v = parseInt(str[k], 16) || 0; for (let b = 0; b < 4; b++) if (k * 4 + b < EXP.length) EXP[k * 4 + b] = (v >> b) & 1; }
}
function fragAt(x, y) { return !inRect(x, y, FORT) && MAP_FRAGS.some(f => S.frags.includes(f.id) && f.rects.some(r => inRect(x, y, r))); }
function revealedAt(x, y) {
  const cx = Math.floor((x - WX0) / EXP_CELL), cy = Math.floor((y - WY0) / EXP_CELL);
  if (cx >= 0 && cy >= 0 && cx < EXP_COLS && cy < EXP_ROWS && EXP[cy * EXP_COLS + cx]) return true;
  return fragAt(x, y);
}
const inRect = (x, y, r, m = 0) => x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m;

// ───────────────────────── tường ─────────────────────────
const WALLS = [
  // đấu trường của Varek
  { x: 972, y: 392, w: 28, h: 736 }, { x: 1800, y: 392, w: 28, h: 736 },
  { x: 972, y: 392, w: 388, h: 28 }, { x: 1440, y: 392, w: 388, h: 28 },
  { x: 972, y: 1100, w: 388, h: 28 }, { x: 1440, y: 1100, w: 388, h: 28 },
  { x: 1360, y: 392, w: 80, h: 28, gate: 'north' },
  { x: 1360, y: 1100, w: 80, h: 28, gate: 'fog' },
  // vách đá ngăn Cao Nguyên Aurelia với miền dưới, rìa phía đông
  { x: 0, y: 380, w: 972, h: 40, cliff: true }, { x: 1828, y: 380, w: MAPW - 1828, h: 40, cliff: true }, { x: MAPW, y: WY0, w: 90, h: H - WY0, void: true },
  // vách đá ngăn miền Tây, có hai lối qua: cạnh tàn tích và phía nam ra bờ biển
  { x: -40, y: 400, w: 40, h: 1460, cliff: true }, { x: -40, y: 1960, w: 40, h: 990, cliff: true }, { x: -40, y: 3150, w: 40, h: 450, cliff: true },
  // vực tối ở phía tây bắc
  { x: WX0, y: WY0, w: 300 - WX0, h: 900, void: true }, { x: WX0, y: -900, w: 500, h: 1300, void: true }, { x: -800, y: -900, w: 800, h: 1300, void: true },
  // biển phía tây nam
  { x: WX0, y: 2600, w: 320, h: 1000, sea: true },
  // nhà nguyện khởi đầu
  { x: 1250, y: 3200, w: 100, h: 22 }, { x: 1450, y: 3200, w: 100, h: 22 },
  { x: 1250, y: 3200, w: 22, h: 260 }, { x: 1528, y: 3200, w: 22, h: 260 }, { x: 1250, y: 3438, w: 300, h: 22 },
  // tàn tích phía tây
  { x: 420, y: 1650, w: 220, h: 24 }, { x: 760, y: 1650, w: 220, h: 24 },
  { x: 420, y: 1650, w: 24, h: 200 }, { x: 956, y: 1650, w: 24, h: 150 },
  { x: 420, y: 1960, w: 24, h: 204 }, { x: 420, y: 2140, w: 300, h: 24 },
  { x: 840, y: 2140, w: 140, h: 24 }, { x: 956, y: 1900, w: 24, h: 264 },
  { x: 600, y: 1860, w: 90, h: 20 },
  // Pháo Đài Greystone
  { x: 3200, y: 500, w: 800, h: 28 }, { x: 3200, y: 500, w: 28, h: 800 }, { x: 3972, y: 500, w: 28, h: 800 },
  { x: 3200, y: 1272, w: 340, h: 28 }, { x: 3660, y: 1272, w: 340, h: 28 }, { x: 3540, y: 1272, w: 120, h: 28, gate: 'fort' },
  { x: 3400, y: 528, w: 28, h: 260 }, { x: 3772, y: 528, w: 28, h: 260 }, { x: 3400, y: 760, w: 140, h: 28 }, { x: 3660, y: 760, w: 140, h: 28 },
  { x: 3228, y: 1100, w: 112, h: 24 }, { x: 3340, y: 1100, w: 24, h: 172, illusory: 'w_fort' },
  // căn nhà không cửa
  { x: 2950, y: 3150, w: 150, h: 22 }, { x: 2950, y: 3150, w: 22, h: 150 }, { x: 3078, y: 3150, w: 22, h: 150 }, { x: 2950, y: 3278, w: 150, h: 22, illusory: 'w_hut' },
  // Đấu Trường Bloodsand
  { x: 3200, y: 2950, w: 340, h: 28 }, { x: 3660, y: 2950, w: 340, h: 28 }, { x: 3540, y: 2950, w: 120, h: 28, gate: 'colo' },
  { x: 3200, y: 2950, w: 28, h: 560 }, { x: 3972, y: 2950, w: 28, h: 560 }, { x: 3200, y: 3482, w: 800, h: 28 },
  // Học Viện Starhollow: sân trước, cánh tây, thư viện và phòng của nữ hoàng
  { x: -2328, y: -928, w: 28, h: 1348, acad: true }, { x: -800, y: -928, w: 28, h: 1348, acad: true }, { x: -2328, y: -928, w: 1556, h: 28, acad: true },
  { x: -2328, y: 380, w: 728, h: 40, acad: true }, { x: -1600, y: 380, w: 100, h: 40, gate: 'acad' }, { x: -1500, y: 380, w: 728, h: 40, acad: true },
  { x: -2300, y: 72, w: 100, h: 28, acad: true }, { x: -2080, y: 72, w: 880, h: 28, acad: true }, { x: -1200, y: 72, w: 100, h: 28, gate: 'lever', lever: 'acad_sc' }, { x: -1100, y: 72, w: 300, h: 28, acad: true },
  { x: -1900, y: -380, w: 28, h: 452, acad: true },
  { x: -2300, y: -528, w: 800, h: 28, acad: true }, { x: -1500, y: -528, w: 100, h: 28, gate: 'dg', dg: 'acad' }, { x: -1400, y: -528, w: 600, h: 28, acad: true },
  { x: -1028, y: 100, w: 28, h: 188, illusory: 'w_acad', acad: true }, { x: -1028, y: 260, w: 228, h: 28, acad: true },
  { x: -1840, y: -430, w: 240, h: 26, shelf: true }, { x: -1520, y: -430, w: 240, h: 26, shelf: true }, { x: -1200, y: -430, w: 240, h: 26, shelf: true },
  { x: -1840, y: -270, w: 240, h: 26, shelf: true }, { x: -1520, y: -270, w: 240, h: 26, shelf: true }, { x: -1200, y: -270, w: 240, h: 26, shelf: true },
  { x: -1840, y: -110, w: 240, h: 26, shelf: true }, { x: -1520, y: -110, w: 240, h: 26, shelf: true },
  // Kinh Thành Aurumhold: tường thành, cổng lớn cần ba Đại Ấn, cửa hông mở bằng cần gạt bên trong
  { x: 300, y: -928, w: 1040, h: 28 }, { x: 1340, y: -928, w: 120, h: 28, gate: 'great' }, { x: 1460, y: -928, w: 1040, h: 28 },
  { x: 300, y: -1800, w: 28, h: 872 }, { x: 2472, y: -1800, w: 28, h: 680 }, { x: 2472, y: -1120, w: 28, h: 120, gate: 'lever', lever: 'cap_side' }, { x: 2472, y: -1000, w: 28, h: 72 },
  // Sân Ngai Sunthrone (Varek trở lại) và lối lên Cây Aurum
  { x: 1022, y: -1800, w: 28, h: 688 }, { x: 1750, y: -1800, w: 28, h: 688 },
  { x: 1022, y: -1140, w: 328, h: 28 }, { x: 1350, y: -1140, w: 100, h: 28, gate: 'fog2' }, { x: 1450, y: -1140, w: 328, h: 28 },
  { x: 1050, y: -1588, w: 300, h: 28 }, { x: 1350, y: -1588, w: 100, h: 28, gate: 'north2' }, { x: 1450, y: -1588, w: 300, h: 28 },
  // nhà cửa trong Kinh Thành
  ...[[400, -1700, 250, 200], [750, -1700, 200, 300], [400, -1400, 200, 220], [700, -1300, 260, 150], [420, -1100, 180, 120], [760, -1080, 200, 90],
    [1850, -1700, 250, 250], [2180, -1720, 220, 200], [1850, -1380, 200, 200], [2150, -1420, 250, 160], [1860, -1100, 220, 120], [2200, -1180, 180, 130]]
    .map(([x, y, w, h]) => ({ x, y, w, h, bld: true })),
  // Sảnh Hearthhold
  { x: HUB.x, y: 0, w: HUB.w, h: 28 }, { x: HUB.x, y: HUB.h - 28, w: HUB.w, h: 28 }, { x: HUB.x, y: 0, w: 28, h: HUB.h }, { x: HUB.x + HUB.w - 28, y: 0, w: 28, h: HUB.h },
];
const LEVERS = [{ id: 'acad_sc', x: -1150, y: 40, name: 'Cửa tắt Học Viện' }, { id: 'cap_side', x: 2430, y: -1060, name: 'Cửa hông Kinh Thành' }];
const TRAPS = [];
const DOORS = [];
// Mỗi hầm ngục dựng từ cùng một khung ba gian: sảnh vào, gian giữa và phòng boss (tọa độ cục bộ 1000×1600)
function buildDungeon(d) {
  const ox = d.area.x, L = (x, y, w, h, o = {}) => WALLS.push(Object.assign({ x: ox + x, y, w, h, dgw: d.theme }, o));
  L(0, 0, 1000, 28); L(0, 1572, 1000, 28); L(0, 0, 28, 1600); L(972, 0, 28, 1600);
  L(28, 1072, 412, 28); L(560, 1072, 412, 28);
  if (d.theme === 'crypt') L(440, 1072, 120, 28, { gate: 'lever', lever: 'd1_door' });
  L(250, 1100, 28, 260); L(722, 1100, 28, 260);
  L(28, 572, 422, 28); L(550, 572, 422, 28); L(450, 572, 100, 28, { gate: 'dg', dg: d.id });
  if (d.theme === 'royal') L(28, 830, 442, 28); else L(180, 830, 290, 28);
  if (d.theme === 'crystal') L(530, 830, 442, 28); else L(530, 830, 290, 28);
  if (d.theme === 'crystal') L(820, 600, 28, 230, { illusory: 'w_d2' });
  if (d.theme === 'royal') L(152, 600, 28, 230, { illusory: 'w_d4' });
  DOORS.push({ kind: 'enter', dg: d, x: d.ex, y: d.ey }, { kind: 'exit', dg: d, x: ox + 500, y: 1545 });
  if (d.theme === 'crypt') LEVERS.push({ id: 'd1_door', x: ox + 120, y: 1180, name: 'Cửa đá' });
  if (d.theme === 'fire') [[150, 700], [350, 960], [650, 700], [850, 960], [500, 1000], [300, 680], [720, 940]].forEach(([x, y], i) => TRAPS.push({ x: ox + x, y, r: 58, period: 2.6, off: i * 0.37, dg: d.id }));
}
DUNGEONS.forEach(buildDungeon);
// Học Viện cũng có phòng boss khép cửa sương như một hầm ngục
const ACAD_BOSS = { id: 'acad', bossRoom: { x: -2300, y: -900, w: 1500, h: 372 } };
function wallOn(w, enemy) {
  switch (w.gate) {
    case 'north': return enemy || !S.bossDead;
    case 'fog': return enemy || (G.bossFight && !!boss && boss.v === 1);
    case 'north2': return enemy || !S.boss2Dead;
    case 'fog2': return enemy || (G.bossFight && !!boss && boss.v === 2);
    case 'fort': return !S.fortOpen;
    case 'colo': return enemy || G.colo.active;
    case 'great': return !S.greatOpen;
    case 'acad': return !S.acadOpen;
    case 'lever': return !S.levers.includes(w.lever);
    case 'dg': return enemy || G.dfight === w.dg;
  }
  if (w.illusory) return !S.illusory.includes(w.illusory);
  return true;
}
// lưới không gian cho tường để va chạm nhanh
const WCELL = 400, WALL_GRID = new Map();
(function indexWalls() {
  for (const w of WALLS) {
    for (let gx = Math.floor(w.x / WCELL); gx <= Math.floor((w.x + w.w) / WCELL); gx++)
      for (let gy = Math.floor(w.y / WCELL); gy <= Math.floor((w.y + w.h) / WCELL); gy++) {
        const k = gx * 1000 + gy;
        if (!WALL_GRID.has(k)) WALL_GRID.set(k, []);
        WALL_GRID.get(k).push(w);
      }
  }
})();
function wallsNear(x, y, r) {
  const out = [], gx0 = Math.floor((x - r) / WCELL), gx1 = Math.floor((x + r) / WCELL), gy0 = Math.floor((y - r) / WCELL), gy1 = Math.floor((y + r) / WCELL);
  for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) {
    const c = WALL_GRID.get(gx * 1000 + gy);
    if (c) for (const w of c) if (!out.includes(w)) out.push(w);
  }
  return out;
}

// ───────────────────────── ân điển, vật phẩm, rương ─────────────────────────
const GRACES = [
  { id: 0, x: 1400, y: 3330, name: 'Ân Điển Nhà Nguyện Dawnrest' },
  { id: 1, x: 1850, y: 2950, name: 'Ân Điển Đồng Cỏ' },
  { id: 2, x: 700, y: 2320, name: 'Ân Điển Tàn Tích' },
  { id: 3, x: 1400, y: 1290, name: 'Ân Điển Cổng Varek' },
  { id: 4, x: 2000, y: 2350, name: 'Ân Điển Bờ Đầm' },
  { id: 5, x: 3600, y: 1700, name: 'Ân Điển Chân Pháo Đài' },
  { id: 6, x: 3100, y: 2400, name: 'Ân Điển Rừng Wraithwood' },
  { id: 7, x: 3600, y: 2860, name: 'Ân Điển Đấu Trường' },
  { id: 8, x: 1300, y: 300, name: 'Ân Điển Cổng Bắc' },
  { id: 9, x: -450, y: 1800, name: 'Ân Điển Bờ Hồ Đông' },
  { id: 10, x: -2300, y: 1450, name: 'Ân Điển Mỏ Shardvein' },
  { id: 11, x: -1250, y: 560, name: 'Ân Điển Chân Học Viện' },
  { id: 12, x: -1400, y: 300, name: 'Ân Điển Cổng Học Viện' },
  { id: 13, x: -1550, y: -460, name: 'Ân Điển Thư Viện' },
  { id: 14, x: -1100, y: 3050, name: 'Ân Điển Bờ Biển' },
  { id: 15, x: 600, y: -300, name: 'Ân Điển Đồi Vàng' },
  { id: 16, x: 2700, y: -250, name: 'Ân Điển Cao Nguyên' },
  { id: 17, x: 3600, y: -1100, name: 'Ân Điển Sườn Núi' },
  { id: 18, x: 1400, y: -780, name: 'Ân Điển Cổng Kinh Thành' },
  { id: 19, x: 660, y: -960, name: 'Ân Điển Phố Vàng' },
  { id: 20, x: 1400, y: -1060, name: 'Ân Điển Trước Ngai' },
  { id: 21, x: 1250, y: -1660, name: 'Ân Điển Cây Aurum' },
  { id: 22, x: HUB.x + 500, y: 450, name: 'Sảnh Hearthhold', hub: true },
  ...DUNGEONS.map(d => ({ id: d.grace, x: d.area.x + 500, y: 1440, name: 'Ân Điển ' + d.name, dg: d.id })),
];
// NPC ở Sảnh Hearthhold
const NPCS = [
  { id: 'smith', x: HUB.x + 220, y: 250, name: 'Thợ Rèn Hewen', col: '#8a5a3a' },
  { id: 'merchant', x: HUB.x + 780, y: 250, name: 'Lái Buôn Kale', col: '#6a5a3a' },
  { id: 'scholar', x: HUB.x + 220, y: 660, name: 'Học Giả Lyra', col: '#3a4a8a' },
  { id: 'priestess', x: HUB.x + 780, y: 660, name: 'Nữ Tu Seraphine', col: '#b8952f' },
];
const ITEMS = [
  { id: 'seed1', x: 470, y: 1710, loot: { seed: 1 } },
  { id: 'seed2', x: 2480, y: 2300, loot: { seed: 1 } },
  { id: 'seed3', x: 260, y: 2950, loot: { runes: 300, items: { knife: 5 } } },
  { id: 'seed4', x: 500, y: 800, loot: { runes: 400, items: { cure: 2 } } },
  { id: 'stone1', x: 910, y: 1710, loot: { items: { stone1: 2 } } },
  { id: 'stone2', x: 2715, y: 1235, loot: { items: { stone1: 2 } } },
  { id: 'stone3', x: 1000, y: 2960, loot: { items: { stone1: 1, firepot: 2 } } },
  { id: 'stone4', x: 2200, y: 900, loot: { items: { stone1: 2 } } },
  { id: 'seed5', x: 2130, y: 1985, loot: { seed: 1 } },
  { id: 'seed6', x: -2650, y: 2050, loot: { seed: 1 } },
  { id: 'tear1', x: -1450, y: 1800, loot: { tear: 1 } },
  { id: 'lake1', x: -600, y: 2500, loot: { items: { stone2: 1, grune1: 1 } } },
  { id: 'coast1', x: -2350, y: 3480, loot: { items: { grease: 2, stone1: 2 } } },
  { id: 'plat1', x: 3500, y: -600, loot: { items: { stone3: 1, grune2: 1 } } },
  { id: 'plat2', x: 150, y: 250, loot: { items: { somber2: 1 } } },
  { id: 'cap1', x: 1100, y: -1300, loot: { items: { stone3: 2 } } },
];
const CHESTS = [
  { id: 'c_sword', x: 820, y: 2980, loot: { weapon: 'sword' } },
  { id: 'c_katana', x: 700, y: 1760, loot: { weapon: 'katana' } },
  { id: 'c_spear', x: 2300, y: 3390, loot: { weapon: 'spear' } },
  { id: 'c_north', x: 2600, y: 900, loot: { runes: 300, items: { stone1: 2 } } },
  { id: 'c_west', x: 300, y: 1500, loot: { tal: 'crimson' } },
  { id: 'c_swamp', x: 2720, y: 2000, loot: { items: { stone1: 2, cure: 2 }, ash: 'whirl' } },
  { id: 'c_troll', x: 2900, y: 1150, loot: { seed: 1, items: { stone2: 1 } } },
  { id: 'c_fort_secret', x: 3284, y: 1190, loot: { tal: 'claw', items: { somber1: 1 } } },
  { id: 'c_keep', x: 3700, y: 610, loot: { items: { stone2: 2 }, armor: 'knightset' } },
  { id: 'c_hut', x: 3025, y: 3225, loot: { ash: 'flame', items: { stone1: 2 } } },
  { id: 'c_glade', x: 3650, y: 2300, loot: { seed: 1, tear: 1 }, req: () => S.glade },
  { id: 'c_colo', x: 3600, y: 3330, loot: { runes: 2500, items: { stone2: 2 }, tal: 'blade' }, req: () => S.coloDone, noObst: true },
  // Hồ Crystalmere và bờ biển
  { id: 'c_isle1', x: -1750, y: 1250, loot: { items: { crystalkey: 1, stone2: 1 } } },
  { id: 'c_isle2', x: -950, y: 1700, loot: { tal: 'cerulean', runes: 600 } },
  { id: 'c_lake_w', x: -2600, y: 1100, loot: { weapon: 'rapier' } },
  { id: 'c_lake_n', x: -400, y: 650, loot: { items: { stone1: 3 }, ash: 'lunge' } },
  { id: 'c_wreck', x: -2300, y: 3300, loot: { weapon: 'axe' } },
  { id: 'c_beach', x: -900, y: 3450, loot: { weapon: 'longbow', items: { stone1: 2 } } },
  { id: 'c_cove', x: -2050, y: 2750, loot: { tal: 'arrow', seed: 1 } },
  // Học Viện
  { id: 'c_acad_secret', x: -900, y: 180, loot: { mem: 1, items: { somber1: 1 } } },
  { id: 'c_lib', x: -900, y: -470, loot: { weapon: 'crystalsword' } },
  { id: 'c_lib2', x: -1780, y: -180, loot: { spell: 'shard', tear: 1 } },
  { id: 'c_wing', x: -2250, y: -300, loot: { armor: 'crystalset', items: { stone2: 2 } } },
  // Cao Nguyên Aurelia và Kinh Thành
  { id: 'c_gold1', x: 300, y: -600, loot: { tal: 'feather', items: { stone3: 1 } } },
  { id: 'c_gold2', x: 2300, y: 150, loot: { seed: 1, items: { stone2: 2 } } },
  { id: 'c_high1', x: 4200, y: -1700, loot: { weapon: 'greataxe', items: { stone3: 1 } } },
  { id: 'c_high2', x: 2900, y: -1300, loot: { tear: 1, pouch: 1 } },
  { id: 'c_cap1', x: 500, y: -1140, loot: { weapon: 'goldbow' } },
  { id: 'c_cap2', x: 2140, y: -1600, loot: { weapon: 'seal2', ash: 'holy' } },
  { id: 'c_cap3', x: 2436, y: -1340, loot: { armor: 'royalset' } },
  { id: 'c_cap4', x: 850, y: -1350, loot: { items: { somber2: 1, stone3: 2 }, tear: 1 } },
];
// rương trong hầm ngục (tọa độ cục bộ)
[['d1', 860, 1200, { items: { stone1: 2, cure: 2 } }], ['d1', 100, 690, { ash: 'unsheathe' }],
  ['d2', 130, 1200, { items: { stone1: 3 } }], ['d2', 910, 700, { items: { stone2: 2, somber1: 1 } }],
  ['d3', 130, 1200, { items: { firepot: 4, stone2: 1 } }], ['d3', 880, 690, { items: { stone2: 2 }, tal: 'green' }],
  ['d4', 860, 1200, { items: { grune2: 1, stone3: 1 } }], ['d4', 90, 700, { items: { stone3: 2, somber2: 1 } }]]
  .forEach(([id, x, y, loot], i) => { const d = DUNGEONS.find(q => q.id === id); CHESTS.push({ id: 'c_' + id + '_' + i, x: d.area.x + x, y, loot }); });
const NOTES = [
  { x: 1400, y: 3130, text: 'Lưỡi gươm đang chờ phía trước. Hãy lăn mình (Space) đúng khoảnh khắc thép vung xuống.' },
  { x: 1470, y: 2300, text: 'Kẻ thù nào rồi cũng lảo đảo. Đòn nặng tay bẻ gãy thế đứng nhanh hơn cả.' },
  { x: 2120, y: 2560, text: 'Nghe tiếng tru? Bầy sói săn theo đàn. Lùi lại, và hạ từng con một.' },
  { x: 700, y: 2230, text: 'Kho báu ở phía trước... cùng một kỵ sĩ không chịu chết. Khi hắn quỳ gối, hãy kết liễu hắn.' },
  { x: 1320, y: 1220, text: 'Kẻ gác cổng thích giữ lưỡi kiếm lâu hơn một nhịp. Kẻ nào lăn vội sẽ chết.' },
  { x: 1440, y: 330, text: 'Kinh Thành Aurumhold ngự trên đỉnh cao nguyên. Cổng lớn chỉ mở cho kẻ mang đủ ba Đại Ấn.' },
  { x: 2040, y: 2240, text: 'Một con rồng cổ ngủ giữa đầm lầy phương bắc. Hãy phi ngựa qua những ao độc tím.' },
  { x: 1480, y: 1240, text: 'Nâng khiên đúng lúc lưỡi kiếm chạm tới... rồi đâm xuyên kẻ đã mất thế.' },
  { x: 3600, y: 1530, text: '“Mặt trời mọc ở phía đông, đứng bóng trên đỉnh, rồi lặn về phía tây.” Hãy thắp lửa theo đúng hành trình của nó.' },
  { x: 3400, y: 1235, text: 'Bức tường phía tây nghe rỗng tuếch... Có lẽ nó chỉ là ảo ảnh. Thử vung kiếm xem.' },
  { x: 3160, y: 2330, text: 'Bốn tượng canh ngủ ở bốn góc rừng. Đánh thức cả bốn, kết giới linh hồn sẽ tan.' },
  { x: 3600, y: 3140, text: 'Chạm vào lá cờ máu để nhận lời thách đấu. Ba đợt kẻ thù, không có đường lui.' },
  { x: 3025, y: 3110, text: 'Một căn nhà không có cửa ra vào... Ai đã xây nó, và để giấu điều gì?' },
  { x: 2830, y: 1360, text: 'Gã khổng lồ đá chậm chạp mà chết chóc. Khi hắn giơ chùy, hãy lăn vào dưới chân hắn.' },
  { x: 160, y: 1905, text: 'Qua khe đá là Hồ Crystalmere. Nước hồ níu chân kẻ lữ hành; đừng để bị vây giữa làn nước.' },
  { x: -1500, y: 2260, text: 'Chìa khóa của Học Viện nằm trên hòn đảo phía tây bắc, giữa đám người pha lê không bao giờ ngủ.' },
  { x: -1450, y: 470, text: 'Cổng Học Viện Starhollow. Chỉ kẻ mang Chìa Khóa Pha Lê mới được bước qua.' },
  { x: -1180, y: 140, text: 'Cánh cửa này bị cài then từ phía bên kia.' },
  { x: -1080, y: 330, text: 'Góc sân này... có tiếng gió luồn qua một bức tường lẽ ra phải kín.' },
  { x: 1400, y: -860, text: 'Cổng Kinh Thành Aurumhold. Ba Đại Ấn nằm trong tay vệ binh Greystone phương đông, con rồng Ashmire, và nữ hoàng Starhollow phương tây.' },
  { x: 1480, y: -1000, text: 'Kẻ gác cổng năm xưa chưa hề chết... Hắn đang chờ ở Sân Ngai Sunthrone.' },
  { x: 150, y: 3050, text: 'Lối xuống bờ biển Saltreach. Sóng đã gặm mòn một hầm mộ cổ bên mép nước.' },
  { x: DUNGEONS[0].area.x + 500, y: 1250, text: 'Cánh cửa đá im lìm. Hẳn phải có cơ quan ẩn đâu đó trong gian mộ.' },
  { x: DUNGEONS[1].area.x + 780, y: 950, text: 'Vách pha lê phía đông mỏng như lớp băng đầu đông...' },
  { x: DUNGEONS[2].area.x + 500, y: 1130, text: 'Nền đá nóng rực. Lửa ngầm phun theo nhịp; hãy đếm hơi thở của hang mà đi.' },
];
const SPAWNS = [
  ['soldier', 1320, 2880], ['soldier', 1480, 2840],
  ['soldier', 1580, 2480], ['soldier', 1260, 2420], ['mage', 1080, 2620],
  ['wolf', 2250, 2750], ['wolf', 2300, 2700], ['wolf', 2200, 2680],
  ['soldier', 1700, 2150], ['soldier', 1560, 2000], ['mage', 1950, 1800],
  ['wolf', 2500, 2450], ['wolf', 2560, 2400],
  ['ghoul', 2160, 1380], ['ghoul', 2260, 1960], ['ghoul', 2660, 1380], ['ghoul', 2600, 2000], ['ghoul', 2120, 1640],
  ['soldier', 600, 1760], ['soldier', 880, 1980], ['mage', 520, 1900], ['knight', 720, 1920],
  ['soldier', 1200, 1600], ['soldier', 1600, 1620], ['knight', 1920, 1450],
  ['wolf', 600, 900], ['wolf', 660, 950], ['soldier', 2200, 800], ['mage', 2400, 1100],
  ['soldier', 900, 3000], ['wolf', 2400, 3200], ['wolf', 2450, 3150], ['knight', 2330, 3270],
  // cao nguyên tro phía đông
  ['archer', 3100, 900], ['archer', 4200, 1100], ['troll', 2950, 1250], ['bat', 3050, 1500], ['bat', 3090, 1530], ['bat', 3020, 1560],
  ['spider', 4200, 1650], ['shield', 3300, 1560],
  // pháo đài
  ['shield', 3450, 1000], ['shield', 3750, 1000], ['archer', 3300, 850], ['archer', 3900, 850], ['bomber', 3600, 1150], ['soldier', 3390, 1180], ['warden', 3600, 650],
  // rừng linh hồn
  ['ghost', 3300, 2080], ['ghost', 3950, 2120], ['ghost', 3380, 2600], ['ghost', 3880, 2620], ['spider', 4120, 2380], ['spider', 3200, 2760],
  // phía nam
  ['bomber', 4200, 3300], ['shield', 4250, 3120], ['bat', 2900, 3050], ['bat', 2940, 3080], ['spider', 3050, 3420], ['knight', 4300, 2900],
  // Hồ Crystalmere
  ['lakehound', -600, 2330], ['lakehound', -660, 2440], ['lakehound', -520, 2440],
  ['sorcerer', -300, 1250], ['sorcerer', -1900, 620], ['sorcerer', -2350, 1150],
  ['crystal', -1690, 1230], ['crystal', -1810, 1290], ['knight', -1030, 1650],
  ['lakehound', -2050, 2020], ['lakehound', -2150, 2060], ['soldier', -1200, 2240], ['soldier', -1350, 2300], ['archer', -1000, 2380],
  ['lakehound', -1300, 1050], ['lakehound', -1150, 1150], ['bat', -700, 600], ['bat', -740, 640], ['troll', -2500, 800], ['mage', -1700, 2400],
  ['crystal', -600, 1500], ['sorcerer', -2550, 1900],
  // Bờ Biển Saltreach
  ['ghoul', -600, 3300], ['ghoul', -800, 3200], ['ghoul', -1300, 3420], ['soldier', -400, 3200], ['archer', -1900, 3320],
  ['lakehound', -2200, 3000], ['lakehound', -2260, 3060], ['knight', -1800, 2800], ['bomber', -1000, 3520], ['bat', -1500, 2950], ['bat', -1540, 2990],
  // Học Viện Starhollow
  ['sorcerer', -1900, 250], ['sorcerer', -1150, 200], ['crystal', -1700, 180], ['shield', -2000, 320],
  ['crystal', -2100, -100], ['sorcerer', -2150, -430], ['knight', -2150, 0],
  ['sorcerer', -1700, -340], ['sorcerer', -1300, -180], ['crystal', -1000, -340], ['sorcerer', -1000, -20], ['bat', -1500, -40],
  ['selvara', -1550, -740],
  // Cao Nguyên Aurelia
  ['royal', 1500, -100], ['garcher', 1000, 100], ['lion', 900, -500], ['priest', 700, -150], ['royal', 2200, -500], ['garcher', 1800, -300],
  ['priest', 2600, 0], ['lion', 3200, -300], ['royal', 3800, 100], ['garcher', 4000, -200], ['soldier', 1200, -600], ['soldier', 1600, -650],
  ['garcher', 400, 100], ['troll', 3000, 200],
  // Sườn Núi Goldspire
  ['lion', 3300, -1500], ['royal', 3800, -1250], ['garcher', 4100, -1000], ['priest', 3100, -1100], ['troll', 2900, -1650], ['garcher', 4200, -1450],
  // Kinh Thành Aurumhold
  ['royal', 680, -1600], ['priest', 500, -1450], ['garcher', 850, -1370], ['lion', 650, -1340], ['garcher', 360, -1250],
  ['royal', 2000, -1420], ['priest', 2280, -1480], ['garcher', 2100, -1250], ['royal', 2300, -1220], ['garcher', 1810, -1500], ['knight', 2140, -1050],
  ['lion', 1700, -1010], ['royal', 1100, -990],
];
// quái trong hầm ngục (tọa độ cục bộ)
const DG_SPAWNS = {
  d1: [['ghoul', 150, 1450], ['ghoul', 850, 1450], ['soldier', 130, 1260], ['ghoul', 860, 1280], ['soldier', 300, 950], ['ghost', 700, 950], ['bat', 500, 700], ['bat', 540, 720], ['ghoul', 800, 700]],
  d2: [['crystal', 300, 1300], ['crystal', 700, 1300], ['sorcerer', 500, 950], ['crystal', 250, 700], ['bat', 750, 700], ['lakehound', 150, 960], ['lakehound', 850, 960]],
  d3: [['bomber', 200, 1300], ['soldier', 800, 1300], ['spider', 300, 950], ['spider', 700, 950], ['troll', 500, 720], ['bomber', 850, 700]],
  d4: [['royal', 300, 1300], ['garcher', 800, 1250], ['ghost', 500, 950], ['priest', 250, 700], ['royal', 750, 700], ['garcher', 520, 650]],
};
for (const d of DUNGEONS) {
  for (const [t, x, y] of DG_SPAWNS[d.id]) SPAWNS.push([t, d.area.x + x, y]);
  SPAWNS.push([d.boss, d.area.x + 500, 280]);
}
const REGIONS = [
  { name: 'Cõi Aurum', test: x => x > 4800 && x < 6050 },
  { name: 'Sảnh Hearthhold', test: x => x >= 6050 && x < 7150 },
  ...DUNGEONS.map(d => ({ name: d.name, test: x => x >= d.area.x - 50 && x < d.area.x + d.area.w + 50 })),
  { name: 'Cây Aurum', test: (x, y) => y < ARENA2.y && x > 1000 && x < 1800 },
  { name: 'Sân Ngai Sunthrone', test: (x, y) => inRect(x, y, ARENA2) },
  { name: 'Kinh Thành Aurumhold', test: (x, y) => inRect(x, y, CAPITAL) },
  { name: 'Sườn Núi Goldspire', test: (x, y) => y < -900 && x > 2500 },
  { name: 'Học Viện Starhollow', test: (x, y) => inRect(x, y, ACAD) },
  { name: 'Cao Nguyên Aurelia', test: (x, y) => x >= 0 && y < 390 },
  { name: 'Bờ Biển Saltreach', test: (x, y) => x < 0 && y >= 2600 },
  { name: 'Hồ Crystalmere', test: x => x < 0 },
  { name: 'Cổng Gác Thornwall', test: (x, y) => x > ARENA.x && x < ARENA.x + ARENA.w && y > ARENA.y && y < ARENA.y + ARENA.h },
  { name: 'Đầm Lầy Ashmire', test: (x, y) => x > SWAMP.x && x < SWAMP.x + SWAMP.w && y > SWAMP.y && y < SWAMP.y + SWAMP.h },
  { name: 'Tàn Tích Hollowmere', test: (x, y) => x > 380 && x < 1020 && y > 1600 && y < 2200 },
  { name: 'Nhà Nguyện Dawnrest', test: (x, y) => x > 1220 && x < 1580 && y > 3170 },
  { name: 'Pháo Đài Greystone', test: (x, y) => inRect(x, y, FORT) },
  { name: 'Đấu Trường Bloodsand', test: (x, y) => inRect(x, y, COLO.rect) },
  { name: 'Rừng Wraithwood', test: (x, y) => inRect(x, y, FOREST) },
  { name: 'Cao Nguyên Cinderreach', test: (x) => x > 2800 },
  { name: 'Đồng Cỏ Mistveil', test: () => true },
];
const regionAt = (x, y) => REGIONS.find(r => r.test(x, y)).name;
// hệ số sức mạnh của quái theo vùng đất (như Elden Ring: mạnh theo vùng, không theo cấp người chơi)
const REGION_MUL = {
  'Cõi Aurum': 2.0, 'Sảnh Hearthhold': 1, 'Cây Aurum': 1.9, 'Sân Ngai Sunthrone': 1.9, 'Kinh Thành Aurumhold': 1.85, 'Sườn Núi Goldspire': 1.8,
  'Học Viện Starhollow': 1.55, 'Cao Nguyên Aurelia': 1.7, 'Bờ Biển Saltreach': 1.2, 'Hồ Crystalmere': 1.4, 'Cổng Gác Thornwall': 1.2,
  'Đầm Lầy Ashmire': 1.25, 'Tàn Tích Hollowmere': 1.1, 'Nhà Nguyện Dawnrest': 1, 'Pháo Đài Greystone': 1.45, 'Đấu Trường Bloodsand': 1.5,
  'Rừng Wraithwood': 1.4, 'Cao Nguyên Cinderreach': 1.35, 'Đồng Cỏ Mistveil': 1,
};
for (const d of DUNGEONS) REGION_MUL[d.name] = d.mul;

// ───────────────────────── chướng ngại (cây, đá) sinh bằng seed cố định ─────────────────────────
const OBST = [];
const CELL = 160, GRID = new Map();
function addObst(o) {
  OBST.push(o);
  const k = Math.floor(o.x / CELL) + ',' + Math.floor(o.y / CELL);
  if (!GRID.has(k)) GRID.set(k, []);
  GRID.get(k).push(o);
}
function nearRoad(x, y) { let m = 1e9; for (const R of ROADS) for (let i = 1; i < R.length; i++) m = Math.min(m, segDist(x, y, R[i - 1][0], R[i - 1][1], R[i][0], R[i][1])); return m; }
function spotBlocked(x, y, pad) {
  if (x < WX0 + 60 || x > MAPW - 60 || y < WY0 + 60 || y > H - 60) return true;
  for (const w of wallsNear(x, y, 60 + pad)) if (inRect(x, y, w, 34 + pad)) return true;
  if (x > 930 && x < 1870 && y > 380 && y < 1200) return true;
  if (x > 370 && x < 1030 && y > 1600 && y < 2210) return true;
  if (x > 1210 && x < 1590 && y > 3150) return true;
  if (inRect(x, y, CAPITAL, 20) || inRect(x, y, ACAD, 20)) return true;
  if (dist(x, y, TREE_POS.x, TREE_POS.y) < 340) return true;
  if (nearRoad(x, y) < 58 + pad) return true;
  if (dist(x, y, LAIR.x, LAIR.y) < 360) return true;
  if (inRect(x, y, FORT, 34) || inRect(x, y, COLO.rect, 34) || (x > 2920 && x < 3130 && y > 3120 && y < 3330)) return true;
  if (dist(x, y, BARRIER.x, BARRIER.y) < BARRIER.r + 40) return true;
  if (x > 3380 && x < 3820 && y > 1330 && y < 1560) return true;
  if (LAKE.some(l => inEll(x, y, l, 30 + pad))) return true;
  for (const [px, py, rx, ry] of POOLS) { const dx = (x - px) / (rx + pad + 16), dy = (y - py) / (ry + pad + 16); if (dx * dx + dy * dy < 1) return true; }
  for (const g of GRACES) if (dist(x, y, g.x, g.y) < 130) return true;
  for (const it of ITEMS) if (dist(x, y, it.x, it.y) < 60) return true;
  for (const n of NOTES) if (dist(x, y, n.x, n.y) < 50) return true;
  for (const s of SPAWNS) if (dist(x, y, s[1], s[2]) < 55) return true;
  for (const d of DOORS) if (dist(x, y, d.x, d.y) < 110) return true;
  for (const l of LEVERS) if (dist(x, y, l.x, l.y) < 60) return true;
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
  for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gy = cy - 1; gy <= cy + 1; gy++) {
    const c = GRID.get(gx + ',' + gy);
    if (c) for (const o of c) if (dist(x, y, o.x, o.y) < o.r + pad + 36) return true;
  }
  return false;
}
(function genObstacles() {
  const r = mulberry32(20250311);
  for (const c of CHESTS) if (!c.noObst) addObst({ kind: 'chest', x: c.x, y: c.y, r: 14, chest: c });
  for (const b of BRAZIERS) addObst({ kind: 'brazier', x: b.x, y: b.y, r: 14 });
  for (const st of STATUES) addObst({ kind: 'statue', x: st.x, y: st.y, r: 16 });
  for (const f of MAP_FRAGS) addObst({ kind: 'stele', x: f.x, y: f.y, r: 12 });
  for (const l of LEVERS) addObst({ kind: 'lever', x: l.x, y: l.y, r: 10, lever: l });
  for (const n of NPCS) addObst({ kind: 'npc', x: n.x, y: n.y, r: 16, npc: n });
  addObst({ kind: 'flag', x: FLAG.x, y: FLAG.y, r: 8 });
  addObst({ kind: 'bigtree', x: TREE_POS.x, y: TREE_POS.y, r: 58 });
  // cột đổ trong tàn tích, Học Viện, Sân Ngai Sunthrone và các hầm ngục
  const pillar = (x, y, rr) => addObst({ kind: 'rock', x, y, r: rr, seed: (x * 7 + y) | 0, pillar: true });
  [[560, 1760, 16], [820, 1800, 18], [520, 2040, 15], [880, 2080, 14], [760, 1720, 12]].forEach(p => pillar(...p));
  [[-2000, -760, 20], [-1100, -760, 20], [-2000, -620, 18], [-1100, -620, 18], [-1800, 250, 16], [-1300, 180, 16]].forEach(p => pillar(...p));
  [[1150, -1480, 18], [1650, -1480, 18], [1150, -1220, 18], [1650, -1220, 18]].forEach(p => pillar(...p));
  for (const d of DUNGEONS) [[250, 250], [750, 250], [250, 430], [750, 430], [380, 1250], [620, 1250]].forEach(([x, y]) => pillar(d.area.x + x, y, 18));
  // cây và đá theo từng vùng
  const zones = [
    { x: 0, y: 420, w: 4400, h: 3180, trees: 370, rocks: 85 },
    { x: -2800, y: 400, w: 2800, h: 2200, trees: 120, rocks: 40, pal: 'lake', crystals: 26 },
    { x: -2480, y: 2600, w: 2480, h: 1000, trees: 45, rocks: 50, pal: 'coast' },
    { x: 0, y: -900, w: 4400, h: 1280, trees: 190, rocks: 40, golden: 1 },
    { x: 2500, y: -1800, w: 1900, h: 900, trees: 70, rocks: 40, golden: 1 },
  ];
  for (const z of zones) {
    let n = 0, tries = 0;
    while (n < z.trees && tries++ < z.trees * 40) {
      const x = z.x + r() * z.w, y = z.y + r() * z.h, tr = 13 + r() * 6;
      if (spotBlocked(x, y, 22)) continue;
      n++;
      const golden = z.golden ? r() < 0.85 : !z.pal && r() < 0.22;
      addObst({ kind: 'tree', x, y, r: tr, cr: tr * 2.6 + r() * 12, golden, spr: (r() * 4) | 0, pal: z.pal, dead: !z.pal && x > SWAMP.x - 40 && x < 2820 && y > SWAMP.y && y < SWAMP.y + SWAMP.h, spirit: inRect(x, y, FOREST) });
    }
    n = 0; tries = 0;
    while (n < z.rocks && tries++ < z.rocks * 40) {
      const x = z.x + r() * z.w, y = z.y + r() * z.h, rr = 12 + r() * 16;
      if (spotBlocked(x, y, 10)) continue;
      n++; addObst({ kind: 'rock', x, y, r: rr, seed: (r() * 1e6) | 0 });
    }
    n = 0; tries = 0;
    while (n < (z.crystals || 0) && tries++ < 2000) {
      const x = z.x + r() * z.w, y = z.y + r() * z.h;
      if (spotBlocked(x, y, 6)) continue;
      n++; addObst({ kind: 'rock', x, y, r: 10 + r() * 8, seed: (r() * 1e6) | 0, crystal: true });
    }
  }
  // mép vách đá
  for (let x = 20; x < MAPW; x += 44) {
    if ((x > 940 && x < 1860) || x > MAPW - 30) continue;
    addObst({ kind: 'rock', x: x + r() * 12, y: 398 + r() * 14, r: 20 + r() * 10, seed: (r() * 1e6) | 0, cliff: true });
  }
  for (let y = 420; y < H; y += 44) {
    if ((y > 1840 && y < 1990) || (y > 2930 && y < 3170)) continue;
    addObst({ kind: 'rock', x: -20 + r() * 12, y: y + r() * 12, r: 20 + r() * 10, seed: (r() * 1e6) | 0, cliff: true });
  }
})();

// ───────────────────────── dựng sẵn hình ảnh ─────────────────────────
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const isVoid = (x, y) => WALLS.some(w => (w.void || w.sea) && inRect(x, y, w));
// nền đá lát, tint là màu pha
function paintFloor(g, r, x, y, w, h, ts, holes, base, tint = [12, 9, 0]) {
  for (let ty = y; ty < y + h; ty += ts) for (let tx = x; tx < x + w; tx += ts) {
    if (holes && r() < holes) continue;
    const s = base + ((r() * 16) | 0);
    g.fillStyle = `rgb(${s + tint[0]},${s + tint[1]},${s + tint[2]})`;
    g.fillRect(tx + 1.5, ty + 1.5, Math.min(ts, x + w - tx) - 3, Math.min(ts, y + h - ty) - 3);
    if (r() < 0.25) { g.strokeStyle = 'rgba(20,18,14,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(tx + r() * ts, ty + r() * ts); g.lineTo(tx + r() * ts, ty + r() * ts); g.stroke(); }
  }
}
function blobs(g, r, n, x, y, w, h, cols, a0, a1, s0 = 30, s1 = 90) {
  for (let i = 0; i < n; i++) {
    const px = x + r() * w, py = y + r() * h;
    if (isVoid(px, py)) continue;
    g.globalAlpha = a0 + r() * a1; g.fillStyle = cols[(r() * cols.length) | 0];
    g.beginPath(); g.ellipse(px, py, s0 + r() * (s1 - s0), (s0 + r() * (s1 - s0)) * 0.6, r() * TAU, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
}
const GROUND = (function buildGround() {
  const GW = MAPW - WX0, GH = H - WY0;
  const c = makeCanvas(GW / 2, GH / 2), g = c.getContext('2d'), r = mulberry32(77);
  g.scale(0.5, 0.5); g.translate(-WX0, -WY0);
  g.fillStyle = '#454f2e'; g.fillRect(WX0, WY0, GW, GH);
  blobs(g, r, 5200, WX0, WY0, GW, GH, ['#3d4729', '#4f5a33', '#5a6138', '#48532d', '#626a3c', '#3a4226', '#57603a'], 0.22, 0.25, 20, 110);
  g.globalAlpha = 0.5; g.lineWidth = 2;
  for (let i = 0; i < 18000; i++) {
    const x = WX0 + r() * GW, y = WY0 + r() * GH;
    g.strokeStyle = r() < 0.5 ? '#66713d' : '#343d1e';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 7, y - 4 - r() * 7); g.stroke();
  }
  g.globalAlpha = 0.85;
  for (let i = 0; i < 3000; i++) {
    const p = r();
    g.fillStyle = p < 0.55 ? '#d9c46a' : p < 0.85 ? '#e9e2cf' : '#b7a0d4';
    g.beginPath(); g.arc(WX0 + r() * GW, WY0 + r() * GH, 1.4 + r() * 1.6, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  // Cao Nguyên Aurelia: đồng cỏ vàng óng
  g.fillStyle = 'rgba(176,146,70,.72)'; g.fillRect(0, WY0, MAPW, 380 - WY0);
  const ng = g.createLinearGradient(0, 300, 0, 470);
  ng.addColorStop(0, 'rgba(176,146,70,.72)'); ng.addColorStop(1, 'rgba(176,146,70,0)');
  g.fillStyle = ng; g.fillRect(0, 300, MAPW, 170);
  blobs(g, r, 1400, 0, WY0, MAPW, 380 - WY0, ['#a88a44', '#c4a256', '#96783a', '#d2b066'], 0.2, 0.25);
  for (let i = 0; i < 3000; i++) { g.globalAlpha = 0.75; g.fillStyle = r() < 0.5 ? '#f0d27a' : '#fff1b8'; g.beginPath(); g.arc(r() * MAPW, WY0 + r() * (380 - WY0), 1.5 + r() * 2, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  // Hồ Crystalmere: cỏ xanh lam, bờ cát và nước nông
  blobs(g, r, 1300, WX0, 400, -WX0, 2200, ['#3e5a4c', '#4a6a5a', '#35503f', '#56725e'], 0.25, 0.25);
  for (const [px, py, rx, ry] of LAKE) { g.fillStyle = '#8a8466'; g.beginPath(); g.ellipse(px, py, rx + 26, ry + 22, 0, 0, TAU); g.fill(); }
  for (const [px, py, rx, ry] of LAKE) { g.fillStyle = '#3a6078'; g.beginPath(); g.ellipse(px, py, rx, ry, 0, 0, TAU); g.fill(); }
  for (const [px, py, rx, ry] of LAKE) {
    const lg = g.createRadialGradient(px, py, 10, px, py, Math.max(rx, ry));
    lg.addColorStop(0, 'rgba(40,78,110,.9)'); lg.addColorStop(1, 'rgba(70,120,140,0)');
    g.fillStyle = lg; g.beginPath(); g.ellipse(px, py, rx, ry, 0, 0, TAU); g.fill();
  }
  g.globalAlpha = 0.35;
  for (let i = 0; i < 900; i++) {
    const x = WX0 + r() * -WX0, y = 400 + r() * 2200;
    if (!inWater(x, y)) continue;
    g.strokeStyle = r() < 0.6 ? '#9fd0e8' : '#cfeaf6'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 + r() * 20, y); g.stroke();
  }
  g.globalAlpha = 1;
  for (const [px, py, rx, ry] of ISLES) {
    g.fillStyle = '#9a9070'; g.beginPath(); g.ellipse(px, py, rx + 14, ry + 12, 0, 0, TAU); g.fill();
    g.fillStyle = '#4a6a52'; g.beginPath(); g.ellipse(px, py, rx, ry, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(120,150,110,.35)'; g.beginPath(); g.ellipse(px - rx * 0.2, py - ry * 0.2, rx * 0.6, ry * 0.5, 0, 0, TAU); g.fill();
  }
  // Bờ Biển Saltreach
  blobs(g, r, 700, WX0, 2600, -WX0, 1000, ['#6a6a48', '#77734e', '#5e5e40'], 0.3, 0.25);
  const sg = g.createLinearGradient(-2480, 0, -2050, 0);
  sg.addColorStop(0, '#c8b684'); sg.addColorStop(1, 'rgba(200,182,132,0)');
  g.fillStyle = sg; g.fillRect(-2480, 2600, 430, 1000);
  const seag = g.createLinearGradient(WX0, 0, -2480, 0);
  seag.addColorStop(0, '#16304a'); seag.addColorStop(1, '#2d5a74');
  g.fillStyle = seag; g.fillRect(WX0, 2600, 320, 1000);
  g.strokeStyle = 'rgba(230,240,245,.55)'; g.lineWidth = 3;
  for (let y = 2610; y < H; y += 26) { g.beginPath(); g.moveTo(-2480 + Math.sin(y * 0.05) * 8, y); g.lineTo(-2480 + Math.sin(y * 0.05 + 1) * 8, y + 22); g.stroke(); }
  // đầm lầy phía đông
  for (let i = 0; i < 520; i++) {
    g.globalAlpha = 0.25 + r() * 0.22; g.fillStyle = r() < 0.5 ? '#3b3a2c' : '#463b40';
    g.beginPath(); g.ellipse(SWAMP.x + r() * SWAMP.w, SWAMP.y + r() * SWAMP.h, 30 + r() * 80, 20 + r() * 50, r() * TAU, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  const lg = g.createRadialGradient(LAIR.x, LAIR.y, 20, LAIR.x, LAIR.y, 320);
  lg.addColorStop(0, 'rgba(38,30,24,.75)'); lg.addColorStop(1, 'rgba(38,30,24,0)');
  g.fillStyle = lg; g.beginPath(); g.arc(LAIR.x, LAIR.y, 320, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(214,204,184,.55)'; g.lineWidth = 3; g.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const a = r() * TAU, d = 90 + r() * 200, x = LAIR.x + Math.cos(a) * d, y = LAIR.y + Math.sin(a) * d, b = r() * TAU, l = 6 + r() * 12;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * l, y + Math.sin(b) * l); g.stroke();
  }
  for (const [px, py, rx, ry] of POOLS) {
    g.fillStyle = '#3a2f3d'; g.beginPath(); g.ellipse(px, py, rx + 8, ry + 8, 0, 0, TAU); g.fill();
    g.fillStyle = '#6a4f73'; g.beginPath(); g.ellipse(px, py, rx, ry, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(170,130,185,.35)'; g.beginPath(); g.ellipse(px - rx * 0.25, py - ry * 0.3, rx * 0.5, ry * 0.35, 0, 0, TAU); g.fill();
  }
  g.lineCap = 'round'; g.lineJoin = 'round';
  // cao nguyên tro phía đông
  for (let i = 0; i < 1400; i++) {
    const x = 2800 + r() * (MAPW - 2800), y = 420 + r() * (H - 420);
    g.globalAlpha = 0.18 + r() * 0.2; g.fillStyle = r() < 0.5 ? '#55503f' : '#4a4a3a';
    g.beginPath(); g.ellipse(x, y, 30 + r() * 90, 20 + r() * 50, r() * TAU, 0, TAU); g.fill();
  }
  for (let i = 0; i < 700; i++) {
    const x = FOREST.x + r() * FOREST.w, y = FOREST.y + r() * FOREST.h;
    g.globalAlpha = 0.25 + r() * 0.2; g.fillStyle = r() < 0.5 ? '#2f4a48' : '#355652';
    g.beginPath(); g.ellipse(x, y, 30 + r() * 80, 20 + r() * 50, r() * TAU, 0, TAU); g.fill();
  }
  g.globalAlpha = 0.85;
  for (let i = 0; i < 400; i++) { g.fillStyle = r() < 0.6 ? '#9fe8e0' : '#d9fff8'; g.beginPath(); g.arc(FOREST.x + r() * FOREST.w, FOREST.y + r() * FOREST.h, 1.3 + r() * 1.5, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  // con đường
  const road = (w, col, a) => { g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = w; for (const R of ROADS) { g.beginPath(); R.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); } };
  road(88, '#4d432c', 0.5); road(66, '#6c5d40', 0.85); road(38, '#7e6d4b', 0.5);
  g.globalAlpha = 0.6;
  for (const R of ROADS) for (let i = 1; i < R.length; i++) {
    const [ax, ay] = R[i - 1], [bx, by] = R[i];
    for (let k = 0; k < 40; k++) { const t = r(); g.fillStyle = r() < 0.5 ? '#8d7c58' : '#554a33'; g.beginPath(); g.arc(lerp(ax, bx, t) + (r() - 0.5) * 50, lerp(ay, by, t) + (r() - 0.5) * 20, 1.5 + r() * 2.5, 0, TAU); g.fill(); }
  }
  g.globalAlpha = 1;
  const floor = (...a) => paintFloor(g, r, ...a);
  g.fillStyle = '#3a372f'; g.fillRect(ARENA.x - 10, ARENA.y - 10, ARENA.w + 20, ARENA.h + 20);
  floor(ARENA.x - 10, ARENA.y - 10, ARENA.w + 20, ARENA.h + 20, 50, 0.03, 70);
  g.strokeStyle = 'rgba(214,178,94,.22)'; g.lineWidth = 4;
  g.beginPath(); g.arc(1400, 760, 190, 0, TAU); g.stroke();
  g.beginPath(); g.arc(1400, 760, 120, 0.3, TAU - 0.3); g.stroke();
  floor(430, 1660, 540, 490, 44, 0.3, 64);
  floor(1260, 3210, 280, 240, 40, 0.05, 72);
  floor(1340, 200, 120, 200, 40, 0.15, 86);
  floor(3210, 510, 780, 780, 48, 0.06, 62);
  floor(3420, 530, 360, 240, 40, 0.02, 52);
  floor(2960, 3160, 130, 130, 32, 0, 60);
  g.fillStyle = '#7d6d4f'; g.fillRect(3210, 2960, 780, 540);
  g.strokeStyle = 'rgba(60,48,30,.35)'; g.lineWidth = 3;
  for (const rr of [60, 140, 220]) { g.beginPath(); g.ellipse(COLO.x, COLO.y, rr * 1.3, rr, 0, 0, TAU); g.stroke(); }
  // Học Viện Starhollow: đá lát xanh lam, thảm thư viện
  g.fillStyle = '#2a2f3a'; g.fillRect(ACAD.x, ACAD.y, ACAD.w, ACAD.h);
  floor(ACAD.x, ACAD.y, ACAD.w, ACAD.h, 44, 0.02, 50, [0, 6, 18]);
  g.fillStyle = 'rgba(60,70,120,.45)'; g.fillRect(-1560, -500, 120, 572);
  g.strokeStyle = 'rgba(170,210,255,.25)'; g.lineWidth = 4;
  for (const rr of [80, 160]) { g.beginPath(); g.arc(-1550, -720, rr, 0, TAU); g.stroke(); }
  // Kinh Thành Aurumhold: đá lát màu cát vàng, Sân Ngai Sunthrone và gốc Cây Aurum
  floor(CAPITAL.x, CAPITAL.y, CAPITAL.w, CAPITAL.h, 50, 0.01, 96, [22, 14, -4]);
  floor(ARENA2.x, ARENA2.y, ARENA2.w, ARENA2.h, 50, 0.02, 80, [18, 10, -6]);
  g.strokeStyle = 'rgba(255,214,120,.3)'; g.lineWidth = 4;
  for (const rr of [100, 180]) { g.beginPath(); g.arc(1400, -1350, rr, 0, TAU); g.stroke(); }
  const tg = g.createRadialGradient(TREE_POS.x, TREE_POS.y, 30, TREE_POS.x, TREE_POS.y, 420);
  tg.addColorStop(0, 'rgba(240,210,120,.9)'); tg.addColorStop(1, 'rgba(240,210,120,0)');
  g.fillStyle = tg; g.fillRect(1050, WY0, 700, 212);
  g.fillStyle = 'rgba(200,170,90,.9)'; g.fillRect(1340, -940, 120, 50);
  // vực tối và núi đá
  for (const w of WALLS) {
    if (!w.void || w.x >= MAPW) continue;
    g.fillStyle = '#16140f'; g.fillRect(w.x, w.y, w.w, w.h);
    for (let i = 0; i < w.w * w.h / 9000; i++) {
      const x = w.x + r() * w.w, y = w.y + r() * w.h, s = 20 + r() * 60;
      g.fillStyle = r() < 0.5 ? '#221e17' : '#0e0c09'; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.8, y + s * 0.5); g.lineTo(x - s * 0.8, y + s * 0.5); g.closePath(); g.fill();
    }
  }
  // mép bản đồ tối lại
  const edge = (x0, y0, x1, y1, gx0, gy0, gx1, gy1) => { const gr = g.createLinearGradient(gx0, gy0, gx1, gy1); gr.addColorStop(0, 'rgba(10,9,6,.9)'); gr.addColorStop(1, 'rgba(10,9,6,0)'); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0); };
  edge(MAPW - 140, WY0, MAPW, H, MAPW, 0, MAPW - 140, 0); edge(WX0, H - 140, MAPW, H, 0, H, 0, H - 140); edge(300, WY0, MAPW, WY0 + 60, 0, WY0, 0, WY0 + 60);
  edge(-800, -900, -660, 400, -800, 0, -660, 0); edge(-2440, -900, -2300, 400, -2300, 0, -2440, 0); edge(0, -900, 140, 400, 0, 0, 140, 0);
  return c;
})();
// nền cho các khu biệt lập (Cõi Aurum, Sảnh Hearthhold, hầm ngục)
const IX0 = 5000, IH = 1600;
const GROUND2 = (function buildInstanceGround() {
  const GW = W - IX0, c = makeCanvas(GW / 2, IH / 2), g = c.getContext('2d'), r = mulberry32(99);
  g.scale(0.5, 0.5); g.translate(-IX0, 0);
  g.fillStyle = '#07060b'; g.fillRect(IX0, 0, GW, IH);
  for (let i = 0; i < 700; i++) { g.globalAlpha = 0.3 + r() * 0.7; g.fillStyle = r() < 0.8 ? '#fff6dc' : '#ffd98a'; g.beginPath(); g.arc(IX0 + r() * 1000, r() * 1000, 0.6 + r() * 1.6, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  const rg = g.createRadialGradient(RC.x, RC.y, 20, RC.x, RC.y, RC.r + 40);
  rg.addColorStop(0, '#6b5320'); rg.addColorStop(0.85, '#3a2d12'); rg.addColorStop(1, 'rgba(20,16,8,0)');
  g.fillStyle = rg; g.beginPath(); g.arc(RC.x, RC.y, RC.r + 40, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,220,130,.35)'; g.lineWidth = 4;
  for (const rr of [RC.r - 10, RC.r * 0.62, RC.r * 0.3]) { g.beginPath(); g.arc(RC.x, RC.y, rr, 0, TAU); g.stroke(); }
  g.lineWidth = 2;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(RC.x + Math.cos(a) * RC.r * 0.3, RC.y + Math.sin(a) * RC.r * 0.3); g.lineTo(RC.x + Math.cos(a) * (RC.r - 10), RC.y + Math.sin(a) * (RC.r - 10)); g.stroke(); }
  // Sảnh Hearthhold: sàn đá ấm, thảm đỏ, bàn tròn
  paintFloor(g, r, HUB.x, 0, HUB.w, HUB.h, 50, 0, 62, [14, 8, 0]);
  g.fillStyle = 'rgba(110,30,26,.75)'; g.fillRect(HUB.x + 440, 28, 120, HUB.h - 56); g.fillRect(HUB.x + 28, 400, HUB.w - 56, 100);
  g.strokeStyle = 'rgba(214,178,94,.4)'; g.lineWidth = 3; g.beginPath(); g.arc(HUB.x + 500, 450, 110, 0, TAU); g.stroke();
  // hầm ngục
  const THEME = { crypt: [52, [6, 4, 0]], crystal: [46, [0, 10, 24]], fire: [50, [18, 4, -4]], royal: [70, [18, 12, -2]] };
  for (const d of DUNGEONS) {
    const [base, tint] = THEME[d.theme], A = d.area;
    paintFloor(g, r, A.x, 0, A.w, A.h, 40, 0.04, base, tint);
    if (d.theme === 'crystal') for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.5 ? 'rgba(160,220,255,.5)' : 'rgba(210,240,255,.6)'; const x = A.x + r() * A.w, y = r() * A.h, s = 4 + r() * 8; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.5, y); g.lineTo(x, y + s * 0.6); g.lineTo(x - s * 0.5, y); g.closePath(); g.fill(); }
    if (d.theme === 'fire') for (const t of TRAPS) if (t.dg === d.id) { const tg2 = g.createRadialGradient(t.x, t.y, 4, t.x, t.y, t.r); tg2.addColorStop(0, 'rgba(60,20,10,.9)'); tg2.addColorStop(1, 'rgba(90,40,20,0)'); g.fillStyle = tg2; g.beginPath(); g.arc(t.x, t.y, t.r, 0, TAU); g.fill(); }
    g.strokeStyle = d.theme === 'royal' ? 'rgba(255,214,120,.3)' : d.theme === 'crystal' ? 'rgba(170,220,255,.28)' : 'rgba(200,180,150,.2)'; g.lineWidth = 4;
    g.beginPath(); g.arc(A.x + 500, 290, 160, 0, TAU); g.stroke();
  }
  return c;
})();

function makeCanopy(cr, golden, seed) {
  const r = mulberry32(seed), s = Math.ceil(cr * 2.7), c = makeCanvas(s, s), g = c.getContext('2d'), cx = s / 2;
  const pal = golden === 'spirit' ? ['#1c3534', '#27494a', '#34605d', '#4a7f78'] : golden === 'dead' ? ['#2f2a2b', '#3d3536', '#4b4144', '#5a4e50']
    : golden === 'lake' ? ['#1f3a3a', '#2a4d4c', '#386460', '#4d7d74'] : golden === 'coast' ? ['#2e3a22', '#3c4a2a', '#4d5c32', '#65703d']
    : golden ? ['#9a7526', '#b8912f', '#d4ab45', '#e8c761'] : ['#26331a', '#33431f', '#415227', '#50622d'];
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.arc(cx + cr * 0.12, cx + cr * 0.16, cr, 0, TAU); g.fill();
  g.fillStyle = pal[0]; g.beginPath(); g.arc(cx, cx, cr, 0, TAU); g.fill();
  for (let i = 0; i < 16; i++) {
    const a = r() * TAU, d = r() * cr * 0.5, rr = cr * (0.28 + r() * 0.3);
    g.globalAlpha = 0.9; g.fillStyle = pal[1 + ((r() * 3) | 0)];
    g.beginPath(); g.arc(cx + Math.cos(a) * d - cr * 0.06, cx + Math.sin(a) * d - cr * 0.08, rr, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  const hg = g.createRadialGradient(cx - cr * 0.35, cx - cr * 0.4, 0, cx - cr * 0.35, cx - cr * 0.4, cr * 1.1);
  hg.addColorStop(0, golden === 'spirit' || golden === 'lake' ? 'rgba(170,250,240,.3)' : golden === 'dead' ? 'rgba(190,170,180,.18)' : golden === true ? 'rgba(255,238,170,.5)' : 'rgba(180,200,120,.25)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = hg; g.beginPath(); g.arc(cx, cx, cr, 0, TAU); g.fill();
  return c;
}
const CANOPY = { green: [], gold: [], dead: [], spirit: [], lake: [], coast: [] };
for (let i = 0; i < 4; i++) {
  CANOPY.green.push(makeCanopy(52, false, 100 + i)); CANOPY.gold.push(makeCanopy(52, true, 200 + i)); CANOPY.dead.push(makeCanopy(52, 'dead', 300 + i));
  CANOPY.spirit.push(makeCanopy(52, 'spirit', 400 + i)); CANOPY.lake.push(makeCanopy(52, 'lake', 500 + i)); CANOPY.coast.push(makeCanopy(52, 'coast', 600 + i));
}
const BIGTREE = (function () {
  const s = 820, c = makeCanvas(s, s), g = c.getContext('2d'), r = mulberry32(9), cx = s / 2;
  const glow = g.createRadialGradient(cx, cx, 30, cx, cx, cx);
  glow.addColorStop(0, 'rgba(255,220,120,.55)'); glow.addColorStop(0.55, 'rgba(240,190,80,.2)'); glow.addColorStop(1, 'rgba(240,190,80,0)');
  g.fillStyle = glow; g.fillRect(0, 0, s, s);
  const pal = ['#a77b22', '#c99a35', '#e2b64d', '#f3d57a', '#fff0b3'];
  for (let i = 0; i < 260; i++) {
    const a = r() * TAU, d = Math.pow(r(), 0.7) * 290, rr = 18 + r() * 40;
    g.globalAlpha = 0.55 + r() * 0.35; g.fillStyle = pal[Math.min(4, ((1 - d / 290) * 4 + r() * 1.5) | 0)];
    g.beginPath(); g.arc(cx + Math.cos(a) * d, cx + Math.sin(a) * d, rr, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  return c;
})();
