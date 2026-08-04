/**
 * A small, generic ISO-3166 + calling-code table bundled with the builder.
 *
 * This is the *default* countryCode/callingCode dropdown source, used whenever the
 * builder user hasn't selected a Samsung subsidiary code in the Configure step. The
 * reference implementation's Samsung-org-specific `country_subsidiary`/`subsidiary_detail`
 * tables (`Final_forms_format/SGE-EN_F2H26.js`) are transcribed separately in
 * `subsidiaryData.ts` and take over the dropdown contents once a subsidiary is selected
 * — see `codegen/js/buildDataJs.ts`.
 *
 * `mobileDigits` also replaces the reference's hardcoded `mobileNumberByCountry`
 * validator, which special-cased UAE=9 digits vs. everything else=8 digits — that rule
 * is made data-driven per country here instead, and is reused as a lookup (with the
 * reference's UAE=9/else=8 rule as fallback) for subsidiary-driven entries too.
 */
export interface CallingCodeEntry {
    countryCode: string;
    callingCode: string;
    countryName: string;
    mobileDigits: number;
}
export declare const CALLING_CODES: readonly CallingCodeEntry[];
export declare function findCallingCodeEntry(countryCode: string): CallingCodeEntry | undefined;
