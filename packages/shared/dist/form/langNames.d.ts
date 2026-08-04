import type { LangSubtag } from "./formDefinition";
/** Language subtags that render right-to-left. The reference implementation has no
 * RTL handling at all (only ever sets `lang`, never `dir`) — this list is new logic. */
export declare const RTL_LANGS: readonly LangSubtag[];
export declare function isRtlLangSubtag(langSubtag: LangSubtag): boolean;
/** Best-effort display name for a language subtag; falls back to the subtag itself
 * (upper-cased) so an unrecognized language still gets a usable label instead of
 * silently being dropped from the builder UI's language selector. */
export declare function langDisplayName(langSubtag: LangSubtag): string;
