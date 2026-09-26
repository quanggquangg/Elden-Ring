'use strict';
// Gravebound — Ngày và đêm, Kỵ Sĩ Đêm tuần tra đường cái, và Tro Triệu Hồi (hồn đồng minh)

// ───────────────────────── ngày và đêm ─────────────────────────
// một vòng ngày đêm dài 14 phút chơi: ngày 0–0.55, hoàng hôn tới 0.63, đêm tới 0.93, rạng đông tới 1
const DAY_LEN = 840;
const nightK = (t = S.tod || 0) => (t < 0.55 ? 0 : t < 0.63 ? (t - 0.55) / 0.08 : t < 0.93 ? 1 : 1 - (t - 0.93) / 0.07);
const duskK = (t = S.tod || 0) => Math.max(0, 1 - Math.abs(t - 0.59) / 0.06, 1 - Math.abs(t - 0.955) / 0.045);
const isNight = () => nightK() > 0.6;
const SKY = new Array(8);
// trộn không khí của vùng với màu trời: đêm tối và lạnh, hoàng hôn ấm
function skyMix(b) {
  const n = nightK(), k = duskK();
  const dark = Math.min(0.78, b[0] + (Math.max(b[0] + 0.3, 0.62) - b[0]) * n + 0.1 * k);
  SKY[0] = dark;
  SKY[1] = lerp(b[1], 6, n); SKY[2] = lerp(b[2], 10, n); SKY[3] = lerp(b[3], 32, n);
  SKY[4] = lerp(lerp(b[4], 255, k), 120, n); SKY[5] = lerp(lerp(b[5], 132, k), 150, n); SKY[6] = lerp(lerp(b[6], 72, k), 235, n);
  SKY[7] = Math.max(b[7], 0.2 * n, 0.16 * k);
  return SKY;
}
function updateSky(dt) {
  if (S.tod === undefined) S.tod = 0.12;
  const was = isNight();
  S.tod = (S.tod + dt / DAY_LEN) % 1;
  const now = isNight();
  if (now !== was && P.x < 4800 && G.mode === 'play') {
    if (now) { toast(S.bell ? 'Màn đêm buông xuống' : 'Màn đêm buông xuống. Nghe đồn có một phù thủy hiện ra bên Ân Điển lúc đêm khuya...', 4); }
    else toast('Trời đã sáng');
  }
}
// chờ ở Ân Điển cho tới đêm hoặc sáng (như tùy chọn "Qua thời gian" của Elden Ring)
function passTime() {
  const toNight = !isNight();
  S.tod = toNight ? 0.64 : 0.02;
  G.fade = 1; G.amb = skyMix(AMB[G.region] || AMB_DEFAULT).slice();
  spawnEnemies(); updateRider(0); save(); SFX.grace();
  toast(toNight ? 'Ngươi chờ đến khi màn đêm buông xuống' : 'Ngươi chờ đến khi trời sáng');
  if (toNight) witchVisit();
}
// ô tròn nhỏ trên HUD: mặt trời hay mặt trăng cùng vòng cung thời gian
function drawSkyDial(x, y) {
  const n = nightK(), t = S.tod || 0;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(8,7,5,.72)'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(214,178,94,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.stroke();
  ctx.strokeStyle = n > 0.5 ? '#9fb8ff' : '#f2dc97'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, 11, -Math.PI / 2, -Math.PI / 2 + TAU * t); ctx.stroke();
  if (n > 0.5) {
    ctx.fillStyle = '#dfe8ff'; ctx.shadowColor = '#9fb8ff'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(8,7,5,.95)'; ctx.beginPath(); ctx.arc(2.6, -1.6, 4.8, 0, TAU); ctx.fill();
  } else {
    ctx.fillStyle = duskK() > 0.3 ? '#ffb070' : '#ffe08a'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(0, 0, 4.2, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); ctx.lineTo(Math.cos(a) * 8, Math.sin(a) * 8); }
    ctx.stroke();
  }
  ctx.restore();
}

// ───────────────────────── Kỵ Sĩ Đêm ─────────────────────────
// chỉ hiện ra lúc đêm, cưỡi ngựa hồn đen tuần tra con đường chính của Đồng Cỏ Mistveil
ETYPES.nightrider = {
  id: 'nightrider', name: 'Kỵ Sĩ Đêm', hp: 1500, r: 22, speed: 175, aggro: 380, runes: 3600, poise: 240, elite: true, miniboss: true, bar: true, atkRange: 100, cd: [0.7, 1.3], track: 3.2, leash: 1100, mount: true,
  res: { holy: 1.25 }, loot: { weapon: 'nightglaive' }, night: true,
  intro: 'Tiếng vó ngựa vang lên giữa màn đêm...',
  look: { body: '#23222a', trim: '#6a6480', head: '#2c2b34', cloak: '#141319', weapon: 'scythe', wlen: 58, wcol: '#c8c8d8', scale: 1.25, glow: '#8f86c8' },
  attacks: [
    { wind: 0.55, act: 0.2, rec: 0.3, range: 118, arc: 2.6, dmg: 44, lunge: 260, swing: 1, next: 1 },
    { wind: 0.35, act: 0.2, rec: 0.9, range: 118, arc: 2.6, dmg: 42, lunge: 240, swing: -1 },
    { kind: 'charge', wind: 0.75, dur: 0.9, speed: 620, rec: 0.6, dmg: 58 },
    { kind: 'slam', wind: 0.7, rec: 0.9, off: 34, r: 96, dmg: 52, ring: [96, 260, 0.55, 24] },
  ],
  pick: (e, d) => { const r = Math.random(); if (d < 140) return r < 0.6 ? 0 : 3; if (d < 520) return r < 0.7 ? 2 : 0; return -1; },
  p2: { at: 0.5, speed: 1.15, cdMul: 0.75, dmgMul: 1.1, line: 'Con ngựa hồn hí lên, bờm lửa tím bùng cháy...' },
};
WEAPONS.nightglaive = {
  name: "Nightrider Glaive", desc: 'Hai tay. Lưỡi đao dài của Kỵ Sĩ Đêm, quét rất rộng', type: 'melee', dt: 'phys', base: 27, sc: { str: 'C', dex: 'D' }, req: { str: 16, dex: 12 }, wt: 9, somber: true, twoHanded: true, ash: 'whirl',
  look: { weapon: 'scythe', wlen: 56, wcol: '#c8c8d8' }, cost: [14, 28],
  light: [S_('slash', 0.18, 0.14, 0.32, 1.05, 104, 2.8, 170, 20, { swing: 1 }), S_('slash', 0.16, 0.14, 0.32, 1.1, 104, 2.8, 170, 20, { swing: -1 }), S_('thrust', 0.2, 0.12, 0.38, 1.2, 116, 0.8, 260, 24, { thrust: true })],
  heavy: S_('spin', 0.52, 0.42, 0.52, 2.3, 108, TAU, 60, 44, { turns: 2 }),
};
WEAPON_ORDER.splice(WEAPON_ORDER.indexOf('scythe') + 1, 0, 'nightglaive');
const RIDER_ROUTE = [[1380, 2850], [1500, 2450], [1340, 2050], [1430, 1650], [1500, 2450]];
const NIGHT_HORSE = { col: '#16151c', dark: '#0b0a0f', flame: ['rgba(120,90,200,.25)', 'rgba(170,140,240,.6)', 'rgba(230,220,255,.9)'], saddle: '#2a2436', trim: '#8a80b0', eye: '#d8c8ff', glow: 'rgba(150,120,240,.5)' };
let rider = null;
function updateRider(dt) {
  if (S.mb.nightrider) { rider = null; return; }
  if (rider && (rider.dead || !enemies.includes(rider))) rider = null;
  const night = isNight();
  if (!rider && night && G.mode !== 'title') {
    const [x, y] = RIDER_ROUTE[0];
    rider = makeEnemy('nightrider', x, y); rider.wp = 1; enemies.push(rider);
  }
  if (!rider) return;
  // trời sáng: kỵ sĩ tan vào sương nếu không đang giao chiến
  if (!night && (rider.state === 'idle' || rider.state === 'return') && !onScreen(rider.x, rider.y, -60)) { rider.dead = true; rider.t = 99; rider = null; return; }
  if (!night && rider.state === 'idle') { rider.fade = Math.min(1, (rider.fade || 0) + dt * 0.5); if (rider.fade >= 1) { rider.dead = true; rider.t = 99; rider = null; } return; }
  if (rider.state === 'idle') {
    const [wx, wy] = RIDER_ROUTE[rider.wp];
    if (dist(rider.x, rider.y, wx, wy) < 30) rider.wp = (rider.wp + 1) % RIDER_ROUTE.length;
    rider.hx = rider.x; rider.hy = rider.y;
    rider.wander = { x: wx, y: wy, until: rider.t + 60 };
    // nhịp vó ngựa và bụi dưới chân
    if (Math.random() < dt * 8) addPart(rider.x + rand(-10, 10), rider.y + rand(-4, 8), rand(-10, 10), rand(-10, 0), 0.5, rand(3, 5), '150,132,100', 'puff');
  }
}

// ───────────────────────── Tro Triệu Hồi ─────────────────────────
// [loại quái để vẽ, số lượng, máu, sát thương, tầm đánh, tốc độ, FP, bắn xa?]
const SPIRITS = {
  wolves: { name: 'Tro Sói Cô Độc', desc: 'Gọi ba con sói hồn nhanh nhẹn, cắn liên tục', draw: 'wolf', n: 3, hp: 120, dmg: 17, range: 44, speed: 235, fp: 26 },
  skeletons: { name: 'Tro Dân Quân Xương', desc: 'Gọi hai chiến binh xương; ngã xuống một lần sẽ tự ráp lại', draw: 'skeleton', n: 2, hp: 150, dmg: 23, range: 52, speed: 150, fp: 32, revive: true },
  jelly: { name: 'Tro Sứa Đầm Lầy', desc: 'Gọi một con sứa lơ lửng đứng xa phun dịch vào kẻ thù', draw: 'jelly', n: 1, hp: 200, dmg: 22, range: 260, speed: 120, fp: 30, ranged: true },
  knight: { name: 'Tro Hiệp Sĩ Lưu Đày', desc: 'Gọi một hiệp sĩ bọc giáp nặng, chịu đòn tốt và chém mạnh', draw: 'knight', n: 1, hp: 560, dmg: 44, range: 70, speed: 140, fp: 44 },
};
const SPIRIT_ORDER = Object.keys(SPIRITS);
ITEMDEF.bell = { name: 'Chuông Gọi Hồn', desc: 'Rung chuông để gọi hồn từ tro đang chọn. Chỉ dùng được khi đang giao chiến', kind: 'bell', col: '#9fc0ff' };
let allies = [];
const spiritScale = () => 1 + 0.035 * Math.max(0, S.level - 1) + 0.06 * (upLv(S.equipped) || 0);
function canSummon() {
  if (!S.bell || !S.spirits || !S.spirits.length) return 'Chưa có tro triệu hồi';
  if (allies.some(a => !a.dead)) return 'Hồn đã được gọi';
  if (P.x > 4800 && areaAt(P.x, P.y) && areaAt(P.x, P.y).id === 'realm') return 'Không thể gọi hồn ở nơi này';
  if (!inCombat()) return 'Chỉ gọi hồn được khi đang giao chiến';
  const sp = SPIRITS[S.spiritSel] || SPIRITS[S.spirits[0]];
  if (P.fp < sp.fp) return 'Không đủ FP (' + sp.fp + ')';
  return null;
}
function summonSpirits() {
  const why = canSummon();
  if (why) { toast(why); return false; }
  const id = SPIRITS[S.spiritSel] ? S.spiritSel : S.spirits[0], sp = SPIRITS[id], k = spiritScale();
  P.fp -= sp.fp; P.state = 'throw'; P.t = 0; P.atk = null;
  allies = [];
  for (let i = 0; i < sp.n; i++) {
    const a0 = P.face + Math.PI + (i - (sp.n - 1) / 2) * 0.9, x = P.x + Math.cos(a0) * 50, y = P.y + Math.sin(a0) * 50;
    const a = makeEnemy(sp.draw, x, y);
    Object.assign(a, { ally: true, sp: id, hp: Math.round(sp.hp * k), maxHp: Math.round(sp.hp * k), dmg: sp.dmg * k, face: P.face, state: 'follow', cd: rand(0.2, 0.6), elite: false, aff: null, mvx: 0, mvy: 0, rise: 0.6 });
    collide(a, true); allies.push(a);
    burst(a.x, a.y, 24, '#bcd6ff', 110, 3, 'mote', 0.9); ripple(a.x, a.y + 6, 26, 0.5);
  }
  tone(660, 0.9, 'sine', 0.06, -60); tone(990, 1.1, 'sine', 0.04, -80); SFX.spell();
  toast('Đã gọi hồn: ' + sp.name);
  return true;
}
function hurtAlly(a, dmg, fx, fy) {
  if (a.dead || a.state === 'bones' || (a.invuln || 0) > 0) return false;
  const ang = Math.atan2(a.y - fy, a.x - fx), d = Math.max(1, Math.round(dmg * (a.sp === 'knight' ? 0.45 : 0.6)));
  a.hp -= d; a.hurtFlash = 0.12; a.invuln = 0.25; a.vx += Math.cos(ang) * 120; a.vy += Math.sin(ang) * 120;
  burst(a.x, a.y, 6, '#bcd6ff', 120, 2, 'dot', 0.4, ang);
  if (a.hp <= 0) {
    if (SPIRITS[a.sp].revive && !a.revived) { a.revived = true; a.state = 'bones'; a.t = 0; a.hp = 0; burst(a.x, a.y, 16, '#dfe8ff', 110, 3, 'dot', 0.6); return true; }
    a.dead = true; a.state = 'dead'; a.t = 0; dissolve(a, '#bcd6ff');
    for (const e of enemies) if (e.foe === a) e.foe = null;
  }
  return true;
}
function allyArcHit(src, x, y, face, range, arc, dmg, only) {
  if (!allies.length) return;
  const tok = (src.atkTok || 0) * 100 + (src.i || 0);
  for (const a of only ? [only] : allies) {
    if (a.dead || a.state === 'bones' || (a.hitSrc === src && a.hitTok === tok)) continue;
    if (!inArc(x, y, face, range, arc, a.x, a.y, a.r)) continue;
    a.hitSrc = src; a.hitTok = tok; hurtAlly(a, dmg, x, y);
  }
}
// đòn của hồn: gây sát thương như phép (không chí mạng, không khựng hình), và kéo sự chú ý của quái về phía mình
function allyStrike(a, e, dmg) {
  hitEnemy(e, { phys: dmg }, 12, a.x, a.y, 'spell', { quiet: true, ally: true });
  if (!e.isBoss && !e.isDragon && !e.isFinal && !e.dead && (!e.foe || e.foe.dead) && Math.random() < 0.55) e.foe = a;
}
function pickAllyTarget(a) {
  let best = null, bd = 520;
  for (const e of targets()) {
    if (e.dead || (e.z || 0) > 40 || e.state === 'bones') continue;
    const awake = e.isBoss || e.isDragon || e.isFinal || e.state === 'chase' || e.state === 'atk' || e.state === 'stagger' || e.state === 'broken';
    if (!awake || dist(e.x, e.y, P.x, P.y) > 700) continue;
    const d = dist(a.x, a.y, e.x, e.y) - (e.foe === a ? 80 : 0);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}
let allyIdle = 0;
function updateAllies(dt) {
  if (!allies.length) return;
  // hết giao chiến một lúc, ngươi ngã xuống hoặc đi quá xa thì hồn tan đi
  allyIdle = inCombat() ? 0 : allyIdle + dt;
  const leave = allyIdle > 6 || P.state === 'dead' || G.mode === 'dead';
  for (const a of allies) {
    a.t += dt; a.anim += dt;
    if (a.dead) continue;
    if (leave || dist(a.x, a.y, P.x, P.y) > 1000) { a.dead = true; a.state = 'dead'; a.t = 0; dissolve(a, '#bcd6ff'); continue; }
    const sp = SPIRITS[a.sp];
    if (a.invuln > 0) a.invuln -= dt;
    if (a.hurtFlash > 0) a.hurtFlash -= dt;
    a.cd -= dt;
    if (a.vx || a.vy) { moveCircle(a, a.vx * dt, a.vy * dt, true); const f = Math.exp(-9 * dt); a.vx *= f; a.vy *= f; }
    if (Math.random() < dt * 5) addPart(a.x + rand(-a.r, a.r), a.y + rand(-a.r, a.r * 0.5), 0, -24, 0.7, rand(1.2, 2), 'rgba(190,215,255,.8)', 'mote');
    const go = (ang, s) => { moveCircle(a, Math.cos(ang) * s * dt, Math.sin(ang) * s * dt, true); a.moving = true; a.face = turn(a.face, ang, 8 * dt); };
    a.moving = false;
    if (a.state === 'bones') {
      if (a.t > 3) { a.state = 'follow'; a.hp = Math.round(a.maxHp * 0.6); a.invuln = 0.4; burst(a.x, a.y, 16, '#dfe8ff', 110, 3, 'dot', 0.6); }
      continue;
    }
    if (a.state === 'atk') {
      const A = a.atk, e = a.tgt;
      if (a.t < A.wind) { if (e && !e.dead) a.face = turn(a.face, Math.atan2(e.y - a.y, e.x - a.x), 6 * dt); continue; }
      if (!a.fired) {
        a.fired = true;
        if (e && !e.dead) {
          if (sp.ranged) {
            const ang = Math.atan2(e.y - a.y, e.x - a.x);
            projs.push({ x: a.x + Math.cos(ang) * 14, y: a.y + Math.sin(ang) * 14, vx: Math.cos(ang) * 330, vy: Math.sin(ang) * 330, r: 7, kind: 'spit', friendly: true, life: 1.2, parts: { phys: a.dmg }, poise: 8, allyShot: a });
            noise(0.1, 0.1, 900, 1);
          } else {
            a.vx += Math.cos(a.face) * 160; a.vy += Math.sin(a.face) * 160;
            if (inArc(a.x, a.y, a.face, sp.range + 14, 1.8, e.x, e.y, e.r)) allyStrike(a, e, a.dmg);
            noise(0.08, 0.08, 1800, 1);
          }
        }
      }
      if (a.t >= A.wind + A.act + A.rec) { a.state = 'chase'; a.t = 0; a.atk = null; a.cd = rand(0.5, 1.1) * (a.sp === 'wolves' ? 0.8 : 1); }
      continue;
    }
    if (!a.tgt || a.tgt.dead || Math.random() < dt * 0.5) a.tgt = pickAllyTarget(a);
    const e = a.tgt;
    if (e) {
      a.state = 'chase';
      const d = dist(a.x, a.y, e.x, e.y), ang = Math.atan2(e.y - a.y, e.x - a.x), reach = sp.range + e.r;
      if (sp.ranged) {
        if (d > reach) go(ang, sp.speed); else if (d < 120) go(ang + Math.PI, sp.speed * 0.8); else a.face = turn(a.face, ang, 6 * dt);
      } else if (d > reach * 0.8) go(ang, sp.speed);
      else a.face = turn(a.face, ang, 8 * dt);
      if (a.cd <= 0 && d < reach + 6 && (!sp.ranged || losClear(a.x, a.y, e.x, e.y))) {
        a.state = 'atk'; a.t = 0; a.fired = false; a.atk = { wind: sp.ranged ? 0.45 : a.sp === 'knight' ? 0.5 : 0.28, act: 0.14, rec: 0.3, range: sp.range, arc: 1.8, swing: Math.random() < 0.5 ? 1 : -1, kind: sp.ranged ? 'shot' : 'melee' };
      }
    } else {
      // không có địch: đi theo sau lưng ngươi
      a.state = 'follow';
      const i = allies.indexOf(a), fa = P.face + Math.PI + (i - 1) * 0.7, fx = P.x + Math.cos(fa) * 56, fy = P.y + Math.sin(fa) * 56, d = dist(a.x, a.y, fx, fy);
      if (d > 20) go(Math.atan2(fy - a.y, fx - a.x), Math.min(sp.speed * 1.2, 90 + d * 2));
    }
  }
  // tách các hồn khỏi nhau và khỏi quái
  for (const a of allies) {
    if (a.dead) continue;
    for (const o of allies.concat(enemies)) {
      if (o === a || o.dead || (o.z || 0) > 20) continue;
      const dx = a.x - o.x, dy = a.y - o.y, rr = a.r + o.r, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2), push = (rr - d) * 0.5; a.x += dx / d * push; a.y += dy / d * push; }
    }
  }
  allies = allies.filter(a => !a.dead || a.t < 1.3);
}
// hồn đồng minh: vẽ ra một canvas nhỏ, phủ sắc xanh hồn ma rồi dán lại mờ như sương
const SPIRIT_CV = document.createElement('canvas'), sctx = SPIRIT_CV.getContext('2d');
function drawAlly(a) {
  if (!a.dead) {
    const rr = a.r * 2 + Math.sin(a.anim * 3) * 2, g = ctx.createRadialGradient(a.x, a.y, 2, a.x, a.y, rr);
    g.addColorStop(0, 'rgba(150,190,255,.32)'); g.addColorStop(1, 'rgba(150,190,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(a.x, a.y, rr, 0, TAU); ctx.fill();
  }
  const R = 80, sc = WZ, px = Math.ceil(R * 2 * sc);
  if (SPIRIT_CV.width < px) { SPIRIT_CV.width = px; SPIRIT_CV.height = px; }
  sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalCompositeOperation = 'source-over'; sctx.globalAlpha = 1; sctx.clearRect(0, 0, px, px);
  sctx.setTransform(sc, 0, 0, sc, (R - a.x) * sc, (R - a.y) * sc);
  const main = ctx, st = a.state;
  if (st === 'follow') a.state = 'chase';
  ctx = sctx;
  try { if (st === 'bones') drawBonePile(a); else drawEnemy(a); } finally { ctx = main; a.state = st; }
  sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalCompositeOperation = 'source-atop';
  sctx.fillStyle = 'rgba(130,170,255,.55)'; sctx.fillRect(0, 0, px, px);
  sctx.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.globalAlpha = 0.86 + Math.sin(a.anim * 4) * 0.06;
  ctx.drawImage(SPIRIT_CV, 0, 0, px, px, a.x - R, a.y - R, R * 2, R * 2);
  ctx.restore();
}
// phù thủy hiện ra bên Ân Điển lúc đêm, trao chuông gọi hồn (như Renna ở Elden Ring)
function witchVisit() {
  if (S.bell || !isNight()) return;
  S.bell = true; S.spirits = S.spirits || []; if (!S.spirits.includes('wolves')) S.spirits.push('wolves'); S.spiritSel = S.spiritSel || 'wolves';
  later(0.6, () => {
    subtitle('“Ngươi là kẻ không còn ánh vàng... Hãy cầm lấy chiếc chuông này. Hồn của những kẻ đã khuất sẽ đáp lời ngươi.”', 6);
    banner('item', 'CHUÔNG GỌI HỒN', 'Tro Sói Cô Độc · chọn tro trong Túi đồ, dùng chuông khi đang giao chiến', 5);
    SFX.grace();
  });
  save();
}
