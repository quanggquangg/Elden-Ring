'use strict';
// Gravebound — Nhạc nền tạo bằng WebAudio, không dùng tệp âm thanh.
// Mỗi vùng một điệu thức, nhịp độ và nhạc cụ riêng; boss có trống và bè bass dồn dập.
// Bộ xếp lịch chạy trước khoảng 0,3 giây, chuyển bài bằng cách giảm dần rồi tăng dần âm lượng.
const MUSIC = { vol: 0.5, track: null, want: 'title', gain: null, next: 0, step: 0, bar: 0, fadeTo: 0, switchAt: 0, timer: null, last: 0, nb: null };
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const MODES = {
  dorian: [0, 2, 3, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11],
  mixo: [0, 2, 4, 5, 7, 9, 10], major: [0, 2, 4, 5, 7, 9, 11], locrian: [0, 1, 3, 5, 6, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11],
};
const THEMES = {
  title: { bpm: 58, root: 50, mode: 'aeolian', prog: [0, 5, 3, 4], lead: 'harp', dens: 0.3, drone: true },
  meadow: { bpm: 70, root: 50, mode: 'dorian', prog: [0, 3, 4, 0], lead: 'harp', dens: 0.45 },
  swamp: { bpm: 54, root: 45, mode: 'phrygian', prog: [0, 1, 0, 6], lead: 'bell', dens: 0.22, drone: true },
  ash: { bpm: 78, root: 45, mode: 'aeolian', prog: [0, 5, 6, 4], lead: 'horn', dens: 0.3, toms: true },
  wraith: { bpm: 60, root: 52, mode: 'aeolian', prog: [0, 5, 2, 6], lead: 'bell', dens: 0.28, drone: true },
  crystal: { bpm: 64, root: 53, mode: 'lydian', prog: [0, 1, 4, 0], lead: 'bell', dens: 0.4 },
  coast: { bpm: 62, root: 43, mode: 'aeolian', prog: [0, 6, 5, 6], lead: 'harp', dens: 0.3, waves: true },
  gold: { bpm: 74, root: 48, mode: 'mixo', prog: [0, 6, 3, 4], lead: 'horn', dens: 0.4 },
  dungeon: { bpm: 52, root: 40, mode: 'locrian', prog: [0, 1, 0, 4], lead: 'bell', dens: 0.18, drone: true },
  hub: { bpm: 66, root: 48, mode: 'major', prog: [0, 5, 3, 4], lead: 'harp', dens: 0.42 },
  boss: { bpm: 138, root: 45, mode: 'harm', prog: [0, 5, 6, 4], lead: 'horn', dens: 0.45, drums: true, ost: true },
  final: { bpm: 146, root: 50, mode: 'harm', prog: [0, 5, 3, 4], lead: 'horn', dens: 0.5, drums: true, ost: true, choir: true },
};
const REGION_THEME = {
  'Đồng Cỏ Mistveil': 'meadow', 'Nhà Nguyện Dawnrest': 'meadow', 'Tàn Tích Hollowmere': 'meadow', 'Cổng Gác Thornwall': 'meadow',
  'Đầm Lầy Ashmire': 'swamp', 'Cao Nguyên Cinderreach': 'ash', 'Pháo Đài Greystone': 'ash', 'Đấu Trường Bloodsand': 'ash',
  'Rừng Wraithwood': 'wraith', 'Hồ Crystalmere': 'crystal', 'Học Viện Starhollow': 'crystal', 'Bờ Biển Saltreach': 'coast',
  'Cao Nguyên Aurelia': 'gold', 'Kinh Thành Aurumhold': 'gold', 'Sườn Núi Goldspire': 'gold', 'Cây Aurum': 'gold', 'Sân Ngai Sunthrone': 'gold',
  'Sảnh Hearthhold': 'hub', 'Cõi Aurum': 'gold',
};
// ── nhạc cụ ──
function mNode(type, f, t, dur, vol, att, rel, cut, det = 0) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = f; o.detune.value = det;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.setTargetAtTime(0.0001, t + Math.max(att, dur), rel);
  let n = o;
  if (cut) { const fl = AC.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cut; o.connect(fl); n = fl; }
  n.connect(g); g.connect(MUSIC.gain); o.start(t); o.stop(t + Math.max(att, dur) + rel * 6);
}
function mNoise(t, dur, vol, type, freq, att = 0.002) {
  if (!MUSIC.nb) { MUSIC.nb = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = MUSIC.nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = MUSIC.nb; f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + att + dur);
  s.connect(f); f.connect(g); g.connect(MUSIC.gain); s.start(t, Math.random()); s.stop(t + att + dur + 0.05);
}
const INST = {
  harp: (f, t) => { mNode('triangle', f, t, 0.02, 0.09, 0.004, 0.45); mNode('sine', f * 2, t, 0.02, 0.025, 0.004, 0.25); },
  bell: (f, t) => { mNode('sine', f, t, 0.02, 0.06, 0.004, 1.1); mNode('sine', f * 2.76, t, 0.02, 0.02, 0.004, 0.45); },
  horn: (f, t, d) => { mNode('sawtooth', f, t, d, 0.035, 0.06, 0.18, 1100, -6); mNode('sawtooth', f, t, d, 0.035, 0.06, 0.18, 1100, 6); },
  pad: (fs, t, d) => { for (const f of fs) { mNode('triangle', f, t, d * 0.8, 0.026, d * 0.3, d * 0.25); mNode('sawtooth', f, t, d * 0.8, 0.008, d * 0.35, d * 0.25, 700, 8); } },
  bass: (f, t, d) => { mNode('sine', f, t, d, 0.1, 0.01, 0.12); mNode('triangle', f, t, d, 0.03, 0.01, 0.1); },
  drone: (f, t, d) => { mNode('sawtooth', f, t, d, 0.02, d * 0.4, d * 0.3, 260); mNode('sine', f / 2, t, d, 0.05, d * 0.4, d * 0.3); },
  kick: t => { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); g.gain.setValueAtTime(0.32, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28); o.connect(g); g.connect(MUSIC.gain); o.start(t); o.stop(t + 0.3); },
  snare: t => { mNoise(t, 0.12, 0.11, 'bandpass', 1900); mNode('triangle', 190, t, 0.01, 0.05, 0.002, 0.05); },
  hat: t => mNoise(t, 0.03, 0.025, 'highpass', 7000),
  tom: t => { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.3); g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.connect(g); g.connect(MUSIC.gain); o.start(t); o.stop(t + 0.55); },
  wave: (t, d) => mNoise(t, d, 0.045, 'lowpass', 520, d * 0.45),
};
// bậc trong điệu thức → nốt MIDI (có quãng tám)
const deg = (T, d) => { const m = MODES[T.mode], k = ((d % 7) + 7) % 7; return T.root + m[k] + 12 * Math.floor(d / 7); };
function schedStep(T, t, sd) {
  const s = MUSIC.step % 16, bar = MUSIC.bar, c = T.prog[bar % T.prog.length], barDur = sd * 16;
  if (s === 0) {
    INST.pad([deg(T, c), deg(T, c + 2), deg(T, c + 4)].map(n => midi(n + 12)), t, barDur);
    if (!T.ost) INST.bass(midi(deg(T, c) - 12), t, barDur * 0.9);
    if (T.drone && bar % 2 === 0) INST.drone(midi(T.root - 12), t, barDur * 2);
    if (T.waves && bar % 2 === 0) INST.wave(t, barDur * 1.6);
    if (T.choir) INST.pad([deg(T, c + 7), deg(T, c + 9)].map(n => midi(n + 12)), t, barDur);
  }
  if (T.toms && (s === 0 || s === 10)) INST.tom(t);
  if (T.drums) {
    if (s === 0 || s === 6 || s === 8 || (s === 14 && bar % 2)) INST.kick(t);
    if (s === 4 || s === 12) INST.snare(t);
    if (s % 2) INST.hat(t);
  }
  if (T.ost) { const pat = [0, 0, 7, 0, 12, 0, 7, 3]; INST.bass(midi(deg(T, c) - 12 + pat[s % 8]), t, sd * 0.9); }
  // giai điệu: đi dạo quanh các nốt của hợp âm, dày thưa theo từng vùng
  if (s % 2 === 0 && Math.random() < T.dens) {
    MUSIC.mel = clamp((MUSIC.mel ?? 4) + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.7 ? 1 : 2), 0, 11);
    const n = deg(T, c + MUSIC.mel) + 12;
    if (T.lead === 'horn') INST.horn(midi(n), t, sd * (Math.random() < 0.5 ? 2 : 4)); else INST[T.lead](midi(n + 12), t);
  }
}
function musicTick() {
  if (!AC || !MUSIC.gain) return;
  const now = AC.currentTime;
  if (MUSIC.switchAt && now >= MUSIC.switchAt) {
    MUSIC.track = MUSIC.want; MUSIC.switchAt = 0; MUSIC.step = 0; MUSIC.bar = 0; MUSIC.next = now + 0.05; MUSIC.mel = 4;
    MUSIC.gain.gain.cancelScheduledValues(now); MUSIC.gain.gain.setValueAtTime(0.0001, now); MUSIC.gain.gain.linearRampToValueAtTime(musicLevel(), now + 1.5);
  }
  const T = THEMES[MUSIC.track];
  if (!T || MUSIC.switchAt) return;
  const sd = 60 / T.bpm / 4;
  if (MUSIC.next < now - 0.5) MUSIC.next = now + 0.05; // tab bị treo lâu: bắt nhịp lại, không dồn nốt
  while (MUSIC.next < now + 0.3) {
    schedStep(T, MUSIC.next, sd);
    MUSIC.next += sd; MUSIC.step++; if (MUSIC.step % 16 === 0) MUSIC.bar++;
  }
}
const musicLevel = () => (muted ? 0.0001 : Math.max(0.0001, SET.music * 0.5 * (G.mode === 'dead' ? 0.35 : G.mode === 'menu' || G.mode === 'pause' ? 0.6 : 1)));
// chọn bài theo tình huống: boss > hầm ngục > vùng đất
function pickTrack() {
  if (G.mode === 'title') return 'title';
  if (G.finalFight) return 'final';
  if (G.bossFight || G.dragonFight || G.dfight || (G.colo && G.colo.active)) return 'boss';
  if (enemies.some(e => e.T.miniboss && !e.dead && (e.state === 'chase' || e.state === 'atk') && Math.abs(e.x - P.x) < 700 && Math.abs(e.y - P.y) < 700)) return 'boss';
  const reg = G.region || regionAt(P.x, P.y);
  if (DUNGEONS.some(d => d.name === reg)) return 'dungeon';
  return REGION_THEME[reg] || 'meadow';
}
function updateMusic(dt) {
  if (!AC) return;
  if (!MUSIC.gain) { MUSIC.gain = AC.createGain(); MUSIC.gain.gain.value = 0.0001; MUSIC.gain.connect(AC.destination); MUSIC.timer = setInterval(musicTick, 90); }
  MUSIC.last += dt;
  if (MUSIC.last < 0.25) return;
  MUSIC.last = 0;
  const want = pickTrack(), now = AC.currentTime;
  if (want !== MUSIC.track && !MUSIC.switchAt) {
    MUSIC.want = want;
    // vào trận boss thì đổi nhanh, còn đi giữa các vùng thì giảm dần chậm rãi
    const fade = want === 'boss' || want === 'final' ? 0.5 : MUSIC.track ? 2 : 0.05;
    MUSIC.gain.gain.cancelScheduledValues(now); MUSIC.gain.gain.setValueAtTime(Math.max(0.0001, MUSIC.gain.gain.value), now); MUSIC.gain.gain.linearRampToValueAtTime(0.0001, now + fade);
    MUSIC.switchAt = now + fade;
  } else if (!MUSIC.switchAt && MUSIC.track) {
    MUSIC.gain.gain.setTargetAtTime(musicLevel(), now, 0.4);
  }
}
