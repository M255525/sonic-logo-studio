// node tools/test_ai.mjs — AI 助理的規則解析與安全檢查（不呼叫任何 API）
import * as E from '../engine.js';
import * as AI from '../ai.js';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
const b0 = { ...E.defaultBrand(), name: '' };
// ruleBrand
let r = AI.ruleBrand('我在台南開一家手工豆花店叫「阿嬤的豆花」，客人多是家庭和長輩，想要溫暖懷舊、讓人安心的感覺', b0);
ok(r.industry === 'food', '豆花→餐飲 ' + r.industry);
ok(r.warmth === -2 && r.tech === -2, '溫暖懷舊 ' + r.warmth + ' ' + r.tech);
ok(r.energy >= 1, '安心→穩重 ' + r.energy);
ok(r.name === '阿嬤的豆花', '抓名稱 ' + r.name);
ok(/規則/.test(r.reason), '說明');
r = AI.ruleBrand('記帳 App，給上班族用，要有科技感、俐落，主要當通知提示音', b0);
ok(r.industry === 'tech' && r.tech === 2 && r.notes === 3 && r.length === 'short', 'App 提示音 ' + JSON.stringify(r));
r = AI.ruleBrand('隨便', b0); ok(/沒有找到/.test(r.reason), '看不懂');
r = AI.ruleBrand('高級保養品', { ...b0, name: '霧島手作保養品牌' }); ok(r.notes === 4, '長名稱→4 音');
// sanitizeBrand
const sb = AI.sanitizeBrand({ name: 'X'.repeat(50), industry: 'nope', energy: 9, premium: '-1', tech: 'abc', warmth: -7, notes: 12, length: 'huge', color: 'red', slogan: '好', reason: 'r' }, b0);
ok(sb.name.length === 20 && !sb.industry && sb.energy === 2 && sb.premium === -1 && sb.tech === undefined && sb.warmth === -2 && sb.notes === 6 && !sb.length && !sb.color, 'sanitizeBrand 夾範圍 ' + JSON.stringify(sb));
ok(AI.sanitizeBrand({ color: '#A1B2C3', notes: 'auto', name: '阿' }, b0).color === '#a1b2c3', '顏色');
// pick
const brand = { ...E.defaultBrand(), ...E.INDUSTRIES.kids, industry: 'kids', name: '小象積木' }; delete brand.label;
const cands = E.generateSet(brand, 6);
ok(AI.pickPrompt(cands, brand, '描述').includes('F.'), '挑選提示詞列出 6 個');
ok(AI.sanitizePick({ pick: 'c', runnerUp: 'C' }, 6).pick === 2 && AI.sanitizePick({ pick: 'c', runnerUp: 'C' }, 6).runnerUp === -1, 'sanitizePick');
let threw = false; try { AI.sanitizePick({ pick: 'Z' }, 6); } catch (e) { threw = true; } ok(threw, '壞字母要丟錯');
const rp = AI.rulePick(cands, brand); ok(rp.pick >= 0 && rp.pick < 6 && rp.reason, 'rulePick');
// adjust
const logo = cands[1];
ok(AI.adjustPrompt(logo, brand, '再溫暖一點').includes('deg='), '調整提示詞');
let a = AI.sanitizeAdjust({ inst: 'violin', scale: 'blues', bpm: 999, reverb: 5, octave: 3, chord: 'yes', notes: [{ deg: 99, dur: 7 }, { deg: -99, dur: 0.1 }, { deg: 'x' }, { deg: 2, dur: 1 }, 1, 2, 3, 4, 5, 6] }, logo);
const p = a.patch;
ok(!p.inst && !p.scale && p.bpm === 180 && p.reverb === 0.9 && p.octave === 1 && p.chord === undefined, '夾範圍 ' + JSON.stringify(p));
ok(p.notes.length === 8 && p.notes.every(n => [0.25, 0.33, 0.5, 0.75, 1, 1.5, 2, 3].includes(n.dur)), '音符長度吸附');
const l2 = AI.applyPatch(logo, p);
ok(E.validLogo(l2), 'patch 後仍合法');
const ms = l2.notes.map(n => E.noteMidi(l2, n)); ok(Math.max(...ms) <= 108 && Math.min(...ms) >= 24, '音域 ' + ms);
ok(JSON.stringify(logo) !== JSON.stringify(l2) && logo.bpm !== 180, 'applyPatch 不改原物件');
a = AI.sanitizeAdjust({ notes: [{ deg: 0, dur: 1 }] }, logo); ok(!a.patch.notes, '少於 3 音不採用');
a = AI.sanitizeAdjust({ inst: logo.inst, bpm: logo.bpm }, logo); ok(a.changes.length === 0, '沒變就不算改動');
// 換音階不給旋律：音大致保留
const l3 = AI.applyPatch({ ...logo, scale: 'major' }, { scale: 'pent' }); ok(E.validLogo(l3) && l3.scale === 'pent', '換音階');
// ruleAdjust 各快速選項都會產生改動且結果合法
for (const req of ['再溫暖一點', '更有科技感', '更高級', '短一點', '結尾要讓人安心', '更好記', '活潑一點', '沉穩一點', '可愛', '酷一點', '明亮一點', '低沉一點']) {
  const rr = AI.ruleAdjust(req, logo);
  ok(rr.changes.length > 0, '有改動：' + req);
  ok(E.validLogo(AI.applyPatch(logo, rr.patch)), '合法：' + req);
}
ok(!AI.ruleAdjust('更高級', logo).patch.octave, '「高級」不會誤判成升八度');
const short = AI.applyPatch(logo, AI.ruleAdjust('短一點', logo).patch); ok(E.durationSec(short) <= E.durationSec(logo), '短一點真的變短');
ok(AI.ruleAdjust('亂七八糟', logo).changes.length === 0, '看不懂就不改');
// 其他
ok(AI.parseJson('```json\n{"a":1}\n```').a === 1, 'parseJson 去掉 code fence');
ok(AI.geminiModelFix('models/gemini-2.5-flash') === 'gemini-3.6-flash', 'gemini 下架模型換新');
ok(!AI.aiReady({}) && AI.aiReady({ provider: 'openai', key: 'k' }) && AI.aiReady({ provider: 'custom', base: 'http://x', modelCustom: 'm' }), 'aiReady');
console.log(`通過 ${pass}，失敗 ${fail}`);
process.exit(fail ? 1 : 0);
