import type { FormDefinition } from "../../form/formDefinition";
import type { FileNames } from "../fileNames";
import type { BuilderConfig, FormVariant } from "../types";
import { escapeHtml } from "../js/escaping";
import { renderProfileFields } from "./fragments/renderProfileField";
import { renderQuestionModule } from "./fragments/renderQuestionModule";

const CDN_SCRIPTS =
  '<script type="text/javascript" src="https://code.jquery.com/jquery-3.3.1.min.js"></script>\n' +
  '<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/parsleyjs@2/dist/parsley.min.js"></script>\n' +
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/libphonenumber-js/1.11.4/libphonenumber-js.min.js"></script>';

// Favicon/fonts are hardcoded to the reference's literal values (inert URLs, no
// executable behavior) rather than sourced from BuilderConfig — the generated
// FF.js/OC.js are byte-identical copies of the reference scripts, so the HTML they
// run against needs to be the reference's own markup, not a generic reskin.
//
// The Adobe Launch tag is different: it's Samsung's live production Adobe Experience
// Platform tag, tied to Samsung's own domain/config. Loading it unconditionally (as
// the reference's own HTML does) actively rewrites/clears the page in any browser
// that isn't Samsung's real site — confirmed by driving a generated form in a real
// browser, where it wiped the entire body down to an empty, display:none .container.
// So this stays opt-in via `config.analytics.enabled`, same as before — the FF.js/
// OC.js scripts already gate their own `_satellite.track(...)` calls on
// `param.analytics.enabled` from the data file, so leaving the tag out entirely when
// disabled doesn't leave any dangling reference to a script that was never loaded.
const FAVICON_TAG = '<link rel="shortcut icon" href="https://res6.mena2p.crm.samsung.com/res/tracking/Favicon.png">';
const FONTS_TAG = '<link rel="stylesheet" href="samsungSS_fonts_2026.css">';
const ADOBE_LAUNCH_SCRIPT =
  '<script src="https://assets.adobedtm.com/72afb75f5516/dd6b57adea42/launch-b679a712f5a6.min.js" async></script>';

// Terms & Conditions link — an empty-text-node anchor populated at runtime from
// `fields[language]["termsAndConditions"]`/`["termsAndConditionsLink"]` (see
// buildDataJs.ts and the reference scripts' own termsAndConditionsLink population
// block), same convention as privacyPolicyLink just below. Rendered only when
// `form.fields.termsAndConditions` is set — an unconfigured form shows no link at
// all rather than the previously-hardcoded, campaign-specific Samsung PDF link.
const termsLink = (form: FormDefinition, extraClass: string) =>
  form.fields.termsAndConditions
    ? `<a${extraClass ? ` class="${extraClass}"` : ""} style="text-align:center" href="#" target="_blank" id="termsAndConditionsLink">` +
      '<span></span><img class="form_bottom_img" src="blue_arr.png"></a>'
    : "";

/**
 * Renders the full page for either variant. Both FF and OC share the same overall
 * skeleton, question modules, and empty-text-node convention (the generated FF.js/OC.js
 * — byte-identical copies of the reference scripts — inject all text from the data file
 * at runtime) — they differ only in which profile fields appear, whether the OC-only
 * heading is present, and the submit-button container (inline `.form_bottom_group` vs.
 * OC's floating `.form_bottom_bar`).
 *
 * The page's `<html lang>`/`dir` are seeded from the form's own default locale, but
 * that's only a static starting point: the generated behavior JS resolves `var language
 * = frameUrlParam.get("lang") || param["fallbackLanguage"]` at runtime and re-sets
 * `dir` itself from whichever locale that resolves to (see the reference script's own
 * "HTML Direction (RTL/LTR)" block) — so this same one page correctly renders every
 * locale the form has, switched via a `?lang=<localeCode>` URL param, not a separate
 * HTML file per locale (see generate.ts's own doc comment for why there's no longer
 * one). Every piece of visible text is likewise an empty node filled at runtime from
 * the shared data.js/behavior JS, so the markup itself never varies by locale at all.
 */
export function renderPage(form: FormDefinition, config: BuilderConfig, variant: FormVariant, fileNames: FileNames): string {
  const isOc = variant === "oc";
  const analyticsScript = config.analytics?.enabled ? ADOBE_LAUNCH_SCRIPT : "";
  const localeInfo = form.locales.find((l) => l.code === form.meta.defaultLocale);
  const langSubtag = localeInfo?.langSubtag ?? "en";
  const dir = localeInfo?.isRtl ? "rtl" : "ltr";

  const profileFields = renderProfileFields(
    isOc
      ? {
          callingCode: form.fields.callingCode,
          countryCode: form.fields.countryCode,
          mobileNumber: form.fields.mobileNumber,
        }
      : {
          email: form.fields.email,
          firstName: form.fields.firstName,
          lastName: form.fields.lastName,
          countryCode: form.fields.countryCode,
          callingCode: form.fields.callingCode,
          mobileNumber: form.fields.mobileNumber,
        },
  );

  // visibleInVariants is a builder-only, additive concept (see formDefinition.ts) —
  // absent/undefined means "every variant", so Excel-sourced forms (which never set
  // it) render identically to before this existed. The reference FF.js/OC.js scripts
  // are entirely DOM-driven (they iterate whatever `.form_check_module` elements are
  // actually present), so simply not emitting a question's module here is enough —
  // no per-variant script changes needed.
  const questionsHtml = form.questions
    .filter((q) => !q.visibleInVariants || q.visibleInVariants.includes(variant))
    .map(renderQuestionModule)
    .join("");

  // Consent checkboxes. Each of the three consent-style fields is independently
  // configurable — which variant(s) it renders in, and whether checking it gates
  // Submit — the same way QuestionDefinition.visibleInVariants works, and "absent
  // means Full Form only, not required" preserves every existing form's behavior
  // exactly (that was the only behavior before these knobs existed). The reference
  // FF.js/OC.js scripts are entirely DOM-driven here: the checkbox-label/link
  // population loop, the required-consent Submit gate, and the change-event binding
  // all key off whatever `.form_bottom_check_group` + `.form_bottom_check` markup is
  // actually present (see enableDisableSubmit()'s generic scan in both scripts), so
  // rendering these for OC too — previously impossible, the reference's own OC
  // markup has this entire block commented out — needed no further script changes
  // beyond that one generic selector relaxation. mapParam()'s submission payload
  // separately needed a small generic addition (the "consentExtra" scan) so a
  // checked-but-unnamed-in-the-fixed-schema consent isn't silently dropped.
  const consentChecks: string[] = [];
  if (form.fields.privacyPolicy && (form.fields.privacyPolicy.visibleInVariants ?? ["ff"]).includes(variant)) {
    const star = form.fields.privacyPolicy.required !== false ? '<span class="star">*</span>' : "";
    consentChecks.push(
      '<div class="form_bottom_check">' +
        '<input id="privacyPolicy" name="privacyPolicy" type="checkbox" data-pt-api="y">' +
        '<label for="privacyPolicy"><span></span><br>' +
        `<a href="#" target="_blank" id="privacyPolicyLink"><span></span></a>${star}</label>` +
        "</div>",
    );
  }
  if (form.fields.marketingOptin && (form.fields.marketingOptin.visibleInVariants ?? ["ff"]).includes(variant)) {
    const star = form.fields.marketingOptin.required ? '<span class="star">*</span>' : "";
    consentChecks.push(
      '<div class="form_bottom_check form_bottom_check2">' +
        '<input id="subscribe" name="subscribe" type="checkbox" data-pt-api="y">' +
        `<label for="subscribe"><span></span>${star}</label>` +
        "</div>",
    );
  }
  if (form.fields.additionalConsents) {
    for (const consent of form.fields.additionalConsents) {
      if (!(consent.visibleInVariants ?? ["ff"]).includes(variant)) continue;
      const id = escapeHtml(consent.id);
      const link = consent.linkUrlByLocale ? `<br><a href="#" target="_blank" id="${id}Link"><span></span></a>` : "";
      const star = consent.required ? '<span class="star">*</span>' : "";
      consentChecks.push(
        '<div class="form_bottom_check form_bottom_check2">' +
          `<input id="${id}" name="${id}" type="checkbox" data-pt-api="y">` +
          `<label for="${id}"><span></span>${link}${star}</label>` +
          "</div>",
      );
    }
  }
  const privacyBlock = consentChecks.length > 0 ? `<div class="form_bottom_check_group">${consentChecks.join("")}</div>` : "";

  const submitBlock =
    '<button class="disabled" disabled id="btnSubmit"></button>' +
    '<div class="error" id="apiError" style="display:none"></div>' +
    termsLink(form, isOc ? "form_bottom_terms" : "");

  // OC's floating form_bottom_bar has no room for the consent group inside it (it's
  // a fixed-position bar with just the submit button/terms link — see reference
  // CSS), so when any consent renders for OC it sits as its own sibling block
  // immediately before the bar, mirroring where the reference's own (permanently
  // commented-out) OC consent markup sits relative to it.
  const bottomGroup = isOc
    ? `${privacyBlock}<div class="form_bottom_bar" id="formBottomBar">${submitBlock}</div>`
    : `<div class="form_bottom_group">${privacyBlock}${submitBlock}</div>`;

  const topHeading = '<h2><br class="b_850"><span></span></h2>';
  const topSubheading = '<p class="top_subheading"></p>';

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
${analyticsScript}
</head>
<body>
<div class="${isOc ? "container_oc" : "container"}">
<div class="top_cont">${topHeading}${topSubheading}<p><span class="star">*</span><span id="requiredFieldNote"></span></p></div>
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
