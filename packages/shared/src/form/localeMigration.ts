/**
 * Content migration for changing a form's locale set. Every `*ByLocale` map in
 * `FormDefinition` resolves via `resolveLocalizedText(map, locale, defaultLocale)` —
 * `map[locale] ?? map[defaultLocale] ?? ""` — so whenever locale codes change (the
 * default is swapped, or the whole locale set is replaced for a different
 * subsidiary) while text stays filed under the *old* codes, viewing the form under
 * the new codes would resolve to "" everywhere that text was never separately
 * translated. Both functions below walk the whole definition and refile content
 * under the new codes so the form keeps rendering the same content it did before,
 * just under different keys — `applyLocaleFieldTransform` is the shared field list
 * (every locale-keyed field FormDefinition has) both are built on, so a new
 * locale-keyed field only needs to be added in one place.
 */
import type { FormDefinition, LocaleCode, LocaleInfo } from "./formDefinition";

/** Every locale-keyed field in `FormDefinition`, rewritten via `text` (plain
 * string maps) and `obj` (PageCopy/ValidationMessageSet object maps) — shared by
 * migrateDefaultLocale (one old code -> one new code) and remapLocalesForCopy
 * (a whole new locale set, each pulling from a different source code) so they
 * can't drift out of sync on which fields actually get migrated. Pure — never
 * mutates `form`; both callers do their own `meta.defaultLocale`/`locales`
 * assignment on the object this returns. */
function applyLocaleFieldTransform(
  form: FormDefinition,
  text: (map: Record<LocaleCode, string>) => Record<LocaleCode, string>,
  obj: <T extends object>(map: Record<LocaleCode, T>) => Record<LocaleCode, T>,
): FormDefinition {
  const next: FormDefinition = JSON.parse(JSON.stringify(form));

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
  if (f.headingBeforeBreakFFByLocale) f.headingBeforeBreakFFByLocale = text(f.headingBeforeBreakFFByLocale);
  if (f.headingAfterBreakFFByLocale) f.headingAfterBreakFFByLocale = text(f.headingAfterBreakFFByLocale);
  if (f.campaignSubheadingByLocale) f.campaignSubheadingByLocale = text(f.campaignSubheadingByLocale);
  if (f.campaignSubheadingFFByLocale) f.campaignSubheadingFFByLocale = text(f.campaignSubheadingFFByLocale);
  if (f.requiredFieldNoteByLocale) f.requiredFieldNoteByLocale = text(f.requiredFieldNoteByLocale);
  if (f.extraFieldsByLocale) {
    const nextExtra: Record<string, Record<LocaleCode, string>> = {};
    for (const [key, map] of Object.entries(f.extraFieldsByLocale)) {
      nextExtra[key] = text(map);
    }
    f.extraFieldsByLocale = nextExtra;
  }

  next.validationMessages = obj(next.validationMessages);
  next.pageError = obj(next.pageError);
  next.thankYou = obj(next.thankYou);

  return next;
}

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

  const text = (map: Record<LocaleCode, string>) => migrateTextMap(map, oldDefaultLocale, newDefaultLocale, removeOld);
  const obj = <T extends object>(map: Record<LocaleCode, T>) => migrateObjectMap(map, oldDefaultLocale, newDefaultLocale, removeOld);

  const next = applyLocaleFieldTransform(form, text, obj);
  next.meta.defaultLocale = newDefaultLocale;
  return next;
}

/**
 * Rebuilds a `FormDefinition` for an entirely different locale set — used when
 * copying a form from one subsidiary into another whose approved locales don't
 * overlap the source's at all (see formBuilderService.createForm's copyFromFormId
 * handling). Each locale in `newLocales` pulls its content from whichever of the
 * form's *current* locales shares its language subtag (ignoring country) — so
 * copying a form with `en_SA`/`ar_SA` into a subsidiary offering
 * `en_JO`/`en_LB`/`ar_IQ`/`ku_IQ` maps both English targets from `en_SA`, both
 * Arabic targets from `ar_SA`, and `ku_IQ` (no Kurdish in the source) falls back
 * to the source's own default/fallback locale's content — same as any other
 * untranslated locale already resolves to at runtime via resolveLocalizedText,
 * just made explicit here so every generated per-locale data-file key actually
 * has content instead of relying on a runtime fallback chain. When more than one
 * source locale shares a target's language, the source's own default locale wins
 * if it's one of them, else the first match in `form.locales` order.
 *
 * Unlike migrateDefaultLocale, old locale codes are dropped entirely (not kept
 * alongside) — they're not part of the new locale set at all, so keeping their
 * text around would just be unreachable clutter. `newDefaultLocale` must be the
 * `code` of one of `newLocales`.
 *
 * Also rederives the builder-only mobile-number field's own `countries`/
 * `countriesByLocale` (see MobileNumberFieldMeta) from `newLocales`' own
 * country suffixes rather than the text/obj remapping above: carrying over the
 * *source* subsidiary's countries would validate mobile numbers against the
 * wrong country once this is a different subsidiary's form (e.g. a Jordan/
 * Lebanon/Iraq subsidiary shouldn't keep validating against the source's UAE
 * numbers). Every old `countriesByLocale` override is dropped (old locale
 * codes don't exist in the new set) and replaced with a fresh one-country-per-
 * locale default — each new locale gets its own single country to start,
 * broadenable later per locale via the builder UI — with `countries` set to
 * their union as the fallback for any locale without its own entry. Left
 * untouched if the new locale set's codes don't resolve to any country suffix
 * at all.
 */
export function remapLocalesForCopy(form: FormDefinition, newLocales: LocaleInfo[], newDefaultLocale: LocaleCode): FormDefinition {
  const oldDefaultLocale = form.meta.defaultLocale;

  const sourceFor: Record<LocaleCode, LocaleCode> = {};
  for (const target of newLocales) {
    const candidates = form.locales.filter((l) => l.langSubtag.toLowerCase() === target.langSubtag.toLowerCase());
    const preferred = candidates.find((l) => l.code === oldDefaultLocale) ?? candidates[0];
    sourceFor[target.code] = preferred?.code ?? oldDefaultLocale;
  }

  const text = (map: Record<LocaleCode, string>) => {
    const next: Record<LocaleCode, string> = {};
    for (const target of newLocales) {
      const value = map[sourceFor[target.code]];
      if (value !== undefined) next[target.code] = value;
    }
    return next;
  };
  const obj = <T extends object>(map: Record<LocaleCode, T>) => {
    const next: Record<LocaleCode, T> = {};
    for (const target of newLocales) {
      const value = map[sourceFor[target.code]];
      if (value !== undefined) next[target.code] = value;
    }
    return next;
  };

  const next = applyLocaleFieldTransform(form, text, obj);
  next.meta.defaultLocale = newDefaultLocale;
  next.locales = newLocales;

  if (next.fields.mobileNumber) {
    const countriesByLocale: Partial<Record<LocaleCode, string[]>> = {};
    for (const l of newLocales) {
      const country = l.code.split("_")[1];
      if (country) countriesByLocale[l.code] = [country];
    }
    const countries = Array.from(new Set(Object.values(countriesByLocale).flat() as string[]));
    if (countries.length > 0) {
      next.fields.mobileNumber = { ...next.fields.mobileNumber, countries, countriesByLocale };
    } else {
      next.fields.mobileNumber = { ...next.fields.mobileNumber, countriesByLocale: undefined };
    }
  }

  return next;
}
