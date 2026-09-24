'use strict';
// Vòng Vàng Vỡ — Đạn, vùng sát thương, tương tác thế giới, vòng lặp chính
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
    else if (p.kind === 'firefly') { p.vx = clamp(p.vx + rand(-60, 60) * dt, -25, 25); p.vy = clamp(p.vy + rand(-60, 60) * dt, -25, 25); }
    else if (p.kind === 'leaf') p.vx = Math.sin(p.life * 2 + p.seed) * 22;
    if (p.kind === 'mote') p.vx += Math.sin((p.life + p.x) * 3) * 6 * dt;
  }
}

// ───────────────────────── tương tác thế giới ─────────────────────────
const nearGrace = () => GRACES.find(g => S.discovered.includes(g.id) && dist(P.x, P.y, g.x, g.y) < 70);
const nearItem = () => ITEMS.find(it => !S.taken.includes(it.id) && dist(P.x, P.y, it.x, it.y) < 46);
const nearChest = () => CHESTS.find(c => !S.chests.includes(c.id) && (!c.req || c.req()) && dist(P.x, P.y, c.x, c.y) < 52);
const nearBrazier = () => !S.fortOpen && BRAZIERS.find(b => !G.braziers.includes(b.id) && dist(P.x, P.y, b.x, b.y) < 50);
const nearStatue = () => STATUES.find(st => !S.statues.includes(st.id) && dist(P.x, P.y, st.x, st.y) < 55);
const nearStele = () => MAP_FRAGS.find(f => !S.frags.includes(f.id) && dist(P.x, P.y, f.x, f.y) < 50);
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
  const mf = nearStele();
  if (mf) {
    S.frags.push(mf.id); SFX.grace();
    burst(mf.x, mf.y - 20, 30, '#cfe0ff', 110, 3, 'mote', 1.2);
    banner('item', 'Mảnh Bản Đồ', 'Đã phác thảo bản đồ: ' + mf.name + ' · bấm ' + (G.touch ? 'Bản đồ' : 'G') + ' để xem', 4);
    save(); return;
  }
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
  else if (it.kind === 'runes') { gainRunes(it.amount, it.x, it.y); banner('item', 'Túi Rune', '+' + it.amount + ' rune'); }
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
  else if (nearStele()) G.prompt = { key, text: 'Đọc Bia Bản Đồ' };
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
  weather(dt, x0, y0, vw, vh);
  for (const g of GRACES) if (Math.abs(g.x - cam.x) < vw && Math.abs(g.y - cam.y) < vh && Math.random() < dt * (S.discovered.includes(g.id) ? 8 : 3)) addPart(g.x + rand(-8, 8), g.y + rand(-4, 4), rand(-5, 5), rand(-40, -20), rand(0.8, 1.6), rand(1.2, 2.2), '#ffe7a3', 'mote');
}
function update(dt) {
  G.clock += dt; S.time += dt;
  G.expT = (G.expT || 0) + dt;
  if (G.expT > 0.25 && P.state !== 'dead') { G.expT = 0; explore(P.x, P.y, 380); }
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
  updateAmbient(dt);
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
