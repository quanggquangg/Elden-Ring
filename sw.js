// Gravebound — service worker: cài như ứng dụng và chơi khi mất mạng.
// Luôn ưu tiên bản mới trên mạng (để cập nhật game không bị kẹt bản cũ), chỉ dùng bản lưu sẵn khi không có mạng.
const CACHE = 'gravebound-v3';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-64.png',
  'src/config.js', 'src/core.js', 'src/lang.js', 'src/music.js', 'src/world.js', 'src/data.js', 'src/state.js', 'src/input.js', 'src/player.js', 'src/progression.js',
  'src/enemies.js', 'src/bosses.js', 'src/content.js', 'src/systems.js', 'src/render.js', 'src/hud.js', 'src/bestiary.js', 'src/settings.js', 'src/leaderboard.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  // bảng xếp hạng luôn đi thẳng lên mạng
  if (url.hostname.endsWith('googleapis.com') && !url.hostname.startsWith('fonts.')) return;
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fonts) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined))));
});
