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
  let value = escapeHtml(text);
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
  demoPaper.innerHTML =
    value ||
    '<span style="color:#B9AF9E;">ここに紙面のプレビューが表示されます</span>';
}

const defaultDemoText =
  "その｜硝子《がらす》窓から見える景色を、彼はいつまでも眺めていた。";
demoInput.value = defaultDemoText;
renderDemo(defaultDemoText);

demoInput.addEventListener("input", () => {
  renderDemo(demoInput.value);
});
