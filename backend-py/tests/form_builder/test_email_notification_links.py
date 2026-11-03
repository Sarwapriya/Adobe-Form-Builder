"""Unit tests for the cutoff-reminder email builders' deep links
(email_service.py) — pure functions, no DB needed. Covers the bug where
every reminder email's button/links pointed at a generic list page
(`/admin/form-builder` always resolving to the HR list, `/my-forms`) instead
of the one specific form the reminder was actually about."""

from __future__ import annotations

from datetime import datetime, timezone

from app.services.email_service import (
    AdminPendingItem,
    CutoffReminderItem,
    _admin_form_link,
    _build_admin_pending_summary_message,
    _build_cutoff_reminder_message,
    _subsidiary_form_link,
)

_CUTOFF = datetime(2026, 11, 10, tzinfo=timezone.utc)


class TestFormLinkHelpers:
    def test_subsidiary_link_for_an_adhoc_form(self):
        assert _subsidiary_form_link("form-1", "adhoc").endswith("/my-forms/adhoc/form-1")

    def test_subsidiary_link_for_an_admin_authored_form(self):
        link = _subsidiary_form_link("form-1", "admin")
        assert link.endswith("/my-forms/form-1")
        assert "/adhoc/" not in link

    def test_admin_link_is_the_same_route_for_either_origin(self):
        assert _admin_form_link("form-1").endswith("/admin/form-builder/form-1")


class TestCutoffReminderMessage:
    def test_a_single_item_links_straight_to_that_form_not_the_list(self):
        item = CutoffReminderItem(form_id="form-1", origin="adhoc", form_name="Newsletter Sign-up", reasons=["Translation not yet approved"])
        content = _build_cutoff_reminder_message("SGE", "SGE2026-AD04", _CUTOFF, [item])
        expected_link = _subsidiary_form_link("form-1", "adhoc")
        assert expected_link in content.html
        assert f'href="{expected_link}"' in content.html  # the CTA button itself
        assert expected_link in content.text

    def test_several_items_fall_back_to_the_list_but_each_item_stays_clickable(self):
        items = [
            CutoffReminderItem(form_id="form-1", origin="adhoc", form_name="Form A", reasons=["Translation not yet approved"]),
            CutoffReminderItem(form_id="form-2", origin="admin", form_name="Form B", reasons=["Terms & Conditions not configured"]),
        ]
        content = _build_cutoff_reminder_message("SGE", "SGE2026-AD04", _CUTOFF, items)
        assert _subsidiary_form_link("form-1", "adhoc") in content.html
        assert _subsidiary_form_link("form-2", "admin") in content.html

    def test_the_admin_area_never_appears_in_a_subsidiary_facing_email(self):
        item = CutoffReminderItem(form_id="form-1", origin="admin", form_name="HR Campaign", reasons=["Translation not yet approved"])
        content = _build_cutoff_reminder_message("SGE", "SGE2026-AD04", _CUTOFF, [item])
        assert "/admin/" not in content.html
        assert "/admin/" not in content.text


class TestAdminPendingSummaryMessage:
    def test_a_single_item_links_straight_to_that_forms_builder(self):
        item = AdminPendingItem(
            form_id="form-1", origin="adhoc", subsidiary_id="SGE", project_code="SGE2026-AD04",
            form_name="Newsletter Sign-up", cutoff_date=_CUTOFF, reasons=["Translation not yet approved"],
        )
        content = _build_admin_pending_summary_message([item])
        expected_link = _admin_form_link("form-1")
        assert expected_link in content.html
        assert f'href="{expected_link}"' in content.html
        # Never the bare list route that redirects to the HR tab regardless
        # of this item's own origin (see App.tsx's /admin/form-builder ->
        # /admin/form-builder/hr redirect, the bug reported against this).
        assert '"/admin/form-builder"' not in content.html

    def test_several_items_fall_back_to_the_form_initiator_landing_page(self):
        items = [
            AdminPendingItem(
                form_id="form-1", origin="adhoc", subsidiary_id="SGE", project_code="P1",
                form_name="Form A", cutoff_date=_CUTOFF, reasons=["Translation not yet approved"],
            ),
            AdminPendingItem(
                form_id="form-2", origin="admin", subsidiary_id="SEIL", project_code="P2",
                form_name="Form B", cutoff_date=_CUTOFF, reasons=["Terms & Conditions not configured"],
            ),
        ]
        content = _build_admin_pending_summary_message(items)
        assert _admin_form_link("form-1") in content.html
        assert _admin_form_link("form-2") in content.html
