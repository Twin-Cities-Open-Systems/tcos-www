// Font-size toggle (S/M/L/XL) -- same pattern as thesis-engine's own
// dashboard. Persists via localStorage, applied on every page load.
(function () {
  var KEY = "tcos-fontsize";
  var SIZES = ["s", "m", "l", "xl"];

  function apply(size) {
    document.documentElement.setAttribute("data-fontsize", size);
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
