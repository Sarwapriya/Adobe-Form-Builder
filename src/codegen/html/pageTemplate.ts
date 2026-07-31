import type { FormDefinition } from "../../form/formDefinition.ts";
import type { FileNames } from "../fileNames.ts";
import type { BuilderConfig, FormVariant } from "../types.ts";
import { renderProfileFields } from "./fragments/renderProfileField.ts";
import { renderQuestionModule } from "./fragments/renderQuestionModule.ts";

const CDN_SCRIPTS = [
  "https://code.jquery.com/jquery-3.3.1.min.js",
  "https://cdn.jsdelivr.net/npm/parsleyjs@2/dist/parsley.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/libphonenumber-js/1.11.4/libphonenumber-js.min.js",
]
  .map((src) => `<script src="${src}"></script>`)
  .join("\n");

const ADOBE_LAUNCH_SCRIPT =
  '<script src="https://assets.adobedtm.com/72afb75f5516/dd6b57adea42/launch-b679a712f5a6.min.js" async></script>';

/**
 * Renders the full page for either variant. Both FF and OC share the same overall
 * skeleton, question modules, and empty-text-node convention (behavior.js injects all
 * text from data.js at runtime) — they differ only in which profile fields appear,
 * whether the privacy/subscribe checkboxes are present, and the submit-button
 * container (inline `.form_bottom_group` vs. OC's floating `.form_bottom_bar`).
 */
export function renderPage(form: FormDefinition, config: BuilderConfig, variant: FormVariant, fileNames: FileNames): string {
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
        '<input id="privacyPolicy" name="privacyPolicy" type="checkbox" required data-parsley-required="true">' +
        '<label for="privacyPolicy"><span></span><br>' +
        '<a href="#" target="_blank" id="privacyPolicyLink"><span></span></a><span class="star">*</span></label>' +
        "</div>" +
        (form.fields.marketingOptin
          ? '<div class="form_bottom_check form_bottom_check2">' +
            '<input id="subscribe" name="subscribe" type="checkbox">' +
            '<label for="subscribe"><span></span></label>' +
            "</div>"
          : "") +
        "</div>"
      : "";

  const termsLink = form.fields.termsAndConditions
    ? '<a id="termsLink" href="#" target="_blank"><span></span></a>'
    : "";

  const submitBlock =
    '<button class="disabled" disabled id="btnSubmit"></button>' +
    '<div class="error" id="apiError" style="display:none"></div>' +
    termsLink;

  const bottomGroup = isOc
    ? `<div class="form_bottom_bar" id="formBottomBar">${submitBlock}</div>`
    : `<div class="form_bottom_group">${privacyBlock}${submitBlock}</div>`;

  const analyticsScript = config.analytics?.enabled ? ADOBE_LAUNCH_SCRIPT : "";
  const faviconTag = config.faviconUrl ? `<link rel="shortcut icon" href="${config.faviconUrl}">` : "";
  const fontsTag = config.customFontsHref ? `<link rel="stylesheet" href="${config.customFontsHref}">` : "";

  return `<!doctype html>
<html lang="${langSubtag}" dir="${dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title></title>
${faviconTag}
${fontsTag}
<link rel="stylesheet" href="${fileNames.css}">
${CDN_SCRIPTS}
${analyticsScript}
</head>
<body data-variant="${variant}">
<div class="${isOc ? "container_oc" : "container"}">
<div class="top_cont"><p><span class="star">*</span><span id="requiredFieldNote"></span></p></div>
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
<script src="${fileNames.behaviorJs}"></script>
</body>
</html>
`;
}
