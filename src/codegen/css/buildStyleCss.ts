import type { FileNames } from "../fileNames.ts";
import type { GeneratedFile } from "../types.ts";
// The reference CSS, copied near-verbatim (same class names, layout, and responsive
// breakpoints) with its dangling asset references already patched to inline data-URI
// SVGs (see reference.css, the human-readable source this .ts module is generated
// from) — the reference pointed at absolute AEM paths and bare cancel.png/checked.png
// files that don't exist anywhere in this repo and would 404 in a standalone form.
import { REFERENCE_CSS as referenceCss } from "./referenceCssContent.ts";

/**
 * Language-specific font family overrides. The base CSS uses the English font
 * families; this block switches to the correct Arabic/Hebrew variants based on
 * the `dir` attribute.
 */
const FONT_OVERRIDES = `
/* --- Language-specific font overrides --- */

/* Arabic font overrides */
[dir="rtl"] body,
[dir="rtl"] html,
[dir="rtl"] .top_cont h2,
[dir="rtl"] .top_cont p,
[dir="rtl"] .form_top_group,
[dir="rtl"] .form_top_group input,
[dir="rtl"] .form_top_group select,
[dir="rtl"] .form_check_title h3,
[dir="rtl"] .form_bottom_group button,
[dir="rtl"] .form_bottom_bar button,
[dir="rtl"] #hrTy,
[dir="rtl"] #hrTy h3,
[dir="rtl"] .popup__title,
[dir="rtl"] .popup__desc,
[dir="rtl"] .popup--alert .cta,
[dir="rtl"] .fullform-submit-intent-popup .popup__contents,
[dir="rtl"] .fullform-submit-intent-popup .cta {
  font-family: 'SamsungSS Head Light Arabic', 'SamsungSS Body Regular Arabic', 'SamsungSS Head Bold Arabic', 'SamsungSS Body Bold Arabic', arial, sans-serif !important;
}

/* Hebrew font overrides */
[dir="rtl"][lang="he"] body,
[dir="rtl"][lang="he"] html,
[dir="rtl"][lang="he"] .top_cont h2,
[dir="rtl"][lang="he"] .top_cont p,
[dir="rtl"][lang="he"] .form_top_group,
[dir="rtl"][lang="he"] .form_top_group input,
[dir="rtl"][lang="he"] .form_top_group select,
[dir="rtl"][lang="he"] .form_check_title h3,
[dir="rtl"][lang="he"] .form_bottom_group button,
[dir="rtl"][lang="he"] .form_bottom_bar button,
[dir="rtl"][lang="he"] #hrTy,
[dir="rtl"][lang="he"] #hrTy h3,
[dir="rtl"][lang="he"] .popup__title,
[dir="rtl"][lang="he"] .popup__desc,
[dir="rtl"][lang="he"] .popup--alert .cta,
[dir="rtl"][lang="he"] .fullform-submit-intent-popup .popup__contents,
[dir="rtl"][lang="he"] .fullform-submit-intent-popup .cta {
  font-family: 'SamsungSS Head Light Hebrew', 'SamsungSS Body Regular Hebrew', 'SamsungSS Head Bold Hebrew', 'SamsungSS Body Bold Hebrew', arial, sans-serif !important;
}
`;

/**
 * The reference stylesheet has zero real RTL handling (only an incidental, unrelated
 * `direction: rtl` on one popup icon) despite the spec requiring proper Arabic/Hebrew
 * support. This block is new: CSS logical properties handle most of the flip for free,
 * plus a small `[dir="rtl"]` override section for the handful of physically-positioned
 * properties (icon offsets, checkbox marker position) that don't have a logical form
 * already baked into the copied rules above.
 */
const RTL_OVERRIDES = `
/* --- RTL support (not present in the reference stylesheet) --- */
[dir="rtl"] {
  text-align: right;
}

[dir="rtl"] .form_check_title,
[dir="rtl"] .form_label {
  text-align: right;
}

[dir="rtl"] .form_bottom_check label {
  padding-left: 0;
  padding-right: 32px;
}

[dir="rtl"] .form_bottom_check label::after {
  left: auto;
  right: 0;
}

[dir="rtl"] .input_wrap .btn_clear {
  right: auto;
  left: 8px;
}

[dir="rtl"] .form_bottom_bar {
  direction: rtl;
}

/* --- Thank-you / error full-page states (the reference styled these two blocks with
   inline style="" attributes directly in its HTML; this generator keeps markup free of
   inline styles, so the equivalent rules live here instead) --- */
#hrTy,
#hrErr {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  margin: 0 auto;
  max-width: 480px;
  padding: 24px;
  text-align: center;
}

#hrTy h3,
#hrErr h3 {
  color: #000;
  font-family: "SamsungSS Head Bold", arial, sans-serif;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.5;
  margin: 0 0 10px;
}

#hrTy p,
#hrErr p {
  color: #000;
  font-size: 16px;
  line-height: 1.5;
  margin: 0 0 15px;
}

#hrTy a,
#hrErr a {
  color: #007bff;
}
`;

export function buildStyleCss(fileNames: FileNames): GeneratedFile {
  return { path: fileNames.css, contents: `${referenceCss}\n${FONT_OVERRIDES}\n${RTL_OVERRIDES}` };
}
