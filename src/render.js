'use strict';
// Gravebound — Vẽ thế giới, ánh sáng và thời tiết
// ───────────────────────── vẽ ─────────────────────────
let VIEW = { x0: 0, y0: 0, x1: 0, y1: 0 };
const inView = (x, y, m) => x > VIEW.x0 - m && x < VIEW.x1 + m && y > VIEW.y0 - m && y < VIEW.y1 + m;
function shadow(x, y, rx, ry, a = 0.35) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); }
function weaponAngle(phase, k, swing) {
  const e = 1 - Math.pow(1 - clamp(k, 0, 1), 2);
  if (phase === 'wind') return lerp(0.6, 1.8 * swing, e);
  if (phase === 'act') return lerp(1.8 * swing, -1.3 * swing, clamp(k, 0, 1));
  if (phase === 'rec') return lerp(-1.3 * swing, 0.6, e);
  return 0.6;
}
const OL = 'rgba(10,8,6,.85)';
// nét có viền tối: vẽ nét đen dày hơn trước rồi nét màu lên trên, kèm một vệt sáng mảnh
function olLine(x0, y0, x1, y1, w, col) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = OL; ctx.lineWidth = w + 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,245,220,.28)'; ctx.lineWidth = Math.max(0.6, w * 0.3); ctx.beginPath(); ctx.moveTo(x0, y0 - w * 0.25); ctx.lineTo(x1, y1 - w * 0.25); ctx.stroke();
  ctx.lineCap = 'butt';
}
// màu sáng / tối hơn của một màu (có bộ nhớ đệm để khỏi tạo chuỗi mới mỗi khung hình)
const TONES = new Map();
function tone(c, k) {
  const key = c + k; let v = TONES.get(key); if (v) return v;
  v = typeof c === 'string' && c[0] === '#' && c.length === 7 ? shade(c, k) : c; TONES.set(key, v); return v;
}
// tô khối có ánh sáng: sáng ở điểm (x, y), tối dần ra mép
// (vẽ trong hệ tọa độ riêng của nhân vật nên cùng màu, cùng cỡ thì dùng lại được gradient cũ)
const LIT = new Map();
function litGrad(c, x, y, r) {
  const key = c + '|' + x + '|' + y + '|' + r; let g = LIT.get(key); if (g) return g;
  g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 1.35);
  g.addColorStop(0, tone(c, 1.35)); g.addColorStop(0.45, c); g.addColorStop(1, tone(c, 0.62));
  if (LIT.size < 400) LIT.set(key, g); return g;
}
// vũ khí hai tay: tay trái nắm ngay sau tay phải trên chuôi (cán dài thì nắm cao hơn, cung thì kéo dây)
const TWO_HAND = new Set(['greatsword', 'club', 'scythe', 'bow']);
let HAND2 = null;
function drawWeapon(L, s, wAng, o) {
  const ox = 3 * s + (o.thrust || 0) * 14 * s, oy = 8 * s, len = L.wlen * s;
  if (o.twoHand) {
    const g = L.weapon === 'bow' ? 6 * s + Math.cos(1.25) * 13 * s - 3 * s - (o.charge || 0) * 10 * s : L.weapon === 'spear' || L.weapon === 'scythe' || L.weapon === 'staff' ? len * 0.42 : -3.2 * s;
    HAND2 = [ox + Math.cos(wAng) * g, oy + Math.sin(wAng) * g];
  } else HAND2 = null;
  ctx.save(); ctx.translate(ox, oy); ctx.rotate(wAng);
  if (o.hammer !== undefined) {
    const g = o.hammer;
    ctx.strokeStyle = '#6b5a3e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(70, 0); ctx.stroke();
    ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 20 + g * 30;
    ctx.fillStyle = `rgba(245,${200 + g * 40},${110 + g * 60},.95)`; ctx.fillRect(62, -22, 26, 44);
    ctx.shadowBlur = 0;
  } else if (L.weapon === 'staff') {
    // gậy phép: cán gỗ có viền, đai kim loại, đầu gậy ôm lấy quả cầu phát sáng
    olLine(-6 * s, 0, len - 2 * s, 0, 2.6 * s, L.wcol);
    ctx.fillStyle = '#b08d4c'; ctx.fillRect(len * 0.35, -1.9 * s, 2 * s, 3.8 * s);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(len - 5 * s, -3.5 * s); ctx.quadraticCurveTo(len + 2 * s, -5 * s, len + 3 * s, 0); ctx.quadraticCurveTo(len + 2 * s, 5 * s, len - 5 * s, 3.5 * s); ctx.stroke();
    const c = o.charge || 0;
    ctx.fillStyle = L.orb; ctx.shadowColor = L.orb; ctx.shadowBlur = 8 + c * 16;
    ctx.beginPath(); ctx.arc(len, 0, (3 + c * 4) * s, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(len + 0.8 * s, -0.9 * s, 1 * s, 0, TAU); ctx.fill();
  } else if (L.weapon === 'spear') {
    // giáo: cán có viền, đai quấn, mũi hình lá có gân giữa
    olLine(-12 * s, 0, len - 8 * s, 0, 2.6 * s, '#6b5a3e');
    ctx.fillStyle = '#8a7342'; ctx.fillRect(len - 11 * s, -2 * s, 3 * s, 4 * s);
    ctx.fillStyle = L.wcol; ctx.strokeStyle = OL; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(len + 6 * s, 0); ctx.quadraticCurveTo(len - 2 * s, -4.5 * s, len - 9 * s, -1.4 * s); ctx.lineTo(len - 9 * s, 1.4 * s); ctx.quadraticCurveTo(len - 2 * s, 4.5 * s, len + 6 * s, 0); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(len - 8 * s, -0.4 * s); ctx.lineTo(len + 4 * s, -0.4 * s); ctx.stroke();
  } else if (L.weapon === 'bow') {
    const c = o.charge || 0;
    ctx.strokeStyle = OL; ctx.lineWidth = 2.4 * s + 2; ctx.beginPath(); ctx.arc(6 * s, 0, 13 * s, -1.25, 1.25); ctx.stroke();
    ctx.strokeStyle = L.wcol; ctx.lineWidth = 2.4 * s; ctx.stroke();
    ctx.strokeStyle = tone(L.wcol, 1.3); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(6 * s, 0, 13.6 * s, -1.1, 1.1); ctx.stroke();
    const ex = 6 * s + Math.cos(1.25) * 13 * s, ey = Math.sin(1.25) * 13 * s, px = ex - 3 * s - c * 10 * s;
    ctx.strokeStyle = 'rgba(230,225,210,.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ex, -ey); ctx.lineTo(px, 0); ctx.lineTo(ex, ey); ctx.stroke();
    if (c > 0) {
      olLine(px, 0, px + 26 * s, 0, 1.4 * s, '#d8d2c0');
      ctx.fillStyle = '#e8e4d8'; ctx.beginPath(); ctx.moveTo(px + 30 * s, 0); ctx.lineTo(px + 25 * s, -2.4 * s); ctx.lineTo(px + 25 * s, 2.4 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b8a888'; ctx.beginPath(); ctx.moveTo(px + 1 * s, 0); ctx.lineTo(px - 3 * s, -2.5 * s); ctx.lineTo(px + 3 * s, 0); ctx.lineTo(px - 3 * s, 2.5 * s); ctx.closePath(); ctx.fill();
    }
  } else if (L.weapon === 'axe') {
    // rìu: cán có viền, lưỡi cong có mép sáng
    olLine(-6 * s, 0, len, 0, 2.8 * s, '#5a4630');
    ctx.fillStyle = L.wcol; ctx.strokeStyle = OL; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(len - 12 * s, -2 * s); ctx.quadraticCurveTo(len - 4 * s, -16 * s, len + 4 * s, -14 * s); ctx.quadraticCurveTo(len - 1 * s, -7 * s, len + 2 * s, 2 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(len + 2.5 * s, -12.5 * s); ctx.quadraticCurveTo(len - 1.5 * s, -7 * s, len + 1 * s, 0); ctx.stroke();
    ctx.fillStyle = tone(L.wcol, 0.6); ctx.beginPath(); ctx.arc(len - 7 * s, -3 * s, 1.3 * s, 0, TAU); ctx.fill();
  } else if (L.weapon === 'club') {
    // chùy: cán quấn da, đầu nặng có đinh tán
    olLine(-4 * s, 0, len - 6 * s, 0, 3.2 * s, '#4a3a28');
    ctx.fillStyle = litGrad(L.wcol, len - 2 * s, -2.5 * s, 8 * s); ctx.strokeStyle = OL; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.ellipse(len - 4 * s, 0, 8 * s, 6.5 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = tone(L.wcol, 1.4); for (const [dx, dy] of [[-4, -3], [0, 4], [3, -2], [-2, 1.5]]) { ctx.beginPath(); ctx.arc(len - 4 * s + dx * s, dy * s, 1.1 * s, 0, TAU); ctx.fill(); }
  } else if (L.weapon === 'scythe') {
    // lưỡi hái: cán tối, lưỡi cong phát sáng có mép sắc
    olLine(-8 * s, 0, len, 0, 2.6 * s, '#3a3a4a');
    ctx.shadowColor = L.wcol; ctx.shadowBlur = 8; ctx.fillStyle = L.wcol; ctx.strokeStyle = OL; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(len, -1 * s); ctx.quadraticCurveTo(len - 4 * s, -17 * s, len - 23 * s, -19 * s); ctx.quadraticCurveTo(len - 8 * s, -12 * s, len - 3 * s, 1 * s); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(len - 1 * s, -2 * s); ctx.quadraticCurveTo(len - 5 * s, -16 * s, len - 21 * s, -18.4 * s); ctx.stroke();
  } else if (L.weapon === 'katana') {
    // katana: lưỡi cong có viền, đường vân lưỡi sáng, chắn tay tròn, chuôi quấn chéo
    ctx.lineCap = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = 2.2 * s + 2; ctx.beginPath(); ctx.moveTo(4 * s, 0); ctx.quadraticCurveTo(len * 0.6, -2.5 * s, len, -5 * s); ctx.stroke();
    ctx.strokeStyle = L.wcol; ctx.lineWidth = 2.2 * s; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(5 * s, -0.7 * s); ctx.quadraticCurveTo(len * 0.6, -3.2 * s, len - 1 * s, -5.6 * s); ctx.stroke();
    olLine(-6 * s, 0, 2.5 * s, 0, 3 * s, '#2b2622');
    ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = 0.8; for (let k = -5; k < 2; k += 2.2) { ctx.beginPath(); ctx.moveTo(k * s, -1.4 * s); ctx.lineTo((k + 1.2) * s, 1.4 * s); ctx.stroke(); }
    ctx.fillStyle = '#b08d4c'; ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(3.5 * s, 0, 1.3 * s, 2.8 * s, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.lineCap = 'butt';
  } else {
    // kiếm: lưỡi thuôn nhọn có viền tối, rãnh máu sáng, chắn tay và núm chuôi
    const hw = (L.weapon === 'greatsword' ? 3.2 : 1.9) * s, b0 = 6 * s, tip = Math.max(5 * s, hw * 2.4);
    if (L.glow) { ctx.shadowColor = typeof L.glow === 'string' ? L.glow : '#ffd76a'; ctx.shadowBlur = 12; }
    ctx.fillStyle = L.wcol; ctx.strokeStyle = 'rgba(10,8,6,.85)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(b0, -hw); ctx.lineTo(len - tip, -hw); ctx.lineTo(len, 0); ctx.lineTo(len - tip, hw); ctx.lineTo(b0, hw); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(b0 + 2 * s, -hw * 0.25 - 0.5, len - tip - b0, Math.max(1, hw * 0.35));
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.moveTo(b0, hw * 0.2); ctx.lineTo(len - tip, hw * 0.2); ctx.lineTo(len - 1, 0.5); ctx.lineTo(len - tip, hw); ctx.lineTo(b0, hw); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b08d4c'; ctx.strokeStyle = 'rgba(10,8,6,.85)'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.rect(b0 - 2 * s, -hw - 3.2 * s, 2.4 * s, hw * 2 + 6.4 * s); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a3a28'; ctx.fillRect(-2 * s, -1.2 * s, b0 - 2 * s + 2 * s, 2.4 * s);
    ctx.fillStyle = '#b08d4c'; ctx.beginPath(); ctx.arc(-2.6 * s, 0, 1.9 * s, 0, TAU); ctx.fill(); ctx.stroke();
  }
  // bàn tay đeo găng nắm chuôi
  ctx.fillStyle = '#3a2f24'; ctx.strokeStyle = 'rgba(10,8,6,.85)'; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.arc(1.5 * s, 0, 2.8 * s, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawHumanoid(x, y, face, L, wAng, o = {}) {
  const s = L.scale || 1, z = o.z || 0;
  shadow(x, y + 4 * s, 13 * s * (1 - z / 200), 8 * s * (1 - z / 200), 0.35);
  ctx.save(); ctx.translate(x, y - z);
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  if (o.aura) {
    const gr = ctx.createRadialGradient(0, 0, 4, 0, 0, 34 * s);
    gr.addColorStop(0, 'rgba(255,214,110,.35)'); gr.addColorStop(1, 'rgba(255,214,110,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 34 * s, 0, TAU); ctx.fill();
  }
  ctx.rotate(face);
  if (o.kneel) ctx.scale(0.86, 1.04);
  const wave = Math.sin((o.anim || 0) * 6) * 2 * s;
  if (L.wings) {
    // cánh đá có xương ngón: khép khi đứng, dang rộng khi bay vồ
    const spread = z > 4 ? 1.35 : 1 + Math.sin((o.anim || 0) * 2) * 0.05;
    for (const sy of [-1, 1]) {
      ctx.save(); ctx.scale(1, sy);
      ctx.fillStyle = L.wings; ctx.strokeStyle = OL; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, 8 * s); ctx.lineTo(-6 * s, 30 * s * spread); ctx.quadraticCurveTo(-12 * s, 24 * s * spread, -16 * s, 27 * s * spread);
      ctx.quadraticCurveTo(-18 * s, 19 * s * spread, -24 * s, 20 * s * spread); ctx.quadraticCurveTo(-20 * s, 13 * s, -8 * s, 9 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = tone(L.wings, 1.35); ctx.lineWidth = 1.4 * s; ctx.beginPath();
      ctx.moveTo(0, 8 * s); ctx.lineTo(-6 * s, 30 * s * spread); ctx.moveTo(-2 * s, 9 * s); ctx.lineTo(-16 * s, 27 * s * spread); ctx.moveTo(-4 * s, 9 * s); ctx.lineTo(-24 * s, 20 * s * spread); ctx.stroke();
      ctx.restore();
    }
  }
  ctx.fillStyle = L.cloak;
  ctx.beginPath(); ctx.moveTo(-1 * s, -10 * s);
  ctx.quadraticCurveTo(-16 * s, -12 * s + wave, -22 * s, -4 * s + wave); ctx.lineTo(-18 * s, 0); ctx.lineTo(-23 * s, 5 * s - wave);
  ctx.quadraticCurveTo(-15 * s, 12 * s - wave, -1 * s, 10 * s); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(10,8,6,.8)'; ctx.lineWidth = 1.6; ctx.stroke();
  // nếp gấp áo choàng
  ctx.strokeStyle = tone(L.cloak, 0.62); ctx.lineWidth = 1.3 * s;
  ctx.beginPath(); ctx.moveTo(-6 * s, -6 * s); ctx.quadraticCurveTo(-13 * s, -5 * s + wave, -17 * s, -2 * s + wave);
  ctx.moveTo(-6 * s, 6 * s); ctx.quadraticCurveTo(-13 * s, 7 * s - wave, -18 * s, 5 * s - wave); ctx.stroke();
  if (o.trail) {
    const R = (L.wlen + 4) * s;
    ctx.strokeStyle = o.trailCol || 'rgba(255,244,210,.35)'; ctx.lineWidth = 9 * s;
    ctx.beginPath(); ctx.arc(3 * s, 8 * s, R * 0.8, o.trail[0], o.trail[1], o.trail[1] < o.trail[0]); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5 * s;
    ctx.beginPath(); ctx.arc(3 * s, 8 * s, R * 0.97, o.trail[0], o.trail[1], o.trail[1] < o.trail[0]); ctx.stroke();
  }
  drawWeapon(L, s, wAng, o);
  if (o.stab) {
    ctx.strokeStyle = 'rgba(255,244,210,.45)'; ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo((L.wlen + 20) * s, 7 * s); ctx.lineTo((L.wlen + 52) * s, 3 * s); ctx.stroke(); ctx.lineCap = 'butt';
  }
  // thân: đổ sáng từ phía trước, viền tối rõ
  ctx.strokeStyle = 'rgba(10,8,6,.85)'; ctx.lineWidth = 1.8;
  ctx.fillStyle = litGrad(L.body, 3 * s, -3 * s, 13 * s); ctx.beginPath(); ctx.ellipse(0, 0, 9 * s, 12 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // giáp ngực: đường nẹp giữa và thắt lưng
  ctx.strokeStyle = tone(L.body, 0.6); ctx.lineWidth = 1.2 * s;
  ctx.beginPath(); ctx.moveTo(4 * s, -8 * s); ctx.quadraticCurveTo(7.5 * s, 0, 4 * s, 8 * s); ctx.stroke();
  ctx.strokeStyle = L.trim; ctx.lineWidth = 1.8 * s; ctx.beginPath(); ctx.moveTo(-3 * s, -10.5 * s); ctx.lineTo(-3 * s, 10.5 * s); ctx.stroke();
  if (L.bones) {
    // xương sườn và cột sống lộ ra
    ctx.fillStyle = 'rgba(30,24,18,.75)'; ctx.beginPath(); ctx.ellipse(0, 0, 6.5 * s, 9 * s, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = L.body; ctx.lineWidth = 1.5 * s; ctx.lineCap = 'round';
    for (const k of [-4.5, -1.5, 1.5, 4.5]) { ctx.beginPath(); ctx.moveTo(-1 * s, k * s * 1.6); ctx.quadraticCurveTo(4 * s, k * s * 1.7 - 1.5 * s, 5.5 * s, k * s * 1.2); ctx.stroke(); }
    ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(-1.5 * s, -8 * s); ctx.lineTo(-1.5 * s, 8 * s); ctx.stroke(); ctx.lineCap = 'butt';
  }
  if (L.weed) {
    // rong biển vắt qua vai, nước bóng ướt
    ctx.strokeStyle = '#3a6a3a'; ctx.lineWidth = 2 * s; ctx.lineCap = 'round';
    for (const [a, b, c, d] of [[3, -9, -6, -14], [-1, 8, -9, 14], [1, -3, -7, -1], [4, 5, -4, 7]]) { ctx.beginPath(); ctx.moveTo(a * s, b * s); ctx.quadraticCurveTo((a + c) / 2 * s + wave, (b + d) / 2 * s, c * s, d * s); ctx.stroke(); }
    ctx.lineCap = 'butt'; ctx.fillStyle = 'rgba(200,230,240,.3)'; ctx.beginPath(); ctx.ellipse(3 * s, -4 * s, 3 * s, 1.2 * s, 0.4, 0, TAU); ctx.fill();
  }
  if (L.stone) {
    ctx.strokeStyle = 'rgba(30,26,22,.55)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-5 * s, -6 * s); ctx.lineTo(-1 * s, -3 * s); ctx.lineTo(-3 * s, 1 * s); ctx.moveTo(2 * s, 4 * s); ctx.lineTo(5 * s, 7 * s); ctx.stroke();
  }
  // giáp vai có ánh kim
  ctx.strokeStyle = 'rgba(10,8,6,.85)'; ctx.lineWidth = 1.6;
  for (const sy of [-10, 10]) {
    ctx.fillStyle = litGrad(L.trim, 2.5 * s, sy * s - 1.5 * s, 5.5 * s); ctx.beginPath(); ctx.arc(1 * s, sy * s, 4.8 * s, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,248,225,.55)'; ctx.beginPath(); ctx.arc(2.4 * s, sy * s - 1.4 * s, 1.1 * s, 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(10,8,6,.85)'; ctx.lineWidth = 1.6;
  if (o.twoHand && HAND2) {
    // cánh tay trái vươn qua ngực nắm vũ khí
    const [hx, hy] = HAND2;
    ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 4.8 * s; ctx.beginPath(); ctx.moveTo(1 * s, -9 * s); ctx.quadraticCurveTo(7 * s, -2 * s, hx, hy); ctx.stroke();
    ctx.strokeStyle = tone(L.body, 0.85); ctx.lineWidth = 3 * s; ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#3a2f24'; ctx.strokeStyle = OL; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(hx, hy, 2.7 * s, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(10,8,6,.85)'; ctx.lineWidth = 1.6;
  }
  if (o.cat) {
    ctx.save(); ctx.translate(2 * s, -10 * s); ctx.rotate(-0.5 - (o.castK || 0) * 0.8);
    if (o.cat === 'staff') {
      ctx.strokeStyle = '#6b5a3e'; ctx.lineWidth = 2.4 * s; ctx.beginPath(); ctx.moveTo(-4 * s, 0); ctx.lineTo(24 * s, 0); ctx.stroke();
      ctx.fillStyle = '#bfe4ff'; ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 8 + (o.castK || 0) * 14; ctx.beginPath(); ctx.arc(25 * s, 0, (2.8 + (o.castK || 0) * 3) * s, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = '#d8b45a'; ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 6 + (o.castK || 0) * 14; ctx.beginPath(); ctx.arc(8 * s, 0, 4 * s, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff0c0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(8 * s, 0, 2 * s, 0, TAU); ctx.stroke();
    }
    ctx.shadowBlur = 0; ctx.restore();
    ctx.strokeStyle = 'rgba(10,8,6,.75)'; ctx.lineWidth = 1.4;
  } else if (o.shield === 3) {
    ctx.fillStyle = '#4a4f58'; ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.6 * s;
    ctx.fillRect(9 * s, -12 * s, 5 * s, 22 * s); ctx.strokeRect(9 * s, -12 * s, 5 * s, 22 * s);
    ctx.strokeStyle = 'rgba(10,8,6,.75)'; ctx.lineWidth = 1.4;
  } else if (o.shield) {
    const up = o.shield === 2;
    ctx.fillStyle = o.kite ? '#5a5f68' : '#6b5638'; ctx.strokeStyle = o.kite ? '#c8ccd2' : '#b9b29c'; ctx.lineWidth = 1.6 * s;
    ctx.beginPath(); ctx.arc(up ? 10 * s : 2 * s, up ? -6 * s : -12 * s, (up ? 7.5 : 6) * s, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(10,8,6,.75)'; ctx.lineWidth = 1.4;
  }
  // đầu / mũ giáp
  ctx.fillStyle = litGrad(L.head, 4 * s, -2.5 * s, 8 * s); ctx.beginPath(); ctx.arc(2 * s, 0, 6.4 * s, 0, TAU); ctx.fill(); ctx.stroke();
  if (L.hood) {
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(4.2 * s, 0, 4 * s, -1.25, 1.25); ctx.fill();
    ctx.strokeStyle = tone(L.cloak, 0.7); ctx.lineWidth = 1.1 * s; ctx.beginPath(); ctx.arc(2 * s, 0, 5 * s, 1.9, 4.4); ctx.stroke();
  } else {
    ctx.strokeStyle = L.trim; ctx.lineWidth = 1.4 * s; ctx.beginPath(); ctx.moveTo(-3.5 * s, 0); ctx.lineTo(7 * s, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.lineWidth = 1.8 * s; ctx.beginPath(); ctx.moveTo(6.4 * s, -3.4 * s); ctx.lineTo(6.4 * s, 3.4 * s); ctx.stroke();
  }
  if (L.bones) {
    // hốc mắt và hàm răng của sọ
    ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.ellipse(5 * s, -2.3 * s, 1.6 * s, 1.3 * s, 0, 0, TAU); ctx.ellipse(5 * s, 2.3 * s, 1.6 * s, 1.3 * s, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(40,30,20,.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(7.6 * s, -2 * s); ctx.lineTo(7.6 * s, 2 * s); for (let k = -1.5; k <= 1.5; k += 1) { ctx.moveTo(7 * s, k * s); ctx.lineTo(8.3 * s, k * s); } ctx.stroke();
  }
  if (L.horns) {
    for (const sy of [-1, 1]) {
      ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 3.6 * s; ctx.beginPath(); ctx.moveTo(1 * s, sy * 4 * s); ctx.quadraticCurveTo(-4 * s, sy * 9 * s, -9 * s, sy * 7 * s); ctx.stroke();
      ctx.strokeStyle = '#4a463e'; ctx.lineWidth = 2.2 * s; ctx.stroke(); ctx.lineCap = 'butt';
    }
  }
  if (o.eyes) { ctx.fillStyle = o.eyes; ctx.shadowColor = o.eyes; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(6 * s, -2.2 * s, 1.1 * s, 0, TAU); ctx.arc(6 * s, 2.2 * s, 1.1 * s, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; }
  if (o.flash) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(0, 0, 10 * s, 13 * s, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
// ngựa linh: thân đen ánh xanh, bờm và đuôi là lửa hồn, yên da viền vàng; phi thì bốn chân so le
function drawHorse(x, y, face, anim) {
  const moving = Math.hypot(P.mvx || 0, P.mvy || 0) > 20, g = moving ? anim * 2.2 : 0, bob = moving ? Math.abs(Math.sin(g)) * 2 : Math.sin(G.clock * 2) * 0.8;
  shadow(x, y + 5, 32, 14, 0.32);
  ctx.save(); ctx.translate(x, y); ctx.rotate(face);
  const col = '#2d3038', dark = '#1a1c22';
  // bốn chân có móng, so le khi phi
  for (const [bx, sy, ph] of [[16, -1, 0], [16, 1, Math.PI], [-17, -1, Math.PI * 0.5], [-17, 1, Math.PI * 1.5]]) {
    const sw = moving ? Math.sin(g + ph) * 9 : 0;
    legLine(bx, sy * 7, bx + sw, sy * 12, 4, dark);
    ctx.fillStyle = '#4a4a50'; ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(bx + sw, sy * 12.5, 2.8, 2.2, 0, 0, TAU); ctx.fill(); ctx.stroke();
  }
  // đuôi lửa hồn bay theo gió
  const tw = Math.sin(G.clock * 4) * 5;
  for (const [w, c] of [[7, 'rgba(120,180,255,.25)'], [4, 'rgba(170,215,255,.6)'], [1.6, 'rgba(235,248,255,.9)']]) {
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-27, 0); ctx.quadraticCurveTo(-40, tw, -52 - (moving ? 6 : 0), tw * 1.6); ctx.stroke();
  }
  ctx.lineCap = 'butt';
  // thân đổ sáng, cơ vai và hông
  ctx.shadowColor = 'rgba(150,200,255,.5)'; ctx.shadowBlur = 10;
  ctx.fillStyle = litGrad(col, 6, -4, 30); ctx.strokeStyle = OL; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.ellipse(0, 0, 29, 12 + bob * 0.3, 0, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
  ctx.strokeStyle = 'rgba(10,10,14,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(14, 0, 9, -1.2, 1.2); ctx.moveTo(-10, -9); ctx.arc(-16, 0, 11, -0.9, 0.9); ctx.stroke();
  ctx.strokeStyle = 'rgba(150,190,255,.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-22, -4); ctx.quadraticCurveTo(0, -9, 20, -5); ctx.stroke();
  // yên da, chăn yên đỏ viền vàng, bàn đạp
  ctx.fillStyle = '#6a1f1a'; ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.roundRect(-11, -11, 18, 22, 3); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#c9a44e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(-9.5, -9.5, 15, 19, 2); ctx.stroke();
  ctx.fillStyle = litGrad('#5a3a22', -1, -3, 9); ctx.strokeStyle = OL; ctx.beginPath(); ctx.ellipse(-2, 0, 8, 7.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c9a44e'; for (const sy of [-1, 1]) ctx.fillRect(-3, sy * 12.5 - 1, 3, 2);
  // cổ và đầu vươn ra trước, bờm lửa hồn dọc cổ
  const hx = 34 + bob * 0.6;
  ctx.fillStyle = litGrad(col, 22, -2, 10); ctx.strokeStyle = OL; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(18, -7); ctx.quadraticCurveTo(26, -6, hx - 4, -4.5); ctx.lineTo(hx - 4, 4.5); ctx.quadraticCurveTo(26, 6, 18, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = litGrad('#34373f', hx + 2, -2, 9); ctx.beginPath(); ctx.ellipse(hx + 2, 0, 9, 5.8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3e4048'; ctx.beginPath(); ctx.ellipse(hx + 9, 0, 3.4, 4.2, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#101216'; ctx.beginPath(); ctx.arc(hx + 11, -1.6, 0.9, 0, TAU); ctx.arc(hx + 11, 1.6, 0.9, 0, TAU); ctx.fill();
  ctx.fillStyle = col; for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx - 3, sy * 3); ctx.lineTo(hx - 7, sy * 6.5); ctx.lineTo(hx - 1, sy * 4.5); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  for (let k = 0; k < 6; k++) {
    const mx = 16 + k * 3.4, my = Math.sin(G.clock * 6 + k) * 1.5 - 1;
    ctx.fillStyle = k % 2 ? 'rgba(170,215,255,.7)' : 'rgba(120,180,255,.45)'; ctx.beginPath(); ctx.ellipse(mx - 2, my, 4, 2.2, -0.3, 0, TAU); ctx.fill();
  }
  // dây cương vàng và mắt sáng xanh
  ctx.strokeStyle = '#c9a44e'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(4, -4); ctx.lineTo(hx + 5, -3.5); ctx.moveTo(4, 4); ctx.lineTo(hx + 5, 3.5); ctx.stroke();
  ctx.fillStyle = '#bfe4ff'; ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(hx + 3, -3.4, 1.1, 0, TAU); ctx.arc(hx + 3, 3.4, 1.1, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  ctx.restore();
}
function drawPlayer() {
  const p = P, LOOK = playerLook();
  if (p.state === 'dead') {
    const k = Math.min(1, G.deathT / 1.2);
    drawHumanoid(p.x, p.y, p.face, LOOK, 1.2, { alpha: 1 - k * 0.7, kneel: true, shield: 1 });
    return;
  }
  if (p.mounted) drawHorse(p.x, p.y, p.face, p.walk);
  let wAng = 0.6, trail = null, thrust = 0, stab = false, spinRot = 0, fx = null, charge = 0, castK = 0;
  if (p.state === 'attack' && p.atk) {
    const A = p.atk, t = p.t, sw_ = A.swing || 1, anim = A.anim || (A.thrust ? 'thrust' : 'slash');
    const ph = t < A.wind ? 0 : t < A.wind + A.act ? 1 : 2;
    const k = ph === 0 ? t / A.wind : ph === 1 ? (t - A.wind) / A.act : (t - A.wind - A.act) / A.rec;
    if (anim === 'bow') { wAng = -0.1; charge = ph === 0 ? k : 0; if (ph === 0 && A.pierce && k > 0.5) { ctx.strokeStyle = `rgba(255,240,200,${0.4 * k})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(p.face) * 260, p.y + Math.sin(p.face) * 260); ctx.stroke(); } }
    else if (anim === 'thrust' || (anim === 'dash' && A.thrust)) {
      wAng = -0.12; thrust = ph === 0 ? -0.5 * k : ph === 1 ? 1 : 1 - k; stab = ph === 1;
      if (anim === 'dash' && ph === 1) fx = 'dash';
    } else if (anim === 'spin') {
      wAng = ph === 0 ? lerp(0.6, 1.7, k) : ph === 1 ? 1.7 : lerp(1.7, 0.6, k);
      if (ph === 1) { spinRot = -k * TAU * (A.turns || 1); fx = 'spin'; }
    } else if (anim === 'overhead') {
      if (ph === 0) wAng = lerp(0.6, Math.PI * 0.95, 1 - Math.pow(1 - k, 2));
      else if (ph === 1) { wAng = lerp(Math.PI * 0.95, 0, Math.min(1, k * 2)); thrust = 0.5; fx = 'chop'; }
      else { wAng = lerp(0, 0.6, k); thrust = 0.5 * (1 - k); if (k < 0.3) fx = 'chop'; }
    } else if (anim === 'dash') {
      if (ph === 0) wAng = lerp(0.6, 1.9, k);
      else if (ph === 1) { wAng = lerp(1.9, -1.4, k); fx = 'dash'; trail = [1.8, wAng]; }
      else wAng = lerp(-1.4, 0.6, k);
    } else if (ph === 0) wAng = weaponAngle('wind', k, sw_);
    else if (ph === 1) { wAng = weaponAngle('act', k, sw_); trail = [1.8 * sw_, wAng]; }
    else { wAng = weaponAngle('rec', k, sw_); if (k < 0.3) trail = [lerp(1.8 * sw_, -1.3 * sw_, k * 2), -1.3 * sw_]; }
  } else if (p.state === 'roll') wAng = 2.4;
  else if (p.state === 'drink') wAng = 1.4;
  else if (p.state === 'cast') { wAng = 0.9; const sp = p.spell ? SPELLS[p.spell] : null, ct = sp ? sp.cast : 0.1; castK = p.t < ct ? p.t / ct : Math.max(0, 1 - (p.t - ct) / 0.25); }
  else if (p.state === 'throw') wAng = p.t < 0.15 ? 2 : -0.4;
  else if (p.state === 'guard') wAng = 1.1;
  const th = twoHanded(), cat = catalyst(), off = offDef();
  if (th && p.state === 'guard') wAng = -1.1;
  const o = { anim: p.walk, trail, thrust, stab, charge, flash: p.invuln > 0.25 && !(p.atk && p.atk.critT), shield: th || cat ? 0 : p.state === 'guard' ? 2 : 1, kite: off.id === 'kite', cat: cat ? cat.type : null, castK, twoHand: th && !p.mounted };
  if (p.state === 'attack' && p.atk && p.atk.kind === 'heavy') o.trailCol = 'rgba(255,220,150,.45)';
  if (p.state === 'roll' && p.roll.back) {
    // nhảy lùi: không lộn người, chỉ hơi thu mình
    const k = p.t / p.roll.dur, s = 1 - Math.sin(k * Math.PI) * 0.08;
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s); ctx.translate(-p.x, -p.y);
    drawHumanoid(p.x, p.y, p.face, LOOK, 0.6, o);
    ctx.restore();
  } else if (p.state === 'roll') {
    const k = p.t / p.roll.dur;
    // bóng mờ phía sau trong lúc bất tử, để người chơi cảm được khung né
    if (p.t > p.roll.iframe[0] && p.t < p.roll.iframe[1]) {
      ctx.globalAlpha = 0.22; drawHumanoid(p.x - Math.cos(p.rollDir) * 14, p.y - Math.sin(p.rollDir) * 14, p.rollDir, LOOK, wAng, o); ctx.globalAlpha = 1;
    }
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1 - Math.sin(k * Math.PI) * 0.22, 1 - Math.sin(k * Math.PI) * 0.22); ctx.translate(-p.x, -p.y);
    drawHumanoid(p.x, p.y, p.rollDir, LOOK, wAng, o);
    ctx.restore();
  } else {
    drawHumanoid(p.x, p.y - (p.mounted ? 6 : 0), p.face + spinRot, LOOK, wAng, o);
  }
  if (fx && p.atk) {
    const A = p.atk, R = LOOK.wlen + 12;
    ctx.lineCap = 'round';
    if (fx === 'spin') {
      const a0 = p.face + spinRot;
      ctx.strokeStyle = 'rgba(255,244,210,.45)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(p.x, p.y, R, a0, a0 + 1.8); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, R + 4, a0, a0 + 1.8); ctx.stroke();
    } else if (fx === 'chop' && A.ix !== undefined) {
      ctx.strokeStyle = 'rgba(255,240,200,.5)'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(p.x + Math.cos(p.face) * 14, p.y + Math.sin(p.face) * 14); ctx.lineTo(A.ix, A.iy); ctx.stroke();
    } else if (fx === 'dash' && A.sx !== undefined) {
      ctx.strokeStyle = 'rgba(255,244,210,.4)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(A.sx, A.sy); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }
  if (p.state === 'guard' && p.parryOk && p.t < 0.22) {
    ctx.strokeStyle = `rgba(255,240,200,${0.7 * (1 - p.t / 0.22)})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 22, p.face - 0.9, p.face + 0.9); ctx.stroke();
  }
  if (p.state === 'drink') { ctx.fillStyle = `rgba(255,90,70,${0.25 + Math.sin(p.t * 20) * 0.1})`; ctx.beginPath(); ctx.arc(p.x, p.y, 20, 0, TAU); ctx.fill(); }
  if (p.state === 'cast' && p.spell) {
    const sch = SPELLS[p.spell].school, col = sch === 'sorc' ? '170,200,255' : '255,220,130';
    ctx.fillStyle = `rgba(${col},${0.45 * castK})`; ctx.beginPath(); ctx.arc(p.x + Math.cos(p.face) * 20, p.y + Math.sin(p.face) * 20, 5 + castK * 10, 0, TAU); ctx.fill();
    if (sch === 'incant') { ctx.strokeStyle = `rgba(${col},${0.5 * castK})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, 22 + castK * 8, 0, TAU); ctx.stroke(); }
  }
  if (p.flameT > 0) { const gr = ctx.createRadialGradient(p.x + Math.cos(p.face) * 60, p.y + Math.sin(p.face) * 60, 4, p.x + Math.cos(p.face) * 60, p.y + Math.sin(p.face) * 60, 70); gr.addColorStop(0, 'rgba(255,160,60,.25)'); gr.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x + Math.cos(p.face) * 60, p.y + Math.sin(p.face) * 60, 70, 0, TAU); ctx.fill(); }
  if (p.buffs.flame > 0 || p.buffs.holy > 0) { const col = p.buffs.flame > 0 ? '#ff9a4a' : '#ffe08a'; if (Math.random() < 0.5) addPart(p.x + Math.cos(p.face) * 20 + rand(-8, 8), p.y + Math.sin(p.face) * 20 + rand(-8, 8), 0, -30, 0.4, 2.5, col, p.buffs.flame > 0 ? 'fire' : 'mote'); }
}
function drawFinal() {
  const f = fb;
  if (!f || !inView(f.x, f.y, 420)) return;
  if (f.dead && f.t > 3) return;
  const alpha = f.dead ? Math.max(0, 1 - f.t / 3) : 1;
  if (f.state === 'atk' && f.atk) {
    const s = f.atk.steps[f.atk.i], t = f.atk.t;
    if (s && s.k === 'slam' && t < s.wind) { const hx = f.x + Math.cos(f.face) * s.off, hy = f.y + Math.sin(f.face) * s.off; ctx.strokeStyle = `rgba(255,210,110,${0.2 + t / s.wind * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, s.r, 0, TAU); ctx.stroke(); }
    if (s && s.k === 'beam' && t < s.wind) { const h = finalHead(f); ctx.strokeStyle = `rgba(255,230,160,${0.15 + t / s.wind * 0.35})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x + Math.cos(f.face) * 480, h.y + Math.sin(f.face) * 480); ctx.stroke(); }
  }
  if (f.beaming) {
    const h = finalHead(f), ex = h.x + Math.cos(f.beamDir) * 480, ey = h.y + Math.sin(f.beamDir) * 480;
    ctx.save(); ctx.lineCap = 'round'; ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 24;
    ctx.strokeStyle = 'rgba(255,215,110,.55)'; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(h.x, h.y - (f.z || 0)); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,250,225,.95)'; ctx.lineWidth = 8; ctx.stroke(); ctx.restore();
  }
  if (f.phase === 1) {
    let wAng = 0.5, trail = null;
    if (f.state === 'atk' && f.atk) {
      const s = f.atk.steps[f.atk.i], t = f.atk.t;
      if (s.k === 'swing') {
        if (t < s.wind) wAng = weaponAngle('wind', t / s.wind, s.swing);
        else if (t < s.wind + s.act) { wAng = weaponAngle('act', (t - s.wind) / s.act, s.swing); trail = [1.8 * s.swing, wAng]; }
        else wAng = weaponAngle('rec', (t - s.wind - s.act) / s.rec, s.swing);
      } else if (s.k === 'slam') wAng = t < s.wind ? lerp(0.5, 2.9, Math.min(1, t / s.wind)) : 0;
      else if (s.k === 'leap') wAng = 2.6;
      else wAng = -0.3;
    }
    if (f.charge > 0) { const gr = ctx.createRadialGradient(f.x, f.y - 30, 2, f.x, f.y - 30, 60); gr.addColorStop(0, `rgba(255,230,150,${0.6 * f.charge})`); gr.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(f.x, f.y - 30, 60, 0, TAU); ctx.fill(); }
    drawHumanoid(f.x, f.y, f.face, f.look, wAng, {
      anim: f.anim, trail, trailCol: 'rgba(255,220,130,.5)', flash: f.hurtFlash > 0, z: f.z, aura: true, twoHand: true,
      kneel: f.state === 'transform' || f.state === 'broken', eyes: '#fff3c0',
      alpha: f.state === 'transform' ? Math.max(0.05, 1 - f.t / 1.8) : alpha,
    });
    return;
  }
  const z = f.z || 0, t = f.anim;
  shadow(f.x, f.y + 12, 74, 34, 0.35 * alpha);
  ctx.save(); ctx.globalAlpha = alpha * (f.state === 'transform' ? Math.min(1, (f.t - 1.8) / 1.2) : 1); ctx.translate(f.x, f.y - z);
  ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 22; ctx.strokeStyle = 'rgba(255,220,120,.75)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(0, -6, 78 + Math.sin(t * 1.5) * 3, 0, TAU); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -6, 64, t * 0.4, t * 0.4 + TAU * 0.85); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.rotate(f.face);
  for (let i = 12; i >= 0; i--) {
    const x = 26 - i * 13, y = Math.sin(t * 2 + i * 0.5) * (3 + i * 1.3), r = 24 - i * 1.4;
    const gr = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
    gr.addColorStop(0, '#fffbe8'); gr.addColorStop(0.6, '#f0cf72'); gr.addColorStop(1, 'rgba(170,120,40,.85)');
    ctx.fillStyle = gr; ctx.strokeStyle = 'rgba(110,70,15,.75)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    // vảy vàng và gai lưng
    ctx.strokeStyle = 'rgba(150,100,30,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x - r * 0.2, y, r * 0.6, -1.1, 1.1); ctx.stroke();
    if (i % 2 === 0) { ctx.fillStyle = '#fff1b8'; ctx.strokeStyle = 'rgba(110,70,15,.8)'; ctx.beginPath(); ctx.moveTo(x + r * 0.5, y); ctx.lineTo(x - r * 0.4, y - r * 0.22); ctx.lineTo(x - r * 0.4, y + r * 0.22); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  // vây ánh sáng: dải sáng có tia
  for (const sd of [-1, 1]) {
    const fl = 60 + Math.sin(t * 3) * 6, fg = ctx.createLinearGradient(0, sd * 18, 0, sd * fl);
    fg.addColorStop(0, 'rgba(255,236,170,.75)'); fg.addColorStop(1, 'rgba(255,236,170,.1)');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(14, sd * 18); ctx.quadraticCurveTo(-10, sd * fl, -40, sd * 26); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,248,215,.55)'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let k = 1; k <= 5; k++) { const u = k / 6; ctx.moveTo(14 - u * 54, sd * (18 + u * 8)); ctx.lineTo(10 - u * 42, sd * (22 + (fl - 22) * Math.sin(u * Math.PI) * 0.9)); }
    ctx.stroke();
  }
  // đầu: vương miện gai, hàm và gờ mắt
  ctx.fillStyle = '#e8c060'; ctx.strokeStyle = 'rgba(110,70,15,.85)'; ctx.lineWidth = 1.4;
  for (const [hx, hy] of [[30, -14], [26, 0], [30, 14]]) { ctx.beginPath(); ctx.moveTo(hx + 10, hy * 0.6); ctx.lineTo(hx - 12, hy * 1.25); ctx.lineTo(hx + 4, hy * 0.2 + (hy ? 0 : 4)); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  const hg = ctx.createRadialGradient(50, -5, 2, 44, 0, 24); hg.addColorStop(0, '#fffdf0'); hg.addColorStop(0.6, '#fff0c0'); hg.addColorStop(1, '#d8b060');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(44, 0, 22, 15, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(140,95,30,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(50, -10); ctx.lineTo(58, -8); ctx.moveTo(50, 10); ctx.lineTo(58, 8); ctx.moveTo(60, -3); ctx.quadraticCurveTo(64, 0, 60, 3); ctx.stroke();
  const glow = f.beaming ? 1 : f.charge;
  if (glow > 0) { const gr = ctx.createRadialGradient(62, 0, 1, 62, 0, 30); gr.addColorStop(0, `rgba(255,250,220,${glow})`); gr.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(62, 0, 30, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#6ad0ff'; ctx.shadowColor = '#6ad0ff'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(52, -6, 2.4, 0, TAU); ctx.moveTo(54.4, 6); ctx.arc(52, 6, 2.4, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  if (f.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(-30, 0, 80, 24, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawDragon() {
  const d = dragon;
  if (!d || !inView(d.x, d.y, 320)) return;
  if (d.dead && d.t > 3) return;
  // động tác báo đòn thay cho vệt cảnh báo: cắn thì rụt đầu, há miệng rồi mổ tới; vả thì giơ vuốt; quật đuôi thì cuộn đuôi
  let headPull = 0, jaw = 0, claw = 0, tailCurl = 0, eyeFlash = 0;
  if (d.state === 'atk' && d.atk) {
    const s = d.atk.steps[d.atk.i], t = d.atk.t;
    if (s && s.k === 'melee') {
      const bite = s.arc < 2, k = Math.min(1, t / s.wind), inAct = t >= s.wind && t < s.wind + s.act;
      if (bite) {
        headPull = t < s.wind ? -26 * (1 - Math.pow(1 - k, 2)) : inAct ? 30 : 30 * Math.max(0, 1 - (t - s.wind - s.act) / s.rec * 2);
        jaw = t < s.wind ? k : inAct ? 1 - (t - s.wind) / s.act : 0;
      } else claw = t < s.wind ? k : inAct ? -1 : 0;
      eyeFlash = t < s.wind && k > 0.45 ? 1 : 0;
    } else if (s && s.k === 'tail' && t < s.wind) tailCurl = t / s.wind;
  }
  const alpha = d.dead ? Math.max(0, 1 - d.t / 3) : 1, z = d.z || 0;
  shadow(d.x, d.y + 8, 78 * (1 - z / 420), 44 * (1 - z / 420), 0.4 * alpha);
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(d.x, d.y - z);
  const sc = (1 + z / 600) * (d.state === 'sleep' ? 1 + Math.sin(d.anim * 1.4) * 0.03 : 1);
  ctx.scale(sc, sc); ctx.rotate(d.face + d.spin);
  const flap = d.flying ? Math.sin(d.anim * 10) : d.state === 'wake' ? Math.sin(d.anim * 6) * 0.6 : Math.sin(d.anim * 1.2) * 0.12;
  const body = '#5b4f46', dark = '#2a231f';
  for (let i = 7; i >= 0; i--) {
    const tx = -34 - i * 13 + tailCurl * i * 3, ty = Math.sin(d.anim * 2 + i * 0.7) * (2 + i * 1.6) + (d.state === 'sleep' ? i * i * 0.9 : 0) + tailCurl * i * i * 1.6;
    ctx.fillStyle = i % 2 ? body : '#534840'; ctx.strokeStyle = dark; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(tx, ty, 15 - i * 1.6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a312b'; ctx.beginPath(); ctx.moveTo(tx + 4, ty); ctx.lineTo(tx - 3, ty - 3.5); ctx.lineTo(tx - 3, ty + 3.5); ctx.closePath(); ctx.fill();
  }
  const sp = d.state === 'sleep' ? 0.55 : 1;
  for (const side of [-1, 1]) {
    // cánh màng: sáng dần ra mép, xương cánh dày có viền, gân màng mảnh
    const wg = ctx.createLinearGradient(0, side * 16, 0, side * 96 * sp);
    wg.addColorStop(0, 'rgba(58,48,42,.97)'); wg.addColorStop(1, 'rgba(112,88,72,.9)');
    ctx.fillStyle = wg; ctx.strokeStyle = dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(8, side * 16);
    ctx.lineTo(-6, side * (70 + flap * 30) * sp); ctx.lineTo(-30, side * (96 + flap * 34) * sp); ctx.lineTo(-44, side * (70 + flap * 22) * sp);
    ctx.lineTo(-58, side * (52 + flap * 14) * sp); ctx.lineTo(-30, side * 22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,120,95,.35)'; ctx.lineWidth = 0.8; ctx.beginPath();
    for (const f of [0.3, 0.55, 0.8]) { ctx.moveTo(-6 + f * -24, side * (70 + flap * 30) * sp * (1 - f * 0.1)); ctx.lineTo(-30 + f * 4, side * 26); }
    ctx.stroke();
    ctx.lineCap = 'round'; ctx.strokeStyle = dark; ctx.lineWidth = 4.2;
    ctx.beginPath(); ctx.moveTo(8, side * 16); ctx.lineTo(-30, side * (96 + flap * 34) * sp); ctx.moveTo(-6, side * (70 + flap * 30) * sp); ctx.lineTo(-30, side * 22); ctx.moveTo(-30, side * (96 + flap * 34) * sp); ctx.lineTo(-58, side * (52 + flap * 14) * sp); ctx.stroke();
    ctx.strokeStyle = '#6a5a4c'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#d8ccb0'; ctx.beginPath(); ctx.arc(-30, side * (96 + flap * 34) * sp, 2, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = litGrad(body, 8, -8, 42); ctx.strokeStyle = dark; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.ellipse(-4, 0, 44, 25, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // vảy lưng: các hàng vảy hình vòng cung
  ctx.strokeStyle = 'rgba(30,24,20,.45)'; ctx.lineWidth = 1;
  for (let r = -2; r <= 2; r++) for (let k = -3; k <= 3; k++) { const vx = -4 + k * 11 + (r % 2 ? 5 : 0), vy = r * 8.5; if ((vx + 4) * (vx + 4) / 1600 + vy * vy / 480 > 1) continue; ctx.beginPath(); ctx.arc(vx, vy, 4.5, -0.3, Math.PI + 0.3, true); ctx.stroke(); }
  ctx.fillStyle = 'rgba(160,140,115,.22)'; ctx.beginPath(); ctx.ellipse(-4, 0, 30, 10, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a312b';
  for (let i = 0; i < 6; i++) { const sx = 30 - i * 14; ctx.beginPath(); ctx.moveTo(sx + 5, 0); ctx.lineTo(sx - 5, -5); ctx.lineTo(sx - 5, 5); ctx.closePath(); ctx.fill(); }
  // vuốt trước: giơ ra sau khi lấy đà, quét về phía trước khi vả
  if (claw) {
    for (const side of [-1, 1]) {
      const a = claw > 0 ? -0.6 - claw * 0.9 : 0.5, cx = 22 + Math.cos(a) * 20, cy = side * (22 + Math.sin(-a) * 6 + (claw > 0 ? claw * 10 : 0));
      ctx.strokeStyle = '#3a312b'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(14, side * 16); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = 2; ctx.beginPath();
      for (let f = -1; f <= 1; f++) { ctx.moveTo(cx, cy + f * 3); ctx.lineTo(cx + 9, cy + f * 5); }
      ctx.stroke(); ctx.lineCap = 'butt';
    }
  }
  const na = dragonNeck(d), hx = 34 + headPull + Math.cos(na) * 38, hy = Math.sin(na) * 38;
  ctx.lineCap = 'round'; ctx.strokeStyle = dark; ctx.lineWidth = 23;
  ctx.beginPath(); ctx.moveTo(24, 0); ctx.quadraticCurveTo(40, hy * 0.3, hx, hy); ctx.stroke();
  ctx.strokeStyle = body; ctx.lineWidth = 20; ctx.stroke();
  ctx.strokeStyle = 'rgba(170,150,125,.25)'; ctx.lineWidth = 6; ctx.stroke(); ctx.lineCap = 'butt';
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(na);
  // ngóc đầu lên (to dần về phía người xem) khi lấy đà cắn
  if (jaw > 0 && headPull < 0) { const up = 1 + jaw * 0.45; ctx.scale(up, up); }
  ctx.fillStyle = litGrad('#675a50', 12, -4, 18); ctx.strokeStyle = dark; ctx.lineWidth = 2;
  if (jaw > 0.05) {
    // hàm mở: hai nửa đầu tách ra, lộ miệng đỏ và răng trắng
    const o = jaw * 13;
    ctx.fillStyle = '#7a1a12'; ctx.beginPath(); ctx.ellipse(12, 0, 16, o + 2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#675a50';
    ctx.beginPath(); ctx.ellipse(6, -o, 20, 9, -jaw * 0.25, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(6, o, 20, 8, jaw * 0.25, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4ecd8';
    for (let i = 0; i < 4; i++) { const tx = 12 + i * 5; ctx.fillRect(tx, -o + 5, 2, 4); ctx.fillRect(tx, o - 8, 2, 4); }
  } else { ctx.beginPath(); ctx.ellipse(6, 0, 20, 12, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
  if (eyeFlash) { ctx.fillStyle = '#fff6c0'; ctx.fillRect(6, -11 - jaw * 13, 6, 4); ctx.fillRect(6, 7 + jaw * 13, 6, 4); }
  // sừng có viền, mũi và gờ mày
  ctx.lineCap = 'round';
  for (const sy of [-1, 1]) {
    ctx.strokeStyle = dark; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-2, sy * 8); ctx.quadraticCurveTo(-10, sy * 14, -19, sy * 15); ctx.stroke();
    ctx.strokeStyle = '#d8ccb0'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.arc(22 + (jaw > 0.05 ? 0 : 0), sy * (3 + jaw * 13), 1.4, 0, TAU); ctx.fill();
  }
  ctx.lineCap = 'butt';
  ctx.strokeStyle = 'rgba(20,16,12,.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(6, -7 - jaw * 13); ctx.lineTo(14, -5 - jaw * 13); ctx.moveTo(6, 7 + jaw * 13); ctx.lineTo(14, 5 + jaw * 13); ctx.stroke();
  const glow = d.breathing ? 1 : d.charge;
  if (glow > 0) {
    const gr = ctx.createRadialGradient(24, 0, 1, 24, 0, 26);
    gr.addColorStop(0, `rgba(255,200,90,${0.9 * glow})`); gr.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(24, 0, 26, 0, TAU); ctx.fill();
  }
  if (d.state !== 'sleep' && !d.dead) {
    ctx.fillStyle = '#ffb347'; ctx.shadowColor = '#ff8a2a'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(12, -6, 2, 0, TAU); ctx.moveTo(14, 6); ctx.arc(12, 6, 2, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  }
  ctx.restore();
  if (d.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(-4, 0, 44, 25, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawTelegraph(x, y, face, range, arc, k, col = '200,40,30') {
  ctx.fillStyle = `rgba(${col},${0.06 + k * 0.1})`;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, range, face - arc / 2, face + arc / 2); ctx.closePath(); ctx.fill();
}
function shade(hex, k) { const n = parseInt(hex.slice(1), 16), f = c => clamp(Math.round(c * k), 0, 255); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
// thú bốn chân: sói, chó hồ, sư tử vàng
function drawBeast(e) {
  const alpha = e.dead ? Math.max(0, 1 - e.t / 1.2) : 1;
  if (alpha <= 0) return;
  const B = e.T.beast || { col: '#6d6b64' }, sc = B.scale || 1, z = e.z || 0;
  shadow(e.x, e.y + 4 * sc, 18 * sc * (1 - z / 200), 8 * sc, 0.3 * alpha);
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(e.x, e.y - z); ctx.rotate(e.face); ctx.scale(sc, sc);
  const windup = e.state === 'atk' && e.atk && e.t < e.atk.wind, wk = windup ? Math.min(1, e.t / e.atk.wind) : 0;
  const lunging = e.state === 'atk' && e.atk && e.t >= e.atk.wind && e.t < e.atk.wind + (e.atk.act || 0.15);
  // lấy đà: thu người về sau, rung nhẹ, rồi vươn dài khi vồ
  const c = windup ? -9 * wk + (wk > 0.5 ? Math.sin(e.anim * 60) * 1.2 : 0) : lunging ? 6 : 0, leg = e.moving || z > 0 ? Math.sin(e.anim * 16) * 4 : 0, dark = shade(B.col, 0.7), light = shade(B.col, 1.12);
  // chân có bàn chân, viền tối
  for (const [bx, sy, ph] of [[8 + c, -1, 1], [8 + c, 1, -1], [-8, -1, -1], [-8, 1, 1]]) {
    const lx = bx + (bx > 0 ? 2 : -2) + leg * ph * (bx > 0 ? 1 : -1), ly = sy * 10.5;
    ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 4.6; ctx.beginPath(); ctx.moveTo(bx, sy * 5); ctx.lineTo(lx, ly); ctx.stroke();
    ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = shade(B.col, 0.55); ctx.beginPath(); ctx.arc(lx, ly, 2, 0, TAU); ctx.fill();
  }
  // đuôi xù có chóp sáng
  const tw = Math.sin(e.anim * 5) * 4;
  ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-13, 0); ctx.quadraticCurveTo(-20, tw * 0.5, -26, tw); ctx.stroke();
  ctx.strokeStyle = shade(B.col, 0.85); ctx.lineWidth = 4.4; ctx.stroke();
  ctx.strokeStyle = light; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-23, tw * 0.85); ctx.lineTo(-26.5, tw); ctx.stroke(); ctx.lineCap = 'butt';
  // thân: đổ sáng trên lưng, sống lưng tối, vệt lông
  ctx.fillStyle = e.dead ? dark : litGrad(B.col, c + 4, -3, 16); ctx.strokeStyle = OL; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(c, 0, 16, 8.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(c - 2, 0, 10, 2.6, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = shade(B.col, 0.72); ctx.lineWidth = 0.9;
  for (let k = -9; k <= 7; k += 4) { ctx.beginPath(); ctx.moveTo(c + k, -6.5); ctx.lineTo(c + k - 2.5, -3.8); ctx.moveTo(c + k, 6.5); ctx.lineTo(c + k - 2.5, 3.8); ctx.stroke(); }
  if (B.armor) {
    // giáp xích và tấm giáp lưng của chó săn pháo đài
    ctx.fillStyle = litGrad(B.armor, c + 2, -3, 11); ctx.strokeStyle = OL; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(c - 9, -6); ctx.quadraticCurveTo(c, -9, c + 9, -6); ctx.lineTo(c + 9, 6); ctx.quadraticCurveTo(c, 9, c - 9, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(20,20,24,.5)'; ctx.lineWidth = 0.8; for (const k of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(c + k, -7.5); ctx.lineTo(c + k, 7.5); ctx.stroke(); }
    ctx.fillStyle = '#c8ccd2'; for (const k of [-5, 0, 5]) { ctx.beginPath(); ctx.arc(c + k, 0, 1.1, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#6a3a1e'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(12 + c * 0.5, 0, 6.5, 2.1, 4.2); ctx.stroke();
  }
  if (B.mane) {
    ctx.fillStyle = B.mane; ctx.strokeStyle = OL; ctx.lineWidth = 1.3; ctx.beginPath();
    for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, r = k % 2 ? 9 : 12; ctx.lineTo(11 + c * 0.5 + Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // đầu, tai nhọn, mõm có mũi đen
  ctx.fillStyle = light; ctx.strokeStyle = OL; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(10, -4); ctx.lineTo(7.5, -10.5); ctx.lineTo(14, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, 4); ctx.lineTo(7.5, 10.5); ctx.lineTo(14, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = litGrad(B.col, 16 + c * 0.5, -2, 8); ctx.beginPath(); ctx.arc(14 + c * 0.5, 0, 7, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = shade(B.col, 0.9); ctx.beginPath(); ctx.ellipse(20 + c * 0.5, 0, 5, 3.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.ellipse(24.2 + c * 0.5, 0, 1.4, 1.9, 0, 0, TAU); ctx.fill();
  if (windup && wk > 0.3) { ctx.fillStyle = '#f4ecd8'; ctx.fillRect(22 + c * 0.5, -2.5, 3, 1.5); ctx.fillRect(22 + c * 0.5, 1, 3, 1.5); }
  if (!e.dead && e.state !== 'idle') { const big = windup && wk > 0.5; ctx.fillStyle = big ? '#fff2a0' : B.eye || '#ff5a3a'; ctx.beginPath(); ctx.arc(17 + c * 0.5, -2.6, big ? 2 : 1.2, 0, TAU); ctx.arc(17 + c * 0.5, 2.6, big ? 2 : 1.2, 0, TAU); ctx.fill(); }
  if (e.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(0, 0, 17, 9, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawBat(e) {
  const alpha = e.dead ? Math.max(0, 1 - e.t / 1.2) : 1;
  if (alpha <= 0) return;
  shadow(e.x, e.y + 14, 8, 4, 0.25 * alpha);
  // lấy đà: bay vọt lên, dang rộng cánh, mắt sáng lên rồi mới lao xuống
  const bw = e.state === 'atk' && e.atk && e.t < e.atk.wind ? Math.min(1, e.t / e.atk.wind) : 0;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(e.x - Math.cos(e.face) * bw * 8, e.y - 12 - bw * 12 - Math.sin(e.face) * bw * 8); ctx.rotate(e.face);
  const f = bw ? 0.9 : Math.sin(e.anim * 24);
  ctx.strokeStyle = OL; ctx.lineWidth = 1.2;
  for (const s of [-1, 1]) {
    const tip = s * (14 + f * 6);
    ctx.fillStyle = '#3a2a30'; ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-4, tip); ctx.quadraticCurveTo(-5, s * (10 + f * 4), -8, s * (8 + f * 3)); ctx.quadraticCurveTo(-5, s * 5, -3, s * 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#6a4a52'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(1, s * 1); ctx.lineTo(-4, tip); ctx.moveTo(-1, s * 2); ctx.lineTo(-8, s * (8 + f * 3)); ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2;
  }
  ctx.fillStyle = litGrad('#4a3238', 2, -1, 7); ctx.beginPath(); ctx.ellipse(0, 0, 7, 4.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4a3238'; ctx.beginPath(); ctx.moveTo(4, -2); ctx.lineTo(3, -5.5); ctx.lineTo(6, -2.5); ctx.moveTo(4, 2); ctx.lineTo(3, 5.5); ctx.lineTo(6, 2.5); ctx.fill();
  ctx.fillStyle = '#f4ecd8'; ctx.fillRect(7, -1.2, 1.6, 0.9); ctx.fillRect(7, 0.3, 1.6, 0.9);
  ctx.fillStyle = bw > 0.4 ? '#fff2a0' : '#ff4a3a'; ctx.beginPath(); ctx.arc(5, -1.5, bw > 0.4 ? 1.8 : 1, 0, TAU); ctx.moveTo(6, 1.5); ctx.arc(5, 1.5, bw > 0.4 ? 1.8 : 1, 0, TAU); ctx.fill();
  if (e.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 6, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawSpider(e) {
  const alpha = e.dead ? Math.max(0, 1 - e.t / 1.2) : 1;
  if (alpha <= 0) return;
  shadow(e.x, e.y + 4, 18, 10, 0.3 * alpha);
  // lấy đà: rướn người lùi lại, giơ hai chân trước và nanh lên
  const sw0 = e.state === 'atk' && e.atk && e.t < e.atk.wind ? Math.min(1, e.t / e.atk.wind) : 0;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(e.x - Math.cos(e.face) * sw0 * 6, e.y - Math.sin(e.face) * sw0 * 6); ctx.rotate(e.face);
  if (sw0) { ctx.strokeStyle = '#2a2622'; ctx.lineWidth = 2.6; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(6, s * 4); ctx.lineTo(14 + sw0 * 6, s * (10 + sw0 * 6)); ctx.lineTo(22 + sw0 * 4, s * (6 + sw0 * 4)); ctx.stroke(); } }
  ctx.strokeStyle = '#2a2622'; ctx.lineWidth = 2.2;
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const bx = 4 - i * 4, sw = Math.sin(e.anim * 14 + i * 1.3 + (s > 0 ? 1 : 0)) * (e.moving ? 4 : 1);
    ctx.beginPath(); ctx.moveTo(bx, s * 5); ctx.lineTo(bx + 4 - i * 3 + sw, s * 15); ctx.lineTo(bx + 8 - i * 6 + sw, s * 22); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(20,20,14,.9)'; for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const bx = 4 - i * 4, sw = Math.sin(e.anim * 14 + i * 1.3 + (s > 0 ? 1 : 0)) * (e.moving ? 4 : 1); ctx.beginPath(); ctx.arc(bx + 4 - i * 3 + sw, s * 15, 1.6, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = OL; ctx.lineWidth = 1.5;
  ctx.fillStyle = litGrad('#3a3a2e', -8, -4, 12); ctx.beginPath(); ctx.ellipse(-11, 0, 12, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8fc04a'; ctx.beginPath(); ctx.ellipse(-12, 0, 5, 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(143,192,74,.7)'; for (const k of [-18, -6]) { ctx.beginPath(); ctx.arc(k, -4.5, 1.4, 0, TAU); ctx.arc(k, 4.5, 1.4, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; for (const k of [-16, -8]) { ctx.beginPath(); ctx.arc(-11, 0, Math.abs(k + 11) + 4, -0.9, 0.9); ctx.stroke(); }
  ctx.strokeStyle = OL; ctx.lineWidth = 1.5;
  ctx.fillStyle = litGrad('#2f2f26', 7, -2, 7); ctx.beginPath(); ctx.arc(5, 0, 7, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#1a1a14'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(11, -2.5); ctx.quadraticCurveTo(14, -3, 14, -0.5); ctx.moveTo(11, 2.5); ctx.quadraticCurveTo(14, 3, 14, 0.5); ctx.stroke();
  ctx.fillStyle = sw0 > 0.4 ? '#fff2a0' : '#d0ff7a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(10, s * 2.5, sw0 > 0.4 ? 2 : 1.2, 0, TAU); ctx.fill(); }
  if (sw0 > 0.3) { ctx.fillStyle = '#f4ecd8'; ctx.fillRect(11, -2, 4, 1.5); ctx.fillRect(11, 0.5, 4, 1.5); }
  if (e.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(-4, 0, 16, 10, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
// ───────────────────────── quái đặc trưng từng vùng ─────────────────────────
// lấy đà (0..1) và lúc đang ra đòn, để mỗi con có tư thế báo trước dễ đọc
const eWind = e => (e.state === 'atk' && e.atk && e.t < e.atk.wind ? Math.min(1, e.t / e.atk.wind) : 0);
const eAct = e => e.state === 'atk' && e.atk && e.t >= e.atk.wind && e.t < e.atk.wind + (e.atk.act || e.atk.dur || e.atk.air || 0.2);
function mobBegin(e, rx, ry, lift = 0) {
  const alpha = e.dead ? Math.max(0, 1 - e.t / 1.2) : 1;
  if (alpha <= 0) return 0;
  const z = e.z || 0;
  shadow(e.x, e.y + 4, rx * (1 - Math.min(0.5, (z + lift) / 200)), ry * (1 - Math.min(0.5, (z + lift) / 200)), 0.32 * alpha);
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(e.x, e.y - z - lift); ctx.rotate(e.face);
  return alpha;
}
function mobEyes(x, y, gap, r, col, wk) {
  const big = wk > 0.5; ctx.fillStyle = big ? '#fff2a0' : col; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = big ? 8 : 4;
  ctx.beginPath(); ctx.arc(x, -gap, big ? r * 1.6 : r, 0, TAU); ctx.arc(x, gap, big ? r * 1.6 : r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
}
function mobFlash(e, rx, ry) { if (e.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill(); } }
function legLine(x0, y0, x1, y1, w, col) {
  ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = w + 1.8; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); ctx.lineCap = 'butt';
}
// Lợn rừng: lưng gù lông bờm, nanh cong trắng; lấy đà húc thì cúi đầu, cào chân, lùi người
function drawBoar(e) {
  if (!mobBegin(e, 20, 10)) return;
  const wk = eWind(e), act = eAct(e), charge = e.atk && e.atk.kind === 'charge';
  const pull = wk ? -7 * wk + (charge && wk > 0.3 ? Math.sin(e.anim * 50) * 1.5 : 0) : act ? 4 : 0;
  const run = e.moving || (act && charge) ? Math.sin(e.anim * (act ? 26 : 16)) * 4 : 0;
  const col = '#5e4632', dark = '#3a2a1e';
  for (const [bx, sy, ph] of [[8, -1, 1], [8, 1, -1], [-9, -1, -1], [-9, 1, 1]]) legLine(bx, sy * 6, bx + run * ph * (charge && wk ? 1.8 : 1), sy * 11.5, 3.4, dark);
  ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-17, 0); ctx.quadraticCurveTo(-22, Math.sin(e.anim * 8) * 3, -24, 2); ctx.stroke();
  ctx.fillStyle = e.dead ? dark : litGrad(col, pull + 3, -4, 18); ctx.strokeStyle = OL; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(pull - 1, 0, 18, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // bờm lông gai dọc sống lưng
  ctx.fillStyle = '#2a1e14'; ctx.beginPath(); ctx.moveTo(pull - 14, 0);
  for (let k = 0; k <= 8; k++) ctx.lineTo(pull - 14 + k * 3.4, (k % 2 ? -3.2 : 3.2) * (1 - Math.abs(k - 4) / 6));
  ctx.lineTo(pull + 13, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(30,20,12,.55)'; ctx.lineWidth = 0.9;
  for (let k = -12; k <= 10; k += 4) { ctx.beginPath(); ctx.moveTo(pull + k, -8); ctx.lineTo(pull + k - 3, -5); ctx.moveTo(pull + k, 8); ctx.lineTo(pull + k - 3, 5); ctx.stroke(); }
  // đầu cúi xuống khi lấy đà
  const hx = pull + 17 + (wk ? -2 * wk : 0) + (act ? 3 : 0), hs = 1 - wk * 0.12;
  ctx.fillStyle = '#4a3626'; ctx.beginPath(); ctx.moveTo(hx - 5, -5); ctx.lineTo(hx - 8, -10); ctx.lineTo(hx - 1, -7); ctx.closePath(); ctx.moveTo(hx - 5, 5); ctx.lineTo(hx - 8, 10); ctx.lineTo(hx - 1, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = litGrad('#6a4e38', hx + 2, -2, 8); ctx.beginPath(); ctx.ellipse(hx, 0, 9 * hs, 7.5 * hs, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9a6a5a'; ctx.beginPath(); ctx.ellipse(hx + 8, 0, 3, 4.2, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a1e18'; ctx.beginPath(); ctx.arc(hx + 8.6, -1.4, 0.9, 0, TAU); ctx.arc(hx + 8.6, 1.4, 0.9, 0, TAU); ctx.fill();
  // nanh cong, sáng lên khi sắp húc
  for (const s of [-1, 1]) { ctx.strokeStyle = OL; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(hx + 5, s * 3.5); ctx.quadraticCurveTo(hx + 11, s * 8, hx + 9, s * 11); ctx.stroke(); ctx.strokeStyle = wk > 0.5 ? '#fffbe8' : '#e8e0c8'; ctx.lineWidth = 2; ctx.stroke(); }
  if (!e.dead && e.state !== 'idle') mobEyes(hx + 3, 0, 4, 1.1, '#ff5a3a', wk);
  mobFlash(e, 19, 11); ctx.restore();
}
// Cóc độc: thân tròn sần, mắt lồi; lấy đà thè lưỡi thì túi cổ phồng tím, phun độc thì phồng xanh
function drawToad(e) {
  if (!mobBegin(e, 20, 12)) return;
  const wk = eWind(e), A = e.atk, act = eAct(e), leapAir = A && A.kind === 'leap' && e.t >= A.wind && e.t < A.wind + A.air;
  const sq = wk && A && A.kind === 'leap' ? 1 - wk * 0.18 : 1, sc = leapAir ? 1.12 : 1;
  ctx.scale(sc, sc * (2 - sq)); const col = '#5a7a3a';
  // chân sau gập to hai bên, chân trước nhỏ
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#4a6630'; ctx.strokeStyle = OL; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(-8, s * (leapAir ? 20 : 15), leapAir ? 12 : 9, 5, s * (leapAir ? 0.6 : 0.3), 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3e5628'; for (const t of [-1, 0, 1]) { ctx.beginPath(); ctx.arc(-14 - (leapAir ? 6 : 0), s * (19 + t * 3), 1.8, 0, TAU); ctx.fill(); }
    legLine(8, s * 8, 13, s * 14, 2.6, '#4a6630');
  }
  // túi cổ phồng lên khi lấy đà
  const sac = wk && A && A.kind !== 'leap' ? wk : act && A && A.tongue ? 0.6 : 0;
  if (sac) { ctx.fillStyle = A.kind === 'shot' ? 'rgba(160,215,90,.85)' : 'rgba(170,110,180,.85)'; ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(14, 0, 4 + sac * 6, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = e.dead ? '#3e5628' : litGrad(col, 3, -5, 18); ctx.strokeStyle = OL; ctx.lineWidth = 1.7;
  ctx.beginPath(); ctx.ellipse(0, 0, 17, 14, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // nốt sần và vệt độc trên lưng
  ctx.fillStyle = 'rgba(190,210,110,.55)';
  for (const [x, y, r] of [[-6, -5, 2.4], [-2, 6, 2], [4, -8, 1.7], [-10, 3, 1.6], [2, 1, 2.6], [-4, -10, 1.4], [7, 7, 1.5]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(120,70,130,.5)'; ctx.beginPath(); ctx.ellipse(-3, 0, 7, 2.2, 0, 0, TAU); ctx.fill();
  // miệng rộng và lưỡi thè ra
  ctx.strokeStyle = '#2a3a18'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(8, 0, 9, -0.9, 0.9); ctx.stroke();
  if (act && A && A.tongue) {
    const k = (e.t - A.wind) / A.act, len = Math.sin(Math.min(1, k) * Math.PI) * 92 + 8;
    ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(15 + len, 0); ctx.stroke();
    ctx.strokeStyle = '#e07a9a'; ctx.lineWidth = 3.2; ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#e88aa8'; ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(17 + len, 0, 4.2, 0, TAU); ctx.fill(); ctx.stroke();
  }
  // mắt lồi vàng, đồng tử dọc
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#6a8a42'; ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(8, s * 7.5, 4.6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = wk > 0.5 ? '#fff2a0' : '#e8c83a'; ctx.beginPath(); ctx.arc(9, s * 7.5, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1208'; ctx.fillRect(8.6, s * 7.5 - 2.2, 1, 4.4);
  }
  mobFlash(e, 17, 14); ctx.restore();
}
// Kỳ nhông tro: thân dài uốn lượn, vảy đen nứt lửa; lấy đà phun thì ngẩng đầu, cổ họng sáng dần
function drawSalamander(e) {
  if (!mobBegin(e, 22, 9)) return;
  const wk = eWind(e), A = e.atk, breath = A && A.kind === 'shot', act = eAct(e);
  const wv = Math.sin(e.anim * (e.moving ? 12 : 3)) * (e.moving ? 3.5 : 1.2), pull = wk && !breath ? -6 * wk : act && !breath ? 5 : 0;
  const spine = k => Math.sin(k * 0.22 + e.anim * (e.moving ? 12 : 3)) * (e.moving ? 3.2 : 1.2) * (1 - k / 40);
  // đuôi thuôn dài
  ctx.lineCap = 'round';
  for (const [w, c] of [[9, OL], [7, '#2e2622']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-8, spine(8)); for (let x = -12; x >= -40; x -= 4) ctx.lineTo(x, spine(-x) * 2.2); ctx.stroke(); }
  ctx.strokeStyle = '#ff8a3a'; ctx.lineWidth = 1.4; ctx.globalAlpha *= 0.8; ctx.beginPath(); ctx.moveTo(-12, spine(12) * 2.2); for (let x = -16; x >= -36; x -= 4) ctx.lineTo(x, spine(-x) * 2.2); ctx.stroke(); ctx.globalAlpha /= 0.8;
  ctx.lineCap = 'butt';
  // bốn chân xòe
  for (const [bx, s, ph] of [[7, -1, 1], [7, 1, -1], [-7, -1, -1], [-7, 1, 1]]) { const f = wv * ph; legLine(bx + pull * 0.5, s * 5, bx + 5 + f + pull * 0.5, s * 12, 2.6, '#3a302a'); ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.arc(bx + 5 + f + pull * 0.5, s * 12.5, 2, 0, TAU); ctx.fill(); }
  ctx.fillStyle = e.dead ? '#2a2420' : litGrad('#3e3430', pull + 2, -3, 14); ctx.strokeStyle = OL; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(pull, 0, 14, 6.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // vết nứt lửa trên lưng, sáng hơn khi lấy đà phun
  const glow = 0.55 + (breath ? wk * 0.45 : 0) + Math.sin(e.anim * 5) * 0.1;
  ctx.strokeStyle = `rgba(255,${140 + (breath ? wk * 80 : 0) | 0},60,${glow})`; ctx.lineWidth = 1.3; ctx.shadowColor = '#ff8a3a'; ctx.shadowBlur = 6;
  ctx.beginPath(); for (const [a, b, c, d] of [[-9, 0, -4, -2], [-4, -2, 1, 1], [1, 1, 6, -1], [-6, 3, -2, 4], [3, -3, 7, -4]]) { ctx.moveTo(pull + a, b); ctx.lineTo(pull + c, d); } ctx.stroke(); ctx.shadowBlur = 0;
  // đầu dẹt tam giác
  const hx = pull + 14 + (breath ? -2 * wk : 0), up = breath ? wk : 0;
  ctx.fillStyle = litGrad('#463a34', hx + 3, -2, 8); ctx.strokeStyle = OL; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(hx - 3, -5); ctx.quadraticCurveTo(hx + 8, -5.5 - up, hx + 11 + up * 2, 0); ctx.quadraticCurveTo(hx + 8, 5.5 + up, hx - 3, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (breath && wk > 0.1 || breath && act) {
    const g = ctx.createRadialGradient(hx + 10, 0, 1, hx + 10, 0, 10 + wk * 8); g.addColorStop(0, `rgba(255,230,150,${0.5 + wk * 0.5})`); g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx + 10, 0, 10 + wk * 8, 0, TAU); ctx.fill();
  }
  if (!e.dead && e.state !== 'idle') mobEyes(hx + 5, 0, 3, 1, '#ffb040', wk);
  mobFlash(e, 14, 7); ctx.restore();
}
// Đốm hồn: lõi sáng lơ lửng, đuôi lửa hồn bay ngược, đốm nhỏ quay quanh; lấy đà thì co lại rồi bừng sáng
function drawWisp(e) {
  const lift = 16 + Math.sin(e.anim * 2.4) * 4;
  const a0 = mobBegin(e, 8, 4, lift); if (!a0) return;
  const wk = eWind(e), nova = e.atk && e.atk.kind === 'nova', fl = 0.85 + Math.sin(e.anim * 13) * 0.15;
  ctx.globalAlpha = a0 * (1 - (e.fade || 0) * 0.8) * (0.75 + fl * 0.25);
  const r = 8 * (nova ? 1 - wk * 0.35 : 1 + wk * 0.25);
  const halo = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 3.6); halo.addColorStop(0, 'rgba(200,235,255,.55)'); halo.addColorStop(1, 'rgba(120,180,255,0)');
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, r * 3.6, 0, TAU); ctx.fill();
  // đuôi lửa hồn lượn sóng
  ctx.fillStyle = 'rgba(150,200,255,.55)'; ctx.beginPath(); ctx.moveTo(0, -r * 0.8);
  for (let k = 1; k <= 6; k++) ctx.lineTo(-k * 4.5, Math.sin(e.anim * 9 + k) * k * 0.9 - r * 0.8 * (1 - k / 6.5));
  for (let k = 6; k >= 1; k--) ctx.lineTo(-k * 4.5, Math.sin(e.anim * 9 + k) * k * 0.9 + r * 0.8 * (1 - k / 6.5));
  ctx.lineTo(0, r * 0.8); ctx.closePath(); ctx.fill();
  const core = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0.5, 0, 0, r); core.addColorStop(0, '#ffffff'); core.addColorStop(0.5, '#cfe8ff'); core.addColorStop(1, 'rgba(120,170,255,.4)');
  ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 14 + wk * 14; ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  if (nova && wk > 0.2) { ctx.strokeStyle = `rgba(200,235,255,${wk})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 30 * (1 - wk) + r, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = '#e8f6ff'; for (let k = 0; k < 3; k++) { const a = e.anim * 3 + k * TAU / 3; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.9, Math.sin(a) * r * 1.9, 1.4, 0, TAU); ctx.fill(); }
  if (!e.dead) { ctx.fillStyle = 'rgba(20,40,80,.7)'; ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.3, 1.2, 0, TAU); ctx.arc(r * 0.35, r * 0.3, 1.2, 0, TAU); ctx.fill(); }
  ctx.restore();
}
// Cua pha lê: mai rộng có gai pha lê, tám chân, hai càng lớn; lấy đà thì giương càng lên cao
function drawCrab(e) {
  if (!mobBegin(e, 22, 12)) return;
  const wk = eWind(e), A = e.atk, act = eAct(e), sw = A && A.swing ? A.swing : 0;
  const walk = e.moving ? e.anim * 14 : 0, col = '#6f9ab8';
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const bx = 6 - i * 5, ph = Math.sin(walk + i * 1.4 + (s > 0 ? 1.5 : 0)) * 3;
    ctx.lineJoin = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(bx, s * 9); ctx.lineTo(bx - 2 + ph, s * 17); ctx.lineTo(bx - 6 + ph, s * 23); ctx.stroke();
    ctx.strokeStyle = '#5a82a0'; ctx.lineWidth = 2.6; ctx.stroke();
  }
  // càng: bên nào đang vung thì giương lên
  for (const s of [-1, 1]) {
    const raise = wk && (sw === s || !sw) ? wk : 0, strike = act && sw === s ? 1 : 0;
    const ax = 12 + raise * -4 + strike * 10, ay = s * (12 + raise * 8 - strike * 6), open = 0.35 + raise * 0.4 - strike * 0.3;
    legLine(8, s * 7, ax, ay, 3.2, '#5a82a0');
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(-s * (0.3 + raise * 0.6) + strike * s * 0.4);
    ctx.fillStyle = litGrad('#7faac8', 3, -2, 8); ctx.strokeStyle = OL; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(4, 0, 7, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    for (const t of [-1, 1]) { ctx.beginPath(); ctx.moveTo(9, t * 1.5); ctx.quadraticCurveTo(15, t * (2 + open * 6), 17, t * open * 4); ctx.lineTo(10, t * 0.5); ctx.closePath(); ctx.fillStyle = t < 0 ? '#9fc4e0' : '#7faac8'; ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  ctx.fillStyle = e.dead ? '#4a6a84' : litGrad(col, 3, -5, 20); ctx.strokeStyle = OL; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(12, 0); ctx.quadraticCurveTo(12, -13, 0, -14); ctx.quadraticCurveTo(-14, -13, -15, 0); ctx.quadraticCurveTo(-14, 13, 0, 14); ctx.quadraticCurveTo(12, 13, 12, 0); ctx.fill(); ctx.stroke();
  // gai pha lê trên mai
  for (const [x, y, h, a] of [[-4, -5, 8, -0.5], [-6, 4, 9, 0.4], [1, 0, 10, 0.1], [-10, -1, 7, -0.2], [4, 7, 6, 0.7], [3, -8, 6, -0.8]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = 'rgba(210,240,255,.9)'; ctx.strokeStyle = 'rgba(60,100,140,.9)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-2.4, 0); ctx.lineTo(0, -h * 0.5); ctx.lineTo(2.4, 0); ctx.lineTo(0, h * 0.25); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(-0.6, -h * 0.4, 1, h * 0.35); ctx.restore();
  }
  // mắt trên cuống
  for (const s of [-1, 1]) { legLine(10, s * 3, 14, s * 4.5, 1.2, '#5a82a0'); ctx.fillStyle = '#1a1a24'; ctx.beginPath(); ctx.arc(14.5, s * 4.8, 1.8, 0, TAU); ctx.fill(); }
  if (A && A.kind === 'shot' && wk > 0.2) { ctx.fillStyle = 'rgba(220,245,255,.8)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(14 + k * 1.5, Math.sin(e.anim * 20 + k) * 2.5, 1.5 + wk, 0, TAU); ctx.fill(); } }
  mobFlash(e, 15, 14); ctx.restore();
}
// Sứa hồ: chuông trong suốt, lõi phát sáng, xúc tu trôi ra sau; lấy đà sóng điện thì co chuông, sáng dần
function drawJelly(e) {
  const lift = 6 + Math.sin(e.anim * 1.8) * 3;
  const a0 = mobBegin(e, 12, 6, lift); if (!a0) return;
  const wk = eWind(e), nova = e.atk && e.atk.kind === 'nova', pulse = Math.sin(e.anim * 3) * 0.06;
  const bell = 13 * (1 + pulse - (nova ? wk * 0.22 : 0));
  // xúc tu lượn sóng
  ctx.lineCap = 'round';
  for (let k = 0; k < 7; k++) {
    const oy = (k - 3) * 3.2; ctx.strokeStyle = k % 2 ? 'rgba(170,220,255,.55)' : 'rgba(210,170,255,.5)'; ctx.lineWidth = k % 2 ? 1.2 : 2;
    ctx.beginPath(); ctx.moveTo(-4, oy);
    for (let j = 1; j <= 6; j++) ctx.lineTo(-4 - j * 5, oy * (1 + j * 0.12) + Math.sin(e.anim * 4 + j * 0.9 + k) * 2.4);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  const g = ctx.createRadialGradient(-2, -3, 1, 0, 0, bell); g.addColorStop(0, 'rgba(235,245,255,.75)'); g.addColorStop(0.6, 'rgba(160,210,255,.45)'); g.addColorStop(1, 'rgba(190,150,255,.35)');
  ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 10 + wk * 18; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, bell, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  // diềm mép chuông
  ctx.strokeStyle = 'rgba(225,240,255,.8)'; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let k = 0; k <= 24; k++) { const a = k / 24 * TAU, rr = bell + Math.sin(a * 8 + e.anim * 5) * 1.2; k ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.stroke();
  // lõi bốn cánh phát sáng
  ctx.fillStyle = `rgba(255,${200 + wk * 55 | 0},${255},${0.55 + wk * 0.45})`; ctx.shadowColor = '#cfe8ff'; ctx.shadowBlur = 6 + wk * 10;
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + e.anim * 0.5; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 3.6, Math.sin(a) * 3.6, 3, 1.8, a, 0, TAU); ctx.fill(); }
  ctx.shadowBlur = 0;
  if (nova && wk > 0.3) { ctx.strokeStyle = `rgba(200,235,255,${wk * 0.8})`; ctx.lineWidth = 1.5; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + e.anim * 6; ctx.moveTo(Math.cos(a) * bell, Math.sin(a) * bell); ctx.lineTo(Math.cos(a + 0.3) * (bell + 6), Math.sin(a + 0.3) * (bell + 6)); } ctx.stroke(); }
  mobFlash(e, bell, bell); ctx.restore();
}
// Sách phép bay: hai bìa da mở, trang giấy lật phần phật, vòng phù chú xoay bên dưới khi niệm phép
function drawGrimoire(e) {
  const lift = 18 + Math.sin(e.anim * 2) * 3;
  const a0 = mobBegin(e, 10, 5, lift); if (!a0) return;
  const wk = eWind(e); ctx.globalAlpha = a0 * (1 - (e.fade || 0) * 0.85);
  if (wk > 0) {
    ctx.save(); ctx.rotate(e.anim * 2); ctx.strokeStyle = `rgba(174,228,255,${0.35 + wk * 0.6})`; ctx.lineWidth = 1.2; ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.stroke();
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 13, Math.sin(a) * 13); ctx.lineTo(Math.cos(a + 0.5) * 18, Math.sin(a + 0.5) * 18); ctx.stroke(); }
    ctx.restore(); ctx.shadowBlur = 0;
  }
  const flap = Math.sin(e.anim * (wk ? 18 : 7)) * 0.25, open = 0.9 + flap;
  // bìa: hai nửa mở ra theo trục gáy (trục x)
  for (const s of [-1, 1]) {
    const w = 11 * Math.cos((1 - open) * 1.2);
    ctx.fillStyle = s < 0 ? '#6a2e3e' : '#5a2434'; ctx.strokeStyle = OL; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.rect(-8, s > 0 ? 0 : -w, 16, w); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d8b45a'; for (const cx of [-8, 8]) { ctx.beginPath(); ctx.moveTo(cx, s * w); ctx.lineTo(cx + (cx < 0 ? 3 : -3), s * w); ctx.lineTo(cx, s * (w - 3)); ctx.closePath(); ctx.fill(); }
    // trang giấy
    ctx.fillStyle = '#efe4c8'; ctx.beginPath(); ctx.rect(-7, s > 0 ? 0.5 : -w + 1.5, 14, w - 2); ctx.fill();
    ctx.strokeStyle = 'rgba(90,70,120,.55)'; ctx.lineWidth = 0.7; ctx.beginPath(); for (let k = 2; k < w - 2; k += 2.2) { ctx.moveTo(-5.5, s * k); ctx.lineTo(5.5, s * k); } ctx.stroke();
  }
  // trang đang lật
  const fp = (e.anim * (wk ? 3 : 1)) % 1, py = Math.cos(fp * Math.PI) * 9;
  ctx.fillStyle = 'rgba(250,244,226,.9)'; ctx.strokeStyle = 'rgba(120,100,70,.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.rect(-6.5, Math.min(0, py), 13, Math.abs(py)); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a1a24'; ctx.fillRect(-8.5, -1, 17, 2);
  // chữ rune phát sáng trên trang
  ctx.fillStyle = `rgba(174,228,255,${0.6 + wk * 0.4})`; ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 6 + wk * 10;
  ctx.beginPath(); ctx.arc(0, -5, 1.6 + wk, 0, TAU); ctx.arc(0, 5, 1.6 + wk, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  mobFlash(e, 9, 11); ctx.restore();
}
// Đại bàng vàng: sải cánh rộng có lông ống tách rời; lấy đà thì vút lên, khép cánh, lao xuống
function drawEagle(e) {
  const wk = eWind(e), act = eAct(e);
  const lift = 20 + wk * 14 - (act ? 12 : 0) + Math.sin(e.anim * 3) * 2;
  const a0 = mobBegin(e, 14, 6, lift); if (!a0) return;
  ctx.translate(-wk * 8, 0);
  const flap = wk ? 0.2 : act ? -0.6 : Math.sin(e.anim * 9) * 0.35, span = 30 * (act ? 0.55 : 1 - wk * 0.15);
  for (const s of [-1, 1]) {
    ctx.save(); ctx.scale(1, s);
    const tipY = span * (1 + flap * 0.3), back = wk ? -10 : act ? -12 : -4;
    ctx.fillStyle = litGrad('#8a6a30', 0, 8, 18); ctx.strokeStyle = OL; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(5, 3); ctx.quadraticCurveTo(4, tipY * 0.5, back + 2, tipY); ctx.lineTo(back - 6, tipY - 2);
    for (let k = 0; k < 5; k++) ctx.lineTo(back - 8 - k * 1.8, tipY - 4 - k * 4.5), ctx.lineTo(back - 5 - k * 2, tipY - 6 - k * 4.5);
    ctx.quadraticCurveTo(-8, 8, -6, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,26,10,.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); for (let k = 0; k < 5; k++) { ctx.moveTo(-2 - k, 5 + k * 3); ctx.lineTo(back - 6 - k * 1.8, tipY - 5 - k * 4.5); } ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,140,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4, 4); ctx.quadraticCurveTo(3, tipY * 0.5, back + 1, tipY - 1); ctx.stroke();
    ctx.restore();
  }
  // đuôi xòe
  ctx.fillStyle = '#6a4e22'; ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(-18, -6); ctx.lineTo(-19, 0); ctx.lineTo(-18, 6); ctx.lineTo(-6, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = litGrad('#8a6a30', 2, -2, 9); ctx.beginPath(); ctx.ellipse(0, 0, 9, 5.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // đầu trắng vàng, mỏ quặp
  ctx.fillStyle = litGrad('#f0e2b8', 9, -1, 5); ctx.beginPath(); ctx.arc(9, 0, 4.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8b83a'; ctx.beginPath(); ctx.moveTo(12.5, -1.8); ctx.quadraticCurveTo(17, -0.5, 15.5, 2); ctx.lineTo(12.5, 1.8); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (!e.dead) mobEyes(10.5, 0, 2.2, 0.9, '#ffcf5a', wk);
  mobFlash(e, 10, 7); ctx.restore();
}
// Dê núi: lông xoăn dày, sừng vàng cuộn; lấy đà húc thì cúi đầu, dậm chân, lùi người
function drawRam(e) {
  if (!mobBegin(e, 21, 11)) return;
  const wk = eWind(e), act = eAct(e), charge = e.atk && e.atk.kind === 'charge';
  const pull = wk ? -7 * wk : act ? 5 : 0, run = e.moving || (act && charge) ? Math.sin(e.anim * (act ? 24 : 14)) * 4 : 0;
  const stomp = charge && wk > 0.3 ? Math.abs(Math.sin(e.anim * 30)) * 3 : 0;
  for (const [bx, sy, ph] of [[9, -1, 1], [9, 1, -1], [-9, -1, -1], [-9, 1, 1]]) legLine(bx + (bx > 0 ? stomp : 0), sy * 6, bx + run * ph + (bx > 0 ? stomp : 0), sy * 12, 2.6, '#4a4238');
  ctx.fillStyle = '#e8e0cc'; ctx.strokeStyle = OL; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(pull - 18, 0, 3, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = e.dead ? '#a89e88' : litGrad('#d8cfb8', pull + 2, -4, 18); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(pull - 1, 0, 17, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // lông xoăn: các cuộn tròn nhỏ
  ctx.strokeStyle = 'rgba(120,108,88,.55)'; ctx.lineWidth = 1;
  for (const [x, y] of [[-10, -5], [-4, -7], [2, -6], [8, -4], [-12, 2], [-6, 1], [0, 0], [6, 3], [-8, 7], [-1, 7], [5, 7], [-14, -2]]) { ctx.beginPath(); ctx.arc(pull + x, y, 2.3, 0.3, 5.5); ctx.stroke(); }
  // đầu cúi, sừng vàng cuộn hai bên
  const hx = pull + 16 + (act ? 3 : 0);
  ctx.fillStyle = litGrad('#7a6e5c', hx + 2, -1, 7); ctx.strokeStyle = OL; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(hx, 0, 7.5, 5.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5a5044'; ctx.beginPath(); ctx.ellipse(hx + 6, 0, 3, 3.6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  for (const s of [-1, 1]) {
    ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 5.2; ctx.beginPath(); ctx.moveTo(hx - 1, s * 3); ctx.bezierCurveTo(hx - 8, s * 12, hx + 4, s * 16, hx + 5, s * 9); ctx.stroke();
    const hg = ctx.createLinearGradient(hx - 6, 0, hx + 6, 0); hg.addColorStop(0, '#8a6a2a'); hg.addColorStop(0.5, wk > 0.5 ? '#fff0b0' : '#e2c26c'); hg.addColorStop(1, '#9a7a3a');
    ctx.strokeStyle = hg; ctx.lineWidth = 3.6; ctx.stroke();
    ctx.strokeStyle = 'rgba(90,60,20,.6)'; ctx.lineWidth = 0.8; for (let k = 0.2; k < 1; k += 0.2) { const x = hx - 1 + (k * 6), y = s * (3 + k * 10); ctx.beginPath(); ctx.moveTo(x - 1.5, y); ctx.lineTo(x + 1.5, y + s * 0.5); ctx.stroke(); }
    ctx.lineCap = 'butt';
  }
  if (!e.dead && e.state !== 'idle') mobEyes(hx + 2, 0, 3.4, 1, '#ffcf5a', wk);
  mobFlash(e, 18, 11); ctx.restore();
}
// bộ xương nằm rã thành đống, rung lên khi sắp tự ráp lại
function drawBonePile(e) {
  const shakeK = e.t > 2.2 ? Math.sin(e.anim * 50) * (e.t - 2.2) * 2 : 0;
  shadow(e.x, e.y + 3, 14, 6, 0.3);
  ctx.save(); ctx.translate(e.x + shakeK, e.y);
  ctx.lineCap = 'round';
  for (const [x0, y0, x1, y1] of [[-12, -2, 2, 4], [-4, -8, 8, -2], [4, 6, 14, 2], [-10, 6, -2, 8], [-2, -1, 6, 8]]) {
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = '#d8d0bc'; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.fillStyle = '#e8e0cc'; for (const [x, y] of [[x0, y0], [x1, y1]]) { ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill(); }
  }
  ctx.lineCap = 'butt';
  ctx.strokeStyle = 'rgba(80,70,50,.8)'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(-1, 1, 3 + k * 1.8, -0.6, 0.6); ctx.stroke(); }
  ctx.fillStyle = litGrad('#e0d8c2', 5, -3, 6); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(4, -4, 5.4, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.arc(6.2, -5.8, 1.3, 0, TAU); ctx.arc(6.2, -2.2, 1.3, 0, TAU); ctx.fill();
  if (e.t > 2.2) { ctx.fillStyle = `rgba(255,120,70,${Math.min(1, (e.t - 2.2))})`; ctx.shadowColor = '#ff7a4a'; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(6.2, -5.8, 0.9, 0, TAU); ctx.arc(6.2, -2.2, 0.9, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; }
  ctx.restore();
}
const MOB_DRAW = { boar: drawBoar, toad: drawToad, salamander: drawSalamander, wisp: drawWisp, crab: drawCrab, jelly: drawJelly, grimoire: drawGrimoire, eagle: drawEagle, ram: drawRam };
function drawEnemy(e) {
  if (!inView(e.x, e.y, 80)) return;
  if (e.dead && e.t > 1.3) return;
  if (!e.dead && (e.aff || e.invader)) {
    // vòng hào quang dưới chân quái tinh anh và Kẻ Xâm Nhập
    const c = e.invader ? '255,80,60' : AFFIXES[e.aff[0]].col, rr = e.r * 2.4 + Math.sin(e.anim * 4) * 3;
    const gr = ctx.createRadialGradient(e.x, e.y, 2, e.x, e.y, rr);
    gr.addColorStop(0, `rgba(${c},.34)`); gr.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(e.x, e.y, rr, 0, TAU); ctx.fill();
  }
  // không vẽ vệt báo đòn: người chơi đọc động tác vung vũ khí để né
  if (e.state === 'bones') { drawBonePile(e); return; }
  if (e.T.draw) { MOB_DRAW[e.T.draw](e); drawEnemyBar(e); return; }
  if (e.T.beast) { drawBeast(e); drawEnemyBar(e); return; }
  if (e.T.flier) { drawBat(e); drawEnemyBar(e); return; }
  if (e.type === 'spider') { drawSpider(e); drawEnemyBar(e); return; }
  const L = e.T.look;
  let wAng = 0.6, trail = null, charge = 0, thrust = 0;
  if (e.state === 'atk' && e.atk) {
    const A = e.atk, t = e.t, k = A.kind || 'melee';
    if (k === 'shot' || k === 'lob' || k === 'orbs' || k === 'summon' || k === 'pillars' || k === 'rain' || k === 'nova' || k === 'healall') { charge = t < A.wind ? t / A.wind : 0; wAng = L.weapon === 'bow' ? -0.3 : -0.2; }
    else if (k === 'leap') wAng = 2.6;
    else if (k === 'warp') wAng = 1.2;
    else if (k === 'slam') wAng = t < A.wind ? lerp(0.6, 2.8, Math.min(1, t / A.wind)) : 0;
    else if (k === 'charge') wAng = -0.3;
    else if (k === 'blink') wAng = 1.2;
    else if (A.thrust) { wAng = -0.12; thrust = t < A.wind ? -0.5 * t / A.wind : t < A.wind + A.act ? 1 : 1 - (t - A.wind - A.act) / A.rec; }
    else if (t < A.wind) wAng = weaponAngle('wind', t / A.wind, A.swing);
    else if (t < A.wind + A.act) { wAng = weaponAngle('act', (t - A.wind) / A.act, A.swing); trail = [1.8 * A.swing, wAng]; }
    else wAng = weaponAngle('rec', (t - A.wind - A.act) / A.rec, A.swing);
  } else if (e.state === 'broken') wAng = 1.3;
  const jitter = e.state === 'stagger' ? rand(-2, 2) : 0;
  let alpha = e.dead ? Math.max(0, 1 - e.t / 1.2) : undefined;
  if (e.T.ghost) alpha = (alpha ?? 1) * (0.62 + Math.sin(e.anim * 5) * 0.08) * (1 - (e.fade || 0) * 0.85);
  else if (e.fade) alpha = (alpha ?? 1) * (1 - e.fade * 0.85);
  const z = (e.z || 0) + (e.T.floats && !e.dead ? 10 + Math.sin(e.anim * 2) * 4 : 0);
  if (e.state === 'phase') { const gr = ctx.createRadialGradient(e.x, e.y, 4, e.x, e.y, 90); gr.addColorStop(0, 'rgba(255,240,200,.35)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(e.x, e.y, 90, 0, TAU); ctx.fill(); }
  drawHumanoid(e.x + jitter, e.y, e.face, L, wAng, {
    anim: e.anim, trail, thrust, z, aura: e.p2, trailCol: e.T.ghost ? 'rgba(200,240,255,.4)' : 'rgba(255,200,170,.3)', flash: e.hurtFlash > 0, charge, kneel: e.state === 'broken' || e.dead,
    alpha, eyes: e.elite && !e.dead ? (e.T.ghost ? '#bff5ff' : '#ff7a4a') : null, shield: e.T.shield ? (e.state === 'atk' ? 1 : 3) : 0,
    twoHand: !e.T.shield && TWO_HAND.has(L.weapon),
  });
  drawEnemyBar(e);
}
function drawEnemyBar(e) {
  if (e.dead || e.isBoss) return;
  const w = e.elite ? 54 : 34, x = e.x - w / 2, y = e.y - e.r * (e.T.look ? e.T.look.scale : 1) - 22;
  if (e.aff) {
    wText(e.aff.map(k => AFFIXES[k].name).join(' · '), e.x, y - 5, 9, `rgb(${AFFIXES[e.aff[0]].col})`, 1);
  }
  if (e.hp >= e.maxHp) { e.barG = e.hp; return; }
  // phần máu vừa mất ánh vàng rồi rút dần, như thanh máu của boss
  e.barG = e.barG > e.hp ? Math.max(e.hp, e.barG - e.maxHp * 0.5 / 60) : e.hp;
  const f = e.hp / e.maxHp, h = 4;
  ctx.fillStyle = 'rgba(8,7,5,.85)'; ctx.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
  ctx.strokeStyle = e.elite ? 'rgba(242,220,151,.85)' : 'rgba(214,178,94,.45)'; ctx.lineWidth = 0.8; ctx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
  ctx.fillStyle = 'rgba(40,34,26,.9)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#d9b85c'; ctx.fillRect(x, y, w * e.barG / e.maxHp, h);
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#e0503c'); g.addColorStop(0.5, '#a3201c'); g.addColorStop(1, '#5e100c');
  ctx.fillStyle = g; ctx.fillRect(x, y, w * f, h); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x, y, w * f, 1);
  if (e.elite) { ctx.fillStyle = '#f2dc97'; for (const ex of [x - 1.5, x + w + 1.5]) { ctx.beginPath(); ctx.moveTo(ex, y - 1); ctx.lineTo(ex + (ex < x ? -3 : 3), y + h / 2); ctx.lineTo(ex, y + h + 1); ctx.closePath(); ctx.fill(); } }
  if (e.state === 'broken') { ctx.fillStyle = '#f2dc97'; ctx.shadowColor = '#f2dc97'; ctx.shadowBlur = 6; ctx.fillRect(x, y + h + 2, w, 1.5); ctx.shadowBlur = 0; }
  if (e.bleed > 0) { ctx.fillStyle = 'rgba(8,7,5,.8)'; ctx.fillRect(x, y + h + 4, w, 2.5); ctx.fillStyle = '#e0503c'; ctx.fillRect(x, y + h + 4, w * Math.min(1, e.bleed / (e.elite ? 110 : 60)), 2.5); }
}
function drawBoss() {
  const b = boss;
  if (!b || !inView(b.x, b.y, 200)) return;
  if (b.dead && b.t > 2.5) return;
  if (b.state === 'atk' && b.atk) {
    const s = b.atk.steps[b.atk.i], t = b.atk.t;
    if (s && s.k === 'hammer' && t < s.wind) { const hx = b.x + Math.cos(b.face) * 85, hy = b.y + Math.sin(b.face) * 85; ctx.strokeStyle = `rgba(255,210,110,${0.2 + t / s.wind * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, 95, 0, TAU); ctx.stroke(); }
  }
  let wAng = 0.5, trail = null, hammer;
  if (b.state === 'dormant') wAng = 0.15;
  else if (b.state === 'atk' && b.atk) {
    const s = b.atk.steps[b.atk.i], t = b.atk.t;
    if (s.k === 'swing') {
      if (t < s.wind) wAng = weaponAngle('wind', t / s.wind, s.swing);
      else if (t < s.wind + s.act) { wAng = weaponAngle('act', (t - s.wind) / s.act, s.swing); trail = [1.8 * s.swing, wAng]; }
      else wAng = weaponAngle('rec', (t - s.wind - s.act) / s.rec, s.swing);
    } else if (s.k === 'hammer') { if (t < s.wind) { hammer = t / s.wind; wAng = lerp(0.3, 2.9, Math.min(1, t / s.wind * 1.4)); } else { hammer = 1; wAng = 0; } }
    else if (s.k === 'throw') wAng = t < s.wind ? 2.2 : -0.6;
    else if (s.k === 'leap') wAng = 2.6;
  } else if (b.state === 'broken') wAng = 1.3;
  drawHumanoid(b.x, b.y, b.face, b.look, wAng, {
    anim: b.anim, trail, trailCol: 'rgba(255,214,120,.45)', flash: b.hurtFlash > 0, z: b.z, hammer, twoHand: true,
    kneel: b.state === 'dormant' || b.state === 'broken' || b.dead, aura: b.phase === 2 && !b.dead,
    alpha: b.dead ? Math.max(0, 1 - b.t / 2.4) : undefined, eyes: b.dead ? null : '#ffcf5a',
  });
}
function drawPuzzles() {
  const t = G.clock;
  for (const q of puddles) {
    if (!inView(q.x, q.y, 60)) continue;
    const a = Math.min(1, (q.life - q.t) / 1.2) * 0.55;
    ctx.fillStyle = `rgba(120,190,70,${a})`; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r, q.r * 0.7, 0, 0, TAU); ctx.fill();
  }
  for (const b of BRAZIERS) {
    if (!inView(b.x, b.y, 60)) continue;
    const lit = S.fortOpen || G.braziers.includes(b.id);
    shadow(b.x + 2, b.y + 8, 15, 7, 0.35);
    // lò sắt ba chân: vành có đinh tán, lòng lò chứa than (than đỏ khi đã thắp)
    ctx.strokeStyle = '#2a261e'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.5; ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * 10, b.y + Math.sin(a) * 10); ctx.lineTo(b.x + Math.cos(a) * 17, b.y + Math.sin(a) * 17 + 3); ctx.stroke(); }
    ctx.lineCap = 'butt';
    ctx.fillStyle = litGrad('#6a655a', -4, -4, 13); ctx.save(); ctx.translate(b.x, b.y); ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#1e1b16'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, b.y, 13, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#b8b0a0'; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * 11, b.y + Math.sin(a) * 11, 1, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#1e1b16'; ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, TAU); ctx.fill();
    for (let k = 0; k < 6; k++) { const a = k * 1.7 + b.x, d = (k % 3) * 2.4; ctx.fillStyle = lit ? (k % 2 ? '#ff7a2a' : '#ffb347') : (k % 2 ? '#2e2a24' : '#3a352c'); ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, 2.2, 0, TAU); ctx.fill(); }
    if (lit) {
      const gr = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, 60);
      gr.addColorStop(0, 'rgba(255,170,70,.45)'); gr.addColorStop(1, 'rgba(255,170,70,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(b.x, b.y, 60, 0, TAU); ctx.fill();
      if (Math.random() < 0.6) addPart(b.x + rand(-5, 5), b.y - 4, rand(-8, 8), rand(-70, -40), 0.45, rand(4, 7), FIRE_COLS[(Math.random() * 4) | 0], 'fire');
    }
  }
  for (const f of MAP_FRAGS) {
    if (!inView(f.x, f.y, 60)) continue;
    const read = S.frags.includes(f.id), pulse = 0.6 + Math.sin(t * 2.5 + f.x) * 0.4;
    shadow(f.x + 3, f.y + 6, 13, 6, 0.35);
    if (!read) { const gr = ctx.createRadialGradient(f.x, f.y - 16, 2, f.x, f.y - 16, 46); gr.addColorStop(0, `rgba(190,215,255,${0.25 * pulse})`); gr.addColorStop(1, 'rgba(190,215,255,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(f.x, f.y - 16, 46, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#5d5a52'; ctx.strokeStyle = '#2a2822'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(f.x - 9, f.y + 4); ctx.lineTo(f.x - 7, f.y - 30); ctx.lineTo(f.x, f.y - 38); ctx.lineTo(f.x + 7, f.y - 30); ctx.lineTo(f.x + 9, f.y + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    // bia có hai mặt vát (trái sáng, phải tối), bệ đá dưới chân và rêu
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.moveTo(f.x, f.y - 38); ctx.lineTo(f.x + 7, f.y - 30); ctx.lineTo(f.x + 9, f.y + 4); ctx.lineTo(f.x + 1, f.y + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(f.x, f.y - 38); ctx.lineTo(f.x - 7, f.y - 30); ctx.lineTo(f.x - 6, f.y - 14); ctx.lineTo(f.x - 2, f.y - 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a4740'; ctx.strokeStyle = '#2a2822'; ctx.lineWidth = 1.3; ctx.fillRect(f.x - 12, f.y + 2, 24, 5); ctx.strokeRect(f.x - 12, f.y + 2, 24, 5);
    ctx.fillStyle = 'rgba(96,120,58,.6)'; ctx.beginPath(); ctx.arc(f.x - 7, f.y + 1, 2.5, 0, TAU); ctx.arc(f.x + 6, f.y - 2, 1.8, 0, TAU); ctx.fill();
    ctx.strokeStyle = read ? 'rgba(200,190,160,.5)' : `rgba(200,225,255,${0.6 + 0.4 * pulse})`; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(f.x, f.y - 20, 4, 0, TAU); ctx.moveTo(f.x, f.y - 29); ctx.lineTo(f.x, f.y - 8); ctx.moveTo(f.x - 5, f.y - 13); ctx.lineTo(f.x + 5, f.y - 13); ctx.stroke();
  }
  for (const st of STATUES) {
    if (!inView(st.x, st.y, 60)) continue;
    const on = S.statues.includes(st.id);
    shadow(st.x + 2, st.y + 8, 17, 8, 0.35);
    if (on) { const gr = ctx.createRadialGradient(st.x, st.y, 2, st.x, st.y, 55); gr.addColorStop(0, 'rgba(150,250,235,.4)'); gr.addColorStop(1, 'rgba(150,250,235,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(st.x, st.y, 55, 0, TAU); ctx.fill(); }
    // tượng kỵ sĩ quỳ trên bệ: bệ vát, vai, đầu đội mũ, kiếm cắm trước mặt
    const sc = on ? '#b8d8d2' : '#8d8b82';
    ctx.fillStyle = '#7b7a72'; ctx.strokeStyle = '#2a2924'; ctx.lineWidth = 1.5; ctx.fillRect(st.x - 15, st.y - 4, 30, 13); ctx.strokeRect(st.x - 15, st.y - 4, 30, 13);
    ctx.fillStyle = '#9a988e'; ctx.fillRect(st.x - 15, st.y - 4, 30, 2); ctx.fillStyle = '#55544c'; ctx.fillRect(st.x - 15, st.y + 7, 30, 2);
    ctx.save(); ctx.translate(st.x, st.y - 12);
    ctx.fillStyle = litGrad(sc, -3, -4, 12); ctx.strokeStyle = '#2a2924'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
    for (const sx of [-8, 8]) { ctx.beginPath(); ctx.arc(sx, -4, 4, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, -12, 6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,30,26,.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-3, -12); ctx.lineTo(3, -12); ctx.stroke();
    ctx.strokeStyle = '#2a2924'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, 16); ctx.stroke();
    ctx.strokeStyle = sc; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = sc; ctx.fillRect(-4, 1, 8, 2);
    ctx.restore();
    if (on && Math.random() < 0.2) addPart(st.x + rand(-10, 10), st.y - 20, 0, -30, 0.9, 2, '#bff5ee', 'mote');
  }
  if (!S.coloDone && inView(FLAG.x, FLAG.y, 60)) {
    // cờ máu: cán có viền và chóp đồng, lá cờ gợn sóng có viền và biểu tượng đầu lâu đơn giản
    shadow(FLAG.x + 2, FLAG.y + 8, 8, 3, 0.35);
    olLine(FLAG.x, FLAG.y + 8, FLAG.x, FLAG.y - 42, 2.6, '#5a4630');
    ctx.fillStyle = '#d8b45a'; ctx.beginPath(); ctx.arc(FLAG.x, FLAG.y - 43, 2.4, 0, TAU); ctx.fill();
    const wv = Math.sin(t * 4) * 3, wv2 = Math.sin(t * 4 + 1.3) * 2.5;
    ctx.fillStyle = G.colo.active ? '#5a1a16' : '#9e2a22'; ctx.strokeStyle = OL; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(FLAG.x, FLAG.y - 40); ctx.quadraticCurveTo(FLAG.x + 14, FLAG.y - 40 + wv2, FLAG.x + 28, FLAG.y - 36 + wv); ctx.lineTo(FLAG.x + 22, FLAG.y - 30 + wv); ctx.lineTo(FLAG.x + 28, FLAG.y - 24 + wv); ctx.quadraticCurveTo(FLAG.x + 14, FLAG.y - 25 + wv2, FLAG.x, FLAG.y - 24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(240,220,200,.8)'; ctx.beginPath(); ctx.arc(FLAG.x + 11, FLAG.y - 32 + wv2 * 0.5, 3, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a1a16'; ctx.fillRect(FLAG.x + 9.5, FLAG.y - 32.5 + wv2 * 0.5, 1.2, 1.2); ctx.fillRect(FLAG.x + 11.5, FLAG.y - 32.5 + wv2 * 0.5, 1.2, 1.2);
  }
}
function drawObjects() {
  const t = G.clock;
  for (const l of LEVERS) {
    if (!inView(l.x, l.y, 40)) continue;
    const on = S.levers.includes(l.id);
    shadow(l.x + 2, l.y + 6, 12, 5, 0.35);
    // bệ sắt có đinh tán và rãnh gạt, cần có viền, núm đồng sáng
    ctx.fillStyle = '#4a4540'; ctx.strokeStyle = OL; ctx.lineWidth = 1.4; ctx.fillRect(l.x - 11, l.y - 5, 22, 11); ctx.strokeRect(l.x - 11, l.y - 5, 22, 11);
    ctx.fillStyle = '#1a1814'; ctx.fillRect(l.x - 7, l.y - 1, 14, 3);
    ctx.fillStyle = '#9a9080'; for (const dx of [-8.5, 8.5]) for (const dy of [-2.5, 3.5]) { ctx.beginPath(); ctx.arc(l.x + dx, l.y + dy, 0.9, 0, TAU); ctx.fill(); }
    olLine(l.x, l.y, l.x + (on ? 12 : -12), l.y - 22, 3, '#8a8070');
    ctx.fillStyle = on ? '#8a8070' : '#d8b45a'; ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(l.x + (on ? 12 : -12), l.y - 22, 4.2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(l.x + (on ? 11 : -13), l.y - 23.5, 1.3, 0, TAU); ctx.fill();
  }
  for (const d of DOORS) {
    if (!inView(d.x, d.y, 60)) continue;
    const pulse = 0.6 + Math.sin(t * 2 + d.x) * 0.4;
    if (d.kind === 'enter') {
      shadow(d.x, d.y + 8, 40, 14, 0.4);
      // cổng hầm mộ: khối đá xây, vòm có đá khóa, lòng tối sâu dần, hai ngọn đuốc
      ctx.fillStyle = '#5a554c'; ctx.fillRect(d.x - 34, d.y - 26, 68, 34);
      ctx.strokeStyle = 'rgba(28,24,18,.55)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let y = d.y - 26 + 8.5; y < d.y + 8; y += 8.5) { ctx.moveTo(d.x - 34, y); ctx.lineTo(d.x + 34, y); }
      for (let r0 = 0; r0 < 4; r0++) for (let x = d.x - 34 + (r0 % 2 ? 8 : 0); x < d.x + 34; x += 16) { const y = d.y - 26 + r0 * 8.5; ctx.moveTo(x, y); ctx.lineTo(x, y + 8.5); }
      ctx.stroke();
      const dg = ctx.createLinearGradient(0, d.y - 24, 0, d.y + 8); dg.addColorStop(0, '#000'); dg.addColorStop(1, '#241e18');
      ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(d.x - 20, d.y + 8); ctx.lineTo(d.x - 20, d.y - 10); ctx.quadraticCurveTo(d.x, d.y - 30, d.x + 20, d.y - 10); ctx.lineTo(d.x + 20, d.y + 8); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8a8474'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(d.x - 21, d.y + 8); ctx.lineTo(d.x - 21, d.y - 10); ctx.quadraticCurveTo(d.x, d.y - 31, d.x + 21, d.y - 10); ctx.lineTo(d.x + 21, d.y + 8); ctx.stroke();
      ctx.fillStyle = '#a8a090'; ctx.fillRect(d.x - 3, d.y - 24, 6, 7);
      ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.strokeRect(d.x - 34, d.y - 26, 68, 34);
      for (const sx of [-27, 27]) { ctx.fillStyle = '#3a2f24'; ctx.fillRect(d.x + sx - 1.5, d.y - 14, 3, 10); ctx.fillStyle = FIRE_COLS[((t * 12) | 0) % 4]; ctx.beginPath(); ctx.ellipse(d.x + sx, d.y - 17, 3, 4.5 + Math.sin(t * 20 + sx) * 1, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = `rgba(255,214,140,${0.25 * pulse})`; ctx.beginPath(); ctx.arc(d.x, d.y - 4, 12, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = '#2a2622'; ctx.fillRect(d.x - 40, d.y - 12, 80, 26);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = `rgb(${70 + i * 12},${64 + i * 11},${56 + i * 10})`; ctx.fillRect(d.x - 36 + i * 3, d.y - 10 + i * 6, 72 - i * 6, 5); }
      ctx.fillStyle = `rgba(255,240,200,${0.18 * pulse})`; ctx.fillRect(d.x - 40, d.y + 10, 80, 6);
    }
  }
  for (const n of NPCS) {
    if (!inView(n.x, n.y, 60)) continue;
    const L = { body: n.col, trim: '#d8c8a0', head: '#b89a7a', cloak: shade(n.col, 0.6), weapon: n.id === 'smith' ? 'club' : 'staff', wlen: 26, wcol: n.id === 'smith' ? '#5a5048' : '#6b5a3e', scale: 1.1, hood: n.id !== 'smith', orb: n.id === 'scholar' ? '#aee4ff' : '#ffe08a' };
    const nf = Math.atan2(P.y - n.y, P.x - n.x);
    drawHumanoid(n.x, n.y, nf, L, 0.6, { anim: t });
    if (n.id === 'merchant') drawNpcPack(n, nf, t);
    drawNpcProps(n, nf, t);
    if (n.id === 'smith') {
      // đe sắt có sừng nhọn, và lò rèn đá có than hồng phập phồng
      const ax = n.x - 26, ay = n.y + 24;
      ctx.fillStyle = '#2a2724'; ctx.fillRect(ax - 5, ay + 2, 10, 8);
      ctx.fillStyle = litGrad('#5a5650', -4, -3, 14); ctx.strokeStyle = OL; ctx.lineWidth = 1.4;
      ctx.save(); ctx.translate(ax, ay); ctx.beginPath(); ctx.moveTo(-12, -5); ctx.lineTo(8, -5); ctx.quadraticCurveTo(18, -5, 20, -1); ctx.lineTo(8, 1); ctx.lineTo(8, 4); ctx.lineTo(-12, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(ax - 11, ay - 4, 18, 1.5);
      const fx = n.x + 30, fy = n.y + 20, glow = 0.55 + Math.sin(t * 6) * 0.2;
      ctx.fillStyle = '#4a4540'; ctx.strokeStyle = OL; ctx.fillRect(fx - 12, fy - 8, 24, 18); ctx.strokeRect(fx - 12, fy - 8, 24, 18);
      ctx.strokeStyle = 'rgba(20,18,14,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(fx - 12, fy); ctx.lineTo(fx + 12, fy); ctx.moveTo(fx, fy - 8); ctx.lineTo(fx, fy); ctx.moveTo(fx - 6, fy); ctx.lineTo(fx - 6, fy + 10); ctx.moveTo(fx + 6, fy); ctx.lineTo(fx + 6, fy + 10); ctx.stroke();
      ctx.fillStyle = '#1a120c'; ctx.fillRect(fx - 8, fy - 5, 16, 10);
      for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? `rgba(255,120,40,${glow})` : `rgba(255,200,90,${glow})`; ctx.beginPath(); ctx.arc(fx - 6 + (k % 4) * 4, fy - 2 + ((k / 4) | 0) * 4, 2, 0, TAU); ctx.fill(); }
      if (Math.random() < 0.15) addPart(fx + rand(-6, 6), fy - 6, rand(-8, 8), rand(-50, -30), 0.6, rand(1.5, 2.5), '#ffb347', 'fire');
    }
    if (dist(P.x, P.y, n.x, n.y) < 160) textC2(n.name, n.x, n.y - 36);
  }
  for (const l of loot) {
    if (!inView(l.x, l.y, 30)) continue;
    const p = 0.6 + Math.sin(t * 5 + l.x) * 0.4, col = l.rare ? '#ffb86a' : '#fff4d0';
    ctx.fillStyle = `rgba(255,248,220,${0.3 * p})`; ctx.beginPath(); ctx.arc(l.x, l.y, 13, 0, TAU); ctx.fill();
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(l.x, l.y, 3 + p, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    if (Math.random() < 0.06) addPart(l.x + rand(-4, 4), l.y, 0, -30, 0.7, 1.5, col, 'mote');
  }
  const dg = dungeonAt(P.x, P.y);
  if (dg && dg.theme === 'fire') for (const tr of TRAPS) {
    if (!inView(tr.x, tr.y, tr.r) || tr.ph === undefined) continue;
    const w = tr.ph > tr.period - 0.9 ? (tr.ph - (tr.period - 0.9)) / 0.9 : 0;
    if (w > 0) { ctx.strokeStyle = `rgba(255,120,50,${0.3 + w * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tr.x, tr.y, tr.r, 0, TAU); ctx.stroke(); ctx.fillStyle = `rgba(255,90,30,${w * 0.2})`; ctx.beginPath(); ctx.arc(tr.x, tr.y, tr.r * w, 0, TAU); ctx.fill(); }
  }
}
// đồ đạc riêng của từng người trong Sảnh Hearthhold, vẽ theo hướng họ đang nhìn
function drawNpcPack(n, f, t) {
  // lái buôn: ba lô khổng lồ sau lưng, cuộn chăn, nồi niêu lủng lẳng
  ctx.save(); ctx.translate(n.x, n.y); ctx.rotate(f);
  ctx.fillStyle = litGrad('#6a5236', -14, -4, 16); ctx.strokeStyle = OL; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(-26, -13, 17, 26, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a3a2a'; ctx.beginPath(); ctx.ellipse(-17, -14, 9, 3.6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-26, -3); ctx.lineTo(-9, -3); ctx.moveTo(-26, 5); ctx.lineTo(-9, 5); ctx.stroke();
  ctx.fillStyle = '#5a5a5e'; ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-28, 9, 3.6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.arc(-28, -8, 3, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawNpcProps(n, f, t) {
  ctx.save(); ctx.translate(n.x, n.y); ctx.rotate(f);
  const s = 1.1;
  if (n.id === 'smith') {
    // tạp dề da và bộ râu rậm
    ctx.fillStyle = 'rgba(90,58,34,.9)'; ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(3, -7, 7, 14, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.ellipse(8.2 * s, 0, 3.2, 4.6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  } else if (n.id === 'merchant') {
    // đèn lồng treo tay phát sáng ấm
    const lx = 14, ly = 12, gl = 0.6 + Math.sin(t * 3) * 0.1;
    const g = ctx.createRadialGradient(lx, ly, 1, lx, ly, 26); g.addColorStop(0, `rgba(255,200,110,${0.4 * gl})`); g.addColorStop(1, 'rgba(255,200,110,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, 26, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a3026'; ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.fillRect(lx - 3.5, ly - 3.5, 7, 7); ctx.strokeRect(lx - 3.5, ly - 3.5, 7, 7);
    ctx.fillStyle = `rgba(255,220,140,${gl + 0.3})`; ctx.fillRect(lx - 2.2, ly - 2.2, 4.4, 4.4);
  } else if (n.id === 'scholar') {
    // sách mở trên tay, chữ phát sáng xanh, và cặp kính tròn
    ctx.save(); ctx.translate(15, 0); ctx.rotate(Math.sin(t * 0.8) * 0.05);
    ctx.fillStyle = '#3a2a4a'; ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.rect(-4, -9, 8, 18); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#efe4c8'; ctx.fillRect(-3, -8, 6, 7.5); ctx.fillRect(-3, 0.5, 6, 7.5);
    ctx.strokeStyle = 'rgba(120,170,230,.8)'; ctx.lineWidth = 0.7; ctx.beginPath(); for (const y of [-6.5, -4.5, -2.5, 2, 4, 6]) { ctx.moveTo(-2.2, y); ctx.lineTo(2.2, y); } ctx.stroke();
    ctx.fillStyle = `rgba(174,228,255,${0.5 + Math.sin(t * 2) * 0.3})`; ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(0, -4, 1.4, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.restore();
    ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(7.6, -2.3, 1.5, 0, TAU); ctx.moveTo(9.1, 2.3); ctx.arc(7.6, 2.3, 1.5, 0, TAU); ctx.stroke();
    // chồng sách bên cạnh
    for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#6a2e3e', '#2e4a6a', '#5a5a2e'][k]; ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.beginPath(); ctx.rect(-6 + k, 20 - k * 3.2, 13, 4); ctx.fill(); ctx.stroke(); }
  } else if (n.id === 'priestess') {
    // khăn trùm trắng, vầng hào quang vàng, chuỗi hạt
    ctx.fillStyle = '#ece6d6'; ctx.strokeStyle = OL; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(2 * s, 0, 7.2 * s, 1.35, TAU - 1.35); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(5 * s, 0, 3.8, -1.1, 1.1); ctx.fill();
    ctx.strokeStyle = `rgba(255,224,138,${0.65 + Math.sin(t * 2) * 0.2})`; ctx.lineWidth = 1.6; ctx.shadowColor = '#ffe08a'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(1, 0, 10.5, 0, TAU); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#c9a44e'; for (let k = 0; k < 7; k++) { const a = 0.6 + k * 0.28; ctx.beginPath(); ctx.arc(6 + Math.cos(a) * 3, -4 + k * 1.4, 0.9, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}
function textC2(str, x, y) { wText(str, x, y, 11, '#f2dc97', 1); }
// chữ gắn với thế giới (số sát thương, tên NPC, thuộc tính quái) được gom lại và vẽ sau khi phóng to, để luôn sắc nét
const WTEXT = [];
function wText(text, x, y, size, color, alpha) { WTEXT.push({ text, x, y, size, color, alpha }); }
function flushWText(x0, y0) {
  if (!WTEXT.length) return;
  const z = DPR * ZOOM;
  ctx.setTransform(z, 0, 0, z, -x0 * z, -y0 * z); ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)';
  for (const t of WTEXT) {
    ctx.globalAlpha = t.alpha; ctx.font = `600 ${t.size}px ${FONT_U}`;
    ctx.strokeText(t.text, t.x, t.y); ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'left'; WTEXT.length = 0;
}
function drawBarrier() {
  if (S.glade || !inView(BARRIER.x, BARRIER.y, BARRIER.r + 40)) return;
  const t = G.clock, gr = ctx.createRadialGradient(BARRIER.x, BARRIER.y, BARRIER.r * 0.4, BARRIER.x, BARRIER.y, BARRIER.r);
  gr.addColorStop(0, 'rgba(150,240,230,.04)'); gr.addColorStop(1, `rgba(150,240,230,${0.22 + Math.sin(t * 2) * 0.06})`);
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(BARRIER.x, BARRIER.y, BARRIER.r, 0, TAU); ctx.fill();
  ctx.strokeStyle = `rgba(190,255,245,${0.5 + Math.sin(t * 3) * 0.2})`; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(BARRIER.x, BARRIER.y, BARRIER.r, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(BARRIER.x, BARRIER.y, BARRIER.r * 0.72, t * 0.3, t * 0.3 + TAU * 0.8); ctx.stroke();
}
function drawChest(c) {
  const open = S.chests.includes(c.id), t = G.clock;
  shadow(c.x + 2, c.y + 8, 17, 7, 0.35);
  if (!open) {
    const gr = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, 34);
    gr.addColorStop(0, `rgba(255,220,130,${0.18 + Math.sin(t * 2.5 + c.x) * 0.08})`); gr.addColorStop(1, 'rgba(255,220,130,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, 34, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = '#5a3d22'; ctx.fillRect(c.x - 15, c.y - 6, 30, 16);
  ctx.strokeStyle = '#1e140b'; ctx.lineWidth = 1.5; ctx.strokeRect(c.x - 15, c.y - 6, 30, 16);
  if (open) {
    ctx.fillStyle = '#1a120a'; ctx.fillRect(c.x - 13, c.y - 6, 26, 5);
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(c.x - 15, c.y - 18, 30, 8); ctx.strokeRect(c.x - 15, c.y - 18, 30, 8);
  } else {
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(c.x - 15, c.y - 12, 30, 8); ctx.strokeRect(c.x - 15, c.y - 12, 30, 8);
  }
  ctx.fillStyle = '#c9a34a';
  ctx.fillRect(c.x - 10, c.y - (open ? 18 : 12), 3, open ? 8 : 22); ctx.fillRect(c.x + 7, c.y - (open ? 18 : 12), 3, open ? 8 : 22);
  if (open) { ctx.fillRect(c.x - 10, c.y - 6, 3, 16); ctx.fillRect(c.x + 7, c.y - 6, 3, 16); }
  else { ctx.fillRect(c.x - 2, c.y - 5, 4, 5); }
  // ván gỗ, đinh tán, ổ khóa có lỗ khóa
  ctx.strokeStyle = 'rgba(30,18,8,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c.x - 14, c.y - 1); ctx.lineTo(c.x + 14, c.y - 1); ctx.moveTo(c.x - 14, c.y + 4); ctx.lineTo(c.x + 14, c.y + 4); ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,200,.18)'; ctx.fillRect(c.x - 14, c.y - (open ? 17 : 11), 28, 2);
  ctx.fillStyle = '#f0d890'; for (const bx of [-8.5, 8.5]) for (const by of open ? [-15, 0, 7] : [-9, 0, 7]) { ctx.beginPath(); ctx.arc(c.x + bx, c.y + by, 0.9, 0, TAU); ctx.fill(); }
  if (!open) { ctx.fillStyle = '#e0bc5a'; ctx.strokeStyle = '#3a2810'; ctx.lineWidth = 1; ctx.fillRect(c.x - 3.5, c.y - 6, 7, 7); ctx.strokeRect(c.x - 3.5, c.y - 6, 7, 7); ctx.fillStyle = '#1a120a'; ctx.fillRect(c.x - 0.8, c.y - 4, 1.6, 3); }
}
// gốc cây: rễ tỏa ra, thân có vỏ sần và vòng gỗ (lộ ra khi tán lá mờ đi lúc người chơi đứng dưới)
function drawTrunk(o) {
  const rr = o.r * 0.7, rnd = mulberry32(o.seed || (o.x * 7 + o.y) | 0);
  shadow(o.x, o.y + 3, o.r, o.r * 0.6, 0.35);
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU + rnd() * 0.6, l = rr * (1.3 + rnd() * 0.5);
    ctx.strokeStyle = 'rgba(10,8,6,.8)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(o.x + Math.cos(a) * rr * 0.6, o.y + Math.sin(a) * rr * 0.6); ctx.quadraticCurveTo(o.x + Math.cos(a + 0.2) * l * 0.8, o.y + Math.sin(a + 0.2) * l * 0.8, o.x + Math.cos(a + 0.35) * l, o.y + Math.sin(a + 0.35) * l); ctx.stroke();
    ctx.strokeStyle = '#4a3824'; ctx.lineWidth = 3; ctx.stroke();
  }
  ctx.lineCap = 'butt';
  ctx.save(); ctx.translate(o.x, o.y);
  ctx.fillStyle = litGrad('#4a3824', -Math.round(rr * 0.3), -Math.round(rr * 0.35), Math.round(rr)); ctx.strokeStyle = 'rgba(10,8,6,.85)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = 'rgba(30,20,10,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(o.x, o.y, rr * 0.55, 0, TAU); ctx.moveTo(o.x + rr * 0.25, o.y); ctx.arc(o.x, o.y, rr * 0.25, 0, TAU); ctx.stroke();
}
function drawRock(o) {
  const r = mulberry32(o.seed);
  shadow(o.x + 3, o.y + 5, o.r * 1.05, o.r * 0.7, 0.3);
  if (o.crystal) {
    ctx.fillStyle = 'rgba(160,220,255,.85)'; ctx.strokeStyle = 'rgba(40,70,100,.7)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i - 1) * 0.5, l = o.r * (1.4 - Math.abs(i - 1) * 0.4); ctx.beginPath(); ctx.moveTo(o.x + Math.cos(a - 0.3) * 5, o.y + Math.sin(a - 0.3) * 5); ctx.lineTo(o.x + Math.cos(a) * l, o.y + Math.sin(a) * l); ctx.lineTo(o.x + Math.cos(a + 0.3) * 5, o.y + Math.sin(a + 0.3) * 5); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    return;
  }
  ctx.fillStyle = o.pillar ? (dungeonAt(o.x, o.y) || inRect(o.x, o.y, ACAD) ? '#6a6e7a' : '#8a8474') : o.cliff ? '#4a4539' : '#6f6b61';
  ctx.beginPath();
  const n = 8;
  for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = o.r * (0.82 + r() * 0.3); const x = o.x + Math.cos(a) * rr, y = o.y + Math.sin(a) * rr * 0.9; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(15,13,10,.75)'; ctx.lineWidth = 1.8; ctx.stroke();
  // mặt đá: mảng sáng phía trên trái, mảng tối phía dưới phải, vết nứt và rêu
  ctx.save(); ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(o.x + o.r * 0.35, o.y + o.r * 0.4, o.r * 0.8, o.r * 0.55, -0.4, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.moveTo(o.x - o.r, o.y - o.r * 0.1); ctx.lineTo(o.x - o.r * 0.2, o.y - o.r); ctx.lineTo(o.x + o.r * 0.25, o.y - o.r * 0.15); ctx.lineTo(o.x - o.r * 0.35, o.y + o.r * 0.1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(20,18,14,.55)'; ctx.lineWidth = 1.1; ctx.beginPath();
  const ca = r() * TAU; ctx.moveTo(o.x + Math.cos(ca) * o.r * 0.2, o.y + Math.sin(ca) * o.r * 0.2); ctx.lineTo(o.x + Math.cos(ca + 0.4) * o.r * 0.6, o.y + Math.sin(ca + 0.4) * o.r * 0.6); ctx.lineTo(o.x + Math.cos(ca + 0.2) * o.r * 0.95, o.y + Math.sin(ca + 0.2) * o.r * 0.95); ctx.stroke();
  if (!o.pillar && !o.cliff && r() < 0.6) { ctx.fillStyle = 'rgba(96,120,58,.55)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(o.x - o.r * 0.5 + r() * o.r * 0.6, o.y - o.r * 0.6 + r() * o.r * 0.5, o.r * (0.1 + r() * 0.12), 0, TAU); ctx.fill(); } }
  ctx.restore();
  if (o.pillar) { ctx.strokeStyle = 'rgba(40,36,28,.5)'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.6, 0, TAU); ctx.stroke(); }
}
const WALL_PAL = { crypt: ['#57524a', '#6e685c'], crystal: ['#4a6078', '#8fb8d8'], fire: ['#5a4238', '#7a5646'], royal: ['#7a6a4a', '#a08a5a'] };
function drawWall(w) {
  if (w.gate || w.void || w.sea) return;
  if (w.illusory && S.illusory.includes(w.illusory)) return;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(w.x + 5, w.y + 9, w.w, w.h);
  if (w.bld) {
    // nhà trong Kinh Thành nhìn từ trên: mái bốn mặt, mỗi mặt một độ sáng, hàng ngói, nóc mái vàng, ống khói
    const x0 = w.x, y0 = w.y, x1 = w.x + w.w, y1 = w.y + w.h, inset = Math.min(w.w, w.h) / 2, horiz = w.w >= w.h;
    const rx0 = horiz ? x0 + inset : (x0 + x1) / 2, rx1 = horiz ? x1 - inset : (x0 + x1) / 2, ry0 = horiz ? (y0 + y1) / 2 : y0 + inset, ry1 = horiz ? (y0 + y1) / 2 : y1 - inset;
    const face = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); };
    face([[x0, y0], [x1, y0], [rx1, ry1], [rx0, ry0]], '#a08650');
    face([[x0, y1], [x1, y1], [rx1, ry1], [rx0, ry0]], '#6a5634');
    face([[x0, y0], [x0, y1], [rx0, ry0]], '#8a7244');
    face([[x1, y0], [x1, y1], [rx1, ry1]], '#5e4c2e');
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w.w, w.h); ctx.clip();
    ctx.strokeStyle = 'rgba(40,28,14,.4)'; ctx.lineWidth = 1; ctx.beginPath();
    if (horiz) for (let y = y0 + 6; y < y1; y += 6) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); } else for (let x = x0 + 6; x < x1; x += 6) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
    ctx.stroke(); ctx.restore();
    ctx.strokeStyle = 'rgba(30,20,10,.6)'; ctx.lineWidth = 1.2; ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(rx0, ry0); ctx.moveTo(x0, y1); ctx.lineTo(rx0, ry0); ctx.moveTo(x1, y0); ctx.lineTo(rx1, ry1); ctx.moveTo(x1, y1); ctx.lineTo(rx1, ry1); ctx.stroke();
    ctx.strokeStyle = '#e8c060'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(rx0, ry0); ctx.lineTo(rx1, ry1); ctx.stroke(); ctx.lineCap = 'butt';
    const cxh = x0 + w.w * 0.72, cyh = y0 + w.h * 0.3;
    ctx.fillStyle = '#5a4a3a'; ctx.fillRect(cxh - 4, cyh - 4, 8, 8); ctx.strokeStyle = 'rgba(12,10,8,.85)'; ctx.strokeRect(cxh - 4, cyh - 4, 8, 8); ctx.fillStyle = '#1a140e'; ctx.fillRect(cxh - 2, cyh - 2, 4, 4);
    ctx.strokeStyle = 'rgba(12,10,8,.85)'; ctx.lineWidth = 1.6; ctx.strokeRect(x0 + 0.5, y0 + 0.5, w.w - 1, w.h - 1);
    return;
  }
  if (w.shelf) {
    ctx.fillStyle = '#4a3220'; ctx.fillRect(w.x, w.y, w.w, w.h);
    const cols = ['#6a2a2a', '#2a4a6a', '#5a5a2a', '#3a2a5a', '#7a5a3a'];
    for (let x = w.x + 3, i = 0; x < w.x + w.w - 5; x += 7, i++) { ctx.fillStyle = cols[(i * 7 + (w.x | 0)) % 5]; ctx.fillRect(x, w.y + 3, 5, w.h - 6); }
    ctx.strokeStyle = 'rgba(12,10,8,.7)'; ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
    return;
  }
  const pal = w.dgw ? WALL_PAL[w.dgw] : w.acad ? ['#4a5268', '#6a7490'] : w.cliff ? ['#3d382e', '#4c463a'] : ['#6f6a5b', '#8c8672'];
  // tường đá xây so le: mỗi viên có màu hơi khác, cạnh trên sáng, cạnh dưới tối, mạch vữa sẫm
  ctx.fillStyle = tone(pal[0], 0.6); ctx.fillRect(w.x, w.y, w.w, w.h);
  const bw = 22, bh = 11, x0 = Math.max(w.x, VIEW.x0 - bw), x1 = Math.min(w.x + w.w, VIEW.x1 + bw), y0 = Math.max(w.y, VIEW.y0 - bh), y1 = Math.min(w.y + w.h, VIEW.y1 + bh);
  const tones = [pal[0], tone(pal[0], 0.88), tone(pal[0], 1.1), tone(pal[0], 0.95)], hi = tone(pal[1], 1.12), lo = tone(pal[0], 0.55);
  for (let row = Math.floor((y0 - w.y) / bh); w.y + row * bh < y1; row++) {
    const by = w.y + row * bh, h = Math.min(bh, w.y + w.h - by) - 1, off = row % 2 ? bw / 2 : 0;
    if (h <= 0) continue;
    for (let col = Math.floor((x0 - w.x + off) / bw); w.x - off + col * bw < x1; col++) {
      const bx = Math.max(w.x, w.x - off + col * bw), bx1 = Math.min(w.x + w.w, w.x - off + (col + 1) * bw), ww = bx1 - bx - 1;
      if (ww <= 0) continue;
      ctx.fillStyle = tones[(((row * 7 + col * 13) % 4) + 4) % 4]; ctx.fillRect(bx + 0.5, by + 0.5, ww, h);
      ctx.fillStyle = hi; ctx.fillRect(bx + 0.5, by + 0.5, ww, 1.2);
      ctx.fillStyle = lo; ctx.fillRect(bx + 0.5, by + h - 0.7, ww, 1.2);
    }
  }
  ctx.fillStyle = pal[1]; ctx.fillRect(w.x, w.y, w.w, Math.min(3, w.h * 0.2));
  ctx.strokeStyle = 'rgba(12,10,8,.85)'; ctx.lineWidth = 1.6; ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
}
function drawGates() {
  const t = G.clock;
  if (!S.fortOpen && inView(3600, 1286, 120)) {
    // cửa song sắt Pháo Đài: nền tối, song có viền, thanh ngang có đinh tán
    ctx.fillStyle = '#141210'; ctx.fillRect(3540, 1272, 120, 28);
    for (let x = 3548; x < 3660; x += 12) olLine(x, 1273, x, 1299, 3, '#6c6a64');
    for (const y of [1279, 1292]) { olLine(3542, y, 3658, y, 3, '#5c5a55'); ctx.fillStyle = '#a8a298'; for (let x = 3548; x < 3660; x += 12) { ctx.beginPath(); ctx.arc(x, y, 1.3, 0, TAU); ctx.fill(); } }
  }
  if (G.colo.active && inView(3600, 2964, 120)) {
    for (let i = 0; i < 6; i++) {
      const x = 3600 + Math.sin(t * 1.5 + i * 1.7) * 40, y = 2964 + Math.cos(t + i) * 6;
      const gr = ctx.createRadialGradient(x, y, 2, x, y, 50);
      gr.addColorStop(0, 'rgba(200,60,40,.45)'); gr.addColorStop(1, 'rgba(200,60,40,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y, 60, 22, 0, 0, TAU); ctx.fill();
    }
  }
  if (!S.bossDead && inView(1400, 1114, 120)) {
    const a = G.bossFight ? 0.55 : 0.34;
    for (let i = 0; i < 7; i++) {
      const x = 1400 + Math.sin(t * 1.3 + i * 1.7) * 26, y = 1114 + Math.cos(t * 0.9 + i) * 7;
      const gr = ctx.createRadialGradient(x, y, 2, x, y, 46);
      gr.addColorStop(0, `rgba(235,238,242,${a})`); gr.addColorStop(1, 'rgba(235,238,242,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y, 52, 22, 0, 0, TAU); ctx.fill();
    }
  }
  if (inView(1400, 406, 120)) {
    if (!S.bossDead) {
      // cổng gỗ bọc đồng phía bắc: ván gỗ, nẹp sắt, ấn vàng niêm phong ở giữa
      ctx.fillStyle = '#3b362d'; ctx.fillRect(1360, 392, 80, 28);
      ctx.strokeStyle = 'rgba(20,16,10,.6)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 1370; x < 1440; x += 10) { ctx.moveTo(x, 392); ctx.lineTo(x, 420); } ctx.stroke();
      for (const y of [397, 415]) olLine(1361, y, 1439, y, 2.4, '#5c5448');
      ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.strokeRect(1360, 392, 80, 28);
      ctx.strokeStyle = 'rgba(214,178,94,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(1400, 406, 10, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1400, 392); ctx.lineTo(1400, 420); ctx.stroke();
      ctx.fillStyle = 'rgba(255,214,110,.8)'; ctx.beginPath(); ctx.arc(1400, 406, 3, 0, TAU); ctx.fill();
    } else {
      const gr = ctx.createRadialGradient(1400, 406, 4, 1400, 406, 70);
      gr.addColorStop(0, 'rgba(255,220,130,.45)'); gr.addColorStop(1, 'rgba(255,220,130,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(1400, 406, 70, 0, TAU); ctx.fill();
    }
  }
}
function fogGate(x, y, w, a, t) {
  for (let i = 0; i < 7; i++) {
    const fx = x + Math.sin(t * 1.3 + i * 1.7) * w * 0.3, fy = y + Math.cos(t * 0.9 + i) * 7;
    const gr = ctx.createRadialGradient(fx, fy, 2, fx, fy, 46);
    gr.addColorStop(0, `rgba(235,238,242,${a})`); gr.addColorStop(1, 'rgba(235,238,242,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(fx, fy, w * 0.6, 22, 0, 0, TAU); ctx.fill();
  }
}
function drawGates2() {
  const t = G.clock;
  for (const w of WALLS) {
    if (!w.gate || !inView(w.x + w.w / 2, w.y + w.h / 2, 140)) continue;
    const cx = w.x + w.w / 2, cy = w.y + w.h / 2;
    if (w.gate === 'fog2' && !S.boss2Dead) fogGate(cx, cy, w.w, G.bossFight ? 0.55 : 0.34, t);
    else if (w.gate === 'dg') { const R = BOSS_ROOMS.find(q => q.id === w.dg); if (R && !S.mb[R.boss]) fogGate(cx, cy, w.w, G.dfight === w.dg ? 0.55 : 0.3, t); }
    else if (w.gate === 'north2') {
      if (!S.boss2Dead) { ctx.fillStyle = '#4a3a22'; ctx.fillRect(w.x, w.y, w.w, w.h); ctx.strokeStyle = 'rgba(255,214,120,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, TAU); ctx.stroke(); }
      else { const gr = ctx.createRadialGradient(cx, cy, 4, cx, cy, 80); gr.addColorStop(0, 'rgba(255,220,130,.5)'); gr.addColorStop(1, 'rgba(255,220,130,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, 80, 0, TAU); ctx.fill(); }
    } else if (w.gate === 'great' && !S.greatOpen) {
      ctx.fillStyle = '#6a5228'; ctx.fillRect(w.x - 10, w.y - 6, w.w + 20, w.h + 12);
      ctx.fillStyle = '#b8912f'; ctx.fillRect(w.x - 4, w.y - 2, w.w / 2, w.h + 4); ctx.fillRect(w.x + w.w / 2 + 4, w.y - 2, w.w / 2, w.h + 4);
      // cánh cổng vàng: viền tối, đinh tán, vòng kéo và hình mặt trời khắc chìm ở giữa
      ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.strokeRect(w.x - 10, w.y - 6, w.w + 20, w.h + 12); ctx.strokeRect(w.x - 4, w.y - 2, w.w / 2, w.h + 4); ctx.strokeRect(w.x + w.w / 2 + 4, w.y - 2, w.w / 2, w.h + 4);
      ctx.fillStyle = '#f0d27a'; for (let x = w.x + 4; x < w.x + w.w; x += 16) for (const y of [w.y + 2, w.y + w.h - 2]) { ctx.beginPath(); ctx.arc(x, y, 1.4, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(120,80,20,.8)'; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ctx.moveTo(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13); ctx.lineTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20); }
      ctx.stroke();
      ctx.strokeStyle = '#6a4a18'; ctx.lineWidth = 2.2; for (const dx of [-9, 9]) { ctx.beginPath(); ctx.arc(cx + dx * 2.2, cy, 4, 0, TAU); ctx.stroke(); }
      ctx.strokeStyle = '#f0d27a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 11, 0, TAU); ctx.stroke();
      for (let i = 0; i < 3; i++) { const on = i < S.gr.length; ctx.fillStyle = on ? '#ffe08a' : 'rgba(60,50,30,.9)'; ctx.beginPath(); ctx.arc(cx - 30 + i * 30, w.y - 16, 5, 0, TAU); ctx.fill(); }
    } else if (w.gate === 'acad' && !S.acadOpen) {
      const gr = ctx.createLinearGradient(w.x, 0, w.x + w.w, 0);
      gr.addColorStop(0, 'rgba(150,210,255,.2)'); gr.addColorStop(0.5, `rgba(190,230,255,${0.55 + Math.sin(t * 3) * 0.15})`); gr.addColorStop(1, 'rgba(150,210,255,.2)');
      ctx.fillStyle = gr; ctx.fillRect(w.x, w.y, w.w, w.h);
    } else if (w.gate === 'lever' && !S.levers.includes(w.lever)) {
      ctx.fillStyle = '#141210'; ctx.fillRect(w.x, w.y, w.w, w.h);
      if (w.w >= w.h) for (let x = w.x + 8; x < w.x + w.w; x += 12) olLine(x, w.y + 1, x, w.y + w.h - 1, 3, '#6a6258');
      else for (let y = w.y + 8; y < w.y + w.h; y += 12) olLine(w.x + 1, y, w.x + w.w - 1, y, 3, '#6a6258');
      ctx.strokeStyle = OL; ctx.lineWidth = 1.4; ctx.strokeRect(w.x, w.y, w.w, w.h);
    }
  }
}
function drawDecals() {
  const t = G.clock;
  for (const g of GRACES) {
    if (!inView(g.x, g.y, 200)) continue;
    const found = S.discovered.includes(g.id), pulse = 0.8 + Math.sin(t * 2.4 + g.id) * 0.2;
    const gr = ctx.createRadialGradient(g.x, g.y, 2, g.x, g.y, 70);
    gr.addColorStop(0, `rgba(255,222,140,${(found ? 0.5 : 0.25) * pulse})`); gr.addColorStop(1, 'rgba(255,222,140,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(g.x, g.y, 70, 0, TAU); ctx.fill();
    // vòng cổ ngữ vàng xoay chậm quanh Ân Điển, và bệ đá nhỏ
    ctx.strokeStyle = `rgba(255,220,130,${(found ? 0.55 : 0.3) * pulse})`; ctx.lineWidth = 1.2; ctx.setLineDash([2, 5]); ctx.lineDashOffset = -t * 6;
    ctx.beginPath(); ctx.arc(g.x, g.y + 2, 24, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(255,230,160,${(found ? 0.35 : 0.2) * pulse})`; ctx.beginPath(); ctx.ellipse(g.x, g.y + 2, 16, 11, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#6a6254'; ctx.strokeStyle = 'rgba(12,10,8,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(g.x, g.y + 5, 8, 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff2c4'; ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(g.x, g.y - 14 * pulse); ctx.quadraticCurveTo(g.x + 6, g.y - 2, g.x, g.y + 4); ctx.quadraticCurveTo(g.x - 6, g.y - 2, g.x, g.y - 14 * pulse); ctx.fill();
    ctx.shadowBlur = 0;
  }
  for (const it of ITEMS) {
    if (S.taken.includes(it.id) || !inView(it.x, it.y, 40)) continue;
    const p = 0.6 + Math.sin(t * 4 + it.x) * 0.4;
    ctx.fillStyle = `rgba(255,248,220,${0.25 * p})`; ctx.beginPath(); ctx.arc(it.x, it.y, 16, 0, TAU); ctx.fill();
    ctx.fillStyle = it.kind === 'seed' ? '#ffe28a' : it.kind === 'weapon' ? '#ffb86a' : it.kind === 'runes' ? '#f3c35a' : '#e8f0ff'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(it.x, it.y, 3.5 + p, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  }
  for (const n of NOTES) {
    if (!inView(n.x, n.y, 40)) continue;
    ctx.strokeStyle = `rgba(255,150,60,${0.55 + Math.sin(t * 2 + n.x) * 0.2})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(n.x, n.y, 16, 8, 0, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(n.x - 8, n.y); ctx.lineTo(n.x + 8, n.y); ctx.moveTo(n.x, n.y - 4); ctx.lineTo(n.x, n.y + 4); ctx.stroke();
  }
  if (S.lost && inView(S.lost.x, S.lost.y, 60)) {
    const p = 0.7 + Math.sin(t * 3) * 0.3, gr = ctx.createRadialGradient(S.lost.x, S.lost.y, 1, S.lost.x, S.lost.y, 26);
    gr.addColorStop(0, `rgba(170,255,190,${0.8 * p})`); gr.addColorStop(1, 'rgba(120,230,160,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(S.lost.x, S.lost.y, 26, 0, TAU); ctx.fill();
  }
  for (const a of aoes) {
    if (a.kind === 'mark') {
      const k = a.t / a.dur;
      ctx.strokeStyle = `rgba(255,120,60,${0.3 + k * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.stroke();
      ctx.fillStyle = `rgba(255,90,40,${0.08 + k * 0.14})`; ctx.beginPath(); ctx.arc(a.x, a.y, a.r * k, 0, TAU); ctx.fill();
    } else if (a.kind === 'delayed') {
      const k = a.t / a.delay, c = a.col === 'magic' ? '170,215,255' : a.friendly ? '255,236,170' : '255,214,110';
      ctx.strokeStyle = `rgba(${c},${a.friendly ? 0.2 + k * 0.3 : 0.35 + k * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.stroke();
      ctx.fillStyle = `rgba(${c},${0.1 + k * 0.2})`; ctx.beginPath(); ctx.arc(a.x, a.y, a.r * k, 0, TAU); ctx.fill();
    }
  }
}
function drawAoeFx() {
  for (const a of aoes) {
    if (a.kind === 'flash') {
      const k = a.t / a.dur;
      ctx.fillStyle = a.col === 'fire' ? `rgba(255,140,60,${0.55 * (1 - k)})` : a.col === 'dust' ? `rgba(210,190,150,${0.45 * (1 - k)})` : a.col === 'magic' ? `rgba(170,215,255,${0.5 * (1 - k)})` : `rgba(255,226,150,${0.5 * (1 - k)})`; ctx.beginPath(); ctx.arc(a.x, a.y, a.r * (0.7 + k * 0.4), 0, TAU); ctx.fill();
    } else if (a.kind === 'ring' || a.kind === 'pring') {
      const cur = lerp(a.r0, a.r1, a.t / a.dur);
      ctx.strokeStyle = a.kind === 'pring' ? `rgba(220,200,160,${0.7 * (1 - a.t / a.dur)})` : `rgba(255,222,140,${0.8 * (1 - a.t / a.dur)})`; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(a.x, a.y, cur, 0, TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(255,250,230,${0.7 * (1 - a.t / a.dur)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x, a.y, cur + 4, 0, TAU); ctx.stroke();
    } else if (a.kind === 'arc') {
      const k = a.t / a.dur;
      ctx.strokeStyle = `rgba(${a.col},${0.8 * (1 - k)})`; ctx.lineWidth = 14 * (1 - k * 0.5); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r * (0.7 + k * 0.3), a.face - 1.2, a.face + 1.2); ctx.stroke(); ctx.lineCap = 'butt';
    }
  }
}
// mũi tên và dao ném: thân có viền, đầu nhọn, lông đuôi
function drawArrowShape(x, y, a, kind, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  if (kind === 'knife') {
    ctx.fillStyle = col; ctx.strokeStyle = OL; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-3, -2); ctx.lineTo(-3, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a3a28'; ctx.fillRect(-8, -1, 5, 2);
  } else {
    const L = kind === 'heavy' ? 22 : 18;
    olLine(-L, 0, 2, 0, kind === 'heavy' ? 2 : 1.4, '#8a7050');
    ctx.fillStyle = col; ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(0, -2.8); ctx.lineTo(0, 2.8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = kind === 'heavy' ? '#e8d8a8' : '#c8bca0'; ctx.beginPath(); ctx.moveTo(-L + 5, 0); ctx.lineTo(-L - 1, -3.2); ctx.lineTo(-L + 1, 0); ctx.lineTo(-L - 1, 3.2); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function drawProjs() {
  for (const q of projs) {
    if (!inView(q.x, q.y, 40)) continue;
    const a = Math.atan2(q.vy, q.vx);
    if (q.kind === 'parrow' || q.kind === 'knife') {
      if (q.kind === 'knife') { drawArrowShape(q.x, q.y, a, 'knife', '#e8e2d0'); }
      else drawArrowShape(q.x, q.y, a, q.pierce ? 'heavy' : 'arrow', q.pierce ? '#fff0c0' : '#e0d8c0');
      if (q.parts && (q.parts.fire || q.parts.holy)) { ctx.fillStyle = q.parts.fire ? '#ff9a4a' : '#ffe08a'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.5, 0, TAU); ctx.fill(); }
      continue;
    }
    if (q.kind === 'shard') {
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(a); ctx.fillStyle = '#d8f0ff'; ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-4, -3.5); ctx.lineTo(-8, 0); ctx.lineTo(-4, 3.5); ctx.closePath(); ctx.fill(); ctx.restore();
      continue;
    }
    if (q.kind === 'comet') {
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(a); ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 22;
      const gr = ctx.createLinearGradient(-60, 0, 14, 0); gr.addColorStop(0, 'rgba(150,200,255,0)'); gr.addColorStop(1, 'rgba(210,235,255,.95)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(q.r, 0); ctx.lineTo(-60, -q.r * 0.7); ctx.lineTo(-60, q.r * 0.7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f4faff'; ctx.beginPath(); ctx.arc(0, 0, q.r * 0.75, 0, TAU); ctx.fill(); ctx.restore();
      continue;
    }
    if (q.kind === 'bolt' || q.kind === 'hbolt') {
      ctx.strokeStyle = q.kind === 'bolt' ? '#fff6b0' : '#ffe08a'; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 12; ctx.lineWidth = q.kind === 'bolt' ? 3 : 2.4;
      ctx.beginPath(); ctx.moveTo(q.x, q.y);
      for (let i = 1; i <= 3; i++) ctx.lineTo(q.x - Math.cos(a) * i * 9 + rand(-4, 4), q.y - Math.sin(a) * i * 9 + rand(-4, 4));
      ctx.stroke(); ctx.shadowBlur = 0;
      continue;
    }
    if (q.kind === 'hwave' || q.kind === 'cwave') {
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(a); ctx.shadowColor = q.kind === 'cwave' ? '#9fd0ff' : '#ffd76a'; ctx.shadowBlur = 16;
      ctx.strokeStyle = q.kind === 'cwave' ? 'rgba(200,235,255,.9)' : 'rgba(255,230,150,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-10, 0, q.r + 6, -1.1, 1.1); ctx.stroke(); ctx.restore();
      continue;
    }
    if (q.kind === 'arrow') { drawArrowShape(q.x, q.y, a, 'arrow', '#d8d0b8'); continue; }
    if (q.kind === 'ember') {
      // lưỡi lửa phụt ra: to dần và nhạt dần theo quãng bay
      const k = 1 - q.life / 0.75, rr = q.r * (0.6 + k * 0.9);
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(a); ctx.globalAlpha = Math.max(0, 1 - k * 0.8);
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, rr * 1.6); g.addColorStop(0, '#fff2b0'); g.addColorStop(0.4, '#ffa040'); g.addColorStop(1, 'rgba(200,50,10,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-rr * 0.3, 0, rr * 1.6, rr * 1.1, 0, 0, TAU); ctx.fill(); ctx.restore();
      continue;
    }
    if (q.kind === 'bubble') {
      ctx.strokeStyle = 'rgba(220,245,255,.85)'; ctx.fillStyle = 'rgba(170,215,240,.25)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(q.x - q.r * 0.35, q.y - q.r * 0.35, q.r * 0.25, 0, TAU); ctx.fill();
      continue;
    }
    if (q.kind === 'spit' || q.kind === 'porb' || q.kind === 'horb') {
      const col = q.kind === 'spit' ? '#9fd05a' : q.kind === 'horb' ? '#ffe08a' : '#b9a8ff';
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 0.8, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      continue;
    }
    if (q.kind === 'gwave') {
      const a = Math.atan2(q.vy, q.vx);
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(a); ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 16;
      ctx.strokeStyle = 'rgba(255,230,150,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-10, 0, 18, -1.1, 1.1); ctx.stroke(); ctx.restore();
    } else if (q.kind === 'dagger') {
      const a = Math.atan2(q.vy, q.vx);
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(a);
      ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 10; ctx.fillStyle = '#f6dc8e';
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -3); ctx.lineTo(-8, 3); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else {
      // quả cầu: đuôi mờ phía sau, lõi sáng trắng, viền màu; cầu lửa có lưỡi lửa bập bùng
      const col = q.kind === 'glint' ? '#d8e8ff' : q.kind === 'fireball' ? '#ffa04a' : '#8fb0ff', rr = q.r * 0.8;
      const tg = ctx.createLinearGradient(q.x, q.y, q.x - Math.cos(a) * rr * 5, q.y - Math.sin(a) * rr * 5);
      tg.addColorStop(0, col); tg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.55; ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(q.x + Math.cos(a + 1.57) * rr, q.y + Math.sin(a + 1.57) * rr); ctx.lineTo(q.x - Math.cos(a) * rr * 5, q.y - Math.sin(a) * rr * 5); ctx.lineTo(q.x + Math.cos(a - 1.57) * rr, q.y + Math.sin(a - 1.57) * rr); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(q.x, q.y, rr, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      if (q.kind === 'fireball') { const f = G.clock * 20 + q.x; ctx.fillStyle = '#ffd27a'; for (let k = 0; k < 5; k++) { const fa = k / 5 * TAU + f * 0.1; ctx.beginPath(); ctx.arc(q.x + Math.cos(fa) * rr * 0.7, q.y + Math.sin(fa) * rr * 0.7, rr * 0.35, 0, TAU); ctx.fill(); } }
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(q.x, q.y, rr * 0.45, 0, TAU); ctx.fill();
    }
  }
}
function drawParts() {
  for (const p of parts) {
    if (!inView(p.x, p.y, p.kind === 'fog' ? p.size : 30)) continue;
    const k = p.life / p.max;
    if (p.kind === 'text') {
      wText(p.text, p.x, p.y, p.size, p.color, Math.min(1, k * 2));
    } else if (p.kind === 'spark') {
      ctx.globalAlpha = k; ctx.strokeStyle = p.color; ctx.lineWidth = p.size;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke();
    } else if (p.kind === 'glint') {
      ctx.globalAlpha = k; ctx.fillStyle = p.color; const s = p.size * (0.5 + k * 0.5);
      ctx.beginPath(); ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x + s * 0.18, p.y); ctx.lineTo(p.x, p.y + s); ctx.lineTo(p.x - s * 0.18, p.y); ctx.closePath();
      ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x, p.y + s * 0.18); ctx.lineTo(p.x + s, p.y); ctx.lineTo(p.x, p.y - s * 0.18); ctx.closePath(); ctx.fill();
    } else if (p.kind === 'fog') {
      const a = Math.min(1, (p.max - p.life) / 2.5, p.life / 2.5) * p.alpha;
      const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gr.addColorStop(0, `rgba(${p.color},${a})`); gr.addColorStop(1, `rgba(${p.color},0)`);
      ctx.globalAlpha = 1; ctx.fillStyle = gr; ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
    } else if (p.kind === 'firefly') {
      ctx.globalAlpha = (0.45 + 0.55 * Math.sin(G.clock * 5 + p.seed)) * Math.min(1, p.life, (p.max - p.life) * 2);
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
    } else if (p.kind === 'leaf') {
      ctx.globalAlpha = Math.min(1, p.life);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.life * 3 + p.seed);
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.ellipse(0, 0, 3.4, 1.6, 0, 0, TAU); ctx.fill(); ctx.restore();
    } else if (p.kind === 'ash') {
      ctx.globalAlpha = Math.min(1, p.life) * 0.7; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
    } else if (p.kind === 'fire') {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k * 0.75;
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.5 - k * 0.6), 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.globalAlpha = p.kind === 'mote' ? Math.min(1, k * 1.5) * 0.9 : k;
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
    }
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}
function drawCanopies() {
  for (const o of OBST) {
    if (o.kind !== 'tree' || !inView(o.x, o.y, o.cr + 20)) continue;
    const spr = (o.spirit ? CANOPY.spirit : o.dead ? CANOPY.dead : o.golden ? CANOPY.gold : o.pal ? CANOPY[o.pal] : CANOPY.green)[o.spr];
    let a = 0.96;
    const near = (x, y, rr) => dist(x, y, o.x, o.y) < o.cr + rr;
    if (near(P.x, P.y, 10)) a = 0.38;
    else if (enemies.some(e => !e.dead && near(e.x, e.y, 0))) a = 0.6;
    ctx.globalAlpha = a;
    const size = spr.width * (o.cr / 52);
    const swx = Math.sin(G.clock * 1.1 + o.x * 0.013 + o.y * 0.007) * 2.2, swy = Math.cos(G.clock * 0.9 + o.x * 0.011) * 1.2;
    ctx.drawImage(spr, o.x - size / 2 + swx, o.y - size / 2 - 10 + swy, size, size);
  }
  ctx.globalAlpha = 1;
  if (inView(TREE_POS.x, TREE_POS.y, 420)) {
    const d = dist(P.x, P.y, TREE_POS.x, TREE_POS.y);
    ctx.globalAlpha = d < 300 ? 0.55 : 0.95;
    drawTrunk({ x: TREE_POS.x, y: TREE_POS.y, r: 83, seed: 7 });
    const s = 820 + Math.sin(G.clock * 0.8) * 10;
    ctx.drawImage(BIGTREE, TREE_POS.x - s / 2, TREE_POS.y - s / 2 - 40, s, s);
    ctx.globalAlpha = 1;
  }
}
function drawGraceBeams() {
  for (const g of GRACES) {
    if (!inView(g.x, g.y - 100, 120) || !S.discovered.includes(g.id)) continue;
    const gr = ctx.createLinearGradient(0, g.y - 170, 0, g.y);
    gr.addColorStop(0, 'rgba(255,226,150,0)'); gr.addColorStop(1, `rgba(255,226,150,${0.28 + Math.sin(G.clock * 2) * 0.06})`);
    ctx.fillStyle = gr; ctx.fillRect(g.x - 3, g.y - 170, 6, 170);
  }
}
// ───────────────────────── gợi ý tương tác ─────────────────────────
// mọi thứ bấm E được ở gần người chơi đều có dấu nổi phía trên, kèm tên khi lại gần
function interactables() {
  const L = [];
  const add = (x, y, label, col, r, oy, beam) => {
    if (Math.abs(x - P.x) > r || Math.abs(y - P.y) > r) return;
    const d = dist(P.x, P.y, x, y);
    if (d < r) L.push({ x, y: y - oy, label, col, r, d, beam });
  };
  for (const f of MAP_FRAGS) if (!S.frags.includes(f.id)) add(f.x, f.y, 'Bia Bản Đồ', '190,215,255', 460, 44, true);
  for (const c of CHESTS) if (!S.chests.includes(c.id) && (!c.req || c.req())) add(c.x, c.y, 'Rương', '255,210,120', 260, 20);
  for (const it of ITEMS) if (!S.taken.includes(it.id)) add(it.x, it.y, 'Vật phẩm', '255,240,200', 230, 14);
  for (const l of loot) add(l.x, l.y, 'Vật phẩm', '255,240,200', 160, 14);
  for (const l of LEVERS) if (!S.levers.includes(l.id)) add(l.x, l.y, 'Cần gạt', '230,210,170', 260, 28);
  for (const n of NPCS) add(n.x, n.y, n.name, '255,225,150', 240, 44);
  for (const d of DOORS) add(d.x, d.y, d.kind === 'enter' ? d.dg.name : 'Lối ra', '255,214,140', 240, 34);
  if (!S.fortOpen) for (const b of BRAZIERS) if (!G.braziers.includes(b.id)) add(b.x, b.y, 'Lò lửa', '255,170,90', 240, 26);
  for (const st of STATUES) if (!S.statues.includes(st.id)) add(st.x, st.y, 'Tượng đá', '150,250,235', 240, 32);
  if (!S.coloDone && !G.colo.active) add(FLAG.x, FLAG.y, 'Cờ máu', '255,130,110', 240, 44);
  for (let i = 0; i < NOTES.length; i++) if (!S.readN.includes(i)) add(NOTES[i].x, NOTES[i].y, 'Lời nhắn', '255,170,90', 210, 12);
  for (const g of GRACES) if (S.discovered.includes(g.id)) add(g.x, g.y, 'Ân Điển', '255,214,120', 150, 40);
  return L;
}
function drawInteractHints() {
  if (G.mode !== 'play' || P.state === 'dead' || G.bossFight || G.dfight || G.finalFight) return;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const t = G.clock, small = CW < 520;
  for (const h of interactables()) {
    const sx = (h.x - VIEW.x0) * ZOOM, sy = (h.y - VIEW.y0) * ZOOM;
    if (sx < -60 || sx > CW + 60 || sy < -200 || sy > CH + 60) continue;
    const close = h.d < 62, a = close ? 1 : clamp((h.r - h.d) / (h.r * 0.45), 0, 1) * 0.9;
    if (a <= 0.02) continue;
    // cột sáng cho bia chưa đọc, nhìn thấy từ xa
    if (h.beam) {
      const pulse = 0.65 + Math.sin(t * 2.2 + h.x) * 0.35, bh = 150 * ZOOM;
      const gr = ctx.createLinearGradient(0, sy + 30, 0, sy - bh);
      gr.addColorStop(0, `rgba(${h.col},${0.42 * pulse})`); gr.addColorStop(1, `rgba(${h.col},0)`);
      ctx.fillStyle = gr; ctx.fillRect(sx - 7, sy - bh, 14, bh + 30);
      ctx.fillStyle = `rgba(255,255,255,${0.35 * pulse})`; ctx.fillRect(sx - 1.5, sy - bh * 0.8, 3, bh * 0.8 + 30);
    }
    const by = sy - 18 - Math.sin(t * 3.2 + h.x * 0.01) * 3;
    ctx.globalAlpha = a;
    if (close) {
      // phím bấm nổi trên đầu vật đang có thể tương tác
      const k = G.touch ? '!' : 'E', s = 22;
      ctx.fillStyle = `rgba(${h.col},.25)`; ctx.beginPath(); ctx.arc(sx, by - s / 2, s * 0.9, 0, TAU); ctx.fill();
      keycap(sx - s / 2, by - s, k, s);
    } else {
      // dấu kim cương phát sáng
      ctx.save(); ctx.translate(sx, by - 8); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = `rgb(${h.col})`; ctx.shadowColor = `rgb(${h.col})`; ctx.shadowBlur = 10;
      ctx.fillRect(-4, -4, 8, 8); ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(20,16,10,.8)'; ctx.lineWidth = 1; ctx.strokeRect(-4, -4, 8, 8); ctx.restore();
    }
    if (h.d < h.r * 0.6 || h.beam) textC(h.label, sx, by - (close ? 28 : 18), `600 ${small ? 11 : 12}px ${FONT_U}`, `rgb(${h.col})`, 0.9);
    ctx.globalAlpha = 1;
  }
}
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  WTEXT.length = 0;
  ctx.fillStyle = '#0b0a07'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const sh = G.shake > 0.1 ? G.shake : 0, sx = (Math.random() * 2 - 1) * sh, sy = (Math.random() * 2 - 1) * sh;
  const vw = CW / ZOOM, vh = CH / ZOOM, x0 = cam.x - vw / 2 + sx, y0 = cam.y - vh / 2 + sy;
  VIEW = { x0, y0, x1: x0 + vw, y1: y0 + vh };
  ctx.setTransform(WZ, 0, 0, WZ, -x0 * WZ, -y0 * WZ);
  const inst = cam.x > 4800 && G.mode !== 'title';
  const [GC, ox, oy, ow, oh] = inst ? [GROUND2, IX0, 0, W - IX0, IH] : [GROUND, WX0, WY0, MAPW - WX0, H - WY0];
  const gx0 = clamp(Math.floor(x0), ox, ox + ow), gy0 = clamp(Math.floor(y0), oy, oy + oh), gx1 = clamp(Math.ceil(x0 + vw), ox, ox + ow), gy1 = clamp(Math.ceil(y0 + vh), oy, oy + oh);
  if (gx1 > gx0 && gy1 > gy0) ctx.drawImage(GC, (gx0 - ox) / 2, (gy0 - oy) / 2, (gx1 - gx0) / 2, (gy1 - gy0) / 2, gx0, gy0, gx1 - gx0, gy1 - gy0);
  drawGroundDetail();
  drawDecals();
  drawWater();
  drawGrass();
  for (const o of OBST) if (o.kind === 'rock' && inView(o.x, o.y, 40)) drawRock(o);
  for (const c of CHESTS) if ((!c.req || c.req()) && inView(c.x, c.y, 40)) drawChest(c);
  drawPuzzles();
  for (const o of OBST) if (o.kind === 'tree' && inView(o.x, o.y, 30)) drawTrunk(o);
  for (const w of WALLS) if (inView(w.x + w.w / 2, w.y + w.h / 2, Math.max(w.w, w.h))) drawWall(w);
  drawGates(); drawGates2(); drawObjects();
  const list = enemies.filter(e => inView(e.x, e.y, 80));
  if (boss) list.push(boss);
  if (dragon && (dragon.z || 0) <= 40) list.push(dragon);
  if (fb && (fb.z || 0) <= 40) list.push(fb);
  if (G.mode !== 'title') list.push(P);
  list.sort((a, b) => a.y - b.y);
  for (const e of list) { if (e === P) drawPlayer(); else if (e.isBoss) drawBoss(); else if (e.isDragon) drawDragon(); else if (e.isFinal) drawFinal(); else drawEnemy(e); }
  if (P.lock && !P.lock.dead) {
    const l = P.lock, y = l.y - (l.z || 0);
    // điểm khóa sáng trắng, bốn góc nhọn xoay chậm quanh
    const pr = 11 + Math.sin(G.clock * 4) * 1.2, rot = G.clock * 0.8;
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(l.x, y, 3.2, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(l.x, y, 6.5, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (let k = 0; k < 4; k++) { const a = rot + k * Math.PI / 2, cx = l.x + Math.cos(a) * pr, cy = y + Math.sin(a) * pr; ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-3.5, 0); ctx.lineTo(2, -2.2); ctx.lineTo(2, 2.2); ctx.closePath(); ctx.fill(); ctx.restore(); }
  }
  drawProjs(); drawAoeFx(); drawParts(); drawCanopies(); drawBarrier();
  if (dragon && (dragon.z || 0) > 40) drawDragon();
  if (fb && (fb.z || 0) > 40) drawFinal();
  drawGraceBeams();
  const AR = inst ? areaAt(P.x, P.y) : null;
  if (AR) {
    // khu biệt lập: che mọi thứ bên ngoài bằng bóng tối
    const vx0 = VIEW.x0 - 40, vy0 = VIEW.y0 - 40, vx1 = VIEW.x1 + 40, vy1 = VIEW.y1 + 40;
    ctx.fillStyle = '#07060b';
    ctx.fillRect(vx0, vy0, AR.x - vx0, vy1 - vy0); ctx.fillRect(AR.x + AR.w, vy0, vx1 - AR.x - AR.w, vy1 - vy0);
    ctx.fillRect(AR.x, vy0, AR.w, AR.y - vy0); ctx.fillRect(AR.x, AR.y + AR.h, AR.w, vy1 - AR.y - AR.h);
  }
  collectLights();
  renderLighting(x0, y0);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const [, , , , tr, tg, tb, ta] = G.amb;
  if (ta > 0.01 && !FX_LOW) { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(${tr | 0},${tg | 0},${tb | 0},${ta})`; ctx.fillRect(0, 0, CW, CH); ctx.globalCompositeOperation = 'source-over'; }
  drawGodRays();
  const top = ctx.createLinearGradient(0, 0, 0, CH * 0.5);
  top.addColorStop(0, `rgba(255,205,110,${cam.y < 400 && !inst ? 0.14 : 0.06})`); top.addColorStop(1, 'rgba(255,205,110,0)');
  ctx.fillStyle = top; ctx.fillRect(0, 0, CW, CH * 0.5);
  ctx.fillStyle = VIGNETTE; ctx.fillRect(0, 0, CW, CH);
  flushWText(x0, y0);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (G.flash > 0) { ctx.fillStyle = `rgba(150,10,10,${G.flash * 0.35})`; ctx.fillRect(0, 0, CW, CH); }
  drawInteractHints();
  if (G.mode !== 'title') drawHUD();
  if (G.mode === 'map') drawMap();
  if (G.white > 0) { ctx.fillStyle = `rgba(255,246,220,${G.white})`; ctx.fillRect(0, 0, CW, CH); }
  if (G.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${G.fade})`; ctx.fillRect(0, 0, CW, CH); }
}

// ───────────────────────── ánh sáng, không khí và thời tiết ─────────────────────────
// [độ tối, màu tối r,g,b, màu tông r,g,b, độ tông] cho từng vùng
const AMB = {
  'Nhà Nguyện Dawnrest': [0.22, 14, 12, 20, 255, 210, 150, 0.08],
  'Đồng Cỏ Mistveil': [0.14, 12, 16, 28, 255, 225, 170, 0.07],
  'Tàn Tích Hollowmere': [0.3, 14, 12, 22, 200, 180, 150, 0.08],
  'Cổng Gác Thornwall': [0.3, 16, 12, 10, 255, 200, 120, 0.1],
  'Đầm Lầy Ashmire': [0.42, 24, 10, 32, 150, 80, 170, 0.2],
  'Cao Nguyên Cinderreach': [0.3, 22, 16, 12, 210, 150, 90, 0.14],
  'Pháo Đài Greystone': [0.4, 10, 12, 24, 110, 130, 190, 0.14],
  'Rừng Wraithwood': [0.55, 4, 20, 28, 80, 200, 190, 0.2],
  'Đấu Trường Bloodsand': [0.24, 20, 14, 10, 230, 170, 110, 0.12],
  'Hồ Crystalmere': [0.2, 8, 16, 34, 150, 200, 255, 0.14],
  'Bờ Biển Saltreach': [0.1, 16, 20, 28, 255, 230, 190, 0.08],
  'Học Viện Starhollow': [0.46, 6, 10, 30, 140, 170, 255, 0.18],
  'Cao Nguyên Aurelia': [0.04, 30, 22, 8, 255, 215, 120, 0.1],
  'Sườn Núi Goldspire': [0.08, 26, 20, 12, 255, 210, 130, 0.1],
  'Kinh Thành Aurumhold': [0.08, 30, 22, 8, 255, 210, 110, 0.12],
  'Sân Ngai Sunthrone': [0.16, 30, 20, 6, 255, 200, 100, 0.14],
  'Cây Aurum': [0.02, 30, 20, 8, 255, 210, 110, 0.08],
  'Cõi Aurum': [0.5, 10, 6, 2, 255, 200, 110, 0.16],
  'Sảnh Hearthhold': [0.5, 12, 8, 4, 255, 190, 120, 0.12],
  'Hầm Mộ Tidewrack': [0.62, 8, 10, 16, 180, 190, 210, 0.12],
  'Mỏ Shardvein': [0.56, 4, 12, 30, 140, 200, 255, 0.18],
  'Hang Emberdeep': [0.58, 24, 8, 4, 255, 140, 70, 0.18],
  'Hầm Mộ Kingsrest': [0.5, 20, 14, 6, 255, 210, 130, 0.14],
};
const AMB_DEFAULT = AMB['Đồng Cỏ Mistveil'];
G.amb = AMB_DEFAULT.slice();
function updateAmbient(dt) {
  const tgt = AMB[G.region] || AMB_DEFAULT, k = 1 - Math.exp(-1.4 * dt);
  for (let i = 0; i < 8; i++) G.amb[i] += (tgt[i] - G.amb[i]) * k;
}
const LIGHTS = [];
function light(x, y, r, i, c) { if (r > 0 && LIGHTS.length < 120 && inView(x, y, r)) LIGHTS.push({ x, y, r, i, c }); }
const PCOL = { glint: '170,200,255', orb: '140,170,255', porb: '190,170,255', horb: '255,225,140', fireball: '255,140,60', gwave: '255,220,130', spit: '160,220,90', dagger: '255,210,110',
  shard: '170,220,255', comet: '180,220,255', bolt: '255,245,170', hwave: '255,220,130', hbolt: '255,225,140', cwave: '170,220,255' };
function collectLights() {
  LIGHTS.length = 0;
  const t = G.clock, inst = P.x > 4800 && G.mode !== 'title', A = inst ? areaAt(P.x, P.y) : null;
  if (G.mode !== 'title' && P.state !== 'dead') light(P.x, P.y, 170, 0.75, null);
  for (const g of GRACES) light(g.x, g.y - 10, S.discovered.includes(g.id) ? 280 : 170, 0.95 + Math.sin(t * 2.4 + g.id) * 0.05, '255,214,120');
  light(TREE_POS.x, TREE_POS.y, 820, 1, null); // cây đã tự phát sáng, chỉ cần xua bóng tối
  if (A && A.id === 'realm') light(RC.x, RC.y, 460, 0.45, '255,210,110');
  if (A && A.id === 'hub') { for (const [x, y] of [[180, 120], [820, 120], [180, 780], [820, 780], [500, 450]]) light(HUB.x + x, y, 230 + Math.sin(t * 9 + x) * 10, 0.9, '255,170,90'); light(HUB.x + 220 + 30, 262, 110, 0.8, '255,130,50'); }
  for (const b of BRAZIERS) if (S.fortOpen || G.braziers.includes(b.id)) light(b.x, b.y, 200 + Math.sin(t * 13 + b.x) * 12, 1, '255,150,60');
  for (const q of projs) if (PCOL[q.kind]) light(q.x, q.y, q.kind === 'fireball' || q.kind === 'comet' ? 130 : q.kind === 'gwave' || q.kind === 'hwave' ? 110 : q.kind === 'dagger' ? 50 : 80, 0.9, PCOL[q.kind]);
  for (const a of aoes) {
    if (a.kind === 'flash') light(a.x, a.y, a.r * 1.8, 1 - a.t / a.dur, a.col === 'fire' ? '255,140,60' : a.col === 'dust' ? null : a.col === 'magic' ? '170,215,255' : '255,220,140');
    else if (a.kind === 'delayed') light(a.x, a.y, a.r * 1.5, 0.3 + 0.5 * a.t / a.delay, a.col === 'magic' ? '170,215,255' : '255,214,110');
    else if (a.kind === 'ring') light(a.x, a.y, lerp(a.r0, a.r1, a.t / a.dur) + 40, 0.45 * (1 - a.t / a.dur), '255,222,140');
    else if (a.kind === 'mark') light(a.x, a.y, a.r * 1.3, 0.25 + 0.3 * a.t / a.dur, '255,110,60');
    else if (a.kind === 'arc') light(a.x + Math.cos(a.face) * 60, a.y + Math.sin(a.face) * 60, 140, 1 - a.t / a.dur, '170,210,255');
  }
  let n = 0;
  for (const p of parts) {
    if (p.kind === 'fire' && (n++ % 5 === 0)) light(p.x, p.y, 70, 0.5 * p.life / p.max, '255,140,50');
    else if (p.kind === 'firefly') light(p.x, p.y, 34, 0.5 * (0.45 + 0.55 * Math.sin(t * 5 + p.seed)), p.color === '#9ff5e6' ? '140,255,230' : '210,240,120');
  }
  if (S.lost) light(S.lost.x, S.lost.y, 110, 0.9, '150,255,180');
  for (const it of ITEMS) if (!S.taken.includes(it.id)) light(it.x, it.y, 70, 0.7, '255,240,200');
  for (const l of loot) light(l.x, l.y, 60, 0.6, l.rare ? '255,190,110' : '255,240,200');
  for (const c of CHESTS) if (!S.chests.includes(c.id) && (!c.req || c.req())) light(c.x, c.y, 80, 0.6, '255,210,120');
  for (const nt of NOTES) light(nt.x, nt.y, 50, 0.45, '255,150,60');
  for (const d of DOORS) light(d.x, d.y, 110, 0.6, '255,214,140');
  for (const st of STATUES) if (S.statues.includes(st.id)) light(st.x, st.y, 160, 0.9, '150,250,235');
  for (const f of MAP_FRAGS) if (!S.frags.includes(f.id)) light(f.x, f.y - 16, 110, 0.7, '190,215,255');
  if (!S.glade) light(BARRIER.x, BARRIER.y, 240, 0.7, '150,240,230');
  if (!S.acadOpen) light(-1550, 400, 150, 0.8, '170,220,255');
  for (const [px, py, rx, ry] of POOLS) light(px, py, Math.max(rx, ry) * 1.2, 0.3, '170,110,200');
  for (const q of puddles) light(q.x, q.y, 70, 0.35 * Math.min(1, (q.life - q.t) / 1.2), '150,220,90');
  if (!inst && (G.region === 'Hồ Crystalmere' || G.region === 'Học Viện Starhollow')) for (const o of OBST) if (o.crystal) light(o.x, o.y, 80, 0.5, '160,220,255');
  if (A && A.dg && A.dg.theme === 'crystal') for (let i = 0; i < 6; i++) light(A.x + 150 + (i % 3) * 350, 300 + Math.floor(i / 3) * 800, 200, 0.7, '140,200,255');
  if (A && A.dg && A.dg.theme === 'fire') for (const tr of TRAPS) if (tr.ph !== undefined) light(tr.x, tr.y, 120, 0.3 + (tr.ph < 0.4 ? 0.7 : 0), '255,120,50');
  if (A && A.dg) for (const y of [300, 800, 1300]) { light(A.x + 60, y, 180, 0.8, '255,170,90'); light(A.x + A.w - 60, y, 180, 0.8, '255,170,90'); }
  if (inRect(P.x, P.y, ACAD, 200)) for (const [x, y] of [[-2200, 200], [-900, 200], [-1700, -200], [-1100, -150], [-2100, -300], [-1550, -700]]) light(x, y, 240, 0.85, '160,190,255');
  for (const e of enemies) {
    if (e.dead || !inView(e.x, e.y, 200)) continue;
    if (e.T.ghost) light(e.x, e.y, e.T.miniboss ? 170 : 90, 0.6, '170,220,255');
    if (e.state === 'atk' && e.atk && e.T.look && e.T.look.orb && e.t < e.atk.wind) light(e.x, e.y, 90, e.t / e.atk.wind, e.type === 'bomber' ? '255,140,60' : e.T.look.orb === '#ffe08a' ? '255,225,140' : '140,170,255');
    if (e.T.look && e.T.look.glow) light(e.x, e.y, 70 * (e.T.look.scale || 1), 0.45, e.T.look.glow === '#ffd76a' ? '255,214,120' : '160,215,255');
    if (e.T.miniboss && !e.T.ghost) light(e.x, e.y, 140, 0.45, '150,170,230');
  }
  if (boss && !boss.dead && boss.state !== 'dormant') light(boss.x, boss.y - boss.z, boss.phase === 2 || boss.v === 2 ? 230 : 120, 0.7, '255,210,110');
  if (dragon && !dragon.dead) {
    if (dragon.breathing || dragon.charge > 0) { const h = dragonHead(dragon); light(h.x, h.y, 210, 1, '255,150,60'); }
    else light(dragon.x, dragon.y, 90, 0.25, '255,150,80');
  }
  if (fb && !fb.dead) {
    light(fb.x, fb.y - fb.z, fb.phase === 2 ? 340 : 210, 1, '255,220,130');
    if (fb.beaming) { const h = finalHead(fb); for (let i = 1; i <= 6; i++) light(h.x + Math.cos(fb.beamDir) * i * 75, h.y + Math.sin(fb.beamDir) * i * 75, 150, 0.9, '255,235,170'); }
  }
  if (P.state === 'cast' && P.spell) light(P.x + Math.cos(P.face) * 20, P.y + Math.sin(P.face) * 20, 130, 0.8, SPELLS[P.spell].school === 'sorc' ? '170,200,255' : '255,220,130');
  if (P.flameT > 0) light(P.x + Math.cos(P.face) * 60, P.y + Math.sin(P.face) * 60, 160, 0.9, '255,140,50');
  if (P.buffs.flame > 0) light(P.x, P.y, 90, 0.5, '255,140,60');
  else if (P.buffs.holy > 0 || P.buffs.bless > 0) light(P.x, P.y, 90, 0.5, '255,225,140');
  if (P.state === 'drink') light(P.x, P.y, 120, 0.6, P.drinkFp ? '110,150,255' : '255,90,70');
  if (P.mounted) light(P.x, P.y, 90, 0.4, '150,200,255');
}
function renderLighting(x0, y0) {
  const a = G.amb[0], lw = lightCanvas.width, lh = lightCanvas.height, k = DPR * ZOOM * LSCALE;
  if (a > 0.01) {
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.globalCompositeOperation = 'source-over'; lctx.clearRect(0, 0, lw, lh);
    lctx.fillStyle = `rgba(${G.amb[1] | 0},${G.amb[2] | 0},${G.amb[3] | 0},${a})`; lctx.fillRect(0, 0, lw, lh);
    lctx.globalCompositeOperation = 'destination-out';
    for (const l of LIGHTS) {
      const sx = (l.x - x0) * k, sy = (l.y - y0) * k, rr = l.r * k, i = Math.min(1, Math.max(0, l.i));
      const gr = lctx.createRadialGradient(sx, sy, 0, sx, sy, rr);
      gr.addColorStop(0, `rgba(0,0,0,${i})`); gr.addColorStop(0.5, `rgba(0,0,0,${i * 0.55})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = gr; lctx.fillRect(sx - rr, sy - rr, rr * 2, rr * 2);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(lightCanvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
  }
  // hào quang: cộng sáng quanh các nguồn sáng có màu
  ctx.setTransform(WZ, 0, 0, WZ, -x0 * WZ, -y0 * WZ);
  ctx.globalCompositeOperation = 'lighter';
  const boost = 0.55 + a;
  for (const l of LIGHTS) {
    if (!l.c) continue;
    const rr = l.r * (FX_LOW ? 0.45 : 0.7), i = Math.min(1, Math.max(0, l.i));
    const gr = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, rr);
    gr.addColorStop(0, `rgba(${l.c},${0.22 * i * boost})`); gr.addColorStop(1, `rgba(${l.c},0)`);
    ctx.fillStyle = gr; ctx.fillRect(l.x - rr, l.y - rr, rr * 2, rr * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
}
function drawGodRays() {
  const near = cam.x > 4800 && G.mode !== 'title' ? 0 : clamp((2400 - dist(cam.x, cam.y, TREE_POS.x, TREE_POS.y)) / 1600, 0, 1) + (cam.y < 380 && cam.x < 4800 ? 0.35 : 0);
  if (near <= 0 || FX_LOW) return;
  const t = G.clock, nn = Math.min(1, near);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const x = CW * (0.1 + i * 0.2) + Math.sin(t * 0.2 + i * 1.7) * 40 - (cam.x - TREE_POS.x) * 0.15, w = 50 + i % 2 * 40;
    const gr = ctx.createLinearGradient(0, 0, 0, CH);
    gr.addColorStop(0, `rgba(255,220,140,${0.055 * nn * (0.7 + 0.3 * Math.sin(t * 0.7 + i))})`); gr.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x + w, -10); ctx.lineTo(x + w + CH * 0.35, CH); ctx.lineTo(x + CH * 0.35, CH); ctx.closePath(); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}
// thời tiết và sinh vật nhỏ theo vùng
const FOG_COL = { 'Đầm Lầy Ashmire': '190,150,210', 'Rừng Wraithwood': '160,230,220', 'Cao Nguyên Cinderreach': '200,185,170', 'Hồ Crystalmere': '190,220,245', 'Học Viện Starhollow': '170,190,240', 'Bờ Biển Saltreach': '230,235,240', 'Hầm Mộ Tidewrack': '180,190,200', 'Mỏ Shardvein': '160,210,250' };
function weather(dt, x0, y0, vw, vh) {
  const reg = G.mode === 'title' ? 'Đồng Cỏ Mistveil' : G.region;
  let fog = 0, ff = 0;
  for (const p of parts) { if (p.kind === 'fog') fog++; else if (p.kind === 'firefly') ff++; }
  const fogCol = FOG_COL[reg] || '225,230,235';
  const foggy = ['Đồng Cỏ Mistveil', 'Nhà Nguyện Dawnrest', 'Đầm Lầy Ashmire', 'Rừng Wraithwood', 'Tàn Tích Hollowmere', 'Hồ Crystalmere', 'Bờ Biển Saltreach', 'Học Viện Starhollow', 'Hầm Mộ Tidewrack', 'Mỏ Shardvein'].includes(reg);
  if (!FX_LOW && foggy && fog < 12 && Math.random() < dt * 1.3)
    addPart(x0 - 150 + Math.random() * (vw + 150), y0 + Math.random() * vh, rand(6, 16), rand(-3, 3), rand(10, 16), rand(120, 240), fogCol, 'fog', { alpha: reg === 'Đồng Cỏ Mistveil' || reg === 'Nhà Nguyện Dawnrest' || reg === 'Bờ Biển Saltreach' ? rand(0.05, 0.08) : rand(0.07, 0.11) });
  if (['Cao Nguyên Cinderreach', 'Pháo Đài Greystone', 'Đấu Trường Bloodsand', 'Cổng Gác Thornwall', 'Hang Emberdeep'].includes(reg) && Math.random() < dt * (FX_LOW ? 8 : 22))
    addPart(x0 + Math.random() * vw, y0 - 10, rand(5, 20), rand(18, 36), 7, rand(1, 2), Math.random() < 0.8 ? '#b8b0a4' : '#e09060', 'ash');
  if ((reg === 'Rừng Wraithwood' || reg === 'Đầm Lầy Ashmire') && ff < 40 && Math.random() < dt * (reg === 'Rừng Wraithwood' ? 10 : 4))
    addPart(x0 + Math.random() * vw, y0 + Math.random() * vh, rand(-10, 10), rand(-10, 10), rand(4, 7), rand(1.4, 2.2), reg === 'Rừng Wraithwood' ? '#9ff5e6' : '#d4f07a', 'firefly', { seed: rand(0, 10) });
  if ((reg === 'Hồ Crystalmere' || reg === 'Học Viện Starhollow' || reg === 'Mỏ Shardvein') && Math.random() < dt * 6)
    addPart(x0 + Math.random() * vw, y0 + Math.random() * vh, rand(-4, 4), rand(-14, -4), rand(3, 5), rand(1, 1.8), '#cfeaff', 'mote');
  if (['Cao Nguyên Aurelia', 'Sườn Núi Goldspire', 'Kinh Thành Aurumhold', 'Sân Ngai Sunthrone', 'Cây Aurum', 'Cõi Aurum'].includes(reg) && Math.random() < dt * 7)
    addPart(x0 + Math.random() * vw, y0 - 10, 0, rand(22, 38), rand(8, 12), 3, Math.random() < 0.5 ? '#f0cf72' : '#ffe39a', 'leaf', { seed: rand(0, 10) });
}
// cỏ lay theo gió, rẽ sang khi nhân vật đi qua
const grassCache = new Map();
const GRASS_PAL = {
  meadow: ['#6f7d40', '#58652f', '#8a9448'], gold: ['#d8b862', '#c9a34a', '#f0d27a'], swamp: ['#4a4838', '#5a5040', '#3d3a2e'],
  forest: ['#3f7a72', '#2f5f5a', '#5aa096'], east: ['#6a6448', '#57533c', '#7d7654'], lake: ['#4d7a6a', '#3e6656', '#6a9a84'], coast: ['#8a8a5a', '#77774c', '#9a9868'],
};
function grassAt(x, y) {
  if (x > MAPW - 20 || y > H - 20 || x < WX0 + 20 || y < WY0 + 20) return null;
  if (isVoid(x, y) || inRect(x, y, CAPITAL, 20) || inRect(x, y, ACAD, 20) || inWater(x, y, 10)) return null;
  if (y < 380 && x >= 0) return y > 360 ? null : GRASS_PAL.gold;
  if (x < 0) { if (nearRoad(x, y) < 44 || x < -2440) return null; return y >= 2600 ? GRASS_PAL.coast : GRASS_PAL.lake; }
  if (y < 440 || inArena(x, y) || inRect(x, y, FORT, 20) || inRect(x, y, COLO.rect, 20) || (x > 370 && x < 1030 && y > 1600 && y < 2210) || (x > 1220 && x < 1580 && y > 3170)) return null;
  if (nearRoad(x, y) < 44 || inPool(x, y) || dist(x, y, LAIR.x, LAIR.y) < 260) return null;
  if (inRect(x, y, FOREST)) return GRASS_PAL.forest;
  if (x > SWAMP.x && x < 2800 && y > SWAMP.y && y < SWAMP.y + SWAMP.h) return GRASS_PAL.swamp;
  if (x > 2800) return GRASS_PAL.east;
  return GRASS_PAL.meadow;
}
// lớp chi tiết mặt đất: cọng cỏ và sỏi nhỏ sáng/tối trong suốt, lát lặp ở độ phân giải đầy đủ
// nên chỉ thêm độ sần mà không đổi màu vùng, giúp nền đất bớt mờ khi phóng to
const DETAIL = (() => {
  const c = makeCanvas(256, 256), g = c.getContext('2d'), r = mulberry32(909);
  g.lineCap = 'round';
  for (let i = 0; i < 1500; i++) {
    const x = r() * 256, y = r() * 256, l = 2.5 + r() * 5, a = -Math.PI / 2 + (r() - 0.5) * 1.2;
    g.strokeStyle = r() < 0.45 ? `rgba(255,250,225,${0.12 + r() * 0.16})` : `rgba(0,0,0,${0.14 + r() * 0.2})`; g.lineWidth = 0.8 + r() * 0.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  for (let i = 0; i < 600; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,250,225,.18)' : 'rgba(0,0,0,.22)'; g.beginPath(); g.arc(r() * 256, r() * 256, 0.6 + r() * 1.1, 0, TAU); g.fill(); }
  return c;
})();
let DETAIL_PAT = null;
const PAVED = new Set(['Kinh Thành Aurumhold', 'Sân Ngai Sunthrone', 'Pháo Đài Greystone', 'Học Viện Starhollow', 'Đấu Trường Bloodsand', 'Cổng Gác Thornwall']);
function drawGroundDetail() {
  // chỉ phủ cỏ sỏi ngoài trời, không phủ lên sàn đá lát của các công trình và khu biệt lập
  if (FX_LOW || cam.x > 4800 || PAVED.has(G.region)) return;
  if (!DETAIL_PAT) DETAIL_PAT = ctx.createPattern(DETAIL, 'repeat');
  ctx.save(); ctx.fillStyle = DETAIL_PAT;
  // khoét vùng nước (hồ, biển) ra khỏi lớp cỏ sỏi: mỗi lần cắt bỏ một vùng, các lần cắt giao nhau
  const vx = VIEW.x0 - 10, vy = VIEW.y0 - 10, vw = VIEW.x1 - VIEW.x0 + 20, vh = VIEW.y1 - VIEW.y0 + 20;
  const hole = draw => { ctx.beginPath(); ctx.rect(vx, vy, vw, vh); draw(); ctx.clip('evenodd'); };
  for (const [px, py, rx, ry] of LAKE) if (inView(px, py, Math.max(rx, ry))) hole(() => { ctx.moveTo(px + rx, py); ctx.ellipse(px, py, rx, ry, 0, 0, TAU); });
  if (VIEW.x0 < -2400 && VIEW.y1 > 2600) hole(() => ctx.rect(WX0 - 50, 2600, -2480 - WX0 + 50 + 20, H - 2600 + 50));
  ctx.fillRect(vx, vy, vw, vh); ctx.restore();
}
function drawGrass() {
  if (FX_LOW || (cam.x > 4800 && G.mode !== 'title')) return;
  const cell = 46, t = G.clock;
  const gx0 = Math.floor(VIEW.x0 / cell), gx1 = Math.ceil(VIEW.x1 / cell), gy0 = Math.floor(VIEW.y0 / cell), gy1 = Math.ceil(VIEW.y1 / cell);
  ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) {
    const key = gx * 100000 + gy;
    let c = grassCache.get(key);
    if (c === undefined) {
      const h = Math.abs(Math.sin(gx * 127.1 + gy * 311.7) * 43758.5453) % 1;
      const x = gx * cell + ((h * 7.31) % 1) * cell, y = gy * cell + ((h * 13.17) % 1) * cell;
      c = h < 0.3 ? null : { x, y, pal: grassAt(x, y), h };
      if (c && !c.pal) c = null;
      grassCache.set(key, c);
    }
    if (!c) continue;
    const sway = Math.sin(t * 1.8 + c.x * 0.02 + c.y * 0.013) * 3;
    let bend = 0;
    const dx = c.x - P.x, dy = c.y - P.y, d = Math.hypot(dx, dy);
    if (d < 36 && G.mode !== 'title') bend = (dx >= 0 ? 1 : -1) * (36 - d) * 0.25;
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 1, 6, 2, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < 4; k++) {
      const bx = c.x + k * 2.6 - 4, hh = 8 + ((k * 5 + c.h * 11) % 5) + c.h * 3;
      ctx.strokeStyle = c.pal[k % 3];
      ctx.beginPath(); ctx.moveTo(bx, c.y); ctx.quadraticCurveTo(bx + sway * 0.4 + (k - 1.5), c.y - hh * 0.55, bx + sway + bend + (k - 1.5) * 1.6, c.y - hh); ctx.stroke();
    }
    if (c.h > 0.9) { ctx.fillStyle = c.h > 0.95 ? '#e9e2cf' : '#d9c46a'; ctx.beginPath(); ctx.arc(c.x + sway + bend, c.y - 12 - c.h * 3, 1.8, 0, TAU); ctx.fill(); }
  }
  ctx.lineCap = 'butt';
}
// mặt nước: ao độc lấp lánh, hồ pha lê gợn sóng, sóng biển
function drawWater() {
  const t = G.clock;
  for (const [px, py, rx, ry] of POOLS) {
    if (!inView(px, py, rx + 10)) continue;
    for (let i = 0; i < 2; i++) {
      const ox = Math.sin(t * 0.6 + i * 2.1 + px) * rx * 0.35, oy = Math.cos(t * 0.5 + i * 1.3 + py) * ry * 0.3;
      ctx.fillStyle = `rgba(225,190,240,${0.1 + 0.06 * Math.sin(t * 2 + i + px)})`;
      ctx.beginPath(); ctx.ellipse(px + ox, py + oy, rx * 0.28, ry * 0.12, 0, 0, TAU); ctx.fill();
    }
    for (let i = 0; i < 3; i++) {
      // bong bóng độc nổi lên rồi vỡ
      const ph = (t * 0.7 + i * 0.37 + px * 0.01) % 1, bx = px + Math.sin(i * 2.3 + px) * rx * 0.5, by = py + Math.cos(i * 1.7 + py) * ry * 0.45;
      ctx.strokeStyle = `rgba(235,200,250,${0.5 * (1 - ph)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx, by, 1.5 + ph * 4, 0, TAU); ctx.stroke();
    }
    ctx.strokeStyle = `rgba(200,160,220,${0.18 + 0.08 * Math.sin(t * 1.5 + px)})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(px, py, rx * (0.85 + 0.05 * Math.sin(t + py)), ry * (0.85 + 0.05 * Math.sin(t + py)), 0, 0, TAU); ctx.stroke();
  }
  if (VIEW.x0 < 0 && VIEW.y1 > 380 && VIEW.y0 < 2700) {
    // gợn sáng trên mặt hồ, đặt theo lưới cố định để không nhấp nháy
    const cell = 90;
    for (let gx = Math.floor(VIEW.x0 / cell); gx <= Math.ceil(Math.min(0, VIEW.x1) / cell); gx++) for (let gy = Math.floor(VIEW.y0 / cell); gy <= Math.ceil(VIEW.y1 / cell); gy++) {
      const h = Math.abs(Math.sin(gx * 91.7 + gy * 47.3) * 9187.13) % 1, x = gx * cell + h * cell, y = gy * cell + ((h * 7.7) % 1) * cell;
      if (!inWater(x, y, -12)) continue;
      const a = 0.08 + 0.1 * Math.sin(t * 1.6 + h * 20);
      ctx.strokeStyle = `rgba(210,240,255,${a})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x - 12 + Math.sin(t + h * 9) * 4, y); ctx.lineTo(x + 12 + Math.sin(t + h * 9) * 4, y); ctx.stroke();
    }
    // bọt sóng quanh bờ hồ, chạy chậm theo nét đứt
    ctx.strokeStyle = `rgba(230,245,250,${0.3 + 0.1 * Math.sin(t * 1.2)})`; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath();
    for (const [px, py, rx, ry] of LAKE) {
      if (!inView(px, py, Math.max(rx, ry) + 20)) continue;
      const n = Math.ceil((rx + ry) / 9), sh = Math.sin(t * 0.8) * 2;
      for (let i = 0; i < n; i++) {
        const a = (i + t * 0.05) / n * TAU, x = px + Math.cos(a) * (rx - 3 + sh), y = py + Math.sin(a) * (ry - 3 + sh);
        if (i % 2 || !inView(x, y, 10) || inWater(px + Math.cos(a) * (rx + 12), py + Math.sin(a) * (ry + 12))) continue;
        const a2 = a + 0.5 / n * TAU; ctx.moveTo(x, y); ctx.lineTo(px + Math.cos(a2) * (rx - 3 + sh), py + Math.sin(a2) * (ry - 3 + sh));
      }
    }
    ctx.stroke(); ctx.lineCap = 'butt';
    for (const e of [P, ...enemies]) if (!e.dead && inView(e.x, e.y, 30) && inWater(e.x, e.y) && !(e.T && e.T.flier)) { ctx.strokeStyle = `rgba(210,240,255,${0.35 + 0.15 * Math.sin(t * 5)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(e.x, e.y + 6, e.r + 6, (e.r + 6) * 0.45, 0, 0, TAU); ctx.stroke(); }
  }
  if (VIEW.x0 < -2400 && VIEW.y1 > 2600) {
    ctx.strokeStyle = `rgba(235,245,250,${0.35 + 0.2 * Math.sin(t * 1.3)})`; ctx.lineWidth = 3;
    const fx = -2480 + Math.sin(t * 0.9) * 14, y0 = Math.max(2600, VIEW.y0), y1 = Math.min(H, VIEW.y1);
    // cát ướt sẫm màu chạy theo sóng, vạch bọt thứ hai mờ hơn phía ngoài, và ánh nắng lấp lánh trên biển
    ctx.fillStyle = 'rgba(70,62,40,.22)'; ctx.beginPath(); ctx.moveTo(fx, y0);
    for (let y = y0; y <= y1; y += 20) ctx.lineTo(fx + 26 + Math.sin(y * 0.03 + t) * 8 + Math.sin(t * 0.9) * 6, y);
    ctx.lineTo(fx, y1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); for (let y = y0; y < y1; y += 20) { const x = fx + Math.sin(y * 0.03 + t) * 8; y === y0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    ctx.strokeStyle = `rgba(235,245,250,${0.18 + 0.12 * Math.sin(t * 1.3 + 1.5)})`; ctx.lineWidth = 2;
    ctx.beginPath(); for (let y = y0; y < y1; y += 20) { const x = fx - 28 + Math.sin(y * 0.025 + t * 1.2 + 2) * 10; y === y0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    for (let gy = Math.floor(y0 / 60); gy * 60 < y1; gy++) for (let gx = Math.floor(WX0 / 60); gx * 60 < fx - 40; gx++) {
      const h = Math.abs(Math.sin(gx * 12.9 + gy * 78.2) * 43758.5) % 1, a = Math.sin(t * 2 + h * 30);
      if (a < 0.6) continue;
      ctx.fillStyle = `rgba(255,255,240,${(a - 0.6) * 1.6})`; ctx.fillRect(gx * 60 + h * 60, gy * 60 + ((h * 7) % 1) * 60, 5, 1.5);
    }
  }
}
