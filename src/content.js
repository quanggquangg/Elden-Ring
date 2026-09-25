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
// ───────────────────────── Khó và Chuyên gia: quái tinh anh mang thuộc tính ─────────────────────────
const AFFIXES = {
  burning: { name: 'Hỏa Ngục', col: '255,140,60' }, // chết thì nổ tung
  swift: { name: 'Cuồng Phong', col: '190,255,210' }, // chạy nhanh, ra đòn dồn dập
  stone: { name: 'Thạch Giáp', col: '205,195,170' }, // máu trâu, khó làm lảo đảo
  blood: { name: 'Huyết Khế', col: '255,70,90' }, // đánh trúng thì hút máu
  phantom: { name: 'Hư Ảnh', col: '150,210,255' }, // dịch chuyển ra sau lưng người chơi
};
const AFF_KEYS = Object.keys(AFFIXES);
const hasAff = (e, k) => !!(e && e.aff && e.aff.includes(k));
function applyAffixes(e) {
  if (!DIFF.elite || e.T.miniboss || e.summoned || e.invader || Math.random() >= DIFF.elite) return;
  const pool = AFF_KEYS.slice(), n = DIFF.aff >= 2 && Math.random() < 0.3 ? 2 : 1;
  e.aff = [];
  for (let i = 0; i < n; i++) e.aff.push(pool.splice((Math.random() * pool.length) | 0, 1)[0]);
  let hp = e.maxHp * 1.25;
  if (e.aff.includes('stone')) { hp *= 1.6; e.poise *= 2; e.spd *= 0.85; }
  if (e.aff.includes('swift')) { e.spd *= 1.35; e.cdMul = 0.65; }
  e.hp = e.maxHp = Math.round(hp);
  e.runeMul = (e.runeMul || 1) * 2.5; e.blinkCd = rand(2, 4);
}
function updateAffix(e, dt, d) {
  if (Math.random() < dt * 7) { const c = AFFIXES[e.aff[(Math.random() * e.aff.length) | 0]].col; addPart(e.x + rand(-e.r, e.r), e.y + rand(-e.r, e.r), 0, -34, 0.6, 2.4, `rgba(${c},.9)`, 'mote'); }
  if (hasAff(e, 'phantom') && e.state === 'chase' && (e.blinkCd -= dt) <= 0 && d < 320 && d > 70) { e.blinkCd = rand(3.5, 5.5); blinkBehind(e); e.cd = Math.min(e.cd, 0.35); }
}
function affixDeath(e) {
  if (hasAff(e, 'burning')) { addDelayed(e.x, e.y, 80, 0.9, 42); SFX.fire(0.4); }
  if (Math.random() < 0.4) loot.push({ x: e.x + rand(-8, 8), y: e.y + rand(-8, 8), loot: { items: Math.random() < 0.3 ? { stone2: 1 } : { stone1: 2 } }, t: 0 });
}
function affixOnHit(e) {
  if (!hasAff(e, 'blood') || e.dead) return;
  const h = Math.round(e.maxHp * 0.12); e.hp = Math.min(e.maxHp, e.hp + h);
  floatText(e.x, e.y - e.r - 14, '+' + h, '#ff6a7a'); burst(e.x, e.y, 10, '#ff4a5a', 60, 2, 'dot', 0.5);
}
// ───────────────────────── Khó và Chuyên gia: Gravebound Đỏ xâm nhập ─────────────────────────
// Những Gravebound đã quên Cây, chỉ còn săn đồng loại. Mỗi kẻ xâm nhập một lần ở một vùng; hạ được thì nhận bùa riêng.
const INVADER_T = {
  hp: 360, r: 15, speed: 150, aggro: 2000, runes: 1800, poise: 70, elite: true, bar: true, atkRange: 60, cd: [0.3, 0.8], track: 5.5, leash: 99999,
  attacks: [
    { wind: 0.32, act: 0.12, rec: 0.16, range: 72, arc: 1.9, dmg: 18, lunge: 190, swing: 1, next: 1 },
    { wind: 0.22, act: 0.12, rec: 0.3, range: 72, arc: 1.9, dmg: 16, lunge: 170, swing: -1, next: 2 },
    { wind: 0.55, act: 0.15, rec: 0.7, range: 84, arc: 2.2, dmg: 30, lunge: 280, swing: 1 },
    { kind: 'shot', wind: 0.35, rec: 0.35, n: 3, spread: 0.2, proj: { speed: 540, dmg: 12, r: 5, kind: 'dagger' } },
    { kind: 'blink', wind: 0.28, next: 2 },
    { kind: 'healall', wind: 0.95, rec: 0.35, r: 30, amt: 0.3 },
  ],
  pick: (e, d) => {
    const r = Math.random();
    if (e.hp < e.maxHp * 0.4 && (e.heals || 0) < 2 && d > 150) { e.heals = (e.heals || 0) + 1; return 5; }
    if (d < 95) return r < 0.65 ? 0 : r < 0.85 ? 2 : 4;
    if (d < 420) return r < 0.35 ? 3 : r < 0.6 ? 4 : -1;
    return -1;
  },
};
const INVADERS = [
  { id: 'morrow', name: 'Morrow, Kẻ Săn Ấn', x: 1500, y: 1800, reward: { tal: 'redseal' },
    look: { body: '#2a1414', trim: '#ff5a44', head: '#1a0c0c', cloak: '#5a0e0e', weapon: 'sword', wlen: 34, wcol: '#ff8a70', scale: 1.05, glow: '#ff5a44' },
    line: '“Một Gravebound còn nhớ tên mình... Hiếm đấy. Để ta lấy nó.”', die: '“Cái tên ấy... cứ giữ lấy... ta đã quên của ta từ lâu...”' },
  { id: 'isolde', name: 'Isolde Mắt Đỏ', x: -700, y: 1500, reward: { tal: 'ashen' },
    look: { body: '#2e1620', trim: '#ff4a6a', head: '#1e0c14', cloak: '#6a1028', weapon: 'katana', wlen: 38, wcol: '#ffb0c0', scale: 1, glow: '#ff4a6a', hood: true },
    line: '“Nước hồ này đã nuốt trăm kẻ như ngươi. Thêm một kẻ nữa thì có sao?”', die: '“Hồ ơi... cuối cùng... cũng đến lượt ta...”' },
  { id: 'brannoc', name: 'Brannoc Bội Ước', x: 1900, y: -150, reward: { tal: 'crown' },
    look: { body: '#301a10', trim: '#ffb040', head: '#20120a', cloak: '#6a200a', weapon: 'greatsword', wlen: 42, wcol: '#ffd090', scale: 1.25, glow: '#ff7a30' },
    line: '“Ta từng quỳ trước chính cái Cây ấy, rồi nó quay lưng với ta. Ngươi sẽ không bao giờ tới được đó.”', die: '“Nếu ngươi tới được Cây... hãy hỏi nó... vì sao...”' },
];
for (const v of INVADERS) ETYPES['inv_' + v.id] = Object.assign({}, INVADER_T, { name: v.name, look: v.look });
function updateInvasions() {
  if (G.invader) {
    if (G.invader.dead) G.invader = null;
    else if (!enemies.includes(G.invader)) { G.invader = null; G.invCd = G.clock + 30; }
    return;
  }
  if (!DIFF.inv || G.mode !== 'play' || P.state === 'dead' || P.x > 4800 || G.bossFight || G.dfight || G.dragonFight || G.finalFight || G.colo.active || (G.invCd || 0) > G.clock) return;
  for (let i = 0; i < Math.min(DIFF.inv, INVADERS.length); i++) {
    const v = INVADERS[i];
    if (!S.inv[v.id] && dist(P.x, P.y, v.x, v.y) < 380) { spawnInvader(v); return; }
  }
}
function spawnInvader(v) {
  let x = P.x, y = P.y - 300;
  for (let k = 0; k < 20; k++) {
    const a = rand(0, TAU), nx = P.x + Math.cos(a) * 330, ny = P.y + Math.sin(a) * 330;
    if (!pointBlocked(nx, ny) && !inWater(nx, ny) && !inArena(nx, ny)) { x = nx; y = ny; break; }
  }
  const e = makeEnemy('inv_' + v.id, x, y);
  if (DIFF.id === 'expert') e.dm = 1.1;
  e.invader = v; e.challenge = true; e.state = 'chase'; e.cd = 1.2;
  enemies.push(e); G.invader = e;
  banner('invade', 'BỊ XÂM NHẬP', v.name + ' đã xâm nhập thế giới của ngươi', 4);
  SFX.roar(); shake(6); burst(x, y, 40, '#ff5a44', 160, 3, 'dot', 0.9);
  later(1.4, () => subtitle(v.line, 4.5));
}
function invaderDefeated(e) {
  const v = e.invader; S.inv[v.id] = true; G.invader = null;
  banner('felled', 'ĐÃ ĐÁNH BẠI KẺ XÂM NHẬP', '', 4); SFX.felled();
  burst(e.x, e.y, 50, '#ff5a44', 220, 4, 'dot', 1.2); subtitle(v.die, 4);
  later(4.2, () => grant(v.reward, e.x, e.y)); save();
}
// ───────────────────────── Khó và Chuyên gia: Varek gọi những lời thề cũ ─────────────────────────
function varekShades(b) {
  if (!DIFF.inv) return;
  const n = DIFF.id === 'expert' ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const a = Math.PI / 2 + TAU * i / n, g = makeEnemy('ghost', clamp(b.x + Math.cos(a) * 140, b.A.x + 40, b.A.x + b.A.w - 40), clamp(b.y + Math.sin(a) * 140, b.A.y + 40, b.A.y + b.A.h - 40));
    g.summoned = true; g.arena = true; g.challenge = true; g.state = 'chase'; g.hx = g.x; g.hy = g.y; g.name = 'Lời Thề Cũ';
    enemies.push(g); burst(g.x, g.y, 24, '#cfefff', 130, 3, 'dot', 0.7);
  }
  later(0.4, () => subtitle('“Hỡi những kẻ từng thề trung thành với Aurumhold... đứng dậy!”', 3.6));
}
function clearShades() { enemies.forEach(x => { if (x.arena && !x.dead) killEnemy(x); }); }
// ───────────────────────── Khó và Chuyên gia: lời nhắn từ chu kỳ trước ─────────────────────────
const NOTE_BASE = NOTES.length;
const CYCLE_NOTES = [
  { x: 1400, y: 3050, text: u => 'Nét chữ này... là của chính ngươi. “Lần trước ta đã chết ' + (u.deaths ?? 'không biết bao nhiêu') + ' lần mới chạm được tới Cây. Lần này, hãy cẩn thận với những kẻ mang ánh đỏ.”' },
  { x: 1450, y: 2060, text: () => 'Có những Gravebound không tìm Cây mà tìm đồng loại. Chúng mặc áo đỏ, uống bình máu như ngươi, và không bao giờ đánh một nhịp.' },
  { x: 1560, y: 2620, text: () => 'Quái mang hào quang lạ khỏe hơn nhiều, nhưng rơi nhiều rune và đá cường hóa hơn. Kẻ phát sáng đỏ rực sẽ nổ tung khi chết.' },
  { x: 1300, y: 1380, text: () => 'Varek không còn chiến đấu một mình. Khi hắn gầm lên, những lời thề cũ sẽ đứng dậy bên cạnh hắn.' },
];
function setupCycleNotes() {
  NOTES.length = NOTE_BASE;
  if (!DIFF.inv) return;
  const u = readUnlock();
  for (const n of CYCLE_NOTES) NOTES.push({ x: n.x, y: n.y, text: n.text(u), cycle: true });
}
