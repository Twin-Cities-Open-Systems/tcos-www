# tcos-www

Org governance is canonical in `human-execution-engine`'s
`prompts/PROMPTING_RULES.md`. It is delivered to every session by the
`SessionStart` hook installed from the `dotfiles` repo:

    make claude-hooks

It is deliberately **not** `@import`-ed here. Measured 2026-08-31, with
sentinel strings probed from real sessions:

| mechanism | resolves? |
|---|---|
| `@import` whose path is inside this repo | yes |
| `@import` whose path resolves outside this repo | **no** |
| `.claude/rules/` symlink pointing outside this repo | **no** |
| `@https://` or `@http://` URL | **no** |
| `SessionStart` hook | yes |

All three failures are **silent** -- they look like they worked. So an
import line here would be decoration, not delivery.

The hook also carries no assumption about where your checkouts live. It
honours `HEE_REPO_DIR`, so an operator using `~/projects/` or anything
else works without editing a repo.

If the org rules are not in `/context`, the hook is not installed.

<!-- Repo-specific guidance belongs below this line, never above it. -->

## The shared shell, and how this site ships

tcos-app owns the look of every TCOS web page (operator, 2026-10-01). This repo
is a child: `css/shell.css`, `js/shell.js` and the components in tcos-app's
`shell.manifest` are copies made by `sh sync-shell.sh`, checked by CI with
`--check`, and never edited here. `css/site.css` keeps this site's layout and
maps its own token names (`--surface-2`, `--ink-dim`, `--line`, ...) onto the
shell's, so the named themes repaint it. The theme key is the shell's `tc-theme`;
`THEME_HEAD_HTML` carries a visitor's old `tcos-theme` choice over once and still
opens dark on a first visit. The text size stays this site's own (`data-fontsize`,
which drives the layout measurement in `js/site.js`).

The lab is lab-pull only. CI publishes `tcos-www-www.tar.gz` (committed pages
through `.github`'s `lab_link_transform.py`) on a `lab-<sha>` release for every
main build, and `./deploy.sh lab` waits until `lab.tcos.us` serves it. There is
no push into the lab. Because the payload is the committed pages, a template
change regenerates them (`python3 generate-public-site.py`) in the same PR.

