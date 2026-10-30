"""notification_service.py: in-app notifications mirroring every event
email_service.py already sends an email for. Covers the service functions
directly, the /api/v1/notifications router's own-account scoping, and one
end-to-end wiring check (ad-hoc submit-for-review) proving a real trigger
actually creates the row, not just the service function in isolation."""

from __future__ import annotations

from sqlalchemy import select

from app.models.notification import Notification
from app.services import form_builder_service, notification_service
from tests.form_builder.conftest import sample_config_json, sample_definition_json, unique_name


def _notifications_for(db, user_id: str) -> list[Notification]:
    return list(db.execute(select(Notification).where(Notification.userId == user_id)).scalars())


# --- service functions -----------------------------------------------------------


def test_notify_admins_creates_a_row_per_active_admin(db_session, admin_user, standard_user):
    notification_service.notify_admins(db_session, "test_type", "Title", "Message", link="/admin/form-builder")
    rows = _notifications_for(db_session, admin_user.id)
    assert len(rows) == 1
    assert rows[0].type == "test_type" and rows[0].title == "Title" and rows[0].link == "/admin/form-builder"
    # Never fans out to a standard user.
    assert _notifications_for(db_session, standard_user.id) == []


def test_notify_subsidiary_creates_a_row_per_active_user_of_that_subsidiary(
    db_session, standard_user, other_standard_user, subsidiary_row
):
    notification_service.notify_subsidiary(db_session, subsidiary_row.name, "test_type", "Title", "Message")
    assert len(_notifications_for(db_session, standard_user.id)) == 1
    # A different subsidiary's user never gets it.
    assert _notifications_for(db_session, other_standard_user.id) == []


def test_notify_with_no_recipients_is_a_silent_no_op(db_session):
    notification_service.notify_subsidiary(db_session, unique_name("NoSuchSub"), "test_type", "Title", "Message")
    # No exception, nothing created — just confirms it doesn't blow up.


def test_list_count_mark_read_round_trip(db_session, admin_user):
    notification_service.notify_admins(db_session, "t", "First", "m1")
    notification_service.notify_admins(db_session, "t", "Second", "m2")

    listed = notification_service.list_my_notifications(db_session, admin_user.id)
    assert len(listed) == 2 and listed[0]["title"] == "Second"  # newest first
    assert notification_service.count_unread(db_session, admin_user.id) == 2

    assert notification_service.mark_read(db_session, admin_user.id, listed[0]["id"]) is True
    assert notification_service.count_unread(db_session, admin_user.id) == 1

    assert notification_service.mark_all_read(db_session, admin_user.id) == 1
    assert notification_service.count_unread(db_session, admin_user.id) == 0


def test_mark_read_never_crosses_users(db_session, admin_user, standard_user):
    notification_service.notify_admins(db_session, "t", "Title", "m")
    mine = notification_service.list_my_notifications(db_session, admin_user.id)[0]
    assert notification_service.mark_read(db_session, standard_user.id, mine["id"]) is False


# --- through the API --------------------------------------------------------------


def test_router_scopes_everything_to_the_caller(client, db_session, admin_user, admin_headers, standard_user, standard_headers):
    notification_service.notify_admins(db_session, "t", "Admin item", "m")
    notification_service.notify_subsidiary(db_session, standard_user.subsidiaryId, "t", "Sub item", "m")

    admin_list = client.get("/api/v1/notifications", headers=admin_headers).json()
    assert [n["title"] for n in admin_list] == ["Admin item"]

    standard_list = client.get("/api/v1/notifications", headers=standard_headers).json()
    assert [n["title"] for n in standard_list] == ["Sub item"]

    assert client.get("/api/v1/notifications/unread-count", headers=admin_headers).json() == {"count": 1}

    other_id = standard_list[0]["id"]
    assert client.post(f"/api/v1/notifications/{other_id}/read", headers=admin_headers).status_code == 404

    own_id = admin_list[0]["id"]
    assert client.post(f"/api/v1/notifications/{own_id}/read", headers=admin_headers).status_code == 204
    assert client.get("/api/v1/notifications/unread-count", headers=admin_headers).json() == {"count": 0}

    notification_service.notify_admins(db_session, "t", "Another", "m")
    assert client.post("/api/v1/notifications/read-all", headers=admin_headers).json() == {"count": 1}


def test_router_requires_auth(client):
    assert client.get("/api/v1/notifications").status_code == 401


# --- end-to-end wiring (one representative trigger) -------------------------------


def test_adhoc_submit_for_review_notifies_admins(client, db_session, admin_user, standard_headers, project_code_row, monkeypatch):
    queued = []
    monkeypatch.setattr(form_builder_service, "run_in_background", lambda work: queued.append(work))

    created = client.post(
        "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
    ).json()
    client.patch(
        f"/api/v1/forms/adhoc/{created['id']}/draft",
        json={"definition": sample_definition_json(created["subsidiaryId"]), "config": sample_config_json(["ff"])},
        headers=standard_headers,
    )
    resp = client.post(f"/api/v1/forms/adhoc/{created['id']}/submit-for-review", headers=standard_headers)
    assert resp.status_code == 204, resp.text
    assert len(queued) == 1
    queued[0](db_session)

    rows = [n for n in _notifications_for(db_session, admin_user.id) if n.type == "adhoc_submitted"]
    assert len(rows) == 1 and created["name"] in rows[0].message
