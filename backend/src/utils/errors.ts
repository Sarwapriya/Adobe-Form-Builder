export class UnsupportedFileTypeError extends Error {
  constructor(message = "Only .xlsx/.xls files are accepted") {
    super(message);
    this.name = "UnsupportedFileTypeError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message = "Conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

/** Thrown when an upload is attempted against a project code an admin has
 * closed — see projectCodeService.assertProjectCodeOpenForUpload. */
export class ProjectCodeClosedError extends Error {
  constructor(message = "This project code is closed for new uploads") {
    super(message);
    this.name = "ProjectCodeClosedError";
  }
}

/** Thrown when an upload is attempted for a subsidiary an admin has disabled
 * outright — see subsidiaryService.assertSubsidiaryActiveForUpload. Blocks
 * every project code for that subsidiary in one step, independent of (and
 * layered above) SubsidiaryProjectBlockedError below, which scopes a block
 * to a single project code. */
export class SubsidiaryInactiveError extends Error {
  constructor(message = "This subsidiary is disabled for new uploads") {
    super(message);
    this.name = "SubsidiaryInactiveError";
  }
}

/** Thrown when an upload is attempted for a (subsidiary, project code) pair
 * an admin has specifically blocked — see
 * subsidiaryProjectBlockService.assertNotBlocked. Independent of
 * ProjectCodeClosedError above — either one blocks the upload; this one
 * scopes the block to a single subsidiary rather than every uploader. */
export class SubsidiaryProjectBlockedError extends Error {
  constructor(message = "This project code is closed for new uploads from this subsidiary") {
    super(message);
    this.name = "SubsidiaryProjectBlockedError";
  }
}

/** Thrown when the project code selected in the upload form doesn't match the
 * workbook's own "Project Code" metadata row (or that row is missing
 * entirely) — see uploadService.createUpload's cross-check against
 * generateFromWorkbook's projectCodeFromWorkbook. */
export class ProjectCodeMismatchError extends Error {
  constructor(message = "The workbook's project code does not match the one selected for this upload") {
    super(message);
    this.name = "ProjectCodeMismatchError";
  }
}

/** Thrown when the Subsidiary field submitted with the upload doesn't match
 * the workbook's own "Subsidiary" metadata row (or that row is missing
 * entirely) — checked for every uploader, admin or subsidiary-scoped alike.
 * See uploadService.createUpload's cross-check against
 * generateFromWorkbook's subsidiaryFromWorkbook. */
export class SubsidiaryMismatchError extends Error {
  constructor(message = "The workbook's subsidiary does not match the one selected for this upload") {
    super(message);
    this.name = "SubsidiaryMismatchError";
  }
}
