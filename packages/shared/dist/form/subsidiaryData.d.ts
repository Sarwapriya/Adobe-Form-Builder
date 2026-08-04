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
