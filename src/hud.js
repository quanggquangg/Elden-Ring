'use strict';
// Vòng Vàng Vỡ — HUD và menu HTML
// ───────────────────────── HUD ─────────────────────────
function bar(x, y, w, h, frac, ghost, col) {
  ctx.fillStyle = 'rgba(8,7,5,.78)'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.strokeStyle = 'rgba(214,178,94,.42)'; ctx.lineWidth = 1; ctx.strokeRect(x - 2.5, y - 2.5, w + 5, h + 5);
  if (ghost != null) { ctx.fillStyle = '#d9b85c'; ctx.fillRect(x, y, w * clamp(ghost, 0, 1), h); }
  ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(frac, 0, 1), h);
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(x, y, w * clamp(frac, 0, 1), Math.max(1, h * 0.3));
}
function textC(str, x, y, font, col, shadowA = 0.8) {
  ctx.font = font; ctx.textAlign = 'center';
  ctx.fillStyle = `rgba(0,0,0,${shadowA})`; ctx.fillText(str, x + 1, y + 2);
  ctx.fillStyle = col; ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}
function spacedFont(px, weight = 600) { return `${weight} ${px}px ${FONT_D}`; }
function drawHUD() {
  const x = 20, y = 20, maxW = CW - 40;
  bar(x, y, Math.min(maxW * 0.7, P.maxHp * 1.25), 11, P.hp / P.maxHp, P.ghost / P.maxHp, P.poisonT > 0 ? '#86408f' : '#a3201c');
  const fpW = Math.min(maxW * 0.6, P.maxFp * 1.7);
  bar(x, y + 19, fpW, 6, P.fp / P.maxFp, null, '#3d5fc6');
  if (G.fpWarn > 0 && Math.sin(G.fpWarn * 30) > 0) { ctx.strokeStyle = '#e0503c'; ctx.lineWidth = 2; ctx.strokeRect(x - 3, y + 16, fpW + 6, 12); ctx.lineWidth = 1; }
  const stW = Math.min(maxW * 0.6, P.maxSt * 1.9);
  bar(x, y + 31, stW, 6, P.st / P.maxSt, null, '#4f8f3e');
  if (P.poisonB > 0 || P.poisonT > 0) {
    const pw = stW;
    ctx.fillStyle = 'rgba(8,7,5,.7)'; ctx.fillRect(x, y + 41, pw, 4);
    ctx.fillStyle = '#b07ac4'; ctx.fillRect(x, y + 41, pw * (P.poisonT > 0 ? P.poisonT / 14 : P.poisonB / 100), 4);
    ctx.font = `500 11px ${FONT_U}`; ctx.fillStyle = '#c99ad8'; ctx.fillText(P.poisonT > 0 ? 'Trúng độc' : 'Độc tích tụ', x + pw + 10, y + 40);
  }
  // bình máu
  const fx = x, fy = y + 48, fs = 40;
  ctx.fillStyle = 'rgba(8,7,5,.72)'; ctx.fillRect(fx, fy, fs, fs);
  ctx.strokeStyle = 'rgba(214,178,94,.5)'; ctx.strokeRect(fx + 0.5, fy + 0.5, fs - 1, fs - 1);
  const has = P.flasks > 0;
  ctx.fillStyle = has ? '#b3261e' : '#4a4640';
  ctx.beginPath(); ctx.arc(fx + fs / 2, fy + fs / 2 + 4, 10, 0, TAU); ctx.fill();
  ctx.fillRect(fx + fs / 2 - 3.5, fy + 8, 7, 9);
  ctx.fillStyle = '#c9b48a'; ctx.fillRect(fx + fs / 2 - 4.5, fy + 6, 9, 3);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(fx + fs / 2 - 4, fy + fs / 2 + 1, 3, 0, TAU); ctx.fill();
  ctx.font = `600 13px ${FONT_U}`; ctx.fillStyle = '#ece3cc'; ctx.textAlign = 'right'; ctx.fillText(String(P.flasks), fx + fs - 3, fy + fs - 4); ctx.textAlign = 'left';
  if (!G.touch) { ctx.font = `500 11px ${FONT_U}`; ctx.fillStyle = 'rgba(236,227,204,.55)'; ctx.fillText('R', fx + fs + 7, fy + fs - 4); }
  const wx = fx + fs + (G.touch ? 8 : 20), Wp = WEAPONS[S.equipped];
  ctx.fillStyle = 'rgba(8,7,5,.72)'; ctx.fillRect(wx, fy, fs, fs);
  ctx.strokeStyle = 'rgba(214,178,94,.5)'; ctx.strokeRect(wx + 0.5, fy + 0.5, fs - 1, fs - 1);
  ctx.save(); ctx.translate(wx + fs / 2, fy + fs / 2); ctx.rotate(-Math.PI / 4);
  ctx.strokeStyle = Wp.look.wcol; ctx.lineWidth = S.equipped === 'greatsword' ? 4.5 : 2.5;
  ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(14, 0); ctx.stroke();
  ctx.strokeStyle = '#8a7342'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-7, -5); ctx.lineTo(-7, 5); ctx.stroke();
  ctx.restore();
  ctx.font = `500 12px ${FONT_U}`; ctx.fillStyle = '#ece3cc';
  ctx.fillText(Wp.name + (S.weaponLv ? ' +' + S.weaponLv : ''), wx + fs + 8, fy + 17);
  ctx.font = `500 11px ${FONT_U}`; ctx.fillStyle = P.mounted ? '#b9d8ff' : 'rgba(236,227,204,.55)';
  ctx.fillText(P.mounted ? 'Đang cưỡi ngựa' : G.touch ? 'Bấm Vũ khí để đổi' : 'Phím ← → để đổi', wx + fs + 8, fy + 33);
  // rune
  const rx = CW - 20, ry = G.touch ? 32 : CH - 26;
  ctx.font = `600 18px ${FONT_U}`; ctx.textAlign = 'right';
  const rstr = S.runes.toLocaleString('vi-VN');
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(rstr, rx + 1, ry + 2); ctx.fillStyle = '#ece3cc'; ctx.fillText(rstr, rx, ry);
  const tw = ctx.measureText(rstr).width;
  ctx.fillStyle = '#e2c26c'; ctx.beginPath(); const dx = rx - tw - 14, dy = ry - 6; ctx.moveTo(dx, dy - 7); ctx.lineTo(dx + 5, dy); ctx.lineTo(dx, dy + 7); ctx.lineTo(dx - 5, dy); ctx.closePath(); ctx.fill();
  if (G.runeGain > 0) { ctx.font = `500 14px ${FONT_U}`; ctx.fillStyle = `rgba(242,220,151,${Math.min(1, G.runeGainT)})`; ctx.fillText('+' + G.runeGain.toLocaleString('vi-VN'), rx, ry + (G.touch ? 22 : -24)); }
  ctx.textAlign = 'left';
  // lời nhắc tương tác
  if (G.prompt && G.mode === 'play') {
    const txt = G.prompt.text, py = CH * (G.touch ? 0.56 : 0.7);
    ctx.font = `500 15px ${FONT_U}`;
    const w = ctx.measureText(txt).width + (G.prompt.key ? 40 : 24);
    ctx.fillStyle = 'rgba(10,9,7,.78)'; ctx.fillRect(CW / 2 - w / 2, py - 20, w, 32);
    ctx.strokeStyle = 'rgba(214,178,94,.4)'; ctx.strokeRect(CW / 2 - w / 2 + 0.5, py - 19.5, w - 1, 31);
    let tx = CW / 2 - w / 2 + 12;
    if (G.prompt.key) { ctx.strokeStyle = '#f2dc97'; ctx.strokeRect(tx, py - 12, 18, 17); ctx.fillStyle = '#f2dc97'; ctx.font = `600 11px ${FONT_U}`; ctx.fillText(G.prompt.key, tx + 5, py + 1); tx += 28; }
    ctx.font = `500 15px ${FONT_U}`; ctx.fillStyle = '#ece3cc'; ctx.fillText(txt, tx, py + 2);
  }
  // thanh máu boss
  let subY = CH - 110;
  const hb = G.finalFight && fb && !fb.dead ? fb : G.bossFight && boss && boss.state !== 'dormant' ? boss : G.dragonFight && dragon && !dragon.dead ? dragon
    : enemies.find(e => e.T.bar && !e.dead && e.state !== 'idle' && e.state !== 'return' && dist(P.x, P.y, e.x, e.y) < 650) || null;
  if (hb) {
    const bw = Math.min(CW - 48, 640), bx = (CW - bw) / 2, by = G.touch ? CH - 250 : CH - 60;
    ctx.font = `600 ${CW < 500 ? 17 : 21}px ${FONT_D}`; ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillText(hb.name, bx + 1, by - 11);
    ctx.fillStyle = '#ece3cc'; ctx.fillText(hb.name, bx, by - 12);
    bar(bx, by, bw, 9, hb.hp / hb.maxHp, (hb.ghost ?? hb.hp) / hb.maxHp, '#8e1c16');
    subY = by - 50;
  } else if (G.touch) subY = CH - 280;
  // phụ đề
  if (G.sub) {
    const a = Math.min(1, G.sub.t * 3, (G.sub.dur - G.sub.t) * 2);
    ctx.globalAlpha = a;
    wrapText(G.sub.text, CW / 2, subY, Math.min(CW - 40, 640), 24, `500 italic ${CW < 500 ? 18 : 21}px ${FONT_I}`, '#f1e8d0');
    ctx.globalAlpha = 1;
  }
  if (G.toast) {
    const a = Math.min(1, G.toast.t * 4, (2.4 - G.toast.t) * 2);
    ctx.globalAlpha = a; textC(G.toast.text, CW / 2, CH * (G.touch ? 0.5 : 0.62), `500 14px ${FONT_U}`, '#f2dc97'); ctx.globalAlpha = 1;
  }
  // tên vùng
  if (G.region && G.regionT < 4 && G.mode === 'play') {
    const a = Math.min(1, G.regionT * 1.5, (4 - G.regionT) * 1.2);
    ctx.globalAlpha = a;
    const fs2 = CW < 500 ? 24 : 32;
    textC(G.region, CW / 2, CH * 0.24, spacedFont(fs2), '#ece3cc');
    ctx.font = spacedFont(fs2); const w = ctx.measureText(G.region).width;
    ctx.strokeStyle = 'rgba(214,178,94,.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(CW / 2 - w / 2 - 10, CH * 0.24 + 12); ctx.lineTo(CW / 2 + w / 2 + 10, CH * 0.24 + 12); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (G.banner) drawBanner(G.banner);
  if (G.mode === 'dead') drawDeath();
  if (!G.touch && G.hintT < 22 && G.mode === 'play') {
    ctx.globalAlpha = Math.min(1, (22 - G.hintT) / 2) * 0.75;
    ctx.font = `500 12px ${FONT_U}`; ctx.fillStyle = '#d8ccb0';
    ctx.fillText('Space lăn (giữ: chạy) · Chuột trái đánh · Shift+trái đánh mạnh · Chuột phải đỡ · Shift+phải phép · R bình · E tương tác · Q khóa · G bản đồ', 20, CH - 22);
    ctx.globalAlpha = 1;
  }
}
const maskCanvas = document.createElement('canvas');
maskCanvas.width = EXP_COLS; maskCanvas.height = EXP_ROWS;
function mapMask() {
  const m = maskCanvas.getContext('2d'), img = m.createImageData(EXP_COLS, EXP_ROWS);
  for (let cy = 0; cy < EXP_ROWS; cy++) for (let cx = 0; cx < EXP_COLS; cx++) {
    const i = (cy * EXP_COLS + cx) * 4, x = (cx + 0.5) * EXP_CELL, y = (cy + 0.5) * EXP_CELL;
    const walked = EXP[cy * EXP_COLS + cx], sketch = !walked && fragAt(x, y);
    // đã đi qua: rõ nét; chỉ có bia: phác thảo mờ màu giấy da; chưa biết: tối hẳn
    if (walked) { img.data[i + 3] = 0; continue; }
    if (sketch) { img.data[i] = 96; img.data[i + 1] = 78; img.data[i + 2] = 50; img.data[i + 3] = 118; }
    else { img.data[i] = 24; img.data[i + 1] = 19; img.data[i + 2] = 13; img.data[i + 3] = 255; }
  }
  m.putImageData(img, 0, 0);
  return maskCanvas;
}
const MAP_LABELS = [['Pháo Đài Đá Xám', 3600, 900], ['Rừng Linh Hồn', 3650, 2180], ['Đấu Trường Thử Thách', 3600, 3230], ['Cao Nguyên Tro Đông', 3700, 1580], ['Đồng Cỏ Sương Mờ', 1400, 2620], ['Tàn Tích Phía Tây', 700, 1900], ['Đầm Lầy Tro Độc', 2420, 1520], ['Đấu Trường Varek', 1400, 760], ['Cây Vàng', 1400, 250], ['Nhà Nguyện', 1400, 3480]];
function drawMap() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = 'rgba(8,7,5,.94)'; ctx.fillRect(0, 0, CW, CH);
  const top = 58, bottom = 40, sc = Math.min((CW - 32) / MAPW, (CH - top - bottom) / H), mw = MAPW * sc, mh = H * sc, mx = (CW - mw) / 2, my = top;
  textC('Bản đồ', CW / 2, 36, spacedFont(CW < 500 ? 24 : 30, 700), '#ece3cc');
  ctx.drawImage(GROUND, 0, 0, MAPW / 2, H / 2, mx, my, mw, mh);
  ctx.fillStyle = 'rgba(70,52,24,.3)'; ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = 'rgba(214,178,94,.6)'; ctx.lineWidth = 1; ctx.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
  ctx.fillStyle = '#2a261e';
  for (const w of WALLS) if (!w.void && (wallOn(w, false) || w.gate === 'colo')) ctx.fillRect(mx + w.x * sc, my + w.y * sc, Math.max(1.5, w.w * sc), Math.max(1.5, w.h * sc));
  ctx.imageSmoothingEnabled = true; ctx.drawImage(mapMask(), mx, my, mw, mh);
  const pt = (x, y) => [mx + x * sc, my + y * sc];
  ctx.fillStyle = 'rgba(255,214,110,.8)'; { const [x, y] = pt(TREE_POS.x, TREE_POS.y); ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill(); }
  const fs = CW < 500 ? 12 : 15;
  for (const [n, x, y] of MAP_LABELS) { if (!revealedAt(x, y)) continue; const [px, py] = pt(x, y); textC(n, px, py, `600 ${fs}px ${FONT_D}`, 'rgba(236,227,204,.9)', 0.9); }
  for (const g of GRACES) {
    if (!S.discovered.includes(g.id)) continue;
    const [x, y] = pt(g.x, g.y);
    ctx.fillStyle = '#ffe28a'; ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  }
  for (const c of CHESTS) if (S.chests.includes(c.id)) { const [x, y] = pt(c.x, c.y); ctx.fillStyle = 'rgba(160,120,70,.9)'; ctx.fillRect(x - 3, y - 2, 6, 4); }
  if (S.lost) { const [x, y] = pt(S.lost.x, S.lost.y); ctx.fillStyle = '#9dffb8'; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); }
  const [px, py] = pt(Math.min(P.x, MAPW - 10), P.y), pulse = 1 + Math.sin(G.clock * 6) * 0.15;
  ctx.save(); ctx.translate(px, py); ctx.rotate(P.face); ctx.scale(pulse, pulse);
  ctx.fillStyle = '#e0503c'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -6); ctx.lineTo(-3, 0); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  textC(G.touch ? 'Chạm để đóng · khám phá hoặc đọc Bia Bản Đồ để mở rộng' : 'G / Esc để đóng · đi khám phá hoặc đọc Bia Bản Đồ để mở rộng bản đồ', CW / 2, CH - 14, `500 12px ${FONT_U}`, 'rgba(236,227,204,.7)');
}
function wrapText(str, cx, y, maxW, lh, font, col) {
  ctx.font = font;
  const words = str.split(' '), lines = [];
  let line = '';
  for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line);
  lines.forEach((l, i) => textC(l, cx, y + i * lh - (lines.length - 1) * lh, font, col, 0.9));
}
function drawBanner(b) {
  const a = Math.min(1, b.t * 2, (b.dur - b.t) * 1.2), cy = CH * 0.42;
  ctx.globalAlpha = a;
  const band = ctx.createLinearGradient(0, 0, CW, 0);
  band.addColorStop(0, 'rgba(0,0,0,0)'); band.addColorStop(0.5, 'rgba(0,0,0,.62)'); band.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = band; ctx.fillRect(0, cy - 52, CW, 96);
  const small = CW < 520;
  if (b.kind === 'felled') {
    const sc = 1 + b.t * 0.02;
    ctx.save(); ctx.translate(CW / 2, cy); ctx.scale(sc, sc);
    textC(b.title, 0, 14, spacedFont(small ? 30 : 52, 700), '#f0d27f');
    ctx.restore();
  } else if (b.kind === 'grace') {
    textC(b.title, CW / 2, cy + 4, spacedFont(small ? 26 : 38, 700), '#f0d27f');
    textC(b.sub, CW / 2, cy + 32, `500 14px ${FONT_U}`, '#ece3cc');
  } else {
    textC('Nhận được', CW / 2, cy - 22, `500 12px ${FONT_U}`, '#a89b7d');
    textC(b.title, CW / 2, cy + 8, spacedFont(small ? 26 : 32, 700), '#ece3cc');
    textC(b.sub, CW / 2, cy + 32, `500 14px ${FONT_U}`, '#f2dc97');
  }
  ctx.globalAlpha = 1;
}
function drawDeath() {
  const t = G.deathT;
  if (t < 0.8) return;
  const a = Math.min(1, (t - 0.8) * 1.2) * Math.min(1, (4.6 - t) * 1.5);
  ctx.globalAlpha = a;
  const cy = CH * 0.45;
  const band = ctx.createLinearGradient(0, cy - 70, 0, cy + 70);
  band.addColorStop(0, 'rgba(0,0,0,0)'); band.addColorStop(0.5, 'rgba(0,0,0,.8)'); band.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = band; ctx.fillRect(0, cy - 70, CW, 140);
  const sc = 1 + (t - 0.8) * 0.03;
  ctx.save(); ctx.translate(CW / 2, cy); ctx.scale(sc, sc);
  textC('BẠN ĐÃ CHẾT', 0, 18, spacedFont(CW < 520 ? 44 : 72, 700), '#a3201c', 0.9);
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ───────────────────────── menu HTML ─────────────────────────
const UI = { title: $('title'), pause: $('pause'), grace: $('grace'), ending: $('ending') };
const STAT_INFO = [
  ['vig', 'Sinh Lực', 'Tăng máu tối đa'],
  ['end', 'Bền Bỉ', 'Tăng thể lực cho lăn và đánh'],
  ['str', 'Sức Mạnh', 'Tăng sát thương vũ khí'],
  ['mnd', 'Tâm Trí', 'Tăng FP và sát thương phép'],
];
function setMode(m) {
  G.mode = m;
  $('touch').hidden = !(G.touch && m === 'play');
  keys.clear(); stick.x = 0; stick.y = 0; touchGuard = false; mouseGuard = false; dodgeKey.down = false;
  if (m === 'play' && document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
}
let currentGrace = null;
function openGrace(g) {
  currentGrace = g; setMode('menu');
  $('graceName').textContent = g.name;
  selectTab('level'); renderGrace(); UI.grace.hidden = false;
  setTimeout(() => $('btnLeave').focus({ preventScroll: true }), 30);
}
function closeGrace() { UI.grace.hidden = true; setMode('play'); }
function renderGrace() {
  const cost = levelCost();
  $('lvNum').textContent = S.level;
  $('lvRunes').textContent = S.runes.toLocaleString('vi-VN');
  $('lvCost').textContent = cost.toLocaleString('vi-VN');
  $('lvCost').className = S.runes < cost ? 'short' : '';
  $('statList').innerHTML = STAT_INFO.map(([k, n, d]) =>
    `<li><div class="nm"><span>${n}</span><span>${d}</span></div><span class="val">${S.stats[k]}</span><button class="plus" data-stat="${k}" aria-label="Tăng ${n}" ${S.runes < cost ? 'disabled' : ''}>+</button></li>`).join('');
  const rows = [['Máu', maxHp()], ['Thể lực', maxSt()], ['FP', maxFp()], ['Sát thương', Math.round(weaponDmg())], ['Phép', Math.round(spellDmg())], ['Bình Máu', S.flaskMax]];
  $('derived').innerHTML = rows.map(([k, v]) => `<div><dt class="k">${k}</dt><dd><b>${v}</b></dd></div>`).join('');
  const list = GRACES.filter(g => S.discovered.includes(g.id));
  $('gearList').innerHTML = WEAPON_ORDER.filter(w => S.weapons.includes(w)).map(w => `<li><button data-weapon="${w}"><span>${WEAPONS[w].name}<br><small>${WEAPONS[w].desc}</small></span><small>${w === S.equipped ? 'Đang dùng' : 'Trang bị'}</small></button></li>`).join('');
  $('travelList').innerHTML = list.map(g => `<li><button data-grace="${g.id}"><span>${g.name}</span><small>${g.id === S.lastGrace ? 'Đang ở đây' : 'Dịch chuyển'}</small></button></li>`).join('');
}
$('statList').addEventListener('click', e => {
  const b = e.target.closest('[data-stat]');
  if (!b) return;
  const cost = levelCost();
  if (S.runes < cost) return;
  S.runes -= cost; S.level++; S.stats[b.dataset.stat]++;
  applyStats(true); save(); SFX.pickup(); renderGrace();
  const nb = $('statList').querySelector(`[data-stat="${b.dataset.stat}"]`);
  if (nb && !nb.disabled) nb.focus(); else $('btnLeave').focus();
});
$('travelList').addEventListener('click', e => {
  const b = e.target.closest('[data-grace]');
  if (!b) return;
  const id = +b.dataset.grace;
  S.lastGrace = id; save();
  UI.grace.hidden = true; respawnAt(id); setMode('play'); G.region = null; SFX.grace();
});
$('gearList').addEventListener('click', e => {
  const b = e.target.closest('[data-weapon]');
  if (b && equip(b.dataset.weapon)) renderGrace();
});
function selectTab(which) {
  $('tabLevel').setAttribute('aria-selected', String(which === 'level'));
  $('tabTravel').setAttribute('aria-selected', String(which === 'travel'));
  $('tabGear').setAttribute('aria-selected', String(which === 'gear'));
  $('paneLevel').hidden = which !== 'level'; $('paneTravel').hidden = which !== 'travel'; $('paneGear').hidden = which !== 'gear';
}
$('tabLevel').onclick = () => selectTab('level');
$('tabTravel').onclick = () => selectTab('travel');
$('tabGear').onclick = () => selectTab('gear');
$('btnLeave').onclick = closeGrace;

function toggleMap() {
  if (G.mode === 'play') { setMode('map'); SFX.glint(); }
  else if (G.mode === 'map') setMode('play');
}
function togglePause() {
  if (G.mode === 'map') { toggleMap(); return; }
  if (G.mode === 'play') { setMode('pause'); UI.pause.hidden = false; $('btnResume').focus({ preventScroll: true }); }
  else if (G.mode === 'pause') { UI.pause.hidden = true; setMode('play'); }
  else if (G.mode === 'menu' && !UI.grace.hidden) closeGrace();
  else if (G.mode === 'menu' && !UI.ending.hidden) closeEnding();
}
function toggleMute() { muted = !muted; $('btnSound').textContent = 'Âm thanh: ' + (muted ? 'tắt' : 'bật'); toast(muted ? 'Đã tắt âm thanh' : 'Đã bật âm thanh'); }
$('btnResume').onclick = togglePause;
function updateFxBtn() { $('btnFx').textContent = 'Đồ họa: ' + (FX_LOW ? 'thấp' : 'cao'); }
$('btnFx').onclick = () => {
  FX_LOW = !FX_LOW;
  try { localStorage.setItem('vvv-fx', FX_LOW ? 'low' : 'high'); } catch (e) { /* bỏ qua */ }
  updateFxBtn(); resize();
};
updateFxBtn();
$('btnSound').onclick = () => { audioInit(); toggleMute(); };
$('btnQuit').onclick = () => {
  save(); UI.pause.hidden = true; setMode('title'); UI.title.hidden = false; G.bossFight = false;
  $('btnContinue').hidden = !loadSave(); confirmNew = false; $('btnNew').textContent = 'Hành trình mới'; $('btnNew').classList.remove('warn');
};
function openEnding() {
  setMode('menu');
  $('endLv').textContent = S.level; $('endDeaths').textContent = S.deaths;
  const m = Math.floor(S.time / 60), s = Math.floor(S.time % 60);
  $('endTime').textContent = m + ':' + String(s).padStart(2, '0');
  UI.ending.hidden = false; SFX.felled();
  $('btnEndClose').focus({ preventScroll: true });
}
function closeEnding() { UI.ending.hidden = true; setMode('play'); }
$('btnEndClose').onclick = closeEnding;

let confirmNew = false;
function startGame(data) {
  S = data ? Object.assign(defaultSave(), data) : defaultSave();
  S.flaskMax = Math.min(S.flaskMax, FLASK_CAP);
  expDecode(S.explored);
  // save cũ chưa có dữ liệu khám phá: mở quanh các Ân Điển đã tìm thấy
  if (!S.explored) for (const g of GRACES) if (S.discovered.includes(g.id)) explore(g.x, g.y, 500);
  UI.title.hidden = true; parts.length = 0;
  G.endingShown = S.treeReached && S.finalDead; G.hintT = data ? 99 : 0; G.region = null; G.timers.length = 0;
  respawnAt(S.lastGrace); setMode('play');
  if (!data) later(1.2, () => subtitle('“Hỡi Kẻ Nhạt Phai... Ân Điển sẽ dẫn lối. Hãy đi về phía bắc, tới Cây Vàng.”', 5.5));
  save();
}
$('btnContinue').onclick = () => { audioInit(); startGame(loadSave()); };
$('btnNew').onclick = () => {
  audioInit();
  if (loadSave() && !confirmNew) { confirmNew = true; $('btnNew').textContent = 'Xoá tiến trình cũ và bắt đầu?'; $('btnNew').classList.add('warn'); return; }
  startGame(null);
};
if (loadSave()) $('btnContinue').hidden = false;
window.addEventListener('pagehide', () => { if (G.mode !== 'title') save(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode === 'play') togglePause(); });

spawnEnemies();
boss = makeBoss();
dragon = makeDragon();
requestAnimationFrame(frame);
