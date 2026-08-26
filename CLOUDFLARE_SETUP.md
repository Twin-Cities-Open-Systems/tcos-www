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

## One consolidated token, real config (2026-08-22)

Real problem found live in the dashboard: three separate tokens
existed (`tcos-www-worker-edit`, `tcos-www build token`,
`fleet-ops build token`), two of them with **+23 permissions**
including things like `Account.AI Search` -- real scope creep, not a
hypothetical (see fleet-ops#232). Since touchy is the only real
operator using this, one deliberately-scoped token replaces all three.

**Dashboard: My Profile -> API Tokens -> Create Token -> Custom Token**

Tiny-click config, nothing else:

| Field | Value |
|---|---|
| Token name | `touchy-cf-consolidated` |
| Permissions (row 1) | Account — Cloudflare Pages — Edit |
| Permissions (row 2) | Account — Workers Scripts — Edit |
| Permissions (row 3) | Zone — DNS — Edit |
| Account Resources | Include — the real TCOS account |
| Zone Resources | Include — Specific zone — `tcos.us` |
| TTL | leave open for now (real hygiene follow-up, not tonight) |
| IP filtering | skip |

Same three permissions already documented above (custom-domain attach
is the Workers API, not classic Pages), scoped to exactly one zone
instead of "All zones."

**Transition, in order** (real cutover, not simultaneous):
1. Create the token above.
2. Seal it (`hee cred -seal ...`), verify it works on something
   low-risk (list DNS records) before anything destructive.
3. Only then revoke the two broad ones -- confirmed 2026-08-22 that no
   CI workflow in `resume`, `tcos-www`, or `fleet-ops` references a
   Cloudflare token secret, so nothing automated should break.

## Account details

- Account ID: (see Cloudflare dashboard, Workers & Pages overview page, "Account Details" panel)
- workers.dev subdomain: spencerunderground.workers.dev
