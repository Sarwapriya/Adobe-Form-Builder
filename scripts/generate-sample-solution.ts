/**
 * Runs the full Excel -> FormDefinition -> generated-Solution pipeline against every
 * real sample workbook in Documents/, writing output to dist-sample-solution/ for
 * eyeballing without going through the (not-yet-built) UI. Run via `npm run
 * generate-sample-solution`.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { defaultBuilderConfig, generateSolution, mapWorkbook, parseWorkbook, validateWorkbook } from "@formbuilder/shared";

const DOCS_DIR = path.resolve(import.meta.dirname, "../Documents");
const OUT_DIR = path.resolve(import.meta.dirname, "../dist-sample-solution");

const files = readdirSync(DOCS_DIR).filter((f) => f.endsWith(".xlsx"));

for (const file of files) {
  const buf = readFileSync(path.join(DOCS_DIR, file));
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  const parsed = parseWorkbook(arrayBuffer, file);
  const mapped = mapWorkbook(parsed);
  const validation = validateWorkbook(mapped, parsed.issues);

  const slug = file
    .replace(/\.xlsx$/i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase();
  const outDir = path.join(OUT_DIR, slug);

  console.log(`\n=== ${file} ===`);
  console.log(`  locales: ${mapped.form.locales.map((l) => `${l.code}${l.isRtl ? " (rtl)" : ""}`).join(", ")}`);
  console.log(`  questions: ${mapped.form.questions.map((q) => `${q.id}:${q.controlType}(${q.answers.length})`).join(", ")}`);
  console.log(`  errors: ${validation.errors.length}, warnings: ${validation.warnings.length}`);
  for (const e of validation.errors) console.log(`    ERROR: ${e.message}`);
  for (const w of validation.warnings) console.log(`    warn:  ${w.message}`);

  if (validation.errors.length > 0) {
    console.log("  Skipped generation (blocking errors present).");
    continue;
  }

  mkdirSync(outDir, { recursive: true });
  const generated = generateSolution(mapped.form, { ...defaultBuilderConfig(), variants: ["ff", "oc"] });
  for (const f of generated) {
    writeFileSync(path.join(outDir, f.path), f.contents, "utf-8");
  }
  console.log(`  Wrote ${generated.length} files to ${path.relative(process.cwd(), outDir)}`);
}
