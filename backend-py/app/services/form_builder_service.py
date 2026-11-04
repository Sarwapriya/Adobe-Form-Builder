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

import json
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Literal, Optional

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.form_pipeline import (
    AnalyticsConfig,
    BuilderConfig,
    FormDefinition,
    GeneratedFile,
    LocaleInfo,
    PageCopy,
    PrivacyPolicyMeta,
    QuestionDefinition,
    TermsAndConditionsMeta,
    ValidationResult,
    default_builder_config,
    generate_solution,
    remap_locales_for_copy,
    resolve_file_names,
    validate_form_definition,
)
from app.form_pipeline.codegen.build_data_js import build_data_js
from app.form_pipeline.codegen.file_names import FileNames
from app.form_pipeline.codegen.types import ChannelConfig
from app.errors import NotFoundError, ValidationError
from app.models.form import Form, FormOrigin, FormStatus
from app.models.form_contribution import FormContribution
from app.models.form_template import FormTemplate
from app.models.form_version import FormVersion, FormVersionStatus
from app.models.generated_file import GeneratedFile as GeneratedFileEntity
from app.services import (
    consent_document_service,
    email_service,
    notification_service,
    page_error_locale_default_service,
    project_code_service,
    sftp_settings_service,
    subsidiary_project_block_service,
    subsidiary_recaptcha_config_service,
    subsidiary_service,
)
from app.services.file_service import absolute_file_path, save_form_version_generated_files
from app.utils.background import run_in_background
from app.services.generation_service import classify_file_type
from app.services.data_js_patch import merge_data_js
from app.services.html_structure_patch import diff_consents, diff_questions, patch_html_for_field_diff, patch_html_for_question_diff
from app.services.sftp_service import SftpDeployFile, deploy_generated_files
from app.services.subsidiary_locale_service import list_subsidiary_locales
from app.services.subsidiary_recipients import resolve_subsidiary_recipients
from app.services.zip_service import ZipEntry, build_zip
from app.utils.query_parsing import resolve_paging


def _now() -> datetime:
    return datetime.now(timezone.utc)


# Fixed Adobe Campaign tracking constants, the same for every subsidiary/
# form — only `apiEndpoint` (environment) and `analytics.reportSuiteID`
# (subsidiary) actually vary; `project` varies per form.
_ANALYTICS_IMS_ORG_ID = "3D4865E655DF7BD27F000101@AdobeOrg"
_ANALYTICS_DATASTREAM_ID = "fc12b34c-0f82-454d-a76e-4b923ba4a679"


def _resolve_analytics_param_updates(db: Session, form: Form) -> dict[str, Any]:
    """The `BuilderConfig` fields that flow into the published data file's
    `param`/`param.analytics` objects (see buildDataJs.ts/build_data_js.py)
    — resolved fresh at every publish from real data (the form's own project
    code, its subsidiary's Adobe Analytics Report Suite ID, and the
    currently-active SFTP deployment environment) rather than left as the
    generic tool's blank defaults. Applied the same way `projectCode`
    already is in `publish_form` — an override on top of whatever the
    stored draft config has, so a re-publish of an old form (created before
    this existed) still gets fully correct values.

    `apiEndpoint` itself is admin-editable per environment (Configuration >
    Deployment, see sftp_settings_service.SftpTargetConfig.apiEndpoint) —
    these URLs have already changed once in production use, so they aren't
    hardcoded here any more. A publish made while "staging" is active, later
    deployed after switching to "production" (or after an admin edits the
    endpoint URL), carries whatever endpoint was active at publish time —
    same accepted tradeoff as `project`/`reportSuiteID` below: generated
    files are static and deploy_form never regenerates them, so a changed
    setting only takes effect on the next publish."""
    deployment_settings = sftp_settings_service.get_sftp_deployment_settings(db)
    environment = deployment_settings.activeEnvironment
    target = deployment_settings.production if environment == "production" else deployment_settings.staging
    api_endpoint = target.apiEndpoint

    subsidiary = subsidiary_service.find_subsidiary_by_name(db, form.subsidiaryId)
    report_suite_id = subsidiary.reportSuiteId if subsidiary else None

    return {
        "apiEndpoint": api_endpoint,
        "project": form.projectCode or "",
        "channel": ChannelConfig(fullForm="COM", oneClick="EMAIL"),
        "channelDetail": ChannelConfig(fullForm="COM", oneClick="EMAIL"),
        "source": ChannelConfig(fullForm="full_form", oneClick="one_click"),
        "voucherRequired": "N",
        "analytics": AnalyticsConfig(
            enabled=True,
            reportSuiteID=report_suite_id,
            imsOrgID=_ANALYTICS_IMS_ORG_ID,
            datastreamID=_ANALYTICS_DATASTREAM_ID,
        ),
    }


def _resolve_recaptcha_site_key(db: Session, form: Form) -> dict[str, Any]:
    """`BuilderConfig.reCaptchaSiteKey` — resolved fresh at every generation
    from the admin-managed `SubsidiaryRecaptchaConfig` table (Configuration >
    Access & Locales), same pattern as `_resolve_analytics_param_updates`'s
    own Report Suite ID lookup. No builder UI ever lets a user type a site
    key directly (see `ReCaptchaMeta`'s own doc comment) — only whether
    reCAPTCHA is on for this form/variant; the key itself always comes from
    here. Returns an empty dict (no override) when the subsidiary has no key
    configured, leaving `reCaptchaSiteKey` at its blank default — the
    generated widget would then render with no sitekey, which the builder UI
    warns about separately rather than this function guessing a value."""
    site_key = subsidiary_recaptcha_config_service.get_site_key_for_subsidiary(db, form.subsidiaryId)
    return {"reCaptchaSiteKey": site_key} if site_key else {}


def _resolve_page_error_updates(db: Session, definition: FormDefinition) -> dict[str, PageCopy]:
    """`FormDefinition.pageError` overrides for every locale the form
    actually has, from the admin-managed, locale-keyed default table
    (Configuration > Access & Locales — page_error_locale_default_service).
    No builder UI ever lets an admin type this per form, so it was always
    blank until hand-edited into the generated file after every publish;
    this makes it correct automatically instead. Only overrides a locale
    that has a configured default — a locale with no row keeps whatever the
    stored draft already has (build_data_js's own locale/defaultLocale
    fallback still applies on top of that, same as before)."""
    defaults = page_error_locale_default_service.get_page_error_locale_defaults_map(db)
    merged = dict(definition.pageError)
    for locale in definition.locales:
        default = defaults.get(locale.code)
        if default is not None:
            merged[locale.code] = PageCopy(
                heading=default.heading,
                subHeading=default.subHeading,
                subHeadingUrl=default.subHeadingUrl,
                subHeadingUrlText=default.subHeadingUrlText,
            )
    return merged


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
    copy_from_template_id: Optional[str] = None,
    questions: Optional[list[QuestionDefinition]] = None,
    exclude_locked_project_code: bool = False,
    exclude_hand_raiser_project_code: bool = False,
) -> dict[str, Any]:
    """Creates a new builder form: a draft FormVersion (blank, cloned from an
    existing form — see `copy_from_form_id` — or cloned from a saved
    template — see `copy_from_template_id`) plus the Form row pointing at it.
    No generation happens yet.

    `copy_from_template_id` does a plain, unchecked lookup here — same as
    `copy_from_form_id` above it, which never re-checks ownership either; the
    caller (`app/routers/form_builder.py`/`subsidiary_forms.py`) is
    responsible for confirming the template is visible to this caller
    *before* calling this function, via `form_template_service.get_template_if_visible`.
    `copy_from_form_id`/`copy_from_template_id` are mutually exclusive — also
    enforced by the caller."""
    # Same governance gates as the (removed) Excel-upload path — see
    # project_code_service.assert_project_code_open's own doc comment. A
    # subsidiary user now picks the project code up front for their own
    # ad-hoc form too (validated the same way as any other project code
    # attachment, including the lock and the Hand-Raiser-only category — see
    # exclude_locked_project_code/exclude_hand_raiser_project_code, which the
    # subsidiary router passes as True); an admin may still reassign it at
    # approval time (approve_adhoc_form below) if needed, staying exempt from
    # both as usual.
    subsidiary_service.assert_subsidiary_active(db, subsidiary_id)
    if project_code:
        project_code_service.assert_project_code_open(
            db, project_code, exclude_locked=exclude_locked_project_code, exclude_hand_raiser=exclude_hand_raiser_project_code
        )
        subsidiary_project_block_service.assert_not_blocked(db, subsidiary_id, project_code)

    copy_source = get_form_detail(db, copy_from_form_id) if copy_from_form_id else None
    source_content = (copy_source or {}).get("draft") or (copy_source or {}).get("published") if copy_source else None

    if copy_from_template_id:
        template = db.get(FormTemplate, copy_from_template_id)
        if template is not None and not template.isDeleted:
            source_content = {
                "definition": FormDefinition.model_validate_json(template.definitionJson),
                "config": BuilderConfig.model_validate_json(template.configJson),
            }

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
    validation gate here; validation only blocks Publish. Only ever touches
    the draft, never a currently-live published version (the design-screen
    builder always edits toward the *next* publish, same as before) — then
    syncs the draft's own data.js (see sync_editable_data_js) if it already
    has generated files (e.g. from a pre-publish Edit Files session), so a
    design-screen change is reflected there immediately rather than only on
    the next Publish, without ever touching any hand-edited HTML/JS."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None or not form.currentDraftVersionId:
        return "not_found"

    draft_version = db.get(FormVersion, form.currentDraftVersionId)
    assert draft_version is not None
    # Captured unconditionally, before draft_version.definition is overwritten
    # below — this is the baseline sync_editable_data_js needs to tell "the
    # admin changed this leaf by hand" apart from "this leaf just differs
    # because the design screen changed it", for a hand-edited data.js (see
    # data_js_patch.py's own doc comment). Also doubles as the
    # structureFingerprint backfill below, same baseline either way.
    old_definition = FormDefinition.model_validate_json(draft_version.definition)
    # A version created before structureFingerprint existed has never had one
    # stamped, and publish_form treats a null fingerprint as "nothing to
    # compare against, so no conflict" (see its own doc comment) — correct
    # for a version that's never been touched since, but wrong the moment
    # this specific save is itself a structural change: with no baseline,
    # that change would go undetected and silently reset a hand-edited HTML
    # file with no warning. Backfilling right here, before the definition is
    # overwritten, establishes "this is what the files on disk currently
    # match" as the baseline, so THIS save's own structural change (if any)
    # is correctly caught at the next Publish instead of slipping through
    # for free.
    if draft_version.structureFingerprint is None:
        draft_version.structureFingerprint = compute_structure_fingerprint(old_definition)
    draft_version.definition = definition.model_dump_json()
    draft_version.config = _enforce_variants_for_origin(form.origin, config).model_dump_json()
    form.updatedAt = _now()
    db.commit()
    sync_editable_data_js(db, form_id, form.currentDraftVersionId, old_definition=old_definition)
    return "ok"


ConsentDocumentOutcome = Literal["ok", "not_found", "invalid"]


def _apply_consent_upload_to_definition(
    definition: FormDefinition, kind: consent_document_service.ConsentDocumentKind, file_name: str, url: str
) -> FormDefinition:
    """Pure patch: sets `uploadedFileName` plus every one of *this specific*
    definition's own locales' URL for the given kind. Applied independently
    to each `FormVersion.definition` that needs it (see upload_consent_document)
    — never cross-copies one definition's content onto another, since a
    draft can legitimately have other in-progress, not-yet-published changes
    the published version doesn't have yet, and vice versa."""
    locale_codes = [l.code for l in definition.locales]
    if kind == "termsAndConditions":
        current_tc = definition.fields.termsAndConditions or TermsAndConditionsMeta()
        updated_tc = current_tc.model_copy(
            update={"uploadedFileName": file_name, "urlByLocale": {**current_tc.urlByLocale, **{l: url for l in locale_codes}}}
        )
        return definition.model_copy(update={"fields": definition.fields.model_copy(update={"termsAndConditions": updated_tc})})
    current_pp = definition.fields.privacyPolicy or PrivacyPolicyMeta()
    updated_pp = current_pp.model_copy(
        update={"uploadedFileName": file_name, "linkUrlByLocale": {**current_pp.linkUrlByLocale, **{l: url for l in locale_codes}}}
    )
    return definition.model_copy(update={"fields": definition.fields.model_copy(update={"privacyPolicy": updated_pp})})


def upload_consent_document(
    db: Session, form_id: str, kind: consent_document_service.ConsentDocumentKind, original_file_name: str, data: bytes
) -> dict[str, Any]:
    """Admin/subsidiary "upload a PDF for Terms & Conditions / Privacy
    Policy" action. Validates and renames the file (consent_document_service),
    saves it to disk, then patches `uploadedFileName`/the resolved URL onto
    *both* FormVersions that matter:
      - the currently-*editable* version (`_editable_form_version_id` — the
        published version's own definition for an already-published form,
        same as Edit Files targets; the draft for one that isn't published
        yet) — and immediately regenerates *just* that version's data.js
        file (sync_editable_data_js) so the real URL is live right away,
        with no Publish needed and no risk to any hand-edited HTML/behavior-
        JS file, which this never touches.
      - the *draft* too, when it's a different version (i.e. the form is
        already published) — so the next Publish doesn't revert this back
        to a blank URL. Its on-disk files are left alone unless they
        already exist (sync_editable_data_js's own regenerate-on-miss rule).
    The actual SFTP push happens later, at Deploy time (see deploy_form) —
    this never touches Adobe itself.

    Caller (the two routers — form_builder.py for admin, subsidiary_forms.py
    for a subsidiary's own ad-hoc form) is responsible for
    ownership/permission checks before calling this; this function only
    knows about the form, not who's allowed to edit it."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None or not form.currentDraftVersionId:
        return {"outcome": "not_found"}

    rejection = consent_document_service.validate_pdf(original_file_name, data)
    if rejection:
        return {"outcome": "invalid", "reason": rejection}

    file_name = consent_document_service.build_file_name(original_file_name, form.subsidiaryId, kind)
    consent_document_service.save_consent_document(form.subsidiaryId, form_id, file_name, data)
    # Resolved against whichever environment is currently active — same
    # accepted tradeoff as _resolve_analytics_param_updates's apiEndpoint
    # above: if the active environment (or its base URL) changes between
    # this upload and the eventual Deploy, this URL keeps whatever was
    # active at upload time rather than being re-resolved later.
    deployment_settings = sftp_settings_service.get_sftp_deployment_settings(db)
    active_target = (
        deployment_settings.production if deployment_settings.activeEnvironment == "production" else deployment_settings.staging
    )
    url = consent_document_service.resolve_sample_url(file_name, active_target.resourceTrackingBaseUrl)

    target_version_id = _editable_form_version_id(form) or form.currentDraftVersionId
    version_ids = {target_version_id, form.currentDraftVersionId}
    old_definitions: dict[str, FormDefinition] = {}
    for version_id in version_ids:
        version = db.get(FormVersion, version_id)
        assert version is not None
        definition = FormDefinition.model_validate_json(version.definition)
        old_definitions[version_id] = definition
        # Same backfill-before-overwrite as update_draft, for a version that
        # predates structureFingerprint — see that function's own doc
        # comment for why this has to happen before `version.definition` is
        # replaced below.
        if version.structureFingerprint is None:
            version.structureFingerprint = compute_structure_fingerprint(definition)
        version.definition = _apply_consent_upload_to_definition(definition, kind, file_name, url).model_dump_json()
    form.updatedAt = _now()
    db.commit()

    for version_id in version_ids:
        sync_editable_data_js(db, form_id, version_id, old_definition=old_definitions[version_id])

    return {"outcome": "ok", "fileName": file_name, "url": url}


def compute_structure_fingerprint(definition: FormDefinition) -> str:
    """A deterministic digest of "which question ids exist, which optional
    profile fields are present, and which answer ids each question has" —
    the parts of a FormDefinition that change the generated HTML's actual
    *shape* (a new/removed `.form_check_module`/`.form_top_group`/consent-
    checkbox/answer block), as opposed to just their text/data content,
    which lives entirely in data.js and never requires the HTML to change at
    all — see renderQuestionModule.ts/renderProfileField.ts's own doc
    comments on why the HTML is text-empty. The per-language behavior-JS
    files (buildFfJs.ts/buildOcJs.ts) are NOT affected by this at all — each
    is the reference script embedded byte-identical regardless of form
    structure, tagged only with a language pin — so this fingerprint is
    never compared against them. Compared at Publish time (see
    publish_form) to decide whether a hand-edited HTML file is still
    structurally valid; a whole question being added/removed is then
    surgically merged into it (see html_structure_patch.py) rather than
    discarding the hand-edit — an answer being added/removed from an
    existing question is only *detected* here (its own DOM id is derived
    from its position, so a simple single-block patch would mislabel every
    later answer — see that module's own doc comment) and still falls back
    to the admin's confirmation before being reset."""
    f = definition.fields
    present_fields = sorted(
        name
        for name, value in (
            ("email", f.email), ("firstName", f.firstName), ("lastName", f.lastName),
            ("countryCode", f.countryCode), ("callingCode", f.callingCode), ("mobileNumber", f.mobileNumber),
            ("privacyPolicy", f.privacyPolicy), ("marketingOptin", f.marketingOptin),
            ("termsAndConditions", f.termsAndConditions), ("recaptcha", f.recaptcha),
        )
        if value is not None
    )
    consent_ids = sorted(c.id for c in (f.additionalConsents or []))
    question_ids = sorted(q.id for q in definition.questions)
    answers_by_question = {q.id: sorted(a.id for a in q.answers) for q in definition.questions}
    return json.dumps(
        {"questions": question_ids, "fields": present_fields, "consents": consent_ids, "answers": answers_by_question},
        sort_keys=True,
    )


def sync_editable_data_js(db: Session, form_id: str, version_id: str, old_definition: Optional[FormDefinition] = None) -> None:
    """Keeps one FormVersion's data.js file continuously in sync with its
    own current definition. Called after any action that changes a
    definition without going through a full Publish (update_draft /
    upload_consent_document), so a design-screen change reaches the real,
    already-generated files immediately — no Publish needed just for a
    data-only change to show up. Never touches any other file (html/js/css),
    so a hand-edit made there via Edit Files is never at risk from this.

    If the data.js row is itself hand-edited (via Edit Files) and the caller
    passed `old_definition` — the definition this version's files matched
    *before* the change that's calling this function — the hand-edit is
    3-way-merged against it rather than unconditionally overwritten (see
    data_js_patch.py's own doc comment for why this is safe: data.js is pure
    data, so "what changed" is a plain data diff). `old_definition` is
    omitted for the one-off "no generated files at all yet" case below,
    where there's nothing to merge against anyway.

    If this version has no generated files at all yet (never touched by
    Edit Files or a previous publish), generates the full set fresh instead
    — same "regenerate on miss" convention ensure_draft_generated_files
    already uses — and stamps structureFingerprint, since every file is
    freshly correct at that point. Degrades quietly (does nothing) if the
    definition is currently invalid or the version/form can't be found —
    Save Draft has no validation gate (see update_draft's own doc comment),
    so a mid-edit, momentarily-invalid definition must never raise here."""
    version = db.get(FormVersion, version_id)
    form = db.get(Form, form_id)
    if version is None or form is None:
        return

    definition = FormDefinition.model_validate_json(version.definition)
    definition = definition.model_copy(update={"pageError": _resolve_page_error_updates(db, definition)})
    config = _enforce_variants_for_origin(form.origin, BuilderConfig.model_validate_json(version.config))
    generation_config = config.model_copy(update={"projectCode": form.projectCode, **_resolve_analytics_param_updates(db, form), **_resolve_recaptcha_site_key(db, form)})
    generation = _generate_from_form_definition(definition, generation_config)
    if len(generation["validation"].errors) > 0:
        return

    files: list[GeneratedFile] = generation["files"]
    file_names: FileNames = generation["fileNames"]

    existing = list(db.execute(select(GeneratedFileEntity).where(GeneratedFileEntity.formVersionId == version_id)).scalars())
    if not existing:
        saved = save_form_version_generated_files(form.subsidiaryId, version_id, files)
        for f in saved:
            db.add(
                GeneratedFileEntity(
                    formVersionId=version_id, fileName=f.fileName, filePath=f.relativePath,
                    fileType=classify_file_type(f.fileName, file_names),
                )
            )
        version.structureFingerprint = compute_structure_fingerprint(definition)
        db.commit()
        return

    data_js = next((f for f in files if f.path == file_names.dataJs), None)
    existing_data_row = next((row for row in existing if row.fileName == file_names.dataJs), None)
    if data_js is None or existing_data_row is None:
        # The data file's own expected name no longer matches any existing
        # row (e.g. the subsidiary/project code changed since these files
        # were last generated) — rare, and not safe to guess a path for;
        # leave it for the next full Publish or explicit "Regenerate from
        # definition" to resolve properly instead of writing to the wrong
        # place or silently doing nothing useful.
        return

    new_content = data_js.contents
    if existing_data_row.editedAt is not None and old_definition is not None:
        with open(absolute_file_path(existing_data_row.filePath), "r", encoding="utf-8", newline="") as fh:
            hand_content = fh.read()
        old_data_js = build_data_js(old_definition, generation_config, file_names)
        merged = merge_data_js(old_data_js.contents, hand_content, new_content)
        if merged is not None:
            new_content = merged
        # else: a genuine conflict (or the hand-edit no longer parses as
        # JSON) — this path has no confirmation step to fall back to (Save
        # Draft is a silent, unconditional background sync, unlike Publish),
        # so it falls through to the unconditional overwrite below same as
        # before this function could merge at all; editedAt is cleared since
        # the content on disk is about to stop reflecting any hand-edit.
        else:
            existing_data_row.editedAt = None
            existing_data_row.editedByUserId = None
            db.commit()
    with open(absolute_file_path(existing_data_row.filePath), "w", encoding="utf-8", newline="") as fh:
        fh.write(new_content)


PublishOutcome = Literal["ok", "not_found", "invalid", "structural_conflict"]


def publish_form(db: Session, form_id: str, user_id: str, force: bool = False) -> dict[str, Any]:
    """Validates and generates the current draft, persists its
    GeneratedFiles, assigns a versionNumber inside a locked transaction, then
    clones the just-published content into a fresh draft row so further
    edits never touch this now-published version's data/on-disk output
    again. Makes the campaign visible/downloadable for subsidiary users —
    deliberately does NOT push anything to Adobe over SFTP; see `deploy_form`
    for that, a separate, explicit action (admins were reading this function's
    old combined behavior as a subsidiary-only "preview" publish when it was
    actually also deploying)."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None or not form.currentDraftVersionId:
        return {"outcome": "not_found"}
    was_already_published = form.status == "published"
    # Captured before anything below mutates form.status/publishedVersionId —
    # this is the FormVersion Edit Files has actually been writing hand-edits
    # to all along (_editable_form_version_id's own doc comment: a published
    # form keeps editing its live publishedVersionId directly, never the
    # draft). The draft (form.currentDraftVersionId) only ever gets
    # hand-edited via Edit Files while the form has never been published yet
    # — once published, the two diverge, and hand-edit preservation below
    # must read from wherever Edit Files actually wrote, not blindly from
    # the draft.
    editable_version_id = _editable_form_version_id(form) or form.currentDraftVersionId

    draft_version = db.get(FormVersion, form.currentDraftVersionId)
    if draft_version is None:
        return {"outcome": "not_found"}

    definition = FormDefinition.model_validate_json(draft_version.definition)
    # Same publish-time-override treatment as projectCode/apiEndpoint/
    # reportSuiteID below, just on the FormDefinition itself rather than
    # BuilderConfig — see _resolve_page_error_updates.
    definition = definition.model_copy(update={"pageError": _resolve_page_error_updates(db, definition)})
    config = _enforce_variants_for_origin(form.origin, BuilderConfig.model_validate_json(draft_version.config))
    # The form's project code goes into every generated file name (see
    # file_names.py). It's read from the Form row *now* — never from the stored
    # draft config — since it can be assigned after the draft exists (e.g. on
    # ad-hoc approval). The published version below records the config it was
    # actually generated with (code included) so its preview can recompute the
    # exact names; the fresh draft further down keeps the code-free `config`.
    generation_config = config.model_copy(
        update={"projectCode": form.projectCode, **_resolve_analytics_param_updates(db, form), **_resolve_recaptcha_site_key(db, form)}
    )
    generation = _generate_from_form_definition(definition, generation_config)
    validation: ValidationResult = generation["validation"]
    if len(validation.errors) > 0:
        return {"outcome": "invalid", "validation": validation}

    files: list[GeneratedFile] = generation["files"]
    file_names: FileNames = generation["fileNames"]

    # The form definition is the single source of truth for every file's
    # *content*, full stop — but a hand-edit made via the Edit Files window
    # (update_generated_file_content) to an HTML file is now preserved across
    # a publish *unless* the form's structure (which questions/fields exist —
    # see compute_structure_fingerprint) actually changed since that file was
    # last generated, in which case publishing requires the admin's explicit
    # confirmation (`force`) before any hand-edited HTML file is reset.
    # data.js is never part of this: it's pure data, always safely
    # regenerated fresh (and already kept in sync continuously by
    # sync_editable_data_js well before Publish is even clicked — see
    # update_draft/upload_consent_document). The behavior-JS files
    # (buildFfJs/buildOcJs) are NOT part of this check either, even though
    # they're also classified "js" — see their own doc comments: each is the
    # reference script embedded byte-identical, tagged only with a one-line
    # language pin, so its freshly generated content never actually depends
    # on which questions/fields exist. Treating it as structurally affected
    # would reset a hand-edit (e.g. a redirect URL) for no reason every time
    # a question is added — only HTML genuinely embeds per-question markup.
    #
    # Hand-edits are read from `editable_version_id`'s own files, NOT
    # unconditionally from draft_version.id — for an already-published form
    # those are two different FormVersion rows (Edit Files writes straight
    # to the live publishedVersionId; the design-screen builder writes to
    # the draft), so reading only from the draft would silently miss every
    # hand-edit made on the form an admin is actually looking at.
    editable_version = draft_version if editable_version_id == draft_version.id else db.get(FormVersion, editable_version_id)
    assert editable_version is not None
    existing_editable_files = list(
        db.execute(select(GeneratedFileEntity).where(GeneratedFileEntity.formVersionId == editable_version_id)).scalars()
    )
    # A version published before structureFingerprint existed has never had
    # one stamped — same backfill rationale as update_draft's own doc
    # comment, but using THIS version's own (frozen, since a published
    # version's definition is never mutated again) stored definition as the
    # baseline, since that's exactly the structure its on-disk files were
    # actually generated to match.
    if editable_version.structureFingerprint is None:
        editable_version.structureFingerprint = compute_structure_fingerprint(
            definition if editable_version_id == draft_version.id else FormDefinition.model_validate_json(editable_version.definition)
        )

    new_fingerprint = compute_structure_fingerprint(definition)
    structural_change = editable_version.structureFingerprint is not None and editable_version.structureFingerprint != new_fingerprint

    def _variant_for_html_path(path: str) -> Optional[Literal["ff", "oc"]]:
        for lang in file_names.languages:
            if path == lang.ffHtml:
                return "ff"
            if path == lang.ocHtml:
                return "oc"
        return None

    # data.js is hand-edit-mergeable too (see data_js_patch.py's own doc
    # comment) — attempted unconditionally, not just under structural_change,
    # since data.js's content depends on nearly every field of the
    # definition, not only which questions/fields exist. The "old" baseline
    # is whatever editable_version's own files were last generated to match:
    # when the form was never published before (editable_version IS
    # draft_version, the same row `definition` already is), that baseline
    # trivially equals `definition` itself, which correctly preserves 100%
    # of a hand-edit made and never-since-reconciled (nothing could have
    # "changed on the design side" when old == new) — otherwise it's
    # editable_version's own frozen, already-fully-resolved definition/
    # config (see its own `draft_version.config =
    # generation_config.model_dump_json()` below, from whichever publish
    # produced it). A genuine conflict (or an unparseable hand-edit) joins
    # the same affectedFiles/force gate as an unmergeable hand-edited HTML
    # file below, rather than silently discarding the hand-edit.
    data_js_merged_content: Optional[str] = None
    data_js_row = next((f for f in existing_editable_files if f.fileType == "data-js"), None)
    if data_js_row is not None and data_js_row.editedAt is not None:
        if editable_version_id == draft_version.id:
            old_definition_for_data_js = definition
            old_config_for_data_js = generation_config
        else:
            old_raw_definition = FormDefinition.model_validate_json(editable_version.definition)
            old_definition_for_data_js = old_raw_definition.model_copy(
                update={"pageError": _resolve_page_error_updates(db, old_raw_definition)}
            )
            old_config_for_data_js = BuilderConfig.model_validate_json(editable_version.config)
        old_data_js_content = build_data_js(old_definition_for_data_js, old_config_for_data_js, file_names).contents
        new_data_js_content = next(f.contents for f in files if f.path == file_names.dataJs)
        with open(absolute_file_path(data_js_row.filePath), "r", encoding="utf-8", newline="") as fh:
            hand_data_js_content = fh.read()
        data_js_merged_content = merge_data_js(old_data_js_content, hand_data_js_content, new_data_js_content)

    # A whole question or field/consent being added/removed is surgically
    # merged straight into a hand-edited HTML file instead of discarding it
    # (see html_structure_patch.py's own doc comment for exactly which
    # changes it can and can't safely merge, and why) — computed up front so
    # the conflict check right below only ever lists a file as truly
    # affected once a merge attempt has already failed for it. The two
    # merges are independent and composed in sequence (question diff first,
    # then field/consent diff on whatever that produced) — each is a safe
    # no-op when its own region didn't change, so there's no need to gate
    # one on the other being clean (an earlier version of this code did,
    # before patch_html_for_field_diff existed, specifically to avoid
    # silently treating a field/consent change as "nothing to merge" —
    # that's no longer a risk now that field/consent changes are actually
    # merged rather than just detected).
    patched_html_by_name: dict[str, str] = {}
    if structural_change:
        old_structure = json.loads(editable_version.structureFingerprint)
        question_diff = diff_questions(old_structure, definition)
        removed_consent_ids = diff_consents(old_structure, definition)
        for existing_row in existing_editable_files:
            if existing_row.fileType != "html" or existing_row.editedAt is None:
                continue
            variant = _variant_for_html_path(existing_row.fileName)
            if variant is None:
                continue
            with open(absolute_file_path(existing_row.filePath), "r", encoding="utf-8", newline="") as fh:
                current_content = fh.read()
            patched: Optional[str] = (
                patch_html_for_question_diff(current_content, question_diff, definition, variant)
                if question_diff.is_patchable
                else None
            )
            if patched is not None:
                patched = patch_html_for_field_diff(patched, removed_consent_ids, definition, variant)
            if patched is not None:
                patched_html_by_name[existing_row.fileName] = patched

    affected = sorted(
        f.fileName
        for f in existing_editable_files
        if f.editedAt is not None
        and (
            (f.fileType == "html" and structural_change and f.fileName not in patched_html_by_name)
            or (f.fileType == "data-js" and data_js_merged_content is None)
        )
    )
    if affected and not force:
        return {"outcome": "structural_conflict", "affectedFiles": affected}

    existing_by_name = {f.fileName: f for f in existing_editable_files}
    resolved_files: list[GeneratedFile] = []
    preserved_edits: dict[str, tuple[Any, Optional[str]]] = {}
    for f in files:
        existing_row = existing_by_name.get(f.path)
        file_type = classify_file_type(f.path, file_names)
        hand_edited = existing_row is not None and existing_row.editedAt is not None
        if f.path in patched_html_by_name:
            assert existing_row is not None
            resolved_files.append(GeneratedFile(path=f.path, contents=patched_html_by_name[f.path]))
            preserved_edits[f.path] = (existing_row.editedAt, existing_row.editedByUserId)
            continue
        if file_type == "data-js" and data_js_merged_content is not None:
            assert existing_row is not None
            resolved_files.append(GeneratedFile(path=f.path, contents=data_js_merged_content))
            preserved_edits[f.path] = (existing_row.editedAt, existing_row.editedByUserId)
            continue
        # CSS and behavior-JS are never structurally tied to which
        # questions/fields exist (see the doc comment above), so a hand-edit
        # to either is always preserved, structural change or not — only
        # html ever needs the fingerprint comparison (and, above, a merge
        # attempt) at all.
        keep_hand_edit = hand_edited and (file_type in ("css", "js") or (file_type == "html" and not structural_change))
        if keep_hand_edit:
            assert existing_row is not None
            with open(absolute_file_path(existing_row.filePath), "r", encoding="utf-8", newline="") as fh:
                resolved_files.append(GeneratedFile(path=f.path, contents=fh.read()))
            preserved_edits[f.path] = (existing_row.editedAt, existing_row.editedByUserId)
        else:
            resolved_files.append(f)

    # The fresh set above is about to be (re)inserted under draft_version.id
    # (promoted to be the new published version below) — delete whatever
    # rows already exist there first, so there's no duplicate-row conflict
    # for the same (formVersionId, fileName). This is a *different* set from
    # existing_editable_files whenever the form was already published (the
    # draft's own rows are just whatever the last publish cloned into it,
    # never hand-edited directly while published — see
    # _editable_form_version_id's own doc comment) — the editable version's
    # rows above were only ever read from, never targeted for deletion here;
    # they're left in place as that old version's own historical record.
    existing_draft_own_files = (
        existing_editable_files
        if editable_version_id == draft_version.id
        else list(db.execute(select(GeneratedFileEntity).where(GeneratedFileEntity.formVersionId == draft_version.id)).scalars())
    )
    for f in existing_draft_own_files:
        db.delete(f)
    db.flush()

    saved = save_form_version_generated_files(form.subsidiaryId, draft_version.id, resolved_files)
    for f in saved:
        row = GeneratedFileEntity(
            formVersionId=draft_version.id,
            fileName=f.fileName,
            filePath=f.relativePath,
            fileType=classify_file_type(f.fileName, file_names),
        )
        if f.fileName in preserved_edits:
            row.editedAt, row.editedByUserId = preserved_edits[f.fileName]
        db.add(row)
    draft_version.structureFingerprint = new_fingerprint
    db.flush()

    published_at = _now()
    next_version_row = db.execute(
        text(
            "SELECT ISNULL(MAX(versionNumber), 0) + 1 AS nextVersion FROM fq.FormVersions "
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
    draft_version.config = generation_config.model_dump_json()

    form.status = "published"
    form.publishedVersionId = draft_version.id
    form.updatedAt = published_at

    # Any subsidiary contribution approved (merged onto the draft) since the
    # last publish is going live right now along with everything else in
    # this draft — stamp it so the submitter's status bar can show
    # "Published" instead of "Approved".
    db.execute(
        text(
            "UPDATE fq.FormContributions SET publishedAt = :publishedAt "
            "WHERE formId = :formId AND status = 'approved' AND publishedAt IS NULL"
        ),
        {"publishedAt": published_at, "formId": form_id},
    )
    db.commit()

    # Clone the just-published content into a fresh draft — further edits
    # must never mutate the version row that was just published. Its files
    # (hand-edit-preserved or freshly-generated, whichever resolved_files
    # ended up with above) carry forward too, instead of leaving the new
    # draft with none at all — so a hand-edit an admin is actively building
    # on survives being published, not just the definition.
    new_draft = FormVersion(
        formId=form_id,
        versionNumber=None,
        definition=draft_version.definition,
        config=config.model_dump_json(),
        status="draft",
        createdByUserId=user_id,
        structureFingerprint=new_fingerprint,
    )
    db.add(new_draft)
    db.flush()
    new_saved = save_form_version_generated_files(form.subsidiaryId, new_draft.id, resolved_files)
    for f in new_saved:
        row = GeneratedFileEntity(
            formVersionId=new_draft.id,
            fileName=f.fileName,
            filePath=f.relativePath,
            fileType=classify_file_type(f.fileName, file_names),
        )
        if f.fileName in preserved_edits:
            row.editedAt, row.editedByUserId = preserved_edits[f.fileName]
        db.add(row)
    form.currentDraftVersionId = new_draft.id
    db.commit()

    # An admin-created form (HR, or an ad-hoc form an admin made directly)
    # going live for the first time — let that subsidiary's own users know
    # there's something for them to review/contribute to. Scoped to
    # origin == "admin" only: an origin == "adhoc" form published via
    # approve_adhoc_form was submitted by that subsidiary itself, so they
    # already know about it (see the ad-hoc-submitted notification instead).
    # First publish only — a later republish after an edit stays silent.
    if not was_already_published and form.origin == "admin":
        form_name = form.name
        subsidiary_id = form.subsidiaryId

        def _notify(bg_db: Session) -> None:
            email_service.send_form_published_notification(
                bg_db, resolve_subsidiary_recipients(bg_db, subsidiary_id), form_id, form_name, subsidiary_id
            )
            notification_service.notify_subsidiary(
                bg_db, subsidiary_id, "form_published", "New form ready for your subsidiary",
                f'"{form_name}" was published — review it and add translations, questions, or consents as needed.',
                link=f"/my-forms/{form_id}",
            )

        run_in_background(_notify)

    return {"outcome": "ok", "validation": validation}


def published_consent_document_file_names(db: Session, form: Form) -> list[str]:
    """Every uploaded consent-document file name (Terms & Conditions/Privacy
    Policy) the form's currently *published* definition references — see
    consent_document_service.uploaded_file_names, which this just points at
    the right FormVersion. Shared by deploy_form (SFTP push) and
    resource_check_service.start_manual_check (availability check), so both
    only ever act on the current upload, never a stale earlier one."""
    if not form.publishedVersionId:
        return []
    published_version = db.get(FormVersion, form.publishedVersionId)
    if published_version is None:
        return []
    definition = FormDefinition.model_validate_json(published_version.definition)
    return consent_document_service.uploaded_file_names(definition)


DeployOutcome = Literal["ok", "not_found", "not_published", "no_files"]


def deploy_form(db: Session, form_id: str, user_id: str) -> dict[str, Any]:
    """The explicit, separate "push to Adobe" action — best-effort SFTP push
    of the CURRENT PUBLISHED version's already-generated files (no
    regeneration; re-deploys exactly what publish_form last produced).
    Requires the form to already be published (via publish_form or
    approve_adhoc_form) — never blocks or fails on an SFTP error, same
    best-effort contract sftp_service.deploy_generated_files always had."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None:
        return {"outcome": "not_found"}
    if form.status != "published" or not form.publishedVersionId:
        return {"outcome": "not_published"}

    saved = list(
        db.execute(
            select(GeneratedFileEntity).where(GeneratedFileEntity.formVersionId == form.publishedVersionId)
        ).scalars()
    )
    if not saved:
        return {"outcome": "no_files"}

    deploy_files = [SftpDeployFile(absolutePath=absolute_file_path(f.filePath), remoteFileName=f.fileName) for f in saved]
    file_names = [f.fileName for f in saved]

    # Any Terms & Conditions / Privacy Policy PDF uploaded onto the
    # *published* version (see upload_consent_document) deploys alongside
    # the generated solution files, into the same Adobe frontal-server
    # namespace its own resolve_sample_url already points at — this is the
    # one point that URL actually goes from "sample" to live.
    for uploaded_name in published_consent_document_file_names(db, form):
        relative_path = os.path.join(consent_document_service.consent_documents_dir(form.subsidiaryId, form_id), uploaded_name)
        deploy_files.append(SftpDeployFile(absolutePath=absolute_file_path(relative_path), remoteFileName=uploaded_name))
        file_names.append(uploaded_name)

    deployment = deploy_generated_files(db, deploy_files)

    # Once Adobe has had time to pick the files up, check they're actually
    # served by every frontal server (resource_check_service; never raises).
    if deployment.ok and deployment.filesDeployed and deployment.environment:
        from app.services import resource_check_service

        resource_check_service.schedule_after_deploy(
            db, form_id, form.publishedVersionId, file_names, user_id, deployment.environment
        )

    return {"outcome": "ok", "deployment": deployment}


def _serialize_generated_file(f: GeneratedFileEntity) -> dict[str, Any]:
    return {
        "id": f.id,
        "fileName": f.fileName,
        "fileType": f.fileType,
        "editedAt": f.editedAt,
        "editedByUserId": f.editedByUserId,
    }


def _editable_form_version_id(form: Form) -> Optional[str]:
    """Which FormVersion the Edit Files window currently targets: a
    published form keeps editing its live `publishedVersionId` (unchanged
    behavior — those are the exact bytes Preview/Download/Deploy read), while
    a never-yet-published draft targets `currentDraftVersionId` instead, so
    hand-editing can start before the first Publish. Once published, further
    edits here intentionally stay on the published version, not the fresh
    draft publish_form clones afterward — publish_form itself reads THIS
    function's own result to find those hand-edits (not the draft's own
    files) precisely because of that split, so a hand-edit made here
    carries forward into the next publish unless the form's structure
    (which questions/fields exist) actually changed since (see
    publish_form's own doc comment on structureFingerprint)."""
    if form.status == "published" and form.publishedVersionId:
        return form.publishedVersionId
    if form.status == "draft" and form.currentDraftVersionId:
        return form.currentDraftVersionId
    return None


def ensure_draft_generated_files(db: Session, form_id: str) -> list[GeneratedFileEntity]:
    """Generates and persists GeneratedFiles for the current draft version
    the first time they're needed (Edit Files opened on a never-yet-
    published form) — "regenerate on miss", the same convention
    subsidiary_logo_service uses. Once any rows exist for this draft
    version, they're returned as-is and never silently regenerated, so a
    hand-edit survives further Save Draft calls untouched (same guarantee a
    published version's hand-edit already has); publish_form carries
    whatever's here forward into the newly published version too."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None or form.status != "draft" or not form.currentDraftVersionId:
        raise NotFoundError("form not found or not a draft")

    existing = list(
        db.execute(
            select(GeneratedFileEntity).where(GeneratedFileEntity.formVersionId == form.currentDraftVersionId)
        ).scalars()
    )
    if existing:
        return existing

    draft_version = db.get(FormVersion, form.currentDraftVersionId)
    assert draft_version is not None
    definition = FormDefinition.model_validate_json(draft_version.definition)
    definition = definition.model_copy(update={"pageError": _resolve_page_error_updates(db, definition)})
    config = _enforce_variants_for_origin(form.origin, BuilderConfig.model_validate_json(draft_version.config))
    generation_config = config.model_copy(
        update={"projectCode": form.projectCode, **_resolve_analytics_param_updates(db, form), **_resolve_recaptcha_site_key(db, form)}
    )
    generation = _generate_from_form_definition(definition, generation_config)
    if len(generation["validation"].errors) > 0:
        raise ValidationError("fix the validation errors shown above before editing generated files")

    files: list[GeneratedFile] = generation["files"]
    file_names: FileNames = generation["fileNames"]
    saved = save_form_version_generated_files(form.subsidiaryId, draft_version.id, files)
    rows: list[GeneratedFileEntity] = []
    for f in saved:
        row = GeneratedFileEntity(
            formVersionId=draft_version.id,
            fileName=f.fileName,
            filePath=f.relativePath,
            fileType=classify_file_type(f.fileName, file_names),
        )
        db.add(row)
        rows.append(row)
    db.commit()
    return rows


def regenerate_draft_generated_files(db: Session, form_id: str) -> list[dict[str, Any]]:
    """Explicit, admin-triggered "Regenerate from definition" — discards any
    hand-edits made to the current draft's files and rebuilds them fresh
    from the live form definition. Deliberately separate from the
    regenerate-on-miss behavior in `ensure_draft_generated_files`: that one
    never clobbers an existing hand-edit, this one always does, so it must
    be an explicit action (see FormFilesEditorPage.tsx's confirm dialog),
    never an automatic side effect of anything else."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None or form.status != "draft" or not form.currentDraftVersionId:
        raise NotFoundError("form not found or not a draft")
    for row in db.execute(
        select(GeneratedFileEntity).where(GeneratedFileEntity.formVersionId == form.currentDraftVersionId)
    ).scalars():
        db.delete(row)
    db.commit()
    return [_serialize_generated_file(f) for f in ensure_draft_generated_files(db, form_id)]


def _get_editable_generated_file(db: Session, form_id: str, file_id: str) -> GeneratedFileEntity:
    """The file must belong to whichever FormVersion `_editable_form_version_id`
    currently targets for this form (published version if published, draft
    version if still a draft) — same scope every other reader
    (preview/download/deploy) already uses for a published form. Raises
    `NotFoundError` rather than returning an outcome string, since this is
    the Edit Files window's one access path and has no other caller to
    thread an outcome through."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    version_id = _editable_form_version_id(form) if form else None
    if form is None or version_id is None:
        raise NotFoundError("form not found or has no editable files")
    file = db.execute(
        select(GeneratedFileEntity).where(GeneratedFileEntity.id == file_id, GeneratedFileEntity.formVersionId == version_id)
    ).scalar_one_or_none()
    if file is None:
        raise NotFoundError("generated file not found")
    return file


def list_generated_files(db: Session, form_id: str) -> list[dict[str, Any]]:
    """Every file belonging to the form's currently-editable version, for
    the Edit Files window's file list — any file type (html/js/css/data-js).
    A published form serves its live published files (unchanged); a draft
    generates them on first access (`ensure_draft_generated_files`)."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None:
        raise NotFoundError("form not found")

    if form.status == "draft":
        files = sorted(ensure_draft_generated_files(db, form_id), key=lambda f: (f.fileType, f.fileName))
    else:
        version_id = _editable_form_version_id(form)
        if version_id is None:
            raise ValidationError("form has no files to edit")
        files = list(
            db.execute(
                select(GeneratedFileEntity)
                .where(GeneratedFileEntity.formVersionId == version_id)
                .order_by(GeneratedFileEntity.fileType, GeneratedFileEntity.fileName)
            ).scalars()
        )
    return [_serialize_generated_file(f) for f in files]


def get_generated_file_content(db: Session, form_id: str, file_id: str) -> dict[str, Any]:
    """Reads one generated file's current on-disk content, for the Edit
    Files window to load into its editor — the exact bytes Preview,
    Download and Deploy already read (for a published form)."""
    file = _get_editable_generated_file(db, form_id, file_id)
    with open(absolute_file_path(file.filePath), "r", encoding="utf-8", newline="") as f:
        content = f.read()
    return {**_serialize_generated_file(file), "content": content}


_BRACKETS = {")": "(", "]": "[", "}": "{"}


def _check_js_balance(content: str) -> Optional[str]:
    """A cheap, dependency-free guard against the most common hand-edit
    mistake (an unclosed brace/paren/bracket) — not a real parser, just a
    bracket-matching scan that skips string/template literals and comments
    so a `}` inside a quoted string doesn't trip it. Returns an error
    message, or `None` if balanced."""
    stack: list[str] = []
    i, n = 0, len(content)
    while i < n:
        ch = content[i]
        if ch in "\"'`":
            quote = ch
            i += 1
            while i < n and content[i] != quote:
                i += 2 if content[i] == "\\" else 1
            i += 1
            continue
        if ch == "/" and i + 1 < n and content[i + 1] == "/":
            i = content.find("\n", i)
            i = n if i == -1 else i
            continue
        if ch == "/" and i + 1 < n and content[i + 1] == "*":
            end = content.find("*/", i + 2)
            i = n if end == -1 else end + 2
            continue
        if ch in "([{":
            stack.append(ch)
        elif ch in ")]}":
            if not stack or stack.pop() != _BRACKETS[ch]:
                return f"Unbalanced '{ch}' — check the edit didn't drop a matching bracket"
        i += 1
    if stack:
        return f"Unclosed '{stack[-1]}' — check the edit closes every bracket it opens"
    return None


def update_generated_file_content(db: Session, form_id: str, file_id: str, content: str, user_id: str) -> dict[str, Any]:
    """Overwrites one generated file's on-disk content in place and stamps
    who edited it and when. No change needed anywhere else: preview_service,
    build_form_zip and deploy_form all read this same file path already, so
    the next Preview/Download/Deploy picks up the edit automatically."""
    file = _get_editable_generated_file(db, form_id, file_id)
    if not content.strip():
        raise ValidationError("content must not be empty")
    if file.fileType in ("js", "data-js"):
        error = _check_js_balance(content)
        if error:
            raise ValidationError(error)

    with open(absolute_file_path(file.filePath), "w", encoding="utf-8", newline="") as f:
        f.write(content)

    file.editedAt = _now()
    file.editedByUserId = user_id
    db.commit()
    return {**_serialize_generated_file(file), "content": content}


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


SubmitAdHocOutcome = Literal["ok", "not_found", "already_pending", "already_published"]


def submit_adhoc_form_for_review(db: Session, form_id: str, subsidiary_id: str) -> SubmitAdHocOutcome:
    """A subsidiary user's "Submit for Review" action. Best-effort notifies
    admins via `email_service.send_adhoc_review_submitted_notification` —
    never fails this action if the notification itself fails."""
    form = find_owned_adhoc_form(db, form_id, subsidiary_id)
    if form is None:
        return "not_found"
    if form.pendingReview:
        return "already_pending"
    if form.status == "published":
        return "already_published"

    form.pendingReview = True
    form.submittedForReviewAt = _now()
    form.reviewNote = None
    db.commit()

    form_name = form.name
    submitted_at = form.submittedForReviewAt

    def _notify(bg_db: Session) -> None:
        email_service.send_adhoc_review_submitted_notification(bg_db, form_id, form_name, subsidiary_id, submitted_at)
        notification_service.notify_admins(
            bg_db, "adhoc_submitted", "Ad-hoc form submitted for review", f'"{form_name}" ({subsidiary_id}) is awaiting your review.',
            link=f"/admin/form-builder/{form_id}",
        )

    run_in_background(_notify)
    return "ok"


ApproveAdHocOutcome = Literal["ok", "not_found", "not_adhoc", "not_pending", "invalid", "no_project_code"]


def approve_adhoc_form(db: Session, form_id: str, project_code: Optional[str], user_id: str, force: bool = False) -> dict[str, Any]:
    """The admin review queue's "Approve" action, then reuses `publish_form`
    as-is. The subsidiary user already picked a project code at creation
    time (see `create_form`'s own doc comment) — `project_code` here lets an
    admin override that choice, but is optional; omitted or blank reuses the
    form's own existing value. Applies the same governance gates as
    `create_form` against the *effective* project code (and the form's own
    subsidiary, defensively) before attaching it."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None:
        return {"outcome": "not_found"}
    if form.origin != "adhoc":
        return {"outcome": "not_adhoc"}
    if not form.pendingReview:
        return {"outcome": "not_pending"}

    effective_project_code = (project_code or "").strip() or form.projectCode
    if not effective_project_code:
        return {"outcome": "no_project_code"}

    subsidiary_service.assert_subsidiary_active(db, form.subsidiaryId)
    project_code_service.assert_project_code_open(db, effective_project_code)
    subsidiary_project_block_service.assert_not_blocked(db, form.subsidiaryId, effective_project_code)

    form.projectCode = effective_project_code
    form.pendingReview = False
    form.reviewNote = None
    form.reviewedAt = _now()
    db.commit()

    result = publish_form(db, form_id, user_id, force=force)
    if result["outcome"] == "not_found":
        return {"outcome": "not_found"}
    if result["outcome"] == "invalid":
        return {"outcome": "invalid", "validation": result["validation"]}
    if result["outcome"] == "structural_conflict":
        return {"outcome": "structural_conflict", "affectedFiles": result["affectedFiles"]}
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
    """Soft-deletes a form (`Form.isDeleted`), whether or not it was ever
    published — nothing is removed from the database. Its versions, generated
    files and contributions stay attached; every listing, dashboard count and
    review queue ignores a deleted form. Any contribution still awaiting review
    is left as-is (it's simply no longer reachable, since the form isn't)."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None:
        return "not_found"

    form.isDeleted = True
    form.pendingReview = False
    form.updatedAt = _now()
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
