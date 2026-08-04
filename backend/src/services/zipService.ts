import { readFile } from "node:fs/promises";
import { zipSync, type Zippable } from "fflate";

export interface ZipEntry {
  /** Path/name the file should have inside the zip archive. */
  zipPath: string;
  /** Absolute filesystem path to read the file's bytes from. */
  absoluteFilePath: string;
}

/**
 * Reads every entry's bytes from disk and zips them into a single in-memory
 * buffer, synchronously (fflate's zipSync — the generated solution files are
 * small text files, so there's no need for the streaming/async zip API the
 * frontend's zipAndDownload.ts doesn't need either).
 */
export async function buildZip(entries: ZipEntry[]): Promise<Uint8Array> {
  const files: Zippable = {};
  for (const entry of entries) {
    files[entry.zipPath] = await readFile(entry.absoluteFilePath);
  }
  return zipSync(files);
}
