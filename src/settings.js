'use strict';
// Gravebound — Bảng cài đặt: âm lượng, rung màn hình, cỡ chữ và gán lại phím
const BIND_LABEL = {
  up: 'Đi lên', down: 'Đi xuống', left: 'Sang trái', right: 'Sang phải', roll: 'Lăn né / chạy nhanh', guard: 'Đỡ đòn', light: 'Đánh thường', heavy: 'Đánh mạnh',
  spell: 'Niệm phép', skill: 'Kỹ năng vũ khí', item: 'Dùng đồ', interact: 'Tương tác', mount: 'Gọi ngựa', lock: 'Khóa mục tiêu', map: 'Bản đồ', inv: 'Hành trang',
  itemnext: 'Đổi đồ', spellnext: 'Đổi phép', eqprev: 'Vũ khí trước', eqnext: 'Vũ khí sau',
};
function applyTextSize() { document.documentElement.style.setProperty('--uiz', SET.text); }
function applyVolumes() {
  if (AC && master) master.gain.setTargetAtTime(0.62 * SET.sfx, AC.currentTime, 0.05);
}
function renderBinds() {
  $('bindList').innerHTML = Object.keys(BINDS_DEFAULT).map(a => `<li><span>${BIND_LABEL[a]}</span><button type="button" data-bind="${a}" class="${G.rebind === a ? 'wait' : ''}">${G.rebind === a ? 'Nhấn phím…' : keyName(SET.binds[a])}</button></li>`).join('');
}
function renderSettings() {
  $('setMusic').value = Math.round(SET.music * 100); $('setSfx').value = Math.round(SET.sfx * 100);
  for (const b of $('setShake').children) b.setAttribute('aria-pressed', String((b.dataset.v === '1') === SET.shake));
  for (const b of $('setText').children) b.setAttribute('aria-pressed', String(+b.dataset.v === SET.text));
  renderBinds();
}
function finishRebind(code) {
  const a = G.rebind; G.rebind = null;
  if (code !== 'Escape' && a) {
    // phím đã dùng cho việc khác thì đổi chỗ cho nhau, không để hai việc trùng một phím
    const other = Object.keys(SET.binds).find(k => k !== a && SET.binds[k] === code);
    if (other) SET.binds[other] = SET.binds[a];
    SET.binds[a] = code; rebuildKeymap(); saveSet(); refreshKbd();
  }
  renderBinds();
}
function openSettings(from) { renderSettings(); openInfo(UI.settings, from); }
$('btnSettings').onclick = () => openSettings(UI.title);
$('btnPauseSet').onclick = () => openSettings(UI.pause);
$('btnSetClose').onclick = () => closeInfo();
$('setMusic').oninput = e => { SET.music = e.target.value / 100; saveSet(); };
$('setSfx').oninput = e => { SET.sfx = e.target.value / 100; applyVolumes(); saveSet(); };
$('setShake').onclick = e => { const b = e.target.closest('button'); if (!b) return; SET.shake = b.dataset.v === '1'; if (!SET.shake) G.shake = 0; saveSet(); renderSettings(); };
$('setText').onclick = e => { const b = e.target.closest('button'); if (!b) return; SET.text = +b.dataset.v; applyTextSize(); saveSet(); renderSettings(); };
$('bindList').onclick = e => { const b = e.target.closest('button[data-bind]'); if (!b) return; G.rebind = b.dataset.bind; renderBinds(); };
$('setResetKeys').onclick = () => { SET.binds = Object.assign({}, BINDS_DEFAULT); rebuildKeymap(); saveSet(); renderBinds(); refreshKbd(); };
applyTextSize(); refreshKbd();
// ───────────────────────── cài như ứng dụng (PWA) ─────────────────────────
// chỉ chạy khi game được mở qua http(s), ví dụ GitHub Pages; mở trong khung nhúng hay tệp cục bộ thì bỏ qua
let installEvt = null;
const standalone = () => matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && window.top === window) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* không cài được thì chơi bình thường */ }));
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; $('btnInstall').hidden = false; });
window.addEventListener('appinstalled', () => { installEvt = null; $('btnInstall').hidden = true; toast('Đã cài Gravebound như một ứng dụng'); });
if (isIOS() && !standalone() && window.top === window) $('btnInstall').hidden = false;
$('btnInstall').onclick = async () => {
  if (installEvt) { installEvt.prompt(); try { await installEvt.userChoice; } catch (e) { /* bỏ qua */ } installEvt = null; $('btnInstall').hidden = true; return; }
  toast('Trên iPhone/iPad: bấm nút Chia sẻ của Safari rồi chọn “Thêm vào Màn hình chính”', 7);
};
