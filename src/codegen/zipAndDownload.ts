import { zipSync, strToU8 } from "fflate";
import type { GeneratedFile } from "./generate";
import { downloadBlob } from "../utils/download";

export function zipAndDownload(files: GeneratedFile[], zipFilename = "solution.zip"): void {
  const entries: Record<string, Uint8Array> = {};
  for (const file of files) {
    entries[file.path] = strToU8(file.content);
  }
  const zipped = zipSync(entries, { level: 6 });
  const blob = new Blob([zipped], { type: "application/zip" });
  downloadBlob(blob, zipFilename);
}
