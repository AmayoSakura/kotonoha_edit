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
  const subtabButtons = document.querySelectorAll(".editor-subtab-btn");
  const subtabPanes = document.querySelectorAll(".editor-subpane");
  subtabButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      subtabButtons.forEach((b) => b.classList.remove("active"));
      subtabPanes.forEach((p) => p.classList.remove("active"));
      this.classList.add("active");
      const target = document.getElementById(this.dataset.target);
      if (target) target.classList.add("active");
      if (this.dataset.target === "subpane-cover") {
        jumpToPageTypeInPreview("cover");
      } else if (this.dataset.target === "subpane-colophon") {
        jumpToPageTypeInPreview("colophon");
      }
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
    nombreSizeSelect: "nombreSize",
    nombreTypeSelect: "nombreType",
    coverEnableToggle: "coverEnable",
    coverTitleInput: "coverTitle",
    coverSubtitleInput: "coverSubtitle",
    coverAuthorInput: "coverAuthor",
    coverTemplateSelect: "coverTemplate",
    coverFrameSelect: "coverFrame",
    coverTitleFontSelect: "coverTitleFont",
    coverSubtitleFontSelect: "coverSubtitleFont",
    coverAuthorFontSelect: "coverAuthorFont",
    coverTitleSizeSelect: "coverTitleSize",
    coverSubtitleSizeSelect: "coverSubtitleSize",
    coverAuthorSizeSelect: "coverAuthorSize",
    coverDividerToggle: "coverDivider",
    coverDividerLengthSelect: "coverDividerLength",
    coverGapSelect: "coverGap",
    colophonEnableToggle: "colophonEnable",
    colophonTitleInput: "colophonTitle",
    colophonDateInput: "colophonDate",
    colophonAuthorInput: "colophonAuthor",
    colophonCircleInput: "colophonCircle",
    colophonContactInput: "colophonContact",
    colophonPrinterInput: "colophonPrinter",
    colophonNoteInput: "colophonNote",
    colophonTitleFontSelect: "colophonTitleFont",
    colophonFieldsFontSelect: "colophonFieldsFont",
    colophonNoteFontSelect: "colophonNoteFont",
    colophonTitleSizeSelect: "colophonTitleSize",
    colophonFieldsSizeSelect: "colophonFieldsSize",
    colophonNoteSizeSelect: "colophonNoteSize",
    colophonTemplateSelect: "colophonTemplate",
    colophonWritePosSelect: "colophonWritePos",
    colophonVertPosSelect: "colophonVertPos",
    colophonAlignSelect: "colophonAlign",
  };
  const els = {};
  Object.keys(CONFIG_KEYS).forEach((id) => {
    els[id] = document.getElementById(id);
  });
  const customFontRow = document.getElementById("customFontRow");
  const customMarginRow = document.getElementById("customMarginRow");
  const gutterWidthRow = document.getElementById("gutterWidthRow");
  const columnRuleCol = document.getElementById("columnRuleCol");
  const coverFieldsGroup = document.getElementById("coverFieldsGroup");
  const colophonFieldsGroup = document.getElementById("colophonFieldsGroup");
  els.undoButton = document.getElementById("undoButton");
  els.redoButton = document.getElementById("redoButton");
  const charCount = document.getElementById("charCount");
  const pagesContainer = document.getElementById("pagesContainer");
  const layoutSpinner = document.getElementById("layoutSpinner");
  const previewViewport = document.getElementById("previewViewport");
  const pageSizeStyle = document.getElementById("page-size-style");
  const fileInput = document.getElementById("fileInput");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const pageNavStatus = document.getElementById("pageNavStatus");
  const firstPageBtn = document.getElementById("firstPageBtn");
  const lastPageBtn = document.getElementById("lastPageBtn");
  const pageJumpInput = document.getElementById("pageJumpInput");
  const syncToggle = document.getElementById("syncToggle");
  const STORAGE_KEY = "md_vertical_editor_draft_v09_" + location.pathname;
  let debounceTimer = null;
  let computedPagesData = [];
  let currentPageIndex = 0;
  let isTyping = false;
  let typingIdleTimer = null;
  const UNDO_LIMIT = 5;
  let undoStack = [];
  let redoStack = [];
  let undoDebounceTimer = null;
  let lastSnapshot = null;
  function markTypingActive() {
    isTyping = true;
    clearTimeout(typingIdleTimer);
    typingIdleTimer = setTimeout(() => {
      isTyping = false;
    }, 250);
  }
  function updateUndoRedoButtons() {
    if (els.undoButton) els.undoButton.disabled = undoStack.length === 0;
    if (els.redoButton) els.redoButton.disabled = redoStack.length === 0;
  }
  function pushUndoSnapshot(previousValue) {
    undoStack.push(previousValue);
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    redoStack = [];
    updateUndoRedoButtons();
  }
  function scheduleUndoSnapshot() {
    if (lastSnapshot === null) lastSnapshot = els.sourceText.value;
    clearTimeout(undoDebounceTimer);
    undoDebounceTimer = setTimeout(() => {
      const current = els.sourceText.value;
      if (current !== lastSnapshot) {
        pushUndoSnapshot(lastSnapshot);
      }
      lastSnapshot = current;
    }, 600);
  }
  function performUndo() {
    if (undoStack.length === 0) return;
    clearTimeout(undoDebounceTimer);
    const current = els.sourceText.value;
    const previous = undoStack.pop();
    redoStack.push(current);
    if (redoStack.length > UNDO_LIMIT) redoStack.shift();
    els.sourceText.value = previous;
    lastSnapshot = previous;
    updateUndoRedoButtons();
    updatePreview();
  }
  function performRedo() {
    if (redoStack.length === 0) return;
    clearTimeout(undoDebounceTimer);
    const current = els.sourceText.value;
    const next = redoStack.pop();
    undoStack.push(current);
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    els.sourceText.value = next;
    lastSnapshot = next;
    updateUndoRedoButtons();
    updatePreview();
  }
  let syncEnabled = true;
  function findPageIndexForSrcIndex(srcIndex) {
    const pagesWithIndex = computedPagesData
      .map((page, idx) => ({ idx, startSrcIndex: page.startSrcIndex }))
      .filter((p) => p.startSrcIndex !== undefined);
    if (pagesWithIndex.length === 0) return 0;
    if (srcIndex <= pagesWithIndex[0].startSrcIndex) {
      return pagesWithIndex[0].idx;
    }
    let lo = 0;
    let hi = pagesWithIndex.length - 1;
    let result = pagesWithIndex[0].idx;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (pagesWithIndex[mid].startSrcIndex <= srcIndex) {
        result = pagesWithIndex[mid].idx;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return result;
  }
  const mobileLayoutQuery = window.matchMedia("(max-width: 1100px)");
  function getPagesPerView() {
    return mobileLayoutQuery.matches ? 1 : 2;
  }
  mobileLayoutQuery.addEventListener("change", function () {
    renderCurrentPages();
  });
  function getSpreadStartIndex(pageIndex, pagesPerView) {
    if (pagesPerView !== 2) return pageIndex;
    if (pageIndex <= 0) return 0;
    return pageIndex % 2 === 1 ? pageIndex : pageIndex - 1;
  }
  function getSpreadPageCount(startIndex, total, pagesPerView) {
    if (pagesPerView !== 2) return 1;
    if (startIndex === 0) return 1;
    const remaining = total - startIndex;
    return Math.min(2, Math.max(1, remaining));
  }
  function getNextSpreadStartIndex(startIndex, total, pagesPerView) {
    if (pagesPerView !== 2) {
      return startIndex + 1 < total ? startIndex + 1 : null;
    }
    const count = getSpreadPageCount(startIndex, total, pagesPerView);
    const next = startIndex + count;
    return next < total ? next : null;
  }
  function getPrevSpreadStartIndex(startIndex, total, pagesPerView) {
    if (pagesPerView !== 2) {
      return startIndex - 1 >= 0 ? startIndex - 1 : null;
    }
    if (startIndex <= 0) return null;
    if (startIndex === 1) return 0;
    return startIndex - 2;
  }
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
    mplus1p: '"M PLUS 1p", "Hiragino Sans", sans-serif',
    rocknroll: '"RocknRoll One", "Hiragino Sans", sans-serif',
    plexjpregular: '"IBM Plex Sans JP", "Hiragino Sans", sans-serif',
    lineseedregular: '"LINE Seed JP", "Hiragino Sans", sans-serif',
    klee: '"Klee One", "Hiragino Mincho ProN", serif',
    yomogi: '"Yomogi", "Hiragino Mincho ProN", serif',
  };
  const FONT_WEIGHTS = {
    plexjpregular: "400",
    lineseedregular: "400",
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
    if (syncToggle) data.syncEnabled = syncToggle.checked;
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
      if (data.syncEnabled !== undefined && syncToggle) {
        syncToggle.checked = data.syncEnabled;
        syncEnabled = data.syncEnabled;
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
    let selectedFontWeight = FONT_WEIGHTS[els.fontSelect.value] || "normal";
    if (els.fontSelect.value === "custom") {
      selectedFont = els.customFontFamily.value.trim() || "serif";
      selectedFontWeight = "normal";
      const url = els.customFontUrl.value.trim();
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
      "--doc-font-weight",
      selectedFontWeight,
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
    const pageBreakPattern =
      /(?:\n|^)\s*(?:\[改ページ\]|<!--\s*pagebreak\s*-->)\s*(?=\n|$)/gi;
    const sectionRanges = [];
    let lastEnd = 0;
    let m;
    while ((m = pageBreakPattern.exec(normalized)) !== null) {
      sectionRanges.push({ start: lastEnd, end: m.index });
      lastEnd = m.index + m[0].length;
      if (m[0].length === 0) pageBreakPattern.lastIndex++;
    }
    sectionRanges.push({ start: lastEnd, end: normalized.length });
    const sections = [];
    for (let si = 0; si < sectionRanges.length; si++) {
      const { start: sectionStart, end: sectionEnd } = sectionRanges[si];
      const sectionStr = normalized.slice(sectionStart, sectionEnd);
      const items = [];
      let lineOffset = 0;
      const rawLines = sectionStr.split("\n");
      rawLines.forEach((line, lineIdx) => {
        const lineStartInSection = lineOffset;
        lineOffset += line.length + 1;
        const lineAbsStart = sectionStart + lineStartInSection;
        const trimmed = line.trim();
        if (trimmed === "") {
          items.push({ type: "empty", startIndex: lineAbsStart });
          return;
        }
        const leadingWs = line.length - line.trimStart().length;
        let textToParse = trimmed;
        let localOffset = 0;
        let align = null;
        const centerMatch = textToParse.match(
          /^(?:\[(?:中央|center)\]|［(?:中央|center)］)\s*(.*)$/i,
        );
        const rightMatch = textToParse.match(
          /^(?:\[(?:右|right)\]|［(?:右|right)］)\s*(.*)$/i,
        );
        const noIndentMatch = textToParse.match(
          /^(?:\[(?:字下げなし|noindent)\]|［(?:字下げなし|noindent)］)\s*(.*)$/i,
        );
        const forceIndentMatch = textToParse.match(
          /^(?:\[(?:字下げあり|indent)\]|［(?:字下げあり|indent)］)\s*(.*)$/i,
        );
        let forceIndent = null;
        if (noIndentMatch) {
          forceIndent = false;
          localOffset += textToParse.length - noIndentMatch[1].length;
          textToParse = noIndentMatch[1];
        } else if (forceIndentMatch) {
          forceIndent = true;
          localOffset += textToParse.length - forceIndentMatch[1].length;
          textToParse = forceIndentMatch[1];
        }
        if (centerMatch) {
          align = "center";
          localOffset += textToParse.length - centerMatch[1].length;
          textToParse = centerMatch[1];
        } else if (rightMatch) {
          align = "right";
          localOffset += textToParse.length - rightMatch[1].length;
          textToParse = rightMatch[1];
        }
        const heading = textToParse.match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
          const headingPrefixLen = textToParse.length - heading[2].length;
          items.push({
            type: "heading",
            level: heading[1].length,
            text: heading[2].trim(),
            align: align,
            startIndex:
              lineAbsStart + leadingWs + localOffset + headingPrefixLen,
          });
          return;
        }
        if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(textToParse)) {
          items.push({
            type: "hr",
            startIndex: lineAbsStart + leadingWs + localOffset,
          });
          return;
        }
        const quote = textToParse.match(/^>\s?(.*)$/);
        if (quote) {
          const quotePrefixLen = textToParse.length - quote[1].length;
          items.push({
            type: "quote",
            text: quote[1],
            align: align,
            startIndex: lineAbsStart + leadingWs + localOffset + quotePrefixLen,
          });
          return;
        }
        const isBracket = /^[「『（【〔〈《“‘]/.test(textToParse);
        items.push({
          type: "p",
          isBracket,
          forceIndent,
          text: textToParse,
          align: align,
          startIndex: lineAbsStart + leadingWs + localOffset,
        });
      });
      if (items.length > 0) sections.push(items);
    }
    return sections;
  }
  let measureContainerEl = null;
  function getMeasureContainer() {
    if (measureContainerEl && document.body.contains(measureContainerEl)) {
      return measureContainerEl;
    }
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.top = "-99999px";
    wrapper.style.left = "-99999px";
    wrapper.style.visibility = "hidden";
    wrapper.style.pointerEvents = "none";
    const article = document.createElement("article");
    article.className = "md-body";
    article.style.width = "2000px";
    article.style.height = "2000px";
    wrapper.appendChild(article);
    document.body.appendChild(wrapper);
    measureContainerEl = article;
    return measureContainerEl;
  }
  let editorMirrorDivEl = null;
  function getEditorMirrorDiv() {
    if (editorMirrorDivEl && document.body.contains(editorMirrorDivEl)) {
      return editorMirrorDivEl;
    }
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.top = "-99999px";
    div.style.left = "-99999px";
    div.style.visibility = "hidden";
    div.style.pointerEvents = "none";
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";
    document.body.appendChild(div);
    editorMirrorDivEl = div;
    return editorMirrorDivEl;
  }
  function syncEditorMirrorStyle(mirror) {
    const cs = window.getComputedStyle(els.sourceText);
    const propsToCopy = [
      "font-family",
      "font-size",
      "font-weight",
      "line-height",
      "letter-spacing",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "tab-size",
    ];
    propsToCopy.forEach((prop) => {
      mirror.style.setProperty(prop, cs.getPropertyValue(prop));
    });
    const paddingLeft = parseFloat(cs.paddingLeft) || 0;
    const paddingRight = parseFloat(cs.paddingRight) || 0;
    const contentWidth =
      els.sourceText.clientWidth - paddingLeft - paddingRight;
    mirror.style.boxSizing = "content-box";
    mirror.style.border = "none";
    mirror.style.width = Math.max(0, contentWidth) + "px";
  }
  let measureCache = new Map();
  function resetMeasureCache() {
    measureCache = new Map();
  }
  function measureLineHeightPx(candidateRaw, hasIndent) {
    const cacheKey = (hasIndent ? "1|" : "0|") + candidateRaw;
    if (measureCache.has(cacheKey)) return measureCache.get(cacheKey);
    const container = getMeasureContainer();
    const p = document.createElement("p");
    if (!hasIndent) p.className = "no-indent";
    p.innerHTML = parseInlineVerticalMarkdown(candidateRaw);
    container.innerHTML = "";
    container.appendChild(p);
    const height = p.getBoundingClientRect().height;
    measureCache.set(cacheKey, height);
    return height;
  }
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  const charWidthCache = new Map();
  let lineDataCache = new Map();
  let lastLayoutConfigKey = null;
  function computeLayoutWithCanvas(text) {
    resetMeasureCache();
    const pageSize =
      PAGE_SIZES_MM[els.pageSizeSelect.value] || PAGE_SIZES_MM["A4"];
    const margin = getCurrentMarginMm();
    const fontSizePx = ptToPx(els.fontSizeSelect.value);
    const isTwoColumn = els.columnSelect.value === "2";
    const isGutterOn = els.gutterSelect && els.gutterSelect.value === "on";
    const docFontFamily =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--doc-font-family",
      ) || "serif";
    const docFontWeight = (
      getComputedStyle(document.documentElement).getPropertyValue(
        "--doc-font-weight",
      ) || "normal"
    ).trim();
    function measureCharWidth(ch, scale) {
      const cacheKey =
        docFontFamily +
        "|" +
        docFontWeight +
        "|" +
        fontSizePx.toFixed(2) +
        "|" +
        ch +
        "|" +
        scale.toFixed(4);
      if (charWidthCache.has(cacheKey)) return charWidthCache.get(cacheKey);
      measureCtx.font =
        docFontWeight +
        " " +
        (fontSizePx * scale).toFixed(2) +
        "px " +
        docFontFamily;
      const w = measureCtx.measureText(ch).width;
      charWidthCache.set(cacheKey, w);
      return w;
    }
    const paperHPx = mmToPx(pageSize.h);
    const paperWPx = mmToPx(pageSize.w);
    const marginVPx = mmToPx(margin.v);
    const marginHPx = mmToPx(margin.h);
    const innerHPx = paperHPx - marginVPx * 2;
    let colHPx = innerHPx;
    if (isTwoColumn) {
      colHPx = innerHPx / 2 - mmToPx(3);
    }
    const gutterWidth = isGutterOn ? mmToPx(getCurrentGutterWidthMm()) : 0;
    const colWPx = paperWPx - marginHPx * 2 - gutterWidth;
    const lineSpacingPx = fontSizePx * 1.8;
    const maxLinesPerCol = Math.max(1, Math.floor(colWPx / lineSpacingPx));
    const fontsStatus =
      document.fonts && document.fonts.status
        ? document.fonts.status
        : "unknown";
    const layoutConfigKey = [
      docFontFamily,
      docFontWeight,
      fontSizePx.toFixed(2),
      colHPx.toFixed(2),
      colWPx.toFixed(2),
      isTwoColumn ? "2col" : "1col",
      fontsStatus,
    ].join("|");
    if (layoutConfigKey !== lastLayoutConfigKey) {
      lineDataCache = new Map();
      lastLayoutConfigKey = layoutConfigKey;
    }
    function getCharHeight(ch, fontScale = 1.0) {
      if (/[a-zA-Z0-9\s]/.test(ch)) return fontSizePx * 0.65 * fontScale;
      const measured = measureCharWidth(ch, fontScale);
      if (!measured || !isFinite(measured) || measured <= 0) {
        return fontSizePx * fontScale;
      }
      return measured;
    }
    const INLINE_CODE_FONT_SCALE = 0.88;
    const INLINE_CODE_PADDING_PX = 2;
    function enforceKinsokuInvariant(lines) {
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.chars || line.chars.length === 0) continue;
        let pushCount = 0;
        while (pushCount < line.chars.length) {
          const candidate = line.chars[pushCount];
          const candidateFirstCh = candidate.display[0];
          if (!isKinsokuHead(candidateFirstCh)) break;
          pushCount++;
        }
        if (pushCount === 0 || pushCount >= line.chars.length) continue;
        const moved = line.chars.slice(0, pushCount);
        const prevLine = lines[i - 1];
        prevLine.chars = prevLine.chars.concat(moved);
        prevLine.raw = prevLine.chars.map((c) => c.raw).join("");
        line.chars = line.chars.slice(pushCount);
        line.raw = line.chars.map((c) => c.raw).join("");
        line.startOffset = line.chars[0].srcIndex;
      }
      return lines;
    }
    function parseTextTokens(str) {
      const tokens = [];
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
        tokens.push({ raw, display, startOffset: match.index });
      }
      return tokens;
    }
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
    function enforceKinsokuOnFinalize(chars, charItems, nextIdx) {
      if (chars.length === 0) return { chars, pushedBack: 0 };
      let working = chars.slice();
      let pushedBack = 0;
      let idx = nextIdx;
      function violatesTail() {
        if (working.length === 0) return false;
        const lastItem = working[working.length - 1];
        const lastDisplay = lastItem.display;
        const lastCh = lastDisplay[lastDisplay.length - 1];
        return isKinsokuTail(lastCh);
      }
      function violatesHead() {
        if (idx >= charItems.length) return false;
        const nextDisplay = charItems[idx].display;
        return isKinsokuHead(nextDisplay[0]);
      }
      while (working.length > 1 && (violatesTail() || violatesHead())) {
        working = working.slice(0, -1);
        idx--;
        pushedBack++;
      }
      return { chars: working, pushedBack };
    }
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
      let forcedAddCount = 0;
      const FORCED_ADD_LIMIT = 5;
      const rawOf = (arr) => arr.map((c) => c.raw).join("");
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
            srcIndex: tok.startOffset,
            srcLength: tok.raw.length,
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
            const isFirst = i === 0;
            const isLast = i === text.length - 1;
            let srcLength = 1;
            if (isFirst) srcLength += prefix.length;
            if (isLast) srcLength += suffix.length;
            const srcIndex =
              tok.startOffset + (isFirst ? 0 : prefix.length) + i;
            charItems.push({
              raw: prefix ? prefix + ch + suffix : ch,
              display: ch,
              isAtomic: false,
              isCode: isCode,
              isCodeStart: isCode && i === 0,
              srcIndex: srcIndex,
              srcLength: srcLength,
            });
          }
        }
      });
      const lines = [];
      let currentRaw = "";
      let currentH = 0;
      let currentChars = [];
      const indentPx = hasIndent ? fontSizePx * fontScale : 0;
      for (let i = 0; i < charItems.length; i++) {
        const item = charItems[i];
        const effectiveColHPx =
          hasIndent && lines.length === 0 ? colHPx - indentPx : colHPx;
        let itemH = 0;
        if (item.isCode) {
          for (let c = 0; c < item.display.length; c++) {
            itemH += getCharHeight(
              item.display[c],
              fontScale * INLINE_CODE_FONT_SCALE,
            );
          }
          if (item.isCodeStart) {
            itemH += INLINE_CODE_PADDING_PX;
          }
        } else if (item.isRuby) {
          for (let c = 0; c < item.display.length; c++) {
            itemH += getCharHeight(item.display[c], fontScale);
          }
        } else if (item.isNobreak) {
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
            lines.push({
              raw: currentRaw,
              startOffset: item.srcIndex,
              chars: currentChars.slice(),
            });
            currentRaw = "";
            currentH = 0;
            currentChars = [];
            continue;
          }
          let pushBackCount = 0;
          const nextChar = item.display[0];
          if (isKinsokuHead(nextChar) && currentChars.length > 1) {
            pushBackCount = 1;
            while (pushBackCount < currentChars.length) {
              const candidateItem =
                currentChars[currentChars.length - pushBackCount];
              const candidateCh = candidateItem.display[0];
              if (!isKinsokuHead(candidateCh)) break;
              pushBackCount++;
            }
          }
          const lastItem = currentChars[currentChars.length - 1];
          const lastChar = lastItem.display[lastItem.display.length - 1];
          if (isKinsokuTail(lastChar) && currentChars.length > 1) {
            pushBackCount = Math.max(pushBackCount, 1);
          }
          let forceIncludeOverflow = false;
          if (pushBackCount >= currentChars.length) {
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
            const guarded = enforceKinsokuOnFinalize(
              currentChars,
              charItems,
              i + 1,
            );
            if (guarded.pushedBack > 0) {
              currentChars = guarded.chars;
              i -= guarded.pushedBack;
            }
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
            lines.push({
              raw: currentRaw,
              startOffset: currentChars[0].srcIndex,
              chars: currentChars.slice(),
            });
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
            const guarded = enforceKinsokuOnFinalize(
              currentChars,
              charItems,
              i,
            );
            if (guarded.pushedBack > 0) {
              currentChars = guarded.chars;
              i -= guarded.pushedBack;
            }
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
            lines.push({
              raw: currentRaw,
              startOffset: currentChars[0].srcIndex,
              chars: currentChars.slice(),
            });
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
        lines.push({
          raw: currentRaw,
          startOffset: currentChars[0].srcIndex,
          chars: currentChars.slice(),
        });
      }
      return enforceKinsokuInvariant(lines);
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
      if (
        currentPage.startSrcIndex === undefined &&
        lineObj.srcIndex !== undefined
      ) {
        currentPage.startSrcIndex = lineObj.srcIndex;
      }
      currentLines.push(lineObj);
      currentLineWidth += widthCost;
    }
    const usedKeysThisRun = new Set();
    function getLinesWithCache(cacheKey, rawText, fontScale, hasIndent) {
      usedKeysThisRun.add(cacheKey);
      const cached = lineDataCache.get(cacheKey);
      if (cached) return cached;
      const result = splitTextToLines(rawText, fontScale, hasIndent);
      lineDataCache.set(cacheKey, result);
      return result;
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
          addLineToPage({ type: "empty", srcIndex: item.startIndex }, 1);
        } else if (item.type === "heading") {
          const scales = { 1: 1.8, 2: 1.3, 3: 1.1 };
          const costs = { 1: 2.5, 2: 1.8, 3: 1.4 };
          const scale = scales[item.level] || 1.0;
          const cost = costs[item.level] || 1.2;
          const hCacheKey =
            "heading|" +
            item.level +
            "|" +
            (item.align || "") +
            "|" +
            item.text;
          const hLines = getLinesWithCache(hCacheKey, item.text, scale);
          hLines.forEach((hLine) => {
            addLineToPage(
              {
                type: "heading",
                level: item.level,
                text: hLine.raw,
                align: item.align,
                srcIndex: item.startIndex + hLine.startOffset,
              },
              cost,
            );
          });
        } else if (item.type === "hr") {
          addLineToPage({ type: "hr", srcIndex: item.startIndex }, 1);
        } else if (item.type === "quote") {
          const qCacheKey = "quote|" + (item.align || "") + "|" + item.text;
          const qLines = getLinesWithCache(qCacheKey, item.text, 0.95);
          qLines.forEach((qLine, qIdx) => {
            addLineToPage(
              {
                type: "quote",
                text: qLine.raw,
                align: item.align,
                isContinuation: qIdx > 0,
                srcIndex: item.startIndex + qLine.startOffset,
              },
              1.25,
            );
          });
        } else if (item.type === "p") {
          const pHasIndent =
            item.forceIndent !== null && item.forceIndent !== undefined
              ? item.forceIndent
              : !item.isBracket && !item.align;
          const pCacheKey =
            "p|" +
            (item.isBracket ? "1" : "0") +
            "|" +
            (item.align || "") +
            "|" +
            (pHasIndent ? "1" : "0") +
            "|" +
            item.text;
          const pLines = getLinesWithCache(
            pCacheKey,
            item.text,
            1.0,
            pHasIndent,
          );
          pLines.forEach((pLine, idx) => {
            addLineToPage(
              {
                type: "p",
                text: pLine.raw,
                isBracket: item.isBracket,
                isIndent: idx === 0 && pHasIndent,
                align: item.align,
                srcIndex: item.startIndex + pLine.startOffset,
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
    for (const key of lineDataCache.keys()) {
      if (!usedKeysThisRun.has(key)) lineDataCache.delete(key);
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
  const KANJI_DIGITS = [
    "〇",
    "一",
    "二",
    "三",
    "四",
    "五",
    "六",
    "七",
    "八",
    "九",
  ];
  function toKanjiDigits(num) {
    return String(num)
      .split("")
      .map((ch) => (KANJI_DIGITS[ch] !== undefined ? KANJI_DIGITS[ch] : ch))
      .join("");
  }
  // 位取り記数法の漢数字表記（例：10→十、21→二十一、123→百二十三）。千の位まで対応。
  const KANJI_UNITS = ["", "十", "百", "千"];
  function toKanjiPositional(num) {
    if (num === 0) return "〇";
    let n = num;
    let result = "";
    for (let unitIdx = 3; unitIdx >= 0; unitIdx--) {
      const place = Math.pow(10, unitIdx);
      const digit = Math.floor(n / place);
      n %= place;
      if (digit === 0) continue;
      // 「一十」「一百」「一千」は「十」「百」「千」と表記する（位が1の場合、頭の「一」を省略）
      if (digit === 1 && unitIdx > 0) {
        result += KANJI_UNITS[unitIdx];
      } else {
        result += KANJI_DIGITS[digit] + KANJI_UNITS[unitIdx];
      }
    }
    return result || "〇";
  }
  const ROMAN_TABLE = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  function toRomanNumeral(num) {
    let n = num;
    let result = "";
    for (const [value, symbol] of ROMAN_TABLE) {
      while (n >= value) {
        result += symbol;
        n -= value;
      }
    }
    return result || String(num);
  }
  function renderBlankPageDom(pageEl, pageData) {
    pageEl.className = "paper-page";
    pageEl.innerHTML = "";
  }
  function renderCoverPageDom(pageEl, pageData) {
    const frameClass = " cover-frame-" + (pageData.coverFrame || "none");
    const templateClass =
      " cover-tpl-" + (pageData.coverTemplate || "vertical-center");
    pageEl.className =
      "paper-page front-matter-page cover-page" + frameClass + templateClass;
    const title = escapeHtml(pageData.coverTitle || "");
    const titleFont = FONTS[pageData.coverTitleFont] || FONTS.noto;
    const subtitleFont = FONTS[pageData.coverSubtitleFont] || FONTS.noto;
    const authorFont = FONTS[pageData.coverAuthorFont] || FONTS.noto;
    const titleSize = pageData.coverTitleSize || "1.6";
    const subtitleSize = pageData.coverSubtitleSize || "0.9";
    const authorSize = pageData.coverAuthorSize || "0.85";
    const subtitle = pageData.coverSubtitle
      ? `<div class="cover-subtitle" style='font-family:${subtitleFont};font-size:${subtitleSize}em'>${escapeHtml(pageData.coverSubtitle)}</div>`
      : "";
    const author = pageData.coverAuthor
      ? `<div class="cover-author" style='font-family:${authorFont};font-size:${authorSize}em'>${escapeHtml(pageData.coverAuthor)}</div>`
      : "";
    const divider =
      pageData.coverDivider && pageData.coverAuthor
        ? `<div class="cover-divider" style="--divider-length:${pageData.coverDividerLength || 60}%"></div>`
        : "";
    const corners =
      pageData.coverFrame === "corner" ||
      pageData.coverFrame === "corner-sumitate"
        ? '<div class="cover-corner cover-corner-tl"></div>' +
          '<div class="cover-corner cover-corner-tr"></div>' +
          '<div class="cover-corner cover-corner-bl"></div>' +
          '<div class="cover-corner cover-corner-br"></div>'
        : pageData.coverFrame === "double-corner-point"
          ? '<div class="cover-corner-point cover-corner-point-tl"></div>' +
            '<div class="cover-corner-point cover-corner-point-tr"></div>' +
            '<div class="cover-corner-point cover-corner-point-bl"></div>' +
            '<div class="cover-corner-point cover-corner-point-br"></div>'
          : "";
    const gap = pageData.coverGap || "1.2";
    pageEl.innerHTML =
      corners +
      `<div class="cover-content" style="--cover-gap:${gap}em">` +
      `<div class="cover-title" style='font-family:${titleFont};font-size:${titleSize}em'>${title}</div>` +
      subtitle +
      divider +
      author +
      "</div>";
  }
  function wrapColonForVertical(labelText) {
    // 全角コロン「：」は縦書き時に縦長に伸びて見えるため、90度回転させて横向きに固定する
    return labelText.replace(/：/g, '<span class="tcy-colon">：</span>');
  }
  function parseSimpleNoteMarkdown(text) {
    // 自由記載欄用の軽量パーサー。ページ送り等は扱わず、行ごとの寄せ記法とインライン装飾のみに対応する
    if (!text) return "";
    const lines = text.split(/\r\n|\r|\n/);
    return lines
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed === "")
          return '<div class="note-line note-empty">&nbsp;</div>';
        let align = null;
        let body = trimmed;
        const centerMatch = body.match(
          /^(?:\[(?:中央|center)\]|［(?:中央|center)］)\s*(.*)$/i,
        );
        const rightMatch = body.match(
          /^(?:\[(?:右|right)\]|［(?:右|right)］)\s*(.*)$/i,
        );
        if (centerMatch) {
          align = "center";
          body = centerMatch[1];
        } else if (rightMatch) {
          align = "right";
          body = rightMatch[1];
        }
        const alignClass = align ? ` align-${align}` : "";
        return `<div class="note-line${alignClass}">${parseInlineVerticalMarkdown(body)}</div>`;
      })
      .join("");
  }
  function renderColophonPageDom(pageEl, pageData) {
    const templateClass =
      " colophon-tpl-" + (pageData.colophonTemplate || "vertical");
    const writePosClass =
      " colophon-write-" + (pageData.colophonWritePos || "lead");
    const vertPosClass =
      " colophon-vert-" + (pageData.colophonVertPos || "center");
    const alignClass =
      " colophon-align-" + (pageData.colophonAlign || "center");
    pageEl.className =
      "paper-page front-matter-page colophon-page" +
      templateClass +
      writePosClass +
      vertPosClass +
      alignClass;
    const titleFont = FONTS[pageData.colophonTitleFont] || FONTS.noto;
    const fieldsFont = FONTS[pageData.colophonFieldsFont] || FONTS.noto;
    const noteFont = FONTS[pageData.colophonNoteFont] || FONTS.noto;
    const titleSize = pageData.colophonTitleSize || "1.2";
    const fieldsSize = pageData.colophonFieldsSize || "0.9";
    const noteSize = pageData.colophonNoteSize || "0.85";
    const fieldsStyle = `font-family:${fieldsFont};font-size:${fieldsSize}em`;
    const rows = [];
    if (pageData.colophonTitle)
      rows.push(
        `<div class="colophon-row colophon-title" style='font-family:${titleFont};font-size:${titleSize}em'>${escapeHtml(pageData.colophonTitle)}</div>`,
      );
    if (pageData.colophonDate)
      rows.push(
        `<div class="colophon-row" style='${fieldsStyle}'>${escapeHtml(pageData.colophonDate)} 発行</div>`,
      );
    if (pageData.colophonAuthor)
      rows.push(
        `<div class="colophon-row" style='${fieldsStyle}'>${wrapColonForVertical("著者：")}${escapeHtml(pageData.colophonAuthor)}</div>`,
      );
    if (pageData.colophonCircle)
      rows.push(
        `<div class="colophon-row" style='${fieldsStyle}'>${wrapColonForVertical("サークル名：")}${escapeHtml(pageData.colophonCircle)}</div>`,
      );
    if (pageData.colophonContact)
      rows.push(
        `<div class="colophon-row" style='${fieldsStyle}'>${wrapColonForVertical("連絡先：")}${escapeHtml(pageData.colophonContact)}</div>`,
      );
    if (pageData.colophonPrinter)
      rows.push(
        `<div class="colophon-row" style='${fieldsStyle}'>${wrapColonForVertical("印刷：")}${escapeHtml(pageData.colophonPrinter)}</div>`,
      );
    const noteHtml = pageData.colophonNote
      ? `<div class="colophon-note" style='font-family:${noteFont};font-size:${noteSize}em'>${parseSimpleNoteMarkdown(pageData.colophonNote)}</div>`
      : "";
    // 現状テンプレートは「縦書き・フル高さ」の1パターンのみ
    // DOM順＝右→左の読み順：固定項目（先に読む＝右）→ 自由記載欄（後で読む＝左）
    pageEl.innerHTML =
      '<div class="colophon-content">' +
      '<div class="colophon-fields">' +
      rows.join("") +
      "</div>" +
      noteHtml +
      "</div>";
  }
  function renderPageDom(pageEl, pageIdx) {
    const pageData = computedPagesData[pageIdx];
    if (!pageData) return;
    if (pageData.pageType === "cover") {
      renderCoverPageDom(pageEl, pageData);
      return;
    }
    if (pageData.pageType === "blank") {
      renderBlankPageDom(pageEl, pageData);
      return;
    }
    if (pageData.pageType === "colophon") {
      renderColophonPageDom(pageEl, pageData);
      return;
    }
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
    const nombreSizeVal = els.nombreSizeSelect
      ? els.nombreSizeSelect.value
      : "0.68rem";
    const nombreTypeVal = els.nombreTypeSelect
      ? els.nombreTypeSelect.value
      : "arabic";
    // "off"（完全非表示）の場合はどの条件にも合致せず、nombreHtmlは空文字のまま出力される
    let nombreHtml = "";
    if (
      pageData.showNombre !== false &&
      (nombreVal === "all" || (nombreVal === "skip-first" && pageIdx > 0))
    ) {
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
      // 数字タイプに応じたページ番号の表記変換
      // 漢数字・横書きは位取り記数法（十、二十一）、漢数字・縦書きは位ごと表記（一〇、二一）のまま
      let displayNum = String(pageNum);
      if (nombreTypeVal === "kanji-h") displayNum = toKanjiPositional(pageNum);
      else if (nombreTypeVal === "kanji-v") displayNum = toKanjiDigits(pageNum);
      else if (nombreTypeVal === "roman") displayNum = toRomanNumeral(pageNum);
      let nombreText = `- ${displayNum} -`;
      if (nombreFormat === "p") {
        nombreText = `P.${displayNum}`;
      } else if (nombreFormat === "slash") {
        nombreText = `/ ${displayNum} /`;
      } else if (nombreFormat === "number") {
        nombreText = `${displayNum}`;
      }
      // 漢数字（縦書き）を明示選択、かつ中央以外の配置のときのみ縦書き（文字サイズ丸めにより桁数フォールバックは不要）
      const isVerticalNombre =
        nombreTypeVal === "kanji-v" && currentNombrePos !== "center";
      // 縦書き時は「大」サイズを「標準」に丸めて余白はみ出しを防ぐ（小・標準はそのまま）
      const appliedNombreSize =
        isVerticalNombre && nombreSizeVal === "0.78rem"
          ? "0.68rem"
          : nombreSizeVal;
      const nombreOrientationStyle = isVerticalNombre
        ? "writing-mode: vertical-rl; -webkit-writing-mode: vertical-rl;"
        : "";
      nombreHtml = `<div class="page-number-tag" style="${nombrePosStyle} font-size: ${appliedNombreSize}; ${nombreOrientationStyle}">${nombreText}</div>`;
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
      syncEditorToPreview();
    }
  });
  prevPageBtn.addEventListener("click", function () {
    const total = computedPagesData.length;
    const pagesPerView = getPagesPerView();
    const prev = getPrevSpreadStartIndex(currentPageIndex, total, pagesPerView);
    if (prev !== null) {
      currentPageIndex = prev;
      renderCurrentPages();
      syncEditorToPreview();
    }
  });
  function jumpToPageTypeInPreview(pageType) {
    if (!computedPagesData || computedPagesData.length === 0) return;
    const idx = computedPagesData.findIndex((p) => p.pageType === pageType);
    if (idx === -1) return;
    const pagesPerView = getPagesPerView();
    currentPageIndex = getSpreadStartIndex(idx, pagesPerView);
    renderCurrentPages();
  }
  function goToPage(pageNumber) {
    const total = computedPagesData.length;
    if (total === 0) return false;
    if (pageNumber < 1 || pageNumber > total) return false;
    const pagesPerView = getPagesPerView();
    currentPageIndex = getSpreadStartIndex(pageNumber - 1, pagesPerView);
    renderCurrentPages();
    syncEditorToPreview();
    return true;
  }
  function syncPreviewToCursor() {
    if (isTyping) return;
    if (!syncEnabled) return;
    if (computedPagesData.length === 0) return;
    const srcIndex = els.sourceText.selectionStart;
    if (srcIndex === null || srcIndex === undefined) return;
    const targetPageIdx = findPageIndexForSrcIndex(srcIndex);
    const pagesPerView = getPagesPerView();
    const targetSpreadStart = normalizeSpreadStartIndex(
      targetPageIdx,
      computedPagesData.length,
      pagesPerView,
    );
    const currentSpreadCount = getSpreadPageCount(
      currentPageIndex,
      computedPagesData.length,
      pagesPerView,
    );
    if (
      targetSpreadStart >= currentPageIndex &&
      targetSpreadStart < currentPageIndex + currentSpreadCount
    ) {
      return;
    }
    currentPageIndex = targetSpreadStart;
    renderCurrentPages();
  }
  function goToFirstPage() {
    if (computedPagesData.length === 0) return;
    currentPageIndex = 0;
    renderCurrentPages();
    syncEditorToPreview();
  }
  function syncEditorToPreview() {
    if (!syncEnabled) return;
    if (computedPagesData.length === 0) return;
    const page = computedPagesData[currentPageIndex];
    if (!page || page.startSrcIndex === undefined) return;
    const pos = page.startSrcIndex;
    els.sourceText.selectionStart = pos;
    els.sourceText.selectionEnd = pos;
    const mirror = getEditorMirrorDiv();
    syncEditorMirrorStyle(mirror);
    mirror.textContent = els.sourceText.value.slice(0, pos);
    const targetScrollTop = mirror.getBoundingClientRect().height;
    els.sourceText.scrollTop = targetScrollTop;
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
    syncEditorToPreview();
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
  function buildFrontMatterAndColophonPages(bodyPages) {
    // 本文ページ配列に pageType: "body" を付与しつつ、
    // 中表紙（＋強制空白）・奥付（＋奇数調整の空白）を前後に結合する。
    // 中表紙・奥付とも本文の組版エンジン（禁則・行送り）には一切乗らない、
    // 別レイヤーの専用ページとして扱う。
    const taggedBodyPages = bodyPages.map((p) => ({
      ...p,
      pageType: "body",
      showNombre: true,
    }));

    const frontPages = [];
    const coverEnabled =
      els.coverEnableToggle && els.coverEnableToggle.value === "on";
    if (coverEnabled) {
      frontPages.push({
        pageType: "cover",
        showNombre: false,
        coverTitle: els.coverTitleInput ? els.coverTitleInput.value.trim() : "",
        coverSubtitle: els.coverSubtitleInput
          ? els.coverSubtitleInput.value.trim()
          : "",
        coverAuthor: els.coverAuthorInput
          ? els.coverAuthorInput.value.trim()
          : "",
        coverFrame: els.coverFrameSelect ? els.coverFrameSelect.value : "none",
        coverTemplate: els.coverTemplateSelect
          ? els.coverTemplateSelect.value
          : "vertical-center",
        coverTitleFont: els.coverTitleFontSelect
          ? els.coverTitleFontSelect.value
          : "noto",
        coverSubtitleFont: els.coverSubtitleFontSelect
          ? els.coverSubtitleFontSelect.value
          : "noto",
        coverAuthorFont: els.coverAuthorFontSelect
          ? els.coverAuthorFontSelect.value
          : "noto",
        coverTitleSize: els.coverTitleSizeSelect
          ? els.coverTitleSizeSelect.value
          : "1.6",
        coverSubtitleSize: els.coverSubtitleSizeSelect
          ? els.coverSubtitleSizeSelect.value
          : "0.9",
        coverAuthorSize: els.coverAuthorSizeSelect
          ? els.coverAuthorSizeSelect.value
          : "0.85",
        coverDivider:
          els.coverDividerToggle && els.coverDividerToggle.value === "on",
        coverDividerLength: els.coverDividerLengthSelect
          ? els.coverDividerLengthSelect.value
          : "60",
        coverGap: els.coverGapSelect ? els.coverGapSelect.value : "1.2",
      });
      // 中表紙の2ページ目は常に強制空白
      frontPages.push({ pageType: "blank", showNombre: false });
    }

    const backPages = [];
    const colophonEnabled =
      els.colophonEnableToggle && els.colophonEnableToggle.value === "on";
    if (colophonEnabled) {
      const totalBeforeColophon = frontPages.length + taggedBodyPages.length;
      // 奥付を足した結果、総ページ数が奇数になる場合は奥付の直前に空白を1ページ挟んで偶数に揃える
      if ((totalBeforeColophon + 1) % 2 !== 0) {
        backPages.push({ pageType: "blank", showNombre: false });
      }
      backPages.push({
        pageType: "colophon",
        showNombre: false,
        colophonTitle: els.colophonTitleInput
          ? els.colophonTitleInput.value.trim()
          : "",
        colophonDate: els.colophonDateInput
          ? els.colophonDateInput.value.trim()
          : "",
        colophonAuthor: els.colophonAuthorInput
          ? els.colophonAuthorInput.value.trim()
          : "",
        colophonCircle: els.colophonCircleInput
          ? els.colophonCircleInput.value.trim()
          : "",
        colophonContact: els.colophonContactInput
          ? els.colophonContactInput.value.trim()
          : "",
        colophonPrinter: els.colophonPrinterInput
          ? els.colophonPrinterInput.value.trim()
          : "",
        colophonNote: els.colophonNoteInput
          ? els.colophonNoteInput.value.trim()
          : "",
        colophonTitleFont: els.colophonTitleFontSelect
          ? els.colophonTitleFontSelect.value
          : "noto",
        colophonFieldsFont: els.colophonFieldsFontSelect
          ? els.colophonFieldsFontSelect.value
          : "noto",
        colophonNoteFont: els.colophonNoteFontSelect
          ? els.colophonNoteFontSelect.value
          : "noto",
        colophonTitleSize: els.colophonTitleSizeSelect
          ? els.colophonTitleSizeSelect.value
          : "1.2",
        colophonFieldsSize: els.colophonFieldsSizeSelect
          ? els.colophonFieldsSizeSelect.value
          : "0.9",
        colophonNoteSize: els.colophonNoteSizeSelect
          ? els.colophonNoteSizeSelect.value
          : "0.85",
        colophonWritePos: els.colophonWritePosSelect
          ? els.colophonWritePosSelect.value
          : "lead",
        colophonVertPos: els.colophonVertPosSelect
          ? els.colophonVertPosSelect.value
          : "center",
        colophonAlign: els.colophonAlignSelect
          ? els.colophonAlignSelect.value
          : "center",
        colophonTemplate: els.colophonTemplateSelect
          ? els.colophonTemplateSelect.value
          : "vertical",
      });
    }

    return frontPages.concat(taggedBodyPages, backPages);
  }
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
    if (layoutSpinner) layoutSpinner.hidden = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const bodyPages = computeLayoutWithCanvas(els.sourceText.value);
        computedPagesData = buildFrontMatterAndColophonPages(bodyPages);
        renderCurrentPages();
        saveToStorage();
        if (layoutSpinner) layoutSpinner.hidden = true;
      });
    });
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
  const SHARED_THEME_KEY = "kotonoha_shared_theme";
  if (els.themeSelect) {
    els.themeSelect.addEventListener("change", function () {
      document.documentElement.setAttribute(
        "data-theme",
        els.themeSelect.value,
      );
      saveToStorage();
      try {
        localStorage.setItem(SHARED_THEME_KEY, els.themeSelect.value);
      } catch (e) {
        // localStorageが使えない環境では無視
      }
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
    "nombreSizeSelect",
    "nombreTypeSelect",
    "coverEnableToggle",
    "coverTemplateSelect",
    "coverFrameSelect",
    "coverTitleFontSelect",
    "coverSubtitleFontSelect",
    "coverAuthorFontSelect",
    "coverTitleSizeSelect",
    "coverSubtitleSizeSelect",
    "coverAuthorSizeSelect",
    "coverDividerToggle",
    "coverDividerLengthSelect",
    "coverGapSelect",
    "colophonEnableToggle",
    "colophonTemplateSelect",
    "colophonTitleFontSelect",
    "colophonFieldsFontSelect",
    "colophonNoteFontSelect",
    "colophonTitleSizeSelect",
    "colophonFieldsSizeSelect",
    "colophonNoteSizeSelect",
    "colophonWritePosSelect",
    "colophonVertPosSelect",
    "colophonAlignSelect",
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
    "coverTitleInput",
    "coverSubtitleInput",
    "coverAuthorInput",
    "colophonTitleInput",
    "colophonDateInput",
    "colophonAuthorInput",
    "colophonCircleInput",
    "colophonContactInput",
    "colophonPrinterInput",
    "colophonNoteInput",
  ];
  INPUT_EVENT_IDS.forEach((id) => {
    if (els[id]) els[id].addEventListener("input", debounceUpdatePreview);
  });
  if (els.sourceText) {
    els.sourceText.addEventListener("input", markTypingActive);
    els.sourceText.addEventListener("input", scheduleUndoSnapshot);
    els.sourceText.addEventListener("click", syncPreviewToCursor);
    els.sourceText.addEventListener("keyup", (e) => {
      const navigationKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "PageUp",
        "PageDown",
      ];
      if (navigationKeys.includes(e.key)) {
        syncPreviewToCursor();
      }
    });
  }
  if (syncToggle) {
    syncToggle.addEventListener("change", function () {
      syncEnabled = syncToggle.checked;
      saveToStorage();
    });
  }
  if (els.undoButton) {
    els.undoButton.addEventListener("click", performUndo);
  }
  if (els.redoButton) {
    els.redoButton.addEventListener("click", performRedo);
  }
  document.addEventListener("keydown", function (e) {
    const isModifier = e.ctrlKey || e.metaKey;
    if (!isModifier) return;
    if (e.key === "z" || e.key === "Z") {
      if (document.activeElement !== els.sourceText) return;
      e.preventDefault();
      if (e.shiftKey) {
        performRedo();
      } else {
        performUndo();
      }
    } else if (e.key === "y" || e.key === "Y") {
      if (document.activeElement !== els.sourceText) return;
      e.preventDefault();
      performRedo();
    }
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
      const previousText = els.sourceText.value;
      els.sourceText.value = evt.target.result;
      if (previousText !== "" && previousText !== els.sourceText.value) {
        clearTimeout(undoDebounceTimer);
        pushUndoSnapshot(previousText);
        lastSnapshot = els.sourceText.value;
      }
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
      const previousText = els.sourceText.value;
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
      if (previousText !== "" && previousText !== els.sourceText.value) {
        clearTimeout(undoDebounceTimer);
        pushUndoSnapshot(previousText);
        lastSnapshot = els.sourceText.value;
      }
      currentPageIndex = 0;
      updatePreview();
    });
  document.getElementById("clearButton").addEventListener("click", function () {
    if (confirm("入力した内容をすべて消去しますか？")) {
      const previousText = els.sourceText.value;
      els.pageTitle.value = "";
      els.pageHeader.value = "";
      els.sourceText.value = "";
      if (previousText !== "") {
        clearTimeout(undoDebounceTimer);
        pushUndoSnapshot(previousText);
        lastSnapshot = "";
      }
      localStorage.removeItem(STORAGE_KEY);
      currentPageIndex = 0;
      updatePreview();
      els.sourceText.focus();
    }
  });
  function updateFrontMatterFieldsVisibility() {
    if (els.coverEnableToggle && coverFieldsGroup) {
      coverFieldsGroup.style.display =
        els.coverEnableToggle.value === "on" ? "" : "none";
    }
    if (els.colophonEnableToggle && colophonFieldsGroup) {
      colophonFieldsGroup.style.display =
        els.colophonEnableToggle.value === "on" ? "" : "none";
    }
  }
  function clearCoverFields() {
    if (els.coverTitleInput) els.coverTitleInput.value = "";
    if (els.coverSubtitleInput) els.coverSubtitleInput.value = "";
    if (els.coverAuthorInput) els.coverAuthorInput.value = "";
  }
  function clearColophonFields() {
    if (els.colophonTitleInput) els.colophonTitleInput.value = "";
    if (els.colophonDateInput) els.colophonDateInput.value = "";
    if (els.colophonAuthorInput) els.colophonAuthorInput.value = "";
    if (els.colophonCircleInput) els.colophonCircleInput.value = "";
    if (els.colophonContactInput) els.colophonContactInput.value = "";
    if (els.colophonPrinterInput) els.colophonPrinterInput.value = "";
    if (els.colophonNoteInput) els.colophonNoteInput.value = "";
  }
  if (els.coverEnableToggle) {
    els.coverEnableToggle.addEventListener("change", function () {
      if (
        window.prevCoverEnable === "on" &&
        this.value === "off" &&
        (els.coverTitleInput.value ||
          els.coverSubtitleInput.value ||
          els.coverAuthorInput.value)
      ) {
        if (confirm("中表紙の入力内容を消去しますか？")) {
          clearCoverFields();
        } else {
          this.value = "on";
          return;
        }
      }
      window.prevCoverEnable = this.value;
      updateFrontMatterFieldsVisibility();
    });
  }
  if (els.colophonEnableToggle) {
    els.colophonEnableToggle.addEventListener("change", function () {
      if (
        window.prevColophonEnable === "on" &&
        this.value === "off" &&
        (els.colophonTitleInput.value ||
          els.colophonDateInput.value ||
          els.colophonAuthorInput.value ||
          els.colophonCircleInput.value ||
          els.colophonContactInput.value ||
          els.colophonPrinterInput.value ||
          els.colophonNoteInput.value)
      ) {
        if (confirm("奥付の入力内容を消去しますか？")) {
          clearColophonFields();
        } else {
          this.value = "on";
          return;
        }
      }
      window.prevColophonEnable = this.value;
      updateFrontMatterFieldsVisibility();
    });
  }
  window.DEBUG_LAYOUT = false;
  loadFromStorage();
  window.prevCoverEnable = els.coverEnableToggle
    ? els.coverEnableToggle.value
    : "off";
  window.prevColophonEnable = els.colophonEnableToggle
    ? els.colophonEnableToggle.value
    : "off";
  updateFrontMatterFieldsVisibility();
  updatePreview();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready
      .then(function () {
        updatePreview();
      })
      .catch(function () {});
  }
});
