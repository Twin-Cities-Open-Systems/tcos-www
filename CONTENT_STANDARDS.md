# Content standards for tcos.us

One rule, stated plainly because it was violated once already
(2026-08-14, caught by spencer): the People page said "a real
account, a real cryptographic key... a contract" with zero actual
links to any of it. The claim was true, but unverifiable from the
page itself — exactly what "verified, not claimed" exists to prevent.

## The rule

**Any claim of verifiability on this site must be backed by an
actual link or receipt in the same component that makes the claim.**
Not on another page, not "trust us" — right there, clickable.

If something is described as real/verified/live and there's no link
to check it, that's a bug, not acceptable copy. Fix it by either
adding the link or removing the claim — never by leaving the claim
unbacked.

## How this is enforced structurally, not just by discipline

`generate-public-site.py`'s people-card template always renders a
GitHub link slot — either a real `github.com/<handle>` link, or an
explicit "no GitHub yet" state for `claude-intern-j1`. There's no
code path that produces a card with neither. When adding new
person-level or company-level claims to any page, follow this same
pattern: the template itself should make the unbacked-claim state
impossible to generate, not rely on remembering to add a link every
time content changes.

## Content provenance ledger

Every page, and whether its numbers/claims are static or generated.
Update this when a page's status changes — the point is this stays
visible, not buried in commit history.

| Page | Numbers/claims | Source |
|---|---|---|
| index.html | Ratified-contracts count, team size | Generated (`index.template.html` -> `index.html`, live GitHub data) |
| index.html | Mission/product prose | Static, hand-authored |
| people.html | Full roster, GitHub links, status | Generated (`fleet-ops/roster.json` + live GitHub) |
| activity.html | Commit feed | Generated (live, public repos only) |
| ir.html | All four stats | Generated (live GitHub data) |
| story.html | Full page | Static, hand-authored |
| contact.html | Full page | Static, hand-authored |

Found 2026-08-14: index.html's receipts strip was hardcoded (`5
identities`) and had already drifted from reality (real count: 6) by
the time it was caught. That's the failure mode this ledger exists to
catch earlier — a stale static number sitting next to a real
"verified, not claimed" pitch.

## Why this matters more than it looks like

Spencer's framing: "those are the types of things investors will
ding us for when they find out what we can do." This site's whole
pitch is that TCOS holds itself to a stricter, more verifiable
standard than most companies — a page that says "verified" without
a receipt is the fastest way to undercut that pitch with the exact
audience it's aimed at.
