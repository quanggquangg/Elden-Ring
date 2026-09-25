'use strict';
// Gravebound — Tên người chơi và bảng xếp hạng
// Xếp theo số lần chết (ít hơn đứng trên), bằng nhau thì theo thời gian phá đảo.
// Nơi lưu, theo thứ tự ưu tiên: Firebase Firestore (khi src/config.js có cấu hình, dùng cho bản trên GitHub Pages),
// kho dữ liệu của artifact claude.ai (db), rồi tới bảng chỉ nằm trên trình duyệt này.
const NAME_KEY = 'vvv-name', LOCAL_BOARD = 'vvv-scores';
let boardMode = 'local', boardDb = null, boardRows = [], boardUnsub = null, boardPoll = 0;
const boardShared = () => boardMode !== 'local';
const fmtTime = t => { const s = Math.floor(t), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return h + ':' + String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const rankSort = (a, b) => a.deaths - b.deaths || a.time - b.time || a.at - b.at;
function cleanName(s) { return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 20); }
function readLocalBoard() { try { const v = JSON.parse(localStorage.getItem(LOCAL_BOARD) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
function writeLocalBoard(rows) { try { localStorage.setItem(LOCAL_BOARD, JSON.stringify(rows.slice(0, 200))); } catch (e) { /* bỏ qua */ } }
// độ khó được ghép vào trường cls ("knight|hard") để không phải đổi luật Firestore; không có thì là Thường
function splitCls(r) { const [c, d] = String(r.cls || '').split('|'); return Object.assign({}, r, { cls: c, diff: DIFFS[d] ? d : 'normal' }); }
function setRows(rows) { boardRows = rows.filter(r => typeof r.deaths === 'number' && typeof r.time === 'number').map(splitCls).sort(rankSort); if (!UI.board.hidden) renderBoard(); }
// ── Firebase Firestore qua REST, không cần thư viện ──
const FB = typeof BOARD_CONFIG !== 'undefined' && BOARD_CONFIG.apiKey && BOARD_CONFIG.projectId ? BOARD_CONFIG : null;
const fbBase = () => 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(FB.projectId) + '/databases/' + encodeURIComponent(FB.databaseId || '(default)') + '/documents';
const fbInt = v => ({ integerValue: String(Math.round(v)) });
async function fbFetchRows() {
  // chỉ sắp theo một trường để không cần tạo chỉ mục ghép; thời gian được sắp lại trên máy
  const body = { structuredQuery: { from: [{ collectionId: 'scores' }], orderBy: [{ field: { fieldPath: 'deaths' }, direction: 'ASCENDING' }], limit: 300 } };
  const r = await fetch(fbBase() + ':runQuery?key=' + encodeURIComponent(FB.apiKey), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('firestore ' + r.status);
  return (await r.json()).filter(x => x.document).map(({ document: d }) => {
    const f = d.fields || {}, n = k => Number(f[k] && (f[k].integerValue ?? f[k].doubleValue));
    return { id: d.name.split('/').pop(), name: f.name ? f.name.stringValue : '', deaths: n('deaths'), time: n('seconds'), level: n('level'), cls: f.cls ? f.cls.stringValue : '', at: Date.parse(d.createTime) || 0 };
  }).filter(r => Number.isFinite(r.deaths) && Number.isFinite(r.time));
}
async function fbInsert(id, row) {
  const fields = { name: { stringValue: row.name }, deaths: fbInt(row.deaths), seconds: fbInt(Math.max(60, row.time)), level: fbInt(row.level), cls: { stringValue: row.cls } };
  const r = await fetch(fbBase() + '/scores?documentId=' + encodeURIComponent(id) + '&key=' + encodeURIComponent(FB.apiKey), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) });
  if (!r.ok && r.status !== 409) throw new Error('firestore ' + r.status); // 409: kết quả này đã được gửi rồi
}
async function refreshBoard() {
  if (boardMode === 'firebase') { try { setRows(await fbFetchRows()); } catch (e) { /* giữ bảng cũ, lần sau thử lại */ } }
}
(async function initBoard() {
  boardRows = readLocalBoard().map(splitCls).sort(rankSort);
  if (FB) {
    try { setRows(await fbFetchRows()); boardMode = 'firebase'; return; } catch (e) { /* không kết nối được, thử cách khác */ }
  }
  try { boardDb = window.claude && window.claude.use ? await window.claude.use('db') : null; } catch (e) { boardDb = null; }
  if (!boardDb) return;
  boardMode = 'claude';
  boardUnsub = boardDb.collection('scores').orderBy('deaths', 'asc').limit(300).onSnapshot(
    snap => setRows(snap.docs.map(d => Object.assign({ id: d.id }, d.data()))),
    () => { boardMode = 'local'; setRows(readLocalBoard()); });
})();
// ghi kết quả một lần cho mỗi hành trình phá đảo
async function submitRun() {
  if (S.submitted) return;
  const row = { name: cleanName(S.name) || 'Gravebound', deaths: S.deaths, time: Math.round(S.time), level: S.level, cls: S.cls + (DIFF.id !== 'normal' ? '|' + DIFF.id : ''), at: Date.now() };
  S.submitted = true; S.runId = S.runId || ('r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)); save();
  const local = readLocalBoard().filter(r => r.id !== S.runId); local.push(Object.assign({ id: S.runId }, row)); writeLocalBoard(local.sort(rankSort));
  try {
    if (boardMode === 'firebase') { await fbInsert(S.runId, row); await refreshBoard(); }
    else if (boardMode === 'claude') await boardDb.collection('scores').doc(S.runId).set(row);
    else setRows(local);
  } catch (e) {
    boardMode = 'local'; setRows(local);
    toast('Không gửi được lên bảng xếp hạng chung, đã lưu trên máy này');
  }
}
let boardDiff = 'normal';
function myRank() { const i = boardRows.filter(r => r.diff === DIFF.id).findIndex(r => r.id === S.runId); return i < 0 ? null : i + 1; }
function renderBoard() {
  $('boardNote').textContent = boardShared() ? 'Bảng chung của mọi người chơi. Xếp theo số lần chết, bằng nhau thì ai phá đảo nhanh hơn đứng trên.'
    : 'Bảng này chỉ lưu trên trình duyệt của bạn. Xếp theo số lần chết, bằng nhau thì ai phá đảo nhanh hơn đứng trên.';
  $('boardTabs').innerHTML = DIFF_ORDER.map(id => `<button data-bdiff="${id}" aria-pressed="${id === boardDiff}">${DIFFS[id].name} · ${boardRows.filter(r => r.diff === id).length}</button>`).join('');
  const rows = boardRows.filter(r => r.diff === boardDiff);
  const body = $('boardBody');
  body.textContent = '';
  if (!rows.length) { const tr = document.createElement('tr'); const td = document.createElement('td'); td.colSpan = 6; td.className = 'empty'; td.textContent = 'Chưa ai phá đảo ở độ khó ' + DIFFS[boardDiff].name + '. Hãy là người đầu tiên!'; tr.appendChild(td); body.appendChild(tr); return; }
  rows.slice(0, 100).forEach((r, i) => {
    const tr = document.createElement('tr');
    if (r.id && r.id === S.runId) tr.className = 'me';
    const cls = (CLASSES.find(c => c.id === r.cls) || {}).name || '';
    for (const v of [i + 1, cleanName(r.name) || 'Gravebound', r.deaths, fmtTime(r.time), r.level, cls]) { const td = document.createElement('td'); td.textContent = String(v); tr.appendChild(td); }
    body.appendChild(tr);
  });
}
let boardBack = null;
function openBoard(back, diff) {
  boardBack = back; boardDiff = diff || 'normal'; UI.board.hidden = false; renderBoard(); refreshBoard();
  clearInterval(boardPoll); boardPoll = setInterval(() => { if (UI.board.hidden) clearInterval(boardPoll); else refreshBoard(); }, 20000);
  setTimeout(() => $('btnBoardClose').focus({ preventScroll: true }), 30);
}
function closeBoard() { UI.board.hidden = true; if (boardBack) boardBack(); boardBack = null; }
$('btnBoardClose').onclick = closeBoard;
$('boardTabs').addEventListener('click', e => { const b = e.target.closest('[data-bdiff]'); if (b) { boardDiff = b.dataset.bdiff; renderBoard(); const n = $('boardTabs').querySelector(`[data-bdiff="${boardDiff}"]`); if (n) n.focus({ preventScroll: true }); } });
$('btnBoard').onclick = () => { audioInit(); UI.title.hidden = true; openBoard(() => { UI.title.hidden = false; }); };
$('btnEndBoard').onclick = () => { UI.ending.hidden = true; openBoard(() => { UI.ending.hidden = false; }, DIFF.id); };

// ───────────────────────── nhập tên khi bắt đầu hành trình mới ─────────────────────────
function openNameEntry() {
  UI.title.hidden = true; UI.name.hidden = false;
  let last = ''; try { last = localStorage.getItem(NAME_KEY) || ''; } catch (e) { /* bỏ qua */ }
  $('nameInput').value = last; $('nameErr').hidden = true;
  setTimeout(() => $('nameInput').focus({ preventScroll: true }), 30);
}
function confirmName() {
  const n = cleanName($('nameInput').value);
  if (!n) { $('nameErr').hidden = false; $('nameInput').focus(); return; }
  pendingName = n;
  try { localStorage.setItem(NAME_KEY, n); } catch (e) { /* bỏ qua */ }
  UI.name.hidden = true; openDiffSelect();
}
let pendingName = '';
$('nameForm').addEventListener('submit', e => { e.preventDefault(); audioInit(); confirmName(); });
$('btnNameBack').onclick = () => { UI.name.hidden = true; UI.title.hidden = false; };
