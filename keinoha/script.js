
    /* ==== JS構成（並べ替え版・お試し）====
       目次:
        1. 画面ステップ切り替え
        2. グローバル状態変数（モード・構図・詳細設定・ペア設定）
        3. カテゴリ定義データ
        4. タグ選択・比率のグローバル状態
        5. テーマ切り替え
        6. デザイン方式・プリセットの状態とロジック
        7. カテゴリ検索・モードのグローバル状態とロジック
        8. 場面サブグループのタブ切り替え
        9. タグ検索パネル
       10. カテゴリ開閉状態（アコーディオン）管理
       11. ワークフローガイド
       12. 文字スタイル設定・カテゴリUI構築
       13. カテゴリ開閉の一括操作
       14. モード判定・カテゴリ取得ヘルパー
       15. 人物ペア設定パネル
       16. 詳細設定パネル（髪型・服装など）
       17. 本文からの場面抽出
       18. タグ選択トグル・リセット処理
       19. プロンプト生成（出力結果の組み立て）
       20. ビジュアル設計図パネル
       21. ユーティリティ
       22. 文字なしモード同期
       23. 初期化処理
       ==================================== */

    // ── 画面ステップ切り替え ──
    let currentStep = 1;

    function showStep(step) {
      currentStep = Math.max(1, Math.min(4, Number(step) || 1));
      document.querySelectorAll(".step-screen").forEach((screen) => {
        const active = Number(screen.dataset.stepScreen) === currentStep;
        screen.hidden = !active;
        screen.classList.toggle("active", active);
      });
      document.querySelectorAll(".step-tab").forEach((tab) => {
        tab.classList.toggle("active", Number(tab.dataset.step) === currentStep);
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // ── グローバル状態変数（モード・構図・詳細設定・ペア設定） ──
    let currentMode = "character";

    const compositionState = { view: "", position: "", space: "", distance: "" };

    const detailState = {
      hair: { mode: "", color1: "", color2: "", placement: "" },
      iris: { mode: "", color1: "", color2: "", direction: "" },
    };

    const pairState = {
      person1: {
        reference: false,
        type: "",
        race: "",
        age: "",
        hairColor: "",
        hairStyle: "",
        eyes: "",
        iris: "",
        skin: "",
        outfit: "",
        expression: "",
        body: "",
        hands: "",
        accessory: "",
        props: "",
        hairDetail: { mode: "", color1: "", color2: "", placement: "" },
        irisDetail: { mode: "", color1: "", color2: "", direction: "" },
      },
      person2: {
        reference: false,
        type: "",
        race: "",
        age: "",
        hairColor: "",
        hairStyle: "",
        eyes: "",
        iris: "",
        skin: "",
        outfit: "",
        expression: "",
        body: "",
        hands: "",
        accessory: "",
        props: "",
        hairDetail: { mode: "", color1: "", color2: "", placement: "" },
        irisDetail: { mode: "", color1: "", color2: "", direction: "" },
      },
      relation: "",
    };

    const pairCharacterValue = "pair of characters";

    const pairCharacterValues = new Set([pairCharacterValue]);

    const referenceCharacterValue =
      "character based on the attached reference image";

    const referenceCharacterValues = new Set([referenceCharacterValue]);

    const referenceHiddenCategories = new Set([
      "character-race",
      "hair-color",
      "hairstyle",
      "character-age",
      "character-eyes",
      "character-iris",
      "character-skin",
      "character-body",
      "character-accessory",
    ]);

    const pairHiddenCategories = new Set([
      "character-race",
      "hair-color",
      "hairstyle",
      "character-age",
      "character-eyes",
      "character-iris",
      "character-skin",
      "character-body",
    ]);

    const colorOptions = [
      ["黒", "black"],
      ["茶", "brown"],
      ["栗色", "chestnut brown"],
      ["金", "blonde"],
      ["白", "white"],
      ["銀", "silver"],
      ["灰", "gray"],
      ["赤", "red"],
      ["橙", "orange"],
      ["黄", "yellow"],
      ["緑", "green"],
      ["青", "blue"],
      ["水色", "light blue"],
      ["紫", "purple"],
      ["桃", "pink"],
      ["桜", "sakura pink"],
      ["青緑", "teal"],
      ["紺", "navy"],
      ["藍", "indigo"],
      ["深紅", "deep crimson"],
    ];

    // ── カテゴリ定義データ ──
    const categoriesData = [
      {
        "id": "character",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "人数・性別・構成・見せ方",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "[AI] 人物構成おまかせ",
            "value": "expressive character composition",
            "isOmakase": true
          },
          {
            "label": "女性1人",
            "value": "1woman, solo character"
          },
          {
            "label": "男性1人",
            "value": "1man, solo character"
          },
          {
            "label": "人物1人（性別指定なし）",
            "value": "single human character"
          },
          {
            "label": "中性的な人物1人",
            "value": "1 androgynous, gender-ambiguous character"
          },
          {
            "label": "人物ペア",
            "value": "pair of characters"
          },
          {
            "label": "参考画像を使う",
            "value": "character based on the attached reference image"
          },
          {
            "label": "人物複数",
            "value": "multiple characters"
          },
          {
            "label": "後ろ姿",
            "value": "character seen from behind"
          },
          {
            "label": "横顔",
            "value": "character in profile view"
          },
          {
            "label": "シルエット",
            "value": "character silhouette"
          },
          {
            "label": "顔を見せない",
            "value": "character with face obscured or outside the frame"
          },
          {
            "label": "上半身",
            "value": "upper-body portrait"
          },
          {
            "label": "全身",
            "value": "full-body character shot"
          },
          {
            "label": "顔・表情アップ",
            "value": "close-up portrait emphasizing facial expression"
          },
          {
            "label": "手元・小物中心",
            "value": "close-up of hands interacting with an object"
          }
        ]
      },
      {
        "id": "character-race",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "種族・存在",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "人間",
            "value": "human character"
          },
          {
            "label": "エルフ",
            "value": "elf character, pointed ears"
          },
          {
            "label": "ダークエルフ",
            "value": "dark elf character, pointed ears, dark skin"
          },
          {
            "label": "ドワーフ・小人族",
            "value": "dwarf character, short stocky sturdy build"
          },
          {
            "label": "ハーフリング・小人",
            "value": "halfling character, small petite stature, cheerful appearance"
          },
          {
            "label": "獣人",
            "value": "beastfolk character, humanoid body with animal ears and tail"
          },
          {
            "label": "猫獣人",
            "value": "cat beastfolk character, humanoid body with feline ears and tail"
          },
          {
            "label": "犬獣人",
            "value": "dog beastfolk character, humanoid body with canine ears and tail"
          },
          {
            "label": "狼獣人",
            "value": "wolf beastfolk character, humanoid body with wolf ears and tail"
          },
          {
            "label": "狐獣人",
            "value": "fox beastfolk character, humanoid body with fox ears and tail"
          },
          {
            "label": "兎獣人",
            "value": "rabbit beastfolk character, humanoid body with rabbit ears and tail"
          },
          {
            "label": "鳥人・羽人",
            "value": "harpy aviand character, humanoid with feathered wings and bird features"
          },
          {
            "label": "竜人",
            "value": "dragonkin character, humanoid with subtle draconic features, horns or scales"
          },
          {
            "label": "鬼・鬼族",
            "value": "oni character, humanoid with horns and fierce presence"
          },
          {
            "label": "人魚",
            "value": "merfolk character, humanoid upper body with fish tail"
          },
          {
            "label": "吸血鬼",
            "value": "vampire character, subtle fangs and gothic supernatural presence"
          },
          {
            "label": "悪魔",
            "value": "demon character, supernatural humanoid with bat wings, tail, and horns"
          },
          {
            "label": "魔族",
            "value": "demon race character, majestic supernatural humanoid with horns, dark aura"
          },
          {
            "label": "天使",
            "value": "angelic character with feathered wings and halo"
          },
          {
            "label": "妖精",
            "value": "fairy character, small ethereal humanoid with delicate wings"
          },
          {
            "label": "精霊",
            "value": "spirit character, ethereal supernatural humanoid presence"
          },
          {
            "label": "妖怪・怪異",
            "value": "yokai or supernatural entity in humanoid form"
          },
          {
            "label": "アンデッド・死霊",
            "value": "undead pale humanoid character, eerie supernatural presence"
          },
          {
            "label": "ホムンクルス",
            "value": "artificial humanoid lifeform, homunculus"
          },
          {
            "label": "人型アンドロイド",
            "value": "humanoid android character, subtle cybernetic details"
          },
          {
            "label": "種族不明・異形",
            "value": "mysterious non-human humanoid entity, otherworldly appearance"
          }
        ]
      },
      {
        "id": "character-age",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "年齢",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "幼少期",
            "value": "childlike, cute youthful toddler-like features"
          },
          {
            "label": "ローティーン（10代前半）",
            "value": "early teenage youthful features"
          },
          {
            "label": "ハイティーン（10代後半）",
            "value": "late teenage high schooler age appearance"
          },
          {
            "label": "20代らしい",
            "value": "adult in their twenties"
          },
          {
            "label": "30代らしい",
            "value": "adult in their thirties"
          },
          {
            "label": "40代らしい",
            "value": "adult in their forties"
          },
          {
            "label": "壮年",
            "value": "dignified middle-aged person, attractive mature features"
          },
          {
            "label": "シニア",
            "value": "elderly senior person, distinguished graceful features"
          },
          {
            "label": "高齢・深いシワ",
            "value": "visibly aged elderly person, deep wrinkles, weathered features"
          },
          {
            "label": "童顔",
            "value": "baby-faced, youthful features, looking younger than age"
          },
          {
            "label": "大人びた雰囲気",
            "value": "mature-faced, sophisticated facial structure beyond age"
          },
          {
            "label": "年齢不詳",
            "value": "age-ambiguous, timeless ethereal appearance"
          }
        ]
      },
      {
        "id": "hair-color",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "髪色",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "黒髪",
            "value": "black hair"
          },
          {
            "label": "茶髪",
            "value": "brown hair"
          },
          {
            "label": "栗色",
            "value": "chestnut brown hair"
          },
          {
            "label": "金髪",
            "value": "blonde hair"
          },
          {
            "label": "プラチナブロンド",
            "value": "platinum blonde hair"
          },
          {
            "label": "黄色の髪",
            "value": "yellow hair"
          },
          {
            "label": "赤髪",
            "value": "red hair"
          },
          {
            "label": "ワインレッド・深紅",
            "value": "burgundy hair"
          },
          {
            "label": "桃色の髪",
            "value": "pink hair"
          },
          {
            "label": "桜色の髪",
            "value": "sakura pink hair"
          },
          {
            "label": "橙髪",
            "value": "orange hair"
          },
          {
            "label": "緑髪",
            "value": "green hair"
          },
          {
            "label": "深緑の髪",
            "value": "dark green hair"
          },
          {
            "label": "青緑の髪",
            "value": "teal hair"
          },
          {
            "label": "水色の髪",
            "value": "light blue hair"
          },
          {
            "label": "青髪",
            "value": "blue hair"
          },
          {
            "label": "藍色の髪",
            "value": "indigo hair"
          },
          {
            "label": "濃紺の髪",
            "value": "navy hair"
          },
          {
            "label": "薄紫・ラベンダー",
            "value": "soft lavender hair"
          },
          {
            "label": "すみれ色",
            "value": "violet hair"
          },
          {
            "label": "紫髪",
            "value": "purple hair"
          },
          {
            "label": "紫紺",
            "value": "deep plum hair"
          },
          {
            "label": "アッシュグレー",
            "value": "ash gray hair"
          },
          {
            "label": "灰色",
            "value": "gray hair"
          },
          {
            "label": "銀髪",
            "value": "silver hair"
          },
          {
            "label": "白髪",
            "value": "white hair"
          },
          {
            "label": "二色の髪",
            "value": "two-tone hair"
          },
          {
            "label": "毛先だけ色が違う",
            "value": "hair with contrasting colored tips"
          },
          {
            "label": "メッシュ・差し色",
            "value": "hair with colored streaks or highlights"
          },
          {
            "label": "インナーカラー",
            "value": "hair with inner hidden highlights"
          },
          {
            "label": "グラデーションヘアー",
            "value": "gradient colored hair"
          }
        ]
      },
      {
        "id": "hairstyle",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "髪型",
        "items": [
  {
    "label": "指定なし",
    "isNone": true
  },
  {
    "label": "ベリーショート",
    "value": "very short cropped haircut, pixie cut",
    "family": "髪の長さ"
  },
  {
    "label": "ショート",
    "value": "short hairstyle",
    "family": "髪の長さ"
  },
  {
    "label": "ショートボブ",
    "value": "chin-length short bob haircut, hair reaching the jawline",
    "family": "髪の長さ"
  },
  {
    "label": "ボブ",
    "value": "classic bob haircut",
    "family": "髪の長さ"
  },
  {
    "label": "切りっぱなしボブ",
    "value": "sharp blunt cut bob, clean straight edge hair",
    "family": "髪の長さ"
  },
  {
    "label": "ロブ（長めボブ）",
    "value": "long bob haircut, lob, hair resting just above the shoulders",
    "family": "髪の長さ"
  },
  {
    "label": "ミディアム",
    "value": "medium shoulder-length hair",
    "family": "髪の長さ"
  },
  {
    "label": "セミロング",
    "value": "chest-length hair, mid-long hair",
    "family": "髪の長さ"
  },
  {
    "label": "ロング",
    "value": "long flowing hair, waist-length hair",
    "family": "髪の長さ"
  },
  {
    "label": "スーパーロング",
    "value": "super long hair, hip-length hair",
    "family": "髪の長さ"
  },
  {
    "label": "超長髪（床丈）",
    "value": "floor-length hair, extremely long hair flowing down to the floor",
    "family": "髪の長さ"
  },
  {
    "label": "アシメ（長さ）",
    "value": "asymmetrical haircut, uneven hair length",
    "family": "髪の長さ"
  },
  {
    "label": "ストレート",
    "value": "straight hair",
    "family": "髪型"
  },
  {
    "label": "ウェーブ・パーマ",
    "value": "wavy hair, soft perm hairstyle",
    "family": "髪型"
  },
  {
    "label": "カール・巻き髪",
    "value": "curly hair, ringlet curls",
    "family": "髪型"
  },
  {
    "label": "ウルフカット",
    "value": "wolf cut hairstyle",
    "family": "髪型"
  },
  {
    "label": "姫カット",
    "value": "hime cut hairstyle",
    "family": "髪型"
  },
  {
    "label": "マッシュ",
    "value": "rounded mushroom cut, bowl cut",
    "family": "髪型"
  },
  {
    "label": "おかっぱボブ",
    "value": "classic straight blunt bob haircut",
    "family": "髪型"
  },
  {
    "label": "ツーブロック・刈り上げ",
    "value": "undercut hairstyle",
    "family": "髪型"
  },
  {
    "label": "ポニーテール",
    "value": "ponytail",
    "family": "髪型"
  },
  {
    "label": "ハイポニーテール",
    "value": "high ponytail",
    "family": "髪型"
  },
  {
    "label": "ローポニーテール",
    "value": "low ponytail",
    "family": "髪型"
  },
  {
    "label": "サイドテール",
    "value": "side ponytail",
    "family": "髪型"
  },
  {
    "label": "ツインテール",
    "value": "twin tails hairstyle",
    "family": "髪型"
  },
  {
    "label": "ハーフアップ",
    "value": "half-up hairstyle",
    "family": "髪型"
  },
  {
    "label": "ハーフアップツイン",
    "value": "half-up twin tails",
    "family": "髪型"
  },
  {
    "label": "サイドアップ",
    "value": "side-up hairstyle",
    "family": "髪型"
  },
  {
    "label": "お団子",
    "value": "hair in a bun",
    "family": "髪型"
  },
  {
    "label": "ツインお団子",
    "value": "double bun hairstyle",
    "family": "髪型"
  },
  {
    "label": "シニヨン・まとめ髪",
    "value": "chignon hairstyle, elegant updo hair",
    "family": "髪型"
  },
  {
    "label": "三つ編み",
    "value": "braided hair",
    "family": "髪型"
  },
  {
    "label": "ツイン三つ編み",
    "value": "twin braids",
    "family": "髪型"
  },
  {
    "label": "サイド三つ編み",
    "value": "side-braided hair",
    "family": "髪型"
  },
  {
    "label": "編み込み",
    "value": "intricately braided hairstyle, French braid",
    "family": "髪型"
  },
  {
    "label": "フィッシュボーン",
    "value": "fishtail braid",
    "family": "髪型"
  },
  {
    "label": "前髪ぱっつん",
    "value": "blunt straight bangs",
    "family": "前髪"
  },
  {
    "label": "シースルーバング",
    "value": "see-through bangs",
    "family": "前髪"
  },
  {
    "label": "斜め前髪",
    "value": "side-swept bangs",
    "family": "前髪"
  },
  {
    "label": "センター分け",
    "value": "curtain bangs, center-parted hair",
    "family": "前髪"
  },
  {
    "label": "長い前髪",
    "value": "long bangs",
    "family": "前髪"
  },
  {
    "label": "前髪なし・おでこ出し",
    "value": "forehead exposed, no bangs",
    "family": "前髪"
  },
  {
    "label": "メカクレ（目隠れ）",
    "value": "hair covering one eye",
    "family": "前髪"
  },
  {
    "label": "オールバック",
    "value": "slicked-back hair",
    "family": "前髪"
  },
  {
    "label": "アホ毛",
    "value": "cowlick, ahoge hair strand sticking up",
    "family": "前髪"
  },
  {
    "label": "ストレート",
    "value": "silky smooth straight hair, glossy hair texture",
    "family": "髪の形・質感"
  },
  {
    "label": "ゆるウェーブ",
    "value": "soft wavy hair, gentle waves",
    "family": "髪の形・質感"
  },
  {
    "label": "ウェーブ",
    "value": "wavy hair, defined wave pattern",
    "family": "髪の形・質感"
  },
  {
    "label": "巻き髪",
    "value": "curled hair, elegant ringlet curls",
    "family": "髪の形・質感"
  },
  {
    "label": "縦ロール",
    "value": "vertical ringlet curls, drill hair",
    "family": "髪の形・質感"
  },
  {
    "label": "くせ毛",
    "value": "naturally frizzy hair, tight natural curls, wild hair texture",
    "family": "髪の形・質感"
  },
  {
    "label": "外ハネ",
    "value": "outward-flipped ends, flicked hair tips",
    "family": "髪の形・質感"
  },
  {
    "label": "内巻き",
    "value": "inward-curled ends, soft turned-in hair tips",
    "family": "髪の形・質感"
  },
  {
    "label": "ふんわり",
    "value": "softly feathered hair ends, light airy hair texture",
    "family": "髪の形・質感"
  },
  {
    "label": "あほ毛",
    "value": "ahoge, single standing hair strand sticking up",
    "family": "髪の形・質感"
  },
  {
    "label": "無造作",
    "value": "messy effortless hair, tousled bedhead texture",
    "family": "髪の形・質感"
  },
  {
    "label": "束感",
    "value": "piecy hair strands, defined hair clumps, wet hair texture",
    "family": "髪の形・質感"
  },
  {
    "label": "ふわふわ",
    "value": "fluffy voluminous hair, airy soft hair texture",
    "family": "髪の形・質感"
  },
  {
    "label": "ツヤ髪",
    "value": "shiny hair, vivid hair highlight, angel ring hair shine",
    "family": "髪の形・質感"
  },
  {
    "label": "風になびく",
    "value": "hair flowing gently in the wind",
    "family": "髪の状態・動き"
  },
  {
    "label": "風で舞う",
    "value": "hair dramatically swept by strong wind, dynamic hair motion",
    "family": "髪の状態・動き"
  },
  {
    "label": "ふわりと浮く",
    "value": "hair softly floating in the air, weightless hair strand",
    "family": "髪の状態・動き"
  },
  {
    "label": "無重力・水中",
    "value": "hair floating in zero gravity, hair spread out underwater",
    "family": "髪の状態・動き"
  },
  {
    "label": "髪をかきあげる",
    "value": "hand running through hair, hair pushed back with hand",
    "family": "髪の状態・動き"
  },
  {
    "label": "乱れ髪",
    "value": "slightly disheveled hair, messy strands framing face",
    "family": "髪の状態・動き"
  },
  {
    "label": "激しい乱れ髪",
    "value": "wildly tousled hair, dramatic unkempt hair strands",
    "family": "髪の状態・動き"
  },
  {
    "label": "濡れ髪",
    "value": "wet hair, damp hair strands clinging to face",
    "family": "髪の状態・動き"
  },
  {
    "label": "水滴つき",
    "value": "hair with glistening water droplets, dripping wet hair",
    "family": "髪の状態・動き"
  },
  {
    "label": "静電気",
    "value": "hair floating from static electricity, fine hair strands spreading out",
    "family": "髪の状態・動き"
  },
  {
    "label": "顔にかかる髪",
    "value": "hair strands falling across face, subtle face-framing hair",
    "family": "髪の状態・動き"
  }
        ]
      },
      {
        "id": "character-eyes",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "目の形・印象",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "大きな目",
            "value": "large expressive eyes"
          },
          {
            "label": "切れ長の目",
            "value": "narrow elegant eyes"
          },
          {
            "label": "たれ目",
            "value": "soft downturned eyes"
          },
          {
            "label": "つり目",
            "value": "sharp upturned eyes"
          },
          {
            "label": "丸い目",
            "value": "round gentle eyes"
          },
          {
            "label": "眠たげな目",
            "value": "half-lidded sleepy eyes"
          },
          {
            "label": "鋭い目つき",
            "value": "intense sharp gaze"
          },
          {
            "label": "柔らかな目元",
            "value": "soft gentle eye expression"
          },
          {
            "label": "長いまつ毛",
            "value": "long delicate eyelashes"
          },
          {
            "label": "瞳を強調",
            "value": "eyes and irises emphasized in close detail"
          },
          {
            "label": "片目を隠す",
            "value": "one eye partially obscured by hair"
          }
        ]
      },
      {
        "id": "character-iris",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "瞳の色・質感",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "黒",
            "value": "deep black irises"
          },
          {
            "label": "茶",
            "value": "warm brown irises"
          },
          {
            "label": "琥珀",
            "value": "golden amber irises"
          },
          {
            "label": "金",
            "value": "luminous golden irises"
          },
          {
            "label": "ヘーゼル",
            "value": "hazel irises"
          },
          {
            "label": "赤",
            "value": "crimson red irises"
          },
          {
            "label": "深紅",
            "value": "Burgundy irises"
          },
          {
            "label": "桃・桜",
            "value": "soft pink irises"
          },
          {
            "label": "橙",
            "value": "warm orange irises"
          },
          {
            "label": "黄",
            "value": "bright yellow irises"
          },
          {
            "label": "緑",
            "value": "emerald green irises"
          },
          {
            "label": "深緑",
            "value": "forest green irises"
          },
          {
            "label": "オリーブ",
            "value": "muted olive green irises"
          },
          {
            "label": "青",
            "value": "clear blue irises"
          },
          {
            "label": "水色",
            "value": "pale cyan irises"
          },
          {
            "label": "藍",
            "value": "indigo irises"
          },
          {
            "label": "濃紺",
            "value": "navy irises"
          },
          {
            "label": "紫",
            "value": "violet purple irises"
          },
          {
            "label": "紫紺（濃い紫）",
            "value": "deep plum irises"
          },
          {
            "label": "薄紫・ラベンダー",
            "value": "soft lavender irises"
          },
          {
            "label": "すみれ色",
            "value": "striking violet irises"
          },
          {
            "label": "灰・銀",
            "value": "silver gray irises"
          },
          {
            "label": "虹色・オパール",
            "value": "iridescent opal irises"
          },
          {
            "label": "左右で違う色",
            "value": "heterochromia, differently colored eyes"
          },
          {
            "label": "グラデーションの瞳",
            "value": "gradient-colored irises"
          },
          {
            "label": "光を宿した瞳",
            "value": "bright catchlights in the eyes"
          },
          {
            "label": "光のない瞳",
            "value": "lifeless eyes with no catchlights, empty-looking irises"
          }
        ]
      },
      {
        "id": "character-skin",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "肌",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "色白・透明感",
            "value": "pale translucent skin"
          },
          {
            "label": "青白い肌",
            "value": "pallid pale skin"
          },
          {
            "label": "不健康・病的な顔色",
            "value": "unhealthy complexion, sickly pale skin"
          },
          {
            "label": "土気色の肌",
            "value": "sallow skin tone"
          },
          {
            "label": "自然な肌色",
            "value": "natural skin tone"
          },
          {
            "label": "血色の良い肌",
            "value": "healthy ruddy complexion, rosy skin"
          },
          {
            "label": "小麦色の肌",
            "value": "sun-kissed warm skin"
          },
          {
            "label": "日焼け肌・タンドスキン",
            "value": "tanned skin"
          },
          {
            "label": "褐色の肌",
            "value": "deep warm brown skin tone"
          },
          {
            "label": "黒褐色・ダークスキン",
            "value": "dark brown skin tone"
          },
          {
            "label": "陶器のような肌",
            "value": "smooth porcelain-like skin"
          },
          {
            "label": "柔らかな肌質",
            "value": "soft natural skin texture"
          },
          {
            "label": "ツヤ肌・潤い",
            "value": "dewy glowing skin"
          },
          {
            "label": "マット・乾燥肌",
            "value": "matte dry skin texture"
          },
          {
            "label": "そばかす",
            "value": "subtle freckles across the face"
          },
          {
            "label": "ほくろ",
            "value": "small beauty mark"
          },
          {
            "label": "傷跡",
            "value": "visible subtle scar"
          },
          {
            "label": "目の下のクマ",
            "value": "dark circles under eyes"
          },
          {
            "label": "日焼けあと",
            "value": "tan lines"
          }
        ]
      },
      {
        "id": "character-body",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "体格・シルエット",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "やせ細った・病的な細身",
            "value": "emaciated skin-and-bones build"
          },
          {
            "label": "華奢",
            "value": "slender delicate build"
          },
          {
            "label": "小柄",
            "value": "small petite build"
          },
          {
            "label": "細身",
            "value": "slim lean build"
          },
          {
            "label": "長身・モデル体型",
            "value": "tall slender build"
          },
          {
            "label": "標準的な体格",
            "value": "natural average body proportions"
          },
          {
            "label": "健康的な体格",
            "value": "healthy athletic build"
          },
          {
            "label": "引き締まった体",
            "value": "toned fit physique"
          },
          {
            "label": "筋肉質",
            "value": "muscular athletic build"
          },
          {
            "label": "がっしり・大柄",
            "value": "broad-shouldered burly build"
          },
          {
            "label": "柔らかな体つき",
            "value": "soft natural body shape"
          },
          {
            "label": "ぽっちゃり・ふくよか",
            "value": "plump curvy body shape"
          },
          {
            "label": "メリハリのある体型（グラマラス）",
            "value": "voluptuous hourglass silhouette"
          },
          {
            "label": "シルエット重視",
            "value": "distinctive readable body silhouette"
          }
        ]
      },
      {
        "id": "outfit",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "服装",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "学生制服",
            "value": "Japanese school uniform",
            "family": "学生・制服"
          },
          {
            "label": "ブレザー制服（冬服）",
            "value": "Japanese school blazer uniform, long sleeve shirt, necktie or ribbon, plaid skirt or trousers",
            "family": "学生・制服"
          },
          {
            "label": "ブレザー制服（夏服・ワイシャツ）",
            "value": "Japanese school summer uniform, short sleeve dress shirt, necktie or ribbon, skirt or trousers",
            "family": "学生・制服"
          },
          {
            "label": "制服＋カーディガン/ニットベスト",
            "value": "Japanese school uniform with an oversized cardigan or knit vest over a collared shirt",
            "family": "学生・制服"
          },
          {
            "label": "セーラー服（冬服・長袖）",
            "value": "Japanese sailor-style school uniform, long sleeves, traditional sailor collar and neck scarf",
            "family": "学生・制服"
          },
          {
            "label": "セーラー服（夏服・半袖）",
            "value": "Japanese summer sailor uniform, short sleeves, crisp white shirt, sailor collar",
            "family": "学生・制服"
          },
          {
            "label": "学ラン",
            "value": "Japanese school gakuran uniform, black high-collared jacket with gold buttons",
            "family": "学生・制服"
          },
          {
            "label": "学校ジャージ",
            "value": "Japanese school gym tracksuit outfit, athletic zip-up jacket and matching pants",
            "family": "学生・制服"
          },
          {
            "label": "海外風プレッピー・スクールガール",
            "value": "Western preppy academy uniform, tweed blazer, crest badge, pleated skirt, stylish knee socks",
            "family": "学生・制服"
          },
          {
            "label": "アカデミックローブ・卒業服",
            "value": "academic graduation gown and mortarboard cap, scholar robe",
            "family": "学生・制服"
          },
          {
            "label": "私服・カジュアル",
            "value": "casual contemporary clothing",
            "family": "日常・カジュアル"
          },
          {
            "label": "ストリートファッション",
            "value": "trendy urban streetwear fashion, oversized silhouette",
            "family": "日常・カジュアル"
          },
          {
            "label": "モード系・ハイブランド風",
            "value": "high-fashion avant-garde mode clothing, sleek monochromatic outfit",
            "family": "日常・カジュアル"
          },
          {
            "label": "テックウェア",
            "value": "techwear fashion, tactical straps, functional futuristic streetwear",
            "family": "日常・カジュアル"
          },
          {
            "label": "地雷系・量産型",
            "value": "jirai kei fashion, dark cute frill outfit with ribbons and harnesses",
            "family": "日常・カジュアル"
          },
          {
            "label": "古着・ヴィンテージ",
            "value": "vintage retro fashion, thrifted casual outfit with nostalgic aesthetic",
            "family": "日常・カジュアル"
          },
          {
            "label": "トラッド・プレッピー",
            "value": "preppy traditional fashion, neat tailored casual style",
            "family": "日常・カジュアル"
          },
          {
            "label": "Tシャツ",
            "value": "simple casual t-shirt",
            "family": "日常・カジュアル"
          },
          {
            "label": "シャツ・ブラウス",
            "value": "simple shirt or blouse outfit",
            "family": "日常・カジュアル"
          },
          {
            "label": "ニット・セーター",
            "value": "soft knit sweater outfit",
            "family": "日常・カジュアル"
          },
          {
            "label": "パーカー",
            "value": "casual hoodie outfit",
            "family": "日常・カジュアル"
          },
          {
            "label": "デニム・ジーンズ",
            "value": "casual denim jeans outfit",
            "family": "日常・カジュアル"
          },
          {
            "label": "レザージャケット・ライダース",
            "value": "cool leather jacket",
            "family": "日常・カジュアル"
          },
          {
            "label": "コート・冬服",
            "value": "warm winter coat and layered clothing",
            "family": "日常・カジュアル"
          },
          {
            "label": "トレンチコート",
            "value": "classic trench coat",
            "family": "日常・カジュアル"
          },
          {
            "label": "ロングコート",
            "value": "long elegant coat",
            "family": "日常・カジュアル"
          },
          {
            "label": "マフラー・ストール",
            "value": "scarf wrapped around the neck",
            "family": "日常・カジュアル"
          },
          {
            "label": "ワンピース",
            "value": "elegant one-piece dress",
            "family": "日常・カジュアル"
          },
          {
            "label": "ロングスカート",
            "value": "long flowing skirt",
            "family": "日常・カジュアル"
          },
          {
            "label": "シャツ＋スラックス",
            "value": "shirt with tailored trousers",
            "family": "日常・カジュアル"
          },
          {
            "label": "ベスト付きシャツ",
            "value": "button-up shirt with a tailored vest",
            "family": "日常・カジュアル"
          },
          {
            "label": "スポーツウェア",
            "value": "modern athletic sportswear",
            "family": "日常・カジュアル"
          },
          {
            "label": "ジャージ・トラックジャケット",
            "value": "casual athletic tracksuit jacket with side stripes",
            "family": "日常・カジュアル"
          },
          {
            "label": "部屋着ジャージ",
            "value": "oversized comfy loungewear tracksuit, relaxed home style",
            "family": "日常・カジュアル"
          },
          {
            "label": "部屋着・ルームウェア",
            "value": "comfortable home loungewear",
            "family": "日常・カジュアル"
          },
          {
            "label": "スーツ",
            "value": "formal suit",
            "family": "フォーマル・ドレス"
          },
          {
            "label": "シャツ＋スラックス",
            "value": "shirt with tailored trousers",
            "family": "フォーマル・ドレス"
          },
          {
            "label": "ベスト付きシャツ",
            "value": "button-up shirt with a tailored vest",
            "family": "フォーマル・ドレス"
          },
          {
            "label": "ドレス・正装（汎用）",
            "value": "formal elegant attire, sophisticated evening wear",
            "family": "フォーマル・ドレス"
          },
          {
            "label": "イブニングドレス（大人風）",
            "value": "sleek elegant evening dress, sophisticated gown",
            "family": "フォーマル・ドレス"
          },
          {
            "label": "プリンセスドレス（豪華・フリル）",
            "value": "ornate princess ballgown with voluminous layers and elaborate details",
            "family": "フォーマル・ドレス"
          },
          {
            "label": "タキシード・燕尾服（男性正装）",
            "value": "sharp formal tuxedo or tailcoat with a bow tie",
            "family": "フォーマル・ドレス"
          },
          {
            "label": "カクテルドレス（膝丈・華やか）",
            "value": "chic cocktail dress, stylish semi-formal outfit",
            "family": "フォーマル・ドレス"
          },
          {
            "label": "ウェディングドレス",
            "value": "pure white bridal wedding dress with a long trailing veil",
            "family": "フォーマル・ドレス"
          },
          {
            "label": "カラードレス（ブライダル）",
            "value": "elegant colorful bridal gown, romantic wedding attire",
            "family": "フォーマル・ドレス"
          },
          {
            "label": "新郎タキシード・ブライダル",
            "value": "handsome white groom tuxedo with a corsage, wedding suit",
            "family": "フォーマル・ドレス"
          },
          {
            "label": "和装",
            "value": "traditional Japanese attire",
            "family": "和装"
          },
          {
            "label": "着物",
            "value": "traditional Japanese kimono",
            "family": "和装"
          },
          {
            "label": "浴衣",
            "value": "Japanese yukata summer kimono",
            "family": "和装"
          },
          {
            "label": "袴",
            "value": "traditional Japanese hakama",
            "family": "和装"
          },
          {
            "label": "白無垢",
            "value": "traditional Japanese Shiromuku, pure white bridal kimono with Wataboshi hood",
            "family": "和装"
          },
          {
            "label": "色打掛",
            "value": "gorgeous Japanese Irouchikake, rich colorful embroidered bridal kimono",
            "family": "和装"
          },
          {
            "label": "巫女服",
            "value": "Japanese miko priestess attire, red hakama and white kosode",
            "family": "和装"
          },
          {
            "label": "狩衣・陰陽師",
            "value": "traditional kariginu robe, Onmyoji priest attire",
            "family": "和装"
          },
          {
            "label": "着崩し・花魁風",
            "value": "off-the-shoulder stylized kimono, relaxed elegant Japanese attire",
            "family": "和装"
          },
          {
            "label": "和洋折衷",
            "value": "Taisho-roman style, Japanese-Western fusion outfit with boots and kimono",
            "family": "和装"
          },
          {
            "label": "サムライ",
            "value": "samurai outfit, rugged traditional Japanese warrior attire",
            "family": "和装"
          },
          {
            "label": "ファンタジー衣装",
            "value": "fantasy adventurer clothing",
            "family": "ファンタジー・歴史"
          },
          {
            "label": "ローブ・マント",
            "value": "fantasy robe and flowing cloak",
            "family": "ファンタジー・歴史"
          },
          {
            "label": "甲冑・アーマー",
            "value": "fantasy knight armor",
            "family": "ファンタジー・歴史"
          },
          {
            "label": "王族・貴族風",
            "value": "ornate royal or aristocratic attire",
            "family": "ファンタジー・歴史"
          },
          {
            "label": "ゴシック",
            "value": "gothic fashion",
            "family": "ファンタジー・歴史"
          },
          {
            "label": "ロリータ",
            "value": "elegant lolita fashion",
            "family": "ファンタジー・歴史"
          },
          {
            "label": "修道服・聖職者",
            "value": "religious clergy vestments or nun habit",
            "family": "ファンタジー・歴史"
          },
          {
            "label": "SF・未来服",
            "value": "futuristic sci-fi clothing, sleek minimalist aesthetic",
            "family": "SF・近未来"
          },
          {
            "label": "サイバーパンク衣装",
            "value": "cyberpunk streetwear, neon glowing accents, tactical straps, high-tech urban style",
            "family": "SF・近未来"
          },
          {
            "label": "サイバースーツ・プラグスーツ",
            "value": "full-body sleek sci-fi plugsuit, form-fitting bodysuit, glowing accents, futuristic armor plates",
            "family": "SF・近未来"
          },
          {
            "label": "メカニックアーマー・パワードスーツ",
            "value": "high-tech mechanical armor suit, heavy sci-fi exo-suit, futuristic combat gear",
            "family": "SF・近未来"
          },
          {
            "label": "SFパイロットスーツ",
            "value": "futuristic spaceship pilot flight suit, technical bodysuit with harness and life-support details",
            "family": "SF・近未来"
          },
          {
            "label": "宇宙服・スペーススーツ",
            "value": "modern sleek astronaut space suit, futuristic space exploration gear",
            "family": "SF・近未来"
          },
          {
            "label": "近未来コート・ロングコート",
            "value": "futuristic long trench coat, glowing neon line accents, high-collar sci-fi outerwear",
            "family": "SF・近未来"
          },
          {
            "label": "サイバーアイドル衣装",
            "value": "futuristic cyber idol costume, cute holographic frills, metallic fabric, glowing ribbons",
            "family": "SF・近未来"
          },
          {
            "label": "近未来ミリタリー",
            "value": "futuristic military tactical gear, sci-fi soldier outfit, holographic visor and body armor",
            "family": "SF・近未来"
          },
          {
            "label": "アンドロイド・ロボット風",
            "value": "sleek android outfit, seamless artificial joints, futuristic synthetic clothing, glowing core accent",
            "family": "SF・近未来"
          },
          {
            "label": "ホログラフィック・シースルー衣装",
            "value": "futuristic holographic iridescent outfit, translucent vinyl fabric, glowing color shift",
            "family": "SF・近未来"
          },
          {
            "label": "レトロフューチャー",
            "value": "1960s retro-futurism fashion, vintage space age clothing, metallic silver fabric, round geometric design",
            "family": "SF・近未来"
          },
          {
            "label": "ディストピア・サバイバー",
            "value": "post-apocalyptic sci-fi clothing, rugged tactical gear, gas mask, weathered futuristic scavenger style",
            "family": "SF・近未来"
          },
          {
            "label": "軍装・ミリタリー",
            "value": "stylized military-inspired clothing",
            "family": "ミリタリー・軍服"
          },
          {
            "label": "白の軍服",
            "value": "ornate white military dress uniform, gold embroidery",
            "family": "ミリタリー・軍服"
          },
          {
            "label": "黒の軍服",
            "value": "sharp black military dress uniform, sleek intimidating style",
            "family": "ミリタリー・軍服"
          },
          {
            "label": "赤の軍服",
            "value": "vibrant red parade military uniform, ceremonial epaulets",
            "family": "ミリタリー・軍服"
          },
          {
            "label": "近代野戦服・迷彩",
            "value": "modern tactical military combat uniform, camouflage pattern",
            "family": "ミリタリー・軍服"
          },
          {
            "label": "パイロット・飛行服",
            "value": "military aviator flight suit, flight jacket and harness",
            "family": "ミリタリー・軍服"
          },
          {
            "label": "将校コート・大衣",
            "value": "heavy military officer overcoat draped over shoulders",
            "family": "ミリタリー・軍服"
          },
          {
            "label": "旧式軍服",
            "value": "vintage classic 19th-century military uniform, brass buttons",
            "family": "ミリタリー・軍服"
          },
          {
            "label": "白衣・研究員",
            "value": "white lab coat over professional clothing, scientist attire",
            "family": "職業・コスチューム"
          },
          {
            "label": "看護師",
            "value": "medical nurse uniform, clean professional healthcare attire",
            "family": "職業・コスチューム"
          },
          {
            "label": "クラシックメイド服",
            "value": "traditional long Victorian maid outfit, modest long skirt and apron",
            "family": "職業・コスチューム"
          },
          {
            "label": "フレンチメイド服",
            "value": "classic French maid outfit, frilly apron dress, headpiece",
            "family": "職業・コスチューム"
          },
          {
            "label": "執事",
            "value": "sophisticated butler uniform, sharp vest, white gloves, tailored suit",
            "family": "職業・コスチューム"
          },
          {
            "label": "警察官",
            "value": "police officer uniform, sharp dark uniform with badge and belt",
            "family": "職業・コスチューム"
          },
          {
            "label": "消防士",
            "value": "firefighter turnout gear, heavy protective jacket and boots",
            "family": "職業・コスチューム"
          },
          {
            "label": "旅客機パイロット",
            "value": "airline pilot uniform, sharp dark jacket with gold shoulder epaulets, necktie, pilot hat",
            "family": "職業・コスチューム"
          },
          {
            "label": "キャビンアテンダント・CA",
            "value": "flight attendant uniform, elegant tailored jacket and skirt, neck scarf, neat professional attire",
            "family": "職業・コスチューム"
          },
          {
            "label": "シェフ",
            "value": "chef jacket outfit, white double-breasted uniform with chef hat",
            "family": "職業・コスチューム"
          },
          {
            "label": "バーテンダー",
            "value": "stylish bartender outfit, crisp shirt with vest and bow tie",
            "family": "職業・コスチューム"
          },
          {
            "label": "ウェイター・ウェイトレス",
            "value": "restaurant waiter uniform, clean apron over crisp shirt and trousers",
            "family": "職業・コスチューム"
          },
          {
            "label": "作業着",
            "value": "practical heavy-duty workwear, jumpsuit or utility jacket",
            "family": "職業・コスチューム"
          },
          {
            "label": "整備士",
            "value": "mechanic overalls, boiler suit with subtle oil smudges",
            "family": "職業・コスチューム"
          },
          {
            "label": "エプロン",
            "value": "simple apron over everyday clothing",
            "family": "職業・コスチューム"
          },
          {
            "label": "探偵",
            "value": "classic detective attire, trench coat and fedora, subtle vintage style",
            "family": "職業・コスチューム"
          }
        ]
      },
      {
        "id": "character-expression",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "表情・感情",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "満面の笑み",
            "value": "beaming happy smile"
          },
          {
            "label": "穏やかな微笑み",
            "value": "gentle subtle smile"
          },
          {
            "label": "寂しげな微笑み",
            "value": "lonely bittersweet smile"
          },
          {
            "label": "照れ・はにかみ",
            "value": "shy bashful expression"
          },
          {
            "label": "ウインク",
            "value": "playful winking expression"
          },
          {
            "label": "含み笑い",
            "value": "subtle knowing smirk, amused expression"
          },
          {
            "label": "意味ありげな笑み",
            "value": "knowing enigmatic smile"
          },
          {
            "label": "得意げ",
            "value": "smug self-satisfied expression"
          },
          {
            "label": "意地悪な笑み",
            "value": "wicked mischievous grin"
          },
          {
            "label": "ほくそ笑む",
            "value": "quietly gloating expression, sinister pleased smile"
          },
          {
            "label": "挑発的",
            "value": "provocative challenging expression"
          },
          {
            "label": "誘惑するような表情",
            "value": "seductive alluring expression"
          },
          {
            "label": "歓喜・高揚",
            "value": "joyful exhilarated expression"
          },
          {
            "label": "安堵",
            "value": "relieved softened expression"
          },
          {
            "label": "無表情",
            "value": "emotionless expression"
          },
          {
            "label": "キリッとした・真剣",
            "value": "serious determined expression"
          },
          {
            "label": "ポーカーフェイス",
            "value": "poker-faced calm expression"
          },
          {
            "label": "気まずさ",
            "value": "awkward embarrassed expression"
          },
          {
            "label": "困惑・呆然",
            "value": "bewildered stunned expression"
          },
          {
            "label": "不機嫌・むすっとした顔",
            "value": "pouting sulky expression"
          },
          {
            "label": "不安・戸惑い",
            "value": "anxious uncertain expression"
          },
          {
            "label": "怯え・恐怖",
            "value": "frightened fearful expression"
          },
          {
            "label": "憂い",
            "value": "melancholic wistful expression"
          },
          {
            "label": "泣きそう",
            "value": "eyes filled with restrained tears"
          },
          {
            "label": "涙を流す",
            "value": "tears streaming down the face"
          },
          {
            "label": "泣き笑い",
            "value": "tearful bittersweet smile, laughing through tears"
          },
          {
            "label": "疲労・消耗",
            "value": "exhausted weary expression"
          },
          {
            "label": "諦め",
            "value": "resigned expression, quiet acceptance"
          },
          {
            "label": "虚無・生気がない",
            "value": "vacant hollow expression, emotionally numb"
          },
          {
            "label": "嫌悪",
            "value": "disgusted expression"
          },
          {
            "label": "軽蔑",
            "value": "contemptuous expression"
          },
          {
            "label": "怒り",
            "value": "angry expression"
          },
          {
            "label": "激怒・叫び",
            "value": "furious shouting expression"
          },
          {
            "label": "狂気・高笑い",
            "value": "maniacal insane grin"
          },
          {
            "label": "舌出し",
            "value": "playfully sticking out tongue"
          },
          {
            "label": "目を閉じる",
            "value": "eyes closed, introspective expression"
          },
          {
            "label": "視線を逸らす",
            "value": "gaze turned away from the viewer"
          },
          {
            "label": "誰かを見つめる",
            "value": "gazing intently at another person"
          },
          {
            "label": "疑いの目",
            "value": "suspicious skeptical expression, narrowed gaze"
          },
          {
            "label": "警戒",
            "value": "guarded wary expression, alert gaze"
          },
          {
            "label": "言葉を飲み込む",
            "value": "hesitant expression as if holding back unspoken words"
          }
        ]
      },
      {
        "id": "character-pose",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "ポーズ・動作",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "立つ",
            "value": "standing naturally"
          },
          {
            "label": "座る",
            "value": "sitting quietly"
          },
          {
            "label": "膝を抱えて座る",
            "value": "sitting with knees hugged to chest"
          },
          {
            "label": "しゃがむ・膝をつく",
            "value": "crouching down on one knee"
          },
          {
            "label": "壁にもたれる",
            "value": "leaning wearily against a wall"
          },
          {
            "label": "横たわる・寝そべる",
            "value": "lying down resting"
          },
          {
            "label": "歩く",
            "value": "walking through the scene"
          },
          {
            "label": "走る",
            "value": "running dynamically"
          },
          {
            "label": "振り返る",
            "value": "looking back over the shoulder"
          },
          {
            "label": "見上げる",
            "value": "looking upward"
          },
          {
            "label": "俯く",
            "value": "looking downward"
          },
          {
            "label": "横顔・横を向く",
            "value": "profile view, looking to the side"
          },
          {
            "label": "腕組み",
            "value": "crossing arms"
          },
          {
            "label": "手をポケットに入れる",
            "value": "hands in pockets"
          },
          {
            "label": "手を伸ばす",
            "value": "reaching out with one hand"
          },
          {
            "label": "胸に手を当てる",
            "value": "holding hand to chest"
          },
          {
            "label": "頭を抱える・悩む",
            "value": "holding head in hands, distressed pose"
          },
          {
            "label": "何かを読む",
            "value": "reading a book or letter"
          },
          {
            "label": "書く",
            "value": "writing by hand"
          },
          {
            "label": "窓辺に立つ",
            "value": "standing beside a window"
          },
          {
            "label": "何かに触れる",
            "value": "reaching toward and touching an environmental object"
          },
          {
            "label": "風を受ける",
            "value": "standing in the wind with clothing and hair flowing"
          },
          {
            "label": "二人が向き合う",
            "value": "two characters facing each other"
          },
          {
            "label": "背中合わせ",
            "value": "two characters standing back to back"
          }
        ]
      },
      {
        "id": "character-gaze",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "視線・向き",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "カメラ目線",
            "value": "looking directly at the viewer"
          },
          {
            "label": "視線を外す",
            "value": "gaze directed away from the camera"
          },
          {
            "label": "正面顔・まっすぐ前を見る",
            "value": "front view, looking straight ahead"
          },
          {
            "label": "横を見る",
            "value": "looking toward the side"
          },
          {
            "label": "上を見る",
            "value": "gazing upward"
          },
          {
            "label": "下を見る",
            "value": "gazing downward"
          },
          {
            "label": "目線を伏せる",
            "value": "lowered gaze, introspective mood"
          },
          {
            "label": "上目遣い",
            "value": "looking up at the viewer, upturned gaze"
          },
          {
            "label": "見下ろす視線",
            "value": "looking down at the viewer, cold downcast gaze"
          },
          {
            "label": "流し目",
            "value": "glancing sideways, sidelong glance"
          },
          {
            "label": "遠くを見る",
            "value": "gazing into the distant scenery"
          },
          {
            "label": "ぼんやりと眺める",
            "value": "staring blankly into space, absentminded gaze"
          },
          {
            "label": "何かを見つめる",
            "value": "intently observing an unseen object or event"
          },
          {
            "label": "目を閉じる",
            "value": "eyes closed peacefully"
          },
          {
            "label": "振り返りざまの視線",
            "value": "glancing back over the shoulder at the viewer"
          },
          {
            "label": "相手を見る",
            "value": "looking directly at another character"
          },
          {
            "label": "視線が交わらない",
            "value": "characters looking in different directions"
          }
        ]
      },
      {
        "id": "character-hands",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "手・指の動き",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "自然に下ろす",
            "value": "arms resting naturally at the sides"
          },
          {
            "label": "胸元に手を置く",
            "value": "one hand resting near the chest"
          },
          {
            "label": "顔に触れる",
            "value": "hand gently touching the face"
          },
          {
            "label": "髪に触れる",
            "value": "fingers lightly touching the hair"
          },
          {
            "label": "口元に手を添える",
            "value": "hand near the mouth"
          },
          {
            "label": "顎に手を当てる",
            "value": "hand on chin, thinking pose"
          },
          {
            "label": "手で顔を覆う",
            "value": "covering face with hands"
          },
          {
            "label": "メガネのフチに手をかける",
            "value": "adjusting glasses with fingers"
          },
          {
            "label": "ピースサイン",
            "value": "making a peace sign"
          },
          {
            "label": "指差し",
            "value": "pointing with one finger"
          },
          {
            "label": "頬杖をつく",
            "value": "resting chin on hand, leaning on hand"
          },
          {
            "label": "両手で頬杖",
            "value": "resting face in both hands, cupping cheek in hands"
          },
          {
            "label": "口元に人差し指",
            "value": "shushing gesture with index finger on lips"
          },
          {
            "label": "指を組む",
            "value": "interlocked fingers"
          },
          {
            "label": "拳を握る",
            "value": "hands clenched into fists"
          },
          {
            "label": "手を伸ばし合う",
            "value": "two hands reaching toward each other"
          },
          {
            "label": "指先が触れる",
            "value": "fingertips gently touching"
          },
          {
            "label": "手を繋ぐ・握る",
            "value": "holding hands together, hands clasped together"
          },
          {
            "label": "手首を掴む",
            "value": "grabbing the wrist"
          },
          {
            "label": "何かをつまむ",
            "value": "fingers delicately holding a small object"
          },
          {
            "label": "ポケットに手",
            "value": "hands resting in pockets"
          },
          {
            "label": "傘の柄を握る",
            "value": "hand gripping an umbrella handle"
          }
        ]
      },
      {
        "id": "character-accessory",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "アクセサリー・身につけるもの",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "眼鏡",
            "value": "glasses"
          },
          {
            "label": "丸眼鏡",
            "value": "round framed glasses"
          },
          {
            "label": "黒縁メガネ",
            "value": "thick black-framed glasses"
          },
          {
            "label": "モノクル・単眼鏡",
            "value": "classic monocle"
          },
          {
            "label": "サングラス",
            "value": "stylish sunglasses"
          },
          {
            "label": "眼帯",
            "value": "eyepatch"
          },
          {
            "label": "医療用マスク",
            "value": "face mask"
          },
          {
            "label": "ヴェール・面布",
            "value": "sheer face veil"
          },
          {
            "label": "イヤリング・ピアス",
            "value": "earrings or piercings"
          },
          {
            "label": "イヤーカフ",
            "value": "stylish ear cuff"
          },
          {
            "label": "イヤホン・ヘッドホン",
            "value": "headphones around neck or over ears"
          },
          {
            "label": "ネックレス",
            "value": "pendant necklace"
          },
          {
            "label": "ロザリオ・十字架",
            "value": "rosary cross necklace"
          },
          {
            "label": "チョーカー",
            "value": "choker necklace"
          },
          {
            "label": "ネクタイ・ループタイ",
            "value": "necktie or bolo tie"
          },
          {
            "label": "マフラー・ストール",
            "value": "cozy scarf"
          },
          {
            "label": "指輪",
            "value": "rings on fingers"
          },
          {
            "label": "アーマーリング",
            "value": "gothic full-finger armor ring"
          },
          {
            "label": "腕時計",
            "value": "wristwatch"
          },
          {
            "label": "ブレスレット・バングル",
            "value": "bracelet or bangle"
          },
          {
            "label": "数珠・念珠",
            "value": "traditional prayer beads bracelet"
          },
          {
            "label": "手袋",
            "value": "sleek gloves"
          },
          {
            "label": "レースの手袋",
            "value": "delicate lace gloves"
          },
          {
            "label": "帽子",
            "value": "stylish hat"
          },
          {
            "label": "ベレー帽",
            "value": "beret"
          },
          {
            "label": "ニット帽",
            "value": "cozy beanie hat"
          },
          {
            "label": "キャップ",
            "value": "casual baseball cap"
          },
          {
            "label": "フード",
            "value": "hood pulled over head"
          },
          {
            "label": "ヘアピン・髪飾り",
            "value": "decorative hairpin or hair ornament"
          },
          {
            "label": "かんざし",
            "value": "traditional Japanese kanzashi hair stick"
          },
          {
            "label": "リボン",
            "value": "ribbon accessory"
          },
          {
            "label": "カチューシャ・ヘアバンド",
            "value": "headband or hairband"
          },
          {
            "label": "ヘッドドレス",
            "value": "gothic lolita headdress"
          },
          {
            "label": "王冠・ティアラ",
            "value": "tiara or small crown"
          },
          {
            "label": "花飾り・コサージュ",
            "value": "flower hair accessory"
          },
          {
            "label": "ベルト・ボディハーネス",
            "value": "decorative belt or body harness"
          },
          {
            "label": "ガーターリング・レッグハーネス",
            "value": "garter ring or leg harness"
          },
          {
            "label": "包帯・絆創膏",
            "value": "bandages or adhesive bandages"
          },
          {
            "label": "タトゥー・ペイント",
            "value": "subtle facial or body tattoo"
          },
          {
            "label": "つけ耳・ケモミミ",
            "value": "animal ears headband"
          },
          {
            "label": "角（ツノ）",
            "value": "demonic or fantasy horns"
          },
          {
            "label": "狐のお面・仮面",
            "value": "Japanese kitsune mask or decorative mask"
          }
        ]
      },
      {
        "id": "character-props",
        "group": "character-detail",
        "modes": [
          "character",
          "all"
        ],
        "title": "手に持つもの",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "スマートフォン",
            "value": "smartphone"
          },
          {
            "label": "本",
            "value": "open book"
          },
          {
            "label": "ノート・手帳",
            "value": "notebook or planner"
          },
          {
            "label": "手紙・封筒",
            "value": "letter or envelope"
          },
          {
            "label": "万年筆",
            "value": "fountain pen"
          },
          {
            "label": "カメラ",
            "value": "camera"
          },
          {
            "label": "傘",
            "value": "umbrella"
          },
          {
            "label": "花束",
            "value": "bouquet of flowers"
          },
          {
            "label": "一輪の花",
            "value": "single flower"
          },
          {
            "label": "鍵",
            "value": "small key"
          },
          {
            "label": "古い懐中時計",
            "value": "antique pocket watch"
          },
          {
            "label": "ランタン",
            "value": "small lantern"
          },
          {
            "label": "ぬいぐるみ",
            "value": "small stuffed animal"
          },
          {
            "label": "飲み物",
            "value": "cup or drink in hand"
          },
          {
            "label": "楽器",
            "value": "musical instrument"
          },
          {
            "label": "学生鞄",
            "value": "school bag"
          },
          {
            "label": "リュック・バックパック",
            "value": "casual backpack"
          },
          {
            "label": "懐中時計",
            "value": "pocket watch"
          },
          {
            "label": "杖",
            "value": "staff or wand held in hand"
          },
          {
            "label": "剣",
            "value": "sword held in hand"
          },
          {
            "label": "刀",
            "value": "katana held in hand"
          },
          {
            "label": "日本刀",
            "value": "Japanese katana held in hand"
          },
          {
            "label": "短剣",
            "value": "dagger held in hand"
          },
          {
            "label": "ナイフ",
            "value": "knife held in hand"
          },
          {
            "label": "拳銃",
            "value": "handgun held in hand"
          },
          {
            "label": "ライフル",
            "value": "rifle held in hand"
          },
          {
            "label": "ショットガン",
            "value": "shotgun held in hand"
          },
          {
            "label": "弓",
            "value": "bow held in hand"
          },
          {
            "label": "槍",
            "value": "spear held in hand"
          }
        ]
      },
      {
        "id": "landscape-modern",
        "group": "scene-detail",
        "modes": [
          "landscape",
          "character",
          "all"
        ],
        "title": "世界・現代",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "都会の街角",
            "value": "modern urban street"
          },
          {
            "label": "オフィス街",
            "value": "modern office district"
          },
          {
            "label": "繁華街",
            "value": "downtown street"
          },
          {
            "label": "商店街",
            "value": "Japanese shopping street"
          },
          {
            "label": "住宅街",
            "value": "quiet residential neighborhood"
          },
          {
            "label": "踏切のある住宅街",
            "value": "residential neighborhood with a railway crossing"
          },
          {
            "label": "路地裏",
            "value": "narrow back alley"
          },
          {
            "label": "歩道橋",
            "value": "pedestrian overpass"
          },
          {
            "label": "高架下・ガード下",
            "value": "area under a railway viaduct"
          },
          {
            "label": "地下道・地下通路",
            "value": "underground pedestrian passage"
          },
          {
            "label": "公園",
            "value": "urban park with benches"
          },
          {
            "label": "河川敷・土手",
            "value": "grassy riverbank"
          },
          {
            "label": "屋上",
            "value": "urban rooftop"
          },
          {
            "label": "駅前ロータリー",
            "value": "station plaza"
          },
          {
            "label": "駅・ホーム",
            "value": "train station platform"
          },
          {
            "label": "電車の車内",
            "value": "train interior"
          },
          {
            "label": "学校",
            "value": "Japanese school campus"
          },
          {
            "label": "学校の教室",
            "value": "Japanese classroom interior"
          },
          {
            "label": "図書室",
            "value": "school library room"
          },
          {
            "label": "体育館",
            "value": "school gymnasium"
          },
          {
            "label": "病院の廊下",
            "value": "hospital corridor"
          },
          {
            "label": "図書館",
            "value": "public library interior"
          },
          {
            "label": "アパートの部屋",
            "value": "small apartment room"
          },
          {
            "label": "古いアパート",
            "value": "aged Japanese apartment building"
          },
          {
            "label": "団地",
            "value": "Japanese housing complex"
          },
          {
            "label": "窓辺",
            "value": "room beside a window"
          },
          {
            "label": "喫茶店・カフェ",
            "value": "cozy cafe interior"
          },
          {
            "label": "コンビニ",
            "value": "convenience store"
          },
          {
            "label": "コインランドリー",
            "value": "laundromat"
          },
          {
            "label": "海辺の町",
            "value": "seaside town"
          },
          {
            "label": "港",
            "value": "harbor town"
          },
          {
            "label": "田園・農村",
            "value": "rural Japanese countryside"
          }
        ]
      },
      {
        "id": "landscape-historical",
        "group": "scene-detail",
        "modes": [
          "landscape",
          "character",
          "all"
        ],
        "title": "世界・歴史／和風",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "古都",
            "value": "historic Japanese capital with traditional architecture"
          },
          {
            "label": "城下町",
            "value": "traditional Japanese castle town"
          },
          {
            "label": "江戸の町",
            "value": "Edo-period Japanese townscape"
          },
          {
            "label": "明治・大正の街並み",
            "value": "Meiji or Taisho era Japanese streetscape"
          },
          {
            "label": "昭和レトロの街",
            "value": "nostalgic mid-century Japanese streetscape"
          },
          {
            "label": "古い港町",
            "value": "historic Japanese port town"
          },
          {
            "label": "農村の集落",
            "value": "traditional rural Japanese village"
          },
          {
            "label": "遊郭・花街",
            "value": "traditional red-light district with Japanese lanterns"
          },
          {
            "label": "神社・鳥居",
            "value": "traditional Shinto shrine with red torii gates"
          },
          {
            "label": "武家屋敷・日本庭園",
            "value": "traditional samurai residence and Japanese garden"
          },
          {
            "label": "和室・畳部屋",
            "value": "traditional Japanese tatami room"
          },
          {
            "label": "竹林の小道",
            "value": "path through a dense bamboo forest"
          },
          {
            "label": "中世ヨーロッパの街",
            "value": "medieval European town"
          },
          {
            "label": "古い洋館・洋風街並み",
            "value": "historic town with Western-style architecture"
          },
          {
            "label": "ヴィクトリア朝の街",
            "value": "Victorian era streetscape"
          },
          {
            "label": "産業革命風の都市",
            "value": "industrial-era city with factories and smokestacks"
          },
          {
            "label": "蒸気機関の街（スチームパンク）",
            "value": "steampunk city powered by brass machinery and steam"
          }
        ]
      },
      {
        "id": "landscape-fantasy",
        "group": "scene-detail",
        "modes": [
          "landscape",
          "all"
        ],
        "title": "世界・幻想",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "王都・城下町",
            "value": "grand fantasy capital city"
          },
          {
            "label": "魔法都市",
            "value": "magical city with fantasy architecture"
          },
          {
            "label": "中世の村",
            "value": "quiet medieval fantasy village"
          },
          {
            "label": "冒険者ギルド・酒場",
            "value": "cozy fantasy adventurer guild tavern"
          },
          {
            "label": "魔法学園",
            "value": "magical fantasy academy"
          },
          {
            "label": "王宮の玉座の間",
            "value": "grand fantasy palace throne room"
          },
          {
            "label": "魔王城・暗黒城",
            "value": "dark menacing villain castle"
          },
          {
            "label": "古城・廃城",
            "value": "ancient castle ruins"
          },
          {
            "label": "神殿・遺跡",
            "value": "mysterious ancient temple ruins"
          },
          {
            "label": "ダンジョン・迷宮",
            "value": "stone fantasy dungeon corridor"
          },
          {
            "label": "地下都市",
            "value": "vast underground fantasy city"
          },
          {
            "label": "晶洞・水晶の洞窟",
            "value": "glowing crystal cave"
          },
          {
            "label": "魔法の森・発光する森",
            "value": "enchanted forest with bioluminescent plants"
          },
          {
            "label": "巨大樹・世界樹の麓",
            "value": "base of a giant sacred world tree"
          },
          {
            "label": "幻想的な花畑",
            "value": "dreamlike fantasy flower field"
          },
          {
            "label": "幻想的な湖・水辺",
            "value": "serene magical fantasy lake"
          },
          {
            "label": "深海・水中の都市",
            "value": "mystical underwater fantasy city"
          },
          {
            "label": "浮遊都市・天空の城",
            "value": "floating city suspended in the sky"
          },
          {
            "label": "空中庭園",
            "value": "floating fantasy garden"
          },
          {
            "label": "異形の荒野",
            "value": "otherworldly barren wasteland"
          },
          {
            "label": "異界・亜空間",
            "value": "surreal otherworldly dimension"
          }
        ]
      },
      {
        "id": "landscape-sf",
        "group": "scene-detail",
        "modes": [
          "landscape",
          "all"
        ],
        "title": "世界・SF",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "近未来都市",
            "value": "near-future megacity"
          },
          {
            "label": "サイバーパンクの街",
            "value": "cyberpunk city street with glowing billboards"
          },
          {
            "label": "サイバーパンクのスラム街",
            "value": "dystopian cyberpunk alleyway with cluttered cables and neon lights"
          },
          {
            "label": "ディストピア都市",
            "value": "oppressive dystopian megacity"
          },
          {
            "label": "ソーラーパンク都市（緑と未来技術）",
            "value": "solarpunk eco-city with futuristic glass architecture and lush greenery"
          },
          {
            "label": "機械都市",
            "value": "vast machine-driven industrial city"
          },
          {
            "label": "海上都市",
            "value": "floating ocean megacity"
          },
          {
            "label": "研究施設・ラボ",
            "value": "advanced futuristic laboratory"
          },
          {
            "label": "培養室・生体ラボ",
            "value": "futuristic bio-lab with glowing stasis pods"
          },
          {
            "label": "コックピット・操縦席",
            "value": "futuristic spaceship cockpit with holographic displays"
          },
          {
            "label": "宇宙船内",
            "value": "interior of a futuristic spacecraft"
          },
          {
            "label": "格納庫・ハンガー",
            "value": "vast futuristic spaceship hangar"
          },
          {
            "label": "宇宙ステーション",
            "value": "vast orbital space station"
          },
          {
            "label": "宇宙コロニー",
            "value": "vast rotating orbital colony"
          },
          {
            "label": "月面基地",
            "value": "isolated lunar research base"
          },
          {
            "label": "火星開拓地",
            "value": "remote Mars settlement under an alien sky"
          },
          {
            "label": "宇宙空間",
            "value": "vast deep-space environment with distant nebulae and stars"
          },
          {
            "label": "サイバー空間・データ空間",
            "value": "abstract digital cyberspace"
          },
          {
            "label": "仮想現実空間（VR）",
            "value": "immersive virtual reality environment"
          },
          {
            "label": "地下シェルター",
            "value": "sealed underground survival shelter"
          },
          {
            "label": "荒廃した未来都市",
            "value": "post-apocalyptic futuristic city ruins"
          },
          {
            "label": "廃墟化した研究都市",
            "value": "abandoned futuristic research city"
          },
        ]
      },
      {
        "id": "landscape-steampunk",
        "group": "scene-detail",
        "modes": [
          "landscape",
          "character",
          "all"
        ],
        "title": "世界・スチームパンク",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "蒸気都市",
            "value": "sprawling Victorian steampunk city with rising steam"
          },
          {
            "label": "歯車の街",
            "value": "intricate steampunk city of brass machinery and enormous gears"
          },
          {
            "label": "時計塔都市",
            "value": "grand steampunk city dominated by a massive clock tower"
          },
          {
            "label": "霧の工業都市",
            "value": "foggy industrial city of chimneys, pipes, and iron structures"
          },
          {
            "label": "飛行船港",
            "value": "bustling airship port dock above a steampunk city"
          },
          {
            "label": "空中鉄道",
            "value": "elevated steam railway crossing high above the industrial city"
          },
          {
            "label": "飛行船のデッキ・船内",
            "value": "wooden deck of a brass steampunk airship looking at the sky"
          },
          {
            "label": "蒸気機関車の車内",
            "value": "interior of a luxurious Victorian steam train"
          },
          {
            "label": "機械工房・ガレージ",
            "value": "mechanical workshop filled with brass tools, gears, and machinery"
          },
          {
            "label": "時計塔の内部",
            "value": "interior of a giant clock tower filled with rotating gears"
          },
          {
            "label": "錬金術・科学研究室",
            "value": "Victorian alchemy laboratory with glowing flasks and brass instruments"
          },
          {
            "label": "地下機関区・ボイラールーム",
            "value": "vast underground engine room with glowing furnaces and steam pipes"
          },
          {
            "label": "廃工場・機械の廃墟",
            "value": "abandoned steampunk factory with rusted gears and pipes"
          }
        ]
      },
      {
        "id": "landscape-odd",
        "group": "scene-detail",
        "modes": [
          "landscape",
          "character",
          "all"
        ],
        "title": "世界・異形／怪異",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "妖怪の住む町",
            "value": "hidden town inhabited by Japanese spirits and yokai"
          },
          {
            "label": "怪異の路地",
            "value": "eerie back alley with supernatural shadows and red lanterns"
          },
          {
            "label": "あやかしの遊郭",
            "value": "surreal red-light district populated by mysterious spirits"
          },
          {
            "label": "忘れられた神社・神域",
            "value": "forgotten overgrown Shinto shrine with crumbling torii gates"
          },
          {
            "label": "呪われた屋敷",
            "value": "haunted cursed Japanese estate with decaying wooden halls"
          },
          {
            "label": "廃病院",
            "value": "eerie abandoned hospital corridor with flickering lights"
          },
          {
            "label": "廃校・夜の校舎",
            "value": "creepy abandoned school hallway at night"
          },
          {
            "label": "異形の森",
            "value": "uncanny forest of twisted trees and strange organic shapes"
          },
          {
            "label": "深海・邪神の遺構",
            "value": "sunken non-Euclidean city of ancient cosmic horrors"
          },
          {
            "label": "霊的な境界",
            "value": "liminal boundary between the living world and spirit realm"
          },
          {
            "label": "黄昏の無人街",
            "value": "uncanny deserted yellow-lit endless corridors, backrooms style"
          },
          {
            "label": "夢の中の街",
            "value": "surreal impossible city existing inside a bizarre dream"
          },
          {
            "label": "時間の歪んだ場所",
            "value": "fractured space where time bends with overlapping fragments"
          },
          {
            "label": "虚無の空間",
            "value": "endless void with floating architectural debris"
          }
        ]
      },
      {
        "id": "landscape-postapoc",
        "group": "scene-detail",
        "modes": [
          "landscape",
          "character",
          "all"
        ],
        "title": "世界・終末／荒廃",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "崩壊した都市",
            "value": "ruined modern city with collapsed skyscrapers"
          },
          {
            "label": "廃墟の街",
            "value": "deserted city ruins under an empty sky"
          },
          {
            "label": "植物に侵食された都市",
            "value": "overgrown city fully reclaimed by lush vegetation"
          },
          {
            "label": "砂に埋もれた都市",
            "value": "sunken city ruins half-buried in desert sand"
          },
          {
            "label": "浸水した街・水没都市",
            "value": "flooded city with abandoned buildings rising from clear water"
          },
          {
            "label": "雪と氷に閉ざされた都市",
            "value": "frozen city ruins buried under deep snow and ice"
          },
          {
            "label": "広大な荒野・世紀末",
            "value": "vast desolate wasteland with dusty horizon"
          },
          {
            "label": "無人の高速道路",
            "value": "abandoned highway with rusted cars stretching into the distance"
          },
          {
            "label": "廃線・草に覆われた線路",
            "value": "overgrown railway tracks with a rusted train"
          },
          {
            "label": "廃屋上の展望台",
            "value": "abandoned rooftop overlook looking out over a ruined city"
          },
          {
            "label": "廃遊園地",
            "value": "creepy abandoned amusement park with a rusted ferris wheel"
          },
          {
            "label": "旧文明の遺構・巨大機械",
            "value": "massive rusted mechanical wreckage of an ancient civilization"
          },
          {
            "label": "漂着した巨大船・陸に上がった船",
            "value": "giant stranded shipwreck in a dry wasteland"
          },
          {
            "label": "仮設避難所・集落",
            "value": "makeshift survivor shelter built from scavenged scrap material"
          }
        ]
      },
      {
        "id": "environment-place",
        "group": "scene-detail",
        "modes": [
          "landscape",
          "character",
          "all"
        ],
        "title": "舞台・場所",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "学校の教室",
            "value": "Japanese high school classroom"
          },
          {
            "label": "学校の廊下",
            "value": "sunlit school hallway with wooden floor"
          },
          {
            "label": "図書室",
            "value": "quiet school library with bookshelf aisles"
          },
          {
            "label": "保健室",
            "value": "school infirmary with white curtains and bed"
          },
          {
            "label": "校舎の屋上",
            "value": "school rooftop with chain-link fence overlooking the city"
          },
          {
            "label": "体育館・部室",
            "value": "spacious school gymnasium interior"
          },
          {
            "label": "自分の部屋・自室",
            "value": "cozy lived-in bedroom with desk and personal items"
          },
          {
            "label": "キッチン・ダイニング",
            "value": "warm modern home kitchen and dining area"
          },
          {
            "label": "バスルーム・浴室",
            "value": "clean modern bathroom with steaming bathtub"
          },
          {
            "label": "マンションのベランダ",
            "value": "apartment balcony overlooking a city skyline"
          },
          {
            "label": "駅のホーム・ベンチ",
            "value": "railway station platform with wooden benches"
          },
          {
            "label": "無人駅",
            "value": "lonely unmanned rural train station"
          },
          {
            "label": "電車の車内",
            "value": "interior of a Japanese commuter train"
          },
          {
            "label": "踏切・線路沿い",
            "value": "quiet Japanese railway crossing"
          },
          {
            "label": "バス停",
            "value": "lonely roadside bus stop"
          },
          {
            "label": "歩道橋",
            "value": "pedestrian overpass overlooking city traffic"
          },
          {
            "label": "横断歩道・交差点",
            "value": "busy city crosswalk"
          },
          {
            "label": "商店街・レトロ街",
            "value": "nostalgic Japanese shopping arcade"
          },
          {
            "label": "路地裏・自販機前",
            "value": "narrow Japanese back alley with glowing vending machines"
          },
          {
            "label": "高架下",
            "value": "urban space beneath elevated railway tracks"
          },
          {
            "label": "レトロ喫茶店・カフェ",
            "value": "cozy retro Japanese cafe interior"
          },
          {
            "label": "ファミレスのボックス席",
            "value": "booth seat inside a brightly lit family restaurant"
          },
          {
            "label": "古本屋・書店",
            "value": "small old used-book store interior"
          },
          {
            "label": "コンビニ",
            "value": "brightly lit Japanese convenience store at night"
          },
          {
            "label": "コインランドリー",
            "value": "retro laundromat with washing machines"
          },
          {
            "label": "銭湯・温泉街",
            "value": "nostalgic Japanese public bath house interior"
          },
          {
            "label": "古い洋館・和洋折衷建築",
            "value": "classic Western-style mansion interior with stained glass"
          },
          {
            "label": "和室・畳の部屋",
            "value": "traditional Japanese room with tatami mats"
          },
          {
            "label": "縁側・日本庭園",
            "value": "traditional Japanese veranda overlooking a peaceful garden"
          },
          {
            "label": "屋根裏部屋",
            "value": "dusty cozy attic room filled with vintage trinkets"
          },
          {
            "label": "神社・境内",
            "value": "peaceful Japanese shrine grounds with red torii gate"
          },
          {
            "label": "寺院・寺町",
            "value": "traditional Japanese temple grounds with stone lanterns"
          },
          {
            "label": "近所の公園・ベンチ",
            "value": "quiet neighborhood park with a wooden bench"
          },
          {
            "label": "遊園地・観覧車前",
            "value": "vibrant amusement park with a colorful ferris wheel"
          },
          {
            "label": "水族館・大水槽前",
            "value": "dimly lit aquarium with a massive glowing blue tank"
          },
          {
            "label": "ライブハウス・ステージ",
            "value": "dim live music club stage with colorful spotlights"
          },
          {
            "label": "ゲームセンター",
            "value": "retro arcade game center with glowing screens"
          },
          {
            "label": "河川敷・土手",
            "value": "grassy riverside embankment under an open sky"
          },
          {
            "label": "砂浜・ビーチ",
            "value": "sunny tropical sandy beach with clear turquoise water"
          },
          {
            "label": "海岸・防波堤",
            "value": "windswept seaside shore with concrete breakwater"
          },
          {
            "label": "灯台のある岬",
            "value": "solitary lighthouse on a grassy cliff"
          },
          {
            "label": "山道・ハイキングコース",
            "value": "quiet mountain trail surrounded by trees"
          },
          {
            "label": "キャンプ場・焚き火前",
            "value": "cozy campsite in the forest next to a glowing campfire"
          },
          {
            "label": "ひまわり畑",
            "value": "vast vibrant sunflower field under a summer blue sky"
          },
          {
            "label": "温室・植物園",
            "value": "lush glass greenhouse filled with tropical flowers"
          },
          {
            "label": "港・埠頭",
            "value": "quiet harbor dock and waterfront with docked boats"
          },
          {
            "label": "空港のターミナル・滑走路",
            "value": "modern airport terminal looking out at the runway"
          },
          {
            "label": "地下鉄ホーム・地下通路",
            "value": "empty underground subway station"
          },
          {
            "label": "オフィス・会議室",
            "value": "modern office interior with large windows"
          },
          {
            "label": "病院の廊下・病室",
            "value": "quiet sterile hospital corridor"
          },
          {
            "label": "美術館・ギャラリー",
            "value": "quiet art museum gallery with artwork on walls"
          },
          {
            "label": "軍事基地・格納庫",
            "value": "vast military hangar base with heavy machinery"
          },
          {
            "label": "廃墟・旧校舎",
            "value": "overgrown abandoned building interior"
          }
        ]
      },
      {
        "id": "environment-nature",
        "group": "scene-detail",
        "modes": [
          "landscape",
          "character",
          "all"
        ],
        "title": "自然・地形・天体",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "桜",
            "value": "cherry blossoms in the environment"
          },
          {
            "label": "紫陽花",
            "value": "hydrangeas in the environment"
          },
          {
            "label": "藤",
            "value": "wisteria flowers in the environment"
          },
          {
            "label": "薔薇",
            "value": "roses in the environment"
          },
          {
            "label": "百合",
            "value": "lilies in the environment"
          },
          {
            "label": "向日葵",
            "value": "sunflowers in the environment"
          },
          {
            "label": "朝顔",
            "value": "morning glories in the environment"
          },
          {
            "label": "金木犀",
            "value": "fragrant olive flowers in the environment"
          },
          {
            "label": "椿",
            "value": "camellia flowers in the environment"
          },
          {
            "label": "彼岸花",
            "value": "red spider lilies in the environment"
          },
          {
            "label": "新緑",
            "value": "fresh green foliage in the environment"
          },
          {
            "label": "紅葉",
            "value": "autumn foliage in the environment"
          },
          {
            "label": "落葉",
            "value": "fallen leaves covering the ground"
          },
          {
            "label": "花畑",
            "value": "a field filled with blooming flowers"
          },
          {
            "label": "花吹雪",
            "value": "a storm of drifting flower petals"
          },
          {
            "label": "海・水平線",
            "value": "open sea and distant horizon"
          },
          {
            "label": "湖",
            "value": "a quiet lake and its reflective surface"
          },
          {
            "label": "川・渓流",
            "value": "a clear river or mountain stream"
          },
          {
            "label": "滝",
            "value": "majestic waterfall surrounded by lush nature and mist"
          },
          {
            "label": "山",
            "value": "distant mountains and layered ridgelines"
          },
          {
            "label": "森",
            "value": "a deep natural forest"
          },
          {
            "label": "草原",
            "value": "a wide open grassland"
          },
          {
            "label": "雪原",
            "value": "a vast snow-covered plain"
          },
          {
            "label": "砂漠",
            "value": "a vast arid desert landscape"
          },
          {
            "label": "雲海",
            "value": "dramatic sea of clouds below the viewpoint"
          },
          {
            "label": "天の川・銀河",
            "value": "stunning Milky Way galaxy across the dark night sky"
          },
          {
            "label": "星空",
            "value": "a clear star-filled night sky"
          },
          {
            "label": "星月夜",
            "value": "a star-filled night with visible moonlight"
          },
          {
            "label": "満月",
            "value": "a luminous full moon"
          },
          {
            "label": "日蝕・月蝕",
            "value": "a dramatic solar or lunar eclipse"
          },
          {
            "label": "オーロラ",
            "value": "a luminous aurora across the night sky"
          },
          {
            "label": "水面",
            "value": "a calm reflective water surface"
          }
        ]
      },
      {
        "id": "environment-weather",
        "group": "scene-detail",
        "modes": [
          "landscape",
          "character",
          "all"
        ],
        "title": "天候・空気感",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "快晴・青空",
            "value": "clear bright blue sky with crisp intense sunlight"
          },
          {
            "label": "入道雲・夏空",
            "value": "massive towering cumulonimbus clouds under a vivid summer sky"
          },
          {
            "label": "木漏れ日",
            "value": "soft dappled sunlight filtering through green leaves"
          },
          {
            "label": "薄曇り",
            "value": "softly overcast pale sky with gentle ambient light"
          },
          {
            "label": "曇天",
            "value": "moody dark overcast sky with diffuse lighting"
          },
          {
            "label": "小雨・しとしと雨",
            "value": "gentle drizzle with damp mist and soft atmosphere"
          },
          {
            "label": "雨・濡れた路面",
            "value": "rainy weather with wet reflective ground and water droplets"
          },
          {
            "label": "豪雨・土砂降り",
            "value": "heavy downpour with dramatic rainfall and blurry background"
          },
          {
            "label": "夕立・スコール",
            "value": "sudden summer rain shower under a dark dramatic sky"
          },
          {
            "label": "雨上がり",
            "value": "fresh wet surfaces and clear atmosphere after rain"
          },
          {
            "label": "虹",
            "value": "a vivid rainbow arches across the sky"
          },
          {
            "label": "粉雪・舞い散る雪",
            "value": "soft gentle snowflakes falling gracefully"
          },
          {
            "label": "吹雪・猛吹雪",
            "value": "raging blizzard with blowing snow and low visibility"
          },
          {
            "label": "朝霧・靄",
            "value": "mystical early morning fog with soft glowing light"
          },
          {
            "label": "濃霧・夜霧",
            "value": "dense heavy fog drifting silently through the scene"
          },
          {
            "label": "雷雨・稲妻",
            "value": "dramatic thunderstorm with visible lightning flashing"
          },
          {
            "label": "強風・風の戯れ",
            "value": "strong gust of wind moving hair, clothes, and leaves"
          },
          {
            "label": "嵐・台風",
            "value": "violent storm conditions with turbulent winds and dark sky"
          },
          {
            "label": "朝焼け・黎明",
            "value": "soft pink and golden dawn light softly illuminating the sky"
          },
          {
            "label": "夕焼け・茜空",
            "value": "vibrant orange and crimson sunset sky"
          },
          {
            "label": "黄昏・マジックアワー",
            "value": "magical twilight sky with purple and deep blue gradients"
          },
          {
            "label": "凍てつく空気・霜",
            "value": "bitingly cold air with frosty crystalline texture"
          }
        ]
      },
      {
        "id": "environment-time",
        "group": "scene-detail",
        "modes": [
          "character",
          "landscape",
          "abstract",
          "all"
        ],
        "title": "時間・季節",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "早朝",
            "value": "early morning"
          },
          {
            "label": "朝",
            "value": "morning"
          },
          {
            "label": "昼",
            "value": "midday"
          },
          {
            "label": "夕暮れ",
            "value": "twilight"
          },
          {
            "label": "夜",
            "value": "night"
          },
          {
            "label": "深夜",
            "value": "late night"
          },
          {
            "label": "真夜中",
            "value": "midnight"
          },
          {
            "label": "春",
            "value": "spring season"
          },
          {
            "label": "夏",
            "value": "summer season"
          },
          {
            "label": "秋",
            "value": "autumn season"
          },
          {
            "label": "冬",
            "value": "winter season"
          },
          {
            "label": "春の終わり",
            "value": "late spring season"
          },
          {
            "label": "夏の終わり",
            "value": "late summer season"
          },
          {
            "label": "秋の終わり",
            "value": "late autumn season"
          },
          {
            "label": "冬の始まり",
            "value": "early winter season"
          },
          {
            "label": "季節の境目",
            "value": "an ambiguous transition between seasons"
          }
        ]
      },
      {
        "id": "environment-detail",
        "group": "scene-detail",
        "modes": [
          "landscape",
          "character",
          "abstract",
          "all"
        ],
        "title": "背景ディテール・演出",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "生活感のある背景",
            "value": "lived-in background details with subtle signs of everyday life"
          },
          {
            "label": "人の気配・残香",
            "value": "subtle traces of human presence without showing crowds"
          },
          {
            "label": "無人の静寂空間",
            "value": "completely empty and silent environment"
          },
          {
            "label": "散らかった部屋・空間",
            "value": "cluttered lived-in environment with scattered items"
          },
          {
            "label": "整然とした空間",
            "value": "clean orderly environment with minimal decor"
          },
          {
            "label": "遠景まで広がる奥行き",
            "value": "deep layered background extending far into the distance"
          },
          {
            "label": "前景フレーム・前ボケ",
            "value": "foreground objects blurred to frame the main subject"
          },
          {
            "label": "背景をぼかす",
            "value": "softly blurred background with shallow depth of field"
          },
          {
            "label": "背景の玉ボケ・光の丸ボケ",
            "value": "beautiful bokeh circle lights glowing in the background"
          },
          {
            "label": "反射・水鏡",
            "value": "sharp reflections on glass, water, or polished surfaces"
          },
          {
            "label": "ガラス越し・窓越し",
            "value": "viewed through a window pane with subtle reflections and glare"
          },
          {
            "label": "鏡越し・ミラー構図",
            "value": "scene viewed through a mirror reflection"
          },
          {
            "label": "濡れた路面・雨上がり",
            "value": "wet pavement reflecting surrounding ambient light"
          },
          {
            "label": "水たまりと映り込み",
            "value": "shallow water puddles reflecting the sky and surroundings"
          },
          {
            "label": "雨粒・窓の水滴",
            "value": "visible raindrops in the air and water droplets on glass"
          },
          {
            "label": "窓から差し込む光",
            "value": "dramatic sunbeams streaming through a nearby window"
          },
          {
            "label": "影のパターン（ブラインド／木漏れ日）",
            "value": "distinct shadow patterns cast across the wall and floor"
          },
          {
            "label": "伸びる長い影",
            "value": "long pronounced shadows stretching across the scene"
          },
          {
            "label": "シルエット効果",
            "value": "strong silhouetted forms against a bright background"
          },
          {
            "label": "ネオンの反射・光彩",
            "value": "colorful neon light reflections glow across nearby surfaces"
          },
          {
            "label": "光の粒子・埃",
            "value": "floating dust and tiny glowing particles in the light beams"
          },
          {
            "label": "花びらが舞う",
            "value": "scattered flower petals drifting softly through the air"
          },
          {
            "label": "木の葉が舞う",
            "value": "autumn leaves drifting gracefully through the wind"
          },
          {
            "label": "紙片・本が舞う",
            "value": "loose sheets of paper swirling through the air"
          },
          {
            "label": "舞い散る羽・火の粉",
            "value": "floating feathers and glowing embers drifting in the air"
          },
          {
            "label": "風で揺れるカーテン",
            "value": "sheer curtains gently blowing in a soft breeze"
          },
          {
            "label": "煙・蒸気・湯気",
            "value": "soft wisps of smoke or steam adding atmospheric depth"
          },
          {
            "label": "霞・モヤ",
            "value": "soft atmospheric haze creating depth and mystery"
          },
          {
            "label": "足跡・タイヤ痕",
            "value": "visible footprints or tracks suggesting recent movement"
          },
          {
            "label": "時間経過の痕跡・経年劣化",
            "value": "weathered and aged surfaces with worn textures, rust, or moss"
          }
        ]
      },
      {
        "id": "style",
        "group": "visual-detail",
        "modes": [
          "character",
          "landscape",
          "abstract",
          "all"
        ],
        "title": "画風・質感",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "[AI] 画風おまかせ",
            "value": "creative artistic style",
            "isOmakase": true,
            "description": "内容に合わせて、合いそうな画風をAIにまかせます。",
            "family": "おまかせ"
          },
          {
            "label": "アニメキービジュアル",
            "value": "anime key visual, detailed lineart",
            "description": "アニメ作品の宣伝絵のような、見栄えのする華やかな表現。",
            "family": "漫画・アニメ"
          },
          {
            "label": "現代アニメ・セル調",
            "value": "modern anime aesthetic, clean cel shading",
            "description": "輪郭がはっきりしていて、色を面で塗ったような現代アニメらい表現。",
            "family": "漫画・アニメ"
          },
          {
            "label": "90年代アニメ",
            "value": "90s anime aesthetic, nostalgic cel shading",
            "description": "少し懐かしい、90年代アニメのような色使いと描き方。",
            "family": "漫画・アニメ"
          },
          {
            "label": "少女漫画・繊細線画",
            "value": "delicate shoujo manga-inspired linework, elegant visual composition",
            "description": "細く繊細な線を中心にした、華やかで上品な少女漫画風の表現。",
            "family": "漫画・アニメ"
          },
          {
            "label": "コミック・インク線画",
            "value": "bold expressive ink linework, graphic comic illustration",
            "description": "太めのインク線を活かした、力強くメリハのある漫画風の表現。",
            "family": "漫画・アニメ"
          },
          {
            "label": "リアル・シネマ",
            "value": "cinematic photorealistic rendering, natural detail",
            "description": "実写映画のワンシーンのような、自然で現実感のある表現。",
            "family": "写実・写真"
          },
          {
            "label": "写真集・エディトリアル",
            "value": "editorial photography aesthetic, refined magazine composition",
            "description": "雑誌の写真や広告のような、洗練された構成と落ち着いた表現。",
            "family": "写実・写真"
          },
          {
            "label": "自然な手描き",
            "value": "natural hand-drawn illustration, organic irregular linework, varied line weight, slightly uneven contours, soft matte colors, subtle paper texture, restrained digital polish",
            "description": "整いすぎない線や色ムラを残した、自然な手描きイラスト。",
            "family": "手描き・線画"
          },
          {
            "label": "ラフな手描き",
            "value": "rough hand-drawn illustration, loose sketch strokes, spontaneous marks, uneven linework, slightly irregular proportions, simple coloring, visible construction marks, human-made imperfections",
            "description": "下書きのような気軽さと、少し不揃いな線を楽しむ手描き表現。",
            "family": "手描き・線画"
          },
          {
            "label": "ゆるい手描き",
            "value": "loose friendly doodle illustration, simple rounded shapes, uneven hand-drawn outlines, slightly awkward charming proportions, muted colors, generous empty space, casual human-made feel",
            "description": "少し不揃いで、力の抜けたかわいらしさのある手描き表現。",
            "family": "手描き・線画"
          },
          {
            "label": "落書き・ドゥードル",
            "value": "casual doodle illustration, spontaneous pen strokes, uneven line weight, quirky simplified shapes, sparse details, imperfect spacing, authentic notebook-sketch quality",
            "description": "ノートの隅に描いた落書きのような、自由で気軽な線の表現。",
            "family": "手描き・線画"
          },
          {
            "label": "一筆書き・線画",
            "value": "continuous-line drawing, loose flowing ink stroke, spontaneous hand movement, irregular curves, minimal detail, expressive simplified forms, abundant negative space",
            "description": "一本の線を流れるようにつないで描く、シンプルで印象的な表現。",
            "family": "手描き・線画"
          },
          {
            "label": "鉛筆スケッチ",
            "value": "soft graphite pencil sketch, visible graphite strokes, natural shading, textured paper",
            "description": "鉛筆の濃淡や紙の質感が残る、スケッチのような手描き表現。",
            "family": "鉛筆・色鉛筆"
          },
          {
            "label": "色鉛筆",
            "value": "colored pencil illustration, visible pencil strokes, colored pencil grain, gritty paper texture, uneven pencil pressure, subtle paper showing through, dry pencil texture, soft edges, natural color layering",
            "description": "紙の上に色鉛筆を重ねたような、細かな線とやわらかな色の表現。",
            "family": "鉛筆・色鉛筆"
          },
          {
            "label": "ボールペン・ノート",
            "value": "ballpoint pen illustration, visible pressure variation, thin scratchy lines, repeated sketch strokes, subtle cross-hatching, imperfect contours, textured notebook paper",
            "description": "ノートにボールペンで描いたような、細い線と手癖が残る表現。",
            "family": "鉛筆・色鉛筆"
          },
          {
            "label": "クレヨン・手描き",
            "value": "hand-drawn crayon illustration, visible wax texture, uneven coloring, rough organic edges, overlapping crayon strokes, warm limited palette, tactile paper texture",
            "description": "クレヨンで描いたような、ざらっとした線と温かみのある表現。",
            "family": "手描き・画材"
          },
          {
            "label": "水彩",
            "value": "delicate watercolor painting, translucent washes, soft pigment diffusion",
            "description": "水で絵の具をにじませたような、やわらかく透明感のある表現。",
            "family": "水彩"
          },
          {
            "label": "水彩・にじみ",
            "value": "traditional watercolor illustration, translucent washes, gentle pigment bleeding, uneven watercolor edges, textured paper, loose brushwork, organic color variation",
            "description": "水彩絵の具が紙の上で広がったような、にじみと色ムラのある表現。",
            "family": "水彩"
          },
          {
            "label": "水彩＋ペン",
            "value": "hand-drawn ink and watercolor illustration, irregular ink outlines, varied line weight, transparent watercolor washes, subtle pigment bleeding, textured watercolor paper, handmade finish",
            "description": "ペンで輪郭を描き、その上から水彩で色をつけたような表現。",
            "family": "水彩"
          },
          {
            "label": "インク・水墨",
            "value": "ink wash painting, expressive monochrome brushwork",
            "description": "墨やインクで描いたような、線の強弱とにじみを活かした表現。",
            "family": "インク・筆"
          },
          {
            "label": "インク画・かすれ",
            "value": "expressive ink illustration, varied brush pressure, broken irregular lines, dry-brush texture, organic silhouettes, strong negative space, spontaneous human brushwork",
            "description": "筆やペンのかすれを活かした、勢いのある線中心の表現。",
            "family": "インク・筆"
          },
          {
            "label": "マーカー・スケッチ",
            "value": "hand-rendered marker illustration, visible marker strokes, overlapping translucent areas, slightly uneven fills, bold simplified shapes, loose outlines, natural paper texture",
            "description": "マーカーで手早く塗ったような、線と色が重なるラフな表現。",
            "family": "インク・筆"
          },
          {
            "label": "油絵・重厚",
            "value": "rich oil painting, textured impasto brushwork",
            "description": "絵の具を厚く重ねたような、深い色と重みのある表現。",
            "family": "絵画・画材"
          },
          {
            "label": "パステル・粉彩",
            "value": "soft pastel illustration, visible chalk texture, powdery blended colors, irregular edges, textured paper, gentle transitions, loose hand-drawn shapes",
            "description": "粉っぽいパステルで描いたような、やわらかく淡い色の表現。",
            "family": "絵画・画材"
          },
          {
            "label": "幻想絵画",
            "value": "ethereal fine-art painting, luminous dreamlike atmosphere",
            "description": "光や空気が夢の中のように感じられる、幻想的で美しい絵画表現。",
            "family": "絵画・画材"
          },
          {
            "label": "ゴシック絵画",
            "value": "dark gothic fine-art painting, ornate dramatic composition",
            "description": "暗く重厚で装飾的な、古い絵画のようなゴシック調の表現。",
            "family": "絵画・画材"
          },
          {
            "label": "絵本・童話",
            "value": "storybook illustration, whimsical painterly texture",
            "description": "絵本のページのような、やさしく親しみやすい物語性のある表現。",
            "family": "絵本・イラスト"
          },
          {
            "label": "日本の児童書挿絵",
            "value": "gentle Japanese children's book illustration, slightly irregular hand-drawn lines, soft restrained colors, simplified forms, quiet composition, subtle paper texture, warm everyday atmosphere",
            "description": "日本の児童書の挿絵のような、素朴で静かで親しみやすい表現。",
            "family": "絵本・イラスト"
          },
          {
            "label": "版画",
            "value": "hand-carved printmaking illustration, rough carved lines, irregular ink edges, simplified bold shapes, visible print texture, uneven ink coverage, limited colors",
            "description": "彫った線を紙に刷ったような、ざっくりとした線とインクの質感。",
            "family": "印刷・紙"
          },
          {
            "label": "木版画",
            "value": "traditional woodblock-inspired illustration, carved organic outlines, flattened perspective, limited natural colors, visible paper and ink texture, simplified forms, subtle printing imperfections",
            "description": "木を彫って刷ったような、素朴な線と平面的な色面が特徴の表現。",
            "family": "印刷・紙"
          },
          {
            "label": "レトロ印刷",
            "value": "vintage printed illustration, limited ink palette, imperfect print registration, subtle halftone texture, faded colors, rough paper grain, uneven ink coverage",
            "description": "昔の印刷物のような、かすれや色ズレを含んだ味のある表現。",
            "family": "印刷・紙"
          },
          {
            "label": "シルクスクリーン",
            "value": "screen-print illustration, limited spot colors, imperfect ink registration, bold simplified forms, textured ink coverage, rough paper surface, handmade printmaking character",
            "description": "インクを版で刷ったような、限られた色と力強い形の表現。",
            "family": "印刷・紙"
          },
          {
            "label": "リソグラフ",
            "value": "risograph-style illustration, limited ink colors, visible grain, imperfect color registration, uneven ink density, bold simple shapes, textured paper, small-press print character",
            "description": "少し色がずれたり粒状になったりする、独特な印刷の質感。",
            "family": "印刷・紙"
          },
          {
            "label": "レトロポスター",
            "value": "vintage Japanese poster illustration, aged print texture",
            "description": "昔のポスターを思わせる、少しくすんだ色と印刷物らしい質感。",
            "family": "印刷・紙"
          },
          {
            "label": "切り絵・ペーパー",
            "value": "hand-cut paper collage illustration, layered paper shapes, slightly irregular cut edges, subtle paper fibers, flat colors, minimal shading, tactile craft aesthetic",
            "description": "紙を切って重ねたような、平面的で手作り感のある表現。",
            "family": "コラージュ・クラフト"
          },
          {
            "label": "紙コラージュ",
            "value": "mixed paper collage illustration, torn and hand-cut edges, layered colored paper textures, subtle layer shadows, imperfect handmade shapes, limited palette",
            "description": "紙を切ったり破ったりして重ねたような、素材感のある表現。",
            "family": "コラージュ・クラフト"
          },
          {
            "label": "ミニマリズム",
            "value": "minimalist art, clean shapes, restrained detail",
            "description": "要素を絞って、すっきりと余白を活かしたシンプルな表現。",
            "family": "フラット・グラフィック"
          },
          {
            "label": "AI感の弱いフラット",
            "value": "human-designed flat illustration, simple geometric forms with subtle irregularities, intentional asymmetry, restrained palette, natural spacing, subtle print texture, avoid overly polished vector aesthetics",
            "description": "デジタルっぽく整いすぎない、自然なゆらぎを残したシンプルな表現。",
            "family": "フラット・グラフィック"
          },
          {
            "label": "ミニマル・フラット",
            "value": "minimal editorial flat illustration, very simple shapes, limited color palette, generous negative space, clean silhouettes, subtle handmade irregularities, quiet graphic design",
            "description": "少ない色と形、広い余白で見せる、すっきりしたグラフィック表現。",
            "family": "フラット・グラフィック"
          },
          {
            "label": "雑誌・エディトリアル",
            "value": "contemporary editorial illustration, conceptual simplified forms, expressive proportions, sophisticated limited palette, bold negative space, subtle texture, intelligent visual simplicity",
            "description": "雑誌の特集ページのような、洗練された構成と大胆な余白の表現。",
            "family": "フラット・グラフィック"
          },
          {
            "label": "ポップな手描き",
            "value": "playful hand-drawn graphic illustration, bold irregular outlines, simplified chunky shapes, bright limited colors, imperfect proportions, energetic handmade strokes, subtle screen-print texture",
            "description": "太めの線と明るい色で、元気で親しみやすく描く手描き表現。",
            "family": "フラット・グラフィック"
          },
          {
            "label": "コンセプトアート",
            "value": "cinematic concept art, detailed environment design",
            "description": "映画やゲームの設定画のように、世界観や背景をしっかり見せる表現。",
            "family": "世界観・表現"
          },
          {
            "label": "シュルレアリスム",
            "value": "surreal dreamlike visual, impossible imagery",
            "description": "現実ではありえない組み合わせや、不思議な夢のような表現。",
            "family": "世界観・表現"
          },
          {
            "label": "ダークファンタジー",
            "value": "dark fantasy art, gothic atmosphere, intricate detail",
            "description": "暗く幻想的で、少し不穏な世界観を感じさせる表現。",
            "family": "世界観・表現"
          },
          {
            "label": "サイバーパンク",
            "value": "cyberpunk visual style, neon futuristic cityscape",
            "description": "ネオンや未来都市など、近未来的で少し退廃的な雰囲気の現。",
            "family": "世界観・表現"
          }
        ]
      },
      {
        "id": "color-palette",
        "group": "visual-detail",
        "modes": [
          "character",
          "landscape",
          "abstract",
          "all"
        ],
        "title": "色・カラーパレット",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "おまかせ",
            "value": "balanced color direction chosen to suit the concept",
            "isOmakase": true
          },
          {
            "label": "赤",
            "value": "red-centered vibrant color palette"
          },
          {
            "label": "深紅",
            "value": "deep crimson and burgundy palette"
          },
          {
            "label": "朱色（和風赤）",
            "value": "traditional vermilion red and scarlet palette"
          },
          {
            "label": "ピンク",
            "value": "vibrant pink-centered palette"
          },
          {
            "label": "桜色",
            "value": "soft sakura pink and pale pastel palette"
          },
          {
            "label": "コーラル",
            "value": "warm coral pink and peach color palette"
          },
          {
            "label": "マゼンタ・ショッキングピンク",
            "value": "bold vivid magenta and deep hot pink palette"
          },
          {
            "label": "橙",
            "value": "warm bright orange-centered palette"
          },
          {
            "label": "琥珀",
            "value": "rich amber and honey-gold warm palette"
          },
          {
            "label": "黄",
            "value": "bright sunshine yellow palette"
          },
          {
            "label": "山吹色",
            "value": "rich yamabuki yellow and warm gold palette"
          },
          {
            "label": "クリーム",
            "value": "pale yellow, soft cream, and beige palette"
          },
          {
            "label": "マスタード",
            "value": "muted mustard yellow and ochre palette"
          },
          {
            "label": "ライムグリーン",
            "value": "fresh yellow-green and vivid lime palette"
          },
          {
            "label": "緑",
            "value": "vivid green-centered natural palette"
          },
          {
            "label": "深緑",
            "value": "deep forest green and pine green palette"
          },
          {
            "label": "薄緑",
            "value": "refreshing mint green and pale sage palette"
          },
          {
            "label": "青緑",
            "value": "rich teal, peacock blue, and emerald green palette"
          },
          {
            "label": "水色",
            "value": "light cyan, sky blue, and pale azure palette"
          },
          {
            "label": "青",
            "value": "vibrant blue-centered cool color palette"
          },
          {
            "label": "紺",
            "value": "deep navy blue and night sky indigo palette"
          },
          {
            "label": "群青",
            "value": "rich intense ultramarine blue palette"
          },
          {
            "label": "紫",
            "value": "purple and rich violet palette"
          },
          {
            "label": "藤色",
            "value": "soft lavender and pale wisteria purple palette"
          },
          {
            "label": "青紫",
            "value": "deep blue and night violet nocturnal palette"
          },
          {
            "label": "赤紫",
            "value": "deep plum and wine red purple palette"
          },
          {
            "label": "茶",
            "value": "rich warm brown and chocolate palette"
          },
          {
            "label": "モノクロ",
            "value": "monochrome black and white high contrast palette"
          },
          {
            "label": "白・銀・雪色",
            "value": "white, silver, and snowy pale monochrome palette"
          },
          {
            "label": "漆黒",
            "value": "deep pitch black and shadow monochromatic palette"
          },
          {
            "label": "セピア・古写真",
            "value": "vintage sepia monochromatic palette"
          },
          {
            "label": "赤をアクセント",
            "value": "restrained monochrome palette with a striking crimson accent"
          },
          {
            "label": "青をアクセント",
            "value": "muted desaturated palette with a striking bright blue accent"
          },
          {
            "label": "ゴールド",
            "value": "luminous metallic gold and warm light palette"
          },
          {
            "label": "青×橙（映画風）",
            "value": "cinematic blue and orange complementary palette"
          },
          {
            "label": "青×赤（対立・コントラスト）",
            "value": "cinematic blue and intense crimson palette with high visual tension"
          },
          {
            "label": "紫×ピンク（夢幻・ファンタジー）",
            "value": "dreamy pastel violet and soft pink palette"
          },
          {
            "label": "紫×金（高貴・荘厳）",
            "value": "deep regal violet and metallic gold palette"
          },
          {
            "label": "黒×金（ラグジュアリー）",
            "value": "luxurious black and antique gold palette"
          },
          {
            "label": "緑×金（オリエンタル・クラシック）",
            "value": "emerald green and antique gold palette"
          },
          {
            "label": "青緑×紫（サイバー・夜の街）",
            "value": "cool teal and vibrant violet palette"
          },
          {
            "label": "橙×紫（黄昏・夕暮れ）",
            "value": "dusky orange and violet twilight palette"
          },
          {
            "label": "赤×黒×紫（ダーク・退廃）",
            "value": "gothic black, deep violet, and crimson palette"
          },
          {
            "label": "水色×白（透明感・清涼）",
            "value": "airy white and pale blue translucent palette"
          },
          {
            "label": "黒×赤×白（モダン和風・パンク）",
            "value": "striking black, bold scarlet red, and stark white palette"
          },
          {
            "label": "水色×ピンク×黄（ゆめかわ）",
            "value": "whimsical pastel pink, light cyan, and soft yellow fairy-kei palette"
          },
          {
            "label": "深緑×茶×金（レトロクラシック）",
            "value": "vintage forest green, rich brown, and warm gold palette"
          },
          {
            "label": "虹色・グラデーション",
            "value": "vibrant rainbow spectrum and iridescent gradient palette"
          },
          {
            "label": "パステル・ファンシー",
            "value": "soft dreamy pastel color palette"
          },
          {
            "label": "ビビッド・高彩度",
            "value": "vivid high-saturation neon and bright color palette"
          },
          {
            "label": "くすみ・低彩度",
            "value": "muted low-saturation desaturated color palette"
          },
          {
            "label": "アースカラー・ナチュラル",
            "value": "natural organic earth-tone palette"
          },
          {
            "label": "ジュエルカラー",
            "value": "rich ruby, emerald, and sapphire jewel-tone palette"
          },
          {
            "label": "サイバーネオン",
            "value": "glowing neon pink, cyan, and dark cyberpunk color palette"
          },
          {
            "label": "レトロポップ",
            "value": "vivid retro 80s nostalgic color palette with warm muted tones"
          }
        ]
      },
      {
        "id": "lighting-direction",
        "group": "composition-detail",
        "modes": [
          "character",
          "landscape",
          "abstract",
          "all"
        ],
        "title": "光・光源・方向",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "正面光",
            "value": "soft frontal lighting"
          },
          {
            "label": "斜め前光",
            "value": "three-quarter key lighting"
          },
          {
            "label": "横光（サイド）",
            "value": "side lighting sculpting the subject"
          },
          {
            "label": "逆光",
            "value": "backlighting silhouette effect"
          },
          {
            "label": "輪郭光（リムライト）",
            "value": "strong rim light highlighting edges"
          },
          {
            "label": "上からの光",
            "value": "overhead lighting"
          },
          {
            "label": "下からの光",
            "value": "unusual upward bottom lighting"
          },
          {
            "label": "窓からの光",
            "value": "directional light streaming through a window"
          },
          {
            "label": "木漏れ日",
            "value": "dappled sunlight filtering through leaves"
          },
          {
            "label": "薄明光線",
            "value": "visible crepuscular rays through the atmosphere"
          },
          {
            "label": "スポットライト",
            "value": "dramatic single spotlight focusing on subject"
          },
          {
            "label": "柔らかい光",
            "value": "soft diffused ambient light"
          },
          {
            "label": "強い直射光",
            "value": "hard direct light with crisp sharp shadows"
          },
          {
            "label": "明暗強調（劇的）",
            "value": "dramatic chiaroscuro lighting, strong contrast between light and dark"
          },
          {
            "label": "夕光",
            "value": "warm low-angle sunset light"
          },
          {
            "label": "月光",
            "value": "cool moonlight"
          },
          {
            "label": "街灯",
            "value": "isolated pools of streetlight"
          },
          {
            "label": "ネオン光",
            "value": "artificial vibrant neon lighting"
          },
          {
            "label": "複数光源",
            "value": "layered lighting from multiple colorful sources"
          }
        ]
      },
      {
        "id": "visual-effects",
        "group": "composition-detail",
        "modes": [
          "character",
          "landscape",
          "abstract",
          "all"
        ],
        "title": "視覚効果・演出",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "光芒（光の筋）",
            "value": "cinematic rays of light"
          },
          {
            "label": "レンズフレア",
            "value": "subtle cinematic lens flare"
          },
          {
            "label": "逆光ハレーション",
            "value": "soft backlight bloom and halation"
          },
          {
            "label": "玉ボケ（光の粒子）",
            "value": "beautiful dreamy bokeh particles"
          },
          {
            "label": "光の粒子・キラキラ",
            "value": "floating glowing dust particles in light"
          },
          {
            "label": "色収差・プリズム",
            "value": "subtle chromatic aberration, prism edge refraction"
          },
          {
            "label": "被写界深度（背景ボケ）",
            "value": "shallow depth of field, creamy background blur"
          },
          {
            "label": "霧・スモーク",
            "value": "soft veil of atmospheric haze and fog"
          },
          {
            "label": "水面反射",
            "value": "rippling reflections on water"
          },
          {
            "label": "ガラス越し",
            "value": "seen through textured or rain-covered glass"
          },
          {
            "label": "ブレ（躍動感）",
            "value": "controlled cinematic motion blur"
          },
          {
            "label": "二重露光風",
            "value": "dreamlike double-exposure visual effect"
          },
          {
            "label": "ビネット（外周の闇）",
            "value": "darkened vignette edges, subtle shadow framing"
          },
          {
            "label": "影の侵食・黒いオーラ",
            "value": "creeping shadowy tendrils, dark swirling aura"
          },
          {
            "label": "フィルムノイズ・粒子感",
            "value": "heavy film grain, gritty dark atmosphere texture"
          },
          {
            "label": "インクの滲み・黒い滴り",
            "value": "dripping black ink splatter, dark fluid stain effects"
          },
          {
            "label": "色収差（サイバーパンク・異質感）",
            "value": "glitchy chromatic aberration, distorted dark edges"
          },
          {
            "label": "残像・ゴーストエフェクト",
            "value": "ethereal ghosting trail, eerie motion distortion"
          },
          {
            "label": "怪しい霧・瘴気",
            "value": "thick sinister miasma, ominous dark fog"
          },
          {
            "label": "赤黒い光・血光",
            "value": "ominous crimson glow, dark red ambient light"
          },
          {
            "label": "崩壊・ノイズ・砂嵐",
            "value": "analog static noise, degraded VHS distortion effect"
          }
        ]
      },
      {
        "id": "camera",
        "group": "composition-detail",
        "modes": [
          "character",
          "landscape",
          "abstract",
          "all"
        ],
        "title": "カメラ・レンズ効果",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "背景をふわっとぼかす",
            "value": "shallow depth of field, soft creamy background bokeh"
          },
          {
            "label": "前も後もぼかす（ピントくっきり）",
            "value": "strong foreground and background bokeh framing the subject"
          },
          {
            "label": "背景までくっきり（全体にピント）",
            "value": "deep depth of field, sharp focus on entire background"
          },
          {
            "label": "超広角（パノラマ・ダイナミック）",
            "value": "ultra wide-angle lens, expansive dynamic perspective"
          },
          {
            "label": "広角（空間を広く見せる）",
            "value": "wide-angle lens, immersive spatial perspective"
          },
          {
            "label": "標準レンズ（見たままの自然さ）",
            "value": "natural standard 50mm lens perspective"
          },
          {
            "label": "望遠（背景を引き寄せる・圧縮感）",
            "value": "telephoto lens, compressed background perspective"
          },
          {
            "label": "マクロ・超接写（ドアップ）",
            "value": "macro photo, extreme close-up detail"
          },
          {
            "label": "魚眼レンズ（丸く歪む表現）",
            "value": "fisheye lens, distorted spherical perspective"
          },
          {
            "label": "35mmフィルムカメラ風（レトロエモ）",
            "value": "35mm film photo aesthetic, subtle film grain"
          },
          {
            "label": "インスタントカメラ風（チェキ風）",
            "value": "polaroid instant camera style, soft flash lighting"
          },
          {
            "label": "長時間露光（ブレ・光の尾）",
            "value": "long exposure photo, motion blur trails"
          },
          {
            "label": "レンズフレア・光芒（逆光の光）",
            "value": "cinematic lens flare, glowing light rays"
          },
          {
            "label": "チルトシフト（ミニチュア風）",
            "value": "tilt-shift lens effect, miniature style focus"
          }
        ]
      },
      {
        "id": "abstract-emotion",
        "group": "concept-detail",
        "modes": [
          "abstract",
          "character",
          "all"
        ],
        "title": "感情・心象",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "孤独",
            "value": "visual metaphor for loneliness and isolation"
          },
          {
            "label": "喪失",
            "value": "visual metaphor for loss and absence"
          },
          {
            "label": "希望",
            "value": "visual metaphor for fragile hope"
          },
          {
            "label": "再生",
            "value": "visual metaphor for renewal and rebirth"
          },
          {
            "label": "懐かしさ",
            "value": "visual metaphor for nostalgia and memory"
          },
          {
            "label": "不安",
            "value": "visual metaphor for anxiety and uncertainty"
          },
          {
            "label": "静寂",
            "value": "visual metaphor for profound silence"
          },
          {
            "label": "幸福",
            "value": "visual metaphor for quiet happiness"
          },
          {
            "label": "葛藤",
            "value": "visual metaphor for inner conflict"
          },
          {
            "label": "後悔",
            "value": "visual metaphor for regret and remorse"
          },
          {
            "label": "罪悪感",
            "value": "visual metaphor for guilt and self-reproach"
          },
          {
            "label": "寂しさ",
            "value": "visual metaphor for quiet loneliness and emotional emptiness"
          },
          {
            "label": "切なさ",
            "value": "visual metaphor for bittersweet sorrow and yearning"
          },
          {
            "label": "焦燥",
            "value": "visual metaphor for impatience and restlessness"
          },
          {
            "label": "絶望",
            "value": "visual metaphor for despair and hopelessness"
          },
          {
            "label": "怒り",
            "value": "visual metaphor for suppressed anger and rage"
          },
          {
            "label": "嫉妬",
            "value": "visual metaphor for jealousy and envy"
          },
          {
            "label": "愛情",
            "value": "visual metaphor for affection and devotion"
          },
          {
            "label": "恋慕",
            "value": "visual metaphor for romantic longing and yearning"
          },
          {
            "label": "安心",
            "value": "visual metaphor for safety, comfort and relief"
          },
          {
            "label": "戸惑い",
            "value": "visual metaphor for confusion and hesitation"
          },
          {
            "label": "決意",
            "value": "visual metaphor for resolve and determination"
          },
          {
            "label": "覚悟",
            "value": "visual metaphor for acceptance and readiness to face fate"
          },
          {
            "label": "解放",
            "value": "visual metaphor for liberation and release"
          },
          {
            "label": "憧れ",
            "value": "visual metaphor for longing and aspiration"
          }
        ]
      },
      {
        "id": "abstract-concept",
        "group": "concept-detail",
        "modes": [
          "character",
          "landscape",
          "abstract",
          "all"
        ],
        "title": "概念・テーマ",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "境界・あわい",
            "value": "visual metaphor of a boundary between two different worlds"
          },
          {
            "label": "記憶・欠片",
            "value": "visual metaphor of fragmented glass memories floating in the air"
          },
          {
            "label": "忘却・風化",
            "value": "visual metaphor of fading memories, erasure, and gradual oblivion"
          },
          {
            "label": "運命・不可避",
            "value": "visual metaphor of fate, destiny, and red threads of connection"
          },
          {
            "label": "選択・分岐",
            "value": "visual metaphor of a difficult choice, crossroads, and branching paths"
          },
          {
            "label": "絆・つながり",
            "value": "visual metaphor of deep emotional connection and unbreakable bonds"
          },
          {
            "label": "断絶・孤独",
            "value": "visual metaphor of emotional distance, rupture, and solitude"
          },
          {
            "label": "再会",
            "value": "visual metaphor of an emotional reunion after a long separation"
          },
          {
            "label": "別離・餞",
            "value": "visual metaphor of bittersweet farewell and parting ways"
          },
          {
            "label": "自由・解放",
            "value": "visual metaphor of freedom, spreading wings, and breaking constraints"
          },
          {
            "label": "束縛・囚われ",
            "value": "visual metaphor of confinement, chains, restraint, and emotional captivity"
          },
          {
            "label": "秘密・隠蔽",
            "value": "visual metaphor of hidden secrets, mystery, and veiled truths"
          },
          {
            "label": "真実・露見",
            "value": "visual metaphor of absolute truth revealed from shadows"
          },
          {
            "label": "嘘・偽り",
            "value": "visual metaphor of deception, masks, and hidden double motives"
          },
          {
            "label": "生と死・儚さ",
            "value": "visual metaphor of life and death, fragile existence and mortality"
          },
          {
            "label": "光と闇・二面性",
            "value": "visual metaphor of light and darkness, dual nature, and opposing forces"
          },
          {
            "label": "夢と現実",
            "value": "visual metaphor of blurred lines between dream fantasy and reality"
          },
          {
            "label": "救済・光挿す場所",
            "value": "visual metaphor of salvation, hope, and light breaking through darkness"
          },
          {
            "label": "贖罪・罪と罰",
            "value": "visual metaphor of atonement, remorse, and bearing heavy burden"
          },
          {
            "label": "渇望・執着",
            "value": "visual metaphor of intense longing, yearning, and obsessive desire"
          },
          {
            "label": "祈り・願い",
            "value": "visual metaphor of quiet prayer, devotion, and hopeful wishes"
          },
          {
            "label": "循環・輪廻",
            "value": "visual metaphor of infinite cycles, rebirth, and repetition"
          },
          {
            "label": "永遠・停滞",
            "value": "visual metaphor of timeless eternity and frozen moments in time"
          },
          {
            "label": "変化・変容",
            "value": "visual metaphor of transformation, growth, and irreversible change"
          },
          {
            "label": "存在・証明",
            "value": "visual metaphor of human existence, self-identity, and purpose"
          },
          {
            "label": "人間性・温もり",
            "value": "visual metaphor of humanity, compassion, and emotional warmth"
          }
        ]
      },
      {
        "id": "abstract-visual",
        "group": "concept-detail",
        "modes": [
          "character",
          "landscape",
          "abstract",
          "all"
        ],
        "title": "象徴・モチーフ",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "歯車",
            "value": "symbolic brass and iron gears, steampunk mechanism"
          },
          {
            "label": "時計仕掛け",
            "value": "symbolic intricate clockwork machinery and internal cogs"
          },
          {
            "label": "時計",
            "value": "symbolic modern or minimalist clock face motif"
          },
          {
            "label": "アンティーク時計",
            "value": "symbolic ornate antique grandfather clock or grand vintage wall clock motif"
          },
          {
            "label": "懐中時計",
            "value": "symbolic open pocket watch with chain motif"
          },
          {
            "label": "砂時計",
            "value": "symbolic hourglass motif with falling sand"
          },
          {
            "label": "鍵",
            "value": "symbolic ornate antique key motif"
          },
          {
            "label": "鍵穴",
            "value": "symbolic keyhole motif, glowing light leaking through keyhole"
          },
          {
            "label": "鎖",
            "value": "symbolic heavy iron chains"
          },
          {
            "label": "鳥籠",
            "value": "symbolic ornate birdcage motif"
          },
          {
            "label": "仮面",
            "value": "symbolic theatrical mask motif"
          },
          {
            "label": "チェス駒",
            "value": "symbolic chess piece motif, king or queen"
          },
          {
            "label": "トランプカード",
            "value": "symbolic playing cards scattered"
          },
          {
            "label": "鏡・姿見",
            "value": "symbolic large ornate mirror motif"
          },
          {
            "label": "手鏡",
            "value": "symbolic ornate vintage hand mirror motif"
          },
          {
            "label": "鏡の破片",
            "value": "symbolic broken mirror shards reflecting light"
          },
          {
            "label": "割れたガラス",
            "value": "symbolic shattered glass fragments"
          },
          {
            "label": "額縁・空のフレーム",
            "value": "symbolic empty ornate picture frame"
          },
          {
            "label": "蝶",
            "value": "symbolic butterfly motif"
          },
          {
            "label": "黒猫",
            "value": "symbolic black cat motif"
          },
          {
            "label": "犬・忠犬",
            "value": "symbolic loyal dog motif"
          },
          {
            "label": "鳥・飛翔",
            "value": "symbolic bird in flight"
          },
          {
            "label": "羽根・羽毛",
            "value": "symbolic floating feather motif"
          },
          {
            "label": "天使の翼",
            "value": "symbolic majestic angel wings motif"
          },
          {
            "label": "彼岸花",
            "value": "symbolic red spider lily motif"
          },
          {
            "label": "一輪の薔薇",
            "value": "symbolic single elegant rose flower"
          },
          {
            "label": "ドライフラワー",
            "value": "symbolic withered flower and dried bouquet"
          },
          {
            "label": "林檎",
            "value": "symbolic red apple motif"
          },
          {
            "label": "赤い糸",
            "value": "symbolic red thread of fate motif"
          },
          {
            "label": "シフォンリボン",
            "value": "symbolic airy translucent chiffon ribbons, soft weightless motion"
          },
          {
            "label": "ひらひらのリボン（なびく質感）",
            "value": "symbolic soft fluttering silk ribbons floating gracefully in the air"
          },
          {
            "label": "結び目・解けたリボン",
            "value": "symbolic loosely tied ribbon knot and untying satin ribbon"
          },
          {
            "label": "指輪",
            "value": "symbolic ring motif glowing subtly"
          },
          {
            "label": "古本",
            "value": "symbolic open antique book"
          },
          {
            "label": "魔導書",
            "value": "symbolic grimoire with glowing magical runes"
          },
          {
            "label": "手紙",
            "value": "symbolic vintage letter"
          },
          {
            "label": "封蝋",
            "value": "symbolic wax seal stamp motif"
          },
          {
            "label": "紙片・舞い散るページ",
            "value": "symbolic drifting book pages and paper floating"
          },
          {
            "label": "蝋燭",
            "value": "symbolic candle flame flickering"
          },
          {
            "label": "ランタン",
            "value": "symbolic glowing lantern light"
          },
          {
            "label": "炎",
            "value": "symbolic flame embers drifting"
          },
          {
            "label": "煙・紫煙",
            "value": "symbolic drifting smoke and wisps"
          },
          {
            "label": "宝石",
            "value": "symbolic polished gemstone"
          },
          {
            "label": "鉱物",
            "value": "symbolic glowing raw crystal cluster"
          },
          {
            "label": "泡・シャボン玉",
            "value": "symbolic floating translucent bubbles"
          },
          {
            "label": "水滴・雫",
            "value": "symbolic water droplet motif"
          },
          {
            "label": "波紋・水面",
            "value": "symbolic gentle water ripples motif"
          },
          {
            "label": "三日月",
            "value": "symbolic glowing crescent moon"
          },
          {
            "label": "満月",
            "value": "symbolic luminous full moon"
          },
          {
            "label": "日蝕・月蝕",
            "value": "symbolic dramatic eclipse motif"
          },
          {
            "label": "星空・星座",
            "value": "symbolic starry sky and constellation lines"
          },
          {
            "label": "開いた扉",
            "value": "symbolic open doorway, bright light streaming through the opening"
          },
          {
            "label": "閉ざされた扉",
            "value": "symbolic closed ornate door, mysterious locked entrance"
          },
          {
            "label": "扉",
            "value": "symbolic surreal solitary door standing alone in space"
          },
          {
            "label": "階段",
            "value": "symbolic grand staircase leading upwards"
          },
          {
            "label": "螺旋階段",
            "value": "symbolic intricate spiral staircase, dramatic vertical composition"
          },
          {
            "label": "見上げる階段",
            "value": "symbolic low angle view looking up at towering endless stairs"
          },
          {
            "label": "見下ろす階段",
            "value": "symbolic high angle view looking down into a deep staircase abyss"
          },
          {
            "label": "空の椅子",
            "value": "symbolic solitary empty chair"
          },
          {
            "label": "シルエット・影",
            "value": "symbolic human silhouette and long shadow"
          },
          {
            "label": "自由入力",
            "value": "__FREE_MOTIF__",
            "description": "描きたい象徴・モチーフを自由に入力",
            "freeInput": true,
            "placeholder": "例：古い鍵、濡れた手紙、割れた懐中時計"
          }
        ]
      },
      {
        "id": "text-style",
        "group": "work-text",
        "modes": [
          "character",
          "landscape",
          "abstract",
          "all"
        ],
        "title": "文字・タイポグラフィ",
        "items": [
          {
            "label": "指定なし",
            "isNone": true
          },
          {
            "label": "[AI] デザインおまかせ",
            "value": "stylish text layout, professional graphic design typography",
            "isOmakase": true
          },
          {
            "label": "Web小説表紙風",
            "value": "Japanese light novel book cover typography, sharp title layout"
          },
          {
            "label": "文芸・静かな装丁",
            "value": "literary book typography, restrained elegant title design"
          },
          {
            "label": "映画ポスター風",
            "value": "cinematic movie poster typography, dramatic title layout"
          },
          {
            "label": "アニメロゴ風",
            "value": "stylized anime title logo, expressive graphic typography"
          },
          {
            "label": "明朝体・明朝風",
            "value": "elegant Japanese Mincho serif typography, refined thin-and-thick strokes"
          },
          {
            "label": "ゴシック体・現代的",
            "value": "modern Japanese Gothic sans-serif typography, clean geometric letterforms"
          },
          {
            "label": "ペン書き・手書き",
            "value": "delicate handwritten lettering, thin natural pen strokes"
          },
          {
            "label": "毛筆・書道",
            "value": "dynamic Japanese calligraphy, bold ink brush lettering"
          },
          {
            "label": "洋風書道・カリグラフィー",
            "value": "ornate Western calligraphy typography, elegant sweeping script"
          },
          {
            "label": "ミニマル",
            "value": "clean minimalist typography, refined subtle text logo"
          },
          {
            "label": "ポップ・コミック",
            "value": "bold comic book typography, playful pop lettering"
          },
          {
            "label": "グラフィティ・スプレーアート",
            "value": "vibrant spray paint graffiti typography, urban street art lettering"
          },
          {
            "label": "チョーク・黒板アート",
            "value": "hand-drawn chalk typography on a dusty blackboard texture"
          },
          {
            "label": "ネオン",
            "value": "glowing neon typography, illuminated lettering"
          },
          {
            "label": "金箔・高級感",
            "value": "luxurious gold foil typography, premium elegant title design"
          },
          {
            "label": "古書・レトロ印刷",
            "value": "vintage book typography, antique print texture"
          },
          {
            "label": "レトロ看板・ヴィンテージサイン",
            "value": "retro vintage signage typography, nostalgic commercial lettering"
          },
          {
            "label": "ホラー・崩し文字",
            "value": "distressed gothic horror typography, unsettling text effect"
          },
          {
            "label": "SF・ホログラム",
            "value": "futuristic holographic typography, digital HUD lettering"
          },
          {
            "label": "グリッチ",
            "value": "glitch typography, distorted digital lettering"
          },
          {
            "label": "ルーン文字・古代文字",
            "value": "mystic ancient runes typography, glowing cryptic lettering"
          },
          {
            "label": "3D立体文字",
            "value": "dimensional 3D title typography, extruded lettering"
          },
          {
            "label": "エンボス・浮き彫り",
            "value": "embossed tactile typography, subtle raised letter effect"
          },
          {
            "label": "焼き印・刻印",
            "value": "branded wood typography, deep burned stamp lettering"
          },
          {
            "label": "タイプライター",
            "value": "typewriter-style typography, slightly imperfect vintage printed letters"
          },
          {
            "label": "スタンプ・印章風",
            "value": "stamp-like typography, bold ink impression and traditional seal aesthetic"
          },
          {
            "label": "切り文字・コラージュ",
            "value": "cut-paper letter collage typography, tactile handmade composition"
          },
          {
            "label": "透明・ガラス文字",
            "value": "translucent glass typography, subtle refraction and elegant lettering"
          },
          {
            "label": "インク滲み・水彩",
            "value": "ink-bleed typography, organic spreading ink and expressive printed texture"
          },
          {
            "label": "装飾文字・ヴィンテージ",
            "value": "ornamental classical typography, elegant flourishes and editorial detailing"
          },
          {
            "label": "縦書きレイアウト",
            "value": "traditional Japanese vertical text layout, refined vertical typography"
          },
          {
            "label": "横書きレイアウト",
            "value": "modern horizontal typography, clean international editorial layout"
          }
        ]
      },
      {
        "id": "ratio",
        "group": "composition-detail",
        "modes": [
          "character",
          "landscape",
          "abstract",
          "all"
        ],
        "title": "アスペクト比",
        "items": [
          {
            "label": "指定なし",
            "isNone": true,
            "isSingleRatio": true
          },
          {
            "label": "1:1 正方形",
            "value": "--ar 1:1",
            "isSingleRatio": true
          },
          {
            "label": "9:16 縦長（スマホ）",
            "value": "--ar 9:16",
            "isSingleRatio": true
          },
          {
            "label": "4:5 縦長（SNS）",
            "value": "--ar 4:5",
            "isSingleRatio": true
          },
          {
            "label": "2:3 縦長（表紙・ポスター）",
            "value": "--ar 2:3",
            "isSingleRatio": true
          },
          {
            "label": "3:4 縦長（標準）",
            "value": "--ar 3:4",
            "isSingleRatio": true
          },
          {
            "label": "16:9 横長（モニター・動画）",
            "value": "--ar 16:9",
            "isSingleRatio": true
          },
          {
            "label": "3:2 横長（写真）",
            "value": "--ar 3:2",
            "isSingleRatio": true
          },
          {
            "label": "4:3 横長（標準）",
            "value": "--ar 4:3",
            "isSingleRatio": true
          },
          {
            "label": "21:9 超横長（シネマ）",
            "value": "--ar 21:9",
            "isSingleRatio": true
          }
        ]
      }
    ];

    // categoriesData は初期化後に変更しないため、ID検索はMapに一本化する。
    const categoryIndex = new Map(categoriesData.map((category) => [category.id, category]));

    // 本文抽出用：同名ラベルは具体的な描写カテゴリを優先して1件に解決する。
    const sceneTagIndex = new Map();
    const sceneTagCategoryPriority = new Map([
      ["character-detail", 0],
      ["scene-detail", 1],
      ["visual-detail", 2],
      ["concept-detail", 3],
    ]);
    categoriesData.forEach((cat) => {
      cat.items.forEach((item) => {
        if (item.isNone || !item.value || !item.label) return;
        const priority = sceneTagCategoryPriority.get(cat.group) ?? 999;
        const current = sceneTagIndex.get(item.label);
        if (!current || priority < current.priority) {
          sceneTagIndex.set(item.label, { item, priority });
        }
      });
    });

    // ── タグ選択・比率のグローバル状態 ──
    const selectedTags = new Set();

    let freeMotifText = "";

    let selectedRatio = "";

    function isItemSelected(item) {
      if (!item || item.isNone || !item.value) return false;
      return item.isSingleRatio
        ? selectedRatio === item.value
        : selectedTags.has(item.value);
    }

    // ── テーマ切り替え ──
    function setTheme(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      document.querySelectorAll(".theme-btn").forEach((btn) => {
        btn.classList.toggle(
          "active",
          btn.getAttribute("data-theme-val") === theme,
        );
      });
    }

    document.querySelectorAll(".choice-row").forEach((row) => {
      const key = row.dataset.comp;
      row.querySelectorAll("button").forEach((btn) =>
        btn.addEventListener("click", () => {
          const isCurrent = compositionState[key] === btn.dataset.v;
          row
            .querySelectorAll("button")
            .forEach((b) => b.classList.remove("active"));
          compositionState[key] = isCurrent ? "" : btn.dataset.v;
          if (!isCurrent) btn.classList.add("active");
          updateOutput();
        }),
      );
    });

    // ── デザイン方式・プリセットの状態とロジック ──
    let designMethod = "free";

    let activePreset = "";

    let activeGenrePreset = "";

    const genrePresets = [
      {
        id: "genre-romance",
        name: "恋愛",
        desc: "距離感・視線・柔らかな光を重視",
        tags: [
          "gentle subtle smile",
          "soft diffused ambient light",
          "visual metaphor for affection and devotion",
        ],
      },
      {
        id: "genre-romcom",
        name: "ラブコメ",
        desc: "明るさ・表情・軽快な画面",
        tags: [
          "vivid high-saturation neon and bright color palette",
          "soft diffused ambient light",
          "visual metaphor for quiet happiness",
        ],
      },
      {
        id: "genre-fantasy",
        name: "異世界ファンタジー",
        desc: "異世界の舞台と幻想的な空気",
        tags: [
          "medieval European town",
          "visible crepuscular rays through the atmosphere",
          "cinematic concept art, detailed environment design",
        ],
      },
      {
        id: "genre-dark-fantasy",
        name: "ダークファンタジー",
        desc: "深い影・古城・不穏な空気",
        tags: [
          "dark fantasy art, gothic atmosphere, intricate detail",
          "dramatic chiaroscuro lighting, strong contrast between light and dark",
          "ancient castle ruins",
        ],
      },
      {
        id: "genre-mystery",
        name: "ミステリ",
        desc: "情報を隠し、意味深な余白を残す",
        tags: [
          "muted low-saturation desaturated color palette",
          "suspicious skeptical expression, narrowed gaze",
          "dramatic chiaroscuro lighting, strong contrast between light and dark",
        ],
      },
      {
        id: "genre-horror",
        name: "ホラー",
        desc: "不穏さ・暗部・違和感を強調",
        tags: [
          "dark fantasy art, gothic atmosphere, intricate detail",
          "surreal otherworldly dimension",
          "visual metaphor for anxiety and uncertainty",
        ],
      },
      {
        id: "genre-sf",
        name: "SF・近未来",
        desc: "都市・ネオン・テクノロジー",
        tags: [
          "near-future megacity",
          "cyberpunk city street with glowing billboards",
          "cyberpunk visual style, neon futuristic cityscape",
        ],
      },
      {
        id: "genre-youth",
        name: "青春",
        desc: "光・季節・距離感で瑞々しさを出す",
        tags: [
          "cherry blossoms in the environment",
          "soft sakura pink and pale pastel palette",
          "shallow depth of field, soft creamy background bokeh",
        ],
      },
      {
        id: "genre-slice",
        name: "日常・ほのぼの",
        desc: "生活感と自然な温度",
        tags: [
          "lived-in background details with subtle signs of everyday life",
          "soft diffused ambient light",
          "visual metaphor for quiet happiness",
        ],
      },
      {
        id: "genre-historical",
        name: "歴史・和風",
        desc: "和の空間と静かな佇まい",
        tags: [
          "traditional Japanese attire",
          "cinematic photorealistic rendering, natural detail",
          "ink wash painting, expressive monochrome brushwork",
        ],
      },
      {
        id: "genre-action",
        name: "アクション",
        desc: "動き・迫力・大胆な構図",
        tags: [
          "dramatic chiaroscuro lighting, strong contrast between light and dark",
          "wide-angle lens, immersive spatial perspective",
          "long exposure photo, motion blur trails",
        ],
      },
      {
        id: "genre-literary",
        name: "文芸・純文学",
        desc: "余白・低彩度・静かな空気",
        tags: [
          "muted low-saturation desaturated color palette",
          "35mm film photo aesthetic, subtle film grain",
          "visual metaphor for profound silence",
        ],
      },
    ];

    const presets = [
      {
        id: "quiet-night",
        name: "夜の静寂",
        desc: "夜・月光・低彩度。静かな物語の一枚に。",
        tags: [
          "night",
          "cool moonlight",
          "symbolic luminous full moon",
          "deep blue and night violet nocturnal palette",
          "soft veil of atmospheric haze and fog",
          "visual metaphor for profound silence",
        ],
        comp: { view: "eye-level", position: "off-center", space: "breathing-room", distance: "medium-shot" },
        ratio: "--ar 16:9",
      },
      {
        id: "rainy-city",
        name: "雨の街",
        desc: "雨・都市・反射。孤独を感じる街の一場面に。",
        tags: [
          "rainy weather with wet reflective ground and water droplets",
          "downtown street",
          "wet pavement reflecting surrounding ambient light",
          "isolated pools of streetlight",
          "soft diffused ambient light",
          "muted low-saturation desaturated color palette",
        ],
        comp: { view: "eye-level", position: "off-center", space: "breathing-room", distance: "wide-shot" },
        ratio: "--ar 16:9",
      },
      {
        id: "soft-youth",
        name: "淡い青春",
        desc: "桜・夕暮れ・淡い色。瑞々しい余韻を残す一枚に。",
        tags: [
          "cherry blossoms in the environment",
          "twilight",
          "soft sakura pink and pale pastel palette",
          "warm low-angle sunset light",
          "softly blurred background with shallow depth of field",
          "gentle subtle smile",
        ],
        comp: { view: "eye-level", position: "left", space: "breathing-room", distance: "portrait" },
        ratio: "--ar 16:9",
      },
      {
        id: "literary",
        name: "文芸・静謐",
        desc: "低彩度・静かな光・余白。小説の表紙や扉絵に。",
        tags: [
          "muted low-saturation desaturated color palette",
          "35mm film photo aesthetic, subtle film grain",
          "visual metaphor for profound silence",
          "soft diffused ambient light",
        ],
        comp: { view: "eye-level", position: "off-center", space: "title-safe", distance: "medium-shot" },
        ratio: "--ar 2:3",
      },
      {
        id: "lonely",
        name: "孤独・幻想",
        desc: "霧・深い色・心象。人物の内面を映す一枚に。",
        tags: [
          "dense heavy fog drifting silently through the scene",
          "gothic black, deep violet, and crimson palette",
          "visual metaphor for loneliness and isolation",
          "dramatic chiaroscuro lighting, strong contrast between light and dark",
          "soft veil of atmospheric haze and fog",
        ],
        comp: { view: "high-angle", position: "off-center", space: "breathing-room", distance: "wide-shot" },
        ratio: "--ar 9:16",
      },
      {
        id: "fantasy",
        name: "幻想世界",
        desc: "異世界の景色を主役にした壮大な一枚。",
        tags: [
          "medieval European town",
          "a clear star-filled night sky",
          "cinematic concept art, detailed environment design",
          "visible crepuscular rays through the atmosphere",
          "soft veil of atmospheric haze and fog",
          "symbolic glowing raw crystal cluster",
        ],
        comp: { view: "low-angle", position: "center", space: "none", distance: "establishing" },
        ratio: "--ar 16:9",
      },
      {
        id: "future",
        name: "SF・近未来",
        desc: "ネオン・未来都市・広がりのある視点。",
        tags: [
          "near-future megacity",
          "cyberpunk city street with glowing billboards",
          "cyberpunk visual style, neon futuristic cityscape",
          "artificial vibrant neon lighting",
          "wide-angle lens, immersive spatial perspective",
        ],
        comp: { view: "low-angle", position: "center", space: "none", distance: "wide-shot" },
        ratio: "--ar 16:9",
      },
      {
        id: "dramatic",
        name: "ドラマチック",
        desc: "逆光・陰影・強い視点で、物語の瞬間を切り取る。",
        tags: [
          "dramatic chiaroscuro lighting, strong contrast between light and dark",
          "backlighting silhouette effect",
          "cinematic blue and orange complementary palette",
          "cinematic photorealistic rendering, natural detail",
          "long exposure photo, motion blur trails",
        ],
        comp: { view: "low-angle", position: "center", space: "none", distance: "medium-shot" },
        ratio: "--ar 16:9",
      },
      {
        id: "after-rain",
        name: "雨上がり",
        desc: "濡れた路面・光・静けさ。出来事のあとに残る余韻。",
        tags: [
          "downtown street",
          "wet pavement reflecting surrounding ambient light",
          "soft diffused ambient light",
          "symbolic water droplet motif",
          "visual metaphor for renewal and rebirth",
        ],
        comp: { view: "eye-level", position: "off-center", space: "breathing-room", distance: "wide-shot" },
        ratio: "--ar 16:9",
      },
      {
        id: "dusk-memory",
        name: "夕暮れの記憶",
        desc: "夕焼け・暖色・懐かしさ。記憶のような一枚に。",
        tags: [
          "vibrant orange and crimson sunset sky",
          "dusky orange and violet twilight palette",
          "visual metaphor for nostalgia and memory",
          "warm low-angle sunset light",
          "35mm film photo aesthetic, subtle film grain",
        ],
        comp: { view: "eye-level", position: "off-center", space: "breathing-room", distance: "medium-shot" },
        ratio: "--ar 16:9",
      },
      {
        id: "boundary",
        name: "異界・境界",
        desc: "現実と異界の境目。違和感のある幻想的な情景に。",
        tags: [
          "surreal otherworldly dimension",
          "dense heavy fog drifting silently through the scene",
          "visual metaphor of a boundary between two different worlds",
          "visual metaphor of light and darkness, dual nature, and opposing forces",
          "symbolic surreal solitary door standing alone in space",
        ],
        comp: { view: "eye-level", position: "off-center", space: "none", distance: "establishing" },
        ratio: "--ar 16:9",
      },
      {
        id: "symbolic",
        name: "象徴の一枚",
        desc: "人物そのものより、モチーフと心象を主役に。",
        tags: [
          "symbolic large ornate mirror motif",
          "symbolic broken mirror shards reflecting light",
          "a calm reflective water surface",
          "visual metaphor of light and darkness, dual nature, and opposing forces",
          "visual metaphor of fragmented glass memories floating in the air",
        ],
        comp: { view: "high-angle", position: "off-center", space: "breathing-room", distance: "medium-shot" },
        ratio: "--ar 2:3",
      },
      {
        id: "quiet-room",
        name: "静かな部屋",
        desc: "窓辺・生活感・柔らかな光。日常の一瞬を切り取る。",
        tags: [
          "cozy lived-in bedroom with desk and personal items",
          "lived-in background details with subtle signs of everyday life",
          "soft diffused ambient light",
          "visual metaphor for quiet happiness",
          "softly blurred background with shallow depth of field",
        ],
        comp: { view: "eye-level", position: "off-center", space: "breathing-room", distance: "medium-shot" },
        ratio: "--ar 16:9",
      },
      {
        id: "japanese-dusk",
        name: "和風・宵",
        desc: "古い町並み・夕暮れ・静かな佇まい。",
        tags: [
          "nostalgic Japanese shopping arcade",
          "traditional Japanese attire",
          "dusky orange and violet twilight palette",
          "ink wash painting, expressive monochrome brushwork",
          "symbolic glowing lantern light",
        ],
        comp: { view: "eye-level", position: "off-center", space: "breathing-room", distance: "wide-shot" },
        ratio: "--ar 16:9",
      },
      {
        id: "ruined-world",
        name: "終末・廃墟",
        desc: "崩壊した世界と残された気配。静かな終末感。",
        tags: [
          "deserted city ruins under an empty sky",
          "completely empty and silent environment",
          "overgrown city fully reclaimed by lush vegetation",
          "visual metaphor for loss and absence",
          "dense heavy fog drifting silently through the scene",
        ],
        comp: { view: "high-angle", position: "off-center", space: "none", distance: "establishing" },
        ratio: "--ar 16:9",
      },
      {
        id: "close-emotion",
        name: "感情のクローズアップ",
        desc: "表情・視線・手元に寄り、感情そのものを見せる。",
        tags: [
          "large expressive eyes",
          "gentle subtle smile",
          "soft natural skin texture",
          "soft diffused ambient light",
          "eyes and irises emphasized in close detail",
        ],
        comp: { view: "eye-level", position: "center", space: "none", distance: "close-up" },
        ratio: "--ar 2:3",
      },
    ];

    function resetCompositionState() {
      Object.keys(compositionState).forEach((k) => (compositionState[k] = ""));
    }

    function resetDetailState() {
      Object.keys(detailState).forEach((group) =>
        Object.keys(detailState[group]).forEach(
          (k) => (detailState[group][k] = ""),
        ),
      );
    }

    const omakaseRuntimeValue =
      "creative artistic direction based on the novel's mood, motif, genre and purpose";

    function setDesignMethod(method) {
      designMethod = method;

      // AIおまかせはカテゴリタグではない一時的なランタイム値。
      // 別の方式へ切り替えたときに残留しないよう、入口で必ず解除する。
      if (method !== "omakase") {
        selectedTags.delete(omakaseRuntimeValue);
      }
      document
        .querySelectorAll(".design-method")
        .forEach((btn) =>
          btn.classList.toggle("active", btn.dataset.method === method),
        );
      const presetArea = document.getElementById("preset-area");
      const sceneSource = document.getElementById("scene-source");
      if (presetArea) presetArea.hidden = method !== "preset";
      if (sceneSource) sceneSource.hidden = method !== "from-text";
      if (method === "from-text") {
        activePreset = "";
        activeGenrePreset = "";
        renderPresets();
        renderGenrePresets();
      } else if (method === "omakase") {
        activePreset = "";
        activeGenrePreset = "";
        selectedTags.clear();
        resetCompositionState();
        selectedTags.add(omakaseRuntimeValue);
        const status = document.getElementById("preset-status");
        if (status)
          status.textContent =
            "AIおまかせの方向性を適用中 — 個別設定で自由に調整できる。";
        renderPresets();
        renderGenrePresets();
      } else if (method === "free") {
        const status = document.getElementById("preset-status");
        if (status)
          status.textContent =
            "自由設計 — プリセットは使わず、必要な項目だけ選べる。";
      }
      buildUI();
    }

    function renderGenrePresets() {
      const grid = document.getElementById("genre-preset-grid");
      if (!grid) return;
      grid.innerHTML = genrePresets
        .map(
          (p) =>
            `<button type="button" class="preset-card genre-card ${activeGenrePreset === p.id ? "active" : ""}" data-genre-preset="${p.id}"><span class="preset-name">${p.name}</span><span class="preset-desc">${p.desc}</span></button>`,
        )
        .join("");
      grid
        .querySelectorAll(".genre-card")
        .forEach((btn) =>
          btn.addEventListener("click", () =>
            applyGenrePreset(btn.dataset.genrePreset),
          ),
        );
    }

    function rebuildPresetSelection() {
      selectedTags.clear();
      const gp = genrePresets.find((x) => x.id === activeGenrePreset);
      const pp = presets.find((x) => x.id === activePreset);
      if (gp) gp.tags.forEach((v) => selectedTags.add(v));
      if (pp) pp.tags.forEach((v) => selectedTags.add(v));
      if (pp) {
        Object.keys(compositionState).forEach(
          (k) => (compositionState[k] = pp.comp?.[k] || ""),
        );
        selectedRatio = pp.ratio || "";
      } else {
        resetCompositionState();
        selectedRatio = "";
      }
    }

    function openCategoriesForCurrentPreset() {
      collapsedCategories.clear();
      collapsedSubgroups.clear();
      const activeCatIds = new Set();
      categoriesData.forEach((cat) => {
        if (!cat.group) return;
        if (
          !cat.modes.includes(currentMode) &&
          currentMode !== "all" &&
          !(currentMode === "character" && cat.group === "scene-detail")
        )
          return;
        if (!categoryAllowedByDefault(cat)) return;
        if (isPairMode() && pairHiddenCategories.has(cat.id)) return;
        if (isReferenceMode() && referenceHiddenCategories.has(cat.id)) return;
        const hasSelection = cat.items.some(isItemSelected);
        if (!hasSelection) {
          collapsedCategories.add(cat.id);
        } else {
          activeCatIds.add(cat.id);
        }
      });
      Object.values(categorySubgroups).forEach((subs) => {
        subs.forEach((sub) => {
          const hasAny = sub.cats.some((id) => activeCatIds.has(id));
          if (!hasAny) collapsedSubgroups.add(sub.id);
        });
      });
    }

    function applyGenrePreset(id) {
      const p = genrePresets.find((x) => x.id === id);
      if (!p) return;
      activeGenrePreset = activeGenrePreset === id ? "" : id;
      rebuildPresetSelection();
      openCategoriesForCurrentPreset();
      renderGenrePresets();
      renderPresets();
      const status = document.getElementById("preset-status");
      if (status)
        status.textContent = activeGenrePreset
          ? `「${p.name}」をベースに設定中 — 雰囲気プリセットとの組み合わせもできる。`
          : "ジャンルプリセットを解除した。";
      buildUI();
    }

    function renderPresets() {
      const grid = document.getElementById("preset-grid");
      if (!grid) return;
      grid.innerHTML = presets
        .map(
          (p) =>
            `<button class="preset-card ${activePreset === p.id ? "active" : ""}" data-preset="${p.id}"><span class="preset-name">${p.name}</span><span class="preset-desc">${p.desc}</span></button>`,
        )
        .join("");
      grid
        .querySelectorAll(".preset-card")
        .forEach((btn) =>
          btn.addEventListener("click", () => applyPreset(btn.dataset.preset)),
        );
    }

    function applyPreset(id) {
      const p = presets.find((x) => x.id === id);
      if (!p) return;
      activePreset = activePreset === id ? "" : id;
      rebuildPresetSelection();
      openCategoriesForCurrentPreset();
      const status = document.getElementById("preset-status");
      if (status) {
        const names = [];
        const gp = genrePresets.find((x) => x.id === activeGenrePreset);
        const pp = presets.find((x) => x.id === activePreset);
        if (gp) names.push(gp.name);
        if (pp) names.push(pp.name);
        status.textContent = names.length
          ? `「${names.join(" × ")}」をベースに設定中 — 個別の選択肢で自由に調整できる。`
          : "プリセットを解除した。";
      }
      renderPresets();
      renderGenrePresets();
      buildUI();
    }

    // ── カテゴリ検索・モードのグローバル状態とロジック ──
    const defaultCategoryIds = {
      character: new Set([
        "character",
        "character-race",
        "character-age",
        "hair-color",
        "hairstyle",
        "character-eyes",
        "character-iris",
        "character-skin",
        "character-body",
        "character-accessory",
        "outfit",
        "character-expression",
        "character-pose",
        "character-gaze",
        "landscape-fantasy",
        "landscape-modern",
        "landscape-sf",
        "landscape-historical",
        "landscape-postapoc",
        "landscape-odd",
        "landscape-steampunk",
        "environment-nature",
        "environment-weather",
        "environment-place",
        "environment-time",
        "environment-detail",
        "abstract-visual",
        "style",
        "color-palette",
        "camera",
        "lighting-direction",
        "visual-effects",
        "ratio",
      ]),
      landscape: new Set([
        "landscape-fantasy",
        "landscape-modern",
        "landscape-sf",
        "landscape-historical",
        "landscape-postapoc",
        "landscape-odd",
        "landscape-steampunk",
        "environment-nature",
        "environment-weather",
        "environment-place",
        "environment-time",
        "environment-detail",
        "abstract-visual",
        "style",
        "color-palette",
        "camera",
        "lighting-direction",
        "visual-effects",
        "ratio",
      ]),
      abstract: new Set([
        "abstract-emotion",
        "abstract-concept",
        "abstract-visual",
        "style",
        "color-palette",
        "camera",
        "lighting-direction",
        "visual-effects",
        "ratio",
      ]),
      all: null,
    };

    let tagSearchQuery = "";

    const collapsedSubgroups = new Set();

    function switchMode(mode, event) {
      currentMode = mode;
      document
        .querySelectorAll(".mode-card")
        .forEach((btn) => btn.classList.remove("active"));
      if (event?.currentTarget) event.currentTarget.classList.add("active");
      categoryCollapseSeeded = false;
      collapsedSubgroups.clear();
      buildUI();
    }

    function categoryAllowedByDefault(cat) {
      if (currentMode === "all") return true;
      const ids = defaultCategoryIds[currentMode];
      return !ids || ids.has(cat.id);
    }

    // ── 場面サブグループのタブ切り替え ──
    let activeSceneSubgroup = "scene-modern";

    function enhanceSceneSubgroupTabs(container) {
      const heading = container.querySelector(
        '.category-group-heading[data-group="scene-detail"]',
      );
      if (!heading) return;
      const allSubs = [];
      let node = heading.nextElementSibling;
      while (node && !node.matches(".category-group-heading")) {
        if (node.classList.contains("category-subgroup")) allSubs.push(node);
        node = node.nextElementSibling;
      }
      if (!allSubs.length) return;

      const tabbedIds = new Set([
        "scene-fantasy",
        "scene-modern",
        "scene-sf",
        "scene-history",
        "scene-postapoc",
        "scene-odd",
        "scene-steampunk",
        "scene-place",
      ]);
      const tabbedSubs = allSubs.filter((sub) =>
        tabbedIds.has(sub.dataset.subgroupId),
      );
      if (!tabbedSubs.length) return;

      const guide = document.createElement("div");
      guide.className = "scene-subgroup-tabs-guide";
      guide.textContent =
        "タブは表示の切り替えだけ。複数の世界観を組み合わせて選べる。";
      heading.after(guide);

      const summaryRow = document.createElement("div");
      summaryRow.className = "scene-subgroup-tabs-summary";
      guide.after(summaryRow);

      const nav = document.createElement("div");
      nav.className = "scene-subgroup-tabs";
      summaryRow.after(nav);

      const countSelected = (sub) => {
        const catIds =
          categorySubgroups["scene-detail"].find(
            (s) => s.id === sub.dataset.subgroupId,
          )?.cats || [];
        let n = 0;
        catIds.forEach((catId) => {
          const cat = getCategory(catId);
          if (!cat) return;
          cat.items.forEach((item) => {
            if (!item.isNone && item.value && selectedTags.has(item.value)) n++;
          });
        });
        return n;
      };

      const refreshSummary = () => {
        const picked = tabbedSubs
          .map((sub) => ({
            sub,
            title:
              sub.querySelector(".category-subgroup-title strong")?.textContent ||
              "",
            count: countSelected(sub),
          }))
          .filter((x) => x.count > 0);
        summaryRow.innerHTML = picked.length
          ? `選択中の世界観：${picked.map((x) => `${escapeHtml(x.title)}（${x.count}）`).join("　＋　")}`
          : "選択中の世界観：まだなし";
      };

      tabbedSubs.forEach((sub, idx) => {
        const id = sub.dataset.subgroupId;
        const title =
          sub.querySelector(".category-subgroup-title strong")?.textContent || "";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "scene-subgroup-tab";
        const labelEl = document.createElement("span");
        labelEl.textContent = title;
        btn.appendChild(labelEl);
        const n = countSelected(sub);
        if (n > 0) {
          const badge = document.createElement("span");
          badge.className = "scene-subgroup-tab-badge";
          badge.textContent = String(n);
          btn.appendChild(badge);
          btn.classList.add("has-selection");
        }
        const active =
          id === activeSceneSubgroup ||
          (!tabbedSubs.some((x) => x.dataset.subgroupId === activeSceneSubgroup) &&
            idx === 0);
        btn.classList.toggle("active", active);
        sub.hidden = !active;
        btn.addEventListener("click", () => {
          activeSceneSubgroup = id;
          nav
            .querySelectorAll("button")
            .forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          tabbedSubs.forEach((x) => (x.hidden = x !== sub));
        });
        nav.appendChild(btn);
      });

      refreshSummary();
    }

    // ── タグ検索パネル ──
    function renderTagSearchResults() {
      const input = document.getElementById("tag-search-input");
      const results = document.getElementById("tag-search-results");
      if (!input || !results) return;
      const q = (tagSearchQuery || "").trim().toLowerCase();
      results.innerHTML = "";
      results.hidden = !q;
      if (!q) return;

      const matches = [];
      categoriesData.forEach((cat) => {
        if (cat.id === "text-style") return;
        if (!cat.items?.length) return;
        cat.items.forEach((item) => {
          if (item.isNone || !item.value) return;
          const haystack = [item.label, cat.title, item.value]
            .join(" ")
            .toLowerCase();
          if (haystack.includes(q)) matches.push({ cat, item });
        });
      });

      const unique = [];
      const seen = new Set();
      matches.forEach((match) => {
        const key = `${match.cat.id}::${match.item.value}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(match);
        }
      });

      const count = document.createElement("div");
      count.className = "tag-search-count";
      count.textContent = unique.length
        ? `${unique.length}件見つかった`
        : "該当するタグがない";
      results.appendChild(count);

      if (!unique.length) {
        const empty = document.createElement("div");
        empty.className = "tag-search-empty";
        empty.textContent = "別の言葉で検索してみる。";
        results.appendChild(empty);
        return;
      }

      unique.slice(0, 80).forEach(({ cat, item }) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tag-search-result";
        const main = document.createElement("span");
        main.className = "tag-search-result-main";
        const label = document.createElement("span");
        label.className = "tag-search-result-label";
        label.textContent = cleanTagLabel(item.label);
        const meta = document.createElement("span");
        meta.className = "tag-search-result-meta";
        meta.textContent = cat.title;
        main.appendChild(label);
        main.appendChild(meta);
        const check = document.createElement("span");
        check.className = "tag-search-result-check";
        const selected = isItemSelected(item, cat);
        check.textContent = selected ? "✓ 選択中" : "選択";
        btn.appendChild(main);
        btn.appendChild(check);
        btn.addEventListener("click", () => {
          activePreset = "";
          renderPresets();
          toggleTag(btn, item, cat);
        });
        results.appendChild(btn);
      });
      if (unique.length > 80) {
        const more = document.createElement("div");
        more.className = "tag-search-empty";
        more.textContent = "検索結果が多いため、先頭80件を表示している。";
        results.appendChild(more);
      }
    }

    function initTagSearch() {
      const input = document.getElementById("tag-search-input");
      const clear = document.getElementById("tag-search-clear");
      if (!input || input.dataset.bound) return;
      input.dataset.bound = "1";
      input.addEventListener("input", () => {
        tagSearchQuery = input.value;
        renderTagSearchResults();
      });
      clear?.addEventListener("click", () => {
        tagSearchQuery = "";
        input.value = "";
        renderTagSearchResults();
        input.focus();
      });
    }

    // ── カテゴリ開閉状態（アコーディオン）管理 ──
    const collapsedCategories = new Set();

    let categoryCollapseSeeded = false;

    function seedCategoryCollapse() {
      if (categoryCollapseSeeded) return;
      categoriesData.forEach((cat) => {
        if (!cat.group) return;
        if (!cat.modes.includes(currentMode) && currentMode !== "all") return;
        if (isPairMode() && pairHiddenCategories.has(cat.id)) return;
        if (isReferenceMode() && referenceHiddenCategories.has(cat.id)) return;
        collapsedCategories.add(cat.id);
      });
      Object.values(categorySubgroups).forEach((subs) => {
        subs.forEach((sub) => collapsedSubgroups.add(sub.id));
      });
      categoryCollapseSeeded = true;
    }

    // ── ワークフローガイド ──
    function scrollToWorkflowGroup(group) {
      const heading = document.querySelector(
        `#dynamic-categories .category-group-heading[data-group="${group}"]`,
      );
      if (!heading) return;
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function updateWorkflowGuide() {
      const guide = document.getElementById("workflow-guide");
      if (!guide) return;
      guide.querySelectorAll(".workflow-guide-btn").forEach((btn) => {
        const group = btn.dataset.guideGroup;
        const cats = categoriesData.filter(
          (c) =>
            c.group === group &&
            (currentMode === "all" ||
              c.modes.includes(currentMode) ||
              (currentMode === "character" && c.group === "scene-detail")) &&
            categoryAllowedByDefault(c) &&
            !(isPairMode() && pairHiddenCategories.has(c.id)) &&
            !(isReferenceMode() && referenceHiddenCategories.has(c.id)),
        );
        let count = 0;
        cats.forEach((cat) => {
          count += cat.items.filter(
            (i) =>
              !i.isNone &&
              (i.isSingleRatio
                ? selectedRatio === i.value
                : selectedTags.has(i.value)),
          ).length;
        });
        if (group === "character-detail" && isPairMode()) {
          try {
            const pairCount = Object.values(pairState || {}).reduce(
              (sum, person) =>
                sum +
                Object.values(person || {}).reduce((n, v) => {
                  if (Array.isArray(v)) return n + v.length;
                  return n + (v ? 1 : 0);
                }, 0),
              0,
            );
            count = Math.max(count, pairCount);
          } catch (e) { }
        }
        const status = btn.querySelector(".guide-status");
        if (status)
          status.textContent = count ? `✓ ${count}件設定済み` : "必要なら設定";
      });
    }

    function initWorkflowGuide() {
      document.querySelectorAll(".workflow-guide-btn").forEach((btn) => {
        if (btn.dataset.bound) return;
        btn.dataset.bound = "1";
        btn.addEventListener("click", () => {
          if (btn.dataset.nextStep) {
            showStep(btn.dataset.nextStep);
          } else {
            scrollToWorkflowGroup(btn.dataset.guideGroup);
          }
        });
      });
    }

    // ── 文字スタイル設定・カテゴリUI構築 ──
    function renderTextStyleControl() {
      const wrap = document.getElementById("work-text-style");
      const tagBox = document.getElementById("work-text-tags");
      const countEl = document.getElementById("work-text-count");
      const hintEl = document.getElementById("work-text-hint");
      const cat = getCategory("text-style");
      if (!wrap || !tagBox || !cat) return;
      const noText = document.getElementById("no-text-check")?.checked;
      wrap.classList.toggle("is-disabled", !!noText);
      tagBox.innerHTML = "";
      const selectedItems = cat.items.filter(
        (item) => !item.isNone && item.value && selectedTags.has(item.value),
      );
      if (countEl)
        countEl.textContent = `${cat.items.filter((i) => !i.isNone).length}個の選択肢`;
      if (hintEl)
        hintEl.innerHTML = selectedItems.length
          ? '<span class="selection-key"><span class="selection-key-mark">✓</span>選択中</span>　複数選択OK'
          : "複数選択OK";
      const hasSelection = selectedItems.length > 0;
      cat.items.forEach((item) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tag-btn";
        if (item.value) btn.dataset.tagValue = item.value;
        if (item.isNone) {
          btn.classList.add("none-option");
          if (!hasSelection) btn.classList.add("active");
        } else {
          if (item.isOmakase) btn.classList.add("omakase");
          if (selectedTags.has(item.value)) btn.classList.add("active");
        }
        btn.textContent = item.label;
        btn.disabled = !!noText;
        btn.onclick = () => {
          activePreset = "";
          renderPresets();
          toggleTag(btn, item, cat);
        };
        tagBox.appendChild(btn);
      });
    }

    const categorySubgroups = {
      "character-detail": [
        {
          id: "character-basic",
          label: "基本",
          desc: "人数・構成・見せ方",
          cats: ["character"],
        },
        {
          id: "character-appearance",
          label: "外見",
          desc: "種族・年齢・髪・目・肌・体格",
          cats: [
            "character-race",
            "character-age",
            "hair-color",
            "hairstyle",
            "character-eyes",
            "character-iris",
            "character-skin",
            "character-body",
          ],
        },
        {
          id: "character-clothing",
          label: "服装・小物",
          desc: "服装・アクセサリー・持ち物",
          cats: ["outfit", "character-accessory", "character-props"],
        },
        {
          id: "character-expression",
          label: "表情・仕草",
          desc: "表情・手元・ポーズ・視線",
          cats: [
            "character-expression",
            "character-hands",
            "character-pose",
            "character-gaze",
          ],
        },
      ],
      "scene-detail": [
        {
          id: "scene-modern",
          label: "現代",
          desc: "現代の日常・都市・暮らしの世界",
          cats: ["landscape-modern"],
        },
        {
          id: "scene-fantasy",
          label: "幻想",
          desc: "異世界・魔法・幻想の世界",
          cats: ["landscape-fantasy"],
        },
        {
          id: "scene-sf",
          label: "SF",
          desc: "近未来・宇宙・サイバーの世界",
          cats: ["landscape-sf"],
        },
        {
          id: "scene-history",
          label: "歴史・和風",
          desc: "時代もの・歴史・和風の世界",
          cats: ["landscape-historical"],
        },
        {
          id: "scene-postapoc",
          label: "終末・荒廃",
          desc: "崩壊・廃墟・荒野の世界",
          cats: ["landscape-postapoc"],
        },
        {
          id: "scene-odd",
          label: "異形・怪異",
          desc: "怪異・異界・夢のような世界",
          cats: ["landscape-odd"],
        },
        {
          id: "scene-steampunk",
          label: "スチームパンク",
          desc: "蒸気機関・歯車・工業都市の世界",
          cats: ["landscape-steampunk"],
        },
        {
          id: "scene-place",
          label: "舞台・場所",
          desc: "具体的な場所・建物・施設",
          cats: ["environment-place"],
        },
        {
          id: "scene-nature",
          label: "自然・地形・天体",
          desc: "植物・地形・水辺・空・天体",
          cats: ["environment-nature"],
        },
        {
          id: "scene-weather",
          label: "天候",
          desc: "雨・雪・霧・風などの天候",
          cats: ["environment-weather"],
        },
        {
          id: "scene-time-season",
          label: "時間・季節",
          desc: "朝・昼・夜と四季・季節の移り変わり",
          cats: ["environment-time"],
        },
        {
          id: "scene-background",
          label: "背景ディテール",
          desc: "生活感・奥行き・反射・粒子などの細部",
          cats: ["environment-detail"],
        },
      ],
      "visual-detail": [
        {
          id: "visual-color",
          label: "色・配色",
          desc: "色調・カラーコンセプト",
          cats: ["color-palette"],
        },
      ],
      "composition-detail": [
        {
          id: "composition-all",
          label: "画面の見せ方",
          desc: "構図・視点・カメラ・光・演出・画面比率",
          cats: [
            "camera",
            "lighting-direction",
            "visual-effects",
            "ratio",
            "style",
          ],
        },
      ],
      "concept-detail": [
        {
          id: "concept-emotion",
          label: "感情",
          desc: "人物や場面に込める感情",
          cats: ["abstract-emotion"],
        },
        {
          id: "concept-meaning",
          label: "概念",
          desc: "作品の意味や心象",
          cats: ["abstract-concept"],
        },
        {
          id: "concept-symbol",
          label: "象徴・モチーフ",
          desc: "意味を持たせる視覚要素",
          cats: ["abstract-visual"],
        },
      ],
    };

    function renderCategoryGroups(container, targetGroups) {
      container.innerHTML = "";

      const groupNames = {
        "character-detail": ["人物を設定", "人物を描く場合だけ、必要な項目を選ぶ"],
        "scene-detail": [
          "世界・環境を設定",
          "世界観・舞台・自然・天候・時間・背景を決める",
        ],
        "visual-detail": ["色を設定", "色調・配色を決める"],
        "composition-detail": [
          "画面の見せ方を設定",
          "構図・カメラ・光・演出・奥行きを決める",
        ],
        "concept-detail": [
          "意味を設定",
          "感情・心象、概念・テーマ、象徴・モチーフを決める",
        ],
        "output-detail": ["出力を整える", "サイズ・画面比率を設定"],
      };

      const renderedIds = new Set();

      targetGroups.forEach((groupId) => {
        const groupCats = categoriesData.filter(
          (cat) =>
            cat.id !== "text-style" &&
            ((cat.group === groupId && !(groupId === "visual-detail" && cat.id === "style")) ||
              (groupId === "composition-detail" && cat.id === "style")) &&
            (cat.modes.includes(currentMode) ||
              currentMode === "all" ||
              (currentMode === "character" && cat.group === "scene-detail")) &&
            categoryAllowedByDefault(cat) &&
            !(isPairMode() && pairHiddenCategories.has(cat.id)) &&
            !(isReferenceMode() && referenceHiddenCategories.has(cat.id)),
        );
        if (!groupCats.length) return;

        const heading = document.createElement("div");
        heading.className = "category-group-heading";
        heading.dataset.group = groupId;
        heading.innerHTML = `<strong>${groupNames[groupId]?.[0] || groupId}</strong><span>${groupNames[groupId]?.[1] || ""}</span>`;
        container.appendChild(heading);

        const subgroupDefs = categorySubgroups[groupId] || [
          {
            id: `${groupId}-all`,
            label: "設定",
            desc: "",
            cats: groupCats.map((c) => c.id),
          },
        ];
        subgroupDefs.forEach((sub) => {
          const subCats = sub.cats
            .map((id) => categoryIndex.get(id))
            .filter((cat) => cat && groupCats.includes(cat));
          if (!subCats.length) return;
          subCats.forEach((cat) => renderedIds.add(cat.id));

          const wrap = document.createElement("div");
          wrap.className = "category-subgroup";
          wrap.dataset.subgroupId = sub.id;
          const isCollapsed = collapsedSubgroups.has(sub.id);
          if (isCollapsed) wrap.classList.add("is-collapsed");

          const subHead = document.createElement("div");
          subHead.className = "category-subgroup-head";
          const subTitle = document.createElement("div");
          subTitle.className = "category-subgroup-title";
          subTitle.innerHTML = `<strong>${sub.label}</strong>${sub.desc ? `<span>${sub.desc}</span>` : ""}`;
          subHead.appendChild(subTitle);
          const subBtn = document.createElement("button");
          subBtn.type = "button";
          subBtn.className = "category-subgroup-btn";
          const isCompositionSubgroup = groupId === "composition-detail";
          subBtn.textContent = isCollapsed ? "開く" : "閉じる";
          subBtn.setAttribute("aria-expanded", String(!isCollapsed));
          if (isCompositionSubgroup) {
            subBtn.hidden = true;
            wrap.classList.remove("is-collapsed");
          }
          subHead.appendChild(subBtn);
          wrap.appendChild(subHead);

          const subContent = document.createElement("div");
          subContent.className = "category-subgroup-content";
          subCats.forEach((cat) => {
            const sec = document.createElement("div");
            sec.className = "section";
            sec.dataset.categoryId = cat.id;
            const isCompositionCategory = groupId === "composition-detail";
            const isSoleCategoryInSubgroup = subCats.length === 1;
            const suppressInnerToggle =
              isCompositionCategory || isSoleCategoryInSubgroup;
            if (!suppressInnerToggle && collapsedCategories.has(cat.id))
              sec.classList.add("is-collapsed");
            if (isCompositionCategory)
              sec.classList.add("composition-control-card");

            const head = document.createElement("div");
            head.className = "category-section-head";
            const title = document.createElement("div");
            title.className = "section-title";
            title.textContent = cat.title;
            const selectedItems = cat.items.filter((item) => isItemSelected(item));
            if (selectedItems.length) {
              const summary = document.createElement("span");
              summary.className = "category-selection-summary";
              const labels = selectedItems.map((item) =>
                cleanTagLabel(item.label),
              );
              const preview =
                labels.length <= 2
                  ? labels.join("、")
                  : `${labels.slice(0, 2).join("、")}、＋${labels.length - 2}件`;
              summary.textContent = `✓ ${selectedItems.length}件`;
              summary.title = labels.join("、");
              summary.dataset.preview = preview;
              head.appendChild(title);
              head.appendChild(summary);
              const previewEl = document.createElement("span");
              previewEl.className = "category-selection-preview";
              previewEl.textContent = preview;
              previewEl.title = labels.join("、");
              head.appendChild(previewEl);
            } else head.appendChild(title);

            const collapseBtn = document.createElement("button");
            collapseBtn.type = "button";
            collapseBtn.className = "category-collapse-btn";
            collapseBtn.setAttribute(
              "aria-expanded",
              String(!collapsedCategories.has(cat.id)),
            );
            collapseBtn.setAttribute(
              "aria-label",
              `${cat.title}を${collapsedCategories.has(cat.id) ? "開く" : "閉じる"}`,
            );
            collapseBtn.textContent = collapsedCategories.has(cat.id)
              ? "開く"
              : "閉じる";
            if (suppressInnerToggle) collapseBtn.hidden = true;
            head.appendChild(collapseBtn);
            sec.appendChild(head);

            const content = document.createElement("div");
            content.className = "category-content";
            const categoryHasSelection = cat.items.some(isItemSelected);
            const tools = document.createElement("div");
            tools.className = "category-tools";
            const count = document.createElement("span");
            count.className = "category-count";
            count.textContent = `${cat.items.filter((i) => !i.isNone).length}個の選択肢`;
            const hint = document.createElement("span");
            hint.className = "category-hint";
            const isSingleChoice =
              cat.items.filter((i) => !i.isNone).length > 0 &&
              cat.items.filter((i) => !i.isNone).every((i) => i.isSingleRatio);
            hint.innerHTML = isSingleChoice
              ? "1つ選択"
              : categoryHasSelection
                ? '<span class="selection-key"><span class="selection-key-mark">✓</span>選択中</span>　複数選択OK'
                : "複数選択OK";
            tools.appendChild(count);
            tools.appendChild(hint);
            content.appendChild(tools);
            const tagBox = document.createElement("div");
            tagBox.className = "tag-container";
            const hasFreeInputInCat = cat.items.some(
              (item) => item.freeInput && freeMotifText,
            );
            const hasSelectionInCat = hasFreeInputInCat || cat.items.some(isItemSelected);
            let lastStyleFamily = null;
            cat.items.forEach((item) => {
              if (
                (cat.id === "style" || cat.id === "outfit" || cat.id === "hairstyle") &&
                item.family &&
                item.family !== lastStyleFamily
              ) {
                const familyHead = document.createElement("div");
                familyHead.className = "style-family-heading";
                familyHead.textContent = item.family;
                tagBox.appendChild(familyHead);
                lastStyleFamily = item.family;
              }
              if (item.freeInput) {
                const wrap = document.createElement("div");
                wrap.className = "free-input-wrap";
                const input = document.createElement("input");
                input.type = "text";
                input.className = "free-motif-input";
                input.placeholder = item.placeholder || "自由に入力";
                input.value = freeMotifText;
                input.setAttribute("aria-label", "象徴・モチーフの自由入力");
                input.addEventListener("input", () => {
                  freeMotifText = input.value.trim();
                  const noneBtn = document.querySelector(
                    `.none-option[data-none-for-cat="${cat.id}"]`,
                  );
                  if (noneBtn) {
                    const hasOtherSelection = cat.items.some(
                      (i) =>
                        !i.isNone &&
                        !i.freeInput &&
                        (i.isSingleRatio
                          ? selectedRatio === i.value
                          : selectedTags.has(i.value)),
                    );
                    noneBtn.classList.toggle(
                      "active",
                      !freeMotifText && !hasOtherSelection,
                    );
                  }
                  updateOutput();
                });
                wrap.appendChild(input);
                content.appendChild(wrap);
                return;
              }
              const btn = document.createElement("button");
              btn.type = "button";
              btn.className = "tag-btn";
              if (item.value) btn.dataset.tagValue = item.value;
              if (item.isNone) {
                btn.classList.add("none-option");
                btn.dataset.noneForCat = cat.id;
                if (!hasSelectionInCat) btn.classList.add("active");
              } else {
                if (item.isOmakase) btn.classList.add("omakase");
                if (isItemSelected(item, cat)) btn.classList.add("active");
              }
              const labelEl = document.createElement("span");
              labelEl.className = "tag-label";
              labelEl.textContent = item.label;
              btn.appendChild(labelEl);
              if (item.description) {
                const descEl = document.createElement("span");
                descEl.className = "tag-description";
                descEl.textContent = item.description;
                btn.appendChild(descEl);
              }
              btn.onclick = () => {
                activePreset = "";
                renderPresets();
                toggleTag(btn, item, cat);
              };
              tagBox.appendChild(btn);
            });
            content.appendChild(tagBox);
            const detailConfig = buildDetailConfig(cat);
            if (detailConfig) content.appendChild(detailConfig);
            sec.appendChild(content);
            const toggleCategory = () => {
              const collapsed = sec.classList.toggle("is-collapsed");
              if (collapsed) collapsedCategories.add(cat.id);
              else collapsedCategories.delete(cat.id);
              collapseBtn.textContent = collapsed ? "開く" : "閉じる";
              collapseBtn.setAttribute("aria-expanded", String(!collapsed));
              collapseBtn.setAttribute(
                "aria-label",
                `${cat.title}を${collapsed ? "開く" : "閉じる"}`,
              );
            };
            if (!suppressInnerToggle) {
              head.addEventListener("click", (e) => {
                if (e.target.closest("button")) return;
                toggleCategory();
              });
              collapseBtn.addEventListener("click", toggleCategory);
            }
            subContent.appendChild(sec);
          });
          wrap.appendChild(subContent);
          const toggleSubgroup = () => {
            if (groupId === "composition-detail") return;
            const collapsed = wrap.classList.toggle("is-collapsed");
            if (collapsed) collapsedSubgroups.add(sub.id);
            else collapsedSubgroups.delete(sub.id);
            subBtn.textContent = collapsed ? "開く" : "閉じる";
            subBtn.setAttribute("aria-expanded", String(!collapsed));
          };
          subHead.addEventListener("click", (e) => {
            if (e.target.closest("button")) return;
            toggleSubgroup();
          });
          subBtn.addEventListener("click", toggleSubgroup);
          container.appendChild(wrap);
        });
      });
      if (targetGroups.includes("scene-detail"))
        enhanceSceneSubgroupTabs(container);
    }

    function buildUI() {
      initTagSearch();
      renderTagSearchResults();
      seedCategoryCollapse();
      renderCategoryGroups(document.getElementById("dynamic-categories"), [
        "character-detail",
        "scene-detail",
        "visual-detail",
        "concept-detail",
      ]);
      renderCategoryGroups(
        document.getElementById("composition-detail-categories"),
        ["composition-detail"],
      );
      renderTextStyleControl();
      updateOutput();
      initWorkflowGuide();
      updateWorkflowGuide();
    }

    // ── カテゴリ開閉の一括操作 ──
    function setAllCategoriesCollapsed(collapsed) {
      document.querySelectorAll(`${"#dynamic-categories"} .category-subgroup`).forEach((sub) => {
        sub.classList.toggle("is-collapsed", collapsed);
        const id = sub.dataset.subgroupId;
        if (id) {
          if (collapsed) collapsedSubgroups.add(id);
          else collapsedSubgroups.delete(id);
        }
        const btn = sub.querySelector(
          ":scope > .category-subgroup-head .category-subgroup-btn",
        );
        if (btn) {
          btn.textContent = collapsed ? "開く" : "閉じる";
          btn.setAttribute("aria-expanded", String(!collapsed));
        }
      });
      document.querySelectorAll(`${"#dynamic-categories"} .section`).forEach((sec) => {
        if ("#dynamic-categories" === "#composition-detail-categories") return;
        sec.classList.toggle("is-collapsed", collapsed);
        if (collapsed) collapsedCategories.add(sec.dataset.categoryId);
        else collapsedCategories.delete(sec.dataset.categoryId);
        const btn = sec.querySelector(".category-collapse-btn");
        if (btn) {
          btn.textContent = collapsed ? "開く" : "閉じる";
          btn.setAttribute("aria-expanded", String(!collapsed));
        }
      });
      updateWorkflowGuide();
    }


    // ── モード判定・カテゴリ取得ヘルパー ──
    function isReferenceMode() {
      return Array.from(referenceCharacterValues).some((v) => selectedTags.has(v));
    }

    function isPairMode() {
      return Array.from(pairCharacterValues).some((v) => selectedTags.has(v));
    }

    function getCategory(catId) {
      return categoryIndex.get(catId);
    }

    // ── 人物ペア設定パネル ──
    function buildPairPersonPanel(personKey, label) {
      const st = pairState[personKey];
      const wrap = document.createElement("div");
      wrap.className = "pair-person-panel";
      const title = document.createElement("div");
      title.className = "pair-person-title";
      title.textContent = label;
      wrap.appendChild(title);
      const grid = document.createElement("div");
      grid.className = "detail-grid";
      const sourceField = document.createElement("div");
      sourceField.className = "detail-field pair-source-field";
      const sourceLabel = document.createElement("label");
      sourceLabel.textContent = "人物の作り方";
      sourceField.appendChild(sourceLabel);
      const sourceSel = document.createElement("select");
      [
        ["", "指定して作る"],
        ["reference", "参考画像を使う"],
      ].forEach(([v, t]) => {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = t;
        sourceSel.appendChild(o);
      });
      sourceSel.value = st.reference ? "reference" : "";
      sourceSel.addEventListener("change", () => {
        st.reference = sourceSel.value === "reference";
        if (st.reference) {
          [
            "gender",
            "type",
            "race",
            "age",
            "hairStyle",
            "eyes",
            "iris",
            "skin",
            "body",
          ].forEach((k) => (st[k] = ""));
          st.hairDetail = { mode: "", color1: "", color2: "", placement: "" };
          st.irisDetail = { mode: "", color1: "", color2: "", direction: "" };
        }
        buildUI();
      });
      sourceField.appendChild(sourceSel);
      grid.appendChild(sourceField);

      const genderCat = getCategory("character-gender");
      if (genderCat && !st.reference) {
        const genderField = document.createElement("div");
        genderField.className = "detail-field";
        const genderLabel = document.createElement("label");
        genderLabel.textContent = "性別・性別表現";
        genderField.appendChild(genderLabel);
        const genderSel = document.createElement("select");
        const genderPh = document.createElement("option");
        genderPh.value = "";
        genderPh.textContent = "指定なし";
        genderSel.appendChild(genderPh);
        genderCat.items
          .filter((it) => !it.isNone && it.value)
          .forEach((it) => {
            const o = document.createElement("option");
            o.value = it.value;
            o.textContent = it.label;
            genderSel.appendChild(o);
          });
        genderSel.value = st.gender || "";
        genderSel.addEventListener("change", () => {
          st.gender = genderSel.value;
          buildUI();
        });
        genderField.appendChild(genderSel);
        grid.appendChild(genderField);
      }

      const selectField = (fieldLabel, key, catId, filterFn) => {
        const cat = getCategory(catId);
        if (!cat) return null;
        const field = document.createElement("div");
        field.className = "detail-field";
        const lab = document.createElement("label");
        lab.textContent = fieldLabel;
        field.appendChild(lab);
        const sel = document.createElement("select");
        const ph = document.createElement("option");
        ph.value = "";
        ph.textContent = "指定なし";
        sel.appendChild(ph);
        cat.items
          .filter((it) => !it.isNone && it.value && (!filterFn || filterFn(it)))
          .forEach((it) => {
            const o = document.createElement("option");
            o.value = it.value;
            o.textContent = it.label.replace(/^\[AI\]\s*/, "");
            sel.appendChild(o);
          });
        sel.value = st[key] || "";
        sel.addEventListener("change", () => {
          st[key] = sel.value;
          buildUI();
        });
        field.appendChild(sel);
        grid.appendChild(field);
        return sel;
      };

      const selectHairField = (fieldLabel, key, kind) => {
        let cat = getCategory(kind === "color" ? "hair-color" : "hairstyle");
        let items = cat ? cat.items : [];
        if (!cat) {
          const base = getCategory("hair");
          if (!base) return null;
          const colorLabels = new Set([
            "指定なし",
            "黒髪",
            "茶髪",
            "栗色",
            "金髪",
            "白髪",
            "銀髪",
            "灰色",
            "赤髪",
            "橙髪",
            "黄色の髪",
            "緑髪",
            "青髪",
            "水色の髪",
            "紫髪",
            "桃色の髪",
            "桜色の髪",
            "青緑の髪",
            "二色の髪",
            "毛先だけ色が違う",
            "メッシュ・差し色",
          ]);
          const styleLabels = new Set([
            "指定なし",
            "ベリーショート",
            "ショート",
            "ボブ",
            "ミディアム",
            "ロング",
            "スーパーロング",
            "ストレート",
            "ゆるウェーブ",
            "ウェーブ",
            "巻き髪",
            "くせ毛",
            "外ハネ",
            "内巻き",
            "ポニーテール",
            "ハイポニーテール",
            "ローポニーテール",
            "ツインテール",
            "ハーフアップ",
            "お団子",
            "編み込み",
            "三つ編み",
            "ツイン三つ編み",
            "サイドテール",
            "前髪ぱっつん",
            "長い前髪",
            "斜め前髪",
            "前髪なし",
            "片目を隠す",
            "オールバック",
            "無造作ヘア",
            "風になびく髪",
          ]);
          const labels = kind === "color" ? colorLabels : styleLabels;
          items = base.items.filter((it) => labels.has(it.label));
        }
        const field = document.createElement("div");
        field.className = "detail-field";
        const lab = document.createElement("label");
        lab.textContent = fieldLabel;
        field.appendChild(lab);
        const sel = document.createElement("select");
        const ph = document.createElement("option");
        ph.value = "";
        ph.textContent = "指定なし";
        sel.appendChild(ph);
        items
          .filter((it) => !it.isNone && it.value)
          .forEach((it) => {
            const o = document.createElement("option");
            o.value = it.value;
            o.textContent = it.label.replace(/^\[AI\]\s*/, "");
            sel.appendChild(o);
          });
        sel.value = st[key] || "";
        sel.addEventListener("change", () => {
          st[key] = sel.value;
          buildUI();
        });
        field.appendChild(sel);
        grid.appendChild(field);
        return sel;
      };
      const addColorDetail = (kind) => {
        const isHair = kind === "hair";
        const key = isHair ? "hairDetail" : "irisDetail";
        const detail = st[key];
        const selected = st[isHair ? "hairColor" : "iris"];
        const modes = isHair
          ? {
            two: "two-tone hair",
            tips: "hair with contrasting colored tips",
            streaks: "hair with colored streaks or highlights",
          }
          : {
            hetero: "heterochromia, differently colored eyes",
            gradient: "gradient-colored irises",
          };
        let mode = "";
        if (isHair) {
          if (selected === modes.two) mode = "two";
          else if (selected === modes.tips) mode = "tips";
          else if (selected === modes.streaks) mode = "streaks";
        } else {
          if (selected === modes.hetero) mode = "hetero";
          else if (selected === modes.gradient) mode = "gradient";
        }
        if (!mode) return;
        detail.mode = mode;
        const box = document.createElement("div");
        box.className = "pair-detail-subconfig";
        const title = document.createElement("div");
        title.className = "detail-config-title";
        title.textContent = isHair ? "髪色の詳細指定" : "瞳の色の詳細指定";
        box.appendChild(title);
        const subgrid = document.createElement("div");
        subgrid.className = "detail-grid";
        const add = (label, key, options, placeholder) => {
          const field = document.createElement("div");
          field.className = "detail-field";
          const lab = document.createElement("label");
          lab.textContent = label;
          field.appendChild(lab);
          const sel = document.createElement("select");
          const ph = document.createElement("option");
          ph.value = "";
          ph.textContent = placeholder || "指定なし";
          sel.appendChild(ph);
          options.forEach(([text, val]) => {
            const o = document.createElement("option");
            o.value = val;
            o.textContent = text;
            sel.appendChild(o);
          });
          sel.value = detail[key] || "";
          sel.addEventListener("change", () => {
            detail[key] = sel.value;
            updateOutput();
          });
          field.appendChild(sel);
          subgrid.appendChild(field);
        };
        if (isHair) {
          if (mode === "two") {
            add("色1", "color1", colorOptions, "ベースカラー");
            add("色2", "color2", colorOptions, "組み合わせる色");
            add(
              "色の分かれ方",
              "placement",
              [
                ["左右で分かれる", "split left and right"],
                ["前髪だけ別色", "contrasting front bangs"],
                ["内側だけ別色", "contrasting inner hair"],
                ["上半分と下半分", "upper and lower hair split"],
                ["毛先だけ別色", "contrasting hair tips"],
              ],
              "分け方を選択",
            );
          } else if (mode === "tips") {
            add("ベースカラー", "color1", colorOptions, "ベースカラー");
            add("毛先の色", "color2", colorOptions, "毛先の色");
          } else {
            add("ベースカラー", "color1", colorOptions, "ベースカラー");
            add("差し色", "color2", colorOptions, "差し色");
            add(
              "入れ方",
              "placement",
              [
                ["細いメッシュ", "thin colored streaks"],
                ["太めのメッシュ", "bold colored streaks"],
                ["前髪に入れる", "streaks in the bangs"],
                ["部分的に入れる", "localized colored streaks"],
              ],
              "入れ方を選択",
            );
          }
        } else if (mode === "hetero") {
          add("左目", "color1", colorOptions, "左目の色");
          add("右目", "color2", colorOptions, "右目の色");
        } else {
          add("始点の色", "color1", colorOptions, "始点の色");
          add("終点の色", "color2", colorOptions, "終点の色");
          add(
            "グラデーション方向",
            "direction",
            [
              ["上から下", "top to bottom"],
              ["外側から内側", "outer edge to inner iris"],
              ["中心から外側", "center to outer iris"],
              ["左右方向", "left to right"],
            ],
            "方向を選択",
          );
        }
        box.appendChild(subgrid);
        return box;
      };
      if (!st.reference) {
        selectField("人物タイプ", "type", "character", (it) =>
          /女性1人|男性1人|人物1人（性別指定なし）|中性的な人物1人/.test(it.label),
        );
        selectField("種族・存在", "race", "character-race");
        selectField("年齢感", "age", "character-age");
        selectHairField("髪色", "hairColor", "color");
        const hd = addColorDetail("hair");
        if (hd) grid.appendChild(hd);
        selectHairField("髪型", "hairStyle", "style");
        selectField("目の印象", "eyes", "character-eyes");
        selectField("瞳の色", "iris", "character-iris");
        const id = addColorDetail("iris");
        if (id) grid.appendChild(id);
        selectField("肌", "skin", "character-skin");
        selectField("体格", "body", "character-body");
      }
      // ペアでは服装・表情・手元・アクセサリー・小物をここだけで指定する。
      selectField("服装", "outfit", "outfit");
      selectField("表情", "expression", "character-expression");
      selectField("手・仕草", "hands", "character-hands");
      selectField("アクセサリー", "accessory", "character-accessory");
      selectField("手に持つもの", "props", "character-props");
      wrap.appendChild(grid);
      if (st.reference) {
        const note = document.createElement("div");
        note.className = "detail-note";
        note.textContent =
          "この人物は参考画像を基準にする。外見・種族・年齢・体格などは画像側に任せ、服装・表情・手元・小物などはここで追加指定できる。";
        wrap.appendChild(note);
      }
      return wrap;
    }

    const pairRelationOptions = [
      ["", "指定なし", ""],
      ["close", "親しい・寄り添う", "close relationship, intimate body language"],
      ["friends", "友人・仲間", "friends or companions"],
      ["family", "家族", "family relationship"],
      ["partners", "相棒・バディ", "partners or duo"],
      ["teacher-student", "師弟・主従", "teacher and student or master and subordinate"],
      ["rivals", "ライバル", "rival relationship, competitive tension"],
      ["enemies", "敵対", "enemies in conflict"],
      ["strangers", "初対面・他人", "strangers meeting for the first time"],
      ["reunion", "再会", "characters reunited after separation"],
      ["parting", "別れ・すれ違い", "parting or emotional separation"],
    ];

    function buildPairConfig() {
      if (!isPairMode()) return null;
      const wrap = document.createElement("div");
      wrap.className = "detail-config pair-config";
      const title = document.createElement("div");
      title.className = "detail-config-title";
      title.textContent = "2人の人物を個別に設定";
      wrap.appendChild(title);
      const note = document.createElement("div");
      note.className = "detail-note";
      note.textContent =
        "人物1と人物2を、それぞれ別の人物として設定。片方だけ指定して、もう片方はAIに任せることもできる。";
      wrap.appendChild(note);
      const people = document.createElement("div");
      people.className = "pair-people-grid";
      people.appendChild(buildPairPersonPanel("person1", "人物1"));
      people.appendChild(buildPairPersonPanel("person2", "人物2"));
      wrap.appendChild(people);
      const rel = document.createElement("div");
      rel.className = "detail-field pair-relation-field";
      const lab = document.createElement("label");
      lab.textContent = "二人の関係";
      rel.appendChild(lab);
      const sel = document.createElement("select");
      pairRelationOptions.forEach(([v, t]) => {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = t;
        sel.appendChild(o);
      });
      sel.value = pairState.relation;
      sel.addEventListener("change", () => {
        pairState.relation = sel.value;
        updateOutput();
      });
      rel.appendChild(sel);
      wrap.appendChild(rel);
      const relationNote = document.createElement("div");
      relationNote.className = "detail-note";
      relationNote.textContent =
        "距離や視線、手の動きなど「画面上の関係」はSTEP 3で指定する。";
      wrap.appendChild(relationNote);
      return wrap;
    }

    function getPairPromptParts() {
      if (!isPairMode()) return [];
      const parts = [];
      const fields = [
        ["gender", "gender expression"],
        ["race", "species"],
        ["age", "age impression"],
        ["hairColor", "hair color"],
        ["hairStyle", "hairstyle"],
        ["eyes", "eye shape"],
        ["iris", "iris color"],
        ["skin", "skin"],
        ["outfit", "clothing"],
        ["expression", "facial expression"],
        ["body", "body type"],
        ["hands", "hands and gesture"],
        ["accessory", "accessories"],
        ["props", "props"],
      ];
      ["person1", "person2"].forEach((pk, i) => {
        const st = pairState[pk];
        const vals = fields
          .filter(([k]) => st[k])
          .map(([k, l]) => `${l}: ${st[k]}`);
        const h = st.hairDetail || {};
        if (h.mode === "two" && h.color1 && h.color2)
          vals.push(
            `hair color detail: ${h.color1} and ${h.color2}${h.placement ? " (" + h.placement + ")" : ""}`,
          );
        else if (h.mode === "tips" && h.color1 && h.color2)
          vals.push(`hair color detail: ${h.color1} hair with ${h.color2} tips`);
        else if (h.mode === "streaks" && h.color1 && h.color2)
          vals.push(
            `hair color detail: ${h.color1} hair with ${h.color2} streaks${h.placement ? " (" + h.placement + ")" : ""}`,
          );
        const ir = st.irisDetail || {};
        if (ir.mode === "hetero" && ir.color1 && ir.color2)
          vals.push(`iris detail: left eye ${ir.color1}, right eye ${ir.color2}`);
        else if (ir.mode === "gradient" && ir.color1 && ir.color2)
          vals.push(
            `iris detail: gradient from ${ir.color1} to ${ir.color2}${ir.direction ? " (" + ir.direction + ")" : ""}`,
          );
        if (st.reference) vals.unshift("based on the attached reference image");
        if (vals.length) parts.push(`person ${i + 1}: ${vals.join(", ")}`);
      });
      const relation = pairRelationOptions.find(([value]) => value === pairState.relation);
      if (relation?.[2]) parts.push(relation[2]);
      return parts;
    }


    function resetPairPerson(person) {
      Object.keys(person).forEach((k) => {
        person[k] =
          k === "reference"
            ? false
            : k.endsWith("Detail")
              ? { mode: "", color1: "", color2: "", placement: "", direction: "" }
              : "";
      });
    }

    function resetPairState() {
      resetPairPerson(pairState.person1);
      resetPairPerson(pairState.person2);
      pairState.relation = "";
    }

    function removeCategoryTags(categoryIds) {
      categoryIds.forEach((catId) => {
        const cat = getCategory(catId);
        if (cat) cat.items.forEach((it) => it.value && selectedTags.delete(it.value));
      });
    }

    function deleteSelectedValues(values) {
      values.forEach((value) => selectedTags.delete(value));
    }

    function clearGlobalCharacterSelections() {
      removeCategoryTags(pairHiddenCategories);
      resetDetailState();
    }

    // ── 詳細設定パネル（髪型・服装など） ──
    function buildDetailConfig(category) {
      if (category.id === "character") {
        if (isReferenceMode()) {
          const wrap = document.createElement("div");
          wrap.className = "detail-config reference-config";
          const title = document.createElement("div");
          title.className = "detail-config-title";
          title.textContent = "参考画像を基準にする";
          wrap.appendChild(title);
          const note = document.createElement("div");
          note.className = "detail-note";
          note.textContent =
            "人物の外見・種族・年齢などは参考画像に任せる。服装・表情・ポーズ・視線・手元・小物など、場面に必要な指定はこのまま残せる。参考画像はこのスタジオにアップロードする必要はない。";
          wrap.appendChild(note);
          return wrap;
        }
        const pair = buildPairConfig();
        if (pair) return pair;
      }
      if (category.id === "hair-color") {
        const hasTwoTone = selectedTags.has("two-tone hair");
        const hasTips = selectedTags.has("hair with contrasting colored tips");
        const hasStreaks = selectedTags.has(
          "hair with colored streaks or highlights",
        );
        const st = detailState.hair;
        if (!(hasTwoTone || hasTips || hasStreaks)) return null;
        const wrap = document.createElement("div");
        wrap.className = "detail-config";
        const title = document.createElement("div");
        title.className = "detail-config-title";
        title.textContent = "髪色の詳細指定";
        wrap.appendChild(title);
        const grid = document.createElement("div");
        grid.className = "detail-grid";
        const addSelect = (label, key, options, placeholder) => {
          const field = document.createElement("div");
          field.className = "detail-field";
          const lab = document.createElement("label");
          lab.textContent = label;
          field.appendChild(lab);
          const sel = document.createElement("select");
          const ph = document.createElement("option");
          ph.value = "";
          ph.textContent = placeholder || "指定なし";
          sel.appendChild(ph);
          options.forEach(([text, val]) => {
            const o = document.createElement("option");
            o.value = val;
            o.textContent = text;
            sel.appendChild(o);
          });
          sel.value = st[key] || "";
          sel.addEventListener("change", () => {
            st[key] = sel.value;
            updateOutput();
          });
          field.appendChild(sel);
          grid.appendChild(field);
        };
        if (hasTwoTone) {
          addSelect("色1", "color1", colorOptions, "ベースカラー");
          addSelect("色2", "color2", colorOptions, "組み合わせる色");
          addSelect(
            "色の分かれ方",
            "placement",
            [
              ["左右で分かれる", "split left and right"],
              ["前髪だけ別色", "contrasting front bangs"],
              ["内側だけ別色", "contrasting inner hair"],
              ["上半分と下半分", "upper and lower hair split"],
              ["毛先だけ別色", "contrasting hair tips"],
            ],
            "分け方を選択",
          );
        } else if (hasTips) {
          addSelect("ベースカラー", "color1", colorOptions, "ベースカラー");
          addSelect("毛先の色", "color2", colorOptions, "毛先の色");
        } else if (hasStreaks) {
          addSelect("ベースカラー", "color1", colorOptions, "ベースカラー");
          addSelect("差し色", "color2", colorOptions, "差し色");
          addSelect(
            "入れ方",
            "placement",
            [
              ["細いメッシュ", "thin colored streaks"],
              ["太めのメッシュ", "bold colored streaks"],
              ["前髪に入れる", "streaks in the bangs"],
              ["部分的に入れる", "localized colored streaks"],
            ],
            "入れ方を選択",
          );
        }
        wrap.appendChild(grid);
        const note = document.createElement("div");
        note.className = "detail-note";
        note.textContent = "色を選ばなければ、生成AI側に配色を任せられる。";
        wrap.appendChild(note);
        return wrap;
      }
      if (category.id === "character-iris") {
        const hetero = selectedTags.has("heterochromia, differently colored eyes");
        const gradient = selectedTags.has("gradient-colored irises");
        if (!hetero && !gradient) return null;
        const st = detailState.iris;
        const wrap = document.createElement("div");
        wrap.className = "detail-config";
        const title = document.createElement("div");
        title.className = "detail-config-title";
        title.textContent = "瞳の色の詳細指定";
        wrap.appendChild(title);
        const grid = document.createElement("div");
        grid.className = "detail-grid";
        const addSelect = (label, key, options, placeholder) => {
          const field = document.createElement("div");
          field.className = "detail-field";
          const lab = document.createElement("label");
          lab.textContent = label;
          field.appendChild(lab);
          const sel = document.createElement("select");
          const ph = document.createElement("option");
          ph.value = "";
          ph.textContent = placeholder || "指定なし";
          sel.appendChild(ph);
          options.forEach(([text, val]) => {
            const o = document.createElement("option");
            o.value = val;
            o.textContent = text;
            sel.appendChild(o);
          });
          sel.value = st[key] || "";
          sel.addEventListener("change", () => {
            st[key] = sel.value;
            updateOutput();
          });
          field.appendChild(sel);
          grid.appendChild(field);
        };
        if (hetero) {
          addSelect("左目", "color1", colorOptions, "左目の色");
          addSelect("右目", "color2", colorOptions, "右目の色");
        } else {
          addSelect("始点の色", "color1", colorOptions, "始点の色");
          addSelect("終点の色", "color2", colorOptions, "終点の色");
          addSelect(
            "グラデーション方向",
            "direction",
            [
              ["上から下", "top to bottom"],
              ["外側から内側", "outer edge to inner iris"],
              ["中心から外側", "center to outer iris"],
              ["左右方向", "left to right"],
            ],
            "方向を選択",
          );
        }
        wrap.appendChild(grid);
        const note = document.createElement("div");
        note.className = "detail-note";
        note.textContent = "左右の指定は、人物から見た左目・右目として扱う。";
        wrap.appendChild(note);
        return wrap;
      }
      return null;
    }

    function getDetailPromptParts() {
      const parts = [];
      const h = detailState.hair;
      if (selectedTags.has("two-tone hair") && h.color1 && h.color2) {
        const placementMap = {
          "split left and right":
            "split-color hair, left side ${A}, right side ${B}",
          "contrasting front bangs":
            "two-tone hair, ${A} base with ${B} front bangs",
          "contrasting inner hair":
            "two-tone hair, ${A} outer hair with ${B} inner hair",
          "upper and lower hair split":
            "two-tone hair, ${A} upper hair and ${B} lower hair",
          "contrasting hair tips": "${A} hair with ${B} tips",
        };
        let text = placementMap[h.placement] || "two-tone hair";
        text = text.replaceAll("${A}", h.color1).replaceAll("${B}", h.color2);
        parts.push(text);
      } else if (
        selectedTags.has("hair with contrasting colored tips") &&
        h.color1 &&
        h.color2
      ) {
        parts.push(`${h.color1} hair with ${h.color2} contrasting tips`);
      } else if (
        selectedTags.has("hair with colored streaks or highlights") &&
        h.color1 &&
        h.color2
      ) {
        parts.push(
          `${h.color1} hair with ${h.color2} colored streaks${h.placement ? " (" + h.placement + ")" : ""}`,
        );
      }
      const i = detailState.iris;
      if (
        selectedTags.has("heterochromia, differently colored eyes") &&
        i.color1 &&
        i.color2
      ) {
        parts.push(`heterochromia, left eye ${i.color1}, right eye ${i.color2}`);
      } else if (
        selectedTags.has("gradient-colored irises") &&
        i.color1 &&
        i.color2
      ) {
        parts.push(
          `gradient irises from ${i.color1} to ${i.color2}${i.direction ? " (" + i.direction + ")" : ""}`,
        );
      }
      return parts;
    }

    // ── 本文からの場面抽出 ──

    const sceneExtractionRules = [
      // 天候・時間
      [/雨上がり|雨が上が|雨の止ん|雨が止ん|雨上がる/, "雨上がり"],
      [/夕暮れ|夕方|黄昏|日が暮れ|日暮れ|夕陽|夕日/, "夕暮れ"],
      [/朝焼け|夜明け|明け方|日の出/, "朝焼け"],
      [/深夜|真夜中|夜更け|丑三つ時/, "深夜"],
      [/夜霧/, "夜霧"],
      [/朝霧|朝もや|朝靄/, "朝霧"],
      [/小雨|霧雨|こぬか雨/, "小雨"],
      [/豪雨|土砂降り|どしゃ降り|激しい雨/, "豪雨"],
      [/夕立|にわか雨/, "夕立"],
      [/吹雪|猛吹雪/, "吹雪"],
      [/雷雨|雷鳴|稲妻|雷が/, "雷雨"],
      [/強風|突風|風が強|吹き荒れ/, "強風"],
      [/曇天|どんより|曇り空/, "曇天"],
      [/快晴|雲ひとつない|晴れ渡/, "快晴"],
      [/薄曇り|薄雲/, "薄曇り"],
      [/花吹雪|桜吹雪|花びらが舞/, "花吹雪"],
      [/新緑|若葉/, "新緑"],
      [/落葉|落ち葉/, "落葉"],
      [/凍てつ|霜|氷点下/, "凍てつく空気"],
      [/夏の終わり|晩夏/, "夏の終わり"],
      [/春の終わり|晩春/, "春の終わり"],
      [/秋の終わり|晩秋/, "秋の終わり"],
      [/冬の始まり|初冬/, "冬の始まり"],

      // 場所・世界
      [/古い商店街|商店街|アーケード/, "古い商店街"],
      [/商店街の路地|店裏の路地/, "商店街の路地"],
      [/踏切|遮断機|踏切の警報/, "踏切"],
      [/バス停|バスの停留所/, "バス停"],
      [/河川敷/, "河川敷"],
      [/海岸|海辺|浜辺|砂浜/, "海岸"],
      [/防波堤/, "海辺の防波堤"],
      [/灯台/, "灯台"],
      [/山道|山道を/, "山道"],
      [/温室/, "温室"],
      [/古い洋館|洋館/, "古い洋館"],
      [/神社の境内|神社/, "神社"],
      [/寺町/, "寺町"],
      [/寺|寺院/, "寺"],
      [/古い旅館|旅館/, "古い旅館"],
      [/銭湯/, "銭湯"],
      [/洞窟|洞穴/, "洞窟"],
      [/廃遊園地|遊園地の廃墟/, "廃遊園地"],
      [/地下鉄|地下鉄のホーム/, "地下鉄"],
      [/高架下/, "高架下"],
      [/屋根裏|屋根裏部屋/, "屋根裏部屋"],
      [/温泉街/, "温泉街"],
      [/無人駅|誰もいない駅/, "無人駅"],
      [/古い駅舎/, "古い駅舎"],
      [/駅|ホーム|改札|駅前/, "駅・ホーム"],
      [/学校|教室|校舎|廊下|教室の窓/, "学校"],
      [/体育館/, "体育館"],
      [/病院|病室/, "病院"],
      [/図書館/, "図書館"],
      [/図書室/, "図書室"],
      [/カフェ|喫茶店/, "喫茶店・カフェ"],
      [/コンビニ/, "コンビニ"],
      [/アパート|団地|集合住宅/, "アパートの部屋"],
      [/オフィス街|高層ビル|ビル街/, "オフィス街"],
      [/港町|港/, "港町"],
      [/田園|農村|田舎の集落/, "田園・農村"],
      [/路地裏|裏路地|細い路地/, "路地裏"],
      [/公園/, "公園"],
      [/屋内階段|階段/, "屋内階段"],
      [/温泉|温泉街/, "温泉街"],

      // 自然・幻想・終末
      [/深い森|森の奥|森/, "森・深い森"],
      [/魔法都市|魔法の街/, "魔法都市"],
      [/古城|廃城/, "古城・廃城"],
      [/王都|城下町/, "王都・城下町"],
      [/中世の村|村の集落/, "中世の村"],
      [/魔法学園|魔法学校/, "魔法学園"],
      [/神殿|遺跡/, "神殿・遺跡"],
      [/浮遊都市|空中都市/, "浮遊都市"],
      [/空中庭園/, "空中庭園"],
      [/地下都市/, "地下都市"],
      [/魔法の森/, "魔法の森"],
      [/異形の荒野/, "異形の荒野"],
      [/幻想的な花畑|一面の花畑/, "幻想的な花畑"],
      [/荒廃した未来都市|ディストピア/, "荒廃した未来都市"],
      [/廃墟|廃屋/, "廃墟"],
      [/崩壊した都市|都市の崩壊/, "崩壊した都市"],
      [/無人の高速道路|高速道路/, "無人の高速道路"],
      [/避難所|避難施設/, "避難所"],
      [/浸水した街|水没した街/, "浸水した街"],
      [/植物に侵食|蔦に覆われ/, "植物に侵食された都市"],
      [/雪に閉ざされた街|雪に埋もれた街/, "雪に閉ざされた街"],
      [/近未来都市/, "近未来都市"],
      [/ネオン街|ネオン|繁華街/, "ネオン街"],
      [/宇宙船/, "宇宙船"],
      [/宇宙ステーション/, "宇宙ステーション"],
      [/研究施設|研究所/, "研究施設"],
      [/月面基地/, "月面基地"],
      [/宇宙コロニー/, "宇宙コロニー"],
      [/海上都市/, "海上都市"],
      [/地下シェルター/, "地下シェルター"],
      [/機械都市/, "機械都市"],
      [/仮想現実|VR空間/, "仮想現実空間"],
      [/蒸気都市|蒸気機関/, "蒸気都市"],
      [/歯車の街|歯車/, "歯車の街"],
      [/飛行船港|飛行船/, "飛行船港"],
      [/機械工房/, "機械工房"],
      [/時計塔都市/, "時計塔都市"],

      // 小物・象徴
      [/黒猫/, "黒猫"],
      [/猫/, "黒猫"],
      [/蝶/, "蝶"],
      [/林檎|りんご|リンゴ/, "林檎"],
      [/花びら/, "花びら"],
      [/手紙|封筒|便箋|手紙を/, "手紙"],
      [/封蝋|シーリングスタンプ/, "封蝋"],
      [/万年筆|泉筆|ペン/, "万年筆"],
      [/懐中時計/, "懐中時計"],
      [/時計|時刻/, "時計"],
      [/砂時計/, "砂時計"],
      [/鏡|鏡像/, "鏡"],
      [/鍵|鍵を握/, "鍵"],
      [/本|文庫本|小説/, "本"],
      [/水面|水たまり|池の水面/, "水面"],
      [/波紋/, "波紋"],
      [/鳥籠/, "鳥籠"],
      [/鳥|羽ばた/, "鳥"],
      [/羽根|羽/, "羽根"],
      [/赤い糸/, "赤い糸"],
      [/蝋燭|ろうそく|キャンドル/, "蝋燭"],
      [/炎|火の粉/, "炎"],
      [/煙|煙が立/, "煙"],
      [/割れたガラス|ガラスが割/, "割れたガラス"],
      [/扉|ドア/, "扉"],
      [/窓|窓辺/, "窓"],
      [/階段/, "階段"],
      [/花束/, "花束"],
      [/一輪の花|一輪だけの花/, "一輪の花"],
      [/彼岸花/, "彼岸花"],
      [/桜/, "桜"],
      [/露|雫|しずく/, "露・雫"],
      [/雨粒|雨滴/, "雨粒・水滴"],
      [/雪/, "雪"],
      [/星空|満天の星|星々/, "星空"],
      [/星座/, "星座"],
      [/月蝕|月食|日蝕|日食/, "日蝕・月蝕"],
      [/満月/, "満月"],
      [/月|月明かり|月光/, "月"],
      [/長い影/, "長い影"],
      [/足跡/, "足跡"],
      [/鳥籠/, "鳥籠"],
      [/紙片|ページが舞|ページ/, "紙片・ページ"],
      [/指輪|リング/, "指輪"],
      [/ランタン|提灯/, "ランタン"],
      [/消えた街灯|灯りの消えた街灯/, "灯りの消えた街灯"],
      [/水滴の中|雫の中/, "水滴の中の景色"],

      // 人物・行動・表情（明示描写のみ）
      [/二人|ふたり|二人の/, "人物ペア"],
      [/一人|ひとり|一人きり|独り/, "人物1人（性別指定なし）"],
      [/振り返|振り向/, "振り返る"],
      [/見上げ|空を見上げ/, "見上げる"],
      [/俯|うつむ|顔を伏せ/, "俯く"],
      [/走っ|走り|駆け/, "走る"],
      [/座っ|腰を下ろ|座る/, "座る"],
      [/立って|立ち|立つ/, "立つ"],
      [/涙|泣い|泣き/, "涙を流す"],
      [/微笑|笑顔|笑っ|笑み/, "穏やかな微笑み"],
      [/怒っ|怒り|憤/, "怒り"],
      [/怯え|恐怖|怖が/, "怯え・恐怖"],
      [/不安|不穏|胸騒ぎ/, "不安・戸惑い"],
      [/安堵|ほっと|安心/, "安堵"],
      [/決意|覚悟を決め|決めた/, "決意"],
      [/諦め|あきらめ/, "諦め"],

      // 感情・概念（本文で明示された場合だけ）
      [/孤独|ひとりぼっち|孤立/, "孤独"],
      [/寂し|淋し/, "寂しさ"],
      [/懐かし|昔を思い出|思い出す/, "懐かしさ"],
      [/喪失|失った|失う/, "喪失"],
      [/後悔|悔や/, "後悔"],
      [/罪悪感|罪の意識/, "罪悪感"],
      [/焦燥|焦る|焦って/, "焦燥"],
      [/絶望|絶望的/, "絶望"],
      [/嫉妬|妬み/, "嫉妬"],
      [/愛情|愛して|大切に思/, "愛情"],
      [/恋慕|恋しい|恋い焦が/, "恋慕"],
      [/幸福|幸せ/, "幸福"],
      [/静寂|静けさ|静まり返/, "静寂"],
      [/再会|再び会|久しぶりに会/, "再会"],
      [/別離|別れ|離れてい/, "別離"],
      [/秘密|隠し事/, "秘密"],
      [/真実|真相/, "真実"],
      [/嘘|偽り/, "嘘"],
      [/境界|境目|こちらとあちら/, "境界"],
      [/記憶|思い出/, "記憶"],
      [/運命/, "運命"],
      [/忘却|忘れ去/, "忘却"],
      [/自由/, "自由"],
    ];

    function analyzeSceneText() {
      const input = document.getElementById("scene-text");
      const text = input?.value.trim() || "";
      if (!text) {
        alert("画像にしたい本文を貼ってみて。");
        return;
      }
      const found = [];
      const seen = new Set();

      sceneExtractionRules.forEach(([regex, label]) => {
        if (!regex.test(text) || seen.has(label)) return;
        const item = sceneTagIndex.get(label)?.item || null;
        if (!item) return;
        seen.add(label);
        selectedTags.add(item.value);
        found.push({ value: item.value, label: item.label });
      });

      const directLabelExclusions = new Set([
        "指定なし",
        "本",
        "花",
        "月",
        "鳥",
        "糸",
        "羽根",
        "雨",
        "雪",
        "夜",
        "朝",
        "昼",
        "春",
        "夏",
        "秋",
        "冬",
        "時間",
        "世界",
        "存在",
        "変化",
      ]);
      sceneTagIndex.forEach(({ item }) => {
        if (
          item.isNone ||
          !item.value ||
          item.label.length < 2 ||
          directLabelExclusions.has(item.label) ||
          seen.has(item.label)
        )
          return;
        if (text.includes(item.label)) {
          seen.add(item.label);
          selectedTags.add(item.value);
          found.push({ value: item.value, label: item.label });
        }
      });

      const chips = document.getElementById("scene-extracted-chips");
      const wrap = document.getElementById("scene-extracted");
      if (chips)
        chips.innerHTML = found.length
          ? found
            .map((x) => `<span class="scene-chip">${escapeHtml(x.label)}</span>`)
            .join("")
          : '<span class="scene-source-note">まだ拾える手がかりが見つからない。本文を残したまま、下の設定から自由に追加できる。</span>';
      if (wrap) wrap.hidden = false;
      buildUI();
    }

    // ── タグ選択トグル・リセット処理 ──
    function toggleTag(button, item, category) {
      if (item.isNone) {
        category.items.forEach((it) => {
          if (it.value) {
            if (it.isSingleRatio) {
              if (selectedRatio === it.value) selectedRatio = "";
            } else {
              selectedTags.delete(it.value);
            }
          }
          if (it.freeInput) freeMotifText = "";
        });
      } else if (item.isSingleRatio) {
        selectedRatio = selectedRatio === item.value ? "" : item.value;
      } else {
        const targetTags = selectedTags;
        if (targetTags.has(item.value)) {
          targetTags.delete(item.value);
        } else {
          targetTags.add(item.value);
          if (pairCharacterValues.has(item.value)) {
            deleteSelectedValues(referenceCharacterValues);
            clearGlobalCharacterSelections();
          }
          if (referenceCharacterValues.has(item.value)) {
            deleteSelectedValues(pairCharacterValues);
            removeCategoryTags(referenceHiddenCategories);
            resetDetailState();
          }
          if (
            pairCharacterValues.has(item.value) ||
            referenceCharacterValues.has(item.value)
          ) {
            resetPairState();
          }
        }
      }
      buildUI();
    }

    function clearStep2Selections() {
      if (!confirm("STEP 2の選択肢をすべてクリアする。\nこの操作は元に戻せない。"))
        return;

      activePreset = "";
      activeGenrePreset = "";
      freeMotifText = "";
      const step2Groups = new Set([
        "character-detail",
        "scene-detail",
        "visual-detail",
        "concept-detail",
      ]);
      deleteSelectedValues(
        getSelectedCategoryItems()
          .filter(({ cat }) => step2Groups.has(cat.group))
          .map(({ item }) => item.value),
      );
      resetDetailState();
      resetPairState();

      renderPresets();
      renderGenrePresets();
      const status = document.getElementById("preset-status");
      if (status) status.textContent = "自由設計 — 必要な項目だけ選べる。";

      collapsedCategories.clear();
      collapsedSubgroups.clear();
      categoryCollapseSeeded = false;
      buildUI();
      setAllCategoriesCollapsed(true);
    }

    function resetAll() {
      activePreset = "";
      activeGenrePreset = "";
      designMethod = "free";
      document.getElementById("novel-title").value = "";
      document.getElementById("catchphrase").value = "";
      document.getElementById("work-avoid").value = "";
      const sceneText = document.getElementById("scene-text");
      if (sceneText) sceneText.value = "";
      const sceneExtractedEl = document.getElementById("scene-extracted");
      if (sceneExtractedEl) sceneExtractedEl.hidden = true;
      const sceneChips = document.getElementById("scene-extracted-chips");
      if (sceneChips) sceneChips.innerHTML = "";
      document.getElementById("output-purpose").selectedIndex = 0;
      document.getElementById("include-title-check").checked = true;
      document.getElementById("include-catchphrase-check").checked = true;
      selectedTags.clear();
      selectedRatio = "";
      collapsedCategories.clear();
      collapsedSubgroups.clear();
      categoryCollapseSeeded = false;
      resetCompositionState();
      resetDetailState();
      resetPairState();
      document
        .querySelectorAll(".choice-row button")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".design-method")
        .forEach((btn) =>
          btn.classList.toggle("active", btn.dataset.method === "free"),
        );
      const presetArea = document.getElementById("preset-area");
      if (presetArea) presetArea.hidden = true;
      renderPresets();
      renderGenrePresets();
      showStep(1);
      buildUI();
    }

    // ── プロンプト生成（出力結果の組み立て） ──
    function getSelectedCategoryItems() {
      const result = [];
      categoriesData.forEach((cat) => {
        cat.items.forEach((item) => {
          if (!item.isNone && item.value && isItemSelected(item, cat)) {
            result.push({ cat, item });
          }
        });
      });
      return result;
    }

    function buildPromptJson() {
      const titleText = document.getElementById("novel-title").value.trim();
      const noText = document.getElementById("no-text-check").checked;
      const isTitleEnabled =
        !noText && document.getElementById("include-title-check").checked;
      const catchphraseText = document.getElementById("catchphrase").value.trim();
      const isCatchphraseEnabled =
        !noText && document.getElementById("include-catchphrase-check").checked;
      const workAvoid = document.getElementById("work-avoid").value.trim();
      const outputPurpose = document.getElementById("output-purpose").value;
      const sceneText = document.getElementById("scene-text")?.value.trim() || "";

      const result = {
        quality: ["masterpiece", "best quality"],
      };

      if (outputPurpose) result.purpose = outputPurpose;

      const characterCategory = getCategory("character");
      const hasExplicitCharacter = !!(
        characterCategory &&
        characterCategory.items.some(
          (item) => item.value && !item.isNone && selectedTags.has(item.value),
        )
      );
      const hasPairCharacter = !!(getPairPromptParts().length > 0);
      if (!hasExplicitCharacter && !hasPairCharacter) {
        result.character = {
          exclusion: ["no people", "no humans", "no characters", "no person"],
        };
      }

      const groups = {
        character: {
          base: [],
          appearance: [],
          expression: [],
          pose: [],
          detail: [],
        },
        world: [],
        emotion: [],
        concept: [],
        motif: [],
        color: [],
        style: [],
        lighting: [],
        effects: [],
        camera: [],
        text_style: [],
      };

      const groupMap = {
        character: ["character", "base"],
        "character-race": ["character", "base"],
        "character-age": ["character", "base"],
        "hair-color": ["character", "appearance"],
        hairstyle: ["character", "appearance"],
        "character-eyes": ["character", "appearance"],
        "character-iris": ["character", "appearance"],
        "character-skin": ["character", "appearance"],
        "character-body": ["character", "appearance"],
        outfit: ["character", "appearance"],
        "character-expression": ["character", "expression"],
        "character-pose": ["character", "pose"],
        "character-gaze": ["character", "pose"],
        "character-hands": ["character", "pose"],
        "character-accessory": ["character", "detail"],
        "character-props": ["character", "detail"],
        "landscape-modern": "world",
        "landscape-historical": "world",
        "landscape-fantasy": "world",
        "landscape-sf": "world",
        "landscape-steampunk": "world",
        "landscape-odd": "world",
        "landscape-postapoc": "world",
        "environment-place": "world",
        "environment-nature": "world",
        "environment-weather": "world",
        "environment-time": "world",
        "environment-detail": "world",
        "abstract-emotion": "emotion",
        "abstract-concept": "concept",
        "abstract-visual": "concept",
        "color-palette": "color",
        style: "style",
        "lighting-direction": "lighting",
        "visual-effects": "effects",
        camera: "camera",
        "text-style": "text_style",
      };

      categoriesData.forEach((cat) => {
        const target = groupMap[cat.id];
        if (!target) return;
        const [key, subkey] = Array.isArray(target) ? target : [target, null];
        cat.items.forEach((item) => {
          if (!item.isNone && item.value && selectedTags.has(item.value)) {
            const value = item.value;
            const bucket = subkey ? groups[key][subkey] : groups[key];
            if (!bucket.includes(value)) bucket.push(value);
          }
        });
      });

      Object.entries(groups).forEach(([key, values]) => {
        if (key === "character") {
          const hasCharacterValues = Object.values(values).some((items) => items.length);
          if (hasCharacterValues) result.character = values;
          return;
        }
        if (values.length) result[key] = values;
      });

      if (noText) {
        result.text = {
          include: false,
          exclusion: ["no text", "no typography", "no letters", "no words", "no logo", "no watermark"],
        };
      } else {
        result.text = { include: true };
        if (isTitleEnabled && titleText) result.text.title = titleText;
        if (isCatchphraseEnabled && catchphraseText) result.text.subtitle = catchphraseText;
      }

      if (designMethod === "from-text" && sceneText) {
        result.scene_context = sceneText.slice(0, 1200);
      }

      if (freeMotifText) result.motif_input = freeMotifText;

      const detailParts = getDetailPromptParts();
      if (detailParts.length) {
        if (!result.character || Array.isArray(result.character)) {
          result.character = { base: [], appearance: [], expression: [], pose: [], detail: [] };
        }
        result.character.detail.push(...detailParts.filter((value) => !result.character.detail.includes(value)));
      }

      if (result.character) {
        Object.keys(result.character).forEach((key) => {
          if (!result.character[key].length) delete result.character[key];
        });
        if (!Object.keys(result.character).length) delete result.character;
      }

      const composition = {};
      Object.entries(compositionState).forEach(([key, value]) => {
        const option = compositionOptions[key]?.[value];
        if (option?.prompt) composition[key] = option.prompt;
      });
      if (Object.keys(composition).length) result.composition = composition;

      const pairParts = getPairPromptParts();
      if (pairParts.length) result.pair = pairParts;

      if (workAvoid) result.avoid = workAvoid;
      if (selectedRatio) result.aspect_ratio = selectedRatio.replace(/^--ar\s+/i, "");

      return result;
    }

    function updateOutput() {
      const finalPrompt = JSON.stringify(buildPromptJson(), null, 2);
      document.getElementById("output-prompt").textContent = finalPrompt;
      const referenceNote = document.getElementById("reference-copy-note");
      if (referenceNote)
        referenceNote.hidden = !(
          isReferenceMode() ||
          (isPairMode() &&
            (pairState.person1.reference || pairState.person2.reference))
        );
      updateSummary();
    }

    // ── ビジュアル設計図パネル ──
    function toggleBlueprint(open) {
      const panel = document.getElementById("visual-blueprint");
      const backdrop = document.getElementById("blueprint-backdrop");
      const trigger = document.getElementById("blueprint-trigger");
      if (!panel) return;
      panel.classList.toggle("is-visible", !!open);
      panel.classList.toggle("is-closed", !open);
      document.body.classList.toggle("blueprint-open", !!open);
      if (backdrop) backdrop.classList.toggle("is-visible", !!open);
      if (trigger) trigger.setAttribute("aria-expanded", String(!!open));
    }

    const compositionOptions = {
      "view": {
        "eye-level": { label: "目線の高さ", prompt: "eye-level view" },
        "low-angle": { label: "見上げる", prompt: "low-angle view" },
        "high-angle": { label: "見下ろす", prompt: "high-angle view" },
        overhead: { label: "真上から", prompt: "overhead view" },
        "close-up": { label: "近接", prompt: "close-up perspective" },
      },
      "position": {
        left: { label: "左寄り", prompt: "subject positioned on the left" },
        center: { label: "中央", prompt: "subject centered" },
        right: { label: "右寄り", prompt: "subject positioned on the right" },
        "off-center": { label: "オフセンター", prompt: "off-center composition" },
      },
      "space": {
        "title-safe": { label: "文字用の余白", prompt: "clear title-safe negative space" },
        "breathing-room": { label: "広めの余白", prompt: "generous negative space" },
        tight: { label: "画面いっぱい", prompt: "tight full-frame composition" },
        none: { label: "余白指定なし", prompt: "natural framing without deliberate negative space" },
      },
      "distance": {
        portrait: { label: "ポートレート", prompt: "portrait distance" },
        "medium-shot": { label: "中距離", prompt: "medium shot" },
        "wide-shot": { label: "広角", prompt: "wide shot" },
        establishing: { label: "場所を主役", prompt: "establishing shot with the location as a major subject" },
      },
    };

    function getBlueprintSelections() {
      const groups = {
        人物: [],
        "世界・風景": [],
        "感情・心象": [],
        "概念・テーマ": [],
        "象徴・モチーフ": [],
        "色・配色": [],
        "文字・タイポグラフィ": [],
        画面設定: [],
      };
      const groupMap = {
        "character-detail": "人物",
        "scene-detail": "世界・風景",
        "concept-detail": "感情・心象",
        "composition-detail": "画面設定",
      };
      const categoryBucketMap = {
        "color-palette": "色・配色",
        style: "画面設定",
        camera: "画面設定",
        "lighting-direction": "画面設定",
        "visual-effects": "画面設定",
      };
      getSelectedCategoryItems().forEach(({ cat, item }) => {
        let bucket = categoryBucketMap[cat.id] || groupMap[cat.group];
        if (cat.id === "abstract-concept") bucket = "概念・テーマ";
        if (cat.id === "abstract-visual") bucket = "象徴・モチーフ";
        if (cat.id === "ratio") bucket = null;
        if (cat.id === "text-style") bucket = null;
        if (!bucket) return;
        groups[bucket].push(cleanTagLabel(item.label));
      });
      if (freeMotifText)
        groups["象徴・モチーフ"].push(`自由入力：${freeMotifText}`);

      const textStyleCat = getCategory("text-style");
      if (textStyleCat) {
        const noText = document.getElementById("no-text-check")?.checked;
        if (noText) {
          groups["文字・タイポグラフィ"].push("画像内の文字なし");
        } else {
          const textItems = textStyleCat.items.filter(
            (item) => !item.isNone && item.value && selectedTags.has(item.value),
          );
          textItems.forEach((item) =>
            groups["文字・タイポグラフィ"].push(
              cleanTagLabel(item.label),
            ),
          );
          const titleOn = document.getElementById("include-title-check")?.checked;
          const catchOn = document.getElementById(
            "include-catchphrase-check",
          )?.checked;
          if (titleOn || catchOn) {
            const parts = [];
            if (titleOn) parts.push("タイトル");
            if (catchOn) parts.push("キャッチコピー");
            groups["文字・タイポグラフィ"].unshift(`${parts.join("＋")}を表示`);
          }
        }
      }
      if (isPairMode()) {
        [pairState.person1, pairState.person2].forEach((person, i) => {
          const type = getCategory("character")?.items.find(
            (x) => x.value === person.type,
          )?.label;
          if (type) groups["人物"].push(`人物${i + 1}：${type}`);
          if (person.reference) groups["人物"].push(`人物${i + 1}：参考画像`);
        });
        const relation = pairRelationOptions.find(([value]) => value === pairState.relation);
        if (relation?.[1]) groups["人物"].push(relation[1]);
      }

      Object.entries(compositionState).forEach(([k, v]) => {
        if (v && compositionOptions[k]?.[v]?.label) groups["画面設定"].push(compositionOptions[k]?.[v]?.label);
      });
      if (selectedRatio) {
        const ratioCat = getCategory("ratio");
        const ratioItem = ratioCat?.items.find((i) => i.value === selectedRatio);
        if (ratioItem) groups["画面設定"].push(ratioItem.label);
      }
      return groups;
    }

    function updateVisualBlueprint() {
      const sections = document.getElementById("blueprint-sections");
      const impression = document.getElementById("blueprint-impression");
      const triggerMeta = document.getElementById("blueprint-trigger-meta");
      if (!sections) return;
      const groups = getBlueprintSelections();
      const title = document.getElementById("novel-title")?.value.trim() || "";
      const all = Object.values(groups).flat();
      const subject =
        groups["人物"][0] || groups["世界・風景"][0] || "まだ主役未設定";
      const scene = groups["世界・風景"].slice(0, 2).join(" / ");
      const feeling = groups["感情・心象"].slice(0, 2).join(" / ");
      const motifText = groups["象徴・モチーフ"]?.slice(0, 2).join(" / ") || "";
      const sentence = [
        title ? `「${title}」：` : "",
        `${subject}を中心に`,
        scene ? `${scene}で` : "",
        feeling ? `${feeling}の空気を描く。` : "一枚の画として組み立てる。",
        motifText ? `モチーフ／印象：${motifText}` : "",
      ]
        .join("")
        .replace(/中心にで/g, "中心に")
        .trim();
      if (impression)
        impression.textContent = all.length
          ? sentence
          : "まだ設定がない。タグを選ぶと、ここに一枚の設計図ができていく。";
      sections.innerHTML = Object.entries(groups)
        .map(
          ([name, items]) =>
            `<section class="blueprint-section"><div class="blueprint-section-title">${escapeHtml(name)}</div><div class="blueprint-items">${items.length ? items.map((x) => `<span class="blueprint-chip">${escapeHtml(x)}</span>`).join("") : '<span class="blueprint-empty">未設定</span>'}</div></section>`,
        )
        .join("");
      if (triggerMeta)
        triggerMeta.textContent = all.length
          ? `${all.length}項目を設定中`
          : "まだ設定なし";
    }

    function updateSummary() {
      updateVisualBlueprint();
      const chips = document.getElementById("summary-chips");
      if (!chips) return;
      const title = document.getElementById("novel-title").value.trim();
      const noText = document.getElementById("no-text-check").checked;
      const purpose =
        document.getElementById("output-purpose").selectedOptions[0]?.textContent ||
        "";
      const modeNames = {
        character: "人物中心",
        landscape: "世界・風景中心",
        abstract: "感情・概念中心",
        all: "詳細設定",
      };


      const methodNames = {
        free: "自由設計",
        preset: "プリセット",
        omakase: "AIおまかせ",
        "from-text": "本文から",
      };
      const sceneText = document.getElementById("scene-text")?.value.trim() || "";
      const values = [
        modeNames[currentMode],
        methodNames[designMethod] || "",
        designMethod === "from-text" && sceneText ? "本文から場面を抽出" : "",
        purpose,
        noText ? "画像内の文字なし" : "",
        title ? `作品：${title}` : "",
        ...Object.entries(compositionState)
          .filter(([, v]) => v)
          .map(([k, v]) => compositionOptions[k]?.[v]?.label),
        ...getSelectedCategoryItems()
          .map(({ item }) => cleanTagLabel(item.label))
          .slice(0, 12),
      ].filter(Boolean);
      chips.innerHTML = values.length
        ? values
          .map((v) => `<span class="summary-chip">${escapeHtml(v)}</span>`)
          .join("")
        : '<span class="summary-empty">まだ設定がない。上から少しずつ決めてみよう。</span>';

      const workFields = [title, purpose, noText ? "文字なし" : ""].filter(
        Boolean,
      ).length;
      const workPct = Math.round((workFields / 3) * 100);
      const visualCount =
        selectedTags.size +
        (selectedRatio ? 1 : 0) +
        Object.values(compositionState).filter(Boolean).length;
      const visualPct = Math.min(100, Math.round((visualCount / 8) * 100));
      document.getElementById("progress-work").textContent = workPct + "%";
      document.getElementById("progress-work-bar").style.width = workPct + "%";
      document.getElementById("progress-visual").textContent = visualPct + "%";
      document.getElementById("progress-visual-bar").style.width = visualPct + "%";
    }

    // ── ユーティリティ ──
    function cleanTagLabel(label) {
      return String(label || "").replace(/^\[AI\]\s*/, "");
    }

    function escapeHtml(str) {
      return str.replace(
        /[&<>\"]/g,
        (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" })[ch],
      );
    }

    async function copyText(elementId) {
      const target = document.getElementById(elementId);
      if (!target) return;
      const text = target.textContent || "";
      if (!text) return;

      // スマホやローカルHTMLでは Clipboard API が使えない場合があるため、
      // まず標準APIを試し、失敗したら textarea 経由でフォールバックする。
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          alert("クリップボードにコピーした");
          return;
        }
      } catch (error) {
        // フォールバックへ
      }

      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch (error) {
        copied = false;
      }
      textarea.remove();

      alert(copied ? "クリップボードにコピーした" : "コピーできなかった。JSONを長押ししてコピーしてね");
    }

    // ── 文字なしモード同期 ──
    function syncNoTextMode() {
      const noText = document.getElementById("no-text-check");
      const titleCheck = document.getElementById("include-title-check");
      const catchCheck = document.getElementById("include-catchphrase-check");
      if (!noText || !titleCheck || !catchCheck) return;

      const disabled = !!noText.checked;
      titleCheck.disabled = disabled;
      catchCheck.disabled = disabled;

      const titleLabel = titleCheck.closest(".checkbox-label");
      const catchLabel = catchCheck.closest(".checkbox-label");
      titleLabel?.classList.toggle("is-disabled", disabled);
      catchLabel?.classList.toggle("is-disabled", disabled);
      titleLabel?.setAttribute("aria-disabled", String(disabled));
      catchLabel?.setAttribute("aria-disabled", String(disabled));

      if (disabled) {
        titleCheck.checked = false;
        catchCheck.checked = false;
        removeCategoryTags(["text-style"]);
      }

      renderTextStyleControl();
      if (!disabled) {
        document.querySelectorAll("#work-text-style .tag-btn").forEach((btn) => {
          btn.disabled = false;
        });
        document.getElementById("work-text-style")?.classList.remove("is-disabled");
      }
      updateWorkflowGuide();
    }

    // ── 初期化処理 ──
    [
      "novel-title",
      "catchphrase",
      "work-avoid",
      "output-purpose",
      "include-title-check",
      "include-catchphrase-check",
      "no-text-check",
      "scene-text",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", updateOutput);
      el.addEventListener("change", updateOutput);
    });
    document.getElementById("no-text-check").addEventListener("change", () => {
      syncNoTextMode();
      updateOutput();
    });
    syncNoTextMode();
    renderGenrePresets();
    renderPresets();
    showStep(1);
    buildUI();

