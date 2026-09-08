"""Port of `backend/src/routes/formBuilder.router.ts`.

Mounted at `/api/v1/admin/forms` (see `app/main.py`), `require_admin` on
every route (both `"admin"` and `"superadmin"`).
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.form_pipeline import ValidationResult
from app.models.form import FormOrigin, FormStatus
from app.schemas.form_builder import (
    ApproveAdHocBody,
    CreateFormBody,
    CreateFormWithQuestionsBody,
    DraftUpdateBody,
    ReviewNoteBody,
)
from app.security.deps import require_admin
from app.services import form_builder_service, form_contribution_service
from app.services.preview_service import PreviewVariant, build_form_version_preview

router = APIRouter(dependencies=[Depends(require_admin)])

_FORM_STATUS_VALUES = {"draft", "published", "unpublished"}
_FORM_ORIGIN_VALUES = {"admin", "adhoc"}


@router.get("")
def list_forms(
    status_: Optional[str] = Query(default=None, alias="status"),
    subsidiaryId: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    page: Optional[int] = Query(default=None),
    pageSize: Optional[int] = Query(default=None),
    pendingReview: Optional[str] = Query(default=None),
    origin: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> dict:
    pending_review: Optional[bool] = None
    if pendingReview == "true":
        pending_review = True
    elif pendingReview == "false":
        pending_review = False

    return form_builder_service.list_forms(
        db,
        page=page,
        page_size=pageSize,
        status=status_ if status_ in _FORM_STATUS_VALUES else None,  # type: ignore[arg-type]
        subsidiary_id=subsidiaryId,
        search=search,
        pending_review=pending_review,
        origin=origin if origin in _FORM_ORIGIN_VALUES else None,  # type: ignore[arg-type]
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def create_form(body: CreateFormBody, db: Session = Depends(get_db), auth: dict = Depends(require_admin)) -> dict:
    if body.copyFromFormId:
        source = form_builder_service.get_form_detail(db, body.copyFromFormId)
        if source is None:
            raise HTTPException(status_code=404, detail="Form to copy not found")
    return form_builder_service.create_form(
        db,
        name=body.name,
        subsidiary_id=body.subsidiaryId,
        project_code=body.projectCode,
        user_id=auth["sub"],
        copy_from_form_id=body.copyFromFormId,
    )


@router.post("/with-questions", status_code=status.HTTP_201_CREATED)
def create_form_with_questions(
    body: CreateFormWithQuestionsBody, db: Session = Depends(get_db), auth: dict = Depends(require_admin)
) -> dict:
    return form_builder_service.create_form(
        db,
        name=body.name,
        subsidiary_id=body.subsidiaryId,
        project_code=body.projectCode,
        user_id=auth["sub"],
        questions=body.questions,
    )


@router.get("/{id}")
def get_form(id: str, db: Session = Depends(get_db)) -> dict:
    detail = form_builder_service.get_form_detail(db, id)
    if detail is None:
        raise HTTPException(status_code=404, detail="form not found")
    return detail


@router.patch("/{id}/draft", status_code=status.HTTP_204_NO_CONTENT)
def update_draft(id: str, body: DraftUpdateBody, db: Session = Depends(get_db)) -> None:
    outcome = form_builder_service.update_draft(db, id, body.definition, body.config)
    if outcome == "not_found":
        raise HTTPException(status_code=404, detail="form not found")


@router.post("/{id}/publish")
def publish_form(id: str, db: Session = Depends(get_db), auth: dict = Depends(require_admin)) -> dict:
    result = form_builder_service.publish_form(db, id, auth["sub"])
    if result["outcome"] == "not_found":
        raise HTTPException(status_code=404, detail="form not found")
    if result["outcome"] == "invalid":
        validation: ValidationResult = result["validation"]
        raise HTTPException(status_code=422, detail={"error": "form is not valid", "validation": validation.model_dump()})
    return {"validation": result["validation"], "deployment": result["deployment"]}


@router.post("/{id}/unpublish", status_code=status.HTTP_204_NO_CONTENT)
def unpublish_form(id: str, db: Session = Depends(get_db)) -> None:
    outcome = form_builder_service.unpublish_form(db, id)
    if outcome == "not_found":
        raise HTTPException(status_code=404, detail="form not found")
    if outcome == "not_published":
        raise HTTPException(status_code=409, detail="form is not currently published")


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_form(id: str, db: Session = Depends(get_db)) -> None:
    outcome = form_builder_service.delete_form(db, id)
    if outcome == "not_found":
        raise HTTPException(status_code=404, detail="form not found")


@router.get("/{id}/versions")
def list_form_versions(id: str, db: Session = Depends(get_db)) -> list[dict]:
    return form_builder_service.list_form_versions(db, id)


@router.get("/{id}/preview")
def preview_form(id: str, variant: Optional[str] = Query(default=None), db: Session = Depends(get_db)) -> Response:
    resolved_variant: PreviewVariant = "oc" if variant == "oc" else "ff"
    result = build_form_version_preview(db, id, resolved_variant)
    if result["outcome"] == "not_found":
        raise HTTPException(status_code=404, detail="form not found or not published")
    if result["outcome"] == "no_files":
        raise HTTPException(status_code=409, detail="this form has no generated files")
    return Response(content=result["html"], media_type="text/html")


@router.get("/{id}/download")
def download_form(id: str, db: Session = Depends(get_db)) -> Response:
    result = form_builder_service.build_form_zip(db, id)
    if result["outcome"] == "not_found":
        raise HTTPException(status_code=404, detail="form not found")
    if result["outcome"] in ("unpublished", "no_files"):
        raise HTTPException(status_code=409, detail="this form has no published generated files")
    return Response(
        content=result["buffer"],
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{result["fileName"]}"'},
    )


@router.get("/{id}/contributions")
def list_contributions(id: str, db: Session = Depends(get_db)) -> list[dict]:
    return form_contribution_service.list_contributions_for_form(db, id)


@router.post("/{id}/adhoc/approve", status_code=status.HTTP_204_NO_CONTENT)
def approve_adhoc(id: str, body: ApproveAdHocBody, db: Session = Depends(get_db), auth: dict = Depends(require_admin)) -> None:
    result = form_builder_service.approve_adhoc_form(db, id, body.projectCode, auth["sub"])
    if result["outcome"] == "not_found":
        raise HTTPException(status_code=404, detail="form not found")
    if result["outcome"] == "not_adhoc":
        raise HTTPException(status_code=409, detail="This form was not created via My Forms")
    if result["outcome"] == "not_pending":
        raise HTTPException(status_code=409, detail="This form isn't currently awaiting review")
    if result["outcome"] == "invalid":
        validation: ValidationResult = result["validation"]
        raise HTTPException(status_code=422, detail={"error": "form is not valid", "validation": validation.model_dump()})


@router.post("/{id}/adhoc/reject", status_code=status.HTTP_204_NO_CONTENT)
def reject_adhoc(id: str, body: ReviewNoteBody, db: Session = Depends(get_db)) -> None:
    outcome = form_builder_service.reject_adhoc_form(db, id, body.reviewNote)
    if outcome == "not_found":
        raise HTTPException(status_code=404, detail="form not found")
    if outcome == "not_adhoc":
        raise HTTPException(status_code=409, detail="This form was not created via My Forms")
    if outcome == "not_pending":
        raise HTTPException(status_code=409, detail="This form isn't currently awaiting review")


@router.post("/{id}/contributions/{contributionId}/approve", status_code=status.HTTP_204_NO_CONTENT)
def approve_contribution(
    id: str, contributionId: str, body: ReviewNoteBody, db: Session = Depends(get_db), auth: dict = Depends(require_admin)
) -> None:
    result = form_contribution_service.approve_contribution(db, contributionId, auth["sub"], body.reviewNote)
    if result["outcome"] == "not_found":
        raise HTTPException(status_code=404, detail="contribution not found")
    if result["outcome"] == "not_pending":
        raise HTTPException(status_code=409, detail="contribution has already been reviewed")


@router.post("/{id}/contributions/{contributionId}/reject", status_code=status.HTTP_204_NO_CONTENT)
def reject_contribution(
    id: str, contributionId: str, body: ReviewNoteBody, db: Session = Depends(get_db), auth: dict = Depends(require_admin)
) -> None:
    outcome = form_contribution_service.reject_contribution(db, contributionId, auth["sub"], body.reviewNote)
    if outcome == "not_found":
        raise HTTPException(status_code=404, detail="contribution not found")
    if outcome == "not_pending":
        raise HTTPException(status_code=409, detail="contribution has already been reviewed")
