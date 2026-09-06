# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_Nothing since the last release._

## [1.0.0] - 2026-09-06

### Added

- 2026-09-06 **release**: release.card.v1.yaml for hee release; the prod tag takes the release version ([#72](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/72))
- 2026-09-06 **assets**: the logo and favicons carry the org branding and the agent signature; deploy gates on it ([#71](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/71))
- 2026-09-06 **layout**: one responsive mechanism -- text size scales the root, the layout measures what fits ([#60](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/60))
- 2026-09-05 **site**: links that leave the host open in a new tab (synced from Gold) ([#57](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/57))
- 2026-09-05 **mobile**: collapsible nav under 700px, fluid cards, nothing wider than the viewport ([#54](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/54))
- 2026-09-05 **site**: Google tag (GA4) on every page, production-only reporting ([#53](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/53))
- 2026-08-30 **gold**: broaden real hover-preview rollout beyond contracts.html ([#45](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/45))
- 2026-08-30 **assets**: commit the real TCOS identity mark, pulled from its live source ([#47](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/47))
- 2026-08-29 **gold**: kill shell/tc-theme.js and shell/tc-lu.js, single source of truth ([#46](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/46))
- 2026-08-28 **gold**: tcos-www adopts Gold + new contracts.html page ([#42](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/42))
- 2026-08-26 dedupe nav markup, add theme toggle, new Card-grid engine (Phase 1 of web-presence plan) ([#39](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/39))
- 2026-08-26 **people**: link each identity's real media presence ([#40](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/40))
- 2026-08-25 **api**: GET /api/quotes -- irssi-native quote lookup backend ([#35](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/35))
- 2026-08-20 **people**: link each identity's badge to their new /people/<slug> blog page ([#21](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/21))

### Fixed

- 2026-09-06 **deploy**: the prod tag is made by hee git tag -- the signing key comes from the oper's keyring, not gitconfig ([#70](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/70))
- 2026-09-06 **people**: no Blog link on the cards -- the blog hosts are redirects to the media hosts now ([#69](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/69))
- 2026-09-06 **deploy**: promote refuses Node < 20 up front and stops on a wrangler failure ([#68](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/68))
- 2026-09-06 **deploy**: promote reads the token hee cred injects (HEE_CRED_PASS) ([#67](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/67))
- 2026-09-06 **deploy**: promote deploys the committed pages on origin/main -- no rebuild ([#66](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/66))
- 2026-09-06 **careers**: six roles re-pointed at real fleet-ops issues; a dead issue fails the build instead of defaulting to open ([#63](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/63))
- 2026-09-06 **pages**: regenerate with the corrected Google-tag guard -- the apex never reported ([#61](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/61))
- 2026-09-05 **pages**: regenerate -- #55 committed git conflict markers into all eight pages and prod shipped them ([#58](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/58))
- 2026-09-05 **footer**: the GPL link goes to the LICENSE on GitHub -- /LICENSE was a 404 on tcos.us and lab ([#55](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/55))
- 2026-09-05 **pages**: regenerate with the branding card -- the committed pages had lost the Google tag ([#56](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/56))
- 2026-08-30 **assets**: flatten logo/favicon assets out of assets/logo/, rename og-default.png -> tcos-logo.png ([#49](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/49))
- 2026-08-30 **assets**: stop hot-linking view.lab.tcos.us for favicons/og:image ([#48](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/48))
- 2026-08-29 **links**: make people.html cross-site links lab-aware ([#44](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/44))
- 2026-08-28 **shell**: replace tc-theme.js with Gold's real reference implementation ([#43](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/43))
- 2026-08-25 **careers**: real issue links for capacity-planning + inventory-specialist ([#38](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/38))
- 2026-08-25 live repo-visibility check for activity feed, mandatory content scan ([#37](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/37))
- 2026-08-25 **security**: gitignore secrets/, matching human-execution-engine's pattern ([#36](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/36))
- 2026-08-25 **docs**: restore real README, revert bulk-template placeholder wipe ([#29](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/29))
- 2026-08-20 **people**: show suspended GitHub accounts instead of a dead link ([#26](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/26))
- 2026-08-20 **cf**: add missing wrangler.jsonc so Workers Builds can actually deploy ([#22](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/22))

### Documentation

- 2026-08-31 **governance**: import org PROMPTING_RULES via CLAUDE.md ([#50](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/50))
- 2026-08-25 consolidated Cloudflare token config, real transition plan ([#33](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/33))
- 2026-08-24 OPERATORS.md + real example for generate-public-site.py ([#31](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/31))
- 2026-08-19 align repo documentation architecture with master TCOS blueprint (`660d834`)

### Changed

- 2026-09-06 **pages**: regenerate for the 2026-09-06 promote ([#65](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/65))
- 2026-08-31 add the org CI baseline (PROMPTING_RULES rule 16) ([#51](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/51))
- 2026-08-26 refresh public site -- footer commit hash was stale (`f6d19d4`)
- 2026-08-25 refresh public site (stale activity feed) ([#32](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/32))
- 2026-08-20 refresh public site (stale activity feed) ([#24](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/24))
- 2026-08-20 regenerate public site now that roster.json parses again ([#23](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/23))

### Other

- 2026-08-16 Add minimum-fill-time bot check to contact/apply forms ([#18](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/18))
- 2026-08-16 Regenerate site from roster.json post-reduction (6 -> 2 active) (`431feac`)
- 2026-08-15 Regenerate: contract links now resolve to fleet-ops, ratified count live (`3b06db4`)
- 2026-08-15 Repoint contract links + ratified-count stat to fleet-ops (`7b8cc53`)
- 2026-08-14 Regenerate: real kudos for touchy and claudesec-j1 now live on People ([#12](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/12))
- 2026-08-14 People page: expanding pill reveals real GPG fingerprint + contract link ([#11](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/11))
- 2026-08-14 INCIDENT: remove fleet-ops from public activity feed -- repo was public, shouldn't have been ([#10](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/10))
- 2026-08-14 Careers interest pills + IR contact link (branch name is stale, no resume feature shipped) ([#9](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/9))
- 2026-08-14 Careers: real link on METHODOLOGY.md instead of plain code text ([#8](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/8))
- 2026-08-14 Real contact/apply forms, backed by a live Worker -- no more mailto: ([#7](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/7))
- 2026-08-14 Careers: real Apply Now buttons, live open/filled status, visual reporting-line chips ([#6](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/6))
- 2026-08-14 Careers: make anchor targets actually visible ([#5](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/5))
- 2026-08-14 Careers: real linkable anchors per role, six new listings, link IR's CFO placeholder to the listing ([#3](https://github.com/Twin-Cities-Open-Systems/tcos-www/pull/3))
- 2026-08-14 Add real commit tag + GPL-3.0 license to every page footer (`e8c4596`)
- 2026-08-14 Fix font-size toggle: use zoom, not html font-size (which did nothing) (`8e60ef1`)
- 2026-08-14 Add font-size toggle (S/M/L/XL), same pattern as thesis-engine's own (`7172764`)
- 2026-08-14 Document the real Cloudflare token scope for custom domains (`a66effc`)
- 2026-08-14 Add the HEE dormancy timeline to Our Story, numbers only (`db4ad0b`)
- 2026-08-14 Add real trading evidence to Our Story, quant-forward not prose-heavy (`e8a1bfa`)
- 2026-08-14 Add Careers page with real open roles, pick up new corp titles (`22c9515`)
- 2026-08-14 Convert homepage receipts strip to generated, not hardcoded (`8b77397`)
- 2026-08-14 Fix real bug: People page claimed "real account" with no actual links (`cb05972`)
- 2026-08-14 Add Investor Relations page, real-time regenerated stats (`cfe77ab`)
- 2026-08-14 Fix real info leak: public activity feed pulled private repo commits (`12af73f`)
- 2026-08-14 Fix internal nav links: use clean URLs, not .html, avoid redirect hop (`a425193`)
- 2026-08-14 Add Our Story page, language note on agents-not-bots (`c6f43ff`)
- 2026-08-14 Add activity.html, make people.html generated not hand-typed (`836eb43`)
- 2026-08-14 Split into a real multi-page site: home, people, contact/sales (`12de01b`)
