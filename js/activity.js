// activity.js -- the Activity page refreshes itself from GitHub's public org
// events on every view. The list in the HTML is the build-time baseline
// (generate-public-site.py, promoted with the site); this replaces it with
// what GitHub says right now, so the page never shows commits as of the
// last promote. Operator, 2026-09-06: "12h ago is last commit. I thought
// this was auto updating on commits". Public endpoint, no token, 10
// searches/minute per viewer IP; a failed fetch leaves the baseline in
// place and says so.
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

  // One request: GitHub's commit search across the org, newest author-date
  // first. The org events feed was the obvious source and is useless here:
  // its public form strips the commit list from every push (measured
  // 2026-09-06: 11 pushes to main, 0 commits in any payload).
  fetch("https://api.github.com/search/commits?q=org:" + ORG + "&sort=author-date&order=desc&per_page=25",
        { headers: { Accept: "application/vnd.github+json" } })
    .then(function (r) { if (!r.ok) throw new Error("GitHub answered " + r.status); return r.json(); })
    .then(function (data) {
      var rows = (data.items || []).filter(function (i) { return i.repository && !i.repository.private; }).map(function (i) {
        return { repo: i.repository.name, date: i.commit.author.date, msg: (i.commit.message || "").split("\n")[0], url: i.html_url };
      });
      if (!rows.length) throw new Error("GitHub returned no commits");
      render(rows);
      if (note) note.textContent = "live from GitHub, fetched " + new Date().toISOString().replace(/\.\d+Z$/, "Z");
    })
    .catch(function (err) {
      if (note) note.textContent = "as built (" + (note.getAttribute("data-built") || "") + "); live refresh unavailable: " + err.message;
    });
})();
