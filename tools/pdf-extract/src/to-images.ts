import * as mupdf from "mupdf";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Renders PDF pages to PNG via mupdf (FreeType) — solid glyph strokes, unlike pdfjs's
// self-drawn outlines which thin/break CJK. Output: <out>/page-NN.png (1-based, zero-padded).

async function main(): Promise<void> {
  const [, , pdfArg, outArg] = process.argv;

  if (!pdfArg) {
    console.error("Usage: to-images <pdf-path> [output-dir]");
    process.exit(1);
  }

  const pdfPath = path.resolve(pdfArg);
  if (!existsSync(pdfPath)) {
    console.error(`File not found: ${pdfPath}`);
    process.exit(1);
  }

  const outputDir = path.resolve(
    outArg ?? path.join(path.dirname(pdfPath), path.basename(pdfPath, ".pdf")),
  );
  mkdirSync(outputDir, { recursive: true });

  // Render scale: multiplier on the 72-dpi page size. Default 3.0 (=216 dpi); raise via
  // PDF_RENDER_SCALE for dense CJK (e.g. 8 for HD proofreading of admission prospectuses).
  const scale = Number(process.env.PDF_RENDER_SCALE) || 3.0;
  // Optional 1-based page subset for targeted renders, e.g. PDF_RENDER_PAGES="5" or "5,7,9".
  const pagesEnv = process.env.PDF_RENDER_PAGES;
  const pageFilter = pagesEnv
    ? new Set(
        pagesEnv
          .split(",")
          .map((n) => Number(n.trim()))
          .filter((n) => Number.isInteger(n) && n > 0),
      )
    : null;

  const doc = mupdf.Document.openDocument(readFileSync(pdfPath), "application/pdf");
  const total = doc.countPages();
  const matrix = mupdf.Matrix.scale(scale, scale);

  // eslint-disable-next-line no-console
  console.log(
    `Converting: ${path.basename(pdfPath)} @ scale ${scale}${pageFilter ? ` pages [${[...pageFilter].join(",")}]` : ""}`,
  );

  let written = 0;
  for (let i = 0; i < total; i++) {
    const pageNumber = i + 1;
    if (pageFilter && !pageFilter.has(pageNumber)) continue;

    const page = doc.loadPage(i);
    const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false);
    const name = `page-${String(pageNumber).padStart(2, "0")}.png`;
    writeFileSync(path.join(outputDir, name), pixmap.asPNG());
    // eslint-disable-next-line no-console
    console.log(`  + ${name}`);

    pixmap.destroy();
    page.destroy();
    written++;
  }
  doc.destroy();

  // eslint-disable-next-line no-console
  console.log(`\nDone: ${written} page(s) -> ${outputDir}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
