// 品牌聲音 Logo 產生器 — 規則式引擎（瀏覽器與 Node 共用，不碰 DOM／Web Audio）
// 所有旋律都由「品牌名稱＋個性設定＋候選編號」決定，同樣輸入一定得到同樣結果。

/* ---------- 亂數 ---------- */
export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- 音樂基礎 ---------- */
export const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
export const SCALES = {
  pent:   { label: '大調五聲音階', steps: [0, 2, 4, 7, 9], mood: '明亮、好記、東方感，幾乎不會有不和諧的音' },
  major:  { label: '大調', steps: [0, 2, 4, 5, 7, 9, 11], mood: '開朗、正面、最大眾' },
  lydian: { label: '利地安調式', steps: [0, 2, 4, 6, 7, 9, 11], mood: '夢幻、未來感，常用在科技與高級品牌' },
  dorian: { label: '多利安調式', steps: [0, 2, 3, 5, 7, 9, 10], mood: '冷靜、酷、帶一點都會感' },
  minpent:{ label: '小調五聲音階', steps: [0, 3, 5, 7, 10], mood: '沉穩、有個性、街頭感' },
};
// 音階級數（可為負、可超過一個八度）→ 半音
export function degToSemi(deg, scale) {
  const st = SCALES[scale].steps, n = st.length;
  const oct = Math.floor(deg / n), i = ((deg % n) + n) % n;
  return oct * 12 + st[i];
}
export const midiToHz = m => 440 * Math.pow(2, (m - 69) / 12);
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];   // 與 KEYS（調性選單）同一套寫法
const SOLFA = ['Do', 'Do#', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'Si♭', 'Si'];
export const midiName = m => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
export const solfa = (m, keyIdx) => SOLFA[(((m - keyIdx) % 12) + 12) % 12];

/* ---------- 樂器（實際合成在 index.html；這裡只放描述與預設） ---------- */
export const INSTRUMENTS = {
  bell:    { label: '🔔 鐘聲', desc: '清亮、有餘韻，給人信任與高級感', tail: 1.6 },
  marimba: { label: '🪵 木琴', desc: '溫暖、圓潤、親切，適合生活與餐飲', tail: 0.6 },
  epiano:  { label: '🎹 電鋼琴', desc: '柔和、專業、不搶戲，萬用', tail: 1.0 },
  pluck:   { label: '🎸 撥弦', desc: '自然、手作感、輕快', tail: 0.7 },
  synth:   { label: '🎛️ 合成器', desc: '科技、現代、有能量', tail: 0.6 },
  chip:    { label: '👾 八位元', desc: '電玩、童趣、活潑', tail: 0.3 },
  pad:     { label: '🌫️ 柔和鋪底', desc: '空靈、放鬆、療癒，適合美容與身心靈', tail: 1.8 },
  whistle: { label: '🎐 口哨', desc: '輕鬆、自然、戶外感', tail: 0.5 },
  drop:    { label: '💧 水滴', desc: '清新、乾淨、俐落，適合 App 提示音', tail: 0.5 },
};

/* ---------- 產業預設（個性四軸 -2～2） ---------- */
// energy：-2 活潑 … 2 穩重；premium：-2 親民 … 2 高級；tech：-2 自然 … 2 科技；warmth：-2 溫暖 … 2 酷感
export const INDUSTRIES = {
  general: { label: '一般品牌', energy: 0, premium: 0, tech: 0, warmth: 0 },
  food:    { label: '餐飲小吃', energy: -1, premium: -2, tech: -1, warmth: -2 },
  cafe:    { label: '咖啡甜點', energy: 0, premium: 0, tech: -1, warmth: -2 },
  tech:    { label: '科技新創／App', energy: -1, premium: 1, tech: 2, warmth: 1 },
  finance: { label: '金融保險', energy: 2, premium: 1, tech: 1, warmth: 0 },
  beauty:  { label: '美妝保養', energy: 1, premium: 2, tech: 0, warmth: -1 },
  edu:     { label: '教育課程', energy: 0, premium: -1, tech: 0, warmth: -1 },
  care:    { label: '醫療照護', energy: 2, premium: 0, tech: 0, warmth: -2 },
  kids:    { label: '兒童親子', energy: -2, premium: -2, tech: -1, warmth: -2 },
  sport:   { label: '運動健身', energy: -2, premium: 0, tech: 1, warmth: 1 },
  farm:    { label: '在地農產', energy: 1, premium: -1, tech: -2, warmth: -2 },
  hotel:   { label: '旅宿觀光', energy: 1, premium: 1, tech: -1, warmth: -1 },
  pet:     { label: '寵物用品', energy: -1, premium: -1, tech: -1, warmth: -2 },
  fashion: { label: '服飾潮牌', energy: -1, premium: 1, tech: 0, warmth: 2 },
};
export const AXES = [
  { key: 'energy', left: '活潑', right: '穩重' },
  { key: 'premium', left: '親民', right: '高級' },
  { key: 'tech', left: '自然', right: '科技' },
  { key: 'warmth', left: '溫暖', right: '酷感' },
];

/* ---------- 品牌名稱 ---------- */
// 中文每字一音；英文以母音群估音節；數字一字一音
export function nameSyllables(name) {
  const s = String(name || '').trim();
  const out = [];
  const re = /[㐀-鿿豈-﫿]|[A-Za-z]+|[0-9]/g;
  let m;
  while ((m = re.exec(s))) {
    const t = m[0];
    if (/^[A-Za-z]+$/.test(t)) {
      const groups = t.toLowerCase().replace(/e$/, '').match(/[aeiouy]+/g);
      const n = Math.max(1, groups ? groups.length : 1);
      for (let i = 0; i < n; i++) out.push(n === 1 ? t : t + '·' + (i + 1));
    } else out.push(t);
  }
  return out;
}
export const TONES = { 1: '一聲（高平）', 2: '二聲（上揚）', 3: '三聲（低）', 4: '四聲（下降）', 5: '輕聲' };
// 一個字的聲調 → [起音相對高度, 是否加一個滑音尾巴]
// 以五聲音階級數表示：一聲 4、二聲 2→4、三聲 1、四聲 4→2、輕聲沿用前一音
function toneDegrees(tone, prev) {
  switch (+tone) {
    case 1: return [4];
    case 2: return [2, 4];
    case 3: return [1];
    case 4: return [5, 3];
    default: return [prev == null ? 2 : prev];
  }
}

/* ---------- 產生候選 ---------- */
export const STYLE_NAMES = ['上揚招呼型', '回到主音信賴型', '跳躍記憶型', '三連音輕快型', '和弦分解型', '對稱呼應型', '名稱聲調型'];

function chooseScale(p, r) {
  if (p.tech >= 1 && p.premium >= 0) return r() < 0.6 ? 'lydian' : 'major';
  if (p.warmth >= 1 && p.energy <= 0) return r() < 0.6 ? 'minpent' : 'dorian';
  if (p.warmth >= 1) return 'dorian';
  if (p.premium >= 1) return r() < 0.5 ? 'lydian' : 'major';
  if (p.tech <= -1 || p.energy <= -1) return 'pent';
  return r() < 0.5 ? 'pent' : 'major';
}
function chooseInstrument(p, r) {
  const pool = [];
  const add = (k, w) => { for (let i = 0; i < w; i++) pool.push(k); };
  add('epiano', 2); add('marimba', 1); add('bell', 1); add('pluck', 1);
  if (p.premium >= 1) { add('bell', 4); add('pad', 2); }
  if (p.premium <= -1) { add('marimba', 3); add('pluck', 2); }
  if (p.tech >= 1) { add('synth', 4); add('drop', 2); add('bell', 1); }
  if (p.tech <= -1) { add('marimba', 3); add('pluck', 3); add('whistle', 2); }
  if (p.energy <= -2) { add('chip', 2); add('marimba', 2); }
  if (p.energy >= 1) { add('bell', 2); add('epiano', 2); add('pad', 1); }
  if (p.warmth <= -1) { add('marimba', 2); add('epiano', 1); }
  if (p.warmth >= 1) { add('synth', 2); add('pluck', 1); }
  return pick(r, pool);
}
// 節奏型（單位：拍；最後一音會再加長）
const RHYTHMS = {
  3: [[0.5, 0.5, 1.5], [0.25, 0.25, 1.5], [0.75, 0.25, 1.5], [0.5, 1, 1.5]],
  4: [[0.5, 0.5, 0.5, 1.5], [0.25, 0.25, 0.5, 1.5], [0.5, 0.25, 0.25, 1.5], [0.75, 0.25, 0.5, 1.5], [0.33, 0.33, 0.34, 1.5]],
  5: [[0.25, 0.25, 0.5, 0.5, 1.5], [0.5, 0.25, 0.25, 0.5, 1.5], [0.33, 0.33, 0.34, 0.5, 1.5], [0.25, 0.25, 0.25, 0.25, 1.5]],
  6: [[0.25, 0.25, 0.5, 0.25, 0.25, 1.5], [0.33, 0.33, 0.34, 0.33, 0.33, 1.5], [0.5, 0.25, 0.25, 0.5, 0.5, 1.5]],
};
// 各風格的旋律輪廓（以「五聲音階級數」寫：0 Do、1 Re、2 Mi、3 Sol、4 La、5 高 Do…）
const SHAPES = {
  0: [[0, 2, 3], [0, 1, 2, 3], [0, 2, 3, 4, 5], [0, 1, 2, 3, 2, 5]],          // 上揚招呼
  1: [[3, 2, 0], [5, 3, 2, 0], [5, 4, 3, 1, 0], [3, 4, 3, 2, 1, 0]],          // 回到主音
  2: [[0, 3, 2], [0, 4, 3, 5], [0, 3, 2, 5, 3], [0, 4, 3, 1, 4, 5]],          // 跳躍記憶
  3: [[2, 1, 3], [0, 1, 2, 4], [3, 2, 3, 1, 5], [0, 1, 2, 3, 2, 3]],          // 三連音輕快
  4: [[0, 2, 3], [0, 2, 3, 5], [0, 2, 3, 5, 7], [-2, 0, 2, 3, 5, 7]],         // 和弦分解
  5: [[0, 3, 0], [0, 3, 2, 5], [0, 2, 0, 2, 3], [0, 3, 2, 2, 4, 3]],          // 對稱呼應
};
function contour(style, n, r) {
  let c = SHAPES[style][clamp(n - 3, 0, 3)].slice();
  // 起音不一定是 Do：除了「回到主音」外，整段可平移到從 Mi、Sol 或低音 Sol 開始
  if (style !== 1) { const off = pick(r, [0, 0, 2, 3, -2]); c = c.map(d => d + off); }
  // 小變化：最多改一個中間音 ±1，且不能和左右鄰音重複（保留風格）
  for (let k = 0; k < (n >= 5 ? 2 : 1); k++) {
    if (n < 4 || r() >= 0.6) continue;
    const i = 1 + Math.floor(r() * (n - 2));
    const d = c[i] + (r() < 0.5 ? -1 : 1);
    if (d !== c[i - 1] && d !== c[i + 1]) c[i] = d;
  }
  return c;
}
// 五聲級數 → 七聲音階級數（Do Re Mi Sol La 對應 1 2 3 5 6 級）
export function pentToHept(d) { const i = ((d % 5) + 5) % 5; return Math.floor(d / 5) * 7 + [0, 1, 2, 4, 5][i]; }

export function defaultBrand() {
  return { name: '', industry: 'general', energy: 0, premium: 0, tech: 0, warmth: 0, notes: 'auto', length: 'std', useTones: false, tones: [] };
}

// 依名稱聲調產生級數（以五聲音階計，最後再轉成所選音階的級數）
export function toneMelody(sylls, tones) {
  const out = [];
  let prev = null;
  sylls.forEach((_, i) => {
    const t = tones[i] || 1;
    const ds = toneDegrees(t, prev);
    // 二聲、四聲以「主音＋短滑音」表現：先取起音，再把尾音當作下一個短音
    ds.forEach((d, j) => out.push({ deg: d, glide: j > 0, syl: i }));
    prev = ds[ds.length - 1];
  });
  return out;
}

export function noteCountFor(brand, r) {
  if (brand.notes !== 'auto') return clamp(+brand.notes, 3, 6);
  const n = nameSyllables(brand.name).length;
  if (n >= 3 && n <= 6) return n;
  if (n > 6) return 5;
  return r() < 0.5 ? 4 : 5;
}

export function generate(brand, idx) {
  const seed = hashStr([brand.name, brand.industry, brand.energy, brand.premium, brand.tech, brand.warmth, brand.notes, brand.length, idx].join('|'));
  const r = rng(seed);
  const p = brand;
  const sylls = nameSyllables(brand.name);
  const useTone = brand.useTones && sylls.length > 0 && idx === 0;
  const style = useTone ? 6 : (idx % 6);
  let scale = chooseScale(p, r);
  if (useTone) scale = 'pent';
  const n = noteCountFor(brand, r);
  // 速度：活潑快、穩重慢
  const keyIdx = Math.floor(r() * 12);
  const keyIdxPeek = () => keyIdx <= 4;   // 活潑品牌且調性偏低時升一個八度
  const bpm = Math.round(clamp(118 - p.energy * 14 + (p.tech >= 1 ? 8 : 0) + (r() - 0.5) * 16, 70, 160));
  // 音域：穩重／酷感偏低，活潑／兒童偏高
  const baseOct = p.energy <= -2 && keyIdxPeek(r) ? 5 : 4;
    let root = 12 * (baseOct + 1) + keyIdx;   // MIDI
  const inst = chooseInstrument(p, r);
  let notes;
  if (useTone) {
    const tm = toneMelody(sylls.slice(0, 6), brand.tones || []);
    notes = tm.map((t, i) => ({ deg: t.deg, dur: t.glide ? 0.25 : 0.5, vel: t.glide ? 0.7 : 0.9 }));
    notes[notes.length - 1].dur = 1.5;
  } else {
    const rhythms = RHYTHMS[n];
    const rh = style === 3 ? (rhythms.find(x => x[0] === 0.33) || rhythms[0]) : pick(r, rhythms);
    const ct = contour(style, n, r);
    notes = ct.map((d, i) => ({ deg: d, dur: rh[i], vel: i === 0 || i === n - 1 ? 0.95 : 0.8 }));
  }
  if (brand.length === 'short') notes.forEach(x => { x.dur *= 0.75; });
  if (brand.length === 'long') notes[notes.length - 1].dur += 1;
  if (scale !== 'pent' && scale !== 'minpent') {
    notes.forEach(x => { x.deg = pentToHept(x.deg); });
    // 利地安調式的招牌是升 Fa：把中間一個 Sol 換成升 Fa，帶出夢幻感
    if (scale === 'lydian' && notes.length >= 4) {
      const mid = notes.slice(1, -1).findIndex(x => ((x.deg % 7) + 7) % 7 === 4);
      if (mid >= 0) notes[mid + 1].deg -= 1;
    }
  }
  // 音域保護：整段最高不超過 MIDI 91（G6）、最低不低於 50
  let ms = notes.map(x => root + degToSemi(x.deg, scale));
  if (Math.max(...ms) > 91) root -= 12;
  else if (Math.min(...ms) < 50) root += 12;
  const chord = p.premium >= 1 || p.energy >= 1 ? true : r() < 0.4;
  const reverb = clamp(0.25 + p.premium * 0.12 + (inst === 'pad' || inst === 'bell' ? 0.15 : 0) - (inst === 'chip' ? 0.2 : 0), 0.05, 0.75);
  const logo = { v: 1, idx, style, scale, keyIdx, root, bpm, inst, notes, chord, bass: p.warmth >= 1 || p.energy >= 1, reverb: Math.round(reverb * 100) / 100, sylls: useTone ? sylls.slice(0, 6) : null };
  logo.name = (STYLE_NAMES[style]) + '・' + INSTRUMENTS[inst].label.replace(/^\S+\s/, '');
  return logo;
}

export function generateSet(brand, count = 6, offset = 0) {
  const out = [];
  const seen = new Set();
  for (let i = 0; out.length < count && i < count * 4; i++) {
    const l = generate(brand, i + offset);
    const key = l.notes.map(x => x.deg + ':' + x.dur).join(',') + l.inst;
    if (seen.has(key)) continue;
    seen.add(key); out.push(l);
  }
  return out;
}

/* ---------- 換算成可播放的音符事件 ---------- */
export function noteMidi(logo, n) { return logo.root + degToSemi(n.deg, logo.scale); }
export function toEvents(logo, variant = 'std') {
  const spb = 60 / logo.bpm;
  let notes = logo.notes.map(n => ({ ...n }));
  if (variant === 'short') notes = notes.slice(0, Math.min(3, notes.length)).map((n, i, a) => ({ ...n, dur: i === a.length - 1 ? Math.max(n.dur, 1) : n.dur }));
  const ev = [];
  let t = 0.05;
  const reps = variant === 'long' ? 2 : 1;
  for (let rep = 0; rep < reps; rep++) {
    notes.forEach((n, i) => {
      const last = i === notes.length - 1;
      const dur = (last && rep < reps - 1 ? Math.min(n.dur, 1) : n.dur) * spb;
      ev.push({ t, dur, midi: noteMidi(logo, n), vel: n.vel * (rep === 1 ? 1 : (reps > 1 ? 0.85 : 1)), part: 'lead' });
      t += dur;
    });
  }
  const lastEv = ev[ev.length - 1];
  if (logo.chord || variant === 'long') {
    const tonicMidi = logo.root;
    const third = logo.root + (logo.scale === 'dorian' || logo.scale === 'minpent' ? 3 : 4);
    const fifth = logo.root + 7;
    const start = lastEv.t;
    const len = lastEv.dur + (variant === 'long' ? 1 : 0.3);
    [tonicMidi - 12, third - 12, fifth - 12].forEach(m => ev.push({ t: start, dur: len, midi: m, vel: 0.35, part: 'chord' }));
  }
  if (logo.bass) ev.push({ t: lastEv.t, dur: lastEv.dur + 0.2, midi: logo.root - 24, vel: 0.5, part: 'bass' });
  const tail = (INSTRUMENTS[logo.inst] || INSTRUMENTS.epiano).tail + logo.reverb * 1.5;
  const total = Math.max(...ev.map(e => e.t + e.dur)) + tail;
  return { events: ev, total: Math.min(total, 12) };
}
export function durationSec(logo, variant = 'std') { return toEvents(logo, variant).total; }

/* ---------- 辨識度健檢（規則式，自訂評分） ---------- */
export function evaluate(logo) {
  const ms = logo.notes.map(n => noteMidi(logo, n));
  const iv = ms.slice(1).map((m, i) => m - ms[i]);
  const tips = [];
  let score = 40;
  const n = ms.length;
  // 1. 長度：3～5 音最好記
  if (n >= 3 && n <= 5) { score += 12; } else { score += 4; tips.push({ ok: false, t: `${n} 個音：聲音 Logo 通常 3～5 個音最好記，太長會變成一段歌。` }); }
  // 2. 有沒有「跳」：至少一個 ≥ 4 半音的跳進，記憶點才明顯
  const leaps = iv.filter(x => Math.abs(x) >= 4).length;
  if (leaps >= 1) score += 12; else tips.push({ ok: false, t: '全部都是一步一步走的音，像在練音階；加一個大一點的跳躍（例如 Do→Sol）會更有記憶點。' });
  // 3. 不要整串同方向的音階
  const allUp = iv.every(x => x > 0 && x <= 2), allDown = iv.every(x => x < 0 && x >= -2);
  if (allUp || allDown) { score -= 10; tips.push({ ok: false, t: '整串都是相鄰音一路往同方向走，跟「Do Re Mi」太像，辨識度低。' }); }
  // 4. 方向變化：有轉折
  const turns = iv.slice(1).filter((x, i) => Math.sign(x) !== Math.sign(iv[i]) && x !== 0 && iv[i] !== 0).length;
  if (turns >= 1) score += 8; else if (n >= 4) tips.push({ ok: false, t: '旋律沒有轉折，試著讓中間某個音往回走一下。' });
  // 5. 音域：一個八度內好唱好記；太窄沒特色
  const range = Math.max(...ms) - Math.min(...ms);
  if (range >= 5 && range <= 14) score += 8;
  else if (range < 5) tips.push({ ok: false, t: `音域只有 ${range} 個半音，聽起來有點平，可以把最高音再拉高一點。` });
  else { score -= 4; tips.push({ ok: false, t: `音域 ${range} 個半音偏寬，一般人哼不出來，傳播力會下降。` }); }
  // 6. 節奏有長短變化
  const durs = new Set(logo.notes.slice(0, -1).map(x => x.dur));
  if (durs.size >= 2) score += 6; else tips.push({ ok: false, t: '每個音一樣長，像電話按鍵音；讓其中一個音短一點或長一點會更有個性。' });
  // 7. 結尾落在穩定音（主音／五音／三音）
  const endPc = (((ms[n - 1] - logo.root) % 12) + 12) % 12;
  const stable = [0, 7, 4, 3].includes(endPc);
  if (stable) { score += 6; tips.push({ ok: true, t: endPc === 0 ? '結尾回到主音，聽起來「說完了」，給人安心、可信賴的感覺。' : '結尾停在穩定的音上，收得乾淨。' }); }
  else { tips.push({ ok: true, t: '結尾停在不穩定的音上，有「還沒說完、期待下一步」的感覺，適合 App 開啟或招呼音；正式收尾可考慮改回主音。' }); }
  // 8. 長度（秒）
  const sec = durationSec(logo, 'std');
  if (sec <= 3.5) score += 6; else { score -= 4; tips.push({ ok: false, t: `標準版約 ${sec.toFixed(1)} 秒，超過 3 秒在 App 或短影音裡容易被跳過。` }); }
  if (leaps >= 1) tips.push({ ok: true, t: '有明顯的跳躍音程，是最容易被記住的地方。' });
  if (n >= 3 && n <= 5) tips.push({ ok: true, t: `${n} 個音，長度剛好，一聽就能哼出來。` });
  return { score: clamp(Math.round(score), 0, 100), tips, range, sec };
}

/* ---------- 文字說明 ---------- */
export function explain(logo, brand) {
  const sc = SCALES[logo.scale], ins = INSTRUMENTS[logo.inst];
  const lines = [];
  lines.push(`音階：${sc.label}——${sc.mood}。`);
  lines.push(`樂器：${ins.label}——${ins.desc}。`);
  lines.push(`速度：每分鐘 ${logo.bpm} 拍，${logo.bpm >= 125 ? '偏快，有活力' : logo.bpm <= 95 ? '偏慢，從容穩重' : '中等，自然不急促'}。`);
  const why = {
    0: '旋律一路往上走，像在打招呼、開門迎客，給人積極正面的感覺。',
    1: '從高處落回主音，像一句話說完點頭，最能傳達「可靠、放心」。',
    2: '開頭就有大跳躍，第一秒就抓住耳朵，記憶點最強。',
    3: '三連音帶出輕快的彈跳感，親切、俏皮。',
    4: '沿著和弦往上疊，聲音飽滿、有儀式感，適合片頭與開場。',
    5: '前後兩段互相呼應，像一問一答，好記也好延伸成廣告配樂。',
    6: '旋律高低跟著品牌名的國語聲調走，聽起來就像在「唱」店名。',
  };
  lines.push(`結構：${why[logo.style]}`);
  if (logo.chord) lines.push('收尾加了一個柔和的和弦墊底，聲音比較完整、有質感。');
  if (logo.reverb >= 0.45) lines.push('殘響比較長，空間感大，帶出高級與沉浸感。');
  return lines;
}

export function guideMarkdown(logo, brand, evalRes) {
  const ms = logo.notes.map(n => noteMidi(logo, n));
  const nm = brand.name || '（未命名品牌）';
  const lines = [];
  lines.push(`# ${nm} 聲音品牌說明書`, '');
  lines.push(`- 聲音 Logo 名稱：${logo.name}`);
  lines.push(`- 調性：${KEYS[logo.keyIdx]} ${SCALES[logo.scale].label}`);
  lines.push(`- 速度：${logo.bpm} BPM`);
  lines.push(`- 主要樂器：${INSTRUMENTS[logo.inst].label.replace(/^\S+\s/, '')}`);
  lines.push(`- 音符：${ms.map(m => midiName(m) + '（' + solfa(m, logo.keyIdx) + '）').join(' → ')}`);
  lines.push(`- 標準版長度：約 ${durationSec(logo, 'std').toFixed(1)} 秒；短版：約 ${durationSec(logo, 'short').toFixed(1)} 秒；加長版：約 ${durationSec(logo, 'long').toFixed(1)} 秒`);
  lines.push(`- 辨識度健檢：${evalRes.score} / 100（本工具自訂的規則式評分，僅供參考）`, '');
  lines.push('## 這個聲音想傳達什麼', '');
  explain(logo, brand).forEach(l => lines.push('- ' + l));
  lines.push('', '## 使用規範', '');
  lines.push('- **短版**（前 3 個音）：App 開啟、通知、按鈕回饋、LINE 官方帳號歡迎訊息影片。');
  lines.push('- **標準版**：短影音片頭片尾、門市自動門／結帳完成提示、Podcast 開場。');
  lines.push('- **加長版**（旋律重複＋和弦收尾）：廣告結尾、活動開場、展場與電話等候音。');
  lines.push('- 同一個品牌在所有接觸點都用同一段旋律，只改長度與樂器，不要每個平台各用一首。');
  lines.push('- 音量：片尾 Logo 建議比背景音樂高 3～6 dB；門市播放注意不要太大聲。');
  lines.push('- 可以換樂器做節慶版（例如過年改木琴、聖誕改鐘聲），但音符與節奏維持不變，辨識度才會累積。');
  lines.push('', '## 注意事項', '');
  lines.push('- 旋律由規則式組合產生，**不保證與既有商標聲音或歌曲不相似**；正式商用或申請聲音商標前，請先到經濟部智慧財產局商標檢索系統查詢，並請專業人士確認。');
  lines.push('', '— 由「品牌聲音 Logo 產生器」產生（創作者：蔡豐全 Mark Tsai）');
  return lines.join('\n');
}

/* ---------- 分享連結編碼 ---------- */
export function encodeShare(obj) {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); });
  return (typeof btoa === 'function' ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodeShare(s) {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) { return null; }
}
export function validLogo(l) {
  return !!(l && Array.isArray(l.notes) && l.notes.length >= 1 && l.notes.length <= 12 && SCALES[l.scale] && INSTRUMENTS[l.inst]
    && l.notes.every(n => Number.isFinite(n.deg) && Number.isFinite(n.dur) && n.dur > 0 && n.dur <= 4) && l.bpm >= 50 && l.bpm <= 200);
}

/* ---------- WAV 編碼（16-bit PCM） ---------- */
export function encodeWAV(channels, sampleRate) {
  const nCh = channels.length, len = channels[0].length;
  const buf = new ArrayBuffer(44 + len * nCh * 2);
  const v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + len * nCh * 2, true); w(8, 'WAVE');
  w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nCh, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * nCh * 2, true); v.setUint16(32, nCh * 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, len * nCh * 2, true);
  let o = 44;
  for (let i = 0; i < len; i++) for (let c = 0; c < nCh; c++) {
    const s = clamp(channels[c][i], -1, 1);
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2;
  }
  return new Uint8Array(buf);
}
// 正規化：峰值不超過 -1 dBFS，且「有聲音的部分」平均能量不超過 targetRms（方波、口哨這類能量大的音色才不會特別大聲）；最後 10ms 淡出避免爆音
export function normalize(channels, sampleRate, target = 0.89, targetRms = 0.2) {
  let peak = 0, sum = 0, cnt = 0;
  channels.forEach(ch => { for (let i = 0; i < ch.length; i++) { const a = Math.abs(ch[i]); if (a > peak) peak = a; if (a > 0.003) { sum += a * a; cnt++; } } });
  const rms = cnt ? Math.sqrt(sum / cnt) : 0;
  const g = peak > 0 ? Math.min(target / peak, rms > 0 ? (targetRms / rms) : Infinity) : 1;
  const fade = Math.floor(sampleRate * 0.01);
  channels.forEach(ch => { for (let i = 0; i < ch.length; i++) { ch[i] *= g; if (i > ch.length - fade) ch[i] *= (ch.length - i) / fade; } });
  return { peak, rms, gain: g };
}

/* ---------- MIDI 編碼（SMF type 0） ---------- */
export function encodeMIDI(logo, variant = 'std') {
  const { events } = toEvents(logo, variant);
  const PPQ = 480, spb = 60 / logo.bpm;
  const tick = s => Math.round((s / spb) * PPQ);
  const msgs = [];
  events.forEach(e => {
    const ch = e.part === 'lead' ? 0 : e.part === 'chord' ? 1 : 2;
    const vel = clamp(Math.round(e.vel * 110), 1, 127);
    msgs.push({ t: tick(e.t), d: [0x90 | ch, clamp(e.midi, 0, 127), vel], o: 1 });
    msgs.push({ t: tick(e.t + e.dur), d: [0x80 | ch, clamp(e.midi, 0, 127), 0], o: 0 });
  });
  msgs.sort((a, b) => a.t - b.t || a.o - b.o);
  const vlq = n => { const b = [n & 0x7f]; while ((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; };
  const prog = { bell: 14, marimba: 12, epiano: 4, pluck: 24, synth: 80, chip: 80, pad: 88, whistle: 78, drop: 11 }[logo.inst] || 0;
  const us = Math.round(spb * 1e6);
  const trk = [0, 0xff, 0x51, 0x03, (us >> 16) & 0xff, (us >> 8) & 0xff, us & 0xff,
    0, 0xc0, prog, 0, 0xc1, 89, 0, 0xc2, 33];
  let last = 0;
  msgs.forEach(m => { trk.push(...vlq(m.t - last), ...m.d); last = m.t; });
  trk.push(0, 0xff, 0x2f, 0x00);
  const head = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (PPQ >> 8) & 0xff, PPQ & 0xff];
  const len = trk.length;
  return new Uint8Array([...head, 0x4d, 0x54, 0x72, 0x6b, (len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff, ...trk]);
}
