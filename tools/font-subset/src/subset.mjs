// Subset GenWanMin2 TW (headings serif) into chunked woff2 for self-hosting.
// Source OTF is git-ignored — download the release before running (see README).
// Output (woff2 chunks + result.css) lands in the web app's public/ dir, served
// at /fonts/genwanmin/. font-family must match --font-serif in main.css.
import { fontSplit } from "cn-font-split";
import { fileURLToPath } from "node:url";
import { dirname, resolve, extname } from "node:path";
import { mkdir, readdir, copyFile, rm } from "node:fs/promises";

const here = dirname(fileURLToPath(import.meta.url));
const input = resolve(here, "otf/GenWanMin2TW-R.otf");
const dist = resolve(here, "../dist");
const publicDir = resolve(here, "../../../apps/web/public/fonts/genwanmin");

await rm(dist, { recursive: true, force: true });
await fontSplit({
  input,
  outDir: dist,
  targetType: "woff2",
  css: { fontFamily: "GenWanMin2 TW", commentUnicodes: false },
  previewImage: false,
  silent: true,
});

// Ship only the runtime assets; drop the reporter/preview artifacts.
await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });
const keep = new Set([".woff2", ".css"]);
for (const name of await readdir(dist)) {
  if (keep.has(extname(name))) await copyFile(resolve(dist, name), resolve(publicDir, name));
}
console.log("subset complete ->", publicDir);
