"""Admin/subsidiary-uploaded PDF documents backing a form's Terms &
Conditions or Privacy Policy link — see formDefinition.ts's
PrivacyPolicyMeta/TermsAndConditionsMeta.uploadedFileName (the field that
records which of these a form's Link URL was set from).

Not part of codegen: this is a user-uploaded asset stored once per form,
independent of any FormVersion/publish cycle — same "uploaded asset, not
regenerated" convention subsidiary_logo_service.py uses for the 9 initial
subsidiary logos. SFTP-deployed alongside the generated solution files at
Deploy time (see form_builder_service.deploy_form), not immediately on
upload — so the Adobe URL this module resolves is only a *sample* URL right
after upload, not live until the next deploy. Pure functions here; the one
DB-touching step (patching the form's draft FormDefinition) lives in
form_builder_service.upload_consent_document, which calls into this module.
"""

from __future__ import annotations

import io
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal, Optional

from pypdf import PdfReader

from app.form_pipeline import FormDefinition
from app.services.file_service import absolute_file_path
from app.utils.sanitize import sanitize_file_name, sanitize_subsidiary_id

ConsentDocumentKind = Literal["termsAndConditions", "privacyPolicy"]

_KIND_SUFFIX: dict[ConsentDocumentKind, str] = {"termsAndConditions": "TnC", "privacyPolicy": "PVC"}

# The real Adobe Campaign frontal-server path every generated HTML/JS/CSS
# file is already served from (see resource_check_service.build_url /
# page_template.py's favicon reference) — an uploaded consent document is
# deployed into that same namespace. Admin-editable per environment (staging
# differs from production) — see sftp_settings_service.SftpTargetConfig.
# resourceTrackingBaseUrl; resolve_sample_url below takes it as a parameter
# rather than hardcoding one value, since the caller knows which
# environment this upload is for.

# Generous for a policy document; bounds memory use while reading the upload
# into memory for validation (there's no streaming need at this size).
MAX_SIZE_BYTES = 20 * 1024 * 1024

UNREADABLE_MESSAGE = "This file cannot be read — please contact the system administrator."
WRONG_FORMAT_MESSAGE = "Only PDF files are supported."


@dataclass
class ValidatedUpload:
    file_name: str
    url: str


def consent_documents_dir(subsidiary_id: str, form_id: str) -> str:
    """Directory (relative to UPLOAD_DIR) holding one form's uploaded
    consent documents, keyed by the Form's own id (not a FormVersion's) —
    these persist across publishes/drafts, unlike generated output."""
    return os.path.join(sanitize_subsidiary_id(subsidiary_id), "forms", form_id, "consent-documents")


def build_file_name(original_file_name: str, subsidiary_id: str, kind: ConsentDocumentKind) -> str:
    """`{OriginalName}_{Subsidiary}_{TnC|PVC}_{timestamp}.pdf` — the exact
    convention asked for. The timestamp also guarantees a re-upload of the
    same original file name never collides with an earlier one already on
    disk (each upload keeps its own file; nothing is overwritten)."""
    safe = sanitize_file_name(original_file_name)
    stem = os.path.splitext(safe)[0] or "document"
    safe_subsidiary = sanitize_subsidiary_id(subsidiary_id)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"{stem}_{safe_subsidiary}_{_KIND_SUFFIX[kind]}_{timestamp}.pdf"


def resolve_sample_url(file_name: str, base_url: str) -> str:
    return f"{base_url.rstrip('/')}/{file_name}"


def validate_pdf(original_file_name: str, data: bytes) -> Optional[str]:
    """Returns an error message if the upload should be rejected, else
    None. WRONG_FORMAT_MESSAGE is reserved for the one check on the file's
    *extension* — anything that looks like a PDF by name but isn't readable
    as one (wrong magic bytes, too large, encrypted, corrupt, zero pages)
    reports UNREADABLE_MESSAGE instead, including the actual "can we read
    this" check: pypdf must be able to open it, decrypt it (the only
    automatic unlock available for a password-protected file — anything
    that still doesn't decrypt is unreadable to us the same way a corrupt
    file is), and extract its first page's content."""
    if not original_file_name.lower().endswith(".pdf"):
        return WRONG_FORMAT_MESSAGE
    if not data.startswith(b"%PDF-"):
        return UNREADABLE_MESSAGE
    if len(data) > MAX_SIZE_BYTES:
        return "This file is too large (20MB max)."
    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            reader.decrypt("")
        if len(reader.pages) == 0:
            raise ValueError("no pages")
        reader.pages[0].extract_text()
    except Exception:
        return UNREADABLE_MESSAGE
    return None


def uploaded_file_names(definition: FormDefinition) -> list[str]:
    """Every currently-uploaded consent-document file name this definition
    references (0, 1, or 2 — Terms & Conditions and/or Privacy Policy), each
    always the *latest* upload since `uploadedFileName` only ever holds one
    value per field, overwritten on every new upload — never a history of
    old ones. Shared by deploy_form (which SFTP-pushes these alongside the
    generated solution files) and resource_check_service.start_manual_check
    (which checks these are actually being served), so both only ever check
    the current file, never a stale one left over from an earlier upload."""
    names = []
    for meta in (definition.fields.termsAndConditions, definition.fields.privacyPolicy):
        if meta is not None and meta.uploadedFileName:
            names.append(meta.uploadedFileName)
    return names


def save_consent_document(subsidiary_id: str, form_id: str, file_name: str, data: bytes) -> str:
    """Writes an already-validated, already-renamed PDF to disk. Returns its
    path relative to UPLOAD_DIR (what deploy_form needs to SFTP-push it)."""
    relative_dir = consent_documents_dir(subsidiary_id, form_id)
    absolute_dir = absolute_file_path(relative_dir)
    os.makedirs(absolute_dir, exist_ok=True)
    relative_path = os.path.join(relative_dir, file_name)
    with open(absolute_file_path(relative_path), "wb") as f:
        f.write(data)
    return relative_path
