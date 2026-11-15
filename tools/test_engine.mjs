// node tools/test_engine.mjs
import * as E from '../engine.js';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
const b = { ...E.defaultBrand(), name: '阿嬤的豆花' };
const a1 = E.generateSet(b), a2 = E.generateSet(b);
ok(a1.length === 6, '六個候選');
ok(JSON.stringify(a1) === JSON.stringify(a2), '同輸入同結果');
ok(JSON.stringify(E.generateSet({ ...b, name: '阿公的豆花' })) !== JSON.stringify(a1), '不同名稱不同結果');
ok(a1[0].notes.length === 5, '五個字→五個音（自動）');
ok(E.nameSyllables('Mark Coffee').length === 3, '英文音節 ' + E.nameSyllables('Mark Coffee'));
ok(E.nameSyllables('7-11便利').length === 5, '數字一字一音');
// 所有產業 × 各種音數都合法
let cnt = 0;
for (const ind of Object.keys(E.INDUSTRIES)) for (const notes of ['auto', 3, 4, 5, 6]) for (const length of ['short', 'std', 'long']) {
  const br = { ...E.defaultBrand(), ...E.INDUSTRIES[ind], industry: ind, name: '測試' + ind, notes, length };
  delete br.label;
  for (const l of E.generateSet(br)) {
    cnt++;
    if (!E.validLogo(l)) { ok(false, 'invalid ' + ind + notes + JSON.stringify(l)); continue; }
    const ms = l.notes.map(n => E.noteMidi(l, n));
    if (Math.min(...ms) < 40 || Math.max(...ms) > 100) ok(false, '音域離譜 ' + ms);
    const ev = E.evaluate(l);
    if (!(ev.score >= 0 && ev.score <= 100)) ok(false, 'score');
    const d = E.durationSec(l, 'std');
    if (!(d > 0.8 && d < 8)) ok(false, '長度 ' + d + ' ' + ind);
    if (E.durationSec(l, 'short') > E.durationSec(l, 'long')) ok(false, '短版比加長版長');
  }
}
ok(cnt > 1000, '產生數量 ' + cnt);
// 聲調模式
const t = E.generate({ ...b, name: '好好吃', useTones: true, tones: [3, 3, 1] }, 0);
ok(t.style === 6 && t.scale === 'pent', '聲調模式');
const tm = E.toneMelody(['來', '買'], [2, 4]);
ok(tm.length === 4 && tm[0].deg < tm[1].deg && tm[2].deg > tm[3].deg, '二聲上揚四聲下降');
// 評分規則
const scaleRun = { ...a1[0], scale: 'major', notes: [0, 1, 2, 3].map(d => ({ deg: d, dur: 0.5, vel: .9 })) };
const leap = { ...a1[0], scale: 'major', notes: [{ deg: 0, dur: .25, vel: 1 }, { deg: 4, dur: .5, vel: 1 }, { deg: 2, dur: .25, vel: 1 }, { deg: 0, dur: 1.5, vel: 1 }] };
ok(E.evaluate(leap).score > E.evaluate(scaleRun).score + 15, '跳躍旋律分數高於音階 ' + E.evaluate(leap).score + ' vs ' + E.evaluate(scaleRun).score);
// 分享
const enc = E.encodeShare({ b, l: a1[2] });
ok(/^[A-Za-z0-9_-]+$/.test(enc), '網址安全');
ok(JSON.stringify(E.decodeShare(enc).l) === JSON.stringify(a1[2]), '分享來回');
ok(E.decodeShare('###') === null, '壞字串');
ok(!E.validLogo({ notes: [{ deg: 0, dur: 99 }], scale: 'major', inst: 'bell', bpm: 100 }), '擋壞資料');
// WAV
const sr = 8000, L = new Float32Array(800).map((_, i) => Math.sin(i / 5) * 0.4), R = L.slice();
const nr = E.normalize([L, R], sr);
ok(Math.max(...L) <= 0.891 && Math.max(...L) > 0.2, '正規化 ' + Math.max(...L));
{ const sq = new Float32Array(800).map((_, i) => (i % 20 < 10 ? 0.5 : -0.5)); E.normalize([sq], sr); ok(Math.abs(sq[0]) < 0.25, '方波壓低 ' + sq[0]); }
const wav = E.encodeWAV([L, R], sr);
const dv = new DataView(wav.buffer);
ok(String.fromCharCode(...wav.slice(0, 4)) === 'RIFF' && String.fromCharCode(...wav.slice(8, 12)) === 'WAVE', 'WAV 標頭');
ok(dv.getUint32(24, true) === sr && dv.getUint16(22, true) === 2 && wav.length === 44 + 800 * 4, 'WAV 參數');
// MIDI
const mid = E.encodeMIDI(a1[0]);
ok(String.fromCharCode(...mid.slice(0, 4)) === 'MThd' && String.fromCharCode(...mid.slice(14, 18)) === 'MTrk', 'MIDI 標頭');
const tl = (mid[18] << 24) | (mid[19] << 16) | (mid[20] << 8) | mid[21];
ok(tl === mid.length - 22, 'MIDI 長度');
ok(mid[mid.length - 3] === 0xff && mid[mid.length - 2] === 0x2f, 'MIDI 結尾');
// 說明書
const md = E.guideMarkdown(a1[0], b, E.evaluate(a1[0]));
ok(md.includes('阿嬤的豆花') && md.includes('智慧財產局'), '說明書');
ok(E.explain(a1[0], b).length >= 4, '說明');
// 內建範例
const { EXAMPLES } = await import('../examples.js');
ok(EXAMPLES.length === 7 && EXAMPLES.every(x => E.validLogo(x.l) && x.tip && x.b.name === x.id && E.INDUSTRIES[x.b.industry]), '範例資料完整');
ok(EXAMPLES.every(x => E.durationSec(x.l) < 5), '範例長度');
console.log(`通過 ${pass}，失敗 ${fail}`);
// 範例輸出
for (const l of a1) console.log(l.name, E.KEYS[l.keyIdx], l.scale, l.bpm, l.notes.map(n => E.solfa(E.noteMidi(l, n), l.keyIdx)).join(' '), E.evaluate(l).score);
process.exit(fail ? 1 : 0);
