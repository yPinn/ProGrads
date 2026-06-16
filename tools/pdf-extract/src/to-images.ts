import { pdfToPng } from "pdf-to-png-converter";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

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

  // eslint-disable-next-line no-console
  console.log(`Converting: ${path.basename(pdfPath)}`);

  const pages = await pdfToPng(pdfPath, { viewportScale: 2.0, verbosityLevel: 0 });

  for (const page of pages) {
    if (!page.content) continue;
    const name = `page-${String(page.pageNumber).padStart(2, "0")}.png`;
    writeFileSync(path.join(outputDir, name), page.content);
    // eslint-disable-next-line no-console
    console.log(`  + ${name}`);
  }

  // eslint-disable-next-line no-console
  console.log(`\nDone: ${pages.length} page(s) -> ${outputDir}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
