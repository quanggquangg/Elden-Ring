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
function drawWeapon(L, s, wAng, o) {
  ctx.save(); ctx.translate(3 * s + (o.thrust || 0) * 14 * s, 8 * s); ctx.rotate(wAng);
  const len = L.wlen * s;
  if (o.hammer !== undefined) {
    const g = o.hammer;
    ctx.strokeStyle = '#6b5a3e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(70, 0); ctx.stroke();
    ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 20 + g * 30;
    ctx.fillStyle = `rgba(245,${200 + g * 40},${110 + g * 60},.95)`; ctx.fillRect(62, -22, 26, 44);
    ctx.shadowBlur = 0;
  } else if (L.weapon === 'staff') {
    ctx.strokeStyle = L.wcol; ctx.lineWidth = 2.6 * s; ctx.beginPath(); ctx.moveTo(-6 * s, 0); ctx.lineTo(len, 0); ctx.stroke();
    const c = o.charge || 0;
    ctx.fillStyle = L.orb; ctx.shadowColor = L.orb; ctx.shadowBlur = 8 + c * 16;
    ctx.beginPath(); ctx.arc(len, 0, (3 + c * 4) * s, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  } else if (L.weapon === 'spear') {
    ctx.strokeStyle = '#6b5a3e'; ctx.lineWidth = 2.6 * s; ctx.beginPath(); ctx.moveTo(-12 * s, 0); ctx.lineTo(len - 8 * s, 0); ctx.stroke();
    ctx.fillStyle = L.wcol; ctx.beginPath(); ctx.moveTo(len + 5 * s, 0); ctx.lineTo(len - 9 * s, -3.2 * s); ctx.lineTo(len - 9 * s, 3.2 * s); ctx.closePath(); ctx.fill();
  } else if (L.weapon === 'bow') {
    const c = o.charge || 0;
    ctx.strokeStyle = L.wcol; ctx.lineWidth = 2.4 * s; ctx.beginPath(); ctx.arc(6 * s, 0, 13 * s, -1.25, 1.25); ctx.stroke();
    const ex = 6 * s + Math.cos(1.25) * 13 * s, ey = Math.sin(1.25) * 13 * s, px = ex - 3 * s - c * 10 * s;
    ctx.strokeStyle = 'rgba(230,225,210,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ex, -ey); ctx.lineTo(px, 0); ctx.lineTo(ex, ey); ctx.stroke();
    if (c > 0) { ctx.strokeStyle = '#d8d2c0'; ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px + 26 * s, 0); ctx.stroke(); }
  } else if (L.weapon === 'axe') {
    ctx.strokeStyle = '#5a4630'; ctx.lineWidth = 2.8 * s; ctx.beginPath(); ctx.moveTo(-6 * s, 0); ctx.lineTo(len, 0); ctx.stroke();
    ctx.fillStyle = L.wcol; ctx.strokeStyle = 'rgba(10,8,6,.7)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(len - 12 * s, -2 * s); ctx.quadraticCurveTo(len - 4 * s, -16 * s, len + 4 * s, -14 * s); ctx.lineTo(len + 2 * s, 2 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (L.weapon === 'club') {
    ctx.strokeStyle = '#4a3a28'; ctx.lineWidth = 3.2 * s; ctx.beginPath(); ctx.moveTo(-4 * s, 0); ctx.lineTo(len - 6 * s, 0); ctx.stroke();
    ctx.fillStyle = L.wcol; ctx.strokeStyle = 'rgba(10,8,6,.7)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(len - 4 * s, 0, 8 * s, 6.5 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
  } else if (L.weapon === 'scythe') {
    ctx.strokeStyle = '#3a3a4a'; ctx.lineWidth = 2.6 * s; ctx.beginPath(); ctx.moveTo(-8 * s, 0); ctx.lineTo(len, 0); ctx.stroke();
    ctx.strokeStyle = L.wcol; ctx.lineWidth = 2.4 * s; ctx.shadowColor = L.wcol; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(len, 0); ctx.quadraticCurveTo(len - 4 * s, -16 * s, len - 22 * s, -18 * s); ctx.stroke(); ctx.shadowBlur = 0;
  } else if (L.weapon === 'katana') {
    ctx.strokeStyle = L.wcol; ctx.lineWidth = 2.2 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(4 * s, 0); ctx.quadraticCurveTo(len * 0.6, -2.5 * s, len, -5 * s); ctx.stroke();
    ctx.strokeStyle = '#2b2622'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(-5 * s, 0); ctx.lineTo(2.5 * s, 0); ctx.stroke();
    ctx.fillStyle = '#b08d4c'; ctx.beginPath(); ctx.arc(3.5 * s, 0, 2.2 * s, 0, TAU); ctx.fill(); ctx.lineCap = 'butt';
  } else {
    const wide = L.weapon === 'greatsword' ? 5 : 3;
    if (L.glow) { ctx.shadowColor = typeof L.glow === 'string' ? L.glow : '#ffd76a'; ctx.shadowBlur = 12; }
    ctx.strokeStyle = L.wcol; ctx.lineWidth = wide * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(3 * s, 0); ctx.lineTo(len, 0); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(5 * s, -wide * s * 0.2); ctx.lineTo(len - 2 * s, -wide * s * 0.2); ctx.stroke();
    ctx.strokeStyle = '#6b5a3e'; ctx.lineWidth = 2.6 * s; ctx.beginPath(); ctx.moveTo(4 * s, -5 * s); ctx.lineTo(4 * s, 5 * s); ctx.stroke();
    ctx.lineCap = 'butt';
  }
  ctx.restore();
}
function drawHumanoid(x, y, face, L, wAng, o = {}) {
  if (PIXEL && (ctx === wctx || ctx === sctx)) { drawHumanoidPx(x, y, face, L, wAng, o); return; }
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
  ctx.fillStyle = L.cloak;
  ctx.beginPath(); ctx.moveTo(-1 * s, -10 * s);
  ctx.quadraticCurveTo(-16 * s, -12 * s + wave, -22 * s, -4 * s + wave); ctx.lineTo(-18 * s, 0); ctx.lineTo(-23 * s, 5 * s - wave);
  ctx.quadraticCurveTo(-15 * s, 12 * s - wave, -1 * s, 10 * s); ctx.closePath(); ctx.fill();
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
  ctx.strokeStyle = 'rgba(10,8,6,.75)'; ctx.lineWidth = 1.4;
  ctx.fillStyle = L.body; ctx.beginPath(); ctx.ellipse(0, 0, 9 * s, 12 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = L.trim;
  ctx.beginPath(); ctx.arc(1 * s, -10 * s, 4.6 * s, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(1 * s, 10 * s, 4.6 * s, 0, TAU); ctx.fill(); ctx.stroke();
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
  ctx.fillStyle = L.head; ctx.beginPath(); ctx.arc(2 * s, 0, 6.4 * s, 0, TAU); ctx.fill(); ctx.stroke();
  if (L.hood) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(4 * s, 0, 4 * s, -1.2, 1.2); ctx.fill(); }
  else { ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.moveTo(6.5 * s, -3 * s); ctx.lineTo(6.5 * s, 3 * s); ctx.stroke(); }
  if (o.eyes) { ctx.fillStyle = o.eyes; ctx.shadowColor = o.eyes; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(6 * s, -2.2 * s, 1.1 * s, 0, TAU); ctx.arc(6 * s, 2.2 * s, 1.1 * s, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; }
  if (o.flash) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(0, 0, 10 * s, 13 * s, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
// ───────────────────────── người pixel art góc nhìn 3/4 ─────────────────────────
// Ở chế độ pixel, người (nhân vật chính, quái hình người, boss) được vẽ đứng thẳng theo 4 hướng bằng các ô vuông
// đúng lưới điểm ảnh: có bước chân, áo choàng, vũ khí vung theo tay. Viền tối được thêm sau ở bước làm sắc.
const PX_SHADE = {};
function pxShade(c, f) {
  const k = c + f; if (PX_SHADE[k]) return PX_SHADE[k];
  if (typeof c !== 'string' || c[0] !== '#' || c.length !== 7) return (PX_SHADE[k] = c);
  const n = parseInt(c.slice(1), 16), m = v => Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f))));
  return (PX_SHADE[k] = `rgb(${m(n >> 16)},${m((n >> 8) & 255)},${m(n & 255)})`);
}
function pxLine(x0, y0, x1, y1, w, col) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, h = w >> 1;
  let e = dx + dy; ctx.fillStyle = col;
  for (let n = 0; n < 400; n++) {
    ctx.fillRect(x0 - h, y0 - h, w, w);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; }
  }
}
function drawHumanoidPx(x, y, face, L, wAng, o) {
  const T = ctx.getTransform(), s = L.scale || 1, q = v => Math.max(1, Math.round(v * s));
  const fx = Math.round(x * T.a + T.e), fy = Math.round((y - (o.z || 0)) * T.d + T.f + 6 * s);
  const c = Math.cos(face), sn = Math.sin(face);
  const dir = Math.abs(c) > Math.abs(sn) * 1.1 ? (c > 0 ? 'r' : 'l') : sn > 0 ? 'd' : 'u', side = dir === 'r' || dir === 'l', m = dir === 'l' ? -1 : 1;
  const R = (a, b, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(fx + (m < 0 ? -a - w : a), fy + b, w, h); };
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  const body = L.body || '#5a5448', trim = L.trim || '#8a8474', head = L.head || '#8a8070', cloak = L.cloak || pxShade(body, -0.35);
  const bw = side ? q(6) : q(8), hw = side ? q(5) : q(6), torsoH = q(7), legH = o.kneel ? q(1) : q(4), headH = q(6);
  const kneel = o.kneel ? q(3) : 0, top = -legH - torsoH - headH;
  // bóng dưới chân
  ctx.globalAlpha *= 0.4; ctx.fillStyle = '#000'; ctx.fillRect(fx - q(6), fy - 1, q(12), 2); ctx.fillRect(fx - q(4), fy + 1, q(8), 1); ctx.globalAlpha /= 0.4;
  if (o.ball !== undefined) {
    // lăn: cuộn tròn thành một khối, đầu xoay quanh
    const r = q(5), cy = fy - r - 1;
    ctx.fillStyle = cloak; ctx.fillRect(fx - r, cy - r + 1, r * 2, r * 2 - 2); ctx.fillRect(fx - r + 1, cy - r, r * 2 - 2, r * 2);
    ctx.fillStyle = body; ctx.fillRect(fx - r + 2, cy - r + 2, r * 2 - 4, r * 2 - 4);
    const a = o.ball * TAU * (m < 0 ? -1 : 1); ctx.fillStyle = head; ctx.fillRect(Math.round(fx + Math.cos(a) * (r - 2)) - 1, Math.round(cy + Math.sin(a) * (r - 2)) - 1, 3, 3);
    ctx.restore(); return;
  }
  const walk = o.anim ? Math.sin(o.anim * 6) : 0, step = Math.abs(walk) > 0.35 ? Math.sign(walk) : 0;
  // vũ khí: hướng trên mặt đất = face + wAng, chiếu xuống màn hình (trục y thu lại vì góc nhìn nghiêng)
  const A = face + wAng, len = Math.max(6, (L.wlen || 30) * 0.55 * s + (o.thrust || 0) * 6 * s);
  const hx = fx + (side ? m * q(2) : dir === 'd' ? -q(5) : q(5)), hy = fy - legH - q(3) + kneel;
  const ex = hx + Math.cos(A) * len, ey = hy + Math.sin(A) * len * 0.7;
  const drawWeaponPx = () => {
    const wc = L.wcol || '#c8c4b8', wt = L.weapon;
    if (o.trail) {
      ctx.globalAlpha *= 0.55;
      for (let k = 0; k <= 10; k++) {
        const a = face + lerp(o.trail[0], o.trail[1], k / 10), rr = len * 0.9;
        ctx.fillStyle = k % 3 ? '#fff4d2' : '#ffffff'; ctx.fillRect(Math.round(hx + Math.cos(a) * rr) - 1, Math.round(hy + Math.sin(a) * rr * 0.7) - 1, 3, 3);
      }
      ctx.globalAlpha /= 0.55;
    }
    if (o.hammer !== undefined) { pxLine(hx, hy, hx + Math.cos(A) * 34, hy + Math.sin(A) * 24, 2, '#6b5a3e'); const bx = hx + Math.cos(A) * 36, by = hy + Math.sin(A) * 25; ctx.fillStyle = '#ffe08a'; ctx.fillRect(Math.round(bx) - 5, Math.round(by) - 7, 11, 14); ctx.fillStyle = '#fff6d0'; ctx.fillRect(Math.round(bx) - 3, Math.round(by) - 5, 3, 10); return; }
    if (wt === 'bow') {
      const px = -Math.sin(A), py = Math.cos(A) * 0.7, bx = hx + Math.cos(A) * 3, by = hy + Math.sin(A) * 2;
      for (let k = -5; k <= 5; k++) { const bend = (1 - (k * k) / 25) * 3; ctx.fillStyle = wc; ctx.fillRect(Math.round(bx + px * k * s + Math.cos(A) * bend), Math.round(by + py * k * s + Math.sin(A) * bend * 0.7), 1, 1); }
      if (o.charge) pxLine(bx - Math.cos(A) * o.charge * 5, by - Math.sin(A) * o.charge * 3, bx + Math.cos(A) * 12, by + Math.sin(A) * 8, 1, '#e8e2d0');
      return;
    }
    const shaft = wt === 'spear' || wt === 'staff' || wt === 'scythe' || wt === 'axe' || wt === 'club';
    pxLine(hx - Math.cos(A) * 2, hy - Math.sin(A) * 1.4, ex, ey, wt === 'greatsword' ? q(2) + 1 : shaft ? 1 + (s > 1.3 ? 1 : 0) : q(1) + (s > 1.4 ? 1 : 0), shaft ? (wt === 'staff' ? wc : '#6b5a3e') : wc);
    if (!shaft) { ctx.fillStyle = '#6b5a3e'; ctx.fillRect(Math.round(hx) - 1, Math.round(hy) - 1, 3, 3); if (L.glow) { ctx.fillStyle = typeof L.glow === 'string' ? L.glow : '#ffd76a'; ctx.fillRect(Math.round((hx + ex) / 2), Math.round((hy + ey) / 2), 1, 1); } }
    const X = Math.round(ex), Y = Math.round(ey);
    if (wt === 'spear') pxLine(ex, ey, ex + Math.cos(A) * 4 * s, ey + Math.sin(A) * 3 * s, 2, wc);
    else if (wt === 'staff') { const r = 1 + Math.round((o.charge || 0) * 2); ctx.fillStyle = L.orb || '#bfe4ff'; ctx.fillRect(X - r, Y - r, r * 2 + 1, r * 2 + 1); }
    else if (wt === 'axe') { ctx.fillStyle = wc; ctx.fillRect(X - q(2), Y - q(3), q(4), q(5)); }
    else if (wt === 'club') { ctx.fillStyle = wc; ctx.fillRect(X - q(3), Y - q(3), q(6), q(6)); }
    else if (wt === 'scythe') pxLine(ex, ey, ex - Math.sin(A) * 8 * s - Math.cos(A) * 3 * s, ey + Math.cos(A) * 6 * s, 2, wc);
    if (o.stab) pxLine(ex, ey, ex + Math.cos(A) * 14 * s, ey + Math.sin(A) * 10 * s, 1, '#fff4d2');
  };
  const wBehind = Math.sin(A) < -0.25 || dir === 'u';
  // áo choàng phía sau
  const cw = side ? q(6) : q(10), wave = step ? 1 : 0;
  if (dir !== 'u') { ctx.fillStyle = cloak; ctx.fillRect(fx - (side ? (m > 0 ? cw : 0) : cw / 2) + (side ? -m * q(2) + (m > 0 ? cw - q(2) : 0) : 0), fy - legH - torsoH + kneel, side ? q(3) : cw, torsoH + legH - 1 + wave); }
  if (wBehind) drawWeaponPx();
  // chân bước
  if (!o.kneel) {
    const lA = step > 0 ? -1 : 0, lB = step < 0 ? -1 : 0;
    if (side) { R(-q(2) + step * m, -legH + lA, q(2), legH - lA, pxShade(body, -0.45)); R(q(0) - step * m, -legH + lB, q(2), legH - lB, pxShade(body, -0.3)); }
    else { R(-q(3), -legH + lA, q(2), legH - lA, pxShade(body, -0.4)); R(q(1), -legH + lB, q(2), legH - lB, pxShade(body, -0.4)); }
  }
  // thân: sáng bên trái, tối bên phải, thắt lưng màu viền
  const ty = fy - legH - torsoH + kneel;
  ctx.fillStyle = body; ctx.fillRect(fx - (bw >> 1), ty, bw, torsoH);
  ctx.fillStyle = pxShade(body, 0.18); ctx.fillRect(fx - (bw >> 1), ty, 1, torsoH - 1);
  ctx.fillStyle = pxShade(body, -0.28); ctx.fillRect(fx - (bw >> 1) + bw - 1, ty, 1, torsoH);
  ctx.fillStyle = trim; ctx.fillRect(fx - (bw >> 1), ty + torsoH - q(2), bw, 1);
  if (dir === 'u') { ctx.fillStyle = cloak; ctx.fillRect(fx - q(5), ty, q(10), torsoH + legH - 1 + wave); ctx.fillStyle = pxShade(cloak, 0.15); ctx.fillRect(fx - q(5), ty, q(10), 1); }
  // vai và tay
  ctx.fillStyle = trim;
  if (side) ctx.fillRect(fx - q(2), ty, q(4), q(2));
  else { ctx.fillRect(fx - (bw >> 1) - q(1), ty, q(3), q(2)); ctx.fillRect(fx + (bw >> 1) - q(2), ty, q(3), q(2)); }
  // khiên hoặc chất xúc tác ở tay trái
  if (o.shield === 3) { ctx.fillStyle = '#4a4f58'; ctx.fillRect(fx + (side ? m * q(2) - q(2) : dir === 'd' ? q(3) : -q(7)), ty - q(1), q(4), q(9)); }
  else if (o.shield) {
    const up = o.shield === 2, sc = o.kite ? '#5a5f68' : '#6b5638', sw = up ? q(7) : q(4), sh = up ? q(8) : q(5);
    const sxp = up ? (side ? fx + m * q(3) - (sw >> 1) : fx - (sw >> 1)) : side ? fx - m * q(3) - (sw >> 1) : dir === 'd' ? fx + q(3) : fx - q(7);
    if (!(dir === 'u' && !up)) { ctx.fillStyle = sc; ctx.fillRect(sxp, ty + (up ? -1 : 1), sw, sh); ctx.fillStyle = o.kite ? '#c8ccd2' : '#b9b29c'; ctx.fillRect(sxp, ty + (up ? -1 : 1), sw, 1); ctx.fillRect(sxp + (sw >> 1), ty + (up ? 1 : 3), 1, 1); }
  } else if (o.cat) { ctx.fillStyle = o.cat === 'staff' ? '#bfe4ff' : '#d8b45a'; const k = 1 + Math.round((o.castK || 0) * 2); ctx.fillRect(fx + (dir === 'd' ? q(4) : -q(6)), ty - k, k + 1, k + 1); }
  // đầu
  const hy0 = ty - headH + 1;
  ctx.fillStyle = head; ctx.fillRect(fx - (hw >> 1), hy0, hw, headH - 1);
  ctx.fillStyle = pxShade(head, 0.2); ctx.fillRect(fx - (hw >> 1), hy0, hw, 1);
  ctx.fillStyle = pxShade(head, -0.3); ctx.fillRect(fx - (hw >> 1), hy0 + headH - 2, hw, 1);
  if (L.hood) { ctx.fillStyle = pxShade(cloak, -0.1); ctx.fillRect(fx - (hw >> 1) - 1, hy0 - 1, hw + 2, q(2)); if (!side && dir !== 'u') { ctx.fillRect(fx - (hw >> 1) - 1, hy0, 1, headH - 1); ctx.fillRect(fx + (hw >> 1), hy0, 1, headH - 1); } }
  const eyeC = o.eyes || (L.hood ? '#0a0806' : '#1a1410'), eyeY = hy0 + q(3) - 1;
  if (dir === 'd') { ctx.fillStyle = L.hood ? '#0a0806' : pxShade(head, -0.45); ctx.fillRect(fx - q(2), eyeY - 1, q(4) + 1, q(2)); ctx.fillStyle = o.eyes || (L.glow ? (typeof L.glow === 'string' ? L.glow : '#ffd76a') : eyeC); ctx.fillRect(fx - q(2), eyeY, 1, 1); ctx.fillRect(fx + q(2), eyeY, 1, 1); }
  else if (side) { ctx.fillStyle = L.hood ? '#0a0806' : pxShade(head, -0.45); ctx.fillRect(fx + m * q(1) - (m < 0 ? q(1) : 0), eyeY - 1, q(2), q(2)); ctx.fillStyle = o.eyes || (L.glow ? (typeof L.glow === 'string' ? L.glow : '#ffd76a') : eyeC); ctx.fillRect(fx + m * q(2), eyeY, 1, 1); }
  if (!wBehind) drawWeaponPx();
  if (o.flash) { ctx.globalAlpha *= 0.6; ctx.fillStyle = '#fff'; ctx.fillRect(fx - (bw >> 1), hy0, bw, fy - hy0); }
  ctx.restore();
}
function drawHorse(x, y, face, anim) {
  shadow(x, y + 5, 30, 14, 0.3);
  ctx.save(); ctx.translate(x, y); ctx.rotate(face);
  const bob = Math.sin(anim * 2) * 1.5;
  ctx.shadowColor = 'rgba(150,200,255,.6)'; ctx.shadowBlur = 10;
  ctx.fillStyle = '#2d3038'; ctx.beginPath(); ctx.ellipse(0, 0, 30, 12, 0, 0, TAU); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.ellipse(30 + bob, 0, 11, 6.5, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#11141a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(8, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(160,210,255,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.quadraticCurveTo(-42, Math.sin(anim * 3) * 6, -48, 0); ctx.stroke();
  ctx.fillStyle = '#b8a26a'; ctx.beginPath(); ctx.arc(37 + bob, -2.5, 1.3, 0, TAU); ctx.arc(37 + bob, 2.5, 1.3, 0, TAU); ctx.fill();
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
  const o = { anim: p.walk, trail, thrust, stab, charge, flash: p.invuln > 0.25 && !(p.atk && p.atk.critT), shield: th || cat ? 0 : p.state === 'guard' ? 2 : 1, kite: off.id === 'kite', cat: cat ? cat.type : null, castK };
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
    drawHumanoid(p.x, p.y, p.rollDir, LOOK, wAng, Object.assign({}, o, { ball: k }));
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
      anim: f.anim, trail, trailCol: 'rgba(255,220,130,.5)', flash: f.hurtFlash > 0, z: f.z, aura: true,
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
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,236,170,.55)';
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(14, sd * 18); ctx.quadraticCurveTo(-10, sd * (60 + Math.sin(t * 3) * 6), -40, sd * 26); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#fff4d0'; ctx.beginPath(); ctx.ellipse(44, 0, 22, 15, 0, 0, TAU); ctx.fill();
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
  if (d.state === 'atk' && d.atk) {
    const s = d.atk.steps[d.atk.i], t = d.atk.t;
    if (s.k === 'tail' && t < s.wind) { ctx.strokeStyle = `rgba(230,110,50,${0.2 + t / s.wind * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(d.x, d.y, s.r, 0, TAU); ctx.stroke(); }
  }
  const alpha = d.dead ? Math.max(0, 1 - d.t / 3) : 1, z = d.z || 0;
  shadow(d.x, d.y + 8, 78 * (1 - z / 420), 44 * (1 - z / 420), 0.4 * alpha);
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(d.x, d.y - z);
  const sc = (1 + z / 600) * (d.state === 'sleep' ? 1 + Math.sin(d.anim * 1.4) * 0.03 : 1);
  ctx.scale(sc, sc); ctx.rotate(d.face + d.spin);
  const flap = d.flying ? Math.sin(d.anim * 10) : d.state === 'wake' ? Math.sin(d.anim * 6) * 0.6 : Math.sin(d.anim * 1.2) * 0.12;
  const body = '#5b4f46', dark = '#2a231f';
  for (let i = 7; i >= 0; i--) {
    const tx = -34 - i * 13, ty = Math.sin(d.anim * 2 + i * 0.7) * (2 + i * 1.6) + (d.state === 'sleep' ? i * i * 0.9 : 0);
    ctx.fillStyle = i % 2 ? body : '#534840'; ctx.beginPath(); ctx.arc(tx, ty, 15 - i * 1.6, 0, TAU); ctx.fill();
  }
  const sp = d.state === 'sleep' ? 0.55 : 1;
  for (const side of [-1, 1]) {
    ctx.fillStyle = 'rgba(70,58,50,.94)'; ctx.strokeStyle = dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(8, side * 16);
    ctx.lineTo(-6, side * (70 + flap * 30) * sp); ctx.lineTo(-30, side * (96 + flap * 34) * sp); ctx.lineTo(-44, side * (70 + flap * 22) * sp);
    ctx.lineTo(-58, side * (52 + flap * 14) * sp); ctx.lineTo(-30, side * 22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, side * 16); ctx.lineTo(-30, side * (96 + flap * 34) * sp); ctx.moveTo(-6, side * (70 + flap * 30) * sp); ctx.lineTo(-30, side * 22); ctx.stroke();
  }
  ctx.fillStyle = body; ctx.strokeStyle = dark; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(-4, 0, 44, 25, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(140,120,100,.25)'; ctx.beginPath(); ctx.ellipse(-4, 0, 30, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a312b';
  for (let i = 0; i < 6; i++) { const sx = 30 - i * 14; ctx.beginPath(); ctx.moveTo(sx + 5, 0); ctx.lineTo(sx - 5, -5); ctx.lineTo(sx - 5, 5); ctx.closePath(); ctx.fill(); }
  const na = dragonNeck(d), hx = 34 + Math.cos(na) * 38, hy = Math.sin(na) * 38;
  ctx.strokeStyle = body; ctx.lineWidth = 20; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(24, 0); ctx.quadraticCurveTo(40, hy * 0.3, hx, hy); ctx.stroke(); ctx.lineCap = 'butt';
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(na);
  ctx.fillStyle = '#675a50'; ctx.strokeStyle = dark; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(6, 0, 20, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#cfc2a8'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(-18, -16); ctx.moveTo(-2, 8); ctx.lineTo(-18, 16); ctx.stroke();
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
  const windup = e.state === 'atk' && e.atk && e.t < e.atk.wind;
  const c = windup ? -4 : 0, leg = e.moving || z > 0 ? Math.sin(e.anim * 16) * 4 : 0, dark = shade(B.col, 0.7), light = shade(B.col, 1.12);
  ctx.strokeStyle = dark; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(8 + c, -6); ctx.lineTo(10 + c + leg, -10); ctx.moveTo(8 + c, 6); ctx.lineTo(10 + c - leg, 10);
  ctx.moveTo(-8, -6); ctx.lineTo(-10 - leg, -10); ctx.moveTo(-8, 6); ctx.lineTo(-10 + leg, 10); ctx.stroke();
  ctx.strokeStyle = shade(B.col, 0.85); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-25, Math.sin(e.anim * 5) * 4); ctx.stroke();
  ctx.fillStyle = e.dead ? dark : B.col; ctx.strokeStyle = 'rgba(10,8,6,.7)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(c, 0, 16, 8.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(c - 2, 0, 10, 3, 0, 0, TAU); ctx.fill();
  if (B.mane) { ctx.fillStyle = B.mane; ctx.beginPath(); ctx.arc(11 + c * 0.5, 0, 10, 0, TAU); ctx.fill(); }
  ctx.fillStyle = light; ctx.beginPath(); ctx.arc(14 + c * 0.5, 0, 7, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = shade(B.col, 0.9); ctx.beginPath(); ctx.ellipse(20 + c * 0.5, 0, 5, 3.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(10, -4); ctx.lineTo(8, -10); ctx.lineTo(14, -6); ctx.moveTo(10, 4); ctx.lineTo(8, 10); ctx.lineTo(14, 6); ctx.fill();
  if (!e.dead && e.state !== 'idle') { ctx.fillStyle = B.eye || '#ff5a3a'; ctx.beginPath(); ctx.arc(17, -2.6, 1.2, 0, TAU); ctx.arc(17, 2.6, 1.2, 0, TAU); ctx.fill(); }
  if (e.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(0, 0, 17, 9, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawBat(e) {
  const alpha = e.dead ? Math.max(0, 1 - e.t / 1.2) : 1;
  if (alpha <= 0) return;
  shadow(e.x, e.y + 14, 8, 4, 0.25 * alpha);
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(e.x, e.y - 12); ctx.rotate(e.face);
  const f = Math.sin(e.anim * 24);
  ctx.fillStyle = '#3a2a30';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-4, s * (14 + f * 6)); ctx.lineTo(-8, s * (8 + f * 3)); ctx.lineTo(-3, s * 3); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#4a3238'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 4.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.arc(5, -1.5, 1, 0, TAU); ctx.moveTo(6, 1.5); ctx.arc(5, 1.5, 1, 0, TAU); ctx.fill();
  if (e.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 6, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawSpider(e) {
  const alpha = e.dead ? Math.max(0, 1 - e.t / 1.2) : 1;
  if (alpha <= 0) return;
  shadow(e.x, e.y + 4, 18, 10, 0.3 * alpha);
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(e.x, e.y); ctx.rotate(e.face);
  ctx.strokeStyle = '#2a2622'; ctx.lineWidth = 2.2;
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const bx = 4 - i * 4, sw = Math.sin(e.anim * 14 + i * 1.3 + (s > 0 ? 1 : 0)) * (e.moving ? 4 : 1);
    ctx.beginPath(); ctx.moveTo(bx, s * 5); ctx.lineTo(bx + 4 - i * 3 + sw, s * 15); ctx.lineTo(bx + 8 - i * 6 + sw, s * 22); ctx.stroke();
  }
  ctx.fillStyle = '#3a3a2e'; ctx.beginPath(); ctx.ellipse(-11, 0, 12, 10, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8fc04a'; ctx.beginPath(); ctx.ellipse(-12, 0, 5, 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2f2f26'; ctx.beginPath(); ctx.arc(5, 0, 7, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d0ff7a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(10, s * 2.5, 1.2, 0, TAU); ctx.fill(); }
  if (e.hurtFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(-4, 0, 16, 10, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
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
  });
  drawEnemyBar(e);
}
function drawEnemyBar(e) {
  if (e.dead || e.isBoss) return;
  const w = e.elite ? 54 : 34, x = e.x - w / 2, y = e.y - e.r * (e.T.look ? e.T.look.scale : 1) - 22;
  if (e.aff) {
    wText(e.aff.map(k => AFFIXES[k].name).join(' · '), e.x, y - 5, 9, `rgb(${AFFIXES[e.aff[0]].col})`, 1);
  }
  if (e.hp >= e.maxHp) return;
  ctx.fillStyle = 'rgba(8,7,5,.8)'; ctx.fillRect(x - 1, y - 1, w + 2, 6);
  ctx.fillStyle = '#a3201c'; ctx.fillRect(x, y, w * e.hp / e.maxHp, 4);
  if (e.state === 'broken') { ctx.fillStyle = '#f2dc97'; ctx.fillRect(x, y + 5, w, 1.5); }
  if (e.bleed > 0) { ctx.fillStyle = '#e0503c'; ctx.fillRect(x, y + 7, w * Math.min(1, e.bleed / (e.elite ? 110 : 60)), 2); }
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
    anim: b.anim, trail, trailCol: 'rgba(255,214,120,.45)', flash: b.hurtFlash > 0, z: b.z, hammer,
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
    ctx.fillStyle = '#6a655a'; ctx.beginPath(); ctx.arc(b.x, b.y, 13, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2a261e'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#1e1b16'; ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, TAU); ctx.fill();
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
    ctx.strokeStyle = read ? 'rgba(200,190,160,.5)' : `rgba(200,225,255,${0.6 + 0.4 * pulse})`; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(f.x, f.y - 20, 4, 0, TAU); ctx.moveTo(f.x, f.y - 29); ctx.lineTo(f.x, f.y - 8); ctx.moveTo(f.x - 5, f.y - 13); ctx.lineTo(f.x + 5, f.y - 13); ctx.stroke();
  }
  for (const st of STATUES) {
    if (!inView(st.x, st.y, 60)) continue;
    const on = S.statues.includes(st.id);
    shadow(st.x + 2, st.y + 8, 17, 8, 0.35);
    if (on) { const gr = ctx.createRadialGradient(st.x, st.y, 2, st.x, st.y, 55); gr.addColorStop(0, 'rgba(150,250,235,.4)'); gr.addColorStop(1, 'rgba(150,250,235,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(st.x, st.y, 55, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#7b7a72'; ctx.fillRect(st.x - 14, st.y - 4, 28, 12);
    ctx.fillStyle = on ? '#b8d8d2' : '#8d8b82'; ctx.beginPath(); ctx.ellipse(st.x, st.y - 10, 9, 12, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(st.x, st.y - 24, 6, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a3934'; ctx.lineWidth = 1.5; ctx.stroke();
    if (on && Math.random() < 0.2) addPart(st.x + rand(-10, 10), st.y - 20, 0, -30, 0.9, 2, '#bff5ee', 'mote');
  }
  if (!S.coloDone && inView(FLAG.x, FLAG.y, 60)) {
    ctx.strokeStyle = '#3a2f22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(FLAG.x, FLAG.y + 8); ctx.lineTo(FLAG.x, FLAG.y - 40); ctx.stroke();
    ctx.fillStyle = G.colo.active ? '#5a1a16' : '#9e2a22';
    const wv = Math.sin(t * 4) * 3;
    ctx.beginPath(); ctx.moveTo(FLAG.x, FLAG.y - 40); ctx.lineTo(FLAG.x + 26, FLAG.y - 34 + wv); ctx.lineTo(FLAG.x, FLAG.y - 26); ctx.closePath(); ctx.fill();
  }
}
function drawObjects() {
  const t = G.clock;
  for (const l of LEVERS) {
    if (!inView(l.x, l.y, 40)) continue;
    const on = S.levers.includes(l.id);
    shadow(l.x + 2, l.y + 6, 12, 5, 0.35);
    ctx.fillStyle = '#4a4540'; ctx.fillRect(l.x - 10, l.y - 4, 20, 10);
    ctx.strokeStyle = '#8a8070'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x + (on ? 12 : -12), l.y - 22); ctx.stroke();
    ctx.fillStyle = on ? '#8a8070' : '#d8b45a'; ctx.beginPath(); ctx.arc(l.x + (on ? 12 : -12), l.y - 22, 4, 0, TAU); ctx.fill();
  }
  for (const d of DOORS) {
    if (!inView(d.x, d.y, 60)) continue;
    const pulse = 0.6 + Math.sin(t * 2 + d.x) * 0.4;
    if (d.kind === 'enter') {
      shadow(d.x, d.y + 8, 40, 14, 0.4);
      ctx.fillStyle = '#5a554c'; ctx.fillRect(d.x - 34, d.y - 26, 68, 34);
      ctx.fillStyle = '#0e0c0a'; ctx.beginPath(); ctx.moveTo(d.x - 20, d.y + 8); ctx.lineTo(d.x - 20, d.y - 10); ctx.quadraticCurveTo(d.x, d.y - 30, d.x + 20, d.y - 10); ctx.lineTo(d.x + 20, d.y + 8); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8a8474'; ctx.lineWidth = 2; ctx.strokeRect(d.x - 34, d.y - 26, 68, 34);
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
    drawHumanoid(n.x, n.y, Math.atan2(P.y - n.y, P.x - n.x), L, 0.6, { anim: t });
    if (n.id === 'smith') { ctx.fillStyle = '#3a3632'; ctx.fillRect(n.x - 40, n.y + 18, 30, 14); ctx.fillStyle = `rgba(255,140,50,${0.5 + Math.sin(t * 8) * 0.2})`; ctx.fillRect(n.x + 22, n.y + 14, 16, 12); }
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
// giảm bảng màu: dải chuyển của ánh sáng thành các bậc màu rõ ràng như game pixel cổ điển
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(() => 0);
const QLUT = new Uint8Array(512);
for (let i = 0; i < 512; i++) QLUT[i] = Math.max(0, Math.min(255, Math.round((i - 128) / 12) * 12 + 2));
function pixelPost() {
  const w = wcan.width, h = wcan.height, img = wctx.getImageData(0, 0, w, h), d = img.data;
  for (let y = 0; y < h; y++) {
    const row = (y & 3) << 2;
    for (let x = 0, i = y * w * 4; x < w; x++, i += 4) {
      const b = BAYER[row | (x & 3)] + 128;
      d[i] = QLUT[(d[i] + b) | 0]; d[i + 1] = QLUT[(d[i + 1] + b) | 0]; d[i + 2] = QLUT[(d[i + 2] + b) | 0];
    }
  }
  wctx.putImageData(img, 0, 0);
}
// ───────────────────────── sprite pixel art sắc nét ─────────────────────────
// Mỗi nhân vật, quái, đá được vẽ riêng vào một canvas nhỏ đúng độ phân giải pixel, rồi:
// cắt độ trong suốt thành bậc cứng (hết nhòe cạnh), giảm màu, và viền tối 1 điểm ảnh quanh hình như pixel art vẽ tay.
const SPR = document.createElement('canvas'), sctx = SPR.getContext('2d', { willReadFrequently: true });
const OUTLINE = [22, 17, 12];
function crispify(c, n) {
  const img = c.getImageData(0, 0, n, n), d = img.data, A = new Uint8Array(n * n);
  for (let p = 0, i = 0; p < n * n; p++, i += 4) {
    const a = d[i + 3];
    if (a < 56) { d[i + 3] = 0; continue; }
    if (a > 176) { d[i + 3] = 255; A[p] = 1; } else d[i + 3] = 120;
  }
  for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) {
    const p = y * n + x, i = p * 4;
    if (d[i + 3] !== 0 || !(A[p - 1] | A[p + 1] | A[p - n] | A[p + n])) continue;
    d[i] = OUTLINE[0]; d[i + 1] = OUTLINE[1]; d[i + 2] = OUTLINE[2]; d[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
}
function crispLive(cx, cy, R, fn) {
  if (!PIXEL || ctx !== wctx) { fn(); return; }
  const n = Math.ceil(2 * R * WZ) + 4;
  if (SPR.width < n) { SPR.width = n; SPR.height = n; }
  const ox = Math.round((cx - VIEW.x0) * WZ) - (n >> 1), oy = Math.round((cy - VIEW.y0) * WZ) - (n >> 1);
  if (ox > wcan.width || oy > wcan.height || ox + n < 0 || oy + n < 0) return;
  sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalAlpha = 1; sctx.globalCompositeOperation = 'source-over'; sctx.clearRect(0, 0, n, n);
  sctx.setTransform(WZ, 0, 0, WZ, -VIEW.x0 * WZ - ox, -VIEW.y0 * WZ - oy);
  const prev = ctx; ctx = sctx;
  try { fn(); } finally { ctx = prev; }
  crispify(sctx, n);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(SPR, 0, 0, n, n, ox, oy, n, n); ctx.restore();
}
// vật đứng yên (đá): vẽ và làm sắc một lần, lưu lại theo độ phóng
function crispStatic(o, R, fn) {
  if (!PIXEL || ctx !== wctx) { fn(); return; }
  const n = Math.ceil(2 * R * WZ) + 4;
  if (!o._spr || o._sprZ !== WZ) {
    const c = document.createElement('canvas'); c.width = c.height = n;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.setTransform(WZ, 0, 0, WZ, -(o.x - R - 2 / WZ) * WZ, -(o.y - R - 2 / WZ) * WZ);
    const prev = ctx; ctx = g; try { fn(); } finally { ctx = prev; }
    crispify(g, n); o._spr = c; o._sprZ = WZ;
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(o._spr, Math.round((o.x - R - VIEW.x0) * WZ) - 2, Math.round((o.y - R - VIEW.y0) * WZ) - 2); ctx.restore();
}
// ảnh vẽ sẵn (tán cây): làm sắc một lần cho mỗi kích cỡ rồi dùng lại
const CRISP_CACHE = new Map();
function crispBlit(src, wx, wy, wsize) {
  if (!PIXEL || ctx !== wctx) { ctx.drawImage(src, wx, wy, wsize, wsize); return; }
  const n = Math.max(2, Math.round(wsize * WZ));
  let m = CRISP_CACHE.get(src); if (!m) CRISP_CACHE.set(src, m = new Map());
  let c = m.get(n);
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = n + 2;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(src, 1, 1, n, n); crispify(g, n + 2); m.set(n, c);
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(c, Math.round((wx - VIEW.x0) * WZ) - 1, Math.round((wy - VIEW.y0) * WZ) - 1); ctx.restore();
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
  ctx.strokeStyle = 'rgba(15,13,10,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.ellipse(o.x - o.r * 0.25, o.y - o.r * 0.3, o.r * 0.45, o.r * 0.3, -0.4, 0, TAU); ctx.fill();
  if (o.pillar) { ctx.strokeStyle = 'rgba(40,36,28,.5)'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.6, 0, TAU); ctx.stroke(); }
}
const WALL_PAL = { crypt: ['#57524a', '#6e685c'], crystal: ['#4a6078', '#8fb8d8'], fire: ['#5a4238', '#7a5646'], royal: ['#7a6a4a', '#a08a5a'] };
function drawWall(w) {
  if (w.gate || w.void || w.sea) return;
  if (w.illusory && S.illusory.includes(w.illusory)) return;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(w.x + 5, w.y + 9, w.w, w.h);
  if (w.bld) {
    // nhà trong Kinh Thành: mái ngói vàng sẫm
    ctx.fillStyle = '#6a5a3c'; ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#8a7446'; ctx.fillRect(w.x + 4, w.y + 4, w.w - 8, w.h / 2 - 4);
    ctx.fillStyle = '#5e4e32'; ctx.fillRect(w.x + 4, w.y + w.h / 2, w.w - 8, w.h / 2 - 4);
    ctx.strokeStyle = 'rgba(40,30,18,.45)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = w.x + 14; x < w.x + w.w - 4; x += 14) { ctx.moveTo(x, w.y + 4); ctx.lineTo(x, w.y + w.h - 4); }
    ctx.stroke();
    ctx.strokeStyle = '#d8b45a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w.x + 4, w.y + w.h / 2); ctx.lineTo(w.x + w.w - 4, w.y + w.h / 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(12,10,8,.7)'; ctx.lineWidth = 1; ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
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
  ctx.fillStyle = pal[0]; ctx.fillRect(w.x, w.y, w.w, w.h);
  ctx.fillStyle = pal[1]; ctx.fillRect(w.x, w.y, w.w, Math.min(6, w.h * 0.3));
  ctx.strokeStyle = 'rgba(28,24,18,.5)'; ctx.lineWidth = 1;
  ctx.beginPath();
  if (w.w > w.h) { for (let x = w.x + 22; x < w.x + w.w; x += 22) { ctx.moveTo(x, w.y); ctx.lineTo(x, w.y + w.h); } ctx.moveTo(w.x, w.y + w.h / 2); ctx.lineTo(w.x + w.w, w.y + w.h / 2); }
  else { for (let y = w.y + 22; y < w.y + w.h; y += 22) { ctx.moveTo(w.x, y); ctx.lineTo(w.x + w.w, y); } ctx.moveTo(w.x + w.w / 2, w.y); ctx.lineTo(w.x + w.w / 2, w.y + w.h); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(12,10,8,.7)'; ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
}
function drawGates() {
  const t = G.clock;
  if (!S.fortOpen && inView(3600, 1286, 120)) {
    ctx.fillStyle = '#2b2a28'; ctx.fillRect(3540, 1272, 120, 28);
    ctx.strokeStyle = '#5c5a55'; ctx.lineWidth = 3;
    for (let x = 3548; x < 3660; x += 12) { ctx.beginPath(); ctx.moveTo(x, 1272); ctx.lineTo(x, 1300); ctx.stroke(); }
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
      ctx.fillStyle = '#3b362d'; ctx.fillRect(1360, 392, 80, 28);
      ctx.strokeStyle = 'rgba(214,178,94,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(1400, 406, 10, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1400, 392); ctx.lineTo(1400, 420); ctx.stroke();
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
      ctx.strokeStyle = '#f0d27a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 11, 0, TAU); ctx.stroke();
      for (let i = 0; i < 3; i++) { const on = i < S.gr.length; ctx.fillStyle = on ? '#ffe08a' : 'rgba(60,50,30,.9)'; ctx.beginPath(); ctx.arc(cx - 30 + i * 30, w.y - 16, 5, 0, TAU); ctx.fill(); }
    } else if (w.gate === 'acad' && !S.acadOpen) {
      const gr = ctx.createLinearGradient(w.x, 0, w.x + w.w, 0);
      gr.addColorStop(0, 'rgba(150,210,255,.2)'); gr.addColorStop(0.5, `rgba(190,230,255,${0.55 + Math.sin(t * 3) * 0.15})`); gr.addColorStop(1, 'rgba(150,210,255,.2)');
      ctx.fillStyle = gr; ctx.fillRect(w.x, w.y, w.w, w.h);
    } else if (w.gate === 'lever' && !S.levers.includes(w.lever)) {
      ctx.fillStyle = '#26221e'; ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = '#6a6258'; ctx.lineWidth = 3;
      if (w.w >= w.h) for (let x = w.x + 8; x < w.x + w.w; x += 12) { ctx.beginPath(); ctx.moveTo(x, w.y); ctx.lineTo(x, w.y + w.h); ctx.stroke(); }
      else for (let y = w.y + 8; y < w.y + w.h; y += 12) { ctx.beginPath(); ctx.moveTo(w.x, y); ctx.lineTo(w.x + w.w, y); ctx.stroke(); }
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
    } else if (a.kind === 'arc') {
      const k = a.t / a.dur;
      ctx.strokeStyle = `rgba(${a.col},${0.8 * (1 - k)})`; ctx.lineWidth = 14 * (1 - k * 0.5); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r * (0.7 + k * 0.3), a.face - 1.2, a.face + 1.2); ctx.stroke(); ctx.lineCap = 'butt';
    }
  }
}
function drawProjs() {
  for (const q of projs) {
    if (!inView(q.x, q.y, 40)) continue;
    const a = Math.atan2(q.vy, q.vx);
    if (q.kind === 'parrow' || q.kind === 'knife') {
      ctx.strokeStyle = q.kind === 'knife' ? '#e8e2d0' : q.pierce ? '#fff0c0' : '#e0d8c0'; ctx.lineWidth = q.pierce ? 2.6 : 2;
      ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - Math.cos(a) * (q.kind === 'knife' ? 10 : 18), q.y - Math.sin(a) * (q.kind === 'knife' ? 10 : 18)); ctx.stroke();
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
    if (q.kind === 'arrow') {
      const a = Math.atan2(q.vy, q.vx);
      ctx.strokeStyle = '#d8d0b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - Math.cos(a) * 16, q.y - Math.sin(a) * 16); ctx.stroke();
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
      const col = q.kind === 'glint' ? '#d8e8ff' : q.kind === 'fireball' ? '#ffa04a' : '#8fb0ff';
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 0.8, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
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
    crispBlit(spr, o.x - size / 2 + swx, o.y - size / 2 - 10 + swy, size);
  }
  ctx.globalAlpha = 1;
  if (inView(TREE_POS.x, TREE_POS.y, 420)) {
    const d = dist(P.x, P.y, TREE_POS.x, TREE_POS.y);
    ctx.globalAlpha = d < 300 ? 0.55 : 0.95;
    ctx.fillStyle = '#6b4f1f'; ctx.beginPath(); ctx.arc(TREE_POS.x, TREE_POS.y, 58, 0, TAU); ctx.fill();
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
      ctx.fillStyle = 'rgba(12,10,7,.85)'; ctx.shadowColor = `rgb(${h.col})`; ctx.shadowBlur = 12;
      ctx.fillRect(sx - s / 2, by - s, s, s); ctx.shadowBlur = 0;
      ctx.strokeStyle = '#f2dc97'; ctx.lineWidth = 1.5; ctx.strokeRect(sx - s / 2 + 0.5, by - s + 0.5, s - 1, s - 1);
      textC(k, sx, by - 6, `700 13px ${FONT_U}`, '#f2dc97', 0);
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
  for (const c of [mainCtx, wctx]) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.shadowBlur = 0; }
  ctx = PIXEL ? wctx : mainCtx; WTEXT.length = 0;
  ctx.fillStyle = '#0b0a07'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const sh = G.shake > 0.1 ? G.shake : 0, sx = (Math.random() * 2 - 1) * sh, sy = (Math.random() * 2 - 1) * sh;
  const vw = CW / ZOOM, vh = CH / ZOOM, x0 = cam.x - vw / 2 + sx, y0 = cam.y - vh / 2 + sy;
  VIEW = { x0, y0, x1: x0 + vw, y1: y0 + vh };
  ctx.setTransform(WZ, 0, 0, WZ, -x0 * WZ, -y0 * WZ);
  const inst = cam.x > 4800 && G.mode !== 'title';
  const [GC, ox, oy, ow, oh] = inst ? [GROUND2, IX0, 0, W - IX0, IH] : [GROUND, WX0, WY0, MAPW - WX0, H - WY0];
  const gx0 = clamp(Math.floor(x0), ox, ox + ow), gy0 = clamp(Math.floor(y0), oy, oy + oh), gx1 = clamp(Math.ceil(x0 + vw), ox, ox + ow), gy1 = clamp(Math.ceil(y0 + vh), oy, oy + oh);
  ctx.imageSmoothingEnabled = !PIXEL;
  if (gx1 > gx0 && gy1 > gy0) ctx.drawImage(GC, (gx0 - ox) / 2, (gy0 - oy) / 2, (gx1 - gx0) / 2, (gy1 - gy0) / 2, gx0, gy0, gx1 - gx0, gy1 - gy0);
  ctx.imageSmoothingEnabled = true;
  drawDecals();
  drawWater();
  drawGrass();
  for (const o of OBST) if (o.kind === 'rock' && inView(o.x, o.y, 40)) crispStatic(o, o.r * 1.4 + 8, () => drawRock(o));
  for (const c of CHESTS) if ((!c.req || c.req()) && inView(c.x, c.y, 40)) drawChest(c);
  drawPuzzles();
  for (const o of OBST) if (o.kind === 'tree' && inView(o.x, o.y, 30)) { shadow(o.x, o.y + 3, o.r, o.r * 0.6, 0.35); ctx.fillStyle = '#3b2d1c'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.7, 0, TAU); ctx.fill(); }
  for (const w of WALLS) if (inView(w.x + w.w / 2, w.y + w.h / 2, Math.max(w.w, w.h))) drawWall(w);
  drawGates(); drawGates2(); drawObjects();
  const list = enemies.filter(e => inView(e.x, e.y, 80));
  if (boss) list.push(boss);
  if (dragon && (dragon.z || 0) <= 40) list.push(dragon);
  if (fb && (fb.z || 0) <= 40) list.push(fb);
  if (G.mode !== 'title') list.push(P);
  list.sort((a, b) => a.y - b.y);
  for (const e of list) {
    if (e === P) crispLive(P.x, P.y, 78, drawPlayer);
    else if (e.isBoss) crispLive(e.x, e.y, 210, drawBoss);
    else if (e.isDragon) crispLive(e.x, e.y, 300, drawDragon);
    else if (e.isFinal) crispLive(e.x, e.y, 250, drawFinal);
    else if (inView(e.x, e.y, 80)) crispLive(e.x, e.y, Math.min(170, 44 + e.r * 1.6 * ((e.T.look && e.T.look.scale) || (e.T.beast && e.T.beast.scale) || 1) + (e.atk && e.atk.range ? e.atk.range : 0)), () => drawEnemy(e));
  }
  if (P.lock && !P.lock.dead) {
    const l = P.lock, y = l.y - (l.z || 0);
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(l.x, y, 3.5, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(l.x, y, 9, 0, TAU); ctx.stroke();
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
  if (PIXEL) {
    // phóng to thế giới pixel art lên màn hình, giữ nguyên cạnh sắc của từng điểm ảnh
    if (!FX_LOW) pixelPost();
    ctx = mainCtx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = false; ctx.drawImage(wcan, 0, 0, wcan.width * PIXK, wcan.height * PIXK); ctx.imageSmoothingEnabled = true;
  }
  flushWText(x0, y0);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const [, , , , tr, tg, tb, ta] = G.amb;
  if (ta > 0.01 && !FX_LOW) { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(${tr | 0},${tg | 0},${tb | 0},${ta})`; ctx.fillRect(0, 0, CW, CH); ctx.globalCompositeOperation = 'source-over'; }
  drawGodRays();
  const top = ctx.createLinearGradient(0, 0, 0, CH * 0.5);
  top.addColorStop(0, `rgba(255,205,110,${cam.y < 400 && !inst ? 0.14 : 0.06})`); top.addColorStop(1, 'rgba(255,205,110,0)');
  ctx.fillStyle = top; ctx.fillRect(0, 0, CW, CH * 0.5);
  ctx.fillStyle = VIGNETTE; ctx.fillRect(0, 0, CW, CH);
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
    for (let k = 0; k < 3; k++) {
      const bx = c.x + k * 3 - 3;
      ctx.strokeStyle = c.pal[k];
      ctx.beginPath(); ctx.moveTo(bx, c.y); ctx.quadraticCurveTo(bx + sway * 0.4, c.y - 5, bx + sway + bend, c.y - 9 - k * 2 - c.h * 3); ctx.stroke();
    }
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
    for (const e of [P, ...enemies]) if (!e.dead && inView(e.x, e.y, 30) && inWater(e.x, e.y) && !(e.T && e.T.flier)) { ctx.strokeStyle = `rgba(210,240,255,${0.35 + 0.15 * Math.sin(t * 5)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(e.x, e.y + 6, e.r + 6, (e.r + 6) * 0.45, 0, 0, TAU); ctx.stroke(); }
  }
  if (VIEW.x0 < -2400 && VIEW.y1 > 2600) {
    ctx.strokeStyle = `rgba(235,245,250,${0.35 + 0.2 * Math.sin(t * 1.3)})`; ctx.lineWidth = 3;
    const fx = -2480 + Math.sin(t * 0.9) * 14;
    ctx.beginPath(); for (let y = Math.max(2600, VIEW.y0); y < Math.min(H, VIEW.y1); y += 20) { const x = fx + Math.sin(y * 0.03 + t) * 8; y === Math.max(2600, VIEW.y0) ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
  }
}
