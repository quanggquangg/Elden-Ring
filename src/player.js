'use strict';
// Vòng Vàng Vỡ — Người chơi: di chuyển, đánh, cung, kỹ năng, phép, vật phẩm và gây sát thương
// ───────────────────────── người chơi ─────────────────────────
function toggleLock() {
  if (P.lock) { P.lock = null; return; }
  let best = null, bd = 1e9;
  for (const e of targets()) {
    const d = dist(P.x, P.y, e.x, e.y);
    if (d > 470) continue;
    const score = d + Math.abs(angDiff(P.face, Math.atan2(e.y - P.y, e.x - P.x))) * 90;
    if (score < bd) { bd = score; best = e; }
  }
  P.lock = best;
}
function aimFace(moving, mx, my) {
  if (P.lock) return Math.atan2(P.lock.y - P.y, P.lock.x - P.x);
  if (aimMode === 'mouse' && mouse.inside) return Math.atan2(mouse.wy - P.y, mouse.wx - P.x);
  let best = null, bd = WEAPONS[S.equipped].type === 'bow' ? 420 : 150;
  for (const e of targets()) { const d = dist(P.x, P.y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
  if (best) {
    const a = Math.atan2(best.y - P.y, best.x - P.x);
    if (!moving || Math.abs(angDiff(Math.atan2(my, mx), a)) < 1.2) return a;
  }
  return moving ? Math.atan2(my, mx) : P.face;
}
// điểm ngắm cho phép rơi từ trên trời, bình lửa...
function aimPoint(range = 260) {
  if (P.lock && !P.lock.dead) return [P.lock.x, P.lock.y];
  if (aimMode === 'mouse' && mouse.inside && dist(P.x, P.y, mouse.wx, mouse.wy) < 520) return [mouse.wx, mouse.wy];
  return [P.x + Math.cos(P.face) * range, P.y + Math.sin(P.face) * range];
}
// sát thương vũ khí tách theo loại, cộng thêm lửa/thánh nếu vũ khí đang được phủ
function atkParts(mul, dt) {
  const Wp = WEAPONS[S.equipped], ar = weaponAR(S.equipped) * mul * dmgBonus(), out = { [dt || Wp.dt]: ar };
  if (P.buffs.flame > 0) out.fire = (out.fire || 0) + ar * 0.3;
  if (P.buffs.holy > 0) out.holy = (out.holy || 0) + ar * 0.3;
  return out;
}
const scaleParts = (p, k) => { const o = {}; for (const t in p) o[t] = p[t] * k; return o; };
function makeAtk(kind, combo) {
  const Wp = WEAPONS[S.equipped], bl = Wp.bleed || [0, 0];
  let a;
  if (Wp.type === 'bow') {
    a = kind === 'heavy' ? { anim: 'bow', wind: 0.55, act: 0.04, rec: 0.32, mul: 1.8, poise: 26, cost: Wp.cost[1], pierce: true }
      : { anim: 'bow', wind: 0.16, act: 0.04, rec: 0.24, mul: 0.85, poise: 10, cost: Wp.cost[0] };
  } else if (kind === 'light') a = Object.assign({ cost: Wp.cost[0], bleed: bl[0], hyper: !!Wp.hyper }, Wp.light[combo]);
  else if (kind === 'heavy') a = Object.assign({ cost: Wp.cost[1], bleed: bl[1], hyper: !!Wp.hyper }, Wp.heavy);
  else a = { anim: 'slash', wind: 0.08, act: 0.14, rec: 0.3, mul: 1.15, range: 80, arc: 2.8, lunge: 0, poise: 16, swing: 1, cost: 9, bleed: bl[0] };
  let mul = a.mul;
  if (kind === 'light' && hasTal('blade')) mul *= 1.12;
  if (kind === 'heavy' && hasTal('claw')) mul *= 1.18;
  if (Wp.type === 'bow' && hasTal('arrow')) mul *= 1.2;
  return Object.assign(a, { kind, combo, maxCombo: Wp.light ? Wp.light.length - 1 : 0, parts: atkParts(mul), hits: new Set(), lunged: false });
}
function startAttack(kind, combo, moving, mx, my) {
  if (WEAPONS[S.equipped].type === 'bow' && !P.mounted && S.arrows <= 0) { toast('Hết tên. Nghỉ tại Ân Điển để lấy lại'); return; }
  P.face = aimFace(moving, mx, my);
  P.atk = makeAtk(kind, combo);
  P.st = Math.max(0, P.st - P.atk.cost); P.stDelay = 0.55;
  P.state = 'attack'; P.t = 0;
}
// kỹ năng vũ khí (Tro Chiến Tranh)
const ashOf = id => { const Wp = WEAPONS[id]; return Wp.type === 'bow' ? 'barrage' : Wp.unique ? Wp.ash : (S.ash[id] || Wp.ash); };
function startSkill(moving, mx, my) {
  const Wp = WEAPONS[S.equipped], id = ashOf(S.equipped), A = ASHES[id];
  if (P.fp < A.fp) { toast('Không đủ FP'); G.fpWarn = 1; return; }
  if (Wp.type === 'bow' && S.arrows <= 0) { toast('Hết tên'); return; }
  P.fp -= A.fp; P.face = aimFace(moving, mx, my);
  if (id === 'flame' || id === 'holy') {
    P.buffs[id] = 30; P.state = 'cast'; P.t = 0; P.cast = true; P.spell = null;
    burst(P.x, P.y, 24, id === 'flame' ? '#ff9a4a' : '#ffe08a', 120, 3, 'mote', 0.8); SFX.spell();
    toast(A.name + ': vũ khí được phủ ' + (id === 'flame' ? 'lửa' : 'ánh thánh'));
    return;
  }
  const bl = Wp.bleed || [0, 0], M = {
    lunge: { anim: 'dash', wind: 0.2, act: 0.18, rec: 0.4, mul: 1.6, range: 80, arc: 0.9, lunge: 0, dashSpeed: 850, poise: 40, thrust: true },
    whirl: { anim: 'spin', wind: 0.18, act: 0.5, rec: 0.4, mul: 1.3, range: Math.max(80, (Wp.light ? Wp.light[0].range : 70) + 10), arc: TAU, lunge: 60, poise: 30, turns: 2 },
    quake: { anim: 'overhead', wind: 0.6, act: 0.15, rec: 0.55, mul: 2.0, range: 90, arc: 1.2, off: 60, r: 110, lunge: 120, quake: true, ring: true, poise: 90, shake: 12 },
    unsheathe: { anim: 'dash', wind: 0.45, act: 0.12, rec: 0.35, mul: 2.2, range: 90, arc: 1.6, lunge: 0, dashSpeed: 1100, poise: 50, swing: -1, bleed: bl[1] * 2 },
    wave: { anim: 'slash', wind: 0.32, act: 0.12, rec: 0.45, mul: 1.1, range: 80, arc: 2.2, lunge: 120, poise: 26, swing: 1, wave: 'gwave', waveMul: 1.4, waveDt: 'holy' },
    crystal: { anim: 'slash', wind: 0.32, act: 0.12, rec: 0.45, mul: 1.1, range: 80, arc: 2.2, lunge: 120, poise: 26, swing: 1, wave: 'cwave', waveMul: 1.35, waveDt: 'magic' },
    barrage: { anim: 'bow', wind: 0.3, act: 0.04, rec: 0.36, mul: 0.7, poise: 10, barrage: 5 },
  }[id];
  const a = Object.assign({ cost: 10, bleed: bl[0], hyper: true }, M);
  let mul = a.mul;
  if (Wp.type === 'bow' && hasTal('arrow')) mul *= 1.2;
  P.atk = Object.assign(a, { kind: 'skill', combo: 0, maxCombo: 0, parts: atkParts(mul), hits: new Set(), lunged: false });
  if (a.waveDt) P.atk.waveParts = scaleParts(atkParts(a.waveMul, a.waveDt), 1);
  P.st = Math.max(0, P.st - 10); P.stDelay = 0.55; P.state = 'attack'; P.t = 0;
  floatText(P.x, P.y - 34, A.name, '#bcd6ff');
}
// ───────────────────────── phép thuật ─────────────────────────
function attunedFor(cat) { const sch = cat.type === 'staff' ? 'sorc' : 'incant'; return S.att.filter(id => SPELLS[id].school === sch); }
function curSpell() {
  const cat = catalyst();
  if (!S.att.length) return null;
  const id = S.att[S.spellIdx % S.att.length];
  if (!cat) return id;
  const list = attunedFor(cat);
  return list.includes(id) ? id : list[0] || null;
}
function spellMul(school) {
  let k = spellPower(S.off) / 100 * dmgBonus() * (hasGR('west') ? 1.08 : 1);
  if (school === 'sorc') k *= 1 + (hasTal('star') ? 0.15 : 0) + armorBonus('sorc');
  else k *= 1 + (hasTal('sun') ? 0.15 : 0) + armorBonus('incant');
  return k;
}
function startSpell(moving, mx, my) {
  const cat = catalyst();
  if (!cat) return;
  const id = curSpell();
  if (!id) { toast(cat.type === 'staff' ? 'Chưa ghi nhớ phép Trí Tuệ nào' : 'Chưa ghi nhớ phép Đức Tin nào'); return; }
  const sp = SPELLS[id];
  if (!reqMet(sp.req)) { toast('Không đủ chỉ số để dùng ' + sp.name); return; }
  if (P.fp < sp.fp) { toast('Không đủ FP'); G.fpWarn = 1; return; }
  P.fp -= sp.fp; P.state = 'cast'; P.t = 0; P.cast = false; P.spell = id; P.face = aimFace(moving, mx, my);
}
function castSpell(id) {
  const sp = SPELLS[id], a = P.face, base = 22 * spellMul(sp.school), hx = P.x + Math.cos(a) * 20, hy = P.y + Math.sin(a) * 20;
  const shoot = (ang, speed, r, kind, dt, mul, o = {}) => projs.push(Object.assign({ x: hx, y: hy, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, r, kind, friendly: true, life: 1.6, parts: { [dt]: base * mul }, poise: 18 }, o));
  switch (id) {
    case 'pebble': shoot(a, 560, 7, 'glint', 'magic', sp.mul); SFX.spell(); break;
    case 'shard': for (let i = -1; i <= 1; i++) shoot(a + i * 0.16, 520, 6, 'shard', 'magic', sp.mul); SFX.spell(); break;
    case 'comet': shoot(a, 720, 14, 'comet', 'magic', sp.mul, { pierce: true, hits: new Set(), poise: 60, life: 1.3 }); SFX.spell(); shake(4); break;
    case 'bolt': shoot(a, 920, 6, 'bolt', 'light', sp.mul, { life: 0.9 }); tone(1800, 0.2, 'sawtooth', 0.05, -1200); noise(0.2, 0.2, 3000, 2); break;
    case 'blade': {
      for (const e of targets()) if (inArc(P.x, P.y, a, 118, 2.4, e.x, e.y, e.r) && (e.z || 0) < 30) hitEnemy(e, { magic: base * sp.mul }, 45, P.x, P.y, 'spell');
      aoes.push({ kind: 'arc', x: P.x, y: P.y, face: a, r: 110, t: 0, dur: 0.3, col: '170,210,255' }); SFX.heavy(); SFX.spell();
      break;
    }
    case 'meteor': {
      const [tx, ty] = aimPoint();
      for (let i = 0; i < 5; i++) { const an = rand(0, TAU), rr = i ? rand(30, 110) : 0; aoes.push({ kind: 'delayed', friendly: true, x: tx + Math.cos(an) * rr, y: ty + Math.sin(an) * rr, r: 60, delay: 0.55 + i * 0.14, parts: { magic: base * sp.mul }, poise: 30, t: 0, col: 'magic' }); }
      SFX.spell(); break;
    }
    case 'heal': {
      const amt = Math.round(spellPower(S.off) * 0.95 * (1 + armorBonus('heal')));
      P.hp = Math.min(P.maxHp, P.hp + amt); P.ghost = Math.max(P.ghost, P.hp);
      burst(P.x, P.y, 30, '#ffe39a', 90, 3, 'mote', 1); floatText(P.x, P.y - 28, '+' + amt, '#ffe39a'); SFX.grace();
      break;
    }
    case 'flame': P.flameT = 0.6; P.flameAcc = 0; SFX.fire(0.6); break;
    case 'bless': P.buffs.bless = 40; burst(P.x, P.y, 34, '#ffe08a', 120, 3, 'mote', 1.1); SFX.grace(); toast('Phúc Lành Vàng: sát thương +15%'); break;
    case 'judge': {
      for (let i = 0; i < 8; i++) { const an = i / 8 * TAU; aoes.push({ kind: 'delayed', friendly: true, x: P.x + Math.cos(an) * 120, y: P.y + Math.sin(an) * 120, r: 60, delay: 0.45 + (i % 2) * 0.12, parts: { holy: base * sp.mul }, poise: 30, t: 0 }); }
      aoes.push({ kind: 'flash', x: P.x, y: P.y, r: 60, t: 0, dur: 0.35 }); SFX.spell(); break;
    }
  }
}
// ───────────────────────── vật phẩm dùng nhanh ─────────────────────────
function quickList() { return ['flask', 'fpflask', ...USE_ORDER.filter(id => (S.inv[id] || 0) > 0)]; }
function curQuick() { const l = quickList(); return l[S.quick % l.length]; }
function useQuick(moving, mx, my) {
  const q = curQuick();
  if (q === 'flask' || q === 'fpflask') {
    if (P.mounted) { toast('Xuống ngựa để uống bình'); return; }
    const fp = q === 'fpflask';
    if ((fp ? P.fpflasks : P.flasks) <= 0) { toast(fp ? 'Bình FP đã cạn' : 'Bình Máu đã cạn'); return; }
    if (fp) P.fpflasks--; else P.flasks--;
    P.state = 'drink'; P.t = 0; P.drank = false; P.drinkFp = fp; SFX.drink();
    return;
  }
  if (P.mounted) { toast('Xuống ngựa để dùng đồ'); return; }
  S.inv[q] = (S.inv[q] || 0) - 1;
  P.face = aimFace(moving, mx, my);
  const a = P.face;
  switch (q) {
    case 'firepot': {
      const [tx, ty] = aimPoint(220), dd = Math.min(360, dist(P.x, P.y, tx, ty)), ex = P.x + Math.cos(a) * dd, ey = P.y + Math.sin(a) * dd;
      const life = Math.max(0.2, dd / 420);
      projs.push({ x: P.x, y: P.y, vx: Math.cos(a) * dd / life, vy: Math.sin(a) * dd / life, r: 8, kind: 'fireball', friendly: true, life, boom: 70, parts: { fire: 85 }, poise: 40 });
      addMark(ex, ey, 70, life); P.state = 'throw'; P.t = 0; SFX.swing();
      break;
    }
    case 'knife': projs.push({ x: P.x + Math.cos(a) * 16, y: P.y + Math.sin(a) * 16, vx: Math.cos(a) * 720, vy: Math.sin(a) * 720, r: 5, kind: 'knife', friendly: true, life: 0.8, parts: { phys: 34 }, poise: 6 }); P.state = 'throw'; P.t = 0.15; SFX.swing(); break;
    case 'cure': P.poisonB = 0; P.poisonT = 0; burst(P.x, P.y, 16, '#9fd05a', 60, 3, 'mote', 0.8); toast('Đã giải độc'); SFX.drink(); break;
    case 'grease': P.buffs.holy = 40; burst(P.x, P.y, 18, '#ffe08a', 70, 3, 'mote', 0.8); toast('Vũ khí được phủ Dầu Thánh'); SFX.glint(); break;
    case 'grune1': case 'grune2': { const n = q === 'grune1' ? 400 : 1500; gainRunes(n, P.x, P.y); toast('+' + n + ' rune'); SFX.pickup(); break; }
  }
  if (!S.inv[q]) delete S.inv[q];
}
function equip(id) {
  if (!S.weapons.includes(id)) { toast('Chưa có vũ khí này'); return false; }
  const Wp = WEAPONS[id];
  if (Wp.hand === 'off') return equipOff(id);
  if (S.equipped !== id) {
    S.equipped = id; SFX.glint(); save();
    toast('Tay phải: ' + Wp.name + (reqMet(Wp.req) ? '' : ' (thiếu chỉ số!)') + (Wp.twoHanded && offDef().type !== 'shield' ? ' · tay trái bị khóa' : ''));
  }
  return true;
}
function equipOff(id) {
  if (!S.weapons.includes(id)) return false;
  if (S.off !== id) { S.off = id; SFX.glint(); save(); toast('Tay trái: ' + WEAPONS[id].name); }
  return true;
}
function ownedRight() { return WEAPON_ORDER.filter(w => S.weapons.includes(w)); }
function equipKey(a) {
  const own = ownedRight();
  if (a === 'eqnext') equip(own[(own.indexOf(S.equipped) + 1) % own.length]);
  else if (a === 'eqprev') equip(own[(own.indexOf(S.equipped) - 1 + own.length) % own.length]);
  else if (own[+a.slice(2) - 1]) equip(own[+a.slice(2) - 1]);
}
function cycleQuick() { const l = quickList(); S.quick = (S.quick + 1) % l.length; const q = l[S.quick]; toast(q === 'flask' ? 'Bình Máu' : q === 'fpflask' ? 'Bình FP' : ITEMDEF[q].name + ' ×' + S.inv[q]); SFX.glint(); }
function cycleSpell() {
  if (!S.att.length) { toast('Chưa ghi nhớ phép nào. Ghi nhớ tại Ân Điển.'); return; }
  S.spellIdx = (S.spellIdx + 1) % S.att.length; toast('Phép: ' + SPELLS[S.att[S.spellIdx]].name); SFX.glint();
}
function doAction(a, moving, mx, my) {
  switch (a) {
    case 'roll': {
      if (P.mounted || P.st <= 0) return;
      const rt = rollType();
      if (rt === 'over') { toast('Quá tải! Không thể lăn'); return; }
      P.roll = ROLLS[rt];
      P.st = Math.max(0, P.st - P.roll.st); P.stDelay = 0.5; P.state = 'roll'; P.t = 0;
      P.rollDir = moving ? Math.atan2(my, mx) : P.face + Math.PI; SFX.roll();
      break;
    }
    case 'light': case 'heavy':
      if (P.st <= 0) return;
      startAttack(P.mounted ? 'mounted' : a, 0, moving, mx, my);
      break;
    case 'skill': if (!P.mounted && P.st > 0) startSkill(moving, mx, my); break;
    case 'spell': if (!P.mounted) startSpell(moving, mx, my); break;
    case 'item': useQuick(moving, mx, my); break;
    case 'interact': interact(); break;
    case 'mount': toggleMount(); break;
  }
}
function toggleMount() {
  if (P.mounted) { P.mounted = false; P.state = 'mount'; P.t = 0; burst(P.x, P.y, 16, '#9fd0ff', 60, 3, 'dot', 0.6); return; }
  if (inArena(P.x, P.y) || G.bossFight || G.colo.active || G.finalFight || G.dfight || P.x > 4800 || inRect(P.x, P.y, FORT) || inRect(P.x, P.y, ACAD) || inRect(P.x, P.y, CAPITAL)) { toast('Không thể gọi ngựa ở đây'); return; }
  P.mounted = true; P.state = 'mount'; P.t = 0; P.lock = null; SFX.whistle();
  burst(P.x, P.y, 26, '#9fd0ff', 90, 3.5, 'dot', 0.8);
}
function fireArrow(A, ang, mul = 1) {
  const Wp = WEAPONS[S.equipped], sp = (Wp.speed || 640) * (A.pierce ? 1.25 : 1);
  S.arrows = Math.max(0, S.arrows - 1);
  projs.push({ x: P.x + Math.cos(ang) * 18, y: P.y + Math.sin(ang) * 18, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: 5, kind: 'parrow', friendly: true, life: (Wp.range || 0.8) * (A.pierce ? 1.2 : 1),
    parts: scaleParts(A.parts, mul), poise: A.poise, akind: 'arrow', pierce: A.pierce, hits: A.pierce ? new Set() : null });
}
function desiredFace(moving, mx, my, dt) {
  let target = P.face;
  if (P.lock) target = Math.atan2(P.lock.y - P.y, P.lock.x - P.x);
  else if (aimMode === 'mouse' && mouse.inside && !P.mounted) target = Math.atan2(mouse.wy - P.y, mouse.wx - P.x);
  else if (moving) target = Math.atan2(my, mx);
  return turn(P.face, target, 16 * dt);
}
function updatePlayer(dt) {
  const p = P;
  if (p.state === 'dead') return;
  p.t += dt;
  if (p.invuln > 0) p.invuln -= dt;
  for (const k in p.buffs) if (p.buffs[k] > 0) p.buffs[k] = Math.max(0, p.buffs[k] - dt);
  if (p.buffs.bless > 0) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.006 * dt);
  if (p.ghostDelay > 0) p.ghostDelay -= dt; else p.ghost = Math.max(p.hp, p.ghost - p.maxHp * 0.5 * dt);
  if (p.ghost < p.hp) p.ghost = p.hp;
  p.fp = Math.min(p.maxFp, p.fp + 4 * (1 + armorBonus('fpRegen')) * dt);
  const pooled = !p.mounted && (inPool(p.x, p.y) || puddles.some(q => dist(q.x, q.y, p.x, p.y) < q.r));
  if (pooled) {
    p.poisonB += 42 * dt;
    if (Math.random() < dt * 12) addPart(p.x + rand(-10, 10), p.y + rand(-6, 6), 0, rand(-30, -10), 0.5, rand(2, 3.5), '#b58ac4');
  } else p.poisonB = Math.max(0, p.poisonB - 12 * dt);
  if (p.poisonB >= 100) { p.poisonB = 0; p.poisonT = 14; toast('Trúng độc!'); SFX.poison(); }
  if (p.poisonT > 0) {
    p.poisonT -= dt; p.hp -= 4.5 * dt; p.ghostDelay = 0.3;
    if (Math.random() < dt * 6) addPart(p.x + rand(-8, 8), p.y + rand(-8, 8), 0, -25, 0.8, 2.5, '#a86fc0');
    if (p.hp <= 0) { p.hp = 0; die(); return; }
  }
  const wet = inWater(p.x, p.y);
  if (wet && (p.mvx || p.mvy) && Math.random() < dt * 10) addPart(p.x + rand(-10, 10), p.y + rand(4, 8), rand(-20, 20), rand(-20, -5), 0.4, rand(2, 3), 'rgba(200,230,245,.7)');
  const rt = rollType(), slow = (pooled ? 0.7 : 1) * (wet ? (p.mounted ? 0.75 : 0.62) : 1) * (rt === 'over' ? 0.6 : rt === 'heavy' ? 0.9 : 1);
  if (p.stDelay > 0) p.stDelay -= dt;
  else if (p.state !== 'roll' && p.state !== 'attack') p.st = Math.min(p.maxSt, p.st + (p.state === 'drink' || p.state === 'guard' ? 16 : p.mounted ? 55 : 42) * (1 + armorBonus('stRegen')) * dt);
  const ox = p.x, oy = p.y;
  if (p.vx || p.vy) {
    moveCircle(p, p.vx * dt, p.vy * dt, false);
    const f = Math.exp(-10 * dt); p.vx *= f; p.vy *= f;
    if (Math.abs(p.vx) < 2) p.vx = 0; if (Math.abs(p.vy) < 2) p.vy = 0;
  }
  let [mx, my] = moveInput();
  const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
  const moving = ml > 0.15;
  if (p.lock && (p.lock.dead || dist(p.x, p.y, p.lock.x, p.lock.y) > 620 || (p.lock.isBoss && !G.bossFight))) p.lock = null;
  // phun lửa của Lửa Thiêng kéo dài một chút sau khi niệm
  if (p.flameT > 0) {
    p.flameT -= dt; p.flameAcc += dt;
    const a = p.face, base = 22 * spellMul('incant') * SPELLS.flame.mul;
    for (let i = 0; i < 3; i++) { const aa = a + rand(-0.45, 0.45), sp = rand(260, 420); addPart(p.x + Math.cos(a) * 16, p.y + Math.sin(a) * 16, Math.cos(aa) * sp, Math.sin(aa) * sp, rand(0.3, 0.4), rand(4, 8), FIRE_COLS[(Math.random() * 4) | 0], 'fire'); }
    if (p.flameAcc >= 0.12) { p.flameAcc -= 0.12; for (const e of targets()) if (inArc(p.x, p.y, a, 135, 1.0, e.x, e.y, e.r)) hitEnemy(e, { fire: base }, 8, p.x, p.y, 'spell', { quiet: true }); }
  }

  if (p.state === 'idle') {
    const sprint = !p.mounted && sprintHeld() && moving && p.st > 1 && rt !== 'over';
    const spd = (p.mounted ? 320 : sprint ? 215 : 145) * slow;
    if (moving) {
      moveCircle(p, mx * spd * dt, my * spd * dt, false);
      p.walk += dt * spd / 55;
      if (sprint) { p.st -= 18 * dt; p.stDelay = 0.35; }
      if (p.mounted && Math.random() < dt * 22) addPart(p.x - mx * 20 + rand(-6, 6), p.y - my * 20 + rand(-6, 6), rand(-10, 10), rand(-10, 10), 0.6, rand(3, 6), 'rgba(120,105,80,.5)', 'dot');
    }
    p.face = desiredFace(moving, mx, my, dt);
    const a = takeBuf();
    if (a) doAction(a, moving, mx, my);
    // tay trái cầm gậy / ấn: giữ nút đỡ để niệm phép liên tục (như Elden Ring); cầm khiên: đỡ đòn
    if (p.state === 'idle' && !p.mounted && guardHeld()) {
      if (catalyst()) { if (p.fp >= 1) doAction('spell', moving, mx, my); }
      else { p.state = 'guard'; p.t = 0; p.parryOk = !twoHanded() && offDef().type === 'shield' && G.clock - p.lastGuardAt > 0.45; p.lastGuardAt = G.clock; }
    }
  } else if (p.state === 'guard') {
    if (moving) moveCircle(p, mx * 75 * slow * dt, my * 75 * slow * dt, false);
    p.face = desiredFace(moving, mx, my, dt);
    const a = peekBuf();
    if (a === 'roll' || a === 'light' || a === 'heavy' || a === 'skill' || a === 'item') { takeBuf(); p.state = 'idle'; doAction(a, moving, mx, my); }
    else if (!guardHeld()) { p.state = 'idle'; p.t = 0; }
  } else if (p.state === 'roll') {
    const R = p.roll, k = p.t / R.dur, spd = k < 0.7 ? R.speed * (1 - k * 0.6) : 90;
    moveCircle(p, Math.cos(p.rollDir) * spd * slow * dt, Math.sin(p.rollDir) * spd * slow * dt, false);
    if (Math.random() < dt * 30) addPart(p.x + rand(-5, 5), p.y + rand(-5, 5), 0, 0, 0.4, rand(3, 5), wet ? 'rgba(200,230,245,.6)' : 'rgba(110,98,74,.45)');
    if (p.t >= R.dur) { p.state = 'idle'; p.t = 0; }
    else if (p.t > R.dur * 0.72) {
      const a = peekBuf();
      if (a === 'light' || a === 'heavy' || a === 'roll') { takeBuf(); p.state = 'idle'; doAction(a, moving, mx, my); }
    }
  } else if (p.state === 'attack') {
    const A = p.atk, t = p.t;
    if (t < A.wind) {
      if (p.lock) p.face = turn(p.face, Math.atan2(p.lock.y - p.y, p.lock.x - p.x), 10 * dt);
      else if (A.anim === 'bow' && aimMode === 'mouse' && mouse.inside) p.face = turn(p.face, Math.atan2(mouse.wy - p.y, mouse.wx - p.x), 12 * dt);
    } else if (t < A.wind + A.act) {
      if (!A.lunged) {
        A.lunged = true;
        if (A.anim === 'bow') {
          if (A.barrage) { for (let i = 0; i < A.barrage; i++) fireArrow(A, p.face + (i - (A.barrage - 1) / 2) * 0.12); S.arrows = Math.max(0, S.arrows + A.barrage - 3); }
          else fireArrow(A, p.face);
          noise(0.12, 0.14, 2600, 1.5); if (A.pierce) tone(900, 0.12, 'triangle', 0.04, -300);
        } else {
          p.vx += Math.cos(p.face) * A.lunge; p.vy += Math.sin(p.face) * A.lunge;
          if (A.kind === 'heavy' || A.kind === 'skill') SFX.heavy(); else SFX.swing();
          revealIllusory(p, A);
        }
        if (A.anim === 'dash') { A.sx = p.x; A.sy = p.y; noise(0.2, 0.15, 3000, 1); }
        if (A.anim === 'overhead') {
          A.ix = p.x + Math.cos(p.face) * A.off; A.iy = p.y + Math.sin(p.face) * A.off;
          aoes.push({ kind: 'flash', x: A.ix, y: A.iy, r: A.r, t: 0, dur: 0.3, col: 'dust' });
          burst(A.ix, A.iy, A.quake ? 36 : 14, 'rgba(150,130,100,.7)', A.quake ? 240 : 140, 4, 'dot', 0.6);
          shake(A.shake || 4); if (A.quake || A.r > 70) SFX.boom();
          if (A.ring) aoes.push({ kind: 'pring', x: A.ix, y: A.iy, r0: A.r, r1: A.r + 150, dur: 0.45, t: 0, parts: scaleParts(A.parts, 0.45), hits: new Set() });
        }
        const wave = A.wave === true ? 'gwave' : A.wave;
        if (wave) {
          const parts = A.waveParts || scaleParts(A.parts, 0.6);
          projs.push({ x: p.x + Math.cos(p.face) * 30, y: p.y + Math.sin(p.face) * 30, vx: Math.cos(p.face) * 460, vy: Math.sin(p.face) * 460, r: 12, parts, poise: 20, kind: wave, friendly: true, life: 0.6, pierce: true, hits: new Set() });
          SFX.spell();
        }
      }
      if (A.anim === 'dash') {
        moveCircle(p, Math.cos(p.face) * A.dashSpeed * dt, Math.sin(p.face) * A.dashSpeed * dt, false);
        addPart(p.x, p.y, 0, 0, 0.3, 7, 'rgba(255,240,200,.3)');
      }
      if (A.anim !== 'bow') for (const e of targets()) {
        if (A.hits.has(e) || (e.z || 0) > 30) continue;
        const hit = A.anim === 'overhead' ? dist(A.ix, A.iy, e.x, e.y) < A.r + e.r || inArc(p.x, p.y, p.face, A.range * 0.7, A.arc, e.x, e.y, e.r)
          : A.anim === 'spin' ? dist(p.x, p.y, e.x, e.y) < A.range + e.r
          : inArc(p.x, p.y, p.face, A.range, A.arc, e.x, e.y, e.r);
        if (hit) {
          A.hits.add(e);
          const back = !e.isBoss && !e.isDragon && !e.isFinal && !e.T.miniboss && A.kind !== 'mounted' && e.state !== 'atk' && e.state !== 'broken' && dist(p.x, p.y, e.x, e.y) < e.r + p.r + 34 &&
            Math.abs(angDiff(e.face, Math.atan2(p.y - e.y, p.x - e.x))) > 2.2;
          hitEnemy(e, A.parts, A.poise, p.x, p.y, A.kind === 'skill' ? 'heavy' : A.kind, { backstab: back, bleed: A.bleed });
        }
      }
    } else {
      if (t > A.wind + A.act + A.rec * 0.35) {
        const a = peekBuf();
        if (a === 'light' && A.kind === 'light' && A.combo < A.maxCombo && !p.mounted) { takeBuf(); startAttack('light', A.combo + 1, moving, mx, my); return; }
        if (a === 'roll' || a === 'heavy' || a === 'light' || a === 'item' || a === 'skill' || a === 'spell') { takeBuf(); p.state = 'idle'; p.atk = null; doAction(a, moving, mx, my); return; }
      }
      if (t >= A.wind + A.act + A.rec) { p.state = 'idle'; p.t = 0; p.atk = null; }
    }
    if (p.mounted && moving) moveCircle(p, mx * 220 * dt, my * 220 * dt, false);
    else if (A.anim === 'bow' && moving) moveCircle(p, mx * 60 * slow * dt, my * 60 * slow * dt, false);
  } else if (p.state === 'cast') {
    const sp = p.spell ? SPELLS[p.spell] : null, castT = sp ? sp.cast : 0.1, recT = sp ? sp.rec : 0.35;
    if (moving) moveCircle(p, mx * 50 * slow * dt, my * 50 * slow * dt, false);
    if (p.lock && !p.cast) p.face = turn(p.face, Math.atan2(p.lock.y - p.y, p.lock.x - p.x), 10 * dt);
    else if (aimMode === 'mouse' && mouse.inside && !p.cast) p.face = turn(p.face, Math.atan2(mouse.wy - p.y, mouse.wx - p.x), 12 * dt);
    if (!p.cast && p.t >= castT) { p.cast = true; castSpell(p.spell); }
    if (p.t >= castT + recT) { p.state = 'idle'; p.t = 0; }
  } else if (p.state === 'throw') {
    if (p.t >= 0.4) { p.state = 'idle'; p.t = 0; }
  } else if (p.state === 'drink') {
    if (moving) moveCircle(p, mx * 55 * slow * dt, my * 55 * slow * dt, false);
    if (!p.drank && p.t >= 0.6) {
      p.drank = true;
      if (p.drinkFp) { const n = fpFlaskAmt(); p.fp = Math.min(p.maxFp, p.fp + n); burst(p.x, p.y, 22, '#6a9aff', 70, 3, 'dot', 0.8); floatText(p.x, p.y - 26, '+' + n + ' FP', '#9fc0ff'); }
      else { const heal = flaskHeal(); p.hp = Math.min(p.maxHp, p.hp + heal); p.ghost = Math.max(p.ghost, p.hp); burst(p.x, p.y, 22, '#ff6a5a', 70, 3, 'dot', 0.8); floatText(p.x, p.y - 26, '+' + heal, '#ff8f80'); }
    }
    if (p.t >= 1.0) { p.state = 'idle'; p.t = 0; }
  } else if (p.state === 'hurt') {
    if (p.t >= p.hurtDur) { p.state = 'idle'; p.t = 0; }
  } else if (p.state === 'mount') {
    if (p.t >= 0.3) { p.state = 'idle'; p.t = 0; }
  }
  p.mvx = (p.x - ox) / dt; p.mvy = (p.y - oy) / dt;
}
function hurtPlayer(dmg, fx, fy, heavy, src = null, kind = 'melee', dt = 'phys') {
  const p = P;
  if (p.state === 'dead' || p.invuln > 0 || G.mode !== 'play') return false;
  dmg *= DIFF.dmg * regionMul(P.x, P.y) * absorb(dt) * (src && src.dm ? src.dm : 1);
  if (p.state === 'roll' && p.t > p.roll.iframe[0] && p.t < p.roll.iframe[1]) return false; // khung bất tử khi lăn
  const from = Math.atan2(fy - p.y, fx - p.x);
  if (p.state === 'guard' && (dist(fx, fy, p.x, p.y) < 4 || Math.abs(angDiff(p.face, from)) < 1.5)) {
    // cầm khiên: chặn tốt và phản đòn được; cầm vũ khí hai tay: đỡ bằng thân vũ khí, chặn kém và không phản đòn được
    const th = twoHanded(), gd = th ? { chip: 2.2, st: 1.45 } : offDef().guard || { chip: 2.2, st: 1.45 }, gt = hasTal('guard') ? 0.65 : 1;
    if (!th && offDef().type === 'shield' && kind === 'melee' && src && !src.noParry && p.parryOk && p.t < 0.22) { parry(src); return false; }
    const chip = Math.round(dmg * (kind === 'melee' ? (heavy ? 0.3 : 0.15) : kind === 'proj' ? 0.2 : 0.5) * gd.chip * gt);
    p.hp -= chip; p.ghostDelay = 0.6; p.st -= dmg * 0.9 * gd.st * gt; p.stDelay = 0.7;
    SFX.block(); shake(3); if (kind !== 'fire') G.hitStop = 0.04;
    burst(p.x + Math.cos(p.face) * 14, p.y + Math.sin(p.face) * 14, 8, '#fff1c4', 200, 2, 'spark', 0.25, p.face);
    p.vx -= Math.cos(from) * 120; p.vy -= Math.sin(from) * 120;
    p.invuln = kind === 'fire' ? 0.15 : 0.25;
    if (p.st <= 0) { p.st = 0; p.state = 'hurt'; p.t = 0; p.hurtDur = 0.9; floatText(p.x, p.y - 30, 'VỠ THẾ ĐỠ', '#f0a58f', true); }
    if (p.hp <= 0) { p.hp = 0; die(); }
    return true;
  }
  dmg = Math.round(dmg * rand(0.95, 1.05));
  p.hp -= dmg; p.ghostDelay = 0.6;
  const a = Math.atan2(p.y - fy, p.x - fx);
  if (kind === 'fire') {
    p.invuln = 0.15; G.flash = Math.max(G.flash, 0.2);
    burst(p.x, p.y, 6, '#ff9a4a', 90, 3, 'dot', 0.4);
    if (p.hp <= 0) { p.hp = 0; die(); }
    return true;
  }
  // đòn nhẹ hơn độ trụ của giáp không làm khựng; vũ khí nặng có siêu giáp khi đang vung
  const hyper = (p.state === 'attack' && p.atk && p.atk.hyper && p.t < p.atk.wind + p.atk.act) || (!heavy && dmg < armorDef().poise);
  SFX.hurt(); shake(heavy ? 9 : 5); G.hitStop = 0.06; G.flash = 0.35;
  burst(p.x, p.y, 12, '#8e1512', 150, 3, 'dot', 0.5, a);
  if (!hyper) {
    p.vx += Math.cos(a) * (heavy ? 360 : 220); p.vy += Math.sin(a) * (heavy ? 360 : 220);
    if (p.mounted && (heavy || dmg >= 40)) { p.mounted = false; toast('Bị hất khỏi ngựa!'); }
    p.state = 'hurt'; p.t = 0; p.hurtDur = heavy ? 0.55 : 0.3; p.atk = null; p.flameT = 0;
  }
  p.invuln = 0.4;
  if (p.hp <= 0) { p.hp = 0; die(); }
  return true;
}
function revealIllusory(p, A) {
  for (const w of wallsNear(p.x, p.y, 140)) {
    if (!w.illusory || S.illusory.includes(w.illusory)) continue;
    const nx = clamp(p.x, w.x, w.x + w.w), ny = clamp(p.y, w.y, w.y + w.h);
    if (dist(p.x, p.y, nx, ny) < (A.range || 60) && Math.abs(angDiff(p.face, Math.atan2(ny - p.y, nx - p.x))) < (A.arc || 1) / 2 + 0.3) {
      S.illusory.push(w.illusory);
      for (let k = 0; k < 30; k++) addPart(w.x + Math.random() * w.w, w.y + Math.random() * w.h, rand(-20, 20), rand(-40, -10), rand(0.6, 1.2), rand(2, 4), '#d8d0bc', 'mote');
      tone(700, 0.6, 'sine', 0.06, -400); toast('Bức tường ảo đã biến mất!'); save();
    }
  }
}
function parry(src) {
  const p = P;
  src.state = 'broken'; src.t = 0; src.atk = null; src.poiseAcc = 0; if (src.z) src.z = 0;
  SFX.parry(); G.hitStop = 0.14; shake(6);
  const mx = (p.x + src.x) / 2, my = (p.y + src.y) / 2;
  burst(mx, my, 18, '#fff1c4', 280, 2.5, 'spark', 0.3);
  addPart(mx, my - 6, 0, 0, 0.4, 18, '#fff6d8', 'glint');
  floatText(p.x, p.y - 34, 'PHẢN ĐÒN', '#f2dc97', true);
  p.st = Math.min(p.maxSt, p.st + 10);
}
function die() {
  P.state = 'dead'; P.lock = null; P.mounted = false; G.mode = 'dead'; G.deathT = 0; S.deaths++; P.flameT = 0;
  SFX.death();
  S.lost = S.runes > 0 ? { x: P.x, y: P.y, amount: S.runes } : null;
  S.runes = 0; G.bossFight = false; G.dragonFight = false; G.colo.active = false; G.finalFight = false; G.dfight = null;
  save();
}
function respawnAt(id) {
  const g = GRACES.find(q => q.id === id) || GRACES[0];
  P.x = g.x; P.y = g.y + 46; P.vx = P.vy = 0; P.state = 'idle'; P.t = 0; P.mounted = false; P.lock = null; P.atk = null; P.face = -Math.PI / 2; P.invuln = 0; P.flameT = 0;
  for (const k in P.buffs) P.buffs[k] = 0;
  applyStats(true); spawnEnemies();
  boss = !S.bossDead ? makeBoss(1) : !S.boss2Dead ? makeBoss(2) : null;
  dragon = S.dragonDead ? null : makeDragon(); G.dragonFight = false;
  fb = null; G.finalFight = false;
  G.bossFight = false; cam.x = P.x; cam.y = P.y; clampCam(); G.fade = 1; buf = null;
}

// ───────────────────────── gây sát thương cho kẻ địch ─────────────────────────
const resOf = (e, t) => { const R = (e.T && e.T.res) || e.res; return R && R[t] !== undefined ? R[t] : 1; };
function sumParts(e, parts) { let s = 0; for (const t in parts) s += parts[t] * resOf(e, t); return s; }
function hitEnemy(e, dmgIn, poise, fx, fy, kind, opt = {}) {
  if (e.dead || (e.invuln || 0) > 0) return;
  let dmg = typeof dmgIn === 'number' ? dmgIn : sumParts(e, dmgIn), crit = false;
  const label = e.state === 'broken' ? 'CHÍ MẠNG' : opt.backstab ? 'ĐÂM LƯNG' : '';
  if (label && kind !== 'spell' && kind !== 'arrow') { dmg *= (e.state === 'broken' ? 3.5 : 3) * (WEAPONS[S.equipped].crit || 1); crit = true; }
  if (e.T && e.T.shield && !crit && kind !== 'spell' && e.state !== 'atk' && e.state !== 'broken' && e.state !== 'stagger' &&
      Math.abs(angDiff(e.face, Math.atan2(fy - e.y, fx - e.x))) < 1.2) {
    if (kind === 'heavy') { dmg *= 0.6; poise *= 1.5; }
    else {
      dmg *= 0.15; poise *= 0.6; SFX.block();
      burst(e.x + Math.cos(e.face) * 14, e.y + Math.sin(e.face) * 14, 8, '#fff1c4', 200, 2, 'spark', 0.25);
      floatText(e.x, e.y - e.r - 28, 'CHẶN', '#c8c8c0');
      if (e.state === 'idle' || e.state === 'return') { e.state = 'chase'; e.t = 0; }
    }
  }
  dmg = Math.max(1, Math.round(dmg * rand(0.94, 1.06)));
  e.hp -= dmg; e.hurtFlash = 0.12; e.lastHit = 0;
  const quiet = opt.quiet;
  if (!quiet) { G.hitStop = crit ? 0.14 : kind === 'heavy' ? 0.075 : 0.045; shake(crit ? 11 : kind === 'heavy' ? 6 : 3); }
  const a = Math.atan2(e.y - fy, e.x - fx);
  burst(e.x, e.y, crit ? 26 : quiet ? 3 : 10, e.isBoss || e.isFinal ? '#e8c25e' : e.isDragon ? '#5a3a2a' : e.T && (e.T.id === 'crystal' || e.T.id === 'minerg') ? '#cfefff' : '#7c1210', crit ? 220 : 150, 3, 'dot', 0.5, a);
  if (!quiet) burst(e.x, e.y, 5, '#fff3c4', 260, 2, 'spark', 0.2, a);
  floatText(e.x, e.y - e.r - 12, String(dmg), crit ? '#ffd36b' : '#f1e6c8', crit);
  if (crit) { SFX.crit(); floatText(e.x, e.y - e.r - 40, label, '#ffd36b', true); } else if (!quiet) SFX.hit();
  if (e.isDragon && (e.state === 'sleep' || e.state === 'return')) wakeDragon();
  if (!e.isBoss && !e.isDragon && !e.isFinal && (e.state === 'idle' || e.state === 'return')) { e.state = 'chase'; e.t = 0; }
  if (!e.isBoss && !e.isDragon && !e.isFinal && !quiet) { const kb = e.elite ? 40 : kind === 'heavy' ? 240 : 120; e.vx += Math.cos(a) * kb; e.vy += Math.sin(a) * kb; }
  if (opt.bleed && e.hp > 0) {
    e.bleed = (e.bleed || 0) + opt.bleed * (hasTal('blood') ? 1.4 : 1);
    const cap = e.bleedMax || (e.elite ? 110 : 60);
    if (e.bleed >= cap) {
      e.bleed = 0;
      const extra = Math.round(Math.max(30, e.maxHp * (e.isBoss || e.isDragon || (e.T && e.T.miniboss) ? 0.07 : 0.15)));
      e.hp -= extra; SFX.bleed(); burst(e.x, e.y, 30, '#b3150f', 200, 3.5, 'dot', 0.7);
      floatText(e.x, e.y - e.r - 60, 'CHẢY MÁU ' + extra, '#ff6a5a', true);
    }
  }
  if (e.hp <= 0) { if (e.isFinal && e.phase === 1) { finalTransform(); return; } killEnemy(e); return; }
  if (crit) { e.state = 'stagger'; e.t = 0; e.stagDur = 0.8; e.poiseAcc = 0; e.atk = null; return; }
  e.poiseAcc += poise;
  if (e.poiseAcc >= e.poise && e.state !== 'phase') {
    e.poiseAcc = 0; e.atk = null; e.z = 0;
    if (e.elite) { e.state = 'broken'; e.t = 0; floatText(e.x, e.y - e.r - 36, 'MẤT THẾ', '#f2dc97', true); }
    else { e.state = 'stagger'; e.t = 0; e.stagDur = 0.5; }
  }
}
// vùng nổ phía người chơi (bình lửa, phép rơi)
function friendlyBlast(x, y, r, parts, poise) {
  for (const e of targets()) if ((e.z || 0) < 40 && dist(x, y, e.x, e.y) < r + e.r) hitEnemy(e, parts, poise, x, y, 'spell');
  aoes.push({ kind: 'flash', x, y, r, t: 0, dur: 0.35, col: parts.fire ? 'fire' : parts.magic ? 'magic' : undefined });
}
function gainRunes(n, x, y) {
  n = Math.round(n * (hasTal('gold') ? 1.2 : 1));
  S.runes += n; G.runeGain += n; G.runeGainT = 2.6;
  for (let i = 0; i < 10; i++) addPart(x + rand(-10, 10), y + rand(-10, 10), rand(-30, 30), rand(-60, -20), rand(0.6, 1.2), rand(2, 3.5), '#f3d27a', 'mote');
}
function dropLoot(e) {
  const T = e.T, items = {};
  for (const [id, ch, n] of T.drops || []) if (Math.random() < ch) items[id] = (items[id] || 0) + n;
  if (Object.keys(items).length) loot.push({ x: e.x + rand(-8, 8), y: e.y + rand(-8, 8), loot: { items }, t: 0 });
  if (T.rare && !S.armors.includes(T.rare.armor) && Math.random() < T.rare.chance) loot.push({ x: e.x + rand(-14, 14), y: e.y + rand(-14, 14), loot: { armor: T.rare.armor }, t: 0, rare: true });
}
function killEnemy(e) {
  e.dead = true; e.state = 'dead'; e.t = 0; e.hp = 0;
  if (P.lock === e) P.lock = null;
  burst(e.x, e.y, 24, 'rgba(60,55,45,.8)', 80, 5, 'dot', 1);
  if (e.isBoss) { bossDefeated(); return; }
  if (e.isDragon) { dragonDefeated(); return; }
  if (e.isFinal) { finalDefeated(); return; }
  gainRunes(Math.round(e.T.runes * (e.runeMul || 1)), e.x, e.y);
  if (hasTal('vital')) { const h = Math.round(P.maxHp * 0.04); P.hp = Math.min(P.maxHp, P.hp + h); }
  if (!e.summoned && !e.challenge) dropLoot(e);
  if (e.T.miniboss) {
    S.mb[e.type] = true;
    banner('felled', 'KẺ THÙ ĐÃ BỊ HẠ GỤC', '', 4); SFX.felled();
    burst(e.x, e.y, 60, e.T.ghost ? '#cfefff' : '#f3cf6e', 240, 4, 'dot', 1.3);
    enemies.forEach(x => { if (x.summoned && !x.dead) killEnemy(x); });
    if (e.T.loot) later(4.2, () => grant(e.T.loot, e.x, e.y));
    bossRoomCleared(e);
    save();
  }
}
