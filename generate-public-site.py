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
  <div class="links"><a href="/">Home</a><a href="/people" class="active">People</a><a href="/activity">Activity</a><a href="/story">Our Story</a><a href="/contact">Contact / Sales</a></div>
</nav></div>

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
    <span class="mono">est. 2026 · Minneapolis / St. Paul</span>
  </footer>

</div>
</body>
</html>
"""

CARD_TMPL = """      <div class="badge">
        <div class="badge-top">
          <div class="monogram">{mono}</div>
          <div class="who"><div class="name">{name}</div><div class="role">{role}</div></div>
        </div>
        <div class="what">{what}</div>
        <span class="tag{pending_class}">{status_label}</span>
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


def render_people(roster):
    cards = []
    for tier in roster["tiers"]:
        for p in tier["people"]:
            status = p["status"]
            label = STATUS_LABEL.get(status, status)
            pending_class = " pending" if status == "proposed" else ""
            cards.append(CARD_TMPL.format(
                mono=monogram(p["name"]),
                name=html.escape(p["name"]),
                role=html.escape(p["role"]),
                what=html.escape(p["what"]),
                status_label=label,
                pending_class=pending_class,
            ))
    return PEOPLE_PAGE_TMPL.format(cards="\n".join(cards))


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
  <div class="links"><a href="/">Home</a><a href="/people">People</a><a href="/activity" class="active">Activity</a><a href="/story">Our Story</a><a href="/contact">Contact / Sales</a></div>
</nav></div>

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
    <span class="mono">est. 2026 · Minneapolis / St. Paul</span>
  </footer>
</div>
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


def render_activity():
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
    return ACTIVITY_PAGE_TMPL.format(items=items)


def main():
    print("fetching roster.json from fleet-ops...", file=sys.stderr)
    roster = fetch_roster()
    open("people.html", "w").write(render_people(roster))
    print("wrote people.html", file=sys.stderr)

    print("fetching recent commits across repos...", file=sys.stderr)
    open("activity.html", "w").write(render_activity())
    print("wrote activity.html", file=sys.stderr)


if __name__ == "__main__":
    main()
