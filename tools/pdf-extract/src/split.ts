import * as mupdf from "mupdf";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Splits one PDF into several PDFs by page range — for source files that bundle multiple
// exam subjects back-to-back (e.g. NCCU's per-department master PDFs). Each range keeps
// its own copy of the full page objects (rearrangePages on a fresh PDFDocument per output),
// so outputs are independent, standalone PDFs.
//
// Usage: split <pdf> <out-dir> <name1>:<start1>-<end1> [<name2>:<start2>-<end2> ...]
//   start/end are 1-based, inclusive page numbers.

const [, , pdfArg, outDirArg, ...rangeArgs] = process.argv;

if (!pdfArg || !outDirArg || rangeArgs.length === 0) {
  console.error(
    "Usage: split <pdf> <out-dir> <name1>:<start1>-<end1> [<name2>:<start2>-<end2> ...]",
  );
  process.exit(1);
}

const pdfPath = path.resolve(pdfArg);
if (!existsSync(pdfPath)) {
  console.error(`File not found: ${pdfPath}`);
  process.exit(1);
}

const outDir = path.resolve(outDirArg);

const ranges = rangeArgs.map((arg) => {
  const match = /^([a-z0-9-]+):(\d+)-(\d+)$/.exec(arg);
  if (!match) {
    console.error(`Invalid range "${arg}", expected <name>:<start>-<end>`);
    process.exit(1);
  }
  const [, name, startStr, endStr] = match;
  const start = Number(startStr);
  const end = Number(endStr);
  if (start < 1 || end < start) {
    console.error(`Invalid page range in "${arg}": start must be >=1 and <= end`);
    process.exit(1);
  }
  return { name, start, end };
});

mkdirSync(outDir, { recursive: true });
const sourceBytes = readFileSync(pdfPath);

for (const { name, start, end } of ranges) {
  const doc = new mupdf.PDFDocument(sourceBytes);
  const total = doc.countPages();
  if (end > total) {
    console.error(`Range ${name}:${start}-${end} exceeds page count (${total}) — skipped`);
    doc.destroy();
    continue;
  }
  const keep: number[] = [];
  for (let i = start - 1; i <= end - 1; i++) keep.push(i);
  doc.rearrangePages(keep);

  const outPath = path.join(outDir, `${name}.pdf`);
  doc.save(outPath);
  // eslint-disable-next-line no-console
  console.log(`  + ${name}.pdf (pages ${start}-${end} -> ${outPath})`);
  doc.destroy();
}

// eslint-disable-next-line no-console
console.log(`\nDone: ${ranges.length} file(s) -> ${outDir}`);
