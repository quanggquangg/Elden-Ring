'use strict';
// Gravebound — HUD, bản đồ và menu HTML
// ───────────────────────── HUD ─────────────────────────
// thanh máu / FP / thể lực kiểu Elden Ring: khung tối viền vàng có góc nhọn, phần đã mất ánh vàng,
// màu chính đổ dọc từ sáng xuống tối, vệt bóng phía trên và đầu thanh sáng
function bar(x, y, w, h, frac, ghost, col) {
  const f = clamp(frac, 0, 1);
  ctx.fillStyle = 'rgba(8,7,5,.82)'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.strokeStyle = 'rgba(214,178,94,.55)'; ctx.lineWidth = 1; ctx.strokeRect(x - 2.5, y - 2.5, w + 5, h + 5);
  ctx.fillStyle = 'rgba(214,178,94,.8)';
  for (const ex of [x - 2.5, x + w + 2.5]) { ctx.beginPath(); ctx.moveTo(ex, y + h / 2 - 3); ctx.lineTo(ex + (ex < x ? -3 : 3), y + h / 2); ctx.lineTo(ex, y + h / 2 + 3); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = 'rgba(40,34,26,.9)'; ctx.fillRect(x, y, w, h);
  if (ghost != null) { ctx.fillStyle = '#d9b85c'; ctx.fillRect(x, y, w * clamp(ghost, 0, 1), h); }
  if (f > 0) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, tint(col, 1.35)); g.addColorStop(0.5, col); g.addColorStop(1, tint(col, 0.6));
    ctx.fillStyle = g; ctx.fillRect(x, y, w * f, h);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x, y, w * f, Math.max(1, h * 0.28));
    ctx.fillStyle = 'rgba(255,245,220,.55)'; ctx.fillRect(x + w * f - 1.5, y, 1.5, h);
  }
}
function textC(str, x, y, font, col, shadowA = 0.8) {
  ctx.font = font; ctx.textAlign = 'center';
  ctx.fillStyle = `rgba(0,0,0,${shadowA})`; ctx.fillText(str, x + 1, y + 2);
  ctx.fillStyle = col; ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}
function spacedFont(px, weight = 600) { return `${weight} ${px}px ${FONT_D}`; }
// ô trang bị: nền tối đổ bóng, viền vàng hai lớp, góc nẹp sáng
function box(x, y, s) {
  const g = ctx.createRadialGradient(x + s / 2, y + s * 0.4, s * 0.1, x + s / 2, y + s / 2, s * 0.75);
  g.addColorStop(0, 'rgba(46,38,26,.9)'); g.addColorStop(1, 'rgba(8,7,5,.92)');
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 1, y + 2, s, s);
  ctx.fillStyle = g; ctx.fillRect(x, y, s, s);
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(214,178,94,.55)'; ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
  ctx.strokeStyle = 'rgba(214,178,94,.16)'; ctx.strokeRect(x + 3.5, y + 3.5, s - 7, s - 7);
  const c = Math.min(7, s * 0.22); ctx.strokeStyle = '#f2dc97'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + s, y, -1, 1], [x, y + s, 1, -1], [x + s, y + s, -1, -1]]) { ctx.moveTo(cx + dx * 0.75, cy + dy * c); ctx.lineTo(cx + dx * 0.75, cy + dy * 0.75); ctx.lineTo(cx + dx * c, cy + dy * 0.75); }
  ctx.stroke(); ctx.lineWidth = 1;
}
// đường hoa văn: nét mảnh mờ dần hai đầu, hạt kim cương ở giữa
function ornLine(cx, y, w, a = 1) {
  const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  g.addColorStop(0, 'rgba(214,178,94,0)'); g.addColorStop(0.5, `rgba(226,190,106,${0.85 * a})`); g.addColorStop(1, 'rgba(214,178,94,0)');
  ctx.fillStyle = g; ctx.fillRect(cx - w / 2, y - 0.5, w, 1);
  ctx.save(); ctx.translate(cx, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#15120c'; ctx.fillRect(-3, -3, 6, 6);
  ctx.strokeStyle = `rgba(242,220,151,${a})`; ctx.lineWidth = 1; ctx.strokeRect(-3, -3, 6, 6); ctx.restore();
}
// chữ vàng đổ dọc có quầng sáng nhẹ
function goldText(str, x, y, font, glow = 0.5, stops = ['#fff4d6', '#ecd08a', '#a8823e']) {
  ctx.font = font; ctx.textAlign = 'center';
  const m = ctx.measureText(str), h = m.actualBoundingBoxAscent || 20;
  ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillText(str, x + 1, y + 2);
  const g = ctx.createLinearGradient(0, y - h, 0, y + 2); g.addColorStop(0, stops[0]); g.addColorStop(0.55, stops[1]); g.addColorStop(1, stops[2]);
  if (glow) { ctx.shadowColor = `rgba(255,200,90,${glow})`; ctx.shadowBlur = 18; }
  ctx.fillStyle = g; ctx.fillText(str, x, y); ctx.shadowBlur = 0; ctx.textAlign = 'left';
}
// dải nền mờ ngang màn hình, có hai đường chỉ vàng trên dưới
function bandBG(cy, h, a = 0.7, lines = true) {
  const g = ctx.createLinearGradient(0, 0, CW, 0);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, cy - h / 2, CW, h);
  if (!lines) return;
  const l = ctx.createLinearGradient(0, 0, CW, 0);
  l.addColorStop(0.1, 'rgba(214,178,94,0)'); l.addColorStop(0.5, 'rgba(214,178,94,.45)'); l.addColorStop(0.9, 'rgba(214,178,94,0)');
  ctx.fillStyle = l; ctx.fillRect(0, cy - h / 2, CW, 1); ctx.fillRect(0, cy + h / 2 - 1, CW, 1);
}
// phím bấm dạng nắp phím nổi
function keycap(x, y, k, s = 18) {
  ctx.font = `700 ${Math.round(s * 0.6)}px ${FONT_U}`; const w = Math.max(s, ctx.measureText(k).width + 8);
  const g = ctx.createLinearGradient(0, y, 0, y + s); g.addColorStop(0, '#3a3122'); g.addColorStop(1, '#16120c');
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.roundRect(x, y + 2, w, s, 3); ctx.fill();
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, w, s, 3); ctx.fill();
  ctx.strokeStyle = '#e2c26c'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,200,.18)'; ctx.fillRect(x + 2, y + 1.5, w - 4, 1);
  ctx.fillStyle = '#f7e6b0'; ctx.textAlign = 'center'; ctx.fillText(k, x + w / 2, y + s * 0.72); ctx.textAlign = 'left';
  return w;
}
// bình thuốc: thân thủy tinh tròn, nước bên trong có mặt sóng, cổ, nút bấc, vệt sáng
function drawFlaskIcon(cx, cy, col, empty) {
  const r = 10, by = cy + 4;
  ctx.save();
  ctx.fillStyle = 'rgba(200,220,230,.1)'; ctx.beginPath(); ctx.arc(cx, by, r, 0, TAU); ctx.fill();
  if (!empty) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, by, r - 1.2, 0, TAU); ctx.clip();
    const g = ctx.createRadialGradient(cx - 3, by - 2, 1, cx, by + 2, r + 2); g.addColorStop(0, tint(col, 1.7)); g.addColorStop(0.5, col); g.addColorStop(1, tint(col, 0.45));
    ctx.fillStyle = g; const wy = by - r * 0.35;
    ctx.beginPath(); ctx.moveTo(cx - r, wy); for (let k = 0; k <= 8; k++) ctx.lineTo(cx - r + k * r / 4, wy + Math.sin(G.clock * 3 + k) * 0.8); ctx.lineTo(cx + r, by + r); ctx.lineTo(cx - r, by + r); ctx.closePath(); ctx.fill();
    ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.fillStyle = `rgba(255,255,255,.12)`; ctx.fillRect(cx - r, wy, r * 2, 1); ctx.restore();
  }
  ctx.fillStyle = empty ? 'rgba(70,66,60,.5)' : 'rgba(200,220,230,.14)'; ctx.fillRect(cx - 3.5, cy - 12, 7, 8);
  ctx.strokeStyle = 'rgba(225,232,236,.75)'; ctx.lineWidth = 1.2; ctx.beginPath();
  ctx.moveTo(cx - 3.5, cy - 12); ctx.lineTo(cx - 3.5, by - r + 0.6); ctx.moveTo(cx + 3.5, by - r + 0.6); ctx.lineTo(cx + 3.5, cy - 12); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, by, r, 0, TAU); ctx.stroke();
  const ck = ctx.createLinearGradient(cx - 5, 0, cx + 5, 0); ck.addColorStop(0, '#6a4a28'); ck.addColorStop(0.5, '#b08656'); ck.addColorStop(1, '#5a3c20');
  ctx.fillStyle = ck; ctx.beginPath(); ctx.roundRect(cx - 4.5, cy - 16, 9, 5, 1.5); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.fillStyle = '#c9b48a'; ctx.fillRect(cx - 4.5, cy - 11.5, 9, 1.5);
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, by, r - 3.5, Math.PI * 1.05, Math.PI * 1.4); ctx.stroke();
  ctx.restore();
}
// ── icon vũ khí trên HUD: mỗi loại vũ khí một hình riêng, nghiêng 45° như ô trang bị trong game souls ──
function iconPath(pts) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); }
function drawWeaponIcon(id, cx, cy, box) {
  const W = WEAPONS[id], L = W.look || {}, k = box / 33, c = L.wcol || '#cfcabc', ol = 'rgba(8,6,4,.9)';
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-Math.PI / 4); ctx.scale(k, k);
  ctx.lineJoin = 'round'; ctx.strokeStyle = ol; ctx.lineWidth = 1.4;
  const glow = L.glow ? (typeof L.glow === 'string' ? L.glow : '#ffd76a') : null;
  const blade = (x0, x1, hw, tipLen, col) => {
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 8; }
    ctx.fillStyle = col; iconPath([[x0, -hw], [x1 - tipLen, -hw], [x1, 0], [x1 - tipLen, hw], [x0, hw]]); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x0 + 1, -hw * 0.3 - 0.4, x1 - tipLen - x0 - 1, Math.max(0.8, hw * 0.35));
  };
  const hilt = (x, gw, gcol = '#b08d4c') => {
    ctx.fillStyle = '#4a3a28'; ctx.fillRect(x - 7, -1.3, 7, 2.6); ctx.strokeRect(x - 7, -1.3, 7, 2.6);
    ctx.fillStyle = gcol; ctx.fillRect(x - 1, -gw, 2.4, gw * 2); ctx.strokeRect(x - 1, -gw, 2.4, gw * 2);
    ctx.beginPath(); ctx.arc(x - 8.5, 0, 2, 0, TAU); ctx.fill(); ctx.stroke();
  };
  const shaft = (x0, x1, col = '#6b5a3e', w = 2.2) => { ctx.fillStyle = col; ctx.fillRect(x0, -w / 2, x1 - x0, w); ctx.strokeRect(x0, -w / 2, x1 - x0, w); };
  if (W.type === 'bow') {
    ctx.strokeStyle = ol; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.arc(-6, 0, 15, -1.2, 1.2); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(-6, 0, 15, -1.2, 1.2); ctx.stroke();
    const ex = -6 + Math.cos(1.2) * 15, ey = Math.sin(1.2) * 15;
    ctx.strokeStyle = 'rgba(235,230,215,.85)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(ex, -ey); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = '#d8d0bc'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ex - 2, 0); ctx.lineTo(13, 0); ctx.stroke();
    ctx.fillStyle = '#e8e4d8'; iconPath([[15, 0], [11, -2.4], [11, 2.4]]); ctx.fill();
    ctx.fillStyle = id === 'goldbow' ? '#ffe08a' : '#a8a090'; iconPath([[ex - 2, 0], [ex - 5, -2.5], [ex - 3, 0], [ex - 5, 2.5]]); ctx.fill();
  } else if (id === 'rapier') {
    blade(0, 17, 0.9, 5, c); ctx.fillStyle = '#b08d4c'; ctx.beginPath(); ctx.arc(-1, 0, 3.6, -1.9, 1.9); ctx.fill(); ctx.stroke(); hilt(0, 1.2);
  } else if (L.weapon === 'katana') {
    ctx.strokeStyle = ol; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(9, -1, 16, -4); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(1, -0.6); ctx.quadraticCurveTo(9, -1.6, 15, -4.3); ctx.stroke();
    ctx.strokeStyle = ol; ctx.lineWidth = 1.2; ctx.fillStyle = '#b08d4c'; ctx.beginPath(); ctx.ellipse(-0.5, 0, 1.4, 3.4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2b2622'; ctx.fillRect(-10, -1.4, 9, 2.8); ctx.strokeRect(-10, -1.4, 9, 2.8);
    ctx.fillStyle = '#e8dcc0'; for (let i = 0; i < 3; i++) ctx.fillRect(-9 + i * 3, -1.4, 1, 2.8);
  } else if (L.weapon === 'spear') {
    shaft(-16, 8); ctx.fillStyle = c; iconPath([[17, 0], [11, -3], [7, 0], [11, 3]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a7342'; ctx.fillRect(6, -1.8, 2, 3.6); ctx.strokeRect(6, -1.8, 2, 3.6);
  } else if (L.weapon === 'axe') {
    const big = id === 'greataxe';
    shaft(-15, 12);
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(6, -1); ctx.quadraticCurveTo(10, -11, 16, -10); ctx.quadraticCurveTo(13, -4, 15, 1); ctx.lineTo(9, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (big) { ctx.beginPath(); ctx.moveTo(6, 1); ctx.quadraticCurveTo(10, 11, 16, 10); ctx.quadraticCurveTo(13, 4, 15, -1); ctx.lineTo(9, -1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.moveTo(14, -9); ctx.quadraticCurveTo(12, -4, 14, 0); ctx.lineTo(13, 0); ctx.quadraticCurveTo(11, -4, 13, -9); ctx.fill();
  } else if (L.weapon === 'club') {
    shaft(-15, 7, '#4a3a28', 2.6);
    ctx.fillStyle = c; ctx.fillRect(6, -6.5, 11, 13); ctx.strokeRect(6, -6.5, 11, 13);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(7.5, -5, 8, 2.2); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(7.5, 3, 8, 2.2);
  } else if (L.weapon === 'scythe') {
    shaft(-16, 14, '#3a3a4a');
    ctx.shadowColor = c; ctx.shadowBlur = 6; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(14, -1); ctx.quadraticCurveTo(12, -12, -2, -13); ctx.quadraticCurveTo(9, -8, 11, -1); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
  } else if (id === 'broken') {
    ctx.fillStyle = c; iconPath([[0, -2], [9, -2], [11, -0.5], [9.5, 0.6], [12, 2], [0, 2]]); ctx.fill(); ctx.stroke(); hilt(0, 4.5, '#7a6a52');
  } else if (L.weapon === 'greatsword') {
    blade(0, 18, 3.2, 5, c); hilt(0, 6.5);
  } else if (id === 'dagger') {
    blade(0, 10, 1.8, 4, c); hilt(0, 3.4);
  } else {
    blade(0, 17, 2, 4.5, c); hilt(0, 5, id === 'royalsword' ? '#ffd76a' : id === 'crystalsword' ? '#9fd0ff' : '#b08d4c');
  }
  ctx.restore();
}
function drawOffIcon(off, cx, cy, box) {
  const k = box / 26; ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.strokeStyle = 'rgba(8,6,4,.9)'; ctx.lineWidth = 1.2;
  if (off.type === 'shield' && off.id === 'kite') {
    ctx.fillStyle = '#6a707a'; iconPath([[0, -9], [7, -6], [6, 3], [0, 10], [-6, 3], [-7, -6]]); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#d8dce2'; ctx.lineWidth = 1; iconPath([[0, -7], [5, -5], [4.5, 2.5], [0, 7.5], [-4.5, 2.5], [-5, -5]]); ctx.stroke();
    ctx.fillStyle = '#b08d4c'; ctx.fillRect(-0.8, -5, 1.6, 9); ctx.fillRect(-3.5, -1.8, 7, 1.6);
  } else if (off.type === 'shield') {
    ctx.fillStyle = '#7a5a36'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,28,16,.8)'; ctx.lineWidth = 0.8; for (const x of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(x, -8.5); ctx.lineTo(x, 8.5); ctx.stroke(); }
    ctx.strokeStyle = '#b9b29c'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, 8.3, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#c8c0a8'; ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, TAU); ctx.fill();
  } else if (off.type === 'staff') {
    const orb = off.id === 'staff2' ? '#e0f0ff' : off.id === 'staff3' ? '#9fd0ff' : off.id === 'staff1' ? '#b9c8ff' : '#8fb0d8';
    ctx.rotate(-Math.PI / 4); ctx.fillStyle = off.id === 'staff0' ? '#6b5a3e' : '#4a4f6a'; ctx.fillRect(-10, -1.1, 17, 2.2); ctx.strokeRect(-10, -1.1, 17, 2.2);
    ctx.shadowColor = orb; ctx.shadowBlur = 8; ctx.fillStyle = orb; ctx.beginPath(); ctx.arc(8.5, 0, 3.3, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
  } else {
    const col = off.id === 'seal0' ? '#a08a60' : off.id === 'seal2' ? '#e0c890' : '#ffd76a';
    ctx.shadowColor = col; ctx.shadowBlur = 6; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    ctx.strokeStyle = 'rgba(80,50,10,.85)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, TAU); ctx.moveTo(0, -7); ctx.lineTo(0, 7); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke();
  }
  ctx.restore();
}
function drawQuickIcon(q, cx, cy) {
  if (q === 'flask') return drawFlaskIcon(cx, cy, '#c22a20', P.flasks <= 0);
  if (q === 'fpflask') return drawFlaskIcon(cx, cy, '#3566d8', P.fpflasks <= 0);
  const col = ITEMDEF[q].col || '#ddd';
  ctx.save(); ctx.translate(cx, cy); ctx.lineJoin = 'round';
  if (q === 'knife') {
    ctx.rotate(-0.8);
    for (const dx of [-5, 3]) {
      const g = ctx.createLinearGradient(dx - 2, 0, dx + 2, 0); g.addColorStop(0, '#f4f0e6'); g.addColorStop(1, '#8a8478');
      ctx.fillStyle = g; ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(dx, -13); ctx.lineTo(dx + 2.4, -2); ctx.lineTo(dx - 2.4, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5a3c20'; ctx.fillRect(dx - 1.3, -2, 2.6, 9); ctx.fillStyle = '#c9a44e'; ctx.fillRect(dx - 3, -2.6, 6, 1.6); ctx.beginPath(); ctx.arc(dx, 8, 1.8, 0, TAU); ctx.fill();
    }
  } else if (q === 'firepot') {
    ctx.shadowColor = '#ff8a3a'; ctx.shadowBlur = 10;
    const g = ctx.createRadialGradient(-3, 0, 1, 0, 3, 11); g.addColorStop(0, '#c07a48'); g.addColorStop(1, '#5a3218');
    ctx.fillStyle = g; ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 3, 9, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    ctx.strokeStyle = '#d8c090'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-8, 1); ctx.quadraticCurveTo(0, 5, 8, 1); ctx.stroke();
    ctx.fillStyle = '#7a4a24'; ctx.fillRect(-3, -8, 6, 4); ctx.strokeStyle = OL; ctx.strokeRect(-3, -8, 6, 4);
    const f = Math.sin(G.clock * 12) * 1.2; ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.moveTo(-2.5, -8); ctx.quadraticCurveTo(-3, -13, 0 + f, -16); ctx.quadraticCurveTo(3, -12, 2.5, -8); ctx.fill();
    ctx.fillStyle = '#fff0b0'; ctx.beginPath(); ctx.moveTo(-1, -8); ctx.quadraticCurveTo(0, -11, f * 0.6, -13); ctx.quadraticCurveTo(1.5, -10, 1, -8); ctx.fill();
  } else if (q.startsWith('grune')) {
    const big = q === 'grune2', r = big ? 12 : 10;
    ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.fillStyle = tint(col, 0.7); ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.7, 0); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = tint(col, 1.35); ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(-r * 0.7, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.7, 0); ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,50,10,.7)'; ctx.beginPath(); ctx.moveTo(0, -r * 0.5); ctx.lineTo(0, r * 0.5); ctx.moveTo(-r * 0.25, -r * 0.1); ctx.lineTo(r * 0.25, r * 0.2); ctx.stroke();
  } else if (q === 'cure' || q === 'grease') {
    // lọ nhỏ: thuốc giải độc xanh lá, dầu thánh vàng
    const g = ctx.createLinearGradient(-6, 0, 6, 0); g.addColorStop(0, tint(col, 0.6)); g.addColorStop(0.4, tint(col, 1.3)); g.addColorStop(1, tint(col, 0.5));
    ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.fillStyle = g; ctx.strokeStyle = OL; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-2.5, -8); ctx.lineTo(-2.5, -5); ctx.quadraticCurveTo(-8, -2, -7, 5); ctx.quadraticCurveTo(-6, 11, 0, 11); ctx.quadraticCurveTo(6, 11, 7, 5); ctx.quadraticCurveTo(8, -2, 2.5, -5); ctx.lineTo(2.5, -8); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    ctx.fillStyle = '#8a6a44'; ctx.fillRect(-3.5, -12, 7, 4); ctx.strokeRect(-3.5, -12, 7, 4);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(-4.5, -1, 1.6, 7);
    if (q === 'cure') { ctx.fillStyle = '#f4f0e0'; ctx.fillRect(-1, 1, 2, 7); ctx.fillRect(-3.5, 3.5, 7, 2); }
    else { ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.arc(0, 4, 2.4, 0, TAU); ctx.fill(); }
  } else { ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; }
  ctx.restore();
}
// biểu tượng rune: vòng tròn vàng với nét khắc như một chữ cổ
function runeGlyph(x, y, r) {
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = 'rgba(255,210,110,.7)'; ctx.shadowBlur = 8;
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r); g.addColorStop(0, '#fff0b8'); g.addColorStop(0.6, '#e2c26c'); g.addColorStop(1, '#8a6a2a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = '#5a3c10'; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = 'rgba(70,44,10,.85)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.beginPath();
  ctx.moveTo(0, -r * 0.62); ctx.lineTo(0, r * 0.62); ctx.moveTo(0, -r * 0.2); ctx.lineTo(r * 0.42, -r * 0.5); ctx.moveTo(0, r * 0.1); ctx.lineTo(-r * 0.42, -r * 0.2); ctx.stroke();
  ctx.restore();
}
// Đại Ấn: viên ngọc mài cạnh trong ổ vàng
function greatRuneGem(x, y, col, on) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#2a2216'; ctx.strokeStyle = on ? '#f2dc97' : 'rgba(214,178,94,.55)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, TAU); ctx.fill(); ctx.stroke();
  if (on) {
    ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.fillStyle = col; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU - Math.PI / 2; ctx.lineTo(Math.cos(a) * 5.2, Math.sin(a) * 5.2); } ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(0, -5.2); ctx.lineTo(4.5, -2.6); ctx.lineTo(0, 0); ctx.lineTo(-4.5, -2.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.moveTo(0, 5.2); ctx.lineTo(4.5, 2.6); ctx.lineTo(0, 0); ctx.lineTo(-4.5, 2.6); ctx.closePath(); ctx.fill();
  } else { ctx.strokeStyle = 'rgba(214,178,94,.25)'; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU - Math.PI / 2; ctx.lineTo(Math.cos(a) * 4.5, Math.sin(a) * 4.5); } ctx.closePath(); ctx.stroke(); }
  ctx.restore();
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
  ctx.font = `700 13px ${FONT_U}`; ctx.textAlign = 'right'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 3;
  ctx.strokeText(String(qn), fx + fs - 3, fy + fs - 4); ctx.fillStyle = qn > 0 ? '#f4ead0' : '#9a8a70'; ctx.fillText(String(qn), fx + fs - 3, fy + fs - 4); ctx.textAlign = 'left';
  if (!G.touch) { keycap(fx + 1, fy + fs + 5, keyOf('item'), 14); ctx.font = `500 10px ${FONT_U}`; ctx.fillStyle = 'rgba(236,227,204,.55)'; ctx.fillText('đổi', fx + 19, fy + fs + 16); ctx.fillText(' ' + keyOf('itemnext'), fx + 19 + ctx.measureText('đổi').width, fy + fs + 16); }
  // vũ khí tay phải và tay trái
  const wx = fx + fs + 10, Wp = WEAPONS[S.equipped], off = offDef(), cat = catalyst();
  box(wx, fy, fs);
  drawWeaponIcon(S.equipped, wx + fs / 2, fy + fs / 2, fs);
  const ox = wx + fs + 6, os = 26;
  box(ox, fy + fs - os, os);
  if (Wp.twoHanded) { ctx.strokeStyle = 'rgba(236,227,204,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ox + 6, fy + fs - 6); ctx.lineTo(ox + os - 6, fy + fs - os + 6); ctx.stroke(); }
  else drawOffIcon(off, ox + os / 2, fy + fs - os / 2, os);
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
  // rune và Đại Ấn: dải nền mờ dần sang trái, ký hiệu rune, ba ổ ngọc
  const rx = CW - 20, ry = G.touch ? 32 : CH - 26;
  ctx.font = `600 18px ${FONT_U}`; ctx.textAlign = 'right';
  const rstr = S.runes.toLocaleString(numLoc()), tw = ctx.measureText(rstr).width, dx = rx - tw - 16, dy = ry - 6;
  { const bw = tw + 130, g = ctx.createLinearGradient(rx + 12 - bw, 0, rx + 12, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.45, 'rgba(8,7,5,.6)'); g.addColorStop(1, 'rgba(8,7,5,.72)');
    ctx.fillStyle = g; ctx.fillRect(rx + 12 - bw, dy - 15, bw, 30);
    const l = ctx.createLinearGradient(rx + 12 - bw, 0, rx + 12, 0); l.addColorStop(0, 'rgba(214,178,94,0)'); l.addColorStop(1, 'rgba(214,178,94,.5)');
    ctx.fillStyle = l; ctx.fillRect(rx + 12 - bw, dy - 15, bw, 1); ctx.fillRect(rx + 12 - bw, dy + 14, bw, 1); }
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(rstr, rx + 1, ry + 2); ctx.fillStyle = '#f4ead0'; ctx.fillText(rstr, rx, ry);
  runeGlyph(dx, dy, 7.5);
  if (G.runeGain > 0) { ctx.font = `600 14px ${FONT_U}`; ctx.fillStyle = `rgba(242,220,151,${Math.min(1, G.runeGainT)})`; ctx.fillText('+' + G.runeGain.toLocaleString(numLoc()), rx, ry + (G.touch ? 26 : -26)); }
  ctx.textAlign = 'left';
  ['east', 'swamp', 'west'].forEach((id, i) => greatRuneGem(dx - 30 - (2 - i) * 19, dy, GREAT_RUNES[id].col, S.gr.includes(id)));
  // lời nhắc tương tác: khung tối viền vàng, hai hạt kim cương hai đầu, phím dạng nắp phím
  if (G.prompt && G.mode === 'play') {
    const txt = G.prompt.text, py = CH * (G.touch ? 0.56 : 0.7);
    ctx.font = `500 15px ${FONT_U}`;
    const kw = G.prompt.key ? 30 : 0, w = ctx.measureText(txt).width + kw + 36, x0 = CW / 2 - w / 2;
    const g = ctx.createLinearGradient(0, py - 20, 0, py + 12); g.addColorStop(0, 'rgba(30,25,17,.92)'); g.addColorStop(1, 'rgba(8,7,5,.92)');
    ctx.fillStyle = g; ctx.fillRect(x0, py - 20, w, 32);
    ctx.strokeStyle = 'rgba(214,178,94,.6)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, py - 19.5, w - 1, 31);
    ctx.strokeStyle = 'rgba(214,178,94,.15)'; ctx.strokeRect(x0 + 3.5, py - 16.5, w - 7, 25);
    for (const ex of [x0, x0 + w]) { ctx.save(); ctx.translate(ex, py - 4); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#15120c'; ctx.fillRect(-3.5, -3.5, 7, 7); ctx.strokeStyle = '#f2dc97'; ctx.strokeRect(-3.5, -3.5, 7, 7); ctx.restore(); }
    let px = x0 + 18;
    if (G.prompt.key) px += keycap(px, py - 13, G.prompt.key, 18) + 10;
    ctx.font = `500 15px ${FONT_U}`; ctx.fillStyle = '#f0e6cc'; ctx.fillText(txt, px, py + 1);
  }
  // thanh máu boss
  let subY = CH - 110;
  const hb = G.finalFight && fb && !fb.dead ? fb : G.bossFight && boss && boss.state !== 'dormant' ? boss : G.dragonFight && dragon && !dragon.dead ? dragon
    : enemies.find(e => e.T.bar && !e.dead && e.state !== 'idle' && e.state !== 'return' && dist(P.x, P.y, e.x, e.y) < 700) || null;
  if (hb) {
    const bw = Math.min(CW - 48, 640), bx = (CW - bw) / 2, by = G.touch ? CH - 250 : CH - 60;
    { const g = ctx.createLinearGradient(bx - 20, 0, bx + bw + 20, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.15, 'rgba(0,0,0,.45)'); g.addColorStop(0.85, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(bx - 20, by - 36, bw + 40, 56); }
    ctx.font = `600 ${CW < 500 ? 17 : 21}px ${FONT_D}`; ctx.fillStyle = 'rgba(0,0,0,.8)'; ctx.fillText(hb.name, bx + 1, by - 11);
    ctx.fillStyle = '#f2ead6'; ctx.fillText(hb.name, bx, by - 12);
    { const nw = ctx.measureText(hb.name).width, l = ctx.createLinearGradient(bx + nw + 10, 0, bx + nw + 120, 0); l.addColorStop(0, 'rgba(214,178,94,.6)'); l.addColorStop(1, 'rgba(214,178,94,0)'); ctx.fillStyle = l; ctx.fillRect(bx + nw + 10, by - 18, 110, 1); }
    bar(bx, by, bw, 10, hb.hp / hb.maxHp, (hb.ghost ?? hb.hp) / hb.maxHp, '#8e1c16');
    subY = by - 50;
  } else if (G.touch) subY = CH > CW ? CH - 280 : CH - 34;
  // phụ đề
  if (G.sub) {
    const a = Math.min(1, G.sub.t * 3, (G.sub.dur - G.sub.t) * 2);
    ctx.globalAlpha = a * 0.9; bandBG(subY - 6, 44, 0.55, false); ctx.globalAlpha = a;
    wrapText(G.sub.text, CW / 2, subY, G.touch && CW > CH ? CW * 0.42 : Math.min(CW - 40, 640), 24, `500 italic ${CW < 500 ? 18 : 21}px ${FONT_I}`, '#f1e8d0');
    ctx.globalAlpha = 1;
  }
  drawAchPopup(1 / 60);
  if (G.toast) {
    const a = Math.min(1, G.toast.t * 4, (G.toast.dur - G.toast.t) * 2);
    const ty = CH * (G.touch ? 0.5 : 0.62);
    ctx.globalAlpha = a; ctx.font = `500 14px ${FONT_U}`;
    const tw2 = Math.min(Math.min(CW - 40, 560), ctx.measureText(G.toast.text).width) + 70, g = ctx.createLinearGradient(CW / 2 - tw2 / 2, 0, CW / 2 + tw2 / 2, 0);
    g.addColorStop(0, 'rgba(8,7,5,0)'); g.addColorStop(0.2, 'rgba(8,7,5,.75)'); g.addColorStop(0.8, 'rgba(8,7,5,.75)'); g.addColorStop(1, 'rgba(8,7,5,0)');
    const lines = Math.max(1, Math.ceil(ctx.measureText(G.toast.text).width / Math.min(CW - 40, 560)));
    ctx.fillStyle = g; ctx.fillRect(CW / 2 - tw2 / 2, ty - 17 - (lines - 1) * 19, tw2, 26 + (lines - 1) * 19);
    ornLine(CW / 2, ty - 17 - (lines - 1) * 19, tw2 * 0.8, 0.8);
    wrapText(G.toast.text, CW / 2, ty, Math.min(CW - 40, 560), 19, `500 14px ${FONT_U}`, '#f2dc97'); ctx.globalAlpha = 1;
  }
  // tên vùng
  if (G.region && G.regionT < 4 && G.mode === 'play') {
    const a = Math.min(1, G.regionT * 1.5, (4 - G.regionT) * 1.2);
    ctx.globalAlpha = a;
    const fs2 = CW < 500 ? 24 : 32;
    const ry2 = CH * (G.touch ? 0.32 : 0.24);
    ctx.font = spacedFont(fs2); const w = ctx.measureText(G.region).width;
    bandBG(ry2 - fs2 * 0.3, fs2 * 2.4, 0.45, false);
    goldText(G.region, CW / 2, ry2, spacedFont(fs2), 0.25, ['#fffaf0', '#efe4c8', '#bba77e']);
    ornLine(CW / 2, ry2 + 13, w + 120 * Math.min(1, G.regionT * 1.2));
    ctx.globalAlpha = 1;
  }
  drawMarkerGuide();
  if (G.banner) drawBanner(G.banner);
  if (G.mode === 'dead') drawDeath();
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
    else { img.data[i] = 34; img.data[i + 1] = 27; img.data[i + 2] = 18; img.data[i + 3] = 255; }
  }
  m.putImageData(img, 0, 0);
  return maskCanvas;
}
const MAP_LABELS = [['Pháo Đài Greystone', 3600, 900], ['Rừng Wraithwood', 3650, 2180], ['Đấu Trường Bloodsand', 3600, 3230], ['Cao Nguyên Cinderreach', 3700, 1580], ['Đồng Cỏ Mistveil', 1400, 2620],
  ['Tàn Tích Hollowmere', 700, 1900], ['Đầm Lầy Ashmire', 2420, 1520], ['Cổng Gác Thornwall', 1400, 760], ['Nhà Nguyện Dawnrest', 1400, 3480], ['Hồ Crystalmere', -1400, 1500], ['Bờ Biển Saltreach', -1300, 3300],
  ['Học Viện Starhollow', -1550, -300], ['Cao Nguyên Aurelia', 2200, -100], ['Sườn Núi Goldspire', 3500, -1400], ['Kinh Thành Aurumhold', 1400, -1300], ['Cây Aurum', 1400, -1720]];
// ── biểu tượng trên bản đồ ──
function mapGrace(x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(255,215,110,.28)'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffe9a8'; ctx.strokeStyle = '#5a3c10'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.quadraticCurveTo(4.5, -1, 0, 4); ctx.quadraticCurveTo(-4.5, -1, 0, -7); ctx.fill(); ctx.stroke(); ctx.restore();
}
function mapDungeon(x, y, done, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = done ? '#9a9080' : '#e0d0a8'; ctx.strokeStyle = '#2a1e10'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-6, 5); ctx.lineTo(-6, -1); ctx.quadraticCurveTo(0, -9, 6, -1); ctx.lineTo(6, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a1208'; ctx.beginPath(); ctx.moveTo(-3, 5); ctx.lineTo(-3, 0); ctx.quadraticCurveTo(0, -4.5, 3, 0); ctx.lineTo(3, 5); ctx.closePath(); ctx.fill(); ctx.restore();
}
function mapStele(x, y, a = 1, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
  ctx.fillStyle = '#bcd7ff'; ctx.shadowColor = '#bcd7ff'; ctx.shadowBlur = 8; ctx.strokeStyle = '#1a2a40'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-4, 5); ctx.lineTo(-3, -5); ctx.lineTo(0, -8); ctx.lineTo(3, -5); ctx.lineTo(4, 5); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke(); ctx.restore();
}
function mapPlayer(x, y, a) {
  const pulse = 1 + Math.sin(G.clock * 6) * 0.12;
  ctx.strokeStyle = 'rgba(255,90,60,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 10 * pulse, 0, TAU); ctx.stroke();
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.fillStyle = '#e0503c'; ctx.strokeStyle = '#fff6e0'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-2.5, 0); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
// khung giấy da: hai đường viền vàng, hoa văn góc hình thoi và bóng tối quanh mép
function mapFrame(x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - 12, y - 12, w + 24, h + 24);
  ctx.strokeStyle = 'rgba(214,178,94,.75)'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 8.5, y - 8.5, w + 17, h + 17);
  ctx.strokeStyle = 'rgba(214,178,94,.35)'; ctx.lineWidth = 1; ctx.strokeRect(x - 4.5, y - 4.5, w + 9, h + 9);
  for (const [cx, cy] of [[x - 8.5, y - 8.5], [x + w + 8.5, y - 8.5], [x - 8.5, y + h + 8.5], [x + w + 8.5, y + h + 8.5]]) {
    ctx.fillStyle = '#1a150e'; ctx.strokeStyle = '#d6b25e'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx, cy - 7); ctx.lineTo(cx + 7, cy); ctx.lineTo(cx, cy + 7); ctx.lineTo(cx - 7, cy); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d6b25e'; ctx.beginPath(); ctx.arc(cx, cy, 1.8, 0, TAU); ctx.fill();
  }
  for (const [cx, cy] of [[x + w / 2, y - 8.5], [x + w / 2, y + h + 8.5]]) { ctx.fillStyle = '#d6b25e'; ctx.beginPath(); ctx.moveTo(cx, cy - 4); ctx.lineTo(cx + 4, cy); ctx.lineTo(cx, cy + 4); ctx.lineTo(cx - 4, cy); ctx.closePath(); ctx.fill(); }
}
function mapCompass(x, y, r) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(30,22,12,.55)'; ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(214,178,94,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  for (let k = 0; k < 4; k++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = k === 3 ? '#f0d27a' : '#a08a5a'; ctx.beginPath(); ctx.moveTo(0, -r + 2); ctx.lineTo(4, 0); ctx.lineTo(0, 3); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  textC('B', x, y - r - 7, `700 11px ${FONT_D}`, '#f0d27a', 0.9);
}
function drawMap() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const bg = ctx.createRadialGradient(CW / 2, CH / 2, 40, CW / 2, CH / 2, Math.max(CW, CH) * 0.7);
  bg.addColorStop(0, 'rgba(30,24,15,.97)'); bg.addColorStop(1, 'rgba(6,5,3,.99)'); ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH);
  const small = CW < 500, MW = MAPW - WX0, MH = H - WY0, top = small ? 56 : 66, bottom = small ? 46 : 62;
  const sc = Math.min((CW - 44) / MW, (CH - top - bottom) / MH), mw = MW * sc, mh = MH * sc, mx = (CW - mw) / 2, my = top;
  // tiêu đề có hai đường hoa văn hai bên
  const tw = small ? 60 : 90;
  textC('Bản đồ', CW / 2, top - 22, spacedFont(small ? 24 : 30, 700), '#f0e2c0');
  ctx.strokeStyle = 'rgba(214,178,94,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(CW / 2 - tw - 60, top - 30); ctx.lineTo(CW / 2 - tw, top - 30); ctx.moveTo(CW / 2 + tw, top - 30); ctx.lineTo(CW / 2 + tw + 60, top - 30); ctx.stroke();
  mapFrame(mx, my, mw, mh);
  // nền bản đồ nhuộm màu giấy da
  ctx.drawImage(GROUND, 0, 0, MW / 2, MH / 2, mx, my, mw, mh);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.55; ctx.fillStyle = '#d4b47c'; ctx.fillRect(mx, my, mw, mh); ctx.restore();
  ctx.fillStyle = 'rgba(70,52,24,.14)'; ctx.fillRect(mx, my, mw, mh);
  const pt = (x, y) => [mx + (x - WX0) * sc, my + (y - WY0) * sc];
  G.mapRect = { mx, my, mw, mh, sc };
  ctx.fillStyle = '#2a2016';
  for (const w of WALLS) if (!w.void && !w.sea && w.x < MAPW && (wallOn(w, false) || w.gate === 'colo' || w.gate === 'dg')) { const [x, y] = pt(w.x, w.y); ctx.fillRect(x, y, Math.max(1.5, w.w * sc), Math.max(1.5, w.h * sc)); }
  // lưới tọa độ mờ
  ctx.strokeStyle = 'rgba(60,44,22,.16)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let gx = Math.ceil(WX0 / 600) * 600; gx < MAPW; gx += 600) { const [x] = pt(gx, 0); ctx.moveTo(x, my); ctx.lineTo(x, my + mh); }
  for (let gy = Math.ceil(WY0 / 600) * 600; gy < H; gy += 600) { const [, y] = pt(0, gy); ctx.moveTo(mx, y); ctx.lineTo(mx + mw, y); }
  ctx.stroke();
  ctx.imageSmoothingEnabled = true; ctx.drawImage(mapMask(), mx, my, mw, mh);
  // mép giấy tối dần vào trong như tấm bản đồ cũ
  { const vg = ctx.createRadialGradient(mx + mw / 2, my + mh / 2, Math.min(mw, mh) * 0.35, mx + mw / 2, my + mh / 2, Math.hypot(mw, mh) * 0.55); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(12,8,4,.5)'); ctx.fillStyle = vg; ctx.fillRect(mx, my, mw, mh); }
  // Cây Aurum: tán vàng và thân
  { const [x, y] = pt(TREE_POS.x, TREE_POS.y); const gr = ctx.createRadialGradient(x, y, 1, x, y, 16); gr.addColorStop(0, 'rgba(255,230,140,.9)'); gr.addColorStop(1, 'rgba(255,214,110,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.strokeStyle = '#5a3c10'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y - 2, 5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#6a4a1a'; ctx.fillRect(x - 1, y + 2, 2, 5); }
  // cỡ chữ theo kích thước bản đồ; nhãn nào đè lên nhãn đã vẽ thì bỏ qua để khỏi rối
  const fs = Math.round(clamp(mw / 62, 9.5, 14)), placed = [];
  ctx.font = `600 ${fs}px ${FONT_D}`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  for (const [n, x, y] of MAP_LABELS) {
    if (!revealedAt(x, y)) continue; const [px, py] = pt(x, y), hw = ctx.measureText(n).width / 2 + 3;
    if (placed.some(r => Math.abs(r[0] - px) < r[1] + hw && Math.abs(r[2] - py) < fs + 2)) continue;
    placed.push([px, hw, py]); ctx.strokeStyle = 'rgba(24,16,8,.85)'; ctx.lineWidth = 3; ctx.strokeText(n, px, py); ctx.fillStyle = '#f4e6c4'; ctx.fillText(n, px, py);
  }
  ctx.textAlign = 'left';
  for (const d of DUNGEONS) { if (!revealedAt(d.ex, d.ey)) continue; const [x, y] = pt(d.ex, d.ey); mapDungeon(x, y, S.dg[d.id]); }
  for (const g of GRACES) { if (!S.discovered.includes(g.id) || g.x > MAPW) continue; const [x, y] = pt(g.x, g.y); mapGrace(x, y); }
  for (const c of CHESTS) if (S.chests.includes(c.id) && c.x < MAPW) { const [x, y] = pt(c.x, c.y); ctx.fillStyle = 'rgba(140,100,55,.95)'; ctx.strokeStyle = '#2a1e10'; ctx.lineWidth = 0.8; ctx.fillRect(x - 3, y - 2, 6, 4.5); ctx.strokeRect(x - 3, y - 2, 6, 4.5); }
  // bia bản đồ chưa đọc ở những nơi đã đi qua: đánh dấu để người chơi quay lại
  for (const f of MAP_FRAGS) { if (S.frags.includes(f.id) || !revealedAt(f.x, f.y)) continue; const [x, y] = pt(f.x, f.y); mapStele(x, y, 0.7 + Math.sin(G.clock * 4) * 0.3); }
  if (!S.frags.length) textC('Bản đồ còn trống. Hãy tìm những Bia Bản Đồ phát sáng xanh để phác họa từng vùng.', CW / 2, my + 24, `500 ${small ? 11 : 13}px ${FONT_U}`, '#cfe4ff', 0.9);
  if (S.lost && S.lost.x < MAPW) { const [x, y] = pt(S.lost.x, S.lost.y); ctx.fillStyle = 'rgba(157,255,184,.3)'; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#9dffb8'; ctx.strokeStyle = '#123a1e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); ctx.stroke(); }
  if (S.marker) { const [x, y] = pt(S.marker.x, S.marker.y); drawMarkerIcon(x, y, 1); }
  mapCompass(mx + mw - (small ? 22 : 30), my + (small ? 26 : 36), small ? 12 : 17);
  const dg = dungeonAt(P.x, P.y), inMain = P.x < 4800, mpx = inMain ? P.x : dg ? dg.ex : null, mpy = inMain ? P.y : dg ? dg.ey : null;
  if (mpx !== null) { const [px, py] = pt(mpx, mpy); mapPlayer(px, py, P.face); }
  else textC('Ngươi đang ở ngoài thế giới thường', CW / 2, my + 46, `500 13px ${FONT_U}`, '#f2dc97');
  // chú thích biểu tượng
  if (!small) {
    const ly = my + mh + 26, items = [['grace', 'Ân Điển'], ['dg', 'Hầm ngục'], ['stele', 'Bia chưa đọc'], ['lost', 'Rune đánh rơi'], ['mark', 'Dấu của ngươi'], ['you', 'Ngươi']];
    ctx.font = `500 12px ${FONT_U}`;
    let total = 0; const ws = items.map(([, t]) => ctx.measureText(t).width + 34); total = ws.reduce((a, b) => a + b, 0);
    let lx = CW / 2 - total / 2;
    items.forEach(([k, t], i) => {
      const ix = lx + 8;
      if (k === 'grace') mapGrace(ix, ly - 2, 0.9); else if (k === 'dg') mapDungeon(ix, ly - 2, false, 0.9); else if (k === 'stele') mapStele(ix, ly - 1, 1, 0.9);
      else if (k === 'lost') { ctx.fillStyle = '#9dffb8'; ctx.beginPath(); ctx.arc(ix, ly - 3, 4, 0, TAU); ctx.fill(); }
      else if (k === 'mark') drawMarkerIcon(ix, ly + 4, 0.7); else { ctx.save(); ctx.translate(ix, ly - 3); ctx.fillStyle = '#e0503c'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-4, -5); ctx.lineTo(-2, 0); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = 'rgba(236,227,204,.8)'; ctx.fillText(t, lx + 20, ly + 1); lx += ws[i];
    });
  }
  textC(G.touch ? 'Chạm vào bản đồ để đặt dấu · chạm ra ngoài để đóng' : 'Bấm vào bản đồ để đặt / gỡ dấu · G / Esc để đóng', CW / 2, CH - 12, `500 12px ${FONT_U}`, 'rgba(236,227,204,.6)');
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
  ctx.font = font; str = tr(str); // dịch cả câu trước khi ngắt dòng
  const words = str.split(' '), lines = [];
  let line = '';
  for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line);
  lines.forEach((l, i) => textC(l, cx, y + i * lh - (lines.length - 1) * lh, font, col, 0.9));
}
// như wrapText nhưng các dòng xếp từ trên xuống, bắt đầu ở y
function wrapDown(str, cx, y, maxW, lh, font, col) {
  ctx.font = font; str = tr(str);
  const words = str.split(' '), lines = [];
  let line = '';
  for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line);
  lines.forEach((l, i) => textC(l, cx, y + i * lh, font, col, 0.9));
}
function drawBanner(b) {
  const a = Math.min(1, b.t * 2, (b.dur - b.t) * 1.2), cy = CH * 0.42, small = CW < 520;
  ctx.globalAlpha = a;
  bandBG(cy - 4, small ? 84 : 104, 0.7);
  if (b.kind === 'felled') {
    // chữ vàng nở ra chậm, quầng sáng mạnh như lúc hạ boss trong game souls
    const sc = 1 + b.t * 0.02;
    ctx.save(); ctx.translate(CW / 2, cy); ctx.scale(sc, sc);
    goldText(b.title, 0, 14, spacedFont(small ? 28 : 50, 700), 0.8);
    ctx.restore();
  } else if (b.kind === 'invade') {
    goldText(b.title, CW / 2, cy + 4, spacedFont(small ? 26 : 42, 700), 0.6, ['#ffd2c6', '#ff6a55', '#8a1c14']);
    textC(b.sub, CW / 2, cy + 32, `500 14px ${FONT_U}`, '#f3c8bd');
  } else if (b.kind === 'grace') {
    goldText(b.title, CW / 2, cy + 4, spacedFont(small ? 24 : 38, 700), 0.55);
    ornLine(CW / 2, cy + 16, small ? 180 : 280);
    textC(b.sub, CW / 2, cy + 36, `500 14px ${FONT_U}`, '#ece3cc');
  } else {
    if (b.title !== 'Nhận được') textC('Nhận được', CW / 2, cy - 24, `600 11px ${FONT_U}`, '#c9b27a');
    goldText(b.title, CW / 2, cy + 6, spacedFont(small ? 24 : 32, 700), 0.3, ['#fffaf0', '#efe4c8', '#bba77e']);
    ornLine(CW / 2, cy + 16, small ? 160 : 240, 0.8);
    wrapText(b.sub, CW / 2, cy + 36, Math.min(CW - 40, 760), 18, `500 14px ${FONT_U}`, '#f2dc97');
  }
  ctx.globalAlpha = 1;
}
function drawDeath() {
  const t = G.deathT;
  if (t < 0.8) return;
  const a = Math.min(1, (t - 0.8) * 1.2) * Math.min(1, (4.6 - t) * 1.5);
  ctx.globalAlpha = a;
  const cy = CH * 0.45;
  const bh = G.killer ? 130 : 80, band = ctx.createLinearGradient(0, cy - 80, 0, cy + bh);
  band.addColorStop(0, 'rgba(0,0,0,0)'); band.addColorStop(0.35, 'rgba(0,0,0,.85)'); band.addColorStop(0.75, 'rgba(0,0,0,.8)'); band.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = band; ctx.fillRect(0, cy - 80, CW, 80 + bh);
  const sc = 1 + (t - 0.8) * 0.03;
  ctx.save(); ctx.translate(CW / 2, cy); ctx.scale(sc, sc);
  goldText('BẠN ĐÃ CHẾT', 0, 18, spacedFont(CW < 520 ? 44 : 72, 700), 0.5, ['#e0503c', '#a3201c', '#5a0c08']);
  ctx.restore();
  // ai đã hạ ngươi, kèm mẹo đối phó lấy từ Sổ tay quái vật
  const K = G.killer;
  if (K && t > 1.4) {
    ctx.globalAlpha = a * Math.min(1, (t - 1.4) * 2);
    textC('Bị hạ bởi ' + K.name, CW / 2, cy + 58, `600 ${CW < 520 ? 14 : 16}px ${FONT_U}`, '#e8d8c0');
    const hint = K.id === 'poison' ? 'Mang theo Thuốc Giải Độc, và đừng đứng lâu trong vũng độc.' : BEAST_HINT[K.id];
    if (hint) wrapDown(hint, CW / 2, cy + 84, Math.min(CW - 60, 620), 21, `500 italic ${CW < 520 ? 15 : 17}px ${FONT_I}`, '#cdbf9f');
  }
  ctx.globalAlpha = 1;
}

// ───────────────────────── menu HTML ─────────────────────────
const UI = { slots: $('slots'), settings: $('settings'), title: $('title'), pause: $('pause'), grace: $('grace'), ending: $('ending'), shop: $('shop'), cls: $('cls'), board: $('board'), name: $('name'), lore: $('lore'), controls: $('controlsBox'), diff: $('diffSel'), ach: $('achBox') };
const STAT_INFO = [
  ['vig', 'Tăng máu tối đa'], ['mnd', 'Tăng FP'], ['end', 'Tăng thể lực và sức mang vác'],
  ['str', 'Vũ khí nặng, sát thương theo Sức Mạnh'], ['dex', 'Vũ khí nhanh, cung, theo Khéo Léo'],
  ['int', 'Phép Trí Tuệ (dùng gậy)'], ['fai', 'Phép Đức Tin (dùng ấn)'],
];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function setMode(m) {
  G.mode = m;
  if (m !== 'play') { $('tut').hidden = true; hintCur = null; }
  if (typeof applyRot === 'function') applyRot();
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
  $('lvRunes').textContent = (n ? left : S.runes).toLocaleString(numLoc());
  $('lvCost').textContent = next.toLocaleString(numLoc());
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
  $('btnLvOk').textContent = n ? `Xác nhận · ${n} cấp · ${cost.toLocaleString(numLoc())} rune` : 'Xác nhận';
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
const TABS = ['level', 'gear', 'inv', 'spell', 'flask', 'travel', 'beast'];
function selectTab(which) { graceTab = which; renderGraceTabsOnly(); if (which === 'beast') renderBeast(); }
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
  $('shopRunes').textContent = S.runes.toLocaleString(numLoc());
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
      return `<li><button data-up="${w}" ${ok ? '' : 'disabled'}><span>${esc(Wp.name)} +${lv} → +${need.lv}<br><small>${Wp.sp ? 'Phép' : 'Công'} ${now} → ${nxt} · cần ${ITEMDEF[need.mat].name} ×${need.n} (có ${invN(need.mat)}) và ${need.runes.toLocaleString(numLoc())} rune</small></span><small>Rèn</small></button></li>`;
    }).join('');
    return;
  }
  const sh = SHOPS[id];
  $('shopName').textContent = sh.name; $('shopLine').textContent = sh.line;
  $('shopList').innerHTML = sh.stock.map((r, i) => {
    const info = shopRow(r), can = !info.sold && !info.locked && S.runes >= r.price;
    const tail = info.sold ? 'Đã có' : info.locked ? (r.lock || 'Chưa mở') : r.price.toLocaleString(numLoc()) + ' rune';
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
  if (!UI.lore.hidden || !UI.controls.hidden || !UI.ach.hidden || !UI.settings.hidden || !UI.slots.hidden) { closeInfo(); return; }
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
  UI.lore.hidden = true; UI.controls.hidden = true; UI.ach.hidden = true; UI.settings.hidden = true; UI.slots.hidden = true; G.rebind = null;
  if (infoBack) { infoBack.hidden = false; const b = infoBack.querySelector('.mbtn:not([hidden]),.pbtn'); if (b) b.focus({ preventScroll: true }); }
  infoBack = null;
}
$('btnLore').onclick = () => openInfo(UI.lore, UI.title);
// ───────────────────────── gợi ý phím theo tình huống: mỗi loại chỉ hiện một lần, lúc cần tới ─────────────────────────
// [mã, điều kiện, tiêu đề, phím trên máy tính, cách làm trên điện thoại]
const HINTS = [
  ['fight', () => enemies.some(e => !e.dead && e.state === 'chase' && dist(e.x, e.y, P.x, P.y) < 260), 'Kẻ địch đang lao tới',
    '<kbd>Chuột trái</kbd> đánh · <kbd>Shift</kbd>+<kbd>Chuột trái</kbd> đánh mạnh · <kbd data-k="roll">Space</kbd> lăn né', 'Chạm nút Đánh để tấn công, nút Lăn để né'],
  ['guard', () => S.tips.fight && enemies.some(e => !e.dead && e.state === 'atk' && dist(e.x, e.y, P.x, P.y) < 130), 'Đỡ đòn',
    'Giữ <kbd>Chuột phải</kbd> để giơ khiên; giơ đúng lúc đòn chạm tới sẽ phản đòn', 'Giữ nút Đỡ để chặn đòn'],
  ['riposte', () => enemies.some(e => !e.dead && e.state === 'broken' && dist(e.x, e.y, P.x, P.y) < 140), 'Kẻ địch mất thế',
    'Lại gần và bấm <kbd>Chuột trái</kbd> để tung đòn chí mạng', 'Lại gần và chạm nút Đánh để tung đòn chí mạng'],
  ['heal', () => P.hp < P.maxHp * 0.5 && P.flasks > 0, 'Máu còn một nửa', 'Nhấn <kbd data-k="item">R</kbd> để uống Bình Máu', 'Chạm nút Dùng đồ để uống Bình Máu'],
  ['stamina', () => P.st < P.maxSt * 0.2, 'Sắp hết thể lực', 'Hết thể lực thì không lăn hay đánh được. Lùi lại một nhịp cho thể lực hồi', 'Hết thể lực thì không lăn hay đánh được. Lùi lại một nhịp cho thể lực hồi'],
  ['grace', () => !!nearGrace() && S.discovered.length >= 2, 'Ân Điển', 'Nhấn <kbd data-k="interact">E</kbd> để nghỉ: hồi máu, nạp bình và lên cấp', 'Chạm nút Tương tác để nghỉ: hồi máu, nạp bình và lên cấp'],
  ['level', () => S.runes >= levelCost(), 'Đủ rune để lên cấp', 'Nghỉ ở Ân Điển (<kbd data-k="interact">E</kbd>) để tăng chỉ số', 'Nghỉ ở Ân Điển để tăng chỉ số'],
  ['lost', () => !!S.lost, 'Rune đã rơi', 'Rune rơi lại nơi ngươi chết. Quay lại chạm vào đốm sáng xanh để lấy lại; chết lần nữa là mất hẳn', 'Rune rơi lại nơi ngươi chết. Quay lại chạm vào đốm sáng xanh để lấy lại'],
  ['inv', () => S.weapons.length + S.armors.length + S.tals.length > (G.gear0 || 99), 'Có trang bị mới', 'Nhấn <kbd data-k="inv">I</kbd> để mở hành trang và trang bị', 'Chạm nút Hành trang để trang bị'],
  ['map', () => S.frags.length > 0, 'Bản đồ', 'Nhấn <kbd data-k="map">G</kbd> để xem bản đồ; bấm lên bản đồ để đặt dấu', 'Chạm nút Bản đồ để xem; chạm lên bản đồ để đặt dấu'],
];
let hintCur = null, hintT = 0;
function updateHints(dt) {
  if (hintCur && hintCur !== 'heal' && !S.tips.heal && P.hp < P.maxHp * 0.5 && P.flasks > 0) { hintCur = null; hintT = 0; } // máu thấp thì ưu tiên gợi ý uống bình
  if (hintCur) {
    hintT -= dt;
    if (hintT <= 0 || G.mode !== 'play') { hintCur = null; $('tut').hidden = true; }
    return;
  }
  if (G.mode !== 'play' || G.hintT < 3 || P.state === 'dead') return;
  for (const [id, test, title, pc, touch] of HINTS) {
    if (S.tips[id]) continue;
    let ok = false; try { ok = test(); } catch (e) { ok = false; }
    if (!ok) continue;
    S.tips[id] = 1; hintCur = id; hintT = 6;
    $('tutText').textContent = title; $('tutKeys').innerHTML = G.touch ? touch : pc; refreshKbd($('tutKeys')); $('tut').hidden = false;
    SFX.glint(); return;
  }
}
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
  ['bestiary', 'Nhà Nghiên Cứu Quái Vật', 'Ghi chép 30 loài trong Sổ tay quái vật', () => Object.keys(S.kills || {}).filter(k => BEAST_ORDER.includes(k)).length >= 30],
  ['wilds', 'Chúa Tể Miền Hoang', 'Hạ Karkos, Veyl và Aurion ở hồ, bờ biển và sườn núi', () => S.mb.crabking && S.mb.admiral && S.mb.ramking],
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
  const a = Math.min(1, A.t * 4, (4 - A.t) * 2), w = Math.min(310, CW - 32), x = CW - w - 16 + (1 - Math.min(1, A.t * 5)) * 30, h = 54;
  // trên điện thoại đặt dưới hàng nút phụ để khỏi che nút
  const tb = G.touch && $('topBtns'), y = tb && tb.offsetHeight ? tb.offsetTop + tb.offsetHeight + 8 : 72;
  ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgba(34,28,18,.95)'); g.addColorStop(1, 'rgba(10,9,7,.92)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(214,178,94,.7)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeStyle = 'rgba(214,178,94,.15)'; ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
  // huy chương: vòng vàng có ngôi sao, quầng sáng nhấp nháy khi vừa hiện
  const mx = x + 28, my = y + h / 2;
  ctx.shadowColor = 'rgba(255,210,110,.8)'; ctx.shadowBlur = 8 + Math.max(0, 1 - A.t) * 16;
  const mg = ctx.createRadialGradient(mx - 4, my - 4, 1, mx, my, 15); mg.addColorStop(0, '#fff0b8'); mg.addColorStop(0.6, '#d6b25e'); mg.addColorStop(1, '#7a5a20');
  ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, 14, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = '#4a3208'; ctx.stroke(); ctx.beginPath(); ctx.arc(mx, my, 10.5, 0, TAU); ctx.strokeStyle = 'rgba(74,50,8,.6)'; ctx.stroke();
  ctx.fillStyle = '#5a3c10'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 3 : 7, an = k / 10 * TAU - Math.PI / 2; ctx.lineTo(mx + Math.cos(an) * r, my + Math.sin(an) * r); } ctx.closePath(); ctx.fill();
  ctx.font = `600 10px ${FONT_U}`; ctx.fillStyle = '#d6b25e'; ctx.fillText('THÀNH TỰU MỞ KHÓA', x + 52, y + 21);
  ctx.font = `600 17px ${FONT_D}`; ctx.fillStyle = '#f2ead6'; ctx.fillText(A.name, x + 52, y + 41); ctx.globalAlpha = 1;
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
  G.gear0 = S.weapons.length + S.armors.length + S.tals.length;
  setDiff(S.diff); setupCycleNotes(); G.invader = null; G.invCd = 0; G.endingCounted = !!data && S.finalDead;
  S.flaskMax = Math.min(S.flaskMax, FLASK_CAP);
  expDecode(S.explored);
  if (isTouchDev()) goLandscape();
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
// điện thoại: bật toàn màn hình và khóa màn ngang (Android hỗ trợ; iPhone phải tự xoay máy)
function goLandscape() {
  const el = document.documentElement;
  const lock = () => { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) { /* bỏ qua */ } };
  try {
    if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).then(lock, lock);
    else lock();
  } catch (e) { lock(); }
}
const isTouchDev = () => G.touch || matchMedia('(pointer:coarse)').matches;
$('btnLandscape').onclick = () => { audioInit(); goLandscape(); };
$('btnPauseFull').hidden = !isTouchDev() || !document.documentElement.requestFullscreen;
$('btnPauseFull').onclick = goLandscape;
// chế độ xoay ngang bằng CSS: dùng khi trình duyệt không cho xoay màn hình (Safari trên iPhone, Messenger, Zalo…)
var ROT_PREF = (() => { try { return localStorage.getItem('vvv-rot') !== 'off'; } catch (e) { return true; } })();
function applyRot() {
  const on = ROT_PREF && isTouchDev() && window.innerHeight > window.innerWidth && G.mode !== 'title';
  const app = $('app'), was = document.body.classList.contains('rot');
  document.body.classList.toggle('rot', on);
  app.style.width = on ? window.innerHeight + 'px' : ''; app.style.height = on ? window.innerWidth + 'px' : '';
  if (on !== was) resize();
}
window.addEventListener('resize', applyRot);
$('btnRot').hidden = !isTouchDev();
$('btnRot').textContent = 'Xoay ngang: ' + (ROT_PREF ? 'bật' : 'tắt');
$('btnRot').onclick = () => { ROT_PREF = !ROT_PREF; try { localStorage.setItem('vvv-rot', ROT_PREF ? 'on' : 'off'); } catch (e) { /* bỏ qua */ } $('btnRot').textContent = 'Xoay ngang: ' + (ROT_PREF ? 'bật' : 'tắt'); applyRot(); };
$('btnNew').onclick = () => {
  audioInit();
  if (loadSave() && !confirmNew) { confirmNew = true; $('btnNew').textContent = 'Xoá tiến trình cũ và bắt đầu?'; $('btnNew').classList.add('warn'); return; }
  openNameEntry();
};
if (loadSave()) $('btnContinue').hidden = false;
// ── ô lưu ──
let slotDelArmed = -1;
function slotSummary(i) {
  const s = loadSave(i);
  if (!s) return null;
  const c = CLASSES.find(q => q.id === s.cls) || CLASSES[0], g = GRACES.find(q => q.id === s.lastGrace), d = DIFFS[s.diff] || DIFFS.normal;
  return { a: `${esc(s.name || 'Gravebound')} · ${c.name} · Cấp ${s.level}`, b: `${d.name} · ${fmtTime(s.time || 0)} · ${s.deaths || 0} lần chết · Đại Ấn ${(s.gr || []).length}/3${s.finalDead ? ' · Đã phá đảo' : ''}`, c: g ? g.name : '' };
}
function renderSlots() {
  let h = '';
  for (let i = 0; i < SLOTS; i++) {
    const m = slotSummary(i), cur = i === SLOT;
    h += `<li class="${cur ? 'cur' : ''}"><div class="sn"><b>Ô ${i + 1}${cur ? ' · đang chọn' : ''}</b>` + (m ? `<span>${m.a}</span><span>${m.b}</span>${m.c ? `<span>${m.c}</span>` : ''}` : '<span class="empty">Trống</span>') + '</div><div class="row">'
      + (m ? `<button type="button" class="pbtn" data-play="${i}">Chơi tiếp</button><button type="button" class="pbtn ghost" data-del="${i}">${slotDelArmed === i ? 'Chắc chắn xóa?' : 'Xóa'}</button>` : `<button type="button" class="pbtn" data-fresh="${i}">Hành trình mới</button>`) + '</div></li>';
  }
  $('slotList').innerHTML = h;
}
$('btnSlots').onclick = () => { slotDelArmed = -1; renderSlots(); openInfo(UI.slots, UI.title); };
$('btnSlotsClose').onclick = () => closeInfo();
$('slotList').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.play) { const i = +b.dataset.play; setSlot(i); UI.slots.hidden = true; infoBack = null; audioInit(); startGame(loadSave(i)); return; }
  if (b.dataset.fresh) { setSlot(+b.dataset.fresh); closeInfo(); confirmNew = false; openNameEntry(); return; }
  if (b.dataset.del) {
    const i = +b.dataset.del;
    if (slotDelArmed !== i) { slotDelArmed = i; renderSlots(); return; }
    deleteSave(i); slotDelArmed = -1; renderSlots(); $('btnContinue').hidden = !loadSave(); toast('Đã xóa ô lưu ' + (i + 1));
  }
};
window.addEventListener('pagehide', () => { if (G.mode !== 'title') save(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode === 'play') togglePause(); });

spawnEnemies();
boss = makeBoss(1);
dragon = makeDragon();
requestAnimationFrame(frame);
