// lu: freshness row -- Gold's convention (profile/GLOSSARY.md -- "Gold"
// entry), same shape as js/site.js and shell/tc-theme.js: reads the
// build-time timestamp already in the page (footer's .lu-iso <time>) and
// renders a human-readable date plus a live "Xm ago" delta.
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var isoEl = document.querySelector(".lu-iso");
    if (!isoEl) return;
    var generated = new Date(isoEl.getAttribute("datetime"));
    var humanEl = document.querySelector(".lu-human");
    var deltaEl = document.querySelector(".lu-delta");
    if (humanEl) {
      humanEl.textContent = generated.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    }
    function renderDelta() {
      if (!deltaEl) return;
      var ms = Date.now() - generated.getTime();
      var mins = Math.floor(ms / 60000);
      var label;
      if (mins < 1) label = "just now";
      else if (mins < 60) label = mins + "m ago";
      else if (mins < 60 * 24) label = Math.floor(mins / 60) + "h" + (mins % 60) + "m ago";
      else label = Math.floor(mins / (60 * 24)) + "d ago";
      deltaEl.textContent = label;
    }
    renderDelta();
    setInterval(renderDelta, 30000);
  });
})();
