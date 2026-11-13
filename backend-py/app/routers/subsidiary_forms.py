"""Port of `backend/src/routes/subsidiaryForms.router.ts`.

Mounted at `/api/v1/forms` (see `app/main.py`), `require_auth` on every
route (any authenticated user; subsidiary-scoped internally). Route
registration order matters here exactly as it does in Express — `/contributions/
mine`, `/dashboard-summary`, and `/adhoc*` are registered before the generic
`/{id}` route, mirroring the Node source's own comments on why.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.form_pipeline import ValidationResult
from app.schemas.form_builder import (
    ContributionBody,
    CreateAdHocFormBody,
    CreateAdHocFormWithQuestionsBody,
    DraftUpdateBody,
    UpdateRequestBody,
)
from app.security.deps import require_auth
from app.services import (
    dashboard_service,
    form_access_service,
    form_builder_service,
    form_contribution_service,
    form_template_service,
    form_update_request_service,
    project_code_service,
)

router = APIRouter(dependencies=[Depends(require_auth)])


@router.get("")
def list_forms(db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> list[dict]:
    subsidiary_id = auth.get("subsidiaryId")
    if not subsidiary_id:
        return []
    return form_access_service.list_accessible_forms(db, subsidiary_id, auth["sub"])


# Registered before "/{id}" — otherwise it would be matched as a form id.
@router.get("/contributions/mine")
def list_my_contributions(db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> list[dict]:
    return form_contribution_service.list_own_contributions_all_forms(db, auth["sub"])


_EMPTY_BUCKET_COUNTS = {"total": 0, "drafts": 0, "pendingReview": 0, "changesRequested": 0, "published": 0}
_EMPTY_DASHBOARD_SUMMARY = {
    "counts": _EMPTY_BUCKET_COUNTS,
    "campaignStatusByType": {"all": _EMPTY_BUCKET_COUNTS, "adhoc": _EMPTY_BUCKET_COUNTS, "hr": _EMPTY_BUCKET_COUNTS},
    "recentCampaigns": [],
    "continueWorking": [],
    "actionRequired": [],
}


# The subsidiary user's post-login "Dashboard" landing page. Registered
# before "/{id}" for the same route-ordering reason as above.
@router.get("/dashboard-summary")
def dashboard_summary(db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> dict:
    subsidiary_id = auth.get("subsidiaryId")
    if not subsidiary_id:
        return _EMPTY_DASHBOARD_SUMMARY
    return dashboard_service.get_subsidiary_dashboard_summary(db, subsidiary_id)


@router.post("/adhoc", status_code=status.HTTP_201_CREATED)
def create_adhoc_form(body: CreateAdHocFormBody, db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> dict:
    subsidiary_id = auth.get("subsidiaryId")
    if not subsidiary_id:
        raise HTTPException(status_code=403, detail="This account has no subsidiary assigned")
    if body.copyFromFormId:
        owned = form_builder_service.find_owned_adhoc_form(db, body.copyFromFormId, subsidiary_id)
        if owned is None:
            raise HTTPException(status_code=404, detail="Form to copy not found")
    if body.copyFromTemplateId:
        template = form_template_service.get_template_if_visible(
            db, body.copyFromTemplateId, is_admin=False, subsidiary_name=subsidiary_id, user_id=auth["sub"]
        )
        if template is None:
            raise HTTPException(status_code=404, detail="Template not found")
    return form_builder_service.create_form(
        db,
        name=body.name,
        subsidiary_id=subsidiary_id,
        user_id=auth["sub"],
        origin="adhoc",
        project_code=body.projectCode,
        copy_from_form_id=body.copyFromFormId,
        copy_from_template_id=body.copyFromTemplateId,
        exclude_locked_project_code=True,
        exclude_hand_raiser_project_code=True,
    )


@router.post("/adhoc/with-questions", status_code=status.HTTP_201_CREATED)
def create_adhoc_form_with_questions(
    body: CreateAdHocFormWithQuestionsBody, db: Session = Depends(get_db), auth: dict = Depends(require_auth)
) -> dict:
    subsidiary_id = auth.get("subsidiaryId")
    if not subsidiary_id:
        raise HTTPException(status_code=403, detail="This account has no subsidiary assigned")
    return form_builder_service.create_form(
        db, name=body.name, subsidiary_id=subsidiary_id, user_id=auth["sub"], origin="adhoc", questions=body.questions
    )


@router.get("/adhoc")
def list_my_adhoc_forms(db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> list[dict]:
    subsidiary_id = auth.get("subsidiaryId")
    if not subsidiary_id:
        return []
    return form_builder_service.list_my_adhoc_forms(db, subsidiary_id)


@router.get("/adhoc/{id}")
def get_my_adhoc_form(id: str, db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> dict:
    subsidiary_id = auth.get("subsidiaryId")
    if not subsidiary_id or form_builder_service.find_owned_adhoc_form(db, id, subsidiary_id) is None:
        raise HTTPException(status_code=404, detail="form not found")
    detail = form_builder_service.get_form_detail(db, id)
    return detail


@router.patch("/adhoc/{id}/draft", status_code=status.HTTP_204_NO_CONTENT)
def update_adhoc_draft(id: str, body: DraftUpdateBody, db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> None:
    subsidiary_id = auth.get("subsidiaryId")
    owned = form_builder_service.find_owned_adhoc_form(db, id, subsidiary_id) if subsidiary_id else None
    if owned is None:
        raise HTTPException(status_code=404, detail="form not found")
    if owned.pendingReview:
        raise HTTPException(status_code=409, detail="This form is awaiting admin review — it can't be edited until reviewed")
    # Unchanged trigger point from before FormUpdateRequest existed (see
    # submit_adhoc_form_for_review's own doc comment) — the one new
    # exception is an approved, not-yet-consumed update request for this
    # subsidiary, which reopens this one edit instead of permanently.
    if owned.status == "published" and not form_update_request_service.has_open_update_request(db, id, subsidiary_id):
        raise HTTPException(
            status_code=409,
            detail="This campaign has been approved and published — request an update if you need to make a change",
        )
    project_code_service.assert_project_code_cutoff_not_passed(db, owned.projectCode)
    form_builder_service.update_draft(db, id, body.definition, body.config)


@router.post("/adhoc/{id}/consent-documents")
async def upload_adhoc_consent_document(
    id: str, kind: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db), auth: dict = Depends(require_auth)
) -> dict:
    """Subsidiary user's own "upload a PDF for Terms & Conditions / Privacy
    Policy" action — same ownership + edit-window gate as update_adhoc_draft
    above (not yet pending review, not yet published), never a new one. See
    form_builder_service.upload_consent_document."""
    if kind not in ("termsAndConditions", "privacyPolicy"):
        raise HTTPException(status_code=400, detail="kind must be termsAndConditions or privacyPolicy")
    subsidiary_id = auth.get("subsidiaryId")
    owned = form_builder_service.find_owned_adhoc_form(db, id, subsidiary_id) if subsidiary_id else None
    if owned is None:
        raise HTTPException(status_code=404, detail="form not found")
    if owned.pendingReview:
        raise HTTPException(status_code=409, detail="This form is awaiting admin review — it can't be edited until reviewed")
    if owned.status == "published" and not form_update_request_service.has_open_update_request(db, id, subsidiary_id):
        raise HTTPException(
            status_code=409,
            detail="This campaign has been approved and published — request an update if you need to make a change",
        )
    project_code_service.assert_project_code_cutoff_not_passed(db, owned.projectCode)
    data = await file.read()
    result = form_builder_service.upload_consent_document(db, id, kind, file.filename or "document.pdf", data)  # type: ignore[arg-type]
    if result["outcome"] == "not_found":
        raise HTTPException(status_code=404, detail="form not found")
    if result["outcome"] == "invalid":
        raise HTTPException(status_code=400, detail=result["reason"])
    return {"fileName": result["fileName"], "url": result["url"]}


@router.post("/adhoc/{id}/submit-for-review", status_code=status.HTTP_204_NO_CONTENT)
def submit_adhoc_for_review(id: str, db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> None:
    subsidiary_id = auth.get("subsidiaryId")
    if not subsidiary_id:
        raise HTTPException(status_code=404, detail="form not found")
    owned = form_builder_service.find_owned_adhoc_form(db, id, subsidiary_id)
    if owned is not None:
        project_code_service.assert_project_code_cutoff_not_passed(db, owned.projectCode)
    outcome = form_builder_service.submit_adhoc_form_for_review(db, id, subsidiary_id)
    if outcome == "not_found":
        raise HTTPException(status_code=404, detail="form not found")
    if outcome == "already_pending":
        raise HTTPException(status_code=409, detail="This form is already awaiting review")
    if outcome == "already_published":
        raise HTTPException(status_code=409, detail="This campaign has already been approved and published")


@router.delete("/adhoc/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_adhoc_form(id: str, db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> None:
    subsidiary_id = auth.get("subsidiaryId")
    if not subsidiary_id:
        raise HTTPException(status_code=404, detail="form not found")
    outcome = form_builder_service.delete_adhoc_form(db, id, subsidiary_id)
    if outcome == "not_found":
        raise HTTPException(status_code=404, detail="form not found")
    if outcome == "already_published":
        raise HTTPException(status_code=409, detail="This form has already been published and can no longer be deleted")


@router.get("/{id}")
def get_form(id: str, db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> dict:
    subsidiary_id = auth.get("subsidiaryId")
    if not subsidiary_id:
        raise HTTPException(status_code=404, detail="form not found")
    detail = form_access_service.get_accessible_form_detail(db, id, subsidiary_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="form not found")
    return detail


@router.post("/{id}/contributions", status_code=status.HTTP_201_CREATED)
def submit_contribution(id: str, body: ContributionBody, db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> dict:
    subsidiary_id = auth.get("subsidiaryId")
    if not subsidiary_id:
        raise HTTPException(status_code=404, detail="form not found")
    result = form_contribution_service.submit_contribution(db, id, auth["sub"], subsidiary_id, body.content, body.note)
    if result["outcome"] == "not_found":
        raise HTTPException(status_code=404, detail="form not found")
    if result["outcome"] == "invalid":
        validation: ValidationResult = result["validation"]
        raise HTTPException(status_code=422, detail={"error": "contribution is not valid", "validation": validation.model_dump()})
    if result["outcome"] == "project_locked":
        raise HTTPException(status_code=409, detail="This project code is locked — contributions can no longer be submitted")
    if result["outcome"] == "cutoff_passed":
        raise HTTPException(status_code=409, detail="This project code's cutoff date has passed — contributions can no longer be submitted")
    if result["outcome"] == "update_locked":
        raise HTTPException(
            status_code=409, detail="This form has been deployed — request an update if you need to make a change"
        )
    return result["contribution"]


@router.get("/{id}/contributions")
def list_contributions(id: str, db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> list[dict]:
    return form_contribution_service.list_own_contributions(db, id, auth["sub"])


@router.patch("/{id}/contributions/draft")
def save_contribution_draft(id: str, body: ContributionBody, db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> dict:
    subsidiary_id = auth.get("subsidiaryId")
    if not subsidiary_id:
        raise HTTPException(status_code=404, detail="form not found")
    result = form_contribution_service.save_contribution_draft(db, id, auth["sub"], subsidiary_id, body.content, body.note)
    if result["outcome"] == "not_found":
        raise HTTPException(status_code=404, detail="form not found")
    if result["outcome"] == "project_locked":
        raise HTTPException(status_code=409, detail="This project code is locked — contributions can no longer be submitted")
    if result["outcome"] == "cutoff_passed":
        raise HTTPException(status_code=409, detail="This project code's cutoff date has passed — contributions can no longer be submitted")
    if result["outcome"] == "update_locked":
        raise HTTPException(
            status_code=409, detail="This form has been deployed — request an update if you need to make a change"
        )
    return result["contribution"]


@router.post("/{id}/update-request", status_code=status.HTTP_201_CREATED)
def create_update_request(id: str, body: UpdateRequestBody, db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> dict:
    """A subsidiary user's "Request Update" action on a form that's
    currently locked for their own editing — works for an ad-hoc form they
    own, or any published form they can otherwise reach via Translate &
    Extend. See form_update_request_service.create_request."""
    subsidiary_id = auth.get("subsidiaryId")
    if not subsidiary_id:
        raise HTTPException(status_code=404, detail="form not found")
    result = form_update_request_service.create_request(db, id, subsidiary_id, auth["sub"], body.note)
    if result["outcome"] == "not_found":
        raise HTTPException(status_code=404, detail="form not found")
    if result["outcome"] == "already_open":
        raise HTTPException(status_code=409, detail="You already have an update request pending or approved for this form")
    return result["request"]


@router.get("/{id}/update-request")
def get_update_request(id: str, db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> Optional[dict]:
    """This subsidiary's own current (pending/approved) or most-recently-
    rejected update request for this form, or `null` if there's never been
    one — drives the "Request Update"/"awaiting approval"/"approved, editable
    now"/"rejected: <reason>" banner states on the subsidiary side."""
    subsidiary_id = auth.get("subsidiaryId")
    if not subsidiary_id:
        return None
    return form_update_request_service.get_own_active_request(db, id, subsidiary_id)
