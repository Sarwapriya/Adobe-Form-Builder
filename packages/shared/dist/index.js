// src/excel/parser.ts
import * as XLSX from "xlsx";

// src/excel/textUtils.ts
function normalize(s) {
  return (s ?? "").toString().trim().split("\n").map((line) => line.replace(/\s+/g, " ").trim()).join("\n");
}
function normalizeLoose(s) {
  return (s ?? "").toString().trim().toLowerCase().replace(/[\s_/]+/g, "");
}
function isBracketPlaceholder(s) {
  return /^\[.*\]$/.test(s.trim());
}

// src/excel/parser.ts
var TARGET_SHEET_NAME = normalizeLoose("Complete Translations");
var SHEET_NAME_HINTS = ["translation", "complete", "translat"];
var METADATA_SCAN_ROWS = 15;
var HEADER_SCAN_ROWS = 10;
function isSupportedExcelFile(fileName) {
  return /\.(xlsx|xls)$/i.test(fileName.trim());
}
function parseWorkbook(buffer, sourceFileName) {
  const issues = [];
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return {
      sourceFileName,
      sheetNames: [],
      meta: emptyMeta(),
      headerRowNumber: 1,
      rows: [],
      issues: [{ severity: "error", sheet: "", message: "The file could not be read as a valid Excel workbook." }]
    };
  }
  let sheetName = workbook.SheetNames.find((n) => normalizeLoose(n) === TARGET_SHEET_NAME);
  if (!sheetName) {
    sheetName = workbook.SheetNames.find((n) => {
      const loose = normalizeLoose(n);
      return SHEET_NAME_HINTS.some((hint) => loose.includes(hint));
    });
  }
  if (!sheetName) {
    return {
      sourceFileName,
      sheetNames: workbook.SheetNames,
      meta: emptyMeta(),
      headerRowNumber: 1,
      rows: [],
      issues: [
        {
          severity: "error",
          sheet: "",
          message: `No sheet named "Complete Translations" (or similar) was found. Sheets present: ${workbook.SheetNames.join(", ")}.`
        }
      ]
    };
  }
  const sheet = workbook.Sheets[sheetName];
  const grid = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: ""
  });
  const { keyCol, englishCol, translationCCol, translationDCol, headerRowNumber, headerIssues } = locateColumns(
    grid,
    sheetName
  );
  issues.push(...headerIssues);
  const meta = extractMeta(grid, sheetName, englishCol, translationCCol, translationDCol, issues);
  const rows = [];
  for (let r = 0; r < grid.length; r++) {
    const line = grid[r] ?? [];
    rows.push({
      rowNumber: r + 1,
      key: normalize(line[keyCol]),
      englishText: normalize(line[englishCol]),
      translationC: normalize(line[translationCCol]),
      translationD: normalize(line[translationDCol])
    });
  }
  return { sourceFileName, sheetNames: workbook.SheetNames, meta, headerRowNumber, rows, issues };
}
function emptyMeta() {
  return {
    subsidiary: { C: "", D: "" },
    languageCountry: { C: "", D: "" },
    country: { C: "", D: "" },
    projectCode: { C: "", D: "" }
  };
}
var ENGLISH_HEADER_HINTS = [
  "originalengbtext",
  "originaltext",
  "sourcetext",
  "englishtext",
  "english",
  "original",
  "source"
];
var TRANSLATION_HEADER_HINTS = [
  "completethistranslationcolumn",
  "translationcolumn",
  "translation",
  "translatetext",
  "targettext",
  "target"
];
function locateColumns(grid, sheetName) {
  const headerIssues = [];
  for (let r = 0; r < Math.min(HEADER_SCAN_ROWS, grid.length); r++) {
    const line = grid[r] ?? [];
    let englishCol = -1;
    for (let c = 0; c < line.length; c++) {
      const loose = normalizeLoose(line[c]);
      if (ENGLISH_HEADER_HINTS.some((hint) => loose.includes(hint))) {
        englishCol = c;
        break;
      }
    }
    if (englishCol === -1) continue;
    const translationCols = [];
    for (let c = 0; c < line.length; c++) {
      if (c === englishCol) continue;
      const loose = normalizeLoose(line[c]);
      if (TRANSLATION_HEADER_HINTS.some((hint) => loose.includes(hint))) {
        translationCols.push(c);
      }
    }
    if (translationCols.length === 0) continue;
    return {
      keyCol: Math.max(0, englishCol - 1),
      englishCol,
      translationCCol: translationCols[0] ?? englishCol + 1,
      translationDCol: translationCols[1] ?? translationCols[0] ?? englishCol + 2,
      headerRowNumber: r + 1,
      headerIssues
    };
  }
  headerIssues.push({
    severity: "warning",
    sheet: sheetName,
    row: 1,
    message: "Could not locate English/translation column headers within the first 10 rows; falling back to the standard A/B/C/D column layout."
  });
  return { keyCol: 0, englishCol: 1, translationCCol: 2, translationDCol: 3, headerRowNumber: 1, headerIssues };
}
function extractMeta(grid, sheetName, englishCol, translationCCol, translationDCol, issues) {
  const meta = emptyMeta();
  const found = { subsidiary: false, languageCountry: false, country: false, projectCode: false };
  for (let r = 0; r < Math.min(METADATA_SCAN_ROWS, grid.length); r++) {
    const line = grid[r] ?? [];
    const label = normalizeLoose(line[englishCol]);
    const c = normalize(line[translationCCol]);
    const d = normalize(line[translationDCol]);
    if (label === "subsidiary") {
      meta.subsidiary = { C: c, D: d };
      found.subsidiary = true;
    } else if (label === "languagecountry") {
      meta.languageCountry = { C: c, D: d };
      found.languageCountry = true;
    } else if (label === "country") {
      meta.country = { C: c, D: d };
      found.country = true;
    } else if (label === "projectcode") {
      meta.projectCode = { C: c, D: d };
      found.projectCode = true;
    }
  }
  if (!found.languageCountry) {
    issues.push({
      severity: "warning",
      sheet: sheetName,
      message: 'Could not locate a "Language_Country" metadata row in the first 15 rows.'
    });
  }
  return meta;
}

// src/form/langNames.ts
var RTL_LANGS = ["ar", "he", "ku", "fa", "ur", "yi"];
function isRtlLangSubtag(langSubtag) {
  return RTL_LANGS.includes(langSubtag.toLowerCase());
}
var DISPLAY_NAMES = {
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
  zh: "Chinese"
};
function langDisplayName(langSubtag) {
  return DISPLAY_NAMES[langSubtag.toLowerCase()] ?? langSubtag.toUpperCase();
}

// src/excel/localeDetection.ts
var LOCALE_CODE_RE = /^([a-z]{2,3})[_-]([a-zA-Z]{2,3})$/;
var KEY_ROW_RE = /^[qa]\d+$/i;
var ENGLISH_LOCALE = {
  code: "en_GB",
  langSubtag: "en",
  isRtl: false,
  sourceColumn: "en_GB",
  label: "English"
};
function columnHasContent(rows, column) {
  return rows.some((r) => KEY_ROW_RE.test(r.key) && normalize(column === "C" ? r.translationC : r.translationD) !== "");
}
function resolveColumn(rawLocale, column, rows) {
  const match = LOCALE_CODE_RE.exec(normalize(rawLocale));
  if (match) {
    const langSubtag = match[1].toLowerCase();
    const country = match[2].toUpperCase();
    return {
      code: `${langSubtag}_${country}`,
      langSubtag,
      isRtl: isRtlLangSubtag(langSubtag),
      sourceColumn: column,
      label: langDisplayName(langSubtag)
    };
  }
  if (columnHasContent(rows, column)) {
    return { column, rawValue: normalize(rawLocale) };
  }
  return null;
}
function resolveLocales(meta, rows) {
  const locales = [ENGLISH_LOCALE];
  const unresolved = [];
  for (const column of ["C", "D"]) {
    const result = resolveColumn(meta.languageCountry[column], column, rows);
    if (result === null) continue;
    if ("code" in result) locales.push(result);
    else unresolved.push(result);
  }
  return { locales, unresolved };
}

// src/excel/mapper.ts
var SHEET_NAME = "Complete Translations";
var ANSWER_MARKER_RE = /^\(\s*(single|multiple)\s+answers?\s*\)/i;
var QUESTION_KEY_RE = /^q\d+\.?$/i;
var ANSWER_KEY_RE = /^a\d+\.?$/i;
var ERROR_MESSAGES_MARKER = normalizeLoose("Error Messages");
function stripTrailingDot(key) {
  return key.replace(/\.$/, "");
}
function simpleField(name) {
  return (fields, textByLocale) => {
    fields[name] = { labelByLocale: textByLocale };
  };
}
var FLAT_FIELD_SETTERS = {
  [normalizeLoose("headingBeforeBreak")]: (f, t) => {
    f.headingBeforeBreakByLocale = t;
  },
  [normalizeLoose("headingAfterBreak")]: (f, t) => {
    f.headingAfterBreakByLocale = t;
  },
  [normalizeLoose("requiredField")]: (f, t) => {
    f.requiredFieldNoteByLocale = t;
  },
  [normalizeLoose("countryCode")]: simpleField("countryCode"),
  [normalizeLoose("email")]: simpleField("email"),
  [normalizeLoose("firstName")]: simpleField("firstName"),
  [normalizeLoose("lastName")]: simpleField("lastName"),
  [normalizeLoose("callingCodeDropdownFirstEntry")]: (f, t) => {
    f.callingCode = { labelByLocale: {}, ...f.callingCode, dropdownFirstEntryByLocale: t };
  },
  [normalizeLoose("callingCode")]: (f, t) => {
    f.callingCode = { dropdownFirstEntryByLocale: {}, ...f.callingCode, labelByLocale: t };
  },
  [normalizeLoose("privacyPolicy (.com form only)")]: (f, t) => {
    f.privacyPolicy = { linkUrlByLocale: {}, ...f.privacyPolicy, textByLocale: t };
  },
  [normalizeLoose("url")]: (f, t) => {
    f.privacyPolicy = { textByLocale: {}, ...f.privacyPolicy, linkUrlByLocale: t };
  },
  [normalizeLoose("Marketing optin (.com form only)")]: simpleField("marketingOptin"),
  [normalizeLoose("submitButton")]: (f, t) => {
    f.submitButton = { labelByLocale: t };
  },
  [normalizeLoose("Terms and Conditions")]: (f, t) => {
    f.termsAndConditions = { urlByLocale: {}, ...f.termsAndConditions, textByLocale: t };
  },
  [normalizeLoose("redirectAfterSuccessUrl")]: (f, t) => {
    f.redirectAfterSuccessUrlByLocale = t;
  },
  // Known key with no dedicated model field (Samsung-specific "Raffle Draw" promo
  // copy) — routed straight to the passthrough bucket, silently, since it's a
  // recognized part of the schema rather than a genuinely unrecognized key.
  [normalizeLoose("Rafle Draw")]: (f, t) => {
    f.extraFieldsByLocale = { ...f.extraFieldsByLocale, "Rafle Draw": t };
  }
};
var PAGE_COPY_FIELD_BY_KEY = /* @__PURE__ */ new Map([
  [normalizeLoose("heading"), "heading"],
  [normalizeLoose("subHeading"), "subHeading"],
  [normalizeLoose("subHeadingUrlText"), "subHeadingUrlText"],
  [normalizeLoose("subHeadingUrl"), "subHeadingUrl"]
]);
var THANK_YOU_MARKER_KEY = normalizeLoose("Form Thank you Page");
function mapWorkbook(parsed) {
  const issues = [];
  const { locales, unresolved } = resolveLocales(parsed.meta, parsed.rows);
  const localeByColumn = {};
  for (const l of locales) {
    if (l.sourceColumn === "C") localeByColumn.C = l.code;
    if (l.sourceColumn === "D") localeByColumn.D = l.code;
  }
  const defaultLocale = ENGLISH_LOCALE.code;
  function textMap(row) {
    const map = { [defaultLocale]: row.englishText };
    if (localeByColumn.C && row.translationC !== "") map[localeByColumn.C] = row.translationC;
    if (localeByColumn.D && row.translationD !== "") map[localeByColumn.D] = row.translationD;
    return map;
  }
  const questions = [];
  const fields = { submitButton: { labelByLocale: {} } };
  const pageError = {};
  const thankYou = {};
  const extraFields = {};
  const validationMessages = {};
  const seenQuestionIds = /* @__PURE__ */ new Set();
  let currentSection = "fields";
  let current = null;
  function setPageCopyField(section, field, textByLocale) {
    const target = section === "pageError" ? pageError : thankYou;
    for (const [locale, text] of Object.entries(textByLocale)) {
      target[locale] = { ...target[locale], [field]: text };
    }
  }
  function flushQuestion() {
    if (!current) return;
    const q = current;
    current = null;
    const heading = q.headingByLocale[defaultLocale] ?? "";
    if (heading === "" || isBracketPlaceholder(heading)) {
      issues.push({
        severity: "warning",
        sheet: SHEET_NAME,
        row: q.startRow,
        message: `Question ${q.id} looks like an unfilled placeholder (English text: "${heading || "(empty)"}") and was excluded from the generated form.`
      });
      return;
    }
    let controlType = q.controlType;
    if (q.answers.length === 0) {
      controlType = "text";
    } else if (controlType === null) {
      issues.push({
        severity: "warning",
        sheet: SHEET_NAME,
        row: q.startRow,
        message: `Question ${q.id} has no "(Single answer)"/"(Multiple answers)" marker row; defaulting to single-answer (radio).`
      });
      controlType = "radio";
    }
    questions.push({
      id: q.id,
      order: questions.length + 1,
      controlType,
      headingByLocale: q.headingByLocale,
      subheadingByLocale: q.subheadingByLocale,
      required: true,
      answers: q.answers
    });
  }
  const dataRows = parsed.rows.filter((r) => r.rowNumber > parsed.headerRowNumber);
  for (const row of dataRows) {
    const key = row.key;
    const keyLoose = normalizeLoose(key);
    if (QUESTION_KEY_RE.test(key)) {
      flushQuestion();
      if (key.endsWith(".")) {
        issues.push({
          severity: "warning",
          sheet: SHEET_NAME,
          row: row.rowNumber,
          message: `Row key "${key}" has a trailing "." \u2014 treated as "${stripTrailingDot(key)}".`
        });
      }
      if (seenQuestionIds.has(keyLoose)) {
        issues.push({
          severity: "error",
          sheet: SHEET_NAME,
          row: row.rowNumber,
          message: `Duplicate question id "${key}" \u2014 a question with this id was already seen earlier in the sheet.`
        });
      }
      seenQuestionIds.add(keyLoose);
      current = {
        id: stripTrailingDot(key),
        startRow: row.rowNumber,
        headingByLocale: textMap(row),
        subheadingByLocale: {},
        controlType: null,
        answers: []
      };
      continue;
    }
    if (ANSWER_KEY_RE.test(key)) {
      if (!current) {
        issues.push({
          severity: "error",
          sheet: SHEET_NAME,
          row: row.rowNumber,
          message: `Answer row "${key}" found with no preceding question row; skipped.`
        });
        continue;
      }
      if (key.endsWith(".")) {
        issues.push({
          severity: "warning",
          sheet: SHEET_NAME,
          row: row.rowNumber,
          message: `Row key "${key}" has a trailing "." \u2014 treated as "${stripTrailingDot(key)}".`
        });
      }
      current.answers.push({
        id: stripTrailingDot(key),
        order: current.answers.length + 1,
        textByLocale: textMap(row)
      });
      continue;
    }
    if (key === "") {
      const markerMatch = ANSWER_MARKER_RE.exec(row.englishText);
      if (markerMatch && current && current.answers.length === 0) {
        current.controlType = /multiple/i.test(markerMatch[1]) ? "checkbox" : "radio";
        current.subheadingByLocale = textMap(row);
        continue;
      }
      if (/^page error/i.test(row.englishText)) {
        flushQuestion();
        currentSection = "pageError";
        continue;
      }
      if (/^error messages/i.test(row.englishText)) {
        flushQuestion();
        currentSection = "validation";
        continue;
      }
      continue;
    }
    if (keyLoose === THANK_YOU_MARKER_KEY) {
      flushQuestion();
      currentSection = "thankYou";
      continue;
    }
    if (keyLoose === ERROR_MESSAGES_MARKER) {
      flushQuestion();
      currentSection = "validation";
      continue;
    }
    if (currentSection === "validation" && keyLoose !== "") {
      flushQuestion();
      const textMap_ = textMap(row);
      for (const [locale, text] of Object.entries(textMap_)) {
        validationMessages[locale] = { ...validationMessages[locale], [keyLoose]: text };
      }
      continue;
    }
    if ((currentSection === "pageError" || currentSection === "thankYou") && PAGE_COPY_FIELD_BY_KEY.has(keyLoose)) {
      flushQuestion();
      setPageCopyField(currentSection, PAGE_COPY_FIELD_BY_KEY.get(keyLoose), textMap(row));
      continue;
    }
    const setter = FLAT_FIELD_SETTERS[keyLoose];
    if (setter) {
      flushQuestion();
      setter(fields, textMap(row));
      continue;
    }
    flushQuestion();
    extraFields[key] = textMap(row);
    issues.push({
      severity: "warning",
      sheet: SHEET_NAME,
      row: row.rowNumber,
      message: `Unrecognized row key "${key}" \u2014 its text was preserved but not mapped to a known field.`
    });
  }
  flushQuestion();
  if (Object.keys(extraFields).length > 0) fields.extraFieldsByLocale = extraFields;
  const subsidiary = parsed.meta.subsidiary.C || parsed.meta.subsidiary.D || "";
  const form = {
    meta: { subsidiary, sourceFileName: parsed.sourceFileName, defaultLocale },
    locales,
    questions,
    fields,
    validationMessages,
    pageError,
    thankYou
  };
  return { form, unresolvedLocales: unresolved, issues };
}

// src/excel/validator.ts
var SHEET_NAME2 = "Complete Translations";
var FORMULA_LIKE_RE = /^[=+\-@]/;
function validateWorkbook(mapResult, parserIssues) {
  const errors = [];
  const warnings = [];
  for (const issue of [...parserIssues, ...mapResult.issues]) {
    (issue.severity === "error" ? errors : warnings).push(issue);
  }
  for (const unresolved of mapResult.unresolvedLocales) {
    errors.push({
      severity: "error",
      sheet: SHEET_NAME2,
      column: unresolved.column,
      message: `Column ${unresolved.column}'s "Language_Country" metadata could not be read (found "${unresolved.rawValue || "(blank)"}"), but the column has real translated content. Confirm which language column ${unresolved.column} is before generating.`
    });
  }
  if (mapResult.form.questions.length === 0) {
    errors.push({
      severity: "error",
      sheet: SHEET_NAME2,
      message: "No usable questions were found (every question row was empty or unfilled placeholder text)."
    });
  }
  if (!mapResult.form.fields.submitButton.labelByLocale[ENGLISH_LOCALE.code]) {
    errors.push({
      severity: "error",
      sheet: SHEET_NAME2,
      message: 'No "submitButton" row/text was found; the generated form needs a submit button label.'
    });
  }
  for (const q of mapResult.form.questions) {
    checkFormulaLike(q.headingByLocale, `Question ${q.id} heading`, warnings);
    checkMultilineMismatch(q.headingByLocale, `Question ${q.id} heading`, warnings);
    for (const a of q.answers) {
      checkFormulaLike(a.textByLocale, `Question ${q.id} answer ${a.id}`, warnings);
      checkMultilineMismatch(a.textByLocale, `Question ${q.id} answer ${a.id}`, warnings);
    }
  }
  return { errors, warnings };
}
function checkFormulaLike(textByLocale, label, warnings) {
  for (const [locale, text] of Object.entries(textByLocale)) {
    if (FORMULA_LIKE_RE.test(text)) {
      warnings.push({
        severity: "warning",
        sheet: SHEET_NAME2,
        message: `${label} (${locale}) starts with a formula-like character ("${text[0]}") \u2014 verify this is meant to be literal text and not a leftover Excel formula.`
      });
    }
  }
}
function checkMultilineMismatch(textByLocale, label, warnings) {
  const englishText = textByLocale[ENGLISH_LOCALE.code] ?? "";
  if (englishText.includes("\n")) return;
  for (const [locale, text] of Object.entries(textByLocale)) {
    if (locale === ENGLISH_LOCALE.code) continue;
    if (text.includes("\n")) {
      warnings.push({
        severity: "warning",
        sheet: SHEET_NAME2,
        message: `${label} (${locale}) contains multiple lines but the English source is a single line \u2014 this may indicate several translations were pasted into one cell by mistake.`
      });
    }
  }
}

// src/codegen/domIds.ts
function answerDomKey(order) {
  return `A${order}`;
}
function questionInputId(questionId, answerOrder) {
  return `${questionId}${answerDomKey(answerOrder)}`;
}
function autoPopulateParamName(questionOrder) {
  return `q${String(questionOrder).padStart(2, "0")}`;
}

// src/form/formDefinition.ts
function resolveLocalizedText(map, locale, defaultLocale) {
  if (!map) return "";
  return map[locale] ?? map[defaultLocale] ?? "";
}

// src/excel/questionMasterRows.ts
var MAX_CELL_LENGTH = 255;
function yn(required) {
  return required ? "Y" : "N";
}
function countryAlpha2(locale) {
  return locale.split("_")[1] ?? "";
}
function clamp(value) {
  return value.length > MAX_CELL_LENGTH ? value.slice(0, MAX_CELL_LENGTH) : value;
}
function clampRow(row) {
  return {
    division: clamp(row.division),
    project: clamp(row.project),
    subsidiary: clamp(row.subsidiary),
    country_alpha_2: clamp(row.country_alpha_2),
    locale: clamp(row.locale),
    question_code: clamp(row.question_code),
    question_text_full: clamp(row.question_text_full),
    question_text_alias: clamp(row.question_text_alias),
    mandatory_yn: row.mandatory_yn,
    local_yn: row.local_yn,
    type: row.type,
    answer_code: clamp(row.answer_code),
    answer_text_full: clamp(row.answer_text_full),
    answer_text_alias: clamp(row.answer_text_alias)
  };
}
function selfReferentialRow(base, type, answerCode, answerTextAlias) {
  return {
    ...base,
    type,
    answer_code: answerCode,
    answer_text_full: base.question_text_full,
    answer_text_alias: answerTextAlias
  };
}
function buildProfileFieldRows(fields, locale, defaultLocale) {
  const rows = [];
  if (fields.firstName) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "FIRSTNAME",
          question_text_full: resolveLocalizedText(fields.firstName.labelByLocale, locale, defaultLocale),
          question_text_alias: "firstname",
          mandatory_yn: "Y",
          local_yn: "Standard"
        },
        "Free text",
        "firstName",
        "firstname"
      )
    );
  }
  if (fields.lastName) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "LASTNAME",
          question_text_full: resolveLocalizedText(fields.lastName.labelByLocale, locale, defaultLocale),
          question_text_alias: "lastname",
          mandatory_yn: "Y",
          local_yn: "Standard"
        },
        "Free text",
        "lastName",
        "lastname"
      )
    );
  }
  if (fields.email) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "EMAIL",
          question_text_full: resolveLocalizedText(fields.email.labelByLocale, locale, defaultLocale),
          question_text_alias: "email",
          mandatory_yn: "Y",
          local_yn: "Standard"
        },
        "Free text",
        "email",
        "email"
      )
    );
  }
  const mobileField = fields.callingCode ?? fields.mobileNumber;
  if (mobileField) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "HPP_CODE",
          question_text_full: resolveLocalizedText(mobileField.labelByLocale, locale, defaultLocale),
          question_text_alias: "mobileNumber",
          mandatory_yn: "Y",
          local_yn: "Local"
        },
        "Free text",
        "mobileNumber",
        "mobileNumber"
      )
    );
  }
  if (fields.privacyPolicy) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "PRIVACY POLICY_YN",
          question_text_full: resolveLocalizedText(fields.privacyPolicy.textByLocale, locale, defaultLocale),
          question_text_alias: "PRIVACY POLICY_YN",
          mandatory_yn: yn(fields.privacyPolicy.required ?? true),
          local_yn: "Local"
        },
        "checkbox",
        "PRIVACY POLICY_YN",
        "1 or 0"
      )
    );
  }
  if (fields.marketingOptin) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "MKT_AGE_YN",
          question_text_full: resolveLocalizedText(fields.marketingOptin.labelByLocale, locale, defaultLocale),
          question_text_alias: "MKT_AGE_YN",
          mandatory_yn: yn(fields.marketingOptin.required ?? false),
          local_yn: "Standard"
        },
        "checkbox",
        "MKT_AGE_YN",
        "1 or 0"
      )
    );
  }
  if (fields.countryCode) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "Country",
          question_text_full: resolveLocalizedText(fields.countryCode.labelByLocale, locale, defaultLocale),
          question_text_alias: "COUNTRY",
          mandatory_yn: "Y",
          local_yn: "Local"
        },
        "dropdown",
        "Country",
        "COUNTRY"
      )
    );
  }
  if (fields.termsAndConditions) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "TERMS_AND_CONDITIONS",
          question_text_full: resolveLocalizedText(fields.termsAndConditions.textByLocale, locale, defaultLocale),
          question_text_alias: "termsAndConditions",
          mandatory_yn: "Y",
          local_yn: "Standard"
        },
        "Free text",
        "termsAndConditionsLink",
        "termsAndConditions"
      )
    );
  }
  for (const consent of fields.additionalConsents ?? []) {
    rows.push(
      selfReferentialRow(
        {
          question_code: consent.id,
          question_text_full: resolveLocalizedText(consent.textByLocale, locale, defaultLocale),
          question_text_alias: consent.id,
          mandatory_yn: yn(consent.required ?? false),
          local_yn: "Standard"
        },
        "checkbox",
        consent.id,
        "1 or 0"
      )
    );
  }
  return rows;
}
var QUESTION_TYPE_BY_CONTROL_TYPE = {
  radio: "Single",
  checkbox: "Multi",
  dropdown: "dropdown"
};
function buildQuestionRows(question, locale, defaultLocale) {
  const base = {
    question_code: question.id,
    question_text_full: resolveLocalizedText(question.headingByLocale, locale, defaultLocale),
    question_text_alias: resolveLocalizedText(question.headingByLocale, defaultLocale, defaultLocale),
    mandatory_yn: yn(question.required),
    local_yn: "Standard"
  };
  const type = QUESTION_TYPE_BY_CONTROL_TYPE[question.controlType] ?? "Free text";
  if (question.answers.length === 0) {
    return [selfReferentialRow(base, type, question.id, base.question_text_alias)];
  }
  return question.answers.map((answer) => ({
    ...base,
    type,
    answer_code: answerDomKey(answer.order),
    answer_text_full: resolveLocalizedText(answer.textByLocale, locale, defaultLocale),
    answer_text_alias: resolveLocalizedText(answer.textByLocale, defaultLocale, defaultLocale)
  }));
}
function buildQuestionMasterRows(form, division, project) {
  const rows = [];
  const { subsidiary, defaultLocale } = form.meta;
  for (const localeInfo of form.locales) {
    const locale = localeInfo.code;
    const base = { division, project, subsidiary, country_alpha_2: countryAlpha2(locale), locale };
    for (const fieldRow of buildProfileFieldRows(form.fields, locale, defaultLocale)) {
      rows.push(clampRow({ ...base, ...fieldRow }));
    }
    for (const question of form.questions) {
      for (const questionRow of buildQuestionRows(question, locale, defaultLocale)) {
        rows.push(clampRow({ ...base, ...questionRow }));
      }
    }
  }
  return rows;
}

// src/excel/questionMasterWorkbook.ts
import * as XLSX2 from "xlsx";
var COLUMNS = [
  "division",
  "project",
  "subsidiary",
  "country_alpha_2",
  "locale",
  "question_code",
  "question_text_full",
  "question_text_alias",
  "mandatory_yn",
  "local_yn",
  "type",
  "answer_code",
  "answer_text_full",
  "answer_text_alias"
];
function buildQuestionMasterWorkbook(rows) {
  const sheet = XLSX2.utils.json_to_sheet(rows, { header: COLUMNS });
  const workbook = XLSX2.utils.book_new();
  XLSX2.utils.book_append_sheet(workbook, sheet, "Question Master");
  const output = XLSX2.write(workbook, { type: "array", bookType: "xlsx" });
  return new Uint8Array(output);
}

// src/form/formDefinitionZod.ts
import { z } from "zod";
var localeTextMap = z.record(z.string(), z.string());
var controlTypeSchema = z.enum(["radio", "checkbox", "text", "shortText", "dropdown"]);
var localeInfoSchema = z.object({
  code: z.string(),
  langSubtag: z.string(),
  isRtl: z.boolean(),
  sourceColumn: z.enum(["en_GB", "C", "D", "builder"]),
  label: z.string()
});
var answerDefinitionSchema = z.object({
  id: z.string(),
  order: z.number(),
  textByLocale: localeTextMap,
  image: z.object({ src: z.string(), alt: z.string().optional() }).optional()
});
var questionDefinitionSchema = z.object({
  id: z.string(),
  order: z.number(),
  controlType: controlTypeSchema,
  headingByLocale: localeTextMap,
  subheadingByLocale: localeTextMap,
  required: z.boolean(),
  answers: z.array(answerDefinitionSchema),
  visibleInVariants: z.array(z.enum(["ff", "oc"])).optional(),
  autoPopulateEligible: z.boolean().optional(),
  autoPopulateEnabled: z.boolean().optional()
});
var localizedFieldMetaSchema = z.object({
  labelByLocale: localeTextMap,
  placeholderByLocale: localeTextMap.optional()
});
var callingCodeFieldMetaSchema = localizedFieldMetaSchema.extend({
  dropdownFirstEntryByLocale: localeTextMap
});
var mobileNumberFieldMetaSchema = localizedFieldMetaSchema.extend({
  countries: z.array(z.string()),
  dropdownFirstEntryByLocale: localeTextMap
});
var privacyPolicyMetaSchema = z.object({
  textByLocale: localeTextMap,
  linkUrlByLocale: localeTextMap,
  required: z.boolean().optional(),
  visibleInVariants: z.array(z.enum(["ff", "oc"])).optional()
});
var consentToggleMetaSchema = localizedFieldMetaSchema.extend({
  required: z.boolean().optional(),
  visibleInVariants: z.array(z.enum(["ff", "oc"])).optional()
});
var termsAndConditionsMetaSchema = z.object({
  textByLocale: localeTextMap,
  urlByLocale: localeTextMap
});
var consentDefinitionSchema = z.object({
  id: z.string(),
  order: z.number(),
  textByLocale: localeTextMap,
  linkUrlByLocale: localeTextMap.optional(),
  required: z.boolean().optional(),
  visibleInVariants: z.array(z.enum(["ff", "oc"])).optional()
});
var profileFieldSetSchema = z.object({
  email: localizedFieldMetaSchema.optional(),
  firstName: localizedFieldMetaSchema.optional(),
  lastName: localizedFieldMetaSchema.optional(),
  countryCode: localizedFieldMetaSchema.optional(),
  callingCode: callingCodeFieldMetaSchema.optional(),
  mobileNumber: mobileNumberFieldMetaSchema.optional(),
  privacyPolicy: privacyPolicyMetaSchema.optional(),
  marketingOptin: consentToggleMetaSchema.optional(),
  additionalConsents: z.array(consentDefinitionSchema).optional(),
  termsAndConditions: termsAndConditionsMetaSchema.optional(),
  submitButton: localizedFieldMetaSchema,
  redirectAfterSuccessUrlByLocale: localeTextMap.optional(),
  headingBeforeBreakByLocale: localeTextMap.optional(),
  headingAfterBreakByLocale: localeTextMap.optional(),
  campaignSubheadingByLocale: localeTextMap.optional(),
  requiredFieldNoteByLocale: localeTextMap.optional(),
  extraFieldsByLocale: z.record(z.string(), localeTextMap).optional()
});
var pageCopySchema = z.object({
  heading: z.string().optional(),
  subHeading: z.string().optional(),
  subHeadingUrlText: z.string().optional(),
  subHeadingUrl: z.string().optional()
});
var validationMessageSetSchema = z.object({
  requiredField: z.string().optional(),
  email: z.string().optional(),
  mobileNumber: z.string().optional(),
  modalMessage1: z.string().optional(),
  modalMessage2: z.string().optional(),
  modalButtonYes: z.string().optional(),
  modalButtonNo: z.string().optional(),
  emailError: z.string().optional(),
  firstNameError: z.string().optional(),
  lastNameError: z.string().optional(),
  callingCodeError: z.string().optional(),
  mobileNumberType: z.string().optional(),
  mobileNumberLength: z.string().optional(),
  mobileNumberError: z.string().optional(),
  zipCodeError: z.string().optional(),
  reCaptchaRequired: z.string().optional(),
  apiError: z.string().optional()
});
var formDefinitionSchema = z.object({
  meta: z.object({
    subsidiary: z.string(),
    sourceFileName: z.string(),
    defaultLocale: z.string()
  }),
  locales: z.array(localeInfoSchema),
  questions: z.array(questionDefinitionSchema),
  fields: profileFieldSetSchema,
  validationMessages: z.record(z.string(), validationMessageSetSchema),
  pageError: z.record(z.string(), pageCopySchema),
  thankYou: z.record(z.string(), pageCopySchema)
});

// src/form/localeMigration.ts
function migrateTextMap(map, oldLocale, newLocale, removeOld) {
  const next = { ...map };
  if (next[oldLocale] && !next[newLocale]) {
    next[newLocale] = next[oldLocale];
  }
  if (removeOld) delete next[oldLocale];
  return next;
}
function migrateObjectMap(map, oldLocale, newLocale, removeOld) {
  const next = { ...map };
  const oldValue = next[oldLocale];
  if (oldValue) {
    next[newLocale] = next[newLocale] ? { ...oldValue, ...next[newLocale] } : oldValue;
  }
  if (removeOld) delete next[oldLocale];
  return next;
}
function migrateDefaultLocale(form, newDefaultLocale, options = {}) {
  const oldDefaultLocale = form.meta.defaultLocale;
  if (oldDefaultLocale === newDefaultLocale) return form;
  const removeOld = options.removeOldLocale ?? false;
  const next = JSON.parse(JSON.stringify(form));
  const text = (map) => migrateTextMap(map, oldDefaultLocale, newDefaultLocale, removeOld);
  next.meta.defaultLocale = newDefaultLocale;
  for (const q of next.questions) {
    q.headingByLocale = text(q.headingByLocale);
    q.subheadingByLocale = text(q.subheadingByLocale);
    for (const a of q.answers) {
      a.textByLocale = text(a.textByLocale);
    }
  }
  const f = next.fields;
  if (f.email) f.email.labelByLocale = text(f.email.labelByLocale);
  if (f.firstName) f.firstName.labelByLocale = text(f.firstName.labelByLocale);
  if (f.lastName) f.lastName.labelByLocale = text(f.lastName.labelByLocale);
  if (f.countryCode) f.countryCode.labelByLocale = text(f.countryCode.labelByLocale);
  if (f.callingCode) {
    f.callingCode.labelByLocale = text(f.callingCode.labelByLocale);
    f.callingCode.dropdownFirstEntryByLocale = text(f.callingCode.dropdownFirstEntryByLocale);
  }
  if (f.mobileNumber) {
    f.mobileNumber.labelByLocale = text(f.mobileNumber.labelByLocale);
    f.mobileNumber.dropdownFirstEntryByLocale = text(f.mobileNumber.dropdownFirstEntryByLocale);
  }
  if (f.privacyPolicy) {
    f.privacyPolicy.textByLocale = text(f.privacyPolicy.textByLocale);
    f.privacyPolicy.linkUrlByLocale = text(f.privacyPolicy.linkUrlByLocale);
  }
  if (f.marketingOptin) f.marketingOptin.labelByLocale = text(f.marketingOptin.labelByLocale);
  if (f.additionalConsents) {
    for (const c of f.additionalConsents) {
      c.textByLocale = text(c.textByLocale);
      if (c.linkUrlByLocale) c.linkUrlByLocale = text(c.linkUrlByLocale);
    }
  }
  if (f.termsAndConditions) {
    f.termsAndConditions.textByLocale = text(f.termsAndConditions.textByLocale);
    f.termsAndConditions.urlByLocale = text(f.termsAndConditions.urlByLocale);
  }
  f.submitButton.labelByLocale = text(f.submitButton.labelByLocale);
  if (f.redirectAfterSuccessUrlByLocale) f.redirectAfterSuccessUrlByLocale = text(f.redirectAfterSuccessUrlByLocale);
  if (f.headingBeforeBreakByLocale) f.headingBeforeBreakByLocale = text(f.headingBeforeBreakByLocale);
  if (f.headingAfterBreakByLocale) f.headingAfterBreakByLocale = text(f.headingAfterBreakByLocale);
  if (f.campaignSubheadingByLocale) f.campaignSubheadingByLocale = text(f.campaignSubheadingByLocale);
  if (f.requiredFieldNoteByLocale) f.requiredFieldNoteByLocale = text(f.requiredFieldNoteByLocale);
  if (f.extraFieldsByLocale) {
    const nextExtra = {};
    for (const [key, map] of Object.entries(f.extraFieldsByLocale)) {
      nextExtra[key] = text(map);
    }
    f.extraFieldsByLocale = nextExtra;
  }
  next.validationMessages = migrateObjectMap(next.validationMessages, oldDefaultLocale, newDefaultLocale, removeOld);
  next.pageError = migrateObjectMap(next.pageError, oldDefaultLocale, newDefaultLocale, removeOld);
  next.thankYou = migrateObjectMap(next.thankYou, oldDefaultLocale, newDefaultLocale, removeOld);
  return next;
}

// src/form/callingCodes.ts
var CALLING_CODES = [
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
  { countryCode: "PK", callingCode: "92", countryName: "Pakistan", mobileDigits: 10 }
];
function findCallingCodeEntry(countryCode) {
  return CALLING_CODES.find((c) => c.countryCode === countryCode.toUpperCase());
}

// src/form/formDefinitionValidator.ts
var LABEL = "Form Builder";
function validateFormDefinition(form) {
  const errors = [];
  const warnings = [];
  if (form.questions.length === 0) {
    errors.push(err("Add at least one question before publishing."));
  }
  if (form.locales.length === 0) {
    errors.push(err("The form has no locales configured."));
  } else if (!form.locales.some((l) => l.code === form.meta.defaultLocale)) {
    errors.push(err(`Default locale "${form.meta.defaultLocale}" is not one of the form's configured locales.`));
  }
  checkDuplicates(
    form.locales.map((l) => l.code),
    (code) => `Locale "${code}" is configured more than once.`,
    errors
  );
  if (!form.fields.submitButton?.labelByLocale?.[form.meta.defaultLocale]) {
    errors.push(err("The submit button has no label for the default locale."));
  }
  checkDuplicates(
    form.questions.map((q) => q.id),
    (id) => `Question id "${id}" is used more than once.`,
    errors
  );
  checkSequential(
    form.questions.map((q) => q.order),
    "Question",
    errors
  );
  for (const q of form.questions) {
    checkQuestion(q, errors, warnings);
  }
  if (form.fields.mobileNumber) {
    const countries = form.fields.mobileNumber.countries;
    if (countries.length === 0) {
      errors.push(err("The Mobile Number field has no countries configured."));
    }
    for (const code of countries) {
      if (!findCallingCodeEntry(code)) {
        errors.push(err(`The Mobile Number field references an unrecognized country code "${code}".`));
      }
    }
  }
  if (form.fields.privacyPolicy) {
    if (!form.fields.privacyPolicy.linkUrlByLocale?.[form.meta.defaultLocale]) {
      warnings.push(warn("The Privacy Policy field has no link URL for the default locale."));
    }
    if (!form.fields.privacyPolicy.textByLocale?.[form.meta.defaultLocale]) {
      warnings.push(warn("The Privacy Policy field has no consent text for the default locale."));
    }
    if (form.fields.privacyPolicy.visibleInVariants && form.fields.privacyPolicy.visibleInVariants.length === 0) {
      warnings.push(warn("The Privacy Policy field isn't shown in Full Form or One-Click \u2014 it won't appear anywhere until you enable at least one."));
    }
  }
  if (form.fields.termsAndConditions) {
    if (!form.fields.termsAndConditions.urlByLocale?.[form.meta.defaultLocale]) {
      warnings.push(warn("The Terms and Conditions field has no link URL for the default locale."));
    }
    if (!form.fields.termsAndConditions.textByLocale?.[form.meta.defaultLocale]) {
      warnings.push(warn("The Terms and Conditions field has no wording for the default locale."));
    }
  }
  if (form.fields.marketingOptin?.visibleInVariants && form.fields.marketingOptin.visibleInVariants.length === 0) {
    warnings.push(warn("The Marketing Opt-in field isn't shown in Full Form or One-Click \u2014 it won't appear anywhere until you enable at least one."));
  }
  if (form.fields.additionalConsents) {
    checkDuplicates(
      form.fields.additionalConsents.map((c) => c.id),
      (id) => `Consent id "${id}" is used more than once.`,
      errors
    );
    checkSequential(
      form.fields.additionalConsents.map((c) => c.order),
      "Additional consents",
      errors
    );
    for (const consent of form.fields.additionalConsents) {
      if (!consent.textByLocale?.[form.meta.defaultLocale]) {
        warnings.push(warn(`Consent "${consent.id}" has no text for the default locale.`));
      }
      if (consent.visibleInVariants && consent.visibleInVariants.length === 0) {
        warnings.push(warn(`Consent "${consent.id}" isn't shown in Full Form or One-Click \u2014 it won't appear anywhere until you enable at least one.`));
      }
    }
  }
  return { errors, warnings };
}
function checkQuestion(q, errors, warnings) {
  checkDuplicates(
    q.answers.map((a) => a.id),
    (id) => `Question ${q.id}: answer id "${id}" is used more than once.`,
    errors
  );
  checkSequential(
    q.answers.map((a) => a.order),
    `Question ${q.id}'s answers`,
    errors
  );
  const isChoiceType = q.controlType === "radio" || q.controlType === "checkbox" || q.controlType === "dropdown";
  if (isChoiceType && q.answers.length === 0) {
    errors.push(err(`Question ${q.id} (${q.controlType}) has no options.`));
  }
  if (q.controlType === "radio" && q.answers.length === 1) {
    warnings.push(warn(`Question ${q.id} is a radio question with only one option.`));
  }
  if ((q.controlType === "text" || q.controlType === "shortText") && q.answers.length > 0) {
    warnings.push(warn(`Question ${q.id} is a free-text question but has options configured \u2014 they will be ignored.`));
  }
  if (!q.headingByLocale || Object.keys(q.headingByLocale).length === 0) {
    warnings.push(warn(`Question ${q.id} has no heading text.`));
  }
  if (q.visibleInVariants && q.visibleInVariants.length === 0) {
    warnings.push(warn(`Question ${q.id} isn't shown in Full Form or One-Click \u2014 it won't appear anywhere until you enable at least one.`));
  }
}
function checkDuplicates(values, message, errors) {
  const seen = /* @__PURE__ */ new Set();
  for (const value of values) {
    if (seen.has(value)) {
      errors.push(err(message(value)));
    }
    seen.add(value);
  }
}
function checkSequential(orders, label, errors) {
  if (orders.length === 0) return;
  const sorted = [...orders].sort((a, b) => a - b);
  const expected = sorted.map((_, i) => i + 1);
  const isSequential = sorted.every((value, i) => value === expected[i]);
  if (!isSequential) {
    errors.push(err(`${label} order values must be sequential starting at 1 (found: ${sorted.join(", ")}).`));
  }
}
function err(message) {
  return { severity: "error", sheet: LABEL, message };
}
function warn(message) {
  return { severity: "warning", sheet: LABEL, message };
}

// src/form/contribution.ts
function renumberAnswers(answers) {
  return answers.map((a, i) => ({ ...a, id: `A${i + 1}`, order: i + 1 }));
}
function renumberQuestions(questions) {
  return questions.map((q, i) => ({ ...q, id: `Q${i + 1}`, order: i + 1, answers: renumberAnswers(q.answers) }));
}
function renumberConsents(consents) {
  return consents.map((c, i) => ({ ...c, id: `consentExtra${i + 1}`, order: i + 1 }));
}
function applyTranslationEntry(form, entry) {
  const { target, locale, value } = entry;
  switch (target.kind) {
    case "profileLabel": {
      const field = form.fields[target.field];
      if (!field) return;
      field.labelByLocale = { ...field.labelByLocale, [locale]: value };
      return;
    }
    case "privacyPolicyText": {
      if (!form.fields.privacyPolicy) return;
      form.fields.privacyPolicy.textByLocale = { ...form.fields.privacyPolicy.textByLocale, [locale]: value };
      return;
    }
    case "privacyPolicyLink": {
      if (!form.fields.privacyPolicy) return;
      form.fields.privacyPolicy.linkUrlByLocale = { ...form.fields.privacyPolicy.linkUrlByLocale, [locale]: value };
      return;
    }
    case "termsAndConditionsText": {
      if (!form.fields.termsAndConditions) return;
      form.fields.termsAndConditions.textByLocale = { ...form.fields.termsAndConditions.textByLocale, [locale]: value };
      return;
    }
    case "termsAndConditionsUrl": {
      if (!form.fields.termsAndConditions) return;
      form.fields.termsAndConditions.urlByLocale = { ...form.fields.termsAndConditions.urlByLocale, [locale]: value };
      return;
    }
    case "consentText": {
      const consent = form.fields.additionalConsents?.find((c) => c.id === target.consentId);
      if (!consent) return;
      consent.textByLocale = { ...consent.textByLocale, [locale]: value };
      return;
    }
    case "consentLink": {
      const consent = form.fields.additionalConsents?.find((c) => c.id === target.consentId);
      if (!consent) return;
      consent.linkUrlByLocale = { ...consent.linkUrlByLocale ?? {}, [locale]: value };
      return;
    }
    case "questionHeading": {
      const question = form.questions.find((q) => q.id === target.questionId);
      if (!question) return;
      question.headingByLocale = { ...question.headingByLocale, [locale]: value };
      return;
    }
    case "questionSubheading": {
      const question = form.questions.find((q) => q.id === target.questionId);
      if (!question) return;
      question.subheadingByLocale = { ...question.subheadingByLocale, [locale]: value };
      return;
    }
    case "answerText": {
      const question = form.questions.find((q) => q.id === target.questionId);
      const answer = question?.answers.find((a) => a.id === target.answerId);
      if (!answer) return;
      answer.textByLocale = { ...answer.textByLocale, [locale]: value };
      return;
    }
  }
}
function translationTargetExists(form, target) {
  switch (target.kind) {
    case "profileLabel":
      return !!form.fields[target.field];
    case "privacyPolicyText":
    case "privacyPolicyLink":
      return !!form.fields.privacyPolicy;
    case "termsAndConditionsText":
    case "termsAndConditionsUrl":
      return !!form.fields.termsAndConditions;
    case "consentText":
    case "consentLink":
      return !!form.fields.additionalConsents?.some((c) => c.id === target.consentId);
    case "questionHeading":
    case "questionSubheading":
      return form.questions.some((q) => q.id === target.questionId);
    case "answerText":
      return form.questions.some((q) => q.id === target.questionId && q.answers.some((a) => a.id === target.answerId));
  }
}
function describeTarget(target) {
  switch (target.kind) {
    case "profileLabel":
      return target.field;
    case "privacyPolicyText":
    case "privacyPolicyLink":
      return "Privacy Policy";
    case "termsAndConditionsText":
    case "termsAndConditionsUrl":
      return "Terms and Conditions";
    case "consentText":
    case "consentLink":
      return `consent "${target.consentId}"`;
    case "questionHeading":
    case "questionSubheading":
      return `question "${target.questionId}"`;
    case "answerText":
      return `answer "${target.answerId}" on question "${target.questionId}"`;
  }
}
function applyContribution(base, content) {
  const next = JSON.parse(JSON.stringify(base));
  for (const entry of content.translations) {
    applyTranslationEntry(next, entry);
  }
  if (content.newQuestions.length > 0) {
    next.questions = renumberQuestions([...next.questions, ...content.newQuestions]);
  }
  if (content.newConsents.length > 0) {
    next.fields.additionalConsents = renumberConsents([...next.fields.additionalConsents ?? [], ...content.newConsents]);
  }
  for (const toggle of content.autoPopulateToggles) {
    const question = next.questions.find((q) => q.id === toggle.questionId);
    if (!question || !question.autoPopulateEligible) continue;
    question.autoPopulateEnabled = toggle.enabled;
  }
  return next;
}
var LABEL2 = "Form Contribution";
function err2(message) {
  return { severity: "error", sheet: LABEL2, message };
}
function warn2(message) {
  return { severity: "warning", sheet: LABEL2, message };
}
function validateContribution(base, content) {
  const errors = [];
  const warnings = [];
  const translatableLocales = new Set(base.locales.map((l) => l.code));
  for (const entry of content.translations) {
    if (!translatableLocales.has(entry.locale)) {
      errors.push(err2(`"${entry.locale}" isn't an existing locale on this form.`));
      continue;
    }
    if (!translationTargetExists(base, entry.target)) {
      errors.push(err2(`${describeTarget(entry.target)} no longer exists on this form \u2014 it may have been removed since you started.`));
    }
  }
  for (const q of content.newQuestions) {
    const isChoiceType = q.controlType === "radio" || q.controlType === "checkbox" || q.controlType === "dropdown";
    const heading = resolveLocalizedText(q.headingByLocale, base.meta.defaultLocale, base.meta.defaultLocale);
    if (isChoiceType && q.answers.length === 0) {
      errors.push(err2(`New question "${heading || q.id}" (${q.controlType}) has no options.`));
    }
    if (!heading) {
      warnings.push(warn2(`A new question has no heading text for "${base.meta.defaultLocale}".`));
    }
  }
  for (const c of content.newConsents) {
    if (!resolveLocalizedText(c.textByLocale, base.meta.defaultLocale, base.meta.defaultLocale)) {
      warnings.push(warn2(`A new consent has no text for "${base.meta.defaultLocale}".`));
    }
  }
  for (const toggle of content.autoPopulateToggles) {
    const question = base.questions.find((q) => q.id === toggle.questionId);
    if (!question || !question.autoPopulateEligible) {
      errors.push(
        err2(`Question "${toggle.questionId}" isn't eligible for URL-param auto-populate \u2014 it may have been changed since you started.`)
      );
    }
  }
  return { errors, warnings };
}

// src/form/contributionZod.ts
import { z as z2 } from "zod";
var translationTargetSchema = z2.discriminatedUnion("kind", [
  z2.object({ kind: z2.literal("profileLabel"), field: z2.enum(["firstName", "lastName", "email", "mobileNumber", "marketingOptin"]) }),
  z2.object({ kind: z2.literal("privacyPolicyText") }),
  z2.object({ kind: z2.literal("privacyPolicyLink") }),
  z2.object({ kind: z2.literal("termsAndConditionsText") }),
  z2.object({ kind: z2.literal("termsAndConditionsUrl") }),
  z2.object({ kind: z2.literal("consentText"), consentId: z2.string() }),
  z2.object({ kind: z2.literal("consentLink"), consentId: z2.string() }),
  z2.object({ kind: z2.literal("questionHeading"), questionId: z2.string() }),
  z2.object({ kind: z2.literal("questionSubheading"), questionId: z2.string() }),
  z2.object({ kind: z2.literal("answerText"), questionId: z2.string(), answerId: z2.string() })
]);
var translationEntrySchema = z2.object({
  target: translationTargetSchema,
  locale: z2.string(),
  value: z2.string()
});
var autoPopulateToggleSchema = z2.object({
  questionId: z2.string(),
  enabled: z2.boolean()
});
var contributionContentSchema = z2.object({
  translations: z2.array(translationEntrySchema),
  newQuestions: z2.array(questionDefinitionSchema),
  newConsents: z2.array(consentDefinitionSchema),
  autoPopulateToggles: z2.array(autoPopulateToggleSchema)
});

// src/codegen/css/referenceCssContent.ts
var REFERENCE_CSS = `a,
abbr,
acronym,
address,
applet,
article,
aside,
audio,
b,
big,
blockquote,
body,
canvas,
caption,
center,
cite,
code,
dd,
del,
details,
dfn,
div,
dl,
dt,
em,
embed,
fieldset,
figcaption,
figure,
footer,
form,
h1,
h2,
h3,
h4,
h5,
h6,
header,
hgroup,
html,
i,
iframe,
img,
input,
ins,
kbd,
label,
legend,
li,
mark,
menu,
nav,
object,
ol,
output,
p,
pre,
q,
ruby,
s,
samp,
section,
small,
span,
strike,
strong,
sub,
summary,
sup,
table,
tbody,
td,
tfoot,
th,
thead,
time,
tr,
tt,
u,
ul,
var,
video {
    border: 0;
    font-size: 100%;
    font: inherit;
    margin: 0;
    padding: 0;
    vertical-align: baseline;
}

input::-ms-clear,
input::-ms-reveal {
    display: none;
}

input::-webkit-search-cancel-button,
input::-webkit-search-decoration,
input::-webkit-search-results-button,
input::-webkit-search-results-decoration {
    display: none;
}

input::-webkit-inner-spin-button,
input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

input[type='number'] {
    -moz-appearance: textfield;
}

article,
aside,
details,
figcaption,
figure,
footer,
header,
hgroup,
menu,
nav,
section {
    display: block;
}

body {
    line-height: 1;
}

#hrTy {
    position: relative;
    margin-top: 20px;
    padding: 20px;
    font-family: 'SamsungSS Body Regular'
}

#hrTy h3 {
    font-family: 'SamsungSS Head Bold'
}

ol,
ul {
    list-style: none;
}

blockquote,
q {
    quotes: none;
}

blockquote:after,
blockquote:before,
q:after,
q:before {
    content: '';
    content: none;
}

table {
    border-collapse: collapse;
    border-spacing: 0;
}

.b_400,
.b_767,
.b_850 {
    display: none;
}

body,
html {
    color: #000;
    font-family: 'SamsungSS Head Light';
    font-weight: normal;
}

.container {
    margin: 0 auto;
    max-width: 1160px;
    padding: 0px 0;
    width: 95%;
}
.container_oc {
    margin: 0 auto;
    max-width: 1160px;
    padding: 88px 0;
    width: 95%;
}
.top_cont {
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: center;
}

.top_cont h2 {
    font-family: 'SamsungSS Head Bold';
    font-size: 32px;
    line-height: 1.1;
}

.top_cont p {
    font-family: 'SamsungSS Body Regular';
    font-size: 14px;
    line-height: 1.3;
}

.star {
    color: #006BEA;
}

.main {
    margin-top: 64px;
}

.main form {
    display: flex;
    flex-direction: column;
    gap: 96px;
}

.form_top_group {
    display: flex;
    flex-direction: column;
    font-family: 'SamsungSS Body Regular';
    gap: 48px;
}

.form_text_bx {
    display: flex;
    flex-direction: column;
    font-size: 14px;
    gap: 3px;
    width: 100%;
}

.form_label {
    color: #555555;
    line-height: 19px;
}

.form_top_group input,
.form_top_group select {
    border: none;
    border-bottom: 1px solid #555555;
    font-family: 'SamsungSS Body Regular';
    font-size: 18px;
    line-height: 24px;
    padding: 7px 0px;
    width: 100%;
}

.form_top_group input::placeholder {
    color: #9b9b9b;
    font-size: 18px;
    line-height: 24px;
}

.input_wrap {
    position: relative;
    width: 100%;
}

.input_wrap .btn_clear {
    background: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23999999'%20stroke-width='2'%20stroke-linecap='round'%3E%3Cline%20x1='6'%20y1='6'%20x2='18'%20y2='18'/%3E%3Cline%20x1='18'%20y1='6'%20x2='6'%20y2='18'/%3E%3C/svg%3E") no-repeat center center /contain;
    border: none;
    cursor: pointer;
    height: 16px;
    outline: none;
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
}

.form_text_group {
    display: flex;
    gap: 16px;
}

.form_text_bx.select_bx .select_wrap {
    display: flex;
    gap: 16px;
}

.form_text_bx.select_bx .select_wrap select {
    width: 255px;
}

.form_text_bx.select_bx .select_wrap .input_wrap {
    width: calc(100% - 248px - 16px);
}

.form_check_group {
    display: flex;
    flex-direction: column;
    gap: 96px;
}

.form_check_module {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.form_check_title {
    align-items: center;
    display: flex;
    gap: 5px;
}

.form_check_title h3 {
    font-size: 24px;
    font-family: 'SamsungSS Head Bold';
    word-break: break-all;
}

.form_check_title p {
    font-size: 14px;
    line-height: 19px;
}

.radio_group {
    align-items: center;
    display: flex;
    gap: 225px;
}

.radio_wrap {
    align-items: center;
    display: flex;
    gap: 8px;
}

.radio_wrap input {
    accent-color: #2189FF;
    cursor: pointer;
    flex-shrink: 0;
    height: 22px;
    min-height: 22px;
    min-width: 22px;
    width: 22px;
}

.radio_wrap label {
    align-items: center;
    cursor: pointer;
    display: flex;
    font-size: 14px;
    line-height: 19px;
    padding-top: 2px;
}

.form_check_list_wrap .radio_wrap {
    justify-self: start;
    align-self: start;
}

.form_check_list_wrap {
    column-gap: 24px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    row-gap: 40px;
	flex-wrap: wrap;
}

.form_check_list {
    align-items: center;
    display: flex;
    gap: 8px;
}

.form_check_list input {
    accent-color: #2189FF;
    cursor: pointer;
    height: 22px;
    width: 22px;
}

.form_check_list label {
    align-items: center;
    cursor: pointer;
    display: flex;
    gap: 8px;
}

.form_check_list label img {
    height: 80px;
    width: 80px;
}

.form_check_list label p {
    font-size: 14px;
    line-height: 19px;
    white-space: nowrap;
}

.form_bottom_group {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.form_bottom_check_group {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form_bottom_check {
    font-size: 14px;
    line-height: 19px;
}
.form_bottom_img
{
    width: 14px;
}
.form_bottom_check input[type="checkbox"] {
    display: none;
}

.form_bottom_check label {
    cursor: pointer;
    display: block;
    padding-left: 32px;
    position: relative;
}

.form_bottom_check label::after {
    background: #fff;
    border: 1px solid #555;
    border-radius: 50%;
    content: '';
    height: 24px;
    left: 0;
    position: absolute;
    top: 0;
    width: 24px;
}

.form_bottom_check2 label::after {
    top: 50%;
    transform: translateY(-50%);
}

.form_bottom_check input[type="checkbox"]:checked~label::after {
    background-color: #006BEA;
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='white'%20stroke-width='3'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpolyline%20points='5%2013%2010%2018%2019%207'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: center;
    background-size: 60%;
    border: none;
}

.form_bottom_check label a {
    color: #006BEA;
    display: inline-block;
}

.form_bottom_check label img {
    height: 14px;
    width: 14px;
}

.form_bottom_group button {
    background-color: #ccc;
    cursor: not-allowed;
    align-items: center;
    border-radius: 50px;
    border: none;
    color: #fff;
    display: flex;
    font-family: 'SamsungSS Body Bold';
    font-size: 14px;
    height: 40px;
    justify-content: center;
    margin: 0 auto;
    width: 146px;
}

.form_bottom_group button:hover {
    border: 1px solid black;
}

.form_bottom_group button:enabled {
    background-color: #000;
    color: #fff;
    cursor: pointer;
}

.form_bottom_group button:enabled:hover {
    background-color: #fff;
    border: 1px solid black;
    color: #000;
    cursor: pointer;
}
/* Floating bar container (OC form) */
.form_bottom_bar {
    align-items: center;
    background: #fff;
    bottom: 0;
    border-radius: 0;
    box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.15);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 8px;
    left: 0;
    padding: 16px 24px;
    position: fixed;
    width: 100%;
    z-index: 100;
}

.form_bottom_bar button {
    background-color: #ccc;
    cursor: not-allowed;
    align-items: center;
    border-radius: 50px;
    border: none;
    color: #fff;
    display: flex;
    font-family: 'SamsungSS Body Bold';
    font-size: 14px;
    height: 40px;
    justify-content: center;
    margin: 0 auto;
    width: 146px;
}

.form_bottom_bar button:hover {
    border: 1px solid black;
}

.form_bottom_bar button:enabled {
    background-color: #000;
    border: 1px solid #fff;
    color: #fff;
    cursor: pointer;
}

.form_bottom_bar button:enabled:hover {
    background-color: #000;
    border: 1px solid #fff;
    color: #fff;
    cursor: pointer;
}

@media (prefers-color-scheme: dark) {
    .form_bottom_bar button:enabled {
        background-color: #fff !important;
        border: 1px solid #000 !important;
        color: #000 !important;
    }
    .form_bottom_bar button:enabled:hover {
        background-color: #000 !important;
        border: 1px solid #fff !important;
        color: #fff !important;
    }
}

.form_bottom_terms {
    font-size: 12px;
    color: #333;
    display: flex;
    align-items: center;
    gap: 4px;
    text-decoration: none;
}

.form_bottom_terms:hover {
    text-decoration: underline;
}


/* Modal popup (loaded from modal.html on submit) */
.fullform-submit-intent-popup {
    align-items: center;
    display: none;
    inset: 0;
    justify-content: center;
    padding: 16px;
    position: fixed;
    z-index: 2000;
}

.fullform-submit-intent-popup.is-active {
    display: flex;
}

.fullform-submit-intent-popup .popup__dimmed {
    background: rgba(0, 0, 0, 0.55);
    inset: 0;
    position: absolute;
}

.fullform-submit-intent-popup .popup__contents-wrap {
    max-width: 380px;
    position: relative;
    width: 100%;
    z-index: 1;
}

.fullform-submit-intent-popup .popup__contents {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25);
    font-family: 'SamsungSS Body Regular';
    padding: 28px 24px;
    position: relative;
    text-align: center;
}

.fullform-submit-intent-popup .popup__desc {
    color: #000;
    font-size: 16px;
    line-height: 1.5;
    margin: 0;
}

.fullform-submit-intent-popup .popup__btn-wrap {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
}

.fullform-submit-intent-popup .cta {
    border-radius: 999px;
    cursor: pointer;
    font-family: 'SamsungSS Body Bold';
    font-size: 14px;
    min-width: 96px;
    padding: 10px 16px;
}

.fullform-submit-intent-popup .cta--outlined {
    background: #fff;
    border: 1px solid #000;
    color: #000;
}

.fullform-submit-intent-popup .cta--contained {
    background: #000;
    border: 1px solid #000;
    color: #fff;
}

.fullform-submit-intent-popup .popup__close {
    background: transparent;
    border: none;
    cursor: pointer;
    position: absolute;
    right: 12px;
    top: 12px;
}

body.popup-open {
    overflow: hidden;
}


.g-recaptcha {
    height: 76px;
    width: 302px;
}

.blank {
    align-items: flex-end;
    background-color: #000;
    display: flex;
    display: inline-block;
    height: 2px;
    width: 100px;
}

.underline {
    display: inline;
    overflow-wrap: break-word;
    text-decoration: underline;
    word-break: break-all;
}

@media screen and (max-width:1150px) {
    .form_check_module3 .form_check_title {
        align-items: flex-start;
        flex-direction: column;
        gap: 3px;
    }
}

@media screen and (max-width:1050px) {
    .form_check_list label img {
        height: 48px;
        width: 48px;
    }

    .form_check_list input {
        height: 20px;
        width: 20px;
    }

    .form_check_list_wrap {
        grid-template-columns: repeat(3, 1fr);
    }

    .form_check_title {
        align-items: flex-start;
        display: block;
        flex-direction: column;
        gap: 3px;
    }

    .form_check_title h3 {
        display: inline;
        font-size: 20px;
        line-height: 26px;
        word-break: keep-all;
    }

    .form_check_title p {
        display: inline-block;
        font-size: 12px;
        padding-left: 3px;
        word-break: keep-all;
    }

    .underline {
        word-break: break-all;
    }
}

@media screen and (max-width:850px) {
    .b_850 {
        display: block;
    }

    .n_850 {
        display: none;
    }

    .top_cont h2 {
        font-size: 22px;
        line-height: 29px;
    }

    .top_cont p {
        font-size: 12px;
    }

    .form_check_list_wrap {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media screen and (max-width:767px) {
    .b_767 {
        display: block;
    }

    .container {
        box-sizing: border-box;
        padding: 0px 24px;
        width: 100%;
    }

	.container_oc {
		margin: 0 auto;
		max-width: 1160px;
		padding: 88px 0;
		width: 95%;
	}
    .main {
        margin-top: 48px;
    }

    .form_top_group input,
    .form_top_group select {
        font-size: 14px;
        padding: 0 0 7px;
    }

    .form_top_group input::placeholder {
        color: #9b9b9b;
        font-size: 14px;
    }

    .input_wrap .btn_clear {
        top: 3px;
        transform: translateY(0);
    }

    .form_top_group {
        gap: 38px;
    }

    .form_text_group {
        flex-direction: column;
        gap: 38px;
    }

    .main form {
        gap: 54px;
    }

    .form_label {
        font-size: 12px;
    }

    .radio_group {
        align-items: flex-start;
        flex-direction: column;
        gap: 16px;
    }

    .form_check_group {
        gap: 64px;
    }

    .form_check_list_wrap {
        display: flex;
        flex-direction: column;
        row-gap: 16px;
    }

    .form_bottom_check2 label::after {
        top: 0;
        transform: translateY(0);
    }

    .form_text_bx.select_bx .select_wrap .input_wrap,
    .form_text_bx.select_bx .select_wrap select {
        width: 100%;
    }

    .form_bottom_check label::after {
        height: 20px;
        width: 20px;
    }

    .form_bottom_check label {
        padding-left: 28px;
    }
}

@media screen and (max-width:400px) {
    .g-recaptcha {
        margin: 0 auto;
    }

    .b_400 {
        display: block;
    }
}

.error,
.parsley-custom-error-message,
.parsley-length,
.parsley-required,
.parsley-requiredIf,
.parsley-type,
.parsley-mobileNumberByCountry {
    color: red;
    font-size: 12px;
    padding: 4px;
}

#overlay {
    background-color: rgba(0, 0, 0, 0.5);
    bottom: 0;
    cursor: not-allowed;
    display: none;
    height: 100%;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    width: 100%;
    z-index: 2;
}

.loader {
    -ms-transform: translate(-50%, -50%);
    animation: pulse 1s linear infinite;
    border-radius: 50%;
    border: 5px solid #FFF;
    box-sizing: border-box;
    color: white;
    display: inline-block;
    font-size: 50px;
    height: 48px;
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
}

.loader:after {
    animation: scaleUp 1s linear infinite;
    border-radius: 50%;
    border: 5px solid #FFF;
    box-sizing: border-box;
    content: '';
    display: inline-block;
    height: 48px;
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
}

@keyframes scaleUp {
    0% {
        transform: translate(-50%, -50%) scale(0);
    }

    60%,
    100% {
        transform: translate(-50%, -50%) scale(1);
    }
}

@keyframes pulse {

    0%,
    60%,
    100% {
        transform: scale(1);
    }

    80% {
        transform: scale(1.2);
    }
}




/* modal popup */
@media only screen and (max-width:767px) {
    .co70-hand-raiser__alert-popup .popup__contents {
        padding: 6.66666667vw 0
    }
}


.popup-video {
    display: none
}

.popup-video--show {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    z-index: 3100
}

.popup-video__dimmed {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background-color: #000;
    opacity: .9
}

.popup-video__video-wrap {
    position: relative;
    z-index: 3100
}

.popup-video__video-wrap .video {
    display: none;
    width: 100%;
    height: 100%
}

.popup-video__btn-video-close {
    position: fixed;
    display: inline-block;
    z-index: 3100;
    top: 24px;
    right: 24px;
    width: 36px;
    height: 36px;
    font-size: 0
}

.popup-video__btn-video-close svg {
    width: 100%;
    height: 100%;
    fill: #fff
}

@media only screen and (min-width:768px) and (max-width:1440px) {
    .popup-video__btn-video-close {
        top: 1.66666667vw;
        right: 1.66666667vw;
        width: 2.5vw;
        height: 2.5vw
    }
}

@media only screen and (max-width:767px) {
    .popup-video__btn-video-close {
        top: 6.66666667vw;
        right: 6.66666667vw;
        width: 6.66666667vw;
        height: 6.66666667vw
    }
}

.popup {
    position: fixed;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 3100;
    visibility: hidden;
    opacity: 0;
    pointer-events: none
}

.popup--open {
    visibility: visible;
    opacity: 1;
    pointer-events: auto
}

.popup__dimmed {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000;
    opacity: .75;
    z-index: -1
}

.popup__contents {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    position: relative;
    width: 100%;
    max-height: 100%;
    background-color: #fff;
    border-radius: 24px;
    margin: auto 0 100 0;
    padding: 24px 0;
    overflow: hidden
}

.popup__contents-wrap {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    width: 684px;
    height: 100%;
    font-size: 0;
    padding: 30px 0;
    line-height: 1.33
}

.popup--alert .popup__contents-wrap {
    width: 448px
}

.popup__title {
    font-family: 'SamsungSS Head Regular', arial, sans-serif;
    font-size: 24px;
    font-weight: bold;
    padding: 0 56px 16px 24px
}

.popup__icon {
    text-align: center;
    padding-bottom: 16px
}

.popup__icon .icon {
    display: inline-block;
    width: 48px;
    height: 48px
}

.popup__inner {
    padding: 0 24px
}

.popup__inner-wrap {
    margin-top: 32px;
    min-height: 0;
    overflow: auto
}

.popup--alert .popup__inner-wrap {
    margin-bottom: 32px
}

.popup__title+.popup__inner-wrap,
.popup__icon+.popup__inner-wrap {
    margin-top: 0
}

.popup__desc {
    font-family: 'SamsungSS Body Regular', 'SamsungOne', arial, sans-serif;
    font-weight: normal;
    font-size: 18px;
}

.popup__contents {
    padding: 24px;
}

.popup__desc--align-center {
    text-align: center
}

.popup__desc--align-left {
    text-align: left
}

.popup__desc--align-right {
    text-align: right
}

.popup__btn-wrap {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    position: relative;
    padding: 24px 24px 0 24px;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center
}

.popup--alert .popup__btn-wrap {
    margin-top: -32px
}

.popup__btn-wrap .cta {
    width: 212px
}

.popup__btn-wrap .cta:nth-of-type(2) {
    margin-left: 20px
}

.popup--alert .popup__btn-wrap .cta {
    width: 190px
}

.popup--alert .popup__btn-wrap .cta:nth-of-type(2) {
    margin-left: auto
}

.popup--alert .popup__btn-wrap .cta:only-of-type {
    width: 298px
}

.popup__close {
    position: absolute;
    top: 24px;
    right: 24px;
    width: 24px;
    height: 24px
}

.popup__close .icon {
    width: 100%;
    height: 100%
}

.popup .scrollbar-vertical__track {
    right: 4px
}


@media only screen and (max-width:767px) {
    .popup__contents-wrap {
        width: 100%;
        padding: 0
    }

    .popup__desc {
        font-size: 14px;
    }
    .popup--alert .popup__contents-wrap {
        padding: 8.33333333vw 0vw;
        width: 86.66666667vw
    }

    .popup--alert .popup__contents {
        -webkit-box-flex: 0;
        -ms-flex-positive: 0;
        flex-grow: 0;
        border-radius: 12px;
    }

    .popup__title {
        font-size: 6.11111111vw;
        padding: 0vw 15.55555556vw 4.44444444vw 6.66666667vw
    }

    .popup__icon {
        padding-bottom: 4.44444444vw
    }

    .popup__icon .icon {
        width: 13.33333333vw;
        height: 13.33333333vw
    }

    .popup__inner {
        padding: 0vw 6.66666667vw
    }

    .popup__inner-wrap {
        margin-top: 8.88888889vw;
        -webkit-box-flex: 1;
        -ms-flex-positive: 1;
        flex-grow: 1
    }

    .popup--alert .popup__inner-wrap {
        -webkit-box-flex: 0;
        -ms-flex-positive: 0;
        flex-grow: 0;
        margin-bottom: 8.88888889vw
    }

    .popup__btn-wrap {
        padding: 6.66666667vw
    }

    .popup--alert .popup__btn-wrap {
        margin-top: -8.88888889vw
    }

    .popup__btn-wrap .cta {
        width: 40.55555556vw
    }

    .popup__btn-wrap .cta:nth-of-type(2) {
        margin-left: auto
    }

    .popup--alert .popup__btn-wrap .cta {
        width: 33.88888889vw
    }

    .popup--alert .popup__btn-wrap .cta:nth-of-type(2) {
        margin-left: auto
    }

    .popup--alert .popup__btn-wrap .cta:only-of-type {
        width: 100%
    }

    .popup--alert .popup__btn--dir-vertical {
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;
        -ms-flex-direction: column;
        flex-direction: column
    }

    .popup--alert .popup__btn--dir-vertical .cta {
        width: 100%
    }

    .popup--alert .popup__btn--dir-vertical .cta:first-of-type {
        -webkit-box-ordinal-group: 2;
        -ms-flex-order: 1;
        order: 1
    }

    .popup--alert .popup__btn--dir-vertical .cta:nth-of-type(2) {
        -webkit-box-ordinal-group: 1;
        -ms-flex-order: 0;
        order: 0;
        margin-bottom: 2.22222222vw
    }

    .popup__close {
        top: 6.66666667vw;
        right: 6.66666667vw;
        width: 6.66666667vw;
        height: 6.66666667vw
    }

    .popup .scrollbar-vertical__track {
        right: 1.11111111vw
    }

}

/* modal button*/
.popup--alert button {
    border: 0;
    margin: 0;
    padding: 0;
    width: auto;
    overflow: visible;
    background: 0;
    text-align: inherit;
    border-radius: 0;
    cursor: pointer;
    color: inherit;
    font: inherit;
    line-height: normal;
    -webkit-font-smoothing: inherit;
    -moz-osx-font-smoothing: inherit;
    -webkit-appearance: none
}

.popup--alert .cta {
    display: -webkit-inline-box;
    display: -ms-inline-flexbox;
    display: inline-flex;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    position: relative;
    vertical-align: middle;
    -webkit-transition-property: color, background-color, border-color, border-bottom-color;
    transition-property: color, background-color, border-color, border-bottom-color;
    -webkit-transition-duration: .2s;
    transition-duration: .2s;
    -webkit-transition-timing-function: cubic-bezier(0.33, 0, 0.3, 1);
    transition-timing-function: cubic-bezier(0.33, 0, 0.3, 1);
    font-family: 'SamsungSS Body Bold', 'SamsungOne', arial, sans-serif;
    font-size: 14px;
    font-weight: bold;
    line-height: 19px;
    white-space: nowrap
}

.popup--alert .cta--contained {
    padding: 9px 23px 10px 23px;
    border-radius: 20px;
    border-width: 1px;
    border-style: solid;
    border-color: transparent
}

.popup--alert .cta--contained.cta--black {
    border-color: transparent !important;
    color: #fff !important;
    background-color: #000 !important
}

.popup--alert .cta--contained.cta--black:active {
    opacity: .7 !important
}

.popup--alert .cta--contained.cta--black:not(:has(.icon)):not([target="_blank"]):hover,
.cta--contained.cta--black:not(:has(.icon)):not([target="_blank"]):focus {
    border-color: #000 !important;
    color: #000 !important;
    background-color: #fff !important
}

.popup--alert .cta--contained.cta--black.cta--disabled {
    color: #fff !important;
    background-color: #000 !important;
    cursor: default !important;
    opacity: .2 !important
}

.popup--alert .cta--contained.cta--black.cta--disabled:hover,
.cta--contained.cta--black.cta--disabled:focus {
    color: #fff !important;
    background-color: #000 !important
}

.popup--alert .cta--contained.cta--black[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='white'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--contained.cta--white {
    border-color: transparent !important;
    color: #000 !important;
    background-color: #fff !important
}

.popup--alert .cta--contained.cta--white:active {
    opacity: .7 !important
}

.popup--alert .cta--contained.cta--white:not(:has(.icon)):not([target="_blank"]):hover,
.cta--contained.cta--white:not(:has(.icon)):not([target="_blank"]):focus {
    border-color: #fff !important;
    color: #fff !important;
    background-color: #000 !important
}

.popup--alert .cta--contained.cta--white.cta--disabled {
    color: #000 !important;
    background-color: #fff !important;
    cursor: default !important;
    opacity: .2 !important
}

.popup--alert .cta--contained.cta--white.cta--disabled:hover,
.cta--contained.cta--white.cta--disabled:focus {
    color: #000 !important;
    background-color: #fff !important
}

.popup--alert .cta--contained.cta--white[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='black'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--contained.cta--emphasis {
    border-color: #2189ff !important;
    color: #fff !important;
    background-color: #2189ff !important
}

.popup--alert .cta--contained.cta--emphasis:active {
    opacity: .7 !important
}

.popup--alert .cta--contained.cta--emphasis:not(:has(.icon)):not([target="_blank"]):hover,
.cta--contained.cta--emphasis:not(:has(.icon)):not([target="_blank"]):focus {
    color: #006bea !important;
    background-color: #fff !important
}

.popup--alert .cta--contained.cta--emphasis.cta--disabled {
    border-color: #2189ff !important;
    color: #fff !important;
    background-color: #2189ff !important;
    cursor: default !important;
    text-shadow: none !important;
    opacity: .2 !important
}

.popup--alert .cta--contained.cta--emphasis.cta--disabled:hover,
.cta--contained.cta--emphasis.cta--disabled:focus {
    border-color: #2189ff !important;
    color: #fff !important;
    background-color: #2189ff !important
}

.popup--alert .cta--contained.cta--emphasis[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='white'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--outlined {
    padding: 9px 23px 10px 23px;
    border-radius: 20px;
    border-width: 1px;
    border-style: solid
}

.popup--alert .cta--outlined.cta--black {
    color: #000 !important;
    background-color: transparent !important;
    border-color: #000 !important
}

.popup--alert .cta--outlined.cta--black:active {
    opacity: .7 !important
}

.popup--alert .cta--outlined.cta--black:not(:has(.icon)):not([target="_blank"]):hover,
.cta--outlined.cta--black:not(:has(.icon)):not([target="_blank"]):focus {
    color: #fff !important;
    background-color: #000 !important
}

.popup--alert .cta--outlined.cta--black.cta--disabled {
    color: #ddd !important;
    border-color: #ddd !important;
    cursor: default !important
}

.popup--alert .cta--outlined.cta--black.cta--disabled:hover,
.cta--outlined.cta--black.cta--disabled:focus {
    color: #ddd !important;
    background-color: transparent !important;
    border-color: #ddd !important
}

.popup--alert .cta--outlined.cta--black[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='black'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--outlined.cta--black[target="_blank"].cta--disabled:before,
.cta--outlined.cta--black[target="_blank"].cta--disabled:hover:before,
.cta--outlined.cta--black[target="_blank"].cta--disabled:focus:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23999999'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--outlined.cta--white {
    color: #fff !important;
    background-color: transparent !important;
    border-color: #fff !important
}

.popup--alert .cta--outlined.cta--white:active {
    opacity: .7 !important
}

.popup--alert .cta--outlined.cta--white:not(:has(.icon)):not([target="_blank"]):hover,
.cta--outlined.cta--white:not(:has(.icon)):not([target="_blank"]):focus {
    color: #000 !important;
    background-color: #fff !important
}

.popup--alert .cta--outlined.cta--white.cta--disabled {
    color: #555 !important;
    border-color: #555 !important;
    cursor: default !important
}

.popup--alert .cta--outlined.cta--white.cta--disabled:hover,
.cta--outlined.cta--white.cta--disabled:focus {
    color: #555 !important;
    background-color: transparent !important;
    border-color: #555 !important
}

.popup--alert .cta--outlined.cta--white[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='white'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--outlined.cta--white[target="_blank"].cta--disabled:before,
.cta--outlined.cta--white[target="_blank"].cta--disabled:hover:before,
.cta--outlined.cta--white[target="_blank"].cta--disabled:focus:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23cccccc'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline {
    padding: 10px 0 11px 0
}

.popup--alert .cta--underline:after {
    content: ' ';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 8px;
    height: 2px;
    background-color: currentColor
}

.popup--alert .cta--underline:hover:after,
.cta--underline:focus:after {
    -webkit-animation: cta-underline-animation .2s both;
    animation: cta-underline-animation .2s both;
    -webkit-animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    -webkit-animation-delay: .1s;
    animation-delay: .1s
}

.popup--alert .cta--underline.cta--black {
    color: #000 !important
}

.popup--alert .cta--underline.cta--black.cta--disabled {
    color: #ddd !important;
    cursor: default !important
}

.popup--alert .cta--underline.cta--black[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='black'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline.cta--black[target="_blank"].cta--disabled:before,
.cta--underline.cta--black[target="_blank"].cta--disabled:hover:before,
.cta--underline.cta--black[target="_blank"].cta--disabled:focus:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23999999'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline.cta--white {
    color: #fff !important
}

.popup--alert .cta--underline.cta--white.cta--disabled {
    color: #555 !important;
    cursor: default !important
}

.popup--alert .cta--underline.cta--white[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='white'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline.cta--white[target="_blank"].cta--disabled:before,
.cta--underline.cta--white[target="_blank"].cta--disabled:hover:before,
.cta--underline.cta--white[target="_blank"].cta--disabled:focus:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23cccccc'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline-v2 {
    padding: 10px 0 11px 0
}

.popup--alert .cta--underline-v2:after {
    content: ' ';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 8px;
    height: 1px;
    background-color: currentColor
}

.popup--alert .cta--underline-v2:hover:after,
.cta--underline-v2:focus:after {
    -webkit-animation: cta-underline-on-animation .35s cubic-bezier(0.35, 0, 0.36, 1) .2s;
    animation: cta-underline-on-animation .35s cubic-bezier(0.35, 0, 0.36, 1) .2s
}

.popup--alert .cta--underline-v2:active {
    opacity: .7
}

.popup--alert .cta--underline-v2.cta--large {
    padding: 9px 0 10px 0;
    font-size: 16px
}

.popup--alert .cta--underline-v2.cta--large:after {
    bottom: 6px
}

.popup--alert .cta--underline-v2.cta--dense {
    padding: 11px 0 12px 0
}

.popup--alert .cta--underline-v2.cta--dense:after {
    bottom: 4px
}

.popup--alert .cta--underline-v2.cta--black {
    color: #000 !important
}

.popup--alert .cta--underline-v2.cta--black.cta--disabled {
    color: #ddd !important;
    cursor: default !important
}

.popup--alert .cta--underline-v2.cta--black[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='black'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline-v2.cta--black[target="_blank"].cta--disabled:before,
.cta--underline-v2.cta--black[target="_blank"].cta--disabled:hover:before,
.cta--underline-v2.cta--black[target="_blank"].cta--disabled:focus:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23999999'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline-v2.cta--white {
    color: #fff !important
}

.popup--alert .cta--underline-v2.cta--white.cta--disabled {
    color: #555 !important;
    cursor: default !important
}

.popup--alert .cta--underline-v2.cta--white[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='white'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline-v2.cta--white[target="_blank"].cta--disabled:before,
.cta--underline-v2.cta--white[target="_blank"].cta--disabled:hover:before,
.cta--underline-v2.cta--white[target="_blank"].cta--disabled:focus:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23cccccc'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--label.cta--black {
    color: #000 !important
}

.popup--alert .cta--label.cta--black:hover,
.cta--label.cta--black:focus {
    color: #555 !important
}

.popup--alert .cta--label.cta--black.cta--disabled {
    color: #ddd !important;
    cursor: default !important
}

.popup--alert .cta--label.cta--black.cta--disabled:hover,
.cta--label.cta--black.cta--disabled:focus {
    color: #ddd !important
}

.popup--alert .cta--label.cta--white {
    color: #fff !important
}

.popup--alert .cta--label.cta--white:hover,
.cta--label.cta--white:focus {
    color: #ddd !important
}

.popup--alert .cta--label.cta--white.cta--disabled {
    color: #555 !important;
    cursor: default !important
}

.popup--alert .cta--label.cta--white.cta--disabled:hover,
.cta--label.cta--white.cta--disabled:focus {
    color: #555 !important
}

.popup--alert .cta--dense {
    padding: 8px 16px;
    border-radius: 16px;
    font-size: 12px;
    line-height: 16px
}

.popup--alert .cta--dense.cta--outlined {
    padding: 7px 15px
}

.popup--alert .cta--dense.cta--underline-v2 {
    padding: 7px 0;
    border-radius: 0
}

.popup--alert .cta.cta--2line {
    white-space: normal;
    text-align: center;
    line-height: 1.33;
    border-radius: 100px
}

.popup--alert .cta.cta--2line.cta--contained {
    padding-top: 5px;
    padding-bottom: 5px;
    min-height: 40px
}

.popup--alert .cta.cta--2line:not(.cta--icon-v2).cta--contained {
    padding-left: 16px;
    padding-right: 16px
}

.popup--alert .cta.cta--2line.cta--outlined {
    padding-top: 8px;
    padding-bottom: 8px;
    min-height: 40px
}

.popup--alert .cta.cta--2line:not(.cta--icon-v2).cta--outlined {
    padding-left: 15px;
    padding-right: 15px
}

.popup--alert .cta.cta--2line.cta--contained.cta--dense {
    padding-top: 8px;
    padding-bottom: 8px;
    min-height: 32px
}

.popup--alert .cta.cta--2line.cta--outlined.cta--dense {
    padding-top: 7px;
    padding-bottom: 7px;
    min-height: 32px
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon):before {
    content: ' ';
    position: absolute;
    width: 16px;
    height: 16px;
    right: 24px;
    -webkit-transform: translateY(-50%);
    transform: translateY(-50%);
    top: 50%;
    background-repeat: no-repeat;
    background-size: 100% 100%
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--contained,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--outlined {
    padding-right: 49px
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--contained::before,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--outlined::before {
    width: 18px;
    height: 18px;
    right: 23px
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--underline,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--underline-v2 {
    padding-right: 20px
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--underline[target="_blank"]:before,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--underline-v2[target="_blank"]:before {
    right: 0
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--underline[target="_blank"]:after,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--underline-v2[target="_blank"]:after {
    display: none
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--dense:before,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--2line:before {
    right: 16px
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--dense.cta--contained,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--2line.cta--contained,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--dense.cta--outlined,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--2line.cta--outlined {
    padding-right: 42px
}

.popup--alert .cta.cta--icon .icon {
    display: inline-block;
    width: 16px;
    height: 16px;
    -ms-flex-negative: 0;
    flex-shrink: 0;
    margin-left: 4px;
    -webkit-box-sizing: content-box;
    box-sizing: content-box;
    fill: currentColor;
    -webkit-transition: fill .2s cubic-bezier(0.33, 0, 0.3, 1);
    transition: fill .2s cubic-bezier(0.33, 0, 0.3, 1)
}

.popup--alert .cta.cta--icon-leading .icon {
    -webkit-box-ordinal-group: 0;
    -ms-flex-order: -1;
    order: -1;
    margin-left: 0;
    margin-right: 4px
}

.popup--alert .cta.cta--icon:before {
    display: none
}

.popup--alert .cta.cta--icon.cta--contained,
.cta.cta--icon.cta--outlined {
    padding-right: 23px
}

.popup--alert .cta.cta--icon.cta--contained .icon,
.cta.cta--icon.cta--outlined .icon {
    width: 18px;
    height: 18px;
    margin-left: 8px
}

.popup--alert .cta.cta--icon.cta--underline,
.cta.cta--icon.cta--underline-v2 {
    padding-right: 0
}

.popup--alert .cta.cta--icon.cta--underline:after,
.cta.cta--icon.cta--underline-v2:after {
    display: none
}

.popup--alert .cta.cta--icon.cta--underline .icon,
.cta.cta--icon.cta--underline-v2 .icon {
    margin-bottom: 1px
}

.popup--alert .cta.cta--icon.cta--label .icon {
    margin-bottom: 1px
}

.popup--alert .cta.cta--icon.cta--icon-leading.cta--contained .icon,
.cta.cta--icon.cta--icon-leading.cta--outlined .icon {
    margin-left: 0;
    margin-right: 8px
}

.popup--alert .cta.cta--icon.cta--dense.cta--contained,
.cta.cta--icon.cta--2line.cta--contained {
    padding-right: 16px
}

.popup--alert .cta.cta--icon.cta--dense.cta--outlined,
.cta.cta--icon.cta--2line.cta--outlined {
    padding-right: 15px
}

.popup--alert .cta.cta--icon.cta--dense.cta--contained,
.cta.cta--icon.cta--dense.cta--outlined {
    padding-block: 7px
}

.popup--alert .cta.cta--icon-v2 .icon {
    display: inline-block;
    width: 18px;
    height: 18px;
    -ms-flex-negative: 0;
    flex-shrink: 0;
    -webkit-box-sizing: content-box;
    box-sizing: content-box;
    -webkit-transition: opacity .2s;
    transition: opacity .2s;
    fill: currentColor !important
}

.popup--alert .cta.cta--icon-v2 .icon--prefix {
    position: absolute;
    margin-left: -24px;
    opacity: 0
}

.popup--alert .cta.cta--icon-v2 .icon--suffix {
    opacity: 1
}

.popup--alert .cta.cta--icon-v2 .cta--inner {
    display: -webkit-inline-box;
    display: -ms-inline-flexbox;
    display: inline-flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 8px;
    position: relative;
    -webkit-transition: left .2s cubic-bezier(0.35, 0, 0.36, 1);
    transition: left .2s cubic-bezier(0.35, 0, 0.36, 1);
    left: 0
}

.popup--alert .cta.cta--icon-v2:before {
    display: none
}

.popup--alert .cta.cta--icon-v2:focus .cta--inner,
.cta.cta--icon-v2:hover .cta--inner {
    left: 24px
}

.popup--alert .cta.cta--icon-v2:focus .icon--prefix,
.cta.cta--icon-v2:hover .icon--prefix {
    opacity: 1
}

.popup--alert .cta.cta--icon-v2:focus .icon--suffix,
.cta.cta--icon-v2:hover .icon--suffix {
    opacity: 0
}

.popup--alert .cta.cta--icon-v2.cta.cta--icon-v2-leading {
    direction: rtl
}

.popup--alert .cta.cta--icon-v2.cta.cta--icon-v2-leading .cta--inner {
    -webkit-transition: left .2s cubic-bezier(0.35, 0, 0.36, 1);
    transition: left .2s cubic-bezier(0.35, 0, 0.36, 1)
}

.popup--alert .cta.cta--icon-v2.cta.cta--icon-v2-leading .icon--prefix {
    margin-left: auto;
    margin-right: -24px
}

.popup--alert .cta.cta--icon-v2.cta.cta--icon-v2-leading:focus .cta--inner,
.cta.cta--icon-v2.cta.cta--icon-v2-leading:hover .cta--inner {
    left: -24px
}

.popup--alert .cta--disabled {
    pointer-events: none
}

.popup--alert .cta--disabled.cta--underline:hover:after,
.cta--disabled.cta--underline:focus:after {
    -webkit-animation: none;
    animation: none
}`;

// src/codegen/css/buildStyleCss.ts
var FONT_OVERRIDES = `
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
`;
var RTL_OVERRIDES = `
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
var SUBHEADING_OVERRIDES = `
/* --- Campaign subheading (not present in the reference stylesheet) --- */
.top_cont .top_subheading {
  margin: 4px 0 12px;
}

.top_cont .top_subheading:empty {
  display: none;
}
`;
function buildStyleCss(fileNames) {
  return {
    path: fileNames.css,
    contents: `${REFERENCE_CSS}
${FONT_OVERRIDES}
${RTL_OVERRIDES}
${SUBHEADING_OVERRIDES}`
  };
}

// src/codegen/fileNames.ts
function sanitize(s) {
  return s.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}
function resolvePrefix(form, config) {
  const override = config.fileNamePrefix?.trim();
  if (override) return sanitize(override);
  const defaultLocaleInfo = form.locales.find((l) => l.code === form.meta.defaultLocale);
  const lang = (defaultLocaleInfo?.langSubtag ?? "en").toUpperCase();
  const subsidiary = form.meta.subsidiary.trim();
  return sanitize(subsidiary ? `${subsidiary}-${lang}` : lang);
}
function resolveFileNames(form, config) {
  const prefix = resolvePrefix(form, config);
  return {
    prefix,
    css: `${prefix}.css`,
    dataJs: `${prefix}.js`,
    // Mirrors the reference's `_FF.js`/`_OC.js` pair: each variant gets its own behavior
    // script (see buildVariantJs.ts) rather than a single shared file.
    ffJs: `${prefix}_FF.js`,
    ocJs: `${prefix}_OC.js`,
    ffHtml: `${prefix}_FF.html`,
    ocHtml: `${prefix}_OC.html`
  };
}

// src/codegen/js/escaping.ts
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
var LINE_SEPARATOR_RE = new RegExp("\u2028", "g");
var PARAGRAPH_SEPARATOR_RE = new RegExp("\u2029", "g");
function safeJsonForScript(value) {
  return JSON.stringify(value, null, 2).replace(LINE_SEPARATOR_RE, "\\u2028").replace(PARAGRAPH_SEPARATOR_RE, "\\u2029").replace(/<\/(script)/gi, "<\\/$1");
}

// src/codegen/html/fragments/renderProfileField.ts
function renderProfileFields(fields) {
  const parts = [];
  if (fields.countryCode) {
    parts.push(
      '<div class="form_text_bx select_bx" style="display: none;"><p class="form_label"></p><div class="select_wrap"><select autocomplete="off" data-pt-api="y" id="countryCode" name="countryCode"></select></div></div>'
    );
  }
  if (fields.email) {
    parts.push(
      '<div class="form_text_bx"><p class="form_label"><span></span><span class="star">*</span></p><div class="input_wrap"><input autocapitalize="none" autocomplete="off" autocorrect="off" data-parsley-trigger="blur" data-parsley-error-message="Enter a valid Email address" data-parsley-pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" data-parsley-required="true" data-parsley-type="email" data-pt-api="y" id="email" maxlength="128" name="email" placeholder="" spellcheck="false" type="email"><div class="btn_clear"></div></div></div>'
    );
  }
  if (fields.firstName || fields.lastName) {
    const nameFields = [];
    if (fields.firstName) {
      nameFields.push(
        '<div class="form_text_bx"><p class="form_label"><span></span><span class="star">*</span></p><div class="input_wrap"><input autocapitalize="none" autocomplete="off" autocorrect="off" data-parsley-trigger="blur" data-parsley-error-message="Letters are allowed" data-parsley-pattern="^[A-Za-z\\u0600-\\u06FF]+(\\s[A-Za-z\\u0600-\\u06FF]+)*$" data-parsley-required="true" data-pt-api="y" id="firstName" maxlength="200" name="firstName" placeholder="" spellcheck="false" type="firstName"><div class="btn_clear"></div></div></div>'
      );
    }
    if (fields.lastName) {
      nameFields.push(
        '<div class="form_text_bx"><p class="form_label"><span></span><span class="star">*</span></p><div class="input_wrap"><input autocapitalize="none" autocomplete="off" autocorrect="off" data-parsley-trigger="blur" data-parsley-error-message="Letters are allowed" data-parsley-pattern="^[A-Za-z\\u0600-\\u06FF]+(\\s[A-Za-z\\u0600-\\u06FF]+)*$" data-parsley-required="true" data-pt-api="y" id="lastName" maxlength="200" name="lastName" placeholder="" spellcheck="false" type="lastName"><div class="btn_clear"></div></div></div>'
      );
    }
    parts.push(`<div class="form_text_group">${nameFields.join("")}</div>`);
  }
  if (fields.callingCode || fields.mobileNumber) {
    parts.push(
      '<div class="form_text_bx select_bx"><p class="form_label"></p><div class="select_wrap"><select autocomplete="off" data-parsley-error-message="Select a value" data-parsley-required-if="#mobileNumber" data-parsley-validate-if-empty="true" data-pt-api="y" id="callingCode" name="callingCode"></select><div class="input_wrap"><input autocapitalize="none" autocomplete="off" autocorrect="off" data-parsley-trigger="blur" data-parsley-mobile-number-by-country="true" data-parsley-mobile-number-by-country-message="Enter a valid mobile number" data-parsley-type-message="Digits are allowed" data-parsley-type="digits" data-pt-api="y" id="mobileNumber" maxlength="10" name="mobileNumber" placeholder="" spellcheck="false" type="text"><div class="btn_clear"></div></div></div>'
    );
  }
  return parts.join("");
}

// src/codegen/html/fragments/renderQuestionModule.ts
function renderQuestionModule(q) {
  const requiredStar = q.required ? '<span class="star">*</span>' : "";
  const titleBlock = `<div class="form_check_title"><h3><span></span>${requiredStar}</h3><p></p></div>`;
  if (q.controlType === "text") {
    return `<div class="form_check_module" id="${escapeHtml(q.id)}">` + titleBlock + `<div class="form_text_bx"><div class="input_wrap"><textarea id="${escapeHtml(q.id)}" name="${escapeHtml(q.id)}" rows="3" data-pt-api="y"></textarea></div></div></div>`;
  }
  if (q.controlType === "shortText") {
    return `<div class="form_check_module" id="${escapeHtml(q.id)}">` + titleBlock + `<div class="form_text_bx"><div class="input_wrap"><input type="text" id="${escapeHtml(q.id)}" name="${escapeHtml(q.id)}" data-pt-api="y"><div class="btn_clear"></div></div></div></div>`;
  }
  if (q.controlType === "dropdown") {
    return `<div class="form_check_module" id="${escapeHtml(q.id)}">` + titleBlock + `<div class="form_text_bx select_bx"><div class="select_wrap"><select id="${escapeHtml(q.id)}" name="${escapeHtml(q.id)}" data-pt-api="y"><option value=""></option></select></div></div></div>`;
  }
  const inputType = q.controlType === "checkbox" ? "checkbox" : "radio";
  const isRadioWithFewAnswers = q.controlType === "radio" && q.answers.length <= 3;
  const groupClass = isRadioWithFewAnswers ? "radio_group" : "form_check_list_wrap";
  const wrapClass = q.controlType === "checkbox" ? "form_check_list" : "radio_wrap";
  const isFirstQuestion = q.order === 1;
  const answersHtml = q.answers.map((a, index) => {
    const inputId = questionInputId(q.id, a.order);
    const value = answerDomKey(a.order);
    const errorMessageAttr = isFirstQuestion && index === 0 ? ' data-parsley-error-message="Must select atleast one"' : "";
    const img = a.image ? `<img src="${escapeHtml(a.image.src)}" alt="">` : "";
    return `<div class="${wrapClass}"><input type="${inputType}" id="${inputId}" name="${escapeHtml(q.id)}" value="${value}" data-pt-api="y"${errorMessageAttr}><label for="${inputId}">${img}<p></p></label></div>`;
  }).join("");
  return `<div class="form_check_module" id="${escapeHtml(q.id)}">` + titleBlock + `<div class="${groupClass}">${answersHtml}</div></div>`;
}

// src/codegen/html/pageTemplate.ts
var CDN_SCRIPTS = '<script type="text/javascript" src="https://code.jquery.com/jquery-3.3.1.min.js"></script>\n<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/parsleyjs@2/dist/parsley.min.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/libphonenumber-js/1.11.4/libphonenumber-js.min.js"></script>';
var FAVICON_TAG = '<link rel="shortcut icon" href="https://res6.mena2p.crm.samsung.com/res/tracking/Favicon.png">';
var FONTS_TAG = '<link rel="stylesheet" href="samsungSS_fonts_2026.css">';
var ADOBE_LAUNCH_SCRIPT = '<script src="https://assets.adobedtm.com/72afb75f5516/dd6b57adea42/launch-b679a712f5a6.min.js" async></script>';
var termsLink = (form, extraClass) => form.fields.termsAndConditions ? `<a${extraClass ? ` class="${extraClass}"` : ""} style="text-align:center" href="#" target="_blank" id="termsAndConditionsLink"><span></span><img class="form_bottom_img" src="blue_arr.png"></a>` : "";
function renderPage(form, config, variant, fileNames) {
  const isOc = variant === "oc";
  const analyticsScript = config.analytics?.enabled ? ADOBE_LAUNCH_SCRIPT : "";
  const defaultLocaleInfo = form.locales.find((l) => l.code === form.meta.defaultLocale);
  const langSubtag = defaultLocaleInfo?.langSubtag ?? "en";
  const dir = defaultLocaleInfo?.isRtl ? "rtl" : "ltr";
  const profileFields = renderProfileFields(
    isOc ? {
      callingCode: form.fields.callingCode,
      countryCode: form.fields.countryCode,
      mobileNumber: form.fields.mobileNumber
    } : {
      email: form.fields.email,
      firstName: form.fields.firstName,
      lastName: form.fields.lastName,
      countryCode: form.fields.countryCode,
      callingCode: form.fields.callingCode,
      mobileNumber: form.fields.mobileNumber
    }
  );
  const questionsHtml = form.questions.filter((q) => !q.visibleInVariants || q.visibleInVariants.includes(variant)).map(renderQuestionModule).join("");
  const consentChecks = [];
  if (form.fields.privacyPolicy && (form.fields.privacyPolicy.visibleInVariants ?? ["ff"]).includes(variant)) {
    const star = form.fields.privacyPolicy.required !== false ? '<span class="star">*</span>' : "";
    consentChecks.push(
      `<div class="form_bottom_check"><input id="privacyPolicy" name="privacyPolicy" type="checkbox" data-pt-api="y"><label for="privacyPolicy"><span></span><br><a href="#" target="_blank" id="privacyPolicyLink"><span></span></a>${star}</label></div>`
    );
  }
  if (form.fields.marketingOptin && (form.fields.marketingOptin.visibleInVariants ?? ["ff"]).includes(variant)) {
    const star = form.fields.marketingOptin.required ? '<span class="star">*</span>' : "";
    consentChecks.push(
      `<div class="form_bottom_check form_bottom_check2"><input id="subscribe" name="subscribe" type="checkbox" data-pt-api="y"><label for="subscribe"><span></span>${star}</label></div>`
    );
  }
  if (form.fields.additionalConsents) {
    for (const consent of form.fields.additionalConsents) {
      if (!(consent.visibleInVariants ?? ["ff"]).includes(variant)) continue;
      const id = escapeHtml(consent.id);
      const link = consent.linkUrlByLocale ? `<br><a href="#" target="_blank" id="${id}Link"><span></span></a>` : "";
      const star = consent.required ? '<span class="star">*</span>' : "";
      consentChecks.push(
        `<div class="form_bottom_check form_bottom_check2"><input id="${id}" name="${id}" type="checkbox" data-pt-api="y"><label for="${id}"><span></span>${link}${star}</label></div>`
      );
    }
  }
  const privacyBlock = consentChecks.length > 0 ? `<div class="form_bottom_check_group">${consentChecks.join("")}</div>` : "";
  const submitBlock = '<button class="disabled" disabled id="btnSubmit"></button><div class="error" id="apiError" style="display:none"></div>' + termsLink(form, isOc ? "form_bottom_terms" : "");
  const bottomGroup = isOc ? `${privacyBlock}<div class="form_bottom_bar" id="formBottomBar">${submitBlock}</div>` : `<div class="form_bottom_group">${privacyBlock}${submitBlock}</div>`;
  const topHeading = '<h2><br class="b_850"><span></span></h2>';
  const topSubheading = '<p class="top_subheading"></p>';
  return `<!doctype html>
<html lang="${langSubtag}" dir="${dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Samsung</title>
${FAVICON_TAG}
${FONTS_TAG}
<link rel="stylesheet" href="${fileNames.css}">
${CDN_SCRIPTS}
${analyticsScript}
</head>
<body>
<div class="${isOc ? "container_oc" : "container"}">
<div class="top_cont">${topHeading}${topSubheading}<p><span class="star">*</span><span id="requiredFieldNote"></span></p></div>
<div class="main">
<form action="" id="dataForm">
<div class="form_top_group">${profileFields}</div>
<div class="form_check_group">${questionsHtml}${bottomGroup}</div>
</form>
</div>
</div>
<div id="hrTy" style="display:none"><h3></h3><p><a href="" target="_blank"></a></p></div>
<div id="hrErr" style="display:none"><h3></h3><p><a href="" target="_blank"></a></p></div>
<div id="overlay" style="display:none"><span class="loader"></span></div>
<section id="submitIntentPopup" class="popup popup--alert">
<div class="popup__dimmed"></div>
<div class="popup__contents-wrap"><div class="popup__contents"><div class="popup__inner-wrap"><div class="popup__inner">
<p class="popup__desc" id="submitIntentPopupMessage1"></p>
<p class="popup__desc" id="submitIntentPopupMessage2"></p>
</div></div>
<div class="popup__btn-wrap">
<button class="cta cta--outlined cta--black" id="submitIntentPopupNo"></button>
<button class="cta cta--contained cta--black" id="submitIntentPopupYes"></button>
</div>
</div></div>
</section>
<script src="${fileNames.dataJs}"></script>
<script src="${isOc ? fileNames.ocJs : fileNames.ffJs}"></script>
</body>
</html>
`;
}

// src/codegen/html/buildFfHtml.ts
function buildFfHtml(form, config, fileNames) {
  return { path: fileNames.ffHtml, contents: renderPage(form, config, "ff", fileNames) };
}

// src/codegen/html/buildOcHtml.ts
function buildOcHtml(form, config, fileNames) {
  return { path: fileNames.ocHtml, contents: renderPage(form, config, "oc", fileNames) };
}

// src/form/subsidiaryData.ts
var COUNTRY_SUBSIDIARY = {
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
var REFERENCE_SUBSIDIARY_DETAIL = {
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
        "fr_FR": "\xCEle de l'Ascension"
      }
    },
    {
      "callingCode": "229",
      "countryCode": "BJ",
      "countryName": {
        "en_GB": "Benin",
        "fr_FR": "B\xE9nin"
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
        "fr_FR": "R\xE9publique centrafricaine"
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
        "en_GB": "C\xF4te d'Ivoire",
        "fr_FR": "C\xF4te d'Ivoire"
      }
    },
    {
      "callingCode": "240",
      "countryCode": "GQ",
      "countryName": {
        "en_GB": "Equatorial Guin",
        "fr_FR": "Guin\xE9e \xE9quatoriale"
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
        "fr_FR": "Guin\xE9e"
      }
    },
    {
      "callingCode": "245",
      "countryCode": "GW",
      "countryName": {
        "en_GB": "Guinea-Bissau",
        "fr_FR": "Guin\xE9e-Bissau"
      }
    },
    {
      "callingCode": "231",
      "countryCode": "LR",
      "countryName": {
        "en_GB": "Liberia",
        "fr_FR": "Lib\xE9ria"
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
        "fr_FR": "Nig\xE9ria"
      }
    },
    {
      "callingCode": "242",
      "countryCode": "CG",
      "countryName": {
        "en_GB": "Republic of Congo",
        "fr_FR": "R\xE9publique du Congo"
      }
    },
    {
      "callingCode": "239",
      "countryCode": "ST",
      "countryName": {
        "en_GB": "S\xE3o Tom\xE9 and Pr\xEDncipe",
        "fr_FR": "S\xE3o Tom\xE9-et-Principe"
      }
    },
    {
      "callingCode": "221",
      "countryCode": "SN",
      "countryName": {
        "en_GB": "Senegal",
        "fr_FR": "S\xE9n\xE9gal"
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
        "fr_FR": "Isra\xEBl"
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
        "fr_FR": "Alg\xE9rie"
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
        "en_GB": "T\xFCrkiye",
        "fr_FR": "Turquie"
      }
    }
  ],
  "SGE": [
    {
      "callingCode": "971",
      "countryCode": "AE",
      "countryName": {
        "ar_BH": "\u0627\u0644\u0625\u0645\u064E\u0627\u0631\u064E\u0627\u062A",
        "en_BH": "United Arab Emirates",
        "ar_KW": "\u0627\u0644\u0625\u0645\u064E\u0627\u0631\u064E\u0627\u062A",
        "en_KW": "United Arab Emirates",
        "ar_OM": "\u0627\u0644\u0625\u0645\u064E\u0627\u0631\u064E\u0627\u062A",
        "en_OM": "United Arab Emirates",
        "ar_QA": "\u0627\u0644\u0625\u0645\u064E\u0627\u0631\u064E\u0627\u062A",
        "en_QA": "United Arab Emirates",
        "ar_AE": "\u0627\u0644\u0625\u0645\u064E\u0627\u0631\u064E\u0627\u062A",
        "en_AE": "United Arab Emirates"
      }
    },
    {
      "callingCode": "973",
      "countryCode": "BH",
      "countryName": {
        "ar_AE": "\u0627\u0644\u0628\u062D\u0631\u064A\u0646",
        "en_AE": "Bahrain",
        "ar_BH": "\u0627\u0644\u0628\u062D\u0631\u064A\u0646",
        "en_BH": "Bahrain",
        "ar_KW": "\u0627\u0644\u0628\u062D\u0631\u064A\u0646",
        "en_KW": "Bahrain",
        "ar_OM": "\u0627\u0644\u0628\u062D\u0631\u064A\u0646",
        "en_OM": "Bahrain",
        "ar_QA": "\u0627\u0644\u0628\u062D\u0631\u064A\u0646",
        "en_QA": "Bahrain"
      }
    },
    {
      "callingCode": "965",
      "countryCode": "KW",
      "countryName": {
        "ar_BH": "\u0627\u0644\u0643\u0648\u064A\u062A",
        "en_BH": "Kuwait",
        "ar_KW": "\u0627\u0644\u0643\u0648\u064A\u062A",
        "en_KW": "Kuwait",
        "ar_OM": "\u0627\u0644\u0643\u0648\u064A\u062A",
        "en_OM": "Kuwait",
        "ar_QA": "\u0627\u0644\u0643\u0648\u064A\u062A",
        "en_QA": "Kuwait",
        "ar_AE": "\u0627\u0644\u0643\u0648\u064A\u062A",
        "en_AE": "Kuwait"
      }
    },
    {
      "callingCode": "968",
      "countryCode": "OM",
      "countryName": {
        "ar_BH": "\u0639\u064F\u0645\u0627\u0646",
        "en_BH": "Oman",
        "ar_KW": "\u0639\u064F\u0645\u0627\u0646",
        "en_KW": "Oman",
        "ar_OM": "\u0639\u064F\u0645\u0627\u0646",
        "en_OM": "Oman",
        "ar_QA": "\u0639\u064F\u0645\u0627\u0646",
        "en_QA": "Oman",
        "ar_AE": "\u0639\u064F\u0645\u0627\u0646",
        "en_AE": "Oman"
      }
    },
    {
      "callingCode": "974",
      "countryCode": "QA",
      "countryName": {
        "ar_BH": "\u0642\u0637\u0631",
        "en_BH": "Qatar",
        "ar_KW": "\u0642\u0637\u0631",
        "en_KW": "Qatar",
        "ar_OM": "\u0642\u0637\u0631",
        "en_OM": "Qatar",
        "ar_QA": "\u0642\u0637\u0631",
        "en_QA": "Qatar",
        "ar_AE": "\u0642\u0637\u0631",
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
        "fr_FR": "Territoire britannique de l'oc\xE9an Indien"
      }
    },
    {
      "callingCode": "61",
      "countryCode": "CX",
      "countryName": {
        "en_GB": "Christmas Island",
        "fr_FR": "\xCEle Christmas"
      }
    },
    {
      "callingCode": "61",
      "countryCode": "CC",
      "countryName": {
        "en_GB": "Cocos Islands",
        "fr_FR": "\xCEles Cocos"
      }
    },
    {
      "callingCode": "246",
      "countryCode": "DG",
      "countryName": {
        "en_GB": "Diego Garcia",
        "fr_FR": "Diego Garc\xEDa"
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
var STUB_SUBSIDIARY_DETAIL = Object.fromEntries(
  [...new Set(Object.values(COUNTRY_SUBSIDIARY))].filter((code) => !(code in REFERENCE_SUBSIDIARY_DETAIL)).map((code) => [code, []])
);
var SUBSIDIARY_DETAIL = {
  ...REFERENCE_SUBSIDIARY_DETAIL,
  ...STUB_SUBSIDIARY_DETAIL
};
var SUBSIDIARY_CODES = Object.keys(SUBSIDIARY_DETAIL).sort();

// src/codegen/js/buildDataJs.ts
var BUILDER_SUBSIDIARY_KEY = "BUILDER";
var AUTO_POPULATE_CONTROL_TYPES = /* @__PURE__ */ new Set(["radio", "checkbox", "dropdown"]);
function buildBuilderSubsidiaryTables(countries, locales) {
  const countrySubsidiary = {};
  const entries = [];
  for (const code of countries) {
    const entry = findCallingCodeEntry(code);
    if (!entry) continue;
    countrySubsidiary[entry.countryCode] = BUILDER_SUBSIDIARY_KEY;
    entries.push({
      callingCode: entry.callingCode,
      countryCode: entry.countryCode,
      countryName: Object.fromEntries(locales.map((l) => [l.code, entry.countryName]))
    });
  }
  for (const locale of locales) {
    const localeCountry = locale.code.split("_")[1];
    if (localeCountry && !countrySubsidiary[localeCountry]) {
      countrySubsidiary[localeCountry] = BUILDER_SUBSIDIARY_KEY;
    }
  }
  return { countrySubsidiary, subsidiaryDetail: { [BUILDER_SUBSIDIARY_KEY]: entries } };
}
var DEFAULT_VALIDATION_MESSAGES = {
  emailError: "Please enter a valid Email address",
  firstNameError: "Only letters are allowed",
  lastNameError: "Only letters are allowed",
  callingCodeError: "Please select a value",
  mobileNumberType: "Only digits are allowed",
  mobileNumberLength: "Must be 9 or 10 digits",
  mobileNumberError: "Enter a valid mobile number",
  zipCodeError: "Please enter a valid ZIP code of 5 to 9 characters",
  reCaptchaRequired: "Please complete reCaptcha verification",
  apiError: "Something went wrong. Please try again later.",
  modalMessage_1: "Are you sure you want to submit?",
  modalMessage_2: "You won't be able to change your answers after this.",
  modalButtonYes: "Yes, submit",
  modalButtonNo: "No, go back"
};
function resolvePageCopy(map, locale, defaultLocale) {
  const entry = map[locale] ?? map[defaultLocale] ?? {};
  const fallback = map[defaultLocale] ?? {};
  return {
    heading: entry.heading ?? fallback.heading ?? "",
    subHeading: entry.subHeading ?? fallback.subHeading ?? "",
    subHeadingUrlText: entry.subHeadingUrlText ?? fallback.subHeadingUrlText ?? "",
    subHeadingUrl: entry.subHeadingUrl ?? fallback.subHeadingUrl ?? ""
  };
}
function buildDataJs(form, config, fileNames) {
  const defaultLocale = form.meta.defaultLocale;
  const localeCodes = form.locales.map((l) => l.code);
  const fields = {};
  const pageError = {};
  const questions = {};
  const answers = {};
  const validationMessages = {};
  for (const locale of localeCodes) {
    const f = form.fields;
    const callingCodeField = f.callingCode ?? f.mobileNumber;
    fields[locale] = {
      headingBeforeBreakFF: f.headingBeforeBreakByLocale ? resolveLocalizedText(f.headingBeforeBreakByLocale, locale, defaultLocale) : "",
      headingAfterBreakFF: f.headingAfterBreakByLocale ? resolveLocalizedText(f.headingAfterBreakByLocale, locale, defaultLocale) : "",
      headingBeforeBreak: f.headingBeforeBreakByLocale ? resolveLocalizedText(f.headingBeforeBreakByLocale, locale, defaultLocale) : "",
      headingAfterBreak: f.headingAfterBreakByLocale ? resolveLocalizedText(f.headingAfterBreakByLocale, locale, defaultLocale) : "",
      campaignSubheading: f.campaignSubheadingByLocale ? resolveLocalizedText(f.campaignSubheadingByLocale, locale, defaultLocale) : "",
      requiredField: f.requiredFieldNoteByLocale ? resolveLocalizedText(f.requiredFieldNoteByLocale, locale, defaultLocale) : "",
      label: {
        countryCode: f.countryCode ? resolveLocalizedText(f.countryCode.labelByLocale, locale, defaultLocale) : "",
        email: f.email ? resolveLocalizedText(f.email.labelByLocale, locale, defaultLocale) : "",
        firstName: f.firstName ? resolveLocalizedText(f.firstName.labelByLocale, locale, defaultLocale) : "",
        lastName: f.lastName ? resolveLocalizedText(f.lastName.labelByLocale, locale, defaultLocale) : "",
        callingCode: callingCodeField ? resolveLocalizedText(callingCodeField.labelByLocale, locale, defaultLocale) : "",
        zipCode: ""
      },
      placeholder: {
        email: f.email ? resolveLocalizedText(f.email.placeholderByLocale, locale, defaultLocale) : "",
        firstName: f.firstName ? resolveLocalizedText(f.firstName.placeholderByLocale, locale, defaultLocale) : "",
        lastName: f.lastName ? resolveLocalizedText(f.lastName.placeholderByLocale, locale, defaultLocale) : "",
        mobileNumber: "",
        zipCode: ""
      },
      callingCodeDropdownFirstEntry: callingCodeField ? resolveLocalizedText(callingCodeField.dropdownFirstEntryByLocale, locale, defaultLocale) : "",
      privacyPolicy: f.privacyPolicy ? resolveLocalizedText(f.privacyPolicy.textByLocale, locale, defaultLocale) : "",
      privacyPolicyLink: {
        label: "",
        image: "",
        imageAlt: "",
        url: f.privacyPolicy ? resolveLocalizedText(f.privacyPolicy.linkUrlByLocale, locale, defaultLocale) : ""
      },
      termsAndConditions: f.termsAndConditions ? resolveLocalizedText(f.termsAndConditions.textByLocale, locale, defaultLocale) : "",
      termsAndConditionsLink: {
        label: "",
        image: "",
        imageAlt: "",
        url: f.termsAndConditions ? resolveLocalizedText(f.termsAndConditions.urlByLocale, locale, defaultLocale) : ""
      },
      subscribe: f.marketingOptin ? resolveLocalizedText(f.marketingOptin.labelByLocale, locale, defaultLocale) : "",
      submitButton: resolveLocalizedText(f.submitButton.labelByLocale, locale, defaultLocale),
      hrTy: resolvePageCopy(form.thankYou, locale, defaultLocale),
      redirectAfterSuccessUrl: f.redirectAfterSuccessUrlByLocale ? resolveLocalizedText(f.redirectAfterSuccessUrlByLocale, locale, defaultLocale) : ""
    };
    for (const consent of f.additionalConsents ?? []) {
      const localeRecord = fields[locale];
      localeRecord[consent.id] = resolveLocalizedText(consent.textByLocale, locale, defaultLocale);
      if (consent.linkUrlByLocale) {
        localeRecord[`${consent.id}Link`] = {
          label: "",
          image: "",
          imageAlt: "",
          url: resolveLocalizedText(consent.linkUrlByLocale, locale, defaultLocale)
        };
      }
    }
    pageError[locale] = { hrErr: resolvePageCopy(form.pageError, locale, defaultLocale) };
    const questionsForLocale = {};
    const answersForLocale = {};
    for (const q of form.questions) {
      questionsForLocale[q.id] = {
        heading: resolveLocalizedText(q.headingByLocale, locale, defaultLocale),
        subheading: resolveLocalizedText(q.subheadingByLocale, locale, defaultLocale)
      };
      const answerMap = {};
      for (const a of q.answers) {
        const text = resolveLocalizedText(a.textByLocale, locale, defaultLocale);
        answerMap[answerDomKey(a.order)] = a.image ? { label: text, image: a.image.src, imageAlt: a.image.alt ?? text } : text;
      }
      answersForLocale[q.id] = answerMap;
    }
    questions[locale] = questionsForLocale;
    answers[locale] = answersForLocale;
    const wbMessages = form.validationMessages[locale] ?? {};
    validationMessages[locale] = { ...DEFAULT_VALIDATION_MESSAGES, ...wbMessages };
  }
  const builderSubsidiaryTables = form.fields.mobileNumber ? buildBuilderSubsidiaryTables(form.fields.mobileNumber.countries, form.locales) : null;
  const autoPopulateParams = {};
  for (const q of form.questions) {
    if (q.autoPopulateEligible && q.autoPopulateEnabled && AUTO_POPULATE_CONTROL_TYPES.has(q.controlType)) {
      autoPopulateParams[autoPopulateParamName(q.order)] = q.id;
    }
  }
  const parts = [
    ["page_error", pageError],
    ["fields", fields],
    ["questions", questions],
    ["answers", answers],
    ["validation_messages", validationMessages],
    ["country_subsidiary", builderSubsidiaryTables?.countrySubsidiary ?? COUNTRY_SUBSIDIARY],
    ["subsidiary_detail", builderSubsidiaryTables?.subsidiaryDetail ?? SUBSIDIARY_DETAIL],
    [
      "param",
      {
        apiEndpoint: config.apiEndpoint ?? "",
        channel: { fullForm: config.channel?.fullForm ?? "", oneClick: config.channel?.oneClick ?? "" },
        channelDetail: { fullForm: config.channelDetail?.fullForm ?? "", oneClick: config.channelDetail?.oneClick ?? "" },
        fallbackLanguage: defaultLocale,
        project: config.project ?? "",
        reCaptchaSiteKey: "",
        redirectAfterSuccessInSecond: "5",
        source: { fullForm: config.source?.fullForm ?? "", oneClick: config.source?.oneClick ?? "" },
        voucherRequired: config.voucherRequired ?? "N",
        analytics: config.analytics ?? { enabled: false }
      }
    ],
    ["auto_populate_params", autoPopulateParams]
  ];
  const contents = parts.map(([name, value]) => `const ${name} = ${safeJsonForScript(value)};`).join("\n\n") + "\n";
  return { path: fileNames.dataJs, contents };
}

// src/codegen/js/referenceFfJsContent.ts
var REFERENCE_FF_JS = `/*\r
Function to hide reCaptcha verification error\r
function hideCaptchaVerificationError()\r
{\r
    $("#reCaptchaRequired").hide();\r
}\r
\r
reCapthca Callback method\r
/*var onloadCallback = function()\r
{\r
    grecaptcha.render("g-recaptcha",\r
    {\r
        "sitekey" : param["reCaptchaSiteKey"],\r
        "callback": hideCaptchaVerificationError\r
    });\r
}\r
*/\r
\r
// Once the document is ready\r
$(document).ready(function ()\r
{\r
    // Function to set content for Error Message\r
    // It is kept separate instead of being defined within setFieldData to provide handling in case data is not available in config for received language\r
    // If data is not available in config for received language, fallbackLanguage will be used\r
    function setErrorContent()\r
    {\r
        var heading = "",\r
            subHeading = "",\r
            subHeadingUrl = "",\r
            subHeadingUrlText = "";\r
\r
        try\r
        {\r
            heading = page_error[language]["hrErr"]["heading"];\r
\r
            subHeading = page_error[language]["hrErr"]["subHeading"];\r
\r
            subHeadingUrl = page_error[language]["hrErr"]["subHeadingUrl"];\r
\r
            subHeadingUrlText = page_error[language]["hrErr"]["subHeadingUrlText"];\r
        }\r
        catch(err)\r
        {\r
            heading = page_error[param["fallbackLanguage"]]["hrErr"]["heading"];\r
\r
            subHeading = page_error[param["fallbackLanguage"]]["hrErr"]["subHeading"];\r
\r
            subHeadingUrl = page_error[param["fallbackLanguage"]]["hrErr"]["subHeadingUrl"];\r
\r
            subHeadingUrlText = page_error[param["fallbackLanguage"]]["hrErr"]["subHeadingUrlText"];\r
        }\r
        finally\r
        {\r
            $("div#hrErr").find("h3").html(heading);\r
\r
            $("div#hrErr").find("a").attr("href", subHeadingUrl);\r
\r
            $("div#hrErr").find("a").html(subHeadingUrlText);\r
\r
            $("div#hrErr").find("p").html(subHeading + $("div#hrErr").find("p").html());\r
        }\r
    }\r
	\r
    // Function to get value for passed key from fields JSON constant variable (present in Translation JS) based on Language AND set it in respective placeholder\r
    function setFieldData()\r
    {\r
        // HTML Language\r
        $("html").attr("lang", language.substring(0, language.indexOf("_")));\r
\r
        // HTML Direction (RTL/LTR)\r
        var rtlLangs = ["ar", "he", "ku", "fa", "ur", "yi"];\r
        var langSubtag = language.substring(0, language.indexOf("_"));\r
        $("html").attr("dir", rtlLangs.indexOf(langSubtag) !== -1 ? "rtl" : "ltr");\r
\r
        // Error page / section\r
        setErrorContent();\r
\r
        // Heading\r
        $("div.top_cont h2").html(fields[language]["headingBeforeBreakFF"] + $("div.top_cont h2").html() + fields[language]["headingAfterBreakFF"]);\r
\r
        // Campaign Subheading\r
        $("div.top_cont p.top_subheading").html(fields[language]["campaignSubheading"]);\r
\r
        // Required Field Note\r
        $("div.top_cont p").not(".top_subheading").html($("div.top_cont p").not(".top_subheading").html() + fields[language]["requiredField"]);\r
\r
        // Profile Field(s)\r
        $("div.form_top_group").find("div.form_text_bx").each(function()\r
        {\r
            // Field Label\r
            var pFormLabel = $(this).find("p.form_label");\r
            \r
            pFormLabel.html(fields[language]["label"][pFormLabel.parent().find("input, select").attr("id")] + pFormLabel.html());\r
\r
            // Field Placeholder\r
            $(this).find("input, select").each(function()\r
            {\r
                if($(this).attr("placeholder") != undefined)\r
                {\r
                    $(this).attr("placeholder", fields[language]["placeholder"][$(this).attr("id")])\r
                }\r
            });\r
        });\r
\r
        // Privacy Policy, Subscribe, & any admin-added consent checkboxes \u2014 selector\r
        // doesn't require a form_bottom_group parent since OC's own consent group (if\r
        // any is configured) sits outside one, next to its floating form_bottom_bar.\r
        $("div.form_bottom_check_group").find("div.form_bottom_check").each(function()\r
        {\r
            // Label\r
            var ckbLabel = $(this).find("label");\r
\r
            ckbLabel.html(fields[language][ckbLabel.attr("for")] + ckbLabel.html());\r
\r
            // Link within Label\r
            var ckbLabelLink = ckbLabel.find("a");\r
\r
            // Is present\r
            if(ckbLabelLink.length === 1)\r
            {\r
                ckbLabelLink.children("img").attr("alt", fields[language][ckbLabel.attr("for") + "Link"]["imageAlt"]);\r
\r
                ckbLabelLink.children("img").attr("src", fields[language][ckbLabel.attr("for") + "Link"]["image"]);\r
\r
                ckbLabelLink.html(fields[language][ckbLabel.attr("for") + "Link"]["label"] + ckbLabelLink.html());\r
\r
                ckbLabelLink.attr("href", fields[language][ckbLabel.attr("for") + "Link"]["url"]);\r
            }\r
        });\r
\r
        // Terms & Conditions link (optional, admin/subsidiary-configured) \u2014 a\r
        // standalone anchor sibling of #btnSubmit, not a form_bottom_check div, so\r
        // it needs its own small population block rather than the generic loop\r
        // above. Only present in the DOM at all when configured (see\r
        // pageTemplate.ts), so this is a no-op otherwise.\r
        var termsAndConditionsLink = $("#termsAndConditionsLink");\r
\r
        if(termsAndConditionsLink.length === 1)\r
        {\r
            termsAndConditionsLink.find("span").html(fields[language]["termsAndConditions"]);\r
\r
            termsAndConditionsLink.attr("href", fields[language]["termsAndConditionsLink"]["url"]);\r
        }\r
\r
        // Submit Button\r
        $("#btnSubmit").html(fields[language]["submitButton"]);\r
        \r
        // Thank You page / section\r
        $("div#hrTy").find("h3").html(fields[language]["hrTy"]["heading"]);\r
\r
        $("div#hrTy").find("a").attr("href", fields[language]["hrTy"]["subHeadingUrl"]);\r
\r
        $("div#hrTy").find("a").html(fields[language]["hrTy"]["subHeadingUrlText"]);\r
\r
        $("div#hrTy").find("p").html(fields[language]["hrTy"]["subHeading"] + $("div#hrTy").find("p").html());\r
    }\r
\r
    // Function to get value for passed key from questions & answers JSON constant variable (present in Translation JS) based on Language AND set it in respective placeholder\r
    function setQuestionAndAnswerData()\r
    {\r
        $("div.form_check_group > div.form_check_module").each(function()\r
        {\r
            var questionId = $(this).attr("id");\r
\r
            // Question\r
            $(this).find("div.form_check_title h3").html(questions[language][questionId]["heading"] + $(this).find("div.form_check_title h3").html());\r
\r
            $(this).find("div.form_check_title p").html(questions[language][questionId]["subheading"]);\r
\r
            // Answer (radio / checkbox only \u2014 a shortText input shares the same\r
            // "name" attribute but has no <label> sibling to populate, and a\r
            // dropdown's <option>s are populated separately below)\r
            $(this).find("input[name='" + questionId + "'][type='radio'], input[name='" + questionId + "'][type='checkbox']").each(function()\r
            {\r
                var input = $(this);\r
\r
                var label = input.next();\r
\r
                if (label.children().length == 0)\r
                {\r
                    // Answer with Text inside <label>\r
                    label.html(answers[language][questionId][input.val()]);\r
                }\r
                else if (label.children().length == 1)\r
                {\r
                    // Answer with Text inside <p> (within <label>)\r
                    label.children("p").html(answers[language][questionId][input.val()]);\r
                }\r
                else if (label.children().length == 2)\r
                {\r
                    // Answer with Text & Image (within <label>)\r
                    label.children("p").html(answers[language][questionId][input.val()]["label"]);\r
\r
                    label.children("img").attr("src", answers[language][questionId][input.val()]["image"]);\r
\r
                    label.children("img").attr("alt", answers[language][questionId][input.val()]["imageAlt"]);\r
                }\r
            });\r
\r
            // Answer (dropdown options)\r
            $(this).find("select").each(function()\r
            {\r
                var select = $(this);\r
\r
                $.each(answers[language][questionId], function(val, text)\r
                {\r
                    select.append($("<option></option>").val(val).html(text));\r
                });\r
            });\r
        });\r
    }\r
\r
    // Function to get value for passed key from validation_messages JSON constant variable (present in Translation JS) based on Language AND set it as respective (Parsley) Validation Message\r
    function setValidationMessage()\r
    {\r
        $("input[data-parsley-error-message], select[data-parsley-error-message]").each(function()\r
        {\r
            $(this).attr("data-parsley-error-message", validation_messages[language][$(this).attr("id") + "Error"]);\r
        });\r
\r
        $("input[data-parsley-type-message]").each(function()\r
        {\r
            $(this).attr("data-parsley-type-message", validation_messages[language][$(this).attr("id") + "Type"]);\r
        });\r
\r
        $("input[data-parsley-length-message]").each(function()\r
        {\r
            $(this).attr("data-parsley-length-message", validation_messages[language][$(this).attr("id") + "Length"]);\r
        });\r
\r
        $("input[data-parsley-mobile-number-by-country-message]").each(function()\r
        {\r
            $(this).attr("data-parsley-mobile-number-by-country-message", validation_messages[language][$(this).attr("id") + "Error"]);\r
        });\r
\r
\r
        //$("#reCaptchaRequired").html(validation_messages[language]["reCaptchaRequired"]);\r
\r
         $("#apiError").html(validation_messages[language]["apiError"]);\r
\r
        // Modal Messages\r
        $("#submitIntentPopupMessage1").text(validation_messages[language]["modalMessage_1"]);\r
        $("#submitIntentPopupMessage2").text(validation_messages[language]["modalMessage_2"]);\r
        $("#submitIntentPopupYes").text(validation_messages[language]["modalButtonYes"]);\r
        $("#submitIntentPopupNo").text(validation_messages[language]["modalButtonNo"]);\r
    }\r
\r
    // Function to populate Country Code dropdown\r
    function populateCountryCodeDropdown()\r
    {\r
        // Get Subsidiary from Country Code (parsed from Language)\r
        var subsidiary = country_subsidiary[countryCode];\r
\r
        // Get Country Code dropdown\r
        var ddCountryCode = $("#countryCode");\r
\r
        // Check if Country Code dropdown is available\r
        var isCountryCodeDrodownPresent = (ddCountryCode.length === 1);\r
\r
        // If Country Code dropdown is available\r
        if (isCountryCodeDrodownPresent)\r
        {\r
            // Set Option(s) in Country Code dropdown\r
            $.each(subsidiary_detail[subsidiary], function (val, text)\r
            {\r
                // Append value(s) to Country Code dropdown\r
                ddCountryCode.append($("<option></option>").val(text.countryCode).html(text.countryName[language]));\r
            });\r
        \r
            // Show Country (parsed from Language) as selected\r
            ddCountryCode.val(countryCode);\r
\r
            // If Subsidiary has more than 1 Country, then only show the dropdown\r
            if(subsidiary_detail[subsidiary].length > 1)\r
            {\r
                ddCountryCode.closest("div.form_text_bx").css("display", "block");\r
            }\r
        }\r
    }\r
\r
    // Function to populate Calling Code dropdown\r
    function populateCallingCodeDropdown()\r
    {\r
        // Get Subsidiary from Country Code (parsed from Language)\r
        var subsidiary = country_subsidiary[countryCode];\r
\r
        // Calling Code dropdown\r
        var ddCallingCode = $("#callingCode");\r
\r
        // Set Default Value in Calling Code dropdown\r
        //ddCallingCode.append($("<option></option>").val("0").html(fields[language]["callingCodeDropdownFirstEntry"]));\r
\r
        // Disable First / Default Entry in Calling Code dropdown\r
        $("#callingCode option:first-child").attr("disabled", "disabled").prop("selected", true);\r
\r
        // Set Option(s) in Calling Code dropdown\r
        $.each(subsidiary_detail[subsidiary], function (val, text)\r
        {\r
            // If Calling Code is not blank\r
            if (text.callingCode != "")\r
            {\r
                ddCallingCode.append($("<option></option>").val(text.callingCode).html(text.countryName[language] + " (+" + text.callingCode + ")"));\r
            }\r
        });\r
    }\r
\r
    // Function to reset selected value in Calling Code dropdown if Mobile Number is removed\r
    function resetCallingCode()\r
    {\r
        if($("#mobileNumber").val() == "")\r
        {\r
            // Reset value\r
            $("#callingCode").val("0");\r
\r
            // Remove Parsley validation message\r
            $("#callingCode").parsley().reset();\r
        }\r
    }\r
\r
    // Function to check whether every question marked required (rendered with a "*") currently has an answer\r
    function allRequiredQuestionsAnswered()\r
    {\r
        var allAnswered = true;\r
\r
        $("div.form_check_group > div.form_check_module").each(function()\r
        {\r
            if ($(this).find("div.form_check_title .star").length === 0)\r
            {\r
                return;\r
            }\r
\r
            var textarea = $(this).find("textarea");\r
\r
            var select = $(this).find("select");\r
\r
            var shortTextInput = $(this).find("input[type='text']");\r
\r
            var hasAnswer = (textarea.length > 0)\r
                ? ($.trim(textarea.val()) !== "")\r
                : (select.length > 0)\r
                    ? (select.val() !== "")\r
                    : (shortTextInput.length > 0)\r
                        ? ($.trim(shortTextInput.val()) !== "")\r
                        : ($(this).find("input[type='radio']:checked, input[type='checkbox']:checked").length > 0);\r
\r
            if (!hasAnswer)\r
            {\r
                allAnswered = false;\r
\r
                return false;\r
            }\r
        });\r
\r
        return allAnswered;\r
    }\r
\r
    // Function to check whether every consent checkbox marked required (rendered with\r
    // a "*" in its label) is currently checked \u2014 generic over Privacy Policy,\r
    // Subscribe, and any admin-added consent, instead of a single hardcoded id, so\r
    // any of them can be marked required (see ConsentDefinition/PrivacyPolicyMeta/\r
    // ConsentToggleMeta's own required flag in formDefinition.ts).\r
    function allRequiredConsentsChecked()\r
    {\r
        var allChecked = true;\r
\r
        $("div.form_bottom_check_group > div.form_bottom_check").each(function()\r
        {\r
            if ($(this).find("label .star").length === 0)\r
            {\r
                return;\r
            }\r
\r
            if (!$(this).find("input[type='checkbox']").is(":checked"))\r
            {\r
                allChecked = false;\r
\r
                return false;\r
            }\r
        });\r
\r
        return allChecked;\r
    }\r
\r
    // Function to enable Submit button if every required consent is checked & every required question has an answer (else keep Submit button disabled)\r
    function enableDisableSubmit()\r
    {\r
        if (allRequiredConsentsChecked() && allRequiredQuestionsAnswered())\r
        {\r
            $("#btnSubmit").prop("disabled", false);\r
\r
            $("#btnSubmit").removeClass("disabled");\r
        }\r
        else\r
        {\r
            $("#btnSubmit").prop("disabled", true);\r
\r
            $("#btnSubmit").addClass("disabled");\r
        }\r
    }\r
\r
    function validateModal()\r
    {\r
        // Check whether any questions in the full form have been answered\r
        submitModalAnsweredAny = $('[data-pt-api="y"][name^=Q]').filter((i, el) => el.checked).length > 0\r
\r
		//submitModalWithsub = $("#subscribe").is(":checked");\r
        return !submitModalHasOpened && !submitModalAnsweredAny;\r
    }\r
\r
    function closeSubmitModal()\r
    {\r
        if (submitModalElement)\r
        {\r
            submitModalElement.removeClass("popup--open");\r
        }\r
    }\r
\r
    function showSubmitModal(resumeCallback)\r
    {\r
		\r
        submitModalResume = typeof resumeCallback === "function" ? resumeCallback : null;\r
\r
        if (!submitModalElement) // Bind events once\r
        {\r
            submitModalElement = $("#submitIntentPopup");\r
            submitModalElement.find("#submitIntentPopupYes, .popup__close, .popup__dimmed").on("click", closeSubmitModal);\r
            submitModalElement.find("#submitIntentPopupNo").on("click", function ()\r
            {\r
                closeSubmitModal();\r
                \r
                if (submitModalResume)\r
                {\r
                    submitModalResume();\r
                    submitModalResume = null;\r
                }\r
            });\r
        }\r
\r
        submitModalElement.addClass("popup--open");\r
        submitModalHasOpened = true;\r
		\r
    }\r
\r
    // Function to attach different event(s) to various element(s)\r
    function attachEvent()\r
    {\r
        // Add Parsley Custom Validator to validate Calling Code (value should be selected in dropdown if Mobile Number is entered)\r
        window.Parsley.addValidator("requiredIf", {\r
            validateString : function(value, requirement)\r
            {\r
                if($(requirement).parsley().isValid())\r
                {\r
                    if (jQuery(requirement).val())\r
                    {\r
                        return !!value;\r
                    }\r
                }\r
\r
                return true;\r
            }\r
        });\r
\r
        // Build callingCode -> countryCode mapping from subsidiary_detail\r
        var callingCodeToCountry = {};\r
        $.each(subsidiary_detail, function(subsidiary, countries) {\r
            $.each(countries, function(i, country) {\r
                if (country.callingCode && country.callingCode !== "") {\r
                    callingCodeToCountry[country.callingCode] = country.countryCode;\r
                }\r
            });\r
        });\r
\r
        // Custom Parsley Validator - validate mobile number against selected calling code using libphonenumber-js\r
        window.Parsley.addValidator("mobileNumberByCountry", {\r
            validateString: function (value) {\r
                if (value.trim() === "") return true; // empty value handled by required-if on callingCode\r
\r
                var callingCode = $("#callingCode").val();\r
                if (!callingCode || callingCode === "0") return false;\r
\r
                // Digit-length correctness is left entirely to libphonenumber-js's own\r
                // per-country numbering-plan metadata below (isValid()) rather than a\r
                // hardcoded "9 digits for UAE, 8 for everyone else" guess \u2014 that guess\r
                // was wrong for other countries this same dropdown offers (e.g. Saudi\r
                // Arabia also needs 9 digits, not 8), and redundant even where it\r
                // happened to be right, since isValid() already enforces the correct\r
                // length for whichever country was actually selected.\r
                var fullNumber = "+" + callingCode + value;\r
                try {\r
                    var phoneNumber = libphonenumber.parsePhoneNumberFromString(fullNumber);\r
                    return phoneNumber && phoneNumber.isValid();\r
                } catch (e) {\r
                    return false;\r
                }\r
            },\r
            message: "Enter a valid mobile number"\r
        });\r
\r
        // Clear / reset user entered data (from Profile fields)\r
        $(".btn_clear").on("click", function()\r
        {\r
            // Parent of element having btn_clear class\r
            var parent = $(this).parent();\r
\r
            // Find input field present in parent container (having element with btn_clear class)\r
            var inputField = parent.find("input");\r
\r
            // If input field is present\r
            if (inputField.length === 1)\r
            {\r
                // Reset input field value\r
                inputField.val("");\r
\r
                // Remove Parsley validation message\r
                inputField.parsley().reset();\r
\r
                // Find second parent (parent element's parent) of element having btn_clear class\r
                var secondParent = parent.parent();\r
\r
                // Find dropdown field present in secodn parent container\r
                var ddSelect = secondParent.find("select");\r
\r
                // If dropdown is present && is dependent on input field\r
                if((ddSelect.length === 1) && (ddSelect.attr("data-parsley-required-if") != undefined) && (ddSelect.attr("data-parsley-required-if") == ("#" + inputField.attr("id"))))\r
                {\r
                    // Reset dropdown value\r
                    ddSelect.val(secondParent.find("select option:first-child").val());\r
\r
                    // Remove Parsley validation message\r
                    ddSelect.parsley().reset();\r
                }\r
            }\r
        });\r
\r
        // Attach event to reset Calling Code if Mobile Number is removed\r
        $("#mobileNumber").on("change", resetCallingCode);\r
\r
        // Attach event to check Submit button state (enabled / disabled) on check / uncheck of any consent checkbox (Privacy Policy, Subscribe, or an admin-added consent) & any required question's answer(s)\r
        $("div.form_bottom_check_group input[type='checkbox']").on("change", enableDisableSubmit);\r
\r
        $("div.form_check_group > div.form_check_module").find("input[type='radio'], input[type='checkbox']").on("change", enableDisableSubmit);\r
\r
        $("div.form_check_group > div.form_check_module").find("textarea, input[type='text']").on("change keyup", enableDisableSubmit);\r
\r
        $("div.form_check_group > div.form_check_module").find("select").on("change", enableDisableSubmit);\r
\r
        // For Calling Code & Mobile Number fields, override Parsley method to change DOM position of validation message\r
        window.Parsley.on('field:error', function()\r
        {\r
            if(this.$element.attr("id") == "callingCode")\r
            {\r
                $("#callingCode").parent().prev().after($("#callingCode").next("span.parsley-errors"));\r
            }\r
\r
            if(this.$element.attr("id") == "mobileNumber")\r
            {\r
                $("#mobileNumber").before($("#mobileNumber").next("span.parsley-errors"));\r
				// Force red color on mobile number validation errors\r
                $("#mobileNumber").next("span.parsley-errors").find("span.parsley-error").css("color", "red");\r
            }\r
        });\r
    }\r
\r
    \r
    /*\r
    Function to check if User has verified the reCaptcha\r
    function isCaptchaVerified()\r
    {\r
        return ((grecaptcha) && (grecaptcha.getResponse().length !== 0));\r
    }\r
    */\r
   \r
\r
    // Function to carry out task(s) at the start of Form submit process\r
    function preSubmitProcess()\r
    {\r
        // Disable Submit button\r
        $("#submitform").attr("disabled", true).addClass("disabled");\r
\r
        showOverlay();\r
\r
        // Hide error message\r
        $("#apiError").hide();\r
    }\r
\r
    // Function to show Overlay (with Loader)\r
    function showOverlay()\r
    {\r
        if( $("#overlay").css("display") == "none")\r
        {\r
            $("#overlay").css("display", "block");\r
        }\r
    }\r
\r
    // Function to hide Overlay (with Loader)\r
    function hideOverlay()\r
    {\r
        if( $("#overlay").css("display") == "block")\r
        {\r
            $("#overlay").css("display", "none");\r
        }\r
    }\r
\r
    // Function to show div confirming that data was successfully sent to server\r
    function showSuccess()\r
    {\r
        // Hide div having Form fields\r
        $("div.container").css("display", "none");\r
\r
        // Empty div (having Form fields)\r
        $("div.container").empty();\r
\r
        // Hide div having Error message\r
        $("#hrErr").css("display", "none");\r
\r
        // Empty div (having Error message)\r
        $("#hrErr").empty();\r
\r
        // Scroll to Top\r
        window.scrollTo({\r
        top: 0,\r
        behavior: "smooth"\r
        });\r
\r
        // Show div having Success message\r
        $("#hrTy").css("display", "block");\r
\r
        // Set Timeout for Redirection\r
        window.top.location.href = fields[language]["redirectAfterSuccessUrl"];\r
        //setTimeout(function (){ window.top.location.href = fields[language]["redirectAfterSuccessUrl"]; }, (parseInt(param["redirectAfterSuccessInSecond"], 8) * 1000));\r
		window.parent.postMessage('success_message', '*');  \r
        hideOverlay();\r
		const heightn = document.body.scrollHeight;\r
		parent.postMessage(heightn, '*'); \r
\r
        // Empty div (having Ovelary with Loader)\r
        $("#overlay").empty();\r
\r
        // Adobe Analytics Tracking - Submit Form Event\r
        if (param?.analytics?.enabled) {\r
            _satellite.track("submit_form");\r
        }\r
    }\r
\r
    // Function to show div informing about error\r
    function showError()\r
    {\r
        // Hide div having Form fields\r
        $("div.container").css("display", "none");\r
\r
        // Empty div (having Form fields)\r
        $("div.container").empty();\r
\r
        // Hide div having Success message\r
        $("#hrTy").css("display", "none");\r
\r
        // Empty div (having Success message)\r
        $("#hrTy").empty();\r
\r
        // Scroll to Top\r
        window.scrollTo({\r
        top: 0,\r
        behavior: "smooth"\r
        });\r
\r
        // Show div having Error message\r
        $("#hrErr").css("display", "block");\r
\r
        hideOverlay();\r
\r
        // Empty div (having Ovelary with Loader)\r
        $("#overlay").empty();\r
    }\r
\r
    // Function to parse User Agent to get Platform Type\r
    function getPlatformType()\r
    {\r
        var userAgent = navigator.userAgent.toString();\r
\r
        var platformType = "web";\r
\r
        if(!!(window.EcommAndroidClient || window.flutter_inappwebview) || userAgent.indexOf('samsung-mobile-app') > -1)\r
        {\r
            platformType = "app";\r
        }\r
\r
        return platformType;\r
    }\r
\r
    // Function to Identify HHP using Calling Code & Mobile Number\r
    function identifyHHP(callingCode, mobileNumber)\r
    {\r
        var hhp =  "";\r
\r
        if (callingCode != null && callingCode != "" && mobileNumber != "")\r
        {\r
            hhp = (callingCode + mobileNumber);\r
        }\r
\r
        return hhp;\r
    }\r
\r
    // Function to handle error occurred during API call\r
    function apiCallErrorHandler()\r
    {\r
        // Show error message\r
        $("#apiError").show();\r
\r
        // Enable Submit button so that user can try again\r
        enableDisableSubmit();\r
\r
        // Scroll to Bottom\r
        window.scrollTo({\r
            top: document.body.scrollHeight,\r
            behavior: "smooth"\r
        });\r
\r
        hideOverlay();\r
    }\r
\r
    // Function to Send Data to API\r
    function sendData(request)\r
    {\r
        try\r
        {\r
            fetch(param["apiEndpoint"], {\r
                method: "POST",\r
                headers: {\r
                    "Content-Type": "application/json"\r
                },\r
                body: JSON.stringify(request)\r
            })\r
            .then(response =>\r
            {\r
                if(!(response.ok) || response.status != "200")\r
                {\r
                    apiCallErrorHandler();\r
                }\r
                else\r
                {\r
                    // Submit Success Tagging\r
                    window.parent.postMessage({ type: 'submit_success', content: 'the next galaxy f2h26-pre registration_register' }, '*')\r
					\r
                    showSuccess();\r
                }\r
            }).\r
            catch(error =>\r
            {\r
                apiCallErrorHandler();\r
            });\r
        }\r
        catch(err)\r
        {\r
            apiCallErrorHandler();\r
        }\r
    }\r
\r
    function uuidv4Fallback() {\r
        // Return a RFC4122 version 4 compliant UUID\r
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {\r
            const r = Math.random() * 16 | 0;\r
            const v = c === 'x' ? r : (r & 0x3) | 0x8;\r
            return v.toString(16);\r
        });\r
    }\r
	\r
    // iOS or MacOS \xED\u0152\x90\xEB\xB3\u201E \xED\u2022\xA8\xEC\u02C6\u02DC\r
    function isIOS() {\r
        var ua = navigator.userAgent || navigator.vendor || window.opera;\r
        var iOSClassic = /iPhone|iPad|iPod/.test(ua);\r
        var iPadOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);\r
        var MacOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints <= 1);\r
        var hasMacUA = /Macintosh/.test(ua) && !iPadOS;\r
        return iOSClassic || iPadOS || MacOS || hasMacUA;\r
    }\r
    // Function to create Request data based on User Input & call method to trigger API\r
    function mapParam(userResponse, isSubmitClicked)\r
    {\r
        var dtmCurrent = new Date();\r
\r
        var requestBody = {\r
            app_yn: (getPlatformType() === "app" ? "Y" : "N"),\r
			channel: ch === "" ? param["channel"]["fullForm"] : ch,\r
			channel_detail: chd === "" ? param["channelDetail"]["fullForm"] : chd,\r
            cid: userResponse["campaignId"],\r
            country_alpha_2: userResponse["countryCode"],\r
            deliveryId: userResponse["deliveryId"],\r
            email: userResponse["email"],\r
            first_name: userResponse["firstName"],\r
            hhp: identifyHHP(userResponse["callingCode"], userResponse["mobileNumber"]),\r
            imei: "",\r
            language: userResponse["language"],\r
            last_name: userResponse["lastName"],\r
            mid: "",\r
            pin_code: userResponse["zipCode"],\r
            privacy_policy_yn: (userResponse["privacyPolicy"] === "on" ? "Y" : "N"),\r
            project: param["project"],\r
            q01Answer: userResponse["Q1"],\r
            q02Answer: userResponse["Q2"],\r
            q03Answer: userResponse["Q3"],\r
            q04Answer: userResponse["Q4"],\r
            q05Answer: userResponse["Q5"],\r
            q06Answer: "",\r
            q07Answer: "",\r
            q08Answer: "",\r
            q09Answer: "",\r
            q10Answer: "",\r
            q11Answer: "",\r
            q12Answer: "",\r
            q13Answer: "",\r
            q14Answer: "",\r
            q15Answer: "",\r
            q16Answer: "",\r
            q17Answer: "",\r
            q18Answer: "",\r
            q19Answer: "",\r
            q20Answer: "",\r
            recipientId: userResponse["recipientId"],\r
            registerDatetime: dtmCurrent.toISOString(),\r
            source: param["source"]["fullForm"],\r
            subscribe_yn: (userResponse["subscribe"] === "on" ? "Y" : "N"),\r
            tm_yn: "",\r
            uniqueid: dtmCurrent.getTime() + "_" + (crypto.randomUUID ? crypto.randomUUID() : uuidv4Fallback()) + "_" + Math.floor(Math.random() * 1e12).toString().padStart(12, "0"),\r
            VoucherRequired: param["voucherRequired"],\r
			oneclickFlag: "N",\r
            submitFlag: (isSubmitClicked === true ? "Y" : "N"),\r
            iosFlag: (isIOS() ? "Y" : "N")\r
        };\r
\r
        // Admin-added consent checkboxes beyond the fixed privacy_policy_yn/subscribe_yn\r
        // slots above (see ConsentDefinition in formDefinition.ts) \u2014 an open-ended list,\r
        // so unlike those two there's no way to hardcode a fixed set of named payload\r
        // keys here. Collected generically by the "consentExtra" id convention instead\r
        // (assigned by domIds.ts's consentExtraId()) so a checked consent is never\r
        // silently dropped from what actually gets submitted.\r
        requestBody.additionalConsents = {};\r
\r
        for (var consentKey in userResponse)\r
        {\r
            if (consentKey.indexOf("consentExtra") === 0)\r
            {\r
                requestBody.additionalConsents[consentKey] = (userResponse[consentKey] === "on" ? "Y" : "N");\r
            }\r
        }\r
\r
        return requestBody;\r
    }\r
\r
    try\r
    {\r
        // Get Parameter Value from URL\r
        var frameUrlParam = new URLSearchParams(window.location.search);\r
\r
        var language = frameUrlParam.get("lang") || param["fallbackLanguage"];\r
\r
        var campaignId = frameUrlParam.get("cid") || "";\r
\r
        var deliveryId = frameUrlParam.get("did") || "";\r
\r
        var recipientId = frameUrlParam.get("id") || "";\r
\r
        var countryCode = language.substring(language.indexOf("_") + 1);\r
		\r
		var ch = frameUrlParam.get("ch") || "";\r
			\r
		var chd = frameUrlParam.get("chd") || "";\r
\r
        setFieldData();\r
\r
        setQuestionAndAnswerData();\r
\r
        setValidationMessage();\r
\r
        populateCountryCodeDropdown();\r
\r
        populateCallingCodeDropdown();\r
\r
        attachEvent();\r
\r
        // Load and display submit modal (modal.html) when form is submitted, or none of answers are selected\r
        var submitModalElement = null;\r
        var submitModalResume = null;\r
        var submitModalHasOpened = false;\r
        var submitModalAnsweredAny = false;\r
\r
        var parsleyConfig = {\r
            errorsWrapper: '<span class="parsley-errors"></span>',\r
            errorTemplate: '<span class="parsley-error"></span>',\r
            excluded: 'input[type=button], input[type=submit], input[type=reset], input[type=hidden], input[class=noValidate]',\r
        }\r
\r
        function processValidatedSubmit()\r
        {\r
            preSubmitProcess();\r
\r
            var formElements = document.getElementById("dataForm");\r
\r
            var elementId,\r
                elementName,\r
                objectValue,\r
                cBrBData = {},\r
                formData = [],\r
                elementDataAttr,\r
                userResponse = {},\r
                isSubmitClicked = true;\r
\r
            // Process all the Form Fields\r
            for (i = 0; i < formElements.length; i++)\r
            {\r
                if (formElements.elements[i].type != "hidden")\r
                {\r
                    elementId = formElements.elements[i].id;\r
\r
                    elementName = formElements.elements[i].name;\r
\r
                    elementDataAttr = formElements.elements[i].getAttribute("data-pt-api");\r
\r
                    if (elementDataAttr && elementDataAttr.trim() !== "" && elementDataAttr.trim() === "y")\r
                    {\r
                        if (formElements.elements[i].type == "radio")\r
                        {\r
                            if (!cBrBData[elementName])\r
                            {\r
                                cBrBData[elementName] = [];\r
                            }\r
\r
                            if ($("#" + elementId).is(":checked"))\r
                            {\r
                                cBrBData[elementName].push($("#" + elementId).val());\r
                            }\r
                        }\r
                        else if (formElements.elements[i].type == "checkbox")\r
                        {\r
                            if (!cBrBData[elementName])\r
                            {\r
                                cBrBData[elementName] = [];\r
                            }\r
\r
                            if ($("#" + elementId).is(":checked"))\r
                            {\r
                                cBrBData[elementName].push($("#" + elementId).val());\r
                            }\r
                        }\r
                        else\r
                        {\r
                            objectValue = $("#" + elementId).val();\r
\r
                            formData.push({name: elementName, value: objectValue});\r
                        }\r
                    }\r
                }\r
            }\r
\r
            Object.keys(cBrBData).forEach(function (key)\r
            {\r
                formData.push({ name: key, value: cBrBData[key].join("|") });\r
            });\r
\r
            // Move data from Array to Key / Value pair\r
            for (var i=0, len=formData.length; i < len; i++)\r
            {\r
                userResponse[formData[i]["name"]] = formData[i]["value"];\r
            }\r
\r
            // If Country Code dropdown is present in form, then pick the value from dropdown -- This is already handled above along with other fields (no special handling required).\r
            // If Country Code dropdown is not present in form, then pick the value from URL (parsed from Language).\r
            if(userResponse["countryCode"] == null || userResponse["countryCode"] == undefined)\r
            {\r
                userResponse["countryCode"] = countryCode;\r
            }\r
\r
            // Add data determined earlier (from URL Parameter) to Key / Value pair\r
            userResponse["campaignId"] = campaignId;\r
\r
            userResponse["deliveryId"] = deliveryId;\r
\r
            userResponse["recipientId"] = recipientId;\r
\r
            userResponse["language"] = language;\r
			\r
			//userResponse["subscribe"] = $("#subscribe").val();\r
\r
            userResponse["channel"] = ch;\r
\r
            userResponse["channel_detail"] = chd;\r
\r
            // Call function to map (API) Parameter with User Response & send data to server\r
            sendData(mapParam(userResponse, isSubmitClicked));\r
        }\r
\r
        // Carry out following after the submit button is clicked\r
        $("form").parsley(parsleyConfig).on("form:submit", function ()\r
        {\r
            validateModal() ? showSubmitModal(processValidatedSubmit) : processValidatedSubmit();\r
\r
			/*\r
			Check if reCaptcha is verified\r
			if (($(".g-recaptcha").length) && (!(isCaptchaVerified())))\r
			{\r
				$("#reCaptchaRequired").show();\r
\r
				return false;\r
			}\r
			*/\r
\r
            return false;\r
        });\r
    }\r
    catch(err)\r
    {\r
        showError();\r
    }\r
});\r
\r
function postHeight(e) {\r
   const height = document.body.scrollHeight;\r
   parent.postMessage(height, '*');  \r
};\r
window.addEventListener('load', postHeight);\r
window.addEventListener('resize', postHeight);`;

// src/codegen/js/buildFfJs.ts
function buildFfJs(fileNames) {
  return { path: fileNames.ffJs, contents: REFERENCE_FF_JS };
}

// src/codegen/js/referenceOcJsContent.ts
var REFERENCE_OC_JS = `// Once the document is ready\r
$(document).ready(function ()\r
{    \r
    \r
\r
    // Function to set content for Page Language & Error Message\r
    // It is kept separate instead of being defined within setFieldData to provide handling in case data is not available in config for received language\r
    // If data is not available in config for received language, fallbackLanguage will be used\r
    function setPageContent()\r
    {\r
        // HTML Language\r
        $("html").attr("lang", language.substring(0, language.indexOf("_")));\r
\r
        // HTML Direction (RTL/LTR)\r
        var rtlLangs = ["ar", "he", "ku", "fa", "ur", "yi"];\r
        var langSubtag = language.substring(0, language.indexOf("_"));\r
        $("html").attr("dir", rtlLangs.indexOf(langSubtag) !== -1 ? "rtl" : "ltr");\r
\r
        // Error Message container content\r
        var heading = "",\r
            subHeading = "",\r
            subHeadingUrl = "",\r
            subHeadingUrlText = "";\r
\r
        try\r
        {\r
            heading = page_error[language]["hrErr"]["heading"];\r
\r
            subHeading = page_error[language]["hrErr"]["subHeading"];\r
\r
            subHeadingUrl = page_error[language]["hrErr"]["subHeadingUrl"];\r
\r
            subHeadingUrlText = page_error[language]["hrErr"]["subHeadingUrlText"];\r
        }\r
        catch(err)\r
        {\r
            heading = page_error[param["fallbackLanguage"]]["hrErr"]["heading"];\r
\r
            subHeading = page_error[param["fallbackLanguage"]]["hrErr"]["subHeading"];\r
\r
            subHeadingUrl = page_error[param["fallbackLanguage"]]["hrErr"]["subHeadingUrl"];\r
\r
            subHeadingUrlText = page_error[param["fallbackLanguage"]]["hrErr"]["subHeadingUrlText"];\r
        }\r
        finally\r
        {\r
            $("div#hrErr").find("h3").html(heading);\r
\r
            $("div#hrErr").find("a").attr("href", subHeadingUrl);\r
\r
            $("div#hrErr").find("a").html(subHeadingUrlText);\r
\r
            $("div#hrErr").find("p").html(subHeading + $("div#hrErr").find("p").html());\r
        }\r
    }\r
    \r
    \r
\r
    \r
\r
    // Function to check all the Param(s) expected in URL are available or not\r
    function validateRequiredUrlParam()\r
    {\r
        if(recipientId == "" || recipientId == null || recipientId == undefined)\r
        {\r
            throw new Error("Recipient Id Missing");\r
        }\r
    }\r
\r
    // Function to get value for passed key from fields JSON constant variable (present in Translation JS) based on Language AND set it in respective placeholder\r
    function setFieldData()\r
    {\r
        // Heading\r
        $("div.top_cont h2").html(fields[language]["headingBeforeBreak"] + $("div.top_cont h2").html() + fields[language]["headingAfterBreak"]);\r
\r
        // Campaign Subheading\r
        $("div.top_cont p.top_subheading").html(fields[language]["campaignSubheading"]);\r
\r
        // Required Field Note\r
        $("div.top_cont p").not(".top_subheading").html($("div.top_cont p").not(".top_subheading").html() + fields[language]["requiredField"]);\r
\r
        // Profile Field(s)\r
        $("div.form_top_group").find("div.form_text_bx").each(function()\r
        {\r
            // Field Label\r
            var pFormLabel = $(this).find("p.form_label");\r
            \r
            pFormLabel.html(fields[language]["label"][pFormLabel.parent().find("input, select").attr("id")] + pFormLabel.html());\r
\r
            // Field Placeholder\r
            $(this).find("input, select").each(function()\r
            {\r
                if($(this).attr("placeholder") != undefined)\r
                {\r
                    $(this).attr("placeholder", fields[language]["placeholder"][$(this).attr("id")])\r
                }\r
            });\r
        });\r
\r
        // Privacy Policy, Subscribe, & any admin-added consent checkboxes \u2014 selector\r
        // doesn't require a form_bottom_group parent since this consent group (when\r
        // configured to appear in One-Click) sits outside one, next to the floating\r
        // form_bottom_bar rather than wrapped with it.\r
        $("div.form_bottom_check_group").find("div.form_bottom_check").each(function()\r
        {\r
            // Label\r
            var ckbLabel = $(this).find("label");\r
\r
            ckbLabel.html(fields[language][ckbLabel.attr("for")] + ckbLabel.html());\r
\r
            // Link within Label\r
            var ckbLabelLink = ckbLabel.find("a");\r
\r
            // Is present\r
            if(ckbLabelLink.length === 1)\r
            {\r
                ckbLabelLink.children("img").attr("alt", fields[language][ckbLabel.attr("for") + "Link"]["imageAlt"]);\r
\r
                ckbLabelLink.children("img").attr("src", fields[language][ckbLabel.attr("for") + "Link"]["image"]);\r
\r
                ckbLabelLink.html(fields[language][ckbLabel.attr("for") + "Link"]["label"] + ckbLabelLink.html());\r
\r
                ckbLabelLink.attr("href", fields[language][ckbLabel.attr("for") + "Link"]["url"]);\r
            }\r
        });\r
\r
        // Terms & Conditions link (optional, admin/subsidiary-configured) \u2014 a\r
        // standalone anchor sibling of #btnSubmit, not a form_bottom_check div, so\r
        // it needs its own small population block rather than the generic loop\r
        // above. Only present in the DOM at all when configured (see\r
        // pageTemplate.ts), so this is a no-op otherwise.\r
        var termsAndConditionsLink = $("#termsAndConditionsLink");\r
\r
        if(termsAndConditionsLink.length === 1)\r
        {\r
            termsAndConditionsLink.find("span").html(fields[language]["termsAndConditions"]);\r
\r
            termsAndConditionsLink.attr("href", fields[language]["termsAndConditionsLink"]["url"]);\r
        }\r
\r
        // Submit Button\r
        $("#btnSubmit").html(fields[language]["submitButton"]);\r
        \r
        // Thank You page / section\r
        $("div#hrTy").find("h3").html(fields[language]["hrTy"]["heading"]);\r
\r
        $("div#hrTy").find("a").attr("href", fields[language]["hrTy"]["subHeadingUrl"]);\r
\r
        $("div#hrTy").find("a").html(fields[language]["hrTy"]["subHeadingUrlText"]);\r
\r
        $("div#hrTy").find("p").html(fields[language]["hrTy"]["subHeading"] + $("div#hrTy").find("p").html());\r
    }\r
\r
    // Function to get value for passed key from questions & answers JSON constant variable (present in Translation JS) based on Language AND set it in respective placeholder\r
    function setQuestionAndAnswerData()\r
    {\r
        $("div.form_check_group > div.form_check_module").each(function()\r
        {\r
            var questionId = $(this).attr("id");\r
\r
            // Question\r
            $(this).find("div.form_check_title h3").html(questions[language][questionId]["heading"] + $(this).find("div.form_check_title h3").html());\r
\r
            $(this).find("div.form_check_title p").html(questions[language][questionId]["subheading"]);\r
\r
            // Answer (radio / checkbox only \u2014 a shortText input shares the same\r
            // "name" attribute but has no <label> sibling to populate, and a\r
            // dropdown's <option>s are populated separately below)\r
            $(this).find("input[name='" + questionId + "'][type='radio'], input[name='" + questionId + "'][type='checkbox']").each(function()\r
            {\r
                var input = $(this);\r
\r
                var label = input.next();\r
\r
                if (label.children().length == 0)\r
                {\r
                    // Answer with Text inside <label>\r
                    label.html(answers[language][questionId][input.val()]);\r
                }\r
                else if (label.children().length == 1)\r
                {\r
                    // Answer with Text inside <p> (within <label>)\r
                    label.children("p").html(answers[language][questionId][input.val()]);\r
                }\r
                else if (label.children().length == 2)\r
                {\r
                    // Answer with Text & Image (within <label>)\r
                    label.children("p").html(answers[language][questionId][input.val()]["label"]);\r
\r
                    label.children("img").attr("src", answers[language][questionId][input.val()]["image"]);\r
\r
                    label.children("img").attr("alt", answers[language][questionId][input.val()]["imageAlt"]);\r
                }\r
            });\r
\r
            // Answer (dropdown options)\r
            $(this).find("select").each(function()\r
            {\r
                var select = $(this);\r
\r
                $.each(answers[language][questionId], function(val, text)\r
                {\r
                    select.append($("<option></option>").val(val).html(text));\r
                });\r
            });\r
        });\r
    }\r
	\r
	function setAnswerDataFromParams()\r
	{\r
		$.each(auto_populate_params, function(param, questionId)\r
		{\r
			var val = frameUrlParam.get(param);\r
\r
			if(!val)\r
			{\r
				return;\r
			}\r
\r
			var target = $("#" + questionId);\r
\r
			if(target.is("select"))\r
			{\r
				target.val(val).trigger("change");\r
			}\r
			else\r
			{\r
				$("#" + questionId + val).prop('checked', true);\r
			}\r
		});\r
	}\r
\r
    // Function to get value for passed key from validation_messages JSON constant variable (present in Translation JS) based on Language AND set it as respective (Parsley) Validation Message\r
    function setValidationMessage()\r
    {\r
        $("input[data-parsley-error-message], select[data-parsley-error-message]").each(function()\r
        {\r
            $(this).attr("data-parsley-error-message", validation_messages[language][$(this).attr("id") + "Error"]);\r
        });\r
\r
        $("input[data-parsley-type-message]").each(function()\r
        {\r
            $(this).attr("data-parsley-type-message", validation_messages[language][$(this).attr("id") + "Type"]);\r
        });\r
\r
        $("input[data-parsley-length-message]").each(function()\r
        {\r
            $(this).attr("data-parsley-length-message", validation_messages[language][$(this).attr("id") + "Length"]);\r
        });\r
\r
         $("#apiError").html(validation_messages[language]["apiError"]);\r
        $("#submitIntentPopupMessage1").text(validation_messages[language]["modalMessage_1"]);\r
        $("#submitIntentPopupMessage2").text(validation_messages[language]["modalMessage_2"]);\r
        $("#submitIntentPopupYes").text(validation_messages[language]["modalButtonYes"]);\r
        $("#submitIntentPopupNo").text(validation_messages[language]["modalButtonNo"]);\r
		\r
		$("input[data-parsley-mobile-number-by-country-message]").each(function()\r
        {\r
            $(this).attr("data-parsley-mobile-number-by-country-message", validation_messages[language][$(this).attr("id") + "Error"]);\r
        });\r
    }\r
\r
    // Function to populate Calling Code dropdown\r
    function populateCallingCodeDropdown()\r
    {\r
        // Get Subsidiary from Country Code (parsed from Language)\r
        var subsidiary = country_subsidiary[countryCode];\r
\r
        // Calling Code dropdown\r
        var ddCallingCode = $("#callingCode");\r
\r
        // Set Default Value in Calling Code dropdown\r
        //ddCallingCode.append($("<option></option>").val("0").html(fields[language]["callingCodeDropdownFirstEntry"]));\r
\r
        // Disable First / Default Entry in Calling Code dropdown\r
        $("#callingCode option:first-child").attr("disabled", "disabled").prop("selected", true);\r
\r
        // Set Option(s) in Calling Code dropdown\r
        $.each(subsidiary_detail[subsidiary], function (val, text)\r
        {\r
            // If Calling Code is not blank\r
            if (text.callingCode != "")\r
            {\r
                ddCallingCode.append($("<option></option>").val(text.callingCode).html(text.countryName[language] + " (+" + text.callingCode + ")"));\r
            }\r
        });\r
    }\r
\r
    // Function to reset selected value in Calling Code dropdown if Mobile Number is removed\r
    function resetCallingCode()\r
    {\r
        if($("#mobileNumber").val() == "")\r
        {\r
            // Reset value\r
            $("#callingCode").val("0");\r
\r
            // Remove Parsley validation message\r
            $("#callingCode").parsley().reset();\r
        }\r
    }\r
\r
    // Function to check whether every question marked required (rendered with a "*") currently has an answer\r
    function allRequiredQuestionsAnswered()\r
    {\r
        var allAnswered = true;\r
\r
        $("div.form_check_group > div.form_check_module").each(function()\r
        {\r
            if ($(this).find("div.form_check_title .star").length === 0)\r
            {\r
                return;\r
            }\r
\r
            var textarea = $(this).find("textarea");\r
\r
            var select = $(this).find("select");\r
\r
            var shortTextInput = $(this).find("input[type='text']");\r
\r
            var hasAnswer = (textarea.length > 0)\r
                ? ($.trim(textarea.val()) !== "")\r
                : (select.length > 0)\r
                    ? (select.val() !== "")\r
                    : (shortTextInput.length > 0)\r
                        ? ($.trim(shortTextInput.val()) !== "")\r
                        : ($(this).find("input[type='radio']:checked, input[type='checkbox']:checked").length > 0);\r
\r
            if (!hasAnswer)\r
            {\r
                allAnswered = false;\r
\r
                return false;\r
            }\r
        });\r
\r
        return allAnswered;\r
    }\r
\r
    // Function to check whether every consent checkbox marked required (rendered with\r
    // a "*" in its label) is currently checked \u2014 one-click forms have no consent\r
    // checkboxes by default, in which case this is a no-op (nothing to find, so\r
    // nothing to fail on), but an admin can opt one in for this variant (see\r
    // ConsentDefinition/PrivacyPolicyMeta/ConsentToggleMeta's visibleInVariants in\r
    // formDefinition.ts), same as Full Form.\r
    function allRequiredConsentsChecked()\r
    {\r
        var allChecked = true;\r
\r
        $("div.form_bottom_check_group > div.form_bottom_check").each(function()\r
        {\r
            if ($(this).find("label .star").length === 0)\r
            {\r
                return;\r
            }\r
\r
            if (!$(this).find("input[type='checkbox']").is(":checked"))\r
            {\r
                allChecked = false;\r
\r
                return false;\r
            }\r
        });\r
\r
        return allChecked;\r
    }\r
\r
    // Function to enable Submit button once every required consent (if any are configured for this variant) is checked & every required question has an answer (else keep Submit button disabled)\r
    function enableDisableSubmit()\r
    {\r
        if (allRequiredConsentsChecked() && allRequiredQuestionsAnswered())\r
        {\r
            $("#btnSubmit").prop("disabled", false);\r
\r
            $("#btnSubmit").removeClass("disabled");\r
        }\r
        else\r
        {\r
            $("#btnSubmit").prop("disabled", true);\r
\r
            $("#btnSubmit").addClass("disabled");\r
        }\r
    }\r
\r
    function validateModal()\r
    {\r
        // Check whether any questions in the form have been answered\r
        submitModalAnsweredAny = $('[data-pt-api="y"][name^=Q]').filter((i, el) => el.checked).length > 0;\r
\r
		//submitModalWithsub = $("#subscribe").is(":checked");\r
        return !submitModalHasOpened && !submitModalAnsweredAny;\r
    }\r
\r
    function closeSubmitModalWithNo()\r
    {\r
        if (submitModalElement)\r
        {\r
            submitModalElement.removeClass("popup--open");\r
        }\r
    }\r
	\r
	function closeSubmitModalWithYes()\r
    {\r
		$("#subscribe").val("on");\r
        if (submitModalElement)\r
        {\r
            submitModalElement.removeClass("popup--open");\r
        }\r
        submitModalHasOpened = false;\r
    }\r
\r
    function showSubmitModal(resumeCallback)\r
    {\r
        submitModalResume = typeof resumeCallback === "function" ? resumeCallback : null;\r
\r
        if (!submitModalElement) // Bind events once\r
        {\r
            submitModalElement = $("#submitIntentPopup");\r
            submitModalElement.find("#submitIntentPopupYes, .popup__close, .popup__dimmed").on("click", closeSubmitModal);\r
            submitModalElement.find("#submitIntentPopupNo").on("click", function ()\r
            {\r
                closeSubmitModal();\r
\r
                if (submitModalResume)\r
                {\r
                    submitModalResume();\r
                    submitModalResume = null;\r
                }\r
            });\r
        }\r
\r
        submitModalElement.addClass("popup--open");\r
        submitModalHasOpened = true;\r
    }\r
\r
    // Function to attach different event(s) to various element(s)\r
    function attachEvent()\r
    {\r
        // Add Parsley Custom Validator to validate Calling Code (value should be selected in dropdown if Mobile Number is entered)\r
        window.Parsley.addValidator("requiredIf", {\r
            validateString : function(value, requirement)\r
            {\r
                if($(requirement).parsley().isValid())\r
                {\r
                    if (jQuery(requirement).val())\r
                    {\r
                        return !!value;\r
                    }\r
                }\r
\r
                return true;\r
            }\r
        });\r
\r
		// Build callingCode -> countryCode mapping from subsidiary_detail\r
        var callingCodeToCountry = {};\r
        $.each(subsidiary_detail, function(subsidiary, countries) {\r
            $.each(countries, function(i, country) {\r
                if (country.callingCode && country.callingCode !== "") {\r
                    callingCodeToCountry[country.callingCode] = country.countryCode;\r
                }\r
            });\r
        });\r
\r
        // Custom Parsley Validator - validate mobile number against selected calling code using libphonenumber-js\r
        window.Parsley.addValidator("mobileNumberByCountry", {\r
            validateString: function (value) {\r
                if (value.trim() === "") return true; // empty value handled by required-if on callingCode\r
\r
                var callingCode = $("#callingCode").val();\r
                if (!callingCode || callingCode === "0") return false;\r
\r
                // Digit-length correctness is left entirely to libphonenumber-js's own\r
                // per-country numbering-plan metadata below (isValid()) rather than a\r
                // hardcoded "9 digits for UAE, 8 for everyone else" guess \u2014 that guess\r
                // was wrong for other countries this same dropdown offers (e.g. Saudi\r
                // Arabia also needs 9 digits, not 8), and redundant even where it\r
                // happened to be right, since isValid() already enforces the correct\r
                // length for whichever country was actually selected.\r
                var fullNumber = "+" + callingCode + value;\r
                try {\r
                    var phoneNumber = libphonenumber.parsePhoneNumberFromString(fullNumber);\r
                    return phoneNumber && phoneNumber.isValid();\r
                } catch (e) {\r
                    return false;\r
                }\r
            },\r
            message: "Enter a valid mobile number"\r
        });\r
        // Clear / reset user entered data (from Profile fields)\r
        $(".btn_clear").on("click", function()\r
        {\r
            // Parent of element having btn_clear class\r
            var parent = $(this).parent();\r
\r
            // Find input field present in parent container (having element with btn_clear class)\r
            var inputField = parent.find("input");\r
\r
            // If input field is present\r
            if (inputField.length === 1)\r
            {\r
                // Reset input field value\r
                inputField.val("");\r
\r
                // Remove Parsley validation message\r
                inputField.parsley().reset();\r
\r
                // Find second parent (parent element's parent) of element having btn_clear class\r
                var secondParent = parent.parent();\r
\r
                // Find dropdown field present in secodn parent container\r
                var ddSelect = secondParent.find("select");\r
\r
                // If dropdown is present && is dependent on input field\r
                if((ddSelect.length === 1) && (ddSelect.attr("data-parsley-required-if") != undefined) && (ddSelect.attr("data-parsley-required-if") == ("#" + inputField.attr("id"))))\r
                {\r
                    // Reset dropdown value\r
                    ddSelect.val(secondParent.find("select option:first-child").val());\r
\r
                    // Remove Parsley validation message\r
                    ddSelect.parsley().reset();\r
                }\r
            }\r
        });\r
\r
        // Attach event to reset Calling Code if Mobile Number is removed\r
        $("#mobileNumber").on("change", resetCallingCode);\r
\r
        // Attach event to check Submit button state (enabled / disabled) on check / uncheck of any consent checkbox configured for this variant (none by default) & any required question's answer(s)\r
        $("div.form_bottom_check_group input[type='checkbox']").on("change", enableDisableSubmit);\r
\r
        // Attach event to check Submit button state (enabled / disabled) on check / uncheck of any required question's answer(s)\r
        $("div.form_check_group > div.form_check_module").find("input[type='radio'], input[type='checkbox']").on("change", enableDisableSubmit);\r
\r
        $("div.form_check_group > div.form_check_module").find("textarea, input[type='text']").on("change keyup", enableDisableSubmit);\r
\r
        $("div.form_check_group > div.form_check_module").find("select").on("change", enableDisableSubmit);\r
        // Floating submit button (outside form) \u2014 trigger Parsley validation on click\r
        // $("#btnSubmit").on("click", function ()\r
        // {\r
            // var $form = $("#dataForm").parsley();\r
\r
            // if ($form.isValid())\r
            // {\r
                // validateModal() ? showSubmitModal(processValidatedSubmit) : processValidatedSubmit();\r
            // }\r
            // else\r
            // {\r
                // $form.validate();\r
            // }\r
        // });\r
\r
\r
        // For Calling Code & Mobile Number fields, override Parsley method to change DOM position of validation message\r
        window.Parsley.on('field:error', function()\r
        {\r
            if(this.$element.attr("id") == "callingCode")\r
            {\r
                $("#callingCode").parent().prev().after($("#callingCode").next("span.parsley-errors"));\r
            }\r
\r
            if(this.$element.attr("id") == "mobileNumber")\r
            {\r
                $("#mobileNumber").before($("#mobileNumber").next("span.parsley-errors"));\r
				// Force red color on mobile number validation errors\r
                $("#mobileNumber").next("span.parsley-errors").find("span.parsley-error").css("color", "red");\r
            }\r
        });\r
    }\r
\r
    // Function to carry out task(s) at the start of Form submit process\r
    function preSubmitProcess()\r
    {\r
		//submitFlag = true;\r
        // Disable Submit button\r
        $("#btnSubmit").attr("disabled", true).addClass("disabled");\r
\r
        showOverlay();\r
\r
        // Hide error message\r
        $("#apiError").hide();\r
    }\r
\r
    // Function to show Overlay (with Loader)\r
    function showOverlay()\r
    {\r
        if( $("#overlay").css("display") == "none")\r
        {\r
            $("#overlay").css("display", "block");\r
        }\r
    }\r
\r
    // Function to hide Overlay (with Loader)\r
    function hideOverlay()\r
    {\r
        if( $("#overlay").css("display") == "block")\r
        {\r
            $("#overlay").css("display", "none");\r
        }\r
    }\r
\r
    // Function to show div confirming that data was successfully sent to server\r
    function showSuccess()\r
    {\r
        // Hide div having Form fields\r
        $("div.container_oc").css("display", "none");\r
\r
        // Empty div (having Form fields)\r
        $("div.container_oc").empty();\r
\r
        // Hide div having Error message\r
        $("#hrErr").css("display", "none");\r
\r
        // Empty div (having Error message)\r
        $("#hrErr").empty();\r
\r
        // Scroll to Top\r
        window.scrollTo({\r
        top: 0,\r
        behavior: "smooth"\r
        });\r
\r
        // Show div having Success message\r
        $("#hrTy").css("display", "block");\r
\r
        // Set Timeout for Redirection\r
		window.top.location.href = fields[language]["redirectAfterSuccessUrl"];\r
        //setTimeout(function (){ window.top.location.href = fields[language]["redirectAfterSuccessUrl"]; }, (parseInt(param["redirectAfterSuccessInSecond"], 10) * 1000));\r
\r
        hideOverlay();\r
\r
        // Empty div (having Ovelary with Loader)\r
        $("#overlay").empty();\r
\r
        // Adobe Analytics Tracking - Submit Form Event\r
        if (param?.analytics?.enabled) {\r
            _satellite.track("submit_form");\r
        }\r
    }\r
\r
    // Function to show div informing about error\r
    function showError()\r
    {\r
        // Hide div having Form fields\r
        $("div.container_oc").css("display", "none");\r
\r
        // Empty div (having Form fields)\r
        $("div.container_oc").empty();\r
\r
        // Hide div having Success message\r
        $("#hrTy").css("display", "none");\r
\r
        // Empty div (having Success message)\r
        $("#hrTy").empty();\r
\r
        // Scroll to Top\r
        window.scrollTo({\r
        top: 0,\r
        behavior: "smooth"\r
        });\r
\r
        // Show div having Error message\r
        $("#hrErr").css("display", "block");\r
\r
        hideOverlay();\r
\r
        // Empty div (having Ovelary with Loader)\r
        $("#overlay").empty();\r
    }\r
\r
    // Function to parse User Agent to get Platform Type\r
    function getPlatformType()\r
    {\r
        var userAgent = navigator.userAgent.toString();\r
\r
        var platformType = "web";\r
\r
        if(!!(window.EcommAndroidClient || window.flutter_inappwebview) || userAgent.indexOf('samsung-mobile-app') > -1)\r
        {\r
            platformType = "app";\r
        }\r
\r
        return platformType;\r
    }\r
\r
    // Function to Identify HHP using Calling Code & Mobile Number\r
    function identifyHHP(callingCode, mobileNumber)\r
    {\r
        var hhp =  "";\r
\r
        if (callingCode != null && callingCode != "" && mobileNumber != "")\r
        {\r
            hhp = (callingCode + mobileNumber);\r
        }\r
\r
        return hhp;\r
    }\r
\r
    // Function to handle error occurred during API call\r
    function apiCallErrorHandler(isSubmitClicked)\r
    {\r
        if(isSubmitClicked)\r
        {\r
            // Show error message\r
            $("#apiError").show();\r
\r
            // Enable Submit button so that user can try again\r
            enableDisableSubmit();\r
\r
            // Scroll to Bottom\r
            window.scrollTo({\r
                top: document.body.scrollHeight,\r
                behavior: "smooth"\r
            });\r
        }\r
\r
        hideOverlay();\r
    }\r
    \r
\r
    // Function to Send Data to API\r
    function sendData(request, isSubmitClicked)\r
    {\r
        try\r
        {\r
            fetch(param["apiEndpoint"], {\r
                method: "POST",\r
                headers: {\r
                    "Content-Type": "application/json"\r
                },\r
                body: JSON.stringify(request)\r
            })\r
            .then(response =>\r
            {\r
                if(!(response.ok) || response.status != "200")\r
                {\r
                    apiCallErrorHandler(isSubmitClicked);\r
                }\r
                else\r
                {\r
                    if(isSubmitClicked)\r
                    {\r
                        showSuccess();\r
                    }\r
                    else\r
                    {\r
                        hideOverlay();\r
                    }\r
                }\r
            }).\r
            catch(error =>\r
            {\r
                apiCallErrorHandler(isSubmitClicked);\r
            });\r
        }\r
        catch(err)\r
        {\r
            apiCallErrorHandler(isSubmitClicked);\r
        }\r
    }\r
 // iOS or MacOS \xED\u0152\x90\xEB\xB3\u201E \xED\u2022\xA8\xEC\u02C6\u02DC\r
    function isIOS() {\r
        var ua = navigator.userAgent || navigator.vendor || window.opera;\r
        var iOSClassic = /iPhone|iPad|iPod/.test(ua);\r
        var iPadOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);\r
        var MacOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints <= 1);\r
        var hasMacUA = /Macintosh/.test(ua) && !iPadOS;\r
        return iOSClassic || iPadOS || MacOS || hasMacUA;\r
    }\r
    // Function to create Request data based on User Input & call method to trigger API\r
    function mapParam(userResponse, isSubmitClicked)\r
    {\r
		if(isSubmitClicked === false ? userResponse["Q1"] = "": userResponse["Q1"] = userResponse["Q1"]);\r
        var dtmCurrent = new Date();\r
\r
        var requestBody = {\r
            app_yn: (getPlatformType() === "app" ? "Y" : "N"),\r
			channel: ch === "" ? param["channel"]["oneClick"] : ch,\r
			channel_detail: chd === "" ? param["channelDetail"]["oneClick"] : chd,\r
            cid: userResponse["campaignId"],\r
            country_alpha_2: userResponse["countryCode"],\r
            deliveryId: userResponse["deliveryId"],\r
            email: userResponse["email"] || "",\r
            first_name: userResponse["firstName"] || "",\r
            hhp: identifyHHP(userResponse["callingCode"], userResponse["mobileNumber"]),\r
            imei: "",\r
            language: userResponse["language"],\r
            last_name: userResponse["lastName"] || "",\r
            mid: "",\r
            pin_code: userResponse["zipCode"] || "",\r
            // One-Click has no Privacy Policy checkbox by default (recipients already\r
            // consented via the channel that delivered their link, hence "Y" always) \u2014\r
            // but an admin can opt one into this variant (see PrivacyPolicyMeta's\r
            // visibleInVariants), in which case its real checked state is used instead\r
            // of the assumed default. \`userResponse["privacyPolicy"]\` is only ever set\r
            // at all when that checkbox actually exists in the DOM (see the data-pt-api\r
            // scan below), so its presence is exactly the signal needed here.\r
            privacy_policy_yn: (userResponse["privacyPolicy"] !== undefined ? (userResponse["privacyPolicy"] === "on" ? "Y" : "N") : "Y"),\r
            project: param["project"],\r
            q01Answer: userResponse["Q1"],\r
            q02Answer: userResponse["Q2"],\r
            q03Answer: userResponse["Q3"],\r
            q04Answer: userResponse["Q4"],\r
            q05Answer: userResponse["Q5"],\r
            q06Answer: "",\r
            q07Answer: "",\r
            q08Answer: "",\r
            q09Answer: "",\r
            q10Answer: "",\r
            q11Answer: "",\r
            q12Answer: "",\r
            q13Answer: "",\r
            q14Answer: "",\r
            q15Answer: "",\r
            q16Answer: "",\r
            q17Answer: "",\r
            q18Answer: "",\r
            q19Answer: "",\r
            q20Answer: "",\r
            recipientId: userResponse["recipientId"],\r
            registerDatetime: dtmCurrent.toISOString(),\r
            source: param["source"]["oneClick"],\r
            // Same reasoning as privacy_policy_yn above \u2014 Marketing Opt-in's own\r
            // visibleInVariants controls whether #subscribe exists in this variant.\r
            subscribe_yn: (userResponse["subscribe"] !== undefined ? (userResponse["subscribe"] === "on" ? "Y" : "N") : "Y"),\r
            tm_yn: "",\r
            uniqueid: dtmCurrent.getTime() + "_" + crypto.randomUUID() + "_" + Math.floor(Math.random() * 1e12).toString().padStart(12, "0"),\r
            VoucherRequired: param["voucherRequired"],\r
			oneclickFlag: "Y",\r
            submitFlag: (isSubmitClicked === true ? "Y" : "N"),\r
            iosFlag: (isIOS() ? "Y" : "N")\r
        };\r
\r
        // Admin-added consent checkboxes beyond the fixed privacy_policy_yn/subscribe_yn\r
        // slots above (see ConsentDefinition in formDefinition.ts) \u2014 an open-ended list,\r
        // so unlike those two there's no way to hardcode a fixed set of named payload\r
        // keys here. Collected generically by the "consentExtra" id convention instead\r
        // (assigned by domIds.ts's consentExtraId()), same as the Full Form script, so a\r
        // checked consent is never silently dropped from what actually gets submitted.\r
        requestBody.additionalConsents = {};\r
\r
        for (var consentKey in userResponse)\r
        {\r
            if (consentKey.indexOf("consentExtra") === 0)\r
            {\r
                requestBody.additionalConsents[consentKey] = (userResponse[consentKey] === "on" ? "Y" : "N");\r
            }\r
        }\r
\r
        sendData(requestBody, isSubmitClicked);\r
    }\r
\r
    // Function to Process User Input & transfer flow for further processing\r
    // This methoed will be called:\r
    // 1 - When the page is viewed - This call will register Recipient as HR (blank / default data will be passed for form fields)\r
    // 2 - When user clicks the Submit button - This call will send User Response to API\r
    // Input variable received by this method is to differentiate between the 2 method calls mentioned above\r
    function processFormData(isSubmitClicked)\r
    {\r
        var formElements = document.getElementById("dataForm");\r
\r
        var elementId,\r
            elementName,\r
            objectValue,\r
            cBrBData = {},\r
            formData = [],\r
            elementDataAttr,\r
            userResponse = {};\r
\r
        // Process all the Form Fields\r
        for (i = 0; i < formElements.length; i++)\r
        {\r
            if (formElements.elements[i].type != "hidden")\r
            {\r
                elementId = formElements.elements[i].id;\r
\r
                elementName = formElements.elements[i].name;\r
\r
                elementDataAttr = formElements.elements[i].getAttribute("data-pt-api");\r
\r
                if (elementDataAttr && elementDataAttr.trim() !== "" && elementDataAttr.trim() === "y")\r
                {\r
                    if (formElements.elements[i].type == "radio")\r
                    {\r
                        if (!cBrBData[elementName])\r
                        {\r
                            cBrBData[elementName] = [];\r
                        }\r
\r
                        if ($("#" + elementId).is(":checked"))\r
                        {\r
                            cBrBData[elementName].push($("#" + elementId).val());\r
                        }\r
                    }\r
                    else if (formElements.elements[i].type == "checkbox")\r
                    {\r
                        if (!cBrBData[elementName])\r
                        {\r
                            cBrBData[elementName] = [];\r
                        }\r
\r
                        if ($("#" + elementId).is(":checked"))\r
                        {\r
                            cBrBData[elementName].push($("#" + elementId).val());\r
                        }\r
                    }\r
                    else\r
                    {\r
                        objectValue = $("#" + elementId).val();\r
\r
                        formData.push({name: elementName, value: objectValue});\r
                    }\r
                }\r
            }\r
        }\r
\r
        Object.keys(cBrBData).forEach(function (key)\r
        {\r
            formData.push({ name: key, value: cBrBData[key].join("|") });\r
        });\r
\r
        // Move data from Array to Key / Value pair\r
        for (var i=0, len=formData.length; i < len; i++)\r
        {\r
            userResponse[formData[i]["name"]] = formData[i]["value"];\r
        }\r
\r
        // If Country Code dropdown is present in form, then pick the value from dropdown -- This is already handled above along with other fields (no special handling required).\r
        // If Country Code dropdown is not present in form, then pick the value from URL (parsed from Language).\r
        if(userResponse["countryCode"] == null || userResponse["countryCode"] == undefined)\r
        {\r
            userResponse["countryCode"] = countryCode;\r
        }\r
\r
        // Add data determined earlier (from URL Parameter) to Key / Value pair\r
        userResponse["campaignId"] = campaignId;\r
\r
        userResponse["deliveryId"] = deliveryId;\r
\r
        userResponse["recipientId"] = recipientId;\r
\r
        userResponse["language"] = language;\r
		\r
		userResponse["subscribe"] = $("#subscribe").val();\r
		\r
        userResponse["channel"] = ch;\r
\r
        userResponse["channel_detail"] = chd;\r
\r
        // Call function to map API Parameter with User Response & send data to server\r
        mapParam(userResponse, isSubmitClicked);\r
    }\r
\r
    try\r
    {\r
        showOverlay();\r
\r
        // Get Parameter Value from URL\r
        var frameUrlParam = new URLSearchParams(window.location.search);\r
\r
        var language = frameUrlParam.get("lang") || param["fallbackLanguage"];\r
\r
        var campaignId = frameUrlParam.get("cid") || "";\r
\r
        var deliveryId = frameUrlParam.get("did") || "";\r
\r
        var recipientId = frameUrlParam.get("id") || "";\r
\r
        var countryCode = language.substring(language.indexOf("_") + 1);\r
\r
		var ch = frameUrlParam.get("ch") || "";\r
			\r
		var chd = frameUrlParam.get("chd") || "";\r
		\r
		//var submitFlag = false;\r
\r
        setPageContent();\r
\r
        validateRequiredUrlParam();\r
\r
        setFieldData();\r
\r
        setQuestionAndAnswerData();\r
\r
        setValidationMessage();\r
\r
        populateCallingCodeDropdown();\r
\r
        attachEvent();\r
\r
		setAnswerDataFromParams();\r
\r
		enableDisableSubmit();\r
\r
        // Load and display submit modal when form is submitted, or none of answers are selected\r
        var submitModalElement = null;\r
        var submitModalResume = null;\r
        var submitModalHasOpened = false;\r
        var submitModalAnsweredAny = false;\r
\r
        // Call method to send data to API and register Recipient as HR\r
        // Varaible false passed to method call confirms that the Submit button wasn't clicked\r
		processFormData(false);\r
\r
        function processValidatedSubmit()\r
        {\r
            preSubmitProcess();\r
\r
            // Varaible true passed to method call confirms that the Submit button wasn clicked\r
            processFormData(true);\r
        }\r
\r
        var parsleyConfig = {\r
            errorsWrapper: '<span class="parsley-errors"></span>',\r
            errorTemplate: '<span class="parsley-error"></span>',\r
            excluded: 'input[type=button], input[type=submit], input[type=reset], input[type=hidden], input[class=noValidate]',\r
        }\r
\r
        // Carry out following after the submit button is clicked\r
        $("#btnSubmit").on("click", function() {\r
            $("#dataForm").trigger("submit");\r
        });\r
        $("form").parsley(parsleyConfig).on("form:submit", function ()\r
        {\r
           validateModal() ? showSubmitModal(processValidatedSubmit) : processValidatedSubmit();\r
\r
           return false;\r
        });\r
    }\r
    catch(err)\r
    {\r
        showError();\r
    }\r
});\r
\r
//OC_JS Final Update 08/07/2027 10:30:00 UAE\r
//All update align with MENAO and SUWON.\r
//All data tested.\r
//Commented on 08/07/2027 15:22:00 UAE\r
//Commented on 14/07/2027 11:22:00 UAE`;

// src/codegen/js/buildOcJs.ts
function buildOcJs(fileNames) {
  return { path: fileNames.ocJs, contents: REFERENCE_OC_JS };
}

// src/codegen/generate.ts
function generateSolution(form, config) {
  const fileNames = resolveFileNames(form, config);
  const effectiveForm = config.questionRequired ? {
    ...form,
    questions: form.questions.map((q) => {
      const override = config.questionRequired?.[q.id];
      if (override === void 0) return q;
      return { ...q, required: override };
    })
  } : form;
  const files = [];
  if (config.variants.includes("ff")) {
    files.push(buildFfHtml(effectiveForm, config, fileNames));
    files.push(buildFfJs(fileNames));
  }
  if (config.variants.includes("oc")) {
    files.push(buildOcHtml(effectiveForm, config, fileNames));
    files.push(buildOcJs(fileNames));
  }
  files.push(buildDataJs(effectiveForm, config, fileNames));
  files.push(buildStyleCss(fileNames));
  return files;
}

// src/codegen/types.ts
function defaultBuilderConfig() {
  return {
    variants: ["ff"],
    apiEndpoint: "",
    analytics: { enabled: false },
    fileNamePrefix: "",
    faviconUrl: "",
    customFontsHref: "",
    project: "",
    channel: { fullForm: "", oneClick: "" },
    channelDetail: { fullForm: "", oneClick: "" },
    source: { fullForm: "", oneClick: "" },
    voucherRequired: "N"
  };
}
export {
  CALLING_CODES,
  ENGLISH_LOCALE,
  RTL_LANGS,
  applyContribution,
  buildQuestionMasterRows,
  buildQuestionMasterWorkbook,
  contributionContentSchema,
  defaultBuilderConfig,
  findCallingCodeEntry,
  formDefinitionSchema,
  generateSolution,
  isRtlLangSubtag,
  isSupportedExcelFile,
  langDisplayName,
  mapWorkbook,
  migrateDefaultLocale,
  parseWorkbook,
  resolveFileNames,
  resolveLocales,
  resolveLocalizedText,
  translationEntrySchema,
  translationTargetSchema,
  validateContribution,
  validateFormDefinition,
  validateWorkbook
};
//# sourceMappingURL=index.js.map