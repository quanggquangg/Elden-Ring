'use strict';
// Vòng Vàng Vỡ — AI kẻ địch thường và miniboss
// ───────────────────────── AI kẻ địch thường ─────────────────────────
const PROJ_DT = { orb: 'magic', shard: 'magic', comet: 'magic', porb: 'magic', hwave: 'holy', hbolt: 'holy' };
function startEnemyAtk(e, idx) {
  e.state = 'atk'; e.atk = e.T.attacks[idx]; e.t = 0; e.atkHit = false; e.lunged = false; e.fired = false; e.glinted = false; e.fade = 0; e.landed = false;
}
function enemyShot(e, a, pr) {
  projs.push({ x: e.x + Math.cos(a) * 22, y: e.y + Math.sin(a) * 22, vx: Math.cos(a) * pr.speed, vy: Math.sin(a) * pr.speed, r: pr.r, dmg: pr.dmg * e.dm, kind: pr.kind || 'orb', friendly: false, life: 3, puddle: pr.puddle, dt: PROJ_DT[pr.kind] || 'phys' });
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
// dịch chuyển ra xa người chơi (pháp sư, nữ hoàng pha lê)
function warpAway(e, d0) {
  const col = e.T.look ? e.T.look.orb || e.T.look.trim : '#cfefff';
  burst(e.x, e.y, 18, col, 120, 3, 'mote', 0.6);
  const base = Math.atan2(e.y - P.y, e.x - P.x);
  for (let k = 0; k < 10; k++) {
    const a = base + rand(-1.3, 1.3), nx = P.x + Math.cos(a) * d0, ny = P.y + Math.sin(a) * d0;
    if (pointBlocked(nx, ny) || dist(nx, ny, e.hx, e.hy) > (e.T.leash || 680) - 40 || areaAt(nx, ny) !== areaAt(e.x, e.y)) continue;
    if (e.room && e.roomRect && !inRect(nx, ny, e.roomRect, -e.r)) continue;
    e.x = nx; e.y = ny; collide(e, true); break;
  }
  e.face = Math.atan2(P.y - e.y, P.x - e.x);
  burst(e.x, e.y, 18, col, 120, 3, 'mote', 0.6); SFX.glint();
}
function updateEnemyAtk(e, dt, ang) {
  const A = e.atk, t = e.t, T = e.T, kind = A.kind || 'melee';
  const finish = () => { if (A.next !== undefined) startEnemyAtk(e, A.next); else endEnemyAtk(e); };
  if (t < A.wind) {
    e.face = turn(e.face, ang, T.track * dt);
    if (kind === 'blink' || kind === 'warp') e.fade = t / A.wind;
    if (!e.glinted && t > A.wind * 0.35) { e.glinted = true; if (T.look && kind === 'melee') addPart(e.x + Math.cos(e.face) * 18, e.y + Math.sin(e.face) * 18 - 8, 0, 0, 0.35, 10, '#fff6d8', 'glint'); }
    if (kind === 'charge' && Math.random() < dt * 20) addPart(e.x + rand(-10, 10), e.y + rand(-10, 10), 0, -20, 0.4, 3, '#9fb4ff');
    if ((kind === 'healall' || kind === 'pillars' || kind === 'rain' || kind === 'nova') && Math.random() < dt * 24) addPart(e.x + rand(-14, 14), e.y + rand(-14, 14) - 10, 0, -40, 0.5, 2.5, T.look && T.look.orb ? T.look.orb : '#ffe08a', 'mote');
    return;
  }
  const once = !e.fired; e.fired = true;
  switch (kind) {
    case 'melee':
      if (t < A.wind + A.act) {
        if (!e.lunged) { e.lunged = true; e.vx += Math.cos(e.face) * A.lunge; e.vy += Math.sin(e.face) * A.lunge; if (!T.beast && T.id !== 'bat' && T.id !== 'spider') SFX.swing(); }
        if (!e.atkHit && P.state !== 'dead' && inArc(e.x, e.y, e.face, A.range, A.arc, P.x, P.y, P.r)) {
          if (hurtPlayer(A.dmg, e.x, e.y, A.dmg * e.dm >= 45, e)) { e.atkHit = true; if (A.poison && P.state !== 'guard') P.poisonB += A.poison; }
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
        for (let i = 0; i < A.n; i++) spawnFireball(e.x, e.y, P.x + P.mvx * 0.5 + (i ? rand(-90, 90) : 0), P.y + P.mvy * 0.5 + (i ? rand(-90, 90) : 0), A.dmg * e.dm, A.r, 300);
        SFX.swing();
      }
      break;
    case 'blink':
      if (once) { blinkBehind(e); e.fade = 0; }
      finish();
      return;
    case 'warp':
      if (once) { warpAway(e, A.dist); e.fade = 0; }
      finish();
      return;
    case 'slam':
      if (once) {
        const hx = e.x + Math.cos(e.face) * A.off, hy = e.y + Math.sin(e.face) * A.off;
        aoeBlast(hx, hy, A.r, A.dmg * e.dm); if (A.ring) addRing(hx, hy, A.ring[0], A.ring[1], A.ring[2], A.ring[3] * e.dm);
        SFX.boom(); shake(10); burst(hx, hy, 30, T.look && T.look.glow === '#9fd0ff' ? 'rgba(190,230,255,.8)' : 'rgba(130,115,90,.7)', 200, 6, 'dot', 0.7);
      }
      break;
    case 'leap':
      if (t < A.wind + A.air) {
        if (!e.lunged) {
          e.lunged = true; e.lx = e.x; e.ly = e.y;
          let tx = P.x + P.mvx * 0.3, ty = P.y + P.mvy * 0.3;
          if (pointBlocked(tx, ty)) { tx = P.x; ty = P.y; }
          e.ltx = tx; e.lty = ty; addMark(tx, ty, A.r, A.air); SFX.wing();
        }
        const k = (t - A.wind) / A.air, ez = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        e.x = lerp(e.lx, e.ltx, ez); e.y = lerp(e.ly, e.lty, ez); e.z = Math.sin(k * Math.PI) * 80;
        e.face = Math.atan2(e.lty - e.ly, e.ltx - e.lx);
        return;
      }
      if (!e.landed) {
        e.landed = true; e.z = 0; collide(e, true);
        aoeBlast(e.x, e.y, A.r, A.dmg * e.dm); if (A.ring) addRing(e.x, e.y, A.ring[0], A.ring[1], A.ring[2], A.ring[3] * e.dm);
        SFX.boom(); shake(10); burst(e.x, e.y, 34, 'rgba(150,130,95,.7)', 220, 6, 'dot', 0.8);
      }
      if (t >= A.wind + A.air + A.rec) finish();
      return;
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
        const pk = A.proj || 'porb';
        const ring = off => { if (e.dead) return; for (let i = 0; i < A.n; i++) { const a = i / A.n * TAU + off; enemyShot(e, a, { speed: 210, dmg: A.dmg, r: 8, kind: pk }); } SFX.spell(); };
        ring(0); later(0.4, () => ring(Math.PI / A.n));
      }
      break;
    case 'pillars':
      if (once) {
        const a = Math.atan2(P.y - e.y, P.x - e.x);
        for (let i = 0; i < A.n; i++) addDelayed(e.x + Math.cos(a) * (70 + i * 70), e.y + Math.sin(a) * (70 + i * 70), A.r, A.delay + i * 0.1, A.dmg * e.dm);
        SFX.spell();
      }
      break;
    case 'rain':
      if (once) {
        addDelayed(P.x + P.mvx * 0.3, P.y + P.mvy * 0.3, A.r, A.delay, A.dmg * e.dm);
        for (let i = 1; i < A.n; i++) { const a = rand(0, TAU), rr = Math.sqrt(Math.random()) * A.spread; addDelayed(P.x + Math.cos(a) * rr, P.y + Math.sin(a) * rr, A.r, A.delay + rand(0, 0.5), A.dmg * e.dm); }
        SFX.spell();
      }
      break;
    case 'nova':
      if (once) { addRing(e.x, e.y, A.r0, A.r1, A.dur, A.dmg * e.dm); aoes.push({ kind: 'flash', x: e.x, y: e.y, r: 80, t: 0, dur: 0.4, col: 'magic' }); SFX.boom(); shake(8); }
      break;
    case 'healall':
      if (once) {
        for (const o of enemies) if (!o.dead && dist(o.x, o.y, e.x, e.y) < A.r && o.hp < o.maxHp) {
          const h = Math.round(o.maxHp * A.amt); o.hp = Math.min(o.maxHp, o.hp + h);
          burst(o.x, o.y, 16, '#ffe39a', 70, 3, 'mote', 0.9); floatText(o.x, o.y - o.r - 14, '+' + h, '#ffe39a');
        }
        SFX.grace();
      }
      break;
    case 'summon':
      if (once) {
        const n = A.n || 2;
        for (let i = 0; i < n; i++) {
          const s = i % 2 ? 1 : -1, g = makeEnemy(A.what || 'ghost', e.x + s * 70, e.y + 20 + i * 10);
          g.summoned = true; g.state = 'chase'; g.hx = e.x; g.hy = e.y; collide(g, true);
          enemies.push(g); burst(g.x, g.y, 20, A.what === 'sorcerer' ? '#aee4ff' : '#cfefff', 120, 3, 'dot', 0.6);
        }
        SFX.roar();
      }
      break;
  }
  if (t >= A.wind + (A.rec || 0)) finish();
}
function endEnemyAtk(e) { e.state = 'chase'; e.t = 0; e.atk = null; e.fade = 0; e.z = 0; e.cd = rand(e.T.cd[0], e.T.cd[1]) * 0.85 * (e.p2 ? e.T.p2.cdMul : 1); }
function enterPhase2(e) {
  const T = e.T;
  e.state = 'phase'; e.t = 0; e.atk = null; e.invuln = 1.8; e.z = 0; e.poiseAcc = 0;
  SFX.roar(); shake(12); addRing(e.x, e.y, 30, 240, 0.6, 0);
  burst(e.x, e.y, 60, T.look ? T.look.trim : '#f3cf6e', 240, 4, 'dot', 1.1);
  if (T.p2.line) subtitle(T.p2.line);
}
function updateEnemies(dt) {
  const alive = P.state !== 'dead';
  const pInArena = inArena(P.x, P.y);
  for (const e of enemies) {
    e.t += dt;
    if (e.dead) continue;
    const T = e.T, d = dist(e.x, e.y, P.x, P.y);
    if (e.state === 'idle' && d > 1400) continue; // quái ở xa đứng yên để đỡ tốn tính toán
    e.cd -= dt; e.anim += dt; e.lastHit += dt; e.moving = false;
    if (e.invuln > 0) e.invuln -= dt;
    if (e.hurtFlash > 0) e.hurtFlash -= dt;
    if (e.lastHit > 2.5) e.poiseAcc = Math.max(0, e.poiseAcc - dt * e.poise * 0.5);
    if (e.bleed && e.lastHit > 2) e.bleed = Math.max(0, e.bleed - 12 * dt);
    if (T.ghost && Math.random() < dt * 4) addPart(e.x + rand(-10, 10), e.y + rand(-10, 10), 0, -20, 0.7, 2, 'rgba(200,235,255,.7)', 'mote');
    if (e.vx || e.vy) {
      moveCircle(e, e.vx * dt, e.vy * dt, true);
      const f = Math.exp(-9 * dt); e.vx *= f; e.vy *= f;
      if (Math.abs(e.vx) < 1) e.vx = 0; if (Math.abs(e.vy) < 1) e.vy = 0;
    }
    const ang = Math.atan2(P.y - e.y, P.x - e.x), homeD = dist(e.x, e.y, e.hx, e.hy);
    const wet = !T.swim && !T.flier && !T.floats && inWater(e.x, e.y), spd = T.speed * e.spd * (wet ? 0.6 : 1);
    const go = (a, s) => { moveCircle(e, Math.cos(a) * s * dt, Math.sin(a) * s * dt, true); e.moving = true; };
    // miniboss trong phòng boss chỉ tỉnh dậy khi trận đấu bắt đầu
    const asleep = e.room && G.dfight !== e.room;
    if (T.p2 && !e.p2 && e.state !== 'phase' && e.hp <= e.maxHp * T.p2.at && e.state !== 'broken') enterPhase2(e);
    switch (e.state) {
      case 'idle': {
        if (alive && !asleep && (d < T.aggro || e.challenge) && !pInArena) { e.state = 'chase'; e.t = 0; break; }
        if (!e.wander || e.t > e.wander.until) e.wander = { x: e.hx + rand(-70, 70), y: e.hy + rand(-70, 70), until: e.t + rand(2, 5) };
        if (!e.room && dist(e.x, e.y, e.wander.x, e.wander.y) > 10) { const a = Math.atan2(e.wander.y - e.y, e.wander.x - e.x); e.face = turn(e.face, a, 4 * dt); go(a, spd * 0.32); }
        break;
      }
      case 'return': {
        if (alive && !asleep && d < T.aggro * 0.6 && homeD < 400 && !pInArena) { e.state = 'chase'; break; }
        const a = Math.atan2(e.hy - e.y, e.hx - e.x); e.face = turn(e.face, a, 6 * dt); go(a, spd);
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.3 * dt);
        if (homeD < 14) { e.state = 'idle'; e.t = 0; }
        break;
      }
      case 'chase': {
        if (!alive || asleep || (homeD > (T.leash || 680) && !e.challenge) || pInArena) { e.state = 'return'; e.t = 0; break; }
        e.face = turn(e.face, ang, 7 * dt);
        const pick = e.p2 && T.p2.pick ? T.p2.pick : T.pick;
        if (T.flier) {
          e.orbit = (e.orbit || rand(0, TAU)) + dt * 2.2 * e.strafe;
          const tx = P.x + Math.cos(e.orbit) * 95, ty = P.y + Math.sin(e.orbit) * 95;
          go(Math.atan2(ty - e.y, tx - e.x), spd);
          if (e.cd <= 0 && d < 140) startEnemyAtk(e, 0);
        } else if (T.ranged) {
          let mv = 0, side = 0;
          if (d > T.keep + 50) mv = 1; else if (d < T.keep - 70) mv = -1; else side = e.strafe;
          if (Math.random() < dt * 0.4) e.strafe *= -1;
          if (mv) go(mv > 0 ? ang : ang + Math.PI, spd);
          else if (side) go(ang + Math.PI / 2 * side, spd * 0.6);
          if (e.cd <= 0 && d < T.aggro + 40) { const idx = pick ? pick(e, d) : 0; if (idx >= 0) startEnemyAtk(e, idx); }
        } else {
          const reach = (T.atkRange || 50) + P.r;
          if (d > reach * 0.85) go(ang, spd);
          else if (e.cd > 0) { go(ang + Math.PI / 2 * e.strafe, spd * 0.45); if (Math.random() < dt * 0.5) e.strafe *= -1; }
          if (e.cd <= 0) {
            const idx = pick ? pick(e, d) : d < reach ? (e.type === 'knight' && Math.random() < 0.35 ? 2 : 0) : -1;
            if (idx >= 0) startEnemyAtk(e, idx);
          }
        }
        break;
      }
      case 'atk': updateEnemyAtk(e, dt, ang); break;
      case 'phase':
        e.face = turn(e.face, ang, 3 * dt);
        if (Math.random() < dt * 30) addPart(e.x + rand(-20, 20), e.y + rand(-20, 20), 0, -60, 0.6, 3, T.look ? T.look.trim : '#f3cf6e', 'mote');
        if (e.t > 1.6) { e.p2 = true; e.dm = T.p2.dmgMul; e.spd = T.p2.speed; e.state = 'chase'; e.t = 0; e.cd = 0.3; }
        break;
      case 'stagger': if (e.t > e.stagDur) { e.state = 'chase'; e.t = 0; e.cd = rand(0.2, 0.6); } break;
      case 'broken': if (e.t > 2.2) { e.state = 'chase'; e.t = 0; e.poiseAcc = 0; } break;
    }
    if (e.state !== 'atk' && e.z) e.z = Math.max(0, e.z - 300 * dt);
  }
  // tách các thực thể chồng lên nhau (chỉ quanh người chơi)
  const live = enemies.filter(e => !e.dead && Math.abs(e.x - P.x) < 1100 && Math.abs(e.y - P.y) < 1100);
  for (let i = 0; i < live.length; i++) {
    const a = live[i];
    for (let j = i + 1; j < live.length; j++) {
      const b = live[j], dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2), push = (rr - d) / 2; a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push; }
    }
    if (P.state !== 'dead' && (a.z || 0) < 20) {
      const dx = a.x - P.x, dy = a.y - P.y, rr = a.r + P.r, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2), push = rr - d; a.x += dx / d * push * 0.6; a.y += dy / d * push * 0.6; P.x -= dx / d * push * 0.4; P.y -= dy / d * push * 0.4; }
    }
  }
}
