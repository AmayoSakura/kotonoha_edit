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
    gutterSelect: "gutter",
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
  const columnRuleCol = document.getElementById("columnRuleCol");
  const charCount = document.getElementById("charCount");
  const pagesContainer = document.getElementById("pagesContainer");
  const previewViewport = document.getElementById("previewViewport");
  const pageSizeStyle = document.getElementById("page-size-style");
  const fileInput = document.getElementById("fileInput");

  const nextPageBtn = document.getElementById("nextPageBtn");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const pageNavStatus = document.getElementById("pageNavStatus");

  const STORAGE_KEY = "md_vertical_editor_draft_v09_" + location.pathname;
  let debounceTimer = null;
  let computedPagesData = [];
  let currentPageIndex = 0;

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
  const KINSOKU_TAIL = /[「『（【〔〈ങ്ങള്‍“‘]/;

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
      return true;
    } catch (e) {
      return false;
    }
  }

  function updatePageCSSVariables() {
    const conf = PAGE_SIZES_MM[els.pageSizeSelect.value] || PAGE_SIZES_MM["A4"];
    const margin =
      MARGIN_SIZES_MM[els.marginSelect.value] || MARGIN_SIZES_MM["normal"];

    let selectedFont = FONTS[els.fontSelect.value];
    if (els.fontSelect.value === "custom") {
      selectedFont = els.customFontFamily.value.trim() || "serif";
      const url = els.customFontUrl.value.trim();
      if (url) document.getElementById("dynamic-font-link").href = url;
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

    value = value.replace(/`([^`]+)`/g, function (match, code) {
      codeBlocks.push('<code class="inline-code">' + code + "</code>");
      return "___CODE_PLACEHOLDER_BLOCK___";
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
    value = value.replace(/(\d{1,2})/g, '<span class="tcy">$1</span>');
    value = value.replace(/(――+|……+|──+)/g, '<span class="nobreak">$1</span>');

    let blockIndex = 0;
    value = value.replace(/___CODE_PLACEHOLDER_BLOCK___/g, function () {
      return codeBlocks[blockIndex++];
    });

    return value;
  }

  function parseToAST(markdown) {
    const normalized = String(markdown).replace(/\r?\n/g, "\n");
    if (!normalized.trim()) return [];

    const rawSections = normalized.split(
      /(?:\n|^)\s*(?:\[改ページ\]|< !--\ s *pagebreak\ s*- ->)\s*(?=\n|$)/i,
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
        items.push({
          type: "p",
          isBracket,
          text: textToParse,
          align: align,
        });
      });

      if (items.length > 0) sections.push(items);
    });

    return sections;
  }

  function computeLayoutWithCanvas(text) {
    const pageSize =
      PAGE_SIZES_MM[els.pageSizeSelect.value] || PAGE_SIZES_MM["A4"];
    const margin =
      MARGIN_SIZES_MM[els.marginSelect.value] || MARGIN_SIZES_MM["normal"];
    const fontSizePx = ptToPx(els.fontSizeSelect.value);
    const isTwoColumn = els.columnSelect.value === "2";
    const isGutterOn = els.gutterSelect && els.gutterSelect.value === "on";

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

    const gutterWidth = isGutterOn ? mmToPx(6) : 0;
    const colWPx = paperWPx - marginHPx * 2 - gutterWidth;
    const lineSpacingPx = fontSizePx * 1.8;
    const maxLinesPerCol = Math.max(1, Math.floor(colWPx / lineSpacingPx));

    function getCharHeight(ch, fontScale = 1.0) {
      // 半角文字・英数字の幅係数を 0.65 に修正してレイアウト計算のズレ（はみ出し・切れ）を防ぐ
      if (/[a-zA-Z0-9\s]/.test(ch)) return fontSizePx * 0.65 * fontScale;
      return fontSizePx * fontScale;
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
      const pattern =
        /(!\?|\?!|!!|\?\?|！？|？！|！！|！！|？？)|(\b\d{1,2}\b)|([\|｜][^《\n]+《[^》\n]+》)|([一-龯]+《[^》\n]+》)|(《《[^》\n]+》》)|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(`[^`]+`)|([^\|｜《\*`!\?\d])/g;
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

        if (tok.raw !== tok.display && !isSplittable) {
          const isRuby =
            tok.raw.includes("《") &&
            tok.raw.endsWith("》") &&
            !tok.raw.startsWith("《《");
          charItems.push({
            raw: tok.raw,
            display: tok.display,
            isAtomic: true,
            isRuby: isRuby,
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
        } else {
          for (let c = 0; c < item.display.length; c++) {
            itemH += getCharHeight(item.display[c], fontScale);
          }
        }

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

          let pushBackCount = 0;
          const nextChar = item.display[0];

          if (isKinsokuHead(nextChar) && currentChars.length > 1) {
            pushBackCount = 1;
          }

          const lastChar = currentChars[currentChars.length - 1].display;
          if (isKinsokuTail(lastChar) && currentChars.length > 1) {
            pushBackCount = Math.max(pushBackCount, 1);
          }

          if (pushBackCount > 0) {
            const popped = currentChars.splice(
              currentChars.length - pushBackCount,
              pushBackCount,
            );
            i -= popped.length + 1;

            currentRaw = currentChars.map((c) => c.raw).join("");
            if (window.DEBUG_LAYOUT) {
              console.log(
                "[LINE:kinsoku]",
                JSON.stringify(currentRaw),
                "chars=",
                currentChars.length,
                "H=",
                currentH.toFixed(1),
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
            if (window.DEBUG_LAYOUT) {
              console.log(
                "[LINE]",
                JSON.stringify(currentRaw),
                "chars=",
                currentChars.length,
                "H=",
                currentH.toFixed(1),
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

    if (currentPageIndex % 2 !== 0) {
      currentPageIndex = Math.max(0, currentPageIndex - 1);
    }
    if (currentPageIndex >= total) {
      currentPageIndex = Math.max(0, Math.floor((total - 1) / 2) * 2);
    }

    const endIdx = Math.min(currentPageIndex + 2, total);
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
      pageNavStatus.textContent = "0 / 0 ページ";
      nextPageBtn.disabled = true;
      prevPageBtn.disabled = true;
      return;
    }

    const endIdx = Math.min(currentPageIndex + 2, total);
    let statusStr = "";
    if (currentPageIndex + 1 === endIdx) {
      statusStr = `${currentPageIndex + 1} / ${total} ページ`;
    } else {
      statusStr = `${currentPageIndex + 1}-${endIdx} / ${total} ページ`;
    }
    pageNavStatus.textContent = statusStr;

    nextPageBtn.disabled = currentPageIndex + 2 >= total;
    prevPageBtn.disabled = currentPageIndex <= 0;
  }

  nextPageBtn.addEventListener("click", function () {
    if (currentPageIndex + 2 < computedPagesData.length) {
      currentPageIndex += 2;
      renderCurrentPages();
    }
  });

  prevPageBtn.addEventListener("click", function () {
    if (currentPageIndex - 2 >= 0) {
      currentPageIndex -= 2;
      renderCurrentPages();
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
      els.fontSelect.value = "system";
      els.pageSizeSelect.value = "B6";
      els.fontSizeSelect.value = "9.5pt";

      els.sourceText.value =
        "『言ノ葉Editer』へようこそ。\n" +
        "このツールは、Markdown記法や独自の執筆用記法を使って、美しい縦書き文章をリアルタイムに作成・組版するためのエディタです。\n\n" +
        "## 1. 執筆用記法（ルビ・傍点・配置）\n\n" +
        "小説執筆に欠かせないルビ（ふりがな）や傍点（圏点）、配置の指定に対応しています。\n\n" +
        "・ルビ指定：`｜漢字《かんじ》` または `漢字《かんじ》`\n" +
        "（例：｜瑠璃《るり》色の空に、鳳凰《ほうおう》が舞う。）\n\n" +
        "・傍点指定：`《《強調したい文字》》`\n" +
        "（例：ここが《《一番重要な場面》》です。）\n\n" +
        "## 2. 縦中横の自動変換\n\n" +
        "半角数字（1〜2桁）や、連続する感嘆符・疑問符は、自動的に縦中横に変換されます。\n\n" +
        "・数字指定：`12`月 `31`日\n" +
        "（例：12月31日 15時03分）\n\n" +
        "・記号指定：`!?` `？！` `！！` など\n" +
        "（例：本当!? 嘘で嘘でしょ？！ 信じられない！！）\n\n" +
        "## 3. Markdown記法と装飾\n\n" +
        "標準的なMarkdown記法で文章を修飾できます。\n\n" +
        "・太字指定：`**太字**`（例：**ここが太字**）\n" +
        "・見出し：`# 見出し1` や `## 見出し2` を使用\n" +
        "・引用枠：行頭に `>` をつける\n\n" +
        "> 引用枠は、作中の手紙や古文書、回想シーン、または注釈などの表現に活用できます。長文の引用であっても枠内で自動的に折り返されて表示されます。\n\n" +
        "[改ページ]\n\n" +
        "## 4. ページ制御と印刷・PDF保存\n\n" +
        "・手動改ページ：独立した行に `[改ページ]` と入力すると、任意の位置で次のページへ送ることができます。\n" +
        "・印刷・PDF保存：画面右上のボタンを押すことで、プレビュー通りの縦書きレイアウトで印刷やPDF出力が可能です。\n\n" +
        "## 5. 各種レイアウト設定\n\n" +
        "画面左側の「組版・設定」タブから、以下の項目を自在に変更できます。\n\n" +
        "・用紙サイズ（A4、B5、A5、B6、A6、ハガキ）\n" +
        "・段組（1段組 / 上下2段組）\n" +
        "・本文文字サイズ、余白、のど（綴じ代）設定\n" +
        "・明朝体フォントの変更（しっぽり明朝、Noto Serif JPなど）\n" +
        "・UIテーマ（ダーク、ライト、セピア）\n\n" +
        "入力したテキストや設定はブラウザに自動保存されますので、安心してご執筆をお楽しみください。";

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
  // 検証が終わったらこのフラグと関連する console.log 呼び出しは削除すること。
  window.DEBUG_LAYOUT = true;

  loadFromStorage();
  updatePreview();
});
