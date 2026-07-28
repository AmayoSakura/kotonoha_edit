    window.addEventListener("DOMContentLoaded", function () {
      "use strict";

      const CONFIG_KEYS = {
        pageTitle: "title",
        pageHeader: "header",
        writingModeSelect: "writingMode",
        bindingSelect: "binding",
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
        startPageInput: "startPage",
        nombrePosSelect: "nombrePos",
        nombreFormatSelect: "nombreFormat",
        nombreTypeSelect: "nombreType"
      };

      const els = {};
      Object.keys(CONFIG_KEYS).forEach(id => {
        els[id] = document.getElementById(id);
      });

      const customFontRow = document.getElementById("customFontRow");
      const columnRuleCol = document.getElementById("columnRuleCol");
      const charCount = document.getElementById("charCount");
      const pagesContainer = document.getElementById("pagesContainer");
      const pageSizeStyle = document.getElementById("page-size-style");
      const viewport = document.querySelector('.preview-viewport');
      const editorGrid = document.getElementById("editorGrid");
      const STORAGE_KEY = "md_vertical_editor_draft_" + location.pathname;
      let debounceTimer = null;
      let preservedPageIndex = 0;
      let isRendering = false;
      let generatedPagesCache = [];
      let activePageDOMs = new Map();
      let currentCalcToken = 0;

      const PAGE_SIZES = {
        "A4": { w: "210mm", h: "297mm" },
        "B5": { w: "182mm", h: "257mm" },
        "A5": { w: "148mm", h: "210mm" },
        "B6": { w: "128mm", h: "182mm" },
        "A6": { w: "105mm", h: "148mm" },
        "Hagaki": { w: "100mm", h: "148mm" }
      };

      const MARGIN_SIZES = {
        "narrow": { v: "12mm", h: "10mm" },
        "normal": { v: "18mm", h: "14mm" },
        "wide": { v: "24mm", h: "18mm" }
      };

      const FONTS = {
        "shippori": '"Shippori Mincho", "Yu Mincho", "MS Mincho", serif',
        "noto": '"Noto Serif JP", "Yu Mincho", "MS Mincho", serif',
        "sawarabi": '"Sawarabi Mincho", "Yu Mincho", "MS Mincho", serif',
        "system": '"Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif'
      };

      // モバイル用表示タブ切り替え機能（「両方」は除去）
      const mobileTabEdit = document.getElementById("mobileTabEdit");
      const mobileTabPreview = document.getElementById("mobileTabPreview");

      function setMobileMode(mode) {
        if (!editorGrid) return;
        editorGrid.classList.remove("mode-edit", "mode-preview");
        editorGrid.classList.add("mode-" + mode);

        [mobileTabEdit, mobileTabPreview].forEach(btn => {
          if (btn) btn.classList.remove("active");
        });

        if (mode === "edit" && mobileTabEdit) mobileTabEdit.classList.add("active");
        if (mode === "preview" && mobileTabPreview) mobileTabPreview.classList.add("active");

        if (mode === "preview") {
          requestAnimationFrame(() => {
            updatePreviewScale();
            renderAllPagesToDOM();
          });
        }
      }

      if (mobileTabEdit) mobileTabEdit.addEventListener("click", () => setMobileMode("edit"));
      if (mobileTabPreview) mobileTabPreview.addEventListener("click", () => setMobileMode("preview"));

      const exportBtn = document.getElementById("exportButton");
      const importBtn = document.getElementById("importButton");
      const fileInput = document.getElementById("fileInput");

      if (exportBtn) {
        exportBtn.addEventListener("click", function () {
          const text = els.sourceText ? els.sourceText.value : "";
          const titleInput = els.pageTitle ? els.pageTitle.value.trim() : "";
          const fileName = (titleInput ? titleInput : "kotonoha_draft") + ".txt";

          const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
          const url = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();

          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      }

      if (importBtn && fileInput) {
        importBtn.addEventListener("click", function () {
          fileInput.click();
        });

        fileInput.addEventListener("change", function (e) {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = function (event) {
            if (els.sourceText) {
              els.sourceText.value = event.target.result;
              updateCharCount();
              updatePreview();
            }

            if (els.pageTitle && !els.pageTitle.value) {
              const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
              els.pageTitle.value = nameWithoutExt;
            }
            fileInput.value = "";
          };
          reader.readAsText(file, "utf-8");
        });
      }

      function toKanjiNumber(num) {
        const kanjiNums = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
        const units = ["", "十", "百", "千"];

        if (num === 0) return kanjiNums[0];
        if (num < 0) return "マイナス" + toKanjiNumber(Math.abs(num));

        let str = num.toString();
        let len = str.length;
        let result = "";

        for (let i = 0; i < len; i++) {
          let n = parseInt(str[i], 10);
          let unitIdx = len - 1 - i;

          if (n !== 0) {
            if (n === 1 && unitIdx > 0) {
              result += units[unitIdx];
            } else {
              result += kanjiNums[n] + units[unitIdx];
            }
          }
        }
        return result;
      }

      function updatePreviewScale() {
        if (!viewport) return 1;
        let clientWidth = viewport.clientWidth;
        if (clientWidth === 0) {
          clientWidth = viewport.getBoundingClientRect().width;
        }
        if (clientWidth === 0) {
          const appEl = document.querySelector('.app');
          clientWidth = appEl ? appEl.clientWidth : window.innerWidth;
        }
        const paddingX = window.innerWidth <= 600 ? 24 : 40;
        const availableWidth = Math.max(100, clientWidth - paddingX);
        const rawWidth = getPageWidthPx();

        let scale = 1;
        if (availableWidth > 0 && availableWidth < rawWidth) {
          scale = availableWidth / rawWidth;
          if (scale < 0.3) scale = 0.3;
        }
        document.documentElement.style.setProperty('--preview-scale', scale);
        return scale;
      }

      function getPageWidthPx() {
        const conf = PAGE_SIZES[els.pageSizeSelect ? els.pageSizeSelect.value : "A4"] || PAGE_SIZES["A4"];
        return parseFloat(conf.w) * 3.77953;
      }

      function getPageHeightPx() {
        const conf = PAGE_SIZES[els.pageSizeSelect ? els.pageSizeSelect.value : "A4"] || PAGE_SIZES["A4"];
        return parseFloat(conf.h) * 3.77953;
      }

      function getEffectiveScale() {
        if (!viewport) return 1;

        let clientWidth = viewport.clientWidth;
        if (clientWidth === 0) {
          clientWidth = viewport.getBoundingClientRect().width;
        }
        if (clientWidth === 0) {
          const appEl = document.querySelector('.app');
          clientWidth = appEl ? appEl.clientWidth : window.innerWidth;
        }
        const paddingX = window.innerWidth <= 600 ? 24 : 40;
        const availableWidth = Math.max(100, clientWidth - paddingX);
        const paperWpx = getPageWidthPx();

        let previewScale = 1;
        if (availableWidth > 0 && availableWidth < paperWpx) {
          previewScale = availableWidth / paperWpx;
          if (previewScale < 0.3) previewScale = 0.3;
        }

        const viewportH = viewport.clientHeight || (window.innerHeight - 180);
        const paperHpx = getPageHeightPx();
        const vScale = (viewportH - 48) / paperHpx;

        return Math.min(previewScale, vScale > 0 ? vScale : 1);
      }

      function getScaledPageWidthPx() {
        const scale = getEffectiveScale();
        const pageWpx = getPageWidthPx();
        const GAP = 24;
        return pageWpx * scale + GAP;
      }

      function saveToStorage() {
        const data = {};
        for (const [id, key] of Object.entries(CONFIG_KEYS)) {
          if (els[id]) data[key] = els[id].value;
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
          console.warn("ローカルストレージへの保存に失敗しました", e);
        }
      }

      function loadFromStorage() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return false;

          const data = JSON.parse(raw);
          for (const [id, key] of Object.entries(CONFIG_KEYS)) {
            if (data[key] !== undefined && els[id]) {
              els[id].value = data[key];
            }
          }
          if (data.theme !== undefined && els.themeSelect) {
            els.themeSelect.value = data.theme;
            document.documentElement.setAttribute("data-theme", data.theme);
          }
          if (els.fontSelect && els.fontSelect.value === "custom" && customFontRow) {
            customFontRow.style.display = "flex";
          }
          return true;
        } catch (e) {
          console.warn("ローカルストレージからの読み込みに失敗しました", e);
          return false;
        }
      }

      function isValidHttpUrl(string) {
        try {
          const url = new URL(string);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch (_) {
          return false;
        }
      }

      function updatePageStyle() {
        const conf = PAGE_SIZES[els.pageSizeSelect.value] || PAGE_SIZES["A4"];
        const margin = MARGIN_SIZES[els.marginSelect.value] || MARGIN_SIZES["normal"];
        const writingMode = els.writingModeSelect ? els.writingModeSelect.value : "vertical";

        document.documentElement.setAttribute("data-writing-mode", writingMode);

        let selectedFont = FONTS[els.fontSelect.value];
        if (els.fontSelect.value === "custom") {
          const rawFamily = els.customFontFamily.value.trim();
          selectedFont = rawFamily.replace(/[;{}<>] /g, '') || "serif";

          const url = els.customFontUrl.value.trim();
          if (url && isValidHttpUrl(url)) {
            document.getElementById("dynamic-font-link").href = url;
          }
        }

        const cols = els.columnSelect.value;
        document.documentElement.style.setProperty('--doc-column-count', cols);
        document.documentElement.style.setProperty('--paper-w', conf.w);
        document.documentElement.style.setProperty('--paper-h', conf.h);
        document.documentElement.style.setProperty('--doc-font-size', els.fontSizeSelect.value);
        document.documentElement.style.setProperty('--doc-font-family', selectedFont);
        document.documentElement.style.setProperty('--page-padding-v', margin.v);
        document.documentElement.style.setProperty('--page-padding-h', margin.h);

        pageSizeStyle.innerHTML = "@page { size: " + conf.w + " " + conf.h + "; margin: 0; }";
      }

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      const inlineCache = new Map();
      const MAX_CACHE_SIZE = 10000;

      function parseInlineVerticalMarkdownCached(text) {
        if (!text) return "";
        let cached = inlineCache.get(text);
        if (cached !== undefined) return cached;

        if (inlineCache.size > MAX_CACHE_SIZE) {
          inlineCache.clear();
        }
        cached = parseInlineVerticalMarkdown(text);
        inlineCache.set(text, cached);
        return cached;
      }

      function parseInlineVerticalMarkdown(text) {
        let value = escapeHtml(text);

        const codeBlocks = [];
        value = value.replace(/`([^`]+)`/g, function (match, code) {
          codeBlocks.push('<code class="inline-code">' + code + '</code>');
          return "___CODE_PLACEHOLDER_" + (codeBlocks.length - 1) + "___";
        });

        value = value.replace(/《《([^》\n]+)》》/g, '<span class="bouten">$1</span>');
        value = value.replace(/[\|｜]([^《\n]+)《([^》\n]+)》/g, '<ruby>$1<rt>$2</rt></ruby>');
        value = value.replace(/([\u3005\u3007\u303b\u4e00-\u9faf]+)《([^》\n]+)》/g, '<ruby>$1<rt>$2</rt></ruby>');
        value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        value = value.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

        const isVertical = (els.writingModeSelect ? els.writingModeSelect.value : "vertical") === "vertical";
        if (isVertical) {
          value = value.replace(/(!\?|\?!|!!|\?\?|！？|？！|！！|？？)/g, '<span class="tcy">$1</span>');
          value = value.replace(/\b(\d{1,2})\b/g, '<span class="tcy">$1</span>');
        }
        value = value.replace(/(――+|……+|──+)/g, '<span class="nobreak">$1</span>');

        value = value.replace(/___CODE_PLACEHOLDER_(\d+)___/g, function (match, index) {
          return codeBlocks[index];
        });

        return value;
      }

      function parseToAST(markdown) {
        const normalized = String(markdown).replace(/\r\n?/g, "\n");
        if (!normalized.trim()) return [];

        const sections = [];
        const regex = /(?:\n|^)\s*(?:\[改ページ\]|< !--\s *pagebreak\ s*- ->)\s*(?=\n|$)/gi;
        let match;
        let lastIndex = 0;
        const rawSections = [];

        while ((match = regex.exec(normalized)) !== null) {
          rawSections.push({
            text: normalized.substring(lastIndex, match.index),
            startIndex: lastIndex
          });
          lastIndex = regex.lastIndex;
        }
        rawSections.push({
          text: normalized.substring(lastIndex),
          startIndex: lastIndex
        });

        for (let s = 0; s < rawSections.length; s++) {
          const secText = rawSections[s].text;
          const secStart = rawSections[s].startIndex;

          const lines = secText.split("\n");
          const items = [];
          let lineStart = secStart;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            const itemStart = lineStart;
            const itemEnd = lineStart + line.length;

            lineStart += line.length + 1;

            if (trimmed === '') {
              items.push({ type: 'empty', startIndex: itemStart, endIndex: itemEnd });
              continue;
            }

            const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
            if (heading) {
              items.push({ type: 'heading', level: heading[1].length, text: heading[2].trim(), startIndex: itemStart, endIndex: itemEnd });
              continue;
            }

            if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
              items.push({ type: 'hr', startIndex: itemStart, endIndex: itemEnd });
              continue;
            }

            const quote = trimmed.match(/^>\s?(.*)$/);
            if (quote) {
              items.push({ type: 'quote', text: quote[1], startIndex: itemStart, endIndex: itemEnd });
              continue;
            }

            const alignMatch = trimmed.match(/^\[(center|right|中央|中央寄せ|右|右寄せ|下|下寄せ|地|地寄せ)\]\s*(.*)$/i);
            let align = null;
            let contentText = trimmed;

            if (alignMatch) {
              const tag = alignMatch[1].toLowerCase();
              if (['center', '中央', '中央寄せ'].includes(tag)) align = 'center';
              else if (['right', '右', '右寄せ', '下', '下寄せ', '地', '地寄せ'].includes(tag)) align = 'right';
              contentText = alignMatch[2];
            }

            const isBracket = /^[「『（【〔〈《“‘]/.test(contentText);
            const isList = /^[・\-\*]/.test(contentText) || /^\d+[\.．]/.test(contentText);
            items.push({
              type: 'p',
              align: align,
              isBracket: isBracket || isList || !!align,
              text: contentText,
              startIndex: itemStart,
              endIndex: itemEnd
            });
          }

          if (items.length > 0) {
            sections.push(items);
          }
        }

        return sections;
      }

      function createPageData(pageIdx, isTwoColumn) {
        const isGutterOn = els.gutterSelect && els.gutterSelect.value === "on";
        const bindingDir = els.bindingSelect ? els.bindingSelect.value : "right";
        const startPageNum = parseInt(els.startPageInput ? els.startPageInput.value : 1, 10) || 1;
        const pageNum = pageIdx + startPageNum;
        const isOdd = (pageIdx + 1) % 2 !== 0;

        let gutterClass = "";
        if (isGutterOn) {
          if (bindingDir === "right") {
            gutterClass = isOdd ? " gutter-right" : " gutter-left";
          } else {
            gutterClass = isOdd ? " gutter-left" : " gutter-right";
          }
        }

        let headerTitleHtml = "";

        const headerText = els.pageHeader ? els.pageHeader.value.trim() : "";
        const displayVal = els.headerDisplaySelect ? els.headerDisplaySelect.value : "all";
        const posVal = els.headerPosSelect ? els.headerPosSelect.value : "right";
        const sizeVal = els.headerSizeSelect ? els.headerSizeSelect.value : "0.65rem";

        let showHeader = false;
        if (headerText) {
          if (displayVal === "all" || displayVal === "alternate") {
            showHeader = true;
          } else if (displayVal === "odd" && isOdd) {
            showHeader = true;
          } else if (displayVal === "even" && !isOdd) {
            showHeader = true;
          }
        }

        let headerTagHtml = "";
        if (showHeader) {
          let currentPos = posVal;
          if (displayVal === "alternate") {
            if (bindingDir === "right") {
              currentPos = isOdd ? "left" : "right";
            } else {
              currentPos = isOdd ? "right" : "left";
            }
          }

          let posStyle = "";
          if (currentPos === "center") {
            posStyle = "left: 50%; right: auto; transform: translateX(-50%);";
          } else if (currentPos === "left") {
            posStyle = "left: var(--page-padding-h); right: auto; transform: none;";
          } else {
            posStyle = "right: var(--page-padding-h); left: auto; transform: none;";
          }

          const styleAttr = "font-size: " + sizeVal + "; " + posStyle;
          headerTagHtml = '<div class="page-header-tag" style="' + styleAttr + '">' + escapeHtml(headerText) + '</div>';
        }

        const showRule = els.columnRuleSelect ? els.columnRuleSelect.value === "on" : true;
        const dividerClass = showRule ? "column-divider" : "column-divider no-border";

        const nombreVal = els.nombreDisplaySelect ? els.nombreDisplaySelect.value : "all";
        const nombrePosVal = els.nombrePosSelect ? els.nombrePosSelect.value : "center";
        const nombreFormat = els.nombreFormatSelect ? els.nombreFormatSelect.value : "hyphen";
        const nombreType = els.nombreTypeSelect ? els.nombreTypeSelect.value : "arabic";

        let nombreHtml = "";
        if (nombreVal === "all" || (nombreVal === "skip-first" && pageIdx > 0)) {
          let currentNombrePos = nombrePosVal;
          if (nombrePosVal === "alternate") {
            if (bindingDir === "right") {
              currentNombrePos = isOdd ? "left" : "right";
            } else {
              currentNombrePos = isOdd ? "right" : "left";
            }
          }

          let nombrePosStyle = "";
          if (currentNombrePos === "right") {
            nombrePosStyle = "right: var(--page-padding-h); left: auto; transform: none;";
          } else if (currentNombrePos === "left") {
            nombrePosStyle = "left: var(--page-padding-h); right: auto; transform: none;";
          } else {
            nombrePosStyle = "left: 50%; right: auto; transform: translateX(-50%);";
          }

          let numStr = (nombreType === "kanji") ? toKanjiNumber(pageNum) : pageNum;

          let formattedNombre = "";
          switch (nombreFormat) {
            case "plain":
              formattedNombre = numStr;
              break;
            case "bracket":
              formattedNombre = "（ " + numStr + " ）";
              break;
            case "square":
              formattedNombre = "[ " + numStr + " ]";
              break;
            case "slash":
              formattedNombre = "/ " + numStr + " /";
              break;
            case "page":
              formattedNombre = "P." + numStr;
              break;
            case "hyphen":
            default:
              formattedNombre = "- " + numStr + " -";
              break;
          }

          nombreHtml = '<div class="page-number-tag" style="' + nombrePosStyle + '">' + escapeHtml(formattedNombre) + '</div>';
        }

        return {
          pageIdx: pageIdx,
          isTwoColumn: isTwoColumn,
          gutterClass: gutterClass,
          headerTitleHtml: headerTitleHtml,
          headerTagHtml: headerTagHtml,
          dividerClass: dividerClass,
          nombreHtml: nombreHtml,
          articlesHtml: isTwoColumn ? ["", ""] : [""]
        };
      }

      function createPageDOMFromData(data) {
        const paperEl = document.createElement("div");
        paperEl.className = "paper-page" + (data.isTwoColumn ? " has-columns" : "") + data.gutterClass;

        let bodyHtml = "";
        if (data.isTwoColumn) {
          bodyHtml = '<div class="columns-wrapper">' +
            '<article class="md-body col-top">' + (data.articlesHtml[0] || "") + '</article>' +
            '<div class="' + data.dividerClass + '"></div>' +
            '<article class="md-body col-bottom">' + (data.articlesHtml[1] || "") + '</article>' +
            '</div>';
        } else {
          bodyHtml = '<article class="md-body">' + (data.articlesHtml[0] || "") + '</article>';
        }

        paperEl.innerHTML = data.headerTagHtml + bodyHtml + data.nombreHtml;
        return paperEl;
      }

      const loadingIndicator = document.getElementById("loadingIndicator");
      let loadingHideTimer = null;

      function showLoading() {
        clearTimeout(loadingHideTimer);
        if (loadingIndicator) loadingIndicator.classList.add("active");
      }

      function hideLoading(delay = 250) {
        clearTimeout(loadingHideTimer);
        loadingHideTimer = setTimeout(() => {
          if (loadingIndicator && !isRendering) loadingIndicator.classList.remove("active");
        }, delay);
      }

      // プレビューの先頭文章とテキストエディタの連動調整（折り返しを考慮した精密スクロール）
      function syncEditorToPage(pageIndex) {
        if (!els.sourceText || !generatedPagesCache || !generatedPagesCache[pageIndex]) return;
        const pageData = generatedPagesCache[pageIndex];
        // 最初のページの場合は強制的に0文字目（一番最初）に連動させる
        const startIdx = pageIndex === 0 ? 0 : (pageData.startCharIndex ?? 0);

        const fullText = els.sourceText.value;
        if (!fullText) return;

        let measurerContainer = document.getElementById("measurerContainer");
        if (!measurerContainer) return;

        let textMeasurer = document.getElementById("textMeasurer");
        if (!textMeasurer) {
          textMeasurer = document.createElement("div");
          textMeasurer.id = "textMeasurer";
          measurerContainer.appendChild(textMeasurer);
        }

        const computedStyle = window.getComputedStyle(els.sourceText);

        textMeasurer.style.cssText = `
          position: absolute;
          visibility: hidden;
          white-space: pre-wrap;
          word-break: ${computedStyle.wordBreak};
          overflow-wrap: ${computedStyle.overflowWrap};
          font-family: ${computedStyle.fontFamily};
          font-size: ${computedStyle.fontSize};
          line-height: ${computedStyle.lineHeight};
          letter-spacing: ${computedStyle.letterSpacing};
          width: ${els.sourceText.clientWidth}px;
          box-sizing: border-box;
          padding: ${computedStyle.paddingTop} ${computedStyle.paddingRight} ${computedStyle.paddingBottom} ${computedStyle.paddingLeft};
          border: ${computedStyle.borderWidth} solid transparent;
          margin: 0;
        `;

        const targetText = fullText.substring(0, startIdx);
        textMeasurer.innerHTML = escapeHtml(targetText) + '<span id="scrollTargetMarker">&#8203;</span>';
        const marker = textMeasurer.querySelector('#scrollTargetMarker');
        const targetTop = marker ? marker.offsetTop : 0;

        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        els.sourceText.scrollTop = startIdx === 0 ? 0 : Math.max(0, targetTop - paddingTop);
      }

      // テキストエリアのカーソル位置からプレビューの対応ページへスクロール連動
      function syncPageToEditor() {
        if (!els.sourceText || generatedPagesCache.length === 0) return;
        const cursorPos = els.sourceText.selectionStart;

        let targetPageIndex = 0;
        for (let i = 0; i < generatedPagesCache.length; i++) {
          const page = generatedPagesCache[i];
          if (page.startCharIndex !== undefined && page.endCharIndex !== undefined) {
            if (cursorPos >= page.startCharIndex && cursorPos <= page.endCharIndex) {
              targetPageIndex = i;
              break;
            } else if (cursorPos > page.endCharIndex) {
              targetPageIndex = i;
            }
          }
        }

        if (preservedPageIndex !== targetPageIndex) {
          preservedPageIndex = targetPageIndex;
          const pageWidth = getScaledPageWidthPx();
          const isVertical = (els.writingModeSelect ? els.writingModeSelect.value : "vertical") === "vertical";
          if (viewport) {
            const scrollPos = isVertical ? -(targetPageIndex * pageWidth) : (targetPageIndex * pageWidth);
            viewport.scrollTo({
              left: scrollPos,
              behavior: 'smooth'
            });
          }
          updatePageNavUI();
        }
      }

      async function renderPagesWithPrecisePagination(isSyncForce = false) {
        if (!pagesContainer || !els.sourceText) return;

        const myToken = ++currentCalcToken;
        isRendering = true;
        if (!isSyncForce) showLoading();

        const savedPageIndex = preservedPageIndex;
        generatedPagesCache = [];

        const isTwoColumn = els.columnSelect ? els.columnSelect.value === "2" : false;
        const isVertical = (els.writingModeSelect ? els.writingModeSelect.value : "vertical") === "vertical";
        let totalPageIndex = 0;

        let measurerContainer = document.getElementById("measurerContainer");
        if (!measurerContainer) {
          measurerContainer = document.createElement("div");
          measurerContainer.id = "measurerContainer";
          measurerContainer.style.cssText = "position: absolute; top: -9999px; left: -9999px; visibility: hidden; pointer-events: none; opacity: 0; z-index: -9999;";
          document.body.appendChild(measurerContainer);
        }
        measurerContainer.innerHTML = "";

        let currentData = createPageData(totalPageIndex, isTwoColumn);
        let currentPageEl = createPageDOMFromData(currentData);
        measurerContainer.appendChild(currentPageEl);

        let currentArticles = Array.from(currentPageEl.querySelectorAll(".md-body"));
        let currentColIdx = 0;
        let currentArticle = currentArticles[currentColIdx];

        const checkOverflow = () => {
          if (!currentArticle) return false;
          const containerRect = currentArticle.getBoundingClientRect();
          const lastChild = currentArticle.lastElementChild;
          if (!lastChild) return false;
          const childRect = lastChild.getBoundingClientRect();

          if (isVertical) {
            return childRect.left < containerRect.left - 1;
          } else {
            return childRect.bottom > containerRect.bottom + 1;
          }
        };

        const flushCurrentPage = () => {
          currentData.articlesHtml = currentArticles.map((a) => a.innerHTML);
          generatedPagesCache.push(currentData);
        };

        const nextArticle = () => {
          if (isTwoColumn && currentColIdx === 0) {
            currentColIdx = 1;
            currentArticle = currentArticles[currentColIdx];
            return currentArticle;
          }

          flushCurrentPage();

          totalPageIndex++;
          currentData = createPageData(totalPageIndex, isTwoColumn);
          measurerContainer.innerHTML = "";
          currentPageEl = createPageDOMFromData(currentData);
          measurerContainer.appendChild(currentPageEl);
          currentArticles = Array.from(currentPageEl.querySelectorAll(".md-body"));
          currentColIdx = 0;
          currentArticle = currentArticles[currentColIdx];
          return currentArticle;
        };

        const appendWithOverflowCheck = (el) => {
          currentArticle.appendChild(el);
          if (checkOverflow()) {
            currentArticle.removeChild(el);
            currentArticle = nextArticle();
            currentArticle.appendChild(el);
          }
        };

        const registerPageCharRange = (startIdx, endIdx) => {
          if (startIdx === undefined || endIdx === undefined) return;
          // ページ内の最初の要素の開始位置を正確に記録する
          if (currentData.startCharIndex === undefined || startIdx < currentData.startCharIndex) {
            currentData.startCharIndex = startIdx;
          }
          if (currentData.endCharIndex === undefined || endIdx > currentData.endCharIndex) {
            currentData.endCharIndex = endIdx;
          }
        };

        const sections = parseToAST(els.sourceText.value);
        let processedItems = 0;
        const CHUNK_SIZE = 150;
        let lastFitsCharCountEstimate = 400;

        const secLen = sections.length;
        for (let sectionIdx = 0; sectionIdx < secLen; sectionIdx++) {
          if (currentCalcToken !== myToken) return;

          const items = sections[sectionIdx];
          if (sectionIdx > 0) {
            flushCurrentPage();
            totalPageIndex++;
            currentData = createPageData(totalPageIndex, isTwoColumn);
            measurerContainer.innerHTML = "";
            currentPageEl = createPageDOMFromData(currentData);
            measurerContainer.appendChild(currentPageEl);
            currentArticles = Array.from(currentPageEl.querySelectorAll(".md-body"));
            currentColIdx = 0;
            currentArticle = currentArticles[currentColIdx];
          }

          const itemLen = items.length;
          for (let itemIdx = 0; itemIdx < itemLen; itemIdx++) {
            if (currentCalcToken !== myToken) return;

            const item = items[itemIdx];
            processedItems++;

            if (!isSyncForce && processedItems % CHUNK_SIZE === 0) {
              await new Promise(resolve => setTimeout(resolve, 0));
              if (currentCalcToken !== myToken) { isRendering = false; hideLoading(); return; }
            }

            if (item.type === 'empty') {
              const p = document.createElement('p');
              p.className = 'no-indent';
              p.innerHTML = '&nbsp;';
              registerPageCharRange(item.startIndex, item.endIndex);
              appendWithOverflowCheck(p);
            } else if (item.type === 'heading') {
              const h = document.createElement('h' + item.level);
              h.innerHTML = parseInlineVerticalMarkdownCached(item.text);
              registerPageCharRange(item.startIndex, item.endIndex);
              appendWithOverflowCheck(h);
            } else if (item.type === 'hr') {
              const hr = document.createElement('hr');
              registerPageCharRange(item.startIndex, item.endIndex);
              appendWithOverflowCheck(hr);
            } else if (item.type === 'quote') {
              const bq = document.createElement('blockquote');
              bq.innerHTML = parseInlineVerticalMarkdownCached(item.text);
              registerPageCharRange(item.startIndex, item.endIndex);
              appendWithOverflowCheck(bq);
            } else if (item.type === 'p') {
              let remainingText = item.text;
              let isFirstPiece = true;

              while (remainingText.length > 0) {
                const p = document.createElement('p');

                const classNames = [];
                if (item.isBracket || !isFirstPiece) {
                  classNames.push('no-indent');
                }
                if (item.align) {
                  classNames.push('align-' + item.align);
                }
                if (classNames.length > 0) {
                  p.className = classNames.join(' ');
                }
                currentArticle.appendChild(p);

                let fitsCharCount = 0;
                let low = 1;
                let high = Math.min(remainingText.length, Math.max(100, Math.ceil(lastFitsCharCountEstimate * 1.4)));

                while (low <= high) {
                  const mid = Math.floor((low + high) / 2);
                  p.innerHTML = parseInlineVerticalMarkdownCached(remainingText.substring(0, mid));

                  if (!checkOverflow()) {
                    fitsCharCount = mid;
                    low = mid + 1;
                  } else {
                    high = mid - 1;
                  }
                }

                if (fitsCharCount === high && high < remainingText.length) {
                  low = high + 1;
                  high = remainingText.length;
                  while (low <= high) {
                    const mid = Math.floor((low + high) / 2);
                    p.innerHTML = parseInlineVerticalMarkdownCached(remainingText.substring(0, mid));

                    if (!checkOverflow()) {
                      fitsCharCount = mid;
                      low = mid + 1;
                    } else {
                      high = mid - 1;
                    }
                  }
                }

                if (fitsCharCount === 0) {
                  currentArticle.removeChild(p);
                  currentArticle = nextArticle();
                } else {
                  lastFitsCharCountEstimate = fitsCharCount;
                  if (fitsCharCount < remainingText.length) {
                    let adjustedCount = fitsCharCount;

                    const isGyoutouKinsoku = (ch) => /[・、。，．？！?!：；・ー—–〜～ぁぃぅぇぉっゃゅょゎァィゥェォッャュょヮヵヶ\)\}\]］〕〉》〕】〞"’]/.test(ch);
                    const isDashOrLeader = (ch) => /[―…──]/.test(ch);

                    while (adjustedCount > 0) {
                      const nextChar = remainingText[adjustedCount];
                      const prevChar = remainingText[adjustedCount - 1];

                      const sliced = remainingText.substring(0, adjustedCount);
                      const openBrackets = (sliced.match(/《/g) || []).length;
                      const closeBrackets = (sliced.match(/》/g) || []).length;

                      if (openBrackets > closeBrackets) {
                        const lastOpen = sliced.lastIndexOf('《');
                        const pipeIndex = sliced.lastIndexOf('｜', lastOpen);
                        if (pipeIndex !== -1 && pipeIndex < lastOpen) {
                          adjustedCount = pipeIndex;
                        } else {
                          adjustedCount = lastOpen;
                        }
                        adjustedCount--;
                        continue;
                      }

                      if (isGyoutouKinsoku(nextChar)) {
                        adjustedCount--;
                        continue;
                      }

                      if (isDashOrLeader(prevChar) && isDashOrLeader(nextChar)) {
                        adjustedCount--;
                        continue;
                      }

                      const starCount = (sliced.match(/\*\*/g) || []).length;
                      if (starCount % 2 !== 0) {
                        const lastStar = sliced.lastIndexOf('**');
                        if (lastStar >= 0) {
                          adjustedCount = lastStar;
                          continue;
                        }
                      }

                      if (prevChar === '｜') {
                        adjustedCount--;
                        continue;
                      }

                      break;
                    }

                    if (adjustedCount > 0) {
                      fitsCharCount = adjustedCount;
                    }
                  }

                  p.innerHTML = parseInlineVerticalMarkdownCached(remainingText.substring(0, fitsCharCount));

                  const offset = item.text.length - remainingText.length;
                  const pieceStart = item.startIndex + offset;
                  const pieceEnd = pieceStart + fitsCharCount;
                  registerPageCharRange(pieceStart, pieceEnd);

                  remainingText = remainingText.substring(fitsCharCount);

                  if (remainingText.length > 0) {
                    currentArticle = nextArticle();
                    isFirstPiece = false;
                  }
                }
              }
            }
          }
        }

        flushCurrentPage();
        measurerContainer.innerHTML = "";

        isRendering = false;
        hideLoading();

        if (!isSyncForce) {
          renderAllPagesToDOM();

          const totalPages = generatedPagesCache.length;
          const pageWidth = getScaledPageWidthPx();

          if (viewport) {
            const restoredIdx = Math.max(0, Math.min(savedPageIndex, totalPages - 1));
            preservedPageIndex = restoredIdx;
            const scrollPos = isVertical ? -(restoredIdx * pageWidth) : (restoredIdx * pageWidth);
            viewport.scrollLeft = scrollPos;
          }
        }
      }

      function renderAllPagesToDOM() {
        if (!pagesContainer || generatedPagesCache.length === 0) return;
        const scale = getEffectiveScale();
        const pageWpx = getPageWidthPx();
        const GAP = 24;
        const effectivePageWidth = pageWpx * scale + GAP;
        const totalPages = generatedPagesCache.length;
        const isVertical = (els.writingModeSelect ? els.writingModeSelect.value : "vertical") === "vertical";

        pagesContainer.style.width = (totalPages * effectivePageWidth) + "px";
        pagesContainer.innerHTML = "";
        activePageDOMs.clear();

        const fragment = document.createDocumentFragment();
        for (let idx = 0; idx < totalPages; idx++) {
          const pageEl = createPageDOMFromData(generatedPagesCache[idx]);
          pageEl.style.position = "absolute";
          pageEl.style.top = "0";

          if (isVertical) {
            pageEl.style.right = "0";
            pageEl.style.left = "auto";
            pageEl.style.transformOrigin = "top right";
            pageEl.style.transform = `scale(${scale}) translateX(${-idx * (pageWpx + GAP / scale)}px)`;
          } else {
            pageEl.style.left = "0";
            pageEl.style.right = "auto";
            pageEl.style.transformOrigin = "top left";
            pageEl.style.transform = `scale(${scale}) translateX(${idx * (pageWpx + GAP / scale)}px)`;
          }

          fragment.appendChild(pageEl);
          activePageDOMs.set(idx, pageEl);
        }
        pagesContainer.appendChild(fragment);

        updatePageNavUI();
      }

      function updateColumnRuleVisibility() {
        if (columnRuleCol && els.columnSelect) {
          columnRuleCol.style.display = els.columnSelect.value === "2" ? "block" : "none";
        }
      }

      function updatePreview() {
        updateColumnRuleVisibility();
        updatePageStyle();
        updatePreviewScale();
        renderPagesWithPrecisePagination();
        saveToStorage();
      }

      function getDebounceMs() {
        if (!els.sourceText) return 300;
        const len = els.sourceText.value.length;
        if (len > 500000) return 1000;
        if (len > 200000) return 600;
        if (len > 50000) return 400;
        return 300;
      }

      function updateCharCount() {
        if (charCount && els.sourceText) {
          charCount.textContent = els.sourceText.value.length.toLocaleString("ja-JP") + "文字";
        }
      }

      function debounceUpdatePreview() {
        updateCharCount();
        if (charCount && els.sourceText) {
          charCount.textContent = els.sourceText.value.length.toLocaleString("ja-JP") + "文字";
        }
        showLoading();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          updatePreview();
          syncPageToEditor();
        }, getDebounceMs());
      }
      if (els.sourceText) {
        ['keyup', 'click', 'select', 'paste'].forEach(eventType => {
          els.sourceText.addEventListener(eventType, function () {
            if (eventType === 'paste') {
              // ★ペースト完了後に値が反映されるのを待ってから更新
              setTimeout(debounceUpdatePreview, 0);
            }
            syncPageToEditor();
          });
        });
      }

      if (els.fontSelect) {
        els.fontSelect.addEventListener("change", function () {
          if (customFontRow) {
            customFontRow.style.display = els.fontSelect.value === "custom" ? "flex" : "none";
          }
          updatePreview();
        });
      }

      if (els.themeSelect) {
        els.themeSelect.addEventListener("change", function () {
          document.documentElement.setAttribute("data-theme", els.themeSelect.value);
          saveToStorage();
        });
      }

      const CHANGE_EVENT_IDS = [
        "writingModeSelect", "bindingSelect", "pageSizeSelect", "columnSelect", "fontSizeSelect",
        "marginSelect", "gutterSelect", "headerDisplaySelect", "headerPosSelect", "headerSizeSelect",
        "nombrePosSelect", "columnRuleSelect", "nombreDisplaySelect", "nombreFormatSelect", "nombreTypeSelect"
      ];
      CHANGE_EVENT_IDS.forEach(id => {
        if (els[id]) els[id].addEventListener("change", updatePreview);
      });

      const INPUT_EVENT_IDS = [
        "customFontUrl", "customFontFamily", "startPageInput", "sourceText", "pageTitle", "pageHeader"
      ];
      INPUT_EVENT_IDS.forEach(id => {
        if (els[id]) els[id].addEventListener("input", debounceUpdatePreview);
      });

      // テキストエリアでのカーソル移動やキー入力、クリック時にプレビュー側を連動させる
      if (els.sourceText) {
        ['keyup', 'click', 'select'].forEach(eventType => {
          els.sourceText.addEventListener(eventType, function () {
            syncPageToEditor();
          });
        });
      }

      const insertBreakBtn = document.getElementById("insertBreakButton");
      if (insertBreakBtn) {
        insertBreakBtn.addEventListener("click", function () {
          if (!els.sourceText) return;
          const insertText = "\n[改ページ]\n";
          const start = els.sourceText.selectionStart;
          const end = els.sourceText.selectionEnd;
          els.sourceText.value = els.sourceText.value.substring(0, start) + insertText + els.sourceText.value.substring(end);
          els.sourceText.selectionStart = els.sourceText.selectionEnd = start + insertText.length;
          els.sourceText.focus();
          updatePreview();
        });
      }

      async function preparePrintDOM() {
        currentCalcToken++;
        await renderPagesWithPrecisePagination(true);

        if (!pagesContainer) return;
        pagesContainer.innerHTML = "";
        pagesContainer.style.width = "100%";
        activePageDOMs.clear();

        const fragment = document.createDocumentFragment();
        generatedPagesCache.forEach((data) => {
          const pageEl = createPageDOMFromData(data);
          pageEl.style.position = "relative";
          pageEl.style.right = "auto";
          pageEl.style.left = "auto";
          pageEl.style.top = "auto";
          pageEl.style.transform = "none";
          fragment.appendChild(pageEl);
        });
        pagesContainer.appendChild(fragment);
      }

      const printBtn = document.getElementById("printButton");
      if (printBtn) {
        printBtn.addEventListener("click", async function () {
          const titleInput = els.pageTitle ? els.pageTitle.value.trim() : "";
          const originalTitle = document.title;
          if (titleInput) {
            document.title = titleInput;
          }
          await preparePrintDOM();
          setTimeout(() => {
            window.print();
            setTimeout(() => {
              document.title = originalTitle;
              updatePreview();
            }, 1000);
          }, 50);
        });
      }

      const sampleBtn = document.getElementById("sampleButton");
      if (sampleBtn) {
        sampleBtn.addEventListener("click", function () {
          if (els.pageTitle) els.pageTitle.value = "言ノ葉Editer 取扱説明書";
          if (els.pageHeader) els.pageHeader.value = "～機能と特殊記法のご案内～";
          if (els.fontSelect) els.fontSelect.value = "noto";
          if (els.pageSizeSelect) els.pageSizeSelect.value = "B6";
          if (els.fontSizeSelect) els.fontSizeSelect.value = "9.5pt";

          if (els.sourceText) {
            els.sourceText.value = "『言ノ葉Editer』へようこそ。\n" +
              "本ツールは、Markdown記法や多彩な組版設定を用いて、小説、エッセイ、論文などを美しくレイアウト・プレビューできる縦書き・横書き対応のエディタです。\n\n" +
              "はじめての方に向けて、**Markdown記法**の使い方と、本ツールの**全機能の活用ガイド**を解説します。\n\n" +
              "## 1. 使えるMarkdown記法（初心者向けガイド）\n\n" +
              "Markdown（マークダウン）とは、シンプルな記号で文字を装飾する書き方です。以下のルールを覚えるだけで、美しく整った誌面が作れます。\n\n" +
              "・**見出し**：行頭に `#` をつけると見出しになります（例: `# 第1章`、`## 節タイトル`、`### 項`）。\n" +
              "・**太字**：強調したい文字を `**` で挟みます（例: `**重要な部分**`）。\n" +
              "・**斜体**：文字を `*` で挟みます（例: `*斜体の文字*`）\n" +
              " ※環境や日本語フォントによっては、正しく斜体で表示されない場合があります。\n" +
              "・**引用**：行頭に `>` をつけると引用文になります（例: `> 心に響く言葉`）。\n" +
              "・**水平線**：`-` を3つ以上並べると区切り線になります。\n\n" +
              "---\n\n" +
              "[改ページ]\n\n" +
              "## 2. 執筆を彩る特殊記法（ルビ・傍点・縦中横）\n\n" +
              "文芸・同人誌の執筆に欠かせない特殊な表現に対応しています。\n\n" +
              "・**ルビ（振り仮名）**：\n" +
              "`｜漢字《かんじ》` または `漢字《かんじ》` と記述します。\n" +
              "（例：麗《うるわ》しき｜言ノ葉《ことのは》）\n\n" +
              "・**傍点（ゴシック点など）**：\n" +
              "`《《強調したい文字列》》` と記述します。\n" +
              "（例：ここが《《最も大切なポイント》》です）\n\n" +
              "・**縦中横**：\n" +
              "縦書き時、半角数字（1〜2桁）や `!?` などの連続記号は、自動的に横向きに整列して読みやすくなります（例：12月 31日、!?、？！）。\n\n" +
              "・**テキスト配置**：\n" +
              "`[center]``[中央]``[中央寄せ]`のいずれかで一文を中央寄せ（上下中央）に配置します。\n\n" +
              "[center]中央寄せ（上下中央）サンプル\n\n" +
              "`[右]``[右寄せ]``[下]``[下寄せ]``[地]``[地寄せ]`のいずれかで一文を右側（下側）に配置します。\n\n" +
              "[右]右寄せ（下寄せ）サンプル\n\n" +
              "・**手動改ページ**：\n" +
              "独立した行に `[改ページ]` と記述するか、エディタ下の「改ページ挿入」ボタンで、任意の場所でページを強制的に区切ることができます。\n\n" +
              "[改ページ]\n\n" +
              "## 3. 組版・書字・用紙設定の使い方\n\n" +
              "左側パネルの「組版・表示設定」タブから、発行スタイルに合わせた詳細なレイアウト調整が可能です。\n\n" +
              "・**書字・綴じ方向**：縦書き（右綴じ・左綴じ）と横書きをワンタッチで切り替え可能。「のど（綴じ代）」を有効にすると、見開きページの左右交互に余白が自動調整されます。\n" +
              "・**用紙サイズ**：Ａ４からＢ５、Ａ５、Ｂ６、Ａ６、ハガキサイズまで幅広くサポート。\n" +
              "・**段組・境界線**：1段組のほか、文芸誌や資料に便利な2段組（実線/なしの境界線選択付き）を選べます。\n" +
              "・**フォント・テーマ**：しっぽり明朝、Noto Serif、さわらび明朝、システム明朝のほか、カスタムWebフォントの指定も可能。テーマはセピア、ライト、ダークから切り替えられます。\n\n" +
              "[改ページ]\n\n" +
              "## 4. ヘッダー・ノンブル詳細設定\n\n" +
              "書籍らしい体裁を整えるための高度な設定項目です。\n\n" +
              "・**ヘッダー（柱）**：表題や章名を全ページ、奇数/偶数ページ、あるいは小口側への左右交互に配置できます。位置（右上/中央/左上）や文字サイズも変更可能です。\n" +
              "・**ノンブル（ページ番号）**：算用数字（`1, 2, 3...`）のほか、縦書きに映える漢数字（`一, 二, 三...`）表記に対応。ハイフン（`- 1 -`）、丸括弧（`（ 1 ）`）、角括弧、スラッシュ、P.Nなどの装飾スタイルが選べます。\n\n" +
              "[改ページ]\n\n" +
              "## 5. 保存・インポート・印刷機能\n\n" +
              "・**自動保存・データ管理**：執筆中の文章はローカルストレージに自動保存されます。「保存」「開く」からテキスト・Markdownファイルの入出力も自由に行えます。\n" +
              "・**印刷・PDF保存**：画面右上の「印刷 / PDF保存」ボタンを押すだけで、余白やノンブルが整ったプレビュー通りの美しい印刷・PDF出力が実行できます。\n\n" +
              "> 『言ノ葉Editer』を活用して、あなたの素敵な作品を形にしてください。";
          }

          updatePreview();
        });
      }

      const clearBtn = document.getElementById("clearButton");
      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          if (confirm("入力した内容をすべて消去しますか？")) {
            if (els.pageTitle) els.pageTitle.value = "";
            if (els.pageHeader) els.pageHeader.value = "";
            if (els.sourceText) els.sourceText.value = "";
            localStorage.removeItem(STORAGE_KEY);
            updatePreview();
            if (els.sourceText) els.sourceText.focus();
          }
        });
      }

      if (viewport) {
        viewport.addEventListener('scroll', function () {
          if (isRendering || generatedPagesCache.length === 0) return;
          const pageWidth = getScaledPageWidthPx();
          const scrollPos = Math.abs(viewport.scrollLeft);
          const newIndex = Math.min(
            generatedPagesCache.length - 1,
            Math.max(0, Math.round(scrollPos / pageWidth))
          );
          if (preservedPageIndex !== newIndex) {
            preservedPageIndex = newIndex;
            updatePageNavUI();
            syncEditorToPage(preservedPageIndex);
          }
        });
      }

      const prevPageBtn = document.getElementById("prevPageBtn");
      const nextPageBtn = document.getElementById("nextPageBtn");
      const pageNavInfo = document.getElementById("pageNavInfo");

      function scrollToCurrentPage() {
        const pageWidth = getScaledPageWidthPx();
        const isVertical = (els.writingModeSelect ? els.writingModeSelect.value : "vertical") === "vertical";
        if (viewport) {
          const scrollPos = isVertical ? -(preservedPageIndex * pageWidth) : (preservedPageIndex * pageWidth);
          viewport.scrollTo({
            left: scrollPos,
            behavior: 'smooth'
          });
        }
        updatePageNavUI();
        syncEditorToPage(preservedPageIndex);
      }

      function updatePageNavUI() {
        if (!pageNavInfo) return;
        const totalPages = generatedPagesCache.length || 1;
        const currentIdx = Math.max(0, Math.min(preservedPageIndex, totalPages - 1));
        const currentPageNum = currentIdx + 1;
        const isVertical = (els.writingModeSelect ? els.writingModeSelect.value : "vertical") === "vertical";

        pageNavInfo.textContent = currentPageNum + " / " + totalPages + " ページ";

        if (isVertical) {
          if (prevPageBtn) {
            prevPageBtn.disabled = (currentIdx >= totalPages - 1);
            prevPageBtn.textContent = "◀";
            prevPageBtn.title = "次のページ（左へ）";
          }
          if (nextPageBtn) {
            nextPageBtn.disabled = (currentIdx <= 0);
            nextPageBtn.textContent = "▶";
            nextPageBtn.title = "前のページ（右へ）";
          }
        } else {
          if (prevPageBtn) {
            prevPageBtn.disabled = (currentIdx <= 0);
            prevPageBtn.textContent = "◀";
            prevPageBtn.title = "前のページ（左へ）";
          }
          if (nextPageBtn) {
            nextPageBtn.disabled = (currentIdx >= totalPages - 1);
            nextPageBtn.textContent = "▶";
            nextPageBtn.title = "次のページ（右へ）";
          }
        }
      }

      if (prevPageBtn) {
        prevPageBtn.addEventListener("click", function () {
          const isVertical = (els.writingModeSelect ? els.writingModeSelect.value : "vertical") === "vertical";
          if (isVertical) {
            preservedPageIndex = Math.min((generatedPagesCache.length || 1) - 1, preservedPageIndex + 1);
          } else {
            preservedPageIndex = Math.max(0, preservedPageIndex - 1);
          }
          scrollToCurrentPage();
        });
      }

      if (nextPageBtn) {
        nextPageBtn.addEventListener("click", function () {
          const isVertical = (els.writingModeSelect ? els.writingModeSelect.value : "vertical") === "vertical";
          if (isVertical) {
            preservedPageIndex = Math.max(0, preservedPageIndex - 1);
          } else {
            preservedPageIndex = Math.min((generatedPagesCache.length || 1) - 1, preservedPageIndex + 1);
          }
          scrollToCurrentPage();
        });
      }

      let resizeTimer = null;
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          updatePreview();
        }, 200);
      });

      loadFromStorage();
      updateCharCount();
      updateColumnRuleVisibility();
      updatePageStyle();
      updatePreviewScale();
      renderPagesWithPrecisePagination();
    });
