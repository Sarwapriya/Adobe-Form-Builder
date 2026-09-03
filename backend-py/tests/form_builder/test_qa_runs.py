"""Tests for the QA-run feature (`POST/GET /api/v1/admin/qa-runs*`) — a
real headless-Chromium Playwright run against one generated variant of a
pending subsidiary contribution or an ad-hoc form awaiting review (see
`app/services/qa_run_service.py`/`app/services/qa/`).

The actual browser automation runs in a fire-and-forget background thread
with its OWN DB session (`qa_run_service.run_qa_job` -> `app.utils.
background.run_in_background`) — deliberately, so a slow/hung Playwright run
never blocks the request that kicked it off, matching the Node original's
`void runQaJob(...)`. That background session is a genuinely separate DB
connection, which this suite's `db_session` fixture (a savepoint nested
inside one connection/transaction per test, rolled back at teardown — see
`tests/conftest.py`) cannot make visible to: under this dev database's
locking model (`READ_COMMITTED_SNAPSHOT` is OFF), the background thread's
read of a just-inserted-but-not-yet-really-committed QaRun row would simply
block until this test's own transaction rolls back, then see nothing. So
every test here only asserts the immediate "pending"/"running" response, the
same information the real frontend has right after `createQaRun` resolves —
a real end-to-end pass/fail run (through actual completion) is proven
separately by a direct, non-pytest smoke test against
`qa_test_runner.run_qa_suite`, run outside of any test-transaction wrapper.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from tests.form_builder.conftest import create_and_publish_admin_form, sample_config_json, sample_definition_json, unique_name


def _create_adhoc_pending_review(client: TestClient, standard_headers: dict, subsidiary_name: str, variants: list[str]) -> str:
    create_resp = client.post("/api/v1/forms/adhoc", json={"name": unique_name("Adhoc")}, headers=standard_headers)
    assert create_resp.status_code == 201, create_resp.text
    form_id = create_resp.json()["id"]

    draft_resp = client.patch(
        f"/api/v1/forms/adhoc/{form_id}/draft",
        json={"definition": sample_definition_json(subsidiary_name), "config": sample_config_json(variants)},
        headers=standard_headers,
    )
    assert draft_resp.status_code == 204, draft_resp.text

    submit_resp = client.post(f"/api/v1/forms/adhoc/{form_id}/submit-for-review", headers=standard_headers)
    assert submit_resp.status_code == 204, submit_resp.text
    return form_id


class TestCreateQaRun:
    def test_exactly_one_of_contribution_or_form_required(self, client: TestClient, admin_headers: dict):
        both = client.post("/api/v1/admin/qa-runs", json={"contributionId": "x", "formId": "y", "variant": "ff"}, headers=admin_headers)
        assert both.status_code == 400

        neither = client.post("/api/v1/admin/qa-runs", json={"variant": "ff"}, headers=admin_headers)
        assert neither.status_code == 400

    def test_unknown_form_404(self, client: TestClient, admin_headers: dict):
        resp = client.post(
            "/api/v1/admin/qa-runs",
            json={"formId": "00000000-0000-0000-0000-000000000000", "variant": "ff"},
            headers=admin_headers,
        )
        assert resp.status_code == 404

    def test_unknown_contribution_404(self, client: TestClient, admin_headers: dict):
        resp = client.post(
            "/api/v1/admin/qa-runs",
            json={"contributionId": "00000000-0000-0000-0000-000000000000", "variant": "ff"},
            headers=admin_headers,
        )
        assert resp.status_code == 404

    def test_non_admin_forbidden(self, client: TestClient, standard_headers: dict):
        resp = client.post("/api/v1/admin/qa-runs", json={"formId": "x", "variant": "ff"}, headers=standard_headers)
        assert resp.status_code == 403

    def test_variant_with_no_generated_output_is_409(self, client: TestClient, admin_headers: dict, standard_headers: dict, subsidiary_row):
        form_id = _create_adhoc_pending_review(client, standard_headers, subsidiary_row.name, variants=["ff"])
        resp = client.post("/api/v1/admin/qa-runs", json={"formId": form_id, "variant": "oc"}, headers=admin_headers)
        assert resp.status_code == 409

    def test_adhoc_review_qa_run_starts_pending(self, client: TestClient, admin_headers: dict, standard_headers: dict, subsidiary_row):
        form_id = _create_adhoc_pending_review(client, standard_headers, subsidiary_row.name, variants=["ff", "oc"])
        resp = client.post("/api/v1/admin/qa-runs", json={"formId": form_id, "variant": "ff"}, headers=admin_headers)
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["formId"] == form_id
        assert body["contributionId"] is None
        assert body["variant"] == "ff"
        assert body["status"] in ("pending", "running")

        list_resp = client.get(f"/api/v1/admin/qa-runs?formId={form_id}", headers=admin_headers)
        assert list_resp.status_code == 200
        assert any(r["id"] == body["id"] for r in list_resp.json())

        detail_resp = client.get(f"/api/v1/admin/qa-runs/{body['id']}", headers=admin_headers)
        assert detail_resp.status_code == 200
        assert detail_resp.json()["run"]["id"] == body["id"]

        download_resp = client.get(f"/api/v1/admin/qa-runs/{body['id']}/download", headers=admin_headers)
        assert download_resp.status_code == 409  # no report yet — the run just started

    def test_contribution_qa_run_starts_pending(self, client: TestClient, admin_headers: dict, standard_headers: dict, subsidiary_row):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, variants=["ff", "oc"])

        submit_resp = client.post(f"/api/v1/forms/{form_id}/contributions", json={"content": {}}, headers=standard_headers)
        assert submit_resp.status_code == 201, submit_resp.text
        contribution_id = submit_resp.json()["id"]

        resp = client.post(
            "/api/v1/admin/qa-runs", json={"contributionId": contribution_id, "variant": "oc"}, headers=admin_headers
        )
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["formId"] == form_id
        assert body["contributionId"] == contribution_id
        assert body["variant"] == "oc"
        assert body["status"] in ("pending", "running")

    def test_qa_run_against_non_pending_contribution_404(
        self, client: TestClient, admin_headers: dict, standard_headers: dict, subsidiary_row
    ):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, variants=["ff"])
        submit_resp = client.post(f"/api/v1/forms/{form_id}/contributions", json={"content": {}}, headers=standard_headers)
        contribution_id = submit_resp.json()["id"]

        client.post(f"/api/v1/admin/forms/{form_id}/contributions/{contribution_id}/reject", json={"reviewNote": "no"}, headers=admin_headers)

        resp = client.post(
            "/api/v1/admin/qa-runs", json={"contributionId": contribution_id, "variant": "ff"}, headers=admin_headers
        )
        assert resp.status_code == 404
