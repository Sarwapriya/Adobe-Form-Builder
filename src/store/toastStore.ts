import { create } from "zustand";

export type ToastSeverity = "success" | "error" | "warning" | "info";

interface ToastState {
  open: boolean;
  message: string;
  severity: ToastSeverity;
  show: (message: string, severity?: ToastSeverity) => void;
  close: () => void;
}

/** Global toast/snackbar queue — one message visible at a time, bottom-right,
 * auto-dismissing. Replaces the old convention of every page/panel rendering
 * its own inline <Alert> for one-off action feedback (save succeeded, a
 * request failed, etc.); persistent page state (validation issue lists,
 * "this form is locked for review") stays as inline Alerts since a toast
 * that auto-dismisses would lose that context. */
export const useToastStore = create<ToastState>((set) => ({
  open: false,
  message: "",
  severity: "info",
  show: (message, severity = "info") => set({ open: true, message, severity }),
  close: () => set({ open: false }),
}));

export function showToast(message: string, severity: ToastSeverity = "info") {
  useToastStore.getState().show(message, severity);
}
