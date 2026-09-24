'use strict';
// Vòng Vàng Vỡ — Dữ liệu thế giới và hình ảnh dựng sẵn
// ───────────────────────── thế giới ─────────────────────────
const MAPW = 4400, W = 5400, H = 3600; // MAPW: thế giới chính; phần còn lại là Cõi Vàng (trận cuối)
// độ khó chung: quái máu trâu hơn và đánh đau hơn
const DIFF = { hp: 1.25, dmg: 1.3 };
const ARENA = { x: 1000, y: 420, w: 800, h: 680 };
const TREE_POS = { x: 1400, y: 160 };
const SWAMP = { x: 2060, y: 1230, w: 720, h: 790 };
const LAIR = { x: 2420, y: 1620 };
const POOLS = [[2150, 1300, 70, 40], [2300, 1420, 90, 45], [2600, 1300, 80, 50], [2680, 1500, 60, 90], [2150, 1500, 60, 80], [2250, 1850, 100, 50], [2550, 1900, 90, 55], [2700, 1800, 50, 70], [2440, 1400, 70, 35], [2600, 1690, 60, 40]];
function inPool(x, y) {
  for (const [px, py, rx, ry] of POOLS) { const dx = (x - px) / rx, dy = (y - py) / ry; if (dx * dx + dy * dy < 1) return true; }
  return false;
}
function clampLair(x, y, m = 540) { const dx = x - LAIR.x, dy = y - LAIR.y, l = Math.hypot(dx, dy); return l > m ? [LAIR.x + dx / l * m, LAIR.y + dy / l * m] : [x, y]; }
const ROAD = [[1400, 3200], [1380, 2850], [1500, 2450], [1340, 2050], [1430, 1650], [1400, 1128]];
const ROADS = [ROAD, [[1500, 2450], [1900, 2420], [2400, 2560], [2900, 2850], [3600, 2880]], [[2900, 2850], [2920, 2300], [2900, 1800], [3300, 1720], [3600, 1560], [3600, 1320]]];
const FORT = { x: 3200, y: 500, w: 800, h: 800 };
const RC = { x: 4950, y: 1800, r: 420 }; // đấu trường trận cuối trong Cõi Vàng
const COLO = { x: 3600, y: 3230, rect: { x: 3200, y: 2950, w: 800, h: 560 } };
const FOREST = { x: 2850, y: 1900, w: 1500, h: 900 };
const BARRIER = { x: 3650, y: 2350, r: 150 };
const BRAZIERS = [{ id: 'e', x: 3780, y: 1440 }, { id: 'n', x: 3600, y: 1370 }, { id: 'w', x: 3420, y: 1440 }];
const BRAZIER_ORDER = ['e', 'n', 'w'];
const STATUES = [{ id: 's1', x: 2980, y: 1980 }, { id: 's2', x: 4250, y: 1990 }, { id: 's3', x: 2990, y: 2720 }, { id: 's4', x: 4240, y: 2720 }];
const FLAG = { x: 3600, y: 3230 };
// Bia Bản Đồ: đọc để mở toàn bộ một vùng trên bản đồ (như mảnh bản đồ trong Elden Ring)
// Bia Bản Đồ đặt gần lối vào mỗi vùng, trên đường chính (như Elden Ring, tháp trong Zelda BotW).
// Bia chỉ mở bản đồ dạng phác thảo: thấy địa hình và tên vùng; nơi đã tự đi qua mới hiện đầy đủ.
// Bí mật (rương, tượng, lò lửa, tường ảo, bên trong pháo đài) không bao giờ hiện lên bản đồ.
const MAP_FRAGS = [
  { id: 'm1', x: 1180, y: 2650, name: 'Đồng Cỏ Phía Nam', rect: { x: 0, y: 2230, w: 2050, h: 1370 } },
  { id: 'm2', x: 1620, y: 1380, name: 'Miền Bắc', rect: { x: 0, y: 420, w: 2100, h: 1180 } },
  { id: 'm3', x: 2150, y: 2080, name: 'Đầm Lầy Tro Độc', rect: { x: 2000, y: 1000, w: 800, h: 1100 } },
  { id: 'm4', x: 3020, y: 1700, name: 'Cao Nguyên Tro Đông', rect: { x: 2800, y: 420, w: 1600, h: 1480 } },
  { id: 'm5', x: 3060, y: 2250, name: 'Rừng Linh Hồn', rect: { x: 2850, y: 1900, w: 1500, h: 900 } },
  { id: 'm6', x: 3320, y: 2815, name: 'Vùng Nam Phía Đông', rect: { x: 2800, y: 2800, w: 1600, h: 800 } },
];
// sương mù bản đồ: mỗi ô 100×100 đơn vị, mở ra khi người chơi đi qua
const EXP_CELL = 100, EXP_COLS = Math.ceil(4400 / EXP_CELL), EXP_ROWS = Math.ceil(3600 / EXP_CELL);
const EXP = new Uint8Array(EXP_COLS * EXP_ROWS);
function explore(x, y, r) {
  if (x > 4400) return;
  const c0 = Math.max(0, Math.floor((x - r) / EXP_CELL)), c1 = Math.min(EXP_COLS - 1, Math.floor((x + r) / EXP_CELL));
  const r0 = Math.max(0, Math.floor((y - r) / EXP_CELL)), r1 = Math.min(EXP_ROWS - 1, Math.floor((y + r) / EXP_CELL));
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
    if (dist(x, y, (cx + 0.5) * EXP_CELL, (cy + 0.5) * EXP_CELL) < r) EXP[cy * EXP_COLS + cx] = 1;
  }
}
function expEncode() { let out = ''; for (let i = 0; i < EXP.length; i += 4) out += ((EXP[i] | 0) | (EXP[i + 1] | 0) << 1 | (EXP[i + 2] | 0) << 2 | (EXP[i + 3] | 0) << 3).toString(16); return out; }
function expDecode(str) {
  EXP.fill(0);
  if (!str) return;
  for (let k = 0; k < str.length; k++) { const v = parseInt(str[k], 16) || 0; for (let b = 0; b < 4; b++) if (k * 4 + b < EXP.length) EXP[k * 4 + b] = (v >> b) & 1; }
}
function fragAt(x, y) { return !inRect(x, y, FORT) && MAP_FRAGS.some(f => S.frags.includes(f.id) && inRect(x, y, f.rect)); }
function revealedAt(x, y) {
  const cx = Math.floor(x / EXP_CELL), cy = Math.floor(y / EXP_CELL);
  if (cx >= 0 && cy >= 0 && cx < EXP_COLS && cy < EXP_ROWS && EXP[cy * EXP_COLS + cx]) return true;
  return fragAt(x, y);
}
const inRect = (x, y, r, m = 0) => x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m;
const WALLS = [
  // đấu trường của Varek
  { x: 972, y: 392, w: 28, h: 736 }, { x: 1800, y: 392, w: 28, h: 736 },
  { x: 972, y: 392, w: 388, h: 28 }, { x: 1440, y: 392, w: 388, h: 28 },
  { x: 972, y: 1100, w: 388, h: 28 }, { x: 1440, y: 1100, w: 388, h: 28 },
  { x: 1360, y: 392, w: 80, h: 28, gate: 'north' },
  { x: 1360, y: 1100, w: 80, h: 28, gate: 'fog' },
  // vách đá chặn phía bắc
  { x: 0, y: 380, w: 972, h: 40, cliff: true }, { x: 1828, y: 380, w: MAPW - 1828, h: 40, cliff: true }, { x: MAPW, y: 0, w: 90, h: H, void: true },
  // nhà nguyện khởi đầu
  { x: 1250, y: 3200, w: 100, h: 22 }, { x: 1450, y: 3200, w: 100, h: 22 },
  { x: 1250, y: 3200, w: 22, h: 260 }, { x: 1528, y: 3200, w: 22, h: 260 }, { x: 1250, y: 3438, w: 300, h: 22 },
  // tàn tích phía tây
  { x: 420, y: 1650, w: 220, h: 24 }, { x: 760, y: 1650, w: 220, h: 24 },
  { x: 420, y: 1650, w: 24, h: 200 }, { x: 956, y: 1650, w: 24, h: 150 },
  { x: 420, y: 1960, w: 24, h: 204 }, { x: 420, y: 2140, w: 300, h: 24 },
  { x: 840, y: 2140, w: 140, h: 24 }, { x: 956, y: 1900, w: 24, h: 264 },
  { x: 600, y: 1860, w: 90, h: 20 },
  // Pháo Đài Đá Xám
  { x: 3200, y: 500, w: 800, h: 28 }, { x: 3200, y: 500, w: 28, h: 800 }, { x: 3972, y: 500, w: 28, h: 800 },
  { x: 3200, y: 1272, w: 340, h: 28 }, { x: 3660, y: 1272, w: 340, h: 28 }, { x: 3540, y: 1272, w: 120, h: 28, gate: 'fort' },
  { x: 3400, y: 528, w: 28, h: 260 }, { x: 3772, y: 528, w: 28, h: 260 }, { x: 3400, y: 760, w: 140, h: 28 }, { x: 3660, y: 760, w: 140, h: 28 },
  { x: 3228, y: 1100, w: 112, h: 24 }, { x: 3340, y: 1100, w: 24, h: 172, illusory: 'w_fort' },
  // căn nhà không cửa
  { x: 2950, y: 3150, w: 150, h: 22 }, { x: 2950, y: 3150, w: 22, h: 150 }, { x: 3078, y: 3150, w: 22, h: 150 }, { x: 2950, y: 3278, w: 150, h: 22, illusory: 'w_hut' },
  // Đấu Trường Thử Thách
  { x: 3200, y: 2950, w: 340, h: 28 }, { x: 3660, y: 2950, w: 340, h: 28 }, { x: 3540, y: 2950, w: 120, h: 28, gate: 'colo' },
  { x: 3200, y: 2950, w: 28, h: 560 }, { x: 3972, y: 2950, w: 28, h: 560 }, { x: 3200, y: 3482, w: 800, h: 28 },
];
function wallOn(w, enemy) {
  if (w.gate === 'north') return enemy || !S.bossDead;
  if (w.gate === 'fog') return enemy || G.bossFight;
  if (w.gate === 'fort') return !S.fortOpen;
  if (w.gate === 'colo') return enemy || G.colo.active;
  if (w.illusory) return !S.illusory.includes(w.illusory);
  return true;
}
const GRACES = [
  { id: 0, x: 1400, y: 3330, name: 'Ân Điển Nhà Nguyện' },
  { id: 1, x: 1850, y: 2950, name: 'Ân Điển Đồng Cỏ' },
  { id: 2, x: 700, y: 2320, name: 'Ân Điển Tàn Tích' },
  { id: 3, x: 1400, y: 1290, name: 'Ân Điển Cổng Varek' },
  { id: 4, x: 2000, y: 2350, name: 'Ân Điển Bờ Đầm' },
  { id: 5, x: 3600, y: 1700, name: 'Ân Điển Chân Pháo Đài' },
  { id: 6, x: 3100, y: 2400, name: 'Ân Điển Rừng Linh Hồn' },
  { id: 7, x: 3600, y: 2860, name: 'Ân Điển Đấu Trường' },
  { id: 8, x: 1300, y: 330, name: 'Ân Điển Gốc Cây Vàng' },
];
const ITEMS = [
  { id: 'seed1', x: 470, y: 1710, kind: 'seed' },
  { id: 'seed2', x: 2480, y: 2300, kind: 'seed' },
  { id: 'seed3', x: 260, y: 2950, kind: 'runes', amount: 400 },
  { id: 'seed4', x: 500, y: 800, kind: 'runes', amount: 500 },
  { id: 'stone1', x: 910, y: 1710, kind: 'stone' },
  { id: 'stone2', x: 2715, y: 1235, kind: 'stone' },
  { id: 'stone3', x: 1000, y: 2960, kind: 'stone' },
  { id: 'stone4', x: 2200, y: 900, kind: 'stone' },
  { id: 'seed5', x: 2130, y: 1985, kind: 'seed' },
];
const CHESTS = [
  { id: 'c_sword', x: 820, y: 2980, loot: { weapon: 'sword' } },
  { id: 'c_katana', x: 700, y: 1760, loot: { weapon: 'katana' } },
  { id: 'c_spear', x: 2300, y: 3390, loot: { weapon: 'spear' } },
  { id: 'c_north', x: 2600, y: 900, loot: { runes: 300, stone: 1 } },
  { id: 'c_west', x: 300, y: 1500, loot: { runes: 400 } },
  { id: 'c_swamp', x: 2720, y: 2000, loot: { runes: 600, stone: 1 } },
  { id: 'c_troll', x: 2900, y: 1150, loot: { runes: 500, seed: 1 } },
  { id: 'c_fort_secret', x: 3284, y: 1190, loot: { runes: 1500 } },
  { id: 'c_keep', x: 3700, y: 610, loot: { runes: 800, stone: 2 } },
  { id: 'c_hut', x: 3025, y: 3225, loot: { runes: 700, stone: 1 } },
  { id: 'c_glade', x: 3650, y: 2300, loot: { seed: 1, stone: 1 }, req: () => S.glade },
  { id: 'c_colo', x: 3600, y: 3330, loot: { runes: 2500, stone: 2 }, req: () => S.coloDone, noObst: true },
];
const NOTES = [
  { x: 1400, y: 3130, text: 'Phía trước có kẻ địch. Lăn né (Space) đúng lúc chúng vung vũ khí.' },
  { x: 1470, y: 2300, text: 'Kẻ địch lảo đảo sau vài đòn. Đòn mạnh phá thế đứng nhanh hơn.' },
  { x: 2120, y: 2560, text: 'Cẩn thận: bầy sói. Hãy lùi lại và đánh từng con.' },
  { x: 700, y: 2230, text: 'Kho báu ở phía trước... và cả một kỵ sĩ. Khi hắn quỳ gối, hãy đâm chí mạng.' },
  { x: 1320, y: 1220, text: 'Kẻ canh cổng thích đánh chậm một nhịp. Đừng lăn quá sớm.' },
  { x: 1440, y: 330, text: 'Ánh vàng ở ngay phía trước.' },
  { x: 2040, y: 2240, text: 'Con rồng ngủ trong đầm lầy phía bắc. Cưỡi ngựa để băng qua ao độc.' },
  { x: 1480, y: 1240, text: 'Giơ khiên đúng lúc hắn vung kiếm... rồi đâm chí mạng.' },
  { x: 3600, y: 1530, text: '“Mặt trời mọc ở phía đông, đứng bóng trên đỉnh, rồi lặn về phía tây.” Hãy thắp lửa theo đúng đường đi của nó.' },
  { x: 3400, y: 1235, text: 'Bức tường phía tây này nghe rỗng tuếch... Hãy thử tấn công nó.' },
  { x: 3160, y: 2330, text: 'Bốn tượng đá ngủ ở bốn góc rừng. Đánh thức cả bốn, kết giới sẽ tan.' },
  { x: 3600, y: 3140, text: 'Chạm vào lá cờ để bắt đầu thử thách. Ba đợt kẻ thù, không đường lui.' },
  { x: 3025, y: 3110, text: 'Một căn nhà không có cửa ra vào?' },
  { x: 2830, y: 1360, text: 'Cẩn thận người khổng lồ đá. Lăn vào trong khi nó giơ chùy lên.' },
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
];
const REGIONS = [
  { name: 'Cõi Vàng', test: x => x > MAPW },
  { name: 'Gốc Cây Vàng', test: (x, y) => y < 390 },
  { name: 'Đấu Trường Cổng Varek', test: (x, y) => x > ARENA.x && x < ARENA.x + ARENA.w && y > ARENA.y && y < ARENA.y + ARENA.h },
  { name: 'Đầm Lầy Tro Độc', test: (x, y) => x > SWAMP.x && x < SWAMP.x + SWAMP.w && y > SWAMP.y && y < SWAMP.y + SWAMP.h },
  { name: 'Tàn Tích Phía Tây', test: (x, y) => x > 380 && x < 1020 && y > 1600 && y < 2200 },
  { name: 'Nhà Nguyện Khởi Đầu', test: (x, y) => x > 1220 && x < 1580 && y > 3170 },
  { name: 'Pháo Đài Đá Xám', test: (x, y) => inRect(x, y, FORT) },
  { name: 'Đấu Trường Thử Thách', test: (x, y) => inRect(x, y, COLO.rect) },
  { name: 'Rừng Linh Hồn', test: (x, y) => inRect(x, y, FOREST) },
  { name: 'Cao Nguyên Tro Đông', test: (x) => x > 2800 },
  { name: 'Đồng Cỏ Sương Mờ', test: () => true },
];

// chướng ngại (cây, đá) sinh bằng seed cố định
const OBST = [];
const CELL = 160, GRID = new Map();
function nearRoad(x, y) { let m = 1e9; for (const R of ROADS) for (let i = 1; i < R.length; i++) m = Math.min(m, segDist(x, y, R[i - 1][0], R[i - 1][1], R[i][0], R[i][1])); return m; }
function spotBlocked(x, y, pad) {
  if (x < 60 || x > MAPW - 60 || y < 460 || y > H - 60) return true;
  if (x > 930 && x < 1870 && y < 1200) return true;
  if (x > 370 && x < 1030 && y > 1600 && y < 2210) return true;
  if (x > 1210 && x < 1590 && y > 3150) return true;
  if (nearRoad(x, y) < 58 + pad) return true;
  if (dist(x, y, LAIR.x, LAIR.y) < 360) return true;
  if (inRect(x, y, FORT, 34) || inRect(x, y, COLO.rect, 34) || (x > 2920 && x < 3130 && y > 3120 && y < 3330)) return true;
  if (dist(x, y, BARRIER.x, BARRIER.y) < BARRIER.r + 40) return true;
  if (x > 3380 && x < 3820 && y > 1330 && y < 1560) return true;
  for (const [px, py, rx, ry] of POOLS) { const dx = (x - px) / (rx + pad + 16), dy = (y - py) / (ry + pad + 16); if (dx * dx + dy * dy < 1) return true; }
  for (const g of GRACES) if (dist(x, y, g.x, g.y) < 130) return true;
  for (const it of ITEMS) if (dist(x, y, it.x, it.y) < 60) return true;
  for (const n of NOTES) if (dist(x, y, n.x, n.y) < 50) return true;
  for (const s of SPAWNS) if (dist(x, y, s[1], s[2]) < 55) return true;
  for (const o of OBST) if (dist(x, y, o.x, o.y) < o.r + pad + 36) return true;
  return false;
}
(function genObstacles() {
  const r = mulberry32(20250311);
  for (const c of CHESTS) if (!c.noObst) OBST.push({ kind: 'chest', x: c.x, y: c.y, r: 14, chest: c });
  for (const b of BRAZIERS) OBST.push({ kind: 'brazier', x: b.x, y: b.y, r: 14 });
  for (const st of STATUES) OBST.push({ kind: 'statue', x: st.x, y: st.y, r: 16 });
  for (const f of MAP_FRAGS) OBST.push({ kind: 'stele', x: f.x, y: f.y, r: 12 });
  OBST.push({ kind: 'flag', x: FLAG.x, y: FLAG.y, r: 8 });
  let tries = 0;
  while (OBST.filter(o => o.kind === 'tree').length < 370 && tries++ < 14000) {
    const x = r() * W, y = 460 + r() * (H - 460), tr = 13 + r() * 6;
    if (spotBlocked(x, y, 22)) continue;
    OBST.push({ kind: 'tree', x, y, r: tr, cr: tr * 2.6 + r() * 12, golden: r() < 0.22, spr: (r() * 4) | 0, dead: x > SWAMP.x - 40 && x < 2820 && y > SWAMP.y && y < SWAMP.y + SWAMP.h, spirit: inRect(x, y, FOREST) });
  }
  tries = 0;
  while (OBST.filter(o => o.kind === 'rock').length < 85 && tries++ < 6000) {
    const x = r() * W, y = 460 + r() * (H - 460), rr = 12 + r() * 16;
    if (spotBlocked(x, y, 10)) continue;
    OBST.push({ kind: 'rock', x, y, r: rr, seed: (r() * 1e6) | 0 });
  }
  // cột đổ trong tàn tích
  [[560, 1760, 16], [820, 1800, 18], [520, 2040, 15], [880, 2080, 14], [760, 1720, 12]].forEach(([x, y, rr]) => OBST.push({ kind: 'rock', x, y, r: rr, seed: x * 7 + y, pillar: true }));
  // mép vách đá
  for (let x = 20; x < W; x += 44) {
    if ((x > 940 && x < 1860) || x > MAPW - 30) continue;
    OBST.push({ kind: 'rock', x: x + r() * 12, y: 398 + r() * 14, r: 20 + r() * 10, seed: (r() * 1e6) | 0, cliff: true });
  }
  // rừng vàng phía bắc
  for (let i = 0; i < 26; i++) {
    const x = 60 + r() * (MAPW - 120), y = 40 + r() * 300;
    if (Math.abs(x - 1400) < 190 || dist(x, y, TREE_POS.x, TREE_POS.y) < 330) continue;
    OBST.push({ kind: 'tree', x, y, r: 14, cr: 44 + r() * 14, golden: true, spr: (r() * 4) | 0 });
  }
  OBST.push({ kind: 'bigtree', x: TREE_POS.x, y: TREE_POS.y, r: 58 });
  for (const o of OBST) {
    const k = Math.floor(o.x / CELL) + ',' + Math.floor(o.y / CELL);
    if (!GRID.has(k)) GRID.set(k, []);
    GRID.get(k).push(o);
  }
})();

// ───────────────────────── dựng sẵn hình ảnh ─────────────────────────
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const GROUND = (function buildGround() {
  const c = makeCanvas(W / 2, H / 2), g = c.getContext('2d'), r = mulberry32(77);
  g.scale(0.5, 0.5);
  g.fillStyle = '#454f2e'; g.fillRect(0, 0, W, H);
  const greens = ['#3d4729', '#4f5a33', '#5a6138', '#48532d', '#626a3c', '#3a4226', '#57603a'];
  for (let i = 0; i < 2600; i++) {
    g.globalAlpha = 0.22 + r() * 0.25; g.fillStyle = greens[(r() * greens.length) | 0];
    g.beginPath(); g.ellipse(r() * W, r() * H, 20 + r() * 90, 12 + r() * 50, r() * TAU, 0, TAU); g.fill();
  }
  g.globalAlpha = 0.5; g.lineWidth = 2;
  for (let i = 0; i < 9000; i++) {
    const x = r() * W, y = r() * H;
    g.strokeStyle = r() < 0.5 ? '#66713d' : '#343d1e';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 7, y - 4 - r() * 7); g.stroke();
  }
  g.globalAlpha = 0.85;
  for (let i = 0; i < 1500; i++) {
    const p = r();
    g.fillStyle = p < 0.55 ? '#d9c46a' : p < 0.85 ? '#e9e2cf' : '#b7a0d4';
    g.beginPath(); g.arc(r() * W, r() * H, 1.4 + r() * 1.6, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  // đồng cỏ vàng phía bắc
  const ng = g.createLinearGradient(0, 0, 0, 470);
  ng.addColorStop(0, 'rgba(200,164,72,.85)'); ng.addColorStop(0.75, 'rgba(168,138,62,.5)'); ng.addColorStop(1, 'rgba(168,138,62,0)');
  g.fillStyle = ng; g.fillRect(0, 0, W, 470);
  for (let i = 0; i < 1000; i++) { g.globalAlpha = 0.75; g.fillStyle = r() < 0.5 ? '#f0d27a' : '#fff1b8'; g.beginPath(); g.arc(r() * W, r() * 380, 1.5 + r() * 2, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
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
  // con đường
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
  const road = (w, col, a) => { g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = w; for (const R of ROADS) { g.beginPath(); R.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); } };
  road(88, '#4d432c', 0.5); road(66, '#6c5d40', 0.85); road(38, '#7e6d4b', 0.5);
  g.globalAlpha = 0.6;
  for (let i = 1; i < ROAD.length; i++) {
    const [ax, ay] = ROAD[i - 1], [bx, by] = ROAD[i];
    for (let k = 0; k < 60; k++) { const t = r(); g.fillStyle = r() < 0.5 ? '#8d7c58' : '#554a33'; g.beginPath(); g.arc(lerp(ax, bx, t) + (r() - 0.5) * 60, lerp(ay, by, t) + (r() - 0.5) * 20, 1.5 + r() * 2.5, 0, TAU); g.fill(); }
  }
  g.globalAlpha = 1;
  // nền đá lát
  const floor = (x, y, w, h, ts, holes, base) => {
    for (let ty = y; ty < y + h; ty += ts) for (let tx = x; tx < x + w; tx += ts) {
      if (holes && r() < holes) continue;
      const s = base + ((r() * 16) | 0);
      g.fillStyle = `rgb(${s + 12},${s + 9},${s})`;
      g.fillRect(tx + 1.5, ty + 1.5, Math.min(ts, x + w - tx) - 3, Math.min(ts, y + h - ty) - 3);
      if (r() < 0.25) { g.strokeStyle = 'rgba(20,18,14,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(tx + r() * ts, ty + r() * ts); g.lineTo(tx + r() * ts, ty + r() * ts); g.stroke(); }
    }
  };
  g.fillStyle = '#3a372f'; g.fillRect(ARENA.x - 10, ARENA.y - 10, ARENA.w + 20, ARENA.h + 20);
  floor(ARENA.x - 10, ARENA.y - 10, ARENA.w + 20, ARENA.h + 20, 50, 0.03, 70);
  // vòng tròn khắc giữa đấu trường
  g.strokeStyle = 'rgba(214,178,94,.22)'; g.lineWidth = 4;
  g.beginPath(); g.arc(1400, 760, 190, 0, TAU); g.stroke();
  g.beginPath(); g.arc(1400, 760, 120, 0.3, TAU - 0.3); g.stroke();
  floor(430, 1660, 540, 490, 44, 0.3, 64);
  floor(1260, 3210, 280, 240, 40, 0.05, 72);
  floor(1360, 170, 80, 230, 40, 0.1, 86);
  floor(3210, 510, 780, 780, 48, 0.06, 62);
  floor(3420, 530, 360, 240, 40, 0.02, 52);
  floor(2960, 3160, 130, 130, 32, 0, 60);
  g.fillStyle = '#7d6d4f'; g.fillRect(3210, 2960, 780, 540);
  g.strokeStyle = 'rgba(60,48,30,.35)'; g.lineWidth = 3;
  for (const rr of [60, 140, 220]) { g.beginPath(); g.ellipse(COLO.x, COLO.y, rr * 1.3, rr, 0, 0, TAU); g.stroke(); }
  // Cõi Vàng
  g.fillStyle = '#07060b'; g.fillRect(MAPW, 0, W - MAPW, H);
  for (let i = 0; i < 700; i++) { g.globalAlpha = 0.3 + r() * 0.7; g.fillStyle = r() < 0.8 ? '#fff6dc' : '#ffd98a'; g.beginPath(); g.arc(MAPW + 90 + r() * (W - MAPW - 90), r() * H, 0.6 + r() * 1.6, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  const rg = g.createRadialGradient(RC.x, RC.y, 20, RC.x, RC.y, RC.r + 40);
  rg.addColorStop(0, '#6b5320'); rg.addColorStop(0.85, '#3a2d12'); rg.addColorStop(1, 'rgba(20,16,8,0)');
  g.fillStyle = rg; g.beginPath(); g.arc(RC.x, RC.y, RC.r + 40, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,220,130,.35)'; g.lineWidth = 4;
  for (const rr of [RC.r - 10, RC.r * 0.62, RC.r * 0.3]) { g.beginPath(); g.arc(RC.x, RC.y, rr, 0, TAU); g.stroke(); }
  g.lineWidth = 2;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(RC.x + Math.cos(a) * RC.r * 0.3, RC.y + Math.sin(a) * RC.r * 0.3); g.lineTo(RC.x + Math.cos(a) * (RC.r - 10), RC.y + Math.sin(a) * (RC.r - 10)); g.stroke(); }
  // mép bản đồ tối lại
  const edge = (x0, y0, x1, y1, gx0, gy0, gx1, gy1) => { const gr = g.createLinearGradient(gx0, gy0, gx1, gy1); gr.addColorStop(0, 'rgba(10,9,6,.9)'); gr.addColorStop(1, 'rgba(10,9,6,0)'); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0); };
  edge(0, 0, 140, H, 0, 0, 140, 0); edge(W - 140, 0, W, H, W, 0, W - 140, 0); edge(0, H - 140, W, H, 0, H, 0, H - 140); edge(0, 0, W, 60, 0, 0, 0, 60);
  return c;
})();

function makeCanopy(cr, golden, seed) {
  const r = mulberry32(seed), s = Math.ceil(cr * 2.7), c = makeCanvas(s, s), g = c.getContext('2d'), cx = s / 2;
  const pal = golden === 'spirit' ? ['#1c3534', '#27494a', '#34605d', '#4a7f78'] : golden === 'dead' ? ['#2f2a2b', '#3d3536', '#4b4144', '#5a4e50'] : golden ? ['#9a7526', '#b8912f', '#d4ab45', '#e8c761'] : ['#26331a', '#33431f', '#415227', '#50622d'];
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.arc(cx + cr * 0.12, cx + cr * 0.16, cr, 0, TAU); g.fill();
  g.fillStyle = pal[0]; g.beginPath(); g.arc(cx, cx, cr, 0, TAU); g.fill();
  for (let i = 0; i < 16; i++) {
    const a = r() * TAU, d = r() * cr * 0.5, rr = cr * (0.28 + r() * 0.3);
    g.globalAlpha = 0.9; g.fillStyle = pal[1 + ((r() * 3) | 0)];
    g.beginPath(); g.arc(cx + Math.cos(a) * d - cr * 0.06, cx + Math.sin(a) * d - cr * 0.08, rr, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  const hg = g.createRadialGradient(cx - cr * 0.35, cx - cr * 0.4, 0, cx - cr * 0.35, cx - cr * 0.4, cr * 1.1);
  hg.addColorStop(0, golden === 'spirit' ? 'rgba(170,250,240,.32)' : golden === 'dead' ? 'rgba(190,170,180,.18)' : golden ? 'rgba(255,238,170,.5)' : 'rgba(180,200,120,.25)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = hg; g.beginPath(); g.arc(cx, cx, cr, 0, TAU); g.fill();
  return c;
}
const CANOPY = { green: [], gold: [], dead: [], spirit: [] };
for (let i = 0; i < 4; i++) { CANOPY.green.push(makeCanopy(52, false, 100 + i)); CANOPY.gold.push(makeCanopy(52, true, 200 + i)); CANOPY.dead.push(makeCanopy(52, 'dead', 300 + i)); CANOPY.spirit.push(makeCanopy(52, 'spirit', 400 + i)); }
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
