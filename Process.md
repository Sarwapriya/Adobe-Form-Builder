# Process.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm run dev          # start Vite dev server
npm run build         # tsc -b (project references) then vite build
npm run lint          # oxlint
npm run test          # vitest run (single run)
npm run test:watch    # vitest watch mode
npm run preview       # preview a production build
```

Run a single test file: `npx vitest run <path>` (or `npx vitest <path>` to watch just that file).

There are currently no test files in `src/`; Vitest is configured (`vite.config.ts`, jsdom environment, `globals: false` — import `describe`/`it`/`expect` explicitly from `vitest`) but unused so far.

TypeScript is split via project references: `tsconfig.app.json` (src, browser) and `tsconfig.node.json` (Vite config). `npm run build` type-checks both before bundling.

## What this app is

A client-side, no-backend form builder. A user drags fields onto a canvas, edits their properties, previews the live form, and can either export/import the design as JSON or generate a standalone static HTML/CSS/JS "solution" (zip) that runs with zero framework and zero build step in a browser.

## Core data flow

Everything revolves around one serializable model, `FormDefinition` (`src/schema/formDefinition.ts`), validated at the boundary by a parallel Zod schema (`src/schema/formDefinitionZod.ts`) — the two are hand-kept in sync (no `z.infer` codegen), so a change to one field shape needs matching edits in both files.

- `src/store/formStore.ts` — the single Zustand store holding the working `FormDefinition` (metadata, locales, countries, fields, selection). All mutations (add/remove/reorder/update field, set title/locales, add/update/remove country) go through this store. `exportForm()` is the canonical snapshot used by both JSON export and code generation, so preview, export, and codegen never drift from each other.
- `src/store/localeStore.ts` — separate, tiny store for which locale the *preview pane* is currently showing (independent of the form's own locale list).
- `src/fieldRegistry/` — `FIELD_REGISTRY` is the single source of truth for what each `FieldType` supports (options, placeholder, required, conditions, which validations apply, whether it's "structural" i.e. heading/paragraph with no submitted value). `createDefaultField()` uses it to build a new field when dropped from the palette. UI components (palette, property panel) read this registry instead of hardcoding per-type behavior — when adding a new field type, start here.
- `src/schema/formState.ts` (`computeFieldStates`) — pure function that turns a field's first condition rule into `{visible, enabled, required}` UI state. Only the *first* condition per field is evaluated (conditions is an array in the schema but only index 0 is used) — this is a deliberate current limitation, not a bug.
- `FieldDefinition.group` (`"profile" | "question"`) controls which markup family a field renders as, both in the live preview and in generated output: `"profile"` is a plain label+input; `"question"` gets a heading+subheading and an auto-derived `Q<n>` number (computed from order among question-grouped fields, *not* stored). Option lettering (`A1`, `A2`, ...) for question-grouped radio/checkbox/dropdown fields is similarly derived from array index, never stored.
- `src/schema/country.ts` (`CountryConfig`) — a customizable country/locale database (name, ISO code, calling code, supported languages), edited via `src/components/countries/CountryManagerPanel.tsx` and stored on `FormDefinition.countries`. It powers the `"phone"` field type's calling-code dropdown and — via `src/codegen/localeIdentifier.ts` (`resolveLocaleIdentifier`) — the combined locale identifiers (e.g. `en_AE`) used for the generated form's `<html lang>` and `STRINGS` table keys. Falls back to the bare language code when no matching country is configured.

## Localization model

Text fields are never plain strings — they're `LocalizedText = Partial<Record<LocaleCode, string>>` (`src/schema/locale.ts`), keyed by `en | ar | he | ku` (ar/he/ku are RTL). `resolveLocalizedText(text, locale, defaultLocale)` resolves with fallback to the form's default locale, then `""`. Any new user-facing text field on `FieldDefinition`/`FormMetadata` should be `LocalizedText`, not `string`.

## The dual-runtime trick (important when touching schema/conditions.ts, schema/validations.ts, or codegen/)

`evaluateCondition` (`src/schema/conditions.ts`) and `evaluateValidation` (`src/schema/validations.ts`) are written as plain, dependency-free functions on purpose. Two consumers share them:

1. The React preview (`PreviewPane`, `formState.ts`) imports and calls them directly.
2. `codegen/js/buildFormJs.ts` embeds their **actual runtime source** via `fn.toString()` into the generated `form.js`, so the exact same compiled logic runs in the framework-free output — not a hand-ported copy that could drift.

Because of this, these two functions must stay pure and self-contained (no closures over outside state, no imports of anything non-trivial) or the embedded `.toString()` output will break or silently diverge from the React preview.

## Codegen pipeline (`src/codegen/`)

`generateSolution(form)` (`generate.ts`) is a pure function: `FormDefinition` in, four `GeneratedFile`s out (`index.html`, `css/style.css`, `js/app.js`, `js/form.js`). No DOM/download side effects live here — that's `zipAndDownload.ts` (uses `fflate` to zip, then `utils/download.ts` to trigger a browser download), called only from the Toolbar's "Generate Form" button.

The generated markup/CSS conventions (`.form_text_bx`, `.form_check_module`, `.radio_wrap`, `.star` required-markers, etc.) intentionally follow a specific reference design (a Samsung campaign template, kept locally in `Final_forms_format/` for comparison — not part of the app). Two field families render differently in `buildAppJs.ts`: `group: "profile"` fields go into the `#form-root-profile` (`.form_top_group`) mount as plain label+input; `group: "question"` fields go into `#form-root-questions` (`.form_check_group`) as a numbered `Q<n>` heading+subheading+options module. Deliberately *not* ported from that reference: jQuery/Parsley.js (validation stays the dependency-free vanilla-JS trick below), the CRM submission endpoint, Adobe Analytics/Launch tracking, and the submit-intent popup — those are out of scope for a generic builder.

- `buildStructuralData.ts` strips all per-locale text out of the form, leaving only the locale-agnostic shape (field types, names, order, group, derived `questionNumber`, validation/condition params, `countries`) embedded as `FORM_DEFINITION` in `app.js`.
- `buildStrings.ts` builds a separate per-locale string table (`STRINGS`) keyed by generated keys like `field_<id>_label`, now indexed by the *combined* locale identifier (see `localeIdentifier.ts` below) rather than the bare language code; `app.js`'s `t(locale, key)` looks strings up here at runtime, with fallback to the default locale. Display text and structure are deliberately separate so switching the generated form's language is just a re-render, not a re-fetch.
- `localeIdentifier.ts` (`resolveLocaleIdentifier`) combines a language code with a matching `CountryConfig` (e.g. `"en"` + country `AE` → `"en_AE"`); used by `buildStrings.ts`, `buildStructuralData.ts` (`defaultLocale`), and `buildAppJs.ts` (`LOCALES`) so the identifier is consistent everywhere it's threaded through. Falls back to the bare code when no country is configured — existing forms without countries are unaffected.
- `buildIndexHtml.ts` / `buildStyleCss.ts` / `buildAppJs.ts` / `buildFormJs.ts` each own one output file. `buildStyleCss.ts` has no external font/image/CDN dependencies (the reference's custom fonts and PNG-based checkbox art were replaced with system fonts and CSS-only equivalents like `accent-color`) and still uses logical properties (`margin-inline-start`, `text-align: start`) for zero-CSS-change RTL.
- Generated JS is vanilla ES5-style (`var`, function expressions) and framework-free — it must run standalone in the exported zip with no build step and no bundler. The `"phone"` field type renders as a compound calling-code `<select>` (populated from `FORM_DEFINITION.countries`, id `field-<id>-calling`) + number `<input>` (id `field-<id>`, the one that participates in `formDefinition.fields` name-based lookups and validation); `buildFormJs.ts`'s `getValues`/`setValues` special-case it to also preserve the calling-code selection across a locale switch.

When changing `FormDefinition` shape, check whether `buildStructuralData.ts` and `buildStrings.ts` need matching updates — they're a manual projection of the schema, not derived automatically.

## Component layout (`src/components/`)

`AppShell` composes four columns: `palette` (drag source + locale selector) → `canvas/FieldList` (dnd-kit sortable list, drives `reorderFields`) → `propertyPanel` (edits the selected field via `CommonPropsEditor`/`OptionsEditor`/`ValidationEditor`/`ConditionEditor`, gated per-type by `FIELD_REGISTRY`; `CommonPropsEditor` also owns the profile/question `group` toggle and subheading) → `preview/PreviewPane` (renders + validates the live form using the same `computeFieldStates`/`evaluateValidation` the generated output uses). `jsonIO/` (Save/Load JSON, validated on import via `formDefinitionSchema.safeParse`) and `countries/CountryManagerPanel.tsx` (opened from a Toolbar button as a modal overlay) live in the Toolbar.
