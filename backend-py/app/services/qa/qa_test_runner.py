"""Port of `backend/src/services/qa/qaTestRunner.ts`.

Runs the full generic QA suite (`qa_introspection.py`) against one
self-contained generated form document. Three page loads against the same
local server: one for every non-destructive check (structure, field
validation, question interaction, required-enforcement, submit-gating), and
one fresh load each for the two submit-flow scenarios (success/failure),
since a successful submit empties the form's own container — sharing a page
across those would make the failure scenario's result meaningless.

Wrapped in an overall timeout so a hung page/browser can't leave a QaRun
stuck at "running" forever — see `qa_run_service.run_qa_job`, which relies
on this always eventually resolving or raising.
"""

from __future__ import annotations

import asyncio
import http.server
import threading
from dataclasses import dataclass, field
from typing import Callable

from playwright.async_api import async_playwright

from app.services.qa.qa_introspection import (
    check_profile_fields,
    check_question_interaction,
    check_required_enforcement,
    check_structure,
    check_submit_flow_failure,
    check_submit_flow_success,
    check_submit_gating,
    get_form_manifest,
    wait_for_client_libraries,
)
from app.services.qa.types import QaCheckResult

OVERALL_TIMEOUT_SECONDS = 3 * 60


@dataclass
class QaRunOutcome:
    results: list[QaCheckResult] = field(default_factory=list)


def _serve_html(html: str) -> tuple[str, Callable[[], None]]:
    """Serves the exact same self-contained HTML to every GET request on an
    ephemeral localhost port. A real HTTP server (not `file://`) is used
    specifically so `page.route()` can reliably intercept the form's
    `fetch()` submit call."""
    html_bytes = html.encode("utf-8")

    class _Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802 — stdlib method name
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(html_bytes)

        def do_POST(self) -> None:  # noqa: N802
            # Safety net only — page.route() in qa_introspection.py
            # intercepts the real submit fetch() before it would ever reach here.
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b"{}")

        def log_message(self, format: str, *args: object) -> None:  # noqa: A002
            pass  # silence default stderr access logging

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    def close() -> None:
        server.shutdown()
        server.server_close()

    return f"http://127.0.0.1:{port}/", close


def _collect_console_errors(page) -> list[str]:  # noqa: ANN001 — playwright.async_api.Page
    errors: list[str] = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda err: errors.append(str(err)))
    return errors


async def run_qa_suite(html: str) -> QaRunOutcome:
    try:
        return await asyncio.wait_for(_run_qa_suite_inner(html), timeout=OVERALL_TIMEOUT_SECONDS)
    except asyncio.TimeoutError as err:
        raise Exception(f"QA run exceeded its {OVERALL_TIMEOUT_SECONDS}s timeout") from err


async def _run_qa_suite_inner(html: str) -> QaRunOutcome:
    url, close_server = _serve_html(html)

    # The One-Click variant's own reference JS requires a non-empty "id"
    # (recipientId) URL query param — by design, an OC form is only ever
    # reached via a campaign link carrying that recipient id. The FF variant
    # has no such check, so this dummy value is harmless there too — applied
    # to every navigation rather than branching on variant, since this
    # module only ever sees a plain HTML string, not which variant it came
    # from.
    navigate_url = f"{url}?id=qa-automation-run"

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            try:
                context = await browser.new_context()
                results: list[QaCheckResult] = []

                # --- Page A: everything that doesn't destroy form state ---
                page_a = await context.new_page()
                console_errors_a = _collect_console_errors(page_a)
                await page_a.goto(navigate_url, wait_until="domcontentloaded")
                libraries_loaded = await wait_for_client_libraries(page_a)

                if not libraries_loaded:
                    results.append(
                        QaCheckResult(
                            category="structure",
                            name="jQuery/Parsley (loaded from CDN) become available",
                            status="failed",
                            fieldId=None,
                            message=(
                                "jQuery/ParsleyJS never loaded within 20s — this generated form loads them from a "
                                "public CDN (code.jquery.com / cdn.jsdelivr.net), so this usually means the machine "
                                "running the QA tool has no internet access, not that the generated form itself is "
                                "broken. Every later check was skipped."
                            ),
                        )
                    )
                    await page_a.close()
                    return QaRunOutcome(results=results)

                manifest = await get_form_manifest(page_a)
                results.extend(await check_structure(page_a, manifest, console_errors_a))
                results.extend(await check_profile_fields(page_a))
                results.extend(await check_question_interaction(page_a, manifest))
                results.extend(await check_required_enforcement(page_a, manifest))
                results.extend(await check_submit_gating(page_a))
                await page_a.close()

                # --- Page B: mocked successful submit ---
                page_b = await context.new_page()
                await page_b.goto(navigate_url, wait_until="domcontentloaded")
                if await wait_for_client_libraries(page_b):
                    results.extend(await check_submit_flow_success(page_b))
                await page_b.close()

                # --- Page C: mocked failing submit ---
                page_c = await context.new_page()
                await page_c.goto(navigate_url, wait_until="domcontentloaded")
                if await wait_for_client_libraries(page_c):
                    results.extend(await check_submit_flow_failure(page_c))
                await page_c.close()

                return QaRunOutcome(results=results)
            finally:
                await browser.close()
    finally:
        close_server()
