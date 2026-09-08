"""Port of `backend/src/services/questionMasterService.ts`."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any, Literal, Optional

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.form_pipeline import FormDefinition, QuestionMasterRow, build_question_master_rows, build_question_master_workbook
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.project_code import ProjectCode
from app.models.question_master_version import QuestionMasterVersion
from app.models.subsidiary import Subsidiary
from app.services.file_service import absolute_file_path, save_question_master_file
from app.services.form_contribution_service import list_contributions_for_form


def _has_pending_contribution(db: Session, form_id: str) -> bool:
    contributions = list_contributions_for_form(db, form_id)
    return bool(contributions) and contributions[0]["status"] == "pending"


def _get_relevant_forms(db: Session, project_code: str) -> list[Form]:
    """Every non-deleted Form under this project code belonging to a currently
    *active* Subsidiary — the confirmed scope for both the readiness list and
    the generated export. A project code can have more than one Form per
    subsidiary (no DB constraint prevents it); each counts independently
    rather than picking "the" form for a subsidiary."""
    active_subsidiary_names = {
        s.name for s in db.execute(select(Subsidiary).where(Subsidiary.isActive == True)).scalars()  # noqa: E712
    }
    forms = list(
        db.execute(
            select(Form).where(Form.projectCode == project_code, Form.isDeleted == False)  # noqa: E712
        ).scalars()
    )
    return [f for f in forms if f.subsidiaryId in active_subsidiary_names]


def _published_locales(db: Session, form: Form) -> list[str]:
    if not form.publishedVersionId:
        return []
    version = db.get(FormVersion, form.publishedVersionId)
    if version is None:
        return []
    definition = FormDefinition.model_validate_json(version.definition)
    return [l.code for l in definition.locales]


def get_readiness(db: Session, project_code: str) -> list[dict[str, Any]]:
    forms = _get_relevant_forms(db, project_code)
    result = []
    for f in forms:
        published = f.status == "published" and f.publishedVersionId is not None
        pending_contribution = _has_pending_contribution(db, f.id)
        result.append(
            {
                "formId": f.id,
                "formName": f.name,
                "subsidiaryId": f.subsidiaryId,
                "published": published,
                "pendingContribution": pending_contribution,
                "readyForExport": published and not pending_contribution,
                "locales": _published_locales(db, f),
            }
        )
    return result


GenerateQuestionMasterOutcome = Literal["ok", "project_not_found", "not_locked"]


@dataclass
class GenerateQuestionMasterResult:
    outcome: GenerateQuestionMasterOutcome
    version: Optional[QuestionMasterVersion] = None


def generate_question_master(
    db: Session, project_code: str, division: str, generated_by_user_id: str
) -> GenerateQuestionMasterResult:
    """Generates a new Question Master version for a project code: compiles
    every ready form's `FormDefinition` under it into flat rows, writes the
    `.xlsx`, and persists the version row — assigning the next version number
    inside a locked transaction (`WITH (UPDLOCK, HOLDLOCK)`), scoped to
    `project_code`.

    Requires the project code to be locked first (`ProjectCode.isLocked`).
    "Ready" here means `readyForExport` (published, with no unmerged pending
    contribution outstanding) — see `get_readiness`.
    """
    project_code_row = db.execute(select(ProjectCode).where(ProjectCode.code == project_code)).scalar_one_or_none()
    if project_code_row is None:
        return GenerateQuestionMasterResult(outcome="project_not_found")
    if not project_code_row.isLocked:
        return GenerateQuestionMasterResult(outcome="not_locked")

    forms = _get_relevant_forms(db, project_code)
    ready_forms: list[Form] = []
    for form in forms:
        published = form.status == "published" and form.publishedVersionId is not None
        if published and not _has_pending_contribution(db, form.id):
            ready_forms.append(form)

    all_rows: list[QuestionMasterRow] = []
    subsidiary_ids: set[str] = set()
    for form in ready_forms:
        version = db.get(FormVersion, form.publishedVersionId)
        if version is None:
            continue
        definition = FormDefinition.model_validate_json(version.definition)
        all_rows.extend(build_question_master_rows(definition, division, project_code))
        subsidiary_ids.add(form.subsidiaryId)

    workbook_bytes = build_question_master_workbook(all_rows)
    id = str(uuid.uuid4())
    file_path = save_question_master_file(project_code, id, workbook_bytes)

    next_version_row = db.execute(
        text(
            "SELECT ISNULL(MAX(version), 0) + 1 AS nextVersion FROM QuestionMasterVersions "
            "WITH (UPDLOCK, HOLDLOCK) WHERE projectCode = :projectCode"
        ),
        {"projectCode": project_code},
    ).one()
    next_version = next_version_row.nextVersion

    entity = QuestionMasterVersion(
        id=id,
        projectCode=project_code,
        version=next_version,
        division=division,
        filePath=file_path,
        subsidiaryCount=len(subsidiary_ids),
        totalRows=len(all_rows),
        generatedByUserId=generated_by_user_id,
    )
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return GenerateQuestionMasterResult(outcome="ok", version=entity)


def list_versions(db: Session, project_code: str) -> list[QuestionMasterVersion]:
    return list(
        db.execute(
            select(QuestionMasterVersion)
            .where(QuestionMasterVersion.projectCode == project_code)
            .order_by(QuestionMasterVersion.version.desc())
        ).scalars()
    )


GetVersionFileOutcome = Literal["not_found", "ok"]


@dataclass
class GetVersionFileResult:
    outcome: GetVersionFileOutcome
    data: Optional[bytes] = None
    file_name: Optional[str] = None


def get_version_file(db: Session, id: str) -> GetVersionFileResult:
    version = db.get(QuestionMasterVersion, id)
    if version is None:
        return GetVersionFileResult(outcome="not_found")
    with open(absolute_file_path(version.filePath), "rb") as f:
        data = f.read()
    return GetVersionFileResult(
        outcome="ok",
        data=data,
        file_name=f"QuestionMaster_{version.projectCode}_v{version.version}.xlsx",
    )
