# Cloudflare setup notes

## API token scope for custom domains on a Workers-with-static-assets project

Confirmed working, 2026-08-14, after a real multi-round-trip whack-a-mole
finding this out. If deploying a new site the same way (connected via
the Cloudflare Workers & Pages GitHub App, shows up under "Compute >
Workers & Pages" as a Worker, not classic Pages), a token needs
**all three** of these permissions to attach a custom domain via API:

- Account -> Cloudflare Pages -> Edit
- Zone -> DNS -> Edit (scoped to the target zone)
- Account -> Workers Scripts -> Edit

**Why all three, not just one:** this project type is a hybrid --
Cloudflare's dashboard files it under "Workers & Pages" but the actual
custom-domain attach call is the *Workers* API
(`PUT /accounts/{account_id}/workers/domains`), not the classic Pages
API (`/accounts/{account_id}/pages/projects/{name}/domains` --
tried first, fails with "Project not found" since this project type
isn't a classic Pages project). "Workers Routes" is **not** the right
permission name despite what older docs suggest -- the actual
Cloudflare dashboard permission picker (as of 2026-08) lists it as
**"Workers Scripts"**.

## Real API call that worked

```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/domains" \
  -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
  -d '{"environment":"production","hostname":"tcos.us","service":"tcos-www"}'
```

Response includes a `cert_id` -- Cloudflare provisions the cert
automatically, no separate step needed.

## Account details

- Account ID: (see Cloudflare dashboard, Workers & Pages overview page, "Account Details" panel)
- workers.dev subdomain: spencerunderground.workers.dev
