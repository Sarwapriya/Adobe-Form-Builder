import fsp from "node:fs/promises";
import path from "node:path";
import type { GeneratedFile } from "@formbuilder/shared";
import { sanitizeSubsidiaryId } from "../utils/sanitizeSubsidiaryId";

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? "./uploads";
}

export function absoluteFilePath(relativePath: string): string {
  return path.join(getUploadDir(), relativePath);
}

export interface SavedGeneratedFile {
  fileName: string;
  relativePath: string;
}

/** Directory (relative to UPLOAD_DIR) holding one FormVersion's generated solution
 * files, keyed by the FormVersion's own id (not the parent Form's) since a publish
 * clones a fresh draft version and each published version keeps its own independent
 * output on disk. */
export function formVersionGeneratedDir(subsidiaryId: string, formVersionId: string): string {
  return path.join(sanitizeSubsidiaryId(subsidiaryId), "forms", formVersionId, "generated");
}

/** Directory (relative to UPLOAD_DIR) holding a Configuration form's own QA reports
 * — keyed by the parent Form's own id (not a FormVersion's), since a QA run against a
 * pending contribution or an ad-hoc draft never produces a FormVersion/GeneratedFiles
 * row to key off of in the first place — see qaRunService.createContributionQaRun/
 * createAdHocReviewQaRun. */
export function formQaStorageDir(subsidiaryId: string, formId: string): string {
  return path.join(sanitizeSubsidiaryId(subsidiaryId), "forms", formId, "qa");
}

/** Writes every generated solution file to one FormVersion's generated/ directory. */
export async function saveFormVersionGeneratedFiles(
  subsidiaryId: string,
  formVersionId: string,
  files: GeneratedFile[],
): Promise<SavedGeneratedFile[]> {
  const generatedDir = formVersionGeneratedDir(subsidiaryId, formVersionId);
  const absoluteDir = absoluteFilePath(generatedDir);
  await fsp.mkdir(absoluteDir, { recursive: true });

  const saved: SavedGeneratedFile[] = [];
  for (const file of files) {
    const relativePath = path.join(generatedDir, file.path);
    await fsp.writeFile(absoluteFilePath(relativePath), file.contents, "utf-8");
    saved.push({ fileName: file.path, relativePath });
  }
  return saved;
}

/** Directory (relative to UPLOAD_DIR) holding one Question Master version's generated
 * .xlsx — keyed by the QuestionMasterVersion row's own id, not its version number,
 * since the version number is only known once the locked transaction that assigns it
 * commits, but the id can be minted upfront (see
 * questionMasterService.generateQuestionMaster). Nested under the
 * (sanitized) project code purely for human-browsable organization on disk. Reuses
 * sanitizeSubsidiaryId as a generic path-segment sanitizer — a project code is just as
 * free-text/attacker-influenceable as a subsidiaryId route param, and the same safe
 * character set applies. */
export function questionMasterDir(projectCode: string, id: string): string {
  return path.join("question-master", sanitizeSubsidiaryId(projectCode), id);
}

/** Writes one Question Master version's .xlsx bytes to disk. Returns the path relative
 * to UPLOAD_DIR, as stored in QuestionMasterVersions.filePath. */
export async function saveQuestionMasterFile(projectCode: string, id: string, bytes: Uint8Array): Promise<string> {
  const relativePath = path.join(questionMasterDir(projectCode, id), "question-master.xlsx");
  const absolutePath = absoluteFilePath(relativePath);
  await fsp.mkdir(path.dirname(absolutePath), { recursive: true });
  await fsp.writeFile(absolutePath, bytes);
  return relativePath;
}
