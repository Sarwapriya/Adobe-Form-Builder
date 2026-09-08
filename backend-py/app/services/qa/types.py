"""Port of `backend/src/services/qa/types.ts`."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional

QaCategory = Literal[
    "structure",
    "field-validation",
    "field-interaction",
    "required-enforcement",
    "submit-gating",
    "submit-flow",
]

QaCheckStatus = Literal["passed", "failed"]


@dataclass
class QaCheckResult:
    """One assertion produced by `qa_introspection.py`, before it's
    persisted as a `QaTestCaseResult` row."""

    category: QaCategory
    name: str
    status: QaCheckStatus
    fieldId: Optional[str] = None
    message: Optional[str] = None
