'use strict';
// Gravebound — HUD, bản đồ và menu HTML
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
  drawAchPopup(1 / 60);
  if (G.toast) {
    const a = Math.min(1, G.toast.t * 4, (G.toast.dur - G.toast.t) * 2);
    ctx.globalAlpha = a; wrapText(G.toast.text, CW / 2, CH * (G.touch ? 0.5 : 0.62), Math.min(CW - 40, 560), 19, `500 14px ${FONT_U}`, '#f2dc97'); ctx.globalAlpha = 1;
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
  drawMarkerGuide();
  if (G.banner) drawBanner(G.banner);
  if (G.mode === 'dead') drawDeath();
  if (!G.touch && G.hintT < 24 && G.mode === 'play' && S.tut >= TUT.length) {
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
const MAP_LABELS = [['Pháo Đài Greystone', 3600, 900], ['Rừng Wraithwood', 3650, 2180], ['Đấu Trường Bloodsand', 3600, 3230], ['Cao Nguyên Cinderreach', 3700, 1580], ['Đồng Cỏ Mistveil', 1400, 2620],
  ['Tàn Tích Hollowmere', 700, 1900], ['Đầm Lầy Ashmire', 2420, 1520], ['Cổng Gác Thornwall', 1400, 760], ['Nhà Nguyện Dawnrest', 1400, 3480], ['Hồ Crystalmere', -1400, 1500], ['Bờ Biển Saltreach', -1300, 3300],
  ['Học Viện Starhollow', -1550, -300], ['Cao Nguyên Aurelia', 2200, -100], ['Sườn Núi Goldspire', 3500, -1400], ['Kinh Thành Aurumhold', 1400, -1300], ['Cây Aurum', 1400, -1720]];
function drawMap() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = 'rgba(8,7,5,.94)'; ctx.fillRect(0, 0, CW, CH);
  const MW = MAPW - WX0, MH = H - WY0, top = 58, bottom = 40, sc = Math.min((CW - 32) / MW, (CH - top - bottom) / MH), mw = MW * sc, mh = MH * sc, mx = (CW - mw) / 2, my = top;
  textC('Bản đồ', CW / 2, 36, spacedFont(CW < 500 ? 24 : 30, 700), '#ece3cc');
  ctx.drawImage(GROUND, 0, 0, MW / 2, MH / 2, mx, my, mw, mh);
  ctx.fillStyle = 'rgba(70,52,24,.3)'; ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = 'rgba(214,178,94,.6)'; ctx.lineWidth = 1; ctx.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
  const pt = (x, y) => [mx + (x - WX0) * sc, my + (y - WY0) * sc];
  G.mapRect = { mx, my, mw, mh, sc };
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
  // bia bản đồ chưa đọc ở những nơi đã đi qua: đánh dấu để người chơi quay lại
  for (const f of MAP_FRAGS) {
    if (S.frags.includes(f.id) || !revealedAt(f.x, f.y)) continue;
    const [x, y] = pt(f.x, f.y), p = 0.7 + Math.sin(G.clock * 4) * 0.3;
    ctx.fillStyle = `rgba(190,215,255,${p})`; ctx.shadowColor = '#bcd7ff'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(x - 4, y + 5); ctx.lineTo(x - 3, y - 5); ctx.lineTo(x, y - 8); ctx.lineTo(x + 3, y - 5); ctx.lineTo(x + 4, y + 5); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
  }
  if (!S.frags.length) textC('Bản đồ còn trống. Hãy tìm những Bia Bản Đồ phát sáng xanh để phác họa từng vùng.', CW / 2, my + 24, `500 ${CW < 500 ? 11 : 13}px ${FONT_U}`, '#bfe0ff', 0.9);
  if (S.lost && S.lost.x < MAPW) { const [x, y] = pt(S.lost.x, S.lost.y); ctx.fillStyle = '#9dffb8'; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); }
  if (S.marker) { const [x, y] = pt(S.marker.x, S.marker.y); drawMarkerIcon(x, y, 1); }
  const dg = dungeonAt(P.x, P.y), inMain = P.x < 4800, mpx = inMain ? P.x : dg ? dg.ex : null, mpy = inMain ? P.y : dg ? dg.ey : null;
  if (mpx !== null) {
    const [px, py] = pt(mpx, mpy), pulse = 1 + Math.sin(G.clock * 6) * 0.15;
    ctx.save(); ctx.translate(px, py); ctx.rotate(P.face); ctx.scale(pulse, pulse);
    ctx.fillStyle = '#e0503c'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -6); ctx.lineTo(-3, 0); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  } else textC('Ngươi đang ở ngoài thế giới thường', CW / 2, my + 46, `500 13px ${FONT_U}`, '#f2dc97');
  textC(G.touch ? 'Chạm vào bản đồ để đặt dấu · chạm ra ngoài để đóng' : 'Bấm vào bản đồ để đặt / gỡ dấu · G / Esc để đóng', CW / 2, CH - 14, `500 12px ${FONT_U}`, 'rgba(236,227,204,.7)');
}
function drawMarkerIcon(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#6fd0ff'; ctx.strokeStyle = '#0c1a24'; ctx.lineWidth = 1.5; ctx.shadowColor = '#6fd0ff'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-6, -10); ctx.arc(0, -12, 6.3, Math.PI * 0.8, Math.PI * 0.2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0; ctx.fillStyle = '#0c1a24'; ctx.beginPath(); ctx.arc(0, -12, 2.2, 0, TAU); ctx.fill(); ctx.restore();
}
// mũi tên chỉ về dấu trên bản đồ khi nó nằm ngoài màn hình, kèm khoảng cách
function drawMarkerGuide() {
  const m = S.marker;
  if (!m || P.x > 4800 || G.mode !== 'play') return;
  const d = dist(P.x, P.y, m.x, m.y);
  if (d < 70) { S.marker = null; toast('Đã tới nơi đánh dấu'); SFX.glint(); return; }
  const sx = CW / 2 + (m.x - cam.x) * ZOOM, sy = CH / 2 + (m.y - cam.y) * ZOOM, pad = 46;
  if (sx > pad && sx < CW - pad && sy > pad + 60 && sy < CH - pad) { drawMarkerIcon(sx, sy - 6 + Math.sin(G.clock * 3) * 3, 1.3); return; }
  const a = Math.atan2(m.y - P.y, m.x - P.x), cx = CW / 2, cy = CH / 2, k = Math.min((CW / 2 - pad) / Math.abs(Math.cos(a) || 1e-6), (CH / 2 - pad - 30) / Math.abs(Math.sin(a) || 1e-6));
  const ex = cx + Math.cos(a) * k, ey = cy + Math.sin(a) * k;
  ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = 'rgba(111,208,255,.9)'; ctx.strokeStyle = '#0c1a24'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-6, -9); ctx.lineTo(-2, 0); ctx.lineTo(-6, 9); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  textC(Math.round(d / 10) + ' m', ex - Math.cos(a) * 24, ey - Math.sin(a) * 24 + 4, `600 12px ${FONT_U}`, '#bfe8ff');
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
  } else if (b.kind === 'invade') {
    textC(b.title, CW / 2, cy + 4, spacedFont(small ? 26 : 42, 700), '#ff6a55');
    textC(b.sub, CW / 2, cy + 32, `500 14px ${FONT_U}`, '#f3c8bd');
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
const UI = { title: $('title'), pause: $('pause'), grace: $('grace'), ending: $('ending'), shop: $('shop'), cls: $('cls'), board: $('board'), name: $('name'), lore: $('lore'), controls: $('controlsBox'), diff: $('diffSel'), ach: $('achBox') };
const STAT_INFO = [
  ['vig', 'Tăng máu tối đa'], ['mnd', 'Tăng FP'], ['end', 'Tăng thể lực và sức mang vác'],
  ['str', 'Vũ khí nặng, sát thương theo Sức Mạnh'], ['dex', 'Vũ khí nhanh, cung, theo Khéo Léo'],
  ['int', 'Phép Trí Tuệ (dùng gậy)'], ['fai', 'Phép Đức Tin (dùng ấn)'],
];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function setMode(m) {
  G.mode = m;
  if (m !== 'play') { $('tut').hidden = true; tutShown = -2; }
  $('touch').hidden = !(G.touch && m === 'play');
  keys.clear(); stick.x = 0; stick.y = 0; touchGuard = false; mouseGuard = false; dodgeKey.down = false;
  if (m === 'play' && document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
}
// Một bảng menu dùng cho hai nơi: nghỉ ở Ân Điển (đủ chức năng) và Hành trang mở ở bất cứ đâu.
// Như Elden Ring: đổi vũ khí, giáp, bùa ở đâu cũng được; lên cấp, ghi nhớ phép, gắn tro chiến tranh
// và chia bình chỉ làm được ở Ân Điển.
let currentGrace = null, graceTab = 'level', menuAt = 'grace', pend = {};
const atGrace = () => menuAt === 'grace';
function openGrace(g) {
  currentGrace = g; menuAt = 'grace'; pend = {}; setMode('menu');
  $('graceEyebrow').textContent = g.name; $('graceTitle').textContent = 'Nghỉ ngơi'; $('btnLeave').textContent = 'Rời đi';
  selectTab('level'); renderGrace(); UI.grace.hidden = false;
  setTimeout(() => $('btnLeave').focus({ preventScroll: true }), 30);
}
function openInventory(tab = 'gear') {
  if (G.mode !== 'play' && G.mode !== 'pause') return;
  UI.pause.hidden = true;
  currentGrace = null; menuAt = 'field'; pend = {}; setMode('menu');
  $('graceEyebrow').textContent = regionAt(P.x, P.y); $('graceTitle').textContent = 'Hành trang'; $('btnLeave').textContent = 'Đóng';
  selectTab(tab); renderGrace(); UI.grace.hidden = false; SFX.glint();
  setTimeout(() => $('btnLeave').focus({ preventScroll: true }), 30);
}
function closeGrace() { if (pendLv()) toast('Các điểm chưa xác nhận đã được hủy'); pend = {}; UI.grace.hidden = true; setMode('play'); }
// đang giao chiến thì không dịch chuyển nhanh được (như Elden Ring)
function inCombat() {
  if (G.bossFight || G.dfight || G.colo.active || G.finalFight || G.dragonFight || P.x > 4800 && areaAt(P.x, P.y) && areaAt(P.x, P.y).id === 'realm') return true;
  return enemies.some(e => !e.dead && (e.state === 'chase' || e.state === 'atk') && dist(e.x, e.y, P.x, P.y) < 900);
}
function travelTo(id) {
  const g = GRACES.find(q => q.id === id);
  if (!g) return;
  P.x = g.x; P.y = g.y + 46; P.vx = P.vy = 0; P.state = 'idle'; P.t = 0; P.mounted = false; P.lock = null; P.atk = null; P.flameT = 0;
  projs.length = 0; aoes.length = 0; puddles.length = 0;
  cam.x = P.x; cam.y = P.y; clampCam(); G.fade = 1; buf = null; G.region = null; SFX.grace(); save();
}
const scText = Wp => Object.entries(Wp.sc || {}).map(([k, v]) => STAT_SHORT[k] + ' ' + v).join(' ');
function weaponLine(id) {
  const Wp = WEAPONS[id], lv = upLv(id);
  if (Wp.type === 'shield') return `Chặn ${Math.round((1 - 0.15 * Wp.guard.chip) * 100)}% · nặng ${Wp.wt}` + (Wp.req ? ' · cần ' + reqText(Wp.req) : '');
  if (Wp.sp) return `Sức mạnh phép ${Math.round(spellPower(id))} · ${scText(Wp)} · cần ${reqText(Wp.req)} · nặng ${Wp.wt}`;
  return `Công ${Math.round(weaponAR(id, lv))} · ${DT_NAME[Wp.dt]} · ${scText(Wp)} · cần ${reqText(Wp.req)} · nặng ${Wp.wt}${Wp.twoHanded ? ' · hai tay' : ''}`;
}
// ── lên cấp: cộng / trừ trước, xác nhận mới trừ rune ──
const pendLv = () => Object.values(pend).reduce((a, b) => a + b, 0);
function pendCost(n = pendLv()) { let c = 0; for (let i = 0; i < n; i++) c += Math.floor(150 + 60 * (S.level + i) + 6 * (S.level + i) * (S.level + i)); return c; }
function withPend(fn) {
  const old = S.stats; S.stats = Object.assign({}, old);
  for (const k in pend) S.stats[k] += pend[k];
  try { return fn(); } finally { S.stats = old; }
}
function derivedRows() {
  const cat = catalyst();
  return [['Máu', maxHp()], ['Thể lực', maxSt()], ['FP', maxFp()], ['Sức mang', maxLoad().toFixed(1)], ['Kiểu lăn', ROLLS[rollType()].name],
    ['Công tay phải', Math.round(weaponAR(S.equipped))], [cat ? 'Sức mạnh phép' : 'Hấp thụ', cat ? Math.round(spellPower(S.off)) : Math.round((1 - absorb('phys')) * 100) + '%'], ['Tải trọng', equipLoad().toFixed(1)]];
}
function renderLevel() {
  const g = atGrace(), n = pendLv(), cost = pendCost(), next = pendCost(n + 1) - cost, left = S.runes - cost;
  $('lvNum').textContent = S.level + (n ? ' → ' + (S.level + n) : '');
  $('lvRunes').textContent = (n ? left : S.runes).toLocaleString('vi-VN');
  $('lvCost').textContent = next.toLocaleString('vi-VN');
  $('lvCost').className = left < next ? 'short' : '';
  $('statList').innerHTML = STAT_INFO.map(([k, d]) => {
    const add = pend[k] || 0, v = S.stats[k] + add;
    const btns = g ? `<button class="plus" data-minus="${k}" aria-label="Bớt ${STAT_NAME[k]}" ${add ? '' : 'disabled'}>−</button><button class="plus" data-stat="${k}" aria-label="Thêm ${STAT_NAME[k]}" ${left < next || v >= 99 ? 'disabled' : ''}>+</button>` : '';
    return `<li class="${add ? 'up' : ''}"><div class="nm"><span>${STAT_NAME[k]}</span><span>${d}</span></div><span class="val">${v}</span><span class="btns">${btns}</span></li>`;
  }).join('');
  const now = derivedRows(), after = withPend(derivedRows);
  $('derived').innerHTML = now.map(([k, v], i) => { const w = after[i][1], ch = String(w) !== String(v); return `<div><dt class="k">${k}</dt><dd><b class="${ch ? 'chg' : ''}">${ch ? v + ' → ' + w : v}</b></dd></div>`; }).join('');
  $('lvConfirm').hidden = !g || graceTab !== 'level';
  $('btnLvOk').disabled = !n; $('btnLvCancel').disabled = !n;
  $('btnLvOk').textContent = n ? `Xác nhận · ${n} cấp · ${cost.toLocaleString('vi-VN')} rune` : 'Xác nhận';
  $('lvFieldNote').hidden = g;
  renderJournal();
}
function commitLevels() {
  const n = pendLv();
  if (!n || S.runes < pendCost()) return;
  for (const k in pend) for (let i = 0; i < pend[k]; i++) levelUp(k);
  pend = {}; SFX.felled(); toast('Đã lên cấp ' + S.level); renderGrace();
  $('btnLeave').focus({ preventScroll: true });
}
// ── nhật ký mục tiêu ──
function renderJournal() {
  // chỉ hiện những mục tiêu người chơi đã nghe nói tới; phần còn lại lộ dần theo hành trình
  const runesKnown = S.bossDead || S.gr.length > 0;
  const main = [
    [S.bossDead, 'Hạ Varek, Kẻ Canh Cổng', 'Đấu trường ở cuối con đường phía bắc Nhà Nguyện Dawnrest.'],
    [hasGR('east'), 'Đại Ấn Greystone', 'Dornach trong Pháo Đài Greystone (phía đông). Thắp ba lò lửa theo đường đi của mặt trời để mở cổng.'],
    [hasGR('swamp'), 'Đại Ấn Rồng Tro', 'Rồng Ignarth ngủ giữa Đầm Lầy Ashmire. Cưỡi ngựa để băng qua ao độc.'],
    [S.acadOpen || invN('crystalkey') > 0, 'Chìa Khóa Pha Lê', 'Trên hòn đảo phía tây bắc Hồ Crystalmere. Lối vào miền tây ở cạnh Tàn Tích Hollowmere.'],
    [hasGR('west'), 'Đại Ấn Trăng Pha Lê', 'Nữ hoàng Selvara trong Học Viện Starhollow, bờ bắc Hồ Crystalmere.'],
    [S.greatOpen, 'Mở cổng Kinh Thành Aurumhold', 'Mang đủ ba Đại Ấn tới cổng lớn trên Cao Nguyên Aurelia.'],
    [S.boss2Dead, 'Hạ Vua Ẩn Mặt', 'Sân Ngai Sunthrone trong Kinh Thành.'],
    [S.finalDead, 'Chạm tới Cây Aurum', 'Ở tận cùng phía bắc Kinh Thành.'],
  ];
  const known = [true, runesKnown, runesKnown, runesKnown || S.acadOpen || invN('crystalkey') > 0, runesKnown, runesKnown, S.greatOpen, S.boss2Dead];
  const nextI = main.findIndex(m => !m[0]);
  const dg = DUNGEONS.filter(d => S.dg[d.id]).length;
  $('journal').innerHTML = '<h3 class="sec">Nhật ký hành trình</h3><ul class="journal">' + main.map(([ok, t, h], i) => !ok && !known[i] ? '' :
    `<li class="${ok ? 'ok' : i === nextI ? 'next' : ''}"><span>${ok ? '✓' : i === nextI ? '▸' : '·'}</span><div><b>${t}</b>${!ok && i === nextI ? '<small>' + h + '</small>' : ''}</div></li>`).join('') + (known.every(k => k) ? '' : '<li class="fog"><span>·</span><div><small>Phần còn lại của con đường vẫn chìm trong sương mù.</small></div></li>') + '</ul>' +
    `<p class="note">Độ khó: ${DIFF.name}${DIFF.inv ? ' · Kẻ Xâm Nhập ' + INVADERS.slice(0, DIFF.inv).filter(v => S.inv[v.id]).length + '/' + Math.min(DIFF.inv, INVADERS.length) : ''}<br>Phụ: hầm ngục ${dg}/${DUNGEONS.length} · Đấu Trường Bloodsand ${S.coloDone ? '✓' : '—'} · Rừng Wraithwood ${S.mb.wraith ? '✓' : '—'} · Bia bản đồ ${S.frags.length}/${MAP_FRAGS.length} · Ân Điển ${S.discovered.length}/${GRACES.length} · Số lần chết ${S.deaths}</p>`;
}
// ── túi đồ ──
function renderInv() {
  const q = quickList(), cur = curQuick();
  const row = (id, n, desc, act) => `<li><div class="it"><span>${esc(id)}${n !== '' ? ' <small class="tag">×' + n + '</small>' : ''}<br><small>${desc}</small></span>${act}</div></li>`;
  let h = '<h3 class="sec">Đồ dùng · đang chọn trong ô nhanh: ' + (cur === 'flask' ? 'Bình Máu' : cur === 'fpflask' ? 'Bình FP' : ITEMDEF[cur].name) + '</h3><ul class="travel">';
  h += row('Bình Máu', P.flasks + '/' + (S.flaskMax - S.flaskFp), 'Hồi ' + flaskHeal() + ' máu. Nạp lại khi nghỉ ở Ân Điển.', `<button class="mini" data-quick="flask" ${cur === 'flask' ? 'disabled' : ''}>Chọn</button>`);
  h += row('Bình FP', P.fpflasks + '/' + S.flaskFp, 'Hồi ' + fpFlaskAmt() + ' FP.', `<button class="mini" data-quick="fpflask" ${cur === 'fpflask' ? 'disabled' : ''}>Chọn</button>`);
  for (const id of USE_ORDER) if (invN(id)) {
    const usable = id === 'cure' || id === 'grease' || id.startsWith('grune');
    h += row(ITEMDEF[id].name, invN(id), ITEMDEF[id].desc, (usable ? `<button class="mini" data-use="${id}">Dùng</button>` : '') + `<button class="mini" data-quick="${id}" ${cur === id ? 'disabled' : ''}>Chọn</button>`);
  }
  h += '</ul>';
  const mats = Object.keys(ITEMDEF).filter(k => ITEMDEF[k].kind !== 'use' && invN(k));
  h += '<h3 class="sec">Nguyên liệu và vật phẩm quan trọng</h3>' + (mats.length ? '<ul class="travel">' + mats.map(k => row(ITEMDEF[k].name, invN(k), ITEMDEF[k].desc, '')).join('') + '</ul>' : '<p class="note">Chưa có.</p>');
  h += `<p class="note">Mũi tên ${S.arrows}/${S.arrowMax} · Nước Mắt Thánh ${S.tears}/${TEAR_CAP} · Hạt Vàng: ${S.flaskMax}/${FLASK_CAP} bình · Ô phép ${S.slots} · Ô bùa ${S.talSlots}</p>`;
  $('invWrap').innerHTML = h;
}
function renderGrace() {
  const g = atGrace();
  $('tabLevel').textContent = g ? 'Lên cấp' : 'Trạng thái';
  $('tabFlask').hidden = !g;
  if (!g && graceTab === 'flask') graceTab = 'gear';
  renderLevel(); renderInv();
  // trang bị
  const ownR = ownedRight(), ownO = OFF_ORDER.filter(w => S.weapons.includes(w)), Wp = WEAPONS[S.equipped];
  let h = '<h3 class="sec">Tay phải</h3><ul class="travel">' + ownR.map(w => `<li><button data-weapon="${w}" class="${w === S.equipped ? 'on' : ''}"><span>${esc(WEAPONS[w].name)}${upLv(w) ? ' +' + upLv(w) : ''}<br><small>${weaponLine(w)}</small></span><small>${w === S.equipped ? 'Đang cầm' : 'Cầm'}</small></button></li>`).join('') + '</ul>';
  h += '<h3 class="sec">Tay trái' + (Wp.twoHanded ? ' · bị khóa vì tay phải cầm vũ khí hai tay' : '') + '</h3><ul class="travel">' + ownO.map(w => `<li><button data-off="${w}" class="${w === S.off ? 'on' : ''}"><span>${esc(WEAPONS[w].name)}${upLv(w) ? ' +' + upLv(w) : ''}<br><small>${WEAPONS[w].desc} · ${weaponLine(w)}</small></span><small>${w === S.off ? 'Đang cầm' : 'Cầm'}</small></button></li>`).join('') + '</ul>';
  if (Wp.type === 'melee') {
    const cur = ashOf(S.equipped), list = Wp.unique ? [Wp.ash] : [...new Set([Wp.ash, ...S.ashes.filter(a => !ASHES[a].unique && !ASHES[a].bow)])];
    const lock = Wp.unique || !g, why = Wp.unique ? ' · kỹ năng riêng, không đổi được' : !g ? ' · chỉ đổi được khi nghỉ ở Ân Điển' : '';
    h += `<h3 class="sec">Kỹ năng của ${esc(Wp.name)}${why}</h3><ul class="travel">` + list.map(a => `<li><button data-ash="${a}" class="${a === cur ? 'on' : ''}" ${lock ? 'disabled' : ''}><span>${ASHES[a].name}<br><small>${ASHES[a].desc} · ${ASHES[a].fp} FP</small></span><small>${a === cur ? 'Đang gắn' : 'Gắn'}</small></button></li>`).join('') + '</ul>';
  }
  h += `<h3 class="sec">Giáp · tải trọng ${equipLoad().toFixed(1)} / ${maxLoad().toFixed(1)} (${ROLLS[rollType()].name})</h3><ul class="travel">` + ARMOR_ORDER.filter(a => S.armors.includes(a)).map(a => { const A = ARMORS[a]; return `<li><button data-armor="${a}" class="${a === S.armor ? 'on' : ''}"><span>${A.name}<br><small>${A.desc} · giảm ${Math.round(A.abs * 100)}% · trụ ${A.poise} · nặng ${A.wt}</small></span><small>${a === S.armor ? 'Đang mặc' : 'Mặc'}</small></button></li>`; }).join('') + '</ul>';
  h += `<h3 class="sec">Bùa hộ mệnh · ${S.tal.length}/${S.talSlots} ô</h3>` + (S.tals.length ? '<ul class="travel">' + TAL_ORDER.filter(t => S.tals.includes(t)).map(t => `<li><button data-tal="${t}" class="${S.tal.includes(t) ? 'on' : ''}"><span>${TALISMANS[t].name}<br><small>${TALISMANS[t].desc}</small></span><small>${S.tal.includes(t) ? 'Đang đeo' : 'Đeo'}</small></button></li>`).join('') + '</ul>' : '<p class="note">Chưa có bùa nào. Tìm trong rương và hầm ngục.</p>');
  $('gearWrap').innerHTML = h;
  // phép: ghi nhớ ở Ân Điển, ở ngoài chỉ chọn phép đang dùng
  const own = SPELL_ORDER.filter(s => S.spells.includes(s)), cs = curSpell();
  $('spellWrap').innerHTML = (g ? `<p class="note">Ghi nhớ ${S.att.length}/${S.slots} ô. Phép Trí Tuệ cần gậy, phép Đức Tin cần ấn ở tay trái. Giữ chuột phải (hoặc X) để niệm, ↑ để đổi phép.</p>`
    : `<p class="note">Đang ghi nhớ ${S.att.length}/${S.slots} ô. Bấm để chọn phép dùng tiếp theo; ghi nhớ phép mới khi nghỉ ở Ân Điển.</p>`) +
    (own.length ? '<ul class="travel">' + own.filter(s => g || S.att.includes(s)).map(s => { const sp = SPELLS[s], on = S.att.includes(s); return `<li><button data-spell="${s}" class="${on ? 'on' : ''}"><span>${sp.name} <small class="tag">${sp.school === 'sorc' ? 'Trí Tuệ' : 'Đức Tin'}</small><br><small>${sp.desc} · ${sp.fp} FP · cần ${reqText(sp.req)}</small></span><small>${g ? (on ? 'Đã nhớ' : 'Ghi nhớ') : s === cs ? 'Đang dùng' : 'Dùng'}</small></button></li>`; }).join('') + '</ul>' : '<p class="note">Chưa học phép nào. Học Giả Lyra và Nữ Tu Seraphine ở Sảnh Hearthhold có bán phép.</p>');
  // bình
  const hpF = S.flaskMax - S.flaskFp;
  $('flaskWrap').innerHTML = `<p class="note">Tổng ${S.flaskMax} bình (Hạt Vàng tăng số bình, Nước Mắt Thánh tăng lượng hồi). Chia số bình giữa máu và FP.</p>
    <ul class="stats"><li><div class="nm"><span>Bình Máu</span><span>Hồi ${flaskHeal()} máu mỗi lần</span></div><span class="val">${hpF}</span><button class="plus" data-flask="1" ${S.flaskFp <= 0 ? 'disabled' : ''} aria-label="Thêm Bình Máu">+</button></li>
    <li><div class="nm"><span>Bình FP</span><span>Hồi ${fpFlaskAmt()} FP mỗi lần</span></div><span class="val">${S.flaskFp}</span><button class="plus" data-flask="-1" ${hpF <= 0 ? 'disabled' : ''} aria-label="Thêm Bình FP">+</button></li></ul>`;
  // dịch chuyển
  const list = GRACES.filter(q => S.discovered.includes(q.id)), busy = !g && inCombat();
  $('travelNote').textContent = g ? '' : busy ? 'Không thể dịch chuyển khi đang giao chiến.' : 'Dịch chuyển nhanh không hồi máu và không làm quái hồi sinh. Nghỉ ở Ân Điển để hồi phục.';
  $('travelList').innerHTML = list.map(q => `<li><button data-grace="${q.id}" ${busy ? 'disabled' : ''}><span>${q.name}</span><small>${q.id === S.lastGrace ? 'Nghỉ lần cuối' : 'Dịch chuyển'}</small></button></li>`).join('');
  for (const t of TABS) $('pane' + t[0].toUpperCase() + t.slice(1)).hidden = graceTab !== t;
  for (const t of TABS) $('tab' + t[0].toUpperCase() + t.slice(1)).setAttribute('aria-selected', String(graceTab === t));
}
$('statList').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || !atGrace()) return;
  const k = b.dataset.stat || b.dataset.minus;
  if (b.dataset.stat) { if (S.runes < pendCost(pendLv() + 1)) return; pend[k] = (pend[k] || 0) + 1; SFX.glint(); }
  else if (b.dataset.minus && pend[k]) { pend[k]--; if (!pend[k]) delete pend[k]; SFX.glint(); }
  renderLevel();
  const nb = $('statList').querySelector(`[data-${b.dataset.stat ? 'stat' : 'minus'}="${k}"]`);
  if (nb && !nb.disabled) nb.focus(); else { const o = $('statList').querySelector(`[data-${b.dataset.stat ? 'minus' : 'stat'}="${k}"]`); if (o && !o.disabled) o.focus(); }
});
$('btnLvOk').onclick = commitLevels;
$('btnLvCancel').onclick = () => { pend = {}; renderLevel(); };
$('travelList').addEventListener('click', e => {
  const b = e.target.closest('[data-grace]');
  if (!b) return;
  const id = +b.dataset.grace;
  UI.grace.hidden = true; pend = {};
  if (atGrace()) { S.lastGrace = id; save(); respawnAt(id); SFX.grace(); } else travelTo(id);
  setMode('play'); G.region = null;
});
$('gearWrap').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (d.weapon) equip(d.weapon); else if (d.off) equipOff(d.off); else if (d.ash) { if (atGrace()) setAsh(d.ash); } else if (d.armor) setArmor(d.armor); else if (d.tal) toggleTal(d.tal);
  applyStats(atGrace()); renderGrace();
});
$('spellWrap').addEventListener('click', e => {
  const b = e.target.closest('[data-spell]');
  if (!b) return;
  if (atGrace()) toggleAttune(b.dataset.spell);
  else { const i = S.att.indexOf(b.dataset.spell); if (i >= 0) { S.spellIdx = i; SFX.glint(); } }
  renderGrace();
});
$('invWrap').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.quick) { const i = quickList().indexOf(b.dataset.quick); if (i >= 0) { S.quick = i; SFX.glint(); } }
  else if (b.dataset.use) { useQuickItem(b.dataset.use); }
  renderGrace();
});
$('flaskWrap').addEventListener('click', e => { const b = e.target.closest('[data-flask]'); if (b) { flaskAlloc(-(+b.dataset.flask)); renderGrace(); } });
const TABS = ['level', 'gear', 'inv', 'spell', 'flask', 'travel'];
function selectTab(which) { graceTab = which; renderGraceTabsOnly(); }
function renderGraceTabsOnly() {
  for (const t of TABS) {
    const id = t[0].toUpperCase() + t.slice(1);
    $('tab' + id).setAttribute('aria-selected', String(graceTab === t));
    $('pane' + id).hidden = graceTab !== t;
  }
  $('lvConfirm').hidden = !atGrace() || graceTab !== 'level';
}
for (const t of TABS) $('tab' + t[0].toUpperCase() + t.slice(1)).onclick = () => { selectTab(t); if (t === 'travel' || t === 'level') renderGrace(); };
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
    $('shopName').textContent = 'Thợ Rèn Hewen';
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
  if (!UI.lore.hidden || !UI.controls.hidden || !UI.ach.hidden) { closeInfo(); return; }
  if (G.mode === 'map') { toggleMap(); return; }
  if (G.mode === 'menu' && !UI.grace.hidden && menuAt === 'field') { closeGrace(); return; }
  if (G.mode === 'play') { setMode('pause'); UI.pause.hidden = false; $('pauseEyebrow').textContent = 'Tạm dừng · Độ khó ' + DIFF.name; resetPauseNew(); $('btnResume').focus({ preventScroll: true }); }
  else if (G.mode === 'pause') { UI.pause.hidden = true; setMode('play'); }
  else if (G.mode === 'menu' && !UI.shop.hidden) closeShop();
  else if (G.mode === 'menu' && !UI.grace.hidden) closeGrace();
  else if (G.mode === 'menu' && !UI.ending.hidden) closeEnding();
  else if (!UI.board.hidden) closeBoard();
  else if (G.mode === 'title' && !UI.name.hidden) { UI.name.hidden = true; UI.title.hidden = false; }
  else if (G.mode === 'title' && !UI.cls.hidden) { UI.cls.hidden = true; openDiffSelect(); }
  else if (G.mode === 'title' && !UI.diff.hidden) { UI.diff.hidden = true; UI.name.hidden = false; }
}
function toggleMute() { muted = !muted; $('btnSound').textContent = 'Âm thanh: ' + (muted ? 'tắt' : 'bật'); toast(muted ? 'Đã tắt âm thanh' : 'Đã bật âm thanh'); }
$('btnResume').onclick = togglePause;
$('btnInv').onclick = () => openInventory();
// bảng Truyền thuyết / Điều khiển: mở từ màn hình chính hoặc từ menu tạm dừng
let infoBack = null;
function openInfo(el, from) {
  audioInit(); from.hidden = true; el.hidden = false;
  infoBack = from;
  const sc = el.querySelector('.scroll'); if (sc) sc.scrollTop = 0;
  el.querySelector('.pbtn').focus({ preventScroll: true });
}
function closeInfo() {
  UI.lore.hidden = true; UI.controls.hidden = true; UI.ach.hidden = true;
  if (infoBack) { infoBack.hidden = false; const b = infoBack.querySelector('.mbtn:not([hidden]),.pbtn'); if (b) b.focus({ preventScroll: true }); }
  infoBack = null;
}
$('btnLore').onclick = () => openInfo(UI.lore, UI.title);
// ───────────────────────── hướng dẫn đầu game: từng bước, xong một bước mới sang bước sau ─────────────────────────
// [tiêu đề, phím trên máy tính, cách làm trên điện thoại, hành động cần làm (tên act) hoặc hàm kiểm tra]
const TUT = [
  ['Di chuyển', '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> để đi lại', 'Kéo cần điều khiển bên trái', () => (G.tutMove || 0) > 160],
  ['Lăn né', 'Nhấn <kbd>Space</kbd> để lăn; lúc lăn ngươi không bị trúng đòn. Giữ <kbd>Space</kbd> để chạy nhanh', 'Chạm nút Lăn; giữ để chạy', 'roll'],
  ['Đánh thường', 'Bấm <kbd>Chuột trái</kbd>', 'Chạm nút Đánh', 'light'],
  ['Đánh mạnh', 'Giữ <kbd>Shift</kbd> rồi bấm <kbd>Chuột trái</kbd>. Đánh mạnh làm kẻ địch lảo đảo nhanh hơn', 'Chạm nút Đánh mạnh', 'heavy'],
  ['Đỡ đòn', 'Giữ <kbd>Chuột phải</kbd> để giơ khiên. Giơ đúng lúc đòn chạm tới sẽ phản đòn', 'Giữ nút Đỡ', () => P.state === 'guard'],
  ['Uống Bình Máu', 'Nhấn <kbd>R</kbd>. Bình được nạp lại mỗi khi nghỉ ở Ân Điển', 'Chạm nút Dùng đồ', 'item'],
  ['Bản đồ', 'Nhấn <kbd>G</kbd> để mở bản đồ, nhấn lại để đóng', 'Chạm nút Bản đồ', 'map'],
  ['Hành trang', 'Nhấn <kbd>I</kbd> để xem trạng thái, trang bị và túi đồ ở bất cứ đâu', 'Chạm nút Hành trang', 'inv'],
  ['Tương tác', 'Lại gần Ân Điển phát sáng rồi nhấn <kbd>E</kbd> để nghỉ, lên cấp và nạp bình. Mọi thứ có dấu sáng đều nhấn <kbd>E</kbd> được', 'Lại gần Ân Điển rồi chạm nút Tương tác', 'interact'],
];
let tutShown = -2;
function tutAct(a) { const s = TUT[S.tut]; if (s && G.hintT > 1 && s[3] === a) tutNext(); }
function tutNext() {
  S.tut++; SFX.glint();
  if (S.tut >= TUT.length) { toast('Hướng dẫn hoàn tất. Chúc ngươi may mắn, Gravebound.', 4); save(); }
}
function updateTut(dt) {
  const s = TUT[S.tut], show = !!s && G.mode === 'play' && G.hintT > 2;
  if (show && G.mode === 'play') {
    if (S.tut === 0) G.tutMove = (G.tutMove || 0) + Math.hypot(P.mvx || 0, P.mvy || 0) * dt;
    if (typeof s[3] === 'function' && s[3]()) tutNext();
  }
  const key = show ? S.tut : -1;
  if (key === tutShown) return;
  tutShown = key; $('tut').hidden = !show;
  if (!show) return;
  $('tutStep').textContent = 'Hướng dẫn ' + (S.tut + 1) + '/' + TUT.length;
  $('tutText').textContent = s[0];
  $('tutKeys').innerHTML = G.touch ? s[2] : s[1];
}
$('btnTutSkip').onclick = () => { S.tut = TUT.length; save(); updateTut(0); };
// ───────────────────────── thành tựu: lưu chung cho mọi hành trình ─────────────────────────
const ACH_KEY = 'gravebound-ach';
const cleared = d => S.finalDead && (!d || d.includes(S.diff));
const ACHS = [
  ['grace', 'Ánh Sáng Đầu Tiên', 'Tìm thấy một Ân Điển mới', () => S.discovered.length >= 3],
  ['parry', 'Phản Đòn Hoàn Hảo', 'Phản đòn thành công lần đầu', () => S.parries >= 1],
  ['parry20', 'Bậc Thầy Khiên', 'Phản đòn 20 lần trong một hành trình', () => S.parries >= 20],
  ['varek', 'Kẻ Gác Cổng Ngã Xuống', 'Hạ Varek ở Cổng Gác Thornwall', () => S.bossDead],
  ['east', 'Vệ Binh Được Giải Thoát', 'Nhận Đại Ấn Greystone', () => hasGR('east')],
  ['swamp', 'Kẻ Diệt Rồng', 'Hạ rồng Ignarth, nhận Đại Ấn Rồng Tro', () => hasGR('swamp')],
  ['west', 'Trăng Pha Lê Tắt', 'Hạ Selvara, nhận Đại Ấn Trăng Pha Lê', () => hasGR('west')],
  ['runes', 'Ba Mảnh Vòng', 'Gom đủ ba Đại Ấn', () => S.gr.length >= 3],
  ['king', 'Phế Truất Vua Ẩn Mặt', 'Hạ Varek ở Sân Ngai Sunthrone', () => S.boss2Dead],
  ['clear', 'Chạm Tới Cây Aurum', 'Phá đảo ở bất kỳ độ khó nào', () => cleared()],
  ['hard', 'Chu Kỳ Thứ Hai', 'Phá đảo ở độ khó Khó hoặc Chuyên gia', () => cleared(['hard', 'expert'])],
  ['expert', 'Chu Kỳ Cuối', 'Phá đảo ở độ khó Chuyên gia', () => cleared(['expert'])],
  ['nodeath', 'Chưa Từng Nằm Xuống', 'Phá đảo mà không chết lần nào', () => cleared() && S.deaths === 0],
  ['fast', 'Kẻ Lữ Hành Vội Vã', 'Phá đảo dưới 2 giờ', () => cleared() && S.time < 7200],
  ['dungeon', 'Kẻ Đào Mộ', 'Dọn sạch cả bốn hầm ngục', () => DUNGEONS.every(d => S.dg[d.id])],
  ['colo', 'Nhà Vô Địch Bloodsand', 'Vượt qua thử thách ở Đấu Trường Bloodsand', () => S.coloDone],
  ['wraith', 'Rừng Thiêng Yên Nghỉ', 'Hạ Seluna trong Rừng Wraithwood', () => !!S.mb.wraith],
  ['map', 'Người Vẽ Bản Đồ', 'Đọc hết Bia Bản Đồ', () => S.frags.length >= MAP_FRAGS.length],
  ['travel', 'Kẻ Lữ Hành', 'Tìm thấy 20 Ân Điển', () => S.discovered.length >= 20],
  ['level', 'Vững Như Đá', 'Đạt cấp 40', () => S.level >= 40],
  ['smith', 'Lưỡi Kiếm Tôi Luyện', 'Cường hóa một vũ khí lên +5', () => Object.values(S.wup).some(v => v >= 5)],
  ['invader', 'Săn Kẻ Săn', 'Đánh bại một Gravebound Đỏ', () => Object.keys(S.inv).length >= 1],
  ['invaders', 'Cuộc Săn Kết Thúc', 'Đánh bại cả ba Gravebound Đỏ', () => INVADERS.every(v => S.inv[v.id])],
  ['deaths', 'Nấm Mồ Quen Thuộc', 'Chết 100 lần trong một hành trình', () => S.deaths >= 100],
];
function readAch() { try { return JSON.parse(localStorage.getItem(ACH_KEY) || '{}') || {}; } catch (e) { return {}; } }
let achCache = readAch(), achT = 0;
function checkAch(dt) {
  if ((achT -= dt) > 0 || G.mode === 'title') return;
  achT = 1;
  let got = null;
  for (const [id, name, , test] of ACHS) {
    if (achCache[id]) continue;
    let ok = false; try { ok = test(); } catch (e) { ok = false; }
    if (ok) { achCache[id] = Date.now(); got = name; G.achQ = (G.achQ || []).concat(name); }
  }
  if (got) { try { localStorage.setItem(ACH_KEY, JSON.stringify(achCache)); } catch (e) { /* bỏ qua */ } }
}
// thông báo thành tựu ở góc trên bên phải, lần lượt từng cái
function drawAchPopup(dt) {
  if (!G.ach && G.achQ && G.achQ.length) { G.ach = { name: G.achQ.shift(), t: 0 }; SFX.glint(); }
  const A = G.ach; if (!A) return;
  A.t += dt; if (A.t > 4) { G.ach = null; return; }
  const a = Math.min(1, A.t * 4, (4 - A.t) * 2), w = Math.min(300, CW - 32), x = CW - w - 16, y = 72;
  ctx.globalAlpha = a; ctx.fillStyle = 'rgba(10,9,7,.88)'; ctx.fillRect(x, y, w, 50);
  ctx.strokeStyle = 'rgba(214,178,94,.7)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 49);
  ctx.font = `600 10px ${FONT_U}`; ctx.fillStyle = '#d6b25e'; ctx.fillText('THÀNH TỰU MỞ KHÓA', x + 14, y + 18);
  ctx.font = `600 17px ${FONT_D}`; ctx.fillStyle = '#ece3cc'; ctx.fillText(A.name, x + 14, y + 39); ctx.globalAlpha = 1;
}
function openAch(from) {
  achCache = readAch();
  const n = ACHS.filter(([id]) => achCache[id]).length;
  $('achCount').textContent = 'Đã mở ' + n + '/' + ACHS.length;
  $('achList').innerHTML = ACHS.map(([id, name, desc]) => `<li class="${achCache[id] ? 'on' : ''}"><b>${achCache[id] ? '✓ ' : ''}${name}</b><small>${desc}</small></li>`).join('');
  openInfo(UI.ach, from);
}
$('btnAch').onclick = () => openAch(UI.title);
$('btnPauseAch').onclick = () => openAch(UI.pause);
$('btnAchClose').onclick = closeInfo;
$('btnControls').onclick = () => openInfo(UI.controls, UI.title);
$('btnPauseLore').onclick = () => openInfo(UI.lore, UI.pause);
$('btnLoreClose').onclick = closeInfo;
$('btnControlsClose').onclick = closeInfo;
function updateFxBtn() { $('btnFx').textContent = 'Đồ họa: ' + (FX_LOW ? 'thấp' : 'cao'); }
$('btnFx').onclick = () => {
  FX_LOW = !FX_LOW;
  try { localStorage.setItem('vvv-fx', FX_LOW ? 'low' : 'high'); } catch (e) { /* bỏ qua */ }
  updateFxBtn(); resize();
};
updateFxBtn();
$('btnSound').onclick = () => { audioInit(); toggleMute(); };
// hành trình mới từ menu tạm dừng: bấm hai lần để xác nhận; tiến trình cũ chỉ bị thay khi đã chọn xong xuất thân
let pauseNewArmed = false;
function resetPauseNew() { pauseNewArmed = false; $('btnPauseNew').textContent = 'Hành trình mới'; $('btnPauseNew').classList.remove('warn'); }
$('btnPauseNew').onclick = () => {
  if (!pauseNewArmed) { pauseNewArmed = true; $('btnPauseNew').textContent = 'Bỏ hành trình này?'; $('btnPauseNew').classList.add('warn'); return; }
  resetPauseNew(); $('btnQuit').onclick(); openNameEntry();
};
$('btnQuit').onclick = () => {
  save(); UI.pause.hidden = true; setMode('title'); UI.title.hidden = false; G.bossFight = false;
  $('btnContinue').hidden = !loadSave(); confirmNew = false; $('btnNew').textContent = 'Hành trình mới'; $('btnNew').classList.remove('warn');
};
function openEnding() {
  setMode('menu');
  $('endLv').textContent = S.level; $('endDeaths').textContent = S.deaths; $('endName').textContent = cleanName(S.name) || 'Gravebound';
  const showRank = () => { const r = myRank(); $('endRank').textContent = r ? 'Hạng #' + r + ' trên bảng xếp hạng' + (boardShared() ? ' chung' : ' của máy này') : 'Kết quả đã được ghi vào bảng xếp hạng'; };
  showRank(); later(1.5, showRank);
  const m = Math.floor(S.time / 60), s = Math.floor(S.time % 60);
  $('endTime').textContent = Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  $('endLede').textContent = ENDING_TEXT[DIFF.id] || ENDING_TEXT.normal;
  const u = readUnlock(), first = !u.cleared;
  u.cleared = true; u.deaths = S.deaths; u.clears = Object.assign({}, u.clears, { [DIFF.id]: ((u.clears || {})[DIFF.id] || 0) + (G.endingCounted ? 0 : 1) }); writeUnlock(u);
  G.endingCounted = true;
  $('endUnlock').hidden = !first; $('endUnlock').textContent = 'Đã mở khóa độ khó Khó và Chuyên gia. Hãy bắt đầu Hành trình mới để bước vào chu kỳ tiếp theo.';
  achT = 0; checkAch(0);
  UI.ending.hidden = false; SFX.felled();
  $('btnEndClose').focus({ preventScroll: true });
}
function closeEnding() { UI.ending.hidden = true; setMode('play'); }
$('btnEndClose').onclick = closeEnding;
$('btnEndNew').onclick = () => { UI.ending.hidden = true; setMode('title'); G.bossFight = false; openNameEntry(); };
const ENDING_TEXT = {
  easy: 'Ngươi quỳ dưới tán Cây Aurum, và những mảnh Vòng vỡ lặng lẽ tìm về lòng bàn tay ngươi. Kỷ nguyên tro tàn khép lại. Kỷ nguyên của ngươi bắt đầu.',
  normal: 'Ngươi quỳ dưới tán Cây Aurum, và những mảnh Vòng vỡ lặng lẽ tìm về lòng bàn tay ngươi. Kỷ nguyên tro tàn khép lại. Kỷ nguyên của ngươi bắt đầu.',
  hard: 'Lần thứ hai ngươi quỳ dưới tán Cây Aurum. Những Gravebound Đỏ đã ngã xuống sau lưng ngươi, và Vòng nhận ra bàn tay từng chạm vào nó. Lần này, nó không rời ngươi nữa.',
  expert: 'Chu kỳ cuối cùng khép lại. Không còn kẻ xâm nhập, không còn lời thề cũ nào đứng dậy. Chỉ còn ngươi, kẻ Gravebound đã nhiều lần vượt qua cái chết, và chiếc Vòng cuối cùng cũng lành lại trong tay ngươi.',
};

// ───────────────────────── bắt đầu trò chơi ─────────────────────────
let confirmNew = false;
function startGame(data, cls) {
  S = data ? Object.assign(defaultSave(), data) : defaultSave();
  if (!data) { applyClass(cls); S.name = pendingName || 'Gravebound'; S.diff = pendingDiff; }
  if (S.finalDead && !diffUnlocked()) writeUnlock(Object.assign(readUnlock(), { cleared: true, deaths: S.deaths }));
  if (data && data.tut === undefined) S.tut = 99; // save cũ đã quen phím, bỏ qua hướng dẫn
  setDiff(S.diff); setupCycleNotes(); G.invader = null; G.invCd = 0; G.endingCounted = !!data && S.finalDead;
  S.flaskMax = Math.min(S.flaskMax, FLASK_CAP);
  expDecode(S.explored);
  UI.title.hidden = true; UI.cls.hidden = true; parts.length = 0;
  G.endingShown = S.treeReached && S.finalDead; G.hintT = data ? 99 : 0; G.region = null; G.timers.length = 0;
  respawnAt(S.lastGrace); setMode('play');
  if (!data) {
    // phần mở đầu kể trong game, không giải thích trước ở màn hình tiêu đề
    later(1.2, () => subtitle('“...Tỉnh dậy đi, Gravebound.”', 3.2));
    later(4.8, () => subtitle('“Vòng Aurum đã vỡ. Người chết không còn đường về, chỉ biết bò lên từ nấm mồ như ngươi. Vùng đất đang mục rữa từ gốc rễ.”', 5));
    later(10.4, () => subtitle('“Ân Điển gọi ngươi trở về vì một lẽ. Hãy đi về phương bắc... câu trả lời đang chờ ở đó.”', 5));
  }
  save();
}
function openClassSelect() {
  UI.title.hidden = true; UI.cls.hidden = false;
  $('clsEyebrow').textContent = 'Hành trình mới · Độ khó ' + DIFFS[pendingDiff].name;
  $('clsList').innerHTML = CLASSES.map(c => {
    const st = Object.entries(c.stats).map(([k, v]) => `<span>${STAT_SHORT[k] || STAT_NAME[k].split(' ')[0]} <b>${v}</b></span>`).join('');
    return `<li><button data-cls="${c.id}"><span class="cn">${c.name}</span><span class="cd">${c.desc}</span><span class="cs">${st}</span></button></li>`;
  }).join('');
  setTimeout(() => { const b = $('clsList').querySelector('button'); if (b) b.focus({ preventScroll: true }); }, 30);
}
$('clsList').addEventListener('click', e => { const b = e.target.closest('[data-cls]'); if (b) { audioInit(); startGame(null, b.dataset.cls); } });
$('btnClsBack').onclick = () => { UI.cls.hidden = true; openDiffSelect(); };
// ── chọn độ khó: chỉ một lần mỗi hành trình; Khó và Chuyên gia mở sau lần phá đảo đầu tiên ──
let pendingDiff = 'normal';
function openDiffSelect() {
  UI.title.hidden = true; UI.diff.hidden = false;
  const open = diffUnlocked();
  $('diffList').innerHTML = DIFF_ORDER.map(id => {
    const d = DIFFS[id], lock = d.locked && !open;
    const tag = lock ? '<span class="lock">Đã khóa · phá đảo một lần để mở</span>' : d.locked ? '<span class="new">Chu kỳ mới</span>' : '';
    return `<li><button data-diff="${id}" ${lock ? 'disabled' : ''}><span class="cn">${d.name}</span>${tag}<span class="cd">${d.desc}</span></button></li>`;
  }).join('');
  setTimeout(() => { const b = $('diffList').querySelector(`[data-diff="${pendingDiff}"]:not([disabled])`) || $('diffList').querySelector('button'); if (b) b.focus({ preventScroll: true }); }, 30);
}
$('diffList').addEventListener('click', e => { const b = e.target.closest('[data-diff]'); if (b && !b.disabled) { audioInit(); pendingDiff = b.dataset.diff; UI.diff.hidden = true; openClassSelect(); } });
$('btnDiffBack').onclick = () => { UI.diff.hidden = true; UI.name.hidden = false; };
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
