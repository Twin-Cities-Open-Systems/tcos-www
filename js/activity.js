// activity.js -- the built page is the sample (busiest repos, latest release,
// last commits, as of the last promote). This overlays what moved since:
// one request to GitHub's public org events, no token, 60/hour per viewer.
// The public feed carries no commit messages (measured 2026-09-06), so it
// can say HOW MUCH moved and WHEN, and link there, never pretend to list it.
// A failed fetch leaves the page as built and says so.
(function () {
  "use strict";
  var ORG = "Twin-Cities-Open-Systems";
  var note = document.getElementById("activity-live-note");
  var built = note ? note.getAttribute("data-built") : "";
  if (!document.querySelector(".activity-group")) return;

  fetch("https://api.github.com/orgs/" + ORG + "/events?per_page=100", { headers: { Accept: "application/vnd.github+json" } })
    .then(function (r) { if (!r.ok) throw new Error("GitHub answered " + r.status); return r.json(); })
    .then(function (events) {
      var per = {};
      events.forEach(function (e) {
        if (built && e.created_at <= built) return;
        var repo = e.repo.name.split("/")[1];
        var p = per[repo] || (per[repo] = { pushes: 0, releases: [], last: "" });
        if (e.type === "PushEvent" && e.payload.ref === "refs/heads/main") p.pushes += (e.payload.size || 1);
        if (e.type === "ReleaseEvent" && e.payload.action === "published") p.releases.push(e.payload.release.tag_name);
        if (e.created_at > p.last) p.last = e.created_at;
      });
      var touched = 0;
      document.querySelectorAll(".activity-group").forEach(function (g) {
        var p = per[g.getAttribute("data-repo")];
        var el = g.querySelector(".activity-since");
        if (!p || !el || (!p.pushes && !p.releases.length)) return;
        touched++;
        var parts = [];
        if (p.pushes) parts.push(p.pushes + " commit" + (p.pushes === 1 ? "" : "s") + " to main since this page was built");
        if (p.releases.length) parts.push("released " + p.releases.join(", "));
        el.textContent = "+ " + parts.join(" · ") + " (latest " + p.last + ")";
      });
      var others = Object.keys(per).filter(function (r) { return !document.querySelector('.activity-group[data-repo="' + r + '"]') && (per[r].pushes || per[r].releases.length); });
      if (note) note.textContent = "as built " + built + "; live from GitHub: " + (touched ? touched + " listed repo(s) moved since" : "nothing new in the listed repos") +
        (others.length ? "; also moved: " + others.join(", ") : "") + " (checked " + new Date().toISOString().replace(/\.\d+Z$/, "Z") + ")";
    })
    .catch(function (err) {
      if (note) note.textContent = "as built " + built + "; live check unavailable: " + err.message;
    });
})();
