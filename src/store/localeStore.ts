import { create } from "zustand";
import type { LocaleCode } from "../schema";

interface LocaleStore {
  previewLocale: LocaleCode;
  setPreviewLocale: (locale: LocaleCode) => void;
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  previewLocale: "en",
  setPreviewLocale: (locale) => set({ previewLocale: locale }),
}));
