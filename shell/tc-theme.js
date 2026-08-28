// Theme toggle (light/dark/auto) -- Gold's convention (profile/GLOSSARY.md
// -- "Gold" entry), matched exactly 2026-08-28 so tcos-www's own toggle
// behaves identically to every other Gold surface. Real fixes from the
// prior version: data-theme-choice (not data-theme, which collided with
// nothing but wasn't the org's actual naming convention), default dark
// (not auto -- "Spencer, real request", same as view.lab.tcos.us), and
// this file no longer does the pre-paint job alone -- a real inline
// pre-paint script now runs synchronously in <head> (this file only
// wires up the buttons and DOMContentLoaded is too late to prevent the
// flash by itself).
(function () {
  var KEY = "tcos-theme";

  function markActive(choice) {
    document.querySelectorAll(".theme-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.themeChoice === choice);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var saved = "dark";
    try { saved = localStorage.getItem(KEY) || "dark"; } catch (e) {}
    markActive(saved);
    document.querySelectorAll(".theme-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var choice = btn.dataset.themeChoice;
        try { localStorage.setItem(KEY, choice); } catch (e) {}
        if (choice === "auto") {
          document.documentElement.removeAttribute("data-theme");
        } else {
          document.documentElement.setAttribute("data-theme", choice);
        }
        markActive(choice);
      });
    });
  });
})();
