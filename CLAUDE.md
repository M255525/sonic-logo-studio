# sonic-logo-studio — 品牌聲音 Logo 產生器

靜態網頁（`index.html`＋`engine.js`＋`manual.html`＋PWA 檔），無建置步驟、無外部 JS 函式庫（只用 Google Fonts：Noto Sans TC、Space Mono）。port 8882。2026-11-15 建立（使用者從「聲音相關工具發想」清單選了這個，功能細節都是我自定）。2026-11-15 上線：公開 repo <https://github.com/M255525/sonic-logo-studio>（使用者自己 `gh repo create`），GitHub Pages（Actions workflow，push 到 master 自動部署）<https://m255525.github.io/sonic-logo-studio/>。visitor-badge `m255525.soniclogostudio`。尚未放進創作者小鎮。

視覺：品牌識別手冊風（米白方格紙 `#f3eee4`、墨黑 `#1b1a17`、朱紅 `#e2432a`、直角粗框），刻意和聲控大冒險的深藍遊戲風不同。

## 流程
01 品牌資料（最上方「📚 範例」7 個虛構品牌按鈕，資料在 `examples.js`（寫死的旋律，改引擎不影響），點了載入品牌＋旋律、跳到 03 播放並在右側顯示範例說明 `#ex-note`；挑候選／開收藏／分享連結時說明會隱藏；名稱、14 產業預設、四軸個性 -2～2：活潑↔穩重／親民↔高級／自然↔科技／溫暖↔酷感、音符數、長度、品牌色、標語、選用「跟著國語聲調走」）→ 02 六個候選（聲紋 SVG＋辨識度分數）→ 03 逐音編輯（▲▼級數、長度、刪除、加音最多 8、樂器／調／音階／BPM／殘響／升降八度／顛倒／和弦／低音、還原）＋辨識度健檢＋「為什麼這樣配」→ 04 四情境試聽（App 短版、片頭標準、門市標準、廣告結尾加長；CSS 動畫）→ 05 WAV 三版本、MIDI、分享連結 `#s=`、聲音品牌說明書（.md／列印）。我的聲音 Logo 收藏（localStorage，最多 60）。

## engine.js（ES module，瀏覽器與 Node 共用，不碰 DOM／Web Audio）
- 決定性：`hashStr`＋`rng`（mulberry32），同名稱＋設定＋候選編號一定同結果；「換一批」是 `generateSet(brand, 6, batch*6)` 的 offset，**不要改成在名稱後面加字**（數字會被 `nameSyllables` 當成音節，改到音符數）。
- 旋律輪廓 `SHAPES` 用**五聲音階級數**寫（0 Do 1 Re 2 Mi 3 Sol 4 La 5 高 Do），七聲音階時用 `pentToHept` 換成 1 2 3 5 6 級；利地安把中間一個 Sol 降成升 Fa。6 種風格＋第 7 種「名稱聲調型」（只在 idx 0、且每個字都選了聲調時；聲調預設「（請選）」，沒選完 index.html 會 toast 並改用一般候選——第一版預設一聲導致五個同音）。
- 音域保護：最高 > MIDI 91 降八度、最低 < 50 升八度。
- `toEvents(logo, variant)`：short＝前 3 音、long＝旋律重複兩次＋和弦；和弦／低音以 part 區分。
- `evaluate`：自訂規則 40 分起跳（3～5 音、≥4 半音跳進、整串級進扣分、轉折、音域 5～14、節奏變化、結尾穩定音、≤3.5 秒）。**是自訂評分，介面與說明書都要寫「僅供參考」。**
- `encodeWAV`（16-bit PCM）、`normalize`（峰值 ≤ 0.89 且有聲部分 RMS ≤ 0.2——只用峰值時八位元方波／口哨的響度是其他樂器的 3 倍）、`encodeMIDI`（SMF type 0，頻道 0 主旋律／1 和弦／2 低音，含 tempo 與 program change）、`encodeShare`／`decodeShare`（UTF-8 base64url）、`validLogo`（讀分享連結與收藏時擋壞資料）。
- 改引擎跑 `node tools/test_engine.mjs`（25 項，含範例資料檢查，含 14 產業×5 音數×3 長度×6 候選全部合法）。

## index.html 合成
- 一律先用 `OfflineAudioContext` 渲染成 buffer 再播放（試聽與匯出同一份聲音）；`render()` 以參數 JSON 當 key 快取 40 筆，改設定會清快取。
- 9 種樂器全是程式合成：bell（FM 3.5 倍）、marimba（基音＋4 倍＋10 倍泛音）、epiano（FM 1:1＋三角波）、pluck（鋸齒波＋濾波包絡）、synth（雙鋸齒 detune＋共振濾波）、chip（方波）、pad（三鋸齒＋正弦）、whistle（正弦＋顫音＋帶通噪音）、drop（滑音正弦）。殘響是固定種子噪音 IR（匯出可重現），接 DynamicsCompressor。
- 測試掛鉤 `window.__sls`：`E`、`cur`、`cands`、`render(logo, variant, sr, ch)`、`markSVG`、`SET`、`brand()`。

## 標準配備
跑馬燈（共用 Apps Script，`slsMarquee`）、操作手冊 `manual.html`（創作者區塊含 email 是從 voice-control-game/manual.html 用 awk 整段複製）、使用警語（頁面 `.warnbox`＋首訪 `#warn-modal`；重點：**旋律不保證與既有商標聲音／廣告歌不相似，商用前查智慧局商標檢索**、分數僅供參考、不上傳）、加入主畫面、訪客計數器、⚙ 常用設定（收合 `details.set-sec`：播放／匯出／資料／關於本工具，`sls-set-open`）。刪除類按鈕用「再按一次確認」，不用 `confirm()`。

## 儲存（localStorage，全部 try/catch）
`sls-settings`、`sls-brand`、`sls-mine`、`sls-warned`、`sls-set-open`、`slsMarquee`。

## 測試
- 本機：`python -m http.server 8882`（launch.json 名稱 `sonic-logo-studio`）。Playwright MCP 被別的 session 占用時，改用 Python `playwright.sync_api` 寫腳本跑（放 scratchpad）。
- 2026-11-15 已驗證：9 樂器渲染（每段 70～360ms、無 NaN）、六候選、編輯／還原／換音階、WAV（2ch 44.1k，可被 Python wave 讀）、MIDI 下載、說明書、收藏、分享連結開新頁還原、聲調模式、390px 無溢出、console 無錯誤。測完清 `sls-*`。
- **真人耳朵的音色好壞未經使用者確認**；使用者回報哪個樂器難聽就調 `voice()` 對應 case。
