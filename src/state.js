'use strict';
// Vòng Vàng Vỡ — Trạng thái, dữ liệu kẻ địch, va chạm và hiệu ứng
// ───────────────────────── trạng thái ─────────────────────────
const SAVE_KEY = 'vong-vang-vo-save-v1';
function defaultSave() {
  return { level: 1, stats: { vig: 10, end: 10, str: 10, mnd: 10 }, runes: 0, weaponLv: 0, flaskMax: 3, lastGrace: 0, discovered: [0], bossDead: false, taken: [], lost: null, treeReached: false, deaths: 0, time: 0, weapons: ['broken'], equipped: 'broken', dragonDead: false, finalDead: false, chests: [], fortOpen: false, statues: [], glade: false, illusory: [], coloDone: false, mb: {}, explored: '', frags: [] };
}
let S = defaultSave();
function save() { try { S.explored = expEncode(); localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* bộ nhớ trình duyệt bị chặn */ } }
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
// Như Elden Ring: quái mạnh theo vùng đất, không theo cấp người chơi.
function regionMul(x, y) {
  if (x > MAPW) return 1.55;
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
  const T = ETYPES[type], rm = regionMul(x, y), hp = Math.round(T.hp * DIFF.hp * rm);
  return { type, T, name: T.name, x, y, hx: x, hy: y, r: T.r, hp, maxHp: hp, fade: 0, runeMul: rm, face: rand(0, TAU), state: 'idle', t: 0, cd: rand(0.5, 1.5), vx: 0, vy: 0,
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
  return { isBoss: true, name: 'Varek, Kẻ Canh Cổng Phản Trắc', x: 1400, y: 640, r: 28, hp: 1300, maxHp: 1300, ghost: 1300, face: Math.PI / 2, state: 'dormant', t: 0, cd: 1,
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
