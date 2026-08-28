// Font-size toggle (S/M/L/XL) -- same pattern as thesis-engine's own
// dashboard. Persists via localStorage, applied on every page load.
(function () {
  var KEY = "tcos-fontsize";
  var SIZES = ["s", "m", "l", "xl"];

  function apply(size) {
    document.body.setAttribute("data-fontsize", size);
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
