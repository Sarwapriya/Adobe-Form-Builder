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
  /** The workbook's own "Project Code" metadata row (parsed.meta.projectCode,
   * C preferred over D, same resolution rule as subsidiary) — empty string if
   * the row wasn't found. Used by uploadService.createUpload to cross-check
   * against the project code the uploader picked in the upload form. */
  projectCodeFromWorkbook: string;
  /** The workbook's own "Subsidiary" metadata row — same value as
   * `form.meta.subsidiary` (mapper.ts already resolves it identically), just
   * surfaced here alongside projectCodeFromWorkbook for uploadService.ts's
   * symmetrical cross-check against the upload form's Subsidiary field. */
  subsidiaryFromWorkbook: string;
}

/**
 * Runs the full Excel -> FormDefinition -> generated-Solution pipeline against an
 * uploaded workbook's raw bytes. Pure orchestration only — never touches the
 * filesystem or database; callers (uploadService.ts) decide what to persist, and
 * only do so once `validation.errors` is empty. `files` is empty whenever there
 * are blocking errors, since generating from an invalid form doesn't make sense.
 *
 * `requiredOverrides` (questionId -> required) lets the uploader mark specific
 * questions optional before generation — every question defaults to required
 * (see QuestionDefinition.required's own doc comment), so this only ever needs
 * to carry the questions the uploader flipped to optional.
 *
 * Always generates both the Full Form and One-Click variants with the default
 * BuilderConfig — the server-side upload flow has no per-upload configuration UI
 * beyond required-question toggling (that's the client-side wizard's job), so
 * this is the one sensible default until/unless a future phase adds more.
 */
export function generateFromWorkbook(
  buffer: ArrayBuffer,
  sourceFileName: string,
  requiredOverrides?: Record<string, boolean>,
): GenerationResult {
  const parsed = parseWorkbook(buffer, sourceFileName);
  const mapped = mapWorkbook(parsed);

  if (requiredOverrides) {
    for (const question of mapped.form.questions) {
      if (Object.prototype.hasOwnProperty.call(requiredOverrides, question.id)) {
        question.required = requiredOverrides[question.id];
      }
    }
  }

  const validation = validateWorkbook(mapped, parsed.issues);
  const config: BuilderConfig = { ...defaultBuilderConfig(), variants: ["ff", "oc"] };
  const fileNames = resolveFileNames(mapped.form, config);

  const files = validation.errors.length === 0 ? generateSolution(mapped.form, config) : [];
  const projectCodeFromWorkbook = parsed.meta.projectCode.C || parsed.meta.projectCode.D || "";

  return {
    form: mapped.form,
    validation,
    files,
    fileNames,
    projectCodeFromWorkbook,
    subsidiaryFromWorkbook: mapped.form.meta.subsidiary,
  };
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
