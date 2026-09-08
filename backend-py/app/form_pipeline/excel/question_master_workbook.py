"""Port of packages/shared/src/excel/questionMasterWorkbook.ts.

Serializes Question Master rows into `.xlsx` bytes — the write-side
counterpart to the (removed) Excel parser's read-only use of the `xlsx` npm
package. A single "Question Master" sheet, header row first, columns in
`_COLUMNS` order regardless of row key insertion order. Uses `openpyxl` in
place of the `xlsx` npm package.
"""

from __future__ import annotations

from io import BytesIO

from openpyxl import Workbook

from .question_master_rows import QuestionMasterRow

# Exact column order of the reference Question Master workbooks.
_COLUMNS: tuple[str, ...] = (
    "division",
    "project",
    "subsidiary",
    "country_alpha_2",
    "locale",
    "question_code",
    "question_text_full",
    "question_text_alias",
    "mandatory_yn",
    "local_yn",
    "type",
    "answer_code",
    "answer_text_full",
    "answer_text_alias",
)


def build_question_master_workbook(rows: list[QuestionMasterRow]) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Question Master"

    sheet.append(list(_COLUMNS))
    for row in rows:
        sheet.append([row[column] for column in _COLUMNS])

    buffer = BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()
