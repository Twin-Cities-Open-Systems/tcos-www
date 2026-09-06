// activity.js -- the Activity page refreshes itself from GitHub's public org
// events on every view. The list in the HTML is the build-time baseline
// (generate-public-site.py, promoted with the site); this replaces it with
// what GitHub says right now, so the page never shows commits as of the
// last promote. Operator, 2026-09-06: "12h ago is last commit. I thought
// this was auto updating on commits". Public endpoint, no token, 60
// requests/hour per viewer IP; a failed fetch leaves the baseline in place
// and says so. Only pushes to main count: same rule as the build.
(function () {
  "use strict";
  var ORG = "Twin-Cities-Open-Systems";
  var section = document.getElementById("activity-live");
  var note = document.getElementById("activity-live-note");
  if (!section) return;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function render(rows) {
    section.innerHTML = rows.map(function (r) {
      return '<div class="activity-item"><div class="activity-repo">' + esc(r.repo) + '</div>' +
        '<div class="activity-body"><div class="activity-msg"><a href="' + esc(r.url) + '">' + esc(r.msg) + '</a></div>' +
        '<div class="activity-meta">' + esc(r.date) + '</div></div></div>';
    }).join("\n");
  }

  fetch("https://api.github.com/orgs/" + ORG + "/events?per_page=100", { headers: { Accept: "application/vnd.github+json" } })
    .then(function (r) { if (!r.ok) throw new Error("GitHub answered " + r.status); return r.json(); })
    .then(function (events) {
      var rows = [];
      events.forEach(function (e) {
        if (e.type !== "PushEvent" || e.payload.ref !== "refs/heads/main") return;
        var repo = e.repo.name.split("/")[1];
        (e.payload.commits || []).forEach(function (c) {
          if (!c.distinct) return;
          rows.push({ repo: repo, date: e.created_at, msg: (c.message || "").split("\n")[0],
                      url: "https://github.com/" + e.repo.name + "/commit/" + c.sha });
        });
      });
      if (!rows.length) throw new Error("no pushes to main in GitHub's recent public events");
      rows.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      render(rows.slice(0, 25));
      if (note) note.textContent = "live from GitHub's public events, fetched " + new Date().toISOString().replace(/\.\d+Z$/, "Z");
    })
    .catch(function (err) {
      if (note) note.textContent = "as built (" + (note.getAttribute("data-built") || "") + "); live refresh unavailable: " + err.message;
    });
})();
