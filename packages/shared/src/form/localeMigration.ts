/**
 * Content migration for changing a form's default/fallback locale. Every
 * `*ByLocale` map in `FormDefinition` resolves via `resolveLocalizedText(map,
 * locale, defaultLocale)` — `map[locale] ?? map[defaultLocale] ?? ""` — so if the
 * default changes (e.g. an admin reorders locales, or removes the current default)
 * while text stays filed under the *old* default's code, viewing the form in the
 * new default locale would resolve to "" everywhere that text was never separately
 * translated. `migrateDefaultLocale` walks the whole definition and backfills the
 * new default's slot from the old one wherever the new default doesn't already
 * have its own (translated) text, so the form keeps rendering the same content —
 * just filed under the new default's code — the moment the default changes.
 */
import type { FormDefinition, LocaleCode } from "./formDefinition";

function migrateTextMap(
  map: Record<LocaleCode, string>,
  oldLocale: LocaleCode,
  newLocale: LocaleCode,
  removeOld: boolean,
): Record<LocaleCode, string> {
  const next = { ...map };
  if (next[oldLocale] && !next[newLocale]) {
    next[newLocale] = next[oldLocale];
  }
  if (removeOld) delete next[oldLocale];
  return next;
}

/** Same idea as migrateTextMap but for `Record<LocaleCode, T>` maps whose values
 * are whole objects (PageCopy/ValidationMessageSet) rather than plain strings —
 * merges field-by-field so a new-default entry that already has *some* fields set
 * (e.g. just `heading`) still gets backfilled for the fields it's missing, without
 * clobbering the ones it already has. */
function migrateObjectMap<T extends object>(
  map: Record<LocaleCode, T>,
  oldLocale: LocaleCode,
  newLocale: LocaleCode,
  removeOld: boolean,
): Record<LocaleCode, T> {
  const next = { ...map };
  const oldValue = next[oldLocale];
  if (oldValue) {
    next[newLocale] = next[newLocale] ? { ...oldValue, ...next[newLocale] } : oldValue;
  }
  if (removeOld) delete next[oldLocale];
  return next;
}

export interface MigrateDefaultLocaleOptions {
  /** Deletes the old default's own entries afterward — set when that locale is
   * being removed from the form entirely (see LocaleManagerPanel's removeLocale).
   * Leave false for a plain reorder: the old locale stays on the form, so its own
   * content should stay too, just no longer serving as the fallback. */
  removeOldLocale?: boolean;
}

/**
 * Returns a new `FormDefinition` with `meta.defaultLocale` set to
 * `newDefaultLocale` and every locale-keyed field backfilled accordingly. Pure —
 * never mutates `form`. A no-op (returns `form` as-is) if `newDefaultLocale` is
 * already the default.
 */
export function migrateDefaultLocale(
  form: FormDefinition,
  newDefaultLocale: LocaleCode,
  options: MigrateDefaultLocaleOptions = {},
): FormDefinition {
  const oldDefaultLocale = form.meta.defaultLocale;
  if (oldDefaultLocale === newDefaultLocale) return form;
  const removeOld = options.removeOldLocale ?? false;

  const next: FormDefinition = JSON.parse(JSON.stringify(form));
  const text = (map: Record<LocaleCode, string>) => migrateTextMap(map, oldDefaultLocale, newDefaultLocale, removeOld);

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
    if (f.privacyPolicy.linkTextByLocale) f.privacyPolicy.linkTextByLocale = text(f.privacyPolicy.linkTextByLocale);
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
    const nextExtra: Record<string, Record<LocaleCode, string>> = {};
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
