import { create } from "zustand";
import {
  getGeneratedFileContent,
  listGeneratedFiles,
  updateGeneratedFileContent,
  type GeneratedFileSummary,
} from "../api/formBuilderApi";
import { ApiError } from "../api/apiClient";
import { formatGeneratedFileContent } from "./formatGeneratedFile";

/** Backs the Edit Files window (FormFilesEditorPage.tsx) — a form's
 * published generated files (html/js/css/data-js), viewed and hand-edited
 * one at a time. Deliberately its own small store rather than folding into
 * the already-large formBuilderStore: this page is a separate browser tab
 * with its own lifecycle, never mounted alongside the builder. */
/** Rapid keystrokes within this window collapse into one undo step (matches
 * how most code editors group typing) — a history entry is only pushed once
 * this long has passed since the previous one, rather than on every
 * keystroke. */
const UNDO_COALESCE_MS = 600;

interface FormFilesState {
  formId: string | null;
  files: GeneratedFileSummary[];
  selectedFileId: string | null;
  content: string;
  originalContent: string;
  /** Past states, oldest first — `undo()` pops the last one. Cleared on
   * every file switch (not on save, so undo/redo still works right after
   * saving). */
  history: string[];
  /** States undone past, most-recently-undone last — `redo()` pops the
   * last one; cleared by any new edit (standard undo-stack behavior). */
  future: string[];
  lastEditAt: number;
  loading: boolean;
  loadingContent: boolean;
  saving: boolean;
  error: string | null;

  load: (formId: string) => Promise<void>;
  selectFile: (fileId: string) => Promise<void>;
  setContent: (value: string) => void;
  undo: () => void;
  redo: () => void;
  save: () => Promise<boolean>;
  discard: () => void;
  reset: () => void;
}

const initialState = {
  formId: null,
  files: [],
  selectedFileId: null,
  content: "",
  originalContent: "",
  history: [],
  future: [],
  lastEditAt: 0,
  loading: false,
  loadingContent: false,
  saving: false,
  error: null,
} satisfies Partial<FormFilesState>;

export const useFormFilesStore = create<FormFilesState>((set, get) => ({
  ...initialState,

  async load(formId) {
    set({ ...initialState, formId, loading: true });
    try {
      const files = await listGeneratedFiles(formId);
      set({ files, loading: false });
      if (files.length > 0) await get().selectFile(files[0].id);
    } catch (err) {
      set({ loading: false, error: err instanceof ApiError ? err.message : "Failed to load generated files" });
    }
  },

  async selectFile(fileId) {
    const { formId } = get();
    if (!formId) return;
    set({ selectedFileId: fileId, loadingContent: true, error: null });
    try {
      const file = await getGeneratedFileContent(formId, fileId);
      // Stale response from a since-abandoned selection — ignore it.
      if (get().selectedFileId !== fileId) return;
      const formatted = formatGeneratedFileContent(file.content, file.fileType);
      set({ content: formatted, originalContent: formatted, history: [], future: [], loadingContent: false });
    } catch (err) {
      set({ loadingContent: false, error: err instanceof ApiError ? err.message : "Failed to load file content" });
    }
  },

  setContent(value) {
    const { content, history, lastEditAt } = get();
    const now = Date.now();
    const coalescing = now - lastEditAt < UNDO_COALESCE_MS;
    set({
      content: value,
      history: coalescing ? history : [...history, content],
      future: [],
      lastEditAt: now,
    });
  },

  undo() {
    const { content, history, future } = get();
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    set({
      content: previous,
      history: history.slice(0, -1),
      future: [...future, content],
      lastEditAt: 0, // next keystroke always starts a fresh history entry, never coalesces into the undone edit
    });
  },

  redo() {
    const { content, history, future } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    set({
      content: next,
      history: [...history, content],
      future: future.slice(0, -1),
      lastEditAt: 0,
    });
  },

  async save() {
    const { formId, selectedFileId, content } = get();
    if (!formId || !selectedFileId) return false;
    set({ saving: true, error: null });
    try {
      const updated = await updateGeneratedFileContent(formId, selectedFileId, content);
      set((s) => ({
        saving: false,
        originalContent: content,
        files: s.files.map((f) => (f.id === selectedFileId ? { ...f, editedAt: updated.editedAt, editedByUserId: updated.editedByUserId } : f)),
      }));
      return true;
    } catch (err) {
      set({ saving: false, error: err instanceof ApiError ? err.message : "Save failed" });
      return false;
    }
  },

  discard() {
    set((s) => ({ content: s.originalContent, history: [], future: [] }));
  },

  reset() {
    set({ ...initialState });
  },
}));
