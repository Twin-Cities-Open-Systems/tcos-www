// Contact/apply form handling -- fetch-based submit with a plain
// non-JS fallback (the <form method="POST" action="/api/..."> still
// works without this script, the Worker just returns raw JSON instead
// of a nice inline message).
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contact-form");
    if (!form) return;

    // Apply-mode: /contact?apply=<role-slug>&title=<Role+Title>
    var params = new URLSearchParams(window.location.search);
    var applyRole = params.get("apply");
    if (applyRole) {
      var title = params.get("title") || applyRole;
      form.action = "/api/apply";
      document.getElementById("c-role").value = title;
      document.getElementById("c-category-wrap").style.display = "none";
      var banner = document.getElementById("apply-banner");
      banner.textContent = "Applying for: " + title;
      banner.style.display = "block";
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
