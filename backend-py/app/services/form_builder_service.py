"""Port of `backend/src/services/formBuilderService.ts` — core builder-form
lifecycle: create (blank/copy/AI-seeded), list, get detail, save draft,
publish, unpublish, delete (hard/soft), ad-hoc submit/approve/reject/delete,
version listing, zip download.

Every function takes a SQLAlchemy `Session` as its first argument (this
codebase's established convention — see e.g. `project_code_service.py`).
Return shapes mirror the Node service's plain "view model" objects
(`FormListItem`/`FormDetail`/...) as plain dicts, so the FastAPI routers in
`app/routers/form_builder.py`/`app/routers/subsidiary_forms.py` can return
them directly and let FastAPI's own JSON encoding handle datetimes etc.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Literal, Optional

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.form_pipeline import (
    BuilderConfig,
    FormDefinition,
    GeneratedFile,
    LocaleInfo,
    QuestionDefinition,
    ValidationResult,
    default_builder_config,
    generate_solution,
    remap_locales_for_copy,
    resolve_file_names,
    validate_form_definition,
)
from app.form_pipeline.codegen.file_names import FileNames
from app.models.form import Form, FormOrigin, FormStatus
from app.models.form_contribution import FormContribution
from app.models.form_version import FormVersion, FormVersionStatus
from app.models.generated_file import GeneratedFile as GeneratedFileEntity
from app.services import email_service, project_code_service, subsidiary_project_block_service, subsidiary_service
from app.services.file_service import absolute_file_path, save_form_version_generated_files
from app.utils.background import run_in_background
from app.services.generation_service import classify_file_type
from app.services.sftp_service import SftpDeployFile, deploy_generated_files
from app.services.subsidiary_locale_service import list_subsidiary_locales
from app.services.zip_service import ZipEntry, build_zip
from app.utils.query_parsing import resolve_paging


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _generate_from_form_definition(
    form: FormDefinition, config: BuilderConfig
) -> dict[str, Any]:
    """Builder-authored counterpart to the (removed) Excel-upload
    generationService.generateFromWorkbook — the input is already a
    FormDefinition, not a workbook. Same "files: [] whenever there are
    blocking errors" convention as the Excel path."""
    validation = validate_form_definition(form)
    file_names = resolve_file_names(form, config)
    files = generate_solution(form, config) if len(validation.errors) == 0 else []
    return {"validation": validation, "files": files, "fileNames": file_names}


def _empty_form_definition(subsidiary_id: str) -> FormDefinition:
    return FormDefinition.model_validate(
        {
            "meta": {"subsidiary": subsidiary_id, "sourceFileName": "", "defaultLocale": "en_GB"},
            "locales": [
                {"code": "en_GB", "langSubtag": "en", "isRtl": False, "sourceColumn": "en_GB", "label": "English"}
            ],
            "questions": [],
            "fields": {"submitButton": {"labelByLocale": {"en_GB": "Submit"}}},
            "validationMessages": {},
            "pageError": {},
            "thankYou": {},
        }
    )


def _default_config(origin: FormOrigin) -> BuilderConfig:
    """Ad-hoc forms are Full Form only — a subsidiary user's own self-service
    form never gets a One-Click variant."""
    config = default_builder_config()
    config.variants = ["ff"] if origin == "adhoc" else ["ff", "oc"]
    return config


def _enforce_variants_for_origin(origin: FormOrigin, config: BuilderConfig) -> BuilderConfig:
    """Ad-hoc forms are Full Form only (see `_default_config`) — enforced
    here too, server-side, on every save/publish regardless of what's
    stored/passed."""
    if origin == "adhoc":
        config = config.model_copy(update={"variants": ["ff"]})
    return config


def _to_list_item(form: Form, published_version_number: Optional[int] = None) -> dict[str, Any]:
    return {
        "id": form.id,
        "name": form.name,
        "subsidiaryId": form.subsidiaryId,
        "projectCode": form.projectCode,
        "status": form.status,
        "createdByUserId": form.createdByUserId,
        "createdAt": form.createdAt,
        "updatedAt": form.updatedAt,
        "publishedVersionNumber": published_version_number,
        "origin": form.origin,
        "pendingReview": form.pendingReview,
        "submittedForReviewAt": form.submittedForReviewAt,
        "reviewedAt": form.reviewedAt,
        "reviewNote": form.reviewNote,
    }


def _parse_version_content(version: FormVersion) -> dict[str, Any]:
    return {
        "id": version.id,
        "definition": FormDefinition.model_validate_json(version.definition),
        "config": BuilderConfig.model_validate_json(version.config),
    }


def _published_version_number(db: Session, form: Form) -> Optional[int]:
    if not form.publishedVersionId:
        return None
    version = db.get(FormVersion, form.publishedVersionId)
    return version.versionNumber if version else None


def create_form(
    db: Session,
    *,
    name: str,
    subsidiary_id: str,
    user_id: str,
    project_code: Optional[str] = None,
    origin: FormOrigin = "admin",
    copy_from_form_id: Optional[str] = None,
    questions: Optional[list[QuestionDefinition]] = None,
) -> dict[str, Any]:
    """Creates a new builder form: a draft FormVersion (blank, or cloned from
    an existing form — see `copy_from_form_id`) plus the Form row pointing at
    it. No generation happens yet."""
    # Same governance gates as the (removed) Excel-upload path — see
    # project_code_service.assert_project_code_open's own doc comment. An
    # ad-hoc form has no project code yet at creation time (only chosen at
    # admin approval — see approve_adhoc_form below), so only the
    # subsidiary-active check applies here for that origin.
    subsidiary_service.assert_subsidiary_active(db, subsidiary_id)
    if project_code:
        project_code_service.assert_project_code_open(db, project_code)
        subsidiary_project_block_service.assert_not_blocked(db, subsidiary_id, project_code)

    copy_source = get_form_detail(db, copy_from_form_id) if copy_from_form_id else None
    source_content = (copy_source or {}).get("draft") or (copy_source or {}).get("published") if copy_source else None

    definition: FormDefinition
    if source_content:
        definition = source_content["definition"].model_copy(deep=True)
        definition.meta.subsidiary = subsidiary_id

        # Copying into a different subsidiary than the source form's own —
        # swap in the new subsidiary's own approved locale list instead of
        # silently carrying the old one over. See remapLocalesForCopy's own
        # doc comment for the full worked example.
        if source_content["definition"].meta.subsidiary != subsidiary_id:
            master_locales = list_subsidiary_locales(db, subsidiary_id)
            if master_locales:
                fallback = next((l for l in master_locales if l.isFallback), master_locales[0])
                new_locales = [
                    LocaleInfo(code=l.code, langSubtag=l.langSubtag, isRtl=l.isRtl, sourceColumn="builder", label=l.label)
                    for l in master_locales
                ]
                definition = remap_locales_for_copy(definition, new_locales, fallback.code)
    else:
        definition = _empty_form_definition(subsidiary_id)

    # Merge AI-suggested questions into the draft — prepended before any
    # existing questions so the user sees them first when the editor opens.
    if questions:
        definition = definition.model_copy(update={"questions": [*questions, *definition.questions]})

    config = _enforce_variants_for_origin(
        origin, source_content["config"] if source_content else _default_config(origin)
    )

    form_id = str(uuid.uuid4())
    form = Form(
        id=form_id,
        name=name,
        subsidiaryId=subsidiary_id,
        projectCode=project_code,
        status="draft",
        origin=origin,
        currentDraftVersionId=None,
        publishedVersionId=None,
        createdByUserId=user_id,
    )
    db.add(form)
    db.flush()

    draft_version = FormVersion(
        formId=form_id,
        versionNumber=None,
        definition=definition.model_dump_json(),
        config=config.model_dump_json(),
        status="draft",
        createdByUserId=user_id,
    )
    db.add(draft_version)
    db.flush()

    form.currentDraftVersionId = draft_version.id
    db.commit()
    db.refresh(form)

    return _to_list_item(form)


def list_forms(
    db: Session,
    *,
    page: Optional[int] = None,
    page_size: Optional[int] = None,
    status: Optional[FormStatus] = None,
    subsidiary_id: Optional[str] = None,
    search: Optional[str] = None,
    pending_review: Optional[bool] = None,
    origin: Optional[FormOrigin] = None,
    project_code: Optional[str] = None,
) -> dict[str, Any]:
    """Admin-facing list — every builder form regardless of who created it."""
    paging = resolve_paging(page, page_size)

    stmt = select(Form).where(Form.isDeleted == False)  # noqa: E712
    count_stmt = select(Form).where(Form.isDeleted == False)  # noqa: E712
    if status:
        stmt = stmt.where(Form.status == status)
        count_stmt = count_stmt.where(Form.status == status)
    if subsidiary_id:
        stmt = stmt.where(Form.subsidiaryId == subsidiary_id)
        count_stmt = count_stmt.where(Form.subsidiaryId == subsidiary_id)
    if search:
        stmt = stmt.where(Form.name.like(f"%{search}%"))
        count_stmt = count_stmt.where(Form.name.like(f"%{search}%"))
    if pending_review is not None:
        stmt = stmt.where(Form.pendingReview == pending_review)
        count_stmt = count_stmt.where(Form.pendingReview == pending_review)
    if origin:
        stmt = stmt.where(Form.origin == origin)
        count_stmt = count_stmt.where(Form.origin == origin)
    if project_code:
        stmt = stmt.where(Form.projectCode == project_code)
        count_stmt = count_stmt.where(Form.projectCode == project_code)

    total = len(list(db.execute(count_stmt).scalars()))
    rows = list(
        db.execute(stmt.order_by(Form.updatedAt.desc()).offset(paging.skip).limit(paging.pageSize)).scalars()
    )

    published_version_ids = [f.publishedVersionId for f in rows if f.publishedVersionId]
    version_number_by_id: dict[str, Optional[int]] = {}
    if published_version_ids:
        versions = list(db.execute(select(FormVersion).where(FormVersion.id.in_(published_version_ids))).scalars())
        version_number_by_id = {v.id: v.versionNumber for v in versions}

    items = [
        _to_list_item(f, version_number_by_id.get(f.publishedVersionId) if f.publishedVersionId else None)
        for f in rows
    ]
    return {"items": items, "total": total, "page": paging.page, "pageSize": paging.pageSize}


def list_my_adhoc_forms(db: Session, subsidiary_id: str) -> list[dict[str, Any]]:
    """A subsidiary user's own adhoc forms, every status — never paginated."""
    forms = list(
        db.execute(
            select(Form)
            .where(Form.subsidiaryId == subsidiary_id, Form.origin == "adhoc", Form.isDeleted == False)  # noqa: E712
            .order_by(Form.updatedAt.desc())
        ).scalars()
    )
    published_version_ids = [f.publishedVersionId for f in forms if f.publishedVersionId]
    version_number_by_id: dict[str, Optional[int]] = {}
    if published_version_ids:
        versions = list(db.execute(select(FormVersion).where(FormVersion.id.in_(published_version_ids))).scalars())
        version_number_by_id = {v.id: v.versionNumber for v in versions}
    return [
        _to_list_item(f, version_number_by_id.get(f.publishedVersionId) if f.publishedVersionId else None)
        for f in forms
    ]


def get_form_detail(db: Session, form_id: str) -> Optional[dict[str, Any]]:
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None:
        return None

    draft_version = db.get(FormVersion, form.currentDraftVersionId) if form.currentDraftVersionId else None
    published_version = db.get(FormVersion, form.publishedVersionId) if form.publishedVersionId else None

    result = _to_list_item(form, published_version.versionNumber if published_version else None)
    result["draft"] = _parse_version_content(draft_version) if draft_version else None
    result["published"] = (
        {**_parse_version_content(published_version), "versionNumber": published_version.versionNumber}
        if published_version and published_version.versionNumber is not None
        else None
    )
    return result


UpdateDraftOutcome = Literal["ok", "not_found"]


def update_draft(db: Session, form_id: str, definition: FormDefinition, config: BuilderConfig) -> UpdateDraftOutcome:
    """Saves the draft FormVersion's content in place ("Save Draft") — no
    validation gate here; validation only blocks Publish."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None or not form.currentDraftVersionId:
        return "not_found"

    draft_version = db.get(FormVersion, form.currentDraftVersionId)
    assert draft_version is not None
    draft_version.definition = definition.model_dump_json()
    draft_version.config = _enforce_variants_for_origin(form.origin, config).model_dump_json()
    form.updatedAt = _now()
    db.commit()
    return "ok"


PublishOutcome = Literal["ok", "not_found", "invalid"]


def publish_form(db: Session, form_id: str, user_id: str) -> dict[str, Any]:
    """Validates and generates the current draft, persists its
    GeneratedFiles, assigns a versionNumber inside a locked transaction, then
    clones the just-published content into a fresh draft row so further
    edits never touch this now-published version's data/on-disk output
    again."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None or not form.currentDraftVersionId:
        return {"outcome": "not_found"}

    draft_version = db.get(FormVersion, form.currentDraftVersionId)
    if draft_version is None:
        return {"outcome": "not_found"}

    definition = FormDefinition.model_validate_json(draft_version.definition)
    config = _enforce_variants_for_origin(form.origin, BuilderConfig.model_validate_json(draft_version.config))
    generation = _generate_from_form_definition(definition, config)
    validation: ValidationResult = generation["validation"]
    if len(validation.errors) > 0:
        return {"outcome": "invalid", "validation": validation}

    files: list[GeneratedFile] = generation["files"]
    file_names: FileNames = generation["fileNames"]
    saved = save_form_version_generated_files(form.subsidiaryId, draft_version.id, files)
    for f in saved:
        db.add(
            GeneratedFileEntity(
                formVersionId=draft_version.id,
                fileName=f.fileName,
                filePath=f.relativePath,
                fileType=classify_file_type(f.fileName, file_names),
            )
        )
    db.flush()

    published_at = _now()
    next_version_row = db.execute(
        text(
            "SELECT ISNULL(MAX(versionNumber), 0) + 1 AS nextVersion FROM FormVersions "
            "WITH (UPDLOCK, HOLDLOCK) WHERE formId = :formId"
        ),
        {"formId": form_id},
    ).one()
    next_version = next_version_row.nextVersion

    draft_version.status = "published"
    draft_version.versionNumber = next_version
    draft_version.publishedAt = published_at
    # Persist the enforced config (not the raw draft's), so a legacy ad-hoc
    # row's published record matches what was actually generated.
    draft_version.config = config.model_dump_json()

    form.status = "published"
    form.publishedVersionId = draft_version.id
    form.updatedAt = published_at

    # Any subsidiary contribution approved (merged onto the draft) since the
    # last publish is going live right now along with everything else in
    # this draft — stamp it so the submitter's status bar can show
    # "Published" instead of "Approved".
    db.execute(
        text(
            "UPDATE FormContributions SET publishedAt = :publishedAt "
            "WHERE formId = :formId AND status = 'approved' AND publishedAt IS NULL"
        ),
        {"publishedAt": published_at, "formId": form_id},
    )
    db.commit()

    # Clone the just-published content into a fresh draft — further edits
    # must never mutate the version row that was just published.
    new_draft = FormVersion(
        formId=form_id,
        versionNumber=None,
        definition=draft_version.definition,
        config=config.model_dump_json(),
        status="draft",
        createdByUserId=user_id,
    )
    db.add(new_draft)
    db.flush()
    form.currentDraftVersionId = new_draft.id
    db.commit()

    # Best-effort push to the Adobe Campaign SFTP drop folder — deliberately
    # never blocks or fails the publish itself.
    deployment = deploy_generated_files(
        db, [SftpDeployFile(absolutePath=absolute_file_path(f.relativePath), remoteFileName=f.fileName) for f in saved]
    )

    return {"outcome": "ok", "validation": validation, "deployment": deployment}


UnpublishOutcome = Literal["ok", "not_found", "not_published"]


def unpublish_form(db: Session, form_id: str) -> UnpublishOutcome:
    """Gates preview/download without deleting anything — re-publishing (or
    simply the fact nothing was removed) makes the same content reachable
    again."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None:
        return "not_found"
    if form.status != "published" or not form.publishedVersionId:
        return "not_published"

    form.status = "unpublished"
    form.updatedAt = _now()
    published_version = db.get(FormVersion, form.publishedVersionId)
    assert published_version is not None
    published_version.unpublishedAt = _now()
    db.commit()
    return "ok"


def find_owned_adhoc_form(db: Session, form_id: str, subsidiary_id: str) -> Optional[Form]:
    """Ownership-check helper for a subsidiary user's own adhoc form: returns
    `None` identically whether the form doesn't exist, isn't theirs, or was
    admin-authored, so a router 404 never leaks which case occurred."""
    return db.execute(
        select(Form).where(
            Form.id == form_id,
            Form.subsidiaryId == subsidiary_id,
            Form.origin == "adhoc",
            Form.isDeleted == False,  # noqa: E712
        )
    ).scalar_one_or_none()


SubmitAdHocOutcome = Literal["ok", "not_found", "already_pending"]


def submit_adhoc_form_for_review(db: Session, form_id: str, subsidiary_id: str) -> SubmitAdHocOutcome:
    """A subsidiary user's "Submit for Review" action. Best-effort notifies
    admins via `email_service.send_adhoc_review_submitted_notification` —
    never fails this action if the notification itself fails."""
    form = find_owned_adhoc_form(db, form_id, subsidiary_id)
    if form is None:
        return "not_found"
    if form.pendingReview:
        return "already_pending"

    form.pendingReview = True
    form.submittedForReviewAt = _now()
    form.reviewNote = None
    db.commit()

    form_name = form.name
    submitted_at = form.submittedForReviewAt
    run_in_background(lambda bg_db: email_service.send_adhoc_review_submitted_notification(bg_db, form_name, subsidiary_id, submitted_at))
    return "ok"


ApproveAdHocOutcome = Literal["ok", "not_found", "not_adhoc", "not_pending", "invalid"]


def approve_adhoc_form(db: Session, form_id: str, project_code: str, user_id: str) -> dict[str, Any]:
    """The admin review queue's "Approve" action — the one point a project
    code gets attached to an adhoc form, then reuses `publish_form` as-is.
    Applies the same governance gates as `create_form` against the *chosen*
    project code (and the form's own subsidiary, defensively) before
    attaching it."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None:
        return {"outcome": "not_found"}
    if form.origin != "adhoc":
        return {"outcome": "not_adhoc"}
    if not form.pendingReview:
        return {"outcome": "not_pending"}

    subsidiary_service.assert_subsidiary_active(db, form.subsidiaryId)
    project_code_service.assert_project_code_open(db, project_code)
    subsidiary_project_block_service.assert_not_blocked(db, form.subsidiaryId, project_code)

    form.projectCode = project_code
    form.pendingReview = False
    form.reviewNote = None
    form.reviewedAt = _now()
    db.commit()

    result = publish_form(db, form_id, user_id)
    if result["outcome"] == "not_found":
        return {"outcome": "not_found"}
    if result["outcome"] == "invalid":
        return {"outcome": "invalid", "validation": result["validation"]}
    return {"outcome": "ok"}


RejectAdHocOutcome = Literal["ok", "not_found", "not_adhoc", "not_pending"]


def reject_adhoc_form(db: Session, form_id: str, review_note: Optional[str] = None) -> RejectAdHocOutcome:
    """The admin review queue's "Reject" action — leaves the form untouched
    (still draft) but clears pendingReview so the subsidiary user can edit
    and resubmit."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None:
        return "not_found"
    if form.origin != "adhoc":
        return "not_adhoc"
    if not form.pendingReview:
        return "not_pending"

    form.pendingReview = False
    form.reviewNote = review_note if review_note else None
    form.reviewedAt = _now()
    db.commit()
    return "ok"


DeleteAdHocOutcome = Literal["ok", "not_found", "already_published"]


def delete_adhoc_form(db: Session, form_id: str, subsidiary_id: str) -> DeleteAdHocOutcome:
    """A subsidiary user's own "Delete" action on their ad-hoc form — allowed
    while still a draft or awaiting admin review, blocked once an admin has
    approved/published it. Checks `publishedVersionId` rather than the
    current status so a form an admin later unpublished stays undeletable
    too — "ever published", not "currently published"."""
    form = find_owned_adhoc_form(db, form_id, subsidiary_id)
    if form is None:
        return "not_found"
    if form.publishedVersionId is not None:
        return "already_published"
    delete_form(db, form_id)
    return "ok"


DeleteFormOutcome = Literal["ok", "not_found"]


def delete_form(db: Session, form_id: str) -> DeleteFormOutcome:
    """Hard-deletes a form that's never been published; soft-deletes
    (Form.isDeleted) one that has, mirroring Upload.isDeleted's own
    audit-trail convention."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None:
        return "not_found"

    if form.publishedVersionId is None:
        db.execute(text("DELETE FROM FormContributions WHERE formId = :formId"), {"formId": form_id})
        form.currentDraftVersionId = None
        form.publishedVersionId = None
        db.flush()
        db.execute(
            text("DELETE FROM GeneratedFiles WHERE formVersionId IN (SELECT id FROM FormVersions WHERE formId = :formId)"),
            {"formId": form_id},
        )
        db.execute(text("DELETE FROM FormVersions WHERE formId = :formId"), {"formId": form_id})
        db.execute(text("DELETE FROM Forms WHERE id = :formId"), {"formId": form_id})
        db.commit()
        return "ok"

    form.isDeleted = True
    db.commit()
    return "ok"


def list_form_versions(db: Session, form_id: str) -> list[dict[str, Any]]:
    versions = list(
        db.execute(select(FormVersion).where(FormVersion.formId == form_id).order_by(FormVersion.createdAt.desc())).scalars()
    )
    return [
        {
            "id": v.id,
            "versionNumber": v.versionNumber,
            "status": v.status,
            "createdAt": v.createdAt,
            "publishedAt": v.publishedAt,
            "unpublishedAt": v.unpublishedAt,
        }
        for v in versions
    ]


FormZipOutcome = Literal["not_found", "no_files", "unpublished", "ok"]


def build_form_zip(db: Session, form_id: str) -> dict[str, Any]:
    """Zips the published version's generated files — gated on the form
    actually being published (not merely having once been)."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None:
        return {"outcome": "not_found"}
    if form.status != "published" or not form.publishedVersionId:
        return {"outcome": "unpublished"}

    files = list(
        db.execute(select(GeneratedFileEntity).where(GeneratedFileEntity.formVersionId == form.publishedVersionId)).scalars()
    )
    published_version = db.get(FormVersion, form.publishedVersionId)
    if not files:
        return {"outcome": "no_files"}

    entries = [ZipEntry(zipPath=f.fileName, absoluteFilePath=absolute_file_path(f.filePath)) for f in files]
    buffer = build_zip(entries)
    safe_name = re.sub(r"[^a-zA-Z0-9._-]+", "-", form.name)
    version_label = published_version.versionNumber if published_version and published_version.versionNumber is not None else "draft"
    file_name = f"{safe_name}-v{version_label}.zip"
    return {"outcome": "ok", "buffer": buffer, "fileName": file_name}
