# font-subset

Subsets **GenWanMin2 TW** (源雲明體月, the headings serif) into chunked `woff2` for
self-hosting. Output is served by the web app at `/fonts/genwanmin/`.

Only the **Regular (400)** weight is shipped — the editorial design uses one serif
weight and varies hierarchy by size. Source OTFs are git-ignored (~22 MB each).

## Re-run

```sh
# 1. Download the release (git-ignored) and unzip into src/otf/
curl -L -o GenWanMin2TW-otf.zip \
  https://github.com/ButTaiwan/genwan-font/releases/download/v2.100/GenWanMin2TW-otf.zip
unzip GenWanMin2TW-otf.zip -d src/otf

# 2. Subset -> apps/web/public/fonts/genwanmin/ (woff2 chunks + result.css)
npm install
npm run build
```

`css.fontFamily` in `src/subset.mjs` must stay `"GenWanMin2 TW"` to match
`--font-serif` in `apps/web/app/assets/css/main.css`.

License: GenWanMin is SIL OFL 1.1 (free commercial use, self-hosting allowed).
