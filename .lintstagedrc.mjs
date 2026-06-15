export default {
  "*.{ts,tsx,vue,js,mjs,cjs}": ["eslint --fix", "prettier --write"],
  "*.{json,jsonc,yaml,yml,css,scss}": ["prettier --write"],
  "*.md": ["markdownlint-cli2 --fix", "prettier --write"],
};
