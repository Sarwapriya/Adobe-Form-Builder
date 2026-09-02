"""Port of packages/shared/src/codegen/html/fragments/renderProfileField.ts.

Renders the `.form_top_group` profile inputs, matching the reference's exact
attributes field-for-field (kept since the byte-identical reference FF.js/OC.js
run against this markup and a generic tool reskin would drift from what they
expect). Each block is presence-driven: a form that never defines a
`firstName` field produces no first-name input at all. All label/placeholder
text stays empty here — the generated FF.js/OC.js inject it at runtime from
the data file.
"""

from __future__ import annotations

from typing import Optional

from ....form.definition import CallingCodeFieldMeta, LocalizedFieldMeta, MobileNumberFieldMeta


def render_profile_fields(
    *,
    email: Optional[LocalizedFieldMeta] = None,
    firstName: Optional[LocalizedFieldMeta] = None,
    lastName: Optional[LocalizedFieldMeta] = None,
    countryCode: Optional[LocalizedFieldMeta] = None,
    callingCode: Optional[CallingCodeFieldMeta] = None,
    mobileNumber: Optional[MobileNumberFieldMeta] = None,
) -> str:
    parts: list[str] = []

    if countryCode:
        # Hidden by default — the reference's populateCountryCodeDropdown() only
        # reveals this when the resolved subsidiary offers more than one country.
        parts.append(
            '<div class="form_text_bx select_bx" style="display: none;">'
            '<p class="form_label"></p>'
            '<div class="select_wrap"><select autocomplete="off" data-pt-api="y" id="countryCode" name="countryCode"></select></div>'
            "</div>"
        )

    if email:
        parts.append(
            '<div class="form_text_bx">'
            '<p class="form_label"><span></span><span class="star">*</span></p>'
            '<div class="input_wrap">'
            '<input autocapitalize="none" autocomplete="off" autocorrect="off" data-parsley-trigger="blur" '
            'data-parsley-error-message="Enter a valid Email address" '
            'data-parsley-pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" data-parsley-required="true" '
            'data-parsley-type="email" data-pt-api="y" id="email" maxlength="128" name="email" placeholder="" '
            'spellcheck="false" type="email">'
            '<div class="btn_clear"></div></div></div>'
        )

    if firstName or lastName:
        name_fields: list[str] = []
        if firstName:
            name_fields.append(
                '<div class="form_text_bx"><p class="form_label"><span></span><span class="star">*</span></p>'
                '<div class="input_wrap"><input autocapitalize="none" autocomplete="off" autocorrect="off" '
                'data-parsley-trigger="blur" data-parsley-error-message="Letters are allowed" '
                'data-parsley-pattern="^[A-Za-z\\u0600-\\u06FF]+(\\s[A-Za-z\\u0600-\\u06FF]+)*$" data-parsley-required="true" '
                'data-pt-api="y" id="firstName" maxlength="200" name="firstName" placeholder="" spellcheck="false" '
                'type="firstName"><div class="btn_clear"></div></div></div>'
            )
        if lastName:
            name_fields.append(
                '<div class="form_text_bx"><p class="form_label"><span></span><span class="star">*</span></p>'
                '<div class="input_wrap"><input autocapitalize="none" autocomplete="off" autocorrect="off" '
                'data-parsley-trigger="blur" data-parsley-error-message="Letters are allowed" '
                'data-parsley-pattern="^[A-Za-z\\u0600-\\u06FF]+(\\s[A-Za-z\\u0600-\\u06FF]+)*$" data-parsley-required="true" '
                'data-pt-api="y" id="lastName" maxlength="200" name="lastName" placeholder="" spellcheck="false" '
                'type="lastName"><div class="btn_clear"></div></div></div>'
            )
        parts.append(f'<div class="form_text_group">{"".join(name_fields)}</div>')

    if callingCode or mobileNumber:
        parts.append(
            '<div class="form_text_bx select_bx">'
            '<p class="form_label"></p>'
            '<div class="select_wrap">'
            '<select autocomplete="off" data-parsley-error-message="Select a value" data-parsley-required-if="#mobileNumber" '
            'data-parsley-validate-if-empty="true" data-pt-api="y" id="callingCode" name="callingCode"></select>'
            '<div class="input_wrap">'
            '<input autocapitalize="none" autocomplete="off" autocorrect="off" data-parsley-trigger="blur" '
            'data-parsley-mobile-number-by-country="true" data-parsley-mobile-number-by-country-message="Enter a valid mobile number" '
            'data-parsley-type-message="Digits are allowed" data-parsley-type="digits" data-pt-api="y" id="mobileNumber" '
            'maxlength="10" name="mobileNumber" placeholder="" spellcheck="false" type="text">'
            '<div class="btn_clear"></div></div></div>'
        )

    return "".join(parts)
