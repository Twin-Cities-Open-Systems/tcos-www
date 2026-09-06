#!/usr/bin/env bash
# deploy.sh -- tcos.us: build, gate, lab, promote. Two explicit steps, never
# one (HEE_POLICY 17). Incident tcos-www#59 (2026-09-06): prod was an ad hoc
# `wrangler deploy` from whatever checkout someone was on, and served git
# conflict markers for 16 minutes. This is the only sanctioned path now.
#
#   ./deploy.sh lab       regenerate from templates (branding card required),
#                         gate, push to lab.tcos.us via .github's Makefile
#   ./deploy.sh promote   gate the COMMITTED pages (no rebuild: the pages embed
#                         the commit hash as their cache-bust, so a rebuild on
#                         the merge commit can never match what that commit
#                         holds -- measured 2026-09-06, three refusals in a
#                         row), deploy the tcos-www Worker with the session
#                         signature on the version, verify every page, record
#                         a GPG-signed prod/tcos-www/<stamp> tag
#
# Requires: hee on PATH, ~/git/.github (lab), the sealed cloudflare-tcos-www
# token via `hee cred -pass cloudflare-tcos-www -dir .hee/secrets -exec` (promote).
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cmd="${1:-}"
[ "$cmd" = lab ] || [ "$cmd" = promote ] || { echo "usage: $0 lab|promote" >&2; exit 1; }
PAGES=(activity.html careers.html contact.html contracts.html index.html ir.html people.html story.html)
ASSET_DIRS=(css js shell assets)

cd "$HERE"
if [ "$cmd" = promote ]; then
  # Prod deploys a commit that is on main. Checked before anything else so
  # a refusal leaves the tree exactly as it was.
  if [ -n "$(git status --porcelain -- "${PAGES[@]}" ./*.template.html generate-public-site.py "${ASSET_DIRS[@]}")" ]; then
    echo "❌ CRITICAL promote: uncommitted changes in what would ship -- run ./deploy.sh lab, commit, merge; prod deploys a commit" >&2; exit 2
  fi
  git fetch -q origin main
  if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    echo "❌ CRITICAL promote: HEAD $(git rev-parse --short HEAD) is not origin/main $(git rev-parse --short origin/main) -- git switch main && git pull" >&2; exit 2
  fi
  echo "=== promote: committed pages at $(git rev-parse --short HEAD) (origin/main), no rebuild ==="
else
  echo "=== build (templates -> pages; hee_gtag refuses a page without the tag) ==="
  python3 generate-public-site.py >/dev/null
fi
echo "=== gates ==="
hee check all "$HERE" >/dev/null 2>&1 || { echo "❌ CRITICAL deploy: hee check all fails -- stopping" >&2; exit 2; }
if grep -l -E '^(<<<<<<< |=======$|>>>>>>> )' "${PAGES[@]}" 2>/dev/null | grep -q .; then
  echo "❌ CRITICAL deploy: git conflict markers in generated pages -- stopping" >&2; exit 2
fi
for f in "${PAGES[@]}"; do
  grep -q 'gtag/js?id=G-' "$f" || { echo "❌ CRITICAL deploy: $f has no Google tag -- stopping" >&2; exit 2; }
done
# Every image we serve carries the org branding in its metadata (hee exif
# brand): Publisher/Credit/Copyright/PEN. The logo and favicons had none
# until 2026-09-06 (operator: "all of these og images have our standard
# exif, right?").
for img in assets/*.png assets/*.jpg; do
  [ -f "$img" ] || continue
  [ -n "$(exiftool -s3 -XMP-dc:Publisher "$img" 2>/dev/null)" ] || { echo "❌ CRITICAL deploy: $img has no org branding metadata -- hee exif brand $img" >&2; exit 2; }
done
echo "  hee check all: OK; no conflict markers; tag on all ${#PAGES[@]} pages; branding on every asset image"

if [ "$cmd" = lab ]; then
  make -C "$HOME/git/.github" lab-tcos-www >/dev/null
  for p in / /people /story; do
    printf '  lab.tcos.us%-8s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' "https://lab.tcos.us$p")"
  done
  echo "=== lab updated -- review https://lab.tcos.us, then ./deploy.sh promote ==="
  exit 0
fi

SIG="$(hee ver session --tag 2>/dev/null || hee ver session 2>/dev/null | awk '/sig_tag|rc_tag/{print $2; exit}')"
[ -n "$SIG" ] || { echo "❌ CRITICAL promote: no session signature from hee ver session" >&2; exit 2; }
SRC_SHA="$(git rev-parse --short HEAD)"
# The prod tag is prod/tcos-www/<version> under hee release (RELEASE_VERSION
# from the release commit); a bare promote still gets a timestamp.
STAMP="${RELEASE_VERSION:-$(date -u +%Y%m%dT%H%MZ)}"
STAGE="$(mktemp -d)"; trap 'rm -rf "$STAGE"' EXIT
cp "${PAGES[@]}" "$STAGE/" && cp -r "${ASSET_DIRS[@]}" "$STAGE/"
# Prod says exactly the release: the committed pages carry whatever git
# describe said at build time (v1.0.0-2-gabc once the release commit
# exists); under hee release promote the stage is restamped with the tag.
if [ -n "${RELEASE_VERSION:-}" ]; then
  sed -i "s|releases/tag/[^\"]*\">[^<]*</a>|releases/tag/${RELEASE_VERSION}\">${RELEASE_VERSION}</a>|g" "$STAGE"/*.html
fi
# wrangler needs Node >= 20; with system Node 18 it prints one line and exits
# 1, and the Success|rror grep below swallowed it (2026-09-06).
node_major="$(node -v 2>/dev/null | sed 's/^v//; s/\..*//')"
[ "${node_major:-0}" -ge 20 ] || { echo "❌ CRITICAL promote: Node >= 20 required, found $(node -v 2>/dev/null || echo none) -- nvm install 20 (dotfiles' bashrc sources nvm)" >&2; exit 2; }
# hee cred -exec injects the secret as HEE_CRED_PASS (hee-cred ENV_VAR); the
# script asked for CLOUDFLARE_API_TOKEN and nobody mapped one to the other,
# so the sanctioned invocation on the header failed (2026-09-06).
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-${HEE_CRED_PASS:-}}"; export CLOUDFLARE_API_TOKEN
: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN (run via hee cred -pass cloudflare-tcos-www -dir .hee/secrets -exec)}"
CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" https://api.cloudflare.com/client/v4/accounts | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"][0]["id"])')}"
export CLOUDFLARE_ACCOUNT_ID
echo "=== promote: tcos-www worker, src=$SRC_SHA session=$SIG ==="
( cd "$STAGE" && npx --yes wrangler@4.86.0 deploy --name tcos-www --assets . --compatibility-date=2026-08-15 \
    --message "hee:$SIG tcos-www src=$SRC_SHA" --tag "${SIG%%_*}" 2>&1 | grep -E 'Success|rror|requires'; exit "${PIPESTATUS[0]}" ) \
  || { echo "❌ CRITICAL promote: wrangler deploy failed -- nothing verified, nothing tagged" >&2; exit 2; }
echo "=== verify prod ==="
bad=0
for f in "${PAGES[@]}"; do
  p="/${f%.html}"; [ "$p" = /index ] && p=/
  body="$(curl -s "https://tcos.us$p")"
  code="$(curl -s -o /dev/null -w '%{http_code}' "https://tcos.us$p")"
  markers="$(printf '%s\n' "$body" | grep -c -E '^(<<<<<<< |=======$|>>>>>>> )' || true)"
  tag="$(printf '%s\n' "$body" | grep -c 'gtag/js?id=G-' || true)"
  printf '  %-12s %s markers=%s tag=%s\n' "$p" "$code" "$markers" "$tag"
  [ "$code" = 200 ] && [ "$markers" = 0 ] && [ "$tag" = 1 ] || bad=1
done
[ "$bad" = 0 ] || { echo "❌ CRITICAL promote: prod verification failed -- fix forward or redeploy the previous commit" >&2; exit 2; }
TAG="prod/tcos-www/$STAMP"
hee git tag "$TAG" -m "prod promotion: tcos.us
worker: tcos-www
source: $SRC_SHA
session: $SIG
verified: 8 pages 200, no conflict markers, Google tag present" "$SRC_SHA" --yes --push \
  || { echo "⚠️ WARNING promote: deployed and verified, but the prod tag could not be created/pushed -- hee git tag $TAG -m ... $SRC_SHA --yes --push" >&2; }
