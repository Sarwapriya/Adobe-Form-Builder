import type { LangSubtag } from "./formDefinition";

/** Language subtags that render right-to-left. The reference implementation has no
 * RTL handling at all (only ever sets `lang`, never `dir`) — this list is new logic. */
export const RTL_LANGS: readonly LangSubtag[] = ["ar", "he", "ku", "fa", "ur", "yi"];

export function isRtlLangSubtag(langSubtag: LangSubtag): boolean {
  return RTL_LANGS.includes(langSubtag.toLowerCase());
}

const DISPLAY_NAMES: Record<LangSubtag, string> = {
  en: "English",
  ar: "Arabic",
  he: "Hebrew",
  ku: "Kurdish",
  tr: "Turkish",
  fa: "Persian",
  ur: "Urdu",
  yi: "Yiddish",
  fr: "French",
  es: "Spanish",
  de: "German",
  ru: "Russian",
  zh: "Chinese",
};

/** Best-effort display name for a language subtag; falls back to the subtag itself
 * (upper-cased) so an unrecognized language still gets a usable label instead of
 * silently being dropped from the builder UI's language selector. */
export function langDisplayName(langSubtag: LangSubtag): string {
  return DISPLAY_NAMES[langSubtag.toLowerCase()] ?? langSubtag.toUpperCase();
}
