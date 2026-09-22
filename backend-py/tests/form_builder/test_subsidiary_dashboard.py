"""Tests for the subsidiary user's dashboard (`GET /api/v1/forms/dashboard-summary`,
`dashboard_service.get_subsidiary_dashboard_summary`). The "Campaign Status" donut
can be filtered by campaign type (all/adhoc/hr — "Flagship HR" is this app's admin-
authored/"Full Form" campaigns) — every other section of this dashboard stays
scoped to this subsidiary's own ad-hoc campaigns only, unchanged."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.form import Form
from app.models.subsidiary import Subsidiary
from tests.form_builder.conftest import unique_name


def _make_form(db_session: Session, subsidiary_id: str, created_by_user_id: str, *, origin: str, status: str = "draft") -> Form:
    form = Form(
        name=unique_name("Form"),
        subsidiaryId=subsidiary_id,
        status=status,
        origin=origin,
        pendingReview=False,
        isDeleted=False,
        createdByUserId=created_by_user_id,
    )
    db_session.add(form)
    db_session.commit()
    db_session.refresh(form)
    return form


class TestSubsidiaryDashboardCampaignStatusByType:
    def test_no_subsidiary_returns_the_empty_shape(self, client: TestClient, admin_headers: dict):
        resp = client.get("/api/v1/forms/dashboard-summary", headers=admin_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert set(body["campaignStatusByType"].keys()) == {"all", "adhoc", "hr"}
        assert body["campaignStatusByType"]["all"]["total"] == 0

    def test_adhoc_and_hr_are_split_and_all_combines_them(
        self, client: TestClient, standard_headers: dict, admin_user, subsidiary_row: Subsidiary, db_session: Session
    ):
        _make_form(db_session, subsidiary_row.name, admin_user.id, origin="adhoc", status="draft")
        _make_form(db_session, subsidiary_row.name, admin_user.id, origin="adhoc", status="published")
        _make_form(db_session, subsidiary_row.name, admin_user.id, origin="admin", status="published")

        resp = client.get("/api/v1/forms/dashboard-summary", headers=standard_headers)
        assert resp.status_code == 200
        body = resp.json()

        assert body["campaignStatusByType"]["adhoc"] == {
            "total": 2, "drafts": 1, "pendingReview": 0, "changesRequested": 0, "published": 1,
        }
        assert body["campaignStatusByType"]["hr"] == {
            "total": 1, "drafts": 0, "pendingReview": 0, "changesRequested": 0, "published": 1,
        }
        assert body["campaignStatusByType"]["all"] == {
            "total": 3, "drafts": 1, "pendingReview": 0, "changesRequested": 0, "published": 2,
        }
        # counts (feeding the stat cards / other sections) stays ad-hoc-only, unchanged.
        assert body["counts"] == body["campaignStatusByType"]["adhoc"]

    def test_hr_forms_from_another_subsidiary_are_excluded(
        self, client: TestClient, standard_headers: dict, admin_user, other_subsidiary_row: Subsidiary, db_session: Session
    ):
        _make_form(db_session, other_subsidiary_row.name, admin_user.id, origin="admin", status="published")
        resp = client.get("/api/v1/forms/dashboard-summary", headers=standard_headers)
        assert resp.json()["campaignStatusByType"]["hr"]["total"] == 0
