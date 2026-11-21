# Velvet Heat Cover Studio — GTA 6-style cover art maker

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/durov001/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/durov001/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01) — an offline web app that turns any photo and caption into GTA 6-style cover art: a dense multi-panel poster with bold lettering and a Vice City sunset grade, exported as a PNG.

Referral code: `zsk0hsg3` — https://make.fun/r/zsk0hsg3

## What it is

A static, fully offline poster studio. Open it in a desktop browser and it works with the network off — no server, no build step, no account, and no photo ever leaves the machine.

- **A finished poster on load** — the demo cast is already in place with the Sunset Gold grade and the Cast Mosaic layout, so the first thing you see is a complete cover.
- **Dense comic-grid covers** — 6 panels with thin light borders, slight tilts and one large hero panel, in three layouts: Cast Mosaic, Diagonal Strips and Six Grid.
- **Real poster grammar** — a role name tag on every panel, a giant two-word title with a sunset gradient, stripe lines, white outline and purple shadow, a neon script subtitle, a tagline ribbon, a five-star review strip, an edition badge, a gold starburst seal and a full movie billing block with a barcode.
- **Any photo** — choose files, drop or paste images anywhere; click a panel to crop it (drag to pan, scroll or slide to zoom, flip), or hit **Build my cover** and one photo fills the hero plus several detail crops.
- **Five colour grades** — Sunset Gold, Neon Night, Tropic Teal, Ultraviolet and Retro Print, each recolouring the photos, the title gradient and the accents as one palette.
- **Effects** — film grain, halftone dots, light leaks and vignette sliders, plus undo/redo and a one-click Shuffle.
- **Three real exports** — 1080×1080, 1080×1350 and 1920×1080, each a genuinely reflowed composition of the poster, not a crop, downloadable one by one or all at once.

## How to open it

Serve `app/` with any static file server and open `index.html` in a desktop browser:

```sh
node serve.ts
```

then visit http://localhost:8080. Everything the app needs — fonts, sample photos, scripts — lives under `app/`, so it works with the network off.

## How it is built

- `app/index.html` — the editor shell (three columns: photos, preview, caption).
- `app/style.css` — the dark purple editor chrome.
- `app/src/cover.js` — the single Canvas 2D renderer used for the live preview, the PNG exports and the screenshots.
- `app/src/main.js` — editor wiring: photo store, undo/redo, cropping, exports.
- `app/src/shots.js` — screenshot scenes (`?shot=cover`, `?shot=editor`, `?shot=cover45`, `?shot=cover11`).
- `app/fonts/` — Anton and Yellowtail, both under the SIL Open Font License 1.1.
- `app/samples/` — the six-photo demo cast (four AI-generated portraits plus the two sample photos from the bounty kit).
- `main.ts` — the entrypoint: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`.

## Originality

All code, layout coordinates, copy and graphics are original work made for this bounty. The app uses no Rockstar Games logo, artwork, character or font. The demo portraits were generated with an image model for this entry; the two scene photos are the kit's own samples, free to use.

## License

MIT — see `LICENSE`.
