import * as mupdf from "mupdf";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Clip-render a sub-region of one PDF page at high scale for OCR of dense tables/code.
// Companion to to-images: when a whole-page render is too coarse to read a table/diagram,
// crop just that region and re-render it large. Coordinates are 0..1 fractions of the page
// box (resolved via getBounds), so they are independent of page size — the same yTop/yBot
// targets the same region on any paper.
//
// Usage: crop <pdf> <out.png> <page1based> <yTop> <yBot> [xLeft] [xRight] [scale]
//   yTop/yBot     vertical band, 0 (top) .. 1 (bottom)
//   xLeft/xRight  horizontal band, defaults 0 .. 1 (full width)
//   scale         render multiplier on 72-dpi; default 6. Keep output width <= ~1900px.

const [, , pdfArg, outArg, pageArg, yTopArg, yBotArg, xLArg, xRArg, scaleArg] = process.argv;

if (!pdfArg || !outArg || !pageArg || yTopArg === undefined || yBotArg === undefined) {
  console.error("Usage: crop <pdf> <out.png> <page1based> <yTop> <yBot> [xLeft] [xRight] [scale]");
  process.exit(1);
}

const pdfPath = path.resolve(pdfArg);
if (!existsSync(pdfPath)) {
  console.error(`File not found: ${pdfPath}`);
  process.exit(1);
}

const pageNum = Number(pageArg);
const yTop = Number(yTopArg);
const yBot = Number(yBotArg);
const xLeft = xLArg === undefined ? 0 : Number(xLArg);
const xRight = xRArg === undefined ? 1 : Number(xRArg);
const scale = Number(scaleArg) || 6;

if (!Number.isInteger(pageNum) || pageNum < 1) {
  console.error(`Invalid page (1-based integer): ${pageArg}`);
  process.exit(1);
}
if (!(yTop < yBot) || !(xLeft < xRight)) {
  console.error("Require yTop < yBot and xLeft < xRight (all in 0..1).");
  process.exit(1);
}

const doc = mupdf.Document.openDocument(readFileSync(pdfPath), "application/pdf");
const page = doc.loadPage(pageNum - 1);
const [bx0, by0, bx1, by1] = page.getBounds();
const w = bx1 - bx0;
const h = by1 - by0;

// Clip rect in page (point) space, then transform to device space for the pixmap bbox.
const clip: [number, number, number, number] = [
  bx0 + w * xLeft,
  by0 + h * yTop,
  bx0 + w * xRight,
  by0 + h * yBot,
];
const matrix = mupdf.Matrix.scale(scale, scale);
const bbox = mupdf.Rect.transform(clip, matrix).map(Math.round) as [number, number, number, number];

const pixmap = new mupdf.Pixmap(mupdf.ColorSpace.DeviceRGB, bbox, false);
pixmap.clear(255);
const dev = new mupdf.DrawDevice(matrix, pixmap);
page.run(dev, mupdf.Matrix.identity);
dev.close();

const outPath = path.resolve(outArg);
writeFileSync(outPath, pixmap.asPNG());
// eslint-disable-next-line no-console
console.log(`cropped -> ${outArg} (${pixmap.getWidth()}x${pixmap.getHeight()})`);

pixmap.destroy();
page.destroy();
doc.destroy();
