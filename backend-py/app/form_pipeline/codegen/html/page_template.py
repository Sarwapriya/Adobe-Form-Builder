"""Port of packages/shared/src/codegen/html/pageTemplate.ts.

Renders the full page for either variant. Both FF and OC share the same
overall skeleton, question modules, and empty-text-node convention (the
generated FF.js/OC.js — byte-identical copies of the reference scripts —
inject all text from the data file at runtime) — they differ only in which
profile fields appear, whether the OC-only heading is present, and the
submit-button container.
"""

from __future__ import annotations

from ...form.definition import FormDefinition, FormVariant
from ..escaping import escape_html
from ..file_names import FileNames
from ..types import BuilderConfig
from .fragments.render_profile_field import render_profile_fields
from .fragments.render_question_module import render_question_module

_CDN_SCRIPTS = (
    '<script type="text/javascript" src="https://code.jquery.com/jquery-3.3.1.min.js"></script>\n'
    '<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/parsleyjs@2/dist/parsley.min.js"></script>\n'
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/libphonenumber-js/1.11.4/libphonenumber-js.min.js"></script>'
)

# Favicon/fonts are hardcoded to the reference's literal values (inert URLs, no
# executable behavior) rather than sourced from BuilderConfig — see the TS
# source's own doc comment on why the Adobe Launch tag stays opt-in instead.
_FAVICON_TAG = '<link rel="shortcut icon" href="https://res6.mena2p.crm.samsung.com/res/tracking/Favicon.png">'
_FONTS_TAG = '<link rel="stylesheet" href="samsungSS_fonts_2026.css">'
_ADOBE_LAUNCH_SCRIPT = '<script src="https://assets.adobedtm.com/72afb75f5516/dd6b57adea42/launch-b679a712f5a6.min.js" async></script>'


def _terms_link(form: FormDefinition, extra_class: str) -> str:
    if not form.fields.termsAndConditions:
        return ""
    class_attr = f' class="{extra_class}"' if extra_class else ""
    return (
        f'<a{class_attr} style="text-align:center" href="#" target="_blank" id="termsAndConditionsLink">'
        '<span></span><img class="form_bottom_img" src="blue_arr.png"></a>'
    )


def render_page(form: FormDefinition, config: BuilderConfig, variant: FormVariant, file_names: FileNames) -> str:
    is_oc = variant == "oc"
    analytics_script = _ADOBE_LAUNCH_SCRIPT if (config.analytics and config.analytics.enabled) else ""
    locale_info = next((l for l in form.locales if l.code == form.meta.defaultLocale), None)
    lang_subtag = locale_info.langSubtag if locale_info else "en"
    dir_attr = "rtl" if (locale_info and locale_info.isRtl) else "ltr"

    if is_oc:
        profile_fields = render_profile_fields(
            callingCode=form.fields.callingCode,
            countryCode=form.fields.countryCode,
            mobileNumber=form.fields.mobileNumber,
        )
    else:
        profile_fields = render_profile_fields(
            email=form.fields.email,
            firstName=form.fields.firstName,
            lastName=form.fields.lastName,
            countryCode=form.fields.countryCode,
            callingCode=form.fields.callingCode,
            mobileNumber=form.fields.mobileNumber,
        )

    # visibleInVariants is a builder-only, additive concept — absent/None means
    # "every variant", so forms which never set it render identically to
    # before this existed.
    questions_html = "".join(
        render_question_module(q) for q in form.questions if not q.visibleInVariants or variant in q.visibleInVariants
    )

    # Consent checkboxes. Each of the three consent-style fields is
    # independently configurable — which variant(s) it renders in, and
    # whether checking it gates Submit.
    consent_checks: list[str] = []
    pp = form.fields.privacyPolicy
    if pp and variant in (pp.visibleInVariants if pp.visibleInVariants is not None else ["ff"]):
        star = '<span class="star">*</span>' if pp.required is not False else ""
        consent_checks.append(
            '<div class="form_bottom_check">'
            '<input id="privacyPolicy" name="privacyPolicy" type="checkbox" data-pt-api="y">'
            '<label for="privacyPolicy"><span></span><br>'
            f'<a href="#" target="_blank" id="privacyPolicyLink"><span></span></a>{star}</label>'
            "</div>"
        )
    mo = form.fields.marketingOptin
    if mo and variant in (mo.visibleInVariants if mo.visibleInVariants is not None else ["ff"]):
        star = '<span class="star">*</span>' if mo.required else ""
        consent_checks.append(
            '<div class="form_bottom_check form_bottom_check2">'
            '<input id="subscribe" name="subscribe" type="checkbox" data-pt-api="y">'
            f'<label for="subscribe"><span></span>{star}</label>'
            "</div>"
        )
    if form.fields.additionalConsents:
        for consent in form.fields.additionalConsents:
            visible = consent.visibleInVariants if consent.visibleInVariants is not None else ["ff"]
            if variant not in visible:
                continue
            cid = escape_html(consent.id)
            link = f'<br><a href="#" target="_blank" id="{cid}Link"><span></span></a>' if consent.linkUrlByLocale else ""
            star = '<span class="star">*</span>' if consent.required else ""
            consent_checks.append(
                '<div class="form_bottom_check form_bottom_check2">'
                f'<input id="{cid}" name="{cid}" type="checkbox" data-pt-api="y">'
                f'<label for="{cid}"><span></span>{link}{star}</label>'
                "</div>"
            )
    privacy_block = f'<div class="form_bottom_check_group">{"".join(consent_checks)}</div>' if consent_checks else ""

    submit_block = (
        '<button class="disabled" disabled id="btnSubmit"></button>'
        '<div class="error" id="apiError" style="display:none"></div>' + _terms_link(form, "form_bottom_terms" if is_oc else "")
    )

    # OC's floating form_bottom_bar has no room for the consent group inside it,
    # so when any consent renders for OC it sits as its own sibling block
    # immediately before the bar.
    if is_oc:
        bottom_group = f'{privacy_block}<div class="form_bottom_bar" id="formBottomBar">{submit_block}</div>'
    else:
        bottom_group = f'<div class="form_bottom_group">{privacy_block}{submit_block}</div>'

    top_heading = '<h2><br class="b_850"><span></span></h2>'
    top_subheading = '<p class="top_subheading"></p>'

    container_class = "container_oc" if is_oc else "container"
    script_js = file_names.ocJs if is_oc else file_names.ffJs

    return f"""<!doctype html>
<html lang="{lang_subtag}" dir="{dir_attr}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Samsung</title>
{_FAVICON_TAG}
{_FONTS_TAG}
<link rel="stylesheet" href="{file_names.css}">
{_CDN_SCRIPTS}
{analytics_script}
</head>
<body>
<div class="{container_class}">
<div class="top_cont">{top_heading}{top_subheading}<p><span class="star">*</span><span id="requiredFieldNote"></span></p></div>
<div class="main">
<form action="" id="dataForm">
<div class="form_top_group">{profile_fields}</div>
<div class="form_check_group">{questions_html}{bottom_group}</div>
</form>
</div>
</div>
<div id="hrTy" style="display:none"><h3></h3><p><a href="" target="_blank"></a></p></div>
<div id="hrErr" style="display:none"><h3></h3><p><a href="" target="_blank"></a></p></div>
<div id="overlay" style="display:none"><span class="loader"></span></div>
<section id="submitIntentPopup" class="popup popup--alert">
<div class="popup__dimmed"></div>
<div class="popup__contents-wrap"><div class="popup__contents"><div class="popup__inner-wrap"><div class="popup__inner">
<p class="popup__desc" id="submitIntentPopupMessage1"></p>
<p class="popup__desc" id="submitIntentPopupMessage2"></p>
</div></div>
<div class="popup__btn-wrap">
<button class="cta cta--outlined cta--black" id="submitIntentPopupNo"></button>
<button class="cta cta--contained cta--black" id="submitIntentPopupYes"></button>
</div>
</div></div>
</section>
<script src="{file_names.dataJs}"></script>
<script src="{script_js}"></script>
</body>
</html>
"""
