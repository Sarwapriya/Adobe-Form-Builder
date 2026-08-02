import type { FormDefinition } from "../../form/formDefinition.ts";
import type { FileNames } from "../fileNames.ts";
import type { BuilderConfig, FormVariant } from "../types.ts";
import { renderProfileFields } from "./fragments/renderProfileField.ts";
import { renderQuestionModule } from "./fragments/renderQuestionModule.ts";

const CDN_SCRIPTS =
  '<script type="text/javascript" src="https://code.jquery.com/jquery-3.3.1.min.js"></script>\n' +
  '<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/parsleyjs@2/dist/parsley.min.js"></script>\n' +
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/libphonenumber-js/1.11.4/libphonenumber-js.min.js"></script>';

// The following are hardcoded to the reference's literal values (favicon, fonts
// stylesheet, Adobe Launch script, terms-and-conditions link) rather than sourced from
// BuilderConfig — the generated FF.js/OC.js are byte-identical copies of the reference
// scripts, so the HTML they run against needs to be the reference's own markup, not a
// generic reskin of it.
const FAVICON_TAG = '<link rel="shortcut icon" href="https://res6.mena2p.crm.samsung.com/res/tracking/Favicon.png">';
const FONTS_TAG = '<link rel="stylesheet" href="samsungSS_fonts_2026.css">';
const ADOBE_LAUNCH_SCRIPT =
  '<script src="https://assets.adobedtm.com/72afb75f5516/dd6b57adea42/launch-b679a712f5a6.min.js" async></script>';
const TERMS_URL = "https://res6.mena2p.crm.samsung.com/res/tracking/SGE_Hand_Raiser _romotionNRaffle_TnCsv3.pdf";
const termsLink = (extraClass: string) =>
  `<a${extraClass ? ` class="${extraClass}"` : ""} style="text-align:center" href="${TERMS_URL}" target="_blank">` +
  '* Terms and conditions apply.<span></span><img class="form_bottom_img" src="blue_arr.png"></a>';

/**
 * Renders the full page for either variant. Both FF and OC share the same overall
 * skeleton, question modules, and empty-text-node convention (the generated FF.js/OC.js
 * — byte-identical copies of the reference scripts — inject all text from the data file
 * at runtime) — they differ only in which profile fields appear, whether the OC-only
 * heading is present, and the submit-button container (inline `.form_bottom_group` vs.
 * OC's floating `.form_bottom_bar`).
 */
export function renderPage(form: FormDefinition, _config: BuilderConfig, variant: FormVariant, fileNames: FileNames): string {
  const isOc = variant === "oc";
  const defaultLocaleInfo = form.locales.find((l) => l.code === form.meta.defaultLocale);
  const langSubtag = defaultLocaleInfo?.langSubtag ?? "en";
  const dir = defaultLocaleInfo?.isRtl ? "rtl" : "ltr";

  const profileFields = renderProfileFields(
    isOc
      ? { callingCode: form.fields.callingCode, countryCode: form.fields.countryCode }
      : {
          email: form.fields.email,
          firstName: form.fields.firstName,
          lastName: form.fields.lastName,
          countryCode: form.fields.countryCode,
          callingCode: form.fields.callingCode,
        },
  );

  const questionsHtml = form.questions.map(renderQuestionModule).join("");

  const privacyBlock =
    !isOc && form.fields.privacyPolicy
      ? '<div class="form_bottom_check_group">' +
        '<div class="form_bottom_check">' +
        '<input id="privacyPolicy" name="privacyPolicy" type="checkbox" data-pt-api="y">' +
        '<label for="privacyPolicy"><span></span><br>' +
        '<a href="#" target="_blank" id="privacyPolicyLink"><span></span></a><span class="star">*</span></label>' +
        "</div>" +
        (form.fields.marketingOptin
          ? '<div class="form_bottom_check form_bottom_check2">' +
            '<input id="subscribe" name="subscribe" type="checkbox" data-pt-api="y">' +
            '<label for="subscribe"><span></span></label>' +
            "</div>"
          : "") +
        "</div>"
      : "";

  const submitBlock =
    '<button class="disabled" disabled id="btnSubmit"></button>' +
    '<div class="error" id="apiError" style="display:none"></div>' +
    termsLink(isOc ? "form_bottom_terms" : "");

  const bottomGroup = isOc
    ? `<div class="form_bottom_bar" id="formBottomBar">${submitBlock}</div>`
    : `<div class="form_bottom_group">${privacyBlock}${submitBlock}</div>`;

  const topHeading = isOc ? '<h2><br class="b_850"><span></span></h2>' : "";

  return `<!doctype html>
<html lang="${langSubtag}" dir="${dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Samsung</title>
${FAVICON_TAG}
${FONTS_TAG}
<link rel="stylesheet" href="${fileNames.css}">
${CDN_SCRIPTS}
${ADOBE_LAUNCH_SCRIPT}
</head>
<body>
<div class="${isOc ? "container_oc" : "container"}">
<div class="top_cont">${topHeading}<p><span class="star">*</span><span id="requiredFieldNote"></span></p></div>
<div class="main">
<form action="" id="dataForm">
<div class="form_top_group">${profileFields}</div>
<div class="form_check_group">${questionsHtml}${bottomGroup}</div>
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
<script src="${fileNames.dataJs}"></script>
<script src="${isOc ? fileNames.ocJs : fileNames.ffJs}"></script>
</body>
</html>
`;
}
