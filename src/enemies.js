'use strict';
// Gravebound — AI kẻ địch thường và miniboss
// ───────────────────────── AI kẻ địch thường ─────────────────────────
const PROJ_DT = { orb: 'magic', shard: 'magic', comet: 'magic', porb: 'magic', hwave: 'holy', hbolt: 'holy', ember: 'fire' };
// ───────────────────────── giác quan, lượt tấn công, tránh vật cản ─────────────────────────
// Như game souls: quái nhìn về phía trước (~120°), bị tường che thì không thấy; ở gần thì nghe tiếng động.
// Đi bộ rất êm (lén đâm lưng được), chạy nhanh, lăn, vung vũ khí và cưỡi ngựa thì ồn hơn nhiều.
const RANGED_KINDS = new Set(['shot', 'lob', 'orbs', 'rain', 'pillars', 'nova', 'summon', 'healall']);
const TOK = { melee: 0, ranged: 0 };
let NOISE = 0.1;
// Các khoảng cách được cân theo tỉ lệ của thế giới này, không lấy nguyên số của Elden Ring:
// hai con quái gần nhau thường cách ~200 đơn vị, khung hình thấy ~250 đơn vị theo chiều dọc, một cú lăn đi ~180.
const SIGHT_CAP = 290, ELITE_SIGHT = 330, LEASH = 520, GROUP_R = 150, CAMP_R = 190, GROUP_MAX = 2, CROWD_CAP = 5, LOST_T = 3;
const sightR = T => Math.min(T.aggro, T.miniboss ? T.aggro : T.elite ? ELITE_SIGHT : SIGHT_CAP);
function playerNoise() {
  if (P.state === 'dead') return 0;
  if (P.mounted) return 0.5;
  if (P.sprinting) return 0.55;
  if (P.state === 'roll' || P.state === 'attack') return 0.35;
  return Math.hypot(P.mvx || 0, P.mvy || 0) > 20 ? 0.12 : 0.07;
}
// số quái thường đang đuổi quanh người chơi: đủ đông thì tiếng động và tiếng gọi không kéo thêm con nữa
let CHASERS = 0;
function countChasers() {
  CHASERS = 0;
  for (const e of enemies) if (!e.dead && !e.elite && !e.T.miniboss && (e.state === 'chase' || e.state === 'atk') && Math.abs(e.x - P.x) < 500 && Math.abs(e.y - P.y) < 500) CHASERS++;
}
// tường, cổng đóng chắn tầm nhìn; mép biển, vách đá thấp và cây thì không
function losClear(x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 18);
  for (let i = 1; i < n; i++) {
    const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n, c = WALL_GRID.get(Math.floor(x / WCELL) * 1000 + Math.floor(y / WCELL));
    if (c) for (const w of c) if (!w.sea && !w.void && !w.cliff && wallOn(w, false) && x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h) return false;
  }
  return true;
}
function onScreen(x, y, m = 16) { return Math.abs(x - cam.x) < CW / ZOOM / 2 - m && Math.abs(y - cam.y) < CH / ZOOM / 2 - m; }
// mức độ nhận ra người chơi mỗi giây (0 = không thấy, không nghe): quái không phát hiện ngay lập tức
// mà nghi ngờ dần, quay đầu về phía tiếng động; đầy thanh nghi ngờ mới lao vào. Thấy rõ ở gần thì gần như tức thì.
function perceive(e, d, ang) {
  const T = e.T, R = sightR(T);
  if (T.miniboss) return d < T.aggro ? 99 : 0;
  let rate = 0;
  if (d < R * NOISE && (CHASERS < CROWD_CAP || NOISE < 0.13)) rate = NOISE < 0.13 ? 6 : 4;
  if (d < R && e.los && (T.flier || T.floats || Math.abs(angDiff(e.face, ang)) <= 1.05)) rate = Math.max(rate, d < R * 0.45 ? 9 : 3.6);
  return rate;
}
function seesPlayer(e, d, ang) {
  const T = e.T, R = sightR(T);
  if (d < R * NOISE && (CHASERS < CROWD_CAP || NOISE < 0.13)) return true;
  if (d > R) return false;
  if (T.miniboss) return true; // chủ phòng boss luôn cảnh giác

  if (!(T.flier || T.floats) && Math.abs(angDiff(e.face, ang)) > 1.05) return false;
  return e.los;
}
// một con phát hiện thì đồng bọn cùng ổ (đứng sát nhau từ đầu) tỉnh theo, tối đa 2 con gần nhất;
// quanh người chơi đã đủ đông thì thôi không gọi thêm
function alertGroup(e) {
  e.alertT = 0.7;
  if (CHASERS >= CROWD_CAP) return;
  const mates = enemies.filter(o => o !== e && !o.dead && o.state === 'idle' && !o.wakeAt && !(o.room && G.dfight !== o.room) && !o.T.miniboss
    && dist(o.x, o.y, e.x, e.y) < GROUP_R && dist(o.hx, o.hy, e.hx, e.hy) < CAMP_R && losClear(o.x, o.y, e.x, e.y));
  mates.sort((a, b) => dist(a.x, a.y, e.x, e.y) - dist(b.x, b.y, e.x, e.y));
  for (const o of mates.slice(0, Math.min(GROUP_MAX, CROWD_CAP - CHASERS))) o.wakeAt = G.clock + rand(0.2, 0.6);
}
function wake(e, group) { e.state = 'chase'; e.t = 0; e.wakeAt = 0; e.sus = 0; e.alertT = 0.9; if (e.T.intro && !e.introd) { e.introd = true; subtitle(e.T.intro); SFX.roar(); } if (group) alertGroup(e); }
// quái thường chỉ được ra đòn khi còn lượt: mỗi lúc tối đa 2 con cận chiến và 2 con bắn xa (theo độ khó);
// boss, quái tinh anh và Kẻ Xâm Nhập không bị giới hạn. Đòn bắn xa chỉ bắn khi đã vào khung hình và không bị tường chắn.
const tokExempt = e => e.elite || e.T.miniboss || e.invader || e.punish;
const atkClass = A => (RANGED_KINDS.has(A.kind) ? 'ranged' : A.kind === 'warp' ? null : 'melee');
function countTokens() {
  TOK.melee = TOK.ranged = 0;
  for (const e of enemies) if (!e.dead && e.state === 'atk' && e.atk && !tokExempt(e) && Math.abs(e.x - P.x) < 1000 && Math.abs(e.y - P.y) < 1000) { const c = atkClass(e.atk); if (c) TOK[c]++; }
}
function canShoot(e) { return e.los && onScreen(e.x, e.y); }
function tryAttack(e, idx) {
  const A = e.T.attacks[idx], c = atkClass(A);
  if (c === 'ranged' && !canShoot(e)) { e.cd = rand(0.2, 0.4); return false; }
  if (c && !tokExempt(e)) {
    if (TOK[c] >= DIFF.tok[c === 'melee' ? 0 : 1]) { e.cd = rand(0.3, 0.7); e.waiting = 0.8; return false; }
    TOK[c]++;
  }
  e.punish = false; startEnemyAtk(e, idx); return true;
}
// đi vòng vật cản: dò trước mặt, bị chắn thì lệch dần sang một phía (giữ phía đã chọn để khỏi lắc qua lại)
function steer(e, a) {
  const probe = e.r + 16, free = b => !pointBlocked(e.x + Math.cos(b) * probe, e.y + Math.sin(b) * probe);
  if (free(a)) return a;
  const s = e.side || (e.side = Math.random() < 0.5 ? 1 : -1);
  for (const k of [0.5, 1, 1.5, 2.1]) { if (free(a + k * s)) return a + k * s; if (free(a - k * s)) { e.side = -s; return a - k * s; } }
  return a;
}
// bị kẹt quá lâu thì bỏ cuộc quay về; đang quay về mà vẫn kẹt và ở ngoài màn hình thì về thẳng chỗ cũ
function trackProgress(e, dt, target) {
  e.progT = (e.progT || 0) + dt;
  if (e.progT < 0.6) return;
  e.progT = 0;
  const d = dist(e.x, e.y, target[0], target[1]);
  if (e.progD !== undefined && d > e.progD - 8) e.stuckN = (e.stuckN || 0) + 1; else e.stuckN = 0;
  e.progD = d;
  if (e.stuckN >= 5) {
    e.stuckN = 0; e.progD = undefined;
    if (e.state === 'chase') { e.state = 'return'; e.t = 0; }
    else if (e.state === 'return' && !onScreen(e.x, e.y, -80)) { e.x = e.hx; e.y = e.hy; }
  }
}
// uống bình trước mặt kẻ địch là sơ hở: con ở gần có thể ra đòn ngay, boss gần như chắc chắn
function punishHeal() {
  for (const e of enemies) {
    if (e.dead || e.state !== 'chase' || e.T.ranged || e.T.miniboss && e.room && G.dfight !== e.room) continue;
    if (dist(e.x, e.y, P.x, P.y) < (e.T.atkRange || 50) + 110 && Math.random() < (e.elite || e.T.miniboss ? 0.75 : 0.45)) { e.cd = 0; e.punish = true; }
  }
  if (boss && G.bossFight && boss.state === 'chase' && Math.random() < 0.75) boss.cd = 0;
  if (dragon && G.dragonFight && dragon.state === 'chase' && Math.random() < 0.6) dragon.cd = 0;
  if (fb && G.finalFight && fb.state === 'chase' && Math.random() < 0.75) fb.cd = 0;
}
function startEnemyAtk(e, idx) {
  if (Math.abs(e.x - P.x) < 900 && Math.abs(e.y - P.y) < 900) G.caster = { e, t: G.clock };
  e.state = 'atk'; e.atk = e.T.attacks[idx]; e.t = 0; e.atkHit = false; e.lunged = false; e.fired = false; e.glinted = false; e.fade = 0; e.landed = false;
}
function enemyShot(e, a, pr) {
  projs.push({ x: e.x + Math.cos(a) * 22, y: e.y + Math.sin(a) * 22, vx: Math.cos(a) * pr.speed, vy: Math.sin(a) * pr.speed, r: pr.r, dmg: pr.dmg * e.dm, kind: pr.kind || 'orb', friendly: false, life: pr.life || 3, from: e, puddle: pr.puddle, homing: pr.homing, dt: PROJ_DT[pr.kind] || 'phys' });
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
    if (pointBlocked(nx, ny) || dist(nx, ny, e.hx, e.hy) > (e.T.leash || LEASH) - 40 || areaAt(nx, ny) !== areaAt(e.x, e.y)) continue;
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
          if (hurtPlayer(A.dmg, e.x, e.y, A.dmg * e.dm >= 45, e)) { e.atkHit = true; if (A.poison && P.state !== 'guard') P.poisonB += A.poison * poisonMul(); }
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
function endEnemyAtk(e) { e.state = 'chase'; e.t = 0; e.atk = null; e.fade = 0; e.z = 0; e.cd = rand(e.T.cd[0], e.T.cd[1]) * 0.85 * (e.p2 ? e.T.p2.cdMul : 1) * DIFF.cd * (e.cdMul || 1); }
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
  NOISE = playerNoise(); countTokens(); countChasers();
  for (const e of enemies) {
    e.t += dt;
    if (e.dead) continue;
    const T = e.T, d = dist(e.x, e.y, P.x, P.y);
    if (e.state === 'idle' && d > 1400) continue; // quái ở xa đứng yên để đỡ tốn tính toán
    e.cd -= dt; e.anim += dt; e.lastHit += dt; e.moving = false;
    if (e.invuln > 0) e.invuln -= dt;
    if (e.hurtFlash > 0) e.hurtFlash -= dt;
    if (e.waiting > 0) e.waiting -= dt;
    if (e.alertT > 0) e.alertT -= dt;
    // tầm nhìn không bị tường chắn: tính lại vài lần mỗi giây cho nhẹ
    e.losT = (e.losT || rand(0, 0.2)) - dt;
    if (e.losT <= 0 && d < 900) { e.losT = 0.2; e.los = losClear(e.x, e.y, P.x, P.y); }
    if (e.lastHit > 2.5) e.poiseAcc = Math.max(0, e.poiseAcc - dt * e.poise * 0.5);
    if (e.bleed && e.lastHit > 2) e.bleed = Math.max(0, e.bleed - 12 * dt);
    if (T.ghost && Math.random() < dt * 4) addPart(e.x + rand(-10, 10), e.y + rand(-10, 10), 0, -20, 0.7, 2, 'rgba(200,235,255,.7)', 'mote');
    if (T.drip && Math.random() < dt * 5) addPart(e.x + rand(-10, 10), e.y + rand(-6, 10), 0, 30, 0.5, 1.8, 'rgba(160,200,210,.8)');
    if (T.id === 'salamander' && Math.random() < dt * 3) addPart(e.x + rand(-12, 12), e.y + rand(-8, 8), 0, -30, 0.8, 2, '#ff9a4a', 'mote');
    if (e.vx || e.vy) {
      moveCircle(e, e.vx * dt, e.vy * dt, true);
      const f = Math.exp(-9 * dt); e.vx *= f; e.vy *= f;
      if (Math.abs(e.vx) < 1) e.vx = 0; if (Math.abs(e.vy) < 1) e.vy = 0;
    }
    const ang = Math.atan2(P.y - e.y, P.x - e.x), homeD = dist(e.x, e.y, e.hx, e.hy);
    const wet = !T.swim && !T.flier && !T.floats && inWater(e.x, e.y), spd = T.speed * e.spd * (wet ? 0.6 : 1);
    const go = (a, s) => { moveCircle(e, Math.cos(a) * s * dt, Math.sin(a) * s * dt, true); e.moving = true; };
    const goTo = (a, s) => go(steer(e, a), s);
    // miniboss trong phòng boss chỉ tỉnh dậy khi trận đấu bắt đầu
    const asleep = e.room && G.dfight !== e.room;
    if (e.aff) updateAffix(e, dt, d);
    if (T.p2 && !e.p2 && e.state !== 'phase' && e.hp <= e.maxHp * T.p2.at && e.state !== 'broken') enterPhase2(e);
    switch (e.state) {
      case 'idle': {
        if (alive && !asleep && !(pInArena && !e.arena)) {
          if (e.challenge || (e.wakeAt && G.clock >= e.wakeAt)) { wake(e, false); break; }
          const pr = perceive(e, d, ang);
          if (pr) {
            e.sus = Math.min(1, (e.sus || 0) + pr * dt);
            e.face = turn(e.face, ang, (1.2 + e.sus * 3) * dt); // nghe động thì quay đầu nhìn
            if (e.sus >= 1) { e.sus = 0; wake(e, true); break; }
            break;
          }
          if (e.sus > 0) e.sus = Math.max(0, e.sus - dt * 0.3);
        }
        if (!e.wander || e.t > e.wander.until) e.wander = { x: e.hx + rand(-70, 70), y: e.hy + rand(-70, 70), until: e.t + rand(2, 5) };
        if (!e.room && dist(e.x, e.y, e.wander.x, e.wander.y) > 10) { const a = Math.atan2(e.wander.y - e.y, e.wander.x - e.x); e.face = turn(e.face, a, 4 * dt); go(a, spd * 0.32); }
        break;
      }
      case 'return': {
        if (alive && !asleep && homeD < 300 && !(pInArena && !e.arena) && seesPlayer(e, d, ang) && d < sightR(T) * 0.6) { e.state = 'chase'; e.stuckN = 0; break; }
        const a = Math.atan2(e.hy - e.y, e.hx - e.x); e.face = turn(e.face, a, 6 * dt); goTo(a, spd);
        trackProgress(e, dt, [e.hx, e.hy]);
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.3 * dt);
        if (homeD < 14) { e.state = 'idle'; e.t = 0; }
        break;
      }
      case 'chase': {
        if (!alive || asleep || (homeD > (T.leash || LEASH) && !e.challenge) || (pInArena && !e.arena)) { e.state = 'return'; e.t = 0; break; }
        // mất dấu: không thấy người chơi đủ lâu và đã ở xa thì quay về
        e.lostT = !e.los && d > sightR(T) * 0.5 && !e.challenge ? (e.lostT || 0) + dt : 0;
        if (e.lostT > LOST_T) { e.state = 'return'; e.t = 0; e.lostT = 0; break; }
        e.face = turn(e.face, ang, 7 * dt);
        const pick = e.p2 && T.p2.pick ? T.p2.pick : T.pick;
        if (T.flier) {
          e.orbit = (e.orbit || rand(0, TAU)) + dt * 2.2 * e.strafe;
          const tx = P.x + Math.cos(e.orbit) * 95, ty = P.y + Math.sin(e.orbit) * 95;
          goTo(Math.atan2(ty - e.y, tx - e.x), spd);
          if (e.cd <= 0 && d < 140) tryAttack(e, 0);
        } else if (T.ranged) {
          let mv = 0, side = 0;
          // chưa bắn được (ngoài khung hình hoặc bị tường chắn) thì tiến lại gần tìm góc bắn
          if (d > T.keep + 50 || (!canShoot(e) && d > 90)) mv = 1; else if (d < T.keep - 70) mv = -1; else side = e.strafe;
          if (Math.random() < dt * 0.4) e.strafe *= -1;
          if (mv > 0) { goTo(ang, spd); trackProgress(e, dt, [P.x, P.y]); }
          else if (mv < 0) goTo(ang + Math.PI, spd);
          else if (side) goTo(ang + Math.PI / 2 * side, spd * 0.6);
          if (e.cd <= 0 && d < sightR(T) + 60) { const idx = pick ? pick(e, d) : 0; if (idx >= 0) tryAttack(e, idx); }
        } else {
          // đang chờ lượt thì giữ khoảng cách, lượn quanh người chơi thay vì cùng lao vào
          const reach = (T.atkRange || 50) + P.r, hold = e.waiting > 0, ring = reach * 0.85 + (hold ? 50 : 0);
          if (d > ring) { goTo(ang, spd * (hold && d < ring + 80 ? 0.5 : 1)); trackProgress(e, dt, [P.x, P.y]); }
          else if (hold && d < reach + 25) go(ang + Math.PI + Math.PI / 3 * e.strafe, spd * 0.4);
          else if (e.cd > 0 || hold) { go(ang + Math.PI / 2 * e.strafe, spd * 0.45); if (Math.random() < dt * 0.5) e.strafe *= -1; }
          if (e.cd <= 0) {
            const idx = pick ? pick(e, d) : d < reach ? (e.type === 'knight' && Math.random() < 0.35 ? 2 : 0) : -1;
            if (idx >= 0) tryAttack(e, idx);
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
      // bộ xương gãy rụng nằm chờ rồi tự ráp lại, trừ khi bị hạ bằng lửa hay sức mạnh thánh
      case 'bones':
        if (e.t > 3.2) { e.state = 'chase'; e.t = 0; e.hp = Math.round(e.maxHp * 0.6); e.invuln = 0.3; e.cd = 0.6; burst(e.x, e.y, 18, '#e0d8c2', 120, 3, 'dot', 0.6); SFX.glint(); }
        else if (e.t > 2.4 && Math.random() < dt * 20) addPart(e.x + rand(-14, 14), e.y + rand(-10, 10), 0, -40, 0.4, 2, '#e0d8c2', 'mote');
        break;
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
