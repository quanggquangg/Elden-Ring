'use strict';
// Gravebound — Đạn, vùng sát thương, tương tác thế giới, vòng lặp chính
// ───────────────────────── đạn và vùng sát thương ─────────────────────────
const PTRAIL = { glint: '#bcd6ff', orb: '#8fb0ff', fireball: '#ff8a3a', shard: '#cfefff', comet: '#bfe4ff', bolt: '#fff3a0', hwave: '#ffe39a', hbolt: '#fff0b0', cwave: '#bfe4ff', gwave: '#f3cf6e', parrow: null, arrow: null, knife: null, dagger: '#f3cf6e', spit: '#9fd05a', porb: '#b9a8ff', horb: '#ffe08a' };
function updateProjs(dt) {
  for (let i = projs.length - 1; i >= 0; i--) {
    const q = projs[i];
    q.life -= dt;
    if (q.homing) {
      const a = Math.atan2(q.vy, q.vx), na = turn(a, Math.atan2(P.y - q.y, P.x - q.x), q.homing * dt), sp = Math.hypot(q.vx, q.vy);
      q.vx = Math.cos(na) * sp; q.vy = Math.sin(na) * sp;
    }
    if (q.friendly && P.lock && !P.lock.dead && q.kind !== 'fireball') {
      const a = Math.atan2(q.vy, q.vx), want = Math.atan2(P.lock.y - q.y, P.lock.x - q.x), na = turn(a, want, (q.kind === 'parrow' ? 1.4 : 2.6) * dt), sp = Math.hypot(q.vx, q.vy);
      q.vx = Math.cos(na) * sp; q.vy = Math.sin(na) * sp;
    }
    q.x += q.vx * dt; q.y += q.vy * dt;
    const tc = PTRAIL[q.kind];
    if (tc && Math.random() < 0.8) addPart(q.x, q.y, rand(-10, 10), rand(-10, 10), 0.3, q.kind === 'comet' ? 5 : q.kind === 'dagger' ? 2 : 3, tc);
    if ((q.kind === 'gwave' || q.kind === 'hwave' || q.kind === 'cwave') && Math.random() < 0.6) addPart(q.x, q.y, rand(-20, 20), rand(-20, 20), 0.4, 3, q.kind === 'cwave' ? '#cfefff' : '#ffe39a', 'mote');
    if (q.kind === 'fireball') {
      if (q.friendly) {
        if (q.life <= 0 || targets().some(e => (e.z || 0) < 40 && dist(q.x, q.y, e.x, e.y) < q.r + e.r)) {
          friendlyBlast(q.x, q.y, q.boom, q.parts, q.poise); noise(0.3, 0.3, 300, 0.7); shake(4);
          burst(q.x, q.y, 24, '#ff9a4a', 200, 4, 'dot', 0.6); projs.splice(i, 1);
        }
      } else if (q.life <= 0 || dist(q.x, q.y, P.x, P.y) < q.r + P.r) {
        aoeBlast(q.x, q.y, q.boom, q.dmg, 'fire'); noise(0.3, 0.3, 300, 0.7); shake(5);
        burst(q.x, q.y, 24, '#ff9a4a', 200, 4, 'dot', 0.6); projs.splice(i, 1);
      }
      continue;
    }
    let dead = q.life <= 0 || pointBlocked(q.x, q.y);
    if (!dead && q.friendly) {
      for (const e of targets()) {
        if ((e.z || 0) > 30 || (q.hits && q.hits.has(e))) continue;
        if (dist(q.x, q.y, e.x, e.y) < q.r + e.r) {
          hitEnemy(e, q.parts, q.poise || 18, q.x - q.vx * 0.05, q.y - q.vy * 0.05, q.akind || 'spell');
          if (q.pierce) q.hits.add(e); else { dead = true; break; }
        }
      }
    } else if (!dead && dist(q.x, q.y, P.x, P.y) < q.r + P.r) {
      if (hurtPlayer(q.dmg, q.x - q.vx * 0.05, q.y - q.vy * 0.05, q.kind === 'comet', null, 'proj', q.dt || 'phys')) dead = true;
    }
    if (dead) {
      if (q.puddle) puddles.push({ x: q.x, y: q.y, r: 42, t: 0, life: 6 });
      burst(q.x, q.y, q.kind === 'comet' ? 20 : 8, q.kind === 'dagger' ? '#f3cf6e' : q.kind === 'spit' ? '#9fd05a' : q.kind === 'parrow' || q.kind === 'knife' ? '#d8d0bc' : tc || '#bcd6ff', 90, 2.5, 'dot', 0.35); projs.splice(i, 1);
    }
  }
}
function updateAoes(dt) {
  for (let i = aoes.length - 1; i >= 0; i--) {
    const a = aoes[i];
    a.t += dt;
    if (a.kind === 'ring') {
      const cur = lerp(a.r0, a.r1, a.t / a.dur);
      if (a.dmg > 0 && !a.hit && Math.abs(dist(a.x, a.y, P.x, P.y) - cur) < 16 + P.r && hurtPlayer(a.dmg, a.x, a.y, false, null, 'aoe')) a.hit = true;
      if (a.t >= a.dur) aoes.splice(i, 1);
    } else if (a.kind === 'pring') {
      const cur = lerp(a.r0, a.r1, a.t / a.dur);
      for (const e of targets()) if (!a.hits.has(e) && Math.abs(dist(a.x, a.y, e.x, e.y) - cur) < 16 + e.r) { a.hits.add(e); hitEnemy(e, a.parts, 20, a.x, a.y, 'spell'); }
      if (a.t >= a.dur) aoes.splice(i, 1);
    } else if (a.kind === 'delayed') {
      if (a.t >= a.delay) {
        if (a.friendly) friendlyBlast(a.x, a.y, a.r, a.parts, a.poise); else aoeBlast(a.x, a.y, a.r, a.dmg);
        noise(0.25, 0.2, 400, 0.8); shake(4);
        const col = a.col === 'magic' ? '#bfe4ff' : '#ffe39a';
        for (let k = 0; k < 10; k++) addPart(a.x + rand(-a.r * 0.6, a.r * 0.6), a.y + rand(-a.r * 0.6, a.r * 0.6), 0, rand(-120, -60), 0.5, rand(2, 4), col, 'mote');
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
  const n = nearNpc();
  if (n) { openShop(n.id); return; }
  const lv = nearLever();
  if (lv) { pullLever(lv); return; }
  const dr = nearDoor();
  if (dr) { if (dr.kind === 'exit' && G.dfight) { toast('Không thể rời đi giữa trận'); return; } useDoor(dr); return; }
  const c = nearChest();
  if (c) { openChest(c); return; }
  const l = nearLoot();
  if (l) { pickLoot(l); return; }
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
  const nt = nearNote();
  if (nt) { subtitle('“' + nt.text + '”', 5.5); SFX.glint(); const i = NOTES.indexOf(nt); if (!S.readN.includes(i)) { S.readN.push(i); save(); } }
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
    banner('grace', 'CÁNH CỔNG ĐÃ MỞ', 'Pháo Đài Greystone');
    burst(3600, 1286, 50, 'rgba(120,110,95,.7)', 200, 6, 'dot', 1);
  }
}
function wakeStatue(st) {
  S.statues.push(st.id); SFX.grace();
  burst(st.x, st.y - 10, 30, '#9fe8e0', 120, 3, 'mote', 1.2);
  toast('Tượng đá đã thức tỉnh (' + S.statues.length + '/4)');
  if (S.statues.length === STATUES.length) {
    S.glade = true;
    banner('grace', 'KẾT GIỚI ĐÃ TAN', 'Rừng Wraithwood');
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
  banner('grace', 'ĐỢT ' + n + ' / ' + WAVES.length, 'Đấu Trường Bloodsand', 2.4);
}
function startColo() {
  G.colo.active = true; G.colo.wave = 1; G.colo.cool = 0;
  if (P.mounted) P.mounted = false;
  SFX.roar(); shake(6); spawnWave(1);
}
function updateColo(dt) {
  if (!G.colo.active || enemies.some(e => e.challenge && !e.dead && !e.room)) return;
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
  noise(0.5, 0.2, 400, 0.8);
  burst(c.x, c.y - 6, 24, '#ffe7a3', 110, 3, 'mote', 1.1);
  grant(c.loot, c.x, c.y);
}
function takeItem(it) {
  S.taken.push(it.id);
  burst(it.x, it.y, 20, '#fff1c2', 90, 3, 'dot', 0.7);
  grant(it.loot, it.x, it.y);
}
function restAtGrace(g) {
  S.lastGrace = g.id; P.mounted = false; P.lock = null; P.state = 'idle'; P.atk = null;
  applyStats(true); spawnEnemies(); save(); SFX.grace();
  burst(g.x, g.y, 30, '#f3d27a', 80, 3, 'mote', 1.4);
  openGrace(g);
}
// lần đầu nhìn thấy mỗi loại vật tương tác, nhắc người chơi mới cách dùng nó (mỗi loại chỉ nhắc một lần)
const TIP_TEXT = {
  stele: k => 'Một Bia Bản Đồ đang tỏa sáng xanh gần đây. Lại gần và ' + k + ' để đọc; bản đồ vùng này sẽ hiện ra.',
  chest: k => 'Có một chiếc rương gần đây. Lại gần và ' + k + ' để mở.',
  item: k => 'Đốm sáng trên mặt đất là vật phẩm. Lại gần và ' + k + ' để nhặt.',
  note: k => 'Vòng lửa cam trên đất là lời nhắn của kẻ đi trước. Lại gần và ' + k + ' để đọc.',
};
function firstSightTips() {
  if (G.mode !== 'play' || G.hintT < 16 || G.tipCd > G.clock) return;
  const k = G.touch ? 'chạm nút Tương tác' : 'nhấn E';
  const seen = (kind, x, y, r) => {
    if (S.tips[kind] || dist(P.x, P.y, x, y) > r) return false;
    S.tips[kind] = 1; G.tipCd = G.clock + 8; toast(TIP_TEXT[kind](k), 6); return true;
  };
  for (const f of MAP_FRAGS) if (!S.frags.includes(f.id) && seen('stele', f.x, f.y, 440)) return;
  for (const c of CHESTS) if (!S.chests.includes(c.id) && (!c.req || c.req()) && seen('chest', c.x, c.y, 260)) return;
  for (const it of ITEMS) if (!S.taken.includes(it.id) && seen('item', it.x, it.y, 240)) return;
  for (let i = 0; i < NOTES.length; i++) if (!S.readN.includes(i) && seen('note', NOTES[i].x, NOTES[i].y, 220)) return;
}
function worldChecks(dt) {
  if (P.state === 'dead') return;
  for (const g of GRACES) {
    if (!S.discovered.includes(g.id) && dist(P.x, P.y, g.x, g.y) < 140) {
      S.discovered.push(g.id); banner('grace', 'ĐÃ TÌM THẤY ÂN ĐIỂN', g.name); SFX.grace(); save();
    }
  }
  firstSightTips();
  const key = G.touch ? '' : 'E', gp = gatePrompt();
  let nd;
  if (nearGrace()) G.prompt = { key, text: 'Nghỉ ngơi tại Ân Điển' };
  else if ((nd = nearNpc())) G.prompt = { key, text: 'Nói chuyện với ' + nd.name };
  else if ((nd = nearLever())) G.prompt = { key, text: 'Kéo cần gạt' };
  else if ((nd = nearDoor())) G.prompt = { key, text: (nd.kind === 'enter' ? 'Vào ' : 'Rời khỏi ') + nd.dg.name };
  else if (nearChest()) G.prompt = { key, text: 'Mở rương' };
  else if (nearLoot()) G.prompt = { key, text: 'Nhặt vật phẩm' };
  else if (nearBrazier()) G.prompt = { key, text: 'Thắp lửa' };
  else if (nearStatue()) G.prompt = { key, text: 'Đánh thức tượng đá' };
  else if (nearFlag()) G.prompt = { key, text: 'Bắt đầu thử thách' };
  else if (nearStele()) G.prompt = { key, text: 'Đọc Bia Bản Đồ' };
  else if (nearItem()) G.prompt = { key, text: 'Nhặt vật phẩm' };
  else if (gp) G.prompt = { key: '', text: gp };
  else if (nearNote()) G.prompt = { key, text: 'Đọc lời nhắn' };
  else G.prompt = null;
  if (S.lost && dist(P.x, P.y, S.lost.x, S.lost.y) < 40) {
    gainRunes(S.lost.amount, S.lost.x, S.lost.y); SFX.pickup(); toast('Đã thu hồi ' + S.lost.amount.toLocaleString('vi-VN') + ' rune');
    S.lost = null; save();
  }
  if (boss && !boss.dead && !G.bossFight && inRect(P.x, P.y, boss.A) && P.y > boss.A.y + 20 && P.y < boss.A.y + boss.A.h - 16) startBossFight();
  checkBossRooms();
  if (S.boss2Dead && !S.finalDead && !G.finalFight && dist(P.x, P.y, TREE_POS.x, TREE_POS.y) < 120) enterRealm();
  if (S.finalDead && dist(P.x, P.y, TREE_POS.x, TREE_POS.y) < 160 && !G.endingShown) { G.endingShown = true; S.treeReached = true; save(); later(0.6, openEnding); }
  const reg = regionAt(P.x, P.y);
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
  const hw = CW / ZOOM / 2, hh = CH / ZOOM / 2, A = G.mode !== 'title' && P.x > 4800 ? areaAt(P.x, P.y) : null;
  const x0 = A ? A.x : WX0, x1 = A ? A.x + A.w : MAPW, y0 = A ? A.y : WY0, y1 = A ? A.y + A.h : H;
  cam.x = x1 - x0 > hw * 2 ? clamp(cam.x, x0 + hw, x1 - hw) : (x0 + x1) / 2;
  cam.y = y1 - y0 > hh * 2 ? clamp(cam.y, y0 + hh, y1 - hh) : (y0 + y1) / 2;
}
function ambient(dt) {
  const vw = CW / ZOOM, vh = CH / ZOOM, x0 = cam.x - vw / 2, y0 = cam.y - vh / 2;
  const motes = cam.y < 380 && cam.x < 4800 ? 22 : 7;
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
  updatePlayer(dt); updateEnemies(dt); updateBoss(dt); updateDragon(dt); updateFinal(dt); updateProjs(dt); updateAoes(dt); updatePuddles(dt); updateColo(dt); updateTraps(dt); updateInvasions(); updateLoot(dt); updateParts(dt);
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
  if (G.toast) { G.toast.t += dt; if (G.toast.t > G.toast.dur) G.toast = null; }
  G.regionT += dt; G.hintT += dt; checkAch(dt);
  if (G.runeGainT > 0) { G.runeGainT -= dt; if (G.runeGainT <= 0) G.runeGain = 0; }
}
let last = performance.now();
// một lỗi bất ngờ trong một khung hình không được làm đứng cả game: ghi lại lỗi rồi chạy tiếp khung sau
function frame(now) {
  try { step(now); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
function step(now) {
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
}
