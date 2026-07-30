import type { GeneratedFile } from "../types.ts";
// The reference CSS, copied near-verbatim (same class names, layout, and responsive
// breakpoints) with its dangling asset references already patched to inline data-URI
// SVGs (see reference.css, the human-readable source this .ts module is generated
// from) — the reference pointed at absolute AEM paths and bare cancel.png/checked.png
// files that don't exist anywhere in this repo and would 404 in a standalone form.
import { REFERENCE_CSS as referenceCss } from "./referenceCssContent.ts";

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

export function buildStyleCss(): GeneratedFile {
  return { path: "style.css", contents: `${referenceCss}\n${RTL_OVERRIDES}` };
}
