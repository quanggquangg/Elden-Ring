'use strict';
// Vòng Vàng Vỡ — Boss: Varek, rồng Ignarth, trận cuối
// ───────────────────────── boss: Varek ─────────────────────────
const sw = (wind, act, rec, dmg, range, arc, lunge, swing) => ({ k: 'swing', wind, act, rec, dmg, range, arc, lunge, swing });
const BOSS_MOVES = {
  combo: () => [sw(0.55, 0.14, 0.12, 50, 100, 2.2, 260, 1), sw(0.95, 0.14, 0.12, 48, 100, 2.2, 260, -1), sw(0.42, 0.16, 0.85, 60, 112, 2.6, 330, 1)],
  combo2: () => [sw(0.5, 0.13, 0.1, 52, 100, 2.2, 260, 1), sw(1.05, 0.13, 0.1, 50, 100, 2.2, 280, -1), sw(0.35, 0.13, 0.1, 50, 100, 2.2, 260, 1), sw(0.7, 0.16, 0.9, 66, 118, 2.8, 360, -1)],
  leap: () => [{ k: 'leap', wind: 0.5, air: 0.72, rec: 0.85, dmg: 72, r: 115 }],
  daggers: () => [{ k: 'throw', wind: 0.5, rec: 0.55, n: boss.phase === 2 || boss.v === 2 ? 5 : 3, spread: 0.22 }],
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
  const b = boss, p2 = b.phase === 2 || b.v === 2, opts = [];
  if (d < 160) { opts.push(['combo', p2 ? 2 : 4], ['hop', 1]); if (p2) opts.push(['combo2', 3], ['hammer', 2.5]); }
  else if (d < 420) { opts.push(['leap', 3], ['daggers', 2]); if (p2) opts.push(['rain', 2]); if (p2 && d < 230) opts.push(['hammer', 1]); }
  else { opts.push(['leap', 2], ['daggers', 1]); if (p2) opts.push(['rain', 1]); }
  let total = 0;
  if (b.v === 2 && b.phase === 2) opts.push(['rain', 1.5], ['combo2', 1.5]);
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
    if (A.i >= A.steps.length) { b.state = 'chase'; b.t = 0; b.atk = null; b.cd = b.v === 2 && b.phase === 2 ? rand(0.15, 0.55) : b.phase === 2 || b.v === 2 ? rand(0.25, 0.8) : rand(0.6, 1.3); }
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
          A.tx = clamp(P.x + P.mvx * 0.35, b.A.x + 40, b.A.x + b.A.w - 40);
          A.ty = clamp(P.y + P.mvy * 0.35, b.A.y + 40, b.A.y + b.A.h - 40);
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
          if (b.phase === 2 || b.v === 2) addRing(b.x, b.y, s.r, s.r + 150, 0.45, 30);
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
      const every = b.v === 2 && b.phase === 2 ? 0.17 : 0.24;
      while (A.acc > every && t < s.dur) { A.acc -= every; addDelayed(P.x + rand(-45, 45), P.y + rand(-45, 45), 52, 0.9, 40); }
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
      const spd = (b.phase === 2 ? 125 : 105) * (b.v === 2 ? 1.15 : 1);
      if (d > 95) { b.x += Math.cos(ang) * spd * dt; b.y += Math.sin(ang) * spd * dt; }
      else { const a = ang + Math.PI / 2; b.x += Math.cos(a) * 40 * dt; b.y += Math.sin(a) * 40 * dt; }
      if (b.cd <= 0 && P.state !== 'dead') bossChoose(d);
      break;
    }
    case 'phase':
      if (!b.fx && b.t > 0.7) {
        b.fx = true; SFX.roar(); addRing(b.x, b.y, 30, 260, 0.6, 35); shake(14);
        subtitle(b.v === 2 ? '“Ta là Vua Ẩn Mặt... kẻ đã giữ Kinh Thành này suốt ngàn năm!”' : '“Quỳ xuống! Ánh vàng này không dành cho kẻ nhạt phai!”');
        burst(b.x, b.y, 60, '#f3cf6e', 240, 4, 'dot', 1.1);
      }
      if (b.t > 2) { b.phase = 2; b.state = 'chase'; b.t = 0; b.cd = 0.3; }
      break;
    case 'atk': bossAtk(dt, ang); break;
    case 'stagger': if (b.t > b.stagDur) { b.state = 'chase'; b.t = 0; b.cd = 0.3; } break;
    case 'broken': b.z = 0; if (b.t > 2.6) { b.state = 'chase'; b.t = 0; b.cd = 0.2; b.poiseAcc = 0; } break;
  }
  b.x = clamp(b.x, b.A.x + b.r, b.A.x + b.A.w - b.r); b.y = clamp(b.y, b.A.y + b.r, b.A.y + b.A.h - b.r);
  if ((b.phase === 2 || b.v === 2) && Math.random() < dt * 14) addPart(b.x + rand(-26, 26), b.y + rand(-20, 20), rand(-8, 8), rand(-50, -20), rand(0.6, 1.1), rand(1.5, 3), '#f3cf6e', 'mote');
  if (b.z < 5 && P.state !== 'dead') {
    const dx = P.x - b.x, dy = P.y - b.y, rr = b.r + P.r, d2 = dx * dx + dy * dy;
    if (d2 < rr * rr && d2 > 1e-6) { const dd = Math.sqrt(d2); P.x = b.x + dx / dd * rr; P.y = b.y + dy / dd * rr; collide(P, false); }
  }
}
function startBossFight() {
  G.bossFight = true; boss.state = 'intro'; boss.t = 0;
  if (P.mounted) P.mounted = false;
  SFX.roar(); shake(8);
  subtitle(boss.v === 2 ? '“Lại là ngươi... Lần này ta sẽ không nương tay nữa.”' : '“Kẻ nhạt phai... ngươi không xứng đáng chạm tới Cây Vàng.”');
}
function bossDefeated() {
  const b = boss;
  G.bossFight = false;
  banner('felled', 'KẺ THÙ ĐÃ BỊ HẠ GỤC', '', 4.6); SFX.felled();
  burst(b.x, b.y, 80, '#f3cf6e', 280, 5, 'dot', 1.6);
  if (b.v === 1) {
    S.bossDead = true;
    gainRunes(2500, b.x, b.y);
    later(9.2, () => grant({ weapon: 'varek', pouch: 1 }, b.x, b.y));
    subtitle('“Ánh vàng... đã chọn... ngươi...”', 3.6);
    later(4.4, () => subtitle('Cánh cổng phía bắc đã mở. Cao Nguyên Hoàng Kim ở phía trước.', 4.5));
  } else {
    S.boss2Dead = true;
    gainRunes(20000, b.x, b.y);
    later(5, () => grant({ items: { somber2: 2 }, tal: 'guard' }, b.x, b.y));
    subtitle('“Kẻ nhạt phai... hãy thắp lên... ngọn lửa cuối cùng...”', 4);
    later(9.5, () => subtitle('Lối lên Cây Vàng đã mở.', 4));
  }
  save();
}

// ───────────────────────── rồng: Ignarth ─────────────────────────
function makeDragon() {
  return { isDragon: true, noParry: true, name: 'Ignarth, Rồng Tro Cổ Đại', x: LAIR.x, y: LAIR.y, r: 40, hp: 2200, maxHp: 2200, ghost: 2200, res: { fire: 0.4 },
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
  gainRunes(5000, dragon.x, dragon.y);
  banner('felled', 'KẺ THÙ ĐÃ BỊ HẠ GỤC', '', 4.2); SFX.felled();
  burst(dragon.x, dragon.y, 90, '#ff9a4a', 300, 5, 'dot', 1.6);
  const dx = dragon.x, dy = dragon.y;
  later(4.4, () => grant({ gr: 'swamp', weapon: 'greatsword' }, dx, dy));
  save();
}

// ───────────────────────── trận cuối: Aurel (phase 1) và Thú Vàng (phase 2) ─────────────────────────
function makeFinal() {
  const hp = 3400;
  return { isFinal: true, res: { holy: 0.6 }, name: 'Aurel, Vị Vua Tro Tàn', x: RC.x, y: RC.y - 170, r: 26, hp, maxHp: hp, ghost: hp, face: Math.PI / 2, state: 'intro', t: 0, cd: 1.2,
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
        const hp = 4400;
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
  S.lastGrace = S.discovered.includes(21) ? 21 : 20;
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
    P.x = TREE_POS.x; P.y = TREE_POS.y + 125; P.vx = P.vy = 0; fb = null; G.region = null;
    cam.x = P.x; cam.y = P.y; clampCam(); G.fade = 1;
  });
}
