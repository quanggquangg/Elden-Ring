'use strict';
// Gravebound — Dữ liệu trang bị, phép thuật, lớp nhân vật, cửa hàng và kẻ địch
// ───────────────────────── vật phẩm ─────────────────────────
const ITEMDEF = {
  stone1: { name: 'Đá Rèn I', desc: 'Cường hóa vũ khí thường từ +1 tới +3', kind: 'mat' },
  stone2: { name: 'Đá Rèn II', desc: 'Cường hóa vũ khí thường từ +4 tới +6', kind: 'mat' },
  stone3: { name: 'Đá Rèn III', desc: 'Cường hóa vũ khí thường từ +7 tới +9', kind: 'mat' },
  somber1: { name: 'Đá Rèn U Ám I', desc: 'Cường hóa vũ khí đặc biệt lên +1, +2', kind: 'mat' },
  somber2: { name: 'Đá Rèn U Ám II', desc: 'Cường hóa vũ khí đặc biệt từ +3 tới +5', kind: 'mat' },
  firepot: { name: 'Bình Lửa', desc: 'Ném ra, nổ tung gây sát thương lửa', kind: 'use', max: 10, col: '#ff9a4a' },
  knife: { name: 'Dao Ném', desc: 'Ném rất nhanh, sát thương nhỏ', kind: 'use', max: 20, col: '#d8d0bc' },
  cure: { name: 'Thuốc Giải Độc', desc: 'Giải độc và xóa độc tích tụ', kind: 'use', max: 10, col: '#9fd05a' },
  grease: { name: 'Dầu Thánh', desc: 'Phủ vũ khí sức mạnh thánh trong 40 giây', kind: 'use', max: 10, col: '#ffe08a' },
  grune1: { name: 'Rune Vàng Nhỏ', desc: 'Bóp vỡ để nhận 400 rune', kind: 'use', max: 99, col: '#f3cf6e' },
  grune2: { name: 'Rune Vàng Lớn', desc: 'Bóp vỡ để nhận 1500 rune', kind: 'use', max: 99, col: '#ffd76a' },
  crystalkey: { name: 'Chìa Khóa Pha Lê', desc: 'Mở cổng Học Viện Starhollow', kind: 'key' },
};
const USE_ORDER = ['firepot', 'knife', 'cure', 'grease', 'grune1', 'grune2'];

// ───────────────────────── vũ khí ─────────────────────────
// base: sát thương gốc; sc: hệ số theo chỉ số (S > A > B > C > D > E); req: chỉ số tối thiểu; wt: trọng lượng
// Vũ khí thường cường hóa tới +9 bằng Đá Rèn, vũ khí đặc biệt (somber) tới +5 bằng Đá Rèn U Ám.
const LETTER = { S: 1.5, A: 1.2, B: 0.95, C: 0.7, D: 0.45, E: 0.25 };
const DT_NAME = { phys: 'Vật lý', magic: 'Ma thuật', fire: 'Lửa', holy: 'Thánh', light: 'Sét' };
const STAT_NAME = { vig: 'Sinh Lực', mnd: 'Tâm Trí', end: 'Bền Bỉ', str: 'Sức Mạnh', dex: 'Khéo Léo', int: 'Trí Tuệ', fai: 'Đức Tin' };
const STAT_SHORT = { str: 'Sức', dex: 'Khéo', int: 'Trí', fai: 'Tín' };
const S_ = (anim, wind, act, rec, mul, range, arc, lunge, poise, o = {}) => Object.assign({ anim, wind, act, rec, mul, range, arc, lunge, poise }, o);
const WEAPONS = {
  broken: {
    name: 'Kiếm Gãy', desc: 'Lưỡi kiếm mẻ, ngắn và yếu', type: 'melee', dt: 'phys', base: 15, sc: { str: 'E', dex: 'E' }, req: { str: 6 }, wt: 2, ash: 'lunge',
    look: { weapon: 'sword', wlen: 26, wcol: '#9a958a' }, cost: [11, 22],
    light: [S_('slash', 0.12, 0.1, 0.26, 0.75, 56, 2.0, 160, 10, { swing: 1 }), S_('slash', 0.1, 0.1, 0.26, 0.8, 56, 2.0, 160, 10, { swing: -1 }), S_('thrust', 0.14, 0.1, 0.34, 0.95, 66, 0.8, 220, 14, { thrust: true })],
    heavy: S_('overhead', 0.46, 0.12, 0.44, 1.7, 66, 1.2, 200, 38, { off: 50, r: 44 }),
  },
  dagger: {
    name: 'Dao Mẻ', desc: 'Rất nhanh, đâm chí mạng đau hơn', type: 'melee', dt: 'phys', base: 12, sc: { str: 'E', dex: 'C' }, req: { dex: 8 }, wt: 1.5, crit: 1.35, bleed: [8, 14], ash: 'lunge',
    look: { weapon: 'sword', wlen: 18, wcol: '#c8c4b8' }, cost: [7, 16],
    light: [S_('slash', 0.07, 0.08, 0.18, 0.7, 50, 1.8, 170, 8, { swing: 1 }), S_('slash', 0.06, 0.08, 0.18, 0.72, 50, 1.8, 170, 8, { swing: -1 }), S_('thrust', 0.08, 0.08, 0.24, 0.85, 58, 0.8, 220, 10, { thrust: true })],
    heavy: S_('dash', 0.3, 0.14, 0.32, 1.45, 60, 1.0, 0, 26, { dashSpeed: 800, thrust: true }),
  },
  sword: {
    name: 'Kiếm Thẳng', desc: 'Cân bằng, đáng tin cậy', type: 'melee', dt: 'phys', base: 20, sc: { str: 'D', dex: 'D' }, req: { str: 10, dex: 10 }, wt: 3.5, ash: 'lunge',
    look: { weapon: 'sword', wlen: 38, wcol: '#dcdcd2' }, cost: [11, 22],
    light: [S_('slash', 0.12, 0.1, 0.26, 1, 66, 2.0, 170, 14, { swing: 1 }), S_('slash', 0.1, 0.1, 0.26, 1.05, 66, 2.0, 170, 14, { swing: -1 }), S_('thrust', 0.14, 0.1, 0.34, 1.3, 86, 0.8, 260, 22, { thrust: true })],
    heavy: S_('overhead', 0.46, 0.12, 0.44, 2.3, 80, 1.2, 230, 50, { off: 60, r: 56, shake: 5 }),
  },
  rapier: {
    name: 'Kiếm Liễu', desc: 'Kiếm đâm mảnh, tầm xa, chí mạng cao', type: 'melee', dt: 'phys', base: 19, sc: { str: 'E', dex: 'B' }, req: { str: 8, dex: 14 }, wt: 3, crit: 1.3, ash: 'lunge',
    look: { weapon: 'spear', wlen: 40, wcol: '#e6e6ee' }, cost: [9, 20],
    light: [S_('thrust', 0.09, 0.09, 0.22, 0.9, 88, 0.7, 140, 10, { thrust: true }), S_('thrust', 0.08, 0.09, 0.22, 0.92, 88, 0.7, 140, 10, { thrust: true }), S_('thrust', 0.1, 0.1, 0.3, 1.15, 94, 0.7, 220, 14, { thrust: true })],
    heavy: S_('dash', 0.4, 0.16, 0.36, 1.9, 100, 0.8, 0, 32, { dashSpeed: 900, thrust: true }),
  },
  katana: {
    name: 'Uchigatana Tro', desc: 'Nhanh, gây chảy máu', type: 'melee', dt: 'phys', base: 19, sc: { str: 'E', dex: 'B' }, req: { str: 10, dex: 14 }, wt: 5.5, bleed: [16, 30], ash: 'unsheathe',
    look: { weapon: 'katana', wlen: 42, wcol: '#e8ecf2' }, cost: [9, 20],
    light: [S_('slash', 0.09, 0.09, 0.22, 0.85, 70, 2.1, 180, 10, { swing: 1 }), S_('slash', 0.08, 0.09, 0.22, 0.9, 70, 2.1, 180, 10, { swing: -1 }), S_('spin', 0.12, 0.22, 0.3, 1.15, 76, TAU, 120, 16, { turns: 1 })],
    heavy: S_('dash', 0.36, 0.16, 0.38, 1.95, 74, 1.5, 0, 34, { dashSpeed: 950, swing: -1 }),
  },
  spear: {
    name: 'Giáo Kỵ Sĩ', desc: 'Đâm xa, góc đánh hẹp', type: 'melee', dt: 'phys', base: 21, sc: { str: 'C', dex: 'D' }, req: { str: 12, dex: 11 }, wt: 6, ash: 'lunge',
    look: { weapon: 'spear', wlen: 58, wcol: '#d2ccba' }, cost: [10, 22],
    light: [S_('thrust', 0.12, 0.1, 0.28, 0.95, 104, 0.75, 120, 12, { thrust: true }), S_('thrust', 0.1, 0.1, 0.28, 0.95, 104, 0.75, 120, 12, { thrust: true }), S_('slash', 0.16, 0.13, 0.36, 1.15, 100, 2.4, 150, 18, { swing: 1 })],
    heavy: S_('dash', 0.5, 0.2, 0.45, 2.1, 118, 0.9, 0, 42, { dashSpeed: 700, thrust: true }),
  },
  axe: {
    name: 'Rìu Chiến Binh', desc: 'Một tay, chặt mạnh, phá thế tốt', type: 'melee', dt: 'phys', base: 24, sc: { str: 'B' }, req: { str: 15 }, wt: 6, ash: 'whirl',
    look: { weapon: 'axe', wlen: 36, wcol: '#b8b2a4' }, cost: [13, 26],
    light: [S_('slash', 0.15, 0.11, 0.3, 1.05, 64, 2.2, 170, 20, { swing: 1 }), S_('slash', 0.13, 0.11, 0.3, 1.1, 64, 2.2, 170, 20, { swing: -1 }), S_('overhead', 0.2, 0.12, 0.4, 1.35, 70, 1.2, 200, 30, { off: 52, r: 50, shake: 4 })],
    heavy: S_('overhead', 0.5, 0.13, 0.46, 2.4, 74, 1.2, 230, 62, { off: 56, r: 60, shake: 6 }),
  },
  crystalsword: {
    name: 'Kiếm Pha Lê', desc: 'Lưỡi kiếm pha lê, gây sát thương ma thuật', type: 'melee', dt: 'magic', base: 21, sc: { str: 'D', int: 'B' }, req: { str: 10, int: 16 }, wt: 5, ash: 'crystal', unique: true,
    look: { weapon: 'sword', wlen: 40, wcol: '#bfe4ff', glow: '#9fd0ff' }, cost: [12, 24],
    light: [S_('slash', 0.12, 0.1, 0.27, 1, 68, 2.0, 170, 16, { swing: 1 }), S_('slash', 0.1, 0.1, 0.27, 1.05, 68, 2.0, 170, 16, { swing: -1 }), S_('thrust', 0.14, 0.1, 0.34, 1.3, 88, 0.8, 250, 22, { thrust: true })],
    heavy: S_('overhead', 0.46, 0.12, 0.44, 2.3, 80, 1.2, 230, 50, { off: 60, r: 58, shake: 5 }),
  },
  royalsword: {
    name: 'Kiếm Hoàng Gia', desc: 'Kiếm của nhà vô địch hoàng gia, pha sức mạnh thánh', type: 'melee', dt: 'holy', base: 30, sc: { str: 'C', dex: 'C', fai: 'C' }, req: { str: 16, dex: 14, fai: 12 }, wt: 8, somber: true, unique: true, ash: 'holy',
    look: { weapon: 'sword', wlen: 46, wcol: '#ffe7a0', glow: '#ffd76a' }, cost: [13, 26],
    light: [S_('slash', 0.13, 0.11, 0.28, 1.05, 76, 2.2, 180, 20, { swing: 1 }), S_('slash', 0.11, 0.11, 0.28, 1.1, 76, 2.2, 180, 20, { swing: -1 }), S_('spin', 0.14, 0.22, 0.34, 1.3, 82, TAU, 120, 26, { turns: 1 })],
    heavy: S_('overhead', 0.48, 0.13, 0.46, 2.4, 86, 1.2, 240, 56, { off: 64, r: 66, shake: 6, wave: true }),
  },
  varek: {
    name: 'Kiếm Vàng Varek', desc: 'Hai tay. Đòn mạnh phóng ra sóng ánh vàng', type: 'melee', dt: 'phys', base: 30, sc: { str: 'C', dex: 'D' }, req: { str: 16, dex: 10 }, wt: 10, somber: true, unique: true, twoHanded: true, ash: 'wave',
    look: { weapon: 'greatsword', wlen: 44, wcol: '#e0c068', glow: true }, cost: [14, 28],
    light: [S_('slash', 0.15, 0.11, 0.3, 1.25, 76, 2.2, 190, 20, { swing: 1 }), S_('slash', 0.13, 0.11, 0.3, 1.3, 76, 2.2, 190, 20, { swing: -1 }), S_('overhead', 0.2, 0.13, 0.42, 1.6, 82, 1.2, 240, 30, { off: 70, r: 66, shake: 5 })],
    heavy: S_('overhead', 0.55, 0.15, 0.5, 2.6, 88, 1.2, 260, 60, { off: 72, r: 78, wave: true, shake: 8 }),
  },
  greatsword: {
    name: 'Đại Kiếm Nanh Rồng', desc: 'Hai tay. Chậm, cực mạnh, không bị ngắt đòn', type: 'melee', dt: 'phys', base: 36, sc: { str: 'B' }, req: { str: 22 }, wt: 16, somber: true, unique: true, twoHanded: true, hyper: true, ash: 'quake',
    look: { weapon: 'greatsword', wlen: 52, wcol: '#c9b48a' }, cost: [22, 36],
    light: [S_('slash', 0.3, 0.14, 0.45, 1.9, 94, 2.6, 200, 38, { swing: 1 }), S_('slash', 0.28, 0.14, 0.5, 2.0, 94, 2.6, 200, 38, { swing: -1 }), S_('overhead', 0.36, 0.15, 0.55, 2.3, 96, 1.2, 220, 55, { off: 78, r: 80, shake: 8 })],
    heavy: S_('spin', 0.6, 0.36, 0.6, 3.2, 104, TAU, 100, 90, { turns: 1 }),
  },
  greataxe: {
    name: 'Đại Rìu Sườn Núi', desc: 'Hai tay. Bổ xuống làm rung chuyển mặt đất', type: 'melee', dt: 'phys', base: 38, sc: { str: 'A' }, req: { str: 26 }, wt: 15, twoHanded: true, hyper: true, ash: 'quake',
    look: { weapon: 'axe', wlen: 48, wcol: '#a8a298' }, cost: [22, 36],
    light: [S_('slash', 0.32, 0.14, 0.48, 1.9, 92, 2.5, 200, 44, { swing: 1 }), S_('overhead', 0.34, 0.14, 0.52, 2.1, 92, 1.2, 200, 56, { off: 74, r: 76, shake: 8 })],
    heavy: S_('overhead', 0.8, 0.16, 0.62, 3.3, 96, 1.2, 220, 110, { off: 60, r: 116, shake: 14, quake: true }),
  },
  hammer: {
    name: 'Chùy Vệ Binh', desc: 'Hai tay. Phá thế cực mạnh, không bị ngắt đòn', type: 'melee', dt: 'phys', base: 32, sc: { str: 'A' }, req: { str: 20 }, wt: 14, somber: true, unique: true, twoHanded: true, hyper: true, ash: 'quake',
    look: { weapon: 'club', wlen: 44, wcol: '#8f8a80' }, cost: [20, 34],
    light: [S_('overhead', 0.3, 0.13, 0.48, 1.8, 84, 1.2, 180, 50, { off: 62, r: 62, shake: 6 }), S_('slash', 0.3, 0.14, 0.52, 1.9, 84, 2.3, 180, 50, { swing: -1 })],
    heavy: S_('overhead', 0.8, 0.16, 0.62, 3.3, 92, 1.2, 220, 120, { off: 55, r: 118, shake: 14, quake: true }),
  },
  scythe: {
    name: 'Liềm Hồn Ma', desc: 'Hai tay. Quét rộng, gây chảy máu', type: 'melee', dt: 'phys', base: 25, sc: { str: 'D', dex: 'C' }, req: { str: 12, dex: 14 }, wt: 8, somber: true, unique: true, twoHanded: true, bleed: [12, 22], ash: 'whirl',
    look: { weapon: 'scythe', wlen: 50, wcol: '#cfefff' }, cost: [13, 26],
    light: [S_('slash', 0.16, 0.13, 0.3, 1.0, 92, 3.0, 150, 16, { swing: 1 }), S_('slash', 0.14, 0.13, 0.3, 1.05, 92, 3.0, 150, 16, { swing: -1 }), S_('spin', 0.18, 0.24, 0.36, 1.3, 96, TAU, 120, 24, { turns: 1 })],
    heavy: S_('spin', 0.5, 0.42, 0.5, 2.2, 98, TAU, 60, 40, { turns: 2 }),
  },
  // cung: hai tay, đánh thường bắn nhanh, đánh mạnh ngắm bắn xuyên giáp
  shortbow: { name: 'Cung Ngắn Cũ', desc: 'Cung hai tay. Bắn nhanh, tầm vừa', type: 'bow', dt: 'phys', base: 14, sc: { str: 'E', dex: 'C' }, req: { str: 7, dex: 9 }, wt: 2, twoHanded: true, ash: 'barrage', look: { weapon: 'bow', wlen: 26, wcol: '#7a6040' }, cost: [6, 14], speed: 620, range: 0.75 },
  longbow: { name: 'Cung Dài Tro', desc: 'Cung hai tay. Mũi tên bay xa và mạnh', type: 'bow', dt: 'phys', base: 21, sc: { str: 'D', dex: 'B' }, req: { str: 10, dex: 14 }, wt: 4, twoHanded: true, ash: 'barrage', look: { weapon: 'bow', wlen: 30, wcol: '#5a4430' }, cost: [7, 16], speed: 760, range: 0.95 },
  goldbow: { name: 'Cung Hoàng Gia', desc: 'Cung hai tay của đội cung thủ hoàng gia, tên mang sức mạnh thánh', type: 'bow', dt: 'holy', base: 27, sc: { dex: 'B', fai: 'D' }, req: { dex: 18, fai: 10 }, wt: 5, twoHanded: true, ash: 'barrage', look: { weapon: 'bow', wlen: 30, wcol: '#d8b45a' }, cost: [7, 16], speed: 820, range: 1 },
  // tay trái: khiên và chất xúc tác phép
  shield: { name: 'Khiên Gỗ', desc: 'Tay trái. Đỡ đòn và phản đòn', hand: 'off', type: 'shield', guard: { chip: 1, st: 1 }, wt: 3 },
  kite: { name: 'Khiên Kỵ Sĩ', desc: 'Tay trái. Khiên sắt chặn tốt hơn nhiều', hand: 'off', type: 'shield', guard: { chip: 0.5, st: 0.72 }, wt: 6, req: { str: 12 } },
  staff0: { name: 'Gậy Gỗ Mục', desc: 'Tay trái. Chất xúc tác để thi triển phép Trí Tuệ', hand: 'off', type: 'staff', sp: 90, sc: { int: 'D' }, req: { int: 10 }, wt: 2 },
  staff1: { name: 'Gậy Học Viện', desc: 'Tay trái. Gậy chuẩn của học viên, tăng mạnh theo Trí Tuệ', hand: 'off', type: 'staff', sp: 100, sc: { int: 'B' }, req: { int: 14 }, wt: 3 },
  staff3: { name: 'Gậy Đá Sao Mỏ', desc: 'Tay trái. Khảm đá sao từ mỏ pha lê', hand: 'off', type: 'staff', sp: 108, sc: { int: 'A' }, req: { int: 20 }, wt: 3, somber: true },
  staff2: { name: 'Gậy Trăng Selvara', desc: 'Tay trái. Gậy của nữ hoàng, mạnh nhất theo Trí Tuệ', hand: 'off', type: 'staff', sp: 118, sc: { int: 'S' }, req: { int: 28 }, wt: 3, somber: true },
  seal0: { name: 'Ấn Gỗ Mục', desc: 'Tay trái. Chất xúc tác để thi triển phép Đức Tin', hand: 'off', type: 'seal', sp: 90, sc: { fai: 'D' }, req: { fai: 10 }, wt: 1.5 },
  seal1: { name: 'Ấn Vàng', desc: 'Tay trái. Ấn thánh, tăng mạnh theo Đức Tin', hand: 'off', type: 'seal', sp: 100, sc: { fai: 'B' }, req: { fai: 14 }, wt: 1.5 },
  seal2: { name: 'Ấn Tro Thánh', desc: 'Tay trái. Ấn cổ của Kinh Thành', hand: 'off', type: 'seal', sp: 112, sc: { fai: 'A' }, req: { fai: 24 }, wt: 1.5, somber: true },
};
const WEAPON_ORDER = ['broken', 'dagger', 'sword', 'rapier', 'katana', 'spear', 'axe', 'crystalsword', 'royalsword', 'varek', 'greatsword', 'greataxe', 'hammer', 'scythe', 'shortbow', 'longbow', 'goldbow'];
const OFF_ORDER = ['shield', 'kite', 'staff0', 'staff1', 'staff3', 'staff2', 'seal0', 'seal1', 'seal2'];
for (const [k, w] of Object.entries(WEAPONS)) { w.id = k; if (!w.hand) w.hand = 'right'; }

// ───────────────────────── giáp (cả bộ) ─────────────────────────
// abs: giảm sát thương nhận vào; poise: đòn yếu hơn ngưỡng này không làm khựng
const ARMORS = {
  rags: { name: 'Áo Vải Rách', desc: 'Gần như không che chắn gì', wt: 1.5, abs: 0.03, poise: 0 },
  squire: { name: 'Giáp Cận Vệ', desc: 'Giáp da và xích nhẹ của cận vệ', wt: 8, abs: 0.11, poise: 14 },
  samurai: { name: 'Giáp Lãng Khách', desc: 'Giáp lá mỏng, nhẹ nhàng', wt: 6, abs: 0.09, poise: 8 },
  robe: { name: 'Áo Choàng Học Giả', desc: 'Nhẹ. Phép Trí Tuệ mạnh hơn 8%, hồi FP nhanh hơn', wt: 3, abs: 0.04, poise: 0, bonus: { sorc: 0.08, fpRegen: 0.6 } },
  priest: { name: 'Áo Tu Sĩ', desc: 'Nhẹ. Phép Đức Tin mạnh hơn 8%, hồi máu nhiều hơn', wt: 4, abs: 0.05, poise: 0, bonus: { incant: 0.08, heal: 0.15 } },
  leather: { name: 'Giáp Da Thợ Săn', desc: 'Nhẹ. Thể lực hồi nhanh hơn', wt: 5, abs: 0.07, poise: 4, bonus: { stRegen: 0.15 } },
  knightset: { name: 'Giáp Kỵ Sĩ Tro', desc: 'Nặng, chắc chắn, chịu đòn tốt', wt: 14, abs: 0.18, poise: 30 },
  crystalset: { name: 'Giáp Pha Lê', desc: 'Nặng. Kháng ma thuật rất tốt', wt: 15, abs: 0.19, poise: 34, bonus: { magicRes: 0.25 } },
  royalset: { name: 'Giáp Hoàng Gia', desc: 'Giáp vàng của cấm vệ quân. Rất nặng', wt: 19, abs: 0.25, poise: 44 },
};
const ARMOR_ORDER = ['rags', 'squire', 'samurai', 'robe', 'priest', 'leather', 'knightset', 'crystalset', 'royalset'];

// ───────────────────────── bùa hộ mệnh ─────────────────────────
const TALISMANS = {
  crimson: { name: 'Bùa Huyết Ngọc', desc: 'Máu tối đa +12%' },
  cerulean: { name: 'Bùa Lam Ngọc', desc: 'FP tối đa +18%' },
  green: { name: 'Bùa Lục Bảo', desc: 'Thể lực tối đa +15%' },
  shieldtal: { name: 'Bùa Khiên Vàng', desc: 'Giảm 12% mọi sát thương nhận vào' },
  claw: { name: 'Bùa Móng Vuốt', desc: 'Đòn mạnh gây thêm 18% sát thương' },
  blade: { name: 'Bùa Lưỡi Kiếm', desc: 'Đòn thường gây thêm 12% sát thương' },
  arrow: { name: 'Bùa Mũi Tên', desc: 'Cung gây thêm 20% sát thương' },
  star: { name: 'Bùa Đá Sao', desc: 'Phép Trí Tuệ mạnh hơn 15%' },
  sun: { name: 'Bùa Thánh Hỏa', desc: 'Phép Đức Tin mạnh hơn 15%' },
  blood: { name: 'Bùa Huyết Nguyệt', desc: 'Tích tụ chảy máu nhanh hơn 40%' },
  feather: { name: 'Bùa Lông Vũ', desc: 'Sức mang vác +20%' },
  gold: { name: 'Bùa Rune Vàng', desc: 'Nhận thêm 20% rune' },
  vital: { name: 'Bùa Tái Sinh', desc: 'Hồi 4% máu mỗi khi hạ một kẻ địch' },
  guard: { name: 'Bùa Khiên Đồng', desc: 'Đỡ đòn mất ít máu và thể lực hơn 35%' },
  // chỉ có ở độ khó Khó và Chuyên gia, rơi ra từ Gravebound Đỏ
  redseal: { name: 'Ấn Gravebound Đỏ', desc: 'Gây thêm 20% sát thương khi máu dưới một nửa' },
  ashen: { name: 'Tim Tro Tàn', desc: 'Hồi 3 máu mỗi giây' },
  crown: { name: 'Mảnh Vương Miện Vỡ', desc: 'Nhận thêm 30% rune, đòn mạnh gây thêm 10% sát thương' },
};
const TAL_ORDER = Object.keys(TALISMANS);

// ───────────────────────── phép thuật ─────────────────────────
// sorc: dùng gậy (Trí Tuệ); incant: dùng ấn (Đức Tin). mul là hệ số sát thương theo sức mạnh phép của chất xúc tác.
const SPELLS = {
  pebble: { name: 'Đá Sao', school: 'sorc', fp: 8, req: { int: 10 }, cast: 0.18, rec: 0.3, mul: 1.0, desc: 'Bắn một viên đá sao nhanh' },
  shard: { name: 'Mảnh Pha Lê', school: 'sorc', fp: 14, req: { int: 14 }, cast: 0.24, rec: 0.36, mul: 0.62, desc: 'Ba mảnh pha lê tỏa hình quạt' },
  blade: { name: 'Lưỡi Kiếm Ánh Trăng', school: 'sorc', fp: 16, req: { int: 18 }, cast: 0.28, rec: 0.4, mul: 1.9, desc: 'Quét lưỡi kiếm ma thuật trước mặt, phá thế mạnh' },
  comet: { name: 'Sao Chổi Pha Lê', school: 'sorc', fp: 24, req: { int: 26 }, cast: 0.6, rec: 0.45, mul: 2.6, desc: 'Tụ lực rồi phóng một sao chổi xuyên qua kẻ địch' },
  meteor: { name: 'Mưa Thiên Thạch', school: 'sorc', fp: 34, req: { int: 34 }, cast: 0.7, rec: 0.5, mul: 1.5, desc: 'Gọi thiên thạch rơi xuống quanh mục tiêu' },
  heal: { name: 'Hồi Phục', school: 'incant', fp: 20, req: { fai: 12 }, cast: 0.5, rec: 0.4, mul: 0, desc: 'Hồi máu theo sức mạnh phép' },
  flame: { name: 'Lửa Thiêng', school: 'incant', fp: 12, req: { fai: 12 }, cast: 0.16, rec: 0.3, mul: 0.5, desc: 'Phun lửa tầm gần trong chốc lát' },
  bolt: { name: 'Tia Sét', school: 'incant', fp: 14, req: { fai: 16 }, cast: 0.3, rec: 0.36, mul: 1.35, desc: 'Phóng tia sét rất nhanh' },
  bless: { name: 'Phúc Lành Vàng', school: 'incant', fp: 22, req: { fai: 18 }, cast: 0.5, rec: 0.4, mul: 0, desc: 'Tăng 15% sát thương và hồi máu dần trong 40 giây' },
  judge: { name: 'Phán Xét Vàng', school: 'incant', fp: 30, req: { fai: 28 }, cast: 0.6, rec: 0.5, mul: 1.8, desc: 'Cột sáng thánh giáng xuống quanh thân' },
};
const SPELL_ORDER = Object.keys(SPELLS);

// ───────────────────────── tro chiến tranh (kỹ năng vũ khí) ─────────────────────────
const ASHES = {
  lunge: { name: 'Đột Kích', fp: 6, desc: 'Lao tới đâm một đòn mạnh' },
  whirl: { name: 'Lốc Xoáy', fp: 10, desc: 'Xoay hai vòng quét quanh thân' },
  quake: { name: 'Địa Chấn', fp: 14, desc: 'Bổ xuống tạo sóng chấn động', heavyOnly: true },
  flame: { name: 'Lưỡi Lửa', fp: 16, desc: 'Phủ lửa lên vũ khí trong 30 giây' },
  holy: { name: 'Lưỡi Thánh', fp: 16, desc: 'Phủ ánh thánh lên vũ khí trong 30 giây' },
  unsheathe: { name: 'Rút Kiếm', fp: 10, desc: 'Thủ thế rồi chém một nhát cực nhanh' },
  wave: { name: 'Sóng Ánh Vàng', fp: 12, desc: 'Chém ra một làn sóng ánh vàng', unique: true },
  crystal: { name: 'Sóng Pha Lê', fp: 12, desc: 'Chém ra một làn sóng pha lê', unique: true },
  barrage: { name: 'Mưa Tên', fp: 10, desc: 'Bắn liền năm mũi tên tỏa quạt', bow: true },
};
const ASH_ORDER = ['lunge', 'whirl', 'quake', 'flame', 'holy', 'unsheathe'];

// ───────────────────────── lớp nhân vật ─────────────────────────
const CLASSES = [
  { id: 'knight', name: 'Hiệp Sĩ', desc: 'Cân bằng, chịu đòn tốt. Kiếm gãy và khiên gỗ.', stats: { vig: 12, mnd: 8, end: 11, str: 13, dex: 10, int: 8, fai: 8 }, weapons: ['broken'], equipped: 'broken', off: 'shield', armor: 'squire', spells: [], flaskFp: 0 },
  { id: 'samurai', name: 'Kiếm Khách', desc: 'Nhanh nhẹn, dựa vào Khéo Léo. Dao mẻ và khiên gỗ.', stats: { vig: 11, mnd: 8, end: 11, str: 9, dex: 15, int: 8, fai: 8 }, weapons: ['dagger'], equipped: 'dagger', off: 'shield', armor: 'samurai', spells: [], flaskFp: 0 },
  { id: 'mage', name: 'Pháp Sư', desc: 'Trí Tuệ cao. Kiếm gãy, gậy gỗ mục và phép Đá Sao.', stats: { vig: 9, mnd: 13, end: 9, str: 8, dex: 9, int: 15, fai: 7 }, weapons: ['broken'], equipped: 'broken', off: 'staff0', armor: 'robe', spells: ['pebble'], flaskFp: 1 },
  { id: 'cleric', name: 'Tu Sĩ', desc: 'Đức Tin cao. Kiếm gãy, ấn gỗ, phép Hồi Phục và Lửa Thiêng.', stats: { vig: 10, mnd: 13, end: 9, str: 10, dex: 8, int: 7, fai: 13 }, weapons: ['broken'], equipped: 'broken', off: 'seal0', armor: 'priest', spells: ['heal', 'flame'], flaskFp: 1 },
  { id: 'hunter', name: 'Thợ Săn', desc: 'Khéo Léo và Bền Bỉ. Cung ngắn cũ và dao mẻ.', stats: { vig: 11, mnd: 9, end: 12, str: 9, dex: 13, int: 8, fai: 8 }, weapons: ['shortbow', 'dagger'], equipped: 'shortbow', off: 'shield', armor: 'leather', spells: [], flaskFp: 0 },
];

// ───────────────────────── cửa hàng ở Sảnh Hearthhold ─────────────────────────
const SHOPS = {
  merchant: {
    name: 'Lái Buôn Kale', line: '“Rune đổi hàng, hàng đổi mạng. Cứ xem thoải mái.”', stock: [
      { item: 'stone1', price: 220 }, { item: 'stone2', price: 700, req: () => S.bossDead, lock: 'Sau khi hạ Varek' }, { item: 'firepot', price: 140 }, { item: 'knife', price: 50 },
      { item: 'cure', price: 90 }, { item: 'grease', price: 220 }, { weapon: 'kite', price: 1400 }, { weapon: 'shortbow', price: 600 },
      { armor: 'leather', price: 900 }, { tal: 'green', price: 1800 }, { quiver: 1, price: 1500, id: 'quiver', name: 'Ống Tên Lớn', desc: 'Mang thêm 20 mũi tên' },
      { mem: 1, price: 3500, id: 'mem_shop', name: 'Đá Ký Ức', desc: 'Thêm một ô phép' },
    ],
  },
  scholar: {
    name: 'Học Giả Lyra', line: '“Tinh tú không nói dối. Muốn học phép thì đưa rune đây.”', stock: [
      { spell: 'pebble', price: 300 }, { spell: 'shard', price: 1600 }, { spell: 'blade', price: 3200 }, { spell: 'meteor', price: 9000, req: () => S.gr.includes('west'), lock: 'Cần Đại Ấn Trăng Pha Lê' },
      { weapon: 'staff0', price: 400 }, { weapon: 'staff1', price: 2400 }, { armor: 'robe', price: 800 }, { tal: 'star', price: 3000 },
    ],
  },
  priestess: {
    name: 'Nữ Tu Seraphine', line: '“Ánh vàng soi đường cho kẻ có lòng tin.”', stock: [
      { spell: 'heal', price: 800 }, { spell: 'flame', price: 800 }, { spell: 'bolt', price: 2000 }, { spell: 'bless', price: 3600 },
      { spell: 'judge', price: 9000, req: () => S.gr.length >= 2, lock: 'Cần hai Đại Ấn' }, { weapon: 'seal0', price: 400 }, { weapon: 'seal1', price: 2400 },
      { armor: 'priest', price: 800 }, { tal: 'sun', price: 3000 }, { tal: 'guard', price: 2600 },
    ],
  },
};
// Đại Ấn: phần thưởng từ ba boss lớn, cần đủ ba để mở cổng Kinh Thành
const GREAT_RUNES = {
  east: { name: 'Đại Ấn Greystone', desc: 'Máu tối đa +10%', col: '#9fb4ff' },
  swamp: { name: 'Đại Ấn Rồng Tro', desc: 'Mọi sát thương +8%', col: '#ff9a4a' },
  west: { name: 'Đại Ấn Trăng Pha Lê', desc: 'FP +15%, phép +8%', col: '#bfe4ff' },
};

// ───────────────────────── kẻ địch ─────────────────────────
const LOOK_BASE = { body: '#474b52', trim: '#8d9199', head: '#5b5f67', cloak: '#5e1f1c', scale: 1 };
const ETYPES = {
  soldier: {
    name: 'Lính Tàn Binh', hp: 70, r: 15, speed: 88, aggro: 290, runes: 28, poise: 28, atkRange: 50, cd: [0.8, 1.8], track: 3.4,
    look: { body: '#6b604b', trim: '#9a8759', head: '#857b68', cloak: '#4b3a28', weapon: 'sword', wlen: 32, wcol: '#b9b6aa', scale: 1 },
    attacks: [{ wind: 0.55, act: 0.14, rec: 0.6, range: 60, arc: 1.7, dmg: 24, lunge: 170, swing: 1 }],
    drops: [['knife', 0.1, 2], ['stone1', 0.05, 1], ['grune1', 0.03, 1]],
  },
  wolf: {
    name: 'Sói Xám', hp: 42, r: 13, speed: 170, aggro: 340, runes: 18, poise: 14, atkRange: 58, cd: [0.9, 1.9], track: 4.5, beast: { col: '#6d6b64' },
    attacks: [{ wind: 0.4, act: 0.2, rec: 0.55, range: 44, arc: 1.4, dmg: 15, lunge: 420, swing: 0 }],
  },
  mage: {
    name: 'Pháp Sư Lưu Đày', hp: 55, r: 14, speed: 72, aggro: 400, runes: 40, poise: 18, ranged: true, keep: 230, cd: [1.6, 2.6], track: 3, res: { magic: 0.7 },
    look: { body: '#2f3a5a', trim: '#6f86c9', head: '#252e4b', cloak: '#1c2340', weapon: 'staff', wlen: 34, wcol: '#6b5a3e', scale: 1, hood: true, orb: '#9fc0ff' },
    attacks: [{ kind: 'shot', wind: 0.8, rec: 0.9, n: 1, spread: 0, proj: { speed: 270, dmg: 24, r: 9, kind: 'orb' } }],
    drops: [['stone1', 0.06, 1], ['cure', 0.06, 1]],
  },
  archer: {
    name: 'Cung Thủ Tàn Binh', hp: 50, r: 14, speed: 80, aggro: 440, runes: 34, poise: 16, ranged: true, keep: 280, cd: [1.3, 2.2], track: 3.5,
    look: { body: '#5f5a45', trim: '#8a7d58', head: '#7b7462', cloak: '#3f4a2e', weapon: 'bow', wlen: 26, wcol: '#7a6040', scale: 1 },
    attacks: [
      { kind: 'shot', wind: 0.7, rec: 0.6, n: 1, spread: 0, proj: { speed: 480, dmg: 20, r: 5, kind: 'arrow' } },
      { kind: 'shot', wind: 0.95, rec: 0.9, n: 3, spread: 0.2, proj: { speed: 460, dmg: 17, r: 5, kind: 'arrow' } },
    ],
    pick: () => (Math.random() < 0.3 ? 1 : 0), drops: [['arrows', 0.5, 6], ['stone1', 0.04, 1]],
  },
  bomber: {
    name: 'Kẻ Ném Lửa', hp: 60, r: 15, speed: 74, aggro: 380, runes: 40, poise: 20, ranged: true, keep: 220, cd: [1.8, 2.8], track: 3, res: { fire: 0.5 },
    look: { body: '#6a4a35', trim: '#b0703a', head: '#5a4a3a', cloak: '#3a2a1e', weapon: 'staff', wlen: 22, wcol: '#5a4a36', scale: 1.05, orb: '#ff8a3a', hood: true },
    attacks: [{ kind: 'lob', wind: 0.8, rec: 1.0, n: 1, dmg: 32, r: 62 }, { kind: 'lob', wind: 1.0, rec: 1.1, n: 3, dmg: 26, r: 55 }],
    pick: () => (Math.random() < 0.3 ? 1 : 0), drops: [['firepot', 0.25, 1]],
  },
  ghost: {
    name: 'Hồn Ma Lang Thang', hp: 48, r: 14, speed: 115, aggro: 320, runes: 42, poise: 12, atkRange: 52, cd: [1.0, 2.0], track: 4, ghost: true, res: { phys: 0.8, holy: 1.6 },
    look: { body: '#6f8fa8', trim: '#a9d4ee', head: '#8fb4cc', cloak: '#39566b', weapon: 'sword', wlen: 30, wcol: '#cfefff', scale: 1 },
    attacks: [{ kind: 'blink', wind: 0.35, next: 1 }, { wind: 0.4, act: 0.14, rec: 0.6, range: 58, arc: 1.8, dmg: 22, lunge: 200, swing: 1 }],
    pick: (e, d) => (d < 64 ? 1 : d < 340 ? 0 : -1), drops: [['grune1', 0.06, 1]],
  },
  shield: {
    name: 'Lính Khiên Sắt', hp: 95, r: 16, speed: 74, aggro: 280, runes: 48, poise: 40, atkRange: 60, cd: [1.0, 1.9], track: 3, shield: true,
    look: { body: '#5a5d63', trim: '#8b8f96', head: '#6c7077', cloak: '#2e3440', weapon: 'sword', wlen: 26, wcol: '#c8c8c0', scale: 1.1 },
    attacks: [{ wind: 0.5, act: 0.14, rec: 0.7, range: 56, arc: 1.4, dmg: 20, lunge: 230, swing: 1 }, { wind: 0.7, act: 0.14, rec: 0.8, range: 86, arc: 0.7, dmg: 28, lunge: 170, thrust: true }],
    pick: (e, d) => (d < 58 ? 0 : d < 92 ? 1 : -1), drops: [['stone1', 0.1, 1]],
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
    drops: [['stone2', 0.6, 1], ['somber1', 0.2, 1]],
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
    pick: (e, d) => (d < 60 ? 1 : d > 130 && d < 320 ? 0 : -1), drops: [['cure', 0.15, 1]],
  },
  warden: {
    name: 'Dornach, Vệ Binh Greystone', hp: 1150, r: 26, speed: 100, aggro: 300, runes: 2400, poise: 230, elite: true, miniboss: true, bar: true,
    atkRange: 90, cd: [0.6, 1.3], track: 2.6, leash: 420, loot: { weapon: 'hammer', gr: 'east' },
    look: { body: '#3c4250', trim: '#7d8fb0', head: '#4a5060', cloak: '#1d2438', weapon: 'club', wlen: 44, wcol: '#9aa3b5', scale: 1.8 },
    attacks: [
      { wind: 0.7, act: 0.16, rec: 0.15, range: 108, arc: 2.3, dmg: 46, lunge: 240, swing: 1, next: 1 },
      { wind: 1.0, act: 0.16, rec: 0.8, range: 108, arc: 2.3, dmg: 50, lunge: 260, swing: -1 },
      { kind: 'charge', wind: 0.6, dur: 0.75, speed: 540, rec: 0.9, dmg: 52 },
      { kind: 'slam', wind: 0.9, rec: 1.0, off: 60, r: 110, dmg: 58, ring: [110, 270, 0.5, 28] },
      { kind: 'charge', wind: 0.4, dur: 0.6, speed: 620, rec: 0.1, dmg: 50, next: 5 },
      { kind: 'charge', wind: 0.25, dur: 0.6, speed: 620, rec: 0.3, dmg: 50, next: 6 },
      { kind: 'leap', wind: 0.5, air: 0.7, rec: 0.9, r: 120, dmg: 62, ring: [120, 320, 0.55, 30] },
    ],
    pick: (e, d) => (d > 200 && d < 520 ? 2 : d < 125 ? (Math.random() < 0.3 ? 3 : 0) : -1),
    p2: {
      at: 0.5, speed: 1.2, cdMul: 0.7, dmgMul: 1.12, line: '“Pháo đài này... chưa từng thất thủ!”',
      pick: (e, d) => { const r = Math.random(); return d > 200 && d < 560 ? (r < 0.5 ? 4 : 6) : d < 130 ? (r < 0.3 ? 3 : r < 0.5 ? 6 : 0) : -1; },
    },
  },
  wraith: {
    name: 'Seluna, Nữ Vương Hồn Ma', hp: 900, r: 20, speed: 95, aggro: 520, runes: 2200, poise: 180, elite: true, miniboss: true, bar: true, ghost: true, loot: { weapon: 'scythe' },
    atkRange: 90, cd: [0.6, 1.2], track: 3.5, leash: 420, res: { holy: 1.4 },
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
    name: 'Thây Ma Đầm Lầy', hp: 64, r: 15, speed: 64, aggro: 260, runes: 36, poise: 22, atkRange: 44, cd: [0.9, 1.8], track: 3, res: { fire: 1.3 },
    look: { body: '#4f5b41', trim: '#6f7d58', head: '#7d8a66', cloak: '#2f3a28', weapon: 'claw', wlen: 16, wcol: '#b9c48a', scale: 1.05 },
    attacks: [{ wind: 0.5, act: 0.16, rec: 0.7, range: 54, arc: 1.6, dmg: 16, lunge: 160, swing: 1, poison: 34 }],
    drops: [['cure', 0.12, 1]],
  },
  knight: {
    name: 'Kỵ Sĩ Tro Tàn', hp: 320, r: 19, speed: 96, aggro: 320, runes: 260, poise: 95, elite: true, atkRange: 66, cd: [0.6, 1.4], track: 2.8,
    look: { body: '#3b3c43', trim: '#b08d4c', head: '#4c4d55', cloak: '#5c1f1d', weapon: 'greatsword', wlen: 38, wcol: '#c8c4b8', scale: 1.28 },
    attacks: [
      { wind: 0.7, act: 0.15, rec: 0.2, range: 84, arc: 2.0, dmg: 34, lunge: 200, swing: 1, next: 1 },
      { wind: 0.38, act: 0.15, rec: 0.75, range: 84, arc: 2.0, dmg: 30, lunge: 170, swing: -1 },
      { wind: 1.05, act: 0.18, rec: 0.9, range: 96, arc: 2.4, dmg: 52, lunge: 280, swing: 1 },
    ],
    drops: [['stone1', 0.5, 2], ['stone2', 0.12, 1]], rare: { armor: 'knightset', chance: 0.1 },
  },
  // ─── miền Tây ───
  sorcerer: {
    name: 'Pháp Sư Học Viện', hp: 70, r: 14, speed: 82, aggro: 420, runes: 70, poise: 18, ranged: true, keep: 250, cd: [1.3, 2.3], track: 3, res: { magic: 0.55 },
    look: { body: '#3a4a7a', trim: '#cfe0ff', head: '#2a3560', cloak: '#1f2a52', weapon: 'staff', wlen: 34, wcol: '#8a8aa0', scale: 1, hood: true, orb: '#aee4ff' },
    attacks: [
      { kind: 'shot', wind: 0.7, rec: 0.7, n: 3, spread: 0.16, proj: { speed: 400, dmg: 17, r: 7, kind: 'shard' } },
      { kind: 'shot', wind: 1.0, rec: 0.9, n: 1, spread: 0, proj: { speed: 300, dmg: 32, r: 11, kind: 'orb' } },
      { kind: 'warp', wind: 0.35, dist: 240 },
    ],
    pick: (e, d) => (d < 130 && Math.random() < 0.6 ? 2 : Math.random() < 0.6 ? 0 : 1),
    drops: [['stone2', 0.06, 1], ['grune1', 0.08, 1]],
  },
  crystal: {
    name: 'Người Pha Lê', hp: 150, r: 16, speed: 70, aggro: 280, runes: 95, poise: 70, atkRange: 70, cd: [1.0, 2.0], track: 2.6, res: { magic: 0.35, phys: 0.85 },
    look: { body: '#8fb8d8', trim: '#d8f0ff', head: '#a8d0ec', cloak: '#4a6a90', weapon: 'spear', wlen: 44, wcol: '#cfefff', scale: 1.15, glow: '#9fd0ff' },
    attacks: [
      { wind: 0.65, act: 0.14, rec: 0.7, range: 96, arc: 0.7, dmg: 30, lunge: 200, thrust: true },
      { kind: 'slam', wind: 0.8, rec: 0.9, off: 0, r: 84, dmg: 28 },
      { kind: 'orbs', wind: 0.9, rec: 0.9, n: 8, dmg: 14, proj: 'shard' },
    ],
    pick: (e, d) => (d < 80 ? (Math.random() < 0.4 ? 1 : 0) : d < 110 ? 0 : d < 260 && Math.random() < 0.4 ? 2 : -1),
    drops: [['stone2', 0.2, 1], ['stone3', 0.04, 1]],
  },
  lakehound: {
    name: 'Chó Hồ', hp: 55, r: 13, speed: 185, aggro: 330, runes: 40, poise: 14, atkRange: 60, cd: [0.8, 1.6], track: 5, beast: { col: '#5a7080', eye: '#9ff0ff' }, swim: true,
    attacks: [{ wind: 0.38, act: 0.18, rec: 0.3, range: 46, arc: 1.4, dmg: 18, lunge: 430, swing: 0, next: 1 }, { wind: 0.22, act: 0.16, rec: 0.6, range: 46, arc: 1.4, dmg: 14, lunge: 300, swing: 0 }],
    pick: (e, d) => (d < 70 ? 0 : -1),
  },
  selvara: {
    name: 'Selvara, Nữ Hoàng Trăng Pha Lê', hp: 2600, r: 22, speed: 70, aggro: 460, runes: 9000, poise: 240, elite: true, miniboss: true, bar: true, ranged: true, keep: 250,
    cd: [0.8, 1.5], track: 3, leash: 900, res: { magic: 0.5 }, floats: true, noParry: true, arenaId: 'acad',
    loot: { gr: 'west', weapon: 'staff2', spell: 'comet' },
    look: { body: '#4a5a9a', trim: '#e0ecff', head: '#bcd0ff', cloak: '#2a3470', weapon: 'staff', wlen: 44, wcol: '#b8b8d0', scale: 1.7, hood: true, orb: '#cfeaff' },
    attacks: [
      { kind: 'orbs', wind: 0.8, rec: 0.7, n: 12, dmg: 22 },
      { kind: 'shot', wind: 0.6, rec: 0.6, n: 5, spread: 0.14, proj: { speed: 400, dmg: 24, r: 8, kind: 'shard' } },
      { kind: 'summon', wind: 1.0, rec: 0.8, what: 'sorcerer', n: 2 },
      { kind: 'warp', wind: 0.3, dist: 300 },
      { kind: 'rain', wind: 0.9, rec: 0.8, n: 7, r: 62, dmg: 50, spread: 170, delay: 1.0 },
      { kind: 'shot', wind: 1.1, rec: 0.9, n: 1, spread: 0, proj: { speed: 360, dmg: 64, r: 16, kind: 'comet' } },
      { kind: 'nova', wind: 0.9, rec: 0.9, r0: 30, r1: 420, dur: 0.9, dmg: 44 },
    ],
    pick: (e, d) => {
      const r = Math.random(), minions = enemies.filter(x => x.summoned && !x.dead).length;
      if (d < 140 && r < 0.55) return 3;
      if (r < 0.4) return 0;
      if (r < 0.8 || minions >= 2) return 1;
      return 2;
    },
    p2: {
      at: 0.5, speed: 1.1, cdMul: 0.75, dmgMul: 1.1, line: '“Hãy ngước nhìn... bầu trời đầy sao của ta.”',
      pick: (e, d) => {
        const r = Math.random();
        if (d < 140 && r < 0.4) return r < 0.2 ? 6 : 3;
        if (r < 0.25) return 4;
        if (r < 0.45) return 5;
        if (r < 0.65) return 0;
        if (r < 0.85) return 1;
        return enemies.filter(x => x.summoned && !x.dead).length < 2 ? 2 : 6;
      },
    },
  },
  // ─── Cao Nguyên Aurelia và Kinh Thành ───
  royal: {
    name: 'Kỵ Sĩ Hoàng Gia', hp: 380, r: 18, speed: 102, aggro: 320, runes: 480, poise: 110, elite: true, atkRange: 72, cd: [0.6, 1.3], track: 3, res: { holy: 0.6 },
    look: { body: '#8a7440', trim: '#f0d27a', head: '#a08a50', cloak: '#6a1f1a', weapon: 'sword', wlen: 42, wcol: '#f0e0b0', scale: 1.3, glow: '#ffd76a' },
    attacks: [
      { wind: 0.6, act: 0.14, rec: 0.15, range: 88, arc: 2.0, dmg: 36, lunge: 220, swing: 1, next: 1 },
      { wind: 0.4, act: 0.14, rec: 0.75, range: 88, arc: 2.0, dmg: 34, lunge: 200, swing: -1 },
      { kind: 'shot', wind: 0.75, rec: 0.8, n: 1, spread: 0, proj: { speed: 430, dmg: 34, r: 12, kind: 'hwave' } },
      { kind: 'leap', wind: 0.55, air: 0.65, rec: 0.8, r: 80, dmg: 44 },
    ],
    pick: (e, d) => { const r = Math.random(); return d < 100 ? (r < 0.7 ? 0 : 3) : d < 300 ? (r < 0.5 ? 2 : r < 0.8 ? 3 : -1) : -1; },
    drops: [['stone3', 0.18, 1], ['somber2', 0.05, 1], ['grune2', 0.08, 1]], rare: { armor: 'royalset', chance: 0.06 },
  },
  priest: {
    name: 'Tu Sĩ Vàng', hp: 95, r: 14, speed: 76, aggro: 420, runes: 150, poise: 22, ranged: true, keep: 270, cd: [1.4, 2.4], track: 3, res: { holy: 0.4 },
    look: { body: '#d8ccb0', trim: '#f0d27a', head: '#b8a888', cloak: '#8a6a2a', weapon: 'staff', wlen: 30, wcol: '#b8952f', scale: 1, hood: true, orb: '#ffe08a' },
    attacks: [
      { kind: 'pillars', wind: 0.8, rec: 0.8, n: 5, r: 48, dmg: 34, delay: 0.7 },
      { kind: 'healall', wind: 1.0, rec: 0.8, r: 320, amt: 0.25 },
      { kind: 'shot', wind: 0.6, rec: 0.7, n: 1, spread: 0, proj: { speed: 520, dmg: 26, r: 7, kind: 'hbolt' } },
    ],
    pick: (e, d) => (enemies.some(x => !x.dead && x !== e && x.hp < x.maxHp * 0.6 && dist(x.x, x.y, e.x, e.y) < 320) && Math.random() < 0.5 ? 1 : Math.random() < 0.55 ? 0 : 2),
    drops: [['grune1', 0.2, 1], ['stone3', 0.06, 1]],
  },
  lion: {
    name: 'Sư Tử Vàng', hp: 440, r: 24, speed: 150, aggro: 360, runes: 520, poise: 130, elite: true, atkRange: 82, cd: [0.8, 1.5], track: 3, beast: { col: '#b89a58', eye: '#ffcf5a', scale: 1.8, mane: '#8a6a30' },
    attacks: [
      { wind: 0.55, act: 0.18, rec: 0.7, range: 92, arc: 2.4, dmg: 42, lunge: 240, swing: 0 },
      { kind: 'leap', wind: 0.5, air: 0.55, rec: 0.8, r: 90, dmg: 50 },
      { kind: 'charge', wind: 0.5, dur: 0.6, speed: 560, rec: 0.8, dmg: 44 },
    ],
    pick: (e, d) => { const r = Math.random(); return d < 110 ? (r < 0.7 ? 0 : 1) : d < 360 ? (r < 0.55 ? 1 : 2) : -1; },
    drops: [['stone3', 0.2, 1], ['grune2', 0.1, 1]],
  },
  garcher: {
    name: 'Cung Thủ Hoàng Gia', hp: 95, r: 14, speed: 86, aggro: 480, runes: 150, poise: 22, ranged: true, keep: 320, cd: [1.2, 2.1], track: 3.5,
    look: { body: '#8a7440', trim: '#e0c068', head: '#9a8a5a', cloak: '#5a4a2a', weapon: 'bow', wlen: 28, wcol: '#d8b45a', scale: 1 },
    attacks: [
      { kind: 'shot', wind: 0.6, rec: 0.5, n: 1, spread: 0, proj: { speed: 600, dmg: 30, r: 5, kind: 'arrow' } },
      { kind: 'shot', wind: 0.85, rec: 0.8, n: 3, spread: 0.12, proj: { speed: 580, dmg: 26, r: 5, kind: 'arrow' } },
      { kind: 'rain', wind: 0.9, rec: 0.9, n: 6, r: 42, dmg: 26, spread: 110, delay: 0.9 },
    ],
    pick: () => { const r = Math.random(); return r < 0.5 ? 0 : r < 0.8 ? 1 : 2; },
    drops: [['arrows', 0.6, 8], ['stone3', 0.05, 1]],
  },
  // ─── boss hầm ngục ───
  graveknight: {
    name: 'Kỵ Sĩ Mộ Phần', hp: 1000, r: 20, speed: 104, aggro: 600, runes: 2600, poise: 200, elite: true, miniboss: true, bar: true, atkRange: 80, cd: [0.6, 1.2], track: 3, leash: 900, res: { holy: 1.4 },
    look: { body: '#3a4450', trim: '#9fc0e0', head: '#4a5462', cloak: '#1a2230', weapon: 'greatsword', wlen: 40, wcol: '#b8d0f0', scale: 1.5, glow: '#9fd0ff' },
    attacks: [
      { wind: 0.65, act: 0.15, rec: 0.15, range: 96, arc: 2.2, dmg: 42, lunge: 230, swing: 1, next: 1 },
      { wind: 0.5, act: 0.15, rec: 0.8, range: 96, arc: 2.2, dmg: 44, lunge: 230, swing: -1 },
      { kind: 'blink', wind: 0.3, next: 3 },
      { wind: 0.4, act: 0.15, rec: 0.8, range: 96, arc: 2.2, dmg: 46, lunge: 200, swing: 1 },
      { kind: 'orbs', wind: 0.8, rec: 0.8, n: 10, dmg: 20 },
    ],
    pick: (e, d) => { const r = Math.random(); return d < 120 ? (r < 0.65 ? 0 : 4) : d < 400 ? (r < 0.6 ? 2 : 4) : -1; },
  },
  minerg: {
    name: 'Khổng Lồ Pha Lê', hp: 1700, r: 32, speed: 72, aggro: 600, runes: 3400, poise: 280, elite: true, miniboss: true, bar: true, atkRange: 120, cd: [0.8, 1.5], track: 2, leash: 900, res: { magic: 0.4 },
    look: { body: '#7aa0c0', trim: '#d8f0ff', head: '#9ac0dc', cloak: '#3a5a7a', weapon: 'club', wlen: 44, wcol: '#cfefff', scale: 2.4, glow: '#9fd0ff' },
    attacks: [
      { wind: 0.85, act: 0.2, rec: 0.8, range: 132, arc: 2.3, dmg: 58, lunge: 160, swing: 1 },
      { kind: 'slam', wind: 1.0, rec: 1.0, off: 70, r: 115, dmg: 66, ring: [115, 320, 0.6, 30] },
      { kind: 'orbs', wind: 0.9, rec: 0.9, n: 14, dmg: 22, proj: 'shard' },
      { kind: 'charge', wind: 0.7, dur: 0.8, speed: 520, rec: 0.9, dmg: 56 },
    ],
    pick: (e, d) => { const r = Math.random(); return d < 150 ? (r < 0.5 ? 0 : r < 0.8 ? 1 : 2) : d < 500 ? (r < 0.5 ? 3 : 2) : -1; },
  },
  golem: {
    name: 'Hộ Vệ Đá Cổ', hp: 1800, r: 34, speed: 62, aggro: 600, runes: 3200, poise: 320, elite: true, miniboss: true, bar: true, atkRange: 125, cd: [0.9, 1.6], track: 1.8, leash: 900, res: { fire: 0.5, phys: 0.9 },
    look: { body: '#6a5a4a', trim: '#e08040', head: '#7a6a56', cloak: '#3a2a1e', weapon: 'club', wlen: 48, wcol: '#5a4632', scale: 2.6 },
    attacks: [
      { wind: 1.0, act: 0.2, rec: 0.9, range: 138, arc: 2.2, dmg: 64, lunge: 140, swing: 1 },
      { kind: 'slam', wind: 1.1, rec: 1.0, off: 0, r: 130, dmg: 60, ring: [130, 360, 0.7, 32] },
      { kind: 'lob', wind: 0.9, rec: 1.0, n: 4, dmg: 40, r: 70 },
      { kind: 'charge', wind: 0.8, dur: 0.9, speed: 480, rec: 1.0, dmg: 60 },
    ],
    pick: (e, d) => { const r = Math.random(); return d < 150 ? (r < 0.55 ? 0 : 1) : d < 520 ? (r < 0.55 ? 2 : 3) : -1; },
  },
  royalchamp: {
    name: 'Nhà Vô Địch Hoàng Gia', hp: 2500, r: 22, speed: 122, aggro: 600, runes: 6500, poise: 250, elite: true, miniboss: true, bar: true, atkRange: 92, cd: [0.5, 1.1], track: 3.2, leash: 900, res: { holy: 0.6 },
    look: { body: '#9a8240', trim: '#fff0b0', head: '#b09a58', cloak: '#7a1a14', weapon: 'greatsword', wlen: 46, wcol: '#fff0c0', scale: 1.6, glow: '#ffd76a' },
    attacks: [
      { wind: 0.55, act: 0.14, rec: 0.12, range: 104, arc: 2.3, dmg: 48, lunge: 250, swing: 1, next: 1 },
      { wind: 0.45, act: 0.14, rec: 0.12, range: 104, arc: 2.3, dmg: 48, lunge: 250, swing: -1, next: 2 },
      { wind: 0.7, act: 0.16, rec: 0.9, range: 112, arc: 2.6, dmg: 60, lunge: 300, swing: 1 },
      { kind: 'shot', wind: 0.7, rec: 0.7, n: 3, spread: 0.22, proj: { speed: 460, dmg: 40, r: 12, kind: 'hwave' } },
      { kind: 'leap', wind: 0.55, air: 0.7, rec: 0.9, r: 110, dmg: 64, ring: [110, 300, 0.55, 32] },
      { kind: 'rain', wind: 0.8, rec: 0.8, n: 8, r: 50, dmg: 42, spread: 150, delay: 0.95 },
    ],
    pick: (e, d) => { const r = Math.random(); return d < 130 ? (r < 0.6 ? 0 : r < 0.8 ? 4 : 5) : d < 500 ? (r < 0.4 ? 3 : r < 0.75 ? 4 : 5) : -1; },
  },
};
for (const [k, T] of Object.entries(ETYPES)) T.id = k;
