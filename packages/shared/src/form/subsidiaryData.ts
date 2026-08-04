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

export const COUNTRY_SUBSIDIARY: Readonly<Record<string, string>> = {
  "AB": "SIEL",
  "AC": "SCA",
  "AD": "SEIB",
  "AE": "SGE",
  "AF": "SEPAK",
  "AG": "SELA",
  "AI": "SELA",
  "AL": "SEAD",
  "AM": "SERC",
  "AN": "SEDA",
  "AO": "SSA",
  "AQ": "SSA",
  "AR": "SEASA",
  "AS": "SENZ",
  "AT": "SEAS",
  "AU": "SEAU",
  "AW": "SELA",
  "AX": "SENA",
  "AZ": "SERC",
  "BA": "SEAD",
  "BB": "SELA",
  "BD": "BANGLADESH",
  "BE": "SEBN",
  "BF": "SCA",
  "BG": "SEROM",
  "BH": "SGE",
  "BI": "SEEA",
  "BJ": "SCA",
  "BL": "SELA",
  "BM": "SELA",
  "BN": "SESP",
  "BO": "SECH",
  "BQ": "SELA",
  "BR": "SEDA",
  "BS": "SELA",
  "BT": "SIEL",
  "BV": "SEASA",
  "BW": "SSA",
  "BY": "SERC",
  "BZ": "SELA",
  "CA": "SECA",
  "CC": "SIEL",
  "CD": "SEEA",
  "CF": "SCA",
  "CG": "SCA",
  "CH": "SEAS",
  "CI": "SCA",
  "CK": "SENZ",
  "CL": "SECH",
  "CM": "SCA",
  "CO": "SAMCOL",
  "CR": "SELA",
  "CU": "SELA",
  "CV": "SCA",
  "CW": "SELA",
  "CX": "SIEL",
  "CY": "SEGR",
  "CZ": "SECZ",
  "DE": "SEG",
  "DG": "SIEL",
  "DJ": "SEEA",
  "DK": "SENA",
  "DM": "SELA",
  "DO": "SELA",
  "DZ": "SEMAG",
  "EC": "SELA",
  "EE": "SEB",
  "EG": "SEEG",
  "EH": "SESAR",
  "ER": "SEEA",
  "ES": "SEIB",
  "ET": "SEEA",
  "FD": "SEF",
  "FI": "SENA",
  "FJ": "SENZ",
  "FK": "SEUK",
  "FM": "SENZ",
  "FO": "SENA",
  "FR": "SEF",
  "GA": "SCA",
  "GB": "SEUK",
  "GD": "SELA",
  "GE": "SERC",
  "GF": "SEF",
  "GG": "SEUK",
  "GH": "SCA",
  "GI": "SEIB",
  "GL": "SENA",
  "GM": "SCA",
  "GN": "SCA",
  "GP": "SELA",
  "GQ": "SCA",
  "GR": "SEGR",
  "GS": "SEDA",
  "GT": "SELA",
  "GU": "SEAU",
  "GW": "SCA",
  "GY": "SELA",
  "HK": "SEHK",
  "HM": "SEAU",
  "HN": "SELA",
  "HR": "SEAD",
  "HT": "SELA",
  "HU": "SEH",
  "ID": "SEIN",
  "IE": "SEUK",
  "IL": "SEIL",
  "IM": "SEUK",
  "IN": "SIEL",
  "IO": "SIEL",
  "IQ": "SELV",
  "IR": "IRAN",
  "IS": "SENA",
  "IT": "SEI",
  "JE": "SEUK",
  "JM": "SELA",
  "JO": "SELV",
  "JP": "SEJ",
  "KE": "SEEA",
  "KG": "SECE",
  "KH": "TSE",
  "KI": "SENZ",
  "KM": "SSA",
  "KN": "SELA",
  "KW": "SGE",
  "KY": "SELA",
  "KZ": "SECE",
  "LA": "TSE",
  "LB": "SELV",
  "LC": "SELA",
  "LI": "SEAS",
  "LK": "SRI LANKA",
  "LR": "SCA",
  "LS": "SSA",
  "LT": "SEB",
  "LU": "SEBN",
  "LV": "SEB",
  "LY": "SEMAG",
  "MA": "SEMAG",
  "MC": "SEF",
  "MD": "SEUC",
  "ME": "SEAD",
  "MF": "SELA",
  "MG": "SSA",
  "MH": "SENZ",
  "MK": "SEAD",
  "ML": "SCA",
  "MM": "TSE",
  "MN": "SECE",
  "MO": "SEHK",
  "MP": "SEAU",
  "MQ": "SELA",
  "MR": "SCA",
  "MS": "SELA",
  "MT": "SEI",
  "MU": "SSA",
  "MV": "SRI LANKA",
  "MW": "SSA",
  "MX": "SEM",
  "MY": "SME",
  "MZ": "SSA",
  "NA": "SSA",
  "NC": "SENZ",
  "NE": "SCA",
  "NF": "SEAU",
  "NG": "SCA",
  "NI": "SELA",
  "NL": "SEBN",
  "NO": "SENA",
  "NP": "NEPAL",
  "NR": "SEAU",
  "NU": "SENZ",
  "NZ": "SENZ",
  "OM": "SGE",
  "PA": "SELA",
  "PE": "SEPR",
  "PF": "SENZ",
  "PG": "SENZ",
  "PH": "SEPCO",
  "PK": "SEPAK",
  "PL": "SEPOL",
  "PM": "SEF",
  "PN": "SEAU",
  "PR": "SELA",
  "PS": "SEIL",
  "PT": "SEIB",
  "PW": "SEPCO",
  "PY": "SELA",
  "QA": "SGE",
  "RE": "SSA",
  "RO": "SEROM",
  "RS": "SEAD",
  "RU": "SERC",
  "RW": "SEEA",
  "SA": "SESAR",
  "SB": "SENZ",
  "SC": "SEEA",
  "SD": "SEEA",
  "SE": "SENA",
  "SG": "SESP",
  "SH": "SEUK",
  "SI": "SEAD",
  "SJ": "SENA",
  "SK": "SECZ",
  "SL": "SCA",
  "SM": "SEI",
  "SN": "SCA",
  "SO": "SEEA",
  "SR": "SELA",
  "SS": "SEEA",
  "ST": "SCA",
  "SV": "SELA",
  "SX": "SELA",
  "SY": "SELV",
  "SZ": "SSA",
  "TC": "SELA",
  "TD": "SCA",
  "TF": "SEAU",
  "TG": "SCA",
  "TH": "TSE",
  "TJ": "SECE",
  "TK": "SEAU",
  "TL": "SEIN",
  "TM": "SECE",
  "TN": "SEMAG",
  "TO": "SENZ",
  "TR": "SETK",
  "TT": "SELA",
  "TV": "SENZ",
  "TW": "SET",
  "TZ": "SEEA",
  "UA": "SEUC",
  "UG": "SEEA",
  "UK": "SEUK",
  "UY": "SELA",
  "UZ": "SEUZ",
  "VA": "SEI",
  "VE": "SELA",
  "VG": "SELA",
  "VI": "SEDA",
  "VN": "SAVINA",
  "VU": "SENZ",
  "WF": "SEAU",
  "WS": "SENZ",
  "YE": "SGE",
  "YT": "SSA",
  "YU": "SEAD",
  "ZA": "SSA",
  "ZM": "SSA",
  "ZW": "SSA"
};

/** The reference source's own `subsidiary_detail` — only the 11 subsidiaries relevant
 * to its MENA campaign family, extracted verbatim (see `SUBSIDIARY_DETAIL` below for
 * why the other 43 `COUNTRY_SUBSIDIARY` values need stub entries added on top of this). */
const REFERENCE_SUBSIDIARY_DETAIL: Readonly<Record<string, readonly SubsidiaryCountryEntry[]>> = {
  "IRAN": [
    {
      "callingCode": "98",
      "countryCode": "IR",
      "countryName": {
        "en_GB": "Iran",
        "fr_FR": "Iran"
      }
    }
  ],
  "SCA": [
    {
      "callingCode": "247",
      "countryCode": "AC",
      "countryName": {
        "en_GB": "Ascension Island",
        "fr_FR": "Île de l'Ascension"
      }
    },
    {
      "callingCode": "229",
      "countryCode": "BJ",
      "countryName": {
        "en_GB": "Benin",
        "fr_FR": "Bénin"
      }
    },
    {
      "callingCode": "226",
      "countryCode": "BF",
      "countryName": {
        "en_GB": "Burkina Faso",
        "fr_FR": "Burkina Faso"
      }
    },
    {
      "callingCode": "237",
      "countryCode": "CM",
      "countryName": {
        "en_GB": "Cameroon",
        "fr_FR": "Cameroun"
      }
    },
    {
      "callingCode": "238",
      "countryCode": "CV",
      "countryName": {
        "en_GB": "Cape Verde",
        "fr_FR": "Cap-Vert"
      }
    },
    {
      "callingCode": "236",
      "countryCode": "CF",
      "countryName": {
        "en_GB": "Central African Republic",
        "fr_FR": "République centrafricaine"
      }
    },
    {
      "callingCode": "235",
      "countryCode": "TD",
      "countryName": {
        "en_GB": "Chad",
        "fr_FR": "Tchad"
      }
    },
    {
      "callingCode": "225",
      "countryCode": "CI",
      "countryName": {
        "en_GB": "Côte d'Ivoire",
        "fr_FR": "Côte d'Ivoire"
      }
    },
    {
      "callingCode": "240",
      "countryCode": "GQ",
      "countryName": {
        "en_GB": "Equatorial Guin",
        "fr_FR": "Guinée équatoriale"
      }
    },
    {
      "callingCode": "241",
      "countryCode": "GA",
      "countryName": {
        "en_GB": "Gabon",
        "fr_FR": "Gabon"
      }
    },
    {
      "callingCode": "220",
      "countryCode": "GM",
      "countryName": {
        "en_GB": "Gambia",
        "fr_FR": "Gambie"
      }
    },
    {
      "callingCode": "233",
      "countryCode": "GH",
      "countryName": {
        "en_GB": "Ghana",
        "fr_FR": "Ghana"
      }
    },
    {
      "callingCode": "224",
      "countryCode": "GN",
      "countryName": {
        "en_GB": "Guinea",
        "fr_FR": "Guinée"
      }
    },
    {
      "callingCode": "245",
      "countryCode": "GW",
      "countryName": {
        "en_GB": "Guinea-Bissau",
        "fr_FR": "Guinée-Bissau"
      }
    },
    {
      "callingCode": "231",
      "countryCode": "LR",
      "countryName": {
        "en_GB": "Liberia",
        "fr_FR": "Libéria"
      }
    },
    {
      "callingCode": "223",
      "countryCode": "ML",
      "countryName": {
        "en_GB": "Mali",
        "fr_FR": "Mali"
      }
    },
    {
      "callingCode": "222",
      "countryCode": "MR",
      "countryName": {
        "en_GB": "Mauretania",
        "fr_FR": "Mauritanie"
      }
    },
    {
      "callingCode": "227",
      "countryCode": "NE",
      "countryName": {
        "en_GB": "Niger",
        "fr_FR": "Niger"
      }
    },
    {
      "callingCode": "234",
      "countryCode": "NG",
      "countryName": {
        "en_GB": "Nigeria",
        "fr_FR": "Nigéria"
      }
    },
    {
      "callingCode": "242",
      "countryCode": "CG",
      "countryName": {
        "en_GB": "Republic of Congo",
        "fr_FR": "République du Congo"
      }
    },
    {
      "callingCode": "239",
      "countryCode": "ST",
      "countryName": {
        "en_GB": "São Tomé and Príncipe",
        "fr_FR": "São Tomé-et-Principe"
      }
    },
    {
      "callingCode": "221",
      "countryCode": "SN",
      "countryName": {
        "en_GB": "Senegal",
        "fr_FR": "Sénégal"
      }
    },
    {
      "callingCode": "232",
      "countryCode": "SL",
      "countryName": {
        "en_GB": "Sierra Leone",
        "fr_FR": "Sierra Leone"
      }
    },
    {
      "callingCode": "228",
      "countryCode": "TG",
      "countryName": {
        "en_GB": "Togo",
        "fr_FR": "Togo"
      }
    }
  ],
  "SEEG": [
    {
      "callingCode": "20",
      "countryCode": "EG",
      "countryName": {
        "en_GB": "Egypt",
        "fr_FR": "Egypte"
      }
    }
  ],
  "SEIL": [
    {
      "callingCode": "972",
      "countryCode": "IL",
      "countryName": {
        "en_GB": "Israel",
        "fr_FR": "Israël"
      }
    },
    {
      "callingCode": "970",
      "countryCode": "PS",
      "countryName": {
        "en_GB": "Palestine",
        "fr_FR": "Palestine"
      }
    }
  ],
  "SELV": [
    {
      "callingCode": "964",
      "countryCode": "IQ",
      "countryName": {
        "en_GB": "Iraq",
        "fr_FR": "Irak"
      }
    },
    {
      "callingCode": "962",
      "countryCode": "JO",
      "countryName": {
        "en_GB": "Jordan",
        "fr_FR": "Jordanie"
      }
    },
    {
      "callingCode": "961",
      "countryCode": "LB",
      "countryName": {
        "en_GB": "Lebanon",
        "fr_FR": "Liban"
      }
    },
    {
      "callingCode": "963",
      "countryCode": "SY",
      "countryName": {
        "en_GB": "Syria",
        "fr_FR": "Syrie"
      }
    }
  ],
  "SEMAG": [
    {
      "callingCode": "213",
      "countryCode": "DZ",
      "countryName": {
        "en_GB": "Algeria",
        "fr_FR": "Algérie"
      }
    },
    {
      "callingCode": "218",
      "countryCode": "LY",
      "countryName": {
        "en_GB": "Libya",
        "fr_FR": "Libye"
      }
    },
    {
      "callingCode": "212",
      "countryCode": "MA",
      "countryName": {
        "en_GB": "Morocco",
        "fr_FR": "Maroc"
      }
    },
    {
      "callingCode": "216",
      "countryCode": "TN",
      "countryName": {
        "en_GB": "Tunisia",
        "fr_FR": "Tunisie"
      }
    }
  ],
  "SEPAK": [
    {
      "callingCode": "93",
      "countryCode": "AF",
      "countryName": {
        "en_GB": "Afghanistan",
        "fr_FR": "Afghanistan"
      }
    },
    {
      "callingCode": "92",
      "countryCode": "PK",
      "countryName": {
        "en_GB": "Pakistan",
        "fr_FR": "Pakistan"
      }
    }
  ],
  "SESAR": [
    {
      "callingCode": "966",
      "countryCode": "SA",
      "countryName": {
        "en_GB": "Saudi Arabia",
        "fr_FR": "Arabie saoudite"
      }
    },
    {
      "callingCode": "212",
      "countryCode": "EH",
      "countryName": {
        "en_GB": "Western Sahara",
        "fr_FR": "Sahara occidental"
      }
    }
  ],
  "SETK": [
    {
      "callingCode": "90",
      "countryCode": "TR",
      "countryName": {
        "en_GB": "Türkiye",
        "fr_FR": "Turquie"
      }
    }
  ],
  "SGE": [
    {
      "callingCode": "971",
      "countryCode": "AE",
      "countryName": {
        "ar_BH": "الإمَارَات",
        "en_BH": "United Arab Emirates",
        "ar_KW": "الإمَارَات",
        "en_KW": "United Arab Emirates",
        "ar_OM": "الإمَارَات",
        "en_OM": "United Arab Emirates",
        "ar_QA": "الإمَارَات",
        "en_QA": "United Arab Emirates",
        "ar_AE": "الإمَارَات",
        "en_AE": "United Arab Emirates"
      }
    },
    {
      "callingCode": "973",
      "countryCode": "BH",
      "countryName": {
        "ar_AE": "البحرين",
        "en_AE": "Bahrain",
        "ar_BH": "البحرين",
        "en_BH": "Bahrain",
        "ar_KW": "البحرين",
        "en_KW": "Bahrain",
        "ar_OM": "البحرين",
        "en_OM": "Bahrain",
        "ar_QA": "البحرين",
        "en_QA": "Bahrain"
      }
    },
    {
      "callingCode": "965",
      "countryCode": "KW",
      "countryName": {
        "ar_BH": "الكويت",
        "en_BH": "Kuwait",
        "ar_KW": "الكويت",
        "en_KW": "Kuwait",
        "ar_OM": "الكويت",
        "en_OM": "Kuwait",
        "ar_QA": "الكويت",
        "en_QA": "Kuwait",
        "ar_AE": "الكويت",
        "en_AE": "Kuwait"
      }
    },
    {
      "callingCode": "968",
      "countryCode": "OM",
      "countryName": {
        "ar_BH": "عُمان",
        "en_BH": "Oman",
        "ar_KW": "عُمان",
        "en_KW": "Oman",
        "ar_OM": "عُمان",
        "en_OM": "Oman",
        "ar_QA": "عُمان",
        "en_QA": "Oman",
        "ar_AE": "عُمان",
        "en_AE": "Oman"
      }
    },
    {
      "callingCode": "974",
      "countryCode": "QA",
      "countryName": {
        "ar_BH": "قطر",
        "en_BH": "Qatar",
        "ar_KW": "قطر",
        "en_KW": "Qatar",
        "ar_OM": "قطر",
        "en_OM": "Qatar",
        "ar_QA": "قطر",
        "en_QA": "Qatar",
        "ar_AE": "قطر",
        "en_AE": "Qatar"
      }
    }
  ],
  "SIEL": [
    {
      "callingCode": "",
      "countryCode": "AB",
      "countryName": {
        "en_GB": "Abkhazia",
        "fr_FR": "Abkhazie"
      }
    },
    {
      "callingCode": "975",
      "countryCode": "BT",
      "countryName": {
        "en_GB": "Bhutan",
        "fr_FR": "Bhoutan"
      }
    },
    {
      "callingCode": "246",
      "countryCode": "IO",
      "countryName": {
        "en_GB": "British Indian Ocean Territory",
        "fr_FR": "Territoire britannique de l'océan Indien"
      }
    },
    {
      "callingCode": "61",
      "countryCode": "CX",
      "countryName": {
        "en_GB": "Christmas Island",
        "fr_FR": "Île Christmas"
      }
    },
    {
      "callingCode": "61",
      "countryCode": "CC",
      "countryName": {
        "en_GB": "Cocos Islands",
        "fr_FR": "Îles Cocos"
      }
    },
    {
      "callingCode": "246",
      "countryCode": "DG",
      "countryName": {
        "en_GB": "Diego Garcia",
        "fr_FR": "Diego García"
      }
    },
    {
      "callingCode": "91",
      "countryCode": "IN",
      "countryName": {
        "en_GB": "India",
        "fr_FR": "Inde"
      }
    }
  ]
};

/**
 * `COUNTRY_SUBSIDIARY` references 54 distinct subsidiary codes; `REFERENCE_SUBSIDIARY_DETAIL`
 * only covers 11 of them. The reference's own `populateCountryCodeDropdown()` (in the
 * byte-identical FF.js) does `subsidiary_detail[subsidiary].length` with no guard — so
 * for any locale whose country resolves to one of the other 43 subsidiaries,
 * `subsidiary_detail[...]` would be `undefined` and that `.length` access throws,
 * which (caught by the script's own top-level try/catch) blanks the whole generated
 * page. Since `country_subsidiary` covers essentially every real country — including
 * plain "en_GB", the default source locale on every workbook — this isn't a rare edge
 * case, it reproduces on the very first load of most real generated forms. Filling in
 * the remaining subsidiaries with an empty country list (rather than inventing
 * calling-code data we don't have) keeps the lookup defined, matching what the
 * reference script expects, without touching its logic: the countryCode/callingCode
 * dropdowns just end up empty for those subsidiaries instead of the whole page crashing.
 */
const STUB_SUBSIDIARY_DETAIL: Readonly<Record<string, readonly SubsidiaryCountryEntry[]>> = Object.fromEntries(
  [...new Set(Object.values(COUNTRY_SUBSIDIARY))]
    .filter((code) => !(code in REFERENCE_SUBSIDIARY_DETAIL))
    .map((code) => [code, []]),
);

export const SUBSIDIARY_DETAIL: Readonly<Record<string, readonly SubsidiaryCountryEntry[]>> = {
  ...REFERENCE_SUBSIDIARY_DETAIL,
  ...STUB_SUBSIDIARY_DETAIL,
};

export const SUBSIDIARY_CODES: readonly string[] = Object.keys(SUBSIDIARY_DETAIL).sort();

/**
 * Resolves a subsidiary country's localized name for a generated form's locale. The
 * reference's `countryName` maps are keyed by every locale identifier the *subsidiary*
 * supports (e.g. SGE spans ar/en x AE/BH/KW/OM/QA — 10 keys), which is usually a
 * superset of the specific form's own `locales`, so exact match is the common case;
 * the language-subtag and English fallbacks below only matter for combinations the
 * reference itself never anticipated.
 */
export function resolveSubsidiaryCountryName(
  countryName: Record<string, string>,
  locale: string,
  defaultLocale: string,
): string {
  if (countryName[locale]) return countryName[locale]!;
  const langSubtag = locale.split("_")[0];
  const sameLanguageKey = Object.keys(countryName).find((k) => k.split("_")[0] === langSubtag);
  if (sameLanguageKey) return countryName[sameLanguageKey]!;
  if (countryName[defaultLocale]) return countryName[defaultLocale]!;
  const englishKey = Object.keys(countryName).find((k) => k.startsWith("en_") || k === "en_GB");
  if (englishKey) return countryName[englishKey]!;
  const firstKey = Object.keys(countryName)[0];
  return firstKey ? countryName[firstKey]! : "";
}
