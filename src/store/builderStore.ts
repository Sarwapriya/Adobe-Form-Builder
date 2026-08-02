import { create } from "zustand";
import { defaultBuilderConfig, type BuilderConfig } from "../codegen/types.ts";
import { isSupportedExcelFile, parseWorkbook } from "../excel/parser.ts";
import { mapWorkbook, type MapResult } from "../excel/mapper.ts";
import { validateWorkbook } from "../excel/validator.ts";
import type { Issue, ValidationResult } from "../excel/types.ts";
import type { LocaleCode } from "../form/formDefinition.ts";

export type WizardStep = "upload" | "preview" | "configure" | "generate";

interface BuilderState {
  fileName: string | null;
  mapResult: MapResult | null;
  validation: ValidationResult | null;
  previewLocale: LocaleCode | null;
  config: BuilderConfig;
  step: WizardStep;
  loadError: string | null;

  loadWorkbook: (file: File) => Promise<void>;
  setPreviewLocale: (locale: LocaleCode) => void;
  setConfig: (patch: Partial<BuilderConfig>) => void;
  setStep: (step: WizardStep) => void;
  reset: () => void;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  fileName: null,
  mapResult: null,
  validation: null,
  previewLocale: null,
  config: defaultBuilderConfig(),
  step: "upload",
  loadError: null,

  async loadWorkbook(file: File) {
    if (!isSupportedExcelFile(file.name)) {
      set({
        loadError: `"${file.name}" is not a .xlsx or .xls file.`,
        fileName: null,
        mapResult: null,
        validation: null,
      });
      return;
    }

    const buffer = await file.arrayBuffer();
    const parsed = parseWorkbook(buffer, file.name);
    const mapResult = mapWorkbook(parsed);
    const validation = validateWorkbook(mapResult, parsed.issues);

    const parserFileError: Issue | undefined = parsed.issues.find(
      (i) => i.severity === "error" && i.sheet === "",
    );

    set({
      fileName: file.name,
      mapResult,
      validation,
      previewLocale: mapResult.form.meta.defaultLocale,
      step: "preview",
      loadError: parserFileError ? parserFileError.message : null,
    });
  },

  setPreviewLocale(locale) {
    set({ previewLocale: locale });
  },

  setConfig(patch) {
    set({ config: { ...get().config, ...patch } });
  },

  setStep(step) {
    set({ step });
  },

  reset() {
    set({
      fileName: null,
      mapResult: null,
      validation: null,
      previewLocale: null,
      config: defaultBuilderConfig(),
      step: "upload",
      loadError: null,
    });
  },
}));
