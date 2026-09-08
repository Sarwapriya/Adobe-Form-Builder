"""Fire-and-forget background work with its own DB session.

Mirrors Node's `void someAsyncCall(...)` pattern (see e.g.
`formContributionService.ts`'s `void sendContributionSubmittedNotification(...)`)
— a notification send should never block the request/service call that
triggered it, and should never share the caller's request-scoped
`Session` (which is closed as soon as the request finishes, and is not
thread-safe to begin with).
"""

from __future__ import annotations

import threading
from typing import Callable

from sqlalchemy.orm import Session


def run_in_background(work: Callable[[Session], None]) -> None:
    """Runs `work(db)` on a new daemon thread with its own DB session.
    `work` must never raise for anything but a genuine bug — every current
    caller (`email_service`'s senders) already normalizes failures into a
    logged, swallowed result internally."""

    def _run() -> None:
        from app.db import get_sessionmaker

        db = get_sessionmaker()()
        try:
            work(db)
        except Exception as err:  # noqa: BLE001 — a background job must never crash the process
            print(f"[background] fire-and-forget task failed: {err}")
        finally:
            db.close()

    threading.Thread(target=_run, daemon=True).start()
