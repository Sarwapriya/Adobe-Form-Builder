import { create } from "zustand";
import type { ThemeMode } from "../app/theme";

const STORAGE_KEY = "themeMode";

function readInitialMode(): ThemeMode {
  return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
}

interface ThemeModeState {
  mode: ThemeMode;
  toggleMode: () => void;
}

/** User-facing light/dark toggle (the switch next to "Log out" in
 * AppLayout.tsx, available to both admin and subsidiary users) — persisted
 * to localStorage so a reload keeps the choice, defaulting to dark to match
 * this app's baseline look (see theme.ts). */
export const useThemeModeStore = create<ThemeModeState>((set, get) => ({
  mode: readInitialMode(),
  toggleMode: () => {
    const next: ThemeMode = get().mode === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    set({ mode: next });
  },
}));
