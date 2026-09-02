"""Typed domain exceptions + the status-code mapping used to translate them
into HTTP responses — port of `backend/src/utils/errors.ts` +
`backend/src/middleware/errorHandler.ts`.

Only the exceptions actually reachable by phase-1 code (auth) are wired into
a FastAPI exception handler in `app/main.py`; the rest are defined now so
later phases (project codes, subsidiaries, form builder, uploads-era
carryover) can raise them without re-deriving the status mapping.
"""

from __future__ import annotations


class AppError(Exception):
    """Base class for every typed domain error below."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class UnsupportedFileTypeError(AppError):
    def __init__(self, message: str = "Only .xlsx/.xls files are accepted") -> None:
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, message: str = "Not found") -> None:
        super().__init__(message)


class ConflictError(AppError):
    def __init__(self, message: str = "Conflict") -> None:
        super().__init__(message)


class ValidationError(AppError):
    """A well-formed request that fails a business rule not expressible in
    the route's own pydantic schema alone (depends on the target row's
    existing state) — e.g. `auth_service.update_user`'s "standard user needs
    a subsidiary" check."""

    def __init__(self, message: str = "Validation failed") -> None:
        super().__init__(message)


class ProjectCodeClosedError(AppError):
    def __init__(self, message: str = "This project code is closed") -> None:
        super().__init__(message)


class ProjectCodeLockedError(AppError):
    def __init__(self, message: str = "This project code is locked") -> None:
        super().__init__(message)


class SubsidiaryInactiveError(AppError):
    def __init__(self, message: str = "This subsidiary is disabled") -> None:
        super().__init__(message)


class SubsidiaryProjectBlockedError(AppError):
    def __init__(
        self, message: str = "This project code is closed for new uploads from this subsidiary"
    ) -> None:
        super().__init__(message)


class ProjectCodeMismatchError(AppError):
    def __init__(
        self, message: str = "The workbook's project code does not match the one selected for this upload"
    ) -> None:
        super().__init__(message)


class SubsidiaryMismatchError(AppError):
    def __init__(
        self, message: str = "The workbook's subsidiary does not match the one selected for this upload"
    ) -> None:
        super().__init__(message)


# Status-code buckets, mirroring errorHandler.ts's instanceof chain exactly.
BAD_REQUEST_ERRORS = (UnsupportedFileTypeError, ProjectCodeMismatchError, SubsidiaryMismatchError, ValidationError)
NOT_FOUND_ERRORS = (NotFoundError,)
CONFLICT_ERRORS = (
    ConflictError,
    ProjectCodeClosedError,
    ProjectCodeLockedError,
    SubsidiaryInactiveError,
    SubsidiaryProjectBlockedError,
)


def status_code_for(err: AppError) -> int:
    if isinstance(err, BAD_REQUEST_ERRORS):
        return 400
    if isinstance(err, NOT_FOUND_ERRORS):
        return 404
    if isinstance(err, CONFLICT_ERRORS):
        return 409
    return 500
