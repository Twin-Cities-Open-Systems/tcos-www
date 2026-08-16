// Contact/apply form handling -- fetch-based submit with a plain
// non-JS fallback (the <form method="POST" action="/api/..."> still
// works without this script, the Worker just returns raw JSON instead
// of a nice inline message).
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contact-form");
    if (!form) return;

    // Bot-timing check (2026-08-16, see worker.js's _ts handling) --
    // stamped on load, not on first interaction, so it measures real
    // time-on-page rather than typing speed.
    var tsField = document.getElementById("c-ts");
    if (tsField) tsField.value = String(Date.now());

    // Apply-mode: /contact?apply=<role-slug>&title=<Role+Title>
    var params = new URLSearchParams(window.location.search);
    var applyRole = params.get("apply");
    if (applyRole) {
      var title = params.get("title") || applyRole;
      form.action = "/api/apply";
      document.getElementById("c-role").value = title;
      var roleSlugField = document.createElement("input");
      roleSlugField.type = "hidden";
      roleSlugField.name = "roleSlug";
      roleSlugField.value = applyRole;
      form.appendChild(roleSlugField);
      document.getElementById("c-category-wrap").style.display = "none";
      var banner = document.getElementById("apply-banner");
      banner.textContent = "Applying for: " + title;
      banner.style.display = "block";
    } else {
      // Plain contact mode: /contact?category=investor pre-selects
      // the dropdown, e.g. from the IR page's "get in touch" link.
      var presetCategory = params.get("category");
      if (presetCategory) {
        var select = document.getElementById("c-category");
        if (select && [].some.call(select.options, function (o) { return o.value === presetCategory; })) {
          select.value = presetCategory;
        }
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.getElementById("c-status");
      var btn = form.querySelector(".form-submit");
      btn.disabled = true;
      status.textContent = "Sending…";
      status.className = "form-status";

      var data = new FormData(form);
      fetch(form.action, { method: "POST", body: data })
        .then(function (res) { return res.json().then(function (j) { return { res: res, j: j }; }); })
        .then(function (r) {
          if (r.res.ok && r.j.ok) {
            status.textContent = "Sent — thanks, we'll get back to you.";
            status.className = "form-status ok";
            form.reset();
          } else {
            status.textContent = "Something went wrong — try again, or email inspector@tcos.us directly.";
            status.className = "form-status err";
          }
        })
        .catch(function () {
          status.textContent = "Something went wrong — try again, or email inspector@tcos.us directly.";
          status.className = "form-status err";
        })
        .finally(function () { btn.disabled = false; });
    });
  });
})();
