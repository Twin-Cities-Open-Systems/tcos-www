# Operators — `tcos-www`

Shared conventions live in
[human-execution-engine's `OPERATOR_GUIDE.md`](https://github.com/Twin-Cities-Open-Systems/human-execution-engine/blob/main/docs/guides/OPERATOR_GUIDE.md).
This doc is only what's specific to this repo's own scripts.

## Site generator

- **`generate-public-site.py`** — regenerates every public page
  (`people.html`, `activity.html`, `ir.html`, `index.html`,
  `careers.html`, `story.html`, `contact.html`) from live sources
  (`fleet-ops/roster.json`, recent commits, hiring issue states). Run
  after any change to `roster.json`, or whenever the site looks stale
  relative to reality (see #24/#26/#29's real regeneration history).
  Requires `pyyaml` and an authenticated `gh`.

Real run:
[`examples/generate-public-site-output.txt`](examples/generate-public-site-output.txt).
Includes a real known issue surfaced by that run — 5 stale
`fleet-ops` issue references in the careers-page role mapping (404 on
every run) — tracked separately as #30, not fixed here.
