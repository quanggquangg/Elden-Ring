'use strict';
// Vòng Vàng Vỡ — AI kẻ địch thường
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
