import { isRtlLangSubtag } from "@formbuilder/shared";

/** The HTML `dir` value for free-text content typed against a given locale
 * (e.g. `"ar_SA"`) — used so an RTL locale's text fields actually start
 * entry from the right edge with the cursor landing there, instead of
 * behaving like a plain left-to-right field with RTL characters just
 * flowing oddly inside it. Never apply this to URL fields (link URLs stay
 * LTR regardless of the surrounding locale). */
export function localeDir(code: string): "rtl" | "ltr" {
  const langSubtag = code.split("_")[0] ?? "";
  return isRtlLangSubtag(langSubtag) ? "rtl" : "ltr";
}
