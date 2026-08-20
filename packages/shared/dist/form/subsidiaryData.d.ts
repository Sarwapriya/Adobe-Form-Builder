/**
 * Samsung org-specific subsidiary routing data, extracted verbatim from the reference
 * implementation's `country_subsidiary` / `subsidiary_detail` tables in
 * `Final_forms_format/SGE-EN_F2H26.js` (mechanically extracted, not hand-transcribed,
 * to guarantee parity with that file).
 *
 * `COUNTRY_SUBSIDIARY` maps an ISO-3166 alpha-2 country code to the Samsung subsidiary
 * code that serves it. `SUBSIDIARY_DETAIL` maps a subsidiary code to the list of
 * countries (calling code + country code + localized country name) that its generated
 * forms offer in the countryCode/callingCode dropdowns. The reference source only ships
 * `SUBSIDIARY_DETAIL` entries for the subsidiaries relevant to its own MENA-region
 * campaign family, not all ~60 subsidiary codes referenced by `COUNTRY_SUBSIDIARY`.
 *
 * Selecting a subsidiary code in the builder (Configure step) drives the generated
 * form's countryCode/callingCode dropdown contents from `SUBSIDIARY_DETAIL` instead of
 * the generic `CALLING_CODES` table in `callingCodes.ts` (which remains the default
 * when no subsidiary is selected).
 */
export interface SubsidiaryCountryEntry {
    callingCode: string;
    countryCode: string;
    /** Keyed by combined locale identifier as used in the reference (e.g. "en_AE", "ar_BH"). */
    countryName: Record<string, string>;
}
export declare const COUNTRY_SUBSIDIARY: Readonly<Record<string, string>>;
export declare const SUBSIDIARY_DETAIL: Readonly<Record<string, readonly SubsidiaryCountryEntry[]>>;
export declare const SUBSIDIARY_CODES: readonly string[];
/**
 * Resolves a subsidiary country's localized name for a generated form's locale. The
 * reference's `countryName` maps are keyed by every locale identifier the *subsidiary*
 * supports (e.g. SGE spans ar/en x AE/BH/KW/OM/QA — 10 keys), which is usually a
 * superset of the specific form's own `locales`, so exact match is the common case;
 * the language-subtag and English fallbacks below only matter for combinations the
 * reference itself never anticipated.
 */
export declare function resolveSubsidiaryCountryName(countryName: Record<string, string>, locale: string, defaultLocale: string): string;
/**
 * Resolves a display name for a country code in a given locale — the one piece of
 * `subsidiaryData.ts` a builder-authored `fields.mobileNumber` field needs (unlike
 * Excel-sourced/real-subsidiary forms, which already get real per-locale names via
 * `SUBSIDIARY_DETAIL` directly). Real Samsung translations (this file's own reference
 * data, ultimately sourced from `Final_forms_format`'s master `subsidiary_detail`
 * tables) take priority when available for this country; otherwise falls back to the
 * generic English-only `CALLING_CODES` table, then the raw code itself as a last
 * resort. Used by codegen's `buildBuilderSubsidiaryTables` (so the generated form's own
 * dropdown shows translated names) and by the builder UI's country picker (so admin/
 * subsidiary users see what they're picking while translating into another locale). */
export declare function resolveCountryName(countryCode: string, locale: string, defaultLocale: string): string;
/**
 * The ISO-3166 country codes a given Samsung subsidiary's own generated forms offer in
 * their countryCode/callingCode dropdown, per `SUBSIDIARY_DETAIL`. Lets a builder-authored
 * `fields.mobileNumber` field restrict its "Countries" picker to just the subsidiary the
 * form actually belongs to, instead of the full generic `CALLING_CODES` list — mirroring
 * what an Excel-sourced form for that same subsidiary would already show. Empty when the
 * subsidiary code isn't one of the ones this repo has real reference data for (see
 * `STUB_SUBSIDIARY_DETAIL`) — callers should fall back to `CALLING_CODES`'s full list in
 * that case rather than leaving the picker with no options at all. */
export declare function subsidiaryCountryCodes(subsidiaryCode: string): string[];
