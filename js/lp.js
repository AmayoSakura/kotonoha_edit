// スクロールリビール
const revealEls = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 },
);
revealEls.forEach((el) => io.observe(el));

// ライブデモ：入力をそのまま縦書き紙面に反映する簡易プレビュー
const demoInput = document.getElementById("demoInput");
const demoPaper = document.getElementById("demoPaper");

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderDemo(text) {
  // 改行で行を分け、各行を <p> としてラップする。
  // 「」『』などの括弧で始まる行（会話文）は字下げを省略し、
  // それ以外の行（地の文）には一字下げを入れる。
  // エディタ本体の「会話文の字下げ省略」仕様を、デモでも簡易的に再現している。
  const bracketHeads = ["「", "『", "（", "(", '"', "\u2018", "\u201C"];
  const lines = text.split("\n");
  const html = lines
    .map((line) => {
      if (line.length === 0) return '<p class="no-indent">&nbsp;</p>';
      let value = escapeHtml(line);
      // ルビ記法
      value = value.replace(
        /[\|｜]([^《\n]+)《([^》\n]+)》/g,
        "<ruby>$1<rt>$2</rt></ruby>",
      );
      // 傍点記法
      value = value.replace(
        /《《([^》\n]+)》》/g,
        '<span style="text-emphasis-style:dot;text-emphasis-color:#8B2E2E;">$1</span>',
      );
      const isBracketStart = bracketHeads.includes(line.charAt(0));
      const cls = isBracketStart ? ' class="no-indent"' : "";
      return `<p${cls}>${value}</p>`;
    })
    .join("");
  demoPaper.innerHTML = text
    ? html
    : '<span style="color:#B9AF9E;">ここに紙面のプレビューが表示されます</span>';
}

const defaultDemoText =
  "その｜硝子《がらす》窓から見える景色を、彼はいつまでも眺めていた。\n「――そろそろ、行こうか」\nそう声をかけられて、ようやく我に返った。";
demoInput.value = defaultDemoText;
renderDemo(defaultDemoText);

demoInput.addEventListener("input", () => {
  renderDemo(demoInput.value);
});
