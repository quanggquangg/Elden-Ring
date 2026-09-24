'use strict';
// Vòng Vàng Vỡ — Vẽ thế giới, ánh sáng và thời tiết
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
    if (L.glow) { ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 12; }
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
  if (o.shield === 3) {
    ctx.fillStyle = '#4a4f58'; ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.6 * s;
    ctx.fillRect(9 * s, -12 * s, 5 * s, 22 * s); ctx.strokeRect(9 * s, -12 * s, 5 * s, 22 * s);
    ctx.strokeStyle = 'rgba(10,8,6,.75)'; ctx.lineWidth = 1.4;
  } else if (o.shield) {
    const up = o.shield === 2;
    ctx.fillStyle = '#6b5638'; ctx.strokeStyle = '#b9b29c'; ctx.lineWidth = 1.6 * s;
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
  let wAng = 0.6, trail = null, thrust = 0, stab = false, spinRot = 0, fx = null;
  if (p.state === 'attack' && p.atk) {
    const A = p.atk, t = p.t, sw_ = A.swing || 1, anim = A.anim || (A.thrust ? 'thrust' : 'slash');
    const ph = t < A.wind ? 0 : t < A.wind + A.act ? 1 : 2;
    const k = ph === 0 ? t / A.wind : ph === 1 ? (t - A.wind) / A.act : (t - A.wind - A.act) / A.rec;
    if (anim === 'thrust' || (anim === 'dash' && A.thrust)) {
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
  else if (p.state === 'cast') wAng = -0.2;
  else if (p.state === 'guard') wAng = 1.1;
  const th = twoHanded();
  if (th && p.state === 'guard') wAng = -1.1;
  const o = { anim: p.walk, trail, thrust, stab, flash: p.invuln > 0.25, shield: th ? 0 : p.state === 'guard' ? 2 : 1 };
  if (p.state === 'attack' && p.atk && p.atk.kind === 'heavy') o.trailCol = 'rgba(255,220,150,.45)';
  if (p.state === 'roll') {
    const k = p.t / ROLL_DUR;
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
  if (p.state === 'cast' && p.t < 0.25) { ctx.fillStyle = 'rgba(170,200,255,.5)'; ctx.beginPath(); ctx.arc(p.x + Math.cos(p.face) * 20, p.y + Math.sin(p.face) * 20, 6 + p.t * 20, 0, TAU); ctx.fill(); }
}
function drawFinal() {
  const f = fb;
  if (!f || !inView(f.x, f.y, 420)) return;
  if (f.dead && f.t > 3) return;
  const alpha = f.dead ? Math.max(0, 1 - f.t / 3) : 1;
  if (f.state === 'atk' && f.atk) {
    const s = f.atk.steps[f.atk.i], t = f.atk.t;
    if (s && s.k === 'swing' && t < s.wind && t > s.wind * 0.4) drawTelegraph(f.x, f.y, f.face, s.range, s.arc, (t - s.wind * 0.4) / (s.wind * 0.6), '240,200,90');
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
    if (s.k === 'melee' && t < s.wind && t > s.wind * 0.4) drawTelegraph(d.x, d.y, d.face, s.range, s.arc, (t - s.wind * 0.4) / (s.wind * 0.6), '230,110,50');
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
function drawWolf(e) {
  const alpha = e.dead ? Math.max(0, 1 - e.t / 1.2) : 1;
  if (alpha <= 0) return;
  shadow(e.x, e.y + 4, 18, 8, 0.3 * alpha);
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(e.x, e.y); ctx.rotate(e.face);
  const windup = e.state === 'atk' && e.atk && e.t < e.atk.wind;
  const c = windup ? -4 : 0, leg = e.moving ? Math.sin(e.anim * 16) * 4 : 0;
  ctx.strokeStyle = '#4d4b45'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(8 + c, -6); ctx.lineTo(10 + c + leg, -10); ctx.moveTo(8 + c, 6); ctx.lineTo(10 + c - leg, 10);
  ctx.moveTo(-8, -6); ctx.lineTo(-10 - leg, -10); ctx.moveTo(-8, 6); ctx.lineTo(-10 + leg, 10); ctx.stroke();
  ctx.strokeStyle = '#5b5953'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-25, Math.sin(e.anim * 5) * 4); ctx.stroke();
  ctx.fillStyle = e.dead ? '#4d4b45' : '#6d6b64'; ctx.strokeStyle = 'rgba(10,8,6,.7)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(c, 0, 16, 8.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4f4d47'; ctx.beginPath(); ctx.ellipse(c - 2, 0, 10, 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#77756d'; ctx.beginPath(); ctx.arc(14 + c * 0.5, 0, 7, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5c5a54'; ctx.beginPath(); ctx.ellipse(20 + c * 0.5, 0, 5, 3.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#77756d'; ctx.beginPath(); ctx.moveTo(10, -4); ctx.lineTo(8, -10); ctx.lineTo(14, -6); ctx.moveTo(10, 4); ctx.lineTo(8, 10); ctx.lineTo(14, 6); ctx.fill();
  if (!e.dead && e.state !== 'idle') { ctx.fillStyle = '#ff5a3a'; ctx.beginPath(); ctx.arc(17, -2.6, 1.2, 0, TAU); ctx.arc(17, 2.6, 1.2, 0, TAU); ctx.fill(); }
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
  if (!e.dead && e.state === 'atk' && e.atk && e.atk.slam === undefined && e.atk.kind === 'slam' && e.t < e.atk.wind) { const A = e.atk, hx = e.x + Math.cos(e.face) * A.off, hy = e.y + Math.sin(e.face) * A.off; ctx.strokeStyle = `rgba(230,120,60,${0.2 + e.t / A.wind * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, A.r, 0, TAU); ctx.stroke(); }
  if (!e.dead && e.state === 'atk' && e.atk && (!e.atk.kind || e.atk.kind === 'melee') && e.t < e.atk.wind && e.t > e.atk.wind * 0.45) drawTelegraph(e.x, e.y, e.face, e.atk.range, e.atk.arc, (e.t - e.atk.wind * 0.45) / (e.atk.wind * 0.55));
  if (e.type === 'wolf') { drawWolf(e); drawEnemyBar(e); return; }
  if (e.T.flier) { drawBat(e); drawEnemyBar(e); return; }
  if (e.type === 'spider') { drawSpider(e); drawEnemyBar(e); return; }
  const L = e.T.look;
  let wAng = 0.6, trail = null, charge = 0, thrust = 0;
  if (e.state === 'atk' && e.atk) {
    const A = e.atk, t = e.t, k = A.kind || 'melee';
    if (k === 'shot' || k === 'lob' || k === 'orbs' || k === 'summon') { charge = t < A.wind ? t / A.wind : 0; wAng = L.weapon === 'bow' ? -0.3 : -0.2; }
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
  drawHumanoid(e.x + jitter, e.y, e.face, L, wAng, {
    anim: e.anim, trail, thrust, trailCol: e.T.ghost ? 'rgba(200,240,255,.4)' : 'rgba(255,200,170,.3)', flash: e.hurtFlash > 0, charge, kneel: e.state === 'broken' || e.dead,
    alpha, eyes: e.elite && !e.dead ? (e.T.ghost ? '#bff5ff' : '#ff7a4a') : null, shield: e.T.shield ? (e.state === 'atk' ? 1 : 3) : 0,
  });
  drawEnemyBar(e);
}
function drawEnemyBar(e) {
  if (e.dead || e.hp >= e.maxHp || e.isBoss) return;
  const w = e.elite ? 54 : 34, x = e.x - w / 2, y = e.y - e.r * (e.T.look ? e.T.look.scale : 1) - 22;
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
    if (s && s.k === 'swing' && t < s.wind && t > s.wind * 0.4) drawTelegraph(b.x, b.y, b.face, s.range, s.arc, (t - s.wind * 0.4) / (s.wind * 0.6), '230,170,60');
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
  ctx.fillStyle = o.pillar ? '#8a8474' : o.cliff ? '#4a4539' : '#6f6b61';
  ctx.beginPath();
  const n = 8;
  for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = o.r * (0.82 + r() * 0.3); const x = o.x + Math.cos(a) * rr, y = o.y + Math.sin(a) * rr * 0.9; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(15,13,10,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.ellipse(o.x - o.r * 0.25, o.y - o.r * 0.3, o.r * 0.45, o.r * 0.3, -0.4, 0, TAU); ctx.fill();
  if (o.pillar) { ctx.strokeStyle = 'rgba(40,36,28,.5)'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.6, 0, TAU); ctx.stroke(); }
}
function drawWall(w) {
  if (w.gate || w.void) return;
  if (w.illusory && S.illusory.includes(w.illusory)) return;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(w.x + 5, w.y + 9, w.w, w.h);
  ctx.fillStyle = w.cliff ? '#3d382e' : '#6f6a5b'; ctx.fillRect(w.x, w.y, w.w, w.h);
  ctx.fillStyle = w.cliff ? '#4c463a' : '#8c8672'; ctx.fillRect(w.x, w.y, w.w, Math.min(6, w.h * 0.3));
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
      const k = a.t / a.delay;
      ctx.strokeStyle = `rgba(255,214,110,${0.35 + k * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.stroke();
      ctx.fillStyle = `rgba(255,214,110,${0.1 + k * 0.2})`; ctx.beginPath(); ctx.arc(a.x, a.y, a.r * k, 0, TAU); ctx.fill();
    }
  }
}
function drawAoeFx() {
  for (const a of aoes) {
    if (a.kind === 'flash') {
      const k = a.t / a.dur;
      ctx.fillStyle = a.col === 'fire' ? `rgba(255,140,60,${0.55 * (1 - k)})` : a.col === 'dust' ? `rgba(210,190,150,${0.45 * (1 - k)})` : `rgba(255,226,150,${0.5 * (1 - k)})`; ctx.beginPath(); ctx.arc(a.x, a.y, a.r * (0.7 + k * 0.4), 0, TAU); ctx.fill();
    } else if (a.kind === 'ring') {
      const cur = lerp(a.r0, a.r1, a.t / a.dur);
      ctx.strokeStyle = `rgba(255,222,140,${0.8 * (1 - a.t / a.dur)})`; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(a.x, a.y, cur, 0, TAU); ctx.stroke();
    }
  }
}
function drawProjs() {
  for (const q of projs) {
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
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.font = `600 ${p.size}px ${FONT_U}`; ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
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
    const spr = (o.spirit ? CANOPY.spirit : o.dead ? CANOPY.dead : o.golden ? CANOPY.gold : CANOPY.green)[o.spr];
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
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0b0a07'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const sh = G.shake > 0.1 ? G.shake : 0, sx = (Math.random() * 2 - 1) * sh, sy = (Math.random() * 2 - 1) * sh;
  const vw = CW / ZOOM, vh = CH / ZOOM, x0 = cam.x - vw / 2 + sx, y0 = cam.y - vh / 2 + sy;
  VIEW = { x0, y0, x1: x0 + vw, y1: y0 + vh };
  ctx.setTransform(DPR * ZOOM, 0, 0, DPR * ZOOM, -x0 * DPR * ZOOM, -y0 * DPR * ZOOM);
  const gx0 = clamp(Math.floor(x0), 0, W), gy0 = clamp(Math.floor(y0), 0, H), gx1 = clamp(Math.ceil(x0 + vw), 0, W), gy1 = clamp(Math.ceil(y0 + vh), 0, H);
  if (gx1 > gx0 && gy1 > gy0) ctx.drawImage(GROUND, gx0 / 2, gy0 / 2, (gx1 - gx0) / 2, (gy1 - gy0) / 2, gx0, gy0, gx1 - gx0, gy1 - gy0);
  drawDecals();
  drawWater();
  drawGrass();
  for (const o of OBST) if (o.kind === 'rock' && inView(o.x, o.y, 40)) drawRock(o);
  for (const c of CHESTS) if ((!c.req || c.req()) && inView(c.x, c.y, 40)) drawChest(c);
  drawPuzzles();
  for (const o of OBST) if (o.kind === 'tree' && inView(o.x, o.y, 30)) { shadow(o.x, o.y + 3, o.r, o.r * 0.6, 0.35); ctx.fillStyle = '#3b2d1c'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.7, 0, TAU); ctx.fill(); }
  for (const w of WALLS) if (inView(w.x + w.w / 2, w.y + w.h / 2, Math.max(w.w, w.h))) drawWall(w);
  drawGates();
  const list = enemies.filter(e => inView(e.x, e.y, 80));
  if (boss) list.push(boss);
  if (dragon && (dragon.z || 0) <= 40) list.push(dragon);
  if (fb && (fb.z || 0) <= 40) list.push(fb);
  if (G.mode !== 'title') list.push(P);
  list.sort((a, b) => a.y - b.y);
  for (const e of list) { if (e === P) drawPlayer(); else if (e.isBoss) drawBoss(); else if (e.isDragon) drawDragon(); else if (e.isFinal) drawFinal(); else drawEnemy(e); }
  if (P.lock && !P.lock.dead) {
    const l = P.lock, y = l.y - (l.z || 0);
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(l.x, y, 3.5, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(l.x, y, 9, 0, TAU); ctx.stroke();
  }
  drawProjs(); drawAoeFx(); drawParts(); drawCanopies(); drawBarrier();
  if (dragon && (dragon.z || 0) > 40) drawDragon();
  if (fb && (fb.z || 0) > 40) drawFinal();
  drawGraceBeams();
  if (P.x > MAPW && VIEW.x0 < MAPW + 90) {
    // Cõi Vàng tách biệt: che thế giới chính phía sau vực tối
    ctx.fillStyle = '#07060b'; ctx.fillRect(VIEW.x0 - 20, VIEW.y0 - 20, MAPW + 90 - VIEW.x0 + 20, VIEW.y1 - VIEW.y0 + 40);
    const gr = ctx.createLinearGradient(MAPW + 90, 0, MAPW + 240, 0);
    gr.addColorStop(0, '#07060b'); gr.addColorStop(1, 'rgba(7,6,11,0)');
    ctx.fillStyle = gr; ctx.fillRect(MAPW + 90, VIEW.y0 - 20, 150, VIEW.y1 - VIEW.y0 + 40);
  }
  collectLights();
  renderLighting(x0, y0);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const [, , , , tr, tg, tb, ta] = G.amb;
  if (ta > 0.01 && !FX_LOW) { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(${tr | 0},${tg | 0},${tb | 0},${ta})`; ctx.fillRect(0, 0, CW, CH); ctx.globalCompositeOperation = 'source-over'; }
  drawGodRays();
  const top = ctx.createLinearGradient(0, 0, 0, CH * 0.5);
  top.addColorStop(0, `rgba(255,205,110,${cam.y < 900 ? 0.14 : 0.06})`); top.addColorStop(1, 'rgba(255,205,110,0)');
  ctx.fillStyle = top; ctx.fillRect(0, 0, CW, CH * 0.5);
  ctx.fillStyle = VIGNETTE; ctx.fillRect(0, 0, CW, CH);
  if (G.flash > 0) { ctx.fillStyle = `rgba(150,10,10,${G.flash * 0.35})`; ctx.fillRect(0, 0, CW, CH); }
  if (G.mode !== 'title') drawHUD();
  if (G.mode === 'map') drawMap();
  if (G.white > 0) { ctx.fillStyle = `rgba(255,246,220,${G.white})`; ctx.fillRect(0, 0, CW, CH); }
  if (G.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${G.fade})`; ctx.fillRect(0, 0, CW, CH); }
}

// ───────────────────────── ánh sáng, không khí và thời tiết ─────────────────────────
// [độ tối, màu tối r,g,b, màu tông r,g,b, độ tông] cho từng vùng
const AMB = {
  'Nhà Nguyện Khởi Đầu': [0.22, 14, 12, 20, 255, 210, 150, 0.08],
  'Đồng Cỏ Sương Mờ': [0.14, 12, 16, 28, 255, 225, 170, 0.07],
  'Tàn Tích Phía Tây': [0.3, 14, 12, 22, 200, 180, 150, 0.08],
  'Đấu Trường Cổng Varek': [0.3, 16, 12, 10, 255, 200, 120, 0.1],
  'Đầm Lầy Tro Độc': [0.42, 24, 10, 32, 150, 80, 170, 0.2],
  'Cao Nguyên Tro Đông': [0.3, 22, 16, 12, 210, 150, 90, 0.14],
  'Pháo Đài Đá Xám': [0.4, 10, 12, 24, 110, 130, 190, 0.14],
  'Rừng Linh Hồn': [0.55, 4, 20, 28, 80, 200, 190, 0.2],
  'Đấu Trường Thử Thách': [0.24, 20, 14, 10, 230, 170, 110, 0.12],
  'Gốc Cây Vàng': [0.02, 30, 20, 8, 255, 210, 110, 0.08],
  'Cõi Vàng': [0.5, 10, 6, 2, 255, 200, 110, 0.16],
};
const AMB_DEFAULT = AMB['Đồng Cỏ Sương Mờ'];
G.amb = AMB_DEFAULT.slice();
function updateAmbient(dt) {
  const tgt = AMB[G.region] || AMB_DEFAULT, k = 1 - Math.exp(-1.4 * dt);
  for (let i = 0; i < 8; i++) G.amb[i] += (tgt[i] - G.amb[i]) * k;
}
const LIGHTS = [];
function light(x, y, r, i, c) { if (r > 0 && LIGHTS.length < 110 && inView(x, y, r)) LIGHTS.push({ x, y, r, i, c }); }
const PCOL = { glint: '170,200,255', orb: '140,170,255', porb: '190,170,255', horb: '255,225,140', fireball: '255,140,60', gwave: '255,220,130', spit: '160,220,90', dagger: '255,210,110' };
function collectLights() {
  LIGHTS.length = 0;
  const t = G.clock;
  if (G.mode !== 'title' && P.state !== 'dead') light(P.x, P.y, 170, 0.75, null);
  for (const g of GRACES) light(g.x, g.y - 10, S.discovered.includes(g.id) ? 280 : 170, 0.95 + Math.sin(t * 2.4 + g.id) * 0.05, '255,214,120');
  light(TREE_POS.x, TREE_POS.y, 820, 1, null); // cây đã tự phát sáng, chỉ cần xua bóng tối
  if (P.x > MAPW) light(RC.x, RC.y, 460, 0.45, '255,210,110');
  for (const b of BRAZIERS) if (S.fortOpen || G.braziers.includes(b.id)) light(b.x, b.y, 200 + Math.sin(t * 13 + b.x) * 12, 1, '255,150,60');
  for (const q of projs) if (PCOL[q.kind]) light(q.x, q.y, q.kind === 'fireball' ? 130 : q.kind === 'gwave' ? 110 : q.kind === 'dagger' ? 50 : 80, 0.9, PCOL[q.kind]);
  for (const a of aoes) {
    if (a.kind === 'flash') light(a.x, a.y, a.r * 1.8, 1 - a.t / a.dur, a.col === 'fire' ? '255,140,60' : a.col === 'dust' ? null : '255,220,140');
    else if (a.kind === 'delayed') light(a.x, a.y, a.r * 1.5, 0.3 + 0.5 * a.t / a.delay, '255,214,110');
    else if (a.kind === 'ring') light(a.x, a.y, lerp(a.r0, a.r1, a.t / a.dur) + 40, 0.45 * (1 - a.t / a.dur), '255,222,140');
    else if (a.kind === 'mark') light(a.x, a.y, a.r * 1.3, 0.25 + 0.3 * a.t / a.dur, '255,110,60');
  }
  let n = 0;
  for (const p of parts) {
    if (p.kind === 'fire' && (n++ % 5 === 0)) light(p.x, p.y, 70, 0.5 * p.life / p.max, '255,140,50');
    else if (p.kind === 'firefly') light(p.x, p.y, 34, 0.5 * (0.45 + 0.55 * Math.sin(t * 5 + p.seed)), p.color === '#9ff5e6' ? '140,255,230' : '210,240,120');
  }
  if (S.lost) light(S.lost.x, S.lost.y, 110, 0.9, '150,255,180');
  for (const it of ITEMS) if (!S.taken.includes(it.id)) light(it.x, it.y, 70, 0.7, '255,240,200');
  for (const c of CHESTS) if (!S.chests.includes(c.id) && (!c.req || c.req())) light(c.x, c.y, 80, 0.6, '255,210,120');
  for (const nt of NOTES) light(nt.x, nt.y, 50, 0.45, '255,150,60');
  for (const st of STATUES) if (S.statues.includes(st.id)) light(st.x, st.y, 160, 0.9, '150,250,235');
  for (const f of MAP_FRAGS) if (!S.frags.includes(f.id)) light(f.x, f.y - 16, 110, 0.7, '190,215,255');
  if (!S.glade) light(BARRIER.x, BARRIER.y, 240, 0.7, '150,240,230');
  for (const [px, py, rx, ry] of POOLS) light(px, py, Math.max(rx, ry) * 1.2, 0.3, '170,110,200');
  for (const q of puddles) light(q.x, q.y, 70, 0.35 * Math.min(1, (q.life - q.t) / 1.2), '150,220,90');
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.T.ghost) light(e.x, e.y, e.T.miniboss ? 170 : 90, 0.6, '170,220,255');
    if (e.state === 'atk' && e.atk && e.T.look && e.T.look.orb && e.t < e.atk.wind) light(e.x, e.y, 90, e.t / e.atk.wind, e.type === 'bomber' ? '255,140,60' : '140,170,255');
    if (e.T.miniboss && !e.T.ghost) light(e.x, e.y, 120, 0.4, '150,170,230');
  }
  if (boss && !boss.dead && boss.state !== 'dormant') light(boss.x, boss.y - boss.z, boss.phase === 2 ? 230 : 120, 0.7, '255,210,110');
  if (dragon && !dragon.dead) {
    if (dragon.breathing || dragon.charge > 0) { const h = dragonHead(dragon); light(h.x, h.y, 210, 1, '255,150,60'); }
    else light(dragon.x, dragon.y, 90, 0.25, '255,150,80');
  }
  if (fb && !fb.dead) {
    light(fb.x, fb.y - fb.z, fb.phase === 2 ? 340 : 210, 1, '255,220,130');
    if (fb.beaming) { const h = finalHead(fb); for (let i = 1; i <= 6; i++) light(h.x + Math.cos(fb.beamDir) * i * 75, h.y + Math.sin(fb.beamDir) * i * 75, 150, 0.9, '255,235,170'); }
  }
  if (P.state === 'cast' && P.t < 0.3) light(P.x + Math.cos(P.face) * 20, P.y + Math.sin(P.face) * 20, 120, 0.8, '170,200,255');
  if (P.state === 'drink') light(P.x, P.y, 120, 0.6, '255,90,70');
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
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(lightCanvas, 0, 0, canvas.width, canvas.height);
  }
  // hào quang: cộng sáng quanh các nguồn sáng có màu
  ctx.setTransform(DPR * ZOOM, 0, 0, DPR * ZOOM, -x0 * DPR * ZOOM, -y0 * DPR * ZOOM);
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
  const near = clamp((1100 - cam.y) / 700, 0, 1) * (P.x > MAPW ? 0 : 1);
  if (near <= 0 || FX_LOW) return;
  const t = G.clock;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const x = CW * (0.1 + i * 0.2) + Math.sin(t * 0.2 + i * 1.7) * 40 - (cam.x - TREE_POS.x) * 0.15, w = 50 + i % 2 * 40;
    const gr = ctx.createLinearGradient(0, 0, 0, CH);
    gr.addColorStop(0, `rgba(255,220,140,${0.055 * near * (0.7 + 0.3 * Math.sin(t * 0.7 + i))})`); gr.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x + w, -10); ctx.lineTo(x + w + CH * 0.35, CH); ctx.lineTo(x + CH * 0.35, CH); ctx.closePath(); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}
// thời tiết và sinh vật nhỏ theo vùng
function weather(dt, x0, y0, vw, vh) {
  const reg = G.mode === 'title' ? 'Đồng Cỏ Sương Mờ' : G.region;
  let fog = 0, ff = 0;
  for (const p of parts) { if (p.kind === 'fog') fog++; else if (p.kind === 'firefly') ff++; }
  const fogCol = reg === 'Đầm Lầy Tro Độc' ? '190,150,210' : reg === 'Rừng Linh Hồn' ? '160,230,220' : reg === 'Cao Nguyên Tro Đông' ? '200,185,170' : '225,230,235';
  const foggy = ['Đồng Cỏ Sương Mờ', 'Nhà Nguyện Khởi Đầu', 'Đầm Lầy Tro Độc', 'Rừng Linh Hồn', 'Tàn Tích Phía Tây'].includes(reg);
  if (!FX_LOW && foggy && fog < 12 && Math.random() < dt * 1.3)
    addPart(x0 - 150 + Math.random() * (vw + 150), y0 + Math.random() * vh, rand(6, 16), rand(-3, 3), rand(10, 16), rand(120, 240), fogCol, 'fog', { alpha: reg === 'Đồng Cỏ Sương Mờ' || reg === 'Nhà Nguyện Khởi Đầu' ? rand(0.05, 0.08) : rand(0.07, 0.11) });
  if (['Cao Nguyên Tro Đông', 'Pháo Đài Đá Xám', 'Đấu Trường Thử Thách', 'Đấu Trường Cổng Varek'].includes(reg) && Math.random() < dt * (FX_LOW ? 8 : 22))
    addPart(x0 + Math.random() * vw, y0 - 10, rand(5, 20), rand(18, 36), 7, rand(1, 2), Math.random() < 0.8 ? '#b8b0a4' : '#e09060', 'ash');
  if ((reg === 'Rừng Linh Hồn' || reg === 'Đầm Lầy Tro Độc') && ff < 40 && Math.random() < dt * (reg === 'Rừng Linh Hồn' ? 10 : 4))
    addPart(x0 + Math.random() * vw, y0 + Math.random() * vh, rand(-10, 10), rand(-10, 10), rand(4, 7), rand(1.4, 2.2), reg === 'Rừng Linh Hồn' ? '#9ff5e6' : '#d4f07a', 'firefly', { seed: rand(0, 10) });
  if ((reg === 'Gốc Cây Vàng' || reg === 'Cõi Vàng') && Math.random() < dt * 7)
    addPart(x0 + Math.random() * vw, y0 - 10, 0, rand(22, 38), rand(8, 12), 3, Math.random() < 0.5 ? '#f0cf72' : '#ffe39a', 'leaf', { seed: rand(0, 10) });
}
// cỏ lay theo gió, rẽ sang khi nhân vật đi qua
const grassCache = new Map();
const GRASS_PAL = {
  meadow: ['#6f7d40', '#58652f', '#8a9448'], gold: ['#d8b862', '#c9a34a', '#f0d27a'], swamp: ['#4a4838', '#5a5040', '#3d3a2e'],
  forest: ['#3f7a72', '#2f5f5a', '#5aa096'], east: ['#6a6448', '#57533c', '#7d7654'],
};
function grassAt(x, y) {
  if (x > MAPW - 20 || y > H - 20) return null;
  if (y < 380) return GRASS_PAL.gold;
  if (y < 440 || inArena(x, y) || inRect(x, y, FORT, 20) || inRect(x, y, COLO.rect, 20) || (x > 370 && x < 1030 && y > 1600 && y < 2210) || (x > 1220 && x < 1580 && y > 3170)) return null;
  if (nearRoad(x, y) < 44 || inPool(x, y) || dist(x, y, LAIR.x, LAIR.y) < 260) return null;
  if (inRect(x, y, FOREST)) return GRASS_PAL.forest;
  if (x > SWAMP.x && x < 2800 && y > SWAMP.y && y < SWAMP.y + SWAMP.h) return GRASS_PAL.swamp;
  if (x > 2800) return GRASS_PAL.east;
  return GRASS_PAL.meadow;
}
function drawGrass() {
  if (FX_LOW) return;
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
// mặt ao độc lấp lánh
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
}
