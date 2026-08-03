import path from "path";

/**
 * Strips path separators/traversal and unsafe characters from a user-supplied
 * file name while preserving its extension, so it's safe to use as a path
 * segment under UPLOAD_DIR.
 */
export function sanitizeFileName(originalName: string): string {
  const base = path.basename(originalName);
  const ext = path.extname(base);
  const stem = base.slice(0, base.length - ext.length);

  const safeStem = stem.replace(/[^A-Za-z0-9._-]/g, "_") || "file";
  const safeExt = ext.replace(/[^A-Za-z0-9.]/g, "");

  return `${safeStem}${safeExt}`;
}
