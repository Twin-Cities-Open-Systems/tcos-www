# tcos-www-api Worker

Standalone Cloudflare Worker handling `tcos.us/api/*` only. Deliberately
separate from the main `tcos-www` static-assets Worker (which auto-deploys
via the Cloudflare Workers & Pages GitHub App) so this never risks that
pipeline -- bound in purely via a Workers Route
(`tcos.us/api/*` -> `tcos-www-api`), everything else untouched.

## What it does

- `POST /api/contact` -- general/press/sales/investor/partnership inquiries
- `POST /api/apply` -- job applications (role passed as a form field)

Both create a GitHub issue in the private `Twin-Cities-Open-Systems/inbound`
repo (never a public repo -- submitter PII stays private) via a
fine-grained PAT (issues:write, scoped to that one repo only), stored as
the `INBOUND_GH_TOKEN` Worker secret.

## Deploy (currently manual, not yet CI-wired)

```bash
CF_TOKEN=...  # Account: Workers Scripts: Edit, Zone: Workers Routes: Edit (tcos.us)
ACCT=a33d047ae2835100b8ea875863913f96

curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCT/workers/scripts/tcos-www-api" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -F 'metadata={"main_module":"worker.js","compatibility_date":"2026-08-14"};type=application/json' \
  -F "worker.js=@worker.js;type=application/javascript+module"
```

Secret (`INBOUND_GH_TOKEN`) is set separately and isn't re-uploaded by a
plain script PUT -- only needs setting once unless rotated:

```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCT/workers/scripts/tcos-www-api/secrets" \
  -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"INBOUND_GH_TOKEN","text":"<fine-grained PAT>","type":"secret_text"}'
```

Route is already created (`tcos.us/api/*` -> `tcos-www-api`) and shouldn't
need re-creating on future script updates -- routes bind to a script by
name, not by deployment.

## Not done yet

- Deploy isn't wired into any CI -- a script change here needs the manual
  `curl` above until that's built.
- No automated tests.
