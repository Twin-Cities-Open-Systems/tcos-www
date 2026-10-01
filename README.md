# tcos-www

Public marketing site for [tcos.us](https://tcos.us) — mission,
flagship product, real people, contact info. Static, single-page,
no build step required.

Preview: `open index.html`, or serve `.` with any static file server.

Deployment: lab first, then prod, through `hee release -lab | -cut | -promote`
(`release.card.v1.yaml`). The lab mirror, `lab.tcos.us`, is installed by
`lab-pull` on pve from the payload CI publishes on every main build, so it shows
what is merged. Prod, `tcos.us`, is the `tcos-www` Cloudflare Worker, deployed
from the release commit by `./deploy.sh promote`.

## The shared shell

The look and the page controls come from
[tcos-app](https://github.com/Twin-Cities-Open-Systems/tcos-app), the org's home
for every web page: the theme selector (auto, light, dark, paper, high contrast,
midnight, graphite), the way-back pill on long pages, flip cards (the home page's
receipts) and the color tokens `css/site.css` maps its own names onto.
`sync-shell.sh` copies the files in `shell.manifest`, and CI fails when they
drift from tcos-app's main. Change them in tcos-app, never here.

