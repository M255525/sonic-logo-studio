// 品牌聲音 Logo 產生器 — AI 助理（自備金鑰 BYOK）＋免金鑰規則式解析
// 原則：AI 只負責「把白話翻成設定」，旋律仍由 engine.js 規則產生；AI 回傳的每個值都先經過 sanitize 夾在合法範圍內。
// 這個檔不碰 DOM，callLLM 以外的函式都可以在 Node 測試（tools/test_engine.mjs）。
import * as E from './engine.js';

/* ---------- 服務商（與開店前置清單 ai.js 同一套） ---------- */
export function geminiModelFix(m) {
  const r = { 'gemini-2.5-flash': 'gemini-3.6-flash', 'gemini-2.5-flash-lite': 'gemini-3.5-flash-lite', 'gemini-2.5-pro': 'gemini-3.8-flash', 'gemini-2.0-flash': 'gemini-3.6-flash', 'gemini-2.0-flash-001': 'gemini-3.6-flash', 'gemini-2.0-flash-lite': 'gemini-3.1-flash-lite', 'gemini-1.5-flash': 'gemini-3.6-flash', 'gemini-1.5-pro': 'gemini-3.1-pro-preview', 'gemini-3-pro': 'gemini-3.1-pro-preview', 'gemini-3-pro-preview': 'gemini-3.1-pro-preview', 'gemini-3.5-pro': 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite-preview': 'gemini-3.1-flash-lite' };
  m = String(m || '').trim().replace(/^models\//, ''); return r[m] || m;
}
export const PROVIDERS = {
  gemini: { label: 'Gemini（Google AI Studio）', models: [['gemini-3.5-flash', 'Gemini 3.5 Flash（均衡，推薦）'], ['gemini-3.1-pro-preview', 'Gemini 3.1 Pro 預覽版（最強）'], ['gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite（快速省錢）']] },
  openai: { label: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions', models: [['gpt-5-mini', 'GPT-5 mini（均衡，推薦）'], ['gpt-5', 'GPT-5（最強）'], ['gpt-4o-mini', 'GPT-4o mini（快速省錢）']] },
  claude: { label: 'Claude（Anthropic）', models: [['claude-sonnet-5-5', 'Claude Sonnet 5.5（均衡，推薦）'], ['claude-opus-5-5', 'Claude Opus 5.5（最強）'], ['claude-haiku-5-5', 'Claude Haiku 5.5（快速省錢）']] },
  openrouter: { label: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions', models: [['openai/gpt-4o-mini', 'OpenAI GPT-4o mini（推薦）'], ['google/gemini-2.5-flash', 'Google Gemini 2.5 Flash'], ['anthropic/claude-sonnet-4.5', 'Anthropic Claude Sonnet 4.5']] },
  xai: { label: 'xAI Grok', url: 'https://api.x.ai/v1/chat/completions', models: [['grok-4', 'Grok 4'], ['grok-3-mini', 'Grok 3 mini']] },
  deepseek: { label: 'DeepSeek', url: 'https://api.deepseek.com/chat/completions', models: [['deepseek-chat', 'DeepSeek Chat（推薦）'], ['deepseek-reasoner', 'DeepSeek Reasoner（推理）']] },
  custom: { label: '自訂（OpenAI 相容端點，例如 Ollama、LM Studio）', models: [] },
};
export function normCfg(c) { c = Object.assign({}, c || {}); if (!PROVIDERS[c.provider]) c.provider = 'gemini'; return c; }
export function aiModel(c) { c = normCfg(c); return (c.modelCustom || '').trim() || c.model || ((PROVIDERS[c.provider].models[0]) || [''])[0]; }
export function aiReady(c) { c = normCfg(c); return c.provider === 'custom' ? !!(c.base || '').trim() && !!aiModel(c) : !!(c.key || '').trim(); }
export function aiStatus(c) { c = normCfg(c); return aiReady(c) ? PROVIDERS[c.provider].label.replace(/（.*/, '') + '・' + aiModel(c) : '未設定（使用免金鑰規則解析）'; }
function customUrl(base) { base = (base || '').trim().replace(/\/+$/, ''); return /\/chat\/completions$/.test(base) ? base : base + '/chat/completions'; }

export async function callLLM(c, prompt, onStatus) {
  c = normCfg(c);
  const provider = c.provider, model = aiModel(c), key = (c.key || '').trim();
  let url, headers, body, extract;
  if (provider === 'claude') {
    url = 'https://api.anthropic.com/v1/messages';
    headers = { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' };
    body = { model, max_tokens: 2000, messages: [{ role: 'user', content: prompt }] };
    extract = d => (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  } else if (provider !== 'gemini') {
    url = provider === 'custom' ? customUrl(c.base) : PROVIDERS[provider].url;
    headers = { 'content-type': 'application/json' };
    if (key) headers.authorization = 'Bearer ' + key;
    body = { model, messages: [{ role: 'user', content: prompt }] };
    extract = d => d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
  } else {
    url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(geminiModelFix(model)) + ':generateContent';
    headers = { 'content-type': 'application/json', 'x-goog-api-key': key };
    body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } };
    extract = d => ((d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || []).map(p => p.text || '').join('');
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(90000) });
    const raw = await resp.text();
    if (resp.ok) { const t = extract(JSON.parse(raw)); if (!t) throw new Error('回應中沒有文字內容'); return t; }
    let em = raw.slice(0, 200);
    try { const e = JSON.parse(raw); em = (e.error && e.error.message) || e.message || em; } catch (x) {}
    if ({ 429: 1, 500: 1, 503: 1, 529: 1 }[resp.status] && attempt < 3) { if (onStatus) onStatus(`服務忙碌（${resp.status}），${attempt * 5} 秒後重試…`); await new Promise(r => setTimeout(r, attempt * 5000)); continue; }
    throw new Error('HTTP ' + resp.status + '：' + em);
  }
}
export function parseJson(txt) {
  const s = String(txt || '').replace(/```(?:json)?/g, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('AI 回傳的不是 JSON');
  return JSON.parse(s.slice(a, b + 1));
}

/* ---------- 小工具 ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const int = (v, a, b, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? clamp(n, a, b) : d; };
const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const has = (t, words) => words.some(w => t.includes(w));
function count(t, words) { return words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0); }
const DUR_OK = [0.25, 0.33, 0.5, 0.75, 1, 1.5, 2, 3];
const snapDur = d => DUR_OK.reduce((b, x) => (Math.abs(x - d) < Math.abs(b - d) ? x : b), 0.5);

/* ---------- 1. 品牌描述 → 設定 ---------- */
const AXIS_HELP = {
  energy: '活潑(-2) … 穩重(2)：影響速度與音域',
  premium: '親民(-2) … 高級(2)：影響樂器與殘響（空間感）',
  tech: '自然(-2) … 科技(2)：影響音階與音色',
  warmth: '溫暖(-2) … 酷感(2)：影響調式與低音',
};
export function brandPrompt(text, brand) {
  const inds = Object.entries(E.INDUSTRIES).map(([k, v]) => `${k}=${v.label}`).join('、');
  return `你是品牌聲音（sonic logo）顧問，使用者不懂音樂。請讀使用者對品牌的白話描述，幫他填好聲音 Logo 產生器的設定。
只回傳一個 JSON 物件，不要其他文字，格式：
{
 "name": "品牌名稱（描述裡有就用，沒有就沿用目前的「${brand.name || ''}」，都沒有就給空字串，不要自己取名）",
 "industry": "下列其中一個代碼：${inds}",
 "energy": 整數 -2～2（${AXIS_HELP.energy}）,
 "premium": 整數 -2～2（${AXIS_HELP.premium}）,
 "tech": 整數 -2～2（${AXIS_HELP.tech}）,
 "warmth": 整數 -2～2（${AXIS_HELP.warmth}）,
 "notes": "auto" 或 3～6 的整數（品牌名稱超過 5 個字建議 4；要當 App 提示音建議 3）,
 "length": "short"（短促）| "std"（標準）| "long"（餘韻長）,
 "slogan": "依描述寫一句 12 字內的中文標語（描述裡有標語就用原文）",
 "color": "#rrggbb 品牌主色（描述有提到顏色就用，沒有就依品牌感覺挑）",
 "reason": "用 2～3 句不懂音樂的人也看得懂的話，說明為什麼這樣設定"
}
不要回傳國語聲調（工具會請使用者自己選），不要提到任何真實存在的品牌或廣告歌。

使用者的描述：
${String(text).slice(0, 1500)}`;
}
export function sanitizeBrand(j, brand) {
  j = j || {};
  const out = {};
  const name = str(j.name, 20); if (name) out.name = name;
  if (E.INDUSTRIES[j.industry]) out.industry = j.industry;
  for (const a of E.AXES) { const v = int(j[a.key], -2, 2, null); if (v !== null) out[a.key] = v; }
  if (j.notes === 'auto') out.notes = 'auto'; else { const n = int(j.notes, 3, 6, null); if (n !== null) out.notes = n; }
  if (['short', 'std', 'long'].includes(j.length)) out.length = j.length;
  const sl = str(j.slogan, 24); if (sl) out.slogan = sl;
  if (/^#[0-9a-f]{6}$/i.test(String(j.color || ''))) out.color = String(j.color).toLowerCase();
  out.reason = str(j.reason, 300);
  // 名稱很長但 AI 叫我們「依名稱」→ 改成 4 個音，避免 6 音太長
  const nm = out.name || (brand && brand.name) || '';
  if ((out.notes === 'auto' || out.notes == null) && E.nameSyllables(nm).length > 5) out.notes = 4;
  return out;
}
// 免金鑰：關鍵字判斷產業與個性
const IND_WORDS = {
  food: ['小吃', '餐廳', '便當', '豆花', '麵', '飯', '滷', '雞排', '早餐', '火鍋', '燒烤', '餐飲', '美食', '夜市'],
  cafe: ['咖啡', '甜點', '蛋糕', '烘焙', '麵包', '茶飲', '手搖', '下午茶', '冰品'],
  tech: ['app', 'App', 'APP', '軟體', '科技', '平台', 'AI', '雲端', '系統', '新創', '網站', '程式'],
  finance: ['保險', '銀行', '理財', '投資', '金融', '貸款', '會計', '記帳士', '證券'],
  beauty: ['美妝', '保養', '美容', '化妝', '香氛', 'SPA', 'spa', '美甲', '美髮', '保健'],
  edu: ['教育', '補習', '課程', '學校', '教學', '學習', '講師', '書'],
  care: ['醫療', '診所', '照護', '長照', '牙醫', '藥局', '復健', '醫院'],
  kids: ['兒童', '親子', '寶寶', '小朋友', '玩具', '幼兒', '童裝', '積木'],
  sport: ['運動', '健身', '瑜珈', '跑步', '球', '體能', '戶外'],
  farm: ['農', '果園', '蔬菜', '有機', '茶園', '水果', '產地', '小農'],
  hotel: ['民宿', '飯店', '旅館', '旅遊', '旅行', '觀光', '露營'],
  pet: ['寵物', '貓', '狗', '毛孩'],
  fashion: ['服飾', '衣', '潮', '鞋', '包包', '飾品', '穿搭'],
};
const FEEL = {
  energy: { neg: ['活潑', '熱鬧', '有活力', '年輕', '歡樂', '可愛', '俏皮', '快樂', '動感'], pos: ['穩重', '專業', '安心', '信賴', '可靠', '沉穩', '安全', '值得信任'] },
  premium: { neg: ['親民', '平價', '便宜', '大眾', '在地', '銅板', '接地氣', '家常'], pos: ['高級', '精品', '奢華', '質感', '高端', '優雅', '尊榮', '頂級'] },
  tech: { neg: ['自然', '手作', '天然', '懷舊', '古早', '傳統', '樸實', '有機', '森林'], pos: ['科技', '未來', '數位', '智慧', '創新', '俐落', '現代', '效率'] },
  warmth: { neg: ['溫暖', '溫馨', '療癒', '親切', '暖', '家', '柔和', '放鬆'], pos: ['酷', '個性', '街頭', '冷靜', '都會', '潮', '帥', '神祕'] },
};
export function ruleBrand(text, brand) {
  const t = String(text || '');
  const out = {}, why = [];
  let best = null, bestN = 0;
  for (const [k, ws] of Object.entries(IND_WORDS)) { const n = count(t, ws); if (n > bestN) { best = k; bestN = n; } }
  const base = best ? E.INDUSTRIES[best] : E.INDUSTRIES[brand.industry] || E.INDUSTRIES.general;
  if (best) { out.industry = best; why.push(`看到「${IND_WORDS[best].filter(w => t.includes(w)).slice(0, 2).join('、')}」→ 產業選「${E.INDUSTRIES[best].label}」`); }
  for (const a of E.AXES) {
    const f = FEEL[a.key], neg = count(t, f.neg), pos = count(t, f.pos);
    let v = base[a.key];
    if (neg || pos) { v = clamp(base[a.key] + (pos - neg) * 2, -2, 2); why.push(`${pos > neg ? a.right : a.left}（${(pos > neg ? f.pos : f.neg).filter(w => t.includes(w)).slice(0, 2).join('、')}）`); }
    out[a.key] = v;
  }
  if (has(t, ['提示音', '通知', 'App 開啟', '按鈕'])) { out.notes = 3; out.length = 'short'; why.push('要當提示音 → 3 個音、短促'); }
  else if (has(t, ['片頭', '廣告', '展場', '電話等候'])) { out.length = 'long'; why.push('用在片頭／廣告 → 餘韻長'); }
  const m = t.match(/(?:品牌|店名|叫做?|名稱是)[「『"]?([^\s，。,「」『』"]{2,12})/);
  if (m && !brand.name) out.name = m[1];
  const nm = out.name || brand.name || '';
  if (!out.notes && E.nameSyllables(nm).length > 5) { out.notes = 4; why.push('名稱超過 5 個字 → 用 4 個音'); }
  out.reason = why.length ? '免金鑰規則解析：' + why.join('；') + '。' : '免金鑰規則解析沒有找到明確的關鍵字，先維持目前設定。設定 AI 金鑰後可以讀懂更完整的描述。';
  return out;
}

/* ---------- 2. AI 幫我挑一個 ---------- */
export function describeLogo(l) {
  const ms = l.notes.map(n => E.noteMidi(l, n));
  const ev = E.evaluate(l);
  return `${l.name}｜${E.SCALES[l.scale].label}（${E.SCALES[l.scale].mood}）｜樂器 ${E.INSTRUMENTS[l.inst].label.replace(/^\S+\s/, '')}（${E.INSTRUMENTS[l.inst].desc}）｜每分鐘 ${l.bpm} 拍｜音符 ${ms.map(m => E.solfa(m, l.keyIdx)).join(' ')}｜約 ${E.durationSec(l).toFixed(1)} 秒｜辨識度 ${ev.score}`;
}
export function pickPrompt(cands, brand, desc) {
  return `你是品牌聲音顧問，使用者不懂音樂。下面是同一個品牌的 ${cands.length} 個聲音 Logo 候選，請挑出最適合這個品牌的一個。
品牌：${brand.name || '（未命名）'}；產業：${(E.INDUSTRIES[brand.industry] || {}).label || ''}；標語：${brand.slogan || '（無）'}
${desc ? '使用者對品牌的描述：' + String(desc).slice(0, 800) + '\n' : ''}候選：
${cands.map((c, i) => String.fromCharCode(65 + i) + '. ' + describeLogo(c)).join('\n')}

只回傳 JSON：{"pick":"A～${String.fromCharCode(64 + cands.length)} 其中一個字母","reason":"用 2～3 句白話說明為什麼適合，不要用樂理術語","runnerUp":"第二名字母","tip":"一句話建議可以怎麼微調，例如換什麼樂器或快慢"}`;
}
export function sanitizePick(j, n) {
  j = j || {};
  const idx = l => { const c = String(l || '').trim().toUpperCase().charCodeAt(0) - 65; return c >= 0 && c < n ? c : -1; };
  const pick = idx(j.pick);
  if (pick < 0) throw new Error('AI 沒有回傳有效的候選字母');
  const ru = idx(j.runnerUp);
  return { pick, runnerUp: ru === pick ? -1 : ru, reason: str(j.reason, 300), tip: str(j.tip, 160) };
}
export function rulePick(cands, brand) {
  // 免金鑰：分數為主，產業偏好的樂器加分，超過 3.5 秒扣分
  const pref = { food: ['marimba', 'pluck'], cafe: ['epiano', 'marimba'], tech: ['synth', 'drop'], finance: ['bell', 'epiano'], beauty: ['bell', 'pad'], edu: ['epiano', 'marimba'], care: ['epiano', 'pad'], kids: ['marimba', 'chip'], sport: ['synth', 'pluck'], farm: ['pluck', 'whistle', 'marimba'], hotel: ['bell', 'pad'], pet: ['marimba', 'whistle'], fashion: ['synth', 'pluck'] }[brand.industry] || [];
  const sc = cands.map(c => E.evaluate(c).score + (pref.includes(c.inst) ? 8 : 0) - (E.durationSec(c) > 3.5 ? 15 : 0));
  const order = sc.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]);
  const c = cands[order[0][1]];
  return { pick: order[0][1], runnerUp: order[1] ? order[1][1] : -1, reason: `免金鑰規則挑選：辨識度 ${E.evaluate(c).score} 分${pref.includes(c.inst) ? `，而且「${E.INSTRUMENTS[c.inst].label.replace(/^\S+\s/, '')}」適合${E.INDUSTRIES[brand.industry].label}` : ''}，長度約 ${E.durationSec(c).toFixed(1)} 秒。`, tip: '' };
}

/* ---------- 3. 白話調整 ---------- */
export function adjustPrompt(logo, brand, request) {
  const st = E.SCALES[logo.scale].steps.length;
  const notes = logo.notes.map((n, i) => `${i + 1}. deg=${n.deg}（${E.solfa(E.noteMidi(logo, n), logo.keyIdx)}）dur=${n.dur}`).join('\n');
  return `你是品牌聲音顧問，使用者不懂音樂，用白話告訴你想怎麼改他的聲音 Logo。請把需求翻成下面的設定修改。
品牌：${brand.name || '（未命名）'}（${(E.INDUSTRIES[brand.industry] || {}).label || ''}）
目前設定：樂器 ${logo.inst}、音階 ${logo.scale}（每八度 ${st} 個音級）、每分鐘 ${logo.bpm} 拍、殘響 ${logo.reverb}、收尾和弦 ${logo.chord}、收尾低音 ${logo.bass}、約 ${E.durationSec(logo).toFixed(1)} 秒、辨識度 ${E.evaluate(logo).score}
目前音符（deg＝在目前音階裡的第幾級，0 是主音 Do，${st} 是高八度的 Do，負數往下；dur＝拍數）：
${notes}

可用樂器：${Object.entries(E.INSTRUMENTS).map(([k, v]) => `${k}（${v.desc}）`).join('、')}
可用音階：${Object.entries(E.SCALES).map(([k, v]) => `${k}（${v.mood}）`).join('、')}
dur 只能是 ${DUR_OK.join('、')}；音符 3～8 個；最後一個音通常最長。結尾回到 deg 0（或 ${st}）會有「說完了、安心」的感覺。好記的聲音 Logo 通常 3～5 個音、至少一個跳躍、3 秒內。

只回傳 JSON，只放需要改的欄位，其他省略：
{"inst":"樂器代碼","scale":"音階代碼","bpm":60～180,"reverb":0～0.9,"octave":-1 或 1（整段降／升八度）,"chord":true/false,"bass":true/false,
 "notes":[{"deg":整數,"dur":數字}]（要改旋律或長度時才給完整的新音符陣列）,
 "explain":"用 1～3 句白話說明你改了什麼、聽起來會有什麼不同，不要用樂理術語"}
不要模仿任何真實存在的品牌聲音或歌曲。

使用者的需求：${String(request).slice(0, 600)}`;
}
// 回傳 { patch, changes[] }；patch 只含合法值，套用交給 applyPatch
export function sanitizeAdjust(j, logo) {
  j = j || {};
  const p = {}, ch = [];
  if (E.INSTRUMENTS[j.inst] && j.inst !== logo.inst) { p.inst = j.inst; ch.push('樂器 → ' + E.INSTRUMENTS[j.inst].label); }
  if (E.SCALES[j.scale] && j.scale !== logo.scale) { p.scale = j.scale; ch.push('音階 → ' + E.SCALES[j.scale].label); }
  const bpm = int(j.bpm, 60, 180, null); if (bpm !== null && bpm !== logo.bpm) { p.bpm = bpm; ch.push(`速度 ${logo.bpm} → ${bpm}`); }
  if (j.reverb != null && Number.isFinite(+j.reverb)) { const r = Math.round(clamp(+j.reverb, 0, 0.9) * 20) / 20; if (Math.abs(r - logo.reverb) > 0.02) { p.reverb = r; ch.push(`殘響 ${Math.round(logo.reverb * 100)}% → ${Math.round(r * 100)}%`); } }
  const oc = int(j.octave, -1, 1, 0); if (oc) { p.octave = oc; ch.push(oc > 0 ? '整段升高八度' : '整段降低八度'); }
  if (typeof j.chord === 'boolean' && j.chord !== !!logo.chord) { p.chord = j.chord; ch.push(j.chord ? '加上收尾和弦' : '拿掉收尾和弦'); }
  if (typeof j.bass === 'boolean' && j.bass !== !!logo.bass) { p.bass = j.bass; ch.push(j.bass ? '加上收尾低音' : '拿掉收尾低音'); }
  if (Array.isArray(j.notes) && j.notes.length >= 3) {
    const st = E.SCALES[p.scale || logo.scale].steps.length;
    const ns = j.notes.slice(0, 8).map(n => ({ deg: int(n && n.deg, -st, st * 2, 0), dur: snapDur(Number(n && n.dur) || 0.5), vel: 0.85 }));
    ns[0].vel = 0.95; ns[ns.length - 1].vel = 0.95;
    const same = ns.length === logo.notes.length && ns.every((n, i) => n.deg === logo.notes[i].deg && n.dur === logo.notes[i].dur);
    if (!same) { p.notes = ns; ch.push(`旋律改成 ${ns.length} 個音`); }
  }
  return { patch: p, changes: ch, explain: str(j.explain, 300) };
}
export function applyPatch(logo, patch) {
  const l = JSON.parse(JSON.stringify(logo));
  if (patch.scale && patch.scale !== l.scale && !patch.notes) {
    // 換音階但沒給新旋律：保留每個音大約的位置
    l.notes.forEach(n => { const s = E.degToSemi(n.deg, l.scale); let best = 0, bd = 99; for (let d = -10; d <= 20; d++) { const x = Math.abs(E.degToSemi(d, patch.scale) - s); if (x < bd) { bd = x; best = d; } } n.deg = best; });
  }
  ['inst', 'scale', 'bpm', 'reverb', 'chord', 'bass'].forEach(k => { if (patch[k] !== undefined) l[k] = patch[k]; });
  if (patch.notes) l.notes = patch.notes.map(n => ({ ...n }));
  if (patch.octave) l.root += 12 * patch.octave;
  // 音域保護（與 engine 相同）
  const ms = l.notes.map(n => E.noteMidi(l, n));
  if (Math.max(...ms) > 96) l.root -= 12; else if (Math.min(...ms) < 43) l.root += 12;
  return l;
}
// 免金鑰：常見白話 → 調整
export function ruleAdjust(text, logo) {
  const t = String(text || ''), j = {}, why = [];
  const st = E.SCALES[logo.scale].steps.length;
  const more = (w) => has(t, w);
  if (more(['溫暖', '溫馨', '親切', '柔和', '療癒'])) { j.inst = logo.inst === 'marimba' ? 'epiano' : 'marimba'; j.reverb = Math.min(0.45, logo.reverb + 0.1); why.push('溫暖 → 換成圓潤的樂器、加一點空間感'); }
  if (more(['科技', '未來', '現代', '數位', '俐落'])) { j.inst = logo.inst === 'synth' ? 'drop' : 'synth'; if (logo.scale !== 'lydian') j.scale = 'lydian'; why.push('科技感 → 合成器音色＋夢幻的利地安音階'); }
  if (more(['高級', '質感', '優雅', '精品', '奢華'])) { j.inst = 'bell'; j.reverb = Math.max(0.5, logo.reverb); j.chord = true; why.push('高級 → 鐘聲＋長殘響＋和弦墊底'); }
  if (more(['可愛', '童趣', '俏皮', '電玩'])) { j.inst = more(['電玩']) ? 'chip' : 'marimba'; j.bpm = Math.min(170, logo.bpm + 18); why.push('可愛 → 輕巧的樂器、快一點'); }
  if (more(['自然', '手作', '戶外', '清新'])) { j.inst = more(['戶外']) ? 'whistle' : 'pluck'; why.push('自然 → 撥弦／口哨'); }
  if (more(['酷', '個性', '街頭', '帥'])) { j.scale = 'minpent'; j.bass = true; why.push('酷 → 小調五聲音階＋低音'); }
  if (more(['快', '活潑', '有活力', '輕快'])) { j.bpm = Math.min(170, (j.bpm || logo.bpm) + 18); why.push('快一點'); }
  if (more(['慢', '穩', '從容', '沉穩'])) { j.bpm = Math.max(70, logo.bpm - 18); why.push('慢一點'); }
  if (more(['安心', '信賴', '可靠', '收尾', '結束感'])) { const ns = logo.notes.map(n => ({ ...n })); ns[ns.length - 1].deg = ns[ns.length - 2] && ns[ns.length - 2].deg > st / 2 ? st : 0; j.notes = ns; why.push('安心 → 結尾回到主音 Do'); j.chord = true; j.bpm = Math.max(70, (j.bpm || logo.bpm) - 8); why.push('加和弦墊底、稍微放慢，收得更穩'); }
  if (more(['短', '精簡', '提示音', '太長'])) {
    let ns = logo.notes.map(n => ({ ...n }));
    if (ns.length > 4) ns = ns.slice(0, 3).concat([ns[ns.length - 1]]);
    ns.forEach((n, i) => { if (i < ns.length - 1) n.dur = Math.min(n.dur, 0.5); else n.dur = 1; });
    j.notes = ns; j.reverb = Math.min(logo.reverb, 0.25); why.push('短一點 → 減少音符、縮短尾音與殘響');
  }
  if (more(['長一點', '有餘韻', '大器'])) { const ns = logo.notes.map(n => ({ ...n })); ns[ns.length - 1].dur = 2; j.notes = ns; j.chord = true; why.push('有餘韻 → 尾音拉長＋和弦'); }
  if (more(['好記', '記憶點', '特色', '辨識'])) {
    const ns = logo.notes.map(n => ({ ...n }));
    if (ns.length >= 3) { const i = 1; ns[i].deg = ns[0].deg + Math.round(st * 0.6); }   // 第二個音大跳
    j.notes = ns; why.push('更好記 → 第二個音改成大跳躍');
  }
  if (more(['明亮', '亮一點', '高一點', '高音', '清脆'])) { j.octave = 1; why.push('明亮 → 升高八度'); }
  if (more(['低沉', '低一點', '厚實'])) { j.octave = -1; why.push('低沉 → 降低八度'); }
  const r = sanitizeAdjust(j, logo);
  r.explain = why.length ? '免金鑰規則調整：' + why.join('；') + '。' : '';
  return r;
}
