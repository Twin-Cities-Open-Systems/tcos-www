// Font-size toggle (S/M/L/XL) -- same pattern as thesis-engine's own
// dashboard. Persists via localStorage, applied on every page load.
(function () {
  var KEY = "tcos-fontsize";
  var SIZES = ["s", "m", "l", "xl"];

  function apply(size) {
    document.documentElement.setAttribute("data-fontsize", size);
    document.body.setAttribute("data-fontsize", size);
    if (window.tcosLayout) window.tcosLayout();
    document.querySelectorAll(".fontsize-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.size === size);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var saved = localStorage.getItem(KEY) || "m";
    apply(saved);
    document.querySelectorAll(".fontsize-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var size = btn.dataset.size;
        localStorage.setItem(KEY, size);
        apply(size);
      btn.blur();
      // Gold's fix (2026-08-30): :hover alone keeps .fs-options open after a
      // click, the cursor is still on the widget -- force-collapse, then let
      // hover/focus-within resume once the cursor leaves.
      var toggle = btn.closest(".fontsize-toggle");
      if (toggle) {
        toggle.classList.add("fs-force-collapsed");
        toggle.addEventListener("mouseleave", function onLeave() {
          toggle.classList.remove("fs-force-collapsed");
          toggle.removeEventListener("mouseleave", onLeave);
        });
      }
      });
    });
  });
})();

// Real gap found 2026-08-28 sweeping the site for "lab goes to lab, prod
// goes to prod" (Spencer's own standing rule, already applied in resume's
// shell-toggles.js): tcos-www never had this at all -- people.html's
// Blog/Media badges were hardcoded straight to *.tcos.us with no
// lab-awareness, so viewing people.html on lab.tcos.us would bounce a
// reviewer out to prod. Same real fix, same data-cross-site convention.
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var onLab = /\.lab\.tcos\.us$/.test(window.location.hostname);
    if (!onLab) return;
    document.querySelectorAll("a[data-cross-site]").forEach(function (a) {
      var url;
      try { url = new URL(a.href); } catch (e) { return; }
      if (/\.lab\.tcos\.us$/.test(url.hostname)) return; // already lab
      url.hostname = url.hostname.replace(/\.tcos\.us$/, ".lab.tcos.us");
      a.href = url.href;
    });
  });
})();

// Collapsible nav under 700px: the button toggles .open on .site-nav;
// the CSS decides when the button is visible at all.
(function () {
  document.querySelectorAll(".site-nav .nav-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var nav = btn.closest(".site-nav");
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
})();

// SYNCED-FROM .github/bin/render-review.py (Gold).

// Links that leave this host open in a new tab; same-site navigation stays
// in place. Operator, 2026-09-06: "most links should open in a new tab".
// Decided at load time from the real href, so authors never annotate.
(function () {
  function run() {
    document.querySelectorAll("a[href]").forEach(function (a) {
      var url;
      try { url = new URL(a.getAttribute("href"), location.href); } catch (e) { return; }
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      if (url.hostname === location.hostname) return;
      if (!a.target) a.target = "_blank";
      a.rel = (a.rel ? a.rel + " " : "") + "noopener";
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();

// Layout tokens from the space actually available, in em -- so a phone, a
// browser zoom and the XXL text size all collapse the same way, with one
// rule set. Re-measured on resize, orientation change and text-size change.
// Operator, 2026-09-06: "same code on phone and desktop and anything, it
// should auto adapt on user change."
(function () {
  var COMPACT_EM = 44, NARROW_EM = 26;
  function navOverflows() {
    // Measure the real thing: does the link row fit beside the brand at the
    // current text size? Measured in the wide state so the answer is about
    // content, not about the compact rules already applied.
    var nav = document.querySelector(".site-nav");
    if (!nav) return false;
    var links = nav.querySelector(".links"), brand = nav.querySelector(".brand");
    if (!links || !brand) return false;
    var was = document.documentElement.getAttribute("data-layout");
    document.documentElement.setAttribute("data-layout", "wide");
    var over = nav.scrollWidth > nav.clientWidth + 1 || links.getBoundingClientRect().right > nav.getBoundingClientRect().right + 1;
    if (was !== null) document.documentElement.setAttribute("data-layout", was);
    return over;
  }
  function layout() {
    var root = document.documentElement;
    var px = parseFloat(getComputedStyle(root).fontSize) || 16;
    var em = root.clientWidth / px;
    var tokens = [];
    if (em < COMPACT_EM || navOverflows()) tokens.push("compact");
    if (em < NARROW_EM) tokens.push("narrow");
    var v = tokens.join(" ") || "wide";
    if (root.getAttribute("data-layout") !== v) {
      root.setAttribute("data-layout", v);
      if (v === "wide") document.querySelectorAll(".site-nav.open").forEach(function (n) { n.classList.remove("open"); });
    }
  }
  window.tcosLayout = layout;
  var q = new URLSearchParams(location.search).get("fs");   // ?fs=xxl presets the text size (sharing, testing)
  if (q && /^(s|m|l|xl|xxl)$/.test(q)) { try { localStorage.setItem("tcos-fontsize", q); } catch (e) {} document.documentElement.setAttribute("data-fontsize", q); }
  layout();
  window.addEventListener("resize", layout);
  window.addEventListener("orientationchange", layout);
  document.addEventListener("DOMContentLoaded", layout);
  // menu: Escape and a click outside close it
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") document.querySelectorAll(".site-nav.open").forEach(function (n) { n.classList.remove("open"); }); });
  document.addEventListener("click", function (e) { if (!e.target.closest(".site-nav")) document.querySelectorAll(".site-nav.open").forEach(function (n) { n.classList.remove("open"); }); });
})();
