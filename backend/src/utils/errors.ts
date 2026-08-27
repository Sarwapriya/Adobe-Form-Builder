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

/** A well-formed request that fails a business rule not expressible in the
 * route's own zod schema alone (e.g. it depends on the target row's existing
 * state) — see authService.updateUser's own "standard user needs a
 * subsidiary" check. */
export class ValidationError extends Error {
  constructor(message = "Validation failed") {
    super(message);
    this.name = "ValidationError";
  }
}

/** Thrown when an upload or a Form Initiator form is attempted against a
 * project code an admin has closed — see projectCodeService.assertProjectCodeOpen. */
export class ProjectCodeClosedError extends Error {
  constructor(message = "This project code is closed") {
    super(message);
    this.name = "ProjectCodeClosedError";
  }
}

/** Thrown when a non-admin (subsidiary/standard) user attempts an upload against a
 * project code an admin has locked — see
 * projectCodeService.assertProjectCodeUnlockedForUpload. Independent of
 * ProjectCodeClosedError above: isOpen/closed gates uploads for everyone and is meant
 * for the normal campaign window, while a lock is a more permanent freeze that admins
 * stay exempt from. */
export class ProjectCodeLockedError extends Error {
  constructor(message = "This project code is locked") {
    super(message);
    this.name = "ProjectCodeLockedError";
  }
}

/** Thrown when an upload or a Form Initiator form is attempted for a
 * subsidiary an admin has disabled outright — see
 * subsidiaryService.assertSubsidiaryActive. Blocks every project code for
 * that subsidiary in one step, independent of (and layered above)
 * SubsidiaryProjectBlockedError below, which scopes a block to a single
 * project code. */
export class SubsidiaryInactiveError extends Error {
  constructor(message = "This subsidiary is disabled") {
    super(message);
    this.name = "SubsidiaryInactiveError";
  }
}

/** Thrown when an upload or a Form Initiator form is attempted for a
 * (subsidiary, project code) pair an admin has specifically blocked — see
 * subsidiaryProjectBlockService.assertNotBlocked. Independent of
 * ProjectCodeClosedError above — either one blocks it; this one scopes the
 * block to a single subsidiary rather than everyone. */
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
