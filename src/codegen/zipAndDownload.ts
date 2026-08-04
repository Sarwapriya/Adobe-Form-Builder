import { strToU8, zipSync } from "fflate";
import { downloadBlob } from "../utils/download.ts";
import type { GeneratedFile } from "@formbuilder/shared";

/** Side-effect module: zips the generated files and triggers a browser download.
 * Called only from a UI action — `generate.ts` itself stays pure. */
export function zipAndDownload(files: GeneratedFile[], zipFileName = "form-solution.zip"): void {
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) entries[f.path] = strToU8(f.contents);
  const zipped = zipSync(entries);
  const blob = new Blob([zipped as BlobPart], { type: "application/zip" });
  downloadBlob(blob, zipFileName);
}
