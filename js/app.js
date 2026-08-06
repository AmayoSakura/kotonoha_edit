window.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const tabButtons = document.querySelectorAll(".editor-tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));
      this.classList.add("active");
      const target = document.getElementById(this.dataset.target);
      if (target) target.classList.add("active");
    });
  });

  const CONFIG_KEYS = {
    pageTitle: "title",
    pageHeader: "header",
    headerDisplaySelect: "headerDisplay",
    headerPosSelect: "headerPos",
    headerSizeSelect: "headerSize",
    fontSelect: "font",
    customFontUrl: "customFontUrl",
    customFontFamily: "customFontFamily",
    pageSizeSelect: "pageSize",
    columnSelect: "column",
    fontSizeSelect: "fontSize",
    marginSelect: "margin",
    marginVInput: "marginV",
    marginHInput: "marginH",
    gutterSelect: "gutter",
    gutterWidthInput: "gutterWidth",
    themeSelect: "theme",
    sourceText: "text",
    columnRuleSelect: "columnRule",
    nombreDisplaySelect: "nombreDisplay",
    nombreFormatSelect: "nombreFormat",
    startPageInput: "startPage",
    nombrePosSelect: "nombrePos",
  };

  const els = {};
  Object.keys(CONFIG_KEYS).forEach((id) => {
    els[id] = document.getElementById(id);
  });

  const customFontRow = document.getElementById("customFontRow");
  const customMarginRow = document.getElementById("customMarginRow");
  const gutterWidthRow = document.getElementById("gutterWidthRow");
  const columnRuleCol = document.getElementById("columnRuleCol");
  const charCount = document.getElementById("charCount");
  const pagesContainer = document.getElementById("pagesContainer");
  const previewViewport = document.getElementById("previewViewport");
  const pageSizeStyle = document.getElementById("page-size-style");
  const fileInput = document.getElementById("fileInput");

  const nextPageBtn = document.getElementById("nextPageBtn");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const pageNavStatus = document.getElementById("pageNavStatus");
  const firstPageBtn = document.getElementById("firstPageBtn");
  const lastPageBtn = document.getElementById("lastPageBtn");
  const pageJumpInput = document.getElementById("pageJumpInput");

  const STORAGE_KEY = "md_vertical_editor_draft_v09_" + location.pathname;
  let debounceTimer = null;
  let computedPagesData = [];
  let currentPageIndex = 0;

  // スマホ幅（.pages-containerが縦積みレイアウトに切り替わる
  // @media (max-width: 1100px) と同じブレークポイント）では、
  // 見開き2ページ表示だと1ページあたりが小さくなりすぎて
  // 視認性が悪いため、1ページ表示に切り替える。
  const mobileLayoutQuery = window.matchMedia("(max-width: 1100px)");
  function getPagesPerView() {
    return mobileLayoutQuery.matches ? 1 : 2;
  }
  // 画面幅が変わった（ウィンドウリサイズ、スマホの画面回転等）際に、
  // 表示ページ数の基準も切り替わるよう再描画する。
  mobileLayoutQuery.addEventListener("change", function () {
    // 奇数ページを起点にしていた場合、2ページ表示に戻ったときの
    // 見開き基準（偶数開始）とズレないよう、renderCurrentPages側の
    // 補正ロジックに委ねる。
    renderCurrentPages();
  });

  // ==== 本の見開き表示ルール ====
  // ページ番号（1始まり）で「1ページ目は単独、2ページ目以降は
  // 偶数始まりのペア（2-3, 4-5, 6-7…）」という、実際の書籍の
  // 見開き（表紙をめくった直後は右ページ単独、以降は左右セット）
  // に合わせた表示ルール。0始まりのpageIndexで計算する：
  //   pageIndex=0        → 単独（1ページ目のみ）
  //   pageIndex=1,2       → ペア（2-3ページ目）
  //   pageIndex=3,4       → ペア（4-5ページ目）
  // 一般化すると、pageIndex>=1のとき、そのpageIndexが属する見開きの
  // 開始indexは「奇数なら自分自身、偶数ならその1つ前」。

  // pageIndex（0始まり）が属する見開きの開始indexを返す。
  // pagesPerViewが1（モバイル）のときは常に自分自身（1ページ単独）。
  function getSpreadStartIndex(pageIndex, pagesPerView) {
    if (pagesPerView !== 2) return pageIndex;
    if (pageIndex <= 0) return 0;
    // pageIndex=1,2 → 1 / pageIndex=3,4 → 3 / pageIndex=5,6 → 5 ...
    return pageIndex % 2 === 1 ? pageIndex : pageIndex - 1;
  }

  // startIndex（見開きの開始index）から、その見開きに含まれる
  // ページ数（1 or 2）を返す。総ページ数totalの都合で2枚目が
  // 存在しない場合は1を返す。
  function getSpreadPageCount(startIndex, total, pagesPerView) {
    if (pagesPerView !== 2) return 1;
    if (startIndex === 0) return 1; // 1ページ目は常に単独
    const remaining = total - startIndex;
    return Math.min(2, Math.max(1, remaining));
  }

  // startIndexの見開きから「次の見開き」の開始indexを返す。
  // 総ページ数を超える場合はnullを返す（呼び出し側で「これ以上進めない」と判断）。
  function getNextSpreadStartIndex(startIndex, total, pagesPerView) {
    if (pagesPerView !== 2) {
      return startIndex + 1 < total ? startIndex + 1 : null;
    }
    const count = getSpreadPageCount(startIndex, total, pagesPerView);
    const next = startIndex + count;
    return next < total ? next : null;
  }

  // startIndexの見開きから「前の見開き」の開始indexを返す。
  // 1ページ目より前は存在しないためnullを返す。
  function getPrevSpreadStartIndex(startIndex, total, pagesPerView) {
    if (pagesPerView !== 2) {
      return startIndex - 1 >= 0 ? startIndex - 1 : null;
    }
    if (startIndex <= 0) return null;
    // 現在の見開き開始indexより前にある見開きの開始indexを計算する。
    // startIndex=1（2-3ページ目）の前は0（1ページ目単独）。
    // startIndex=3（4-5ページ目）の前は1（2-3ページ目）。
    if (startIndex === 1) return 0;
    return startIndex - 2;
  }

  // 任意のpageIndexを、その見開きの開始indexに正規化する
  // （現在の総ページ数totalとpagesPerViewを踏まえて範囲内に収める）。
  function normalizeSpreadStartIndex(pageIndex, total, pagesPerView) {
    if (total <= 0) return 0;
    const clamped = Math.min(Math.max(pageIndex, 0), total - 1);
    return getSpreadStartIndex(clamped, pagesPerView);
  }

  const PAGE_SIZES_MM = {
    A4: { w: 210, h: 297 },
    B5: { w: 182, h: 257 },
    A5: { w: 148, h: 210 },
    B6: { w: 128, h: 182 },
    A6: { w: 105, h: 148 },
    Hagaki: { w: 100, h: 148 },
  };

  const MARGIN_SIZES_MM = {
    narrow: { v: 12, h: 10 },
    normal: { v: 18, h: 14 },
    wide: { v: 24, h: 18 },
  };

  const FONTS = {
    shippori: '"Shippori Mincho", "Yu Mincho", "MS Mincho", serif',
    noto: '"Noto Serif JP", "Yu Mincho", "MS Mincho", serif',
    sawarabi: '"Sawarabi Mincho", "Yu Mincho", "MS Mincho", serif',
    system: '"Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif',
  };

  const KINSOKU_HEAD =
    /[、。，．・：；？！?!ーぁぃぅぇぉっゃゅょゎァィUェォッャュョヮヶゝゞ」』】）〕〉》”’]/;
  const KINSOKU_TAIL = /[「『（【〔〈“‘]/;

  function isKinsokuHead(ch) {
    return ch ? KINSOKU_HEAD.test(ch) : false;
  }

  function isKinsokuTail(ch) {
    return ch ? KINSOKU_TAIL.test(ch) : false;
  }

  function mmToPx(mm) {
    return mm * 3.7795275591;
  }
  function ptToPx(pt) {
    return parseFloat(pt) * 1.3333333333;
  }

  // 余白（上下・左右）を mm 単位で取得する。
  // 「カスタム」選択時は marginVInput / marginHInput の数値を使い、
  // それ以外（narrow/normal/wide）は MARGIN_SIZES_MM のプリセット値を使う。
  // カスタム値が未入力・不正（NaN、負数）な場合は "normal" にフォールバックする。
  function getCurrentMarginMm() {
    if (els.marginSelect && els.marginSelect.value === "custom") {
      const v = parseFloat(els.marginVInput && els.marginVInput.value);
      const h = parseFloat(els.marginHInput && els.marginHInput.value);
      const fallback = MARGIN_SIZES_MM["normal"];
      return {
        v: Number.isFinite(v) && v >= 0 ? v : fallback.v,
        h: Number.isFinite(h) && h >= 0 ? h : fallback.h,
      };
    }
    return (
      MARGIN_SIZES_MM[els.marginSelect && els.marginSelect.value] ||
      MARGIN_SIZES_MM["normal"]
    );
  }

  // 綴じ代（のど）幅を mm 単位で取得する。
  // 「綴じ代：あり」でなければ 0（=綴じ代なし）。
  // 数値が未入力・不正な場合はデフォルトの 6mm にフォールバックする。
  const GUTTER_WIDTH_DEFAULT_MM = 6;
  function getCurrentGutterWidthMm() {
    const isGutterOn = els.gutterSelect && els.gutterSelect.value === "on";
    if (!isGutterOn) return 0;
    const w = parseFloat(els.gutterWidthInput && els.gutterWidthInput.value);
    return Number.isFinite(w) && w >= 0 ? w : GUTTER_WIDTH_DEFAULT_MM;
  }

  function saveToStorage() {
    const data = {};
    for (const [id, key] of Object.entries(CONFIG_KEYS)) {
      if (els[id]) data[key] = els[id].value;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      for (const [id, key] of Object.entries(CONFIG_KEYS)) {
        if (data[key] !== undefined && els[id]) els[id].value = data[key];
      }
      if (data.theme !== undefined && els.themeSelect) {
        els.themeSelect.value = data.theme;
        document.documentElement.setAttribute("data-theme", data.theme);
      }
      if (
        els.fontSelect &&
        els.fontSelect.value === "custom" &&
        customFontRow
      ) {
        customFontRow.style.display = "flex";
      }
      if (
        els.marginSelect &&
        els.marginSelect.value === "custom" &&
        customMarginRow
      ) {
        customMarginRow.style.display = "flex";
      }
      if (
        els.gutterSelect &&
        els.gutterSelect.value === "on" &&
        gutterWidthRow
      ) {
        gutterWidthRow.style.display = "flex";
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function updatePageCSSVariables() {
    const conf = PAGE_SIZES_MM[els.pageSizeSelect.value] || PAGE_SIZES_MM["A4"];
    const margin = getCurrentMarginMm();
    const gutterWidthMm = getCurrentGutterWidthMm();

    let selectedFont = FONTS[els.fontSelect.value];
    if (els.fontSelect.value === "custom") {
      selectedFont = els.customFontFamily.value.trim() || "serif";
      const url = els.customFontUrl.value.trim();
      // 入力値を検証せずに <link href> へ直接セットすると、
      // javascript: 等の不正なスキームや意図しない外部リソースの
      // 読み込みを許してしまう。https:// で始まる文字列のみ許可する。
      if (url && /^https:\/\/[^\s"'<>]+$/i.test(url)) {
        document.getElementById("dynamic-font-link").href = url;
      }
    }

    document.documentElement.style.setProperty("--paper-w", conf.w + "mm");
    document.documentElement.style.setProperty("--paper-h", conf.h + "mm");
    document.documentElement.style.setProperty(
      "--doc-font-size",
      els.fontSizeSelect.value,
    );
    document.documentElement.style.setProperty(
      "--doc-font-family",
      selectedFont,
    );
    document.documentElement.style.setProperty(
      "--page-padding-v",
      margin.v + "mm",
    );
    document.documentElement.style.setProperty(
      "--page-padding-h",
      margin.h + "mm",
    );
    document.documentElement.style.setProperty(
      "--gutter-width",
      gutterWidthMm + "mm",
    );

    if (pageSizeStyle) {
      pageSizeStyle.innerHTML = `@page { size: ${conf.w}mm ${conf.h}mm; margin: 0; }`;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function parseInlineVerticalMarkdown(text) {
    let value = escapeHtml(text);
    const codeBlocks = [];

    // 固定文字列のプレースホルダーだと、本文中に偶然同じ文字列が
    // 含まれていた場合（小説内でシステム的な説明文を書く等）に、
    // 意図しない置換・undefined展開が起きうる。呼び出しごとに
    // ユニークなプレフィックスを生成し、衝突の可能性を実質的に無くす。
    const placeholderPrefix =
      "___CODE_PH_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2) +
      "_";
    const placeholderFor = (idx) => placeholderPrefix + idx + "___";

    value = value.replace(/`([^`]+)`/g, function (match, code) {
      const idx = codeBlocks.length;
      codeBlocks.push('<code class="inline-code">' + code + "</code>");
      return placeholderFor(idx);
    });

    value = value.replace(
      /《《([^》\n]+)》》/g,
      '<span class="bouten">$1</span>',
    );
    value = value.replace(
      /[\|｜]([^《\n]+)《([^》\n]+)》/g,
      "<ruby>$1<rt>$2</rt></ruby>",
    );
    value = value.replace(
      /([一-龯]+)《([^》\n]+)》/g,
      "<ruby>$1<rt>$2</rt></ruby>",
    );

    value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    value = value.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    value = value.replace(
      /(!\?|\?!|!!|\?\?|！？|？！|！！|？？)/g,
      '<span class="tcy">$1</span>',
    );
    // \b（単語境界）を付けることで、レイアウト計算側(parseTextTokens)の
    // \b\d{1,2}\b と同じ基準に揃える。\bなしだと「1234567890」のような
    // 3桁以上の連続数字が「12」「34」「56」...と2桁ずつ縦中横化されてしまい、
    // JS側の計算（3桁以上は1文字ずつの通常文字として幅計算）と実描画が
    // 食い違って、実際の専有幅がズレる不具合があった。
    value = value.replace(/(\b\d{1,2}\b)/g, '<span class="tcy">$1</span>');
    value = value.replace(/(――+|……+|──+)/g, '<span class="nobreak">$1</span>');

    for (let idx = 0; idx < codeBlocks.length; idx++) {
      value = value.replace(placeholderFor(idx), codeBlocks[idx]);
    }

    return value;
  }

  function parseToAST(markdown) {
    const normalized = String(markdown).replace(/\r?\n/g, "\n");
    if (!normalized.trim()) return [];

    const rawSections = normalized.split(
      /(?:\n|^)\s*(?:\[改ページ\]|<!--\s*pagebreak\s*-->)\s*(?=\n|$)/i,
    );
    const sections = [];

    rawSections.forEach((sectionStr) => {
      const lines = sectionStr.split("\n");
      const items = [];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed === "") {
          items.push({ type: "empty" });
          return;
        }

        let align = null;
        let textToParse = trimmed;

        const centerMatch = textToParse.match(
          /^(?:\[(?:中央|center)\]|［(?:中央|center)］)\s*(.*)$/i,
        );
        const rightMatch = textToParse.match(
          /^(?:\[(?:右|right)\]|［(?:右|right)］)\s*(.*)$/i,
        );

        if (centerMatch) {
          align = "center";
          textToParse = centerMatch[1];
        } else if (rightMatch) {
          align = "right";
          textToParse = rightMatch[1];
        }

        const heading = textToParse.match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
          items.push({
            type: "heading",
            level: heading[1].length,
            text: heading[2].trim(),
            align: align,
          });
          return;
        }

        if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(textToParse)) {
          items.push({ type: "hr" });
          return;
        }

        const quote = textToParse.match(/^>\s?(.*)$/);
        if (quote) {
          items.push({ type: "quote", text: quote[1], align: align });
          return;
        }

        const isBracket = /^[「『（【〔〈《“‘]/.test(textToParse);
        items.push({ type: "p", isBracket, text: textToParse, align: align });
      });

      if (items.length > 0) sections.push(items);
    });

    return sections;
  }

  // 「」等の約物が連続する行で、Canvas実測（1文字ずつの字送り幅の単純合計）が
  // 実際のブラウザの縦書きカーニング（詰め）を反映できていない問題への対策。
  // 該当する行の候補文字列だけを、本番の .md-body p と同じCSS継承を持つ
  // 画面外の隠し要素に実際に流し込み、getBoundingClientRect().height で
  // 実測する。writing-mode: vertical-rl では height が「文字が積み上がる
  // 方向の専有量」を表すため、effectiveColHPx と直接比較できる値になる。
  // 全行に対して行うと再フローのコストが高いため、約物隣接がない大多数の
  // 行は従来の理論値のみで確定し、約物隣接を含む行だけこの実測で補正する
  // ハイブリッド方式にしている。
  let measureContainerEl = null;
  function getMeasureContainer() {
    if (measureContainerEl && document.body.contains(measureContainerEl)) {
      return measureContainerEl;
    }
    const wrapper = document.createElement("div");
    // position: fixed + 画面外座標で、画面には一切表示されないが
    // レイアウト計算（getBoundingClientRect）は正常に機能する。
    // display: none にすると計算自体が走らなくなるため使わない。
    wrapper.style.position = "fixed";
    wrapper.style.top = "-99999px";
    wrapper.style.left = "-99999px";
    wrapper.style.visibility = "hidden";
    wrapper.style.pointerEvents = "none";
    const article = document.createElement("article");
    article.className = "md-body";
    // .md-body は本来 width/height: 100% で親基準だが、測定用途では
    // 十分大きな固定値にして、意図しない折返しや高さ制限が
    // 測定結果に影響しないようにする。
    article.style.width = "2000px";
    article.style.height = "2000px";
    wrapper.appendChild(article);
    document.body.appendChild(wrapper);
    measureContainerEl = article;
    return measureContainerEl;
  }

  // 同じ候補文字列を何度も実測することがあるため（例えば同じ段落を
  // 再計算するたびに同じ切れ目候補が出てくる場合）、呼び出しをまたいで
  // 結果をキャッシュする。ただしフォント設定が変わるとキャッシュは
  // 無効になるため、computeLayoutWithCanvas 側で設定が変わるたびに
  // resetMeasureCache() を呼んでクリアする。
  let measureCache = new Map();
  function resetMeasureCache() {
    measureCache = new Map();
  }

  // candidateRaw（<p>に入れるべき生のHTML片、raw文字列をそのまま結合したもの）を
  // 実際にDOMへ描画し、専有する高さ(px)を実測する。
  // hasIndent は本番の <p> と同じ text-indent: 1em の有無を揃えるためのフラグ。
  function measureLineHeightPx(candidateRaw, hasIndent) {
    const cacheKey = (hasIndent ? "1|" : "0|") + candidateRaw;
    if (measureCache.has(cacheKey)) return measureCache.get(cacheKey);

    const container = getMeasureContainer();
    const p = document.createElement("p");
    if (!hasIndent) p.className = "no-indent";
    // parseInlineVerticalMarkdown は nobreak span化などを行うため、
    // 実際の描画パス（buildLinesHtml側）と同じ変換を通す。
    p.innerHTML = parseInlineVerticalMarkdown(candidateRaw);
    container.innerHTML = "";
    container.appendChild(p);
    const height = p.getBoundingClientRect().height;
    measureCache.set(cacheKey, height);
    return height;
  }

  // 文字幅測定用のCanvasは、computeLayoutWithCanvas が呼ばれるたびに
  // 都度生成すると無駄なDOM生成コストがかかる。モジュールレベルで
  // 1つだけ保持し、呼び出しをまたいで再利用する。
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  // 文字幅キャッシュも呼び出しをまたいで使い回す。ただしフォントや
  // フォントサイズが変わった場合は古いキャッシュ値が無効になるため、
  // キャッシュキーに現在のフォント設定を含めることで、設定が変われば
  // 自然に別キーとして扱われ、古い値を誤って使うことがないようにする。
  const charWidthCache = new Map();

  function computeLayoutWithCanvas(text) {
    // フォント・サイズ等の設定が変わった可能性があるため、
    // DOM実測のキャッシュ（measureLineHeightPx用）を都度クリアする。
    resetMeasureCache();

    const pageSize =
      PAGE_SIZES_MM[els.pageSizeSelect.value] || PAGE_SIZES_MM["A4"];
    const margin = getCurrentMarginMm();
    const fontSizePx = ptToPx(els.fontSizeSelect.value);
    const isTwoColumn = els.columnSelect.value === "2";
    const isGutterOn = els.gutterSelect && els.gutterSelect.value === "on";

    // 実際に描画される --doc-font-family を取得し、Canvas で文字幅を実測する。
    // これまでの「全角文字は常に fontSizePx(1文字=1em)固定」という概算計算では、
    // 「」などの約物がフォント側で持つ実際の字送り幅（Shippori Minchoのような
    // 縦書き専用フォントでは約物に固有のアキが設定されていることが多い）を
    // 反映できず、約物が連続する文章で実描画とのズレが蓄積する不具合があった。
    const docFontFamily =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--doc-font-family",
      ) || "serif";

    function measureCharWidth(ch, scale) {
      // フォントファミリーに加えてfontSizePx（絶対px値）もキーに含める。
      // scaleは相対倍率でしかないため、フォントサイズ設定自体が変わった
      // 場合、scaleとdocFontFamilyだけをキーにしていると、古いフォント
      // サイズでの測定結果（px単位の絶対値）を誤って使い回してしまう。
      const cacheKey =
        docFontFamily +
        "|" +
        fontSizePx.toFixed(2) +
        "|" +
        ch +
        "|" +
        scale.toFixed(4);
      if (charWidthCache.has(cacheKey)) return charWidthCache.get(cacheKey);
      measureCtx.font = (fontSizePx * scale).toFixed(2) + "px " + docFontFamily;
      const w = measureCtx.measureText(ch).width;
      charWidthCache.set(cacheKey, w);
      return w;
    }

    const paperHPx = mmToPx(pageSize.h);
    const paperWPx = mmToPx(pageSize.w);
    const marginVPx = mmToPx(margin.v);
    const marginHPx = mmToPx(margin.h);

    // .paper-page は box-sizing: border-box で padding: var(--page-padding-v) var(--page-padding-h)。
    // border は無いので、内側の実高さは「用紙の高さ - 上下padding」で理論値と一致する。
    const innerHPx = paperHPx - marginVPx * 2;

    let colHPx = innerHPx;
    if (isTwoColumn) {
      // CSS: .paper-page.has-columns .md-body { height: calc(50% - 3mm); }
      // 50% の基準は .columns-wrapper の height:100%（= innerHPx と同じ）。
      // column-divider の margin(2mm×2=4mm)+border(1px)は、
      // 2つの .md-body（合計 100% - 6mm）の残り 6mm 分に収まる設計のため、
      // ここで別途 divider 分を引く必要はない（二重引きになるため削除）。
      colHPx = innerHPx / 2 - mmToPx(3);
    }

    const gutterWidth = isGutterOn ? mmToPx(getCurrentGutterWidthMm()) : 0;
    const colWPx = paperWPx - marginHPx * 2 - gutterWidth;
    const lineSpacingPx = fontSizePx * 1.8;
    const maxLinesPerCol = Math.max(1, Math.floor(colWPx / lineSpacingPx));

    function getCharHeight(ch, fontScale = 1.0) {
      // 半角文字・英数字は text-orientation: mixed の影響で複数文字がまとめて
      // 横倒しなしで配置されるなど、Canvas実測（横書き前提のAPI）では
      // 正確に再現しきれない挙動があるため、従来の経験則(0.65倍)を維持する。
      if (/[a-zA-Z0-9\s]/.test(ch)) return fontSizePx * 0.65 * fontScale;
      // 全角文字（漢字・かな・約物含む）は Canvas で実際のフォントの字送り幅を測る。
      // 「」などの約物は、Shippori Minchoのような縦書き用フォントで固有のアキを
      // 持つことがあり、fontSizePx固定の概算では実描画とズレが蓄積していた。
      const measured = measureCharWidth(ch, fontScale);
      // 実測が0や異常値になるケース（フォント未読込等）へのフォールバック。
      if (!measured || !isFinite(measured) || measured <= 0) {
        return fontSizePx * fontScale;
      }
      return measured;
    }

    // .inline-code は font-size: 0.88em で本文より縮小して描画される。
    // 従来の計算はこの縮小率を無視して本文と同じ幅で見積もっていたため、
    // コードブロックを含む行で「実際より短く」見積もられ、はみ出し（文字切れ）の原因になっていた。
    const INLINE_CODE_FONT_SCALE = 0.88;
    // .inline-code の padding: 1px 4px のうち、縦書きで行送り方向に効くのは上下の 1px×2。
    // トークン単位で1回だけ加算する（文字ごとではなく、コード片全体で1回）。
    const INLINE_CODE_PADDING_PX = 2;

    function parseTextTokens(str) {
      const tokens = [];
      // fallback（最後の代替パターン）は1文字ずつマッチさせる。
      // 以前は [^...]+ で連続文字を貪欲に食っていたため、
      // 「色の空に、鳳凰《ほうおう》」のように平文の直後に自動判定ルビ
      // （｜なしの「漢字+《...》」パターン）が続く場合、
      // 手前の平文が「鳳凰」まで巻き込んでトークン化してしまい、
      // ルビが《の前後で分断される不具合があった。1文字ずつにすることで、
      // 毎文字ごとに改めてルビパターンとのマッチを試みられるようにする。
      //
      // また、fallback の文字クラスから \d（数字）を除外していたため、
      // 「1234567890」のような3桁以上の連続した数字は、\b\d{1,2}\b
      // （前後が数字でない1〜2桁の数字にのみマッチ）にも fallback にも
      // 拾われず、丸ごとトークンとして消滅する不具合があった。
      // \d を fallback から除外しないことで、1〜2桁の独立した数字は
      // 引き続き縦中横化パターンが優先的に拾い、3桁以上の連続数字は
      // fallback で1文字ずつ通常文字として表示されるようにする。
      //
      // 「――」「……」「──」（2文字以上連続）は、実描画側
      // （parseInlineVerticalMarkdown）が nobreak（white-space: nowrap）
      // で囲んで泣き別れ（行末・行頭での分断）を防いでいるが、
      // レイアウト計算側（このパターン）が1文字ずつしか拾えていなかったため、
      // 実際には行の途中で平気で改行位置が決まってしまい、nobreak が
      // 機能する保証がなかった。まとめて1トークンとして拾うグループを追加し、
      // splitTextToLines 側で isNobreak な1単位として扱うことで対応する。
      // 既存の isRuby（読み仮名考慮の幅計算）とは独立したフラグとして扱い、
      // ルビ側の仕様変更やこのnobreak側の調整が互いに波及しないようにする。
      const pattern =
        /(!\?|\?!|!!|\?\?|！？|？！|！！|！！|？？)|(\b\d{1,2}\b)|([\|｜][^《\n]+《[^》\n]+》)|([一-龯]+《[^》\n]+》)|(《《[^》\n]+》》)|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(`[^`]+`)|(―{2,}|…{2,}|─{2,})|([―…─])|([^\|｜《\*`!\?―…─])/g;
      let match;
      while ((match = pattern.exec(str)) !== null) {
        const raw = match[0];
        let display = raw;

        if (match[1] || match[2]) {
          display = "あ";
        } else if (raw.startsWith("《《") && raw.endsWith("》》")) {
          display = raw.slice(2, -2);
        } else if (raw.includes("《") && raw.endsWith("》")) {
          display = raw.replace(/[\|｜]/g, "").replace(/《[^》]+》/g, "");
        } else if (raw.startsWith("**") && raw.endsWith("**")) {
          display = raw.slice(2, -2);
        } else if (raw.startsWith("*") && raw.endsWith("*")) {
          display = raw.slice(1, -1);
        } else if (raw.startsWith("`") && raw.endsWith("`")) {
          display = raw.slice(1, -1);
        }
        tokens.push({ raw, display });
      }
      return tokens;
    }

    // 禁則分類（isKinsokuHead=行末に来る側の句読点・閉じ約物、
    // isKinsokuTail=行頭に来ない側の開き約物）を使って、
    // 確定候補の行 chars の中に「詰まりが起きうる約物隣接」が
    // 1箇所でも含まれているかを調べる。含まれない大多数の行は
    // 実測コストをかけず理論値のまま確定させるためのフィルタ。
    function hasKinsokuAdjacency(chars) {
      for (let k = 1; k < chars.length; k++) {
        const prev = chars[k - 1].display;
        const cur = chars[k].display;
        const prevLast = prev[prev.length - 1];
        const curFirst = cur[0];
        if (isKinsokuHead(prevLast) && isKinsokuTail(curFirst)) {
          return true;
        }
      }
      return false;
    }

    // 理論値ベースで一旦確定した行候補 chars について、約物隣接を
    // 含む場合のみDOM実測で「実際にはあと何文字入るか／逆にはみ出して
    // いないか」を検証し、収まる最大文字数まで chars を伸縮させる。
    // 戻り値は伸縮後の chars 配列。呼び出し側は、伸ばした/縮めた
    // 差分だけ charItems の走査位置 i を調整する。
    // fontScale は現時点では未使用（実測はDOM描画結果をそのまま使うため、
    // フォントスケールの違いはCSS側の描画に自動的に反映される）。
    // 将来、ルビや会話文などスケールの異なるトークンが絡む行の
    // 補正で使う可能性があるため、呼び出し元との引数構成を揃えて残している。
    function extendLineByMeasurement(
      chars,
      charItems,
      startIdx,
      hasIndent,
      effectiveColHPx,
      fontScale,
    ) {
      if (chars.length === 0 || !hasKinsokuAdjacency(chars)) {
        return { chars, consumedExtra: 0 };
      }

      let working = chars.slice();
      let idx = startIdx;
      let consumedExtra = 0;
      // 禁則違反回避のためだけに強制追加した回数。通常の文章では
      // 同じ約物が3連続以上禁則違反を引き起こすことはまず無いため、
      // 異常な入力（禁則対象文字の異常な連続）での無限追加を防ぐ
      // 安全弁として上限を設ける。
      let forcedAddCount = 0;
      const FORCED_ADD_LIMIT = 5;

      const rawOf = (arr) => arr.map((c) => c.raw).join("");

      // 「打ち止めても禁則違反にならないか」を判定する。
      // ①working末尾の文字が行末禁止（isKinsokuHead）でないこと、
      // ②次に来る予定の未消費トークン（＝もし打ち止めた場合、次行の
      //   先頭に来る文字）が「行頭に来てはいけない文字」でないこと、
      // の両方を満たして初めて、そこで行を終えてよい。
      // 「行頭に来てはいけない文字」には二種類ある：
      //   - isKinsokuHead側（句読点・閉じ約物・小書き文字等）：
      //     これらは行末には来られるが行頭には来られない文字。
      //   - isKinsokuTail側（開き約物）：
      //     これらは行頭には来られず、必ず次の文字と共に送られる文字。
      // 元の実装は isKinsokuTail のみを見ており、句読点・閉じ約物が
      // 実測補正で行頭に送られてしまう抜け穴があったため、
      // isKinsokuHead 側の判定を追加する。
      function isSafeStopPoint(arr, nextIdx) {
        if (arr.length === 0) return true;
        const lastItem = arr[arr.length - 1];
        const lastCh = lastItem.display[lastItem.display.length - 1];
        if (isKinsokuHead(lastCh) && arr.length > 1) return false;
        if (nextIdx < charItems.length) {
          const nextCh = charItems[nextIdx].display[0];
          if (isKinsokuHead(nextCh) && arr.length > 1) return false;
          if (isKinsokuTail(nextCh) && arr.length > 1) return false;
        }
        return true;
      }

      // 実測で収まる限りは、後続トークンを1つずつ足していく。
      // 収まらなくなった時点でも、そこで打ち止めると禁則違反になる
      // 場合は、違反が解消するまで追加を続ける（理論値ベースの
      // pushback処理と同じ考え方を、実測ループの中でも適用する）。
      //
      // 優先順位に注意：「実測で枠に収まるかどうか」より
      // 「ここで打ち止めても禁則違反にならないか」を優先する。
      // 元の実装は withinLimit を優先していたため、pushback処理で
      // 一度押し戻した句読点・閉じ約物が、実測では枠に収まってしまう
      // ケースで再び取り込まれてしまい、結果的に句読点が行頭に
      // 来てしまう不具合があった（呼び出し元でpushback済みの
      // currentChars を渡してくる文脈で顕著）。
      // 安全な打ち止め点にいったん到達したら、たとえ実測でまだ
      // 余裕があっても追加を止める。
      while (idx < charItems.length) {
        const currentStopIsSafe = isSafeStopPoint(working, idx);
        if (currentStopIsSafe) {
          break;
        }

        const nextItem = charItems[idx];
        const candidate = working.concat([nextItem]);
        const measured = measureLineHeightPx(rawOf(candidate), hasIndent);
        const withinLimit = measured <= effectiveColHPx;

        if (withinLimit || forcedAddCount < FORCED_ADD_LIMIT) {
          // 枠に収まっている、または禁則違反回避のためやむを得ず
          // 追加する場合は、次のトークンを足して続行する。
          working = candidate;
          idx++;
          consumedExtra++;
          if (!withinLimit) forcedAddCount++;
          if (window.DEBUG_LAYOUT) {
            console.log(
              "[MEASURE:extend]",
              JSON.stringify(rawOf(working)),
              "measured=",
              measured.toFixed(1),
              "/ effectiveColHPx=",
              effectiveColHPx.toFixed(1),
              withinLimit ? "" : "(禁則違反回避のため許容超過)",
            );
          }
        } else {
          break;
        }
      }

      // 理論値では収まる想定だったのに実測でオーバーしていた場合の保険。
      // Canvas実測とDOM実測の丸め誤差等でごく稀に起こりうるケースに備える。
      while (working.length > 1) {
        const measured = measureLineHeightPx(rawOf(working), hasIndent);
        if (measured <= effectiveColHPx) break;
        working = working.slice(0, -1);
        consumedExtra--;
        if (window.DEBUG_LAYOUT) {
          console.log(
            "[MEASURE:shrink]",
            JSON.stringify(rawOf(working)),
            "measured=",
            measured.toFixed(1),
            "/ effectiveColHPx=",
            effectiveColHPx.toFixed(1),
          );
        }
      }

      return { chars: working, consumedExtra };
    }

    function splitTextToLines(rawText, fontScale = 1.0, hasIndent = false) {
      const tokens = parseTextTokens(rawText);
      const charItems = [];

      tokens.forEach((tok) => {
        const isSplittable =
          (tok.raw.startsWith("**") && tok.raw.endsWith("**")) ||
          (tok.raw.startsWith("*") &&
            tok.raw.endsWith("*") &&
            !tok.raw.startsWith("**")) ||
          (tok.raw.startsWith("《《") && tok.raw.endsWith("》》")) ||
          (tok.raw.startsWith("`") && tok.raw.endsWith("`"));

        // 「――」「……」「──」（2文字以上連続）は display === raw
        // （変換不要）だが、行の途中で分断されないよう isAtomic 扱いに
        // したいトークン。raw !== display という既存の判定だけでは
        // 拾えないため、文字種のみで別途判定する。
        // isRuby とは独立したフラグとして扱い、互いの計算ロジックが
        // 影響し合わないようにする。
        const isNobreak = tok.raw.length >= 2 && /^(―+|…+|─+)$/.test(tok.raw);

        if ((tok.raw !== tok.display || isNobreak) && !isSplittable) {
          const isRuby =
            tok.raw.includes("《") &&
            tok.raw.endsWith("》") &&
            !tok.raw.startsWith("《《");
          charItems.push({
            raw: tok.raw,
            display: tok.display,
            isAtomic: true,
            isRuby: isRuby,
            isNobreak: isNobreak,
          });
        } else {
          let prefix = "";
          let suffix = "";
          let text = tok.raw;
          let isCode = false;

          if (text.startsWith("**") && text.endsWith("**")) {
            prefix = "**";
            suffix = "**";
            text = text.slice(2, -2);
          } else if (text.startsWith("*") && text.endsWith("*")) {
            prefix = "*";
            suffix = "*";
            text = text.slice(1, -1);
          } else if (text.startsWith("`") && text.endsWith("`")) {
            prefix = "`";
            suffix = "`";
            text = text.slice(1, -1);
            isCode = true;
          } else if (text.startsWith("《《") && text.endsWith("》》")) {
            prefix = "《《";
            suffix = "》》";
            text = text.slice(2, -2);
          }

          for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            charItems.push({
              raw: prefix ? prefix + ch + suffix : ch,
              display: ch,
              isAtomic: false,
              // コードブロックの1文字目にのみ isCodeStart を立て、
              // padding分の加算をトークンごとに1回だけ行えるようにする。
              isCode: isCode,
              isCodeStart: isCode && i === 0,
            });
          }
        }
      });

      const lines = [];
      let currentRaw = "";
      let currentH = 0;
      let currentChars = [];

      // 段落の1行目には CSS の text-indent: 1em が入るため、
      // 実際に文字を置ける幅は colHPx より 1em（fontSizePx * fontScale）分狭い。
      // これを考慮せずに colHPx いっぱいまで詰め込むと、1行目だけ実際の描画で
      // 最後の1文字がインデント分に押し出されてはみ出し、画面から消えて見える不具合があった。
      const indentPx = hasIndent ? fontSizePx * fontScale : 0;

      for (let i = 0; i < charItems.length; i++) {
        const item = charItems[i];
        // 現在組み立て中の行が段落の1行目かどうか（まだ1行も確定していない = lines.length === 0）。
        const effectiveColHPx =
          hasIndent && lines.length === 0 ? colHPx - indentPx : colHPx;
        let itemH = 0;
        if (item.isCode) {
          // .inline-code は font-size: 0.88em で描画されるため、通常文字と同じ幅計算では
          // 実際より大きく（=行に多く収まると）見積もられ、はみ出しの原因になる。
          for (let c = 0; c < item.display.length; c++) {
            itemH += getCharHeight(
              item.display[c],
              fontScale * INLINE_CODE_FONT_SCALE,
            );
          }
          // padding: 1px 4px の上下1px×2分を、コード片の先頭文字のみ1回加算する。
          if (item.isCodeStart) {
            itemH += INLINE_CODE_PADDING_PX;
          }
        } else if (item.isRuby) {
          // ルビ付き文字の幅計算。
          // 過去に「読み仮名の分の余裕」として RUBY_EXTRA_SCALE(1.15) を掛けていたが、
          // CSS側の line-height: 1.8 に既にルビを収める余裕が織り込まれている可能性が高く、
          // 追加の倍率は二重計上となって早期改行（本来入るはずの文字数より少なく見積もる）
          // を引き起こしていたため撤去。対象文字数分の基本幅のみで計算する。
          for (let c = 0; c < item.display.length; c++) {
            itemH += getCharHeight(item.display[c], fontScale);
          }
        } else if (item.isNobreak) {
          // 「――」「……」等の泣き別れ防止トークン。
          // 特殊な倍率は不要で、構成文字の基本幅の合計のみで計算する
          // （isRuby分岐と式は同一だが、ルビ側の将来の仕様変更が
          // こちらに波及しないよう、フラグと分岐を独立させている）。
          for (let c = 0; c < item.display.length; c++) {
            itemH += getCharHeight(item.display[c], fontScale);
          }
        } else {
          for (let c = 0; c < item.display.length; c++) {
            itemH += getCharHeight(item.display[c], fontScale);
          }
        }

        // 直前文字が「行末に来る側」（句読点・閉じ約物）、かつ
        // 現在の文字（トークンの先頭1文字）が「行頭に来ない側」
        // （開き約物）の組み合わせのときは、行確定時にDOM実測で
        // 補正する（measureAndExtendLine 参照）。ここでは理論値の
        // ままitemHを積み上げ、「切れ目候補」を出すだけに留める。

        if (window.DEBUG_LAYOUT) {
          console.log(
            "[ITEM]",
            JSON.stringify(item.display),
            "raw=",
            JSON.stringify(item.raw),
            "isCode=",
            !!item.isCode,
            "isRuby=",
            !!item.isRuby,
            "isNobreak=",
            !!item.isNobreak,
            "itemH=",
            itemH.toFixed(2),
            "effectiveColHPx=",
            effectiveColHPx.toFixed(1),
          );
        }

        if (currentH + itemH > effectiveColHPx) {
          if (currentChars.length === 0) {
            currentRaw += item.raw;
            currentH += itemH;
            currentChars.push(item);
            lines.push(currentRaw);
            currentRaw = "";
            currentH = 0;
            currentChars = [];
            continue;
          }

          // はみ出した item（次に来るはずだった文字）が行頭禁止
          // （isKinsokuHead。句読点・閉じ約物・小書き文字など）なら、
          // currentChars の末尾を押し戻して次の行の先頭に回す。
          // ただし「ちょっと」の「ょ」「っ」のように行頭禁止文字が
          // 連続するケースでは、1文字だけ押し戻しても新しい行頭が
          // まだ行頭禁止のままということがあるため、行頭禁止が
          // 解消するまでループで押し戻す。
          // 押し戻しすぎて行が空になる事態を避けるため、
          // currentChars.length は常に1以上を維持する。
          let pushBackCount = 0;
          const nextChar = item.display[0];

          if (isKinsokuHead(nextChar) && currentChars.length > 1) {
            pushBackCount = 1;
            // 押し戻した範囲の先頭文字（＝次の行の先頭になる文字）が
            // まだ行頭禁止なら、解消するまでさらに押し戻す。
            // currentChars[currentChars.length - pushBackCount] が
            // 「押し戻される文字列の中で最初に来る（＝次の行頭になる）文字」。
            while (pushBackCount < currentChars.length) {
              const candidateItem =
                currentChars[currentChars.length - pushBackCount];
              const candidateCh = candidateItem.display[0];
              if (!isKinsokuHead(candidateCh)) break;
              pushBackCount++;
            }
          }

          const lastItem = currentChars[currentChars.length - 1];
          // display が複数文字（isNobreak トークンの「――」等）の場合でも、
          // isKinsokuTail は1文字前提の判定のため、必ず末尾の1文字だけを渡す。
          // これを怠ると、display文字列全体が正規表現に渡され、
          // 本来は禁則対象でない文字列でも意図せずマッチしてしまう恐れがある。
          const lastChar = lastItem.display[lastItem.display.length - 1];
          if (isKinsokuTail(lastChar) && currentChars.length > 1) {
            pushBackCount = Math.max(pushBackCount, 1);
          }

          // 押し戻しの結果、行に1文字も残らなくなってしまう場合は、
          // 押し戻しを諦める。ただし、その場合でも「今のまま確定」
          // すると次の行の先頭が禁則違反のままになってしまうため、
          // 単純にpushBackCountを0にはせず、代わりに「はみ出した
          // item自体をこの行に強制的に含めて、まだ確定しない」形にする
          // （行頭禁止の連続よりは、多少のはみ出しの方が
          // 版面として綺麗という判断）。次のループで、追加後の新しい
          // itemに対して同じ超過判定が再度行われる。
          let forceIncludeOverflow = false;
          if (pushBackCount >= currentChars.length) {
            // 小書き文字等の禁則対象が異常に連続する場合の暴走防止。
            // 通常の日本語文章では起こり得ないが、理論値の高さが
            // 枠の3倍を超えてなお解消しない場合は、禁則より行の
            // 確定を優先する（諦めて現状のまま確定する）。
            if (currentH + itemH > effectiveColHPx * 3) {
              pushBackCount = 0;
            } else {
              pushBackCount = 0;
              forceIncludeOverflow = true;
            }
          }

          if (forceIncludeOverflow) {
            currentRaw += item.raw;
            currentH += itemH;
            currentChars.push(item);
            continue;
          }

          if (pushBackCount > 0) {
            const popped = currentChars.splice(
              currentChars.length - pushBackCount,
              pushBackCount,
            );
            i -= popped.length + 1;

            const result = extendLineByMeasurement(
              currentChars,
              charItems,
              i + 1,
              hasIndent && lines.length === 0,
              effectiveColHPx,
              fontScale,
            );
            currentChars = result.chars;
            i += result.consumedExtra;

            currentRaw = currentChars.map((c) => c.raw).join("");
            if (window.DEBUG_LAYOUT) {
              console.log(
                "[LINE:kinsoku]",
                JSON.stringify(currentRaw),
                "chars=",
                currentChars.length,
                "/ effectiveColHPx=",
                effectiveColHPx.toFixed(1),
              );
            }
            lines.push(currentRaw);

            currentRaw = "";
            currentH = 0;
            currentChars = [];
            continue;
          } else {
            const result = extendLineByMeasurement(
              currentChars,
              charItems,
              i,
              hasIndent && lines.length === 0,
              effectiveColHPx,
              fontScale,
            );
            currentChars = result.chars;
            i += result.consumedExtra;
            currentRaw = currentChars.map((c) => c.raw).join("");

            if (window.DEBUG_LAYOUT) {
              console.log(
                "[LINE]",
                JSON.stringify(currentRaw),
                "chars=",
                currentChars.length,
                "/ effectiveColHPx=",
                effectiveColHPx.toFixed(1),
              );
            }
            lines.push(currentRaw);
            currentRaw = "";
            currentH = 0;
            currentChars = [];
            i--;
            continue;
          }
        }

        currentRaw += item.raw;
        currentH += itemH;
        currentChars.push(item);
      }

      if (currentRaw.length > 0) {
        lines.push(currentRaw);
      }

      return lines;
    }

    const sections = parseToAST(text);
    const pages = [];

    let currentPage = { pageIdx: 0, col1: [], col2: [] };
    let currentColIdx = 0;
    let currentLines = currentPage.col1;
    let currentLineWidth = 0;

    function addLineToPage(lineObj, widthCost = 1) {
      if (
        currentLineWidth + widthCost > maxLinesPerCol &&
        currentLines.length > 0
      ) {
        if (isTwoColumn && currentColIdx === 0) {
          currentColIdx = 1;
          currentLines = currentPage.col2;
          currentLineWidth = 0;
        } else {
          pages.push(currentPage);
          currentPage = { pageIdx: pages.length, col1: [], col2: [] };
          currentColIdx = 0;
          currentLines = currentPage.col1;
          currentLineWidth = 0;
        }
      }
      currentLines.push(lineObj);
      currentLineWidth += widthCost;
    }

    sections.forEach((items, sectionIdx) => {
      if (
        sectionIdx > 0 &&
        (currentPage.col1.length > 0 || currentPage.col2.length > 0)
      ) {
        pages.push(currentPage);
        currentPage = { pageIdx: pages.length, col1: [], col2: [] };
        currentColIdx = 0;
        currentLines = currentPage.col1;
        currentLineWidth = 0;
      }

      items.forEach((item) => {
        if (item.type === "empty") {
          addLineToPage({ type: "empty" }, 1);
        } else if (item.type === "heading") {
          const scales = { 1: 1.8, 2: 1.3, 3: 1.1 };
          const costs = { 1: 2.5, 2: 1.8, 3: 1.4 };
          const scale = scales[item.level] || 1.0;
          const cost = costs[item.level] || 1.2;

          const hLines = splitTextToLines(item.text, scale);
          hLines.forEach((hLine) => {
            addLineToPage(
              {
                type: "heading",
                level: item.level,
                text: hLine,
                align: item.align,
              },
              cost,
            );
          });
        } else if (item.type === "hr") {
          addLineToPage({ type: "hr" }, 1);
        } else if (item.type === "quote") {
          const qLines = splitTextToLines(item.text, 0.95);
          qLines.forEach((qLine, qIdx) => {
            addLineToPage(
              {
                type: "quote",
                text: qLine,
                align: item.align,
                isContinuation: qIdx > 0,
              },
              1.25,
            );
          });
        } else if (item.type === "p") {
          // CSSでは isBracket または align 指定がある段落は no-indent（インデント無し）になるため、
          // 1行目の幅計算でインデント分を差し引く対象もそれに合わせる。
          const pHasIndent = !item.isBracket && !item.align;
          const pLines = splitTextToLines(item.text, 1.0, pHasIndent);
          pLines.forEach((pLine, idx) => {
            addLineToPage(
              {
                type: "p",
                text: pLine,
                isBracket: item.isBracket,
                isIndent: idx === 0 && !item.isBracket && !item.align,
                align: item.align,
              },
              1,
            );
          });
        }
      });
    });

    if (currentPage.col1.length > 0 || currentPage.col2.length > 0) {
      pages.push(currentPage);
    }

    return pages;
  }

  function buildLinesHtml(lines) {
    if (!lines || lines.length === 0) return "";
    let html = "";
    let i = 0;

    while (i < lines.length) {
      const item = lines[i];
      const alignClass = item.align ? ` align-${item.align}` : "";

      if (item.type === "quote") {
        const quoteItems = [];
        const align = item.align;
        while (
          i < lines.length &&
          lines[i].type === "quote" &&
          lines[i].align === align
        ) {
          quoteItems.push(lines[i]);
          i++;
        }

        let combinedText = "";
        quoteItems.forEach((qi, idx) => {
          const parsed = parseInlineVerticalMarkdown(qi.text);
          if (idx === 0) {
            combinedText += parsed;
          } else {
            combinedText += "<br />" + parsed;
          }
        });

        const clsAttr = align ? ` class="align-${align}"` : "";
        html += `<blockquote${clsAttr}>${combinedText}</blockquote>`;
      } else {
        if (item.type === "empty") {
          html += '<p class="no-indent">&nbsp;</p>';
        } else if (item.type === "heading") {
          const clsAttr = alignClass ? ` class="${alignClass.trim()}"` : "";
          html += `<h${item.level}${clsAttr}>${parseInlineVerticalMarkdown(item.text)}</h${item.level}>`;
        } else if (item.type === "hr") {
          html += "<hr />";
        } else if (item.type === "p") {
          const classes = [];
          if (!item.isIndent || item.align) classes.push("no-indent");
          if (item.align) classes.push(`align-${item.align}`);

          const classAttr =
            classes.length > 0 ? ` class="${classes.join(" ")}"` : "";
          html += `<p${classAttr}>${parseInlineVerticalMarkdown(item.text)}</p>`;
        }
        i++;
      }
    }
    return html;
  }

  function renderPageDom(pageEl, pageIdx) {
    const pageData = computedPagesData[pageIdx];
    if (!pageData) return;

    const isTwoColumn = els.columnSelect.value === "2";
    const isGutterOn = els.gutterSelect && els.gutterSelect.value === "on";
    const startPageNum =
      parseInt(els.startPageInput ? els.startPageInput.value : 1, 10) || 1;
    const pageNum = pageIdx + startPageNum;
    const isOdd = (pageIdx + 1) % 2 !== 0;

    let gutterClass = "";
    if (isGutterOn) gutterClass = isOdd ? " gutter-odd" : " gutter-even";

    pageEl.className =
      "paper-page" + (isTwoColumn ? " has-columns" : "") + gutterClass;

    const headerText = els.pageHeader.value.trim();
    const displayVal = els.headerDisplaySelect.value;
    const posVal = els.headerPosSelect.value;
    const sizeVal = els.headerSizeSelect.value;

    let showHeader = false;
    if (headerText) {
      if (displayVal === "all" || displayVal === "alternate") showHeader = true;
      else if (displayVal === "odd" && isOdd) showHeader = true;
      else if (displayVal === "even" && !isOdd) showHeader = true;
    }

    let headerTagHtml = "";
    if (showHeader) {
      let currentPos = posVal;
      if (displayVal === "alternate") currentPos = isOdd ? "left" : "right";

      let posStyle = "";
      if (currentPos === "center")
        posStyle = "left: 50%; right: auto; transform: translateX(-50%);";
      else if (currentPos === "left")
        posStyle = "left: var(--page-padding-h); right: auto; transform: none;";
      else
        posStyle = "right: var(--page-padding-h); left: auto; transform: none;";

      headerTagHtml = `<div class="page-header-tag" style="font-size:${sizeVal}; ${posStyle}">${escapeHtml(headerText)}</div>`;
    }

    const showRule = els.columnRuleSelect
      ? els.columnRuleSelect.value === "on"
      : true;
    const dividerClass = showRule
      ? "column-divider"
      : "column-divider no-border";

    let bodyHtml = "";
    if (isTwoColumn) {
      bodyHtml =
        '<div class="columns-wrapper">' +
        `<article class="md-body col-top">${buildLinesHtml(pageData.col1)}</article>` +
        `<div class="${dividerClass}"></div>` +
        `<article class="md-body col-bottom">${buildLinesHtml(pageData.col2)}</article>` +
        "</div>";
    } else {
      bodyHtml = `<article class="md-body">${buildLinesHtml(pageData.col1)}</article>`;
    }

    const nombreVal = els.nombreDisplaySelect
      ? els.nombreDisplaySelect.value
      : "all";
    const nombreFormat = els.nombreFormatSelect
      ? els.nombreFormatSelect.value
      : "dash";
    const nombrePosVal = els.nombrePosSelect
      ? els.nombrePosSelect.value
      : "center";

    let nombreHtml = "";
    if (nombreVal === "all" || (nombreVal === "skip-first" && pageIdx > 0)) {
      let currentNombrePos = nombrePosVal;
      if (nombrePosVal === "alternate")
        currentNombrePos = isOdd ? "left" : "right";

      let nombrePosStyle = "";
      if (currentNombrePos === "right")
        nombrePosStyle =
          "right: var(--page-padding-h); left: auto; transform: none;";
      else if (currentNombrePos === "left")
        nombrePosStyle =
          "left: var(--page-padding-h); right: auto; transform: none;";
      else
        nombrePosStyle = "left: 50%; right: auto; transform: translateX(-50%);";

      let nombreText = `- ${pageNum} -`;
      if (nombreFormat === "p") {
        nombreText = `P.${pageNum}`;
      } else if (nombreFormat === "slash") {
        nombreText = `/ ${pageNum} /`;
      } else if (nombreFormat === "number") {
        nombreText = `${pageNum}`;
      }

      nombreHtml = `<div class="page-number-tag" style="${nombrePosStyle}">${nombreText}</div>`;
    }

    pageEl.innerHTML = headerTagHtml + bodyHtml + nombreHtml;
  }

  function fitPagesToViewport() {
    if (window.isPrinting) return;
    if (!previewViewport || !pagesContainer) return;

    pagesContainer.style.transform = "none";

    const pages = pagesContainer.querySelectorAll(".paper-page");
    if (pages.length === 0) return;

    const padding = 32;
    const availableW = previewViewport.clientWidth - padding;
    const availableH = previewViewport.clientHeight - padding;

    const containerW = pagesContainer.offsetWidth;
    const containerH = pagesContainer.offsetHeight;

    if (
      availableW <= 0 ||
      availableH <= 0 ||
      containerW <= 0 ||
      containerH <= 0
    )
      return;

    const scaleW = availableW / containerW;
    const scaleH = availableH / containerH;
    const scale = Math.min(1, scaleW, scaleH);

    if (scale < 0.999) {
      pagesContainer.style.transform = `scale(${scale})`;
      pagesContainer.style.transformOrigin = "center center";
    } else {
      pagesContainer.style.transform = "none";
    }
  }

  window.addEventListener("resize", fitPagesToViewport);

  function renderCurrentPages() {
    if (window.isPrinting) return;

    pagesContainer.innerHTML = "";
    pagesContainer.style.transform = "none";

    const total = computedPagesData.length;
    if (total === 0) {
      pagesContainer.innerHTML =
        '<div class="paper-page"><article class="md-body"><p style="color:#888;">ここに縦書きプレビューが表示されます。</p></article></div>';
      updatePageCounter();
      requestAnimationFrame(fitPagesToViewport);
      return;
    }

    const pagesPerView = getPagesPerView();

    // currentPageIndexを、現在の表示モード（見開き/単独）における
    // 見開き開始indexに正規化する。書籍の見開きルールでは、
    // 「1ページ目は単独、2ページ目以降は偶数始まりペア」となるため、
    // 単純な「偶数なら揃える」補正ではなく getSpreadStartIndex を使う。
    if (currentPageIndex >= total) {
      currentPageIndex = normalizeSpreadStartIndex(
        total - 1,
        total,
        pagesPerView,
      );
    } else {
      currentPageIndex = getSpreadStartIndex(currentPageIndex, pagesPerView);
    }

    const spreadCount = getSpreadPageCount(
      currentPageIndex,
      total,
      pagesPerView,
    );
    const endIdx = Math.min(currentPageIndex + spreadCount, total);
    for (let idx = currentPageIndex; idx < endIdx; idx++) {
      const pageEl = document.createElement("div");
      pageEl.className = "paper-page";
      pageEl.dataset.pageIndex = idx;
      pagesContainer.appendChild(pageEl);
      renderPageDom(pageEl, idx);
    }

    updatePageCounter();
    requestAnimationFrame(fitPagesToViewport);
  }

  function updatePageCounter() {
    const total = computedPagesData.length;
    if (total === 0) {
      pageNavStatus.textContent = "/ 0 ページ";
      nextPageBtn.disabled = true;
      prevPageBtn.disabled = true;
      firstPageBtn.disabled = true;
      lastPageBtn.disabled = true;
      pageJumpInput.disabled = true;
      pageJumpInput.value = "";
      pageJumpInput.title = "ページ番号を指定してジャンプ";
      return;
    }

    const pagesPerView = getPagesPerView();
    const spreadCount = getSpreadPageCount(
      currentPageIndex,
      total,
      pagesPerView,
    );
    const endIdx = Math.min(currentPageIndex + spreadCount, total);
    let statusStr = "";
    if (currentPageIndex + 1 === endIdx) {
      statusStr = `/ ${total} ページ`;
    } else {
      statusStr = `(${currentPageIndex + 1}-${endIdx}) / ${total} ページ`;
    }
    pageNavStatus.textContent = statusStr;

    const hasNext =
      getNextSpreadStartIndex(currentPageIndex, total, pagesPerView) !== null;
    const hasPrev =
      getPrevSpreadStartIndex(currentPageIndex, total, pagesPerView) !== null;

    nextPageBtn.disabled = !hasNext;
    prevPageBtn.disabled = !hasPrev;
    firstPageBtn.disabled = !hasPrev;
    lastPageBtn.disabled = !hasNext;

    pageJumpInput.disabled = false;
    pageJumpInput.max = String(total);
    pageJumpInput.title = `1〜${total} の範囲でページ番号を入力してください`;
    // 入力欄にフォーカス中は、ユーザーが打ち込んでいる値を上書きしない
    if (document.activeElement !== pageJumpInput) {
      pageJumpInput.value = String(currentPageIndex + 1);
    }
  }

  nextPageBtn.addEventListener("click", function () {
    const total = computedPagesData.length;
    const pagesPerView = getPagesPerView();
    const next = getNextSpreadStartIndex(currentPageIndex, total, pagesPerView);
    if (next !== null) {
      currentPageIndex = next;
      renderCurrentPages();
    }
  });

  prevPageBtn.addEventListener("click", function () {
    const total = computedPagesData.length;
    const pagesPerView = getPagesPerView();
    const prev = getPrevSpreadStartIndex(currentPageIndex, total, pagesPerView);
    if (prev !== null) {
      currentPageIndex = prev;
      renderCurrentPages();
    }
  });

  // 指定ページ番号（1始まり）へジャンプする。
  // 範囲外の値が渡された場合は何もせず、呼び出し側で元の値に戻す。
  // 見開き表示時は、指定されたページが属する見開きの開始ページへ揃える。
  function goToPage(pageNumber) {
    const total = computedPagesData.length;
    if (total === 0) return false;
    if (pageNumber < 1 || pageNumber > total) return false;
    const pagesPerView = getPagesPerView();
    currentPageIndex = getSpreadStartIndex(pageNumber - 1, pagesPerView);
    renderCurrentPages();
    return true;
  }

  function goToFirstPage() {
    if (computedPagesData.length === 0) return;
    currentPageIndex = 0;
    renderCurrentPages();
  }

  function goToLastPage() {
    const total = computedPagesData.length;
    if (total === 0) return;
    const pagesPerView = getPagesPerView();
    currentPageIndex = normalizeSpreadStartIndex(
      total - 1,
      total,
      pagesPerView,
    );
    renderCurrentPages();
  }

  firstPageBtn.addEventListener("click", goToFirstPage);
  lastPageBtn.addEventListener("click", goToLastPage);

  pageJumpInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      pageJumpInput.blur();
    }
  });

  pageJumpInput.addEventListener("change", function () {
    const value = parseInt(pageJumpInput.value, 10);
    if (Number.isNaN(value) || !goToPage(value)) {
      pageJumpInput.value = String(currentPageIndex + 1);
    }
  });

  function updatePreview() {
    if (columnRuleCol) {
      columnRuleCol.style.display =
        els.columnSelect.value === "2" ? "" : "none";
    }

    const totalChars = els.sourceText.value.length;
    const genkoPages = (totalChars / 400).toFixed(1);
    charCount.textContent =
      totalChars.toLocaleString("ja-JP") +
      "文字（400字詰：約" +
      genkoPages +
      "枚）";

    const title = els.pageTitle.value.trim();
    document.title = title || "言ノ葉Editer";

    updatePageCSSVariables();

    computedPagesData = computeLayoutWithCanvas(els.sourceText.value);

    renderCurrentPages();
    saveToStorage();
  }

  function debounceUpdatePreview() {
    charCount.textContent =
      els.sourceText.value.length.toLocaleString("ja-JP") + "文字";
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updatePreview, 250);
  }

  if (els.fontSelect) {
    els.fontSelect.addEventListener("change", function () {
      customFontRow.style.display =
        els.fontSelect.value === "custom" ? "flex" : "none";
      updatePreview();
    });
  }

  if (els.marginSelect) {
    els.marginSelect.addEventListener("change", function () {
      customMarginRow.style.display =
        els.marginSelect.value === "custom" ? "flex" : "none";
      updatePreview();
    });
  }

  if (els.gutterSelect) {
    els.gutterSelect.addEventListener("change", function () {
      gutterWidthRow.style.display =
        els.gutterSelect.value === "on" ? "flex" : "none";
      updatePreview();
    });
  }

  if (els.marginVInput) {
    els.marginVInput.addEventListener("input", debounceUpdatePreview);
  }
  if (els.marginHInput) {
    els.marginHInput.addEventListener("input", debounceUpdatePreview);
  }
  if (els.gutterWidthInput) {
    els.gutterWidthInput.addEventListener("input", debounceUpdatePreview);
  }

  if (els.themeSelect) {
    els.themeSelect.addEventListener("change", function () {
      document.documentElement.setAttribute(
        "data-theme",
        els.themeSelect.value,
      );
      saveToStorage();
    });
  }

  const CHANGE_EVENT_IDS = [
    "pageSizeSelect",
    "columnSelect",
    "fontSizeSelect",
    "marginSelect",
    "gutterSelect",
    "headerDisplaySelect",
    "headerPosSelect",
    "headerSizeSelect",
    "nombrePosSelect",
    "columnRuleSelect",
    "nombreDisplaySelect",
    "nombreFormatSelect",
  ];
  CHANGE_EVENT_IDS.forEach((id) => {
    if (els[id]) els[id].addEventListener("change", updatePreview);
  });

  const INPUT_EVENT_IDS = [
    "customFontUrl",
    "customFontFamily",
    "startPageInput",
    "sourceText",
    "pageTitle",
    "pageHeader",
  ];
  INPUT_EVENT_IDS.forEach((id) => {
    if (els[id]) els[id].addEventListener("input", debounceUpdatePreview);
  });

  document
    .getElementById("insertBreakButton")
    .addEventListener("click", function () {
      const insertText = "\n\n[改ページ]\n\n";
      const start = els.sourceText.selectionStart;
      const end = els.sourceText.selectionEnd;
      els.sourceText.value =
        els.sourceText.value.substring(0, start) +
        insertText +
        els.sourceText.value.substring(end);
      els.sourceText.selectionStart = els.sourceText.selectionEnd =
        start + insertText.length;
      els.sourceText.focus();
      updatePreview();
    });

  document
    .getElementById("exportButton")
    .addEventListener("click", function () {
      const text = els.sourceText.value;
      if (!text) {
        alert("保存する本文がありません。");
        return;
      }
      const title = els.pageTitle.value.trim() || "document";
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });

  document
    .getElementById("importButton")
    .addEventListener("click", function () {
      fileInput.click();
    });

  fileInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      els.sourceText.value = evt.target.result;

      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      if (!els.pageTitle.value.trim()) {
        els.pageTitle.value = nameWithoutExt;
      }

      currentPageIndex = 0;
      updatePreview();
      fileInput.value = "";
    };
    reader.readAsText(file, "UTF-8");
  });

  function prepareAllPagesForPrint() {
    window.isPrinting = true;
    pagesContainer.style.transform = "none";
    pagesContainer.innerHTML = "";
    computedPagesData.forEach((pageData, idx) => {
      const pageEl = document.createElement("div");
      pageEl.className = "paper-page";
      pageEl.dataset.pageIndex = idx;
      pagesContainer.appendChild(pageEl);
      renderPageDom(pageEl, idx);
    });
  }

  window.isPrinting = false;
  window.addEventListener("beforeprint", () => {
    prepareAllPagesForPrint();
  });

  window.addEventListener("afterprint", () => {
    window.isPrinting = false;
    renderCurrentPages();
  });

  document.getElementById("printButton").addEventListener("click", function () {
    prepareAllPagesForPrint();
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 150);
    });
  });

  document
    .getElementById("sampleButton")
    .addEventListener("click", function () {
      els.pageTitle.value = "言ノ葉Editer 取扱説明書";
      els.pageHeader.value = "～機能と特殊記法のご案内～";
      els.fontSelect.value = "noto";
      els.pageSizeSelect.value = "B6";
      els.fontSizeSelect.value = "9.5pt";

      els.sourceText.value =
        "『言ノ葉Editer』へようこそ。\n" +
        "このツールは、Markdown記法や独自の執筆用記法を使って、美しい縦書き文章をリアルタイムに作成・組版するためのエディタです。\n\n" +
        "[中央]― 寄せの機能表記例 ―\n" +
        "[右]執筆者：言ノ葉太郎\n\n" +
        "## 1. 執筆用記法（ルビ・傍点・配置）\n\n" +
        "小説執筆に欠かせないルビ（ふりがな）や傍点（圏点）、配置の指定に対応しています。\n\n" +
        "・ルビ指定：`｜漢字《かんじ》` または `漢字《かんじ》`\n" +
        "（例：｜瑠璃《るり》色の空に、鳳凰《ほうおう》が舞う。）\n\n" +
        "・傍点指定：`《《強調したい文字》》`\n" +
        "（例：ここが《《一番重要な場面》》です。）\n\n" +
        "・中央寄せ：`[中央]文字` または `[center]文字`\n" +
        "・右寄せ（下寄せ）：`[右]文字` または `[right]文字`\n\n" +
        "## 2. 縦中横の自動変換\n\n" +
        "半角数字（1〜2桁）や、連続する感嘆符・疑問符は、自動的に縦中横に変換されます。\n\n" +
        "・数字指定：`12`月 `31`日\n" +
        "（例：12月31日 15時03分）\n\n" +
        "・記号指定：`!?` `？！` `！！` など\n" +
        "（例：本当!? 嘘でしょ？！ 信じられない！！）\n\n" +
        "## 3. Markdown記法と装飾\n\n" +
        "標準的なMarkdown記法で文章を修飾できます。\n\n" +
        "・太字指定：`**太字**`（例：**ここが太字**）\n" +
        "・見出し：`# 見出し1` や `## 見出し2` を使用\n" +
        "・区切り線：独立した行に `---` （またはアスタリスク・アンダースコアを3つ以上）\n\n" +
        "---\n\n" +
        "・引用枠：行頭に `>` をつける\n\n" +
        "> 引用枠は、作中の手紙や古文書、回想シーン、または注釈などの表現に活用できます。長文の引用であっても枠内で自動的に折り返されて表示されます。\n\n" +
        "## 4. 自動で整う組版の工夫\n\n" +
        "特別な記法を打たなくても、読みやすさのために自動で調整される仕組みがあります。\n\n" +
        "・会話文の字下げ省略：「」『』などの括弧で始まる段落は、自動的に一字下げが省略されます。\n" +
        "・ダッシュ／三点リーダーの分断防止：「――」「……」のように2文字以上連続する場合、行の途中で分断されないよう自動的にまとめて扱われます。\n\n" +
        "[改ページ]\n\n" +
        "## 5. ページ制御と印刷・PDF保存\n\n" +
        "・手動改ページ：独立した行に `[改ページ]` と入力すると、任意の位置で次のページへ送ることができます。\n" +
        "・印刷・PDF保存：画面右上のボタンを押すことで、プレビュー通りの縦書きレイアウトで印刷やPDF出力が可能です。\n\n" +
        "## 6. 各種レイアウト設定\n\n" +
        "画面左側の「組版・設定」タブから、以下の項目を自在に変更できます。\n\n" +
        "・用紙サイズ（A4、B5、A5、B6、A6、ハガキ）\n" +
        "・段組（1段組 / 上下2段組）\n" +
        "・本文文字サイズ、余白、のど（綴じ代）設定\n" +
        "・明朝体フォントの変更（しっぽり明朝、Noto Serif JPなど）\n" +
        "・UIテーマ（ダーク、ライト、セピア）\n\n" +
        "## 7. 保存について\n\n" +
        "入力中の内容はブラウザ内に自動保存され、ページを閉じても再度開いたときに復元されます。ただし、これはブラウザの履歴やサイトデータを削除すると失われる一時的な保存です。\n\n" +
        "大切な原稿は、画面上部の「保存 (.txt)」ボタンでテキストファイルとして端末に書き出しておくことをおすすめします。書き出したファイルは「読込」ボタンでいつでも呼び戻せます。区切りのよいところで、こまめに保存しておくと安心です。";

      currentPageIndex = 0;
      updatePreview();
    });

  document.getElementById("clearButton").addEventListener("click", function () {
    if (confirm("入力した内容をすべて消去しますか？")) {
      els.pageTitle.value = "";
      els.pageHeader.value = "";
      els.sourceText.value = "";
      localStorage.removeItem(STORAGE_KEY);
      currentPageIndex = 0;
      updatePreview();
      els.sourceText.focus();
    }
  });

  // デバッグ用：レイアウト計算のログをコンソールに出力する。
  // 通常は false にしておき、レイアウト絡みの不具合調査が必要になった
  // ときだけ true に切り替える（コンソールで window.DEBUG_LAYOUT = true
  // と打てば、リロードなしでも即座に有効化できる）。
  window.DEBUG_LAYOUT = false;

  loadFromStorage();
  updatePreview();

  // Google Fonts は display=swap で読み込んでいるため、初回描画時点では
  // まだWebフォント（しっぽり明朝等）の読み込みが完了しておらず、
  // フォールバックフォントで実測・描画されてしまうことがある
  // （FOUT: Flash of Unstyled Text）。この状態で行の折り返し位置を
  // 確定してしまうと、フォント読み込み完了後の実際の字送り幅と
  // 食い違い、見た目が崩れる原因になる。
  // document.fonts.ready でフォント読み込み完了を検知し、その時点で
  // 改めてレイアウトを計算し直すことで、この食い違いを解消する。
  // モバイル環境などフォント読み込みが遅れやすい環境で特に有効。
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready
      .then(function () {
        updatePreview();
      })
      .catch(function () {
        // フォント読み込み監視自体に失敗しても、初回描画は既に
        // 完了しているため、ここでは静かに無視して構わない。
      });
  }
});
