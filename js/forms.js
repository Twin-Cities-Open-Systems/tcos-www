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
      var roleSlugField = document.createElement("input");
      roleSlugField.type = "hidden";
      roleSlugField.name = "roleSlug";
      roleSlugField.value = applyRole;
      form.appendChild(roleSlugField);
      document.getElementById("c-category-wrap").style.display = "none";
      var banner = document.getElementById("apply-banner");
      banner.textContent = "Applying for: " + title;
      banner.style.display = "block";
      document.getElementById("resume-wrap").style.display = "block";
    }

    var resumeInput = document.getElementById("c-resume");
    if (resumeInput) {
      resumeInput.addEventListener("change", function () {
        var file = resumeInput.files[0];
        var status = document.getElementById("resume-status");
        if (!file) return;
        status.textContent = "Reading resume…";
        status.className = "form-status";
        var data = new FormData();
        data.append("resume", file);
        fetch("/api/parse-resume", { method: "POST", body: data })
          .then(function (res) { return res.json(); })
          .then(function (r) {
            if (r.ok) {
              if (r.name) document.getElementById("c-name").value = r.name;
              if (r.email) document.getElementById("c-email").value = r.email;
              if (r.summary) document.getElementById("c-message").value = r.summary;
              status.textContent = "Filled in from your resume — check it over before sending.";
              status.className = "form-status ok";
            } else {
              status.textContent = "Couldn't read that file automatically — no problem, just fill in the fields below.";
              status.className = "form-status err";
            }
          })
          .catch(function () {
            status.textContent = "Couldn't read that file automatically — no problem, just fill in the fields below.";
            status.className = "form-status err";
          });
      });
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
