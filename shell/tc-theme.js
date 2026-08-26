// Theme toggle (light/dark/auto) -- same shape as the fontsize toggle
// (js/site.js): a button row, a localStorage key, applied on load.
// Drives the :root[data-theme] tokens that already existed in
// css/site.css but had no UI to set them -- dark mode previously only
// ever followed the OS's prefers-color-scheme.
(function () {
  var KEY = "tcos-theme";

  function apply(theme) {
    if (theme === "auto") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
    document.querySelectorAll(".theme-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.theme === theme);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var saved = localStorage.getItem(KEY) || "auto";
    apply(saved);
    document.querySelectorAll(".theme-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var theme = btn.dataset.theme;
        localStorage.setItem(KEY, theme);
        apply(theme);
      });
    });
  });
})();
