'use strict';
// Gravebound — Hiệu ứng: vệt chém, tia va chạm, vết máu, tan thành tro, rune bay về, bụi và gợn nước, mưa, sét, hiệu ứng màn hình
const FX = [];      // hiệu ứng trong thế giới có thời hạn: tia va chạm, gợn nước, vòng hồi máu, quái tan biến
const SPLATS = [];  // vết máu vương trên mặt đất, nhạt dần rồi biến mất
const RAIN = { k: 0, drops: [], rip: [], bolt: 0, boltT: 14, px: 0, py: 0 };

// "r,g,b,a" từ chuỗi rgba()/rgb(), nhớ sẵn để khỏi tách chuỗi mỗi khung hình
const COL_CACHE = new Map();
function rgbaOf(c) {
  let v = COL_CACHE.get(c);
  if (!v) {
    const m = /rgba?\(([^)]+)\)/.exec(c);
    if (m) { const p = m[1].split(',').map(Number); v = [p[0] | 0, p[1] | 0, p[2] | 0, p[3] === undefined ? 1 : p[3]]; }
    else { const h = c.replace('#', ''); v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1]; }
    COL_CACHE.set(c, v);
  }
  return v;
}

// ───────────────────────── vệt chém ─────────────────────────
// hình lưỡi liềm quanh điểm xoay: đầu vệt (chỗ lưỡi kiếm đang ở) dày và sáng nhất, đuôi mảnh và tan dần
function smear(cx, cy, R, a0, a1, w, col, hot) {
  let span = a1 - a0;
  if (Math.abs(span) < 0.06) return;
  if (Math.abs(span) > TAU * 0.9) { span = Math.sign(span) * TAU * 0.9; a0 = a1 - span; }
  const [r, g, b, al] = rgbaOf(col), n = Math.max(6, Math.ceil(Math.abs(span) * 7));
  ctx.beginPath();
  for (let i = 0; i <= n; i++) { const a = a0 + span * i / n; ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); }
  for (let i = n; i >= 0; i--) { const t = i / n, a = a0 + span * t, rr = R - w * Math.pow(t, 0.75); ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  ctx.closePath();
  if (ctx.createConicGradient) {
    // độ trong suốt đổi theo góc: gradient hình nón quanh điểm xoay
    const f = Math.abs(span) / TAU, gr = ctx.createConicGradient(span > 0 ? a0 : a1, cx, cy);
    const c0 = `rgba(${r},${g},${b},0)`, cm = `rgba(${r},${g},${b},${al * 0.35})`, c1 = `rgba(${r},${g},${b},${al})`;
    if (span > 0) { gr.addColorStop(0, c0); gr.addColorStop(f * 0.55, cm); gr.addColorStop(f, c1); gr.addColorStop(Math.min(1, f + 0.01), c0); }
    else { gr.addColorStop(0, c1); gr.addColorStop(f * 0.45, cm); gr.addColorStop(f, c0); }
    ctx.fillStyle = gr;
  } else ctx.fillStyle = `rgba(${r},${g},${b},${al * 0.6})`;
  ctx.fill();
  // mép lưỡi sáng rực ở nửa đầu vệt
  const op = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  const s0 = a0 + span * 0.45;
  ctx.strokeStyle = `rgba(255,250,235,${hot ? 0.75 : 0.5})`; ctx.lineWidth = hot ? 2.2 : 1.4;
  ctx.beginPath(); ctx.arc(cx, cy, R - 0.5, s0, a1, span < 0); ctx.stroke();
  if (hot) { ctx.strokeStyle = `rgba(${r},${g},${b},${al * 0.45})`; ctx.lineWidth = w * 0.6; ctx.beginPath(); ctx.arc(cx, cy, R - w * 0.3, s0, a1, span < 0); ctx.stroke(); }
  ctx.globalCompositeOperation = op;
}
// màu vệt chém của người chơi theo nguyên tố của vũ khí và bùa phủ lên lưỡi
function playerTrailCol(heavy) {
  const W = WEAPONS[S.equipped] || {};
  if (P.buffs.flame > 0) return 'rgba(255,150,60,.7)';
  if (P.buffs.holy > 0 || W.dt === 'holy') return 'rgba(255,214,110,.65)';
  if (W.dt === 'magic') return 'rgba(140,190,255,.65)';
  if (W.bleed) return heavy ? 'rgba(255,170,150,.55)' : 'rgba(240,190,180,.45)';
  return heavy ? 'rgba(255,226,160,.62)' : 'rgba(255,246,222,.5)';
}

// ───────────────────────── va chạm, máu, tan biến ─────────────────────────
function impact(x, y, a, col = '255,240,200', big = false) {
  FX.push({ k: 'impact', x, y, a, col, big, t: 0, dur: big ? 0.32 : 0.2 });
  if (FX.length > 90) FX.splice(0, FX.length - 90);
}
// vết máu: vài đốm loang theo hướng đòn đánh
function splat(x, y, a, col, n = 5) {
  const blobs = [];
  for (let i = 0; i < n; i++) {
    const d = i === 0 ? 0 : rand(4, 22), aa = a + rand(-0.6, 0.6), s = i === 0 ? rand(4, 7) : rand(1.2, 3.4);
    blobs.push([Math.cos(aa) * d, Math.sin(aa) * d * 0.7, s * rand(1, 1.6), s, aa]);
  }
  SPLATS.push({ x, y, blobs, col, t: 0, life: 14 });
  const cap = FX_LOW ? 24 : 70;
  if (SPLATS.length > cap) SPLATS.splice(0, SPLATS.length - cap);
}
// quái ngã xuống tan thành tro sáng bay lên, như ánh vàng của Elden Ring
function dissolve(e, col = '#f3cf6e') {
  FX.push({ k: 'dissolve', x: e.x, y: e.y, r: Math.max(10, e.r * (e.T && e.T.look ? e.T.look.scale || 1 : 1)), col, t: 0, dur: 1.1 });
}
// rune bay ra khỏi xác rồi lượn về phía người chơi
function runeStream(n, x, y) {
  const k = clamp(Math.round(4 + Math.log2(Math.max(1, n)) * 1.4), 5, FX_LOW ? 10 : 20);
  for (let i = 0; i < k; i++) {
    const a = rand(0, TAU), s = rand(60, 170);
    addPart(x + rand(-6, 6), y + rand(-6, 6), Math.cos(a) * s, Math.sin(a) * s - 40, 2.6, rand(1.6, 2.6), Math.random() < 0.3 ? '#fff0b8' : '#f3cf6e', 'rune', { delay: rand(0.2, 0.45) });
  }
}
// bụi dưới chân, hoặc bọt nước và gợn sóng khi đang lội
function puff(x, y, n = 5, col = '172,156,124') {
  if (inWater(x, y)) { ripple(x, y, 14); for (let i = 0; i < n; i++) addPart(x + rand(-5, 5), y + rand(-3, 3), rand(-50, 50), rand(-70, -20), rand(0.25, 0.4), rand(1.2, 2), 'rgba(210,230,240,.8)', 'dot'); return; }
  for (let i = 0; i < n; i++) addPart(x + rand(-8, 8), y + rand(-4, 4), rand(-26, 26), rand(-18, 6), rand(0.4, 0.7), rand(4, 7), col, 'puff');
}
function ripple(x, y, r = 12, a = 0.5) { if (FX.length < 120) FX.push({ k: 'ripple', x, y, r, a, t: 0, dur: 0.7 }); }
function healGlow(x, y, col = '255,120,100') {
  FX.push({ k: 'ring', x, y, col, t: 0, dur: 0.6 });
  for (let i = 0; i < (FX_LOW ? 8 : 16); i++) { const a = rand(0, TAU), d = rand(4, 16); addPart(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, rand(-6, 6), rand(-60, -30), rand(0.6, 1.1), rand(1.2, 2.2), `rgb(${col})`, 'cinder'); }
}

// ───────────────────────── cập nhật ─────────────────────────
let stepAcc = 0;
function updateFx(dt) {
  for (let i = FX.length - 1; i >= 0; i--) {
    const f = FX[i]; f.t += dt;
    if (f.k === 'dissolve' && f.t < f.dur * 0.8) {
      // tro bay lên từ khắp thân, dày lúc đầu rồi thưa dần
      const rate = (FX_LOW ? 24 : 60) * (1 - f.t / f.dur) * Math.min(2.2, f.r / 14);
      f.acc = (f.acc || 0) + rate * dt;
      while (f.acc >= 1) { f.acc--; addPart(f.x + rand(-f.r, f.r), f.y + rand(-f.r * 0.7, f.r * 0.5), rand(-10, 10), rand(-55, -25), rand(0.7, 1.3), rand(1.1, 2.3), f.col, 'cinder'); }
    }
    if (f.t >= f.dur) FX.splice(i, 1);
  }
  for (let i = SPLATS.length - 1; i >= 0; i--) if ((SPLATS[i].t += dt) > SPLATS[i].life) SPLATS.splice(i, 1);
  // bước chân: bụi khi chạy nhanh, gợn nước khi lội
  if (P.state !== 'dead' && !P.mounted) {
    const moving = dt > 0 && Math.hypot(P.x - RAIN.px, P.y - RAIN.py) / dt > 40;
    stepAcc += dt;
    const wet = inWater(P.x, P.y);
    if (P.sprinting && stepAcc > 0.13) { stepAcc = 0; puff(P.x - Math.cos(P.face) * 6, P.y + 6, 2); }
    else if (wet && moving && stepAcc > 0.28) { stepAcc = 0; ripple(P.x, P.y + 4, 10, 0.4); }
  }
  RAIN.px = P.x; RAIN.py = P.y;
  updateRain(dt);
}
// mưa ở Đầm Lầy Ashmire và mưa phùn ở Bờ Biển Saltreach; đầm lầy thỉnh thoảng có sét
const RAIN_REG = { 'Đầm Lầy Ashmire': 1, 'Bờ Biển Saltreach': 0.45 };
function updateRain(dt) {
  const inst = cam.x > 4800;
  const tgt = G.mode === 'title' || inst ? 0 : RAIN_REG[G.region] || 0;
  RAIN.k += (tgt - RAIN.k) * (1 - Math.exp(-0.6 * dt));
  const vw = CW / ZOOM, vh = CH / ZOOM, x0 = cam.x - vw / 2, y0 = cam.y - vh / 2;
  const want = Math.round((FX_LOW ? 70 : 170) * RAIN.k), D = RAIN.drops;
  while (D.length < want) D.push({ x: x0 + Math.random() * (vw + 120), y: y0 + Math.random() * vh, z: rand(0, 320), v: rand(620, 780) });
  if (D.length > want) D.length = want;
  for (const d of D) {
    d.z -= d.v * dt; d.x -= 110 * dt;
    if (d.z <= 0) {
      if (Math.random() < 0.3 && RAIN.rip.length < 60) RAIN.rip.push({ x: d.x, y: d.y, r: rand(3, 6), t: 0 });
      d.x = x0 + Math.random() * (vw + 120); d.y = y0 + Math.random() * vh; d.z = rand(240, 340);
    } else if (d.x < x0 - 40 || d.x > x0 + vw + 160 || d.y < y0 - 40 || d.y > y0 + vh + 360) { d.x = x0 + Math.random() * (vw + 120); d.y = y0 + Math.random() * vh; }
  }
  for (let i = RAIN.rip.length - 1; i >= 0; i--) if ((RAIN.rip[i].t += dt) > 0.5) RAIN.rip.splice(i, 1);
  // sét: chớp đôi rồi tiếng sấm vọng lại
  RAIN.bolt = Math.max(0, RAIN.bolt - dt * 2.4);
  if (RAIN.k > 0.75 && G.region === 'Đầm Lầy Ashmire' && G.mode === 'play' && (RAIN.boltT -= dt) <= 0) {
    RAIN.boltT = rand(14, 30); RAIN.bolt = 1;
    later(0.14, () => { RAIN.bolt = Math.max(RAIN.bolt, 0.7); });
    later(rand(0.6, 1.4), () => { noise(1.8, 0.28 * RAIN.k, 140, 0.4); tone(42, 1.6, 'sine', 0.12, -12); });
  }
}

// ───────────────────────── vẽ ─────────────────────────
// lớp mặt đất: vết máu và gợn nước, vẽ trước nhân vật
function drawFxGround() {
  for (const s of SPLATS) {
    if (!inView(s.x, s.y, 40)) continue;
    const a = Math.min(1, (s.life - s.t) / 4) * 0.85;
    ctx.globalAlpha = a; ctx.fillStyle = s.col;
    ctx.beginPath();
    for (const [dx, dy, rx, ry, rot] of s.blobs) { ctx.moveTo(s.x + dx + rx, s.y + dy); ctx.ellipse(s.x + dx, s.y + dy, rx, ry, rot, 0, TAU); }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
  if (RAIN.rip.length) {
    // gợn mưa: gộp thành hai nét vẽ (vừa rơi và sắp tan) cho nhẹ máy
    for (const young of [true, false]) {
      ctx.strokeStyle = young ? 'rgba(215,230,240,.32)' : 'rgba(215,230,240,.14)'; ctx.beginPath();
      for (const r of RAIN.rip) { if ((r.t < 0.22) !== young) continue; const rr = r.r * (0.4 + r.t * 2); ctx.moveTo(r.x + rr, r.y); ctx.ellipse(r.x, r.y, rr, rr * 0.5, 0, 0, TAU); }
      ctx.stroke();
    }
  }
  for (const f of FX) {
    if (f.k !== 'ripple' && f.k !== 'ring') continue;
    if (!inView(f.x, f.y, 40)) continue;
    const k = f.t / f.dur;
    if (f.k === 'ripple') {
      ctx.strokeStyle = `rgba(215,235,245,${f.a * (1 - k)})`;
      ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * (0.3 + k), f.r * (0.3 + k) * 0.5, 0, 0, TAU); ctx.stroke();
    } else {
      ctx.strokeStyle = `rgba(${f.col},${0.7 * (1 - k)})`; ctx.lineWidth = 2.4 * (1 - k) + 0.5;
      ctx.beginPath(); ctx.ellipse(f.x, f.y + 6, 10 + k * 30, (10 + k * 30) * 0.45, 0, 0, TAU); ctx.stroke(); ctx.lineWidth = 1;
    }
  }
}
// lớp trên cùng: tia va chạm (cộng sáng) và mưa
function drawFxTop() {
  ctx.globalCompositeOperation = 'lighter';
  for (const f of FX) {
    if (f.k !== 'impact' || !inView(f.x, f.y, 60)) continue;
    const k = f.t / f.dur, e = 1 - Math.pow(1 - k, 3), al = 1 - k, s = (f.big ? 38 : 22) * (0.55 + 0.7 * e);
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a);
    // ngôi sao bốn cánh dài theo hướng đòn
    ctx.fillStyle = `rgba(255,248,225,${al})`;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const ang = i * Math.PI / 4, rr = i % 2 ? s * 0.13 : i % 4 === 0 ? s * 1.25 : s * 0.62;
      ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(${f.col},${al * 0.8})`; ctx.lineWidth = (f.big ? 3 : 2) * (1 - k) + 0.4;
    ctx.beginPath(); ctx.arc(0, 0, s * (0.35 + e * 0.6), 0, TAU); ctx.stroke();
    if (f.big) {
      // các tia nhọn tỏa ra khi chí mạng hoặc phản đòn
      ctx.strokeStyle = `rgba(255,240,200,${al * 0.9})`; ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const ang = i * TAU / 10 + 0.3, r0 = s * (0.5 + e * 0.4), r1 = s * (0.9 + e * 0.9); ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0); ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1); }
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
  if (RAIN.drops.length) {
    ctx.strokeStyle = `rgba(195,210,230,${0.24 + 0.24 * RAIN.k})`; ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of RAIN.drops) { const y = d.y - d.z; ctx.moveTo(d.x, y); ctx.lineTo(d.x + 3.2, y - 17); }
    ctx.stroke();
  }
}
// đuôi sáng mềm của phép và cầu năng lượng, vẽ trước thân đạn
const TRAIL_KINDS = { glint: '200,220,255', orb: '140,170,255', porb: '190,170,255', horb: '255,225,140', fireball: '255,140,60', spit: '160,220,90', shard: '170,220,255', dagger: '255,210,110', gwave: '255,220,130', hwave: '255,220,130', cwave: '170,220,255', comet: '180,220,255', bolt: '255,245,170', hbolt: '255,225,140' };
function drawProjTrail(q) {
  const col = TRAIL_KINDS[q.kind];
  if (!col) return;
  const tr = q.tr || (q.tr = []);
  if (!tr.length || tr[tr.length - 2] !== q.x || tr[tr.length - 1] !== q.y) tr.push(q.x, q.y);
  const max = FX_LOW ? 12 : 22;
  if (tr.length > max) tr.splice(0, tr.length - max);
  const n = tr.length / 2;
  if (n < 2) return;
  // một dải liền: hai mép lệch vuông góc với đường bay, thu nhỏ dần về đuôi; tô bằng gradient từ đuôi tới đầu
  const w = Math.max(2.5, (q.r || 6) * 1.1), L = [], Rr = [];
  for (let i = 0; i < n; i++) {
    const j = Math.min(n - 1, i + 1), h = Math.max(0, i - 1);
    let dx = tr[j * 2] - tr[h * 2], dy = tr[j * 2 + 1] - tr[h * 2 + 1];
    const d = Math.hypot(dx, dy) || 1, t = i / (n - 1), ww = w * (0.15 + 0.85 * t);
    dx /= d; dy /= d;
    L.push(tr[i * 2] - dy * ww, tr[i * 2 + 1] + dx * ww); Rr.push(tr[i * 2] + dy * ww, tr[i * 2 + 1] - dx * ww);
  }
  ctx.beginPath(); ctx.moveTo(L[0], L[1]);
  for (let i = 1; i < n; i++) ctx.lineTo(L[i * 2], L[i * 2 + 1]);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(Rr[i * 2], Rr[i * 2 + 1]);
  ctx.closePath();
  const g = ctx.createLinearGradient(tr[0], tr[1], q.x, q.y);
  g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.6, `rgba(${col},.3)`); g.addColorStop(1, `rgba(${col},.75)`);
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}
// lớp màn hình: trời mưa tối lại, chớp sét, viền tối đập theo nhịp tim khi sắp chết
function drawScreenFx() {
  if (RAIN.k > 0.02) { ctx.fillStyle = `rgba(16,22,36,${0.16 * RAIN.k})`; ctx.fillRect(0, 0, CW, CH); }
  if (RAIN.bolt > 0) { ctx.fillStyle = `rgba(205,220,255,${0.4 * RAIN.bolt * RAIN.bolt})`; ctx.fillRect(0, 0, CW, CH); }
  if (G.mode === 'play' && P.state !== 'dead' && P.hp < P.maxHp * 0.3) {
    const low = 1 - P.hp / (P.maxHp * 0.3), ph = (G.clock * 1.5) % 1;
    const beat = Math.max(Math.exp(-ph * 14), 0.7 * Math.exp(-Math.abs(ph - 0.22) * 16));
    const a = (0.34 + 0.36 * low) * (0.5 + 0.5 * beat);
    const g = ctx.createRadialGradient(CW / 2, CH / 2, Math.min(CW, CH) * (0.34 - 0.05 * beat), CW / 2, CH / 2, Math.hypot(CW, CH) * 0.5);
    g.addColorStop(0, 'rgba(60,0,0,0)'); g.addColorStop(0.55, `rgba(110,8,10,${a * 0.45})`); g.addColorStop(1, `rgba(150,14,16,${a})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
  }
}
