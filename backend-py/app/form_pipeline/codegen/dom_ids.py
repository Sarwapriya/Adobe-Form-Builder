"""Port of packages/shared/src/codegen/domIds.ts.

Shared DOM-id conventions used by both the HTML generators and build_data_js,
so the `value`/`id` attributes emitted into markup always match the keys
`data.js` uses for lookups.
"""

from __future__ import annotations


def answer_dom_key(order: int) -> str:
    return f"A{order}"


def question_input_id(question_id: str, answer_order: int) -> str:
    return f"{question_id}{answer_dom_key(answer_order)}"


def consent_extra_id(order: int) -> str:
    """Id for an admin-added consent checkbox beyond the two fixed slots
    (privacyPolicy/subscribe) — the "consentExtra" prefix is also the
    convention the reference FF.js's mapParam() greps for generically."""
    return f"consentExtra{order}"


def auto_populate_param_name(question_order: int) -> str:
    """URL query-param name that auto-populates this question's answer in the
    One-Click variant, e.g. order 1 -> "q01"."""
    return f"q{question_order:02d}"
