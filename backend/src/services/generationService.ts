import {
  defaultBuilderConfig,
  generateSolution,
  mapWorkbook,
  parseWorkbook,
  resolveFileNames,
  validateWorkbook,
  type BuilderConfig,
  type FileNames,
  type FormDefinition,
  type GeneratedFile,
  type ValidationResult,
} from "@formbuilder/shared";
import type { GeneratedFileType } from "../entities/GeneratedFile";

export interface GenerationResult {
  form: FormDefinition;
  validation: ValidationResult;
  files: GeneratedFile[];
  fileNames: FileNames;
}

/**
 * Runs the full Excel -> FormDefinition -> generated-Solution pipeline against an
 * uploaded workbook's raw bytes. Pure orchestration only — never touches the
 * filesystem or database; callers (uploadService.ts) decide what to persist, and
 * only do so once `validation.errors` is empty. `files` is empty whenever there
 * are blocking errors, since generating from an invalid form doesn't make sense.
 *
 * Always generates both the Full Form and One-Click variants with the default
 * BuilderConfig — the server-side upload flow has no per-upload configuration UI
 * (that only exists in the client-side wizard), so this is the one sensible
 * default until/unless a future phase adds server-side config options.
 */
export function generateFromWorkbook(buffer: ArrayBuffer, sourceFileName: string): GenerationResult {
  const parsed = parseWorkbook(buffer, sourceFileName);
  const mapped = mapWorkbook(parsed);
  const validation = validateWorkbook(mapped, parsed.issues);
  const config: BuilderConfig = { ...defaultBuilderConfig(), variants: ["ff", "oc"] };
  const fileNames = resolveFileNames(mapped.form, config);

  const files = validation.errors.length === 0 ? generateSolution(mapped.form, config) : [];

  return { form: mapped.form, validation, files, fileNames };
}

/**
 * Maps a generated file's path to the GeneratedFiles.fileType column value, by
 * comparing against the exact names `resolveFileNames` computed for this form —
 * more robust than guessing from the file extension alone, since both the data
 * file and the two behavior scripts all end in ".js".
 */
export function classifyFileType(path: string, fileNames: FileNames): GeneratedFileType {
  if (path === fileNames.css) return "css";
  if (path === fileNames.dataJs) return "data-js";
  return path.endsWith(".html") ? "html" : "js";
}
