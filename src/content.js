'use strict';
// Gravebound — Nội dung thế giới: phòng boss, hầm ngục, bẫy, cần gạt, cổng lớn, NPC và vật phẩm rơi
// ───────────────────────── phòng boss (Học Viện và hầm ngục) ─────────────────────────
ACAD_BOSS.boss = 'selvara';
const BOSS_ROOMS = [ACAD_BOSS, ...DUNGEONS];
const BOSS_LINES = {
  selvara: '“Một học trò mới... hay chỉ là kẻ trộm sách? Dù là gì, hãy quỳ trước vầng trăng.”',
  graveknight: '“Hầm mộ này... không có chỗ cho kẻ còn thở.”',
  minerg: 'Tiếng pha lê rạn vỡ vang khắp hầm mỏ...',
  golem: 'Khối đá cổ chuyển động, mắt nó rực lên như than hồng.',
  royalchamp: '“Nhà vô địch của Kinh Thành không bao giờ lùi bước.”',
};
function checkBossRooms() {
  if (G.dfight || P.state === 'dead') return;
  for (const R of BOSS_ROOMS) {
    if (S.mb[R.boss] || !inRect(P.x, P.y, R.bossRoom, -24)) continue;
    const b = enemies.find(e => e.type === R.boss && !e.dead);
    if (!b) continue;
    G.dfight = R.id; b.challenge = true; b.state = 'chase'; b.t = 0; b.cd = 1;
    if (P.mounted) P.mounted = false;
    SFX.roar(); shake(8); subtitle(BOSS_LINES[R.boss] || '', 4.5);
    return;
  }
}
function bossRoomCleared(e) {
  if (!e.room || G.dfight !== e.room) return;
  G.dfight = null;
  const d = DUNGEONS.find(q => q.id === e.room);
  if (d && !S.dg[d.id]) { S.dg[d.id] = true; later(4.4, () => grant(d.reward, e.x, e.y)); }
}
// ───────────────────────── bẫy lửa trong Hang Emberdeep ─────────────────────────
function updateTraps(dt) {
  const d = dungeonAt(P.x, P.y);
  if (!d || d.theme !== 'fire') return;
  for (const t of TRAPS) {
    const ph = (G.clock + t.off) % t.period, prev = t.ph === undefined ? ph : t.ph;
    t.ph = ph;
    if (ph > t.period - 0.9 && Math.random() < dt * 20) addPart(t.x + rand(-t.r, t.r) * 0.6, t.y + rand(-t.r, t.r) * 0.6, 0, -40, 0.4, rand(2, 4), '#ff9a4a', 'fire');
    if (ph < prev) {
      aoeBlast(t.x, t.y, t.r, 38, 'fire');
      for (let i = 0; i < 16; i++) { const a = rand(0, TAU), s = rand(40, 160); addPart(t.x, t.y, Math.cos(a) * s, Math.sin(a) * s - 80, rand(0.4, 0.7), rand(6, 11), FIRE_COLS[(Math.random() * 4) | 0], 'fire'); }
      if (dist(P.x, P.y, t.x, t.y) < 500) noise(0.35, 0.18, 400, 0.8);
    }
  }
}
// ───────────────────────── cần gạt, cửa hầm ngục, NPC, vật phẩm rơi ─────────────────────────
const nearLever = () => LEVERS.find(l => !S.levers.includes(l.id) && dist(P.x, P.y, l.x, l.y) < 52);
const nearDoor = () => DOORS.find(d => dist(P.x, P.y, d.x, d.y) < 56);
const nearNpc = () => NPCS.find(n => dist(P.x, P.y, n.x, n.y) < 62);
const nearLoot = () => loot.find(l => dist(P.x, P.y, l.x, l.y) < 42);
function pullLever(l) {
  S.levers.push(l.id); SFX.boom(); shake(6);
  burst(l.x, l.y - 10, 18, 'rgba(160,150,130,.8)', 90, 3, 'dot', 0.7);
  banner('grace', 'CÁNH CỬA ĐÃ MỞ', l.name, 3); save();
}
function useDoor(door) {
  const d = door.dg;
  if (door.kind === 'enter') {
    P.x = d.area.x + 500; P.y = 1480;
    if (!S.discovered.includes(d.grace)) { S.discovered.push(d.grace); later(0.8, () => banner('grace', 'ĐÃ TÌM THẤY ÂN ĐIỂN', GRACES.find(g => g.id === d.grace).name)); }
  } else { P.x = d.ex; P.y = d.ey + 70; }
  P.vx = P.vy = 0; P.mounted = false; P.lock = null; projs.length = 0; aoes.length = 0;
  cam.x = P.x; cam.y = P.y; clampCam(); G.fade = 1; G.region = null; SFX.roll(); save();
}
function pickLoot(l) {
  loot.splice(loot.indexOf(l), 1);
  burst(l.x, l.y, 16, '#fff1c2', 80, 3, 'dot', 0.6);
  const got = grant(l.loot, l.x, l.y, !l.rare);
  if (!l.rare) { toast('Nhặt được: ' + got.join(', ')); SFX.pickup(); }
}
// cổng lớn Kinh Thành cần đủ ba Đại Ấn; cổng Học Viện cần chìa khóa pha lê
const GREAT_GATE = { x: 1400, y: -914 }, ACAD_GATE = { x: -1550, y: 400 };
function gatePrompt() {
  if (!S.greatOpen && dist(P.x, P.y, GREAT_GATE.x, GREAT_GATE.y) < 190) {
    if (S.gr.length >= 3) {
      S.greatOpen = true; save(); SFX.felled(); shake(10);
      banner('grace', 'BA ĐẠI ẤN CỘNG HƯỞNG', 'Cổng Kinh Thành Aurumhold đã mở', 4.5);
      burst(GREAT_GATE.x, GREAT_GATE.y, 60, '#ffe39a', 220, 4, 'mote', 1.4);
      return null;
    }
    return 'Cổng Kinh Thành · cần 3 Đại Ấn (' + S.gr.length + '/3)';
  }
  if (!S.acadOpen && dist(P.x, P.y, ACAD_GATE.x, ACAD_GATE.y) < 150) {
    if (invN('crystalkey')) {
      S.acadOpen = true; save(); SFX.parry(); shake(6);
      banner('grace', 'CỔNG HỌC VIỆN ĐÃ MỞ', 'Chìa Khóa Pha Lê tan thành ánh sáng', 4);
      burst(ACAD_GATE.x, ACAD_GATE.y, 50, '#bfe4ff', 180, 3, 'mote', 1.2);
      return null;
    }
    return 'Cổng Học Viện · cần Chìa Khóa Pha Lê';
  }
  return null;
}
function updateLoot(dt) { for (const l of loot) l.t += dt; }
