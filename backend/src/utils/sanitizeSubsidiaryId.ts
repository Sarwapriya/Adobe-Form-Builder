/**
 * Restricts a subsidiaryId route param to a safe path-segment character set
 * before it's used to build a directory under UPLOAD_DIR. Throws if nothing
 * safe remains, since an empty/unsafe id must not silently collapse to a
 * shared or root directory.
 */
export function sanitizeSubsidiaryId(subsidiaryId: string): string {
  const safe = subsidiaryId.replace(/[^A-Za-z0-9_-]/g, "");
  if (!safe) {
    throw new Error(`Invalid subsidiaryId: "${subsidiaryId}"`);
  }
  return safe;
}
