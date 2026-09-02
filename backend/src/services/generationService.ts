import type { FileNames } from "@formbuilder/shared";
import type { GeneratedFileType } from "../entities/GeneratedFile";

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
