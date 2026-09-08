"""Port of `backend/src/services/qa/qaIntrospection.ts`.

Generic, DOM-driven Playwright checks against one already-loaded generated
form page. Nothing here is hand-written per uploaded form — every check
enumerates whatever fields/questions actually exist in the page (via the
embedded data.js globals and the reference codegen's own DOM-id/attribute
conventions) so the same suite runs unmodified against any form's generated
output.

Known, intentional facts about the generated forms this file relies on:
 - Profile fields (email/firstName/lastName/mobileNumber/callingCode) are
   the only Parsley-validated inputs — attributes read directly off the DOM
   (`data-parsley-required`, `data-parsley-type`, `data-parsley-pattern`)
   rather than hardcoded per field name.
 - Question/answer inputs (Q<n>/Q<n>A<n>) carry NO Parsley validation —
   "required" enforcement for a starred question is entirely the reference
   JS's own `enableDisableSubmit()`, which walks every `.form_check_module`
   that renders a `.star` and keeps Submit disabled until each one has an
   answer, on top of #privacyPolicy on the FF variant (the OC variant has
   no privacy checkbox at all).
 - Parsley toggles a `parsley-error` class directly on the field element
   itself on failed validation — that class is what every field-validation
   check below reads.

Uses Playwright's async API throughout (this module's functions are all
`async def`) — see `qa_test_runner.py` for how a suite run is actually
driven.
"""

from __future__ import annotations

import asyncio
import time
from typing import Optional

from playwright.async_api import Page

from app.services.qa.types import QaCategory, QaCheckResult

# checkSubmitGating (unlike checkRequiredEnforcement) still needs one
# concrete, always-present required question to drive its own
# privacy-checkbox-focused assertions — Q1 is guaranteed present in every
# generated form and, in practice, always required, so it's used as that
# fixed probe.
GATING_QUESTION_ID = "Q1"
GATING_ANSWER_IDS = [f"{GATING_QUESTION_ID}A1", f"{GATING_QUESTION_ID}A2", f"{GATING_QUESTION_ID}A3"]

PROFILE_FIELD_IDS = ["email", "firstName", "lastName", "mobileNumber", "callingCode"]


class FormManifest:
    def __init__(self, locale: Optional[str], question_ids: list[str], answers_by_question: dict[str, list[str]]):
        self.locale = locale
        self.questionIds = question_ids
        self.answersByQuestion = answers_by_question


def _pass(category: QaCategory, name: str, field_id: Optional[str] = None) -> QaCheckResult:
    return QaCheckResult(category=category, name=name, status="passed", fieldId=field_id, message=None)


def _fail(category: QaCategory, name: str, message: str, field_id: Optional[str] = None) -> QaCheckResult:
    return QaCheckResult(category=category, name=name, status="failed", fieldId=field_id, message=message)


async def _set_checked_via_label(page: Page, id_: str, desired: bool) -> None:
    """Toggles a checkbox/radio input to the desired checked state by
    clicking its associated `<label for="...">` rather than the input
    itself — every native checkbox/radio input is visually hidden behind a
    styled label, so the input never has a real bounding box for
    Playwright's actionability checks."""
    input_locator = page.locator(f"#{id_}")
    if (await input_locator.is_checked()) == desired:
        return
    await page.locator(f'label[for="{id_}"]').click(force=True)


async def _force_uncheck(page: Page, id_: str) -> None:
    """Forces a radio/checkbox input to unchecked, bypassing native click
    semantics, then dispatches a real `change` event so the reference JS's
    own change listener still reacts to it."""
    input_locator = page.locator(f"#{id_}")
    await input_locator.evaluate("(el) => { el.checked = false; }")
    await input_locator.dispatch_event("change")


async def wait_for_client_libraries(page: Page, timeout_ms: float = 20_000) -> bool:
    """Waits for jQuery + ParsleyJS (loaded from CDN) to actually finish
    loading, rather than a fixed delay."""
    try:
        await page.wait_for_function(
            "() => typeof window.jQuery?.fn?.parsley !== 'undefined'",
            timeout=timeout_ms,
        )
        return True
    except Exception:  # noqa: BLE001 — a timeout/navigation race here just means "not loaded"
        return False


async def get_form_manifest(page: Page) -> FormManifest:
    """Reads the question/answer manifest straight out of the page's own
    embedded data.js globals (`param`, `questions`, `answers`) rather than
    re-parsing HTML, so question order/ids always match exactly what the
    running page itself uses for lookups."""
    result = await page.evaluate(
        """() => {
            const locale = typeof param !== 'undefined' ? param.fallbackLanguage : undefined;
            const questionsForLocale = locale && typeof questions !== 'undefined' ? questions[locale] : undefined;
            const answersForLocale = locale && typeof answers !== 'undefined' ? answers[locale] : undefined;
            const questionIds = questionsForLocale ? Object.keys(questionsForLocale) : [];
            const answersByQuestion = {};
            for (const qId of questionIds) {
                const answerMap = answersForLocale ? answersForLocale[qId] : undefined;
                answersByQuestion[qId] = answerMap ? Object.keys(answerMap) : [];
            }
            return { locale, questionIds, answersByQuestion };
        }"""
    )
    return FormManifest(result.get("locale"), result.get("questionIds", []), result.get("answersByQuestion", {}))


async def check_structure(page: Page, manifest: FormManifest, console_errors: list[str]) -> list[QaCheckResult]:
    """Page-level structural checks: does it load cleanly, is the skeleton
    (form, submit button, every question module) actually present."""
    results: list[QaCheckResult] = []

    results.append(
        _pass("structure", "Page loads without a JavaScript console error")
        if not console_errors
        else _fail("structure", "Page loads without a JavaScript console error", "\n".join(console_errors)[:1900])
    )

    title = await page.title()
    results.append(
        _pass("structure", "Page has a non-empty <title>")
        if title.strip()
        else _fail("structure", "Page has a non-empty <title>", "Document title is empty")
    )

    form_count = await page.locator("#dataForm").count()
    results.append(
        _pass("structure", "Form element (#dataForm) is present")
        if form_count > 0
        else _fail("structure", "Form element (#dataForm) is present", "No #dataForm element found")
    )

    submit_count = await page.locator("#btnSubmit").count()
    results.append(
        _pass("structure", "Submit button (#btnSubmit) is present")
        if submit_count > 0
        else _fail("structure", "Submit button (#btnSubmit) is present", "No #btnSubmit element found")
    )

    if submit_count > 0:
        initially_disabled = await page.locator("#btnSubmit").is_disabled()
        results.append(
            _pass("structure", "Submit button starts disabled until required selections are made")
            if initially_disabled
            else _fail(
                "structure",
                "Submit button starts disabled until required selections are made",
                "#btnSubmit was not disabled on initial load",
            )
        )

    if not manifest.locale or len(manifest.questionIds) == 0:
        results.append(
            _fail(
                "structure",
                "Question/answer data (data.js globals) is readable",
                "Could not read `param`/`questions` globals from the generated data.js — either the file failed "
                "to load or this form has no questions at all",
            )
        )
        return results
    results.append(_pass("structure", "Question/answer data (data.js globals) is readable"))

    for question_id in manifest.questionIds:
        module_count = await page.locator(f".form_check_module#{question_id}").count()
        results.append(
            _pass("structure", f"Question {question_id} is rendered on the page", question_id)
            if module_count > 0
            else _fail(
                "structure",
                f"Question {question_id} is rendered on the page",
                f"No .form_check_module#{question_id} found",
                question_id,
            )
        )

    return results


class _ParsleyAttrs:
    def __init__(self, required: bool, type_: Optional[str], pattern: Optional[str], tag: str):
        self.required = required
        self.type = type_
        self.pattern = pattern
        self.tag = tag


async def _read_parsley_attrs(page: Page, id_: str) -> _ParsleyAttrs:
    """Reads a profile field's own Parsley attributes off the DOM (never
    hardcoded per field name)."""
    locator = page.locator(f"#{id_}")
    required, type_, pattern, tag = await asyncio.gather(
        locator.get_attribute("data-parsley-required"),
        locator.get_attribute("data-parsley-type"),
        locator.get_attribute("data-parsley-pattern"),
        locator.evaluate("(el) => el.tagName.toLowerCase()"),
    )
    return _ParsleyAttrs(required=required == "true", type_=type_, pattern=pattern, tag=tag)


def _pick_valid_sample(type_: Optional[str]) -> str:
    if type_ == "email":
        return "qa.tester@example.com"
    if type_ == "digits":
        return "5551234"
    return "QaTest"


def _pick_invalid_sample(type_: Optional[str], pattern: Optional[str]) -> str:
    if type_ == "email":
        return "not-an-email"
    if type_ == "digits":
        return "abcde"
    if pattern:
        return "123!@#"
    return "###"


async def _pick_valid_mobile_number(page: Page) -> Optional[str]:
    """#mobileNumber can't use `_pick_valid_sample`'s generic "digits"
    fallback — the reference JS registers its own `mobileNumberByCountry`
    Parsley validator that requires libphonenumber-js's own
    `parsePhoneNumberFromString(...).isValid()` to accept the result for
    whichever calling code is currently selected. Rather than reimplementing
    libphonenumber-js's own numbering-plan rules, this asks the page's own
    already-loaded copy to confirm a candidate is genuinely valid, trying a
    short list of plausible mobile prefixes across a range of digit counts.
    Returns `None` if #callingCode has no real value selected yet, or if
    none of the tried candidates validate."""
    return await page.evaluate(
        """() => {
            const callingCode = window.jQuery('#callingCode').val();
            if (!callingCode || callingCode === '0' || !window.libphonenumber) return null;

            const digitPool = '123456789012345678';
            const candidates = [];
            for (const digitCount of [7, 8, 9, 10]) {
                for (const firstDigit of ['5', '6', '7', '9']) {
                    for (const offset of [0, 3, 6]) {
                        candidates.push(firstDigit + digitPool.slice(offset, offset + digitCount - 1));
                    }
                }
            }

            for (const candidate of candidates) {
                try {
                    const phoneNumber = window.libphonenumber.parsePhoneNumberFromString(`+${callingCode}${candidate}`);
                    if (phoneNumber && phoneNumber.isValid()) return candidate;
                } catch {
                    // Try the next candidate.
                }
            }
            return null;
        }"""
    )


async def _validate_field_via_parsley(page: Page, id_: str) -> bool:
    """Triggers Parsley's real validation API for one field and reports
    whether the field ends up flagged `.parsley-error`."""
    await page.evaluate(
        "(fieldId) => { window.jQuery(`#${fieldId}`).parsley().validate(); }",
        id_,
    )
    return await page.locator(f"#{id_}").evaluate("(el) => el.classList.contains('parsley-error')")


async def check_profile_fields(page: Page) -> list[QaCheckResult]:
    """For each profile field actually present on this page: required-blank
    shows an error, a well-formed value clears it, and (where the field
    declares a type/pattern) a malformed value shows an error again."""
    results: list[QaCheckResult] = []

    for id_ in PROFILE_FIELD_IDS:
        count = await page.locator(f"#{id_}").count()
        if count == 0:
            continue

        attrs = await _read_parsley_attrs(page, id_)
        if attrs.tag != "input":
            continue  # e.g. callingCode is a <select>, not directly required itself

        valid_sample = (
            (await _pick_valid_mobile_number(page)) or _pick_valid_sample(attrs.type)
            if id_ == "mobileNumber"
            else _pick_valid_sample(attrs.type)
        )

        if attrs.required:
            await page.locator(f"#{id_}").fill("")
            has_error = await _validate_field_via_parsley(page, id_)
            results.append(
                _pass("field-validation", f"{id_}: blank required field is rejected", id_)
                if has_error
                else _fail(
                    "field-validation",
                    f"{id_}: blank required field is rejected",
                    "Expected .parsley-error after validating an empty required field, found none",
                    id_,
                )
            )

        if attrs.required or attrs.type or attrs.pattern:
            await page.locator(f"#{id_}").fill(valid_sample)
            still_has_error = await _validate_field_via_parsley(page, id_)
            results.append(
                _pass("field-validation", f'{id_}: accepts a well-formed value ("{valid_sample}")', id_)
                if not still_has_error
                else _fail(
                    "field-validation",
                    f'{id_}: accepts a well-formed value ("{valid_sample}")',
                    f'Still flagged .parsley-error after entering "{valid_sample}"',
                    id_,
                )
            )

        if attrs.type or attrs.pattern:
            invalid_sample = _pick_invalid_sample(attrs.type, attrs.pattern)
            await page.locator(f"#{id_}").fill(invalid_sample)
            has_error = await _validate_field_via_parsley(page, id_)
            results.append(
                _pass("field-validation", f'{id_}: rejects a malformed value ("{invalid_sample}")', id_)
                if has_error
                else _fail(
                    "field-validation",
                    f'{id_}: rejects a malformed value ("{invalid_sample}")',
                    f'Expected .parsley-error after entering "{invalid_sample}", found none',
                    id_,
                )
            )
            # Leave the field valid again for any later checks (submit-gating/flow)
            # that share this same page.
            await page.locator(f"#{id_}").fill(valid_sample)
            await _validate_field_via_parsley(page, id_)

    return results


async def check_question_interaction(page: Page, manifest: FormManifest) -> list[QaCheckResult]:
    """For each question: exercises whatever control type it actually
    rendered as (textarea / radio / checkbox — determined from the DOM, not
    assumed) and confirms interacting with it actually updates the DOM."""
    results: list[QaCheckResult] = []

    for question_id in manifest.questionIds:
        module_locator = page.locator(f".form_check_module#{question_id}")
        if (await module_locator.count()) == 0:
            continue

        textarea = module_locator.locator("textarea")
        if (await textarea.count()) > 0:
            sample = "QA automated test answer"
            await textarea.fill(sample)
            value = await textarea.input_value()
            results.append(
                _pass("field-interaction", f"{question_id}: text answer can be typed", question_id)
                if value == sample
                else _fail(
                    "field-interaction",
                    f"{question_id}: text answer can be typed",
                    f'Expected value "{sample}", got "{value}"',
                    question_id,
                )
            )
            continue

        first_option = module_locator.locator('input[type="radio"], input[type="checkbox"]').first
        if (await first_option.count()) == 0:
            results.append(
                _fail(
                    "field-interaction",
                    f"{question_id}: has a selectable control",
                    "No textarea/radio/checkbox found inside this question module",
                    question_id,
                )
            )
            continue
        option_id = await first_option.get_attribute("id")
        await _set_checked_via_label(page, option_id, True)
        checked = await first_option.is_checked()
        results.append(
            _pass("field-interaction", f"{question_id}: an answer can be selected", question_id)
            if checked
            else _fail(
                "field-interaction",
                f"{question_id}: an answer can be selected",
                "Option did not become checked after clicking it",
                question_id,
            )
        )

    return results


async def check_required_enforcement(page: Page, manifest: FormManifest) -> list[QaCheckResult]:
    """For every starred (required) question, actually exercises the
    reference JS's `enableDisableSubmit()` rather than assuming what it
    does: clears that question's answer and confirms Submit disables, then
    restores an answer and confirms Submit re-enables."""
    results: list[QaCheckResult] = []
    submit_locator = page.locator("#btnSubmit")
    if (await submit_locator.count()) == 0:
        return results

    has_privacy_checkbox = (await page.locator("#privacyPolicy").count()) > 0
    if has_privacy_checkbox:
        await _set_checked_via_label(page, "privacyPolicy", True)

    for question_id in manifest.questionIds:
        module_locator = page.locator(f".form_check_module#{question_id}")
        if (await module_locator.count()) == 0:
            continue
        if (await module_locator.locator(".form_check_title .star").count()) == 0:
            continue

        textarea = module_locator.locator("textarea")
        is_textarea = (await textarea.count()) > 0

        if is_textarea:
            await textarea.fill("")
            await textarea.dispatch_event("change")
        else:
            checked_inputs = await module_locator.locator('input[type="radio"]:checked, input[type="checkbox"]:checked').all()
            for checked_input in checked_inputs:
                id_ = await checked_input.get_attribute("id")
                if id_:
                    await _force_uncheck(page, id_)

        disabled_when_blank = await submit_locator.is_disabled()
        results.append(
            _pass(
                "required-enforcement",
                f"{question_id}: required marker is backed by real submit-blocking validation",
                question_id,
            )
            if disabled_when_blank
            else _fail(
                "required-enforcement",
                f"{question_id}: required marker is backed by real submit-blocking validation",
                f'{question_id} is shown as required ("*") but the Submit button did not disable after clearing '
                f"its answer — a user can submit without answering {question_id}.",
                question_id,
            )
        )

        # Restore an answer.
        if is_textarea:
            await textarea.fill("QA automated test answer")
            await textarea.dispatch_event("change")
        else:
            first_option_id = await module_locator.locator('input[type="radio"], input[type="checkbox"]').first.get_attribute("id")
            if first_option_id:
                await _set_checked_via_label(page, first_option_id, True)

        enabled_after_restoring = not (await submit_locator.is_disabled())
        results.append(
            _pass(
                "required-enforcement",
                f"{question_id}: answering it re-enables Submit once every other requirement is also met",
                question_id,
            )
            if enabled_after_restoring
            else _fail(
                "required-enforcement",
                f"{question_id}: answering it re-enables Submit once every other requirement is also met",
                f"Submit stayed disabled after answering {question_id} again, even though every other required "
                "question and the privacy checkbox (if present) are already satisfied.",
                question_id,
            )
        )

    if has_privacy_checkbox:
        await _set_checked_via_label(page, "privacyPolicy", False)

    return results


async def check_submit_gating(page: Page) -> list[QaCheckResult]:
    """Focuses specifically on the FF-only #privacyPolicy gate
    (check_required_enforcement already covers every required question's
    own gating individually)."""
    results: list[QaCheckResult] = []
    submit_locator = page.locator("#btnSubmit")
    if (await submit_locator.count()) == 0:
        return results

    has_privacy_checkbox = (await page.locator("#privacyPolicy").count()) > 0
    existing_counts = await asyncio.gather(*(page.locator(f"#{id_}").count() for id_ in GATING_ANSWER_IDS))
    first_gating_answer = next((i for i, c in enumerate(existing_counts) if c > 0), -1)

    if first_gating_answer == -1:
        results.append(
            _fail(
                "submit-gating",
                "Submit button can be enabled",
                "This form has no Q1A1/Q1A2/Q1A3 answer inputs for the Submit button's gating logic to react to "
                "(enableDisableSubmit() hardcodes those three ids) — Submit can never be enabled",
            )
        )
        return results
    answer_id = GATING_ANSWER_IDS[first_gating_answer]

    if has_privacy_checkbox:
        await _set_checked_via_label(page, answer_id, True)
        still_disabled = await submit_locator.is_disabled()
        results.append(
            _pass("submit-gating", "Submit stays disabled until the privacy checkbox is also checked", answer_id)
            if still_disabled
            else _fail(
                "submit-gating",
                "Submit stays disabled until the privacy checkbox is also checked",
                "Submit became enabled before #privacyPolicy was checked",
            )
        )

        await _set_checked_via_label(page, "privacyPolicy", True)
        enabled = await submit_locator.is_disabled()
        results.append(
            _pass("submit-gating", "Submit becomes enabled once privacy + a Q1 answer are both set")
            if not enabled
            else _fail(
                "submit-gating",
                "Submit becomes enabled once privacy + a Q1 answer are both set",
                "Submit is still disabled after checking privacy + a Q1 answer",
            )
        )

        await _set_checked_via_label(page, "privacyPolicy", False)
        still_disabled = await submit_locator.is_disabled()
        results.append(
            _pass("submit-gating", "Submit re-disables when the privacy checkbox is unchecked")
            if still_disabled
            else _fail(
                "submit-gating",
                "Submit re-disables when the privacy checkbox is unchecked",
                "Submit stayed enabled after unchecking #privacyPolicy",
            )
        )
        await _set_checked_via_label(page, "privacyPolicy", True)
    else:
        await _set_checked_via_label(page, answer_id, True)
        enabled = await submit_locator.is_disabled()
        results.append(
            _pass("submit-gating", "Submit becomes enabled once a Q1 answer is set (no privacy checkbox on this variant)")
            if not enabled
            else _fail(
                "submit-gating",
                "Submit becomes enabled once a Q1 answer is set (no privacy checkbox on this variant)",
                "Submit is still disabled after checking a Q1 answer",
            )
        )

    return results


async def satisfy_submit_preconditions(page: Page) -> None:
    """Fills every currently-invalid required profile field with a valid
    sample and answers every starred (required) question — shared setup for
    both submit-flow scenarios below, each of which needs a fresh page and
    therefore starts with nothing answered."""
    for id_ in PROFILE_FIELD_IDS:
        locator = page.locator(f"#{id_}")
        if (await locator.count()) == 0:
            continue
        attrs = await _read_parsley_attrs(page, id_)
        if attrs.tag != "input":
            continue
        if attrs.required:
            await locator.fill(_pick_valid_sample(attrs.type))

    has_privacy_checkbox = (await page.locator("#privacyPolicy").count()) > 0
    if has_privacy_checkbox:
        await _set_checked_via_label(page, "privacyPolicy", True)

    modules = await page.locator("div.form_check_group > div.form_check_module").all()
    for module_locator in modules:
        if (await module_locator.locator(".form_check_title .star").count()) == 0:
            continue

        textarea = module_locator.locator("textarea")
        if (await textarea.count()) > 0:
            await textarea.fill("QA automated test answer")
            await textarea.dispatch_event("change")
            continue

        first_option_id = await module_locator.locator('input[type="radio"], input[type="checkbox"]').first.get_attribute("id")
        if first_option_id:
            await _set_checked_via_label(page, first_option_id, True)


class _NavTracker:
    def __init__(self) -> None:
        self.navigated_again = False


async def _mock_submit_response(page: Page, status: int) -> _NavTracker:
    """Installs the mocked POST response for the form's submit fetch(), and
    tracks whether a top-level navigation is ever attempted afterward — that
    flag is what `check_submit_flow_success` uses to detect success, since a
    completed navigation destroys the page's JS execution context and a
    direct #hrTy poll would race it."""
    tracker = _NavTracker()

    async def handler(route):
        request = route.request
        if request.method == "POST":
            await route.fulfill(status=status, content_type="application/json", body="{}")
            return
        if request.method == "GET" and request.resource_type == "document":
            tracker.navigated_again = True
            await route.continue_()
            return
        await route.continue_()

    await page.route("**/*", handler)
    return tracker


async def _poll_submit_outcome(page: Page, tracker: _NavTracker, timeout_ms: float = 10_000) -> str:
    """Dismisses the reference's own "are you sure you want to submit?"
    confirmation popup if it appears, and reports whether #apiError became
    visible. Every page interaction is wrapped so a transient
    "execution context destroyed" error just skips that poll cycle rather
    than aborting the whole wait."""
    deadline = time.monotonic() + timeout_ms / 1000
    while time.monotonic() < deadline:
        if tracker.navigated_again:
            return "success"
        try:
            popup_yes = page.locator("#submitIntentPopupYes")
            if await popup_yes.is_visible():
                await popup_yes.click(force=True)
            if await page.locator("#apiError").is_visible():
                return "error"
        except Exception:  # noqa: BLE001 — page likely mid-navigation for a moment
            pass
        await asyncio.sleep(0.1)
    return "success" if tracker.navigated_again else "timeout"


async def check_submit_flow_success(page: Page) -> list[QaCheckResult]:
    """Clicks Submit with a mocked *successful* API response and confirms
    the reference's own showSuccess() actually ran."""
    tracker = await _mock_submit_response(page, 200)
    await satisfy_submit_preconditions(page)
    await page.locator("#btnSubmit").click()

    outcome = await _poll_submit_outcome(page, tracker)
    if outcome == "success":
        return [_pass("submit-flow", "Successful submit shows the thank-you state (#hrTy) with a mocked API success response")]
    return [
        _fail(
            "submit-flow",
            "Successful submit shows the thank-you state (#hrTy) with a mocked API success response",
            f"Never observed the post-success redirect attempt within 10s of clicking Submit with a mocked 200 "
            f"response (observed: {outcome})",
        )
    ]


async def check_submit_flow_failure(page: Page) -> list[QaCheckResult]:
    """Same as above but with a mocked *failing* API response — confirms
    apiCallErrorHandler()'s visible error state (#apiError) actually fires,
    and that Submit is re-enabled afterward so the user can retry."""
    tracker = await _mock_submit_response(page, 500)
    await satisfy_submit_preconditions(page)
    await page.locator("#btnSubmit").click()
    outcome = await _poll_submit_outcome(page, tracker)

    results: list[QaCheckResult] = []
    results.append(
        _pass("submit-flow", "Failed submit shows a visible error state (#apiError) with a mocked API failure response")
        if outcome == "error"
        else _fail(
            "submit-flow",
            "Failed submit shows a visible error state (#apiError) with a mocked API failure response",
            f"#apiError never became visible within 10s of clicking Submit with a mocked 500 response (observed: {outcome})",
        )
    )

    re_enabled = not (await page.locator("#btnSubmit").is_disabled())
    results.append(
        _pass("submit-flow", "Submit button is re-enabled after a failed submit, so the user can retry")
        if re_enabled
        else _fail(
            "submit-flow",
            "Submit button is re-enabled after a failed submit, so the user can retry",
            "#btnSubmit stayed disabled after the mocked failure",
        )
    )

    return results
