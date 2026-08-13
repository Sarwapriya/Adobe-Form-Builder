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
export declare function migrateDefaultLocale(form: FormDefinition, newDefaultLocale: LocaleCode, options?: MigrateDefaultLocaleOptions): FormDefinition;
