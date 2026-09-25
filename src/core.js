'use strict';
// Gravebound — Tiện ích, canvas và âm thanh
// ───────────────────────── tiện ích ─────────────────────────
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
function turn(a, target, step) { return a + clamp(angDiff(a, target), -step, step); }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  const t = l ? clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}
function inArc(ax, ay, face, range, arc, tx, ty, tr) {
  const d = dist(ax, ay, tx, ty);
  if (d > range + tr) return false;
  if (d < tr + 4) return true;
  return Math.abs(angDiff(face, Math.atan2(ty - ay, tx - ax))) <= arc / 2 + Math.atan2(tr, d);
}
const $ = id => document.getElementById(id);

// ───────────────────────── canvas ─────────────────────────
const canvas = $('game');
const ctx = canvas.getContext('2d');
// hệ số phóng từ tọa độ thế giới ra điểm ảnh thật của canvas
let WZ = 1;
let DPR = 1, CW = 800, CH = 600, ZOOM = 1, VIGNETTE = null;
// Đồ họa thấp: bỏ cỏ động, sương mù, giảm độ phân giải lớp ánh sáng (mặc định bật trên điện thoại)
let FX_LOW = (() => {
  try { const v = localStorage.getItem('vvv-fx'); if (v) return v === 'low'; } catch (e) { /* bỏ qua */ }
  try { return window.matchMedia('(pointer: coarse)').matches; } catch (e) { return false; }
})();
const lightCanvas = document.createElement('canvas'), lctx = lightCanvas.getContext('2d');
let LSCALE = 0.25;
function resize() {
  // kích thước bố cục (không tính phép xoay của chế độ xoay ngang)
  CW = Math.max(1, canvas.clientWidth); CH = Math.max(1, canvas.clientHeight);
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(CW * DPR); canvas.height = Math.round(CH * DPR);
  ZOOM = clamp(Math.sqrt(CW * CH) / 720, 0.66, 1.6);
  WZ = DPR * ZOOM;
  VIGNETTE = ctx.createRadialGradient(CW / 2, CH / 2, Math.min(CW, CH) * 0.3, CW / 2, CH / 2, Math.max(CW, CH) * 0.78);
  VIGNETTE.addColorStop(0, 'rgba(6,5,3,0)');
  VIGNETTE.addColorStop(1, 'rgba(6,5,3,0.66)');
  // lớp bóng tối chỉ gồm các dải chuyển mượt nên độ phân giải thấp vẫn đẹp mà nhẹ hơn nhiều
  LSCALE = FX_LOW ? 0.18 : 0.25;
  lightCanvas.width = Math.max(1, Math.ceil(canvas.width * LSCALE)); lightCanvas.height = Math.max(1, Math.ceil(canvas.height * LSCALE));
}
window.addEventListener('resize', resize);
resize();

const FONT_D = '"Cormorant SC","Cormorant Garamond",Georgia,serif';
const FONT_I = '"Cormorant Garamond",Georgia,serif';
const FONT_U = '"Be Vietnam Pro",system-ui,sans-serif';

// ───────────────────────── âm thanh (tổng hợp bằng WebAudio) ─────────────────────────
let AC = null, master = null, muted = false, noiseBuf = null;
function audioInit() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = 0.5; master.connect(AC.destination);
    }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { AC = null; }
}
function tone(f, dur, type = 'sine', vol = 0.12, slide = 0, delay = 0) {
  if (!AC || muted) return;
  const t0 = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(dur, vol = 0.2, freq = 1200, q = 1, delay = 0) {
  if (!AC || muted) return;
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t0 = AC.currentTime + delay, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.05);
}
const SFX = {
  swing: () => noise(0.14, 0.12, 2800, 0.8),
  heavy: () => noise(0.26, 0.18, 1300, 0.7),
  hit: () => { noise(0.12, 0.3, 700, 1.2); tone(140, 0.12, 'square', 0.06, -80); },
  crit: () => { noise(0.3, 0.4, 500, 1); tone(90, 0.45, 'sawtooth', 0.1, -50); },
  hurt: () => { noise(0.15, 0.25, 500, 1); tone(110, 0.2, 'sawtooth', 0.08, -50); },
  roll: () => noise(0.2, 0.08, 500, 0.6),
  spell: () => { tone(1200, 0.25, 'triangle', 0.07, -500); tone(1800, 0.2, 'sine', 0.04, -800); },
  drink: () => { tone(420, 0.35, 'sine', 0.07, 260); tone(630, 0.4, 'sine', 0.05, 300, 0.1); },
  grace: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 1.3, 'sine', 0.06, 0, i * 0.12)),
  death: () => { tone(98, 2.4, 'sawtooth', 0.08, -40); tone(147, 2.4, 'sine', 0.06, -60); },
  felled: () => [392, 523.25, 659.25, 783.99].forEach((f, i) => tone(f, 2, 'triangle', 0.06, 0, i * 0.18)),
  boom: () => { noise(0.5, 0.45, 220, 0.7); tone(60, 0.5, 'sine', 0.18, -30); },
  pickup: () => { tone(880, 0.3, 'sine', 0.06); tone(1320, 0.4, 'sine', 0.05, 0, 0.08); },
  glint: () => tone(2400, 0.08, 'sine', 0.03),
  roar: () => { noise(1.2, 0.3, 300, 0.5); tone(70, 1.2, 'sawtooth', 0.1, 20); },
  whistle: () => { tone(1500, 0.18, 'sine', 0.05, 400); tone(1900, 0.25, 'sine', 0.05, 300, 0.18); },
  block: () => { noise(0.12, 0.25, 1800, 2); tone(620, 0.1, 'square', 0.04); },
  parry: () => { tone(2200, 0.4, 'triangle', 0.08, -500); noise(0.2, 0.3, 3200, 3); },
  fire: (d = 1.7) => noise(d, 0.22, 700, 0.5),
  wing: () => noise(0.5, 0.25, 240, 0.6),
  bleed: () => { tone(180, 0.25, 'sawtooth', 0.07, -60); noise(0.25, 0.3, 900, 1); },
  poison: () => tone(160, 0.5, 'sine', 0.06, -60),
};
