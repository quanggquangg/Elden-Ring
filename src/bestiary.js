'use strict';
// Gravebound — Sổ tay quái vật: ghi lại mọi loài đã hạ, vẽ chân dung bằng chính hình trong game,
// kèm điểm yếu, sức kháng, đồ hiếm và mẹo đối phó. Loài chưa hạ chỉ hiện bóng đen.
const BEAST_HINT = {
  soldier: 'Chém hai nhịp rồi nghỉ. Lăn qua nhát đầu, trả đòn ngay sau nhát thứ hai.',
  wolf: 'Luôn đi theo bầy. Lùi vào chỗ hẹp để chúng phải xếp hàng mà vào.',
  mage: 'Sợ bị áp sát. Lăn chéo qua quả cầu phép rồi đánh liên tục.',
  archer: 'Mũi tên bay thẳng: bước ngang là tránh được. Loạt ba mũi thì lăn qua.',
  boar: 'Khi nó cúi đầu cào chân là sắp húc. Né sang bên, nó sẽ lao quá đà.',
  skeleton: 'Chỉ lửa hoặc ánh thánh mới cho nó nằm yên. Không thì đứng chờ nó ráp lại mà đánh tiếp.',
  ghoul: 'Chậm nhưng móng vuốt gây độc. Đừng đứng đỡ đòn quá lâu.',
  toad: 'Cổ phồng tím là sắp thè lưỡi rất xa: né sang ngang. Phồng xanh là phun độc.',
  bomber: 'Bình lửa rơi theo đường cong. Tiến lại gần là nó hết cách.',
  shield: 'Khiên chặn gần hết đòn từ phía trước. Dùng đòn mạnh hoặc vòng ra sau.',
  troll: 'Khi nó giơ chùy, lăn vào dưới chân thay vì lùi ra xa.',
  bat: 'Bay vòng rồi lao xuống. Đánh ngay lúc nó vừa vồ hụt.',
  spider: 'Nhổ độc từ xa, cắn độc ở gần. Mang theo Thuốc Giải Độc.',
  salamander: 'Họng sáng dần là sắp phun lửa hình nón. Đứng sát bên hông nó.',
  warhound: 'Cắn hai phát liên tiếp. Chờ phát thứ hai qua rồi mới phản công.',
  ghost: 'Biết dịch chuyển ra sau lưng ngươi. Vũ khí vật lý đánh nó rất yếu, ánh thánh thì cực mạnh.',
  wisp: 'Cầu hồn bay đuổi theo ngươi. Đừng chạy thẳng, hãy lăn qua. Vật lý đánh kém, ánh thánh rất đau.',
  knight: 'Chém ba nhịp, nhịp cuối rất nặng. Đỡ hai nhát đầu, lăn nhát thứ ba.',
  lakehound: 'Chạy nhanh trong nước. Kéo nó lên bờ mà đánh.',
  crab: 'Mai trước cứng như khiên. Vòng ra sau lưng hoặc dùng đòn mạnh phá mai.',
  jelly: 'Chuông co lại và sáng dần là sắp phóng sóng điện. Lùi ra rồi quay lại.',
  sorcerer: 'Hay dịch chuyển ra xa. Đuổi theo nhanh, đừng đứng giữa làn mảnh pha lê.',
  crystal: 'Chịu phép rất tốt, sợ đòn vật lý. Đập thật mạnh.',
  drowned: 'Nhát nện chậm nhưng rất nặng. Lăn vào trong tầm tay nó.',
  grimoire: 'Vòng phù chú hiện dưới sách là sắp bắn. Cực sợ lửa.',
  royal: 'Hay nhảy bổ từ xa. Đứng yên chờ nó đáp xuống rồi mới lăn.',
  priest: 'Hồi máu cho đồng bọn. Hạ nó trước tiên.',
  lion: 'Vồ và lao rất nhanh. Lăn về phía trước, qua người nó.',
  garcher: 'Bắn mưa tên xuống vùng ngươi đứng. Đừng đứng yên.',
  eagle: 'Vút lên, khép cánh rồi bổ nhào. Lăn đúng lúc nó lao xuống.',
  ram: 'Dậm chân là sắp húc rất mạnh. Né sang bên, nó phải quay lại rất lâu.',
  gargoyle: 'Đá cứng, vật lý kém hiệu quả. Phép và ánh sáng làm nó nứt nhanh hơn.',
  varek: 'Hắn giữ lưỡi kiếm lâu hơn một nhịp. Kẻ lăn vội sẽ chết.',
  warden: 'Húc liên tiếp ở giai đoạn hai. Đứng sau cột mà thở.',
  dragon: 'Phun lửa theo đường thẳng rồi quét ngang. Đứng dưới bụng hoặc sau đuôi.',
  wraith: 'Gọi hồn ma ra giúp sức. Ánh thánh là vũ khí tốt nhất.',
  selvara: 'Mưa thiên thạch rơi quanh người ngươi. Chạy vòng, đừng đứng một chỗ.',
  crabking: 'Kẹp hai nhịp rồi dậm mai. Gọi thêm cua khi bị dồn.',
  admiral: 'Nhảy bổ tạo sóng tròn. Lăn qua vòng sóng, đừng lùi ra xa.',
  ramking: 'Húc hai lần liên tiếp. Né lần đầu, chuẩn bị né tiếp.',
  graveknight: 'Dịch chuyển ra sau lưng rồi chém. Nghe tiếng rít là quay người.',
  minerg: 'Lao thẳng rất xa. Nấp sau cột pha lê.',
  golem: 'Ném đá lửa khi ngươi ở xa. Áp sát và đánh vào chân.',
  royalchamp: 'Chuỗi ba nhát liền. Phản đòn nhát thứ hai là thời điểm đẹp nhất.',
  varek2: 'Vua Ẩn Mặt gọi những lời thề cũ đứng dậy. Hạ bóng ma trước khi đánh hắn.',
  final: 'Hai hình dạng. Hình dạng thứ hai phun tia sáng: luôn di chuyển ngang.',
};
const BEAST_ORDER = ['soldier', 'wolf', 'mage', 'archer', 'boar', 'skeleton', 'ghoul', 'toad', 'bomber', 'shield', 'troll', 'bat', 'spider', 'salamander', 'warhound', 'ghost', 'wisp', 'knight',
  'lakehound', 'crab', 'jelly', 'sorcerer', 'crystal', 'drowned', 'grimoire', 'royal', 'priest', 'lion', 'garcher', 'eagle', 'ram', 'gargoyle',
  'varek', 'warden', 'dragon', 'wraith', 'selvara', 'crabking', 'admiral', 'ramking', 'graveknight', 'minerg', 'golem', 'royalchamp', 'varek2', 'final'];
const BEAST_BOSS = { varek: 'Varek, Kẻ Gác Cổng Bội Thề', dragon: 'Ignarth, Rồng Tro Cổ Đại', varek2: 'Varek, Vua Ẩn Mặt', final: 'Aurel, Vị Vua Tro Tàn' };
const BEAST_WHERE = { varek: 'Cổng Gác Thornwall', dragon: 'Đầm Lầy Ashmire', varek2: 'Sân Ngai Sunthrone', final: 'Cõi Aurum', wraith: 'Rừng Wraithwood', selvara: 'Học Viện Starhollow' };
const RES_NAME = { phys: 'Vật lý', magic: 'Ma thuật', fire: 'Lửa', holy: 'Thánh' };
function beastWhere(id) {
  if (BEAST_WHERE[id]) return BEAST_WHERE[id];
  const s = SPAWNS.find(q => q[0] === id);
  return s ? regionAt(s[1], s[2]) : '';
}
function beastName(id) { return BEAST_BOSS[id] || (ETYPES[id] ? ETYPES[id].name : id); }
function beastRes(id) {
  const R = id === 'dragon' ? { fire: 0.4 } : id === 'varek' || id === 'varek2' ? { holy: 0.8 } : id === 'final' ? { holy: 0.6 } : (ETYPES[id] && ETYPES[id].res) || {};
  const weak = [], strong = [];
  for (const [k, v] of Object.entries(R)) { if (!RES_NAME[k]) continue; if (v > 1.05) weak.push(RES_NAME[k]); else if (v < 0.95) strong.push(RES_NAME[k]); }
  return { weak, strong };
}
function beastDrop(id) {
  const T = ETYPES[id]; if (!T) return null;
  const R = T.loot || T.rare; if (!R) return null;
  const [k, v] = R.weapon ? ['weapon', R.weapon] : R.armor ? ['armor', R.armor] : R.tal ? ['tal', R.tal] : [null, null];
  if (!k) return null;
  const def = k === 'weapon' ? WEAPONS[v] : k === 'armor' ? ARMORS[v] : TALISMANS[v], own = k === 'weapon' ? S.weapons : k === 'armor' ? S.armors : S.tals;
  return { name: def ? def.name : v, owned: own.includes(v), boss: !!T.loot };
}
// vẽ chân dung vào canvas nhỏ bằng các hàm vẽ của game (tạm đổi bảng vẽ chính sang canvas này)
function drawPortrait(cv, id, known) {
  const pc = cv.getContext('2d'), W = cv.width, Hh = cv.height;
  const saveCtx = ctx, saveView = VIEW, saveDragon = dragon, saveFb = fb;
  pc.setTransform(1, 0, 0, 1, 0, 0); pc.clearRect(0, 0, W, Hh);
  ctx = pc; VIEW = { x0: -1e6, y0: -1e6, x1: 1e6, y1: 1e6 };
  try {
    let r = 20, sc = 1, draw;
    if (id === 'dragon') { const d = makeDragon(); d.x = 0; d.y = 0; d.state = 'chase'; d.face = Math.PI / 2; r = 70; draw = () => { dragon = d; drawDragon(); }; }
    else if (id === 'final') { const f = makeFinal(); f.x = 0; f.y = 0; f.state = 'chase'; f.face = Math.PI / 2; r = 40; draw = () => { fb = f; drawFinal(); }; }
    else if (id === 'varek' || id === 'varek2') { const b = makeBoss(id === 'varek' ? 1 : 2); r = 30 * (b.look.scale || 1) / 1.6; draw = () => drawHumanoid(0, 0, Math.PI / 2, b.look, 0.6, { anim: 1.3 }); }
    else { const e = makeEnemy(id, 0, 0); e.face = Math.PI / 2; e.state = 'idle'; e.anim = 1.3; e.wander = { x: 0, y: 0, until: 1e9 }; sc = (e.T.look && e.T.look.scale) || e.T.scale || 1; r = e.r * (e.T.beast && e.T.beast.scale ? e.T.beast.scale : 1); draw = () => drawEnemy(e); }
    const k = clamp(W * 0.3 / (r * Math.max(1, sc * 0.8)), 0.5, W / 34);
    pc.setTransform(k, 0, 0, k, W / 2, Hh * 0.55);
    draw();
  } catch (err) { /* không vẽ được thì để trống */ }
  finally { ctx = saveCtx; VIEW = saveView; dragon = saveDragon; fb = saveFb; }
  pc.setTransform(1, 0, 0, 1, 0, 0);
  if (!known) { pc.globalCompositeOperation = 'source-in'; pc.fillStyle = '#0d0b08'; pc.fillRect(0, 0, W, Hh); pc.globalCompositeOperation = 'source-over'; }
}
function renderBeast() {
  const K = S.kills || {}, known = BEAST_ORDER.filter(id => K[id] > 0).length;
  $('beastNote').textContent = `Đã ghi chép ${known}/${BEAST_ORDER.length} loài. Hạ một loài để mở trang của nó; đồ hiếm hiện tên khi ngươi đã có trong tay.`;
  $('beastList').innerHTML = BEAST_ORDER.map(id => {
    const n = K[id] || 0, boss = !!BEAST_BOSS[id] || (ETYPES[id] && ETYPES[id].miniboss);
    if (!n) return `<li class="unk"><canvas data-beast="${id}" width="176" height="176"></canvas><div><b>???</b><span>${boss ? 'Boss' : 'Quái vật'} · <bdi>${beastWhere(id)}</bdi></span></div></li>`;
    const rs = beastRes(id), dr = beastDrop(id);
    return `<li class="${boss ? 'boss' : ''}"><canvas data-beast="${id}" width="176" height="176"></canvas><div><b>${beastName(id)}</b><span><bdi>${beastWhere(id)}</bdi> · Đã hạ: ${n}</span>`
      + (rs.weak.length ? `<span class="w">Yếu: ${rs.weak.join(', ')}</span>` : '') + (rs.strong.length ? `<span class="s">Kháng: ${rs.strong.join(', ')}</span>` : '')
      + (dr ? `<span>${dr.boss ? 'Phần thưởng' : 'Đồ hiếm'}: ${dr.owned ? dr.name : '???'}</span>` : '') + `<p>${BEAST_HINT[id] || ''}</p></div></li>`;
  }).join('');
  for (const cv of $('beastList').querySelectorAll('canvas[data-beast]')) drawPortrait(cv, cv.dataset.beast, (K[cv.dataset.beast] || 0) > 0);
}
function recordKill(id) { if (!id || id.startsWith('inv_')) return; S.kills = S.kills || {}; S.kills[id] = (S.kills[id] || 0) + 1; }
