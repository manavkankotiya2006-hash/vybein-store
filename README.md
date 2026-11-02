# VYBEIN

The storefront for VYBEIN unisex extraits de parfum, built with [Astro](https://astro.build). It is a static site: pages are generated ahead of time and hosted on GitHub Pages at `vybein.shop`. Orders are sent on WhatsApp; nothing is charged on the website.

## Working on the site

You need Node.js 22.23 or newer.

```sh
npm install      # once
npm run dev      # preview at http://localhost:4321 while you edit
npm run build    # produce the finished site in dist/
```

## Where things live

- `src/data/products.ts` — **the one place to edit** products, prices, WhatsApp number, Instagram, UPI ID and the Diwali offer. Every page reads from here.
- `src/assets/products/` — product photos (`CODE-main.webp`). Astro resizes and compresses them automatically, so large originals are fine.
- `public/textures/labels/` — front-label artwork (`CODE.webp`) shown on the 3D bottle.
- `src/pages/` — one file per page. `perfumes/[slug].astro` generates a page for every perfume, such as `/perfumes/l-khm`.
- `src/scripts/three/` — the 3D bottle (`bottle.ts`) and its stage (`stage.ts`).
- `src/scripts/overture.ts` — the scroll-driven 3D story on the home page.
- `src/data/muse.ts` — the rotating perfume lines and styling advice.
- `src/styles/global.css` — colours, type and shared components.

## Adding a perfume

1. Add an entry to `PRODUCTS` in `src/data/products.ts` with a unique `id`, `code` and `slug`.
2. Add its photo as `src/assets/products/CODE-main.webp`.
3. Add its label artwork as `public/textures/labels/CODE.webp` (portrait, about 720 × 942 px; keep it under ~50 KB).

## Diwali offer

`STORE.diwaliOffer` controls the banners and the automatic "buy 2, get 1 free" discount. Set `active` to `false` to turn it off, or set `endsAt` to a date such as `"2026-11-15T23:59:59+05:30"` and it switches itself off then.

## Publishing

Pushing to `main` builds and publishes the site through `.github/workflows/deploy.yml`. One-time setup: in the GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.

Links from the old site keep working: `shop.html`, `cart.html` and the other pages keep their names, and `product.html?id=N` redirects to the new perfume page.
