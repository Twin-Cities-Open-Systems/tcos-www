// Theme toggle (light/dark/auto) -- ported verbatim from the Gold
// reference implementation (.github/bin/render-review.py's embedded
// script), replacing a broken hand-copy that read the wrong data
// attribute (dataset.theme instead of dataset.themeChoice) and never
// actually switched themes on click. Real bug, found 2026-08-28.
(function () {
  var TH_KEY = "tcos-theme";
  function markActive(choice) {
    document.querySelectorAll(".theme-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.themeChoice === choice);
    });
  }
  var saved = "dark";
  try { saved = localStorage.getItem(TH_KEY) || "dark"; } catch (e) {}
  markActive(saved);
  document.querySelectorAll(".theme-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var choice = b.dataset.themeChoice;
      try { localStorage.setItem(TH_KEY, choice); } catch (e) {}
      if (choice === "auto") {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", choice);
      }
      markActive(choice);
    });
  });
})();
