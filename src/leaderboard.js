'use strict';
// Vòng Vàng Vỡ — Tên người chơi và bảng xếp hạng
// Xếp theo số lần chết (ít hơn đứng trên), bằng nhau thì theo thời gian phá đảo.
// Khi trang được cấp kho dữ liệu dùng chung (db) thì mọi người chung một bảng;
// nếu không, bảng chỉ lưu trên trình duyệt này.
const NAME_KEY = 'vvv-name', LOCAL_BOARD = 'vvv-scores';
let boardDb = null, boardRows = [], boardShared = false, boardUnsub = null;
const fmtTime = t => { const s = Math.floor(t), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return h + ':' + String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const rankSort = (a, b) => a.deaths - b.deaths || a.time - b.time || a.at - b.at;
function cleanName(s) { return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 20); }
function readLocalBoard() { try { const v = JSON.parse(localStorage.getItem(LOCAL_BOARD) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
function writeLocalBoard(rows) { try { localStorage.setItem(LOCAL_BOARD, JSON.stringify(rows.slice(0, 200))); } catch (e) { /* bỏ qua */ } }
// kết nối kho dữ liệu dùng chung nếu trang được cấp; không có thì dùng bảng trên máy
(async function initBoard() {
  boardRows = readLocalBoard().sort(rankSort);
  try { boardDb = window.claude && window.claude.use ? await window.claude.use('db') : null; } catch (e) { boardDb = null; }
  if (!boardDb) return;
  boardShared = true;
  boardUnsub = boardDb.collection('scores').orderBy('deaths', 'asc').limit(300).onSnapshot(snap => {
    boardRows = snap.docs.map(d => Object.assign({ id: d.id }, d.data())).filter(r => typeof r.deaths === 'number' && typeof r.time === 'number').sort(rankSort);
    if (!UI.board.hidden) renderBoard();
  }, () => { boardShared = false; boardRows = readLocalBoard().sort(rankSort); });
})();
// ghi kết quả một lần cho mỗi hành trình phá đảo
async function submitRun() {
  if (S.submitted) return;
  const row = { name: cleanName(S.name) || 'Kẻ Nhạt Phai', deaths: S.deaths, time: Math.round(S.time), level: S.level, cls: S.cls, at: Date.now() };
  S.submitted = true; S.runId = S.runId || ('r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)); save();
  const local = readLocalBoard().filter(r => r.id !== S.runId); local.push(Object.assign({ id: S.runId }, row)); writeLocalBoard(local.sort(rankSort));
  if (boardDb && boardShared) {
    try { await boardDb.collection('scores').doc(S.runId).set(row); }
    catch (e) { S.boardErr = true; toast('Không gửi được lên bảng xếp hạng chung, đã lưu trên máy này'); }
  } else boardRows = local.sort(rankSort);
}
function myRank() { const i = boardRows.findIndex(r => r.id === S.runId); return i < 0 ? null : i + 1; }
function renderBoard() {
  $('boardNote').textContent = boardShared ? 'Bảng chung của mọi người chơi. Xếp theo số lần chết, bằng nhau thì ai phá đảo nhanh hơn đứng trên.'
    : 'Bảng này chỉ lưu trên trình duyệt của bạn. Xếp theo số lần chết, bằng nhau thì ai phá đảo nhanh hơn đứng trên.';
  const body = $('boardBody');
  body.textContent = '';
  if (!boardRows.length) { const tr = document.createElement('tr'); const td = document.createElement('td'); td.colSpan = 6; td.className = 'empty'; td.textContent = 'Chưa ai phá đảo. Hãy là người đầu tiên!'; tr.appendChild(td); body.appendChild(tr); return; }
  boardRows.slice(0, 100).forEach((r, i) => {
    const tr = document.createElement('tr');
    if (r.id && r.id === S.runId) tr.className = 'me';
    const cls = (CLASSES.find(c => c.id === r.cls) || {}).name || '';
    for (const v of [i + 1, cleanName(r.name) || 'Kẻ Nhạt Phai', r.deaths, fmtTime(r.time), r.level, cls]) { const td = document.createElement('td'); td.textContent = String(v); tr.appendChild(td); }
    body.appendChild(tr);
  });
}
let boardBack = null;
function openBoard(back) {
  boardBack = back; UI.board.hidden = false; renderBoard();
  setTimeout(() => $('btnBoardClose').focus({ preventScroll: true }), 30);
}
function closeBoard() { UI.board.hidden = true; if (boardBack) boardBack(); boardBack = null; }
$('btnBoardClose').onclick = closeBoard;
$('btnBoard').onclick = () => { audioInit(); UI.title.hidden = true; openBoard(() => { UI.title.hidden = false; }); };
$('btnEndBoard').onclick = () => { UI.ending.hidden = true; openBoard(() => { UI.ending.hidden = false; }); };

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
  UI.name.hidden = true; openClassSelect();
}
let pendingName = '';
$('nameForm').addEventListener('submit', e => { e.preventDefault(); audioInit(); confirmName(); });
$('btnNameBack').onclick = () => { UI.name.hidden = true; UI.title.hidden = false; };
