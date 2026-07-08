export default {
  "*.{ts,tsx,vue,js,mjs,cjs}": ["eslint --fix", "prettier --write"],
  "*.{json,jsonc,yaml,yml,css,scss}": ["prettier --write"],
  "*.md": ["markdownlint-cli2 --fix", "prettier --write"],
  // Editing tokens.json or its hand-mirrored CSS runs the mirror verifier (blocks commit on drift).
  "apps/web/design/tokens.json": () => "node apps/web/design/verify-tokens.mjs",
  "apps/web/app/assets/css/{tokens,semantic}.css": () => "node apps/web/design/verify-tokens.mjs",
};
