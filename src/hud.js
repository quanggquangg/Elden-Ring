'use strict';
// Vòng Vàng Vỡ — HUD, bản đồ và menu HTML
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
function box(x, y, s) {
  ctx.fillStyle = 'rgba(8,7,5,.72)'; ctx.fillRect(x, y, s, s);
  ctx.strokeStyle = 'rgba(214,178,94,.5)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
}
function drawFlaskIcon(cx, cy, col, empty) {
  ctx.fillStyle = empty ? '#4a4640' : col;
  ctx.beginPath(); ctx.arc(cx, cy + 4, 10, 0, TAU); ctx.fill();
  ctx.fillRect(cx - 3.5, cy - 12, 7, 9);
  ctx.fillStyle = '#c9b48a'; ctx.fillRect(cx - 4.5, cy - 14, 9, 3);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(cx - 4, cy + 1, 3, 0, TAU); ctx.fill();
}
function drawQuickIcon(q, cx, cy) {
  if (q === 'flask') return drawFlaskIcon(cx, cy, '#b3261e', P.flasks <= 0);
  if (q === 'fpflask') return drawFlaskIcon(cx, cy, '#2e5ac8', P.fpflasks <= 0);
  const col = ITEMDEF[q].col || '#ddd';
  ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8;
  if (q === 'knife') { ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.8); ctx.fillRect(-2, -12, 4, 20); ctx.restore(); }
  else if (q === 'firepot') { ctx.beginPath(); ctx.arc(cx, cy + 2, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a3a20'; ctx.fillRect(cx - 3, cy - 11, 6, 6); }
  else if (q.startsWith('grune')) { ctx.beginPath(); ctx.moveTo(cx, cy - 11); ctx.lineTo(cx + 8, cy); ctx.lineTo(cx, cy + 11); ctx.lineTo(cx - 8, cy); ctx.closePath(); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(cx, cy, 8, 0, TAU); ctx.fill(); }
  ctx.shadowBlur = 0;
}
function drawHUD() {
  const x = 20, y = 20, maxW = CW - 40;
  bar(x, y, Math.min(maxW * 0.7, P.maxHp * 1.1), 11, P.hp / P.maxHp, P.ghost / P.maxHp, P.poisonT > 0 ? '#86408f' : '#a3201c');
  const fpW = Math.min(maxW * 0.6, P.maxFp * 1.5);
  bar(x, y + 19, fpW, 6, P.fp / P.maxFp, null, '#3d5fc6');
  if (G.fpWarn > 0 && Math.sin(G.fpWarn * 30) > 0) { ctx.strokeStyle = '#e0503c'; ctx.lineWidth = 2; ctx.strokeRect(x - 3, y + 16, fpW + 6, 12); ctx.lineWidth = 1; }
  const stW = Math.min(maxW * 0.6, P.maxSt * 1.8);
  bar(x, y + 31, stW, 6, P.st / P.maxSt, null, '#4f8f3e');
  if (P.poisonB > 0 || P.poisonT > 0) {
    ctx.fillStyle = 'rgba(8,7,5,.7)'; ctx.fillRect(x, y + 41, stW, 4);
    ctx.fillStyle = '#b07ac4'; ctx.fillRect(x, y + 41, stW * (P.poisonT > 0 ? P.poisonT / 14 : P.poisonB / 100), 4);
    ctx.font = `500 11px ${FONT_U}`; ctx.fillStyle = '#c99ad8'; ctx.fillText(P.poisonT > 0 ? 'Trúng độc' : 'Độc tích tụ', x + stW + 10, y + 40);
  }
  // ô đồ dùng nhanh
  const fx = x, fy = y + 50, fs = 40, q = curQuick();
  box(fx, fy, fs); drawQuickIcon(q, fx + fs / 2, fy + fs / 2);
  const qn = q === 'flask' ? P.flasks : q === 'fpflask' ? P.fpflasks : S.inv[q] || 0;
  ctx.font = `600 13px ${FONT_U}`; ctx.fillStyle = '#ece3cc'; ctx.textAlign = 'right'; ctx.fillText(String(qn), fx + fs - 3, fy + fs - 4); ctx.textAlign = 'left';
  if (!G.touch) { ctx.font = `500 10px ${FONT_U}`; ctx.fillStyle = 'rgba(236,227,204,.55)'; ctx.fillText('R · ↓', fx + 2, fy + fs + 12); }
  // vũ khí tay phải và tay trái
  const wx = fx + fs + 10, Wp = WEAPONS[S.equipped], off = offDef(), cat = catalyst();
  box(wx, fy, fs);
  ctx.save(); ctx.translate(wx + fs / 2, fy + fs / 2); ctx.rotate(-Math.PI / 4);
  if (Wp.type === 'bow') { ctx.strokeStyle = Wp.look.wcol; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 12, -1.3, 1.3); ctx.stroke(); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(Math.cos(1.3) * 12, -Math.sin(1.3) * 12); ctx.lineTo(Math.cos(1.3) * 12, Math.sin(1.3) * 12); ctx.stroke(); }
  else { ctx.strokeStyle = Wp.look.wcol; ctx.lineWidth = Wp.twoHanded ? 4.5 : 2.5; ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(14, 0); ctx.stroke(); ctx.strokeStyle = '#8a7342'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-7, -5); ctx.lineTo(-7, 5); ctx.stroke(); }
  ctx.restore();
  const ox = wx + fs + 6, os = 26;
  box(ox, fy + fs - os, os);
  if (Wp.twoHanded) { ctx.strokeStyle = 'rgba(236,227,204,.35)'; ctx.beginPath(); ctx.moveTo(ox + 6, fy + fs - 6); ctx.lineTo(ox + os - 6, fy + fs - os + 6); ctx.stroke(); }
  else if (off.type === 'shield') { ctx.fillStyle = off.id === 'kite' ? '#8a909a' : '#8a6a44'; ctx.beginPath(); ctx.arc(ox + os / 2, fy + fs - os / 2, 8, 0, TAU); ctx.fill(); }
  else { ctx.fillStyle = off.type === 'staff' ? '#9fd0ff' : '#ffd76a'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(ox + os / 2, fy + fs - os / 2, 5, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; }
  const tx = ox + os + 8;
  ctx.font = `500 12px ${FONT_U}`; ctx.fillStyle = reqMet(Wp.req) ? '#ece3cc' : '#f0a58f';
  ctx.fillText(Wp.name + (upLv(S.equipped) ? ' +' + upLv(S.equipped) : ''), tx, fy + 13);
  ctx.font = `500 11px ${FONT_U}`;
  let line2, line2c = 'rgba(236,227,204,.6)';
  if (P.mounted) { line2 = 'Đang cưỡi ngựa'; line2c = '#b9d8ff'; }
  else if (cat) { const sp = curSpell(); line2 = sp ? 'Phép: ' + SPELLS[sp].name + ' · ' + SPELLS[sp].fp + ' FP' + (G.touch ? '' : ' · ↑') : 'Chưa ghi nhớ phép'; line2c = cat.type === 'staff' ? '#b9d0ff' : '#f2dc97'; }
  else { const a = ASHES[ashOf(S.equipped)]; line2 = 'Kỹ năng: ' + a.name + ' · ' + a.fp + ' FP'; }
  ctx.fillStyle = line2c; ctx.fillText(line2, tx, fy + 28);
  let l3 = '';
  if (Wp.type === 'bow') l3 = 'Tên ' + S.arrows + '/' + S.arrowMax;
  const bf = [];
  if (P.buffs.flame > 0) bf.push('Lửa ' + Math.ceil(P.buffs.flame) + 's');
  if (P.buffs.holy > 0) bf.push('Thánh ' + Math.ceil(P.buffs.holy) + 's');
  if (P.buffs.bless > 0) bf.push('Phúc lành ' + Math.ceil(P.buffs.bless) + 's');
  if (bf.length) l3 += (l3 ? ' · ' : '') + bf.join(' · ');
  if (rollType() === 'over') l3 += (l3 ? ' · ' : '') + 'QUÁ TẢI';
  if (l3) { ctx.fillStyle = rollType() === 'over' ? '#f0a58f' : '#e6c98a'; ctx.fillText(l3, tx, fy + 43); }
  // rune và Đại Ấn
  const rx = CW - 20, ry = G.touch ? 32 : CH - 26;
  ctx.font = `600 18px ${FONT_U}`; ctx.textAlign = 'right';
  const rstr = S.runes.toLocaleString('vi-VN');
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(rstr, rx + 1, ry + 2); ctx.fillStyle = '#ece3cc'; ctx.fillText(rstr, rx, ry);
  const tw = ctx.measureText(rstr).width;
  ctx.fillStyle = '#e2c26c'; ctx.beginPath(); const dx = rx - tw - 14, dy = ry - 6; ctx.moveTo(dx, dy - 7); ctx.lineTo(dx + 5, dy); ctx.lineTo(dx, dy + 7); ctx.lineTo(dx - 5, dy); ctx.closePath(); ctx.fill();
  if (G.runeGain > 0) { ctx.font = `500 14px ${FONT_U}`; ctx.fillStyle = `rgba(242,220,151,${Math.min(1, G.runeGainT)})`; ctx.fillText('+' + G.runeGain.toLocaleString('vi-VN'), rx, ry + (G.touch ? 22 : -24)); }
  ctx.textAlign = 'left';
  ['east', 'swamp', 'west'].forEach((id, i) => {
    const gx = dx - 34 - (2 - i) * 18, gy = dy, on = S.gr.includes(id);
    ctx.fillStyle = on ? GREAT_RUNES[id].col : 'rgba(40,34,24,.8)'; ctx.strokeStyle = 'rgba(214,178,94,.6)';
    if (on) { ctx.shadowColor = GREAT_RUNES[id].col; ctx.shadowBlur = 8; }
    ctx.beginPath(); ctx.arc(gx, gy, 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
  });
  // lời nhắc tương tác
  if (G.prompt && G.mode === 'play') {
    const txt = G.prompt.text, py = CH * (G.touch ? 0.56 : 0.7);
    ctx.font = `500 15px ${FONT_U}`;
    const w = ctx.measureText(txt).width + (G.prompt.key ? 40 : 24);
    ctx.fillStyle = 'rgba(10,9,7,.78)'; ctx.fillRect(CW / 2 - w / 2, py - 20, w, 32);
    ctx.strokeStyle = 'rgba(214,178,94,.4)'; ctx.strokeRect(CW / 2 - w / 2 + 0.5, py - 19.5, w - 1, 31);
    let px = CW / 2 - w / 2 + 12;
    if (G.prompt.key) { ctx.strokeStyle = '#f2dc97'; ctx.strokeRect(px, py - 12, 18, 17); ctx.fillStyle = '#f2dc97'; ctx.font = `600 11px ${FONT_U}`; ctx.fillText(G.prompt.key, px + 5, py + 1); px += 28; }
    ctx.font = `500 15px ${FONT_U}`; ctx.fillStyle = '#ece3cc'; ctx.fillText(txt, px, py + 2);
  }
  // thanh máu boss
  let subY = CH - 110;
  const hb = G.finalFight && fb && !fb.dead ? fb : G.bossFight && boss && boss.state !== 'dormant' ? boss : G.dragonFight && dragon && !dragon.dead ? dragon
    : enemies.find(e => e.T.bar && !e.dead && e.state !== 'idle' && e.state !== 'return' && dist(P.x, P.y, e.x, e.y) < 700) || null;
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
    const ry2 = CH * (G.touch ? 0.32 : 0.24);
    textC(G.region, CW / 2, ry2, spacedFont(fs2), '#ece3cc');
    ctx.font = spacedFont(fs2); const w = ctx.measureText(G.region).width;
    ctx.strokeStyle = 'rgba(214,178,94,.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(CW / 2 - w / 2 - 10, ry2 + 12); ctx.lineTo(CW / 2 + w / 2 + 10, ry2 + 12); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (G.banner) drawBanner(G.banner);
  if (G.mode === 'dead') drawDeath();
  if (!G.touch && G.hintT < 24 && G.mode === 'play') {
    ctx.globalAlpha = Math.min(1, (24 - G.hintT) / 2) * 0.75;
    ctx.font = `500 12px ${FONT_U}`; ctx.fillStyle = '#d8ccb0';
    ctx.fillText('Space lăn · Chuột trái đánh · Shift+trái đánh mạnh · Chuột phải đỡ / niệm phép · Shift+phải kỹ năng · R dùng đồ (↓ đổi) · ↑ đổi phép · E tương tác · G bản đồ', 20, CH - 22);
    ctx.globalAlpha = 1;
  }
}
// ───────────────────────── bản đồ ─────────────────────────
const maskCanvas = document.createElement('canvas');
maskCanvas.width = EXP_COLS; maskCanvas.height = EXP_ROWS;
function mapMask() {
  const m = maskCanvas.getContext('2d'), img = m.createImageData(EXP_COLS, EXP_ROWS);
  for (let cy = 0; cy < EXP_ROWS; cy++) for (let cx = 0; cx < EXP_COLS; cx++) {
    const i = (cy * EXP_COLS + cx) * 4, x = WX0 + (cx + 0.5) * EXP_CELL, y = WY0 + (cy + 0.5) * EXP_CELL;
    const walked = EXP[cy * EXP_COLS + cx], sketch = !walked && fragAt(x, y);
    // đã đi qua: rõ nét; chỉ có bia: phác thảo mờ màu giấy da; chưa biết: tối hẳn
    if (walked) { img.data[i + 3] = 0; continue; }
    if (sketch) { img.data[i] = 96; img.data[i + 1] = 78; img.data[i + 2] = 50; img.data[i + 3] = 118; }
    else { img.data[i] = 24; img.data[i + 1] = 19; img.data[i + 2] = 13; img.data[i + 3] = 255; }
  }
  m.putImageData(img, 0, 0);
  return maskCanvas;
}
const MAP_LABELS = [['Pháo Đài Đá Xám', 3600, 900], ['Rừng Linh Hồn', 3650, 2180], ['Đấu Trường Thử Thách', 3600, 3230], ['Cao Nguyên Tro Đông', 3700, 1580], ['Đồng Cỏ Sương Mờ', 1400, 2620],
  ['Tàn Tích Phía Tây', 700, 1900], ['Đầm Lầy Tro Độc', 2420, 1520], ['Đấu Trường Varek', 1400, 760], ['Nhà Nguyện', 1400, 3480], ['Hồ Pha Lê', -1400, 1500], ['Bờ Biển Muối', -1300, 3300],
  ['Học Viện Pha Lê', -1550, -300], ['Cao Nguyên Hoàng Kim', 2200, -100], ['Sườn Núi Hoàng Kim', 3500, -1400], ['Kinh Thành Vàng', 1400, -1300], ['Cây Vàng', 1400, -1720]];
function drawMap() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = 'rgba(8,7,5,.94)'; ctx.fillRect(0, 0, CW, CH);
  const MW = MAPW - WX0, MH = H - WY0, top = 58, bottom = 40, sc = Math.min((CW - 32) / MW, (CH - top - bottom) / MH), mw = MW * sc, mh = MH * sc, mx = (CW - mw) / 2, my = top;
  textC('Bản đồ', CW / 2, 36, spacedFont(CW < 500 ? 24 : 30, 700), '#ece3cc');
  ctx.drawImage(GROUND, 0, 0, MW / 2, MH / 2, mx, my, mw, mh);
  ctx.fillStyle = 'rgba(70,52,24,.3)'; ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = 'rgba(214,178,94,.6)'; ctx.lineWidth = 1; ctx.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
  const pt = (x, y) => [mx + (x - WX0) * sc, my + (y - WY0) * sc];
  ctx.fillStyle = '#2a261e';
  for (const w of WALLS) if (!w.void && !w.sea && w.x < MAPW && (wallOn(w, false) || w.gate === 'colo' || w.gate === 'dg')) { const [x, y] = pt(w.x, w.y); ctx.fillRect(x, y, Math.max(1.5, w.w * sc), Math.max(1.5, w.h * sc)); }
  ctx.imageSmoothingEnabled = true; ctx.drawImage(mapMask(), mx, my, mw, mh);
  ctx.fillStyle = 'rgba(255,214,110,.8)'; { const [x, y] = pt(TREE_POS.x, TREE_POS.y); ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill(); }
  const fs = CW < 500 ? 11 : 14;
  for (const [n, x, y] of MAP_LABELS) { if (!revealedAt(x, y)) continue; const [px, py] = pt(x, y); textC(n, px, py, `600 ${fs}px ${FONT_D}`, 'rgba(236,227,204,.9)', 0.9); }
  for (const d of DUNGEONS) {
    if (!revealedAt(d.ex, d.ey)) continue;
    const [x, y] = pt(d.ex, d.ey);
    ctx.fillStyle = S.dg[d.id] ? 'rgba(160,150,130,.9)' : '#d8c8a0'; ctx.fillRect(x - 4, y - 4, 8, 8); ctx.fillStyle = '#1a1612'; ctx.fillRect(x - 2, y - 1, 4, 5);
  }
  for (const g of GRACES) {
    if (!S.discovered.includes(g.id) || g.x > MAPW) continue;
    const [x, y] = pt(g.x, g.y);
    ctx.fillStyle = '#ffe28a'; ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  }
  for (const c of CHESTS) if (S.chests.includes(c.id) && c.x < MAPW) { const [x, y] = pt(c.x, c.y); ctx.fillStyle = 'rgba(160,120,70,.9)'; ctx.fillRect(x - 2.5, y - 2, 5, 4); }
  if (S.lost && S.lost.x < MAPW) { const [x, y] = pt(S.lost.x, S.lost.y); ctx.fillStyle = '#9dffb8'; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); }
  const dg = dungeonAt(P.x, P.y), inMain = P.x < 4800, mpx = inMain ? P.x : dg ? dg.ex : null, mpy = inMain ? P.y : dg ? dg.ey : null;
  if (mpx !== null) {
    const [px, py] = pt(mpx, mpy), pulse = 1 + Math.sin(G.clock * 6) * 0.15;
    ctx.save(); ctx.translate(px, py); ctx.rotate(P.face); ctx.scale(pulse, pulse);
    ctx.fillStyle = '#e0503c'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -6); ctx.lineTo(-3, 0); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  } else textC('Ngươi đang ở ngoài thế giới thường', CW / 2, my + 24, `500 13px ${FONT_U}`, '#f2dc97');
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
    textC(b.title, CW / 2, cy + 4, spacedFont(small ? 24 : 38, 700), '#f0d27f');
    textC(b.sub, CW / 2, cy + 32, `500 14px ${FONT_U}`, '#ece3cc');
  } else {
    textC('Nhận được', CW / 2, cy - 22, `500 12px ${FONT_U}`, '#a89b7d');
    textC(b.title, CW / 2, cy + 8, spacedFont(small ? 24 : 32, 700), '#ece3cc');
    wrapText(b.sub, CW / 2, cy + 32, Math.min(CW - 40, 760), 18, `500 14px ${FONT_U}`, '#f2dc97');
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
const UI = { title: $('title'), pause: $('pause'), grace: $('grace'), ending: $('ending'), shop: $('shop'), cls: $('cls'), board: $('board'), name: $('name') };
const STAT_INFO = [
  ['vig', 'Tăng máu tối đa'], ['mnd', 'Tăng FP'], ['end', 'Tăng thể lực và sức mang vác'],
  ['str', 'Vũ khí nặng, sát thương theo Sức Mạnh'], ['dex', 'Vũ khí nhanh, cung, theo Khéo Léo'],
  ['int', 'Phép Trí Tuệ (dùng gậy)'], ['fai', 'Phép Đức Tin (dùng ấn)'],
];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function setMode(m) {
  G.mode = m;
  $('touch').hidden = !(G.touch && m === 'play');
  keys.clear(); stick.x = 0; stick.y = 0; touchGuard = false; mouseGuard = false; dodgeKey.down = false;
  if (m === 'play' && document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
}
let currentGrace = null, graceTab = 'level';
function openGrace(g) {
  currentGrace = g; setMode('menu');
  $('graceName').textContent = g.name;
  selectTab('level'); renderGrace(); UI.grace.hidden = false;
  setTimeout(() => $('btnLeave').focus({ preventScroll: true }), 30);
}
function closeGrace() { UI.grace.hidden = true; setMode('play'); }
const scText = Wp => Object.entries(Wp.sc || {}).map(([k, v]) => STAT_SHORT[k] + ' ' + v).join(' ');
function weaponLine(id) {
  const Wp = WEAPONS[id], lv = upLv(id);
  if (Wp.type === 'shield') return `Chặn ${Math.round((1 - 0.15 * Wp.guard.chip) * 100)}% · nặng ${Wp.wt}` + (Wp.req ? ' · cần ' + reqText(Wp.req) : '');
  if (Wp.sp) return `Sức mạnh phép ${Math.round(spellPower(id))} · ${scText(Wp)} · cần ${reqText(Wp.req)} · nặng ${Wp.wt}`;
  return `Công ${Math.round(weaponAR(id, lv))} · ${DT_NAME[Wp.dt]} · ${scText(Wp)} · cần ${reqText(Wp.req)} · nặng ${Wp.wt}${Wp.twoHanded ? ' · hai tay' : ''}`;
}
function renderGrace() {
  const cost = levelCost();
  $('lvNum').textContent = S.level;
  $('lvRunes').textContent = S.runes.toLocaleString('vi-VN');
  $('lvCost').textContent = cost.toLocaleString('vi-VN');
  $('lvCost').className = S.runes < cost ? 'short' : '';
  $('statList').innerHTML = STAT_INFO.map(([k, d]) =>
    `<li><div class="nm"><span>${STAT_NAME[k]}</span><span>${d}</span></div><span class="val">${S.stats[k]}</span><button class="plus" data-stat="${k}" aria-label="Tăng ${STAT_NAME[k]}" ${S.runes < cost ? 'disabled' : ''}>+</button></li>`).join('');
  const cat = catalyst(), load = equipLoad(), ml = maxLoad();
  const rows = [['Máu', maxHp()], ['Thể lực', maxSt()], ['FP', maxFp()], ['Tải trọng', load.toFixed(1) + ' / ' + ml.toFixed(1)], ['Kiểu lăn', ROLLS[rollType()].name],
    ['Công tay phải', Math.round(weaponAR(S.equipped))], ['Hấp thụ', Math.round((1 - absorb('phys')) * 100) + '%'], [cat ? 'Sức mạnh phép' : 'Độ trụ', cat ? Math.round(spellPower(S.off)) : armorDef().poise]];
  $('derived').innerHTML = rows.map(([k, v]) => `<div><dt class="k">${k}</dt><dd><b>${v}</b></dd></div>`).join('');
  // trang bị
  const ownR = ownedRight(), ownO = OFF_ORDER.filter(w => S.weapons.includes(w)), Wp = WEAPONS[S.equipped];
  let h = '<h3 class="sec">Tay phải</h3><ul class="travel">' + ownR.map(w => `<li><button data-weapon="${w}" class="${w === S.equipped ? 'on' : ''}"><span>${esc(WEAPONS[w].name)}${upLv(w) ? ' +' + upLv(w) : ''}<br><small>${weaponLine(w)}</small></span><small>${w === S.equipped ? 'Đang cầm' : 'Cầm'}</small></button></li>`).join('') + '</ul>';
  h += '<h3 class="sec">Tay trái' + (Wp.twoHanded ? ' · bị khóa vì tay phải cầm vũ khí hai tay' : '') + '</h3><ul class="travel">' + ownO.map(w => `<li><button data-off="${w}" class="${w === S.off ? 'on' : ''}"><span>${esc(WEAPONS[w].name)}${upLv(w) ? ' +' + upLv(w) : ''}<br><small>${WEAPONS[w].desc} · ${weaponLine(w)}</small></span><small>${w === S.off ? 'Đang cầm' : 'Cầm'}</small></button></li>`).join('') + '</ul>';
  if (Wp.type === 'melee') {
    const cur = ashOf(S.equipped), list = Wp.unique ? [Wp.ash] : [...new Set([Wp.ash, ...S.ashes.filter(a => !ASHES[a].unique && !ASHES[a].bow)])];
    h += `<h3 class="sec">Kỹ năng của ${esc(Wp.name)}${Wp.unique ? ' · kỹ năng riêng, không đổi được' : ''}</h3><ul class="travel">` + list.map(a => `<li><button data-ash="${a}" class="${a === cur ? 'on' : ''}" ${Wp.unique ? 'disabled' : ''}><span>${ASHES[a].name}<br><small>${ASHES[a].desc} · ${ASHES[a].fp} FP</small></span><small>${a === cur ? 'Đang gắn' : 'Gắn'}</small></button></li>`).join('') + '</ul>';
  }
  h += '<h3 class="sec">Giáp</h3><ul class="travel">' + ARMOR_ORDER.filter(a => S.armors.includes(a)).map(a => { const A = ARMORS[a]; return `<li><button data-armor="${a}" class="${a === S.armor ? 'on' : ''}"><span>${A.name}<br><small>${A.desc} · giảm ${Math.round(A.abs * 100)}% · trụ ${A.poise} · nặng ${A.wt}</small></span><small>${a === S.armor ? 'Đang mặc' : 'Mặc'}</small></button></li>`; }).join('') + '</ul>';
  h += `<h3 class="sec">Bùa hộ mệnh · ${S.tal.length}/${S.talSlots} ô</h3>` + (S.tals.length ? '<ul class="travel">' + TAL_ORDER.filter(t => S.tals.includes(t)).map(t => `<li><button data-tal="${t}" class="${S.tal.includes(t) ? 'on' : ''}"><span>${TALISMANS[t].name}<br><small>${TALISMANS[t].desc}</small></span><small>${S.tal.includes(t) ? 'Đang đeo' : 'Đeo'}</small></button></li>`).join('') + '</ul>' : '<p class="note">Chưa có bùa nào. Tìm trong rương và hầm ngục.</p>');
  const inv = Object.entries(S.inv).filter(([, n]) => n > 0).map(([k, n]) => `${ITEMDEF[k].name} ×${n}`);
  h += '<h3 class="sec">Túi đồ</h3><p class="note">' + (inv.length ? inv.join(' · ') : 'Trống') + ` · Nước Mắt Thánh ${S.tears}/${TEAR_CAP}</p>`;
  $('gearWrap').innerHTML = h;
  // phép
  const own = SPELL_ORDER.filter(s => S.spells.includes(s));
  $('spellWrap').innerHTML = `<p class="note">Ghi nhớ ${S.att.length}/${S.slots} ô. Phép Trí Tuệ cần gậy, phép Đức Tin cần ấn ở tay trái. Giữ chuột phải (hoặc X) để niệm, ↑ để đổi phép.</p>` +
    (own.length ? '<ul class="travel">' + own.map(s => { const sp = SPELLS[s]; return `<li><button data-spell="${s}" class="${S.att.includes(s) ? 'on' : ''}"><span>${sp.name} <small class="tag">${sp.school === 'sorc' ? 'Trí Tuệ' : 'Đức Tin'}</small><br><small>${sp.desc} · ${sp.fp} FP · cần ${reqText(sp.req)}</small></span><small>${S.att.includes(s) ? 'Đã nhớ' : 'Ghi nhớ'}</small></button></li>`; }).join('') + '</ul>' : '<p class="note">Chưa học phép nào. Học Giả Ly và Nữ Tu Liên ở Điện Hội Ngộ có bán phép.</p>');
  // bình
  const hpF = S.flaskMax - S.flaskFp;
  $('flaskWrap').innerHTML = `<p class="note">Tổng ${S.flaskMax} bình (Hạt Vàng tăng số bình, Nước Mắt Thánh tăng lượng hồi). Chia số bình giữa máu và FP.</p>
    <ul class="stats"><li><div class="nm"><span>Bình Máu</span><span>Hồi ${flaskHeal()} máu mỗi lần</span></div><span class="val">${hpF}</span><button class="plus" data-flask="1" ${S.flaskFp <= 0 ? 'disabled' : ''} aria-label="Thêm Bình Máu">+</button></li>
    <li><div class="nm"><span>Bình FP</span><span>Hồi ${fpFlaskAmt()} FP mỗi lần</span></div><span class="val">${S.flaskFp}</span><button class="plus" data-flask="-1" ${hpF <= 0 ? 'disabled' : ''} aria-label="Thêm Bình FP">+</button></li></ul>`;
  const list = GRACES.filter(g => S.discovered.includes(g.id));
  $('travelList').innerHTML = list.map(g => `<li><button data-grace="${g.id}"><span>${g.name}</span><small>${g.id === S.lastGrace ? 'Đang ở đây' : 'Dịch chuyển'}</small></button></li>`).join('');
}
$('statList').addEventListener('click', e => {
  const b = e.target.closest('[data-stat]');
  if (!b || !levelUp(b.dataset.stat)) return;
  renderGrace();
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
$('gearWrap').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (d.weapon) equip(d.weapon); else if (d.off) equipOff(d.off); else if (d.ash) setAsh(d.ash); else if (d.armor) setArmor(d.armor); else if (d.tal) toggleTal(d.tal);
  applyStats(true); renderGrace();
});
$('spellWrap').addEventListener('click', e => { const b = e.target.closest('[data-spell]'); if (b) { toggleAttune(b.dataset.spell); renderGrace(); } });
$('flaskWrap').addEventListener('click', e => { const b = e.target.closest('[data-flask]'); if (b) { flaskAlloc(-(+b.dataset.flask)); renderGrace(); } });
const TABS = ['level', 'gear', 'spell', 'flask', 'travel'];
function selectTab(which) {
  graceTab = which;
  for (const t of TABS) {
    const id = t[0].toUpperCase() + t.slice(1);
    $('tab' + id).setAttribute('aria-selected', String(which === t));
    $('pane' + id).hidden = which !== t;
  }
}
for (const t of TABS) $('tab' + t[0].toUpperCase() + t.slice(1)).onclick = () => selectTab(t);
$('btnLeave').onclick = closeGrace;

// ───────────────────────── cửa hàng và lò rèn ─────────────────────────
let currentShop = null;
function openShop(id) {
  currentShop = id; setMode('menu'); P.lock = null;
  renderShop(); UI.shop.hidden = false; SFX.glint();
  setTimeout(() => $('btnShopLeave').focus({ preventScroll: true }), 30);
}
function closeShop() { UI.shop.hidden = true; currentShop = null; setMode('play'); }
function renderShop() {
  const id = currentShop;
  $('shopRunes').textContent = S.runes.toLocaleString('vi-VN');
  if (id === 'smith') {
    $('shopName').textContent = 'Thợ Rèn Hùng';
    $('shopLine').textContent = '“Đưa đá rèn đây. Lưỡi nào cùn, ta mài; lưỡi nào yếu, ta rèn lại.”';
    const mats = ['stone1', 'stone2', 'stone3', 'somber1', 'somber2'].map(k => ITEMDEF[k].name + ' ' + invN(k)).join(' · ');
    const list = [...ownedRight(), ...OFF_ORDER.filter(w => S.weapons.includes(w))].filter(upgradable);
    $('shopList').innerHTML = `<p class="note">${mats}</p>` + list.map(w => {
      const Wp = WEAPONS[w], need = upgradeNeed(w), lv = upLv(w);
      if (!need) return `<li><button disabled><span>${esc(Wp.name)} +${lv}<br><small>Đã cường hóa tối đa</small></span><small>Tối đa</small></button></li>`;
      const ok = invN(need.mat) >= need.n && S.runes >= need.runes;
      const now = Wp.sp ? Math.round(spellPower(w, lv)) : Math.round(weaponAR(w, lv)), nxt = Wp.sp ? Math.round(spellPower(w, need.lv)) : Math.round(weaponAR(w, need.lv));
      return `<li><button data-up="${w}" ${ok ? '' : 'disabled'}><span>${esc(Wp.name)} +${lv} → +${need.lv}<br><small>${Wp.sp ? 'Phép' : 'Công'} ${now} → ${nxt} · cần ${ITEMDEF[need.mat].name} ×${need.n} (có ${invN(need.mat)}) và ${need.runes.toLocaleString('vi-VN')} rune</small></span><small>Rèn</small></button></li>`;
    }).join('');
    return;
  }
  const sh = SHOPS[id];
  $('shopName').textContent = sh.name; $('shopLine').textContent = sh.line;
  $('shopList').innerHTML = sh.stock.map((r, i) => {
    const info = shopRow(r), can = !info.sold && !info.locked && S.runes >= r.price;
    const tail = info.sold ? 'Đã có' : info.locked ? (r.lock || 'Chưa mở') : r.price.toLocaleString('vi-VN') + ' rune';
    return `<li><button data-buy="${i}" ${can ? '' : 'disabled'}><span>${esc(info.name)}<br><small>${esc(info.desc)}</small></span><small>${tail}</small></button></li>`;
  }).join('');
}
$('shopList').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.up) { if (doUpgrade(b.dataset.up)) { toast('Cường hóa thành công: ' + WEAPONS[b.dataset.up].name + ' +' + upLv(b.dataset.up)); shake(4); } }
  else if (b.dataset.buy !== undefined) buyRow(currentShop, +b.dataset.buy);
  renderShop();
});
$('btnShopLeave').onclick = closeShop;

function toggleMap() {
  if (G.mode === 'play') { setMode('map'); SFX.glint(); }
  else if (G.mode === 'map') setMode('play');
}
function togglePause() {
  if (G.mode === 'map') { toggleMap(); return; }
  if (G.mode === 'play') { setMode('pause'); UI.pause.hidden = false; $('btnResume').focus({ preventScroll: true }); }
  else if (G.mode === 'pause') { UI.pause.hidden = true; setMode('play'); }
  else if (G.mode === 'menu' && !UI.shop.hidden) closeShop();
  else if (G.mode === 'menu' && !UI.grace.hidden) closeGrace();
  else if (G.mode === 'menu' && !UI.ending.hidden) closeEnding();
  else if (!UI.board.hidden) closeBoard();
  else if (G.mode === 'title' && !UI.name.hidden) { UI.name.hidden = true; UI.title.hidden = false; }
  else if (G.mode === 'title' && !UI.cls.hidden) { UI.cls.hidden = true; UI.name.hidden = false; }
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
  $('endLv').textContent = S.level; $('endDeaths').textContent = S.deaths; $('endName').textContent = cleanName(S.name) || 'Kẻ Nhạt Phai';
  const showRank = () => { const r = myRank(); $('endRank').textContent = r ? 'Hạng #' + r + ' trên bảng xếp hạng' + (boardShared() ? ' chung' : ' của máy này') : 'Kết quả đã được ghi vào bảng xếp hạng'; };
  showRank(); later(1.5, showRank);
  const m = Math.floor(S.time / 60), s = Math.floor(S.time % 60);
  $('endTime').textContent = Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  UI.ending.hidden = false; SFX.felled();
  $('btnEndClose').focus({ preventScroll: true });
}
function closeEnding() { UI.ending.hidden = true; setMode('play'); }
$('btnEndClose').onclick = closeEnding;

// ───────────────────────── bắt đầu trò chơi ─────────────────────────
let confirmNew = false;
function startGame(data, cls) {
  S = data ? Object.assign(defaultSave(), data) : defaultSave();
  if (!data) { applyClass(cls); S.name = pendingName || 'Kẻ Nhạt Phai'; }
  S.flaskMax = Math.min(S.flaskMax, FLASK_CAP);
  expDecode(S.explored);
  UI.title.hidden = true; UI.cls.hidden = true; parts.length = 0;
  G.endingShown = S.treeReached && S.finalDead; G.hintT = data ? 99 : 0; G.region = null; G.timers.length = 0;
  respawnAt(S.lastGrace); setMode('play');
  if (!data) later(1.2, () => subtitle('“Hỡi Kẻ Nhạt Phai... Hãy thu thập ba Đại Ấn và tới Cây Vàng ở tận cùng phương bắc.”', 5.5));
  save();
}
function openClassSelect() {
  UI.title.hidden = true; UI.cls.hidden = false;
  $('clsList').innerHTML = CLASSES.map(c => {
    const st = Object.entries(c.stats).map(([k, v]) => `<span>${STAT_SHORT[k] || STAT_NAME[k].split(' ')[0]} <b>${v}</b></span>`).join('');
    return `<li><button data-cls="${c.id}"><span class="cn">${c.name}</span><span class="cd">${c.desc}</span><span class="cs">${st}</span></button></li>`;
  }).join('');
  setTimeout(() => { const b = $('clsList').querySelector('button'); if (b) b.focus({ preventScroll: true }); }, 30);
}
$('clsList').addEventListener('click', e => { const b = e.target.closest('[data-cls]'); if (b) { audioInit(); startGame(null, b.dataset.cls); } });
$('btnClsBack').onclick = () => { UI.cls.hidden = true; UI.name.hidden = false; };
$('btnContinue').onclick = () => { audioInit(); startGame(loadSave()); };
$('btnNew').onclick = () => {
  audioInit();
  if (loadSave() && !confirmNew) { confirmNew = true; $('btnNew').textContent = 'Xoá tiến trình cũ và bắt đầu?'; $('btnNew').classList.add('warn'); return; }
  openNameEntry();
};
if (loadSave()) $('btnContinue').hidden = false;
window.addEventListener('pagehide', () => { if (G.mode !== 'title') save(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode === 'play') togglePause(); });

spawnEnemies();
boss = makeBoss(1);
dragon = makeDragon();
requestAnimationFrame(frame);
