'use strict';
/* Vòng Vàng Vỡ — souls-like 2D lấy cảm hứng từ Elden Ring. Không phụ thuộc thư viện ngoài. */
(() => {
// ───────────────────────── tiện ích ─────────────────────────
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
function turn(a, target, step) { return a + clamp(angDiff(a, target), -step, step); }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  const t = l ? clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}
function inArc(ax, ay, face, range, arc, tx, ty, tr) {
  const d = dist(ax, ay, tx, ty);
  if (d > range + tr) return false;
  if (d < tr + 4) return true;
  return Math.abs(angDiff(face, Math.atan2(ty - ay, tx - ax))) <= arc / 2 + Math.atan2(tr, d);
}
const $ = id => document.getElementById(id);

// ───────────────────────── canvas ─────────────────────────
const canvas = $('game');
const ctx = canvas.getContext('2d');
let DPR = 1, CW = 800, CH = 600, ZOOM = 1, VIGNETTE = null;
function resize() {
  const r = canvas.getBoundingClientRect();
  CW = Math.max(1, r.width); CH = Math.max(1, r.height);
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(CW * DPR); canvas.height = Math.round(CH * DPR);
  ZOOM = clamp(Math.sqrt(CW * CH) / 780, 0.62, 1.5);
  VIGNETTE = ctx.createRadialGradient(CW / 2, CH / 2, Math.min(CW, CH) * 0.3, CW / 2, CH / 2, Math.max(CW, CH) * 0.78);
  VIGNETTE.addColorStop(0, 'rgba(6,5,3,0)');
  VIGNETTE.addColorStop(1, 'rgba(6,5,3,0.66)');
}
window.addEventListener('resize', resize);
resize();

const FONT_D = '"Cormorant SC","Cormorant Garamond",Georgia,serif';
const FONT_I = '"Cormorant Garamond",Georgia,serif';
const FONT_U = '"Be Vietnam Pro",system-ui,sans-serif';

// ───────────────────────── âm thanh (tổng hợp bằng WebAudio) ─────────────────────────
let AC = null, master = null, muted = false, noiseBuf = null;
function audioInit() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = 0.5; master.connect(AC.destination);
    }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { AC = null; }
}
function tone(f, dur, type = 'sine', vol = 0.12, slide = 0, delay = 0) {
  if (!AC || muted) return;
  const t0 = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(dur, vol = 0.2, freq = 1200, q = 1, delay = 0) {
  if (!AC || muted) return;
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t0 = AC.currentTime + delay, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.05);
}
const SFX = {
  swing: () => noise(0.14, 0.12, 2800, 0.8),
  heavy: () => noise(0.26, 0.18, 1300, 0.7),
  hit: () => { noise(0.12, 0.3, 700, 1.2); tone(140, 0.12, 'square', 0.06, -80); },
  crit: () => { noise(0.3, 0.4, 500, 1); tone(90, 0.45, 'sawtooth', 0.1, -50); },
  hurt: () => { noise(0.15, 0.25, 500, 1); tone(110, 0.2, 'sawtooth', 0.08, -50); },
  roll: () => noise(0.2, 0.08, 500, 0.6),
  spell: () => { tone(1200, 0.25, 'triangle', 0.07, -500); tone(1800, 0.2, 'sine', 0.04, -800); },
  drink: () => { tone(420, 0.35, 'sine', 0.07, 260); tone(630, 0.4, 'sine', 0.05, 300, 0.1); },
  grace: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 1.3, 'sine', 0.06, 0, i * 0.12)),
  death: () => { tone(98, 2.4, 'sawtooth', 0.08, -40); tone(147, 2.4, 'sine', 0.06, -60); },
  felled: () => [392, 523.25, 659.25, 783.99].forEach((f, i) => tone(f, 2, 'triangle', 0.06, 0, i * 0.18)),
  boom: () => { noise(0.5, 0.45, 220, 0.7); tone(60, 0.5, 'sine', 0.18, -30); },
  pickup: () => { tone(880, 0.3, 'sine', 0.06); tone(1320, 0.4, 'sine', 0.05, 0, 0.08); },
  glint: () => tone(2400, 0.08, 'sine', 0.03),
  roar: () => { noise(1.2, 0.3, 300, 0.5); tone(70, 1.2, 'sawtooth', 0.1, 20); },
  whistle: () => { tone(1500, 0.18, 'sine', 0.05, 400); tone(1900, 0.25, 'sine', 0.05, 300, 0.18); },
  block: () => { noise(0.12, 0.25, 1800, 2); tone(620, 0.1, 'square', 0.04); },
  parry: () => { tone(2200, 0.4, 'triangle', 0.08, -500); noise(0.2, 0.3, 3200, 3); },
  fire: (d = 1.7) => noise(d, 0.22, 700, 0.5),
  wing: () => noise(0.5, 0.25, 240, 0.6),
  bleed: () => { tone(180, 0.25, 'sawtooth', 0.07, -60); noise(0.25, 0.3, 900, 1); },
  poison: () => tone(160, 0.5, 'sine', 0.06, -60),
};

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
  { id: 'seed3', x: 260, y: 2950, kind: 'seed' },
  { id: 'seed4', x: 500, y: 800, kind: 'seed' },
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
  { id: 'c_west', x: 300, y: 1500, loot: { runes: 200, seed: 1 } },
  { id: 'c_swamp', x: 2720, y: 2000, loot: { runes: 600, stone: 1 } },
  { id: 'c_troll', x: 2900, y: 1150, loot: { runes: 500, seed: 1 } },
  { id: 'c_fort_secret', x: 3284, y: 1190, loot: { runes: 1000, seed: 1 } },
  { id: 'c_keep', x: 3700, y: 610, loot: { runes: 800, stone: 2 } },
  { id: 'c_hut', x: 3025, y: 3225, loot: { runes: 700, stone: 1 } },
  { id: 'c_glade', x: 3650, y: 2300, loot: { seed: 1, stone: 1 }, req: () => S.glade },
  { id: 'c_colo', x: 3600, y: 3330, loot: { runes: 2500, stone: 2, seed: 1 }, req: () => S.coloDone, noObst: true },
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

// ───────────────────────── trạng thái ─────────────────────────
const SAVE_KEY = 'vong-vang-vo-save-v1';
function defaultSave() {
  return { level: 1, stats: { vig: 10, end: 10, str: 10, mnd: 10 }, runes: 0, weaponLv: 0, flaskMax: 3, lastGrace: 0, discovered: [0], bossDead: false, taken: [], lost: null, treeReached: false, deaths: 0, time: 0, weapons: ['broken'], equipped: 'broken', dragonDead: false, finalDead: false, chests: [], fortOpen: false, statues: [], glade: false, illusory: [], coloDone: false, mb: {} };
}
let S = defaultSave();
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* bộ nhớ trình duyệt bị chặn */ } }
function loadSave() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.stats) return s; } catch (e) { /* bỏ qua */ }
  return null;
}
const FLASK_CAP = 8;
const maxHp = () => 180 + 18 * (S.stats.vig - 10);
const maxSt = () => 80 + 5 * (S.stats.end - 10);
const maxFp = () => 50 + 7 * (S.stats.mnd - 10);
const weaponDmg = () => 18 + 2.6 * (S.stats.str - 10) + 5 * S.weaponLv;
const spellDmg = () => 26 + 3.5 * (S.stats.mnd - 10);
// Elden Ring tăng sức mạnh quái theo vùng đất; game này cộng thêm một lượng nhỏ theo cấp người chơi.
function regionMul(x, y) {
  if (x > MAPW) return 1.4;
  if (y < 420) return 1.45;
  if (inRect(x, y, COLO.rect)) return 1.5;
  if (inRect(x, y, FORT)) return 1.45;
  if (inRect(x, y, FOREST)) return 1.4;
  if (x > 2800) return 1.35;
  if (x > SWAMP.x && y > SWAMP.y && y < SWAMP.y + SWAMP.h) return 1.25;
  if (x > ARENA.x && x < ARENA.x + ARENA.w && y > ARENA.y && y < ARENA.y + ARENA.h) return 1.2;
  if (y < 1600 || (x > 370 && x < 1030 && y < 2210)) return 1.1;
  return 1;
}
const lvHp = () => 1 + 0.03 * (S.level - 1);
const lvDmg = () => 1 + 0.02 * (S.level - 1);
const levelCost = () => Math.floor(200 * Math.pow(1.14, S.level - 1) + 35 * S.level);

const G = {
  mode: 'title', clock: 0, hitStop: 0, shake: 0, flash: 0, fade: 0, bossFight: false,
  banner: null, region: null, regionT: 0, sub: null, prompt: null, deathT: 0, runeGain: 0, runeGainT: 0,
  touch: false, timers: [], hintT: 0, toast: null, dragonFight: false, fpWarn: 0,
  colo: { active: false, wave: 0, cool: 0 }, braziers: [], finalFight: false, white: 0,
};
const P = {
  x: 1400, y: 3376, r: 13, vx: 0, vy: 0, face: -Math.PI / 2, state: 'idle', t: 0,
  hp: 180, maxHp: 180, ghost: 180, ghostDelay: 0, st: 80, maxSt: 80, stDelay: 0, fp: 50, maxFp: 50,
  flasks: 4, invuln: 0, mounted: false, lock: null, atk: null, walk: 0, mvx: 0, mvy: 0, rollDir: 0, hurtDur: 0.3,
  poisonB: 0, poisonT: 0, lastGuardAt: -9, parryOk: false,
};
const cam = { x: P.x, y: P.y };
let enemies = [];
let boss = null, dragon = null, fb = null;
const projs = [], aoes = [], parts = [], puddles = [];

function applyStats(full) {
  P.maxHp = maxHp(); P.maxSt = maxSt(); P.maxFp = maxFp();
  if (full) { P.hp = P.maxHp; P.st = P.maxSt; P.fp = P.maxFp; P.flasks = S.flaskMax; P.ghost = P.hp; P.poisonB = 0; P.poisonT = 0; }
  else { P.hp = Math.min(P.hp, P.maxHp); P.st = Math.min(P.st, P.maxSt); P.fp = Math.min(P.fp, P.maxFp); }
}

// ───────────────────────── kẻ địch ─────────────────────────
const LOOK_BASE = { body: '#474b52', trim: '#8d9199', head: '#5b5f67', cloak: '#5e1f1c', scale: 1 };
const WEAPON_ORDER = ['broken', 'sword', 'katana', 'spear', 'varek', 'greatsword', 'hammer', 'scythe'];
const WEAPONS = {
  broken: {
    name: 'Kiếm Gãy', desc: 'Lưỡi kiếm mẻ, ngắn và yếu', look: { weapon: 'sword', wlen: 26, wcol: '#9a958a' }, cost: [11, 22],
    light: [
      { wind: 0.12, act: 0.1, rec: 0.26, mul: 0.75, range: 56, arc: 2.0, lunge: 160, poise: 10, swing: 1 },
      { wind: 0.1, act: 0.1, rec: 0.26, mul: 0.8, range: 56, arc: 2.0, lunge: 160, poise: 10, swing: -1 },
      { wind: 0.16, act: 0.12, rec: 0.36, mul: 1.0, range: 60, arc: 2.2, lunge: 220, poise: 16, swing: 1 },
    ],
    heavy: { wind: 0.46, act: 0.14, rec: 0.42, mul: 1.7, range: 68, arc: 2.3, lunge: 240, poise: 38, swing: 1 },
  },
  varek: {
    name: 'Kiếm Vàng Varek', desc: 'Hai tay. Đòn mạnh phóng ra sóng ánh vàng', twoHanded: true, look: { weapon: 'greatsword', wlen: 44, wcol: '#e0c068', glow: true }, cost: [14, 28],
    light: [
      { wind: 0.15, act: 0.11, rec: 0.3, mul: 1.25, range: 76, arc: 2.2, lunge: 190, poise: 20, swing: 1 },
      { wind: 0.13, act: 0.11, rec: 0.3, mul: 1.3, range: 76, arc: 2.2, lunge: 190, poise: 20, swing: -1 },
      { wind: 0.2, act: 0.13, rec: 0.4, mul: 1.6, range: 82, arc: 2.5, lunge: 260, poise: 30, swing: 1 },
    ],
    heavy: { wind: 0.55, act: 0.15, rec: 0.5, mul: 2.6, range: 88, arc: 2.5, lunge: 260, poise: 60, swing: 1, wave: true },
  },
  sword: {
    name: 'Kiếm Thẳng', desc: 'Cân bằng, đáng tin cậy', look: { weapon: 'sword', wlen: 38, wcol: '#dcdcd2' }, cost: [11, 22],
    light: [
      { wind: 0.12, act: 0.1, rec: 0.26, mul: 1, range: 66, arc: 2.0, lunge: 170, poise: 14, swing: 1 },
      { wind: 0.1, act: 0.1, rec: 0.26, mul: 1.05, range: 66, arc: 2.0, lunge: 170, poise: 14, swing: -1 },
      { wind: 0.16, act: 0.12, rec: 0.36, mul: 1.3, range: 72, arc: 2.3, lunge: 240, poise: 22, swing: 1 },
    ],
    heavy: { wind: 0.46, act: 0.14, rec: 0.42, mul: 2.2, range: 80, arc: 2.4, lunge: 250, poise: 48, swing: 1 },
  },
  katana: {
    name: 'Uchigatana Tro', desc: 'Nhanh, gây chảy máu', look: { weapon: 'katana', wlen: 42, wcol: '#e8ecf2' }, cost: [9, 20], bleed: [16, 30],
    light: [
      { wind: 0.09, act: 0.09, rec: 0.22, mul: 0.85, range: 70, arc: 2.1, lunge: 180, poise: 10, swing: 1 },
      { wind: 0.08, act: 0.09, rec: 0.22, mul: 0.9, range: 70, arc: 2.1, lunge: 180, poise: 10, swing: -1 },
      { wind: 0.12, act: 0.1, rec: 0.3, mul: 1.15, range: 74, arc: 2.3, lunge: 230, poise: 16, swing: 1 },
    ],
    heavy: { wind: 0.38, act: 0.12, rec: 0.36, mul: 1.9, range: 92, arc: 1.4, lunge: 340, poise: 34, swing: -1 },
  },
  spear: {
    name: 'Giáo Kỵ Sĩ', desc: 'Đâm xa, góc đánh hẹp', look: { weapon: 'spear', wlen: 58, wcol: '#d2ccba' }, cost: [10, 22],
    light: [
      { wind: 0.12, act: 0.1, rec: 0.28, mul: 0.95, range: 104, arc: 0.75, lunge: 120, poise: 12, thrust: true },
      { wind: 0.1, act: 0.1, rec: 0.28, mul: 0.95, range: 104, arc: 0.75, lunge: 120, poise: 12, thrust: true },
      { wind: 0.14, act: 0.12, rec: 0.34, mul: 1.2, range: 110, arc: 0.8, lunge: 200, poise: 18, thrust: true },
    ],
    heavy: { wind: 0.5, act: 0.16, rec: 0.45, mul: 2.1, range: 118, arc: 0.9, lunge: 320, poise: 42, thrust: true },
  },
  greatsword: {
    name: 'Đại Kiếm Nanh Rồng', desc: 'Hai tay. Chậm, cực mạnh, không bị ngắt đòn', twoHanded: true, look: { weapon: 'greatsword', wlen: 52, wcol: '#c9b48a' }, cost: [22, 36], hyper: true,
    light: [
      { wind: 0.3, act: 0.14, rec: 0.45, mul: 1.9, range: 94, arc: 2.6, lunge: 200, poise: 38, swing: 1 },
      { wind: 0.28, act: 0.14, rec: 0.5, mul: 2.0, range: 94, arc: 2.6, lunge: 200, poise: 38, swing: -1 },
    ],
    heavy: { wind: 0.8, act: 0.16, rec: 0.6, mul: 3.6, range: 104, arc: 2.8, lunge: 260, poise: 90, swing: 1 },
  },
};
WEAPONS.hammer = {
  name: 'Chùy Vệ Binh', desc: 'Hai tay. Phá thế cực mạnh, không bị ngắt đòn', twoHanded: true, hyper: true, look: { weapon: 'club', wlen: 44, wcol: '#8f8a80' }, cost: [20, 34],
  light: [
    { wind: 0.3, act: 0.14, rec: 0.48, mul: 1.8, range: 84, arc: 2.3, lunge: 180, poise: 50, swing: 1 },
    { wind: 0.3, act: 0.14, rec: 0.52, mul: 1.9, range: 84, arc: 2.3, lunge: 180, poise: 50, swing: -1 },
  ],
  heavy: { wind: 0.8, act: 0.16, rec: 0.62, mul: 3.3, range: 92, arc: 2.6, lunge: 220, poise: 120, swing: 1 },
};
WEAPONS.scythe = {
  name: 'Liềm Hồn Ma', desc: 'Hai tay. Quét rộng, gây chảy máu', twoHanded: true, look: { weapon: 'scythe', wlen: 50, wcol: '#cfefff' }, cost: [13, 26], bleed: [12, 22],
  light: [
    { wind: 0.16, act: 0.13, rec: 0.3, mul: 1.0, range: 92, arc: 3.0, lunge: 150, poise: 16, swing: 1 },
    { wind: 0.14, act: 0.13, rec: 0.3, mul: 1.05, range: 92, arc: 3.0, lunge: 150, poise: 16, swing: -1 },
    { wind: 0.2, act: 0.15, rec: 0.42, mul: 1.3, range: 96, arc: 3.2, lunge: 200, poise: 24, swing: 1 },
  ],
  heavy: { wind: 0.5, act: 0.2, rec: 0.5, mul: 2.0, range: 98, arc: TAU, lunge: 120, poise: 40, swing: 1 },
};
// Mỗi vũ khí một bộ chiêu. anim: slash (chém ngang), thrust (đâm), spin (xoay tròn),
// overhead (bổ từ trên xuống, gây sát thương theo vùng tại điểm chạm), dash (lướt tới chém/đâm)
const MOVESETS = {
  broken: {
    light: [
      { anim: 'slash', wind: 0.12, act: 0.1, rec: 0.26, mul: 0.75, range: 56, arc: 2.0, lunge: 160, poise: 10, swing: 1 },
      { anim: 'slash', wind: 0.1, act: 0.1, rec: 0.26, mul: 0.8, range: 56, arc: 2.0, lunge: 160, poise: 10, swing: -1 },
      { anim: 'thrust', wind: 0.14, act: 0.1, rec: 0.34, mul: 0.95, range: 66, arc: 0.8, lunge: 220, poise: 14, thrust: true },
    ],
    heavy: { anim: 'overhead', wind: 0.46, act: 0.12, rec: 0.44, mul: 1.7, range: 66, arc: 1.2, off: 50, r: 44, lunge: 200, poise: 38 },
  },
  sword: {
    light: [
      { anim: 'slash', wind: 0.12, act: 0.1, rec: 0.26, mul: 1, range: 66, arc: 2.0, lunge: 170, poise: 14, swing: 1 },
      { anim: 'slash', wind: 0.1, act: 0.1, rec: 0.26, mul: 1.05, range: 66, arc: 2.0, lunge: 170, poise: 14, swing: -1 },
      { anim: 'thrust', wind: 0.14, act: 0.1, rec: 0.34, mul: 1.3, range: 86, arc: 0.8, lunge: 260, poise: 22, thrust: true },
    ],
    heavy: { anim: 'overhead', wind: 0.46, act: 0.12, rec: 0.44, mul: 2.3, range: 80, arc: 1.2, off: 60, r: 56, lunge: 230, poise: 50, shake: 5 },
  },
  katana: {
    light: [
      { anim: 'slash', wind: 0.09, act: 0.09, rec: 0.22, mul: 0.85, range: 70, arc: 2.1, lunge: 180, poise: 10, swing: 1 },
      { anim: 'slash', wind: 0.08, act: 0.09, rec: 0.22, mul: 0.9, range: 70, arc: 2.1, lunge: 180, poise: 10, swing: -1 },
      { anim: 'spin', wind: 0.12, act: 0.22, rec: 0.3, mul: 1.15, range: 76, arc: TAU, lunge: 120, poise: 16, turns: 1 },
    ],
    heavy: { anim: 'dash', wind: 0.36, act: 0.16, rec: 0.38, mul: 1.95, range: 74, arc: 1.5, lunge: 0, dashSpeed: 950, poise: 34, swing: -1 },
  },
  spear: {
    light: [
      { anim: 'thrust', wind: 0.12, act: 0.1, rec: 0.28, mul: 0.95, range: 104, arc: 0.75, lunge: 120, poise: 12, thrust: true },
      { anim: 'thrust', wind: 0.1, act: 0.1, rec: 0.28, mul: 0.95, range: 104, arc: 0.75, lunge: 120, poise: 12, thrust: true },
      { anim: 'slash', wind: 0.16, act: 0.13, rec: 0.36, mul: 1.15, range: 100, arc: 2.4, lunge: 150, poise: 18, swing: 1 },
    ],
    heavy: { anim: 'dash', wind: 0.5, act: 0.2, rec: 0.45, mul: 2.1, range: 118, arc: 0.9, lunge: 0, dashSpeed: 700, poise: 42, thrust: true },
  },
  varek: {
    light: [
      { anim: 'slash', wind: 0.15, act: 0.11, rec: 0.3, mul: 1.25, range: 76, arc: 2.2, lunge: 190, poise: 20, swing: 1 },
      { anim: 'slash', wind: 0.13, act: 0.11, rec: 0.3, mul: 1.3, range: 76, arc: 2.2, lunge: 190, poise: 20, swing: -1 },
      { anim: 'overhead', wind: 0.2, act: 0.13, rec: 0.42, mul: 1.6, range: 82, arc: 1.2, off: 70, r: 66, lunge: 240, poise: 30, shake: 5 },
    ],
    heavy: { anim: 'overhead', wind: 0.55, act: 0.15, rec: 0.5, mul: 2.6, range: 88, arc: 1.2, off: 72, r: 78, lunge: 260, poise: 60, wave: true, shake: 8 },
  },
  greatsword: {
    light: [
      { anim: 'slash', wind: 0.3, act: 0.14, rec: 0.45, mul: 1.9, range: 94, arc: 2.6, lunge: 200, poise: 38, swing: 1 },
      { anim: 'slash', wind: 0.28, act: 0.14, rec: 0.5, mul: 2.0, range: 94, arc: 2.6, lunge: 200, poise: 38, swing: -1 },
      { anim: 'overhead', wind: 0.36, act: 0.15, rec: 0.55, mul: 2.3, range: 96, arc: 1.2, off: 78, r: 80, lunge: 220, poise: 55, shake: 8 },
    ],
    heavy: { anim: 'spin', wind: 0.6, act: 0.36, rec: 0.6, mul: 3.2, range: 104, arc: TAU, lunge: 100, poise: 90, turns: 1 },
  },
  hammer: {
    light: [
      { anim: 'overhead', wind: 0.3, act: 0.13, rec: 0.48, mul: 1.8, range: 84, arc: 1.2, off: 62, r: 62, lunge: 180, poise: 50, shake: 6 },
      { anim: 'slash', wind: 0.3, act: 0.14, rec: 0.52, mul: 1.9, range: 84, arc: 2.3, lunge: 180, poise: 50, swing: -1 },
    ],
    heavy: { anim: 'overhead', wind: 0.8, act: 0.16, rec: 0.62, mul: 3.3, range: 92, arc: 1.2, off: 55, r: 118, lunge: 220, poise: 120, shake: 14, quake: true },
  },
  scythe: {
    light: [
      { anim: 'slash', wind: 0.16, act: 0.13, rec: 0.3, mul: 1.0, range: 92, arc: 3.0, lunge: 150, poise: 16, swing: 1 },
      { anim: 'slash', wind: 0.14, act: 0.13, rec: 0.3, mul: 1.05, range: 92, arc: 3.0, lunge: 150, poise: 16, swing: -1 },
      { anim: 'spin', wind: 0.18, act: 0.24, rec: 0.36, mul: 1.3, range: 96, arc: TAU, lunge: 120, poise: 24, turns: 1 },
    ],
    heavy: { anim: 'spin', wind: 0.5, act: 0.42, rec: 0.5, mul: 2.2, range: 98, arc: TAU, lunge: 60, poise: 40, turns: 2 },
  },
};
for (const [k, v] of Object.entries(MOVESETS)) Object.assign(WEAPONS[k], v);
const twoHanded = () => !!WEAPONS[S.equipped].twoHanded;
const lookCache = {};
function playerLook() { const k = S.equipped; return lookCache[k] || (lookCache[k] = Object.assign({}, LOOK_BASE, WEAPONS[k].look)); }
const ETYPES = {
  soldier: {
    name: 'Lính Tàn Binh', hp: 70, r: 15, speed: 88, aggro: 290, runes: 28, poise: 28, atkRange: 50, cd: [0.8, 1.8], track: 3.4,
    look: { body: '#6b604b', trim: '#9a8759', head: '#857b68', cloak: '#4b3a28', weapon: 'sword', wlen: 32, wcol: '#b9b6aa', scale: 1 },
    attacks: [{ wind: 0.55, act: 0.14, rec: 0.6, range: 60, arc: 1.7, dmg: 24, lunge: 170, swing: 1 }],
  },
  wolf: {
    name: 'Sói Xám', hp: 42, r: 13, speed: 170, aggro: 340, runes: 18, poise: 14, atkRange: 58, cd: [0.9, 1.9], track: 4.5,
    attacks: [{ wind: 0.4, act: 0.2, rec: 0.55, range: 44, arc: 1.4, dmg: 15, lunge: 420, swing: 0 }],
  },
  mage: {
    name: 'Pháp Sư Lưu Đày', hp: 55, r: 14, speed: 72, aggro: 400, runes: 40, poise: 18, ranged: true, keep: 230, cd: [1.6, 2.6], track: 3,
    look: { body: '#2f3a5a', trim: '#6f86c9', head: '#252e4b', cloak: '#1c2340', weapon: 'staff', wlen: 34, wcol: '#6b5a3e', scale: 1, hood: true, orb: '#9fc0ff' },
    attacks: [{ kind: 'shot', wind: 0.8, rec: 0.9, n: 1, spread: 0, proj: { speed: 270, dmg: 24, r: 9, kind: 'orb' } }],
  },
  archer: {
    name: 'Cung Thủ Tàn Binh', hp: 50, r: 14, speed: 80, aggro: 440, runes: 34, poise: 16, ranged: true, keep: 280, cd: [1.3, 2.2], track: 3.5,
    look: { body: '#5f5a45', trim: '#8a7d58', head: '#7b7462', cloak: '#3f4a2e', weapon: 'bow', wlen: 26, wcol: '#7a6040', scale: 1 },
    attacks: [
      { kind: 'shot', wind: 0.7, rec: 0.6, n: 1, spread: 0, proj: { speed: 480, dmg: 20, r: 5, kind: 'arrow' } },
      { kind: 'shot', wind: 0.95, rec: 0.9, n: 3, spread: 0.2, proj: { speed: 460, dmg: 17, r: 5, kind: 'arrow' } },
    ],
    pick: () => (Math.random() < 0.3 ? 1 : 0),
  },
  bomber: {
    name: 'Kẻ Ném Lửa', hp: 60, r: 15, speed: 74, aggro: 380, runes: 40, poise: 20, ranged: true, keep: 220, cd: [1.8, 2.8], track: 3,
    look: { body: '#6a4a35', trim: '#b0703a', head: '#5a4a3a', cloak: '#3a2a1e', weapon: 'staff', wlen: 22, wcol: '#5a4a36', scale: 1.05, orb: '#ff8a3a', hood: true },
    attacks: [{ kind: 'lob', wind: 0.8, rec: 1.0, n: 1, dmg: 32, r: 62 }, { kind: 'lob', wind: 1.0, rec: 1.1, n: 3, dmg: 26, r: 55 }],
    pick: () => (Math.random() < 0.3 ? 1 : 0),
  },
  ghost: {
    name: 'Hồn Ma Lang Thang', hp: 48, r: 14, speed: 115, aggro: 320, runes: 42, poise: 12, atkRange: 52, cd: [1.0, 2.0], track: 4, ghost: true,
    look: { body: '#6f8fa8', trim: '#a9d4ee', head: '#8fb4cc', cloak: '#39566b', weapon: 'sword', wlen: 30, wcol: '#cfefff', scale: 1 },
    attacks: [{ kind: 'blink', wind: 0.35, next: 1 }, { wind: 0.4, act: 0.14, rec: 0.6, range: 58, arc: 1.8, dmg: 22, lunge: 200, swing: 1 }],
    pick: (e, d) => (d < 64 ? 1 : d < 340 ? 0 : -1),
  },
  shield: {
    name: 'Lính Khiên Sắt', hp: 95, r: 16, speed: 74, aggro: 280, runes: 48, poise: 40, atkRange: 60, cd: [1.0, 1.9], track: 3, shield: true,
    look: { body: '#5a5d63', trim: '#8b8f96', head: '#6c7077', cloak: '#2e3440', weapon: 'sword', wlen: 26, wcol: '#c8c8c0', scale: 1.1 },
    attacks: [{ wind: 0.5, act: 0.14, rec: 0.7, range: 56, arc: 1.4, dmg: 20, lunge: 230, swing: 1 }, { wind: 0.7, act: 0.14, rec: 0.8, range: 86, arc: 0.7, dmg: 28, lunge: 170, thrust: true }],
    pick: (e, d) => (d < 58 ? 0 : d < 92 ? 1 : -1),
  },
  troll: {
    name: 'Người Khổng Lồ Đá', hp: 520, r: 30, speed: 68, aggro: 360, runes: 420, poise: 200, elite: true, bar: true, atkRange: 110, cd: [1.0, 2.0], track: 1.8, leash: 700,
    look: { body: '#6b665b', trim: '#8a8374', head: '#7a7466', cloak: '#4a4034', weapon: 'club', wlen: 40, wcol: '#5a4632', scale: 2.3 },
    attacks: [
      { wind: 0.9, act: 0.2, rec: 0.9, range: 128, arc: 2.2, dmg: 58, lunge: 140, swing: 1 },
      { kind: 'slam', wind: 1.1, rec: 1.1, off: 70, r: 110, dmg: 64, ring: [110, 300, 0.6, 28] },
      { kind: 'slam', wind: 0.6, rec: 0.7, off: 0, r: 95, dmg: 40 },
    ],
    pick: (e, d) => (d > 150 ? -1 : d < 90 && Math.random() < 0.3 ? 2 : Math.random() < 0.35 ? 1 : 0),
  },
  bat: {
    name: 'Dơi Máu', hp: 22, r: 10, speed: 210, aggro: 380, runes: 12, poise: 5, atkRange: 40, cd: [1.2, 2.2], track: 6, flier: true,
    attacks: [{ wind: 0.3, act: 0.22, rec: 0.5, range: 40, arc: 1.8, dmg: 10, lunge: 700, swing: 0 }],
    pick: (e, d) => (d < 140 ? 0 : -1),
  },
  spider: {
    name: 'Nhện Độc', hp: 70, r: 16, speed: 125, aggro: 300, runes: 44, poise: 24, atkRange: 50, cd: [1.1, 2.0], track: 4,
    attacks: [
      { kind: 'shot', wind: 0.6, rec: 0.8, n: 1, spread: 0, proj: { speed: 320, dmg: 10, r: 8, kind: 'spit', puddle: true } },
      { wind: 0.4, act: 0.15, rec: 0.6, range: 50, arc: 1.2, dmg: 18, lunge: 320, swing: 0, poison: 30 },
    ],
    pick: (e, d) => (d < 60 ? 1 : d > 130 && d < 320 ? 0 : -1),
  },
  warden: {
    name: 'Dornach, Vệ Binh Pháo Đài', hp: 950, r: 26, speed: 100, aggro: 300, runes: 1800, poise: 230, elite: true, miniboss: true, bar: true, drop: 'hammer',
    atkRange: 90, cd: [0.6, 1.3], track: 2.6, leash: 420,
    look: { body: '#3c4250', trim: '#7d8fb0', head: '#4a5060', cloak: '#1d2438', weapon: 'club', wlen: 44, wcol: '#9aa3b5', scale: 1.8 },
    attacks: [
      { wind: 0.7, act: 0.16, rec: 0.15, range: 108, arc: 2.3, dmg: 46, lunge: 240, swing: 1, next: 1 },
      { wind: 1.0, act: 0.16, rec: 0.8, range: 108, arc: 2.3, dmg: 50, lunge: 260, swing: -1 },
      { kind: 'charge', wind: 0.6, dur: 0.75, speed: 540, rec: 0.9, dmg: 52 },
      { kind: 'slam', wind: 0.9, rec: 1.0, off: 60, r: 110, dmg: 58, ring: [110, 270, 0.5, 28] },
    ],
    pick: (e, d) => (d > 200 && d < 520 ? 2 : d < 125 ? (Math.random() < 0.3 ? 3 : 0) : -1),
  },
  wraith: {
    name: 'Seluna, Nữ Vương Hồn Ma', hp: 820, r: 20, speed: 95, aggro: 520, runes: 1800, poise: 180, elite: true, miniboss: true, bar: true, ghost: true, drop: 'scythe',
    atkRange: 90, cd: [0.6, 1.2], track: 3.5, leash: 420,
    look: { body: '#7a8fb8', trim: '#d6e6ff', head: '#a8bde0', cloak: '#34406a', weapon: 'scythe', wlen: 46, wcol: '#d6f0ff', scale: 1.6, hood: true },
    attacks: [
      { kind: 'blink', wind: 0.3, next: 1 },
      { wind: 0.55, act: 0.18, rec: 0.7, range: 104, arc: 3.0, dmg: 40, lunge: 200, swing: 1 },
      { kind: 'orbs', wind: 0.8, rec: 0.8, n: 12, dmg: 18 },
      { kind: 'summon', wind: 1.0, rec: 0.8 },
    ],
    pick: (e, d) => {
      const r = Math.random();
      if (d > 200) return r < 0.5 ? 0 : 2;
      if (r < 0.45) return 1;
      if (r < 0.65) return 2;
      if (r < 0.8 && enemies.filter(x => x.summoned && !x.dead).length < 3) return 3;
      return 0;
    },
  },
  ghoul: {
    name: 'Thây Ma Đầm Lầy', hp: 64, r: 15, speed: 64, aggro: 260, runes: 36, poise: 22, atkRange: 44, cd: [0.9, 1.8], track: 3,
    look: { body: '#4f5b41', trim: '#6f7d58', head: '#7d8a66', cloak: '#2f3a28', weapon: 'claw', wlen: 16, wcol: '#b9c48a', scale: 1.05 },
    attacks: [{ wind: 0.5, act: 0.16, rec: 0.7, range: 54, arc: 1.6, dmg: 16, lunge: 160, swing: 1, poison: 34 }],
  },
  knight: {
    name: 'Kỵ Sĩ Tro Tàn', hp: 320, r: 19, speed: 96, aggro: 320, runes: 260, poise: 95, elite: true, atkRange: 66, cd: [0.6, 1.4], track: 2.8,
    look: { body: '#3b3c43', trim: '#b08d4c', head: '#4c4d55', cloak: '#5c1f1d', weapon: 'greatsword', wlen: 38, wcol: '#c8c4b8', scale: 1.28 },
    attacks: [
      { wind: 0.7, act: 0.15, rec: 0.2, range: 84, arc: 2.0, dmg: 34, lunge: 200, swing: 1, next: 1 },
      { wind: 0.38, act: 0.15, rec: 0.75, range: 84, arc: 2.0, dmg: 30, lunge: 170, swing: -1 },
      { wind: 1.05, act: 0.18, rec: 0.9, range: 96, arc: 2.4, dmg: 52, lunge: 280, swing: 1 },
    ],
  },
};
function makeEnemy(type, x, y) {
  const T = ETYPES[type], rm = regionMul(x, y), hp = Math.round(T.hp * DIFF.hp * rm * lvHp());
  return { type, T, name: T.name, x, y, hx: x, hy: y, r: T.r, hp, maxHp: hp, fade: 0, runeMul: rm * (1 + 0.02 * (S.level - 1)), face: rand(0, TAU), state: 'idle', t: 0, cd: rand(0.5, 1.5), vx: 0, vy: 0,
    poise: T.poise, poiseAcc: 0, lastHit: 9, hurtFlash: 0, atk: null, atkHit: false, lunged: false, fired: false, glinted: false, wander: null,
    strafe: Math.random() < 0.5 ? 1 : -1, elite: !!T.elite, dead: false, anim: rand(0, 10), moving: false, stagDur: 0.5 };
}
function spawnEnemies() {
  enemies = SPAWNS.filter(([t]) => !(ETYPES[t].miniboss && S.mb[t])).map(([t, x, y]) => makeEnemy(t, x, y));
  if (S.glade && !S.mb.wraith) enemies.push(makeEnemy('wraith', BARRIER.x, BARRIER.y));
  projs.length = 0; aoes.length = 0; puddles.length = 0;
  G.colo.active = false; G.colo.wave = 0; G.braziers = [];
}
function makeBoss() {
  return { isBoss: true, name: 'Varek, Kẻ Canh Cổng Phản Trắc', x: 1400, y: 640, r: 28, hp: Math.round(1300 * lvHp()), maxHp: Math.round(1300 * lvHp()), ghost: Math.round(1300 * lvHp()), face: Math.PI / 2, state: 'dormant', t: 0, cd: 1,
    vx: 0, vy: 0, poise: 170, poiseAcc: 0, lastHit: 9, hurtFlash: 0, phase: 1, atk: null, dead: false, z: 0, elite: true, invuln: 0, anim: 0, stagDur: 0.8, lastMove: '', bleedMax: 180,
    look: { body: '#4d4234', trim: '#c9a34a', head: '#2c2721', cloak: '#2a241b', weapon: 'greatsword', wlen: 40, wcol: '#dcc06a', scale: 1.9, hood: true, glow: true } };
}
const targets = () => {
  const out = enemies.filter(e => !e.dead);
  if (boss && G.bossFight && !boss.dead && boss.state !== 'dormant') out.push(boss);
  if (dragon && !dragon.dead && dist(P.x, P.y, dragon.x, dragon.y) < 750) out.push(dragon);
  if (fb && G.finalFight && !fb.dead && fb.state !== 'transform' && fb.state !== 'intro') out.push(fb);
  return out;
};

// ───────────────────────── va chạm ─────────────────────────
function collide(e, enemy) {
  for (const w of WALLS) {
    if (!wallOn(w, enemy)) continue;
    const px = clamp(e.x, w.x, w.x + w.w), py = clamp(e.y, w.y, w.y + w.h);
    const dx = e.x - px, dy = e.y - py, d2 = dx * dx + dy * dy;
    if (d2 >= e.r * e.r) continue;
    if (d2 > 1e-6) { const d = Math.sqrt(d2); e.x += dx / d * (e.r - d); e.y += dy / d * (e.r - d); }
    else {
      const l = e.x - w.x, rr = w.x + w.w - e.x, t = e.y - w.y, b = w.y + w.h - e.y, m = Math.min(l, rr, t, b);
      if (m === l) e.x = w.x - e.r; else if (m === rr) e.x = w.x + w.w + e.r; else if (m === t) e.y = w.y - e.r; else e.y = w.y + w.h + e.r;
    }
  }
  if (e.x > MAPW + 60) {
    const dx = e.x - RC.x, dy = e.y - RC.y, d = Math.hypot(dx, dy), m = RC.r - e.r;
    if (d > m) { e.x = RC.x + dx / d * m; e.y = RC.y + dy / d * m; }
  }
  if (!S.glade) {
    const dx = e.x - BARRIER.x, dy = e.y - BARRIER.y, rr = BARRIER.r + e.r, d2 = dx * dx + dy * dy;
    if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2); e.x += dx / d * (rr - d); e.y += dy / d * (rr - d); }
  }
  const cx = Math.floor(e.x / CELL), cy = Math.floor(e.y / CELL);
  for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gy = cy - 1; gy <= cy + 1; gy++) {
    const cell = GRID.get(gx + ',' + gy);
    if (!cell) continue;
    for (const o of cell) {
      const dx = e.x - o.x, dy = e.y - o.y, rr = e.r + o.r, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2); e.x += dx / d * (rr - d); e.y += dy / d * (rr - d); }
    }
  }
  e.x = clamp(e.x, e.r + 12, W - e.r - 12); e.y = clamp(e.y, e.r + 12, H - e.r - 12);
}
function moveCircle(e, dx, dy, enemy) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (e.r * 0.7)));
  for (let i = 0; i < steps; i++) { e.x += dx / steps; e.y += dy / steps; collide(e, enemy); }
}
function pointBlocked(x, y) {
  for (const w of WALLS) if (wallOn(w, false) && x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h) return true;
  if (!S.glade && dist(x, y, BARRIER.x, BARRIER.y) < BARRIER.r) return true;
  const cell = GRID.get(Math.floor(x / CELL) + ',' + Math.floor(y / CELL));
  if (cell) for (const o of cell) if (dist(x, y, o.x, o.y) < o.r) return true;
  return false;
}
const inArena = (x, y) => x > ARENA.x && x < ARENA.x + ARENA.w && y > ARENA.y && y < ARENA.y + ARENA.h - 10;

// ───────────────────────── hiệu ứng ─────────────────────────
function addPart(x, y, vx, vy, life, size, color, kind = 'dot', extra) {
  if (parts.length > 1400) parts.shift();
  const p = { x, y, vx, vy, life, max: life, size, color, kind };
  if (extra) Object.assign(p, extra);
  parts.push(p);
}
function burst(x, y, n, color, spd, size, kind = 'dot', life = 0.5, dir) {
  for (let i = 0; i < n; i++) {
    const a = dir === undefined ? rand(0, TAU) : dir + rand(-0.7, 0.7), s = rand(spd * 0.3, spd);
    addPart(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(life * 0.5, life), rand(size * 0.5, size), color, kind);
  }
}
function floatText(x, y, text, color, big) { addPart(x + rand(-6, 6), y, rand(-10, 10), -38, big ? 1.3 : 0.9, big ? 20 : 14, color, 'text', { text }); }
function shake(n) { G.shake = Math.max(G.shake, n); }
function banner(kind, title, sub, dur = 3.4) { G.banner = { kind, title, sub, t: 0, dur }; }
function subtitle(text, dur = 4.2) { G.sub = { text, t: 0, dur }; }
function later(t, fn) { G.timers.push({ t, fn }); }
function toast(text) { G.toast = { text, t: 0 }; }

// ───────────────────────── nhập liệu ─────────────────────────
const keys = new Set();
let buf = null, aimMode = 'keys';
const mouse = { x: 0, y: 0, wx: 0, wy: 0, inside: false };
const stick = { x: 0, y: 0 };
const KEYMAP = { KeyJ: 'light', KeyK: 'heavy', KeyL: 'spell', KeyC: 'spell', KeyR: 'flask', KeyE: 'interact', KeyF: 'mount', KeyQ: 'lock', KeyG: 'map', Digit7: 'eq7', Digit8: 'eq8', ArrowRight: 'eqnext', ArrowLeft: 'eqprev', KeyT: 'eqnext', Digit1: 'eq1', Digit2: 'eq2', Digit3: 'eq3', Digit4: 'eq4', Digit5: 'eq5', Digit6: 'eq6' };
let touchGuard = false;
let mouseGuard = false;
const DASH_HOLD = 280; // giữ nút lăn lâu hơn mức này thì chạy nhanh, nhả sớm thì lăn (giống Elden Ring)
const dodgeKey = { down: false, at: 0 };
const pad = { prev: [], stick: { x: 0, y: 0 }, guard: false, dodgeDown: false, dodgeAt: 0 };
const guardHeld = () => keys.has('KeyX') || touchGuard || mouseGuard || pad.guard;
const sprintHeld = () => (dodgeKey.down && performance.now() - dodgeKey.at >= DASH_HOLD) || (pad.dodgeDown && performance.now() - pad.dodgeAt >= DASH_HOLD);
function act(a) {
  audioInit();
  if (a === 'pause') { togglePause(); return; }
  if (a === 'map') { toggleMap(); return; }
  if (G.mode !== 'play') return;
  if (a === 'lock') { toggleLock(); return; }
  if (a.startsWith('eq')) { equipKey(a); return; }
  buf = { a, t: G.clock };
}
const peekBuf = () => (buf && G.clock - buf.t < 0.32 ? buf.a : null);
function takeBuf() { const a = peekBuf(); buf = null; return a; }
window.addEventListener('keydown', e => {
  if (e.code === 'Escape') { e.preventDefault(); togglePause(); return; }
  if (e.code === 'KeyM' && !e.repeat) { toggleMute(); return; }
  if (e.code === 'KeyG' && !e.repeat && G.mode === 'map') { toggleMap(); return; }
  if (G.mode !== 'play') return;
  keys.add(e.code);
  if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) { dodgeKey.down = true; dodgeKey.at = performance.now(); } return; }
  const a = KEYMAP[e.code];
  if (a && !e.repeat) { if (e.code === 'KeyJ' || e.code === 'KeyK' || e.code === 'KeyL') aimMode = 'keys'; act(a); }
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => {
  keys.delete(e.code);
  if (e.code === 'Space' && dodgeKey.down) { dodgeKey.down = false; if (performance.now() - dodgeKey.at < DASH_HOLD) act('roll'); }
});
window.addEventListener('blur', () => { keys.clear(); dodgeKey.down = false; mouseGuard = false; });
window.addEventListener('mouseup', e => { if (e.button === 2) mouseGuard = false; });
canvas.addEventListener('pointerdown', () => { if (G.mode === 'map') { toggleMap(); G.ignoreClick = true; } });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.inside = true; if (!G.touch) aimMode = 'mouse'; });
canvas.addEventListener('mouseleave', () => { mouse.inside = false; });
canvas.addEventListener('mousedown', e => {
  if (G.touch) return;
  audioInit();
  const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; aimMode = 'mouse';
  if (G.ignoreClick) { G.ignoreClick = false; return; }
  if (G.mode !== 'play') return;
  // Elden Ring: chuột trái đánh, Shift + trái đánh mạnh, chuột phải đỡ, Shift + phải dùng kỹ năng (phép), chuột giữa khóa mục tiêu
  if (e.button === 0) act(e.shiftKey ? 'heavy' : 'light');
  else if (e.button === 1) { e.preventDefault(); act('lock'); }
  else if (e.button === 2) { if (e.shiftKey) act('spell'); else mouseGuard = true; }
});
canvas.addEventListener('auxclick', e => e.preventDefault());
function moveInput() {
  let x = 0, y = 0;
  if (keys.has('KeyW')) y -= 1;
  if (keys.has('KeyS')) y += 1;
  if (keys.has('KeyA')) x -= 1;
  if (keys.has('KeyD')) x += 1;
  const l = Math.hypot(x, y); if (l > 0) { x /= l; y /= l; }
  return [x + stick.x + pad.stick.x, y + stick.y + pad.stick.y];
}
// tay cầm: sơ đồ nút giống Elden Ring trên console (chuẩn Xbox / PlayStation)
const PB = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, BACK: 8, START: 9, R3: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
window.addEventListener('gamepadconnected', () => { audioInit(); toast('Đã kết nối tay cầm'); });
function padMenuNav(dir) {
  const ov = [UI.grace, UI.pause, UI.ending, UI.title].find(o => !o.hidden);
  if (!ov) return;
  const els = [...ov.querySelectorAll('button:not([disabled])')].filter(el => el.offsetParent !== null);
  if (!els.length) return;
  let i = els.indexOf(document.activeElement);
  i = i < 0 ? 0 : (i + dir + els.length) % els.length;
  els[i].focus();
}
function pollPad() {
  let gp = null;
  try { gp = navigator.getGamepads ? [...navigator.getGamepads()].find(g => g && g.connected) : null; } catch (e) { gp = null; }
  if (!gp) { pad.stick.x = 0; pad.stick.y = 0; pad.guard = false; pad.dodgeDown = false; return; }
  const btn = i => { const b = gp.buttons[i]; return !!(b && (b.pressed || b.value > 0.5)); };
  const down = i => btn(i) && !pad.prev[i], up = i => !btn(i) && pad.prev[i];
  let x = gp.axes[0] || 0, y = gp.axes[1] || 0;
  if (Math.hypot(x, y) < 0.2) { x = 0; y = 0; }
  pad.stick.x = x; pad.stick.y = y;
  if (G.mode === 'play' || G.mode === 'dead') {
    if (down(PB.B)) { pad.dodgeDown = true; pad.dodgeAt = performance.now(); }
    if (up(PB.B) && pad.dodgeDown) { pad.dodgeDown = false; if (performance.now() - pad.dodgeAt < DASH_HOLD) act('roll'); }
    const map = [[PB.RB, 'light'], [PB.RT, 'heavy'], [PB.LT, 'spell'], [PB.X, 'flask'], [PB.Y, 'interact'], [PB.A, 'mount'], [PB.R3, 'lock'], [PB.RIGHT, 'eqnext'], [PB.LEFT, 'eqprev'], [PB.BACK, 'map'], [PB.START, 'pause']];
    for (const [i, a] of map) if (down(i)) { aimMode = 'keys'; act(a); }
    pad.guard = btn(PB.LB);
  } else {
    pad.guard = false; pad.dodgeDown = false;
    if (G.mode === 'map') { if (down(PB.BACK) || down(PB.B) || down(PB.START)) toggleMap(); }
    else {
      if (down(PB.UP) || down(PB.LEFT)) padMenuNav(-1);
      if (down(PB.DOWN) || down(PB.RIGHT)) padMenuNav(1);
      if (down(PB.A) && document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.click();
      if (down(PB.START) || down(PB.B)) { if (G.mode === 'title') { if (!document.activeElement || document.activeElement.tagName !== 'BUTTON') padMenuNav(1); } else togglePause(); }
    }
  }
  pad.prev = gp.buttons.map((_, i) => btn(i));
}

// điều khiển cảm ứng
const touchUI = $('touch'), stickZone = $('stickZone'), stickBase = $('stickBase'), knob = $('knob');
function enableTouch() { if (G.touch) return; G.touch = true; touchUI.hidden = G.mode !== 'play'; aimMode = 'keys'; }
try { if (window.matchMedia('(pointer: coarse)').matches) enableTouch(); } catch (e) { /* bỏ qua */ }
window.addEventListener('touchstart', enableTouch, { passive: true });
let stickId = null, stickOx = 0, stickOy = 0;
stickZone.addEventListener('pointerdown', e => {
  e.preventDefault(); audioInit();
  stickId = e.pointerId; stickZone.setPointerCapture(e.pointerId);
  const r = stickZone.getBoundingClientRect(); stickOx = e.clientX; stickOy = e.clientY;
  stickBase.style.left = (e.clientX - r.left) + 'px'; stickBase.style.top = (e.clientY - r.top) + 'px'; stickBase.hidden = false;
  knob.style.transform = 'translate(0,0)';
});
stickZone.addEventListener('pointermove', e => {
  if (e.pointerId !== stickId) return;
  let dx = e.clientX - stickOx, dy = e.clientY - stickOy; const l = Math.hypot(dx, dy), m = 50;
  if (l > m) { dx = dx / l * m; dy = dy / l * m; }
  stick.x = dx / m; stick.y = dy / m;
  if (Math.hypot(stick.x, stick.y) < 0.18) { stick.x = 0; stick.y = 0; }
  knob.style.transform = `translate(${dx}px,${dy}px)`;
});
const endStick = e => { if (e.pointerId !== stickId) return; stickId = null; stick.x = 0; stick.y = 0; stickBase.hidden = true; };
stickZone.addEventListener('pointerup', endStick); stickZone.addEventListener('pointercancel', endStick);
touchUI.querySelectorAll('[data-hold]').forEach(b => {
  b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audioInit(); touchGuard = true; b.classList.add('on'); });
  const off = () => { touchGuard = false; b.classList.remove('on'); };
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => b.addEventListener(ev, off));
  b.addEventListener('contextmenu', e => e.preventDefault());
});
touchUI.querySelectorAll('[data-act]').forEach(b => {
  b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); aimMode = 'keys'; b.classList.add('on'); act(b.dataset.act); });
  const off = () => b.classList.remove('on');
  b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
  b.addEventListener('contextmenu', e => e.preventDefault());
});

// ───────────────────────── người chơi ─────────────────────────
const ROLL_DUR = 0.5;
function toggleLock() {
  if (P.lock) { P.lock = null; return; }
  let best = null, bd = 1e9;
  for (const e of targets()) {
    const d = dist(P.x, P.y, e.x, e.y);
    if (d > 470) continue;
    const score = d + Math.abs(angDiff(P.face, Math.atan2(e.y - P.y, e.x - P.x))) * 90;
    if (score < bd) { bd = score; best = e; }
  }
  P.lock = best;
}
function aimFace(moving, mx, my) {
  if (P.lock) return Math.atan2(P.lock.y - P.y, P.lock.x - P.x);
  if (aimMode === 'mouse' && mouse.inside) return Math.atan2(mouse.wy - P.y, mouse.wx - P.x);
  let best = null, bd = 150;
  for (const e of targets()) { const d = dist(P.x, P.y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
  if (best) {
    const a = Math.atan2(best.y - P.y, best.x - P.x);
    if (!moving || Math.abs(angDiff(Math.atan2(my, mx), a)) < 1.2) return a;
  }
  return moving ? Math.atan2(my, mx) : P.face;
}
function makeAtk(kind, combo) {
  const Wp = WEAPONS[S.equipped], base = weaponDmg(), bl = Wp.bleed || [0, 0];
  let a;
  if (kind === 'light') a = Object.assign({ cost: Wp.cost[0], bleed: bl[0], hyper: !!Wp.hyper }, Wp.light[combo]);
  else if (kind === 'heavy') a = Object.assign({ cost: Wp.cost[1], bleed: bl[1], hyper: !!Wp.hyper }, Wp.heavy);
  else a = { wind: 0.08, act: 0.14, rec: 0.3, mul: 1.15, range: 80, arc: 2.8, lunge: 0, poise: 16, swing: 1, cost: 9, bleed: bl[0] };
  return Object.assign(a, { kind, combo, maxCombo: Wp.light.length - 1, dmg: base * a.mul, hits: new Set(), lunged: false });
}
function equip(id) {
  if (!S.weapons.includes(id)) { toast('Chưa có vũ khí này'); return false; }
  if (S.equipped !== id) { S.equipped = id; toast('Đã trang bị: ' + WEAPONS[id].name); SFX.glint(); save(); }
  return true;
}
function equipKey(a) {
  if (a === 'eqnext') { const own = WEAPON_ORDER.filter(w => S.weapons.includes(w)); equip(own[(own.indexOf(S.equipped) + 1) % own.length]); }
  else if (a === 'eqprev') { const own = WEAPON_ORDER.filter(w => S.weapons.includes(w)); equip(own[(own.indexOf(S.equipped) - 1 + own.length) % own.length]); }
  else equip(WEAPON_ORDER[+a.slice(2) - 1]);
}
function startAttack(kind, combo, moving, mx, my) {
  P.face = aimFace(moving, mx, my);
  P.atk = makeAtk(kind, combo);
  P.st = Math.max(0, P.st - P.atk.cost); P.stDelay = 0.55;
  P.state = 'attack'; P.t = 0;
}
function doAction(a, moving, mx, my) {
  switch (a) {
    case 'roll':
      if (P.mounted || P.st <= 0) return;
      P.st = Math.max(0, P.st - 18); P.stDelay = 0.5; P.state = 'roll'; P.t = 0;
      P.rollDir = moving ? Math.atan2(my, mx) : P.face + Math.PI; SFX.roll();
      break;
    case 'light': case 'heavy':
      if (P.st <= 0) return;
      startAttack(P.mounted ? 'mounted' : a, 0, moving, mx, my);
      break;
    case 'spell':
      if (P.mounted) return;
      if (P.fp < 10) { toast('Không đủ FP'); G.fpWarn = 1; return; }
      P.fp -= 10; P.state = 'cast'; P.t = 0; P.cast = false; P.face = aimFace(moving, mx, my);
      break;
    case 'flask':
      if (P.mounted) { toast('Xuống ngựa để uống Bình Máu'); return; }
      if (P.flasks <= 0) { toast('Bình Máu đã cạn'); return; }
      P.flasks--; P.state = 'drink'; P.t = 0; P.drank = false; SFX.drink();
      break;
    case 'interact': interact(); break;
    case 'mount': toggleMount(); break;
  }
}
function toggleMount() {
  if (P.mounted) { P.mounted = false; P.state = 'mount'; P.t = 0; burst(P.x, P.y, 16, '#9fd0ff', 60, 3, 'dot', 0.6); return; }
  if (inArena(P.x, P.y) || G.bossFight || G.colo.active || G.finalFight || P.x > MAPW || inRect(P.x, P.y, FORT)) { toast('Không thể gọi ngựa ở đây'); return; }
  P.mounted = true; P.state = 'mount'; P.t = 0; P.lock = null; SFX.whistle();
  burst(P.x, P.y, 26, '#9fd0ff', 90, 3.5, 'dot', 0.8);
}
function fireSpell() {
  const a = P.face;
  projs.push({ x: P.x + Math.cos(a) * 20, y: P.y + Math.sin(a) * 20, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, r: 7, dmg: spellDmg(), kind: 'glint', friendly: true, life: 1.6 });
  SFX.spell(); burst(P.x + Math.cos(a) * 22, P.y + Math.sin(a) * 22, 10, '#bcd6ff', 80, 2.5, 'dot', 0.4);
}
function desiredFace(moving, mx, my, dt) {
  let target = P.face;
  if (P.lock) target = Math.atan2(P.lock.y - P.y, P.lock.x - P.x);
  else if (aimMode === 'mouse' && mouse.inside && !P.mounted) target = Math.atan2(mouse.wy - P.y, mouse.wx - P.x);
  else if (moving) target = Math.atan2(my, mx);
  return turn(P.face, target, 16 * dt);
}
function updatePlayer(dt) {
  const p = P;
  if (p.state === 'dead') return;
  p.t += dt;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.ghostDelay > 0) p.ghostDelay -= dt; else p.ghost = Math.max(p.hp, p.ghost - p.maxHp * 0.5 * dt);
  if (p.ghost < p.hp) p.ghost = p.hp;
  p.fp = Math.min(p.maxFp, p.fp + 4 * dt);
  const pooled = !p.mounted && (inPool(p.x, p.y) || puddles.some(q => dist(q.x, q.y, p.x, p.y) < q.r));
  if (pooled) {
    p.poisonB += 42 * dt;
    if (Math.random() < dt * 12) addPart(p.x + rand(-10, 10), p.y + rand(-6, 6), 0, rand(-30, -10), 0.5, rand(2, 3.5), '#b58ac4');
  } else p.poisonB = Math.max(0, p.poisonB - 12 * dt);
  if (p.poisonB >= 100) { p.poisonB = 0; p.poisonT = 14; toast('Trúng độc!'); SFX.poison(); }
  if (p.poisonT > 0) {
    p.poisonT -= dt; p.hp -= 4.5 * dt; p.ghostDelay = 0.3;
    if (Math.random() < dt * 6) addPart(p.x + rand(-8, 8), p.y + rand(-8, 8), 0, -25, 0.8, 2.5, '#a86fc0');
    if (p.hp <= 0) { p.hp = 0; die(); return; }
  }
  const slow = pooled ? 0.7 : 1;
  if (p.stDelay > 0) p.stDelay -= dt;
  else if (p.state !== 'roll' && p.state !== 'attack') p.st = Math.min(p.maxSt, p.st + (p.state === 'drink' || p.state === 'guard' ? 16 : p.mounted ? 55 : 42) * dt);
  const ox = p.x, oy = p.y;
  if (p.vx || p.vy) {
    moveCircle(p, p.vx * dt, p.vy * dt, false);
    const f = Math.exp(-10 * dt); p.vx *= f; p.vy *= f;
    if (Math.abs(p.vx) < 2) p.vx = 0; if (Math.abs(p.vy) < 2) p.vy = 0;
  }
  let [mx, my] = moveInput();
  const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
  const moving = ml > 0.15;
  if (p.lock && (p.lock.dead || dist(p.x, p.y, p.lock.x, p.lock.y) > 620 || (p.lock.isBoss && !G.bossFight))) p.lock = null;

  if (p.state === 'idle') {
    const sprint = !p.mounted && sprintHeld() && moving && p.st > 1;
    const spd = (p.mounted ? 320 : sprint ? 215 : 145) * slow;
    if (moving) {
      moveCircle(p, mx * spd * dt, my * spd * dt, false);
      p.walk += dt * spd / 55;
      if (sprint) { p.st -= 18 * dt; p.stDelay = 0.35; }
      if (p.mounted && Math.random() < dt * 22) addPart(p.x - mx * 20 + rand(-6, 6), p.y - my * 20 + rand(-6, 6), rand(-10, 10), rand(-10, 10), 0.6, rand(3, 6), 'rgba(120,105,80,.5)', 'dot');
    }
    p.face = desiredFace(moving, mx, my, dt);
    const a = takeBuf();
    if (a) doAction(a, moving, mx, my);
    if (p.state === 'idle' && !p.mounted && guardHeld()) { p.state = 'guard'; p.t = 0; p.parryOk = !twoHanded() && G.clock - p.lastGuardAt > 0.45; p.lastGuardAt = G.clock; }
  } else if (p.state === 'guard') {
    if (moving) moveCircle(p, mx * 75 * slow * dt, my * 75 * slow * dt, false);
    p.face = desiredFace(moving, mx, my, dt);
    const a = peekBuf();
    if (a === 'roll' || a === 'light' || a === 'heavy' || a === 'spell' || a === 'flask') { takeBuf(); p.state = 'idle'; doAction(a, moving, mx, my); }
    else if (!guardHeld()) { p.state = 'idle'; p.t = 0; }
  } else if (p.state === 'roll') {
    const k = p.t / ROLL_DUR, spd = k < 0.7 ? 360 * (1 - k * 0.6) : 90;
    moveCircle(p, Math.cos(p.rollDir) * spd * dt, Math.sin(p.rollDir) * spd * dt, false);
    if (Math.random() < dt * 30) addPart(p.x + rand(-5, 5), p.y + rand(-5, 5), 0, 0, 0.4, rand(3, 5), 'rgba(110,98,74,.45)');
    if (p.t >= ROLL_DUR) { p.state = 'idle'; p.t = 0; }
    else if (p.t > ROLL_DUR * 0.72) {
      const a = peekBuf();
      if (a === 'light' || a === 'heavy' || a === 'roll') { takeBuf(); p.state = 'idle'; doAction(a, moving, mx, my); }
    }
  } else if (p.state === 'attack') {
    const A = p.atk, t = p.t;
    if (t < A.wind) {
      if (p.lock) p.face = turn(p.face, Math.atan2(p.lock.y - p.y, p.lock.x - p.x), 10 * dt);
    } else if (t < A.wind + A.act) {
      if (!A.lunged) {
        A.lunged = true; p.vx += Math.cos(p.face) * A.lunge; p.vy += Math.sin(p.face) * A.lunge;
        if (A.kind === 'heavy') SFX.heavy(); else SFX.swing();
        revealIllusory(p, A);
        if (A.anim === 'dash') { A.sx = p.x; A.sy = p.y; noise(0.2, 0.15, 3000, 1); }
        if (A.anim === 'overhead') {
          A.ix = p.x + Math.cos(p.face) * A.off; A.iy = p.y + Math.sin(p.face) * A.off;
          aoes.push({ kind: 'flash', x: A.ix, y: A.iy, r: A.r, t: 0, dur: 0.3, col: 'dust' });
          burst(A.ix, A.iy, A.quake ? 36 : 14, 'rgba(150,130,100,.7)', A.quake ? 240 : 140, 4, 'dot', 0.6);
          shake(A.shake || 4); if (A.quake || A.r > 70) SFX.boom();
        }
        if (A.wave) {
          projs.push({ x: p.x + Math.cos(p.face) * 30, y: p.y + Math.sin(p.face) * 30, vx: Math.cos(p.face) * 460, vy: Math.sin(p.face) * 460, r: 12, dmg: A.dmg * 0.6, kind: 'gwave', friendly: true, life: 0.55 });
          SFX.spell();
        }
      }
      if (A.anim === 'dash') {
        moveCircle(p, Math.cos(p.face) * A.dashSpeed * dt, Math.sin(p.face) * A.dashSpeed * dt, false);
        addPart(p.x, p.y, 0, 0, 0.3, 7, 'rgba(255,240,200,.3)');
      }
      for (const e of targets()) {
        if (A.hits.has(e) || (e.z || 0) > 30) continue;
        const hit = A.anim === 'overhead' ? dist(A.ix, A.iy, e.x, e.y) < A.r + e.r || inArc(p.x, p.y, p.face, A.range * 0.7, A.arc, e.x, e.y, e.r)
          : A.anim === 'spin' ? dist(p.x, p.y, e.x, e.y) < A.range + e.r
          : inArc(p.x, p.y, p.face, A.range, A.arc, e.x, e.y, e.r);
        if (hit) {
          A.hits.add(e);
          const back = !e.isBoss && !e.isDragon && !e.isFinal && A.kind !== 'mounted' && e.state !== 'atk' && e.state !== 'broken' && dist(p.x, p.y, e.x, e.y) < e.r + p.r + 34 &&
            Math.abs(angDiff(e.face, Math.atan2(p.y - e.y, p.x - e.x))) > 2.2;
          hitEnemy(e, A.dmg, A.poise, p.x, p.y, A.kind, { backstab: back, bleed: A.bleed });
        }
      }
    } else {
      if (t > A.wind + A.act + A.rec * 0.35) {
        const a = peekBuf();
        if (a === 'light' && A.kind === 'light' && A.combo < A.maxCombo && !p.mounted) { takeBuf(); startAttack('light', A.combo + 1, moving, mx, my); return; }
        if (a === 'roll' || a === 'heavy' || a === 'light' || a === 'flask' || a === 'spell') { takeBuf(); p.state = 'idle'; p.atk = null; doAction(a, moving, mx, my); return; }
      }
      if (t >= A.wind + A.act + A.rec) { p.state = 'idle'; p.t = 0; p.atk = null; }
    }
    if (p.mounted && moving) moveCircle(p, mx * 220 * dt, my * 220 * dt, false);
  } else if (p.state === 'cast') {
    if (!p.cast && p.t >= 0.18) { p.cast = true; fireSpell(); }
    if (p.t >= 0.48) { p.state = 'idle'; p.t = 0; }
  } else if (p.state === 'drink') {
    if (moving) moveCircle(p, mx * 55 * dt, my * 55 * dt, false);
    if (!p.drank && p.t >= 0.6) {
      p.drank = true; const heal = Math.round(p.maxHp * 0.4 + 15);
      p.hp = Math.min(p.maxHp, p.hp + heal); p.ghost = Math.max(p.ghost, p.hp);
      burst(p.x, p.y, 22, '#ff6a5a', 70, 3, 'dot', 0.8); floatText(p.x, p.y - 26, '+' + heal, '#ff8f80');
    }
    if (p.t >= 1.0) { p.state = 'idle'; p.t = 0; }
  } else if (p.state === 'hurt') {
    if (p.t >= p.hurtDur) { p.state = 'idle'; p.t = 0; }
  } else if (p.state === 'mount') {
    if (p.t >= 0.3) { p.state = 'idle'; p.t = 0; }
  }
  p.mvx = (p.x - ox) / dt; p.mvy = (p.y - oy) / dt;
}
function hurtPlayer(dmg, fx, fy, heavy, src = null, kind = 'melee') {
  const p = P;
  if (p.state === 'dead' || p.invuln > 0 || G.mode !== 'play') return false;
  dmg *= DIFF.dmg * lvDmg() * regionMul(P.x, P.y);
  if (p.state === 'roll' && p.t > 0.03 && p.t < 0.36) return false; // khung bất tử khi lăn
  const from = Math.atan2(fy - p.y, fx - p.x);
  if (p.state === 'guard' && (dist(fx, fy, p.x, p.y) < 4 || Math.abs(angDiff(p.face, from)) < 1.5)) {
    // cầm khiên: chặn tốt và phản đòn được; cầm vũ khí hai tay: đỡ bằng thân vũ khí, chặn kém và không phản đòn được
    const th = twoHanded();
    if (!th && kind === 'melee' && src && !src.noParry && p.parryOk && p.t < 0.22) { parry(src); return false; }
    const chip = Math.round(dmg * (kind === 'melee' ? (heavy ? 0.3 : 0.15) : kind === 'proj' ? 0.2 : 0.5) * (th ? 2.2 : 1));
    p.hp -= chip; p.ghostDelay = 0.6; p.st -= dmg * (th ? 1.3 : 0.9); p.stDelay = 0.7;
    SFX.block(); shake(3); if (kind !== 'fire') G.hitStop = 0.04;
    burst(p.x + Math.cos(p.face) * 14, p.y + Math.sin(p.face) * 14, 8, '#fff1c4', 200, 2, 'spark', 0.25, p.face);
    p.vx -= Math.cos(from) * 120; p.vy -= Math.sin(from) * 120;
    p.invuln = kind === 'fire' ? 0.15 : 0.25;
    if (p.st <= 0) { p.st = 0; p.state = 'hurt'; p.t = 0; p.hurtDur = 0.9; floatText(p.x, p.y - 30, 'VỠ THẾ ĐỠ', '#f0a58f', true); }
    if (p.hp <= 0) { p.hp = 0; die(); }
    return true;
  }
  dmg = Math.round(dmg * rand(0.95, 1.05));
  p.hp -= dmg; p.ghostDelay = 0.6;
  const a = Math.atan2(p.y - fy, p.x - fx);
  if (kind === 'fire') {
    p.invuln = 0.15; G.flash = Math.max(G.flash, 0.2);
    burst(p.x, p.y, 6, '#ff9a4a', 90, 3, 'dot', 0.4);
    if (p.hp <= 0) { p.hp = 0; die(); }
    return true;
  }
  const hyper = p.state === 'attack' && p.atk && p.atk.hyper && p.t < p.atk.wind + p.atk.act;
  SFX.hurt(); shake(heavy ? 9 : 5); G.hitStop = 0.06; G.flash = 0.35;
  burst(p.x, p.y, 12, '#8e1512', 150, 3, 'dot', 0.5, a);
  if (!hyper) {
    p.vx += Math.cos(a) * (heavy ? 360 : 220); p.vy += Math.sin(a) * (heavy ? 360 : 220);
    if (p.mounted && (heavy || dmg >= 40)) { p.mounted = false; toast('Bị hất khỏi ngựa!'); }
    p.state = 'hurt'; p.t = 0; p.hurtDur = heavy ? 0.55 : 0.3; p.atk = null;
  }
  p.invuln = 0.4;
  if (p.hp <= 0) { p.hp = 0; die(); }
  return true;
}
function revealIllusory(p, A) {
  for (const w of WALLS) {
    if (!w.illusory || S.illusory.includes(w.illusory)) continue;
    const nx = clamp(p.x, w.x, w.x + w.w), ny = clamp(p.y, w.y, w.y + w.h);
    if (dist(p.x, p.y, nx, ny) < A.range && Math.abs(angDiff(p.face, Math.atan2(ny - p.y, nx - p.x))) < A.arc / 2 + 0.3) {
      S.illusory.push(w.illusory);
      for (let k = 0; k < 30; k++) addPart(w.x + Math.random() * w.w, w.y + Math.random() * w.h, rand(-20, 20), rand(-40, -10), rand(0.6, 1.2), rand(2, 4), '#d8d0bc', 'mote');
      tone(700, 0.6, 'sine', 0.06, -400); toast('Bức tường ảo đã biến mất!'); save();
    }
  }
}
function parry(src) {
  const p = P;
  src.state = 'broken'; src.t = 0; src.atk = null; src.poiseAcc = 0; if (src.z) src.z = 0;
  SFX.parry(); G.hitStop = 0.14; shake(6);
  const mx = (p.x + src.x) / 2, my = (p.y + src.y) / 2;
  burst(mx, my, 18, '#fff1c4', 280, 2.5, 'spark', 0.3);
  addPart(mx, my - 6, 0, 0, 0.4, 18, '#fff6d8', 'glint');
  floatText(p.x, p.y - 34, 'PHẢN ĐÒN', '#f2dc97', true);
  p.st = Math.min(p.maxSt, p.st + 10);
}
function die() {
  P.state = 'dead'; P.lock = null; P.mounted = false; G.mode = 'dead'; G.deathT = 0; S.deaths++;
  SFX.death();
  S.lost = S.runes > 0 ? { x: P.x, y: P.y, amount: S.runes } : null;
  S.runes = 0; G.bossFight = false; G.dragonFight = false; G.colo.active = false; G.finalFight = false;
  save();
}
function respawnAt(id) {
  const g = GRACES.find(q => q.id === id) || GRACES[0];
  P.x = g.x; P.y = g.y + 46; P.vx = P.vy = 0; P.state = 'idle'; P.t = 0; P.mounted = false; P.lock = null; P.atk = null; P.face = -Math.PI / 2; P.invuln = 0;
  applyStats(true); spawnEnemies();
  boss = S.bossDead ? null : makeBoss();
  dragon = S.dragonDead ? null : makeDragon(); G.dragonFight = false;
  fb = null; G.finalFight = false;
  G.bossFight = false; cam.x = P.x; cam.y = P.y; clampCam(); G.fade = 1; buf = null;
}

// ───────────────────────── gây sát thương cho kẻ địch ─────────────────────────
function hitEnemy(e, dmg, poise, fx, fy, kind, opt = {}) {
  if (e.dead || (e.invuln || 0) > 0) return;
  let crit = false;
  const label = e.state === 'broken' ? 'CHÍ MẠNG' : opt.backstab ? 'ĐÂM LƯNG' : '';
  if (label) { dmg *= e.state === 'broken' ? 3.5 : 3; crit = true; }
  if (e.T && e.T.shield && !crit && kind !== 'spell' && e.state !== 'atk' && e.state !== 'broken' && e.state !== 'stagger' &&
      Math.abs(angDiff(e.face, Math.atan2(fy - e.y, fx - e.x))) < 1.2) {
    if (kind === 'heavy') { dmg *= 0.6; poise *= 1.5; }
    else {
      dmg *= 0.15; poise *= 0.6; SFX.block();
      burst(e.x + Math.cos(e.face) * 14, e.y + Math.sin(e.face) * 14, 8, '#fff1c4', 200, 2, 'spark', 0.25);
      floatText(e.x, e.y - e.r - 28, 'CHẶN', '#c8c8c0');
      if (e.state === 'idle' || e.state === 'return') { e.state = 'chase'; e.t = 0; }
    }
  }
  dmg = Math.round(dmg * rand(0.94, 1.06));
  e.hp -= dmg; e.hurtFlash = 0.12; e.lastHit = 0;
  G.hitStop = crit ? 0.14 : kind === 'heavy' ? 0.075 : 0.045;
  shake(crit ? 11 : kind === 'heavy' ? 6 : 3);
  const a = Math.atan2(e.y - fy, e.x - fx);
  burst(e.x, e.y, crit ? 26 : 10, e.isBoss || e.isFinal ? '#e8c25e' : e.isDragon ? '#5a3a2a' : '#7c1210', crit ? 220 : 150, 3, 'dot', 0.5, a);
  burst(e.x, e.y, 5, '#fff3c4', 260, 2, 'spark', 0.2, a);
  floatText(e.x, e.y - e.r - 12, String(dmg), crit ? '#ffd36b' : '#f1e6c8', crit);
  if (crit) { SFX.crit(); floatText(e.x, e.y - e.r - 40, label, '#ffd36b', true); } else SFX.hit();
  if (e.isDragon && (e.state === 'sleep' || e.state === 'return')) wakeDragon();
  if (!e.isBoss && !e.isDragon && !e.isFinal && (e.state === 'idle' || e.state === 'return')) { e.state = 'chase'; e.t = 0; }
  if (!e.isBoss && !e.isDragon && !e.isFinal) { const kb = e.elite ? 40 : kind === 'heavy' ? 240 : 120; e.vx += Math.cos(a) * kb; e.vy += Math.sin(a) * kb; }
  if (opt.bleed && e.hp > 0) {
    e.bleed = (e.bleed || 0) + opt.bleed;
    const cap = e.bleedMax || (e.elite ? 110 : 60);
    if (e.bleed >= cap) {
      e.bleed = 0;
      const extra = Math.round(Math.max(30, e.maxHp * (e.isBoss || e.isDragon ? 0.07 : 0.15)));
      e.hp -= extra; SFX.bleed(); burst(e.x, e.y, 30, '#b3150f', 200, 3.5, 'dot', 0.7);
      floatText(e.x, e.y - e.r - 60, 'CHẢY MÁU ' + extra, '#ff6a5a', true);
    }
  }
  if (e.hp <= 0) { if (e.isFinal && e.phase === 1) { finalTransform(); return; } killEnemy(e); return; }
  if (crit) { e.state = 'stagger'; e.t = 0; e.stagDur = 0.8; e.poiseAcc = 0; e.atk = null; return; }
  e.poiseAcc += poise;
  if (e.poiseAcc >= e.poise) {
    e.poiseAcc = 0; e.atk = null; e.z = 0;
    if (e.elite) { e.state = 'broken'; e.t = 0; floatText(e.x, e.y - e.r - 36, 'MẤT THẾ', '#f2dc97', true); }
    else { e.state = 'stagger'; e.t = 0; e.stagDur = 0.5; }
  }
}
function gainRunes(n, x, y) {
  S.runes += n; G.runeGain += n; G.runeGainT = 2.6;
  for (let i = 0; i < 10; i++) addPart(x + rand(-10, 10), y + rand(-10, 10), rand(-30, 30), rand(-60, -20), rand(0.6, 1.2), rand(2, 3.5), '#f3d27a', 'mote');
}
function killEnemy(e) {
  e.dead = true; e.state = 'dead'; e.t = 0; e.hp = 0;
  if (P.lock === e) P.lock = null;
  burst(e.x, e.y, 24, 'rgba(60,55,45,.8)', 80, 5, 'dot', 1);
  if (e.isBoss) { bossDefeated(); return; }
  if (e.isDragon) { dragonDefeated(); return; }
  if (e.isFinal) { finalDefeated(); return; }
  gainRunes(Math.round(e.T.runes * (e.runeMul || 1)), e.x, e.y);
  if (e.T.miniboss) {
    S.mb[e.type] = true;
    banner('felled', 'KẺ THÙ ĐÃ BỊ HẠ GỤC', '', 4); SFX.felled();
    burst(e.x, e.y, 60, e.T.ghost ? '#cfefff' : '#f3cf6e', 240, 4, 'dot', 1.3);
    const w = e.T.drop;
    if (w && !S.weapons.includes(w)) { S.weapons.push(w); later(4.2, () => { banner('item', WEAPONS[w].name, WEAPONS[w].desc + (G.touch ? ' · bấm Vũ khí để đổi' : ' · ← → để đổi vũ khí'), 4.2); SFX.pickup(); }); }
    if (e.type === 'wraith') enemies.forEach(x => { if (x.summoned && !x.dead) killEnemy(x); });
    save();
  }
}

// ───────────────────────── AI kẻ địch thường ─────────────────────────
function startEnemyAtk(e, idx) {
  e.state = 'atk'; e.atk = e.T.attacks[idx]; e.t = 0; e.atkHit = false; e.lunged = false; e.fired = false; e.glinted = false; e.fade = 0;
}
function enemyShot(e, a, pr) {
  projs.push({ x: e.x + Math.cos(a) * 22, y: e.y + Math.sin(a) * 22, vx: Math.cos(a) * pr.speed, vy: Math.sin(a) * pr.speed, r: pr.r, dmg: pr.dmg, kind: pr.kind || 'orb', friendly: false, life: 3, puddle: pr.puddle });
}
function blinkBehind(e) {
  burst(e.x, e.y, 16, e.T.look ? e.T.look.trim : '#cfefff', 120, 3, 'dot', 0.5);
  let placed = false;
  for (let k = 0; k < 6 && !placed; k++) {
    const a = P.face + Math.PI + rand(-0.7, 0.7) + (k > 2 ? Math.PI / 2 * (k % 2 ? 1 : -1) : 0), rr = e.r + P.r + 26;
    const nx = P.x + Math.cos(a) * rr, ny = P.y + Math.sin(a) * rr;
    if (!pointBlocked(nx, ny)) { e.x = nx; e.y = ny; placed = true; }
  }
  e.face = Math.atan2(P.y - e.y, P.x - e.x);
  burst(e.x, e.y, 16, '#cfefff', 120, 3, 'dot', 0.5); SFX.glint();
}
function updateEnemyAtk(e, dt, ang) {
  const A = e.atk, t = e.t, T = e.T, kind = A.kind || 'melee';
  const finish = () => { if (A.next !== undefined) startEnemyAtk(e, A.next); else endEnemyAtk(e); };
  if (t < A.wind) {
    e.face = turn(e.face, ang, T.track * dt);
    if (kind === 'blink') e.fade = t / A.wind;
    if (!e.glinted && t > A.wind * 0.35) { e.glinted = true; if (T.look && kind === 'melee') addPart(e.x + Math.cos(e.face) * 18, e.y + Math.sin(e.face) * 18 - 8, 0, 0, 0.35, 10, '#fff6d8', 'glint'); }
    if (kind === 'charge' && Math.random() < dt * 20) addPart(e.x + rand(-10, 10), e.y + rand(-10, 10), 0, -20, 0.4, 3, '#9fb4ff');
    return;
  }
  const once = !e.fired; e.fired = true;
  switch (kind) {
    case 'melee':
      if (t < A.wind + A.act) {
        if (!e.lunged) { e.lunged = true; e.vx += Math.cos(e.face) * A.lunge; e.vy += Math.sin(e.face) * A.lunge; if (e.type !== 'wolf' && e.type !== 'bat' && e.type !== 'spider') SFX.swing(); }
        if (!e.atkHit && P.state !== 'dead' && inArc(e.x, e.y, e.face, A.range, A.arc, P.x, P.y, P.r)) {
          if (hurtPlayer(A.dmg, e.x, e.y, A.dmg >= 45, e)) { e.atkHit = true; if (A.poison && P.state !== 'guard') P.poisonB += A.poison; }
        }
      } else if (t >= A.wind + A.act + A.rec) finish();
      return;
    case 'shot':
      if (once) {
        const lead = dist(e.x, e.y, P.x, P.y) / A.proj.speed * 0.5;
        const a0 = Math.atan2(P.y + P.mvy * lead - e.y, P.x + P.mvx * lead - e.x);
        for (let i = 0; i < A.n; i++) enemyShot(e, a0 + (i - (A.n - 1) / 2) * A.spread, A.proj);
        if (A.proj.kind === 'arrow') noise(0.12, 0.12, 2400, 1.5); else SFX.spell();
      }
      break;
    case 'lob':
      if (once) {
        for (let i = 0; i < A.n; i++) spawnFireball(e.x, e.y, P.x + P.mvx * 0.5 + (i ? rand(-90, 90) : 0), P.y + P.mvy * 0.5 + (i ? rand(-90, 90) : 0), A.dmg, A.r, 300);
        SFX.swing();
      }
      break;
    case 'blink':
      if (once) { blinkBehind(e); e.fade = 0; }
      finish();
      return;
    case 'slam':
      if (once) {
        const hx = e.x + Math.cos(e.face) * A.off, hy = e.y + Math.sin(e.face) * A.off;
        aoeBlast(hx, hy, A.r, A.dmg); if (A.ring) addRing(hx, hy, ...A.ring);
        SFX.boom(); shake(10); burst(hx, hy, 30, 'rgba(130,115,90,.7)', 200, 6, 'dot', 0.7);
      }
      break;
    case 'charge':
      if (t < A.wind + A.dur) {
        if (!e.lunged) { e.lunged = true; SFX.heavy(); }
        moveCircle(e, Math.cos(e.face) * A.speed * dt, Math.sin(e.face) * A.speed * dt, true);
        if (Math.random() < dt * 30) addPart(e.x + rand(-8, 8), e.y + rand(-8, 8), 0, 0, 0.5, rand(4, 7), 'rgba(120,105,80,.5)');
        if (!e.atkHit && dist(e.x, e.y, P.x, P.y) < e.r + P.r + 10 && hurtPlayer(A.dmg, e.x, e.y, true, e)) e.atkHit = true;
        return;
      }
      if (t >= A.wind + A.dur + A.rec) finish();
      return;
    case 'orbs':
      if (once) {
        const ring = off => { if (e.dead) return; for (let i = 0; i < A.n; i++) { const a = i / A.n * TAU + off; enemyShot(e, a, { speed: 210, dmg: A.dmg, r: 8, kind: 'porb' }); } SFX.spell(); };
        ring(0); later(0.4, () => ring(Math.PI / A.n));
      }
      break;
    case 'summon':
      if (once) {
        for (const s of [-1, 1]) {
          const g = makeEnemy('ghost', e.x + s * 70, e.y + 20); g.summoned = true; g.state = 'chase'; g.hx = e.x; g.hy = e.y;
          enemies.push(g); burst(g.x, g.y, 20, '#cfefff', 120, 3, 'dot', 0.6);
        }
        SFX.roar();
      }
      break;
  }
  if (t >= A.wind + (A.rec || 0)) finish();
}
function endEnemyAtk(e) { e.state = 'chase'; e.t = 0; e.atk = null; e.fade = 0; e.cd = rand(e.T.cd[0], e.T.cd[1]) * 0.85; }
function updateEnemies(dt) {
  const alive = P.state !== 'dead';
  const pInArena = inArena(P.x, P.y) || P.y < 420;
  for (const e of enemies) {
    e.t += dt;
    if (e.dead) continue;
    const T = e.T;
    e.cd -= dt; e.anim += dt; e.lastHit += dt; e.moving = false;
    if (e.hurtFlash > 0) e.hurtFlash -= dt;
    if (e.lastHit > 2.5) e.poiseAcc = Math.max(0, e.poiseAcc - dt * e.poise * 0.5);
    if (e.bleed && e.lastHit > 2) e.bleed = Math.max(0, e.bleed - 12 * dt);
    if (T.ghost && Math.random() < dt * 4) addPart(e.x + rand(-10, 10), e.y + rand(-10, 10), 0, -20, 0.7, 2, 'rgba(200,235,255,.7)', 'mote');
    if (e.vx || e.vy) {
      moveCircle(e, e.vx * dt, e.vy * dt, true);
      const f = Math.exp(-9 * dt); e.vx *= f; e.vy *= f;
      if (Math.abs(e.vx) < 1) e.vx = 0; if (Math.abs(e.vy) < 1) e.vy = 0;
    }
    const d = dist(e.x, e.y, P.x, P.y), ang = Math.atan2(P.y - e.y, P.x - e.x), homeD = dist(e.x, e.y, e.hx, e.hy);
    const go = (a, s) => { moveCircle(e, Math.cos(a) * s * dt, Math.sin(a) * s * dt, true); e.moving = true; };
    switch (e.state) {
      case 'idle': {
        if (alive && (d < T.aggro || e.challenge) && !pInArena) { e.state = 'chase'; e.t = 0; break; }
        if (!e.wander || e.t > e.wander.until) e.wander = { x: e.hx + rand(-70, 70), y: e.hy + rand(-70, 70), until: e.t + rand(2, 5) };
        if (dist(e.x, e.y, e.wander.x, e.wander.y) > 10) { const a = Math.atan2(e.wander.y - e.y, e.wander.x - e.x); e.face = turn(e.face, a, 4 * dt); go(a, T.speed * 0.32); }
        break;
      }
      case 'return': {
        if (alive && d < T.aggro * 0.6 && homeD < 400 && !pInArena) { e.state = 'chase'; break; }
        const a = Math.atan2(e.hy - e.y, e.hx - e.x); e.face = turn(e.face, a, 6 * dt); go(a, T.speed);
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.3 * dt);
        if (homeD < 14) { e.state = 'idle'; e.t = 0; }
        break;
      }
      case 'chase': {
        if (!alive || (homeD > (T.leash || 680) && !e.challenge) || pInArena) { e.state = 'return'; e.t = 0; break; }
        e.face = turn(e.face, ang, 7 * dt);
        if (T.flier) {
          e.orbit = (e.orbit || rand(0, TAU)) + dt * 2.2 * e.strafe;
          const tx = P.x + Math.cos(e.orbit) * 95, ty = P.y + Math.sin(e.orbit) * 95;
          go(Math.atan2(ty - e.y, tx - e.x), T.speed);
          if (e.cd <= 0 && d < 140) startEnemyAtk(e, 0);
        } else if (T.ranged) {
          let mv = 0, side = 0;
          if (d > T.keep + 50) mv = 1; else if (d < T.keep - 70) mv = -1; else side = e.strafe;
          if (Math.random() < dt * 0.4) e.strafe *= -1;
          if (mv) go(mv > 0 ? ang : ang + Math.PI, T.speed);
          else if (side) go(ang + Math.PI / 2 * side, T.speed * 0.6);
          if (e.cd <= 0 && d < T.aggro + 40) startEnemyAtk(e, T.pick ? T.pick(e, d) : 0);
        } else {
          const reach = T.atkRange + P.r;
          if (d > reach * 0.85) go(ang, T.speed);
          else if (e.cd > 0) { go(ang + Math.PI / 2 * e.strafe, T.speed * 0.45); if (Math.random() < dt * 0.5) e.strafe *= -1; }
          if (e.cd <= 0) {
            const idx = T.pick ? T.pick(e, d) : d < reach ? (e.type === 'knight' && Math.random() < 0.35 ? 2 : 0) : -1;
            if (idx >= 0) startEnemyAtk(e, idx);
          }
        }
        break;
      }
      case 'atk': updateEnemyAtk(e, dt, ang); break;
      case 'stagger': if (e.t > e.stagDur) { e.state = 'chase'; e.t = 0; e.cd = rand(0.2, 0.6); } break;
      case 'broken': if (e.t > 2.2) { e.state = 'chase'; e.t = 0; e.poiseAcc = 0; } break;
    }
  }
  // tách các thực thể chồng lên nhau
  const live = enemies.filter(e => !e.dead);
  for (let i = 0; i < live.length; i++) {
    const a = live[i];
    for (let j = i + 1; j < live.length; j++) {
      const b = live[j], dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2), push = (rr - d) / 2; a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push; }
    }
    if (P.state !== 'dead') {
      const dx = a.x - P.x, dy = a.y - P.y, rr = a.r + P.r, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2), push = rr - d; a.x += dx / d * push * 0.6; a.y += dy / d * push * 0.6; P.x -= dx / d * push * 0.4; P.y -= dy / d * push * 0.4; }
    }
  }
}

// ───────────────────────── boss: Varek ─────────────────────────
const sw = (wind, act, rec, dmg, range, arc, lunge, swing) => ({ k: 'swing', wind, act, rec, dmg, range, arc, lunge, swing });
const BOSS_MOVES = {
  combo: () => [sw(0.55, 0.14, 0.12, 50, 100, 2.2, 260, 1), sw(0.95, 0.14, 0.12, 48, 100, 2.2, 260, -1), sw(0.42, 0.16, 0.85, 60, 112, 2.6, 330, 1)],
  combo2: () => [sw(0.5, 0.13, 0.1, 52, 100, 2.2, 260, 1), sw(1.05, 0.13, 0.1, 50, 100, 2.2, 280, -1), sw(0.35, 0.13, 0.1, 50, 100, 2.2, 260, 1), sw(0.7, 0.16, 0.9, 66, 118, 2.8, 360, -1)],
  leap: () => [{ k: 'leap', wind: 0.5, air: 0.72, rec: 0.85, dmg: 72, r: 115 }],
  daggers: () => [{ k: 'throw', wind: 0.5, rec: 0.55, n: boss.phase === 2 ? 5 : 3, spread: 0.22 }],
  hop: () => [{ k: 'hop', dur: 0.4 }, { k: 'throw', wind: 0.3, rec: 0.6, n: 3, spread: 0.22 }],
  hammer: () => [{ k: 'hammer', wind: 1.05, rec: 1.0 }],
  rain: () => [{ k: 'rain', dur: 1.7, rec: 0.5 }],
};
function aoeBlast(x, y, r, dmg, col) {
  if (dist(x, y, P.x, P.y) < r + P.r) hurtPlayer(dmg, x, y, true, null, 'aoe');
  aoes.push({ kind: 'flash', x, y, r, t: 0, dur: 0.35, col });
}
function addRing(x, y, r0, r1, dur, dmg) { aoes.push({ kind: 'ring', x, y, r0, r1, dur, dmg, t: 0, hit: false }); }
function addDelayed(x, y, r, delay, dmg) { aoes.push({ kind: 'delayed', x, y, r, delay, dmg, t: 0 }); }
function addMark(x, y, r, dur) { aoes.push({ kind: 'mark', x, y, r, dur, t: 0 }); }
function bossChoose(d) {
  const b = boss, p2 = b.phase === 2, opts = [];
  if (d < 160) { opts.push(['combo', p2 ? 2 : 4], ['hop', 1]); if (p2) opts.push(['combo2', 3], ['hammer', 2.5]); }
  else if (d < 420) { opts.push(['leap', 3], ['daggers', 2]); if (p2) opts.push(['rain', 2]); if (p2 && d < 230) opts.push(['hammer', 1]); }
  else { opts.push(['leap', 2], ['daggers', 1]); if (p2) opts.push(['rain', 1]); }
  let total = 0;
  for (const o of opts) { if (o[0] === b.lastMove) o[1] *= 0.35; total += o[1]; }
  let r = Math.random() * total, k = opts[0][0];
  for (const o of opts) { r -= o[1]; if (r <= 0) { k = o[0]; break; } }
  b.lastMove = k; b.atk = { steps: BOSS_MOVES[k](), i: 0, t: 0, hit: false, flag: 0, acc: 0 }; b.state = 'atk'; b.t = 0;
}
function bossAtk(dt, ang) {
  const b = boss, A = b.atk, s = A.steps[A.i], pt = A.t;
  A.t += dt;
  const t = A.t, cross = x => pt < x && t >= x;
  const done = () => {
    A.i++; A.t = 0; A.hit = false; A.flag = 0; A.acc = 0;
    if (A.i >= A.steps.length) { b.state = 'chase'; b.t = 0; b.atk = null; b.cd = b.phase === 2 ? rand(0.25, 0.8) : rand(0.6, 1.3); }
  };
  switch (s.k) {
    case 'swing':
      if (t < s.wind) { b.face = turn(b.face, ang, 2.6 * dt); if (cross(s.wind * 0.3)) { addPart(b.x + Math.cos(b.face) * 40, b.y + Math.sin(b.face) * 40 - 20, 0, 0, 0.4, 16, '#fff6d8', 'glint'); SFX.glint(); } }
      else if (t < s.wind + s.act) {
        if (cross(s.wind)) { b.vx += Math.cos(b.face) * s.lunge; b.vy += Math.sin(b.face) * s.lunge; SFX.heavy(); }
        if (!A.hit && inArc(b.x, b.y, b.face, s.range, s.arc, P.x, P.y, P.r) && hurtPlayer(s.dmg, b.x, b.y, true, b)) A.hit = true;
      } else if (t >= s.wind + s.act + s.rec) done();
      break;
    case 'leap':
      if (t < s.wind) b.face = turn(b.face, ang, 3 * dt);
      else if (t < s.wind + s.air) {
        if (!A.flag) {
          A.flag = 1; A.sx = b.x; A.sy = b.y;
          A.tx = clamp(P.x + P.mvx * 0.35, ARENA.x + 40, ARENA.x + ARENA.w - 40);
          A.ty = clamp(P.y + P.mvy * 0.35, ARENA.y + 40, ARENA.y + ARENA.h - 40);
          addMark(A.tx, A.ty, s.r, s.air); SFX.heavy();
        }
        const k = (t - s.wind) / s.air, ez = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        b.x = lerp(A.sx, A.tx, ez); b.y = lerp(A.sy, A.ty, ez); b.z = Math.sin(k * Math.PI) * 90;
        b.face = Math.atan2(A.ty - A.sy, A.tx - A.sx);
      } else {
        if (A.flag === 1) {
          A.flag = 2; b.z = 0; b.x = A.tx; b.y = A.ty;
          aoeBlast(b.x, b.y, s.r, s.dmg); SFX.boom(); shake(14);
          burst(b.x, b.y, 40, 'rgba(150,130,95,.7)', 220, 6, 'dot', 0.8);
          if (b.phase === 2) addRing(b.x, b.y, s.r, s.r + 150, 0.45, 30);
        }
        if (t >= s.wind + s.air + s.rec) done();
      }
      break;
    case 'throw':
      if (t < s.wind) b.face = turn(b.face, ang, 4 * dt);
      else {
        if (!A.flag) {
          A.flag = 1;
          for (let i = 0; i < s.n; i++) {
            const a = b.face + (i - (s.n - 1) / 2) * s.spread;
            projs.push({ x: b.x + Math.cos(a) * 34, y: b.y + Math.sin(a) * 34, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 8, dmg: 22, kind: 'dagger', friendly: false, life: 1.6 });
          }
          SFX.swing();
        }
        if (t >= s.wind + s.rec) done();
      }
      break;
    case 'hop':
      if (!A.flag) { A.flag = 1; b.vx -= Math.cos(ang) * 560; b.vy -= Math.sin(ang) * 560; }
      b.face = turn(b.face, ang, 6 * dt);
      b.z = Math.sin(Math.min(1, t / s.dur) * Math.PI) * 22;
      if (t >= s.dur) { b.z = 0; done(); }
      break;
    case 'hammer':
      if (t < s.wind) {
        b.face = turn(b.face, ang, 2 * dt);
        if (cross(0.2)) SFX.glint();
        if (Math.random() < dt * 40) addPart(b.x - Math.cos(b.face) * 30 + rand(-20, 20), b.y - Math.sin(b.face) * 30 + rand(-20, 20) - 30, 0, -40, 0.5, rand(2, 4), '#f6d27a', 'mote');
      } else {
        if (!A.flag) {
          A.flag = 1;
          const hx = b.x + Math.cos(b.face) * 85, hy = b.y + Math.sin(b.face) * 85;
          aoeBlast(hx, hy, 95, 82); addRing(hx, hy, 95, 300, 0.6, 40);
          SFX.boom(); shake(18); burst(hx, hy, 50, '#f3cf6e', 260, 4, 'dot', 0.8);
        }
        if (t >= s.wind + s.rec) done();
      }
      break;
    case 'rain':
      b.face = turn(b.face, ang, 3 * dt);
      A.acc += dt;
      while (A.acc > 0.24 && t < s.dur) { A.acc -= 0.24; addDelayed(P.x + rand(-45, 45), P.y + rand(-45, 45), 52, 0.9, 40); }
      if (t >= s.dur + s.rec) done();
      break;
  }
}
function updateBoss(dt) {
  const b = boss;
  if (!b) return;
  b.anim += dt;
  if (b.hurtFlash > 0) b.hurtFlash -= dt;
  b.lastHit += dt;
  if (b.invuln > 0) b.invuln -= dt;
  if (b.ghost > b.hp) { if (b.lastHit > 0.7) b.ghost = Math.max(b.hp, b.ghost - b.maxHp * 0.35 * dt); } else b.ghost = b.hp;
  if (b.dead) { b.t += dt; return; }
  if (b.state === 'dormant') return;
  b.t += dt; b.cd -= dt;
  if (b.lastHit > 3) b.poiseAcc = Math.max(0, b.poiseAcc - dt * 40);
  if (b.bleed && b.lastHit > 2) b.bleed = Math.max(0, b.bleed - 12 * dt);
  if (b.vx || b.vy) { b.x += b.vx * dt; b.y += b.vy * dt; const f = Math.exp(-8 * dt); b.vx *= f; b.vy *= f; if (Math.abs(b.vx) < 1) b.vx = 0; if (Math.abs(b.vy) < 1) b.vy = 0; }
  const d = dist(b.x, b.y, P.x, P.y), ang = Math.atan2(P.y - b.y, P.x - b.x);
  switch (b.state) {
    case 'intro': b.face = turn(b.face, ang, 2 * dt); if (b.t > 1.6) { b.state = 'chase'; b.t = 0; b.cd = 0.4; } break;
    case 'chase': {
      if (b.phase === 1 && b.hp <= b.maxHp * 0.5) { b.state = 'phase'; b.t = 0; b.invuln = 2.1; b.fx = false; break; }
      b.face = turn(b.face, ang, 5 * dt);
      const spd = b.phase === 2 ? 125 : 105;
      if (d > 95) { b.x += Math.cos(ang) * spd * dt; b.y += Math.sin(ang) * spd * dt; }
      else { const a = ang + Math.PI / 2; b.x += Math.cos(a) * 40 * dt; b.y += Math.sin(a) * 40 * dt; }
      if (b.cd <= 0 && P.state !== 'dead') bossChoose(d);
      break;
    }
    case 'phase':
      if (!b.fx && b.t > 0.7) {
        b.fx = true; SFX.roar(); addRing(b.x, b.y, 30, 260, 0.6, 35); shake(14);
        subtitle('“Quỳ xuống! Ánh vàng này không dành cho kẻ nhạt phai!”');
        burst(b.x, b.y, 60, '#f3cf6e', 240, 4, 'dot', 1.1);
      }
      if (b.t > 2) { b.phase = 2; b.state = 'chase'; b.t = 0; b.cd = 0.3; }
      break;
    case 'atk': bossAtk(dt, ang); break;
    case 'stagger': if (b.t > b.stagDur) { b.state = 'chase'; b.t = 0; b.cd = 0.3; } break;
    case 'broken': b.z = 0; if (b.t > 2.6) { b.state = 'chase'; b.t = 0; b.cd = 0.2; b.poiseAcc = 0; } break;
  }
  b.x = clamp(b.x, ARENA.x + b.r, ARENA.x + ARENA.w - b.r); b.y = clamp(b.y, ARENA.y + b.r, ARENA.y + ARENA.h - b.r);
  if (b.phase === 2 && Math.random() < dt * 14) addPart(b.x + rand(-26, 26), b.y + rand(-20, 20), rand(-8, 8), rand(-50, -20), rand(0.6, 1.1), rand(1.5, 3), '#f3cf6e', 'mote');
  if (b.z < 5 && P.state !== 'dead') {
    const dx = P.x - b.x, dy = P.y - b.y, rr = b.r + P.r, d2 = dx * dx + dy * dy;
    if (d2 < rr * rr && d2 > 1e-6) { const dd = Math.sqrt(d2); P.x = b.x + dx / dd * rr; P.y = b.y + dy / dd * rr; collide(P, false); }
  }
}
function startBossFight() {
  G.bossFight = true; boss.state = 'intro'; boss.t = 0;
  if (P.mounted) P.mounted = false;
  SFX.roar(); shake(8);
  subtitle('“Kẻ nhạt phai... ngươi không xứng đáng chạm tới Cây Vàng.”');
}
function bossDefeated() {
  S.bossDead = true; G.bossFight = false;
  gainRunes(2500, boss.x, boss.y);
  if (!S.weapons.includes('varek')) { S.weapons.push('varek'); later(9.2, () => { banner('item', WEAPONS.varek.name, WEAPONS.varek.desc + (G.touch ? ' · bấm Vũ khí để đổi' : ' · ← → để đổi vũ khí'), 4.2); SFX.pickup(); }); }
  banner('felled', 'KẺ THÙ ĐÃ BỊ HẠ GỤC', '', 4.6); SFX.felled();
  burst(boss.x, boss.y, 80, '#f3cf6e', 280, 5, 'dot', 1.6);
  subtitle('“Ánh vàng... đã chọn... ngươi...”', 3.6);
  later(4.4, () => subtitle('Cánh cổng phía bắc đã mở. Cây Vàng đang chờ.', 4.5));
  save();
}

// ───────────────────────── rồng: Ignarth ─────────────────────────
function makeDragon() {
  return { isDragon: true, noParry: true, name: 'Ignarth, Rồng Tro Cổ Đại', x: LAIR.x, y: LAIR.y, r: 40, hp: Math.round(2000 * lvHp()), maxHp: Math.round(2000 * lvHp()), ghost: Math.round(2000 * lvHp()),
    face: Math.PI * 0.8, state: 'sleep', t: 0, cd: 1, vx: 0, vy: 0, poise: 260, poiseAcc: 0, lastHit: 9, hurtFlash: 0, atk: null, dead: false,
    z: 0, elite: true, invuln: 0, anim: 0, stagDur: 1, bleed: 0, bleedMax: 220, lastMove: '', spin: 0, charge: 0, breathing: false, breathDir: 0, flying: false };
}
const enraged = () => dragon.hp < dragon.maxHp * 0.4;
function dragonNeck(d) { return d.breathing ? clamp(angDiff(d.face, d.breathDir), -1, 1) : d.state === 'sleep' ? 1.3 : 0; }
function dragonHead(d) {
  const na = dragonNeck(d), a = d.face + d.spin, nx = 34 + Math.cos(na) * 38, ny = Math.sin(na) * 38;
  return { x: d.x + Math.cos(a) * nx - Math.sin(a) * ny, y: d.y + Math.sin(a) * nx + Math.cos(a) * ny };
}
const DRAGON_MOVES = {
  bite: () => [{ k: 'melee', wind: 0.6, act: 0.15, rec: 0.7, dmg: 62, range: 125, arc: 1.1, lunge: 260, track: 2.2 }],
  bite2: () => [{ k: 'melee', wind: 0.5, act: 0.15, rec: 0.25, dmg: 55, range: 125, arc: 1.1, lunge: 240, track: 2.2 }, { k: 'melee', wind: 0.55, act: 0.15, rec: 0.8, dmg: 60, range: 125, arc: 1.1, lunge: 260, track: 2.2 }],
  claw: () => [{ k: 'melee', wind: 0.75, act: 0.2, rec: 0.8, dmg: 55, range: 120, arc: 2.8, lunge: 120, track: 1.4 }],
  tail: () => [{ k: 'tail', wind: 0.7, act: 0.4, rec: 0.9, dmg: 58, r: 140 }],
  breath: () => [{ k: 'breath', wind: 0.9, dur: enraged() ? 2.3 : 1.7, rec: 0.9, range: 280, cone: 0.6, sweep: 0.75 }],
  dive: () => [{ k: 'dive', wind: 0.6, air: 1.3, rec: 1.1, dmg: 80, r: 150 }],
  fireballs: () => [{ k: 'fireballs', wind: 0.7, rec: 0.8, n: enraged() ? 5 : 3 }],
};
function wakeDragon() {
  const d = dragon;
  if (!d || d.dead) return;
  if (d.state === 'sleep') { d.state = 'wake'; d.t = 0; SFX.roar(); shake(10); burst(d.x, d.y, 30, 'rgba(120,100,80,.6)', 160, 6, 'dot', 0.9); }
  else if (d.state === 'return') { d.state = 'chase'; d.t = 0; }
  G.dragonFight = true;
}
function dragonChoose(dd, rel) {
  const d = dragon, en = enraged();
  let opts;
  if (dd < 190) opts = rel > 2.0 ? [['tail', 5]] : rel > 1.1 ? [['claw', 3], ['tail', 2]] : [['bite', 3], ['bite2', en ? 3 : 1.5], ['claw', 2], ['breath', 1.5]];
  else if (dd < 420) opts = rel > 1.1 ? [['dive', 2], ['fireballs', 1]] : [['breath', 3], ['dive', 2], ['fireballs', 1.5]];
  else opts = [['dive', 3], ['fireballs', 3]];
  let total = 0;
  for (const o of opts) { if (o[0] === d.lastMove) o[1] *= 0.35; total += o[1]; }
  let r = Math.random() * total, k = opts[0][0];
  for (const o of opts) { r -= o[1]; if (r <= 0) { k = o[0]; break; } }
  d.lastMove = k; d.atk = { steps: DRAGON_MOVES[k](), i: 0, t: 0, hit: false, flag: 0, acc: 0, dir: Math.random() < 0.5 ? 1 : -1 }; d.state = 'atk'; d.t = 0;
}
function spawnFireball(x, y, tx, ty, dmg = 42, boom = 70, sp = 420) {
  const dd = Math.max(1, dist(x, y, tx, ty)), life = dd / sp;
  projs.push({ x, y, vx: (tx - x) / dd * sp, vy: (ty - y) / dd * sp, r: 12, dmg, boom, kind: 'fireball', friendly: false, life });
  addMark(tx, ty, boom, life);
}
const FIRE_COLS = ['#ffb347', '#ff7a2a', '#ffd27a', '#ff5a1f'];
function dragonAtk(dt, ang) {
  const d = dragon, A = d.atk, s = A.steps[A.i], pt = A.t;
  A.t += dt;
  const t = A.t, cross = x => pt < x && t >= x;
  const done = () => {
    A.i++; A.t = 0; A.hit = false; A.flag = 0; A.acc = 0;
    if (A.i >= A.steps.length) { d.state = 'chase'; d.t = 0; d.atk = null; d.cd = enraged() ? rand(0.4, 1) : rand(0.8, 1.6); }
  };
  switch (s.k) {
    case 'melee':
      if (t < s.wind) { d.face = turn(d.face, ang, s.track * dt); if (cross(s.wind * 0.35)) { const h = dragonHead(d); addPart(h.x, h.y - 10, 0, 0, 0.4, 18, '#ffe0b0', 'glint'); SFX.glint(); } }
      else if (t < s.wind + s.act) {
        if (cross(s.wind)) { d.vx += Math.cos(d.face) * s.lunge; d.vy += Math.sin(d.face) * s.lunge; SFX.heavy(); }
        if (!A.hit && inArc(d.x, d.y, d.face, s.range, s.arc, P.x, P.y, P.r) && hurtPlayer(s.dmg, d.x, d.y, true, d)) A.hit = true;
      } else if (t >= s.wind + s.act + s.rec) done();
      break;
    case 'tail':
      if (t < s.wind) d.spin = -0.4 * (t / s.wind);
      else if (t < s.wind + s.act) {
        if (cross(s.wind)) SFX.heavy();
        d.spin = -0.4 + ((t - s.wind) / s.act) * (TAU + 0.4);
        if (!A.hit && dist(d.x, d.y, P.x, P.y) < s.r + P.r && hurtPlayer(s.dmg, d.x, d.y, true, d)) A.hit = true;
      } else { d.spin = 0; if (t >= s.wind + s.act + s.rec) done(); }
      break;
    case 'breath': {
      if (t < s.wind) { d.face = turn(d.face, ang, 2.5 * dt); d.charge = t / s.wind; break; }
      if (t < s.wind + s.dur) {
        d.charge = 0; d.breathing = true;
        const k = (t - s.wind) / s.dur;
        d.breathDir = d.face + lerp(-s.sweep, s.sweep, k) * A.dir;
        if (cross(s.wind)) SFX.fire(s.dur);
        const h = dragonHead(d), bd = d.breathDir;
        for (let i = 0; i < 5; i++) {
          const a = bd + rand(-s.cone / 2, s.cone / 2), sp = rand(380, 620);
          addPart(h.x + Math.cos(bd) * 14, h.y + Math.sin(bd) * 14, Math.cos(a) * sp, Math.sin(a) * sp, rand(0.45, 0.65), rand(5, 10), FIRE_COLS[(Math.random() * 4) | 0], 'fire');
        }
        A.acc += dt;
        if (A.acc >= 0.18) {
          A.acc -= 0.18;
          const pd = dist(h.x, h.y, P.x, P.y), pa = Math.atan2(P.y - h.y, P.x - h.x);
          if (pd < s.range && Math.abs(angDiff(bd, pa)) < s.cone / 2 + Math.atan2(P.r, Math.max(pd, 1))) hurtPlayer(13, h.x, h.y, false, d, 'fire');
        }
      } else { d.breathing = false; if (t >= s.wind + s.dur + s.rec) done(); }
      break;
    }
    case 'dive':
      if (t < s.wind) { d.face = turn(d.face, ang, 3 * dt); d.z = (t / s.wind) * 20; }
      else if (t < s.wind + s.air) {
        if (!A.flag) {
          A.flag = 1; A.sx = d.x; A.sy = d.y;
          [A.tx, A.ty] = clampLair(P.x + P.mvx * 0.5, P.y + P.mvy * 0.5);
          addMark(A.tx, A.ty, s.r, s.air); SFX.wing(); d.flying = true;
        }
        const k = (t - s.wind) / s.air, ez = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        d.x = lerp(A.sx, A.tx, ez); d.y = lerp(A.sy, A.ty, ez); d.z = 20 + Math.sin(k * Math.PI) * 150;
        if (dist(A.sx, A.sy, A.tx, A.ty) > 5) d.face = turn(d.face, Math.atan2(A.ty - A.sy, A.tx - A.sx), 4 * dt);
      } else {
        if (A.flag === 1) {
          A.flag = 2; d.z = 0; d.flying = false; d.x = A.tx; d.y = A.ty;
          aoeBlast(d.x, d.y, s.r, s.dmg); SFX.boom(); shake(16);
          burst(d.x, d.y, 44, 'rgba(120,100,80,.7)', 240, 7, 'dot', 0.9);
          if (enraged()) addRing(d.x, d.y, s.r, s.r + 160, 0.5, 30);
        }
        if (t >= s.wind + s.air + s.rec) done();
      }
      break;
    case 'fireballs':
      if (t < s.wind) { d.face = turn(d.face, ang, 3 * dt); d.charge = t / s.wind; }
      else {
        if (!A.flag) {
          A.flag = 1; d.charge = 0;
          const h = dragonHead(d);
          for (let i = 0; i < s.n; i++) {
            const tx = P.x + P.mvx * 0.4 + (i ? rand(-110, 110) : 0), ty = P.y + P.mvy * 0.4 + (i ? rand(-110, 110) : 0);
            spawnFireball(h.x, h.y, tx, ty);
          }
          SFX.spell(); noise(0.4, 0.2, 500, 0.6);
        }
        if (t >= s.wind + s.rec) done();
      }
      break;
  }
}
function updateDragon(dt) {
  const d = dragon;
  if (!d) return;
  d.anim += dt;
  if (d.hurtFlash > 0) d.hurtFlash -= dt;
  d.lastHit += dt;
  if (d.ghost > d.hp) { if (d.lastHit > 0.7) d.ghost = Math.max(d.hp, d.ghost - d.maxHp * 0.3 * dt); } else d.ghost = d.hp;
  if (d.dead) { d.t += dt; return; }
  d.t += dt; d.cd -= dt;
  if (d.lastHit > 3) d.poiseAcc = Math.max(0, d.poiseAcc - dt * 50);
  if (d.bleed && d.lastHit > 2) d.bleed = Math.max(0, d.bleed - 12 * dt);
  if (d.vx || d.vy) { d.x += d.vx * dt; d.y += d.vy * dt; const f = Math.exp(-8 * dt); d.vx *= f; d.vy *= f; if (Math.abs(d.vx) < 1) d.vx = 0; if (Math.abs(d.vy) < 1) d.vy = 0; }
  const alive = P.state !== 'dead' && G.mode === 'play';
  const dd = dist(d.x, d.y, P.x, P.y), ang = Math.atan2(P.y - d.y, P.x - d.x), pLair = dist(P.x, P.y, LAIR.x, LAIR.y);
  switch (d.state) {
    case 'sleep': if (alive && dd < 330) wakeDragon(); break;
    case 'wake':
      d.face = turn(d.face, ang, 1.6 * dt);
      if (d.t > 1.7) { d.state = 'chase'; d.t = 0; d.cd = 0.4; }
      break;
    case 'chase': {
      if (!alive || pLair > 950) { d.state = 'return'; d.t = 0; G.dragonFight = false; break; }
      d.face = turn(d.face, ang, (enraged() ? 2.6 : 2.1) * dt);
      const rel = Math.abs(angDiff(d.face, ang)), spd = enraged() ? 120 : 96;
      if (dd > 150 && rel < 1.3) { d.x += Math.cos(d.face) * spd * dt; d.y += Math.sin(d.face) * spd * dt; }
      if (d.cd <= 0 && alive) dragonChoose(dd, rel);
      break;
    }
    case 'return': {
      const hd = dist(d.x, d.y, LAIR.x, LAIR.y), ha = Math.atan2(LAIR.y - d.y, LAIR.x - d.x);
      d.hp = Math.min(d.maxHp, d.hp + d.maxHp * 0.25 * dt);
      if (alive && dd < 260 && pLair < 700) { wakeDragon(); break; }
      if (hd > 16) { d.face = turn(d.face, ha, 3 * dt); d.x += Math.cos(ha) * 150 * dt; d.y += Math.sin(ha) * 150 * dt; }
      else { d.state = 'sleep'; d.t = 0; d.hp = d.maxHp; d.bleed = 0; d.poiseAcc = 0; }
      break;
    }
    case 'atk': dragonAtk(dt, ang); break;
    case 'stagger': if (d.t > d.stagDur) { d.state = 'chase'; d.t = 0; d.cd = 0.3; } break;
    case 'broken': if (d.t > 2.8) { d.state = 'chase'; d.t = 0; d.cd = 0.3; d.poiseAcc = 0; } break;
  }
  if (d.state !== 'atk') { d.breathing = false; d.charge = 0; d.spin = 0; d.flying = false; if (d.z > 0) d.z = Math.max(0, d.z - 300 * dt); }
  [d.x, d.y] = clampLair(d.x, d.y, 600);
  if (d.z < 5 && P.state !== 'dead') {
    const dx = P.x - d.x, dy = P.y - d.y, rr = d.r + P.r, d2 = dx * dx + dy * dy;
    if (d2 < rr * rr && d2 > 1e-6) { const l = Math.sqrt(d2); P.x = d.x + dx / l * rr; P.y = d.y + dy / l * rr; collide(P, false); }
  }
}
function dragonDefeated() {
  S.dragonDead = true; G.dragonFight = false;
  gainRunes(4000, dragon.x, dragon.y);
  if (!S.weapons.includes('greatsword')) S.weapons.push('greatsword');
  banner('felled', 'KẺ THÙ ĐÃ BỊ HẠ GỤC', '', 4.2); SFX.felled();
  burst(dragon.x, dragon.y, 90, '#ff9a4a', 300, 5, 'dot', 1.6);
  later(4.4, () => { banner('item', WEAPONS.greatsword.name, WEAPONS.greatsword.desc + (G.touch ? '' : ' · ← → để đổi vũ khí')); SFX.pickup(); });
  save();
}

// ───────────────────────── trận cuối: Aurel (phase 1) và Thú Vàng (phase 2) ─────────────────────────
function makeFinal() {
  const hp = Math.round(1800 * lvHp());
  return { isFinal: true, name: 'Aurel, Vị Vua Tro Tàn', x: RC.x, y: RC.y - 170, r: 26, hp, maxHp: hp, ghost: hp, face: Math.PI / 2, state: 'intro', t: 0, cd: 1.2,
    vx: 0, vy: 0, poise: 240, poiseAcc: 0, lastHit: 9, hurtFlash: 0, phase: 1, atk: null, dead: false, z: 0, elite: true, invuln: 0, anim: 0, stagDur: 0.8,
    lastMove: '', bleedMax: 240, beamDir: 0, beaming: false, charge: 0, fx: false,
    look: { body: '#8a6a2a', trim: '#f0d27a', head: '#6a5020', cloak: '#b8952f', weapon: 'club', wlen: 46, wcol: '#ffe08a', scale: 1.8, glow: true } };
}
const finalEnraged = () => fb.phase === 2 && fb.hp < fb.maxHp * 0.4;
const FINAL_MOVES = {
  // phase 1: Aurel
  combo: () => [sw(0.6, 0.15, 0.12, 55, 112, 2.3, 260, 1), sw(0.95, 0.15, 0.12, 55, 112, 2.3, 260, -1), { k: 'slam', wind: 0.55, rec: 0.9, off: 75, r: 95, dmg: 66, ring: [95, 260, 0.5, 30] }],
  leap: () => [{ k: 'leap', wind: 0.5, air: 0.8, rec: 0.9, dmg: 72, r: 120, h: 100 }],
  pillars: () => [{ k: 'pillars', wind: 0.7, rec: 0.9, n: 6 }],
  blink: () => [{ k: 'blink' }, sw(0.35, 0.14, 0.7, 52, 110, 2.4, 200, 1)],
  rings: () => [{ k: 'rings', wind: 0.8, rec: 0.9, n: 2 }],
  // phase 2: Thú Vàng
  horbs: () => [{ k: 'horbs', wind: 0.7, rec: 0.9, n: finalEnraged() ? 8 : 6 }],
  beam: () => [{ k: 'beam', wind: 0.9, dur: finalEnraged() ? 2.0 : 1.5, rec: 0.9, range: 480, cone: 0.14, sweep: 0.85 }],
  waves: () => [{ k: 'rings', wind: 0.7, rec: 1.0, n: 3 }],
  swipe: () => [sw(0.7, 0.2, 0.8, 70, 150, 2.6, 200, 1)],
  stars: () => [{ k: 'stars', wind: 0.8, rec: 0.7, n: finalEnraged() ? 12 : 9 }],
  dive: () => [{ k: 'leap', wind: 0.6, air: 1.1, rec: 1.1, dmg: 88, r: 160, h: 170 }],
};
function finalChoose(d) {
  const f = fb, p2 = f.phase === 2;
  const opts = !p2 ? (d < 160 ? [['combo', 4], ['blink', 1.5], ['rings', 1.5]] : [['leap', 3], ['pillars', 3], ['blink', 2], ['rings', 1]])
    : (d < 200 ? [['swipe', 4], ['waves', 2], ['beam', 1.5], ['stars', 1]] : [['beam', 3], ['horbs', 3], ['stars', 2], ['dive', 2], ['waves', 1]]);
  let total = 0;
  for (const o of opts) { if (o[0] === f.lastMove) o[1] *= 0.35; total += o[1]; }
  let r = Math.random() * total, k = opts[0][0];
  for (const o of opts) { r -= o[1]; if (r <= 0) { k = o[0]; break; } }
  f.lastMove = k; f.atk = { steps: FINAL_MOVES[k](), i: 0, t: 0, hit: false, flag: 0, acc: 0, dir: Math.random() < 0.5 ? 1 : -1 }; f.state = 'atk'; f.t = 0;
}
function finalHead(f) { const o = f.phase === 2 ? 52 : 34; return { x: f.x + Math.cos(f.face) * o, y: f.y + Math.sin(f.face) * o }; }
function finalAtk(dt, ang) {
  const f = fb, A = f.atk, s = A.steps[A.i], pt = A.t;
  A.t += dt;
  const t = A.t, cross = x => pt < x && t >= x;
  const done = () => {
    A.i++; A.t = 0; A.hit = false; A.flag = 0; A.acc = 0; f.beaming = false; f.charge = 0;
    if (A.i >= A.steps.length) { f.state = 'chase'; f.t = 0; f.atk = null; f.cd = finalEnraged() ? rand(0.3, 0.7) : f.phase === 2 ? rand(0.5, 1.0) : rand(0.6, 1.2); }
  };
  switch (s.k) {
    case 'swing':
      if (t < s.wind) { f.face = turn(f.face, ang, 2.6 * dt); if (cross(s.wind * 0.3)) { addPart(f.x + Math.cos(f.face) * 40, f.y + Math.sin(f.face) * 40 - 20, 0, 0, 0.4, 16, '#fff6d8', 'glint'); SFX.glint(); } }
      else if (t < s.wind + s.act) {
        if (cross(s.wind)) { f.vx += Math.cos(f.face) * s.lunge; f.vy += Math.sin(f.face) * s.lunge; SFX.heavy(); }
        if (!A.hit && inArc(f.x, f.y, f.face, s.range, s.arc, P.x, P.y, P.r) && hurtPlayer(s.dmg, f.x, f.y, true, f)) A.hit = true;
      } else if (t >= s.wind + s.act + s.rec) done();
      break;
    case 'slam':
      if (t < s.wind) f.face = turn(f.face, ang, 2.5 * dt);
      else {
        if (!A.flag) {
          A.flag = 1;
          const hx = f.x + Math.cos(f.face) * s.off, hy = f.y + Math.sin(f.face) * s.off;
          aoeBlast(hx, hy, s.r, s.dmg); if (s.ring) addRing(hx, hy, ...s.ring);
          SFX.boom(); shake(12); burst(hx, hy, 40, '#f3cf6e', 240, 4, 'dot', 0.8);
        }
        if (t >= s.wind + s.rec) done();
      }
      break;
    case 'leap':
      if (t < s.wind) f.face = turn(f.face, ang, 3 * dt);
      else if (t < s.wind + s.air) {
        if (!A.flag) { A.flag = 1; A.sx = f.x; A.sy = f.y; A.tx = P.x + P.mvx * 0.35; A.ty = P.y + P.mvy * 0.35; addMark(A.tx, A.ty, s.r, s.air); SFX.wing(); }
        const k = (t - s.wind) / s.air, ez = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        f.x = lerp(A.sx, A.tx, ez); f.y = lerp(A.sy, A.ty, ez); f.z = Math.sin(k * Math.PI) * s.h;
      } else {
        if (A.flag === 1) {
          A.flag = 2; f.z = 0;
          aoeBlast(f.x, f.y, s.r, s.dmg); addRing(f.x, f.y, s.r, s.r + 180, 0.5, 30);
          SFX.boom(); shake(15); burst(f.x, f.y, 50, '#f3cf6e', 260, 5, 'dot', 0.9);
        }
        if (t >= s.wind + s.air + s.rec) done();
      }
      break;
    case 'pillars':
      if (t < s.wind) { f.face = turn(f.face, ang, 3 * dt); f.charge = t / s.wind; }
      else {
        if (!A.flag) {
          A.flag = 1; f.charge = 0;
          const a = Math.atan2(P.y - f.y, P.x - f.x);
          for (let i = 0; i < s.n; i++) addDelayed(f.x + Math.cos(a) * (80 + i * 75), f.y + Math.sin(a) * (80 + i * 75), 55, 0.55 + i * 0.12, 46);
          SFX.spell();
        }
        if (t >= s.wind + s.rec) done();
      }
      break;
    case 'blink': {
      burst(f.x, f.y, 24, '#ffe39a', 160, 3, 'dot', 0.5);
      for (let k = 0; k < 6; k++) {
        const a = P.face + Math.PI + rand(-0.6, 0.6), rr = f.r + P.r + 30, nx = P.x + Math.cos(a) * rr, ny = P.y + Math.sin(a) * rr;
        if (dist(nx, ny, RC.x, RC.y) < RC.r - f.r) { f.x = nx; f.y = ny; break; }
      }
      f.face = Math.atan2(P.y - f.y, P.x - f.x);
      burst(f.x, f.y, 24, '#ffe39a', 160, 3, 'dot', 0.5); SFX.glint();
      done();
      break;
    }
    case 'rings':
      if (t < s.wind) f.charge = t / s.wind;
      else {
        if (!A.flag) {
          A.flag = 1; f.charge = 0;
          for (let i = 0; i < s.n; i++) later(i * 0.45, () => { if (fb && !fb.dead && G.finalFight) { addRing(fb.x, fb.y, 30, 470, 0.9, 34); SFX.glint(); } });
        }
        if (t >= s.wind + s.rec) done();
      }
      break;
    case 'horbs':
      if (t < s.wind) { f.face = turn(f.face, ang, 3 * dt); f.charge = t / s.wind; }
      else {
        if (!A.flag) {
          A.flag = 1; f.charge = 0;
          const h = finalHead(f);
          for (let i = 0; i < s.n; i++) {
            const a = f.face + (i - (s.n - 1) / 2) * 0.5;
            projs.push({ x: h.x, y: h.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, r: 10, dmg: 30, kind: 'horb', friendly: false, life: 4.5, homing: 1.7 });
          }
          SFX.spell();
        }
        if (t >= s.wind + s.rec) done();
      }
      break;
    case 'beam':
      if (t < s.wind) { f.face = turn(f.face, ang, 2.5 * dt); f.charge = t / s.wind; break; }
      if (t < s.wind + s.dur) {
        if (cross(s.wind)) SFX.fire(s.dur);
        f.charge = 0; f.beaming = true;
        const k = (t - s.wind) / s.dur;
        f.beamDir = f.face + lerp(-s.sweep, s.sweep, k) * A.dir;
        const h = finalHead(f);
        A.acc += dt;
        if (A.acc >= 0.12) {
          A.acc -= 0.12;
          const pd = dist(h.x, h.y, P.x, P.y), pa = Math.atan2(P.y - h.y, P.x - h.x);
          if (pd < s.range && Math.abs(angDiff(f.beamDir, pa)) < s.cone / 2 + Math.atan2(P.r, Math.max(pd, 1))) hurtPlayer(15, h.x, h.y, false, f, 'fire');
        }
        if (Math.random() < 0.8) { const dd = rand(40, s.range); addPart(h.x + Math.cos(f.beamDir) * dd, h.y + Math.sin(f.beamDir) * dd, rand(-30, 30), rand(-30, 30), 0.4, rand(3, 6), '#fff1c2', 'fire'); }
      } else { f.beaming = false; if (t >= s.wind + s.dur + s.rec) done(); }
      break;
    case 'stars':
      if (t < s.wind) f.charge = t / s.wind;
      else {
        if (!A.flag) {
          A.flag = 1; f.charge = 0;
          addDelayed(P.x + P.mvx * 0.3, P.y + P.mvy * 0.3, 62, 0.9, 42);
          for (let i = 1; i < s.n; i++) { const a = rand(0, TAU), rr = Math.sqrt(Math.random()) * (RC.r - 50); addDelayed(RC.x + Math.cos(a) * rr, RC.y + Math.sin(a) * rr, 62, 0.9 + rand(0, 0.5), 42); }
          SFX.spell();
        }
        if (t >= s.wind + s.rec) done();
      }
      break;
  }
}
function updateFinal(dt) {
  const f = fb;
  if (!f) return;
  f.anim += dt;
  if (f.hurtFlash > 0) f.hurtFlash -= dt;
  f.lastHit += dt;
  if (f.invuln > 0) f.invuln -= dt;
  if (f.ghost > f.hp) { if (f.lastHit > 0.7) f.ghost = Math.max(f.hp, f.ghost - f.maxHp * 0.35 * dt); } else f.ghost = f.hp;
  if (f.dead) { f.t += dt; return; }
  f.t += dt; f.cd -= dt;
  if (f.lastHit > 3) f.poiseAcc = Math.max(0, f.poiseAcc - dt * 50);
  if (f.bleed && f.lastHit > 2) f.bleed = Math.max(0, f.bleed - 12 * dt);
  if (f.vx || f.vy) { f.x += f.vx * dt; f.y += f.vy * dt; const k = Math.exp(-8 * dt); f.vx *= k; f.vy *= k; if (Math.abs(f.vx) < 1) f.vx = 0; if (Math.abs(f.vy) < 1) f.vy = 0; }
  const d = dist(f.x, f.y, P.x, P.y), ang = Math.atan2(P.y - f.y, P.x - f.x);
  switch (f.state) {
    case 'intro': f.face = turn(f.face, ang, 2 * dt); if (f.t > 2.4) { f.state = 'chase'; f.t = 0; f.cd = 0.4; } break;
    case 'chase':
      if (f.phase === 1) {
        f.face = turn(f.face, ang, 5 * dt);
        if (d > 100) { f.x += Math.cos(ang) * 115 * dt; f.y += Math.sin(ang) * 115 * dt; }
        else { const a = ang + Math.PI / 2; f.x += Math.cos(a) * 40 * dt; f.y += Math.sin(a) * 40 * dt; }
      } else {
        f.face = turn(f.face, ang, 3 * dt); f.z = 12 + Math.sin(f.anim * 2) * 4;
        const mv = d > 290 ? 1 : d < 150 ? -1 : 0, a = mv ? ang + (mv < 0 ? Math.PI : 0) : ang + Math.PI / 2;
        const sp = mv ? 85 : 45; f.x += Math.cos(a) * sp * dt; f.y += Math.sin(a) * sp * dt;
      }
      if (f.cd <= 0 && P.state !== 'dead') finalChoose(d);
      break;
    case 'atk': finalAtk(dt, ang); break;
    case 'transform':
      f.z = 0;
      if (Math.random() < dt * 60) { const a = rand(0, TAU), rr = rand(150, 320); addPart(f.x + Math.cos(a) * rr, f.y + Math.sin(a) * rr, -Math.cos(a) * rr / 0.8, -Math.sin(a) * rr / 0.8, 0.8, rand(2, 4), '#ffe39a', 'mote'); }
      if (!f.fx && f.t > 1.8) {
        f.fx = true; SFX.roar(); shake(18); G.white = 0.85;
        burst(f.x, f.y, 90, '#fff1c2', 320, 5, 'dot', 1.4);
        const hp = Math.round(2400 * lvHp());
        Object.assign(f, { phase: 2, name: 'Thú Vàng, Hiện Thân Vòng Vàng', r: 44, hp, maxHp: hp, ghost: hp, poise: 330, poiseAcc: 0, noParry: true, bleed: 0, bleedMax: 320 });
        subtitle('“Vòng Vàng tự phán xét kẻ nhạt phai.”', 4);
      }
      if (f.t > 3.8) { f.state = 'chase'; f.t = 0; f.cd = 0.8; f.invuln = 0; }
      break;
    case 'stagger': if (f.t > f.stagDur) { f.state = 'chase'; f.t = 0; f.cd = 0.3; } break;
    case 'broken': f.z = 0; if (f.t > 2.6) { f.state = 'chase'; f.t = 0; f.cd = 0.2; f.poiseAcc = 0; } break;
  }
  if (f.state !== 'atk') { f.beaming = false; f.charge = 0; }
  const dx = f.x - RC.x, dy = f.y - RC.y, dr = Math.hypot(dx, dy), m = RC.r - f.r;
  if (dr > m) { f.x = RC.x + dx / dr * m; f.y = RC.y + dy / dr * m; }
  if (f.z < 30 && P.state !== 'dead' && f.state !== 'transform') {
    const px = P.x - f.x, py = P.y - f.y, rr = f.r + P.r, d2 = px * px + py * py;
    if (d2 < rr * rr && d2 > 1e-6) { const l = Math.sqrt(d2); P.x = f.x + px / l * rr; P.y = f.y + py / l * rr; collide(P, false); }
  }
}
function enterRealm() {
  if (S.discovered.includes(8)) S.lastGrace = 8;
  P.x = RC.x; P.y = RC.y + 260; P.vx = P.vy = 0; P.mounted = false; P.lock = null; P.state = 'idle'; P.atk = null;
  fb = makeFinal(); G.finalFight = true; projs.length = 0; aoes.length = 0;
  cam.x = P.x; cam.y = P.y; clampCam(); G.white = 1;
  SFX.grace(); save();
  later(1.0, () => subtitle('“Kẻ nhạt phai... ngươi đã tới được Cây Vàng. Nhưng ngai vàng này không dành cho ngươi.”', 5));
}
function finalTransform() {
  const f = fb;
  f.hp = 0; f.state = 'transform'; f.t = 0; f.fx = false; f.invuln = 4; f.atk = null; f.beaming = false; f.z = 0;
  P.lock = null; SFX.felled();
  subtitle('“Ngươi... đã vượt qua ta. Nhưng Vòng Vàng vẫn còn đó.”', 3.5);
}
function finalDefeated() {
  S.finalDead = true; G.finalFight = false;
  gainRunes(8000, fb.x, fb.y);
  banner('felled', 'VÒNG VÀNG ĐÃ ĐƯỢC HÀN GẮN', '', 5); SFX.felled(); G.white = 1;
  burst(fb.x, fb.y, 120, '#fff1c2', 360, 5, 'dot', 2);
  save();
  later(5.2, () => {
    if (P.state === 'dead') return;
    P.x = TREE_POS.x; P.y = TREE_POS.y + 140; P.vx = P.vy = 0; fb = null; G.region = null;
    cam.x = P.x; cam.y = P.y; clampCam(); G.fade = 1;
  });
}

// ───────────────────────── đạn và vùng sát thương ─────────────────────────
function updateProjs(dt) {
  for (let i = projs.length - 1; i >= 0; i--) {
    const q = projs[i];
    q.life -= dt;
    if (q.homing) {
      const a = Math.atan2(q.vy, q.vx), na = turn(a, Math.atan2(P.y - q.y, P.x - q.x), q.homing * dt), sp = Math.hypot(q.vx, q.vy);
      q.vx = Math.cos(na) * sp; q.vy = Math.sin(na) * sp;
    }
    if (q.friendly && P.lock && !P.lock.dead) {
      const a = Math.atan2(q.vy, q.vx), want = Math.atan2(P.lock.y - q.y, P.lock.x - q.x), na = turn(a, want, 2.6 * dt), sp = Math.hypot(q.vx, q.vy);
      q.vx = Math.cos(na) * sp; q.vy = Math.sin(na) * sp;
    }
    q.x += q.vx * dt; q.y += q.vy * dt;
    if (Math.random() < 0.8) addPart(q.x, q.y, rand(-10, 10), rand(-10, 10), 0.3, q.kind === 'dagger' ? 2 : 3, q.kind === 'glint' ? '#bcd6ff' : q.kind === 'orb' ? '#8fb0ff' : q.kind === 'fireball' ? '#ff8a3a' : '#f3cf6e');
    if (q.kind === 'gwave' && Math.random() < 0.6) addPart(q.x, q.y, rand(-20, 20), rand(-20, 20), 0.4, 3, '#ffe39a', 'mote');
    if (q.kind === 'fireball') {
      if (q.life <= 0 || dist(q.x, q.y, P.x, P.y) < q.r + P.r) {
        aoeBlast(q.x, q.y, q.boom, q.dmg, 'fire'); noise(0.3, 0.3, 300, 0.7); shake(5);
        burst(q.x, q.y, 24, '#ff9a4a', 200, 4, 'dot', 0.6); projs.splice(i, 1);
      }
      continue;
    }
    let dead = q.life <= 0 || pointBlocked(q.x, q.y);
    if (!dead && q.friendly) {
      for (const e of targets()) {
        if ((e.z || 0) > 30) continue;
        if (dist(q.x, q.y, e.x, e.y) < q.r + e.r) { hitEnemy(e, q.dmg, 18, q.x - q.vx * 0.05, q.y - q.vy * 0.05, 'spell'); dead = true; break; }
      }
    } else if (!dead && dist(q.x, q.y, P.x, P.y) < q.r + P.r) {
      if (hurtPlayer(q.dmg, q.x - q.vx * 0.05, q.y - q.vy * 0.05, false, null, 'proj')) dead = true;
    }
    if (dead) {
      if (q.puddle) puddles.push({ x: q.x, y: q.y, r: 42, t: 0, life: 6 });
      burst(q.x, q.y, 8, q.kind === 'dagger' ? '#f3cf6e' : q.kind === 'spit' ? '#9fd05a' : '#bcd6ff', 90, 2.5, 'dot', 0.35); projs.splice(i, 1);
    }
  }
}
function updateAoes(dt) {
  for (let i = aoes.length - 1; i >= 0; i--) {
    const a = aoes[i];
    a.t += dt;
    if (a.kind === 'ring') {
      const cur = lerp(a.r0, a.r1, a.t / a.dur);
      if (!a.hit && Math.abs(dist(a.x, a.y, P.x, P.y) - cur) < 16 + P.r && hurtPlayer(a.dmg, a.x, a.y, false, null, 'aoe')) a.hit = true;
      if (a.t >= a.dur) aoes.splice(i, 1);
    } else if (a.kind === 'delayed') {
      if (a.t >= a.delay) {
        aoeBlast(a.x, a.y, a.r, a.dmg); noise(0.25, 0.2, 400, 0.8); shake(4);
        for (let k = 0; k < 10; k++) addPart(a.x + rand(-a.r * 0.6, a.r * 0.6), a.y + rand(-a.r * 0.6, a.r * 0.6), 0, rand(-120, -60), 0.5, rand(2, 4), '#ffe39a', 'mote');
        aoes.splice(i, 1);
      }
    } else if (a.t >= (a.dur || 0)) aoes.splice(i, 1);
  }
}
function updatePuddles(dt) { for (let i = puddles.length - 1; i >= 0; i--) { puddles[i].t += dt; if (puddles[i].t > puddles[i].life) puddles.splice(i, 1); } }
function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.kind === 'spark' || p.kind === 'dot') { const f = Math.exp(-4 * dt); p.vx *= f; p.vy *= f; }
    else if (p.kind === 'fire') { const f = Math.exp(-1 * dt); p.vx *= f; p.vy *= f; }
    if (p.kind === 'mote') p.vx += Math.sin((p.life + p.x) * 3) * 6 * dt;
  }
}

// ───────────────────────── tương tác thế giới ─────────────────────────
const nearGrace = () => GRACES.find(g => S.discovered.includes(g.id) && dist(P.x, P.y, g.x, g.y) < 70);
const nearItem = () => ITEMS.find(it => !S.taken.includes(it.id) && dist(P.x, P.y, it.x, it.y) < 46);
const nearChest = () => CHESTS.find(c => !S.chests.includes(c.id) && (!c.req || c.req()) && dist(P.x, P.y, c.x, c.y) < 52);
const nearBrazier = () => !S.fortOpen && BRAZIERS.find(b => !G.braziers.includes(b.id) && dist(P.x, P.y, b.x, b.y) < 50);
const nearStatue = () => STATUES.find(st => !S.statues.includes(st.id) && dist(P.x, P.y, st.x, st.y) < 55);
const nearFlag = () => !S.coloDone && !G.colo.active && dist(P.x, P.y, FLAG.x, FLAG.y) < 50;
const nearNote = () => NOTES.find(n => dist(P.x, P.y, n.x, n.y) < 46);
function interact() {
  const g = nearGrace();
  if (g) { restAtGrace(g); return; }
  const c = nearChest();
  if (c) { openChest(c); return; }
  const b = nearBrazier();
  if (b) { lightBrazier(b); return; }
  const st = nearStatue();
  if (st) { wakeStatue(st); return; }
  if (nearFlag()) { startColo(); return; }
  const it = nearItem();
  if (it) { takeItem(it); return; }
  const n = nearNote();
  if (n) { subtitle('“' + n.text + '”', 5.5); SFX.glint(); }
}
function lightBrazier(b) {
  G.braziers.push(b.id); SFX.fire(0.5);
  burst(b.x, b.y - 8, 20, '#ffb347', 120, 4, 'fire', 0.6);
  const ok = G.braziers.every((id, i) => id === BRAZIER_ORDER[i]);
  if (!ok) {
    G.braziers = [];
    later(0.5, () => {
      toast('Sai thứ tự... mọi ngọn lửa tắt ngấm.');
      for (const q of BRAZIERS) burst(q.x, q.y - 8, 14, 'rgba(90,85,80,.7)', 80, 5, 'dot', 0.8);
      aoeBlast(b.x, b.y, 55, 12, 'fire');
    });
    return;
  }
  if (G.braziers.length === BRAZIER_ORDER.length) {
    S.fortOpen = true; shake(8); SFX.felled(); save();
    banner('grace', 'CÁNH CỔNG ĐÃ MỞ', 'Pháo Đài Đá Xám');
    burst(3600, 1286, 50, 'rgba(120,110,95,.7)', 200, 6, 'dot', 1);
  }
}
function wakeStatue(st) {
  S.statues.push(st.id); SFX.grace();
  burst(st.x, st.y - 10, 30, '#9fe8e0', 120, 3, 'mote', 1.2);
  toast('Tượng đá đã thức tỉnh (' + S.statues.length + '/4)');
  if (S.statues.length === STATUES.length) {
    S.glade = true;
    banner('grace', 'KẾT GIỚI ĐÃ TAN', 'Rừng Linh Hồn');
    for (let k = 0; k < 60; k++) { const a = Math.random() * TAU; addPart(BARRIER.x + Math.cos(a) * BARRIER.r, BARRIER.y + Math.sin(a) * BARRIER.r, 0, rand(-60, -20), rand(0.8, 1.6), rand(2, 4), '#bff5ee', 'mote'); }
    if (!S.mb.wraith) later(1.6, () => {
      enemies.push(makeEnemy('wraith', BARRIER.x, BARRIER.y));
      subtitle('“Ai dám phá giấc ngủ của rừng thiêng...?”'); SFX.roar();
    });
  }
  save();
}
const WAVES = [[['soldier', 3], ['archer', 1]], [['shield', 2], ['bomber', 1], ['ghost', 2]], [['troll', 1], ['archer', 2]]];
function spawnWave(n) {
  const list = [];
  for (const [t, c] of WAVES[n - 1]) for (let i = 0; i < c; i++) list.push(t);
  list.forEach((t, i) => {
    const a = i / list.length * TAU + rand(-0.2, 0.2);
    const e = makeEnemy(t, COLO.x + Math.cos(a) * 200, COLO.y + Math.sin(a) * 160);
    e.challenge = true; e.state = 'chase'; e.hx = COLO.x; e.hy = COLO.y;
    enemies.push(e); burst(e.x, e.y, 20, 'rgba(120,100,80,.7)', 120, 5, 'dot', 0.7);
  });
  banner('grace', 'ĐỢT ' + n + ' / ' + WAVES.length, 'Đấu Trường Thử Thách', 2.4);
}
function startColo() {
  G.colo.active = true; G.colo.wave = 1; G.colo.cool = 0;
  if (P.mounted) P.mounted = false;
  SFX.roar(); shake(6); spawnWave(1);
}
function updateColo(dt) {
  if (!G.colo.active || enemies.some(e => e.challenge && !e.dead)) return;
  G.colo.cool += dt;
  if (G.colo.cool < 2.2) return;
  G.colo.cool = 0;
  if (G.colo.wave < WAVES.length) { G.colo.wave++; spawnWave(G.colo.wave); return; }
  G.colo.active = false; S.coloDone = true; save();
  banner('felled', 'THỬ THÁCH HOÀN THÀNH', '', 4); SFX.felled();
  burst(COLO.x, COLO.y + 100, 40, '#f3cf6e', 200, 4, 'mote', 1.4);
}
function openChest(c) {
  S.chests.push(c.id); c.openAt = G.clock;
  noise(0.5, 0.2, 400, 0.8); SFX.pickup();
  burst(c.x, c.y - 6, 24, '#ffe7a3', 110, 3, 'mote', 1.1);
  const L = c.loot, got = [];
  let wpn = null;
  if (L.weapon) {
    if (S.weapons.includes(L.weapon)) got.push('+400 rune'), gainRunes(400, c.x, c.y);
    else { S.weapons.push(L.weapon); wpn = WEAPONS[L.weapon]; }
  }
  if (L.runes) { gainRunes(L.runes, c.x, c.y); got.push('+' + L.runes + ' rune'); }
  if (L.stone) { S.weaponLv += L.stone; got.push('Đá Rèn Kiếm (vũ khí +' + S.weaponLv + ')'); }
  if (L.seed) {
    if (S.flaskMax < FLASK_CAP) { S.flaskMax++; P.flasks++; got.push('Hạt Vàng (Bình Máu ' + S.flaskMax + ')'); }
    else { gainRunes(300, c.x, c.y); got.push('+300 rune (Bình Máu đã tối đa)'); }
  }
  if (wpn) banner('item', wpn.name, wpn.desc + (G.touch ? ' · bấm Vũ khí để đổi' : ' · ← → để đổi vũ khí'), 4.2);
  else banner('item', 'Rương báu', got.join(' · '), 3.6);
  save();
}
function takeItem(it) {
  S.taken.push(it.id); SFX.pickup();
  burst(it.x, it.y, 20, '#fff1c2', 90, 3, 'dot', 0.7);
  if (it.kind === 'seed') {
    if (S.flaskMax < FLASK_CAP) { S.flaskMax++; P.flasks++; banner('item', 'Hạt Vàng', 'Số lần dùng Bình Máu tăng lên ' + S.flaskMax); }
    else { gainRunes(300, it.x, it.y); banner('item', 'Hạt Vàng', 'Bình Máu đã tối đa (' + FLASK_CAP + ') · đổi thành 300 rune'); }
  }
  else if (it.kind === 'stone') { S.weaponLv++; banner('item', 'Đá Rèn Kiếm', 'Vũ khí được cường hóa lên +' + S.weaponLv); }
  else {
    if (!S.weapons.includes(it.w)) S.weapons.push(it.w);
    const Wp = WEAPONS[it.w];
    banner('item', Wp.name, Wp.desc + (G.touch ? ' · bấm Vũ khí để đổi' : ' · ← → để đổi vũ khí'), 4.2);
  }
  save();
}
function restAtGrace(g) {
  S.lastGrace = g.id; P.mounted = false; P.lock = null; P.state = 'idle'; P.atk = null;
  applyStats(true); spawnEnemies(); save(); SFX.grace();
  burst(g.x, g.y, 30, '#f3d27a', 80, 3, 'mote', 1.4);
  openGrace(g);
}
function worldChecks(dt) {
  if (P.state === 'dead') return;
  for (const g of GRACES) {
    if (!S.discovered.includes(g.id) && dist(P.x, P.y, g.x, g.y) < 140) {
      S.discovered.push(g.id); banner('grace', 'ĐÃ TÌM THẤY ÂN ĐIỂN', g.name); SFX.grace(); save();
    }
  }
  const key = G.touch ? '' : 'E';
  if (nearGrace()) G.prompt = { key, text: 'Nghỉ ngơi tại Ân Điển' };
  else if (nearChest()) G.prompt = { key, text: 'Mở rương' };
  else if (nearBrazier()) G.prompt = { key, text: 'Thắp lửa' };
  else if (nearStatue()) G.prompt = { key, text: 'Đánh thức tượng đá' };
  else if (nearFlag()) G.prompt = { key, text: 'Bắt đầu thử thách' };
  else if (nearItem()) G.prompt = { key, text: 'Nhặt vật phẩm' };
  else if (nearNote()) G.prompt = { key, text: 'Đọc lời nhắn' };
  else G.prompt = null;
  if (S.lost && dist(P.x, P.y, S.lost.x, S.lost.y) < 40) {
    gainRunes(S.lost.amount, S.lost.x, S.lost.y); SFX.pickup(); toast('Đã thu hồi ' + S.lost.amount.toLocaleString('vi-VN') + ' rune');
    S.lost = null; save();
  }
  if (boss && !S.bossDead && !G.bossFight && inArena(P.x, P.y) && P.y < ARENA.y + ARENA.h - 16) startBossFight();
  if (S.bossDead && !S.finalDead && !G.finalFight && dist(P.x, P.y, TREE_POS.x, TREE_POS.y) < 150) enterRealm();
  if (S.finalDead && dist(P.x, P.y, TREE_POS.x, TREE_POS.y) < 150 && !G.endingShown) { G.endingShown = true; S.treeReached = true; save(); later(0.6, openEnding); }
  const reg = REGIONS.find(r => r.test(P.x, P.y)).name;
  if (reg !== G.region) { G.region = reg; G.regionT = 0; }
}

// ───────────────────────── vòng lặp chính ─────────────────────────
function updateCam(dt) {
  let tx = P.x, ty = P.y;
  if (P.lock) { tx = lerp(P.x, P.lock.x, 0.3); ty = lerp(P.y, P.lock.y, 0.3); }
  else if (G.bossFight && boss) { tx = lerp(P.x, boss.x, 0.18); ty = lerp(P.y, boss.y, 0.18); }
  else if (G.finalFight && fb && !fb.dead) { tx = lerp(P.x, fb.x, 0.15); ty = lerp(P.y, fb.y, 0.15); }
  else if (G.dragonFight && dragon && !dragon.dead) { tx = lerp(P.x, dragon.x, 0.15); ty = lerp(P.y, dragon.y, 0.15); }
  const k = 1 - Math.exp(-6 * dt);
  cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
  clampCam();
}
function clampCam() {
  const hw = CW / ZOOM / 2, hh = CH / ZOOM / 2, maxW = P.x > MAPW && G.mode !== 'title' ? W : MAPW;
  cam.x = maxW > hw * 2 ? clamp(cam.x, hw, maxW - hw) : maxW / 2;
  cam.y = H > hh * 2 ? clamp(cam.y, hh, H - hh) : H / 2;
}
function ambient(dt) {
  const vw = CW / ZOOM, vh = CH / ZOOM, x0 = cam.x - vw / 2, y0 = cam.y - vh / 2;
  const motes = cam.y < 700 ? 22 : 7;
  for (const [px, py, rx, ry] of POOLS) {
    if (Math.abs(px - cam.x) > vw / 2 + rx || Math.abs(py - cam.y) > vh / 2 + ry || Math.random() > dt * 3) continue;
    const a = rand(0, TAU), k = Math.sqrt(Math.random());
    addPart(px + Math.cos(a) * rx * k, py + Math.sin(a) * ry * k, 0, -8, 0.9, rand(2, 4), 'rgba(190,150,205,.8)');
  }
  if (Math.random() < dt * motes) addPart(x0 + Math.random() * vw, y0 + Math.random() * vh, rand(-6, 6), rand(-16, -5), rand(3, 6), rand(1, 2.2), '#f3d27a', 'mote');
  for (const g of GRACES) if (Math.abs(g.x - cam.x) < vw && Math.abs(g.y - cam.y) < vh && Math.random() < dt * (S.discovered.includes(g.id) ? 8 : 3)) addPart(g.x + rand(-8, 8), g.y + rand(-4, 4), rand(-5, 5), rand(-40, -20), rand(0.8, 1.6), rand(1.2, 2.2), '#ffe7a3', 'mote');
}
function update(dt) {
  G.clock += dt; S.time += dt;
  mouse.wx = cam.x + (mouse.x - CW / 2) / ZOOM; mouse.wy = cam.y + (mouse.y - CH / 2) / ZOOM;
  updatePlayer(dt); updateEnemies(dt); updateBoss(dt); updateDragon(dt); updateFinal(dt); updateProjs(dt); updateAoes(dt); updatePuddles(dt); updateColo(dt); updateParts(dt);
  updateCam(dt); worldChecks(dt); ambient(dt);
  for (let i = G.timers.length - 1; i >= 0; i--) { const tm = G.timers[i]; tm.t -= dt; if (tm.t <= 0) { G.timers.splice(i, 1); tm.fn(); } }
  if (G.mode === 'dead') { G.deathT += dt; if (G.deathT > 4.6) { G.mode = 'play'; respawnAt(S.lastGrace); } }
}
function tick(dt) {
  G.shake = Math.max(0, G.shake - dt * 30);
  G.flash = Math.max(0, G.flash - dt * 1.6);
  G.white = Math.max(0, G.white - dt * 0.7);
  G.fpWarn = Math.max(0, (G.fpWarn || 0) - dt);
  G.fade = Math.max(0, G.fade - dt * 1.4);
  if (G.banner) { G.banner.t += dt; if (G.banner.t > G.banner.dur) G.banner = null; }
  if (G.sub) { G.sub.t += dt; if (G.sub.t > G.sub.dur) G.sub = null; }
  if (G.toast) { G.toast.t += dt; if (G.toast.t > 2.4) G.toast = null; }
  G.regionT += dt; G.hintT += dt;
  if (G.runeGainT > 0) { G.runeGainT -= dt; if (G.runeGainT <= 0) G.runeGain = 0; }
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  pollPad();
  if (G.mode === 'play' || G.mode === 'dead') {
    if (G.hitStop > 0) G.hitStop -= dt; else update(dt);
    tick(dt);
  } else if (G.mode === 'title') {
    G.clock += dt;
    cam.x = 1400 + Math.sin(G.clock * 0.07) * 140; cam.y = 3050 + Math.cos(G.clock * 0.05) * 90;
    clampCam();
    updateParts(dt); ambient(dt);
  }
  render();
  requestAnimationFrame(frame);
}

// ───────────────────────── vẽ ─────────────────────────
let VIEW = { x0: 0, y0: 0, x1: 0, y1: 0 };
const inView = (x, y, m) => x > VIEW.x0 - m && x < VIEW.x1 + m && y > VIEW.y0 - m && y < VIEW.y1 + m;
function shadow(x, y, rx, ry, a = 0.35) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); }
function weaponAngle(phase, k, swing) {
  const e = 1 - Math.pow(1 - clamp(k, 0, 1), 2);
  if (phase === 'wind') return lerp(0.6, 1.8 * swing, e);
  if (phase === 'act') return lerp(1.8 * swing, -1.3 * swing, clamp(k, 0, 1));
  if (phase === 'rec') return lerp(-1.3 * swing, 0.6, e);
  return 0.6;
}
function drawWeapon(L, s, wAng, o) {
  ctx.save(); ctx.translate(3 * s + (o.thrust || 0) * 14 * s, 8 * s); ctx.rotate(wAng);
  const len = L.wlen * s;
  if (o.hammer !== undefined) {
    const g = o.hammer;
    ctx.strokeStyle = '#6b5a3e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(70, 0); ctx.stroke();
    ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 20 + g * 30;
    ctx.fillStyle = `rgba(245,${200 + g * 40},${110 + g * 60},.95)`; ctx.fillRect(62, -22, 26, 44);
    ctx.shadowBlur = 0;
  } else if (L.weapon === 'staff') {
    ctx.strokeStyle = L.wcol; ctx.lineWidth = 2.6 * s; ctx.beginPath(); ctx.moveTo(-6 * s, 0); ctx.lineTo(len, 0); ctx.stroke();
    const c = o.charge || 0;
    ctx.fillStyle = L.orb; ctx.shadowColor = L.orb; ctx.shadowBlur = 8 + c * 16;
    ctx.beginPath(); ctx.arc(len, 0, (3 + c * 4) * s, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  } else if (L.weapon === 'spear') {
    ctx.strokeStyle = '#6b5a3e'; ctx.lineWidth = 2.6 * s; ctx.beginPath(); ctx.moveTo(-12 * s, 0); ctx.lineTo(len - 8 * s, 0); ctx.stroke();
    ctx.fillStyle = L.wcol; ctx.beginPath(); ctx.moveTo(len + 5 * s, 0); ctx.lineTo(len - 9 * s, -3.2 * s); ctx.lineTo(len - 9 * s, 3.2 * s); ctx.closePath(); ctx.fill();
  } else if (L.weapon === 'bow') {
    const c = o.charge || 0;
    ctx.strokeStyle = L.wcol; ctx.lineWidth = 2.4 * s; ctx.beginPath(); ctx.arc(6 * s, 0, 13 * s, -1.25, 1.25); ctx.stroke();
    const ex = 6 * s + Math.cos(1.25) * 13 * s, ey = Math.sin(1.25) * 13 * s, px = ex - 3 * s - c * 10 * s;
    ctx.strokeStyle = 'rgba(230,225,210,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ex, -ey); ctx.lineTo(px, 0); ctx.lineTo(ex, ey); ctx.stroke();
    if (c > 0) { ctx.strokeStyle = '#d8d2c0'; ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px + 26 * s, 0); ctx.stroke(); }
  } else if (L.weapon === 'club') {
    ctx.strokeStyle = '#4a3a28'; ctx.lineWidth = 3.2 * s; ctx.beginPath(); ctx.moveTo(-4 * s, 0); ctx.lineTo(len - 6 * s, 0); ctx.stroke();
    ctx.fillStyle = L.wcol; ctx.strokeStyle = 'rgba(10,8,6,.7)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(len - 4 * s, 0, 8 * s, 6.5 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
  } else if (L.weapon === 'scythe') {
    ctx.strokeStyle = '#3a3a4a'; ctx.lineWidth = 2.6 * s; ctx.beginPath(); ctx.moveTo(-8 * s, 0); ctx.lineTo(len, 0); ctx.stroke();
    ctx.strokeStyle = L.wcol; ctx.lineWidth = 2.4 * s; ctx.shadowColor = L.wcol; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(len, 0); ctx.quadraticCurveTo(len - 4 * s, -16 * s, len - 22 * s, -18 * s); ctx.stroke(); ctx.shadowBlur = 0;
  } else if (L.weapon === 'katana') {
    ctx.strokeStyle = L.wcol; ctx.lineWidth = 2.2 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(4 * s, 0); ctx.quadraticCurveTo(len * 0.6, -2.5 * s, len, -5 * s); ctx.stroke();
    ctx.strokeStyle = '#2b2622'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(-5 * s, 0); ctx.lineTo(2.5 * s, 0); ctx.stroke();
    ctx.fillStyle = '#b08d4c'; ctx.beginPath(); ctx.arc(3.5 * s, 0, 2.2 * s, 0, TAU); ctx.fill(); ctx.lineCap = 'butt';
  } else {
    const wide = L.weapon === 'greatsword' ? 5 : 3;
    if (L.glow) { ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 12; }
    ctx.strokeStyle = L.wcol; ctx.lineWidth = wide * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(3 * s, 0); ctx.lineTo(len, 0); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(5 * s, -wide * s * 0.2); ctx.lineTo(len - 2 * s, -wide * s * 0.2); ctx.stroke();
    ctx.strokeStyle = '#6b5a3e'; ctx.lineWidth = 2.6 * s; ctx.beginPath(); ctx.moveTo(4 * s, -5 * s); ctx.lineTo(4 * s, 5 * s); ctx.stroke();
    ctx.lineCap = 'butt';
  }
  ctx.restore();
}
function drawHumanoid(x, y, face, L, wAng, o = {}) {
  const s = L.scale || 1, z = o.z || 0;
  shadow(x, y + 4 * s, 13 * s * (1 - z / 200), 8 * s * (1 - z / 200), 0.35);
  ctx.save(); ctx.translate(x, y - z);
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  if (o.aura) {
    const gr = ctx.createRadialGradient(0, 0, 4, 0, 0, 34 * s);
    gr.addColorStop(0, 'rgba(255,214,110,.35)'); gr.addColorStop(1, 'rgba(255,214,110,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 34 * s, 0, TAU); ctx.fill();
  }
  ctx.rotate(face);
  if (o.kneel) ctx.scale(0.86, 1.04);
  const wave = Math.sin((o.anim || 0) * 6) * 2 * s;
  ctx.fillStyle = L.cloak;
  ctx.beginPath(); ctx.moveTo(-1 * s, -10 * s);
  ctx.quadraticCurveTo(-16 * s, -12 * s + wave, -22 * s, -4 * s + wave); ctx.lineTo(-18 * s, 0); ctx.lineTo(-23 * s, 5 * s - wave);
  ctx.quadraticCurveTo(-15 * s, 12 * s - wave, -1 * s, 10 * s); ctx.closePath(); ctx.fill();
  if (o.trail) {
    const R = (L.wlen + 4) * s;
    ctx.strokeStyle = o.trailCol || 'rgba(255,244,210,.35)'; ctx.lineWidth = 9 * s;
    ctx.beginPath(); ctx.arc(3 * s, 8 * s, R * 0.8, o.trail[0], o.trail[1], o.trail[1] < o.trail[0]); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5 * s;
    ctx.beginPath(); ctx.arc(3 * s, 8 * s, R * 0.97, o.trail[0], o.trail[1], o.trail[1] < o.trail[0]); ctx.stroke();
  }
  drawWeapon(L, s, wAng, o);
  if (o.stab) {
    ctx.strokeStyle = 'rgba(255,244,210,.45)'; ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo((L.wlen + 20) * s, 7 * s); ctx.lineTo((L.wlen + 52) * s, 3 * s); ctx.stroke(); ctx.lineCap = 'butt';
  }
  ctx.strokeStyle = 'rgba(10,8,6,.75)'; ctx.lineWidth = 1.4;
  ctx.fillStyle = L.body; ctx.beginPath(); ctx.ellipse(0, 0, 9 * s, 12 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = L.trim;
  ctx.beginPath(); ctx.arc(1 * s, -10 * s, 4.6 * s, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(1 * s, 10 * s, 4.6 * s, 0, TAU); ctx.fill(); ctx.stroke();
  if (o.shield === 3) {
    ctx.fillStyle = '#4a4f58'; ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.6 * s;
    ctx.fillRect(9 * s, -12 * s, 5 * s, 22 * s); ctx.strokeRect(9 * s, -12 * s, 5 * s, 22 * s);
    ctx.strokeStyle = 'rgba(10,8,6,.75)'; ctx.lineWidth = 1.4;
  } else if (o.shield) {
    const up = o.shield === 2;
    ctx.fillStyle = '#6b5638'; ctx.strokeStyle = '#b9b29c'; ctx.lineWidth = 1.6 * s;
    ctx.beginPath(); ctx.arc(up ? 10 * s : 2 * s, up ? -6 * s : -12 * s, (up ? 7.5 : 6) * s, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(10,8,6,.75)'; ctx.lineWidth = 1.4;
  }
  ctx.fillStyle = L.head; ctx.beginPath(); ctx.arc(2 * s, 0, 6.4 * s, 0, TAU); ctx.fill(); ctx.stroke();
  if (L.hood) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(4 * s, 0, 4 * s, -1.2, 1.2); ctx.fill(); }
  else { ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.moveTo(6.5 * s, -3 * s); ctx.lineTo(6.5 * s, 3 * s); ctx.stroke(); }
  if (o.eyes) { ctx.fillStyle = o.eyes; ctx.shadowColor = o.eyes; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(6 * s, -2.2 * s, 1.1 * s, 0, TAU); ctx.arc(6 * s, 2.2 * s, 1.1 * s, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; }
  if (o.flash) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(0, 0, 10 * s, 13 * s, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawHorse(x, y, face, anim) {
  shadow(x, y + 5, 30, 14, 0.3);
  ctx.save(); ctx.translate(x, y); ctx.rotate(face);
  const bob = Math.sin(anim * 2) * 1.5;
  ctx.shadowColor = 'rgba(150,200,255,.6)'; ctx.shadowBlur = 10;
  ctx.fillStyle = '#2d3038'; ctx.beginPath(); ctx.ellipse(0, 0, 30, 12, 0, 0, TAU); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.ellipse(30 + bob, 0, 11, 6.5, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#11141a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(8, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(160,210,255,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.quadraticCurveTo(-42, Math.sin(anim * 3) * 6, -48, 0); ctx.stroke();
  ctx.fillStyle = '#b8a26a'; ctx.beginPath(); ctx.arc(37 + bob, -2.5, 1.3, 0, TAU); ctx.arc(37 + bob, 2.5, 1.3, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawPlayer() {
  const p = P, LOOK = playerLook();
  if (p.state === 'dead') {
    const k = Math.min(1, G.deathT / 1.2);
    drawHumanoid(p.x, p.y, p.face, LOOK, 1.2, { alpha: 1 - k * 0.7, kneel: true, shield: 1 });
    return;
  }
  if (p.mounted) drawHorse(p.x, p.y, p.face, p.walk);
  let wAng = 0.6, trail = null, thrust = 0, stab = false, spinRot = 0, fx = null;
  if (p.state === 'attack' && p.atk) {
    const A = p.atk, t = p.t, sw_ = A.swing || 1, anim = A.anim || (A.thrust ? 'thrust' : 'slash');
    const ph = t < A.wind ? 0 : t < A.wind + A.act ? 1 : 2;
    const k = ph === 0 ? t / A.wind : ph === 1 ? (t - A.wind) / A.act : (t - A.wind - A.act) / A.rec;
    if (anim === 'thrust' || (anim === 'dash' && A.thrust)) {
      wAng = -0.12; thrust = ph === 0 ? -0.5 * k : ph === 1 ? 1 : 1 - k; stab = ph === 1;
      if (anim === 'dash' && ph === 1) fx = 'dash';
    } else if (anim === 'spin') {
      wAng = ph === 0 ? lerp(0.6, 1.7, k) : ph === 1 ? 1.7 : lerp(1.7, 0.6, k);
      if (ph === 1) { spinRot = -k * TAU * (A.turns || 1); fx = 'spin'; }
    } else if (anim === 'overhead') {
      if (ph === 0) wAng = lerp(0.6, Math.PI * 0.95, 1 - Math.pow(1 - k, 2));
      else if (ph === 1) { wAng = lerp(Math.PI * 0.95, 0, Math.min(1, k * 2)); thrust = 0.5; fx = 'chop'; }
      else { wAng = lerp(0, 0.6, k); thrust = 0.5 * (1 - k); if (k < 0.3) fx = 'chop'; }
    } else if (anim === 'dash') {
      if (ph === 0) wAng = lerp(0.6, 1.9, k);
      else if (ph === 1) { wAng = lerp(1.9, -1.4, k); fx = 'dash'; trail = [1.8, wAng]; }
      else wAng = lerp(-1.4, 0.6, k);
    } else if (ph === 0) wAng = weaponAngle('wind', k, sw_);
    else if (ph === 1) { wAng = weaponAngle('act', k, sw_); trail = [1.8 * sw_, wAng]; }
    else { wAng = weaponAngle('rec', k, sw_); if (k < 0.3) trail = [lerp(1.8 * sw_, -1.3 * sw_, k * 2), -1.3 * sw_]; }
  } else if (p.state === 'roll') wAng = 2.4;
  else if (p.state === 'drink') wAng = 1.4;
  else if (p.state === 'cast') wAng = -0.2;
  else if (p.state === 'guard') wAng = 1.1;
  const th = twoHanded();
  if (th && p.state === 'guard') wAng = -1.1;
  const o = { anim: p.walk, trail, thrust, stab, flash: p.invuln > 0.25, shield: th ? 0 : p.state === 'guard' ? 2 : 1 };
  if (p.state === 'attack' && p.atk && p.atk.kind === 'heavy') o.trailCol = 'rgba(255,220,150,.45)';
  if (p.state === 'roll') {
    const k = p.t / ROLL_DUR;
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1 - Math.sin(k * Math.PI) * 0.22, 1 - Math.sin(k * Math.PI) * 0.22); ctx.translate(-p.x, -p.y);
    drawHumanoid(p.x, p.y, p.rollDir, LOOK, wAng, o);
    ctx.restore();
  } else {
    drawHumanoid(p.x, p.y - (p.mounted ? 6 : 0), p.face + spinRot, LOOK, wAng, o);
  }
  if (fx && p.atk) {
    const A = p.atk, R = LOOK.wlen + 12;
    ctx.lineCap = 'round';
    if (fx === 'spin') {
      const a0 = p.face + spinRot;
      ctx.strokeStyle = 'rgba(255,244,210,.45)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(p.x, p.y, R, a0, a0 + 1.8); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, R + 4, a0, a0 + 1.8); ctx.stroke();
    } else if (fx === 'chop' && A.ix !== undefined) {
      ctx.strokeStyle = 'rgba(255,240,200,.5)'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(p.x + Math.cos(p.face) * 14, p.y + Math.sin(p.face) * 14); ctx.lineTo(A.ix, A.iy); ctx.stroke();
    } else if (fx === 'dash' && A.sx !== undefined) {
      ctx.strokeStyle = 'rgba(255,244,210,.4)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(A.sx, A.sy); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }
  if (p.state === 'guard' && p.parryOk && p.t < 0.22) {
    ctx.strokeStyle = `rgba(255,240,200,${0.7 * (1 - p.t / 0.22)})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 22, p.face - 0.9, p.face + 0.9); ctx.stroke();
  }
  if (p.state === 'drink') { ctx.fillStyle = `rgba(255,90,70,${0.25 + Math.sin(p.t * 20) * 0.1})`; ctx.beginPath(); ctx.arc(p.x, p.y, 20, 0, TAU); ctx.fill(); }
  if (p.state === 'cast' && p.t < 0.25) { ctx.fillStyle = 'rgba(170,200,255,.5)'; ctx.beginPath(); ctx.arc(p.x + Math.cos(p.face) * 20, p.y + Math.sin(p.face) * 20, 6 + p.t * 20, 0, TAU); ctx.fill(); }
}
function drawFinal() {
  const f = fb;
  if (!f || !inView(f.x, f.y, 420)) return;
  if (f.dead && f.t > 3) return;
  const alpha = f.dead ? Math.max(0, 1 - f.t / 3) : 1;
  if (f.state === 'atk' && f.atk) {
    const s = f.atk.steps[f.atk.i], t = f.atk.t;
    if (s && s.k === 'swing' && t < s.wind && t > s.wind * 0.4) drawTelegraph(f.x, f.y, f.face, s.range, s.arc, (t - s.wind * 0.4) / (s.wind * 0.6), '240,200,90');
    if (s && s.k === 'slam' && t < s.wind) { const hx = f.x + Math.cos(f.face) * s.off, hy = f.y + Math.sin(f.face) * s.off; ctx.strokeStyle = `rgba(255,210,110,${0.2 + t / s.wind * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, s.r, 0, TAU); ctx.stroke(); }
    if (s && s.k === 'beam' && t < s.wind) { const h = finalHead(f); ctx.strokeStyle = `rgba(255,230,160,${0.15 + t / s.wind * 0.35})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x + Math.cos(f.face) * 480, h.y + Math.sin(f.face) * 480); ctx.stroke(); }
  }
  if (f.beaming) {
    const h = finalHead(f), ex = h.x + Math.cos(f.beamDir) * 480, ey = h.y + Math.sin(f.beamDir) * 480;
    ctx.save(); ctx.lineCap = 'round'; ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 24;
    ctx.strokeStyle = 'rgba(255,215,110,.55)'; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(h.x, h.y - (f.z || 0)); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,250,225,.95)'; ctx.lineWidth = 8; ctx.stroke(); ctx.restore();
  }
  if (f.phase === 1) {
    let wAng = 0.5, trail = null;
    if (f.state === 'atk' && f.atk) {
      const s = f.atk.steps[f.atk.i], t = f.atk.t;
      if (s.k === 'swing') {
        if (t < s.wind) wAng = weaponAngle('wind', t / s.wind, s.swing);
        else if (t < s.wind + s.act) { wAng = weaponAngle('act', (t - s.wind) / s.act, s.swing); trail = [1.8 * s.swing, wAng]; }
        else wAng = weaponAngle('rec', (t - s.wind - s.act) / s.rec, s.swing);
      } else if (s.k === 'slam') wAng = t < s.wind ? lerp(0.5, 2.9, Math.min(1, t / s.wind)) : 0;
      else if (s.k === 'leap') wAng = 2.6;
      else wAng = -0.3;
    }
    if (f.charge > 0) { const gr = ctx.createRadialGradient(f.x, f.y - 30, 2, f.x, f.y - 30, 60); gr.addColorStop(0, `rgba(255,230,150,${0.6 * f.charge})`); gr.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(f.x, f.y - 30, 60, 0, TAU); ctx.fill(); }
    drawHumanoid(f.x, f.y, f.face, f.look, wAng, {
      anim: f.anim, trail, trailCol: 'rgba(255,220,130,.5)', flash: f.hurtFlash > 0, z: f.z, aura: true,
      kneel: f.state === 'transform' || f.state === 'broken', eyes: '#fff3c0',
      alpha: f.state === 'transform' ? Math.max(0.05, 1 - f.t / 1.8) : alpha,
    });
    return;
  }
  const z = f.z || 0, t = f.anim;
  shadow(f.x, f.y + 12, 74, 34, 0.35 * alpha);
  ctx.save(); ctx.globalAlpha = alpha * (f.state === 'transform' ? Math.min(1, (f.t - 1.8) / 1.2) : 1); ctx.translate(f.x, f.y - z);
  ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 22; ctx.strokeStyle = 'rgba(255,220,120,.75)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(0, -6, 78 + Math.sin(t * 1.5) * 3, 0, TAU); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -6, 64, t * 0.4, t * 0.4 + TAU * 0.85); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.rotate(f.face);
  for (let i = 12; i >= 0; i--) {
    const x = 26 - i * 13, y = Math.sin(t * 2 + i * 0.5) * (3 + i * 1.3), r = 24 - i * 1.4;
    const gr = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
    gr.addColorStop(0, '#fffbe8'); gr.addColorStop(0.6, '#f0cf72'); gr.addColorStop(1, 'rgba(170,120,40,.85)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,236,170,.55)';
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(14, sd * 18); ctx.quadraticCurveTo(-10, sd * (60 + Math.sin(t * 3) * 6), -40, sd * 26); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#fff4d0'; ctx.beginPath(); ctx.ellipse(44, 0, 22, 15, 0, 0, TAU); ctx.fill();
  const glow = f.beaming ? 1 : f.charge;
  if (glow > 0) { const gr = ctx.createRadialGradient(62, 0, 1, 62, 0, 30); gr.addColorStop(0, `rgba(255,250,220,${glow})`); gr.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(62, 0, 30, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#6ad0ff'; ctx.shadowColor = '#6ad0ff'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(52, -6, 2.4, 0, TAU); ctx.moveTo(54.4, 6); ctx.arc(52, 6, 2.4, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  if (f.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(-30, 0, 80, 24, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawDragon() {
  const d = dragon;
  if (!d || !inView(d.x, d.y, 320)) return;
  if (d.dead && d.t > 3) return;
  if (d.state === 'atk' && d.atk) {
    const s = d.atk.steps[d.atk.i], t = d.atk.t;
    if (s.k === 'melee' && t < s.wind && t > s.wind * 0.4) drawTelegraph(d.x, d.y, d.face, s.range, s.arc, (t - s.wind * 0.4) / (s.wind * 0.6), '230,110,50');
    if (s.k === 'tail' && t < s.wind) { ctx.strokeStyle = `rgba(230,110,50,${0.2 + t / s.wind * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(d.x, d.y, s.r, 0, TAU); ctx.stroke(); }
  }
  const alpha = d.dead ? Math.max(0, 1 - d.t / 3) : 1, z = d.z || 0;
  shadow(d.x, d.y + 8, 78 * (1 - z / 420), 44 * (1 - z / 420), 0.4 * alpha);
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(d.x, d.y - z);
  const sc = (1 + z / 600) * (d.state === 'sleep' ? 1 + Math.sin(d.anim * 1.4) * 0.03 : 1);
  ctx.scale(sc, sc); ctx.rotate(d.face + d.spin);
  const flap = d.flying ? Math.sin(d.anim * 10) : d.state === 'wake' ? Math.sin(d.anim * 6) * 0.6 : Math.sin(d.anim * 1.2) * 0.12;
  const body = '#5b4f46', dark = '#2a231f';
  for (let i = 7; i >= 0; i--) {
    const tx = -34 - i * 13, ty = Math.sin(d.anim * 2 + i * 0.7) * (2 + i * 1.6) + (d.state === 'sleep' ? i * i * 0.9 : 0);
    ctx.fillStyle = i % 2 ? body : '#534840'; ctx.beginPath(); ctx.arc(tx, ty, 15 - i * 1.6, 0, TAU); ctx.fill();
  }
  const sp = d.state === 'sleep' ? 0.55 : 1;
  for (const side of [-1, 1]) {
    ctx.fillStyle = 'rgba(70,58,50,.94)'; ctx.strokeStyle = dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(8, side * 16);
    ctx.lineTo(-6, side * (70 + flap * 30) * sp); ctx.lineTo(-30, side * (96 + flap * 34) * sp); ctx.lineTo(-44, side * (70 + flap * 22) * sp);
    ctx.lineTo(-58, side * (52 + flap * 14) * sp); ctx.lineTo(-30, side * 22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, side * 16); ctx.lineTo(-30, side * (96 + flap * 34) * sp); ctx.moveTo(-6, side * (70 + flap * 30) * sp); ctx.lineTo(-30, side * 22); ctx.stroke();
  }
  ctx.fillStyle = body; ctx.strokeStyle = dark; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(-4, 0, 44, 25, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(140,120,100,.25)'; ctx.beginPath(); ctx.ellipse(-4, 0, 30, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a312b';
  for (let i = 0; i < 6; i++) { const sx = 30 - i * 14; ctx.beginPath(); ctx.moveTo(sx + 5, 0); ctx.lineTo(sx - 5, -5); ctx.lineTo(sx - 5, 5); ctx.closePath(); ctx.fill(); }
  const na = dragonNeck(d), hx = 34 + Math.cos(na) * 38, hy = Math.sin(na) * 38;
  ctx.strokeStyle = body; ctx.lineWidth = 20; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(24, 0); ctx.quadraticCurveTo(40, hy * 0.3, hx, hy); ctx.stroke(); ctx.lineCap = 'butt';
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(na);
  ctx.fillStyle = '#675a50'; ctx.strokeStyle = dark; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(6, 0, 20, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#cfc2a8'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(-18, -16); ctx.moveTo(-2, 8); ctx.lineTo(-18, 16); ctx.stroke();
  const glow = d.breathing ? 1 : d.charge;
  if (glow > 0) {
    const gr = ctx.createRadialGradient(24, 0, 1, 24, 0, 26);
    gr.addColorStop(0, `rgba(255,200,90,${0.9 * glow})`); gr.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(24, 0, 26, 0, TAU); ctx.fill();
  }
  if (d.state !== 'sleep' && !d.dead) {
    ctx.fillStyle = '#ffb347'; ctx.shadowColor = '#ff8a2a'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(12, -6, 2, 0, TAU); ctx.moveTo(14, 6); ctx.arc(12, 6, 2, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  }
  ctx.restore();
  if (d.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(-4, 0, 44, 25, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawTelegraph(x, y, face, range, arc, k, col = '200,40,30') {
  ctx.fillStyle = `rgba(${col},${0.06 + k * 0.1})`;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, range, face - arc / 2, face + arc / 2); ctx.closePath(); ctx.fill();
}
function drawWolf(e) {
  const alpha = e.dead ? Math.max(0, 1 - e.t / 1.2) : 1;
  if (alpha <= 0) return;
  shadow(e.x, e.y + 4, 18, 8, 0.3 * alpha);
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(e.x, e.y); ctx.rotate(e.face);
  const windup = e.state === 'atk' && e.atk && e.t < e.atk.wind;
  const c = windup ? -4 : 0, leg = e.moving ? Math.sin(e.anim * 16) * 4 : 0;
  ctx.strokeStyle = '#4d4b45'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(8 + c, -6); ctx.lineTo(10 + c + leg, -10); ctx.moveTo(8 + c, 6); ctx.lineTo(10 + c - leg, 10);
  ctx.moveTo(-8, -6); ctx.lineTo(-10 - leg, -10); ctx.moveTo(-8, 6); ctx.lineTo(-10 + leg, 10); ctx.stroke();
  ctx.strokeStyle = '#5b5953'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-25, Math.sin(e.anim * 5) * 4); ctx.stroke();
  ctx.fillStyle = e.dead ? '#4d4b45' : '#6d6b64'; ctx.strokeStyle = 'rgba(10,8,6,.7)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(c, 0, 16, 8.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4f4d47'; ctx.beginPath(); ctx.ellipse(c - 2, 0, 10, 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#77756d'; ctx.beginPath(); ctx.arc(14 + c * 0.5, 0, 7, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5c5a54'; ctx.beginPath(); ctx.ellipse(20 + c * 0.5, 0, 5, 3.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#77756d'; ctx.beginPath(); ctx.moveTo(10, -4); ctx.lineTo(8, -10); ctx.lineTo(14, -6); ctx.moveTo(10, 4); ctx.lineTo(8, 10); ctx.lineTo(14, 6); ctx.fill();
  if (!e.dead && e.state !== 'idle') { ctx.fillStyle = '#ff5a3a'; ctx.beginPath(); ctx.arc(17, -2.6, 1.2, 0, TAU); ctx.arc(17, 2.6, 1.2, 0, TAU); ctx.fill(); }
  if (e.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(0, 0, 17, 9, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawBat(e) {
  const alpha = e.dead ? Math.max(0, 1 - e.t / 1.2) : 1;
  if (alpha <= 0) return;
  shadow(e.x, e.y + 14, 8, 4, 0.25 * alpha);
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(e.x, e.y - 12); ctx.rotate(e.face);
  const f = Math.sin(e.anim * 24);
  ctx.fillStyle = '#3a2a30';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-4, s * (14 + f * 6)); ctx.lineTo(-8, s * (8 + f * 3)); ctx.lineTo(-3, s * 3); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#4a3238'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 4.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.arc(5, -1.5, 1, 0, TAU); ctx.moveTo(6, 1.5); ctx.arc(5, 1.5, 1, 0, TAU); ctx.fill();
  if (e.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 6, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawSpider(e) {
  const alpha = e.dead ? Math.max(0, 1 - e.t / 1.2) : 1;
  if (alpha <= 0) return;
  shadow(e.x, e.y + 4, 18, 10, 0.3 * alpha);
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(e.x, e.y); ctx.rotate(e.face);
  ctx.strokeStyle = '#2a2622'; ctx.lineWidth = 2.2;
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const bx = 4 - i * 4, sw = Math.sin(e.anim * 14 + i * 1.3 + (s > 0 ? 1 : 0)) * (e.moving ? 4 : 1);
    ctx.beginPath(); ctx.moveTo(bx, s * 5); ctx.lineTo(bx + 4 - i * 3 + sw, s * 15); ctx.lineTo(bx + 8 - i * 6 + sw, s * 22); ctx.stroke();
  }
  ctx.fillStyle = '#3a3a2e'; ctx.beginPath(); ctx.ellipse(-11, 0, 12, 10, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8fc04a'; ctx.beginPath(); ctx.ellipse(-12, 0, 5, 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2f2f26'; ctx.beginPath(); ctx.arc(5, 0, 7, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d0ff7a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(10, s * 2.5, 1.2, 0, TAU); ctx.fill(); }
  if (e.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(-4, 0, 16, 10, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawEnemy(e) {
  if (!inView(e.x, e.y, 80)) return;
  if (e.dead && e.t > 1.3) return;
  if (!e.dead && e.state === 'atk' && e.atk && e.atk.slam === undefined && e.atk.kind === 'slam' && e.t < e.atk.wind) { const A = e.atk, hx = e.x + Math.cos(e.face) * A.off, hy = e.y + Math.sin(e.face) * A.off; ctx.strokeStyle = `rgba(230,120,60,${0.2 + e.t / A.wind * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, A.r, 0, TAU); ctx.stroke(); }
  if (!e.dead && e.state === 'atk' && e.atk && (!e.atk.kind || e.atk.kind === 'melee') && e.t < e.atk.wind && e.t > e.atk.wind * 0.45) drawTelegraph(e.x, e.y, e.face, e.atk.range, e.atk.arc, (e.t - e.atk.wind * 0.45) / (e.atk.wind * 0.55));
  if (e.type === 'wolf') { drawWolf(e); drawEnemyBar(e); return; }
  if (e.T.flier) { drawBat(e); drawEnemyBar(e); return; }
  if (e.type === 'spider') { drawSpider(e); drawEnemyBar(e); return; }
  const L = e.T.look;
  let wAng = 0.6, trail = null, charge = 0, thrust = 0;
  if (e.state === 'atk' && e.atk) {
    const A = e.atk, t = e.t, k = A.kind || 'melee';
    if (k === 'shot' || k === 'lob' || k === 'orbs' || k === 'summon') { charge = t < A.wind ? t / A.wind : 0; wAng = L.weapon === 'bow' ? -0.3 : -0.2; }
    else if (k === 'slam') wAng = t < A.wind ? lerp(0.6, 2.8, Math.min(1, t / A.wind)) : 0;
    else if (k === 'charge') wAng = -0.3;
    else if (k === 'blink') wAng = 1.2;
    else if (A.thrust) { wAng = -0.12; thrust = t < A.wind ? -0.5 * t / A.wind : t < A.wind + A.act ? 1 : 1 - (t - A.wind - A.act) / A.rec; }
    else if (t < A.wind) wAng = weaponAngle('wind', t / A.wind, A.swing);
    else if (t < A.wind + A.act) { wAng = weaponAngle('act', (t - A.wind) / A.act, A.swing); trail = [1.8 * A.swing, wAng]; }
    else wAng = weaponAngle('rec', (t - A.wind - A.act) / A.rec, A.swing);
  } else if (e.state === 'broken') wAng = 1.3;
  const jitter = e.state === 'stagger' ? rand(-2, 2) : 0;
  let alpha = e.dead ? Math.max(0, 1 - e.t / 1.2) : undefined;
  if (e.T.ghost) alpha = (alpha ?? 1) * (0.62 + Math.sin(e.anim * 5) * 0.08) * (1 - (e.fade || 0) * 0.85);
  drawHumanoid(e.x + jitter, e.y, e.face, L, wAng, {
    anim: e.anim, trail, thrust, trailCol: e.T.ghost ? 'rgba(200,240,255,.4)' : 'rgba(255,200,170,.3)', flash: e.hurtFlash > 0, charge, kneel: e.state === 'broken' || e.dead,
    alpha, eyes: e.elite && !e.dead ? (e.T.ghost ? '#bff5ff' : '#ff7a4a') : null, shield: e.T.shield ? (e.state === 'atk' ? 1 : 3) : 0,
  });
  drawEnemyBar(e);
}
function drawEnemyBar(e) {
  if (e.dead || e.hp >= e.maxHp || e.isBoss) return;
  const w = e.elite ? 54 : 34, x = e.x - w / 2, y = e.y - e.r * (e.T.look ? e.T.look.scale : 1) - 22;
  ctx.fillStyle = 'rgba(8,7,5,.8)'; ctx.fillRect(x - 1, y - 1, w + 2, 6);
  ctx.fillStyle = '#a3201c'; ctx.fillRect(x, y, w * e.hp / e.maxHp, 4);
  if (e.state === 'broken') { ctx.fillStyle = '#f2dc97'; ctx.fillRect(x, y + 5, w, 1.5); }
  if (e.bleed > 0) { ctx.fillStyle = '#e0503c'; ctx.fillRect(x, y + 7, w * Math.min(1, e.bleed / (e.elite ? 110 : 60)), 2); }
}
function drawBoss() {
  const b = boss;
  if (!b || !inView(b.x, b.y, 200)) return;
  if (b.dead && b.t > 2.5) return;
  if (b.state === 'atk' && b.atk) {
    const s = b.atk.steps[b.atk.i], t = b.atk.t;
    if (s && s.k === 'swing' && t < s.wind && t > s.wind * 0.4) drawTelegraph(b.x, b.y, b.face, s.range, s.arc, (t - s.wind * 0.4) / (s.wind * 0.6), '230,170,60');
    if (s && s.k === 'hammer' && t < s.wind) { const hx = b.x + Math.cos(b.face) * 85, hy = b.y + Math.sin(b.face) * 85; ctx.strokeStyle = `rgba(255,210,110,${0.2 + t / s.wind * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, 95, 0, TAU); ctx.stroke(); }
  }
  let wAng = 0.5, trail = null, hammer;
  if (b.state === 'dormant') wAng = 0.15;
  else if (b.state === 'atk' && b.atk) {
    const s = b.atk.steps[b.atk.i], t = b.atk.t;
    if (s.k === 'swing') {
      if (t < s.wind) wAng = weaponAngle('wind', t / s.wind, s.swing);
      else if (t < s.wind + s.act) { wAng = weaponAngle('act', (t - s.wind) / s.act, s.swing); trail = [1.8 * s.swing, wAng]; }
      else wAng = weaponAngle('rec', (t - s.wind - s.act) / s.rec, s.swing);
    } else if (s.k === 'hammer') { if (t < s.wind) { hammer = t / s.wind; wAng = lerp(0.3, 2.9, Math.min(1, t / s.wind * 1.4)); } else { hammer = 1; wAng = 0; } }
    else if (s.k === 'throw') wAng = t < s.wind ? 2.2 : -0.6;
    else if (s.k === 'leap') wAng = 2.6;
  } else if (b.state === 'broken') wAng = 1.3;
  drawHumanoid(b.x, b.y, b.face, b.look, wAng, {
    anim: b.anim, trail, trailCol: 'rgba(255,214,120,.45)', flash: b.hurtFlash > 0, z: b.z, hammer,
    kneel: b.state === 'dormant' || b.state === 'broken' || b.dead, aura: b.phase === 2 && !b.dead,
    alpha: b.dead ? Math.max(0, 1 - b.t / 2.4) : undefined, eyes: b.dead ? null : '#ffcf5a',
  });
}
function drawPuzzles() {
  const t = G.clock;
  for (const q of puddles) {
    if (!inView(q.x, q.y, 60)) continue;
    const a = Math.min(1, (q.life - q.t) / 1.2) * 0.55;
    ctx.fillStyle = `rgba(120,190,70,${a})`; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r, q.r * 0.7, 0, 0, TAU); ctx.fill();
  }
  for (const b of BRAZIERS) {
    if (!inView(b.x, b.y, 60)) continue;
    const lit = S.fortOpen || G.braziers.includes(b.id);
    shadow(b.x + 2, b.y + 8, 15, 7, 0.35);
    ctx.fillStyle = '#6a655a'; ctx.beginPath(); ctx.arc(b.x, b.y, 13, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2a261e'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#1e1b16'; ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, TAU); ctx.fill();
    if (lit) {
      const gr = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, 60);
      gr.addColorStop(0, 'rgba(255,170,70,.45)'); gr.addColorStop(1, 'rgba(255,170,70,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(b.x, b.y, 60, 0, TAU); ctx.fill();
      if (Math.random() < 0.6) addPart(b.x + rand(-5, 5), b.y - 4, rand(-8, 8), rand(-70, -40), 0.45, rand(4, 7), FIRE_COLS[(Math.random() * 4) | 0], 'fire');
    }
  }
  for (const st of STATUES) {
    if (!inView(st.x, st.y, 60)) continue;
    const on = S.statues.includes(st.id);
    shadow(st.x + 2, st.y + 8, 17, 8, 0.35);
    if (on) { const gr = ctx.createRadialGradient(st.x, st.y, 2, st.x, st.y, 55); gr.addColorStop(0, 'rgba(150,250,235,.4)'); gr.addColorStop(1, 'rgba(150,250,235,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(st.x, st.y, 55, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#7b7a72'; ctx.fillRect(st.x - 14, st.y - 4, 28, 12);
    ctx.fillStyle = on ? '#b8d8d2' : '#8d8b82'; ctx.beginPath(); ctx.ellipse(st.x, st.y - 10, 9, 12, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(st.x, st.y - 24, 6, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a3934'; ctx.lineWidth = 1.5; ctx.stroke();
    if (on && Math.random() < 0.2) addPart(st.x + rand(-10, 10), st.y - 20, 0, -30, 0.9, 2, '#bff5ee', 'mote');
  }
  if (!S.coloDone && inView(FLAG.x, FLAG.y, 60)) {
    ctx.strokeStyle = '#3a2f22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(FLAG.x, FLAG.y + 8); ctx.lineTo(FLAG.x, FLAG.y - 40); ctx.stroke();
    ctx.fillStyle = G.colo.active ? '#5a1a16' : '#9e2a22';
    const wv = Math.sin(t * 4) * 3;
    ctx.beginPath(); ctx.moveTo(FLAG.x, FLAG.y - 40); ctx.lineTo(FLAG.x + 26, FLAG.y - 34 + wv); ctx.lineTo(FLAG.x, FLAG.y - 26); ctx.closePath(); ctx.fill();
  }
}
function drawBarrier() {
  if (S.glade || !inView(BARRIER.x, BARRIER.y, BARRIER.r + 40)) return;
  const t = G.clock, gr = ctx.createRadialGradient(BARRIER.x, BARRIER.y, BARRIER.r * 0.4, BARRIER.x, BARRIER.y, BARRIER.r);
  gr.addColorStop(0, 'rgba(150,240,230,.04)'); gr.addColorStop(1, `rgba(150,240,230,${0.22 + Math.sin(t * 2) * 0.06})`);
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(BARRIER.x, BARRIER.y, BARRIER.r, 0, TAU); ctx.fill();
  ctx.strokeStyle = `rgba(190,255,245,${0.5 + Math.sin(t * 3) * 0.2})`; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(BARRIER.x, BARRIER.y, BARRIER.r, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(BARRIER.x, BARRIER.y, BARRIER.r * 0.72, t * 0.3, t * 0.3 + TAU * 0.8); ctx.stroke();
}
function drawChest(c) {
  const open = S.chests.includes(c.id), t = G.clock;
  shadow(c.x + 2, c.y + 8, 17, 7, 0.35);
  if (!open) {
    const gr = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, 34);
    gr.addColorStop(0, `rgba(255,220,130,${0.18 + Math.sin(t * 2.5 + c.x) * 0.08})`); gr.addColorStop(1, 'rgba(255,220,130,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, 34, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = '#5a3d22'; ctx.fillRect(c.x - 15, c.y - 6, 30, 16);
  ctx.strokeStyle = '#1e140b'; ctx.lineWidth = 1.5; ctx.strokeRect(c.x - 15, c.y - 6, 30, 16);
  if (open) {
    ctx.fillStyle = '#1a120a'; ctx.fillRect(c.x - 13, c.y - 6, 26, 5);
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(c.x - 15, c.y - 18, 30, 8); ctx.strokeRect(c.x - 15, c.y - 18, 30, 8);
  } else {
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(c.x - 15, c.y - 12, 30, 8); ctx.strokeRect(c.x - 15, c.y - 12, 30, 8);
  }
  ctx.fillStyle = '#c9a34a';
  ctx.fillRect(c.x - 10, c.y - (open ? 18 : 12), 3, open ? 8 : 22); ctx.fillRect(c.x + 7, c.y - (open ? 18 : 12), 3, open ? 8 : 22);
  if (open) { ctx.fillRect(c.x - 10, c.y - 6, 3, 16); ctx.fillRect(c.x + 7, c.y - 6, 3, 16); }
  else { ctx.fillRect(c.x - 2, c.y - 5, 4, 5); }
}
function drawRock(o) {
  const r = mulberry32(o.seed);
  shadow(o.x + 3, o.y + 5, o.r * 1.05, o.r * 0.7, 0.3);
  ctx.fillStyle = o.pillar ? '#8a8474' : o.cliff ? '#4a4539' : '#6f6b61';
  ctx.beginPath();
  const n = 8;
  for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = o.r * (0.82 + r() * 0.3); const x = o.x + Math.cos(a) * rr, y = o.y + Math.sin(a) * rr * 0.9; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(15,13,10,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.ellipse(o.x - o.r * 0.25, o.y - o.r * 0.3, o.r * 0.45, o.r * 0.3, -0.4, 0, TAU); ctx.fill();
  if (o.pillar) { ctx.strokeStyle = 'rgba(40,36,28,.5)'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.6, 0, TAU); ctx.stroke(); }
}
function drawWall(w) {
  if (w.gate || w.void) return;
  if (w.illusory && S.illusory.includes(w.illusory)) return;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(w.x + 5, w.y + 9, w.w, w.h);
  ctx.fillStyle = w.cliff ? '#3d382e' : '#6f6a5b'; ctx.fillRect(w.x, w.y, w.w, w.h);
  ctx.fillStyle = w.cliff ? '#4c463a' : '#8c8672'; ctx.fillRect(w.x, w.y, w.w, Math.min(6, w.h * 0.3));
  ctx.strokeStyle = 'rgba(28,24,18,.5)'; ctx.lineWidth = 1;
  ctx.beginPath();
  if (w.w > w.h) { for (let x = w.x + 22; x < w.x + w.w; x += 22) { ctx.moveTo(x, w.y); ctx.lineTo(x, w.y + w.h); } ctx.moveTo(w.x, w.y + w.h / 2); ctx.lineTo(w.x + w.w, w.y + w.h / 2); }
  else { for (let y = w.y + 22; y < w.y + w.h; y += 22) { ctx.moveTo(w.x, y); ctx.lineTo(w.x + w.w, y); } ctx.moveTo(w.x + w.w / 2, w.y); ctx.lineTo(w.x + w.w / 2, w.y + w.h); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(12,10,8,.7)'; ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
}
function drawGates() {
  const t = G.clock;
  if (!S.fortOpen && inView(3600, 1286, 120)) {
    ctx.fillStyle = '#2b2a28'; ctx.fillRect(3540, 1272, 120, 28);
    ctx.strokeStyle = '#5c5a55'; ctx.lineWidth = 3;
    for (let x = 3548; x < 3660; x += 12) { ctx.beginPath(); ctx.moveTo(x, 1272); ctx.lineTo(x, 1300); ctx.stroke(); }
  }
  if (G.colo.active && inView(3600, 2964, 120)) {
    for (let i = 0; i < 6; i++) {
      const x = 3600 + Math.sin(t * 1.5 + i * 1.7) * 40, y = 2964 + Math.cos(t + i) * 6;
      const gr = ctx.createRadialGradient(x, y, 2, x, y, 50);
      gr.addColorStop(0, 'rgba(200,60,40,.45)'); gr.addColorStop(1, 'rgba(200,60,40,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y, 60, 22, 0, 0, TAU); ctx.fill();
    }
  }
  if (!S.bossDead && inView(1400, 1114, 120)) {
    const a = G.bossFight ? 0.55 : 0.34;
    for (let i = 0; i < 7; i++) {
      const x = 1400 + Math.sin(t * 1.3 + i * 1.7) * 26, y = 1114 + Math.cos(t * 0.9 + i) * 7;
      const gr = ctx.createRadialGradient(x, y, 2, x, y, 46);
      gr.addColorStop(0, `rgba(235,238,242,${a})`); gr.addColorStop(1, 'rgba(235,238,242,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y, 52, 22, 0, 0, TAU); ctx.fill();
    }
  }
  if (inView(1400, 406, 120)) {
    if (!S.bossDead) {
      ctx.fillStyle = '#3b362d'; ctx.fillRect(1360, 392, 80, 28);
      ctx.strokeStyle = 'rgba(214,178,94,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(1400, 406, 10, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1400, 392); ctx.lineTo(1400, 420); ctx.stroke();
    } else {
      const gr = ctx.createRadialGradient(1400, 406, 4, 1400, 406, 70);
      gr.addColorStop(0, 'rgba(255,220,130,.45)'); gr.addColorStop(1, 'rgba(255,220,130,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(1400, 406, 70, 0, TAU); ctx.fill();
    }
  }
}
function drawDecals() {
  const t = G.clock;
  for (const g of GRACES) {
    if (!inView(g.x, g.y, 200)) continue;
    const found = S.discovered.includes(g.id), pulse = 0.8 + Math.sin(t * 2.4 + g.id) * 0.2;
    const gr = ctx.createRadialGradient(g.x, g.y, 2, g.x, g.y, 70);
    gr.addColorStop(0, `rgba(255,222,140,${(found ? 0.5 : 0.25) * pulse})`); gr.addColorStop(1, 'rgba(255,222,140,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(g.x, g.y, 70, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff2c4'; ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(g.x, g.y - 14 * pulse); ctx.quadraticCurveTo(g.x + 6, g.y - 2, g.x, g.y + 4); ctx.quadraticCurveTo(g.x - 6, g.y - 2, g.x, g.y - 14 * pulse); ctx.fill();
    ctx.shadowBlur = 0;
  }
  for (const it of ITEMS) {
    if (S.taken.includes(it.id) || !inView(it.x, it.y, 40)) continue;
    const p = 0.6 + Math.sin(t * 4 + it.x) * 0.4;
    ctx.fillStyle = `rgba(255,248,220,${0.25 * p})`; ctx.beginPath(); ctx.arc(it.x, it.y, 16, 0, TAU); ctx.fill();
    ctx.fillStyle = it.kind === 'seed' ? '#ffe28a' : it.kind === 'weapon' ? '#ffb86a' : '#e8f0ff'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(it.x, it.y, 3.5 + p, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  }
  for (const n of NOTES) {
    if (!inView(n.x, n.y, 40)) continue;
    ctx.strokeStyle = `rgba(255,150,60,${0.55 + Math.sin(t * 2 + n.x) * 0.2})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(n.x, n.y, 16, 8, 0, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(n.x - 8, n.y); ctx.lineTo(n.x + 8, n.y); ctx.moveTo(n.x, n.y - 4); ctx.lineTo(n.x, n.y + 4); ctx.stroke();
  }
  if (S.lost && inView(S.lost.x, S.lost.y, 60)) {
    const p = 0.7 + Math.sin(t * 3) * 0.3, gr = ctx.createRadialGradient(S.lost.x, S.lost.y, 1, S.lost.x, S.lost.y, 26);
    gr.addColorStop(0, `rgba(170,255,190,${0.8 * p})`); gr.addColorStop(1, 'rgba(120,230,160,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(S.lost.x, S.lost.y, 26, 0, TAU); ctx.fill();
  }
  for (const a of aoes) {
    if (a.kind === 'mark') {
      const k = a.t / a.dur;
      ctx.strokeStyle = `rgba(255,120,60,${0.3 + k * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.stroke();
      ctx.fillStyle = `rgba(255,90,40,${0.08 + k * 0.14})`; ctx.beginPath(); ctx.arc(a.x, a.y, a.r * k, 0, TAU); ctx.fill();
    } else if (a.kind === 'delayed') {
      const k = a.t / a.delay;
      ctx.strokeStyle = `rgba(255,214,110,${0.35 + k * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.stroke();
      ctx.fillStyle = `rgba(255,214,110,${0.1 + k * 0.2})`; ctx.beginPath(); ctx.arc(a.x, a.y, a.r * k, 0, TAU); ctx.fill();
    }
  }
}
function drawAoeFx() {
  for (const a of aoes) {
    if (a.kind === 'flash') {
      const k = a.t / a.dur;
      ctx.fillStyle = a.col === 'fire' ? `rgba(255,140,60,${0.55 * (1 - k)})` : a.col === 'dust' ? `rgba(210,190,150,${0.45 * (1 - k)})` : `rgba(255,226,150,${0.5 * (1 - k)})`; ctx.beginPath(); ctx.arc(a.x, a.y, a.r * (0.7 + k * 0.4), 0, TAU); ctx.fill();
    } else if (a.kind === 'ring') {
      const cur = lerp(a.r0, a.r1, a.t / a.dur);
      ctx.strokeStyle = `rgba(255,222,140,${0.8 * (1 - a.t / a.dur)})`; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(a.x, a.y, cur, 0, TAU); ctx.stroke();
    }
  }
}
function drawProjs() {
  for (const q of projs) {
    if (q.kind === 'arrow') {
      const a = Math.atan2(q.vy, q.vx);
      ctx.strokeStyle = '#d8d0b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - Math.cos(a) * 16, q.y - Math.sin(a) * 16); ctx.stroke();
      continue;
    }
    if (q.kind === 'spit' || q.kind === 'porb' || q.kind === 'horb') {
      const col = q.kind === 'spit' ? '#9fd05a' : q.kind === 'horb' ? '#ffe08a' : '#b9a8ff';
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 0.8, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      continue;
    }
    if (q.kind === 'gwave') {
      const a = Math.atan2(q.vy, q.vx);
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(a); ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 16;
      ctx.strokeStyle = 'rgba(255,230,150,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-10, 0, 18, -1.1, 1.1); ctx.stroke(); ctx.restore();
    } else if (q.kind === 'dagger') {
      const a = Math.atan2(q.vy, q.vx);
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(a);
      ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 10; ctx.fillStyle = '#f6dc8e';
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -3); ctx.lineTo(-8, 3); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else {
      const col = q.kind === 'glint' ? '#d8e8ff' : q.kind === 'fireball' ? '#ffa04a' : '#8fb0ff';
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 0.8, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    }
  }
}
function drawParts() {
  for (const p of parts) {
    if (!inView(p.x, p.y, 30)) continue;
    const k = p.life / p.max;
    if (p.kind === 'text') {
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.font = `600 ${p.size}px ${FONT_U}`; ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
    } else if (p.kind === 'spark') {
      ctx.globalAlpha = k; ctx.strokeStyle = p.color; ctx.lineWidth = p.size;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke();
    } else if (p.kind === 'glint') {
      ctx.globalAlpha = k; ctx.fillStyle = p.color; const s = p.size * (0.5 + k * 0.5);
      ctx.beginPath(); ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x + s * 0.18, p.y); ctx.lineTo(p.x, p.y + s); ctx.lineTo(p.x - s * 0.18, p.y); ctx.closePath();
      ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x, p.y + s * 0.18); ctx.lineTo(p.x + s, p.y); ctx.lineTo(p.x, p.y - s * 0.18); ctx.closePath(); ctx.fill();
    } else if (p.kind === 'fire') {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k * 0.75;
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.5 - k * 0.6), 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.globalAlpha = p.kind === 'mote' ? Math.min(1, k * 1.5) * 0.9 : k;
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
    }
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}
function drawCanopies() {
  for (const o of OBST) {
    if (o.kind !== 'tree' || !inView(o.x, o.y, o.cr + 20)) continue;
    const spr = (o.spirit ? CANOPY.spirit : o.dead ? CANOPY.dead : o.golden ? CANOPY.gold : CANOPY.green)[o.spr];
    let a = 0.96;
    const near = (x, y, rr) => dist(x, y, o.x, o.y) < o.cr + rr;
    if (near(P.x, P.y, 10)) a = 0.38;
    else if (enemies.some(e => !e.dead && near(e.x, e.y, 0))) a = 0.6;
    ctx.globalAlpha = a;
    const size = spr.width * (o.cr / 52);
    ctx.drawImage(spr, o.x - size / 2, o.y - size / 2 - 10, size, size);
  }
  ctx.globalAlpha = 1;
  if (inView(TREE_POS.x, TREE_POS.y, 420)) {
    const d = dist(P.x, P.y, TREE_POS.x, TREE_POS.y);
    ctx.globalAlpha = d < 300 ? 0.55 : 0.95;
    ctx.fillStyle = '#6b4f1f'; ctx.beginPath(); ctx.arc(TREE_POS.x, TREE_POS.y, 58, 0, TAU); ctx.fill();
    const s = 820 + Math.sin(G.clock * 0.8) * 10;
    ctx.drawImage(BIGTREE, TREE_POS.x - s / 2, TREE_POS.y - s / 2 - 40, s, s);
    ctx.globalAlpha = 1;
  }
}
function drawGraceBeams() {
  for (const g of GRACES) {
    if (!inView(g.x, g.y - 100, 120) || !S.discovered.includes(g.id)) continue;
    const gr = ctx.createLinearGradient(0, g.y - 170, 0, g.y);
    gr.addColorStop(0, 'rgba(255,226,150,0)'); gr.addColorStop(1, `rgba(255,226,150,${0.28 + Math.sin(G.clock * 2) * 0.06})`);
    ctx.fillStyle = gr; ctx.fillRect(g.x - 3, g.y - 170, 6, 170);
  }
}
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0b0a07'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const sh = G.shake > 0.1 ? G.shake : 0, sx = (Math.random() * 2 - 1) * sh, sy = (Math.random() * 2 - 1) * sh;
  const vw = CW / ZOOM, vh = CH / ZOOM, x0 = cam.x - vw / 2 + sx, y0 = cam.y - vh / 2 + sy;
  VIEW = { x0, y0, x1: x0 + vw, y1: y0 + vh };
  ctx.setTransform(DPR * ZOOM, 0, 0, DPR * ZOOM, -x0 * DPR * ZOOM, -y0 * DPR * ZOOM);
  const gx0 = clamp(Math.floor(x0), 0, W), gy0 = clamp(Math.floor(y0), 0, H), gx1 = clamp(Math.ceil(x0 + vw), 0, W), gy1 = clamp(Math.ceil(y0 + vh), 0, H);
  if (gx1 > gx0 && gy1 > gy0) ctx.drawImage(GROUND, gx0 / 2, gy0 / 2, (gx1 - gx0) / 2, (gy1 - gy0) / 2, gx0, gy0, gx1 - gx0, gy1 - gy0);
  drawDecals();
  for (const o of OBST) if (o.kind === 'rock' && inView(o.x, o.y, 40)) drawRock(o);
  for (const c of CHESTS) if ((!c.req || c.req()) && inView(c.x, c.y, 40)) drawChest(c);
  drawPuzzles();
  for (const o of OBST) if (o.kind === 'tree' && inView(o.x, o.y, 30)) { shadow(o.x, o.y + 3, o.r, o.r * 0.6, 0.35); ctx.fillStyle = '#3b2d1c'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.7, 0, TAU); ctx.fill(); }
  for (const w of WALLS) if (inView(w.x + w.w / 2, w.y + w.h / 2, Math.max(w.w, w.h))) drawWall(w);
  drawGates();
  const list = enemies.filter(e => inView(e.x, e.y, 80));
  if (boss) list.push(boss);
  if (dragon && (dragon.z || 0) <= 40) list.push(dragon);
  if (fb && (fb.z || 0) <= 40) list.push(fb);
  if (G.mode !== 'title') list.push(P);
  list.sort((a, b) => a.y - b.y);
  for (const e of list) { if (e === P) drawPlayer(); else if (e.isBoss) drawBoss(); else if (e.isDragon) drawDragon(); else if (e.isFinal) drawFinal(); else drawEnemy(e); }
  if (P.lock && !P.lock.dead) {
    const l = P.lock, y = l.y - (l.z || 0);
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(l.x, y, 3.5, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(l.x, y, 9, 0, TAU); ctx.stroke();
  }
  drawProjs(); drawAoeFx(); drawParts(); drawCanopies(); drawBarrier();
  if (dragon && (dragon.z || 0) > 40) drawDragon();
  if (fb && (fb.z || 0) > 40) drawFinal();
  drawGraceBeams();
  if (P.x > MAPW && VIEW.x0 < MAPW + 90) {
    // Cõi Vàng tách biệt: che thế giới chính phía sau vực tối
    ctx.fillStyle = '#07060b'; ctx.fillRect(VIEW.x0 - 20, VIEW.y0 - 20, MAPW + 90 - VIEW.x0 + 20, VIEW.y1 - VIEW.y0 + 40);
    const gr = ctx.createLinearGradient(MAPW + 90, 0, MAPW + 240, 0);
    gr.addColorStop(0, '#07060b'); gr.addColorStop(1, 'rgba(7,6,11,0)');
    ctx.fillStyle = gr; ctx.fillRect(MAPW + 90, VIEW.y0 - 20, 150, VIEW.y1 - VIEW.y0 + 40);
  }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const top = ctx.createLinearGradient(0, 0, 0, CH * 0.5);
  top.addColorStop(0, `rgba(255,205,110,${cam.y < 900 ? 0.14 : 0.06})`); top.addColorStop(1, 'rgba(255,205,110,0)');
  ctx.fillStyle = top; ctx.fillRect(0, 0, CW, CH * 0.5);
  ctx.fillStyle = VIGNETTE; ctx.fillRect(0, 0, CW, CH);
  if (G.flash > 0) { ctx.fillStyle = `rgba(150,10,10,${G.flash * 0.35})`; ctx.fillRect(0, 0, CW, CH); }
  if (G.mode !== 'title') drawHUD();
  if (G.mode === 'map') drawMap();
  if (G.white > 0) { ctx.fillStyle = `rgba(255,246,220,${G.white})`; ctx.fillRect(0, 0, CW, CH); }
  if (G.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${G.fade})`; ctx.fillRect(0, 0, CW, CH); }
}

// ───────────────────────── HUD ─────────────────────────
function bar(x, y, w, h, frac, ghost, col) {
  ctx.fillStyle = 'rgba(8,7,5,.78)'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.strokeStyle = 'rgba(214,178,94,.42)'; ctx.lineWidth = 1; ctx.strokeRect(x - 2.5, y - 2.5, w + 5, h + 5);
  if (ghost != null) { ctx.fillStyle = '#d9b85c'; ctx.fillRect(x, y, w * clamp(ghost, 0, 1), h); }
  ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(frac, 0, 1), h);
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(x, y, w * clamp(frac, 0, 1), Math.max(1, h * 0.3));
}
function textC(str, x, y, font, col, shadowA = 0.8) {
  ctx.font = font; ctx.textAlign = 'center';
  ctx.fillStyle = `rgba(0,0,0,${shadowA})`; ctx.fillText(str, x + 1, y + 2);
  ctx.fillStyle = col; ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}
function spacedFont(px, weight = 600) { return `${weight} ${px}px ${FONT_D}`; }
function drawHUD() {
  const x = 20, y = 20, maxW = CW - 40;
  bar(x, y, Math.min(maxW * 0.7, P.maxHp * 1.25), 11, P.hp / P.maxHp, P.ghost / P.maxHp, P.poisonT > 0 ? '#86408f' : '#a3201c');
  const fpW = Math.min(maxW * 0.6, P.maxFp * 1.7);
  bar(x, y + 19, fpW, 6, P.fp / P.maxFp, null, '#3d5fc6');
  if (G.fpWarn > 0 && Math.sin(G.fpWarn * 30) > 0) { ctx.strokeStyle = '#e0503c'; ctx.lineWidth = 2; ctx.strokeRect(x - 3, y + 16, fpW + 6, 12); ctx.lineWidth = 1; }
  const stW = Math.min(maxW * 0.6, P.maxSt * 1.9);
  bar(x, y + 31, stW, 6, P.st / P.maxSt, null, '#4f8f3e');
  if (P.poisonB > 0 || P.poisonT > 0) {
    const pw = stW;
    ctx.fillStyle = 'rgba(8,7,5,.7)'; ctx.fillRect(x, y + 41, pw, 4);
    ctx.fillStyle = '#b07ac4'; ctx.fillRect(x, y + 41, pw * (P.poisonT > 0 ? P.poisonT / 14 : P.poisonB / 100), 4);
    ctx.font = `500 11px ${FONT_U}`; ctx.fillStyle = '#c99ad8'; ctx.fillText(P.poisonT > 0 ? 'Trúng độc' : 'Độc tích tụ', x + pw + 10, y + 40);
  }
  // bình máu
  const fx = x, fy = y + 48, fs = 40;
  ctx.fillStyle = 'rgba(8,7,5,.72)'; ctx.fillRect(fx, fy, fs, fs);
  ctx.strokeStyle = 'rgba(214,178,94,.5)'; ctx.strokeRect(fx + 0.5, fy + 0.5, fs - 1, fs - 1);
  const has = P.flasks > 0;
  ctx.fillStyle = has ? '#b3261e' : '#4a4640';
  ctx.beginPath(); ctx.arc(fx + fs / 2, fy + fs / 2 + 4, 10, 0, TAU); ctx.fill();
  ctx.fillRect(fx + fs / 2 - 3.5, fy + 8, 7, 9);
  ctx.fillStyle = '#c9b48a'; ctx.fillRect(fx + fs / 2 - 4.5, fy + 6, 9, 3);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(fx + fs / 2 - 4, fy + fs / 2 + 1, 3, 0, TAU); ctx.fill();
  ctx.font = `600 13px ${FONT_U}`; ctx.fillStyle = '#ece3cc'; ctx.textAlign = 'right'; ctx.fillText(String(P.flasks), fx + fs - 3, fy + fs - 4); ctx.textAlign = 'left';
  if (!G.touch) { ctx.font = `500 11px ${FONT_U}`; ctx.fillStyle = 'rgba(236,227,204,.55)'; ctx.fillText('R', fx + fs + 7, fy + fs - 4); }
  const wx = fx + fs + (G.touch ? 8 : 20), Wp = WEAPONS[S.equipped];
  ctx.fillStyle = 'rgba(8,7,5,.72)'; ctx.fillRect(wx, fy, fs, fs);
  ctx.strokeStyle = 'rgba(214,178,94,.5)'; ctx.strokeRect(wx + 0.5, fy + 0.5, fs - 1, fs - 1);
  ctx.save(); ctx.translate(wx + fs / 2, fy + fs / 2); ctx.rotate(-Math.PI / 4);
  ctx.strokeStyle = Wp.look.wcol; ctx.lineWidth = S.equipped === 'greatsword' ? 4.5 : 2.5;
  ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(14, 0); ctx.stroke();
  ctx.strokeStyle = '#8a7342'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-7, -5); ctx.lineTo(-7, 5); ctx.stroke();
  ctx.restore();
  ctx.font = `500 12px ${FONT_U}`; ctx.fillStyle = '#ece3cc';
  ctx.fillText(Wp.name + (S.weaponLv ? ' +' + S.weaponLv : ''), wx + fs + 8, fy + 17);
  ctx.font = `500 11px ${FONT_U}`; ctx.fillStyle = P.mounted ? '#b9d8ff' : 'rgba(236,227,204,.55)';
  ctx.fillText(P.mounted ? 'Đang cưỡi ngựa' : G.touch ? 'Bấm Vũ khí để đổi' : 'Phím ← → để đổi', wx + fs + 8, fy + 33);
  // rune
  const rx = CW - 20, ry = G.touch ? 32 : CH - 26;
  ctx.font = `600 18px ${FONT_U}`; ctx.textAlign = 'right';
  const rstr = S.runes.toLocaleString('vi-VN');
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(rstr, rx + 1, ry + 2); ctx.fillStyle = '#ece3cc'; ctx.fillText(rstr, rx, ry);
  const tw = ctx.measureText(rstr).width;
  ctx.fillStyle = '#e2c26c'; ctx.beginPath(); const dx = rx - tw - 14, dy = ry - 6; ctx.moveTo(dx, dy - 7); ctx.lineTo(dx + 5, dy); ctx.lineTo(dx, dy + 7); ctx.lineTo(dx - 5, dy); ctx.closePath(); ctx.fill();
  if (G.runeGain > 0) { ctx.font = `500 14px ${FONT_U}`; ctx.fillStyle = `rgba(242,220,151,${Math.min(1, G.runeGainT)})`; ctx.fillText('+' + G.runeGain.toLocaleString('vi-VN'), rx, ry + (G.touch ? 22 : -24)); }
  ctx.textAlign = 'left';
  // lời nhắc tương tác
  if (G.prompt && G.mode === 'play') {
    const txt = G.prompt.text, py = CH * (G.touch ? 0.56 : 0.7);
    ctx.font = `500 15px ${FONT_U}`;
    const w = ctx.measureText(txt).width + (G.prompt.key ? 40 : 24);
    ctx.fillStyle = 'rgba(10,9,7,.78)'; ctx.fillRect(CW / 2 - w / 2, py - 20, w, 32);
    ctx.strokeStyle = 'rgba(214,178,94,.4)'; ctx.strokeRect(CW / 2 - w / 2 + 0.5, py - 19.5, w - 1, 31);
    let tx = CW / 2 - w / 2 + 12;
    if (G.prompt.key) { ctx.strokeStyle = '#f2dc97'; ctx.strokeRect(tx, py - 12, 18, 17); ctx.fillStyle = '#f2dc97'; ctx.font = `600 11px ${FONT_U}`; ctx.fillText(G.prompt.key, tx + 5, py + 1); tx += 28; }
    ctx.font = `500 15px ${FONT_U}`; ctx.fillStyle = '#ece3cc'; ctx.fillText(txt, tx, py + 2);
  }
  // thanh máu boss
  let subY = CH - 110;
  const hb = G.finalFight && fb && !fb.dead ? fb : G.bossFight && boss && boss.state !== 'dormant' ? boss : G.dragonFight && dragon && !dragon.dead ? dragon
    : enemies.find(e => e.T.bar && !e.dead && e.state !== 'idle' && e.state !== 'return' && dist(P.x, P.y, e.x, e.y) < 650) || null;
  if (hb) {
    const bw = Math.min(CW - 48, 640), bx = (CW - bw) / 2, by = G.touch ? CH - 250 : CH - 60;
    ctx.font = `600 ${CW < 500 ? 17 : 21}px ${FONT_D}`; ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillText(hb.name, bx + 1, by - 11);
    ctx.fillStyle = '#ece3cc'; ctx.fillText(hb.name, bx, by - 12);
    bar(bx, by, bw, 9, hb.hp / hb.maxHp, (hb.ghost ?? hb.hp) / hb.maxHp, '#8e1c16');
    subY = by - 50;
  } else if (G.touch) subY = CH - 280;
  // phụ đề
  if (G.sub) {
    const a = Math.min(1, G.sub.t * 3, (G.sub.dur - G.sub.t) * 2);
    ctx.globalAlpha = a;
    wrapText(G.sub.text, CW / 2, subY, Math.min(CW - 40, 640), 24, `500 italic ${CW < 500 ? 18 : 21}px ${FONT_I}`, '#f1e8d0');
    ctx.globalAlpha = 1;
  }
  if (G.toast) {
    const a = Math.min(1, G.toast.t * 4, (2.4 - G.toast.t) * 2);
    ctx.globalAlpha = a; textC(G.toast.text, CW / 2, CH * (G.touch ? 0.5 : 0.62), `500 14px ${FONT_U}`, '#f2dc97'); ctx.globalAlpha = 1;
  }
  // tên vùng
  if (G.region && G.regionT < 4 && G.mode === 'play') {
    const a = Math.min(1, G.regionT * 1.5, (4 - G.regionT) * 1.2);
    ctx.globalAlpha = a;
    const fs2 = CW < 500 ? 24 : 32;
    textC(G.region, CW / 2, CH * 0.24, spacedFont(fs2), '#ece3cc');
    ctx.font = spacedFont(fs2); const w = ctx.measureText(G.region).width;
    ctx.strokeStyle = 'rgba(214,178,94,.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(CW / 2 - w / 2 - 10, CH * 0.24 + 12); ctx.lineTo(CW / 2 + w / 2 + 10, CH * 0.24 + 12); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (G.banner) drawBanner(G.banner);
  if (G.mode === 'dead') drawDeath();
  if (!G.touch && G.hintT < 22 && G.mode === 'play') {
    ctx.globalAlpha = Math.min(1, (22 - G.hintT) / 2) * 0.75;
    ctx.font = `500 12px ${FONT_U}`; ctx.fillStyle = '#d8ccb0';
    ctx.fillText('Space lăn (giữ: chạy) · Chuột trái đánh · Shift+trái đánh mạnh · Chuột phải đỡ · Shift+phải phép · R bình · E tương tác · Q khóa · G bản đồ', 20, CH - 22);
    ctx.globalAlpha = 1;
  }
}
const MAP_LABELS = [['Pháo Đài Đá Xám', 3600, 900], ['Rừng Linh Hồn', 3650, 2180], ['Đấu Trường Thử Thách', 3600, 3230], ['Cao Nguyên Tro Đông', 3700, 1580], ['Đồng Cỏ Sương Mờ', 1400, 2620], ['Tàn Tích Phía Tây', 700, 1900], ['Đầm Lầy Tro Độc', 2420, 1520], ['Đấu Trường Varek', 1400, 760], ['Cây Vàng', 1400, 250], ['Nhà Nguyện', 1400, 3480]];
function drawMap() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = 'rgba(8,7,5,.94)'; ctx.fillRect(0, 0, CW, CH);
  const top = 58, bottom = 40, sc = Math.min((CW - 32) / MAPW, (CH - top - bottom) / H), mw = MAPW * sc, mh = H * sc, mx = (CW - mw) / 2, my = top;
  textC('Bản đồ', CW / 2, 36, spacedFont(CW < 500 ? 24 : 30, 700), '#ece3cc');
  ctx.drawImage(GROUND, 0, 0, MAPW / 2, H / 2, mx, my, mw, mh);
  ctx.fillStyle = 'rgba(70,52,24,.3)'; ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = 'rgba(214,178,94,.6)'; ctx.lineWidth = 1; ctx.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
  ctx.fillStyle = '#2a261e';
  for (const w of WALLS) if (!w.void && (wallOn(w, false) || w.gate === 'colo')) ctx.fillRect(mx + w.x * sc, my + w.y * sc, Math.max(1.5, w.w * sc), Math.max(1.5, w.h * sc));
  const pt = (x, y) => [mx + x * sc, my + y * sc];
  ctx.fillStyle = 'rgba(255,214,110,.8)'; { const [x, y] = pt(TREE_POS.x, TREE_POS.y); ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill(); }
  const fs = CW < 500 ? 12 : 15;
  for (const [n, x, y] of MAP_LABELS) { const [px, py] = pt(x, y); textC(n, px, py, `600 ${fs}px ${FONT_D}`, 'rgba(236,227,204,.9)', 0.9); }
  for (const g of GRACES) {
    if (!S.discovered.includes(g.id)) continue;
    const [x, y] = pt(g.x, g.y);
    ctx.fillStyle = '#ffe28a'; ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  }
  for (const c of CHESTS) if (S.chests.includes(c.id)) { const [x, y] = pt(c.x, c.y); ctx.fillStyle = 'rgba(160,120,70,.9)'; ctx.fillRect(x - 3, y - 2, 6, 4); }
  if (S.lost) { const [x, y] = pt(S.lost.x, S.lost.y); ctx.fillStyle = '#9dffb8'; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); }
  const [px, py] = pt(Math.min(P.x, MAPW - 10), P.y), pulse = 1 + Math.sin(G.clock * 6) * 0.15;
  ctx.save(); ctx.translate(px, py); ctx.rotate(P.face); ctx.scale(pulse, pulse);
  ctx.fillStyle = '#e0503c'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -6); ctx.lineTo(-3, 0); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  textC(G.touch ? 'Chạm để đóng · điểm vàng: Ân Điển đã tìm thấy' : 'G / Esc để đóng · điểm vàng: Ân Điển đã tìm thấy · mũi tên đỏ: bạn', CW / 2, CH - 14, `500 12px ${FONT_U}`, 'rgba(236,227,204,.7)');
}
function wrapText(str, cx, y, maxW, lh, font, col) {
  ctx.font = font;
  const words = str.split(' '), lines = [];
  let line = '';
  for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line);
  lines.forEach((l, i) => textC(l, cx, y + i * lh - (lines.length - 1) * lh, font, col, 0.9));
}
function drawBanner(b) {
  const a = Math.min(1, b.t * 2, (b.dur - b.t) * 1.2), cy = CH * 0.42;
  ctx.globalAlpha = a;
  const band = ctx.createLinearGradient(0, 0, CW, 0);
  band.addColorStop(0, 'rgba(0,0,0,0)'); band.addColorStop(0.5, 'rgba(0,0,0,.62)'); band.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = band; ctx.fillRect(0, cy - 52, CW, 96);
  const small = CW < 520;
  if (b.kind === 'felled') {
    const sc = 1 + b.t * 0.02;
    ctx.save(); ctx.translate(CW / 2, cy); ctx.scale(sc, sc);
    textC(b.title, 0, 14, spacedFont(small ? 30 : 52, 700), '#f0d27f');
    ctx.restore();
  } else if (b.kind === 'grace') {
    textC(b.title, CW / 2, cy + 4, spacedFont(small ? 26 : 38, 700), '#f0d27f');
    textC(b.sub, CW / 2, cy + 32, `500 14px ${FONT_U}`, '#ece3cc');
  } else {
    textC('Nhận được', CW / 2, cy - 22, `500 12px ${FONT_U}`, '#a89b7d');
    textC(b.title, CW / 2, cy + 8, spacedFont(small ? 26 : 32, 700), '#ece3cc');
    textC(b.sub, CW / 2, cy + 32, `500 14px ${FONT_U}`, '#f2dc97');
  }
  ctx.globalAlpha = 1;
}
function drawDeath() {
  const t = G.deathT;
  if (t < 0.8) return;
  const a = Math.min(1, (t - 0.8) * 1.2) * Math.min(1, (4.6 - t) * 1.5);
  ctx.globalAlpha = a;
  const cy = CH * 0.45;
  const band = ctx.createLinearGradient(0, cy - 70, 0, cy + 70);
  band.addColorStop(0, 'rgba(0,0,0,0)'); band.addColorStop(0.5, 'rgba(0,0,0,.8)'); band.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = band; ctx.fillRect(0, cy - 70, CW, 140);
  const sc = 1 + (t - 0.8) * 0.03;
  ctx.save(); ctx.translate(CW / 2, cy); ctx.scale(sc, sc);
  textC('BẠN ĐÃ CHẾT', 0, 18, spacedFont(CW < 520 ? 44 : 72, 700), '#a3201c', 0.9);
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ───────────────────────── menu HTML ─────────────────────────
const UI = { title: $('title'), pause: $('pause'), grace: $('grace'), ending: $('ending') };
const STAT_INFO = [
  ['vig', 'Sinh Lực', 'Tăng máu tối đa'],
  ['end', 'Bền Bỉ', 'Tăng thể lực cho lăn và đánh'],
  ['str', 'Sức Mạnh', 'Tăng sát thương vũ khí'],
  ['mnd', 'Tâm Trí', 'Tăng FP và sát thương phép'],
];
function setMode(m) {
  G.mode = m;
  $('touch').hidden = !(G.touch && m === 'play');
  keys.clear(); stick.x = 0; stick.y = 0; touchGuard = false; mouseGuard = false; dodgeKey.down = false;
  if (m === 'play' && document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
}
let currentGrace = null;
function openGrace(g) {
  currentGrace = g; setMode('menu');
  $('graceName').textContent = g.name;
  selectTab('level'); renderGrace(); UI.grace.hidden = false;
  setTimeout(() => $('btnLeave').focus({ preventScroll: true }), 30);
}
function closeGrace() { UI.grace.hidden = true; setMode('play'); }
function renderGrace() {
  const cost = levelCost();
  $('lvNum').textContent = S.level;
  $('lvRunes').textContent = S.runes.toLocaleString('vi-VN');
  $('lvCost').textContent = cost.toLocaleString('vi-VN');
  $('lvCost').className = S.runes < cost ? 'short' : '';
  $('statList').innerHTML = STAT_INFO.map(([k, n, d]) =>
    `<li><div class="nm"><span>${n}</span><span>${d}</span></div><span class="val">${S.stats[k]}</span><button class="plus" data-stat="${k}" aria-label="Tăng ${n}" ${S.runes < cost ? 'disabled' : ''}>+</button></li>`).join('');
  const rows = [['Quái mạnh thêm', '+' + Math.round((lvHp() - 1) * 100) + '%'], ['Máu', maxHp()], ['Thể lực', maxSt()], ['FP', maxFp()], ['Sát thương', Math.round(weaponDmg())], ['Phép', Math.round(spellDmg())], ['Bình Máu', S.flaskMax]];
  $('derived').innerHTML = rows.map(([k, v]) => `<div><dt class="k">${k}</dt><dd><b>${v}</b></dd></div>`).join('');
  const list = GRACES.filter(g => S.discovered.includes(g.id));
  $('gearList').innerHTML = WEAPON_ORDER.filter(w => S.weapons.includes(w)).map(w => `<li><button data-weapon="${w}"><span>${WEAPONS[w].name}<br><small>${WEAPONS[w].desc}</small></span><small>${w === S.equipped ? 'Đang dùng' : 'Trang bị'}</small></button></li>`).join('');
  $('travelList').innerHTML = list.map(g => `<li><button data-grace="${g.id}"><span>${g.name}</span><small>${g.id === S.lastGrace ? 'Đang ở đây' : 'Dịch chuyển'}</small></button></li>`).join('');
}
$('statList').addEventListener('click', e => {
  const b = e.target.closest('[data-stat]');
  if (!b) return;
  const cost = levelCost();
  if (S.runes < cost) return;
  S.runes -= cost; S.level++; S.stats[b.dataset.stat]++;
  applyStats(true); save(); SFX.pickup(); renderGrace();
  const nb = $('statList').querySelector(`[data-stat="${b.dataset.stat}"]`);
  if (nb && !nb.disabled) nb.focus(); else $('btnLeave').focus();
});
$('travelList').addEventListener('click', e => {
  const b = e.target.closest('[data-grace]');
  if (!b) return;
  const id = +b.dataset.grace;
  S.lastGrace = id; save();
  UI.grace.hidden = true; respawnAt(id); setMode('play'); G.region = null; SFX.grace();
});
$('gearList').addEventListener('click', e => {
  const b = e.target.closest('[data-weapon]');
  if (b && equip(b.dataset.weapon)) renderGrace();
});
function selectTab(which) {
  $('tabLevel').setAttribute('aria-selected', String(which === 'level'));
  $('tabTravel').setAttribute('aria-selected', String(which === 'travel'));
  $('tabGear').setAttribute('aria-selected', String(which === 'gear'));
  $('paneLevel').hidden = which !== 'level'; $('paneTravel').hidden = which !== 'travel'; $('paneGear').hidden = which !== 'gear';
}
$('tabLevel').onclick = () => selectTab('level');
$('tabTravel').onclick = () => selectTab('travel');
$('tabGear').onclick = () => selectTab('gear');
$('btnLeave').onclick = closeGrace;

function toggleMap() {
  if (G.mode === 'play') { setMode('map'); SFX.glint(); }
  else if (G.mode === 'map') setMode('play');
}
function togglePause() {
  if (G.mode === 'map') { toggleMap(); return; }
  if (G.mode === 'play') { setMode('pause'); UI.pause.hidden = false; $('btnResume').focus({ preventScroll: true }); }
  else if (G.mode === 'pause') { UI.pause.hidden = true; setMode('play'); }
  else if (G.mode === 'menu' && !UI.grace.hidden) closeGrace();
  else if (G.mode === 'menu' && !UI.ending.hidden) closeEnding();
}
function toggleMute() { muted = !muted; $('btnSound').textContent = 'Âm thanh: ' + (muted ? 'tắt' : 'bật'); toast(muted ? 'Đã tắt âm thanh' : 'Đã bật âm thanh'); }
$('btnResume').onclick = togglePause;
$('btnSound').onclick = () => { audioInit(); toggleMute(); };
$('btnQuit').onclick = () => {
  save(); UI.pause.hidden = true; setMode('title'); UI.title.hidden = false; G.bossFight = false;
  $('btnContinue').hidden = !loadSave(); confirmNew = false; $('btnNew').textContent = 'Hành trình mới'; $('btnNew').classList.remove('warn');
};
function openEnding() {
  setMode('menu');
  $('endLv').textContent = S.level; $('endDeaths').textContent = S.deaths;
  const m = Math.floor(S.time / 60), s = Math.floor(S.time % 60);
  $('endTime').textContent = m + ':' + String(s).padStart(2, '0');
  UI.ending.hidden = false; SFX.felled();
  $('btnEndClose').focus({ preventScroll: true });
}
function closeEnding() { UI.ending.hidden = true; setMode('play'); }
$('btnEndClose').onclick = closeEnding;

let confirmNew = false;
function startGame(data) {
  S = data ? Object.assign(defaultSave(), data) : defaultSave();
  S.flaskMax = Math.min(S.flaskMax, FLASK_CAP);
  UI.title.hidden = true; parts.length = 0;
  G.endingShown = S.treeReached && S.finalDead; G.hintT = data ? 99 : 0; G.region = null; G.timers.length = 0;
  respawnAt(S.lastGrace); setMode('play');
  if (!data) later(1.2, () => subtitle('“Hỡi Kẻ Nhạt Phai... Ân Điển sẽ dẫn lối. Hãy đi về phía bắc, tới Cây Vàng.”', 5.5));
  save();
}
$('btnContinue').onclick = () => { audioInit(); startGame(loadSave()); };
$('btnNew').onclick = () => {
  audioInit();
  if (loadSave() && !confirmNew) { confirmNew = true; $('btnNew').textContent = 'Xoá tiến trình cũ và bắt đầu?'; $('btnNew').classList.add('warn'); return; }
  startGame(null);
};
if (loadSave()) $('btnContinue').hidden = false;
window.addEventListener('pagehide', () => { if (G.mode !== 'title') save(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode === 'play') togglePause(); });

spawnEnemies();
boss = makeBoss();
dragon = makeDragon();
requestAnimationFrame(frame);
})();
