// tcos-www-api -- small, standalone Worker handling only /api/* on
// tcos.us. Deliberately separate from the tcos-www static-assets
// Worker (GitHub-App auto-deployed) so this never risks that
// deployment pipeline. Bound in via a Workers Route (tcos.us/api/*),
// everything else continues hitting the static-assets Worker as
// today.
const CATEGORIES = new Set(["general", "press", "sales", "investor", "candidate", "partnership"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://tcos.us" },
  });
}

async function createIssue(env, { title, body, labels }) {
  const res = await fetch(`https://api.github.com/repos/Twin-Cities-Open-Systems/inbound/issues`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.INBOUND_GH_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "User-Agent": "tcos-www-api-worker",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, body, labels }),
  });
  if (!res.ok) {
    throw new Error(`GitHub issue creation failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function esc(s) {
  return String(s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}

async function handleSubmit(request, env, kind) {
  if (request.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

  let data;
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    data = await request.json();
  } else {
    const form = await request.formData();
    data = Object.fromEntries(form.entries());
  }

  // honeypot -- a real submitter never fills this, it's visually
  // hidden on the page. Silently "succeed" to not tip off a bot.
  if (data._hp) return json({ ok: true });

  // Timing check (2026-08-16, added after the first real spam hit --
  // inbound#6, a generic "what's your price" submission that cleared
  // the honeypot fine, because that spam was almost certainly a raw
  // scripted POST that never rendered the page's JS at all -- which
  // means it also never sent _hp *or* any other field only JS would
  // add, so honeypot alone can't catch this shape of bot). `_ts` is a
  // hidden field forms.js stamps with Date.now() on page load; requiring
  // it (rather than just checking it when present) is a deliberate
  // tradeoff -- it also silently drops forms.js's documented no-JS
  // fallback path, which used to submit fine with no _ts at all. A
  // scripted POST and a no-JS human are indistinguishable at this layer,
  // so catching the former means dropping the latter too. Flagged to
  // Spencer as a known tradeoff, not a silent regression.
  const MIN_FILL_MS = 3000;
  const loadedAt = Number(data._ts);
  if (!loadedAt || Date.now() - loadedAt < MIN_FILL_MS) return json({ ok: true });

  const name = (data.name || "").trim().slice(0, 200);
  const email = (data.email || "").trim().slice(0, 200);
  const message = (data.message || "").trim().slice(0, 5000);
  const category = CATEGORIES.has(data.category) ? data.category : "general";

  if (!email || !message) return json({ ok: false, error: "email and message are required" }, 400);

  const isApply = kind === "apply";
  const role = isApply ? (data.role || "unspecified role").trim().slice(0, 200) : null;
  const roleSlug = isApply ? (data.roleSlug || "").trim().slice(0, 60) : null;

  const title = isApply
    ? `Application: ${role} — ${name || email}`
    : `Contact (${category}): ${name || email}`;

  const body = [
    `**From:** ${esc(name || "(no name given)")} <${esc(email)}>`,
    isApply ? `**Role:** ${esc(role)}` : `**Category:** ${esc(category)}`,
    `**Submitted:** ${new Date().toISOString()}`,
    "",
    "---",
    "",
    esc(message),
  ].join("\n");

  const labels = isApply
    ? ["candidate"].concat(roleSlug ? [`role:${roleSlug}`] : [])
    : [category];

  try {
    const issue = await createIssue(env, { title, body, labels });
    return json({ ok: true, issue: issue.number });
  } catch (e) {
    return json({ ok: false, error: "submission failed, try again shortly" }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "https://tcos.us",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    if (url.pathname === "/api/contact") return handleSubmit(request, env, "contact");
    if (url.pathname === "/api/apply") return handleSubmit(request, env, "apply");
    return json({ ok: false, error: "not found" }, 404);
  },
};
