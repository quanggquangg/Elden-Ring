'use strict';
// Gravebound — Bàn phím, chuột, cảm ứng và tay cầm
// ───────────────────────── nhập liệu ─────────────────────────
const keys = new Set();
let buf = null, aimMode = 'keys';
const mouse = { x: 0, y: 0, wx: 0, wy: 0, inside: false };
const stick = { x: 0, y: 0 };
const KEYMAP = { KeyJ: 'light', KeyK: 'heavy', KeyL: 'spell', KeyC: 'skill', KeyR: 'item', KeyE: 'interact', KeyF: 'mount', KeyQ: 'lock', KeyG: 'map', KeyI: 'inv', Tab: 'inv', ArrowRight: 'eqnext', ArrowLeft: 'eqprev', KeyT: 'eqnext', ArrowUp: 'spellnext', ArrowDown: 'itemnext', KeyV: 'itemnext' };
for (let i = 1; i <= 9; i++) KEYMAP['Digit' + i] = 'eq' + i;
let touchGuard = false;
let mouseGuard = false;
const DASH_HOLD = 280; // giữ nút lăn lâu hơn mức này thì chạy nhanh, nhả sớm thì lăn (giống Elden Ring)
const dodgeKey = { down: false, at: 0 };
const pad = { prev: [], stick: { x: 0, y: 0 }, guard: false, dodgeDown: false, dodgeAt: 0 };
const guardHeld = () => keys.has('KeyX') || touchGuard || mouseGuard || pad.guard;
const sprintHeld = () => (dodgeKey.down && performance.now() - dodgeKey.at >= DASH_HOLD) || (pad.dodgeDown && performance.now() - pad.dodgeAt >= DASH_HOLD);
function act(a) {
  audioInit();
  if (a === 'pause') { togglePause(); return; }
  if (a === 'map') { toggleMap(); return; }
  if (a === 'inv') { if (G.mode === 'play') openInventory(); return; }
  if (G.mode !== 'play') return;
  if (a === 'lock') { toggleLock(); return; }
  if (a.startsWith('eq')) { equipKey(a); return; }
  if (a === 'spellnext') { cycleSpell(); return; }
  if (a === 'itemnext') { cycleQuick(); return; }
  buf = { a, t: G.clock };
}
const peekBuf = () => (buf && G.clock - buf.t < 0.32 ? buf.a : null);
function takeBuf() { const a = peekBuf(); buf = null; return a; }
window.addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return; // đang gõ tên
  if (e.code === 'Escape') { e.preventDefault(); togglePause(); return; }
  if (e.code === 'KeyM' && !e.repeat) { toggleMute(); return; }
  if (e.code === 'KeyG' && !e.repeat && G.mode === 'map') { toggleMap(); return; }
  if (e.code === 'KeyI' && !e.repeat && G.mode === 'menu' && !UI.grace.hidden && menuAt === 'field') { e.preventDefault(); closeGrace(); return; }
  if (G.mode !== 'play') return;
  keys.add(e.code);
  if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) { dodgeKey.down = true; dodgeKey.at = performance.now(); } return; }
  const a = KEYMAP[e.code];
  if (a && !e.repeat) { if (e.code === 'KeyJ' || e.code === 'KeyK' || e.code === 'KeyL' || e.code === 'KeyC') aimMode = 'keys'; act(a); }
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => {
  keys.delete(e.code);
  if (e.code === 'Space' && dodgeKey.down) { dodgeKey.down = false; if (performance.now() - dodgeKey.at < DASH_HOLD) act('roll'); }
});
window.addEventListener('blur', () => { keys.clear(); dodgeKey.down = false; mouseGuard = false; });
window.addEventListener('mouseup', e => { if (e.button === 2) mouseGuard = false; });
// trên bản đồ: bấm vào bản đồ để đặt / gỡ dấu đánh dấu, bấm ra ngoài để đóng
canvas.addEventListener('pointerdown', e => {
  if (G.mode !== 'map') return;
  G.ignoreClick = true;
  const r = canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, M = G.mapRect;
  if (!M || mx < M.mx || my < M.my || mx > M.mx + M.mw || my > M.my + M.mh) { toggleMap(); return; }
  const wx = WX0 + (mx - M.mx) / M.sc, wy = WY0 + (my - M.my) / M.sc;
  if (e.button === 2 || (S.marker && Math.hypot((S.marker.x - wx) * M.sc, (S.marker.y - wy) * M.sc) < 14)) { S.marker = null; toast('Đã gỡ dấu'); }
  else { S.marker = { x: wx, y: wy }; toast('Đã đặt dấu trên bản đồ'); }
  SFX.glint(); save();
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.inside = true; if (!G.touch) aimMode = 'mouse'; });
canvas.addEventListener('mouseleave', () => { mouse.inside = false; });
canvas.addEventListener('mousedown', e => {
  if (G.touch) return;
  audioInit();
  const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; aimMode = 'mouse';
  if (G.ignoreClick) { G.ignoreClick = false; return; }
  if (G.mode !== 'play') return;
  // Elden Ring: chuột trái đánh, Shift + trái đánh mạnh, chuột phải đỡ (tay trái cầm gậy / ấn thì niệm phép),
  // Shift + phải dùng kỹ năng vũ khí, chuột giữa khóa mục tiêu
  if (e.button === 0) act(e.shiftKey ? 'heavy' : 'light');
  else if (e.button === 1) { e.preventDefault(); act('lock'); }
  else if (e.button === 2) { if (e.shiftKey) act('skill'); else { mouseGuard = true; if (catalyst()) act('spell'); } }
});
canvas.addEventListener('auxclick', e => e.preventDefault());
function moveInput() {
  let x = 0, y = 0;
  if (keys.has('KeyW')) y -= 1;
  if (keys.has('KeyS')) y += 1;
  if (keys.has('KeyA')) x -= 1;
  if (keys.has('KeyD')) x += 1;
  const l = Math.hypot(x, y); if (l > 0) { x /= l; y /= l; }
  return [x + stick.x + pad.stick.x, y + stick.y + pad.stick.y];
}
// tay cầm: sơ đồ nút giống Elden Ring trên console (chuẩn Xbox / PlayStation)
const PB = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, BACK: 8, START: 9, R3: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
window.addEventListener('gamepadconnected', () => { audioInit(); toast('Đã kết nối tay cầm'); });
function padMenuNav(dir) {
  const ov = [UI.lore, UI.controls, UI.board, UI.name, UI.diff, UI.shop, UI.cls, UI.grace, UI.pause, UI.ending, UI.title].find(o => !o.hidden);
  if (!ov) return;
  const els = [...ov.querySelectorAll('button:not([disabled])')].filter(el => el.offsetParent !== null);
  if (!els.length) return;
  let i = els.indexOf(document.activeElement);
  i = i < 0 ? 0 : (i + dir + els.length) % els.length;
  els[i].focus();
}
function pollPad() {
  let gp = null;
  try { gp = navigator.getGamepads ? [...navigator.getGamepads()].find(g => g && g.connected) : null; } catch (e) { gp = null; }
  if (!gp) { pad.stick.x = 0; pad.stick.y = 0; pad.guard = false; pad.dodgeDown = false; return; }
  const btn = i => { const b = gp.buttons[i]; return !!(b && (b.pressed || b.value > 0.5)); };
  const down = i => btn(i) && !pad.prev[i], up = i => !btn(i) && pad.prev[i];
  let x = gp.axes[0] || 0, y = gp.axes[1] || 0;
  if (Math.hypot(x, y) < 0.2) { x = 0; y = 0; }
  pad.stick.x = x; pad.stick.y = y;
  if (G.mode === 'play' || G.mode === 'dead') {
    if (down(PB.B)) { pad.dodgeDown = true; pad.dodgeAt = performance.now(); }
    if (up(PB.B) && pad.dodgeDown) { pad.dodgeDown = false; if (performance.now() - pad.dodgeAt < DASH_HOLD) act('roll'); }
    const map = [[PB.RB, 'light'], [PB.RT, 'heavy'], [PB.LT, 'skill'], [PB.X, 'item'], [PB.Y, 'interact'], [PB.A, 'mount'], [PB.R3, 'lock'], [PB.RIGHT, 'eqnext'], [PB.LEFT, 'eqprev'], [PB.UP, 'spellnext'], [PB.DOWN, 'itemnext'], [PB.BACK, 'map'], [PB.START, 'pause']];
    for (const [i, a] of map) if (down(i)) { aimMode = 'keys'; act(a); }
    pad.guard = btn(PB.LB);
  } else {
    pad.guard = false; pad.dodgeDown = false;
    if (G.mode === 'map') { if (down(PB.BACK) || down(PB.B) || down(PB.START)) toggleMap(); }
    else {
      if (down(PB.UP) || down(PB.LEFT)) padMenuNav(-1);
      if (down(PB.DOWN) || down(PB.RIGHT)) padMenuNav(1);
      if (down(PB.A) && document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.click();
      if (down(PB.START) || down(PB.B)) { if (G.mode === 'title' && UI.lore.hidden && UI.controls.hidden && UI.board.hidden) { if (!document.activeElement || document.activeElement.tagName !== 'BUTTON') padMenuNav(1); } else togglePause(); }
    }
  }
  pad.prev = gp.buttons.map((_, i) => btn(i));
}

// điều khiển cảm ứng
const touchUI = $('touch'), stickZone = $('stickZone'), stickBase = $('stickBase'), knob = $('knob');
function enableTouch() { if (G.touch) return; G.touch = true; touchUI.hidden = G.mode !== 'play'; aimMode = 'keys'; }
try { if (window.matchMedia('(pointer: coarse)').matches) enableTouch(); } catch (e) { /* bỏ qua */ }
window.addEventListener('touchstart', enableTouch, { passive: true });
let stickId = null, stickOx = 0, stickOy = 0;
stickZone.addEventListener('pointerdown', e => {
  e.preventDefault(); audioInit();
  stickId = e.pointerId; stickZone.setPointerCapture(e.pointerId);
  const r = stickZone.getBoundingClientRect(); stickOx = e.clientX; stickOy = e.clientY;
  stickBase.style.left = (e.clientX - r.left) + 'px'; stickBase.style.top = (e.clientY - r.top) + 'px'; stickBase.hidden = false;
  knob.style.transform = 'translate(0,0)';
});
stickZone.addEventListener('pointermove', e => {
  if (e.pointerId !== stickId) return;
  let dx = e.clientX - stickOx, dy = e.clientY - stickOy; const l = Math.hypot(dx, dy), m = 50;
  if (l > m) { dx = dx / l * m; dy = dy / l * m; }
  stick.x = dx / m; stick.y = dy / m;
  if (Math.hypot(stick.x, stick.y) < 0.18) { stick.x = 0; stick.y = 0; }
  knob.style.transform = `translate(${dx}px,${dy}px)`;
});
const endStick = e => { if (e.pointerId !== stickId) return; stickId = null; stick.x = 0; stick.y = 0; stickBase.hidden = true; };
stickZone.addEventListener('pointerup', endStick); stickZone.addEventListener('pointercancel', endStick);
touchUI.querySelectorAll('[data-hold]').forEach(b => {
  b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audioInit(); touchGuard = true; b.classList.add('on'); if (G.mode === 'play' && catalyst()) act('spell'); });
  const off = () => { touchGuard = false; b.classList.remove('on'); };
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => b.addEventListener(ev, off));
  b.addEventListener('contextmenu', e => e.preventDefault());
});
touchUI.querySelectorAll('[data-act]').forEach(b => {
  b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); aimMode = 'keys'; b.classList.add('on'); act(b.dataset.act); });
  const off = () => b.classList.remove('on');
  b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
  b.addEventListener('contextmenu', e => e.preventDefault());
});
