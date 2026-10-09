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
 * with its own lifecycle, never mounted alongside the builder.
 *
 * Undo/redo is NOT tracked here — CodeMirror's own built-in history (see
 * CodeEditor.tsx) owns that, since it lives inside the editor's own state
 * and already does keystroke-coalescing properly; this store only ever
 * needs the current committed `content` string. */
interface FormFilesState {
  formId: string | null;
  files: GeneratedFileSummary[];
  selectedFileId: string | null;
  content: string;
  originalContent: string;
  loading: boolean;
  loadingContent: boolean;
  saving: boolean;
  error: string | null;

  load: (formId: string) => Promise<void>;
  selectFile: (fileId: string) => Promise<void>;
  setContent: (value: string) => void;
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
      set({ content: formatted, originalContent: formatted, loadingContent: false });
    } catch (err) {
      set({ loadingContent: false, error: err instanceof ApiError ? err.message : "Failed to load file content" });
    }
  },

  setContent(value) {
    set({ content: value });
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
    set((s) => ({ content: s.originalContent }));
  },

  reset() {
    set({ ...initialState });
  },
}));
