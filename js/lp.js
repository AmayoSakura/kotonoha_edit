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

// 取扱説明書 (manual.html) 用スクリプト
(function () {
  var SHARED_THEME_KEY = "kotonoha_shared_theme";
  var themeSelect = document.getElementById("themeSelect");
  if (!themeSelect) return;

  var root = document.documentElement;

  try {
    var savedTheme = localStorage.getItem(SHARED_THEME_KEY);
    if (savedTheme) {
      root.setAttribute("data-theme", savedTheme);
      themeSelect.value = savedTheme;
    }
  } catch (e) {
    // localStorageが使えない環境では初期値のまま
  }

  themeSelect.addEventListener("change", function () {
    root.setAttribute("data-theme", themeSelect.value);
    try {
      localStorage.setItem(SHARED_THEME_KEY, themeSelect.value);
    } catch (e) {
      // 保存できない場合は無視（このページ内の表示切替のみ有効）
    }
  });

  var toggle = document.getElementById("mobileTocToggle");
  var sidebar = document.getElementById("tocSidebar");
  var scrim = document.getElementById("tocScrim");
  function closeToc() {
    if (sidebar) sidebar.classList.remove("open");
    if (scrim) scrim.classList.remove("open");
  }

  if (toggle && sidebar && scrim) {
    toggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
      scrim.classList.toggle("open");
    });
    scrim.addEventListener("click", closeToc);
  }

  var tocNav = document.getElementById("tocNav");
  if (tocNav) {
    tocNav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeToc();
    });
  }

  var links = Array.prototype.slice.call(
    document.querySelectorAll("#tocNav a"),
  );
  if (links.length > 0) {
    var sections = links
      .map(function (a) {
        return document.getElementById(a.getAttribute("href").slice(1));
      })
      .filter(Boolean);

    function updateActive() {
      var scrollPos = window.scrollY + 80;
      var currentIndex = 0;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= scrollPos) currentIndex = i;
      }
      links.forEach(function (a) {
        a.classList.remove("active");
      });
      if (links[currentIndex]) links[currentIndex].classList.add("active");
    }
    window.addEventListener("scroll", updateActive, { passive: true });
    updateActive();
  }
})();

