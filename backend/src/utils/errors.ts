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
