'use strict';
// Vòng Vàng Vỡ — Người chơi và gây sát thương
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
  dmg *= DIFF.dmg * regionMul(P.x, P.y);
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
