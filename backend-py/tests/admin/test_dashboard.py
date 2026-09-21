"""Tests for `GET /api/v1/admin/dashboard-summary` and the pure
`bucket_form` helper (`app/services/dashboard_service.py`).

This project's dev SQL Server is a shared, persistent database (not spun up
fresh per test run), so assertions against `counts`/`subsidiaryBreakdown`
are written as *deltas* (before/after adding known rows inside this test's
own rolled-back transaction) or scoped to a randomly-generated, therefore
collision-free, `subsidiaryId` — never as absolute totals, which would be
polluted by whatever other rows already exist in the table.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.form import Form
from app.services.dashboard_service import bucket_form


@dataclass
class _F:
    id: str
    origin: str
    pendingReview: bool
    status: str
    subsidiaryId: str


class TestBucketFormPure:
    def test_adhoc_pending_review_wins(self):
        form = _F(id="1", origin="adhoc", pendingReview=True, status="draft", subsidiaryId="s")
        assert bucket_form(form, set(), set()) == "pendingReview"

    def test_pending_contribution_wins_over_published(self):
        form = _F(id="1", origin="admin", pendingReview=False, status="published", subsidiaryId="s")
        assert bucket_form(form, {"1"}, set()) == "pendingReview"

    def test_approved_contribution_wins_over_published(self):
        form = _F(id="1", origin="admin", pendingReview=False, status="published", subsidiaryId="s")
        assert bucket_form(form, set(), {"1"}) == "approved"

    def test_published_falls_through_when_no_contribution(self):
        form = _F(id="1", origin="admin", pendingReview=False, status="published", subsidiaryId="s")
        assert bucket_form(form, set(), set()) == "published"

    def test_defaults_to_draft(self):
        form = _F(id="1", origin="admin", pendingReview=False, status="draft", subsidiaryId="s")
        assert bucket_form(form, set(), set()) == "draft"


def _make_form(
    db_session: Session,
    subsidiary_id: str,
    created_by_user_id: str,
    status: str = "draft",
    origin: str = "admin",
    pending_review: bool = False,
) -> Form:
    # `Forms.createdByUserId` carries a real FK constraint against `Users.id`
    # in the actual DB schema (even though the SQLAlchemy model, matching
    # the TypeORM entity, declares it as a loose `uuid_col()` with no
    # `ForeignKey(...)` — see `app/models/base.py`'s own doc comment) — a
    # random UUID here fails with an IntegrityError, so callers must pass a
    # real, already-persisted user id (e.g. the `admin_user` fixture's).
    form = Form(
        name=f"Pytest form {uuid.uuid4().hex[:8]}",
        subsidiaryId=subsidiary_id,
        status=status,
        origin=origin,
        pendingReview=pending_review,
        isDeleted=False,
        createdByUserId=created_by_user_id,
    )
    db_session.add(form)
    db_session.commit()
    db_session.refresh(form)
    return form


class TestDashboardSummaryEndpoint:
    def test_non_admin_forbidden(self, client: TestClient, standard_headers: dict):
        resp = client.get("/api/v1/admin/dashboard-summary", headers=standard_headers)
        assert resp.status_code == 403

    def test_shape(self, client: TestClient, admin_headers: dict):
        resp = client.get("/api/v1/admin/dashboard-summary", headers=admin_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert set(body.keys()) == {
            "counts",
            "activityByMonth",
            "subsidiaryBreakdownByOrigin",
            "pendingApprovals",
            "pendingApprovalsHasMore",
            "recentActivity",
            "recentActivityHasMore",
        }
        assert set(body["counts"].keys()) == {"total", "draft", "pendingReview", "approved", "published"}
        assert set(body["subsidiaryBreakdownByOrigin"].keys()) == {"fullForm", "adhoc"}
        assert len(body["activityByMonth"]) == 6
        assert len(body["pendingApprovals"]) <= 5
        assert len(body["recentActivity"]) <= 5

    def test_full_lists_are_admin_only_and_newest_first(self, client: TestClient, admin_headers: dict, standard_headers: dict):
        for path in ("pending-approvals", "recent-activity"):
            url = f"/api/v1/admin/dashboard-summary/{path}"
            assert client.get(url, headers=standard_headers).status_code == 403
            resp = client.get(url, headers=admin_headers)
            assert resp.status_code == 200
            assert isinstance(resp.json(), list)

        # Timestamps come back with mixed UTC offsets ("Z" vs "+04:00"), so compare instants, not strings.
        recent = client.get("/api/v1/admin/dashboard-summary/recent-activity", headers=admin_headers).json()
        stamps = [datetime.fromisoformat(item["occurredAt"]) for item in recent]
        assert stamps == sorted(stamps, reverse=True)

        pending = client.get("/api/v1/admin/dashboard-summary/pending-approvals", headers=admin_headers).json()
        stamps = [datetime.fromisoformat(item["submittedAt"]) for item in pending]
        assert stamps == sorted(stamps, reverse=True)

    def test_pending_approvals_preview_is_the_five_newest(
        self, client: TestClient, admin_headers: dict, admin_user, db_session: Session
    ):
        subsidiary_id = f"DashboardSub-{uuid.uuid4().hex[:10]}"
        for _ in range(7):
            _make_form(db_session, subsidiary_id, admin_user.id, origin="adhoc", pending_review=True)

        summary = client.get("/api/v1/admin/dashboard-summary", headers=admin_headers).json()
        full = client.get("/api/v1/admin/dashboard-summary/pending-approvals", headers=admin_headers).json()

        assert len(summary["pendingApprovals"]) == 5
        assert summary["pendingApprovalsHasMore"] is True
        assert summary["pendingApprovals"] == full[:5]
        assert len(full) >= 7

    def test_counts_and_breakdown_reflect_newly_added_forms(
        self, client: TestClient, admin_headers: dict, admin_user, db_session: Session
    ):
        subsidiary_id = f"DashboardSub-{uuid.uuid4().hex[:10]}"

        before = client.get("/api/v1/admin/dashboard-summary", headers=admin_headers).json()
        before_total = before["counts"]["total"]
        before_draft = before["counts"]["draft"]
        before_published = before["counts"]["published"]

        _make_form(db_session, subsidiary_id, admin_user.id, status="draft")
        _make_form(db_session, subsidiary_id, admin_user.id, status="published")
        _make_form(db_session, subsidiary_id, admin_user.id, status="draft", origin="adhoc", pending_review=True)

        after = client.get("/api/v1/admin/dashboard-summary", headers=admin_headers).json()
        assert after["counts"]["total"] == before_total + 3
        assert after["counts"]["draft"] == before_draft + 1
        assert after["counts"]["published"] == before_published + 1
        assert after["counts"]["pendingReview"] == before["counts"]["pendingReview"] + 1

        # Admin-authored ("Full Form") and ad-hoc campaigns are charted separately.
        by_origin = after["subsidiaryBreakdownByOrigin"]
        full_form = next(row for row in by_origin["fullForm"] if row["subsidiaryId"] == subsidiary_id)
        assert full_form == {
            "subsidiaryId": subsidiary_id,
            "total": 2,
            "draft": 1,
            "pendingReview": 0,
            "approved": 0,
            "published": 1,
        }
        ad_hoc = next(row for row in by_origin["adhoc"] if row["subsidiaryId"] == subsidiary_id)
        assert ad_hoc == {
            "subsidiaryId": subsidiary_id,
            "total": 1,
            "draft": 0,
            "pendingReview": 1,
            "approved": 0,
            "published": 0,
        }

    def test_a_deleted_pending_adhoc_form_leaves_action_required_and_the_counts(
        self, client: TestClient, admin_headers: dict, admin_user, db_session: Session
    ):
        subsidiary_id = f"DashboardSub-{uuid.uuid4().hex[:10]}"
        form = _make_form(db_session, subsidiary_id, admin_user.id, origin="adhoc", pending_review=True)

        def pending_ids() -> set[str]:
            resp = client.get("/api/v1/admin/dashboard-summary/pending-approvals", headers=admin_headers)
            return {item["formId"] for item in resp.json()}

        assert form.id in pending_ids()
        assert client.delete(f"/api/v1/admin/forms/{form.id}", headers=admin_headers).status_code == 204
        assert form.id not in pending_ids()

        summary = client.get("/api/v1/admin/dashboard-summary", headers=admin_headers).json()
        for rows in summary["subsidiaryBreakdownByOrigin"].values():
            assert not any(row["subsidiaryId"] == subsidiary_id for row in rows)

    def test_deleted_forms_excluded(self, client: TestClient, admin_headers: dict, admin_user, db_session: Session):
        subsidiary_id = f"DashboardSub-{uuid.uuid4().hex[:10]}"
        form = _make_form(db_session, subsidiary_id, admin_user.id, status="draft")
        form.isDeleted = True
        db_session.add(form)
        db_session.commit()

        after = client.get("/api/v1/admin/dashboard-summary", headers=admin_headers).json()
        for rows in after["subsidiaryBreakdownByOrigin"].values():
            assert not any(row["subsidiaryId"] == subsidiary_id for row in rows)
