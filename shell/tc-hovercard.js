// Real hover-preview for .contract-item links -- ported verbatim from
// view.lab.tcos.us/contracts.html, 2026-08-28 (Spencer, direct: "missing
// hover and pretty print... that is the job here" -- a key component,
// not an optional extra). Fetches the real raw file from GitHub on
// hover/focus, shows the first 14 lines, caches per URL. Named
// tc-hovercard.js to match the shared component plan.html already names
// (view.lab.tcos.us/plan.html -- "tc-hovercard.js: GitHub-style hover
// preview for any data-tc-profile link") -- this is the first real
// instance of it, scoped to .contract-item for now.
(function () {
  var cache = {};
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".contract-item").forEach(function (item) {
      var link = item.querySelector(".contract-link");
      var preview = item.querySelector(".file-preview");
      if (!link || !preview) return;
      var url = preview.getAttribute("data-raw");
      var loaded = false;
      function load() {
        if (loaded) return;
        loaded = true;
        if (cache[url]) {
          preview.innerHTML = cache[url];
          return;
        }
        fetch(url)
          .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
          .then(function (text) {
            var lines = text.split("\n").slice(0, 14).join("\n");
            var html = "<pre>" + lines.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "\n&hellip;</pre>";
            cache[url] = html;
            preview.innerHTML = html;
          })
          .catch(function () {
            preview.innerHTML = '<span class="fp-status">couldn\'t load a live preview right now</span>';
            loaded = false;
          });
      }
      link.addEventListener("mouseenter", load);
      link.addEventListener("focus", load);
    });
  });
})();
