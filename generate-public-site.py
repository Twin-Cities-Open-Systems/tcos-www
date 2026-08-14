#!/usr/bin/env python3
"""Regenerate people.html and activity.html from live sources.

people.html: pulled from fleet-ops/roster.json (source of truth lives
there, not duplicated here) -- public-safe fields only. No GPG
fingerprints, system accounts, or session status; those are internal.

activity.html: recent real commits across the org's repos. Merged-PR
history is currently a poor signal (review backlog), so this reads
commits directly -- accurate regardless of merge state.

Usage: ./generate-public-site.py
"""
import html
import json
import subprocess
import sys
import urllib.parse
import urllib.request

ORG = "Twin-Cities-Open-Systems"
# roster.json isn't on fleet-ops' main yet (still on an open PR branch,
# fleet-ops#9) -- read via gh api from that branch until it merges,
# not raw.githubusercontent.com which only serves merged branches.
ROSTER_BRANCH = "add-full-automation-bootstrap"
# Public repos only. thesis-engine and glass-ops are PRIVATE -- their
# commit history (real business/trading logic) must never appear on
# the public site. Caught 2026-08-14: the copy used to say "public
# and private repos," which was a real bug, not just bad wording.
ACTIVITY_REPOS = ["fleet-ops", "human-execution-engine", "tcos-www"]
MONOGRAM_COLORS_NOTE = "reuses the same badge component as index.html's teaser"


def gh(*args):
    out = subprocess.run(["gh", "api", *args], capture_output=True, text=True)
    if out.returncode != 0:
        print(f"  WARN: gh api {' '.join(args)} failed: {out.stderr.strip()}", file=sys.stderr)
        return None
    return json.loads(out.stdout) if out.stdout.strip() else None


def fetch_roster():
    import base64
    data = gh(f"repos/{ORG}/fleet-ops/contents/roster.json?ref={ROSTER_BRANCH}")
    return json.loads(base64.b64decode(data["content"]))


PEOPLE_PAGE_TMPL = """<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>People — Twin Cities Open Systems</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="css/site.css">
</head>
<body>
<div class="wrap"><nav class="site-nav">
  <a class="brand" href="/">Twin Cities Open Systems</a>
  <div class="links"><a href="/">Home</a><a href="/people" class="active">People</a><a href="/activity">Activity</a><a href="/story">Our Story</a><a href="/ir">Investor Relations</a><a href="/careers">Careers</a><a href="/contact">Contact / Sales</a></div>
</nav><div class="fontsize-toggle"><span>Aa</span><button class="fontsize-btn" data-size="s">S</button><button class="fontsize-btn" data-size="m">M</button><button class="fontsize-btn" data-size="l">L</button><button class="fontsize-btn" data-size="xl">XL</button></div></div>

<div class="wrap">

  <section class="hero" style="padding-bottom: 20px;">
    <p class="eyebrow">Who's behind this</p>
    <h1 style="font-size: clamp(30px, 5vw, 44px);">One human. A fleet that proves its own work.</h1>
    <p class="sub">Every identity below is real: a real account, a
    real cryptographic key, and — for everyone but our newest hire —
    a contract the rest of the team actually signed. Generated
    straight from our own internal roster, not hand-typed.</p>
  </section>

  <section style="padding-top: 0;">
    <div class="people">
{cards}
    </div>
  </section>

  <section>
    <p class="eyebrow">How we work</p>
    <h2>Standing, not ownership.</h2>
    <p>We don't protect what we build by claiming it — we protect it
    with a real, signed chain of authority. Every person and every AI
    operator on this page works under a contract the rest of the team
    actually agreed to, cryptographically. It's a stricter standard
    than most companies hold internally, and we think that's the
    point.</p>
  </section>

  <footer>
    <span>Twin Cities Open Systems</span>
    <span class="mono">est. 2026 · Minneapolis / St. Paul · <a href="LICENSE">GPL-3.0</a> · <a href="https://github.com/Twin-Cities-Open-Systems/tcos-www/commit/{{COMMIT}}">{{COMMIT_SHORT}}</a></span>
  </footer>

</div>
<script src="js/site.js"></script>
</body>
</html>
"""

CARD_TMPL = """      <div class="badge">
        <div class="badge-top">
          <div class="monogram">{mono}</div>
          <div class="who"><div class="name">{name}</div><div class="role">{role}</div></div>
        </div>
        <div class="what">{what}</div>
        <div class="badge-foot">
          <span class="tag{pending_class}">{status_label}</span>
          {github_link}
        </div>
      </div>"""

STATUS_LABEL = {
    "verified": "Verified", "ratified": "Ratified",
    "proposed": "Onboarding", "peer": "Ratified",
}


def monogram(name):
    parts = [p for p in name.replace("-", " ").split() if p]
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    return name[:2].upper()


def render_people(roster, commit_info):
    cards = []
    for tier in roster["tiers"]:
        for p in tier["people"]:
            status = p["status"]
            label = STATUS_LABEL.get(status, status)
            pending_class = " pending" if status == "proposed" else ""
            if p.get("github"):
                gh_login = html.escape(p["github"])
                github_link = f'<a class="badge-gh mono" href="https://github.com/{gh_login}">@{gh_login}</a>'
            else:
                github_link = '<span class="badge-gh mono badge-gh-pending">no GitHub yet</span>'
            cards.append(CARD_TMPL.format(
                mono=monogram(p["name"]),
                name=html.escape(p["name"]),
                role=html.escape(p["role"]),
                what=html.escape(p["what"]),
                status_label=label,
                pending_class=pending_class,
                github_link=github_link,
            ))
    return fill_placeholders(PEOPLE_PAGE_TMPL, commit_info).format(cards="\n".join(cards))


ACTIVITY_PAGE_TMPL = """<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Activity — Twin Cities Open Systems</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="css/site.css">
<style>
  .activity-item {{ display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--line); }}
  .activity-item:last-child {{ border-bottom: none; }}
  .activity-repo {{ font-family: ui-monospace, monospace; font-size: 11px; color: var(--accent-ink); font-weight: 700; white-space: nowrap; padding-top: 2px; min-width: 130px; }}
  .activity-body {{ flex: 1; }}
  .activity-msg {{ font-size: 14.5px; color: var(--ink); }}
  .activity-msg a {{ color: var(--ink); text-decoration: none; }}
  .activity-msg a:hover {{ color: var(--accent-ink); }}
  .activity-meta {{ font-family: ui-monospace, monospace; font-size: 11.5px; color: var(--ink-faint); margin-top: 3px; }}
</style>
</head>
<body>
<div class="wrap"><nav class="site-nav">
  <a class="brand" href="/">Twin Cities Open Systems</a>
  <div class="links"><a href="/">Home</a><a href="/people">People</a><a href="/activity" class="active">Activity</a><a href="/story">Our Story</a><a href="/ir">Investor Relations</a><a href="/careers">Careers</a><a href="/contact">Contact / Sales</a></div>
</nav><div class="fontsize-toggle"><span>Aa</span><button class="fontsize-btn" data-size="s">S</button><button class="fontsize-btn" data-size="m">M</button><button class="fontsize-btn" data-size="l">L</button><button class="fontsize-btn" data-size="xl">XL</button></div></div>

<div class="wrap">
  <section class="hero" style="padding-bottom: 20px;">
    <p class="eyebrow">What we're shipping</p>
    <h1 style="font-size: clamp(30px, 5vw, 44px);">Real commits, not a highlight reel.</h1>
    <p class="sub">Every line below is a real commit from our public
    repos, newest first. No curation — this is what "verified, not
    claimed" looks like applied to our own activity.</p>
  </section>

  <section style="padding-top: 0;">
{items}
  </section>

  <footer>
    <span>Twin Cities Open Systems</span>
    <span class="mono">est. 2026 · Minneapolis / St. Paul · <a href="LICENSE">GPL-3.0</a> · <a href="https://github.com/Twin-Cities-Open-Systems/tcos-www/commit/{{COMMIT}}">{{COMMIT_SHORT}}</a></span>
  </footer>
</div>
<script src="js/site.js"></script>
</body>
</html>
"""

ITEM_TMPL = """    <div class="activity-item">
      <div class="activity-repo">{repo}</div>
      <div class="activity-body">
        <div class="activity-msg"><a href="{url}">{msg}</a></div>
        <div class="activity-meta">{date}</div>
      </div>
    </div>"""


def render_activity(commit_info):
    rows = []
    for repo in ACTIVITY_REPOS:
        commits = gh(f"repos/{ORG}/{repo}/commits?per_page=8") or []
        for c in commits:
            msg = c["commit"]["message"].split("\n")[0]
            rows.append({
                "repo": repo,
                "date": c["commit"]["author"]["date"],
                "msg": msg,
                "url": c["html_url"],
            })
    rows.sort(key=lambda r: r["date"], reverse=True)
    rows = rows[:25]
    items = "\n".join(
        ITEM_TMPL.format(
            repo=html.escape(r["repo"]),
            url=r["url"],
            msg=html.escape(r["msg"]),
            date=r["date"],
        )
        for r in rows
    )
    return fill_placeholders(ACTIVITY_PAGE_TMPL, commit_info).format(items=items)


IR_PAGE_TMPL = """<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Investor Relations — Twin Cities Open Systems</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="css/site.css">
<style>
  .ir-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; margin: 28px 0; }}
  .ir-stat {{ background: var(--surface); padding: 18px 20px; }}
  .ir-stat .n {{ font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums; font-size: 28px; font-weight: 700; }}
  .ir-stat .l {{ font-size: 11.5px; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-faint); margin-top: 4px; }}
  .ir-asof {{ font-family: ui-monospace, monospace; font-size: 12px; color: var(--ink-faint); margin-top: -18px; margin-bottom: 8px; }}
</style>
</head>
<body>
<div class="wrap"><nav class="site-nav">
  <a class="brand" href="/">Twin Cities Open Systems</a>
  <div class="links"><a href="/">Home</a><a href="/people">People</a><a href="/activity">Activity</a><a href="/story">Our Story</a><a href="/ir" class="active">Investor Relations</a><a href="/careers">Careers</a><a href="/contact">Contact / Sales</a></div>
</nav><div class="fontsize-toggle"><span>Aa</span><button class="fontsize-btn" data-size="s">S</button><button class="fontsize-btn" data-size="m">M</button><button class="fontsize-btn" data-size="l">L</button><button class="fontsize-btn" data-size="xl">XL</button></div></div>

<div class="wrap">
  <section class="hero" style="padding-bottom: 0;">
    <p class="eyebrow">Investor relations</p>
    <h1 style="font-size: clamp(30px, 5vw, 44px);">Reported in real time, not on a quarterly lag.</h1>
    <p class="sub">Every number below is regenerated from live sources
    the moment this page is built — the same "verified, not claimed"
    standard as everything else on this site. No smoothing, no
    cherry-picked quarter.</p>
    <p class="ir-asof">Generated {asof}</p>
  </section>

  <section style="padding-top: 0;">
    <div class="cta-block" style="border-color: var(--accent);">
      <h3>We're raising. Here's the pitch.</h3>
      <p><b>Twin Cities Open Systems builds a general-purpose
      thesis-testing framework</b> — test, monitor, model, and confirm
      any claim with real evidence instead of vibes. Our flagship
      product, <b>thesis-engine</b>, proves the model today: real
      portfolio analysis, in daily production use, not a demo.
      Governance is the moat — every contributor, human or AI,
      operates under a real, cryptographically signed contract, and
      every public claim this company makes links back to a live,
      checkable source. We're raising to take thesis-engine from
      personal-use proof to a real product, and to prove the
      framework generalizes with a second module beyond markets.</p>
      <div class="contact-row">
        <a class="contact-link" href="/contact?category=investor"><span class="k mono">talk</span> Get in touch</a>
      </div>
    </div>
  </section>

  <section style="padding-top: 0;">
    <div class="ir-grid">
      <div class="ir-stat"><div class="n">{team_size}</div><div class="l">Team members</div></div>
      <div class="ir-stat"><div class="n">{ratified}</div><div class="l">Contracts ratified</div></div>
      <div class="ir-stat"><div class="n">{public_repos}</div><div class="l">Public repos</div></div>
      <div class="ir-stat"><div class="n">{commits_7d}</div><div class="l">Commits, last 7 days</div></div>
    </div>
  </section>

  <section>
    <p class="eyebrow">Flagship product</p>
    <h2>thesis-engine</h2>
    <p>In daily production use today — real portfolio analysis, not a
    demo. Full public rollout in progress; see the <a href="/story">Our
    Story</a> page for how it fits into the company.</p>
  </section>

  <section>
    <p class="eyebrow">Governance</p>
    <h2>Standing, not ownership.</h2>
    <p>Every team member — human or AI — operates under a
    cryptographically signed contract defining exactly what they're
    authorized to do. {ratified} of those are ratified today; the rest
    are in progress, not backfilled after the fact.</p>
  </section>

  <section>
    <p class="eyebrow">Financials</p>
    <h2>Coming once there's a CFO to own them.</h2>
    <p>Real financial reporting belongs to a real CFO, not a
    placeholder number generated alongside commit counts. That role is
    open — see the <a href="/careers#cfo">CFO listing on Careers</a>.
    This section fills in with real numbers once it's filled, not
    before.</p>
  </section>

  <section>
    <p class="eyebrow">What's coming</p>
    <h2>Live webcasts, real Q&amp;A.</h2>
    <p>We're for real, and we'll let you know when there's something
    to actually show up for — not a placeholder countdown for
    infrastructure that doesn't exist yet.</p>
  </section>

  <footer>
    <span>Twin Cities Open Systems</span>
    <span class="mono">est. 2026 · Minneapolis / St. Paul · <a href="LICENSE">GPL-3.0</a> · <a href="https://github.com/Twin-Cities-Open-Systems/tcos-www/commit/{{COMMIT}}">{{COMMIT_SHORT}}</a></span>
  </footer>
</div>
<script src="js/site.js"></script>
</body>
</html>
"""


def compute_company_stats(roster):
    """Single source of truth for every live number used across pages
    (homepage receipts strip, IR page). Compute once, reuse everywhere
    -- the whole point is these can't drift out of sync with each
    other the way the homepage's hardcoded '5 identities' did."""
    import datetime
    team_size = sum(len(t["people"]) for t in roster["tiers"])

    contracts = gh(f"repos/{ORG}/human-execution-engine/contents/hee/contracts") or []
    ratified = 0
    for c in contracts:
        if not c["name"].endswith(".contract.v1.yaml"):
            continue
        data = gh(f"repos/{ORG}/human-execution-engine/contents/hee/contracts/{c['name']}")
        if data:
            import base64 as b64
            content = b64.b64decode(data["content"]).decode()
            if "status: ratified" in content:
                ratified += 1

    repos = gh("orgs/" + ORG + "/repos?per_page=100") or []
    public_repos = sum(1 for r in repos if not r["private"])

    since = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)).isoformat()
    commits_7d = 0
    for repo in ACTIVITY_REPOS:
        commits = gh(f"repos/{ORG}/{repo}/commits?since={since}&per_page=100") or []
        commits_7d += len(commits)

    return {
        "team_size": team_size,
        "ratified": ratified,
        "public_repos": public_repos,
        "commits_7d": commits_7d,
        "asof": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    }


def render_ir(stats, commit_info):
    return fill_placeholders(IR_PAGE_TMPL, commit_info).format(**stats)


# Every real open role, backed by a real fleet-ops issue (label:
# "hiring") -- single source of truth is the issue's open/closed
# state, not a hand-maintained flag here. Closing the issue is what
# takes a listing off the public page; there's no separate "delist"
# step to forget.
JOBS = [
    {"slug": "ceo", "title": "Chief Executive Officer", "issue": 28,
     "meta": "Full-time", "reports_to": {"mono": "SB", "name": "Spencer Butler"},
     "desc": "Run day-to-day operations and coordination across a small, "
             "real team &mdash; human and AI &mdash; building thesis-engine into a real "
             "product. You won't be reinventing the authority structure: this "
             "is an operational leadership role under existing ownership, not "
             "a power grab. Scope still being finalized alongside the hire itself."},
    {"slug": "cfo", "title": "Chief Financial Officer", "issue": 16,
     "meta": "Full-time", "reports_to": {"mono": "SB", "name": "Spencer Butler"},
     "desc": "Own real financial governance: anything touching a financial "
             "platform needs your approval, anything that smells of money "
             "needs your sign-off. You'll also be the one who finally puts "
             "real numbers on the Investor Relations page instead of the "
             "&quot;waiting on a CFO&quot; placeholder that's there now."},
    {"slug": "marketing-pr", "title": "Marketing / PR Lead", "issue": 31,
     "meta": "Full-time", "reports_to": {"mono": "SB", "name": "Spencer Butler"},
     "desc": "Build real relationships, not cold-outreach blasts &mdash; starting "
             "with the people whose work genuinely shaped thesis-engine's "
             "methodology (see <a href=\"/story\">Our Story</a>). Own the "
             "company's voice: agents, not bots; verified, not claimed."},
    {"slug": "compliance-officer", "title": "Compliance Officer", "issue": 37,
     "meta": "Full-time", "reports_to": {"mono": "SB", "name": "Spencer Butler"},
     "desc": "Own compliance posture as thesis-engine moves toward real "
             "external users &mdash; works closely with the CFO on financial-platform "
             "obligations, and with the rest of the team on IP protection, "
             "the thing this company actually treats as its capital."},
    {"slug": "research-analyst", "title": "Research Analyst", "issue": 39,
     "meta": "Full-time", "reports_to": {"mono": "SB", "name": "Spencer Butler"},
     "desc": "Cover thesis-engine's real 7-layer thesis end to end &mdash; DC "
             "infra, power, critical materials, and the rest (see "
             "<a href=\"https://github.com/Twin-Cities-Open-Systems/thesis-engine/blob/main/METHODOLOGY.md\">METHODOLOGY.md</a> "
             "for the full framework &mdash; private repo, visible once you're on "
             "the team). One analyst to start; splits by layer once real "
             "coverage gaps show up, not before."},
    {"slug": "inventory-specialist", "title": "Inventory Specialist", "issue": 38,
     "meta": "Full-time", "reports_to": {"mono": "SB", "name": "Spencer Butler"},
     "desc": "Real accounting of the physical fleet &mdash; hardware, storage "
             "pools, VMs &mdash; starting with what the pve buildout has already "
             "turned up (dead storage pools, drives passed through to VMs no "
             "one's checked on). Ground truth over assumption, same standard "
             "as everywhere else here."},
    {"slug": "capacity-planning", "title": "Capacity / Data-Center Planning Agent", "issue": 38,
     "meta": "Full-time", "reports_to": {"mono": "SB", "name": "Spencer Butler"},
     "desc": "Own the actual capacity plan for the home-lab buildout &mdash; "
             "cost/benefit before action, not speculative scaling. Works "
             "alongside the Inventory Specialist role on what's real today "
             "before recommending what's next."},
    {"slug": "mindset-coach", "title": "Mindset Coach", "issue": 40,
     "meta": "Full-time", "reports_to": {"mono": "SB", "name": "Spencer Butler"},
     "desc": "Discipline is the whole point of a thesis-driven approach &mdash; "
             "this role exists to keep the team (human and AI both) honest "
             "about bias, drift, and the gap between what a thesis says and "
             "what a decision-maker wants to be true."},
    {"slug": "hr", "title": "HR", "issue": 41,
     "meta": "Full-time", "reports_to": {"mono": "SB", "name": "Spencer Butler"},
     "desc": "Own people operations for a genuinely hybrid roster &mdash; real "
             "onboarding (see how hiring works below), real contracts, real "
             "support for every hire, human or AI, not a policy written for "
             "one and stretched to cover the other."},
]

JOB_TMPL = """    <div class="job" id="{slug}">
      <div class="job-head"><h3>{title}</h3><a class="apply-btn" href="/contact?apply={slug}&amp;title={title_url}">Apply now &rarr;</a></div>
      <div class="meta"><span class="report-chip" title="Reports to {reports_to_name}">{reports_to_mono}</span> {meta} {interest}</div>
      <p>{desc}</p>
    </div>"""

FILLED_SECTION_TMPL = """
  <section>
    <p class="eyebrow">Recently filled</p>
    <h2>These roles are spoken for.</h2>
    <ul class="filled-list">
{items}
    </ul>
  </section>
"""


def fetch_issue_states(issue_numbers):
    """One state check per unique issue -- open/closed is the only
    signal that takes a listing off the page, so this must reflect
    the real GitHub issue, never a hand-set flag."""
    states = {}
    for n in sorted(set(issue_numbers)):
        data = gh(f"repos/{ORG}/fleet-ops/issues/{n}")
        states[n] = (data or {}).get("state", "open")
    return states


def fetch_application_counts(slugs):
    """Real applicant counts per role, from the private inbound repo's
    issue labels (role:<slug>, applied by the Worker at submission
    time) -- an aggregate count only, never names/emails, so this is
    safe to show publicly."""
    counts = {}
    for slug in slugs:
        data = gh(f'search/issues?q=repo:{ORG}/inbound+label:"role:{slug}"')
        counts[slug] = (data or {}).get("total_count", 0)
    return counts


def find_filler(roster, title):
    """Best-effort match of a filled role back to the real roster
    entry that filled it, by role text -- no hand-typed name mapping
    to drift out of sync."""
    for tier in roster["tiers"]:
        for p in tier["people"]:
            if p.get("role", "").strip().lower() == title.strip().lower():
                return p
    return None


def render_careers(roster, commit_info):
    states = fetch_issue_states(j["issue"] for j in JOBS)

    open_jobs, filled = [], []
    for j in JOBS:
        if states.get(j["issue"], "open") == "open":
            open_jobs.append(j)
        else:
            filled.append(j)

    app_counts = fetch_application_counts(j["slug"] for j in open_jobs)

    def interest_pill(slug):
        n = app_counts.get(slug, 0)
        if n == 0:
            return '<span class="interest-pill new">Just opened</span>'
        word = "applicant" if n == 1 else "applicants"
        return f'<span class="interest-pill">{n} real {word}</span>'

    jobs_html = "\n".join(
        JOB_TMPL.format(
            slug=j["slug"], title=j["title"], meta=j["meta"], desc=j["desc"],
            title_url=urllib.parse.quote(j["title"]),
            reports_to_mono=j["reports_to"]["mono"],
            reports_to_name=j["reports_to"]["name"],
            interest=interest_pill(j["slug"]),
        )
        for j in open_jobs
    )

    filled_section = ""
    if filled:
        items = []
        for j in filled:
            person = find_filler(roster, j["title"])
            if person and person.get("github"):
                items.append(
                    f'      <li>{html.escape(j["title"])} &mdash; '
                    f'<a href="/people">{html.escape(person["name"])}</a> '
                    f'(<a href="https://github.com/{person["github"]}">@{person["github"]}</a>)</li>'
                )
            else:
                items.append(f'      <li>{html.escape(j["title"])} &mdash; filled</li>')
        filled_section = FILLED_SECTION_TMPL.format(items="\n".join(items))

    tmpl = open("careers.template.html").read()
    tmpl = tmpl.replace("{{JOBS}}", jobs_html)
    tmpl = tmpl.replace("{{FILLED_SECTION}}", filled_section)
    return fill_placeholders(tmpl, commit_info)


def get_commit_info():
    sha = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
    return {"COMMIT": sha, "COMMIT_SHORT": sha[:7]}


def fill_placeholders(text, values):
    for k, v in values.items():
        text = text.replace("{{" + k + "}}", str(v))
    return text


def render_index(stats, commit_info):
    # Read from index.template.html, never index.html itself -- index.html
    # is pure generated output; if we read-and-rewrite the same file, the
    # {{PLACEHOLDER}} tokens are gone after the first run and every run
    # after that silently stops updating the numbers.
    tmpl = open("index.template.html").read()
    tmpl = tmpl.replace("{{RATIFIED}}", str(stats["ratified"]))
    tmpl = tmpl.replace("{{TEAM_SIZE}}", str(stats["team_size"]))
    return fill_placeholders(tmpl, commit_info)


# Static pages that only need commit-info placeholders filled, no other
# live data -- template filename -> output filename.
STATIC_TEMPLATES = {
    "story.template.html": "story.html",
    "contact.template.html": "contact.html",
}


def main():
    commit_info = get_commit_info()
    print(f"current commit: {commit_info['COMMIT_SHORT']}", file=sys.stderr)

    print("fetching roster.json from fleet-ops...", file=sys.stderr)
    roster = fetch_roster()
    open("people.html", "w").write(render_people(roster, commit_info))
    print("wrote people.html", file=sys.stderr)

    print("fetching recent commits across repos...", file=sys.stderr)
    open("activity.html", "w").write(render_activity(commit_info))
    print("wrote activity.html", file=sys.stderr)

    print("computing company stats...", file=sys.stderr)
    stats = compute_company_stats(roster)
    open("ir.html", "w").write(render_ir(stats, commit_info))
    print("wrote ir.html", file=sys.stderr)
    open("index.html", "w").write(render_index(stats, commit_info))
    print("wrote index.html (from index.template.html)", file=sys.stderr)

    print("checking hiring issue states...", file=sys.stderr)
    open("careers.html", "w").write(render_careers(roster, commit_info))
    print("wrote careers.html (from careers.template.html)", file=sys.stderr)

    for tmpl_name, out_name in STATIC_TEMPLATES.items():
        content = fill_placeholders(open(tmpl_name).read(), commit_info)
        open(out_name, "w").write(content)
        print(f"wrote {out_name} (from {tmpl_name})", file=sys.stderr)


if __name__ == "__main__":
    main()
