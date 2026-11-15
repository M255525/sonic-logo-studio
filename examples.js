// 內建範例（品牌全為虛構）。固定存下旋律本身，之後改 engine.js 的產生規則也不會改變範例聲音。
// 2026-11-15 從各品牌前三批候選中，挑最符合定位的結構／樂器、分數高、長度短的一個寫死在這裡；要改範例直接改這個檔即可。
export const EXAMPLES = [
 {
  "id": "阿嬤的豆花",
  "tip": "示範「跟著國語聲調走」：阿 1、嬤 2、的輕聲、豆 4、花 1。二聲、四聲多一個滑音，5 個字變 7 個音，聽起來像在唱店名。",
  "b": {
   "name": "阿嬤的豆花",
   "industry": "food",
   "energy": -1,
   "premium": -2,
   "tech": -1,
   "warmth": -2,
   "notes": "auto",
   "length": "std",
   "useTones": true,
   "tones": [
    1,
    2,
    5,
    4,
    1
   ],
   "slogan": "一碗暖到心裡",
   "color": "#c8553d"
  },
  "l": {
   "v": 1,
   "idx": 0,
   "style": 6,
   "scale": "pent",
   "keyIdx": 3,
   "root": 63,
   "bpm": 125,
   "inst": "pluck",
   "notes": [
    {
     "deg": 4,
     "dur": 0.5,
     "vel": 0.9
    },
    {
     "deg": 2,
     "dur": 0.5,
     "vel": 0.9
    },
    {
     "deg": 4,
     "dur": 0.25,
     "vel": 0.7
    },
    {
     "deg": 4,
     "dur": 0.5,
     "vel": 0.9
    },
    {
     "deg": 5,
     "dur": 0.5,
     "vel": 0.9
    },
    {
     "deg": 3,
     "dur": 0.25,
     "vel": 0.7
    },
    {
     "deg": 4,
     "dur": 1.5,
     "vel": 0.9
    }
   ],
   "chord": false,
   "bass": false,
   "reverb": 0.05,
   "sylls": [
    "阿",
    "嬤",
    "的",
    "豆",
    "花"
   ],
   "name": "名稱聲調型・撥弦"
  }
 },
 {
  "id": "雲朵記帳",
  "tip": "一路往上、停在 Re 不回到 Do，給人「還沒說完、點下去吧」的感覺，適合 App 開啟音。分數偏低是因為全是相鄰音，試著把第 3 個音按 ▲ 拉高看看分數。",
  "b": {
   "name": "雲朵記帳",
   "industry": "tech",
   "energy": -1,
   "premium": 1,
   "tech": 2,
   "warmth": 1,
   "notes": "auto",
   "length": "std",
   "useTones": false,
   "tones": [],
   "slogan": "花多少，一眼就懂",
   "color": "#2f6fed"
  },
  "l": {
   "v": 1,
   "idx": 0,
   "style": 0,
   "scale": "major",
   "keyIdx": 9,
   "root": 69,
   "bpm": 134,
   "inst": "synth",
   "notes": [
    {
     "deg": 4,
     "dur": 0.33,
     "vel": 0.95
    },
    {
     "deg": 5,
     "dur": 0.33,
     "vel": 0.8
    },
    {
     "deg": 7,
     "dur": 0.34,
     "vel": 0.8
    },
    {
     "deg": 8,
     "dur": 1.5,
     "vel": 0.95
    }
   ],
   "chord": true,
   "bass": true,
   "reverb": 0.37,
   "sylls": null,
   "name": "上揚招呼型・合成器"
  }
 },
 {
  "id": "穩達保險經紀",
  "tip": "從高處落回主音（Do Sol Mi Do）＋慢速度，傳達「說完了、可以放心」。名稱 6 個字，音符數手動設成 4 個，避免太長。",
  "b": {
   "name": "穩達保險經紀",
   "industry": "finance",
   "energy": 2,
   "premium": 1,
   "tech": 1,
   "warmth": 0,
   "notes": 4,
   "length": "std",
   "useTones": false,
   "tones": [],
   "slogan": "陪你走得長遠",
   "color": "#1d3557"
  },
  "l": {
   "v": 1,
   "idx": 7,
   "style": 1,
   "scale": "major",
   "keyIdx": 10,
   "root": 70,
   "bpm": 94,
   "inst": "synth",
   "notes": [
    {
     "deg": 7,
     "dur": 0.5,
     "vel": 0.95
    },
    {
     "deg": 4,
     "dur": 0.25,
     "vel": 0.8
    },
    {
     "deg": 2,
     "dur": 0.25,
     "vel": 0.8
    },
    {
     "deg": 0,
     "dur": 1.5,
     "vel": 0.95
    }
   ],
   "chord": true,
   "bass": true,
   "reverb": 0.37,
   "sylls": null,
   "name": "回到主音信賴型・合成器"
  }
 },
 {
  "id": "小象積木",
  "tip": "三連音＋145 BPM 快速度，只有 1.8 秒，輕快俏皮，適合兒童品牌與按鈕回饋音。",
  "b": {
   "name": "小象積木",
   "industry": "kids",
   "energy": -2,
   "premium": -2,
   "tech": -1,
   "warmth": -2,
   "notes": "auto",
   "length": "std",
   "useTones": false,
   "tones": [],
   "slogan": "一起動手蓋夢想",
   "color": "#f4a300"
  },
  "l": {
   "v": 1,
   "idx": 3,
   "style": 3,
   "scale": "pent",
   "keyIdx": 1,
   "root": 73,
   "bpm": 145,
   "inst": "marimba",
   "notes": [
    {
     "deg": 0,
     "dur": 0.33,
     "vel": 0.95
    },
    {
     "deg": 1,
     "dur": 0.33,
     "vel": 0.8
    },
    {
     "deg": 2,
     "dur": 0.34,
     "vel": 0.8
    },
    {
     "deg": 4,
     "dur": 1.5,
     "vel": 0.95
    }
   ],
   "chord": false,
   "bass": false,
   "reverb": 0.05,
   "sylls": null,
   "name": "三連音輕快型・木琴"
  }
 },
 {
  "id": "霧島手作保養",
  "tip": "鐘聲＋長殘響，高級又空靈。超過 3.5 秒健檢會提醒偏長：試著把殘響調小，看長度和分數怎麼變。",
  "b": {
   "name": "霧島手作保養",
   "industry": "beauty",
   "energy": 1,
   "premium": 2,
   "tech": 0,
   "warmth": -1,
   "notes": 4,
   "length": "std",
   "useTones": false,
   "tones": [],
   "slogan": "慢下來，好好照顧自己",
   "color": "#8e7cc3"
  },
  "l": {
   "v": 1,
   "idx": 4,
   "style": 4,
   "scale": "major",
   "keyIdx": 10,
   "root": 70,
   "bpm": 112,
   "inst": "bell",
   "notes": [
    {
     "deg": 2,
     "dur": 0.33,
     "vel": 0.95
    },
    {
     "deg": 5,
     "dur": 0.33,
     "vel": 0.8
    },
    {
     "deg": 7,
     "dur": 0.34,
     "vel": 0.8
    },
    {
     "deg": 9,
     "dur": 1.5,
     "vel": 0.95
    }
   ],
   "chord": true,
   "bass": true,
   "reverb": 0.64,
   "sylls": null,
   "name": "和弦分解型・鐘聲"
  }
 },
 {
  "id": "青山果園",
  "tip": "溫暖的撥弦＋五聲音階，前後呼應像一問一答。可以跟「夜行潮服」對照：同樣 4 個音，換音階和樂器感覺差很多。",
  "b": {
   "name": "青山果園",
   "industry": "farm",
   "energy": 1,
   "premium": -1,
   "tech": -2,
   "warmth": -2,
   "notes": "auto",
   "length": "std",
   "useTones": false,
   "tones": [],
   "slogan": "從樹上直接到你家",
   "color": "#3a7d44"
  },
  "l": {
   "v": 1,
   "idx": 17,
   "style": 5,
   "scale": "pent",
   "keyIdx": 7,
   "root": 67,
   "bpm": 108,
   "inst": "pluck",
   "notes": [
    {
     "deg": 3,
     "dur": 0.5,
     "vel": 0.95
    },
    {
     "deg": 6,
     "dur": 0.25,
     "vel": 0.8
    },
    {
     "deg": 5,
     "dur": 0.25,
     "vel": 0.8
    },
    {
     "deg": 8,
     "dur": 1.5,
     "vel": 0.95
    }
   ],
   "chord": true,
   "bass": true,
   "reverb": 0.13,
   "sylls": null,
   "name": "對稱呼應型・撥弦"
  }
 },
 {
  "id": "夜行潮服",
  "tip": "小調五聲音階＋合成器，帶街頭酷感；開頭就大跳躍，第一秒抓住耳朵。",
  "b": {
   "name": "夜行潮服",
   "industry": "fashion",
   "energy": -1,
   "premium": 1,
   "tech": 0,
   "warmth": 2,
   "notes": "auto",
   "length": "std",
   "useTones": false,
   "tones": [],
   "slogan": "穿出你的態度",
   "color": "#222222"
  },
  "l": {
   "v": 1,
   "idx": 2,
   "style": 2,
   "scale": "minpent",
   "keyIdx": 8,
   "root": 68,
   "bpm": 134,
   "inst": "synth",
   "notes": [
    {
     "deg": 0,
     "dur": 0.75,
     "vel": 0.95
    },
    {
     "deg": 4,
     "dur": 0.25,
     "vel": 0.8
    },
    {
     "deg": 3,
     "dur": 0.5,
     "vel": 0.8
    },
    {
     "deg": 5,
     "dur": 1.5,
     "vel": 0.95
    }
   ],
   "chord": true,
   "bass": true,
   "reverb": 0.37,
   "sylls": null,
   "name": "跳躍記憶型・合成器"
  }
 }
];
