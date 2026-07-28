import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSolution } from "../src/codegen/generate";
import { formDefinitionSchema } from "../src/schema/formDefinitionZod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, "../sample-forms/contact-form.en-ar.json");
const outDir = join(__dirname, "../dist-sample-solution");

const form = formDefinitionSchema.parse(JSON.parse(readFileSync(fixturePath, "utf-8")));
const files = generateSolution(form);

for (const file of files) {
  const fullPath = join(outDir, file.path);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, file.content, "utf-8");
}

console.log(`Wrote ${files.length} files to ${outDir}`);
