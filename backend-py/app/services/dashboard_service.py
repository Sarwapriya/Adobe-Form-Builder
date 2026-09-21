"""Port of `backend/src/services/dashboardService.ts` — both the admin-
dashboard half (`get_admin_dashboard_summary` and its helpers) and, added in
the form-builder phase (which wires up `subsidiaryForms.router.ts`'s
`GET /dashboard-summary`), the subsidiary-dashboard half
(`get_subsidiary_dashboard_summary`/`subsidiary_bucket`/`build_continue_working`).

`Form.status` (draft/published/unpublished) and `FormContribution.status`
(draft/pending/approved/rejected) are two independent lifecycles that can
coexist on the same form — every form is assigned to exactly one bucket via a
fixed priority: **Pending Review > Approved > Published > Draft**, computed
identically in `bucket_form` below (exported for unit testing, pure, no DB
access — mirrors `bucketForm`'s own `dashboardService.test.ts` role).
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any, Protocol

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.form_pipeline import FormDefinition, validate_form_definition
from app.models.form import Form
from app.models.form_contribution import FormContribution
from app.models.form_version import FormVersion
from app.models.user import User

DashboardBucket = str  # "pendingReview" | "approved" | "published" | "draft"


class BucketableForm(Protocol):
    id: str
    origin: str
    pendingReview: bool
    status: str
    subsidiaryId: str


def bucket_form(
    form: BucketableForm, pending_contribution_form_ids: set[str], approved_contribution_form_ids: set[str]
) -> DashboardBucket:
    """Pure, no DB access — exported for unit testing, mirrors `bucketForm`."""
    if (form.origin == "adhoc" and form.pendingReview) or form.id in pending_contribution_form_ids:
        return "pendingReview"
    if form.id in approved_contribution_form_ids:
        return "approved"
    if form.status == "published":
        return "published"
    return "draft"


def _load_pending_and_approved_contribution_form_ids(db: Session) -> tuple[set[str], set[str]]:
    pending_rows = db.execute(
        select(FormContribution.formId).distinct().where(FormContribution.status == "pending")
    ).scalars().all()
    approved_rows = db.execute(
        select(FormContribution.formId)
        .distinct()
        .where(FormContribution.status == "approved", FormContribution.publishedAt.is_(None))
    ).scalars().all()
    return set(pending_rows), set(approved_rows)


def _month_key(d: date) -> str:
    return f"{d.year}-{d.month:02d}"


def _month_label(d: date) -> str:
    return d.strftime("%b")


def _add_months(d: date, delta: int) -> date:
    month_index = d.month - 1 + delta
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


def _last_six_months() -> list[date]:
    """The 6 most recent calendar months (oldest first), including the
    current one."""
    today = datetime.now(timezone.utc).date().replace(day=1)
    return [_add_months(today, -i) for i in range(5, -1, -1)]


def _get_activity_by_month(db: Session) -> list[dict[str, Any]]:
    months = _last_six_months()
    range_start = datetime.combine(months[0], datetime.min.time(), tzinfo=timezone.utc)

    created_rows = db.execute(
        text(
            "SELECT FORMAT(createdAt, 'yyyy-MM') AS bucket, COUNT(*) AS cnt FROM fq.Forms "
            "WHERE isDeleted = 0 AND createdAt >= :start GROUP BY FORMAT(createdAt, 'yyyy-MM')"
        ),
        {"start": range_start},
    ).all()
    published_rows = db.execute(
        text(
            "SELECT FORMAT(publishedAt, 'yyyy-MM') AS bucket, COUNT(*) AS cnt FROM fq.FormVersions "
            "WHERE versionNumber = 1 AND publishedAt IS NOT NULL AND publishedAt >= :start "
            "GROUP BY FORMAT(publishedAt, 'yyyy-MM')"
        ),
        {"start": range_start},
    ).all()
    created_by_month = {r.bucket: int(r.cnt) for r in created_rows}
    published_by_month = {r.bucket: int(r.cnt) for r in published_rows}

    return [
        {
            "month": _month_label(d),
            "created": created_by_month.get(_month_key(d), 0),
            "published": published_by_month.get(_month_key(d), 0),
        }
        for d in months
    ]


def _compute_subsidiary_breakdown(
    forms: list[Form], pending: set[str], approved: set[str]
) -> list[dict[str, Any]]:
    by_subsidiary: dict[str, dict[str, Any]] = {}
    for f in forms:
        row = by_subsidiary.get(f.subsidiaryId)
        if row is None:
            row = {"subsidiaryId": f.subsidiaryId, "total": 0, "draft": 0, "pendingReview": 0, "approved": 0, "published": 0}
            by_subsidiary[f.subsidiaryId] = row
        row["total"] += 1
        row[bucket_form(f, pending, approved)] += 1
    return sorted(by_subsidiary.values(), key=lambda r: r["total"], reverse=True)


DASHBOARD_PREVIEW_LIMIT = 5
"""How many "Action Required" / "Recent Activity" rows the dashboard card
itself shows; the rest are behind its "Show more" link."""

FULL_LIST_LIMIT = 100
"""Cap on the dedicated full-list pages' recent-activity feed (that feed is
synthesized from several tables, so it needs a bound, unlike pending
approvals, which are by nature a short queue)."""


def get_pending_approvals(db: Session, limit: int | None = None) -> list[dict[str, Any]]:
    """Merges ad-hoc forms awaiting a whole-form review with individual
    pending contributions, newest submission first."""
    pending_adhoc_forms = db.execute(
        select(Form).where(Form.origin == "adhoc", Form.pendingReview == True, Form.isDeleted == False)  # noqa: E712
    ).scalars().all()
    pending_contributions = db.execute(
        select(FormContribution).where(FormContribution.status == "pending")
    ).scalars().all()

    contribution_form_ids = list({c.formId for c in pending_contributions})
    contribution_forms = (
        db.execute(select(Form).where(Form.id.in_(contribution_form_ids), Form.isDeleted == False)).scalars().all()  # noqa: E712
        if contribution_form_ids
        else []
    )
    form_by_id = {f.id: f for f in contribution_forms}

    items: list[dict[str, Any]] = []
    for f in pending_adhoc_forms:
        items.append(
            {
                "formId": f.id,
                "formName": f.name,
                "subsidiaryId": f.subsidiaryId,
                "type": "adhoc_review",
                "submittedAt": f.submittedForReviewAt or f.updatedAt,
            }
        )
    for c in pending_contributions:
        f = form_by_id.get(c.formId)
        if f is None:
            # The form was deleted — nothing left to review.
            continue
        items.append(
            {
                "formId": c.formId,
                "formName": f.name,
                "subsidiaryId": f.subsidiaryId,
                "type": "contribution",
                "submittedAt": c.submittedAt,
            }
        )
    items.sort(key=lambda i: i["submittedAt"], reverse=True)
    return items if limit is None else items[:limit]


def get_recent_activity(db: Session, limit: int = DASHBOARD_PREVIEW_LIMIT) -> list[dict[str, Any]]:
    """A best-effort, synthesized activity feed — this codebase has no
    general audit-log table, so this merges a handful of already-timestamped
    columns across a few tables rather than adding one."""
    # Events on a deleted form are left out of the feed.
    live_form_ids = select(Form.id).where(Form.isDeleted == False)  # noqa: E712
    submitted_forms = db.execute(
        select(Form)
        .where(Form.submittedForReviewAt.is_not(None), Form.isDeleted == False)  # noqa: E712
        .order_by(Form.submittedForReviewAt.desc())
        .limit(limit)
    ).scalars().all()
    published_versions = db.execute(
        select(FormVersion)
        .where(FormVersion.publishedAt.is_not(None), FormVersion.formId.in_(live_form_ids))
        .order_by(FormVersion.publishedAt.desc())
        .limit(limit)
    ).scalars().all()
    reviewed_contributions = db.execute(
        select(FormContribution)
        .where(FormContribution.reviewedAt.is_not(None), FormContribution.formId.in_(live_form_ids))
        .order_by(FormContribution.reviewedAt.desc())
        .limit(limit)
    ).scalars().all()
    new_users = db.execute(
        select(User).where(User.isDeleted == False).order_by(User.createdAt.desc()).limit(limit)  # noqa: E712
    ).scalars().all()

    related_form_ids = list({v.formId for v in published_versions} | {c.formId for c in reviewed_contributions})
    related_forms = (
        db.execute(select(Form).where(Form.id.in_(related_form_ids))).scalars().all() if related_form_ids else []
    )
    name_by_id = {f.id: f.name for f in related_forms}

    items: list[dict[str, Any]] = []
    for f in submitted_forms:
        items.append(
            {
                "kind": "submitted_for_review",
                "message": f'{f.subsidiaryId} submitted "{f.name}" for review',
                "occurredAt": f.submittedForReviewAt,
            }
        )
    for v in published_versions:
        items.append(
            {
                "kind": "published",
                "message": f'Published "{name_by_id.get(v.formId, "a form")}"',
                "occurredAt": v.publishedAt,
            }
        )
    for c in reviewed_contributions:
        approved = c.status == "approved"
        items.append(
            {
                "kind": "contribution_approved" if approved else "contribution_rejected",
                "message": (
                    f'Contribution approved on "{name_by_id.get(c.formId, "a form")}"'
                    if approved
                    else f'Changes requested on "{name_by_id.get(c.formId, "a form")}"'
                ),
                "occurredAt": c.reviewedAt,
            }
        )
    for u in new_users:
        items.append({"kind": "user_created", "message": f"New user added — {u.username}", "occurredAt": u.createdAt})

    items.sort(key=lambda i: i["occurredAt"], reverse=True)
    return items[:limit]


def get_admin_dashboard_summary(db: Session) -> dict[str, Any]:
    """Admin's post-login "Dashboard" landing page — system-wide campaign
    counts, activity trends, and the merged pending-approvals/recent-activity
    feeds."""
    forms = db.execute(select(Form).where(Form.isDeleted == False)).scalars().all()  # noqa: E712
    pending, approved = _load_pending_and_approved_contribution_form_ids(db)
    activity_by_month = _get_activity_by_month(db)
    pending_approvals = get_pending_approvals(db)
    # One row past the preview so we know whether there is anything behind "Show more".
    recent_activity = get_recent_activity(db, limit=DASHBOARD_PREVIEW_LIMIT + 1)

    counts = {"total": len(forms), "draft": 0, "pendingReview": 0, "approved": 0, "published": 0}
    for f in forms:
        counts[bucket_form(f, pending, approved)] += 1

    # "Full Form" = every admin-authored (HR) campaign; "adhoc" = subsidiary-initiated ones.
    ad_hoc_forms = [f for f in forms if f.origin == "adhoc"]
    full_form_forms = [f for f in forms if f.origin != "adhoc"]

    return {
        "counts": counts,
        "activityByMonth": activity_by_month,
        "subsidiaryBreakdownByOrigin": {
            "fullForm": _compute_subsidiary_breakdown(full_form_forms, pending, approved),
            "adhoc": _compute_subsidiary_breakdown(ad_hoc_forms, pending, approved),
        },
        "pendingApprovals": pending_approvals[:DASHBOARD_PREVIEW_LIMIT],
        "pendingApprovalsHasMore": len(pending_approvals) > DASHBOARD_PREVIEW_LIMIT,
        "recentActivity": recent_activity[:DASHBOARD_PREVIEW_LIMIT],
        "recentActivityHasMore": len(recent_activity) > DASHBOARD_PREVIEW_LIMIT,
    }


class SubsidiaryBucketableForm(Protocol):
    pendingReview: bool
    status: str
    reviewNote: Any


def subsidiary_bucket(form: SubsidiaryBucketableForm) -> str:
    """A subsidiary-scoped ad-hoc form's bucket — mutually exclusive by
    construction: `submit_adhoc_form_for_review` clears `reviewNote` on every
    new submission and `approve_adhoc_form` clears it again on approval, so a
    non-null `reviewNote` only ever appears on a still-draft, not-pending,
    never-published (rejected) form. Returns one of "pendingReview" /
    "published" / "changesRequested" / "draft"."""
    if form.pendingReview:
        return "pendingReview"
    if form.status == "published":
        return "published"
    if form.reviewNote:
        return "changesRequested"
    return "draft"


def _build_continue_working(db: Session, draft_forms: list[Form], limit: int = 3) -> list[dict[str, Any]]:
    top = draft_forms[:limit]
    version_ids = [f.currentDraftVersionId for f in top if f.currentDraftVersionId]
    versions = (
        db.execute(select(FormVersion).where(FormVersion.id.in_(version_ids))).scalars().all() if version_ids else []
    )
    version_by_id = {v.id: v for v in versions}

    items: list[dict[str, Any]] = []
    for f in top:
        version = version_by_id.get(f.currentDraftVersionId) if f.currentDraftVersionId else None
        issue_count = 0
        if version is not None:
            try:
                issue_count = len(validate_form_definition(FormDefinition.model_validate_json(version.definition)).errors)
            except Exception:
                issue_count = 1
        items.append({"id": f.id, "name": f.name, "updatedAt": f.updatedAt, "issueCount": issue_count})
    return items


def get_subsidiary_dashboard_summary(db: Session, subsidiary_id: str) -> dict[str, Any]:
    """A subsidiary user's post-login "Dashboard" landing page — scoped to
    their own ad-hoc campaigns only."""
    forms = list(
        db.execute(
            select(Form)
            .where(Form.subsidiaryId == subsidiary_id, Form.origin == "adhoc", Form.isDeleted == False)  # noqa: E712
            .order_by(Form.updatedAt.desc())
        ).scalars()
    )

    counts = {"total": len(forms), "drafts": 0, "pendingReview": 0, "changesRequested": 0, "published": 0}
    draft_forms: list[Form] = []
    changes_requested_forms: list[Form] = []
    for f in forms:
        bucket = subsidiary_bucket(f)
        if bucket == "pendingReview":
            counts["pendingReview"] += 1
        elif bucket == "published":
            counts["published"] += 1
        elif bucket == "changesRequested":
            counts["changesRequested"] += 1
            changes_requested_forms.append(f)
        else:
            counts["drafts"] += 1
            draft_forms.append(f)

    recent_campaigns = [
        {"id": f.id, "name": f.name, "bucket": subsidiary_bucket(f), "updatedAt": f.updatedAt} for f in forms[:5]
    ]

    continue_working = _build_continue_working(db, draft_forms)
    action_required = [
        {"id": f.id, "name": f.name, "reviewNote": f.reviewNote, "reviewedAt": f.reviewedAt}
        for f in changes_requested_forms[:5]
    ]

    return {
        "counts": counts,
        "recentCampaigns": recent_campaigns,
        "continueWorking": continue_working,
        "actionRequired": action_required,
    }
