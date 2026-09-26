'use strict';
// Gravebound — Trạng thái, chỉ số nhân vật, kẻ địch, va chạm và hiệu ứng
// ───────────────────────── trạng thái ─────────────────────────
// ba ô lưu: ô 1 dùng lại khóa cũ nên bản lưu có sẵn tự nằm ở ô 1
const SLOT_KEY = 'gravebound-slot', SLOTS = 3;
let SLOT = (() => { try { const v = +localStorage.getItem(SLOT_KEY); return v >= 0 && v < SLOTS ? v : 0; } catch (e) { return 0; } })();
const saveKey = (i = SLOT) => 'vong-vang-vo-save-v2' + (i ? '-s' + i : '');
function setSlot(i) { SLOT = i; try { localStorage.setItem(SLOT_KEY, String(i)); } catch (e) { /* bỏ qua */ } }
function deleteSave(i) { try { localStorage.removeItem(saveKey(i)); } catch (e) { /* bỏ qua */ } }
function defaultSave() {
  return {
    cls: 'knight', level: 1, stats: { vig: 10, mnd: 10, end: 10, str: 10, dex: 10, int: 10, fai: 10 }, runes: 0,
    flaskMax: 3, flaskFp: 0, tears: 0, lastGrace: 0, discovered: [0, 22], bossDead: false, boss2Dead: false, taken: [], lost: null,
    treeReached: false, deaths: 0, time: 0, weapons: ['broken', 'shield'], wup: {}, equipped: 'broken', off: 'shield',
    armor: 'rags', armors: ['rags'], tals: [], tal: [], talSlots: 1, spells: [], att: [], slots: 2, spellIdx: 0,
    ashes: [], ash: {}, inv: {}, quick: 0, arrows: 0, arrowMax: 40, dragonDead: false, finalDead: false, chests: [],
    fortOpen: false, statues: [], glade: false, illusory: [], coloDone: false, mb: {}, explored: '', frags: [],
    gr: [], greatOpen: false, acadOpen: false, levers: [], dg: {}, bought: [], name: '', submitted: false, runId: null, marker: null,
    readN: [], tips: {}, diff: 'normal', inv: {}, parries: 0,
  };
}
let S = defaultSave();
function save() { try { S.explored = expEncode(); localStorage.setItem(saveKey(), JSON.stringify(S)); } catch (e) { /* bộ nhớ trình duyệt bị chặn */ } }
function loadSave(i = SLOT) {
  try { const s = JSON.parse(localStorage.getItem(saveKey(i)) || 'null'); if (s && s.stats && s.stats.dex !== undefined) return s; } catch (e) { /* bỏ qua */ }
  return null;
}
const FLASK_CAP = 10, TEAR_CAP = 5, SLOT_CAP = 5, TAL_CAP = 4;
const hasTal = id => S.tal.includes(id);
const hasGR = id => S.gr.includes(id);
const armorDef = () => ARMORS[S.armor] || ARMORS.rags;
const armorBonus = k => (armorDef().bonus || {})[k] || 0;
// đường cong chỉ số có ngưỡng giảm dần ở 20 / 40 / 60 như Elden Ring
function curve(s) { return s <= 10 ? 0 : s <= 20 ? (s - 10) * 0.035 : s <= 40 ? 0.35 + (s - 20) * 0.0225 : s <= 60 ? 0.8 + (s - 40) * 0.01 : 1 + (s - 60) * 0.005; }
const maxHp = () => Math.round((180 + 18 * Math.min(S.stats.vig - 10, 30) + 8 * Math.max(0, S.stats.vig - 40)) * (1 + (hasTal('crimson') ? 0.12 : 0) + (hasGR('east') ? 0.1 : 0)));
const maxSt = () => Math.round((80 + 5 * (S.stats.end - 10)) * (hasTal('green') ? 1.15 : 1));
const maxFp = () => Math.round((50 + 7 * (S.stats.mnd - 10)) * (1 + (hasTal('cerulean') ? 0.18 : 0) + (hasGR('west') ? 0.15 : 0)));
const upLv = id => S.wup[id] || 0;
const maxUp = id => (WEAPONS[id].somber ? 5 : 9);
function reqMet(req) { for (const k in req || {}) if (S.stats[k] < req[k]) return false; return true; }
function reqText(req) { return Object.entries(req || {}).map(([k, v]) => `<span class="${S.stats[k] < v ? 'bad' : ''}">${STAT_SHORT[k] || STAT_NAME[k]} ${v}</span>`).join(' '); }
const upMul = (id, lv) => (WEAPONS[id].somber ? 1 + 0.18 * lv : 1 + 0.1 * lv);
function scaleSum(Wp, lv) { let sc = 0; for (const k in Wp.sc || {}) sc += LETTER[Wp.sc[k]] * (1 + 0.03 * lv) * curve(S.stats[k]); return sc; }
// sức công phá của vũ khí (AR): gốc × cường hóa × (1 + tổng hệ số theo chỉ số); thiếu chỉ số bị phạt 40%
function weaponAR(id, lv = upLv(id)) {
  const Wp = WEAPONS[id];
  let ar = Wp.base * upMul(id, lv) * (1 + scaleSum(Wp, lv));
  if (!reqMet(Wp.req)) ar *= 0.6;
  return ar;
}
// sức mạnh phép của gậy / ấn
function spellPower(id, lv = upLv(id)) {
  const Wp = WEAPONS[id];
  if (!Wp || !Wp.sp) return 0;
  let sp = Wp.sp * upMul(id, lv) * (1 + scaleSum(Wp, lv));
  if (!reqMet(Wp.req)) sp *= 0.6;
  return sp;
}
const twoHanded = () => !!WEAPONS[S.equipped].twoHanded;
const offDef = () => WEAPONS[S.off] || WEAPONS.shield;
// chất xúc tác ở tay trái chỉ dùng được khi tay phải không cầm vũ khí hai tay
const catalyst = () => { const o = offDef(); return !twoHanded() && (o.type === 'staff' || o.type === 'seal') ? o : null; };
const maxLoad = () => (25 + 1.4 * (S.stats.end - 10)) * (hasTal('feather') ? 1.2 : 1);
const equipLoad = () => (WEAPONS[S.equipped].wt || 0) + (offDef().wt || 0) + armorDef().wt;
function rollType() {
  const k = equipLoad() / maxLoad();
  return k <= 0.3 ? 'light' : k <= 0.7 ? 'mid' : k <= 1 ? 'heavy' : 'over';
}
const ROLLS = {
  light: { name: 'Lăn nhẹ', dur: 0.46, iframe: [0.02, 0.4], speed: 390, st: 15 },
  mid: { name: 'Lăn vừa', dur: 0.5, iframe: [0.03, 0.36], speed: 360, st: 18 },
  heavy: { name: 'Lăn nặng', dur: 0.62, iframe: [0.06, 0.3], speed: 280, st: 24 },
  over: { name: 'Quá tải', dur: 0.62, iframe: [0.1, 0.2], speed: 200, st: 30 },
  // đứng yên mà bấm lăn thì nhảy lùi: nhanh, ít khung bất tử, tốn ít thể lực (như game souls)
  back: { name: 'Nhảy lùi', dur: 0.34, iframe: [0.02, 0.18], speed: 330, st: 10, back: true },
};
// hấp thụ sát thương từ giáp và bùa
const poisonMul = () => (hasTal('tidelocket') ? 0 : hasTal('toadskin') ? 0.4 : 1);
function absorb(kind) {
  let k = 1 - armorDef().abs;
  if (kind === 'fire' && hasTal('emberscale')) k *= 0.7;
  if ((kind === 'phys' || !kind) && hasTal('stoneskin')) k *= 0.9;
  if (kind === 'magic' && hasTal('jellypearl')) k *= 0.8;
  if (hasTal('shieldtal')) k *= 0.88;
  if (kind === 'magic' && armorBonus('magicRes')) k *= 1 - armorBonus('magicRes');
  return k;
}
const dmgBonus = () => (hasTal('lionmane') && P.hp >= P.maxHp - 0.5 ? 1.1 : 1) * (hasTal('anchor') && inWater(P.x, P.y) ? 1.15 : 1) * (hasGR('swamp') ? 1.08 : 1) * (P.buffs.bless > 0 ? 1.15 : 1) * (hasTal('redseal') && P.hp < P.maxHp * 0.5 ? 1.2 : 1);
const flaskHeal = () => Math.round(P.maxHp * (0.4 + 0.06 * S.tears) + 15);
const fpFlaskAmt = () => Math.round(P.maxFp * (0.4 + 0.05 * S.tears) + 10);
// Như Elden Ring: quái mạnh theo vùng đất, không theo cấp người chơi.
function regionMul(x, y) {
  const n = regionAt(x, y);
  if (n === 'Đồng Cỏ Mistveil' && y < 1600) return 1.1;
  return REGION_MUL[n] || 1;
}
const levelCost = () => Math.floor(150 + 60 * S.level + 6 * S.level * S.level);

const G = {
  mode: 'title', clock: 0, hitStop: 0, shake: 0, flash: 0, fade: 0, bossFight: false,
  banner: null, region: null, regionT: 0, sub: null, prompt: null, deathT: 0, runeGain: 0, runeGainT: 0,
  touch: false, timers: [], hintT: 0, tipCd: 0, toast: null, dragonFight: false, fpWarn: 0,
  colo: { active: false, wave: 0, cool: 0 }, braziers: [], finalFight: false, white: 0, dfight: null,
};
const P = {
  x: 1400, y: 3376, r: 13, vx: 0, vy: 0, face: -Math.PI / 2, state: 'idle', t: 0,
  hp: 180, maxHp: 180, ghost: 180, ghostDelay: 0, st: 80, maxSt: 80, stDelay: 0, fp: 50, maxFp: 50,
  flasks: 3, fpflasks: 0, invuln: 0, mounted: false, lock: null, atk: null, walk: 0, mvx: 0, mvy: 0, rollDir: 0, hurtDur: 0.3,
  poisonB: 0, poisonT: 0, lastGuardAt: -9, parryOk: false, blockedAt: -9, buffs: { flame: 0, holy: 0, bless: 0 }, roll: ROLLS.mid,
};
const cam = { x: P.x, y: P.y };
let enemies = [];
let boss = null, dragon = null, fb = null;
const projs = [], aoes = [], parts = [], puddles = [], loot = [];

function applyStats(full) {
  P.maxHp = maxHp(); P.maxSt = maxSt(); P.maxFp = maxFp();
  if (full) {
    P.boneUsed = false;
    P.hp = P.maxHp; P.st = P.maxSt; P.fp = P.maxFp; P.flasks = S.flaskMax - S.flaskFp; P.fpflasks = S.flaskFp;
    P.ghost = P.hp; P.poisonB = 0; P.poisonT = 0; S.arrows = S.arrowMax;
  } else { P.hp = Math.min(P.hp, P.maxHp); P.st = Math.min(P.st, P.maxSt); P.fp = Math.min(P.fp, P.maxFp); }
}
const lookCache = {};
function playerLook() {
  const k = S.equipped + '|' + S.armor;
  if (lookCache[k]) return lookCache[k];
  const A = { squire: { body: '#5a5448', trim: '#8a8474' }, samurai: { body: '#4a3a34', trim: '#a0523a', cloak: '#2a2020' }, robe: { body: '#2f3a5a', trim: '#6f86c9', cloak: '#1c2340', hood: true },
    priest: { body: '#cfc2a0', trim: '#b8952f', cloak: '#8a6a2a', hood: true }, leather: { body: '#5a4a34', trim: '#7a6a4a', cloak: '#3a4a2a' }, knightset: { body: '#3b3c43', trim: '#b08d4c', cloak: '#5c1f1d' },
    crystalset: { body: '#7aa0c0', trim: '#d8f0ff', head: '#9ac0dc', cloak: '#3a5a7a' }, royalset: { body: '#8a7440', trim: '#f0d27a', head: '#a08a50', cloak: '#6a1f1a' } }[S.armor] || {};
  return (lookCache[k] = Object.assign({}, LOOK_BASE, A, WEAPONS[S.equipped].look));
}

// ───────────────────────── kẻ địch ─────────────────────────
function makeEnemy(type, x, y) {
  const T = ETYPES[type], rm = regionMul(x, y), hp = Math.round(T.hp * DIFF.hp * rm);
  const room = T.miniboss ? (T.arenaId === 'acad' ? ACAD_BOSS : DUNGEONS.find(d => d.boss === type)) : null;
  return { type, T, name: T.name, room: room ? room.id : null, roomRect: room ? room.bossRoom : null, x, y, hx: x, hy: y, r: T.r, hp, maxHp: hp, fade: 0, runeMul: Math.pow(rm, 1.8), face: rand(0, TAU), state: 'idle', t: 0, cd: rand(0.5, 1.5), vx: 0, vy: 0,
    poise: T.poise, poiseAcc: 0, lastHit: 9, hurtFlash: 0, atk: null, atkHit: false, lunged: false, fired: false, glinted: false, wander: null, z: 0,
    strafe: Math.random() < 0.5 ? 1 : -1, elite: !!T.elite, dead: false, anim: rand(0, 10), moving: false, stagDur: 0.5, dm: 1, spd: 1, noParry: !!T.noParry };
}
function spawnEnemies() {
  enemies = SPAWNS.filter(([t]) => !(ETYPES[t].miniboss && S.mb[t])).map(([t, x, y]) => makeEnemy(t, x, y));
  enemies.forEach(applyAffixes);
  if (S.glade && !S.mb.wraith) enemies.push(makeEnemy('wraith', BARRIER.x, BARRIER.y));
  projs.length = 0; aoes.length = 0; puddles.length = 0; loot.length = 0;
  G.colo.active = false; G.colo.wave = 0; G.braziers = []; G.dfight = null;
}
function makeBoss(v = 1) {
  const A = v === 1 ? ARENA : ARENA2, hp = Math.round((v === 1 ? 1300 : 5400) * DIFF.boss);
  return { isBoss: true, v, A, name: v === 1 ? 'Varek, Kẻ Gác Cổng Bội Thề' : 'Varek, Vua Ẩn Mặt', x: A.x + A.w / 2, y: v === 1 ? 640 : A.y + 130, r: v === 1 ? 28 : 30,
    hp, maxHp: hp, ghost: hp, face: Math.PI / 2, state: 'dormant', t: 0, cd: 1, vx: 0, vy: 0, poise: v === 1 ? 170 : 240, poiseAcc: 0, lastHit: 9, hurtFlash: 0,
    phase: 1, atk: null, dead: false, z: 0, elite: true, invuln: 0, anim: 0, stagDur: 0.8, lastMove: '', bleedMax: v === 1 ? 180 : 300, res: { holy: 0.8 },
    look: v === 1 ? { body: '#4d4234', trim: '#c9a34a', head: '#2c2721', cloak: '#2a241b', weapon: 'greatsword', wlen: 40, wcol: '#dcc06a', scale: 1.9, hood: true, glow: true }
      : { body: '#2e2a26', trim: '#ffd76a', head: '#1e1a16', cloak: '#5a1410', weapon: 'greatsword', wlen: 48, wcol: '#fff0b0', scale: 2.1, hood: true, glow: true } };
}
const targets = () => {
  const out = enemies.filter(e => !e.dead && e.state !== 'bones');
  if (boss && G.bossFight && !boss.dead && boss.state !== 'dormant') out.push(boss);
  if (dragon && !dragon.dead && dist(P.x, P.y, dragon.x, dragon.y) < 750) out.push(dragon);
  if (fb && G.finalFight && !fb.dead && fb.state !== 'transform' && fb.state !== 'intro') out.push(fb);
  return out;
};

// ───────────────────────── va chạm ─────────────────────────
function pushOutWall(e, w) {
  const px = clamp(e.x, w.x, w.x + w.w), py = clamp(e.y, w.y, w.y + w.h);
  const dx = e.x - px, dy = e.y - py, d2 = dx * dx + dy * dy;
  if (d2 >= e.r * e.r) return;
  if (d2 > 1e-6) { const d = Math.sqrt(d2); e.x += dx / d * (e.r - d); e.y += dy / d * (e.r - d); }
  else {
    const l = e.x - w.x, rr = w.x + w.w - e.x, t = e.y - w.y, b = w.y + w.h - e.y, m = Math.min(l, rr, t, b);
    if (m === l) e.x = w.x - e.r; else if (m === rr) e.x = w.x + w.w + e.r; else if (m === t) e.y = w.y - e.r; else e.y = w.y + w.h + e.r;
  }
}
function collide(e, enemy) {
  const gx0 = Math.floor((e.x - e.r) / WCELL), gx1 = Math.floor((e.x + e.r) / WCELL), gy0 = Math.floor((e.y - e.r) / WCELL), gy1 = Math.floor((e.y + e.r) / WCELL);
  for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) {
    const cell = WALL_GRID.get(gx * 1000 + gy);
    if (cell) for (const w of cell) if (wallOn(w, enemy)) pushOutWall(e, w);
  }
  const A = e.x > 4800 ? areaAt(e.x, e.y) : null;
  if (A && A.id === 'realm') {
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
  if (A) { e.x = clamp(e.x, A.x + e.r + 4, A.x + A.w - e.r - 4); e.y = clamp(e.y, A.y + e.r + 4, A.y + A.h - e.r - 4); }
  else { e.x = clamp(e.x, WX0 + e.r + 12, MAPW - e.r - 12); e.y = clamp(e.y, WY0 + e.r + 12, H - e.r - 12); }
}
function moveCircle(e, dx, dy, enemy) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (e.r * 0.7)));
  for (let i = 0; i < steps; i++) { e.x += dx / steps; e.y += dy / steps; collide(e, enemy); }
}
function pointBlocked(x, y) {
  const c = WALL_GRID.get(Math.floor(x / WCELL) * 1000 + Math.floor(y / WCELL));
  if (c) for (const w of c) if (wallOn(w, false) && x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h) return true;
  if (!S.glade && dist(x, y, BARRIER.x, BARRIER.y) < BARRIER.r) return true;
  const cell = GRID.get(Math.floor(x / CELL) + ',' + Math.floor(y / CELL));
  if (cell) for (const o of cell) if (dist(x, y, o.x, o.y) < o.r) return true;
  return false;
}
const inArena = (x, y) => (x > ARENA.x && x < ARENA.x + ARENA.w && y > ARENA.y && y < ARENA.y + ARENA.h - 10) || inRect(x, y, ARENA2);

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
function shake(n) { if (SET.shake) G.shake = Math.max(G.shake, n); }
function banner(kind, title, sub, dur = 3.4) { G.banner = { kind, title, sub, t: 0, dur }; }
function subtitle(text, dur = 4.2) { G.sub = { text, t: 0, dur }; }
function later(t, fn) { G.timers.push({ t, fn }); }
function toast(text, dur = 2.4) { G.toast = { text, t: 0, dur }; }
