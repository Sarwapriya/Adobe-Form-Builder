"""Port of packages/shared/src/codegen/css/buildStyleCss.ts."""

from __future__ import annotations

from .file_names import FileNames
from .reference_css import REFERENCE_CSS as _REFERENCE_CSS
from .types import GeneratedFile

# Language-specific font family overrides. The base CSS uses the English font
# families; this block switches to the correct Arabic/Hebrew variants based on
# the `dir` attribute.
_FONT_OVERRIDES = """
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
"""

# The reference stylesheet has zero real RTL handling (only an incidental,
# unrelated `direction: rtl` on one popup icon) despite the spec requiring
# proper Arabic/Hebrew support. This block is new.
_RTL_OVERRIDES = """
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
"""

# The reference stylesheet sets `body, html { color: #000; }` but never an
# explicit `background-color` — see buildStyleCss.ts's own doc comment for why
# this pins both explicitly rather than relying on the UA default.
_COLOR_SCHEME_OVERRIDE = """
/* --- Fixed light appearance (not present in the reference stylesheet) --- */
html,
body {
  background-color: #fff;
  color-scheme: light;
}
"""

# `.top_subheading` (the builder's campaign-subheading field) is new markup
# with no reference-CSS counterpart.
_SUBHEADING_OVERRIDES = """
/* --- Campaign subheading (not present in the reference stylesheet) --- */
.top_cont .top_subheading {
  margin: 4px 0 12px;
}

.top_cont .top_subheading:empty {
  display: none;
}
"""


def build_style_css(file_names: FileNames) -> GeneratedFile:
    contents = f"{_REFERENCE_CSS}\n{_COLOR_SCHEME_OVERRIDE}\n{_FONT_OVERRIDES}\n{_RTL_OVERRIDES}\n{_SUBHEADING_OVERRIDES}"
    return GeneratedFile(path=file_names.css, contents=contents)
