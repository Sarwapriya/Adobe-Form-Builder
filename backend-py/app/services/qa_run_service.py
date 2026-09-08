"""Port of `backend/src/services/qaRunService.ts`."""

from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from html import escape as escape_html
from typing import Any, Literal, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.form_pipeline import (
    BuilderConfig,
    ContributionContent,
    FormDefinition,
    ValidationResult,
    apply_contribution,
    generate_solution,
    resolve_file_names,
    validate_form_definition,
)
from app.models.form import Form
from app.models.form_contribution import FormContribution
from app.models.form_version import FormVersion
from app.models.qa_run import QaRun, QaRunVariant
from app.models.qa_test_case_result import QaTestCaseResult
from app.services.file_service import absolute_file_path, form_qa_storage_dir
from app.services.preview_service import inline_generated_files
from app.services.qa.qa_test_runner import run_qa_suite
from app.services.qa.types import QaCategory, QaCheckResult
from app.utils.background import run_in_background

CreateQaRunOutcome = Literal["not_found", "no_files", "invalid", "ok"]


@dataclass
class CreateQaRunResult:
    outcome: CreateQaRunOutcome
    qaRun: Optional[QaRun] = None
    validation: Optional[ValidationResult] = None


def _build_pending_form_html(
    definition: FormDefinition, config: BuilderConfig, variant: QaRunVariant
) -> tuple[Literal["ok", "invalid", "no_files"], Optional[str], Optional[ValidationResult]]:
    """Validates+generates `definition`/`config` in memory (never touching
    disk/GeneratedFiles) and inlines it into one self-contained HTML
    document for `variant` — the shared core of
    `create_contribution_qa_run`/`create_adhoc_review_qa_run` below, since
    both need the exact same "merge or take the draft as-is, then
    generate+inline, never persist" shape."""
    if variant not in config.variants:
        return "no_files", None, None

    validation = validate_form_definition(definition)
    if len(validation.errors) > 0:
        return "invalid", None, validation

    files = generate_solution(definition, config)
    file_names = resolve_file_names(definition, config)
    html = inline_generated_files(files, file_names, variant)
    if html is None:
        return "no_files", None, None

    return "ok", html, None


def create_contribution_qa_run(db: Session, contribution_id: str, variant: QaRunVariant, triggered_by_user_id: str) -> CreateQaRunResult:
    """Kicks off a QA run for one *pending* subsidiary Translate & Extend
    contribution — before it's ever approved or published. Merges the
    contribution onto the form's *current draft* via `apply_contribution`
    (the exact same merge target `form_contribution_service`'s own approve
    path and the admin's own "Preview" button use), generates and inlines
    the result entirely in memory, and never writes a FormVersion/
    GeneratedFiles row for it — approving is still the only way this
    content actually joins the form's persisted draft."""
    contribution = db.get(FormContribution, contribution_id)
    if contribution is None or contribution.status != "pending":
        return CreateQaRunResult(outcome="not_found")

    form = db.execute(select(Form).where(Form.id == contribution.formId, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None or not form.currentDraftVersionId:
        return CreateQaRunResult(outcome="not_found")

    draft_version = db.get(FormVersion, form.currentDraftVersionId)
    if draft_version is None:
        return CreateQaRunResult(outcome="not_found")

    draft_definition = FormDefinition.model_validate_json(draft_version.definition)
    draft_config = BuilderConfig.model_validate_json(draft_version.config)
    content = ContributionContent.model_validate_json(contribution.content)
    merged = apply_contribution(draft_definition, content)

    outcome, html, validation = _build_pending_form_html(merged, draft_config, variant)
    if outcome != "ok":
        return CreateQaRunResult(outcome=outcome, validation=validation)

    qa_run = QaRun(uploadId=None, formId=form.id, contributionId=contribution_id, variant=variant, status="pending", triggeredByUserId=triggered_by_user_id)
    db.add(qa_run)
    db.commit()
    db.refresh(qa_run)

    run_qa_job(qa_run.id, html)

    return CreateQaRunResult(outcome="ok", qaRun=qa_run)


def create_adhoc_review_qa_run(db: Session, form_id: str, variant: QaRunVariant, triggered_by_user_id: str) -> CreateQaRunResult:
    """Kicks off a QA run for an ad-hoc form's own draft while it's awaiting
    admin review (`Form.pendingReview`) — before Approve (which publishes
    it). There's no separate contribution row for an ad-hoc submission; the
    draft itself *is* what was submitted, so this generates straight from
    it, same in-memory/never-persisted approach as
    `create_contribution_qa_run` above."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None or form.origin != "adhoc" or not form.pendingReview or not form.currentDraftVersionId:
        return CreateQaRunResult(outcome="not_found")

    draft_version = db.get(FormVersion, form.currentDraftVersionId)
    if draft_version is None:
        return CreateQaRunResult(outcome="not_found")

    definition = FormDefinition.model_validate_json(draft_version.definition)
    config = BuilderConfig.model_validate_json(draft_version.config)

    outcome, html, validation = _build_pending_form_html(definition, config, variant)
    if outcome != "ok":
        return CreateQaRunResult(outcome=outcome, validation=validation)

    qa_run = QaRun(uploadId=None, formId=form.id, contributionId=None, variant=variant, status="pending", triggeredByUserId=triggered_by_user_id)
    db.add(qa_run)
    db.commit()
    db.refresh(qa_run)

    run_qa_job(qa_run.id, html)

    return CreateQaRunResult(outcome="ok", qaRun=qa_run)


def run_qa_job(qa_run_id: str, html: str) -> None:
    """The actual background execution: launches Chromium (via
    `qa_test_runner.run_qa_suite`), persists every individual
    QaTestCaseResult, and lands the QaRun on "passed"/"failed" (based on
    whether every check passed) or "error" (the run itself couldn't
    complete) — never left at "running" once this returns, since
    `run_qa_suite`'s own timeout guarantees it eventually resolves or
    raises.

    There is no queue/worker process behind this — it's a plain
    fire-and-forget background thread from `create_contribution_qa_run`/
    `create_adhoc_review_qa_run`, running in the same process as the API
    server. That's a deliberate, documented limitation for this feature's
    current scope: a server restart mid-run leaves that one QaRun stuck at
    "running" forever (rare in practice, and always resolvable by
    re-running QA), rather than something worth a persistent job queue for
    a feature used this occasionally."""
    run_in_background(lambda bg_db: asyncio.run(_run_qa_job_async(bg_db, qa_run_id, html)))


async def _run_qa_job_async(db: Session, qa_run_id: str, html: str) -> None:
    qa_run = db.get(QaRun, qa_run_id)
    if qa_run is None:
        return
    qa_run.status = "running"
    qa_run.startedAt = datetime.now(timezone.utc)
    db.commit()

    try:
        outcome = await run_qa_suite(html)
        results = outcome.results

        for r in results:
            db.add(QaTestCaseResult(qaRunId=qa_run_id, category=r.category, name=r.name, status=r.status, fieldId=r.fieldId, message=r.message))
        db.commit()

        passed_tests = sum(1 for r in results if r.status == "passed")
        failed_tests = len(results) - passed_tests

        qa_run = db.get(QaRun, qa_run_id)
        assert qa_run is not None
        subsidiary_id, subject_label = _resolve_qa_run_subject(db, qa_run)
        report_path = _write_qa_report(subsidiary_id, subject_label, qa_run, results)

        qa_run.status = "failed" if failed_tests > 0 else "passed"
        qa_run.totalTests = len(results)
        qa_run.passedTests = passed_tests
        qa_run.failedTests = failed_tests
        qa_run.reportPath = report_path
        qa_run.completedAt = datetime.now(timezone.utc)
        db.commit()
    except Exception as err:  # noqa: BLE001 — a QA run's own failure must never crash the background job
        qa_run = db.get(QaRun, qa_run_id)
        if qa_run is not None:
            qa_run.status = "error"
            qa_run.errorMessage = str(err) or "Unknown error"
            qa_run.completedAt = datetime.now(timezone.utc)
            db.commit()


def get_qa_run(db: Session, id: str) -> Optional[QaRun]:
    return db.get(QaRun, id)


def list_qa_runs_for_form(db: Session, form_id: str) -> list[QaRun]:
    """Every QA run ever triggered for one Configuration form, newest
    first — covers both contribution-based runs and ad-hoc pending-review
    runs alike, since both set `formId`."""
    return list(db.execute(select(QaRun).where(QaRun.formId == form_id).order_by(QaRun.createdAt.desc())).scalars())


def _resolve_qa_run_subject(db: Session, qa_run: QaRun) -> tuple[str, str]:
    """Resolves the subsidiaryId (for report storage) and a human-readable
    label (for the report's own header) for a QaRun's Configuration-form
    subject — looked up once per completed run rather than carried on the
    row itself, since a form's name can change after the run without
    needing to update it."""
    form = db.get(Form, qa_run.formId)
    assert form is not None
    subject_label = (
        f'Form "{form.name}" · pending contribution {qa_run.contributionId}'
        if qa_run.contributionId
        else f'Ad-hoc form "{form.name}" · awaiting review'
    )
    return form.subsidiaryId, subject_label


@dataclass
class QaRunDetail:
    run: QaRun
    results: list[QaTestCaseResult]


def get_qa_run_detail(db: Session, id: str) -> Optional[QaRunDetail]:
    """Returns `None` for an unknown id — callers map that to a 404."""
    run = db.get(QaRun, id)
    if run is None:
        return None
    results = list(db.execute(select(QaTestCaseResult).where(QaTestCaseResult.qaRunId == id).order_by(QaTestCaseResult.createdAt.asc())).scalars())
    return QaRunDetail(run=run, results=results)


def _escape(s: str) -> str:
    return escape_html(s, quote=True)


_CATEGORY_LABELS: dict[QaCategory, str] = {
    "structure": "Page structure",
    "field-validation": "Field validation",
    "field-interaction": "Field interaction",
    "required-enforcement": "Required-field enforcement",
    "submit-gating": "Submit button gating",
    "submit-flow": "Submit flow",
}


def _write_qa_report(subsidiary_id: str, subject_label: str, qa_run: QaRun, results: list[QaCheckResult]) -> str:
    """Builds the downloadable HTML report — a single self-contained
    document (no external assets) grouped by category. Written to disk
    under the per-form QA directory — not the database, since reports can
    run to a few hundred rows and there's no reason to carry that in every
    QaRun query."""
    by_category: dict[str, list[QaCheckResult]] = {}
    for r in results:
        by_category.setdefault(r.category, []).append(r)

    passed = sum(1 for r in results if r.status == "passed")
    failed = len(results) - passed

    sections = []
    for category, items in by_category.items():
        rows = "\n".join(
            f'<tr class="{r.status}">\n'
            f'        <td class="status">{"✓ Passed" if r.status == "passed" else "✗ Failed"}</td>\n'
            f"        <td>{_escape(r.name)}</td>\n"
            f'        <td>{_escape(r.fieldId) if r.fieldId else "—"}</td>\n'
            f'        <td>{_escape(r.message) if r.message else "—"}</td>\n'
            "      </tr>"
            for r in items
        )
        sections.append(
            f"<h2>{_escape(_CATEGORY_LABELS.get(category, category))}</h2>\n"
            "      <table>\n"
            "        <thead><tr><th>Result</th><th>Check</th><th>Field</th><th>Details</th></tr></thead>\n"
            f"        <tbody>{rows}</tbody>\n"
            "      </table>"
        )
    sections_html = "\n".join(sections)

    html = f"""<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<title>QA report — {_escape(qa_run.variant.upper())} — {qa_run.id}</title>
<style>
  body {{ font-family: -apple-system, Segoe UI, Roboto, sans-serif; margin: 32px; color: #1a1a2e; }}
  h1 {{ margin-bottom: 4px; }}
  .summary {{ display: flex; gap: 16px; margin: 16px 0 32px; }}
  .tile {{ padding: 12px 20px; border-radius: 8px; font-weight: 700; }}
  .tile.total {{ background: #eef0fa; }}
  .tile.passed {{ background: #e3f8ec; color: #147a3b; }}
  .tile.failed {{ background: #fdecec; color: #b3261e; }}
  table {{ width: 100%; border-collapse: collapse; margin-bottom: 28px; }}
  th, td {{ text-align: left; padding: 8px 10px; border-bottom: 1px solid #e4e4ee; font-size: 14px; }}
  th {{ background: #f8f9fc; text-transform: uppercase; font-size: 11px; letter-spacing: 0.4px; color: #666; }}
  tr.failed .status {{ color: #b3261e; font-weight: 700; }}
  tr.passed .status {{ color: #147a3b; }}
</style>
</head>
<body>
<h1>QA report — {_escape(qa_run.variant.upper())} variant</h1>
<p>{_escape(subject_label)} · Run {_escape(qa_run.id)} · {datetime.now().strftime("%c")}</p>
<div class="summary">
  <div class="tile total">{len(results)} total</div>
  <div class="tile passed">{passed} passed</div>
  <div class="tile failed">{failed} failed</div>
</div>
{sections_html}
</body>
</html>
"""

    relative_path = os.path.join(form_qa_storage_dir(subsidiary_id, qa_run.formId), f"{qa_run.id}.html")
    absolute_path = absolute_file_path(relative_path)
    os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
    with open(absolute_path, "w", encoding="utf-8", newline="") as f:
        f.write(html)
    return relative_path


QaReportDownloadOutcome = Literal["not_found", "not_ready", "ok"]


@dataclass
class QaReportDownloadResult:
    outcome: QaReportDownloadOutcome
    html: Optional[str] = None


def build_qa_report_download(db: Session, qa_run_id: str) -> QaReportDownloadResult:
    """Called from the admin router's `GET /qa-runs/:id/download`.
    "not_ready" covers a run still pending/running, or one that errored
    before ever producing a report."""
    qa_run = db.get(QaRun, qa_run_id)
    if qa_run is None:
        return QaReportDownloadResult(outcome="not_found")
    if not qa_run.reportPath:
        return QaReportDownloadResult(outcome="not_ready")

    with open(absolute_file_path(qa_run.reportPath), "r", encoding="utf-8") as f:
        html = f.read()
    return QaReportDownloadResult(outcome="ok", html=html)
