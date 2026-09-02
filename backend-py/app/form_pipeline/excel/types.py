"""Port of packages/shared/src/excel/types.ts.

Only Issue/ValidationResult/RawRow/WorkbookMeta/ParsedWorkbook survive the
removal of the Excel-upload feature from the TypeScript codebase — kept here
because Issue/ValidationResult are also the shared vocabulary for the
schema-authored form validator (form/validator.py) and for contribution
merging (form/contribution.py). RawRow/WorkbookMeta/ParsedWorkbook are ported
for completeness/parity with the TS surface even though nothing in this
package currently constructs them.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel

Severity = Literal["error", "warning"]


class Issue(BaseModel):
    severity: Severity
    sheet: str
    # 1-based Excel row number, when applicable.
    row: Optional[int] = None
    column: Optional[str] = None
    message: str


class ValidationResult(BaseModel):
    errors: list[Issue]
    warnings: list[Issue]


class RawRow(BaseModel):
    """One raw data row from the "Complete Translations" sheet, columns already
    resolved to their logical roles (key / English / translation C / translation D)."""

    rowNumber: int
    key: str
    englishText: str
    translationC: str
    translationD: str


class WorkbookMetaPair(BaseModel):
    C: str
    D: str


class WorkbookMeta(BaseModel):
    subsidiary: WorkbookMetaPair
    languageCountry: WorkbookMetaPair
    country: WorkbookMetaPair
    projectCode: WorkbookMetaPair


class ParsedWorkbook(BaseModel):
    sourceFileName: str
    sheetNames: list[str]
    meta: WorkbookMeta
    # 1-based Excel row number of the column-header row.
    headerRowNumber: int
    rows: list[RawRow]
    issues: list[Issue]
