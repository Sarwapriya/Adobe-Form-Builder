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
  countryCode: string; // ISO-3166 alpha-2
  callingCode: string; // without leading "+"
  countryName: string;
  mobileDigits: number; // expected local mobile-number digit count (excluding calling code)
}

export const CALLING_CODES: readonly CallingCodeEntry[] = [
  { countryCode: "AE", callingCode: "971", countryName: "United Arab Emirates", mobileDigits: 9 },
  { countryCode: "SA", callingCode: "966", countryName: "Saudi Arabia", mobileDigits: 9 },
  { countryCode: "EG", callingCode: "20", countryName: "Egypt", mobileDigits: 10 },
  { countryCode: "IL", callingCode: "972", countryName: "Israel", mobileDigits: 9 },
  { countryCode: "PS", callingCode: "970", countryName: "Palestine", mobileDigits: 9 },
  { countryCode: "TR", callingCode: "90", countryName: "Turkey", mobileDigits: 10 },
  { countryCode: "JO", callingCode: "962", countryName: "Jordan", mobileDigits: 9 },
  { countryCode: "LB", callingCode: "961", countryName: "Lebanon", mobileDigits: 8 },
  { countryCode: "IQ", callingCode: "964", countryName: "Iraq", mobileDigits: 10 },
  { countryCode: "KW", callingCode: "965", countryName: "Kuwait", mobileDigits: 8 },
  { countryCode: "QA", callingCode: "974", countryName: "Qatar", mobileDigits: 8 },
  { countryCode: "BH", callingCode: "973", countryName: "Bahrain", mobileDigits: 8 },
  { countryCode: "OM", callingCode: "968", countryName: "Oman", mobileDigits: 8 },
  { countryCode: "GB", callingCode: "44", countryName: "United Kingdom", mobileDigits: 10 },
  { countryCode: "US", callingCode: "1", countryName: "United States", mobileDigits: 10 },
  { countryCode: "FR", callingCode: "33", countryName: "France", mobileDigits: 9 },
  { countryCode: "DE", callingCode: "49", countryName: "Germany", mobileDigits: 10 },
  { countryCode: "IN", callingCode: "91", countryName: "India", mobileDigits: 10 },
  { countryCode: "PK", callingCode: "92", countryName: "Pakistan", mobileDigits: 10 },
];

export function findCallingCodeEntry(countryCode: string): CallingCodeEntry | undefined {
  return CALLING_CODES.find((c) => c.countryCode === countryCode.toUpperCase());
}
