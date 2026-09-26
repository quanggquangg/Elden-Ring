'use strict';
// Gravebound — Phát triển nhân vật: túi đồ, nhận vật phẩm, lên cấp, cường hóa, cửa hàng, trang bị
// ───────────────────────── túi đồ và nhận vật phẩm ─────────────────────────
function invAdd(id, n = 1) {
  const max = (ITEMDEF[id] && ITEMDEF[id].max) || 999;
  S.inv[id] = Math.min(max, (S.inv[id] || 0) + n);
}
const invN = id => S.inv[id] || 0;
const weaponHint = Wp => (Wp.hand === 'off' ? ' · trang bị tay trái tại Ân Điển' : G.touch ? ' · bấm Vũ khí để đổi' : ' · ← → để đổi vũ khí');
// nhận một gói phần thưởng: rune, vật phẩm, vũ khí, giáp, bùa, phép, tro chiến tranh, hạt vàng, Đại Ấn...
function grant(L, x = P.x, y = P.y, quiet = false) {
  const got = [];
  let big = null;
  if (L.runes) { gainRunes(L.runes, x, y); got.push('+' + L.runes.toLocaleString(numLoc()) + ' rune'); }
  for (const [id, n] of Object.entries(L.items || {})) {
    if (id === 'arrows') { S.arrows = Math.min(S.arrowMax, S.arrows + n); got.push(n + ' mũi tên'); continue; }
    invAdd(id, n); got.push(ITEMDEF[id].name + (n > 1 ? ' ×' + n : ''));
    if (ITEMDEF[id].kind === 'key') big = [ITEMDEF[id].name, ITEMDEF[id].desc];
  }
  const own = (list, id, def, tail) => {
    if (list.includes(id)) { gainRunes(500, x, y); got.push('+500 rune (đã có ' + def.name + ')'); return; }
    list.push(id); got.push(def.name); big = [def.name, def.desc + tail];
  };
  if (L.weapon) own(S.weapons, L.weapon, WEAPONS[L.weapon], weaponHint(WEAPONS[L.weapon]));
  if (L.armor) own(S.armors, L.armor, ARMORS[L.armor], ' · mặc tại Ân Điển');
  if (L.tal) own(S.tals, L.tal, TALISMANS[L.tal], ' · đeo tại Ân Điển');
  if (L.ash) own(S.ashes, L.ash, ASHES[L.ash], ' · gắn vào vũ khí tại Ân Điển');
  if (L.spirit) { S.spirits = S.spirits || []; own(S.spirits, L.spirit, SPIRITS[L.spirit], S.bell ? ' · chọn trong Túi đồ, dùng Chuông Gọi Hồn khi giao chiến' : ' · cần Chuông Gọi Hồn để dùng'); if (!S.spiritSel) S.spiritSel = L.spirit; }
  if (L.spell) {
    const had = S.spells.includes(L.spell);
    own(S.spells, L.spell, SPELLS[L.spell], ' · ghi nhớ tại Ân Điển');
    if (!had && S.att.length < S.slots) S.att.push(L.spell);
  }
  if (L.seed) {
    if (S.flaskMax < FLASK_CAP) { S.flaskMax++; P.flasks++; got.push('Hạt Vàng · bình tăng lên ' + S.flaskMax); }
    else { gainRunes(300, x, y); got.push('Hạt Vàng · bình đã tối đa, đổi thành 300 rune'); }
  }
  if (L.tear) {
    if (S.tears < TEAR_CAP) { S.tears++; got.push('Nước Mắt Thánh · bình hồi nhiều hơn (' + S.tears + '/' + TEAR_CAP + ')'); }
    else { gainRunes(500, x, y); got.push('+500 rune'); }
  }
  if (L.mem) { if (S.slots < SLOT_CAP) { S.slots++; got.push('Đá Ký Ức · ' + S.slots + ' ô phép'); } else { gainRunes(800, x, y); got.push('+800 rune'); } }
  if (L.pouch) { if (S.talSlots < TAL_CAP) { S.talSlots++; got.push('Túi Bùa · ' + S.talSlots + ' ô bùa'); } else { gainRunes(800, x, y); got.push('+800 rune'); } }
  if (L.quiver) { S.arrowMax += 20; S.arrows += 20; got.push('Ống Tên Lớn · mang tối đa ' + S.arrowMax + ' mũi tên'); }
  if (L.gr && !S.gr.includes(L.gr)) {
    S.gr.push(L.gr); applyStats(false);
    const R = GREAT_RUNES[L.gr];
    if (!quiet) {
      banner('grace', 'ĐẠI ẤN · ' + R.name, R.desc + ' · ' + S.gr.length + '/3', 5);
      if (S.gr.length === 3) later(5.2, () => subtitle('Ba Đại Ấn cộng hưởng trong lồng ngực ngươi. Cổng Kinh Thành Aurumhold đang chờ ở phương bắc.', 5));
      if (got.length) later(5.4, () => banner('item', big ? big[0] : 'Nhận được', got.join(' · '), 4));
    }
    save();
    return got;
  }
  if (!quiet && got.length) {
    if (big && got.length === 1) banner('item', big[0], big[1], 4.2);
    else banner('item', big ? big[0] : 'Nhận được', got.join(' · '), 4);
    SFX.pickup();
  }
  save();
  return got;
}

// ───────────────────────── lên cấp ─────────────────────────
function levelUp(stat) {
  const cost = levelCost();
  if (S.runes < cost || S.stats[stat] >= 99) return false;
  S.runes -= cost; S.level++; S.stats[stat]++;
  applyStats(true); save(); SFX.pickup();
  return true;
}

// ───────────────────────── cường hóa ở lò rèn ─────────────────────────
const upgradable = id => { const Wp = WEAPONS[id]; return Wp && Wp.type !== 'shield'; };
function upgradeNeed(id) {
  const next = upLv(id) + 1, Wp = WEAPONS[id];
  if (!upgradable(id) || next > maxUp(id)) return null;
  if (Wp.somber) return { lv: next, mat: next <= 2 ? 'somber1' : 'somber2', n: 1, runes: 400 * next };
  return { lv: next, mat: next <= 3 ? 'stone1' : next <= 6 ? 'stone2' : 'stone3', n: ((next - 1) % 3) + 1, runes: 150 * next };
}
function doUpgrade(id) {
  const need = upgradeNeed(id);
  if (!need || invN(need.mat) < need.n || S.runes < need.runes) return false;
  S.inv[need.mat] -= need.n; if (!S.inv[need.mat]) delete S.inv[need.mat];
  S.runes -= need.runes; S.wup[id] = need.lv;
  SFX.boom(); save();
  return true;
}

// ───────────────────────── cửa hàng ─────────────────────────
function shopRow(r) {
  let name, desc, sold = false;
  if (r.item) { name = ITEMDEF[r.item].name; desc = ITEMDEF[r.item].desc + ' · đang có ' + invN(r.item); }
  else if (r.weapon) { const Wp = WEAPONS[r.weapon]; name = Wp.name; desc = Wp.desc; sold = S.weapons.includes(r.weapon); }
  else if (r.armor) { name = ARMORS[r.armor].name; desc = ARMORS[r.armor].desc; sold = S.armors.includes(r.armor); }
  else if (r.tal) { name = TALISMANS[r.tal].name; desc = TALISMANS[r.tal].desc; sold = S.tals.includes(r.tal); }
  else if (r.spell) { const sp = SPELLS[r.spell]; name = sp.name; desc = sp.desc + ' · ' + sp.fp + ' FP · cần ' + Object.entries(sp.req).map(([k, v]) => STAT_NAME[k] + ' ' + v).join(', '); sold = S.spells.includes(r.spell); }
  else { name = r.name; desc = r.desc; sold = S.bought.includes(r.id); }
  const locked = r.req && !r.req();
  return { name, desc, sold, locked, price: r.price };
}
function buyRow(npc, i) {
  const r = SHOPS[npc].stock[i], info = shopRow(r);
  if (info.sold || info.locked || S.runes < r.price) return false;
  S.runes -= r.price;
  if (r.id) S.bought.push(r.id);
  const L = {};
  if (r.item) L.items = { [r.item]: 1 };
  for (const k of ['weapon', 'armor', 'tal', 'spell', 'quiver', 'mem']) if (r[k]) L[k] = r[k];
  grant(L, P.x, P.y, true);
  SFX.pickup(); toast('Đã mua ' + info.name);
  return true;
}

// ───────────────────────── trang bị ở Ân Điển ─────────────────────────
function setArmor(id) { if (S.armors.includes(id)) { S.armor = id; applyStats(false); save(); SFX.glint(); } }
function toggleTal(id) {
  if (!S.tals.includes(id)) return;
  if (S.tal.includes(id)) S.tal = S.tal.filter(t => t !== id);
  else if (S.tal.length < S.talSlots) S.tal.push(id);
  else { toast('Hết ô bùa (' + S.talSlots + ')'); return; }
  applyStats(false); save(); SFX.glint();
}
function toggleAttune(id) {
  if (!S.spells.includes(id)) return;
  if (S.att.includes(id)) S.att = S.att.filter(t => t !== id);
  else if (S.att.length < S.slots) S.att.push(id);
  else { toast('Hết ô phép (' + S.slots + ')'); return; }
  S.spellIdx = 0; save(); SFX.glint();
}
function setAsh(id) {
  const Wp = WEAPONS[S.equipped];
  if (Wp.unique || Wp.type !== 'melee') return;
  if (id === Wp.ash) delete S.ash[S.equipped]; else if (S.ashes.includes(id)) S.ash[S.equipped] = id;
  save(); SFX.glint();
}
function flaskAlloc(d) {
  S.flaskFp = clamp(S.flaskFp + d, 0, S.flaskMax);
  applyStats(true); save(); SFX.glint();
}
function applyClass(id) {
  const c = CLASSES.find(q => q.id === id) || CLASSES[0];
  S.cls = c.id; S.stats = Object.assign({}, c.stats); S.level = 1;
  S.weapons = [...new Set([...c.weapons, 'shield', c.off])];
  S.equipped = c.equipped; S.off = c.off; S.armor = c.armor; S.armors = [...new Set(['rags', c.armor])];
  S.spells = [...c.spells]; S.att = [...c.spells]; S.flaskFp = c.flaskFp;
  S.arrows = S.arrowMax;
}
