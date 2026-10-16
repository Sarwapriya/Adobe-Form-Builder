"""Tests for subsidiary country assignment and the dynamic circular
flag-composite logo generator (`app/services/country_service.py`,
`subsidiary_service.list_countries_for_subsidiary`/`set_subsidiary_countries`,
`app/services/subsidiary_logo_service.py`, admin CRUD in `app/routers/admin.py`,
any-auth read in `app/routers/subsidiaries.py`)."""

from __future__ import annotations

import uuid
import xml.etree.ElementTree as ET

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.country import Country
from app.services import country_service, subsidiary_service
from app.services.subsidiary_logo_service import compute_logo_hash


def _unique_subsidiary_name() -> str:
    return f"PYTEST-SUB-{uuid.uuid4().hex[:8]}"


def _get_or_create_country(db_session: Session, iso_code: str, name: str) -> Country:
    """Reuses a migration-seeded country when present (this repo's
    countries_and_subsidiary_countries_migration.sql is expected to have run
    against the test DB), falling back to creating it — keeps these tests
    working whether or not that one-time seed script has been applied to the
    DB under test."""
    existing = db_session.execute(select(Country).where(Country.isoCode == iso_code)).scalar_one_or_none()
    if existing is not None:
        return existing
    return country_service.create_country(db_session, iso_code, name)


def _create_subsidiary(client: TestClient, admin_headers: dict) -> dict:
    resp = client.post("/api/v1/admin/subsidiaries", json={"name": _unique_subsidiary_name()}, headers=admin_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestCountryCrud:
    def test_non_admin_cannot_create_country(self, client: TestClient, standard_headers: dict):
        resp = client.post(
            "/api/v1/admin/countries", json={"isoCode": "Z1", "countryName": "Zedland"}, headers=standard_headers
        )
        assert resp.status_code == 403

    def test_admin_can_create_and_list_countries(self, client: TestClient, admin_headers: dict, db_session: Session):
        existing = db_session.execute(select(Country).where(Country.isoCode == "Z9")).scalar_one_or_none()
        if existing is not None:
            pytest.skip("isoCode Z9 already in use by another row")
        resp = client.post("/api/v1/admin/countries", json={"isoCode": "z9", "countryName": "Zedland"}, headers=admin_headers)
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["isoCode"] == "Z9"  # normalized upper-case
        assert body["isActive"] is True

        listed = client.get("/api/v1/admin/countries", headers=admin_headers).json()
        assert any(c["id"] == body["id"] for c in listed)

    def test_duplicate_iso_code_is_rejected(self, client: TestClient, admin_headers: dict):
        resp1 = client.post("/api/v1/admin/countries", json={"isoCode": "Z8", "countryName": "First"}, headers=admin_headers)
        assert resp1.status_code == 201
        resp2 = client.post("/api/v1/admin/countries", json={"isoCode": "z8", "countryName": "Second"}, headers=admin_headers)
        assert resp2.status_code == 409

    def test_toggle_active(self, client: TestClient, admin_headers: dict):
        created = client.post("/api/v1/admin/countries", json={"isoCode": "Z7", "countryName": "Zedland"}, headers=admin_headers).json()
        resp = client.patch(f"/api/v1/admin/countries/{created['id']}", json={"isActive": False}, headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["isActive"] is False

        active_only = client.get("/api/v1/subsidiaries/countries", headers=admin_headers).json()
        assert not any(c["id"] == created["id"] for c in active_only)

    def test_any_authenticated_user_can_list_active_countries(self, client: TestClient, standard_headers: dict):
        resp = client.get("/api/v1/subsidiaries/countries", headers=standard_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_requires_auth(self, client: TestClient):
        resp = client.get("/api/v1/subsidiaries/countries")
        assert resp.status_code == 401


class TestSubsidiaryCountryAssignment:
    def test_non_admin_cannot_assign_countries(self, client: TestClient, admin_headers: dict, standard_headers: dict, db_session: Session):
        sub = _create_subsidiary(client, admin_headers)
        ae = _get_or_create_country(db_session, "AE", "United Arab Emirates")
        resp = client.put(
            f"/api/v1/admin/subsidiaries/{sub['id']}/countries", json={"countryIds": [ae.id]}, headers=standard_headers
        )
        assert resp.status_code == 403

    def test_assign_and_persist_order(self, client: TestClient, admin_headers: dict, db_session: Session):
        sub = _create_subsidiary(client, admin_headers)
        ae = _get_or_create_country(db_session, "AE", "United Arab Emirates")
        qa = _get_or_create_country(db_session, "QA", "Qatar")

        resp = client.put(
            f"/api/v1/admin/subsidiaries/{sub['id']}/countries",
            json={"countryIds": [qa.id, ae.id]},
            headers=admin_headers,
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert [c["isoCode"] for c in body["countries"]] == ["QA", "AE"]

        # Re-assigning in reverse order persists the new order.
        resp2 = client.put(
            f"/api/v1/admin/subsidiaries/{sub['id']}/countries",
            json={"countryIds": [ae.id, qa.id]},
            headers=admin_headers,
        )
        assert [c["isoCode"] for c in resp2.json()["countries"]] == ["AE", "QA"]

    def test_assigning_countries_never_touches_an_upload_logo(self, client: TestClient, admin_headers: dict, db_session: Session):
        sub = _create_subsidiary(client, admin_headers)
        # A freshly created subsidiary defaults to logoSource "upload" with no
        # asset yet (see Subsidiary.logoSource's column default) — assigning
        # countries must not flip it to "generated" on its own; only the
        # explicit regenerate endpoint does that.
        assert sub["logoUrl"] is None

        ae = _get_or_create_country(db_session, "AE", "United Arab Emirates")
        resp = client.put(
            f"/api/v1/admin/subsidiaries/{sub['id']}/countries", json={"countryIds": [ae.id]}, headers=admin_headers
        )
        assert resp.json()["logoUrl"] is None

    def test_unknown_subsidiary_id_is_404(self, client: TestClient, admin_headers: dict):
        resp = client.put(
            "/api/v1/admin/subsidiaries/00000000-0000-0000-0000-000000000000/countries",
            json={"countryIds": []},
            headers=admin_headers,
        )
        assert resp.status_code == 404


class TestLogoRegeneration:
    def test_non_admin_cannot_regenerate(self, client: TestClient, admin_headers: dict, standard_headers: dict, db_session: Session):
        sub = _create_subsidiary(client, admin_headers)
        ae = _get_or_create_country(db_session, "AE", "United Arab Emirates")
        client.put(f"/api/v1/admin/subsidiaries/{sub['id']}/countries", json={"countryIds": [ae.id]}, headers=admin_headers)

        resp = client.post(f"/api/v1/admin/subsidiaries/{sub['id']}/logo/regenerate", headers=standard_headers)
        assert resp.status_code == 403

    def test_regenerate_requires_at_least_one_country(self, client: TestClient, admin_headers: dict):
        sub = _create_subsidiary(client, admin_headers)
        resp = client.post(f"/api/v1/admin/subsidiaries/{sub['id']}/logo/regenerate", headers=admin_headers)
        assert resp.status_code == 400

    def test_regenerate_produces_a_generated_logo_with_correct_wedge_count(
        self, client: TestClient, admin_headers: dict, db_session: Session
    ):
        sub = _create_subsidiary(client, admin_headers)
        ae = _get_or_create_country(db_session, "AE", "United Arab Emirates")
        qa = _get_or_create_country(db_session, "QA", "Qatar")
        sa = _get_or_create_country(db_session, "SA", "Saudi Arabia")
        client.put(
            f"/api/v1/admin/subsidiaries/{sub['id']}/countries",
            json={"countryIds": [ae.id, qa.id, sa.id]},
            headers=admin_headers,
        )

        resp = client.post(f"/api/v1/admin/subsidiaries/{sub['id']}/logo/regenerate", headers=admin_headers)
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["logoUrl"] is not None
        assert body["logoUrl"].startswith(f"/api/v1/subsidiaries/{sub['id']}/logo")

        logo_resp = client.get(body["logoUrl"], headers=admin_headers)
        assert logo_resp.status_code == 200
        assert logo_resp.headers["content-type"].startswith("image/svg+xml")
        svg_text = logo_resp.text
        root = ET.fromstring(svg_text)
        assert root.tag.endswith("}svg") or root.tag == "svg"
        clip_paths = [el for el in root.iter() if el.tag.endswith("}clipPath") or el.tag == "clipPath"]
        assert len(clip_paths) == 3  # one wedge per assigned country

    def test_regenerate_is_idempotent_for_the_same_country_list(self, client: TestClient, admin_headers: dict, db_session: Session):
        sub = _create_subsidiary(client, admin_headers)
        ae = _get_or_create_country(db_session, "AE", "United Arab Emirates")
        client.put(f"/api/v1/admin/subsidiaries/{sub['id']}/countries", json={"countryIds": [ae.id]}, headers=admin_headers)

        first = client.post(f"/api/v1/admin/subsidiaries/{sub['id']}/logo/regenerate", headers=admin_headers).json()
        second = client.post(f"/api/v1/admin/subsidiaries/{sub['id']}/logo/regenerate", headers=admin_headers).json()
        assert first["logoUrl"] == second["logoUrl"]

    def test_changing_countries_changes_the_logo_hash(self, client: TestClient, admin_headers: dict, db_session: Session):
        sub = _create_subsidiary(client, admin_headers)
        ae = _get_or_create_country(db_session, "AE", "United Arab Emirates")
        qa = _get_or_create_country(db_session, "QA", "Qatar")
        client.put(f"/api/v1/admin/subsidiaries/{sub['id']}/countries", json={"countryIds": [ae.id]}, headers=admin_headers)
        first = client.post(f"/api/v1/admin/subsidiaries/{sub['id']}/logo/regenerate", headers=admin_headers).json()

        client.put(f"/api/v1/admin/subsidiaries/{sub['id']}/countries", json={"countryIds": [ae.id, qa.id]}, headers=admin_headers)
        second = client.post(f"/api/v1/admin/subsidiaries/{sub['id']}/logo/regenerate", headers=admin_headers).json()

        assert first["logoUrl"] != second["logoUrl"]

    def test_single_country_subsidiary_has_no_wedge_clip_but_still_renders(
        self, client: TestClient, admin_headers: dict, db_session: Session
    ):
        sub = _create_subsidiary(client, admin_headers)
        sa = _get_or_create_country(db_session, "SA", "Saudi Arabia")
        client.put(f"/api/v1/admin/subsidiaries/{sub['id']}/countries", json={"countryIds": [sa.id]}, headers=admin_headers)
        body = client.post(f"/api/v1/admin/subsidiaries/{sub['id']}/logo/regenerate", headers=admin_headers).json()

        logo_resp = client.get(body["logoUrl"], headers=admin_headers)
        assert logo_resp.status_code == 200
        root = ET.fromstring(logo_resp.text)
        clip_paths = [el for el in root.iter() if el.tag.endswith("}clipPath") or el.tag == "clipPath"]
        assert len(clip_paths) == 1

    def test_an_upload_logo_subsidiary_has_no_generated_logo_endpoint_response(
        self, client: TestClient, admin_headers: dict
    ):
        # A freshly created subsidiary defaults to logoSource "upload" with no
        # assigned countries yet — GET .../logo is only meaningful for
        # "generated" subsidiaries and must 404, never crash.
        sub = _create_subsidiary(client, admin_headers)
        resp = client.get(f"/api/v1/subsidiaries/{sub['id']}/logo", headers=admin_headers)
        assert resp.status_code == 404


class TestComputeLogoHash:
    def test_order_sensitive(self):
        assert compute_logo_hash(["AE", "QA"]) != compute_logo_hash(["QA", "AE"])

    def test_deterministic(self):
        assert compute_logo_hash(["AE", "QA", "SA"]) == compute_logo_hash(["AE", "QA", "SA"])

    def test_case_insensitive(self):
        assert compute_logo_hash(["ae", "qa"]) == compute_logo_hash(["AE", "QA"])


class TestSeededSubsidiaryLogos:
    """Soft checks against this repo's one-time seed migrations
    (subsidiary_logo_columns_migration.sql,
    countries_and_subsidiary_countries_migration.sql) — skip cleanly (not a
    failure) if they haven't been run against the DB under test, the same
    convention this suite already uses for DB/DKMS reachability."""

    def test_sge_has_five_upload_logo_countries_if_seeded(self, db_session: Session):
        sge = subsidiary_service.find_subsidiary_by_name(db_session, "SGE")
        if sge is None or sge.logoSource != "upload":
            pytest.skip("SGE not seeded with an upload logo in this DB")
        countries = subsidiary_service.list_countries_for_subsidiary(db_session, sge.id)
        assert {c.isoCode for c in countries} == {"AE", "QA", "OM", "BH", "KW"}
        assert sge.logoAssetPath == "/api/v1/static/subsidiary-logos/SGE.png"

    def test_rerunning_seed_pairing_logic_does_not_duplicate(self, db_session: Session):
        sge = subsidiary_service.find_subsidiary_by_name(db_session, "SGE")
        if sge is None:
            pytest.skip("SGE not seeded in this DB")
        countries = subsidiary_service.list_countries_for_subsidiary(db_session, sge.id)
        iso_codes = [c.isoCode for c in countries]
        assert len(iso_codes) == len(set(iso_codes))
